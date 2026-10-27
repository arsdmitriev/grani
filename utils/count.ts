/** A count as a mark reads it: a fraction floored, an endless count kept as the overflow, a negative, NaN or missing one `0`. */
export const countValue = (n: number | undefined): number =>
  n === Infinity ? Infinity : n !== undefined && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0

/** The largest count a mark shows as is: a whole number from 1, else 99. */
export const countMax = (max: number | undefined): number =>
  max !== undefined && Number.isFinite(max) && max >= 1 ? Math.floor(max) : 99

/** What a mark reads, and what its host says: the count, or `{max}+` above the cap. */
export const countText = (n: number | undefined, max?: number): string => {
  const count = countValue(n)
  const cap = countMax(max)
  return count > cap ? `${cap}+` : String(count)
}
