// A column's key is a field of the row unless an accessor reads the value; vue-tsc runs these in
// `npm run typecheck`, and a rejection that stops being one is TS2578.
import type { DataTableColumn, TableColumn } from '../../types/ui'
import type UiDataTable from '../../components/UiDataTable.vue'

interface Order {
  id: number
  customer: string
  total: number
  placed: string
}

export const table: TableColumn<Order>[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total', align: 'end', sortable: true },
  // A computed column names itself; its value comes from the accessor.
  { key: 'initials', label: 'Initials', accessor: (o) => o.customer.slice(0, 2) },
  // @ts-expect-error a typo of a field: without an accessor the key must be a field of the row
  { key: 'custmer', label: 'Customer' },
  // @ts-expect-error a key that is no field needs an accessor to read its value
  { key: 'margin', label: 'Margin', format: String },
]

export const dataTable: DataTableColumn<Order>[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total', type: 'money' },
  { key: 'placed', label: 'Placed', type: 'date', variant: 'day' },
  { key: 'share', label: 'Share', type: 'progress', accessor: (o) => o.total / 100 },
  // @ts-expect-error a typo of a field in a typed column too
  { key: 'custmer', label: 'Customer', type: 'money' },
  // @ts-expect-error a money column has no `format`: the amount draws itself
  { key: 'total', label: 'Total', type: 'money', format: String },
]

// Untyped rows keep any key: a table of records of unknown shape still compiles.
export const loose: TableColumn[] = [{ key: 'anything', label: 'Anything' }]

type Slots = NonNullable<NonNullable<Parameters<typeof UiDataTable<Order>>[1]>['slots']>
type Has<K extends PropertyKey> = K extends keyof Slots ? true : false
// A cell and a footer are slots named by the key, typed through the template-literal families.
export const cellSlot: Has<'cell.customer'> = true
export const footerSlot: Has<'footer.total'> = true
// @ts-expect-error a slot outside the cell and footer families is not declared
export const strangerSlot: Has<'header.customer'> = true
