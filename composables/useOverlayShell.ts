import { onBeforeUnmount, shallowRef, watch, type Ref } from 'vue'
import { useShake } from './overlaySurface'
import { useBodyScrollLock } from './useBodyScrollLock'
import { useFocusTrap } from './useFocusTrap'
import { useOverlayStack } from './useOverlayStack'

export interface OverlayShellOptions {
  /** Whether the overlay is open; the host's `open` model. */
  open: Ref<boolean>
  /** The panel: the stack paints it, the trap keeps the focus in it. */
  panel: Ref<HTMLElement | null>
  /** The backdrop, or what holds it and the panel: a press on it outside the panel is the press outside. */
  backdrop?: Ref<HTMLElement | null>
  /** The element to focus first, when the host knows better than "the first field". */
  initial?: () => HTMLElement | null | undefined
  /** Runs each time the overlay opens, before the focus goes in. */
  onOpen?: () => void
  /** Whether the focus goes back where it was on close; default yes. */
  returnFocus?: () => boolean
  /** Escape while the overlay is on top: close, go a level up, or shake. */
  onEscape?: () => void
  /** A press outside the panel (on the backdrop) while the overlay is on top. */
  onOutside?: () => void
  /** A window: a window opened over it hides it until it closes. A drawer is not one. */
  window?: boolean
  /** A question about the window under it (`alertdialog`): it never takes that window's place. */
  question?: () => boolean
  /** A window that is not a question opened over this one: close and say `true`, or say `false` to stay under it. */
  onReplace?: () => boolean
}

/**
 * The shell a modal overlay stands in, shared by UiModal and UiDrawer so the two never drift:
 * its layer on the overlay stack (painted above what opened before, Escape and a press on the
 * backdrop routed to it only while it is on top, the focus given back on close), the page under it
 * held still, the focus kept inside, and a refused close answered with a shake, since silence
 * reads as a frozen page. What a press or an Escape does (close, go a level up, shake) stays the
 * host's. A window opened over a window hides it (`covered`) until it closes, and the one under
 * comes back on its panel (`returning`); the one that hid it comes and goes without its backdrop
 * moving (`swap`), since the tint on the page stays the same.
 */
export function useOverlayShell(o: OverlayShellOptions) {
  const overlays = useOverlayStack()
  const token = shallowRef<symbol | null>(null)
  const onTop = () => token.value !== null && overlays.onTop(token.value)

  const { shaking, refuse, said, hush } = useShake()

  const covered = shallowRef(false)
  const returning = shallowRef(false)
  const swap = shallowRef(false)
  // Come in over a window, it keeps that window's tint until it is in: the window it took the
  // place of leaves in the same moment, and a tint rising from nothing would flash the page.
  let arriving = false
  let covering = false
  const onCovering = (on: boolean) => {
    covering = on
    if (on || !arriving) swap.value = on
  }
  const onCover = (on: boolean) => {
    covered.value = on
    returning.value = !on
    // Hidden or seen again at once, in this same task, before any render: a window that comes back
    // takes the focus now, and one a new window took the place of leaves unseen, closed in the same
    // render as it was hidden, which would draw it leaving in view.
    const root = o.backdrop?.value ?? o.panel.value
    if (on) {
      root?.setAttribute('inert', '')
      root?.classList.add('invisible')
      return
    }
    root?.removeAttribute('inert')
    root?.classList.remove('invisible')
  }

  const scroll = useBodyScrollLock()
  const close = () => {
    if (token.value !== null) overlays.release(token.value)
    token.value = null
    scroll.unlock()
  }
  watch(
    o.open,
    (on) => {
      if (typeof document === 'undefined') return
      if (!on) return close()
      hush()
      o.onOpen?.()
      covered.value = false
      returning.value = false
      swap.value = false
      arriving = true
      covering = false
      token.value = overlays.acquire({
        kind: 'modal',
        window: o.window,
        panel: () => o.panel.value,
        backdrop: () => o.backdrop?.value,
        onEscape: () => o.onEscape?.(),
        onOutside: () => o.onOutside?.(),
        returnFocus: () => o.returnFocus?.() ?? true,
        onCover,
        onCovering,
        question: o.question?.() ?? false,
        onReplace: o.onReplace,
      })
      scroll.lock()
    },
    { immediate: true },
  )
  onBeforeUnmount(close)

  // The layer gives the focus back; the trap only holds it.
  useFocusTrap({
    active: o.open,
    container: o.panel,
    initial: o.initial,
    isTop: onTop,
    returnFocus: () => false,
  })

  return {
    /** The overlay's z-index on the stack. */
    zIndex: () => overlays.zIndex(token.value),
    /** True for 400 ms after a refused close: the panel shakes. */
    shaking,
    /** Why the last close was refused, for a status region inside the panel; empty until one is. */
    said,
    /** Refuses a close with a shake. */
    refuse,
    /** Hidden by a window opened over it: out of sight and out of reach. */
    covered,
    /** Seen again after a window over it closed: its panel rises back, once. */
    returning,
    /** Came in over a window it hid, or leaves with one waiting under it: the backdrop stays as it is. */
    swap,
    /** The panel has risen back. */
    returned: () => (returning.value = false),
    /** In: from now on the tint follows whether a window waits under it. */
    arrived: () => {
      arriving = false
      swap.value = covering
    },
  }
}
