# Area chart (`UiAreaChart`)

> Follow values over time as lines and filled areas. Explore each point from the keyboard, with gaps shown as missing data rather than zero.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/area-chart

Also called line chart, time series chart, trend chart.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiAreaChart, useUiT } from 'grani-ui'

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

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]

const INCOME = [4100, 4150, 4300, 4380, 4220, 4400, 4460, 4390, 4520, 4610, 4580, 2790]
</script>

<template>
  <UiAreaChart
    :x="MONTHS"
    :series="[
      { key: 'spending', label: 'Spending', values: SPENDING },
      { key: 'income', label: 'Income', values: INCOME, variant: 'line' },
    ]"
    :format="eur"
    ariaLabel="Spending and income by month"
  />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show missing data as a gap.
- Show when a reporting period is still incomplete.
- Read every chart value from the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `null` where there is no data, and `0` only for a real zero.
- Set `partial` while the period runs, and remove it once the period closes.
- Name the chart with `ariaLabel`: what it shows and over which period.

## Why it works this way

Values over time as areas and lines. Take it for a flow over time, usually in the body of a UiChartCard.

**Data.** `x` is the time axis: dates that the library labels by `grain`, with the year on the first label shown and where it changes. Names that are not dates (regions, products) are categories: UiBarChart labels each. Each series is its `values` in that order. A `null` is a gap where the line breaks, never a zero.

**Series.** A series is an area, or a `line`; `dashed` marks a figure of another kind (a profit over revenue). A `muted` series is drawn in gray behind the rest, as a period to compare with, and takes no color.

**Value axis.** The value axis covers every value shown, losses included, and draws the zero line when the values cross it.

**Legend.** The legend names each series with its total. Pressing one shows it alone and fits the axis to it; pressing it again shows all. `tooltipTotal` adds a sum under the series in the tooltip, hidden while one series stands alone.

Partial and highlight. `partial` says the last point is a period still going: its segment is dashed, and its label and tooltip say so. `highlight` puts a dot on each series at one point, the month the card's headline talks about.

**Drawing.** The SVG stretches in one viewBox and keeps its stroke widths. Every word is HTML over it, and the width changes only how many time-axis labels show, so what the server renders is what the browser keeps. A label that would still run into the next one or out of the plot is left out; the newest always stays. It takes the whole width of its host, even in a centering row.

**Points.** Each point is a row of the hidden table and a word of the axis. Measured in Chromium (production build, two series): 500 points draw about 2,600 elements and a pointer move reaches the screen within a frame; 1,000 take about 20 ms, 2,000 about 50 ms and 10,000 over half a second. Past 500, group the days into weeks or months; in development the chart warns once.

In a card. In a UiChartCard it draws its own shape pale on the card's first load, and holds that shape still when there is nothing to draw. Alone, with no point or no value that is a number, it says "No data for this period" in its own place. When the card bleeds it to the sides, it keeps its words on the gutter, drops the value axis and draws the focus ring inside; on the card's floor it keeps the gutter under its legend.

**Placement.** In a UiChartCard's body, under the card's headline, with a UiDelta in the card's actions. Alone it fills its host, a page section or a panel.

### Keyboard

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

### Screen reader

- Plot: an image named by `ariaLabel`.
- Point: only a point reached by the keyboard is read, in a polite live region, as "September 2026: Spending 3,640, Income 5,100", followed by the sum of `tooltipTotal`.
- Table: a hidden table, captioned with the chart's name, holds every point, every series and the sum, including a series shown alone; `partial` says "in progress" with the last point.
- Legend: a group named "Series; press one to show it alone", each chip `aria-pressed`.
- Hidden: the tooltip, the dots, the labels and the axis.
- Empty: alone, a group named by `ariaLabel` that says there is no data.

### States

Rest, a point under the pointer or the keys (the line, the dots and the tooltip), one series alone, `partial` with its dashed tail, `highlight` dots until the cursor takes over, a `muted` series behind the rest, a gap and a lone point with its dot, a loss with the zero line, nothing to draw alone. In a UiChartCard: its first load as a pale line, nothing to draw held still, a refresh dimmed by the card, bled to the sides without a value axis.

### When to use another component

- Amounts per period: UiBarChart.
- The parts of a whole: UiDonutChart.
- A trend with no axes beside a number: UiSparkline.
- The card with its title, headline and data states: UiChartCard around it.

## Examples

### Gaps

```vue
<script setup lang="ts">
import { UiAreaChart, useUiT } from 'grani-ui'

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

const ORDERS = [4200, 4600, 6100, 3900, 3700, 4400, 4800, 5100, 4700, 5300, 5600, 3100]

const EVENTS = [1800, 1500, 2600, 1200, 900, 1700, 2100, 2500, 2200, 2000, 2700, 1400]

// A gap on both sides of one month: that point stands alone, a dot no line reaches.
const PROFIT = [900, 1100, 1900, 300, -450, 700, 1000, null, 1300, null, 1500, 600]
</script>

<template>
  <UiAreaChart
    :x="MONTHS"
    :series="[
      { key: 'orders', label: 'Orders', values: ORDERS },
      { key: 'events', label: 'Events', values: EVENTS },
      {
        key: 'profit',
        label: 'Profit',
        values: PROFIT,
        variant: 'line',
        dashed: true,
        total: false,
      },
    ]"
    :tooltip-total="{ label: 'Revenue', of: ['orders', 'events'] }"
    :format="eur"
    ariaLabel="Revenue from orders and events, and the profit, by month"
  />
</template>

```

### Partial

```vue
<script setup lang="ts">
import { UiAreaChart, useUiT } from 'grani-ui'

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

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]

const INCOME = [4100, 4150, 4300, 4380, 4220, 4400, 4460, 4390, 4520, 4610, 4580, 2790]
</script>

<template>
  <UiAreaChart
    :x="MONTHS"
    :series="[
      { key: 'spending', label: 'Spending', values: SPENDING },
      { key: 'income', label: 'Income', values: INCOME, variant: 'line' },
    ]"
    :format="eur"
    partial
    ariaLabel="Spending and income by month, September still going"
  />
</template>

```

### Compare

```vue
<script setup lang="ts">
import { UiAreaChart, useUiT } from 'grani-ui'

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

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]

const SPENDING_BEFORE = [3100, 3350, 3900, 3020, 2980, 3150, 3300, 3480, 3290, 3610, 3700, 3380]
</script>

<template>
  <UiAreaChart
    :x="MONTHS"
    :series="[
      { key: 'now', label: 'Last 12 months', values: SPENDING, total: false },
      {
        key: 'before',
        label: '12 months before',
        values: SPENDING_BEFORE,
        variant: 'line',
        dashed: true,
        muted: true,
        total: false,
      },
    ]"
    :format="eur"
    :highlight="10"
    ariaLabel="Spending by month against the 12 months before"
  />
</template>

```

### One

```vue
<script setup lang="ts">
import { UiAreaChart, useUiT } from 'grani-ui'

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

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]
</script>

<template>
  <UiAreaChart
    :x="MONTHS"
    :series="[{ key: 'spending', label: 'Spending', values: SPENDING }]"
    :format="eur"
    curve="step"
    ariaLabel="Spending by month"
  />
</template>

```

### Shape

```vue
<script setup lang="ts">
import { UiAreaChart } from 'grani-ui'

const DAYS = [
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
  '2026-09-28',
  '2026-09-29',
]

const VISITS = [42100, 47800, 45200, 51900, 38600, 33400, 49700]
</script>

<template>
  <UiAreaChart
    :x="DAYS"
    :series="[{ key: 'visits', label: 'Visitors', values: VISITS }]"
    grain="day"
    curve="linear"
    :y-axis="false"
    :legend="false"
    :height="120"
    ariaLabel="Visitors by day, 23 to 29 September"
  />
</template>

```

### In a card

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiChartCard, UiAreaChart, UiRadioGroup, UiRadio, useUiT } from 'grani-ui'

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

const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]

const SPENDING_BEFORE = [3100, 3350, 3900, 3020, 2980, 3150, 3300, 3480, 3290, 3610, 3700, 3380]

const state = ref('loading')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiChartCard
      title="Spending by month"
      :value="state === 'loaded' || state === 'refreshing' ? 3640 : null"
      caption="in September"
      :format="eur"
      :loading="state === 'loading' || state === 'refreshing'"
      :empty="state === 'loading' || state === 'empty' || state === 'failed'"
      :error="state === 'failed' ? 'The server did not answer. Try again.' : null"
      bleed="sides"
      class="w-full max-w-md"
      @retry="state = 'loading'"
    >
      <UiAreaChart
        :x="MONTHS"
        :series="[
          { key: 'now', label: 'This year', values: SPENDING, variant: 'line' },
          {
            key: 'last',
            label: 'A year before',
            values: SPENDING_BEFORE,
            variant: 'line',
            dashed: true,
          },
        ]"
        :format="eur"
        :y-axis="false"
        :height="160"
        ariaLabel="Spending by month against the year before"
      />
    </UiChartCard>
    <UiRadioGroup v-model="state" variant="segmented" aria-label="State of the card">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="refreshing">Updating</UiRadio>
      <UiRadio value="empty">No data</UiRadio>
      <UiRadio value="failed">Failed</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Percent

```vue
<script setup lang="ts">
import { UiAreaChart } from 'grani-ui'

const WEEKS = [
  '2026-08-03',
  '2026-08-10',
  '2026-08-17',
  '2026-08-24',
  '2026-08-31',
  '2026-09-07',
  '2026-09-14',
  '2026-09-21',
]

const ON_TIME = [0.82, 0.86, 0.79, 0.88, 0.91, 0.87, 0.93, 0.9]
</script>

<template>
  <UiAreaChart
    :x="WEEKS"
    :series="[{ key: 'share', label: 'Paid on time', values: ON_TIME, variant: 'line' }]"
    grain="week"
    format="percent"
    :legend="false"
    :height="180"
    ariaLabel="Invoices paid on time, by week"
  />
</template>

```

## API

Props:
- `x`: `DateValue[]` (required) — The time axis: one date per point, `2026-09` a month, `2026-09-24` a day; text that is not a date stays as it is.
- `series`: `AreaSeries[]` (required) — The series, in the order they take the chart colors, five at most. Each is `key`, `label` and `values`; `variant: 'line'` draws it unfilled, `dashed` for a figure of another kind, `total: false` keeps its sum out of the legend.
- `ariaLabel`: `string` (required) — What the chart shows, for a screen reader: "Spending and income by month".
- `grain`: `ChartGrain` = `month | day | weekday | week` (default `"month"`) — What one point stands for: the labels and the tooltip read the dates by it; `weekday` names a day of one week, "Tue".
- `format`: `ChartFormat` (default `"number"`) — How values read in the legend, the tooltip and the table; `money` writes the currency code after the digits, `1,234.00 USD`. The axis prints compact figures (or percents) without the unit.
- `curve`: `ChartCurve` = `smooth | linear | step` (default `"smooth"`) — `smooth` bends through the points without passing them, `linear` joins them, `step` holds each value.
- `height`: `number` (default `240`) — The height in pixels, the time axis included; the legend is below it.
- `yAxis`: `boolean` (default `true`) — The value axis with its grid; off for a chart that only shows a shape.
- `legend`: `boolean` (default `true`) — The legend with each series' total, a press shows one series alone.
- `tooltipTotal`: `{ label: string; of: string[]; }` — A sum of some series under them in the tooltip and the table: `{ label: 'Revenue', of: ['orders', 'events'] }`.
- `partial`: `boolean` (default `false`) — The last point is a period still going: its segment is dashed, its label and tooltip say so.
- `highlight`: `number` — The index of the point in light, the one the card's headline speaks of: a dot on each series there.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### A gap, not a zero

- When: a series has a point with no data.
- Props: `series[].values` with `null` where there is no data.
- Guarantee: The line and its area break at a `null` and go on after it, and a point alone between two gaps keeps a dot. The tooltip and the data table available to screen readers show a dash there, never 0.
- Without it: A month with no data is drawn as a fall to zero and counted as zero in a sum.
- Code: `<UiAreaChart :x="months" :series="[{ key: 'r', label: 'Revenue', values: [40, null, 47] }]" ariaLabel="Revenue" />`
- Your part: Pass `null` where there is no data, and `0` only for a real zero.
- Proof, in the repository's tests (UiAreaChart.spec.ts, not in the package): "a missing value breaks the line instead of dropping to zero", "a point with gaps around it keeps a dot"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#gap-not-zero

### In progress, not a drop

- When: the last point is not over.
- Props: `partial`.
- Guarantee: The last segment of the line is dashed, and the axis label, the tooltip and the data table available to screen readers say the period is in progress, for example “Sep · in progress”.
- Without it: The line dives at its end for a month that still has a week to go.
- Code: `<UiAreaChart :x="months" :series="series" partial ariaLabel="Revenue by month" />`
- Your part: Set `partial` while the period runs, and remove it once the period closes.
- Proof, in the repository's tests (UiAreaChart.spec.ts, not in the package): "partial dashes the last segment and says the period is going"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#partial-not-drop

### Values by keys

- When: you need the values, not only the shape.
- Props: `ariaLabel`.
- Guarantee: Tab reaches the plot and shows the newest point. The arrow keys, Home and End move between points, and a screen reader announces each one, for example “September 2026: Spending 3,640, Income 5,100”. A data table available to screen readers holds every point of every series.
- Without it: A tooltip only a mouse can open: Tab skips the chart, and a screen reader announces only an image.
- Code: `<UiAreaChart :x="months" :series="series" ariaLabel="Spending and income by month" />`
- Your part: Name the chart with `ariaLabel`: what it shows and over which period.
- Proof, in the repository's tests (UiAreaChart.spec.ts, not in the package): "the plot is one tab stop: focus says the newest point, the arrows walk", "a hidden table holds every value for a screen reader"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#values-by-keys


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
