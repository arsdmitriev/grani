import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import UiStepper from './UiStepper.vue'
import UiInput from './UiInput.vue'
import UiField from './UiField.vue'
import { focusInvalid } from '../utils/focusInvalid'
import { RUSSIAN, withGrani } from '../test/harness'

const qty = (props: Record<string, unknown> = {}) =>
  mount(UiStepper, {
    props: { ariaLabel: 'Quantity', modelValue: '2', ...props },
    slots: { end: 'pcs' },
  })
const edges = (w: ReturnType<typeof mount>) => w.findAll('button')

describe('UiStepper', () => {
  it('minus and plus at the edges, the count centered in monospace, step 1 by default', async () => {
    const w = qty()
    expect(edges(w)).toHaveLength(2)
    const name = (b: number) =>
      (edges(w)[b]!.attributes('aria-labelledby') ?? '')
        .split(' ')
        .map((id) => w.element.querySelector(`[id="${id}"]`)?.textContent?.trim())
        .join(' ')
    expect(name(0)).toBe('Decrease Quantity')
    expect(name(1)).toBe('Increase Quantity')
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['text-center', 'font-mono']))
    expect(w.find('input').attributes('inputmode')).toBe('numeric')
    expect(w.findAll('button[tabindex="-1"]')).toHaveLength(2)
    await edges(w)[1]!.trigger('click')
    await edges(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['3'], ['1']])
  })

  it('the buttons rest at the bounds and while disabled; the keyboard steps too', async () => {
    const low = qty({ modelValue: '1', min: 1, max: 5 })
    expect((edges(low)[0]!.element as HTMLButtonElement).disabled).toBe(true)
    expect((edges(low)[1]!.element as HTMLButtonElement).disabled).toBe(false)
    const high = qty({ modelValue: '5', min: 1, max: 5 })
    expect((edges(high)[1]!.element as HTMLButtonElement).disabled).toBe(true)
    const off = qty({ disabled: true })
    for (const b of edges(off)) expect((b.element as HTMLButtonElement).disabled).toBe(true)
    await low.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(low.emitted('update:modelValue')).toEqual([['2']])
  })

  it('pressing minus or plus with a pointer keeps the focus and the caret in the count', () => {
    const w = mount(UiStepper, {
      props: { ariaLabel: 'Quantity', modelValue: '2' },
      attachTo: document.body,
    })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.setSelectionRange(1, 1)
    for (const button of edges(w)) {
      // pointerdown left alone, so a tap ends in a click; mousedown held, so the focus stays.
      const point = new PointerEvent('pointerdown', { cancelable: true, bubbles: true })
      button.element.dispatchEvent(point)
      expect(point.defaultPrevented).toBe(false)
      const down = new MouseEvent('mousedown', { cancelable: true, bubbles: true })
      button.element.dispatchEvent(down)
      expect(down.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(input)
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 1])
    }
    w.unmount()
  })

  it('no stacked arrows in a stepper', () => {
    const w = qty({ step: 1 })
    expect(w.findAll('button')).toHaveLength(2)
    expect(w.find('svg.lucide-chevron-up').exists()).toBe(false)
  })

  it('the count takes the room between the buttons, so plus stands at the edge of a wide field', () => {
    const w = mount(UiStepper, {
      props: { modelValue: '8', ariaLabel: 'Count' },
      attrs: { class: 'w-36' },
    })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['flex-auto', 'w-[3em]']))
  })

  it("with no width given the count is 3em wide, room for four digits, not a text field's twenty characters", () => {
    const w = mount(UiStepper, { props: { modelValue: '8', ariaLabel: 'Count' } })
    expect(w.find('input').classes()).toContain('w-[3em]')
    expect(w.find('input').classes()).not.toContain('flex-1')
  })

  it('a field of its own: a number input beside it keeps its stacked arrows, not edges', () => {
    const w = mount(UiInput, { props: { modelValue: '2', numeric: true, step: 1, ariaLabel: 'N' } })
    expect(w.findAll('button')).toHaveLength(2)
    expect(w.find('svg.lucide-chevron-up').exists()).toBe(true)
  })

  it('empty sends null, as a number does', async () => {
    const w = qty({ modelValue: '2' })
    await w.find('input').setValue('')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })
})

describe('UiStepper — the wrapper', () => {
  it('a number field in its slot stays a field: the count is the stepper alone', () => {
    const w = mount(UiStepper, {
      props: { modelValue: '2', ariaLabel: 'Count' },
      slots: {
        end: () => h(UiInput, { modelValue: '1', numeric: true, step: 1, ariaLabel: 'Inner' }),
      },
    })
    const inner = w.findAll('.ui-capsule')[1]!
    expect(inner.find('svg.lucide-chevron-up').exists()).toBe(true)
    expect(inner.find('svg.lucide-minus').exists()).toBe(false)
  })

  it('a unit stands in #end, and an addon in #start, as on the field', () => {
    const w = mount(UiStepper, {
      props: { modelValue: '2', ariaLabel: 'Price' },
      slots: { start: '€', end: 'pcs' },
    })
    expect(w.text()).toContain('€')
    expect(w.text()).toContain('pcs')
  })

  it('inside UiField the label points at the count, and the error and required reach it', () => {
    const f = mount(UiField, {
      props: { label: 'Guests', error: 'Too many', required: true },
      slots: { default: () => h(UiStepper, { modelValue: '9' }) },
    })
    const input = f.find('input')
    expect(f.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-describedby')).toBeTruthy()
  })

  it('attributes and listeners land on the count, class and style on the capsule', async () => {
    const blur = vi.fn()
    const w = mount(UiStepper, {
      props: { modelValue: '2', ariaLabel: 'Count' },
      attrs: { class: 'w-36', style: 'color: red', 'data-testid': 'count', onBlur: blur },
    })
    const input = w.find('input')
    expect(input.attributes('data-testid')).toBe('count')
    expect(w.classes()).toContain('w-36')
    expect(input.classes()).not.toContain('w-36')
    await input.trigger('blur')
    expect(blur).toHaveBeenCalledOnce()
  })

  it('in a field it keeps its own width instead of stretching across the column', () => {
    const f = mount(UiField, {
      props: { label: 'Guests' },
      slots: { default: () => h(UiStepper, { modelValue: '1' }) },
    })
    expect(f.find('.ui-capsule').classes()).toContain('[.ui-field>&]:self-start')
  })

  it('readonly turns the buttons off, as disabled does', () => {
    const w = qty({ readonly: true })
    for (const b of edges(w)) expect((b.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('a stepper with no name warns under its own name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiStepper, { props: { modelValue: '1' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiStepper has no name'))
    warn.mockRestore()
  })
})

describe('UiStepper — what it says and keeps', () => {
  const named = (w: ReturnType<typeof mount>, button: number) =>
    (w.findAll('button')[button]!.attributes('aria-labelledby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(' ')

  it('the buttons are named by what they change: Decrease Guests, Increase Guests', () => {
    const f = mount(UiField, {
      props: { label: 'Guests' },
      slots: { default: () => h(UiStepper, { modelValue: '2' }) },
      attachTo: document.body,
    })
    expect(named(f, 0)).toBe('Decrease Guests')
    expect(named(f, 1)).toBe('Increase Guests')
    f.unmount()
    const alone = mount(UiStepper, {
      props: { modelValue: '2', ariaLabel: 'Nights' },
      attachTo: document.body,
    })
    expect(named(alone, 0)).toBe('Decrease Nights')
    alone.unmount()
  })

  it('two steppers on one page each name their own buttons', () => {
    const page = mount(
      {
        render: () => [
          h(UiStepper, { modelValue: '1', ariaLabel: 'Adults' }),
          h(UiStepper, { modelValue: '1', ariaLabel: 'Children' }),
        ],
      },
      { attachTo: document.body },
    )
    const names = page.findAll('button').map((b) =>
      (b.attributes('aria-labelledby') ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .join(' '),
    )
    expect(names).toEqual([
      'Decrease Adults',
      'Increase Adults',
      'Decrease Children',
      'Increase Children',
    ])
    page.unmount()
  })

  it('the count is a spinbutton: a screen reader hears its value and its bounds', async () => {
    const w = mount(UiStepper, { props: { modelValue: '3', min: 1, max: 5, ariaLabel: 'Guests' } })
    const count = w.find('input')
    expect(count.attributes('role')).toBe('spinbutton')
    expect(count.attributes()).toMatchObject({
      'aria-valuenow': '3',
      'aria-valuemin': '1',
      'aria-valuemax': '5',
    })
    await w.setProps({ modelValue: null })
    expect(count.attributes('aria-valuenow')).toBeUndefined()
  })

  it('in a field in error, focusInvalid lands on the count', () => {
    const f = mount(UiField, {
      props: { label: 'Guests', error: 'At least one' },
      slots: { default: () => h(UiStepper, { modelValue: '0' }) },
      attachTo: document.body,
    })
    expect(focusInvalid(f.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(f.find('input').element)
    f.unmount()
  })

  it('a count pasted as people write it is read in the app locale', async () => {
    const w = mount(UiStepper, {
      props: {
        modelValue: '1',
        ariaLabel: 'Pieces',
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale: 'ru' }) },
      attachTo: document.body,
    })
    const el = w.find('input').element as HTMLInputElement
    el.value = '1\u00a0200'
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }))
    await nextTick()
    await nextTick()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1200'])
    w.unmount()
  })

  it('a count the locale cannot read for sure tells the app, as its number field does', async () => {
    const w = mount(UiStepper, {
      props: {
        modelValue: '1',
        ariaLabel: 'Pieces',
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale: 'ru' }) },
      attachTo: document.body,
    })
    const el = w.find('input').element as HTMLInputElement
    el.value = '1.200'
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }))
    await nextTick()
    await nextTick()
    expect([w.emitted('update:modelValue')?.at(-1), w.emitted('unsure')]).toEqual([
      ['1.200'],
      [[false], [true]],
    ])
    w.unmount()
  })

  it("in a form it sends its count under its name, and a reset puts the app's count back", async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiStepper, {
      props: { modelValue: '4', name: 'guests', ariaLabel: 'Guests' },
      attachTo: form,
    })
    const el = w.find('input').element as HTMLInputElement
    expect(new FormData(form).get('guests')).toBe('4')
    el.defaultValue = '1'
    form.reset()
    await new Promise((r) => setTimeout(r))
    expect(el.value).toBe('4')
    w.unmount()
    form.remove()
  })
})

describe('UiStepper — rules pass', () => {
  it('the count keeps its 3em whatever its digits, minus and plus at the edges, so neither moves', async () => {
    const w = qty({ modelValue: '9' })
    const input = () => w.find('input')
    const order = () => [...w.element.querySelectorAll('button, input')].map((e) => e.tagName)
    for (const value of ['9', '10', '100']) {
      await w.setProps({ modelValue: value })
      expect(input().classes(), value).toEqual(expect.arrayContaining(['w-[3em]', 'flex-auto']))
      expect(order(), value).toEqual(['BUTTON', 'INPUT', 'BUTTON'])
    }
  })

  it('a press of plus the parent refuses leaves the count on the model', async () => {
    const w = mount(UiStepper, {
      attachTo: document.body,
      props: { ariaLabel: 'Quantity', modelValue: '5', max: 9 },
    })
    await edges(w)[1]!.trigger('click')
    await nextTick()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['6'])
    await nextTick()
    expect((w.find('input').element as HTMLInputElement).value).toBe('5')
    w.unmount()
  })
})

describe('UiStepper — review follow-ups', () => {
  it('a press on a count the locale cannot read moves nothing and marks it at once', async () => {
    const w = mount(UiStepper, {
      attachTo: document.body,
      props: { ariaLabel: 'Guests', modelValue: '1' },
    })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.value = '1,5'
    input.dispatchEvent(
      new InputEvent('input', { inputType: 'insertText', data: '5', bubbles: true }),
    )
    await nextTick()
    await w.setProps({ modelValue: '1,5' })
    expect(input.getAttribute('aria-invalid')).not.toBe('true')
    await edges(w)[1]!.trigger('click')
    await nextTick()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1,5'])
    expect(input.getAttribute('aria-invalid')).toBe('true')
    w.unmount()
  })

  it('says no value while the count is unsure: "1.200" typed in Russian is not 1.2', async () => {
    const w = mount(UiStepper, {
      attachTo: document.body,
      props: { ariaLabel: 'Guests', modelValue: '1' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.value = '1.200'
    input.dispatchEvent(
      new InputEvent('input', { inputType: 'insertText', data: '0', bubbles: true }),
    )
    await nextTick()
    const sent = w.emitted('update:modelValue')?.at(-1)?.[0] as string
    await w.setProps({ modelValue: sent })
    expect(w.emitted('unsure')?.at(-1)).toEqual([true])
    expect(input.getAttribute('aria-valuenow')).toBeNull()
    w.unmount()
  })

  it('focus() puts the focus in the count', () => {
    const w = mount(UiStepper, {
      attachTo: document.body,
      props: { ariaLabel: 'Guests', modelValue: '2' },
    })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})
