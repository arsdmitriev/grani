import type { Component } from 'vue'
import { CircleCheck, CircleX, Info, TriangleAlert } from '@lucide/vue'
import type { Tone } from '../types/ui'

/** The glyph of a toast in a tone. */
export const TONE_GLYPH: Partial<Record<Tone, Component>> = {
  success: CircleCheck,
  danger: CircleX,
  warning: TriangleAlert,
  info: Info,
}
/** The glyph's ink: the border role, graded for a mark on the surface; a message without a tone draws it muted. */
export const TONE_GLYPH_INK: Partial<Record<Tone, string>> = {
  neutral: 'text-fg-muted',
  success: 'text-success-border',
  danger: 'text-danger-border',
  warning: 'text-warning-border',
  info: 'text-info-border',
}

/** The start edge of a message in a tone, 3px and round with its card: a toast and a notice. */
export const TONE_EDGE: Partial<Record<Tone, string>> = {
  info: 'border-s-[3px] border-s-info-border',
  success: 'border-s-[3px] border-s-success-border',
  warning: 'border-s-[3px] border-s-warning-border',
  danger: 'border-s-[3px] border-s-danger-border',
}

/**
 * The same edge on a notice drawn as a row of a UiList: a border on a pseudo-element over the
 * row's start, so the text keeps the rows' inset and the edge runs the item's full height, clipped
 * by the card's corners. A border survives forced colors, where a shadow would not. It stands on
 * the list item (`.ui-list > li` is positioned): a positioned row would paint over the list's line.
 */
export const TONE_ROW_EDGE: Partial<Record<Tone, string>> = {
  info: "before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-info-border before:content-['']",
  success:
    "before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-success-border before:content-['']",
  warning:
    "before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-warning-border before:content-['']",
  danger:
    "before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-danger-border before:content-['']",
}
