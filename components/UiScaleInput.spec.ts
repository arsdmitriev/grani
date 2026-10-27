import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import UiField from './UiField.vue'
import UiScaleInput from './UiScaleInput.vue'
import { withGrani } from '../test/harness'
import { focusInvalid } from '../utils/focusInvalid'
import { SCALE_RAMP_CLASS } from '../utils/scaleRamp'

const base = { modelValue: null, ariaLabel: 'Difficulty' }
const radios = (w: ReturnType<typeof mount>) => w.findAll('[role=radio]')

describe('UiScaleInput', () => {
  it('is a radiogroup of one radio per step, filled up to the mark, with a readout', () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 7 } })
    expect(w.find('[role=radiogroup]').attributes('aria-label')).toBe('Difficulty')
    expect(radios(w)).toHaveLength(10)
    expect(radios(w)[6]!.attributes('aria-checked')).toBe('true')
    expect(radios(w)[6]!.attributes('aria-label')).toBe('7 of 10')
    expect(radios(w)[0]!.classes()).toContain('bg-brand-solid')
    expect(radios(w)[6]!.classes()).toContain('bg-brand-solid')
    expect(radios(w)[7]!.classes()).toContain('bg-border')
    expect(w.text()).toContain('7')
    expect(w.text()).toContain('/ 10')
    expect(
      mount(UiScaleInput, { props: { ...base, unit: 'km', modelValue: 3, max: 5 } }).text(),
    ).toContain('/ 5 km')
  })

  it('one tab stop, on the mark; arrows, Home, End move it and Delete clears', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 4 }, attachTo: document.body })
    const stops = radios(w).filter((r) => r.attributes('tabindex') === '0')
    expect(stops).toHaveLength(1)
    expect(stops[0]!.attributes('aria-checked')).toBe('true')
    await radios(w)[3]!.trigger('keydown', { key: 'ArrowRight' })
    await radios(w)[3]!.trigger('keydown', { key: 'End' })
    await radios(w)[3]!.trigger('keydown', { key: 'Home' })
    await radios(w)[3]!.trigger('keydown', { key: 'Delete' })
    expect(w.emitted('update:modelValue')).toEqual([[5], [10], [1], [null]])
    w.unmount()
  })

  it('a click picks; a click on the mark clears unless clearable is off', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 4 } })
    await radios(w)[1]!.trigger('click')
    await radios(w)[3]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[2], [null]])
    const keep = mount(UiScaleInput, { props: { ...base, modelValue: 4, clearable: false } })
    await radios(keep)[3]!.trigger('click')
    expect(keep.emitted('update:modelValue')).toBeUndefined()
  })

  it('the ends carry the corners and the words; disabled takes the disabled tokens', () => {
    const w = mount(UiScaleInput, {
      props: { ...base, modelValue: 2, min: 1, max: 5, lowLabel: 'easy', highLabel: 'hard' },
    })
    expect(radios(w)[0]!.classes()).toContain('rounded-s-control')
    expect(radios(w)[4]!.classes()).toContain('rounded-e-control')
    expect(w.text()).toContain('easy')
    expect(w.text()).toContain('hard')
    const off = mount(UiScaleInput, { props: { ...base, modelValue: 2, disabled: true } })
    for (const r of radios(off)) expect((r.element as HTMLButtonElement).disabled).toBe(true)
    expect(radios(off)[0]!.classes()).toContain('bg-disabled-fg')
    expect(radios(off)[5]!.classes()).toContain('bg-disabled-bg')
  })

  it('a mark that leaves a shrunken scale is dropped', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 9 } })
    await w.setProps({ max: 5 })
    expect(w.emitted('update:modelValue')).toEqual([[null]])
  })

  it('inside UiField the label names the group and the description describes it', () => {
    const w = mount(UiField, {
      props: { label: 'Difficulty', description: 'How hard it feels' },
      slots: { default: () => h(UiScaleInput, { modelValue: 3 }) },
    })
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-labelledby')).toBe(w.find('label').attributes('id'))
    expect(group.attributes('aria-describedby')).toBeTruthy()
    expect(group.attributes('aria-label')).toBeUndefined()
  })

  it('standalone, ariaLabel names the group and its own id lands on it; showNumbers off empties the segments', () => {
    const w = mount(UiScaleInput, { props: { modelValue: 3, ariaLabel: 'Mood', id: 'mood' } })
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-label')).toBe('Mood')
    expect(group.attributes('id')).toBe('mood')
    expect(w.text()).not.toContain('Mood')
    const quiet = mount(UiScaleInput, { props: { ...base, modelValue: 3, showNumbers: false } })
    expect(radios(quiet)[0]!.text()).toBe('')
    expect(radios(quiet)[0]!.attributes('aria-label')).toBe('1 of 10')
  })

  it('thermometer mixes the status tokens by the mark; invert reverses it; brand has no inline color', () => {
    const low = mount(UiScaleInput, { props: { ...base, modelValue: 1, variant: 'thermometer' } })
    expect(radios(low)[0]!.classes()).toContain(SCALE_RAMP_CLASS.low)
    expect(radios(low)[0]!.attributes('style')).toContain('--ui-scale-mix: 100%')
    const high = mount(UiScaleInput, { props: { ...base, modelValue: 10, variant: 'thermometer' } })
    expect(radios(high)[0]!.classes()).toContain(SCALE_RAMP_CLASS.high)
    expect(radios(high)[0]!.attributes('style')).toContain('--ui-scale-mix: 0%')
    const inv = mount(UiScaleInput, {
      props: { ...base, modelValue: 10, variant: 'thermometer', invert: true },
    })
    expect(radios(inv)[0]!.classes()).toContain(SCALE_RAMP_CLASS.low)
    expect(radios(inv)[0]!.attributes('style')).toContain('--ui-scale-mix: 100%')
    const brand = mount(UiScaleInput, { props: { ...base, modelValue: 5 } })
    expect(radios(brand)[0]!.attributes('style')).toBeUndefined()
    expect(radios(low)[0]!.classes()).toContain('text-danger-fg')
  })
})

describe('UiScaleInput — review follow-ups', () => {
  it('Delete and Backspace obey clearable=false', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 4, clearable: false } })
    await radios(w)[3]!.trigger('keydown', { key: 'Delete' })
    await radios(w)[3]!.trigger('keydown', { key: 'Backspace' })
    await radios(w)[3]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const on = mount(UiScaleInput, { props: { ...base, modelValue: 4 } })
    await radios(on)[3]!.trigger('keydown', { key: 'Delete' })
    expect(on.emitted('update:modelValue')).toEqual([[null]])
  })

  it('data-testid and other fallthrough attrs reach the radiogroup, not the wrapper', () => {
    const w = mount(UiScaleInput, {
      props: base,
      attrs: { 'data-testid': 'scale', class: 'w-80', 'aria-describedby': 'hint' },
    })
    expect(w.attributes('data-testid')).toBeUndefined()
    expect(w.classes()).toContain('w-80')
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('data-testid')).toBe('scale')
    expect(group.attributes('aria-describedby')).toBe('hint')
    expect(group.classes()).not.toContain('w-80')
  })

  it('invalid draws a visible mark on the bar, not aria-invalid alone', () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 3, invalid: true } })
    expect(radios(w)[5]!.classes()).toContain('bg-danger-subtle')
    expect(radios(w)[0]!.classes()).not.toContain('bg-danger-subtle')
    const ok = mount(UiScaleInput, { props: { ...base, modelValue: 3 } })
    expect(radios(ok)[5]!.classes()).not.toContain('bg-danger-subtle')
  })

  it('an off-scale model at mount is shown as no answer and not emitted', () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 15 } })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(radios(w).some((r) => r.classes().includes('bg-brand-solid'))).toBe(false)
    expect(w.text()).not.toContain('15')
  })

  it('a NaN modelValue reads as no answer, not "NaN"', () => {
    const w = mount(UiScaleInput, {
      props: { ...base, modelValue: Number.NaN, variant: 'thermometer' },
    })
    expect(w.text()).not.toContain('NaN')
    expect(radios(w).every((r) => r.attributes('style') === undefined)).toBe(true)
    expect(radios(w)[0]!.attributes('tabindex')).toBe('0')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a name prop reaches a hidden input kept in sync with the model', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 7, name: 'effort' } })
    const input = w.find('input[type=hidden]')
    expect(input.attributes('name')).toBe('effort')
    expect((input.element as HTMLInputElement).value).toBe('7')
    await w.setProps({ modelValue: 4 })
    expect((w.find('input[type=hidden]').element as HTMLInputElement).value).toBe('4')
    expect(mount(UiScaleInput, { props: base }).find('input').exists()).toBe(false)
  })

  it('disabled wins over invalid; a thermometer keeps its fill and tints only the empty segments', () => {
    const off = mount(UiScaleInput, {
      props: { ...base, modelValue: 3, invalid: true, disabled: true },
    })
    expect(radios(off)[5]!.classes()).toContain('bg-disabled-bg')
    expect(radios(off)[5]!.classes()).not.toContain('bg-danger-subtle')
    const warm = mount(UiScaleInput, {
      props: { ...base, modelValue: 3, invalid: true, variant: 'thermometer' },
    })
    expect(radios(warm)[0]!.classes()).toContain(SCALE_RAMP_CLASS.low)
    expect(radios(warm)[5]!.classes()).toContain('bg-danger-subtle')
  })

  it('a value between two steps is no answer; it is dropped only when the scale shrinks under a mark', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 3.5 } })
    expect(radios(w).some((r) => r.attributes('aria-checked') === 'true')).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const shrunk = mount(UiScaleInput, { props: { ...base, modelValue: 9 } })
    await shrunk.setProps({ max: 5 })
    expect(shrunk.emitted('update:modelValue')).toEqual([[null]])
  })

  it('min greater than max warns in dev like the twelve-step case', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiScaleInput, { props: { ...base, min: 5, max: 3 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no step to pick'))
    warn.mockRestore()
  })
})

describe('UiScaleInput — review follow-ups, size', () => {
  it("follows the app's size and reads md as sm", () => {
    const at = (size: 'xs' | 'md') =>
      mount(UiScaleInput, { props: base, global: { plugins: withGrani({ size }) } }).html()
    expect(at('xs')).toContain('h-7')
    const html = at('md')
    expect(html).toContain('h-9')
    expect(html).not.toContain('h-11')
  })
})

describe('UiScaleInput — review follow-ups', () => {
  const owned = (props: Record<string, unknown> = {}) => {
    const w = mount(UiScaleInput, {
      attachTo: document.body,
      props: {
        ...base,
        'onUpdate:modelValue': (v: number | null) => w.setProps({ modelValue: v }),
        ...props,
      },
    })
    return w
  }
  const key = (el: Element, k: string, mods: KeyboardEventInit = {}) =>
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods }),
    )

  it('thermometer numerals take the ink that reads on their stop', () => {
    const at = (modelValue: number) =>
      mount(UiScaleInput, { props: { ...base, modelValue, variant: 'thermometer' } })
    // 1 of 10 is the danger stop: the light ink; 4 of 10 sits near the danger and warning mix: the dark one.
    expect(radios(at(1))[0]!.classes()).toContain('text-danger-fg')
    expect(radios(at(4))[0]!.classes()).toContain('text-warning-fg')
    expect(radios(at(10))[0]!.classes()).toContain('text-danger-fg')
  })

  it("a caller's aria-labelledby, aria-invalid and aria-required survive where the scale sets none", () => {
    const w = mount(UiScaleInput, {
      props: { modelValue: null },
      attrs: { 'aria-labelledby': 'x', 'aria-invalid': 'true', 'aria-required': 'true' },
    })
    expect(w.find('[role=radiogroup]').attributes()).toMatchObject({
      'aria-labelledby': 'x',
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
  })

  it('keys with Alt, Ctrl or Meta pass through and change nothing', () => {
    const w = owned({ modelValue: 4 })
    const mark = radios(w)[3]!.element
    for (const mods of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      key(mark, 'ArrowLeft', mods)
      key(mark, 'Delete', mods)
    }
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('after a clear or a refused arrow the focus returns to the tab stop and the next arrow starts from it', async () => {
    const w = owned({ modelValue: 4 })
    ;(radios(w)[3]!.element as HTMLElement).focus()
    key(radios(w)[3]!.element, 'Delete')
    for (let i = 0; i < 3; i++) await nextTick()
    expect(document.activeElement).toBe(radios(w)[0]!.element)
    key(document.activeElement!, 'ArrowRight')
    for (let i = 0; i < 3; i++) await nextTick()
    expect(w.props('modelValue')).toBe(1)
    w.unmount()
    const refused = mount(UiScaleInput, {
      attachTo: document.body,
      props: { ...base, modelValue: 4 },
    })
    ;(radios(refused)[3]!.element as HTMLElement).focus()
    key(radios(refused)[3]!.element, 'ArrowRight')
    for (let i = 0; i < 3; i++) await nextTick()
    expect(document.activeElement).toBe(radios(refused)[3]!.element)
    refused.unmount()
  })

  it('in a form the mark sends under the name, none and disabled send nothing', () => {
    const form = document.createElement('form')
    document.body.append(form)
    const send = (props: Record<string, unknown>) => {
      const w = mount(UiScaleInput, {
        attachTo: form,
        props: { ...base, name: 'effort', ...props },
      })
      const value = new FormData(form).get('effort')
      w.unmount()
      return value
    }
    expect(send({ modelValue: 7 })).toBe('7')
    expect(send({ modelValue: null })).toBeNull()
    expect(send({ modelValue: 7, disabled: true })).toBeNull()
    form.remove()
  })

  it('required on the scale says aria-required standalone and stays silent inside a group field', () => {
    expect(
      mount(UiScaleInput, { props: { ...base, required: true } })
        .find('[role=radiogroup]')
        .attributes('aria-required'),
    ).toBe('true')
    const f = mount(UiField, {
      props: { label: 'Effort', group: true, required: true },
      slots: { default: () => h(UiScaleInput, { modelValue: null }) },
    })
    expect(f.find('[role=radiogroup]').attributes('aria-required')).toBeUndefined()
  })

  it('the first and last radio name their end words', () => {
    const w = mount(UiScaleInput, { props: { ...base, lowLabel: 'easy', highLabel: 'hard' } })
    expect(radios(w)[0]!.attributes('aria-label')).toBe('1 of 10, easy')
    expect(radios(w)[9]!.attributes('aria-label')).toBe('10 of 10, hard')
    expect(radios(w)[4]!.attributes('aria-label')).toBe('5 of 10')
  })

  it('a non-finite or huge max renders no steps and does not hang', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(
      radios(mount(UiScaleInput, { props: { ...base, max: Number.POSITIVE_INFINITY } })),
    ).toHaveLength(0)
    expect(radios(mount(UiScaleInput, { props: { ...base, max: 1e9 } }))).toHaveLength(0)
    warn.mockRestore()
  })

  it('empty numerals read in the body ink on their track', () => {
    const w = mount(UiScaleInput, { props: base })
    expect(radios(w)[0]!.classes()).toContain('text-fg')
    expect(radios(w)[0]!.classes()).not.toContain('text-fg-muted')
  })

  it('a scale with no name warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiScaleInput, { props: { modelValue: null } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiScaleInput has no name'))
    warn.mockRestore()
  })

  it('invalid with a full bar still shows, on the frame', () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 10, invalid: true } })
    expect(w.find('[role=radiogroup]').classes()).toContain('ring-danger-border')
  })

  it('Space on the mark keeps it', () => {
    const w = owned({ modelValue: 4 })
    key(radios(w)[3]!.element, ' ')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('ArrowUp at max and ArrowDown at min emit nothing', () => {
    const top = owned({ modelValue: 10 })
    key(radios(top)[9]!.element, 'ArrowUp')
    expect(top.emitted('update:modelValue')).toBeUndefined()
    top.unmount()
    const bottom = owned({ modelValue: 1 })
    key(radios(bottom)[0]!.element, 'ArrowDown')
    expect(bottom.emitted('update:modelValue')).toBeUndefined()
    bottom.unmount()
  })

  it('a refused pick leaves the bar and the tab stop on the model', async () => {
    const w = mount(UiScaleInput, { props: { ...base, modelValue: 4 } })
    await radios(w)[6]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[7]])
    expect(radios(w)[3]!.attributes('aria-checked')).toBe('true')
    expect(radios(w)[3]!.attributes('tabindex')).toBe('0')
  })

  it('focusInvalid on an invalid scale focuses the chosen segment, else the first', () => {
    const at = (modelValue: number | null) =>
      mount(
        defineComponent({
          setup: () => () => h('form', [h(UiScaleInput, { ...base, modelValue, invalid: true })]),
        }),
        { attachTo: document.body },
      )
    const chosen = at(6)
    expect(focusInvalid(chosen.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(radios(chosen)[5]!.element)
    chosen.unmount()
    const none = at(null)
    expect(focusInvalid(none.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(radios(none)[0]!.element)
    none.unmount()
  })
})
