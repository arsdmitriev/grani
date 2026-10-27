import type { GraniMessageKey } from './en'

/** Flat dot-keyed messages: `'grani.button.loading' -> 'In progress…'`. */
export type Messages = Record<string, string>

/**
 * A dictionary for an app's language: a text for every key grani asks for, so a missing one fails
 * the type check, plus the plural forms its language has beyond English (`.few`, `.many`).
 */
export type GraniMessages = Record<GraniMessageKey, string> & Messages
