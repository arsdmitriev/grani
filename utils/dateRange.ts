import { addDays, addMonths, dayWindow, parseDay, today, weekStart, type IsoDay } from './calendar'
import { midnightIn } from './dateValue'
import { isDev } from './dev'

/** The named periods of a range filter; `custom` is two days picked by hand, `all` is no bounds. */
export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'prev_month'
  | 'prev_2_months'
  | '3_months'
  | '6_months'
  | 'this_year'
  | 'prev_year'
  | 'all'
  | 'custom'

/** The presets in the order a panel lists them; `custom` is not listed, a pick on the calendar makes it. */
export const RANGE_PRESETS: Exclude<RangePreset, 'custom'>[] = [
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
]

const firstOf = (iso: IsoDay) => `${iso.slice(0, 8)}01`
// Today by the zone's clock, or the device's for a zone no clock knows: a date a day off is a small
// error, a query that throws is not.
function todayIn(timeZone?: string): IsoDay {
  try {
    return today(timeZone)
  } catch {
    return today()
  }
}
const lastOf = (iso: IsoDay) => addDays(addMonths(firstOf(iso), 1), -1)

/**
 * The days of a preset around `today`, both ends inclusive; `all` and `custom` are empty.
 * Months and years are whole calendar ones, so a page that moves over a month keeps its periods;
 * a week starts on `firstDay` (0 Sunday, 1 Monday, 6 Saturday), Monday when it is not given, and the
 * last 7 or 30 days end today, today counted. UiDateRange counts a week from the app's language
 * (Sunday in American English), so a model built here for This week may be brought to other days
 * when it mounts.
 */
export function rangeFor(
  preset: RangePreset,
  today: IsoDay,
  firstDay = 1,
): { from: string; to: string } {
  // A today it cannot read (a ref still empty, a day without its zeros) names no days.
  if (!parseDay(today)) return { from: '', to: '' }
  const month = (n: number) => addMonths(firstOf(today), n)
  const year = today.slice(0, 4)
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: addDays(today, -1), to: addDays(today, -1) }
    case 'this_week': {
      const back = ((parseDay(today)?.getUTCDay() ?? firstDay) - firstDay + 7) % 7
      return { from: addDays(today, -back), to: addDays(today, 6 - back) }
    }
    case 'last_7_days':
      return { from: addDays(today, -6), to: today }
    case 'last_30_days':
      return { from: addDays(today, -29), to: today }
    case 'this_month':
      return { from: month(0), to: lastOf(today) }
    case 'prev_month':
      return { from: month(-1), to: lastOf(month(-1)) }
    case 'prev_2_months':
      return { from: month(-2), to: lastOf(month(-2)) }
    case '3_months':
      return { from: month(-2), to: lastOf(today) }
    case '6_months':
      return { from: month(-5), to: lastOf(today) }
    case 'this_year':
      return { from: `${year}-01-01`, to: `${year}-12-31` }
    case 'prev_year':
      return { from: `${+year - 1}-01-01`, to: `${+year - 1}-12-31` }
    default:
      return { from: '', to: '' }
  }
}

/**
 * The days of a span inside the window `[lo, hi]`, cut at its edges; `null` when none of them is
 * inside. No bounds stay no bounds.
 * @internal
 */
export function cutToWindow(
  r: { from: string; to: string },
  { lo, hi }: { lo: string; hi: string },
): { from: string; to: string } | null {
  if (!r.from || !r.to) return r
  const a = lo && r.from < lo ? lo : r.from
  const b = hi && r.to > hi ? hi : r.to
  return a > b ? null : { from: a, to: b }
}

/**
 * The days a range filter applies for a preset: its own around `today`, cut by the window when they
 * reach past it. One wholly outside the window keeps its own days.
 * @internal
 */
export function presetDays(
  preset: RangePreset,
  today: IsoDay,
  { firstDay = 1, min, max }: { firstDay?: number; min?: string; max?: string } = {},
): { from: string; to: string } {
  const r = rangeFor(preset, today, firstDay)
  return cutToWindow(r, dayWindow(min, max)) ?? r
}

/**
 * The moments a period covers, for a query: from midnight of its first day to midnight after its
 * last, by the clock of `timeZone` (the zone given to `createGrani({ timeZone })`), or of the device
 * without one. `end` is exclusive: a query for `at >= start && at < end` counts the last day whole,
 * a day the clock changes on too. A named preset is counted from today in that zone, as UiDateRange
 * shows it, whatever days the period carries, so the first request, on the server too, asks for
 * this Last month and not the one saved with a link: give it the app's `locale`, where a week
 * starts, and the filter's `min` and `max`, or it asks for other days than the button shows. Without
 * a `locale` a week starts on Sunday, as in English, the language an app has when it names none
 * (said in development for a week); `rangeFor` alone starts it on Monday. A zone no clock knows is
 * the device's. `custom` and a period with no preset keep their days; All time is no bounds. An
 * open end, or one that is no day, is `null`, and ends given backwards are the same period.
 */
export function periodBounds(
  period:
    { from?: string | null; to?: string | null; preset?: RangePreset | null } | null | undefined,
  options: { timeZone?: string; locale?: string; min?: string; max?: string } = {},
): { start: string | null; end: string | null } {
  // The zone alone, as it was given before the options: honoured, and said in development.
  const given: unknown = options
  if (typeof given === 'string') {
    if (isDev()) console.warn('[grani] periodBounds takes { timeZone }, not the zone alone.')
    options = { timeZone: given }
  }
  const { timeZone, locale, min, max } = options
  const preset = period?.preset
  if (preset === 'all') return { start: null, end: null }
  if (isDev() && preset === 'this_week' && !locale)
    console.warn('[grani] periodBounds: a week without a locale starts on Sunday; pass the app’s.')
  // A preset this version names; one it does not (an older link's) leaves the days the link carries.
  const known = preset && (RANGE_PRESETS as string[]).includes(preset)
  const named = known
    ? presetDays(preset, todayIn(timeZone), { firstDay: weekStart(locale ?? 'en'), min, max })
    : null
  let from = named?.from || (period?.from && parseDay(period.from) ? period.from : '')
  let to = named?.to || (period?.to && parseDay(period.to) ? period.to : '')
  if (from && to && from > to) [from, to] = [to, from]
  const at = (day: string) => {
    const ms = midnightIn(day, timeZone)
    return ms === null ? null : new Date(ms).toISOString()
  }
  return { start: from ? at(from) : null, end: to ? at(addDays(to, 1)) : null }
}
