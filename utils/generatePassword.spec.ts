import { describe, expect, it } from 'vitest'
import { generatePassword } from './generatePassword'

describe('generatePassword', () => {
  it('is 16 characters by default, the asked length otherwise, never under 10', () => {
    expect(generatePassword()).toHaveLength(16)
    expect(generatePassword(32)).toHaveLength(32)
    expect(generatePassword(5)).toHaveLength(10)
  })

  it('never uses the characters people misread: 0 O 1 l I', () => {
    let sample = ''
    for (let i = 0; i < 50; i++) sample += generatePassword(32)
    expect(sample).not.toMatch(/[0O1lI]/)
  })

  it('two calls differ and symbols do appear', () => {
    expect(generatePassword(20)).not.toBe(generatePassword(20))
    let sample = ''
    for (let i = 0; i < 30; i++) sample += generatePassword(16)
    expect(sample).toMatch(/[!@#$%^&*\-_=+]/)
  })

  it('every generated password holds a lower, an upper, a digit and a symbol', () => {
    for (const length of [10, 16, 32])
      for (let i = 0; i < 500; i++) {
        const p = generatePassword(length)
        expect(p).toMatch(/[a-z]/)
        expect(p).toMatch(/[A-Z]/)
        expect(p).toMatch(/[2-9]/)
        expect(p).toMatch(/[^A-Za-z0-9]/)
      }
  })

  it('a length that is not a finite number falls back to 16; a fraction is floored, a huge one capped', () => {
    expect(generatePassword(Number.NaN)).toHaveLength(16)
    expect(generatePassword(Number.POSITIVE_INFINITY)).toHaveLength(16)
    expect(generatePassword(12.5)).toHaveLength(12)
    expect(generatePassword(10_000)).toHaveLength(256)
  })
})
