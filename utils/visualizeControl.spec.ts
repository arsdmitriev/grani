import { describe, expect, it } from 'vitest'
import { visualizeControl } from './visualizeControl'

describe('visualizeControl', () => {
  it('turns every line break into a visible mark', () => {
    expect(visualizeControl('a\nb')).toBe('a⏎b')
    expect(visualizeControl('a\r\nb')).toBe('a⏎b')
    expect(visualizeControl('a\rb')).toBe('a⏎b')
  })

  it('turns a tab and other C0 control characters into a visible mark', () => {
    expect(visualizeControl('a\tb')).toBe('a␉b')
    expect(visualizeControl('a\u0007b')).toBe('a␇b')
  })

  it('marks the whole C0 range, its first and its last, and leaves the space a space', () => {
    expect(visualizeControl('\u0000\u001f \u007f')).toBe('␀␟ ␡')
  })

  it('leaves plain text, an id included, unchanged', () => {
    expect(visualizeControl('613aa1c0ff4510e0')).toBe('613aa1c0ff4510e0')
    expect(visualizeControl('')).toBe('')
  })

  it('keeps one character for one, so a cut in the middle still lands where it reads', () => {
    expect(visualizeControl('a\nb\tc\u0007d')).toHaveLength(7)
  })
})

describe('visualizeControl — every control character', () => {
  it('marks DEL, the C1 controls and the line and paragraph separators too', () => {
    const out = visualizeControl('a\u007fb\u0085c\u2028d\u2029e')
    expect([...out].filter((c) => /[\u007f-\u009f\u2028\u2029]/.test(c))).toEqual([])
    expect([...out]).toHaveLength(9)
  })
})
