import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { withGrani } from '../test/harness'
import { focusInvalid } from '../utils/focusInvalid'
import UiField from './UiField.vue'
import UiTextarea from './UiTextarea.vue'
import { controlMinHeightClass } from '../utils/controlSize'

const base = { modelValue: '', ariaLabel: 'Note' }

describe('UiTextarea', () => {
  it('shows the value, emits on input, three rows by default', async () => {
    const w = mount(UiTextarea, { props: { ...base, modelValue: 'Call' } })
    const area = w.find('textarea')
    expect((area.element as HTMLTextAreaElement).value).toBe('Call')
    expect(area.attributes('rows')).toBe('3')
    await area.setValue('Call before noon')
    expect(w.emitted('update:modelValue')).toEqual([['Call before noon']])
  })

  it('wears the same capsule as UiInput; class stays on it, the rest reaches the textarea', () => {
    const w = mount(UiTextarea, {
      props: { ...base, rows: 5, maxlength: 200 },
      attrs: { class: 'w-80', 'data-testid': 'note' },
    })
    expect(w.classes()).toEqual(
      expect.arrayContaining(['ui-capsule', 'border-control-border', 'bg-control-bg', 'w-80']),
    )
    expect(w.attributes('data-testid')).toBeUndefined()
    expect(w.find('textarea').attributes()).toMatchObject({
      'data-testid': 'note',
      rows: '5',
      maxlength: '200',
      'aria-label': 'Note',
    })
    expect(w.find('textarea').classes()).toContain('resize-y')
  })

  it('clips to its corners; resize none fixes the height, auto grows with the text', () => {
    expect(mount(UiTextarea, { props: base }).classes()).toContain('overflow-hidden')
    expect(
      mount(UiTextarea, { props: { ...base, resize: 'none' } })
        .find('textarea')
        .classes(),
    ).toContain('resize-none')
    const auto = mount(UiTextarea, { props: { ...base, resize: 'auto' } })
      .find('textarea')
      .classes()
    expect(auto).toEqual(
      expect.arrayContaining([
        'resize-none',
        '[field-sizing:content]',
        'max-h-96',
        'overflow-y-auto',
      ]),
    )
    expect(mount(UiTextarea, { props: { ...base, rows: 1 } }).classes()).toContain(
      controlMinHeightClass.sm,
    )
  })

  it('a null slipped past the types renders empty, never the word null', () => {
    const w = mount(UiTextarea, { props: { ...base, modelValue: null as unknown as string } })
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('emits nothing mid-composition and the final value at its end', async () => {
    const w = mount(UiTextarea, { props: base })
    const area = w.find('textarea')
    await area.trigger('compositionstart')
    ;(area.element as HTMLTextAreaElement).value = 'に'
    await area.trigger('input')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    ;(area.element as HTMLTextAreaElement).value = '日本'
    await area.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['日本']])
  })

  it('invalid, disabled and readonly follow the input contract', () => {
    const bad = mount(UiTextarea, { props: { ...base, invalid: true } })
    expect(bad.classes()).toContain('border-danger-border')
    expect(bad.attributes('data-invalid')).toBe('true')
    expect(bad.find('textarea').attributes('aria-invalid')).toBe('true')
    const off = mount(UiTextarea, { props: { ...base, disabled: true } })
    expect(off.classes()).toContain('bg-disabled-bg')
    expect(off.find('textarea').attributes('disabled')).toBeDefined()
    expect(off.find('textarea').classes()).toContain('disabled:text-disabled-fg')
    expect(
      mount(UiTextarea, { props: { ...base, readonly: true } })
        .find('textarea')
        .attributes('readonly'),
    ).toBeDefined()
  })

  it('inside UiField it takes the id, the error and required from the field', () => {
    const w = mount(UiField, {
      props: { label: 'Note', error: 'Too short', required: true },
      slots: { default: () => h(UiTextarea, { modelValue: '' }) },
    })
    const area = w.find('textarea')
    expect(area.attributes('id')).toBe(w.find('label').attributes('for'))
    expect(area.attributes('aria-invalid')).toBe('true')
    expect(area.attributes('aria-required')).toBe('true')
    expect(area.attributes('aria-describedby')).toBe(w.find('[role="alert"]').attributes('id'))
  })

  it('exposes focus()', () => {
    const w = mount(UiTextarea, { props: base, attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('textarea').element)
    w.unmount()
  })
})

describe('UiTextarea — composition', () => {
  it('a re-render of the host mid-composition does not reset the characters being typed', async () => {
    const w = mount(UiTextarea, { props: { ...base, modelValue: 'a' } })
    const area = w.find('textarea')
    await area.trigger('compositionstart')
    ;(area.element as HTMLTextAreaElement).value = 'aに'
    await area.trigger('input')
    await w.setProps({ placeholder: 'changed' })
    expect((area.element as HTMLTextAreaElement).value).toBe('aに')
    ;(area.element as HTMLTextAreaElement).value = 'a日本'
    await area.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['a日本']])
  })
})

describe('UiTextarea — passthrough', () => {
  it('name and placeholder reach the textarea', () => {
    const w = mount(UiTextarea, {
      props: { ...base, name: 'note', placeholder: 'Anything to add' },
    })
    expect(w.find('textarea').attributes()).toMatchObject({
      name: 'note',
      placeholder: 'Anything to add',
    })
  })
})

describe('UiTextarea — review follow-ups', () => {
  it('auto resize keeps the rows it was given as its floor', () => {
    const area = mount(UiTextarea, {
      props: { modelValue: '', ariaLabel: 'Note', resize: 'auto', rows: 3 },
    }).find('textarea')
    expect(area.attributes('rows')).toBe('3')
    expect(area.attributes('style')).toContain('min-height: calc(3lh + 12px)')
    const fixed = mount(UiTextarea, { props: { ...base, rows: 3 } }).find('textarea')
    expect(fixed.attributes('style')).toBeUndefined()
  })

  it('a size of its own and the app step set the floor of a single row', () => {
    for (const [size, min, pad] of [
      ['xs', 'min-h-7', 'py-0.5'],
      ['sm', 'min-h-9', 'py-1.5'],
      ['md', 'min-h-11', 'py-2.5'],
    ] as const) {
      const w = mount(UiTextarea, { props: { ...base, rows: 1, size } })
      expect(w.classes()).toContain(min)
      expect(w.find('textarea').classes()).toContain(pad)
    }
    const w = mount(UiTextarea, {
      props: { ...base, rows: 1 },
      global: { plugins: withGrani({ size: 'md' }) },
    })
    expect(w.classes()).toContain('min-h-11')
  })

  it('a one-row capsule measures the ladder step, border included', () => {
    // A 22px line + padding on both sides + 1px border on both sides = the step.
    for (const [size, pad, cls0, step] of [
      ['xs', 2, 'py-0.5', 28],
      ['sm', 6, 'py-1.5', 36],
      ['md', 10, 'py-2.5', 44],
    ] as const) {
      const cls = mount(UiTextarea, { props: { ...base, rows: 1, size } })
        .find('textarea')
        .classes()
      expect(cls).toContain(cls0)
      expect(cls.filter((c) => /^p[ty]?-/.test(c))).toEqual([cls0])
      expect(22 + pad * 2 + 2).toBe(step)
    }
  })

  it('warns in dev when it has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiTextarea, { props: { modelValue: '' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiTextarea has no name'))
    warn.mockClear()
    mount(UiTextarea, { props: base })
    mount(UiField, {
      props: { label: 'Note' },
      slots: { default: () => h(UiTextarea, { modelValue: '' }) },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('inside UiField with a description it is named once and described once', () => {
    const w = mount(UiField, {
      props: { label: 'Note', description: 'Seen by the courier' },
      slots: { default: () => h(UiTextarea, { modelValue: '' }) },
    })
    const area = w.find('textarea')
    expect(area.attributes('aria-label')).toBeUndefined()
    const label = w.find('label')
    expect(label.attributes('for')).toBe(area.attributes('id'))
    expect(area.attributes('aria-describedby')).toBe(w.find('p').attributes('id'))
  })

  it('in a form it sends its value under its name, nothing when disabled', async () => {
    const w = mount(
      defineComponent({
        props: { off: Boolean },
        setup: (p) => () =>
          h('form', [
            h(UiTextarea, { ...base, modelValue: 'Ring twice', name: 'note', disabled: p.off }),
          ]),
      }),
    )
    const form = w.element as HTMLFormElement
    expect(new FormData(form).get('note')).toBe('Ring twice')
    await w.setProps({ off: true })
    // The test DOM still lists a disabled control in FormData; the browser does not.
    expect(w.find('textarea').attributes('disabled')).toBeDefined()
  })

  it('a textarea marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h('input'),
            h(UiField, { label: 'Note', error: 'Say where to leave it' }, () =>
              h(UiTextarea, { modelValue: '' }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement?.tagName).toBe('TEXTAREA')
    w.unmount()
  })

  it('a disabled invalid capsule keeps the disabled plate without the invalid mark', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toContain(':root .ui-capsule[data-invalid]:not(:has(:disabled)) {')
    const w = mount(UiTextarea, { props: { ...base, disabled: true, invalid: true } })
    expect(w.attributes('data-invalid')).toBe('true')
    expect(w.find('textarea').attributes('disabled')).toBeDefined()
  })

  it('a refused change keeps the caret where it was', async () => {
    const w = mount(UiTextarea, {
      attachTo: document.body,
      props: { ...base, modelValue: 'Ring twice', 'onUpdate:modelValue': () => {} },
    })
    const el = w.find('textarea').element as HTMLTextAreaElement
    el.focus()
    el.value = 'Ring! twice'
    el.setSelectionRange(5, 5)
    await w.find('textarea').trigger('input')
    await nextTick()
    expect(el.value).toBe('Ring twice')
    expect(el.selectionStart).toBe(4)
    w.unmount()
  })

  it('a refused composition goes back to the model too', async () => {
    const w = mount(UiTextarea, {
      props: { ...base, modelValue: 'abc', 'onUpdate:modelValue': () => {} },
    })
    const area = w.find('textarea')
    const el = area.element as HTMLTextAreaElement
    await area.trigger('compositionstart')
    el.value = 'abcに'
    await area.trigger('input')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await area.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['abcに']])
    await nextTick()
    expect(el.value).toBe('abc')
  })

  it('a change the parent refuses puts the textarea back on the model', async () => {
    const w = mount(UiTextarea, { props: { ...base, modelValue: 'abc' } })
    const el = w.find('textarea').element as HTMLTextAreaElement
    el.value = 'abcd'
    await w.find('textarea').trigger('input')
    await nextTick()
    expect(el.value).toBe('abc')
  })

  it('a form reset leaves the textarea on its model', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiTextarea, { attachTo: form, props: { ...base, modelValue: 'Call first' } })
    const el = w.find('textarea').element as HTMLTextAreaElement
    el.defaultValue = 'old'
    form.reset()
    expect(el.value).toBe('old')
    await new Promise((r) => setTimeout(r))
    expect(el.value).toBe('Call first')
    w.unmount()
    form.remove()
  })

  it('caller aria-invalid and aria-required reach the textarea when the field sets none', () => {
    const w = mount(UiTextarea, {
      props: base,
      attrs: { 'aria-invalid': 'true', 'aria-required': 'true' },
    })
    expect(w.find('textarea').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
  })
})
