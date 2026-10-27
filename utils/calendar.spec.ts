import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  inRange,
  monthGrid,
  parseDay,
  readTypedDay,
  sameMonth,
  today,
  weekend,
  weekStart,
  typedInFull,
  twelveHours,
  splitTypedTime,
  typedTimeOf,
} from './calendar'

describe('calendar arithmetic', () => {
  it('reads a day and refuses one that does not exist', () => {
    expect(parseDay('2026-09-24')?.toISOString()).toBe('2026-09-24T00:00:00.000Z')
    expect(parseDay('2026-02-31')).toBeNull()
    expect(parseDay('24.09.2026')).toBeNull()
    expect(parseDay('')).toBeNull()
  })

  it('moves by days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('moves by months and keeps the day where it can', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2026-09-24', 12)).toBe('2027-09-24')
  })

  it('a run of hops aimed at the 31st lands on it again where the month has one', () => {
    expect(addMonths('2026-04-30', -1, 31)).toBe('2026-03-31')
  })

  it('without week info the region decides: Sunday in Japan and Brazil, Saturday in Egypt', () => {
    const real = Intl.Locale.prototype as unknown as Record<string, unknown>
    const saved = { g: real.getWeekInfo, w: Object.getOwnPropertyDescriptor(real, 'weekInfo') }
    delete real.getWeekInfo
    Object.defineProperty(real, 'weekInfo', { value: undefined, configurable: true })
    try {
      expect(weekStart('ja-JP')).toBe(0)
      expect(weekStart('pt-BR')).toBe(0)
      expect(weekStart('en-CA')).toBe(0)
      expect(weekStart('ar-EG')).toBe(6)
      expect(weekStart('ru')).toBe(1)
      expect(weekStart('de')).toBe(1)
    } finally {
      if (saved.g) real.getWeekInfo = saved.g
      if (saved.w) Object.defineProperty(real, 'weekInfo', saved.w)
      else delete real.weekInfo
    }
  })

  it('the weekend is the locale’s: Saturday and Sunday in ru and en-US, Friday and Saturday in Saudi Arabia', () => {
    expect(weekend('ru')).toEqual([6, 0])
    expect(weekend('en-US')).toEqual([6, 0])
    expect(weekend('ar-SA')).toEqual([5, 6])
    expect(weekend('xx-??')).toEqual([6, 0])
  })

  it('without week info the region decides the weekend, as the engine’s own CLDR does', () => {
    const regions = [
      'ar-AF',
      'ar-EG',
      'he-IL',
      'hi-IN',
      'fa-IR',
      'en-UG',
      'ru-RU',
      'en-US',
      'de-DE',
    ]
    const told = regions.map((l) => weekend(l))
    const real = Intl.Locale.prototype as unknown as Record<string, unknown>
    const saved = { g: real.getWeekInfo, w: Object.getOwnPropertyDescriptor(real, 'weekInfo') }
    delete real.getWeekInfo
    Object.defineProperty(real, 'weekInfo', { value: undefined, configurable: true })
    try {
      expect(regions.map((l) => weekend(l))).toEqual(told)
      expect(weekend('fa-IR')).toEqual([5])
    } finally {
      if (saved.g) real.getWeekInfo = saved.g
      if (saved.w) Object.defineProperty(real, 'weekInfo', saved.w)
      else delete real.weekInfo
    }
  })

  it('a month is six weeks from the week start; September 2026 starts on a Tuesday', () => {
    const mon = monthGrid('2026-09-24', 1)
    expect(mon).toHaveLength(42)
    expect(mon[0]).toBe('2026-08-31')
    expect(mon[1]).toBe('2026-09-01')
    const sun = monthGrid('2026-09-24', 0)
    expect(sun[0]).toBe('2026-08-30')
  })

  it('the week starts on Monday in ru, on Sunday in en-US', () => {
    expect(weekStart('ru')).toBe(1)
    expect(weekStart('en-US')).toBe(0)
  })

  it('today is a day in the given zone', () => {
    expect(today('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('range and month checks compare days', () => {
    expect(inRange('2026-09-24', '2026-09-01', '2026-09-30')).toBe(true)
    expect(inRange('2026-10-01', undefined, '2026-09-30')).toBe(false)
    expect(inRange('2026-10-01')).toBe(true)
    expect(sameMonth('2026-09-01', '2026-09-30')).toBe(true)
  })
})

describe('calendar — review follow-ups', () => {
  it('a year under 100 stays itself', () => {
    expect(parseDay('0026-09-24')!.getUTCFullYear()).toBe(26)
    expect(addDays('0026-09-24', 1)).toBe('0026-09-25')
  })
})

describe('readTypedDay — a day typed as people write it', () => {
  const TODAY = '2026-10-21'
  it('reads the parts in the locale’s order, with any marks between them', () => {
    for (const text of ['12.03.1987', '12/03/1987', '12-03-1987', '12 03 1987', '12. 3. 1987'])
      expect(readTypedDay(text, 'ru', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('03/12/1987', 'en-US', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('12/03/1987', 'en-US', TODAY)).toBe('1987-12-03')
    expect(readTypedDay('1987/03/12', 'ja-JP', TODAY)).toBe('1987-03-12')
  })

  it('reads digits alone by the same order', () => {
    expect(readTypedDay('12031987', 'ru', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('120387', 'ru', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('03121987', 'en-US', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('1203', 'ru', TODAY)).toBe('2026-03-12')
  })

  it('takes a part left out from today, and a two-digit year at most ten years ahead', () => {
    expect(readTypedDay('12.03', 'ru', TODAY)).toBe('2026-03-12')
    expect(readTypedDay('03/12', 'ja-JP', TODAY)).toBe('2026-03-12')
    expect(readTypedDay('5', 'ru', TODAY)).toBe('2026-10-05')
    expect(readTypedDay('12.03.87', 'ru', TODAY)).toBe('1987-03-12')
    expect(readTypedDay('12.03.36', 'ru', TODAY)).toBe('2036-03-12')
    expect(readTypedDay('12.03.37', 'ru', TODAY)).toBe('1937-03-12')
  })

  it('reads a day that does not exist, or a part half typed, as no day: never a guess', () => {
    for (const text of [
      '31.02.2026',
      '12.13.2026',
      '12.03.198',
      '12.03.1',
      '',
      'abc',
      '1.2.3.4',
      '123',
      '0.03.2026',
    ])
      expect(readTypedDay(text, 'ru', TODAY)).toBe('')
  })
})

describe('parseDay — a day that does not exist is no day', () => {
  it('refuses month 00 and 13, day 00 and 32, instead of rolling into a neighbour', () => {
    for (const iso of ['2026-13-01', '2026-00-15', '2026-05-00', '2026-05-32', '2026-12-32'])
      expect(parseDay(iso), iso).toBeNull()
  })

  it('takes 29 February in a leap year only', () => {
    expect(parseDay('2026-02-29')).toBeNull()
    expect(parseDay('2100-02-29')).toBeNull()
    expect(parseDay('2028-02-29')?.toISOString()).toBe('2028-02-29T00:00:00.000Z')
    expect(parseDay('2000-02-29')?.toISOString()).toBe('2000-02-29T00:00:00.000Z')
  })
})

describe('typedInFull', () => {
  it('day, month and a four-digit year, or eight digits alone, are a day in full', () => {
    for (const t of ['12.03.1987', '3/12/1987', '2026. 11. 22', '12031987', '13/03/2530'])
      expect(typedInFull(t), t).toBe(true)
    for (const t of ['1', '12.03', '03/12/19', '120387', '1.3.198', '2026'])
      expect(typedInFull(t), t).toBe(false)
  })
})

describe('twelveHours', () => {
  it('reads the language’s clock: 12 hours in American English and Korean, 24 elsewhere', () => {
    for (const l of ['en', 'en-US', 'ko']) expect(twelveHours(l), l).toBe(true)
    for (const l of ['ru', 'en-GB', 'de', 'ja']) expect(twelveHours(l), l).toBe(false)
    expect(twelveHours('xx-not-a-language')).toBe(false)
  })
})

describe('a typed time', () => {
  const read = (buf: string, period: 'am' | 'pm' | null = null) =>
    typedTimeOf(splitTypedTime(buf), period)

  it('one or two digits are the hour, three H:mm, four HH:mm, a mark ends the hour', () => {
    expect(splitTypedTime('1')).toEqual({ hour: 1, minute: '', open: true })
    expect(splitTypedTime('9')).toEqual({ hour: 9, minute: '', open: false })
    expect(splitTypedTime('14')).toEqual({ hour: 14, minute: '', open: false })
    expect(splitTypedTime('93')).toEqual({ hour: 9, minute: '3', open: false })
    expect(read('930')).toEqual({ hour24: 9, minute: 30 })
    expect(read('230')).toEqual({ hour24: 2, minute: 30 })
    // A minute that does not fit keeps the two-digit hour: 183 is 18:3_, not 1:83.
    expect(splitTypedTime('183')).toEqual({ hour: 18, minute: '3', open: false })
    expect(read('0930')).toEqual({ hour24: 9, minute: 30 })
    expect(read('1437')).toEqual({ hour24: 14, minute: 37 })
    expect(read('9:05')).toEqual({ hour24: 9, minute: 5 })
    expect(read('9:5')).toEqual({ hour24: 9, minute: 50 })
    expect(read('14:')).toEqual({ hour24: 14, minute: 0 })
  })

  it('a time that does not exist is none, never one nearby', () => {
    for (const buf of ['9:75', '0975', '1960', '2400', '2575', '25:00', '9:7'])
      expect(read(buf), buf).toBeNull()
    expect(read('14:30', 'am')).toBeNull()
    expect(splitTypedTime('')).toBeNull()
  })

  it('a half of the day reads the hour on it', () => {
    expect(read('2:30', 'pm')).toEqual({ hour24: 14, minute: 30 })
    expect(read('12:15', 'am')).toEqual({ hour24: 0, minute: 15 })
    expect(read('12:15', 'pm')).toEqual({ hour24: 12, minute: 15 })
    expect(read('0:15', 'am')).toEqual({ hour24: 0, minute: 15 })
  })
})
