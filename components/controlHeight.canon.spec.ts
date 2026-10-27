import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import type { ControlSize } from '../types/ui'
import { CONTROL_HEIGHT, controlHeightClass, DEFAULT_CONTROL_SIZE } from '../utils/controlSize'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiCopyButton from './UiCopyButton.vue'
import UiCodeInput from './UiCodeInput.vue'
import UiInput from './UiInput.vue'
import UiStepper from './UiStepper.vue'
import UiPasswordField from './UiPasswordField.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiScaleInput from './UiScaleInput.vue'
import UiSelect from './UiSelect.vue'
import UiTimePicker from './UiTimePicker.vue'
import UiDatePicker from './UiDatePicker.vue'
import UiDateRange from './UiDateRange.vue'
import UiFilter from './UiFilter.vue'
import UiPagination from './UiPagination.vue'
import UiTableColumns from './UiTableColumns.vue'
import UiTabs from './UiTabs.vue'
import { useTableColumns } from '../composables/useTableColumns'

// Every interactive control joins this list. The check reads the ladder, not
// literal classes, so the Tailwind spelling can change in one place. UiSwitch's `sm`/`md`
// are track sizes at the first line of its label; UiCheckbox is one 18px mark. Neither is a box.
// UiTextarea grows with `rows`; only its single row stands on the ladder, as the `sm` floor.
// `el` names the control when the component's root is a fragment (a button with its tooltip)
// or a wrapper around it (a scale's readout and end words around the bar). `sizes` narrows
// the steps for a control that stands on part of the ladder.
const CONTROLS: Record<
  string,
  { component: Component; props?: Record<string, unknown>; el?: string; sizes?: ControlSize[] }
> = {
  UiButton: { component: UiButton },
  UiFilter: { component: UiFilter, props: { label: 'Status' }, el: 'button' },
  UiTableColumns: {
    component: UiTableColumns,
    props: { columns: useTableColumns('canon', [{ key: 'a', label: 'A' }]) },
    el: 'button',
  },
  UiPagination: {
    component: UiPagination,
    props: { page: 1, pageSize: 10, total: 50 },
    el: 'button',
  },
  UiIconButton: { component: UiIconButton, props: { ariaLabel: 'Edit' }, el: 'button' },
  UiCopyButton: { component: UiCopyButton, props: { value: 'x' }, el: 'button' },
  UiInput: { component: UiInput, props: { modelValue: '', ariaLabel: 'Name' } },
  UiStepper: { component: UiStepper, props: { modelValue: '1', ariaLabel: 'Count' } },
  UiSelect: { component: UiSelect, props: { modelValue: null, items: [], ariaLabel: 'Currency' } },
  UiTimePicker: { component: UiTimePicker, props: { ariaLabel: 'Time' }, el: '.ui-capsule' },
  UiDatePicker: { component: UiDatePicker, props: { ariaLabel: 'Date' }, el: '.ui-capsule' },
  UiDateRange: { component: UiDateRange, el: 'button[aria-haspopup]' },
  UiPasswordField: {
    component: UiPasswordField,
    props: { modelValue: 'x', ariaLabel: 'Password' },
    el: '.ui-capsule',
  },
  UiScaleInput: {
    component: UiScaleInput,
    props: { modelValue: null, ariaLabel: 'Effort' },
    el: '[role=radiogroup]',
    sizes: ['xs', 'sm'],
  },
  UiTabs: {
    component: UiTabs,
    props: { modelValue: 'a', ariaLabel: 'Account', tabs: [{ value: 'a', label: 'A' }] },
    el: '[role=tab]',
    sizes: ['sm', 'md'],
  },
  'UiRadioGroup segmented': {
    component: UiRadioGroup,
    props: { modelValue: null, variant: 'segmented', 'aria-label': 'Period' },
    sizes: ['sm', 'md'],
  },
}

describe('control height canon', () => {
  for (const [name, { component, props, el, sizes }] of Object.entries(CONTROLS)) {
    const classes = (p?: Record<string, unknown>) => {
      const w = mount(component, { props: p })
      return (el ? w.find(el) : w).classes()
    }
    it(`${name} stands on the ladder at every step and defaults to ${DEFAULT_CONTROL_SIZE}`, () => {
      for (const size of sizes ?? (Object.keys(CONTROL_HEIGHT) as ControlSize[])) {
        const cls = classes({ ...props, size })
        expect(cls, `${name} size=${size}`).toContain(controlHeightClass[size])
      }
      expect(classes(props)).toContain(controlHeightClass[DEFAULT_CONTROL_SIZE])
    })
  }
})

// The code input's ladder lands on its cells, not on the root: every cell is one step.
describe('control height canon — cells', () => {
  it('UiPasswordField: the capsule, copy and generate stand on one step at xs, sm and md', () => {
    for (const size of Object.keys(CONTROL_HEIGHT) as ControlSize[]) {
      const w = mount(UiPasswordField, { props: { modelValue: 'x', ariaLabel: 'Password', size } })
      // The eye inside the capsule is its own small button; the row is the capsule and the two beside it.
      const beside = w.findAll('button').filter((b) => !b.element.closest('.ui-capsule'))
      expect(beside).toHaveLength(2)
      const row = [w.find('.ui-capsule'), ...beside]
      for (const el of row) expect(el.classes(), `${size}`).toContain(controlHeightClass[size])
    }
  })

  it('UiDateRange: the period button and its arrows stand on one step at xs, sm and md', () => {
    for (const size of Object.keys(CONTROL_HEIGHT) as ControlSize[]) {
      const w = mount(UiDateRange, { props: { stepper: true, size } })
      const row = w.findAll('button')
      expect(row).toHaveLength(3)
      for (const el of row) expect(el.classes(), `${size}`).toContain(controlHeightClass[size])
    }
  })

  it('UiCodeInput cells stand on the ladder and default to md', () => {
    for (const size of Object.keys(CONTROL_HEIGHT) as (keyof typeof CONTROL_HEIGHT)[]) {
      const cell = mount(UiCodeInput, { props: { modelValue: '', size } }).find('.ui-code-cell')
      expect(cell.classes(), `size=${size}`).toContain(controlHeightClass[size])
    }
    expect(
      mount(UiCodeInput, { props: { modelValue: '' } })
        .find('.ui-code-cell')
        .classes(),
    ).toContain(controlHeightClass.md)
  })
})
