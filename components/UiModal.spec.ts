import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiModal from './UiModal.vue'
import { tabbables } from '../composables/useFocusTrap'
import { useOverlayStack } from '../composables/useOverlayStack'
import UiSelect from './UiSelect.vue'
import UiDatePicker from './UiDatePicker.vue'
import UiDateRange from './UiDateRange.vue'
import UiDropzone from './UiDropzone.vue'
import UiScaleInput from './UiScaleInput.vue'
import { en } from '../i18n/en'

// Ticks, then a macrotask: the trap puts the focus back from a timer, and one left over from
// the test before must fire here, not in the middle of the next one.
const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((r) => setTimeout(r))
}
const dialogs = () => Array.from(document.body.querySelectorAll<HTMLElement>('[aria-modal="true"]'))
const dialog = () => dialogs().at(-1)!
const esc = (el: Element) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
const tab = (el: Element, shiftKey = false) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }),
  )
const backdrop = () => dialog().parentElement!
const pressBackdrop = () => backdrop().dispatchEvent(new Event('pointerdown', { bubbles: true }))

const mountModal = (props: Record<string, unknown> = {}, body = true) =>
  mount(UiModal, {
    attachTo: document.body,
    props: { title: 'Rename the list', open: true, ...props },
    slots: {
      default: () =>
        body
          ? [h('label', ['Name', h('input', { class: 'name' })]), h('input', { class: 'note' })]
          : 'Text only',
      footer: () => [
        h('button', { class: 'cancel' }, 'Cancel'),
        h('button', { class: 'save' }, 'Save'),
      ],
    },
  })

describe('UiModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })

  it('#header takes the place of the title and the cross; the title is still the name', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Search', open: true },
      slots: { header: () => h('input', { class: 'find' }), default: () => 'Results' },
    })
    await settle()
    const d = dialog()
    const name = document.getElementById(d.getAttribute('aria-labelledby')!)!
    expect(name.textContent).toBe('Search')
    expect(name.classList).toContain('sr-only')
    expect(d.querySelector('.find')).not.toBeNull()
    expect(d.querySelectorAll('button')).toHaveLength(0)
    esc(d.querySelector('.find')!)
    await settle()
    expect(dialogs()).toHaveLength(0)
  })

  it('without `form` it is no form, a listener or not: a question keeps its buttons plain', async () => {
    mountModal({ onSubmit: () => {} })
    await settle()
    expect(dialog().querySelector('form')).toBeNull()
  })

  it('a submit that leaves a field invalid puts the focus on the first one', async () => {
    // The host checks the form as it gets the submit and marks the note.
    const onSubmit = vi.fn(() =>
      dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true'),
    )
    mountModal({ form: true, onSubmit })
    await settle()
    const form = dialog().querySelector('form')!
    dialog().querySelector<HTMLElement>('.save')!.focus()
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(dialog().querySelector('.note'))
  })

  it('A refused submit shakes the window, as a refused close does: nothing seemed to happen otherwise.', async () => {
    const onSubmit = vi.fn(() =>
      dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true'),
    )
    mountModal({ form: true, onSubmit })
    await settle()
    dialog()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(dialog().classList).toContain('ui-shake')
  })

  it('A submit the host takes shakes nothing.', async () => {
    mountModal({ form: true, onSubmit: vi.fn() })
    await settle()
    dialog()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(dialog().classList).not.toContain('ui-shake')
  })

  it('Cmd+Enter in a textarea submits; Enter alone does not', async () => {
    const onSubmit = vi.fn()
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Note', open: true, form: true, onSubmit },
      slots: {
        default: () => h('textarea'),
        footer: () => h('button', { class: 'cancel' }, 'Cancel'),
      },
    })
    await settle()
    const press = (el: Element, init: KeyboardEventInit) => {
      const e = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...init,
      })
      el.dispatchEvent(e)
      return e
    }
    const note = dialog().querySelector('textarea')!
    expect(press(note, {}).defaultPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(press(note, { metaKey: true }).defaultPrevented).toBe(true)
    // One submit per request: an edit opens the form again.
    note.dispatchEvent(new Event('input', { bubbles: true }))
    press(note, { ctrlKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(2)
    // On Cancel it stays Cancel's.
    press(dialog().querySelector('.cancel')!, { metaKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('is a modal dialog named by its title and described by its description', async () => {
    mountModal({ description: 'The name shows in the sidebar.' })
    await settle()
    const d = dialog()
    expect(d.getAttribute('role')).toBe('dialog')
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Rename the list',
    )
    expect(document.getElementById(d.getAttribute('aria-describedby')!)!.textContent?.trim()).toBe(
      'The name shows in the sidebar.',
    )
  })

  it('focus goes to the first field, not the cross; without fields to the window', async () => {
    mountModal()
    await settle()
    expect(document.activeElement?.className).toBe('name')
    document.body.innerHTML = ''
    mountModal({}, false)
    await settle()
    expect(document.activeElement).toBe(dialog())
  })

  it('Tab goes round inside the window', async () => {
    mountModal()
    await settle()
    const save = dialog().querySelector<HTMLElement>('.save')!
    save.focus()
    tab(save)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close')
    tab(document.activeElement!, true)
    expect(document.activeElement).toBe(save)
  })

  it('Escape, the backdrop and the cross close it and say so', async () => {
    for (const how of ['escape', 'backdrop', 'cross'] as const) {
      const w = mountModal()
      await settle()
      if (how === 'escape') esc(document.activeElement!)
      if (how === 'backdrop') pressBackdrop()
      // Vue drops a click in the millisecond its listener was attached (`_vts`), and the cross
      // is a UiIconButton, whose capture listener stamps the event first.
      if (how === 'cross') {
        await new Promise((r) => setTimeout(r, 2))
        dialog().querySelector<HTMLElement>('[aria-label="Close"]')!.click()
      }
      await settle()
      expect(w.emitted('close'), how).toHaveLength(1)
      expect(w.emitted('update:open'), how).toEqual([[false]])
      w.unmount()
    }
  })

  it('a click that starts in the window and ends on the backdrop does not close it', async () => {
    const w = mountModal()
    await settle()
    dialog()
      .querySelector('.name')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(w.emitted('close')).toBeUndefined()
  })

  it('persistent refuses the backdrop and Escape with a shake; the cross still closes', async () => {
    const w = mountModal({ persistent: true })
    await settle()
    esc(document.activeElement!)
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(dialog().classList).toContain('ui-shake')
    dialog().querySelector<HTMLElement>('[aria-label="Close"]')!.click()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('focus that leaves the window (a menu closed by Tab from its last button) comes back', async () => {
    mountModal()
    await settle()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('focus returns to the opener on close', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = mountModal({ open: false })
    await w.setProps({ open: true })
    await settle()
    expect(document.activeElement?.className).toBe('name')
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).toBe(opener)
  })

  it('the page does not scroll under it; a second window keeps the lock until both close', async () => {
    const a = mountModal()
    // A question stands over the window; another plain window would take its place.
    const b = mountModal({ title: 'Confirm', role: 'alertdialog' })
    await settle()
    expect(dialogs()).toHaveLength(2)
    await settle()
    expect(document.body.style.overflow).toBe('hidden')
    await a.setProps({ open: false })
    expect(document.body.style.overflow).toBe('hidden')
    await b.setProps({ open: false })
    expect(document.body.style.overflow).toBe('')
  })

  it('Escape closes only the window on top', async () => {
    const lower = mountModal()
    // A question stands over the window it asks about; another window would take its place.
    const upper = mountModal({ title: 'Confirm', role: 'alertdialog' })
    await settle()
    esc(dialogs()[0]!.querySelector('input')!)
    await settle()
    expect(lower.emitted('close')).toBeUndefined()
    esc(dialogs()[1]!.querySelector('input')!)
    await settle()
    expect(upper.emitted('close')).toHaveLength(1)
    expect(lower.emitted('close')).toBeUndefined()
  })

  it('alertdialog: the backdrop does not close it and focus starts on the first footer button', async () => {
    const w = mountModal({ role: 'alertdialog' })
    await settle()
    expect(dialog().getAttribute('role')).toBe('alertdialog')
    expect(document.activeElement?.className).toBe('cancel')
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    esc(document.activeElement!)
    expect(w.emitted('close')).toHaveLength(1)
  })
})

describe('UiModal — a result', () => {
  const mountResult = () =>
    mount(UiModal, {
      attachTo: document.body,
      props: {
        title: 'Invoice sent',
        description: 'Acme Corp gets it.',
        open: true,
        align: 'center',
      },
      slots: {
        media: () => h('span', { class: 'halo' }, [h('svg')]),
        footer: () => h('button', { class: 'done' }, 'Done'),
      },
    })

  it('centered: the glyph over the title, no line under the header, no empty body', async () => {
    mountResult()
    await settle()
    const header = dialog().querySelector('h2')!.closest('.flex-col')!
    expect(header.classList.contains('text-center')).toBe(true)
    expect(header.classList.contains('border-b')).toBe(false)
    const media = header.querySelector('.halo')!.parentElement!
    expect(media.getAttribute('aria-hidden')).toBe('true')
    expect(media.compareDocumentPosition(dialog().querySelector('h2')!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(dialog().querySelector('.overflow-y-auto')).toBeNull()
  })

  it('centered: the footer has no line', async () => {
    mountResult()
    await settle()
    const footer = dialog().querySelector('.done')!.parentElement!
    expect(footer.classList.contains('border-t')).toBe(false)
  })

  it('still named by its title and closed by its cross', async () => {
    const w = mountResult()
    await settle()
    expect(document.getElementById(dialog().getAttribute('aria-labelledby')!)?.textContent).toBe(
      'Invoice sent',
    )
    // Vue drops a click in the millisecond its listener was attached.
    await new Promise((r) => setTimeout(r, 2))
    dialog().querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click()
    await settle()
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

describe('UiModal — rows edge to edge', () => {
  it('unpadded: the body keeps no padding and its rows take the gutter as an inset', async () => {
    const Row = { template: '<div class="row" />' }
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'INV-0042', open: true, size: 'sm', padded: false },
      slots: { default: () => h(Row) },
    })
    await settle()
    const body = dialog().querySelector('.row')!.parentElement!
    expect(body.className).not.toMatch(/\bp-4\b/)
  })
})

describe('UiModal — the footer', () => {
  it('its buttons share its width in equal parts, in every window', async () => {
    mountModal()
    await settle()
    const footer = dialog().querySelector('.save')!.parentElement!
    expect(footer.className).toContain('[&>*]:flex-1')
    expect(footer.classList.contains('justify-end')).toBe(false)
  })
})

describe('UiModal — one inset, a token', () => {
  it('the header, the body and the footer take --space-overlay, and the footer its gap too', async () => {
    mountModal()
    await settle()
    const footer = dialog().querySelector('.save')!.parentElement!
    expect(footer.className).toMatch(/\bp-overlay\b/)
    expect(footer.className).toMatch(/\bgap-overlay\b/)
    expect(dialog().querySelector('h2')!.closest('.px-overlay')).not.toBeNull()
    expect(dialog().querySelector('.name')!.closest('.p-overlay')).not.toBeNull()
  })
})

describe('UiModal — review follow-ups', () => {
  it('a backdrop press closes a select opened inside, and leaves the window open', async () => {
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'New client', open: true },
      slots: {
        default: () =>
          h(UiSelect, {
            modelValue: null,
            items: [{ value: 'nl', label: 'Netherlands' }],
            ariaLabel: 'Country',
          }),
      },
    })
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    dialog().querySelector<HTMLElement>('[role="combobox"]')!.click()
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull()
    pressBackdrop()
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    expect(w.emitted('update:open')).toBeUndefined()
    pressBackdrop()
    await settle()
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

describe('UiModal — review follow-ups, second pass', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const formModal = (props: Record<string, unknown> = {}, save: Record<string, unknown> = {}) =>
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Note', open: true, ...props },
      slots: {
        default: () => [h('input', { class: 'name' }), h('textarea', { class: 'note' })],
        footer: () => [h('button', { type: 'submit', class: 'save', ...save }, 'Save')],
      },
    })

  // A browser submits a form when Enter is pressed in a single-line field of it that has a submit
  // button; the window's part is that the field and Save stand in one form. The key itself is
  // pressed in Chromium by the browser tests.
  it('Enter in a single-line field submits: the field and Save stand in one form', async () => {
    const onSubmit = vi.fn()
    formModal({ form: true, onSubmit })
    await settle()
    const field = dialog().querySelector<HTMLInputElement>('input.name')!
    const save = dialog().querySelector<HTMLButtonElement>('button.save')!
    expect(field.form).not.toBeNull()
    expect(save.form).toBe(field.form)
    expect(save.type).toBe('submit')
    field.form!.requestSubmit(save)
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('a second submit before the host answers emits no second submit', async () => {
    const onSubmit = vi.fn()
    formModal({ form: true, onSubmit })
    await settle()
    const form = dialog().querySelector('form')!
    form.requestSubmit()
    form.requestSubmit()
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('a refused submit stays sendable after a select is changed', async () => {
    const onSubmit = vi.fn()
    const country = ref<string | null>(null)
    mount(
      {
        setup: () => () =>
          h(
            UiModal,
            { title: 'Client', open: true, form: true, onSubmit },
            {
              default: () => [
                h('button', {
                  type: 'button',
                  role: 'combobox',
                  class: 'country',
                  'aria-invalid': country.value ? undefined : 'true',
                }),
              ],
              footer: () => [h('button', { type: 'submit' }, 'Save')],
            },
          ),
      },
      { attachTo: document.body },
    )
    await settle()
    dialog().querySelector('form')!.requestSubmit()
    await settle()
    expect(document.activeElement?.classList).toContain('country')
    country.value = 'by'
    await settle()
    dialog().querySelector('form')!.requestSubmit()
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('Cmd+Enter does nothing while the main action is disabled', async () => {
    const onSubmit = vi.fn()
    formModal({ form: true, onSubmit }, { disabled: true })
    await settle()
    const note = dialog().querySelector('textarea')!
    note.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('a held Cmd+Enter sends once', async () => {
    const onSubmit = vi.fn()
    formModal({ form: true, onSubmit })
    await settle()
    const note = dialog().querySelector('textarea')!
    const press = (repeat: boolean) =>
      note.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          metaKey: true,
          repeat,
          bubbles: true,
          cancelable: true,
        }),
      )
    press(false)
    note.dispatchEvent(new Event('input', { bubbles: true }))
    press(true)
    press(true)
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submitting refuses the cross, the backdrop and Escape', async () => {
    const w = mountModal({ submitting: true })
    await settle()
    dialog().querySelector<HTMLButtonElement>('button[aria-label="Close"]')!.click()
    pressBackdrop()
    esc(dialog())
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(dialog().classList).toContain('ui-shake')
  })

  it('a refused close is said inside the window: unsaved input, then a request on its way', async () => {
    // The words wait a beat in a region that is already there: the reader hears every refusal, the
    // same one twice too, and from inside the window, where a reader keeps to an `aria-modal` one.
    const said = async (root: Element) => {
      await new Promise((r) => setTimeout(r, 120))
      return root.querySelector('[role="status"][data-refusal]')?.textContent ?? null
    }
    const w = mountModal({ persistent: true })
    await settle()
    expect(await said(dialog())).toBe('')
    esc(document.activeElement!)
    expect(await said(dialog())).toBe(en['grani.overlay.unsaved'])
    await w.setProps({ persistent: false, submitting: true })
    esc(dialog())
    expect(await said(dialog())).toBe(en['grani.overlay.busy'])
    expect(w.emitted('close')).toBeUndefined()
  })

  it('a window opened again does not keep the refusal of its last opening', async () => {
    const w = mountModal({ persistent: true })
    await settle()
    esc(document.activeElement!)
    await new Promise((r) => setTimeout(r, 120))
    await w.setProps({ open: false })
    await settle()
    await w.setProps({ open: true })
    await settle()
    expect(dialog().querySelector('[role="status"][data-refusal]')?.textContent).toBe('')
  })

  it('attributes land on the dialog, not on the teleport', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Note', open: true },
      attrs: { 'data-testid': 'note-modal' },
      slots: { default: () => 'Body' },
    })
    await settle()
    expect(dialog().getAttribute('data-testid')).toBe('note-modal')
  })

  it('focus goes to the first control, a select included', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: {
        default: () => [
          h(UiSelect, { modelValue: null, items: [], ariaLabel: 'Country' }),
          h('input', { class: 'name' }),
        ],
      },
    })
    await settle()
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
  })

  it('with #header, aria-describedby never points at a missing node', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Search', description: 'Type to filter', open: true },
      slots: { header: () => h('input'), default: () => 'Results' },
    })
    await settle()
    const id = dialog().getAttribute('aria-describedby')
    expect(id === null || document.getElementById(id) !== null).toBe(true)
  })

  it('alertdialog is described by its body when it has no description', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Delete the order?', role: 'alertdialog', open: true },
      slots: { default: () => h('p', 'The order is removed.'), footer: () => h('button', 'No') },
    })
    await settle()
    const id = dialog().getAttribute('aria-describedby')!
    expect(document.getElementById(id)!.textContent).toContain('The order is removed.')
  })

  it('alertdialog: a backdrop press shakes and does not close', async () => {
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Delete?', role: 'alertdialog', open: true },
      slots: { default: () => 'x', footer: () => h('button', 'No') },
    })
    await settle()
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(dialog().classList).toContain('ui-shake')
  })

  it('the cross carries an end offset for each ladder step, and a long title wraps', async () => {
    mountModal()
    await settle()
    const head = dialog().querySelector('h2')!.closest('.flex.gap-4')!
    for (const step of ['xs', 'sm', 'md'])
      expect(head.className).toContain(`[&>[data-bare=${step}]:last-child]`)
    expect(dialog().querySelector('h2')!.className).toContain('[overflow-wrap:anywhere]')
  })

  it('the shell is the drawer’s too, and the form lock the record’s', () => {
    const src = (file: string) => readFileSync(resolve(__dirname, file), 'utf8')
    for (const file of ['UiModal.vue', 'UiDrawer.vue'])
      expect(src(file), file).toContain('useOverlayShell(')
    for (const file of ['UiModal.vue', 'UiCrudDrawer.vue'])
      expect(src(file), file).toContain('useSubmitLock(')
  })
})

describe('UiModal — review follow-ups', () => {
  it('the backdrop and the window rise softly: a slow start on the travel step, not a pop', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    expect(css).toMatch(/--ui-ease-fade: cubic-bezier\(0\.4, 0, 0\.2, 1\);/)
    expect(css).toMatch(
      /\.ui-modal-enter-active \{\s*transition: opacity var\(--ui-dur-travel\) var\(--ui-ease-fade\);/,
    )
    expect(css).toMatch(
      /\.ui-modal-enter-active \.ui-modal-panel \{\s*transition: transform var\(--ui-dur-travel\) var\(--ui-ease-fade\);/,
    )
    // A drawer's backdrop rises the same way under its panel.
    expect(css).toMatch(
      /\.ui-drawer-enter-active \.ui-drawer-backdrop \{\s*transition: opacity var\(--ui-dur-travel\) var\(--ui-ease-fade\);/,
    )
  })
})

describe('UiModal — one window at a time', () => {
  // The window's root, the backdrop that holds it: what a window over it hides.
  const rootOf = (d: HTMLElement) => d.parentElement!
  const hidden = (d: HTMLElement) =>
    rootOf(d).hasAttribute('inert') && rootOf(d).classList.contains('invisible')
  const mountLower = (props: Record<string, unknown> = {}) =>
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'New client', open: true, ...props },
      slots: {
        default: () => [h('input', { class: 'name' }), h('button', { class: 'ask' }, 'Ask')],
      },
    })
  // A question about the window under it: it hides that window while it asks. Another window
  // opened from it takes its place (see "a window opened from a window" below), unless the one
  // under holds unsaved input: then it stands over it the same way (`question: false`).
  const mountUpper = (title = 'Delete the client?', open = true, question = true) =>
    mount(UiModal, {
      attachTo: document.body,
      props: { title, open, role: question ? 'alertdialog' : undefined },
      slots: { default: () => h('input', { class: 'inner' }) },
    })

  it('a window opened over a window hides it, out of sight and out of reach; one is seen', async () => {
    mountLower()
    await settle()
    mountUpper()
    await settle()
    const [lower, upper] = dialogs()
    expect(hidden(lower!)).toBe(true)
    expect(hidden(upper!)).toBe(false)
  })

  it('a window alone is not hidden, and comes in as it always did', async () => {
    mountLower()
    await settle()
    expect(hidden(dialog())).toBe(false)
    expect(rootOf(dialog()).hasAttribute('data-swap')).toBe(false)
  })

  it('the one on top comes in on its panel alone: the backdrop is there already', async () => {
    mountLower()
    await settle()
    mountUpper()
    await settle()
    expect(rootOf(dialogs()[1]!).hasAttribute('data-swap')).toBe(true)
  })

  for (const how of ['cross', 'escape', 'outside'] as const)
    it(`closed by ${how}, the one on top brings the one under back, and the focus to what opened it`, async () => {
      // A press beside a question shakes it: here a window stands over one with unsaved input.
      mountLower(how === 'outside' ? { persistent: true } : {})
      await settle()
      const ask = dialog().querySelector<HTMLElement>('.ask')!
      ask.focus()
      const upper = mountUpper('Delete the client?', false, how !== 'outside')
      await upper.setProps({ open: true })
      await settle()
      const top = dialogs()[1]!
      expect(hidden(dialogs()[0]!)).toBe(true)
      if (how === 'cross') top.querySelector<HTMLElement>('[aria-label="Close"]')!.click()
      if (how === 'escape') esc(top.querySelector('.inner')!)
      if (how === 'outside') rootOf(top).dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await settle()
      expect(upper.emitted('close')).toHaveLength(1)
      expect(dialogs()).toHaveLength(1)
      expect(hidden(dialog())).toBe(false)
      expect(document.activeElement).toBe(ask)
    })

  it('closed from outside, the one on top brings the one under back before the focus goes in', async () => {
    mountLower()
    await settle()
    const ask = dialog().querySelector<HTMLElement>('.ask')!
    ask.focus()
    let hiddenAtFocus: boolean | null = null
    const upper = mountUpper('Delete the client?', false)
    await upper.setProps({ open: true })
    await settle()
    const lower = dialogs()[0]!
    ask.addEventListener('focus', () => (hiddenAtFocus = hidden(lower)))
    expect(hidden(lower)).toBe(true)
    await upper.setProps({ open: false })
    await settle()
    expect(hiddenAtFocus).toBe(false)
    expect(document.activeElement).toBe(ask)
  })

  it('the one under comes back on its panel: it rises again, once', async () => {
    mountLower()
    await settle()
    const upper = mountUpper()
    await settle()
    const panel = dialogs()[0]!
    expect(panel.classList).not.toContain('ui-modal-return')
    await upper.setProps({ open: false })
    await settle()
    expect(panel.classList).toContain('ui-modal-return')
    panel.dispatchEvent(new Event('animationend'))
    await settle()
    expect(panel.classList).not.toContain('ui-modal-return')
  })

  it('three windows: only the top one is seen, and they come back one by one', async () => {
    mountLower()
    await settle()
    const second = mountUpper('Second')
    await settle()
    const third = mountUpper('Third')
    await settle()
    expect(dialogs().map(hidden)).toEqual([true, true, false])
    await third.setProps({ open: false })
    await settle()
    expect(dialogs().map(hidden)).toEqual([true, false])
    await second.setProps({ open: false })
    await settle()
    expect(dialogs().map(hidden)).toEqual([false])
  })

  it('two windows open at the first render: once hydrated, only the top one is seen', async () => {
    const App = {
      render: () => [
        h(UiModal, { open: true, title: 'First' }, () => h('input')),
        h(UiModal, { open: true, title: 'Second', role: 'alertdialog' }, () => h('input')),
      ],
    }
    // The server: no document, no window, as in Node.
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    const ctx: SSRContext = {}
    let html: string
    try {
      html = await renderToString(createSSRApp(App), ctx)
    } finally {
      vi.unstubAllGlobals()
    }
    const app = document.createElement('div')
    app.innerHTML = html
    document.body.append(app)
    // What the server teleported goes first in the body, in its order, as the README says.
    const teleported = document.createElement('template')
    teleported.innerHTML = ctx.teleports?.body ?? ''
    document.body.prepend(...Array.from(teleported.content.childNodes))
    expect(dialogs().map(hidden)).toEqual([false, false])
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hydrated = createSSRApp(App)
    hydrated.mount(app)
    await settle()
    const said = warn.mock.calls.map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    warn.mockRestore()
    const seen = dialogs().map(hidden)
    hydrated.unmount()
    expect(seen).toEqual([true, false])
    // The second window takes the step of the one it hides: the server's step, so no mismatch.
    expect(said).toEqual([])
  })

  it('the one under closed from outside: the one on top stays, and nothing is hidden', async () => {
    const lower = mountLower()
    await settle()
    const upper = mountUpper()
    await settle()
    expect(hidden(dialogs()[0]!)).toBe(true)
    expect(rootOf(dialogs()[1]!).hasAttribute('data-swap')).toBe(true)
    await lower.setProps({ open: false })
    await settle()
    expect(upper.emitted('close')).toBeUndefined()
    expect(dialogs()).toHaveLength(1)
    expect(hidden(dialog())).toBe(false)
    // Nothing waits under it now: it leaves as a window alone does, its backdrop fading.
    expect(rootOf(dialog()).hasAttribute('data-swap')).toBe(false)
  })
})

// The layout happy-dom does not do: a scrolling body is long (1200 in 300), everything else empty.
// Set before the window opens, so its first focus already meets a long body; taken back after.
const longBodies = () => {
  const box = (el: Element) => el.classList.contains('overflow-y-auto')
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return box(this) ? 1200 : 0
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return box(this) ? 300 : 0
    },
  })
  return () => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
  }
}

describe('UiModal — a long body takes the first focus', () => {
  // A long text with nothing to fill in is opened to be read: the arrows scroll it at once,
  // without two Tabs over the cross first (owner, 18.10.2026; WAI-ARIA for long dialogs).
  it('with no field, the long body takes the focus as it opens', async () => {
    const restore = longBodies()
    try {
      mount(UiModal, {
        attachTo: document.body,
        props: { title: 'Terms of the service', open: true },
        slots: { default: () => h('p', 'A long text with nothing to focus in it.') },
      })
      for (let i = 0; i < 4; i++) await settle()
      const body = dialog().querySelector<HTMLElement>('.overflow-y-auto')!
      expect(body.getAttribute('tabindex')).toBe('0')
      expect(document.activeElement).toBe(body)
    } finally {
      restore()
    }
  })

  it('with a field, the field takes it, however long the body', async () => {
    const restore = longBodies()
    try {
      mount(UiModal, {
        attachTo: document.body,
        props: { title: 'Note', open: true },
        slots: { default: () => [h('p', 'A long text.'), h('input', { class: 'first' })] },
      })
      for (let i = 0; i < 4; i++) await settle()
      expect(document.activeElement?.classList.contains('first')).toBe(true)
    } finally {
      restore()
    }
  })
})

describe('UiModal — a long body by keyboard', () => {
  // happy-dom lays nothing out: the body's sizes are given, then a resize asks it to measure.
  const overflow = (el: HTMLElement, content: number, box: number) => {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: content })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: box })
    window.dispatchEvent(new Event('resize'))
  }
  const textOnly = () =>
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Terms of the service', open: true },
      slots: { default: () => h('p', 'A long text with nothing to focus in it.') },
    })

  it('a body longer than the window is a scroll region a keyboard reaches, named by the title', async () => {
    textOnly()
    await settle()
    const body = dialog().querySelector<HTMLElement>('[id^="ui-modal-body-"]')!
    overflow(body, 1200, 300)
    await settle()
    expect(body.getAttribute('tabindex')).toBe('0')
    expect(body.getAttribute('role')).toBe('region')
    expect(body.getAttribute('aria-labelledby')).toBe(dialog().getAttribute('aria-labelledby'))
  })

  // The region is a stop before what it holds: a person can scroll the text, then fill it in.
  it('a long body with a field: Tab goes the cross, the body, its field, then the footer', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Note', open: true },
      slots: {
        default: () => [h('p', 'A long text.'), h('input', { class: 'name' })],
        footer: () => h('button', { type: 'button', class: 'save' }, 'Save'),
      },
    })
    await settle()
    const body = dialog().querySelector<HTMLElement>('[id^="ui-modal-body-"]')!
    overflow(body, 1200, 300)
    await settle()
    const order = tabbables(dialog()).map((el) =>
      el === body
        ? 'body'
        : el.classList.contains('name')
          ? 'name'
          : el.classList.contains('save')
            ? 'save'
            : el.getAttribute('aria-label'),
    )
    expect(order).toEqual(['Close', 'body', 'name', 'save'])
  })

  it('a body that fits takes no stop of its own', async () => {
    textOnly()
    await settle()
    const body = dialog().querySelector<HTMLElement>('[id^="ui-modal-body-"]')!
    overflow(body, 300, 300)
    await settle()
    expect(body.hasAttribute('tabindex')).toBe(false)
    expect(body.hasAttribute('role')).toBe(false)
  })
})

// Safari does not focus a button a pointer presses: the window opens with the focus on the page,
// and the press is what opened it. The focus goes back to the button, as in the other browsers.
describe('UiModal — opened by a press that gave no focus', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a press on the backdrop closes it and gives the focus to the button pressed to open it', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open window'
    document.body.appendChild(opener)
    // The window is on the page, closed, before the press: an app mounts it so.
    const w = mountModal({ open: false })
    ;(document.activeElement as HTMLElement | null)?.blur()
    opener.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(document.activeElement).toBe(document.body)
    await w.setProps({ open: true })
    await settle()
    pressBackdrop()
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).toBe(opener)
  })

  // As in the other browsers, where a press on an empty part of the page takes the focus off the
  // button: the button pressed before it opened nothing and is not the window's opener.
  it('a press on an empty part of the page since then forgets the button', async () => {
    const button = document.createElement('button')
    const blank = document.createElement('div')
    document.body.append(button, blank)
    const w = mountModal({ open: false })
    ;(document.activeElement as HTMLElement | null)?.blur()
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    blank.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await w.setProps({ open: true })
    await settle()
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).not.toBe(button)
  })

  it('a press the focus followed is not remembered: a focus moved since then is the opener', async () => {
    const pressed = document.createElement('button')
    const field = document.createElement('input')
    document.body.append(pressed, field)
    const w = mountModal({ open: false })
    pressed.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    field.focus()
    await w.setProps({ open: true })
    await settle()
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).toBe(field)
  })
})

describe('UiModal — a window opened from a window', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const open = async (props: Record<string, unknown>, slot: () => unknown) => {
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { ...props, open: false } as { title: string; open: boolean },
      slots: { default: slot },
    })
    await w.setProps({ open: true })
    await settle()
    return w
  }

  it('a window opened from a window takes its place: the first closes, and the focus goes back to what opened it', async () => {
    const page = document.body.appendChild(document.createElement('button'))
    page.focus()
    const first = await open({ title: 'Edit the client' }, () =>
      h('button', { class: 'step' }, 'Invoices'),
    )
    document.querySelector<HTMLElement>('.step')!.focus()
    const second = await open({ title: 'Invoices of the client' }, () =>
      h('input', { class: 'inner' }),
    )
    expect(first.emitted('update:open')).toEqual([[false]])
    expect(first.emitted('close')).toHaveLength(1)
    expect(dialogs()).toHaveLength(1)
    // The window that took its place keeps the focus: the one that left gives none back.
    expect(dialog().contains(document.activeElement)).toBe(true)
    esc(dialog().querySelector('.inner')!)
    await settle()
    expect(second.emitted('close')).toHaveLength(1)
    expect(dialogs()).toHaveLength(0)
    expect(document.activeElement).toBe(page)
  })

  it('a question over a window does not take its place: the window comes back once it is answered', async () => {
    const first = await open({ title: 'Edit the client' }, () =>
      h('button', { class: 'ask' }, 'Delete'),
    )
    document.querySelector<HTMLElement>('.ask')!.focus()
    const question = await open({ title: 'Delete the client?', role: 'alertdialog' }, () =>
      h('p', 'Gone for good.'),
    )
    expect(first.emitted('update:open')).toBeUndefined()
    expect(dialogs()).toHaveLength(2)
    await question.setProps({ open: false })
    await settle()
    expect(dialogs()).toHaveLength(1)
    expect(document.activeElement).toBe(document.querySelector('.ask'))
  })

  const staysUnder = async (held: 'persistent' | 'submitting') => {
    const first = await open({ title: 'Edit the client', [held]: true }, () =>
      h('button', { class: 'step' }, 'Invoices'),
    )
    document.querySelector<HTMLElement>('.step')!.focus()
    const second = await open({ title: 'Invoices of the client' }, () =>
      h('input', { class: 'inner' }),
    )
    expect(first.emitted('update:open')).toBeUndefined()
    expect(dialogs()).toHaveLength(2)
    await second.setProps({ open: false })
    await settle()
    expect(dialogs()).toHaveLength(1)
    expect(document.activeElement).toBe(document.querySelector('.step'))
  }

  it('a window opened while a menu of the window is still open takes its place', async () => {
    const first = await open({ title: 'Edit the client' }, () =>
      h('button', { class: 'more' }, 'More'),
    )
    document.querySelector<HTMLElement>('.more')!.focus()
    // The menu opened from the window is on the stack until its own watcher releases it.
    const menu = document.body.appendChild(document.createElement('div'))
    const overlays = useOverlayStack()
    const token = overlays.acquire({ kind: 'panel', panel: () => menu })
    await open({ title: 'Invoices of the client' }, () => h('input', { class: 'inner' }))
    overlays.release(token)
    expect(first.emitted('update:open')).toEqual([[false]])
    expect(dialogs()).toHaveLength(1)
  })

  it('a window that was asked to give way and stayed open still gives the focus back when it closes', async () => {
    const page = document.body.appendChild(document.createElement('button'))
    page.focus()
    let allow = false
    // The host takes a close only once it allows it: the window it holds is read when asked.
    const host: { first?: Awaited<ReturnType<typeof open>> } = {}
    const props = {
      title: 'Edit the client',
      'onUpdate:open': (v: boolean) => {
        if (v || allow) void host.first?.setProps({ open: v })
      },
    }
    host.first = await open(props, () => h('button', { class: 'step' }, 'Invoices'))
    document.querySelector<HTMLElement>('.step')!.focus()
    const second = await open({ title: 'Invoices of the client' }, () =>
      h('input', { class: 'inner' }),
    )
    // The host did not take the close: the first window is still open, hidden under the second.
    expect(dialogs()).toHaveLength(2)
    await second.setProps({ open: false })
    await settle()
    expect(dialogs()).toHaveLength(1)
    allow = true
    esc(dialog())
    await settle()
    expect(dialogs()).toHaveLength(0)
    expect(document.activeElement).toBe(page)
  })

  it('a window opened from outside every layer (a toast action) still sends the focus to what opened the window it replaced', async () => {
    const page = document.body.appendChild(document.createElement('button'))
    page.focus()
    const region = document.body.appendChild(document.createElement('div'))
    const view = region.appendChild(document.createElement('button'))
    const off = useOverlayStack().above(() => region)
    await open({ title: 'Edit the client' }, () => h('input', { class: 'field' }))
    view.focus()
    const second = await open({ title: 'Invoice' }, () => h('input', { class: 'inner' }))
    // The toast goes with the press that opened the window.
    view.remove()
    await second.setProps({ open: false })
    await settle()
    off()
    expect(dialogs()).toHaveLength(0)
    expect(document.activeElement).toBe(page)
  })

  it('a window its host closes while it waits under another leaves the focus where it is', async () => {
    const page = document.body.appendChild(document.createElement('button'))
    page.focus()
    const first = await open({ title: 'Edit the client', submitting: true }, () =>
      h('button', { class: 'step' }, 'Invoices'),
    )
    document.querySelector<HTMLElement>('.step')!.focus()
    await open({ title: 'Invoices of the client' }, () => h('input', { class: 'inner' }))
    const inner = document.querySelector<HTMLElement>('.inner')!
    inner.focus()
    const moved: Element[] = []
    const focus = HTMLElement.prototype.focus
    HTMLElement.prototype.focus = function (this: HTMLElement, o?: FocusOptions) {
      moved.push(this)
      return focus.call(this, o)
    }
    try {
      await first.setProps({ submitting: false, open: false })
      await settle()
    } finally {
      HTMLElement.prototype.focus = focus
    }
    expect(moved).not.toContain(page)
    expect(document.activeElement).toBe(inner)
  })

  it('a window closed while a list of its select is open gives the focus back to what opened it', async () => {
    const ITEMS = [
      { value: 'gbp', label: 'British pound' },
      { value: 'usd', label: 'US dollar' },
    ]
    const Host = defineComponent({
      setup() {
        const shown = ref(false)
        const value = ref<string | null>(null)
        return () => [
          h('button', { class: 'page', onClick: () => (shown.value = true) }, 'Edit'),
          h(
            UiModal,
            {
              open: shown.value,
              'onUpdate:open': (v: boolean) => (shown.value = v),
              title: 'Pick',
            },
            {
              default: () =>
                h(UiSelect, {
                  modelValue: value.value,
                  items: ITEMS,
                  ariaLabel: 'Currency',
                  // The pick closes the window, its list still open in the same moment.
                  'onUpdate:modelValue': (v: unknown) => {
                    value.value = v as string | null
                    shown.value = false
                  },
                }),
            },
          ),
        ]
      },
    })
    mount(Host, { attachTo: document.body })
    const page = document.querySelector<HTMLElement>('.page')!
    page.focus()
    page.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await settle()
    const trigger = document.querySelector<HTMLElement>('[role="combobox"]')!
    trigger.focus()
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await settle()
    document
      .querySelectorAll<HTMLElement>('[role="option"]')[1]!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await settle()
    expect(dialogs()).toHaveLength(0)
    expect(document.activeElement).toBe(page)
  })

  it('the window it takes the place of leaves unseen at once, and the tint stays while it comes in', async () => {
    const shown = { a: ref(false), b: ref(false) }
    const Host = defineComponent({
      setup: () => () => [
        h(
          UiModal,
          { open: shown.a.value, 'onUpdate:open': (v: boolean) => (shown.a.value = v), title: 'A' },
          () => h('input'),
        ),
        h(
          UiModal,
          { open: shown.b.value, 'onUpdate:open': (v: boolean) => (shown.b.value = v), title: 'B' },
          () => h('input'),
        ),
      ],
    })
    // The real entrance and exit, which the harness stubs: the latch waits for the entrance's end.
    mount(Host, {
      attachTo: document.body,
      global: { stubs: { transition: false, teleport: false } },
    })
    const root = (title: string) =>
      dialogs().find(
        (d) => d.textContent?.includes(title) && d.querySelector('h2')?.textContent === title,
      )?.parentElement
    shown.a.value = true
    await settle()
    await new Promise((done) => setTimeout(done, 120))
    shown.b.value = true
    await nextTick()
    await nextTick()
    // A is hidden in the same moment it starts to leave, and B comes in on the tint already there.
    expect(root('A')?.hasAttribute('inert')).toBe(true)
    expect(root('A')?.classList.contains('invisible')).toBe(true)
    expect(root('B')?.hasAttribute('data-swap')).toBe(true)
    await new Promise((done) => setTimeout(done, 300))
    await settle()
    expect(dialogs()).toHaveLength(1)
    // In, with nothing under it: it will leave as a window alone does, its tint fading.
    expect(root('B')?.hasAttribute('data-swap')).toBe(false)
  })

  it('a window that is persistent is not replaced: it waits under the new one and comes back', () =>
    staysUnder('persistent'))

  it('a window that is submitting is not replaced: it waits under the new one and comes back', () =>
    staysUnder('submitting'))
})

describe('UiModal — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })

  // The host answers later (a request, not a check) and the answer marks a field: the cursor goes
  // to it, as in the drawer, unless the person went on typing elsewhere while the request was out.
  // The real Transition and Teleport: a stubbed one draws the form again with every prop.
  const mountLive = () =>
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Rename the list', open: true, form: true },
      slots: {
        default: () => [h('input', { class: 'name' }), h('input', { class: 'note' })],
        footer: () => h('button', { type: 'submit', class: 'save' }, 'Save'),
      },
      global: { stubs: { transition: false, teleport: false } },
    })

  it('the answer to a request marks a field: when submitting falls, the focus goes to it', async () => {
    const w = mountLive()
    await settle()
    dialog().querySelector<HTMLElement>('.save')!.focus()
    await w.setProps({ submitting: true })
    dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true')
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement).toBe(dialog().querySelector('.note'))
  })

  it('the answer comes after the window closed: it takes no focus', async () => {
    const w = mountLive()
    await settle()
    await w.setProps({ submitting: true })
    dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true')
    await w.setProps({ open: false })
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement?.classList.contains('note')).toBe(false)
  })

  it('the answer marks a field while the person types in another: the focus stays where they are', async () => {
    const w = mountLive()
    await settle()
    await w.setProps({ submitting: true })
    const name = dialog().querySelector<HTMLInputElement>('.name')!
    name.focus()
    name.dispatchEvent(new Event('input', { bubbles: true }))
    dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true')
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement).toBe(name)
  })

  it('sent with Enter from a field and nothing typed since: the field the answer marked takes the focus', async () => {
    const w = mountLive()
    await settle()
    dialog().querySelector<HTMLElement>('.name')!.focus()
    await w.setProps({ submitting: true })
    dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true')
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement).toBe(dialog().querySelector('.note'))
  })

  it('typing in the search of a select, drawn outside the window, keeps the focus there too', async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}` }))
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Order', open: true, form: true },
      slots: {
        default: () => [
          h(UiSelect, { items, modelValue: null, ariaLabel: 'Pick', searchable: true }),
          h('input', { class: 'note', 'aria-label': 'Note' }),
        ],
        footer: () => h('button', { type: 'submit', class: 'save' }, 'Save'),
      },
      global: { stubs: { transition: false, teleport: false } },
    })
    await settle()
    dialog().querySelector<HTMLElement>('.save')!.focus()
    await w.setProps({ submitting: true })
    const trigger = dialog().querySelector<HTMLElement>('[role=combobox]')!
    trigger.focus()
    trigger.click()
    await settle()
    const search = document.querySelector<HTMLInputElement>('input[aria-autocomplete="list"]')!
    search.focus()
    search.value = 'Ite'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    dialog().querySelector('.note')!.setAttribute('aria-invalid', 'true')
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement).toBe(search)
  })

  // The first field takes the focus whatever kind it is: a drawn date, a scale, a drop zone and a
  // date range are fields too, and the text box after them is the second.
  it.each([
    ['UiDatePicker', () => h(UiDatePicker, { modelValue: null, ariaLabel: 'First' })],
    ['UiScaleInput', () => h(UiScaleInput, { modelValue: null, ariaLabel: 'First' })],
    ['UiDropzone', () => h(UiDropzone, { modelValue: [], ariaLabel: 'First' })],
    ['UiDateRange', () => h(UiDateRange, { modelValue: null, ariaLabel: 'First' })],
  ])('focus on open goes to the first field when it is a %s', async (_, first) => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Order', open: true, form: true },
      slots: {
        default: () => [
          h('div', { class: 'first' }, first()),
          h('input', { class: 'second', 'aria-label': 'Second' }),
        ],
        footer: () => h('button', { type: 'submit' }, 'Save'),
      },
    })
    await settle()
    expect(document.activeElement?.classList.contains('second')).toBe(false)
    expect(dialog().querySelector('.first')!.contains(document.activeElement)).toBe(true)
  })
})
