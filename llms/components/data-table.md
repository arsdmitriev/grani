# Data table (`UiDataTable`)

> Find and work with records in one place: search and filters above a table with selection and pages, and clear loading and error states.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/data-table

Also called data grid, list page, crud table, admin table.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import type { DataTableColumn, TableSort } from 'grani-ui'
import { UiDataTable, UiFilter, UiButton, UiIconButton, UiMoneyCell, UiCrudDrawer, UiCard, UiField, UiInput, UiDatePicker, UiRadioGroup, UiRadio, UiToaster, useToast, useTableColumns } from 'grani-ui'

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

const selection = ref(new Set<string | number>())

const last = ref('')

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
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Start a new search on the first page.
- Give every empty list a way forward.
- Land on a page with records after a delete.
- Show missing data as a gap.
- Act on several selected rows at once.
- Keep nearby content in place while loading.
- Search while the table stays in place.
- Compare numbers in aligned columns.
- Search once typing pauses.
- Reload or share a list as you see it.
- Select or clear a range of rows.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Load the page the table asks for, with the search and the sort it comes with.
- A UiFilter in `#filters` counts by itself, and Reset filters resets it. Pass `filtered` while another filter of yours is on, and clear it when `reset-filters` arrives. Give the step only your app knows in `#empty-actions`, such as New invoice, or creating the client that was searched for; without it, no records yet is the words alone.
- Keep `total` up to date, and load the page the table asks for through `v-model:page`.
- Pass `null` where there is no value, and `0` only for a real zero.
- Put the actions in `#bulk` and apply them to the selection the slot gives you.
- Leave `total` unset until the first answer.
- Set `loading` while the request runs. For a filter of your own, also empty `items` in the same step that sets `loading`, until its answer comes: the placeholder rows then take their place, as many as were in view.
- Set `loading` while the answer is on its way, and `total` when it comes.
- Call `useListAddress` once in the page, with your filters and their empty values (`[]` for several, `null` for one), bind the view, and load the rows for it. A filter of ids is named in `numbers`. The sort the list opens on goes in the `sort` option, since assigning it to the view afterwards would overwrite the address. `sortKeys` names the columns the address may sort by; without it, check the key before it reaches your request.

## Why it works this way

A whole list screen in one card: the toolbar, the table, the selection strip, and a footer with the count and the pages. Take it for a list page that searches, sorts, selects and pages.

**State.** It draws what it is given and owns no state. The page, the sort, the selection and the search are `v-model`s; the rows and the total come from outside. It knows no router, API or storage: a page or an engine wires those. The selection stays as the page, the search and the filters change: the strip counts rows out of view, and `#bulk` gets their keys too. A page that wants only what is in view clears the selection on those changes.

**Columns.** A column's `type` says how its values are drawn: money, date, status, copy or progress, text by default. A `#cell.<key>` slot draws a domain cell and wins over the type. A money column stands at the end, digit under digit, unless it says `align: 'start'`. `columns` is the list, fixed; or the state from `useTableColumns` over it, as UiTableToolbar's `columns` is, and then the table draws the visible ones and the toolbar gets the columns button.

**Hidden sort.** The sort is the list's order, as a link made it; the columns are the person's view. A sort on a column they hid stays, and a line above the table tells it ("Sorted by Amount, descending"), since no header can.

**Slots.** `#filters` narrows the list, `#actions` acts on it, `#bulk` acts on the selection, and `#row-actions` acts on one row.

**Empty.** No empty list is a dead end. A search or a filter that found nothing offers its way back, Clear search and Reset filters; `#empty-actions` adds the app's own step beside them, such as creating what was searched for. With no records yet the table can offer nothing of its own, so `#empty-actions` is the step there, such as adding the first record; `#empty` replaces it all.

**Attributes.** They reach the table, so `aria-label` names the table, its page checkbox, its scroll box and its pages; `class` and `style` stay on the card.

**Built from.** One card of UiTableToolbar, UiTable and UiPagination, standing straight on a page.

**Pages.** A new search, a new sort, or a choice the person changes in a UiFilter of `#filters` asks for page one; a value the app sets from outside does not, so a linked page keeps its place. A page past the last (after a delete, or on a narrower list) asks for the last.

**Loading.** The page loads the rows, and the page drops an answer that is not for its latest query, as First table in the README does: the table shows the rows it is given. While loading, the table keeps the last `total`. The page fetches when its models change, not inside the `update:search` handler: that handler runs before the move to page one that follows it. A new search draws skeleton rows at once, as many as were in view; a sort or a page of the same search keeps the rows, dimmed. A filter of the page's own empties `items` while its answer is out, in the same step that sets `loading`, and the skeleton takes their place too. The table stands on a floor its skeleton, its empty answer and its failed load share, so nothing under it moves while the person types; the search field keeps the focus and shows no spinner.

### Keyboard

- `Tab`: walks the toolbar, then the page checkbox, a sortable header, each row's checkbox and the controls in `#row-actions`, then the pages.
- `Enter` `Space`: on a sortable header, a button, turn it.
- `Escape`: clears the search.
A row is reached through a control in `#row-actions`, never by a click on the row alone. Rows marked by the app while the focus is in the toolbar hand it to the strip's clear button, as the strip covers the toolbar; the strip gone, the focus goes to the page checkbox.

### Screen reader

- Table: named by the `aria-label` the page gives it.
- Sortable header: says its direction (`aria-sort`); a sort a press asked for is said once the app sends it back.
- Row checkbox: named by `rowLabel`.
- Selection strip: says how many rows are selected through a live region. Its count, the range and the pager's page count are written as the app's language groups digits ("1,234").
- Refresh: says it is updating (`aria-busy`), then the range the load brought ("1–20 of 57").
- Empty page: says why.
- Failed load: says why and offers Retry.

### States

Loading (a skeleton on a first load), loaded, refreshing (the rows kept, dimmed to 60%), empty with nothing yet, empty because of a filter (change or reset the filters), failed (the words and Retry), a selection with its strip, and a page past the last, which asks for the last. A page is drawn whole, not windowed. Measured in Chromium (production build, six typed columns and checkboxes): 250 rows mount in about 70 ms and 1000 in about 320 ms, a third of it the browser's layout, and a sort redraws 1000 rows in about 150 ms. Past a few hundred rows, page.

### When to use another component

- A table with no toolbar and no pages: a bare UiTable.
- A list of names that grows from its last row: UiListField.
- Rows of settings or actions: UiListItem rows in a UiList.

## Examples

### States

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus } from '@lucide/vue'
import type { DataTableColumn } from 'grani-ui'
import { UiDataTable, UiFilter, UiButton, UiRadioGroup, UiRadio, useTableColumns } from 'grani-ui'

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

const status = ref<string[]>([])

const page = ref(1)

// The states show the frame of the list, not its length: a page of a few rows, its skeleton too.
const STATE_ROWS = 4

const listState = ref('loading')

const stateStatus = ref<string[]>([])

// A filter of the page's own asks for page one; the block does it for its search and sort.
watch(status, () => (page.value = 1))
</script>

<template>
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
</template>

```

### Searching

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { DataTableColumn } from 'grani-ui'
import { UiDataTable } from 'grani-ui'

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

const status = ref<string[]>([])

const page = ref(1)

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

// A filter of the page's own asks for page one; the block does it for its search and sort.
watch(status, () => (page.value = 1))
</script>

<template>
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
</template>

```

### Far page

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import type { DataTableColumn } from 'grani-ui'
import { UiDataTable, UiButton } from 'grani-ui'

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

const status = ref<string[]>([])

const page = ref(1)

const PAGE_SIZE = 10

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

// A filter of the page's own asks for page one; the block does it for its search and sort.
watch(status, () => (page.value = 1))
</script>

<template>
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
</template>

```

## API

Props:
- `columns`: `DataTableColumn<T>[] | TableColumns<T>` (required) — The columns in order, each with how its values are drawn: fixed; or the state from `useTableColumns` over them, and then the table draws its `visible` and the toolbar gets the columns button.
- `items`: `T[]` (required) — Rows of the current page.
- `total`: `number` — Records in the whole list; gives the count and the pages. Unset, there is no footer. Leave it unset until the first answer (a 0 would move a linked page back to one) and keep the last value while a page loads.
- `page`: `number` (default `1`) — Current page, from 1 (`v-model:page`). A new search or sort asks for 1; a page past the last asks for the last once the list is not loading.
- `pageSize`: `number` (default `25`) — Records per page; the count and the pages are derived from it.
- `rowLabel`: `((row: T) => string)` — Names a row for its checkbox: "Select Anna" instead of "Select row".
- `rowKey`: `RowKey<T>` — What tells rows apart; `id` when unset.
- `sort`: `TableSort` (default `null`) — The current sort (`v-model:sort`); the parent orders the rows.
- `selectable`: `boolean` (default `false`) — A checkbox on every row; the selection strip replaces the toolbar while rows are selected.
- `selection`: `Set<string | number>` (default `new Set<string | number>()`) — Keys of the selected rows (`v-model:selection`).
- `isRowSelectable`: `((row: T) => boolean)` — Which rows can be selected.
- `search`: `string` (required) — The search text (`v-model:search`); the field is always there.
- `searchPlaceholder`: `string` — What the search looks in: its placeholder and its name. Unset, "Search" and the table's `aria-label` ("Search Invoices"), so two lists on one page keep their searches apart.
- `size`: `ControlSize` = `xs | sm | md` — Step of the toolbar row: `xs` for a dense row, `sm` (36 px), `md` for a comfortable one; unset, the app's size (`createGrani({ size })`). The slots get it as `{ size }`.
- `loading`: `boolean` (default `false`) — Rows are on their way.
- `error`: `string | null` (default `null`) — Why the rows could not be loaded, in words; shown with a retry.
- `filtered`: `boolean` (default `false`) — A filter of the page's own is on: an empty page says so and offers "Reset filters", which sends `reset-filters`. A UiFilter in `#filters` and the block's own search count by themselves.
- `clickable`: `boolean` (default `false`) — Rows answer a click with `row-click`. The keyboard reaches a record through a control in `#row-actions`.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `retry` — The retry of a failed load was pressed.
- `update:page` (`page: number`) — Asks for a page: a pressed number or arrow, page one after a new search or sort, the last page when the list shrank under the current one.
- `update:sort` (`sort: TableSort`) — Asks for a sort: a column and its direction, or `null` to drop it; the parent orders the rows.
- `update:selection` (`selection: Set<string | number>`) — A new set of the selected keys; the old set is never changed in place.
- `update:search` (`value: string`) — The search text: after a pause in typing, at once on Enter or on clearing it.
- `row-click` (`row: T, event: MouseEvent`) — A row was clicked with `clickable` on.
- `reset-filters` — "Reset filters" in the empty state was pressed: the UiFilter components in `#filters` are reset already, the page clears its other filters.

Slots:
- `filters` with `{ size: ControlSize; }` — What narrows the list, after the search: a period, filters.
- `actions` with `{ size: ControlSize; }` — What acts on the list: catalog buttons, then the main action last (the columns menu comes from `columns`).
- `bulk` with `{ count: number; selection: Set<string | number>; size: ControlSize; }` — What acts on the selected rows; shown in the selection strip.
- `row-actions` with `{ row: T; rowIndex: number; }` — Controls of one row, in a column kept at the end.
- `empty` with `{ filtered: boolean; }` — Instead of the empty-page text.
- `empty-actions` with `{ searched: boolean; filtered: boolean; size: ControlSize; }` — The app's next step for an empty list: beside Clear search and Reset filters when nothing matched, alone under "No records yet".

## How it behaves

### From page one

- When: a list that pages gets a new search, a new sort or a changed filter.
- Props: `v-model:page`, `v-model:search`, `v-model:sort`, UiFilter in `#filters`.
- Guarantee: A new search, a press on a sortable header, or a choice the person changes in a UiFilter (a tick, Only, Reset) asks for page one through `v-model:page`. A filter or a page the app sets from outside moves nothing, so a linked page keeps its place.
- Without it: Page 4 of the new results, or an empty page that reads as no results, while the first matches stand on page one.
- Code: `<UiDataTable v-model:search="query" v-model:page="page" v-model:sort="sort" :items="rows" :total="total" />`
- Your part: Load the page the table asks for, with the search and the sort it comes with.
- Not covered: A filter that is not a UiFilter, and a tick in a list of a UiFilter of several dimensions, do not move the page: set it to one where they change.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "a new search or sort asks for page one", "a person's change of a filter asks for page one; a filter set from outside does not"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-from-page-one

### Way forward

- When: a search or a filter leaves no rows, or there are no records yet.
- Props: `v-model:search`, `filtered`, `@reset-filters`, `#empty-actions`.
- Guarantee: A search with no match says “No matching records” and offers Clear search, Reset filters while a filter is on, and your own step beside them, such as adding the client searched for. With no records yet your step stands alone under the words. A failed load says why and offers Retry.
- Without it: An empty table body that says neither why it is empty nor how to get the rows back.
- Code: `<UiDataTable v-model:search="q" :filtered="statuses.length > 0" @reset-filters="statuses = []" />`
- Your part: A UiFilter in `#filters` counts by itself, and Reset filters resets it. Pass `filtered` while another filter of yours is on, and clear it when `reset-filters` arrives. Give the step only your app knows in `#empty-actions`, such as New invoice, or creating the client that was searched for; without it, no records yet is the words alone.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "a search with no match offers to clear it, and the press asks for an empty search", "a filter that matches nothing offers to reset it, and the offer follows filtered", "a search with no match keeps Clear search and Reset filters, and the app's action stands beside them", "a list with no records yet says so and offers the app's action under its words", "a filter chosen in #filters makes an empty list offer Reset filters, which clears it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step

### Last page lands

- When: rows are deleted, or the page asked for is past the last.
- Props: `v-model:page`, `total`, `page-size`.
- Guarantee: After you delete the last row of the last page, the table requests the previous page while records remain, so you see rows instead of an empty page. If the current page is past the end for any other reason, the table waits until `loading` is false and then requests the last valid page based on the updated `total`.
- Without it: After you delete the last row of the last page, you are left on an empty page, and the list looks empty while it still has records.
- Code: `<UiDataTable v-model:page="page" :items="rows" :total="total" :page-size="20" />`
- Your part: Keep `total` up to date, and load the page the table asks for through `v-model:page`.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "removing the last row of the last page lands on the page before", "a page beyond the last asks for the last one once the list is not loading"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#last-page-lands

### A gap, not a zero

- When: a typed cell has no value.
- Props: `columns[].type`.
- Guarantee: A money, date or progress cell with no value shows the table’s dash: a missing progress is never a bar at 0.
- Without it: A task with no progress reported is drawn as an empty bar and read as not started.
- Code: `<UiDataTable :columns="[{ key: 'done', label: 'Done', type: 'progress' }]" :items="rows" />`
- Your part: Pass `null` where there is no value, and `0` only for a real zero.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "draws typed cells with the library cells and an empty value as a dash", "a progress cell with no value is the empty-cell dash, never a bar at 0"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#gap-not-zero

### Bulk action

- When: selected rows take an action.
- Props: `#bulk`.
- Guarantee: The toolbar becomes a selection strip showing how many rows are selected, with the count also announced by a screen reader. The `#bulk` slot receives the count, selection and size for the app’s actions. A separate button clears the selection.
- Without it: Actions far from the rows they act on, or no way to act on several rows at once.
- Code: `<UiDataTable v-model:selection="picked" selectable><template #bulk="{ count }">…</template></UiDataTable>`
- Your part: Put the actions in `#bulk` and apply them to the selection the slot gives you.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "the bulk slot gets the count, the selection and the size; the pager and the clear take the size", "shows the selection strip with the count, the bulk slot and a clear that empties the selection"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#bulk-action

### Stable dimensions

- When: the first page loads.
- Props: `loading`, `total`.
- Guarantee: The footer already has its space while the first page loads, so the total appears without moving the content below. Sorting or paging keeps the existing rows visible and dimmed. A new search preserves the space as described in “Search while the table stays in place”.
- Without it: The footer appears with the total and pushes the page down.
- Code: `<UiDataTable :items="rows" :total="total" :loading="loading" />`
- Your part: Leave `total` unset until the first answer.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "holds the footer while the first page loads, so nothing moves when the total arrives"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Still while loading

- When: a new search or filter is running, or a sort or page change within the same search.
- Props: `search`, `loading`.
- Guarantee: A new search replaces the previous rows, empty message or error with placeholders, matching the previous row count and at least the height of an empty or error message. Sorting or paging keeps the existing rows visible and dimmed. A failed request replaces the rows with a Retry message at the same height, and pressing Retry restores the placeholders. The search field keeps your text and keyboard focus and shows no spinner of its own.
- Without it: The list dims for one letter and blanks for the next, and everything below it jumps up and down while you type.
- Code: `<UiDataTable v-model:search="search" :columns="columns" :items="rows" :total="total" :loading="pending" />`
- Your part: Set `loading` while the request runs. For a filter of your own, also empty `items` in the same step that sets `loading`, until its answer comes: the placeholder rows then take their place, as many as were in view.
- Not covered: An answer with more or fewer rows than were in view changes the table’s height once, when it arrives.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "a new search draws skeleton rows at once, in place of the rows of the last answer", "the skeleton holds as many rows as were in view, and never fewer than the floor", "the empty answer and the failed load stand on the floor the skeleton fills", "a failed new search shows the plate with Retry, not the rows of the last answer; Retry brings the skeleton", "a sort or a page of the same search keeps the rows in place, dimmed", "while a search is out, the field keeps the focus and the typing, and draws no spinner"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#still-list

### Digits line up

- When: a column is `type: 'money'`.
- Props: `type: 'money'`; `align: 'start'` turns it off.
- Guarantee: A money column aligns to the end with equal-width digits by itself, its heading too, so amounts of different lengths line up. `align: 'start'` keeps it at the start.
- Without it: Amounts of different lengths start at the left edge, and 1,111.00 cannot be compared with 98.50 by eye.
- Code: `<UiDataTable :columns="[{ key: 'total', label: 'Total', type: 'money' }]" :items="rows" :total="rows.length" />`
- Your part: Nothing for money. Give other numeric columns `align: 'end'`, and format them alike down the column.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "a money column aligns to the end by itself; align start keeps it at the start"
- Pattern for all components: https://grani.arseni.work/patterns/finding#digits-line

### Asks once

- When: the answer to a search comes.
- Props: `v-model:search`, `loading`, `total`.
- Guarantee: The text goes out once the typing pauses, through its toolbar; once the rows of the answer are in, a screen reader hears how many were found, “1–10 of 12”. Nothing is said while the answer is on its way.
- Without it: A list that changes under a screen reader with no word of what the search found.
- Code: `<UiDataTable v-model:search="query" :items="rows" :total="total" :loading="pending" />`
- Your part: Set `loading` while the answer is on its way, and `total` when it comes.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "the range is said after each load, and nothing while one runs"
- Pattern for all components: https://grani.arseni.work/patterns/finding#typing-asks-once

### In the address

- When: its view is bound to `useListAddress`.
- Props: `useListAddress()`, `v-model:search`, `v-model:sort`, `v-model:page`, each filter’s `v-model`.
- Guarantee: A reload, a link and Back open the list with the same search, filters, sort and page. A typed search changes the address in place; a page, a sort or a filter adds a step that Back undoes. A page past the last, from an old link, is corrected in place, so Back never lands on it again.
- Without it: A reload or a shared link opens the list from its start, and the person sets the search, the filters and the page again.
- Code: `const view = useListAddress({ status: [] })`
- Your part: Call `useListAddress` once in the page, with your filters and their empty values (`[]` for several, `null` for one), bind the view, and load the rows for it. A filter of ids is named in `numbers`. The sort the list opens on goes in the `sort` option, since assigning it to the view afterwards would overwrite the address. `sortKeys` names the columns the address may sort by; without it, check the key before it reaches your request.
- Not covered: The columns shown are a person’s preference, kept in the browser, not in the address. A page rendered by a server is drawn with the defaults, and the address lands once it is mounted.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "a view kept in the address opens on its search and page, and a typed search is written back in place", "a page past the last, from the address, is corrected in place, so Back leaves it"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#list-link

### Range select

- When: rows can be selected.
- Props: `selectable`, `v-model:selection`.
- Guarantee: Shift with a second row checkbox selects every row between it and the one pressed before, and the app receives the whole range in one update of `v-model:selection`.
- Without it: Fifty presses to select fifty rows.
- Code: `<UiDataTable v-model:selection="picked" selectable :items="rows" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDataTable.spec.ts, not in the package): "Shift with a second row checkbox passes the whole range up through the block"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#range-select


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useTableColumns`, `useControlSize`, `useUiT`.
