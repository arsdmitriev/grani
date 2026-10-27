import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createGrani } from '../plugin'
import { useOverlayStack } from './useOverlayStack'

// The core alone: layers as plain records over plain elements, the document's own events.
const el = (tag = 'div', parent: Element = document.body) => {
  const node = document.createElement(tag)
  parent.append(node)
  return node
}
const esc = (target: EventTarget = document) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
const press = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }))

let opened: { release: (t: symbol) => void; token: symbol }[] = []
const open = (
  stack: ReturnType<typeof useOverlayStack>,
  record: Parameters<ReturnType<typeof useOverlayStack>['acquire']>[0],
) => {
  const token = stack.acquire(record)
  opened.push({ release: stack.release, token })
  return token
}
afterEach(() => {
  for (const { release, token } of opened) release(token)
  opened = []
  document.body.innerHTML = ''
})

describe('the overlay core — Escape', () => {
  it('goes to the top layer only, and no other listener on the document hears it', () => {
    const stack = useOverlayStack()
    const lower = vi.fn()
    const upper = vi.fn()
    open(stack, { panel: () => null, onEscape: lower })
    open(stack, { panel: () => null, onEscape: upper })
    const heard = vi.fn()
    document.addEventListener('keydown', heard)
    esc()
    document.removeEventListener('keydown', heard)
    expect(upper).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()
    expect(heard).not.toHaveBeenCalled()
  })

  it('a window on top takes no Escape from a layer under it; a panel on top takes it from anywhere', () => {
    const stack = useOverlayStack()
    const drawer = el()
    const field = el('input', drawer)
    const window = el()
    const onWindow = vi.fn()
    open(stack, { kind: 'modal', panel: () => drawer })
    const top = open(stack, { kind: 'modal', panel: () => window, onEscape: onWindow })
    esc(field)
    expect(onWindow).not.toHaveBeenCalled()
    stack.release(top)
    const onList = vi.fn()
    open(stack, { panel: () => el(), onEscape: onList })
    esc(field)
    expect(onList).toHaveBeenCalledTimes(1)
  })

  it('an IME that ended its composition just before keeps the key (Safari says so by key code 229)', () => {
    const stack = useOverlayStack()
    const onList = vi.fn()
    open(stack, { onEscape: onList })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 229 }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true }))
    expect(onList).not.toHaveBeenCalled()
  })

  it('a hint takes it before a search under the focus clears itself', () => {
    const stack = useOverlayStack()
    const search = el('input')
    const cleared = vi.fn()
    search.addEventListener('keydown', cleared)
    const hide = vi.fn()
    const hint = { holds: () => false, hide: () => (hide(), stack.hideHint(hint)) }
    stack.showHint(hint)
    esc(search)
    expect(hide).toHaveBeenCalledTimes(1)
    expect(cleared).not.toHaveBeenCalled()
    esc(search)
    expect(cleared).toHaveBeenCalledTimes(1)
  })

  it('a hint takes it first and nothing under it closes', () => {
    const stack = useOverlayStack()
    const onWindow = vi.fn()
    open(stack, { kind: 'modal', panel: () => null, onEscape: onWindow })
    const hide = vi.fn()
    const hint = { holds: () => false, hide: () => (hide(), stack.hideHint(hint)) }
    stack.showHint(hint)
    esc()
    expect(hide).toHaveBeenCalledTimes(1)
    expect(onWindow).not.toHaveBeenCalled()
    esc()
    expect(onWindow).toHaveBeenCalledTimes(1)
  })
})

describe('the overlay core — a press outside', () => {
  it('closes the panels from the top down and stops at the layer that holds it', () => {
    const stack = useOverlayStack()
    const drawer = el()
    const backdrop = el()
    const list = el()
    const onDrawer = vi.fn()
    const onList = vi.fn()
    open(stack, {
      kind: 'modal',
      panel: () => drawer,
      backdrop: () => backdrop,
      onOutside: onDrawer,
    })
    open(stack, { panel: () => list, onOutside: onList })
    // In the drawer, outside the list: the list closes, the drawer holds the press.
    press(el('button', drawer))
    expect(onList).toHaveBeenCalledTimes(1)
    expect(onDrawer).not.toHaveBeenCalled()
    // On the backdrop: the list closes, and the press is the list's, not the drawer's.
    press(backdrop)
    expect(onList).toHaveBeenCalledTimes(2)
    expect(onDrawer).not.toHaveBeenCalled()
  })

  it('a window first in line closes on its backdrop; a press beside the backdrop passes it by', () => {
    const stack = useOverlayStack()
    const popover = el()
    const backdrop = el()
    const onPopover = vi.fn()
    const onWindow = vi.fn()
    open(stack, { panel: () => popover, onOutside: onPopover })
    open(stack, { kind: 'modal', panel: () => el(), backdrop: () => backdrop, onOutside: onWindow })
    press(backdrop)
    expect(onWindow).toHaveBeenCalledTimes(1)
    expect(onPopover).not.toHaveBeenCalled()
    press(el())
    expect(onWindow).toHaveBeenCalledTimes(1)
    expect(onPopover).toHaveBeenCalledTimes(1)
  })

  it('a press in a region above the layers closes nothing', () => {
    const stack = useOverlayStack()
    const toaster = el()
    const onPanel = vi.fn()
    open(stack, { panel: () => el(), onOutside: onPanel })
    const off = stack.above(() => toaster)
    press(el('button', toaster))
    expect(stack.inAbove(toaster.firstChild)).toBe(true)
    expect(onPanel).not.toHaveBeenCalled()
    off()
    press(toaster)
    expect(onPanel).toHaveBeenCalledTimes(1)
  })
})

describe('the overlay core — the focus on close', () => {
  it('goes back to what opened the layer; when that is gone, to what opened the layer it stood in', () => {
    const stack = useOverlayStack()
    const button = el('button')
    const menu = el()
    const item = el('button', menu)
    const drawer = el()
    const field = el('input', drawer)
    const m = open(stack, { panel: () => menu, opener: () => button })
    item.focus()
    const d = open(stack, { kind: 'modal', panel: () => drawer })
    // The menu closes behind the drawer and takes its item with it.
    field.focus()
    stack.release(m)
    expect(document.activeElement).toBe(field)
    item.remove()
    stack.release(d)
    expect(document.activeElement).toBe(button)
  })

  it('skips an opener that still stands in a layer that has closed', () => {
    const stack = useOverlayStack()
    const button = el('button')
    const menu = el()
    const item = el('button', menu)
    const m = open(stack, { panel: () => menu, opener: () => button })
    item.focus()
    const d = open(stack, { kind: 'modal', panel: () => el() })
    stack.release(m)
    // The item is still in the page (its panel leaving), but its layer is closed.
    stack.release(d)
    expect(document.activeElement).toBe(button)
  })

  it('a panel keeps a focus that moved on, and one a press outside sent elsewhere', () => {
    const stack = useOverlayStack()
    const button = el('button')
    const panel = el()
    const inner = el('input', panel)
    const elsewhere = el('input')
    const p = open(stack, {
      panel: () => panel,
      opener: () => button,
      onOutside: () => stack.release(p),
      returnFocus: (how) => how !== 'outside',
    })
    elsewhere.focus()
    stack.release(p)
    expect(document.activeElement).toBe(elsewhere)
    const q = open(stack, {
      panel: () => panel,
      opener: () => button,
      onOutside: () => stack.release(q),
      returnFocus: (how) => how !== 'outside',
    })
    inner.focus()
    press(elsewhere)
    expect(document.activeElement).toBe(inner)
  })
})

describe('the overlay core — two apps on one page', () => {
  it('paint steps never meet, and Escape goes to the app whose layer holds the focus', () => {
    const one = createApp({ render: () => null }).use(createGrani())
    const two = createApp({ render: () => null }).use(createGrani())
    one.mount(el())
    two.mount(el())
    const a = one.runWithContext(() => useOverlayStack())
    const b = two.runWithContext(() => useOverlayStack())
    const inA = el()
    const onA = vi.fn()
    const onB = vi.fn()
    const ta = a.acquire({ panel: () => inA, onEscape: onA })
    const tb = b.acquire({ panel: () => el(), onEscape: onB })
    expect(Number(b.zIndex(tb))).toBeGreaterThan(Number(a.zIndex(ta)))
    esc(el('input', inA))
    expect(onA).toHaveBeenCalledTimes(1)
    expect(onB).not.toHaveBeenCalled()
    // An app that unmounts takes its listeners off the document.
    a.release(ta)
    b.release(tb)
    one.unmount()
    const late = vi.fn()
    const tl = a.acquire({ onEscape: late })
    esc()
    expect(late).not.toHaveBeenCalled()
    a.release(tl)
    two.unmount()
  })
})

describe('the overlay core — one instance, several apps', () => {
  it('installed in two apps, it keeps routing Escape for the one left when the other unmounts', () => {
    const grani = createGrani()
    const one = createApp({ render: () => null }).use(grani)
    const two = createApp({ render: () => null }).use(grani)
    one.mount(el())
    two.mount(el())
    const stack = two.runWithContext(() => useOverlayStack())
    one.unmount()
    const onEscape = vi.fn()
    const t = stack.acquire({ onEscape })
    esc()
    expect(onEscape).toHaveBeenCalledTimes(1)
    stack.release(t)
    two.unmount()
  })

  it('used again in a new app after its last app unmounted, it listens again', () => {
    const grani = createGrani()
    const first = createApp({ render: () => null }).use(grani)
    first.mount(el())
    first.runWithContext(() => useOverlayStack())
    first.unmount()
    const again = createApp({ render: () => null }).use(grani)
    again.mount(el())
    const stack = again.runWithContext(() => useOverlayStack())
    const onEscape = vi.fn()
    const t = stack.acquire({ onEscape })
    esc()
    expect(onEscape).toHaveBeenCalledTimes(1)
    stack.release(t)
    again.unmount()
  })
})

describe('the overlay core — a shadow root', () => {
  it('reads where a press happened from the path, not the host it was retargeted to', () => {
    const stack = useOverlayStack()
    const host = el()
    const root = host.attachShadow({ mode: 'open' })
    const panel = document.createElement('div')
    const inside = document.createElement('button')
    panel.append(inside)
    root.append(panel)
    const onOutside = vi.fn()
    open(stack, { panel: () => panel, onOutside })
    // What a browser hands a listener on the document: the host as the target, the button first on the path.
    const e = new Event('pointerdown', { bubbles: true })
    e.composedPath = () => [inside, panel, root, host, document.body, document]
    host.dispatchEvent(e)
    expect(onOutside).not.toHaveBeenCalled()
    press(el())
    expect(onOutside).toHaveBeenCalledTimes(1)
  })
})

describe('the overlay core — the last input', () => {
  it('knows a key from a pointer, and a Tab until the next press', () => {
    const stack = useOverlayStack()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(stack.byKeyboard()).toBe(true)
    expect(stack.tabbed()).toBe(true)
    press(el())
    expect(stack.byKeyboard()).toBe(false)
    expect(stack.tabbed()).toBe(false)
  })
})

describe('the overlay core — one window at a time', () => {
  it('a window opened over a window hides it until it closes', () => {
    const stack = useOverlayStack()
    const lower = vi.fn()
    open(stack, { kind: 'modal', window: true, onCover: lower })
    const upper = open(stack, { kind: 'modal', window: true })
    expect(lower).toHaveBeenLastCalledWith(true)
    expect(stack.covering(upper)).toBe(true)
    stack.release(upper)
    expect(lower).toHaveBeenLastCalledWith(false)
    expect(lower).toHaveBeenCalledTimes(2)
  })

  it('three windows: only the top one is seen, and they come back one by one', () => {
    const stack = useOverlayStack()
    const first = vi.fn()
    const second = vi.fn()
    open(stack, { kind: 'modal', window: true, onCover: first })
    const b = open(stack, { kind: 'modal', window: true, onCover: second })
    const c = open(stack, { kind: 'modal', window: true })
    expect(first.mock.calls).toEqual([[true]])
    expect(second.mock.calls).toEqual([[true]])
    stack.release(c)
    expect(second).toHaveBeenLastCalledWith(false)
    expect(first.mock.calls).toEqual([[true]])
    stack.release(b)
    expect(first).toHaveBeenLastCalledWith(false)
  })

  it('the window under closed first: the one on top hides nothing now', () => {
    const stack = useOverlayStack()
    const a = open(stack, { kind: 'modal', window: true })
    const b = open(stack, { kind: 'modal', window: true })
    stack.release(a)
    expect(stack.covering(b)).toBe(false)
  })

  it('a drawer stays in view under a window and over one, and a list hides nothing', () => {
    const stack = useOverlayStack()
    const drawer = vi.fn()
    const win = vi.fn()
    open(stack, { kind: 'modal', onCover: drawer })
    const w = open(stack, { kind: 'modal', window: true, onCover: win })
    expect(stack.covering(w)).toBe(false)
    const d = open(stack, { kind: 'modal' })
    const list = open(stack, { onCover: vi.fn() })
    expect(drawer).not.toHaveBeenCalled()
    expect(win).not.toHaveBeenCalled()
    expect(stack.covering(d)).toBe(false)
    expect(stack.covering(list)).toBe(false)
  })

  it('a window over the window on top of the page takes its step; over a list, the next one', () => {
    const stack = useOverlayStack()
    const a = open(stack, { kind: 'modal', window: true })
    const b = open(stack, { kind: 'modal', window: true })
    expect(stack.zIndex(b)).toBe(stack.zIndex(a))
    expect(stack.zIndex(b)).toBe(stack.zIndex(null))
    const third = open(stack, { kind: 'modal', window: true })
    expect(stack.zIndex(third)).toBe(stack.zIndex(a))
    stack.release(third)
    const list = open(stack, {})
    const c = open(stack, { kind: 'modal', window: true })
    expect(Number(stack.zIndex(c))).toBeGreaterThan(Number(stack.zIndex(list)))
    const drawer = open(stack, { kind: 'modal' })
    expect(Number(stack.zIndex(drawer))).toBeGreaterThan(Number(stack.zIndex(c)))
  })

  it('a drawer between two windows: the lower window is hidden, the drawer stays in view', () => {
    const stack = useOverlayStack()
    const lower = vi.fn()
    const drawer = vi.fn()
    open(stack, { kind: 'modal', window: true, onCover: lower })
    open(stack, { kind: 'modal', onCover: drawer })
    const upper = open(stack, { kind: 'modal', window: true })
    expect(lower).toHaveBeenLastCalledWith(true)
    expect(drawer).not.toHaveBeenCalled()
    // It hides a window: it comes in and goes as one over a window does, the tints still two.
    expect(stack.covering(upper)).toBe(true)
    stack.release(upper)
    expect(lower).toHaveBeenLastCalledWith(false)
  })

  it('the window under is shown again before the focus goes back into it', () => {
    const stack = useOverlayStack()
    const lower = el()
    const ask = el('button', lower)
    let hiddenAtFocus: boolean | null = null
    let hidden = false
    ask.addEventListener('focus', () => (hiddenAtFocus = hidden))
    open(stack, {
      kind: 'modal',
      window: true,
      panel: () => lower,
      onCover: (on) => (hidden = on),
    })
    ask.focus()
    const upper = el()
    const t = open(stack, { kind: 'modal', window: true, panel: () => upper })
    el('input', upper).focus()
    expect(hidden).toBe(true)
    stack.release(t)
    expect(document.activeElement).toBe(ask)
    expect(hiddenAtFocus).toBe(false)
  })
})
