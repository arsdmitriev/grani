import { describe, expect, it } from 'vitest'
import { midnightIn, parseDateValue, relativeDayKey } from './dateValue'

describe('parseDateValue', () => {
  it('reads a day alone as local midnight of that day', () => {
    const p = parseDateValue('2026-09-24')!
    expect(p.dateOnly).toBe(true)
    expect([p.date.getFullYear(), p.date.getMonth(), p.date.getDate()]).toEqual([2026, 8, 24])
    expect([p.date.getHours(), p.date.getMinutes()]).toEqual([0, 0])
    expect(parseDateValue(' 2026-01-01 ')!.date.getDate()).toBe(1)
  })

  it('refuses a day that does not exist', () => {
    expect(parseDateValue('2026-02-30')).toBeNull()
    expect(parseDateValue('2026-13-01')).toBeNull()
  })

  it('reads an ISO string with a time, a timestamp and a Date, and copies the Date', () => {
    expect(parseDateValue('2026-09-24T09:15:00Z')).toEqual({
      date: new Date('2026-09-24T09:15:00Z'),
      dateOnly: false,
    })
    expect(parseDateValue(1_700_000_000_000)!.date.getTime()).toBe(1_700_000_000_000)
    const given = new Date(2026, 8, 24, 9, 15)
    const p = parseDateValue(given)!
    given.setFullYear(2000)
    expect(p.date.getFullYear()).toBe(2026)
    expect(p.dateOnly).toBe(false)
  })

  it('is null for empty and unreadable values', () => {
    for (const v of [null, undefined, '', '   ', 'junk', Number.NaN, new Date('junk')]) {
      expect(parseDateValue(v), String(v)).toBeNull()
    }
  })
})

describe('relativeDayKey', () => {
  const noon = new Date(2026, 8, 24, 12, 0)

  it('is today for the same calendar day and yesterday for the day before, whatever the hour', () => {
    expect(relativeDayKey(new Date(2026, 8, 24, 0, 1), noon)).toBe('today')
    expect(relativeDayKey(new Date(2026, 8, 24, 23, 59), noon)).toBe('today')
    expect(relativeDayKey(new Date(2026, 8, 23, 23, 59), noon)).toBe('yesterday')
    expect(relativeDayKey(new Date(2026, 8, 23, 0, 0), noon)).toBe('yesterday')
    expect(relativeDayKey(new Date(2026, 8, 22, 23, 59), noon)).toBeNull()
    expect(relativeDayKey(new Date(2026, 8, 25, 0, 0), noon)).toBeNull()
  })

  it('crosses a month and a year boundary', () => {
    expect(relativeDayKey(new Date(2026, 8, 30, 8, 0), new Date(2026, 9, 1, 0, 30))).toBe(
      'yesterday',
    )
    expect(relativeDayKey(new Date(2025, 11, 31, 8, 0), new Date(2026, 0, 1, 0, 30))).toBe(
      'yesterday',
    )
  })

  it('takes timestamps and is null for an unreadable date', () => {
    expect(relativeDayKey(noon.getTime(), noon.getTime())).toBe('today')
    expect(relativeDayKey(Number.NaN, noon)).toBeNull()
    expect(relativeDayKey(noon, Number.NaN)).toBeNull()
  })
})

describe('parseDateValue — a year under 100 is that year', () => {
  it('reads 0025-03-01 as the year 25, not 1925', () => {
    expect(parseDateValue('0025-03-01')?.date.getFullYear()).toBe(25)
  })
  it('refuses month 13 and February 30', () => {
    expect(parseDateValue('2026-13-01')).toBeNull()
    expect(parseDateValue('2026-02-30')).toBeNull()
  })
})

describe('parseDateValue — a time with no zone, in a given zone', () => {
  it('reads the wall clock of that zone, summer and winter', () => {
    expect(parseDateValue('2026-07-01T12:00', 'America/New_York')!.date.toISOString()).toBe(
      '2026-07-01T16:00:00.000Z',
    )
    expect(parseDateValue('2026-01-15T12:00', 'America/New_York')!.date.toISOString()).toBe(
      '2026-01-15T17:00:00.000Z',
    )
    expect(parseDateValue('2026-09-10T00:00:30.250', 'Asia/Tokyo')!.date.toISOString()).toBe(
      '2026-09-09T15:00:30.250Z',
    )
  })

  it('reads a clock past a daylight saving change on the right side of it', () => {
    // New York moves from 02:00 EST to 03:00 EDT on 8 March 2026: 03:30 is already summer time.
    expect(parseDateValue('2026-03-08T03:30', 'America/New_York')!.date.toISOString()).toBe(
      '2026-03-08T07:30:00.000Z',
    )
    expect(parseDateValue('2026-03-08T01:30', 'America/New_York')!.date.toISOString()).toBe(
      '2026-03-08T06:30:00.000Z',
    )
  })

  it('reads a clock the zone skips as the clock reads after the jump, as a device in that zone does', () => {
    // 02:30 never happens in New York on 8 March 2026, nor in Berlin on 29 March: 03:30 does.
    expect(parseDateValue('2026-03-08T02:30', 'America/New_York')!.date.toISOString()).toBe(
      '2026-03-08T07:30:00.000Z',
    )
    expect(parseDateValue('2026-03-29T02:30', 'Europe/Berlin')!.date.toISOString()).toBe(
      '2026-03-29T01:30:00.000Z',
    )
  })

  it('reads a year under 100 as that year in a zone too', () => {
    expect(parseDateValue('0050-06-01T10:00', 'UTC')!.date.toISOString()).toBe(
      '0050-06-01T10:00:00.000Z',
    )
    expect(parseDateValue('0050-06-01T10:00', 'Etc/GMT-3')!.date.toISOString()).toBe(
      '0050-06-01T07:00:00.000Z',
    )
  })

  it('leaves a value with an offset, a day alone and an unreadable string as they were', () => {
    expect(parseDateValue('2026-07-01T12:00Z', 'Asia/Tokyo')!.date.toISOString()).toBe(
      '2026-07-01T12:00:00.000Z',
    )
    expect(parseDateValue('2026-07-01', 'Asia/Tokyo')).toEqual(parseDateValue('2026-07-01'))
    expect(parseDateValue('next Tuesday', 'Asia/Tokyo')).toBeNull()
    expect(parseDateValue('2026-07-01T12:00')).toEqual(parseDateValue('2026-07-01T12:00', ''))
  })
})

describe('midnightIn — the moment a day begins', () => {
  it('by the clock of a zone, or of the device without one or with one it does not know', () => {
    expect(new Date(midnightIn('2026-10-25', 'Europe/Berlin')!).toISOString()).toBe(
      '2026-10-24T22:00:00.000Z',
    )
    const device = new Date(2026, 9, 25).getTime()
    expect(midnightIn('2026-10-25')).toBe(device)
    expect(midnightIn('2026-10-25', 'Mars/Olympus')).toBe(device)
    // A year under 100 is that year, not 19xx.
    expect(new Date(midnightIn('0099-01-01')!).getFullYear()).toBe(99)
  })

  it('what is no day has no moment', () => {
    expect(midnightIn('2026-10')).toBeNull()
    expect(midnightIn('soon', 'UTC')).toBeNull()
  })
})

describe('parseDateValue — review follow-ups', () => {
  it('reads a time with a space or a lowercase t as a wall clock too, as a database writes it', () => {
    for (const value of ['2026-09-24 10:00', '2026-09-24t10:00', '2026-09-24 10:00:00'])
      expect(parseDateValue(value, 'Asia/Tokyo')!.date.toISOString(), value).toBe(
        '2026-09-24T01:00:00.000Z',
      )
  })

  it('refuses a day that does not exist with a time as it does without one', () => {
    expect(parseDateValue('2026-02-30T10:00', 'Asia/Tokyo')).toBeNull()
    expect(parseDateValue('2026-02-30 10:00')).toBeNull()
    expect(parseDateValue('2026-04-31T10:00')).toBeNull()
  })

  it('reads a clock the zone shows twice (an autumn night) as its first time, as a device does', () => {
    expect(parseDateValue('2026-10-25T02:30', 'Europe/Berlin')!.date.toISOString()).toBe(
      '2026-10-25T00:30:00.000Z',
    )
    expect(parseDateValue('2026-11-01T01:30', 'America/New_York')!.date.toISOString()).toBe(
      '2026-11-01T05:30:00.000Z',
    )
  })
})

describe('parseDateValue — only the ISO forms are dates', () => {
  // A name with a number in it (a store, a week, a year alone) is not a date: the engine's own
  // parser reads almost anything with a digit, and reads it in the device's zone.
  it.each([
    'Store 12',
    'Week 3',
    '10',
    '2026',
    'Q1 2026',
    'Tue, 01 Oct 2026 10:00:00 GMT',
    '1/2/2026',
  ])('%s is not a date', (text) => expect(parseDateValue(text)).toBeNull())
  it('a moment with its offset or Z is read, in any zone the same', () => {
    expect(parseDateValue('2026-10-24T22:30:00Z')?.date.toISOString()).toBe(
      '2026-10-24T22:30:00.000Z',
    )
    expect(parseDateValue('2026-10-24T22:30:00.5+03:00')?.date.toISOString()).toBe(
      '2026-10-24T19:30:00.500Z',
    )
    expect(parseDateValue('2026-10-24T22:30+0300')?.date.toISOString()).toBe(
      '2026-10-24T19:30:00.000Z',
    )
  })
  it('a moment on a day that does not exist is not read', () => {
    expect(parseDateValue('2026-02-30T10:00:00Z')).toBeNull()
  })
})
