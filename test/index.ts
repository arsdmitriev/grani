// grani-ui/test: checks an app runs in its own Playwright suite on its screens built with grani, the
// promises grani proves for its own components. A check works the screen with the keyboard and by
// typing, and reads what a person and a screen reader get (the focus, ARIA, computed style, the
// network), never grani's insides, so it holds for any screen built with grani. A failure names the
// pattern by its title and the chapter of the package's text that explains it. A check that cannot
// run, because a locator matches nothing or a search sends no request, fails with
// `grani-ui/test <check>:` and what to fix in the test instead.
import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
  type Response,
  type Route,
} from '@playwright/test'

// The patterns the checks stand on: their titles, and the chapters in `llms/patterns/` that explain
// them. `test/consumerChecks.spec.ts` holds them to the rules' own titles and chapters.
const CHECKED = {
  focusStart: { title: 'Open with keyboard focus where the task begins', chapter: 'opening' },
  focusBack: { title: 'Continue from where you opened the panel', chapter: 'opening' },
  focusInvalid: { title: 'Go straight to the field that needs fixing', chapter: 'filling-in' },
  lateDropped: { title: 'Results match the current search', chapter: 'finding' },
  noJolt: { title: 'Keep nearby content in place while loading', chapter: 'waiting' },
} as const
type Checked = keyof typeof CHECKED

/** Where a request is matched, as `page.route` takes it. */
export type GraniEndpoint = string | RegExp | ((url: URL) => boolean)

export interface FocusStartsInsideOptions {
  /** The control that opens the panel; the check focuses it and presses Enter. */
  opener: Locator
  /** The panel it opens: a dialog, a drawer, a popover, a list. */
  panel: Locator
  /** Where the task begins: the field, list or button that should hold the focus, or hold it inside. */
  start: Locator
}

export interface FocusComesBackOptions {
  /** The control that opens the panel; the check focuses it and presses Enter. */
  opener: Locator
  /** The panel it opens. */
  panel: Locator
  /** Closes the panel as a person does; Escape when unset. */
  close?: () => Promise<void>
}

export interface FocusGoesToInvalidOptions {
  /** The button that sends the form, which already holds a value its check refuses. */
  submit: Locator
  /** The first field to fix, in the form's order; for a group, the focus may stand inside it. */
  field: Locator
}

export interface LateAnswerDroppedOptions {
  /** The search field the check types into. */
  search: Locator
  /** What the answers fill: the rows of a table, the options of a list. */
  results: Locator
  /** The request a search sends; while the check runs, only the two searches may send it. */
  endpoint: GraniEndpoint
  /** Two searches whose answers differ, the newer one finding something. */
  queries: readonly [older: string, newer: string]
}

export interface RefreshKeepsRowsOptions {
  /** The rows of the body in view before the refresh, not a header or a totals row. */
  rows: Locator
  /** Starts the refresh: a sort, another page, a Refresh button; not a new search. It may wait for the answer. */
  refresh: () => Promise<void>
  /** The request the refresh sends; its answer waits until the rows are read. */
  endpoint: GraniEndpoint
}

// A state counts once it has held this long, read every frame: a focus handed back late, or an old
// answer drawn a moment after it arrived, shows up inside it.
const HOLD = 300
// How long the screen may take to do what the check started: open a panel, send a request.
// Playwright's own default for an expect; a project's setting of it is not readable from here.
const SETUP = 5000

const broke = (id: Checked, what: string) =>
  new Error(
    `The pattern "${CHECKED[id].title}" did not hold: ${what}. Read node_modules/grani-ui/llms/patterns/${CHECKED[id].chapter}.md`,
  )
const setupError = (check: string, what: string) => new Error(`grani-ui/test ${check}: ${what}`)

// Only a timeout means the setup is wrong; any other error, such as one locator matching two
// elements or a closed page, is Playwright's own and says more as it is.
const onTimeout = (check: string, what: string) => (e: unknown) => {
  throw e instanceof Error && e.name === 'TimeoutError' ? setupError(check, what) : e
}
const found = (check: string, target: Locator, name: string) =>
  target
    .waitFor({ state: 'attached', timeout: SETUP })
    .catch(onTimeout(check, `${name} matched nothing`))

// The check is one step of the app's test, boxed, so a failure points at the line that called it.
const step = (id: Checked, body: () => Promise<void>) =>
  test.step(`grani: ${CHECKED[id].title}`, body, { box: true })

// Reads every frame until `read` returns `want`, and on a timeout throws `fail` of the last read.
// The failure is built only then: Playwright shows an expect's message as its step title, on a
// passing run too. An error inside a read (one locator matching two elements) is thrown as it is.
async function settle(
  read: () => Promise<string>,
  want: string,
  timeout: number,
  fail: (last: string) => Error,
) {
  let last = ''
  let error: unknown
  await expect
    .poll(
      async () => {
        try {
          last = await read()
          error = undefined
        } catch (e) {
          error = e
        }
        return error ? 'error' : last
      },
      { intervals: [16], timeout },
    )
    .toBe(want)
    .catch(() => {
      throw error ?? fail(last)
    })
}

// The target must get the focus, or hold it inside, and keep it for HOLD from that moment. Once the
// focus leaves, the check fails even if the focus comes back, and the message says where it went.
async function focusHolds(id: Checked, target: Locator, what: string) {
  let until = 0
  let lost: string | null = null
  await settle(
    async () => {
      if (!(await target.count())) {
        if (until) lost ??= 'it left the page'
        return lost ?? 'the target is not on the page'
      }
      const where = await target.evaluate((el) => {
        // `document.activeElement` stops at a shadow root's host.
        let at = document.activeElement
        while (at?.shadowRoot?.activeElement) at = at.shadowRoot.activeElement
        return at && el.contains(at) ? null : (at?.outerHTML.slice(0, 80) ?? 'nothing')
      })
      if (where === null) until ||= Date.now() + HOLD
      else if (until) lost ??= `it left for ${where}`
      if (!until) return `the focus is on ${where}`
      return lost ?? (Date.now() >= until ? 'held' : 'holding')
    },
    'held',
    HOLD + SETUP,
    (last) => broke(id, `${what} (${last})`),
  )
}

// Playwright's `focus()` reports success on an element that cannot take the focus, such as a
// disabled button, so the focus is read back.
async function focusOn(target: Locator) {
  await target.focus({ timeout: SETUP })
  return target.evaluate((el) => {
    let at = document.activeElement
    while (at?.shadowRoot?.activeElement) at = at.shadowRoot.activeElement
    return el === at
  })
}

async function openPanel(check: string, page: Page, opener: Locator, panel: Locator) {
  await found(check, opener, 'opener')
  if (!(await focusOn(opener))) throw setupError(check, 'opener could not take the focus')
  await page.keyboard.press('Enter')
  await panel
    .waitFor({ state: 'visible', timeout: SETUP })
    .catch(onTimeout(check, 'the panel did not open on Enter on its opener'))
}

/**
 * Opens a panel from the keyboard and checks that the focus lands where the task begins (the first
 * field, the list, the question's button) and stays there: "Open with keyboard focus where the task
 * begins".
 */
export async function focusStartsInside(page: Page, options: FocusStartsInsideOptions) {
  await step('focusStart', async () => {
    await openPanel('focusStartsInside', page, options.opener, options.panel)
    await found('focusStartsInside', options.start, 'start')
    await focusHolds(
      'focusStart',
      options.start,
      'once the panel opened, the focus is not where the task begins',
    )
  })
}

/**
 * Opens a panel from the keyboard, closes it, and checks that the focus comes back to the control
 * that opened it and stays there: "Continue from where you opened the panel". A press outside the
 * panel is no close for this check: the focus goes where that press puts it.
 */
export async function focusComesBack(page: Page, options: FocusComesBackOptions) {
  await step('focusBack', async () => {
    await openPanel('focusComesBack', page, options.opener, options.panel)
    await (options.close ? options.close() : page.keyboard.press('Escape'))
    await options.panel
      .waitFor({ state: 'hidden', timeout: SETUP })
      .catch(onTimeout('focusComesBack', 'the panel did not close'))
    await focusHolds(
      'focusBack',
      options.opener,
      'once the panel closed, the focus is not on the control that opened it',
    )
  })
}

/**
 * Sends a form whose value is refused from the keyboard and checks that the focus goes to the first
 * field to fix, in view: "Go straight to the field that needs fixing". A submit disabled while a
 * field is wrong fails it: the person can never be sent to the field.
 */
export async function focusGoesToInvalid(page: Page, options: FocusGoesToInvalidOptions) {
  await step('focusInvalid', async () => {
    await found('focusGoesToInvalid', options.submit, 'submit')
    await found('focusGoesToInvalid', options.field, 'field')
    if (!(await focusOn(options.submit)))
      throw broke(
        'focusInvalid',
        'the submit button could not take the focus, so it cannot be sent',
      )
    await page.keyboard.press('Enter')
    await focusHolds(
      'focusInvalid',
      options.field,
      'after a refused submit, the focus is not on the first field to fix',
    )
    await expect(options.field)
      .toBeInViewport()
      .catch(() => {
        throw broke('focusInvalid', 'the field to fix is out of view')
      })
  })
}

// Holds requests the endpoint matches until `release`, the first one or every one, and lets each go
// on to the app's own handlers or the network. Each request is followed to its end: answered (its
// body kept, so two answers can be told apart) or failed, the page's own abort of a search included.
function holdRequests(page: Page, endpoint: GraniEndpoint, every: boolean) {
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const requests: Request[] = []
  const bodies = new Map<number, string>()
  const ended = new Set<number>()
  const handler = async (route: Route) => {
    const at = requests.push(route.request()) - 1
    if (every || at === 0) await gate
    await route.fallback().catch(() => {})
  }
  const onResponse = async (response: Response) => {
    const at = requests.indexOf(response.request())
    if (at < 0) return
    bodies.set(at, await response.text().catch(() => ''))
    ended.add(at)
  }
  const onFailed = (request: Request) => {
    const at = requests.indexOf(request)
    if (at >= 0) ended.add(at)
  }
  return {
    async start() {
      await page.route(endpoint, handler)
      page.on('response', onResponse)
      page.on('requestfailed', onFailed)
    },
    sent: () => requests.length,
    ended: (at: number) => ended.has(at),
    body: (at: number) => bodies.get(at),
    release: () => release(),
    async stop() {
      release()
      await page.unroute(endpoint, handler)
      page.off('response', onResponse)
      page.off('requestfailed', onFailed)
    },
  }
}

// Why the check may see no request: an endpoint that misses the request's address, a service
// worker that answers it, or a route set up after the check began that answers it first.
const UNSEEN =
  "the endpoint matches; check it against the request's address (a service worker, or a route the test sets up after the check starts, also hides a request)"

const texts = (results: Locator) => results.allInnerTexts()

/**
 * Types two searches, answers the second first and the first after it, and checks that the results
 * stay those of the second: "Results match the current search". The two searches must get
 * different answers, and the second must find something.
 */
export async function lateAnswerDropped(page: Page, options: LateAnswerDroppedOptions) {
  await step('lateDropped', async () => {
    const check = 'lateAnswerDropped'
    const [older, newer] = options.queries
    await found(check, options.search, 'search')
    const hold = holdRequests(page, options.endpoint, false)
    try {
      await hold.start()
      await options.search.fill(older, { timeout: SETUP })
      await expect
        .poll(hold.sent, { timeout: SETUP })
        .toBeGreaterThan(0)
        .catch(() => {
          throw setupError(check, `typing "${older}" sent no request ${UNSEEN}`)
        })
      if (hold.sent() > 1)
        throw setupError(
          check,
          `typing "${older}" sent ${hold.sent()} requests the endpoint matches; the check needs one per search`,
        )
      await options.search
        .fill(newer, { timeout: SETUP })
        .catch(
          onTimeout(
            check,
            `"${newer}" could not be typed while the answer to "${older}" was on its way; the search field must stay editable`,
          ),
        )
      await expect
        .poll(() => hold.ended(1), { timeout: SETUP })
        .toBe(true)
        .catch(() => {
          throw setupError(check, `typing "${newer}" got no answer from the endpoint`)
        })
      // The newer answer drawn: two reads 100 ms apart agree.
      let last = ''
      await expect
        .poll(
          async () => {
            const now = JSON.stringify(await texts(options.results))
            const same = now === last
            last = now
            return same
          },
          { intervals: [100], timeout: SETUP },
        )
        .toBe(true)
        .catch(() => {
          throw setupError(check, `the results kept changing after "${newer}" was answered`)
        })
      if (last === '[]')
        throw setupError(
          check,
          `the results showed nothing for "${newer}"; take a newer search that finds something, and check the results locator`,
        )
      const shown = last
      hold.release()
      await expect
        .poll(() => hold.ended(0), { timeout: SETUP })
        .toBe(true)
        .catch(() => {
          throw setupError(check, `the answer to "${older}" never came once it was let go`)
        })
      const [a, b] = [hold.body(0), hold.body(1)]
      if (a !== undefined && a === b)
        throw setupError(
          check,
          `"${older}" and "${newer}" got the same answer; take two searches whose answers differ`,
        )
      // Once replaced, the check fails even if the screen puts the newer results back.
      const until = Date.now() + HOLD
      let replaced = false
      await settle(
        async () => {
          replaced ||= JSON.stringify(await texts(options.results)) !== shown
          if (replaced) return 'replaced'
          return Date.now() >= until ? 'kept' : 'holding'
        },
        'kept',
        HOLD + SETUP,
        () =>
          broke(
            'lateDropped',
            `the answer to "${older}", arriving after the answer to "${newer}", replaced its results`,
          ),
      )
    } finally {
      await hold.stop()
    }
  })
}

// What changed in the rows, in words: the first row no longer shown, or how many there are now.
function rowsChanged(before: string[], now: string[]) {
  const first = before.find((t) => !now.includes(t))
  return first === undefined
    ? `${before.length} rows became ${now.length}`
    : `"${first.replace(/\s+/g, ' ').slice(0, 60)}" is no longer shown`
}

/**
 * Starts a refresh, holds its answer, and checks that the rows in view stay, dimmed and marked busy,
 * while it is on its way: "Keep nearby content in place while loading".
 */
export async function refreshKeepsRows(page: Page, options: RefreshKeepsRowsOptions) {
  await step('noJolt', async () => {
    const check = 'refreshKeepsRows'
    const before = (await texts(options.rows)).sort()
    if (!before.length) throw setupError(check, 'no rows were in view before the refresh')
    if (await options.rows.evaluateAll((els) => els.some((el) => el.closest('[aria-busy="true"]'))))
      throw setupError(check, 'the rows were marked busy before the refresh; wait for the screen')
    const hold = holdRequests(page, options.endpoint, true)
    let refreshing: Promise<void> | undefined
    try {
      await hold.start()
      // A refresh that waits for its answer would wait forever on the one held here: the check
      // goes on once the request is out.
      refreshing = options.refresh()
      const sent = expect
        .poll(hold.sent, { timeout: SETUP })
        .toBeGreaterThan(0)
        .catch(() => {
          throw setupError(check, `the refresh sent no request ${UNSEEN}`)
        })
      await Promise.race([refreshing.then(() => sent), sent])
      // While the answer waits, for HOLD from the moment they are marked: the same rows, each under
      // an element marked busy, drawn dimmer.
      let gone: string | null = null
      let until = 0
      await settle(
        async () => {
          const now = (await texts(options.rows)).sort()
          if (JSON.stringify(now) !== JSON.stringify(before))
            gone ??= `the rows changed while the answer was on its way: ${rowsChanged(before, now)}`
          if (gone) return gone
          const marks = await options.rows.evaluateAll((els) =>
            els.map((el) => {
              let opacity = 1
              for (let at: Element | null = el; at; at = at.parentElement)
                opacity *= Number(getComputedStyle(at).opacity)
              return { busy: !!el.closest('[aria-busy="true"]'), dim: opacity < 1 }
            }),
          )
          if (!marks.every((m) => m.busy && m.dim)) {
            if (until) gone = 'the rows stopped being marked busy and dimmed before the answer came'
            return gone ?? 'the rows were not marked busy and dimmed'
          }
          until ||= Date.now() + HOLD
          return Date.now() >= until ? 'kept' : 'holding'
        },
        'kept',
        HOLD + SETUP,
        (last) =>
          broke(
            'noJolt',
            `the rows did not stay in view, marked busy and dimmed, while the refresh was on its way (${last})`,
          ),
      )
    } finally {
      await hold.stop()
    }
    await refreshing
  })
}
