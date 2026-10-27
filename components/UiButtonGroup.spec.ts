import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import UiMenu from './UiMenu.vue'
import UiPopover from './UiPopover.vue'
import UiSelect from './UiSelect.vue'
import UiTimePicker from './UiTimePicker.vue'
import UiDatePicker from './UiDatePicker.vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiSeparator from './UiSeparator.vue'
import UiField from './UiField.vue'
import UiInput from './UiInput.vue'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import { ChevronDown } from '@lucide/vue'

const two = '<button>Day</button><button>Week</button>'
const named = { ariaLabel: 'Period' }

describe('UiButtonGroup', () => {
  it('is a named group that keeps every child', () => {
    const w = mount(UiButtonGroup, { props: named, slots: { default: two } })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Period')
    expect(w.findAll('button')).toHaveLength(2)
  })

  it('squares the inner corners, keeps the outer ones on the shape token, overlaps the border', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } })
      .classes()
      .join(' ')
    expect(cls).toContain('[&>*:where(:not([role=group]))]:rounded-none')
    expect(cls).toContain('[&>*:first-child]:rounded-s-control')
    expect(cls).toContain('[&>*:last-child]:rounded-e-control')
    expect(cls).toContain('[&>*:not(:first-child):not([role=group])]:-ms-px')
  })

  it('vertical stacks and rounds top and bottom instead', () => {
    const cls = mount(UiButtonGroup, {
      props: { orientation: 'vertical' },
      slots: { default: two },
    })
      .classes()
      .join(' ')
    expect(cls).toContain('flex-col')
    expect(cls).toContain('[&>*:first-child]:rounded-t-control')
    expect(cls).toContain('[&>*:not(:first-child):not([role=group])]:-mt-px')
  })

  it('lifts a focused child above its neighbors, a focused field too', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } })
      .classes()
      .join(' ')
    expect(cls).toContain('[&>*:focus-visible]:z-10')
    expect(cls).toContain('[&>*:focus-within]:z-10')
  })

  it('does not set a height: children stretch to the tallest, a field grows in width', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } }).classes()
    expect(cls).toContain('items-stretch')
    // No `w-fit`: it would override a width class the caller passes; inline-flex shrinks to content.
    expect(cls).not.toContain('w-fit')
    expect(cls.some((c) => /^h-/.test(c))).toBe(false)
    expect(cls.join(' ')).toContain('[&>input]:flex-1')
  })

  it('nested groups get a gap; a UiSeparator draws its own line and stays a direct child', () => {
    const w = mount(UiButtonGroup, {
      slots: {
        default: () => [h('div', { role: 'group' }, [h('button', 'A')]), h(UiSeparator)],
      },
    })
    const cls = w.classes().join(' ')
    expect(cls).toContain('has-[>[role=group]]:gap-2')
    // A nested group is spaced, never joined: every join selector excludes it.
    expect(cls).not.toMatch(/\[&>\*(?::not\(:first-child\))?\]:/)
    const line = w.find(':scope > [role="separator"]')
    expect(line.attributes('aria-orientation')).toBe('vertical')
    expect(line.classes()).toEqual(expect.arrayContaining(['border-s', 'border-border']))
  })
})

describe('UiButtonGroup — a split button', () => {
  it('two filled neighbors are split by a seam, not overlapped', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } })
      .classes()
      .join(' ')
    expect(cls).toContain('[&>[data-filled]+[data-filled]]:!ms-px')
    const col = mount(UiButtonGroup, {
      props: { ...named, orientation: 'vertical' },
      slots: { default: two },
    })
      .classes()
      .join(' ')
    expect(col).toContain('[&>[data-filled]+[data-filled]]:!mt-px')
  })

  it('a primary button and a primary arrow join without the ghost warning; a ghost still warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiButtonGroup, {
      props: named,
      slots: {
        default: () => [
          h(UiButton, () => 'Save'),
          h(UiIconButton, { variant: 'primary', icon: ChevronDown, ariaLabel: 'More' }),
        ],
      },
    })
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('ghost'))
    mount(UiButtonGroup, {
      props: named,
      slots: {
        default: () => [
          h(UiIconButton, { variant: 'ghost', icon: ChevronDown, ariaLabel: 'More' }),
        ],
      },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ghost'))
    warn.mockRestore()
  })
})

describe('UiButtonGroup — inside UiField', () => {
  const buttons = () => [h('button', 'Day'), h('button', 'Week')]

  it('in a group field the legend names it and the error describes it', () => {
    const w = mount(UiField, {
      props: { label: 'Period', group: true, error: 'Pick a period' },
      slots: { default: () => h(UiButtonGroup, null, buttons) },
    })
    const group = w.find('[role=group]')
    expect(group.attributes('aria-labelledby')).toBe(w.find('legend').attributes('id'))
    expect(group.attributes('aria-describedby')).toBe(w.find('[role=alert]').attributes('id'))
  })

  it('its own ariaLabel wins over the legend', () => {
    const w = mount(UiField, {
      props: { label: 'Period', group: true },
      slots: { default: () => h(UiButtonGroup, { ariaLabel: 'Range' }, buttons) },
    })
    expect(w.find('[role=group]').attributes('aria-label')).toBe('Range')
    expect(w.find('[role=group]').attributes('aria-labelledby')).toBeUndefined()
  })

  it('only the outermost group takes the field', () => {
    const w = mount(UiField, {
      props: { label: 'Actions', group: true, description: 'Applied at once' },
      slots: {
        default: () =>
          h(UiButtonGroup, null, () => [h(UiButtonGroup, { ariaLabel: 'Inner' }, buttons)]),
      },
    })
    const [outer, inner] = w.findAll('[role=group]')
    expect(outer!.attributes('aria-describedby')).toBeTruthy()
    expect(inner!.attributes('aria-describedby')).toBeUndefined()
  })

  it('in a plain field the input inside is the control, the group takes nothing', () => {
    const w = mount(UiField, {
      props: { label: 'Address', description: 'Work address' },
      slots: {
        default: () =>
          h(UiButtonGroup, { ariaLabel: 'Address' }, () => [
            h(UiInput, { modelValue: '' }),
            h('button', 'Copy'),
          ]),
      },
    })
    expect(w.find('input').attributes('id')).toBe(w.find('label').attributes('for'))
    expect(w.find('[role=group]').attributes('aria-describedby')).toBeUndefined()
  })

  it('warns in dev when a plain field holds only buttons, or the group has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiField, {
      props: { label: 'Period' },
      slots: { default: () => h(UiButtonGroup, { ariaLabel: 'Period' }, buttons) },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('use UiField group'))
    warn.mockClear()
    mount(UiButtonGroup, { slots: { default: two } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockRestore()
  })
})

describe('UiButtonGroup — review follow-ups', () => {
  it('lifts the hovered child, so its border shows whole over the neighbor', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } }).classes()
    expect(cls).toEqual(
      expect.arrayContaining([
        '[&>*:is(:enabled,a):not([aria-disabled=true]):hover]:relative',
        '[&>*:is(:enabled,a):not([aria-disabled=true]):hover]:z-[5]',
      ]),
    )
  })

  it('warns when a nested group has no name of its own, even though it is never wired to the field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiButtonGroup, {
      props: named,
      slots: { default: () => h(UiButtonGroup, null, () => [h('button', 'Archive')]) },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockRestore()
  })

  it('warns in dev when direct children stand on different steps of the control ladder', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiButtonGroup, {
      props: named,
      slots: { default: '<button class="h-11">Day</button><button class="h-9">Week</button>' },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('different steps'))
    warn.mockClear()
    mount(UiButtonGroup, {
      props: named,
      slots: { default: '<button class="h-9">Day</button><button class="h-9">Week</button>' },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('warns in dev when a child has no border (ghost, primary)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiButtonGroup, {
      props: named,
      slots: { default: '<button class="border-transparent">Day</button><button>Week</button>' },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="outline"'))
    warn.mockRestore()
  })

  it('beside a nested group a plain child drops its overlap, so every gap is 8px', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } }).classes()
    expect(cls).toEqual(
      expect.arrayContaining([
        'has-[>[role=group]]:gap-2',
        'has-[>[role=group]]:[&>*:not([role=group])]:!ms-0',
      ]),
    )
  })
})

describe('UiButtonGroup — review follow-ups, second pass', () => {
  it('lifts an invalid child above its neighbors so its border and halo show whole', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } }).classes()
    expect(cls).toEqual(
      expect.arrayContaining(['[&>[data-invalid]]:relative', '[&>[data-invalid]]:z-[6]']),
    )
    // Focus stays above it: the ring of a focused neighbor is not covered by the red frame.
    expect(cls).toContain('[&>*:focus-visible]:z-10')
    const w = mount(UiField, {
      props: { label: 'Search', error: 'Type two letters' },
      slots: {
        default: () =>
          h(UiButtonGroup, null, () => [
            h(UiInput, { modelValue: 'a' }),
            h(UiButton, { variant: 'outline' }, () => 'Find'),
          ]),
      },
    })
    expect(w.find('[role=group] > .ui-capsule').attributes('data-invalid')).toBe('true')
  })

  it('does not lift a disabled child on hover', () => {
    const cls = mount(UiButtonGroup, { props: named, slots: { default: two } }).classes()
    expect(cls).not.toContain('[&>*:hover]:z-[5]')
    expect(cls).toContain('[&>*:is(:enabled,a):not([aria-disabled=true]):hover]:z-[5]')
  })

  it('a group inside a popover opened from another group is wired to its own field', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButtonGroup, {
      attachTo: document.body,
      props: { ariaLabel: 'Actions' },
      slots: {
        default: () =>
          h(
            UiPopover,
            { open: true, ariaLabel: 'Range' },
            {
              trigger: () => h(UiButton, { variant: 'outline' }, () => 'Range'),
              default: () =>
                h(UiField, { label: 'Hours', group: true }, () =>
                  h(UiButtonGroup, null, () => [
                    h(UiButton, { variant: 'outline' }, () => 'From'),
                    h(UiButton, { variant: 'outline' }, () => 'To'),
                  ]),
                ),
            },
          ),
      },
    })
    await nextTick()
    await nextTick()
    // The innermost button group: the outer one holds the panel in the test's teleport stub.
    const inner = [...document.querySelectorAll('[role=group].items-stretch')]
      .filter((g) => g.textContent?.includes('From'))
      .at(-1)!
    expect(inner.getAttribute('aria-labelledby')).toBeTruthy()
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('UiButtonGroup has no name'))
    warn.mockRestore()
    w.unmount()
  })

  it('warns in dev when a direct child is a wrapper that cannot join', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiButtonGroup, {
      props: named,
      slots: { default: '<span><button>Day</button></span><button>Week</button>' },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a wrapper around a control'))
    warn.mockRestore()
  })

  it("a row carries the rule that narrows a split arrow; a column does not (the width is the browser's)", () => {
    const row = mount(UiButtonGroup, { props: named })
    const arrow = '[&>:is(button,a):not([data-square])+[data-square=sm]:last-child]:w-7'
    expect(row.classes()).toContain(arrow)
    const column = mount(UiButtonGroup, { props: { ...named, orientation: 'vertical' } })
    expect(column.classes()).not.toContain(arrow)
  })

  it('a split button, a select and a time picker join with no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButtonGroup, {
      attachTo: document.body,
      // A real teleport leaves a comment in the row, as in the browser; the stub leaves an element.
      global: { stubs: { teleport: false } },
      props: named,
      slots: {
        default: () => [
          h(UiSelect, { modelValue: null, items: [], ariaLabel: 'Kind' }),
          h(UiTimePicker, { ariaLabel: 'At' }),
          h(UiButton, null, () => 'Save'),
          h(
            UiMenu,
            { items: [{ label: 'Save as draft', onSelect: () => {} }] },
            {
              trigger: () =>
                h(UiIconButton, { variant: 'primary', ariaLabel: 'More', icon: ChevronDown }),
            },
          ),
        ],
      },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })

  it('a date picker joins as a capsule; with presets under it, it is said not to join', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButtonGroup, {
      attachTo: document.body,
      props: named,
      slots: {
        default: () => [h(UiDatePicker, { ariaLabel: 'On' }), h(UiTimePicker, { ariaLabel: 'At' })],
      },
    })
    expect(w.element.firstElementChild!.classList).toContain('ui-capsule')
    expect(warn).not.toHaveBeenCalled()
    mount(UiButtonGroup, {
      attachTo: document.body,
      props: named,
      slots: {
        default: () => [
          h(UiDatePicker, { ariaLabel: 'On', presets: true }),
          h(UiButton, null, () => 'Go'),
        ],
      },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a wrapper around a control'))
    warn.mockRestore()
    w.unmount()
  })

  it('a link child joins as a button does', () => {
    const w = mount(UiButtonGroup, {
      props: named,
      slots: {
        default: () => [
          h(UiButton, { variant: 'outline', to: '/a' }, () => 'Open'),
          h(UiButton, { variant: 'outline' }, () => 'Copy'),
        ],
      },
    })
    expect(w.element.firstElementChild!.tagName).toBe('A')
    expect(w.classes().join(' ')).toContain(
      '[&>*:is(:enabled,a):not([aria-disabled=true]):hover]:relative',
    )
  })
})
