import { standIn } from '../utils/focusSuccessor'
import { isImeKey } from '../utils/ime'
import { markRaw } from 'vue'
import { onScopeEnd, useShared } from './useShared'

/*
 * The overlay core: every layer of an app (a window, a drawer, the sheet of a shell, a popover, a
 * menu, a select's list) is one record here, and this is the one place that decides what Escape,
 * a press outside and a close do.
 *
 * Opening. A layer calls `acquire(record)` when it opens. It takes the top of its app's stack and a
 * paint step above every layer open on the page, in any app. The record says what the layer is
 * (`modal`, which holds the page, or `panel`, which leaves it live), its panel, what else counts as
 * inside it (a panel's button), what Escape and a press outside do, and whether the focus goes back.
 * What opened it is saved now, with the layer it stood in: the button of a menu, or what had the
 * focus.
 *
 * Routing. Each app listens on the document once, from its first use until the last app its instance
 * is installed in unmounts. Escape goes to the top layer of the app whose layer holds the focus (else
 * of the app whose layer is on top of the page) and goes no further; a hint that is shown takes it
 * first, before anything under the focus. A modal layer on top takes only an
 * Escape from inside it or from the page, never one from a layer under it. A press outside closes,
 * from the top down, every panel that does not hold it, and stops at the first layer that does. A
 * modal layer closes on a press on its backdrop, and only when it is the first layer the press is
 * outside of: a press that closed a list opened in it belongs to the list. A press beside its
 * backdrop (on what it does not cover) passes it by.
 *
 * Closing. `release(token)` takes the layer off the stack and hands the focus back, once, to what
 * opened it. When that has left the page, or stood in a layer that has closed since (the item of a
 * menu that opened a drawer), the focus goes to what opened that layer, and so on down. A panel gives
 * the focus back only while it holds it, or the focus fell to the page: a focus that has moved on (a
 * drawer an item opened) stays where it is, and a click outside leaves it where the click went.
 *
 * One window at a time. A window opened over a window takes its place: the one under is asked to
 * close (`onReplace`), and the new one's way back runs on to what opened it. A question (`question`),
 * or a window under it that says no (unsaved input, a request out), hides it instead: when it
 * closes, the one under is seen again before the focus comes back to it. A drawer is not a window:
 * it stays in view under a window and over one.
 *
 * Above. A region that stands above every layer (the toaster) is registered with `above`: a press in
 * it closes nothing, an Escape in it is its own, and a window does not pull a focus back from it.
 */

type Getter = () => Element | null | undefined

/** `modal` holds the page (a window, a drawer, a sheet); `panel` leaves it live (a popover, a list). */
export type LayerKind = 'modal' | 'panel'

/** How a layer was asked to close: its host's `returnFocus` reads it. */
export type LayerClose = 'escape' | 'outside' | 'other'

/** What a layer tells the core when it opens. Every field is optional: a bare layer only counts. @internal */
export interface LayerRecord {
  /** `panel` unless said. */
  kind?: LayerKind
  /** The panel: a press in it is inside, a focus in it is the layer's. */
  panel?: Getter
  /** A modal layer's backdrop: a press on it, outside the panel, is the press outside. */
  backdrop?: Getter
  /** What else is inside: a panel's button and the field it stands under. */
  inside?: () => readonly (Element | null | undefined)[]
  /** What opened the layer, when it is not what has the focus (a panel's button). Read again at close when it was not in the page yet. */
  opener?: Getter
  /** Escape, while this layer is the top of its app. */
  onEscape?: (e: KeyboardEvent) => void
  /** A press outside, by the rule above. */
  onOutside?: (e: PointerEvent) => void
  /** Whether the focus goes back on close, asked with how the layer was closed; yes unless said. */
  returnFocus?: (how: LayerClose) => boolean
  /** A window: a window opened over it hides it until it closes. A drawer is not one, and stays in view. */
  window?: boolean
  /** Told when a window over it hides it (`true`) and when it is seen again (`false`), before the focus comes back to it. */
  onCover?: (covered: boolean) => void
  /** Told when it hides a window under it (`true`), and when it no longer does (`false`). */
  onCovering?: (covering: boolean) => void
  /** A question about the window under it: it hides that window while it asks, and never takes its place. */
  question?: boolean
  /** Asked when a window that is not a question opens over it: closes it and says so, or says it stays (unsaved input, a request out). */
  onReplace?: () => boolean
}

/** One way back for the focus: an element, and the layer it stood in when it was saved. */
interface Link {
  el: Getter
  holder: Layer | null
}

interface Layer {
  record: LayerRecord
  z: number
  open: boolean
  covered: boolean
  covering: boolean
  how: LayerClose
  chain: Link[]
  holds: (node: Node) => boolean
  page: PageLayer
  /** The window that took its place: while that one is open its way back is not walked, the new
   * window holds the focus. A host that refused the close keeps it open, and its way back stands. */
  replacedBy?: Layer
}

/** What every app on the page sees of a layer, or of a region above them: a copy of another line reads the same shape. */
interface PageLayer {
  z: number
  owner: object
  above: boolean
  holds: (node: Node) => boolean
}

/** A hint on the screen (a tooltip): one per app; Escape and a press outside put it away first. @internal */
export interface Hint {
  holds: (node: Node) => boolean
  hide: () => void
}

interface Core {
  stack: symbol[]
  layers: Map<symbol, Layer>
  hint: Hint | null
  /** When the last hint went away: the next one opens at once while the row is warm. */
  hintClosed: number
  /** The last input: a key or a pointer. A focus that follows a key is the keyboard's. */
  modality: 'keyboard' | 'pointer'
  /** The last key pressed, cleared by a press of the pointer: a focus that strays after a Tab went round. */
  lastKey: string
  /** What the last press landed on that a click focuses, until a focus goes anywhere: Safari focuses no button a pointer presses. */
  pressed: Element | null
  /** Whether its listeners are on the document. */
  listening: boolean
}

const KEY = 'grani:overlays'
// The page's layers, every app's and every copy's: the paint order is the page's, and an Escape
// or a press has to know which app holds it. On the global object, like the scroll lock, and
// numbered like it: `PageLayer` is what every version reads, and a new shape takes the next number.
const PAGE = Symbol.for('grani:overlay-layers@1')
const page = (): PageLayer[] => {
  const g = globalThis as typeof globalThis & { [PAGE]?: PageLayer[] }
  return (g[PAGE] ??= [])
}

// `z-modal`; each layer opened over it takes the next step, a tooltip (75) stays above them, a toast (80) above it.
const MODAL_Z = 60

// Where an event happened: inside a shadow root the event is retargeted to its host, the path is not.
const origin = (e: Event): Node | null => {
  const first = e.composedPath?.()[0] ?? e.target
  return first instanceof Node ? first : null
}
const contains = (el: Element | null | undefined, node: Node) => Boolean(el?.contains(node))
// A press on a label is a press on the control it names: the label hands its click on to it.
const labelled = (node: Node): Node | null =>
  (node instanceof Element ? node.closest('label') : null)?.control ?? null
const focused = (): Element | null => {
  const at = typeof document === 'undefined' ? null : document.activeElement
  return at && at !== document.body ? at : null
}
// What a click focuses in Chrome and Firefox: the control under the press, or what holds it.
const CLICK_FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]'
const pressable = (node: Node | null): Element | null => {
  const el = node instanceof Element ? node.closest(CLICK_FOCUSABLE) : null
  return el && !el.matches(':disabled') ? el : null
}
// On one step, the later: a window over a hidden one shares its step.
const topOf = (list: PageLayer[]) =>
  list.reduce<PageLayer | null>((top, p) => (!top || p.z >= top.z ? p : top), null)

/** The layers of this app: the stack, the routing of Escape and a press outside, the focus on close. Acquire on the client only. */
export function useOverlayStack() {
  const core = useShared<Core>(KEY, () =>
    markRaw<Core>({
      stack: [],
      layers: new Map(),
      hint: null,
      hintClosed: 0,
      modality: 'pointer',
      lastKey: '',
      pressed: null,
      listening: false,
    }),
  ).value
  // On every use, not once per store: an instance whose last app unmounted listens again when used.
  listen(core)

  /** Opens a layer on top: the token is its handle. */
  const acquire = (record: LayerRecord = {}): symbol => {
    const token = Symbol('overlay')
    const holds = (node: Node) =>
      contains(record.panel?.(), node) || (record.inside?.() ?? []).some((el) => contains(el, node))
    // What opened it, and the layer that stood in: the way back runs on down through that one.
    // With the focus on the page, it is the control last pressed, which Safari leaves unfocused
    // (the button that opened a window): the other browsers would have focused it. A control that
    // keeps the focus elsewhere on a press (a select's option, the field's) leaves it where it is.
    const pressed = core.pressed?.isConnected ? core.pressed : null
    const from = record.opener?.() ?? (record.opener ? null : (focused() ?? pressed))
    let holder: Layer | null = null
    if (from)
      for (const t of [...core.stack].reverse()) {
        const layer = core.layers.get(t)!
        if (layer.holds(from)) {
          holder = layer
          break
        }
      }
    const first: Link = { el: from ? () => from : () => record.opener?.(), holder }
    const layers = page().filter((p) => !p.above)
    // A window over the window on top of the page takes its step: that one is hidden now, so the
    // two never paint together, and a server, which puts every window on the first step, agrees.
    const under = modalsOf(core).at(-1)
    const z =
      record.window && under?.record.window && topOf(layers) === under.page
        ? under.z
        : layers.length
          ? Math.max(...layers.map((p) => p.z)) + 1
          : MODAL_Z
    const layer: Layer = {
      record,
      z,
      open: true,
      covered: false,
      covering: false,
      how: 'other',
      chain: [first, ...(holder?.chain ?? [])],
      holds,
      page: { z, owner: core, above: false, holds },
    }
    core.layers.set(token, layer)
    core.stack.push(token)
    page().push(layer.page)
    restack(core)
    // A window that is not a question takes the place of the window it opens over: that one is
    // asked to close, and waits hidden under it when it may not (unsaved input, a request out). A
    // question is about the window under it, which comes back as it was once it is answered.
    if (record.window && !record.question) {
      // The nearest layer under it that is not a panel: a menu or a select list opened from that
      // window is still open as the new window comes in.
      const below = core.stack
        .slice(0, -1)
        .reverse()
        .map((t) => core.layers.get(t)!)
        .find((l) => l.record.kind === 'modal')
      if (below?.record.window && below.record.onReplace?.()) {
        below.replacedBy = layer
        // Its way back goes on to what opened the window it took the place of (a toast's action
        // opened it from no layer at all).
        for (const link of below.chain) if (!layer.chain.includes(link)) layer.chain.push(link)
      }
    }
    return token
  }

  /** Takes the layer off the stack and hands the focus back by the rule at the top of this file. */
  const release = (token: symbol) => {
    const layer = core.layers.get(token)
    if (!layer) return
    layer.open = false
    core.layers.delete(token)
    core.stack.splice(core.stack.indexOf(token), 1)
    const all = page()
    const at = all.indexOf(layer.page)
    if (at >= 0) all.splice(at, 1)
    restack(core)
    // A window closed by its host while the focus is in a layer still open (one that waited under
    // the window on top) leaves the focus there: walking its way back would jump the page. A panel
    // the closing window opened (its select's list, closing a moment later) is not such a layer.
    const held = focused()
    const holder = (t: symbol) => {
      const l = core.layers.get(t)!
      return (
        l.holds(held!) && (l.record.kind === 'modal' || !l.chain.some((k) => k.holder === layer))
      )
    }
    if (layer.record.kind === 'modal' && held && core.stack.some(holder)) return
    handBack(layer)
  }

  const isTop = (token: symbol) => core.stack[core.stack.length - 1] === token
  /** Whether the layer is on top of the page, every app's layers counted: only that one keeps the
      focus, or two apps' traps would pull it back and forth. */
  const onTop = (token: symbol) => {
    const layer = core.layers.get(token)
    return Boolean(layer) && isTop(token) && topOf(page().filter((p) => !p.above)) === layer!.page
  }
  /** Whether the layer hides a window under it: that window comes back when it closes. */
  const covering = (token: symbol) => Boolean(core.layers.get(token)?.covering)
  /** How many layers this app has open: a shortcut under them is theirs. */
  const count = () => core.stack.length
  /** The paint step of a layer, fixed when it opened: a confirm from a drawer paints over it.
      No token only on a server, which never acquires one (above): the first layer's own step, what
      a page freshly opening this same layer would compute too, so hydration finds the style it
      rendered rather than fighting a real one over it. */
  const zIndex = (token: symbol | null) => {
    const layer = token === null ? undefined : core.layers.get(token)
    return layer ? String(layer.z) : token === null ? String(MODAL_Z) : undefined
  }
  /** Registers a region above every layer; the returned function takes it off. */
  const above = (region: Getter) => {
    const entry: PageLayer = {
      z: Infinity,
      owner: core,
      above: true,
      holds: (node) => contains(region(), node),
    }
    page().push(entry)
    return () => {
      const all = page()
      const at = all.indexOf(entry)
      if (at >= 0) all.splice(at, 1)
    }
  }
  /** Whether a node is in a region above every layer. */
  const inAbove = (node: Node | null) =>
    Boolean(node) && page().some((p) => p.above && p.holds(node!))

  /** Shows a hint: the one shown before goes away at once. */
  const showHint = (hint: Hint) => {
    if (core.hint && core.hint !== hint) core.hint.hide()
    core.hint = hint
  }
  /** The hint has gone; the row stays warm for a moment. */
  const hideHint = (hint: Hint) => {
    if (core.hint !== hint) return
    core.hint = null
    core.hintClosed = Date.now()
  }

  return {
    acquire,
    release,
    isTop,
    onTop,
    covering,
    count,
    zIndex,
    above,
    inAbove,
    showHint,
    hideHint,
    /** Whether a hint is on the screen in this app. */
    hintShown: () => core.hint !== null,
    /** When the last hint went away, by `Date.now()`. */
    hintClosed: () => core.hintClosed,
    /** Whether the last input was a key: a focus that follows it is the keyboard's. */
    byKeyboard: () => core.modality === 'keyboard',
    /** Whether the last key was Tab and no press came after it. */
    tabbed: () => core.lastKey === 'Tab',
  }
}

const modalsOf = (core: Core) =>
  core.stack.map((t) => core.layers.get(t)!).filter((layer) => layer.record.kind === 'modal')

// One window at a time: a window with a window anywhere above it is hidden, a drawer between them
// or not, and seen again when the last one above goes; a window with one under it hides it. A drawer
// is neither. Told at once, so a window coming back is seen before the focus returns to it.
function restack(core: Core) {
  const modals = modalsOf(core)
  const windows = modals.map((layer) => Boolean(layer.record.window))
  modals.forEach((layer, i) => {
    const covered = windows[i]! && windows.slice(i + 1).includes(true)
    if (covered === layer.covered) return
    layer.covered = covered
    layer.record.onCover?.(covered)
  })
  modals.forEach((layer, i) => {
    const covering = windows[i]! && windows.slice(0, i).includes(true)
    if (covering === layer.covering) return
    layer.covering = covering
    layer.record.onCovering?.(covering)
  })
}

// The way back: the first link still in the page whose layer is still open.
function handBack(layer: Layer) {
  if (typeof document === 'undefined' || layer.replacedBy?.open) return
  if (!(layer.record.returnFocus?.(layer.how) ?? true)) return
  // A panel leaves the page live: a focus that has gone on from it stays.
  if (layer.record.kind !== 'modal') {
    const at = focused()
    if (at && !contains(layer.record.panel?.(), at)) return
  }
  for (const link of layer.chain) {
    // A control that left the page while the layer was open goes to the one now in its place.
    const el = standIn(link.el())
    if (el instanceof HTMLElement && el.isConnected && (!link.holder || link.holder.open)) {
      el.focus()
      return
    }
  }
}

// The layer an Escape is for: the top of this app, when this app owns the key. A key in a region
// above the layers is that region's.
function escapeOwner(core: Core, e: KeyboardEvent): symbol | null {
  const token = core.stack[core.stack.length - 1]
  if (!token) return null
  const target = origin(e)
  const all = page()
  if (target && all.some((p) => p.above && p.holds(target))) return null
  const layers = all.filter((p) => !p.above)
  const holders = target ? layers.filter((p) => p.holds(target)) : []
  const owner = topOf(holders) ?? topOf(layers)
  if (owner !== null && owner.owner !== core) return null
  // A window on top holds the focus: an Escape from a layer under it is not its own.
  const top = core.layers.get(token)
  if (top?.record.kind === 'modal' && holders.length && !holders.includes(top.page)) return null
  return token
}

// The app's listeners, on the document from its first use to the unmount of the last app the
// instance serves, and again on the next use: one for the keys, one for a press.
function listen(core: Core) {
  if (core.listening || typeof document === 'undefined') return
  core.listening = true
  const fire = (token: symbol, how: LayerClose, run: () => void) => {
    const layer = core.layers.get(token)
    if (!layer) return
    layer.how = how
    run()
  }
  // An IME's Escape cancels its candidates (utils/ime).
  // Capturing, before anything under the focus: the last input, and a hint shown, which takes an
  // Escape first, before a search under it clears itself, and goes no further.
  const onKeyCapture = (e: KeyboardEvent) => {
    core.modality = 'keyboard'
    core.lastKey = e.key
    if (e.key !== 'Escape' || isImeKey(e) || !core.hint) return
    e.stopImmediatePropagation()
    e.preventDefault()
    core.hint.hide()
  }
  // Bubbling: a control under the focus that owns its Escape (a search that clears) stops it first.
  // Not even another listener on the document hears it: it was this layer's.
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || isImeKey(e)) return
    const token = escapeOwner(core, e)
    const layer = token && core.layers.get(token)
    if (!token || !layer) return
    e.stopImmediatePropagation()
    e.preventDefault()
    // A held Escape closes one layer: its repeats would close the layers under it one by one.
    if (e.repeat) return
    fire(token, 'escape', () => layer.record.onEscape?.(e))
  }
  const onPress = (e: PointerEvent) => {
    core.modality = 'pointer'
    core.lastKey = ''
    const target = origin(e)
    core.pressed = pressable(target)
    if (!target) return
    if (core.hint && !core.hint.holds(target)) core.hint.hide()
    if (!core.stack.length || page().some((p) => p.above && p.holds(target))) return
    let first = true
    // The panels this press closed on its way down to a window under them.
    const closed: Layer[] = []
    const named = labelled(target)
    for (const token of [...core.stack].reverse()) {
      const layer = core.layers.get(token)
      if (!layer) continue
      if (layer.holds(target) || (named && layer.holds(named))) break
      if (layer.record.kind === 'modal') {
        // Beside the backdrop the press is on what the window does not cover: it passes on down.
        if (!contains(layer.record.backdrop?.(), target)) continue
        // The press is on the window's backdrop: canceled here, the browser sends no mousedown
        // after it, whose default would take the focus the closing layer has just given back.
        e.preventDefault()
        if (first) fire(token, 'outside', () => layer.record.onOutside?.(e))
        // It only closed a panel open in the window, with the focus in that panel: the press puts
        // it nowhere, so it goes back now to what opened the panel, in the window still.
        else
          for (const shut of closed) {
            const at = focused()
            if (at && !contains(shut.record.panel?.(), at)) break
            const back = shut.chain
              .map((link) => link.el())
              .find((el): el is HTMLElement => el instanceof HTMLElement && el.isConnected)
            back?.focus()
            if (back) break
          }
        break
      }
      closed.push(layer)
      fire(token, 'outside', () => layer.record.onOutside?.(e))
      first = false
    }
  }
  // A focus that goes anywhere is the focus: the press it followed, or not, is forgotten.
  const onFocus = () => (core.pressed = null)
  document.addEventListener('keydown', onKeyCapture, true)
  document.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onPress, true)
  document.addEventListener('focusin', onFocus, true)
  // The app's layers leave the page with it, or they would stand over the other apps' Escape.
  onScopeEnd(() => {
    const all = page()
    for (let i = all.length - 1; i >= 0; i--) if (all[i]!.owner === core) all.splice(i, 1)
    document.removeEventListener('keydown', onKeyCapture, true)
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerdown', onPress, true)
    document.removeEventListener('focusin', onFocus, true)
    core.pressed = null
    core.listening = false
  })
}
