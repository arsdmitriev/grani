<script lang="ts">
export const blurb =
  'Compare the parts of a total in a ring chart, with the total in the center and each part available from the keyboard.'
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useUiT } from '../composables/useUiT'
import type { DonutPart } from '../components/UiDonutChart.vue'

const { n } = useUiT()
const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const SPENDING: DonutPart[] = [
  { key: 'rent', label: 'Rent', value: 1250 },
  { key: 'groceries', label: 'Groceries', value: 610 },
  { key: 'transport', label: 'Transport', value: 240 },
  { key: 'eating', label: 'Eating out', value: 185 },
  { key: 'subscriptions', label: 'Subscriptions', value: 64 },
]
const SOURCES: DonutPart[] = [
  { key: 'search', label: 'Search', value: 18420 },
  { key: 'direct', label: 'Direct', value: 9310 },
  { key: 'social', label: 'Social', value: 4870 },
  { key: 'email', label: 'Newsletter', value: 2140 },
  { key: 'referral', label: 'Other sites', value: 1260 },
  { key: 'ads', label: 'Ads', value: 820 },
  { key: 'podcast', label: 'Podcast', value: 310 },
]
const STORAGE: DonutPart[] = [
  { key: 'photos', label: 'Photos', value: 41.2 },
  { key: 'video', label: 'Video', value: 22.8 },
  { key: 'documents', label: 'Documents', value: 6.4 },
]
// A part of nothing, a whole of nothing and no data at all: each is said as it is, none is hidden.
const NO_CASH: DonutPart[] = [
  { key: 'card', label: 'Card', value: 2140 },
  { key: 'transfer', label: 'Transfer', value: 860 },
  { key: 'cash', label: 'Cash', value: 0 },
]
const NONE: DonutPart[] = NO_CASH.map((p) => ({ ...p, value: 0 }))
const UNKNOWN: DonutPart[] = NO_CASH.map((p) => ({ ...p, value: null }))
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
  <DemoBlock title="In a card">
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
  </DemoBlock>

  <DemoBlock title="Other">
    <UiDonutChart
      :parts="SOURCES"
      total-label="Visitors"
      ariaLabel="Visitors by source, last 30 days"
      class="max-w-md"
    />
  </DemoBlock>

  <DemoBlock title="Nothing">
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
  </DemoBlock>

  <DemoBlock title="Small">
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
  </DemoBlock>
</template>
