import {
  computed,
  getCurrentInstance,
  hasInjectionContext,
  inject,
  markRaw,
  ref,
  ssrContextKey,
  toValue,
  type App,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import type { ControlSize } from '../types/ui'
import { DEFAULT_CONTROL_SIZE } from '../utils/controlSize'
import { copiesWarning, graniKey } from '../utils/key'
import { isDev } from '../utils/dev'
import { SEEDS } from '../utils/sharedSeed'

type Store = Map<string, Ref<unknown>>

/**
 * The app's translator, as `createGrani({ translate })` takes it: the text for a key with its
 * params, or `undefined`, `null` or the key itself when the app has none, and grani's English stands.
 */
export type GraniTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string | null | undefined

/**
 * Where an app keeps a person's view settings (the columns a table shows): `localStorage` unless
 * `createGrani({ storage })` names another. Read and written synchronously; a call that throws
 * keeps the default.
 */
export interface GraniStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Where overlays are moved to in the page: a CSS selector or an element; `body` by default. */
export type GraniTeleport = string | HTMLElement

/**
 * What one installation of grani holds: its settings and its store of shared state. The
 * plugin provides it; without one, a single scope of the module serves.
 * @internal
 */
export interface Scope {
  store: Store
  /** A BCP 47 tag Intl accepts; `en` when the app's value is empty or unreadable. */
  locale: Readonly<Ref<string>>
  translate: GraniTranslate | undefined
  size: Ref<ControlSize>
  /** IANA zone; empty is the device's. */
  timeZone: Ref<string>
  /** ISO 4217 code; empty is none. */
  currency: Ref<string>
  /** The app's own storage for view settings; unset is `localStorage`, looked up when used. */
  storage: GraniStorage | undefined
  /** Where windows, drawers, popovers, tooltips and toasts are moved to. */
  teleport: GraniTeleport
  /** What runs when the app unmounts (a listener on the document taken off); `onScopeEnd` adds to it. */
  ends: Set<() => void>
  /** How many mounted apps have it installed: one instance may serve several, and ends with the last. */
  installs: number
}

/** The settings a scope starts from. @internal */
export interface ScopeSettings {
  locale?: MaybeRefOrGetter<string>
  translate?: GraniTranslate
  size?: ControlSize
  timeZone?: string
  currency?: string
  storage?: GraniStorage
  teleport?: GraniTeleport
}

const SCOPE = graniKey<Scope>('scope')

// A tag Intl throws on (`'en_US'`, `''`) would crash every number on the page; the app's value
// comes from its own i18n, so an unreadable one renders English instead.
function readableLocale(value: string | undefined): string {
  if (!value) return 'en'
  try {
    const tag = Intl.getCanonicalLocales(value)[0]
    // Well-formed is not known: 'xx-invalid' parses, then Intl formats it as its own default
    // while the app would read 'xx-invalid' back. Only a locale Intl has data for stands.
    return tag && Intl.NumberFormat.supportedLocalesOf(tag).length ? tag : 'en'
  } catch {
    return 'en'
  }
}

/**
 * An IANA zone Intl knows, else empty: the zone comes from data, and a date in the device zone
 * is a small error while a crashed screen is not.
 * @internal
 */
export function readableZone(value: string | undefined): string {
  if (!value) return ''
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(0)
    return value
  } catch {
    return ''
  }
}

/** The currency as the cells print it. @internal */
export function currencyCode(value: string | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

/**
 * A scope over the settings, its store seeded with what a server wrote into the page.
 * @internal
 */
export function createScope(
  settings: ScopeSettings = {},
  initial: Record<string, unknown> = {},
): Scope {
  const store: Store = new Map()
  for (const [key, value] of Object.entries(initial)) store.set(key, ref(value))
  return {
    store,
    locale: computed(() => readableLocale(toValue(settings.locale))),
    translate: settings.translate,
    size: ref(readableSize(settings.size, 'createGrani({ size })')),
    timeZone: ref(readableZone(settings.timeZone)),
    currency: ref(currencyCode(settings.currency)),
    storage: settings.storage,
    teleport: settings.teleport || 'body',
    ends: new Set(),
    installs: 0,
  }
}

// Each end once, then forgotten: a scope installed again starts clean.
function end(scope: Scope): void {
  const ends = [...scope.ends]
  scope.ends.clear()
  for (const fn of ends) fn()
}

let fallback = createScope()
// Set only while `withScope` runs: an instance's own toast and confirm are built in it.
let scoped: Scope | null = null

// The apps in this page that installed grani, each with its scope, so that a call outside any
// component can find the one app when there is only one. Kept on the page, under a key of this
// line, so a second copy of grani finds the app the first one installed. Meant for a browser: a
// server renders many requests at once and none of them may reach another's toasts. A shim that
// defines `window` on a server (jsdom, happy-dom's GlobalRegistrator) still lets an app in here,
// since nothing at `provideScope` time yet says which app a server will render; `ssrMarked` is
// what tells the two apart once rendering starts, at every later read of this map.
const APPS = graniKey<Map<App, Scope>>('apps') as symbol
function installed(): Map<App, Scope> {
  const g = globalThis as typeof globalThis & Record<symbol, Map<App, Scope> | undefined>
  return (g[APPS] ??= new Map())
}

// `renderToString` and its streaming siblings provide this key on every app they render, a shim
// or not; nothing else ever does. The one check a shim cannot spoof.
function ssrMarked(app: App): boolean {
  return app._context.provides[ssrContextKey] !== undefined
}

// The scopes installed on a server: one installed again is one `createGrani()` shared by every
// request's app, which hands one person's toasts and shared state to the next person's page.
const installedOnServer = new WeakSet<Scope>()
let warnedShared = false

// In production too: what leaks is another person's data, and the log is where it is seen.
function sayShared() {
  if (warnedShared) return
  warnedShared = true
  console.warn(
    '[grani] One createGrani() is installed in a second app on the server: requests share its ' +
      "toasts, questions and shared state, and one person's reach another's page. Make a " +
      'createGrani() per request, with the app.',
  )
}

/** Gives the app its scope; called by `createGrani`. @internal */
export function provideScope(app: App, scope: Scope): void {
  app.provide(SCOPE, scope)
  if (typeof window === 'undefined') {
    if (installedOnServer.has(scope)) sayShared()
    installedOnServer.add(scope)
    return
  }
  const apps = installed()
  // An app a server started rendering since it was last read here is dropped instead of living
  // in this map forever: a server app is never unmounted, the only other way one would leave.
  // Under a DOM shim this is where a server is told apart: its instance is a server's from here
  // on, and installed again it is one shared by requests.
  for (const [a, s] of apps)
    if (ssrMarked(a)) {
      installedOnServer.add(s)
      apps.delete(a)
    }
  if (installedOnServer.has(scope)) sayShared()
  apps.set(app, scope)
  scope.installs++
  // An unmounted app no longer counts; what the instance set up on the page goes with the last app
  // that has it, and is set up again on its next use.
  app.onUnmount?.(() => {
    apps.delete(app)
    if (--scope.installs <= 0) end(scope)
  })
}

let warnedMany = false
// The scope of the one app that installed grani, for a call outside any component (a click handler
// after an `await`, a timer). With several apps it cannot tell which one is meant and says so;
// with none, the module's scope is the one every component reads too, so the call still works.
// Meant for a browser; a real server never has anything left here to find once `currentScope`'s
// own server checks below have run, a shimmed one only until the apps it rendered are read once.
function soleScope(): Scope | null {
  const scopes = new Set(installed().values())
  if (scopes.size === 1) return scopes.values().next().value!
  if (scopes.size > 1 && !warnedMany && isDev()) {
    warnedMany = true
    console.warn(
      `[grani] A call outside a component's setup cannot tell which of the ${scopes.size} apps on ` +
        'this page it belongs to, so its toast or question reaches none of them. Call useToast() or ' +
        "useConfirm() in setup and keep what it returns, or use that app's instance: grani.toast, grani.confirm.",
    )
  }
  return null
}

let warnedServerFallback = false
// Once true, stays true: a process that has rendered one request for a server cannot go back to
// being a single browser page, so every later call that reaches no app's context, however it does
// so, is this server's too, never the shared scope `fallback` is in a real browser.
let sawServerRender = false

// A render with no plugin still shares one scope with itself: the components it is made of are
// `getCurrentInstance()?.appContext.app`'s own, that one app, so a toast shown by one still
// reaches that render's own UiToaster. A different render is a different app, so it never does.
// An entry leaves with the app itself (a `WeakMap`), so nothing here outlives a request.
const serverScopes = new WeakMap<App, Scope>()

// A server renders many requests at once, so nothing here may be shared the way the module's one
// scope is shared in a browser: a call that reaches no app's scope (outside a component's setup,
// after an `await`, or a render with no plugin installed) gets a scope of its own; inside a
// component it is that render's, outside one (no app to key by) it is this call's alone.
function serverFallback(): Scope {
  sawServerRender = true
  if (!warnedServerFallback && isDev()) {
    warnedServerFallback = true
    console.warn(
      "[grani] A grani composable reached no app's context on the server (outside a component's " +
        'setup, after an `await`, or a render with no createGrani() installed): a server renders ' +
        'many requests at once, so whatever this call returns is built for it alone and kept by ' +
        'nobody. Call it before the `await` and keep what it returns, or read it while still inside setup.',
    )
  }
  const app = getCurrentInstance()?.appContext.app
  if (!app) return createScope()
  let scope = serverScopes.get(app)
  if (!scope) serverScopes.set(app, (scope = createScope()))
  return scope
}

// Each copy records its version as it loads (`utils/key`); the copy that finds another says so. The
// import never throws: with no `process` and nothing replacing it in the app's build, it is production.
let copiesWarned: string | null = null
try {
  if (isDev()) copiesWarned = copiesWarning()
} catch {
  // Production, as far as anyone can tell.
}
if (copiesWarned) console.warn(copiesWarned)

/**
 * The scope a call belongs to: the one `withScope` runs, else the app's inside a component or
 * `app.runWithContext`. A call outside both (a router guard, a timer) takes the app that installed
 * grani when there is exactly one; with several it takes none and warns in development, and the
 * caller uses the app's instance (`grani.toast`) instead. Else the module's scope in a browser; on
 * a server, where that scope would answer every request at once, a throwaway scope of its own. A
 * server is `typeof window === 'undefined'`, or, under a shim that defines it, an app this call's
 * component was rendered by (`ssrContextKey`, which only `renderToString` and its siblings
 * provide) or, with no component to ask, an app already installed here that carries that mark.
 * @internal
 */
export function currentScope(): Scope {
  if (scoped) return scoped
  if (hasInjectionContext()) {
    const injected = inject(SCOPE, null)
    if (injected) return injected
    if (typeof window === 'undefined' || inject(ssrContextKey, null) !== null) {
      return serverFallback()
    }
    return fallback
  }
  if (typeof window === 'undefined' || sawServerRender) return serverFallback()
  // A shim makes every app installed here, a server's included: one of them still carrying the
  // mark (rendering, or done and not yet read here since) says this call is a server's too.
  for (const app of installed().keys()) if (ssrMarked(app)) return serverFallback()
  return soleScope() ?? fallback
}

/** Runs `fn` with `scope` as the current one; what it builds keeps reading that scope. @internal */
export function withScope<T>(scope: Scope, fn: () => T): T {
  const before = scoped
  scoped = scope
  try {
    return fn()
  } finally {
    scoped = before
  }
}

/**
 * Runs `fn` when the last app the current instance is installed in unmounts: a listener put on the
 * document on first use is taken off with it. Without the plugin, the module's scope ends between
 * tests. An end runs once; what needs it again registers again.
 * @internal
 */
export function onScopeEnd(fn: () => void): void {
  currentScope().ends.add(fn)
}

/**
 * State one app shares by key (toasts, confirm, today). Each `createGrani` instance holds its own
 * store; without the plugin one store of the module serves. The first caller's `init` sets the
 * value, later callers read the same ref. Every key is `grani:<name>` (`test/storeKeys.spec.ts`):
 * the store also holds what an app seeds through `createGrani({ shared })`, and no key of the
 * library may meet one of the app's.
 * @internal
 */
export function useShared<T>(key: string, init: () => T): Ref<T> {
  const store = currentScope().store
  if (!store.has(key)) store.set(key, ref(init()) as Ref<unknown>)
  return store.get(key) as Ref<T>
}

/**
 * The plain values of an app's store (strings, numbers, booleans), for a server to write into the
 * page so the browser's first render reads the same day the server did.
 */
export function sharedSnapshot(app: App): Record<string, unknown> {
  const scope = app.runWithContext(() => inject(SCOPE, null))
  const hosts = scope?.store.get('grani:hosts')?.value as Hosts | undefined
  if (hosts) sayMissingHosts(hosts)
  const out: Record<string, unknown> = {}
  for (const [key, r] of scope?.store ?? []) {
    const v = r.value
    if (v !== null && !['string', 'number', 'boolean'].includes(typeof v)) continue
    // Only what the browser takes back (`SEEDS`): another plain value would be written into the
    // page for nothing and dropped there, so it is left out and named, once, in development.
    if (!(key in SEEDS)) {
      if (isDev() && !snapshotWarned.has(key)) {
        snapshotWarned.add(key)
        console.warn(
          `[grani] sharedSnapshot leaves out "${key}": the browser takes back only the keys in SEEDS (utils/sharedSeed).`,
        )
      }
      continue
    }
    out[key] = v
  }
  return out
}
const snapshotWarned = new Set<string>()

/** How many hosts of each kind one app has mounted, and which missing ones it was told about. @internal */
export interface Hosts {
  toaster: number
  confirm: number
  warned: Set<string>
  /** On a server: what to say if no host of that kind was rendered, said when the render is over. */
  awaited?: Map<'toaster' | 'confirm', string>
}

/** The hosts mounted in the current app: UiToaster and UiConfirm count themselves here. @internal */
export function useHosts(): Hosts {
  return useShared<Hosts>('grani:hosts', () =>
    markRaw({ toaster: 0, confirm: 0, warned: new Set() }),
  ).value
}

/** A server render: no window, or the render context Vue gives every component it renders to a string. */
function onServer(): boolean {
  if (typeof window === 'undefined' || sawServerRender) return true
  return hasInjectionContext() && inject(ssrContextKey, null) !== null
}

/**
 * In development, says once per app that a toast or a question has no host to show it. Checked a
 * moment later, so a host mounted in the same turn (a toast shown just before `app.mount`) counts.
 * On a server nothing is mounted and a render may wait on data: the check waits for the render to
 * be over, when the app writes its state for the page (`sharedSnapshot`), and counts the hosts it
 * rendered (`renderedHost`). The caller asks `isDev()` first, so the message it passes goes out of a
 * production build with the call.
 * @internal
 */
export function expectHost(hosts: Hosts, kind: 'toaster' | 'confirm', message: string): void {
  if (hosts.warned.has(kind)) return
  if (onServer()) return void (hosts.awaited ??= new Map()).set(kind, message)
  setTimeout(() => {
    if (hosts[kind] > 0 || hosts.warned.has(kind)) return
    hosts.warned.add(kind)
    console.warn(message)
  }, 0)
}

/** A host rendered on a server, where it is never mounted: counted for `expectHost`. @internal */
export function renderedHost(hosts: Hosts, kind: 'toaster' | 'confirm'): void {
  if (onServer()) hosts[kind]++
}

function sayMissingHosts(hosts: Hosts): void {
  for (const [kind, message] of hosts.awaited ?? []) {
    if (hosts[kind] > 0 || hosts.warned.has(kind)) continue
    hosts.warned.add(kind)
    console.warn(message)
  }
  hosts.awaited?.clear()
}

const SIZES: readonly ControlSize[] = ['xs', 'sm', 'md']
const sizesWarned = new Set<string>()
/**
 * The step a setting names, or the default: a step the ladder lacks would leave every control
 * without its height. In development the wrong one is named with the ones there are. @internal
 */
export function readableSize(value: unknown, where: string): ControlSize {
  if (value === undefined || SIZES.includes(value as ControlSize)) {
    return (value as ControlSize | undefined) ?? DEFAULT_CONTROL_SIZE
  }
  const said = `${where}:${JSON.stringify(value)}`
  if (isDev() && !sizesWarned.has(said)) {
    sizesWarned.add(said)
    console.warn(
      `[grani] ${where} has no step ${JSON.stringify(value)}: it takes xs, sm or md; ${DEFAULT_CONTROL_SIZE} stands instead.`,
    )
  }
  return DEFAULT_CONTROL_SIZE
}

/** Where the overlays of the current app are moved to: `createGrani({ teleport })`, `body` unset. @internal */
export function useTeleport(): GraniTeleport {
  return currentScope().teleport
}

/**
 * A fresh scope for the module, its settings back to the defaults, and no app installed: between tests.
 * @internal
 */
export function resetShared(): void {
  end(fallback)
  fallback = createScope()
  scoped = null
  installed().clear()
  warnedMany = false
  warnedServerFallback = false
  warnedShared = false
  sawServerRender = false
}
