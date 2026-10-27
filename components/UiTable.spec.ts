import { flushPromises, mount, type ComponentMountingOptions } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, reactive, ref } from 'vue'
import type { TableColumn } from '../types/ui'
import UiCheckbox from './UiCheckbox.vue'
import UiTable from './UiTable.vue'
import UiTruncate from './UiTruncate.vue'
import UiNoData from './UiNoData.vue'

interface Row {
  id: number
  name: string
  amount: number | null
  owner?: { name: string }
}

const rows: Row[] = [
  { id: 1, name: 'Anna', amount: 10, owner: { name: 'Ops' } },
  { id: 2, name: 'Boris', amount: null, owner: { name: 'Sales' } },
  { id: 3, name: 'Clara', amount: 300 },
]
const columns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    align: 'end',
    sortable: true,
    defaultSortDir: 'desc',
    format: (v) => `${v} EUR`,
  },
  { key: 'owner', label: 'Owner', accessor: (r) => r.owner?.name },
]

const make = (
  props: Record<string, unknown> = {},
  slots: ComponentMountingOptions<typeof UiTable<Row>>['slots'] = {},
  attrs: Record<string, unknown> = {},
) =>
  mount(UiTable<Row>, {
    props: { columns, items: rows, ...props },
    slots,
    attrs,
  })
// The status region is drawn empty and takes its words a beat after it mounts.
const beat = () => new Promise((r) => setTimeout(r, 60)).then(() => nextTick())
const cells = (w: ReturnType<typeof mount>, i: number) =>
  w
    .findAll('tbody tr')
    [i]!.findAll('td')
    .map((td) => td.text())

describe('UiTable', () => {
  it('renders headers and values: format, accessor, a dash for an empty value', () => {
    const w = make()
    expect(w.findAll('th').map((th) => th.text())).toEqual(['Name', 'Amount', 'Owner'])
    expect(cells(w, 0)).toEqual(['Anna', '10 EUR', 'Ops'])
    expect(cells(w, 1)).toEqual(['Boris', '—', 'Sales'])
    expect(cells(w, 2)).toEqual(['Clara', '300 EUR', '—'])
    expect(w.findAll('tbody td')[1]!.classes()).toContain('text-end')
  })

  it('a cell slot replaces the text and receives the row and the value', () => {
    const w = make(
      {},
      {
        'cell.name': ({ row, value }: { row: Row; value: unknown }) => h('b', `${value}#${row.id}`),
      },
    )
    expect(cells(w, 0)[0]).toBe('Anna#1')
  })

  it('a sortable header cycles first direction, the other one, then none; aria-sort follows', async () => {
    const w = make()
    const [name, amount, owner] = w.findAll('th')
    expect(owner!.find('button').exists()).toBe(false)
    expect(owner!.attributes('aria-sort')).toBeUndefined()
    expect(name!.attributes('aria-sort')).toBe('none')
    await name!.find('button').trigger('click')
    expect(w.emitted('update:sort')).toEqual([[{ key: 'name', dir: 'asc' }]])
    await amount!.find('button').trigger('click')
    expect(w.emitted('update:sort')![1]).toEqual([{ key: 'amount', dir: 'desc' }])

    const asc = make({ sort: { key: 'name', dir: 'asc' } })
    expect(asc.findAll('th')[0]!.attributes('aria-sort')).toBe('ascending')
    await asc.find('th button').trigger('click')
    expect(asc.emitted('update:sort')).toEqual([[{ key: 'name', dir: 'desc' }]])

    const desc = make({ sort: { key: 'name', dir: 'desc' } })
    expect(desc.findAll('th')[0]!.attributes('aria-sort')).toBe('descending')
    await desc.find('th button').trigger('click')
    expect(desc.emitted('update:sort')).toEqual([[null]])
  })

  // The focus stays on the header's button, whose parent's `aria-sort` a reader does not say again:
  // the sort is said once it comes back from the app, and only the one a press asked for.
  it('a sort a header press asked for is said when it comes back; one the app sets is not', async () => {
    const sortSaid = (w: ReturnType<typeof mount>) => w.find('[role="status"][data-sort]').text()
    // Each line is emptied, written a beat later and held a beat before the next.
    const spoken = () => new Promise((r) => setTimeout(r, 160)).then(() => nextTick())
    const w = make()
    await beat()
    await w.findAll('th button')[0]!.trigger('click')
    await w.setProps({ sort: { key: 'name', dir: 'asc' } })
    await spoken()
    expect(sortSaid(w)).toBe('Sorted by Name, ascending')
    await w.findAll('th button')[0]!.trigger('click')
    await w.setProps({ sort: { key: 'name', dir: 'desc' } })
    await spoken()
    expect(sortSaid(w)).toBe('Sorted by Name, descending')
    await w.findAll('th button')[0]!.trigger('click')
    await w.setProps({ sort: null })
    await spoken()
    expect(sortSaid(w)).toBe('Not sorted')
    const quiet = make()
    await beat()
    await quiet.setProps({ sort: { key: 'amount', dir: 'desc' } })
    await spoken()
    expect(sortSaid(quiet)).toBe('')
  })

  // An app that sends the sort back as a new object on every render, with the old values while it
  // waits for the server, is answered by value: only the sort the press asked for is said.
  it('the sort said is the one the press asked for, compared by value; a refused press is let go', async () => {
    const sortSaid = (w: ReturnType<typeof mount>) => w.find('[role="status"][data-sort]').text()
    const spoken = () => new Promise((r) => setTimeout(r, 160)).then(() => nextTick())
    const w = make({ sort: { key: 'name', dir: 'asc' } })
    await beat()
    await w.findAll('th button')[0]!.trigger('click')
    await w.setProps({ sort: { key: 'name', dir: 'asc' }, loading: true })
    await spoken()
    expect(sortSaid(w)).toBe('')
    await w.setProps({ sort: { key: 'name', dir: 'desc' }, loading: false })
    await spoken()
    expect(sortSaid(w)).toBe('Sorted by Name, descending')
    const refused = make({ sort: { key: 'name', dir: 'asc' } })
    await beat()
    await refused.findAll('th button')[0]!.trigger('click')
    await refused.setProps({ loading: true })
    await refused.setProps({ loading: false })
    await refused.setProps({ sort: { key: 'amount', dir: 'desc' } })
    await spoken()
    expect(sortSaid(refused)).toBe('')
  })

  it('the page checkbox selects the selectable rows, shows mixed for a part, clears when all are in', async () => {
    const selectable = (r: Row) => r.id !== 2
    const w = make({ selectable: true, isRowSelectable: selectable })
    const boxes = () => w.findAllComponents(UiCheckbox)
    expect(boxes()).toHaveLength(4)
    expect(boxes()[2]!.props('disabled')).toBe(true)
    await boxes()[0]!.find('input').trigger('change')
    expect(w.emitted('update:selection')).toEqual([[new Set([1, 3])]])

    const part = make({ selectable: true, isRowSelectable: selectable, selection: new Set([1]) })
    expect(part.findAllComponents(UiCheckbox)[0]!.props('indeterminate')).toBe(true)
    expect(part.findAll('tbody tr')[0]!.attributes('aria-selected')).toBe('true')
    expect(part.findAll('tbody tr')[0]!.classes()).toContain('bg-selected')

    const given = new Set([1, 3])
    const all = make({ selectable: true, isRowSelectable: selectable, selection: given })
    expect(all.findAllComponents(UiCheckbox)[0]!.props('modelValue')).toBe(true)
    await all.findAllComponents(UiCheckbox)[0]!.find('input').trigger('change')
    expect(all.emitted('update:selection')).toEqual([[new Set()]])
    expect(given.size).toBe(2)
  })

  it('a row checkbox toggles its own key; a row without a key cannot be selected', async () => {
    const w = make({ selectable: true, selection: new Set([1]) })
    await w.findAllComponents(UiCheckbox)[1]!.find('input').trigger('change')
    expect(w.emitted('update:selection')).toEqual([[new Set()]])
    await w.findAllComponents(UiCheckbox)[2]!.find('input').trigger('change')
    expect(w.emitted('update:selection')![1]).toEqual([new Set([1, 2])])

    const nameless = make({ selectable: true, items: [{ name: 'x', amount: 1 }] })
    const boxes = nameless.findAllComponents(UiCheckbox)
    expect(boxes[0]!.props('disabled')).toBe(true)
    expect(boxes[1]!.props('disabled')).toBe(true)
  })

  it('row-click fires with clickable only, not from a control inside the row, not with a modifier', async () => {
    const w = make({ clickable: true }, { 'cell.name': () => h('button', { class: 'inner' }, 'x') })
    const tr = w.findAll('tbody tr')[0]!
    expect(tr.classes()).toContain('cursor-pointer')
    await tr.trigger('click')
    expect(w.emitted('row-click')).toHaveLength(1)
    expect(w.emitted('row-click')![0]![0]).toEqual(rows[0])
    await tr.find('.inner').trigger('click')
    await tr.trigger('click', { ctrlKey: true })
    await tr.trigger('click', { metaKey: true })
    await tr.trigger('click', { shiftKey: true })
    expect(w.emitted('row-click')).toHaveLength(1)

    const quiet = make()
    expect(quiet.findAll('tbody tr')[0]!.classes()).not.toContain('cursor-pointer')
    await quiet.findAll('tbody tr')[0]!.trigger('click')
    expect(quiet.emitted('row-click')).toBeUndefined()
  })

  it('loading shows skeleton rows and says so; an empty page says no records or nothing matches', async () => {
    const loading = make({ loading: true, items: [] })
    const empty = make({ items: [] })
    // Drawn empty, so a reader hears the words arrive.
    expect(loading.find('[role="status"]').text()).toBe('')
    await beat()
    expect(loading.find('tbody').attributes('aria-busy')).toBe('true')
    expect(loading.findAll('tbody tr')).toHaveLength(5)
    expect(loading.find('[role="status"]').text()).toBe('Loading…')

    expect(empty.find('tbody td').attributes('colspan')).toBe('3')
    expect(empty.find('tbody').text()).toContain('No records yet')
    expect(empty.find('tbody').text()).toContain('Records appear here once they are added.')
    expect(empty.find('[role="status"]').text()).toBe('No records yet')
    expect(make({ items: [], filtered: true }).find('tbody').text()).toContain(
      'No matching records',
    )
    const own = make(
      { items: [], filtered: true },
      { empty: ({ filtered }: { filtered: boolean }) => `own ${filtered}` },
    )
    expect(own.find('tbody').text()).toBe('own true')
  })

  it('a failed load shows the message with a retry; a failed refresh shows the same plate in place of the rows', async () => {
    const failed = make({ items: [], error: 'The server did not answer' })
    expect(failed.find('tbody').text()).toContain('The server did not answer')
    await failed.find('tbody button').trigger('click')
    expect(failed.emitted('retry')).toEqual([[]])
    // The plate is an alert and says it; the status line stays quiet, so it is heard once.
    expect(failed.find('[role="status"]').text()).toBe('')
    expect(failed.find('[role="alert"]').text()).toContain('The server did not answer')

    // Rows given with the error are not drawn: the plate takes their place, and no line goes above.
    const stale = make({ error: 'The server did not answer' })
    await beat()
    expect(stale.findAll('tbody tr')).toHaveLength(1)
    expect(stale.find('[role="alert"]').text()).toContain('The server did not answer')
    expect(stale.text()).not.toContain('Anna')
    expect(stale.find('[role="status"]').text()).toBe('')
    await stale.find('tbody button').trigger('click')
    expect(stale.emitted('retry')).toEqual([[]])
  })

  it('a retry in flight after a failure draws the skeleton: no retry is left to press twice', async () => {
    for (const items of [undefined, []]) {
      const w = make({ loading: true, error: 'Down', ...(items ? { items } : {}) })
      // The status line is filled a moment after the table mounts.
      await beat()
      expect(w.find('tbody').attributes('aria-busy')).toBe('true')
      expect(w.findComponent({ name: 'UiSkeleton' }).exists()).toBe(true)
      expect(w.findAll('button').filter((b) => b.text() === 'Retry')).toHaveLength(0)
      expect(w.find('[role="status"]').text()).toBe('Loading…')
    }
  })

  it('row actions add a sticky last column with a named header; a footer cell adds the footer row', () => {
    const w = make(
      {},
      {
        'row-actions': ({ row }: { row: Row }) => h('button', { class: 'act' }, `edit ${row.id}`),
        'footer.amount': ({ items }: { items: Row[] }) => `${items.length} rows`,
      },
    )
    const heads = w.findAll('thead th')
    expect(heads).toHaveLength(4)
    expect(heads[3]!.text()).toBe('Actions')
    expect(heads[3]!.classes()).toContain('sticky')
    const last = w.findAll('tbody tr')[0]!.findAll('td')[3]!
    expect(last.classes()).toContain('sticky')
    expect(last.find('.act').text()).toBe('edit 1')
    const foot = w.findAll('tfoot td')
    expect(foot).toHaveLength(4)
    expect(foot[1]!.text()).toBe('3 rows')
    expect(make().find('tfoot').exists()).toBe(false)
  })

  it('attributes reach the table, class stays on the root', () => {
    const w = make({ 'aria-label': 'Invoices', class: 'mt-4', 'data-testid': 'inv' })
    expect(w.classes()).toContain('mt-4')
    expect(w.find('table').attributes('aria-label')).toBe('Invoices')
    expect(w.find('table').attributes('data-testid')).toBe('inv')
    expect(w.attributes('aria-label')).toBeUndefined()
  })
})

describe('UiTable — no data', () => {
  it('an empty page and a failed load say why; #empty puts the next step of your own in place', () => {
    const empty = make({ items: [] })
    expect(empty.findComponent(UiNoData).text()).toContain('No records yet')
    const own = make(
      { items: [] },
      {
        empty: () =>
          h(
            UiNoData,
            { title: 'No invoices yet', description: 'Create the first one.' },
            { actions: () => h('button', 'Create invoice') },
          ),
      },
    )
    expect(own.find('tbody').text()).toContain('No invoices yet')
    expect(own.find('tbody button').text()).toBe('Create invoice')
    const failed = make({ items: [], error: 'The server did not answer' })
    const plate = failed.findComponent(UiNoData)
    expect(plate.props('tone')).toBe('danger')
    expect(plate.attributes('role')).toBe('alert')
    expect(plate.text()).toContain('Could not load records')
  })
})

describe('UiTable — a cut value', () => {
  it('stands in a UiTruncate, not under a title', () => {
    const w = mount(UiTable, {
      props: {
        columns: [
          { key: 'name', label: 'Name', truncate: true },
          { key: 'amount', label: 'Amount' },
        ],
        items: [{ id: 1, name: 'Northwind Traders', amount: 3 }],
      },
      global: { stubs: { Teleport: true } },
    })
    const cuts = w.findAllComponents(UiTruncate)
    expect(cuts).toHaveLength(1)
    expect(cuts[0]!.props('text')).toBe('Northwind Traders')
    expect(w.find('td[title]').exists()).toBe(false)
    expect(w.find('td span.truncate').text()).toBe('Northwind Traders')
  })
})

describe('UiTable — review follow-ups', () => {
  it('a first load draws two lines for a column that holds two, so the rows arrive at their height', () => {
    const w = mount(UiTable, {
      props: {
        items: [],
        loading: true,
        rowKey: 'id',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'total', label: 'Total', lines: 2 },
        ],
      } as never,
    })
    const row = w.find('tbody tr')
    const [one, two] = row.findAll('td')
    expect(one!.findAll('.ui-skeleton')).toHaveLength(1)
    expect(two!.findAll('.ui-skeleton')).toHaveLength(2)
    w.unmount()
  })

  it('a refresh in flight keeps the existing rows instead of skeleton rows, and says it is busy', async () => {
    const w = make({ loading: true })
    await beat()
    const body = w.find('tbody')
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(cells(w, 0)[0]).toBe('Anna')
    expect(body.attributes('aria-busy')).toBe('true')
    expect(body.classes()).toContain('opacity-60')
    expect(w.find('[role="status"]').text()).toBe('Updating…')
    expect(w.findComponent({ name: 'UiSkeleton' }).exists()).toBe(false)
  })

  it('shows as many skeleton rows as the page is expected to hold, not a fixed five', () => {
    expect(make({ loading: true, items: [], skeletonRows: 12 }).findAll('tbody tr')).toHaveLength(
      12,
    )
    expect(make({ loading: true, items: [] }).findAll('tbody tr')).toHaveLength(5)
  })

  it('the horizontal scroll box is keyboard-focusable and named once the table overflows', async () => {
    const w = make({}, {}, { 'aria-label': 'Invoices' })
    const box = w.find('.overflow-x-auto')
    // Not a tab stop while it fits; it still takes the focus the table hands it.
    expect(box.attributes('tabindex')).toBe('-1')
    Object.defineProperty(box.element, 'scrollWidth', { value: 1200, configurable: true })
    Object.defineProperty(box.element, 'clientWidth', { value: 600, configurable: true })
    await w.setProps({ items: [...rows] })
    await flushPromises()
    expect(box.attributes('tabindex')).toBe('0')
    expect(box.attributes('role')).toBe('region')
    expect(box.attributes('aria-label')).toBe('Invoices')
    Object.defineProperty(box.element, 'scrollWidth', { value: 600, configurable: true })
    await w.setProps({ items: [...rows] })
    await flushPromises()
    // Not a tab stop while it fits; it still takes the focus the table hands it.
    expect(box.attributes('tabindex')).toBe('-1')
  })

  it('a row checkbox names the row it belongs to when rowLabel is given', () => {
    const named = make({ selectable: true, rowLabel: (r: Row) => r.name })
    const boxes = named.findAllComponents(UiCheckbox)
    expect(boxes[1]!.props('ariaLabel')).toBe('Select Anna')
    expect(make({ selectable: true }).findAllComponents(UiCheckbox)[1]!.props('ariaLabel')).toBe(
      'Select row',
    )
  })

  it("a caller's aria-label on the table also names its select-all checkbox", () => {
    const named = make({ selectable: true }, {}, { 'aria-label': 'Invoices' })
    expect(named.findAllComponents(UiCheckbox)[0]!.props('ariaLabel')).toBe(
      'Select all on this page of Invoices',
    )
    expect(make({ selectable: true }).findAllComponents(UiCheckbox)[0]!.props('ariaLabel')).toBe(
      'Select all on this page',
    )
  })

  it('a keyless row does not hand its DOM node, and any focus on it, to a different record after a sort', async () => {
    const a = { name: 'Anna', amount: 1 }
    const b = { name: 'Boris', amount: 2 }
    const w = mount(UiTable, {
      props: { columns: [{ key: 'name', label: 'Name' }], items: [a, b] },
    })
    const [first, second] = w.findAll('tbody tr').map((tr) => tr.element)
    await w.setProps({ items: [b, a] })
    const after = w.findAll('tbody tr').map((tr) => tr.element)
    expect(after[0]).toBe(second)
    expect(after[1]).toBe(first)
  })

  it("a format that returns an empty string still shows the table's dash", () => {
    const w = make({
      columns: [
        { key: 'name', label: 'Name', format: (v: unknown) => (v === 'Anna' ? '' : String(v)) },
      ],
    })
    expect(cells(w, 0)[0]).toBe('—')
    expect(cells(w, 1)[0]).toBe('Boris')
  })

  it('measures the scroll box again once the web fonts have loaded', async () => {
    let ready: () => void = () => {}
    const fonts = { ready: new Promise<void>((r) => (ready = r)) }
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true })
    try {
      const w = make()
      const box = w.find('.overflow-x-auto')
      // Not a tab stop while it fits; it still takes the focus the table hands it.
      expect(box.attributes('tabindex')).toBe('-1')
      Object.defineProperty(box.element, 'scrollWidth', { value: 1200, configurable: true })
      Object.defineProperty(box.element, 'clientWidth', { value: 600, configurable: true })
      ready()
      await flushPromises()
      expect(box.attributes('tabindex')).toBe('0')
    } finally {
      delete (document as { fonts?: unknown }).fonts
    }
  })

  it('a scroll box without a caller name falls back to the dictionary', async () => {
    const w = make()
    const box = w.find('.overflow-x-auto')
    Object.defineProperty(box.element, 'scrollWidth', { value: 1200, configurable: true })
    Object.defineProperty(box.element, 'clientWidth', { value: 600, configurable: true })
    await w.setProps({ items: [...rows] })
    await flushPromises()
    expect(box.attributes('aria-label')).toBe('Table, scrolls sideways')
  })

  it('a first load with a stale error shows skeleton rows, not the old error', () => {
    const w = make({ loading: true, items: [], error: 'Down' })
    expect(w.find('tbody').attributes('aria-busy')).toBe('true')
    expect(w.findAll('tbody tr')).toHaveLength(5)
    expect(w.find('tbody').text()).not.toContain('Down')
  })

  it("a format that returns only spaces still shows the table's dash", () => {
    const w = make({
      columns: [
        { key: 'name', label: 'Name', format: (v: unknown) => (v === 'Anna' ? '  ' : String(v)) },
      ],
    })
    expect(cells(w, 0)[0]).toBe('—')
  })

  it('a cut column with no width takes the room left, others keep theirs', () => {
    const w = make({
      columns: [
        { key: 'name', label: 'Name', truncate: true },
        { key: 'amount', label: 'Amount', width: '120px' },
      ],
    })
    const [name, amount] = w.findAll('thead th')
    expect(name!.attributes('style')).toContain('width: 100%')
    expect(amount!.attributes('style')).toContain('width: 120px')
  })

  it('two cut columns with no width share the room left evenly', () => {
    const w = make({
      columns: [
        { key: 'name', label: 'Name', truncate: true },
        { key: 'email', label: 'Email', truncate: true },
        { key: 'amount', label: 'Amount' },
      ],
    })
    const [name, email, amount] = w.findAll('thead th')
    expect(name!.attributes('style')).toContain('width: 50%')
    expect(email!.attributes('style')).toContain('width: 50%')
    expect(amount!.attributes('style')).toBeUndefined()
  })
})

describe('UiTable — a range with Shift', () => {
  const five = [1, 2, 3, 4, 5].map((id) => ({ id, name: `Row ${id}`, amount: id }))
  const table = (props: Record<string, unknown> = {}) =>
    make({ items: five, selectable: true, rowKey: 'id', ...props })
  // A press on a row's checkbox: the cell hears the Shift first, then the box changes.
  async function press(w: ReturnType<typeof mount>, i: number, shiftKey = false) {
    const cell = w.findAll('tbody tr')[i]!.find('td')
    await cell.trigger('click', { shiftKey, detail: 1 })
    const box = cell.find('input[type="checkbox"]')
    await box.setValue(!(box.element as HTMLInputElement).checked)
    const sets = w.emitted('update:selection') as Set<number>[][]
    await w.setProps({ selection: sets.at(-1)![0] })
  }
  const picked = (w: ReturnType<typeof mount>) =>
    [...(w.emitted('update:selection') as Set<number>[][]).at(-1)![0]!].sort()

  it('Shift with a second checkbox marks every row between', async () => {
    const w = table()
    await press(w, 0)
    await press(w, 3, true)
    expect(picked(w)).toEqual([1, 2, 3, 4])
  })

  it('Shift over marked rows clears the range, as the pressed row goes', async () => {
    const w = table({ selection: new Set([1, 2, 3, 4, 5]) })
    await press(w, 4)
    await press(w, 1, true)
    expect(picked(w)).toEqual([1])
  })

  it('a row that cannot be selected stays out of the range', async () => {
    const w = table({ isRowSelectable: (r: { id: number }) => r.id !== 3 })
    await press(w, 0)
    await press(w, 4, true)
    expect(picked(w)).toEqual([1, 2, 4, 5])
  })

  it('a selection cleared from outside starts the next Shift range afresh', async () => {
    const w = table()
    await press(w, 0)
    await press(w, 3, true)
    await w.setProps({ selection: new Set() })
    await press(w, 4, true)
    expect(picked(w)).toEqual([5])
  })

  it('Shift+Space from the keyboard marks the range too', async () => {
    const w = table()
    await press(w, 1)
    const cell = w.findAll('tbody tr')[3]!.find('td')
    await cell.trigger('keydown', { key: ' ', shiftKey: true })
    await cell.trigger('click', { detail: 0 })
    await cell.find('input[type="checkbox"]').setValue(true)
    expect([...(w.emitted('update:selection') as Set<number>[][]).at(-1)![0]!].sort()).toEqual([
      2, 3, 4,
    ])
  })

  it('without Shift a press marks one row', async () => {
    const w = table()
    await press(w, 0)
    await press(w, 3)
    expect(picked(w)).toEqual([1, 4])
  })

  it('a click with no pointer and no Space before it marks one row, even after a Shift-click', async () => {
    const w = table()
    await press(w, 0)
    const cell = w.findAll('tbody tr')[3]!.find('td')
    await cell.trigger('click', { shiftKey: true, detail: 1 })
    await cell.trigger('click', { detail: 0 })
    await cell.find('input[type="checkbox"]').setValue(true)
    expect(picked(w)).toEqual([1, 4])
  })

  it('an anchor that left the page makes the Shift press a single one', async () => {
    const w = table()
    await press(w, 0)
    await w.setProps({ items: five.slice(2) })
    await press(w, 2, true)
    expect(picked(w)).toEqual([1, 5])
  })

  it('the anchor moves with each press: the next range starts from the last row pressed', async () => {
    const w = table()
    await press(w, 0)
    await press(w, 1, true)
    await press(w, 4)
    await press(w, 3, true)
    expect(picked(w)).toEqual([1, 2, 4, 5])
  })

  it('the checkbox says its shortcut and its cell selects no text', () => {
    const cell = table().findAll('tbody tr')[0]!.find('td')
    expect(cell.classes()).toContain('select-none')
    expect(cell.find('input[type="checkbox"]').attributes('aria-keyshortcuts')).toBe('Shift+Space')
  })
})

describe('UiTable — its states and its focus', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('the scroll box and the sort buttons draw their focus ring inside, where the card clips an outside halo', () => {
    const w = make()
    const inset = 'focus-visible:!shadow-(--ui-ring-inset)'
    expect(w.find('.overflow-x-auto').classes()).toContain(inset)
    expect(w.find('th button').classes()).toContain(inset)
  })

  it('a skeleton row has the height of a text row and its bar follows the column alignment', () => {
    const w = make({ items: [], loading: true })
    const cells = w.findAll('tbody tr')[0]!.findAll('td')
    expect(cells[0]!.find('div[class*="text-sm"]').exists()).toBe(true)
    expect(cells[0]!.find('.inline-block.h-3').exists()).toBe(true)
    // Amount is `align: 'end'`: its bar stands on the side its numbers will.
    expect(cells[1]!.classes()).toContain('text-end')
  })

  it('the footer row stays out of a skeleton, an empty page and a failed load, and dims on a refresh', () => {
    const footer = { 'footer.amount': () => '310 EUR' }
    expect(make({ items: [], loading: true }, footer).find('tfoot').exists()).toBe(false)
    expect(make({ items: [] }, footer).find('tfoot').exists()).toBe(false)
    expect(make({ items: [], error: 'Down' }, footer).find('tfoot').exists()).toBe(false)
    expect(make({}, footer).find('tfoot').classes()).not.toContain('opacity-60')
    expect(make({ loading: true }, footer).find('tfoot').classes()).toContain('opacity-60')
  })

  it('pressing Retry keeps the focus inside the table while the load runs', async () => {
    const w = mount(UiTable<Row>, {
      attachTo: document.body,
      props: {
        columns,
        items: [],
        error: 'Down',
        onRetry: (): Promise<void> => w.setProps({ loading: true }),
      },
    })
    const retry = w.findAll('button').find((b) => b.text() === 'Retry')!
    ;(retry.element as HTMLElement).focus()
    await retry.trigger('click')
    await nextTick()
    await nextTick()
    expect(w.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('.overflow-x-auto').element)
  })

  it('a header pressed while rows load asks for no second sort and keeps the focus', async () => {
    const w = mount(UiTable<Row>, {
      attachTo: document.body,
      props: { columns, items: rows, loading: true },
    })
    const head = w.find('th button')
    ;(head.element as HTMLElement).focus()
    await head.trigger('click')
    expect(w.emitted('update:sort')).toBeUndefined()
    expect(head.attributes('aria-disabled')).toBe('true')
    expect(head.attributes('disabled')).toBeUndefined()
    expect(document.activeElement).toBe(head.element)
  })

  it('an empty or failed plate is as wide as the visible box, not the whole table', () => {
    for (const w of [make({ items: [] }), make({ items: [], error: 'Down' })]) {
      const plate = w.find('tbody td > div')
      expect(plate.classes()).toEqual(expect.arrayContaining(['sticky', 'start-0']))
    }
  })

  it('measures again when the table grows while the box does not', () => {
    const watched: Element[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(el: Element) {
          watched.push(el)
        }
        disconnect() {}
      },
    )
    const w = make()
    expect(watched).toContain(w.find('.overflow-x-auto').element)
    expect(watched).toContain(w.find('table').element)
  })

  it('an end-aligned column sets tabular figures', () => {
    const w = make()
    expect(w.findAll('tbody tr')[0]!.findAll('td')[1]!.classes()).toContain('tabular-nums')
  })

  it('the root can shrink inside a flex or grid parent', () => {
    expect(make().classes()).toContain('min-w-0')
  })

  it('row-click ignores a control inside the row, and answers when the table stands inside one', async () => {
    const inside = make(
      { clickable: true },
      { 'cell.name': () => h('button', { class: 'own' }, 'x') },
    )
    await inside.find('button.own').trigger('click')
    expect(inside.emitted('row-click')).toBeUndefined()
    const wrap = mount(
      {
        render: () =>
          h('div', { role: 'button' }, [
            h(UiTable as never, { columns, items: rows, clickable: true }),
          ]),
      },
      { attachTo: document.body },
    )
    await wrap.find('tbody tr td:nth-child(2)').trigger('click')
    expect(wrap.findComponent(UiTable).emitted('row-click')).toHaveLength(1)
  })

  it('the skeleton box of a checkbox takes the check mark size from the util', () => {
    const w = make({ items: [], loading: true, selectable: true })
    expect(w.find('tbody td').find('div').classes()).toEqual(
      expect.arrayContaining(['h-[18px]', 'w-[18px]']),
    )
  })

  const acting = (props: Record<string, unknown> = {}) =>
    mount(UiTable<Row>, {
      props: { columns, items: rows, rowKey: 'id', ...props },
      slots: {
        'row-actions': ({ row }: { row: Row }) => [
          h('button', { class: 'edit' }, `Edit ${row.name}`),
          h('button', { class: 'drop' }, `Delete ${row.name}`),
        ],
      },
      attachTo: document.body,
    })

  it('a row deleted under the focus hands it to the same control of the row now in its place', async () => {
    const w = acting()
    ;(w.findAll('button.drop')[1]!.element as HTMLElement).focus()
    await w.setProps({ items: [rows[0]!, rows[2]!] })
    expect(document.activeElement?.textContent).toBe('Delete Clara')
    // The last row gone, the row above takes it.
    await w.setProps({ items: [rows[0]!] })
    expect(document.activeElement?.textContent).toBe('Delete Anna')
    w.unmount()
  })

  it('a table left without rows keeps the focus in its box', async () => {
    const w = acting({ selectable: true })
    ;(w.find('button.edit').element as HTMLElement).focus()
    await w.setProps({ items: [] })
    expect(w.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(document.body)
    w.unmount()
  })

  it('the page checkbox turned off with the last row gives the focus to the table box', async () => {
    const w = acting({ selectable: true })
    const all = w.find('thead input[type="checkbox"]').element as HTMLInputElement
    all.focus()
    await w.setProps({ items: [] })
    expect(all.disabled).toBe(true)
    expect(document.activeElement).not.toBe(all)
    expect(w.element.contains(document.activeElement)).toBe(true)
    w.unmount()
  })

  it('a focus that went elsewhere is not pulled back when a row leaves', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const w = acting()
    ;(w.findAll('button.drop')[1]!.element as HTMLElement).focus()
    outside.focus()
    await w.setProps({ items: [rows[0]!, rows[2]!] })
    expect(document.activeElement).toBe(outside)
    w.unmount()
    outside.remove()
  })

  it('a column of objects with no format draws a dash, not "[object Object]", and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = make({ columns: [{ key: 'owner', label: 'Owner' }] })
    expect(w.text()).not.toContain('[object Object]')
    expect(cells(w, 0)[0]).toBe('—')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"owner" holds an object'))
    warn.mockRestore()
  })

  it('a row control turned off while rows load keeps the focus, not handing it to its neighbor', async () => {
    const busy = ref(false)
    const w = mount(UiTable<Row>, {
      props: { columns, items: rows, rowKey: 'id', loading: false },
      slots: {
        'row-actions': ({ row }: { row: Row }) => [
          h('button', { class: 'edit' }, `Edit ${row.name}`),
          h('button', { class: 'drop', disabled: busy.value }, `Delete ${row.name}`),
        ],
      },
      attachTo: document.body,
    })
    const drop = w.findAll('button.drop')[1]!.element as HTMLButtonElement
    drop.focus()
    busy.value = true
    await w.setProps({ loading: true })
    expect(drop.disabled).toBe(true)
    expect(document.activeElement?.textContent).not.toBe('Edit Boris')
    w.unmount()
  })

  it('a last row spliced out of the array in place hands the focus to the row above', async () => {
    const list = reactive([...rows])
    const w = mount(UiTable<Row>, {
      props: { columns, items: list, rowKey: 'id' },
      slots: {
        'row-actions': ({ row }: { row: Row }) =>
          h('button', { class: 'drop' }, `Delete ${row.name}`),
      },
      attachTo: document.body,
    })
    ;(w.findAll('button.drop')[2]!.element as HTMLElement).focus()
    list.splice(2, 1)
    await nextTick()
    await nextTick()
    expect(document.activeElement?.textContent).toBe('Delete Boris')
    w.unmount()
  })
})

describe('UiTable — a table wider than its box', () => {
  const sized = async (scrollLeft: number) => {
    const w = make()
    const box = w.find('.overflow-x-auto').element as HTMLElement
    Object.defineProperty(box, 'scrollWidth', { configurable: true, value: 900 })
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 360 })
    box.scrollLeft = scrollLeft
    await w.find('.overflow-x-auto').trigger('scroll')
    await nextTick()
    return w
  }
  it('fades at the end while more columns wait there', async () => {
    const w = await sized(0)
    expect(w.find('[data-scroll-more="end"]').exists()).toBe(true)
    expect(w.find('[data-scroll-more="start"]').exists()).toBe(false)
  })
  it('fades at the start once scrolled, and not at the end when the end is reached', async () => {
    const w = await sized(540)
    expect(w.find('[data-scroll-more="start"]').exists()).toBe(true)
    expect(w.find('[data-scroll-more="end"]').exists()).toBe(false)
  })
  it('a table that fits draws no fade', async () => {
    const w = make()
    expect(w.find('[data-scroll-more]').exists()).toBe(false)
  })
  it('a table that already scrolls keeps short values on one line; a long text still wraps', async () => {
    type Note = { id: string; due: string; note: string }
    const long = 'A note long enough to need more than one line in any column of a table.'
    const w = mount(UiTable<Note>, {
      props: {
        columns: [
          { key: 'id', label: 'Invoice' },
          { key: 'due', label: 'Due' },
          { key: 'note', label: 'Note' },
        ],
        items: [{ id: '#1041', due: 'Oct 2', note: long }],
      },
    })
    const cells = () => w.findAll('tbody td').map((c) => c.classes().includes('whitespace-nowrap'))
    expect(cells()).toEqual([false, false, false])
    const box = w.find('.overflow-x-auto').element as HTMLElement
    Object.defineProperty(box, 'scrollWidth', { configurable: true, value: 900 })
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 360 })
    await w.find('.overflow-x-auto').trigger('scroll')
    await nextTick()
    expect(cells()).toEqual([true, true, false])
  })
  it('an empty or a failed wide table draws no shade and no arrow over its plate', async () => {
    for (const props of [{ items: [] }, { error: 'Could not load' }]) {
      const w = make(props)
      const box = w.find('.overflow-x-auto').element as HTMLElement
      Object.defineProperty(box, 'scrollWidth', { configurable: true, value: 900 })
      Object.defineProperty(box, 'clientWidth', { configurable: true, value: 360 })
      await w.find('.overflow-x-auto').trigger('scroll')
      await nextTick()
      expect(w.find('[data-scroll-more]').exists()).toBe(false)
      expect(w.find('[data-scroll-arrow]').exists()).toBe(false)
      w.unmount()
    }
  })
  it('an edge with more columns past it grows an arrow that pages the table, for the pointer', async () => {
    const w = await sized(0)
    const box = w.find('.overflow-x-auto').element as HTMLElement
    const by = vi.fn()
    box.scrollBy = by as never
    expect(w.find('[data-scroll-arrow="start"]').exists()).toBe(false)
    const end = w.find('[data-scroll-arrow="end"]')
    expect(end.attributes('tabindex')).toBe('-1')
    expect(end.attributes('aria-hidden')).toBe('true')
    await end.trigger('click')
    expect(by.mock.calls[0]![0].left).toBeGreaterThan(0)
  })
  it('at the end the arrow stands at the start and pages back', async () => {
    const w = await sized(540)
    const box = w.find('.overflow-x-auto').element as HTMLElement
    const by = vi.fn()
    box.scrollBy = by as never
    expect(w.find('[data-scroll-arrow="end"]').exists()).toBe(false)
    await w.find('[data-scroll-arrow="start"]').trigger('click')
    expect(by.mock.calls[0]![0].left).toBeLessThan(0)
  })
  it("the end's shade stands at the row actions, where the columns slide under them", async () => {
    const w = make({}, { 'row-actions': () => h('button', 'Edit') })
    const box = w.find('.overflow-x-auto').element as HTMLElement
    Object.defineProperty(box, 'scrollWidth', { configurable: true, value: 900 })
    Object.defineProperty(box, 'clientWidth', { configurable: true, value: 360 })
    const actions = w.findAll('thead th').at(-1)!.element as HTMLElement
    Object.defineProperty(actions, 'offsetWidth', { configurable: true, value: 56 })
    await w.find('.overflow-x-auto').trigger('scroll')
    await nextTick()
    expect(w.find('[data-scroll-more="end"]').attributes('style')).toContain(
      'inset-inline-end: 56px',
    )
  })
})

describe('UiTable — a retry after a failed load', () => {
  it('a retry that clears the error starts from the skeleton: the rows in view answered the query before', async () => {
    const w = make({ ariaLabel: 'People' })
    // A new search goes out with the old rows in view, and fails.
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, error: 'The server did not answer.' })
    // Retry: the app clears the error as the request goes out again.
    await w.setProps({ error: null, loading: true })
    expect(w.find('tbody').attributes('aria-busy')).toBe('true')
    expect(w.find('tbody').text()).toBe('')
    await beat()
    expect(w.find('[role="status"]').text()).toBe('Loading…')
    // The answer comes: a refresh after it dims the rows again.
    await w.setProps({ loading: false })
    await w.setProps({ loading: true })
    expect(w.find('tbody').text()).not.toBe('')
  })
})

describe('UiTable — review follow-ups', () => {
  // The words of an empty table are said by the table's own region, which is in the DOM from the
  // start; the plate it draws is read on the way, not announced a second time.
  const live = (w: ReturnType<typeof mount>, words: string) =>
    w.findAll('[role="status"]').filter((r) => r.text().includes(words))

  it('an empty table says its words in one live region, the plate is not a second one', async () => {
    const empty = make({ items: [] })
    await beat()
    expect(live(empty, 'No records yet')).toHaveLength(1)
    expect(empty.find('tbody').text()).toContain('No records yet')
    const filtered = make({ items: [], filtered: true })
    await beat()
    expect(live(filtered, 'No matching records')).toHaveLength(1)
    expect(filtered.find('tbody').text()).toContain('No matching records')
  })

  it('a failed load is still one alert, and the plate keeps its words', () => {
    const failed = make({ items: [], error: 'The server did not answer' })
    expect(failed.findAll('[role="alert"]')).toHaveLength(1)
    expect(failed.findAll('[role="status"]').map((r) => r.text())).toEqual(['', ''])
  })
})
