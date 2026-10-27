import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createGrani } from '../plugin'
import UiCard from './UiCard.vue'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiDrawer from './UiDrawer.vue'
import UiHeader from './UiHeader.vue'
import UiModal from './UiModal.vue'
import UiSelect from './UiSelect.vue'
import { en } from '../i18n/en'

// Ticks, then a macrotask: the trap puts the focus back from a timer, and one left over from
// the test before must fire here, not in the middle of the next one.
const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((r) => setTimeout(r))
}
const panels = () => Array.from(document.body.querySelectorAll<HTMLElement>('.ui-drawer-panel'))
const panel = () => panels().at(-1)!
// A panel by its title: the test teleport keeps a nested panel inside its parent's markup.
const titled = (title: string) =>
  panels().find((p) => p.querySelector('h2')?.textContent?.trim() === title)!
const esc = (el: Element) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
const pressBackdrop = () =>
  panel()
    .parentElement!.querySelector('.ui-drawer-backdrop')!
    .dispatchEvent(new Event('pointerdown', { bubbles: true }))
const cross = () => panel().querySelector<HTMLElement>('[aria-label="Close"]')!
// Vue drops a click in the millisecond its listener was attached (`_vts`), and the cross is a
// UiIconButton, whose capture listener stamps the event first.
const clickCross = async () => {
  await new Promise((r) => setTimeout(r, 2))
  cross().click()
}

const mountDrawer = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {
    default: () => [h('label', ['Name', h('input', { class: 'name' })])],
  },
) =>
  mount(UiDrawer, {
    attachTo: document.body,
    props: { title: 'View settings', open: true, ...props },
    slots,
  })

describe('UiDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })

  it('is a modal dialog named by its title and described by its description', async () => {
    mountDrawer({ description: 'Applies at once' })
    await settle()
    const d = panel()
    expect(d.getAttribute('role')).toBe('dialog')
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent?.trim()).toBe(
      'View settings',
    )
    expect(document.getElementById(d.getAttribute('aria-describedby')!)!.textContent?.trim()).toBe(
      'Applies at once',
    )
  })

  it('without a description it is described by nothing', async () => {
    mountDrawer()
    await settle()
    expect(panel().hasAttribute('aria-describedby')).toBe(false)
  })

  it('#description takes the line under the title and describes the panel', async () => {
    mountDrawer(
      {},
      { default: () => 'Body', description: () => h('span', { class: 'facts' }, 'INV-2041') },
    )
    await settle()
    const line = document.getElementById(panel().getAttribute('aria-describedby')!)!
    expect(line.querySelector('.facts')?.textContent).toBe('INV-2041')
  })

  it('Escape, the backdrop and the cross close it and say so', async () => {
    for (const how of ['escape', 'backdrop', 'cross'] as const) {
      const w = mountDrawer()
      await settle()
      if (how === 'escape') esc(document.activeElement!)
      if (how === 'backdrop') pressBackdrop()
      if (how === 'cross') await clickCross()
      await settle()
      expect(w.emitted('close'), how).toHaveLength(1)
      expect(w.emitted('update:open'), how).toEqual([[false]])
      w.unmount()
    }
  })

  it('a press that starts in the panel does not close it', async () => {
    const w = mountDrawer()
    await settle()
    panel()
      .querySelector('.name')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(w.emitted('close')).toBeUndefined()
  })

  it('persistent refuses the backdrop and Escape with a shake; the cross still closes', async () => {
    const w = mountDrawer({ persistent: true })
    await settle()
    esc(document.activeElement!)
    pressBackdrop()
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(panel().classList).toContain('ui-shake')
    await clickCross()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('a refused close is said inside the drawer', async () => {
    const w = mountDrawer({ persistent: true })
    await settle()
    esc(document.activeElement!)
    await new Promise((r) => setTimeout(r, 120))
    expect(panel().querySelector('[role="status"][data-refusal]')?.textContent).toBe(
      en['grani.overlay.unsaved'],
    )
    expect(w.emitted('close')).toBeUndefined()
  })

  it('submitting refuses the cross, the backdrop and Escape', async () => {
    const w = mountDrawer({ submitting: true })
    await settle()
    cross().click()
    pressBackdrop()
    esc(panel())
    await settle()
    expect(w.emitted('close')).toBeUndefined()
    expect(panel().classList).toContain('ui-shake')
  })

  it('focus goes to the first field, not the cross; without fields to the panel', async () => {
    mountDrawer()
    await settle()
    expect(document.activeElement?.className).toBe('name')
    document.body.innerHTML = ''
    mountDrawer({}, { default: () => h('p', 'Paid on Sep 12') })
    await settle()
    expect(document.activeElement).toBe(panel())
  })

  it('focus returns to the opener on close', async () => {
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

  it('the page does not scroll under it until it closes', async () => {
    const w = mountDrawer()
    await settle()
    expect(document.body.style.overflow).toBe('hidden')
    await w.setProps({ open: false })
    expect(document.body.style.overflow).toBe('')
  })

  it('Escape closes only the layer on top: a window over the drawer first', async () => {
    const drawer = mountDrawer()
    const modal = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Confirm', open: true },
      slots: { default: () => h('input', { class: 'inner' }) },
    })
    await settle()
    esc(panel().querySelector('.name')!)
    await settle()
    expect(drawer.emitted('close')).toBeUndefined()
    esc(document.body.querySelector('.inner')!)
    await settle()
    expect(modal.emitted('close')).toHaveLength(1)
    expect(drawer.emitted('close')).toBeUndefined()
  })

  it('goes to the place the app names in `teleport`', async () => {
    const target = document.createElement('div')
    document.body.append(target)
    mount(UiDrawer, {
      attachTo: document.body,
      props: { title: 'Panel', open: true },
      slots: { default: () => 'inside' },
      global: { plugins: [createGrani({ teleport: target })], stubs: { teleport: false } },
    })
    await settle()
    expect(target.querySelector('.ui-drawer-panel')?.textContent).toContain('inside')
  })

  it('attributes land on the dialog, not on the teleport', async () => {
    mount(UiDrawer, {
      attachTo: document.body,
      props: { title: 'Note', open: true },
      attrs: { 'data-testid': 'note-drawer' },
      slots: { default: () => 'Body' },
    })
    await settle()
    expect(panel().getAttribute('data-testid')).toBe('note-drawer')
  })

  it('no #footer, no footer: the cross is the way out', async () => {
    mountDrawer()
    await settle()
    expect(panel().querySelector('.border-t')).toBeNull()
    expect(panel().querySelectorAll('button')).toHaveLength(1)
  })

  it('a footer under its line, its buttons sharing the width, on the drawer gutter', async () => {
    mountDrawer(
      {},
      {
        default: () => 'Body',
        footer: () => [h('button', 'Cancel'), h('button', 'Apply')],
      },
    )
    await settle()
    const footer = panel().querySelector('.border-t')!
    expect(footer.textContent).toContain('Apply')
    for (const c of ['px-drawer', 'py-4', 'gap-4', 'auto-cols-[minmax(0,1fr)]'])
      expect(footer.classList).toContain(c)
    expect(panel().querySelector('.overflow-y-auto')!.classList).toContain('p-drawer')
    const header = panel().querySelector('h2')!.closest('.px-drawer')!
    expect(header.classList).toContain('pt-4')
    expect(header.classList).toContain('pb-4')
  })

  it('#actions stand before the cross', async () => {
    mountDrawer(
      {},
      { default: () => 'Body', actions: () => h('button', { 'aria-label': 'Open as a page' }) },
    )
    await settle()
    const buttons = [
      ...panel().querySelector('h2')!.closest('.px-drawer')!.querySelectorAll('button'),
    ]
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Open as a page', 'Close'])
  })

  it('width: md by default, lg for what reads wide', async () => {
    const w = mountDrawer()
    await settle()
    expect(panel().classList).toContain('max-w-lg')
    await w.setProps({ size: 'lg' })
    expect(panel().classList).toContain('max-w-3xl')
  })

  it('its sections are flat cards with a line between, none before a legend', async () => {
    mountDrawer(
      {},
      {
        default: () => [
          h(UiCard, { title: 'Columns' }, () => h('input')),
          h(UiCard, null, () => h('input')),
          h(UiCard, null, () => [h(UiHeader, { variant: 'legend', title: 'Density' }), h('input')]),
        ],
      },
    )
    await settle()
    const sections = panel().querySelector('.ui-sections')!
    expect(sections.querySelectorAll(':scope > [role="separator"]')).toHaveLength(1)
    expect(sections.querySelector('[data-framed]')).toBeNull()
    expect(sections.querySelector('h3')?.textContent?.trim()).toBe('Columns')
  })

  it('a body that opens with a legend draws no line under the header', async () => {
    mountDrawer(
      {},
      {
        default: () =>
          h(UiCard, null, () => [h(UiHeader, { variant: 'legend', title: 'Density' }), h('input')]),
      },
    )
    await settle()
    expect(panel().querySelector('h2')!.closest('.px-drawer')!.classList).not.toContain('border-b')
  })

  it('a long title stays on one line, whole for the reader', async () => {
    const long = 'Settings of the view of every open invoice of the quarter, by client and by date'
    mountDrawer({ title: long })
    await settle()
    expect(panel().querySelector('h2 .truncate')!.textContent).toBe(long)
  })

  it('Escape closes the list of a select inside first; a second Escape closes the panel', async () => {
    const w = mountDrawer(
      {},
      {
        default: () =>
          h(UiSelect, {
            modelValue: null,
            items: [{ value: 'nl', label: 'Netherlands' }],
            ariaLabel: 'Country',
          }),
      },
    )
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    panel().querySelector<HTMLElement>('[role="combobox"]')!.click()
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull()
    esc(document.activeElement!)
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    expect(w.emitted('close')).toBeUndefined()
    esc(document.activeElement!)
    await settle()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('a drawer opened over another drawer warns once in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountDrawer()
    mountDrawer({ title: 'Second' })
    mount(UiCrudDrawer, { attachTo: document.body, props: { title: 'Record', open: true } })
    await settle()
    const nested = warn.mock.calls.filter(([m]) => String(m).includes('over another drawer'))
    expect(nested).toHaveLength(1)
    warn.mockRestore()
  })

  it('a window over a drawer does not warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountDrawer()
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Confirm', open: true },
      slots: { default: () => 'Sure?' },
    })
    await settle()
    expect(warn.mock.calls.some(([m]) => String(m).includes('over another drawer'))).toBe(false)
    warn.mockRestore()
  })

  it('a record inside a plain drawer has its own form; the plain drawer has none', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountDrawer(
      {},
      {
        default: () =>
          h(UiCrudDrawer, { title: 'Record', open: true }, () => h('input', { class: 'inner' })),
      },
    )
    await settle()
    const outer = titled('View settings')
    const inner = titled('Record')
    expect(outer.querySelector(':scope > form')).toBeNull()
    expect(inner.querySelector(':scope > form')).not.toBeNull()
    warn.mockRestore()
  })

  it('a plain drawer inside a record stays plain: no form, its own Escape closes it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const record = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Record', open: true, path: ['Groceries'] },
      slots: {
        default: () =>
          h(UiDrawer, { title: 'Help', open: true }, () => h('input', { class: 'help' })),
      },
    })
    await settle()
    const plain = titled('Help')
    expect(plain.querySelector(':scope > form')).toBeNull()
    expect(plain.querySelectorAll('[aria-label^="Back to"]')).toHaveLength(0)
    esc(plain.querySelector('.help')!)
    await settle()
    expect(record.emitted('back')).toBeUndefined()
    const help = record.findAllComponents(UiDrawer).find((d) => d.props('title') === 'Help')!
    expect(help.emitted('close')).toHaveLength(1)
    warn.mockRestore()
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

describe('UiDrawer — a long body takes the first focus', () => {
  // A long text with nothing to fill in is opened to be read: the arrows scroll it at once,
  // without two Tabs over the cross first (owner, 18.10.2026; WAI-ARIA for long dialogs).
  it('with no field, the long body takes the focus as it opens', async () => {
    const restore = longBodies()
    try {
      mount(UiDrawer, {
        attachTo: document.body,
        props: { title: 'Terms of the service', open: true },
        slots: { default: () => h('p', 'A long text with nothing to focus in it.') },
      })
      for (let i = 0; i < 4; i++) await settle()
      const body = panel().querySelector<HTMLElement>('.overflow-y-auto')!
      expect(body.getAttribute('tabindex')).toBe('0')
      expect(document.activeElement).toBe(body)
    } finally {
      restore()
    }
  })

  it('with a field, the field takes it, however long the body', async () => {
    const restore = longBodies()
    try {
      mount(UiDrawer, {
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

describe('UiDrawer — a long body by keyboard', () => {
  const overflow = (el: HTMLElement, content: number, box: number) => {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: content })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: box })
    window.dispatchEvent(new Event('resize'))
  }

  it('a body longer than the panel is a scroll region a keyboard reaches, named by the title', async () => {
    mount(UiDrawer, {
      attachTo: document.body,
      props: { title: 'Release notes', open: true },
      slots: { default: () => h('p', 'A long text with nothing to focus in it.') },
    })
    await settle()
    const body = panel().querySelector<HTMLElement>('.overflow-y-auto')!
    overflow(body, 2000, 400)
    await settle()
    expect(body.getAttribute('tabindex')).toBe('0')
    expect(body.getAttribute('role')).toBe('region')
    expect(body.getAttribute('aria-labelledby')).toBe(panel().getAttribute('aria-labelledby'))
    overflow(body, 400, 400)
    await settle()
    expect(body.hasAttribute('tabindex')).toBe(false)
  })

  // A panel's height is the screen's, so a list that grows inside it resizes nothing the panel
  // watches: the rows added are what tells it the body now runs past its edge.
  it('a body that grows by new rows becomes a scroll region, with no resize of the window', async () => {
    const rows = ref(['First note'])
    // The list is the app's own state, rendered by its own component into the panel.
    const App = defineComponent(
      () => () =>
        h(
          UiDrawer,
          { title: 'Release notes', open: true },
          { default: () => rows.value.map((r) => h('p', { key: r }, r)) },
        ),
    )
    mount(App, { attachTo: document.body })
    await settle()
    const body = panel().querySelector<HTMLElement>('.overflow-y-auto')!
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(body, 'scrollHeight', {
      configurable: true,
      get: () => body.querySelectorAll('p').length * 300,
    })
    rows.value = ['First note', 'Second note', 'Third note']
    await settle()
    expect(body.querySelectorAll('p')).toHaveLength(3)
    expect(body.getAttribute('tabindex')).toBe('0')
  })

  // The focus is never left on a plain box: a body that fits again while it holds the focus stays a
  // stop until the focus leaves it.
  it('a body that stops overflowing while it holds the focus keeps it, and becomes plain once left', async () => {
    mount(UiDrawer, {
      attachTo: document.body,
      props: { title: 'Release notes', open: true },
      slots: { default: () => h('p', 'A long text with nothing to focus in it.') },
    })
    await settle()
    const body = panel().querySelector<HTMLElement>('.overflow-y-auto')!
    overflow(body, 2000, 400)
    await settle()
    body.focus()
    overflow(body, 400, 400)
    await settle()
    expect(document.activeElement).toBe(body)
    expect(body.getAttribute('tabindex')).toBe('0')
    expect(body.getAttribute('role')).toBe('region')
    panel().querySelector<HTMLElement>('button')!.focus()
    await settle()
    expect(body.hasAttribute('tabindex')).toBe(false)
  })
})
