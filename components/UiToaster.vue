<!--
  UiToaster: the place where toasts appear. Put it once at the app root (its root component or a
  layout), beside UiConfirm.

  Root. Never put it in a page or a component: every `useToast()` call anywhere lands in this one
  stack, and a second toaster in the same app warns in dev. Without a toaster, a toast is queued and
  never seen, and dev says so once. It stands at the end of the `body`, or where
  `createGrani({ teleport })` says.

  Placement. By default it stands at the bottom start of the screen (`placement`: `bottom-start`,
  `bottom`, `bottom-end`; start and end follow the reading direction), clear of the safe area. On a
  phone it stands at the top, where it covers no pinned footer and no Save button. The newest toast
  is in front, and up to three are shown; older ones peek behind it, smaller and as tall as it, so
  a short one never hides behind a long one nor a long one stands over a short one as an empty
  frame, and wait with their timers paused until there is room. Under the pointer or the focus, the pile opens into a column
  and every timer stops until both have left.

  Over a drawer. The stack stands above every layer and leaves no room for the one under it. On a
  phone, at the top, it covers the drawer's header (its cross and title) while it stays; on a screen
  under 850px wide, at the bottom start, it covers the end of a drawer's footer, its Cancel. It goes
  by itself, by a swipe or with its close button. In a UiAppShell the stack at the bottom start
  stands over the sidebar's `#footer` while it shows: with a control there that is used often (a
  theme switch), set `placement="bottom-end"`.

  Toast. A toast is a row on a card: the glyph of its tone (or its own `icon`; `neutral` has none),
  a title, a detail line, one action and a close button. It closes when its `duration` runs out (5 s,
  7 s for an error, 13 s with an action, time to reach it by `F8`), on the close button, on Escape
  while focused, or on a swipe away from the screen edge it stands at (down, or up on a phone) or
  toward its side. Its action runs once. A long line wraps; a long detail is cut at three lines. A toast never holds what the page needs to go on: that is a dialog
  or inline text.

  Again. The same toast shown again while one stands, shown or waiting (the same title, detail, tone,
  glyph and `announce`, no action), is that one card: it comes to the front with its whole time again,
  and its id is returned. Five presses of Copy are one "Copied", not a pile of five. A toast with an
  action is always new: two Undo buttons undo two things.

  Keyboard.
  - `F8`: from anywhere on the page, with a window open or not, moves the focus to the newest
    toast's action (its close button when it has none); `F8` again goes back.
  - `Tab`: reaches a toast's action and its close button.
  - `Escape`: on a focused toast, closes it.
  When a toast closes with the focus in it (Escape, its close button, its action), the focus goes
  back to where it came from. Focus in the stack opens the pile and pauses every timer until it
  leaves; a toast beyond the three shown is `inert` until it moves up. The swipe is for a pointer;
  the keyboard closes a toast with the button or Escape.

  The key. F8 is a function key no browser uses for itself, and the key a toast region is commonly
  reached by. F6 is the browser's own walk between its panes, and a letter with Alt or Ctrl+Alt
  types text on some keyboards. The region's name includes the key, so a screen reader user hears
  how to get in. The toaster stands above every layer, and an open window's focus trap lets the
  focus into it.

  Reader.
  - Live regions: two stand on the page before any toast arrives.
  - Error: with `priority: 'high'`, an alert, read at once.
  - Other toasts: a status, read at a pause.
  - Content: each is read with its title and detail.
  - Several: toasts that come together are read one after another in the order they came.
  - Again: the same toast shown again while it stands is read once more.
  - Silent: `announce: false` is not read (for a control that has already said it).
  - Stack: a region named "Notifications (F8)".
  - Close button: each is named "Close" and the toast's title.
  - Action: its label, described by the toast's title, so F8 landing on it says what it acts on.
  - Glyph: hidden.

  States. One toast per tone (`neutral` without a glyph, `success`, `danger`, `warning`, `info`); a
  glyph of its own; loading from `promise`, then a new toast with its outcome; with an action; open until closed
  (`persistent`); the same toast again, one card; long text wrapping and a detail cut at three lines; a pile of three with older
  ones peeking behind, opened under the pointer or the focus; placed at the start, the center or the
  end of the bottom edge, and at the top on a phone.

  Not for.
  - What the page needs to go on: UiModal or inline text.
  - A question: UiConfirm.
  - A field's validation: stays by the field in UiField.
  - A load that failed: UiNoData `tone="danger"` with Retry, inline.
-->
<template>
  <Teleport :to="teleport">
    <!-- On the page before any toast: a region inserted with its text is often not read. -->
    <div class="sr-only" role="status" aria-atomic="true">{{ said.low }}</div>
    <div class="sr-only" role="alert" aria-atomic="true">{{ said.high }}</div>
    <div
      v-if="stack.length"
      ref="viewportRef"
      role="region"
      :aria-label="t('grani.toast.region', { key: HOTKEY })"
      class="fixed z-toast w-[calc(100%-2rem)] max-w-sm outline-hidden"
      :class="[
        PLACEMENT[placement],
        atTop
          ? 'top-[max(1rem,env(safe-area-inset-top))]'
          : 'bottom-[max(1rem,env(safe-area-inset-bottom))]',
      ]"
      :style="{ height: `${viewportHeight}px` }"
      @pointerenter="hover(true)"
      @pointerleave="hover(false)"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
    >
      <TransitionGroup
        enter-from-class="ui-toast-enter-from"
        enter-active-class="ui-toast-enter-active"
        leave-to-class="ui-toast-leave-to"
        leave-active-class="ui-toast-leave-active"
      >
        <div
          v-for="(item, index) in stack"
          :key="item.id"
          :data-id="item.id"
          :data-index="index"
          :data-expanded="expanded || undefined"
          :data-limited="index >= TOAST_LIMIT || undefined"
          :inert="index >= TOAST_LIMIT"
          class="absolute end-0 w-full [touch-action:none]"
          :class="[
            atTop ? 'top-0' : 'bottom-0',
            index >= TOAST_LIMIT ? 'pointer-events-none opacity-0' : '',
          ]"
          :style="{ zIndex: String(100 - index) }"
          @pointerdown="onSwipeStart(item.id, $event)"
          @pointermove="onSwipeMove(item.id, $event)"
          @pointerup="onSwipeEnd(item.id, $event)"
          @pointercancel="onSwipeEnd(item.id, $event)"
          @keydown.esc.stop="onEscape(item.id)"
        >
          <!-- The pile moves this inner card, not the keyed one: TransitionGroup resets the inline transform of the elements it moves. -->
          <div
            class="relative overflow-hidden rounded-overlay border border-border bg-surface shadow-lg transition-[transform,height] duration-normal ease-standard motion-reduce:transition-none"
            :class="[TONE_EDGE[item.tone ?? 'neutral'], atTop ? 'origin-top' : 'origin-bottom']"
            :style="pileStyle(index, item.id)"
          >
            <!-- The time an action has left: a haze over the whole stay, still while the clocks hold. -->
            <span
              v-if="counts(item) && !reduced"
              :key="hazeKey(item)"
              data-toast-time
              aria-hidden="true"
              class="ui-toast-time pointer-events-none absolute inset-0 bg-neutral-subtle"
              :style="{
                animationDuration: `${item.duration}ms`,
                animationDelay: `-${startOf(item)}ms`,
                animationPlayState: held || index >= TOAST_LIMIT ? 'paused' : 'running',
              }"
            />
            <UiListItem
              size="sm"
              data-toast-body
              class="relative transition-opacity duration-fast"
              :class="index > 0 && !expanded ? 'opacity-0' : ''"
            >
              <template v-if="item.loading || glyphOf(item)" #media>
                <UiSpinner v-if="item.loading" class="text-fg-muted" />
                <component
                  :is="glyphOf(item)"
                  v-else
                  aria-hidden="true"
                  :class="TONE_GLYPH_INK[item.tone ?? 'neutral']"
                />
              </template>
              <p :id="`${uid}-${item.id}`" class="break-words text-sm/5.5 font-medium text-fg">
                {{ item.title }}
              </p>
              <p v-if="item.description" class="line-clamp-3 break-words text-xs/4.5 text-fg-muted">
                {{ item.description }}
              </p>
              <template #actions>
                <!-- Under reduced motion the haze stands still: the seconds left say the time instead. -->
                <span
                  v-if="counts(item) && reduced"
                  data-toast-seconds
                  aria-hidden="true"
                  class="text-xs/4.5 tabular-nums text-fg-muted"
                  >{{ secondsLeft(item) }}</span
                >
                <!-- Reached by F8 alone, the button is read with its toast's title. -->
                <UiButton
                  v-if="item.action"
                  size="xs"
                  variant="outline"
                  :aria-describedby="`${uid}-${item.id}`"
                  @click="onAction(item, $event)"
                >
                  {{ item.action.label }}
                </UiButton>
                <UiIconButton
                  size="xs"
                  variant="ghost"
                  :icon="X"
                  :ariaLabel="t('grani.toast.close', { title: item.title })"
                  @click="onClose(item.id, $event)"
                />
              </template>
            </UiListItem>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  useId,
  watch,
  type Component,
} from 'vue'
import { X } from '@lucide/vue'
import { createAnnouncer } from '../utils/announce'
import { TONE_EDGE, TONE_GLYPH, TONE_GLYPH_INK } from '../utils/toneGlyph'
import { tabbables } from '../composables/useFocusTrap'
import { useOverlayStack } from '../composables/useOverlayStack'
import { renderedHost, useHosts, useTeleport } from '../composables/useShared'
import { TOAST_LIMIT, TOAST_MAX_WAIT, useToastHost, type Toast } from '../composables/useToast'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiSpinner from './UiSpinner.vue'
import UiListItem from './UiListItem.vue'

const props = withDefaults(
  defineProps<{
    /** Where the stack stands on the bottom edge; `start` and `end` follow the reading direction. */
    placement?: 'bottom-start' | 'bottom' | 'bottom-end'
  }>(),
  { placement: 'bottom-start' },
)

const PLACEMENT: Record<NonNullable<typeof props.placement>, string> = {
  'bottom-start': 'start-4',
  bottom: 'inset-x-0 mx-auto',
  'bottom-end': 'end-4',
}
// Only a toast with an action has a reason to show its time: the time to press it.
const counts = (item: Toast) =>
  Boolean(item.action) &&
  typeof item.duration === 'number' &&
  item.duration <= TOAST_MAX_WAIT &&
  !item.loading
const reduced = ref(false)
// A beat a second, while some toast counts under reduced motion, so the seconds left move.
const beat = ref(0)
// How much of its stay a toast has spent, by its clock: where its haze starts. Read once a haze,
// when it appears or starts again after a pause: read on every render (a neighbor closing), it
// would wind the running haze forward.
const hazeKey = (item: Toast) => `${item.id}-${item.duration}-${lap.value}`
const starts = new Map<string, number>()
const startOf = (item: Toast) => {
  const key = hazeKey(item)
  if (!starts.has(key)) {
    for (const k of starts.keys()) if (k.startsWith(`${item.id}-`)) starts.delete(k)
    starts.set(key, spent(item))
  }
  return starts.get(key)!
}
const spent = (item: Toast) =>
  typeof item.duration === 'number'
    ? Math.max(0, item.duration - (left(item.id) ?? item.duration))
    : 0
const secondsLeft = (item: Toast) => {
  void beat.value
  return Math.ceil((left(item.id) ?? 0) / 1000)
}
const glyphOf = (item: Toast): Component | undefined =>
  item.icon ?? TONE_GLYPH[item.tone ?? 'neutral']
// The pile: each toast behind the front one peeks by this much and shrinks by this step.
const PEEK = 12
const SHRINK = 0.05
const GAP = 8
// A swipe past this many pixels closes the toast; short of it, the toast slides back.
const SWIPE_CLOSE = 48

const { t } = useUiT()
const { stack, close, pause, resume, left } = useToastHost()
const teleport = useTeleport()
// The toasters mounted in this app: one is the rule. Counted per app, so two apps on one page
// with a toaster each are both right.
const hosts = useHosts()
// On a server it is rendered, never mounted: counted here, so a toast shown there finds it.
renderedHost(hosts, 'toaster')

const viewportRef = ref<HTMLElement | null>(null)
// The stack stands above every layer: a press in it closes no window, and a window does not pull
// back a focus that went into it, or a toast's Undo would be out of reach of the keyboard.
const overlays = useOverlayStack()
let offTop: (() => void) | null = null
// The pointer and the focus hold the stack each on its own: the pile stays open and the clocks
// stay held while either is on it.
const hovered = ref(false)
const focused = ref(false)
const expanded = computed(() => hovered.value || focused.value)
// A page that cannot be seen (another tab, a window over it) runs no clock: an error would end
// unread. It holds the clocks without opening the pile.
const away = ref(false)
const held = computed(() => expanded.value || away.value)
const onSeen = () => (away.value = document.hidden)
const uid = useId()
// A lap a resume: the haze starts again from the time the clock has left, which a resume may have
// raised to a second, so the two never tell different times.
const lap = ref(0)
watch(held, (on) => {
  if (on) return pause()
  resume()
  lap.value++
})
const hover = (on: boolean) => (hovered.value = on)
const focus = (on: boolean) => (focused.value = on)
function onFocusOut(e: FocusEvent) {
  const to = e.relatedTarget as Node | null
  // The window losing the focus keeps it here: the document's focus has not moved, and it comes
  // back to the same button.
  if (!to && focusInside()) return
  if (viewportRef.value?.contains(to)) return
  focus(false)
  cameFrom = null
}

const HOTKEY = 'F8'
// Where the focus was before it came into the stack: F8 again, Escape, or a toast closing under
// the focus goes back there.
let cameFrom: HTMLElement | null = null
function onFocusIn(e: FocusEvent) {
  const from = e.relatedTarget as HTMLElement | null
  // A focus coming back from another window comes from nowhere: where it came from first stays.
  if (from && !viewportRef.value?.contains(from)) cameFrom = from
  focus(true)
}
const focusInside = () => Boolean(viewportRef.value?.contains(document.activeElement))
function goBack() {
  const to = cameFrom
  cameFrom = null
  if (to && document.contains(to)) to.focus()
  // Nowhere to go: the focus leaves the stack, so its hold on the clocks goes with it.
  else (document.activeElement as HTMLElement | null)?.blur?.()
}
function onHotkey(e: KeyboardEvent) {
  if (e.key !== HOTKEY || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
    return
  const front = stack.value[0]
  const el = front && viewportRef.value?.querySelector<HTMLElement>(`[data-id="${front.id}"]`)
  if (!el) return
  e.preventDefault()
  // A held F8 moves the focus once: its repeats would take it back and forth.
  if (e.repeat) return
  if (focusInside()) return goBack()
  const at = document.activeElement as HTMLElement | null
  tabbables(el)[0]?.focus()
  cameFrom = at && at !== document.body ? at : null
}
/** Closes a toast; one that had the focus gives it back, before it leaves the page and drops it. */
function dismiss(id: number) {
  const had = focusInside()
  close(id)
  if (had) goBack()
}
// A held key that closed a toast goes on repeating where the focus went back: on the next row's
// Delete, or as an Escape to the window under it. Its repeats are dropped until it comes up, or
// until the window loses the focus, after which no keyup of it may come.
const holds = new Map<string, () => void>()
const unholdAll = () => [...holds.values()].forEach((off) => off())
function holdRepeats(key: string) {
  if (holds.has(key)) return
  const drop = (e: KeyboardEvent) => {
    if (e.key !== key || !e.repeat) return
    e.preventDefault()
    e.stopImmediatePropagation()
  }
  const up = (e: KeyboardEvent) => {
    if (e.key === key) holds.get(key)?.()
  }
  window.addEventListener('keydown', drop, true)
  window.addEventListener('keyup', up, true)
  holds.set(key, () => {
    window.removeEventListener('keydown', drop, true)
    window.removeEventListener('keyup', up, true)
    holds.delete(key)
  })
}
// The key held now: a click Enter made is pressed with it down. A click from a script, from a
// screen reader or from Space (which clicks as it comes up) holds nothing.
let down = ''
const onDown = (e: KeyboardEvent) => (down = e.key)
const onUp = (e: KeyboardEvent) => {
  if (e.key === down) down = ''
}
const byEnter = (e: MouseEvent) => e.detail === 0 && down === 'Enter'
function onEscape(id: number) {
  dismiss(id)
  holdRepeats('Escape')
}
function onClose(id: number, e: MouseEvent) {
  dismiss(id)
  if (byEnter(e)) holdRepeats('Enter')
}
// A toast that leaves by itself with the focus in it (a request's loading toast giving way to its
// outcome) gives the focus back too, before it leaves the page and drops it.
watch(
  () => stack.value.map((t) => t.id),
  (ids) => {
    for (const k of starts.keys()) if (!ids.includes(Number(k.split('-')[0]))) starts.delete(k)
    const host = (document.activeElement as HTMLElement | null)?.closest?.('[data-id]')
    if (
      host &&
      viewportRef.value?.contains(host) &&
      !ids.includes(Number(host.getAttribute('data-id')))
    )
      goBack()
  },
  { flush: 'pre' },
)
// A card moved to the front (the same toast again) is moved in the page, which drops the focus in
// it: the element that held it takes it back once the stack is drawn.
let kept: HTMLElement | null = null
watch(
  () => stack.value.map((t) => t.id),
  () => (kept = focusInside() ? (document.activeElement as HTMLElement) : null),
  { flush: 'pre' },
)
watch(
  () => stack.value.map((t) => t.id),
  () => {
    // Only a focus the move dropped: one the app put somewhere in the same render stays there.
    const at = document.activeElement
    if (kept?.isConnected && (!at || at === document.body)) kept.focus()
    kept = null
  },
  { flush: 'post' },
)
// The last toast gone, the stack is gone with whatever held it: no leave or blur will come.
watch(
  () => stack.value.length,
  (n) => {
    if (n) return
    hovered.value = false
    focused.value = false
  },
)

// The seconds left move once a second, and only while a toast shows them.
watch(
  () => reduced.value && stack.value.some(counts),
  (on) => {
    clearInterval(ticking)
    if (on) ticking = setInterval(() => beat.value++, 1000)
  },
)

// On a phone the stack stands at the top: at the bottom it would cover a pinned footer's Save.
const atTop = ref(false)
let narrow: MediaQueryList | undefined
const onNarrow = () => (atTop.value = Boolean(narrow?.matches))
let still: MediaQueryList | undefined
const onStill = () => (reduced.value = Boolean(still?.matches))
let ticking: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  narrow = window.matchMedia?.('(max-width: 639px)')
  onNarrow()
  narrow?.addEventListener?.('change', onNarrow)
  still = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  onStill()
  still?.addEventListener?.('change', onStill)
  // Capture: a window's own keydown handler under the focus never stops the way out.
  document.addEventListener('keydown', onHotkey, true)
  onSeen()
  document.addEventListener('visibilitychange', onSeen)
  window.addEventListener('keydown', onDown, true)
  window.addEventListener('keyup', onUp, true)
  window.addEventListener('blur', unholdAll)
  offTop = overlays.above(() => viewportRef.value)
  // Held by nothing yet: the clocks of toasts shown before it run from here.
  resume()
  hosts.toaster++
  if (isDev() && hosts.toaster > 1)
    console.warn(
      '[grani] UiToaster is mounted twice: every toast would show twice. Keep one at the app root.',
    )
})
onBeforeUnmount(() => {
  narrow?.removeEventListener?.('change', onNarrow)
  still?.removeEventListener?.('change', onStill)
  clearInterval(ticking)
  document.removeEventListener('keydown', onHotkey, true)
  document.removeEventListener('visibilitychange', onSeen)
  window.removeEventListener('keydown', onDown, true)
  window.removeEventListener('keyup', onUp, true)
  window.removeEventListener('blur', unholdAll)
  unholdAll()
  offTop?.()
  hosts.toaster = Math.max(0, hosts.toaster - 1)
  if (held.value) resume()
})

// What a screen reader hears, written into regions that stand on the page before any toast, by the
// library's one announcer: toasts that come together are read in the order they came, each one's
// words emptied first and held a moment before the next, so the reader has picked them up.
const said = reactive({ low: '', high: '' })
const heard = new Map<number, string>()
const reader = createAnnouncer()
// Each change of the stack, and once on mount: a toast shown before the toaster came (an error
// at start, a layout swapped) is read too. Not at setup, which would start timers on a server.
const tell = (items: readonly Toast[]) => {
  // The stack is newest first; the reader hears them oldest first.
  for (const item of [...items].reverse()) {
    if (item.announce === false) continue
    const words = [item.title, item.description].filter(Boolean).join('. ')
    // The same toast shown again while it stands is one card, read once more each time.
    const told = `${item.again ?? 0}|${words}`
    if (heard.get(item.id) === told) continue
    heard.set(item.id, told)
    const slot = item.priority === 'high' ? 'high' : 'low'
    reader.say((text) => (said[slot] = text), words)
  }
  for (const id of heard.keys()) if (!items.some((i) => i.id === id)) heard.delete(id)
}
// Not deep: every change of a toast (`show`, `update`, `close`) gives the stack a new array.
watch(stack, tell)
onMounted(() => tell(stack.value))
onBeforeUnmount(() => reader.stop())

// Heights are measured after every change of the stack, so the open column and the closed
// pile both fit their content; a toast that grows (one changed by `update`) is measured again
// by the observer. A card's own height is its body and its frame: in the closed pile a card
// behind takes the front one's height, which says nothing of its own.
const heights = reactive(new Map<number, number>())
let observer: ResizeObserver | undefined
function measureAll() {
  const nodes = viewportRef.value?.querySelectorAll<HTMLElement>('[data-id]') ?? []
  for (const el of nodes) {
    const card = el.firstElementChild as HTMLElement | null
    const body = card?.querySelector<HTMLElement>('[data-toast-body]')
    const frame = card ? card.offsetHeight - card.clientHeight : 0
    heights.set(Number(el.dataset.id), body ? body.offsetHeight + frame : el.offsetHeight)
  }
  // The toaster lives as long as the app: a closed toast gives its height back.
  for (const id of heights.keys()) if (!stack.value.some((s) => s.id === id)) heights.delete(id)
}
watch(
  stack,
  async () => {
    await nextTick()
    measureAll()
    if (!observer && typeof ResizeObserver !== 'undefined' && viewportRef.value) {
      observer = new ResizeObserver(measureAll)
    }
    if (observer) {
      observer.disconnect()
      viewportRef.value
        ?.querySelectorAll<HTMLElement>('[data-toast-body]')
        .forEach((el) => observer!.observe(el))
    }
  },
  { immediate: true, flush: 'post' },
)
onBeforeUnmount(() => observer?.disconnect())

const visible = computed(() => stack.value.slice(0, TOAST_LIMIT))
const heightOf = (id: number) => heights.get(id) ?? 0
const offsetOf = (index: number) =>
  (expanded.value
    ? visible.value.slice(0, index).reduce((sum, item) => sum + heightOf(item.id) + GAP, 0)
    : index * PEEK) * (atTop.value ? -1 : 1)
const viewportHeight = computed(() => {
  const items = visible.value
  if (!items.length) return 0
  return expanded.value
    ? items.reduce((sum, item) => sum + heightOf(item.id), 0) + GAP * (items.length - 1)
    : heightOf(items[0]!.id) + PEEK * (items.length - 1)
})

const swipe = reactive(new Map<number, { x: number; y: number; dx: number; dy: number }>())
// In the closed pile a card behind is as tall as the front one, whatever it holds: a short one
// would hide behind a long one, a long one would stand over a short one as an empty frame. Every
// measured card is given its height in pixels, so opening the pile or a new front one grows and
// shrinks the cards with the motion rather than at its start; one not measured yet keeps its own.
const frontHeight = computed(() => (stack.value[0] ? heightOf(stack.value[0].id) : 0))
function pileStyle(index: number, id: number) {
  const s = swipe.get(id)
  const scale = expanded.value ? 1 : Math.max(0, 1 - index * SHRINK)
  const dx = s?.dx ?? 0
  const dy = s?.dy ?? 0
  const tall = !expanded.value && index > 0 ? frontHeight.value : heightOf(id)
  return {
    transform: `translate(${dx}px, ${-offsetOf(index) + dy}px) scale(${scale})`,
    height: tall ? `${tall}px` : undefined,
    transition: s ? 'none' : undefined,
  }
}

const INTERACTIVE = 'a[href],button,input,select,textarea,[role="button"]'
/* The action runs once: a second click while the toast fades out, or a held Enter, would undo
   twice. Closed first, so an action that throws does not leave the toast up. */
const ran = new Set<number>()
function onAction(item: Toast, e: MouseEvent) {
  if (ran.has(item.id)) return
  ran.add(item.id)
  // The focus goes back first, so an action that moves it (a restored row) has the last word.
  dismiss(item.id)
  if (byEnter(e)) holdRepeats('Enter')
  item.action?.onClick()
  setTimeout(() => ran.delete(item.id), 1000)
}

function onSwipeStart(id: number, e: PointerEvent) {
  if (e.button !== 0 || (e.target as Element).closest(INTERACTIVE)) return
  swipe.set(id, { x: e.clientX, y: e.clientY, dx: 0, dy: 0 })
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
// Which way is off the screen: toward the edge the stack stands at, in its reading
// direction; a centered stack only goes down.
function edge(): -1 | 0 | 1 {
  if (props.placement === 'bottom') return 0
  const rtl = !!viewportRef.value && getComputedStyle(viewportRef.value).direction === 'rtl'
  return (props.placement === 'bottom-end') !== rtl ? 1 : -1
}
function onSwipeMove(id: number, e: PointerEvent) {
  const s = swipe.get(id)
  if (!s) return
  const dx = e.clientX - s.x
  const way = edge()
  s.dx = way > 0 ? Math.max(0, dx) : way < 0 ? Math.min(0, dx) : 0
  // Off the screen's edge: down at the bottom, up at the top.
  s.dy = atTop.value ? Math.min(0, e.clientY - s.y) : Math.max(0, e.clientY - s.y)
}
function onSwipeEnd(id: number, e: PointerEvent) {
  const s = swipe.get(id)
  if (!s) return
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  swipe.delete(id)
  if (e.type === 'pointercancel') return
  if (Math.abs(s.dx) > SWIPE_CLOSE || Math.abs(s.dy) > SWIPE_CLOSE) dismiss(id)
}
</script>
