<script lang="ts">
export const blurb =
  'Show a chart with its title and key number; the card keeps its space while loading and says when the result is empty or an update failed.'
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useUiT } from '../composables/useUiT'
import type { AreaSeries } from '../components/UiAreaChart.vue'

const { n } = useUiT()
const eur = (v: number) => n(v, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const cents = (v: number) => n(v, { style: 'currency', currency: 'EUR' })

// A receipt is read to the cent; its year is only a trend under it.
const RECEIPT = [44.1, 45.3, 49.8, 47.2, 45.9, 46.4, 47.9, 48.6, 47.1, 48.3, 48.99, 46.16]

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
const SPENDING = [3420, 3610, 4280, 3180, 3050, 3390, 3520, 3710, 3460, 3890, 4020, 3640]
const INCOME = [4100, 4150, 4300, 4380, 4220, 4400, 4460, 4390, 4520, 4610, 4580, 4700]
const SPENDING_LAST_YEAR = [2860, 2940, 3620, 2780, 2610, 2750, 2900, 3010, 2830, 3120, 3180, 3050]
// Spending that grows is danger; the year before is gray and dashed beside this one. Lines, not
// areas: an area stands on zero and flattens the gap a comparison is about.
const YEAR_OVER_YEAR: AreaSeries[] = [
  { key: 'now', label: 'This year', values: SPENDING, variant: 'line' },
  {
    key: 'last',
    label: 'A year before',
    values: SPENDING_LAST_YEAR,
    variant: 'line',
    dashed: true,
  },
]
// The plan is one line over the bars; the headline is the verdict, counted, not the sum.
const PLAN = 1100
const REVENUE = [980, 1150, 1210, 1040, 1320, 1260]
const metPlan = REVENUE.filter((v) => v >= PLAN).length

// The hours to come are gaps, not zeros: the day is still going.
const HOURS = ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const NOW = 4
const POWER_TODAY = [1.2, 2.6, 3.4, 1.9, 1.1, null, null, null]
const kw = (v: number) => `${n(v, { maximumFractionDigits: 1 })} kW`

// One row a category, the largest month first; eight months each, the newest last.
const CATEGORIES = [
  { name: 'Groceries', months: [980, 1040, 1010, 1120, 990, 1060, 1100, 1180] },
  { name: 'Home', months: [640, 610, 700, 820, 760, 690, 720, 750] },
  { name: 'Transport', months: [420, 380, 460, 510, 440, 470, 530, 490] },
  { name: 'Cafés', months: [210, 260, 230, 300, 280, 250, 270, 340] },
]
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
// What is left of the year's income, added up month by month: the line ends on the headline.
// A flat stretch is a month that kept nothing; a fall, a month spent past what came in.
const saved = sum(INCOME) - sum(SPENDING)
const SAVED_SO_FAR = INCOME.reduce<number[]>(
  (acc, v, i) => [...acc, (acc.at(-1) ?? 0) + v - SPENDING[i]!],
  [],
)

// What a month is made of: one series on another, the tooltip adds the bar up.
const ORDERS = [320, 360, 290, 410, 380, 440]
const EVENTS = [180, 150, 210, 170, 240, 200]

// The life of a request, on one card: a failed load's Retry and a failed refresh's Retry both
// load again for a second and a half and come back with the chart.
type State = 'loaded' | 'loading' | 'updating' | 'empty' | 'failed' | 'stale'
const state = ref<State>('loading')
const FAILED = 'The server did not answer. Check the connection and try again.'
let timer: ReturnType<typeof setTimeout> | undefined
function retry() {
  const from = state.value
  state.value = from === 'stale' ? 'updating' : 'loading'
  clearTimeout(timer)
  timer = setTimeout(() => (state.value = 'loaded'), 1500)
}
// A state picked by hand while Retry loads stands: the late answer does not overwrite it.
watch(state, (s) => {
  if (s !== 'loading' && s !== 'updating') clearTimeout(timer)
})
onBeforeUnmount(() => clearTimeout(timer))
// No number yet, none to show or a failed load: `null` keeps the headline's lines, so the card keeps its height.
const NO_NUMBER: State[] = ['loading', 'empty', 'failed']
const shownValue = computed(() => (NO_NUMBER.includes(state.value) ? null : SPENDING[11]!))
const shownCaption = computed(() => (NO_NUMBER.includes(state.value) ? null : 'in September'))
</script>

<template>
  <DemoBlock title="Number">
    <UiChartCard
      title="Average receipt"
      :value="RECEIPT[11]!"
      :format="cents"
      bleed="full"
      class="w-full max-w-xs"
    >
      <template #actions>
        <UiDelta :current="RECEIPT[11]!" :previous="RECEIPT[10]!" label="vs August" />
      </template>
      <UiSparkline
        :values="RECEIPT"
        variant="area"
        :endpoint="false"
        :height="64"
        ariaLabel="Average receipt, the last 12 months"
      />
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Delta">
    <UiChartCard
      title="Spending by month"
      :value="SPENDING[11]!"
      caption="in September"
      :format="eur"
      bleed="sides"
      class="w-full max-w-sm"
    >
      <template #actions>
        <UiDelta :current="SPENDING[11]!" :previous="SPENDING[10]!" label="vs August" invert />
      </template>
      <UiAreaChart
        :x="MONTHS"
        :series="YEAR_OVER_YEAR"
        :format="eur"
        :height="160"
        ariaLabel="Spending by month against the year before"
      />
      <template #footer>{{ eur(sum(SPENDING) / 12) }} a month on average</template>
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Rows">
    <UiChartCard
      title="Spending by category"
      description="September against August"
      class="w-full max-w-sm"
    >
      <template #actions>
        <UiLink to="#categories" tone="neutral" class="text-sm">All</UiLink>
      </template>
      <UiList>
        <UiListItem v-for="c in CATEGORIES" :key="c.name" :title="c.name">
          <template #actions>
            <UiSparkline :values="c.months" class="w-16" />
            <span class="flex min-w-16 flex-col items-end gap-0.5 whitespace-nowrap">
              <span class="text-sm font-medium tabular-nums">{{ eur(c.months[7]!) }}</span>
              <UiDelta :current="c.months[7]!" :previous="c.months[6]!" invert />
            </span>
          </template>
        </UiListItem>
      </UiList>
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Plan">
    <UiChartCard
      title="Revenue against the plan"
      :value="`${metPlan} of 6 months`"
      :caption="`met the plan of ${eur(PLAN)}`"
      class="w-full max-w-sm"
    >
      <UiBarChart
        :x="MONTHS.slice(6)"
        :series="[{ key: 'revenue', label: 'Revenue', values: REVENUE }]"
        :highlight="5"
        :marks="[{ at: PLAN, label: 'Plan' }]"
        :y-axis="false"
        :legend="false"
        :height="180"
        :format="eur"
        ariaLabel="Revenue by month against the plan"
      />
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Partial">
    <UiChartCard
      title="Power use today"
      :value="kw(POWER_TODAY[NOW]!)"
      :caption="`now, at ${HOURS[NOW]}`"
      class="w-full max-w-sm"
    >
      <UiBarChart
        :x="HOURS"
        :series="[{ key: 'use', label: 'Use', values: POWER_TODAY }]"
        :highlight="NOW"
        :y-axis="false"
        :legend="false"
        :height="160"
        :format="kw"
        ariaLabel="Power use by hour, today"
      />
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Saved">
    <UiChartCard
      title="Saved over 12 months"
      :value="saved"
      :caption="`earned ${eur(sum(INCOME))} · spent ${eur(sum(SPENDING))}`"
      :format="eur"
      bleed="sides"
      class="w-full max-w-sm"
    >
      <template #actions>
        <UiLink to="#budget" tone="neutral" class="text-sm">Budget</UiLink>
      </template>
      <UiAreaChart
        :x="MONTHS"
        :series="[{ key: 'saved', label: 'Saved', values: SAVED_SO_FAR }]"
        :format="eur"
        :legend="false"
        :height="160"
        ariaLabel="Savings over the year, month by month"
      />
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="Stacked">
    <UiChartCard
      title="Orders and events"
      :value="sum(ORDERS) + sum(EVENTS)"
      caption="revenue over six months"
      :format="eur"
      class="w-full max-w-sm"
    >
      <UiBarChart
        :x="MONTHS.slice(6)"
        :series="[
          { key: 'orders', label: 'Orders', values: ORDERS },
          { key: 'events', label: 'Events', values: EVENTS },
        ]"
        stack
        :tooltip-total="{ label: 'Revenue', of: ['orders', 'events'] }"
        :y-axis="false"
        :height="180"
        :format="eur"
        ariaLabel="Revenue from orders and events by month"
      />
    </UiChartCard>
  </DemoBlock>

  <DemoBlock title="States">
    <div class="flex w-full flex-col items-center gap-4">
      <UiChartCard
        title="Spending by month"
        :value="shownValue"
        :caption="shownCaption"
        :format="eur"
        bleed="sides"
        :loading="state === 'loading' || state === 'updating'"
        :empty="state === 'loading' || state === 'empty' || state === 'failed'"
        :error="
          state === 'failed' ? FAILED : state === 'stale' ? 'The newest month did not load.' : null
        "
        class="w-full max-w-sm"
        @retry="retry"
      >
        <template #actions>
          <UiDelta :current="SPENDING[11]!" :previous="SPENDING[10]!" label="vs August" invert />
        </template>
        <UiAreaChart
          :x="MONTHS"
          :series="YEAR_OVER_YEAR"
          :format="eur"
          :height="160"
          ariaLabel="Spending by month against the year before"
        />
        <template #empty>
          <UiNoData
            size="sm"
            title="No spending yet"
            description="Add the first expense and the chart starts from its month."
          >
            <template #actions>
              <UiButton variant="secondary">Add an expense</UiButton>
            </template>
          </UiNoData>
        </template>
      </UiChartCard>
      <UiRadioGroup v-model="state" variant="segmented" aria-label="State of the chart">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="updating">Updating</UiRadio>
        <UiRadio value="empty">No data</UiRadio>
        <UiRadio value="failed">Failed</UiRadio>
        <UiRadio value="stale">Refresh failed</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
</template>
