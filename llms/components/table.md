# Table (`UiTable`)

> Compare records in columns, sort and select rows and act on a row, with clear states for loading, empty results and errors.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/table

Also called simple table, grid, rows and columns.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiCopyButton, UiDateCell, UiMoneyCell, UiBadge } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const
</script>

<template>
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
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show missing data as a gap.
- See that a row goes on past its edge.
- Select or clear a range of rows.
- Show when only some are selected.
- Keep nearby content in place while loading.
- Keep keyboard focus where you are working.
- See whether an action worked.
- Ignore extra presses while a request runs.
- Give every empty list a way forward.
- See how the rows are sorted.
- Compare numbers in aligned columns.
- Read the full text when a label is shortened.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `null` where there is no value, and `0` only for a real zero.
- Keep `v-model:selection` to rows that still exist: drop the keys of rows that were deleted.
- Set `skeletonRows` to the page size.
- Pass the error message in words as `error`, and load again on `@retry`.
- Set `loading` from the moment you ask for rows until they arrive.
- Use `#empty` to supply a UiNoData message with an action such as Create or Reset. For a failed load, pass an explanation in `error` and load again on `retry`.
- Order the rows by `sort` yourself: the table reports the choice and does not reorder the rows.
- Format the numbers alike down a column, with the same number of decimals, so their digits line up.
- Set `truncate` on a column of long names, and a `width` where it should not take the room left.

## Why it works this way

Records as rows under column headers, with sorting, selection and loading states. Take it inside UiDataTable, or alone for a list with no toolbar and no pages.

**Data.** It draws the page it is given and owns none of the data. A header click asks for a sort (`v-model:sort`). A checkbox marks a row (`v-model:selection`, a set of row keys); with Shift, by pointer or Shift+Space, it marks the range from the last row marked. The parent loads, filters and orders the rows, and keeps the selection to rows that still exist.

**Look.** One presentation: a hairline between rows, space between columns, a tint on the row under the pointer. The table draws no shell; the card around it does (`UiCard :padded="false"`). Its focus rings are drawn inside, since the card clips what sticks out.

**Wide tables.** A wide table scrolls sideways in its own box, with `#row-actions` kept at the end. Once it overflows, the box takes focus and the arrow keys scroll it, a side with more columns past it is shaded, and on a desktop pointer an arrow in the header's band pages the table toward it, so a narrow screen shows the table goes on and how to reach the rest. The arrow stands over the edge of the header cell under it, which is pressed beside it. An empty or a failed table shows its plate with neither. Once it scrolls, a column of short values (24 characters or fewer) keeps them on one line: the table has the room to the side.

**Loading.** The first load shows skeleton rows, as many as the page will hold; a refresh keeps the rows in view, dimmed and busy, and says it updates. In UiDataTable, a list that searches, the table stands on a floor: its empty and failed states fill it, and a skeleton holds as many rows as were in view, never fewer than fill it. A skeleton cell draws the lines its column holds (`lines`, 2 for a UiMoneyCell or UiDateCell), so the rows arrive at their height. With `#row-actions`, it holds the square of one icon button at the app's size, so the actions column keeps its width and the row its height. The other columns take their width from their content, which a skeleton does not have: those without a `width` settle when the rows arrive.

Empty and failed. An empty page is UiNoData: "no records yet", or, with `filtered`, "nothing matches"; `#empty` puts one with its own action in its place. A failed load is UiNoData `danger` with the message and Retry. A failed refresh shows the same plate in place of the rows, and Retry brings the skeleton back.

**Rows.** A row without a key keeps its DOM node for the life of the page, so a sort moves the row with its record. The totals row shows only when there are rows. A cell of an object needs `format`, `accessor` or its slot; without one it draws a dash.

**Focus.** It stays where the person is when the rows change under it: a sort leaves it on the same control of the same row, a row deleted hands it to the same control of the row now in its place (the row above when it was the last), and a page left without rows gives it to the table's box. A focus that went elsewhere, into a window opened from a row, is not pulled back; that window gives it back to its own trigger. A row's own control turned off for a moment keeps it. A row deleted from its UiMenu is handed on the same way: the menu gives the focus back to its button first. A row removed while a window opened from it holds the focus (a question's `action`) is handed on too: the window gives the focus to the same control of the row now in its place.

**Attributes.** They reach the `<table>`, so `aria-label` names it and its page checkbox; `class` and `style` stay on the root.

**Placement.** In UiDataTable, under UiTableToolbar and over UiPagination, with UiMoneyCell and UiDateCell as its cells. Alone in a `UiCard :padded="false"` when a list needs no toolbar and no pages.

### Keyboard

- `Tab`: once the table overflows, reaches its scroll box first; then the page checkbox, a sortable header, each row's checkbox and the controls in `#row-actions`, and the Retry of a failed load.
- `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: on the scroll box, scroll it.
- `Enter` `Space`: on a sortable header, a button, turn it.
- `Space`: on a checkbox, marks the row.
- `Shift+Space`: on a checkbox, marks the range from the last row marked.
A row is reached through a control in `#row-actions`, never by a click on the row alone. A header pressed while rows load asks for nothing and keeps the focus; Retry is held the same way and leaves the focus in the table.

### Screen reader

- Table: named by the `aria-label` the page gives it, and so are its page checkbox ("Select all on this page of Orders") and its scroll box.
- Sortable header: says its direction (`aria-sort`); a sort a press asked for is said once the app sends it back ("Sorted by Name, ascending").
- Row checkbox: "Select row", or "Select Anna" with `rowLabel`, and says its shortcut.
- Columns: the selection column and the actions column have hidden names.
- Row: says whether it is selected (`aria-selected`).
- Status: one region, present from the start and drawn empty, says "Loading…", the empty words, from a moment after the table mounts. The plate of an empty page is no second live region; a UiNoData of your own in `#empty` takes `role="none"` for the same.
- Failed load: announced by its plate.
- Refresh: `aria-busy` on the rows.

### States

A first load (skeleton rows, as many as the page holds), rows, a refresh (the rows kept, dimmed to 60% and busy), empty with nothing yet, empty because of a filter (`filtered`), a failed load (UiNoData `danger` with Retry), a failed refresh (the same plate in place of the rows), a sort, a selection with the page checkbox mixed, a totals row shown only with rows, and a wide table that scrolls in its box.

### When to use another component

- A list screen: UiDataTable, with its toolbar, pages and selection strip.
- Rows of settings or facts: UiListItem rows in a UiList.
- A list of names that grows from its last row: UiListField.
- The changes of one event: UiLog's own table.

## Examples

### Sortable

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableColumn, TableSort } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell, UiDateCell, UiCopyButton, UiBadge } from 'grani-ui'

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
</script>

<template>
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
</template>

```

### Selectable

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell, UiDateCell, UiCopyButton, UiBadge } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

const selection = ref(new Set<string | number>())

const unpaid = (row: Invoice) => row.status !== 'paid'
</script>

<template>
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
</template>

```

### Row actions

```vue
<script setup lang="ts">
import { Ellipsis, Pencil } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell, UiCopyButton, UiBadge, UiIconButton, UiMenu, UiListItem, UiSeparator, UiToaster, useToast } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

// What a row's action does is out of the demo's reach: a toast names it.
const toast = useToast()
</script>

<template>
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
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Totals

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell, UiDateCell, UiCopyButton, UiBadge } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

const total = computed(() => ROWS.reduce((sum, r) => sum + r.amount, 0))
</script>

<template>
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
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Inbox, Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiCopyButton, UiDateCell, UiMoneyCell, UiBadge, UiNoData, UiButton, UiRadioGroup, UiRadio } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

const tableState = ref('loading')
</script>

<template>
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
</template>

```

### Wide

```vue
<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell, UiBadge, UiDateCell, UiCopyButton, UiIconButton } from 'grani-ui'

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

const TONE = { paid: 'success', due: 'neutral', overdue: 'danger' } as const

const LABEL = { paid: 'Paid', due: 'Due', overdue: 'Overdue' } as const

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
</template>

```

### Money

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiMoneyCell } from 'grani-ui'

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
</script>

<template>
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
</template>

```

### Date

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiCopyButton, UiDateCell } from 'grani-ui'

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

const dateColumns: TableColumn<Invoice>[] = [
  { key: 'number', label: 'Invoice', width: '110px' },
  { key: 'time', label: 'Within a day', accessor: (r) => r.issued },
  { key: 'day', label: 'Across months', accessor: (r) => r.issued },
  { key: 'weekday', label: 'Weekday', accessor: (r) => r.issued },
]
</script>

<template>
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
</template>

```

## API

Props:
- `columns`: `TableColumn<T>[]` (required) — The columns in order; each names its `#cell.<key>` slot. A column is `{ key, label }` and may add `accessor(row)` (the value when it is not `row[key]`), `format(value, row)` (the text), `sortable` with `defaultSortDir` (`asc` or `desc`, the first press), `align: 'end'` (numbers, digit under digit), `width` (one CSS value, `120px` or `calc(…)`), `truncate` (one line, cut with a tooltip; cut columns with no width share the room left evenly).
- `items`: `T[]` (required) — Rows of the current page. The table does not load, filter or sort them.
- `rowKey`: `RowKey<T>` — What tells rows apart: a field name or a function; `id` when unset, so rows without an `id` need it. A row without a key cannot be selected, and is known by its object: a parent that rebuilds its rows on every render remounts them all.
- `loading`: `boolean` (default `false`) — Rows are on their way: skeleton rows on the first load, the rows in view dimmed on a refresh.
- `skeletonRows`: `number` (default `5`) — Skeleton rows on the first load: the page size, so nothing moves when the rows arrive.
- `rowLabel`: `((row: T) => string)` — Names a row for its checkbox: "Select Anna" instead of "Select row".
- `error`: `string | null` (default `null`) — Why the rows could not be loaded, in words for the reader, shown with a retry. A failed refresh shows the same plate in place of the rows.
- `selectable`: `boolean` (default `false`) — A checkbox on every row and one for the page in the header.
- `selection`: `Set<string | number>` (default `new Set<string | number>()`) — Keys of the selected rows (`v-model:selection`); the page checkbox adds or removes the page, Shift with a row's checkbox the rows from the last one marked. The parent drops the keys of rows it deletes.
- `isRowSelectable`: `((row: T) => boolean)` — Which rows can be selected; the others show a disabled checkbox and stay out of the page checkbox.
- `sort`: `TableSort` (default `null`) — The current sort (`v-model:sort`); a header click cycles the column's first direction, the other one, then none.
- `clickable`: `boolean` (default `false`) — Rows answer a click with `row-click` and show a pointer cursor. A pointer shortcut: the keyboard path to a row is a control in it (`#row-actions`), the row itself takes no tab stop.
- `filtered`: `boolean` (default `false`) — The page is empty because of a filter or a search: the empty text says so.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `retry` — The retry of a failed load was pressed.
- `update:sort` (`sort: TableSort`) — A header was clicked: the column and direction to sort by, `null` to drop the sort.
- `update:selection` (`selection: Set<string | number>`) — The selection changed; a new set, the one passed in is not mutated.
- `row-click` (`row: T, event: MouseEvent`) — A row was clicked with `clickable` on. Not for a click on a control inside the row, with a modifier key, or over selected text.

Slots:
- `row-actions` with `{ row: T; rowIndex: number; }` — Controls of a row, in a column kept at the end when the table scrolls: ghost icon buttons.
- `empty` with `{ filtered: boolean; }` — Instead of the empty-page text; `filtered` says which wording it replaces.

### Date cell (`UiDateCell`)

Props:
- `value`: `DateValue | null` (required) — An ISO string with a time or a day alone, a Date, or a timestamp. A time with no zone is read in the app's zone. Empty or unreadable prints a dash.
- `variant`: `DateCellVariant` = `day | time` (default `"day"`) — Which fact leads: `time` on top for a list within a day, `day` on top for a list across months.
- `context`: `DateCellContext` = `weekday | relative` (default `"relative"`) — What the lower line answers: how long ago (`relative`), or which day of the week (`weekday`).
Attributes are placed by the component itself: its description says where.

### Money cell (`UiMoneyCell`)

Props:
- `value`: `string | number | null` (required) — The amount in major units: a number or the decimal string an API sends. Empty or unreadable prints a dash.
- `currency`: `string` — ISO 4217 code for this cell; unset, the app's currency (`createGrani({ currency })`).
- `unit`: `string` — What the amount is per, `kg` or `pc`; shown after the currency as "EUR / kg".
- `tone`: `MoneyTone` = `success | danger | info` — Meaning of the amount: `success`, `danger`, `info`. Unset is the normal ink.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### A gap, not a zero

- When: a cell has no value.
- Props: `items` with `null` where there is no value.
- Guarantee: A cell with no value shows a dash, and so does one whose `format` returns an empty or blank string. A real `0` is printed as 0.
- Without it: A missing amount is printed as 0 and read as nothing owed, or the cell is left empty and reads as a value still loading.
- Code: `<UiTable :columns="columns" :items="[{ id: 1, paid: null }]" aria-label="Invoices" />`
- Your part: Pass `null` where there is no value, and `0` only for a real zero.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "renders headers and values: format, accessor, a dash for an empty value", "a format that returns an empty string still shows the table's dash"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#gap-not-zero

### More past the edge

- When: its columns are wider than its box.
- Props: none: every UiTable; `#row-actions` for the actions of a row.
- Guarantee: A shade marks the edge with more columns past it: the end at first, at the row actions, where the columns slide under them, and the start once scrolled. On a desktop pointer an arrow in the header’s band pages the table toward that edge; the scroll box takes the focus and the arrow keys scroll it. The actions of each row stay at the end, in view.
- Without it: A table cut at the screen’s edge that looks complete, with the actions of its rows out of sight.
- Code: `<UiTable :columns="manyColumns" :items="rows" aria-label="Invoices" />`
- Your part: Nothing. Give a column of long names `truncate`, and a `width` where a column should not grow.
- Not covered: The arrows are for a desktop pointer: on a touch screen the table is swiped. An arrow stands over the edge of the header cell under it, which is pressed beside it. The header row does not stick to the top of the page as the page scrolls.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "fades at the end while more columns wait there", "fades at the start once scrolled, and not at the end when the end is reached", "a table that fits draws no fade", "the horizontal scroll box is keyboard-focusable and named once the table overflows", "row actions add a sticky last column with a named header; a footer cell adds the footer row", "the end's shade stands at the row actions, where the columns slide under them", "an edge with more columns past it grows an arrow that pages the table, for the pointer", "at the end the arrow stands at the start and pages back", "an empty or a failed wide table draws no shade and no arrow over its plate"
- Pattern for all components: https://grani.arseni.work/patterns/finding#edge-says-more

### Range select

- When: a row checkbox is pressed with Shift, with the pointer or with Shift+Space.
- Props: `selectable`, `v-model:selection`.
- Guarantee: Every selectable row between the checkbox you activate and the previous one takes its new state: checking selects the range, unchecking clears it.
- Without it: Ten rows take ten presses.
- Code: `<UiTable v-model:selection="picked" selectable :columns="columns" :items="rows" />`
- Your part: Keep `v-model:selection` to rows that still exist: drop the keys of rows that were deleted.
- Not covered: A range stays within the page in view and skips rows that cannot be selected.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "Shift with a second checkbox marks every row between", "Shift over marked rows clears the range, as the pressed row goes", "Shift+Space from the keyboard marks the range too"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#range-select

### Some selected

- When: some, but not all, selectable rows of the page are selected.
- Props: `selectable`.
- Guarantee: The page checkbox shows the dash and is announced as mixed. A press selects every selectable row of the page and leaves out rows that cannot be selected; a press when all of them are selected clears them.
- Without it: The page checkbox looks empty while some rows are selected, as if nothing were.
- Code: `<UiTable v-model:selection="picked" selectable :columns="columns" :items="rows" aria-label="Invoices" />`
- Your part: Nothing.
- Not covered: It counts only the page in view: rows selected on other pages do not count toward it.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "the page checkbox selects the selectable rows, shows mixed for a part, clears when all are in"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#mixed-says-some

### Stable dimensions

- When: rows load: the first page, or a refresh with rows in view.
- Props: `loading`, `skeletonRows`.
- Guarantee: The first load shows placeholder rows sized like text rows, as many as the page size. A refresh keeps the existing rows visible, dimmed and marked busy, so the table does not collapse while waiting.
- Without it: The rows disappear for the refresh, and everything below the table jumps up, then down.
- Code: `<UiTable :columns="columns" :items="rows" :loading="pending" :skeleton-rows="20" />`
- Your part: Set `skeletonRows` to the page size.
- Not covered: A page that comes back shorter or longer still changes the height once.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "a skeleton row has the height of a text row and its bar follows the column alignment", "a refresh in flight keeps the existing rows instead of skeleton rows, and says it is busy"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Focus stays near

- When: Rows are deleted or sorted while keyboard focus is on a button in a row.
- Props: none: every UiTable.
- Guarantee: After you delete a row, keyboard focus moves to the same button in the row that takes its place, or in the previous row if you deleted the last one, so the next delete is one Enter away. A row deleted while a window opened from it holds the focus (a confirmation’s `action`) is handed on the same way when the window closes. If the page becomes empty, focus moves to the table container. After sorting, focus stays on the same button in the same record, wherever that record moves.
- Without it: Every delete loses keyboard focus, and you tab through the page again to reach the next row's Delete button.
- Code: `<UiTable :columns="columns" :items="rows">
  <template #row-actions="{ row }">
    <UiIconButton :icon="Trash2" ariaLabel="Delete" @click="remove(row)" />
  </template>
</UiTable>`
- Your part: Nothing. Remove or reorder the rows in `items` as usual; the table moves keyboard focus itself.
- Not covered: This applies to buttons in a row and to a row’s UiMenu, which gives the focus back to its button before the command runs, so Delete from the ⋯ menu lands on the ⋯ of the next row. A menu of your own that keeps the focus until the row is gone loses it with the row.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "a row deleted under the focus hands it to the same control of the row now in its place", "the page checkbox turned off with the last row gives the focus to the table box"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays

### Outcome shown

- When: loading rows fails.
- Props: `error`, `@retry`.
- Guarantee: When a load fails, whether first or refresh, a message with Retry replaces the rows, and a screen reader announces it once; no old rows are left on screen. Pressing Retry brings the placeholder rows back.
- Without it: An empty table, with no sign of whether there are no records or the request failed.
- Code: `<UiTable :columns="columns" :items="rows" :error="failure" :loading="pending" @retry="load" />`
- Your part: Pass the error message in words as `error`, and load again on `@retry`.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: you press a column header or Retry while rows load.
- Props: `loading`.
- Guarantee: While rows load, a column heading keeps keyboard focus, but pressing it does not request another sort. When the app starts loading after Retry, placeholder rows replace the Retry button, so it cannot be pressed again while the request runs.
- Without it: Two presses send two requests, and the answer that arrives last may be the older one.
- Code: `<UiTable v-model:sort="sort" :columns="columns" :items="rows" :loading="pending" />`
- Your part: Set `loading` from the moment you ask for rows until they arrive.
- Not covered: Row checkboxes and `#row-actions` stay active during a refresh, because the selection holds row keys, not the rows themselves.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "a retry in flight after a failure draws the skeleton: no retry is left to press twice", "a header pressed while rows load asks for no second sort and keeps the focus"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Way forward

- When: a page has no rows, or the first load failed.
- Props: `filtered`, `error`, `#empty`.
- Guarantee: An empty page says why: “No records yet”, or “No matching records” with `filtered`. A failed load says “Could not load records” with the message you pass in `error`, offers Retry, and a screen reader announces it at once.
- Without it: A blank table, which reads as a failed load.
- Code: `<UiTable :columns="columns" :items="rows" :filtered="Boolean(query)">
  <template #empty="{ filtered }">…</template>
</UiTable>`
- Your part: Use `#empty` to supply a UiNoData message with an action such as Create or Reset. For a failed load, pass an explanation in `error` and load again on `retry`.
- Not covered: Without `#empty`, an empty page says why but offers no button.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "an empty page and a failed load say why; #empty puts the next step of your own in place"
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step

### Sort said

- When: a column is `sortable`.
- Props: `sortable` and `defaultSortDir` on a column, `v-model:sort`.
- Guarantee: A press on its header asks for the column’s first direction (`defaultSortDir`, ascending unless set), then the other direction, then no sort. An arrow icon shows the direction, and `aria-sort` lets a screen reader announce it.
- Without it: Nothing shows how the rows are sorted, so you have to compare values to work out their order.
- Code: `<UiTable v-model:sort="sort" :columns="[{ key: 'amount', label: 'Amount', sortable: true }]" :items="rows" />`
- Your part: Order the rows by `sort` yourself: the table reports the choice and does not reorder the rows.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "a sortable header cycles first direction, the other one, then none; aria-sort follows"
- Pattern for all components: https://grani.arseni.work/patterns/finding#sort-says

### Digits line up

- When: a column has `align: 'end'`.
- Props: `align: 'end'` on a column.
- Guarantee: The column aligns numbers to the end and uses equal-width digits, so with consistent decimal formatting the digits line up and values are easy to compare down the column.
- Without it: 1,111 and 8,888 have different widths, so the eye compares lengths, not values.
- Code: `<UiTable :columns="[{ key: 'amount', label: 'Amount', align: 'end' }]" :items="rows" />`
- Your part: Format the numbers alike down a column, with the same number of decimals, so their digits line up.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "an end-aligned column sets tabular figures"
- Pattern for all components: https://grani.arseni.work/patterns/finding#digits-line

### Whole text

- When: a column is set to `truncate`.
- Props: `columns[].truncate`.
- Guarantee: The cell keeps one line, cut with an ellipsis, and the whole text stands in a tooltip while the cut is real.
- Without it: A row that grows to three lines for one long name, or a name cut with no way to read the rest.
- Code: `<UiTable :columns="[{ key: 'client', label: 'Client', truncate: true }]" :items="rows" aria-label="Invoices" />`
- Your part: Set `truncate` on a column of long names, and a `width` where it should not take the room left.
- Proof, in the repository's tests (UiTable.spec.ts, not in the package): "stands in a UiTruncate, not under a title"
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`, `announce`, `useControlSize`.
