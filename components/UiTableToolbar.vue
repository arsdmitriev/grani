<!--
  UiTableToolbar: the row above a list, with a built-in search, what narrows the list on the left
  and what acts on it on the right. UiDataTable builds it from its own props and slots.

  Clusters. `#start` holds what narrows the list (a period in UiDateRange, filters). `#end` holds
  what acts on it: catalog buttons, then the main action last. The columns menu is built in too;
  when the toolbar is given its state, it stands first on the right.

  Search. The search is built in and always present (`v-model:search`). The field takes every key;
  the value goes out after a 250 ms pause, and Enter sends it at once. A value set from outside (a
  reset, the URL) replaces what was being typed. When a host applies the model late, the toolbar's
  own sent values coming back are not taken for an outside value, so what was typed since stays,
  and a clear or a step back made while a value is on its way is sent too. A host that drops a
  value it was sent without a word keeps it counted as on its way, and takes one outside value
  equal to it for its answer.

  Size. Controls in the row share one step, `size`: the app's size (`createGrani({ size })`), or
  `sm` (36 px) if unset; `xs` for a dense row, `md` for a comfortable one. The slots get it as
  `{ size }` to bind on their controls.

  Layout. On a narrow screen the search takes a line of its own and the rest share the line under
  it. The row is padded 16 px, so it lines up with the table's cells under it and with its footer;
  the card around them is the shell.

  Placement. In UiDataTable's card, above the table; UiDataTable builds it from its search,
  `#filters`, `#actions` and `columns`. UiFilter and UiDateRange stand in `#start`,
  UiTableColumns first in the right cluster. A host may make it `inert` while a selection strip
  covers it.

  Keyboard.
  - `Tab`: reaches the search first (its cross next, while it holds text), then the controls in
    `#start`, the columns button and the controls in `#end`, in the order they stand.
  - `/`: from anywhere outside a field, goes to the search of the first list in view, in the
    window open over the page when there is one. An app that takes the key itself calls
    `preventDefault` on it first.
  In the search, where every key narrows the list after a 250 ms pause:
  - `Enter`: sends at once and does not submit a form around it.
  - `Escape`: empties it and keeps the focus, as the cross does.
  Leaving the field sends what was typed. The Enter that confirms an IME candidate sends nothing.

  Reader.
  - Search: a landmark (`role="search"`) named like its field, by `searchPlaceholder`, "Search"
    by default; UiDataTable adds its own name ("Search Invoices"), so two lists on one page keep
    their searches apart. The field says its shortcut, `/` (`aria-keyshortcuts`).
  - Row: has no name and no role.
  - Slots: what they hold is read as the controls they are.

  States. Rest, text in the search (the cross shows), a pending send, a value set from outside that
  replaces the typing, `inert` under a selection strip; the row at `xs`, `sm` and `md`, and on a
  narrow screen the search on a line of its own.

  Not for.
  - One block of table, toolbar, pages and states: UiDataTable.
  - A search outside a list: UiInput `type="search"`.
  - A second columns menu: never in `#end`; the toolbar draws it from `columns`.
-->
<template>
  <div class="flex flex-wrap items-center justify-between gap-2 p-4">
    <div class="flex flex-wrap items-center gap-2 max-sm:contents">
      <!-- The landmark is named as its field: two lists on one page keep their searches apart. -->
      <div
        ref="boxRef"
        role="search"
        :aria-label="searchPlaceholder || t('grani.tableToolbar.search')"
        class="w-full sm:w-64"
      >
        <UiInput
          v-model="local"
          type="search"
          :size="ladder"
          autocomplete="off"
          class="w-full"
          :placeholder="searchPlaceholder || t('grani.tableToolbar.search')"
          :ariaLabel="searchPlaceholder || t('grani.tableToolbar.search')"
          aria-keyshortcuts="/"
          data-search-key
          @keydown.enter="onEnter"
          @blur="send.flush()"
        >
          <template #start><Search /></template>
        </UiInput>
      </div>
      <slot name="start" :size="ladder" />
    </div>
    <div v-if="$slots.end || columns" class="flex flex-wrap items-center gap-2 max-sm:ms-auto">
      <UiTableColumns v-if="columns" :columns="columns" :size="ladder" />
      <slot name="end" :size="ladder" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { isImeKey } from '../utils/ime'
import { useControlSize } from '../composables/useControlSize'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import type { ControlSize } from '../types/ui'
import { debounce } from '../utils/debounce'
import type { TableColumns } from '../composables/useTableColumns'
import UiInput from './UiInput.vue'
import UiTableColumns from './UiTableColumns.vue'

const props = withDefaults(
  defineProps<{
    /** The search text (`v-model:search`); the field is always there. Sent as typed, spaces included, after a 250 ms pause or at Enter. */
    search: string
    /** What the search looks in; the field's placeholder and its name. */
    searchPlaceholder?: string
    /** The columns menu: the state from `useTableColumns`. The button stands first in the right cluster; without it the columns are fixed. */
    columns?: TableColumns<T>
    /** Step of the control ladder for the row: `xs` for a dense row, `sm` (36 px), `md` for a comfortable one; unset, the app's size (`createGrani({ size })`). The slots get it as `{ size }`. */
    size?: ControlSize
  }>(),
  { searchPlaceholder: undefined, columns: undefined },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** The search text, after the pause or at Enter. */
  'update:search': [value: string]
}>()

defineSlots<{
  /** What narrows the list, after the search: a period, filters; bind `size` on them. */
  start?(props: { size: ControlSize }): any
  /** What acts on the list, after the columns menu: catalog buttons, then the main action last; bind `size`. Not another columns menu. */
  end?(props: { size: ControlSize }): any
}>()

const { t } = useUiT()
const SEARCH_WAIT = 250

const local = ref(props.search)
// The values sent that the host has not applied yet, oldest first: a host that applies the model
// late (a router query) hands them back one by one, and they are our own. What the list will show
// is the last of them, not `search`: a clear or a step back while one is on its way still goes out.
let inFlight: string[] = []
const coming = () => inFlight.at(-1) ?? props.search
const send = debounce((value: string) => {
  if (value === coming()) return
  // A host that never applies the model keeps them all; the last few are enough to know our own.
  inFlight = [...inFlight, value].slice(-20)
  emit('update:search', value)
}, SEARCH_WAIT)

// A value set from outside wins over a pending one: a reset must not be undone by the timer.
// Our own send coming back is not a reset: what was typed since stays, and is sent in turn.
watch(
  () => props.search,
  (value) => {
    const own = inFlight.indexOf(value)
    if (own >= 0) {
      inFlight = inFlight.slice(own + 1)
      return
    }
    inFlight = []
    send.cancel()
    local.value = value
  },
)
watch(local, (value) => {
  if (value === coming()) return send.cancel()
  send(value)
  // An emptied search (the cross, Escape, select-all and delete) resets the list at once, as Enter does.
  if (value === '') send.flush()
})

onBeforeUnmount(() => send.cancel())

// `/` from anywhere on the page goes to the search of the first list a person can see: in the
// window open over the page when there is one, else on the page, as on the sites that taught the
// key. Typed in a field it is a slash; a list held inert under its selection strip and an app that
// takes the key first (`preventDefault`) keep it; with no search in view the key is left alone.
const boxRef = ref<HTMLElement | null>(null)
function searchInView() {
  const windows = document.querySelectorAll('[aria-modal="true"]')
  const within: ParentNode = windows.length ? windows[windows.length - 1]! : document
  return [...within.querySelectorAll<HTMLInputElement>('input[data-search-key]')].find(
    (f) => f.getClientRects().length > 0 && !f.closest('[inert]'),
  )
}
function toSearch(e: KeyboardEvent) {
  if (e.key !== '/' || e.defaultPrevented || e.isComposing) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const at = e.target as HTMLElement | null
  if (at?.isContentEditable || at?.closest?.('input, textarea, select')) return
  const field = boxRef.value?.querySelector('input')
  if (!field || searchInView() !== field) return
  field.focus()
  // The slash would land in the field it just took the focus to.
  if (document.activeElement === field) e.preventDefault()
}
onMounted(() => document.addEventListener('keydown', toSearch))
onBeforeUnmount(() => document.removeEventListener('keydown', toSearch))

// Enter sends now, but not the Enter that confirms an IME candidate (the value is still being
// composed; Safari ends the composition first and marks that Enter by its key code 229), and
// never as a submit of a form around the toolbar.
function onEnter(e: KeyboardEvent) {
  if (isImeKey(e)) return
  e.preventDefault()
  send.flush()
}
</script>
