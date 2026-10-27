import { parseDay } from './calendar'
import { isDev } from './dev'

// The same shape `test/storeKeys.spec.ts` holds the library to: every key it stores under.
const KEY = /^grani:[a-z]+(-[a-z]+)*$/

/**
 * What `sharedSnapshot` writes into the page, key by key, and the one shape each has: the store's
 * plain values. Everything else the store holds (toasts, a question, the hosts) never leaves the
 * server and never comes back: a seed is read from the page, which anything on it may have
 * written, and a toast, a question or a crashed calendar must not come from it. A new plain value
 * in the store joins this list, or `sharedSnapshot` leaves it out and names it in development
 * (`test/plugin.spec.ts`); `test/ssr/render.ssr.spec.ts` renders a page and takes its snapshot
 * back whole. @internal
 */
export const SEEDS: Readonly<Record<string, (value: unknown) => boolean>> = {
  // The day the server rendered, an ISO day.
  'grani:today': (v) =>
    typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && parseDay(v) !== null,
  // The moment UiDateCell reads relative times from, in milliseconds.
  'grani:date-cell-now': (v) =>
    typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(new Date(v).getTime()),
  // The toast UiCopyButton replaces on the next copy, by its id, or none.
  'grani:copy-toast': (v) => v === null || (typeof v === 'number' && Number.isInteger(v)),
}

/**
 * The seed `createGrani({ shared })` takes, narrowed to what `sharedSnapshot` writes: a key it
 * writes, with the shape it writes. A key or a value outside that is dropped, said once in
 * development by its key alone, never by its value. @internal
 */
export function sanitizeSharedSeed(seed: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(seed)) {
    if (!KEY.test(key)) {
      if (isDev())
        console.warn(`[grani] createGrani({ shared }) dropped "${key}": every key is grani:<name>.`)
      continue
    }
    const fits = SEEDS[key]
    if (!fits) {
      if (isDev())
        console.warn(
          `[grani] createGrani({ shared }) dropped "${key}": sharedSnapshot writes no such key.`,
        )
      continue
    }
    if (!fits(value)) {
      if (isDev())
        console.warn(
          `[grani] createGrani({ shared }) dropped "${key}": its value is not the shape sharedSnapshot writes for it.`,
        )
      continue
    }
    out[key] = value
  }
  return out
}
