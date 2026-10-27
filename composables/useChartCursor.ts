import { computed, ref, watch, type Ref } from 'vue'
import { nearestPoint } from '../utils/chartScale'

export interface ChartCursorOptions {
  /** How many points the axis has; the cursor stays inside them when data changes. */
  count: Ref<number>
  /** The point in words for a screen reader: "September 2026: spending 3,640 EUR". */
  describe: (index: number) => string
  /** Points stand in bands, as bars do: the pointer picks the band it is over, not the nearest center. */
  bands?: boolean
  /** Where the first focus starts: the `last` point, the newest on a time axis, or the `first`, as a ring is read. */
  start?: 'first' | 'last'
}

/**
 * One point under the pointer and under the arrow keys. The plot is the one tab stop: focus
 * shows the point last visited (the newest at first), Left and Right step, Home and End jump,
 * and the point is said in `announcement` for a live region. The pointer shows a point while
 * it is over the plot and leaves it to the keyboard when the plot has the focus. A touch has no
 * hover: a tap shows the point under the finger and keeps it until the plot loses the focus,
 * a tap elsewhere; the host lets the page scroll with `touch-action: pan-y` on the plot.
 */
export function useChartCursor({
  count,
  describe,
  bands = false,
  start = 'last',
}: ChartCursorOptions) {
  /** The point shown, or `null` when none is. */
  const index = ref<number | null>(null)
  // The keyboard is walking the points: set by a focus that no press brought, or by an arrow key.
  const focused = ref(false)
  // A click focuses the plot too; that focus is the pointer's, not the keyboard's.
  let pressed = false
  // Where the keys go on from: the last point shown, or the newest before any.
  let visited: number | null = null

  const clamp = (i: number) => Math.min(Math.max(0, count.value - 1), Math.max(0, i))
  const show = (i: number) => {
    if (count.value === 0) return
    visited = clamp(i)
    index.value = visited
  }

  watch(count, (n) => {
    if (n === 0) index.value = visited = null
    else if (index.value !== null) index.value = clamp(index.value)
  })

  function onPointerMove(event: PointerEvent) {
    const el = event.currentTarget as HTMLElement | null
    if (!el || count.value === 0) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const at = (event.clientX - rect.left) / rect.width
    show(bands ? Math.floor(at * count.value) : nearestPoint(at, count.value))
  }
  const touch = (event?: PointerEvent) =>
    Boolean(event?.pointerType) && event!.pointerType !== 'mouse'
  function onPointerLeave(event?: PointerEvent) {
    // A finger lifting leaves the plot: the point it tapped stays until the focus goes.
    if (touch(event)) return
    if (!focused.value) index.value = null
  }
  function onPointerDown(event?: PointerEvent) {
    pressed = true
    if (touch(event)) onPointerMove(event!)
  }
  function onFocus() {
    if (pressed) {
      pressed = false
      return
    }
    focused.value = true
    show(visited ?? (start === 'first' ? 0 : count.value - 1))
  }
  function onBlur() {
    focused.value = false
    pressed = false
    index.value = null
  }
  function onKeydown(event: KeyboardEvent) {
    // A chord is the browser's: Alt with ← goes back a page, Ctrl or ⌘ scrolls.
    if (count.value === 0 || event.altKey || event.ctrlKey || event.metaKey) return
    focused.value = true
    const from = index.value ?? visited ?? (start === 'first' ? 0 : count.value - 1)
    const to =
      event.key === 'ArrowLeft'
        ? from - 1
        : event.key === 'ArrowRight'
          ? from + 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count.value - 1
              : null
    if (to === null) return
    event.preventDefault()
    show(to)
  }

  // Only a point reached by the keyboard is said: the pointer sweeping the plot would read out every month.
  const announcement = computed(() =>
    focused.value && index.value !== null ? describe(index.value) : '',
  )

  return {
    index,
    announcement,
    /** Bind on the plot, the element the points are laid across: `v-on="handlers"` and `tabindex="0"`. */
    handlers: {
      pointermove: onPointerMove,
      pointerleave: onPointerLeave,
      pointerdown: onPointerDown,
      focus: onFocus,
      blur: onBlur,
      keydown: onKeydown,
    },
  }
}
