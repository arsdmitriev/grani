/** Decimal places of a value written with a point: `10.44` gives 2, `10` gives 0. */
export function decimalsOf(raw: string): number {
  const dot = raw.indexOf('.')
  return dot === -1 ? 0 : raw.length - dot - 1
}

/**
 * The step an arrow applies. A value written more precisely than `step` moves by
 * its own last digit (`10.44` with `0.1` moves by a cent), finer only and not below
 * two orders under the step; an integer step is never refined (`5.5` + `1` = `6.5`).
 */
export function effectiveStep(raw: string, step: number): number {
  const stepDecimals = decimalsOf(String(step))
  if (stepDecimals === 0) return step
  const valueDecimals = decimalsOf(raw)
  if (valueDecimals <= stepDecimals) return step
  return Math.max(10 ** -valueDecimals, step / 100)
}

export interface StepBounds {
  min?: number
  max?: number
}

// A number in plain digits to `precision` places at most, never an exponent (`1e-8`).
const plain = (n: number, precision: number) => n.toFixed(Math.min(12, precision))
const placesOf = (n: number) => decimalsOf(n.toFixed(12).replace(/\.?0+$/, ''))

/**
 * One arrow press: a comma is read, empty is `0`, rounded to the precision of the value or the
 * step and written with it (`10.99` and a cent gives `11.00`), then held at the bounds, which keep
 * their own digits: a bound off the step's grid (`min` 0.01 with a step of 1) is never passed.
 */
export function stepValue(raw: string | null, delta: number, bounds: StepBounds = {}): string {
  const text = (raw ?? '').trim().replaceAll(',', '.')
  const parsed = text === '' ? 0 : Number.parseFloat(text)
  const base = Number.isFinite(parsed) ? parsed : 0
  const step = effectiveStep(text, Math.abs(delta))
  // As fine as the value or the step is written, never finer than a float keeps exact.
  const precision = Math.min(12, Math.max(decimalsOf(text), placesOf(Math.abs(delta))))
  const factor = 10 ** precision
  const next = Math.round((base + Math.sign(delta) * step) * factor) / factor
  if (bounds.min != null && next < bounds.min) return plain(bounds.min, placesOf(bounds.min))
  if (bounds.max != null && next > bounds.max) return plain(bounds.max, placesOf(bounds.max))
  return plain(next, precision)
}

/** The decimal and grouping marks of a locale, as Intl writes them. */
export interface NumberMarks {
  decimal: string
  group: string
}

// One entry per locale, a handful while the page lives; an app that reads the locale from the
// request (a new tag per visitor) is dropped whole past a bound, as FORMATS is in `useUiT.ts`.
const marksCache = new Map<string, NumberMarks>()

/** The marks of `locale`: `en` has `.` and `,`, `de-DE` `,` and `.`, `ru` `,` and a no-break space. */
export function numberMarks(locale: string): NumberMarks {
  const known = marksCache.get(locale)
  if (known) return known
  if (marksCache.size >= 200) marksCache.clear()
  let marks: NumberMarks = { decimal: '.', group: ',' }
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5)
    marks = {
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
    }
  } catch {
    // An unreadable locale reads as English, as everywhere in grani.
  }
  marksCache.set(locale, marks)
  return marks
}

let foreignDigits: Map<string, string> | null = null
// The digits of other numbering systems Intl knows (Arabic-Indic, Devanagari, full-width...), to ASCII.
function digitMap(): Map<string, string> {
  if (foreignDigits) return foreignDigits
  const map = new Map<string, string>()
  const systems = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
    'numberingSystem',
  ) ?? [
    'arab',
    'arabext',
    'beng',
    'deva',
    'fullwide',
    'gujr',
    'guru',
    'knda',
    'mlym',
    'tamldec',
    'telu',
    'thai',
  ]
  for (const system of systems) {
    try {
      const format = new Intl.NumberFormat(`en-u-nu-${system}`, { useGrouping: false })
      for (let d = 0; d <= 9; d++) {
        const glyph = format.format(d)
        if ([...glyph].length === 1 && glyph !== String(d)) map.set(glyph, String(d))
      }
    } catch {
      // A system this engine cannot write is skipped: its digits stay foreign and the value invalid.
    }
  }
  foreignDigits = map
  return map
}

/** What a typed or pasted number reads as: `value` is the model text, `ok` false when unsure. */
export interface ReadNumber {
  value: string
  ok: boolean
}

const GROUPED = (mark: string) => {
  const m = mark === '.' ? '\\.' : mark
  // Thousands (1,234,567) or the Indian lakh (12,34,567); a group never starts with a zero.
  return new RegExp(`^(?:[1-9]\\d{0,2}(?:${m}\\d{3})+|[1-9]\\d?(?:${m}\\d{2})*${m}\\d{3})$`)
}

/**
 * A number as a person of `locale` writes it, read without changing its magnitude. Spaces and the
 * locale's grouping mark go; the decimal mark becomes a point; digits of another numbering system
 * become ASCII. With both `.` and `,` the last one is the decimal and the other must group by
 * thousands. A single mark of the locale's grouping must group by thousands, else it is unsure
 * (`1,23` in English). In a locale that groups with a space, the point is a decimal too, unless it
 * reads as a thousand (`1.234`). Two decimal marks, a digit among other signs, or text with no
 * digit at all (`abc`, `-`) are unsure. Unsure text comes back as written with `ok` false.
 */
export function readLocaleNumber(raw: string, locale: string): ReadNumber {
  const { decimal, group } = numberMarks(locale)
  const digits = digitMap()
  let s = [...raw].map((c) => digits.get(c) ?? c).join('')
  // \s takes the no-break and the thin no-break space of a French or Russian grouping too.
  s = s.replace(/\s/g, '')
  // Spaces alone are empty; anything else with no digit is no number, whatever it spells.
  if (s !== '' && !/\d/.test(s)) return { value: raw, ok: false }
  const marks = ['.', ',']
  // A mark other than `.` and `,` (an apostrophe, an Arabic separator) is the locale's own.
  if (!marks.includes(group)) s = s.replaceAll(group, '')
  if (!marks.includes(decimal)) s = s.replaceAll(decimal, '.')
  const decimalMark = marks.includes(decimal) ? decimal : '.'
  const groupMark = marks.includes(group) ? group : null
  const unsure = { value: raw, ok: false }

  const signed = /^[-−]/.test(s)
  const body = signed ? s.slice(1) : s
  const sign = signed ? '-' : ''
  if (!/^[\d.,]*$/.test(body)) return /\p{Nd}/u.test(s) ? unsure : { value: raw, ok: true }
  const dots = body.split('.').length - 1
  const commas = body.split(',').length - 1
  if (dots + commas === 0) return { value: sign + body, ok: true }

  if (dots && commas) {
    const last = body.lastIndexOf('.') > body.lastIndexOf(',') ? '.' : ','
    const other = last === '.' ? ',' : '.'
    const at = body.indexOf(last)
    if (body.lastIndexOf(last) !== at) return unsure
    const whole = body.slice(0, at)
    if (!GROUPED(other).test(whole)) return unsure
    return { value: `${sign}${whole.replaceAll(other, '')}.${body.slice(at + 1)}`, ok: true }
  }

  const mark = dots ? '.' : ','
  if (mark === groupMark) {
    return GROUPED(mark).test(body) ? { value: sign + body.replaceAll(mark, ''), ok: true } : unsure
  }
  if (dots + commas > 1) return unsure
  // The other mark of a locale that groups with a space: a decimal, unless it reads as a thousand.
  if (mark !== decimalMark && GROUPED(mark).test(body)) return unsure
  return { value: sign + body.replace(mark, '.'), ok: true }
}

/** The model as a person of `locale` reads it: a plain number shows the locale's decimal comma. */
export function showLocaleNumber(model: string, locale: string): string {
  if (!/^-?\d*\.?\d*$/.test(model)) return model
  return numberMarks(locale).decimal === ',' ? model.replace('.', ',') : model
}
