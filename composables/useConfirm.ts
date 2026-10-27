import { expectHost, useHosts, useShared } from './useShared'
import { markRaw, type Ref } from 'vue'
import { useToast } from './useToast'
import { useUiT } from './useUiT'
import { isDev } from '../utils/dev'

/** `if (await confirm({ message })) remove()`, answered by one `<UiConfirm />`; a new question answers the open one `false`. */
export interface ConfirmOptions {
  /** The question in a few words; defaults to "Are you sure?". */
  title?: string
  /** What happens, in a sentence: "The order and its payments are removed." */
  message: string
  /** The confirm button's label: the action itself, "Delete", beats "Confirm". */
  confirmLabel?: string
  /** The cancel button's label; defaults to "Cancel". */
  cancelLabel?: string
  /** `danger` for what cannot be undone: the confirm button turns red. */
  tone?: 'brand' | 'danger'
  /** The request the answer sends. The window waits for it (the button loads, a second press sends nothing), then closes; a failure closes into an error toast whose Retry asks again. Every way out is refused while it runs, so give it a timeout of its own: a promise that never settles holds the window. */
  action?: () => Promise<unknown>
  /** The success toast, when the result is not in view (a row left a list below the window); without it the window only closes. */
  success?: string
  /** The error toast's title; defaults to "It did not go through". */
  error?: string
}

/** The open question as UiConfirm reads it. @internal */
export interface ConfirmState extends ConfirmOptions {
  open: boolean
  /** Which question this is: an action's late outcome answers only its own. */
  id?: number
  /** The action is on its way: the window refuses to close. */
  busy?: boolean
}

/**
 * The question and its answer as UiConfirm, the host, drives them: the open question, its answer
 * and the Yes that runs its action. @internal
 */
export function useConfirmHost() {
  const state = useShared<ConfirmState>('grani:confirm', () => ({
    open: false,
    message: '',
  })) as Ref<ConfirmState>
  // The caller's promise waits in the app's store beside the question, not in this module: a
  // second copy of grani asks, the first copy's UiConfirm answers, and a server render keeps
  // each request's own. Raw, so the store does not proxy the function.
  const pending = useShared('grani:confirm-answer', () =>
    markRaw({ resolve: null as ((answer: boolean) => void) | null }),
  ).value
  const hosts = useHosts()

  const settle = (answer: boolean) => {
    const resolve = pending.resolve
    pending.resolve = null
    state.value = { ...state.value, open: false }
    resolve?.(answer)
  }

  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    if (pending.resolve) settle(false)
    const o = typeof options === 'string' ? { message: options } : options
    state.value = { tone: 'brand', ...o, open: true, busy: false, id: (state.value.id ?? 0) + 1 }
    if (isDev())
      expectHost(
        hosts,
        'confirm',
        '[grani] confirm() asked a question, but no <UiConfirm /> is mounted in this app, so it is ' +
          'never shown and never answered. Put one <UiConfirm /> at the app root.',
      )
    return new Promise((resolve) => (pending.resolve = resolve))
  }

  const toast = useToast()
  const { t } = useUiT()
  // Yes: without an action it is the answer; with one, the answer is the request's outcome.
  const accept = async () => {
    const { title, message, confirmLabel, cancelLabel, tone, action, success, error, id } =
      state.value
    // Answered (closed) or busy: a press that reaches the button now sends nothing.
    if (!state.value.open || state.value.busy) return
    if (!action) return settle(true)
    state.value = { ...state.value, busy: true }
    // Answered already (a new question took its place): the outcome is no one's to report, and a
    // Retry would reopen a question that was replaced.
    const own = () => state.value.id === id && state.value.open
    try {
      await action()
      if (!own()) return
      settle(true)
      if (success) toast.success(success)
    } catch {
      if (!own()) return
      settle(false)
      toast.error(error || t('grani.confirm.failed'), {
        action: {
          label: t('grani.confirm.retry'),
          onClick: () =>
            void confirm({
              title,
              message,
              confirmLabel,
              cancelLabel,
              tone,
              action,
              success,
              error,
            }),
        },
      })
    }
  }

  return { state, confirm, settle, accept }
}

/**
 * Asks a question of the person: `if (await confirm({ message })) remove()`. The `<UiConfirm />`
 * mounted once at the app root shows it and answers; a new question answers the open one `false`.
 */
export function useConfirm() {
  const { confirm } = useConfirmHost()
  return { confirm }
}
