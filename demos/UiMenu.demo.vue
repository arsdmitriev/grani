<script lang="ts">
export const blurb =
  'Open a menu of available actions, such as exporting records, changing a row or managing your account.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ChevronDown,
  Copy,
  Ellipsis,
  FileJson,
  FileSpreadsheet,
  FileText,
  Folder,
  Pencil,
  Trash2,
} from '@lucide/vue'
import { useConfirm } from '../composables/useConfirm'

// Delete cannot come back: it asks first, as every destructive command in a menu does.
const { confirm } = useConfirm()
const remove = () =>
  confirm({
    title: 'Delete the invoice?',
    message: 'The invoice and its payments are removed. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
  })
// Past five the panel takes a measured height and scrolls; half of the sixth row says there is more.
const FOLDERS = [
  'Inbox',
  'Drafts',
  'Sent',
  'Archive',
  'Invoices 2024',
  'Invoices 2025',
  'Invoices 2026',
  'Trash',
]
const windowOpen = ref(false)
const INVOICE = [
  { key: 'Total', value: '€1,240.00' },
  { key: 'Issued', value: 'Sep 3, 2026' },
  { key: 'Due', value: 'Sep 30, 2026' },
]
</script>

<template>
  <DemoBlock title="Base" row>
    <UiMenu align="start">
      <template #trigger>
        <UiButton variant="outline">Export<ChevronDown /></UiButton>
      </template>
      <UiListItem as="button" title="CSV">
        <template #media><FileSpreadsheet /></template>
      </UiListItem>
      <UiListItem as="button" title="JSON">
        <template #media><FileJson /></template>
      </UiListItem>
    </UiMenu>
  </DemoBlock>
  <DemoBlock title="Row" row>
    <UiMenu>
      <template #trigger>
        <UiIconButton :icon="Ellipsis" ariaLabel="Actions" variant="ghost" />
      </template>
      <UiListItem as="button" title="Edit">
        <template #media><Pencil /></template>
      </UiListItem>
      <UiListItem as="button" title="Duplicate">
        <template #media><Copy /></template>
      </UiListItem>
      <UiSeparator />
      <UiListItem as="button" title="Delete" tone="danger" @click="remove">
        <template #media><Trash2 /></template>
      </UiListItem>
    </UiMenu>
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiMenu align="start">
      <template #trigger>
        <UiButton variant="outline">Sync<ChevronDown /></UiButton>
      </template>
      <UiListItem as="button" title="Sync now" loading />
      <UiListItem as="button" title="Sync the archive" description="Only for the owner" disabled />
    </UiMenu>
  </DemoBlock>
  <DemoBlock title="Long" row>
    <UiMenu align="start">
      <template #trigger>
        <UiButton variant="outline">Move to<ChevronDown /></UiButton>
      </template>
      <UiListItem v-for="folder in FOLDERS" :key="folder" as="button" :title="folder">
        <template #media><Folder /></template>
      </UiListItem>
    </UiMenu>
  </DemoBlock>
  <DemoBlock title="Window" row>
    <UiButton variant="outline" @click="windowOpen = true">Open the invoice</UiButton>
    <UiModal v-model:open="windowOpen" title="INV-1042" description="Blue Yonder Airlines">
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <template v-for="row in INVOICE" :key="row.key">
          <dt class="text-fg-muted">{{ row.key }}</dt>
          <dd class="tabular-nums">{{ row.value }}</dd>
        </template>
      </dl>
      <template #footer>
        <UiMenu align="start">
          <template #trigger>
            <UiButton variant="outline" class="me-auto">Export<ChevronDown /></UiButton>
          </template>
          <UiListItem as="button" title="PDF">
            <template #media><FileText /></template>
          </UiListItem>
          <UiListItem as="button" title="CSV">
            <template #media><FileSpreadsheet /></template>
          </UiListItem>
        </UiMenu>
        <UiButton @click="windowOpen = false">Close</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
</template>
