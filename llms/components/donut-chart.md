# Donut chart (`UiDonutChart`)

> Compare the parts of a total in a ring chart, with the total in the center and each part available from the keyboard.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/donut-chart

Also called pie chart, ring chart, share chart.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { DonutPart } from 'grani-ui'
import { UiChartCard, UiDonutChart, UiRadioGroup, UiRadio, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const SPENDING: DonutPart[] = [
  { key: 'rent', label: 'Rent', value: 1250 },
  { key: 'groceries', label: 'Groceries', value: 610 },
  { key: 'transport', label: 'Transport', value: 240 },
  { key: 'eating', label: 'Eating out', value: 185 },
  { key: 'subscriptions', label: 'Subscriptions', value: 64 },
]

const state = ref('loading')

// Retry loads for a second and a half and comes back with the chart; a state picked meanwhile stands.
let timer: ReturnType<typeof setTimeout> | undefined

function retry() {
  state.value = 'loading'
  clearTimeout(timer)
  timer = setTimeout(() => (state.value = 'loaded'), 1500)
}

watch(state, (s) => {
  if (s !== 'loading') clearTimeout(timer)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiChartCard
      title="Where the money went"
      description="September, household spending"
      :loading="state === 'loading' || state === 'refreshing'"
      :empty="state === 'loading' || state === 'empty' || state === 'failed'"
      :error="state === 'failed' ? 'The server did not answer. Try again.' : null"
      bleed="sides"
      class="w-full max-w-md"
      @retry="retry"
    >
      <UiDonutChart
        :parts="SPENDING"
        :format="eur"
        total-label="Spent"
        ariaLabel="Spending by category, September"
      />
      <template #footer>Rent takes half, as it does every month.</template>
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

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Read the full text when a label is shortened.
- Read every chart value from the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- If you pass a `format` function, return a short figure when it is called with the `compact` option.
- Name the chart with `ariaLabel`.

## Why it works this way

The parts of a whole as a ring, with the total in the middle. Take it for a breakdown at one moment.

**Parts.** Each part is a `key`, a `label` and a `value`, drawn clockwise from twelve o'clock in the order given, so the caller sorts them. Colors follow that order, five at most: past five, the fifth part is "Other", the sum of the rest, in the gray used for leftovers.

**Small values.** A part that is not a positive number takes no room and shows 0%. A real part under half a percent shows "<1%" and an arc no thinner than the gap between arcs. A whole of nothing is the bare ring with a total of 0; no data at all is a dash.

**Legend.** The legend stands beside the ring, or under it when the host is narrow, and gives each part its value and its share.

**Shown part.** A shown part widens, and the middle says its name, value and share, sized to fit the hole; a figure too long for it is written short there ("5.3T"), whole in the legend and the table; a `format` function is asked for that short figure with `{ compact: true }`. The pointer over a part or its legend row shows that part, and a tap keeps it shown until a tap elsewhere.

In a card. In a UiChartCard it draws a pale ring on the card's first load and holds it still when there is nothing to draw. When the card bleeds it, the legend keeps to the gutter.

**Placement.** In a UiChartCard's body, under its headline or in place of one, since the total is in the ring; or alone in a page section.

### Keyboard

The ring is one tab stop; an empty ring is no tab stop.
- `Tab`: reaches the ring; focus shows the first part.
- `ArrowLeft` `ArrowRight`: step through the parts, stopping at the first and the last; each part is read out.
- `Home` `End`: jump to the first and the last part; each part is read out.
- `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
A tap on an arc or a legend row shows that part and hands the focus to the ring, so it stays until a tap elsewhere; the legend takes no focus of its own.

### Screen reader

- Ring: an image named by `ariaLabel`.
- Part: a part reached by the keyboard is read in a polite live region as "Groceries: 1,240, 34%".
- Table: a hidden table, captioned with the chart's name, holds every part with its value and share, each part folded into Other on a row of its own ("Other: Taxi"), and the total in its footer.
- Hidden: the middle of the ring and the legend, since the table says the same.

### States

Rest with the total in the middle, a part shown (it widens, the middle says its name, value and share, its legend row is marked), more than five parts with Other, a part of nothing at 0%, a real part under half a percent as "<1%", a whole of nothing as the bare ring and 0, no data at all as a dash; with and without the legend, which goes under the ring when the host is narrow. In a UiChartCard: its first load as a pale ring, nothing to draw held still, a refresh dimmed by the card.

### When to use another component

- The parts period by period: UiBarChart with `stack`.
- One share of a whole: UiProgress.
- A flow over time: UiAreaChart.
- The card with its title and data states: UiChartCard around it.

## Examples

### Other

```vue
<script setup lang="ts">
import type { DonutPart } from 'grani-ui'
import { UiDonutChart } from 'grani-ui'

const SOURCES: DonutPart[] = [
  { key: 'search', label: 'Search', value: 18420 },
  { key: 'direct', label: 'Direct', value: 9310 },
  { key: 'social', label: 'Social', value: 4870 },
  { key: 'email', label: 'Newsletter', value: 2140 },
  { key: 'referral', label: 'Other sites', value: 1260 },
  { key: 'ads', label: 'Ads', value: 820 },
  { key: 'podcast', label: 'Podcast', value: 310 },
]
</script>

<template>
  <UiDonutChart
    :parts="SOURCES"
    total-label="Visitors"
    ariaLabel="Visitors by source, last 30 days"
    class="max-w-md"
  />
</template>

```

### Nothing

```vue
<script setup lang="ts">
import type { DonutPart } from 'grani-ui'
import { UiDonutChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// A part of nothing, a whole of nothing and no data at all: each is said as it is, none is hidden.
const NO_CASH: DonutPart[] = [
  { key: 'card', label: 'Card', value: 2140 },
  { key: 'transfer', label: 'Transfer', value: 860 },
  { key: 'cash', label: 'Cash', value: 0 },
]

const NONE: DonutPart[] = NO_CASH.map((p) => ({ ...p, value: 0 }))

const UNKNOWN: DonutPart[] = NO_CASH.map((p) => ({ ...p, value: null }))
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-6">
    <UiDonutChart
      :parts="NO_CASH"
      :format="eur"
      total-label="Received"
      :height="120"
      ariaLabel="Payments by method this week, none in cash"
    />
    <UiDonutChart
      :parts="NONE"
      :format="eur"
      total-label="Received"
      :height="120"
      ariaLabel="Payments by method this week, none at all"
    />
    <UiDonutChart
      :parts="UNKNOWN"
      :format="eur"
      total-label="Received"
      :height="120"
      ariaLabel="Payments by method this week, no data yet"
    />
  </div>
</template>

```

### Small

```vue
<script setup lang="ts">
import type { DonutPart } from 'grani-ui'
import { UiDonutChart, useUiT } from 'grani-ui'

const { n } = useUiT()

const STORAGE: DonutPart[] = [
  { key: 'photos', label: 'Photos', value: 41.2 },
  { key: 'video', label: 'Video', value: 22.8 },
  { key: 'documents', label: 'Documents', value: 6.4 },
]
</script>

<template>
  <div class="flex items-center gap-4">
    <UiDonutChart
      :parts="STORAGE"
      :format="(v) => `${n(v, { maximumFractionDigits: 1 })} GB`"
      total-label="used"
      :height="120"
      :legend="false"
      ariaLabel="Storage used: photos, video, documents"
      class="w-auto"
    />
    <p class="max-w-48 text-sm text-fg-muted">70.4 of 100 GB used. Photos take the most.</p>
  </div>
</template>

```

## API

Props:
- `parts`: `DonutPart[]` (required) — The parts, in the order they go round the ring and take the chart colors: the caller sorts. Past five, the fifth is "Other", the sum of the rest.
- `ariaLabel`: `string` (required) — What the chart shows, for a screen reader: "Spending by category, September".
- `totalLabel`: `string` (default `""`) — What the total in the middle counts: "Visitors"; "Total" when unset.
- `format`: `ChartFormat` (default `"number"`) — How values read in the middle, the legend and the table; `money` writes the currency code after the digits, `1,234.00 USD`.
- `height`: `number` (default `160`) — The diameter of the ring in pixels.
- `legend`: `boolean` (default `true`) — The legend beside the ring, each part with its value and share.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### Whole text

- When: the total or a part is too long for the hole.
- Props: `format`.
- Guarantee: The center of the chart uses a compact total, such as “5.3T”, so it fits. The legend and the data table available to screen readers provide the full number.
- Without it: A total cut to “5,300,000,00…” in the middle of the ring.
- Code: `<UiDonutChart :parts="parts" format="money" ariaLabel="Assets" />`
- Your part: If you pass a `format` function, return a short figure when it is called with the `compact` option.
- Proof, in the repository's tests (UiDonutChart.spec.ts, not in the package): "a total too long for the hole is written short there, and in full in the table"
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text

### Values by keys

- When: you need the parts, not only the ring.
- Props: `ariaLabel`.
- Guarantee: Tab reaches the ring; the arrow keys, Home and End move between the parts, and each is announced, for example “Groceries: 1,240, 34%”. A data table available to screen readers holds every part, including the ones folded into Other, and the total.
- Without it: Shares a screen reader never announces, and parts folded into Other that nobody can read.
- Code: `<UiDonutChart :parts="parts" ariaLabel="Spending by category, September" />`
- Your part: Name the chart with `ariaLabel`.
- Proof, in the repository's tests (UiDonutChart.spec.ts, not in the package): "the ring is one tab stop; the arrows walk the parts and each is said", "a hidden table holds every part, its share and the total"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#values-by-keys


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
