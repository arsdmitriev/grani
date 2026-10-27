<!--
  UiSparkline: a small trend with no axes, beside the number it belongs to. Take it in a table
  cell, in a strip's actions beside a UiDelta, or under a headline in a UiChartCard.

  Shapes. `line` and `area` stretch in one viewBox, with a dot on the newest value kept inside the
  box; a flat run stands at mid-height. `bar` draws HTML boxes from zero: the newest one (or
  `highlight`) is full, and the rest are pale with a line at their height, so each still reads.
  Bars stand 4px apart while there is room; a long run in a narrow host closes the gaps.

  Gaps. A `null` is no data: the line breaks (a single value between two gaps is a dot), and a
  bar's place stays empty. A zero is a stub on the zero line.

  Size and tone. The host sets the width, and `height` sets the height. Set `tone` to agree with
  the verdict beside it. `mark` draws one reference line, an average or a plan, named at its end.

  In a card. In a UiChartCard it draws its shape pale on the first load and holds it still when
  there is nothing to draw.

  Keyboard. Not interactive: no tab stop, no keys; the number beside it carries the value.

  Reader.
  - Name: without `ariaLabel` it is hidden (`aria-hidden`), and the number beside it says the
    value; with one it is an image with that name, followed by the mark's label ("Average
    receipt, the last 12 months, 12-month average 43.06").
  - Values: not read; a chart a reader can walk is UiAreaChart or UiBarChart.
  - Hidden: on a card's first load, when the card has nothing to draw, and when no value is a
    number, whatever its name.

  States. `line`, `area` and `bar`, a dot on the newest value or on `highlight`, a gap (`null`) that
  breaks the line or leaves a bar's place empty, a loss below the zero line, a flat run at
  mid-height, a `mark` with its name, six tones. In a UiChartCard: its first load as a pale shape,
  nothing to draw held still, a refresh dimmed by the card. No hover or focus state of its own.

  Not for.
  - A chart with axes, a legend and a tooltip: UiAreaChart or UiBarChart.
  - A share of a whole: UiProgress.
  - The verdict beside it: UiDelta.
  - A single figure with a trend as a card: UiChartCard with `bleed="full"`.
-->
<template>
  <div
    class="relative min-w-0"
    :style="{ height: `${height}px` }"
    :role="spoken ? 'img' : undefined"
    :aria-label="spoken ? named : undefined"
    :aria-hidden="spoken ? undefined : 'true'"
  >
    <div
      v-if="skeleton && variant === 'bar'"
      class="flex h-full items-end gap-1 text-skeleton"
      :class="empty ? '' : 'ui-skeleton animate-pulse'"
    >
      <span
        v-for="(g, i) in GHOST_Y"
        :key="i"
        class="min-w-0 flex-1 rounded-t-badge bg-current"
        :style="{ height: `${100 - g}%` }"
      />
    </div>
    <!-- lint: inline-svg-ok -->
    <svg
      v-else-if="skeleton"
      class="absolute inset-0 h-full w-full text-skeleton"
      :class="empty ? '' : 'ui-skeleton animate-pulse'"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        :d="linePath(GHOST_X, GHOST_Y)"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div
      v-else-if="variant === 'bar'"
      class="relative flex h-full"
      :style="{ columnGap }"
      data-bars
    >
      <span v-for="(v, i) in values" :key="i" class="relative min-w-0 flex-1">
        <!-- A quiet bar is pale with a line at its height: the line carries the value at full contrast. -->
        <span
          v-if="isFiniteNumber(v)"
          class="absolute inset-x-0 overflow-hidden"
          :class="[color, v < 0 ? 'rounded-b-badge' : 'rounded-t-badge']"
          :style="bar(v)"
          data-bar
        >
          <span class="absolute inset-0 bg-current" :class="i === lit ? '' : 'opacity-35'" />
          <span
            v-if="i !== lit"
            class="absolute inset-x-0 h-0.5 bg-current"
            :class="v < 0 ? 'bottom-0' : 'top-0'"
          />
        </span>
      </span>
      <!-- A line of reference (an average, a plan), its name on a plate at the end, readable over the fill. -->
      <template v-if="mark">
        <span
          class="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg-muted"
          :style="{ top: `${y(mark.at)}%` }"
          data-mark
        />
        <span
          class="pointer-events-none absolute end-2 -translate-y-1/2 whitespace-nowrap rounded-badge border border-border bg-surface px-1.5 text-xs leading-5 text-fg-muted"
          :style="{ top: `${y(mark.at)}%` }"
          >{{ mark.label }}</span
        >
      </template>
    </div>
    <!-- The drawing keeps the dot's room (`room`), and an area's fill still runs to every edge. -->
    <div v-else class="absolute" :style="box">
      <!-- lint: inline-svg-ok -->
      <svg
        class="absolute inset-0 h-full w-full overflow-visible"
        :class="color"
        :style="variant === 'area' ? { clipPath: clip } : undefined"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <template v-if="variant === 'area'">
          <defs>
            <linearGradient :id="uid" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="100">
              <stop offset="0" stop-color="currentColor" stop-opacity="0.35" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="areaPath(xs, ys, FLOOR)" :fill="`url(#${uid})`" />
          <!-- Past a dot that stands at a side, the fill runs on level to the host's edge. -->
          <rect
            v-for="s in sides"
            :key="s.x"
            :x="s.x"
            :y="s.y"
            width="50"
            :height="FLOOR - s.y"
            :fill="`url(#${uid})`"
          />
        </template>
        <path
          :d="linePath(xs, ys)"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <!-- A line of reference (an average, a plan), its name on a plate at the end, readable over the fill. -->
      <template v-if="mark">
        <span
          class="pointer-events-none absolute border-t border-dashed border-fg-muted"
          :style="{ top: `${y(mark.at)}%`, left: `-${room.left}px`, right: `-${room.right}px` }"
          data-mark
        />
        <span
          class="pointer-events-none absolute end-2 -translate-y-1/2 whitespace-nowrap rounded-badge border border-border bg-surface px-1.5 text-xs leading-5 text-fg-muted"
          :style="{ top: `${y(mark.at)}%` }"
          >{{ mark.label }}</span
        >
      </template>
      <!-- A value alone between two gaps has no line to join: a dot says it is there. -->
      <span
        v-for="i in lone"
        :key="i"
        class="absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-current"
        :class="color"
        :style="{ left: `${xs[i]}%`, top: `${ys[i]}%` }"
        data-lone
      />
      <span
        v-if="endpoint && lit >= 0"
        class="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-current"
        :class="color"
        :style="{ left: `${xs[lit]}%`, top: `${ys[lit]}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import type { Tone } from '../types/ui'
import { areaPath, linePath } from '../utils/chartPath'
import { linearScale, pointPosition } from '../utils/chartScale'
import { isFiniteNumber } from '../utils/scale'
import { CHART_EMPTY, CHART_SKELETON } from '../utils/surface'

const props = withDefaults(
  defineProps<{
    /** The values in order, the newest last; `null` is no data, a gap. */
    values: (number | null)[]
    /** `line` a trend, `area` the same filled below, `bar` one box per value from zero. */
    variant?: 'line' | 'area' | 'bar'
    /** What the trend means: `brand` for a figure of the product, `success` or `danger` for a verdict, `neutral` for a quiet one. */
    tone?: Tone
    /** A dot on the newest value of a line or an area. */
    endpoint?: boolean
    /** The height in pixels; the host sets the width. */
    height?: number
    /** The index of the value in light: the full bar, or the dot on a line; the newest value when unset. */
    highlight?: number
    /** A line of reference across the trend, named at its end: `{ at: 43.06, label: '12-month average 43.06' }`. */
    mark?: { at: number; label: string }
    /** What the trend shows, for a screen reader: "Average receipt, the last 12 months". Unset, it is decoration. */
    ariaLabel?: string
  }>(),
  {
    variant: 'line',
    tone: 'brand',
    endpoint: true,
    height: 28,
    highlight: undefined,
    mark: undefined,
    ariaLabel: '',
  },
)

const uid = `ui-spark-${useId()}`
// The border step of a verdict's tone is the one that reads as a line on the surface, in both themes.
const TONE: Record<Tone, string> = {
  brand: 'text-chart-1',
  neutral: 'text-fg-muted',
  success: 'text-success-border',
  warning: 'text-warning-border',
  danger: 'text-danger-border',
  info: 'text-info-border',
}
const color = computed(() => TONE[props.tone])

const loading = inject(CHART_SKELETON, null)
const nothing = inject(CHART_EMPTY, null)
// Nothing to draw holds the first load's shape, still, for the card to hide under its words.
const empty = computed(() => nothing?.value ?? false)
const skeleton = computed(() => (loading?.value ?? false) || empty.value)
// The ghost of a trend for the first load: a gentle rise.
const GHOST_Y = [70, 60, 64, 50, 56, 42, 46, 34]
const GHOST_X = GHOST_Y.map((_, i) => (i / (GHOST_Y.length - 1)) * 100)

// A line has no zero to reach: it takes the height between its own lowest and highest. Bars stand
// on zero, so their heights compare.
// The mark is inside the range: a line of reference off the chart says nothing.
const scale = computed(() =>
  linearScale(props.mark ? [...props.values, props.mark.at] : props.values, {
    zero: props.variant === 'bar',
  }),
)
// A name with nothing drawn under it would announce a chart that is not there.
const spoken = computed(() => Boolean(props.ariaLabel) && !skeleton.value && newest.value >= 0)
const named = computed(() =>
  props.mark ? `${props.ariaLabel}, ${props.mark.label}` : props.ariaLabel,
)
const finite = computed(() => props.values.filter(isFiniteNumber))
// A run that never moves has no span to fill: it stands at mid-height, not on an edge.
const flat = computed(
  () =>
    props.variant !== 'bar' &&
    !props.mark &&
    finite.value.length > 0 &&
    finite.value.every((v) => v === finite.value[0]),
)
const y = (v: number) => (flat.value ? 50 : (1 - scale.value.at(v)) * 100)
const xs = computed(() => props.values.map((_, i) => pointPosition(i, props.values.length) * 100))
const ys = computed(() => props.values.map((v) => (isFiniteNumber(v) ? y(v) : null)))
const newest = computed(() => props.values.findLastIndex((v) => isFiniteNumber(v)))
// A highlight on a value there is lights it; outside the values or on a gap, the newest stays lit.
const lit = computed(() => {
  const h = props.highlight
  return h !== undefined && Number.isInteger(h) && isFiniteNumber(props.values[h])
    ? h
    : newest.value
})
// The dot's radius, kept clear of the host's edge so the dot is never cut: at the top and the bottom,
// where the highest and the lowest value stand, and at a side only when the dot is there. A clear
// band on every side would leave an area short of a card's sides and floor.
const DOT = 3
const room = computed(() => {
  const at = props.endpoint && lit.value >= 0 ? xs.value[lit.value] : undefined
  const y = props.endpoint ? DOT : 0
  return { top: y, bottom: y, left: at === 0 ? DOT : 0, right: at === 100 ? DOT : 0 }
})
const box = computed(() => {
  const r = room.value
  return { top: `${r.top}px`, bottom: `${r.bottom}px`, left: `${r.left}px`, right: `${r.right}px` }
})
// An area's fill runs far past the drawing, below its floor and level past a dot at a side, and is
// cut at the host's edges; a pixel more keeps the line's stroke whole where it touches one.
const FLOOR = 200
const clip = computed(() => {
  const r = room.value
  return `inset(-${r.top + 1}px -${r.right + 1}px -${r.bottom + 1}px -${r.left + 1}px)`
})
const sides = computed(() => {
  const first = ys.value[0]
  const last = ys.value.at(-1)
  return [
    ...(room.value.left && isFiniteNumber(first) ? [{ x: -50, y: first }] : []),
    ...(room.value.right && isFiniteNumber(last) ? [{ x: 100, y: last }] : []),
  ]
})
const lone = computed(() =>
  props.values.flatMap((v, i) =>
    isFiniteNumber(v) &&
    !isFiniteNumber(props.values[i - 1]) &&
    !isFiniteNumber(props.values[i + 1]) &&
    !(props.endpoint && i === lit.value)
      ? [i]
      : [],
  ),
)
// Bars keep 4px apart while each slot is 6px or wider, 1px down to 2px, and touch below that: a
// fixed gap on a long run would leave the bars no width at all. Percent here is the row's width.
const columnGap = computed(() => {
  const slot = `100% / ${Math.max(1, props.values.length)}`
  return `max(clamp(0px, calc((${slot} - 6px) * 1000), 4px), clamp(0px, calc((${slot} - 2px) * 1000), 1px))`
})
// A bar runs from the zero line to its value, up for a gain and down for a loss.
// A bar too short to see keeps a stub on the zero line, up for a gain and down for a loss.
const bar = (v: number) => {
  const zero = y(0)
  const size = Math.max(Math.abs(zero - y(v)), 4)
  return { top: `${v < 0 ? zero : zero - size}%`, height: `${size}%` }
}
</script>
