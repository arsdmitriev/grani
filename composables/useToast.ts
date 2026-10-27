import { expectHost, useHosts, useShared } from './useShared'
import { useUiT } from './useUiT'
import { isDev } from '../utils/dev'
import { computed, markRaw, readonly, type Component, type Ref } from 'vue'
import type { Tone } from '../types/ui'

/** Meaning of a toast: the outcome of an action; `neutral` is a plain fact with no glyph of its own. */
export type ToastTone = Extract<Tone, 'neutral' | 'success' | 'danger' | 'warning' | 'info'>
/** Milliseconds on screen, or `persistent` until closed. */
export type ToastDuration = number | 'persistent'
/** `high` interrupts the reader at once (an error), `low` waits for a pause. */
export type ToastPriority = 'low' | 'high'

export interface ToastAction {
  /** The button's text: "Undo", "Open". */
  label: string
  /** Runs once, as the toast closes. */
  onClick: () => void
}

export interface ToastOptions {
  /** One line, the fact: "Invoice sent". */
  title: string
  /** A second line with the detail, optional. */
  description?: string
  /** Meaning, and with it the glyph and its color: `neutral` (default), `success`, `danger`, `warning`, `info`. */
  tone?: ToastTone
  /** A Lucide glyph in place of the tone's own; the tone still colors it. */
  icon?: Component
  /** A request in flight: a spinner instead of the glyph; `promise` sets it. */
  loading?: boolean
  /** How long it stays once shown: 5 s by default, 7 s for `danger`, 13 s with an `action`. */
  duration?: ToastDuration
  /** How a screen reader hears it: `high` at once, `low` at a pause; `danger` is `high` by default. */
  priority?: ToastPriority
  /** One button in the toast, "Undo" or "Open"; it never holds what the page needs to work. */
  action?: ToastAction
  /**
   * `false` shows it unread: for an outcome the control has already
   * announced where the focus is (a copy button's own live region).
   */
  announce?: boolean
}

export interface Toast extends ToastOptions {
  id: number
  duration: ToastDuration
  priority: ToastPriority
  /** How many times the same toast came again while it stood; each time it is read again. @internal */
  again?: number
}

/** The three faces of `promise`: a title or full options, the last two maybe from the outcome. */
export interface ToastPromiseMessages<T> {
  loading: string | ToastOptions
  success: string | ToastOptions | ((value: T) => string | ToastOptions)
  error: string | ToastOptions | ((error: unknown) => string | ToastOptions)
}

/** How long a toast stays; an error a little longer, it takes longer to read. @internal */
export const TOAST_DURATION = 5000
/** @internal */
export const TOAST_ERROR_DURATION = 7000
/** A toast with an action stays longer: a person on the keyboard (F8 reaches the toasts) or with a reader needs the time to reach it. @internal */
export const TOAST_ACTION_DURATION = 13000
/** How many toasts stand in the stack; the rest wait in the queue, mounted but hidden. @internal */
export const TOAST_LIMIT = 3
/** How many toasts the queue holds at once, shown and waiting; past it the oldest leaves to make
 * room for a new one, so a loop or a flood of requests on a server cannot grow it forever. @internal */
export const TOAST_QUEUE_LIMIT = 50

const KEY = 'grani:toasts'
const CLOCKS = 'grani:toast-clocks'

/**
 * The clocks of one app's toasts, beside its list in the app's store: a toaster held under the
 * pointer in one app never stops another's. Written on the client only; raw, so the store does
 * not proxy the handles.
 */
interface Clocks {
  // A toast's clock runs only while it is shown (one of the first TOAST_LIMIT) and nothing holds
  // the stack; behind the limit it waits with the time it has left.
  timers: Map<number, { handle: ReturnType<typeof setTimeout> | null; left: number; since: number }>
  /** While the pointer or the focus is on the stack no clock runs, not even one started now. */
  held: boolean
  // The app's own counter, not the module's: a server renders many requests in one process, and
  // its id would otherwise count every toast any of them ever made, read back in `data-id`.
  nextId: number
}

/** The default stay of a toast: an action longest, then an error, then the rest. */
const stayOf = (o: Pick<ToastOptions, 'action' | 'tone'>): number =>
  o.action ? TOAST_ACTION_DURATION : o.tone === 'danger' ? TOAST_ERROR_DURATION : TOAST_DURATION

/** The longest wait a timer holds, 2^31 - 1 ms (about 24 days): a longer stay, `Infinity` too,
 * would fire at once, so such a toast stays until closed. @internal */
export const TOAST_MAX_WAIT = 2 ** 31 - 1
const clocked = (t: Toast): t is Toast & { duration: number } =>
  !t.loading && typeof t.duration === 'number' && t.duration <= TOAST_MAX_WAIT

const asOptions = (value: string | ToastOptions): ToastOptions =>
  typeof value === 'string' ? { title: value } : value

// The queue and the clocks: what an app calls, and the hold UiToaster puts on the clocks.
function toastQueue() {
  const toasts = useShared<Toast[]>(KEY, () => [])
  const clocks = useShared<Clocks>(CLOCKS, () =>
    markRaw({ timers: new Map(), held: false, nextId: 0 }),
  ).value
  const { timers } = clocks
  const hosts = useHosts()

  const stopTimer = (id: number) => {
    const t = timers.get(id)
    if (t?.handle) clearTimeout(t.handle)
    timers.delete(id)
  }

  // Runs the clocks of the toasts in view and holds the rest: called after every change. A toast
  // with a number for its stay and no clock yet gets its whole stay.
  const sync = () => {
    if (typeof window === 'undefined') return
    const shown = new Set(toasts.value.slice(-TOAST_LIMIT).map((t) => t.id))
    for (const toast of toasts.value) {
      if (!clocked(toast)) continue
      let timer = timers.get(toast.id)
      if (!timer) {
        timer = { handle: null, left: toast.duration, since: 0 }
        timers.set(toast.id, timer)
      }
      const run = !clocks.held && shown.has(toast.id)
      if (run && !timer.handle) {
        const id = toast.id
        timer.handle = setTimeout(() => close(id), Math.max(timer.left, 0))
        timer.since = Date.now()
      } else if (!run && timer.handle) {
        clearTimeout(timer.handle)
        timer.left = Math.max(1000, timer.left - (Date.now() - timer.since))
        timer.handle = null
      }
    }
  }

  // With no id every toast closes; an id that is `undefined` (a variable never set) closes none,
  // never the unread errors and the Undo of others.
  function close(...ids: [id?: number]) {
    if (ids.length === 0) {
      toasts.value.forEach((t) => stopTimer(t.id))
      toasts.value = []
      return
    }
    const id = ids[0]
    if (id === undefined) return
    stopTimer(id)
    toasts.value = toasts.value.filter((t) => t.id !== id)
    sync()
  }

  // A component given as the icon goes into the store as it is: made reactive there, a stateful one
  // draws a warning and is walked on every change of the stack.
  const rawIcon = (o: Partial<ToastOptions>) => (o.icon ? { icon: markRaw(o.icon) } : {})

  // The same toast while it stands (the same words, tone, glyph and `announce`, no button, nothing
  // loading) is not stacked again. A toast with an action is always new: two Undo buttons undo two things.
  const twin = (o: ToastOptions): Toast | undefined =>
    o.action || o.loading
      ? undefined
      : toasts.value.find(
          (t) =>
            !t.action &&
            !t.loading &&
            t.title === o.title &&
            (t.description ?? '') === (o.description ?? '') &&
            (t.tone ?? 'neutral') === (o.tone ?? 'neutral') &&
            t.icon === o.icon &&
            (t.announce === false) === (o.announce === false),
        )

  const show = (options: ToastOptions): number => {
    // It comes to the top with its whole stay again, the one it had unless this call names
    // another, and a reader hears it again.
    const same = twin(options)
    if (same) {
      stopTimer(same.id)
      const again: Toast = {
        ...same,
        priority: options.priority ?? same.priority,
        duration: options.duration ?? same.duration,
        again: (same.again ?? 0) + 1,
      }
      toasts.value = [...toasts.value.filter((t) => t.id !== same.id), again]
      sync()
      return same.id
    }
    // Past every id already in the stack; a loop over the
    // queue, not a spread of it into Math.max, which overflows the call stack past about 120,000.
    let id = clocks.nextId
    for (const t of toasts.value) if (t.id > id) id = t.id
    id += 1
    clocks.nextId = id
    const tone = options.tone
    const toast: Toast = {
      ...options,
      ...rawIcon(options),
      id,
      // `??` and not a default before the spread: an option passed as `undefined` is no answer.
      priority: options.priority ?? (tone === 'danger' ? 'high' : 'low'),
      duration: options.duration ?? stayOf(options),
    }
    let next = [...toasts.value, toast]
    if (next.length > TOAST_QUEUE_LIMIT) {
      const dropped = next.slice(0, next.length - TOAST_QUEUE_LIMIT)
      for (const t of dropped) stopTimer(t.id)
      next = next.slice(-TOAST_QUEUE_LIMIT)
    }
    toasts.value = next
    sync()
    if (isDev())
      expectHost(
        hosts,
        'toaster',
        '[grani] A toast was shown, but no <UiToaster /> is mounted in this app, so nobody sees it. ' +
          'Put one <UiToaster /> at the app root.',
      )
    return id
  }

  /** Changes a toast in place; a new duration restarts its clock, a persistent one stays. */
  const update = (id: number, patch: Partial<ToastOptions>) => {
    const current = toasts.value.find((t) => t.id === id)
    if (!current) return
    const next: Toast = { ...current, ...patch, ...rawIcon(patch) }
    next.priority =
      patch.priority ??
      (patch.tone === undefined ? current.priority : patch.tone === 'danger' ? 'high' : 'low')
    // Loading again, it holds no clock until its outcome comes: the one it had would close it.
    if (patch.loading === true) stopTimer(id)
    if (patch.duration !== undefined || patch.tone !== undefined || patch.loading === false) {
      // A toast made to stay until closed stays so; one that was loading takes its outcome's stay.
      const keep = current.duration === 'persistent' && !current.loading
      next.duration = patch.duration ?? (keep ? 'persistent' : stayOf(next))
      stopTimer(id)
    }
    toasts.value = toasts.value.map((t) => (t.id === id ? next : t))
    sync()
  }

  /** Holds every clock while the pointer or the focus is on the stack. */
  const pause = () => {
    clocks.held = true
    sync()
  }
  const resume = () => {
    clocks.held = false
    sync()
  }
  /** Milliseconds a toast has left on screen, while its clock runs or holds; none for one that stays. */
  const left = (id: number): number | undefined => {
    const t = timers.get(id)
    if (!t) return undefined
    return Math.max(0, t.handle ? t.left - (Date.now() - t.since) : t.left)
  }

  const { t } = useUiT()
  const pick = <V>(message: string | ToastOptions | ((v: V) => string | ToastOptions), v: V) =>
    typeof message === 'function' ? message(v) : message
  const said = (
    build: () => string | ToastOptions,
    fallback: 'grani.toast.failed' | 'grani.toast.done',
  ): string | ToastOptions => {
    try {
      return build()
    } catch (error) {
      if (isDev())
        console.error('[grani] useToast().promise: a message threw; the default is shown.', error)
      return t(fallback)
    }
  }

  const withTone =
    (tone: ToastTone) =>
    (title: string, options: Omit<ToastOptions, 'title' | 'tone'> = {}) =>
      show({ ...options, title, tone })

  /**
   * A request as toasts: one loading while it runs, then it leaves and a new one says the outcome,
   * success or error. A new toast arrives where a changed one would only change: the eye catches it.
   * The outcome comes even when the loading toast was closed by hand: an error must still be heard.
   * The promise it returns settles as `p` does: it rejects with `p`'s error once the error toast
   * shows. Catch it (`.catch(() => {})` when the toast is all the app says), or the app's error
   * handler hears the failure a second time.
   */
  const promise = async <T>(p: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T> => {
    const id = show({ ...asOptions(messages.loading), loading: true, duration: 'persistent' })
    // Only the request decides the outcome: a message that throws (`e.response.data` on a network
    // error) says the library's words instead, and the caller still gets the value or the error.
    let value: T
    try {
      value = await p
    } catch (error) {
      close(id)
      const failed = said(() => pick(messages.error, error), 'grani.toast.failed')
      show({ ...asOptions(failed), tone: 'danger' })
      throw error
    }
    close(id)
    show({
      ...asOptions(said(() => pick(messages.success, value), 'grani.toast.done')),
      tone: 'success',
    })
    return value
  }

  const api = {
    /** Every toast in order of arrival, read-only. */
    // Typed by hand: the inferred deep-readonly type spells out every Vue component an `icon` may be.
    toasts: readonly(toasts) as Readonly<Ref<readonly Toast[]>>,
    /** The toasts in the stack, newest first; beyond the limit they wait, their clocks held. */
    stack: computed(() => [...toasts.value].reverse()),
    /** Shows a toast from full options and returns its id. */
    show,
    /** Changes a toast by id in place; a new tone or duration restarts its clock. */
    update,
    /** Closes one toast by id, or all of them with no argument; an id that is `undefined` closes none. */
    close,
    /** A request as toasts: `loading` while it runs, then a new one with `success` or `error`; a message that throws gives way to "Done" or "Could not complete the action". */
    promise,
    /** `success(title, options?)`: a done action, "Invoice sent". */
    success: withTone('success'),
    /** `error(title, options?)`: a failed action, read out at once, a little longer on screen. */
    error: withTone('danger'),
    /** `warning(title, options?)`: done, with something to look at. */
    warning: withTone('warning'),
    /** `info(title, options?)`: a fact worth a glance. */
    info: withTone('info'),
  }
  return { api, pause, resume, left }
}

/**
 * The queue behind UiToaster. Components call `toast.success(...)` and the toaster at the
 * app root shows it. Feedback on an action goes here: a save that failed, a copy that worked;
 * a field's validation stays by the field and a load error stays inline with its retry. The same
 * toast again while one stands, with no action, is that one card, back at the front with its id.
 */
export function useToast() {
  return toastQueue().api
}

/**
 * The queue as UiToaster drives it: `pause` stops every clock under the pointer and the focus,
 * `resume` starts them again, each with at least a second left; `left` says how long one has. @internal
 */
export function useToastHost() {
  const { api, pause, resume, left } = toastQueue()
  return { ...api, pause, resume, left }
}
