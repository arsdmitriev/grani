import { readonly, type App, type Component, type MaybeRefOrGetter, type Ref } from 'vue'
import { useConfirm } from './composables/useConfirm'
import {
  createScope,
  currencyCode,
  currentScope,
  provideScope,
  readableSize,
  readableZone,
  withScope,
  type GraniStorage,
  type GraniTeleport,
  type GraniTranslate,
  type Scope,
} from './composables/useShared'
import { useToast } from './composables/useToast'
import type { ControlSize } from './types/ui'
import { LINK } from './utils/routeLink'
import { sanitizeSharedSeed } from './utils/sharedSeed'
import { checkStyles } from './utils/stylesCheck'
import { isDev } from './utils/dev'

export interface GraniOptions {
  /** The app's language, a BCP 47 tag or a ref or getter of one: dates, numbers, money and plural forms follow it. `en` unset. */
  locale?: MaybeRefOrGetter<string>
  /** The app's text for grani's keys (`i18n.t`); `undefined`, `null` or the key itself leaves grani's English. */
  translate?: GraniTranslate
  /** The step of every control without a `size` of its own: `xs`, `sm` (default) or `md`; another value is `sm`, said in development. */
  size?: ControlSize
  /** The IANA zone dates render in; unset or unknown, the device's. */
  timeZone?: string
  /** The ISO 4217 code money prints with; unset, an amount is the number alone. */
  currency?: string
  /** The link component for the app's own paths; unset, `RouterLink` when the app has a router, else a plain anchor. */
  link?: Component
  /** Values a server wrote into the page (`sharedSnapshot`), so the first render reads the same day. Only the keys the snapshot writes are taken, each in its shape; anything else is dropped, said once in development by its key. */
  shared?: Record<string, unknown>
  /** Where a person's view settings (a table's columns) are kept: `getItem`, `setItem`, `removeItem`; unset, `localStorage`. */
  storage?: GraniStorage
  /** Where windows, drawers, popovers, tooltips and toasts are moved to: a CSS selector or an element; unset, `body`. */
  teleport?: GraniTeleport
  /** The focus mark: `quiet` (unset), a soft halo below the 3:1 WCAG asks of one; `strong`, a ring of the text color over a gap of the surface, 3:1 or more on any theme and brand. It marks the whole page while the app is mounted (`data-grani-focus` on `<html>`, which a server render may write itself). */
  focus?: 'quiet' | 'strong'
}

/** One installation of grani: `app.use(grani)`, its settings, and its toast and confirm for code outside components. */
export interface Grani {
  install(app: App): void
  /** The language in use, read-only: the app's tag, or `en` when it is empty or unreadable. */
  readonly locale: Readonly<Ref<string>>
  /** The step of the control ladder, read-only; `setSize` changes it. */
  readonly size: Readonly<Ref<ControlSize>>
  /** The zone dates render in, read-only; empty is the device's. */
  readonly timeZone: Readonly<Ref<string>>
  /** The money's code, read-only; empty is none. */
  readonly currency: Readonly<Ref<string>>
  /** Where overlays are moved to: the app's `teleport`, or `body`. */
  readonly teleport: GraniTeleport
  /** Moves every control without a `size` of its own to this step; the page follows at once. Another value is `sm`, said in development. */
  setSize(size: ControlSize): void
  /** Renders dates in this IANA zone; an empty or unknown name is the device's zone. */
  setTimeZone(timeZone: string): void
  /** Prints money with this ISO 4217 code; empty prints the number alone. */
  setCurrency(code: string): void
  /** `useToast()` of this app, for a router guard or a timer. */
  readonly toast: ReturnType<typeof useToast>
  /** `useConfirm()` of this app, for a router guard or a timer. */
  readonly confirm: ReturnType<typeof useConfirm>
}

const instances = new WeakMap<Scope, Grani>()

// The ring is drawn by the page's stylesheet, so the mark is the page's: on `<html>`, where every
// app on the page and the overlays moved to the body read it, while one app that asked for it is
// installed. A browser only; a server render of the strong mark writes the attribute itself.
const strongApps = new Set<App>()
function markFocus(app: App, focus: GraniOptions['focus']) {
  if (focus !== 'strong' || typeof document === 'undefined') return
  strongApps.add(app)
  document.documentElement.setAttribute('data-grani-focus', 'strong')
  app.onUnmount(() => {
    strongApps.delete(app)
    if (!strongApps.size) document.documentElement.removeAttribute('data-grani-focus')
  })
}

function instanceOf(
  scope: Scope,
  link: Component | null = null,
  focus: GraniOptions['focus'] = 'quiet',
): Grani {
  const known = instances.get(scope)
  if (known) return known
  // Built on first use, in the scope: what they keep reads this app's store, wherever they are called.
  let toast: ReturnType<typeof useToast> | undefined
  let confirm: ReturnType<typeof useConfirm> | undefined
  const grani: Grani = {
    install(app: App) {
      provideScope(app, scope)
      app.provide(LINK, link)
      markFocus(app, focus)
      checkStyles()
    },
    locale: scope.locale,
    size: readonly(scope.size),
    timeZone: readonly(scope.timeZone),
    currency: readonly(scope.currency),
    teleport: scope.teleport,
    setSize: (size) => void (scope.size.value = readableSize(size, 'setSize')),
    setTimeZone: (timeZone) => void (scope.timeZone.value = readableZone(timeZone)),
    setCurrency: (code) => void (scope.currency.value = currencyCode(code)),
    get toast() {
      return (toast ??= withScope(scope, useToast))
    },
    get confirm() {
      return (confirm ??= withScope(scope, useConfirm))
    },
  }
  instances.set(scope, grani)
  return grani
}

// The options `createGrani` reads, every key of GraniOptions (the type checks the list is whole): a key
// outside them is a typo that TypeScript catches only in a typed app.
const OPTIONS = Object.keys({
  locale: true,
  translate: true,
  size: true,
  timeZone: true,
  currency: true,
  link: true,
  shared: true,
  storage: true,
  teleport: true,
  focus: true,
} satisfies Record<keyof GraniOptions, true>)
const optionsWarned = new Set<string>()

/**
 * Installs grani in a Vue app: its language, size, zone and money, a store of shared state
 * (toasts, confirm) and the link its components draw. Each call is its own instance: two apps on
 * one page, or two requests on one server, never share a setting.
 * `const grani = createGrani({ locale, translate }); app.use(grani)`.
 */
export function createGrani(options: GraniOptions = {}): Grani {
  if (isDev())
    for (const key of Object.keys(options)) {
      if (OPTIONS.includes(key) || optionsWarned.has(key)) continue
      optionsWarned.add(key)
      console.warn(
        `[grani] createGrani has no option "${key}"; it takes ${OPTIONS.slice(0, -1).join(', ')} and ${OPTIONS.at(-1)}.`,
      )
    }
  const shared = options.shared && sanitizeSharedSeed(options.shared)
  return instanceOf(createScope(options, shared), options.link ?? null, options.focus)
}

/**
 * The instance of the app a component belongs to; without the plugin, the module's own:
 * English, `sm`, the device's zone.
 */
export function useGrani(): Grani {
  return instanceOf(currentScope())
}
