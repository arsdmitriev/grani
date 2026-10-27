import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import UiField from './UiField.vue'
import UiCodeInput from './UiCodeInput.vue'
import { focusInvalid } from '../utils/focusInvalid'

const base = { modelValue: '' }
const cells = (w: ReturnType<typeof mount>) => w.findAll('.ui-code-cell')

describe('UiCodeInput — one input, many cells', () => {
  it('draws one cell per character and one real input that holds the value', () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' } })
    expect(cells(w)).toHaveLength(6)
    expect(cells(w).map((c) => c.text())).toEqual(['1', '2', '', '', '', ''])
    expect(w.findAll('input')).toHaveLength(1)
    const input = w.find('input')
    expect(input.attributes()).toMatchObject({
      inputmode: 'numeric',
      autocomplete: 'one-time-code',
      spellcheck: 'false',
      autocapitalize: 'off',
      autocorrect: 'off',
    })
    expect(input.attributes('maxlength')).toBeUndefined()
    expect(w.find(`#${input.attributes('aria-describedby')}`).text()).toBe(
      'Enter a 6-character code.',
    )
    expect(input.attributes('aria-label')).toBeUndefined()
    expect(
      mount(UiCodeInput, { props: { ...base, ariaLabel: 'Code' } })
        .find('input')
        .attributes('aria-label'),
    ).toBe('Code')
    expect((input.element as HTMLInputElement).value).toBe('12')
  })

  it('keeps only allowed characters and cuts at the length; complete fires when full', async () => {
    const w = mount(UiCodeInput, {
      props: { ...base, 'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }) },
    })
    await w.find('input').setValue('12a3')
    expect(w.emitted('update:modelValue')).toEqual([['123']])
    expect(w.emitted('complete')).toBeUndefined()
    await w.find('input').setValue('1234567')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['123456'])
    expect(w.emitted('complete')).toEqual([['123456']])
    expect((w.find('input').element as HTMLInputElement).value).toBe('123456')
  })

  it('text mode takes letters and digits and asks for the text keyboard; pattern narrows further', async () => {
    const text = mount(UiCodeInput, { props: { ...base, inputMode: 'text', length: 4 } })
    expect(text.find('input').attributes('inputmode')).toBe('text')
    await text.find('input').setValue('a-b1!')
    expect(text.emitted('update:modelValue')).toEqual([['ab1']])
    const hex = mount(UiCodeInput, { props: { ...base, inputMode: 'text', pattern: '[0-9a-f]' } })
    await hex.find('input').setValue('xf9z')
    expect(hex.emitted('update:modelValue')).toEqual([['f9']])
  })

  it('the cell for the next character is marked; a full code marks the last one', async () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' } })
    // The ring and the caret are drawn by CSS under `:focus-within` on the root.
    expect(w.classes()).toContain('ui-code')
    expect(cells(w)[2]!.attributes('data-next')).toBe('true')
    expect(cells(w)[2]!.find('.ui-caret').exists()).toBe(true)
    expect(cells(w)[1]!.find('.ui-caret').exists()).toBe(false)
    await w.setProps({ modelValue: '123456' })
    expect(cells(w)[5]!.attributes('data-next')).toBe('true')
    expect(w.find('.ui-caret').exists()).toBe(false)
  })

  it('a click puts the caret at the end; arrows and Home do not move it', async () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' }, attachTo: document.body })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    await w.find('input').trigger('click')
    expect(input.selectionStart).toBe(2)
    for (const key of ['ArrowLeft', 'Home']) {
      const ev = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true })
      input.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
    }
    w.unmount()
  })

  it('a pasted SMS keeps the code inside it', async () => {
    const w = mount(UiCodeInput, { props: base })
    await w.find('input').setValue('Your code is 482911, do not share it.')
    expect(w.emitted('update:modelValue')).toEqual([['482911']])
    expect(w.emitted('complete')).toEqual([['482911']])
  })

  it('a global pattern does not skip every other character', async () => {
    const w = mount(UiCodeInput, { props: { ...base, pattern: /[0-9]/g } })
    await w.find('input').setValue('1234')
    expect(w.emitted('update:modelValue')).toEqual([['1234']])
  })

  it('nothing is emitted mid-composition; the end of it is', async () => {
    const w = mount(UiCodeInput, { props: base })
    const input = w.find('input')
    await input.trigger('compositionstart')
    ;(input.element as HTMLInputElement).value = '１２'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    ;(input.element as HTMLInputElement).value = '12'
    await input.trigger('compositionend')
    expect(w.emitted('update:modelValue')).toEqual([['12']])
  })
})

describe('UiCodeInput — states', () => {
  it('cells stand on the control ladder, md by default', () => {
    expect(cells(mount(UiCodeInput, { props: base }))[0]!.classes()).toContain('h-11')
    expect(cells(mount(UiCodeInput, { props: { ...base, size: 'sm' } }))[0]!.classes()).toContain(
      'h-9',
    )
    expect(cells(mount(UiCodeInput, { props: { ...base, size: 'xs' } }))[0]!.classes()).toContain(
      'h-7',
    )
  })

  it('separator draws a rule between the halves', () => {
    const w = mount(UiCodeInput, { props: { ...base, separator: true } })
    const kids = w.element.children
    expect(kids[3].classList.contains('h-px')).toBe(true)
    expect(mount(UiCodeInput, { props: base }).find('.h-px').exists()).toBe(false)
  })

  it('disabled is inert with the muted chrome; invalid marks the cells and the input', () => {
    const off = mount(UiCodeInput, { props: { ...base, disabled: true } })
    expect((off.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(cells(off)[0]!.classes()).toContain('bg-disabled-bg')
    const bad = mount(UiCodeInput, { props: { ...base, invalid: true } })
    expect(cells(bad)[0]!.attributes('data-invalid')).toBe('true')
    expect(bad.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('exposes focus()', () => {
    const w = mount(UiCodeInput, { props: base, attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})

describe('UiCodeInput — inside UiField', () => {
  const Form = defineComponent({
    setup() {
      return () =>
        h(UiField, { label: 'Code from the app', required: true, error: 'Wrong code' }, () =>
          h(UiCodeInput, { modelValue: '' }),
        )
    },
  })

  it('the label points at the one input; error and required arrive', () => {
    const w = mount(Form)
    const input = w.find('input')
    expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-label')).toBeUndefined()
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')!.split(' ')).toContain(
      w.find('[role=alert]').attributes('id'),
    )
  })
})

describe('UiCodeInput — second review', () => {
  it('a value set from outside does not fire complete', async () => {
    const w = mount(UiCodeInput, { props: base })
    await w.setProps({ modelValue: '123456' })
    expect(w.emitted('complete')).toBeUndefined()
  })

  it('name reaches the input; a sticky pattern keeps every character', async () => {
    const w = mount(UiCodeInput, { props: { ...base, name: 'code', pattern: /[0-9]/y } })
    expect(w.find('input').attributes('name')).toBe('code')
    await w.find('input').setValue('1234')
    expect(w.emitted('update:modelValue')).toEqual([['1234']])
  })

  it('focus() does nothing on a disabled input', () => {
    const w = mount(UiCodeInput, { props: { ...base, disabled: true }, attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).not.toBe(w.find('input').element)
    w.unmount()
  })

  it('an odd length puts the separator after the larger half', () => {
    const w = mount(UiCodeInput, { props: { ...base, length: 5, separator: true } })
    const kids = [...w.element.children]
    expect(kids[3]!.classList.contains('h-px')).toBe(true)
  })
})

describe('UiCodeInput — review follow-ups', () => {
  it('an over-length value from outside is clamped to length in the real input, not only in the cells', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '12345678', name: 'code' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('123456')
    await w.setProps({ length: 4 })
    expect((w.find('input').element as HTMLInputElement).value).toBe('1234')
    expect(cells(w)).toHaveLength(4)
  })

  it('complete fires again after a completed code is edited and filled anew', async () => {
    const w = mount(UiCodeInput, {
      props: {
        modelValue: '',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
      },
    })
    const input = w.find('input')
    await input.setValue('123456')
    await input.setValue('12345')
    await input.setValue('123457')
    expect(w.emitted('complete')).toEqual([['123456'], ['123457']])
  })

  it('a re-render while an IME composes does not write the model back over the characters', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '12' } })
    const input = w.find('input')
    const el = input.element as HTMLInputElement
    await input.trigger('compositionstart')
    el.value = '12あ'
    await input.trigger('input')
    await w.setProps({ invalid: true })
    expect(el.value).toBe('12あ')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a cell stops its corner at a third of its side, so a soft product never turns the cells into bubbles', () => {
    const w = mount(UiCodeInput, { props: { modelValue: '' } })
    expect(w.html()).toContain('rounded-[min(var(--radius-control),33%)]')
  })

  const controlled = (props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => {
    const w = mount(UiCodeInput, {
      ...opts,
      props: {
        modelValue: '',
        ariaLabel: 'Code',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
        ...props,
      },
    })
    return w
  }

  it('caller aria-invalid and aria-required reach the input when the component has none of its own', () => {
    const w = mount(UiCodeInput, {
      props: { modelValue: '', ariaLabel: 'Code' },
      attrs: { 'aria-invalid': 'true', 'aria-required': 'true' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
  })

  it('a change the parent refuses puts the input back on the model', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '1234', length: 4, ariaLabel: 'Code' } })
    const input = w.find('input').element as HTMLInputElement
    input.value = '123'
    await w.find('input').trigger('input')
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toEqual([['123']])
    expect(input.value).toBe('1234')
    expect(cells(w).map((c) => c.text())).toEqual(['1', '2', '3', '4'])
  })

  it('Backspace takes the last character and the next cell moves back', async () => {
    const w = controlled({ modelValue: '123' })
    await w.find('input').setValue('12')
    expect(w.props('modelValue')).toBe('12')
    expect(cells(w)[2]!.attributes('data-next')).toBeDefined()
  })

  it('in a form it sends the code under its name', () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiCodeInput, {
      attachTo: form,
      props: { modelValue: '482913', name: 'otp', ariaLabel: 'Code' },
    })
    expect(new FormData(form).get('otp')).toBe('482913')
    w.unmount()
    form.remove()
  })

  it('a form reset leaves the input on its model, cells and DOM agreeing', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiCodeInput, {
      attachTo: form,
      props: { modelValue: '12', name: 'otp', ariaLabel: 'Code' },
    })
    const input = w.find('input').element as HTMLInputElement
    // The default a reset goes back to: server markup, or empty in a browser.
    input.defaultValue = '9'
    form.reset()
    expect(input.value).toBe('9')
    await new Promise((r) => setTimeout(r))
    expect(input.value).toBe('12')
    expect(new FormData(form).get('otp')).toBe('12')
    w.unmount()
    form.remove()
  })

  it('a click keeps a selection of the whole code; a click on a caret moves it to the end', async () => {
    const w = mount(UiCodeInput, {
      attachTo: document.body,
      props: { modelValue: '123456', ariaLabel: 'Code' },
    })
    const input = w.find('input').element as HTMLInputElement
    input.setSelectionRange(0, 6)
    await w.find('input').trigger('click')
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6])
    input.setSelectionRange(2, 2)
    await w.find('input').trigger('click')
    expect([input.selectionStart, input.selectionEnd]).toEqual([6, 6])
    w.unmount()
  })

  it('the hover border is drawn from the root, since the input covers the cells', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(/\.ui-code:hover \.ui-code-cell:not\(\[data-invalid\], \[data-disabled\]\)/)
    const off = mount(UiCodeInput, { props: { modelValue: '', disabled: true, ariaLabel: 'Code' } })
    expect(cells(off)[0]!.attributes('data-disabled')).toBeDefined()
  })

  it('typing at a full code fires nothing when the model was over length', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '1234567', ariaLabel: 'Code' } })
    await w.find('input').setValue('1234569')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('complete')).toBeUndefined()
  })

  it('a value from outside is filtered like a typed one', () => {
    const w = mount(UiCodeInput, {
      props: { modelValue: 'ab12c3', name: 'otp', ariaLabel: 'Code' },
    })
    expect(cells(w).map((c) => c.text())).toEqual(['1', '2', '3', '', '', ''])
    expect((w.find('input').element as HTMLInputElement).value).toBe('123')
  })

  it("a caller's autocomplete replaces the one-time-code default", () => {
    const w = mount(UiCodeInput, {
      props: { modelValue: '', ariaLabel: 'Recovery code' },
      attrs: { autocomplete: 'off' },
    })
    expect(w.find('input').attributes('autocomplete')).toBe('off')
  })

  it('warns in dev when it would render with no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCodeInput, { props: { modelValue: '' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockClear()
    mount(UiCodeInput, { props: { modelValue: '', ariaLabel: 'Code' } })
    mount(UiField, {
      props: { label: 'Code' },
      slots: { default: () => h(UiCodeInput, { modelValue: '' }) },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('cells carry the ink token', () => {
    const w = mount(UiCodeInput, { props: { modelValue: '1', ariaLabel: 'Code' } })
    expect(cells(w)[0]!.classes()).toContain('text-fg')
    const off = mount(UiCodeInput, {
      props: { modelValue: '1', disabled: true, ariaLabel: 'Code' },
    })
    expect(cells(off)[0]!.classes()).not.toContain('text-fg')
  })

  it('a code marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiField, { label: 'Code', error: 'That code is not right' }, () =>
              h(UiCodeInput, { modelValue: '111111' }),
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

describe('UiCodeInput — a chord is the browser’s', () => {
  it('Alt with an arrow goes to the browser (back a page); ⌘ or Ctrl with one keeps the caret at the end', () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' } })
    const input = w.find('input').element
    const send = (chord: KeyboardEventInit) => {
      const e = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
        ...chord,
      })
      input.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(send({ altKey: true })).toBe(false)
    expect(send({ metaKey: true })).toBe(true)
    expect(send({ ctrlKey: true })).toBe(true)
  })

  // On a Mac, Alt with an arrow is a word jump in a text box, not back a page: the key stays the
  // browser's, and the caret it moved goes back to the end of the code.
  it('a caret Alt with an arrow moved (a word jump on a Mac) comes back to the end', async () => {
    const w = mount(UiCodeInput, {
      attachTo: document.body,
      props: { ...base, modelValue: '1234' },
    })
    const input = w.find('input').element
    input.focus()
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        altKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    input.setSelectionRange(0, 0)
    await new Promise((r) => setTimeout(r))
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 4])
    w.unmount()
  })
})

describe('UiCodeInput — review follow-ups', () => {
  it('a caret moved by a key it does not hold: the next character still lands at the end', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '123' }, attachTo: document.body })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    const typed = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: '9',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(typed)
    expect(typed.defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')).toEqual([['1239']])
    w.unmount()
  })

  it('Backspace with the caret moved to the start sends it back to the end first', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '123' }, attachTo: document.body })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3])
    w.unmount()
  })

  it('a caret moved away: Backspace still takes the last character', async () => {
    const w = mount(UiCodeInput, { props: { modelValue: '123' }, attachTo: document.body })
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    input.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'deleteContentBackward',
        bubbles: true,
        cancelable: true,
      }),
    )
    expect(w.emitted('update:modelValue')).toEqual([['12']])
    w.unmount()
  })

  it('a pattern of characters beyond the basic plane keeps them whole', async () => {
    const w = mount(UiCodeInput, {
      props: { ...base, length: 3, pattern: /\p{Extended_Pictographic}/u, inputMode: 'text' },
    })
    // A face (U+1F600) is one character in two UTF-16 units.
    const face = '\u{1F600}'
    await w.find('input').setValue(face.repeat(4))
    expect(w.emitted('update:modelValue')).toEqual([[face.repeat(3)]])
    expect(w.emitted('complete')).toEqual([[face.repeat(3)]])
  })
})

describe('UiCodeInput — a code pasted over another', () => {
  const paste = (input: HTMLInputElement, text: string) => {
    const e = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } })
    input.dispatchEvent(e)
    return e
  }

  it('a whole code pasted after a few typed characters takes their place, and completes as itself', async () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' } })
    const input = w.find('input').element as HTMLInputElement
    expect(paste(input, 'Your code is 482911').defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')).toEqual([['482911']])
    expect(w.emitted('complete')).toEqual([['482911']])
  })

  it('a part of a code pasted goes on from what is typed, as the browser puts it', () => {
    const w = mount(UiCodeInput, { props: { ...base, modelValue: '12' } })
    const input = w.find('input').element as HTMLInputElement
    expect(paste(input, '34').defaultPrevented).toBe(false)
  })
})

describe('UiCodeInput — review follow-ups', () => {
  // A length from a config reaches the loop that draws the cells: a number no code has is held
  // to what the render can draw, and said in development.
  it.each([
    { asked: 'Infinity', length: Number.POSITIVE_INFINITY, drawn: 100 },
    { asked: '1000', length: 1000, drawn: 100 },
    { asked: 'NaN', length: Number.NaN, drawn: 1 },
    { asked: '-4', length: -4, drawn: 1 },
    { asked: '4.9', length: 4.9, drawn: 4 },
  ])('a length of $asked draws $drawn cells and warns, not throws', ({ length, drawn }) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      let w!: ReturnType<typeof mount>
      expect(() => {
        w = mount(UiCodeInput, { props: { ...base, length, ariaLabel: 'Code' } })
      }).not.toThrow()
      expect(cells(w)).toHaveLength(drawn)
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('a code of the cap completes at the cap, not at the length asked for', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mount(UiCodeInput, {
        props: { ...base, length: Number.POSITIVE_INFINITY, ariaLabel: 'Code' },
      })
      await w.find('input').setValue('7'.repeat(150))
      expect(w.emitted('update:modelValue')).toEqual([['7'.repeat(100)]])
      expect(w.emitted('complete')).toEqual([['7'.repeat(100)]])
    } finally {
      warn.mockRestore()
    }
  })
})
