import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import UiPagination from './UiPagination.vue'
import { RUSSIAN, withGrani } from '../test/harness'

const numbers = (w: ReturnType<typeof mount>) =>
  w
    .findAll('button')
    .filter((b) => /^\d+$/.test(b.text()))
    .map((b) => Number(b.text()))

describe('UiPagination', () => {
  it('renders nothing for a single page, for no records, and for a zero page size', () => {
    for (const props of [
      { page: 1, pageSize: 10, total: 7 },
      { page: 1, pageSize: 10, total: 0 },
      { page: 1, pageSize: 0, total: 50 },
    ]) {
      expect(mount(UiPagination, { props }).html()).toBe('<!--v-if-->')
    }
  })

  it('clamps an out-of-range target and stays silent when the page does not change', async () => {
    const w = mount(UiPagination, { props: { page: 5, pageSize: 10, total: 50 } })
    await w
      .findAll('button')
      .find((b) => b.text() === '5')!
      .trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
    // A stale page 9 of 5 renders as 5, so "previous" means 4.
    const high = mount(UiPagination, { props: { page: 9, pageSize: 10, total: 50 } })
    await high.findAll('button')[0]!.trigger('click')
    expect(high.emitted('update:page')).toEqual([[4]])
  })

  it('shows every page while they fit', () => {
    expect(numbers(mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50 } }))).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('shows the ends, a window around the current page and gaps between', () => {
    const w = mount(UiPagination, { props: { page: 10, pageSize: 10, total: 200 } })
    expect(numbers(w)).toEqual([1, 9, 10, 11, 20])
    expect(w.findAll('[aria-hidden="true"] svg')).toHaveLength(2)
  })

  it('marks the current page and emits the clicked one', async () => {
    const w = mount(UiPagination, { props: { page: 2, pageSize: 10, total: 50 } })
    const current = w.findAll('button').find((b) => b.attributes('aria-current') === 'page')
    expect(current?.text()).toBe('2')
    await w
      .findAll('button')
      .find((b) => b.text() === '4')!
      .trigger('click')
    expect(w.emitted('update:page')).toEqual([[4]])
  })

  it('previous and next move by one and are inert at the ends', async () => {
    const first = mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50 } })
    const [prev, ...rest] = first.findAll('button')
    expect(prev!.attributes('disabled')).toBeDefined()
    await rest.at(-1)!.trigger('click')
    expect(first.emitted('update:page')).toEqual([[2]])
    const last = mount(UiPagination, { props: { page: 5, pageSize: 10, total: 50 } })
    expect(last.findAll('button').at(-1)!.attributes('disabled')).toBeDefined()
  })

  it('compact shows "N / M" and only the arrows', () => {
    const w = mount(UiPagination, { props: { page: 3, pageSize: 10, total: 50, compact: true } })
    expect(w.text()).toContain('3 / 5')
    expect(w.findAll('button')).toHaveLength(2)
  })

  it('disabled holds the whole row: arrows off, numbers held but focusable, nothing asked', async () => {
    const w = mount(UiPagination, { props: { page: 2, pageSize: 10, total: 50, disabled: true } })
    const arrows = w.findAll('button[aria-label$="page"]')
    for (const b of arrows) expect(b.attributes('disabled')).toBeDefined()
    const numbers = w.findAll('button[aria-label^="Page "]')
    for (const b of numbers) {
      expect(b.attributes('disabled')).toBeUndefined()
      expect(b.attributes('aria-disabled')).toBe('true')
    }
    await numbers[0]!.trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
  })

  it('keyboard paging on a loading list keeps the focus inside the pager', async () => {
    const w = mount(UiPagination, {
      props: { page: 2, pageSize: 10, total: 50 },
      attachTo: document.body,
    })
    const three = w.findAll('button').find((b) => b.text() === '3')!
    ;(three.element as HTMLElement).focus()
    await three.trigger('click')
    await w.setProps({ page: 3, loading: true })
    await flushPromises()
    // Held, not disabled: a disabled button drops the focus in a browser, which jsdom does not.
    for (const b of w.findAll('button[aria-label^="Page "]'))
      expect(b.attributes('disabled')).toBeUndefined()
    expect(w.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('[aria-current="page"]').element)
    w.unmount()
  })

  it('names the landmark and the arrows through the dictionary', () => {
    const w = mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50 } })
    expect(w.attributes('aria-label')).toBe('Pagination')
    expect(w.findAll('button')[0]!.attributes('aria-label')).toBe('Previous page')
  })

  it('every button stands on the same step of the ladder, at every step', () => {
    const steps = [
      ['xs', 'h-7'],
      ['sm', 'h-9'],
      ['md', 'h-11'],
    ] as const
    for (const [size, cls] of steps) {
      const w = mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50, size } })
      for (const b of w.findAll('button')) expect(b.classes()).toContain(cls)
    }
    const w = mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50 } })
    for (const b of w.findAll('button')) expect(b.classes()).toContain('h-9')
  })

  it('a stale page beyond the range renders as the last page', () => {
    const w = mount(UiPagination, { props: { page: 9, pageSize: 10, total: 50 } })
    const current = w.findAll('button').find((b) => b.attributes('aria-current') === 'page')
    expect(current?.text()).toBe('5')
    expect(w.findAll('button').at(-1)!.attributes('disabled')).toBeDefined()
  })

  it('boundary 0 shows only the window around the current page', () => {
    const w = mount(UiPagination, {
      props: { page: 10, pageSize: 10, total: 200, boundary: 0, siblings: 2 },
    })
    expect(numbers(w)).toEqual([8, 9, 10, 11, 12])
  })

  it('page numbers carry no padding override that the button would ignore', () => {
    const w = mount(UiPagination, { props: { page: 1, pageSize: 10, total: 50 } })
    const num = w.findAll('button').find((b) => b.text() === '1')!
    expect(num.classes()).toContain('min-w-9')
    expect(num.classes().filter((c) => /^px-/.test(c))).toHaveLength(1)
  })
})

describe('UiPagination — review follow-ups', () => {
  const pager = (props: Record<string, unknown> = {}) =>
    mount(UiPagination, {
      props: { page: 2, pageSize: 10, total: 50, ...props } as never,
      attachTo: document.body,
    })
  const arrows = (w: ReturnType<typeof pager>) => w.findAll('button[aria-label$=" page"]')

  it('while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing', async () => {
    const w = pager()
    const [prev, next] = arrows(w)
    ;(next!.element as HTMLElement).focus()
    await next!.trigger('click')
    expect(w.emitted('update:page')).toEqual([[3]])
    await w.setProps({ loading: true })
    // Live, not disabled: a disabled button drops the focus in a browser.
    expect(next!.attributes('disabled')).toBeUndefined()
    expect(next!.attributes('aria-busy')).toBe('true')
    expect(prev!.attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(next!.element)
    await next!.trigger('click')
    expect(w.emitted('update:page')).toEqual([[3]])
    await w.setProps({ page: 3, loading: false })
    await flushPromises()
    expect(next!.attributes('aria-busy')).toBeUndefined()
    expect(document.activeElement).toBe(next!.element)
    w.unmount()
  })

  it('a load that leaves the page as it was hands nothing on later', async () => {
    const w = pager({ page: 3 })
    const next = arrows(w)[1]!
    ;(next.element as HTMLElement).focus()
    await next.trigger('click')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await flushPromises()
    ;(next.element as HTMLElement).blur()
    await w.setProps({ page: 5 })
    await flushPromises()
    expect(document.activeElement).toBe(document.body)
    w.unmount()
  })

  it('the page change is said in a status region that the wide row has too', () => {
    const w = pager({ page: 3, total: 200 })
    const region = w.find('p[role="status"]')
    expect(region.text()).toBe('Page 3 of 20')
    expect(region.classes()).toContain('sr-only')
    expect(w.find('[data-compact]').attributes('role')).toBeUndefined()
    w.unmount()
  })

  it('the compact label draws the focus ring when the focus is handed to it', () => {
    const w = pager({ compact: true })
    expect(w.find('[data-compact]').classes()).toContain(
      'focus-visible:[box-shadow:var(--ui-ring)]',
    )
    w.unmount()
  })

  it('the compact label holds the width of its widest "N / M", and the gap the numbers\' text size', () => {
    const w = pager({ page: 9, total: 200, compact: true })
    expect(w.find('[data-compact]').attributes('style')).toContain('calc(7ch + 1rem)')
    w.unmount()
    const wide = pager({ page: 9, total: 200, size: 'xs' })
    expect(wide.find('span[aria-hidden="true"].text-fg-subtle').classes()).toContain('text-xs/4.5')
    wide.unmount()
  })

  it('an infinite page stands as the last one, a negative infinite one as the first', () => {
    const last = pager({ page: Number.POSITIVE_INFINITY })
    expect(last.find('[aria-current="page"]:not([data-compact])').text()).toBe('5')
    last.unmount()
    const first = pager({ page: Number.NEGATIVE_INFINITY })
    expect(first.find('[aria-current="page"]:not([data-compact])').text()).toBe('1')
    first.unmount()
  })

  it('focus stays on the clicked number when the window recenters', async () => {
    const w = mount(UiPagination, {
      props: { page: 10, pageSize: 10, total: 200 },
      attachTo: document.body,
    })
    const eleven = w.findAll('button').find((b) => b.text() === '11')!
    ;(eleven.element as HTMLButtonElement).focus()
    await eleven.trigger('click')
    await w.setProps({ page: 11 })
    expect(document.activeElement).toBe(eleven.element)
    expect(document.body.contains(eleven.element)).toBe(true)
    w.unmount()
  })

  it('the current page is marked, not an action: no hover, a plain cursor', () => {
    const w = mount(UiPagination, { props: { page: 2, pageSize: 10, total: 50 } })
    const current = w.find('[aria-current="page"]')
    expect(current.classes()).toContain('cursor-default')
    expect(current.classes().join(' ')).not.toContain('hover:')
    const other = w.findAll('button').find((b) => b.text() === '3')!
    expect(other.classes()).toContain('enabled:hover:bg-surface-muted')
  })

  it('the compact label follows the size', () => {
    const xs = mount(UiPagination, {
      props: { page: 2, pageSize: 10, total: 50, compact: true, size: 'xs' },
    })
    expect(xs.find('span').classes()).toContain('text-xs/4.5')
  })

  it('a number pressed while its page loads shows a spinner in place of its digits and says busy', async () => {
    const w = pager({ page: 2, total: 50 })
    await w.find('button[aria-label="Page 4"]').trigger('click')
    await w.setProps({ page: 4, loading: true })
    const busy = w.find('button[aria-label="Page 4"]')
    expect(busy.attributes('aria-busy')).toBe('true')
    expect(busy.find('.ui-spinner').exists()).toBe(true)
    await w.setProps({ loading: false })
    expect(w.find('button[aria-label="Page 4"]').attributes('aria-busy')).toBeUndefined()
    w.unmount()
  })

  it('a load the pager did not ask for shows no spinner on its arrows', async () => {
    vi.useFakeTimers()
    try {
      // The app applies the page at once, and no load follows the ask.
      const w = pager({
        page: 2,
        total: 50,
        'onUpdate:page': (p: number) => void w.setProps({ page: p }),
      })
      const [, next] = arrows(w)
      await next!.trigger('click')
      vi.advanceTimersByTime(1000)
      await w.setProps({ loading: true })
      expect(w.findAll('[aria-busy="true"]')).toHaveLength(0)
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a page and a total that came as strings are read as the numbers they say', () => {
    const w = pager({ page: '3', total: '200', pageSize: '10' })
    expect(w.find('[aria-current="page"]').text()).toBe('3')
    expect(w.find('[data-compact]').text()).toContain('3 / 20')
    w.unmount()
  })

  it('a row turned off during a load hands the focus to the current page once the load ends', async () => {
    const w = pager({ page: 2, total: 50 })
    const [, next] = arrows(w)
    ;(next!.element as HTMLElement).focus()
    await next!.trigger('click')
    await w.setProps({ page: 3, loading: true })
    await w.setProps({ disabled: true })
    await w.setProps({ loading: false })
    await nextTick()
    expect(document.activeElement?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement?.textContent?.trim()).toBe('3')
    w.unmount()
  })

  it('a fractional or negative window is read as whole pages', () => {
    const shown = (props: Record<string, unknown>) => {
      const w = pager({ page: 10, total: 200, ...props })
      const n = w.findAll('button[aria-label^="Page "]').length
      w.unmount()
      return n
    }
    expect(shown({ siblings: 1.5, boundary: 0.5 })).toBe(shown({ siblings: 1, boundary: 0 }))
    expect(shown({ siblings: -1 })).toBe(shown({ siblings: 0 }))
  })
})

describe('UiPagination — focus and names', () => {
  const make = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) =>
    mount(UiPagination, {
      props: { page: 1, pageSize: 10, total: 50, ...props } as never,
      attrs,
      attachTo: document.body,
    })

  it('a NaN page stands as the first one: the previous arrow is inert, page 1 is current, and nothing is asked for it', async () => {
    const w = make({ page: Number.NaN })
    const arrows = w.findAll('button[aria-label$="page"]')
    expect(arrows[0]!.attributes('disabled')).toBeDefined()
    expect(w.find('[aria-current="page"]').text()).toBe('1')
    await w.find('[aria-current="page"]').trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
    await w
      .findAll('button')
      .find((b) => b.text() === '2')!
      .trigger('click')
    expect(w.emitted('update:page')).toEqual([[2]])
    w.unmount()
  })

  it('one target is asked once until the next tick, so two clicks are one request', async () => {
    const w = make({ page: 1 })
    const next = w.findAll('button[aria-label$="page"]')[1]!
    next.trigger('click')
    next.trigger('click')
    await flushPromises()
    expect(w.emitted('update:page')).toEqual([[2]])
    await next.trigger('click')
    expect(w.emitted('update:page')).toEqual([[2], [2]])
    w.unmount()
  })

  it('an arrow that goes inert under the focus hands the focus to the current page', async () => {
    const w = make({ page: 4 })
    const next = w.findAll('button[aria-label$="page"]')[1]!
    ;(next.element as HTMLButtonElement).focus()
    expect(document.activeElement).toBe(next.element)
    await next.trigger('click')
    expect(w.emitted('update:page')).toEqual([[5]])
    await w.setProps({ page: 5 })
    await flushPromises()
    expect(next.attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(w.find('[aria-current="page"]').element)
    w.unmount()
  })

  it('the compact label dims when the row is inert', () => {
    const on = make({ compact: true, disabled: true })
    expect(on.find('span.tabular-nums').classes()).toContain('text-disabled-fg')
    const off = make({ compact: true })
    expect(off.find('span.tabular-nums').classes()).toContain('text-fg-muted')
    on.unmount()
    off.unmount()
  })

  it("a caller's aria-label names the landmark instead of the dictionary", () => {
    const w = make({}, { 'aria-label': 'Pages of Invoices' })
    expect(w.find('nav').attributes('aria-label')).toBe('Pages of Invoices')
    w.unmount()
  })
})

describe('UiPagination — it holds still', () => {
  const pager = (props: { page: number }) =>
    mount(UiPagination, { props: { pageSize: 10, total: 200, ...props } })
  // The numbers and the gaps: every child of the row but the two arrows and "N / M".
  const slots = (w: ReturnType<typeof mount>) => w.findAll('nav > div > *').length - 3

  it('the row holds the same number of slots on every page', () => {
    const counts = [1, 2, 3, 4, 10, 17, 18, 19, 20].map((page) => slots(pager({ page })))
    expect(new Set(counts)).toEqual(new Set([7]))
  })

  it('a gap never stands for a single page', () => {
    const w = mount(UiPagination, { props: { page: 4, pageSize: 10, total: 80 } })
    expect(numbers(w)).toEqual([1, 2, 3, 4, 5, 8])
    const late = mount(UiPagination, { props: { page: 5, pageSize: 10, total: 80 } })
    expect(numbers(late)).toEqual([1, 4, 5, 6, 7, 8])
  })

  it('every number is as wide as the widest, and a four-digit total holds the arrows', () => {
    const w = mount(UiPagination, { props: { page: 1, pageSize: 1, total: 1200 } })
    const widths = w.findAll('button[aria-label^="Page "]').map((b) => b.attributes('style'))
    expect(new Set(widths).size).toBe(1)
    expect(widths[0]).toContain('4ch')
    const current = w.find('[aria-current="page"]:not([data-compact])')
    expect(current.classes()).toContain('border')
    expect(
      w.findAll('button[aria-label^="Page "]').every((b) => b.classes().includes('border')),
    ).toBe(true)
  })

  it('every number is named "Page N", and the compact label says "Page N of M"', () => {
    const w = mount(UiPagination, { props: { page: 3, pageSize: 10, total: 200 } })
    expect(w.find('[aria-current="page"]:not([data-compact])').attributes('aria-label')).toBe(
      'Page 3',
    )
    expect(w.find('[data-compact]').text()).toContain('Page 3 of 20')
  })

  it('in a narrow box the numbers give way to "N / M": its own width decides, not the screen', () => {
    const w = mount(UiPagination, { props: { page: 3, pageSize: 10, total: 200 } })
    expect(w.classes()).toContain('@container')
    const all = w.findAll('*').flatMap((n) => n.classes())
    expect(all.some((c) => /^(max-)?(sm|md|lg):/.test(c))).toBe(false)
    for (const b of w.findAll('button[aria-label^="Page "]'))
      expect(b.classes()).toEqual(expect.arrayContaining(['hidden', '@sm:inline-flex']))
    expect(w.find('[data-compact]').classes()).toContain('@sm:hidden')
    // Each step has its own threshold: the row of 44px squares needs more room.
    const md = mount(UiPagination, { props: { page: 3, pageSize: 10, total: 200, size: 'md' } })
    expect(md.find('[data-compact]').classes()).toContain('@md:hidden')
    const compact = mount(UiPagination, {
      props: { page: 3, pageSize: 10, total: 200, compact: true },
    })
    expect(compact.find('[data-compact]').classes()).not.toContain('@sm:hidden')
  })

  it('compact: an arrow that goes inert hands the focus to the label, also while disabled', async () => {
    const w = mount(UiPagination, {
      attachTo: document.body,
      props: { page: 4, pageSize: 10, total: 50, compact: true },
    })
    const next = w.findAll('button[aria-label$="page"]')[1]!
    ;(next.element as HTMLElement).focus()
    await next.trigger('click')
    await w.setProps({ page: 5, disabled: true })
    await flushPromises()
    expect(document.activeElement).toBe(w.find('[data-compact]').element)
    w.unmount()
  })

  it('a fractional page reads as a whole page, and an infinite total does not hang', () => {
    const w = mount(UiPagination, { props: { page: 2.5, pageSize: 10, total: 50 } })
    expect(w.find('[aria-current="page"]:not([data-compact])').attributes('aria-label')).toBe(
      'Page 2',
    )
    expect(mount(UiPagination, { props: { page: 1, pageSize: 10, total: Infinity } }).html()).toBe(
      '<!--v-if-->',
    )
  })

  it('the current page drawn for a stale page asks nothing when clicked', async () => {
    const w = mount(UiPagination, { props: { page: 9, pageSize: 10, total: 50 } })
    await w.find('[aria-current="page"]:not([data-compact])').trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
  })
})

// A list that asks for its first page again (a new search, a new sort) is seen and heard on it.
describe('UiPagination — back to page one', () => {
  it('a page set back to one from outside is marked current, Previous is off, and the change is said', async () => {
    const w = mount(UiPagination, { props: { page: 4, pageSize: 10, total: 60 } })
    expect(w.find('p[role="status"]').text()).toBe('Page 4 of 6')
    await w.setProps({ page: 1 })
    expect(w.find('[aria-current="page"]').text()).toBe('1')
    expect(w.find('button[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(w.find('p[role="status"]').text()).toBe('Page 1 of 6')
  })
})

describe('UiPagination — review follow-ups', () => {
  it('says the page and the count of pages in the digits of the language', () => {
    const props = { page: 3, pageSize: 25, total: 1234567 }
    const en = mount(UiPagination, { props })
    expect(en.find('p[role="status"]').text()).toBe('Page 3 of 49,383')
    expect(en.find('[data-compact] .sr-only').text()).toBe('Page 3 of 49,383')
    const ru = mount(UiPagination, { props, global: { plugins: withGrani(RUSSIAN) } })
    const total = new Intl.NumberFormat('ru').format(49383)
    expect(ru.find('p[role="status"]').text()).toBe(`Страница 3 из ${total}`)
  })
})
