# Table columns (`UiTableColumns`)

> Choose which columns to show and keep that choice for later visits in the same browser.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/table-columns

Also called column picker, column visibility, show hide columns.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiButton, UiTable, useTableColumns } from 'grani-ui'

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
</script>

<template>
  <UiCard :padded="false" class="w-full">
    <UiTableToolbar v-model:search="query" :columns="cols" class="border-b border-border">
      <template #end>
        <UiButton><Plus />New invoice</UiButton>
      </template>
    </UiTableToolbar>
    <UiTable :columns="cols.visible.value" :items="ROWS" />
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep at least one column visible.
- Remember hidden columns in this browser.
- Keep one option and clear the rest in one press.
- Find what you chose at the top of a long filter.
- Clear a search in one step.
- Notice when there are more options below.
- Jump to an option by letter.
- Keep Reset in one place.
- Open with keyboard focus where the task begins.
- Continue from where you opened the panel.
- Pass a group with one press of Tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Put an identifying column, such as a name or record number, in `required` to keep it visible. The component prevents hiding the last visible column automatically.
- Name the kind of table in `key` (for example `invoices`), and pass the signed-in user as `scope` when two people share a browser.

## Why it works this way

A button with a panel where a person picks which columns a table shows. The table toolbar draws it from its `columns` prop; it is not placed by hand.

**Panel.** The panel is a UiPopover with a checkbox per column, applied at once. A required column is ticked, held and marked "Required". The last column shown cannot be hidden and is marked "Last one". The marks are one word, so the one that comes with the last tick does not widen the panel under the pointer, and the column's own name keeps its room. Reset in the footer returns to the default; it is held while nothing differs, so the list never moves under the pointer. From six columns the shown stand first under "Shown" and the hidden under "Hidden", a line between, so the list says why its order is not the table's.

A view, not a filter. The choice is a personal view, so the button shows no count. `useTableColumns` keeps the choice per kind of table; this component is the view of that state, and the page draws the table from the state's `visible`. A stored choice arrives once the page runs in the browser, so a page rendered on the server shows the default columns for a moment.

**Placement.** The toolbar draws it first in the right cluster, across the row from UiFilter and UiDateRange. UiDataTable takes the same state as its `columns`.

**Button.** The button names itself in a tooltip. Attributes land on the button, not on the panel.

### Keyboard

On the button:
- `Tab`: reaches it.
- `Enter` `Space`: open the panel; the focus goes to the list, or to its search when there are six columns or more.
In the panel, where the list is one tab stop and Reset the next; from six columns up the search takes the list's tab stop, and its cross is one more once it holds text:
- `ArrowDown` `ArrowUp`: in the list, move the highlight.
- `Home` `End`: jump.
- `Enter` `Space`: tick.
- `A–Z`: jumps to the column that starts with the letter.
- `Escape`: closes the panel and returns the focus to the button.
- `Tab`: cycles inside the panel.

### Screen reader

- Button: named "Columns" (`aria-label`, and the tooltip), with `aria-haspopup` and `aria-expanded`.
- Panel: a dialog with the same name.
- List: a multi-select listbox named "Columns", each column an option that says whether it is ticked.
- Held column: says "Required" or "Last one" after its name.
- Count: under the list, a status region, read as it changes: "2 hidden" or "All columns shown".

### States

Rest, open, a column ticked, a required column held with "Required", the last column shown held with "Last one", Reset held while nothing differs; the choice kept across a remount, and the default columns for a moment on a page rendered on the server. No count on the button: the choice is a view, not a filter.

### When to use another component

- Narrowing the rows: UiFilter.
- A period: UiDateRange.
- One choice among a few: UiSelect.
- A second menu beside a toolbar: never; the toolbar draws it from `columns`.

## Examples

### No column required

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTableToolbar, UiTable, useTableColumns } from 'grani-ui'

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

// With no required column, however many are hidden, the last one shown stays.
const loose = useTableColumns('demo-invoices-loose', columns)

const looseQuery = ref('')
</script>

<template>
  <UiCard :padded="false" class="w-full">
    <UiTableToolbar v-model:search="looseQuery" :columns="loose" class="border-b border-border" />
    <UiTable :columns="loose.visible.value" :items="ROWS" />
  </UiCard>
</template>

```

## API

Props:
- `columns`: `TableColumns<T>` (required) — The columns state from `useTableColumns`: every column, the hidden ones, which may be hidden. The table draws its `visible`.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder for the button: the toolbar row's, the app's size (`createGrani({ size })`) when unset.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

## How it behaves

### Last column stays

- When: no column is required and all but one are hidden.
- Props: `useTableColumns(key, columns)` with no `required`.
- Guarantee: The last column shown cannot be unticked and is marked “Last one”, so the table always shows at least one column.
- Without it: A menu that unticks the last column, leaving empty rows that read as a failed load.
- Code: `const cols = useTableColumns('invoices', COLUMNS)`
- Your part: Put an identifying column, such as a name or record number, in `required` to keep it visible. The component prevents hiding the last visible column automatically.
- Not covered: A stored choice that hides every column, for example one saved for an older set of columns, shows the first column.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "the last column shown is held and marked Last one"
- Pattern for all components: https://grani.arseni.work/patterns/finding#last-column-stays

### Columns remembered

- When: the table is opened again in this browser.
- Props: `useTableColumns(key, columns)`.
- Guarantee: The column choice is stored as soon as it changes and restored on the next visit. With the default browser storage, changes made in another tab are also applied to this one.
- Without it: A choice kept only in the page: the hidden columns are back on every visit.
- Code: `const cols = useTableColumns('invoices', COLUMNS)`
- Your part: Name the kind of table in `key` (for example `invoices`), and pass the signed-in user as `scope` when two people share a browser.
- Not covered: Preferences belong to this browser and are not shared through a URL. A server-rendered page may briefly show default columns before the stored choice applies. With `createGrani({ storage })`, automatic updates from other tabs are unavailable; the last tab to save a choice wins.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "a choice made in the menu is there after a remount"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#columns-remembered

### Only this

- When: a table of three columns or more.
- Props: none: every UiTableColumns.
- Guarantee: The highlighted row offers Only, which shows that column alone and hides the others in one press; a required column stays beside it, and Reset brings the default back.
- Without it: Unticking every other column, one by one, to look at a single one.
- Code: `<UiTableToolbar v-model:search="q" :columns="columns" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "Only keeps the highlighted column alone, and a required column stays beside it", "Only on a hidden column leaves that column alone in view"
- Pattern for all components: https://grani.arseni.work/patterns/finding#only-this

### Chosen first

- When: a table of six columns or more.
- Props: none: every UiTableColumns.
- Guarantee: The columns the table shows open at the top of the list under Shown, in the table’s order, and the hidden ones below a line under Hidden, so you see why the list runs in another order than the table; the order holds while the panel is open, so a tick never moves a row under the pointer.
- Without it: The columns in view scattered down a long list, some below its fold.
- Code: `<UiTableToolbar v-model:search="q" :columns="columns" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "from six columns the ones shown open at the top, in the order of the table", "from six columns the shown and the hidden stand under their names, a line between"
- Pattern for all components: https://grani.arseni.work/patterns/finding#chosen-first

### Search clears

- When: a table of six columns or more.
- Props: none: every UiTableColumns.
- Guarantee: A search stands over the list of columns and narrows it as you type. Its cross or Escape empties it and keeps the focus in the field; an Escape with no text closes the panel.
- Without it: An Escape meant for the text that closes the whole panel, so the search starts over.
- Code: `<UiTableToolbar v-model:search="q" :columns="columns" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "from six columns a search narrows the list, and Escape empties it with the panel still open"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Five and a half rows

- When: a table of more than five columns.
- Props: none: every UiTableColumns.
- Guarantee: The list shows five columns and half of the sixth, so the cut says more wait below; the keys bring a column past the cut into view.
- Without it: A list cut on a row’s edge that looks finished while columns wait below it.
- Code: `<UiTableToolbar v-model:search="q" :columns="columns" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "a long list of columns is cut at five rows and a half"
- Pattern for all components: https://grani.arseni.work/patterns/finding#five-rows

### Letter jumps

- When: a table of five columns or fewer, where no search takes the letters.
- Props: none: every UiTableColumns.
- Guarantee: A letter goes to the first column that starts with it, and the same letter again to the next.
- Without it: Arrowing down the list one column at a time to reach the one you know by name.
- Code: `<UiTableToolbar v-model:search="q" :columns="columns" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "a letter goes to the column that starts with it, and the same letter again to the next"
- Pattern for all components: https://grani.arseni.work/patterns/finding#letter-jumps

### Reset held

- When: the panel is open and you hide or show the first column.
- Props: none.
- Guarantee: Reset and the hidden-column count, such as “2 hidden”, have a fixed place in the footer. Reset becomes available when column visibility differs from the default, without changing the panel’s layout.
- Without it: A Reset that appears only once a column is hidden, so the footer changes under the pointer.
- Code: `<UiTableToolbar v-model:search="query" :columns="cols" />`
- Your part: Nothing.
- Not covered: Reset returns to the columns hidden by default (`hiddenByDefault`), not to every column shown.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "a tick applies at once; the summary counts the hidden; Reset is held until something differs"
- Pattern for all components: https://grani.arseni.work/patterns/finding#reset-held

### Focus starts inside

- When: you open the columns panel.
- Props: none.
- Guarantee: Use the arrow keys to move between columns and Space to show or hide one. With six or more columns, focus starts in the search field instead, so you can find a column by name.
- Without it: The panel opens with keyboard focus left on its button, and you press Tab before you can turn a column on or off.
- Code: `<UiTableToolbar v-model:search="query" :columns="cols" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "opened, the focus goes to the list of columns", "opened on six columns or more, the focus goes to the search"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### Focus comes back

- When: you close the columns panel with Escape.
- Props: none.
- Guarantee: Focus returns to the columns button at the end of the toolbar, so you can continue through the toolbar with Tab.
- Without it: After Escape, keyboard focus drops to the start of the page, and you tab through the page again to reach the table.
- Code: `<UiTableToolbar v-model:search="query" :columns="cols" />`
- Your part: Nothing.
- Not covered: If the panel is closed by a click outside it, keyboard focus stays where the click put it.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "Escape closes the panel and returns the focus to the button"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back

### One Tab per group

- When: the columns panel is open.
- Props: none.
- Guarantee: Tab reaches the column list as one group, so you do not have to visit every column. Reset is the next available stop when the view differs from the default.
- Without it: Each column is its own checkbox, so a wide table costs a press of Tab per column.
- Code: `<UiTableToolbar v-model:search="query" :columns="cols" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTableColumns.spec.ts, not in the package): "the list is one tab stop, and Reset the next once something differs"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useTableColumns`, `useControlSize`, `useUiT`.
