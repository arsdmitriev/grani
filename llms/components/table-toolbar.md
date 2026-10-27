# Table toolbar (`UiTableToolbar`)

> Keep search, filters and actions together above the table they affect.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/table-toolbar

Also called list toolbar, search and filters bar, table header bar.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Settings2 } from '@lucide/vue'
import type { DateRangeValue, TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiDateRange, UiIconButton, UiButton, UiTable, UiCopyButton, UiDateCell, UiBadge } from 'grani-ui'

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

// Each tab keeps its own search: typing in one does not change the others.
const query = ref('')

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
</script>

<template>
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
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Results match the current search.
- Keep a reset from restoring the old search.
- Search once typing pauses.
- Finish a word in any script before it is sent.
- Reach frequent actions from the keyboard.
- Clear a search in one step.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Apply the values in the order they arrive.
- Set `search` to the new value; there is no pending send for you to cancel.
- Load the list on `update:search`, not on every key.

## Why it works this way

The row above a list, with a built-in search, what narrows the list on the left and what acts on it on the right. UiDataTable builds it from its own props and slots.

**Clusters.** `#start` holds what narrows the list (a period in UiDateRange, filters). `#end` holds what acts on it: catalog buttons, then the main action last. The columns menu is built in too; when the toolbar is given its state, it stands first on the right.

**Search.** The search is built in and always present (`v-model:search`). The field takes every key; the value goes out after a 250 ms pause, and Enter sends it at once. A value set from outside (a reset, the URL) replaces what was being typed. When a host applies the model late, the toolbar's own sent values coming back are not taken for an outside value, so what was typed since stays, and a clear or a step back made while a value is on its way is sent too. A host that drops a value it was sent without a word keeps it counted as on its way, and takes one outside value equal to it for its answer.

**Size.** Controls in the row share one step, `size`: the app's size (`createGrani({ size })`), or `sm` (36 px) if unset; `xs` for a dense row, `md` for a comfortable one. The slots get it as `{ size }` to bind on their controls.

**Layout.** On a narrow screen the search takes a line of its own and the rest share the line under it. The row is padded 16 px, so it lines up with the table's cells under it and with its footer; the card around them is the shell.

**Placement.** In UiDataTable's card, above the table; UiDataTable builds it from its search, `#filters`, `#actions` and `columns`. UiFilter and UiDateRange stand in `#start`, UiTableColumns first in the right cluster. A host may make it `inert` while a selection strip covers it.

### Keyboard

- `Tab`: reaches the search first (its cross next, while it holds text), then the controls in `#start`, the columns button and the controls in `#end`, in the order they stand.
- `/`: from anywhere outside a field, goes to the search of the first list in view, in the window open over the page when there is one. An app that takes the key itself calls `preventDefault` on it first.
In the search, where every key narrows the list after a 250 ms pause:
- `Enter`: sends at once and does not submit a form around it.
- `Escape`: empties it and keeps the focus, as the cross does.
Leaving the field sends what was typed. The Enter that confirms an IME candidate sends nothing.

### Screen reader

- Search: a landmark (`role="search"`) named like its field, by `searchPlaceholder`, "Search" by default; UiDataTable adds its own name ("Search Invoices"), so two lists on one page keep their searches apart. The field says its shortcut, `/` (`aria-keyshortcuts`).
- Row: has no name and no role.
- Slots: what they hold is read as the controls they are.

### States

Rest, text in the search (the cross shows), a pending send, a value set from outside that replaces the typing, `inert` under a selection strip; the row at `xs`, `sm` and `md`, and on a narrow screen the search on a line of its own.

### When to use another component

- One block of table, toolbar, pages and states: UiDataTable.
- A search outside a list: UiInput `type="search"`.
- A second columns menu: never in `#end`; the toolbar draws it from `columns`.

## Examples

### Status

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiFilter, UiButton, UiTable, UiCopyButton, UiDateCell, UiBadge } from 'grani-ui'

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

const statusQuery = ref('')

const statusFilter = ref<string[]>([])

const byClient = (q: string) => (r: Invoice) =>
  !q || r.client.toLowerCase().includes(q.toLowerCase())

const statusRows = computed(() =>
  ROWS.filter(
    (r) =>
      (!statusFilter.value.length || statusFilter.value.includes(r.status)) &&
      byClient(statusQuery.value)(r),
  ),
)
</script>

<template>
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
</template>

```

### Columns

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiButton, UiTable, UiCopyButton, UiDateCell, UiBadge, useTableColumns } from 'grani-ui'

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

const columnsQuery = ref('')

const byClient = (q: string) => (r: Invoice) =>
  !q || r.client.toLowerCase().includes(q.toLowerCase())

const columnsRows = computed(() => ROWS.filter(byClient(columnsQuery.value)))

const cols = useTableColumns('demo-toolbar-invoices', columns, { required: ['number'] })
</script>

<template>
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
</template>

```

### Set from outside

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiButton, UiTable, UiCopyButton, UiDateCell, UiBadge } from 'grani-ui'

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

const byClient = (q: string) => (r: Invoice) =>
  !q || r.client.toLowerCase().includes(q.toLowerCase())

// A value set from outside (a saved view, a reset) replaces what was being typed.
const outsideQuery = ref('')

const outsideRows = computed(() => ROWS.filter(byClient(outsideQuery.value)))
</script>

<template>
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
</template>

```

### Under a selection strip

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Trash2, X } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiFilter, UiButton, UiListItem, UiIconButton, UiTable, UiCopyButton, UiDateCell, UiBadge } from 'grani-ui'

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

const byClient = (q: string) => (r: Invoice) =>
  !q || r.client.toLowerCase().includes(q.toLowerCase())

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
</script>

<template>
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
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import { UiCard, UiTableToolbar, UiFilter, UiButton } from 'grani-ui'

const statuses = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
]

const statusFilter = ref<string[]>([])

const sized = { xs: ref(''), sm: ref(''), md: ref('') }
</script>

<template>
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
</template>

```

## API

Props:
- `search`: `string` (required) — The search text (`v-model:search`); the field is always there. Sent as typed, spaces included, after a 250 ms pause or at Enter.
- `searchPlaceholder`: `string` — What the search looks in; the field's placeholder and its name.
- `columns`: `TableColumns<T>` — The columns menu: the state from `useTableColumns`. The button stands first in the right cluster; without it the columns are fixed.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder for the row: `xs` for a dense row, `sm` (36 px), `md` for a comfortable one; unset, the app's size (`createGrani({ size })`). The slots get it as `{ size }`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `update:search` (`value: string`) — The search text, after the pause or at Enter.

Slots:
- `start` with `{ size: ControlSize; }` — What narrows the list, after the search: a period, filters; bind `size` on them.
- `end` with `{ size: ControlSize; }` — What acts on the list, after the columns menu: catalog buttons, then the main action last; bind `size`. Not another columns menu.

## How it behaves

### Late answer dropped

- When: the app applies the search late, as a router query does.
- Props: `v-model:search`.
- Guarantee: When the app applies a search value the toolbar sent earlier, the toolbar recognizes it as a delayed update: it keeps the text you typed since then and sends that newer value when ready, including an empty value if you cleared the search.
- Without it: The late value writes the old text back into the field, and a clear you made is undone.
- Code: `<UiTableToolbar
  :search="String(route.query.q ?? '')"
  @update:search="(q) => router.replace({ query: { q } })"
/>`
- Your part: Apply the values in the order they arrive.
- Not covered: The toolbar expects each value it sends to be applied to `search`. If the app drops one, the toolbar still treats it as pending. A later external update with that same value can then be mistaken for the delayed response instead of a new reset.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "the host echoing an older sent value does not erase what was typed since", "a clear made while a value is on its way is sent, and the late echo does not undo it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#late-dropped

### Reset wins

- When: the app sets the search itself: a reset, a saved view, a step back.
- Props: `v-model:search`.
- Guarantee: The field shows the search value the app set and discards any earlier text still waiting for the typing delay, so the old search is never sent afterward.
- Without it: The list is reset while the field still shows the old text, and the pending send can filter the list by it again.
- Code: `<UiTableToolbar v-model:search="q" />
<UiButton @click="q = ''">Reset filters</UiButton>`
- Your part: Set `search` to the new value; there is no pending send for you to cancel.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "a value set from outside replaces the typing and drops the pending send"
- Pattern for all components: https://grani.arseni.work/patterns/finding#outside-wins

### Asks once

- When: you type in the search.
- Props: none: every UiTableToolbar.
- Guarantee: The text is sent once, 250 ms after the last key, with the latest value. Enter sends it at once and does not submit a form around the toolbar. Nothing is sent while an input method, for example for Japanese, is still composing a word.
- Without it: A request on every key: five letters, five requests.
- Code: `<UiTableToolbar v-model:search="q" />`
- Your part: Load the list on `update:search`, not on every key.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "sends the text once after the pause, with the last value", "Enter sends at once and does not submit a form around the toolbar", "no emit happens while a word is being composed"
- Pattern for all components: https://grani.arseni.work/patterns/finding#typing-asks-once

### Words in the making

- When: a search is typed through an input method.
- Props: none: every UiTableToolbar.
- Guarantee: Nothing is sent while the word is being composed, and the Enter that picks it sends nothing; the whole word goes out once the typing pauses.
- Without it: A search sent for every reading of the word, and one more for the Enter that picks it.
- Code: `<UiTableToolbar v-model:search="query" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "no emit happens while a word is being composed", "the Enter that confirms an IME candidate sends nothing", "the Enter Safari sends after it ends a composition sends nothing at once"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#word-as-composed

### Shortcut keys

- When: a page with a list on it.
- Props: none: every UiTableToolbar, and so every UiDataTable.
- Guarantee: Pressing `/` anywhere outside a field moves keyboard focus to the search of the first list in view, or to the list in the window open over the page when there is one. The field names the key to a screen reader.
- Without it: A trip to the mouse, or a run of Tab presses, to start a search you meant to type.
- Code: `<UiTableToolbar v-model:search="query" />`
- Your part: Nothing. An app that takes `/` for itself calls `preventDefault` on it first, and the list leaves it.
- Not covered: Only the first list in view takes the key; a list hidden in a closed tab or panel is passed over.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "/ from the page goes to the search, and the field says its shortcut", "typed in a field, / stays a slash", "the first list on the page takes /", "a / the app took first, a window open over the list, or a list held inert keep it"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#keyboard-actions

### Search clears

- When: the search has text.
- Props: none: every UiTableToolbar.
- Guarantee: × or Escape clears the search, and you can type the next term without leaving the field. The empty value reaches the app immediately, bypassing the usual 250 ms delay, even when earlier typing was still waiting to be sent.
- Without it: The field looks empty while the list is still filtered by text the field no longer shows.
- Code: `<UiTableToolbar v-model:search="q" />`
- Your part: Nothing. Do not add a clear button of your own: the field already has one.
- Proof, in the repository's tests (UiTableToolbar.spec.ts, not in the package): "the cross and Escape each send the empty value once, at once, and keep the focus"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `debounce`, `useTableColumns`, `useControlSize`, `useUiT`.
