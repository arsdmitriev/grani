<!--
  UiTable: records as rows under column headers, with sorting, selection and loading states. Take
  it inside UiDataTable, or alone for a list with no toolbar and no pages.

  Data. It draws the page it is given and owns none of the data. A header click asks for a sort
  (`v-model:sort`). A checkbox marks a row (`v-model:selection`, a set of row keys); with Shift,
  by pointer or Shift+Space, it marks the range from the last row marked. The parent loads,
  filters and orders the rows, and keeps the selection to rows that still exist.

  Look. One presentation: a hairline between rows, space between columns, a tint on the row under
  the pointer. The table draws no shell; the card around it does (`UiCard :padded="false"`). Its
  focus rings are drawn inside, since the card clips what sticks out.

  Wide tables. A wide table scrolls sideways in its own box, with `#row-actions` kept at the end.
  Once it overflows, the box takes focus and the arrow keys scroll it, a side with more columns past
  it is shaded, and on a desktop pointer an arrow in the header's band pages the table toward it,
  so a narrow screen shows the table goes on and how to reach the rest. The arrow stands over the
  edge of the header cell under it, which is pressed beside it. An empty or a failed table shows
  its plate with neither. Once it scrolls, a column of short values (24 characters or fewer) keeps
  them on one line: the table has the room to the side.

  Loading. The first load shows skeleton rows, as many as the page will hold; a refresh keeps the
  rows in view, dimmed and busy, and says it updates. In UiDataTable, a list that searches, the
  table stands on a floor: its empty and failed states fill it, and a skeleton holds as many rows as
  were in view, never fewer than fill it. A skeleton cell draws the lines its column
  holds (`lines`, 2 for a UiMoneyCell or UiDateCell), so the rows arrive at their height. With
  `#row-actions`, it holds the square of one icon button at the app's size, so the actions column
  keeps its width and the row its height. The other columns take their width from their content,
  which a skeleton does not have: those without a `width` settle when the rows arrive.

  Empty and failed. An empty page is UiNoData: "no records yet", or, with `filtered`, "nothing
  matches"; `#empty` puts one with its own action in its place. A failed load is UiNoData `danger`
  with the message and Retry. A failed refresh shows the same plate in place of the rows, and Retry
  brings the skeleton back.

  Rows. A row without a key keeps its DOM node for the life of the page, so a sort moves the row
  with its record. The totals row shows only when there are rows. A cell of an object needs `format`,
  `accessor` or its slot; without one it draws a dash.

  Focus. It stays where the person is when the rows change under it: a sort leaves it on the same
  control of the same row, a row deleted hands it to the same control of the row now in its place
  (the row above when it was the last), and a page left without rows gives it to the table's box. A
  focus that went elsewhere, into a window opened from a row, is not pulled back; that window gives
  it back to its own trigger. A row's own control turned off for a moment keeps it. A row deleted
  from its UiMenu is handed on the same way: the menu gives the focus back to its button first. A
  row removed while a window opened from it holds the focus (a question's `action`) is handed on
  too: the window gives the focus to the same control of the row now in its place.

  Attributes. They reach the `<table>`, so `aria-label` names it and its page checkbox; `class` and
  `style` stay on the root.

  Placement. In UiDataTable, under UiTableToolbar and over UiPagination, with UiMoneyCell and
  UiDateCell as its cells. Alone in a `UiCard :padded="false"` when a list needs no toolbar and no
  pages.

  Keyboard.
  - `Tab`: once the table overflows, reaches its scroll box first; then the page checkbox, a
    sortable header, each row's checkbox and the controls in `#row-actions`, and the Retry of a
    failed load.
  - `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: on the scroll box, scroll it.
  - `Enter` `Space`: on a sortable header, a button, turn it.
  - `Space`: on a checkbox, marks the row.
  - `Shift+Space`: on a checkbox, marks the range from the last row marked.
  A row is reached through a control in `#row-actions`, never by a click on the row alone. A header
  pressed while rows load asks for nothing and keeps the focus; Retry is held the same way and
  leaves the focus in the table.

  Reader.
  - Table: named by the `aria-label` the page gives it, and so are its page checkbox ("Select all
    on this page of Orders") and its scroll box.
  - Sortable header: says its direction (`aria-sort`); a sort a press asked for is said once the
    app sends it back ("Sorted by Name, ascending").
  - Row checkbox: "Select row", or "Select Anna" with `rowLabel`, and says its shortcut.
  - Columns: the selection column and the actions column have hidden names.
  - Row: says whether it is selected (`aria-selected`).
  - Status: one region, present from the start and drawn empty, says "Loading…", the empty words,
    from a moment after the table mounts. The plate of an empty page is no second live region; a
    UiNoData of your own in `#empty` takes `role="none"` for the same.
  - Failed load: announced by its plate.
  - Refresh: `aria-busy` on the rows.

  States. A first load (skeleton rows, as many as the page holds), rows, a refresh (the rows kept,
  dimmed to 60% and busy), empty with nothing yet, empty because of a filter (`filtered`), a failed
  load (UiNoData `danger` with Retry), a failed refresh (the same plate in place of the rows), a
  sort, a selection with the page checkbox mixed, a totals row shown only with rows, and a wide
  table that scrolls in its box.

  Not for.
  - A list screen: UiDataTable, with its toolbar, pages and selection strip.
  - Rows of settings or facts: UiListItem rows in a UiList.
  - A list of names that grows from its last row: UiListField.
  - The changes of one event: UiLog's own table.
-->
<template>
  <div
    ref="rootRef"
    class="min-w-0"
    :class="rootClass"
    :style="rootStyle"
    @focusin="lastIn"
    @pointerdown="lastIn"
  >
    <!-- A side with more columns past it is shaded, so a narrow screen shows the table goes on.
         The end's shade stands at the row actions, where the columns slide under them; a shade,
         not a fade, so the header's band and the lines between rows run on unbroken. On a desktop
         pointer an arrow in the header's band pages the table there, as the tabs' arrows do; the
         keys scroll the box itself, so the arrows stay out of the tab order. -->
    <div class="relative">
      <span
        v-if="paging && more.start"
        class="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-linear-to-r from-fg/6 to-transparent rtl:bg-linear-to-l"
        aria-hidden="true"
        data-scroll-more="start"
      />
      <span
        v-if="paging && more.end"
        class="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-linear-to-l from-fg/6 to-transparent rtl:bg-linear-to-r"
        :style="actionsWidth ? { insetInlineEnd: `${actionsWidth}px` } : undefined"
        aria-hidden="true"
        data-scroll-more="end"
      />
      <button
        v-for="side in arrows"
        :key="side"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        :data-scroll-arrow="side"
        class="absolute z-20 hidden h-7 w-7 items-center justify-center rounded-pill border border-border bg-surface text-fg-muted shadow-xs enabled:hover:text-fg [@media(hover:hover)_and_(pointer:fine)]:flex"
        :style="arrowStyle(side)"
        @click="page(side === 'end' ? 1 : -1)"
      >
        <ChevronLeft v-if="side === 'start'" class="h-4 w-4 rtl:-scale-x-100" />
        <ChevronRight v-else class="h-4 w-4 rtl:-scale-x-100" />
      </button>
      <div
        ref="scrollRef"
        class="overflow-x-auto"
        :class="RING"
        :tabindex="overflows ? 0 : -1"
        :role="overflows ? 'region' : undefined"
        :aria-label="overflows ? scrollLabel : undefined"
        @scroll.passive="measure"
      >
        <p class="sr-only" role="status">{{ said }}</p>
        <p class="sr-only" role="status" data-sort>{{ sortSaid }}</p>
        <table ref="tableRef" v-bind="control" class="w-full border-collapse text-sm/5.5">
          <thead>
            <tr class="border-b border-border bg-surface-muted">
              <th v-if="selectable" scope="col" :class="[CELL, 'w-12']">
                <span class="sr-only">{{ t('grani.table.colSelect') }}</span>
                <UiCheckbox
                  class="align-middle"
                  :model-value="pageState === true"
                  :indeterminate="pageState === 'mixed'"
                  :disabled="!pageKeys.length"
                  :aria-label="selectAllLabel"
                  @update:model-value="togglePage"
                />
              </th>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                :style="colStyle(col)"
                :aria-sort="ariaSort(col)"
                :class="[HEAD, alignClass(col), col.sortable ? 'p-0' : CELL]"
              >
                <button
                  v-if="col.sortable"
                  type="button"
                  :class="[
                    'inline-flex w-full items-center gap-1 uppercase',
                    loading ? 'cursor-progress' : 'enabled:hover:text-fg',
                    RING,
                    CELL,
                    col.align === 'end' ? 'justify-end' : '',
                  ]"
                  :aria-disabled="loading || undefined"
                  @click="toggleSort(col)"
                  @keydown="holdEnter"
                >
                  <span>{{ col.label }}</span>
                  <component
                    :is="sortGlyph(col)"
                    aria-hidden="true"
                    class="h-3.5 w-3.5 shrink-0"
                    :class="sortedBy(col) ? 'text-fg' : 'text-fg-subtle'"
                  />
                </button>
                <template v-else>{{ col.label }}</template>
              </th>
              <th
                v-if="$slots['row-actions']"
                ref="actionsRef"
                scope="col"
                :class="[CELL, 'sticky end-0 w-px bg-surface-muted']"
              >
                <span class="sr-only">{{ t('grani.table.colActions') }}</span>
              </th>
            </tr>
          </thead>
          <!-- A load after a failure starts from the skeleton: the plate gave the rows' place up. -->
          <tbody v-if="loading && (!items.length || error || failed)" aria-busy="true">
            <tr
              v-for="i in skeletonCount"
              :key="i"
              class="border-b border-border last:border-0"
              aria-hidden="true"
            >
              <td v-if="selectable" :class="CELL">
                <UiSkeleton :class="CHECK_MARK_BOX" />
              </td>
              <!-- A line of text's height and its column's side: the rows arrive where they stood. -->
              <td v-for="col in columns" :key="col.key" :class="[CELL, alignClass(col)]">
                <!-- Two lines as the money and date cells set them: the value, the unit under it. -->
                <!-- Inline, as those cells are: the line box they stand in is part of the row's height. -->
                <span v-if="col.lines === 2" class="inline-block w-full leading-tight">
                  <span class="block text-sm/5.5">
                    <UiSkeleton class="inline-block h-3 w-3/4 align-middle" />
                  </span>
                  <span class="block text-[10px]">
                    <UiSkeleton class="inline-block h-2 w-1/3 align-middle" />
                  </span>
                </span>
                <div v-else class="text-sm/5.5">
                  <UiSkeleton class="inline-block h-3 w-3/4 align-middle" />
                </div>
              </td>
              <td v-if="$slots['row-actions']" :class="CELL">
                <UiSkeleton :class="ACTION_BOX[ladder]" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr>
              <td :colspan="colCount" class="p-0" :style="floorStyle">
                <!-- As wide as the box in view, not the whole table: a wide table's plate is seen. -->
                <div class="sticky start-0 px-4 py-12" :style="plateStyle">
                  <UiNoData tone="danger" :title="t('grani.table.loadFailed')" :description="error">
                    <template #actions>
                      <UiButton
                        variant="secondary"
                        :aria-disabled="loading || undefined"
                        @click="retry"
                        >{{ t('grani.table.retry') }}</UiButton
                      >
                    </template>
                  </UiNoData>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="!items.length">
            <tr>
              <td :colspan="colCount" class="p-0" :style="floorStyle">
                <div class="sticky start-0 px-4 py-12" :style="plateStyle">
                  <slot name="empty" :filtered="filtered">
                    <!-- Not a live region: the table's own, always in the DOM, says these words. -->
                    <UiNoData
                      role="none"
                      :title="filtered ? t('grani.table.emptyFiltered') : t('grani.table.empty')"
                      :description="
                        filtered ? t('grani.table.emptyFilteredHint') : t('grani.table.emptyHint')
                      "
                    >
                      <template #media><SearchX v-if="filtered" /><Inbox v-else /></template>
                    </UiNoData>
                  </slot>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody
            v-else
            ref="tbodyRef"
            :aria-busy="loading || undefined"
            :class="loading ? 'opacity-60' : ''"
            @keydown="holdRowPress"
          >
            <tr
              v-for="(row, rowIndex) in items"
              :key="rowKeyOf(row)"
              class="group border-b border-border last:border-0"
              :class="[
                isSelected(row) ? 'ui-row-selected bg-selected' : 'hover:bg-surface-muted',
                clickable ? 'cursor-pointer' : '',
              ]"
              :aria-selected="selectable ? isSelected(row) : undefined"
              @click="onRowClick(row, $event)"
            >
              <td
                v-if="selectable"
                :class="[CELL, 'select-none']"
                @click.stop
                @click.capture="onBoxClick"
                @keydown.capture="onBoxKey"
              >
                <UiCheckbox
                  class="align-middle"
                  :model-value="isSelected(row)"
                  :disabled="!canSelect(row)"
                  :aria-label="
                    rowLabel
                      ? t('grani.table.selectNamed', { name: rowLabel(row) })
                      : t('grani.table.selectRow')
                  "
                  aria-keyshortcuts="Shift+Space"
                  @update:model-value="toggleRow(row)"
                />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                :style="colStyle(col)"
                :class="[
                  CELL,
                  'text-fg',
                  alignClass(col),
                  col.truncate ? 'max-w-0' : '',
                  overflows && unbroken.has(col.key) ? 'whitespace-nowrap' : '',
                ]"
              >
                <!-- A cell slot draws its own markup and owns its own cut. -->
                <UiTruncate
                  v-if="col.truncate && !$slots[`cell.${col.key}`]"
                  :text="textOf(col, row)"
                />
                <slot
                  v-else
                  :name="`cell.${col.key}`"
                  :row="row"
                  :value="valueOf(col, row)"
                  :row-index="rowIndex"
                  :selected="isSelected(row)"
                >
                  {{ textOf(col, row) }}
                </slot>
              </td>
              <td
                v-if="$slots['row-actions']"
                :class="[
                  CELL,
                  'sticky end-0 w-px whitespace-nowrap',
                  isSelected(row) ? 'bg-selected' : 'bg-surface group-hover:bg-surface-muted',
                ]"
                @click.stop
              >
                <slot name="row-actions" :row="row" :row-index="rowIndex" />
              </td>
            </tr>
          </tbody>
          <!-- Totals stand over rows only: never under a skeleton, an empty page or a failed load. -->
          <tfoot v-if="hasFooter && items.length" :class="loading ? 'opacity-60' : ''">
            <tr class="border-t border-border bg-surface-muted font-medium">
              <td v-if="selectable" />
              <td v-for="col in columns" :key="col.key" :class="[CELL, 'text-fg', alignClass(col)]">
                <slot :name="`footer.${col.key}`" :items="items" />
              </td>
              <td v-if="$slots['row-actions']" class="sticky end-0 bg-surface-muted" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { useSlotsSeen } from '../utils/slotsSeen'
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  ref,
  useSlots,
  watch,
} from 'vue'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Inbox,
  SearchX,
} from '@lucide/vue'
import { tabbables } from '../composables/useFocusTrap'
import { succeed } from '../utils/focusSuccessor'
import { useControlSize } from '../composables/useControlSize'
import { useUiT } from '../composables/useUiT'
import type { ControlSize, RowKey, SortDirection, TableColumn, TableSort } from '../types/ui'
import { useSplitAttrs } from '../utils/attrs'
import { holdEnter } from '../utils/held'
import { createAnnouncer } from '../utils/announce'
import { CHECK_MARK_BOX } from '../utils/checkMark'
import { controlHeightClass } from '../utils/controlSize'
import { isDev } from '../utils/dev'
import { useLiveText } from '../utils/liveText'
import { TABLE_FLOOR } from '../utils/surface'
import UiButton from './UiButton.vue'
import UiCheckbox from './UiCheckbox.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiNoData from './UiNoData.vue'
import UiTruncate from './UiTruncate.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The columns in order; each names its `#cell.<key>` slot. A column is `{ key, label }` and may add `accessor(row)` (the value when it is not `row[key]`), `format(value, row)` (the text), `sortable` with `defaultSortDir` (`asc` or `desc`, the first press), `align: 'end'` (numbers, digit under digit), `width` (one CSS value, `120px` or `calc(…)`), `truncate` (one line, cut with a tooltip; cut columns with no width share the room left evenly). */
    columns: TableColumn<T>[]
    /** Rows of the current page. The table does not load, filter or sort them. */
    items: T[]
    /** What tells rows apart: a field name or a function; `id` when unset, so rows without an `id` need it. A row without a key cannot be selected, and is known by its object: a parent that rebuilds its rows on every render remounts them all. */
    rowKey?: RowKey<T>
    /** Rows are on their way: skeleton rows on the first load, the rows in view dimmed on a refresh. */
    loading?: boolean
    /** Skeleton rows on the first load: the page size, so nothing moves when the rows arrive. */
    skeletonRows?: number
    /** Names a row for its checkbox: "Select Anna" instead of "Select row". */
    rowLabel?: (row: T) => string
    /** Why the rows could not be loaded, in words for the reader, shown with a retry. A failed refresh shows the same plate in place of the rows. */
    error?: string | null
    /** A checkbox on every row and one for the page in the header. */
    selectable?: boolean
    /** Keys of the selected rows (`v-model:selection`); the page checkbox adds or removes the page, Shift with a row's checkbox the rows from the last one marked. The parent drops the keys of rows it deletes. */
    selection?: Set<string | number>
    /** Which rows can be selected; the others show a disabled checkbox and stay out of the page checkbox. */
    isRowSelectable?: (row: T) => boolean
    /** The current sort (`v-model:sort`); a header click cycles the column's first direction, the other one, then none. */
    sort?: TableSort
    /** Rows answer a click with `row-click` and show a pointer cursor. A pointer shortcut: the keyboard path to a row is a control in it (`#row-actions`), the row itself takes no tab stop. */
    clickable?: boolean
    /** The page is empty because of a filter or a search: the empty text says so. */
    filtered?: boolean
  }>(),
  {
    rowKey: undefined,
    loading: false,
    skeletonRows: 5,
    rowLabel: undefined,
    error: null,
    selectable: false,
    selection: () => new Set<string | number>(),
    isRowSelectable: undefined,
    sort: null,
    clickable: false,
    filtered: false,
  },
)

const emit = defineEmits<{
  /** The selection changed; a new set, the one passed in is not mutated. */
  'update:selection': [selection: Set<string | number>]
  /** A header was clicked: the column and direction to sort by, `null` to drop the sort. */
  'update:sort': [sort: TableSort]
  /** A row was clicked with `clickable` on. Not for a click on a control inside the row, with a modifier key, or over selected text. */
  'row-click': [row: T, event: MouseEvent]
  /** The retry of a failed load was pressed. */
  retry: []
}>()

defineSlots<{
  /** Content of a cell, named by the column key (`#cell.amount`); replaces the text. */
  [name: `cell.${string}`]:
    ((props: { row: T; value: unknown; rowIndex: number; selected: boolean }) => any) | undefined
  /** A total under a column (`#footer.amount`); any one of them adds the footer row. */
  [name: `footer.${string}`]: ((props: { items: T[] }) => any) | undefined
  /** Controls of a row, in a column kept at the end when the table scrolls: ghost icon buttons. */
  'row-actions'?(props: { row: T; rowIndex: number }): any
  /** Instead of the empty-page text; `filtered` says which wording it replaces. */
  empty?(props: { filtered: boolean }): any
}>()

const { t } = useUiT()
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const { rootClass, rootStyle, control } = useSplitAttrs()

// 16px sides keep one vertical line with a toolbar (p-4) and a footer (px-4) in the same card.
const CELL = 'px-4 py-2.5 align-middle'
// The skeleton stands in for a row's one icon button at the app's step, so the actions column
// has its width, and the row its height, before the rows come.
const ladder = useControlSize(() => undefined)
const ACTION_BOX: Record<ControlSize, string> = {
  xs: `${controlHeightClass.xs} w-7`,
  sm: `${controlHeightClass.sm} w-9`,
  md: `${controlHeightClass.md} w-11`,
}
const HEAD = 'whitespace-nowrap text-xs/4.5 font-semibold uppercase tracking-wide text-fg-muted'
const EMPTY = '—'

// A column at the end is numbers: its digits stand one under the other.
const alignClass = (col: TableColumn<T>) =>
  col.align === 'end' ? 'text-end tabular-nums' : 'text-start'
// The focus ring drawn inside: the card around the table clips a ring that stands out.
const RING = 'focus:outline-hidden focus-visible:!shadow-(--ui-ring-inset)'
// A width is one CSS value, any the app means (`120px`, `calc(100% - 2rem)`, `var(--w)`): it
// reaches `style`, and on a server it is written into the page as it is, so a `;`, `{` or `}`
// that would end it and start another declaration is refused, with a word in development.
const widthWarned = new Set<string>()
const isLength = (w: string | undefined): w is string => {
  if (typeof w !== 'string' || !w.trim()) return false
  if (!/[;{}]/.test(w)) return true
  if (isDev() && !widthWarned.has(w)) {
    widthWarned.add(w)
    console.warn('[grani] UiTable ignores a column width that is not one CSS value.')
  }
  return false
}
// A cut column with no width of its own takes the room left in the table, the others keep
// their content's width: a name is what a person reads, it gets the space. Two or more share it
// evenly; two at `100%` each would leave the second a letter wide.
const flexible = (col: TableColumn<T>) => Boolean(col.truncate && !isLength(col.width))
const flexShare = computed(() => `${100 / Math.max(1, props.columns.filter(flexible).length)}%`)
const colStyle = (col: TableColumn<T>) =>
  isLength(col.width)
    ? { width: col.width, minWidth: col.width }
    : flexible(col)
      ? { width: flexShare.value }
      : undefined

function keyOf(row: T): string | number | undefined {
  const k = props.rowKey
  const v = typeof k === 'function' ? k(row) : row[(k ?? 'id') as string]
  return typeof v === 'string' || typeof v === 'number' ? v : undefined
}
// A keyless row is keyed by its identity, not its position: a sort must move the node, and
// the focus inside it, with the record; a positional key would rebind the node to another row.
const synthetic = new WeakMap<object, number>()
let nextSynthetic = 0
function rowKeyOf(row: T): string | number {
  const k = keyOf(row)
  if (k !== undefined) return k
  let id = synthetic.get(row)
  if (id === undefined) {
    id = ++nextSynthetic
    synthetic.set(row, id)
  }
  return `row-${id}`
}
const tableName = computed(() => {
  const name = control.value['aria-label']
  return typeof name === 'string' && name.trim() ? name.trim() : ''
})
const selectAllLabel = computed(() =>
  tableName.value
    ? t('grani.table.selectAllIn', { table: tableName.value })
    : t('grani.table.selectAll'),
)
const scrollLabel = computed(() => tableName.value || t('grani.table.scrollRegion'))
// A box that overflows is a scroll region: it takes focus, so the arrow keys reach the columns
// that are out of view; a box that fits takes no tab stop.
const scrollRef = ref<HTMLElement | null>(null)
const tableRef = ref<HTMLElement | null>(null)

// A list that searches stands on a floor: its empty answer and its failed load fill it, and a
// skeleton holds as many rows as were in view, never fewer than fill it, so a new search, an
// answer of nothing and a retry move nothing under the table. A row's height is read from the
// rows drawn; the line of text's, at the default size, until one is.
const FLOOR_REM = 18
const floor = inject(TABLE_FLOOR, false)
const rowHeight = ref(45)
const shown = ref<number | null>(null)
// The last load failed: its rows answered an older query, so a retry that clears the error as it
// goes out starts from the skeleton too, not from those rows, until a load comes back.
const failed = ref(false)
watch(
  () => [props.loading, props.items.length, props.error] as const,
  ([loading, n]) => {
    // A failed load shows its plate, not the rows it was given: the floor is what stands.
    if (!loading) shown.value = props.error ? 0 : n
    if (!loading) failed.value = Boolean(props.error)
  },
  { immediate: true },
)
// The rows that fill the floor: the floor is a whole number of them, so the skeleton and the
// plates of an empty or failed answer stand at one height. The root's font size is read once
// mounted: a server measures nothing and draws at 16px, and a first render that measured a larger
// root would not match what it drew.
const rootRem = ref(16)
onMounted(() => {
  rootRem.value = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
})
const fill = computed(() => Math.ceil((FLOOR_REM * rootRem.value) / rowHeight.value))
// A row's height counts its line; the last row draws none.
const floorStyle = computed(() =>
  floor ? { height: `${fill.value * rowHeight.value - 1}px` } : undefined,
)
const skeletonCount = computed(() =>
  floor ? Math.max(shown.value ?? props.skeletonRows, fill.value) : props.skeletonRows,
)
const overflows = ref(false)
const boxWidth = ref(0)
// Which sides have columns past them; in a right-to-left page the scroll runs below zero.
const more = ref({ start: false, end: false })
const measure = () => {
  const el = scrollRef.value
  overflows.value = !!el && el.scrollWidth > el.clientWidth + 1
  const left = Math.abs(el?.scrollLeft ?? 0)
  more.value = {
    start: overflows.value && left > 1,
    end: overflows.value && left + (el?.clientWidth ?? 0) < (el?.scrollWidth ?? 0) - 1,
  }
  boxWidth.value = el?.clientWidth ?? 0
  actionsWidth.value = actionsRef.value?.offsetWidth ?? 0
  headHeight.value = tableRef.value?.querySelector('thead')?.offsetHeight ?? 0
  // A row's height, from the rows or the skeleton in view; never from a plate.
  const row = tableRef.value?.querySelector('tbody tr')?.getBoundingClientRect().height
  if (row && (props.loading || (props.items.length && !props.error))) rowHeight.value = row
}
const plateStyle = computed(() => (boxWidth.value ? { width: `${boxWidth.value}px` } : undefined))
// The row actions stand at the end over the columns that scroll: the end's shade starts at them.
const actionsRef = ref<HTMLElement | null>(null)
const actionsWidth = ref(0)
// The arrows stand in the header's band, centred on it, 4px in from the edge they page toward.
const headHeight = ref(0)
// Rows to page: an empty or a failed table shows its plate whole, with no shade or arrow over it.
const paging = computed(() => !props.error && (props.loading || props.items.length > 0))
const arrows = computed(() =>
  (['start', 'end'] as const).filter((side) => paging.value && more.value[side]),
)
const arrowStyle = (side: 'start' | 'end') => ({
  top: `${Math.max(0, (headHeight.value - 28) / 2)}px`,
  [side === 'start' ? 'insetInlineStart' : 'insetInlineEnd']:
    `${(side === 'end' ? actionsWidth.value : 0) + 4}px`,
})
// A page is the width the columns scroll in, less a fifth, so a column cut at the edge is seen
// again on the next page; under reduced motion it jumps.
function page(direction: 1 | -1) {
  const el = scrollRef.value
  if (!el) return
  const still =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1
  const width = el.clientWidth - actionsWidth.value
  el.scrollBy({ left: direction * rtl * width * 0.8, behavior: still ? 'auto' : 'smooth' })
}
let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && scrollRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(scrollRef.value)
    // The table grows inside a box that keeps its size: a late cell, a pushed row, a new step.
    if (tableRef.value) observer.observe(tableRef.value)
  }
  // A web font arriving later widens the text, not the box.
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => [props.items, props.columns, props.loading], measure, { flush: 'post' })
const valueOf = (col: TableColumn<T>, row: T): unknown =>
  col.accessor ? col.accessor(row) : row[col.key]
// A plain object has no text of its own: "[object Object]" would reach the person.
const warned = new Set<string>()
// A table that already scrolls sideways does not squeeze a column of short values onto two lines
// ("Oct" over "2"): it has the room to the side. A column of long text, a cut one, and one drawn by
// its slot wrap or cut as they do in a table that fits.
const SHORT = 24
const unbroken = computed(
  () =>
    new Set(
      props.columns
        .filter(
          (col) =>
            !col.truncate &&
            !slots[`cell.${col.key}`] &&
            props.items.every((row) => textOf(col, row).length <= SHORT),
        )
        .map((col) => col.key),
    ),
)
function textOf(col: TableColumn<T>, row: T): string {
  const v = valueOf(col, row)
  if (v === null || v === undefined || v === '') return EMPTY
  if (!col.format && Object.prototype.toString.call(v) === '[object Object]') {
    if (isDev() && !warned.has(col.key)) {
      warned.add(col.key)
      console.warn(
        `[grani] UiTable: the column "${col.key}" holds an object; give it \`format\`, \`accessor\` or a \`#cell.${col.key}\` slot.`,
      )
    }
    return EMPTY
  }
  const text = col.format ? col.format(v, row) : String(v)
  return text.trim() === '' ? EMPTY : text
}

const colCount = computed(
  () => props.columns.length + (props.selectable ? 1 : 0) + (seen['row-actions'] ? 1 : 0),
)
const hasFooter = computed(() => props.columns.some((c) => Boolean(seen[`footer.${c.key}`])))

// One live region that exists from the start; a region that appears with its text is often not read.
// The error is said once, by the plate's own alert: the status region stays quiet, so it is not said twice.
const status = computed(() => {
  // A first load is a load; with rows in view it is a refresh, said as one.
  if (props.loading)
    return props.items.length && !props.error && !failed.value
      ? t('grani.table.updating')
      : t('grani.table.loading')
  // A failed load is said by its plate (an alert), once.
  if (props.error) return ''
  if (props.items.length) return ''
  return props.filtered ? t('grani.table.emptyFiltered') : t('grani.table.empty')
})
const said = useLiveText(() => status.value)

const sortedBy = (col: TableColumn<T>) => props.sort?.key === col.key
const ariaSort = (col: TableColumn<T>) => {
  if (!col.sortable) return undefined
  if (!sortedBy(col)) return 'none'
  return props.sort!.dir === 'asc' ? 'ascending' : 'descending'
}
const sortGlyph = (col: TableColumn<T>) => {
  if (!sortedBy(col)) return ChevronsUpDown
  return props.sort!.dir === 'asc' ? ChevronUp : ChevronDown
}
// The focus stays on the header's button, and a reader does not say its parent's `aria-sort` again:
// the sort a press asked for is said in a region of its own once the app sends it back, compared by
// value, so an app that sends a new object of the old sort while it waits says nothing yet. One the
// app sets by itself (a link, a reset) is not said, and a press the app did not follow is let go
// when the load ends without it.
const sortId = (s: TableSort | undefined) => (s ? `${s.key}:${s.dir}` : '')
let sortAsked: string | null = null
const sortSaid = ref('')
const sortVoice = createAnnouncer()
onBeforeUnmount(() => sortVoice.stop())
watch(
  () => sortId(props.sort),
  (now) => {
    if (sortAsked === null || now !== sortAsked) return
    sortAsked = null
    const sort = props.sort
    const col = sort ? props.columns.find((c) => c.key === sort.key) : undefined
    const words =
      sort && col
        ? t(sort.dir === 'asc' ? 'grani.table.sortedAsc' : 'grani.table.sortedDesc', {
            column: col.label || col.key,
          })
        : t('grani.table.unsorted')
    sortVoice.stop()
    sortVoice.say((w) => (sortSaid.value = w), words)
  },
)
watch(
  () => props.loading,
  (now, was) => {
    if (was && !now && sortId(props.sort) !== sortAsked) sortAsked = null
  },
)

function toggleSort(col: TableColumn<T>) {
  // Held while rows load: a second press would be a second request.
  if (props.loading) return
  const first: SortDirection = col.defaultSortDir ?? 'asc'
  const other: SortDirection = first === 'asc' ? 'desc' : 'asc'
  let next: TableSort = null
  if (!sortedBy(col)) next = { key: col.key, dir: first }
  else if (props.sort!.dir === first) next = { key: col.key, dir: other }
  sortAsked = sortId(next)
  emit('update:sort', next)
}

const isSelected = (row: T) => {
  const k = keyOf(row)
  return k !== undefined && props.selection.has(k)
}
const canSelect = (row: T) => keyOf(row) !== undefined && (props.isRowSelectable?.(row) ?? true)
const pageKeys = computed(() =>
  props.items.filter(canSelect).map((row) => keyOf(row) as string | number),
)
const pageState = computed<boolean | 'mixed'>(() => {
  const n = pageKeys.value.filter((k) => props.selection.has(k)).length
  if (n === 0) return false
  return n === pageKeys.value.length ? true : 'mixed'
})
// Shift with the press takes the rows from the last one marked to this one, all to the state this
// one goes to. The checkbox says only its new value, so the cell hears the Shift first: a click by
// the pointer carries it, a Space from the keyboard carries it on its keydown (its click does not).
let anchor: string | number | null = null
// A selection emptied from outside (the strip's clear) leaves no row marked to start a range from.
// A set emptied by the table's own press may come back as another object (a reactive copy); the
// anchor goes then too, and no row is marked either.
let emitted: Set<string | number> | null = null
watch(
  () => props.selection,
  (s) => {
    if (!s.size && s !== emitted) anchor = null
  },
)
let shift = false
let spaceShift = false
function onBoxKey(event: KeyboardEvent) {
  if (event.key === ' ') spaceShift = event.shiftKey
}
// A click with no pointer and no Space before it (a screen reader's, a script's) is never a range.
function onBoxClick(event: MouseEvent) {
  shift = event.detail > 0 ? event.shiftKey : spaceShift
  spaceShift = false
}
function toggleRow(row: T) {
  const k = keyOf(row)
  if (k === undefined) return
  const next = new Set(props.selection)
  const on = !next.has(k)
  const from = anchor === null ? -1 : props.items.findIndex((r) => keyOf(r) === anchor)
  const to = props.items.indexOf(row)
  if (shift && from >= 0 && to >= 0) {
    const [a, b] = from < to ? [from, to] : [to, from]
    for (const r of props.items.slice(a, b + 1)) {
      if (!canSelect(r)) continue
      const rk = keyOf(r) as string | number
      if (on) next.add(rk)
      else next.delete(rk)
    }
  } else if (on) next.add(k)
  else next.delete(k)
  shift = false
  anchor = k
  emitted = next
  emit('update:selection', next)
}
function togglePage() {
  const next = new Set(props.selection)
  const clear = pageState.value === true
  for (const k of pageKeys.value) {
    if (clear) next.delete(k)
    else next.add(k)
  }
  emit('update:selection', next)
}

// A control inside a row keeps its own click; the list is by role, so a div acting as a button counts too.
const CONTROL =
  'a[href],button,input,select,textarea,label,summary,[role="button"],[role="link"],[role="menuitem"],[role="switch"],[role="checkbox"],[contenteditable="true"]'
function overSelectedText(rowEl: Element | null): boolean {
  const sel = typeof window === 'undefined' ? null : window.getSelection?.()
  if (!sel || sel.isCollapsed || !sel.toString().trim() || !sel.anchorNode) return false
  return Boolean(rowEl?.contains(sel.anchorNode))
}
function onRowClick(row: T, event: MouseEvent) {
  if (!props.clickable) return
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return
  const control = (event.target as Element | null)?.closest(CONTROL)
  if (control && (event.currentTarget as Element).contains(control)) return
  if (overSelectedText(event.currentTarget as Element | null)) return
  emit('row-click', row, event)
}

// The focus stays where the person is when what holds it goes. Taken before a render: the row
// under it may leave (a delete), move (a sort; a browser blurs a node it moves), or the page
// checkbox may turn off with the last row. After it, the same control of the same row takes it
// back; a row gone hands it to the same control of the row now in its place, and a table left
// without rows to its scroll box. A focus that went elsewhere is not pulled back.
const rootRef = ref<HTMLElement | null>(null)
const tbodyRef = ref<HTMLElement | null>(null)
const rowsDrawn = () =>
  tbodyRef.value ? (Array.from(tbodyRef.value.children) as HTMLElement[]) : []
let drawn: readonly T[] = []
type Held = { el: HTMLElement; key: string | number | null; at: number; index: number }
let held: Held | null = null
// Where a control stands among the rows drawn: its row's key and place, and its place in the row.
const placeOf = (el: HTMLElement): Held => {
  const tr = el.closest('tr')
  const at = tr ? rowsDrawn().indexOf(tr) : -1
  const row = at >= 0 ? drawn[at] : undefined
  return {
    el,
    key: row ? rowKeyOf(row) : null,
    at,
    index: tr && at >= 0 ? tabbables(tr).indexOf(el) : -1,
  }
}
// The same control of the row now in the place of the one that held it.
const inPlaceOf = (h: Held) => {
  const rows = rowsDrawn()
  if (h.key === null || !rows.length) return undefined
  const i = props.items.findIndex((r) => rowKeyOf(r) === h.key)
  const list = tabbables(rows[i >= 0 ? i : Math.min(h.at, rows.length - 1)]!)
  return list[Math.min(Math.max(h.index, 0), list.length - 1)]
}
// The row's control the person last pressed or focused. A window opened from it holds the focus
// while its row may leave (a delete inside a question's `action`): the control in its place, or
// the box, takes over, and the window gives the focus back there (utils/focusSuccessor).
let last: HTMLElement | null = null
let away: Held | null = null
const PRESSABLE = 'a[href], button, input, select, textarea, [tabindex]'
// A held Enter on a button or a link of a row, the app's own as well as the library's, is one
// press: each repeat would click it, and the focus handed to the next row would carry it down.
function holdRowPress(e: KeyboardEvent) {
  const target = e.target instanceof Element ? e.target : null
  if (target?.closest('button, a[href], [role="button"]')) holdEnter(e)
}
function lastIn(e: Event) {
  const el = e.target instanceof Element ? e.target.closest<HTMLElement>(PRESSABLE) : null
  if (el && el.closest('tbody tr')) last = el
}
onBeforeUpdate(() => {
  held = null
  away = null
  const el = document.activeElement
  if (last?.isConnected && !rootRef.value?.contains(el)) away = placeOf(last)
  if (!(el instanceof HTMLElement) || !rootRef.value?.contains(el)) return
  held = placeOf(el)
})
onUpdated(() => {
  drawn = [...props.items]
  const gone = away
  away = null
  if (gone && !gone.el.isConnected) {
    const next = inPlaceOf(gone) ?? scrollRef.value
    if (next) succeed(gone.el, next)
    last = next ?? null
  }
  const h = held
  held = null
  if (!h) return
  const now = document.activeElement
  const off = (h.el as HTMLInputElement).disabled === true
  // A row's own control held for a moment (a Delete off while rows load) keeps the focus: the next
  // press must not land on its neighbor. Only the page checkbox, off for good with no rows, hands it on.
  if (off && h.key !== null && h.el.isConnected) return
  if (!(now === null || now === document.body || (now === h.el && off))) return
  if (h.el.isConnected && !off && rootRef.value?.contains(h.el)) return h.el.focus()
  const target = inPlaceOf(h)
  if (target) return target.focus()
  scrollRef.value?.focus()
})
// A copy: a parent that splices its array in place would change what was drawn before the render.
onMounted(() => (drawn = [...props.items]))

// Retry is held while the load runs, and the focus stays in the table: the button leaves (the
// plate gives way to skeleton rows) or is held, and the box it stood in takes the focus.
function retry(event: MouseEvent) {
  if (props.loading) return
  const from = event.currentTarget as HTMLElement | null
  emit('retry')
  nextTick(() => {
    const at = typeof document === 'undefined' ? null : document.activeElement
    if (from && at === from && from.isConnected && !props.loading) return
    scrollRef.value?.focus()
  })
}
</script>
