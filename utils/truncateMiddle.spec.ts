import { describe, expect, it } from 'vitest'
import { truncateMiddle } from './truncateMiddle'

describe('truncateMiddle', () => {
  it('keeps the head and the tail around one ellipsis', () => {
    expect(truncateMiddle('613aa1c0ff4510e0', 12)).toBe('613aa1…4510e0')
    expect(truncateMiddle('abcdefgh', 5)).toBe('abc…gh')
  })
  it('leaves a short value and a useless budget alone', () => {
    expect(truncateMiddle('short', 12)).toBe('short')
    expect(truncateMiddle('abc', 3)).toBe('abc')
    expect(truncateMiddle('abcd', 1)).toBe('abcd')
  })
})

describe('truncateMiddle — whole characters', () => {
  it('never cuts a character made of two code units in half', () => {
    // A letter outside the basic plane, as an emoji is: two UTF-16 units for one character.
    const A = '\u{1D400}'
    const cut = truncateMiddle(A.repeat(10), 5)
    expect(cut).toBe(`${A.repeat(3)}…${A.repeat(2)}`)
    expect(/[\uD800-\uDFFF]/.test(cut.split(A).join(''))).toBe(false)
  })
})
