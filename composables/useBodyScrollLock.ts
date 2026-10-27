/**
 * Locks the page scroll under an open overlay. Counted, not toggled: a confirm over a
 * drawer takes a second lock, and the page scrolls again only when the last one goes,
 * in whatever order they close. The scrollbar's width becomes padding on the body, so
 * the page does not jump sideways when the bar disappears.
 *
 * The count is the page's, not the app's: a page has one `<body>`, and two apps on it (or two
 * copies of the library) each releasing a lock of their own must not let it scroll under the
 * other's open window. So it lives on the global object, under a registered symbol every copy reads;
 * its name carries the number of its shape, and a new shape takes the next number.
 */
interface PageLock {
  holders: number
  saved: { overflow: string; paddingInlineEnd: string } | null
}

const PAGE = Symbol.for('grani:body-scroll-lock@1')

const pageLock = (): PageLock => {
  const g = globalThis as typeof globalThis & { [PAGE]?: PageLock }
  return (g[PAGE] ??= { holders: 0, saved: null })
}

export function useBodyScrollLock() {
  let holding = false

  const lock = () => {
    if (holding || typeof document === 'undefined') return
    holding = true
    const page = pageLock()
    if (page.holders++ > 0) return
    const body = document.body
    const bar = window.innerWidth - document.documentElement.clientWidth
    page.saved = { overflow: body.style.overflow, paddingInlineEnd: body.style.paddingInlineEnd }
    body.style.overflow = 'hidden'
    // At the end of a line, where the bar stands: the right in English, the left in Arabic.
    if (bar > 0) body.style.paddingInlineEnd = `${bar}px`
  }

  const unlock = () => {
    if (!holding) return
    holding = false
    const page = pageLock()
    if (--page.holders > 0 || !page.saved) return
    document.body.style.overflow = page.saved.overflow
    document.body.style.paddingInlineEnd = page.saved.paddingInlineEnd
    page.saved = null
  }

  return { lock, unlock }
}
