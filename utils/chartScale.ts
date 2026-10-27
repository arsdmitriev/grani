import { nice, ticks } from 'd3-array'
import { isFiniteNumber } from './scale'

/** A value axis: its round bounds, the ticks on them, and where a value stands between them. */
export interface LinearScale {
  /** The bounds after rounding: `[0, 5000]` for data up to 4380. */
  domain: [number, number]
  /** Round values from the lower bound to the upper, both included. */
  ticks: number[]
  /** Where a value stands, 0 at the lower bound and 1 at the upper; out of range goes past them. */
  at: (value: number) => number
}

export interface LinearScaleOptions {
  /** About how many ticks; the scale picks a round step near it. 5 by default. */
  count?: number
  /** A fixed lower bound, for an axis that does not start at zero. */
  min?: number
  /** A fixed upper bound: a plan, or one ceiling shared by charts side by side. */
  max?: number
  /** The axis reaches zero even when every value is far from it; on by default, a bar or an area lies to the eye without it. */
  zero?: boolean
}

/** A value axis over the numbers given; `null`, NaN and infinity are gaps and do not stretch it. */
export function linearScale(
  values: Iterable<number | null | undefined>,
  { count = 5, min, max, zero = true }: LinearScaleOptions = {},
): LinearScale {
  let lo = Infinity
  let hi = -Infinity
  for (const v of values) {
    if (!isFiniteNumber(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (lo > hi) [lo, hi] = [0, 1]
  if (zero) [lo, hi] = [Math.min(lo, 0), Math.max(hi, 0)]
  if (isFiniteNumber(min)) lo = min
  if (isFiniteNumber(max)) hi = max
  // One value, or every value zero: a flat line needs room above it to read as a line.
  if (lo === hi) hi = lo === 0 ? 1 : lo + Math.abs(lo)
  if (lo > hi) [lo, hi] = [hi, lo]
  // A bound the caller fixed stays where it is; only a free one rounds outward.
  const [nlo, nhi] = nice(lo, hi, count)
  const domain: [number, number] = [isFiniteNumber(min) ? lo : nlo, isFiniteNumber(max) ? hi : nhi]
  const span = domain[1] - domain[0]
  return {
    domain,
    ticks: ticks(domain[0], domain[1], count),
    at: (value) => (value - domain[0]) / span,
  }
}

/** How many ticks a value axis of this height holds: one per 48px, never fewer than 2. */
export function tickCount(heightPx: number, gapPx = 48): number {
  return Math.max(2, Math.floor((isFiniteNumber(heightPx) ? heightPx : 0) / gapPx))
}

/** Where the point `index` of `count` stands along the axis, 0 to 1; a lone point stands in the middle. */
export function pointPosition(index: number, count: number): number {
  return count <= 1 ? 0.5 : index / (count - 1)
}

/** The point under a position 0..1 along the axis: the nearest one, clamped to the ends. */
export function nearestPoint(position: number, count: number): number {
  if (count <= 1) return 0
  const i = Math.round((isFiniteNumber(position) ? position : 0) * (count - 1))
  return Math.min(count - 1, Math.max(0, i))
}

/**
 * Every how many points a label stands so that no two shown labels touch: 1 shows them all.
 * `labelWidthsPx` are the labels as measured, one per point. The first label stands from the
 * start of the axis and the last one ends at its end; the rest are centered on their points.
 * An unmeasured axis (0 wide on the server) shows them all, so the first paint is the widest
 * one and a narrow screen only takes labels away. `insetPx` moves the two ends inward, for an
 * axis that runs to a card's edges and keeps its words on the gutter. `fromEnd` counts the shown
 * labels back from the newest, as a chart that always labels its newest point prints them.
 */
export function labelStep(
  widthPx: number,
  labelWidthsPx: readonly number[],
  gapPx = 12,
  insetPx = 0,
  fromEnd = false,
): number {
  const n = labelWidthsPx.length
  if (n <= 1 || !isFiniteNumber(widthPx) || widthPx <= 0) return 1
  const span = (i: number): [number, number] => {
    const w = labelWidthsPx[i] ?? 0
    if (i === 0) return [insetPx, insetPx + w]
    const at = (i / (n - 1)) * widthPx
    return i === n - 1 ? [at - insetPx - w, at - insetPx] : [at - w / 2, at + w / 2]
  }
  for (let step = 1; step < n; step++) {
    let end = -Infinity
    let fits = true
    const first = fromEnd ? (n - 1) % step : 0
    for (let i = first; i < n && fits; i += step) {
      const [from, to] = span(i)
      fits = from >= end + gapPx || end === -Infinity
      end = to
    }
    if (fits) return step
  }
  return n
}

/**
 * The shown labels to hide so that none runs into the next, starts before the plot or ends past
 * it, walked from the newest, which always stays. `spans` are the labels as they stand, measured from the plot's
 * left edge in pixels, in the order of their points; a chart laid out right to left, its newest
 * label leftmost, is read from the other side. A step is chosen from widths measured before the
 * year moved onto the labels it shows, so they may be wider than it counted; this is the last word.
 */
export function crowdedLabels(
  spans: readonly { index: number; from: number; to: number }[],
  widthPx: number,
  gapPx = 12,
): Set<number> {
  const hidden = new Set<number>()
  if (!(widthPx > 0)) return hidden
  const mirrored = spans.length > 1 && spans.at(-1)!.from < spans[0]!.from
  const along = mirrored
    ? spans.map(({ index, from, to }) => ({ index, from: widthPx - to, to: widthPx - from }))
    : spans
  let left = Infinity
  for (let k = along.length - 1; k >= 0; k--) {
    const { index, from, to } = along[k]!
    if (k < along.length - 1 && (to + gapPx > left || from < -0.5 || to > widthPx + 0.5))
      hidden.add(index)
    else left = from
  }
  return hidden
}

/**
 * The shown time labels as they stand, in pixels from the plot's start and in order: what
 * `crowdedLabels` weighs. Each label carries its point in `data-label`.
 */
export function placedLabels(
  labels: readonly HTMLElement[],
  plot: HTMLElement | undefined,
  shows: (index: number) => boolean,
): { index: number; from: number; to: number }[] {
  const box = plot?.getBoundingClientRect()
  // Nothing is laid out yet, or nothing lays out at all (a server, a test's document).
  if (!box?.width) return []
  const start = box.left
  return labels
    .map((el) => ({ el, index: Number(el.dataset.label) }))
    .filter(({ index }) => shows(index))
    .map(({ el, index }) => {
      const box = el.getBoundingClientRect()
      return { index, from: box.left - start, to: box.right - start }
    })
    .sort((a, b) => a.index - b.index)
}
