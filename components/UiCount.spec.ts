import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UiCount from './UiCount.vue'

describe('UiCount', () => {
  // Below zero is no count of anything: it reads as none, never as a minus sign in a badge.
  it('a negative count reads 0', () => {
    expect(mount(UiCount, { props: { count: -3 } }).text()).toBe('0')
  })

  it('Above max it reads 99+: one digit is a circle, two grow a capsule.', () => {
    const one = mount(UiCount, { props: { count: 3 } })
    expect(one.text()).toBe('3')
    expect(one.classes()).toEqual(
      expect.arrayContaining(['h-5', 'min-w-5', 'rounded-pill', 'tabular-nums']),
    )
    expect(mount(UiCount, { props: { count: 12 } }).text()).toBe('12')
    expect(mount(UiCount, { props: { count: 20 } }).text()).toBe('20')
    expect(mount(UiCount, { props: { count: 120 } }).text()).toBe('99+')
    expect(mount(UiCount, { props: { count: 1200, max: 999 } }).text()).toBe('999+')
    expect(mount(UiCount, { props: { count: 0 } }).text()).toBe('0')
  })

  it('sm is a 16px circle', () => {
    expect(mount(UiCount, { props: { count: 3, size: 'sm' } }).classes()).toEqual(
      expect.arrayContaining(['h-4', 'min-w-4']),
    )
  })

  it('soft is the pale plate, solid the saturated fill, brand included', () => {
    expect(mount(UiCount, { props: { count: 3, tone: 'info' } }).classes()).toContain(
      'bg-info-subtle',
    )
    expect(
      mount(UiCount, { props: { count: 7, variant: 'solid', tone: 'danger' } }).classes(),
    ).toEqual(expect.arrayContaining(['bg-danger', 'text-danger-fg']))
    expect(
      mount(UiCount, { props: { count: 7, variant: 'solid', tone: 'brand' } }).classes(),
    ).toEqual(expect.arrayContaining(['bg-brand-solid', 'text-brand-solid-fg']))
  })

  it('a short mark in the slot takes the same circle', () => {
    const w = mount(UiCount, { slots: { default: '!' } })
    expect(w.text()).toBe('!')
    expect(w.classes()).toContain('min-w-5')
  })

  it('attributes land on the root', () => {
    const w = mount(UiCount, { props: { count: 4 }, attrs: { 'data-testid': 'unread' } })
    expect(w.attributes('data-testid')).toBe('unread')
  })
  it('dot is a plain circle without a number', () => {
    const w = mount(UiCount, { props: { dot: true, count: 5, variant: 'solid', tone: 'success' } })
    expect(w.text()).toBe('')
    expect(w.classes()).toEqual(expect.arrayContaining(['h-2', 'w-2', 'bg-success']))
    expect(mount(UiCount, { props: { dot: true, size: 'sm' } }).classes()).toContain('h-1.5')
  })
  it('max itself is shown as is; one above it caps', () => {
    expect(mount(UiCount, { props: { count: 99 } }).text()).toBe('99')
    expect(mount(UiCount, { props: { count: 100 } }).text()).toBe('99+')
  })

  it('a dot is hidden from assistive tech, never wraps, and warns about a dropped slot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiCount, { props: { dot: true }, slots: { default: 'New' } })
    expect(w.text()).toBe('')
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(mount(UiCount, { props: { count: 3 } }).attributes('aria-hidden')).toBeUndefined()
    expect(mount(UiCount, { props: { count: 3 } }).classes()).toContain('whitespace-nowrap')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('UiCount — review follow-ups', () => {
  it('A count that is not a number shows nothing, with a warning in development.', () => {
    // An unknown count is not an empty one: a "0" would say there is nothing, which nobody knows.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const unknown = mount(UiCount, { props: { count: Number.NaN } })
    expect(unknown.find('.ui-count').exists()).toBe(false)
    expect(unknown.text()).toBe('')
    expect(
      mount(UiCount, { props: { count: Number.NaN, dot: true } })
        .find('.ui-count')
        .exists(),
    ).toBe(true)
    expect(mount(UiCount, { props: { count: -3 } }).text()).toBe('0')
    expect(mount(UiCount, { props: { count: 150, max: Number.NaN } }).text()).toBe('99+')
    expect(warn).toHaveBeenCalledTimes(4)
    warn.mockRestore()
  })

  it('the dev warning names the problem, never the count or max it got', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCount, { props: { count: Number.NaN, max: 4242 } })
    const said = warn.mock.calls.map(([m]) => String(m))
    expect(said.some((m) => m.includes('NaN'))).toBe(false)
    expect(said.some((m) => m.includes('4242'))).toBe(false)
    warn.mockRestore()
  })

  it('warning is solid even when soft is asked for: the gold, not the pale plate', () => {
    const w = mount(UiCount, { props: { count: 2, tone: 'warning' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-warning', 'text-warning-fg']))
    expect(w.classes()).not.toContain('bg-warning-subtle')
  })

  it('the digit is centered on its cap height, not on the font box', () => {
    expect(mount(UiCount, { props: { count: 1 } }).classes()).toContain(
      '[text-box:trim-both_cap_alphabetic]',
    )
  })
})

describe('UiCount — review follow-ups, second pass', () => {
  it('a standalone count is named as an image with its unit, not by a bare aria-label', () => {
    const w = mount(UiCount, { props: { count: 4, ariaLabel: '4 unread' } })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('4 unread')
    const plain = mount(UiCount, { props: { count: 4 } })
    expect(plain.attributes('role')).toBeUndefined()
  })

  it('an infinite count reads as the overflow, not zero', () => {
    expect(mount(UiCount, { props: { count: Infinity } }).text()).toBe('99+')
  })

  it('a fractional count is floored and a max below 1 falls back to 99', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mount(UiCount, { props: { count: 3.7 } }).text()).toBe('3')
    expect(mount(UiCount, { props: { count: 1, max: 0 } }).text()).toBe('1')
    warn.mockRestore()
  })

  it('the invalid-count warning fires once per bad value, not on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiCount, { props: { count: -3, tone: 'neutral' } })
    await w.setProps({ tone: 'brand' })
    await w.setProps({ size: 'sm' })
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('UiCount got'))).toHaveLength(1)
    await w.setProps({ count: -4 })
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('UiCount got'))).toHaveLength(2)
    warn.mockRestore()
  })
})

describe('UiCount — review follow-ups', () => {
  it('an unset count is 0, and a count that is not a number draws nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mount(UiCount).text()).toBe('0')
    expect(mount(UiCount, { props: { count: undefined } }).text()).toBe('0')
    expect(
      mount(UiCount, { props: { count: Number.NaN } })
        .find('.ui-count')
        .exists(),
    ).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
