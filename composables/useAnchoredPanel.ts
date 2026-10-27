import {
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { anchorPosition, type AnchorInput, type AnchorResult } from '../utils/anchorPosition'
import { useOverlayStack, type LayerClose } from './useOverlayStack'

/**
 * The plumbing of a floating panel: where it stands, when to recompute, and its layer on the
 * overlay stack, which routes Escape and a press outside to it. The arithmetic lives in
 * `utils/anchorPosition` because numbers are the only way to test it; happy-dom has no layout.
 *
 * Scroll repositions with `capture: true`: a scroll event does not bubble, so a
 * window listener never sees the table or drawer body that scrolls under the
 * trigger, and the panel would drift away from it.
 */
export interface AnchoredPanelOptions {
  /** Whether the panel is open; the host drives it (hover for a tooltip, click for a select). */
  open: Ref<boolean>
  /** The trigger element the panel stands under; a getter is read on every pass, once the trigger is in the page. */
  trigger: MaybeRefOrGetter<HTMLElement | null | undefined>
  panel: Ref<HTMLElement | null | undefined>
  /** Called on a pointer down outside every layer from this one up, and on Escape unless `onEscape` is given. */
  close: () => void
  /** Escape while the panel is the top overlay, when it does more than `close` (a select gives the focus back). */
  onEscape?: () => void
  /** Whether the layer gives the focus back to what opened it on close, asked with how it closed; default no, the host does. */
  returnFocus?: (how: LayerClose) => boolean
  /** Geometry: everything `anchorPosition` takes except what is measured. */
  geometry?: () => Partial<Omit<AnchorInput, 'trigger' | 'panel' | 'viewport'>>
  /** Panel width before the first measurement, when the host knows it. */
  fallbackWidth?: number
  /** Panel as wide as the trigger (selects): `panelStyle` carries the width and the clamp uses it. */
  matchTriggerWidth?: boolean
  /** The panel is capped to the room beside the trigger: `panelStyle` carries `--ui-panel-room`, for a `max-height` that reads it. */
  capToRoom?: boolean
  /** Takes a place in the overlay stack. A hint (a tooltip) does not: it is placed only, the stack knows it as a hint. Default true. */
  layer?: boolean
  /** What opened the panel, when it is not `trigger` (a field's capsule anchors, its button opens): a window opened from an item of the panel gives the focus back here once the item is gone. */
  opener?: () => HTMLElement | null | undefined
}

export function useAnchoredPanel(o: AnchoredPanelOptions) {
  const overlays = useOverlayStack()
  const rect = ref<AnchorResult | null>(null)
  let token: symbol | null = null

  // Hidden until positioned: a panel shown at (0,0) that moves a frame later is a visible jump.
  const panelStyle = ref<Record<string, string>>({ visibility: 'hidden' })

  // The control that held the focus when the panel hid, for when it stands again.
  let parked: HTMLElement | null = null
  // A frame or two may pass before the panel is shown to the browser (a transition on everything,
  // as reduced motion leaves one, starts at hidden): tried again each frame, a few times, while the
  // focus is still on the page.
  const refocus = (el: HTMLElement, tries = 10) => {
    const now = document.activeElement
    if (!el.isConnected || (now && now !== document.body)) return
    el.focus({ preventScroll: true })
    if (document.activeElement !== el && tries > 0)
      requestAnimationFrame(() => refocus(el, tries - 1))
  }
  const reposition = async () => {
    if (!o.open.value) return
    await nextTick()
    const el = toValue(o.trigger)
    if (!el) return
    const t = el.getBoundingClientRect()
    // A trigger scrolled clean out of the window leaves the panel nothing to stand beside: pinned
    // to the edge it would float over whatever scrolled in under it. It waits hidden, still open,
    // and stands again when the trigger comes back. The focus it held drops to the page while it
    // is hidden, and goes back to the same control when it stands again, unless the person put it
    // somewhere else meanwhile. A trigger clipped by a scroller but still in the window is not told
    // apart.
    if (t.bottom < 0 || t.top > window.innerHeight || t.right < 0 || t.left > window.innerWidth) {
      const at = document.activeElement
      if (at instanceof HTMLElement && o.panel.value?.contains(at)) parked = at
      panelStyle.value = { visibility: 'hidden' }
      return
    }
    const back = parked
    parked = null
    const measured = o.panel.value
    rect.value = anchorPosition({
      trigger: t,
      panel: {
        width: measured?.offsetWidth || o.fallbackWidth || 0,
        height: measured?.offsetHeight ?? 0,
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      matchTriggerWidth: o.matchTriggerWidth,
      capToRoom: o.capToRoom,
      rtl: getComputedStyle(el).direction === 'rtl',
      ...o.geometry?.(),
    })
    panelStyle.value = {
      top: `${rect.value.top}px`,
      left: `${rect.value.left}px`,
      // Re-measured on every pass, so a resize while open keeps the panel as wide as the trigger.
      ...(o.matchTriggerWidth ? { width: `${t.width}px` } : {}),
      ...(o.capToRoom && rect.value.room != null
        ? { '--ui-panel-room': `${rect.value.room}px` }
        : {}),
      // One paint ladder with the windows: a list opened in a popover, or a modal opened from it, paints above it.
      ...(token !== null ? { zIndex: overlays.zIndex(token)! } : {}),
    }
    // Shown again: its control takes back the focus that dropped to the page as it hid.
    if (back) void nextTick(() => refocus(back))
  }

  // The watcher runs on the server too (`immediate`), where there is no document.
  let bound = false
  // A panel whose content changes its height (a list turned calendar, rows loaded) is placed
  // again: flipped above the trigger it would otherwise grow down over it.
  let resized: ResizeObserver | null = null
  const bind = () => {
    bound = true
    if (typeof ResizeObserver !== 'undefined') {
      resized = new ResizeObserver(() => void reposition())
      void nextTick(() => o.panel.value && resized?.observe(o.panel.value))
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
  }
  const unbind = () => {
    if (!bound) return
    bound = false
    resized?.disconnect()
    resized = null
    window.removeEventListener('scroll', reposition, true)
    window.removeEventListener('resize', reposition)
  }

  // `immediate`: a panel can mount already open (a context menu is created on the call).
  watch(
    o.open,
    async (v) => {
      if (typeof document === 'undefined') return
      if (v) {
        if (o.layer !== false)
          token = overlays.acquire({
            kind: 'panel',
            panel: () => o.panel.value,
            inside: () => [toValue(o.trigger), o.opener?.()],
            opener: () => o.opener?.() ?? toValue(o.trigger),
            onEscape: () => (o.onEscape ?? o.close)(),
            onOutside: () => o.close(),
            returnFocus: (how) => o.returnFocus?.(how) ?? false,
          })
        panelStyle.value = { visibility: 'hidden' }
        bind()
        await reposition()
      } else {
        unbind()
        if (token !== null) {
          overlays.release(token)
          token = null
        }
        rect.value = null
        parked = null
        panelStyle.value = { visibility: 'hidden' }
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    unbind()
    if (token !== null) {
      overlays.release(token)
      token = null
    }
  })

  /** Whether this panel is on top of the page: only then does it keep the focus. */
  const isTop = () => token !== null && overlays.onTop(token)

  return { rect, panelStyle, reposition, isTop }
}
