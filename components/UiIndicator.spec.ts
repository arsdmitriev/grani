import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import UiIndicator from './UiIndicator.vue'

const host = '<button aria-label="Notifications, 3 new">Bell</button>'

describe('UiIndicator', () => {
  it('pins a solid count to the top end corner, danger by default', () => {
    const w = mount(UiIndicator, { props: { count: 3 }, slots: { default: host } })
    const mark = w.find('[aria-hidden="true"]')
    expect(mark.classes()).toEqual(expect.arrayContaining(['absolute', 'end-0', 'top-0']))
    const count = w.find('.ui-count')
    expect(count.text()).toBe('3')
    expect(count.classes()).toEqual(
      expect.arrayContaining(['bg-danger', 'ring-2', 'ui-indicator-mark']),
    )
    expect(w.find('button').exists()).toBe(true)
  })

  it('a negative count is none: the mark is gone, as at zero', () => {
    const w = mount(UiIndicator, { props: { count: -3 }, slots: { default: host } })
    expect(w.find('.ui-count').exists()).toBe(false)
  })

  it('At zero the mark is gone; a dot shows without a count.', () => {
    expect(
      mount(UiIndicator, { props: { count: 0 }, slots: { default: host } })
        .find('.ui-count')
        .exists(),
    ).toBe(false)
    const dot = mount(UiIndicator, {
      props: { dot: true, tone: 'success' },
      slots: { default: host },
    })
    const c = dot.find('.ui-count')
    expect(c.text()).toBe('')
    expect(c.classes()).toEqual(expect.arrayContaining(['h-2', 'w-2', 'bg-success']))
  })

  it('Past max the mark reads 99+, at any corner.', () => {
    const w = mount(UiIndicator, {
      props: { count: 150, placement: 'bottom-start' },
      slots: { default: host },
    })
    expect(w.find('.ui-count').text()).toBe('99+')
    expect(w.find('[aria-hidden="true"]').classes()).toEqual(
      expect.arrayContaining(['bottom-0', 'start-0']),
    )
  })

  it('pulse adds a ring in the tone behind the mark', () => {
    const w = mount(UiIndicator, { props: { count: 1, pulse: true }, slots: { default: host } })
    expect(w.find('.animate-ping').classes()).toContain('bg-danger')
    expect(
      mount(UiIndicator, { props: { count: 1 }, slots: { default: host } })
        .find('.animate-ping')
        .exists(),
    ).toBe(false)
  })

  it('the mark is decoration; the host keeps the name', () => {
    const w = mount(UiIndicator, { props: { count: 3 }, slots: { default: host } })
    expect(w.find('[aria-hidden="true"]').exists()).toBe(true)
    expect(w.find('button').attributes('aria-label')).toBe('Notifications, 3 new')
  })
  it('round puts the mark on the edge of a circle, not the corner of its box', () => {
    const w = mount(UiIndicator, {
      props: { dot: true, round: true, placement: 'bottom-end' },
      slots: { default: host },
    })
    expect(w.find('[aria-hidden="true"]').classes()).toEqual(
      expect.arrayContaining(['bottom-[14.6%]', 'end-[14.6%]']),
    )
  })
  it('the ring takes the surface behind it from --ui-indicator-ring', () => {
    const w = mount(UiIndicator, { props: { count: 1 }, slots: { default: host } })
    // The color comes from the `.ui-indicator-mark` rule in tokens.css.
    expect(w.find('.ui-count').classes()).toEqual(
      expect.arrayContaining(['ui-indicator-mark', 'ring-2']),
    )
  })

  it('the slot gets the count to name the state from', () => {
    const w = mount(UiIndicator, {
      props: { count: 4 },
      slots: {
        default: `<template #default="{ count }"><button :aria-label="'Inbox, ' + count + ' new'" /></template>`,
      },
    })
    expect(w.find('button').attributes('aria-label')).toBe('Inbox, 4 new')
  })

  it('sm, the top start corner, and a pulsing dot', () => {
    const w = mount(UiIndicator, {
      props: { dot: true, pulse: true, size: 'sm', placement: 'top-start' },
      slots: { default: host },
    })
    expect(w.find('.ui-count').classes()).toContain('h-1.5')
    expect(w.find('[aria-hidden="true"]').classes()).toEqual(
      expect.arrayContaining(['start-0', 'top-0']),
    )
    expect(w.find('.animate-ping').exists()).toBe(true)
  })
})

describe('UiIndicator — review follow-ups', () => {
  it('shows the overflow mark for an Infinity count, as UiCount does', () => {
    const w = mount(UiIndicator, {
      props: { count: Infinity },
      slots: { default: '<button>x</button>' },
    })
    expect(w.find('.ui-count').text()).toBe('99+')
  })

  it('places the mark on logical sides and mirrors the shift in rtl', () => {
    const w = mount(UiIndicator, { props: { count: 2 }, slots: { default: '<button>x</button>' } })
    const mark = w.find('[aria-hidden="true"]')
    expect(mark.classes()).toEqual(expect.arrayContaining(['end-0', 'rtl:-translate-x-1/2']))
    expect(mark.classes()).not.toContain('right-0')
  })

  it('A count that is not a number hides the mark and warns in development.', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiIndicator, {
      props: { count: Number.NaN },
      slots: {
        default: `<template #default="{ count }"><button :aria-label="'Inbox, ' + count + ' new'">x</button></template>`,
      },
    })
    expect(w.find('button').attributes('aria-label')).toBe('Inbox, 0 new')
    expect(w.find('.ui-count').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiIndicator got an invalid count'))
    warn.mockRestore()
  })
})

describe('UiIndicator — review follow-ups, second pass', () => {
  const said: Record<string, unknown>[] = []
  const probe = (props: Record<string, unknown>) => {
    said.length = 0
    return mount(UiIndicator, {
      props,
      slots: {
        default: (scope: Record<string, unknown>) => (said.push(scope), h('button', 'Bell')),
      },
    })
  }

  it('floors a fraction and hides a count that floors to zero', () => {
    expect(probe({ count: 3.7 }).find('.ui-count').text()).toBe('3')
    expect(said.at(-1)!.count).toBe(3)
    expect(probe({ count: 0.4 }).find('.ui-count').exists()).toBe(false)
  })

  it('the slot says what the mark reads and whether it is drawn, so a dot can be named', () => {
    probe({ count: 120 })
    expect(said.at(-1)).toMatchObject({ text: '99+', visible: true })
    probe({ dot: true })
    expect(said.at(-1)).toMatchObject({ visible: true })
    probe({ count: 0 })
    expect(said.at(-1)).toMatchObject({ visible: false })
  })

  it('reads a max as UiCount does', () => {
    expect(probe({ count: 10, max: 9 }).find('.ui-count').text()).toBe('9+')
  })
})

describe('UiIndicator — reduced motion', () => {
  it('Its pulse stops when the system asks for reduced motion: it calls, it does not work.', () => {
    // The pulse calls attention, so the reduced-motion floor stops it; only signs of work are
    // kept moving. The ring carries no keep mark, and the keep rules do not name it.
    const w = mount(UiIndicator, { props: { count: 1, pulse: true }, slots: { default: host } })
    const ring = w.find('.animate-ping')
    expect(ring.attributes()).not.toHaveProperty('data-motion-keep')
    expect(ring.classes()).not.toContain('ui-skeleton')
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduce).not.toMatch(/animate-ping/)
  })
})
