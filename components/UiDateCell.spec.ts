import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RUSSIAN, withGrani } from '../test/harness'
import UiDateCell from './UiDateCell.vue'
import UiTooltip from './UiTooltip.vue'

// Thursday, 24 September 2026, noon on the device clock.
const NOW = new Date(2026, 8, 24, 12, 0, 0)
const at = (day: number, h = 9, m = 15) => new Date(2026, 8, day, h, m)
const lines = (w: ReturnType<typeof mount>) => w.findAll('span span').map((s) => s.text())

describe('UiDateCell', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }))
  afterEach(() => vi.useRealTimers())

  it('variant time: the time on top, how long ago under it', () => {
    expect(lines(mount(UiDateCell, { props: { value: at(24), variant: 'time' } }))).toEqual([
      '09:15',
      'Today',
    ])
    expect(lines(mount(UiDateCell, { props: { value: at(23), variant: 'time' } }))[1]).toBe(
      'Yesterday',
    )
    const older = lines(mount(UiDateCell, { props: { value: at(10), variant: 'time' } }))[1]!
    expect(older).toMatch(/Sep/)
    expect(older).toMatch(/10/)
  })

  it('variant day, the default: the full date on top, the time under it', () => {
    const w = mount(UiDateCell, { props: { value: at(10) } })
    const [top, under] = lines(w)
    expect(top).toMatch(/2026/)
    expect(top).toMatch(/10/)
    expect(under).toBe('09:15')
  })

  it('a day with no time leads with the day, whatever the variant, and says today or nothing', () => {
    const today = lines(mount(UiDateCell, { props: { value: '2026-09-24', variant: 'time' } }))
    expect(today[0]).toMatch(/2026/)
    expect(today[1]).toBe('Today')
    expect(lines(mount(UiDateCell, { props: { value: '2026-09-23' } }))[1]).toBe('Yesterday')
    expect(lines(mount(UiDateCell, { props: { value: '2026-09-10' } }))).toHaveLength(1)
  })

  it('context weekday names the day in full under either lead', () => {
    expect(
      lines(mount(UiDateCell, { props: { value: '2026-09-24', context: 'weekday' } })),
    ).toEqual([expect.stringMatching(/2026/), 'Thursday'])
    expect(
      lines(mount(UiDateCell, { props: { value: at(24), variant: 'time', context: 'weekday' } })),
    ).toEqual(['09:15', expect.stringMatching(/^Thursday/)])
  })

  it('a day of another year says its year in the lower line', () => {
    const w = mount(UiDateCell, { props: { value: new Date(2024, 8, 3, 14, 20), variant: 'time' } })
    expect(lines(w)[1]).toMatch(/2024/)
    expect(lines(mount(UiDateCell, { props: { value: at(10), variant: 'time' } }))[1]).not.toMatch(
      /2026/,
    )
  })

  it('renders the clock in the library zone and takes no tab stop', () => {
    const w = mount(UiDateCell, {
      props: { value: new Date(Date.UTC(2026, 8, 10, 0, 15)), variant: 'time' },
      global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
    })
    expect(lines(w)[0]).toBe('09:15')
    expect(w.find('span').attributes('tabindex')).toBeUndefined()
  })

  it('two cells share one now, moved to the present on mount', async () => {
    const first = mount(UiDateCell, { props: { value: at(24), variant: 'time' } })
    vi.setSystemTime(new Date(2026, 8, 25, 12))
    const later = mount(UiDateCell, { props: { value: at(24), variant: 'time' } })
    await nextTick()
    expect(lines(later)[1]).toBe('Yesterday')
    expect(lines(first)[1]).toBe('Yesterday')
  })

  it('the two lines carry the whole value under a weekday context too', () => {
    const timed = lines(
      mount(UiDateCell, { props: { value: at(10), variant: 'time', context: 'weekday' } }),
    )
    expect(timed[0]).toBe('09:15')
    expect(timed[1]).toMatch(/Thursday|Wednesday|Tuesday|Monday|Friday|Saturday|Sunday/)
    expect(timed[1]).toMatch(/Sep/)
    expect(timed[1]).toMatch(/10/)
    const other = lines(
      mount(UiDateCell, {
        props: { value: new Date(2024, 8, 3, 14, 20), variant: 'time', context: 'weekday' },
      }),
    )
    expect(other[1]).toMatch(/2024/)
    const day = lines(mount(UiDateCell, { props: { value: at(10), context: 'weekday' } }))
    expect(day[0]).toMatch(/09:15/)
    expect(day[0]).toMatch(/2026/)
    expect(day[1]).toMatch(/day$/)
  })

  it('decides this year in the library zone, where the digits are shown', () => {
    const w = mount(UiDateCell, {
      props: { value: new Date(Date.UTC(2025, 11, 31, 12, 0)), variant: 'time' },
      global: { plugins: withGrani({ timeZone: 'Pacific/Kiritimati' }) },
    })
    expect(lines(w)[1]).toMatch(/Jan/)
    expect(lines(w)[1]).not.toMatch(/2025/)
  })

  it('speaks the library locale', () => {
    const w = mount(UiDateCell, {
      props: { value: at(24), variant: 'time' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    expect(lines(w)[1]).toBe('Сегодня')
  })

  it('when it speaks, the tooltip holds the full date with its time; a day alone never needs one', () => {
    const today = mount(UiDateCell, { props: { value: at(24), variant: 'time' } }).findComponent(
      UiTooltip,
    )
    expect(today.props('content')).toMatch(/2026/)
    expect(today.props('content')).toMatch(/09:15/)
    const dayOnly = mount(UiDateCell, { props: { value: '2026-09-24' } }).findComponent(UiTooltip)
    expect(dayOnly.props('content')).toBe('')
  })

  it('empty and unreadable values are a dash without a tooltip', () => {
    for (const value of [null, undefined, '', 'junk', Number.NaN]) {
      const w = mount(UiDateCell, { props: { value } })
      expect(w.text(), String(value)).toBe('—')
      expect(w.findComponent(UiTooltip).exists()).toBe(false)
    }
  })

  it('the caller class lands on the cell in both states', () => {
    expect(
      mount(UiDateCell, { props: { value: at(10) }, attrs: { class: 'text-fg-muted' } })
        .find('span')
        .classes(),
    ).toContain('text-fg-muted')
    expect(
      mount(UiDateCell, { props: { value: null }, attrs: { class: 'text-fg-muted' } }).classes(),
    ).toContain('text-fg-muted')
  })
})

describe('UiDateCell — review follow-ups', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }))
  afterEach(() => vi.useRealTimers())

  it('the tooltip stays silent once the two lines already carry the whole date, and speaks only behind a relative word', () => {
    const tip = (props: Record<string, unknown>) =>
      mount(UiDateCell, { props: props as never })
        .findComponent(UiTooltip)
        .props('content')
    expect(tip({ value: at(10) })).toBe('')
    expect(tip({ value: at(10), variant: 'time' })).toBe('')
    expect(tip({ value: at(10), context: 'weekday' })).toBe('')
    expect(tip({ value: at(24), variant: 'time' })).toMatch(/2026/)
    expect(tip({ value: at(23), variant: 'time' })).toMatch(/2026/)
  })
})

describe('UiDateCell — a day in any zone', () => {
  it('a day without a time stays that day in any time zone of the app', () => {
    // A zone far from any device: a day-only value read at the device's midnight would land a
    // day or two before in it.
    for (const timeZone of ['Pacific/Niue', 'Pacific/Kiritimati']) {
      const w = mount(UiDateCell, {
        props: { value: '2026-09-24', variant: 'day', context: 'weekday' },
        global: { plugins: withGrani({ timeZone }) },
      })
      expect(w.text()).toContain('24')
      expect(w.text()).toContain('Sep')
      expect(w.text()).toContain('Thursday')
      w.unmount()
    }
  })
})

describe('UiDateCell — review follow-ups, a time with no zone', () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }))
  afterEach(() => vi.useRealTimers())

  it("a date and time with no zone is read in the app's zone, where it is shown", () => {
    const w = mount(UiDateCell, {
      props: { value: '2026-09-10T10:00', variant: 'day', context: 'weekday' },
      global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
    })
    expect(lines(w)[0]).toMatch(/Sep 10, 2026/)
    expect(lines(w)[0]).toMatch(/10:00/)
    expect(lines(w)[1]).toBe('Thursday')
    const late = mount(UiDateCell, {
      props: { value: '2026-09-10T23:30:15.500', variant: 'time' },
      global: { plugins: withGrani({ timeZone: 'Pacific/Pago_Pago' }) },
    })
    expect(lines(late)[0]).toBe('23:30')
    expect(lines(late)[1]).toMatch(/10 Sep|Sep 10/)
  })

  it("a time written with a space, as a database writes it, is read in the app's zone as well", () => {
    const w = mount(UiDateCell, {
      props: { value: '2026-09-10 10:00:00', variant: 'time' },
      global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
    })
    expect(lines(w)[0]).toBe('10:00')
  })

  it('a time with a zone or an offset is the moment it names, whatever the app zone', () => {
    for (const value of ['2026-09-10T01:00Z', '2026-09-10T03:00+02:00']) {
      const w = mount(UiDateCell, {
        props: { value, variant: 'time' },
        global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
      })
      expect(lines(w)[0]).toBe('10:00')
      w.unmount()
    }
  })

  it("without the app's zone a time with no zone is read and shown on the device clock", () => {
    const w = mount(UiDateCell, { props: { value: '2026-09-10T10:00', variant: 'time' } })
    expect(lines(w)[0]).toBe('10:00')
  })
})

describe('UiDateCell — today in the app zone', () => {
  // 12:00 UTC on Sep 24: 21:00 that day in Tokyo, whatever the device's own clock reads.
  beforeEach(() => vi.useFakeTimers({ now: Date.UTC(2026, 8, 24, 12) }))
  afterEach(() => vi.useRealTimers())

  it('Today and Yesterday are read in the app zone, as the digits are', () => {
    const word = (value: string) =>
      lines(
        mount(UiDateCell, {
          props: { value, variant: 'time' },
          global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
        }),
      )[1]
    expect(word('2026-09-24T10:00')).toBe('Today')
    expect(word('2026-09-23T23:30')).toBe('Yesterday')
    expect(word('2026-09-24T03:00Z')).toBe('Today')
    const day = (value: string) =>
      lines(
        mount(UiDateCell, {
          props: { value },
          global: { plugins: withGrani({ timeZone: 'Asia/Tokyo' }) },
        }),
      )[1]
    expect(day('2026-09-24')).toBe('Today')
    expect(day('2026-09-23')).toBe('Yesterday')
  })
})

describe('UiDateCell — a page left open past midnight', () => {
  afterEach(() => vi.useRealTimers())

  it('Today becomes Yesterday when the day turns, as a log does', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 24, 23, 58, 0) })
    const w = mount(UiDateCell, {
      props: { value: new Date(2026, 8, 24, 9, 15), variant: 'time' },
      attachTo: document.body,
    })
    await nextTick()
    expect(lines(w)[1]).toBe('Today')
    await vi.advanceTimersByTimeAsync(3 * 60_000)
    await nextTick()
    expect(lines(w)[1]).toBe('Yesterday')
    w.unmount()
  })
})
