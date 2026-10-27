import { describe, expect, it } from 'vitest'
import { areaPath, linePath, ringArcs } from './chartPath'

const moves = (d: string) => d.match(/M/g)?.length ?? 0

describe('linePath', () => {
  it('draws one run through defined points', () => {
    const d = linePath([0, 50, 100], [10, 20, 30], 'linear')
    expect(d).toBe('M0,10L50,20L100,30')
  })
  it('breaks at a null instead of dropping to zero', () => {
    const d = linePath([0, 25, 50, 75, 100], [10, 20, null, 30, 40], 'linear')
    expect(moves(d)).toBe(2)
    expect(d).not.toContain(',0')
  })
  it('smooth never swings past the points: between two equal values it stays flat', () => {
    const d = linePath([0, 50, 100], [80, 20, 20], 'smooth')
    const ys = (d.match(/-?[\d.]+/g) ?? []).map(Number).filter((_, i) => i % 2 === 1)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20)
    expect(Math.max(...ys)).toBeLessThanOrEqual(80)
  })
  it('step holds each value until the next point', () => {
    expect(linePath([0, 50, 100], [10, 20, 30], 'step')).toBe('M0,10L50,10L50,20L100,20L100,30')
  })
  it('is empty with nothing to draw', () => {
    expect(linePath([], [])).toBe('')
    expect(linePath([0, 1], [null, null])).toBe('')
  })
})

describe('areaPath', () => {
  it('closes the band on the base line', () => {
    const d = areaPath([0, 100], [10, 20], 100, 'linear')
    expect(d).toBe('M0,10L100,20L100,100L0,100Z')
  })
  it('takes a lower edge per point for a stack and breaks at gaps', () => {
    expect(areaPath([0, 100], [10, 20], [50, 60], 'linear')).toBe('M0,10L100,20L100,60L0,50Z')
    expect(moves(areaPath([0, 50, 100], [10, null, 20], 100, 'linear'))).toBe(2)
  })
})

describe('ringArcs', () => {
  const ring = { inner: 30, outer: 40 }

  it('gives each value its share, in the order given', () => {
    const arcs = ringArcs([1, 3], ring)
    expect(arcs.map((a) => a.share)).toEqual([0.25, 0.75])
    expect(arcs.every((a) => a.d.startsWith('M'))).toBe(true)
  })

  it('a value that is not a positive number takes no room and draws nothing', () => {
    const arcs = ringArcs([2, null, -5, NaN, 2], ring)
    expect(arcs.map((a) => a.share)).toEqual([0.5, 0, 0, 0, 0.5])
    expect(arcs.filter((a) => a.d)).toHaveLength(2)
  })

  it('nothing to share draws no arc', () => {
    expect(ringArcs([0, null], ring).every((a) => a.d === '' && a.share === 0)).toBe(true)
  })

  it('one part alone is the whole ring, with no gap', () => {
    const [only] = ringArcs([5, 0], { ...ring, pad: 2 })
    expect(only!.share).toBe(1)
    expect(only!.d).toBe(ringArcs([5], ring)[0]!.d)
  })

  it('grow widens one arc outward and leaves the rest', () => {
    const plain = ringArcs([1, 1], ring)
    const grown = ringArcs([1, 1], { ...ring, grow: { index: 1, by: 4 } })
    expect(grown[0]!.d).toBe(plain[0]!.d)
    expect(grown[1]!.d).not.toBe(plain[1]!.d)
  })

  it('a part thinner than the gap is still drawn, its share unchanged', () => {
    const [, , sliver] = ringArcs([100000, 100000, 5], { inner: 33, outer: 47, pad: 1 })
    expect(sliver!.share).toBeCloseTo(5 / 200005, 8)
    expect(sliver!.d).toMatch(/A/)
  })

  it('parts neighbouring arcs by pad: each edge stands half of it off the line between them', () => {
    const [a] = ringArcs([1, 1], { inner: 30, outer: 50, pad: 2 })
    const [, x] = /^M(-?[\d.]+),/.exec(a!.d)!
    expect(Number(x)).toBeCloseTo(1, 3)
  })
})
