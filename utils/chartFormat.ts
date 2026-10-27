import { minorDigits } from './money'
import type { UiTranslator } from '../types/ui'
import { dayIn, parseDateValue, type DateValue } from './dateValue'
import { isFiniteNumber } from './scale'

/**
 * How a value reads on an axis, in a tooltip and in a headline. `money` is the amount in
 * whole units (roubles, not kopecks) with the app's currency code after the digits, `1,234.00 USD`, as
 * a money cell writes it (`createGrani({ currency })`; none set, the digits alone);
 * `percent` is a share, `0.25` for 25%; a function formats it the caller's way, and is told
 * `compact` where the room is short (the middle of a ring), to write "5.3T" rather than every digit.
 */
export type ChartFormat =
  'number' | 'money' | 'percent' | ((value: number, options: { compact: boolean }) => string)

/** The step of a time axis: what one point stands for; `weekday` is a day named by its day of the week, for one week. */
export type ChartGrain = 'day' | 'weekday' | 'week' | 'month'

type Numbers = Pick<UiTranslator, 'n' | 'currency'>
// The app's zone, when the caller has one: a moment falls on its day by that clock.
type Dates = Pick<UiTranslator, 'd' | 't'> & { timeZone?: UiTranslator['timeZone'] }

/**
 * A value as text. `compact` is for an axis, where the digits have no room: "42.4K" in the
 * language's own words, no currency, since the axis names its unit once. Missing data is a dash, never "0".
 */
export function formatChartValue(
  tr: Numbers,
  value: number | null | undefined,
  format: ChartFormat = 'number',
  { compact = false }: { compact?: boolean } = {},
): string {
  if (!isFiniteNumber(value)) return '—'
  if (typeof format === 'function') return format(value, { compact })
  // A value that rounds to zero is zero, never "-0", as the money cell prints it.
  const sign = { signDisplay: 'negative' } as const
  if (format === 'percent')
    return tr.n(value, { ...sign, style: 'percent', maximumFractionDigits: compact ? 0 : 1 })
  if (compact) return tr.n(value, { ...sign, notation: 'compact', maximumFractionDigits: 1 })
  if (format === 'money') {
    // As the money cell prints it: the currency's own decimals, the code after the digits, none
    // when the app set none.
    const minor = minorDigits(tr.currency.value)
    const digits = tr.n(value, {
      ...sign,
      minimumFractionDigits: minor,
      maximumFractionDigits: minor,
    })
    return tr.currency.value ? `${digits} ${tr.currency.value}` : digits
  }
  return tr.n(value, { ...sign, maximumFractionDigits: 2 })
}

/**
 * The labels of a value axis: compact numbers ("1.3M", "42K"), or percents, as few digits as
 * keep every label apart (0, 0.05, 0.1 reads so, not 0, 0.1, 0.1). A function format and the
 * currency stay off the axis: its figures are short, and the chart names its unit once.
 */
export function formatChartTicks(
  tr: Numbers,
  ticks: readonly number[],
  format: ChartFormat = 'number',
): string[] {
  const percent = format === 'percent'
  let out: string[] = []
  for (let digits = percent ? 0 : 1; digits <= 4; digits++) {
    out = ticks.map((v) =>
      percent
        ? tr.n(v, { style: 'percent', maximumFractionDigits: digits })
        : tr.n(v, { notation: 'compact', maximumFractionDigits: digits }),
    )
    if (new Set(out).size === out.length) break
  }
  return out
}

const MONTH_ONLY = /^(\d{4})-(\d{2})$/

/**
 * A point of a time axis as a calendar day: `2026-09` is September, `2026-09-01` its first day,
 * a timestamp the day it falls on in `timeZone` (the app's, as a date cell reads it), in the
 * device's without one. `null` when it is not a date.
 */
export function parseChartDate(value: DateValue, timeZone?: string): Date | null {
  const m = typeof value === 'string' ? MONTH_ONLY.exec(value.trim()) : null
  if (m) {
    const month = Number(m[2]) - 1
    return month >= 0 && month < 12 ? new Date(Date.UTC(Number(m[1]), month, 1)) : null
  }
  const parsed = parseDateValue(value, timeZone)
  if (!parsed) return null
  // A calendar day is kept as UTC midnight and printed in UTC: a zone set for the app never moves
  // it to the day before. A day alone is its own day wherever it is read.
  return new Date(dayIn(parsed.date, parsed.dateOnly ? undefined : timeZone) * 864e5)
}
const zoneOf = (tr: Dates) => tr.timeZone?.value || undefined

const UTC = { timeZone: 'UTC' } as const

function shortLabel(tr: Dates, date: Date, grain: ChartGrain, withYear: boolean): string {
  if (grain === 'weekday') return tr.d(date, { ...UTC, weekday: 'short' })
  if (grain === 'month') {
    if (!withYear) return tr.d(date, { ...UTC, month: 'short' })
    // Month and year apart: Intl's own "month year" and a bare year add a word for "year" in
    // some languages (Russian does), too long for an axis; the digits of the year are all it keeps.
    const year = tr.d(date, { ...UTC, year: 'numeric' }).replace(/\D+/g, '')
    return `${tr.d(date, { ...UTC, month: 'short' })} ${year}`
  }
  return tr.d(date, {
    ...UTC,
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

/**
 * The labels of a time axis, one per point. The year stands only where it changes and on the
 * first label, and only when the points span more than one year; a point that is not a date
 * keeps its text, as a category. `shown` says which labels a thinned axis prints: the year then
 * stands on the first one shown and where the year changes between two shown, so a hidden first
 * point never takes the year away with it.
 */
export function chartDateLabels(
  tr: Dates,
  points: readonly DateValue[],
  grain: ChartGrain,
  shown: (index: number) => boolean = () => true,
): string[] {
  const dates = points.map((p) => parseChartDate(p, zoneOf(tr)))
  const years = new Set(dates.filter((d): d is Date => d !== null).map((d) => d.getUTCFullYear()))
  const spans = years.size > 1
  let lastYear: number | null = null
  return dates.map((date, i) => {
    if (!date) return String(points[i])
    const year = date.getUTCFullYear()
    const withYear = spans && shown(i) && year !== lastYear
    if (shown(i)) lastYear = year
    return shortLabel(tr, date, grain, withYear)
  })
}

/** One point in full, for a tooltip and a screen reader: "September 2026", "5 September 2026", "Saturday, 5 September 2026", "Week of 5 September 2026". */
export function chartDateLong(tr: Dates, point: DateValue, grain: ChartGrain): string {
  const date = parseChartDate(point, zoneOf(tr))
  if (!date) return String(point)
  if (grain === 'month') return tr.d(date, { ...UTC, month: 'long', year: 'numeric' })
  if (grain === 'weekday')
    return tr.d(date, { ...UTC, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const day = tr.d(date, { ...UTC, day: 'numeric', month: 'long', year: 'numeric' })
  return grain === 'week' ? tr.t('grani.chart.weekOf', { date: day }) : day
}
