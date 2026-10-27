/**
 * A key held down sends its keydown again and again. A press read on keydown runs on each repeat:
 * a toggle flips back and forth, a pick closes a list and the next repeat opens it again on its
 * button, a button clicks at key-repeat speed. Enter and Space held down are one press; the arrows
 * and the letters still repeat, since they walk and type.
 * @internal
 */
export const isHeldPress = (e: KeyboardEvent) => e.repeat && (e.key === 'Enter' || e.key === ' ')

/**
 * On a native button each repeat of a held Enter clicks (Space clicks as it comes up, once): its
 * repeats press nothing. Bound to the button's keydown, or to a container's around its buttons.
 * @internal
 */
export function holdEnter(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.repeat) e.preventDefault()
}
