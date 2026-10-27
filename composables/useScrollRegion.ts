import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { FIELD } from './useFocusTrap'

/** The focus ring of a scroll region, drawn inside its box: the panel around it clips one outside. @internal */
export const SCROLL_RING = 'focus:outline-hidden focus-visible:!shadow-(--ui-ring-inset)'

/**
 * A body whose content runs past its height is a scroll region: it takes a Tab stop, so the arrow
 * keys, Page Up and Page Down, Space and End scroll a long text that holds nothing to focus. A body
 * that fits takes none. Measured when it appears, when it or what it holds changes size, when what
 * it holds is added or taken away, and when the window changes size.
 *
 * A body that fits again while it holds the focus stays a stop until the focus leaves it: a box
 * without its Tab stop would hold a focus the window's own Tab cycle no longer knows.
 *
 * `firstFocus(container)` is where a surface opens when it holds nothing to fill in and its body is
 * long: on the body, so the arrows read the text at once (WAI-ARIA for long dialogs); else `null`,
 * and the focus trap keeps its own order.
 */
export function useScrollRegion(el: Ref<HTMLElement | null | undefined>) {
  const overflows = ref(false)
  const measure = () => {
    const box = el.value
    const runs = Boolean(box) && box!.scrollHeight > box!.clientHeight + 1
    overflows.value = runs || (overflows.value && Boolean(box?.contains(document.activeElement)))
  }
  // The focus has moved on once the event is over: measured after it.
  const left = () => queueMicrotask(measure)
  let sizes: ResizeObserver | null = null
  let rows: MutationObserver | null = null
  // A panel's height is the screen's, so rows added anywhere in it resize nothing it watches: a
  // change of what it holds measures it again, and a new child of its own is watched for its size.
  const watchRows = (box: HTMLElement) => {
    for (const child of Array.from(box.children)) sizes?.observe(child)
  }
  watch(
    el,
    (box, before) => {
      sizes?.disconnect()
      rows?.disconnect()
      sizes = rows = null
      before?.removeEventListener('focusout', left)
      measure()
      if (!box) return
      box.addEventListener('focusout', left)
      if (typeof ResizeObserver !== 'undefined') {
        sizes = new ResizeObserver(measure)
        sizes.observe(box)
        watchRows(box)
      }
      if (typeof MutationObserver !== 'undefined') {
        rows = new MutationObserver(() => {
          watchRows(box)
          measure()
        })
        rows.observe(box, { childList: true, subtree: true })
      }
    },
    { flush: 'post', immediate: true },
  )
  onMounted(() => window.addEventListener('resize', measure))
  onBeforeUnmount(() => {
    sizes?.disconnect()
    rows?.disconnect()
    el.value?.removeEventListener('focusout', left)
    window.removeEventListener('resize', measure)
  })
  const firstFocus = (container: HTMLElement | null | undefined) => {
    const box = el.value
    if (!box || !container || container.querySelector(`${FIELD}, [data-autofocus]`)) return null
    measure()
    return overflows.value ? box : null
  }
  return { overflows, measure, firstFocus }
}
