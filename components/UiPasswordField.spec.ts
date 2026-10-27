import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import UiField from './UiField.vue'
import UiPasswordField from './UiPasswordField.vue'
import { h, nextTick } from 'vue'

// The owner takes what is emitted, as a v-model does.
const owned = (props: Record<string, unknown> = {}) => {
  const w = mount(UiPasswordField, {
    attachTo: document.body,
    props: {
      modelValue: '',
      ariaLabel: 'Password',
      'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
      ...props,
    },
  })
  return w
}
const live = (w: ReturnType<typeof mount>) => w.find(':scope > [aria-live]')

describe('UiPasswordField', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is a row: the input with its eye, then generate and, once there is a value, copy beside it', async () => {
    const w = mount(UiPasswordField, {
      props: { modelValue: '', ariaLabel: 'Password' },
      attrs: { class: 'w-80', 'data-testid': 'pw' },
    })
    expect(w.classes()).toContain('gap-2')
    expect(w.classes()).toContain('w-80')
    expect(w.find('input').attributes('data-testid')).toBe('pw')
    expect(w.find('.ui-capsule button[aria-label="Show password"]').exists()).toBe(true)
    const generate = w.find('button[aria-label="Generate a password"]')
    expect(generate.element.closest('.ui-capsule')).toBeNull()
    expect(w.find('button[aria-label="Copy the password"]').exists()).toBe(false)
    await w.setProps({ modelValue: 'hunter2hunter2' })
    expect(
      w.find('button[aria-label="Copy the password"]').element.closest('.ui-capsule'),
    ).toBeNull()
  })

  it('generate fills the field, shows it and says so; the copy button wakes up', async () => {
    const w = owned()
    await w.find('button[aria-label="Generate a password"]').trigger('click')
    await nextTick()
    const [value] = w.emitted('update:modelValue')![0]!
    expect(value).toHaveLength(16)
    expect(w.emitted('generate')).toEqual([[value]])
    expect(w.find('input').attributes('type')).toBe('text')
    expect(
      (w.find('button[aria-label="Copy the password"]').element as HTMLButtonElement).disabled,
    ).toBe(false)
  })

  it('copies the whole password', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const w = mount(UiPasswordField, { props: { modelValue: 'correct horse', ariaLabel: 'P' } })
    await w.find('button[aria-label="Copy the password"]').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(writeText).toHaveBeenCalledWith('correct horse')
  })

  it('inside UiField the input takes the field id and the label names it', () => {
    const w = mount(UiField, {
      props: { label: 'New password', description: 'At least 10 characters' },
      slots: { default: () => h(UiPasswordField, { modelValue: '' }) },
    })
    const input = w.find('input')
    expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBeTruthy()
    expect(input.attributes('aria-label')).toBeUndefined()
  })

  it('disabled blocks all three', () => {
    const w = mount(UiPasswordField, { props: { modelValue: 'x', disabled: true, ariaLabel: 'P' } })
    expect(w.find('input').attributes('disabled')).toBeDefined()
    for (const b of w.findAll('button'))
      expect((b.element as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('UiPasswordField — review follow-ups', () => {
  it('says a password was generated, without saying it, and says it again on a second generate', async () => {
    const w = owned()
    const generate = w.find('button[aria-label="Generate a password"]')
    await generate.trigger('click')
    await nextTick()
    await nextTick()
    const region = live(w)
    const value = w.emitted('generate')![0]![0] as string
    expect(region.text()).toBe('New password generated')
    expect(region.text()).not.toContain(value)
    const texts: string[] = []
    const observer = new MutationObserver(() => texts.push(region.text()))
    observer.observe(region.element, { childList: true, characterData: true, subtree: true })
    await generate.trigger('click')
    for (let i = 0; i < 4; i++) await nextTick()
    observer.disconnect()
    expect(texts).toContain('')
    expect(region.text()).toBe('New password generated')
  })

  it('generate stays at the end and copy appears before it, so the pressed button does not move', async () => {
    const w = owned()
    await w.find('button[aria-label="Generate a password"]').trigger('click')
    await nextTick()
    const outside = w.findAll('button').filter((b) => !b.element.closest('.ui-capsule'))
    expect(outside.map((b) => b.attributes('aria-label'))).toEqual([
      'Copy the password',
      'Generate a password',
    ])
  })

  it('a generate the owner refuses says nothing, reveals nothing and emits no generate', async () => {
    const w = mount(UiPasswordField, { props: { modelValue: 'typed-secret', ariaLabel: 'P' } })
    await w.find('button[aria-label="Generate a password"]').trigger('click')
    for (let i = 0; i < 3; i++) await nextTick()
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    expect(w.emitted('generate')).toBeUndefined()
    expect(w.find('input').attributes('type')).toBe('password')
    expect(live(w).text()).toBe('')
  })

  it('hides the password again once the value is emptied', async () => {
    const w = owned()
    await w.find('button[aria-label="Generate a password"]').trigger('click')
    await nextTick()
    expect(w.find('input').attributes('type')).toBe('text')
    await w.setProps({ modelValue: '' })
    expect(w.find('input').attributes('type')).toBe('password')
  })

  it('inside a UiField with no label the input keeps its ariaLabel', () => {
    const w = mount(UiField, {
      props: { description: 'At least 10 characters' },
      slots: { default: () => h(UiPasswordField, { modelValue: '', ariaLabel: 'New password' }) },
    })
    expect(w.find('input').attributes('aria-label')).toBe('New password')
  })

  it('the copy button says it copies the password', () => {
    const w = mount(UiPasswordField, { props: { modelValue: 'x', ariaLabel: 'P' } })
    expect(w.find('button[aria-label="Copy the password"]').exists()).toBe(true)
  })

  it('readonly keeps copy and holds generate', async () => {
    const w = mount(UiPasswordField, {
      props: { modelValue: 'kept', readonly: true, ariaLabel: 'P' },
    })
    expect(w.find('input').attributes('readonly')).toBeDefined()
    expect(
      (w.find('button[aria-label="Copy the password"]').element as HTMLButtonElement).disabled,
    ).toBe(false)
    const generate = w.find('button[aria-label="Generate a password"]')
    expect((generate.element as HTMLButtonElement).disabled).toBe(true)
    await generate.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('invalid marks the input and shows the border standalone', () => {
    const w = mount(UiPasswordField, { props: { modelValue: '', invalid: true, ariaLabel: 'P' } })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.find('.ui-capsule').attributes('data-invalid')).toBeDefined()
  })

  it('focus moves to generate when copy leaves under it', async () => {
    const w = owned({ modelValue: 'secret-value' })
    ;(w.find('button[aria-label="Copy the password"]').element as HTMLElement).focus()
    await w.setProps({ modelValue: '' })
    for (let i = 0; i < 3; i++) await nextTick()
    expect(document.activeElement).toBe(w.find('button[aria-label="Generate a password"]').element)
    w.unmount()
  })

  it('in a form it sends the generated password under its name; a reset keeps it on its model', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiPasswordField, {
      attachTo: form,
      props: {
        modelValue: '',
        name: 'password',
        ariaLabel: 'P',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
      },
    })
    await w.find('button[aria-label="Generate a password"]').trigger('click')
    await nextTick()
    const value = w.emitted('generate')![0]![0] as string
    expect(new FormData(form).get('password')).toBe(value)
    const el = w.find('input').element as HTMLInputElement
    el.defaultValue = 'old'
    form.reset()
    await new Promise((r) => setTimeout(r))
    expect(el.value).toBe(value)
    w.unmount()
    form.remove()
  })

  it('generate and copy inside a form do not submit it', async () => {
    const form = document.createElement('form')
    const submitted = vi.fn((e: Event) => e.preventDefault())
    form.addEventListener('submit', submitted)
    document.body.append(form)
    const w = mount(UiPasswordField, { attachTo: form, props: { modelValue: 'x', ariaLabel: 'P' } })
    for (const b of w.findAll('button')) expect(b.attributes('type')).toBe('button')
    ;(w.find('button[aria-label="Generate a password"]').element as HTMLButtonElement).click()
    expect(submitted).not.toHaveBeenCalled()
    w.unmount()
    form.remove()
  })
})

describe('UiPasswordField — without copy', () => {
  it('copy false leaves the copy button out and keeps the eye and generate', () => {
    const w = mount(UiPasswordField, {
      props: { modelValue: 'correct horse', copy: false, ariaLabel: 'Password' },
    })
    expect(w.findComponent({ name: 'UiCopyButton' }).exists()).toBe(false)
    expect(w.find('[aria-label="Copy the password"]').exists()).toBe(false)
    expect(w.find('[aria-label="Generate a password"]').exists()).toBe(true)
    const withCopy = mount(UiPasswordField, {
      props: { modelValue: 'correct horse', ariaLabel: 'Password' },
    })
    expect(withCopy.find('[aria-label="Copy the password"]').exists()).toBe(true)
  })
})
