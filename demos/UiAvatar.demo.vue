<script lang="ts">
export const blurb =
  'Recognize a person by their photo, with initials shown while the photo loads or if it is unavailable.'
</script>

<script setup lang="ts">
import type { TableColumn } from '../types/ui'

// A photo that loads offline, and an address that answers nothing.
const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c7d2fe"/><circle cx="32" cy="26" r="12" fill="#6366f1"/><path d="M10 64c2-14 11-20 22-20s20 6 22 20z" fill="#6366f1"/></svg>',
)}`
const people = [
  { name: 'Anna Petrova', email: 'anna@example.com' },
  { name: 'Ivan Sidorov', email: 'ivan@example.com' },
]
const invoices = [
  { id: 'INV-0042', owner: 'Anna Petrova' },
  { id: 'INV-0041', owner: 'Ivan Sidorov' },
]
const columns: TableColumn<(typeof invoices)[number]>[] = [
  { key: 'owner', label: 'Owner' },
  { key: 'id', label: 'Invoice' },
]
</script>

<template>
  <DemoBlock title="Base" row>
    <UiAvatar name="Anna Petrova" alt="Anna Petrova" />
    <UiAvatar name="Ivan Sidorov" tone="success" alt="Ivan Sidorov" />
    <UiAvatar name="Maria Kova" tone="warning" alt="Maria Kova" />
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiAvatar name="Anna Petrova" size="xs" alt="Anna Petrova" />
    <UiAvatar name="Anna Petrova" alt="Anna Petrova" />
    <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova" />
  </DemoBlock>
  <DemoBlock title="Photo" row>
    <UiAvatar name="Anna Petrova" :src="photo" alt="Anna Petrova" />
    <UiAvatar name="Ivan Sidorov" src="/no-such-photo.jpg" alt="Ivan Sidorov" />
  </DemoBlock>
  <DemoBlock title="With a mark" row>
    <UiIndicator dot tone="success" placement="bottom-end" size="sm" round>
      <UiAvatar name="Anna Petrova" alt="Anna Petrova, online" />
    </UiIndicator>
    <UiIndicator :count="3" size="md" round>
      <UiAvatar name="Ivan Sidorov" size="md" alt="Ivan Sidorov, 3 unread" />
    </UiIndicator>
  </DemoBlock>
  <DemoBlock title="No name">
    <UiAvatar name="" alt="Unknown sender" />
  </DemoBlock>
  <DemoBlock title="In a row">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem v-for="p in people" :key="p.email" :title="p.name" :description="p.email">
          <template #media><UiAvatar :name="p.name" size="md" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="In a table">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiTable :columns="columns" :items="invoices" row-key="id" aria-label="Invoices">
        <template #cell.owner="{ value }">
          <span class="flex items-center gap-2">
            <UiAvatar :name="String(value)" size="xs" />
            <span class="truncate">{{ value }}</span>
          </span>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>
</template>
