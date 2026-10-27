<script lang="ts">
export const blurb =
  'Offer a compact action, such as Search or Close, with an icon and an accessible name for screen readers.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Bell,
  ChevronDown,
  Columns3,
  Copy,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from '@lucide/vue'

const INVOICES = [
  { id: 'INV-0042', client: 'Acme Corp' },
  { id: 'INV-0043', client: 'Birch & Co' },
  { id: 'INV-0044', client: 'Cedar Ltd' },
]
const REPORTS = ['Revenue by month', 'Unpaid invoices', 'Clients by region', 'Refunds']
const starred = ref(new Set(['Unpaid invoices']))
function star(name: string) {
  const next = new Set(starred.value)
  if (!next.delete(name)) next.add(name)
  starred.value = next
}
const iconState = ref('loading')
const query = ref('invoices')
</script>

<template>
  <DemoBlock title="Base">
    <UiStack gap="tight" class="w-full max-w-md">
      <div class="flex items-center justify-end gap-2">
        <UiIconButton :icon="SlidersHorizontal" ariaLabel="Filters" />
        <UiIconButton :icon="Columns3" ariaLabel="Columns" />
        <UiButton><Plus aria-hidden="true" />New invoice</UiButton>
      </div>
      <UiCard :padded="false">
        <UiList>
          <UiListItem
            v-for="row in INVOICES"
            :key="row.id"
            :title="row.id"
            :description="row.client"
          >
            <template #actions>
              <UiIconButton :icon="Pencil" variant="ghost" :ariaLabel="`Edit ${row.id}`" />
              <UiIconButton :icon="Copy" variant="ghost" :ariaLabel="`Duplicate ${row.id}`" />
              <UiIconButton
                :icon="Trash2"
                variant="ghost"
                tone="danger"
                :ariaLabel="`Delete ${row.id}`"
              />
            </template>
          </UiListItem>
        </UiList>
      </UiCard>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Variants">
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <UiIconButton :icon="Plus" ariaLabel="Add" />
        <UiIconButton :icon="Plus" tone="brand" ariaLabel="Add" />
        <UiIconButton :icon="Trash2" tone="danger" ariaLabel="Delete" />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UiIconButton :icon="Plus" variant="ghost" ariaLabel="Add" />
        <UiIconButton :icon="Plus" variant="ghost" tone="brand" ariaLabel="Add" />
        <UiIconButton :icon="Trash2" variant="ghost" tone="danger" ariaLabel="Delete" />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UiButtonGroup ariaLabel="Save">
          <UiButton>Save</UiButton>
          <UiIconButton :icon="ChevronDown" variant="primary" ariaLabel="More ways to save" />
        </UiButtonGroup>
        <UiIconButton :icon="Trash2" variant="primary" tone="danger" ariaLabel="Delete" />
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiIconButton :icon="Pencil" size="xs" ariaLabel="Edit" />
    <UiIconButton :icon="Pencil" ariaLabel="Edit" />
    <UiIconButton :icon="Pencil" size="md" ariaLabel="Edit" />
  </DemoBlock>
  <DemoBlock title="Toggle">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem v-for="name in REPORTS" :key="name" :title="name">
          <template #actions>
            <UiIconButton
              :icon="Star"
              variant="ghost"
              :pressed="starred.has(name)"
              :ariaLabel="`Star ${name}`"
              @click="star(name)"
            />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Tooltip" row>
    <UiTooltip content="Settings">
      <UiIconButton :icon="Settings" variant="ghost" ariaLabel="Settings" />
    </UiTooltip>
  </DemoBlock>
  <DemoBlock title="In a field">
    <UiInput v-model="query" ariaLabel="Search" class="w-72">
      <template #end>
        <UiIconButton
          v-if="query"
          :icon="X"
          variant="ghost"
          size="xs"
          ariaLabel="Clear the search"
          @click="query = ''"
        />
      </template>
    </UiInput>
  </DemoBlock>
  <DemoBlock title="Trailing" row>
    <UiIconButton :icon="Bell" ariaLabel="Notifications, 12 new">
      <template #trailing>12</template>
    </UiIconButton>
    <UiIconButton :icon="Bell" variant="ghost" ariaLabel="Notifications, 128 new">
      <template #trailing>128</template>
    </UiIconButton>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <UiIconButton
          :icon="Trash2"
          tone="danger"
          :loading="iconState === 'loading'"
          ariaLabel="Delete"
        />
        <UiIconButton
          :icon="Pencil"
          variant="ghost"
          :loading="iconState === 'loading'"
          ariaLabel="Edit"
        />
        <UiIconButton
          :icon="Pencil"
          size="md"
          :loading="iconState === 'loading'"
          ariaLabel="Edit"
        />
        <UiIconButton
          :icon="Bell"
          :loading="iconState === 'loading'"
          ariaLabel="Notifications, 128 new"
        >
          <template #trailing>128</template>
        </UiIconButton>
      </div>
      <UiRadioGroup v-model="iconState" variant="segmented" aria-label="State of the buttons">
        <UiRadio value="idle">Idle</UiRadio>
        <UiRadio value="loading">Loading</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Disabled" row>
    <UiIconButton :icon="Pencil" disabled ariaLabel="Edit" />
    <UiIconButton :icon="Trash2" variant="ghost" tone="danger" disabled ariaLabel="Delete" />
    <UiIconButton
      :icon="Trash2"
      variant="ghost"
      tone="danger"
      disabled
      disabled-reason="Paid invoices cannot be deleted"
      ariaLabel="Delete"
    />
  </DemoBlock>
</template>
