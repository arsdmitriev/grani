import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiCard from './UiCard.vue'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiHeader from './UiHeader.vue'
import UiMenu from './UiMenu.vue'
import UiModal from './UiModal.vue'
import UiPopover from './UiPopover.vue'
import UiSeparator from './UiSeparator.vue'
import UiListItem from './UiListItem.vue'
import { BLEED, SURFACE_GUTTER } from '../utils/surface'

const inGroup = (orientation: 'horizontal' | 'vertical', sep: Record<string, unknown> = {}) =>
  mount(UiButtonGroup, {
    props: { ariaLabel: 'Snooze', orientation },
    slots: { default: () => [h('button', 'A'), h(UiSeparator, sep), h('button', 'B')] },
  }).find('[role="separator"]')

describe('UiSeparator', () => {
  it('is a horizontal separator by default: a 1px border line across its parent', () => {
    const w = mount(UiSeparator)
    expect(w.attributes('role')).toBe('separator')
    expect(w.attributes('aria-orientation')).toBe('horizontal')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['self-stretch', 'border-t', 'border-border']),
    )
  })

  it('vertical stands between items of a row and stretches to its height', () => {
    const w = mount(UiSeparator, { props: { orientation: 'vertical' } })
    expect(w.attributes('aria-orientation')).toBe('vertical')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['self-stretch', 'border-s', 'border-border']),
    )
  })

  it('is drawn as a border, never a fill: forced colors flatten backgrounds', () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const cls = mount(UiSeparator, { props: { orientation } }).classes()
      expect(cls.some((c) => c.startsWith('bg-'))).toBe(false)
    }
  })

  it('inside a UiButtonGroup it stands across the group unless told otherwise', () => {
    expect(inGroup('horizontal').attributes('aria-orientation')).toBe('vertical')
    expect(inGroup('vertical').attributes('aria-orientation')).toBe('horizontal')
    expect(
      inGroup('horizontal', { orientation: 'horizontal' }).attributes('aria-orientation'),
    ).toBe('horizontal')
  })

  it('has no margin of its own and takes no focus', () => {
    const w = mount(UiSeparator)
    expect(w.classes().some((c) => /^-?m[trblxyse]?-/.test(c))).toBe(false)
    expect(w.attributes('tabindex')).toBeUndefined()
  })

  it("the caller's attributes land on the line", () => {
    const w = mount(UiSeparator, { attrs: { 'data-testid': 'sep', class: 'my-2' } })
    expect(w.attributes('data-testid')).toBe('sep')
    expect(w.classes()).toContain('my-2')
  })
})

describe('UiSeparator — review follow-ups', () => {
  it('a host bleed (-mx-4) is not fought by a width of its own', () => {
    const w = mount(UiSeparator, { attrs: { class: '-mx-4' } })
    expect(w.classes().filter((c) => /^w-/.test(c))).toEqual([])
    expect(w.classes()).toContain('-mx-4')
  })

  it('between nested groups the line is spaced, not overlapped by the next control', () => {
    const w = mount(UiButtonGroup, {
      props: { ariaLabel: 'Formatting' },
      slots: {
        default: () => [
          h(UiButtonGroup, { ariaLabel: 'Style' }, () => [h('button', 'B'), h('button', 'I')]),
          h(UiSeparator),
          h('button', 'Link'),
        ],
      },
    })
    const cls = w.classes().join(' ')
    expect(cls).toContain('has-[>[role=group]]:gap-2')
    expect(cls).toContain('has-[>[role=group]]:[&>*:not([role=group])]:!ms-0')
    expect(w.find('[role=separator]').attributes('aria-orientation')).toBe('vertical')
  })
})

describe('UiSeparator — the gutter of its surface', () => {
  it('a horizontal line bleeds through the gutter it is given; a vertical one and a line outside a surface do not', () => {
    const inSurface = (orientation?: 'vertical') =>
      mount(UiSeparator, {
        props: orientation ? { orientation } : {},
        global: { provide: { [SURFACE_GUTTER as symbol]: 'surface-md' } },
      })
    expect(inSurface().classes()).toContain('-mx-surface-md')
    expect(inSurface('vertical').classes()).not.toContain('-mx-surface-md')
    expect(
      mount(UiSeparator)
        .classes()
        .some((c) => c.startsWith('-mx-')),
    ).toBe(false)
  })
})

describe('UiSeparator — review follow-ups', () => {
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await new Promise((r) => setTimeout(r))
  }
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })
  const lines = () =>
    [...document.body.querySelectorAll('[role="separator"]')].map((n) =>
      n.getAttribute('aria-orientation'),
    )

  it('bleeds through every gutter of BLEED', () => {
    for (const gutter of Object.keys(BLEED) as (keyof typeof BLEED)[]) {
      const w = mount(UiSeparator, { global: { provide: { [SURFACE_GUTTER as symbol]: gutter } } })
      expect(w.classes()).toContain(BLEED[gutter])
    }
  })

  it('a modal or drawer opened from a horizontal button group still draws horizontal section lines', async () => {
    const sections = () => [h(UiCard, null, () => 'A'), h(UiCard, null, () => 'B')]
    mount(UiButtonGroup, {
      attachTo: document.body,
      props: { ariaLabel: 'Actions' },
      slots: {
        default: () => [
          h('button', 'Open'),
          h(UiModal, { title: 'Edit', open: true }, () => [h(UiSeparator)]),
          h(UiCrudDrawer, { title: 'Client', open: true }, sections),
        ],
      },
    })
    await settle()
    expect(lines().length).toBeGreaterThanOrEqual(2)
    expect(lines().every((o) => o === 'horizontal')).toBe(true)
  })

  it('no separator is placed before a section that opens with a legend', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: {
        default: () => [
          h(UiCard, null, () => 'Head'),
          h(UiCard, null, () => [h(UiHeader, { variant: 'legend', title: 'Contact' })]),
          h(UiCard, null, () => 'Plain'),
        ],
      },
    })
    await settle()
    // One line: before the plain third section; the legend is the line above the second.
    expect(document.body.querySelectorAll('.ui-sections > [role="separator"]')).toHaveLength(1)
  })

  it('a popover places no separator before a section that opens with a legend', async () => {
    mount(UiPopover, {
      attachTo: document.body,
      props: { open: true },
      slots: {
        trigger: () => h('button', 'Filter'),
        default: () => [
          h(UiCard, null, () => 'Search'),
          h(UiCard, null, () => [h(UiHeader, { variant: 'legend', title: 'Sort' })]),
        ],
      },
    })
    await settle()
    expect(lines()).toHaveLength(0)
  })

  it('a menu draws no separator at its start or end, nor two in a row', async () => {
    const w = mount(UiMenu, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'more' }, 'More'),
        default: () => [
          h(UiSeparator),
          h(UiListItem, { as: 'button', title: 'Copy' }),
          h(UiSeparator),
          null,
          h(UiSeparator),
          h(UiListItem, { as: 'button', title: 'Move' }),
          h(UiSeparator),
        ],
      },
    })
    document.body.querySelector<HTMLElement>('.more')!.click()
    await settle()
    const menu = document.body.querySelector('[role="menu"]')!
    const kids = [...menu.querySelectorAll('[role="menuitem"], [role="separator"]')].map((n) =>
      n.getAttribute('role'),
    )
    expect(kids).toEqual(['menuitem', 'separator', 'menuitem'])
    w.unmount()
  })
})
