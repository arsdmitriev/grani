import { onScopeDispose, ref } from 'vue'

/**
 * The one definition of a list in a panel: UiSelect's listbox, UiFilterList, UiDateRange's
 * presets, UiMenu's items and UiAppShell's places read it (through `PanelRow` and `usePanelList`), so a
 * change here reaches all of them. Rows run edge to edge, 12px in; the first and the last grow by 0.3 of
 * the panel radius, since a corner arc of radius r reaches r(1 - 1/√2) in at 45°. A press takes
 * neither the focus nor a text selection (the row also cancels the mouse press, never the pointer
 * press, which in WebKit would end a tap in no click).
 */
export const PANEL_LIST_ROW =
  'relative flex select-none items-center gap-2 px-3 py-1.5 first:pt-[max(0.375rem,calc(var(--radius-overlay)*0.3))] last:pb-[max(0.375rem,calc(var(--radius-overlay)*0.3))]'
/**
 * The highlighted row, followed by the pointer and the arrows alike: its band, and a bar of the brand
 * at its start edge. The band alone reads 1.05:1 against the panel, under the 3:1 a focus mark
 * needs; the bar reads 5.5:1 against the band and moves no text. The bar is a border, as a notice
 * row's edge (`TONE_ROW_EDGE`): forced colors drop the band's fill and keep a border. The row is
 * `relative`.
 */
export const PANEL_LIST_ACTIVE =
  'bg-surface-muted before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-brand'
/** The same mark on a command row the focus is on (a menu's, a card's), the bar in the brand. */
export const ROW_FOCUS =
  'focus-visible:bg-surface-muted focus-visible:before:absolute focus-visible:before:inset-y-0 focus-visible:before:start-0 focus-visible:before:border-s-[3px] focus-visible:before:border-s-brand'
/** The bar on a toned command row the focus is on, in the row's own ink, beside its toned band. */
export const ROW_FOCUS_BAR_INK =
  'focus-visible:before:absolute focus-visible:before:inset-y-0 focus-visible:before:start-0 focus-visible:before:border-s-[3px] focus-visible:before:border-s-current'
/** How tall the list grows before it scrolls; `relative` so a row's `offsetTop` counts from the list, which scrolls it. */
export const PANEL_LIST_HEIGHT = 'relative max-h-72'
/** The search row at the top: a glyph and a bare field over one line. */
export const PANEL_LIST_SEARCH = 'flex items-center gap-2 border-b border-border px-3'
export const PANEL_LIST_SEARCH_INPUT =
  'h-9 min-w-0 flex-1 bg-transparent text-fg placeholder:text-placeholder focus:outline-hidden'
/** Nothing found, loading, failed: one centered line with room around it. */
export const PANEL_LIST_NOTE = 'px-2 py-6 text-center'
/**
 * A place of the app in a sidebar: 36px, rounded, muted until it is the current page, which is lit.
 * The tint reads 1.12:1 light and 1.00:1 dark, so UiAppShell sets the current place's label
 * semibold too, on the label itself: the page is told by weight, not by color alone.
 */
export const NAV_ROW =
  'h-9 gap-3 rounded-control px-2 text-fg-muted [&:is(:enabled,a)]:hover:bg-surface-muted aria-[current=page]:bg-brand-subtle aria-[current=page]:hover:bg-brand-subtle [&>div:first-child]:aria-[current=page]:text-brand-subtle-fg'

export interface PanelListOptions<T> {
  /** The rows the keys walk, in order. */
  items: () => readonly T[]
  /** A row the arrows and the letters pass over. */
  disabled?: (item: T) => boolean
  /** The words a typed letter is matched against. */
  label?: (item: T) => string
  /** The element of a row by its index, to bring it into view or give it the focus. */
  row: (index: number) => HTMLElement | null | undefined
  /** The list that scrolls inside its panel; unset, the row is brought into view where it stands (a list in a drawer). */
  list?: () => HTMLElement | null | undefined
  /** The arrows go round, from the last row to the first and back. */
  wrap?: boolean
  /** The highlight is the focus: a move focuses the row (a menu); else the caller points at it with `aria-activedescendant`. */
  focus?: boolean
  /** Letters: `first` gathers them for half a second and goes to the first row they start, the same letter again to the next row it starts; `next` takes one letter and goes to the next row it starts, after the highlight. */
  typeAhead?: 'first' | 'next'
}

/**
 * The behavior of a list in a panel, written once: the highlight, the arrows, Home and End
 * passing over a disabled row, the letters that jump, and the highlighted row brought into view in
 * the list, never by scrolling the page. UiSelect, UiFilterList, UiDateRange, UiMenu and
 * UiListField walk their rows with it; what Enter, Space and Escape do stays theirs.
 */
export function usePanelList<T>(o: PanelListOptions<T>) {
  const active = ref(-1)
  const enabled = (i: number) => {
    const item = o.items()[i]
    return item !== undefined && !o.disabled?.(item)
  }
  /** The first row the keys can reach from `from`, walking by `step`; -1 when there is none. */
  const firstEnabled = (from: number, step: 1 | -1) => {
    const count = o.items().length
    for (let i = from; i >= 0 && i < count; i += step) if (enabled(i)) return i
    return -1
  }
  /** The row one press of an arrow reaches from the highlight: past the end it stops, or goes round with `wrap`. */
  const next = (step: 1 | -1) => {
    if (!o.wrap) return firstEnabled(active.value + step, step)
    const count = o.items().length
    // From no highlight, up goes to the last row, down to the first.
    const from = active.value < 0 && step < 0 ? 0 : active.value
    for (let k = 1; k <= count; k++) {
      const i = (((from + step * k) % count) + count) % count
      if (enabled(i)) return i
    }
    return -1
  }
  // The list scrolls, never the page: `scrollIntoView` on a row of a panel that is not placed yet
  // would drag the window to the end of the body.
  const scrollToActive = () => {
    const el = o.row(active.value)
    if (!el) return
    if (o.focus) return el.focus()
    const list = o.list?.()
    if (!list) return el.scrollIntoView?.({ block: 'nearest' })
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
  }
  /** Highlights a row and brings it into view; -1 leaves the highlight where it is. */
  const move = (index: number) => {
    if (index < 0) return
    active.value = index
    scrollToActive()
  }
  /** The arrows, Home and End; false for another key. In a text field Home and End keep the caret. */
  const keys = (e: KeyboardEvent, inField = false): boolean => {
    // A chord is the browser's: in a field Alt, Ctrl or ⌘ with an arrow moves the caret.
    if (e.altKey || e.ctrlKey || e.metaKey) return false
    let to: number
    if (e.key === 'ArrowDown') to = next(1)
    else if (e.key === 'ArrowUp') to = next(-1)
    else if (e.key === 'Home' && !inField) to = firstEnabled(0, 1)
    else if (e.key === 'End' && !inField) to = firstEnabled(o.items().length - 1, -1)
    else return false
    e.preventDefault()
    // A move by the keys ends the word typed over the list: a Space after it picks the row it
    // reached, not a space of the word.
    resetTypeAhead()
    move(to)
    return true
  }

  let typed = ''
  let typedTimer: ReturnType<typeof setTimeout> | undefined
  /** Forgets the letters: on every open and close, so "p", close, "u" does not look for "pu". */
  const resetTypeAhead = () => {
    clearTimeout(typedTimer)
    typed = ''
  }
  /** A letter typed over the list: the row it leads to is highlighted. */
  const typeAhead = (char: string) => {
    const label = o.label
    if (!label) return
    const items = o.items()
    if (o.typeAhead === 'next') {
      const key = char.toLowerCase()
      for (let k = 1; k <= items.length; k++) {
        const i = (active.value + k) % items.length
        if (enabled(i) && label(items[i]!).toLowerCase().startsWith(key)) return move(i)
      }
      return
    }
    clearTimeout(typedTimer)
    typed += char.toLowerCase()
    typedTimer = setTimeout(() => (typed = ''), 500)
    // The same letter again ("t", "t"), quick or slow, is no word: from a row that starts with it,
    // it walks the rows that start with it, past the highlight and round, so Transport, Travel and
    // Taxes are each a press away.
    const char0 = typed[0]!
    const current = items[active.value]
    // Unless the doubled letter is how the highlighted row begins ("ll" on Llama): it stays there.
    if (typed.length > 1 && current !== undefined && label(current).toLowerCase().startsWith(typed))
      return
    if (
      [...typed].every((c) => c === char0) &&
      current !== undefined &&
      label(current).toLowerCase().startsWith(char0)
    ) {
      for (let k = 1; k <= items.length; k++) {
        const i = (active.value + k) % items.length
        if (enabled(i) && label(items[i]!).toLowerCase().startsWith(char0)) return move(i)
      }
      return
    }
    move(items.findIndex((item, i) => enabled(i) && label(item).toLowerCase().startsWith(typed)))
  }
  /** Whether a word is being typed over the list: a Space then belongs to it ("new j" goes on to New Jersey), not to a pick. */
  const typing = () => typed !== ''
  onScopeDispose(() => clearTimeout(typedTimer))

  return {
    active,
    firstEnabled,
    next,
    move,
    keys,
    scrollToActive,
    typeAhead,
    resetTypeAhead,
    typing,
  }
}
