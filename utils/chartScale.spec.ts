import { describe, expect, it } from 'vitest'
import {
  crowdedLabels,
  labelStep,
  linearScale,
  nearestPoint,
  pointPosition,
  tickCount,
} from './chartScale'

describe('linearScale', () => {
  it('rounds the bounds outward and puts ticks on them', () => {
    const s = linearScale([3420, 4280, 3050])
    expect(s.domain).toEqual([0, 5000])
    expect(s.ticks).toEqual([0, 1000, 2000, 3000, 4000, 5000])
    expect(s.at(2500)).toBe(0.5)
  })
  it('reaches zero by default and keeps negative values in view', () => {
    expect(linearScale([40, 60]).domain[0]).toBe(0)
    expect(linearScale([40, 60], { zero: false }).domain).toEqual([40, 60])
    const s = linearScale([-18, 42])
    expect(s.domain[0]).toBeLessThanOrEqual(-18)
    expect(s.ticks).toContain(0)
  })
  it('skips gaps: null, NaN and infinity do not stretch the axis', () => {
    expect(linearScale([null, 3, Number.NaN, Infinity, undefined, 7]).domain).toEqual([0, 7])
  })
  it('gives a flat or empty series room instead of a zero span', () => {
    expect(linearScale([]).domain).toEqual([0, 1])
    expect(linearScale([0, 0]).domain).toEqual([0, 1])
    expect(linearScale([5, 5], { zero: false }).domain).toEqual([5, 10])
    expect(Number.isFinite(linearScale([0]).at(0))).toBe(true)
  })
  it('keeps a bound the caller fixed and rounds only the free one', () => {
    const shared = linearScale([120, 380], { max: 440 })
    expect(shared.domain).toEqual([0, 440])
    expect(linearScale([120], { min: 100, zero: false }).domain[0]).toBe(100)
  })
})

describe('axis layout', () => {
  it('holds one tick per 48px, never fewer than two', () => {
    expect(tickCount(240)).toBe(5)
    expect(tickCount(40)).toBe(2)
    expect(tickCount(Number.NaN)).toBe(2)
  })
  it('spreads points from end to end, a lone one in the middle', () => {
    expect(pointPosition(0, 12)).toBe(0)
    expect(pointPosition(11, 12)).toBe(1)
    expect(pointPosition(0, 1)).toBe(0.5)
  })
  it('finds the nearest point and clamps outside the plot', () => {
    expect(nearestPoint(0.52, 12)).toBe(6)
    expect(nearestPoint(-0.3, 12)).toBe(0)
    expect(nearestPoint(1.4, 12)).toBe(11)
    expect(nearestPoint(0.7, 1)).toBe(0)
  })
  it('thins labels until no two touch, the ends standing inside the axis', () => {
    const months = Array(12).fill(24)
    expect(labelStep(1100, months)).toBe(1)
    expect(labelStep(280, months)).toBe(2)
    // A wide first label ("Oct 2025") stands from the start: its neighbour moves further off.
    expect(labelStep(280, [52, 24, 24, 52, 24, 24, 24, 24, 24, 24, 24, 24])).toBe(4)
  })
  it('counts the ends moved inward by an inset', () => {
    const months = [52, 24, 24, 52, 24, 24, 24, 24, 24, 24, 24, 24]
    // At 380 every third label fits from the edge; 16 in from it, "Oct 2025" meets "Jan 2026".
    expect(labelStep(380, months)).toBe(3)
    expect(labelStep(380, months, 12, 16)).toBe(4)
  })
  it('shows every label before the axis is measured, and a lone one', () => {
    expect(labelStep(0, Array(12).fill(40))).toBe(1)
    expect(labelStep(280, [60])).toBe(1)
  })
})

describe('labelStep — from the end', () => {
  it('checks the labels counted back from the newest, the ones a chart shows', () => {
    // From the start every second label (0, 2, 4) fits; from the end (5, 3, 1) the wide newest
    // label runs into the one before it, so the step grows to 3 (5, 2).
    const widths = [20, 20, 20, 20, 100, 100]
    expect(labelStep(300, widths)).toBe(2)
    expect(labelStep(300, widths, 12, 0, true)).toBe(3)
  })
})

describe('crowdedLabels', () => {
  const at = (index: number, from: number, to: number) => ({ index, from, to })
  it('hides a label that runs into the next one, keeping the newest', () => {
    // 1063..1129 and 1126..1200: the older of the two gives way.
    const hidden = crowdedLabels(
      [at(8279, 960, 1026), at(9139, 1063, 1129), at(9999, 1126, 1200)],
      1200,
    )
    expect([...hidden]).toEqual([9139])
  })
  it('hides a label that starts before the plot, and keeps the rest', () => {
    const hidden = crowdedLabels([at(270, -29, 45), at(3513, 72, 146), at(9999, 236, 310)], 310)
    expect([...hidden]).toEqual([270])
  })
  it('hides a label that ends past the plot, the newest kept', () => {
    // 100..160 stands clear of the newest but past the plot's 150: it gives way too.
    const hidden = crowdedLabels([at(0, 0, 40), at(1, 100, 160), at(2, 190, 230)], 150)
    expect([...hidden]).toEqual([1])
  })
  it('measures the gap from the label kept, not the one hidden', () => {
    // 50..100 hides under 95..150; 0..40 stands 55 clear of the kept one.
    const hidden = crowdedLabels([at(0, 0, 40), at(1, 50, 100), at(2, 95, 150)], 150)
    expect([...hidden]).toEqual([1])
  })
  it('reads a chart laid out right to left from its right edge, the newest leftmost', () => {
    // The same three labels as the first case, mirrored in a plot 1200 wide.
    const hidden = crowdedLabels([at(8279, 174, 240), at(9139, 71, 137), at(9999, 0, 74)], 1200)
    expect([...hidden]).toEqual([9139])
  })
  it('hides nothing before the plot is measured, nor among labels that stand apart', () => {
    expect(crowdedLabels([at(0, 0, 0), at(1, 0, 0)], 0).size).toBe(0)
    expect(crowdedLabels([at(0, 0, 40), at(1, 60, 100)], 100).size).toBe(0)
  })
})
