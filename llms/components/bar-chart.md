# Bar chart (`UiBarChart`)

> Compare amounts across periods with grouped or stacked bars and a plan line, with a marker for a period still in progress.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/bar-chart

Also called column chart, histogram.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const REVENUE = [980, 1150, 1210, 1040, 1320, 1260]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[{ key: 'revenue', label: 'Revenue', values: REVENUE }]"
    :format="eur"
    :highlight="5"
    :legend="false"
    ariaLabel="Revenue by month"
  />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show missing data as a gap.
- Show when a reporting period is still incomplete.
- Read the full text when a label is shortened.
- Read every chart value from the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `null` where there is no data, and `0` only for a real zero.
- Set `partial` while the period runs, and remove it once the period closes.
- Name the chart with `ariaLabel`.

## Why it works this way

Values by period as bars. Take it for amounts per period rather than a flow over time, usually in the body of a UiChartCard.

**Data.** `x` is the periods: dates that the library labels by `grain`, with the year on the first label shown and where it changes. Names that are not dates are categories: each keeps its label, cut to its band, and the tooltip says it whole. Each series is its `values` in that order. One series draws one bar per period; several stand side by side, or on top of each other with `stack` (the parts of a whole).

**Values.** A `null` is no data yet: its place keeps a thin gray stub, never a zero bar. A zero keeps a sliver of its color on the zero line. A loss stands below the zero line. In a stack only values at zero or above are drawn and counted, so the stack's label, the legend total and the tooltip sum agree with the bars; a period of zeros is a sliver whose sum is 0.

**Emphasis.** `highlight` lights one period or several and quiets the rest to a pale bar with a line at its height. `marks` draws a reference line (a plan), named under the chart. `labels="value"` prints the value over each period, thinned the same way as the axis labels.

**Legend.** The legend names each series with its total; a press shows one series alone. `tooltipTotal` adds a sum under the series in the tooltip.

**In progress.** `partial` says the newest period with data is still going: its bar is hatched and read as in progress, and the empty periods after it are dashed outlines, meaning still to come, not missing.

**Drawing.** Bars are HTML boxes in bands, so their corners stay round at any width; the width changes only how many time-axis labels show. A label that would still run into the next one or out of the plot is left out; the newest always stays.

**Periods.** Each period is a band, a bar per series and a row of the hidden table. Measured in Chromium (production build, two series): 500 periods draw about 7,000 elements and a pointer move reaches the screen within a frame or two; 1,000 take about 45 ms, 2,000 over 60 ms and 10,000 over half a second. Past 500, group the days into weeks or months; in development the chart warns once.

In a card. In a UiChartCard's body, under the headline, with a UiDelta in the card's actions; or alone in its host. In the card it draws pale bars on the first load and holds them still when there is nothing to draw. Alone, with no period or no value that is a number, it says "No data for this period" in its own place. When the card bleeds it, it keeps its words on the gutter, drops the value axis and draws the focus ring inside.

### Keyboard

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

### Screen reader

- Plot: an image named by `ariaLabel`.
- Period: only a period reached by the keyboard is read, in a polite live region, as "September 2026: Orders 1,240, Events 380", followed by the sum of `tooltipTotal`, and "in progress" for the period still going.
- Table: a hidden table holds every period and every series, including a series shown alone; its caption is the chart's name and each mark ("Plan 1,100").
- Legend: a group named "Series; press one to show it alone", each chip `aria-pressed`.
- Hidden: the bars, the values over them, the tooltip and the marks' names.
- Empty: alone, a group named by `ariaLabel` that says there is no data.

### States

Rest, a period under the pointer or the keys (the tooltip), one series alone, side by side and `stack`, a loss below the zero line, a zero as a sliver and a `null` as a gray stub, `highlight` with the rest quiet, `marks` named under the chart, `labels="value"`, `partial` with its hatched bar and the dashed periods to come, nothing to draw alone. In a UiChartCard: its first load as pale bars, nothing to draw held still, a refresh dimmed by the card, bled to the sides without a value axis.

### When to use another component

- A flow over time: UiAreaChart.
- The parts of a whole at one moment: UiDonutChart.
- A trend with no axes beside a number: UiSparkline `bar`.
- The card with its title, headline and data states: UiChartCard around it.

## Examples

### Plan

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const REVENUE = [980, 1150, 1210, 1040, 1320, 1260]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[{ key: 'revenue', label: 'Revenue', values: REVENUE }]"
    :format="eur"
    :marks="[{ at: 1100, label: 'Plan' }]"
    labels="value"
    :y-axis="false"
    :legend="false"
    ariaLabel="Revenue by month against a plan of 1,100"
  />
</template>

```

### Side by side

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const ORDERS = [620, 700, 760, 640, 810, 790]

const EVENTS = [360, 450, 450, 400, 510, 470]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[
      { key: 'orders', label: 'Orders', values: ORDERS },
      { key: 'events', label: 'Events', values: EVENTS },
    ]"
    :format="eur"
    ariaLabel="Orders and events by month"
  />
</template>

```

### Stacked

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const ORDERS = [620, 700, 760, 640, 810, 790]

const EVENTS = [360, 450, 450, 400, 510, 470]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[
      { key: 'orders', label: 'Orders', values: ORDERS },
      { key: 'events', label: 'Events', values: EVENTS },
    ]"
    stack
    :tooltip-total="{ label: 'Revenue', of: ['orders', 'events'] }"
    :format="eur"
    ariaLabel="Revenue from orders and events by month"
  />
</template>

```

### Loss

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const PROFIT = [180, 240, -90, 120, -140, 210]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[{ key: 'profit', label: 'Profit', values: PROFIT }]"
    :format="eur"
    :legend="false"
    ariaLabel="Profit by month, two months at a loss"
  />
</template>

```

### Zero

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

// Two months with nothing refunded: a zero is a sliver on the line, not the stub of no data.
const REFUNDS = [60, 0, 45, 0, 80, 30]
</script>

<template>
  <UiBarChart
    :x="MONTHS"
    :series="[{ key: 'refunds', label: 'Refunds', values: REFUNDS }]"
    :format="eur"
    :legend="false"
    ariaLabel="Refunds by month, two months at zero"
  />
</template>

```

### Partial

```vue
<script setup lang="ts">
import { UiBarChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const kw = (v: number) => `${n(v, { maximumFractionDigits: 1 })} kW`

const HOURS = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']

const USE = [0.9, 1.6, 2.4, 1.5, 1.1, null, null, null]
</script>

<template>
  <UiBarChart
    :x="HOURS"
    :series="[{ key: 'use', label: 'Power use', values: USE }]"
    :format="kw"
    :highlight="4"
    :y-axis="false"
    :legend="false"
    :height="160"
    ariaLabel="Power use today by two hours, no data after 14:00"
  />
</template>

```

### Many

```vue
<script setup lang="ts">
import { UiBarChart } from 'grani-ui'

const DAYS = Array.from({ length: 24 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)

const ORDERS_BY_DAY = [
  42, 38, 51, 47, 60, 22, 18, 44, 49, 55, 58, 63, 25, 20, 48, 52, 57, 61, 66, 28, 24, 53, 59, 64,
]
</script>

<template>
  <div class="w-full max-w-xs">
    <UiBarChart
      :x="DAYS"
      :series="[{ key: 'orders', label: 'Orders', values: ORDERS_BY_DAY }]"
      grain="day"
      labels="value"
      :highlight="23"
      :legend="false"
      :height="180"
      ariaLabel="Orders by day, 1 to 24 September"
    />
  </div>
</template>

```

### In a card

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiChartCard, UiBarChart, UiRadioGroup, UiRadio, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

const ORDERS = [620, 700, 760, 640, 810, 790]

const EVENTS = [360, 450, 450, 400, 510, 470]

const state = ref('loading')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiChartCard
      title="Revenue by month"
      :value="state === 'loaded' || state === 'refreshing' ? 1260 : null"
      caption="in September"
      :format="eur"
      :loading="state === 'loading' || state === 'refreshing'"
      :empty="state === 'loading' || state === 'empty' || state === 'failed'"
      :error="state === 'failed' ? 'The server did not answer. Try again.' : null"
      bleed="sides"
      class="w-full max-w-md"
      @retry="state = 'loading'"
    >
      <UiBarChart
        :x="MONTHS"
        :series="[
          { key: 'orders', label: 'Orders', values: ORDERS },
          { key: 'events', label: 'Events', values: EVENTS },
        ]"
        stack
        :tooltip-total="{ label: 'Revenue', of: ['orders', 'events'] }"
        :format="eur"
        :y-axis="false"
        :height="180"
        ariaLabel="Revenue from orders and events by month"
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

## API

Props:
- `x`: `DateValue[]` (required) — The periods: one date each, `2026-09` a month, `2026-09-24` a day; text that is not a date stays as it is.
- `series`: `BarSeries[]` (required) — The series, in the order they take the chart colors, five at most; each is `key`, `label` and `values`.
- `ariaLabel`: `string` (required) — What the chart shows, for a screen reader: "Revenue by month".
- `grain`: `ChartGrain` = `month | day | weekday | week` (default `"month"`) — What one period stands for: the labels and the tooltip read the dates by it; `weekday` names a day of one week, "Tue".
- `format`: `ChartFormat` (default `"number"`) — How values read in the legend, the tooltip and the table; `money` writes the currency code after the digits, `1,234.00 USD`. The axis prints compact figures without the unit.
- `height`: `number` (default `200`) — The height in pixels, the time axis included; the legend is below it.
- `yAxis`: `boolean` (default `true`) — The value axis with its grid; off for a chart that only shows a shape.
- `legend`: `boolean` (default `true`) — The legend with each series' total, a press shows one series alone.
- `highlight`: `number | number[]` — The period in light, or several (the months that met a plan); the others go quiet.
- `stack`: `boolean` (default `false`) — The series stand one on another, the parts of a whole; without it they stand side by side.
- `labels`: `"none" | "value"` = `none | value` (default `"none"`) — `value` prints the value over each period: the bar's, a stack's sum, or the tallest of bars side by side.
- `marks`: `{ at: number; label: string; }[]` (default `[]`) — Lines of reference across the plot, each at a value with a label: `[{ at: 1100, label: 'Plan' }]`.
- `tooltipTotal`: `{ label: string; of: string[]; }` — A sum of some series under them in the tooltip and the table: `{ label: 'Revenue', of: ['orders', 'events'] }`.
- `partial`: `boolean` (default `false`) — The newest period with data is still going: its bar is hatched, its tooltip and table say so, and the empty periods after it are to come.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### A gap, not a zero

- When: a period has no data.
- Props: `series[].values` with `null` where there is no data.
- Guarantee: A `null` keeps a thin gray stub in its place, never a bar of zero. A real zero keeps a sliver in the series color, so a month with no data and a month with nothing in it never look alike.
- Without it: Two empty slots: a month with no data and a month with nothing in it look the same.
- Code: `<UiBarChart :x="months" :series="[{ key: 'o', label: 'Orders', values: [12, null, 0] }]" ariaLabel="Orders" />`
- Your part: Pass `null` where there is no data, and `0` only for a real zero.
- Proof, in the repository's tests (UiBarChart.spec.ts, not in the package): "a missing value keeps a thin stub, never a zero bar", "a zero period stays visible and distinct from a missing one"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#gap-not-zero

### In progress, not a drop

- When: the newest period is not over.
- Props: `partial`.
- Guarantee: The latest period with data is hatched and labeled “in progress” in its tooltip, its keyboard readout and the data table for screen readers. Future periods are drawn as dashed outlines, so data that is not yet due looks different from data that is missing.
- Without it: A partial September total looks like a complete month with half of August’s sales, even though September is still underway.
- Code: `<UiBarChart :x="days" :series="series" partial ariaLabel="Orders by day" />`
- Your part: Set `partial` while the period runs, and remove it once the period closes.
- Proof, in the repository's tests (UiBarChart.spec.ts, not in the package): "its tooltip and table say it is in progress", "the empty periods after it are to come: dashed outlines, not gray stubs"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#partial-not-drop

### Whole text

- When: the periods are names, not dates, and are longer than their band.
- Props: `x`.
- Guarantee: Each category keeps a label under its bar, shortened to fit when necessary. The bar’s tooltip and the data table available to screen readers provide the full name.
- Without it: Long names are thinned out until only one label in four is left on the axis.
- Code: `<UiBarChart :x="regions" :series="series" ariaLabel="Orders by region" />`
- Your part: Nothing; keep the names short where you can.
- Proof, in the repository's tests (UiBarChart.spec.ts, not in the package): "a category period keeps its label, cut to its band, and the table names it whole"
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text

### Values by keys

- When: you need the values, not only the shape.
- Props: `ariaLabel`.
- Guarantee: Tab reaches the plot and shows the newest period. The arrow keys, Home and End move between periods, and a screen reader announces each with every series, adding “in progress” for a period still running. A data table available to screen readers holds every value and each reference mark.
- Without it: Bars whose numbers exist only in a tooltip that appears on hover.
- Code: `<UiBarChart :x="months" :series="series" ariaLabel="Orders by month" />`
- Your part: Name the chart with `ariaLabel`.
- Proof, in the repository's tests (UiBarChart.spec.ts, not in the package): "the plot is one tab stop: focus says the newest period, the arrows walk", "a hidden table holds every value for a screen reader"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#values-by-keys


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
