/** A field where you type: Cmd+Enter sends from it, and a late error does not take the focus from it. A button is not one. */
export const TYPED_FIELD =
  'textarea, input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=file])'

/**
 * A field in error that the form must fix. A draft refused on its own (the text of a UiListField,
 * marked `data-draft`) is not one: it is said to a screen reader, and a Save goes past it.
 */
export const INVALID = '[aria-invalid="true"]:not([data-draft])'

// What takes the focus: a control, or an element made a stop. A `role` group is neither.
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
// Inside a group in error: the chosen one first, then the group's own stop, then any control.
const INSIDE = [':checked', '[aria-checked="true"]', '[tabindex="0"]', FOCUSABLE]

// `focus()` on a field in a `v-show` container or an inert one does nothing and says nothing.
const reachable = (el: HTMLElement) =>
  !el.closest('[inert], [hidden]') && (el.checkVisibility?.() ?? true)

/**
 * Puts the focus on the first field in error under `root` and scrolls it into view, only as far
 * as needed. A save that stopped on a field would otherwise be pressed again, and on a long form
 * the reason is off the screen. A group in error (radios, a scale) takes no focus itself: the
 * focus goes to its chosen control, else its first. A field in error that cannot take the
 * focus (a disabled one, one in a hidden or inert container) is passed over for the next, and so
 * is a refused draft (`data-draft`), which a Save does not wait on. Returns whether a control
 * took it.
 */
export function focusInvalid(root: HTMLElement | null | undefined): boolean {
  for (const field of root?.querySelectorAll<HTMLElement>(INVALID) ?? []) {
    const target = field.matches(FOCUSABLE)
      ? field
      : INSIDE.map((sel) => field.querySelector<HTMLElement>(sel)).find(
          (el): el is HTMLElement => !!el && el.matches(FOCUSABLE),
        )
    if (!target || !reachable(target)) continue
    field.scrollIntoView?.({ block: 'nearest' })
    target.focus()
    return true
  }
  return false
}
