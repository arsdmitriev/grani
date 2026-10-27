import { describe, expect, it } from 'vitest'
import { en, ru } from './index'

const COMMON = { en, ru }

const PLURAL = /\.(zero|one|two|few|many|other)$/
const base = (key: string) => key.replace(PLURAL, '')
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('i18n dictionaries', () => {
  const locales = Object.keys(COMMON) as (keyof typeof COMMON)[]
  const reference = COMMON.en

  it('every locale has the same keys as the default locale', () => {
    const want = new Set(Object.keys(reference).map(base))
    for (const locale of locales) {
      expect(new Set(Object.keys(COMMON[locale]).map(base)), locale).toEqual(want)
    }
  })

  it('no value is empty', () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(COMMON[locale])) {
        expect(value.trim(), `${locale}: ${key}`).not.toBe('')
      }
    }
  })

  it('placeholders match across locales', () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(COMMON[locale])) {
        const ref = reference[key]
        if (ref) expect(placeholders(value), `${locale}: ${key}`).toEqual(placeholders(ref))
      }
    }
  })

  it('every plural set has an `other` form', () => {
    for (const locale of locales) {
      const keys = Object.keys(COMMON[locale])
      const sets = new Set(keys.filter((k) => PLURAL.test(k)).map(base))
      for (const set of sets) expect(keys, `${locale}: ${set}`).toContain(`${set}.other`)
    }
  })
})
