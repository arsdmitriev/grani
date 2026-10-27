import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTableColumns } from '../composables/useTableColumns'
import type { TableColumn } from '../types/ui'
import UiTableColumns from './UiTableColumns.vue'

type Row = Record<string, unknown>
const cols = ref<TableColumn<Row>[]>([
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'price', label: 'Price' },
])

describe('UiTableColumns', () => {
  let wrappers: ReturnType<typeof mount>[] = []
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
  })
  const open = async (
    state = useTableColumns('t', cols, { required: ['name'], hiddenByDefault: ['id'] }),
  ) => {
    const w = mount(UiTableColumns<Row>, {
      props: { columns: state },
      attachTo: document.body,
    })
    wrappers.push(w)
    await w.find('button').trigger('click')
    return { w, state }
  }

  it('is a square glyph button without a count that opens a dialog named Columns', async () => {
    const { w } = await open()
    const trigger = w.find('button')
    expect(trigger.attributes('aria-label')).toBe('Columns')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.text()).toBe('')
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    // No heading: the dialog is named by its button, as a dropdown is.
    const dialog = w.find('[role="dialog"]')
    expect(dialog.find('h2').exists()).toBe(false)
    expect(dialog.attributes('aria-labelledby')).toBe(trigger.attributes('id'))
  })

  it('lists every column; a required one is ticked, held and marked Required', async () => {
    const { w } = await open()
    const rows = w.findAll('[role="listbox"] [role="option"]')
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.attributes('aria-selected'))).toEqual(['true', 'false', 'true'])
    expect(rows[0]!.attributes('aria-disabled')).toBe('true')
    expect(rows[0]!.text()).toContain('Required')
  })

  it('a tick applies at once; the summary counts the hidden; Reset is held until something differs', async () => {
    const { w, state } = await open()
    const reset = () => w.findAll('button').find((b) => b.text() === 'Reset')!
    expect(w.text()).toContain('1 hidden')
    expect(reset().attributes('disabled')).toBeDefined()
    await w.findAll('[role="option"]')[2]!.trigger('click')
    expect(state.hidden.value).toEqual(['id', 'price'])
    expect(state.visible.value.map((c) => c.key)).toEqual(['name'])
    expect(w.text()).toContain('2 hidden')
    expect(reset().attributes('disabled')).toBeUndefined()
    await reset().trigger('click')
    expect(state.hidden.value).toEqual(['id'])
    await w.findAll('[role="option"]')[1]!.trigger('click')
    expect(state.hidden.value).toEqual([])
    expect(w.text()).toContain('All columns shown')
  })
})

describe('UiTableColumns — review follow-ups', () => {
  let wrappers: ReturnType<typeof mount>[] = []
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
  })
  const mountMenu = (state: ReturnType<typeof useTableColumns<Row>>, attrs = {}) => {
    const w = mount(UiTableColumns<Row>, {
      props: { columns: state },
      attrs,
      attachTo: document.body,
    })
    wrappers.push(w)
    return w
  }
  const openMenu = async () => {
    await new Promise((r) => setTimeout(r, 2))
    ;(document.body.querySelector('button[aria-label="Columns"]') as HTMLElement).click()
    await nextTick()
    await nextTick()
  }
  const option = (label: string) =>
    Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]')).find((o) =>
      o.textContent?.includes(label),
    )!

  it('the last column shown is held and marked Last one', async () => {
    const state = useTableColumns('loose', cols)
    state.toggle('id')
    state.toggle('price')
    mountMenu(state)
    await openMenu()
    const name = option('Name')
    expect(name.getAttribute('aria-disabled')).toBe('true')
    expect(name.textContent).toContain('Last one')
    name.click()
    await nextTick()
    expect(state.visible.value.map((c) => c.key)).toEqual(['name'])
  })

  it('class, style and other attributes land on the button, not the panel', () => {
    mountMenu(useTableColumns('t', cols), {
      class: 'ms-2',
      'data-testid': 'cols',
      style: 'color: red',
    })
    const button = document.body.querySelector<HTMLElement>('button[aria-label="Columns"]')!
    expect(button.classList).toContain('ms-2')
    expect(button.getAttribute('data-testid')).toBe('cols')
    expect(button.getAttribute('style')).toContain('red')
  })

  it('the button names itself in a tooltip, and still opens the panel', async () => {
    mountMenu(useTableColumns('t', cols))
    const button = document.body.querySelector<HTMLElement>('button[aria-label="Columns"]')!
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Columns')
    await openMenu()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
  })

  it('the summary is a status region that changes with each tick', async () => {
    mountMenu(useTableColumns('t', cols, { required: ['name'] }))
    await openMenu()
    const status = () =>
      [...document.body.querySelectorAll('[role="dialog"] [role="status"]')].at(-1)!.textContent
    expect(status()).toContain('All columns shown')
    option('ID').click()
    await nextTick()
    expect(status()).toContain('1 hidden')
  })

  it('a choice made in the menu is there after a remount', async () => {
    const w = mountMenu(useTableColumns('kept', cols, { required: ['name'] }))
    await openMenu()
    option('Price').click()
    await nextTick()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    document.body.innerHTML = ''
    const again = useTableColumns('kept', cols, { required: ['name'] })
    expect(again.hidden.value).toEqual(['price'])
    mountMenu(again)
    await openMenu()
    expect(option('Price').getAttribute('aria-selected')).toBe('false')
    expect(option('ID').getAttribute('aria-selected')).toBe('true')
  })

  const button = () => document.body.querySelector<HTMLElement>('button[aria-label="Columns"]')!
  const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')

  it('opened, the focus goes to the list of columns', async () => {
    mountMenu(useTableColumns('t', cols))
    await openMenu()
    await nextTick()
    expect(document.activeElement?.getAttribute('role')).toBe('listbox')
  })

  it('opened on six columns or more, the focus goes to the search', async () => {
    const wide = ['Name', 'ID', 'Price', 'Date', 'Status', 'Owner', 'Note'].map((label) => ({
      key: label.toLowerCase(),
      label,
    }))
    mountMenu(useTableColumns('wide', wide))
    await openMenu()
    await nextTick()
    expect(document.activeElement?.tagName).toBe('INPUT')
  })

  it('Escape closes the panel and returns the focus to the button', async () => {
    mountMenu(useTableColumns('t', cols))
    await openMenu()
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await nextTick()
    await nextTick()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('the list is one tab stop, and Reset the next once something differs', async () => {
    const { tabbables } = await import('../composables/useFocusTrap')
    const state = useTableColumns('t', cols)
    state.toggle('id')
    mountMenu(state)
    await openMenu()
    expect(
      tabbables(panel()!).map((el) => el.getAttribute('role') ?? el.textContent?.trim()),
    ).toEqual(['listbox', 'Reset'])
  })
})

describe('UiTableColumns — review follow-ups', () => {
  beforeEach(() => localStorage.clear())

  it('Only on a hidden column leaves that column alone in view', async () => {
    const state = useTableColumns('only', cols, { hiddenByDefault: ['price'] })
    const w = mount(UiTableColumns<Row>, { props: { columns: state }, attachTo: document.body })
    await w.find('button').trigger('click')
    const rows = w.findAll('[role="listbox"] [role="option"]')
    await rows[2]!.trigger('pointermove')
    await rows[2]!.find('[data-only]').trigger('click')
    expect(state.visible.value.map((c) => c.key)).toEqual(['price'])
    w.unmount()
  })
})

// The list of the columns menu is a filter's list: what a person learned on one, they find here.
describe("UiTableColumns — the list's patterns", () => {
  let wrappers: ReturnType<typeof mount>[] = []
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
  })
  const named = (...labels: string[]) =>
    labels.map((label) => ({ key: label.toLowerCase(), label })) as TableColumn<Row>[]
  const WIDE = named('Invoice', 'Client', 'Issued', 'Due', 'Amount', 'Tax', 'Status', 'Owner')
  const FEW = named('Invoice', 'Total', 'Tax', 'Terms', 'Client')
  const open = async (state: ReturnType<typeof useTableColumns<Row>>) => {
    wrappers.push(
      mount(UiTableColumns<Row>, { props: { columns: state }, attachTo: document.body }),
    )
    await new Promise((r) => setTimeout(r, 2))
    document.body.querySelector<HTMLElement>('button[aria-label="Columns"]')!.click()
    await nextTick()
    await nextTick()
  }
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  const labels = () =>
    [...document.body.querySelectorAll('[role="option"]')].map((o) =>
      o.textContent?.replace(/Required|Last one/, '').trim(),
    )
  const lit = () => {
    const id = document.activeElement?.getAttribute('aria-activedescendant')
    return id ? document.getElementById(id)?.textContent?.trim() : undefined
  }

  it('from six columns a search narrows the list, and Escape empties it with the panel still open', async () => {
    await open(useTableColumns('search', WIDE))
    const search = document.activeElement as HTMLInputElement
    expect(search.tagName).toBe('INPUT')
    search.value = 'ta'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(labels()).toEqual(['Tax', 'Status'])
    key(search, 'Escape')
    await nextTick()
    await nextTick()
    expect(search.value).toBe('')
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.activeElement).toBe(search)
  })

  it('a letter goes to the column that starts with it, and the same letter again to the next', async () => {
    await open(useTableColumns('letters', FEW))
    const list = document.activeElement!
    expect(list.getAttribute('role')).toBe('listbox')
    key(list, 't')
    await nextTick()
    expect(lit()).toBe('Total')
    key(list, 't')
    await nextTick()
    expect(lit()).toBe('Tax')
  })

  it('from six columns the ones shown open at the top, in the order of the table', async () => {
    const hidden = ['invoice', 'client', 'issued', 'due', 'tax', 'owner']
    await open(useTableColumns('first', WIDE, { hiddenByDefault: hidden }))
    expect(labels().slice(0, 2)).toEqual(['Amount', 'Status'])
  })

  it('from six columns the shown and the hidden stand under their names, a line between', async () => {
    const hidden = ['invoice', 'client', 'issued', 'due', 'tax', 'owner']
    await open(useTableColumns('groups', WIDE, { hiddenByDefault: hidden }))
    const list = document.body.querySelector('[role="listbox"]')!
    const rows = [...list.children].map((r) =>
      r.hasAttribute('data-group')
        ? `[${r.textContent?.trim()}${r.className.includes('border-t') ? ', a line' : ''}]`
        : r.textContent?.trim(),
    )
    expect(rows.slice(0, 5)).toEqual(['[Shown]', 'Amount', 'Status', '[Hidden, a line]', 'Invoice'])
    const names = list.querySelectorAll('[data-group]')
    for (const n of names) {
      expect(n.getAttribute('role')).toBe('presentation')
      expect(n.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('Only keeps the highlighted column alone, and a required column stays beside it', async () => {
    const state = useTableColumns('only-one', FEW, { required: ['invoice'] })
    await open(state)
    const tax = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (o) => o.textContent?.trim() === 'Tax',
    )!
    tax.dispatchEvent(new Event('pointermove', { bubbles: true }))
    await nextTick()
    tax.querySelector<HTMLElement>('[data-only]')!.click()
    await nextTick()
    expect(state.visible.value.map((c) => c.key)).toEqual(['invoice', 'tax'])
  })

  it('a long list of columns is cut at five rows and a half', async () => {
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    const top = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.getAttribute?.('role') === 'option' ? 32 : 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const rows = this.parentElement ? [...this.parentElement.children] : []
        return this.getAttribute?.('role') === 'option' ? rows.indexOf(this) * 32 : 0
      },
    })
    try {
      await open(useTableColumns('five', WIDE))
      for (let i = 0; i < 3; i++) await nextTick()
      await new Promise((r) => setTimeout(r))
      // Five rows of 32 and half of the sixth: 5 * 32 + 16.
      const list = document.body.querySelector<HTMLElement>('[role="listbox"]')!
      expect(list.style.maxHeight).toContain('176px')
    } finally {
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
      if (top) Object.defineProperty(HTMLElement.prototype, 'offsetTop', top)
    }
  })
})
