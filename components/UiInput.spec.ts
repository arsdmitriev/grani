import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UiInput from './UiInput.vue'
import UiField from './UiField.vue'
import { focusInvalid } from '../utils/focusInvalid'
import { withGrani } from '../test/harness'

const base = { modelValue: '', ariaLabel: 'Name' }

describe('UiInput — value and control', () => {
  it('shows the value and emits on input', async () => {
    const w = mount(UiInput, { props: { ...base, modelValue: 'Ann' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('Ann')
    await w.find('input').setValue('Anna')
    expect(w.emitted('update:modelValue')).toEqual([['Anna']])
  })

  it('props reach the input; class stays on the capsule, other attributes reach the input too', () => {
    const w = mount(UiInput, {
      props: {
        ...base,
        type: 'email',
        name: 'email',
        placeholder: 'you@work',
        autocomplete: 'email',
        maxlength: 80,
        inputmode: 'email',
      },
      attrs: { class: 'w-80', 'data-testid': 'email' },
    })
    const input = w.find('input')
    expect(input.attributes()).toMatchObject({
      type: 'email',
      name: 'email',
      placeholder: 'you@work',
      autocomplete: 'email',
      maxlength: '80',
      inputmode: 'email',
      'aria-label': 'Name',
    })
    expect(w.classes()).toContain('w-80')
    expect(w.attributes('data-testid')).toBeUndefined()
    expect(input.attributes('data-testid')).toBe('email')
  })

  it('exposes focus()', () => {
    const w = mount(UiInput, { props: base, attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})

describe('UiInput — states', () => {
  it('stands on the control ladder with sm as the default', () => {
    expect(mount(UiInput, { props: base }).classes()).toContain('h-9')
    expect(mount(UiInput, { props: { ...base, size: 'md' } }).classes()).toContain('h-11')
  })

  it('invalid turns the border red and marks the input', () => {
    const w = mount(UiInput, { props: { ...base, invalid: true } })
    expect(w.classes()).toContain('border-danger-border')
    expect(w.attributes('data-invalid')).toBe('true')
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(mount(UiInput, { props: base }).find('input').attributes('aria-invalid')).toBeUndefined()
  })

  it('disabled takes its own plate and blocks the input; readonly looks ordinary', () => {
    const off = mount(UiInput, { props: { ...base, disabled: true } })
    expect(off.classes()).toContain('bg-disabled-bg')
    expect(off.find('input').attributes('disabled')).toBeDefined()
    expect(off.find('input').classes()).toContain('disabled:text-disabled-fg')
    const ro = mount(UiInput, { props: { ...base, readonly: true } })
    expect(ro.find('input').attributes('readonly')).toBeDefined()
    expect(ro.classes()).toContain('bg-control-bg')
  })

  it('the capsule owns the focus ring: no ring classes on the input, a data hook on the capsule', () => {
    const w = mount(UiInput, { props: base })
    expect(w.classes()).toContain('ui-capsule')
    expect(w.find('input').classes()).toContain('focus:outline-hidden')
  })

  it('bare drops the capsule: no border, no plate, the larger type of a window header', () => {
    const w = mount(UiInput, { props: { ...base, variant: 'bare' } })
    expect(w.classes()).not.toContain('border')
    expect(w.classes()).not.toContain('bg-control-bg')
    expect(w.classes()).toContain('text-base')
    expect(w.attributes('data-bare')).toBe('true')
  })
})

describe('UiInput — addons', () => {
  it('addons render around the value and set no height of their own', () => {
    const w = mount(UiInput, {
      props: base,
      slots: { start: '<span class="unit">$</span>', end: '<span class="unit">USD</span>' },
    })
    const units = w.findAll('.unit')
    expect(units).toHaveLength(2)
    for (const wrap of w.findAll('span.flex'))
      expect(wrap.classes().some((c) => /^h-/.test(c))).toBe(false)
    expect(w.text()).toContain('$')
  })

  it('a click on a text addon puts the cursor in the value', async () => {
    const w = mount(UiInput, {
      props: base,
      slots: { end: '<span class="unit">kg</span>' },
      attachTo: document.body,
    })
    await w.find('.unit').trigger('pointerdown')
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('a click on a button addon stays a click and does not steal focus into the value', async () => {
    const w = mount(UiInput, {
      props: base,
      slots: { end: '<button class="act">Clear</button>' },
      attachTo: document.body,
    })
    await w.find('.act').trigger('pointerdown')
    expect(document.activeElement).not.toBe(w.find('input').element)
    w.unmount()
  })

  it('keyboard order: the value first, the addon button second', () => {
    const w = mount(UiInput, { props: base, slots: { end: '<button class="act">Clear</button>' } })
    const focusables = w.findAll('input, button')
    expect(focusables.map((e) => e.element.tagName)).toEqual(['INPUT', 'BUTTON'])
  })
})

describe('UiInput — numeric', () => {
  it('monospaced tabular digits and a decimal keyboard', () => {
    const input = mount(UiInput, { props: { ...base, numeric: true } }).find('input')
    expect(input.classes()).toEqual(expect.arrayContaining(['font-mono', 'tabular-nums']))
    expect(input.attributes('inputmode')).toBe('decimal')
  })

  it('with a unit after it the value sizes to its digits; without one it fills the capsule', () => {
    const unit = mount(UiInput, { props: { ...base, numeric: true }, slots: { end: 'EUR' } }).find(
      'input',
    )
    expect(unit.classes()).toContain('[field-sizing:content]')
    expect(unit.classes()).not.toContain('flex-1')
    expect(
      mount(UiInput, { props: { ...base, numeric: true } })
        .find('input')
        .classes(),
    ).toContain('flex-1')
  })
})

describe('UiInput — numeric normalization', () => {
  it('a comma becomes a point in the emitted value and in the control', async () => {
    // Swiss German: the decimal is a point and the grouping an apostrophe, so a comma is a decimal.
    const w = mount(UiInput, {
      props: {
        ...base,
        numeric: true,
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale: 'de-CH' }) },
    })
    const input = w.find('input')
    ;(input.element as HTMLInputElement).value = '12,5'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toEqual([['12.5']])
    expect((input.element as HTMLInputElement).value).toBe('12.5')
  })

  it('a comma of a Russian app is a point in the emitted value; the control shows the comma', async () => {
    const w = mount(UiInput, {
      props: {
        ...base,
        numeric: true,
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale: 'ru' }) },
    })
    const input = w.find('input')
    ;(input.element as HTMLInputElement).value = '12,5'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toEqual([['12.5']])
    expect((input.element as HTMLInputElement).value).toBe('12,5')
    const plain = mount(UiInput, { props: base })
    ;(plain.find('input').element as HTMLInputElement).value = 'a,b'
    await plain.find('input').trigger('input')
    expect(plain.emitted('update:modelValue')).toEqual([['a,b']])
  })

  it('a search field hides the browser cross: the clear is an addon', () => {
    const w = mount(UiInput, { props: { ...base, type: 'search' } })
    expect(w.find('input').classes()).toContain('[&::-webkit-search-cancel-button]:appearance-none')
  })
})

describe('UiInput — step', () => {
  const stepped = (props: Record<string, unknown> = {}, locale = 'en') =>
    mount(UiInput, {
      props: { ...base, numeric: true, step: 0.1, modelValue: '10.44', ...props },
      slots: { end: 'EUR' },
      global: { plugins: withGrani({ locale }) },
    })
  const arrows = (w: ReturnType<typeof mount>) => w.findAll('button[tabindex="-1"]')

  it('draws two arrows out of the tab order only with numeric and step', () => {
    expect(arrows(stepped())).toHaveLength(2)
    // Named by the field, as the stepper's buttons: "Increase Name", read from two hidden lines.
    const named = (b: ReturnType<typeof arrows>[number]) =>
      (b.attributes('aria-labelledby') ?? '')
        .split(/\s+/)
        .map((id) => stepped().find(`[id="${id}"]`).text())
    expect(arrows(stepped())[0]!.attributes('aria-labelledby')).toMatch(/-increment /)
    expect(arrows(stepped())[1]!.attributes('aria-labelledby')).toMatch(/-decrement /)
    expect(named(arrows(stepped())[0]!)[0]).toBe('Increase')
    // The type refuses `step` without `numeric`; an app that passes it anyway gets no arrows.
    // @ts-expect-error a text field takes no step: what is checked here is the guard behind the type
    expect(arrows(mount(UiInput, { props: { ...base, step: 1 } }))).toHaveLength(0)
    expect(arrows(mount(UiInput, { props: { ...base, numeric: true } }))).toHaveLength(0)
  })

  it('arrows leave with disabled and readonly; the keyboard is quiet too', async () => {
    expect(arrows(stepped({ disabled: true }))).toHaveLength(0)
    const ro = stepped({ readonly: true })
    expect(arrows(ro)).toHaveLength(0)
    await ro.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(ro.emitted('update:modelValue')).toBeUndefined()
  })

  it('a click moves by the precision of the value: a cent stays a cent', async () => {
    const w = stepped()
    await arrows(w)[0]!.trigger('click')
    await arrows(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['10.45'], ['10.43']])
  })

  it('ArrowUp and ArrowDown step and do not move the caret; other keys pass', async () => {
    const w = stepped({ modelValue: '10' })
    const input = w.find('input')
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    input.element.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
    await input.trigger('keydown', { key: 'ArrowDown' })
    const left = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true })
    input.element.dispatchEvent(left)
    expect(left.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toEqual([['10.1'], ['9.9']])
  })

  it('min and max bound the arrows, not the typing', async () => {
    const w = stepped({ modelValue: '0', min: 0, max: 1 })
    expect(arrows(w)[1]!.attributes('disabled')).toBeDefined()
    await arrows(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const input = w.find('input')
    ;(input.element as HTMLInputElement).value = '5'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['5'])
    expect(input.attributes('min')).toBeUndefined()
  })

  it('an empty field steps from zero; a comma in the value is read in the app locale', async () => {
    const empty = stepped({ modelValue: '' })
    await arrows(empty)[0]!.trigger('click')
    expect(empty.emitted('update:modelValue')).toEqual([['0.1']])
    const comma = stepped({ modelValue: '12,5' }, 'ru')
    await arrows(comma)[0]!.trigger('click')
    expect(comma.emitted('update:modelValue')).toEqual([['12.6']])
    // A thousand grouped in English moves as a thousand, not as 1.234.
    const grouped = stepped({ modelValue: '1,234', step: 1 })
    await arrows(grouped)[0]!.trigger('click')
    expect(grouped.emitted('update:modelValue')).toEqual([['1235']])
  })

  it('pressing an arrow keeps the focus in the value', async () => {
    const w = mount(UiInput, {
      props: { ...base, numeric: true, step: 1, modelValue: '1' },
      attachTo: document.body,
    })
    // A pointer press is pointerdown then mousedown: the first is left alone, so a tap still ends
    // in a click; the second is held, so the focus stays in the value.
    const point = new PointerEvent('pointerdown', { cancelable: true, bubbles: true })
    arrows(w)[0]!.element.dispatchEvent(point)
    expect(point.defaultPrevented).toBe(false)
    const down = new MouseEvent('mousedown', { cancelable: true, bubbles: true })
    arrows(w)[0]!.element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})

describe('UiInput — number arrows', () => {
  it('a number with a step gets stacked arrows, a text field no buttons', () => {
    expect(
      mount(UiInput, { props: { ...base, numeric: true, step: 1 } }).findAll('button'),
    ).toHaveLength(2)
    expect(mount(UiInput, { props: base }).findAll('button')).toHaveLength(0)
  })
})

describe('UiInput — value safety', () => {
  it('a null value renders empty, never the word null', () => {
    const w = mount(UiInput, { props: { ...base, numeric: true, modelValue: null } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('empty is one rule: a text field sends an empty string, a numeric one null', async () => {
    const text = mount(UiInput, { props: { ...base, modelValue: 'Ann' } })
    await text.find('input').setValue('')
    expect(text.emitted('update:modelValue')).toEqual([['']])
    const numeric = mount(UiInput, { props: { ...base, modelValue: '12', numeric: true } })
    await numeric.find('input').setValue('')
    expect(numeric.emitted('update:modelValue')).toEqual([[null]])
    await numeric.find('input').setValue('7')
    expect(numeric.emitted('update:modelValue')!.at(-1)).toEqual(['7'])
  })

  it('emits nothing mid-composition and the final value at its end', async () => {
    const w = mount(UiInput, { props: base })
    const input = w.find('input')
    await input.trigger('compositionstart')
    ;(input.element as HTMLInputElement).value = 'に'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    ;(input.element as HTMLInputElement).value = '日本'
    await input.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['日本']])
  })
})

describe('UiInput — composition', () => {
  it('a re-render of the host mid-composition does not reset the characters being typed', async () => {
    const w = mount(UiInput, { props: { ...base, modelValue: 'a' } })
    const input = w.find('input')
    await input.trigger('compositionstart')
    ;(input.element as HTMLInputElement).value = 'aに'
    await input.trigger('input')
    await w.setProps({ placeholder: 'changed' })
    expect((input.element as HTMLInputElement).value).toBe('aに')
  })
})

describe('UiInput — addons in a focusable host', () => {
  it('a click on a text addon still focuses the value inside a tab panel or a dialog', async () => {
    const host = document.createElement('div')
    host.tabIndex = 0
    document.body.appendChild(host)
    const w = mount(UiInput, {
      props: base,
      slots: { end: '<span class="unit">kg</span>' },
      attachTo: host,
    })
    await w.find('.unit').trigger('pointerdown')
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
    host.remove()
  })

  it('a start glyph is sized by the capsule, not the caller', () => {
    const w = mount(UiInput, { props: base, slots: { start: '<svg />' } })
    expect(w.find('span').classes()).toEqual(expect.arrayContaining(['[&>svg]:h-4', '[&>svg]:w-4']))
  })
})

describe('UiInput — password', () => {
  it('a password gets an eye that shows and hides the characters', async () => {
    const w = mount(UiInput, { props: { ...base, type: 'password', modelValue: 'secret' } })
    const eye = w.find('button')
    expect(eye.attributes('aria-label')).toBe('Show password')
    expect(eye.attributes('aria-pressed')).toBe('false')
    expect(w.find('input').attributes('type')).toBe('password')
    await eye.trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
    expect(w.find('button').attributes('aria-label')).toBe('Show password')
    expect(w.find('button').attributes('aria-pressed')).toBe('true')
    expect(w.emitted('update:passwordVisible')).toEqual([[true]])
  })

  it('never offers a browser spellcheck, autocapitalize or autocorrect, shown or hidden', async () => {
    const w = mount(UiInput, { props: { ...base, type: 'password', modelValue: 'secret' } })
    const field = () => w.find('input')
    expect(field().attributes('spellcheck')).toBe('false')
    expect(field().attributes('autocapitalize')).toBe('off')
    expect(field().attributes('autocorrect')).toBe('off')
    await w.find('button').trigger('click')
    expect(field().attributes('type')).toBe('text')
    expect(field().attributes('spellcheck')).toBe('false')
    expect(field().attributes('autocapitalize')).toBe('off')
    expect(field().attributes('autocorrect')).toBe('off')
    expect(mount(UiInput, { props: base }).find('input').attributes('spellcheck')).toBeUndefined()
  })

  it('passwordVisible drives the eye from outside and no eye appears on other types', async () => {
    const w = mount(UiInput, { props: { ...base, type: 'password', passwordVisible: true } })
    expect(w.find('input').attributes('type')).toBe('text')
    await w.find('button').trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
    expect(w.emitted('update:passwordVisible')).toEqual([[false]])
    expect(mount(UiInput, { props: base }).find('button').exists()).toBe(false)
  })

  it('the eye follows disabled', () => {
    const w = mount(UiInput, { props: { ...base, type: 'password', disabled: true } })
    expect((w.find('button').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('the eye forgets what it showed when the type is no longer password', async () => {
    const w = mount(UiInput, { props: { ...base, type: 'password' } })
    await w.find('button').trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
    await w.setProps({ type: 'text' })
    await w.setProps({ type: 'password' })
    expect(w.find('input').attributes('type')).toBe('password')
  })

  it('in an xs capsule the eye shrinks to stay inside the border', () => {
    const w = mount(UiInput, { props: { ...base, type: 'password', size: 'xs' } })
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['!h-6', '!w-6']))
    expect(
      mount(UiInput, { props: { ...base, type: 'password' } })
        .find('button')
        .classes(),
    ).not.toContain('!h-6')
  })
})

describe('UiInput — review follow-ups', () => {
  const arrows = (props: { modelValue: string | null; min?: number; max?: number }) =>
    mount(UiInput, {
      props: { ariaLabel: 'Distance', numeric: true, step: 1, ...props },
    }).findAll('button[tabindex="-1"]')

  it('the small arrows rest at the bounds too', () => {
    const [upAtMin, downAtMin] = arrows({ modelValue: '0', min: 0, max: 5 })
    expect(upAtMin!.attributes('disabled')).toBeUndefined()
    expect(downAtMin!.attributes('disabled')).toBeDefined()
    const [upAtMax] = arrows({ modelValue: '5', min: 0, max: 5 })
    expect(upAtMax!.attributes('disabled')).toBeDefined()
  })

  it('inside UiField it takes the id, the error and required from the field', () => {
    const w = mount(UiField, {
      props: { label: 'Email', error: 'Enter an address with @', required: true },
      slots: { default: () => h(UiInput, { modelValue: '' }) },
    })
    const input = w.find('input')
    expect(input.attributes('id')).toBe(w.find('label').attributes('for'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(w.find('[role="alert"]').attributes('id'))
  })

  it('the arrows stand at the end of the capsule, not right after the unit', () => {
    const w = mount(UiInput, {
      props: { ariaLabel: 'Distance', numeric: true, step: 1, modelValue: '12' },
      slots: { end: 'km' },
    })
    const arrows = w.find('button[tabindex="-1"]').element.parentElement!
    expect(arrows.classList.contains('ms-auto')).toBe(true)
  })

  it('a value before a unit is one digit wide at least, so a short number keeps the gap', () => {
    const w = mount(UiInput, {
      props: { ariaLabel: 'Distance', numeric: true, modelValue: '12' },
      slots: { end: 'km' },
    })
    expect(w.find('input').classes()).toContain('min-w-[1ch]')
  })

  it('a button last in #end stands as close to the edge as the password eye', () => {
    const w = mount(UiInput, {
      props: { ariaLabel: 'Search', modelValue: 'invoices' },
      slots: { end: () => h('button', { type: 'button' }, 'x') },
    })
    const end = w.find('button').element.parentElement!
    expect(end.className).toContain('[&>button:last-child]:-me-1.5')
    const eye = mount(UiInput, {
      props: { ariaLabel: 'Password', modelValue: '', type: 'password' },
    })
    expect(eye.find('button').classes()).toContain('-me-1.5')
  })

  it('a search with text shows a cross that clears it and keeps the focus', async () => {
    const w = mount(UiInput, {
      props: { ariaLabel: 'Search', type: 'search', modelValue: 'invoices' },
      attachTo: document.body,
    })
    const cross = w.find('button[aria-label="Clear"]')
    expect(cross.exists()).toBe(true)
    await cross.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['']])
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('no cross on an empty, disabled or read-only search, nor on another type', () => {
    for (const props of [
      { type: 'search', modelValue: '' },
      { type: 'search', modelValue: 'x', disabled: true },
      { type: 'search', modelValue: 'x', readonly: true },
      { type: 'text', modelValue: 'x' },
    ] as const) {
      const w = mount(UiInput, { props: { ariaLabel: 'Search', ...props } })
      expect(w.find('button[aria-label="Clear"]').exists(), JSON.stringify(props)).toBe(false)
    }
  })

  it('Escape clears a search with text and goes no further; on an empty one it passes', async () => {
    const full = mount(UiInput, { props: { ariaLabel: 'Search', type: 'search', modelValue: 'x' } })
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    const outer = vi.fn()
    full.element.addEventListener('keydown', outer)
    full.find('input').element.dispatchEvent(esc)
    expect(full.emitted('update:modelValue')).toEqual([['']])
    expect(outer).not.toHaveBeenCalled()
    const empty = mount(UiInput, { props: { ariaLabel: 'Search', type: 'search', modelValue: '' } })
    const pass = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    empty.find('input').element.dispatchEvent(pass)
    expect(pass.defaultPrevented).toBe(false)
    expect(empty.emitted('update:modelValue')).toBeUndefined()
  })

  it('a numeric search cleared by Escape or the cross sends null, its empty', async () => {
    const props = { ariaLabel: 'Amount', type: 'search', numeric: true, modelValue: '12' } as const
    const byKey = mount(UiInput, { props })
    await byKey.find('input').trigger('keydown', { key: 'Escape' })
    expect(byKey.emitted('update:modelValue')).toEqual([[null]])
    const byCross = mount(UiInput, { props })
    await byCross.find('button').trigger('click')
    expect(byCross.emitted('update:modelValue')).toEqual([[null]])
  })
})

describe('UiInput — review follow-ups, attributes', () => {
  it('caller aria-invalid and aria-required reach the input when the component has none of its own', () => {
    const w = mount(UiInput, {
      props: { modelValue: '', ariaLabel: 'Name' },
      attrs: { 'aria-invalid': 'true', 'aria-required': 'true' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
  })
})

describe('UiInput — review follow-ups, the model', () => {
  const inForm = (props: Record<string, unknown>) => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiInput, { attachTo: form, props: { ...base, ...props } })
    return { form, w, el: w.find('input').element as HTMLInputElement }
  }

  it('a change the parent refuses puts the input back on the model', async () => {
    const w = mount(UiInput, { props: { ...base, modelValue: 'abc' } })
    const el = w.find('input').element as HTMLInputElement
    el.value = 'abcd'
    await w.find('input').trigger('input')
    await nextTick()
    expect(w.emitted('update:modelValue')).toEqual([['abcd']])
    expect(el.value).toBe('abc')
  })

  it('a form reset leaves the input on its model', async () => {
    const { form, w, el } = inForm({ modelValue: 'Ann', name: 'who' })
    // The default a reset goes back to: server markup, or empty in a browser.
    el.defaultValue = 'Bob'
    form.reset()
    expect(el.value).toBe('Bob')
    await new Promise((r) => setTimeout(r))
    expect(el.value).toBe('Ann')
    w.unmount()
    form.remove()
  })

  it('in a form it sends its value under its name', () => {
    const { form, w } = inForm({ modelValue: '12.50', name: 'price', numeric: true })
    expect(new FormData(form).get('price')).toBe('12.50')
    w.unmount()
    form.remove()
  })

  it('a numeric model that is a number does not throw and reads as its text', async () => {
    const w = mount(UiInput, {
      props: { ...base, modelValue: 12 as unknown as string, numeric: true, step: 1 },
    })
    expect((w.find('input').element as HTMLInputElement).value).toBe('12')
    await w.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(w.emitted('update:modelValue')).toEqual([['13']])
  })
})

describe('UiInput — review follow-ups, keys and buttons', () => {
  it('Escape and the arrow keys during an IME composition do nothing', async () => {
    const search = mount(UiInput, { props: { ...base, type: 'search', modelValue: 'inv' } })
    await search.find('input').trigger('compositionstart')
    await search.find('input').trigger('keydown', { key: 'Escape' })
    expect(search.emitted('update:modelValue')).toBeUndefined()
    const n = mount(UiInput, { props: { ...base, modelValue: '5', numeric: true, step: 1 } })
    await n.find('input').trigger('keydown', { key: 'ArrowUp', isComposing: true })
    expect(n.emitted('update:modelValue')).toBeUndefined()
  })

  it('pressing the eye with a pointer keeps the focus in the value', async () => {
    const w = mount(UiInput, {
      props: { ...base, type: 'password', modelValue: 'secret' },
      attachTo: document.body,
    })
    const eye = w.find('button[aria-pressed]')
    const point = new Event('pointerdown', { bubbles: true, cancelable: true })
    eye.element.dispatchEvent(point)
    expect(point.defaultPrevented).toBe(false)
    const down = new Event('mousedown', { bubbles: true, cancelable: true })
    eye.element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('the eye keeps the caret where it was', async () => {
    const w = mount(UiInput, {
      props: { ...base, type: 'password', modelValue: 'secret' },
      attachTo: document.body,
    })
    const el = w.find('input').element as HTMLInputElement
    // Vue drops a click in the millisecond its listener was attached (`_vts`): wait it out.
    await new Promise((r) => setTimeout(r, 2))
    el.focus()
    el.setSelectionRange(6, 6)
    ;(w.find('button[aria-pressed]').element as HTMLButtonElement).click()
    // A browser resets the caret when the type changes; the engine here does not, so it is done by hand.
    el.setSelectionRange(0, 0)
    await nextTick()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect([el.selectionStart, el.selectionEnd]).toEqual([6, 6])
    w.unmount()
  })

  it('a pasted formatted number is read the way it is written', async () => {
    const cases: [string, string][] = [
      ['1,234.56', '1234.56'],
      ['1.234,56', '1234.56'],
      ['1\u00a0234', '1234'],
    ]
    for (const [typed, read] of cases) {
      const w = mount(UiInput, { props: { ...base, numeric: true } })
      ;(w.find('input').element as HTMLInputElement).value = typed
      await w.find('input').trigger('input')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([read])
    }
  })

  it('ArrowUp at max and ArrowDown at min emit nothing', async () => {
    const top = mount(UiInput, {
      props: { ...base, modelValue: '5', numeric: true, step: 1, max: 5 },
    })
    await top.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(top.emitted('update:modelValue')).toBeUndefined()
    const over = mount(UiInput, {
      props: { ...base, modelValue: '10', numeric: true, step: 1, max: 5 },
    })
    await over.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(over.emitted('update:modelValue')).toBeUndefined()
    const bottom = mount(UiInput, {
      props: { ...base, modelValue: '0', numeric: true, step: 1, min: 0 },
    })
    await bottom.find('input').trigger('keydown', { key: 'ArrowDown' })
    expect(bottom.emitted('update:modelValue')).toBeUndefined()
  })

  it('a disabled invalid capsule keeps the disabled plate without the invalid mark', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toContain(':root .ui-capsule[data-invalid]:not(:has(:disabled)) {')
    expect(css).not.toMatch(/:root \.ui-capsule\[data-invalid\] \{/)
  })

  it('warns in dev when it has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiInput, { props: { modelValue: '' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiInput has no name'))
    warn.mockClear()
    mount(UiInput, { props: base })
    mount(UiField, {
      props: { label: 'Email' },
      slots: { default: () => h(UiInput, { modelValue: '' }) },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('an input marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiField, { label: 'Email', error: 'Enter an address with @' }, () =>
              h(UiInput, { modelValue: 'ann.work' }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})

describe('UiInput — numbers in the app locale', () => {
  const numberIn = (locale: string, modelValue = '') => {
    const w = mount(UiInput, {
      props: {
        ...base,
        modelValue,
        numeric: true,
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale }) },
      attachTo: document.body,
    })
    return w
  }
  const put = async (
    w: ReturnType<typeof numberIn>,
    value: string,
    inputType = 'insertFromPaste',
  ) => {
    const el = w.find('input').element as HTMLInputElement
    el.value = value
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType }))
    await nextTick()
    await nextTick()
  }
  const shown = (w: ReturnType<typeof numberIn>) =>
    (w.find('input').element as HTMLInputElement).value
  const invalid = (w: ReturnType<typeof numberIn>) => w.find('input').attributes('aria-invalid')

  it('a paste drops the grouping marks of the locale and keeps the magnitude', async () => {
    const cases: [string, string, string][] = [
      ['en', '1,234', '1234'],
      ['en', '1,234.5', '1234.5'],
      ['en', '1,234,567', '1234567'],
      ['en', '1.234', '1.234'],
      ['de-DE', '1.234', '1234'],
      ['de-DE', '1.234,5', '1234.5'],
      ['ru', '1\u00a0234,5', '1234.5'],
      ['ru', '1 234,5', '1234.5'],
      ['en', '\u0661\u0662\u0663\u0664', '1234'],
    ]
    for (const [locale, pasted, read] of cases) {
      const w = numberIn(locale)
      await put(w, pasted)
      expect([locale, pasted, w.emitted('update:modelValue')?.at(-1)]).toEqual([
        locale,
        pasted,
        [read],
      ])
      expect(invalid(w)).toBeUndefined()
      w.unmount()
    }
  })

  it('a paste the locale cannot read for sure is kept as written and marked invalid', async () => {
    const cases: [string, string][] = [
      ['en', '1,23'],
      ['en', '12,5'],
      ['de-DE', '1,234,567'],
      ['ru', '1,2,3'],
      ['ru', '1.234'],
    ]
    for (const [locale, pasted] of cases) {
      const w = numberIn(locale)
      await put(w, pasted)
      expect([locale, w.emitted('update:modelValue')?.at(-1), shown(w), invalid(w)]).toEqual([
        locale,
        [pasted],
        pasted,
        'true',
      ])
      w.unmount()
    }
  })

  it('typing keeps the marks as typed; the field is read on blur', async () => {
    const w = numberIn('en')
    for (const typed of ['1', '1,', '1,2', '1,23', '1,234', '1,234.', '1,234.5']) {
      await put(w, typed, 'insertText')
      expect(shown(w)).toBe(typed)
      expect(invalid(w)).toBeUndefined()
    }
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1234.5'])
    await w.find('input').trigger('blur')
    expect(shown(w)).toBe('1234.5')
    await put(w, '1,2', 'insertText')
    expect(invalid(w)).toBeUndefined()
    await w.find('input').trigger('blur')
    expect([shown(w), invalid(w)]).toEqual(['1,2', 'true'])
    w.unmount()
  })

  it('the field tells the app when the model holds text the locale cannot read for sure, and when it no longer does', async () => {
    // In Russian 2,500 is two and a half and 2.500 is unsure, yet both reach the model as 2.500:
    // only the field knows which one the person wrote.
    const w = numberIn('ru')
    await put(w, '2,500')
    expect([w.emitted('update:modelValue')?.at(-1), w.emitted('unsure')]).toEqual([
      ['2.500'],
      [[false]],
    ])
    await put(w, '2.500')
    expect([w.emitted('update:modelValue')?.at(-1), invalid(w)]).toEqual([['2.500'], 'true'])
    expect(w.emitted('unsure')).toEqual([[false], [true]])
    await put(w, '2,5')
    expect([invalid(w), w.emitted('unsure')]).toEqual([undefined, [[false], [true], [false]]])
    w.unmount()
  })

  it('while a number is typed the app hears unsure at once, and the red mark waits for blur', async () => {
    const w = numberIn('en')
    await put(w, '1,2', 'insertText')
    expect([w.emitted('update:modelValue')?.at(-1), invalid(w)]).toEqual([['1,2'], undefined])
    expect(w.emitted('unsure')).toEqual([[false], [true]])
    await put(w, '1,234', 'insertText')
    expect(w.emitted('unsure')).toEqual([[false], [true], [false]])
    await put(w, '1,23', 'insertText')
    await w.find('input').trigger('blur')
    expect([invalid(w), w.emitted('unsure')]).toEqual(['true', [[false], [true], [false], [true]]])
    w.unmount()
  })

  it('a number field tells the app on mount whether its model is sure; a text field never does', () => {
    const odd = numberIn('en', 'abc')
    expect(odd.emitted('unsure')).toEqual([[true]])
    odd.unmount()
    const sure = numberIn('en', '1234.5')
    expect(sure.emitted('unsure')).toEqual([[false]])
    sure.unmount()
    const text = mount(UiInput, { props: { ...base, modelValue: '1,23' } })
    expect(text.emitted('unsure')).toBeUndefined()
  })

  it('a number field mounted again over a reset model clears the app flag the last one left', async () => {
    // A window whose body unmounts on close: typed text the locale cannot read, then closed, then
    // opened again with the model reset; the app's flag must not stay up over a sure, empty field.
    const host = defineComponent({
      setup() {
        const state = { open: ref(true), model: ref<string | null>(null), flag: ref(false) }
        return { ...state }
      },
      render() {
        return this.open
          ? h(UiInput, {
              numeric: true,
              ariaLabel: 'Price',
              modelValue: this.model,
              'onUpdate:modelValue': (v: string | null) => (this.model = v),
              onUnsure: (u: boolean) => (this.flag = u),
            })
          : null
      },
    })
    const w = mount(host, { attachTo: document.body })
    const el = w.find('input').element as HTMLInputElement
    el.value = 'abc'
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    await nextTick()
    await nextTick()
    expect(w.vm.flag).toBe(true)
    w.vm.open = false
    await nextTick()
    w.vm.model = null
    w.vm.open = true
    await nextTick()
    expect(w.vm.flag).toBe(false)
    w.unmount()
  })

  it('a German value shows its comma and keeps its meaning when edited again', async () => {
    const w = numberIn('de-DE', '1234.5')
    expect(shown(w)).toBe('1234,5')
    await put(w, '1234,56', 'insertText')
    await w.find('input').trigger('blur')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1234.56'])
    expect([shown(w), invalid(w)]).toEqual(['1234,56', undefined])
    w.unmount()
  })

  it('the arrows do not move an unsure value', async () => {
    const w = mount(UiInput, {
      props: { ...base, numeric: true, step: 1, modelValue: '1,2' },
      global: { plugins: withGrani({ locale: 'en' }) },
    })
    await w.find('input').trigger('keydown', { key: 'ArrowUp' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('UiInput — a search on its way', () => {
  it('loading turns the cross into its spinner, says busy, and clearing waits', async () => {
    const w = mount(UiInput, {
      props: { modelValue: 'invoi', type: 'search', loading: true, ariaLabel: 'Search' },
    })
    // The same button, so a focus on it stays; it refuses the press until the results come.
    const cross = w.find('button[aria-label="Clear"]')
    expect(cross.attributes('aria-busy')).toBe('true')
    expect(cross.findComponent({ name: 'UiSpinner' }).exists()).toBe(true)
    expect(w.find('input').attributes('aria-busy')).toBe('true')
    await cross.trigger('click')
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await w.setProps({ loading: false })
    expect(w.find('input').attributes('aria-busy')).toBeUndefined()
  })
})

// A chord with Alt, Ctrl or Meta is the browser's: Alt with ← goes back a page, Ctrl or ⌘ moves a
// caret or scrolls. The component takes the key only alone.
const chord = (el: Element, key: string, mods: Partial<KeyboardEventInit>) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  el.dispatchEvent(e)
  return e
}

describe('UiInput — a chord is the browser’s', () => {
  it('a numeric field steps on an arrow alone; with Alt, Ctrl or Meta the caret is the browser’s', async () => {
    const w = mount(UiInput, {
      props: { ...base, numeric: true, step: 0.1, modelValue: '10' },
      global: { plugins: withGrani() },
    })
    const input = w.find('input').element
    for (const mods of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      expect(chord(input, 'ArrowUp', mods).defaultPrevented).toBe(false)
    }
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('UiInput — review follow-ups', () => {
  const owned = (props: Record<string, unknown>, locale = 'en') => {
    const w = mount(UiInput, {
      props: {
        ...base,
        ...props,
        'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      },
      global: { plugins: withGrani({ locale }) },
      attachTo: document.body,
    })
    return w
  }
  const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
    el.dispatchEvent(e)
    return e
  }
  const settle = async () => {
    for (let i = 0; i < 3; i++) await nextTick()
  }

  it('Escape in a search whose results are on their way goes no further and clears nothing', () => {
    const w = mount(UiInput, {
      props: { ...base, modelValue: 'inv', type: 'search', loading: true },
      attachTo: document.body,
    })
    const outer = vi.fn()
    w.element.parentElement!.addEventListener('keydown', outer)
    const e = key(w.find('input').element, 'Escape')
    // Not prevented, the browser empties a search field itself, and the window around it closes.
    expect(e.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('an arrow stops at a bound off the step grid, by key and by button', async () => {
    const cases = [
      {
        props: { step: 1, min: 0.01, modelValue: '1' },
        key: 'ArrowDown',
        inRange: (n: number) => n >= 0.01,
      },
      {
        props: { step: 1, max: 2.5, modelValue: '2' },
        key: 'ArrowUp',
        inRange: (n: number) => n <= 2.5,
      },
      {
        props: { step: 0.1, max: 99.95, modelValue: '99.9' },
        key: '',
        inRange: (n: number) => n <= 99.95,
      },
    ]
    for (const c of cases) {
      const w = owned({ numeric: true, ...c.props })
      if (c.key) key(w.find('input').element, c.key)
      else await w.findAll('button[tabindex="-1"]')[0]!.trigger('click')
      await settle()
      const last = w.emitted('update:modelValue')?.at(-1)?.[0]
      expect(c.inRange(Number(last)), `${JSON.stringify(c.props)} sent ${String(last)}`).toBe(true)
      w.unmount()
    }
  })

  it('a step keeps the caret where it was', async () => {
    const w = owned({ numeric: true, step: 0.1, modelValue: '12.5' })
    const el = w.find('input').element as HTMLInputElement
    el.focus()
    el.setSelectionRange(1, 1)
    key(el, 'ArrowUp')
    await settle()
    expect(el.value).toBe('12.6')
    expect([el.selectionStart, el.selectionEnd]).toEqual([1, 1])
    w.unmount()
  })

  it('the cross turning into the spinner keeps the focus in the field', async () => {
    const w = mount(UiInput, {
      props: { ...base, modelValue: 'inv', type: 'search' },
      attachTo: document.body,
    })
    const cross = w.find('button[aria-label="Clear"]').element as HTMLButtonElement
    cross.focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).not.toBe(document.body)
    expect(w.element.contains(document.activeElement)).toBe(true)
    w.unmount()
  })

  it('the search says it is busy from a status region that was there before the wait', async () => {
    const w = mount(UiInput, { props: { ...base, modelValue: 'inv', type: 'search' } })
    const region = () => w.find('[role="status"]')
    expect(region().exists()).toBe(true)
    expect(region().text()).toBe('')
    await w.setProps({ loading: true })
    expect(region().text()).toBe('Searching')
  })

  it('only a search carries the status region: a field that never waits says nothing', () => {
    expect(mount(UiInput, { props: base }).find('[role="status"]').exists()).toBe(false)
    expect(
      mount(UiInput, { props: { ...base, numeric: true, modelValue: null } })
        .find('[role="status"]')
        .exists(),
    ).toBe(false)
  })

  it('text with no digit in a number field is marked invalid on blur', async () => {
    for (const text of ['abc', 'Infinity', '-']) {
      const w = owned({ numeric: true, modelValue: '' })
      const el = w.find('input').element as HTMLInputElement
      el.value = text
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
      await nextTick()
      await w.find('input').trigger('blur')
      await nextTick()
      expect(w.find('input').attributes('aria-invalid'), text).toBe('true')
      w.unmount()
    }
  })

  it('a step writes plain digits, never an exponent, and keeps the cents it was written with', async () => {
    const tiny = owned({ numeric: true, step: 1e-8, modelValue: '' })
    key(tiny.find('input').element, 'ArrowUp')
    await settle()
    expect(String(tiny.emitted('update:modelValue')?.at(-1)?.[0])).toBe('0.00000001')
    tiny.unmount()
    const money = owned({ numeric: true, step: 0.1, modelValue: '10.99' })
    key(money.find('input').element, 'ArrowUp')
    await settle()
    expect(money.emitted('update:modelValue')?.at(-1)?.[0]).toBe('11.00')
    money.unmount()
  })

  it('Shift with an arrow selects, as the browser does: no step', () => {
    const w = owned({ numeric: true, step: 1, modelValue: '5' })
    const e = key(w.find('input').element, 'ArrowUp', { shiftKey: true })
    expect(e.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('Enter settles the number before the form is sent, in the same task', () => {
    const w = owned({ numeric: true, modelValue: '' })
    const el = w.find('input').element as HTMLInputElement
    el.value = '1,234.50'
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    key(el, 'Enter')
    // No await: an engine that sends the form in the same task must already see the settled text.
    expect(el.value).toBe('1234.50')
    w.unmount()
  })

  it('in a comma locale a native form gets the number as the field shows it, 12,5', () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiInput, {
      attachTo: form,
      props: { ...base, numeric: true, name: 'price', modelValue: '12.5' },
      global: { plugins: withGrani({ locale: 'ru' }) },
    })
    expect(new FormData(form).get('price')).toBe('12,5')
    w.unmount()
    form.remove()
  })

  it('the arrows are named by the field: Increase Name, Decrease Name', () => {
    const w = mount(UiInput, {
      props: { ...base, numeric: true, step: 1, modelValue: '1' },
      attachTo: document.body,
    })
    const named = (b: Element) =>
      (b.getAttribute('aria-labelledby') ?? '')
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .join(' ') || b.getAttribute('aria-label')
    const [up, down] = w.findAll('button[tabindex="-1"]').map((b) => b.element)
    expect(named(up!)).toBe('Increase Name')
    expect(named(down!)).toBe('Decrease Name')
    w.unmount()
  })
})
