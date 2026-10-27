<!--
  UiDelta: a badge with the signed percent a value moved against the one before. Take it beside a
  number, beside a UiSparkline, or on a chart card's title line.

  Counting. The library counts the percent against the size of `previous`, so a smaller loss reads
  as growth. No previous value, a zero one, or a change over 10 000% draws nothing.

  Meaning. Growth is `success` and a fall is `danger`; `invert` swaps them when lower is better.
  The sign and a word for a screen reader ("better", "worse") carry the meaning, so it does not
  rest on color alone.

  Placement. On a UiChartCard's title line, beside a UiSparkline in a UiListItem row's `#actions`,
  and beside a number. On a chart card it reads the card's state as the chart does: while the card
  has no data (a first load, nothing to draw, a failed load) it draws nothing, and comes back with
  the data; a refresh keeps it. The badge never shrinks, so a long label beside it cannot cut off the sign
  or the digits; the label wraps when the host is narrow. The root is a `<span>`.

  Keyboard. Not interactive: no tab stop, no keys.

  Reader.
  - Value: the percent is hidden and a verdict is read in its place, the change and a word:
    "+12%, better" or "-8%, worse"; no change is read as 0% with no verdict.
  - Label: the label after the badge is read as text, after the verdict.

  States. Growth (`success`), a fall (`danger`), the two swapped by `invert`, no change (`neutral`,
  0%), and nothing drawn: no `previous`, a zero one, a change past 10 000%, or a chart card around
  it with no data. Two sizes, `sm` and
  `md`; no hover or focus state of its own.

  Not for.
  - The trend itself: UiSparkline beside it.
  - A state word: UiBadge.
  - A count: UiCount.
  - A share of a whole: UiProgress.
-->
<template>
  <span v-if="change !== null && !held" class="inline-flex items-center gap-1.5">
    <UiBadge :tone="tone" :size="size" class="shrink-0">
      <span :aria-hidden="verdict ? 'true' : undefined">{{ text }}</span
      ><span v-if="verdict" class="sr-only">{{ verdict }}</span>
    </UiBadge>
    <span v-if="label" class="min-w-0 text-xs/4.5 text-fg-muted">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useUiT } from '../composables/useUiT'
import { isFiniteNumber } from '../utils/scale'
import { CHART_EMPTY, CHART_SKELETON } from '../utils/surface'
import UiBadge from './UiBadge.vue'

const props = withDefaults(
  defineProps<{
    /** The value now. */
    current: number
    /** The value it is compared with; `null`, missing, zero or not finite draws nothing. */
    previous?: number | null
    /** Lower is better: a fall is `success`, growth `danger`. */
    invert?: boolean
    /** What it is compared with, shown after the badge: "vs August". A screen reader reads it as text after the verdict. */
    label?: string
    /** `sm` on a chart card's title line, in a row or a cell; `md` beside a larger heading. */
    size?: 'sm' | 'md'
  }>(),
  { previous: null, invert: false, label: '', size: 'sm' },
)

const { n, t } = useUiT()
const MAX_RATIO = 100
// A chart card around it says when there is no data yet; outside one, nothing is held.
const skeleton = inject(CHART_SKELETON, null)
const empty = inject(CHART_EMPTY, null)
const held = computed(() => !!(skeleton?.value || empty?.value))

const change = computed(() => {
  if (!isFiniteNumber(props.current) || !isFiniteNumber(props.previous) || props.previous === 0)
    return null
  // Over 10 000% the base was dust (0.1 + 0.2 - 0.3) or the ratio overflowed: no percent to print.
  const ratio = (props.current - props.previous) / Math.abs(props.previous)
  return Number.isFinite(ratio) && Math.abs(ratio) <= MAX_RATIO ? ratio : null
})
// Under half a tenth of a percent the badge would print "+0%" in a tone: it is no change.
const flat = computed(() => Math.abs(change.value ?? 0) < 0.0005)
const text = computed(() =>
  n(flat.value ? 0 : (change.value ?? 0), {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }),
)
const better = computed(() => (change.value ?? 0) > 0 !== props.invert)
const tone = computed(() => (flat.value ? 'neutral' : better.value ? 'success' : 'danger'))
const verdict = computed(() =>
  flat.value
    ? ''
    : t(better.value ? 'grani.delta.better' : 'grani.delta.worse', { change: text.value }),
)
</script>
