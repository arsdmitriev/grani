import type { ControlSize } from '../types/ui'

/** The size and corner of a check mark, 18px; its corner stops at a third of the side, or it reads as a radio. A skeleton of a checkbox takes it too. */
export const CHECK_MARK_BOX = 'h-[18px] w-[18px] rounded-[min(var(--radius-badge),33%)]'

/** The box of a check mark (checkbox, multiple-select rows). */
export const CHECK_MARK_BASE = `flex ${CHECK_MARK_BOX} shrink-0 items-center justify-center border transition-colors duration-fast`

// 14px at stroke 3 on Lucide's 24 grid matches the old mark's 2.5 on a 16 grid.
export const CHECK_MARK_GLYPH = 'h-3.5 w-3.5'
export const CHECK_MARK_STROKE = 3

/** Hover belongs to the host: the checkbox gates it on `enabled:` and darkens to `control-border-hover`, a select row lights it with the row. */
export function checkMarkClass(checked: boolean, disabled = false, invalid = false): string {
  if (disabled) return 'border-border bg-border-strong/40 text-disabled-fg'
  // `ui-mark-on` gives the fill back in forced colors, which drop it (tokens.css).
  if (checked) return 'ui-mark-on border-brand-solid bg-brand-solid text-brand-solid-fg'
  if (invalid) return 'border-danger-border bg-surface'
  // The control border, as a field's: the hairline one leaves an empty box hardly there.
  return 'border-control-border bg-surface'
}

/** A check mark's box without its size: a checkbox sizes it by its step (`MARK_STEP`). */
export const CHECK_MARK_SHELL =
  'flex shrink-0 items-center justify-center rounded-[min(var(--radius-badge),33%)] border transition-colors duration-fast'
/** A radio mark without its size: a plain radio sizes it by the group's step. */
export const RADIO_MARK_SHELL =
  'flex shrink-0 items-center justify-center rounded-pill border transition-colors duration-fast'

/**
 * A mark beside text, per step of the control ladder: 16, 18 and 20 px. The text stays `text-sm`,
 * and the mark stands at its first line (a 22px line), so a long label reads on beside it; `sm`
 * is the mark as it always was.
 */
export const MARK_STEP: Record<
  ControlSize,
  { box: string; glyph: string; dot: string; top: string }
> = {
  xs: { box: 'h-4 w-4', glyph: 'h-3 w-3', dot: 'h-1.5 w-1.5', top: 'mt-0.5' },
  sm: { box: 'h-[18px] w-[18px]', glyph: 'h-3.5 w-3.5', dot: 'h-1.5 w-1.5', top: 'mt-px' },
  md: { box: 'h-5 w-5', glyph: 'h-4 w-4', dot: 'h-2 w-2', top: 'mt-0' },
}

/** In a card the mark stands alone on a 60px row: 20px, or it reads as a dot. */
export const RADIO_MARK_BASE_CARD =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border transition-colors duration-fast'
export const CHECK_MARK_GLYPH_CARD = 'h-4 w-4'
