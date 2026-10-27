/**
 * Calendar days as `YYYY-MM-DD`: a day, not a moment. The arithmetic runs on UTC midnights,
 * so no time zone or daylight saving moves a day; format them with `timeZone: 'UTC'`.
 */
export type IsoDay = string

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

/** The day as a UTC midnight, or null for an empty or malformed string. */
export function parseDay(iso: string | null | undefined): Date | null {
  const m = iso ? ISO.exec(iso) : null
  if (!m) return null
  // `setUTCFullYear`, not `Date.UTC`: that one reads the years 0 to 99 as 1900 to 1999.
  const date = new Date(0)
  date.setUTCFullYear(+m[1]!, +m[2]! - 1, +m[3]!)
  // Date rolls over (`2026-02-31` is in March, `2026-13-01` in the next year): a day that does
  // not exist is not a day, so all three parts must come back as written.
  return date.getUTCFullYear() === +m[1]! &&
    date.getUTCMonth() === +m[2]! - 1 &&
    date.getUTCDate() === +m[3]!
    ? date
    : null
}

function toDay(date: Date): IsoDay {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: IsoDay, n: number): IsoDay {
  const d = parseDay(iso)!
  d.setUTCDate(d.getUTCDate() + n)
  return toDay(d)
}

/**
 * Moves by months and keeps the day where it can: 31 January plus a month is 28 or 29 February.
 * `day` is the day of the month to aim for, so a run of hops from the 31st lands on the 31st
 * again in March instead of creeping down to the 28th.
 */
export function addMonths(iso: IsoDay, n: number, day?: number): IsoDay {
  const d = parseDay(iso)!
  day ??= d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return toDay(d)
}

/** A typed time taken apart: the hour, the minute's digits so far, and whether the hour may take a second digit. @internal */
export interface TypedTimeParts {
  hour: number
  minute: string
  open: boolean
}

/**
 * A typed time taken apart, as a time field reads its keys: digits, and `:` where a mark ended the
 * hour. One digit is the hour, open to a second while it is 0–2; two are the hour while they make
 * one (`14`), else an hour and the minute's tens (`93`); three are `H:mm` (`930`, `230`) while
 * the minute fits, else an hour and the minute's tens (`183` is 18:3_, as `18` was); four `HH:mm`
 * (`1437`). After a mark the hour is what came before it and the minute what follows.
 * Nothing is checked here: `typedTimeOf` says whether the parts make a time.
 * @internal
 */
export function splitTypedTime(buffer: string): TypedTimeParts | null {
  if (!buffer) return null
  const mark = buffer.indexOf(':')
  if (mark > 0)
    return { hour: Number(buffer.slice(0, mark)), minute: buffer.slice(mark + 1), open: false }
  const d0 = Number(buffer[0])
  if (buffer.length === 1) return { hour: d0, minute: '', open: d0 < 3 }
  if (buffer.length === 2)
    return Number(buffer) <= 23
      ? { hour: Number(buffer), minute: '', open: false }
      : { hour: d0, minute: buffer[1]!, open: false }
  if (buffer.length === 3) {
    const hh = Number(buffer.slice(0, 2))
    return Number(buffer.slice(1)) <= 59 || hh > 23
      ? { hour: d0, minute: buffer.slice(1), open: false }
      : { hour: hh, minute: buffer[2]!, open: false }
  }
  return { hour: Number(buffer.slice(0, 2)), minute: buffer.slice(2, 4), open: false }
}

/**
 * The time typed parts make, on the 24-hour clock: the hour as typed, or on the half of the day
 * typed (`am`, `pm`); a lone digit of the minute is its tens (`9:5` is 9:50), none is 0. An hour
 * past 23, a minute past 59, or an hour past 12 with a half of the day is no time: `null`, never a
 * time nearby.
 * @internal
 */
export function typedTimeOf(
  parts: TypedTimeParts | null,
  period: 'am' | 'pm' | null = null,
): { hour24: number; minute: number } | null {
  if (!parts) return null
  const minute = parts.minute.length === 0 ? 0 : Number(parts.minute.padEnd(2, '0'))
  if (parts.hour > 23 || minute > 59 || (period && parts.hour > 12)) return null
  if (!period) return { hour24: parts.hour, minute }
  const h12 = parts.hour % 12 || 12
  const hour24 = period === 'pm' ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12
  return { hour24, minute }
}

/**
 * Whether the language writes a time of day in 12 hours with AM and PM (American English, Korean)
 * rather than 24 (Russian, British English). An unknown language reads as 24.
 * @internal
 */
export function twelveHours(locale: string): boolean {
  try {
    const o = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
    return o.hourCycle ? o.hourCycle === 'h11' || o.hourCycle === 'h12' : Boolean(o.hour12)
  } catch {
    return false
  }
}

/** Today in the zone, or in the device zone when none is given. */
export function today(timeZone?: string): IsoDay {
  // `en-CA` writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// CLDR's week start by region, for browsers without `Intl.Locale#getWeekInfo` (Firefox).
const SUNDAY =
  'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'
const SATURDAY = 'AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'

/** The first day of the week for a locale: 0 Sunday, 1 Monday, 6 Saturday. */
export function weekStart(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const first = (l.getWeekInfo?.() ?? l.weekInfo)?.firstDay
    if (first) return first % 7
    const region = l.maximize().region ?? ''
    if (SUNDAY.split(' ').includes(region)) return 0
    if (SATURDAY.split(' ').includes(region)) return 6
  } catch {
    // An unknown locale starts on Monday, the ISO week.
  }
  return 1
}

// CLDR's weekend by region, for engines without `Intl.Locale#getWeekInfo`; elsewhere Saturday and
// Sunday. The days are CLDR's, Monday 1 to Sunday 7, as `getWeekInfo` gives them.
const WEEKENDS: [string, number[]][] = [
  ['AF', [4, 5]],
  ['BH DZ EG IL IQ JO KW LY OM QA SA SD SY YE', [5, 6]],
  ['IN UG', [7]],
  ['IR', [5]],
]

/** The days of a locale's weekend, as `getUTCDay` counts them: 0 Sunday to 6 Saturday. */
export function weekend(locale: string): number[] {
  let days = [6, 7]
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { weekend: number[] }
      weekInfo?: { weekend: number[] }
    }
    const given = (l.getWeekInfo?.() ?? l.weekInfo)?.weekend
    if (given?.length) days = given
    else {
      const region = l.maximize().region ?? ''
      days = WEEKENDS.find(([regions]) => regions.split(' ').includes(region))?.[1] ?? days
    }
  } catch {
    // An unknown locale rests on Saturday and Sunday.
  }
  return days.map((d) => d % 7)
}

// The order a locale writes a day's parts in: day, month, year in `ru`, month first in `en-US`,
// year first in `ja`.
const orders = new Map<string, ('day' | 'month' | 'year')[]>()
function dayOrder(locale: string): ('day' | 'month' | 'year')[] {
  let order = orders.get(locale)
  if (!order) {
    let parts: Intl.DateTimeFormatPart[] = []
    try {
      parts = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatToParts(new Date(Date.UTC(2026, 10, 22)))
    } catch {
      // An unknown locale writes the day first, as most of the world does.
    }
    order = parts
      .map((p) => p.type)
      .filter((t): t is 'day' | 'month' | 'year' => t === 'day' || t === 'month' || t === 'year')
    if (order.length !== 3) order = ['day', 'month', 'year']
    orders.set(locale, order)
  }
  return order
}

/** Digits as other scripts and full-width keys write them (`٢٤`, `۲۴`, `２４`), as the Latin ones. */
export function latinDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9\uFF10-\uFF19]/g, (c) => {
    const code = c.charCodeAt(0)
    const zero = code >= 0xff10 ? 0xff10 : code >= 0x06f0 ? 0x06f0 : 0x0660
    return String(code - zero)
  })
}

// How far a locale's calendar counts years from the Gregorian one: 0 for the Gregorian, 543 for
// the Buddhist calendar of Thai. A calendar whose months differ too (Persian, Hijri, Hebrew, the
// Japanese eras) is `null`: a day typed in it cannot be read by its digits alone.
const yearShifts = new Map<string, number | null>()
export function typedYearShift(locale: string): number | null {
  if (yearShifts.has(locale)) return yearShifts.get(locale)!
  let shift: number | null = null
  try {
    const f = new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' })
    const calendar = f.resolvedOptions().calendar
    if (calendar === 'gregory' || calendar === 'iso8601') shift = 0
    else if (calendar === 'buddhist') {
      const year = f.formatToParts(new Date(Date.UTC(2026, 5, 15))).find((p) => p.type === 'year')
      shift = Number(latinDigits(year?.value ?? '')) - 2026
      if (!Number.isFinite(shift)) shift = null
    }
  } catch {
    shift = 0
  }
  yearShifts.set(locale, shift)
  return shift
}

/**
 * Whether a typed day is written in full: day, month and a four-digit year as three parts, or eight
 * digits alone. `12.03`, `03/12/19` and a lone `1` are not.
 * @internal
 */
export function typedInFull(text: string): boolean {
  const parts = text.split(/[^0-9]+/).filter(Boolean)
  return parts.length === 1
    ? parts[0]!.length === 8
    : parts.length === 3 && parts.some((p) => p.length === 4)
}

/**
 * A day typed as people write it in `locale`: its parts in the locale's order (`12.03.1987` in
 * `ru`, `03/12/1987` in `en-US`) with any marks between them, or as digits alone (`12031987`,
 * `120387`). A part left out is today's: `12.03` is this year's, `12` this month's. A two-digit year
 * is the nearest one at most ten years ahead. Digits of other scripts read as theirs, and a year
 * in the locale's calendar (`2530` in Thai) as that calendar's; a calendar whose months differ
 * (Persian, Hijri) reads nothing. Anything else, a day that does not exist included (`31.02`), is
 * no day: `''`, never a guess.
 */
export function readTypedDay(text: string, locale: string, today: IsoDay): IsoDay | '' {
  const shift = typedYearShift(locale)
  if (shift === null) return ''
  const order = dayOrder(locale)
  let groups = latinDigits(text)
    .split(/[^0-9]+/)
    .filter(Boolean)
  const [only] = groups
  if (groups.length === 1 && only && only.length > 2) {
    // Digits alone: the day and the month take two each, the year what is left, in the order.
    if (![4, 6, 8].includes(only.length)) return ''
    const yearWidth = only.length - 4
    groups = []
    let at = 0
    for (const part of order) {
      const width = part === 'year' ? yearWidth : 2
      if (width) groups.push(only.slice(at, at + width))
      at += width
    }
  }
  // Fewer parts than three: the year is the one left out, wherever the locale writes it.
  const named =
    groups.length === 3
      ? order
      : groups.length === 2
        ? order.filter((p) => p !== 'year')
        : groups.length === 1
          ? (['day'] as const)
          : []
  if (!named.length || groups.length > 3) return ''
  const got: Partial<Record<'day' | 'month' | 'year', string>> = {}
  named.forEach((part, i) => (got[part] = groups[i]))
  // The year as the locale's calendar counts it (2569 in Thai), then back to the Gregorian one.
  const thisYear = Number(today.slice(0, 4)) + shift
  let year = thisYear
  if (got.year !== undefined) {
    if (got.year.length === 4) year = Number(got.year)
    else if (got.year.length === 2) {
      year = Math.floor(thisYear / 100) * 100 + Number(got.year)
      if (year > thisYear + 10) year -= 100
    } else return ''
  }
  year -= shift
  const month = got.month !== undefined ? Number(got.month) : Number(today.slice(5, 7))
  const day = Number(got.day)
  if (!day || !month || (got.day?.length ?? 0) > 2 || (got.month?.length ?? 0) > 2) return ''
  const iso = [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
  return parseDay(iso) ? iso : ''
}

/** Six weeks around the month of `iso`, starting on `firstDay`: the grid never changes height. */
export function monthGrid(iso: IsoDay, firstDay: number): IsoDay[] {
  const d = parseDay(iso)!
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const shift = (first.getUTCDay() - firstDay + 7) % 7
  const start = toDay(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i - shift))
}

export const sameMonth = (a: IsoDay, b: IsoDay) => a.slice(0, 7) === b.slice(0, 7)

/**
 * The window of days `min` and `max` allow, read once for every user of it: a malformed bound is
 * no bound, and bounds given backwards are the same window. Empty is open.
 */
export function dayWindow(min?: string, max?: string): { lo: IsoDay; hi: IsoDay } {
  const lo = parseDay(min) ? min! : ''
  const hi = parseDay(max) ? max! : ''
  return lo && hi && lo > hi ? { lo: hi, hi: lo } : { lo, hi }
}

/** Whether the day lies inside `[min, max]`; an empty bound is open. ISO days compare as strings. */
export const inRange = (iso: IsoDay, min?: string, max?: string) =>
  (!min || iso >= min) && (!max || iso <= max)
