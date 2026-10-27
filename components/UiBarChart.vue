<!--
  UiBarChart: values by period as bars. Take it for amounts per period rather than a flow over
  time, usually in the body of a UiChartCard.

  Data. `x` is the periods: dates that the library labels by `grain`, with the year on the first
  label shown and where it changes. Names that are not dates are categories: each keeps its label,
  cut to its band, and the tooltip says it whole. Each series is its `values` in that order. One
  series draws one bar per period; several stand side by side, or on top of each other with
  `stack` (the parts of a whole).

  Values. A `null` is no data yet: its place keeps a thin gray stub, never a zero bar. A zero keeps
  a sliver of its color on the zero line. A loss stands below the zero line. In a stack only values
  at zero or above are drawn and counted, so the stack's label, the legend total and the tooltip
  sum agree with the bars; a period of zeros is a sliver whose sum is 0.

  Emphasis. `highlight` lights one period or several and quiets the rest to a pale bar with a line
  at its height. `marks` draws a reference line (a plan), named under the chart. `labels="value"`
  prints the value over each period, thinned the same way as the axis labels.

  Legend. The legend names each series with its total; a press shows one series alone.
  `tooltipTotal` adds a sum under the series in the tooltip.

  In progress. `partial` says the newest period with data is still going: its bar is hatched and
  read as in progress, and the empty periods after it are dashed outlines, meaning still to come,
  not missing.

  Drawing. Bars are HTML boxes in bands, so their corners stay round at any width; the width
  changes only how many time-axis labels show. A label that would still run into the next one or
  out of the plot is left out; the newest always stays.

  Periods. Each period is a band, a bar per series and a row of the hidden table. Measured in
  Chromium (production build, two series): 500 periods draw about 7,000 elements and a pointer
  move reaches the screen within a frame or two; 1,000 take about 45 ms, 2,000 over 60 ms and
  10,000 over half a second. Past 500, group the days into weeks or months; in development the chart
  warns once.

  In a card. In a UiChartCard's body, under the headline, with a UiDelta in the card's actions; or
  alone in its host. In the card it draws pale bars on the first load and holds them still when
  there is nothing to draw. Alone, with no period or no value that is a number, it says "No data
  for this period" in its own place. When the card bleeds it, it keeps its words on the gutter, drops the
  value axis and draws the focus ring inside.

  Keyboard.
  The plot is one tab stop; an empty chart is no tab stop.
  On the plot:
  - `Tab`: reaches it; focus shows the newest period, or the one last visited.
  - `ArrowLeft` `ArrowRight`: step from period to period; each period is read out.
  - `Home` `End`: jump to the first and the last period; each period is read out.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
  On the legend, whose chips are buttons when there are two series or more:
  - `Tab`: reaches each chip.
  - `Enter` `Space`: shows that series alone; a second press shows all.
  A finger scrolls the page over the plot, and a tap keeps its period until a tap elsewhere.

  Reader.
  - Plot: an image named by `ariaLabel`.
  - Period: only a period reached by the keyboard is read, in a polite live region, as "September
    2026: Orders 1,240, Events 380", followed by the sum of `tooltipTotal`, and "in progress" for
    the period still going.
  - Table: a hidden table holds every period and every series, including a series shown alone;
    its caption is the chart's name and each mark ("Plan 1,100").
  - Legend: a group named "Series; press one to show it alone", each chip `aria-pressed`.
  - Hidden: the bars, the values over them, the tooltip and the marks' names.
  - Empty: alone, a group named by `ariaLabel` that says there is no data.

  States. Rest, a period under the pointer or the keys (the tooltip), one series alone, side by side
  and `stack`, a loss below the zero line, a zero as a sliver and a `null` as a gray stub, `highlight`
  with the rest quiet, `marks` named under the chart, `labels="value"`, `partial` with its hatched
  bar and the dashed periods to come, nothing to draw alone. In a UiChartCard: its first load as pale bars, nothing to draw
  held still, a refresh dimmed by the card, bled to the sides without a value axis.

  Not for.
  - A flow over time: UiAreaChart.
  - The parts of a whole at one moment: UiDonutChart.
  - A trend with no axes beside a number: UiSparkline `bar`.
  - The card with its title, headline and data states: UiChartCard around it.
-->
<template>
  <div class="w-full min-w-0">
    <!-- The first load draws the chart's own shape: pale bars where the bars will be. -->
    <div v-if="skeleton" aria-hidden="true">
      <div class="relative pb-6" :class="axis ? 'ps-12' : ''" :style="{ height: `${height}px` }">
        <div class="flex h-full items-end gap-2" :class="inset">
          <UiSkeleton
            v-for="(h, i) in GHOST"
            :key="i"
            class="min-w-0 flex-1 rounded-b-none"
            :class="empty ? '!animate-none' : ''"
            :style="{ height: `${h}%` }"
          />
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
        <!-- The gutter is outside the plot: the pointer maps onto the bands alone. -->
        <div class="h-full" :class="inset">
          <div
            ref="plot"
            class="relative h-full touch-pan-y rounded-control"
            :class="gutter ? 'focus-visible:!shadow-(--ui-ring-inset)' : ''"
            :tabindex="x.length ? 0 : undefined"
            role="img"
            :aria-label="ariaLabel"
            v-on="cursor.handlers"
          >
            <div class="relative h-full">
              <template v-if="axis">
                <span
                  v-for="tick in scale.ticks"
                  :key="tick"
                  class="absolute inset-x-0 border-t"
                  :class="
                    tick === 0 && crossesZero ? 'border-fg-subtle' : 'border-dashed border-border'
                  "
                  :style="{ top: `${y(tick)}%` }"
                />
              </template>
              <span
                v-else-if="crossesZero"
                class="absolute inset-x-0 border-t border-fg-subtle"
                :style="{ top: `${y(0)}%` }"
              />
              <!-- A band per period; its bars take 64% of it, so the space between grows with them. -->
              <div class="absolute inset-0">
                <div
                  v-for="(_, i) in x"
                  :key="i"
                  class="absolute top-0 flex h-full justify-center"
                  :style="band(i)"
                >
                  <div class="relative flex h-full w-[64%] max-w-16 gap-px">
                    <!-- A period still to come is a dashed outline, no data in the past a gray stub. -->
                    <span
                      v-if="noData(i)"
                      class="absolute inset-x-0 h-1 rounded-t-badge"
                      :class="ahead(i) ? 'border border-dashed border-border-strong' : 'bg-border'"
                      :style="{ top: `calc(${y(0)}% - 0.25rem)` }"
                      :data-ahead="ahead(i) || undefined"
                    />
                    <template v-else-if="stack">
                      <span class="relative h-full flex-1">
                        <span
                          v-for="seg in segments(i)"
                          :key="seg.key"
                          class="absolute inset-x-0 overflow-hidden motion-safe:transition-[top,height]"
                          :class="[seg.color, seg.top ? 'rounded-t-control' : '']"
                          :style="seg.style"
                          data-bar
                        >
                          <span
                            class="absolute inset-0 bg-current"
                            :class="quiet(i) ? 'opacity-30' : ''"
                          />
                          <span v-if="quiet(i)" class="absolute inset-x-0 top-0 h-0.5 bg-current" />
                          <span
                            v-if="going(i)"
                            class="absolute inset-0 bg-surface/60 [mask-image:repeating-linear-gradient(135deg,transparent_0_3px,currentColor_3px_6px)]"
                            data-ongoing
                          />
                        </span>
                      </span>
                    </template>
                    <template v-else>
                      <span v-for="s in shown" :key="s.key" class="relative h-full min-w-0 flex-1">
                        <!-- A quiet bar is pale with a line at its height: the line keeps the value at full contrast. -->
                        <span
                          v-if="isFiniteNumber(s.values[i])"
                          class="absolute inset-x-0 overflow-hidden motion-safe:transition-[top,height]"
                          :class="[
                            s.color,
                            s.values[i]! < 0 ? 'rounded-b-control' : 'rounded-t-control',
                          ]"
                          :style="bar(s.values[i]!)"
                          data-bar
                        >
                          <span
                            class="absolute inset-0 bg-current"
                            :class="quiet(i) ? 'opacity-30' : ''"
                          />
                          <span
                            v-if="quiet(i)"
                            class="absolute inset-x-0 h-0.5 bg-current"
                            :class="s.values[i]! < 0 ? 'bottom-0' : 'top-0'"
                          />
                          <!-- The period still going is hatched: it is short because it is not over, not because it fell. -->
                          <span
                            v-if="going(i)"
                            class="absolute inset-0 bg-surface/60 [mask-image:repeating-linear-gradient(135deg,transparent_0_3px,currentColor_3px_6px)]"
                            data-ongoing
                          />
                        </span>
                      </span>
                    </template>
                    <span
                      v-if="labels === 'value' && !noData(i) && (shows(i) || lights.has(i))"
                      class="absolute inset-x-0 whitespace-nowrap text-center text-xs/4.5 tabular-nums text-fg-muted"
                      :class="peak(i) < 0 ? 'pt-1' : '-translate-y-full pb-1'"
                      :style="{ top: `${labelTop(i)}%` }"
                      aria-hidden="true"
                    >
                      {{ formatChartValue(tr, peak(i), format, { compact: true }) }}
                    </span>
                  </div>
                </div>
              </div>
              <template v-for="mark in marks" :key="`${mark.label}:${mark.at}`">
                <span
                  class="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg-muted"
                  :style="{ top: `${y(mark.at)}%` }"
                />
              </template>
              <div
                v-if="active !== null"
                class="pointer-events-none absolute top-0 z-tooltip w-max max-w-[calc(50%-0.75rem)] rounded-overlay border border-border bg-surface px-3 py-2 text-xs/4.5 shadow-lg"
                :style="tipAt(center(active))"
                aria-hidden="true"
              >
                <p class="mb-1 text-fg-muted">{{ pointTitle(active) }}</p>
                <p v-for="s in shown" :key="s.key" class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-1.5 text-fg">
                    <span class="h-2.5 w-1 rounded-badge bg-current" :class="s.color" />{{
                      s.label
                    }}
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
                  <span class="tabular-nums">{{
                    formatChartValue(tr, sumAt(active), format)
                  }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          class="absolute inset-x-0 bottom-0"
          :class="[axis ? 'ps-12' : '', inset]"
          aria-hidden="true"
        >
          <span class="relative block h-4.5">
            <span
              v-for="(text, i) in labelsX"
              :key="i"
              class="absolute top-0 flex"
              :class="labelAlign(i)"
              :style="band(i)"
            >
              <!-- A category is cut to its band rather than dropped: the bar's tooltip says it whole. -->
              <span
                ref="tickLabels"
                :data-label="i"
                class="whitespace-nowrap text-xs/4.5 text-fg-muted"
                :class="[
                  shows(i) && !crowded.has(i) ? '' : 'invisible',
                  categories ? 'min-w-0 truncate' : '',
                ]"
                >{{ text }}</span
              >
            </span>
          </span>
        </div>
      </div>
      <!-- A line of reference is named here, under the chart, where no bar or value can stand on its name. -->
      <div
        v-if="legend || marks.length"
        class="mt-3 flex flex-wrap gap-x-1 gap-y-1 text-xs/4.5"
        :class="[inset, floor ? FLOOR_PAD[gutter ?? 'surface'] : '']"
        :role="legend && series.length > 1 ? 'group' : undefined"
        :aria-label="legend && series.length > 1 ? t('grani.chart.legend') : undefined"
      >
        <component
          :is="series.length > 1 ? 'button' : 'span'"
          v-for="s in legend ? drawn : []"
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
          <span class="h-2.5 w-2.5 rounded-badge bg-current" :class="s.color" aria-hidden="true" />
          {{ s.label }}
          <span v-if="s.total !== false" class="font-medium tabular-nums text-fg">
            {{ formatChartValue(tr, totalOf(s.values), format) }}
          </span>
        </component>
        <span
          v-for="mark in marks"
          :key="`${mark.label}:${mark.at}`"
          class="inline-flex items-center gap-1.5 px-2 text-fg-muted"
          :class="controlHeightClass.xs"
          aria-hidden="true"
          data-mark
        >
          <span class="w-3 border-t border-dashed border-fg-muted" />
          {{ mark.label }}
          <span class="font-medium tabular-nums text-fg">{{ markValue(mark.at) }}</span>
        </span>
      </div>
      <!-- In a one-pixel box of its own: a table is never narrower than its longest cell, so as
           the box itself its width would widen a phone's page. -->
      <div class="sr-only">
        <table>
          <caption>
            {{
              caption
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
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useChartCursor } from '../composables/useChartCursor'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import {
  chartDateLabels,
  parseChartDate,
  chartDateLong,
  formatChartTicks,
  formatChartValue,
  type ChartFormat,
  type ChartGrain,
} from '../utils/chartFormat'
import { crowdedLabels, labelStep, linearScale, placedLabels, tickCount } from '../utils/chartScale'
import { controlHeightClass } from '../utils/controlSize'
import type { DateValue } from '../utils/dateValue'
import { isFiniteNumber } from '../utils/scale'
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

export interface BarSeries {
  /** Tells series apart: the legend, the isolation, the tooltip total's `of`. */
  key: string
  /** The name in the legend, the tooltip and the table. */
  label: string
  /** One value per period of `x`; `null` is no data yet. */
  values: (number | null)[]
  /** The series total in the legend; `false` for a figure a sum means nothing for. */
  total?: boolean
}

const props = withDefaults(
  defineProps<{
    /** The periods: one date each, `2026-09` a month, `2026-09-24` a day; text that is not a date stays as it is. */
    x: DateValue[]
    /** The series, in the order they take the chart colors, five at most; each is `key`, `label` and `values`. */
    series: BarSeries[]
    /** What the chart shows, for a screen reader: "Revenue by month". */
    ariaLabel: string
    /** What one period stands for: the labels and the tooltip read the dates by it; `weekday` names a day of one week, "Tue". */
    grain?: ChartGrain
    /** How values read in the legend, the tooltip and the table; `money` writes the currency code after the digits, `1,234.00 USD`. The axis prints compact figures without the unit. */
    format?: ChartFormat
    /** The height in pixels, the time axis included; the legend is below it. */
    height?: number
    /** The value axis with its grid; off for a chart that only shows a shape. */
    yAxis?: boolean
    /** The legend with each series' total, a press shows one series alone. */
    legend?: boolean
    /** The period in light, or several (the months that met a plan); the others go quiet. */
    highlight?: number | number[]
    /** The series stand one on another, the parts of a whole; without it they stand side by side. */
    stack?: boolean
    /** `value` prints the value over each period: the bar's, a stack's sum, or the tallest of bars side by side. */
    labels?: 'none' | 'value'
    /** Lines of reference across the plot, each at a value with a label: `[{ at: 1100, label: 'Plan' }]`. */
    marks?: { at: number; label: string }[]
    /** A sum of some series under them in the tooltip and the table: `{ label: 'Revenue', of: ['orders', 'events'] }`. */
    tooltipTotal?: { label: string; of: string[] }
    /** The newest period with data is still going: its bar is hatched, its tooltip and table say so, and the empty periods after it are to come. */
    partial?: boolean
  }>(),
  {
    grain: 'month',
    format: 'number',
    height: 200,
    yAxis: true,
    legend: true,
    highlight: undefined,
    stack: false,
    labels: 'none',
    marks: () => [],
    tooltipTotal: undefined,
    partial: false,
  },
)

const tr = useUiT()
const { t } = tr
const loading = inject(CHART_SKELETON, null)
const nothing = inject(CHART_EMPTY, null)
// Nothing to draw holds the first load's shape, still, for the card to hide under its words.
const empty = computed(() => nothing?.value ?? false)
const skeleton = computed(() => (loading?.value ?? false) || empty.value)
// No card around it and not one value to draw: the chart says so itself.
const blank = computed(
  () => !nothing && !props.series.some((s) => s.values.some((v) => isFiniteNumber(v))),
)
const GHOST = [46, 62, 54, 78, 66, 84, 72, 58]
// Bled to the card's sides, the words keep to its gutter and the bars stay inside it.
const bleed = inject(CHART_BLEED, null)
const gutter = computed(() => bleed?.value ?? null)
const inset = computed(() => (gutter.value ? GUTTER_PAD[gutter.value] : ''))
const onFloor = inject(CHART_FLOOR, null)
const floor = computed(() => Boolean(gutter.value) && (onFloor?.value ?? false))
// A value axis would stand on the card's edge: a bled chart has none.
const axis = computed(() => props.yAxis && !gutter.value)

const COLORS = ['text-chart-1', 'text-chart-2', 'text-chart-3', 'text-chart-4', 'text-chart-5']
// Colors go by the order given and stay when one series stands alone.
const drawn = computed(() =>
  props.series.map((s, index) => ({
    ...s,
    index,
    color: index < COLORS.length ? COLORS[index]! : 'text-chart-other',
  })),
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

// A stack is the parts of a whole: a value below zero has no place in it.
const stackSum = (i: number) =>
  shown.value.reduce((sum, s) => {
    const v = s.values[i]
    return sum + (isFiniteNumber(v) && v > 0 ? v : 0)
  }, 0)
// The top of what stands at a period: a stack's sum, or the tallest bar side by side.
const peak = (i: number) => {
  if (props.stack) return stackSum(i)
  const values = shown.value.map((s) => s.values[i]).filter(isFiniteNumber)
  return values.length ? values.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a)) : 0
}
// In a stack only what stands at zero or above has a place: a zero is a value, drawn as nothing
// over the line, and only a period with no such value is no data there.
const counts = (v: number | null | undefined): v is number =>
  isFiniteNumber(v) && (!props.stack || v >= 0)
const noData = (i: number) => shown.value.every((s) => !counts(s.values[i]))

// Bars stand on zero; room is kept over the tallest for its printed value.
const scale = computed(() => {
  const room = props.labels === 'value' ? 1.18 : 1
  const values = props.stack
    ? props.x.map((_, i) => stackSum(i) * room)
    : shown.value.flatMap((s) => s.values.map((v) => (isFiniteNumber(v) ? v * room : null)))
  return linearScale([...values, ...props.marks.map((m) => m.at)], {
    count: tickCount(props.height - 24),
  })
})
const axisLabels = computed(() => formatChartTicks(tr, scale.value.ticks, props.format))
const crossesZero = computed(() => scale.value.domain[0] < 0 && scale.value.domain[1] > 0)
const y = (v: number) => (1 - scale.value.at(v)) * 100
// A bar runs from the zero line to its value, up for a gain and down for a loss.
// A zero keeps a sliver of its color on the line: a value, not the gray stub of no data.
const bar = (v: number) => {
  const zero = y(0)
  const size = `${Math.abs(zero - y(v))}%`
  return v < 0
    ? { top: `${zero}%`, height: size, minHeight: '2px' }
    : { bottom: `${100 - zero}%`, height: size, minHeight: '2px' }
}
// The stack's segments, bottom up; the last one with a value carries the rounded top.
// A period of zeros keeps a sliver of its first series' color on the line, as a zero bar does.
const segments = (i: number) => {
  let below = 0
  const parts = shown.value.flatMap((s) => {
    const v = s.values[i]
    if (!isFiniteNumber(v) || v <= 0) return []
    const from = y(below + v)
    const size = y(below) - from
    below += v
    return [
      { key: s.key, color: s.color, style: { top: `${from}%`, height: `${size}%` }, top: false },
    ]
  })
  const zero = shown.value.find((s) => s.values[i] === 0)
  if (!parts.length && zero)
    parts.push({
      key: zero.key,
      color: zero.color,
      style: { top: `calc(${y(0)}% - 2px)`, height: '2px' },
      top: false,
    })
  if (parts.length) parts[parts.length - 1]!.top = true
  return parts
}
// Over a gain's end, under a loss's.
const labelTop = (i: number) => y(peak(i))
// The periods in light; one outside the periods lights nothing, so nothing goes quiet either.
const lights = computed(() => {
  const given = props.highlight === undefined ? [] : [props.highlight].flat()
  return new Set(given.filter((h) => Number.isInteger(h) && h >= 0 && h < props.x.length))
})
const lit = computed(() => lights.value.size > 0)
const quiet = (i: number) => lit.value && !lights.value.has(i)
// A line of reference reads as the values over the bars do: short when they are printed, whole otherwise.
const markValue = (at: number) =>
  formatChartValue(tr, at, props.format, { compact: props.labels === 'value' })

// No value at all is no total, a dash, as a gap is: never a zero the data did not say.
const totalOf = (values: (number | null)[]) => {
  const known = values.filter(counts)
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}
const summing = computed(() => Boolean(props.tooltipTotal) && !isolated.value)
const sumAt = (i: number) => {
  const parts = props.series
    .filter((s) => props.tooltipTotal?.of.includes(s.key))
    .map((s) => s.values[i])
    .filter(counts)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}

// The marks are said with the name: a plan is part of what the chart shows.
const caption = computed(() =>
  [
    props.ariaLabel,
    ...props.marks.map((m) => `${m.label} ${formatChartValue(tr, m.at, props.format)}`),
  ].join('. '),
)
// The period still going is the newest one with data; the empty ones after it have not come yet.
const ongoingAt = computed(() => {
  if (!props.partial) return -1
  for (let i = props.x.length - 1; i >= 0; i--) if (!noData(i)) return i
  return -1
})
const going = (i: number) => i === ongoingAt.value
const ahead = (i: number) => ongoingAt.value >= 0 && i > ongoingAt.value
const pointTitle = (i: number) => {
  const when = chartDateLong(tr, props.x[i] ?? '', props.grain)
  return going(i) ? `${when} · ${t('grani.chart.ongoing')}` : when
}
// Periods that are not dates are categories: every one keeps a label, cut to its band.
const categories = computed(() => props.x.some((p) => parseChartDate(p) === null))
const labelsX = computed(() => chartDateLabels(tr, props.x, props.grain, shows))
const last = computed(() => props.x.length - 1)

// The server knows no width: it prints every label, and a narrow screen only takes some away.
const plot = ref<HTMLElement>()
const width = ref(0)
const tickLabels = ref<HTMLElement[]>([])
const labelWidths = ref<number[]>([])
// A band holds its label when the label is narrower than the band: labels stand one per band.
// The year moves to whichever label is shown first, so the labels' widths follow the step: the step
// only grows until the width changes, and settles instead of swinging between two.
const held = ref(1)
const step = computed(() => {
  if (categories.value) return 1
  const band = props.x.length ? width.value / props.x.length : 0
  const widest = Math.max(0, ...labelWidths.value)
  if (!band || !widest) return 1
  return Math.max(
    held.value,
    Math.ceil((widest + 8) / band),
    labelStep(width.value, labelWidths.value, 12, 0, true),
  )
})
watch(step, (s) => (held.value = s))
// New points are new labels: the step is worked out afresh, not held from the old ones.
watch([() => props.x, () => props.grain, () => props.partial], () => (held.value = 1))
// Thinned from the newest: the period the reader looks for first always has its label.
const shows = (i: number) => (last.value - i) % step.value === 0
// A label wider than its band at either end keeps to the plot: the first starts on its edge,
// the last ends on it, rather than running past the chart into the page.
const labelAlign = (i: number) => {
  const band = props.x.length ? width.value / props.x.length : 0
  const wide = (labelWidths.value[i] ?? 0) > band
  if (!wide || last.value === 0) return 'justify-center'
  return i === 0 ? 'justify-start' : i === last.value ? 'justify-end' : 'justify-center'
}
// The shown labels that still run into the next one or out of the plot, as they stand.
const crowded = ref(new Set<number>())
const measure = () => {
  labelWidths.value = tickLabels.value.map((el) => el.offsetWidth)
  // A category is cut to its band rather than dropped: no band's label runs into the next.
  crowded.value = categories.value
    ? new Set()
    : crowdedLabels(placedLabels(tickLabels.value, plot.value, shows), width.value)
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
watch(labelsX, () => nextTick(measure))

const center = (i: number) => ((i + 0.5) / Math.max(1, props.x.length)) * 100
// Each band is placed by its own share of the plot, not grown as one of a row of flex items: a
// browser that rounds every item (WebKit, to 1/64 px) carried thousands of them 50px past the plot.
const band = (i: number) => {
  const n = Math.max(1, props.x.length)
  return { insetInlineStart: `${(i / n) * 100}%`, width: `${100 / n}%` }
}
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
  bands: true,
})
const active = cursor.index

// Past this many periods the plot turns slow (measured above).
const POINT_CEILING = 500
let warnedMany = false
if (isDev())
  watch(
    () => [props.x.length, props.series, props.stack],
    () => {
      if (!warnedMany && props.x.length > POINT_CEILING) {
        warnedMany = true
        console.warn(
          `[grani] UiBarChart: ${props.x.length} periods; past ${POINT_CEILING} periods the chart draws an element for each and turns slow. Group the days into weeks or months.`,
        )
      }
      if (props.series.length > COLORS.length)
        console.warn(
          `[grani] UiBarChart: ${props.series.length} series; five read apart, put the rest into one.`,
        )
      const keys = props.series.map((s) => s.key)
      if (new Set(keys).size !== keys.length)
        console.warn(
          '[grani] UiBarChart: two series share a key; the legend cannot tell them apart.',
        )
      for (const s of props.series) {
        if (s.values.length !== props.x.length)
          console.warn(
            `[grani] UiBarChart: series "${s.key}" has ${s.values.length} values for ${props.x.length} periods.`,
          )
        if (props.stack && s.values.some((v) => isFiniteNumber(v) && v < 0))
          console.warn(
            `[grani] UiBarChart: series "${s.key}" has a value below zero in a stack; a stack leaves it out.`,
          )
      }
    },
    { immediate: true },
  )
</script>
