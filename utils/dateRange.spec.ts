import { afterEach, describe, expect, it, vi } from 'vitest'
import { periodBounds, RANGE_PRESETS, rangeFor } from './dateRange'

const T = '2026-03-17'

describe('rangeFor', () => {
  it('counts whole calendar months around today', () => {
    expect(rangeFor('this_month', T)).toEqual({ from: '2026-03-01', to: '2026-03-31' })
    expect(rangeFor('prev_month', T)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(rangeFor('prev_2_months', T)).toEqual({ from: '2026-01-01', to: '2026-01-31' })
    expect(rangeFor('3_months', T)).toEqual({ from: '2026-01-01', to: '2026-03-31' })
    expect(rangeFor('6_months', T)).toEqual({ from: '2025-10-01', to: '2026-03-31' })
  })

  it('years, and no bounds for all and custom', () => {
    expect(rangeFor('this_year', T)).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(rangeFor('prev_year', T)).toEqual({ from: '2025-01-01', to: '2025-12-31' })
    expect(rangeFor('all', T)).toEqual({ from: '', to: '' })
    expect(rangeFor('custom', T)).toEqual({ from: '', to: '' })
  })

  it('crosses the year for the months before January', () => {
    expect(rangeFor('prev_month', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })
})

describe('rangeFor — days and weeks', () => {
  it('today and yesterday are one day each', () => {
    expect(rangeFor('today', T)).toEqual({ from: '2026-03-17', to: '2026-03-17' })
    expect(rangeFor('yesterday', '2026-03-01')).toEqual({ from: '2026-02-28', to: '2026-02-28' })
  })

  it('this week starts where the locale’s week does: Monday, or Sunday', () => {
    // 17 March 2026 is a Tuesday.
    expect(rangeFor('this_week', T)).toEqual({ from: '2026-03-16', to: '2026-03-22' })
    expect(rangeFor('this_week', T, 0)).toEqual({ from: '2026-03-15', to: '2026-03-21' })
    expect(rangeFor('this_week', '2026-03-15', 1)).toEqual({ from: '2026-03-09', to: '2026-03-15' })
  })

  it('the last 7 and 30 days end today, today counted', () => {
    expect(rangeFor('last_7_days', T)).toEqual({ from: '2026-03-11', to: '2026-03-17' })
    expect(rangeFor('last_30_days', T)).toEqual({ from: '2026-02-16', to: '2026-03-17' })
  })

  it('the panel lists them from the shortest, the months and years after', () => {
    expect(RANGE_PRESETS).toEqual([
      'today',
      'yesterday',
      'this_week',
      'last_7_days',
      'this_month',
      'prev_month',
      'last_30_days',
      'prev_2_months',
      '3_months',
      '6_months',
      'this_year',
      'prev_year',
      'all',
    ])
  })
})

describe('periodBounds — the moments a period covers', () => {
  it('runs from midnight of the first day to midnight after the last, in the app’s zone', () => {
    expect(
      periodBounds({ from: '2026-10-01', to: '2026-10-31' }, { timeZone: 'Europe/Moscow' }),
    ).toEqual({
      start: '2026-09-30T21:00:00.000Z',
      end: '2026-10-31T21:00:00.000Z',
    })
    // An invoice at 18:00 on the 31st, in Moscow, is inside: the last day counts whole.
    const { start, end } = periodBounds(
      { from: '2026-10-01', to: '2026-10-31' },
      { timeZone: 'Europe/Moscow' },
    )
    const at = '2026-10-31T15:00:00.000Z'
    expect(at >= start! && at < end!).toBe(true)
  })

  it('keeps a day whole across a change of the clock', () => {
    // Berlin leaves summer time on 25 October 2026: that day is 25 hours long.
    const { start, end } = periodBounds(
      { from: '2026-10-25', to: '2026-10-25' },
      { timeZone: 'Europe/Berlin' },
    )
    expect(start).toBe('2026-10-24T22:00:00.000Z')
    expect(end).toBe('2026-10-25T23:00:00.000Z')
  })

  it('an open end is no bound, All time none at all, and ends given backwards are one period', () => {
    expect(periodBounds({ from: '2026-10-01', to: null }, { timeZone: 'UTC' })).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: null,
    })
    expect(periodBounds({ from: null, to: null }, { timeZone: 'UTC' })).toEqual({
      start: null,
      end: null,
    })
    expect(periodBounds(null, { timeZone: 'UTC' })).toEqual({ start: null, end: null })
    expect(periodBounds({ from: '2026-10-31', to: '2026-10-01' }, { timeZone: 'UTC' })).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-11-01T00:00:00.000Z',
    })
    expect(
      periodBounds({ from: '2026-02-31', to: '2026-03-05' }, { timeZone: 'UTC' }).start,
    ).toBeNull()
  })
})

describe('periodBounds — a named preset', () => {
  afterEach(() => vi.useRealTimers())
  // 14:00 in Moscow on Monday, 2 November 2026; already 01:00 on the 3rd at +14.
  const at = (iso: string) => vi.setSystemTime(new Date(iso))

  it('a named preset is counted from today in the zone, whatever days it carries', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    at('2026-11-02T11:00:00Z')
    // Saved a month ago: Last month was September then.
    const saved = { from: '2026-09-01', to: '2026-09-30', preset: 'prev_month' as const }
    expect(periodBounds(saved, { timeZone: 'Europe/Moscow' })).toEqual({
      start: '2026-09-30T21:00:00.000Z',
      end: '2026-10-31T21:00:00.000Z',
    })
    // No days yet, as a link that keeps only the name.
    expect(
      periodBounds({ from: null, to: null, preset: 'prev_month' }, { timeZone: 'UTC' }),
    ).toEqual({ start: '2026-10-01T00:00:00.000Z', end: '2026-11-01T00:00:00.000Z' })
    // Today by the zone’s clock: at 11:00 UTC it is already the 3rd at +14.
    expect(periodBounds({ preset: 'today' }, { timeZone: 'Pacific/Kiritimati' }).start).toBe(
      '2026-11-02T10:00:00.000Z',
    )
  })

  it('a week starts where the language’s does, and the window cuts as the filter does', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    at('2026-11-04T12:00:00Z') // a Wednesday
    const week = { from: null, to: null, preset: 'this_week' as const }
    expect(periodBounds(week, { timeZone: 'UTC' }).start).toBe('2026-11-01T00:00:00.000Z')
    expect(periodBounds(week, { timeZone: 'UTC', locale: 'ru' }).start).toBe(
      '2026-11-02T00:00:00.000Z',
    )
    const month = { from: null, to: null, preset: 'this_month' as const }
    expect(periodBounds(month, { timeZone: 'UTC', max: '2026-11-04' })).toEqual({
      start: '2026-11-01T00:00:00.000Z',
      end: '2026-11-05T00:00:00.000Z',
    })
  })

  it('custom keeps its days and All time has no bounds, whatever days it carries', () => {
    expect(
      periodBounds({ from: '2026-08-01', to: '2026-08-31', preset: 'all' }, { timeZone: 'UTC' }),
    ).toEqual({ start: null, end: null })
    expect(
      periodBounds({ from: '2026-08-01', to: '2026-08-02', preset: 'custom' }, { timeZone: 'UTC' }),
    ).toEqual({ start: '2026-08-01T00:00:00.000Z', end: '2026-08-03T00:00:00.000Z' })
  })
})

describe('periodBounds — what it is given', () => {
  afterEach(() => vi.restoreAllMocks())

  it('a zone no clock knows is the device’s, for a named preset too, never a throw', () => {
    const named = { from: null, to: null, preset: 'this_month' as const }
    expect(periodBounds(named, { timeZone: 'Not/AZone' })).toEqual(periodBounds(named))
  })

  it('the zone given alone, as before the options, is honoured and said in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const days = { from: '2026-10-01', to: '2026-10-31' }
    // @ts-expect-error the zone goes in the options
    expect(periodBounds(days, 'Europe/Moscow')).toEqual(
      periodBounds(days, { timeZone: 'Europe/Moscow' }),
    )
    expect(warn.mock.calls.some(([m]) => String(m).includes('periodBounds takes'))).toBe(true)
  })

  it('a week asked for without a language is said in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    periodBounds({ preset: 'this_week' }, { timeZone: 'UTC' })
    expect(warn.mock.calls.some(([m]) => String(m).includes('without a locale'))).toBe(true)
    warn.mockClear()
    periodBounds({ preset: 'this_week' }, { timeZone: 'UTC', locale: 'ru' })
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('dateRange — a today or a preset it cannot read', () => {
  // A ref still empty before the mount, or a day written without its zeros: no throw, no days.
  it.each(['', '2026-9-4', 'x'])(
    'rangeFor with today %j gives no days and does not throw',
    (today) => {
      for (const preset of RANGE_PRESETS)
        expect(rangeFor(preset, today)).toEqual({ from: '', to: '' })
    },
  )
  // An old link with a preset this version does not have keeps the days it carries.
  it('periodBounds with a preset it does not know reads the days of the link', () => {
    const known = periodBounds({ from: '2026-09-01', to: '2026-09-30' }, { timeZone: 'UTC' })
    expect(
      periodBounds(
        { preset: 'fortnight' as never, from: '2026-09-01', to: '2026-09-30' },
        { timeZone: 'UTC' },
      ),
    ).toEqual(known)
    expect(known.start).toBe('2026-09-01T00:00:00.000Z')
  })
})
