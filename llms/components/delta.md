# Delta (`UiDelta`)

> See how much a value changed as a signed percentage, and whether the change is for the better.

A component of grani-ui 0.1.0. Charts, stable, since 0.1.0. Page: https://grani.arseni.work/components/delta

Also called trend indicator, change indicator, percent change.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiChartCard, UiDelta, UiAreaChart, UiRadioGroup, UiRadio, useUiT } from 'grani-ui'

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

const BEFORE = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020]

// Spending: lower is better, so a fall is success and a rise danger (`invert`).
const SEPTEMBER = { fell: 3640, rose: 4380, flat: 4021, first: 3640 } as const

const state = ref<keyof typeof SEPTEMBER>('fell')

const current = computed(() => SEPTEMBER[state.value])

const previous = computed(() => (state.value === 'first' ? null : BEFORE[10]!))

const series = computed(() => [
  { key: 'spent', label: 'Spent', values: [...BEFORE, current.value], variant: 'line' as const },
])
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiChartCard
      title="Spending"
      :value="current"
      caption="in September"
      :format="eur"
      class="w-full max-w-lg"
    >
      <template #actions>
        <UiDelta :current="current" :previous="previous" invert label="vs August" />
      </template>
      <UiAreaChart
        :x="MONTHS"
        :series="series"
        :format="eur"
        :y-axis="false"
        :legend="false"
        :height="140"
        ariaLabel="Spending by month"
      />
    </UiChartCard>
    <UiRadioGroup v-model="state" variant="segmented" aria-label="September against August">
      <UiRadio value="fell">Less</UiRadio>
      <UiRadio value="rose">More</UiRadio>
      <UiRadio value="flat">No change</UiRadio>
      <UiRadio value="first">Nothing to compare</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show a shrinking loss as an improvement.
- Name states in words, not color alone.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass both values as they are, signs included, and do not count the percent yourself.
- Set `invert` when lower is better, so the word agrees with the color.

## Why it works this way

A badge with the signed percent a value moved against the one before. Take it beside a number, beside a UiSparkline, or on a chart card's title line.

**Counting.** The library counts the percent against the size of `previous`, so a smaller loss reads as growth. No previous value, a zero one, or a change over 10 000% draws nothing.

**Meaning.** Growth is `success` and a fall is `danger`; `invert` swaps them when lower is better. The sign and a word for a screen reader ("better", "worse") carry the meaning, so it does not rest on color alone.

**Placement.** On a UiChartCard's title line, beside a UiSparkline in a UiListItem row's `#actions`, and beside a number. On a chart card it reads the card's state as the chart does: while the card has no data (a first load, nothing to draw, a failed load) it draws nothing, and comes back with the data; a refresh keeps it. The badge never shrinks, so a long label beside it cannot cut off the sign or the digits; the label wraps when the host is narrow. The root is a `<span>`.

### Keyboard

Not interactive: no tab stop, no keys.

### Screen reader

- Value: the percent is hidden and a verdict is read in its place, the change and a word: "+12%, better" or "-8%, worse"; no change is read as 0% with no verdict.
- Label: the label after the badge is read as text, after the verdict.

### States

Growth (`success`), a fall (`danger`), the two swapped by `invert`, no change (`neutral`, 0%), and nothing drawn: no `previous`, a zero one, a change past 10 000%, or a chart card around it with no data. Two sizes, `sm` and `md`; no hover or focus state of its own.

### When to use another component

- The trend itself: UiSparkline beside it.
- A state word: UiBadge.
- A count: UiCount.
- A share of a whole: UiProgress.

## Examples

### Lower is better

```vue
<script setup lang="ts">
import { UiDelta } from 'grani-ui'
</script>

<template>
  <div class="flex flex-col gap-4 text-sm text-fg">
    <div class="flex flex-wrap items-center gap-4">
      <span class="w-20 text-fg-muted">Revenue</span>
      <UiDelta :current="112.3" :previous="100" label="vs August" />
      <UiDelta :current="80" :previous="100" label="vs August" />
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <span class="w-20 text-fg-muted">Refunds</span>
      <UiDelta :current="112.3" :previous="100" invert label="vs August" />
      <UiDelta :current="80" :previous="100" invert label="vs August" />
    </div>
  </div>
</template>

```

### Losses

```vue
<script setup lang="ts">
import { UiDelta } from 'grani-ui'
</script>

<template>
  <div class="flex flex-col gap-4 text-sm text-fg">
    <div class="flex flex-wrap items-center gap-4">
      <span class="w-36 text-fg-muted">Loss fell to €50</span>
      <UiDelta :current="-50" :previous="-100" label="vs a loss of €100" />
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <span class="w-36 text-fg-muted">Loss grew to €150</span>
      <UiDelta :current="-150" :previous="-100" label="vs a loss of €100" />
    </div>
  </div>
</template>

```

### Beside a sparkline

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem, UiSparkline, UiDelta } from 'grani-ui'

const HOLDINGS = [
  { name: 'Vanguard Total Market', quarters: [18.2, 21.4, 19.7, 24.4] },
  { name: 'S&P 500 ETF', quarters: [36.6, 30.1, 33.4, 22.9] },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem v-for="h in HOLDINGS" :key="h.name" :title="h.name">
        <template #actions>
          <UiSparkline :values="h.quarters" class="w-16" />
          <UiDelta :current="h.quarters[3]!" :previous="h.quarters[2]!" />
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiDelta } from 'grani-ui'
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <UiDelta :current="112.3" :previous="100" />
    <UiDelta :current="112.3" :previous="100" size="md" />
  </div>
</template>

```

## API

Props:
- `current`: `number` (required) — The value now.
- `previous`: `number | null` (default `null`) — The value it is compared with; `null`, missing, zero or not finite draws nothing.
- `invert`: `boolean` (default `false`) — Lower is better: a fall is `success`, growth `danger`.
- `label`: `string` (default `""`) — What it is compared with, shown after the badge: "vs August". A screen reader reads it as text after the verdict.
- `size`: `"sm" | "md"` = `sm | md` (default `"sm"`) — `sm` on a chart card's title line, in a row or a cell; `md` beside a larger heading.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### Smaller loss is growth

- When: the value before is below zero: a loss, a deficit, a negative balance.
- Props: `current`, `previous`.
- Guarantee: The percentage is calculated against the absolute value of `previous`: −100 to −50 is +50%, better; −100 to −150 is −50%, worse. For a metric where lower is better, set `invert`: it reverses the better/worse assessment, not the sign of the percentage.
- Without it: `(current - previous) / previous` shows -50% in red for a loss that halved, so an improvement reads as a fall.
- Code: `<UiDelta :current="-50" :previous="-100" label="vs August" />`
- Your part: Pass both values as they are, signs included, and do not count the percent yourself.
- Proof, in the repository's tests (UiDelta.spec.ts, not in the package): "a negative base still reads by the direction of the move", "invert with a negative base: a smaller loss is growth, so it is worse"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#loss-shrinks

### Words, not only color

- When: it shows a change.
- Props: none: every UiDelta.
- Guarantee: The sign appears in the badge beside the color, and a screen reader announces the change with a word: “+12%, better”, “-8%, worse”.
- Without it: A green or red pill whose meaning is lost on anyone who does not tell the colors apart.
- Code: `<UiDelta :current="112" :previous="100" label="vs August" />`
- Your part: Set `invert` when lower is better, so the word agrees with the color.
- Proof, in the repository's tests (UiDelta.spec.ts, not in the package): "says better or worse for a screen reader, not only in color"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#level-not-by-colour


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
