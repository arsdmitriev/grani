<script lang="ts">
export const blurb =
  'Compare amounts across periods with grouped or stacked bars and a plan line, with a marker for a period still in progress.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useUiT } from '../composables/useUiT'

const { n } = useUiT()
const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const kw = (v: number) => `${n(v, { maximumFractionDigits: 1 })} kW`

const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
const REVENUE = [980, 1150, 1210, 1040, 1320, 1260]
const ORDERS = [620, 700, 760, 640, 810, 790]
const EVENTS = [360, 450, 450, 400, 510, 470]
const PROFIT = [180, 240, -90, 120, -140, 210]
// Two months with nothing refunded: a zero is a sliver on the line, not the stub of no data.
const REFUNDS = [60, 0, 45, 0, 80, 30]
const HOURS = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const USE = [0.9, 1.6, 2.4, 1.5, 1.1, null, null, null]
const state = ref('loading')
const DAYS = Array.from({ length: 24 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)
const ORDERS_BY_DAY = [
  42, 38, 51, 47, 60, 22, 18, 44, 49, 55, 58, 63, 25, 20, 48, 52, 57, 61, 66, 28, 24, 53, 59, 64,
]
</script>

<template>
  <DemoBlock title="Base">
    <UiBarChart
      :x="MONTHS"
      :series="[{ key: 'revenue', label: 'Revenue', values: REVENUE }]"
      :format="eur"
      :highlight="5"
      :legend="false"
      ariaLabel="Revenue by month"
    />
  </DemoBlock>

  <DemoBlock title="Plan">
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
  </DemoBlock>

  <DemoBlock title="Side by side">
    <UiBarChart
      :x="MONTHS"
      :series="[
        { key: 'orders', label: 'Orders', values: ORDERS },
        { key: 'events', label: 'Events', values: EVENTS },
      ]"
      :format="eur"
      ariaLabel="Orders and events by month"
    />
  </DemoBlock>

  <DemoBlock title="Stacked">
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
  </DemoBlock>

  <DemoBlock title="Loss">
    <UiBarChart
      :x="MONTHS"
      :series="[{ key: 'profit', label: 'Profit', values: PROFIT }]"
      :format="eur"
      :legend="false"
      ariaLabel="Profit by month, two months at a loss"
    />
  </DemoBlock>

  <DemoBlock title="Zero">
    <UiBarChart
      :x="MONTHS"
      :series="[{ key: 'refunds', label: 'Refunds', values: REFUNDS }]"
      :format="eur"
      :legend="false"
      ariaLabel="Refunds by month, two months at zero"
    />
  </DemoBlock>

  <DemoBlock title="Partial">
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
  </DemoBlock>

  <DemoBlock title="Many">
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
  </DemoBlock>

  <DemoBlock title="In a card">
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
  </DemoBlock>
</template>
