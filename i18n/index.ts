import { en } from './en'
import { ru } from './ru'

export type { GraniMessageKey } from './en'
export type { GraniMessages, Messages } from './types'

/**
 * grani's keys with their text: `en` is the default every component falls back to, `ru` a ready
 * dictionary for the app to feed into its own i18n (`createGrani({ translate })`).
 */
export { en, ru }
