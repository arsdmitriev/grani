import {
  arc,
  area,
  curveLinear,
  curveMonotoneX,
  curveStepAfter,
  line,
  pie,
  type CurveFactory,
} from 'd3-shape'
import { isFiniteNumber } from './scale'

/** The form of a line: `smooth` bends through the points, `linear` joins them straight, `step` holds each value until the next. */
export type ChartCurve = 'smooth' | 'linear' | 'step'

// Monotone, not Catmull-Rom: a smooth line never swings past a point, so it never shows a
// value the data does not have (a dip below zero between two zeros).
const CURVES: Record<ChartCurve, CurveFactory> = {
  smooth: curveMonotoneX,
  linear: curveLinear,
  step: curveStepAfter,
}

type Point = [x: number, y: number | null]

const defined = (p: Point) => isFiniteNumber(p[1])
const zip = (xs: readonly number[], ys: readonly (number | null)[]): Point[] =>
  xs.map((x, i) => [x, ys[i] ?? null])

/**
 * The `d` of a line through the points, in the caller's coordinates. A `null` is a gap: the
 * line breaks there and goes on after it; no data is never drawn as zero.
 */
export function linePath(
  xs: readonly number[],
  ys: readonly (number | null)[],
  curve: ChartCurve = 'smooth',
): string {
  return (
    line<Point>()
      .defined(defined)
      .x((p) => p[0])
      .y((p) => p[1] as number)
      .curve(CURVES[curve])(zip(xs, ys)) ?? ''
  )
}

/**
 * The `d` of the band between the line and a base: a number (the zero line's coordinate) or a
 * lower edge per point, for a stack. Gaps break the band as they break the line.
 */
export function areaPath(
  xs: readonly number[],
  ys: readonly (number | null)[],
  base: number | readonly number[],
  curve: ChartCurve = 'smooth',
): string {
  const lower = (i: number) => (typeof base === 'number' ? base : (base[i] ?? 0))
  return (
    area<Point>()
      .defined(defined)
      .x((p) => p[0])
      .y0((_, i) => lower(i))
      .y1((p) => p[1] as number)
      .curve(CURVES[curve])(zip(xs, ys)) ?? ''
  )
}

/** One part of a ring: the `d` of its arc, and its share of the whole, 0 to 1. */
export interface RingArc {
  d: string
  share: number
}

/**
 * The arcs of a ring around 0,0, clockwise from twelve o'clock, in the order given: the caller
 * sorts. A value that is not a positive number takes no room, and its share is 0; when nothing
 * is left the ring has no arcs. `outer` is the radius, `inner` the hole; `pad` parts the arcs by
 * that length along the middle of the ring, the same gap whatever the share; a part thinner than
 * the gap is drawn twice as wide as it, its share unchanged. `grow` widens one arc outward.
 */
export function ringArcs(
  values: readonly (number | null)[],
  {
    inner,
    outer,
    pad = 0,
    grow,
  }: { inner: number; outer: number; pad?: number; grow?: { index: number; by: number } },
): RingArc[] {
  const sizes = values.map((v) => (isFiniteNumber(v) && v > 0 ? v : 0))
  const total = sizes.reduce((a, b) => a + b, 0)
  if (total === 0) return sizes.map(() => ({ d: '', share: 0 }))
  const parts = sizes.filter((v) => v > 0).length
  const mid = (inner + outer) / 2
  const padAngle = parts > 1 ? pad / mid : 0
  // A part thinner than the gap would vanish into it: it is drawn as wide as the gap twice over,
  // and its share still says what it is.
  const least = (total * padAngle * 2) / (2 * Math.PI)
  const drawn = sizes.map((v) => (v > 0 ? Math.max(v, least) : 0))
  const slices = pie<number>()
    .sort(null)
    .value((v) => v)
    .padAngle(padAngle)(drawn)
  const shape = arc<(typeof slices)[number]>().innerRadius(inner).padRadius(mid)
  return slices.map((slice, i) => {
    const r = grow?.index === i ? outer + grow.by : outer
    const d = slice.value > 0 ? (shape.outerRadius(r)(slice) ?? '') : ''
    return { d, share: sizes[i]! / total }
  })
}
