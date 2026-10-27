<!--
  UiAreaChart: values over time as areas and lines. Take it for a flow over time, usually in the
  body of a UiChartCard.

  Data. `x` is the time axis: dates that the library labels by `grain`, with the year on the first
  label shown and where it changes. Names that are not dates (regions, products) are categories:
  UiBarChart labels each. Each series is its `values` in that order. A `null` is a gap where the
  line breaks, never a zero.

  Series. A series is an area, or a `line`; `dashed` marks a figure of another kind (a profit over
  revenue). A `muted` series is drawn in gray behind the rest, as a period to compare with, and
  takes no color.

  Value axis. The value axis covers every value shown, losses included, and draws the zero line
  when the values cross it.

  Legend. The legend names each series with its total. Pressing one shows it alone and fits the
  axis to it; pressing it again shows all. `tooltipTotal` adds a sum under the series in the
  tooltip, hidden while one series stands alone.

  Partial and highlight. `partial` says the last point is a period still going: its segment is
  dashed, and its label and tooltip say so. `highlight` puts a dot on each series at one point,
  the month the card's headline talks about.

  Drawing. The SVG stretches in one viewBox and keeps its stroke widths. Every word is HTML over
  it, and the width changes only how many time-axis labels show, so what the server renders is
  what the browser keeps. A label that would still run into the next one or out of the plot is
  left out; the newest always stays. It takes the whole width of its host, even in a centering row.

  Points. Each point is a row of the hidden table and a word of the axis. Measured in Chromium
  (production build, two series): 500 points draw about 2,600 elements and a pointer move reaches
  the screen within a frame; 1,000 take about 20 ms, 2,000 about 50 ms and 10,000 over half a
  second. Past 500, group the days into weeks or months; in development the chart warns once.

  In a card. In a UiChartCard it draws its own shape pale on the card's first load, and holds that
  shape still when there is nothing to draw. Alone, with no point or no value that is a number, it
  says "No data for this period" in its own place. When the card bleeds it to the sides, it keeps its
  words on the gutter, drops the value axis and draws the focus ring inside; on the card's floor
  it keeps the gutter under its legend.

  Placement. In a UiChartCard's body, under the card's headline, with a UiDelta in the card's
  actions. Alone it fills its host, a page section or a panel.

  Keyboard.
  The plot is one tab stop; an empty chart is no tab stop.
  On the plot:
  - `Tab`: reaches it; focus shows the newest point, or the one last visited.
  - `ArrowLeft` `ArrowRight`: step from point to point; each point is read out.
  - `Home` `End`: jump to the first and the last point; each point is read out.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
  On the legend, whose chips are buttons when there are two series or more:
  - `Tab`: reaches each chip.
  - `Enter` `Space`: shows that series alone; a second press shows all.
  A finger scrolls the page over the plot, and a tap keeps its point until a tap elsewhere.

  Reader.
  - Plot: an image named by `ariaLabel`.
  - Point: only a point reached by the keyboard is read, in a polite live region, as "September
    2026: Spending 3,640, Income 5,100", followed by the sum of `tooltipTotal`.
  - Table: a hidden table, captioned with the chart's name, holds every point, every series and
    the sum, including a series shown alone; `partial` says "in progress" with the last point.
  - Legend: a group named "Series; press one to show it alone", each chip `aria-pressed`.
  - Hidden: the tooltip, the dots, the labels and the axis.
  - Empty: alone, a group named by `ariaLabel` that says there is no data.

  States. Rest, a point under the pointer or the keys (the line, the dots and the tooltip), one
  series alone, `partial` with its dashed tail, `highlight` dots until the cursor takes over, a
  `muted` series behind the rest, a gap and a lone point with its dot, a loss with the zero line,
  nothing to draw alone.
  In a UiChartCard: its first load as a pale line, nothing to draw held still, a refresh dimmed by
  the card, bled to the sides without a value axis.

  Not for.
  - Amounts per period: UiBarChart.
  - The parts of a whole: UiDonutChart.
  - A trend with no axes beside a number: UiSparkline.
  - The card with its title, headline and data states: UiChartCard around it.
-->
<template>
  <div class="w-full min-w-0">
    <!-- The first load draws the chart's own shape: a pale line where the line will be, bars where
         the labels will stand; nothing to draw holds it still for the card to hide. -->
    <div v-if="skeleton" aria-hidden="true">
      <div class="relative pb-6" :class="axis ? 'ps-12' : ''" :style="{ height: `${height}px` }">
        <div class="relative h-full">
          <!-- lint: inline-svg-ok -->
          <svg
            class="absolute inset-0 h-full w-full text-skeleton"
            :class="empty ? '' : 'ui-skeleton animate-pulse'"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              v-if="series.some((s) => s.variant !== 'line')"
              :d="areaPath(GHOST_X, GHOST_Y, 100, curve)"
              fill="currentColor"
              fill-opacity="0.5"
            />
            <path
              :d="linePath(GHOST_X, GHOST_Y, curve)"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div
          class="absolute inset-x-0 bottom-0 flex h-4 items-center justify-between"
          :class="[inset, axis ? 'ps-12' : '']"
        >
          <UiSkeleton v-for="i in 4" :key="i" class="h-3 w-10" />
        </div>
      </div>
      <div
        v-if="legend"
        class="mt-3 flex items-center gap-4"
        :class="[controlHeightClass.xs, inset, floor ? FLOOR_PAD[gutter ?? 'surface'] : '']"
      >
        <UiSkeleton v-for="i in series.length || 1" :key="i" class="h-3 w-20" />
      </div>
    </div>
    <!-- Alone, nothing to draw says so in the chart's place, as a card around it would. -->
    <div
      v-else-if="blank"
      role="group"
      :aria-label="ariaLabel"
      class="flex items-center justify-center"
      :style="{ height: `${height}px` }"
      data-chart-blank
    >
      <UiNoData
        size="sm"
        :title="t('grani.chart.empty')"
        :description="t('grani.chart.emptyHint')"
      />
    </div>
    <template v-else>
      <div class="relative pb-6" :class="axis ? 'ps-12' : ''" :style="{ height: `${height}px` }">
        <template v-if="axis">
          <span
            v-for="(tick, k) in scale.ticks"
            :key="tick"
            class="absolute start-0 flex w-10 -translate-y-1/2 justify-end whitespace-nowrap text-xs/4.5 tabular-nums text-fg-muted"
            :style="{ top: `calc((100% - 1.5rem) * ${1 - scale.at(tick)})` }"
            aria-hidden="true"
          >
            {{ axisLabels[k] }}
          </span>
        </template>
        <div
          ref="plot"
          class="relative h-full touch-pan-y rounded-control"
          :class="gutter ? 'focus-visible:!shadow-(--ui-ring-inset)' : ''"
          :tabindex="x.length ? 0 : undefined"
          role="img"
          :aria-label="ariaLabel"
          v-on="cursor.handlers"
        >
          <!-- lint: inline-svg-ok -->
          <svg
            class="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                v-for="s in shown"
                :id="`${uid}-${s.index}`"
                :key="s.key"
                :class="s.color"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0" stop-color="currentColor" stop-opacity="0.4" />
                <stop offset="1" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
            </defs>
            <template v-if="axis">
              <line
                v-for="tick in scale.ticks"
                :key="tick"
                x1="0"
                x2="100"
                :y1="y(tick)"
                :y2="y(tick)"
                :class="tick === 0 && crossesZero ? 'text-fg-subtle' : 'text-border'"
                stroke="currentColor"
                :stroke-dasharray="tick === 0 && crossesZero ? undefined : '3 3'"
                vector-effect="non-scaling-stroke"
              />
            </template>
            <line
              v-else-if="crossesZero"
              x1="0"
              x2="100"
              :y1="y(0)"
              :y2="y(0)"
              class="text-fg-subtle"
              stroke="currentColor"
              vector-effect="non-scaling-stroke"
            />
            <g v-for="s in painted" :key="s.key" :class="s.color">
              <path
                v-if="s.variant !== 'line'"
                :d="areaPath(xs, ys(s.values), base, curve)"
                :fill="`url(#${uid}-${s.index})`"
              />
              <path
                :d="linePath(xs, ys(partial ? settled(s.values) : s.values), curve)"
                fill="none"
                stroke="currentColor"
                :stroke-width="s.dashed ? 1.5 : 2"
                :stroke-dasharray="s.dashed ? '5 4' : undefined"
                vector-effect="non-scaling-stroke"
              />
              <path
                v-if="partial"
                :d="linePath(xs, ys(tail(s.values)), curve)"
                fill="none"
                stroke="currentColor"
                :stroke-width="s.dashed ? 1.5 : 2"
                stroke-dasharray="2 4"
                vector-effect="non-scaling-stroke"
              />
            </g>
          </svg>
          <!-- A point with no neighbor draws no line: a dot keeps it in view. -->
          <template v-for="s in shown" :key="s.key">
            <span
              v-for="i in lonely(s.values)"
              :key="i"
              class="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-current"
              :class="s.color"
              :style="{ left: `${xs[i]}%`, top: `${y(s.values[i]!)}%` }"
            />
          </template>
          <!-- The point in light: a dot on each series there, until the cursor shows another. -->
          <template v-if="lit && active === null">
            <template v-for="s in painted" :key="s.key">
              <span
                v-if="isFiniteNumber(s.values[highlight!])"
                class="pointer-events-none absolute h-2.5 w-2.5 -translate-y-1/2 rounded-pill border-2 border-current bg-surface"
                :class="[s.color, dotAt(highlight!)]"
                :style="{ left: `${xs[highlight!]}%`, top: `${y(s.values[highlight!]!)}%` }"
                data-highlight
              />
            </template>
          </template>
          <template v-if="active !== null">
            <span
              class="pointer-events-none absolute inset-y-0 w-px bg-border-strong"
              :style="{ left: `${xs[active]}%` }"
            />
            <template v-for="s in shown" :key="s.key">
              <span
                v-if="isFiniteNumber(s.values[active])"
                class="pointer-events-none absolute h-2.5 w-2.5 -translate-y-1/2 rounded-pill border-2 border-current bg-surface"
                :class="[s.color, dotAt(active)]"
                :style="{ left: `${xs[active]}%`, top: `${y(s.values[active]!)}%` }"
              />
            </template>
            <div
              class="pointer-events-none absolute top-0 z-tooltip w-max max-w-[calc(50%-0.75rem)] rounded-overlay border border-border bg-surface px-3 py-2 text-xs/4.5 shadow-lg"
              :style="tipAt(xs[active] ?? 0)"
              aria-hidden="true"
            >
              <p class="mb-1 text-fg-muted">{{ pointTitle(active) }}</p>
              <p v-for="s in shown" :key="s.key" class="flex items-center justify-between gap-3">
                <span class="flex items-center gap-1.5 text-fg">
                  <span class="h-2.5 w-1 rounded-badge bg-current" :class="s.color" />{{ s.label }}
                </span>
                <span class="font-medium tabular-nums text-fg">
                  {{ formatChartValue(tr, s.values[active], format) }}
                </span>
              </p>
              <p
                v-if="summing"
                class="mt-1 flex justify-between gap-3 border-t border-border pt-1 font-medium text-fg"
              >
                <span>{{ tooltipTotal!.label }}</span>
                <span class="tabular-nums">{{ formatChartValue(tr, sumAt(active), format) }}</span>
              </p>
            </div>
          </template>
        </div>
        <span
          v-for="(text, i) in labels"
          ref="tickLabels"
          :key="i"
          :data-label="i"
          class="absolute bottom-0 whitespace-nowrap text-xs/4.5 text-fg-muted"
          :class="[shows(i) && !crowded.has(i) ? '' : 'invisible', anchor(i)]"
          :style="{ left: labelLeft(i) }"
          aria-hidden="true"
        >
          {{ text }}
        </span>
      </div>
      <div
        v-if="legend"
        class="mt-3 flex flex-wrap gap-x-1 gap-y-1 text-xs/4.5"
        :class="[inset, floor ? FLOOR_PAD[gutter ?? 'surface'] : '']"
        :role="series.length > 1 ? 'group' : undefined"
        :aria-label="series.length > 1 ? t('grani.chart.legend') : undefined"
      >
        <component
          :is="series.length > 1 ? 'button' : 'span'"
          v-for="s in drawn"
          :key="s.key"
          data-grani
          :type="series.length > 1 ? 'button' : undefined"
          :aria-pressed="series.length > 1 ? isolated === s.key : undefined"
          class="ui-toggle inline-flex items-center gap-1.5 rounded-control border px-2"
          :class="[
            controlHeightClass.xs,
            isolated === s.key
              ? 'border-border bg-surface-muted text-fg'
              : 'border-transparent text-fg-muted enabled:hover:bg-surface-muted',
          ]"
          @click="series.length > 1 && isolate(s.key)"
        >
          <span
            class="w-3 rounded-pill"
            :class="[
              s.color,
              s.dashed ? 'border-t-2 border-dashed border-current' : 'h-0.5 bg-current',
            ]"
            aria-hidden="true"
          />
          {{ s.label }}
          <span v-if="s.total !== false" class="font-medium tabular-nums text-fg">
            {{ formatChartValue(tr, totalOf(s.values), format) }}
          </span>
        </component>
      </div>
      <!-- In a one-pixel box of its own: a table is never narrower than its longest cell, so as
           the box itself its width would widen a phone's page. -->
      <div class="sr-only">
        <table>
          <caption>
            {{
              ariaLabel
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ t('grani.chart.when') }}</th>
              <th v-for="s in drawn" :key="s.key" scope="col">{{ s.label }}</th>
              <th v-if="tooltipTotal" scope="col">{{ tooltipTotal.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(_, i) in x" :key="i">
              <th scope="row">{{ pointTitle(i) }}</th>
              <td v-for="s in drawn" :key="s.key">
                {{ formatChartValue(tr, s.values[i], format) }}
              </td>
              <td v-if="tooltipTotal">{{ formatChartValue(tr, sumAt(i), format) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <p aria-live="polite" class="sr-only">{{ cursor.announcement.value }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useChartCursor } from '../composables/useChartCursor'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import {
  chartDateLabels,
  chartDateLong,
  formatChartTicks,
  formatChartValue,
  type ChartFormat,
  type ChartGrain,
} from '../utils/chartFormat'
import { areaPath, linePath, type ChartCurve } from '../utils/chartPath'
import {
  crowdedLabels,
  labelStep,
  linearScale,
  placedLabels,
  pointPosition,
  tickCount,
} from '../utils/chartScale'
import type { DateValue } from '../utils/dateValue'
import { isFiniteNumber } from '../utils/scale'
import { controlHeightClass } from '../utils/controlSize'
import {
  CHART_BLEED,
  CHART_EMPTY,
  CHART_FLOOR,
  CHART_SKELETON,
  FLOOR_PAD,
  GUTTER_PAD,
} from '../utils/surface'
import UiNoData from './UiNoData.vue'
import UiSkeleton from './UiSkeleton.vue'

export interface AreaSeries {
  /** Tells series apart: the legend, the isolation, the tooltip total's `of`. */
  key: string
  /** The name in the legend, the tooltip and the table. */
  label: string
  /** One value per point of `x`; `null` is no data, a gap. */
  values: (number | null)[]
  /** `area` is filled to zero, `line` only drawn. */
  variant?: 'area' | 'line'
  /** A figure of another kind drawn over the rest: a profit over revenue. */
  dashed?: boolean
  /** The series total in the legend; `false` for a figure a sum means nothing for (a margin). */
  total?: boolean
  /** Drawn in the gray of what is left over, behind the rest: a period to compare with. It takes no chart color. */
  muted?: boolean
}

const props = withDefaults(
  defineProps<{
    /** The time axis: one date per point, `2026-09` a month, `2026-09-24` a day; text that is not a date stays as it is. */
    x: DateValue[]
    /** The series, in the order they take the chart colors, five at most. Each is `key`, `label` and `values`; `variant: 'line'` draws it unfilled, `dashed` for a figure of another kind, `total: false` keeps its sum out of the legend. */
    series: AreaSeries[]
    /** What the chart shows, for a screen reader: "Spending and income by month". */
    ariaLabel: string
    /** What one point stands for: the labels and the tooltip read the dates by it; `weekday` names a day of one week, "Tue". */
    grain?: ChartGrain
    /** How values read in the legend, the tooltip and the table; `money` writes the currency code after the digits, `1,234.00 USD`. The axis prints compact figures (or percents) without the unit. */
    format?: ChartFormat
    /** `smooth` bends through the points without passing them, `linear` joins them, `step` holds each value. */
    curve?: ChartCurve
    /** The height in pixels, the time axis included; the legend is below it. */
    height?: number
    /** The value axis with its grid; off for a chart that only shows a shape. */
    yAxis?: boolean
    /** The legend with each series' total, a press shows one series alone. */
    legend?: boolean
    /** A sum of some series under them in the tooltip and the table: `{ label: 'Revenue', of: ['orders', 'events'] }`. */
    tooltipTotal?: { label: string; of: string[] }
    /** The last point is a period still going: its segment is dashed, its label and tooltip say so. */
    partial?: boolean
    /** The index of the point in light, the one the card's headline speaks of: a dot on each series there. */
    highlight?: number
  }>(),
  {
    grain: 'month',
    format: 'number',
    curve: 'smooth',
    height: 240,
    yAxis: true,
    legend: true,
    tooltipTotal: undefined,
    partial: false,
    highlight: undefined,
  },
)

const tr = useUiT()
const { t } = tr
const uid = `ui-area-${useId()}`
const loading = inject(CHART_SKELETON, null)
const nothing = inject(CHART_EMPTY, null)
// Nothing to draw holds the first load's shape, still, for the card to hide under its words.
const empty = computed(() => nothing?.value ?? false)
const skeleton = computed(() => (loading?.value ?? false) || empty.value)
// No card around it and not one value to draw: the chart says so itself.
const blank = computed(
  () => !nothing && !props.series.some((s) => s.values.some((v) => isFiniteNumber(v))),
)
// Bled to the card's sides, the words keep to its gutter: the legend padded, the axis's ends inset.
const bleed = inject(CHART_BLEED, null)
const gutter = computed(() => bleed?.value ?? null)
const inset = computed(() => (gutter.value ? GUTTER_PAD[gutter.value] : ''))
const edge = computed(() => {
  const g = gutter.value
  return g ? (g === 'field' ? '0.75rem' : `var(--space-${g})`) : '0px'
})
// On the card's floor the legend keeps the gutter above the card's edge.
const onFloor = inject(CHART_FLOOR, null)
const floor = computed(() => Boolean(gutter.value) && (onFloor?.value ?? false))
// A value axis would stand on the card's edge: a bled chart has none.
const axis = computed(() => props.yAxis && !gutter.value)
// The ghost of a line for the first load: a gentle rise, drawn with the chart's own curve.
const GHOST_Y = [62, 55, 58, 46, 50, 40, 44, 34, 38, 30]
const GHOST_X = GHOST_Y.map((_, i) => (i / (GHOST_Y.length - 1)) * 100)

const COLORS = ['text-chart-1', 'text-chart-2', 'text-chart-3', 'text-chart-4', 'text-chart-5']
// Colors go by the order given, a muted series taking none, and stay when one series stands alone.
const drawn = computed(() => {
  let order = 0
  return props.series.map((s, index) => ({
    ...s,
    index,
    color: s.muted ? 'text-chart-other' : (COLORS[order++] ?? 'text-chart-other'),
  }))
})
// A highlight outside the points lights nothing.
const lit = computed(
  () =>
    props.highlight !== undefined &&
    Number.isInteger(props.highlight) &&
    props.highlight >= 0 &&
    props.highlight < props.x.length,
)

const isolated = ref<string | null>(null)
// One series left, or the isolated one gone: nothing to isolate, and the legend could not release it.
watch(
  () => props.series.map((s) => s.key).join('\u0000'),
  () => {
    if (
      isolated.value &&
      (props.series.length < 2 || !props.series.some((s) => s.key === isolated.value))
    )
      isolated.value = null
  },
)
const isolate = (key: string) => (isolated.value = isolated.value === key ? null : key)
const shown = computed(() =>
  isolated.value ? drawn.value.filter((s) => s.key === isolated.value) : drawn.value,
)
// A muted series is painted first, so the colored ones stand over it; the legend keeps the order given.
const painted = computed(() =>
  [...shown.value].sort((a, b) => Number(Boolean(b.muted)) - Number(Boolean(a.muted))),
)

// The axis reaches every value shown: a loss is the thing a profit line most has to say.
const scale = computed(() =>
  linearScale(
    shown.value.flatMap((s) => s.values),
    {
      count: tickCount(props.height - 24),
      zero: axis.value || shown.value.some((s) => s.variant !== 'line'),
    },
  ),
)
const axisLabels = computed(() => formatChartTicks(tr, scale.value.ticks, props.format))
const crossesZero = computed(() => scale.value.domain[0] < 0 && scale.value.domain[1] > 0)
const y = (v: number) => (1 - scale.value.at(v)) * 100
const base = computed(() => y(Math.min(Math.max(0, scale.value.domain[0]), scale.value.domain[1])))
const xs = computed(() => props.x.map((_, i) => pointPosition(i, props.x.length) * 100))
const ys = (values: (number | null)[]) => values.map((v) => (isFiniteNumber(v) ? y(v) : null))
const last = computed(() => props.x.length - 1)
// The settled part ends a point early; the tail is the last two points alone, drawn dashed.
const settled = (values: (number | null)[]) => values.map((v, i) => (i === last.value ? null : v))
const tail = (values: (number | null)[]) => values.map((v, i) => (i >= last.value - 1 ? v : null))
// A point that no line reaches: gaps on both sides, or the last one of a `partial` with a gap before it.
const lonely = (values: (number | null)[]) => {
  const drawnIn = (j: number) => isFiniteNumber(values[j]) && !(props.partial && j === last.value)
  const tailDrawn =
    props.partial && isFiniteNumber(values[last.value]) && isFiniteNumber(values[last.value - 1])
  return values.flatMap((v, i) => {
    if (!isFiniteNumber(v)) return []
    if (tailDrawn && i >= last.value - 1) return []
    if (props.partial && i === last.value) return [i]
    return drawnIn(i - 1) || drawnIn(i + 1) ? [] : [i]
  })
}

// No value at all is no total, a dash, as a gap is: never a zero the data did not say.
const totalOf = (values: (number | null)[]) => {
  const known = values.filter(isFiniteNumber)
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}
const summing = computed(() => Boolean(props.tooltipTotal) && !isolated.value)
const sumAt = (i: number) => {
  const parts = props.series
    .filter((s) => props.tooltipTotal?.of.includes(s.key))
    .map((s) => s.values[i])
    .filter(isFiniteNumber)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}

const ongoing = (i: number) => props.partial && i === last.value
const pointTitle = (i: number) => {
  const when = chartDateLong(tr, props.x[i] ?? '', props.grain)
  return ongoing(i) ? `${when} · ${t('grani.chart.ongoing')}` : when
}
const labels = computed(() =>
  chartDateLabels(tr, props.x, props.grain, shows).map((l, i) =>
    ongoing(i) ? `${l} · ${t('grani.chart.ongoing')}` : l,
  ),
)

// The server knows no width: it prints every label, and a narrow screen only takes some away.
const plot = ref<HTMLElement>()
const width = ref(0)
const tickLabels = ref<HTMLElement[]>([])
const labelWidths = ref<number[]>([])
// The gutter is a length in CSS (a space token); a probe as wide as it reads it in pixels.
const edgePx = ref(0)
// The year moves to whichever label is shown first, so the labels' widths follow the step: the step
// only grows until the width changes, and settles instead of swinging between two.
const held = ref(1)
const step = computed(() =>
  Math.max(held.value, labelStep(width.value, labelWidths.value, 12, edgePx.value, true)),
)
watch(step, (s) => (held.value = s))
// New points are new labels: the step is worked out afresh, not held from the old ones.
watch([() => props.x, () => props.grain, () => props.partial], () => (held.value = 1))
// Thinned from the newest: the point the reader looks for first always has its label.
const shows = (i: number) => (last.value - i) % step.value === 0
// The shown labels that still run into the next one or out of the plot, as they stand.
const crowded = ref(new Set<number>())
const measure = () => {
  labelWidths.value = tickLabels.value.map((el) => el.offsetWidth)
  crowded.value = crowdedLabels(placedLabels(tickLabels.value, plot.value, shows), width.value)
  const el = plot.value
  if (!el || edge.value === '0px') return (edgePx.value = 0)
  const probe = document.createElement('div')
  probe.style.cssText = `position:absolute;visibility:hidden;width:${edge.value}`
  el.appendChild(probe)
  edgePx.value = probe.offsetWidth
  probe.remove()
}
let observer: ResizeObserver | undefined
// The plot is not there while a card loads: the observer follows it in and out.
watch(
  plot,
  (el) => {
    observer?.disconnect()
    if (!el || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.width ?? 0
      if (next !== width.value) held.value = 1
      width.value = next
      measure()
    })
    observer.observe(el)
  },
  { flush: 'post' },
)
onBeforeUnmount(() => observer?.disconnect())
watch([labels, edge], () => nextTick(measure))
// The ends stand on the plot's edges, or on the gutter when the card bleeds the chart.
const labelLeft = (i: number) => {
  const offset = axis.value ? '3rem' : '0px'
  if (last.value > 0 && i === 0) return `calc(${offset} + ${edge.value})`
  if (last.value > 0 && i === last.value) return `calc(100% - ${edge.value})`
  return `calc(${offset} + (100% - ${offset}) * ${(xs.value[i] ?? 0) / 100})`
}
// The ends stand inside the plot: a centered first label would run into the value axis.
const anchor = (i: number) =>
  last.value === 0
    ? '-translate-x-1/2'
    : i === 0
      ? ''
      : i === last.value
        ? '-translate-x-full'
        : '-translate-x-1/2'
// A chart bled to the card's sides has its ends on the card's edge: a dot there stands inside it,
// off its point by its radius, rather than cut in half by the edge.
const dotAt = (i: number) =>
  gutter.value && last.value > 0 && i === 0
    ? ''
    : gutter.value && last.value > 0 && i === last.value
      ? '-translate-x-full'
      : '-translate-x-1/2'
// The tooltip stands on the side with more room, and never wider than that half: it wraps instead.
const tipAt = (at: number) =>
  at > 50 ? { right: `calc(${100 - at}% + 0.75rem)` } : { left: `calc(${at}% + 0.75rem)` }

const cursor = useChartCursor({
  count: computed(() => props.x.length),
  describe: (i) => {
    const parts = shown.value.map(
      (s) => `${s.label} ${formatChartValue(tr, s.values[i], props.format)}`,
    )
    if (summing.value)
      parts.push(`${props.tooltipTotal!.label} ${formatChartValue(tr, sumAt(i), props.format)}`)
    return `${pointTitle(i)}: ${parts.join(', ')}`
  },
})
const active = cursor.index

// Past this many points the plot turns slow (measured above).
const POINT_CEILING = 500
let warnedMany = false
if (isDev())
  watch(
    () => [props.x.length, props.series],
    () => {
      if (!warnedMany && props.x.length > POINT_CEILING) {
        warnedMany = true
        console.warn(
          `[grani] UiAreaChart: ${props.x.length} points; past ${POINT_CEILING} points the chart draws an element for each and turns slow. Group the days into weeks or months.`,
        )
      }
      const colored = props.series.filter((s) => !s.muted).length
      if (colored > COLORS.length)
        console.warn(
          `[grani] UiAreaChart: ${colored} series in color; five read apart, put the rest into one.`,
        )
      const keys = props.series.map((s) => s.key)
      if (new Set(keys).size !== keys.length)
        console.warn(
          '[grani] UiAreaChart: two series share a key; the legend cannot tell them apart.',
        )
      for (const s of props.series)
        if (s.values.length !== props.x.length)
          console.warn(
            `[grani] UiAreaChart: series "${s.key}" has ${s.values.length} values for ${props.x.length} points.`,
          )
    },
    { immediate: true },
  )
</script>
