<!--
  UiIndicator: a count or a dot on the corner of what it marks. Take it on an icon button, an avatar
  (`round`) or a place's icon in UiAppShell's collapsed rail when something waits there; a number
  beside a label is UiCount.

  Mark. The mark is a UiCount and follows its rules: a fraction is rounded down, an infinite count
  shows `{max}+`, and a bad one shows nothing. A ring in the surface color, or in
  `--ui-indicator-ring`, cuts it out from what it sits on.

  Overflow. Half of the mark stands outside the element, so a clipping ancestor crops it, and a
  UiButtonGroup does not join it. The root is a `<span>`.

  Keyboard. Not interactive: the mark takes no focus and no pointer; the element in the slot keeps
  its own tab stop.

  Reader.
  - Mark: hidden (`aria-hidden`).
  - Name: the host names the state on the element it marks, using the slot's `{ count, text,
    visible }`: "Inbox, 99+", or "new" while a dot is visible.
  - Change: not announced.

  States. Hidden at `0` unless `dot`; a count, `{max}+` above `max`; a dot; `pulse`, a ring in the
  tone that keeps expanding and stops under reduced motion; `round`, on the edge of a circle; the
  four corners, mirrored in RTL; `sm` and `md`; the ring of the surface or of `--ui-indicator-ring`.
  A bad count hides the mark and warns in dev.

  Not for.
  - A number beside a label: UiCount.
  - A label: UiBadge.
  - A status in a row of a table: UiBadge `inline`.
-->
<template>
  <span class="relative inline-flex">
    <slot :count="safeCount" :text="countText(safeCount, max)" :visible="visible" />
    <span
      v-if="visible"
      aria-hidden="true"
      class="pointer-events-none absolute flex"
      :class="(round ? ON_CIRCLE : PLACEMENT)[placement]"
    >
      <span
        v-if="pulse"
        class="absolute inset-0 animate-ping rounded-pill opacity-60"
        :class="pulseFill"
      />
      <UiCount
        :count="safeCount"
        :max="max"
        :tone="tone"
        :dot="dot"
        :size="size"
        variant="solid"
        class="ui-indicator-mark relative ring-2"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { isDev } from '../utils/dev'
import type { BadgeTone } from '../types/ui'
import { countText, countValue } from '../utils/count'
import { toneFillClass } from '../utils/tone'
import UiCount from './UiCount.vue'

type Placement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'

const props = withDefaults(
  defineProps<{
    /** The number on the corner; `0` hides the mark unless `dot` is set. */
    count?: number
    /** The largest count shown as is; above it the mark reads `99+`. */
    max?: number
    /** A dot instead of a number: online, unsaved, something new. */
    dot?: boolean
    /** Meaning of the mark: `danger` for unread by default, `success` for online. */
    tone?: BadgeTone
    /** Which corner of the element holds the mark. */
    placement?: Placement
    /** `sm` on an `xs` icon button or a small avatar, `md` on an `sm` or `md` icon button. */
    size?: 'sm' | 'md'
    /** A ring that keeps expanding: the state is live. Stops under reduced motion. */
    pulse?: boolean
    /** The element is a circle (an avatar, as wide as it is tall): the mark sits on its edge, not on the corner of its box. */
    round?: boolean
  }>(),
  {
    count: 0,
    max: 99,
    dot: false,
    tone: 'danger',
    placement: 'top-end',
    size: 'md',
    pulse: false,
    round: false,
  },
)

defineSlots<{
  /** The element that carries the mark: an icon button, an avatar. Gets the count to name the state from. */
  default(props: { count: number; text: string; visible: boolean }): any
}>()

// The mark's center sits on the corner, half outside the element.
const PLACEMENT: Record<Placement, string> = {
  'top-end': 'end-0 top-0 -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2',
  'top-start': 'start-0 top-0 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
  'bottom-end': 'bottom-0 end-0 translate-x-1/2 translate-y-1/2 rtl:-translate-x-1/2',
  'bottom-start': 'bottom-0 start-0 -translate-x-1/2 translate-y-1/2 rtl:translate-x-1/2',
}

// On a circle the corner of the box is empty space; 14.6% in from each side is
// where the edge crosses the diagonal (1 - 1/sqrt 2, halved).
const ON_CIRCLE: Record<Placement, string> = {
  'top-end': 'end-[14.6%] top-[14.6%] -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2',
  'top-start': 'start-[14.6%] top-[14.6%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
  'bottom-end': 'bottom-[14.6%] end-[14.6%] translate-x-1/2 translate-y-1/2 rtl:-translate-x-1/2',
  'bottom-start':
    'bottom-[14.6%] start-[14.6%] -translate-x-1/2 translate-y-1/2 rtl:translate-x-1/2',
}

// Read as UiCount reads it; the slot never names the state "NaN new".
const safeCount = computed(() => countValue(props.count))
const check = () => {
  if (isDev() && props.count !== Infinity && !(Number.isFinite(props.count) && props.count >= 0))
    console.warn('[grani] UiIndicator got an invalid count; hiding the mark.')
}
onMounted(() => {
  check()
  watch(() => props.count, check)
})
const visible = computed(() => props.dot || safeCount.value > 0)
const pulseFill = computed(() => toneFillClass(props.tone))
</script>
