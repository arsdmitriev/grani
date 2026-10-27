// The rules of behavior as the package's text for language models and the showcase list them:
// each with its anchor, its reach and the address where it is read. Node reads this module, so a
// relative import carries its extension.
import { PATTERNS, type PatternEntry } from './patterns.ts'
import { IMPORTANCE } from './importance.ts'
import { REGISTRY } from '../../registry.ts'
import { MOMENT_KEYS, momentPath, momentSlug } from './moments.ts'
export { MOMENT_KEYS, momentPath, momentSlug }

/**
 * A rule with its key, its anchor in its chapter and its reach: how many surfaces hold it. The anchor
 * is the key's, not the title's: a title can be reworded without breaking a link to its frame.
 */
export interface Rule extends PatternEntry {
  key: string
  slug: string
  reach: number
}

/**
 * The components a rule holds on: those that show it on a tab, those that promise it in words, and
 * those a test proves it on. A proof of a helper (`focusInvalid`) names no component.
 */
export const placesOf = (r: PatternEntry): string[] => [
  ...new Set([
    ...Object.keys(r.at),
    ...Object.keys(r.holds ?? {}),
    ...Object.keys(r.proof ?? {}).filter((name) => name in REGISTRY),
  ]),
]

// Most important first (`importance.ts`), so every list of the rules reads that way.
const rank = (key: string) => (IMPORTANCE as readonly string[]).indexOf(key)
export const RULES: Rule[] = Object.entries(PATTERNS)
  .sort(([a], [b]) => rank(a) - rank(b))
  .map(([key, r]) => ({
    key,
    ...r,
    slug: key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
    // A rule of the library is held by every surface that shows it, promises it or is proven to keep
    // it; a promise to the app counts only where a surface shows it.
    reach: r.who === 'library' ? placesOf(r).length : Object.keys(r.at).length,
  }))

/** Where a rule is read: its frame. A rule no surface shows yet, the library's or the app's, has no page; nothing links to it, and its words stay in the text of the rules. */
export const linkOf = (rule: Rule) =>
  rule.reach >= 1 ? `${momentPath(rule.moment)}#${rule.slug}` : ''

/**
 * A component's part of a rule as an agent reads it, one field a line: the Markdown twin, the
 * text for language models and the page's Copy for AI all take these lines, so they never part.
 */
export function holdsLines(rule: PatternEntry, name: string, site: string): string[] {
  const c = rule.holds?.[name]
  if (!c) return []
  const proof = rule.proof?.[name]
  const titles = proof ? (Array.isArray(proof) ? proof : [proof]) : []
  const found = RULES.find((r) => r.title === rule.title)
  const link = found ? linkOf(found) : ''
  // A condition may already be a sentence of its own: it takes one full stop, not two.
  const stop = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`)
  return [
    `- When: ${stop(c.when)}`,
    `- Props: ${stop(c.props)}`,
    `- Guarantee: ${c.guarantee}`,
    `- Without it: ${c.without}`,
    `- Code: \`${c.code}\``,
    `- Your part: ${c.yours}`,
    ...(c.limit ? [`- Not covered: ${c.limit}`] : []),
    ...(titles.length
      ? [
          `- Proof, in the repository's tests (${name}.spec.ts, not in the package): ${titles.map((t) => `"${t}"`).join(', ')}`,
        ]
      : []),
    ...(link ? [`- Pattern for all components: ${site}${link}`] : []),
  ]
}
