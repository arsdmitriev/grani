<script lang="ts">
export const blurb =
  'Choose which columns to show and keep that choice for later visits in the same browser.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import { useTableColumns } from '../composables/useTableColumns'
import type { TableColumn } from '../types/ui'

interface Invoice {
  id: string
  client: string
  issued: string
  amount: number
  note: string
}
const ROWS: Invoice[] = [
  {
    id: 'INV-1041',
    client: 'Northwind Traders',
    issued: '2026-09-21',
    amount: 1280,
    note: 'Paid by card',
  },
  { id: 'INV-1042', client: 'Blue Yonder Airlines', issued: '2026-09-22', amount: 460.5, note: '' },
  {
    id: 'INV-1043',
    client: 'Contoso',
    issued: '2026-09-22',
    amount: 2150,
    note: 'Second reminder sent',
  },
  { id: 'INV-1044', client: 'Fabrikam', issued: '2026-09-23', amount: 90, note: '' },
]
const columns: TableColumn<Invoice>[] = [
  { key: 'id', label: 'Invoice', width: '110px' },
  { key: 'client', label: 'Client', truncate: true },
  { key: 'issued', label: 'Issued', width: '120px' },
  { key: 'amount', label: 'Amount', align: 'end', width: '110px' },
  { key: 'note', label: 'Note', truncate: true },
]
// The invoice number says what a row is, so it cannot be hidden; the note is off until asked for.
const query = ref('')
const cols = useTableColumns('demo-invoices', columns, {
  required: ['id'],
  hiddenByDefault: ['note'],
})
// With no required column, however many are hidden, the last one shown stays.
const loose = useTableColumns('demo-invoices-loose', columns)
const looseQuery = ref('')
</script>

<template>
  <DemoBlock title="In a toolbar" wide>
    <UiCard :padded="false" class="w-full">
      <UiTableToolbar v-model:search="query" :columns="cols" class="border-b border-border">
        <template #end>
          <UiButton><Plus />New invoice</UiButton>
        </template>
      </UiTableToolbar>
      <UiTable :columns="cols.visible.value" :items="ROWS" />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="No column required" wide>
    <UiCard :padded="false" class="w-full">
      <UiTableToolbar v-model:search="looseQuery" :columns="loose" class="border-b border-border" />
      <UiTable :columns="loose.visible.value" :items="ROWS" />
    </UiCard>
  </DemoBlock>
</template>
