import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import UiField from './UiField.vue'
import UiInput from './UiInput.vue'
import UiSelect from './UiSelect.vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiCheckbox from './UiCheckbox.vue'
import UiPasswordField from './UiPasswordField.vue'
import UiScaleInput from './UiScaleInput.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiRadio from './UiRadio.vue'
import { NoField, useField } from '../utils/field'
import { focusInvalid } from '../utils/focusInvalid'
import UiDropzone from './UiDropzone.vue'
import UiListField from './UiListField.vue'
import UiModal from './UiModal.vue'
import UiSwitch from './UiSwitch.vue'

// A control that is not labelable: it takes the label through aria-labelledby.
const Probe = defineComponent({
  setup() {
    const field = useField()
    return () =>
      h('div', { class: 'probe', role: 'group', 'aria-labelledby': field?.labelId.value })
  },
})

// A control that shows what the field describes it with.
const Described = defineComponent({
  setup() {
    const field = useField()
    return () =>
      h('div', { class: 'described', role: 'group', 'aria-describedby': field?.describedBy.value })
  },
})

const field = (props: Record<string, unknown>, inputProps: Record<string, unknown> = {}) =>
  mount(UiField, {
    props,
    slots: { default: () => h(UiInput, { modelValue: '', ...inputProps }) },
  })

// Vue drops a click in the millisecond its listener was attached (`_vts`): wait one before it.
const clickable = () => new Promise((r) => setTimeout(r, 2))

describe('UiField', () => {
  it('labels the control through a generated id', () => {
    const w = field({ label: 'Name' })
    const id = w.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(w.find('label').attributes('for')).toBe(id)
    expect(w.find('label').text()).toBe('Name')
  })

  it('the description is read with the control', () => {
    const w = field({ label: 'Email', description: 'Work address' })
    expect(w.find('input').attributes('aria-describedby')).toBe(w.find('p').attributes('id'))
  })

  it('an error is announced, marks the control invalid and replaces the description; the label keeps its ink', () => {
    const w = field({ label: 'Email', description: 'Work address', error: 'Enter an address' })
    const alert = w.find('[role="alert"]')
    expect(alert.text()).toBe('Enter an address')
    expect(w.findAll('p')).toHaveLength(1)
    expect(w.find('label').classes()).not.toContain('text-danger-subtle-fg')
    const input = w.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(alert.attributes('id'))
    expect(w.find('.ui-capsule').attributes('data-invalid')).toBe('true')
  })

  it('required puts an asterisk on the label and aria-required on the control', () => {
    const w = field({ label: 'Name', required: true })
    expect(w.find('label').text()).toContain('*')
    expect(w.find('label span').attributes('aria-hidden')).toBe('true')
    expect(w.find('input').attributes('aria-required')).toBe('true')
  })

  it('an explicit `for` wins over the generated id', () => {
    const w = field({ label: 'Name', for: 'client-name' })
    expect(w.find('label').attributes('for')).toBe('client-name')
    expect(w.find('input').attributes('id')).toBe('client-name')
  })

  it('renders the meta slot on the label line, pushed to the end', () => {
    const w = mount(UiField, {
      props: { label: 'Note' },
      slots: { default: '<input />', meta: '<span class="count">12 / 80</span>' },
    })
    expect(w.find('.count').text()).toBe('12 / 80')
    const row = w.find('.count').element.closest('.justify-between')!
    expect(row.querySelector('label')).not.toBeNull()
    expect(row.querySelector('input')).toBeNull()
  })
})

describe('UiField — contract', () => {
  it('the field id wins over the control id, so the label always points at the control', () => {
    const w = field({ label: 'Name' }, { id: 'mine' })
    expect(w.find('input').attributes('id')).toBe(w.find('label').attributes('for'))
  })

  it('exposes labelId for a control that is not labelable', () => {
    const w = mount(UiField, {
      props: { label: 'Period' },
      slots: { default: () => h(Probe) },
    })
    const label = w.find('label')
    expect(label.attributes('id')).toBe(`${label.attributes('for')}-label`)
    expect(w.find('.probe').attributes('aria-labelledby')).toBe(label.attributes('id'))
  })

  it('a bare element gets the wiring as slot props', () => {
    const w = mount(UiField, {
      props: { label: 'Age', description: 'Years', required: true },
      slots: {
        default: ({ id, describedBy, invalid, required }) =>
          h('input', {
            id,
            'aria-describedby': describedBy,
            'aria-invalid': invalid || undefined,
            'aria-required': required || undefined,
          }),
      },
    })
    const input = w.find('input')
    expect(input.attributes('id')).toBe(w.find('label').attributes('for'))
    expect(input.attributes('aria-describedby')).toBe(w.find('p').attributes('id'))
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('meta is read with the control; it renders without a label too', () => {
    const w = mount(UiField, {
      props: { description: 'Max 80' },
      slots: {
        default: () => h(UiInput, { modelValue: '' }),
        meta: '<span class="count">12 / 80</span>',
      },
    })
    expect(w.find('label').exists()).toBe(false)
    const ids = w.find('input').attributes('aria-describedby')!.split(' ')
    expect(ids).toHaveLength(2)
    expect(ids[1]).toBe(w.find('.count').element.parentElement!.id)
  })

  it('when the error clears the description returns and the wiring follows', async () => {
    const w = field({ label: 'Email', description: 'Work address', error: 'Enter an address' })
    expect(w.find('[role="alert"]').exists()).toBe(true)
    await w.setProps({ error: '' })
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.find('p').text()).toBe('Work address')
    expect(w.find('input').attributes('aria-describedby')).toBe(w.find('p').attributes('id'))
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    expect(w.find('label').classes()).not.toContain('text-danger-subtle-fg')
  })

  it('ids differ between fields and survive a server render', async () => {
    const { renderToString } = await import('@vue/server-renderer')
    const { createSSRApp } = await import('vue')
    const html = await renderToString(
      createSSRApp({
        render: () => [
          h(UiField, { label: 'A' }, { default: () => h(UiInput, { modelValue: '' }) }),
          h(UiField, { label: 'B' }, { default: () => h(UiInput, { modelValue: '' }) }),
        ],
      }),
    )
    const fors = [...html.matchAll(/ for="([^"]+)"/g)].map((m) => m[1])
    const ids = [...html.matchAll(/<input[^>]* id="([^"]+)"/g)].map((m) => m[1])
    expect(fors).toHaveLength(2)
    expect(fors[0]).not.toBe(fors[1])
    expect(ids).toEqual(fors)
  })
})

describe('UiField — group', () => {
  it('renders a fieldset with a legend and hands the legend id to the control', () => {
    const w = mount(UiField, {
      props: { label: 'Plan', group: true, description: 'Billed monthly.' },
      slots: {
        default: ({ id, labelId, describedBy }) =>
          h('div', {
            id,
            role: 'radiogroup',
            'aria-labelledby': labelId,
            'aria-describedby': describedBy,
          }),
      },
    })
    expect(w.element.tagName).toBe('FIELDSET')
    expect(w.find('legend').text()).toBe('Plan')
    expect(w.find('legend').attributes('for')).toBeUndefined()
    expect(w.find('[role=radiogroup]').attributes('aria-labelledby')).toBe(
      w.find('legend').attributes('id'),
    )
    expect(w.find('[role=radiogroup]').attributes('id')).toBeUndefined()
    expect(w.find('[role=radiogroup]').attributes('aria-describedby')).toBe(
      w.find('p').attributes('id'),
    )
  })
})

describe('UiField — review follow-ups', () => {
  it('an error keeps the meta line in the wiring: both stay on screen', () => {
    const w = mount(UiField, {
      props: { label: 'Note', error: 'Too long' },
      slots: { default: () => h(UiInput, { modelValue: '' }), meta: () => '85 / 80' },
    })
    const ids = w.find('input').attributes('aria-describedby')?.split(' ')
    expect(ids).toEqual([
      w.find('[role=alert]').attributes('id'),
      w.find('[data-field-meta]').attributes('id'),
    ])
  })

  it('a group field wires its error to the group; the legend keeps its ink', () => {
    const w = mount(UiField, {
      props: { label: 'Plan', group: true, error: 'Pick a plan' },
      slots: {
        default: ({ describedBy }) =>
          h('div', { role: 'radiogroup', 'aria-describedby': describedBy }),
      },
    })
    expect(w.find('[role=radiogroup]').attributes('aria-describedby')).toBe(
      w.find('[role=alert]').attributes('id'),
    )
    expect(w.find('legend').classes()).not.toContain('text-danger-subtle-fg')
  })

  it('a bare element gets invalid through the slot props', () => {
    const w = mount(UiField, {
      props: { label: 'Code', error: 'Wrong code' },
      slots: {
        default: ({ id, invalid }) => h('input', { id, 'aria-invalid': invalid || undefined }),
      },
    })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('warns in dev when a field holds two controls', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiField, {
      props: { label: 'Name' },
      slots: {
        default: () => [h(UiInput, { modelValue: '' }), h(UiInput, { modelValue: '' })],
      },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('holds 2 controls'))
    warn.mockClear()
    mount(UiField, {
      props: { label: 'Name' },
      slots: { default: () => h(UiInput, { modelValue: '' }) },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('the label resolves to the control, so a click on it focuses the control', () => {
    // The test DOM does not move focus on a label click; `control` is what the browser follows.
    const w = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Name' },
      slots: { default: () => h(UiInput, { modelValue: '' }) },
    })
    expect((w.find('label').element as HTMLLabelElement).control).toBe(w.find('input').element)
    w.unmount()
  })

  it('a group field gives no control its id, so an input and a select in one group never share one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiField, {
      props: { label: 'Amount', group: true },
      slots: {
        default: () =>
          h(UiButtonGroup, null, () => [
            h(UiInput, { modelValue: '', ariaLabel: 'Amount' }),
            h(UiSelect, { modelValue: null, items: [], ariaLabel: 'Currency' }),
          ]),
      },
      attachTo: document.body,
    })
    const ids = w.findAll('[id]').map((el) => el.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(w.find('input').attributes('id')).not.toBe(w.find('button').attributes('id'))
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('one per field'))
    warn.mockRestore()
    w.unmount()
  })

  it('a meta line added after mount joins aria-describedby, and leaves it when removed', async () => {
    const shown = ref(false)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiField,
            { label: 'Note' },
            {
              default: () => h(UiInput, { modelValue: '' }),
              ...(shown.value ? { meta: () => '61 / 80' } : {}),
            },
          ),
      }),
    )
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
    shown.value = true
    await nextTick()
    await nextTick()
    const meta = w.find('[id$="-meta"]').attributes('id')
    expect(w.find('input').attributes('aria-describedby')).toBe(meta)
    shown.value = false
    await nextTick()
    await nextTick()
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('a password field inside a plain UiField logs no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiField, {
      props: { label: 'Password' },
      slots: { default: () => h(UiPasswordField, { modelValue: '' }) },
      attachTo: document.body,
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })

  it('warns in dev when a plain field labels no element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plain = mount(UiField, {
      props: { label: 'Rating' },
      slots: { default: () => h(UiScaleInput, { modelValue: null, max: 5 }) },
      attachTo: document.body,
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('labels no element'))
    plain.unmount()
    warn.mockClear()
    const group = mount(UiField, {
      props: { label: 'Rating', group: true },
      slots: { default: () => h(UiScaleInput, { modelValue: null, max: 5 }) },
      attachTo: document.body,
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    group.unmount()
  })

  it('a required group of checkboxes marks the legend, not every box', () => {
    const w = mount(UiField, {
      props: { label: 'Days', required: true, group: true },
      slots: {
        default: () => [
          h(UiCheckbox, { modelValue: false }, () => 'Mon'),
          h(UiCheckbox, { modelValue: false }, () => 'Tue'),
        ],
      },
    })
    for (const box of w.findAll('input')) expect(box.attributes('aria-required')).toBeUndefined()
    expect(w.find('legend .sr-only').text()).toBe('required')
  })

  it('a required checkbox with no field label shows the mark after its own text', () => {
    const w = mount(UiField, {
      props: { required: true },
      slots: { default: () => h(UiCheckbox, { modelValue: false }, () => 'I accept') },
    })
    expect(w.find('input').attributes('aria-required')).toBe('true')
    expect(w.find('label span[aria-hidden="true"]').text()).toBe('*')
  })

  it('an explicit for with a quote does not break the dev check', () => {
    expect(() =>
      mount(UiField, {
        props: { label: 'Odd', for: 'a"b' },
        slots: { default: () => h(UiInput, { modelValue: '' }) },
        attachTo: document.body,
      }).unmount(),
    ).not.toThrow()
  })

  it('an empty for falls back to the generated id', () => {
    const w = field({ label: 'Name', for: '' })
    expect(w.find('input').attributes('id')).toBeTruthy()
    expect(w.find('label').attributes('for')).toBe(w.find('input').attributes('id'))
  })

  it('a group field never points at a meta line it does not render', () => {
    const w = mount(UiField, {
      props: { label: 'Plan', group: true },
      slots: { default: () => h(Described), meta: () => 'x' },
    })
    expect(w.find('.described').attributes('aria-describedby')).toBeUndefined()
    expect(w.find('[id$="-meta"]').exists()).toBe(false)
  })

  it('a required group of radios hears "required" once, from the legend', () => {
    const w = mount(UiField, {
      props: { label: 'Plan', required: true, group: true },
      slots: {
        default: () =>
          h(UiRadioGroup, { modelValue: null }, () => [
            h(UiRadio, { value: 'a' }, () => 'Solo'),
            h(UiRadio, { value: 'b' }, () => 'Team'),
          ]),
      },
    })
    expect(w.find('[role="radiogroup"]').attributes('aria-required')).toBeUndefined()
    expect(w.find('legend .sr-only').text()).toBe('required')
  })

  it('the label and the legend mute when the control in the field is disabled', () => {
    const plain = field({ label: 'Email' })
    expect(plain.classes()).toContain('ui-field')
    expect(plain.find('label').classes()).toContain('ui-field-label')
    const group = mount(UiField, {
      props: { label: 'Plan', group: true },
      slots: { default: () => h(Probe) },
    })
    expect(group.find('legend').classes()).toContain('ui-field-label')
    // The rule itself: a disabled control mutes, a button in #meta does not count as enabled.
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toContain('.ui-field:has(:disabled):not(:has(:enabled:not([data-field-meta] *)))')
    expect(field({ label: 'Email' }, {}).find('[data-field-meta]').exists()).toBe(false)
  })

  it('a click on the label of a select opens its list, as a click on the select does', async () => {
    const w = mount(UiField, {
      props: { label: 'Currency' },
      slots: {
        default: () => h(UiSelect, { modelValue: null, items: [{ value: 'EUR', label: 'EUR' }] }),
      },
      attachTo: document.body,
    })
    const trigger = w.find('[role="combobox"]')
    await clickable()
    ;(w.find('label').element as HTMLLabelElement).click()
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    w.unmount()
  })

  it('a group field in error: focusInvalid lands on a radio inside the group', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiField, { label: 'Plan', group: true, error: 'Pick a plan' }, () =>
              h(UiRadioGroup, { modelValue: 'team' }, () => [
                h(UiRadio, { value: 'solo' }, () => 'Solo'),
                h(UiRadio, { value: 'team' }, () => 'Team'),
              ]),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    const at = document.activeElement as HTMLInputElement
    expect(w.find('[role=radiogroup]').element.contains(at)).toBe(true)
    expect(at.value).toBe('team')
    w.unmount()
  })

  it('a bare element in a group field takes labelId for aria-labelledby and gets no id', () => {
    const w = mount(UiField, {
      props: { label: 'Effort', group: true },
      slots: {
        default: ({ id, labelId }) => h('div', { id, role: 'group', 'aria-labelledby': labelId }),
      },
    })
    const group = w.find('[role=group]')
    expect(group.attributes('id')).toBeUndefined()
    expect(group.attributes('aria-labelledby')).toBe(w.find('legend').attributes('id'))
  })

  it('a required group of input and select marks the legend once, not each control', () => {
    const w = mount(UiField, {
      props: { label: 'Amount', group: true, required: true },
      slots: {
        default: () => [
          h(UiInput, { modelValue: '', ariaLabel: 'Sum' }),
          h(UiSelect, {
            modelValue: null,
            ariaLabel: 'Currency',
            items: [{ value: 'EUR', label: 'EUR' }],
          }),
        ],
      },
    })
    expect(w.find('legend .sr-only').text()).toBe('required')
    expect(w.findAll('[aria-required]')).toHaveLength(0)
  })

  it('warns in dev when a group field has no label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiField, {
      props: { group: true },
      slots: { default: () => h('div', { role: 'group' }) },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiField group has no label'))
    warn.mockRestore()
  })

  it('NoField gives the controls inside their own ids and states', () => {
    const w = mount(UiField, {
      props: { label: 'Outer', error: 'Wrong', required: true },
      slots: {
        default: () => [
          h(UiInput, { modelValue: '' }),
          h(NoField, () => h(UiInput, { modelValue: '', id: 'own', ariaLabel: 'Own' })),
        ],
      },
    })
    const own = w.find('#own')
    expect(own.exists()).toBe(true)
    expect(own.attributes('aria-invalid')).toBeUndefined()
    expect(own.attributes('aria-required')).toBeUndefined()
  })

  it('a required field around a dropzone says required in words', () => {
    const w = mount(UiField, {
      props: { label: 'Passport scan', required: true },
      slots: { default: () => h(UiDropzone, { modelValue: [] }) },
    })
    const ids = w.find('.border-dashed button').attributes('aria-describedby')!.split(' ')
    expect(ids.map((id) => w.find(`#${id}`).text())).toContain('required')
  })

  it('a click on the label of a dropzone opens the file dialog, as Browse does', async () => {
    const w = mount(UiField, {
      props: { label: 'Passport scan' },
      slots: { default: () => h(UiDropzone, { modelValue: [] }) },
      attachTo: document.body,
    })
    const opened = vi.fn()
    w.find('input[type=file]').element.addEventListener('click', opened)
    await clickable()
    ;(w.find('label').element as HTMLLabelElement).click()
    expect(opened).toHaveBeenCalledOnce()
    w.unmount()
  })
})

describe('UiField — the label and the words it gives', () => {
  it('a second click on the label of an open select closes its list, as the select does', async () => {
    const w = mount(UiField, {
      props: { label: 'Currency' },
      slots: {
        default: () => h(UiSelect, { modelValue: null, items: [{ value: 'EUR', label: 'EUR' }] }),
      },
      attachTo: document.body,
    })
    const label = w.find('label').element as HTMLLabelElement
    const trigger = w.find('[role="combobox"]')
    // A press is a pointerdown, then the click the label hands on to the select.
    const press = async () => {
      label.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
      label.click()
      await nextTick()
    }
    await clickable()
    await press()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    await clickable()
    await press()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('inside a required group field the slot says required false: the legend says it once', () => {
    let seen: boolean | undefined
    mount(UiField, {
      props: { label: 'Days', group: true, required: true },
      slots: {
        default: (p: { required?: boolean }) => {
          seen = p.required
          return h('div', { role: 'group' })
        },
      },
    })
    expect(seen).toBe(false)
  })

  it('a required plain field around a list field marks its input aria-required', () => {
    const w = mount(UiField, {
      props: { label: 'Tags', required: true },
      slots: { default: () => h(UiListField, { modelValue: [] }) },
    })
    expect(w.find('input').attributes('aria-required')).toBe('true')
  })
})

describe('UiField — what is not its control', () => {
  // A control the field does not name keeps its own id and state: the label points at one control,
  // and the error is that control's, not of everything drawn inside the field.
  const own = (el: Element | null) => ({
    id: el?.id ?? '',
    invalid: el?.getAttribute('aria-invalid') ?? null,
    describedBy: el?.getAttribute('aria-describedby') ?? null,
  })
  const field = (inner: () => unknown) =>
    mount(UiField, {
      attachTo: document.body,
      props: { label: 'Delivery', error: 'Pick a day' },
      slots: { default: inner as never },
    })

  it('a window declared inside a field: its controls are not the field’s', async () => {
    const w = field(() => [
      h(UiInput, { modelValue: '', class: 'outer' }),
      h(UiModal, { open: true, title: 'Address' }, () =>
        h(UiInput, { modelValue: '', ariaLabel: 'Street', class: 'inner' }),
      ),
    ])
    await nextTick()
    await nextTick()
    const outer = document.querySelector('.outer input, input.outer')
    const inner = document.querySelector('[role="dialog"] input')
    expect(own(outer).invalid).toBe('true')
    expect(own(inner).id).not.toBe(own(outer).id)
    expect(own(inner).invalid).toBeNull()
    expect(own(inner).describedBy).toBeNull()
    w.unmount()
    document.body.innerHTML = ''
  })

  it("UiSelect's #picks: a control the app draws beside a pick is not the field's", async () => {
    const w = field(() =>
      h(
        UiSelect,
        {
          multiple: true,
          items: [{ value: 'a', label: 'Alpha' }],
          modelValue: ['a'],
        },
        { picks: () => h(UiSwitch, { modelValue: true, ariaLabel: 'Primary' }) },
      ),
    )
    await nextTick()
    const select = document.querySelector('[role="combobox"]')
    const toggle = document.querySelector('[data-picks] [role="switch"]')
    expect(own(select).invalid).toBe('true')
    expect(own(toggle).id).not.toBe(own(select).id)
    expect(own(toggle).invalid).toBeNull()
    w.unmount()
    document.body.innerHTML = ''
  })

  it("UiListField's rows: a control in a row is not the field's", async () => {
    const w = field(() =>
      h(UiListField, { modelValue: [], existing: ['Ann'] }, () =>
        h(UiSwitch, { modelValue: true, ariaLabel: 'Ann can edit' }),
      ),
    )
    await nextTick()
    const input = document.querySelector('input:not([type="hidden"])')
    const toggle = document.querySelector('[role="switch"]')
    expect(own(input).invalid).toBe('true')
    expect(own(toggle).id).not.toBe(own(input).id)
    expect(own(toggle).invalid).toBeNull()
    w.unmount()
    document.body.innerHTML = ''
  })
})

describe('UiField — review follow-ups', () => {
  // The demos are the library's own example of a field: none of them breaks the rule the field
  // warns about (one control per field, a label for something, a group with a legend).
  const demos = import.meta.glob('../demos/*.demo.vue', { eager: true }) as Record<
    string,
    { default: Component }
  >
  const DemoBlock = defineComponent({
    props: { title: { type: String, required: true }, row: Boolean, wide: Boolean, locale: String },
    setup:
      (props, { slots }) =>
      () =>
        h('section', [h('h2', props.title), slots.default?.()]),
  })

  // The limit is for a hang, as in axe.spec.ts: a large demo mounts in well under a second at rest.
  it.each(Object.entries(demos).map(([path, mod]) => [path.split('/').pop()!, mod] as const))(
    '%s draws no UiField the field itself warns about',
    async (_, mod) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      onTestFinished(() => warn.mockRestore())
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { render: () => null } }],
      })
      await router.push('/')
      const w = mount(defineComponent({ render: () => h('div', [h(mod.default)]) }), {
        attachTo: document.body,
        global: { components: { DemoBlock }, plugins: [router] },
      })
      onTestFinished(() => {
        w.unmount()
        document.body.innerHTML = ''
      })
      await nextTick()
      const said = warn.mock.calls
        .map(([text]) => String(text))
        .filter((t) => t.startsWith('[grani] UiField'))
      expect(said).toEqual([])
    },
    20_000,
  )
})
