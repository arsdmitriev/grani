<script lang="ts">
export const blurb = 'Add a short status or tag beside an item, such as “Draft” or “Paid”.'
</script>

<template>
  <DemoBlock title="Tones" row>
    <UiBadge tone="neutral">Category</UiBadge>
    <UiBadge tone="brand">New</UiBadge>
    <UiBadge tone="success">Active</UiBadge>
    <UiBadge tone="warning">Under review</UiBadge>
    <UiBadge tone="danger">Blocked</UiBadge>
    <UiBadge tone="info">In progress</UiBadge>
  </DemoBlock>
  <DemoBlock title="Dot" row>
    <UiBadge tone="success" dot>Online</UiBadge>
    <UiBadge tone="neutral" dot>Offline</UiBadge>
    <UiBadge tone="warning" dot>Attention</UiBadge>
    <UiBadge tone="danger" dot>Blocked</UiBadge>
    <UiBadge tone="info" dot>Syncing</UiBadge>
  </DemoBlock>
  <DemoBlock title="Inline" row>
    <UiBadge variant="inline" tone="success" label="Delivered" />
    <UiBadge variant="inline" tone="danger" label="Canceled" />
    <UiBadge variant="inline" size="sm" tone="neutral" label="Draft" />
  </DemoBlock>
  <DemoBlock title="Outline" row>
    <UiBadge variant="outline" tone="neutral" label="Guest" />
    <UiBadge variant="outline" tone="brand" label="Owner" />
    <UiBadge variant="outline" tone="success" label="Verified" />
    <UiBadge variant="outline" tone="warning" label="Pending" />
    <UiBadge variant="outline" tone="danger" label="Failed" />
    <UiBadge variant="outline" tone="info" label="Admin" />
  </DemoBlock>
  <DemoBlock title="Long label">
    <!-- Hover the badge: the whole label is in the tooltip. -->
    <div class="w-40">
      <UiBadge tone="info" dot label="Waiting for the second signature on the contract" />
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiBadge tone="success" size="sm" label="Paid" />
    <UiBadge tone="success" label="Paid" />
    <UiBadge variant="outline" tone="info" size="sm" label="Admin" />
    <UiBadge variant="outline" tone="info" label="Admin" />
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <UiBadge tone="info" :loading="badgeState === 'loading'" label="Syncing" />
        <UiBadge variant="inline" :loading="badgeState === 'loading'" label="Importing 3 of 12" />
        <UiBadge variant="outline" :loading="badgeState === 'loading'" label="Building" />
      </div>
      <UiRadioGroup v-model="badgeState" variant="segmented" aria-label="State of the badges">
        <UiRadio value="idle">Idle</UiRadio>
        <UiRadio value="loading">Loading</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Removable">
    <div class="flex flex-col items-center gap-4">
      <ul class="flex flex-wrap items-center gap-2" aria-label="Applied filters">
        <li v-for="f in filters" :key="f.label" class="flex">
          <UiBadge
            :variant="f.variant"
            :size="f.size"
            :tone="f.tone"
            :label="f.label"
            removable
            @remove="remove(f)"
          />
        </li>
      </ul>
      <UiButton v-if="filters.length < FILTERS.length" variant="outline" size="xs" @click="reset">
        Bring them back
      </UiButton>
    </div>
  </DemoBlock>
  <DemoBlock title="Icon" row>
    <UiBadge tone="info">
      <template #icon>
        <Check aria-hidden="true" />
      </template>
      Confirmed
    </UiBadge>
  </DemoBlock>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import { ref } from 'vue'
import type { BadgeVariant, Tone } from '../types/ui'

interface Filter {
  label: string
  tone?: Tone
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

// The host owns the list: it drops the badge on `remove` and moves the focus, as UiSelect does.
const FILTERS: Filter[] = [
  { label: 'Status: Active' },
  { label: 'Tag: Section A', tone: 'info' },
  { label: 'Guest', variant: 'outline' },
  { label: 'Lisbon', size: 'sm' },
]
const filters = ref([...FILTERS])
const remove = (f: Filter) => (filters.value = filters.value.filter((x) => x !== f))
const reset = () => (filters.value = [...FILTERS])
const badgeState = ref('loading')
</script>
