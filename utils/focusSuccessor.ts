// A control can leave the page while a layer opened from it holds the focus: a row deleted inside
// its question's `action`. What it stood in (a table) names the control now in its place, and the
// layer gives the focus back there rather than to a node that is gone.
const successors = new WeakMap<Element, Element>()

/** `next` takes the focus meant for `gone`, a control that left the page. @internal */
export function succeed(gone: Element, next: Element) {
  successors.set(gone, next)
}

/** What stands in for `el` once it left the page, through every hand-on; `el` itself while it is there. @internal */
export function standIn<E extends Element>(el: E | null | undefined): Element | null | undefined {
  let at: Element | null | undefined = el
  const seen = new Set<Element>()
  while (at && !at.isConnected && successors.has(at) && !seen.has(at)) {
    seen.add(at)
    at = successors.get(at)
  }
  return at
}
