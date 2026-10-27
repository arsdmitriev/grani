import { describe, expect, it } from 'vitest'
import { pluralCategory } from './plural'

describe('pluralCategory', () => {
  it('returns CLDR categories for Russian', () => {
    expect(pluralCategory('ru', 1)).toBe('one')
    expect(pluralCategory('ru', 2)).toBe('few')
    expect(pluralCategory('ru', 5)).toBe('many')
    expect(pluralCategory('ru', 21)).toBe('one')
    expect(pluralCategory('ru', 11)).toBe('many')
  })

  it('returns one/other for English', () => {
    expect(pluralCategory('en', 1)).toBe('one')
    expect(pluralCategory('en', 0)).toBe('other')
    expect(pluralCategory('en', 2)).toBe('other')
  })

  it('returns other for a malformed locale tag', () => {
    expect(pluralCategory('!', 1)).toBe('other')
  })

  it('caps its table at 200 tags: an app that reads the locale from the request does not grow it forever', () => {
    let made = 0
    const Real = Intl.PluralRules
    Object.defineProperty(Intl, 'PluralRules', {
      value: new Proxy(Real, {
        construct: (target, args) => (made++, Reflect.construct(target as never, args)),
      }),
    })
    try {
      const tag = (i: number) => `en-x-${String(i).padStart(4, '0')}`
      // The 201st distinct tag is past the cap: the table clears before it, as FORMATS does.
      for (let i = 0; i < 201; i++) pluralCategory(tag(i), 1)
      expect(made).toBe(201)
      // The first tag was wiped in that clear, so reading it again rebuilds it, not kept forever.
      pluralCategory(tag(0), 1)
      expect(made).toBe(202)
    } finally {
      Object.defineProperty(Intl, 'PluralRules', { value: Real })
    }
  })
})
