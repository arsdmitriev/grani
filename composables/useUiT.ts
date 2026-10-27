import { currentScope } from './useShared'
import { computed } from 'vue'
import { en } from '../i18n/en'
import { pluralCategory } from '../utils/plural'
import { isDev } from '../utils/dev'
import type { UiMessageKey, UiPluralKey, UiTranslator } from '../types/ui'

/**
 * The library's translator. Components call `t()` instead of holding text; grani knows its keys
 * and their English, the app gives the language (`createGrani({ locale, translate })`).
 *
 * Resolution: the app's `translate` -> grani's English -> a visible marker in development.
 * Params fill whatever `{name}` is left, so a translate that returns a raw template works as
 * one that interpolated already. Call `t()` in templates or inside `computed()`; a value cached
 * in a plain `const` goes stale on a switch of language.
 */

/** Missing key: a visible marker in development, the bare key in production. @internal */
export function missingText(key: string, dev: boolean = isDev()): string {
  return dev ? `[missing:${key}]` : key
}

// Own keys only, here and in English: every object answers `constructor` and `toString` through
// its prototype, and `{constructor}` would print a function.
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_m, k: string) =>
    Object.hasOwn(params, k) ? String(params[k]) : `{${k}}`,
  )
}
const english = (key: string): string | undefined => (Object.hasOwn(en, key) ? en[key] : undefined)

// A formatter is costly to build and cheap to use: a table of a thousand dates and sums would
// build thousands of the same few. One per language and options, kept while the page lives;
// the set is small (a few per kind of cell), and it is dropped whole past a bound.
const FORMATS = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()
function cached<F extends Intl.NumberFormat | Intl.DateTimeFormat>(key: string, make: () => F): F {
  let f = FORMATS.get(key) as F | undefined
  if (!f) {
    if (FORMATS.size >= 200) FORMATS.clear()
    f = make()
    FORMATS.set(key, f)
  }
  return f
}
const numberFormat = (locale: string, options?: Intl.NumberFormatOptions) =>
  cached(
    `n|${locale}|${JSON.stringify(options ?? {})}`,
    () => new Intl.NumberFormat(locale, options),
  )
const dateFormat = (locale: string, options: Intl.DateTimeFormatOptions) =>
  cached(`d|${locale}|${JSON.stringify(options)}`, () => new Intl.DateTimeFormat(locale, options))

export function useUiT(): UiTranslator {
  const scope = currentScope()

  // The app's text when it has one: a non-empty string other than the key; grani's English
  // otherwise. A translate that throws (a malformed message in the app's i18n) costs one label its
  // language, never the screen: the same as an unreadable locale or zone.
  const own = (key: string, params?: Record<string, string | number>): string | undefined => {
    let text: unknown
    try {
      text = scope.translate?.(key, params)
    } catch (error) {
      if (isDev()) console.warn(`[grani] translate threw for "${key}"; English is shown.`, error)
      return undefined
    }
    return typeof text === 'string' && text !== '' && text !== key ? text : undefined
  }

  const t = (key: UiMessageKey, params?: Record<string, string | number>): string => {
    // Read so a template re-renders on a switch even when `translate` reads a plain variable.
    void scope.locale.value
    const raw = own(key, params) ?? english(key)
    return raw == null ? missingText(key) : interpolate(raw, params)
  }

  const n = (value: number, options?: Intl.NumberFormatOptions): string =>
    numberFormat(scope.locale.value, options).format(value)

  // `translate` is handed the number; the text shows a whole count grouped as the language does
  // ("1,234 selected"), so a count beside a sum in one table reads alike. A fraction is no count
  // and prints as it came.
  const tp = (
    key: UiPluralKey,
    count: number,
    params?: Record<string, string | number>,
  ): string => {
    const all = { ...params, n: count }
    const shown = { ...params, n: Number.isInteger(count) ? n(count) : count }
    const category = pluralCategory(scope.locale.value, count)
    const app = own(`${key}.${category}`, all) ?? own(`${key}.other`, all)
    if (app != null) return interpolate(app, shown)
    // The English text takes English rules: 21 is "other" there, whatever the language's rule.
    const fallback = english(`${key}.${pluralCategory('en', count)}`) ?? english(`${key}.other`)
    return fallback == null ? missingText(`${key}.${category}`) : interpolate(fallback, shown)
  }

  const d = (value: Date | number, options?: Intl.DateTimeFormatOptions): string =>
    dateFormat(scope.locale.value, {
      ...options,
      timeZone: options?.timeZone ?? (scope.timeZone.value || undefined),
    }).format(value)

  return {
    locale: computed(() => scope.locale.value),
    t,
    tp,
    n,
    d,
    timeZone: computed(() => scope.timeZone.value),
    currency: computed(() => scope.currency.value),
  }
}
