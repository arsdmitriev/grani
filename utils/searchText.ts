/**
 * Text as a search compares it: lower case, with the accents of Latin and Cyrillic letters left out
 * (the marks of U+0300 to U+036F), so "munchen" finds München and the Cyrillic yo (U+0451) reads as
 * ie (U+0435). The breve that makes a letter of its own stays: the short i (U+0439) is never i
 * (U+0438), nor the short u (U+045E) u (U+0443). The marks of other scripts (kana voicing, vowel
 * signs) are part of their letters and stay too. Both the query and the text it is looked for in
 * go through it.
 */
export function searchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u0305\u0307-\u036f]|(?<![\u0438\u0443])\u0306/g, '')
    .normalize('NFC')
}
