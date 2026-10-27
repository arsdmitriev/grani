import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  reactive,
  shallowRef,
  watch,
  type ComponentInternalInstance,
  type ShallowRef,
} from 'vue'
import type { SelectValue, TableSort } from '../types/ui'
import { isDev, warnOnce } from '../utils/dev'
import { isCorrection } from '../utils/listCorrection'

/**
 * The view of a list kept in the page's address: its search, sort, page and filters. A reload, a
 * link sent to a colleague and the browser's Back open the list as it was seen. Call it first in
 * the page's setup and bind the view to UiDataTable (`v-model:search`, `v-model:sort`,
 * `v-model:page`) and to each filter.
 *
 * Address. Each value stands under its own name (`?search=north&page=2&sort=-date&status=paid`), a
 * sort as its column, `-` before it when descending, several values as the key repeated. A value
 * equal to its default stays out, so the list as it opens has a clean address, and the keys of the
 * rest of the page stay as they are. A value the address cannot hold (`page=abc`, `page=0`) reads
 * as its default. A filter of numbers, such as ids, is named in `numbers`, or a reload reads its
 * values back as text; in development a number written without it is said.
 *
 * Sort. The sort the list opens on goes in the `sort` option (`{ key: 'issued', dir: 'desc' }`);
 * assigning it to the view after the call would overwrite the sort just read from the address. An
 * address with no `sort` reads that default, and a sort equal to it stays out of the address. A sort
 * cleared by the person is written as an empty `sort=`, which tells it from no `sort` at all, so a
 * reload opens it unsorted. A `sort` with no column in it (`-`) reads as the default. Anyone can
 * type the address, so `sortKeys` names the columns it may sort by: any other reads as the
 * default. Without `sortKeys` every key is read, and the app checks it before it reaches its request.
 *
 * History. What the person does is a step: a page, a sort or a filter adds one, which Back undoes,
 * and a typed search changes the step in place, so Back does not walk through every pause in the
 * typing. What the list corrects by itself, such as a page past the last, changes the step in
 * place, so Back never lands on an address that moves on again.
 *
 * Router. The app's router (`app.use(router)`) is found by itself, and the list belongs to the page
 * it was opened on: another page's address is neither read nor written. Without a router, the
 * browser's address and history. Another router is given as `address`. A navigation the router
 * refuses brings the view back to the address.
 *
 * Server. A page rendered by a server is drawn with the defaults, and the address lands once it is
 * mounted, so hydration matches; in a browser app the address is read before the first paint.
 */

/** A filter's value in the address: several values, one or none, a number, a text, on or off. */
export type ListFilterValue = SelectValue[] | SelectValue | null | boolean

/** The query of an address, as a router gives it: a key once, repeated, or with no value. */
export type ListQuery = Record<string, string | null | (string | null)[] | undefined>

/** Where the address is read and written, for a router the library does not find by itself. */
export interface ListAddress {
  /** The query now, read in a reactive scope so Back and Forward reach the list; `null` while the address is another page's. */
  read: () => ListQuery | null
  /** Writes the whole query: `push` adds a step to the history, `replace` changes the step in place. A promise that rejects, or resolves to an `Error` (a navigation refused), brings the view back to the address. */
  write: (query: ListQuery, how: 'push' | 'replace') => void | Promise<unknown>
}

/** The filters' values as the list's view holds them: an empty list holds any value. */
type Held<V> = [V] extends [never[]]
  ? SelectValue[]
  : [V] extends [null]
    ? SelectValue | null
    : V extends boolean
      ? boolean
      : V extends number
        ? number
        : V extends string
          ? string
          : V

/** The view of a list: the table's search, sort and page, and the filters. */
export type ListView<F> = { search: string; page: number; sort: TableSort } & {
  [K in keyof F]: Held<F[K]>
}

export interface ListAddressOptions<F> {
  /** Put before each key, so two lists on one page keep their own: `inv` writes `inv.page`. */
  prefix?: string
  /** The filters whose values are numbers, such as ids: read back from the address as numbers. */
  numbers?: (keyof F & string)[]
  /** The sort the list opens on, such as `{ key: 'issued', dir: 'desc' }`: an address with no `sort` reads it, and a sort equal to it stays out of the address. Unset, the list opens unsorted. */
  sort?: TableSort
  /** The columns the address may sort by. A `sort` naming another reads as the default sort, so a link or a typed address cannot put a column the app did not offer into the view. Unset, any key is read: the app checks it before it asks. */
  sortKeys?: string[]
  /** Where the address lives; unset, the app's router, else the browser's address and history. */
  address?: ListAddress
}

/** The router an app installs with `app.use(router)`, by the parts this reads. */
interface RouterLike {
  currentRoute: { value: { path: string; query: ListQuery; hash?: string } }
  push: (to: { path: string; query: ListQuery; hash?: string }) => unknown
  replace: (to: { path: string; query: ListQuery; hash?: string }) => unknown
}

// The query on its way to each router: two lists writing in one tick build on each other's, as
// the second navigation cancels the first.
const onTheWay = new WeakMap<object, ShallowRef<ListQuery | null>>()

function routerAddress(instance: ComponentInternalInstance | null): ListAddress | null {
  const router = instance?.appContext.config.globalProperties.$router as RouterLike | undefined
  if (!router?.currentRoute || typeof router.push !== 'function') return null
  let pending = onTheWay.get(router)
  if (!pending) onTheWay.set(router, (pending = shallowRef(null)))
  const sent = pending
  // The list belongs to the page it was opened on.
  const path = router.currentRoute.value.path
  const here = () => router.currentRoute.value.path === path
  return {
    read: () => (here() ? (sent.value ?? router.currentRoute.value.query) : null),
    write: (query, how) => {
      sent.value = query
      const hash = router.currentRoute.value.hash
      return Promise.resolve(router[how]({ path, query, hash })).finally(() => {
        if (sent.value === query) sent.value = null
      })
    },
  }
}

const fromSearch = (search: string): ListQuery => {
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of new URLSearchParams(search)) {
    const had = query[key]
    query[key] = had === undefined ? value : [...(Array.isArray(had) ? had : [had]), value]
  }
  return query
}
const toSearch = (query: ListQuery) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query))
    for (const v of Array.isArray(value) ? value : [value]) if (v != null) params.append(key, v)
  const text = params.toString()
  return text ? `?${text}` : ''
}

// The browser's own address, one for the page: every list reads what the others wrote, and Back
// and Forward reach them all through one listener while any is mounted.
let browser: (ListAddress & { follow: () => () => void; sync: () => void }) | undefined
function historyAddress() {
  if (!browser) {
    const query = shallowRef<ListQuery>({})
    const sync = () => (query.value = fromSearch(window.location.search))
    let following = 0
    browser = {
      read: () => query.value,
      write: (next, how) => {
        const url = `${window.location.pathname}${toSearch(next)}${window.location.hash}`
        window.history[how === 'push' ? 'pushState' : 'replaceState'](window.history.state, '', url)
        query.value = next
      },
      follow: () => {
        if (!following++) window.addEventListener('popstate', sync)
        return () => {
          if (!--following) window.removeEventListener('popstate', sync)
        }
      },
      sync,
    }
  }
  // A new list reads the address as it is now: it may have changed while no list followed it.
  browser.sync()
  return browser
}

// The person's presses and keys, counted for the page: a change of the view that follows one is
// the person's, and the rest is the list correcting itself.
let presses = 0
let counting = false
const countPresses = () => {
  if (counting) return
  counting = true
  for (const type of ['pointerdown', 'keydown'])
    window.addEventListener(type, () => presses++, { capture: true, passive: true })
}

const said = (v: unknown) => JSON.stringify(v)
// The values are text, numbers, flags and lists of them: a copy through JSON holds them, and a
// reactive default the app passes is copied too, where `structuredClone` refuses a proxy.
const copy = <T>(v: T): T => JSON.parse(said(v)) as T
// A value as text, so 5 and "5" from the address are one value.
const form = (v: unknown) =>
  said(Array.isArray(v) ? v.map(String) : v === null || typeof v === 'object' ? v : String(v))

/** One value as the address writes it; `undefined` leaves it out. */
function written(value: unknown, fallback: unknown): string | string[] | undefined {
  if (said(value) === said(fallback)) return undefined
  if (Array.isArray(value)) return value.length ? value.map(String) : ''
  if (value === null) return ''
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'object') {
    const sort = value as { key: string; dir: string }
    return `${sort.dir === 'desc' ? '-' : ''}${sort.key}`
  }
  return String(value)
}

/**
 * A sort as the address writes it: the column, `-` before it when descending, and nothing when
 * cleared. `undefined` for a text with no column in it (`-`), which the address cannot hold.
 */
function readSort(text: string, keys: string[] | undefined): TableSort | undefined {
  if (!text) return null
  const key = text.replace(/^-/, '').trim()
  if (!key || (keys && !keys.includes(key))) return undefined
  return { key, dir: text.startsWith('-') ? 'desc' : 'asc' }
}

/** One value as the view reads it from the address, in the shape of its default. */
function read(
  name: string,
  raw: ListQuery[string],
  fallback: unknown,
  numeric: boolean,
  sortKeys?: string[],
): unknown {
  if (raw === undefined) return copy(fallback)
  const list = (Array.isArray(raw) ? raw : [raw]).filter((v): v is string => v != null)
  const first = (list[0] ?? '').trim()
  const value = (s: string): SelectValue | undefined => {
    if (!numeric) return s
    const n = Number(s.trim())
    return s.trim() !== '' && Number.isFinite(n) ? n : undefined
  }
  if (name === 'sort') {
    const sort = readSort(first, sortKeys)
    return sort === undefined ? copy(fallback) : sort
  }
  // A page is a whole number from one, written in digits.
  if (name === 'page') return /^[1-9]\d*$/.test(first) ? Number(first) : fallback
  if (Array.isArray(fallback)) return list.filter((s) => s !== '').flatMap((s) => value(s) ?? [])
  if (typeof fallback === 'number') {
    const n = Number(first)
    return first !== '' && Number.isFinite(n) ? n : fallback
  }
  if (typeof fallback === 'boolean')
    return ['1', 'true'].includes(first) ? true : ['0', 'false'].includes(first) ? false : fallback
  if (fallback === null) return first === '' ? null : (value(first) ?? null)
  return list[0] ?? ''
}

/**
 * The view of a list, kept in the page's address. `filters` names the filters with their values
 * when nothing is chosen: `[]` for several values, `null` for one. `options.sort` is the sort the
 * list opens on and `options.sortKeys` the columns the address may sort by; without `sortKeys`,
 * the app checks the key read from the address before it reaches its request.
 */
export function useListAddress<
  F extends Record<string, ListFilterValue> & {
    search?: never
    page?: never
    sort?: never
  } = Record<never, never>,
>(filters: F = {} as F, options: ListAddressOptions<F> = {}): ListView<F> {
  // The fields in the order the table sends them, so a default told in another order is still equal to it.
  const sort = options.sort ? { key: options.sort.key, dir: options.sort.dir } : null
  const defaults: Record<string, unknown> = { search: '', page: 1, sort, ...filters }
  const names = Object.keys(defaults)
  const view = reactive(copy(defaults)) as Record<string, unknown>
  const instance = getCurrentInstance()
  const inBrowser = typeof window !== 'undefined'
  if (isDev() && !instance && !options.address)
    console.warn(
      "[grani] useListAddress: called outside a component's setup, it cannot find the app's router. Call it first in setup, or give `address`.",
    )
  const own = options.address ? null : routerAddress(instance)
  const local = options.address || own || !inBrowser ? null : historyAddress()
  const address: ListAddress = options.address ??
    own ??
    local ?? { read: () => ({}), write: () => {} }
  const keyOf = (name: string) => (options.prefix ? `${options.prefix}.${name}` : name)
  const numeric = new Set<string>(options.numbers ?? [])
  if (inBrowser) countPresses()

  const parse = (query: ListQuery) =>
    Object.fromEntries(
      names.map((n) => [
        n,
        read(n, query[keyOf(n)], defaults[n], numeric.has(n), options.sortKeys),
      ]),
    )
  const formNow = () => said(names.map((n) => form(view[n])))
  // The search last written or read: a change of it is typing, written in place.
  let search = ''
  // The presses counted when the view last met the address.
  let seen = presses
  // The address's view taken in: only what differs as text, so a filter's list keeps its array
  // and a number written a moment ago stays a number.
  const take = () => {
    const query = address.read()
    if (!query) return
    const next = parse(query)
    for (const n of names) if (form(view[n]) !== form(next[n])) view[n] = next[n]
    search = view.search as string
    seen = presses
  }

  // Nothing is written before the address is read: a first render keeps the server's view.
  let ready = false
  const begin = () => {
    take()
    ready = true
  }
  const hydrating = Boolean(instance?.vnode.el)
  if (inBrowser && !hydrating) begin()
  if (instance) {
    let stop = () => {}
    onMounted(() => {
      if (!ready) begin()
      if (local) stop = local.follow()
    })
    onBeforeUnmount(() => stop())
  }

  // Back, Forward or a link of the app: the view follows the address.
  watch(
    () => said(address.read()),
    () => ready && take(),
  )
  // A change of the view: the address takes it.
  watch(formNow, (now) => {
    if (!ready) return
    const current = address.read()
    if (!current) return
    const there = parse(current)
    if (said(names.map((n) => form(there[n]))) === now) return
    const query: ListQuery = { ...current }
    for (const n of names) {
      delete query[keyOf(n)]
      const value = written(view[n], defaults[n])
      if (value !== undefined) query[keyOf(n)] = value
      if (isDev() && !numeric.has(n) && typeof defaults[n] !== 'number')
        if ([view[n]].flat().some((v) => typeof v === 'number'))
          warnOnce(
            instance?.appContext.app,
            `listAddress:${n}`,
            `[grani] useListAddress: \`${n}\` holds numbers; name it in \`numbers\`, or a reload reads it back as text.`,
          )
    }
    // The address reads such a key back as the default, so the sort would snap back unexplained.
    const held = view.sort as TableSort
    if (isDev() && held && options.sortKeys && !options.sortKeys.includes(held.key))
      warnOnce(
        instance?.appContext.app,
        'listAddress:sortKeys',
        `[grani] useListAddress: \`sort\` holds \`${held.key}\`, which is not in \`sortKeys\`; the address cannot keep it, and it reads back as the default.`,
      )
    const typed = view.search !== search
    const pressed = presses !== seen
    search = view.search as string
    seen = presses
    const how = typed || !pressed || isCorrection() ? 'replace' : 'push'
    // A navigation refused, or one that failed, leaves the address as it was: the view goes back.
    Promise.resolve(address.write(query, how)).then(
      (failed) => failed instanceof Error && take(),
      () => take(),
    )
  })

  return view as ListView<F>
}
