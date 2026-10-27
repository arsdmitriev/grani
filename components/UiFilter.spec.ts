import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Fragment, h, nextTick } from 'vue'
import UiFilter from './UiFilter.vue'
import UiFilterList from './UiFilterList.vue'
import UiCard from './UiCard.vue'
import type { SelectValue } from '../types/ui'

// Vue drops a click in the very millisecond its listener was attached (`_vts`): wait one before the first.
const tick = () => new Promise((r) => setTimeout(r, 2))
const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}
const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]
const MANY = ['Food', 'Transport', 'Fun', 'Health', 'Home', 'Gifts', 'Travel'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}))

const button = () => document.body.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const boxes = () => Array.from(panel()!.querySelectorAll<HTMLElement>('[role="option"]'))
const resetButton = () =>
  Array.from(panel()!.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Reset')!

const mountFilter = (props: Record<string, unknown> = {}) =>
  mount(UiFilter, {
    attachTo: document.body,
    props: {
      label: 'Categories',
      items: CATEGORIES,
      modelValue: [],
      'onUpdate:modelValue': (v: SelectValue[]): Promise<void> => w.setProps({ modelValue: v }),
      ...props,
    },
  })
let w: ReturnType<typeof mountFilter>

describe('UiFilter', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('the button shows the label; the count appears once something is chosen, and is spoken', async () => {
    w = mountFilter()
    expect(button().textContent).toContain('Categories')
    expect(button().querySelector('.ui-count')).toBeNull()
    await w.setProps({ modelValue: ['food', 'fun'] })
    expect(button().querySelector('.ui-count')!.textContent?.trim()).toBe('2')
    expect(button().getAttribute('aria-label')).toBe('Categories, 2 active')
  })

  it('a tick applies at once; Reset is there but held while nothing is chosen', async () => {
    w = mountFilter()
    await tick()
    button().click()
    await settle()
    expect(resetButton().disabled).toBe(true)
    boxes()[1]!.click()
    await settle()
    expect(w.props('modelValue')).toEqual(['transport'])
    expect(resetButton().disabled).toBe(false)
    resetButton().click()
    await settle()
    expect(w.props('modelValue')).toEqual([])
    expect(w.emitted('reset')).toHaveLength(1)
  })

  it('five options have no search; from six a search narrows the list and says when nothing is found', async () => {
    w = mountFilter()
    await tick()
    button().click()
    await settle()
    expect(panel()!.querySelector('input')).toBeNull()
    w.unmount()
    document.body.innerHTML = ''
    w = mountFilter({ items: MANY })
    await tick()
    button().click()
    await settle()
    const search = panel()!.querySelector<HTMLInputElement>('input')!
    search.value = 'tr'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(boxes().map((b) => b.textContent?.trim())).toEqual(['Transport', 'Travel'])
    search.value = 'zzz'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(boxes()).toHaveLength(0)
    expect(panel()!.textContent).toContain('Nothing found')
  })

  it('Enter in the search does not submit a form around the filter', async () => {
    w = mountFilter({ items: MANY })
    await tick()
    button().click()
    await settle()
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    panel()!.querySelector('input')!.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })

  it('"Nothing found" goes to a status region that is always there', async () => {
    w = mountFilter({ items: MANY })
    await tick()
    button().click()
    await settle()
    const status = panel()!.querySelector('[role="status"]')!
    expect(status.textContent?.trim()).toBe('')
    const search = panel()!.querySelector<HTMLInputElement>('input')!
    search.value = 'zzz'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(panel()!.querySelector('[role="status"]')).toBe(status)
    expect(status.textContent?.trim()).toBe('Nothing found')
  })

  it('stands on the control ladder like the rest of the toolbar row', () => {
    w = mountFilter({ size: 'md' })
    expect(button().className).toContain('h-11')
  })

  it('loading holds the rows', async () => {
    w = mountFilter({ loading: true })
    await tick()
    button().click()
    await settle()
    expect(boxes().every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true)
  })

  it('several dimensions: sections of lists, the count from the host, Reset asks the host', async () => {
    const status = ['paid']
    const channel = ['web', 'kiosk']
    w = mount(UiFilter, {
      attachTo: document.body,
      props: { label: 'Filters', count: Number(status.length > 0) + Number(channel.length > 0) },
      slots: {
        default: () => [
          h(UiCard, null, () =>
            h(UiFilterList, {
              items: [{ value: 'paid', label: 'Paid' }],
              modelValue: status,
              ariaLabel: 'Status',
            }),
          ),
          h(UiCard, null, () =>
            h(UiFilterList, {
              ariaLabel: 'Channel',
              items: [
                { value: 'web', label: 'Web' },
                { value: 'kiosk', label: 'Kiosk' },
              ],
              modelValue: channel,
            }),
          ),
        ],
      },
    })
    expect(button().querySelector('.ui-count')!.textContent?.trim()).toBe('2')
    await tick()
    button().click()
    await settle()
    expect(panel()!.querySelectorAll('h2, h3, h4')).toHaveLength(0)
    expect(boxes().filter((b) => b.getAttribute('aria-selected') === 'true')).toHaveLength(3)
    const groups = Array.from(panel()!.querySelectorAll('[role="listbox"]'))
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Status', 'Channel'])
    resetButton().click()
    expect(w.emitted('reset')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

// The sections are drawn, and checked, once the panel opens.
const openSections = async (slot: () => unknown) => {
  const m = mount(UiFilter, {
    attachTo: document.body,
    props: { label: 'Filters', count: 0 },
    slots: { default: slot as () => never },
  })
  await tick()
  button().click()
  await settle()
  return m
}

describe('UiFilter — no heading', () => {
  it('a section with a title warns in dev: the button names the panel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const list = () => h(UiFilterList, { items: [{ value: 'a', label: 'A' }], modelValue: [] })
    const titled = await openSections(() => [h(UiCard, { title: 'Status' }, list)])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a section has a title'))
    titled.unmount()
    warn.mockClear()
    const plain = await openSections(() => [h(UiCard, null, list)])
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('a section has a title'))
    plain.unmount()
    warn.mockRestore()
  })
})

describe('UiFilter — review follow-ups', () => {
  const items = [{ value: 'a', label: 'A' }]
  it('extra attributes (data-testid, class) reach the trigger button, not the panel', () => {
    const w = mount(UiFilter, {
      attachTo: document.body,
      props: { label: 'Status', items },
      attrs: { 'data-testid': 'status-filter', class: 'w-32' },
    })
    const btn = w.find('button[data-testid="status-filter"]')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('w-32')
    expect(document.querySelector('[role="dialog"][data-testid]')).toBeNull()
    w.unmount()
  })

  it('warns in dev when items or v-model are given alongside sections, and when loading is', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiFilter, {
      props: { label: 'Filters', count: 0, items, modelValue: ['a'], loading: true },
      slots: { default: () => h(UiCard, null, () => 'x') },
    })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('with sections they do nothing'))).toBe(true)
    expect(said.some((m) => m.includes('pass it to each UiFilterList'))).toBe(true)
    warn.mockRestore()
  })

  it('a titled section wrapped in v-for still warns in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = await openSections(() => [
      h(Fragment, null, [h(UiCard, { title: 'Status' }, () => 'x')]),
    ])
    m.unmount()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('a section has a title'))).toBe(true)
    warn.mockRestore()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })
  const open = async () => {
    await tick()
    button().click()
    await settle()
  }
  const mark = () => button().querySelector<HTMLElement>('[data-slot="mark"]')!

  it('the funnel and the count share one fixed slot, so the width holds', async () => {
    w = mountFilter()
    expect(mark().classList).toContain('w-5')
    expect(mark().querySelector('svg')).not.toBeNull()
    expect(button().querySelectorAll('svg')).toHaveLength(2)
    await w.setProps({ modelValue: ['food'] })
    expect(mark().classList).toContain('w-5')
    expect(mark().querySelector('.ui-count')!.textContent?.trim()).toBe('1')
    // A pale plate, not a filled dot that reads as a notification.
    expect(mark().querySelector('.ui-count')!.className).not.toMatch(/solid/)
    // The glyph gave its place to the count: only the chevron is left.
    expect(button().querySelectorAll('svg')).toHaveLength(1)
  })

  it('a count above 9 reads 9+ and is spoken exactly', async () => {
    w = mountFilter({ items: MANY, modelValue: MANY.map((m) => m.value).concat('a', 'b', 'c') })
    expect(mark().textContent?.trim()).toBe('9+')
    expect(button().getAttribute('aria-label')).toContain('10 active')
  })

  it('the spoken count names active filters, not ticks', () => {
    w = mount(UiFilter, {
      attachTo: document.body,
      props: { label: 'Filters', count: 2, onReset: () => {} },
      slots: {
        default: () => [
          h(UiCard, null, () => h(UiFilterList, { items: [], modelValue: [], ariaLabel: 'A' })),
        ],
      },
    })
    expect(button().getAttribute('aria-label')).toContain('2 active')
    expect(button().textContent).not.toContain('chosen')
  })

  it('Reset is in the same place before and after the first tick, held while nothing is chosen', async () => {
    w = mountFilter()
    await open()
    const place = () => Array.from(panel()!.querySelectorAll('button')).indexOf(resetButton())
    const before = place()
    expect(resetButton().disabled).toBe(true)
    boxes()[0]!.click()
    await settle()
    expect(place()).toBe(before)
    expect(resetButton().disabled).toBe(false)
  })

  it('Escape closes the panel and returns the focus to the button', async () => {
    w = mountFilter()
    await open()
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('the list is one tab stop, and Reset the next', async () => {
    const { tabbables } = await import('../composables/useFocusTrap')
    w = mountFilter({ modelValue: ['food'] })
    await open()
    const stops = tabbables(panel()!)
    expect(stops.map((el) => el.getAttribute('role') ?? el.textContent?.trim())).toEqual([
      'listbox',
      'Reset',
    ])
    w.unmount()
    document.body.innerHTML = ''
    w = mountFilter({ items: MANY, modelValue: ['food'] })
    await open()
    expect(tabbables(panel()!).map((el) => el.tagName + (el.textContent?.trim() ?? ''))).toEqual([
      'INPUT',
      'BUTTONReset',
    ])
  })

  it('a letter jumps to the next option that starts with it', async () => {
    w = mountFilter()
    await open()
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    const current = () =>
      document.getElementById(list.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true, cancelable: true }))
    await settle()
    expect(current()).toBe('Transport')
  })

  it('in the panel a search with text clears on Escape, and the panel stays open', async () => {
    w = mountFilter({ items: MANY })
    await open()
    const input = panel()!.querySelector<HTMLInputElement>('input')!
    input.value = 'fo'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(panel()).not.toBeNull()
    expect(panel()!.querySelector<HTMLInputElement>('input')!.value).toBe('')
  })

  it('a value repeated in v-model counts once', () => {
    w = mountFilter({ modelValue: ['food', 'food'] })
    expect(mark().querySelector('.ui-count')!.textContent?.trim()).toBe('1')
    expect(button().getAttribute('aria-label')).toContain('1 active')
  })

  it('a value with no option still counts, no row shows it, and Reset clears it', async () => {
    w = mountFilter({ modelValue: ['gone', 'food'] })
    expect(mark().querySelector('.ui-count')!.textContent?.trim()).toBe('2')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await open()
    expect(boxes().filter((b) => b.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    resetButton().click()
    await settle()
    expect(w.props('modelValue')).toEqual([])
    warn.mockRestore()
  })

  it('a section is checked for a title at render, never by calling the slot outside it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = await openSections(() => h(UiCard, { title: 'Status' }, () => 'x'))
    m.unmount()
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('invoked outside of the render function'))).toBe(false)
    expect(said.some((m) => m.includes('a section has a title'))).toBe(true)
    warn.mockRestore()
  })

  it('sections of the panel have a line between them', async () => {
    const list = (name: string) =>
      h(UiCard, null, () => h(UiFilterList, { items, modelValue: [], ariaLabel: name }))
    const m = await openSections(() => [list('Status'), list('Channel')])
    expect(panel()!.querySelectorAll('[role="separator"]')).toHaveLength(1)
    m.unmount()
    document.body.innerHTML = ''
  })

  it('a disabled filter does not open: the host takes it when the options failed to load', async () => {
    w = mountFilter({ disabled: true })
    await open()
    expect(button().disabled).toBe(true)
    expect(panel()).toBeNull()
    w.unmount()
    document.body.innerHTML = ''
  })

  it('opened, the focus goes to the list, or to its search from six options up', async () => {
    w = mountFilter()
    await open()
    expect(document.activeElement?.getAttribute('role')).toBe('listbox')
    w.unmount()
    document.body.innerHTML = ''
    w = mountFilter({ items: MANY })
    await open()
    expect(document.activeElement?.tagName).toBe('INPUT')
    w.unmount()
    document.body.innerHTML = ''
  })

  it('a first load shows rows in the options\' shape; a refresh keeps the options, dimmed, and says "Updating…"', async () => {
    w = mountFilter({ items: [], loading: true, modelValue: ['food'] })
    await open()
    const list = () => panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    const status = () => panel()!.querySelector('[role="status"]')!.textContent?.trim()
    expect(panel()!.querySelectorAll('[data-skeleton]').length).toBeGreaterThan(0)
    expect(status()).toBe('Loading options…')
    await w.setProps({ items: CATEGORIES })
    await settle()
    expect(panel()!.querySelectorAll('[data-skeleton]')).toHaveLength(0)
    expect(boxes()).toHaveLength(3)
    expect(list().className).toContain('opacity-60')
    expect(panel()!.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(status()).toBe('Updating…')
    w.unmount()
    document.body.innerHTML = ''
  })
})

// A long filter opens on what was chosen, at its top; any filter of three options or more keeps one
// option alone in one press.
describe('UiFilter — chosen first and only this', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const labels = () => boxes().map((b) => b.textContent?.trim())

  it('a long filter opens with the chosen options at its top', async () => {
    w = mountFilter({ items: MANY, modelValue: ['travel', 'fun'] })
    await tick()
    button().click()
    await settle()
    expect(labels()).toEqual(['Fun', 'Travel', 'Food', 'Transport', 'Health', 'Home', 'Gifts'])
  })

  it('Only on the highlighted row keeps that option alone', async () => {
    w = mountFilter({ modelValue: ['food', 'fun'] })
    await tick()
    button().click()
    await settle()
    boxes()[1]!.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
    await settle()
    panel()!.querySelector<HTMLElement>('[data-only]')!.click()
    await settle()
    expect(w.props('modelValue')).toEqual(['transport'])
  })
})
