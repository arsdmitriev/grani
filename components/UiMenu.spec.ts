import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { Ellipsis } from '@lucide/vue'
import UiMenu from './UiMenu.vue'
import UiListItem from './UiListItem.vue'
import UiSeparator from './UiSeparator.vue'
import UiIconButton from './UiIconButton.vue'
import UiCrudDrawer from './UiCrudDrawer.vue'
import { useOverlayStack } from '../composables/useOverlayStack'
import { settle } from '../test/settle'

const menu = () => document.body.querySelector<HTMLElement>('[role="menu"]')
const items = () => Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'))
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const mouseClick = (el: Element) =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))

const mountMenu = (
  opts: {
    onRun?: (name: string) => void
    extra?: Record<string, unknown>
    trigger?: () => unknown
  } = {},
) =>
  mount(UiMenu, {
    attachTo: document.body,
    slots: {
      trigger: opts.trigger ?? (() => h('button', { class: 'trigger' }, 'Export')),
      default: () => [
        ...['CSV', 'JSON'].map((name) =>
          h(UiListItem, {
            as: 'button',
            title: name,
            key: name,
            onClick: () => opts.onRun?.(name),
          }),
        ),
        h(UiListItem, { as: 'button', title: 'Excel', disabled: true }),
        h(UiSeparator),
        h(UiListItem, {
          as: 'button',
          title: 'Delete',
          tone: 'danger',
          onClick: () => opts.onRun?.('Delete'),
          ...opts.extra,
        }),
      ],
    },
  })

const trigger = () => document.body.querySelector<HTMLElement>('.trigger')!

describe('UiMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('the button announces a menu and its state; the menu is named by the button', async () => {
    mountMenu()
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    mouseClick(trigger())
    await settle()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(trigger().getAttribute('aria-controls')).toBe(menu()!.id)
    expect(menu()!.getAttribute('aria-labelledby')).toBe(trigger().id)
  })

  it('every strip is a menu item out of the tab order, on the panel list row', async () => {
    mountMenu()
    mouseClick(trigger())
    await settle()
    expect(items().map((i) => i.textContent?.trim())).toEqual(['CSV', 'JSON', 'Excel', 'Delete'])
    for (const i of items()) {
      expect(i.getAttribute('tabindex')).toBe('-1')
      expect(i.className).toContain('py-1.5')
      expect(i.className).toMatch(/focus-visible:bg-(surface-muted|danger-subtle)/)
    }
    expect(menu()!.querySelector('[role="separator"]')!.getAttribute('aria-orientation')).toBe(
      'horizontal',
    )
  })

  it('a mouse open focuses the menu; Enter or Space opens on the first item', async () => {
    mountMenu()
    mouseClick(trigger())
    await settle()
    expect(document.activeElement).toBe(menu())
    mouseClick(trigger())
    await settle()
    expect(menu()).toBeNull()
    trigger().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await settle()
    expect(document.activeElement).toBe(items()[0])
  })

  it('ArrowUp opens on the last item; arrows wrap and skip a disabled item; Home and End', async () => {
    mountMenu()
    key(trigger(), 'ArrowUp')
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Delete')
    key(menu()!, 'ArrowDown')
    expect(document.activeElement?.textContent?.trim()).toBe('CSV')
    key(menu()!, 'ArrowDown')
    key(menu()!, 'ArrowDown')
    expect(document.activeElement?.textContent?.trim()).toBe('Delete')
    key(menu()!, 'Home')
    expect(document.activeElement?.textContent?.trim()).toBe('CSV')
    key(menu()!, 'End')
    expect(document.activeElement?.textContent?.trim()).toBe('Delete')
  })

  it('Escape and Tab close it and return focus to the button; Tab keeps its own move', async () => {
    mountMenu()
    for (const k of ['Escape', 'Tab']) {
      key(trigger(), 'ArrowDown')
      await settle()
      const notPrevented = key(menu()!, k)
      await settle()
      expect(menu(), k).toBeNull()
      expect(document.activeElement, k).toBe(trigger())
      // Tab is left to the browser, which moves on from the button.
      expect(notPrevented, k).toBe(k === 'Tab')
    }
  })

  it('Escape leaves the menu open while another library is on top', async () => {
    mountMenu()
    key(trigger(), 'ArrowDown')
    await settle()
    const overlays = useOverlayStack()
    const above = overlays.acquire()
    key(menu()!, 'Escape')
    await settle()
    expect(menu()).not.toBeNull()
    overlays.release(above)
    key(menu()!, 'Escape')
    await settle()
    expect(menu()).toBeNull()
  })

  it('running an item that moved the focus into another layer leaves the focus there', async () => {
    // In a browser the drawer an item opened takes the focus before the menu's own click
    // closes it: the focus is then in another layer and stays there.
    const field = document.createElement('input')
    document.body.append(field)
    mountMenu({ onRun: () => field.focus() })
    trigger().click()
    await settle()
    mouseClick(items()[0]!)
    await settle()
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(field)
  })

  it("the caller's own id on the button names the menu", async () => {
    mountMenu({ trigger: () => h('button', { class: 'trigger', id: 'export-btn' }, 'Export') })
    expect(trigger().id).toBe('export-btn')
    key(trigger(), 'ArrowDown')
    await settle()
    expect(menu()!.getAttribute('aria-labelledby')).toBe('export-btn')
    key(menu()!, 'Escape')
    await settle()
    expect(document.activeElement).toBe(trigger())
  })

  it('the dense rows and the axis stop at the items: a strip in the trigger keeps its size', () => {
    mountMenu({
      trigger: () => h(UiListItem, { as: 'button', title: 'Account', class: 'trigger' }),
    })
    expect(trigger().className).toContain('py-4')
  })

  it('a row wrapped in a component of your own warns: it cannot be an item', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Row = { render: () => h(UiListItem, { as: 'button', title: 'Wrapped' }) }
    mount(UiMenu, {
      attachTo: document.body,
      slots: { trigger: () => h('button', { class: 'trigger' }, 'Open'), default: () => [h(Row)] },
    })
    key(trigger(), 'ArrowDown')
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('wrapped row'))
    warn.mockRestore()
  })

  it('a link or a label row warns: a menu runs commands, and either would be a button going nowhere', async () => {
    for (const [props, said] of [
      [{ to: '/reports', title: 'Reports' }, 'a place to go is a link row outside the menu'],
      [{ as: 'label', title: 'Compact' }, 'a menu takes command items'],
    ] as const) {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(UiMenu, {
        attachTo: document.body,
        slots: {
          trigger: () => h('button', { class: 'trigger' }, 'Open'),
          default: () => [h(UiListItem, props as Record<string, unknown>)],
        },
      })
      key(trigger(), 'ArrowDown')
      await settle()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(said))
      warn.mockRestore()
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('a plain text in the slot, alone or in an array, warns: it is not an item', async () => {
    for (const child of ['Export', ['Export', 'Print']]) {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(UiMenu, {
        attachTo: document.body,
        slots: {
          trigger: () => h('button', { class: 'trigger' }, 'Open'),
          default: () => [child, h(UiListItem, { as: 'button', title: 'CSV' })],
        },
      })
      key(trigger(), 'ArrowDown')
      await settle()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('is not an item'))
      warn.mockRestore()
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('running an item closes the menu and returns focus to the button', async () => {
    const ran: string[] = []
    mountMenu({ onRun: (n) => ran.push(n) })
    key(trigger(), 'ArrowDown')
    await settle()
    items()[1]!.click()
    await settle()
    expect(ran).toEqual(['JSON'])
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('the focus is on the button before the command runs, so a command that removes the button leaves it to the list', async () => {
    const at: (Element | null)[] = []
    mountMenu({ onRun: () => at.push(document.activeElement) })
    key(trigger(), 'ArrowDown')
    await settle()
    items()[1]!.click()
    expect(at).toEqual([trigger()])
  })

  it('a busy item refuses the click and the menu stays open', async () => {
    const ran: string[] = []
    mountMenu({ onRun: (n) => ran.push(n), extra: { loading: true } })
    mouseClick(trigger())
    await settle()
    items().at(-1)!.click()
    await settle()
    expect(ran).toEqual([])
    expect(menu()).not.toBeNull()
  })

  it('a click outside closes it without pulling focus back', async () => {
    mountMenu()
    const other = document.createElement('input')
    document.body.appendChild(other)
    mouseClick(trigger())
    await settle()
    other.focus()
    other.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(other)
  })

  it('an icon button works as the trigger: the wiring reaches its button', async () => {
    mountMenu({
      trigger: () => h(UiIconButton, { icon: Ellipsis, ariaLabel: 'Actions', class: 'trigger' }),
    })
    expect(trigger().tagName).toBe('BUTTON')
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
    key(trigger(), 'ArrowDown')
    await settle()
    expect(document.activeElement).toBe(items()[0])
    key(menu()!, 'Escape')
    await settle()
    expect(document.activeElement).toBe(trigger())
  })
})

describe('UiMenu — review follow-ups', () => {
  it('class and data-testid land on the menu panel', async () => {
    const w = mount(UiMenu, {
      attachTo: document.body,
      attrs: { class: 'mine', 'data-testid': 'menu' },
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Export'),
        default: () => h(UiListItem, { as: 'button', title: 'CSV' }),
      },
    })
    await new Promise((r) => setTimeout(r, 2))
    trigger().click()
    await settle()
    expect(menu()!.classList.contains('mine')).toBe(true)
    expect(menu()!.getAttribute('data-testid')).toBe('menu')
    w.unmount()
  })
})

describe('UiMenu — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const open = async (w: ReturnType<typeof mount>) => {
    await new Promise((r) => setTimeout(r, 2))
    w.find('button').element.click()
    await settle()
  }

  it('the panel has a ceiling before it is measured: never taller than the screen', async () => {
    const w = mountMenu()
    await open(w)
    expect(menu()!.className).toContain(
      'max-h-[min(calc(100dvh-1rem),var(--ui-panel-room,100dvh))]',
    )
    w.unmount()
  })

  it('past five commands the menu gets a measured height; a short one gets none', async () => {
    const eight = mount(UiMenu, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', 'More'),
        default: () =>
          Array.from({ length: 8 }, (_, i) => h(UiListItem, { as: 'button', title: `Item ${i}` })),
      },
    })
    // happy-dom lays nothing out: each row is placed by hand before the menu measures.
    const place = () =>
      items().forEach((el, i) => {
        Object.defineProperty(el, 'offsetTop', { value: i * 36, configurable: true })
        Object.defineProperty(el, 'offsetHeight', { value: 36, configurable: true })
      })
    await new Promise((r) => setTimeout(r, 2))
    eight.find('button').element.click()
    await nextTick()
    place()
    await settle()
    // Measured, and still under the screen's own ceiling: a tall row list never runs off it.
    expect(menu()!.style.maxHeight).toBe(
      `min(${5 * 36 + 18}px, var(--ui-panel-room, 100dvh), calc(100dvh - 1rem))`,
    )
    eight.unmount()
    const short = mountMenu()
    await open(short)
    expect(menu()!.style.maxHeight).toBe('')
    short.unmount()
  })

  it('in a drawer: a press on the drawer or on its backdrop closes only the menu', async () => {
    const drawer = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Invoice', open: true },
      slots: {
        default: () =>
          h(UiMenu, null, {
            trigger: () => h('button', { class: 'more' }, 'More'),
            default: () => [h(UiListItem, { as: 'button', title: 'Edit' })],
          }),
      },
    })
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    const panel = document.body.querySelector<HTMLElement>('.ui-drawer-panel')!
    for (const target of [panel, panel.previousElementSibling as HTMLElement]) {
      document.body.querySelector<HTMLElement>('.more')!.click()
      await settle()
      expect(menu()).not.toBeNull()
      target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await settle()
      expect(menu()).toBeNull()
      expect(drawer.emitted('update:open')).toBeUndefined()
      await new Promise((r) => setTimeout(r, 2))
    }
    drawer.unmount()
  })
})

describe('UiMenu — type-ahead', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a letter jumps to the next item whose label starts with it, wrapping', async () => {
    mountMenu()
    key(trigger(), 'ArrowDown')
    await settle()
    expect(document.activeElement?.textContent).toContain('CSV')
    key(document.activeElement!, 'd')
    await settle()
    expect(document.activeElement?.textContent).toContain('Delete')
    key(document.activeElement!, 'j')
    await settle()
    expect(document.activeElement?.textContent).toContain('JSON')
    key(document.activeElement!, 'q')
    await settle()
    expect(document.activeElement?.textContent).toContain('JSON')
  })
})

describe('UiMenu — on UiPopover', () => {
  it('Escape that cancels an IME candidate does not close the menu', async () => {
    const w = mountMenu()
    await settle()
    w.find('button').trigger('click')
    await settle()
    expect(menu()).not.toBeNull()
    menu()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }),
    )
    await settle()
    expect(menu()).not.toBeNull()
    w.unmount()
  })

  it('the first item takes the focus once the panel stands in its place, not while hidden', async () => {
    mountMenu()
    await new Promise((r) => setTimeout(r, 2))
    let seen = ''
    document.addEventListener(
      'focusin',
      (e) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>('[role="menu"]')
        if (panel) seen = panel.style.visibility
      },
      { once: true },
    )
    key(trigger(), 'ArrowDown')
    await settle()
    await new Promise((r) => setTimeout(r, 20))
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem')
    expect(seen).not.toBe('hidden')
  })

  it('Tab puts the focus on the button at once, before the browser moves it', async () => {
    mountMenu()
    await new Promise((r) => setTimeout(r, 2))
    key(trigger(), 'ArrowDown')
    await settle()
    key(menu()!, 'Tab')
    expect(document.activeElement).toBe(trigger())
  })
})

// A chord with Alt, Ctrl or Meta is the browser's: Alt with ← goes back a page, Ctrl or ⌘ moves a
// caret or scrolls. The component takes the key only alone.
const chord = (el: Element, key: string, mods: Partial<KeyboardEventInit>) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  el.dispatchEvent(e)
  return e
}

describe('UiMenu — a chord is the browser’s', () => {
  it('Alt with ArrowDown opens the menu; Ctrl or Meta leave the key', async () => {
    mountMenu()
    const e = chord(trigger(), 'ArrowDown', { ctrlKey: true })
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(menu()).toBeNull()
    chord(trigger(), 'ArrowDown', { altKey: true })
    await nextTick()
    await nextTick()
    expect(menu()).not.toBeNull()
  })
})

describe('UiMenu — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  // A button clicks on each Enter that goes down, repeats too, unless the keydown is cancelled.
  const enter = (repeat: boolean) => {
    const el = document.activeElement as HTMLElement
    const e = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat,
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(e)
    if (!e.defaultPrevented && el.tagName === 'BUTTON')
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
  }

  it('a held Enter is one press: its repeats open nothing and run nothing', async () => {
    const ran: string[] = []
    mountMenu({ onRun: (n) => ran.push(n) })
    trigger().focus()
    enter(false)
    await settle()
    enter(false)
    await settle()
    for (let i = 0; i < 4; i++) {
      enter(true)
      await settle()
    }
    expect(ran).toEqual(['CSV'])
    // The repeats landed on the button, and a closed menu's button opens nothing on them.
    expect(menu()).toBeNull()
  })

  it('a held Enter that opened the menu runs nothing: the focus is on its first item', async () => {
    const ran: string[] = []
    mountMenu({ onRun: (n) => ran.push(n) })
    trigger().focus()
    enter(false)
    await settle()
    expect(document.activeElement).toBe(items()[0])
    for (let i = 0; i < 3; i++) {
      enter(true)
      await settle()
    }
    expect(ran).toEqual([])
    expect(menu()).not.toBeNull()
  })

  it('a busy or a disabled item keeps the menu open and the focus in it', async () => {
    mountMenu({ extra: { loading: true } })
    key(trigger(), 'ArrowDown')
    await settle()
    const busy = items().at(-1)!
    busy.focus()
    busy.click()
    await settle()
    expect(menu()).not.toBeNull()
    expect(document.activeElement).toBe(busy)
    const off = items().find((i) => i.textContent?.includes('Excel'))!
    off.click()
    await settle()
    expect(menu()).not.toBeNull()
    expect(document.activeElement).toBe(busy)
  })
})
