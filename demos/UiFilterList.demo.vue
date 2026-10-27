<script lang="ts">
export const blurb =
  'Narrow results by ticking options that apply at once; a search field appears when there are six or more.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectOption, SelectValue } from '../types/ui'

const few = ref(['food'])
const many = ref<SelectValue[]>([])
const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]
const COUNTRIES = ['Austria', 'Georgia', 'Latvia', 'Lithuania', 'Poland', 'Serbia', 'Spain'].map(
  (l) => ({ value: l.toLowerCase(), label: l }),
)
// The invoice number says what a row is: always on, and its description says so.
const COLUMNS: SelectOption[] = [
  { value: 'number', label: 'Invoice', disabled: true, description: 'always' },
  { value: 'client', label: 'Client' },
  { value: 'issued', label: 'Issued' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
]
const shown = ref(['number', 'client', 'amount'])
const held = ref(['latvia', 'poland'])
// The life of the options' load, switched by hand: a first load has no options yet, a refresh
// keeps them in view.
const listState = ref('loading')
const loadingItems = computed(() => (listState.value === 'loading' ? [] : COUNTRIES))
</script>

<template>
  <DemoBlock title="Few" row>
    <div class="w-64">
      <UiFilterList v-model="few" :items="CATEGORIES" ariaLabel="Categories" />
    </div>
  </DemoBlock>
  <DemoBlock title="Search" row>
    <div class="w-64"><UiFilterList v-model="many" :items="COUNTRIES" ariaLabel="Country" /></div>
  </DemoBlock>
  <DemoBlock title="Fixed" row>
    <div class="w-64"><UiFilterList v-model="shown" :items="COLUMNS" ariaLabel="Columns" /></div>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex w-full flex-col items-center gap-4">
      <div class="w-64">
        <UiFilterList
          v-model="held"
          :items="loadingItems"
          :loading="listState !== 'loaded'"
          ariaLabel="Country"
        />
      </div>
      <UiRadioGroup v-model="listState" variant="segmented" aria-label="State of the list">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Refreshing</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
</template>
