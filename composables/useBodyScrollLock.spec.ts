import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBodyScrollLock } from './useBodyScrollLock'

describe('useBodyScrollLock', () => {
  afterEach(() => document.body.removeAttribute('style'))

  it('counts holders: the page scrolls again when the last one lets go, in any order', () => {
    document.body.style.overflow = 'scroll'
    const a = useBodyScrollLock()
    const b = useBodyScrollLock()
    a.lock()
    b.lock()
    expect(document.body.style.overflow).toBe('hidden')
    a.unlock()
    expect(document.body.style.overflow).toBe('hidden')
    b.unlock()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('a second lock or unlock by the same holder counts once', () => {
    const a = useBodyScrollLock()
    const b = useBodyScrollLock()
    a.lock()
    a.lock()
    b.lock()
    b.unlock()
    b.unlock()
    expect(document.body.style.overflow).toBe('hidden')
    a.unlock()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('useBodyScrollLock — one body for the page', () => {
  afterEach(() => document.body.removeAttribute('style'))

  it('two copies of the library on one page share the count: the body is one', async () => {
    vi.resetModules()
    const first = (await import('./useBodyScrollLock')).useBodyScrollLock
    vi.resetModules()
    const second = (await import('./useBodyScrollLock')).useBodyScrollLock
    expect(first).not.toBe(second)
    const a = first()
    const b = second()
    a.lock()
    b.lock()
    a.unlock()
    expect(document.body.style.overflow).toBe('hidden')
    b.unlock()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('useBodyScrollLock — the scrollbar on either side', () => {
  afterEach(() => {
    document.body.removeAttribute('style')
    vi.unstubAllGlobals()
  })

  // The bar stands at the end of a line: on the right in English, on the left in Arabic. Its width
  // becomes padding at that end, so nothing under it moves sideways either way.
  it('the bar becomes padding at the end of the line, and comes off', () => {
    vi.stubGlobal('innerWidth', document.documentElement.clientWidth + 15)
    const a = useBodyScrollLock()
    a.lock()
    expect(document.body.style.paddingInlineEnd).toBe('15px')
    expect(document.body.style.paddingRight).toBe('')
    a.unlock()
    expect(document.body.style.paddingInlineEnd).toBe('')
  })
})
