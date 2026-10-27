<!--
  UiDonutChart: the parts of a whole as a ring, with the total in the middle. Take it for a
  breakdown at one moment.

  Parts. Each part is a `key`, a `label` and a `value`, drawn clockwise from twelve o'clock in the
  order given, so the caller sorts them. Colors follow that order, five at most: past five, the
  fifth part is "Other", the sum of the rest, in the gray used for leftovers.

  Small values. A part that is not a positive number takes no room and shows 0%. A real part under
  half a percent shows "<1%" and an arc no thinner than the gap between arcs. A whole of nothing
  is the bare ring with a total of 0; no data at all is a dash.

  Legend. The legend stands beside the ring, or under it when the host is narrow, and gives each
  part its value and its share.

  Shown part. A shown part widens, and the middle says its name, value and share, sized to fit the
  hole; a figure too long for it is written short there ("5.3T"), whole in the legend and the table;
  a `format` function is asked for that short figure with `{ compact: true }`. The pointer over a part or its legend row shows that part, and a tap keeps it shown until
  a tap elsewhere.

  In a card. In a UiChartCard it draws a pale ring on the card's first load and holds it still
  when there is nothing to draw. When the card bleeds it, the legend keeps to the gutter.

  Placement. In a UiChartCard's body, under its headline or in place of one, since the total
  is in the ring; or alone in a page section.

  Keyboard.
  The ring is one tab stop; an empty ring is no tab stop.
  - `Tab`: reaches the ring; focus shows the first part.
  - `ArrowLeft` `ArrowRight`: step through the parts, stopping at the first and the last; each
    part is read out.
  - `Home` `End`: jump to the first and the last part; each part is read out.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
  A tap on an arc or a legend row shows that part and hands the focus to the ring, so it stays
  until a tap elsewhere; the legend takes no focus of its own.

  Reader.
  - Ring: an image named by `ariaLabel`.
  - Part: a part reached by the keyboard is read in a polite live region as "Groceries: 1,240,
    34%".
  - Table: a hidden table, captioned with the chart's name, holds every part with its value and
    share, each part folded into Other on a row of its own ("Other: Taxi"), and the total in its
    footer.
  - Hidden: the middle of the ring and the legend, since the table says the same.

  States. Rest with the total in the middle, a part shown (it widens, the middle says its name,
  value and share, its legend row is marked), more than five parts with Other, a part of nothing at
  0%, a real part under half a percent as "<1%", a whole of nothing as the bare ring and 0, no data
  at all as a dash; with and without the legend, which goes under the ring when the host is narrow.
  In a UiChartCard: its first load as a pale ring, nothing to draw held still, a refresh dimmed by
  the card.

  Not for.
  - The parts period by period: UiBarChart with `stack`.
  - One share of a whole: UiProgress.
  - A flow over time: UiAreaChart.
  - The card with its title and data states: UiChartCard around it.
-->
<template>
  <div class="w-full min-w-0">
    <!-- The first load draws the chart's own shape: a pale ring, bars where the legend's rows will be. -->
    <div
      v-if="skeleton"
      class="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
      :class="[inset, floor ? FLOOR_PAD[gutter ?? 'surface'] : '']"
      aria-hidden="true"
    >
      <div
        class="shrink-0 rounded-pill border-skeleton"
        :class="empty ? '' : 'ui-skeleton animate-pulse'"
        :style="{ width: `${height}px`, height: `${height}px`, borderWidth: `${ghostBand}px` }"
      />
      <!-- lint: spacing-scale-ok: bars in place of the legend's lines, at the pitch of its rows -->
      <div v-if="legend" class="flex min-w-40 flex-1 flex-col gap-3">
        <UiSkeleton v-for="i in Math.min(parts.length || 3, 5)" :key="i" class="h-3 w-full" />
      </div>
    </div>
    <div
      v-else
      class="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
      :class="[inset, floor ? FLOOR_PAD[gutter ?? 'surface'] : '']"
    >
      <div
        ref="ringEl"
        class="relative shrink-0 touch-pan-y rounded-pill"
        :style="{ width: `${height}px`, height: `${height}px` }"
        :tabindex="parts.length ? 0 : undefined"
        role="img"
        :aria-label="ariaLabel"
        @focus="cursor.handlers.focus"
        @blur="cursor.handlers.blur"
        @keydown="cursor.handlers.keydown"
        @pointerdown="press"
        @pointermove="point"
        @pointerleave="cursor.handlers.pointerleave"
      >
        <!-- lint: inline-svg-ok -->
        <svg
          class="absolute inset-0 h-full w-full overflow-visible"
          viewBox="-50 -50 100 100"
          aria-hidden="true"
        >
          <circle
            v-if="!drawnArcs"
            :r="(INNER + OUTER) / 2"
            fill="none"
            class="text-border"
            stroke="currentColor"
            :stroke-width="OUTER - INNER"
          />
          <template v-for="(a, i) in arcs" :key="parts[i]!.key">
            <path v-if="a.d" :d="a.d" :class="parts[i]!.color" fill="currentColor" :data-arc="i" />
          </template>
        </svg>
        <!-- The middle is as wide as the hole allows, and the figure's size is fitted to its length. -->
        <div
          class="pointer-events-none absolute inset-0 m-auto flex flex-col items-center justify-center text-center"
          :style="{ width: `${hole.width}px`, height: `${hole.height}px` }"
          aria-hidden="true"
          data-middle
        >
          <template v-if="active !== null">
            <span v-if="roomy" class="max-w-full truncate text-xs/4.5 text-fg-muted">{{
              parts[active]!.label
            }}</span>
            <span
              class="max-w-full truncate font-semibold tabular-nums text-fg"
              :style="fit(shownValue, 18)"
              >{{ shownValue }}</span
            >
            <span v-if="roomy" class="text-xs/4.5 tabular-nums text-fg-muted">{{
              percent(arcs[active]!.share)
            }}</span>
          </template>
          <template v-else>
            <span
              class="max-w-full truncate font-semibold tabular-nums text-fg"
              :style="fit(totalText, 24)"
              >{{ totalText }}</span
            >
            <span v-if="roomy" class="max-w-full truncate text-xs/4.5 text-fg-muted">
              {{ totalLabel || t('grani.chart.total') }}
            </span>
          </template>
        </div>
      </div>
      <ul v-if="legend" class="flex min-w-40 flex-1 flex-col text-sm/5.5" aria-hidden="true">
        <li
          v-for="(p, i) in parts"
          :key="p.key"
          class="flex items-center gap-2 rounded-control px-2 py-1"
          :class="active === i ? 'bg-surface-muted' : ''"
          @pointerenter="show(i)"
          @pointerdown="tapRow($event, i)"
          @pointerleave="cursor.handlers.pointerleave"
        >
          <span class="h-2.5 w-2.5 shrink-0 rounded-pill bg-current" :class="p.color" />
          <UiTruncate :text="p.label" class="min-w-0 flex-1 text-fg-muted" />
          <span class="font-medium tabular-nums text-fg">
            {{ formatChartValue(tr, p.value, format) }}
          </span>
          <span class="w-10 shrink-0 text-end tabular-nums text-fg-muted">
            {{ percent(arcs[i]!.share) }}
          </span>
        </li>
      </ul>
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
              <th scope="col">{{ t('grani.chart.part') }}</th>
              <th scope="col">{{ t('grani.chart.value') }}</th>
              <th scope="col">{{ t('grani.chart.share') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in parts" :key="p.key">
              <th scope="row">{{ p.label }}</th>
              <td>{{ formatChartValue(tr, p.value, format) }}</td>
              <td>{{ percent(arcs[i]!.share) }}</td>
            </tr>
            <!-- The parts Other holds are each still a row: the ring sums them, the table does not. -->
            <tr v-for="p in merged" :key="p.key">
              <th scope="row">{{ `${t('grani.chart.other')}: ${p.label}` }}</th>
              <td>{{ formatChartValue(tr, p.value, format) }}</td>
              <td>{{ percent(shareOf(p.value)) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{{ totalLabel || t('grani.chart.total') }}</th>
              <td>{{ formatChartValue(tr, total, format) }}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <p aria-live="polite" class="sr-only">{{ cursor.announcement.value }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useChartCursor } from '../composables/useChartCursor'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { formatChartValue, type ChartFormat } from '../utils/chartFormat'
import { ringArcs } from '../utils/chartPath'
import { isFiniteNumber } from '../utils/scale'
import {
  CHART_BLEED,
  CHART_EMPTY,
  CHART_FLOOR,
  CHART_SKELETON,
  FLOOR_PAD,
  GUTTER_PAD,
} from '../utils/surface'
import UiSkeleton from './UiSkeleton.vue'
import UiTruncate from './UiTruncate.vue'

export interface DonutPart {
  /** Tells parts apart; the list keeps them by it. */
  key: string
  /** The name in the legend, the middle of the ring and the table. */
  label: string
  /** How much of the whole it is; `null`, zero or below takes no room. */
  value: number | null
}

const props = withDefaults(
  defineProps<{
    /** The parts, in the order they go round the ring and take the chart colors: the caller sorts. Past five, the fifth is "Other", the sum of the rest. */
    parts: DonutPart[]
    /** What the chart shows, for a screen reader: "Spending by category, September". */
    ariaLabel: string
    /** What the total in the middle counts: "Visitors"; "Total" when unset. */
    totalLabel?: string
    /** How values read in the middle, the legend and the table; `money` writes the currency code after the digits, `1,234.00 USD`. */
    format?: ChartFormat
    /** The diameter of the ring in pixels. */
    height?: number
    /** The legend beside the ring, each part with its value and share. */
    legend?: boolean
  }>(),
  { totalLabel: '', format: 'number', height: 160, legend: true },
)

const tr = useUiT()
const { t } = tr
const loading = inject(CHART_SKELETON, null)
const nothing = inject(CHART_EMPTY, null)
// Nothing to draw holds the first load's ring, still, for the card to hide under its words.
const empty = computed(() => nothing?.value ?? false)
const skeleton = computed(() => (loading?.value ?? false) || empty.value)
const bleed = inject(CHART_BLEED, null)
const gutter = computed(() => bleed?.value ?? null)
const inset = computed(() => (gutter.value ? GUTTER_PAD[gutter.value] : ''))
const onFloor = inject(CHART_FLOOR, null)
const floor = computed(() => Boolean(gutter.value) && (onFloor?.value ?? false))

const COLORS = ['text-chart-1', 'text-chart-2', 'text-chart-3', 'text-chart-4', 'text-chart-5']
// Five read apart: past five, the fifth place is the sum of the rest, in the gray of what is left.
const parts = computed(() => {
  const given = props.parts
  const kept = given.length > COLORS.length ? given.slice(0, COLORS.length - 1) : given
  const list = kept.map((p, i) => ({ ...p, color: COLORS[i]! }))
  if (given.length > COLORS.length) {
    const rest = given
      .slice(COLORS.length - 1)
      .map((p) => p.value)
      .filter(isFiniteNumber)
    list.push({
      key: '\u0000other',
      label: t('grani.chart.other'),
      value: rest.length ? rest.reduce((a, b) => a + (b > 0 ? b : 0), 0) : null,
      color: 'text-chart-other',
    })
  }
  return list
})
const merged = computed(() =>
  props.parts.length > COLORS.length ? props.parts.slice(COLORS.length - 1) : [],
)

// No value at all is no total, a dash; values that are all zero are a whole of nothing, 0.
const total = computed(() => {
  const known = parts.value.map((p) => p.value).filter(isFiniteNumber)
  return known.length ? known.reduce((a, b) => a + (b > 0 ? b : 0), 0) : null
})

// A real part under half a percent is "<1%": rounded, it would read as nothing, as a zero does.
const percent = (share: number) =>
  share > 0 && share < 0.005
    ? `<${tr.n(0.01, { style: 'percent', maximumFractionDigits: 0 })}`
    : tr.n(share, { style: 'percent', maximumFractionDigits: 0 })
const shareOf = (v: number | null) =>
  total.value && isFiniteNumber(v) && v > 0 ? v / total.value : 0

const cursor = useChartCursor({
  count: computed(() => parts.value.length),
  // A ring is read from twelve o'clock: the first part is where the keys start.
  start: 'first',
  describe: (i) => {
    const p = parts.value[i]!
    return `${p.label}: ${formatChartValue(tr, p.value, props.format)}, ${percent(arcs.value[i]?.share ?? 0)}`
  },
})
const active = cursor.index
const show = (i: number) => (active.value = i)
// The ring is round, not a line across: the part under the pointer is the arc it is over.
const partAt = (event: PointerEvent) => {
  const at = (event.target as Element | null)?.closest?.('[data-arc]')?.getAttribute('data-arc')
  return at === null || at === undefined ? null : Number(at)
}
function point(event: PointerEvent) {
  const i = partAt(event)
  if (i !== null) show(i)
}
// A press focuses the ring as the pointer's, not the keyboard's; a tap shows the part under it.
function press(event: PointerEvent) {
  cursor.handlers.pointerdown()
  point(event)
}
// A row takes no focus of its own: a tap on it hands the focus to the ring, so the part stays
// shown until the ring loses it, a tap elsewhere, as a tap on an arc does.
const ringEl = ref<HTMLElement>()
function tapRow(event: PointerEvent, i: number) {
  event.preventDefault()
  cursor.handlers.pointerdown()
  ringEl.value?.focus({ preventScroll: true })
  show(i)
}

// The part shown widens outward by 3 of the 100 the ring is drawn in; the ring leaves it the room.
const INNER = 33
const OUTER = 47
const arcs = computed(() =>
  ringArcs(
    parts.value.map((p) => p.value),
    {
      inner: INNER,
      outer: OUTER,
      pad: 1,
      grow: active.value === null ? undefined : { index: active.value, by: 3 },
    },
  ),
)
const drawnArcs = computed(() => arcs.value.some((a) => a.d))
// The ghost ring is as thick as the drawn one: 14 of the 100 it is drawn in.
const ghostBand = computed(() => Math.round((props.height * (OUTER - INNER)) / 100))
// A line through the middle of the hole has most of its width, the three lines less of its height;
// under 120 pixels only the figure fits.
const hole = computed(() => {
  const d = (props.height * INNER * 2) / 100
  return { width: Math.floor(d * 0.86), height: Math.floor(d * 0.76) }
})
const roomy = computed(() => props.height >= 120)
// A figure that would fall under 14px in the hole is written short there ("5.3T"), the money's code
// after it; the legend and the table keep it whole.
const inHole = (v: number | null | undefined) => {
  const whole = formatChartValue(tr, v, props.format)
  if (hole.value.width / (Math.max(whole.length, 1) * 0.6) >= 14) return whole
  const short = formatChartValue(tr, v, props.format, { compact: true })
  return props.format === 'money' && tr.currency.value ? `${short} ${tr.currency.value}` : short
}
const totalText = computed(() => inHole(total.value))
const shownValue = computed(() =>
  active.value === null ? '' : inHole(parts.value[active.value]?.value),
)
// The figure takes the size that fits the hole. A figure with its separators and unit measured
// 0.58 of the size per character in the library's font; 0.6 leaves a margin.
const fit = (text: string, max: number) => {
  const size = Math.max(
    10,
    Math.min(max, Math.floor(hole.value.width / (Math.max(text.length, 1) * 0.6))),
  )
  return { fontSize: `${size}px`, lineHeight: `${Math.round(size * 1.3)}px` }
}

if (isDev())
  watch(
    () => props.parts,
    () => {
      const keys = props.parts.map((p) => p.key)
      if (new Set(keys).size !== keys.length)
        console.warn(
          '[grani] UiDonutChart: two parts share a key; the list cannot tell them apart.',
        )
    },
    { immediate: true },
  )
</script>
