import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiProgress from './UiProgress.vue'
import { SCALE_RAMP_CLASS } from '../utils/scaleRamp'

describe('UiProgress', () => {
  it('The bar says how far it is, and its fill follows value of max.', () => {
    const w = mount(UiProgress, { props: { value: 3, max: 10 }, attrs: { class: 'h-2' } })
    expect(w.attributes()).toMatchObject({
      role: 'progressbar',
      'aria-label': 'Progress',
      'aria-valuemin': '0',
      'aria-valuemax': '10',
      'aria-valuenow': '3',
    })
    expect(w.find('[aria-hidden]').attributes('style')).toContain('width: 30%')
    expect(w.find('[aria-hidden]').classes()).toContain('bg-brand-solid')
  })

  it('a non-number or a zero max leaves aria-valuenow out and the bar empty, never NaN', () => {
    const nan = mount(UiProgress, { props: { value: Number.NaN, max: 10 } })
    expect(nan.attributes('aria-valuenow')).toBeUndefined()
    expect(nan.find('[aria-hidden]').attributes('style')).toContain('width: 0%')
    expect(nan.html()).not.toContain('NaN')
    const zero = mount(UiProgress, { props: { value: 5, max: 0 } })
    expect(zero.attributes('aria-valuemax')).toBeUndefined()
    expect(zero.attributes('aria-valuenow')).toBeUndefined()
  })

  it('clamps beyond the target and keeps a host name; valueText speaks for the number', () => {
    const w = mount(UiProgress, {
      props: { value: 14, max: 10, valueText: '14 of 10 payments' },
      attrs: { 'aria-labelledby': 'goal' },
    })
    expect(w.attributes('aria-valuenow')).toBe('10')
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('aria-valuetext')).toBe('14 of 10 payments')
    expect(w.find('[aria-hidden]').attributes('style')).toContain('width: 100%')
  })

  it('step draws one segment per step, filled by value / step; too many or none filled falls back', () => {
    const w = mount(UiProgress, { props: { value: 300, max: 1000, step: 100 } })
    const cells = w.findAll('[aria-hidden]')
    expect(cells).toHaveLength(10)
    expect(cells.filter((c) => c.classes().includes('bg-brand-solid'))).toHaveLength(3)
    expect(cells[3]!.classes()).toContain('bg-border')
    expect(
      mount(UiProgress, { props: { value: 3, max: 100, step: 1 } }).findAll('[aria-hidden]'),
    ).toHaveLength(1)
    expect(
      mount(UiProgress, { props: { value: 0, max: 10, step: 1 } }).findAll('[aria-hidden]'),
    ).toHaveLength(1)
  })

  it('tone colors the fill; thermometer mixes the status tokens by how full, invert reverses', () => {
    expect(
      mount(UiProgress, { props: { value: 1, max: 2, tone: 'success' } })
        .find('[aria-hidden]')
        .classes(),
    ).toContain('bg-success')
    const low = mount(UiProgress, { props: { value: 1, max: 10, variant: 'thermometer' } })
    expect(low.find('[aria-hidden]').classes()).toContain(SCALE_RAMP_CLASS.low)
    expect(low.attributes('style')).toContain('--ui-scale-mix: 80%')
    const full = mount(UiProgress, { props: { value: 10, max: 10, variant: 'thermometer' } })
    expect(full.find('[aria-hidden]').classes()).toContain(SCALE_RAMP_CLASS.high)
    const inv = mount(UiProgress, {
      props: { value: 10, max: 10, variant: 'thermometer', invert: true },
    })
    expect(inv.find('[aria-hidden]').classes()).toContain(SCALE_RAMP_CLASS.low)
  })
})

describe('UiProgress — review follow-ups', () => {
  it('a value that reaches max fills every segment even when max is not an exact multiple of step', () => {
    const w = mount(UiProgress, { props: { value: 1000, max: 1000, step: 300 } })
    const segs = w.findAll('[aria-hidden="true"]')
    expect(segs).toHaveLength(4)
    expect(segs.filter((s) => !s.classes().includes('bg-border'))).toHaveLength(4)
  })

  it('a caller-supplied aria-label reaches the root instead of the default name', () => {
    const w = mount(UiProgress, { props: { value: 3, max: 10 }, attrs: { 'aria-label': 'Paid' } })
    expect(w.attributes('aria-label')).toBe('Paid')
  })

  it('a segment takes a share of the badge radius, so a short bar never turns into pills', () => {
    const w = mount(UiProgress, { props: { value: 3, max: 5, step: 1 } })
    const seg = w.findAll('[aria-hidden="true"]')[0]!
    expect(seg.classes()).toContain('rounded-[calc(var(--radius-badge)*0.35)]')
    expect(seg.classes()).not.toContain('rounded-badge')
  })
})

describe('UiProgress — review follow-ups, second pass', () => {
  it('a half step does not fill the segment, and a float step adds none', () => {
    const half = mount(UiProgress, { props: { value: 450, max: 1200, step: 100 } })
    expect(half.findAll('[data-filled]')).toHaveLength(4)
    const float = mount(UiProgress, { props: { value: 0.1, max: 0.3, step: 0.1 } })
    expect(float.findAll('[aria-hidden="true"]')).toHaveLength(3)
  })

  it('Work of unknown length runs a band along the track and says no number.', () => {
    const w = mount(UiProgress, {
      props: { indeterminate: true },
      attrs: { 'aria-label': 'Uploading' },
    })
    expect(w.attributes('role')).toBe('progressbar')
    expect(w.attributes('aria-valuenow')).toBeUndefined()
    expect(w.attributes('aria-valuemax')).toBeUndefined()
    const band = w.find('.ui-progress-run')
    expect(band.exists()).toBe(true)
    expect(band.attributes('data-motion-keep')).toBe('')
  })

  it('with no height class the bar is 8px tall; the host height wins', () => {
    expect(mount(UiProgress, { props: { value: 1, max: 2 } }).classes()).toContain('h-2')
    const own = mount(UiProgress, { props: { value: 1, max: 2 }, attrs: { class: 'h-1 w-24' } })
    expect(own.classes()).not.toContain('h-2')
  })

  it('beyond max the number stays at max and valueText carries the real value', () => {
    const w = mount(UiProgress, { props: { value: 14, max: 10, valueText: '14 of 10, over' } })
    expect(w.attributes('aria-valuenow')).toBe('10')
    expect(w.attributes('aria-valuetext')).toBe('14 of 10, over')
  })

  it('forced colors: the track is outlined and the reached part takes the highlight', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    const block = css.slice(css.indexOf('@media (forced-colors: active)'))
    expect(block).toContain(':root .ui-progress {')
    expect(mount(UiProgress, { props: { value: 3 } }).classes()).toContain('ui-progress')
    expect(block).toContain(':root .ui-progress > [data-filled]')
    expect(block).toContain('background: Highlight')
  })
})

describe('UiProgress — reduced motion', () => {
  it('The running band keeps running, slower, when the system asks for reduced motion.', () => {
    // The band is a sign of work: it is on the keep list, which turns it once in 1.6 s, slower
    // than its 1.2 s, instead of letting the reduced-motion floor stop it.
    const w = mount(UiProgress, { props: { indeterminate: true } })
    expect(w.find('.ui-progress-run').attributes()).toHaveProperty('data-motion-keep')
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    expect(css).toMatch(/\.ui-progress-run\s*\{[^}]*1\.2s/)
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    const keep = reduce.match(/\.animate-spin,\s*\[data-motion-keep\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(keep).toMatch(/animation-duration:\s*1\.6s\s*!important/)
    expect(keep).toMatch(/animation-iteration-count:\s*infinite\s*!important/)
  })
})
