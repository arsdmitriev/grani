import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import UiCalendar from './UiCalendar.vue'
import type { DateSpan } from '../types/ui'
import { RUSSIAN, withGrani } from '../test/harness'
import { tabbables } from '../composables/useFocusTrap'

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
}
const mountCal = (props: Record<string, unknown> = {}, plugins = withGrani()) =>
  mount(UiCalendar, {
    attachTo: document.body,
    props: {
      modelValue: '2026-09-24',
      'onUpdate:modelValue': (v: string | DateSpan): Promise<void> =>
        w.setProps({ modelValue: v as string }),
      ...props,
    },
    global: { plugins },
  })
let w: ReturnType<typeof mountCal>

const focused = () => (document.activeElement as HTMLElement).getAttribute('aria-label')
const key = (k: string, shiftKey = false) =>
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }),
  )
const day = (label: string) =>
  document.body.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const caption = () => w.find('[aria-live]').text()

describe('UiCalendar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the month of the value, the value picked and one focusable day marked to open on', () => {
    w = mountCal()
    expect(caption()).toBe('September 2026')
    const picked = w.find('[aria-selected="true"] button')
    expect(picked.text()).toBe('24')
    expect(picked.attributes('tabindex')).toBe('0')
    expect(picked.attributes('data-autofocus')).toBe('')
    expect(w.findAll('button[tabindex="0"]')).toHaveLength(1)
  })

  it('a grid of six weeks with weekday headers; the week starts by locale', async () => {
    const locale = ref('en')
    w = mountCal({}, withGrani({ locale }))
    expect(w.findAll('tbody tr')).toHaveLength(6)
    expect(w.find('thead th').attributes('abbr')).toBe('Sunday')
    locale.value = 'ru'
    await settle()
    expect(w.find('thead th').attributes('abbr')).toBe('понедельник')
    expect(caption()).toBe('Сентябрь 2026 г.')
  })

  it('a click picks a day; a day of the next month picks into it', async () => {
    w = mountCal()
    day('Wednesday, September 30, 2026').click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['2026-09-30'])
    day('Friday, October 2, 2026').click()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['2026-10-02'])
    expect(caption()).toBe('October 2026')
  })

  it('arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week', async () => {
    w = mountCal()
    w.find('[aria-selected="true"] button').element.dispatchEvent(new FocusEvent('focus'))
    ;(w.find('[aria-selected="true"] button').element as HTMLElement).focus()
    key('ArrowRight')
    await settle()
    expect(focused()).toBe('Friday, September 25, 2026')
    key('ArrowDown')
    await settle()
    expect(focused()).toBe('Friday, October 2, 2026')
    expect(caption()).toBe('October 2026')
    key('PageUp')
    await settle()
    expect(focused()).toBe('Wednesday, September 2, 2026')
    key('PageDown', true)
    await settle()
    expect(focused()).toBe('Thursday, September 2, 2027')
    key('Home')
    await settle()
    expect(focused()).toBe('Sunday, August 29, 2027')
    key('End')
    await settle()
    expect(focused()).toBe('Saturday, September 4, 2027')
  })

  it('days outside min and max cannot be picked', () => {
    w = mountCal({ min: '2026-09-10', max: '2026-09-25' })
    const early = day('Wednesday, September 9, 2026')
    expect(early.getAttribute('aria-disabled')).toBe('true')
    early.click()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('the caption opens the months of the year; a month opens its days', async () => {
    w = mountCal()
    await w.find('[aria-expanded]').trigger('click')
    expect(caption()).toBe('2026')
    const march = w.findAll('button').find((b) => b.text() === 'Mar')!
    await march.trigger('click')
    await settle()
    expect(caption()).toBe('March 2026')
  })

  it('today is marked as the current date, once mounted', async () => {
    w = mountCal({ modelValue: '' })
    await nextTick()
    expect(w.findAll('[aria-current="date"]')).toHaveLength(1)
  })

  // Today is the app's day, not the machine's: at 22:30 UTC it is already tomorrow in Tokyo.
  it('today is the day of the app time zone, past midnight there before UTC', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-24T22:30:00Z'))
    try {
      for (const [timeZone, date] of [
        ['Asia/Tokyo', '25'],
        ['UTC', '24'],
      ] as const) {
        w = mountCal({ modelValue: '2026-09-20' }, withGrani({ timeZone }))
        await nextTick()
        const today = w.findAll('[aria-current="date"]')
        expect(today, timeZone).toHaveLength(1)
        expect(today[0]!.text(), timeZone).toBe(date)
        w.unmount()
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('marked days carry a dot and say they are marked', () => {
    w = mountCal({ marked: ['2026-09-10'] })
    const d = day('Thursday, September 10, 2026, marked')
    expect(d.querySelector('span[aria-hidden="true"]')).not.toBeNull()
    expect(w.findAll('span.rounded-pill')).toHaveLength(1)
  })

  it('the months view: the shown month has focus, arrows move over the grid', async () => {
    w = mountCal()
    await w.find('[aria-expanded]').trigger('click')
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Sep')
    key('ArrowDown')
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Dec')
    key('Home')
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Jan')
  })

  it('PageUp from the 31st lands on the 31st again where a month has one', async () => {
    w = mountCal({ modelValue: '2026-05-31' })
    ;(w.find('[aria-selected="true"] button').element as HTMLElement).focus()
    key('PageUp')
    await settle()
    expect(focused()).toBe('Thursday, April 30, 2026')
    key('PageUp')
    await settle()
    expect(focused()).toBe('Tuesday, March 31, 2026')
  })

  it('one day is a tab stop, so a focus trap around the calendar goes round it', () => {
    w = mountCal()
    expect(tabbables(w.element as HTMLElement).filter((el) => el.closest('tbody'))).toHaveLength(1)
  })

  it('a span is one band: square inside, each end rounded on its outer side only', () => {
    w = mountCal({ range: true, modelValue: { from: '2026-09-10', to: '2026-09-12' } })
    expect(day('Thursday, September 10, 2026').className).toContain('rounded-e-none')
    expect(day('Friday, September 11, 2026').className).not.toMatch(/rounded/)
    expect(day('Saturday, September 12, 2026').className).toContain('rounded-s-none')
  })
})

describe('UiCalendar — review follow-ups', () => {
  it('a span whose second press is in another month stays on that month, the focus on the pressed day', async () => {
    w = mountCal({ range: true, modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    day('Wednesday, September 9, 2026').click()
    await settle()
    document.body.querySelector<HTMLButtonElement>('button[aria-label="Next month"]')!.click()
    await settle()
    const end = day('Monday, October 5, 2026')
    end.focus()
    end.click()
    await settle()
    expect(w.props('modelValue')).toEqual({ from: '2026-09-09', to: '2026-10-05' })
    expect(caption()).toBe('October 2026')
    expect(document.activeElement).toBe(day('Monday, October 5, 2026'))
  })

  it('a span with an end that is no day renders the month and counts nothing', () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: '2026-02-31', to: '2026-09-10' } },
    })
    expect(w.findAll('tbody button')).toHaveLength(42)
    expect(w.find('p[aria-hidden="true"]').text()).toBe('Choose the first day')
  })

  it('a pointer resting on the grid does not take the band back from the keys when the month turns', async () => {
    w = mountCal({ range: true, modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    day('Wednesday, September 9, 2026').click()
    day('Wednesday, September 9, 2026').focus()
    await settle()
    day('Sunday, September 20, 2026').dispatchEvent(new Event('pointerenter'))
    await settle()
    key('PageDown')
    await settle()
    // The month was drawn anew under a pointer that did not move: the day now under it is entered.
    document.body
      .querySelector<HTMLElement>('button[aria-label^="Tuesday, October 20, 2026"]')!
      .dispatchEvent(new Event('pointerenter'))
    await settle()
    expect(focused()).toBe('Friday, October 9, 2026, 31 days')
    document.body
      .querySelector<HTMLElement>('button[aria-label^="Tuesday, October 20, 2026"]')!
      .dispatchEvent(new Event('pointermove', { bubbles: true }))
    await settle()
    expect(document.body.querySelector('p[aria-hidden="true"]')!.textContent!.trim()).toBe(
      '42 days',
    )
  })

  it('a framed day keeps the focus halo: its frame is an outline, not a box-shadow ring', async () => {
    w = mountCal({ range: true, modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    day('Wednesday, September 9, 2026').click()
    await settle()
    day('Tuesday, September 15, 2026').dispatchEvent(new Event('pointerenter'))
    await settle()
    expect(day('Tuesday, September 15, 2026').className).not.toMatch(/\bring-/)
    w.unmount()
    w = mountCal({ modelValue: '2026-09-05', min: '2026-09-10' })
    expect(
      document.body.querySelector('button[aria-label^="Saturday, September 5"]')!.className,
    ).not.toMatch(/\bring-/)
  })

  it('a weekday column is named by its full day', () => {
    w = mountCal()
    const sunday = document.body.querySelector('thead th')!
    expect(sunday.getAttribute('aria-label')).toBe('Sunday')
    expect(sunday.textContent!.trim()).toBe('Sun')
  })

  it('a pick on a day of the next month keeps focus on that day', async () => {
    const w = mount(UiCalendar, { attachTo: document.body, props: { modelValue: '2026-09-24' } })
    const next = w
      .findAll('tbody button')
      .find((b) => b.attributes('aria-label')?.includes('October 2'))!
    ;(next.element as HTMLElement).focus()
    await next.trigger('click')
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('aria-label')).toContain('October 2')
    w.unmount()
  })

  it('a chosen day outside min and max is the disabled state, not a fade', () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-05', min: '2026-09-10' } })
    const chosen = w
      .findAll('tbody button')
      .find((b) => b.text() === '5' && b.classes().includes('font-semibold'))!
    expect(chosen.classes().some((c) => c.startsWith('opacity-'))).toBe(false)
    expect(chosen.classes()).toContain('text-disabled-fg')
  })

  it('today is not marked before mount', async () => {
    const { renderToString } = await import('vue/server-renderer')
    const { createSSRApp, h } = await import('vue')
    const html = await renderToString(
      createSSRApp({ render: () => h(UiCalendar, { modelValue: '2026-09-24' }) }),
    )
    expect(html).not.toContain('aria-current="date"')
  })

  it('the months view says which month is shown', async () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24' } })
    await w.find('[aria-expanded]').trigger('click')
    const current = w.findAll('[data-month]').filter((b) => b.attributes('aria-current') === 'true')
    expect(current).toHaveLength(1)
    expect(current[0]!.attributes('data-month')).toBe('8')
  })

  it('a range grid is multiselectable and says false for the days out of the span', () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: '2026-09-08', to: '2026-09-10' } },
    })
    expect(w.find('[role="grid"]').attributes('aria-multiselectable')).toBe('true')
    expect(w.findAll('td[aria-selected="false"]').length).toBeGreaterThan(0)
  })

  it('a span given backwards draws as the same span', () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: '2026-09-10', to: '2026-09-08' } },
    })
    expect(w.findAll('td[aria-selected="true"]')).toHaveLength(3)
  })

  it('unavailable days are struck through, reachable, and not picked', async () => {
    const w = mount(UiCalendar, {
      attachTo: document.body,
      props: { modelValue: '2026-09-10', unavailable: ['2026-09-12'] },
    })
    const booked = w
      .findAll('tbody button')
      .find((b) => b.text() === '12' && b.attributes('aria-label')?.includes('September'))!
    expect(booked.classes()).toEqual(expect.arrayContaining(['line-through', 'text-disabled-fg']))
    expect(booked.attributes('aria-disabled')).toBe('true')
    await booked.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('a day takes one or two dots, colored by tone; a third is dropped; a filled day whitens them', () => {
    const w = mount(UiCalendar, {
      props: {
        modelValue: '2026-09-24',
        marked: [
          '2026-09-10',
          { day: '2026-09-11', tone: 'danger' },
          { day: '2026-09-11', tone: 'success' },
          { day: '2026-09-11', tone: 'info' },
          { day: '2026-09-24', tone: 'danger' },
        ],
      },
    })
    const dots = (label: string) =>
      w
        .findAll('tbody button')
        .find((b) => b.attributes('aria-label')?.startsWith(label))!
        .findAll('span > span')
    expect(dots('Thursday, September 10')).toHaveLength(1)
    const two = dots('Friday, September 11')
    expect(two).toHaveLength(2)
    expect(two[0]!.classes()).toContain('bg-danger-border')
    expect(two[1]!.classes()).toContain('bg-success-border')
    expect(dots('Thursday, September 24')[0]!.classes()).toContain('bg-brand-fg')
  })

  it('a dot says its label to a reader; a taken day says it is unavailable', () => {
    const w = mount(UiCalendar, {
      props: {
        modelValue: '2026-09-24',
        marked: [{ day: '2026-09-10', tone: 'danger', label: 'overdue' }],
        unavailable: ['2026-09-12'],
      },
    })
    const label = (d: string) =>
      w
        .findAll('tbody button')
        .find((b) => b.attributes('aria-label')?.startsWith(d))!
        .attributes('aria-label')
    expect(label('Thursday, September 10')).toMatch(/, overdue$/)
    expect(label('Saturday, September 12')).toMatch(/, unavailable$/)
  })

  it('a taken day inside a span is struck; a chosen day out of the window keeps a ring and no white dots', () => {
    const w = mount(UiCalendar, {
      props: {
        range: true,
        modelValue: { from: '2026-09-10', to: '2026-09-14' },
        unavailable: ['2026-09-12'],
      },
    })
    const d12 = w
      .findAll('tbody button')
      .find((b) => b.attributes('aria-label')?.startsWith('Saturday, September 12'))!
    expect(d12.classes()).toContain('line-through')
    const out = mount(UiCalendar, {
      props: { modelValue: '2026-09-05', min: '2026-09-10', marked: ['2026-09-05'] },
    })
    const d5 = out
      .findAll('tbody button')
      .find((b) => b.attributes('aria-label')?.startsWith('Saturday, September 5'))!
    expect(d5.classes()).toContain('not-focus-visible:outline')
    expect(d5.findAll('span > span').some((n) => n.classes().includes('bg-brand-fg'))).toBe(false)
  })

  it('a focused day stands above the band so its halo shows', () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24' } })
    expect(w.find('tbody button').classes()).toContain('focus-visible:z-10')
  })

  it('the arrows and the months view stop at the window; a page stops at its edge day', async () => {
    const w = mount(UiCalendar, {
      attachTo: document.body,
      props: { modelValue: '2026-09-15', min: '2026-09-10', max: '2026-10-20' },
    })
    const [prev, , next] = w.findAll('button').slice(0, 3)
    expect(prev!.attributes('disabled')).toBeDefined()
    expect(next!.attributes('disabled')).toBeUndefined()
    await w.find('tbody').trigger('keydown', { key: 'PageDown', shiftKey: true })
    await nextTick()
    expect(w.find('tbody button[tabindex="0"]').attributes('aria-label')).toContain('October 20')
    await w.find('[aria-expanded]').trigger('click')
    const months = w.findAll('[data-month]')
    expect(months[7]!.attributes('disabled')).toBeDefined()
    expect(months[8]!.attributes('disabled')).toBeUndefined()
    expect(months[10]!.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('with a range two presses make the span, in either order; a half-made one is not sent', async () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: '2026-09-08', to: '2026-09-10' } },
    })
    const press = (n: string) =>
      w
        .findAll('tbody button')
        .find((b) => b.text() === n)!
        .trigger('click')
    const live = () => w.findAll('[aria-live]').at(-1)!.text()
    expect(live()).toBe('Choose the first day')
    await press('15')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(live()).toBe('Now choose the last day')
    // The half-made span is drawn alone: the old one is gone from view.
    expect(w.findAll('td[aria-selected="true"]').map((td) => td.text())).toEqual(['15'])
    await press('12')
    expect(w.emitted('update:modelValue')).toEqual([[{ from: '2026-09-12', to: '2026-09-15' }]])
    expect(live()).toBe('Choose the first day')
    const single = mount(UiCalendar, { props: { modelValue: '2026-09-08' } })
    await single
      .findAll('tbody button')
      .find((b) => b.text() === '15')!
      .trigger('click')
    expect(single.emitted('update:modelValue')).toEqual([['2026-09-15']])
  })

  it('a span set from outside drops a half-made one', async () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: null, to: null } },
    })
    const press = (n: string) =>
      w
        .findAll('tbody button')
        .find((b) => b.text() === n)!
        .trigger('click')
    await w.setProps({ modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    await press('15')
    await w.setProps({ modelValue: { from: '2026-09-03', to: '2026-09-04' } })
    await press('20')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('no day is null', () => {
    const w = mount(UiCalendar, { props: { modelValue: null } })
    expect(w.findAll('td[aria-selected="true"]')).toHaveLength(0)
  })

  it("an empty calendar whose window ends before today opens on the window's last month", () => {
    const w = mount(UiCalendar, { props: { max: '2008-09-30' } })
    expect(w.find('[aria-live]').text()).toBe('September 2008')
    expect(w.find('tbody button[tabindex="0"]').attributes('aria-label')).toBe(
      'Tuesday, September 30, 2008',
    )
  })

  it('a chosen day far outside the window can be walked back by the arrows and the year arrows', async () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24', max: '2008-09-30' } })
    const arrows = () => w.findAll('button').slice(0, 3)
    expect(arrows()[0]!.attributes('disabled')).toBeUndefined()
    expect(arrows()[2]!.attributes('disabled')).toBeDefined()
    await w.find('[aria-expanded]').trigger('click')
    for (let i = 0; i < 18; i++) await arrows()[0]!.trigger('click')
    expect(w.find('[aria-live]').text()).toBe('2008')
    expect(w.find('[data-month="8"]').attributes('disabled')).toBeUndefined()
    expect(w.find('[data-month="9"]').attributes('disabled')).toBeDefined()
    expect(arrows()[2]!.attributes('disabled')).toBeDefined()
  })

  it('leaving the months view after a year step leaves exactly one focusable day in the shown month', async () => {
    const w = mount(UiCalendar, { attachTo: document.body, props: { modelValue: '2026-09-24' } })
    await w.find('[aria-expanded]').trigger('click')
    await w.findAll('button').at(2)!.trigger('click')
    await w.find('[aria-expanded]').trigger('click')
    await settle()
    const stops = w.findAll('tbody button[tabindex="0"]')
    expect(stops).toHaveLength(1)
    expect(stops[0]!.attributes('aria-label')).toBe('Friday, September 24, 2027')
    expect(document.activeElement).toBe(stops[0]!.element)
  })

  it('a year step that closes the focused month moves the months tab stop to an open one', async () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-15', max: '2027-03-31' } })
    await w.find('[aria-expanded]').trigger('click')
    await w.findAll('button').at(2)!.trigger('click')
    const stop = w.findAll('[data-month]').filter((b) => b.attributes('tabindex') === '0')
    expect(stop).toHaveLength(1)
    expect(stop[0]!.attributes('data-month')).toBe('2')
    expect(stop[0]!.attributes('disabled')).toBeUndefined()
  })

  it("the arrow that reaches the window's edge hands the focus to the caption", async () => {
    const w = mount(UiCalendar, {
      attachTo: document.body,
      props: { modelValue: '2026-10-15', min: '2026-09-10' },
    })
    const prev = w.findAll('button')[0]!
    ;(prev.element as HTMLElement).focus()
    await prev.trigger('click')
    await settle()
    expect(prev.attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(w.find('[aria-expanded]').element)
  })

  it('a month arrow from inside the window never leaves the focus on a day outside it', async () => {
    const w = mount(UiCalendar, {
      attachTo: document.body,
      props: { modelValue: '2026-10-05', min: '2026-09-10', max: '2026-10-20' },
    })
    await w.findAll('button')[0]!.trigger('click')
    expect(w.find('tbody button[tabindex="0"]').attributes('aria-label')).toContain('September 10')
    const w2 = mount(UiCalendar, {
      attachTo: document.body,
      props: { modelValue: '2026-10-20', max: '2026-10-20' },
    })
    await w2.find('tbody').trigger('keydown', { key: 'ArrowRight' })
    expect(w2.find('tbody button[tabindex="0"]').attributes('aria-label')).toContain('October 20')
  })

  it('the header arrows, caption and month buttons share one height whatever the app step', async () => {
    const w = mount(UiCalendar, {
      props: { modelValue: '2026-09-24' },
      global: { plugins: withGrani({ size: 'md' }) },
    })
    const height = (el: { classes: () => string[] }) => el.classes().find((c) => /^h-\d+$/.test(c))
    const [prev, caption, next] = w.findAll('button').slice(0, 3)
    expect(height(prev!)).toBe('h-9')
    expect(height(caption!)).toBe('h-9')
    expect(height(next!)).toBe('h-9')
    await caption!.trigger('click')
    expect(height(w.find('[data-month="0"]'))).toBe('h-9')
  })

  it('with only the end of a span the calendar opens on that month and draws the end', () => {
    const w = mount(UiCalendar, {
      props: { range: true, modelValue: { from: null, to: '2024-03-31' } },
    })
    expect(w.find('[aria-live]').text()).toBe('March 2024')
    const end = w
      .findAll('td')
      .find((td) => td.find('button').attributes('aria-label') === 'Sunday, March 31, 2024')!
    expect(end.attributes('aria-selected')).toBe('true')
  })

  it('a named calendar exposes its name on the group and keeps the month as the grid name', () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24', ariaLabel: 'Check-in' } })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Check-in')
    const grid = w.find('[role="grid"]')
    expect(w.find(`#${grid.attributes('aria-labelledby')}`).text()).toBe('September 2026')
    const plain = mount(UiCalendar, { props: { modelValue: '2026-09-24' } })
    expect(plain.attributes('role')).toBeUndefined()
  })

  it('a span day outside min and max is disabled and not struck', () => {
    const w = mount(UiCalendar, {
      props: {
        range: true,
        modelValue: { from: '2026-09-08', to: '2026-09-14' },
        min: '2026-09-10',
      },
    })
    const d9 = w
      .findAll('tbody button')
      .find((b) => b.attributes('aria-label') === 'Wednesday, September 9, 2026')!
    expect(d9.attributes('aria-disabled')).toBe('true')
    expect(d9.classes()).not.toContain('line-through')
  })

  it('a malformed bound is ignored and warned about, not a dead calendar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mount(UiCalendar, { props: { modelValue: '2026-09-24', min: '2026-9-10' } })
      const d1 = w
        .findAll('tbody button')
        .find((b) => b.attributes('aria-label') === 'Tuesday, September 1, 2026')!
      expect(d1.attributes('aria-disabled')).toBeUndefined()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min is not a YYYY-MM-DD day'))
      expect(warn.mock.calls.some(([m]) => String(m).includes('2026-9-10'))).toBe(false)
    } finally {
      warn.mockRestore()
    }
  })

  it('bounds given backwards are the same window', () => {
    const w = mount(UiCalendar, {
      props: { modelValue: '2026-09-15', min: '2026-09-25', max: '2026-09-10' },
    })
    const state = (label: string) =>
      w
        .findAll('tbody button')
        .find((b) => b.attributes('aria-label') === label)!
        .attributes('aria-disabled')
    expect(state('Tuesday, September 15, 2026')).toBeUndefined()
    expect(state('Wednesday, September 9, 2026')).toBe('true')
  })

  it('the months view keeps the height of the days view', async () => {
    // A header row of 32 px and six weeks of 36 px: 248 px, the days' height.
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24' } })
    expect(w.find('thead th').classes()).toContain('h-8')
    await w.find('[aria-expanded]').trigger('click')
    expect(w.find('[data-month]').element.parentElement!.className).toContain('h-[15.5rem]')
  })

  it('a month button says its month and year', async () => {
    const w = mount(UiCalendar, { props: { modelValue: '2026-09-24' } })
    await w.find('[aria-expanded]').trigger('click')
    expect(w.find('[data-month="2"]').attributes('aria-label')).toBe('March 2026')
  })

  it('Escape in the months view goes back to the days and does not reach the host', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const heard = vi.fn()
    host.addEventListener('keydown', (e) => e.key === 'Escape' && heard())
    const w = mount(UiCalendar, { attachTo: host, props: { modelValue: '2026-09-24' } })
    await w.find('[aria-expanded]').trigger('click')
    await settle()
    key('Escape')
    await settle()
    expect(w.find('[role="grid"]').exists()).toBe(true)
    expect(heard).not.toHaveBeenCalled()
    key('Escape')
    expect(heard).toHaveBeenCalledTimes(1)
  })

  it('inside a form a pressed day picks it and the form is not submitted', async () => {
    const form = document.createElement('form')
    const submitted = vi.fn((e: Event) => e.preventDefault())
    form.addEventListener('submit', submitted)
    document.body.append(form)
    const w = mount(UiCalendar, { attachTo: form, props: { modelValue: '2026-09-24' } })
    expect(w.findAll('button').every((b) => b.attributes('type') === 'button')).toBe(true)
    ;(w.find('tbody button').element as HTMLButtonElement).click()
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    expect(submitted).not.toHaveBeenCalled()
  })

  // A page read right to left: `dir` is what a page sets; happy-dom only computes `direction` from
  // the style, so the host carries both.
  const rtlCalendar = (props: Record<string, unknown> = {}) => {
    const host = document.createElement('div')
    host.setAttribute('dir', 'rtl')
    host.setAttribute('style', 'direction: rtl')
    document.body.append(host)
    const cal = mount(UiCalendar, {
      attachTo: host,
      props: { modelValue: '2026-09-24', ...props },
      global: { plugins: withGrani() },
    })
    return { cal, done: () => (cal.unmount(), host.remove()) }
  }

  it('in a right-to-left page ArrowRight is the day before and ArrowLeft the day after; the week keys stay', async () => {
    const { cal, done } = rtlCalendar()
    ;(cal.find('[aria-selected="true"] button').element as HTMLElement).focus()
    const press = async (k: string) => (key(k), await settle(), focused())
    expect(await press('ArrowRight')).toBe('Wednesday, September 23, 2026')
    expect(await press('ArrowLeft')).toBe('Thursday, September 24, 2026')
    expect(await press('ArrowLeft')).toBe('Friday, September 25, 2026')
    expect(await press('ArrowDown')).toBe('Friday, October 2, 2026')
    expect(await press('ArrowUp')).toBe('Friday, September 25, 2026')
    expect(await press('Home')).toBe('Sunday, September 20, 2026')
    expect(await press('End')).toBe('Saturday, September 26, 2026')
    done()
  })

  it('in a right-to-left page the months run from the right: ArrowRight is the month before', async () => {
    const { cal, done } = rtlCalendar()
    await cal.find('[aria-expanded]').trigger('click')
    await settle()
    const press = async (k: string) => (
      key(k),
      await settle(),
      document.activeElement?.textContent?.trim()
    )
    expect(await press('ArrowRight')).toBe('Aug')
    expect(await press('ArrowLeft')).toBe('Sep')
    expect(await press('ArrowLeft')).toBe('Oct')
    expect(await press('Home')).toBe('Jan')
    expect(await press('End')).toBe('Dec')
    expect(await press('ArrowUp')).toBe('Sep')
    done()
  })

  it('in a right-to-left page the header arrows turn to face the way the pages go', () => {
    const { cal, done } = rtlCalendar()
    for (const label of ['Previous month', 'Next month'])
      expect(cal.find(`button[aria-label="${label}"]`).classes()).toContain(
        'rtl:[&_svg]:-scale-x-100',
      )
    done()
  })
})

describe('UiCalendar — a chord is the browser’s', () => {
  it('in the months view too, a chord moves no month and leaves the key', async () => {
    w = mountCal()
    await w.find('[aria-expanded]').trigger('click')
    await settle()
    const start = document.activeElement
    expect(start?.textContent?.trim()).toBe('Sep')
    for (const chord of [{ altKey: true }, { metaKey: true }, { ctrlKey: true }]) {
      const e = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
        ...chord,
      })
      document.activeElement!.dispatchEvent(e)
      await settle()
      expect(e.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(start)
    }
    w.unmount()
  })

  it('Alt or ⌘ with an arrow moves no day and lets the browser have the key', async () => {
    w = mountCal()
    await settle()
    const start = document.body.querySelector<HTMLButtonElement>('tbody button[tabindex="0"]')!
    start.focus()
    for (const chord of [{ altKey: true }, { metaKey: true }, { ctrlKey: true }]) {
      const e = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
        ...chord,
      })
      document.activeElement!.dispatchEvent(e)
      await settle()
      expect(e.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(start)
    }
    w.unmount()
  })
})

describe('UiCalendar — a span seen before its second press', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const line = () => document.body.querySelector('p[aria-hidden="true"]')?.textContent?.trim()
  const drawn = () =>
    [...document.body.querySelectorAll<HTMLElement>('tbody button')]
      .filter((b) => /\bbg-brand/.test(b.className))
      .map((b) => b.textContent!.trim())
  const chosen = () =>
    [...document.body.querySelectorAll('td[aria-selected="true"]')].map((td) =>
      td.textContent!.trim(),
    )
  // A pointer moved onto a day, as a browser reports it: it enters the day, then moves over it.
  const point = async (label: string) => {
    day(label).dispatchEvent(new Event('pointerenter'))
    day(label).dispatchEvent(new Event('pointermove', { bubbles: true }))
    await settle()
  }
  const first = async () => {
    w = mountCal({ range: true, modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    day('Wednesday, September 9, 2026').click()
    await settle()
  }

  it('the band runs to the pointed day and the line counts its days; nothing is chosen or sent until the press', async () => {
    await first()
    expect(line()).toBe('Now choose the last day')
    await point('Tuesday, September 15, 2026')
    expect(drawn()).toEqual(['9', '10', '11', '12', '13', '14', '15'])
    expect(line()).toBe('7 days')
    expect(chosen()).toEqual(['9'])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await point('Sunday, September 6, 2026')
    expect(drawn()).toEqual(['6', '7', '8', '9'])
    expect(line()).toBe('4 days')
    day('Sunday, September 6, 2026').click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([[{ from: '2026-09-06', to: '2026-09-09' }]])
    expect(line()).toBe('4 days')
  })

  it('the keys draw the band to the focused day, which says its length, and take it from a resting pointer', async () => {
    await first()
    day('Wednesday, September 9, 2026').focus()
    await settle()
    expect(line()).toBe('1 day')
    for (let i = 0; i < 6; i++) {
      key('ArrowRight')
      await settle()
    }
    expect(focused()).toBe('Tuesday, September 15, 2026, 7 days')
    expect(line()).toBe('7 days')
    expect(chosen()).toEqual(['9'])
    await point('Sunday, September 20, 2026')
    expect(line()).toBe('12 days')
    key('ArrowDown')
    await settle()
    expect(focused()).toBe('Tuesday, September 22, 2026, 14 days')
    expect(line()).toBe('14 days')
  })

  it('a day the press cannot pick does not end the band, and the pointer leaving takes it back', async () => {
    w = mountCal({
      range: true,
      modelValue: { from: '2026-09-01', to: '2026-09-02' },
      unavailable: ['2026-09-15'],
      max: '2026-09-20',
    })
    day('Wednesday, September 9, 2026').click()
    await settle()
    await point('Tuesday, September 15, 2026, unavailable')
    expect(drawn()).toEqual(['9'])
    expect(line()).toBe('Now choose the last day')
    await point('Monday, September 21, 2026')
    expect(drawn()).toEqual(['9'])
    await point('Monday, September 14, 2026')
    expect(line()).toBe('6 days')
    document.body.querySelector('tbody')!.dispatchEvent(new Event('pointerleave'))
    await settle()
    expect(drawn()).toEqual(['9'])
    expect(line()).toBe('Now choose the last day')
  })

  it('the line says the first step with no span and the length of a picked one, in the app’s language', async () => {
    w = mountCal({ range: true, modelValue: null })
    expect(line()).toBe('Choose the first day')
    await w.setProps({ modelValue: { from: '2026-09-10', to: '2026-09-12' } })
    expect(line()).toBe('3 days')
    w.unmount()
    w = mountCal(
      { range: true, modelValue: { from: '2026-09-01', to: '2026-09-07' } },
      withGrani(RUSSIAN),
    )
    expect(line()).toBe('7 дней')
    await w.setProps({ modelValue: { from: '2026-09-01', to: '2026-09-02' } })
    expect(line()).toBe('2 дня')
    await w.setProps({ modelValue: { from: '2026-09-01', to: '2026-09-01' } })
    expect(line()).toBe('1 день')
    expect(mountCal().find('p[aria-hidden="true"]').exists()).toBe(false)
  })
})

describe('UiCalendar — a span stops at a taken day', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const drawn = () =>
    [...document.body.querySelectorAll<HTMLElement>('tbody button')]
      .filter((b) => /\bbg-brand/.test(b.className))
      .map((b) => b.textContent!.trim())
  const off = (label: string) =>
    document.body.querySelector(`button[aria-label^="${label}"]`)!.getAttribute('aria-disabled')

  it('while a span waits for its end, the days past the first taken day cannot end it', async () => {
    w = mountCal({
      range: true,
      modelValue: { from: '2026-09-01', to: '2026-09-02' },
      unavailable: ['2026-09-12', '2026-09-07'],
    })
    expect(off('Monday, September 14')).toBeNull()
    day('Thursday, September 10, 2026').click()
    await settle()
    expect(off('Monday, September 14')).toBe('true')
    expect(off('Sunday, September 6')).toBe('true')
    expect(off('Friday, September 11')).toBeNull()
    expect(off('Tuesday, September 8')).toBeNull()
    day('Monday, September 14, 2026').dispatchEvent(new Event('pointerenter'))
    await settle()
    expect(drawn()).toEqual(['10'])
    day('Monday, September 14, 2026').click()
    await settle()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    day('Friday, September 11, 2026').click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([[{ from: '2026-09-10', to: '2026-09-11' }]])
    expect(off('Monday, September 14')).toBeNull()
  })
})

describe('UiCalendar — days of rest', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  // The header's columns whose names are bold.
  const restColumns = () =>
    [...document.body.querySelectorAll('thead th')]
      .map((th, i) => (th.classList.contains('font-bold') ? i : -1))
      .filter((i) => i >= 0)
      .join(',')

  it('the header names the locale’s days of rest in bold, wherever its week starts', () => {
    w = mountCal()
    expect(restColumns()).toBe('0,6')
    // Bold in the ink of the other names, no red: weight alone sets them apart.
    const names = [...document.body.querySelectorAll('thead th')]
    expect(names.every((th) => th.classList.contains('text-fg-muted'))).toBe(true)
    expect(document.body.querySelector('thead [class*="danger"]')).toBeNull()
    expect(document.body.querySelector('thead th')!.getAttribute('abbr')).toBe('Sunday')
    w.unmount()
    w = mountCal({}, withGrani(RUSSIAN))
    expect(restColumns()).toBe('5,6')
    w.unmount()
    w = mountCal({}, withGrani({ locale: 'he-IL' }))
    expect(restColumns()).toBe('5,6')
    w.unmount()
  })

  it('a day of rest is drawn as any other day of the month: no ground, the same hover', () => {
    w = mountCal()
    expect(day('Saturday, September 26, 2026').className).toBe(
      day('Friday, September 25, 2026').className,
    )
    expect(document.body.querySelectorAll('td[class*="bg-"]')).toHaveLength(0)
  })
})
