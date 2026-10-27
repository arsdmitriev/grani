import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { h } from 'vue'
import { focusInvalid } from '../utils/focusInvalid'
import UiField from './UiField.vue'
import UiSwitch from './UiSwitch.vue'

describe('UiSwitch', () => {
  it('is a switch that announces its state and toggles on click', async () => {
    const w = mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'Notify' } })
    const btn = w.find('button')
    expect(btn.attributes('role')).toBe('switch')
    expect(btn.attributes('aria-checked')).toBe('false')
    expect(btn.attributes('type')).toBe('button')
    await btn.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('a label in the slot wraps the control, so clicking the text toggles too', async () => {
    const w = mount(UiSwitch, { props: { modelValue: true }, slots: { default: 'Weekly summary' } })
    expect(w.element.tagName).toBe('LABEL')
    expect(w.text()).toBe('Weekly summary')
    await w.find('label > span').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[false]])
  })

  it('on is the brand fill with the thumb moved; off is the control chrome', () => {
    const on = mount(UiSwitch, { props: { modelValue: true, ariaLabel: 'A' } })
    expect(on.find('button').classes()).toContain('bg-brand-solid')
    expect(on.find('button > span').classes()).toContain('translate-x-4')
    const off = mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'A' } })
    expect(off.find('button').classes()).toContain('bg-border-strong')
    expect(
      off
        .find('button')
        .classes()
        .some((c) => /^border(-|$)/.test(c)),
    ).toBe(false)
    expect(off.find('button > span').classes()).toContain('translate-x-0')
  })

  it('disabled neither toggles nor emits, and wears the disabled plate', async () => {
    const w = mount(UiSwitch, { props: { modelValue: false, disabled: true, ariaLabel: 'A' } })
    expect(w.find('button').attributes('disabled')).toBeDefined()
    expect(w.find('button').classes()).toContain('bg-border-strong/40')
    await w.find('button').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('two sizes: 20px and 24px tracks', () => {
    expect(
      mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'A' } })
        .find('button')
        .classes(),
    ).toContain('h-5')
    expect(
      mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'A', size: 'md' } })
        .find('button')
        .classes(),
    ).toContain('h-6')
  })

  it('inside UiField it is named by the field label and described by the field', () => {
    const w = mount(UiField, {
      props: { label: 'Notifications', description: 'Every Monday' },
      slots: { default: () => h(UiSwitch, { modelValue: false }) },
    })
    const btn = w.find('button')
    expect(btn.attributes('id')).toBe(w.find('label').attributes('for'))
    expect(btn.attributes('aria-labelledby')).toBe(w.find('label').attributes('id'))
    expect(btn.attributes('aria-describedby')).toBe(w.find('p').attributes('id'))
  })

  it('with its own text inside UiField it is named by that text, as UiCheckbox', () => {
    // The field label used to win and the visible switch text was never read.
    const w = mount(UiField, {
      props: { label: 'Notifications' },
      slots: { default: () => h(UiSwitch, { modelValue: false }, () => 'Send the digest') },
    })
    const btn = w.find('button')
    const own = btn.attributes('aria-labelledby')
    expect(own).not.toBe(w.find('label[for]').attributes('id'))
    expect(w.find(`[id="${own}"]`).text()).toBe('Send the digest')
  })
})

describe('UiSwitch — review follow-ups', () => {
  it('attributes land on the button whether or not a label wraps it; class on the root', () => {
    // With a slot, data-testid and aria-* used to land on the wrapping label.
    const labeled = mount(UiSwitch, {
      props: { modelValue: false },
      slots: { default: 'Email' },
      attrs: { 'data-testid': 'email', 'aria-describedby': 'hint', class: 'mt-2' },
    })
    const btn = labeled.find('[role="switch"]')
    expect(btn.attributes('data-testid')).toBe('email')
    expect(btn.attributes('aria-describedby')).toBe('hint')
    expect(labeled.find('label').classes()).toContain('mt-2')
    expect(labeled.find('label').attributes('data-testid')).toBeUndefined()
    const bare = mount(UiSwitch, {
      props: { modelValue: false, ariaLabel: 'Email' },
      attrs: { 'data-testid': 'email', class: 'mt-2' },
    })
    expect(bare.attributes('data-testid')).toBe('email')
    expect(bare.classes()).toEqual(expect.arrayContaining(['mt-2', 'rounded-pill']))
  })

  it('in a group field each switch keeps its own id', () => {
    const w = mount(UiField, {
      props: { label: 'Notify', group: true },
      slots: {
        default: () => [
          h(UiSwitch, { modelValue: false, id: 'email' }, () => 'Email'),
          h(UiSwitch, { modelValue: false, id: 'sms' }, () => 'SMS'),
        ],
      },
    })
    expect(w.findAll('[role="switch"]').map((b) => b.attributes('id'))).toEqual(['email', 'sms'])
  })

  it('loading keeps focus, says busy and does not toggle', async () => {
    const w = mount(UiSwitch, {
      attachTo: document.body,
      props: { modelValue: false, ariaLabel: 'Email' },
    })
    ;(w.element as HTMLButtonElement).focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(w.element)
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.attributes('disabled')).toBeUndefined()
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    // The thumb drops its fill; the spinner turns in its place, at its size, white.
    const thumb = w.find('.ui-switch-thumb')
    expect(thumb.classes()).toContain('bg-transparent')
    expect(thumb.classes()).not.toContain('bg-surface')
    expect(w.find('svg').classes()).toEqual(
      expect.arrayContaining(['h-full', 'w-full', 'text-surface', '[stroke-width:3]']),
    )
    w.unmount()
  })

  it('a disabled thumb takes the disabled ink, so on and off read apart', () => {
    const on = mount(UiSwitch, { props: { modelValue: true, disabled: true, ariaLabel: 'x' } })
    const thumb = on.find('.ui-switch-thumb')
    expect(thumb.classes()).toContain('bg-disabled-fg')
    expect(thumb.classes()).not.toContain('bg-surface')
    expect(thumb.classes()).toContain('translate-x-4')
  })

  it('the thumb is a shape token, mirrors under rtl, and casts no raw shadow', () => {
    const cls = mount(UiSwitch, { props: { modelValue: true, size: 'md', ariaLabel: 'x' } })
      .find('.ui-switch-thumb')
      .classes()
    expect(cls).toEqual(
      expect.arrayContaining(['rounded-pill', 'translate-x-5', 'rtl:-translate-x-5']),
    )
    expect(cls.some((c) => c.startsWith('shadow'))).toBe(false)
  })

  it('aria-checked stays set while the model is undefined, and says true when on', () => {
    expect(
      mount(UiSwitch, { props: { modelValue: undefined as never, ariaLabel: 'x' } }).attributes(
        'aria-checked',
      ),
    ).toBe('false')
    expect(
      mount(UiSwitch, { props: { modelValue: true, ariaLabel: 'x' } }).attributes('aria-checked'),
    ).toBe('true')
  })

  it('takes aria-invalid and aria-required from the field', () => {
    const w = mount(UiField, {
      props: { label: 'Terms', error: 'Accept them', required: true },
      slots: { default: () => h(UiSwitch, { modelValue: false }) },
    })
    const btn = w.find('[role="switch"]')
    expect(btn.attributes('aria-invalid')).toBe('true')
    expect(btn.attributes('aria-required')).toBe('true')
  })

  it('a disabled switch with a label does not toggle on a click on the text', async () => {
    const w = mount(UiSwitch, {
      attachTo: document.body,
      props: { modelValue: false, disabled: true },
      slots: { default: 'Email' },
    })
    ;(w.find('span[id]').element as HTMLElement).click()
    await w.find('[role="switch"]').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('label').classes()).toContain('cursor-not-allowed')
    w.unmount()
  })

  it('hover is gated on enabled:, the pointer too', () => {
    const cls = mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'x' } }).classes()
    for (const c of cls.filter((c) => c.includes('hover:'))) expect(c).toMatch(/^enabled:hover:/)
    expect(cls).toContain('enabled:cursor-pointer')
  })

  it('an invalid field puts a visible mark on the track, not aria-invalid alone', () => {
    const w = mount(UiField, {
      props: { label: 'Terms', error: 'Accept the terms' },
      slots: { default: () => h(UiSwitch, { modelValue: false }) },
    })
    const track = w.find('[role="switch"]')
    expect(track.attributes('aria-invalid')).toBe('true')
    expect(track.classes()).toContain('bg-danger-border')
    const standalone = mount(UiSwitch, {
      props: { modelValue: false, invalid: true, ariaLabel: 'Terms' },
    })
    expect(standalone.find('[role="switch"]').classes()).toContain('bg-danger-border')
    const on = mount(UiSwitch, { props: { modelValue: true, invalid: true, ariaLabel: 'Terms' } })
    expect(on.find('[role="switch"]').classes()).not.toContain('bg-danger-border')
  })

  it('warns in dev when it would render with no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiSwitch, { props: { modelValue: false } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockClear()
    mount(UiSwitch, { props: { modelValue: false, ariaLabel: 'Notify' } })
    mount(UiSwitch, { props: { modelValue: false }, slots: { default: 'Notify' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a wrapping label starts at the first line beside the track, as a checkbox', () => {
    const sm = mount(UiSwitch, { props: { modelValue: false }, slots: { default: 'A long label' } })
    expect(sm.find('label').classes()).toContain('items-start')
    const md = mount(UiSwitch, {
      props: { modelValue: false, size: 'md' },
      slots: { default: 'Long' },
    })
    expect(md.find('label > span').classes()).toContain('mt-0.5')
  })

  it('a change the parent refuses leaves the switch on the model', async () => {
    const w = mount(UiSwitch, {
      props: { modelValue: false, ariaLabel: 'Email', 'onUpdate:modelValue': () => {} },
    })
    await w.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[true]])
    expect(w.attributes('aria-checked')).toBe('false')
    expect(w.find('.ui-switch-thumb').classes()).toContain('translate-x-0')
  })

  it('in a form an on switch sends its value under its name and an off one sends nothing', async () => {
    const w = mount(
      {
        components: { UiSwitch },
        props: ['on', 'off'],
        template:
          '<form><UiSwitch :model-value="on" name="digest" aria-label="Digest" :disabled="off" /></form>',
      },
      { props: { on: true, off: false } },
    )
    const form = w.element as HTMLFormElement
    expect(new FormData(form).get('digest')).toBe('on')
    await w.setProps({ on: false })
    expect(new FormData(form).has('digest')).toBe(false)
    await w.setProps({ on: true, off: true })
    expect(new FormData(form).has('digest')).toBe(false)
    const valued = mount(UiSwitch, {
      props: { modelValue: true, name: 'digest', value: 'weekly' },
      slots: { default: 'Digest' },
    })
    expect(valued.find('input[type=hidden]').attributes('value')).toBe('weekly')
  })

  it('a form reset leaves the switch on its model', async () => {
    const w = mount(
      {
        components: { UiSwitch },
        template: '<form><UiSwitch :model-value="true" name="digest" aria-label="Digest" /></form>',
      },
      { attachTo: document.body },
    )
    const form = w.element as HTMLFormElement
    form.reset()
    await new Promise((r) => setTimeout(r))
    expect(new FormData(form).get('digest')).toBe('on')
    expect(w.find('[role=switch]').attributes('aria-checked')).toBe('true')
    w.unmount()
  })

  it('a switch marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      {
        components: { UiSwitch, UiField },
        template:
          '<div><input /><UiField label="Terms" error="Accept them"><UiSwitch :model-value="false" /></UiField></div>',
      },
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement?.getAttribute('role')).toBe('switch')
    w.unmount()
  })

  it('a disabled loading switch keeps a visible thumb under the spinner', () => {
    const w = mount(UiSwitch, {
      props: { modelValue: true, disabled: true, loading: true, ariaLabel: 'Email' },
    })
    const thumb = w.find('.ui-switch-thumb')
    expect(thumb.classes()).toContain('bg-disabled-fg')
    expect(thumb.classes()).not.toContain('bg-transparent')
    expect(thumb.find('svg').exists()).toBe(true)
  })

  it('a disabled invalid switch keeps the disabled plate', () => {
    const w = mount(UiSwitch, {
      props: { modelValue: false, disabled: true, invalid: true, ariaLabel: 'Terms' },
    })
    expect(w.classes()).toContain('bg-border-strong/40')
    expect(w.classes()).not.toContain('bg-danger-border')
  })

  it('a click handler of the caller does not run while loading', async () => {
    const save = vi.fn()
    const w = mount(UiSwitch, {
      props: { modelValue: false, ariaLabel: 'Email', loading: true },
      attrs: { onClick: save },
    })
    await w.trigger('click')
    expect(save).not.toHaveBeenCalled()
    await w.setProps({ loading: false })
    await w.trigger('click')
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('slot text and ariaLabel together emit one name', () => {
    const w = mount(UiSwitch, {
      props: { modelValue: false, ariaLabel: 'Email' },
      slots: { default: 'Notify me by mail' },
    })
    const btn = w.find('[role=switch]')
    expect(btn.attributes('aria-label')).toBeUndefined()
    expect(btn.attributes('aria-labelledby')).toBe(w.find('span[id]').attributes('id'))
  })

  it('a loading switch does not show the pointer cursor', () => {
    const w = mount(UiSwitch, {
      props: { modelValue: false, loading: true },
      slots: { default: 'Email' },
    })
    expect(w.find('label').classes()).toContain('cursor-progress')
    expect(w.find('label').classes()).not.toContain('cursor-pointer')
  })

  it('forced colors keeps the padding for the border, and a disabled busy thumb its fill', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(
      /\.ui-switch \{\s*border: 1px solid ButtonText;[^}]*padding: calc\(0\.125rem - 1px\)/,
    )
    expect(css).toContain(".ui-switch[aria-busy='true']:not(:disabled) .ui-switch-thumb")
  })
})
