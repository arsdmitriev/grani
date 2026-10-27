import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { SURFACE_GUTTER } from '../utils/surface'
import UiFilterList from './UiFilterList.vue'

const ITEMS = [
  { value: 'food', label: 'Food' },
  { value: 'fun', label: 'Fun' },
  { value: 'home', label: 'Home' },
]
const MANY = ['Food', 'Transport', 'Fun', 'Health', 'Home', 'Gifts', 'Travel'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}))
const options = (w: ReturnType<typeof mount>) => w.findAll('[role="option"]')
const selected = (w: ReturnType<typeof mount>) =>
  options(w).map((o) => o.attributes('aria-selected'))
const key = (el: { trigger: (e: string, o: object) => Promise<void> }, k: string) =>
  el.trigger('keydown', { key: k })

describe('UiFilterList', () => {
  it('a multiselect listbox of options ticked by the model; a click adds, a second removes', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['fun'], ariaLabel: 'Cats' },
    })
    const list = w.find('[role="listbox"]')
    expect(list.attributes('aria-multiselectable')).toBe('true')
    expect(list.attributes('aria-label')).toBe('Cats')
    expect(selected(w)).toEqual(['false', 'true', 'false'])
    await options(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual([['fun', 'food']])
    await options(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')![1]).toEqual([[]])
  })

  it('keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps', async () => {
    const w = mount(UiFilterList, { props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats' } })
    const list = w.find('[role="listbox"]')
    expect(list.attributes('tabindex')).toBe('0')
    await list.trigger('focus')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    await key(list, 'ArrowDown')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[1]!.attributes('id'))
    await key(list, 'Enter')
    expect(w.emitted('update:modelValue')![0]).toEqual([['fun']])
    await key(list, 'End')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[2]!.attributes('id'))
    await key(list, ' ')
    expect(w.emitted('update:modelValue')![1]).toEqual([['home']])
    await key(list, 'Home')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    await key(list, 'h')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[2]!.attributes('id'))
  })

  it('a press on a row takes neither the focus nor a text selection; the highlight follows the pointer', async () => {
    const w = mount(UiFilterList, { props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats' } })
    // Held by the mouse press, never the pointer press, which in WebKit would end a tap in no click.
    const pointer = new Event('pointerdown', { bubbles: true, cancelable: true })
    options(w)[1]!.element.dispatchEvent(pointer)
    expect(pointer.defaultPrevented).toBe(false)
    const mouse = new Event('mousedown', { bubbles: true, cancelable: true })
    options(w)[1]!.element.dispatchEvent(mouse)
    expect(mouse.defaultPrevented).toBe(true)
    expect(options(w)[1]!.classes()).toContain('select-none')
    await options(w)[2]!.trigger('pointermove')
    expect(options(w)[2]!.classes()).toContain('bg-surface-muted')
  })

  it('a fixed option is shown ticked or not as it is, with its note, and is not ticked or reached', async () => {
    const w = mount(UiFilterList, {
      props: {
        items: [{ value: 'name', label: 'Name', disabled: true, description: 'always' }, ...ITEMS],
        modelValue: ['name'],
        ariaLabel: 'Columns',
      },
    })
    expect(options(w)[0]!.attributes('aria-disabled')).toBe('true')
    expect(options(w)[0]!.text()).toContain('always')
    await options(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const list = w.find('[role="listbox"]')
    await list.trigger('focus')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[1]!.attributes('id'))
  })

  it('from six options a search row narrows the list; it keeps the focus and Enter ticks the first match', async () => {
    const w = mount(UiFilterList, { props: { items: MANY, modelValue: [], ariaLabel: 'Cats' } })
    const search = w.find('input')
    expect(w.find('[role="listbox"]').attributes('tabindex')).toBe('-1')
    await search.setValue('tr')
    expect(options(w).map((o) => o.text())).toEqual(['Transport', 'Travel'])
    expect(search.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    search.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')![0]).toEqual([['transport']])
    await search.setValue('zzz')
    expect(options(w)).toHaveLength(0)
    expect(w.find('[role="status"]').text()).toBe('Nothing found')
  })

  it('the highlight starts on the first ticked row, as a select opens on its value', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['home'], ariaLabel: 'Cats' },
    })
    const list = w.find('[role="listbox"]')
    await list.trigger('focus')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[2]!.attributes('id'))
  })

  it('back at the first row it is in view again: rows are measured from the list, which scrolls', async () => {
    const w = mount(UiFilterList, {
      attachTo: document.body,
      props: { items: MANY, modelValue: [], ariaLabel: 'Cats' },
    })
    const list = w.find('[role="listbox"]').element as HTMLElement
    expect(list.classList.contains('relative')).toBe(true)
    Object.defineProperty(list, 'clientHeight', { value: 64, configurable: true })
    w.findAll('[role="option"]').forEach((o, i) => {
      Object.defineProperty(o.element, 'offsetTop', { value: i * 32, configurable: true })
      Object.defineProperty(o.element, 'offsetHeight', { value: 32, configurable: true })
    })
    const search = w.find('input')
    for (let i = 0; i < 7; i++) await search.trigger('keydown', { key: 'ArrowDown' })
    expect(list.scrollTop).toBe(6 * 32 + 32 - 64)
    for (let i = 0; i < 6; i++) await search.trigger('keydown', { key: 'ArrowUp' })
    expect(list.scrollTop).toBe(0)
    w.unmount()
  })

  it('loading holds every row', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats', loading: true },
    })
    expect(options(w).every((o) => o.attributes('aria-disabled') === 'true')).toBe(true)
    await options(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a refresh keeps the options in view, dimmed and busy, with no rows of skeleton', () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats', loading: true },
    })
    expect(w.find('[role="listbox"]').classes()).toContain('opacity-60')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.findAll('[data-skeleton]')).toHaveLength(0)
    expect(w.find('[role="status"]').text()).toBe('Updating…')
  })

  it('a first load draws rows in the options\' shape and says it loads, never "Nothing found"', () => {
    const w = mount(UiFilterList, {
      props: { items: [], modelValue: [], ariaLabel: 'Cats', loading: true },
    })
    const rows = w.findAll('[data-skeleton]')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.attributes('aria-hidden') === 'true')).toBe(true)
    expect(w.text()).not.toContain('Nothing found')
    expect(w.find('[role="status"]').text()).toBe('Loading options…')
    expect(w.find('[role="listbox"]').classes()).not.toContain('opacity-60')
  })

  it('rows run across the surface: the list bleeds through the gutter it is given, and reaches the edges', () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats' },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'surface' } },
    })
    expect(w.find('[role="listbox"]').classes()).toContain('-mx-surface')
    const alone = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: [], ariaLabel: 'Cats' },
    })
    expect(alone.find('[role="listbox"]').classes()).not.toContain('-mx-surface')
    expect(options(w)[0]!.classes()).toEqual(expect.arrayContaining(['px-3', 'py-1.5']))
    expect(w.attributes('data-list-top')).toBeDefined()
    expect(w.attributes('data-list-bottom')).toBeDefined()
  })
})

describe('UiFilterList — review follow-ups', () => {
  const many = ['Food', 'Fun', 'Gifts', 'Home', 'Rent', 'Travel'].map((l) => ({
    value: l.toLowerCase(),
    label: l,
  }))

  it('a searchable list with a chosen value highlights it on open even though the search field takes the initial focus', async () => {
    const w = mount(UiFilterList, {
      props: { items: many, modelValue: ['rent'], ariaLabel: 'Tags' },
    })
    await w.vm.$nextTick()
    const input = w.find('input')
    const rent = w.findAll('[role="option"]').find((o) => o.text() === 'Rent')!
    expect(input.attributes('aria-activedescendant')).toBe(rent.attributes('id'))
  })

  it('the search field clears its own text on Escape, keeping the popover open, before Escape can close it', async () => {
    const w = mount(UiFilterList, {
      props: { items: many, modelValue: [], ariaLabel: 'Tags' },
      attachTo: document.body,
    })
    const input = w.find('input')
    await input.setValue('fo')
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    const outside = vi.fn()
    document.body.addEventListener('keydown', outside)
    input.element.dispatchEvent(esc)
    await w.vm.$nextTick()
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(outside).not.toHaveBeenCalled()
    input.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(outside).toHaveBeenCalledTimes(1)
    document.body.removeEventListener('keydown', outside)
    w.unmount()
  })

  it('the cross empties the search and keeps the focus in it', async () => {
    const w = mount(UiFilterList, {
      props: { items: many, modelValue: [], ariaLabel: 'Tags' },
      attachTo: document.body,
    })
    await w.find('input').setValue('fo')
    await w.find('button[aria-label="Clear"]').trigger('click')
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('an Enter that confirms an IME composition in the search field does not toggle the active row', async () => {
    const w = mount(UiFilterList, { props: { items: many, modelValue: [], ariaLabel: 'Tags' } })
    const input = w.find('input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('when the options drop under six while the search holds text and focus, the text goes and the focus stays in the list', async () => {
    const w = mount(UiFilterList, {
      props: { items: many, modelValue: [], ariaLabel: 'Tags' },
      attachTo: document.body,
    })
    const input = w.find('input')
    ;(input.element as HTMLElement).focus()
    await input.setValue('Travel')
    await w.setProps({ items: many.slice(0, 5) })
    expect(w.find('input').exists()).toBe(false)
    expect(options(w)).toHaveLength(5)
    expect(document.activeElement).toBe(w.find('[role="listbox"]').element)
    w.unmount()
  })

  it('options that arrive with six or more while the list holds the focus hand the focus to the search', async () => {
    const w = mount(UiFilterList, {
      props: { items: [], modelValue: [], loading: true, ariaLabel: 'Tags' },
      attachTo: document.body,
    })
    ;(w.find('[role="listbox"]').element as HTMLElement).focus()
    await w.setProps({ items: many, loading: false })
    const input = w.find('input')
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(options(w)[1]!.attributes('id'))
    w.unmount()
  })

  it('when the options shrink under the highlight, it still names a drawn row and Enter ticks it', async () => {
    const w = mount(UiFilterList, { props: { items: many, modelValue: [], ariaLabel: 'Tags' } })
    const input = w.find('input')
    for (let i = 0; i < 5; i++) await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(options(w)[5]!.attributes('id'))
    await w.setProps({ items: many.slice(0, 3) })
    const list = w.find('[role="listbox"]')
    const id = list.attributes('aria-activedescendant')
    expect(id).toBe(options(w)[2]!.attributes('id'))
    await list.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')![0]).toEqual([['gifts']])
  })

  it('after the search is cleared the highlight is on a row again, and Enter ticks it', async () => {
    const w = mount(UiFilterList, {
      props: { items: many, modelValue: ['home'], ariaLabel: 'Tags' },
      attachTo: document.body,
    })
    const input = w.find('input')
    await input.setValue('Tra')
    await input.trigger('keydown', { key: 'Escape' })
    const home = options(w).find((o) => o.text() === 'Home')!
    expect(input.attributes('aria-activedescendant')).toBe(home.attributes('id'))
    await input.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')![0]).toEqual([[]])
    w.unmount()
  })

  it('the search finds an option by its keywords', async () => {
    const items = [...many, { value: 'cafe', label: 'Eating out', keywords: 'restaurant' }]
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Tags' } })
    await w.find('input').setValue('restau')
    expect(options(w).map((o) => o.text())).toEqual(['Eating out'])
  })

  it('the same letter pressed again goes on to the next option that starts with it', async () => {
    const items = ['Food', 'Transport', 'Travel', 'Taxes'].map((l) => ({ value: l, label: l }))
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Tags' } })
    const list = w.find('[role="listbox"]')
    const lit = () => list.attributes('aria-activedescendant')
    await key(list, 't')
    expect(lit()).toBe(options(w)[1]!.attributes('id'))
    await key(list, 't')
    expect(lit()).toBe(options(w)[2]!.attributes('id'))
    await key(list, 't')
    expect(lit()).toBe(options(w)[3]!.attributes('id'))
    await key(list, 't')
    expect(lit()).toBe(options(w)[1]!.attributes('id'))
    // Slow, past the half second that gathers letters into a word: still the next.
    vi.useFakeTimers()
    vi.advanceTimersByTime(600)
    await key(list, 't')
    vi.useRealTimers()
    expect(lit()).toBe(options(w)[2]!.attributes('id'))
  })

  it('a doubled letter that begins the highlighted label stays on it', async () => {
    const items = ['Llama', 'Lima', 'Lisbon', 'Oslo'].map((l) => ({ value: l, label: l }))
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Tags' } })
    const list = w.find('[role="listbox"]')
    await key(list, 'End')
    await key(list, 'l')
    await key(list, 'l')
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
  })

  it('Home, End and a letter pass over a fixed option in the middle', async () => {
    const items = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta', disabled: true },
      { value: 'c', label: 'Bravo' },
      { value: 'd', label: 'Delta', disabled: true },
    ]
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Tags' } })
    const list = w.find('[role="listbox"]')
    const lit = () => list.attributes('aria-activedescendant')
    await key(list, 'End')
    expect(lit()).toBe(options(w)[2]!.attributes('id'))
    await key(list, 'Home')
    expect(lit()).toBe(options(w)[0]!.attributes('id'))
    await key(list, 'b')
    expect(lit()).toBe(options(w)[2]!.attributes('id'))
  })

  it('Space in the search types and ticks nothing', async () => {
    const w = mount(UiFilterList, { props: { items: many, modelValue: [], ariaLabel: 'Tags' } })
    const input = w.find('input')
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    input.element.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('an Enter Safari sends to confirm a composition (keyCode 229) ticks nothing', async () => {
    const w = mount(UiFilterList, { props: { items: many, modelValue: [], ariaLabel: 'Tags' } })
    const input = w.find('input')
    await input.trigger('keydown', { key: 'Enter', keyCode: 229 })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('an Enter inside a form ticks and never submits it', async () => {
    const submit = vi.fn((e: Event) => e.preventDefault())
    const w = mount(
      {
        components: { UiFilterList },
        template:
          '<form @submit="submit"><UiFilterList :model-value="[]" :items="items" aria-label="Tags" /></form>',
        setup: () => ({ items: ITEMS, submit }),
      },
      { attachTo: document.body },
    )
    const list = w.find('[role="listbox"]')
    await list.trigger('focus')
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    list.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(submit).not.toHaveBeenCalled()
    w.unmount()
  })

  it('values 0 and an empty string are options of their own', async () => {
    const items = [
      { value: 0, label: 'None' },
      { value: '', label: 'Blank' },
    ]
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Tags' } })
    await options(w)[0]!.trigger('click')
    await w.setProps({ modelValue: [0] })
    await options(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([[0, '']])
    expect(selected(w)).toEqual(['true', 'false'])
  })

  it('two lists in one panel keep their own ids and names', () => {
    const w = mount({
      components: { UiFilterList },
      template:
        '<div><UiFilterList :model-value="[]" :items="items" aria-label="Kind" /><UiFilterList :model-value="[]" :items="items" aria-label="Owner" /></div>',
      setup: () => ({ items: ITEMS }),
    })
    const lists = w.findAll('[role="listbox"]')
    expect(lists[0]!.attributes('id')).not.toBe(lists[1]!.attributes('id'))
    expect(lists.map((l) => l.attributes('aria-label'))).toEqual(['Kind', 'Owner'])
  })

  it('a list with no name warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiFilterList, { props: { items: ITEMS, modelValue: [] } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('has no name'))).toBe(true)
    warn.mockRestore()
  })

  it('options refreshed under a search that matches nothing say "Updating…", then "Nothing found"', async () => {
    const w = mount(UiFilterList, { props: { items: many, modelValue: [], ariaLabel: 'Tags' } })
    await w.find('input').setValue('zzz')
    const region = () => w.find('p[role="status"]').text()
    expect(region()).toBe('Nothing found')
    await w.setProps({ loading: true })
    expect(region()).toBe('Updating…')
    await w.setProps({ loading: false })
    expect(region()).toBe('Nothing found')
  })

  it('a chosen value missing from the options is warned in dev, naming the problem, never the value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiFilterList, { props: { items: many, modelValue: ['gone'], ariaLabel: 'Tags' } })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('not among the options'))).toBe(true)
    expect(said.some((m) => m.includes('gone'))).toBe(false)
    warn.mockRestore()
  })

  it('a chosen value is not warned while the options load for the first time, only once they come', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const lost = () => warn.mock.calls.filter((c) => String(c[0]).includes('not among the options'))
    const w = mount(UiFilterList, {
      props: { items: [], loading: true, modelValue: ['food'], ariaLabel: 'Tags' },
    })
    expect(lost()).toHaveLength(0)
    await w.setProps({ items: [{ value: 'food', label: 'Food' }], loading: false })
    expect(lost()).toHaveLength(0)
    await w.setProps({ items: [{ value: 'fun', label: 'Fun' }] })
    expect(lost()).toHaveLength(1)
    warn.mockRestore()
  })
})

describe('UiFilterList — proven claims', () => {
  it('a long list is cut at five rows and a half', async () => {
    const top = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
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
      const w = mount(UiFilterList, { props: { items: MANY, modelValue: [], ariaLabel: 'Cats' } })
      for (let i = 0; i < 3; i++) await w.vm.$nextTick()
      await new Promise((r) => setTimeout(r))
      // Five rows of 32 and half of the sixth: 5 * 32 + 16.
      expect((w.find('[role="listbox"]').element as HTMLElement).style.maxHeight).toContain('176px')
    } finally {
      if (top) Object.defineProperty(HTMLElement.prototype, 'offsetTop', top)
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
    }
  })

  it('opened in a popover, a list of six and more puts the focus in its search', async () => {
    const { default: UiPopover } = await import('./UiPopover.vue')
    const { h } = await import('vue')
    const w = mount(UiPopover, {
      attachTo: document.body,
      props: { open: true },
      slots: {
        trigger: () => h('button', { type: 'button' }, 'Category'),
        default: () => h(UiFilterList, { items: MANY, modelValue: [], ariaLabel: 'Cats' }),
      },
    })
    for (let i = 0; i < 3; i++) await w.vm.$nextTick()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect(document.activeElement?.tagName).toBe('INPUT')
    expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull()
    w.unmount()
  })
})

// A long list opens with what was chosen at its top, so it is found without scrolling; a short one
// keeps its order, which is read at a glance and may mean something (Paid, Due, Overdue). The order
// is the one the list opened with: a tick never moves a row under the pointer.
describe('UiFilterList — what was chosen stands first', () => {
  const labels = (w: ReturnType<typeof mount>) => options(w).map((o) => o.text())

  it('from six options the chosen ones open at the top, in their own order, and stay put while ticking', async () => {
    const w = mount(UiFilterList, {
      props: { items: MANY, modelValue: ['travel', 'fun'], ariaLabel: 'Cats' },
    })
    expect(labels(w)).toEqual(['Fun', 'Travel', 'Food', 'Transport', 'Health', 'Home', 'Gifts'])
    await w.setProps({ modelValue: ['travel', 'fun', 'home'] })
    expect(labels(w)).toEqual(['Fun', 'Travel', 'Food', 'Transport', 'Health', 'Home', 'Gifts'])
  })

  it('five or fewer keep their order', () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['home'], ariaLabel: 'Cats' },
    })
    expect(labels(w)).toEqual(['Food', 'Fun', 'Home'])
  })
})

// "Only" keeps one option and unticks the rest in one press: by the pointer on the row it is on,
// by Alt+Enter on the highlighted one. A fixed option stays as it is.
describe('UiFilterList — only this one', () => {
  it('Only on a row keeps it alone, and the press does not tick the row', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['food', 'fun'], ariaLabel: 'Cats' },
    })
    await options(w)[2]!.trigger('pointermove')
    const only = w.find('[data-only]')
    expect(only.attributes('data-label')).toBe('Only')
    await only.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[['home']]])
  })

  it('Alt+Enter keeps the highlighted option alone; a fixed chosen option stays', async () => {
    const items = [...ITEMS, { value: 'tax', label: 'Tax', disabled: true }]
    const w = mount(UiFilterList, {
      props: { items, modelValue: ['food', 'tax'], ariaLabel: 'Cats' },
    })
    const list = w.find('[role="listbox"]')
    expect(list.attributes('aria-keyshortcuts')).toBe('Alt+Enter')
    await list.trigger('focus')
    await key(list, 'ArrowDown')
    await list.trigger('keydown', { key: 'Enter', altKey: true })
    expect(w.emitted('update:modelValue')).toEqual([[['tax', 'fun']]])
  })
})

describe('UiFilterList — review follow-ups', () => {
  it('Only on the highlighted row follows a choice changed from outside', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['food', 'fun'], ariaLabel: 'Cats' },
    })
    await options(w)[0]!.trigger('pointermove')
    expect(options(w)[0]!.find('[data-only]').exists()).toBe(true)
    await w.setProps({ modelValue: ['food'] })
    expect(w.find('[data-only]').exists()).toBe(false)
    await w.setProps({ modelValue: ['food', 'home'] })
    expect(options(w)[0]!.find('[data-only]').exists()).toBe(true)
  })

  it('a tap ticks the row and lights it, so a touch reaches its Only', async () => {
    const w = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['food'], ariaLabel: 'Cats' },
    })
    await options(w)[2]!.trigger('click')
    await w.setProps({ modelValue: ['food', 'home'] })
    expect(options(w)[2]!.find('[data-only]').exists()).toBe(true)
  })

  it('Alt+Enter keeps nothing where no Only is offered: two options, or the one chosen alone', async () => {
    const two = mount(UiFilterList, {
      props: { items: ITEMS.slice(0, 2), modelValue: ['food', 'fun'], ariaLabel: 'Cats' },
    })
    const list = two.find('[role="listbox"]')
    await list.trigger('focus')
    await list.trigger('keydown', { key: 'Enter', altKey: true })
    expect(two.emitted('update:modelValue')).toBeUndefined()
    const alone = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['food'], ariaLabel: 'Cats' },
    })
    const box = alone.find('[role="listbox"]')
    await box.trigger('focus')
    await box.trigger('keydown', { key: 'Enter', altKey: true })
    expect(alone.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('UiFilterList — names over the chosen and the rest', () => {
  const groups = { chosen: 'Shown', rest: 'Hidden' }
  const named = (w: ReturnType<typeof mount>) => w.findAll('[data-group]').map((g) => g.text())
  it('stand only where the chosen stand first, both groups have rows, and names are given', () => {
    const many = mount(UiFilterList, {
      props: { items: MANY, modelValue: ['fun'], ariaLabel: 'Cats', groups },
    })
    expect(named(many)).toEqual(['Shown', 'Hidden'])
    const few = mount(UiFilterList, {
      props: { items: ITEMS, modelValue: ['fun'], ariaLabel: 'Cats', groups },
    })
    expect(named(few)).toEqual([])
    const none = mount(UiFilterList, {
      props: { items: MANY, modelValue: [], ariaLabel: 'Cats', groups },
    })
    expect(named(none)).toEqual([])
    const unnamed = mount(UiFilterList, {
      props: { items: MANY, modelValue: ['fun'], ariaLabel: 'Cats' },
    })
    expect(named(unnamed)).toEqual([])
  })
})

describe('UiFilterList — final review follow-ups of UiSelect', () => {
  it('a Space after letters typed over the list belongs to the word: New J reaches New Jersey', async () => {
    const items = ['New York', 'New Orleans', 'New Jersey'].map((l) => ({ value: l, label: l }))
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Cities' } })
    const list = w.find('[role="listbox"]')
    for (const k of ['n', 'e', 'w', ' ', 'j']) await key(list, k)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(list.attributes('aria-activedescendant')).toBe(options(w)[2]!.attributes('id'))
  })

  it('a search finds "Артём" typed as "артем" and "München" typed as "munchen"', async () => {
    // Six options and more get the search row.
    const items = ['Артём Орлов', 'München', 'Андрей', 'Berlin', 'Lisbon', 'Oslo'].map((l) => ({
      value: l,
      label: l,
    }))
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'People' } })
    const search = w.find('input')
    await search.setValue('артем')
    expect(options(w).map((o) => o.text())).toEqual(['Артём Орлов'])
    await search.setValue('munchen')
    expect(options(w).map((o) => o.text())).toEqual(['München'])
    await search.setValue('андреи')
    expect(options(w)).toHaveLength(0)
  })
})

describe('UiFilterList — verify follow-ups of UiSelect', () => {
  it('a Space after letters and an arrow ticks the row the arrow moved to', async () => {
    const items = ['Los Angeles', 'New York', 'New Jersey'].map((l) => ({ value: l, label: l }))
    const w = mount(UiFilterList, { props: { items, modelValue: [], ariaLabel: 'Cities' } })
    const list = w.find('[role="listbox"]')
    for (const k of ['n', 'ArrowDown', ' ']) await key(list, k)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([['New Jersey']])
  })
})
