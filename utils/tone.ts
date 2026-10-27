import type { BadgeTone } from '../types/ui'
import { pick } from './pick'

/**
 * The one tone-to-class dictionary. Every class is a semantic token, so there
 * are no `dark:` variants: the token swaps with the theme.
 */
export type ValueTone = BadgeTone

export const BADGE_TONES: readonly BadgeTone[] = [
  'neutral',
  'brand',
  'success',
  'warning',
  'danger',
  'info',
]

// A value read as text: the ink of each tone's plate, which turns light in the dark theme; the fill
// colors stay dark there and read under 3:1 on the dark surface.
const TEXT: Record<ValueTone, string> = {
  neutral: 'text-fg',
  brand: 'text-brand',
  success: 'text-success-subtle-fg',
  warning: 'text-warning-text',
  danger: 'text-danger-subtle-fg',
  info: 'text-info-subtle-fg',
}

// Every tone is a pale plate, warning too, so a dot stands out on it. Warning's text is the
// neutral ink, readable on cream; the dot carries the tone.
const SUBTLE: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-subtle text-neutral-subtle-fg',
  brand: 'bg-brand-subtle text-brand-subtle-fg',
  success: 'bg-success-subtle text-success-subtle-fg',
  warning: 'bg-warning-subtle text-fg',
  danger: 'bg-danger-subtle text-danger-subtle-fg',
  info: 'bg-info-subtle text-info-subtle-fg',
}

const OUTLINE: Record<BadgeTone, string> = {
  neutral: 'border-neutral-border bg-neutral-subtle text-neutral-subtle-fg',
  brand: 'border-brand bg-brand-subtle text-brand-subtle-fg',
  success: 'border-success-border bg-success-subtle text-success-subtle-fg',
  warning: 'border-warning-border bg-warning-subtle text-fg',
  danger: 'border-danger-border bg-danger-subtle text-danger-subtle-fg',
  info: 'border-info-border bg-info-subtle text-info-subtle-fg',
}

// One dot per tone, on the page and on the plate alike: its own token.
const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-neutral-dot)]',
  brand: 'bg-[var(--color-brand-dot)]',
  success: 'bg-[var(--color-success-dot)]',
  warning: 'bg-[var(--color-warning-dot)]',
  danger: 'bg-[var(--color-danger-dot)]',
  info: 'bg-[var(--color-info-dot)]',
}
// The saturated fill of a count on a button or in a menu: the button's own pairs.
const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-fg text-bg',
  brand: 'bg-brand-solid text-brand-solid-fg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  danger: 'bg-danger text-danger-fg',
  info: 'bg-info text-info-fg',
}

const FILL: Record<BadgeTone, string> = {
  neutral: 'bg-fg',
  brand: 'bg-brand-solid',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

/** Color of a value itself: a big number, a delta, an amount cell. */
export function toneTextClass(tone: ValueTone | undefined | null): string {
  return pick(TEXT, tone, 'neutral')
}

/** Soft plate: badge, pill, icon box. Fill and text as one pair. */
export function toneSubtleClass(tone: BadgeTone | undefined | null): string {
  return pick(SUBTLE, tone, 'neutral')
}

/** The saturated fill alone, without its label color: a ring or a glow in the tone. */
export function toneFillClass(tone: BadgeTone | undefined | null): string {
  return pick(FILL, tone, 'neutral')
}

/** Saturated fill with its label color: a count that calls for attention. */
export function toneSolidClass(tone: BadgeTone | undefined | null): string {
  return pick(SOLID, tone, 'neutral')
}

/** Soft plate with a colored border. */
export function toneOutlineClass(tone: BadgeTone | undefined | null): string {
  return pick(OUTLINE, tone, 'neutral')
}

/** Indicator dot next to a label, on the page and on the plate alike. */
export function toneDotClass(tone: BadgeTone | undefined | null): string {
  return pick(DOT, tone, 'neutral')
}
