<script lang="ts">
export const blurb =
  'Filter records by a period such as “This month”, which stays current, or choose two dates in either order.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToday } from '../composables/useToday'
import type { DateRangeValue } from '../types/ui'
import type { RangePreset } from '../utils/dateRange'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })
const days = (from: string | null, to: string | null) =>
  ref<DateRangeValue>({ from, to, preset: 'custom' })
const period = named('prev_month')
const search = ref('')
const dense = named('this_month')
const row = named('this_month')
const all = named('all')
const month = named('this_month')
const span = days('2025-11-03', '2025-12-19')
const since = days('2026-06-01', null)
const until = days(null, '2026-08-31')
const year = named('this_year')
const outside = named('3_months')
const reset = () => (outside.value = { from: null, to: null, preset: 'all' })
// In a form: the field's label names it, and an error stands until a period is picked.
const term = ref<DateRangeValue>({ from: null, to: null, preset: null })
const stepped = named('prev_month')
const week = named('this_week')
const locked = named('prev_month')
// Records kept since the first of this year, none in the future.
const { now } = useToday()
const yearStart = computed(() => `${now.value.slice(0, 4)}-01-01`)
const bounded = named('this_month')
const ruWeek = named('this_week')
</script>

<template>
  <DemoBlock title="Toolbar">
    <UiCard :padded="false" class="w-full max-w-xl">
      <UiTableToolbar v-model:search="search" search-placeholder="Search invoices">
        <template #start="{ size }">
          <UiDateRange v-model="period" ariaLabel="Issued" :size="size" />
        </template>
      </UiTableToolbar>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex flex-col items-start gap-4">
      <UiDateRange v-model="dense" size="xs" />
      <UiDateRange v-model="row" size="md" />
    </div>
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiDateRange v-model="all" />
    <UiDateRange v-model="month" />
    <UiDateRange v-model="span" />
    <UiDateRange v-model="since" />
    <UiDateRange v-model="until" />
    <UiDateRange v-model="year" />
    <UiDateRange v-model="locked" disabled />
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField
      label="Contract term"
      description="The days the contract is in force."
      :error="term.from || term.to ? undefined : 'Pick the days of the contract'"
      required
    >
      <UiDateRange v-model="term" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Outside" row>
    <UiDateRange v-model="outside" />
    <UiButton variant="outline" @click="reset">Reset</UiButton>
  </DemoBlock>
  <DemoBlock title="Stepper">
    <div class="flex flex-col items-start gap-4">
      <UiDateRange v-model="stepped" stepper />
      <UiDateRange v-model="week" stepper />
      <UiDateRange v-model="locked" stepper disabled />
    </div>
  </DemoBlock>
  <DemoBlock title="Window">
    <!-- This month runs to today, Last year cannot be picked, and the calendar stops at both. -->
    <UiDateRange v-model="bounded" :min="yearStart" :max="now" stepper />
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). The week starts on Monday. -->
    <UiDateRange v-model="ruWeek" stepper />
  </DemoBlock>
</template>
