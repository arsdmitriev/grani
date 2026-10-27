import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import UiCheckbox from './UiCheckbox.vue'
import UiField from './UiField.vue'
import { focusInvalid } from '../utils/focusInvalid'

const base = { modelValue: false, ariaLabel: 'Agree' }

describe('UiCheckbox — value', () => {
  it('reflects the model and emits on change', async () => {
    const w = mount(UiCheckbox, { props: { ...base, modelValue: true } })
    const input = w.find('input')
    expect((input.element as HTMLInputElement).checked).toBe(true)
    await input.setValue(false)
    expect(w.emitted('update:modelValue')).toEqual([[false]])
  })

  it('the text is inside the label, so a click on it toggles', async () => {
    const w = mount(UiCheckbox, {
      props: base,
      slots: { default: 'I agree' },
      attachTo: document.body,
    })
    expect(w.element.tagName).toBe('LABEL')
    expect(w.text()).toBe('I agree')
    await w.find('label > span:last-child').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    w.unmount()
  })

  it('the slot text is the one accessible name', () => {
    const w = mount(UiCheckbox, { props: { modelValue: false }, slots: { default: 'I agree' } })
    const text = w.find('label > span:last-child')
    expect(w.find('input').attributes('aria-labelledby')).toBe(text.attributes('id'))
  })

  it('exposes focus()', () => {
    const w = mount(UiCheckbox, { props: base, attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('attributes go to the input; class and style stay on the label', () => {
    const w = mount(UiCheckbox, {
      props: { ...base, name: 'terms', value: 'yes', id: 'terms' },
      attrs: { class: 'mt-2', 'data-testid': 'terms' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      name: 'terms',
      value: 'yes',
      id: 'terms',
      'aria-label': 'Agree',
    })
    expect(w.classes()).toContain('mt-2')
    expect(w.attributes('data-testid')).toBeUndefined()
    expect(w.find('input').attributes('data-testid')).toBe('terms')
  })
})

describe('UiCheckbox — states', () => {
  it('draws the brand fill when checked and the control chrome when not', async () => {
    const w = mount(UiCheckbox, { props: base })
    expect(w.find('input').classes()).toContain('border-control-border')
    expect(w.find('svg').exists()).toBe(false)
    await w.setProps({ modelValue: true })
    expect(w.find('input').classes()).toContain('bg-brand-solid')
    expect(w.find('svg').exists()).toBe(true)
  })

  it('indeterminate sets the DOM property and draws the fill', () => {
    const w = mount(UiCheckbox, { props: { ...base, indeterminate: true } })
    const input = w.find('input').element as HTMLInputElement
    expect(input.indeterminate).toBe(true)
    expect(w.find('input').classes()).toContain('bg-brand-solid')
  })

  it('disabled is a state, not a fade', () => {
    const w = mount(UiCheckbox, { props: { ...base, modelValue: true, disabled: true } })
    expect((w.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(w.find('input').classes()).toContain('bg-border-strong/40')
    expect(w.find('input').classes()).not.toContain('bg-brand-solid')
    expect(w.classes().join(' ')).not.toMatch(/opacity/)
    expect(w.classes()).toContain('cursor-not-allowed')
  })

  it('invalid turns the border red and marks the input', () => {
    const w = mount(UiCheckbox, { props: { ...base, invalid: true } })
    expect(w.find('input').classes()).toContain('border-danger-border')
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })
})

describe('UiCheckbox — inside UiField', () => {
  const Form = defineComponent({
    setup() {
      return () =>
        h(UiField, { label: 'Terms', required: true, error: 'Required to continue' }, () =>
          h(UiCheckbox, { modelValue: false }, () => 'I accept the terms'),
        )
    },
  })

  it('takes id, required, error and description from the field; the slot text stays the name', () => {
    const w = mount(Form)
    const input = w.find('input')
    expect(w.find('label[for]').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-labelledby')).not.toBe(w.find('label[for]').attributes('id'))
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(w.find('[role=alert]').attributes('id'))
  })

  it('without slot text the field label is the name', () => {
    const w = mount(UiField, {
      props: { label: 'Row' },
      slots: { default: () => h(UiCheckbox, { modelValue: false }) },
    })
    expect(w.find('input').attributes('aria-labelledby')).toBe(
      w.find('label[for]').attributes('id'),
    )
  })
})

describe('UiCheckbox — review follow-ups', () => {
  it('a vetoed change puts the DOM back on the model', async () => {
    const w = mount(UiCheckbox, {
      props: { modelValue: false, ariaLabel: 'Agree' },
      attachTo: document.body,
    })
    const input = w.find('input').element as HTMLInputElement
    input.checked = true
    await w.find('input').trigger('change')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    expect(input.checked).toBe(false)
    w.unmount()
  })
  it('several boxes in one UiField group keep their own ids', () => {
    const w = mount(UiField, {
      props: { label: 'Notify me by', group: true },
      slots: {
        default: () => [
          h(UiCheckbox, { modelValue: true }, () => 'Email'),
          h(UiCheckbox, { modelValue: false }, () => 'SMS'),
        ],
      },
    })
    // None takes the field's id: a fieldset has no single control to point at.
    expect(w.findAll('input[id]')).toHaveLength(0)
    expect(w.find('legend').exists()).toBe(true)
  })

  it('the box itself shows the pointer; hover darkens only an empty box', () => {
    const empty = mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'x' } })
    expect(empty.find('input').classes()).toEqual(
      expect.arrayContaining([
        'enabled:cursor-pointer',
        'enabled:hover:border-control-border-hover',
      ]),
    )
    const checked = mount(UiCheckbox, { props: { modelValue: true, ariaLabel: 'x' } })
    expect(checked.find('input').classes().join(' ')).not.toContain('hover:border-control')
  })

  it('warns in dev when it would render with no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCheckbox, { props: { modelValue: false } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockClear()
    mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'Select row' } })
    mount(UiCheckbox, { props: { modelValue: false }, slots: { default: 'Mon' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('keeps the mark against the first line when the label wraps', () => {
    const w = mount(UiCheckbox, {
      props: { modelValue: false },
      slots: { default: 'A long label' },
    })
    expect(w.find('label').classes()).toContain('items-start')
    expect(w.find('label').classes()).not.toContain('items-center')
    expect(w.find('input').element.parentElement!.classList.contains('mt-px')).toBe(true)
  })

  it('the box stops its corner at a third of its side, so a large badge radius never turns it into a radio', () => {
    const w = mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'Receipt' } })
    expect(w.html()).toContain('rounded-[min(var(--radius-badge),33%)]')
    expect(w.html()).not.toMatch(/\brounded-badge\b/)
  })

  it('caller aria-labelledby, aria-invalid and aria-required survive when the component has none of its own', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiCheckbox, {
      props: { modelValue: false },
      attrs: { 'aria-labelledby': 'row-7-title', 'aria-invalid': 'true', 'aria-required': 'true' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      'aria-labelledby': 'row-7-title',
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('slot text and ariaLabel together emit one name', () => {
    const w = mount(UiCheckbox, {
      props: { modelValue: false, ariaLabel: 'Agree' },
      slots: { default: 'I agree' },
    })
    expect(w.find('input').attributes('aria-label')).toBeUndefined()
    expect(w.find('input').attributes('aria-labelledby')).toBeDefined()
  })

  it('a press on a mixed box that the parent does not resolve leaves the DOM mixed', async () => {
    const w = mount(UiCheckbox, {
      props: { modelValue: false, indeterminate: true, ariaLabel: 'All' },
      attachTo: document.body,
    })
    const input = w.find('input').element as HTMLInputElement
    input.click()
    expect(input.indeterminate).toBe(false)
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    expect(input.indeterminate).toBe(true)
    expect(input.checked).toBe(false)
    w.unmount()
  })

  it('a form reset leaves the box on its model, glyph and DOM agreeing', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    // Server markup carries `checked`: a reset would bring back the server's state, not the model's.
    const w = mount(UiCheckbox, {
      props: { modelValue: false, ariaLabel: 'Agree' },
      attachTo: form,
    })
    const input = w.find('input').element as HTMLInputElement
    input.defaultChecked = true
    input.checked = false
    form.reset()
    expect(input.checked).toBe(true)
    await new Promise((r) => setTimeout(r))
    expect(input.checked).toBe(false)
    expect(w.find('svg').exists()).toBe(false)
    w.unmount()
    form.remove()
  })

  it('in a form a checked box sends its value and an empty one sends nothing', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiCheckbox, {
      props: { modelValue: true, name: 'terms', value: 'yes', ariaLabel: 'Terms' },
      attachTo: form,
    })
    expect(new FormData(form).get('terms')).toBe('yes')
    await w.setProps({ modelValue: false })
    expect(new FormData(form).has('terms')).toBe(false)
    w.unmount()
    form.remove()
  })

  it('the empty box border is the control border, not the decorative one', () => {
    const w = mount(UiCheckbox, { props: { modelValue: false, ariaLabel: 'x' } })
    expect(w.find('input').classes()).toContain('border-control-border')
    expect(w.find('input').classes()).not.toContain('border-border')
  })

  it('a box marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiCheckbox, { modelValue: true, ariaLabel: 'Newsletter' }),
            h(UiField, { error: 'Accept the terms to continue' }, () =>
              h(UiCheckbox, { modelValue: false }, () => 'I accept the terms'),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.findAll('input')[1]!.element)
    w.unmount()
  })

  it('an invalid empty box keeps its red border on hover', () => {
    const w = mount(UiCheckbox, { props: { modelValue: false, invalid: true, ariaLabel: 'x' } })
    expect(w.find('input').classes()).not.toContain('enabled:hover:border-control-border-hover')
  })
})

// A box with no words beside it is the whole target: it reaches out to the 24px square WCAG 2.5.8
// asks for, at every step of the ladder. With words, the row is the target and it does not.
describe('UiCheckbox — the target of a box with no words', () => {
  it('a box with no text reaches out to 24px at every size; one with text does not', () => {
    const box = (w: ReturnType<typeof mount>) => w.find('input').element.parentElement!.className
    for (const [size, inset] of [
      ['xs', 'after:-inset-1'],
      ['sm', 'after:-inset-[3px]'],
      ['md', 'after:-inset-0.5'],
    ] as const) {
      const bare = mount(UiCheckbox, { props: { ...base, size } })
      expect(box(bare)).toContain(inset)
      const worded = mount(UiCheckbox, { props: { ...base, size }, slots: { default: 'Agree' } })
      expect(box(worded)).not.toContain('after:-inset')
    }
  })
})
