import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import UiCheckbox from './UiCheckbox.vue'
import UiCodeInput from './UiCodeInput.vue'
import UiDatePicker from './UiDatePicker.vue'
import UiPasswordField from './UiPasswordField.vue'
import UiScaleInput from './UiScaleInput.vue'
import UiDropzone from './UiDropzone.vue'
import UiTimePicker from './UiTimePicker.vue'
import UiField from './UiField.vue'
import UiFilterList from './UiFilterList.vue'
import UiInput from './UiInput.vue'
import UiRadio from './UiRadio.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiSelect from './UiSelect.vue'
import UiSwitch from './UiSwitch.vue'
import UiTextarea from './UiTextarea.vue'

// Every component whose root is not its control. The caller writes `@blur`,
// `required`, `data-testid` and `aria-describedby` for the control; `class`
// and `style` for the box around it. The lint rule `attrs-on-wrapper` keeps
// the list complete: a new wrapper joins it here.
const attrs = {
  'data-testid': 'ctl',
  'aria-describedby': 'own-hint',
  class: 'mt-2',
  style: 'width: 10rem',
}

// [name, mount, the control that takes the attributes, the element a reader focuses when it differs]
const cases: [string, () => ReturnType<typeof mount>, string, string?][] = [
  ['UiInput', () => mount(UiInput, { props: { modelValue: '', ariaLabel: 'A' }, attrs }), 'input'],
  [
    'UiTextarea',
    () => mount(UiTextarea, { props: { modelValue: '', ariaLabel: 'A' }, attrs }),
    'textarea',
  ],
  [
    'UiSelect',
    () => mount(UiSelect, { props: { modelValue: null, items: [], ariaLabel: 'A' }, attrs }),
    '[role="combobox"]',
  ],
  [
    'UiCheckbox',
    () => mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'A' }, attrs }),
    'input',
  ],
  [
    'UiSwitch',
    () => mount(UiSwitch, { props: { modelValue: false }, slots: { default: 'A' }, attrs }),
    '[role="switch"]',
  ],
  [
    'UiCodeInput',
    () => mount(UiCodeInput, { props: { modelValue: '', ariaLabel: 'A' }, attrs }),
    'input',
  ],
  [
    'UiDropzone',
    () => mount(UiDropzone, { props: { modelValue: [], ariaLabel: 'A' }, attrs }),
    'input[type="file"]',
    // The file input is inert (`tabindex="-1"`): a reader hears the description on the browse button.
    'button[type="button"]',
  ],
  [
    'UiDatePicker',
    () => mount(UiDatePicker, { props: { modelValue: '', ariaLabel: 'A' }, attrs }),
    '[role="combobox"]',
  ],
  [
    'UiScaleInput',
    () => mount(UiScaleInput, { props: { modelValue: null, ariaLabel: 'A' }, attrs }),
    '[role="radiogroup"]',
  ],
  [
    'UiPasswordField',
    () => mount(UiPasswordField, { props: { modelValue: '', ariaLabel: 'A' }, attrs }),
    'input',
  ],
  [
    'UiTimePicker',
    () => mount(UiTimePicker, { props: { modelValue: '', ariaLabel: 'A' }, attrs }),
    '[role="combobox"]',
  ],
  [
    'UiFilterList',
    () => mount(UiFilterList, { props: { items: [], modelValue: [], ariaLabel: 'A' }, attrs }),
    '[role="listbox"]',
  ],
  [
    'UiRadio',
    () =>
      mount(UiRadioGroup, {
        props: { modelValue: null, ariaLabel: 'A' },
        slots: { default: () => h(UiRadio, { value: 'a', ...attrs }) },
      }),
    'input[type="radio"]',
  ],
]

describe('canon: attributes reach the control, class and style stay on the root', () => {
  for (const [name, make, selector, described] of cases) {
    it(name, () => {
      const w = make()
      const root =
        name === 'UiRadio'
          ? w.find('label')
          : ['UiTimePicker'].includes(name)
            ? w.find('.ui-capsule')
            : w
      const control = w.find(selector)
      const reader = described ? w.find(described) : control
      expect(control.exists(), `${name} has a control`).toBe(true)
      expect(control.attributes('data-testid')).toBe('ctl')
      expect(root.attributes('data-testid')).toBeUndefined()
      expect(root.classes()).toContain('mt-2')
      expect(root.attributes('style')).toContain('width: 10rem')
      expect(control.classes()).not.toContain('mt-2')
      // The caller's description is kept, not replaced by the component's own.
      expect(reader.attributes('aria-describedby')).toContain('own-hint')
    })
  }

  it("inside a described field the caller's description is joined with the field's, for every wrapper", () => {
    const inField = (
      comp: object,
      props: Record<string, unknown>,
      slots?: Record<string, unknown>,
    ) =>
      mount(UiField, {
        props: { label: 'L', description: 'D' },
        slots: { default: () => h(comp, { ...props, ...attrs }, slots) },
      })
    const pairs: [string, ReturnType<typeof mount>, string][] = [
      ['UiInput', inField(UiInput, { modelValue: '' }), 'input'],
      ['UiTextarea', inField(UiTextarea, { modelValue: '' }), 'textarea'],
      ['UiSelect', inField(UiSelect, { modelValue: null, items: [] }), '[role="combobox"]'],
      ['UiCheckbox', inField(UiCheckbox, { modelValue: false }), 'input'],
      ['UiSwitch', inField(UiSwitch, { modelValue: false }), '[role="switch"]'],
      ['UiCodeInput', inField(UiCodeInput, { modelValue: '' }), 'input'],
      ['UiDropzone', inField(UiDropzone, { modelValue: [] }), 'button[type="button"]'],
    ]
    for (const [name, w, selector] of pairs) {
      const ids = w.find(selector).attributes('aria-describedby') ?? ''
      expect(ids, name).toContain('own-hint')
      expect(ids, name).toMatch(/-description/)
    }
  })

  it('a listener written for the control fires: @blur on a capsule never did', async () => {
    const onBlur = vi.fn()
    const onFocus = vi.fn()
    const w = mount(UiInput, {
      props: { modelValue: '', ariaLabel: 'A' },
      attrs: { onBlur, onFocus },
      attachTo: document.body,
    })
    await w.find('input').trigger('focus')
    await w.find('input').trigger('blur')
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('native attributes reach the control: required, pattern, autocapitalize', () => {
    const w = mount(UiInput, {
      props: { modelValue: '', ariaLabel: 'A' },
      attrs: { required: true, pattern: '[a-z]+', autocapitalize: 'none' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      required: '',
      pattern: '[a-z]+',
      autocapitalize: 'none',
    })
    expect(w.attributes('required')).toBeUndefined()
  })
})
