# Translations

grani is a set of components, not an i18n system. It knows its own keys and their
English; the app gives the language. `translate` returns the app's text for a key, or `undefined`,
`null` or the key itself when it has none, and grani falls back to its built-in English. A text that still holds
`{name}` is filled from the params, so a plain dictionary works as well as a library that
interpolates. Plural keys end in the CLDR category of the locale (`grani.select.selected.one`, `.few`,
`.other`); grani asks for the category, then for `.other`. A key the app has no text for shows grani's English
with English rules: 21 reads "21 selected", not a Russian form in English words. A `translate` that
returns an empty string or throws counts as no text.

`grani-ui/i18n` exports `en` and `ru`, every key with its text. Without an i18n library:

```ts
import { ru } from 'grani-ui/i18n'
createGrani({ locale: 'ru', translate: (key) => ru[key] })
```

With vue-i18n, grani's keys are dotted and flat; vue-i18n reads a dot as nesting unless
`flatJson: true` is set. It rewrites the messages it is given in place, so hand it a copy:

```ts
import { createI18n } from 'vue-i18n'
import { ru } from 'grani-ui/i18n'
const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  flatJson: true,
  messages: { ru: { ...ru } },
})
const grani = createGrani({
  locale: () => i18n.global.locale.value,
  // Asked only for a key it has: vue-i18n warns on every missing one, and a fallback locale would
  // answer with another language's text.
  translate: (key, params) => (i18n.global.te(key) ? i18n.global.t(key, params ?? {}) : undefined),
})
```

A key the app's i18n lacks is answered with `undefined`, and grani falls back to its built-in
English.

A count reaches `translate` as a number in `n`, and a library that interpolates writes it as it
came, "1234 selected", where grani's own text groups it as the language does, "1,234 selected". The adapter
formats it first, so a count reads like the sums beside it:

```ts
translate: (key, params) => {
  if (!i18n.global.te(key)) return undefined
  const n = params?.n
  return i18n.global.t(key, typeof n === 'number' ? { ...params, n: i18n.global.n(n) } : (params ?? {}))
},
```

Every key starts with `grani.`, so it cannot meet a key of the app. A dictionary for another
language can be checked by the compiler: typed as `GraniMessages` from `grani-ui/i18n`, it fails when a
key is missing, and takes the plural forms its language has beyond English.

```ts
import type { GraniMessages } from 'grani-ui/i18n'
export const de: GraniMessages = { 'grani.button.loading': 'Bitte warten…' /* …every key */ }
```
