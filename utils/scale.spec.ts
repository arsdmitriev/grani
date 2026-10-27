import { describe, expect, it } from 'vitest'
import { clamp01, isFiniteNumber } from './scale'

describe('scale', () => {
  it('knows a computable number', () => {
    expect(isFiniteNumber(3)).toBe(true)
    expect(isFiniteNumber(Number.NaN)).toBe(false)
    expect(isFiniteNumber(Infinity)).toBe(false)
    expect(isFiniteNumber(null)).toBe(false)
    expect(isFiniteNumber('3')).toBe(false)
  })
  it('clamps to 0..1 and turns a non-number into 0', () => {
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(Number.NaN)).toBe(0)
  })
})
