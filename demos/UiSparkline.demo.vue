<script lang="ts">
export const blurb =
  "See a value's recent trend beside the number, with gaps where data is missing."
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { TableColumn } from '../types/ui'

const RECEIPT = [41.2, 42.8, 40.9, 43.5, 44.1, 42.6, 45.3, 46.9, 45.8, 47.2, 48.9, 46.2]
const VISITS = [3200, 3450, 3380, 3710, 3620, 3950, 4120, 3980]
const REFUNDS = [18, 22, 19, 27, 31, 29, 36]
const QUARTERS = [18.2, 21.4, 19.7, 24.4]
const PROFIT = [1200, 900, -300, 450, -650, 800]
const HOLDINGS = [
  { name: 'Vanguard Total Market', quarters: [18.2, 21.4, 19.7, 24.4] },
  { name: 'S&P 500 ETF', quarters: [36.6, 30.1, 33.4, 22.9] },
  { name: 'Apple', quarters: [61.1, 58.3, 64.1, 59.2] },
]
// Seats never moved: a flat run stands at mid-height, not on an edge.
const SEATS = [12, 12, 12, 12, 12, 12]
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
  <DemoBlock title="Shapes">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <UiSparkline :values="VISITS" ariaLabel="Visitors, the last eight weeks" />
      <UiSparkline
        :values="RECEIPT"
        variant="area"
        ariaLabel="Average receipt, the last 12 months"
      />
      <UiSparkline :values="QUARTERS" variant="bar" ariaLabel="Dividends, the last four quarters" />
    </div>
  </DemoBlock>

  <DemoBlock title="Tones">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <UiSparkline :values="VISITS" tone="brand" ariaLabel="Visitors, the product's own figure" />
      <UiSparkline :values="RECEIPT" tone="neutral" ariaLabel="Average receipt" />
      <UiSparkline :values="VISITS" tone="success" ariaLabel="Visitors, rising" />
      <UiSparkline :values="REFUNDS" tone="warning" ariaLabel="Refunds, worth a look" />
      <UiSparkline :values="REFUNDS" tone="danger" ariaLabel="Refunds, rising" />
      <UiSparkline :values="RECEIPT" tone="info" ariaLabel="Average receipt, for the record" />
    </div>
  </DemoBlock>

  <DemoBlock title="Mark">
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
  </DemoBlock>

  <DemoBlock title="Beside a number" wide>
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
  </DemoBlock>

  <DemoBlock title="In a table" wide>
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
  </DemoBlock>

  <DemoBlock title="Gaps">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <UiSparkline :values="[40, 44, null, 47, 52, null]" ariaLabel="Orders, two weeks missing" />
      <UiSparkline
        :values="[10, null, 14, null, 16]"
        ariaLabel="Orders, every other week missing"
      />
      <UiSparkline :values="PROFIT" variant="bar" ariaLabel="Profit by month, two losses" />
    </div>
  </DemoBlock>

  <DemoBlock title="In a card">
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
  </DemoBlock>
</template>
