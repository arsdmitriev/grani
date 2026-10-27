<script lang="ts">
export const blurb =
  'Follow values over time as lines and filled areas. Explore each point from the keyboard, with gaps shown as missing data rather than zero.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
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
const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 2310]
const INCOME = [4100, 4150, 4300, 4380, 4220, 4400, 4460, 4390, 4520, 4610, 4580, 2790]
const ORDERS = [4200, 4600, 6100, 3900, 3700, 4400, 4800, 5100, 4700, 5300, 5600, 3100]
const EVENTS = [1800, 1500, 2600, 1200, 900, 1700, 2100, 2500, 2200, 2000, 2700, 1400]
// A gap on both sides of one month: that point stands alone, a dot no line reaches.
const PROFIT = [900, 1100, 1900, 300, -450, 700, 1000, null, 1300, null, 1500, 600]
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
const SPENDING_BEFORE = [3100, 3350, 3900, 3020, 2980, 3150, 3300, 3480, 3290, 3610, 3700, 3380]
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
const state = ref('loading')
</script>

<template>
  <DemoBlock title="Series">
    <UiAreaChart
      :x="MONTHS"
      :series="[
        { key: 'spending', label: 'Spending', values: SPENDING },
        { key: 'income', label: 'Income', values: INCOME, variant: 'line' },
      ]"
      :format="eur"
      ariaLabel="Spending and income by month"
    />
  </DemoBlock>

  <DemoBlock title="Gaps">
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
  </DemoBlock>

  <DemoBlock title="Partial">
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
  </DemoBlock>

  <DemoBlock title="Compare">
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
  </DemoBlock>

  <DemoBlock title="One">
    <UiAreaChart
      :x="MONTHS"
      :series="[{ key: 'spending', label: 'Spending', values: SPENDING }]"
      :format="eur"
      curve="step"
      ariaLabel="Spending by month"
    />
  </DemoBlock>

  <DemoBlock title="Shape">
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
  </DemoBlock>

  <DemoBlock title="In a card">
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
  </DemoBlock>

  <DemoBlock title="Percent">
    <UiAreaChart
      :x="WEEKS"
      :series="[{ key: 'share', label: 'Paid on time', values: ON_TIME, variant: 'line' }]"
      grain="week"
      format="percent"
      :legend="false"
      :height="180"
      ariaLabel="Invoices paid on time, by week"
    />
  </DemoBlock>
</template>
