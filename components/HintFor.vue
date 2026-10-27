<!--
  HintFor: the hint of UiTooltip, bound to an element it is given, private to the library. UiTooltip
  draws it for its trigger; UiButton, UiIconButton and UiCopyButton load it on demand inside
  themselves for the reason they are off, so the button stays their one root and keeps its focus
  when the reason comes and goes.

  Anchor. The element's own pointer, focus and press events open and close the hint, beside its
  other listeners; a new element takes them over. `late` is for a hint loaded after its element: a
  keyboard focus or a pointer already there shows it at once.

  Keyboard. As UiTooltip: keyboard focus on the anchor shows it, blur hides it, `Escape` hides it
  first and goes no further. The hint takes no focus.

  Reader.
  - Role: a `tooltip`, describing the anchor while shown, unless it repeats the anchor's name or a
    description it has.
  - Tail: hidden.

  States. As UiTooltip: hidden, shown on hover, keyboard focus and a tap, one on the page at a time.

  Not for.
  - Anything but UiTooltip and the reason of a button: it is their part.
-->
<template>
  <Teleport v-if="used" :to="teleport">
    <Transition
      appear
      enter-from-class="ui-popover-enter-from"
      enter-active-class="ui-popover-enter-active"
      leave-to-class="ui-popover-leave-to"
      leave-active-class="ui-popover-leave-active"
    >
      <div
        v-if="shown"
        :id="id"
        ref="panelRef"
        role="tooltip"
        class="fixed z-tooltip max-w-xs break-words rounded-badge bg-fg px-2 py-1 text-xs leading-snug text-fg-inverse shadow-lg outline outline-1 outline-transparent"
        :style="panelStyle"
        @pointerenter="onEnter"
        @pointerleave="onLeave"
      >
        <span class="absolute h-2 w-2 rotate-45 bg-fg" :style="tailStyle" aria-hidden="true" />
        <span class="relative">{{ content }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
// The elements a reason's hint stands on now: a name's hint on the same element steps aside, so
// the button that is off says why, whichever hint was bound first.
const SAYS_WHY = new WeakSet<Element>()
</script>

<script setup lang="ts">
import { useTeleport } from '../composables/useShared'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toValue,
  useId,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { useAnchoredPanel } from '../composables/useAnchoredPanel'
import { useOverlayStack, type Hint } from '../composables/useOverlayStack'
import { joinIds } from '../utils/attrs'

const teleport = useTeleport()
const props = withDefaults(
  defineProps<{
    /** The element the hint describes, or a getter of it; its pointer, focus and press events open and close it. */
    anchor: MaybeRefOrGetter<HTMLElement | null>
    /** The hint. Empty means none. */
    content?: string
    /** Preferred side; it flips when that side has no room. */
    side?: 'top' | 'bottom' | 'left' | 'right'
    /** Mounted after its anchor (loaded on demand): a keyboard focus or a pointer already on the anchor shows it at once. */
    late?: boolean
    /** It says why its anchor is off: it wins over another hint on the same element. */
    reason?: boolean
  }>(),
  { content: '', side: 'top', late: false, reason: false },
)

// Long enough that a pointer crossing a row of icons does not flash every hint.
const OPEN_DELAY = 120
// Time to cross the gap from the trigger onto the tooltip.
const CLOSE_DELAY = 100
// Side of the tail square. Turned 45°, it reaches half its diagonal either way.
const TAIL = 8
const REACH = TAIL * Math.SQRT1_2
const OFFSET = 6

const SIDE = { top: 'above', bottom: 'below', left: 'left', right: 'right' } as const
// A hint closed this long ago leaves the row warm: the next trigger opens at once.
const WARM = 300

const id = `ui-tooltip-${useId()}`
const panelRef = ref<HTMLElement | null>(null)
const shown = ref(false)
// The layer is built the first time the hint shows, not at mount: a table of a thousand rows
// holds a thousand cut cells and dates, and few are ever hovered. `appear` gives the first show
// the same entrance as every later one.
const used = ref(false)
const active = computed(() => props.content.trim().length > 0)

// The anchor's own events drive the hint, beside the listeners the anchor has: a wrapper element
// would be the child a UiButtonGroup joins and rounds. An anchor swapped for another takes the
// listeners with it, and a hint shown on the old one moves to the new, or closes with none.
let rootEl: HTMLElement | null = null
const LISTEN = {
  pointerenter: (e: Event) => onEnter(e as PointerEvent),
  pointerleave: (e: Event) => onLeave(e as PointerEvent),
  focusin: (e: Event) => onFocus(e as FocusEvent),
  focusout: () => onBlur(),
  pointerdown: (e: Event) => onTap(e as PointerEvent),
}
function bind(el: HTMLElement | null, old: HTMLElement | null) {
  if (old && old !== el) {
    for (const [type, fn] of Object.entries(LISTEN)) old.removeEventListener(type, fn)
    if (props.reason) SAYS_WHY.delete(old)
  }
  if (el && props.reason) SAYS_WHY.add(el)
  for (const [type, fn] of Object.entries(LISTEN)) el?.addEventListener(type, fn)
  rootEl = el
  if (shown.value) {
    if (!rootEl) hide()
    else trigger.value = rootEl
  }
}
const trigger = shallowRef<HTMLElement | null>(null)
// Two reasons to stay shown, hover and focus; one channel ending does not end the other.
let hovered = false
let focused = false
// A mouse press puts the hint away: it opens a menu or runs the action, and the hint would sit
// beside what it opened. The focus that press gives is a pointer's, not shown.

// The app's layers keep the hint on the screen (one at a time: a new one puts the last away), when
// the last one closed (the warm row) and whether the last input was a key or a pointer. They also
// route to it first an Escape (it goes no further) and a press outside (it goes on to the window).
const overlays = useOverlayStack()
const hint: Hint = {
  holds: (node) => Boolean(trigger.value?.contains(node) || panelRef.value?.contains(node)),
  hide: () => hide(),
}

let timer: ReturnType<typeof setTimeout> | null = null
function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}
function show() {
  clearTimer()
  if (!active.value || shown.value || !rootEl) return
  if (!props.reason && SAYS_WHY.has(rootEl)) return
  trigger.value = rootEl
  overlays.showHint(hint)
  used.value = true
  shown.value = true
}
function hide() {
  clearTimer()
  if (shown.value) overlays.hideHint(hint)
  shown.value = false
}

// The panel shares these with the trigger, so the pointer may cross onto it.
function onEnter(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  hovered = true
  clearTimer()
  // Warm: a hint closed a moment ago, the pointer is moving along a row: the next opens at once.
  if (!shown.value) {
    if (overlays.hintShown() || Date.now() - overlays.hintClosed() < WARM) show()
    else timer = setTimeout(show, OPEN_DELAY)
  }
}
function onLeave(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  hovered = false
  clearTimer()
  if (shown.value && !focused) timer = setTimeout(hide, CLOSE_DELAY)
}
function onFocus(e: FocusEvent) {
  // A keyboard focus shows the hint and holds it while the pointer leaves; the focus a mouse press
  // gives, or a script gives back after a click (Cancel in a window), does neither.
  focused = isFocusVisible(e.target) || overlays.byKeyboard()
  if (focused) show()
}
function isFocusVisible(el: EventTarget | null) {
  try {
    return el instanceof Element && el.matches(':focus-visible')
  } catch {
    return false
  }
}
function onBlur() {
  focused = false
  if (!hovered) hide()
}
// A press on an anchor that refuses it (off with a reason, not busy) opens and runs nothing: the
// hint is its one answer, so the press shows it, by mouse and by tap, on a menu's trigger too.
const refuses = () =>
  rootEl?.getAttribute('aria-disabled') === 'true' && rootEl.getAttribute('aria-busy') !== 'true'
// Touch and pen have no hover: a tap toggles. A mouse press is left to hover.
function onTap(e: PointerEvent) {
  if (refuses() && e.pointerType !== '') {
    if (e.pointerType === 'mouse') hovered = true
    return show()
  }
  if (e.pointerType === 'mouse') {
    // A loading button turns the pointer off: no leave may come after this press.
    hovered = false
    return hide()
  }
  if (e.pointerType === '') return
  // A tap on a button that opens something opens it; the hint would sit beside what it opened.
  if (rootEl?.closest('[aria-haspopup]')) return hide()
  if (shown.value) hide()
  else show()
}

const { rect, panelStyle } = useAnchoredPanel({
  open: shown,
  trigger,
  panel: panelRef,
  close: hide,
  layer: false,
  geometry: () => ({ prefer: SIDE[props.side], align: 'center', offset: OFFSET }),
})

// The tail sits on the trigger's center, on the straight run of the edge: on a corner's
// curve its sides stick out past the panel. A one-line hint is 24px tall, so on the left
// and right the run is only there with a small radius, hence `rounded-badge`, not `-overlay`.
const tailStyle = computed((): Record<string, string> => {
  const r = rect.value
  const t = trigger.value?.getBoundingClientRect()
  const p = panelRef.value
  if (!r || !t || !p) return { display: 'none' }
  const half = `${-TAIL / 2}px`
  const radius = parseFloat(getComputedStyle(p).borderTopLeftRadius) || 0
  const along = (centre: number, size: number) => {
    const lo = radius + REACH
    const hi = size - radius - REACH
    const at = lo > hi ? size / 2 : Math.max(lo, Math.min(centre, hi))
    return `${at - TAIL / 2}px`
  }
  if (r.placement === 'above' || r.placement === 'below') {
    const left = along(t.left + t.width / 2 - r.left, p.offsetWidth)
    return r.placement === 'above' ? { left, bottom: half } : { left, top: half }
  }
  const top = along(t.top + t.height / 2 - r.top, p.offsetHeight)
  return r.placement === 'left' ? { top, right: half } : { top, left: half }
})

// The caller's own description stays, including one it changes while the tooltip is open:
// on close only our id leaves the list.
let described: HTMLElement | null = null
function describe() {
  const el = trigger.value
  const words = props.content.trim()
  // A hint that repeats the trigger's own name (an icon button) is read once, as the name, and
  // one that repeats a description it has (a disabled button's reason) once, as the description.
  const repeats = (el?.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .some((id) => id && document.getElementById(id)?.textContent?.trim() === words)
  if (!el || el.getAttribute('aria-label')?.trim() === words || repeats) return
  described = el
  el.setAttribute('aria-describedby', joinIds(el.getAttribute('aria-describedby'), id)!)
}
function undescribe() {
  if (!described) return
  const rest = (described.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((v) => v && v !== id)
  if (rest.length) described.setAttribute('aria-describedby', rest.join(' '))
  else described.removeAttribute('aria-describedby')
  described = null
}

// Read through a getter, the anchor a parent sets in a ref is bound the moment it is set: a pointer
// that arrives before the next render still finds the listeners.
const anchorEl = () => toValue(props.anchor)
watch(anchorEl, (el) => bind(el, rootEl), { flush: 'sync' })
onMounted(() => {
  bind(anchorEl(), rootEl)
  // Loaded after the anchor, it may have missed the focus or the hover that should show it.
  const el = rootEl
  if (!props.late || !el) return
  if (isFocusVisible(el) || (el.contains(document.activeElement) && overlays.byKeyboard())) {
    focused = true
    show()
  } else if (el.matches(':hover')) {
    hovered = true
    show()
  }
})

watch(shown, (v) => (v ? describe() : undescribe()))
// A reason that comes while the keyboard is on the button shows at once: the person sees why it
// greyed out without leaving it.
watch(active, (v) => {
  if (!v) hide()
  else if (focused) show()
})

onBeforeUnmount(() => {
  bind(null, rootEl)
  hide()
  undescribe()
})
</script>
