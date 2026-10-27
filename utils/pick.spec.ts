import { describe, expect, it } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  const MAP = { a: 'A', b: 'B' } as const

  it('returns the value of a known key', () => {
    expect(pick(MAP, 'a', 'b')).toBe('A')
  })

  it('falls back on an empty key', () => {
    expect(pick(MAP, undefined, 'b')).toBe('B')
    expect(pick(MAP, null, 'b')).toBe('B')
  })

  it('does not leak prototype members', () => {
    for (const key of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']) {
      const got = pick(MAP, key as never, 'b')
      expect(typeof got).toBe('string')
      expect(got).toBe('B')
    }
  })
})
