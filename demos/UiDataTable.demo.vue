<script lang="ts">
export const blurb =
  'Find and work with records in one place: search and filters above a table with selection and pages, and clear loading and error states.'
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import type { DataTableColumn, TableSort } from '../types/ui'
import { useToast } from '../composables/useToast'
import { useTableColumns } from '../composables/useTableColumns'

interface Invoice {
  id: string
  client: string
  issued: string
  amount: number
  status: 'paid' | 'due' | 'overdue'
  rating: number | null
}
const CLIENTS = [
  'Northwind Traders',
  'Blue Yonder Airlines',
  'Contoso',
  'Fabrikam',
  'Tailspin Toys',
]
const STATUS: Invoice['status'][] = ['paid', 'due', 'overdue']
const all = ref<Invoice[]>(
  Array.from({ length: 57 }, (_, i) => {
    const status = STATUS[i % 3]!
    return {
      id: `INV-${1100 - i}`,
      client: CLIENTS[i % CLIENTS.length]!,
      issued: new Date(2026, 8, 24 - (i % 40), 9 + (i % 8), 15).toISOString(),
      amount: 90 + ((i * 137) % 2100),
      status,
      rating: i % 4 === 0 ? null : 1 + ((i * 3) % 5),
    }
  }),
)
const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const
const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const
const columns: DataTableColumn<Invoice>[] = [
  { key: 'id', label: 'Invoice', type: 'copy', sortable: true },
  { key: 'client', label: 'Client', truncate: true, sortable: true },
  {
    key: 'issued',
    label: 'Issued',
    type: 'date',
    sortable: true,
    defaultSortDir: 'desc',
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'money',
    currency: 'EUR',
    align: 'end',
    sortable: true,
    defaultSortDir: 'desc',
    tone: (r) => (r.status === 'overdue' ? 'danger' : undefined),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    format: (v) => LABEL[v as Invoice['status']],
    tone: (r) => TONE[r.status],
  },
  { key: 'rating', label: 'Rating', type: 'progress', max: 5, step: 1 },
]
// The invoice number says what a row is, so it cannot be hidden.
// Rating is off until asked for; a new kind, so a choice stored before the column existed starts over.
const cols = useTableColumns('demo-invoices-list', columns, {
  required: ['id'],
  hiddenByDefault: ['rating'],
})
const statuses = STATUS.map((s) => ({ value: s, label: LABEL[s] }))

// The demo stands in for the engine: it filters, sorts and pages the fixture itself.
const search = ref('')
const status = ref<string[]>([])
const sort = ref<TableSort>({ key: 'issued', dir: 'desc' })
const page = ref(1)
const PAGE_SIZE = 10
// The states show the frame of the list, not its length: a page of a few rows, its skeleton too.
const STATE_ROWS = 4
const selection = ref(new Set<string | number>())
const last = ref('')
const listState = ref('loading')
const stateStatus = ref<string[]>([])
// A page from a link the list no longer has, 9 of 6: the block asks for the last once the rows
// are in; while they load the page stands, so a late answer is never clamped by a guess.
const farPage = ref(9)
const farLoading = ref(false)
let farTimer: ReturnType<typeof setTimeout> | undefined
function openFar() {
  clearTimeout(farTimer)
  farPage.value = 9
  farLoading.value = true
  farTimer = setTimeout(() => (farLoading.value = false), 1200)
}
onBeforeUnmount(() => clearTimeout(farTimer))

// A search waits in its results: the rows of the last answer stay, dimmed, until the new one
// comes; the field keeps the typing. A late answer for an older search is dropped.
const WAIT_SIZE = 5
const waitSearch = ref('')
const waitLoading = ref(false)
const waitFor = (q: string) =>
  all.value.filter((r) => !q || r.client.toLowerCase().includes(q.toLowerCase()))
const waitRows = ref(waitFor(''))
let waitTimer: ReturnType<typeof setTimeout> | undefined
watch(waitSearch, (q) => {
  clearTimeout(waitTimer)
  waitLoading.value = true
  waitTimer = setTimeout(() => {
    waitRows.value = waitFor(q)
    waitLoading.value = false
  }, 900)
})
onBeforeUnmount(() => clearTimeout(waitTimer))

const filtered = computed(() =>
  all.value.filter(
    (r) =>
      (!status.value.length || status.value.includes(r.status)) &&
      (!search.value || r.client.toLowerCase().includes(search.value.toLowerCase())),
  ),
)
const sorted = computed(() => {
  const s = sort.value
  if (!s) return filtered.value
  const dir = s.dir === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => {
    const av = a[s.key as keyof Invoice] ?? ''
    const bv = b[s.key as keyof Invoice] ?? ''
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir
  })
})
const pageRows = computed(() =>
  sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
const narrowed = computed(() => Boolean(search.value || status.value.length))
// A filter of the page's own asks for page one; the block does it for its search and sort.
watch(status, () => (page.value = 1))
// New invoice and edit share one drawer: the draft is a copy, Save puts it back.
const drawerOpen = ref(false)
const saving = ref(false)
const editing = ref<Invoice | null>(null)
const blank = () => ({
  client: '',
  amount: null as string | null,
  issued: '2026-09-29',
  status: 'due' as Invoice['status'],
})
const draft = ref(blank())
let start = JSON.stringify(draft.value)
const dirty = computed(() => JSON.stringify(draft.value) !== start)
// Save stays pressable: a value it refuses is named on its field as Save is pressed, and the
// drawer puts the focus on the first one.
const errors = ref({ client: '', amount: '' })
const toast = useToast()
function openRecord(row: Invoice | null) {
  editing.value = row
  draft.value = row
    ? {
        client: row.client,
        amount: String(row.amount),
        issued: row.issued.slice(0, 10),
        status: row.status,
      }
    : blank()
  start = JSON.stringify(draft.value)
  errors.value = { client: '', amount: '' }
  drawerOpen.value = true
}
function save() {
  errors.value = {
    client: draft.value.client.trim() ? '' : 'Enter a client',
    amount: Number(draft.value.amount) > 0 ? '' : 'Enter an amount above 0',
  }
  if (errors.value.client || errors.value.amount) return
  saving.value = true
  setTimeout(() => {
    const d = draft.value
    const fields = {
      client: d.client.trim(),
      amount: Number(d.amount),
      issued: new Date(`${d.issued}T09:00:00`).toISOString(),
      status: d.status,
      rating: null,
    }
    if (editing.value) {
      const id = editing.value.id
      all.value = all.value.map((r) => (r.id === id ? { ...r, ...fields } : r))
      last.value = `${id} saved`
    } else {
      const next = Math.max(...all.value.map((r) => Number(r.id.slice(4)))) + 1
      all.value = [{ id: `INV-${next}`, ...fields }, ...all.value]
      page.value = 1
      last.value = `INV-${next} created`
    }
    saving.value = false
    drawerOpen.value = false
    toast.success(last.value)
  }, 500)
}
// A delete answers with a toast and gives the rows back on Undo; the block moves the page if
// the list got shorter under it.
const deleteSelected = () => {
  const gone = all.value.filter((r) => selection.value.has(r.id))
  const before = all.value
  all.value = all.value.filter((r) => !selection.value.has(r.id))
  selection.value = new Set()
  toast.success(gone.length === 1 ? `${gone[0]!.id} deleted` : `${gone.length} invoices deleted`, {
    action: { label: 'Undo', onClick: () => (all.value = before) },
  })
}
</script>

<template>
  <DemoBlock title="List" wide>
    <UiDataTable
      v-model:search="search"
      v-model:sort="sort"
      v-model:page="page"
      v-model:selection="selection"
      class="w-full"
      search-placeholder="Search by client"
      :columns="cols"
      :items="pageRows"
      :total="sorted.length"
      :page-size="PAGE_SIZE"
      :filtered="narrowed"
      selectable
      :row-label="(row) => row.id"
      clickable
      @row-click="openRecord($event)"
      @reset-filters="status = []"
    >
      <template #filters="{ size }">
        <UiFilter v-model="status" label="Status" :items="statuses" :size="size" />
      </template>
      <template #actions>
        <UiButton @click="openRecord(null)"><Plus />New invoice</UiButton>
      </template>
      <template #bulk="{ size }">
        <UiButton variant="secondary" tone="danger" :size="size" @click="deleteSelected"
          ><Trash2 />Delete</UiButton
        >
      </template>
      <template #row-actions="{ row }">
        <UiIconButton variant="ghost" :icon="Pencil" ariaLabel="Edit" @click="openRecord(row)" />
      </template>
      <template #footer.amount>
        <UiMoneyCell :value="sorted.reduce((s, r) => s + r.amount, 0)" currency="EUR" />
      </template>
    </UiDataTable>
    <UiCrudDrawer
      v-model:open="drawerOpen"
      :title="editing ? editing.id : 'New invoice'"
      :description="editing ? editing.client : undefined"
      :submitting="saving"
      :persistent="dirty"
      @submit="save"
    >
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiField label="Client" :error="errors.client"
            ><UiInput v-model="draft.client"
          /></UiField>
          <UiField label="Amount" :error="errors.amount"
            ><UiInput v-model="draft.amount" numeric
          /></UiField>
          <UiField label="Issued"><UiDatePicker v-model="draft.issued" /></UiField>
          <UiField label="Status" group>
            <UiRadioGroup v-model="draft.status" variant="segmented">
              <UiRadio v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</UiRadio>
            </UiRadioGroup>
          </UiField>
        </div>
      </UiCard>
    </UiCrudDrawer>
  </DemoBlock>

  <DemoBlock title="States" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiDataTable
        class="w-full"
        :columns="cols"
        :items="
          listState === 'loaded' || listState === 'refreshing' ? all.slice(0, STATE_ROWS) : []
        "
        :total="listState === 'loaded' || listState === 'refreshing' ? STATE_ROWS : 0"
        :page-size="STATE_ROWS"
        :loading="listState === 'loading' || listState === 'refreshing'"
        :error="
          listState === 'failed'
            ? 'The server did not answer. Check the connection and try again.'
            : null
        "
        search-placeholder="Search by client"
        :search="listState === 'nothing' ? 'zzz' : ''"
        @retry="listState = 'loaded'"
      >
        <template #filters="{ size }">
          <UiFilter v-model="stateStatus" label="Status" :items="statuses" :size="size" />
        </template>
        <template #actions>
          <UiButton><Plus />New invoice</UiButton>
        </template>
        <!-- The app's own step stands beside the table's ways back, and alone with no records yet. -->
        <template #empty-actions="{ size }">
          <UiButton :size="size"><Plus />New invoice</UiButton>
        </template>
      </UiDataTable>
      <UiRadioGroup v-model="listState" variant="segmented" aria-label="State of the list">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Refreshing</UiRadio>
        <UiRadio value="empty">Nothing yet</UiRadio>
        <UiRadio value="nothing">No results</UiRadio>
        <UiRadio value="failed">Failed</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="Searching" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiDataTable
        v-model:search="waitSearch"
        class="w-full"
        search-placeholder="Search by client"
        :columns="columns"
        :items="waitRows.slice(0, WAIT_SIZE)"
        :total="waitRows.length"
        :page-size="WAIT_SIZE"
        :loading="waitLoading"
      />
      <p class="text-sm text-fg-muted">
        Each search asks a server, which answers in 0.9 s; the List tab filters in the browser.
      </p>
    </div>
  </DemoBlock>

  <DemoBlock title="Far page" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiDataTable
        v-model:page="farPage"
        class="w-full"
        search=""
        search-placeholder="Search by client"
        :columns="columns"
        :items="farLoading ? [] : all.slice((farPage - 1) * PAGE_SIZE, farPage * PAGE_SIZE)"
        :total="all.length"
        :page-size="PAGE_SIZE"
        :loading="farLoading"
      />
      <p class="text-sm text-fg-muted" role="status">
        {{ farLoading ? 'Page 9 asked for, loading…' : `Page 9 asked for, now on page ${farPage}` }}
      </p>
      <UiButton variant="outline" @click="openFar">Open page 9 again</UiButton>
    </div>
  </DemoBlock>
</template>
