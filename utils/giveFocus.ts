/**
 * Gives the focus to `target()` now, and frame by frame until it takes, a dozen frames at most,
 * while `wanted()` holds: a panel just shown is `visibility: hidden` for its position, and the
 * browser may count what it holds as hidden for a few frames more (measured: 4 or 5), refusing the
 * focus meanwhile. Never over a focus the person moved: a press or a key from here on is theirs and
 * ends it. A focus that moved with neither was moved by code, and is taken over: a menu that closes
 * behind the item that opened this hands the focus to its button (Firefox does that first), and
 * Safari focuses no pressed button but the nearest focusable box around it. @internal
 */
export function giveFocus(
  target: () => HTMLElement | null | undefined,
  wanted: () => boolean,
): void {
  let theirs = false
  const mark = () => (theirs = true)
  const done = () => {
    document.removeEventListener('pointerdown', mark, true)
    document.removeEventListener('keydown', mark, true)
  }
  document.addEventListener('pointerdown', mark, true)
  document.addEventListener('keydown', mark, true)
  let tries = 12
  const give = () => {
    const el = target()
    if (theirs || !el || !wanted() || tries-- <= 0) return done()
    if (document.activeElement !== el) el.focus()
    if (document.activeElement === el) return done()
    requestAnimationFrame(give)
  }
  give()
}
