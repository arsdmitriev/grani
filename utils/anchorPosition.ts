/**
 * Where a floating panel stands relative to its trigger: below or above with a
 * flip when the preferred side has no room, left or right for a tooltip,
 * clamped to the viewport. Pure arithmetic on numbers, no DOM: the edge cases
 * (a panel taller than the screen, a trigger at the right edge, an unmeasured
 * panel on the first frame) are tested, not hoped for.
 */
export interface AnchorTrigger {
  top: number
  left: number
  right: number
  bottom: number
  width: number
}

export interface AnchorInput {
  trigger: AnchorTrigger
  /** Panel size; `0` means not measured yet (first frame): no flip, no clamp by height. */
  panel: { width: number; height: number }
  viewport: { width: number; height: number }
  /** Gap between trigger and panel. */
  offset?: number
  /** Safe distance from the viewport edge. */
  margin?: number
  /** Preferred side. The panel flips only when its side has no room and the other has more; `auto` flips as soon as it does not fit. */
  prefer?: 'below' | 'above' | 'left' | 'right' | 'auto'
  /** Alignment on the cross axis: `start` with the trigger's start edge, `end` with its end edge, `center` on its middle. Under a panel that stands above or below, the edges follow the reading direction (`rtl`). */
  align?: 'start' | 'end' | 'center'
  /** The trigger reads right to left: its start edge is the right one. Without it, the left. */
  rtl?: boolean
  /** Panel as wide as the trigger (selects): the clamp uses the trigger width. */
  matchTriggerWidth?: boolean
  /** The panel is capped to the room on its side (`room`), so it stands beside the trigger and never covers it. */
  capToRoom?: boolean
}

export interface AnchorResult {
  top: number
  left: number
  /** Where it ended up; a tooltip's tail and the tests need it. */
  placement: 'below' | 'above' | 'left' | 'right'
  /** The height there is on that side, between the trigger and the viewport's margin. */
  room?: number
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))

// The lower bound comes last: a panel wider than the viewport gives a negative
// ceiling, and fixing one edge must not push the panel past the other.
function crossAxis(
  align: 'start' | 'end' | 'center',
  triggerStart: number,
  triggerSize: number,
  panelSize: number,
  viewportSize: number,
  margin: number,
): number {
  const raw =
    align === 'center'
      ? triggerStart + triggerSize / 2 - panelSize / 2
      : align === 'end'
        ? triggerStart + triggerSize - panelSize
        : triggerStart
  return clamp(raw, margin, Math.max(margin, viewportSize - panelSize - margin))
}

export function anchorPosition(input: AnchorInput): AnchorResult {
  const { trigger, panel, viewport } = input
  const offset = input.offset ?? 6
  const margin = input.margin ?? 8
  const prefer = input.prefer ?? 'below'
  const align = input.align ?? 'start'
  // Above or below the trigger, start and end are the reading direction's, not the screen's.
  const edge = input.rtl && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align
  const triggerHeight = trigger.bottom - trigger.top
  const width = input.matchTriggerWidth ? trigger.width : panel.width

  const sideways = prefer === 'left' || prefer === 'right'
  const fitsLeft = trigger.left - offset >= panel.width + margin
  const fitsRight = viewport.width - trigger.right - offset >= panel.width + margin
  // A side that does not fit gives way to the other only if that one fits. When neither side does
  // (a wide hint on a phone), it goes below or above: pinned to the edge on a side, it would stand
  // over its own trigger.
  if (sideways && (fitsLeft || fitsRight)) {
    const wantLeft = prefer === 'left'
    const placement: AnchorResult['placement'] = wantLeft
      ? fitsLeft || !fitsRight
        ? 'left'
        : 'right'
      : fitsRight || !fitsLeft
        ? 'right'
        : 'left'
    const rawLeft =
      placement === 'left' ? trigger.left - offset - panel.width : trigger.right + offset
    return {
      left: clamp(rawLeft, margin, Math.max(margin, viewport.width - panel.width - margin)),
      top: crossAxis(
        align === 'start' ? 'start' : 'center',
        trigger.top,
        triggerHeight,
        panel.height,
        viewport.height,
        margin,
      ),
      placement,
    }
  }

  const spaceBelow = viewport.height - trigger.bottom - offset
  const spaceAbove = trigger.top - offset
  const fitsBelow = panel.height === 0 || spaceBelow >= panel.height
  const fitsAbove = panel.height === 0 || spaceAbove >= panel.height

  let placement: AnchorResult['placement']
  if (sideways) placement = fitsBelow || spaceBelow >= spaceAbove ? 'below' : 'above'
  else if (prefer === 'auto') placement = fitsAbove ? 'above' : 'below'
  else if (prefer === 'above') placement = fitsAbove || spaceAbove >= spaceBelow ? 'above' : 'below'
  else placement = fitsBelow || spaceBelow >= spaceAbove ? 'below' : 'above'

  const room = Math.max(0, (placement === 'above' ? spaceAbove : spaceBelow) - margin)
  // Capped to the room on its side, the panel stands beside the trigger whatever its height.
  if (input.capToRoom) {
    const height = Math.min(panel.height, room)
    const top = placement === 'above' ? trigger.top - offset - height : trigger.bottom + offset
    return {
      top: Math.max(margin, top),
      left: crossAxis(edge, trigger.left, trigger.width, width, viewport.width, margin),
      placement,
      room,
    }
  }
  // Fits nowhere: pin to the edge, a clipped end beats a panel half off screen.
  // The lower bound applies even before measuring: an anchor can be negative
  // (a context menu from caller coordinates) and the first frame is no excuse
  // to show the panel above the top edge.
  const rawTop =
    placement === 'above'
      ? trigger.top - offset - panel.height
      : panel.height > 0
        ? Math.min(trigger.bottom + offset, viewport.height - panel.height - margin)
        : trigger.bottom + offset
  return {
    top: Math.max(margin, rawTop),
    left: crossAxis(edge, trigger.left, trigger.width, width, viewport.width, margin),
    placement,
  }
}
