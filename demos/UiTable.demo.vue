<script lang="ts">
export const blurb =
  'Compare records in columns, sort and select rows and act on a row, with clear states for loading, empty results and errors.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Ellipsis, Inbox, Pencil, Plus } from '@lucide/vue'
import type { TableColumn, TableSort } from '../types/ui'
import { useToast } from '../composables/useToast'

interface Invoice {
  id: number
  number: string
  client: string
  issued: string
  amount: number
  status: 'paid' | 'due' | 'overdue'
}

const ROWS: Invoice[] = [
  {
    id: 1,
    number: 'INV-1041',
    client: 'Northwind Traders',
    issued: '2026-09-21',
    amount: 1280,
    status: 'paid',
  },
  {
    id: 2,
    number: 'INV-1042',
    client: 'Blue Yonder Airlines',
    issued: '2026-09-22',
    amount: 460.5,
    status: 'due',
  },
  {
    id: 3,
    number: 'INV-1043',
    client: 'Contoso Pharmaceuticals and Laboratories',
    issued: '2026-09-22',
    amount: 2150,
    status: 'overdue',
  },
  {
    id: 4,
    number: 'INV-1044',
    client: 'Fabrikam',
    issued: '2026-09-23',
    amount: 90,
    status: 'paid',
  },
  {
    id: 5,
    number: 'INV-1045',
    client: 'Tailspin Toys',
    issued: '2026-09-24',
    amount: 730.25,
    status: 'due',
  },
]
const columns: TableColumn<Invoice>[] = [
  { key: 'number', label: 'Invoice', sortable: true },
  { key: 'client', label: 'Client', sortable: true, truncate: true },
  { key: 'issued', label: 'Issued', width: '130px', sortable: true, defaultSortDir: 'desc' },
  {
    key: 'amount',
    label: 'Amount',
    width: '130px',
    align: 'end',
    sortable: true,
    defaultSortDir: 'desc',
  },
  { key: 'status', label: 'Status' },
]
// The actions block drops a column, so the sticky actions fit the showcase stage.
const short = columns.filter((c) => c.key !== 'issued')
const moneyColumns: TableColumn<Invoice>[] = [
  { key: 'client', label: 'Client', truncate: true },
  {
    key: 'unit',
    label: 'Unit price',
    align: 'end',
    width: '130px',
    accessor: (r) => r.amount / 10,
  },
  { key: 'amount', label: 'Amount', align: 'end', width: '130px' },
]
const dateColumns: TableColumn<Invoice>[] = [
  { key: 'number', label: 'Invoice', width: '110px' },
  { key: 'time', label: 'Within a day', accessor: (r) => r.issued },
  { key: 'day', label: 'Across months', accessor: (r) => r.issued },
  { key: 'weekday', label: 'Weekday', accessor: (r) => r.issued },
]
const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const
const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

// The demo sorts in place of a server: strings and numbers by the column value.
const sort = ref<TableSort>({ key: 'issued', dir: 'desc' })
const sorted = computed(() => {
  const s = sort.value
  if (!s) return ROWS
  const dir = s.dir === 'asc' ? 1 : -1
  return [...ROWS].sort((a, b) => {
    const av = a[s.key as keyof Invoice]
    const bv = b[s.key as keyof Invoice]
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir
  })
})

const selection = ref(new Set<string | number>())
const unpaid = (row: Invoice) => row.status !== 'paid'

// What a row's action does is out of the demo's reach: a toast names it.
const toast = useToast()
const tableState = ref('loading')

const total = computed(() => ROWS.reduce((sum, r) => sum + r.amount, 0))

const wide: TableColumn<Invoice>[] = [
  ...columns,
  { key: 'due', label: 'Due date', width: '130px', accessor: (r) => r.issued },
  {
    key: 'address',
    label: 'Billing address',
    width: '260px',
    truncate: true,
    accessor: (r) => r.client,
  },
  { key: 'po', label: 'Purchase order', width: '160px', accessor: (r) => r.number },
  { key: 'tax', label: 'Tax', width: '130px', align: 'end', accessor: (r) => r.amount * 0.2 },
]
</script>

<template>
  <DemoBlock title="Base" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable :columns="columns" :items="ROWS" aria-label="Invoices">
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Sortable" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable v-model:sort="sort" :columns="columns" :items="sorted">
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Selectable" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable
        v-model:selection="selection"
        :columns="columns"
        :items="ROWS"
        selectable
        :is-row-selectable="unpaid"
        :row-label="(row) => row.number"
        aria-label="Invoices"
      >
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Row actions" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable
        :columns="short"
        :items="ROWS"
        clickable
        @row-click="toast.info(`Opened ${$event.number}`)"
      >
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
        <template #row-actions="{ row }">
          <UiIconButton
            variant="ghost"
            :icon="Pencil"
            :ariaLabel="`Edit ${row.number}`"
            @click="toast.info(`Edit ${row.number}`)"
          />
          <UiMenu>
            <template #trigger>
              <UiIconButton
                variant="ghost"
                :icon="Ellipsis"
                :ariaLabel="`More for ${row.number}`"
              />
            </template>
            <UiListItem
              as="button"
              title="Duplicate"
              @click="toast.info(`Duplicate ${row.number}`)"
            />
            <UiListItem
              as="button"
              title="Send a reminder"
              @click="toast.info(`Remind ${row.number}`)"
            />
            <UiSeparator />
            <UiListItem
              as="button"
              title="Delete"
              tone="danger"
              @click="toast.info(`Delete ${row.number}`)"
            />
          </UiMenu>
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Totals" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable :columns="columns" :items="ROWS">
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
        <template #footer.number>Total</template>
        <template #footer.amount>
          <UiMoneyCell :value="total" currency="EUR" />
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="States" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiCard :padded="false" class="w-full">
        <UiTable
          :columns="columns"
          :items="['loaded', 'refreshing', 'refreshFailed'].includes(tableState) ? ROWS : []"
          :loading="tableState === 'loading' || tableState === 'refreshing'"
          :filtered="tableState === 'nothing'"
          :error="
            tableState === 'failed' || tableState === 'refreshFailed'
              ? 'The server did not answer. Check the connection and try again.'
              : null
          "
          @retry="tableState = 'loaded'"
        >
          <template #cell.number="{ value }">
            <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
          </template>
          <template #cell.issued="{ value }">
            <UiDateCell :value="String(value)" />
          </template>
          <template #cell.amount="{ value }">
            <UiMoneyCell :value="Number(value)" currency="EUR" />
          </template>
          <template #cell.status="{ value }">
            <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
              {{ LABEL[value as Invoice['status']] }}
            </UiBadge>
          </template>
          <!-- With no records yet the next step is the app's own: creating the first one. -->
          <template v-if="tableState === 'empty'" #empty>
            <UiNoData title="No invoices yet" description="Create the first one and it shows here.">
              <template #media><Inbox /></template>
              <template #actions>
                <UiButton><Plus />New invoice</UiButton>
              </template>
            </UiNoData>
          </template>
        </UiTable>
      </UiCard>
      <UiRadioGroup v-model="tableState" variant="segmented" aria-label="State of the table">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Refreshing</UiRadio>
        <UiRadio value="empty">Empty</UiRadio>
        <UiRadio value="nothing">No results</UiRadio>
        <UiRadio value="failed">Failed</UiRadio>
        <UiRadio value="refreshFailed">Refresh failed</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="Wide" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable :columns="wide" :items="ROWS">
        <template #cell.amount="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.status="{ value }">
          <UiBadge :tone="TONE[value as Invoice['status']]" size="sm">
            {{ LABEL[value as Invoice['status']] }}
          </UiBadge>
        </template>
        <template #cell.tax="{ value }">
          <UiMoneyCell :value="Number(value)" currency="EUR" />
        </template>
        <template #cell.issued="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.due="{ value }">
          <UiDateCell :value="String(value)" />
        </template>
        <template #cell.po="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #row-actions>
          <UiIconButton variant="ghost" :icon="Pencil" ariaLabel="Edit" />
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Money" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable :columns="moneyColumns" :items="ROWS">
        <template #cell.amount="{ row }">
          <UiMoneyCell
            :value="row.amount"
            currency="EUR"
            :tone="
              row.status === 'overdue' ? 'danger' : row.status === 'paid' ? 'success' : undefined
            "
          />
        </template>
        <template #cell.unit="{ row }">
          <UiMoneyCell :value="row.amount / 10" currency="EUR" unit="pc" />
        </template>
        <template #footer.client>Total</template>
        <template #footer.amount>
          <UiMoneyCell :value="ROWS.reduce((s, r) => s + r.amount, 0)" currency="EUR" />
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Date" wide>
    <UiCard :padded="false" class="w-full">
      <UiTable :columns="dateColumns" :items="ROWS">
        <template #cell.number="{ value }">
          <UiCopyButton size="xs" flush :value="String(value)" :label="String(value)" />
        </template>
        <template #cell.time="{ row }">
          <UiDateCell :value="`${row.issued}T09:15:00`" variant="time" />
        </template>
        <template #cell.day="{ row }">
          <UiDateCell :value="`${row.issued}T09:15:00`" />
        </template>
        <template #cell.weekday="{ row }">
          <UiDateCell :value="`${row.issued}T09:15:00`" context="weekday" />
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>
</template>
