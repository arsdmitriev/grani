<!--
  UiFilterList: the checklist of one filter dimension, where each tick applies at once. Take it
  inside the panel of a UiFilter or UiTableColumns.

  Behavior. It follows UiSelect with `multiple`: a listbox of check-mark rows that runs edge to
  edge across the panel.

  Search. With more than five options, a search row at the top narrows the list, by label and by
  an option's `keywords`, and says when nothing is found; it leaves the accents of Latin and
  Cyrillic letters out, so "munchen" finds München. Its cross clears the text. When the
  options drop to five or fewer the search leaves with its text, and the focus it held goes to the
  list; when they grow to six the focus the list held goes into the new search.

  Chosen first. From six options, the ones chosen when the list opens stand at its top, in their
  own order, so a long list shows what is chosen without scrolling; the order stays while the list
  is open, so a tick never moves a row under the pointer. Five or fewer keep their order, which is
  read at a glance and may mean something. With `groups`, a name stands over the chosen and over
  the rest, a line between them, so the order explains itself.

  Only. The highlighted row (the one under the pointer, the one a tap ticked, the one the keys lit)
  offers "Only", which keeps that option alone and unticks the others; a fixed option stays as it
  is. A list of one or two options offers none: a single tick does the same.

  Options. `loading` with no options yet draws five rows in their shape, a box and a line; a list
  of up to five takes their place, a longer one adds its search above them, since the count is not
  known before they come. With options in view it is a refresh: they stay, held and dimmed. An
  option can be `disabled` (shown, but fixed as it is) and can carry a `description` at its end.
  The highlight stays on a row that is drawn when the options change. The chosen values should be
  among the options: a value with no option has no row.

  Attributes. `class` and `style` land on the root, other attributes on the listbox.

  Placement. In the panel of a UiPopover (UiFilter, UiTableColumns), alone or as a flat UiCard
  section. It needs a name: `ariaLabel`, or the title of its card; in development an unnamed list
  warns.

  Keyboard.
  The list is one tab stop, or its search is when it has one.
  In the list:
  - `ArrowDown` `ArrowUp`: move the highlight.
  - `Home` `End`: jump.
  - `Enter` `Space`: tick the highlighted row; a `Space` after letters typed over the list belongs to
    the word.
  - `Alt` `Enter`: keep the highlighted option alone, unticking the others.
  - `A–Z`: jumps to the first option that starts with the letter; the same letter again goes on
    to the next, and letters typed together find a word.
  In the search:
  - `ArrowDown` `ArrowUp`: move the highlight too.
  - `Enter`: ticks the first match.
  - `Alt` `Enter`: keeps the highlighted option alone.
  - `Escape`: clears the text and stays in the panel.
  - `Space` `A–Z`: type.
  A press on a row ticks it without taking the focus.

  Reader.
  - List: a multi-select listbox (`aria-multiselectable`) named by `ariaLabel`, or by the title of
    the UiCard it stands in.
  - Row: an option that says whether it is ticked (`aria-selected`), is held when `disabled` or
    `loading` (`aria-disabled`), and has its `description` read at its end.
  - Highlight: `aria-activedescendant`, on the list or on the search, which controls the list
    (`aria-controls`).
  - Only: the list and the search carry `aria-keyshortcuts="Alt+Enter"`; the word on the row is
    for the pointer and hidden.
  - Nothing found: read from a status region that is always present and is filled when the search
    leaves no row.
  - Loading: `aria-busy` on the root; the first load is said in the status region ("Loading
    options…"), its rows in the options' shape hidden.

  States. Rest, a highlighted row, ticked rows, a `disabled` row with its note, a first load in the
  options' shape, a refresh with every row held and dimmed, a search from six options, a narrowed list and its empty result; a list cut at five and
  a half rows that scrolls inside itself.

  Not for.
  - The button and the panel around it: UiFilter or UiTableColumns.
  - One value: UiSelect.
  - A box or two in a form: UiCheckbox.
  - A list of names that grows: UiListField.
-->
<template>
  <div
    class="flex flex-col"
    :class="rootClass"
    :style="rootStyle"
    data-list-top
    data-list-bottom
    :aria-busy="loading || undefined"
  >
    <div v-if="searchable" data-list-search :class="[bleed, PANEL_LIST_SEARCH]">
      <Search aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-muted" />
      <input
        ref="searchRef"
        v-model="query"
        type="text"
        autocomplete="off"
        :aria-label="t('grani.filter.search')"
        :placeholder="t('grani.filter.search')"
        aria-autocomplete="list"
        aria-keyshortcuts="Alt+Enter"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        class="text-sm/5.5"
        :class="PANEL_LIST_SEARCH_INPUT"
        @keydown="onKeydown"
      />
      <UiIconButton
        v-if="query"
        variant="ghost"
        size="xs"
        :icon="X"
        :ariaLabel="t('grani.input.clear')"
        class="-me-1.5"
        @mousedown.prevent
        @click="clearQuery"
      />
    </div>
    <ul
      v-bind="control"
      :id="listId"
      ref="listRef"
      role="listbox"
      aria-multiselectable="true"
      aria-keyshortcuts="Alt+Enter"
      :tabindex="searchable ? -1 : 0"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="ariaLabel ? undefined : cardTitle"
      :aria-activedescendant="searchable ? undefined : activeId"
      :aria-describedby="joinIds(control['aria-describedby'])"
      class="overflow-y-auto text-sm/5.5 transition-opacity focus:outline-hidden"
      :class="[bleed, PANEL_LIST_HEIGHT, loading && items.length ? 'opacity-60' : '']"
      :style="{ maxHeight: listHeight }"
      @keydown="onKeydown"
      @focus="active < 0 && move(firstActive())"
    >
      <!-- A long list re-renders every row on each arrow key without `rowMemo`. One loop holds the
           names and the rows, since a memo in a loop inside another would share one cache. -->
      <!-- eslint-disable-next-line vue/no-useless-template-attributes -- the rule does not know `v-memo` combined with `v-for`; it is the only correct way to memoize two row shapes under one key. -->
      <template v-for="entry in entries" :key="entry.key" v-memo="rowMemo(entry)">
        <!-- A name over the chosen and over the rest, a line between: decoration, since each row
             says whether it is ticked. -->
        <li
          v-if="!entry.item"
          data-group
          role="presentation"
          aria-hidden="true"
          class="px-3 pb-1 pt-2 text-xs/4.5 font-medium text-fg-muted first:pt-[max(0.5rem,calc(var(--radius-overlay)*0.3))]"
          :class="entry.line ? 'mt-1 border-t border-border' : ''"
        >
          {{ entry.name }}
        </li>
        <PanelRow
          v-else
          :id="optionId(entry.index)"
          purpose="option"
          role="option"
          :aria-selected="isOn(entry.item)"
          :aria-disabled="loading || entry.item.disabled || undefined"
          :label="entry.item.label"
          :note="entry.item.description"
          :box="isOn(entry.item)"
          :active="entry.index === active"
          :disabled="held(entry.item)"
          @pointermove="held(entry.item) || (active = entry.index)"
          @click="pick(entry.item, entry.index)"
        >
          <!-- For the pointer; the keys keep an option alone by Alt+Enter, said on the list. -->
          <template v-if="entry.index === active && offersOnly(entry.item)" #end>
            <!-- The word is drawn from the attribute, so the option's own text stays its label alone. -->
            <span
              data-only
              :data-label="t('grani.filter.only')"
              aria-hidden="true"
              class="-me-1 shrink-0 rounded-control px-1.5 text-xs/4.5 font-medium text-fg-muted before:content-[attr(data-label)] hover:text-fg"
              @click.stop="only(entry.item)"
            />
          </template>
        </PanelRow>
      </template>
      <!-- The first options on their way: rows in their shape, so nothing moves when they come. -->
      <template v-if="firstLoad">
        <li
          v-for="(width, i) in SKELETON_WIDTHS"
          :key="i"
          role="presentation"
          aria-hidden="true"
          data-skeleton
          :class="PANEL_LIST_ROW"
        >
          <!-- The box's own corner, marked to win: the skeleton brings rounded-control, which on an
               18px box draws a circle. -->
          <UiSkeleton
            class="shrink-0 rounded-[min(var(--radius-badge),33%)]!"
            :class="CHECK_MARK_BOX"
          />
          <span class="block min-w-0 flex-1">
            <UiSkeleton class="inline-block h-3 align-middle" :class="width" />
          </span>
        </li>
      </template>
      <li
        v-else-if="!shown.length"
        role="presentation"
        aria-hidden="true"
        class="text-fg-muted"
        :class="PANEL_LIST_NOTE"
      >
        {{ t('grani.filter.empty') }}
      </li>
    </ul>
    <!-- Always there, filled with text: a region that appears with its text is announced unreliably. -->
    <p class="sr-only" role="status">
      {{
        firstLoad
          ? t('grani.filter.loading')
          : loading
            ? t('grani.filter.updating')
            : shown.length
              ? ''
              : t('grani.filter.empty')
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { isImeKey } from '../utils/ime'
import { searchText } from '../utils/searchText'
import { computed, inject, onMounted, ref, useId, watch } from 'vue'
import { Search, X } from '@lucide/vue'
import type { SelectOption, SelectValue } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useVisibleRows } from '../composables/useVisibleRows'
import { joinIds, useSplitAttrs } from '../utils/attrs'
import {
  PANEL_LIST_HEIGHT,
  PANEL_LIST_NOTE,
  PANEL_LIST_ROW,
  PANEL_LIST_SEARCH,
  PANEL_LIST_SEARCH_INPUT,
  usePanelList,
} from '../utils/panelList'
import { BLEED, CARD_TITLE_ID, SURFACE_GUTTER } from '../utils/surface'
import { CHECK_MARK_BOX } from '../utils/checkMark'
import PanelRow from './PanelRow.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiIconButton from './UiIconButton.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The options, as a select's: a value (as in the URL) and a label; `disabled` shows one fixed as it is, `description` puts a word at its end. */
    items: SelectOption[]
    /** The chosen values. */
    modelValue: SelectValue[]
    /** The options are being replaced: the rows are held. */
    loading?: boolean
    /** A name for the list; inside a UiCard with a title the title names it. */
    ariaLabel?: string
    /** From six options, where the chosen stand first: a name over them and over the rest, a line between. Unset, they stand first without names. */
    groups?: { chosen: string; rest: string }
  }>(),
  { loading: false, ariaLabel: '' },
)

const emit = defineEmits<{
  /** The chosen values after a tick. */
  'update:modelValue': [value: SelectValue[]]
}>()

// Five fit at a glance; the sixth is where people start scanning.
const SEARCH_FROM = 6

const { t } = useUiT()
const { rootClass, rootStyle, control } = useSplitAttrs()
const uid = useId()
const listId = `ui-filter-list-${uid}`
const optionId = (index: number) => `${listId}-${index}`
const cardTitleRef = inject(CARD_TITLE_ID, undefined)
const cardTitle = computed(() => cardTitleRef?.value)
// The rows run to the edges of the surface it stands in, through its gutter.
const gutter = inject(SURFACE_GUTTER, null)
const bleed = gutter ? BLEED[gutter] : ''
const query = ref('')
const searchRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const searchable = computed(() => props.items.length >= SEARCH_FROM)
// What was chosen when the list opened (it mounts with its panel), held for as long as it is open.
const openedWith = new Set(props.modelValue)
const ordered = computed(() =>
  searchable.value
    ? [
        ...props.items.filter((i) => openedWith.has(i.value)),
        ...props.items.filter((i) => !openedWith.has(i.value)),
      ]
    : props.items,
)
const shown = computed(() => {
  const q = searchText(query.value.trim())
  return q
    ? ordered.value.filter(
        (i) =>
          searchText(i.label).includes(q) ||
          Boolean(i.keywords && searchText(i.keywords).includes(q)),
      )
    : ordered.value
})
// The rows as they are, or, once the chosen stand first with names given and both groups have a
// row in view, a name over each group. A name is keyed by a symbol, which no option's value equals.
type Entry =
  | { key: symbol; name: string; line: boolean; item?: undefined; index: -1 }
  | { key: SelectValue; name?: undefined; line?: undefined; item: SelectOption; index: number }
const CHOSEN = Symbol('chosen')
const REST = Symbol('rest')
const entries = computed<Entry[]>(() => {
  const rows = shown.value.map((item, index) => ({ key: item.value, item, index }))
  const at =
    props.groups && searchable.value ? shown.value.findIndex((o) => !openedWith.has(o.value)) : -1
  if (at <= 0) return rows
  return [
    { key: CHOSEN, name: props.groups!.chosen, line: false, index: -1 },
    ...rows.slice(0, at),
    { key: REST, name: props.groups!.rest, line: true, index: -1 },
    ...rows.slice(at),
  ]
})
// The deps of the template's `v-memo`: `index` stands for the row's id and its place in the
// keyboard order, which a narrower search can shift even when the option itself did not change.
const rowMemo = (entry: Entry) =>
  entry.item
    ? [
        entry.index,
        entry.index === active.value,
        isOn(entry.item),
        held(entry.item),
        offersOnly(entry.item),
        entry.item.label,
        entry.item.description,
      ]
    : [entry.name, entry.line]
const activeId = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))
const { maxHeight: listHeight } = useVisibleRows(listRef, '[role=option]', () => shown.value.length)

const isOn = (item: SelectOption) => props.modelValue.includes(item.value)
const held = (item: SelectOption) => props.loading || Boolean(item.disabled)
// No options yet and more on the way: the list draws their shape, not "Nothing found".
const firstLoad = computed(() => props.loading && !props.items.length)
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-3/5']
function toggle(item: SelectOption | undefined) {
  if (!item || held(item)) return
  const rest = props.modelValue.filter((v) => v !== item.value)
  emit('update:modelValue', isOn(item) ? rest : [...rest, item.value])
}
// Only this one: a fixed option chosen stays, as a fixed option always does.
const fixed = () =>
  props.modelValue.filter((v) => props.items.some((i) => i.value === v && i.disabled))
const offersOnly = (item: SelectOption) =>
  props.items.length > 2 &&
  !held(item) &&
  !(props.modelValue.length === 1 && props.modelValue[0] === item.value)
// A tap moves no pointer: the row it ticks is lit, so the touch finds its Only there.
function pick(item: SelectOption, index: number) {
  if (!held(item)) active.value = index
  toggle(item)
}
function only(item: SelectOption | undefined) {
  if (!item || !offersOnly(item)) return
  emit('update:modelValue', [...fixed(), item.value])
}

// The highlight, the arrows past a disabled row, the letters, the row kept in view: as a select's.
const { active, firstEnabled, move, keys, typeAhead, typing } = usePanelList({
  items: () => shown.value,
  disabled: (o) => Boolean(o.disabled),
  label: (o) => o.label,
  row: (i) => (i >= 0 ? document.getElementById(optionId(i)) : null),
  list: () => listRef.value,
  typeAhead: 'first',
})
// As a select opens: on the first ticked row, else on the first that can be ticked.
const firstActive = () => {
  const ticked = shown.value.findIndex((o) => !o.disabled && isOn(o))
  return ticked >= 0 ? ticked : firstEnabled(0, 1)
}

// A search with text clears itself, as every search of the library does: the cross, or Escape;
// the focus stays in the field, and an Escape that cleared does not close the popover.
function clearQuery() {
  query.value = ''
  searchRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  const inSearch = e.target === searchRef.value
  // The Enter or the key that confirms an IME candidate belongs to the composition.
  if (isImeKey(e)) return
  if (keys(e, inSearch)) return
  if (e.key === 'Enter' && e.altKey) {
    e.preventDefault()
    only(shown.value[active.value])
    return
  }
  switch (e.key) {
    case 'Escape':
      if (!inSearch || !query.value) return
      e.preventDefault()
      e.stopPropagation()
      clearQuery()
      break
    case 'Enter':
      // Never a form submit around the filter. A held Enter ticks once: its repeats would tick and
      // untick the same row.
      e.preventDefault()
      if (!e.repeat) toggle(shown.value[active.value])
      break
    case ' ':
      if (inSearch) return
      e.preventDefault()
      if (e.repeat) break
      // A Space within a word typed over the list belongs to it: "new j" goes on to New Jersey.
      if (typing()) typeAhead(' ')
      else toggle(shown.value[active.value])
      break
    default:
      if (!inSearch && e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) typeAhead(e.key)
  }
}

// The list mounts each time its panel opens: the highlight starts on the chosen row at once,
// also when the search, not the list, takes the first focus.
onMounted(() => {
  if (active.value < 0) active.value = firstActive()
  if (isDev() && !props.ariaLabel && !cardTitle.value)
    console.warn(
      '[grani] UiFilterList: the list has no name; give it `ariaLabel` or a UiCard title',
    )
})

if (isDev()) {
  watch(
    () => [props.items, props.modelValue, props.loading] as const,
    ([items, value, loading]) => {
      const values = items.map((i) => i.value)
      if (new Set(values).size !== values.length)
        console.warn('[grani] UiFilterList: two options share a value; they tick together')
      // On a first load the options are not here yet: a held value is not lost until they come.
      if (loading && !items.length) return
      const lost = value.filter((v) => !values.includes(v))
      if (lost.length)
        console.warn(
          `[grani] UiFilterList: ${lost.length} chosen value(s) not among the options, no row to untick.`,
        )
    },
    { immediate: true },
  )
}

// A narrowed list starts its highlight on the first match; a cleared one goes back to where it
// opened, so Enter still ticks a row.
watch(query, () => (active.value = query.value ? firstEnabled(0, 1) : firstActive()))
// New options under the highlight: it stays on a row that is drawn, the last one that can be
// ticked when the list got shorter.
watch(shown, (rows) => {
  if (active.value >= rows.length) active.value = firstEnabled(rows.length - 1, -1)
  // The first options after a load: the highlight starts where an open list starts it.
  else if (active.value < 0 && !query.value) active.value = firstActive()
})
// The search comes and goes with the count of options. Before it leaves (fewer than six), its text
// goes with it, or it would keep narrowing a list nothing can clear, and the focus it held moves to
// the list; when it comes (six or more) the focus the list held moves into it, where the letters
// and the highlight now are. Read before the change is drawn, moved once it is.
let handTo: 'search' | 'list' | null = null
watch(
  searchable,
  (on) => {
    const had = document.activeElement
    handTo = !on && had === searchRef.value ? 'list' : on && had === listRef.value ? 'search' : null
    if (!on) query.value = ''
  },
  { flush: 'pre' },
)
watch(
  searchable,
  () => {
    if (handTo) (handTo === 'search' ? searchRef.value : listRef.value)?.focus()
    handTo = null
  },
  { flush: 'post' },
)
</script>
