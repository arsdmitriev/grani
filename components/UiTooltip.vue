<!--
  UiTooltip: a short text hint beside its trigger. Take it for detail a dense row has no room for.

  Showing. It shows on hover and on keyboard focus, but not when a script gives the focus back after
  a click. When the pointer moves from one trigger to the next, the next hint opens at once. A tap
  shows it on a trigger that only shows something (a cut text, a date); a tap on a button that opens
  something only opens it. A press outside hides the hint and still reaches the window under it. A
  long word wraps inside it.

  Content. Text only. It is never the only place for what must be read by a person who cannot
  reach it: a natively disabled button takes no focus, so its reason is visible text beside it;
  UiButton and UiIconButton with `disabledReason` keep the focus and say their reason in one.

  Trigger. Attributes and listeners set on the tooltip reach the trigger along with the trigger's
  own, so it can stand inside a popover's or a menu's `#trigger`. The trigger is one element or a
  single-root component (not a fragment, not another tooltip) and should be focusable (a static
  badge takes `tabindex="0"`). When the panel is pushed aside, its tail stays on the trigger; a
  trigger that goes away takes the hint with it. The pointer may cross onto the tooltip (WCAG
  1.4.13).

  Placement. UiTruncate and UiDateCell stand on it; UiButton and UiIconButton draw the same hint
  for the reason they are off. It names an icon button where a sighted user needs the name (the
  sidebar's toggle, a table's columns).

  Keyboard.
  Keyboard focus on the trigger shows it at once, and blur hides it; a focus a script gives back
  after a click does not show it.
  - `Escape`: hides it first and goes no further, so a window under it stays until the next
    `Escape`.
  The hint itself takes no focus and holds nothing focusable.

  Reader.
  - Role: a `tooltip`.
  - Description: while shown, it describes the trigger (`aria-describedby`), next to any
    description you set; with no `content` there is none.
  - Repeated words: a hint that repeats the trigger's own name (an icon button's `ariaLabel`) or a
    description it already has (a disabled button's reason) is not wired, so the words are read
    once.
  - Tail: hidden.

  States. Hidden; shown after a short delay on hover, at once on keyboard focus, on a tap on a touch
  screen, and at once when the pointer moves from one trigger to the next. On one of four sides
  (`side`), flipped when that side has no room, and pushed aside at the screen edge with the tail
  kept on the trigger; a `left` or `right` hint with room on neither side goes below or above, never
  over its trigger. Long text and a long word wrap. One hint on the page at a time.

  Not for.
  - A hint with a link or a control: UiPopover.
  - The reason a button is off: UiButton or UiIconButton `disabledReason`, which keeps the focus
    and says it; for a button natively `disabled`, visible text beside it.
  - A cut value in a cell: UiTruncate, built on it.
  - A date: UiDateCell, built on it.
-->
<template>
  <Trigger />
  <HintFor :anchor="() => rootEl" :content="content" :side="side" />
</template>

<script setup lang="ts">
import {
  cloneVNode,
  Comment,
  mergeProps,
  shallowRef,
  useAttrs,
  useSlots,
  type ComponentPublicInstance,
} from 'vue'
import { isDev } from '../utils/dev'
import HintFor from './HintFor.vue'

withDefaults(
  defineProps<{
    /** The hint. Empty or absent means no tooltip. */
    content?: string
    /** Preferred side; it flips when that side has no room, and a side hint with room on neither side goes below or above. */
    side?: 'top' | 'bottom' | 'left' | 'right'
  }>(),
  { content: '', side: 'top' },
)

defineOptions({ inheritAttrs: false })

defineSlots<{
  /** The trigger: one element or a single-root component the hint describes. It should be focusable. */
  default(props: Record<string, never>): unknown
}>()

const slots = useSlots()
// The element comes back through a ref on every render, so a slot that swaps its root (a
// placeholder for the control) is followed.
const rootEl = shallowRef<HTMLElement | null>(null)
// A component with several roots has no one element to describe; the hint would mount and never
// show, so it stays closed and says why.
let warned = false
const setRoot = (r: unknown) => {
  const el = r && '$el' in (r as object) ? (r as ComponentPublicInstance).$el : r
  rootEl.value = el instanceof HTMLElement ? el : null
  if (r && !rootEl.value && isDev() && !warned) {
    warned = true
    console.warn(
      '[grani] UiTooltip needs one element or a single-root component as its trigger; a fragment (another tooltip, a component with several roots) has none.',
    )
  }
}
const attrs = useAttrs()
const Trigger = () => {
  const nodes = slots.default?.() ?? []
  const i = nodes.findIndex((n) => n.type !== Comment)
  if (i < 0) return nodes
  // What is set on the tooltip is for its trigger: a popover or a menu wires the button through it
  // (id, aria, the click), so the hint can stand inside such a trigger.
  nodes[i] = cloneVNode(nodes[i]!, mergeProps(attrs, { ref: setRoot }), true)
  return nodes
}
</script>
