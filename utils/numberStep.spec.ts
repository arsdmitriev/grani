import { describe, expect, it } from 'vitest'
import { decimalsOf, effectiveStep, numberMarks, readLocaleNumber, stepValue } from './numberStep'

describe('numberStep', () => {
  it('counts decimal places of a value written with a point', () => {
    expect(decimalsOf('10.44')).toBe(2)
    expect(decimalsOf('10')).toBe(0)
    expect(decimalsOf('')).toBe(0)
  })

  it('the step follows the precision of the value, finer only, two orders at most', () => {
    expect(effectiveStep('10', 0.1)).toBe(0.1)
    expect(effectiveStep('10.4', 0.1)).toBe(0.1)
    expect(effectiveStep('10.44', 0.1)).toBe(0.01)
    expect(effectiveStep('10.4444', 0.1)).toBe(0.001)
    expect(effectiveStep('5.5', 1)).toBe(1)
  })

  it('an arrow moves the value by the step; a cent stays a cent', () => {
    expect(stepValue('10', 0.1)).toBe('10.1')
    expect(stepValue('10.44', 0.1)).toBe('10.45')
    expect(stepValue('10.44', -0.1)).toBe('10.43')
    expect(stepValue('5.5', 1)).toBe('6.5')
    expect(stepValue('0.1', 0.1)).toBe('0.2')
  })

  it('a comma is read, an empty field starts at zero, garbage starts at zero', () => {
    expect(stepValue('12,5', 0.1)).toBe('12.6')
    expect(stepValue('', 5)).toBe('5')
    expect(stepValue(null, -1)).toBe('-1')
    expect(stepValue('abc', 1)).toBe('1')
  })

  it('bounds clamp the arrows', () => {
    expect(stepValue('0', -0.1, { min: 0 })).toBe('0')
    expect(stepValue('399', 5, { max: 400 })).toBe('400')
    expect(stepValue('1', -1, { min: 1 })).toBe('1')
  })

  it('no floating tail: 0.1 + 0.2 is 0.3', () => {
    expect(stepValue('0.2', 0.1)).toBe('0.3')
    expect(stepValue('1.0001', 0.1)).toBe('1.0011')
  })

  it('a step finer than four places still moves', () => {
    expect(stepValue('0', 0.00001)).toBe('0.00001')
    expect(stepValue('0.1', 0.1)).toBe('0.2')
  })

  it('numberMarks caps its table at 200 locales: an app that reads the locale from the request does not grow it forever', () => {
    let made = 0
    const Real = Intl.NumberFormat
    Intl.NumberFormat = new Proxy(Real, {
      construct: (target, args) => (made++, Reflect.construct(target as never, args)),
    }) as typeof Intl.NumberFormat
    try {
      const tag = (i: number) => `en-x-${String(i).padStart(4, '0')}`
      // The 201st distinct tag is past the cap: the table clears before it, as FORMATS does.
      for (let i = 0; i < 201; i++) numberMarks(tag(i))
      expect(made).toBe(201)
      // The first tag was wiped in that clear, so reading it again rebuilds it, not kept forever.
      numberMarks(tag(0))
      expect(made).toBe(202)
    } finally {
      Intl.NumberFormat = Real
    }
  })
})

describe('readLocaleNumber — how a number field reads its text', () => {
  it('reads a number as the locale writes it, and says ok false for text it cannot read for sure', () => {
    expect(readLocaleNumber('1 234,50', 'ru')).toEqual({ value: '1234.50', ok: true })
    expect(readLocaleNumber('1,234.50', 'en')).toEqual({ value: '1234.50', ok: true })
    // Unsure in Russian: a thousand or one and a quarter. Kept as written, not a number.
    expect(readLocaleNumber('1.234', 'ru')).toEqual({ value: '1.234', ok: false })
    for (const text of ['abc', 'Infinity', '-'])
      expect(readLocaleNumber(text, 'en').ok, text).toBe(false)
    expect(readLocaleNumber('   ', 'en')).toEqual({ value: '', ok: true })
  })
})
