/** A number one can compute with: not NaN, not infinite. `null` from an API and `parseFloat('')` are not. */
export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Clamped to 0..1; a non-number is 0, so `width: NaN%` never reaches the DOM (the browser drops the rule and the bar stays empty without a word). */
export function clamp01(v: number): number {
  return isFiniteNumber(v) ? Math.min(1, Math.max(0, v)) : 0
}
