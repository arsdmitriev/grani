# Sparkline (`UiSparkline`)

> See a value's recent trend beside the number, with gaps where data is missing.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/sparkline

Also called mini chart, trend line, inline chart.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiSparkline } from 'grani-ui'

const RECEIPT = [41.2, 42.8, 40.9, 43.5, 44.1, 42.6, 45.3, 46.9, 45.8, 47.2, 48.9, 46.2]

const VISITS = [3200, 3450, 3380, 3710, 3620, 3950, 4120, 3980]

const QUARTERS = [18.2, 21.4, 19.7, 24.4]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <UiSparkline :values="VISITS" ariaLabel="Visitors, the last eight weeks" />
    <UiSparkline
      :values="RECEIPT"
      variant="area"
      ariaLabel="Average receipt, the last 12 months"
    />
    <UiSparkline :values="QUARTERS" variant="bar" ariaLabel="Dividends, the last four quarters" />
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show missing data as a gap.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `null` where there is no data, and `0` only for a real zero.

## Why it works this way

A small trend with no axes, beside the number it belongs to. Take it in a table cell, in a strip's actions beside a UiDelta, or under a headline in a UiChartCard.

**Shapes.** `line` and `area` stretch in one viewBox, with a dot on the newest value kept inside the box; a flat run stands at mid-height. `bar` draws HTML boxes from zero: the newest one (or `highlight`) is full, and the rest are pale with a line at their height, so each still reads. Bars stand 4px apart while there is room; a long run in a narrow host closes the gaps.

**Gaps.** A `null` is no data: the line breaks (a single value between two gaps is a dot), and a bar's place stays empty. A zero is a stub on the zero line.

Size and tone. The host sets the width, and `height` sets the height. Set `tone` to agree with the verdict beside it. `mark` draws one reference line, an average or a plan, named at its end.

In a card. In a UiChartCard it draws its shape pale on the first load and holds it still when there is nothing to draw.

### Keyboard

Not interactive: no tab stop, no keys; the number beside it carries the value.

### Screen reader

- Name: without `ariaLabel` it is hidden (`aria-hidden`), and the number beside it says the value; with one it is an image with that name, followed by the mark's label ("Average receipt, the last 12 months, 12-month average 43.06").
- Values: not read; a chart a reader can walk is UiAreaChart or UiBarChart.
- Hidden: on a card's first load, when the card has nothing to draw, and when no value is a number, whatever its name.

### States

`line`, `area` and `bar`, a dot on the newest value or on `highlight`, a gap (`null`) that breaks the line or leaves a bar's place empty, a loss below the zero line, a flat run at mid-height, a `mark` with its name, six tones. In a UiChartCard: its first load as a pale shape, nothing to draw held still, a refresh dimmed by the card. No hover or focus state of its own.

### When to use another component

- A chart with axes, a legend and a tooltip: UiAreaChart or UiBarChart.
- A share of a whole: UiProgress.
- The verdict beside it: UiDelta.
- A single figure with a trend as a card: UiChartCard with `bleed="full"`.

## Examples

### Tones

```vue
<script setup lang="ts">
import { UiSparkline } from 'grani-ui'

const RECEIPT = [41.2, 42.8, 40.9, 43.5, 44.1, 42.6, 45.3, 46.9, 45.8, 47.2, 48.9, 46.2]

const VISITS = [3200, 3450, 3380, 3710, 3620, 3950, 4120, 3980]

const REFUNDS = [18, 22, 19, 27, 31, 29, 36]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <UiSparkline :values="VISITS" tone="brand" ariaLabel="Visitors, the product's own figure" />
    <UiSparkline :values="RECEIPT" tone="neutral" ariaLabel="Average receipt" />
    <UiSparkline :values="VISITS" tone="success" ariaLabel="Visitors, rising" />
    <UiSparkline :values="REFUNDS" tone="warning" ariaLabel="Refunds, worth a look" />
    <UiSparkline :values="REFUNDS" tone="danger" ariaLabel="Refunds, rising" />
    <UiSparkline :values="RECEIPT" tone="info" ariaLabel="Average receipt, for the record" />
  </div>
</template>

```

### Mark

```vue
<script setup lang="ts">
import { UiSparkline } from 'grani-ui'

const RECEIPT = [41.2, 42.8, 40.9, 43.5, 44.1, 42.6, 45.3, 46.9, 45.8, 47.2, 48.9, 46.2]

const VISITS = [3200, 3450, 3380, 3710, 3620, 3950, 4120, 3980]

const QUARTERS = [18.2, 21.4, 19.7, 24.4]

// Seats never moved: a flat run stands at mid-height, not on an edge.
const SEATS = [12, 12, 12, 12, 12, 12]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <UiSparkline :values="SEATS" ariaLabel="Seats, unchanged for six months" />
    <UiSparkline
      :values="RECEIPT"
      :mark="{ at: 44.62, label: '12-month average 44.62' }"
      :height="48"
      ariaLabel="Average receipt, the last 12 months"
    />
    <UiSparkline :values="VISITS" :highlight="3" ariaLabel="Visitors, the fourth week in light" />
    <UiSparkline
      :values="QUARTERS"
      variant="bar"
      :highlight="1"
      ariaLabel="Dividends, the second quarter in light"
    />
  </div>
</template>

```

### Beside a number

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem, UiSparkline } from 'grani-ui'

const HOLDINGS = [
  { name: 'Vanguard Total Market', quarters: [18.2, 21.4, 19.7, 24.4] },
  { name: 'S&P 500 ETF', quarters: [36.6, 30.1, 33.4, 22.9] },
  { name: 'Apple', quarters: [61.1, 58.3, 64.1, 59.2] },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem v-for="h in HOLDINGS" :key="h.name" :title="h.name">
        <template #actions>
          <UiSparkline :values="h.quarters" variant="bar" class="w-16" />
          <span class="w-14 text-end text-sm font-medium tabular-nums">
            ${{ h.quarters[3]!.toFixed(2) }}
          </span>
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### In a table

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiTable, UiSparkline } from 'grani-ui'

interface Client {
  name: string
  months: number[]
}

const CLIENTS: Client[] = [
  { name: 'Contoso', months: [3.1, 3.4, 3.2, 3.9, 4.2, 4.6] },
  { name: 'Fabrikam', months: [2.8, 2.6, 2.9, 2.4, 2.2, 2.0] },
  { name: 'Northwind', months: [1.2, 1.4, 1.3, 1.5, 1.6, 1.5] },
]

const columns: TableColumn<Client>[] = [
  { key: 'name', label: 'Client' },
  { key: 'months', label: 'Last six months', width: '140px' },
  { key: 'now', label: 'September', width: '110px', align: 'end', accessor: (c) => c.months[5] },
]
</script>

<template>
  <UiTable
    :columns="columns"
    :items="CLIENTS"
    aria-label="Revenue by client"
    class="w-full max-w-lg"
  >
    <template #cell.months="{ row }">
      <UiSparkline :values="row.months" class="w-24" />
    </template>
    <template #cell.now="{ value }">
      <span class="tabular-nums">€{{ (value as number).toFixed(1) }}k</span>
    </template>
  </UiTable>
</template>

```

### Gaps

```vue
<script setup lang="ts">
import { UiSparkline } from 'grani-ui'

const PROFIT = [1200, 900, -300, 450, -650, 800]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-6">
    <UiSparkline :values="[40, 44, null, 47, 52, null]" ariaLabel="Orders, two weeks missing" />
    <UiSparkline
      :values="[10, null, 14, null, 16]"
      ariaLabel="Orders, every other week missing"
    />
    <UiSparkline :values="PROFIT" variant="bar" ariaLabel="Profit by month, two losses" />
  </div>
</template>

```

### In a card

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { UiChartCard, UiSparkline, UiRadioGroup, UiRadio } from 'grani-ui'

const RECEIPT = [41.2, 42.8, 40.9, 43.5, 44.1, 42.6, 45.3, 46.9, 45.8, 47.2, 48.9, 46.2]

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
      title="Average receipt"
      :value="state === 'loaded' || state === 'refreshing' ? 46.2 : null"
      :caption="state === 'loaded' || state === 'refreshing' ? 'in September' : null"
      :loading="state === 'loading' || state === 'refreshing'"
      :empty="state === 'loading' || state === 'empty' || state === 'failed'"
      :error="state === 'failed' ? 'The server did not answer. Try again.' : null"
      bleed="full"
      class="w-full max-w-xs"
      @retry="retry"
    >
      <UiSparkline
        :values="RECEIPT"
        variant="area"
        :endpoint="false"
        :height="64"
        ariaLabel="Average receipt, the last 12 months"
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
- `values`: `(number | null)[]` (required) — The values in order, the newest last; `null` is no data, a gap.
- `variant`: `"line" | "area" | "bar"` = `line | area | bar` (default `"line"`) — `line` a trend, `area` the same filled below, `bar` one box per value from zero.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"brand"`) — What the trend means: `brand` for a figure of the product, `success` or `danger` for a verdict, `neutral` for a quiet one.
- `endpoint`: `boolean` (default `true`) — A dot on the newest value of a line or an area.
- `height`: `number` (default `28`) — The height in pixels; the host sets the width.
- `highlight`: `number` — The index of the value in light: the full bar, or the dot on a line; the newest value when unset.
- `mark`: `{ at: number; label: string; }` — A line of reference across the trend, named at its end: `{ at: 43.06, label: '12-month average 43.06' }`.
- `ariaLabel`: `string` (default `""`) — What the trend shows, for a screen reader: "Average receipt, the last 12 months". Unset, it is decoration.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### A gap, not a zero

- When: a value is missing.
- Props: `values` with `null` where there is no data.
- Guarantee: A `null` breaks the line, which resumes at the next available value. An isolated value is shown as a dot so it remains visible, and the endpoint dot marks the latest available value. In a bar sparkline, missing data leaves an empty space.
- Without it: A missing day is drawn as a dive to zero: a fall that never happened.
- Code: `<UiSparkline :values="[40, 44, null, 47, 52]" />`
- Your part: Pass `null` where there is no data, and `0` only for a real zero.
- Proof, in the repository's tests (UiSparkline.spec.ts, not in the package): "a missing value breaks the line, and the dot stands on the newest value there is", "a bar with no value leaves its place empty rather than drawing a stub", "a value alone between two gaps is drawn as a dot, not a speck of line"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#gap-not-zero


The patterns: https://grani.arseni.work/patterns
