<script lang="ts">
export const blurb = 'Keep search, filters and actions together above the table they affect.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Settings2, Trash2, X } from '@lucide/vue'
import { useTableColumns } from '../composables/useTableColumns'
import type { DateRangeValue, TableColumn } from '../types/ui'

interface Invoice {
  id: number
  number: string
  client: string
  status: 'paid' | 'due' | 'overdue'
  issued: string
}
const ROWS: Invoice[] = [
  { id: 1, number: 'INV-1041', client: 'Northwind Traders', status: 'paid', issued: '2026-07-14' },
  {
    id: 2,
    number: 'INV-1042',
    client: 'Blue Yonder Airlines',
    status: 'due',
    issued: '2026-08-03',
  },
  { id: 3, number: 'INV-1043', client: 'Contoso', status: 'overdue', issued: '2026-08-21' },
  { id: 4, number: 'INV-1044', client: 'Fabrikam', status: 'paid', issued: '2026-09-02' },
  { id: 5, number: 'INV-1045', client: 'Tailspin Toys', status: 'due', issued: '2026-09-18' },
]
const columns: TableColumn<Invoice>[] = [
  { key: 'number', label: 'Invoice', width: '120px' },
  { key: 'client', label: 'Client', truncate: true },
  { key: 'issued', label: 'Issued', width: '130px' },
  { key: 'status', label: 'Status', width: '110px' },
]
const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const
const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const
const statuses = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
]

// Each tab keeps its own search: typing in one does not change the others.
const query = ref('')
const statusQuery = ref('')
const columnsQuery = ref('')
const statusFilter = ref<string[]>([])
const period = ref<DateRangeValue>({ from: null, to: null, preset: 'all' })
const byClient = (q: string) => (r: Invoice) =>
  !q || r.client.toLowerCase().includes(q.toLowerCase())
const rows = computed(() =>
  ROWS.filter(
    (r) =>
      (!period.value.from || r.issued >= period.value.from) &&
      (!period.value.to || r.issued <= period.value.to) &&
      byClient(query.value)(r),
  ),
)
const statusRows = computed(() =>
  ROWS.filter(
    (r) =>
      (!statusFilter.value.length || statusFilter.value.includes(r.status)) &&
      byClient(statusQuery.value)(r),
  ),
)
const columnsRows = computed(() => ROWS.filter(byClient(columnsQuery.value)))
const sized = { xs: ref(''), sm: ref(''), md: ref('') }
// A value set from outside (a saved view, a reset) replaces what was being typed.
const outsideQuery = ref('')
const outsideRows = computed(() => ROWS.filter(byClient(outsideQuery.value)))
// Rows selected: the strip covers the toolbar and the toolbar is inert under it.
const stripQuery = ref('')
const stripStatus = ref<string[]>([])
const selected = ref(new Set<string | number>())
const stripRows = computed(() =>
  ROWS.filter(
    (r) =>
      (!stripStatus.value.length || stripStatus.value.includes(r.status)) &&
      byClient(stripQuery.value)(r),
  ),
)
const cols = useTableColumns('demo-toolbar-invoices', columns, { required: ['number'] })
</script>

<template>
  <DemoBlock title="Above a table" wide>
    <UiCard :padded="false" class="w-full">
      <UiTableToolbar
        v-model:search="query"
        search-placeholder="Search by client"
        class="border-b border-border"
      >
        <template #start="{ size }">
          <UiDateRange v-model="period" ariaLabel="Issued" :size="size" />
        </template>
        <template #end="{ size }">
          <UiIconButton :icon="Settings2" ariaLabel="Categories" :size="size" />
          <UiButton :size="size"><Plus />New invoice</UiButton>
        </template>
      </UiTableToolbar>
      <UiTable
        :columns="columns"
        :items="rows"
        :filtered="Boolean(query || period.from || period.to)"
      >
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Status" wide>
    <UiCard :padded="false" class="w-full">
      <UiTableToolbar
        v-model:search="statusQuery"
        search-placeholder="Search by client"
        class="border-b border-border"
      >
        <template #start="{ size }">
          <UiFilter v-model="statusFilter" label="Status" :items="statuses" :size="size" />
        </template>
        <template #end="{ size }">
          <UiButton :size="size"><Plus />New invoice</UiButton>
        </template>
      </UiTableToolbar>
      <UiTable
        :columns="columns"
        :items="statusRows"
        :filtered="Boolean(statusQuery || statusFilter.length)"
      >
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Columns" wide>
    <UiCard :padded="false" class="w-full">
      <UiTableToolbar
        v-model:search="columnsQuery"
        :columns="cols"
        search-placeholder="Search by client"
        class="border-b border-border"
      >
        <template #end="{ size }">
          <UiButton :size="size"><Plus />New invoice</UiButton>
        </template>
      </UiTableToolbar>
      <UiTable :columns="cols.visible.value" :items="columnsRows" :filtered="Boolean(columnsQuery)">
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Set from outside" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiCard :padded="false" class="w-full">
        <UiTableToolbar
          v-model:search="outsideQuery"
          search-placeholder="Search by client"
          class="border-b border-border"
        >
          <template #end="{ size }">
            <UiButton :size="size"><Plus />New invoice</UiButton>
          </template>
        </UiTableToolbar>
        <UiTable :columns="columns" :items="outsideRows" :filtered="Boolean(outsideQuery)">
          <template #cell.number="{ value }">
            <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
          </template>
          <template #cell.issued="{ value }">
            <UiDateCell :value="String(value)" />
          </template>
          <template #cell.status="{ value }">
            <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
              {{ LABEL[value as Invoice['status']] }}
            </UiBadge>
          </template>
        </UiTable>
      </UiCard>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <UiButton variant="outline" @click="outsideQuery = 'Contoso'">Show Contoso</UiButton>
        <UiButton variant="ghost" :disabled="!outsideQuery" @click="outsideQuery = ''">
          Reset
        </UiButton>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="Under a selection strip" wide>
    <UiCard :padded="false" class="w-full">
      <div class="relative border-b border-border">
        <UiTableToolbar
          v-model:search="stripQuery"
          :inert="selected.size > 0"
          search-placeholder="Search by client"
        >
          <template #start="{ size }">
            <UiFilter v-model="stripStatus" label="Status" :items="statuses" :size="size" />
          </template>
          <template #end="{ size }">
            <UiButton :size="size"><Plus />New invoice</UiButton>
          </template>
        </UiTableToolbar>
        <UiListItem v-if="selected.size" class="absolute inset-0 bg-selected text-selected-fg">
          <template #media>
            <UiIconButton
              variant="ghost"
              :icon="X"
              ariaLabel="Clear selection"
              @click="selected = new Set()"
            />
          </template>
          <span class="text-sm font-medium">{{ selected.size }} selected</span>
          <template #actions>
            <UiButton variant="secondary" tone="danger"><Trash2 />Delete</UiButton>
          </template>
        </UiListItem>
      </div>
      <UiTable
        v-model:selection="selected"
        :columns="columns"
        :items="stripRows"
        selectable
        :row-label="(row) => row.number"
        :filtered="Boolean(stripQuery || stripStatus.length)"
      >
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Sizes" wide>
    <div class="flex w-full flex-col gap-4">
      <UiCard v-for="step in ['xs', 'sm', 'md'] as const" :key="step" :padded="false">
        <UiTableToolbar
          v-model:search="sized[step].value"
          :size="step"
          search-placeholder="Search by client"
        >
          <template #start="{ size }">
            <UiFilter v-model="statusFilter" label="Status" :items="statuses" :size="size" />
          </template>
          <template #end="{ size }">
            <UiButton :size="size"><Plus />New invoice</UiButton>
          </template>
        </UiTableToolbar>
      </UiCard>
    </div>
  </DemoBlock>
</template>
