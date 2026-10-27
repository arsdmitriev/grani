<!--
  UiDataTable: a whole list screen in one card: the toolbar, the table, the selection strip, and a
  footer with the count and the pages. Take it for a list page that searches, sorts, selects and
  pages.

  State. It draws what it is given and owns no state. The page, the sort, the selection and the
  search are `v-model`s; the rows and the total come from outside. It knows no router, API or
  storage: a page or an engine wires those. The selection stays as the page, the search and the
  filters change: the strip counts rows out of view, and `#bulk` gets their keys too. A page that
  wants only what is in view clears the selection on those changes.

  Columns. A column's `type` says how its values are drawn: money, date, status, copy or progress,
  text by default. A `#cell.<key>` slot draws a domain cell and wins over the type. A money column
  stands at the end, digit under digit, unless it says `align: 'start'`. `columns` is the list,
  fixed; or the state from `useTableColumns` over it, as UiTableToolbar's `columns` is,
  and then the table draws the visible ones and the toolbar gets the columns button.

  Hidden sort. The sort is the list's order, as a link made it; the columns are the person's view. A
  sort on a column they hid stays, and a line above the table tells it ("Sorted by Amount,
  descending"), since no header can.

  Slots. `#filters` narrows the list, `#actions` acts on it, `#bulk` acts on the selection, and
  `#row-actions` acts on one row.

  Empty. No empty list is a dead end. A search or a filter that found nothing offers its way back,
  Clear search and Reset filters; `#empty-actions` adds the app's own step beside them, such as
  creating what was searched for. With no records yet the table can offer nothing of its own, so
  `#empty-actions` is the step there, such as adding the first record; `#empty` replaces it all.

  Attributes. They reach the table, so `aria-label` names the table, its page checkbox, its scroll
  box and its pages; `class` and `style` stay on the card.

  Built from. One card of UiTableToolbar, UiTable and UiPagination, standing straight on a page.

  Pages. A new search, a new sort, or a choice the person changes in a UiFilter of `#filters` asks
  for page one; a value the app sets from outside does not, so a linked page keeps its place. A page
  past the last (after a delete, or on a narrower list) asks for the last.

  Loading. The page loads the rows, and the page drops an answer that is not for its latest query,
  as First table in the README does: the table shows the rows it is given. While loading, the table
  keeps the last `total`. The page fetches when its models change, not inside the
  `update:search` handler: that handler runs before the move to page one that follows it. A new
  search draws skeleton rows at once, as many as were in view; a sort or a page of the same search
  keeps the rows, dimmed. A filter of the page's own empties `items` while its answer is out, in the
  same step that sets `loading`, and the skeleton takes their place too. The table stands on a floor its skeleton, its empty answer and
  its failed load share, so nothing under it moves while the person types; the search field keeps
  the focus and shows no spinner.

  Keyboard.
  - `Tab`: walks the toolbar, then the page checkbox, a sortable header, each row's checkbox and
    the controls in `#row-actions`, then the pages.
  - `Enter` `Space`: on a sortable header, a button, turn it.
  - `Escape`: clears the search.
  A row is reached through a control in `#row-actions`, never by a click on the row alone. Rows
  marked by the app while the focus is in the toolbar hand it to the strip's clear button, as the
  strip covers the toolbar; the strip gone, the focus goes to the page checkbox.

  Reader.
  - Table: named by the `aria-label` the page gives it.
  - Sortable header: says its direction (`aria-sort`); a sort a press asked for is said once the
    app sends it back.
  - Row checkbox: named by `rowLabel`.
  - Selection strip: says how many rows are selected through a live region. Its count, the range
    and the pager's page count are written as the app's language groups digits ("1,234").
  - Refresh: says it is updating (`aria-busy`), then the range the load brought ("1–20 of 57").
  - Empty page: says why.
  - Failed load: says why and offers Retry.

  States. Loading (a skeleton on a first load), loaded, refreshing (the rows kept, dimmed to 60%),
  empty with nothing yet, empty because of a filter (change or reset the filters), failed (the
  words and Retry), a selection with its strip, and a page past the last, which asks for the last.
  A page is drawn whole, not windowed. Measured in Chromium (production build, six typed columns
  and checkboxes): 250 rows mount in about 70 ms and 1000 in about 320 ms, a third of it the
  browser's layout, and a sort redraws 1000 rows in about 150 ms. Past a few hundred rows, page.

  Not for.
  - A table with no toolbar and no pages: a bare UiTable.
  - A list of names that grows from its last row: UiListField.
  - Rows of settings or actions: UiListItem rows in a UiList.
-->
<template>
  <UiCard ref="cardRef" :padded="false" :class="rootClass" :style="rootStyle">
    <p class="sr-only" role="status">
      {{ selectedCount ? tp('grani.dataTable.selected', selectedCount) : '' }}
    </p>
    <p class="sr-only" role="status" data-range>{{ rangeSaid }}</p>
    <div ref="headRef" class="relative border-b border-border">
      <UiTableToolbar
        :inert="selectedCount > 0"
        :search="search"
        :search-placeholder="searchName"
        :columns="menu"
        :size="ladder"
        @update:search="onSearch"
      >
        <template v-if="$slots.filters" #start="{ size: step }"
          ><slot name="filters" :size="step"
        /></template>
        <template v-if="$slots.actions" #end="{ size: step }"
          ><slot name="actions" :size="step"
        /></template>
      </UiTableToolbar>
      <UiListItem v-if="selectedCount" class="absolute inset-0 bg-selected text-selected-fg">
        <template #media>
          <!-- Its glyph stands on the checkbox column: the button steps out by its own air. -->
          <UiIconButton
            ref="clearRef"
            variant="ghost"
            :class="CLEAR_ON_CHECKBOX[ladder]"
            :size="ladder"
            :icon="X"
            :ariaLabel="t('grani.dataTable.clearSelection')"
            @click="emit('update:selection', new Set())"
          />
        </template>
        <span class="text-sm/5.5 font-medium">{{
          tp('grani.dataTable.selected', selectedCount)
        }}</span>
        <template v-if="$slots.bulk" #actions>
          <slot name="bulk" :count="selectedCount" :selection="selection" :size="ladder" />
        </template>
      </UiListItem>
    </div>

    <p v-if="hiddenSort" class="border-b border-border px-4 py-2 text-sm/5.5 text-fg-muted">
      {{ hiddenSort }}
    </p>

    <UiTable
      v-bind="control"
      :columns="shown"
      :items="searching ? [] : items"
      :row-key="rowKey"
      :row-label="rowLabel"
      :skeleton-rows="skeletonRows"
      :loading="loading"
      :error="error"
      :selectable="selectable"
      :selection="selection"
      :is-row-selectable="isRowSelectable"
      :sort="sort"
      :clickable="clickable"
      :filtered="narrowed"
      @update:selection="emit('update:selection', $event)"
      @update:sort="onSort"
      @row-click="(row: T, event: MouseEvent) => emit('row-click', row, event)"
      @retry="emit('retry')"
    >
      <template v-for="col in typed" :key="col.key" #[`cell.${col.key}`]="scope">
        <slot :name="`cell.${col.key}`" v-bind="scope">
          <span v-if="isEmpty(scope.value)">{{ EMPTY }}</span>
          <UiMoneyCell
            v-else-if="col.type === 'money'"
            :value="asMoney(scope.value)"
            :currency="col.currency"
            :unit="col.unit"
            :tone="col.tone?.(scope.row)"
          />
          <UiDateCell
            v-else-if="col.type === 'date'"
            :value="asDate(scope.value)"
            :variant="col.variant"
            :context="col.context"
          />
          <UiBadge
            v-else-if="col.type === 'status'"
            size="sm"
            :tone="col.tone?.(scope.row) ?? 'neutral'"
            :label="textOf(col, scope.value, scope.row)"
          />
          <UiCopyButton
            v-else-if="col.type === 'copy'"
            size="xs"
            flush
            :value="String(scope.value)"
            :truncate="col.chars"
            :label="col.chars ? undefined : textOf(col, scope.value, scope.row)"
            :ariaLabel="
              col.chars
                ? undefined
                : t('grani.copy.value', { value: textOf(col, scope.value, scope.row) })
            "
          />
          <span
            v-else-if="col.type === 'progress' && col.step"
            class="inline-flex flex-col gap-1 leading-tight"
          >
            <UiProgress
              :value="Number(scope.value)"
              :max="col.max ?? 100"
              :step="col.step"
              :tone="col.tone"
              :variant="col.variant"
              :invert="col.invert"
              :aria-label="col.label"
              class="h-3.5"
              :style="{ width: scaleWidth(col.max ?? 100, col.step) }"
            />
            <span class="font-mono text-[10px] text-fg-muted" aria-hidden="true"
              >{{ scope.value }}/{{ col.max ?? 100 }}</span
            >
          </span>
          <UiProgress
            v-else-if="col.type === 'progress'"
            :value="Number(scope.value)"
            :max="col.max ?? 100"
            :tone="col.tone"
            :variant="col.variant"
            :invert="col.invert"
            :aria-label="col.label"
            class="h-1.5 w-24"
          />
        </slot>
      </template>
      <template v-for="name in forwardedCells()" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
      <template v-for="name in forwardedFooters()" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
      <template v-if="$slots['row-actions']" #row-actions="scope">
        <slot name="row-actions" v-bind="scope" />
      </template>
      <template v-if="$slots.empty" #empty="scope">
        <slot name="empty" v-bind="scope" />
      </template>
      <!-- A search or a filter that found nothing offers to undo it: the next step is one press.
           These plates are not live regions: the table's own says the words. -->
      <template v-else-if="searched || filteredNow" #empty>
        <UiNoData
          role="none"
          :title="t('grani.table.emptyFiltered')"
          :description="t('grani.table.emptyFilteredHint')"
        >
          <template #media><SearchX /></template>
          <template #actions>
            <UiButton v-if="searched" variant="secondary" :size="ladder" @click="onSearch('')">{{
              t('grani.dataTable.clearSearch')
            }}</UiButton>
            <UiButton v-if="filteredNow" variant="secondary" :size="ladder" @click="resetFilters">{{
              t('grani.dataTable.resetFilters')
            }}</UiButton>
            <slot
              name="empty-actions"
              :searched="searched"
              :filtered="filteredNow"
              :size="ladder"
            />
          </template>
        </UiNoData>
      </template>
      <!-- No records yet: the table has no step of its own to offer, the app's stands under the words. -->
      <template v-else-if="$slots['empty-actions']" #empty>
        <UiNoData
          role="none"
          :title="t('grani.table.empty')"
          :description="t('grani.table.emptyHint')"
        >
          <template #media><Inbox /></template>
          <template #actions>
            <slot name="empty-actions" :searched="false" :filtered="false" :size="ladder" />
          </template>
        </UiNoData>
      </template>
    </UiTable>

    <!-- The first page on its way holds the footer's place: nothing moves when the count comes. -->
    <div
      v-if="(total ?? 0) > 0 || (loading && !items.length)"
      class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
    >
      <template v-if="!total">
        <UiSkeleton class="h-4 w-28" />
        <UiSkeleton class="w-40" :class="controlHeightClass[ladder]" />
      </template>
      <span v-else class="text-sm/5.5 text-fg-muted">
        {{ rangeWords(total) }}
      </span>
      <!-- Named only when the table is: an undefined attr would fall through and blank the pager's own name. -->
      <UiPagination
        v-if="total"
        class="text-end"
        :page="page"
        :page-size="pageSize"
        :total="total"
        :size="ladder"
        :loading="loading"
        v-bind="
          tableName ? { 'aria-label': t('grani.dataTable.paginationOf', { table: tableName }) } : {}
        "
        @update:page="emit('update:page', $event)"
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { useControlSize } from '../composables/useControlSize'
import {
  computed,
  nextTick,
  onMounted,
  provide,
  ref,
  useSlots,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { Inbox, SearchX, X } from '@lucide/vue'
import { tabbables } from '../composables/useFocusTrap'
import { useUiT } from '../composables/useUiT'
import type { DataTableColumn, RowKey, TableSort, ControlSize } from '../types/ui'
import type { DateValue } from '../utils/dateValue'
import { markCorrection } from '../utils/listCorrection'
import type { TableColumns } from '../composables/useTableColumns'
import { useSplitAttrs } from '../utils/attrs'
import { isDev } from '../utils/dev'
import { useLiveText } from '../utils/liveText'
import { controlHeightClass } from '../utils/controlSize'
import { TABLE_FLOOR } from '../utils/surface'
import { LIST_FILTERS, listFilters } from '../utils/listFilters'
import UiBadge from './UiBadge.vue'
import UiButton from './UiButton.vue'
import UiCard from './UiCard.vue'
import UiCopyButton from './UiCopyButton.vue'
import UiDateCell from './UiDateCell.vue'
import UiIconButton from './UiIconButton.vue'
import UiMoneyCell from './UiMoneyCell.vue'
import UiNoData from './UiNoData.vue'
import UiPagination from './UiPagination.vue'
import UiProgress from './UiProgress.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiListItem from './UiListItem.vue'
import UiTable from './UiTable.vue'
import UiTableToolbar from './UiTableToolbar.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The columns in order, each with how its values are drawn: fixed; or the state from `useTableColumns` over them, and then the table draws its `visible` and the toolbar gets the columns button. */
    columns: DataTableColumn<T>[] | TableColumns<T>
    /** Rows of the current page. */
    items: T[]
    /** Records in the whole list; gives the count and the pages. Unset, there is no footer. Leave it unset until the first answer (a 0 would move a linked page back to one) and keep the last value while a page loads. */
    total?: number
    /** Current page, from 1 (`v-model:page`). A new search or sort asks for 1; a page past the last asks for the last once the list is not loading. */
    page?: number
    /** Records per page; the count and the pages are derived from it. */
    pageSize?: number
    /** Names a row for its checkbox: "Select Anna" instead of "Select row". */
    rowLabel?: (row: T) => string
    /** What tells rows apart; `id` when unset. */
    rowKey?: RowKey<T>
    /** The current sort (`v-model:sort`); the parent orders the rows. */
    sort?: TableSort
    /** A checkbox on every row; the selection strip replaces the toolbar while rows are selected. */
    selectable?: boolean
    /** Keys of the selected rows (`v-model:selection`). */
    selection?: Set<string | number>
    /** Which rows can be selected. */
    isRowSelectable?: (row: T) => boolean
    /** The search text (`v-model:search`); the field is always there. */
    search: string
    /** What the search looks in: its placeholder and its name. Unset, "Search" and the table's `aria-label` ("Search Invoices"), so two lists on one page keep their searches apart. */
    searchPlaceholder?: string
    /** Step of the toolbar row: `xs` for a dense row, `sm` (36 px), `md` for a comfortable one; unset, the app's size (`createGrani({ size })`). The slots get it as `{ size }`. */
    size?: ControlSize
    /** Rows are on their way. */
    loading?: boolean
    /** Why the rows could not be loaded, in words; shown with a retry. */
    error?: string | null
    /** A filter of the page's own is on: an empty page says so and offers "Reset filters", which sends `reset-filters`. A UiFilter in `#filters` and the block's own search count by themselves. */
    filtered?: boolean
    /** Rows answer a click with `row-click`. The keyboard reaches a record through a control in `#row-actions`. */
    clickable?: boolean
  }>(),
  {
    total: undefined,
    page: 1,
    pageSize: 25,
    rowKey: undefined,
    rowLabel: undefined,
    sort: null,
    selectable: false,
    selection: () => new Set<string | number>(),
    isRowSelectable: undefined,
    searchPlaceholder: undefined,
    loading: false,
    error: null,
    filtered: false,
    clickable: false,
  },
)
const ladder = useControlSize(() => props.size)
// The clear button's glyph on the checkbox column, whose box is 16, 18 or 20 px: how far the
// button steps out at each step, measured against the column in a browser.
const CLEAR_ON_CHECKBOX: Record<ControlSize, string> = {
  xs: '-ms-0.5',
  sm: '-ms-[9px]',
  md: '-ms-4',
}

const emit = defineEmits<{
  /** Asks for a page: a pressed number or arrow, page one after a new search or sort, the last page when the list shrank under the current one. */
  'update:page': [page: number]
  /** Asks for a sort: a column and its direction, or `null` to drop it; the parent orders the rows. */
  'update:sort': [sort: TableSort]
  /** A new set of the selected keys; the old set is never changed in place. */
  'update:selection': [selection: Set<string | number>]
  /** The search text: after a pause in typing, at once on Enter or on clearing it. */
  'update:search': [value: string]
  /** A row was clicked with `clickable` on. */
  'row-click': [row: T, event: MouseEvent]
  /** The retry of a failed load was pressed. */
  retry: []
  /** "Reset filters" in the empty state was pressed: the UiFilter components in `#filters` are reset already, the page clears its other filters. */
  'reset-filters': []
}>()

defineSlots<{
  /** What narrows the list, after the search: a period, filters. */
  filters?(props: { size: ControlSize }): any
  /** What acts on the list: catalog buttons, then the main action last (the columns menu comes from `columns`). */
  actions?(props: { size: ControlSize }): any
  /** What acts on the selected rows; shown in the selection strip. */
  bulk?(props: { count: number; selection: Set<string | number>; size: ControlSize }): any
  /** Controls of one row, in a column kept at the end. */
  'row-actions'?(props: { row: T; rowIndex: number }): any
  /** Instead of the empty-page text. */
  empty?(props: { filtered: boolean }): any
  /** The app's next step for an empty list: beside Clear search and Reset filters when nothing matched, alone under "No records yet". */
  'empty-actions'?(props: { searched: boolean; filtered: boolean; size: ControlSize }): any
  /** A cell, named by the column key (`#cell.customer`); wins over the column's `type`. */
  [name: `cell.${string}`]:
    ((props: { row: T; value: unknown; rowIndex: number; selected: boolean }) => any) | undefined
  /** A total under a column (`#footer.amount`). */
  [name: `footer.${string}`]: ((props: { items: T[] }) => any) | undefined
}>()

const { rootClass, rootStyle, control } = useSplitAttrs()
const tableName = computed(() => {
  const name = control.value['aria-label']
  return typeof name === 'string' && name.trim() ? name.trim() : ''
})
// Two lists on one page keep their searches apart: unnamed, the search takes the table's name.
const searchName = computed(
  () =>
    props.searchPlaceholder ||
    (tableName.value ? t('grani.dataTable.searchIn', { table: tableName.value }) : undefined),
)
const { t, tp, n } = useUiT()
const slots = useSlots()
const EMPTY = '—'

// The block's own search narrows the list too: a search with no rows says nothing matches.
const narrowed = computed(() => filteredNow.value || (props.search ?? '') !== '')
const selectedCount = computed(() => (props.selectable ? props.selection.size : 0))

// The count is said by a region that exists from the start; the strip itself appears with its
// text, which some readers skip. The strip leaves with its clear button; focus that stood on it
// lands on the page checkbox instead of the page body.
const cardRef = ref<ComponentPublicInstance | null>(null)
watch(selectedCount, async (count, before) => {
  if (count || !before) return
  await nextTick()
  const root = cardRef.value?.$el as HTMLElement | undefined
  if (!root || typeof document === 'undefined' || document.activeElement !== document.body) return
  // The page checkbox keeps the hand in the selection, not in the search field it opened over.
  const box = root.querySelector<HTMLInputElement>('thead input[type="checkbox"]:not(:disabled)')
  ;(box ?? tabbables(root)[0])?.focus()
})

// Rows marked while the focus is in the toolbar (the app's shortcut, a saved choice): the strip
// covers the toolbar and makes it inert, so the focus goes to the strip's clear button, not the page.
const headRef = ref<HTMLElement | null>(null)
const clearRef = ref<ComponentPublicInstance | null>(null)
let fromToolbar = false
watch(
  selectedCount,
  (count, before) => {
    const at = typeof document === 'undefined' ? null : document.activeElement
    fromToolbar = Boolean(count && !before && at && headRef.value?.contains(at))
  },
  { flush: 'pre' },
)
watch(
  selectedCount,
  () => {
    if (!fromToolbar) return
    fromToolbar = false
    ;(clearRef.value?.$el as HTMLElement | undefined)?.focus()
  },
  { flush: 'post' },
)

// The menu's state holds the columns it was built over: one source, so a key cannot go missing
// between the list and the menu. Its columns are the ones given, typed ones included.
const menu = computed(() => (Array.isArray(props.columns) ? undefined : props.columns))
const defs = computed(() =>
  Array.isArray(props.columns) ? props.columns : (props.columns.all.value as DataTableColumn<T>[]),
)
// A money or a date cell is two lines: the table's first load draws them so. Money also stands at
// the end, digit under digit, unless the column says `align: 'start'`.
const shown = computed(() =>
  (menu.value ? (menu.value.visible.value as DataTableColumn<T>[]) : defs.value).map((c) =>
    c.type === 'money'
      ? { ...c, lines: c.lines ?? (2 as const), align: c.align ?? ('end' as const) }
      : c.type === 'date'
        ? { ...c, lines: c.lines ?? (2 as const) }
        : c,
  ),
)
// A sort on a column the person hid has no header to carry its sign: a line above the table tells
// it. A sort on a key that is no column of the table has no name to tell and says nothing.
const hiddenSort = computed(() => {
  const sort = props.sort
  if (!sort || shown.value.some((c) => c.key === sort.key)) return ''
  const col = defs.value.find((c) => c.key === sort.key)
  if (!col) return ''
  return t(sort.dir === 'asc' ? 'grani.table.sortedAsc' : 'grani.table.sortedDesc', {
    column: col.label || col.key,
  })
})
const typed = computed(() => defs.value.filter((c) => c.type && c.type !== 'text'))
const typedKeys = computed(() => new Set(typed.value.map((c) => `cell.${c.key}`)))
// The caller's cell slots of text columns and its totals go to the table as they are.
const forwardedCells = () =>
  Object.keys(slots).filter(
    (name) => name.startsWith('cell.') && !typedKeys.value.has(name),
  ) as `cell.${string}`[]
const forwardedFooters = () =>
  Object.keys(slots).filter((name) => name.startsWith('footer.')) as `footer.${string}`[]

// A mark on a scale reads as sections of a fixed size, not a stretched bar: up to five are
// squares as tall as the bar (14 px), more are narrow planks (8 px); 2 px between them.
const scaleWidth = (max: number, step: number) => {
  const count = Math.max(1, Math.round(max / step))
  return `${count * (count > 5 ? 8 : 14) + (count - 1) * 2}px`
}
const isEmpty = (v: unknown) => v === null || v === undefined || v === ''
// The cells take a narrower value than a slot scope carries; the column's type vouches for it.
const asMoney = (v: unknown) => v as string | number
const asDate = (v: unknown) => v as DateValue
const textOf = (col: { format?: (value: unknown, row: T) => string }, value: unknown, row: T) =>
  col.format ? col.format(value, row) : String(value)

// A page size of zero is one page of everything.
const pages = computed(() =>
  props.pageSize > 0 ? Math.max(1, Math.ceil((props.total ?? 0) / props.pageSize)) : 1,
)
// Read as the pager reads it, so the count and the pager name one page: a string as its number,
// 2.5 as 2, Infinity as the last page, anything unreadable as the first.
const safePage = computed(() => {
  const page = Number(props.page)
  return Number.isFinite(page) ? Math.trunc(page) : page > 0 ? pages.value : 1
})
const current = computed(() => Math.min(pages.value, Math.max(1, safePage.value)))

// A new question starts at the top of its answer.
function onSearch(value: string) {
  emit('update:search', value)
  if (props.page !== 1) emit('update:page', 1)
}
function onSort(sort: TableSort) {
  emit('update:sort', sort)
  if (props.page !== 1) emit('update:page', 1)
}
// A list that shrank under the page (a delete, a narrower filter) goes to its last page rather
// than an empty one; asked once the rows are in, so a loading or unknown total is never read,
// and only in the browser: a page asked for during the server's render would move a link.
function clampPage() {
  if (props.loading || props.total === undefined) return
  const page = props.page
  // The list's own correction: an address writes it in place, not as a step of the history.
  if (!Number.isFinite(page) || page < 1 || page > pages.value || !Number.isInteger(page))
    markCorrection()
  if (!Number.isFinite(page) || page < 1) emit('update:page', 1)
  else if (page > pages.value) emit('update:page', pages.value)
  // A page in range but not whole (2.5 from a query string) is the page the pager shows, 2.
  else if (!Number.isInteger(page)) emit('update:page', Math.trunc(page))
}
onMounted(clampPage)
watch(() => [props.page, pages.value, props.loading, props.total] as const, clampPage)
const searched = computed(() => (props.search ?? '') !== '')
// The UiFilter components in `#filters` tell the table what the person does to them: a changed choice starts
// the list on page one, as a new search does; a change the app makes from outside is not one, so a
// linked page keeps its place. What they choose counts as filtered, beside the page's `filtered`.
const filters = listFilters(() => {
  if (props.page !== 1) emit('update:page', 1)
})
provide(LIST_FILTERS, filters)
const filteredNow = computed(() => props.filtered || filters.all.value.some((f) => f.chosen()))
// "Reset filters" undoes the UiFilter components itself and tells the page, which clears its own filters.
function resetFilters() {
  for (const f of filters.all.value) if (f.chosen()) f.clear()
  emit('reset-filters')
}
// One skeleton row a record, to a page of at most 25; a page of everything draws a few.
const skeletonRows = computed(() => (props.pageSize > 0 ? Math.min(props.pageSize, 25) : 5))

// A new search draws skeleton rows at once, whatever stood before: the rows of the last answer
// answer another question. A sort or a page of the same search keeps its rows in place, dimmed.
// The search the rows answer is the one in force when the last load ended.
provide(TABLE_FLOOR, true)
const answered = ref<string | null>(props.loading ? null : props.search)
watch(
  () => props.loading,
  (on, was) => {
    if (was && !on) answered.value = props.search
  },
)
// Sent as typed, spaces included: a space added is a new search, as the toolbar sends it.
const searching = computed(
  () => props.loading && answered.value !== null && props.search !== answered.value,
)
const rangeFrom = computed(() =>
  props.pageSize > 0 ? (current.value - 1) * props.pageSize + 1 : 1,
)
const rangeTo = computed(() =>
  props.pageSize > 0
    ? Math.min(current.value * props.pageSize, props.total ?? 0)
    : (props.total ?? 0),
)
const rangeWords = (total: number) =>
  t('grani.dataTable.range', { from: n(rangeFrom.value), to: n(rangeTo.value), total: n(total) })

// What a search, a filter or a page brought, said once its rows are in, in the footer's words; nothing
// while they load, nothing after a failed load (its plate says what happened), and nothing before a
// first load: a table already filled when the page opens is read as a table.
const loadedOnce = ref(false)
watch(
  () => props.loading,
  (now, was) => {
    if (was && !now) loadedOnce.value = true
  },
)
const rangeSaid = useLiveText(() =>
  !loadedOnce.value || props.loading || props.error || !props.total ? '' : rangeWords(props.total),
)

// Past a few hundred rows the table is slow (measured above): a page of 10,000 took 2.6s. `total`
// unset means the footer never offers a page, so nothing narrows what is drawn at once.
if (isDev()) {
  let warned = false
  watch(
    () => [props.items.length, props.total] as const,
    ([length, total]) => {
      if (warned || length <= 500 || total !== undefined) return
      warned = true
      console.warn(
        '[grani] UiDataTable: past 500 rows with no `total` draws them all at once and turns slow; page them with `total`, `page` and `pageSize`.',
      )
    },
    { immediate: true },
  )
}
</script>
