import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import UiDateRange from './UiDateRange.vue'
import UiField from './UiField.vue'
import { focusInvalid } from '../utils/focusInvalid'
import { withGrani } from '../test/harness'
import { periodBounds, rangeFor, type RangePreset } from '../utils/dateRange'
import type { DateRangeValue } from '../types/ui'

// Vue drops a click in the very millisecond its listener was attached (`_vts`): wait one before the first.
const tick = () => new Promise((r) => setTimeout(r, 2))
const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}
type Period = { from?: string; to?: string; preset?: RangePreset | null }
// The period as the model holds it: no bound and no preset are `null`.
const period = ({ from, to, preset }: Period): DateRangeValue => ({
  from: from || null,
  to: to || null,
  preset: preset ?? null,
})
const mountRange = ({
  from = '2026-08-01',
  to = '2026-08-31',
  preset = 'prev_month',
  ...props
}: Period & Record<string, unknown> = {}) =>
  mount(UiDateRange, {
    attachTo: document.body,
    props: {
      modelValue: period({ from, to, preset }),
      'onUpdate:modelValue': (v: DateRangeValue): Promise<void> => w.setProps({ modelValue: v }),
      ...props,
    },
  })
let w: ReturnType<typeof mountRange>
const model = () => w.props('modelValue')!
const setPeriod = (p: Period) => w.setProps({ modelValue: period(p) })
// Writes down each period sent and keeps the model in step, as a `v-model` does.
const listen = (seen: unknown[]) => (p: DateRangeValue) => {
  seen.push(p)
  w.setProps({ modelValue: p })
}

const button = () => document.body.querySelector<HTMLElement>('[aria-haspopup="dialog"]')!
// What the button says, without the widths it is measured against.
const said = () => {
  const copy = button().cloneNode(true) as HTMLElement
  copy.querySelectorAll('[data-sizer]').forEach((el) => el.remove())
  return copy.textContent ?? ''
}
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const option = (name: string) =>
  Array.from(panel()!.querySelectorAll<HTMLElement>('[role="option"]')).find((o) =>
    o.textContent?.includes(name),
  )!
const custom = () =>
  Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.includes('Custom range…'),
  )!
const day = (label: string) =>
  panel()!.querySelector<HTMLElement>(`button[aria-label^="${label}"]`)!
const open = async () => {
  await tick()
  button().click()
  await settle()
}
const toCalendar = async () => {
  await open()
  custom().click()
  await settle()
  await tick()
}

// Today is fixed and the clock still runs: a frozen `Date` would freeze Vue's event clock too
// and drop every click.
// Noon on the reader's clock: a UTC noon is already the next day at +13 and +14.
const setToday = (iso: string) => vi.setSystemTime(new Date(`${iso}T12:00:00`))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true, advanceTimeDelta: 1 })
  setToday('2026-09-26')
})
afterEach(() => {
  vi.useRealTimers()
})
afterEach(() => {
  document.body.innerHTML = ''
})

describe('UiDateRange', () => {
  it('the button says the days alone: no preset name, the year only when it is not this one', async () => {
    w = mountRange()
    expect(said()?.trim()).toMatch(/Aug 1\s*–\s*31$/)
    await setPeriod({ preset: '6_months', from: '2026-04-01', to: '2026-09-30' })
    expect(said()?.trim()).toMatch(/Apr 1\s*–\s*Sep 30$/)
    await setPeriod({ preset: 'custom', from: '2025-12-20', to: '2026-01-10' })
    expect(said()).toMatch(/2025/)
    await setPeriod({ preset: 'prev_year', from: '2025-01-01', to: '2025-12-31' })
    expect(said()?.trim()).toMatch(/2025$/)
    await setPeriod({ preset: 'all', from: '', to: '' })
    expect(said()?.trim()).toMatch(/All time$/)
  })

  it('a range is spaced with plain spaces, so the server and the browser say it alike', () => {
    w = mountRange()
    expect(said()).not.toMatch(/[\u2009\u202f]/)
    expect(said()?.trim()).toMatch(/Aug 1 – 31$/)
  })

  it('each preset says the months it covers', async () => {
    w = mountRange()
    await open()
    expect(option('Last month').textContent).toContain('Aug')
    expect(option('3 months').textContent).toMatch(/Jul\s*–\s*Sep/)
    expect(option('Last year').textContent).toContain('2025')
    expect(option('All time').textContent?.trim()).toBe('All time')
  })

  it('a period of days or weeks says its days, its week starting where the locale’s does', async () => {
    // 26 September 2026 is a Saturday.
    w = mountRange()
    await open()
    expect(option('Today').textContent).toMatch(/Sep 26/)
    expect(option('This week').textContent).toMatch(/Sep 20\s*–\s*26/)
    expect(option('Last 7 days').textContent).toMatch(/Sep 20\s*–\s*26/)
    expect(option('Last 30 days').textContent).toMatch(/Aug 28\s*–\s*Sep 26/)
    option('This week').click()
    await settle()
    expect(model()).toMatchObject({ preset: 'this_week', from: '2026-09-20', to: '2026-09-26' })
    w.unmount()
    document.body.innerHTML = ''
    w = mount(UiDateRange, {
      attachTo: document.body,
      props: { modelValue: period({ preset: 'this_week' }) },
      global: { plugins: withGrani({ locale: 'ru' }) },
    })
    await settle()
    expect(said()).toMatch(/21\s*–\s*27/)
  })

  it('a preset applies at once, with the days counted from today, and closes the panel', async () => {
    w = mountRange()
    await open()
    option('This year').click()
    await settle()
    expect(model()).toMatchObject({ preset: 'this_year', ...rangeFor('this_year', '2026-09-26') })
    expect(panel()).toBeNull()
  })

  it('the chosen preset is the selected option', async () => {
    w = mountRange()
    await open()
    expect(option('Last month').getAttribute('aria-selected')).toBe('true')
    expect(option('This month').getAttribute('aria-selected')).toBe('false')
  })

  it('all time has no bounds', async () => {
    w = mountRange()
    await open()
    option('All time').click()
    await settle()
    expect(model()).toMatchObject({ preset: 'all', from: null, to: null })
  })

  it('Custom range opens the calendar on the span; two days make it custom, in either order, and close', async () => {
    w = mountRange()
    await toCalendar()
    expect(panel()!.querySelector('[role="option"]')).toBeNull()
    day('Thursday, August 20, 2026').click()
    await settle()
    expect(model().preset).toBe('prev_month')
    expect(panel()!.textContent).toContain('Now choose the last day')
    day('Monday, August 10, 2026').click()
    await settle()
    expect(model()).toMatchObject({ preset: 'custom', from: '2026-08-10', to: '2026-08-20' })
    expect(panel()).toBeNull()
  })

  it('a custom span is drawn to the pointed day and counted before the second press', async () => {
    w = mountRange()
    await toCalendar()
    day('Monday, August 10, 2026').click()
    await settle()
    day('Sunday, August 16, 2026').dispatchEvent(new Event('pointerenter'))
    await settle()
    expect(panel()!.querySelector('p[aria-hidden="true"]')!.textContent!.trim()).toBe('7 days')
    expect(model()).toMatchObject({ preset: 'prev_month', from: '2026-08-01', to: '2026-08-31' })
  })

  it('the calendar of a custom span names the days of rest in bold', async () => {
    w = mountRange()
    await toCalendar()
    const rest = [...panel()!.querySelectorAll('th.font-bold')].map((th) => th.getAttribute('abbr'))
    expect(rest).toEqual(['Sunday', 'Saturday'])
  })

  it('a period picked here gives a query its moments, the last day whole, by periodBounds', async () => {
    w = mountRange()
    await toCalendar()
    day('Saturday, August 1, 2026').click()
    await settle()
    day('Monday, August 31, 2026').click()
    await settle()
    expect(periodBounds(model(), { timeZone: 'Europe/Moscow' })).toEqual({
      start: '2026-07-31T21:00:00.000Z',
      end: '2026-08-31T21:00:00.000Z',
    })
  })

  it('the calendar shows the span: its ends and the days between are chosen', async () => {
    w = mountRange({ preset: 'custom', from: '2026-08-10', to: '2026-08-12' })
    await toCalendar()
    const chosen = Array.from(panel()!.querySelectorAll('[aria-selected="true"] button')).map((b) =>
      b.textContent?.trim(),
    )
    expect(chosen).toEqual(['10', '11', '12'])
  })

  it('a custom span checks Custom range and says its days there', async () => {
    w = mountRange({ preset: 'custom', from: '2026-08-10', to: '2026-08-12' })
    await open()
    expect(custom().textContent).toMatch(/Aug 10\s*–\s*12/)
    expect(panel()!.querySelector('[aria-selected="true"]')).toBeNull()
  })

  it('the row above the calendar goes back to the list and drops a half-made span', async () => {
    w = mountRange()
    await toCalendar()
    day('Thursday, August 20, 2026').click()
    await settle()
    await tick()
    Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Custom range')!
      .click()
    await settle()
    expect(option('Last month')).toBeTruthy()
    expect(document.activeElement).toBe(custom())
    custom().click()
    await settle()
    expect(panel()!.textContent).not.toContain('Now choose the last day')
  })
})

describe('UiDateRange — a press on a row', () => {
  it('a preset keeps the focus where it is; Custom range, a button, takes it as a button does', async () => {
    w = mountRange()
    await open()
    // Held by the mouse press, never the pointer press, which in WebKit would end a tap in no click.
    const press = (el: Element) =>
      ['pointerdown', 'mousedown'].map((type) => {
        const ev = new Event(type, { bubbles: true, cancelable: true })
        el.dispatchEvent(ev)
        return ev.defaultPrevented
      })
    expect(press(option('This year'))).toEqual([false, true])
    expect(press(custom())).toEqual([false, false])
  })
})

describe('UiDateRange — keyboard', () => {
  it('opens on the list with the chosen preset highlighted; arrows move, Enter applies', async () => {
    w = mountRange()
    await open()
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    expect(document.activeElement).toBe(list)
    expect(list.getAttribute('aria-activedescendant')).toBe(option('Last month').id)
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await settle()
    expect(list.getAttribute('aria-activedescendant')).toBe(option('Last 30 days').id)
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await settle()
    expect(model().preset).toBe('last_30_days')
    expect(document.activeElement).toBe(button())
  })

  it('ArrowDown past the last preset reaches Custom range, ArrowUp comes back', async () => {
    w = mountRange()
    await open()
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await settle()
    expect(document.activeElement).toBe(custom())
    custom().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await settle()
    expect(document.activeElement).toBe(list)
    expect(list.getAttribute('aria-activedescendant')).toBe(option('All time').id)
  })

  it('the calendar takes the focus on its day when it opens', async () => {
    w = mountRange()
    await toCalendar()
    expect(document.activeElement?.closest('[role="grid"]')).toBeTruthy()
  })

  it('a half-made span is dropped on close: reopened, the panel is the list again', async () => {
    w = mountRange()
    await toCalendar()
    day('Thursday, August 20, 2026').click()
    await settle()
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    await open()
    expect(option('Last month')).toBeTruthy()
    expect(model().preset).toBe('prev_month')
  })
})

describe('UiDateRange — review follow-ups', () => {
  const list = () => panel()!.querySelector<HTMLElement>('[role="listbox"]')!

  it('the button is named before its days: Period by default, ariaLabel when given, on the button', async () => {
    w = mountRange()
    const nameOf = () => {
      const id = button().querySelector('.sr-only')!.id
      return document.getElementById(id)!.textContent
    }
    expect(nameOf()).toBe('Period')
    expect(button().textContent).toMatch(/Period\s*Aug 1/)
    await w.setProps({ ariaLabel: 'Paid' })
    expect(nameOf()).toBe('Paid')
    const other = mount(UiDateRange, {
      attachTo: document.body,
      props: { modelValue: { from: null, to: null, preset: 'all' } },
      attrs: { 'data-testid': 'period', class: 'ms-auto' },
    })
    const trigger = other.find('[data-testid="period"]')
    expect(trigger.element.tagName).toBe('BUTTON')
    // The toolbar places the button, never the floating panel.
    expect(trigger.classes()).toContain('ms-auto')
    other.unmount()
  })

  it('the panel is named by the same name', async () => {
    w = mountRange()
    await open()
    const id = panel()!.getAttribute('aria-labelledby')!
    expect(document.getElementById(id)?.textContent).toBe('Period')
  })

  it('a preset spanning the turn of the year says which one, in the list too', async () => {
    setToday('2026-01-15')
    w = mountRange()
    await open()
    expect(option('6 months').textContent).toMatch(/Aug 2025\s*–\s*Jan 2026/)
  })

  it('an outside change of preset while the panel is open moves the keyboard highlight too', async () => {
    w = mountRange()
    await open()
    await setPeriod({ preset: 'this_year', from: '2026-01-01', to: '2026-12-31' })
    await settle()
    expect(list().getAttribute('aria-activedescendant')).toBe(option('This year').id)
  })

  it('opening on a custom span highlights no preset, so Enter keeps the span', async () => {
    w = mountRange({ preset: 'custom', from: '2026-08-10', to: '2026-08-12' })
    await open()
    expect(list().getAttribute('aria-activedescendant')).toBeNull()
    list().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await settle()
    expect(model().preset).toBe('custom')
    list().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await settle()
    expect(list().getAttribute('aria-activedescendant')).toBe(option('Today').id)
  })

  it('a span given backwards reads as the same span', () => {
    w = mountRange({ preset: 'custom', from: '2026-08-31', to: '2026-08-01' })
    expect(button().textContent).toMatch(/Aug 1\s*–\s*31/)
  })

  it('the custom row says it is the current choice, not only by a check', async () => {
    w = mountRange({ preset: 'custom', from: '2026-08-10', to: '2026-08-12' })
    await open()
    expect(custom().getAttribute('aria-current')).toBe('true')
    await setPeriod({ preset: 'prev_month', from: '2026-08-01', to: '2026-08-31' })
    await settle()
    expect(custom().getAttribute('aria-current')).toBeNull()
  })
})

describe('UiDateRange — one period', () => {
  it('a named preset whose days went stale is re-resolved against today, on mount and across a month end', async () => {
    const seen: unknown[] = []
    w = mountRange({ 'onUpdate:modelValue': listen(seen) })
    await settle()
    // Today is Sep 26: last month is August, the model already says so.
    expect(seen).toEqual([])
    document.body.innerHTML = ''
    setToday('2026-10-02')
    w = mountRange({ 'onUpdate:modelValue': listen(seen) })
    await settle()
    expect(model()).toMatchObject({ from: '2026-09-01', to: '2026-09-30', preset: 'prev_month' })
    expect(seen).toEqual([{ from: '2026-09-01', to: '2026-09-30', preset: 'prev_month' }])
    expect(button().textContent).toMatch(/Sep 1\s*–\s*30/)
  })

  it('the day turning while the page is open counts the preset again, once', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval'], shouldAdvanceTime: true })
    setToday('2026-09-30')
    const seen: unknown[] = []
    w = mountRange({
      from: '2026-09-01',
      to: '2026-09-30',
      preset: 'this_month',
      'onUpdate:modelValue': listen(seen),
    })
    await settle()
    expect(seen).toEqual([])
    setToday('2026-10-01')
    vi.advanceTimersByTime(60_000)
    await settle()
    expect(seen).toEqual([{ from: '2026-10-01', to: '2026-10-31', preset: 'this_month' }])
  })

  it('a model that keeps only the preset hears one update a pick, and the button says the days', async () => {
    const seen: unknown[] = []
    w = mount(UiDateRange, {
      attachTo: document.body,
      props: {
        modelValue: { from: null, to: null, preset: 'this_month' },
        'onUpdate:modelValue': (p: DateRangeValue) => {
          seen.push(p)
          w.setProps({ modelValue: { from: null, to: null, preset: p.preset } })
        },
      },
    })
    await settle()
    expect(button().textContent).toMatch(/Sep 1\s*–\s*30/)
    seen.length = 0
    await open()
    option('Last month').click()
    await settle()
    expect(seen).toHaveLength(1)
    expect(button().textContent).toMatch(/Aug 1\s*–\s*31/)
  })

  it('a preset without days in the model fills them', async () => {
    w = mountRange({ from: '', to: '', preset: 'this_month' })
    await settle()
    expect(model()).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('All time given with days drops them; custom keeps its days', async () => {
    w = mountRange({ preset: 'all' })
    await settle()
    expect(model()).toMatchObject({ from: null, to: null, preset: 'all' })
    document.body.innerHTML = ''
    w = mountRange({ preset: 'custom', from: '2026-03-02', to: '2026-03-09' })
    await settle()
    expect(model()).toMatchObject({ from: '2026-03-02', to: '2026-03-09' })
  })

  it('with no preset, days are a custom span and none is All time', async () => {
    w = mountRange({ preset: null, from: '2026-03-02', to: '2026-03-09' })
    await open()
    expect(custom().getAttribute('aria-current')).toBe('true')
    document.body.innerHTML = ''
    w = mountRange({ preset: null, from: '', to: '' })
    await settle()
    expect(button().textContent).toContain('All time')
  })

  it('a span with one end says which end: From Aug 1, Until Aug 31', () => {
    w = mountRange({ preset: 'custom', from: '2026-08-01', to: '' })
    expect(button().textContent).toContain('From Aug 1')
    document.body.innerHTML = ''
    w = mountRange({ preset: 'custom', from: '', to: '2026-08-31' })
    expect(button().textContent).toContain('Until Aug 31')
  })

  it('a pick sends the whole period in one update', async () => {
    const seen: unknown[] = []
    w = mountRange({ 'onUpdate:modelValue': listen(seen) })
    await settle()
    await open()
    option('This month').click()
    await settle()
    expect(seen).toEqual([{ from: '2026-09-01', to: '2026-09-30', preset: 'this_month' }])
    await toCalendar()
    day('Sunday, September 20, 2026').click()
    await settle()
    day('Thursday, September 10, 2026').click()
    await settle()
    expect(seen.at(-1)).toEqual({ from: '2026-09-10', to: '2026-09-20', preset: 'custom' })
    expect(seen).toHaveLength(2)
  })
})

describe('UiDateRange — the panel', () => {
  it("the rows bleed by the panel's gutter, whatever card the button stands in", async () => {
    const { defineComponent, h, provide } = await import('vue')
    const { SURFACE_GUTTER } = await import('../utils/surface')
    const Card = defineComponent({
      setup(_, { slots }) {
        provide(SURFACE_GUTTER, 'surface')
        return () => slots.default?.()
      },
    })
    mount(Card, {
      attachTo: document.body,
      slots: {
        default: () => h(UiDateRange, { modelValue: { from: null, to: null, preset: 'all' } }),
      },
    })
    await open()
    const list = panel()!.querySelector('[role="listbox"]')!
    expect(list.className).toContain('-mx-overlay')
    expect(list.className).not.toContain('-mx-surface')
  })

  it('hovering a row does not scroll the list, and opening does not scroll the page', async () => {
    const spy = vi.fn()
    const proto = Element.prototype as unknown as { scrollIntoView?: () => void }
    const before = proto.scrollIntoView
    proto.scrollIntoView = spy
    try {
      w = mountRange()
      await open()
      option('3 months').dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
      await settle()
      expect(spy).not.toHaveBeenCalled()
    } finally {
      proto.scrollIntoView = before
    }
  })

  it('a preset low in the list opens in view', async () => {
    const top = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')
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
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return this.getAttribute?.('role') === 'listbox' ? 176 : 0
      },
    })
    try {
      w = mountRange({ from: '2025-01-01', to: '2025-12-31', preset: 'prev_year' })
      await open()
      await settle()
      const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
      expect(list.scrollTop).toBeGreaterThan(0)
    } finally {
      if (top) Object.defineProperty(HTMLElement.prototype, 'offsetTop', top)
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
      if (client) Object.defineProperty(Element.prototype, 'clientHeight', client)
    }
  })

  it('the list is cut at five rows and a half', async () => {
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
      w = mountRange()
      await open()
      await settle()
      const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
      // Five rows of 32 and half of the sixth: 5 * 32 + 16.
      expect(list.style.maxHeight).toContain('176px')
    } finally {
      if (top) Object.defineProperty(HTMLElement.prototype, 'offsetTop', top)
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
    }
  })

  it('closing returns the focus to the button: a preset, a custom span, Escape', async () => {
    w = mountRange()
    await open()
    option('This month').click()
    await settle()
    expect(document.activeElement).toBe(button())
    await toCalendar()
    day('Thursday, September 10, 2026').click()
    await settle()
    day('Sunday, September 20, 2026').click()
    await settle()
    expect(document.activeElement).toBe(button())
    await open()
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('a period set from outside while the calendar is half picked drops the half pick', async () => {
    w = mountRange()
    await toCalendar()
    day('Thursday, August 20, 2026').click()
    await settle()
    expect(panel()!.textContent).toContain('Now choose the last day')
    await setPeriod({ preset: 'all', from: '', to: '' })
    await settle()
    expect(panel()!.textContent).toContain('Choose the first day')
    day('Monday, August 10, 2026').click()
    await settle()
    // The first click of a new span, not the end of the old half pick.
    expect(model().preset).toBe('all')
  })

  it('the row above the calendar says it goes back', async () => {
    w = mountRange()
    await toCalendar()
    const back = Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Custom range',
    )!
    expect(back.getAttribute('aria-label')).toBe('Custom range, back to the list')
  })
})

describe('UiDateRange — its width', () => {
  it('the button stands over the widest named period, so a pick keeps its width', () => {
    w = mountRange()
    const sizers = Array.from(button().querySelectorAll<HTMLElement>('[data-sizer]'))
    const texts = sizers.map((el) => el.textContent?.trim())
    for (const t of ['All time', 'Custom range', '2026', '2025']) expect(texts).toContain(t)
    expect(texts.some((t) => /Apr 1\s*–\s*Sep 30/.test(t ?? ''))).toBe(true)
    for (const el of sizers) {
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.classList).toContain('invisible')
    }
  })
})

describe('UiDateRange — the window', () => {
  // Today is Saturday, September 26, 2026: the window runs from March 15 to today.
  const WINDOW = { min: '2026-03-15', max: '2026-09-26' }

  it('a preset wholly outside the window is disabled and the keys pass over it', async () => {
    w = mountRange({ ...WINDOW, preset: 'this_year', from: '', to: '' })
    await open()
    const last = option('Last year')
    expect(last.getAttribute('aria-disabled')).toBe('true')
    last.click()
    await settle()
    expect(model().preset).toBe('this_year')
    // From This year, down passes over Last year to All time.
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await settle()
    expect(list.getAttribute('aria-activedescendant')).toBe(option('All time').id)
    expect(option('This month').getAttribute('aria-disabled')).toBeNull()
  })

  it('a preset partly outside is cut at the bound, in the list and in what it sends', async () => {
    w = mountRange({ ...WINDOW, preset: 'all', from: '', to: '' })
    await open()
    expect(option('This month').textContent).toMatch(/Sep 1\s*–\s*26/)
    expect(option('This year').textContent).toMatch(/Mar 15\s*–\s*Sep 26/)
    option('This month').click()
    await settle()
    expect(model()).toEqual({ from: '2026-09-01', to: '2026-09-26', preset: 'this_month' })
    expect(said()).toMatch(/Sep 1\s*–\s*26/)
  })

  it('a named preset cut by the window is brought to its cut days once', async () => {
    const seen: unknown[] = []
    w = mount(UiDateRange, {
      attachTo: document.body,
      props: {
        ...WINDOW,
        modelValue: period({ from: '2026-09-01', to: '2026-09-30', preset: 'this_month' }),
        'onUpdate:modelValue': listen(seen),
      },
    })
    await settle()
    expect(seen).toEqual([{ from: '2026-09-01', to: '2026-09-26', preset: 'this_month' }])
  })

  it('from a custom span, up starts at the first preset the window lets through', async () => {
    // A window that ended with August: the days, the week and this month are past it.
    w = mountRange({ max: '2026-08-31', preset: 'custom', from: '2026-08-03', to: '2026-08-09' })
    await open()
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await settle()
    expect(list.getAttribute('aria-activedescendant')).toBe(option('Last month').id)
  })

  it('All time stays no bounds: the window limits the picks, not the question', async () => {
    w = mountRange({ ...WINDOW, preset: 'this_month' })
    await open()
    option('All time').click()
    await settle()
    expect(model()).toEqual({ from: null, to: null, preset: 'all' })
  })

  it('the calendar of a custom range takes the window', async () => {
    w = mountRange({ ...WINDOW, preset: 'this_month', from: '', to: '' })
    await toCalendar()
    expect(day('Sunday, September 27, 2026').getAttribute('aria-disabled')).toBe('true')
    expect(day('Friday, September 25, 2026').getAttribute('aria-disabled')).toBeNull()
  })
})

const arrow = (which: 'prev' | 'next') =>
  document.body.querySelector<HTMLButtonElement>(`[data-step="${which}"]`)!
const press = async (which: 'prev' | 'next') => {
  await tick()
  arrow(which).click()
  await settle()
}

describe('UiDateRange — stepper', () => {
  it('without it there are no arrows and the class stays on the button; with it, on the box of three', () => {
    w = mountRange({ class: 'w-full' })
    expect(document.body.querySelector('[data-step]')).toBeNull()
    expect(button().classList).toContain('w-full')
    w.unmount()
    w = mountRange({ class: 'w-full', stepper: true })
    const box = button().parentElement!
    expect(box.classList).toContain('w-full')
    expect(button().classList).not.toContain('w-full')
    expect(arrow('prev').getAttribute('aria-label')).toBe('Previous period')
    expect(arrow('next').getAttribute('aria-label')).toBe('Next period')
  })

  it('the arrows stand before the button, so a longer label never moves them', () => {
    w = mountRange({ stepper: true })
    const order = Array.from(button().parentElement!.querySelectorAll('button')).map(
      (b) => b.getAttribute('data-step') ?? 'period',
    )
    expect(order).toEqual(['prev', 'next', 'period'])
  })

  it('a month steps by a month, named when it lands on a preset', async () => {
    w = mountRange({ stepper: true })
    await press('prev')
    expect(model()).toEqual({ from: '2026-07-01', to: '2026-07-31', preset: 'prev_2_months' })
    await press('prev')
    expect(model()).toEqual({ from: '2026-06-01', to: '2026-06-30', preset: 'custom' })
    await press('next')
    await press('next')
    await press('next')
    expect(model()).toEqual({ from: '2026-09-01', to: '2026-09-30', preset: 'this_month' })
  })

  it('a quarter steps by three months, a year by a year, a week and a day by their days', async () => {
    w = mountRange({ stepper: true, preset: '3_months', from: '', to: '' })
    await settle()
    await press('prev')
    expect(model()).toEqual({ from: '2026-04-01', to: '2026-06-30', preset: 'custom' })
    await setPeriod({ preset: 'this_year' })
    await settle()
    await press('prev')
    expect(model()).toEqual({ from: '2025-01-01', to: '2025-12-31', preset: 'prev_year' })
    // Saturday, September 26: an English week runs from Sunday the 20th.
    await setPeriod({ preset: 'this_week' })
    await settle()
    await press('prev')
    expect(model()).toEqual({ from: '2026-09-13', to: '2026-09-19', preset: 'custom' })
    await setPeriod({ preset: 'today' })
    await settle()
    await press('prev')
    expect(model()).toEqual({ from: '2026-09-25', to: '2026-09-25', preset: 'yesterday' })
    await setPeriod({ preset: 'custom', from: '2026-09-10', to: '2026-09-14' })
    await press('next')
    expect(model()).toEqual({ from: '2026-09-15', to: '2026-09-19', preset: 'custom' })
  })

  it('All time and one bound have nowhere to step', async () => {
    w = mountRange({ stepper: true, preset: 'all', from: '', to: '' })
    await settle()
    expect(arrow('prev').disabled).toBe(true)
    expect(arrow('next').disabled).toBe(true)
    await setPeriod({ preset: 'custom', from: '2026-09-01', to: '' })
    await settle()
    expect(arrow('prev').disabled).toBe(true)
    expect(arrow('next').disabled).toBe(true)
  })

  it('the window stops an arrow, and a step that reaches past it is cut', async () => {
    w = mountRange({ stepper: true, max: '2026-09-26', preset: 'this_month', from: '', to: '' })
    await settle()
    // This month cut at today: there is no month after it to reach.
    expect(arrow('next').disabled).toBe(true)
    await press('prev')
    expect(model()).toEqual({ from: '2026-08-01', to: '2026-08-31', preset: 'prev_month' })
    // Back into September, cut at today: the days of This month, so it is This month again.
    await press('next')
    expect(model()).toEqual({ from: '2026-09-01', to: '2026-09-26', preset: 'this_month' })
  })

  it('the focus stays on the arrow and the new days are said', async () => {
    w = mountRange({ stepper: true })
    arrow('prev').focus()
    await press('prev')
    expect(document.activeElement).toBe(arrow('prev'))
    await new Promise((r) => setTimeout(r, 120))
    expect(document.getElementById('ui-announcer')?.textContent).toMatch(/Jul 1\s*–\s*31/)
  })
})

describe('UiDateRange — stepper and window, review follow-ups', () => {
  it('the arrow that turns off at the window hands the focus to the button', async () => {
    w = mountRange({ stepper: true, max: '2026-09-26', min: '2026-08-01' })
    await settle()
    arrow('next').focus()
    await press('next')
    expect(arrow('next').disabled).toBe(true)
    expect(document.activeElement).toBe(button())
    arrow('prev').focus()
    await press('prev')
    expect(arrow('prev').disabled).toBe(true)
    expect(document.activeElement).toBe(button())
  })

  it('a window set after mount brings a named preset’s days to it', async () => {
    w = mountRange({ preset: 'this_month', from: '2026-09-01', to: '2026-09-30' })
    await settle()
    await w.setProps({ max: '2026-09-10' })
    await settle()
    expect(model()).toEqual({ from: '2026-09-01', to: '2026-09-10', preset: 'this_month' })
  })

  it('a language whose week starts elsewhere brings This week’s days to it', async () => {
    const locale = ref('en')
    const seen: DateRangeValue[] = []
    w = mount(UiDateRange, {
      attachTo: document.body,
      props: {
        modelValue: period({ preset: 'this_week', from: '2026-09-20', to: '2026-09-26' }),
        'onUpdate:modelValue': listen(seen),
      },
      global: { plugins: withGrani({ locale }) },
    })
    await settle()
    locale.value = 'ru'
    await settle()
    expect(model()).toEqual({ from: '2026-09-21', to: '2026-09-27', preset: 'this_week' })
  })

  it('a model put back on old days after a pick is brought to today again', async () => {
    w = mountRange()
    await open()
    option('This month').click()
    await settle()
    await setPeriod({ preset: 'this_month', from: '2026-08-01', to: '2026-08-31' })
    await settle()
    expect(model()).toEqual({ from: '2026-09-01', to: '2026-09-30', preset: 'this_month' })
  })

  it('with the arrows, the three are a group named as the button is', () => {
    w = mountRange({ stepper: true, ariaLabel: 'Issued' })
    const box = button().parentElement!
    expect(box.getAttribute('role')).toBe('group')
    const by = box.getAttribute('aria-labelledby')!
    expect(document.getElementById(by)?.textContent).toBe('Issued')
  })

  it('a chosen preset outside the window is not highlighted on open', async () => {
    w = mountRange({ min: '2026-01-01', max: '2026-08-31', preset: 'this_month', from: '', to: '' })
    await open()
    const list = panel()!.querySelector<HTMLElement>('[role="listbox"]')!
    expect(list.getAttribute('aria-activedescendant')).toBeNull()
  })

  it('a step back and forth keeps the preset it started from when two share the days', async () => {
    // Saturday, September 26: Last 7 days and an English week are both September 20 to 26.
    w = mountRange({ stepper: true, preset: 'last_7_days', from: '', to: '' })
    await settle()
    await press('prev')
    await press('next')
    expect(model().preset).toBe('last_7_days')
  })

  it('a bound that is no day is ignored, and said in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    w = mountRange({ min: '2026-9-1' })
    await settle()
    expect(warn.mock.calls.some(([m]) => String(m).includes('UiDateRange: min'))).toBe(true)
  })
})

describe('UiDateRange — in a field', () => {
  const inField = (props: Record<string, unknown> = {}) =>
    mount(UiField, {
      props: { label: 'Contract period', ...props },
      slots: {
        default: () =>
          h(UiDateRange, {
            modelValue: period({ from: '2026-08-01', to: '2026-08-31', preset: 'custom' }),
          }),
      },
      attachTo: document.body,
    })

  it('the field names the button before its days, and its error marks it and lands the focus on it', () => {
    const f = inField({ error: 'Pick a period' })
    const button = f.find('button')
    expect((f.find('label').element as HTMLLabelElement).control).toBe(button.element)
    const name = (button.attributes('aria-labelledby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(name[0]).toBe('Contract period')
    expect(name).not.toContain('Period')
    expect(button.attributes('aria-invalid')).toBe('true')
    expect(button.attributes('aria-describedby')).toBeTruthy()
    expect(button.attributes('aria-required')).toBeUndefined()
    expect(focusInvalid(f.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(button.element)
    f.unmount()
  })

  it('a required field says required in words on the button', () => {
    const f = inField({ required: true })
    const said = (f.find('button').attributes('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(said).toContain('required')
    f.unmount()
  })

  it('a click on the field label opens the panel, named by the label', async () => {
    const f = inField()
    await tick()
    ;(f.find('label').element as HTMLLabelElement).click()
    await settle()
    expect(f.find('button').attributes('aria-expanded')).toBe('true')
    const dialog = document.querySelector('[role="dialog"]')!
    const named = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '')
    expect(named?.textContent?.trim()).toBe('Contract period')
    f.unmount()
  })
})

describe('UiDateRange — in a field, review follow-ups', () => {
  const field = (label: string, props: Record<string, unknown> = {}, fieldProps = {}) =>
    h(UiField, { label, ...fieldProps }, () =>
      h(UiDateRange, {
        modelValue: period({ from: '2026-08-01', to: '2026-08-31', preset: 'custom' }),
        ...props,
      }),
    )

  it('outside a field, the caller’s aria-labelledby reaches the button', () => {
    w = mount(UiDateRange, { attachTo: document.body, attrs: { 'aria-labelledby': 'mine' } })
    expect(button().getAttribute('aria-labelledby')).toBe('mine')
  })

  it('in a field with an error the button is marked invalid, with the stepper’s class on its box', () => {
    const f = mount(
      {
        render: () =>
          field('Billing period', { stepper: true, class: 'ms-2' }, { error: 'Pick the days' }),
      },
      { attachTo: document.body },
    )
    const box = button().parentElement!
    expect(box.classList).toContain('ms-2')
    expect(button().hasAttribute('data-invalid')).toBe(true)
    expect(button().getAttribute('aria-invalid')).toBe('true')
    f.unmount()
  })

  it('two steppers in two fields are two groups, each named by its field', () => {
    const f = mount(
      { render: () => [field('Issued', { stepper: true }), field('Paid', { stepper: true })] },
      { attachTo: document.body },
    )
    const names = Array.from(document.body.querySelectorAll('[role="group"]')).map((g) =>
      document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent?.trim(),
    )
    expect(names).toEqual(['Issued', 'Paid'])
    f.unmount()
  })
})

describe('UiDateRange — review follow-ups', () => {
  it('disabled: the button and both arrows are disabled, and an arrow sends no period', async () => {
    w = mountRange({ stepper: true, disabled: true })
    const parts = Array.from(button().parentElement!.querySelectorAll('button'))
    expect(parts.map((b) => b.disabled)).toEqual([true, true, true])
    await press('prev')
    await press('next')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await open()
    expect(panel()).toBeNull()
  })

  it('disabled without the arrows disables the button alone', async () => {
    w = mountRange({ disabled: true })
    expect(button().hasAttribute('disabled')).toBe(true)
    await open()
    expect(panel()).toBeNull()
  })

  it('disabling closes an open panel', async () => {
    w = mountRange()
    await open()
    expect(panel()).not.toBeNull()
    await w.setProps({ disabled: true })
    await settle()
    expect(panel()).toBeNull()
  })
})
