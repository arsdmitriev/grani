import { mount, type ComponentMountingOptions, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, shallowRef, type ComponentPublicInstance } from 'vue'
import type { ControlSize, DataTableColumn, SelectValue, TableSort } from '../types/ui'
import UiBadge from './UiBadge.vue'
import UiCopyButton from './UiCopyButton.vue'
import UiDataTable from './UiDataTable.vue'
import UiDateCell from './UiDateCell.vue'
import UiFilter from './UiFilter.vue'
import UiMoneyCell from './UiMoneyCell.vue'
import UiPagination from './UiPagination.vue'
import UiProgress from './UiProgress.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiTableToolbar from './UiTableToolbar.vue'
import { useTableColumns } from '../composables/useTableColumns'
import { useListAddress, type ListQuery } from '../composables/useListAddress'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises } from '@vue/test-utils'
import { RUSSIAN, withGrani } from '../test/harness'
import type { GraniOptions } from '../plugin'

interface Row {
  id: string
  client: string
  amount: number | null
  issued: string
  status: 'paid' | 'due'
  paid: number
}
const rows: Row[] = [
  { id: 'INV-1', client: 'Anna', amount: 10, issued: '2026-09-10', status: 'paid', paid: 100 },
  { id: 'INV-2', client: 'Boris', amount: null, issued: '2026-09-11', status: 'due', paid: 40 },
]
const columns: DataTableColumn<Row>[] = [
  { key: 'id', label: 'ID', type: 'copy' },
  { key: 'client', label: 'Client' },
  { key: 'amount', label: 'Amount', type: 'money', currency: 'EUR', tone: () => 'danger' },
  { key: 'issued', label: 'Issued', type: 'date' },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    format: (v) => String(v).toUpperCase(),
    tone: (r) => (r.status === 'paid' ? 'success' : 'warning'),
  },
  { key: 'paid', label: 'Paid', type: 'progress' },
]
const make = (
  props: Record<string, unknown> = {},
  slots: ComponentMountingOptions<typeof UiDataTable<Row>>['slots'] = {},
) => mount(UiDataTable<Row>, { props: { columns, items: rows, search: '', ...props }, slots })

describe('UiDataTable', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 8, 24, 12) }))
  afterEach(() => vi.useRealTimers())

  it('draws typed cells with the library cells and an empty value as a dash', () => {
    const w = make()
    expect(w.findComponent(UiCopyButton).props('value')).toBe('INV-1')
    const money = w.findAllComponents(UiMoneyCell)
    expect(money).toHaveLength(1)
    expect(money[0]!.props()).toMatchObject({ value: 10, currency: 'EUR', tone: 'danger' })
    expect(w.findAllComponents(UiDateCell)).toHaveLength(2)
    const badges = w.findAllComponents(UiBadge)
    expect(badges.map((b) => b.props('label'))).toEqual(['PAID', 'DUE'])
    expect(badges.map((b) => b.props('tone'))).toEqual(['success', 'warning'])
    expect(w.findAllComponents(UiProgress)[1]!.props()).toMatchObject({ value: 40, max: 100 })
    const second = w.findAll('tbody tr')[1]!.findAll('td')
    expect(second[2]!.text()).toBe('—')
    expect(second[1]!.text()).toBe('Boris')
  })

  it('a cell slot wins over the column type; text and footer slots reach the table', () => {
    const w = make(
      {},
      {
        'cell.amount': ({ row }: { row: Row }) => h('b', { class: 'own' }, `own ${row.id}`),
        'cell.client': ({ value }: { value: unknown }) => h('i', { class: 'txt' }, String(value)),
        'footer.amount': () => 'sum',
        'row-actions': () => h('button', { class: 'act' }, 'x'),
      },
    )
    expect(w.findAllComponents(UiMoneyCell)).toHaveLength(0)
    expect(w.find('.own').text()).toBe('own INV-1')
    expect(w.find('.txt').text()).toBe('Anna')
    expect(w.find('tfoot').text()).toBe('sum')
    expect(w.findAll('.act')).toHaveLength(2)
  })

  it('always has a toolbar with the search, and passes the search through after the pause', async () => {
    expect(make().findComponent(UiTableToolbar).exists()).toBe(true)
    expect(
      make({}, { actions: () => h('button', 'New') })
        .findComponent(UiTableToolbar)
        .exists(),
    ).toBe(true)
    const w = make({ search: '' })
    await w.find('input[type="search"]').setValue('ann')
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([['ann']])
  })

  it('shows the selection strip with the count, the bulk slot and a clear that empties the selection', async () => {
    const w = make(
      { selectable: true, selection: new Set(['INV-1', 'INV-2']), search: '' },
      { bulk: ({ count }: { count: number }) => h('button', { class: 'del' }, `delete ${count}`) },
    )
    expect(w.text()).toContain('2 selected')
    expect(w.find('.del').text()).toBe('delete 2')
    await w.find('button[aria-label="Clear selection"]').trigger('click')
    expect(w.emitted('update:selection')).toEqual([[new Set()]])
    expect(make({ selectable: true }).text()).not.toContain('selected')
    expect(w.findComponent(UiTableToolbar).attributes('inert')).toBeDefined()
    expect(w.findAll('[role="status"]').map((r) => r.text())).toContain('2 selected')
    expect(make({ search: '' }).findComponent(UiTableToolbar).attributes('inert')).toBeUndefined()
  })

  it('clearing the selection puts the focus on the page checkbox, not the search field', async () => {
    const w = mount(UiDataTable<Row>, {
      props: { columns, items: rows, selectable: true, selection: new Set(['INV-1']), search: '' },
      attachTo: document.body,
    })
    const clear = w.find('button[aria-label="Clear selection"]')
    ;(clear.element as HTMLElement).focus()
    await w.setProps({ selection: new Set() })
    await nextTick()
    expect(document.activeElement).toBe(w.find('thead input[type="checkbox"]').element)
    w.unmount()
  })

  it('a copy column shows the formatted text and copies the raw value', () => {
    const w = make({
      columns: [{ key: 'id', label: 'ID', type: 'copy', format: (v: unknown) => `#${v}` }],
    })
    const copy = w.findComponent(UiCopyButton)
    expect(copy.props('value')).toBe('INV-1')
    expect(copy.props('label')).toBe('#INV-1')
  })

  it('a copy column button is named Copy plus its text', () => {
    const w = make({
      columns: [{ key: 'id', label: 'ID', type: 'copy', format: (v: unknown) => `#${v}` }],
    })
    expect(w.findComponent(UiCopyButton).find('button').attributes('aria-label')).toBe(
      'Copy #INV-1',
    )
  })

  it('a copy column cut to a few characters is named by the text it shows', () => {
    const w = make({
      columns: [{ key: 'id', label: 'ID', type: 'copy', chars: 6 }],
      items: [{ ...rows[0]!, id: 'INV-2040-0613-ACME' }],
    })
    const button = w.findComponent(UiCopyButton).find('button')
    // The name holds the words a person sees, so a voice command that says them reaches it.
    expect(button.attributes('aria-label')).toContain(button.text())
  })

  it('the footer says the range and pages the list; no total, no footer', async () => {
    const w = make({ total: 128, page: 2, pageSize: 25 })
    expect(w.text()).toContain('26–50 of 128')
    expect(make({ total: 30, page: 5, pageSize: 25 }).text()).toContain('26–30 of 30')
    expect(make({ total: 30, page: 1, pageSize: 0 }).text()).toContain('1–30 of 30')
    const pagination = w.findComponent(UiPagination)
    expect(pagination.props()).toMatchObject({ page: 2, pageSize: 25, total: 128 })
    await pagination.findAll('button')[0]!.trigger('click')
    expect(w.emitted('update:page')).toEqual([[1]])
    expect(make({ total: 2, pageSize: 25 }).findComponent(UiPagination).html()).toBe('<!--v-if-->')
    expect(make().text()).not.toContain(' of ')
  })

  // What a search, a filter or a page brought is said once the rows are in, the same words the
  // footer shows; nothing while they load.
  it('the range is said after each load, and nothing while one runs', async () => {
    const rangeSaid = (w: ReturnType<typeof mount>) => w.find('[role="status"][data-range]').text()
    const w = make({ total: 57, page: 1, pageSize: 10, loading: true })
    await vi.advanceTimersByTimeAsync(120)
    expect(rangeSaid(w)).toBe('')
    await w.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(120)
    expect(rangeSaid(w)).toBe('1–10 of 57')
    await w.setProps({ loading: true })
    await vi.advanceTimersByTimeAsync(120)
    expect(rangeSaid(w)).toBe('')
    await w.setProps({ loading: false, total: 12 })
    await vi.advanceTimersByTimeAsync(120)
    expect(rangeSaid(w)).toBe('1–10 of 12')
  })

  it('a failed load says no range: its plate says what happened', async () => {
    const rangeSaid = (w: ReturnType<typeof mount>) => w.find('[role="status"][data-range]').text()
    const w = make({ total: 57, page: 1, pageSize: 10, loading: true })
    await w.setProps({ loading: false, error: 'The server did not answer' })
    await vi.advanceTimersByTimeAsync(120)
    expect(rangeSaid(w)).toBe('')
  })

  it('forwards sort, row click and retry from the table', async () => {
    const w = make({ clickable: true, items: [], error: 'Down' })
    await w.find('tbody button').trigger('click')
    expect(w.emitted('retry')).toEqual([[]])
    const live = make({
      clickable: true,
      columns: [{ key: 'client', label: 'Client', sortable: true }],
    })
    await live.find('th button').trigger('click')
    expect(live.emitted('update:sort')).toEqual([[{ key: 'client', dir: 'asc' }]])
    await live.find('tbody tr').trigger('click')
    expect(live.emitted('row-click')![0]![0]).toEqual(rows[0])
  })
})

describe('UiDataTable — progress column follow-ups', () => {
  it('a progress column without step passes its tone to the bar', () => {
    const w = mount(UiDataTable, {
      props: {
        columns: [{ key: 'done', label: 'Done', type: 'progress', tone: 'success' }],
        items: [{ id: 1, done: 40 }],
        search: '',
      },
    })
    expect(w.findComponent(UiProgress).props('tone')).toBe('success')
  })

  it('a progress cell with no value is the empty-cell dash, never a bar at 0', () => {
    const w = mount(UiDataTable, {
      props: {
        columns: [{ key: 'done', label: 'Done', type: 'progress' }],
        items: [{ id: 1, done: null }],
        search: '',
      },
    })
    // No value is no bar at 0: either the empty-cell dash or a bar that says no number.
    expect(w.find('[role="progressbar"][aria-valuenow="0"]').exists()).toBe(false)
  })

  it("a 'progress' column renders a bar with a height, named by the column", () => {
    const bar = make().findAllComponents(UiProgress)[0]!
    expect(bar.classes()).toContain('h-1.5')
    expect(bar.attributes('aria-label')).toBe('Paid')
  })

  it('a money column aligns to the end by itself; align start keeps it at the start', () => {
    type Money = { id: number; total: number; left: number }
    const w = mount(UiDataTable<Money>, {
      props: {
        columns: [
          { key: 'total', label: 'Total', type: 'money', currency: 'EUR' },
          { key: 'left', label: 'Left', type: 'money', currency: 'EUR', align: 'start' },
        ],
        items: [{ id: 1, total: 10, left: 5 }],
        search: '',
      },
    })
    const heads = w.findAll('thead th')
    const total = heads.find((h) => h.text().includes('Total'))!
    const left = heads.find((h) => h.text().includes('Left'))!
    expect(total.classes()).toEqual(expect.arrayContaining(['text-end', 'tabular-nums']))
    expect(left.classes()).toContain('text-start')
    const cells = w.findAll('tbody td')
    expect(cells[0]!.classes()).toContain('text-end')
    expect(cells[1]!.classes()).toContain('text-start')
  })
})

describe('UiDataTable — review follow-ups', () => {
  it("a caller's aria-label reaches the table and names its page checkbox; class stays on the card", () => {
    const w = mount(UiDataTable<Row>, {
      props: { columns, items: rows, selectable: true, search: '' },
      attrs: { 'aria-label': 'Invoices', class: 'w-full' },
    })
    expect(w.find('table').attributes('aria-label')).toBe('Invoices')
    expect(w.find('thead input[type="checkbox"], thead [role="checkbox"]').exists()).toBe(true)
    expect(w.html()).toContain('Select all on this page of Invoices')
    expect(w.element.classList.contains('w-full')).toBe(true)
    expect(w.element.getAttribute('aria-label')).toBeNull()
  })

  it("names its pages after the table's aria-label, so two blocks on a page tell apart", () => {
    const named = mount(UiDataTable<Row>, {
      props: { columns, items: rows, total: 57, pageSize: 10, search: '' },
      attrs: { 'aria-label': 'Invoices' },
    })
    expect(named.find('nav').attributes('aria-label')).toBe('Pages of Invoices')
    const bare = mount(UiDataTable<Row>, {
      props: { columns, items: rows, total: 57, pageSize: 10, search: '' },
    })
    expect(bare.find('nav').attributes('aria-label')).toBe('Pagination')
  })

  it('columns given as the menu state draw the visible ones and put the button in the toolbar', async () => {
    const state = useTableColumns('block-spec', columns, { hiddenByDefault: ['amount'] })
    const w = mount(UiDataTable<Row>, {
      props: { columns: state, items: rows, search: '' },
    })
    expect(w.find('button[aria-haspopup], button[aria-expanded]').exists()).toBe(true)
    const heads = () => w.findAll('thead th').map((th) => th.text())
    expect(heads()).not.toContain('Amount')
    state.toggle('amount')
    await w.vm.$nextTick()
    expect(heads()).toContain('Amount')
    expect(
      mount(UiDataTable<Row>, { props: { columns, items: rows, search: '' } })
        .find('button[aria-haspopup], button[aria-expanded]')
        .exists(),
    ).toBe(false)
  })

  it('a typed column keeps its type when the columns come as the menu state', () => {
    const typedCols: DataTableColumn<Row>[] = [
      { key: 'id', label: 'Number' },
      { key: 'amount', label: 'Amount', type: 'money', currency: 'EUR' },
    ]
    const state = useTableColumns('block-spec-typed', typedCols)
    const w = mount(UiDataTable<Row>, {
      props: { columns: state, items: rows, search: '' },
    })
    expect(w.findAllComponents(UiMoneyCell)).toHaveLength(1)
  })

  it('forwards size to the toolbar row and to the filters and actions slots', () => {
    const seen: unknown[] = []
    const w = mount(UiDataTable<Row>, {
      props: { columns, items: rows, search: '', size: 'md' },
      slots: {
        filters: (p: unknown) => (seen.push(p), h('i')),
        actions: (p: unknown) => (seen.push(p), h('b')),
      },
    })
    const toolbar: VueWrapper<ComponentPublicInstance<{ size?: ControlSize }>> =
      w.findComponent(UiTableToolbar)
    expect(toolbar.props('size')).toBe('md')
    expect(seen).toEqual([{ size: 'md' }, { size: 'md' }])
  })

  it('a non-empty search with zero rows still says "nothing matches" even if the host forgot to fold search into filtered', () => {
    const w = mount(UiDataTable<Row>, {
      props: { columns, items: [], search: 'zzz' },
    })
    expect(w.text()).toContain('No matching records')
    const plain = mount(UiDataTable<Row>, {
      props: { columns, items: [], search: '' },
    })
    expect(plain.text()).toContain('No records yet')
  })
})

describe('UiDataTable — pages, the footer and the empty search', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ ...rows[0]!, id: `INV-${i + 1}` }))

  it('a page beyond the last asks for the last one once the list is not loading', async () => {
    const w = make({ total: 57, page: 7, pageSize: 10, loading: true })
    expect(w.emitted('update:page')).toBeUndefined()
    await w.setProps({ loading: false })
    expect(w.emitted('update:page')).toEqual([[6]])
    await w.setProps({ total: 41 })
    expect(w.emitted('update:page')!.at(-1)).toEqual([5])
  })

  it('a page given as a string is one page for the count and the pager alike', () => {
    const w = make({ total: 57, page: '3', pageSize: 10, items: many.slice(0, 10) })
    expect(w.text()).toContain('21–30')
    expect(w.find('nav [aria-current="page"]').text()).toBe('3')
  })

  it('removing the last row of the last page lands on the page before', async () => {
    const w = make({ total: 21, page: 3, pageSize: 10 })
    expect(w.emitted('update:page')).toBeUndefined()
    await w.setProps({ total: 20, items: [] })
    expect(w.emitted('update:page')).toEqual([[2]])
  })

  it('a new search or sort asks for page one', async () => {
    vi.useFakeTimers()
    const w = make({
      search: '',
      page: 3,
      total: 57,
      pageSize: 10,
      columns: [{ key: 'client', label: 'Client', sortable: true }],
    })
    await w.find('input[type="search"]').setValue('ann')
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([['ann']])
    expect(w.emitted('update:page')).toEqual([[1]])
    await w.find('th button').trigger('click')
    expect(w.emitted('update:page')).toEqual([[1], [1]])
  })

  it('a total not yet known leaves a linked page alone', async () => {
    const w = make({ page: 3, pageSize: 10, items: [] })
    expect(w.emitted('update:page')).toBeUndefined()
    await w.setProps({ total: 57, items: rows })
    expect(w.emitted('update:page')).toBeUndefined()
  })

  it('an unreadable page reads as the first in the range', () => {
    const w = make({ total: 57, page: Number.NaN, pageSize: 10 })
    expect(w.text()).toContain('1–10 of 57')
    expect(w.emitted('update:page')).toEqual([[1]])
  })

  it('holds the footer while the first page loads, so nothing moves when the total arrives', async () => {
    const w = make({ items: [], loading: true, pageSize: 10 })
    const footer = () => w.findAll('.border-t').at(-1)!
    expect(footer().findAllComponents(UiSkeleton)).toHaveLength(2)
    await w.setProps({ items: rows, loading: false, total: 57 })
    expect(w.text()).toContain('1–10 of 57')
  })

  it('the first-load skeleton has a sane row count for a zero or a huge page size', () => {
    const count = (pageSize: number) =>
      make({ items: [], loading: true, pageSize }).findAll('tbody tr').length
    // A zero page size falls back to five rows, raised to the floor a short page stands on too.
    expect(count(0)).toBe(Math.max(5, count(3)))
    expect(count(500)).toBe(25)
    expect(count(10)).toBe(10)
  })

  it('Shift with a second row checkbox passes the whole range up through the block', async () => {
    const w = make({ items: many.slice(0, 5), selectable: true, selection: new Set() })
    // A press on a row's checkbox: the cell hears the Shift first, then the box changes.
    async function press(i: number, shiftKey = false) {
      const cell = w.findAll('tbody tr')[i]!.find('td')
      await cell.trigger('click', { shiftKey, detail: 1 })
      const box = cell.find('input[type="checkbox"]')
      await box.setValue(!(box.element as HTMLInputElement).checked)
      const sets = w.emitted('update:selection') as Set<string>[][]
      await w.setProps({ selection: sets.at(-1)![0] })
    }
    await press(0)
    await press(3, true)
    const sets = w.emitted('update:selection') as Set<string>[][]
    expect([...sets.at(-1)![0]!]).toEqual(['INV-1', 'INV-2', 'INV-3', 'INV-4'])
  })

  it('the bulk slot gets the count, the selection and the size; the pager and the clear take the size', () => {
    let scope: Record<string, unknown> = {}
    const w = make(
      { selectable: true, selection: new Set(['INV-1']), total: 57, pageSize: 10, size: 'md' },
      { bulk: (s: Record<string, unknown>) => ((scope = s), h('button', 'Delete')) },
    )
    expect(scope.count).toBe(1)
    expect([...(scope.selection as Set<string>)]).toEqual(['INV-1'])
    expect(scope.size).toBe('md')
    expect(w.findComponent(UiPagination).props('size')).toBe('md')
    expect(w.find('button[aria-label="Clear selection"]').classes()).toContain('h-11')
  })

  it('a search with no match offers to clear it, and the press asks for an empty search', async () => {
    const w = make({ items: [], search: 'zzz', page: 2, total: 0 })
    expect(w.text()).toContain('No matching records')
    const clear = w.findAll('button').find((b) => b.text() === 'Clear search')!
    await clear.trigger('click')
    expect(w.emitted('update:search')).toEqual([['']])
    expect(w.emitted('update:page')!.at(-1)).toEqual([1])
    expect(make({ items: [], search: '' }).text()).not.toContain('Clear search')
  })
})

describe('UiDataTable — filters', () => {
  it('a filter that matches nothing offers to reset it, and the offer follows filtered', async () => {
    const reset = vi.fn()
    const w = make({ items: [], search: '', filtered: true, onResetFilters: reset })
    const button = w.findAll('button').find((b) => b.text() === 'Reset filters')!
    await button.trigger('click')
    expect(reset).toHaveBeenCalledTimes(1)
    await w.setProps({ filtered: false })
    expect(w.text()).not.toContain('Reset filters')
    await w.setProps({ filtered: true })
    expect(w.text()).toContain('Reset filters')
  })

  it('a search and a filter both set offer both ways back', () => {
    const w = make({ items: [], search: 'zzz', filtered: true, onResetFilters: () => {} })
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toContain('Clear search')
    expect(labels).toContain('Reset filters')
  })
})

// No empty list is a dead end: the table's own ways back stay, and the app's next step stands beside
// them, or alone under "No records yet", which the table cannot offer for the app.
describe('UiDataTable — the next step of an empty list', () => {
  const action = (scope: { searched: boolean; filtered: boolean }) =>
    h(
      'button',
      { type: 'button', 'data-app': '' },
      scope.searched ? 'Create this client' : 'New invoice',
    )

  it("a search with no match keeps Clear search and Reset filters, and the app's action stands beside them", () => {
    const w = make(
      { items: [], search: 'Acme', filtered: true, onResetFilters: () => {} },
      { 'empty-actions': action },
    )
    expect(w.text()).toContain('No matching records')
    const labels = w.findAll('button').map((b) => b.text())
    expect(labels).toEqual(
      expect.arrayContaining(['Clear search', 'Reset filters', 'Create this client']),
    )
    expect(labels.indexOf('Create this client')).toBeGreaterThan(labels.indexOf('Reset filters'))
  })

  it("a list with no records yet says so and offers the app's action under its words", () => {
    const w = make({ items: [], search: '', total: 0 }, { 'empty-actions': action })
    expect(w.text()).toContain('No records yet')
    expect(w.find('[data-app]').text()).toBe('New invoice')
  })

  it('without an action of the app, no records yet is the words alone, as before', () => {
    const w = make({ items: [], search: '', total: 0 })
    expect(w.text()).toContain('No records yet')
    expect(w.find('[data-app]').exists()).toBe(false)
  })
})

describe('UiDataTable — a search of spaces', () => {
  it('a whitespace-only search still offers to clear it', () => {
    const w = make({ items: [], search: ' ', total: 0 })
    expect(w.findAll('button').some((b) => b.text() === 'Clear search')).toBe(true)
  })
})

describe('UiDataTable — the search name', () => {
  it('an unnamed search takes the table name, so two lists keep their searches apart', () => {
    const named = mount(UiDataTable<Row>, {
      props: { columns, items: rows, search: '', 'aria-label': 'Invoices' },
    })
    expect(named.find('[role="search"]').attributes('aria-label')).toBe('Search Invoices')
    expect(named.find('input[type="search"]').attributes('placeholder')).toBe('Search Invoices')
    const own = mount(UiDataTable<Row>, {
      props: { columns, items: rows, search: '', searchPlaceholder: 'Find an invoice' },
      attrs: { 'aria-label': 'Invoices' },
    })
    expect(own.find('[role="search"]').attributes('aria-label')).toBe('Find an invoice')
    expect(make().find('[role="search"]').attributes('aria-label')).toBe('Search')
  })
})

describe('UiDataTable — review follow-ups, a page not whole', () => {
  it('a page in range but not whole goes back to the app as the page the pager shows', async () => {
    const w = mount(UiDataTable, {
      props: { columns: [], items: [], page: 2.5, pageSize: 10, total: 100, search: '' },
    })
    await nextTick()
    expect(w.emitted('update:page')).toEqual([[2]])
  })
})

describe('UiDataTable — a long list without pagination', () => {
  // One plain column: the cost of rendering hundreds of rows in the suite is the cells', not the
  // warning's; a text column keeps this describe's own mounts fast.
  const plain: DataTableColumn<Row>[] = [{ key: 'id', label: 'ID' }]
  // 501, not a round number: proves the actual count is not the one the warning carries.
  const many = Array.from({ length: 501 }, (_, i) => ({ ...rows[0]!, id: `INV-${i + 1}` }))

  it('more than 500 rows with no `total` warns once in dev, carrying no values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiDataTable<Row>, { props: { columns: plain, items: many, search: '' } })
    const said = warn.mock.calls.filter((c) => String(c[0]).includes('UiDataTable'))
    expect(said).toHaveLength(1)
    expect(String(said[0]![0])).not.toContain('501')
    // Still mounted with the same props: a second render (a sort, a prop set) does not warn again.
    w.vm.$forceUpdate()
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('UiDataTable'))).toHaveLength(1)
    warn.mockRestore()
  })

  it('500 rows or fewer, or a `total` wired up, does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiDataTable<Row>, {
      props: { columns: plain, items: many.slice(0, 500), search: '' },
    })
    mount(UiDataTable<Row>, {
      props: { columns: plain, items: many, search: '', total: many.length, pageSize: 10 },
    })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('UiDataTable'))).toBe(false)
    warn.mockRestore()
  })
})

describe('UiDataTable — a list still while it loads', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 8, 24, 12) }))
  afterEach(() => vi.useRealTimers())

  const skeletonRows = (w: ReturnType<typeof mount>) => w.findAll('tbody[aria-busy="true"] tr')
  const many = Array.from({ length: 12 }, (_, i) => ({ ...rows[0]!, id: `INV-${i + 10}` }))

  it('while a search is out, the field keeps the focus and the typing, and draws no spinner', async () => {
    const w = mount(UiDataTable<Row>, {
      attachTo: document.body,
      props: { columns, items: rows, search: 'an', loading: false },
    })
    const field = w.find<HTMLInputElement>('input[type="search"]')
    field.element.focus()
    await w.setProps({ search: 'ann', loading: true })
    expect(document.activeElement).toBe(field.element)
    expect(field.attributes('disabled')).toBeUndefined()
    expect(field.attributes('readonly')).toBeUndefined()
    expect(field.attributes('aria-busy')).toBeUndefined()
    expect(w.findComponent(UiTableToolbar).find('.ui-spinner').exists()).toBe(false)
    await field.setValue('anna')
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([['anna']])
    w.unmount()
  })

  it('a new search draws skeleton rows at once, in place of the rows of the last answer', async () => {
    const w = make({ search: '', loading: false })
    await w.setProps({ search: 'an', loading: true })
    expect(w.findAllComponents(UiSkeleton).length).toBeGreaterThan(0)
    expect(w.findAll('tbody:not([aria-busy]) tr')).toHaveLength(0)
    expect(skeletonRows(w).length).toBeGreaterThanOrEqual(rows.length)
  })

  it('a space added to the search is a new search too: skeleton rows, not dimmed ones', async () => {
    const w = make({ search: 'an', loading: false })
    await w.setProps({ search: 'an ', loading: true })
    expect(skeletonRows(w).length).toBeGreaterThan(0)
    expect(w.find('tbody.opacity-60').exists()).toBe(false)
  })

  it('a sort or a page of the same search keeps the rows in place, dimmed', async () => {
    const w = make({ search: 'an', loading: false })
    await w.setProps({ loading: true })
    const body = w.find('tbody')
    expect(body.classes()).toContain('opacity-60')
    expect(body.findAll('tr')).toHaveLength(rows.length)
    expect(w.findAllComponents(UiSkeleton)).toHaveLength(0)
  })

  it('after an answer of nothing, the next search draws skeleton rows too', async () => {
    const w = make({ search: 'zz', items: [], loading: false })
    await w.setProps({ search: 'zzz', loading: true })
    expect(skeletonRows(w).length).toBeGreaterThan(0)
  })

  it('the skeleton holds as many rows as were in view, and never fewer than the floor', async () => {
    const tall = make({ search: '', items: many, loading: false })
    await tall.setProps({ search: 'an', loading: true })
    expect(skeletonRows(tall)).toHaveLength(many.length)
    const short = make({ search: '', loading: false })
    await short.setProps({ search: 'an', loading: true })
    const empty = make({ search: 'zz', items: [], loading: false })
    await empty.setProps({ search: 'zzz', loading: true })
    // Two rows in view and an empty answer both rise to the floor: the same skeleton.
    expect(skeletonRows(short).length).toBe(skeletonRows(empty).length)
    expect(skeletonRows(short).length).toBeGreaterThan(rows.length)
  })

  it('a failed new search shows the plate with Retry, not the rows of the last answer; Retry brings the skeleton', async () => {
    const w = make({ search: '', loading: false })
    await w.setProps({ search: 'an', loading: true })
    await w.setProps({ loading: false, error: 'The server did not answer.' })
    expect(w.find('[role="alert"]').text()).toContain('The server did not answer.')
    expect(w.text()).not.toContain('Anna')
    await w.find('tbody button').trigger('click')
    expect(w.emitted('retry')).toEqual([[]])
    await w.setProps({ loading: true })
    expect(skeletonRows(w).length).toBeGreaterThan(0)
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('the empty answer and the failed load stand on the floor the skeleton fills', () => {
    const empty = make({ search: 'zz', items: [] })
    const failed = make({ items: [], error: 'The server did not answer.' })
    for (const w of [empty, failed]) {
      const height = /height: (\d+(?:\.\d+)?)px/.exec(w.find('tbody td').attributes('style') ?? '')
      expect(Number(height?.[1])).toBeGreaterThanOrEqual(18 * 16)
    }
  })
})

describe('UiDataTable — hydrated over a page with its own root font size', () => {
  // The server has no page to measure and reads 16px; the browser's root may be larger (a person's
  // own default font). The floor is measured once mounted, so the first render agrees with the
  // server's and hydration finds what it drew.
  it('an empty answer drawn on the server hydrates without a mismatch at a 20px root', async () => {
    const { createSSRApp } = await import('vue')
    const { renderToString } = await import('vue/server-renderer')
    const App = {
      render: () =>
        h(UiDataTable, {
          ariaLabel: 'Invoices',
          columns: [{ key: 'id', label: 'Invoice' }],
          items: [],
          total: 0,
          search: '',
          rowLabel: (r) => String(r.id),
        }),
    }
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    let html: string
    try {
      html = await renderToString(createSSRApp(App))
    } finally {
      vi.unstubAllGlobals()
    }
    document.documentElement.style.fontSize = '20px'
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createSSRApp(App)
    // The floor is drawn as a height on the empty answer's cell.
    expect(html).toMatch(/height:\s*\d+px/)
    try {
      app.mount(root)
      await nextTick()
      const said = [...warn.mock.calls, ...error.mock.calls]
        .map((c) => String(c[0]))
        .filter((t) => /hydration/i.test(t))
      expect(said).toEqual([])
    } finally {
      app.unmount()
      warn.mockRestore()
      error.mockRestore()
      document.documentElement.style.fontSize = ''
      root.remove()
    }
  })
})

// A UiFilter in `#filters` tells the table what the person does to it: a change of the choice starts
// the list on page one, as a new search does, and an empty list it narrowed offers to reset it.
describe('UiDataTable — the filters in #filters', () => {
  const STATUSES = [
    { value: 'paid', label: 'Paid' },
    { value: 'due', label: 'Due' },
    { value: 'overdue', label: 'Overdue' },
  ]
  const withFilter = (props: Record<string, unknown>, status: { value: SelectValue[] }) => {
    const pick = vi.fn((v: SelectValue[]) => (status.value = v))
    const w = mount(UiDataTable<Row>, {
      props: { columns, items: rows, search: '', page: 3, total: 57, pageSize: 10, ...props },
      slots: {
        filters: () =>
          h(UiFilter, {
            label: 'Status',
            items: STATUSES,
            modelValue: status.value,
            'onUpdate:modelValue': pick,
          }),
      },
      attachTo: document.body,
    })
    return { w, pick }
  }

  it("a person's change of a filter asks for page one; a filter set from outside does not", async () => {
    const status = ref<SelectValue[]>(['paid'])
    const { w } = withFilter({}, status)
    await nextTick()
    status.value = ['due']
    await nextTick()
    expect(w.emitted('update:page')).toBeUndefined()
    await w
      .findAll('button')
      .find((b) => b.text().includes('Status'))!
      .trigger('click')
    await w.findAll('[role="option"]')[2]!.trigger('click')
    expect(w.emitted('update:page')).toEqual([[1]])
    await w.setProps({ page: 3 })
    await w
      .findAll('button')
      .find((b) => b.text() === 'Reset')!
      .trigger('click')
    expect(w.emitted('update:page')).toEqual([[1], [1]])
    w.unmount()
  })

  it('a filter chosen in #filters makes an empty list offer Reset filters, which clears it', async () => {
    const status = ref<SelectValue[]>(['paid'])
    const { w, pick } = withFilter({ items: [], total: 0, page: 1 }, status)
    await nextTick()
    const reset = w.findAll('button').find((b) => b.text() === 'Reset filters')
    expect(reset).toBeDefined()
    await reset!.trigger('click')
    expect(pick).toHaveBeenCalledWith([])
    expect(w.emitted('reset-filters')).toEqual([[]])
    w.unmount()
  })
})

// The view kept by useListAddress: the table opens on the address's search and page, and what the
// person types goes back to the address.
describe('UiDataTable — the view in the address', () => {
  it('a view kept in the address opens on its search and page, and a typed search is written back in place', async () => {
    vi.useFakeTimers()
    const currentRoute = shallowRef({ query: { search: 'ann', page: '2' } as ListQuery, hash: '' })
    const steps: [string, ListQuery][] = []
    const go = (how: string) => (to: { query: ListQuery }) => {
      steps.push([how, to.query])
      currentRoute.value = { query: to.query, hash: '' }
    }
    const $router = { currentRoute, push: go('push'), replace: go('replace') }
    const w = mount(
      defineComponent({
        setup() {
          const view = useListAddress()
          return () =>
            h(UiDataTable<Row>, {
              columns,
              items: rows,
              total: 57,
              pageSize: 10,
              search: view.search,
              page: view.page,
              'onUpdate:search': (v: string) => (view.search = v),
              'onUpdate:page': (v: number) => (view.page = v),
            })
        },
      }),
      { global: { config: { globalProperties: { $router } as never } } },
    )
    const field = w.find('input[type="search"]')
    expect((field.element as HTMLInputElement).value).toBe('ann')
    expect(w.text()).toContain('11–20 of 57')
    await field.setValue('anna')
    vi.advanceTimersByTime(250)
    await nextTick()
    expect(steps).toEqual([['replace', { search: 'anna' }]])
    vi.useRealTimers()
  })
})

describe('UiDataTable — a linked page past the last', () => {
  it('a page past the last, from the address, is corrected in place, so Back leaves it', async () => {
    const r = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p', component: defineComponent({ render: () => h('i') }) }],
    })
    await r.push('/start')
    await r.push('/a?page=9')
    mount(
      defineComponent({
        setup() {
          const view = useListAddress()
          return () =>
            h(UiDataTable<Row>, {
              columns,
              items: rows,
              total: 5,
              pageSize: 10,
              search: '',
              page: view.page,
              'onUpdate:page': (v: number) => (view.page = v),
            })
        },
      }),
      { global: { plugins: [r] } },
    )
    await flushPromises()
    expect(r.currentRoute.value.fullPath).toBe('/a')
    r.back()
    await flushPromises()
    expect(r.currentRoute.value.fullPath).toBe('/start')
  })
})

describe('UiDataTable — review follow-ups', () => {
  const ids = Array.from({ length: 1234 }, (_, i) => `r${i}`)
  const big = (options: GraniOptions, props: Record<string, unknown> = {}) =>
    mount(UiDataTable<Row>, {
      props: {
        columns,
        items: rows,
        search: '',
        total: 1234567,
        page: 3,
        pageSize: 25,
        selectable: true,
        selection: new Set(ids),
        ...props,
      },
      global: { plugins: withGrani(options) },
    })
  const group = (locale: string, value: number) => new Intl.NumberFormat(locale).format(value)

  it('writes the footer range in the digits of the language', () => {
    for (const [options, locale] of [
      [{}, 'en'],
      [RUSSIAN, 'ru'],
    ] as const) {
      const footer = big(options)
        .findAll('span')
        .find((s) => s.text().startsWith('51–75'))
      expect(footer?.text()).toContain(group(locale, 1234567))
    }
  })

  it('writes the selection count in the digits of the language', () => {
    for (const [options, locale] of [
      [{}, 'en'],
      [RUSSIAN, 'ru'],
    ] as const) {
      const strip = big(options).find('[role="status"]')
      expect(strip.text()).toContain(group(locale, 1234))
      expect(strip.text()).not.toContain('1234')
    }
  })

  it('the range said after a load groups its digits too', async () => {
    vi.useFakeTimers()
    const w = big({}, { selection: new Set(), loading: true })
    await w.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(120)
    expect(w.find('[role="status"][data-range]').text()).toBe('51–75 of 1,234,567')
  })

  it('a sort on a column the person hid is told in a line above the table', async () => {
    const sortable = columns.map((c) => ({ ...c, sortable: true }))
    const state = useTableColumns('hidden-sort-spec', sortable)
    const w = mount(UiDataTable<Row>, {
      props: { columns: state, items: rows, search: '', sort: { key: 'amount', dir: 'desc' } },
    })
    const said = () => w.findAll('p').filter((p) => p.text().startsWith('Sorted by'))
    // Shown, its own header carries the sign.
    expect(said()).toHaveLength(0)
    expect(w.find('th[aria-sort="descending"]').text()).toBe('Amount')
    state.toggle('amount')
    await nextTick()
    expect(said().map((p) => p.text())).toEqual(['Sorted by Amount, descending'])
    await w.setProps({ sort: { key: 'amount', dir: 'asc' } })
    expect(said().map((p) => p.text())).toEqual(['Sorted by Amount, ascending'])
    // A column in view, no sort, and a key that is no column of the table: nothing to tell.
    const quiet: TableSort[] = [{ key: 'client', dir: 'asc' }, null, { key: 'created', dir: 'asc' }]
    for (const sort of quiet) {
      await w.setProps({ sort })
      expect(said(), JSON.stringify(sort)).toHaveLength(0)
    }
    state.reset()
  })
})

describe('UiDataTable — review follow-ups, an empty list is said once', () => {
  const live = (w: ReturnType<typeof mount>, words: string) =>
    w.findAll('[role="status"]').filter((r) => r.text().includes(words))

  it('nothing matches: one live region has the words, with Clear search beside them', async () => {
    vi.useFakeTimers()
    const w = make({ items: [], search: 'zz' })
    await vi.advanceTimersByTimeAsync(120)
    expect(live(w, 'No matching records')).toHaveLength(1)
    expect(w.find('tbody').text()).toContain('Clear search')
  })

  it('no records yet, with a step of the app: one live region has the words', async () => {
    vi.useFakeTimers()
    const w = make(
      { items: [], search: '', total: 0 },
      { 'empty-actions': () => h('button', 'New invoice') },
    )
    await vi.advanceTimersByTimeAsync(120)
    expect(live(w, 'No records yet')).toHaveLength(1)
    expect(w.find('tbody').text()).toContain('New invoice')
  })
})
