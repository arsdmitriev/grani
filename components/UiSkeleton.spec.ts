import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiCard from './UiCard.vue'
import UiSkeleton from './UiSkeleton.vue'

describe('UiSkeleton', () => {
  it('A hidden block in the shape its host gives it.', () => {
    const w = mount(UiSkeleton, { attrs: { class: 'h-4 w-32' } })
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['animate-pulse', 'bg-skeleton', 'rounded-control', 'h-4', 'w-32']),
    )
    expect(w.text()).toBe('')
  })

  it('It keeps shimmering, slower, when the system asks for reduced motion.', () => {
    // Under reduced motion every animation stops but the signs of work: the skeleton is one
    // of them, so it carries no stop of its own and the keep rule slows it to one pulse in 3 s.
    const w = mount(UiSkeleton)
    expect(w.classes()).toContain('ui-skeleton')
    expect(w.classes()).not.toContain('motion-reduce:animate-none')
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    const keep = reduce.match(/\.ui-skeleton\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(keep).toMatch(/animation-duration:\s*3s\s*!important/)
    expect(keep).toMatch(/animation-iteration-count:\s*infinite\s*!important/)
  })
})

describe('UiSkeleton — review follow-ups', () => {
  it('a loading card is announced to a screen reader, not only marked busy', () => {
    const w = mount(UiCard, { props: { title: 'Orders', loading: true } })
    expect(w.find('[role="status"]').text()).toBe('Loading…')
    expect(w.findAllComponents(UiSkeleton).length).toBeGreaterThan(0)
    expect(
      mount(UiCard, { props: { title: 'Orders' } })
        .find('[role="status"]')
        .exists(),
    ).toBe(false)
  })
})

describe('UiSkeleton — review follow-ups, second pass', () => {
  it('has no size of its own: the host gives it, and a style passes through', () => {
    const bare = mount(UiSkeleton)
    expect(bare.classes().some((c) => /^(h|w|size)-/.test(c))).toBe(false)
    const sized = mount(UiSkeleton, { attrs: { class: 'h-4 w-32', style: 'height: 40px' } })
    expect(sized.classes()).toEqual(expect.arrayContaining(['h-4', 'w-32']))
    expect(sized.attributes('style')).toContain('height: 40px')
  })

  it('the skeleton contrast holds its floor on the muted surface too', () => {
    const script = readFileSync(resolve(__dirname, '../scripts/contrast.mjs'), 'utf8')
    expect(script).toContain("['--color-skeleton', '--color-surface-muted', 1.4")
  })
})

describe('UiSkeleton — every shimmer of a load', () => {
  // A component that draws its own loading shape (a chart's ghost line, ring or bars) keeps it
  // moving as UiSkeleton does: one shape frozen beside a shimmering one reads as a fault.
  it('Every loading shimmer in the library keeps on, slower, under reduced motion.', () => {
    const dir = resolve(__dirname)
    const frozen = readdirSync(dir)
      .filter((f) => f.endsWith('.vue'))
      .flatMap((f) =>
        readFileSync(resolve(dir, f), 'utf8')
          .split('\n')
          .filter((line) => /animate-pulse/.test(line))
          .filter((line) => /motion-reduce:animate-none/.test(line) || !/ui-skeleton/.test(line))
          .map((line) => `${f}: ${line.trim()}`),
      )
    expect(frozen).toEqual([])
  })
})
