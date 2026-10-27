// An app's dictionary is checked against grani's keys: a missing key is a type error, a plural form
// English lacks (`.few`) is welcome. vue-tsc runs this in `npm run typecheck`.
import { en, type GraniMessageKey, type GraniMessages } from '../../i18n'

// A language begins as English with its own words over it, with no cast: `en` is typed as complete.
const complete: GraniMessages = { ...en }
const german: GraniMessages = { ...en, 'grani.button.loading': 'Bitte warten…' }
const withPlural: GraniMessages = { ...complete, 'grani.select.selected.few': '{count} выбрано' }

// @ts-expect-error a dictionary without every key is incomplete
const partial: GraniMessages = { 'grani.button.loading': 'Bitte warten…' }

// @ts-expect-error a key grani does not have is a typo
const typo: GraniMessageKey = 'grani.buton.loading'

export { complete, german, withPlural, partial, typo }
