/**
 * Shortens a string to about `max` characters by cutting the middle: an id keeps
 * its head and its tail (`613aa1…4510e0`), and ids that share a prefix stay apart.
 * Unchanged when it already fits.
 */
export function truncateMiddle(text: string, max: number): string {
  // Counted by code point: a cut by UTF-16 unit could split an emoji into two broken halves.
  const chars = Array.from(text)
  if (max <= 1 || chars.length <= max) return text
  const head = Math.ceil(max / 2)
  const tail = Math.floor(max / 2)
  return `${chars.slice(0, head).join('')}…${chars.slice(chars.length - tail).join('')}`
}
