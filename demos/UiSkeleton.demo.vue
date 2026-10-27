<script lang="ts">
export const blurb =
  'Show where content will appear while it loads, holding its space so the page around it moves less.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const people = [
  { name: 'Anna Petrova', email: 'anna@example.com' },
  { name: 'Ivan Sidorov', email: 'ivan@example.com' },
  { name: 'Maria Kova', email: 'maria@example.com' },
]
const card = ref('loading')
const rows = ref('loading')
</script>

<template>
  <DemoBlock title="Where it shows">
    <!-- A card, a table and a drawer draw it themselves under `loading`. -->
    <div class="flex w-full flex-col items-center gap-4">
      <UiCard
        title="Release notes"
        description="What changed this week."
        :loading="card === 'loading'"
        class="w-full max-w-xs"
      >
        <p v-if="card === 'loaded'" class="text-sm text-fg-muted">
          Invoices export to CSV, the period picker remembers the last range, and the search in a
          list clears with Escape.
        </p>
      </UiCard>
      <UiRadioGroup v-model="card" variant="segmented" aria-label="State of the card">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="By hand">
    <div class="flex w-full flex-col items-center gap-4">
      <!-- Hand-made, so it says its own loading: a region that stays, words only while it loads. -->
      <span class="sr-only" role="status">{{
        rows === 'loading' ? 'Loading the people…' : ''
      }}</span>
      <UiCard v-if="rows === 'loading'" :padded="false" aria-busy="true" class="w-full max-w-xs">
        <UiList>
          <UiListItem v-for="i in 3" :key="i">
            <template #media><UiSkeleton class="h-8 w-8 rounded-pill" /></template>
            <div class="text-sm">
              <div><UiSkeleton class="inline-block h-3 w-28 align-middle" /></div>
              <div><UiSkeleton class="inline-block h-3 w-40 align-middle" /></div>
            </div>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiCard v-else :padded="false" class="w-full max-w-xs">
        <UiList>
          <UiListItem
            v-for="person in people"
            :key="person.email"
            :title="person.name"
            :description="person.email"
          >
            <template #media><UiAvatar :name="person.name" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiRadioGroup v-model="rows" variant="segmented" aria-label="State of the rows">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Blocks" row>
    <UiSkeleton class="h-4 w-32" />
    <UiSkeleton class="h-9 w-40" />
    <UiSkeleton class="h-10 w-10 rounded-pill" />
  </DemoBlock>
</template>
