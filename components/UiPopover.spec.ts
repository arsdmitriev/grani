import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { anchorPosition } from '../utils/anchorPosition'
import { createApp, createSSRApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createGrani } from '../plugin'
import { SlidersHorizontal } from '@lucide/vue'
import UiPopover from './UiPopover.vue'
import UiCard from './UiCard.vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiIconButton from './UiIconButton.vue'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiSelect from './UiSelect.vue'
import UiModal from './UiModal.vue'
import UiFilterList from './UiFilterList.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]:not([aria-modal])')
const trigger = () => document.body.querySelector<HTMLElement>('.trigger')!
const key = (el: Element, k: string, shiftKey = false) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }),
  )

const controls = ({ close }: { close: () => void }) => [
  h('label', [h('input', { type: 'checkbox', class: 'paid' }), 'Paid']),
  h('label', [h('input', { type: 'checkbox', class: 'due' }), 'Due']),
  h('button', { type: 'button', class: 'apply', onClick: close }, 'Apply'),
]

// Vue drops a click in the very millisecond its listener was attached (`_vts`), and a
// UiButton's capture listener stamps the event first: a click right after mount is lost.
const tick = () => new Promise((r) => setTimeout(r, 2))
const mountPopover = async (
  props: Record<string, unknown> = {},
  body: (s: { close: () => void }) => unknown = controls,
  triggerSlot: () => unknown = () => h('button', { class: 'trigger' }, 'Status'),
  attrs: Record<string, unknown> = {},
) => {
  const w = mount(UiPopover, {
    attachTo: document.body,
    props,
    attrs,
    slots: { trigger: triggerSlot, default: body },
  })
  await tick()
  return w
}

describe('UiPopover', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })

  it('the button announces a dialog; the panel is named by the button and has no heading', async () => {
    await mountPopover()
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
    trigger().click()
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id)
    expect(panel()!.getAttribute('aria-labelledby')).toBe(trigger().id)
    expect(panel()!.querySelector('h2')).toBeNull()
  })

  it('focus goes to the first control and Tab goes round inside', async () => {
    await mountPopover()
    trigger().click()
    await settle()
    expect(document.activeElement?.className).toBe('paid')
    const apply = panel()!.querySelector<HTMLElement>('.apply')!
    apply.focus()
    key(apply, 'Tab')
    expect(document.activeElement?.className).toBe('paid')
    key(document.activeElement!, 'Tab', true)
    expect(document.activeElement).toBe(apply)
  })

  it('a panel of buttons opens on its first button', async () => {
    await mountPopover({}, () => [
      h('button', { type: 'button', class: 'reset' }, 'Reset'),
      h('button', { type: 'button' }, 'Done'),
    ])
    trigger().click()
    await settle()
    expect(document.activeElement?.className).toBe('reset')
  })

  it('Escape and close() from inside return focus to the button', async () => {
    await mountPopover()
    trigger().click()
    await settle()
    key(document.activeElement!, 'Escape')
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger())
    trigger().click()
    await settle()
    panel()!.querySelector<HTMLElement>('.apply')!.click()
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('a click outside closes it and leaves focus where it went; the page is not locked', async () => {
    const other = document.createElement('input')
    document.body.appendChild(other)
    await mountPopover()
    trigger().click()
    await settle()
    expect(document.body.style.overflow).toBe('')
    other.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    other.focus()
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(other)
  })

  it('sections are flat cards with a separator across the panel, even from a button group', async () => {
    await mountPopover(
      {},
      () => [
        h(UiCard, { title: 'Status' }, () => h('input', { type: 'checkbox' })),
        h(UiCard, { title: 'Channel' }, () => h('input', { type: 'checkbox' })),
      ],
      () =>
        h(UiButtonGroup, { ariaLabel: 'Filters' }, () => [
          h('button', { class: 'trigger' }, 'Filter'),
        ]),
    )
    trigger().click()
    await settle()
    const p = panel()!
    expect(p.querySelectorAll('h3')).toHaveLength(2)
    expect(p.querySelector('.rounded-card')).toBeNull()
    expect(p.querySelector('[role="separator"]')!.getAttribute('aria-orientation')).toBe(
      'horizontal',
    )
  })

  it('an icon button works as the trigger', async () => {
    await mountPopover({}, controls, () =>
      h(UiIconButton, { icon: SlidersHorizontal, ariaLabel: 'Columns', class: 'trigger' }),
    )
    expect(trigger().tagName).toBe('BUTTON')
    trigger().click()
    await settle()
    expect(panel()!.getAttribute('aria-labelledby')).toBe(trigger().id)
    key(document.activeElement!, 'Escape')
    await settle()
    expect(document.activeElement).toBe(trigger())
  })

  it('opened from a drawer: focus may sit in the panel, Escape closes the panel only', async () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Santa', open: true },
      slots: {
        default: () =>
          h(UiPopover, null, {
            trigger: () => h('button', { type: 'button', class: 'trigger' }, 'Tags'),
            default: controls,
          }),
      },
    })
    await settle()
    trigger().click()
    await settle()
    expect(document.activeElement?.className).toBe('paid')
    key(document.activeElement!, 'Escape')
    await settle()
    expect(panel()).toBeNull()
    expect(w.emitted('close')).toBeUndefined()
    expect(document.activeElement).toBe(trigger())
  })
})

describe('UiPopover — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const pointer = (el: Element) =>
    el.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))

  it('a pick in a select inside the panel lands and the panel stays open', async () => {
    let picked: unknown = null
    const w = mount(UiPopover, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Status'),
        default: () =>
          h(UiSelect, {
            modelValue: null,
            items: [
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ],
            ariaLabel: 'Pick',
            'onUpdate:modelValue': (v: unknown) => (picked = v),
          }),
      },
    })
    await tick()
    trigger().click()
    await settle()
    const combo = panel()!.querySelector<HTMLElement>('[role="combobox"]')!
    combo.click()
    await settle()
    const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find((o) =>
      o.textContent?.includes('B'),
    )!
    const list = option.closest<HTMLElement>('[role="listbox"]')!.closest<HTMLElement>('.fixed')!
    // Anything opened from the panel paints above it.
    expect(Number(list.style.zIndex)).toBeGreaterThan(Number(panel()!.style.zIndex))
    pointer(option)
    option.click()
    await settle()
    expect(picked).toBe('b')
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('a press outside everything closes the whole chain at once', async () => {
    const w = mount(UiPopover, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Status'),
        default: () =>
          h(UiSelect, { modelValue: null, items: [{ value: 'a', label: 'A' }], ariaLabel: 'Pick' }),
      },
    })
    await tick()
    trigger().click()
    await settle()
    panel()!.querySelector<HTMLElement>('[role="combobox"]')!.click()
    await settle()
    const outside = document.createElement('div')
    document.body.append(outside)
    pointer(outside)
    await settle()
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('a panel taller than the window scrolls inside itself', async () => {
    await mountPopover()
    trigger().click()
    await settle()
    expect(panel()!.className).toContain(
      'max-h-[min(calc(100dvh-1rem),var(--ui-panel-room,100dvh))]',
    )
    // The body scrolls, the footer stays in view.
    expect(panel()!.firstElementChild!.className).toContain('overflow-y-auto')
  })

  it('a style from the caller caps the panel without losing its position', async () => {
    await mountPopover({}, controls, undefined, { style: 'max-height: 250px' })
    trigger().click()
    await settle()
    expect(panel()!.style.maxHeight).toBe('250px')
    expect(panel()!.style.top).not.toBe('')
  })

  it('a list first or last in the panel reaches that edge, as a dropdown does', async () => {
    const items = [{ value: 'a', label: 'A' }]
    const only = mount(UiPopover, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Columns'),
        default: () => h(UiFilterList, { items, modelValue: [], ariaLabel: 'Columns' }),
      },
    })
    await tick()
    trigger().click()
    await settle()
    const body = panel()!.firstElementChild!
    expect(body.className).toContain('has-[>[data-list-top]:first-child]:pt-0')
    expect(body.className).toContain('has-[>[data-list-bottom]:last-child]:pb-0')
    const list = body.firstElementChild!
    expect(list.hasAttribute('data-list-top')).toBe(true)
    expect(list.hasAttribute('data-list-bottom')).toBe(true)
    only.unmount()
  })

  it('lists in flat sections meet the panel edges and the lines between them', async () => {
    const items = [{ value: 'a', label: 'A' }]
    mount(UiPopover, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Filters'),
        default: () => [
          h(UiCard, null, () => h(UiFilterList, { items, modelValue: [], ariaLabel: 'One' })),
          h(UiCard, null, () => h(UiFilterList, { items, modelValue: [], ariaLabel: 'Two' })),
        ],
      },
    })
    await tick()
    trigger().click()
    await settle()
    const body = panel()!.firstElementChild!
    const [first, line, second] = [...body.children]
    expect(line!.getAttribute('role')).toBe('separator')
    // The card's body is its first and last child, and the list the body's: the selectors hold.
    expect(first!.firstElementChild!.firstElementChild!.hasAttribute('data-list-top')).toBe(true)
    expect(second!.lastElementChild!.lastElementChild!.hasAttribute('data-list-bottom')).toBe(true)
    const cls = body.className
    expect(cls).toContain('has-[>:first-child>:first-child>[data-list-top]:first-child]:pt-0')
    expect(cls).toContain('has-[>:last-child>:last-child>[data-list-bottom]:last-child]:pb-0')
    expect(cls).toContain(
      '[&>[role=separator]+*:has(>:first-child>[data-list-top]:first-child)]:-mt-overlay',
    )
    expect(cls).toContain(
      '[&>*:has(>:last-child>[data-list-bottom]:last-child):has(+[role=separator])]:-mb-overlay',
    )
  })

  it('actions stand in a footer under a line, out of the scrolling body, and get close', async () => {
    mount(UiPopover, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Status'),
        default: controls,
        footer: ({ close }: { close: () => void }) =>
          h('button', { type: 'button', class: 'ok', onClick: close }, 'Apply'),
      },
    })
    await tick()
    trigger().click()
    await settle()
    const footer = panel()!.lastElementChild!
    expect(footer.className).toContain('border-t')
    expect(footer.querySelector('.ok')).not.toBeNull()
    expect(panel()!.firstElementChild!.querySelector('.ok')).toBeNull()
    footer.querySelector<HTMLElement>('.ok')!.click()
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('focus goes to the first list, not to a search further down', async () => {
    const few = [{ value: 'a', label: 'A' }]
    const many = Array.from({ length: 7 }, (_, i) => ({ value: `v${i}`, label: `V ${i}` }))
    mount(UiPopover, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Filters'),
        default: () => [
          h(UiCard, null, () => h(UiFilterList, { items: few, modelValue: [], ariaLabel: 'S' })),
          h(UiCard, null, () => h(UiFilterList, { items: many, modelValue: [], ariaLabel: 'C' })),
        ],
      },
    })
    await tick()
    trigger().click()
    await settle()
    expect(document.activeElement?.getAttribute('role')).toBe('listbox')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('S')
  })

  it('v-model:open opens it from outside and reports every close', async () => {
    const w = await mountPopover()
    await w.setProps({ open: true })
    await settle()
    expect(panel()).not.toBeNull()
    key(document.activeElement!, 'Escape')
    await settle()
    expect(w.emitted('update:open')!.at(-1)).toEqual([false])
    expect(document.activeElement).toBe(trigger())
    trigger().click()
    await settle()
    expect(w.emitted('update:open')!.at(-1)).toEqual([true])
  })

  it('a press inside a window opened from the panel keeps the panel; a press outside every layer closes it', async () => {
    const modalOpen = ref(false)
    mount(
      defineComponent({
        setup: () => () =>
          h(UiPopover, null, {
            trigger: () => h('button', { class: 'trigger' }, 'Status'),
            default: () => [
              h('button', { class: 'ask', onClick: () => (modalOpen.value = true) }, 'Ask'),
              h(
                UiModal,
                {
                  open: modalOpen.value,
                  title: 'Sure?',
                  'onUpdate:open': (v: boolean) => (modalOpen.value = v),
                },
                () => h('p', { class: 'inside' }, 'Text'),
              ),
            ],
          }),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    )
    await tick()
    trigger().click()
    await settle()
    document.body.querySelector<HTMLElement>('.ask')!.click()
    await settle()
    pointer(document.body.querySelector('.inside')!)
    await settle()
    expect(panel()).not.toBeNull()
    const outside = document.createElement('div')
    document.body.append(outside)
    pointer(outside)
    await settle()
    expect(panel()).toBeNull()
  })

  it('class and data-testid land on the panel', async () => {
    await mountPopover({}, controls, undefined, { class: 'mine', 'data-testid': 'pop' })
    trigger().click()
    await settle()
    expect(panel()!.classList.contains('mine')).toBe(true)
    expect(panel()!.getAttribute('data-testid')).toBe('pop')
  })
})

describe('UiPopover — review follow-ups, second pass', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a popover mounted open finds its button, is visible and takes focus', async () => {
    await mountPopover({ open: true })
    await settle()
    await new Promise((r) => setTimeout(r, 20))
    expect(panel()!.style.visibility).not.toBe('hidden')
    expect(panel()!.contains(document.activeElement)).toBe(true)
  })

  it('Escape that cancels an IME candidate does not close the panel', async () => {
    await mountPopover()
    trigger().click()
    await settle()
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }),
    )
    await settle()
    expect(panel()).not.toBeNull()
  })

  it('a select before a text field takes the first focus; a switch too', async () => {
    await mountPopover({}, () => [
      h('button', { type: 'button', role: 'combobox', class: 'pick' }, 'Country'),
      h('input', { class: 'name' }),
    ])
    trigger().click()
    await settle()
    expect(document.activeElement?.classList).toContain('pick')
    document.body.innerHTML = ''
    await mountPopover({}, () => [
      h('button', { type: 'button', role: 'switch', class: 'flip', 'aria-checked': 'false' }),
      h('input', { class: 'name' }),
    ])
    trigger().click()
    await settle()
    expect(document.activeElement?.classList).toContain('flip')
  })

  it('a panel taller than the room beside the button is capped to it and does not cover the button', () => {
    const at = anchorPosition({
      trigger: { top: 300, bottom: 336, left: 20, right: 120, width: 100 },
      panel: { width: 240, height: 450 },
      viewport: { width: 1000, height: 700 },
      capToRoom: true,
    })
    expect(at.placement).toBe('below')
    expect(at.top).toBeGreaterThanOrEqual(336)
    expect(at.room).toBe(700 - 336 - 6 - 8)
  })

  it('closed from outside, focus goes back to the button when it was in the panel', async () => {
    // The host owns `v-model:open`, as a date field does, and closes it itself.
    const w: ReturnType<typeof mount> = await mountPopover({
      open: false,
      'onUpdate:open': (v: boolean) => w.setProps({ open: v }),
    })
    trigger().click()
    await settle()
    expect(panel()!.contains(document.activeElement)).toBe(true)
    await w.setProps({ open: false })
    await settle()
    expect(document.activeElement).toBe(trigger())
  })

  it('a footer that draws nothing draws no bar', async () => {
    const canApply = () => false
    mount(UiPopover, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Status'),
        default: controls,
        // An Apply behind a v-if that is off.
        footer: () => (canApply() ? h('button', 'Apply') : null),
      },
    })
    await new Promise((r) => setTimeout(r, 2))
    trigger().click()
    await settle()
    expect(panel()!.querySelector('.border-t')).toBeNull()
  })

  it('a caller id does not detach aria-controls', async () => {
    await mountPopover({}, controls, undefined, { id: 'mine' })
    trigger().click()
    await settle()
    expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id)
  })

  it('UiMenu stands on the panel core UiPopover stands on', () => {
    for (const file of ['UiMenu.vue', 'UiPopover.vue']) {
      const src = readFileSync(resolve(__dirname, file), 'utf8')
      expect(src, file).toContain('usePanel(')
      expect(src, file).not.toContain('useAnchoredPanel')
    }
  })
})

describe('UiPopover — review follow-ups', () => {
  const apps: App[] = []
  afterEach(() => {
    apps.splice(0).forEach((app) => app.unmount())
    document.body.innerHTML = ''
  })
  // An app of its own with one popover; the button's id comes from the app's `idPrefix`.
  const appWith = async (idPrefix?: string) => {
    const app = createApp({
      render: () =>
        h(UiPopover, null, {
          trigger: () => h('button', { class: 'trigger' }, 'Status'),
          default: () => h('p', 'Body'),
        }),
    })
    if (idPrefix) app.config.idPrefix = idPrefix
    app.use(createGrani())
    const root = document.body.appendChild(document.createElement('div'))
    app.mount(root)
    apps.push(app)
    await tick()
    return root.querySelector<HTMLElement>('.trigger')!
  }

  it('two apps that share an idPrefix are told so when a button is looked up', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = await appWith()
    const second = await appWith()
    // The premise: Vue counts ids per app, so the two buttons carry one id.
    expect(second.id).toBe(first.id)
    second.click()
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('idPrefix'))
    warn.mockRestore()
  })

  it('apps with an idPrefix each open at their own button, and nothing is said', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await appWith('one')
    const second = await appWith('two')
    second.click()
    await settle()
    expect(panel()).not.toBeNull()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('UiPopover — open from the first render on a server', () => {
  // An app that renders on a server with the panel open (a filter the address names) sends a
  // dialog the browser hydrates: it is named by its button from the start, as on a client.
  it.each([
    ['its own id', { id: 'filters-button' }],
    ['the id it is given', {}],
  ])('the panel is named by its button, %s', async (_, own) => {
    const App = defineComponent(
      () => () =>
        h(
          UiPopover,
          { open: true },
          {
            trigger: () => h('button', { type: 'button', ...own }, 'Filters'),
            default: () => h('button', { type: 'button' }, 'Apply'),
          },
        ),
    )
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    const ctx: SSRContext = {}
    let html: string
    try {
      html = await renderToString(createSSRApp(App), ctx)
    } finally {
      vi.unstubAllGlobals()
    }
    const page = document.createElement('div')
    page.innerHTML = html + (ctx.teleports?.body ?? '')
    const button = page.querySelector('button[aria-haspopup]')!
    const panel = page.querySelector('[role="dialog"]')
    expect(panel?.getAttribute('aria-labelledby')).toBe(button.id)
    expect(button.id).not.toBe('')
  })
})
