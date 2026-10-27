import type { ControlSize } from '../types/ui'

/** The control height ladder in px. Every interactive control stands on it. */
export const CONTROL_HEIGHT: Record<ControlSize, number> = { xs: 28, sm: 36, md: 44 }

/** Tailwind classes for the ladder, one place to change the implementation. */
export const controlHeightClass: Record<ControlSize, string> = { xs: 'h-7', sm: 'h-9', md: 'h-11' }

/** The ladder as a floor, for a control that grows with its content (a textarea's single row). */
export const controlMinHeightClass: Record<ControlSize, string> = {
  xs: 'min-h-7',
  sm: 'min-h-9',
  md: 'min-h-11',
}

export const DEFAULT_CONTROL_SIZE: ControlSize = 'sm'
