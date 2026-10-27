import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'
import { giveFocus } from '../utils/giveFocus'
import { useOverlayStack } from './useOverlayStack'

/**
 * Keeps keyboard focus inside a modal container while it is active: Tab and Shift+Tab
 * go round its focusable elements, read afresh on every press (a form grows and
 * shrinks). On activation focus goes to `initial()`, else to an element marked
 * `data-autofocus` (a calendar's day), else to the first field, else to
 * the container itself: never to the close button, which comes first in the DOM and
 * would make every dialog open on "close". Focus that strays out while it is on top comes back
 * where it was inside (a Tab that carried it out goes round to the first element). Where the focus
 * goes when it closes is the layer's (`useOverlayStack`); a trap with no layer of its own (a sheet
 * of the page) gives it back to what had it, by `returnFocus`.
 */
export interface FocusTrapOptions {
  /** Whether the trap holds; the host binds it to its `open`. */
  active: Ref<boolean>
  /** The element focus stays in. It needs `tabindex="-1"` to take focus itself. */
  container: Ref<HTMLElement | null | undefined>
  /** The element to focus first, when the host knows better than "the first field". */
  initial?: () => HTMLElement | null | undefined
  /** Whether the host is the top overlay. Focus outside the container is pulled back only then: a menu opened from inside keeps it while it is open. */
  isTop?: () => boolean
  /** Whether focus goes back where it was on deactivation; default yes. A host on a layer says no: the layer gives it back. */
  returnFocus?: () => boolean
}

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
/** A field, what takes a value: a text box, a native select, and the library's drawn ones (a select, a date, a switch) that are buttons with a role, a scale's stop, and the button a drawn field marks `data-field` (a drop zone's Browse, a date range). The first one takes the focus. @internal */
export const FIELD =
  'input:not([disabled]):not([readonly]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]):not([readonly]), [contenteditable="true"], [role="combobox"]:not([disabled]), [role="switch"]:not([disabled]), [role="radio"][tabindex="0"]:not([disabled]), [data-field]:not([disabled])'

// `tabIndex`, not the selector: a roving grid (a calendar, tabs) keeps its buttons at -1 and
// only one is a stop. `checkVisibility` drops a `v-show` field (Tab would stall at it); not `visibility`, which a
// panel waiting for its position uses on itself.
/** @internal */
export const tabbables = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      el.tabIndex !== -1 && !el.closest('[inert], [hidden]') && (el.checkVisibility?.() ?? true),
  )

export function useFocusTrap(o: FocusTrapOptions) {
  const overlays = useOverlayStack()
  let returnTo: HTMLElement | null = null

  // The host is asked only when there is somewhere to go: on the first, closed run there is
  // nothing to give back, and a host's `returnFocus` may read state its setup has not made yet.
  const giveBack = () => {
    const target = returnTo
    returnTo = null
    if (target?.isConnected && (o.returnFocus?.() ?? true)) target.focus()
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !o.container.value) return
    const root = o.container.value
    const list = tabbables(root)
    if (!list.length) {
      e.preventDefault()
      return root.focus()
    }
    const first = list[0]!
    const last = list.at(-1)!
    const at = document.activeElement
    if (e.shiftKey && (at === first || at === root || !root.contains(at))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (at === last || !root.contains(at))) {
      e.preventDefault()
      first.focus()
    }
  }

  // Where the container opens: what the host names, else what is marked, else the first field,
  // else the container itself; never the close button, which comes first in the DOM.
  const entry = (root: HTMLElement) =>
    o.initial?.() ??
    root.querySelector<HTMLElement>('[data-autofocus]') ??
    root.querySelector<HTMLElement>(FIELD) ??
    root

  // Focus that lands outside while the dialog is on top comes back. A menu or a select inside
  // the dialog is teleported out of it; when it closes on Tab, the browser moves focus on from
  // its trigger and may leave the dialog: that focus goes round to the first element, as Tab
  // from the last does. Any other focus that strays (a menu that opened the dialog handing the
  // focus back to its button after the dialog took it) goes back to the element inside it left,
  // else where the dialog opens: never to the first button, which is the close. A region above
  // the layers (the toaster) keeps a focus that goes into it, or its Undo is out of reach.
  const onFocusIn = (e: FocusEvent) => {
    const root = o.container.value
    const target = e.target as Element | null
    if (!o.active.value || !root || root.contains(target)) return
    if (o.isTop && !o.isTop()) return
    if (overlays.inAbove(target)) return
    const list = tabbables(root)
    if (overlays.tabbed()) return (list[0] ?? root).focus()
    const left = e.relatedTarget as HTMLElement | null
    ;(left && list.includes(left) ? left : entry(root)).focus()
  }

  // A focused control that becomes disabled (Reset after a reset, a box while loading) drops
  // focus to the body, and no focusin follows: catch the drop and keep focus in the container.
  // A task later, as the browser moves the focus to the body only after the control is gone.
  let dropped: ReturnType<typeof setTimeout> | undefined
  const onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget) return
    clearTimeout(dropped)
    dropped = setTimeout(() => {
      const root = o.container.value
      const at = document.activeElement
      if (!o.active.value || !root || (at && at !== document.body)) return
      if (o.isTop && !o.isTop()) return
      // Where the container would open on (a list, a search), not the container itself.
      ;(o.initial?.() ?? root).focus()
    })
  }

  let bound: HTMLElement | null = null
  const release = () => {
    bound?.removeEventListener('focusout', onFocusOut)
    bound?.removeEventListener('keydown', onKey)
    document.removeEventListener('focusin', onFocusIn)
    clearTimeout(dropped)
    bound = null
  }

  watch(
    o.active,
    async (on) => {
      if (typeof document === 'undefined') return
      if (on) {
        const at = document.activeElement
        returnTo = at instanceof HTMLElement && at !== document.body ? at : null
        await nextTick()
        const root = o.container.value
        if (!root) return
        // On the container, not the document: a dialog opened above this one holds
        // focus in its own container, so this trap never sees its Tab.
        bound = root
        root.addEventListener('keydown', onKey)
        root.addEventListener('focusout', onFocusOut)
        document.addEventListener('focusin', onFocusIn)
        const target = entry(root)
        // Frame by frame until it takes, never over a focus the person moved (utils/giveFocus).
        giveFocus(
          () => target,
          () => o.active.value && bound === root,
        )
      } else {
        release()
        giveBack()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (bound) giveBack()
    release()
  })
}
