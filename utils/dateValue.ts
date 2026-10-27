/** What a date cell accepts: an ISO string (`2026-09-24`, `2026-09-24T10:00`, `2026-09-24T10:00:00Z`), a Date, or a timestamp in milliseconds. Any other string is not a date. */
export type DateValue = string | Date | number

export interface ParsedDate {
  date: Date
  /** The value named a day and no time (`2026-09-24`); it is read as a local day and shows no time. */
  dateOnly: boolean
}

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
// A day and a time with no zone or offset: the reading of a clock, not a moment yet. A space or a
// lowercase t stands for the T too, as a database writes a timestamp (`2026-09-24 10:00:00`).
const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/
// A moment: a day and a time with its offset from UTC, or Z.
const MOMENT =
  /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:[Zz]|[+-]\d{2}:?\d{2})$/
const wallParts = (m: RegExpExecArray) => {
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map((n) => Number(n ?? 0))
  return {
    y: y!,
    mo: mo!,
    d: d!,
    h: h!,
    mi: mi!,
    s: s!,
    ms: Number(((m[7] ?? '') + '00').slice(0, 3)),
  }
}
// Digits a clock can show: a day that exists in its month, and 00:00 to 23:59:59.
function readable(m: RegExpExecArray): boolean {
  const { y, mo, d, h, mi, s } = wallParts(m)
  const day = new Date(utcReading(y, mo, d, 0, 0, 0))
  return (
    day.getUTCFullYear() === y &&
    day.getUTCMonth() === mo - 1 &&
    day.getUTCDate() === d &&
    h < 24 &&
    mi < 60 &&
    s < 60
  )
}

const wallClocks = new Map<string, Intl.DateTimeFormat>()
// How far the zone's clock is ahead of UTC at a moment, to the second.
function offsetAt(timeZone: string, at: number): number {
  let clock = wallClocks.get(timeZone)
  if (!clock) {
    clock = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    wallClocks.set(timeZone, clock)
  }
  const part = Object.fromEntries(clock.formatToParts(at).map((p) => [p.type, Number(p.value)]))
  return (
    utcReading(part.year!, part.month!, part.day!, part.hour!, part.minute!, part.second!) -
    Math.floor(at / 1000) * 1000
  )
}

// setUTCFullYear, not Date.UTC: a year under 100 is that year, not 19xx.
function utcReading(y: number, mo: number, d: number, h: number, mi: number, s: number, ms = 0) {
  const date = new Date(0)
  date.setUTCFullYear(y, mo - 1, d)
  return date.setUTCHours(h, mi, s, ms)
}

// The moment the zone's clock reads these digits. The offsets half a day either side stand on both
// sides of any daylight saving change; each that the clock really shows at its moment is an answer.
// Both hold on an autumn night, when the clock shows 02:30 twice: the first, as a device takes it.
// Neither holds for a reading the clock skips (02:30 on a spring night): the clock before the jump
// read on, the hour after it, where a device in that zone puts it too.
function wallTimeIn(timeZone: string, digits: RegExpExecArray): number {
  const { y, mo, d, h, mi, s, ms } = wallParts(digits)
  const wall = utcReading(y, mo, d, h, mi, s, ms)
  const before = offsetAt(timeZone, wall - HALF_DAY)
  const after = offsetAt(timeZone, wall + HALF_DAY)
  const early = wall - before
  const late = wall - after
  const holdsEarly = offsetAt(timeZone, early) === before
  const holdsLate = offsetAt(timeZone, late) === after
  if (holdsEarly && holdsLate) return Math.min(early, late)
  return holdsLate && !holdsEarly ? late : early
}
const HALF_DAY = 12 * 3600 * 1000

/**
 * The moment a day begins by the clock of `timeZone`, or of the device without one; an unknown
 * zone is the device's, as `createGrani({ timeZone })` reads it. `null` for what is no day.
 */
export function midnightIn(day: string, timeZone?: string): number | null {
  const digits = DAY_ONLY.exec(day)
  if (!digits) return null
  if (timeZone) {
    try {
      return wallTimeIn(timeZone, WALL_TIME.exec(`${day}T00:00`)!)
    } catch {
      // An unknown zone: the device's clock below.
    }
  }
  const [y, m, d] = digits.slice(1, 4).map(Number)
  const date = new Date(0)
  date.setFullYear(y!, m! - 1, d!)
  return date.setHours(0, 0, 0, 0)
}

/**
 * Reads a value as a cell does; `null` for empty or unreadable. A day alone is local
 * midnight, not UTC: `new Date('2026-09-24')` is the evening before west of Greenwich. A day and a
 * time with no zone (`2026-09-24T10:00`) is the reading of a clock: with `timeZone`, the moment
 * that zone's clock reads it, so it shows as it came in that zone; without one, the device's clock.
 */
export function parseDateValue(
  value: DateValue | null | undefined,
  timeZone?: string,
): ParsedDate | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') {
    const m = DAY_ONLY.exec(value.trim())
    if (m) {
      const [year, month, day] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])]
      // setFullYear, not the constructor: `new Date(25, …)` is 1925, a year under 100 is read as 19xx.
      const date = new Date(2000, 0, 1)
      date.setFullYear(year, month, day)
      // A day that does not exist (2026-02-30) rolls over: refuse it.
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
        ? { date, dateOnly: true }
        : null
    }
  }
  const wall = typeof value === 'string' ? WALL_TIME.exec(value.trim()) : null
  if (wall) {
    if (!readable(wall)) return null
    if (timeZone) return { date: new Date(wallTimeIn(timeZone, wall)), dateOnly: false }
    // The device's clock, built from the digits: an older Safari refuses a space in `new Date`.
    const { y, mo, d, h, mi, s, ms } = wallParts(wall)
    const date = new Date(2000, 0, 1)
    date.setFullYear(y, mo - 1, d)
    date.setHours(h, mi, s, ms)
    return { date, dateOnly: false }
  }
  // A moment with its offset or Z, and nothing else in a string: the engine's own parser reads
  // almost anything with a digit in it ("Store 12" as a December), and in the device's zone.
  if (typeof value === 'string') {
    const at = MOMENT.exec(value.trim())
    if (!at || !readable(at)) return null
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return { date, dateOnly: false }
}

const zoneDays = new Map<string, Intl.DateTimeFormat>()
/** The calendar day a moment falls on by a zone's clock, as a day count; the device's without one. @internal */
export function dayIn(at: Date, timeZone?: string): number {
  if (!timeZone) return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 864e5
  let clock = zoneDays.get(timeZone)
  if (!clock) {
    clock = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    zoneDays.set(timeZone, clock)
  }
  const part = Object.fromEntries(clock.formatToParts(at).map((p) => [p.type, Number(p.value)]))
  return utcReading(part.year!, part.month!, part.day!, 0, 0, 0) / 864e5
}

/**
 * Today or yesterday, else `null`: by the calendar of `timeZone` when given, the device's without
 * one. A day alone (`dateOnly`) is its own calendar day, wherever it is read. `now` is a parameter,
 * so the answer can be tested.
 */
export function relativeDayKey(
  date: Date | number,
  now: Date | number = Date.now(),
  o: { timeZone?: string; dateOnly?: boolean } = {},
): 'today' | 'yesterday' | null {
  const a = new Date(date)
  const b = new Date(now)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  const day = o.dateOnly ? dayIn(a) : dayIn(a, o.timeZone)
  const today = dayIn(b, o.timeZone)
  return day === today ? 'today' : day === today - 1 ? 'yesterday' : null
}
