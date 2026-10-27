import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { RUSSIAN, withGrani } from '../test/harness'
import UiDelta from './UiDelta.vue'

const delta = (props: InstanceType<typeof UiDelta>['$props'], plugins = withGrani()) =>
  mount(UiDelta, { props, global: { plugins } })
const badge = (w: ReturnType<typeof delta>) => w.findComponent({ name: 'UiBadge' })

describe('UiDelta', () => {
  it('counts the change as a signed percent: growth is success', () => {
    const w = delta({ current: 112.3, previous: 100 })
    expect(w.text()).toContain('+12.3%')
    expect(badge(w).props('tone')).toBe('success')
  })

  it('a fall is danger, with the minus sign', () => {
    const w = delta({ current: 80, previous: 100 })
    expect(w.text()).toContain('-20%')
    expect(badge(w).props('tone')).toBe('danger')
  })

  it('invert turns the tones for what is better lower', () => {
    expect(badge(delta({ current: 80, previous: 100, invert: true })).props('tone')).toBe('success')
    expect(badge(delta({ current: 120, previous: 100, invert: true })).props('tone')).toBe('danger')
  })

  it('says better or worse for a screen reader, not only in color', () => {
    expect(delta({ current: 120, previous: 100 }).find('.sr-only').text()).toBe('+20%, better')
    expect(delta({ current: 120, previous: 100, invert: true }).find('.sr-only').text()).toBe(
      '+20%, worse',
    )
  })

  it('a change under 0.05% is no change: neutral 0%, no verdict', () => {
    const w = delta({ current: 100.04, previous: 100 })
    expect(w.text()).toBe('0%')
    expect(badge(w).props('tone')).toBe('neutral')
    expect(w.find('.sr-only').exists()).toBe(false)
  })

  it('draws nothing without a previous value, or with a zero one', () => {
    expect(delta({ current: 10 }).html()).not.toContain('span')
    expect(delta({ current: 10, previous: null }).html()).not.toContain('span')
    expect(delta({ current: 10, previous: 0 }).html()).not.toContain('span')
    expect(delta({ current: Number.NaN, previous: 5 }).html()).not.toContain('span')
  })

  it('a negative base still reads by the direction of the move', () => {
    const w = delta({ current: -50, previous: -100 })
    expect(w.text()).toContain('+50%')
    expect(badge(w).props('tone')).toBe('success')
  })

  it('names what it is compared with after the badge, and takes the badge size', () => {
    const w = delta({ current: 120, previous: 100, label: 'vs August', size: 'md' })
    expect(w.text()).toContain('vs August')
    expect(badge(w).props('size')).toBe('md')
    expect(badge(delta({ current: 1, previous: 2 })).props('size')).toBe('sm')
  })
})

describe('UiDelta — review follow-ups', () => {
  it('draws nothing when the ratio overflows', () => {
    expect(delta({ current: 1e308, previous: -1e308 }).html()).not.toContain('span')
    expect(delta({ current: Infinity, previous: 5 }).html()).not.toContain('span')
  })

  it('the verdict text comes from the dictionary, the change in it, said once', () => {
    const w = delta({ current: 120, previous: 100 })
    expect(w.find('.sr-only').text()).toBe('+20%, better')
    expect(w.find('[aria-hidden="true"]').text()).toBe('+20%')
  })

  it('in ru it prints the locale digits and says лучше or хуже', () => {
    const w = delta({ current: 112.3, previous: 100 }, withGrani(RUSSIAN))
    expect(w.find('[aria-hidden="true"]').text()).toMatch(/^\+12,3\s%$/)
    expect(w.find('.sr-only').text()).toMatch(/лучше$/)
  })

  it('flat with invert stays neutral and silent', () => {
    const w = delta({ current: 100.02, previous: 100, invert: true })
    expect(badge(w).props('tone')).toBe('neutral')
    expect(w.find('.sr-only').exists()).toBe(false)
  })

  it('invert with a negative base: a smaller loss is growth, so it is worse', () => {
    expect(badge(delta({ current: -50, previous: -100, invert: true })).props('tone')).toBe(
      'danger',
    )
  })

  it('no label draws no label span; a caller class reaches the root', () => {
    const w = mount(UiDelta, { props: { current: 2, previous: 1 }, attrs: { class: 'mark' } })
    expect(w.classes()).toContain('mark')
    expect(w.find('.text-fg-muted').exists()).toBe(false)
  })

  it('a change over 10 000% draws nothing: the base was dust, not a value', () => {
    expect(delta({ current: 5, previous: 0.1 + 0.2 - 0.3 }).html()).not.toContain('%')
    expect(delta({ current: 5, previous: 1e-9 }).html()).not.toContain('%')
    expect(delta({ current: 101, previous: 1 }).text()).toContain('10,000%')
  })

  it('a long label wraps beside the badge instead of running past the host', () => {
    const w = delta({ current: 120, previous: 100, label: 'versus the same week last year' })
    const label = w.find('span[class*="text-xs"]')
    expect(label.classes()).not.toContain('whitespace-nowrap')
    expect(label.classes()).toContain('min-w-0')
  })

  it('the badge does not shrink beside a long label', () => {
    const w = delta({ current: 112.3, previous: 100, label: 'versus the same week last year' })
    expect(badge(w).classes()).toContain('shrink-0')
  })

  it('a small fall is neutral 0%, never -0%', () => {
    const w = delta({ current: 99.96, previous: 100 })
    expect(badge(w).props('tone')).toBe('neutral')
    expect(w.text()).toContain('0%')
    expect(w.text()).not.toContain('-0')
  })

  it('0.5% is drawn: 100.5 shows +0.5%', () => {
    expect(delta({ current: 100.5, previous: 100 }).text()).toContain('+0.5%')
  })

  it('flat keeps its text readable to a screen reader', () => {
    const w = delta({ current: 100, previous: 100 })
    expect(w.find('[aria-hidden="true"]').exists()).toBe(false)
    expect(w.text()).toContain('0%')
  })

  it('removing previous removes the badge; restoring it draws it again', async () => {
    const w = delta({ current: 120, previous: 100 })
    await w.setProps({ previous: null })
    expect(w.html()).not.toContain('%')
    await w.setProps({ previous: 100 })
    expect(w.text()).toContain('+20%')
  })

  it('the label is not inside the verdict', () => {
    const w = delta({ current: 120, previous: 100, label: 'vs August' })
    expect(w.find('.sr-only').text()).toBe('+20%, better')
    expect(w.text()).toContain('vs August')
  })

  it('in ru a fall says хуже', () => {
    expect(
      delta({ current: 80, previous: 100 }, withGrani(RUSSIAN)).find('.sr-only').text(),
    ).toMatch(/хуже$/)
  })
})
