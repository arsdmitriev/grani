import { config, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Fragment, defineComponent, h, nextTick, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import UiCard from './UiCard.vue'
import UiHeader from './UiHeader.vue'
import UiConfirm from './UiConfirm.vue'
import UiModal from './UiModal.vue'
import UiSelect from './UiSelect.vue'
import UiDatePicker from './UiDatePicker.vue'
import UiDateRange from './UiDateRange.vue'
import UiDropzone from './UiDropzone.vue'
import UiScaleInput from './UiScaleInput.vue'
import UiListField from './UiListField.vue'
import UiTable from './UiTable.vue'
import { useConfirm } from '../composables/useConfirm'
import { settle } from '../test/settle'
import { en } from '../i18n/en'

const panel = () => document.body.querySelector<HTMLElement>('.ui-drawer-panel')!
const button = (label: string) =>
  Array.from(panel().querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!
const esc = () =>
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )
const pressBackdrop = () =>
  panel().previousElementSibling!.dispatchEvent(new Event('pointerdown', { bubbles: true }))

const sections = () => [
  h(UiCard, { title: 'Main' }, () => h('input', { class: 'name' })),
  h(UiCard, { title: 'Contacts' }, () => h('input', { class: 'phone' })),
]

const mountDrawer = (props: Record<string, unknown> = {}, body: () => unknown = sections) =>
  mount(UiCrudDrawer, {
    attachTo: document.body,
    props: { title: 'Santa', description: 'client · since 2024', open: true, ...props },
    slots: { default: body },
  })

describe('UiCrudDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a modal dialog named by the record and described by what it is', async () => {
    mountDrawer()
    await settle()
    expect(panel().getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(panel().getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Santa',
    )
    expect(
      document.getElementById(panel().getAttribute('aria-describedby')!)!.textContent?.trim(),
    ).toBe('client · since 2024')
  })

  it('the footer is exactly Cancel and Save; Save submits the form', async () => {
    const w = mountDrawer()
    await settle()
    const footer = panel().querySelector('form > div:last-child')!
    expect(Array.from(footer.querySelectorAll('button')).map((b) => b.textContent?.trim())).toEqual(
      ['Cancel', 'Save'],
    )
    expect(button('Save').getAttribute('type')).toBe('submit')
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toHaveLength(1)
  })

  // A browser submits a form when Enter is pressed in a single-line field of it that has a submit
  // button; the record's part is that its fields and Save stand in one form. The key itself is
  // pressed in Chromium by the browser tests.
  it('Enter in a single-line field saves: the fields and Save stand in one form', async () => {
    const w = mountDrawer()
    await settle()
    const field = panel().querySelector<HTMLInputElement>('input.name')!
    const save = button('Save') as HTMLButtonElement
    expect(field.form).not.toBeNull()
    expect(save.form).toBe(field.form)
    expect(save.type).toBe('submit')
    field.form!.requestSubmit(save)
    expect(w.emitted('submit')).toHaveLength(1)
  })

  it('a second Enter before submitting arrives sends no second request', async () => {
    const w = mountDrawer()
    await settle()
    const form = panel().querySelector('form')!
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toHaveLength(1)
    await w.setProps({ submitting: true })
    await w.setProps({ submitting: false })
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toHaveLength(2)
  })

  it('Cmd+Enter in a textarea submits; Enter alone does not', async () => {
    const w = mountDrawer({}, () => h('textarea', { class: 'note' }))
    await settle()
    const note = panel().querySelector('textarea')!
    const press = (init: KeyboardEventInit) => {
      const e = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...init,
      })
      note.dispatchEvent(e)
      return e
    }
    expect(press({}).defaultPrevented).toBe(false)
    expect(w.emitted('submit')).toBeUndefined()
    expect(press({ metaKey: true }).defaultPrevented).toBe(true)
    expect(w.emitted('submit')).toHaveLength(1)
    await w.setProps({ submitting: true })
    await w.setProps({ submitting: false })
    press({ ctrlKey: true })
    expect(w.emitted('submit')).toHaveLength(2)
  })

  it('Cmd+Enter in a list field that only adds submits too; its Enter alone adds', async () => {
    const add = vi.fn()
    const w = mountDrawer({}, () => h(UiListField, { search: false, onAdd: add }))
    await settle()
    const field = panel().querySelector<HTMLInputElement>('input')!
    field.value = 'Meat'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    const press = (init: KeyboardEventInit) =>
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init }),
      )
    press({ metaKey: true })
    expect([w.emitted('submit')?.length, add.mock.calls.length]).toEqual([1, 0])
    press({})
    expect([w.emitted('submit')?.length, add.mock.calls.length]).toEqual([1, 1])
  })

  it('Cmd+Enter on a button stays the button: Cancel does not save', async () => {
    const w = mountDrawer()
    await settle()
    const cancel = button('Cancel')
    cancel.focus()
    const e = new KeyboardEvent('keydown', {
      key: 'Enter',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    cancel.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
    expect(w.emitted('submit')).toBeUndefined()
  })

  it('A refused submit shakes the drawer, as a refused close does.', async () => {
    const invalid = ref(false)
    mountDrawer({ onSubmit: () => (invalid.value = true) }, () => [
      h('input', { class: 'mail', 'aria-invalid': invalid.value ? 'true' : undefined }),
    ])
    await settle()
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(panel().classList).toContain('ui-shake')
  })

  it('a submit that leaves a field invalid puts the focus on the first one', async () => {
    const invalid = ref<string[]>([])
    const field = (c: string) =>
      h('input', { class: c, 'aria-invalid': invalid.value.includes(c) ? 'true' : undefined })
    // The host checks the form as it gets the submit and marks two fields.
    const w = mountDrawer({ onSubmit: () => (invalid.value = ['phone', 'mail']) }, () => [
      field('name'),
      field('phone'),
      field('mail'),
    ])
    await settle()
    const save = button('Save')
    save.focus()
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(document.activeElement).toBe(panel().querySelector('.phone'))
    // The server's answer marks a field later: when submitting falls, the focus goes to it.
    invalid.value = []
    save.focus()
    await w.setProps({ submitting: true })
    invalid.value = ['mail']
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement).toBe(panel().querySelector('.mail'))
  })

  it('a host that sets submitting late still gets one submit; an edit opens the lock again', async () => {
    const w = mountDrawer()
    await settle()
    const form = panel().querySelector('form')!
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await new Promise((r) => setTimeout(r, 50))
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toHaveLength(1)
    panel()
      .querySelector('.name')!
      .dispatchEvent(new Event('input', { bubbles: true }))
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toHaveLength(2)
  })

  it('a confirm opened from the drawer paints above it, though its host was mounted first', async () => {
    mount(UiConfirm, { attachTo: document.body })
    mountDrawer()
    await settle()
    void useConfirm().confirm('Delete the client?')
    await settle()
    const z = (el: Element | null) => Number((el as HTMLElement).style.zIndex)
    const confirmRoot = document.body.querySelector('[role="alertdialog"]')!.parentElement
    expect(z(confirmRoot)).toBeGreaterThan(z(panel().parentElement))
  })

  it('a card in a modal opened from the drawer is a framed card again', async () => {
    mountDrawer({}, () => [
      h(UiCard, { title: 'Main' }, () => h('input')),
      h(UiModal, { title: 'Pick an address', open: true }, () =>
        h(UiCard, { title: 'Address' }, () => 'Lenina 1'),
      ),
    ])
    await settle()
    const modal = document.body.querySelector(
      '[role="dialog"][aria-modal="true"]:not(.ui-drawer-panel)',
    )!
    expect(modal.querySelector('h3')?.textContent?.trim()).toBe('Address')
    expect(modal.querySelector('.rounded-card')).not.toBeNull()
  })

  it('a card inside a component of your own gets no separator (keep cards direct children)', async () => {
    const Section = { render: () => h(UiCard, { title: 'Wrapped' }, () => 'x') }
    mountDrawer({}, () => [h(UiCard, { title: 'Main' }, () => 'y'), h(Section)])
    await settle()
    expect(panel().querySelectorAll('[role="separator"]')).toHaveLength(0)
  })

  it('sections are flat cards with h3 headings and a separator between neighbors', async () => {
    mountDrawer()
    await settle()
    expect(Array.from(panel().querySelectorAll('h3')).map((e) => e.textContent?.trim())).toEqual([
      'Main',
      'Contacts',
    ])
    expect(panel().querySelectorAll('[role="separator"]')).toHaveLength(1)
    expect(panel().querySelector('.rounded-card')).toBeNull()
  })

  it('plain fields without sections get no separators', async () => {
    mountDrawer({}, () => [h('input'), h('input')])
    await settle()
    expect(panel().querySelectorAll('[role="separator"]')).toHaveLength(0)
  })

  it('loading: a skeleton, Save held, no submit; focus moves to the first field when it ends', async () => {
    const w = mountDrawer({ loading: true })
    await settle()
    expect(panel().querySelector('.name')).toBeNull()
    expect(panel().querySelector('[role="status"]')?.textContent).toBe('Loading the record…')
    expect(button('Save').disabled).toBe(true)
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.emitted('submit')).toBeUndefined()
    expect(document.activeElement).toBe(panel())
    await w.setProps({ loading: false })
    await settle()
    expect(document.activeElement?.className).toBe('name')
  })

  it('Cancel, the cross, Escape and the backdrop close it', async () => {
    for (const how of ['cancel', 'cross', 'escape', 'backdrop'] as const) {
      const w = mountDrawer()
      await settle()
      if (how === 'cancel') button('Cancel').click()
      if (how === 'cross') panel().querySelector<HTMLElement>('[aria-label="Close"]')!.click()
      if (how === 'escape') esc()
      if (how === 'backdrop') pressBackdrop()
      await settle()
      expect(w.emitted('close'), how).toHaveLength(1)
      w.unmount()
    }
  })

  it('persistent refuses Escape and the backdrop; Cancel still closes', async () => {
    const w = mountDrawer({ persistent: true })
    await settle()
    esc()
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(panel().classList).toContain('ui-shake')
    button('Cancel').click()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('submitting refuses every close: the request is already out', async () => {
    const w = mountDrawer({ submitting: true })
    await settle()
    expect(button('Cancel').disabled).toBe(true)
    panel().querySelector<HTMLElement>('[aria-label="Close"]')!.click()
    esc()
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
  })
})

describe('UiCrudDrawer — backdrop under a library', () => {
  it('a backdrop press closes a select opened inside, and leaves the drawer open', async () => {
    const w = mountDrawer({}, () =>
      h(UiSelect, {
        modelValue: null,
        items: [{ value: 'nl', label: 'Netherlands' }],
        ariaLabel: 'Country',
      }),
    )
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    panel().querySelector<HTMLElement>('[role="combobox"]')!.click()
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull()
    pressBackdrop()
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    expect(w.emitted('update:open')).toBeUndefined()
  })
})

describe('UiCrudDrawer — review follow-ups', () => {
  it('the status region is there before the load and filled while it runs', async () => {
    const w = mountDrawer()
    await settle()
    const region = () => document.body.querySelector('[role="dialog"] [role="status"].sr-only')
    expect(region()).not.toBeNull()
    expect(region()!.textContent?.trim()).toBe('')
    await w.setProps({ loading: true })
    await settle()
    expect(region()!.textContent?.trim()).toBe('Loading the record…')
    w.unmount()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("an Escape that cancels an IME candidate is the field's, not the drawer's", async () => {
    const w = mountDrawer()
    await settle()
    panel().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }),
    )
    await settle()
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('focus returns to the opener once the drawer closes', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = mountDrawer({ open: false })
    await w.setProps({ open: true })
    await settle()
    expect(document.activeElement?.className).toBe('name')
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).toBe(opener)
  })

  it('the loading skeleton is UiSkeleton: it keeps shimmering, slower, under reduced motion', async () => {
    mountDrawer({ loading: true })
    await settle()
    const bars = panel().querySelectorAll('.animate-pulse')
    expect(bars.length).toBe(4)
    bars.forEach((b) => {
      expect(b.className).toContain('ui-skeleton')
      expect(b.className).not.toContain('motion-reduce:animate-none')
    })
  })

  it('the body breathes on --space-drawer; the header and the footer keep 16 up and down, on its side edge', async () => {
    mountDrawer()
    await settle()
    const footer = panel().querySelector('[type="submit"]')!.parentElement!
    expect(footer.className).toMatch(/\bpx-drawer\b/)
    expect(footer.className).toMatch(/\bpy-4\b/)
    expect(footer.className).toMatch(/\bgap-4\b/)
    const header = panel().querySelector('h2')!.closest('.px-drawer')!
    expect(header.className).toMatch(/\bpt-4\b/)
    expect(header.className).toMatch(/\bpb-4\b/)
    expect(panel().querySelector('.overflow-y-auto')!.className).toMatch(/\bp-drawer\b/)
    expect(panel().querySelector('.ui-sections')!.className).toMatch(/\bgap-drawer\b/)
  })

  it('after a failed load there is nothing to save: submitDisabled holds Save and Enter', async () => {
    const w = mountDrawer({ submitDisabled: true }, () =>
      h(UiCard, null, () => h('input', { class: 'name' })),
    )
    await settle()
    const save = panel().querySelector<HTMLButtonElement>('[type="submit"]')!
    expect(save.disabled).toBe(true)
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await settle()
    expect(w.emitted('submit')).toBeUndefined()
  })
})

describe('UiCrudDrawer — steps', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const NAMES = ['Groceries', 'Fruit', 'Rules']
  const Levels = defineComponent({
    props: { persistent: Boolean, readonlyAt: { type: Number, default: 2 } },
    setup(p) {
      const depth = ref(0)
      const open = ref(true)
      const body = () =>
        depth.value === 0
          ? [
              h('input', { class: 'name' }),
              h(
                'button',
                { type: 'button', class: 'go', onClick: () => (depth.value = 1) },
                'Fruit',
              ),
            ]
          : depth.value === 1
            ? [
                h('input', { class: 'sub' }),
                h(
                  'button',
                  { type: 'button', class: 'rules', onClick: () => (depth.value = 2) },
                  'Rules',
                ),
              ]
            : [h('input', { class: 'word' })]
      return () =>
        h(
          UiCrudDrawer,
          {
            title: NAMES[depth.value]!,
            open: open.value,
            'onUpdate:open': (v: boolean) => (open.value = v),
            path: NAMES.slice(0, depth.value),
            persistent: p.persistent,
            readonly: depth.value === p.readonlyAt,
            onBack: (to: number) => (depth.value = to),
          },
          { default: body },
        )
    },
  })
  const title = () => panel().querySelector('h2')!.textContent
  const go = async (cls: string) => {
    const el = panel().querySelector<HTMLElement>(cls)!
    el.focus()
    el.click()
    await settle()
  }
  const mountLevels = async (props: Record<string, unknown> = {}) => {
    const w = mount(Levels, { attachTo: document.body, props })
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    return w
  }

  it('at the top there is no way back and no path', async () => {
    await mountLevels()
    expect(panel().querySelector('nav')).toBeNull()
    expect(panel().querySelector('[aria-label^="Back to"]')).toBeNull()
  })

  it('a step shows a back button named by the level above, and no breadcrumb', async () => {
    await mountLevels()
    await go('.go')
    await go('.rules')
    expect(title()).toBe('Rules')
    expect(panel().querySelector('nav')).toBeNull()
    panel().querySelector<HTMLElement>('[aria-label="Back to Fruit"]')!.click()
    await settle()
    expect(title()).toBe('Fruit')
  })

  it('Escape goes one level up; at the top it closes', async () => {
    const w = await mountLevels()
    await go('.go')
    esc()
    await settle()
    expect(title()).toBe('Groceries')
    esc()
    await settle()
    expect(w.findComponent(UiCrudDrawer).emitted('close')).toHaveLength(1)
  })

  it('Cancel at a step goes one up and leaves the drawer open', async () => {
    const w = await mountLevels()
    await go('.go')
    button('Cancel').click()
    await settle()
    expect(title()).toBe('Groceries')
    expect(w.findComponent(UiCrudDrawer).emitted('close')).toBeUndefined()
  })

  it('persistent refuses ‹ and Escape at a step with a shake; Cancel still goes up', async () => {
    await mountLevels({ persistent: true })
    await go('.go')
    panel().querySelector<HTMLElement>('[aria-label="Back to Groceries"]')!.click()
    esc()
    await settle()
    expect(title()).toBe('Fruit')
    expect(panel().classList).toContain('ui-shake')
    button('Cancel').click()
    await settle()
    expect(title()).toBe('Groceries')
  })

  it('a list level keeps its draft: `persistent` while the query is not empty refuses ‹ and the text stays', async () => {
    // A real teleport: the harness's stub is drawn anew on every render and would remount the
    // field each time `persistent` changes, which a browser never does.
    const stubs = config.global.stubs
    config.global.stubs = { transition: true, 'transition-group': true }
    const draft = ref('')
    const depth = ref(1)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCrudDrawer,
            {
              title: 'Contacts',
              open: true,
              path: ['Acme'],
              readonly: true,
              persistent: draft.value !== '',
              onBack: (to: number) => (depth.value = to),
            },
            () =>
              h(UiListField, {
                query: draft.value,
                'onUpdate:query': (v: string) => (draft.value = v),
                existing: [],
              }),
          ),
      }),
      { attachTo: document.body },
    )
    try {
      await settle()
      const input = panel().querySelector('input')!
      input.focus()
      input.value = 'Ann'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await settle()
      expect(document.activeElement).toBe(input)
      panel().querySelector<HTMLElement>('[aria-label="Back to Acme"]')!.click()
      await settle()
      expect([depth.value, input.value]).toEqual([1, 'Ann'])
      expect(panel().classList).toContain('ui-shake')
    } finally {
      w.unmount()
      config.global.stubs = stubs
    }
  })

  it('a step in focuses its first field; the way up gives focus back to the row it left from', async () => {
    await mountLevels()
    await go('.go')
    expect(document.activeElement?.className).toBe('sub')
    esc()
    await settle()
    expect(document.activeElement?.className).toBe('go')
  })

  it('readonly: the footer is only the way back, and Enter sends nothing', async () => {
    const w = await mountLevels()
    await go('.go')
    await go('.rules')
    const footer = panel().querySelector('form > div:last-child')!
    expect(Array.from(footer.querySelectorAll('button')).map((b) => b.textContent?.trim())).toEqual(
      ['Back to Fruit'],
    )
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    expect(w.findComponent(UiCrudDrawer).emitted('submit')).toBeUndefined()
    button('Back to Fruit').click()
    await settle()
    expect(title()).toBe('Fruit')
  })

  it('readonly at the top: no footer, the cross closes', async () => {
    await mountLevels({ readonlyAt: 0 })
    expect(panel().querySelector('[type="submit"]')).toBeNull()
    expect(
      Array.from(panel().querySelectorAll('form button')).some((b) =>
        ['Close', 'Cancel'].includes(b.textContent?.trim() ?? ''),
      ),
    ).toBe(false)
    expect(panel().querySelector('[aria-label="Close"]')).not.toBeNull()
  })

  it('while saving there is no way up either: the request is already out', async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Fruit', open: true, path: ['Groceries'], submitting: true },
      slots: { default: sections },
    })
    await settle()
    panel().querySelector<HTMLElement>('[aria-label="Back to Groceries"]')!.click()
    esc()
    await settle()
    expect(w.emitted('back')).toBeUndefined()
  })
})

describe('UiCrudDrawer — the header', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a status beside the title, own markup in the small line, icon buttons before the cross', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Invoice', open: true },
      slots: {
        default: sections,
        status: () => h('span', { class: 'status' }, 'Paid'),
        description: () => h('span', { class: 'facts' }, 'INV-2041 · 1 250.00 EUR'),
        actions: () => h('button', { type: 'button', 'aria-label': 'Open as a page' }),
      },
    })
    await settle()
    const titleLine = panel().querySelector('h2')!.parentElement!
    expect(titleLine.querySelector('.status')?.textContent).toBe('Paid')
    const line = document.getElementById(panel().getAttribute('aria-describedby')!)!
    expect(line.querySelector('.facts')).not.toBeNull()
    const buttons = Array.from(
      panel().querySelector('h2')!.closest('.px-drawer')!.querySelectorAll('button'),
    )
    expect(buttons.map((b) => b.getAttribute('aria-label')).slice(-2)).toEqual([
      'Open as a page',
      'Close',
    ])
  })

  it('a long title and a long line are cut by UiTruncate, which shows the whole text only when cut', async () => {
    const long = 'Wholesale deliveries to the northern warehouse, second shift'
    mountDrawer({ title: long, description: long })
    await settle()
    // No hand-made `title` tooltip: a short title would have one too.
    expect(panel().querySelector('h2')!.getAttribute('title')).toBeNull()
    expect(panel().querySelector(`[title]`)).toBeNull()
    expect(panel().querySelector('h2 .truncate')!.textContent).toBe(long)
  })

  it('index and total walk the list: ↑ and ↓ emit move, held at the ends', async () => {
    const w = mountDrawer({ index: 0, total: 3 })
    await settle()
    const up = panel().querySelector<HTMLButtonElement>('[aria-label="Previous record"]')!
    const down = panel().querySelector<HTMLButtonElement>('[aria-label="Next record"]')!
    expect(up.disabled).toBe(true)
    down.click()
    expect(w.emitted('move')).toEqual([[1]])
    await w.setProps({ index: 2 })
    await settle()
    expect(panel().querySelector<HTMLButtonElement>('[aria-label="Next record"]')!.disabled).toBe(
      true,
    )
  })

  it('unsaved input or a save on its way refuse to walk the list, with a shake', async () => {
    const w = mountDrawer({ index: 1, total: 3, persistent: true })
    await settle()
    panel().querySelector<HTMLElement>('[aria-label="Next record"]')!.click()
    await nextTick()
    expect(w.emitted('move')).toBeUndefined()
    expect(panel().classList).toContain('ui-shake')
    await w.setProps({ persistent: false, submitting: true })
    await new Promise((r) => setTimeout(r, 450))
    panel().querySelector<HTMLElement>('[aria-label="Previous record"]')!.click()
    expect(w.emitted('move')).toBeUndefined()
  })

  it('a refused walk or close is said inside the drawer, by its reason', async () => {
    const w = mountDrawer({ index: 1, total: 3, persistent: true })
    await settle()
    const region = () => panel().querySelector('[role="status"][data-refusal]')?.textContent
    panel().querySelector<HTMLElement>('[aria-label="Next record"]')!.click()
    await new Promise((r) => setTimeout(r, 120))
    expect(region()).toBe(en['grani.overlay.unsaved'])
    await w.setProps({ persistent: false, submitting: true })
    esc()
    await new Promise((r) => setTimeout(r, 120))
    expect(region()).toBe(en['grani.overlay.busy'])
    expect(w.emitted('move')).toBeUndefined()
    expect(w.emitted('close')).toBeUndefined()
  })

  it('without total there is no list to walk', async () => {
    mountDrawer()
    await settle()
    expect(panel().querySelector('[aria-label="Next record"]')).toBeNull()
  })
})

describe('UiCrudDrawer — one measure to the text', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("a list at a section's edge reaches the line: the section tells its list, a titled one only below", async () => {
    mountDrawer({}, () => [
      h(UiCard, null, () => h('input')),
      h(UiCard, null, () =>
        h(UiList, () => h(UiListItem, { as: 'button', size: 'sm', title: 'Delete' })),
      ),
      h(UiCard, { title: 'Actions' }, () =>
        h(UiList, () => h(UiListItem, { as: 'button', size: 'sm', title: 'Archive' })),
      ),
    ])
    await settle()
    const [bare, titled] = [...panel().querySelectorAll('.ui-sections .ui-list')]
    // The section runs its own first or last child, a list, to its line.
    const reaches = (list: Element, side: 'first' | 'last') =>
      (side === 'first'
        ? list.parentElement!.firstElementChild
        : list.parentElement!.lastElementChild) === list &&
      list.parentElement!.classList.contains(
        side === 'first'
          ? '[&>.ui-list:first-child]:-mt-drawer'
          : '[&>.ui-list:last-child]:-mb-drawer',
      )
    expect(bare!.classList).toContain('-mx-drawer')
    expect(reaches(bare!, 'first')).toBe(true)
    expect(reaches(bare!, 'last')).toBe(true)
    expect(reaches(titled!, 'first')).toBe(false)
    expect(reaches(titled!, 'last')).toBe(true)
    // No rule finds a row by its depth in the section any more.
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).not.toContain('--ui-row-edge')
  })
})

describe('UiCrudDrawer — frames part the sections', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('sections are parted by a line by default, framed cards among them too', async () => {
    mountDrawer({}, () => [
      h(UiCard, null, () => h('input')),
      h(UiCard, null, () =>
        h(UiCard, { padded: false }, () => h(UiListItem, { title: 'Archive' })),
      ),
    ])
    await settle()
    const sections = panel().querySelector('.ui-sections')!
    expect(sections.querySelector('[data-framed]')).not.toBeNull()
    expect(sections.querySelectorAll(':scope > [role="separator"]')).toHaveLength(1)
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).not.toContain(":root .ui-sections:has([data-framed]) > [role='separator']")
  })

  it('divided false parts the sections by their titles and the gap, no line', async () => {
    mountDrawer({ divided: false }, () => [
      h(UiCard, { title: 'Profile' }, () => h('input')),
      h(UiCard, { title: 'Contact' }, () => h('input')),
    ])
    await settle()
    expect(panel().querySelectorAll('.ui-sections > [role="separator"]')).toHaveLength(0)
  })

  it('a flat section is not framed', async () => {
    mountDrawer()
    await settle()
    expect(panel().querySelector('.ui-sections [data-framed]')).toBeNull()
  })
})

describe('UiCrudDrawer — loading geometry', () => {
  it('#loading draws the skeleton of the form that comes, in place of the two default fields', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Northwind', open: true, loading: true },
      slots: { default: () => h('input'), loading: () => h('div', { class: 'own-skeleton' }) },
    })
    await settle()
    expect(panel().querySelector('.own-skeleton')).not.toBeNull()
    expect(panel().querySelector('[role="status"]')!.textContent).toBeTruthy()
  })
})

describe('UiCrudDrawer — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("a backdrop press at a step goes back one level first, as Escape does, so it never discards an ancestor level's unsaved input", async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Contacts', open: true, path: ['Northwind'] },
      slots: { default: sections },
    })
    await settle()
    pressBackdrop()
    await settle()
    expect(w.emitted('back')).toEqual([[0]])
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('while saving at a step the backdrop does nothing either', async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Contacts', open: true, path: ['Northwind'], submitting: true },
      slots: { default: sections },
    })
    await settle()
    pressBackdrop()
    await settle()
    expect(w.emitted('back')).toBeUndefined()
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('divided false warns when a section after a legend has none, and lets the head of a record stand without one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Northwind', open: true, divided: false },
      slots: {
        default: () => [
          h(UiCard, null, () =>
            h('div', [h(UiHeader, { variant: 'legend', title: 'Profile' }), h('input')]),
          ),
          h(UiCard, null, () => h('div', [h('input')])),
        ],
      },
    })
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('one has none'))
    warn.mockClear()
    document.body.innerHTML = ''
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Northwind', open: true, divided: false },
      slots: {
        default: () => [
          h(UiCard, null, () => h('div', [h('input')])),
          h(UiCard, null, () =>
            h('div', [h(UiHeader, { variant: 'legend', title: 'Profile' }), h('input')]),
          ),
        ],
      },
    })
    await settle()
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('one has none'))
    warn.mockRestore()
  })

  it('error: the body says it with Retry, the header keeps the title alone, Save is held, nothing is guarded', async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: {
        title: 'Northwind',
        description: 'client · since 2024',
        open: true,
        persistent: true,
        error: 'The server did not answer.',
      },
      slots: { default: sections, status: () => h('span', { class: 'status' }, 'Active') },
    })
    await settle()
    const alert = panel().querySelector('[role="alert"]')!
    expect(alert.textContent).toContain('Could not load the record')
    expect(alert.textContent).toContain('The server did not answer.')
    expect(panel().querySelector('.status')).toBeNull()
    expect(panel().textContent).not.toContain('client · since 2024')
    expect(panel().querySelector('.name')).toBeNull()
    expect(panel().querySelector<HTMLButtonElement>('[type="submit"]')!.disabled).toBe(true)
    ;[...alert.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Retry')!.click()
    expect(w.emitted('retry')).toHaveLength(1)
    pressBackdrop()
    await settle()
    expect(w.emitted('update:open')).toEqual([[false]])
  })

  it('loading wins over error: the skeleton while the retry runs', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Northwind', open: true, loading: true, error: 'x' },
      slots: { default: sections },
    })
    await settle()
    expect(panel().querySelector('[role="alert"]')).toBeNull()
  })

  it('divided false still warns when the sections come from a v-for (a Fragment vnode)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const titled = [true, false]
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Northwind', open: true, divided: false },
      slots: {
        default: () => [
          h(
            Fragment,
            null,
            titled.map((t) =>
              h(UiCard, null, () =>
                h('div', [
                  t ? h(UiHeader, { variant: 'legend', title: 'Profile' }) : null,
                  h('input'),
                ]),
              ),
            ),
          ),
        ],
      },
    })
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('one has none'))
    warn.mockRestore()
  })

  it('a persistent step refuses the backdrop with a shake too', async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Fruit', open: true, path: ['Groceries'], persistent: true },
      slots: { default: sections },
    })
    await settle()
    pressBackdrop()
    await settle()
    expect(w.emitted('back')).toBeUndefined()
    expect(w.emitted('update:open')).toBeUndefined()
    expect(panel().className).toContain('ui-shake')
  })

  it('after Retry the focus moves to the first field once the record loads', async () => {
    const w = mountDrawer({ error: 'The server did not answer.' })
    await settle()
    await w.setProps({ error: null, loading: true })
    await settle()
    await w.setProps({ loading: false })
    await settle()
    expect(document.activeElement?.className).toBe('name')
  })
})

describe('UiCrudDrawer — size', () => {
  it('is 512 wide by default and 768 at lg', async () => {
    const w = mount(UiCrudDrawer, {
      props: { open: true, title: 'Code', readonly: true },
      attachTo: document.body,
    })
    expect(document.querySelector('.ui-drawer-panel')!.className).toContain('max-w-lg')
    await w.setProps({ size: 'lg' })
    expect(document.querySelector('.ui-drawer-panel')!.className).toContain('max-w-3xl')
    w.unmount()
  })
})

const menuButton = () =>
  Array.from(panel().querySelectorAll<HTMLButtonElement>('button')).find(
    (b) => b.getAttribute('aria-label') === 'More ways to save',
  )
const saveAndNew = async () => {
  menuButton()!.click()
  await settle()
  Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    .find((b) => b.textContent?.trim() === 'Save and add another')!
    .click()
  await settle()
}

describe('UiCrudDrawer — save and add another', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Save carries a menu with Save and new only with saveAnother', async () => {
    mountDrawer()
    await settle()
    expect(menuButton()).toBeUndefined()
    document.body.innerHTML = ''
    mountDrawer({ saveAnother: true })
    await settle()
    const labels = Array.from(panel().querySelectorAll('form > div:last-child button')).map(
      (b) => b.textContent?.trim() || b.getAttribute('aria-label'),
    )
    expect(labels).toEqual(['Cancel', 'Save', 'More ways to save'])
    menuButton()!.click()
    await settle()
    expect(
      Array.from(document.querySelectorAll('[role="menuitem"]')).map((b) => b.textContent?.trim()),
    ).toEqual(['Save and add another'])
  })

  it('it asks with another: true, and Save and Enter with another: false', async () => {
    const w = mountDrawer({ saveAnother: true })
    await settle()
    await saveAndNew()
    await settle()
    await w.setProps({ submitting: true })
    await w.setProps({ submitting: false })
    button('Save').click()
    await w.setProps({ submitting: true })
    await w.setProps({ submitting: false })
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    await settle()
    expect(w.emitted('submit')).toEqual([
      [{ another: true }],
      [{ another: false }],
      [{ another: false }],
    ])
  })

  it('when the save for another ends, the cursor is in the first field of the clean form', async () => {
    const w = mountDrawer({ saveAnother: true })
    await settle()
    await saveAndNew()
    await w.setProps({ submitting: true })
    ;(panel().querySelector('button') as HTMLElement).focus()
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement?.className).toBe('name')
  })

  it('a field the answer marked wins over the clean form', async () => {
    const w = mountDrawer({ saveAnother: true }, () => [
      h(UiCard, { title: 'Main' }, () => [
        h('input', { class: 'name' }),
        h('input', { class: 'phone', 'aria-invalid': 'true' }),
      ]),
    ])
    await settle()
    await saveAndNew()
    await w.setProps({ submitting: true })
    ;(panel().querySelector('button') as HTMLElement).focus()
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement?.className).toBe('phone')
  })

  it('a save for another that failed leaves the filled form and the cursor alone', async () => {
    const w = mountDrawer({ saveAnother: true }, () => [
      h(UiCard, { title: 'Main' }, () => h('input', { class: 'name', value: 'Acme' })),
    ])
    await settle()
    await saveAndNew()
    await w.setProps({ submitting: true })
    ;(document.activeElement as HTMLElement).blur()
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement?.className).not.toBe('name')
  })

  it('closed while the save for another was out, it takes no focus and forgets the flag', async () => {
    const w = mountDrawer({ saveAnother: true })
    await settle()
    await saveAndNew()
    await w.setProps({ submitting: true })
    ;(document.activeElement as HTMLElement).blur()
    await w.setProps({ open: false })
    await w.setProps({ submitting: false })
    await settle()
    expect(document.activeElement?.className).not.toBe('name')
    await w.setProps({ open: true })
    await settle()
    button('Save').click()
    await settle()
    expect(w.emitted('submit')!.at(-1)).toEqual([{ another: false }])
  })

  it('Escape in the open menu closes the menu, not the drawer', async () => {
    const w = mountDrawer({ saveAnother: true })
    await settle()
    menuButton()!.click()
    await settle()
    document
      .querySelector('[role="menu"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(w.emitted('close')).toBeUndefined()
    expect(panel()).not.toBeNull()
    expect(document.activeElement).toBe(menuButton())
  })

  it('while a save is out Save spins and the menu asks for nothing more', async () => {
    const w = mountDrawer({ saveAnother: true })
    await settle()
    await saveAndNew()
    await w.setProps({ submitting: true })
    await settle()
    expect(panel().querySelector('button[type="submit"]')!.getAttribute('aria-busy')).toBe('true')
    menuButton()!.click()
    await settle()
    document.querySelector<HTMLElement>('[role="menuitem"]')?.click()
    await settle()
    expect(w.emitted('submit')).toHaveLength(1)
  })
})

describe('UiCrudDrawer — review follow-ups, second pass', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a refused submit can be sent again after the fix is made with a control that fires no input event', async () => {
    const country = ref<string | null>(null)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCrudDrawer,
            {
              title: 'Client',
              open: true,
              onSubmit: () => {},
            },
            () =>
              h(UiCard, { title: 'Main' }, () => [
                h('input', { class: 'name' }),
                h('button', {
                  type: 'button',
                  role: 'combobox',
                  class: 'country',
                  'aria-invalid': country.value ? undefined : 'true',
                }),
              ]),
          ),
      }),
      { attachTo: document.body },
    )
    await settle()
    const drawer = w.findComponent(UiCrudDrawer)
    panel().querySelector('form')!.requestSubmit()
    await settle()
    expect(drawer.emitted('submit')).toHaveLength(1)
    // The refusal put the focus on the field in error; the person picks a country there.
    expect(document.activeElement?.classList).toContain('country')
    country.value = 'by'
    await settle()
    panel().querySelector('form')!.requestSubmit()
    await settle()
    expect(drawer.emitted('submit')).toHaveLength(2)
  })

  it('the cross at a step refuses with a shake while a level above holds unsaved input', async () => {
    const w = mountDrawer({ path: ['Santa'], persistentAbove: true })
    await settle()
    const cross = panel().querySelector<HTMLButtonElement>('button[aria-label="Close"]')!
    cross.click()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(panel().classList).toContain('ui-shake')
    // It sends the person up a level, not to the cross just refused.
    await new Promise((r) => setTimeout(r, 120))
    expect(panel().querySelector('[role="status"][data-refusal]')?.textContent).toBe(
      en['grani.overlay.unsavedAbove'],
    )
    await w.setProps({ persistentAbove: false })
    cross.click()
    await settle()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('the arrow that reaches the end hands the focus to the other arrow', async () => {
    const w = mountDrawer({ index: 1, total: 3 })
    await settle()
    const next = panel().querySelector<HTMLButtonElement>('button[aria-label="Next record"]')!
    const prev = panel().querySelector<HTMLButtonElement>('button[aria-label="Previous record"]')!
    next.focus()
    await w.setProps({ index: 2 })
    await settle()
    const nextNow = panel().querySelector<HTMLButtonElement>('button[aria-label="Next record"]')!
    expect(nextNow.disabled).toBe(true)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Previous record')
    expect(prev.isConnected || true).toBe(true)
  })

  it('one record has no arrows', async () => {
    mountDrawer({ index: 0, total: 1 })
    await settle()
    expect(panel().querySelector('button[aria-label="Next record"]')).toBeNull()
  })

  it('a step with no field takes the focus on the panel, not on a button that decides', async () => {
    const w = mountDrawer({}, () =>
      h(UiCard, { title: 'Verdict' }, () => [
        h('button', { type: 'button', class: 'approve' }, 'Approve'),
      ]),
    )
    await settle()
    await w.setProps({ path: ['Queue'], readonly: true })
    await settle()
    expect(document.activeElement).toBe(panel())
  })

  it('a step into a form takes the first drawn field, a select too', async () => {
    const w = mountDrawer({}, () =>
      h(UiCard, { title: 'Main' }, () => [
        h(UiSelect, { modelValue: null, items: [], ariaLabel: 'Country' }),
        h('input', { class: 'name' }),
      ]),
    )
    await settle()
    await w.setProps({ path: ['Santa'] })
    await settle()
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
  })

  it('after a failed load the dialog has no aria-describedby', async () => {
    mountDrawer({ error: 'The server did not answer' })
    await settle()
    expect(panel().getAttribute('aria-describedby')).toBeNull()
  })

  it('a data-testid on the drawer lands on the dialog', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Santa', open: true },
      attrs: { 'data-testid': 'client-drawer' },
      slots: { default: sections },
    })
    await settle()
    expect(panel().getAttribute('data-testid')).toBe('client-drawer')
  })

  it('in RTL the back chevron is mirrored and the step slides from the other side', () => {
    const src = readFileSync(resolve(__dirname, 'UiCrudDrawer.vue'), 'utf8')
    expect(src).toContain('rtl:[&_svg]:-scale-x-100')
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    expect(css).toMatch(
      /\[dir='rtl'\] \.ui-drawer-step-in \{\s*animation-name: ui-drawer-step-out;/,
    )
  })

  it('the back and close glyphs stand on the gutter at xs, sm and md', async () => {
    mountDrawer({ path: ['Santa'] })
    await settle()
    const head = panel().querySelector('.border-b')!
    for (const step of ['xs', 'sm', 'md'])
      expect(head.className).toContain(`[&>[data-bare=${step}]:last-child]`)
    expect(head.firstElementChild!.getAttribute('data-bare')).toBeTruthy()
  })

  it('open set to false from outside closes at once: persistent and submitting guard only the drawer’s own exits', async () => {
    const w = mountDrawer({ persistent: true, submitting: true })
    await settle()
    await w.setProps({ open: false })
    await settle()
    expect(document.body.querySelector('.ui-drawer-panel')).toBeNull()
  })
})

describe('UiCrudDrawer — sections parted by legends', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('parted by legends the sections stand 48 apart, by lines the drawer gap', async () => {
    const w = mountDrawer({ divided: false }, () => [
      h(UiCard, null, () => h('input')),
      h(UiCard, null, () => [h(UiHeader, { variant: 'legend', title: 'Billing' }), h('input')]),
    ])
    await settle()
    expect(panel().querySelector('.ui-sections')!.classList).toContain('gap-12')
    await w.setProps({ divided: true })
    await settle()
    expect(panel().querySelector('.ui-sections')!.classList).toContain('gap-drawer')
  })
})

describe('UiCrudDrawer — a long body by keyboard', () => {
  // A record with nothing to fill in (read, not edited) and a long body opens on that body, as the
  // panel it is built on does; a record with a field opens on the field.
  it('a long record with no field opens on its body, one with a field on the field', async () => {
    const box = (el: Element) => el.classList.contains('overflow-y-auto')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return box(this) ? 2000 : 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return box(this) ? 400 : 0
      },
    })
    try {
      const plain = mountDrawer({}, () => [
        h(UiCard, { title: 'Notes' }, () => h('p', 'A long note.')),
      ])
      for (let i = 0; i < 4; i++) await settle()
      expect(document.activeElement).toBe(panel().querySelector('.overflow-y-auto'))
      plain.unmount()
      document.body.innerHTML = ''
      mountDrawer()
      for (let i = 0; i < 4; i++) await settle()
      expect(document.activeElement?.classList.contains('name')).toBe(true)
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a record longer than the panel is a scroll region a keyboard reaches', async () => {
    mountDrawer()
    await settle()
    const body = panel().querySelector<HTMLElement>('.overflow-y-auto')!
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 400 })
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(body.getAttribute('tabindex')).toBe('0')
    expect(body.getAttribute('role')).toBe('region')
  })
})

describe('UiCrudDrawer — review follow-ups, third pass', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const enter = (el: Element, repeat: boolean) =>
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat, bubbles: true, cancelable: true }),
    )
  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

  it('the repeats of an Enter that stepped into a level save nothing there', async () => {
    const sent: unknown[] = []
    const path = ref<string[]>([])
    mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCrudDrawer,
            { open: true, title: 'Invoice', path: path.value, onSubmit: (o) => sent.push(o) },
            () =>
              path.value.length
                ? h('input', { class: 'line' })
                : h(UiListItem, {
                    as: 'button',
                    step: true,
                    title: 'Payments',
                    onClick: () => (path.value = ['Payments']),
                  }),
          ),
      }),
      { attachTo: document.body },
    )
    await settle()
    const row = panel().querySelector<HTMLButtonElement>('button[data-row]')!
    row.focus()
    enter(row, false)
    row.click()
    for (let i = 0; i < 3; i++) await settle()
    expect(document.activeElement?.className).toBe('line')
    enter(document.activeElement!, true)
    panel()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }))
    expect(sent).toEqual([])
  })

  const amountForm = (first: string, amount: string, clear: boolean) => {
    const submitting = ref(false)
    const sum = ref(amount)
    mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCrudDrawer,
            {
              open: true,
              title: 'Payment',
              saveAnother: true,
              submitting: submitting.value,
              onSubmit: async () => {
                submitting.value = true
                await pause(5)
                if (clear) sum.value = ''
                submitting.value = false
              },
            },
            () =>
              h(UiCard, { title: 'Main' }, () => [
                h('input', { class: 'first', value: first }),
                h('input', { class: 'amount', value: sum.value }),
              ]),
          ),
      }),
      { attachTo: document.body },
    )
  }

  it('saved to add another, the cursor goes to the first field though it keeps its default', async () => {
    amountForm('EUR', '100', true)
    await settle()
    await saveAndNew()
    await pause(20)
    await settle()
    expect(document.activeElement?.className).toBe('first')
  })

  it('a save for another that failed leaves the cursor alone though the first field is empty', async () => {
    amountForm('', '100', false)
    await settle()
    await saveAndNew()
    await pause(20)
    await settle()
    expect(document.activeElement?.className).not.toBe('first')
  })

  const record = (o: { error?: string | null; fields?: boolean } = {}) => {
    const loading = ref(false)
    const error = ref<string | null>(o.error ?? null)
    const load = async (fail: boolean) => {
      error.value = null
      loading.value = true
      await pause(10)
      loading.value = false
      error.value = fail ? 'The server did not answer.' : null
    }
    mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCrudDrawer,
            {
              open: true,
              title: 'Order',
              readonly: !o.fields,
              loading: loading.value,
              error: error.value,
              onRetry: () => load(true),
            },
            () =>
              h(UiCard, { padded: false }, () =>
                h(UiList, null, () =>
                  h(UiListItem, {
                    as: 'button',
                    tone: 'danger',
                    title: 'Delete',
                    class: 'delete',
                    onClick: () => load(false),
                  }),
                ),
              ),
          ),
      }),
      { attachTo: document.body },
    )
  }

  it('a Retry that fails again leaves the focus on Retry, not on the page', async () => {
    record({ error: 'The server did not answer.' })
    await settle()
    button('Retry').focus()
    button('Retry').click()
    await pause(40)
    await settle()
    expect(document.activeElement).toBe(button('Retry'))
  })

  it('a record that loads with no field after the focus fell to the page takes it on the panel', async () => {
    record()
    await settle()
    const del = panel().querySelector<HTMLButtonElement>('button.delete')!
    del.focus()
    del.click()
    await pause(40)
    await settle()
    expect(document.activeElement).not.toBe(document.body)
    expect(panel().contains(document.activeElement)).toBe(true)
  })

  it('an index past the end of a list that shrank: up walks to the last record', async () => {
    const w = mountDrawer({ index: 5, total: 3 })
    await settle()
    const up = panel().querySelector<HTMLButtonElement>('[aria-label="Previous record"]')!
    const down = panel().querySelector<HTMLButtonElement>('[aria-label="Next record"]')!
    expect(down.disabled).toBe(true)
    up.click()
    await settle()
    expect(w.emitted('move')).toEqual([[2]])
  })
})

// The arrows walk the list from the record alone; at a step the way up comes first. A level above
// may hold unsaved input, and a walk from a step would drop it.
describe('UiCrudDrawer — the walk is the record’s', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('at a step the arrows are gone, and they are back one level up', async () => {
    const w = mountDrawer({ index: 1, total: 3, path: ['Santa'], persistentAbove: true })
    await settle()
    expect(panel().querySelector('[aria-label="Previous record"]')).toBeNull()
    expect(panel().querySelector('[aria-label="Next record"]')).toBeNull()
    await w.setProps({ path: [] })
    await settle()
    expect(panel().querySelector('[aria-label="Next record"]')).not.toBeNull()
  })
})

// A record deleted from its drawer: the drawer closes, a tick passes, then the row goes. The table
// then hands the focus to the same control of the row now in its place, whichever of the two stands
// first in the app's template.
describe('UiCrudDrawer — delete from the drawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const deleteFrom = async (drawerFirst: boolean) => {
    const rows = ref([
      { id: 1, name: 'Anna' },
      { id: 2, name: 'Boris' },
      { id: 3, name: 'Clara' },
    ])
    const open = ref(false)
    const current = ref(0)
    const remove = async () => {
      open.value = false
      await nextTick()
      rows.value = rows.value.filter((r) => r.id !== current.value)
    }
    const table = () =>
      h(
        UiTable,
        { columns: [{ key: 'name', label: 'Name' }], items: rows.value, rowKey: 'id' },
        {
          'row-actions': ({ row }: { row: { id: number; name: string } }) =>
            h(
              'button',
              {
                type: 'button',
                onClick: () => {
                  current.value = row.id
                  open.value = true
                },
              },
              `Edit ${row.name}`,
            ),
        },
      )
    const drawer = () =>
      h(
        UiCrudDrawer,
        {
          open: open.value,
          'onUpdate:open': (v: boolean) => (open.value = v),
          title: 'Client',
          readonly: true,
        },
        () =>
          h(UiCard, { padded: false }, () =>
            h(UiList, null, () =>
              h(UiListItem, { as: 'button', tone: 'danger', title: 'Delete', onClick: remove }),
            ),
          ),
      )
    mount(
      defineComponent({
        setup: () => () => (drawerFirst ? [drawer(), table()] : [table(), drawer()]),
      }),
      { attachTo: document.body },
    )
    await settle()
    const boris = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Boris',
    )!
    boris.focus()
    boris.click()
    for (let i = 0; i < 3; i++) await settle()
    button('Delete').click()
    for (let i = 0; i < 6; i++) await settle()
    expect(document.activeElement?.textContent).toBe('Edit Clara')
  }

  it('closed, a tick, then the row removed: the focus goes to the next row, the table first', () =>
    deleteFrom(false))

  it('closed, a tick, then the row removed: the focus goes to the next row, the drawer first', () =>
    deleteFrom(true))
})

describe('UiCrudDrawer — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // The first field takes the focus whatever kind it is: a drawn date, a scale, a drop zone and a
  // date range are fields too, and the text box after them is the second.
  it.each([
    ['UiDatePicker', () => h(UiDatePicker, { modelValue: null, ariaLabel: 'First' })],
    ['UiScaleInput', () => h(UiScaleInput, { modelValue: null, ariaLabel: 'First' })],
    ['UiDropzone', () => h(UiDropzone, { modelValue: [], ariaLabel: 'First' })],
    ['UiDateRange', () => h(UiDateRange, { modelValue: null, ariaLabel: 'First' })],
  ])('focus on open goes to the first field when it is a %s', async (_, first) => {
    mountDrawer({}, () => [
      h('div', { class: 'first' }, first()),
      h('input', { class: 'second', 'aria-label': 'Second' }),
    ])
    await settle()
    expect(document.activeElement?.classList.contains('second')).toBe(false)
    expect(panel().querySelector('.first')!.contains(document.activeElement)).toBe(true)
  })
})
