import { describe, expect, it } from 'vitest'
import { BADGE_TONES, toneDotClass, toneOutlineClass, toneSubtleClass, toneTextClass } from './tone'

const ROLES = [toneTextClass, toneSubtleClass, toneOutlineClass, toneDotClass]
const RAW_PALETTE =
  /\b(?:bg|text|border)-(?:gray|slate|zinc|green|emerald|red|rose|amber|yellow|orange|blue|sky|indigo|violet|purple|teal|cyan|lime|pink)-\d{2,3}\b/

describe('utils/tone', () => {
  it('every tone yields a class in every role', () => {
    for (const role of ROLES) for (const tone of BADGE_TONES) expect(role(tone)).toBeTruthy()
  })

  it('tones stay distinct within a role', () => {
    for (const role of [toneSubtleClass, toneDotClass, toneTextClass]) {
      expect(new Set(BADGE_TONES.map(role)).size).toBe(BADGE_TONES.length)
    }
  })

  it('uses semantic tokens only, without dark: variants', () => {
    for (const role of ROLES) {
      for (const tone of BADGE_TONES) {
        expect(role(tone)).not.toContain('dark:')
        expect(role(tone)).not.toMatch(RAW_PALETTE)
      }
    }
  })

  it('every tone has its own dot token, the same on the page and on the plate', () => {
    // Joined, not a template literal: Tailwind scans specs and would ship `${tone}` as a class
    // lightningcss rejects, failing the showcase build.
    for (const tone of BADGE_TONES) {
      expect(toneDotClass(tone)).toBe(['bg-[var(--color', tone, 'dot)]'].join('-'))
    }
  })

  it('unknown, empty and prototype keys fall back to neutral', () => {
    for (const role of ROLES) {
      expect(role(undefined)).toBe(role('neutral'))
      expect(role(null)).toBe(role('neutral'))
      for (const key of ['bogus', 'constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
        expect(role(key as never)).toBe(role('neutral'))
        expect(typeof role(key as never)).toBe('string')
      }
    }
  })
})
