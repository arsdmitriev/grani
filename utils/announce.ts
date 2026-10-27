/**
 * Says `text` to a screen reader through one polite live region at the end of the page, outside
 * any button: a button's content is presentational, and some readers never say a region inside
 * one. The region outlives the control that spoke, so an outcome that arrives after a menu row
 * has closed is still heard. While a modal window is open (`aria-modal`), the words are said in a
 * region inside it instead, the one that holds the focus or else the last opened: a reader keeps
 * to it and may not hear the page's. A window that closes before the words are written is passed
 * for the page. Emptied first and filled a moment later, so the same words said twice are read
 * twice. Client only; on the server it does nothing.
 */
export function announce(text: string): void {
  if (typeof document === 'undefined' || !text) return
  let target: HTMLElement | null = null
  // The newest words replace what waits: a control says its latest outcome, not a backlog.
  page.stop()
  // Chosen again when the words are written, a beat after the emptying: a window that closed or
  // began to leave in between takes its region with it, so the words go where they are still read.
  page.say((words) => {
    if (!target || (words && !speaks(target))) target = regionNow()
    target.textContent = words
  }, text)
}

// A window made inert under another, or on its way out (its leave transition running), is passed.
const open = (el: Element) => !el.closest('[inert]') && !el.closest('[class*="-leave-active"]')
const speaks = (region: HTMLElement) => region.isConnected && open(region)
// The window a reader keeps to: the one with the focus, else the one drawn on top (a window
// teleported earlier in the template may stand before the one opened over it), the later on a tie.
function regionNow() {
  const windows = [...document.querySelectorAll<HTMLElement>('[aria-modal="true"]')].filter(open)
  const focused = document.activeElement
  const modal =
    windows.find((el) => el.contains(focused)) ??
    windows.reduce<HTMLElement | null>(
      (top, el) => (!top || layer(el) >= layer(top) ? el : top),
      null,
    )
  return modal ? regionIn(modal) : pageRegion()
}
// The stacking order of the nearest box that sets one: a window's backdrop carries its z-index.
function layer(el: Element) {
  for (let box: Element | null = el; box; box = box.parentElement) {
    const z = Number.parseInt(getComputedStyle(box).zIndex, 10)
    if (!Number.isNaN(z)) return z
  }
  return 0
}

// The `sr-only` rule, inline: a region must not depend on a class reaching the page.
const HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
}
function newRegion() {
  const region = document.createElement('div')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  Object.assign(region.style, HIDDEN)
  return region
}
function pageRegion() {
  let region = document.getElementById(REGION_ID)
  if (!region) {
    region = newRegion()
    region.id = REGION_ID
    document.body.appendChild(region)
  }
  return region
}
// A window keeps its own region, made the first time it speaks, and it goes with the window.
function regionIn(modal: HTMLElement) {
  let region = modal.querySelector<HTMLElement>(':scope > [data-announcer]')
  if (!region) {
    region = newRegion()
    // Inside a window grani draws, it is one of grani's elements, marked as every other one is.
    region.setAttribute('data-grani', '')
    region.setAttribute('data-announcer', '')
    modal.appendChild(region)
  }
  return region
}

const REGION_ID = 'ui-announcer'

// A region created just now is not watched yet, and words written over the same words are not read
// again: a line is emptied, then written this long after, and stays this long before the next.
const BEAT = 50

/** Where a line goes: a live region's text. */
type Write = (words: string) => void

/**
 * One reader's voice: lines said one after another in the order they came, each emptied first,
 * written a beat later and held a beat before the next empties its region. The page's live
 * region speaks through one; UiToaster speaks its toasts through its own.
 * @internal
 */
export function createAnnouncer() {
  const waiting: { write: Write; words: string }[] = []
  let beat: ReturnType<typeof setTimeout> | null = null
  const next = () => {
    const line = beat ? undefined : waiting.shift()
    if (!line) return
    line.write('')
    beat = setTimeout(() => {
      line.write(line.words)
      beat = setTimeout(() => {
        beat = null
        next()
      }, BEAT)
    }, BEAT)
  }
  return {
    /** Says the words into `write` after the lines already waiting. */
    say(write: Write, words: string) {
      waiting.push({ write, words })
      next()
    },
    /** Drops what waits and what is under way. */
    stop() {
      waiting.length = 0
      if (beat) clearTimeout(beat)
      beat = null
    },
  }
}

const page = createAnnouncer()

/**
 * Drops the page's line that waits or is under way, and says nothing: between tests, since a line
 * is written on the real clock a beat after it was said, when the next test's page may have no
 * document.
 * @internal
 */
export function hush(): void {
  page.stop()
}
