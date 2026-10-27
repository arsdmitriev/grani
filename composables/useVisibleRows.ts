import {
  getCurrentInstance,
  nextTick,
  onMounted,
  ref,
  watch,
  type Ref,
  type WatchSource,
} from 'vue'

/** How many rows a list in a panel shows before the rest scrolls inside it. @internal */
export const PANEL_LIST_ROWS = 5

/**
 * The height of a list in a panel: five rows and half of the sixth, so the cut says there is more
 * (a hidden scrollbar says nothing). Measured, not computed from a row height: a row with a
 * description or a group heading is taller than the others.
 */
export function useVisibleRows(
  list: Ref<HTMLElement | null | undefined>,
  rows: string,
  when: WatchSource,
  count = PANEL_LIST_ROWS,
) {
  const maxHeight = ref<string | undefined>()
  const measure = () => {
    const el = list.value
    if (!el) return
    const items = el.querySelectorAll<HTMLElement>(rows)
    const next = items[count]
    if (!next) {
      maxHeight.value = undefined
      return
    }
    // Never taller than the room beside the button (`--ui-panel-room`, set where the panel is
    // placed) or the screen: an inline height replaces the panel's own ceiling, so it keeps both.
    maxHeight.value = `min(${next.offsetTop + next.offsetHeight / 2}px, var(--ui-panel-room, 100dvh), calc(100dvh - 1rem))`
  }
  watch(when, () => void nextTick(measure), { flush: 'post', immediate: true })
  // Once more when the component is in the page: one that mounts late (inside an async page or a
  // Suspense) has no list yet at the first measure, and its rows may never change to measure again.
  if (getCurrentInstance()) onMounted(measure)
  return { maxHeight, measure }
}
