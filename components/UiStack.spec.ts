import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import UiStack from './UiStack.vue'

const STEPS = {
  tight: 'gap-2',
  group: 'gap-4',
  title: 'gap-6',
  block: 'gap-12',
  section: 'gap-24',
} as const

describe('UiStack', () => {
  it('is a div, a column at the group step, stretched, by default', () => {
    const w = mount(UiStack)
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['flex', 'flex-col', 'gap-4', 'items-stretch']),
    )
  })

  it('every step of the scale is one gap class, and the only one', () => {
    for (const gap of Object.keys(STEPS) as (keyof typeof STEPS)[]) {
      const cls = mount(UiStack, { props: { gap } }).classes()
      expect(cls.filter((c) => c.startsWith('gap-'))).toEqual([STEPS[gap]])
    }
  })

  it('a row centers its children on the line unless told otherwise', () => {
    const row = mount(UiStack, { props: { direction: 'row' } }).classes()
    expect(row).toEqual(expect.arrayContaining(['flex-row', 'items-center']))
    expect(row).not.toContain('flex-col')
    const top = mount(UiStack, { props: { direction: 'row', align: 'start' } }).classes()
    expect(top).toContain('items-start')
    expect(top).not.toContain('items-center')
  })

  it('a column takes an alignment too', () => {
    expect(mount(UiStack, { props: { align: 'center' } }).classes()).toContain('items-center')
  })

  it('renders as the element `as` names', () => {
    expect(mount(UiStack, { props: { as: 'section' } }).element.tagName).toBe('SECTION')
    expect(mount(UiStack, { props: { as: 'ul' } }).element.tagName).toBe('UL')
  })

  it('is a gap, never a margin or a padding of its own', () => {
    for (const direction of ['column', 'row'] as const) {
      const cls = mount(UiStack, { props: { direction } }).classes()
      expect(cls.some((c) => /^-?[mp][trblxyse]?-/.test(c))).toBe(false)
    }
  })

  it("the caller's attributes land on the root beside the scale", () => {
    const w = mount(UiStack, {
      attrs: { 'data-testid': 'stack', class: 'w-80', 'aria-label': 'Profile' },
    })
    expect(w.attributes('data-testid')).toBe('stack')
    expect(w.attributes('aria-label')).toBe('Profile')
    expect(w.classes()).toEqual(expect.arrayContaining(['w-80', 'gap-4']))
  })

  it('renders its children in order', () => {
    const w = mount(UiStack, { slots: { default: () => [h('p', 'One'), h('p', 'Two')] } })
    expect(w.findAll('p').map((p) => p.text())).toEqual(['One', 'Two'])
  })
})
