import { describe, expect, it, vi } from 'vitest'
import { sanitizeSharedSeed } from './sharedSeed'

// A seed is what a server wrote into the page with `sharedSnapshot`, read back by the browser: data
// from the page, which anything on it may have written. It takes the keys the snapshot writes and
// the shape each has, nothing else: a toast, a question or a crashed calendar must not come from it.
const SEED = {
  'grani:today': '2026-10-19',
  'grani:date-cell-now': 1_792_400_000_000,
  'grani:copy-toast': null,
}

describe('sanitizeSharedSeed', () => {
  it('keeps the keys sharedSnapshot writes, each with the shape it writes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeSharedSeed(SEED)).toEqual(SEED)
    expect(sanitizeSharedSeed({ 'grani:copy-toast': 4 })).toEqual({ 'grani:copy-toast': 4 })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('drops a store key the snapshot never writes: a toast, a question, the hosts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = sanitizeSharedSeed({
      'grani:toasts': [{ id: 1, title: 'Pay to this account' }],
      'grani:confirm': { open: true, title: 'Delete everything?' },
      'grani:hosts': {},
      'grani:anything': 'ok',
      ...SEED,
    })
    expect(out).toEqual(SEED)
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.filter((m) => m.includes('dropped'))).toHaveLength(4)
    expect(said.some((m) => m.includes('Pay to this account'))).toBe(false)
    warn.mockRestore()
  })

  it.each([
    ['a day that is a number', 'grani:today', 5],
    ['a day that is no ISO day', 'grani:today', '19.10.2026'],
    ['a day carrying markup', 'grani:today', '2026-10-19<script>'],
    ['a moment that is text', 'grani:date-cell-now', 'now'],
    ['a moment that is NaN', 'grani:date-cell-now', Number.NaN],
    ['a toast id that is a fraction', 'grani:copy-toast', 1.5],
    ['an object for a day', 'grani:today', { y: 2026 }],
    ['a function', 'grani:today', () => '2026-10-19'],
    ['a Date', 'grani:today', new Date()],
    ['undefined', 'grani:date-cell-now', undefined],
    ['a symbol', 'grani:today', Symbol('x')],
  ])(
    'drops a known key with another shape (%s), and never prints the value',
    (_label, key, value) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(sanitizeSharedSeed({ [key]: value })).toEqual({})
      const said = warn.mock.calls.map((c) => String(c[0]))
      expect(said.some((m) => m.includes(key))).toBe(true)
      expect(said.some((m) => m.includes('script'))).toBe(false)
      warn.mockRestore()
    },
  )

  it('drops a key outside grani:<name>, keeping the rest, and warns without the value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = sanitizeSharedSeed({ 'grani:today': '2026-10-19', bogus: 'top secret payload' })
    expect(out).toEqual({ 'grani:today': '2026-10-19' })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('bogus'))).toBe(true)
    expect(said.some((m) => m.includes('top secret payload'))).toBe(false)
    warn.mockRestore()
  })

  it('an empty seed stays empty, with no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeSharedSeed({})).toEqual({})
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('sanitizeSharedSeed — values a date cannot be made of', () => {
  it('drops a today that is no day and a now that is no moment', () => {
    const kept = sanitizeSharedSeed({
      'grani:today': '9999-99-99',
      'grani:date-cell-now': 1e300,
    })
    expect(kept).toEqual({})
    expect(
      sanitizeSharedSeed({ 'grani:today': '2026-10-26', 'grani:date-cell-now': 1_790_000_000_000 }),
    ).toEqual({
      'grani:today': '2026-10-26',
      'grani:date-cell-now': 1_790_000_000_000,
    })
  })
})
