<script lang="ts">
export const blurb =
  'Open a small panel of options beside a button while keeping the rest of the page available.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'

const STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'canceled', label: 'Canceled' },
]
const note = ref('')
const currency = ref<string | null>(null)
const currencies = [
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar' },
  { value: 'gbp', label: 'Pound sterling' },
]
// The host opens it: at mount, as a page landing on a saved filter does, and from a button after.
const outsideOpen = ref(true)
const REGIONS = ['North', 'South', 'East', 'West'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}))
const region = ref([])
const due = ref('')
const drawerOpen = ref(false)
const drawerStatuses = ref(['due'])
</script>

<template>
  <DemoBlock title="Base" row>
    <!-- A few controls about the page, live as they change: a filter is UiFilter, columns UiTableColumns. -->
    <UiPopover align="center">
      <template #trigger>
        <UiButton variant="outline">Note</UiButton>
      </template>
      <UiField label="Note">
        <UiInput v-model="note" />
      </UiField>
      <template #footer="{ close }">
        <UiButton variant="secondary" size="xs" :disabled="!note" @click="note = ''"
          >Clear</UiButton
        >
        <UiButton size="xs" @click="close">Done</UiButton>
      </template>
    </UiPopover>
  </DemoBlock>
  <DemoBlock title="Nested" row>
    <UiPopover>
      <template #trigger>
        <UiButton variant="outline">Currency<ChevronDown /></UiButton>
      </template>
      <UiField label="Pay in">
        <UiSelect v-model="currency" :items="currencies" />
      </UiField>
    </UiPopover>
    <UiPopover>
      <template #trigger>
        <UiButton variant="outline">Due date<ChevronDown /></UiButton>
      </template>
      <UiField label="Due">
        <UiDatePicker v-model="due" class="w-full" />
      </UiField>
    </UiPopover>
  </DemoBlock>
  <DemoBlock title="Open" row>
    <UiPopover v-model:open="outsideOpen">
      <template #trigger>
        <UiButton variant="outline">Region<ChevronDown /></UiButton>
      </template>
      <UiFilterList v-model="region" :items="REGIONS" ariaLabel="Region" />
    </UiPopover>
    <UiButton variant="ghost" :disabled="outsideOpen" @click="outsideOpen = true">Open it</UiButton>
    <span class="text-xs text-fg-muted" role="status">{{ outsideOpen ? 'Open' : 'Closed' }}</span>
  </DemoBlock>
  <DemoBlock title="Drawer" row>
    <UiButton variant="outline" @click="drawerOpen = true">Open the client</UiButton>
    <UiCrudDrawer
      v-model:open="drawerOpen"
      title="Northwind Traders"
      description="client · 12 invoices"
      readonly
    >
      <UiCard>
        <div class="flex flex-col items-start gap-4">
          <UiPopover>
            <template #trigger>
              <UiButton variant="outline">Status<ChevronDown /></UiButton>
            </template>
            <UiFilterList v-model="drawerStatuses" :items="STATUSES" ariaLabel="Status" />
          </UiPopover>
          <p class="text-sm text-fg-muted">
            Escape closes the panel and leaves the drawer; a second Escape closes the drawer.
          </p>
        </div>
      </UiCard>
    </UiCrudDrawer>
  </DemoBlock>
</template>
