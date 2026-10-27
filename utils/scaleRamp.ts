/**
 * The thermometer fill of a scale: the status tokens mixed by the mark's position,
 * so the ramp follows the theme. Two halves, danger to warning and warning to
 * success; `mix` is the share of the first token, set on the segment as
 * `--ui-scale-mix`, and the class reads it.
 */
export const SCALE_RAMP_CLASS = {
  low: 'bg-[color-mix(in_oklab,var(--color-danger)_var(--ui-scale-mix),var(--color-warning))]',
  high: 'bg-[color-mix(in_oklab,var(--color-warning)_var(--ui-scale-mix),var(--color-success))]',
} as const

/**
 * The ramp in five stops for a fill that carries numbers: danger, danger and warning half and
 * half, warning, warning and success half and half, success. Between the stops neither a light
 * nor a dark ink reaches 4.5:1, so a numbered segment takes the nearest stop and the ink that
 * reads on it (`light` the status fg, `dark` the warning fg); `scripts/contrast.mjs` checks each.
 */
export function scaleRampStep(fraction: number): {
  half: 'low' | 'high'
  mix: string
  ink: 'light' | 'dark'
} {
  const stop = Math.round(Math.min(1, Math.max(0, fraction)) * 4) / 4
  const { half, mix } = scaleRamp(stop)
  return { half, mix, ink: stop === 0 || stop === 1 ? 'light' : 'dark' }
}

/** The ink of a numbered ramp stop: the light status ink, or the warning's dark one. */
export const SCALE_RAMP_INK = { light: 'text-danger-fg', dark: 'text-warning-fg' } as const

/** Which half of the ramp a fraction 0..1 falls in and how much of its first token it takes. */
export function scaleRamp(fraction: number): { half: 'low' | 'high'; mix: string } {
  const f = Math.min(1, Math.max(0, fraction))
  return f < 0.5
    ? { half: 'low', mix: `${Math.round((1 - f * 2) * 100)}%` }
    : { half: 'high', mix: `${Math.round((1 - (f - 0.5) * 2) * 100)}%` }
}
