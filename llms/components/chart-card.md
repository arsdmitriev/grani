# Chart card (`UiChartCard`)

> Show a chart with its title and key number; the card keeps its space while loading and says when the result is empty or an update failed.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/chart-card

Also called kpi card, stat card, metric card.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiChartCard, UiDelta, UiSparkline, useUiT } from 'grani-ui'

const { n } = useUiT()

const cents = (v: number) => n(v, { style: 'currency', currency: 'EUR' })

// A receipt is read to the cent; its year is only a trend under it.
const RECEIPT = [44.1, 45.3, 49.8, 47.2, 45.9, 46.4, 47.9, 48.6, 47.1, 48.3, 48.99, 46.16]
</script>

<template>
  <UiChartCard
    title="Average receipt"
    :value="RECEIPT[11]!"
    :format="cents"
    bleed="full"
    class="w-full max-w-xs"
  >
    <template #actions>
      <UiDelta :current="RECEIPT[11]!" :previous="RECEIPT[10]!" label="vs August" />
    </template>
    <UiSparkline
      :values="RECEIPT"
      variant="area"
      :endpoint="false"
      :height="64"
      ariaLabel="Average receipt, the last 12 months"
    />
  </UiChartCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Give every empty list a way forward.
- Keep the chart when a refresh fails.
- Keep nearby content in place while loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Provide a useful next action in `#empty`, such as choosing another period, importing data or creating the first record.
- Keep the old data in the chart, pass the reason in words as `error`, and clear `error` once a load succeeds.
- Keep `value` and `caption` as `null` while they load, so their lines keep their space.

## Why it works this way

A card around a chart that handles its data states, so the chart only draws. Take it for a chart on a page, alone or in a grid of cards.

**Layout.** A title with its description, with `#actions` on the same line (a link, a UiDelta); an optional headline (`value` in the chart's format, with a `caption` under it); the chart in the body; a note in `#footer`. There is no line under the title: the headline and the chart follow it on one surface.

**Data states.** One `loading` and one `empty` tell the states apart, as in a table. A figure beside the chart follows its data: a UiDelta in `#actions` draws nothing on a first load, with nothing to draw and after a failed load, and a note given as bare text in `#footer` becomes a held line of its own height; a control, a link and a footer of markup stay. A refresh keeps everything, and a failed refresh keeps it beside "Not updated".

**First load.** Skeletons take the place of the headline and the note. The chart in the slot reads `CHART_SKELETON` and draws its own skeleton; for a chart that has none, the card draws a band of bars. A refresh keeps the chart, dimmed to 60%, with a spinner in the middle of the card.

**Empty.** Nothing to draw keeps the chart's place: the chart reads `CHART_EMPTY` and holds its first-load shape, unseen. `#empty` (a UiNoData that says why and what to do next, or the card's own words) stands in the same cell, and the taller of the two sets the height. A slot whose content is switched off by `v-if` counts as no slot.

**Errors.** A failed load holds the place the same way, with UiNoData `danger`, the reason and Retry in the cell. A failed refresh keeps the chart and says "Not updated" on the title line, with Retry as a reload glyph; the reason is in its tooltip and in the one live region of the title line. Retry asks for nothing while `loading`.

**Bleed.** `bleed="sides"` runs the chart to the card's sides and hands it the gutter through `CHART_BLEED`, so the chart keeps its legend and axis ends on the gutter. `bleed="full"` takes the bottom edge too when there is no footer. A bled chart has no value axis.

**Placement.** On UiCard, beside other cards in a page's grid, with UiDelta in `#actions`. A single figure with a trend is this card with `bleed="full"`. Rows with small lines are UiListItem rows in its body.

### Keyboard

The card takes no tab stop of its own.
- `Tab`: walks what is in it: the controls in `#actions`, the Retry glyph of a failed refresh, the chart's plot and legend, the Retry of a failed load.
- `Enter` `Space`: press a Retry.
When a Retry disappears under the focus, the focus goes to the Retry that took its place, or to the card, never to the page. A focus on a chart control stays where it is when the error clears.

### Screen reader

- Status: one status region on the title line, present in every state, says "Loading the chart…" on the first load, "Updating…" on a refresh, and "Could not refresh chart data" with the reason after a failed refresh.
- Retry: the glyph of a failed refresh is a button named "Retry" with the reason in its tooltip.
- Failed load: UiNoData `danger`, "The chart did not load", the reason and Retry.
- Empty: nothing to draw is "No data for this period", or the caller's `#empty`.
- Busy: while loading, the card is `aria-busy`; a chart held under the words is hidden and inert.

### States

Rest, the first load (a skeleton for the headline, the note and the chart's own), a refresh (the chart and the headline dimmed to 60%, a spinner in the middle), nothing to draw (`empty`, the chart's place kept), a failed load (`error` with `empty`), a failed refresh ("Not updated" on the title line, the chart kept); with and without a headline, a caption and a footer note, `bleed="sides"` and `bleed="full"`.

### When to use another component

- A chart alone in a page section: the chart itself, UiAreaChart, UiBarChart or UiDonutChart.
- Rows with small lines: UiListItem rows in a UiList.
- A change against the period before: UiDelta in `#actions`.
- A table of the figures: UiTable.

## Examples

### Delta

```vue
<script setup lang="ts">
import type { AreaSeries } from 'grani-ui'
import { UiChartCard, UiDelta, UiAreaChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
]

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 3640]

const SPENDING_LAST_YEAR = [2860, 2940, 3620, 2780, 2610, 2750, 2900, 3010, 2830, 3120, 3180, 3050]

// Spending that grows is danger; the year before is gray and dashed beside this one. Lines, not
// areas: an area stands on zero and flattens the gap a comparison is about.
const YEAR_OVER_YEAR: AreaSeries[] = [
  { key: 'now', label: 'This year', values: SPENDING, variant: 'line' },
  {
    key: 'last',
    label: 'A year before',
    values: SPENDING_LAST_YEAR,
    variant: 'line',
    dashed: true,
  },
]

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
</script>

<template>
  <UiChartCard
    title="Spending by month"
    :value="SPENDING[11]!"
    caption="in September"
    :format="eur"
    bleed="sides"
    class="w-full max-w-sm"
  >
    <template #actions>
      <UiDelta :current="SPENDING[11]!" :previous="SPENDING[10]!" label="vs August" invert />
    </template>
    <UiAreaChart
      :x="MONTHS"
      :series="YEAR_OVER_YEAR"
      :format="eur"
      :height="160"
      ariaLabel="Spending by month against the year before"
    />
    <template #footer>{{ eur(sum(SPENDING) / 12) }} a month on average</template>
  </UiChartCard>
</template>

```

### Rows

```vue
<script setup lang="ts">
import { UiChartCard, UiLink, UiList, UiListItem, UiSparkline, UiDelta, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// One row a category, the largest month first; eight months each, the newest last.
const CATEGORIES = [
  { name: 'Groceries', months: [980, 1040, 1010, 1120, 990, 1060, 1100, 1180] },
  { name: 'Home', months: [640, 610, 700, 820, 760, 690, 720, 750] },
  { name: 'Transport', months: [420, 380, 460, 510, 440, 470, 530, 490] },
  { name: 'Cafés', months: [210, 260, 230, 300, 280, 250, 270, 340] },
]
</script>

<template>
  <UiChartCard
    title="Spending by category"
    description="September against August"
    class="w-full max-w-sm"
  >
    <template #actions>
      <UiLink to="#categories" tone="neutral" class="text-sm">All</UiLink>
    </template>
    <UiList>
      <UiListItem v-for="c in CATEGORIES" :key="c.name" :title="c.name">
        <template #actions>
          <UiSparkline :values="c.months" class="w-16" />
          <span class="flex min-w-16 flex-col items-end gap-0.5 whitespace-nowrap">
            <span class="text-sm font-medium tabular-nums">{{ eur(c.months[7]!) }}</span>
            <UiDelta :current="c.months[7]!" :previous="c.months[6]!" invert />
          </span>
        </template>
      </UiListItem>
    </UiList>
  </UiChartCard>
</template>

```

### Plan

```vue
<script setup lang="ts">
import { UiChartCard, UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
]

// The plan is one line over the bars; the headline is the verdict, counted, not the sum.
const PLAN = 1100

const REVENUE = [980, 1150, 1210, 1040, 1320, 1260]

const metPlan = REVENUE.filter((v) => v >= PLAN).length
</script>

<template>
  <UiChartCard
    title="Revenue against the plan"
    :value="`${metPlan} of 6 months`"
    :caption="`met the plan of ${eur(PLAN)}`"
    class="w-full max-w-sm"
  >
    <UiBarChart
      :x="MONTHS.slice(6)"
      :series="[{ key: 'revenue', label: 'Revenue', values: REVENUE }]"
      :highlight="5"
      :marks="[{ at: PLAN, label: 'Plan' }]"
      :y-axis="false"
      :legend="false"
      :height="180"
      :format="eur"
      ariaLabel="Revenue by month against the plan"
    />
  </UiChartCard>
</template>

```

### Partial

```vue
<script setup lang="ts">
import { UiChartCard, UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

// The hours to come are gaps, not zeros: the day is still going.
const HOURS = ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']

const NOW = 4

const POWER_TODAY = [1.2, 2.6, 3.4, 1.9, 1.1, null, null, null]

const kw = (v: number) => `${n(v, { maximumFractionDigits: 1 })} kW`
</script>

<template>
  <UiChartCard
    title="Power use today"
    :value="kw(POWER_TODAY[NOW]!)"
    :caption="`now, at ${HOURS[NOW]}`"
    class="w-full max-w-sm"
  >
    <UiBarChart
      :x="HOURS"
      :series="[{ key: 'use', label: 'Use', values: POWER_TODAY }]"
      :highlight="NOW"
      :y-axis="false"
      :legend="false"
      :height="160"
      :format="kw"
      ariaLabel="Power use by hour, today"
    />
  </UiChartCard>
</template>

```

### Saved

```vue
<script setup lang="ts">
import { UiChartCard, UiLink, UiAreaChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
]

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 3640]

const INCOME = [4100, 4150, 4300, 4380, 4220, 4400, 4460, 4390, 4520, 4610, 4580, 4700]

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

// What is left of the year's income, added up month by month: the line ends on the headline.
// A flat stretch is a month that kept nothing; a fall, a month spent past what came in.
const saved = sum(INCOME) - sum(SPENDING)

const SAVED_SO_FAR = INCOME.reduce<number[]>(
  (acc, v, i) => [...acc, (acc.at(-1) ?? 0) + v - SPENDING[i]!],
  [],
)
</script>

<template>
  <UiChartCard
    title="Saved over 12 months"
    :value="saved"
    :caption="`earned ${eur(sum(INCOME))} · spent ${eur(sum(SPENDING))}`"
    :format="eur"
    bleed="sides"
    class="w-full max-w-sm"
  >
    <template #actions>
      <UiLink to="#budget" tone="neutral" class="text-sm">Budget</UiLink>
    </template>
    <UiAreaChart
      :x="MONTHS"
      :series="[{ key: 'saved', label: 'Saved', values: SAVED_SO_FAR }]"
      :format="eur"
      :legend="false"
      :height="160"
      ariaLabel="Savings over the year, month by month"
    />
  </UiChartCard>
</template>

```

### Stacked

```vue
<script setup lang="ts">
import { UiChartCard, UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
]

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

// What a month is made of: one series on another, the tooltip adds the bar up.
const ORDERS = [320, 360, 290, 410, 380, 440]

const EVENTS = [180, 150, 210, 170, 240, 200]
</script>

<template>
  <UiChartCard
    title="Orders and events"
    :value="sum(ORDERS) + sum(EVENTS)"
    caption="revenue over six months"
    :format="eur"
    class="w-full max-w-sm"
  >
    <UiBarChart
      :x="MONTHS.slice(6)"
      :series="[
        { key: 'orders', label: 'Orders', values: ORDERS },
        { key: 'events', label: 'Events', values: EVENTS },
      ]"
      stack
      :tooltip-total="{ label: 'Revenue', of: ['orders', 'events'] }"
      :y-axis="false"
      :height="180"
      :format="eur"
      ariaLabel="Revenue from orders and events by month"
    />
  </UiChartCard>
</template>

```

### States

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { AreaSeries } from 'grani-ui'
import { UiChartCard, UiDelta, UiAreaChart, UiNoData, UiButton, UiRadioGroup, UiRadio, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = [
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
]

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 3640]

const SPENDING_LAST_YEAR = [2860, 2940, 3620, 2780, 2610, 2750, 2900, 3010, 2830, 3120, 3180, 3050]

// Spending that grows is danger; the year before is gray and dashed beside this one. Lines, not
// areas: an area stands on zero and flattens the gap a comparison is about.
const YEAR_OVER_YEAR: AreaSeries[] = [
  { key: 'now', label: 'This year', values: SPENDING, variant: 'line' },
  {
    key: 'last',
    label: 'A year before',
    values: SPENDING_LAST_YEAR,
    variant: 'line',
    dashed: true,
  },
]

// The life of a request, on one card: a failed load's Retry and a failed refresh's Retry both
// load again for a second and a half and come back with the chart.
type State = 'loaded' | 'loading' | 'updating' | 'empty' | 'failed' | 'stale'

const state = ref<State>('loading')

const FAILED = 'The server did not answer. Check the connection and try again.'

let timer: ReturnType<typeof setTimeout> | undefined

function retry() {
  const from = state.value
  state.value = from === 'stale' ? 'updating' : 'loading'
  clearTimeout(timer)
  timer = setTimeout(() => (state.value = 'loaded'), 1500)
}

// A state picked by hand while Retry loads stands: the late answer does not overwrite it.
watch(state, (s) => {
  if (s !== 'loading' && s !== 'updating') clearTimeout(timer)
})

onBeforeUnmount(() => clearTimeout(timer))

// No number yet, none to show or a failed load: `null` keeps the headline's lines, so the card keeps its height.
const NO_NUMBER: State[] = ['loading', 'empty', 'failed']

const shownValue = computed(() => (NO_NUMBER.includes(state.value) ? null : SPENDING[11]!))

const shownCaption = computed(() => (NO_NUMBER.includes(state.value) ? null : 'in September'))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiChartCard
      title="Spending by month"
      :value="shownValue"
      :caption="shownCaption"
      :format="eur"
      bleed="sides"
      :loading="state === 'loading' || state === 'updating'"
      :empty="state === 'loading' || state === 'empty' || state === 'failed'"
      :error="
        state === 'failed' ? FAILED : state === 'stale' ? 'The newest month did not load.' : null
      "
      class="w-full max-w-sm"
      @retry="retry"
    >
      <template #actions>
        <UiDelta :current="SPENDING[11]!" :previous="SPENDING[10]!" label="vs August" invert />
      </template>
      <UiAreaChart
        :x="MONTHS"
        :series="YEAR_OVER_YEAR"
        :format="eur"
        :height="160"
        ariaLabel="Spending by month against the year before"
      />
      <template #empty>
        <UiNoData
          size="sm"
          title="No spending yet"
          description="Add the first expense and the chart starts from its month."
        >
          <template #actions>
            <UiButton variant="secondary">Add an expense</UiButton>
          </template>
        </UiNoData>
      </template>
    </UiChartCard>
    <UiRadioGroup v-model="state" variant="segmented" aria-label="State of the chart">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="updating">Updating</UiRadio>
      <UiRadio value="empty">No data</UiRadio>
      <UiRadio value="failed">Failed</UiRadio>
      <UiRadio value="stale">Refresh failed</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## API

Props:
- `title`: `string` (required) — What the chart shows: "Spending and income by month".
- `description`: `string` (default `""`) — One line under the title: what is counted, what is left out.
- `size`: `"sm" | "md"` = `sm | md` (default `"sm"`) — The gutter, as UiCard's: `sm` 16, `md` 24.
- `value`: `string | number | null` — A headline over the chart, a total: a number in `format`, or text already written. `null` keeps its line while it loads, and blank while there is nothing to draw.
- `caption`: `string | null` — A line under the headline: the shares, the span it covers. `null` keeps its line as `value` does.
- `format`: `ChartFormat` (default `"number"`) — How a number `value` reads, `money` with the currency code after the digits; the chart inside takes its own.
- `loading`: `boolean` (default `false`) — Data is on its way: a skeleton while there is none yet, the chart dimmed over data already shown.
- `empty`: `boolean` (default `false`) — There is no data to draw: with `loading` it is the first load, without it `#empty`.
- `bleed`: `"sides" | "full"` = `sides | full` — The chart runs to the card's `sides`, its words on the gutter, or to the floor as well (`full`, with no footer); for a chart without a value axis.
- `error`: `string | null` (default `null`) — Why the data did not load, in words for the reader, shown with Retry; an empty string fails with a general reason. Over a chart already shown: "Not updated" on the title line.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `retry` — Retry was pressed after a failed load or refresh.

Slots:
- `default` with `Record<string, never>` — The chart. It reads the card's first load and draws its own skeleton; anything else here is shown as it is.
- `actions` with `Record<string, never>` — On the title line, at the end: a link to the details, a UiMenu.
- `footer` with `Record<string, never>` — A note under the chart: an average, the span it covers. Bare text is a note at the start, in a note's size and color; markup lays itself out, a `me-auto` note before its actions at the end.
- `empty` with `Record<string, never>` — In the chart's place when there is nothing to draw: a UiNoData that says why, with the next step in its `#actions`. It may be taller than the chart; the card grows to it.

## How it behaves

### Way forward

- When: there is nothing to draw for the period.
- Props: `empty`, `#empty`.
- Guarantee: In place of the chart the card says “No data for this period” with a short hint, or shows what the app put in `#empty`, such as a UiNoData with its next step.
- Without it: Empty axes that look like a chart of zeros.
- Code: `<UiChartCard title="Revenue" empty><template #empty><UiNoData title="No sales in September" /></template></UiChartCard>`
- Your part: Provide a useful next action in `#empty`, such as choosing another period, importing data or creating the first record.
- Proof, in the repository's tests (UiChartCard.spec.ts, not in the package): "nothing to draw is the card’s own words, or the caller’s #empty"
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step

### Kept on fail

- When: a refresh fails while a chart is shown.
- Props: `error` without `empty`, `@retry`.
- Guarantee: The previous chart stays fully visible and keeps its space. “Not updated” and Retry appear beside the title; the reason is shown in a tooltip and announced by a screen reader.
- Without it: The error takes the chart’s place, and the numbers you were reading are gone.
- Code: `<UiChartCard title="Revenue" :error="failure" :loading="pending" @retry="load"><UiAreaChart … /></UiChartCard>`
- Your part: Keep the old data in the chart, pass the reason in words as `error`, and clear `error` once a load succeeds.
- Proof, in the repository's tests (UiChartCard.spec.ts, not in the package): "a failed refresh keeps the chart and says it on the title line, the reason in the tooltip", "a failed refresh is said in the live region with its reason"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#kept-on-fail

### Stable dimensions

- When: the data loads, refreshes, comes back empty or fails.
- Props: `loading`, `empty`, `error`.
- Guarantee: On the first load, placeholders reserve space for the chart and its headline. A refresh keeps the chart visible and dimmed. An empty result or a failed first load shows its message in the chart’s space; a failed refresh keeps the existing chart and marks it as not updated.
- Without it: A small spinner first, then a chart that pushes the cards below it down.
- Code: `<UiChartCard title="Revenue" :value="total" :loading="pending" :empty="!rows.length"><UiBarChart … /></UiChartCard>`
- Your part: Keep `value` and `caption` as `null` while they load, so their lines keep their space.
- Proof, in the repository's tests (UiChartCard.spec.ts, not in the package): "the first load hands the chart its skeleton and says it loads", "a refresh keeps the chart in view, dimmed and busy, and says it is updating", "the words of a failed load add no height of their own above and below"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
