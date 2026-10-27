<!--
  UiCount: a number beside a label. Take it for the count on a tab, a button or a row; on the corner
  of an icon or an avatar take UiIndicator.

  Shape. One digit sits in a circle, more digits in a capsule, and above `max` it shows `{max}+`.
  `soft` is quiet; `solid` draws attention.

  Values. A fraction is rounded down, an infinite count shows the overflow, a negative or missing
  one is `0`, and one that is not a number draws nothing: unknown is not empty.

  Placement. It sits on a button's label, a tab (UiTabs), a navigation row (UiAppShell) and a
  UiFilter trigger, and serves as the mark of UiIndicator. The root is a `<span>`.

  Keyboard. Not interactive: it takes no focus, and reaches the keyboard only through its host, a
  button, a tab or a row.

  Reader.
  - Name: a bare number means nothing: the host names it with its label ("Inbox, 4"); standing
    alone, `ariaLabel` makes it an image named with its unit ("4 unread").
  - Dot: a `dot` is hidden.
  - Change: not announced.

  States. One digit in a circle, more in a capsule, `{max}+` above `max`, `0` shown; `soft` pale or
  `solid` saturated, `warning` always solid; `dot`, with no number; `sm` 16px and `md` 20px. No
  hover or focus of its own. A count that is not a number draws nothing; a bad `max` falls back.
  Both warn in dev, once per value.

  Not for.
  - A label: UiBadge.
  - A change against the value before: UiDelta.
  - A count on the corner of an icon or an avatar: UiIndicator around it.
-->
<template>
  <span
    v-if="dot || !unknown"
    class="ui-count inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill font-semibold tabular-nums leading-none [text-box:trim-both_cap_alphabetic]"
    :class="[shape, fill]"
    :aria-hidden="dot || undefined"
    :role="ariaLabel && !dot ? 'img' : undefined"
    :aria-label="dot ? undefined : ariaLabel"
  >
    <slot v-if="!dot">{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, useSlots, watch } from 'vue'
import { isDev } from '../utils/dev'
import type { BadgeTone } from '../types/ui'
import { countMax, countText, countValue } from '../utils/count'
import { toneSolidClass, toneSubtleClass } from '../utils/tone'

const props = withDefaults(
  defineProps<{
    /** The number. `0` is shown; hide it with `v-if` when zero means nothing. */
    count?: number
    /** The largest count shown as is; above it the count reads `{max}+`. A whole number from 1. */
    max?: number
    /** Meaning: `brand` for the product's own counts, a verdict, or `neutral`. */
    tone?: BadgeTone
    /** `soft` pale plate for a quiet total, `solid` saturated fill for a count that calls; `warning` is always solid, its pale plate reads muddy. */
    variant?: 'soft' | 'solid'
    /** `sm` 16px for a corner mark or a dense row, `md` 20px on a button, a tab or a navigation row. */
    size?: 'sm' | 'md'
    /** A dot without a number: there is something new, how much does not matter. 8px, 6px at `sm`. */
    dot?: boolean
    /** The name of a count that stands alone, the number with its unit: "4 unread". In a tab, a row or a button their label names it. */
    ariaLabel?: string
  }>(),
  { count: 0, max: 99, tone: 'neutral', variant: 'soft', size: 'md', dot: false },
)

defineSlots<{
  /** A short mark instead of the number, such as "!"; it takes the same circle. */
  default(props: Record<string, never>): any
}>()

// A dot has no room for text: a slot next to `dot` would vanish without a word.
const slots = useSlots()
onMounted(() => {
  if (isDev() && props.dot && slots.default)
    console.warn('[grani] UiCount: `dot` draws no text, the slot content is dropped.')
})

const text = computed(() => countText(props.count, props.max))
// A count that is not a number is unknown, not empty: it draws nothing rather than a "0". A dot
// needs no number, so it stays.
const unknown = computed(() => Number.isNaN(props.count))
const check = () => {
  const bad =
    (countValue(props.count) !== props.count && props.count !== Infinity) ||
    countMax(props.max) !== props.max
  if (isDev() && bad)
    console.warn('[grani] UiCount got an invalid count or max; showing the nearest valid number.')
}
onMounted(() => {
  check()
  watch(() => [props.count, props.max], check)
})
const shape = computed(() => {
  if (props.dot) return props.size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
  return props.size === 'sm' ? 'h-4 min-w-4 px-1 text-[10px]' : 'h-5 min-w-5 px-1.5 text-xs/4.5'
})
const fill = computed(() =>
  props.variant === 'solid' || props.tone === 'warning'
    ? toneSolidClass(props.tone)
    : toneSubtleClass(props.tone),
)
</script>
