// Under `white-space: nowrap` a break (NEL and the separators too) collapses to a space, and
// another control character draws nothing: both read as if the character were not there.
const BREAK = /\r\n|[\r\n\u0085\u2028\u2029]/g

/**
 * A copy of `text` with every line break and other control character turned into a visible mark
 * (`⏎`, the Unicode picture of the character, or `�` where it has none), one mark for one
 * character: a value cut in the middle still lands where it reads. Takes text that is shown, never
 * what is sent to the clipboard, which carries the character itself.
 */
export function visualizeControl(text: string): string {
  let out = ''
  // A C0 control's picture is 0x2400 above it, DEL has one; the C1 range has none.
  for (const ch of text.replace(BREAK, '⏎')) {
    const code = ch.codePointAt(0)!
    out +=
      code < 0x20
        ? String.fromCodePoint(0x2400 + code)
        : code === 0x7f
          ? '\u2421'
          : code < 0xa0 && code > 0x7f
            ? '\ufffd'
            : ch
  }
  return out
}
