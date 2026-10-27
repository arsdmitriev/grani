/**
 * Whether a key belongs to an IME composition: during it (`isComposing`), and the key that confirms
 * the candidate, which Safari sends after it has ended the composition, with `isComposing` already
 * false but key code 229. Such a key picks a word, never an option, an item, a step or a submit.
 * @internal
 */
export const isImeKey = (e: KeyboardEvent) => e.isComposing || e.keyCode === 229
