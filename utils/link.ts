import type { Ref } from 'vue'
import { graniKey } from './key'

/**
 * An address the way the URL parser reads it: C0 controls and spaces trimmed from both ends, and
 * every tab, LF and CR dropped wherever it stands. Every predicate here reads this, not the raw
 * string, or `java\tscript:` and `http:\t//evil.example` slip past a check the parser does not
 * make. Anything that is no string reads as no address. @internal
 */
export function normalizeAddress(to: unknown): string {
  if (typeof to !== 'string') return ''
  // Every code up to 0x20 is a C0 control or the space: the parser trims them from both ends.
  let start = 0
  let end = to.length
  while (start < end && to.charCodeAt(start) <= 0x20) start++
  while (end > start && to.charCodeAt(end - 1) <= 0x20) end--
  return to.slice(start, end).replace(/[\t\n\r]/g, '')
}

/**
 * Where a link goes, shared by UiLink, UiButton and UiListItem so the three never drift: one
 * predicate for "another site", one for an address that must not be a link, one resolution of
 * `target` and `rel`, and the flag a link sets for what it holds.
 * An absolute web address opens in a new tab; `mailto:` and `tel:` hand off to an app and stay
 * put: a new tab there is left empty and "opens in a new tab" is untrue. The app's own origin
 * written in full counts as absolute: pass `target="_self"` for it.
 */
export const opensElsewhere = (to: string | undefined) =>
  // A web scheme, written in any of the ways the parser accepts (`http:evil.example`,
  // `http:/evil.example`), or two slashes, a backslash among them: `/\evil.example` goes to another
  // site. A same-scheme `https:path` the parser keeps on the page is counted too: a new tab is the
  // cost of that rare spelling, a leaked address the cost of missing one.
  /^(?:https?:|[/\\]{2})/i.test(normalizeAddress(to))

/**
 * Whether `to` is an address at all. The app's data may hold none where the types say a string
 * (`null`, a blank, a number from a tenant's menu): no address is as no `to`, never a link.
 */
export const hasAddress = (to: unknown): to is string => normalizeAddress(to) !== ''

/**
 * An address that runs script or carries a document: never rendered as a link. Read the way the
 * URL parser reads it (`normalizeAddress`), or `java\tscript:` slips past. Anything that is no
 * string (the app's data may hold a number where the types say a string) is no script either:
 * RouteLink draws no link for it, and nothing here throws on it.
 */
export function unsafeHref(to: string | undefined): boolean {
  return /^(javascript|data|vbscript):/i.test(normalizeAddress(to))
}

/**
 * The anchor's `target` and `rel` for an address: a caller's `target` decides, unset a new tab
 * for another site only. A new tab always has `noopener`; another site has `noreferrer` unless
 * the caller's `rel` replaces it (`nofollow`, `sponsored`). An explicit `_self` is kept.
 */
export function linkTarget(
  to: string | undefined,
  target?: '_blank' | '_self',
  rel?: string,
): { newTab: boolean; target: '_blank' | '_self' | undefined; rel: string | undefined } {
  const external = opensElsewhere(to)
  // A window by name (`target="report"`) is another window too: `noopener`, and said.
  const newTab = target ? !['_self', '_parent', '_top'].includes(target) : external
  // The app's data may hold no string where the types say one: no rel then, never a throw.
  const given = typeof rel === 'string' ? rel.trim() : ''
  const own = given ? given.split(/\s+/) : external ? ['noreferrer'] : []
  const all = newTab ? ['noopener', ...own] : own
  return {
    newTab,
    target: target ?? (newTab ? '_blank' : undefined),
    rel: all.length ? [...new Set(all)].join(' ') : undefined,
  }
}

/** Set by a whole-row link (UiListItem, UiButton with `to`): a link inside it is a link in a link. */
export const INSIDE_LINK = graniKey<Ref<boolean>>('inside-link')
