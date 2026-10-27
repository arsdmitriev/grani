import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiCheckbox from './UiCheckbox.vue'
import UiCodeInput from './UiCodeInput.vue'
import UiDateRange from './UiDateRange.vue'
import UiInput from './UiInput.vue'
import UiListField from './UiListField.vue'
import UiPasswordField from './UiPasswordField.vue'
import UiRadio from './UiRadio.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiScaleInput from './UiScaleInput.vue'
import UiSwitch from './UiSwitch.vue'
import UiTextarea from './UiTextarea.vue'
import { h } from 'vue'

// `required`, `id` and `size` are props wherever they apply, not attributes some controls happen
// to pass on: the control and a reader hear them, and TypeScript knows them.
describe('required is a prop', () => {
  const natives: [string, () => ReturnType<typeof mount>, string][] = [
    [
      'UiInput',
      () => mount(UiInput, { props: { modelValue: '', ariaLabel: 'A', required: true } }),
      'input',
    ],
    [
      'UiTextarea',
      () => mount(UiTextarea, { props: { modelValue: '', ariaLabel: 'A', required: true } }),
      'textarea',
    ],
    [
      'UiCodeInput',
      () => mount(UiCodeInput, { props: { modelValue: '', ariaLabel: 'A', required: true } }),
      'input',
    ],
    [
      'UiCheckbox',
      () =>
        mount(UiCheckbox, {
          props: { modelValue: false, required: true },
          slots: { default: 'Terms' },
        }),
      'input',
    ],
  ]
  it.each(natives)('%s: native required and aria-required on the control', (_, make, sel) => {
    const el = make().find(sel)
    expect(el.attributes('required')).toBeDefined()
    expect(el.attributes('aria-required')).toBe('true')
  })

  it('UiCheckbox and UiSwitch put the star after their text', () => {
    const box = mount(UiCheckbox, {
      props: { modelValue: false, required: true },
      slots: { default: 'Terms' },
    })
    expect(box.text()).toContain('*')
    const sw = mount(UiSwitch, {
      props: { modelValue: false, required: true },
      slots: { default: 'On' },
    })
    expect(sw.find('[role="switch"]').attributes('aria-required')).toBe('true')
    expect(sw.text()).toContain('*')
  })
})

describe('id is a prop', () => {
  it('lands on the element a label or a reference points at', () => {
    expect(
      mount(UiPasswordField, { props: { modelValue: '', ariaLabel: 'P', id: 'pw' } })
        .find('input')
        .attributes('id'),
    ).toBe('pw')
    expect(
      mount(UiListField, { props: { ariaLabel: 'Tags', id: 'tags' } })
        .find('input')
        .attributes('id'),
    ).toBe('tags')
    expect(
      mount(UiDateRange, { props: { id: 'period' } })
        .find('button')
        .attributes('id'),
    ).toBe('period')
    expect(
      mount(UiScaleInput, { props: { modelValue: null, ariaLabel: 'S', id: 'scale' } })
        .find('[role=radiogroup]')
        .attributes('id'),
    ).toBe('scale')
    expect(
      mount(UiRadioGroup, {
        props: { modelValue: null, id: 'kind' },
        attrs: { 'aria-label': 'Kind' },
        slots: { default: () => h(UiRadio, { value: 'a' }, () => 'A') },
      })
        .find('[role=radiogroup]')
        .attributes('id'),
    ).toBe('kind')
  })
})

describe('size is a prop', () => {
  it('a checkbox and a plain radio size their mark: 16, 18 and 20 px', () => {
    const box = (size?: 'xs' | 'sm' | 'md') =>
      mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'A', size } })
        .find('input')
        .classes()
    expect(box('xs')).toContain('h-4')
    expect(box()).toContain('h-[18px]')
    expect(box('md')).toContain('h-5')
    const radio = mount(UiRadioGroup, {
      props: { modelValue: null, size: 'md' },
      attrs: { 'aria-label': 'Kind' },
      slots: { default: () => h(UiRadio, { value: 'a' }, () => 'A') },
    })
    expect(radio.find('input').classes()).toContain('h-5')
  })

  it("a list field's row is 44 px at sm and 56 at md, as a list row", () => {
    const row = (size?: 'xs' | 'sm' | 'md') =>
      mount(UiListField, { props: { ariaLabel: 'Tags', size } })
        .find('.ui-add-row')
        .classes()
    expect(row()).toContain('h-11')
    expect(row('xs')).toContain('h-11')
    expect(row('md')).toContain('h-14')
  })
})
