<script lang="ts">
export const blurb =
  'See how much a value changed as a signed percentage, and whether the change is for the better.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUiT } from '../composables/useUiT'

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
const HOLDINGS = [
  { name: 'Vanguard Total Market', quarters: [18.2, 21.4, 19.7, 24.4] },
  { name: 'S&P 500 ETF', quarters: [36.6, 30.1, 33.4, 22.9] },
]
const series = computed(() => [
  { key: 'spent', label: 'Spent', values: [...BEFORE, current.value], variant: 'line' as const },
])
</script>

<template>
  <DemoBlock title="In a card">
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
  </DemoBlock>

  <DemoBlock title="Lower is better">
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
  </DemoBlock>

  <DemoBlock title="Losses">
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
  </DemoBlock>

  <DemoBlock title="Beside a sparkline" wide>
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
  </DemoBlock>

  <DemoBlock title="Sizes">
    <div class="flex flex-wrap items-center gap-4">
      <UiDelta :current="112.3" :previous="100" />
      <UiDelta :current="112.3" :previous="100" size="md" />
    </div>
  </DemoBlock>
</template>
