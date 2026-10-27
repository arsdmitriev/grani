export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

// One PluralRules per tag: a table of a thousand counted rows asks for each one. The set of
// tags an app actually uses is small and stays while the page lives; an app that reads the
// locale from the request (a new tag per visitor) is dropped whole past a bound, as FORMATS is
// in `useUiT.ts`.
const rules = new Map<string, Intl.PluralRules | null>()

/** CLDR plural category for a count in a locale; `other` when the tag is malformed. */
export function pluralCategory(locale: string, n: number): PluralCategory {
  if (!rules.has(locale)) {
    if (rules.size >= 200) rules.clear()
    try {
      rules.set(locale, new Intl.PluralRules(locale))
    } catch {
      rules.set(locale, null)
    }
  }
  return (rules.get(locale)?.select(n) as PluralCategory | undefined) ?? 'other'
}
