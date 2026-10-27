import {
  computed,
  getCurrentInstance,
  markRaw,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  unref,
  watch,
  type ComputedRef,
  type MaybeRef,
  type MaybeRefOrGetter,
} from 'vue'
import type { TableColumn } from '../types/ui'
import { currentScope, useShared, type GraniStorage } from './useShared'
import { isDev } from '../utils/dev'

/**
 * Which columns a table shows, as one person prefers. The choice is personal, not a
 * view of the data, so it lives in the browser's storage and never in the URL: a link sent to
 * someone else must not rearrange their table. The key is the kind of table
 * (`invoices`), not the page: the same records opened elsewhere keep the setting.
 * One instance per kind at a time: two mounted at once in one app do not see each other's ticks,
 * and in dev they warn. However many are hidden, one column stays: an empty table reads as a
 * failed load.
 *
 * Storage. The choice is stored under `grani:columns:<tableKey>`, or
 * `grani:columns:<scope>:<tableKey>` with a `scope`, in `localStorage` unless
 * `createGrani({ storage })` gives the app's own (an object with `getItem`, `setItem` and
 * `removeItem`). A choice made in another tab reaches a mounted table through the browser's
 * `storage` event; the app's own storage sends none, and there the last tab to choose wins. In a browser app the stored choice is read before the first paint, so the table
 * does not jump; on a page rendered by a server it lands once mounted, so hydration matches.
 */
export interface TableColumnsOptions {
  /** Keys that cannot be hidden: usually the first column, the one that says what a row is. */
  required?: string[]
  /** Keys hidden on the first visit; `reset()` returns to them. */
  hiddenByDefault?: string[]
  /** Whose choice it is, such as the signed-in user's id: two people on one browser keep their own. A ref or a getter follows a sign-in. */
  scope?: MaybeRefOrGetter<string | null | undefined>
}

export interface TableColumns<T> {
  /** Every column, in the given order; the menu lists them. */
  all: ComputedRef<TableColumn<T>[]>
  /** The columns to draw, in the given order. */
  visible: ComputedRef<TableColumn<T>[]>
  /** Keys of the hidden columns among the current ones. */
  hidden: ComputedRef<string[]>
  /** Whether a column may be hidden: not a required one, and not the last one shown. */
  canToggle: (key: string) => boolean
  /** Whether a column is required: it is always shown. */
  isRequired: (key: string) => boolean
  /** Hides a shown column or shows a hidden one; a column that may not be hidden is left as it is. */
  toggle: (key: string) => void
  /** Back to the default, and the stored choice is forgotten: a later default reaches the person. */
  reset: () => void
  /** Whether the set differs from the default. */
  changed: ComputedRef<boolean>
}

const PREFIX = 'grani:columns:'

export function useTableColumns<T>(
  tableKey: string,
  columns: MaybeRef<TableColumn<T>[]>,
  options: TableColumnsOptions = {},
): TableColumns<T> {
  const storageKey = computed(() => {
    const scope = toValue(options.scope)
    return scope ? `${PREFIX}${scope}:${tableKey}` : `${PREFIX}${tableKey}`
  })
  const byDefault = () => [...(options.hiddenByDefault ?? [])]
  const own = currentScope().storage
  // Only in a browser: a server has no person to remember. Looked up on use, since reading
  // `localStorage` itself throws where storage is blocked.
  const storage = (): GraniStorage | undefined =>
    typeof window === 'undefined' ? undefined : (own ?? window.localStorage)

  // Unreadable or blocked storage yields the default: a view setting is not worth a broken page.
  // Nothing stored is the default too.
  const read = (): string[] => {
    try {
      const raw = storage()?.getItem(storageKey.value)
      if (!raw) return byDefault()
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed)
        ? parsed.filter((k): k is string => typeof k === 'string')
        : byDefault()
    } catch {
      return byDefault()
    }
  }

  // The stored set, whatever columns it names.
  const stored = ref<string[]>(byDefault())
  // Loading is not choosing: what is read is not written back, so a mere visit does not pin
  // today's default into storage, or a later change of `hiddenByDefault` would never reach that person.
  let loading = false
  const load = () => {
    if (typeof window === 'undefined') return
    loading = true
    stored.value = read()
    loading = false
  }

  const instance = getCurrentInstance()
  if (instance) {
    // A component being hydrated already has its element from the server's HTML. The server
    // rendered the default, so a hydrating table loads once mounted and hydration matches; a
    // table rendered in the browser loads now, before its first paint, and does not jump.
    const hydrating = Boolean(instance.vnode.el)
    if (!hydrating) load()
    // Two tables of one kind in one app write the same choice over each other. Counted per app:
    // two apps on one page each have their own table.
    const live = useShared('grani:columns-live', () => markRaw(new Map<string, number>())).value
    let counted = ''
    // A choice made in another tab reaches this one; the app's own storage sends no such event.
    const fromOtherTab = (e: StorageEvent) => {
      if (!own && (e.key === null || e.key === storageKey.value)) load()
    }
    onMounted(() => {
      if (hydrating) load()
      window.addEventListener('storage', fromOtherTab)
      counted = storageKey.value
      const n = (live.get(counted) ?? 0) + 1
      live.set(counted, n)
      if (isDev() && n > 1)
        console.warn(
          `[grani] useTableColumns: two tables share the key "${tableKey}"; give each kind its own.`,
        )
    })
    onBeforeUnmount(() => {
      window.removeEventListener('storage', fromOtherTab)
      live.set(counted, (live.get(counted) ?? 1) - 1)
    })
  } else load()

  // Another person signed in: their own choice, or the default.
  watch(storageKey, load)

  // Written at once, not on the next tick: a choice made right before a reload must land.
  watch(
    stored,
    (value) => {
      if (loading) return
      try {
        storage()?.setItem(storageKey.value, JSON.stringify(value))
      } catch {
        /* private mode: the setting lives for the page */
      }
    },
    { deep: true, flush: 'sync' },
  )

  const required = new Set(options.required ?? [])
  const isRequired = (key: string) => required.has(key)

  const all = computed(() => unref(columns))
  // A required column shows whatever an older visit stored; a key no longer in the columns is not counted.
  const asked = (key: string) => !isRequired(key) && stored.value.includes(key)
  // A stored set that hides every column (by hand, or from an older list) keeps the first one.
  const keeps = computed(() =>
    all.value.every((c) => asked(c.key)) ? all.value[0]?.key : undefined,
  )
  const isHidden = (key: string) => asked(key) && key !== keeps.value
  const hidden = computed(() => all.value.filter((c) => isHidden(c.key)).map((c) => c.key))
  const visible = computed(() => all.value.filter((c) => !isHidden(c.key)))
  const canToggle = (key: string) =>
    !isRequired(key) && !(visible.value.length === 1 && visible.value[0]!.key === key)

  function toggle(key: string) {
    if (!isHidden(key) && !canToggle(key)) return
    // A column kept from a set that hid them all is still stored as hidden: shown for real first,
    // or it would vanish the moment another column comes back.
    const kept = keeps.value
    const from = kept && kept !== key ? stored.value.filter((k) => k !== kept) : stored.value
    stored.value = from.includes(key) ? from.filter((k) => k !== key) : [...from, key]
  }

  function reset() {
    stored.value = byDefault()
    // Forgotten, not pinned: a later change of `hiddenByDefault` reaches this person.
    try {
      storage()?.removeItem(storageKey.value)
    } catch {
      /* blocked storage: nothing was kept */
    }
  }

  const changed = computed(() => {
    // The default counts only what can be hidden: a key both required and hidden by default is shown.
    const def = new Set(
      byDefault().filter((k) => canToggle(k) && all.value.some((c) => c.key === k)),
    )
    return hidden.value.length !== def.size || hidden.value.some((k) => !def.has(k))
  })

  return { all, visible, hidden, canToggle, isRequired, toggle, reset, changed }
}
