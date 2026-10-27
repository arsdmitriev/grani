<!--
  UiSelect: a form control for picking one value from a list of options, or several with
  `multiple`. It sits in the input capsule on the control ladder.

  Placement. In a form, under a UiField label beside UiInput and UiDatePicker on the same
  step, or joined with a UiInput in a UiButtonGroup (an amount and its currency); as the kind
  filter of UiLog past three kinds.

  Panel. The trigger is a button with the combobox role. The list is a listbox in a panel
  anchored under it; the panel flips above when there is no room below and follows scrolling.

  Options. Items are options or groups of options. A disabled option is shown but cannot be
  picked. While the app's options are on their way it passes `loading`: with none yet the list
  draws rows in their shape, never "No matches"; with options in view they stay, dimmed, still
  to be picked, and the highlight keeps to its option as they change. A picked value whose option
  has not come yet reads as a load in the field and is sent as it is; once the load is over, a value
  no option knows shows as its own text and is sent, so the field never looks empty while the form
  holds a value, and in development the console names it once per app. An empty string no option
  has is nothing picked, as `null` is. With `fetcher` the select says its own load and
  `loading` does nothing. A list that loads holds the height it reached while open, until a filter
  narrows options already in.

  Types. The model's shape follows `multiple`: one value or `null` without it, an array with it, and
  the props reject the other. A `multiple` decided at run time is two branches (`v-if` with the
  array model, `v-else` with the single one). `update:modelValue` carries either shape: an explicit
  handler casts what it receives, `v-model` needs nothing.

  Search. `searchable` puts a filter at the top of the list; an option's `keywords` are matched
  too. The filter leaves the accents of Latin and Cyrillic letters out, so a name typed without them
  is found ("munchen" finds München) and the Cyrillic yo reads as ie; the Cyrillic short i stays a
  letter of its own. `fetcher` asks a server for the options as the filter is typed. The picked options are
  remembered, so their labels survive a new search. While the first answer is on its way the list
  draws rows of the options' shape, and while it is open it never shrinks, so nothing under the
  pointer moves as answers come. A failed search offers Try again, which asks once more; a search
  that matches nothing offers Clear search.

  Clear. `clearable` adds a button that resets the value to `null`, or `[]` with `multiple`: a
  choice is a value or `null`. A required field never gets it, since there empty is an error, not
  a state. Its place is kept while there is nothing to clear.

  Width. A single pick from a local list keeps the field's width: the text is sized to the
  longest labels, counted in letters, so a label of wide letters outside the three longest can
  still widen it. A chosen label longer than the field is cut, and shows whole in a tooltip on
  hover while the list is closed.

  Multiple. `multiple` turns the rows into check marks and the model into an array, and a pick
  keeps the list open. The trigger shows the count of picks, and each pick stands below the field
  as a tag with a cross.

  Picks. With `multiple`, the `#picks` slot draws the picks under the field the app's way, in
  place of tags: a row with what the app keeps for each, a quantity, a price. The field becomes a
  search that adds; it keeps its placeholder, since the picks are in view below. The value stays the
  list of picked values in the order they were picked; what a row holds besides is the app's. A
  disabled select takes no pick back, and hands `disabled` to the rows, so the app can hold its own
  controls too.

  Field. Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and
  required from the field.

  Attributes. `class` and `style` land on the select's outer box: the capsule, or with tags or the
  app's picks the box that holds the capsule and them; every other attribute and listener lands on
  the trigger, the combobox.

  Keyboard.
  On the closed field:
  - `ArrowDown` `ArrowUp` `Enter` `Space` `Home`: open the list, and so do `Alt+ArrowDown` `Alt+ArrowUp`;
    `Ctrl` or `Meta` with a key stays the browser's.
  - `End`: opens the list on the last option.
  - `A–Z`: opens it on the first label that starts with the letter, or starts the filter when
    there is one.
  - `Backspace`: with `multiple`, removes the last pick.
  In the open list:
  - `ArrowDown` `ArrowUp`: move over the enabled options.
  - `Home` `End`: jump to the first and the last option; in the filter they move the caret.
  - `Enter`: picks; never submits the form around it. While the answer to the typed text is on its
    way it picks nothing. After a failed search it asks again. A pick closes a single list and returns the
    focus to the field; a `multiple` list stays open.
  - `Space`: picks, outside the filter; after letters typed over the list it belongs to the word.
  - `A–Z`: jumps to the first match; letters typed together find a word.
  - `Escape`: closes the list and returns the focus to the field; inside a window it closes only
    the list, and in a filter with text it clears the text first.
  - `Tab`: closes the list and moves on to the next field. A pointer press outside closes it too.
  On a tag:
  - `Enter` `Space`: on its cross, removes that pick and moves the focus to the next tag, or to
    the field.

  Reader.
  - Field: a combobox named by `ariaLabel` or the field's label. It says the chosen label, the
    count of picks or the placeholder, whether it is expanded, and that it opens a listbox.
  - List: a listbox with the same name, `aria-multiselectable` with `multiple`. A group's heading
    is shown but is not an option.
  - Options: each says selected and disabled. The highlighted one is tracked through
    `aria-activedescendant` on the field, or on the filter, a named text box with
    `aria-autocomplete`.
  - Status: a region that stays in the DOM says what the list is doing: "Searching…" for a
    `fetcher`, "Loading options…" and "Updating…" for the app's load, then "No matches" to a
    search, "No options" to none, or the failure, once nothing is on its way.
  - Errors: `invalid` is `aria-invalid`, `required` is `aria-required`, and the field's
    description and error are read with the field.
  - Tags: they stand in a named list, each cross is named with its label, and the clear button
    has a name.

  States. Empty with the placeholder, a pick, open with the chosen option highlighted, a disabled
  option, groups, the app's options on their way (`loading`: rows of their shape, then dimmed), `searchable` with its filter, a server search (rows of the options' shape
  while the first answer is on its way, the previous options dimmed while a new query waits, no
  matches with Clear search, failed with Try again, the list holding the height it reached while
  open; a late answer is dropped), `multiple` with check marks and a count, with tags below the
  field, or with the app's rows below it, `clearable` with the cross and its place kept, disabled (the plate, an inert trigger, nothing sent), invalid (a red border; disabled
  wins over it), and required, with no cross.

  Not for.
  - A few answers in view: UiRadioGroup.
  - Several answers in view: UiCheckbox in a UiField `group`.
  - A time of day: UiTimePicker.
  - A day: UiDatePicker.
  - Commands: UiMenu.
  - A list that adds what is typed: UiListField.
-->
<template>
  <Root>
    <div
      ref="capsuleRef"
      tabindex="-1"
      :class="[capsule, below ? 'w-full' : rootClass]"
      :style="below ? undefined : rootStyle"
      :data-invalid="isInvalid || undefined"
    >
      <button
        v-bind="bound"
        ref="triggerRef"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="open"
        aria-haspopup="listbox"
        class="flex h-full min-w-0 flex-1 items-center gap-2 bg-transparent text-left focus:outline-hidden disabled:cursor-not-allowed"
        @click="toggle"
        @keydown="onKeydown"
      >
        <span
          v-if="$slots.start"
          aria-hidden="true"
          class="flex shrink-0 items-center text-fg-muted [&>svg]:h-4 [&>svg]:w-4"
        >
          <slot name="start" />
        </span>
        <span
          class="grid min-w-0 flex-1 [&>*]:col-start-1 [&>*]:row-start-1 [&>*]:truncate"
          :class="
            disabled
              ? 'text-disabled-fg'
              : selectedLabel && !withPicks
                ? 'text-fg'
                : 'text-placeholder'
          "
        >
          <!-- A value whose option is still on its way: its shape, not the placeholder, which would
               read as nothing picked. -->
          <span v-if="pendingValue" class="flex items-center">
            <UiSkeleton class="inline-block h-3 w-1/2 align-middle" />
            <span class="sr-only">{{ t('grani.select.loading') }}</span>
          </span>
          <!-- Cut in a narrow field, the whole label shows in a tooltip on hover; not while the list
               is open, where the tooltip would stand over its rows and take the first Escape. -->
          <UiTruncate v-else-if="!open" :text="shownText" />
          <span v-else>{{ shownText }}</span>
          <span v-for="w in sizers" :key="w" data-sizer aria-hidden="true" class="invisible">{{
            w
          }}</span>
        </span>
        <!-- The cross's place, kept while there is nothing to clear, before the chevron: the
             width never moves. The chevron stands at the end while nothing is chosen and steps
             in beside the cross once a value is. It is the cross less the 6px the cross reaches
             into the frame's padding. -->
        <span
          v-if="clearable && !isRequired && !below && !(selectedOptions.length && !disabled)"
          data-sizer
          aria-hidden="true"
          class="shrink-0"
          :class="ladder === 'xs' ? 'h-6 w-[18px]' : 'h-7 w-[22px]'"
        />
        <ChevronDown
          aria-hidden="true"
          class="h-4 w-4 shrink-0 text-fg-muted transition-transform duration-fast"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
      <UiIconButton
        v-if="clearable && !isRequired && selectedOptions.length && !disabled"
        variant="ghost"
        size="xs"
        :icon="X"
        :ariaLabel="t('grani.select.clear')"
        :class="capsuleEndButtonClass(ladder)"
        @mousedown.prevent
        @click="clear"
      />
      <template v-if="name">
        <input
          v-for="v in sentValues"
          :key="String(v)"
          type="hidden"
          :name="name"
          :value="v"
          :disabled="disabled"
          :form="formId"
        />
      </template>

      <!-- What the list is doing is said here, outside the panel, in a region that stays in the DOM:
           a search, a load, no match, a failure. -->
      <span class="sr-only" role="status">{{ statusWords }}</span>
      <Teleport :to="teleport">
        <Transition name="ui-popover">
          <div
            v-if="open"
            ref="panelRef"
            data-ui-panel
            class="fixed z-popover flex flex-col overflow-hidden rounded-overlay border border-border bg-surface text-sm/5.5 shadow-lg"
            :style="panelStyle"
          >
            <div v-if="hasSearch" :class="PANEL_LIST_SEARCH">
              <Search aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-muted" />
              <input
                ref="searchRef"
                v-model="query"
                type="text"
                :aria-label="t('grani.select.search')"
                :placeholder="t('grani.select.search')"
                aria-autocomplete="list"
                :aria-controls="listboxId"
                :aria-activedescendant="activeId"
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
              :id="listboxId"
              ref="listboxRef"
              role="listbox"
              :aria-multiselectable="multiple || undefined"
              :aria-labelledby="field?.labelId.value"
              :aria-label="field?.labelId.value ? undefined : ariaLabel || undefined"
              :aria-busy="busy || undefined"
              class="overflow-y-auto"
              :class="[PANEL_LIST_HEIGHT, busy && options.length ? 'opacity-60' : '']"
              :style="{
                maxHeight: listHeight,
                minHeight: held && (options.length || busy) ? heldHeight : undefined,
              }"
            >
              <!-- 5000 options re-render the whole listbox on every highlight step without this:
                   `rowMemo` skips a row (and a group header) unless its own place, highlight,
                   selection, disabled state or words changed. -->
              <!-- eslint-disable-next-line vue/no-useless-template-attributes -- the rule does not know `v-memo` combined with `v-for`; it is the only correct way to memoize two row shapes under one key. -->
              <template v-for="row in rows" :key="row.key" v-memo="rowMemo(row)">
                <li
                  v-if="row.kind === 'group'"
                  role="presentation"
                  class="px-3 pb-1 pt-2 text-xs/4.5 font-medium text-fg-muted first:pt-[max(0.5rem,calc(var(--radius-overlay)*0.3))]"
                >
                  {{ row.label }}
                </li>
                <PanelRow
                  v-else
                  :id="optionId(row.index)"
                  purpose="option"
                  role="option"
                  :aria-selected="isSelected(row.option)"
                  :aria-disabled="row.option.disabled || undefined"
                  :label="row.option.label"
                  :description="row.option.description"
                  :box="multiple ? isSelected(row.option) : undefined"
                  :mark="!multiple && isSelected(row.option) ? true : undefined"
                  :active="row.index === active"
                  :disabled="row.option.disabled"
                  @pointermove="row.option.disabled || (active = row.index)"
                  @click="pick(row.option)"
                />
              </template>
              <!-- The first answer on its way: rows of the options' height, so nothing moves when they come. -->
              <template v-if="busy && nothingYet">
                <li
                  v-for="(width, i) in SKELETON_WIDTHS"
                  :key="i"
                  role="presentation"
                  aria-hidden="true"
                  data-skeleton
                  :class="PANEL_LIST_ROW"
                >
                  <!-- Several picks are rows with a box: the shape keeps it, with the box's own
                       corner marked to win over the skeleton's. -->
                  <UiSkeleton
                    v-if="multiple"
                    class="shrink-0 rounded-[min(var(--radius-badge),33%)]!"
                    :class="CHECK_MARK_BOX"
                  />
                  <span class="block min-w-0 flex-1">
                    <UiSkeleton class="inline-block h-3 align-middle" :class="width" />
                  </span>
                </li>
              </template>
            </ul>
            <!-- Outside the listbox, which holds options only: a note carries the way out of it. -->
            <div
              v-if="!options.length && (failed || !busy || !nothingYet)"
              data-note
              class="flex flex-col items-center justify-center gap-2"
              :class="PANEL_LIST_NOTE"
              :style="{ minHeight: held ? heldHeight : undefined }"
            >
              <span :class="failed ? 'text-danger-subtle-fg' : 'text-fg-muted'">
                {{ failed ? t('grani.select.failed') : emptyWords }}
              </span>
              <UiButton
                v-if="failed || query.trim()"
                variant="outline"
                size="xs"
                @mousedown.prevent
                @click="failed ? retry() : clearQuery()"
              >
                {{ failed ? t('grani.select.retry') : t('grani.select.clearSearch') }}
              </UiButton>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
    <!-- Several picks are read below the field, each with its own cross: the trigger only counts.
       8px under the field, 4px between tags; an item is flex, so no line box lifts a row. -->
    <!-- Picks the app draws: its own rows under the field, each with what it holds beside the pick. -->
    <div
      v-if="withPicks && selectedOptions.length"
      role="group"
      :aria-label="t('grani.select.picked')"
      data-picks
    >
      <!-- What the app draws beside a pick is not the field's control. -->
      <NoField>
        <slot
          name="picks"
          :options="selectedOptions"
          :remove="(o: SelectOption, e?: MouseEvent) => unpick(o, e)"
          :disabled="disabled"
        />
      </NoField>
    </div>
    <ul
      v-else-if="withTags && selectedOptions.length"
      :aria-label="t('grani.select.picked')"
      class="flex flex-wrap gap-1"
    >
      <li v-for="o in selectedOptions" :key="String(o.value)" data-tag class="flex">
        <UiBadge
          :size="tagSize ?? 'md'"
          :label="o.label"
          :removable="!disabled"
          @remove="(e: MouseEvent) => unpick(o, e)"
        />
      </li>
    </ul>
  </Root>
</template>

<script setup lang="ts">
import { isDev, warnOnce } from '../utils/dev'
import { isHeldPress } from '../utils/held'
import { isImeKey } from '../utils/ime'
import { useSlotsSeen } from '../utils/slotsSeen'
import { useTeleport } from '../composables/useShared'
import { useControlSize } from '../composables/useControlSize'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  ref,
  useId,
  watch,
} from 'vue'
import {
  PANEL_LIST_HEIGHT,
  PANEL_LIST_NOTE,
  PANEL_LIST_ROW,
  PANEL_LIST_SEARCH,
  PANEL_LIST_SEARCH_INPUT,
  usePanelList,
} from '../utils/panelList'
import { ChevronDown, Search, X } from '@lucide/vue'
import type { ControlSize, SelectItem, SelectOption, SelectValue } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { useAnchoredPanel } from '../composables/useAnchoredPanel'
import { useVisibleRows } from '../composables/useVisibleRows'
import { capsuleEndButtonClass, capsuleRoot, triggerCapsuleClass } from '../utils/controlChrome'
import { searchText } from '../utils/searchText'
import { NoField, useFieldControl } from '../utils/field'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import PanelRow from './PanelRow.vue'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiTruncate from './UiTruncate.vue'
import { CHECK_MARK_BOX } from '../utils/checkMark'
import { giveFocus } from '../utils/giveFocus'
import UiBadge from './UiBadge.vue'

defineOptions({ inheritAttrs: false })

const teleport = useTeleport()
interface SelectBase {
  /** Options or groups of options with labels. With `fetcher` they are the known labels: a prefilled value shows its label before the server answers. @default [] */
  items?: SelectItem[]
  /** Asks a server for the options: called with the filter text on open and as it is typed (250 ms after the last key); a late answer to an older query is dropped. Implies `searchable`. */
  fetcher?: (query: string) => Promise<SelectItem[]>
  /** The options the app passes in `items` are on their way: with none yet, rows in their shape; with options in view, they stay, dimmed. A `fetcher` says this by itself. @default false */
  loading?: boolean
  /** Shown when nothing is selected. */
  placeholder?: string
  /** Native name for forms. The value is submitted through a hidden input. */
  name?: string
  /** Own id when standalone. Inside UiField, the field's id takes precedence. */
  id?: string
  /** Prevents opening and clearing. @default false */
  disabled?: boolean
  /** Marks the control as invalid. Shows the invalid border and focus ring. Inside UiField, the error state sets this automatically. @default false */
  invalid?: boolean
  /** Accessible name when there is no visible label. */
  ariaLabel?: string
  /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
  size?: ControlSize
  /** Adds a filter to the option list. Typing narrows options by label. @default false */
  searchable?: boolean
  /** Adds a button that resets the value to `null`, or to `[]` with `multiple`; never shown on a required field. @default false */
  clearable?: boolean
  /** Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so. @default false */
  required?: boolean
  /** With `multiple`: every pick as a tag with a cross below the field, the trigger counting them. Without it the picks are listed in the trigger, which fits a narrow place such as a toolbar. @default false */
  tags?: boolean
  /** Size of the tags, as a UiBadge's. @default "md" */
  tagSize?: 'sm' | 'md'
}
// One pick is a value or `null`; several are an array: the model's shape follows `multiple`, so a
// scalar with `multiple` or an array without it does not compile.
type OnePick = SelectBase & {
  /** The selected value (`v-model`): `null` when nothing is selected; with `multiple`, the picked values in the order they were picked, `[]` when none is. */
  modelValue: SelectValue | null
  multiple?: false
}
type ManyPicks = SelectBase & {
  modelValue: SelectValue[]
  /** Several values: check marks in the rows, an array in the model, the list stays open after a pick. @default false */
  multiple: true
}

// Without withDefaults: over a union of props it loosens them past checking. A boolean left unset
// is false by Vue's own cast; the list and the tag size fall back below.
const props = defineProps<OnePick | ManyPicks>()
const items = computed<SelectItem[]>(() => props.items ?? [])
const ladder = useControlSize(() => props.size)

const slots = defineSlots<{
  /** Before the value, inside the trigger: a glyph that says what is chosen (a clock, a flag). Decoration. */
  start(props: Record<string, never>): any
  /** With `multiple`: the picks drawn by the app under the field, in place of tags, the field a search that adds to them. `options` are the picked options as given in `items` or by the `fetcher`; `remove` takes one back and puts the focus on the field (pass the click, `remove(option, $event)`, and a double click's second click on the row sliding under the pointer is held back); `disabled` is the field's, and while it holds `remove` does nothing. */
  picks(props: {
    options: SelectOption[]
    remove: (option: SelectOption, event?: MouseEvent) => void
    disabled: boolean
  }): any
}>()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)

const emit = defineEmits<{
  /** The selected value changed; `null` (or `[]` with `multiple`) after clearing. */
  'update:modelValue': [value: SelectValue | SelectValue[] | null]
}>()

const { t, tp } = useUiT()
const withTags = computed(() => props.multiple && props.tags)
const withPicks = computed(() => props.multiple && Boolean(seen.picks))
// Picks that stand below the field, as tags or as the app's rows.
const below = computed(() => withTags.value || withPicks.value)
// Picks the app draws only once there is one (`<template v-if="model.length" #picks>`) make room
// below the field when they come: the field is drawn anew and its button with it. A focus that was
// in the field is given back to the button, so the keys go on with the list; a focus that moved
// elsewhere stays there.
let focusInField = false
onBeforeUpdate(() => {
  focusInField = Boolean(capsuleRef.value?.contains(document.activeElement))
})
onUpdated(() => {
  if (!focusInField) return
  focusInField = false
  const at = document.activeElement
  if (!at || at === document.body) triggerRef.value?.focus()
})
// With `multiple` the field and its tags stand in one box that takes the caller's class and style;
// alone the capsule is the root, so a UiButtonGroup joins it as one of its controls.
const Root = capsuleRoot(
  () => below.value,
  () => ({ class: ['inline-flex flex-col gap-2', rootClass.value], style: rootStyle.value }),
)
const generated = useId()
const {
  field,
  id: triggerId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(() => ({
  id: props.id ?? generated,
  invalid: props.invalid,
  required: props.required,
}))
const listboxId = `${generated}-list`
const optionId = (index: number) => `${generated}-${index}`
const { rootClass, rootStyle, control } = useSplitAttrs()
// The form its `form` attribute names gets the hidden inputs too, as a native control's value.
const formId = computed(() => control.value.form as string | undefined)
const capsule = computed(() => triggerCapsuleClass(ladder.value, props.disabled, isInvalid.value))
// Ours win only where set: a caller's `aria-invalid` or `aria-required` stays when we have none.
const bound = computed(() =>
  ownWhereSet(control.value, {
    id: triggerId.value,
    'aria-label': props.ariaLabel,
    'aria-controls': open.value ? listboxId : undefined,
    // With a filter the filter points at the highlight; the trigger does not too.
    'aria-activedescendant': open.value && !hasSearch.value ? activeId.value : undefined,
    ...aria.value,
  }),
)

const isGroup = (item: SelectItem): item is Extract<SelectItem, { options: unknown }> =>
  'options' in item
const hasSearch = computed(() => props.searchable || Boolean(props.fetcher))

// A server answers the filter; the answer replaces the list. A late answer to an
// older query is dropped, so typing fast never shows results for a stale word.
// The request in flight goes stale the moment the query changes, not when the next
// one starts: an answer landing within the 250 ms wait would otherwise show for the
// new word. Through the wait the previous options stay in view, dimmed and busy, and a
// click can still pick one: they are real options, only not yet narrowed. Enter picks none
// of them then: the highlight it would take stands on an answer to an older word.
const remote = ref<SelectItem[]>([])
const fetching = ref(false)
const failed = ref(false)
let fetchSeq = 0
let fetchQuery: string | null = null
let fetchTimer: ReturnType<typeof setTimeout> | undefined
async function runFetch(q: string) {
  const fetcher = props.fetcher
  if (!fetcher) return
  const seq = ++fetchSeq
  fetchQuery = q
  fetching.value = true
  failed.value = false
  try {
    const result = await fetcher(q)
    if (seq !== fetchSeq) return
    remote.value = result
  } catch {
    if (seq !== fetchSeq) return
    remote.value = []
    failed.value = true
  } finally {
    if (seq === fetchSeq) fetching.value = false
  }
}
const scheduleFetch = (q: string, delay = 250) => {
  clearTimeout(fetchTimer)
  if (q !== fetchQuery) {
    fetchSeq++
    fetchQuery = q
    fetching.value = true
    failed.value = false
  }
  fetchTimer = setTimeout(() => void runFetch(q), delay)
}
onBeforeUnmount(() => clearTimeout(fetchTimer))
// The options are on their way: asked by the select's own `fetcher`, or passed by the app with
// `loading`, which a `fetcher` ignores: it says its own. With none yet the list draws their
// shape; with options in view they stay, dimmed.
const busy = computed(() => fetching.value || (!props.fetcher && props.loading))
// Said while the list is open: a search for a `fetcher`, the first options or a refresh, and once
// nothing is on its way, no match or a failure, as the note under the list says them.
const statusWords = computed(() => {
  if (!open.value) return ''
  if (busy.value)
    return props.fetcher
      ? t('grani.select.searching')
      : nothingYet.value
        ? t('grani.select.loading')
        : t('grani.select.updating')
  if (options.value.length) return ''
  return failed.value ? t('grani.select.failed') : emptyWords.value
})

const sourceItems = computed<SelectItem[]>(() => (props.fetcher ? remote.value : items.value))
const flatten = (items: SelectItem[]) =>
  items.flatMap((item) => (isGroup(item) ? item.options : [item]))
// The picked options stay known after the server answers another query: their labels must not vanish.
const known = ref(new Map<SelectValue, SelectOption>())
// One option per value, the first one listed: a value in two groups is selected, labeled and
// sent as one. `items` stays known next to a server's answer, so a prefilled value keeps its label.
const allOptions = computed<SelectOption[]>(() => {
  const byValue = new Map<SelectValue, SelectOption>()
  for (const o of [...flatten(sourceItems.value), ...known.value.values(), ...flatten(items.value)])
    if (!byValue.has(o.value)) byValue.set(o.value, o)
  return [...byValue.values()]
})
const selectedValues = computed<SelectValue[]>(() =>
  Array.isArray(props.modelValue)
    ? props.modelValue
    : props.modelValue == null
      ? []
      : [props.modelValue],
)
const isSelected = (o: SelectOption) => selectedValues.value.includes(o.value)
const optionOf = (v: SelectValue) => allOptions.value.find((o) => o.value === v)
// An empty string no option has is the common way of saying "nothing yet": nothing picked, as `null`.
const strangers = computed(() => selectedValues.value.filter((v) => v !== '' && !optionOf(v)))
// A picked value whose option the app is still loading: drawn as a load, and sent as it is, so a
// form saved meanwhile keeps it.
const pendingValue = computed(() => busy.value && strangers.value.length > 0)
// In the order of the model, which is the order they were picked in. Once nothing is on its way, a
// value no option knows is an option of its own text: the form holds it, so the field shows it.
const selectedOptions = computed(() =>
  selectedValues.value.flatMap(
    (v) => optionOf(v) ?? (v === '' || pendingValue.value ? [] : [{ value: v, label: String(v) }]),
  ),
)
const selectedLabel = computed(() => selectedOptions.value.map((o) => o.label).join(', '))
// What the trigger shows: the picks' count with tags, else the picked labels or the placeholder.
const shownText = computed(() =>
  withPicks.value
    ? props.placeholder || t('grani.select.placeholder')
    : withTags.value && selectedOptions.value.length
      ? tp('grani.select.selected', selectedOptions.value.length)
      : selectedLabel.value || props.placeholder || t('grani.select.placeholder'),
)
// Nothing to show yet, filter or not: no option has come at all. A filter that narrows the options
// in view to none is "no match", not a first load.
const nothingYet = computed(() => flatten(sourceItems.value).length === 0)
const sentValues = computed(() =>
  pendingValue.value ? selectedValues.value : selectedOptions.value.map((o) => o.value),
)
// Once per app and value, in the browser: a table of selects holding one stale value says it once.
if (isDev()) {
  const app = getCurrentInstance()?.appContext.app
  onMounted(() =>
    watch(
      () => (pendingValue.value ? [] : strangers.value),
      (values) => {
        for (const v of values)
          warnOnce(
            app,
            `UiSelect:${JSON.stringify(v)}`,
            `[grani] UiSelect holds the value ${JSON.stringify(v)}, which none of its options has: it shows the value as it is. Pass its option in \`items\`, or \`loading\` while the options are on their way.`,
          )
      },
      { immediate: true },
    ),
  )
}
// A picked option is known for its label only while it is picked: one the owner let go is forgotten.
watch(selectedValues, (values) => {
  for (const value of known.value.keys()) if (!values.includes(value)) known.value.delete(value)
})

const query = ref('')
// No match is an answer to a search; a list nobody searched that holds nothing has no options.
const emptyWords = computed(() =>
  query.value.trim() ? t('grani.select.empty') : t('grani.select.noOptions'),
)
// The server has already filtered its answer; only a local list is narrowed here.
const matches = (o: SelectOption) => {
  if (!props.searchable || props.fetcher) return true
  const q = searchText(query.value.trim())
  return (
    searchText(o.label).includes(q) || Boolean(o.keywords && searchText(o.keywords).includes(q))
  )
}

// A single pick from a local list: the text stands over the longest labels and the placeholder,
// so a pick never widens the field. Length stands in for width; three are enough to cover it.
const sizers = computed(() => {
  if (props.multiple || props.fetcher) return []
  const labels = items.value.flatMap((i) => ('options' in i ? i.options : [i])).map((o) => o.label)
  const longest = [...new Set(labels)].sort((a, b) => b.length - a.length).slice(0, 3)
  return [...new Set([...longest, props.placeholder || t('grani.select.placeholder')])]
})

type Row =
  | { kind: 'group'; key: string; label: string }
  | { kind: 'option'; key: string; index: number; option: SelectOption }

// One flat index across groups: the keyboard walks it, the ids name it.
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  let index = 0
  for (const item of sourceItems.value) {
    if (isGroup(item)) {
      const visible = item.options.filter(matches)
      if (!visible.length) continue
      out.push({ kind: 'group', key: `g:${item.label}`, label: item.label })
      // The same value may appear in two groups ("Other" per category): the key carries the group.
      for (const option of visible)
        out.push({
          kind: 'option',
          key: `o:${item.label}:${String(option.value)}`,
          index: index++,
          option,
        })
    } else if (matches(item)) {
      out.push({ kind: 'option', key: `o:${String(item.value)}`, index: index++, option: item })
    }
  }
  return out
})
const options = computed(() => rows.value.flatMap((r) => (r.kind === 'option' ? [r.option] : [])))

const open = ref(false)
const listboxRef = ref<HTMLElement | null>(null)
// The highlight, the arrows past a disabled option, the letters, the option kept in view.
const { active, firstEnabled, move, keys, typeAhead, resetTypeAhead, scrollToActive, typing } =
  usePanelList({
    items: () => options.value,
    disabled: (o) => Boolean(o.disabled),
    label: (o) => o.label,
    row: (i) => (i >= 0 ? document.getElementById(optionId(i)) : null),
    list: () => listboxRef.value,
    typeAhead: 'first',
  })
const activeId = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))
// The deps of the template's `v-memo`: `row.index` stands for the row's id and its place in the
// keyboard order, which a narrower search can shift even when the option itself did not change.
const rowMemo = (row: Row) =>
  row.kind === 'group'
    ? [row.label]
    : [
        row.index,
        row.index === active.value,
        isSelected(row.option),
        row.option.disabled,
        row.option.label,
        row.option.description,
        props.multiple,
      ]
const capsuleRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const { maxHeight: listHeight } = useVisibleRows(listboxRef, '[role=option]', () => [
  open.value,
  rows.value.length,
])

const close = () => {
  open.value = false
}

// A list that loads never shrinks while it is open: a server's narrower answer, no match, a failure,
// or the app's options coming in under the rows that stood for them keep the height it reached, so
// the panel and what it covers stand still. It is let go on close.
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-3/5', 'w-1/2']
const held = ref(0)
// The app's load holds the height once it has been seen while open.
const loadSeen = ref(false)
watch([open, busy], ([is, loading]) => {
  if (!is) loadSeen.value = false
  else if (loading) loadSeen.value = true
})
watch(
  [open, rows, busy, failed],
  () => {
    if (!(props.fetcher || loadSeen.value) || !open.value) return
    const height = listboxRef.value?.offsetHeight ?? 0
    if (height > held.value) held.value = height
  },
  { flush: 'post' },
)
watch(open, (is) => {
  if (!is) held.value = 0
})
// Never past the list's own cap of five rows and a half: a min-height would beat it.
const heldHeight = computed(() =>
  listHeight.value ? `min(${held.value}px, ${listHeight.value})` : `${held.value}px`,
)
// The capsule is the anchor: the panel is as wide as what the eye sees as the
// control, and a click on the clear button beside the trigger is not "outside".
const { panelStyle, reposition, rect } = useAnchoredPanel({
  open,
  trigger: capsuleRef,
  panel: panelRef,
  close,
  // Escape reaches the list through the overlay stack, only while it is the top layer: it closes
  // and gives the focus back to the trigger, and a window under it stays.
  onEscape: () => hide(),
  matchTriggerWidth: true,
})
// The panel is `visibility: hidden` until it is positioned, and a hidden input
// refuses focus: the filter takes focus once the first position has reached the
// DOM (`post`: a `pre` watcher runs before the style is patched, and the focus is lost).
watch(
  rect,
  (now, before) => {
    if (!now || before || !open.value || !hasSearch.value) return
    // The panel turns visible in this pass and may refuse the focus for a few frames: it is given
    // frame by frame, never over a focus the person moved (utils/giveFocus).
    giveFocus(
      () => searchRef.value,
      () => open.value,
    )
  },
  { flush: 'post' },
)

const show = async () => {
  if (props.disabled || open.value) return
  query.value = ''
  resetTypeAhead()
  open.value = true
  if (props.fetcher) void runFetch('')
  const current = options.value.findIndex((o) => isSelected(o) && !o.disabled)
  active.value = current >= 0 ? current : firstEnabled(0, 1)
  await nextTick()
  scrollToActive()
}
const hide = () => {
  if (!open.value) return
  open.value = false
  resetTypeAhead()
  triggerRef.value?.focus()
}
// A list that closes, however it closes (a pick, Escape, Tab, a press outside, turned off), asks
// the server nothing more: a search waiting for its pause is dropped and an answer on its way let
// go, so the closed field shows its value, not a load.
watch(open, (is) => {
  if (is) return
  clearTimeout(fetchTimer)
  if (fetching.value) {
    fetchSeq++
    fetching.value = false
  }
  fetchQuery = null
})
const toggle = () => (open.value ? hide() : show())
// A select turned disabled while open closes, so no pick lands after. The focus was on the
// trigger or in the panel, both about to be disabled or gone: it rests on the capsule
// (tabindex -1, no ring), so Tab goes on from the field and not from the body.
watch(
  () => props.disabled,
  (d) => {
    if (!d) return
    const held =
      open.value ||
      capsuleRef.value?.contains(document.activeElement) ||
      panelRef.value?.contains(document.activeElement)
    open.value = false
    resetTypeAhead()
    if (held) nextTick(() => capsuleRef.value?.focus())
  },
)

const pick = (option: SelectOption | undefined) => {
  if (!option || option.disabled) return
  known.value.set(option.value, option)
  if (props.multiple) {
    const next = isSelected(option)
      ? selectedValues.value.filter((v) => v !== option.value)
      : [...selectedValues.value, option.value]
    emit('update:modelValue', next)
    return
  }
  emit('update:modelValue', option.value)
  hide()
}
// A tag's cross leaves the DOM with its tag: the focus moves to the next tag, or the field.
// The next tag slides under the pointer: the second click of a double click (`detail` 2) lands on
// its cross and is held back. A key's click (`detail` 0) and the app's `remove` always land.
async function unpick(option: SelectOption, e?: MouseEvent) {
  if (props.disabled || (e && e.detail > 1)) return
  const at = selectedOptions.value.indexOf(option)
  emit(
    'update:modelValue',
    selectedValues.value.filter((v) => v !== option.value),
  )
  await nextTick()
  if (withPicks.value) return triggerRef.value?.focus()
  const crosses = [
    ...(capsuleRef.value?.parentElement?.querySelectorAll<HTMLElement>('[data-tag] button') ?? []),
  ]
  ;(crosses[Math.min(at, crosses.length - 1)] ?? triggerRef.value)?.focus()
}

// The cross leaves with the value: the focus goes to the field, not to the page.
const clear = () => {
  emit('update:modelValue', props.multiple ? [] : null)
  if (open.value) hide()
  else triggerRef.value?.focus()
}

// A search with text clears itself, as every search of the library does: the cross, or Escape;
// the focus stays in the field, and an Escape that cleared does not close the panel.
function clearQuery() {
  query.value = ''
  searchRef.value?.focus()
}
// A failed search is asked again as it stands, and the focus stays in the filter.
function retry() {
  clearTimeout(fetchTimer)
  void runFetch(query.value)
  searchRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  // The Enter or the key that confirms an IME candidate belongs to the composition.
  if (isImeKey(e)) return
  const inSearch = e.target === searchRef.value
  if (!open.value) {
    // Backspace takes back the last pick in view, as in a field of tags.
    const last = selectedOptions.value.at(-1)
    if (e.key === 'Backspace' && props.multiple && last) {
      e.preventDefault()
      emit(
        'update:modelValue',
        selectedValues.value.filter((v) => v !== last.value),
      )
      return
    }
    // The repeats of the Enter that picked land here, the list closed: they open nothing.
    if (isHeldPress(e)) return e.preventDefault()
    // Alt with an arrow opens the list, as a native select does; another chord is the browser's.
    if (e.ctrlKey || e.metaKey || (e.altKey && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return
    if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(e.key)) {
      e.preventDefault()
      void show().then(() => {
        if (e.key === 'End') move(firstEnabled(options.value.length - 1, -1))
      })
    } else if (e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
      // With a filter the letter starts it: the filter takes the focus after the open, too late
      // to receive the key itself.
      if (hasSearch.value) {
        e.preventDefault()
        void show().then(() => (query.value = e.key))
      } else
        void show().then(() => {
          // A letter on the closed field finds the first label that starts with it: the highlight
          // the opening put on the chosen option is not one the person moved.
          const was = active.value
          active.value = -1
          typeAhead(e.key)
          if (active.value < 0) active.value = was
        })
    }
    return
  }
  if (keys(e, inSearch)) return
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      // A held Enter picks once: its repeats would tick and untick the same option.
      if (e.repeat) break
      // Until the answer to the typed text comes, the rows in view answer an older one.
      if (props.fetcher && fetching.value) break
      if (active.value >= 0) pick(options.value[active.value])
      else if (failed.value) retry()
      break
    case ' ':
      if (inSearch) return
      e.preventDefault()
      if (e.repeat) break
      // A Space within a word typed over the list belongs to it: "new j" goes on to New Jersey.
      if (typing()) typeAhead(' ')
      else if (active.value >= 0) pick(options.value[active.value])
      break
    case 'Tab':
      // The filter input lives at the end of body; focus returns to the trigger
      // before the native Tab moves on, so it lands on the next field of the form.
      hide()
      break
    case 'Escape':
      if (inSearch && query.value) {
        e.preventDefault()
        e.stopPropagation()
        clearQuery()
      }
      break
    default:
      if (!inSearch && e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) typeAhead(e.key)
  }
}

// A narrowed list re-anchors: its height changed, it may need to flip.
watch(query, (q) => {
  // The opening asked for '' already: setting the empty filter on reopen asks nothing more.
  if (props.fetcher && open.value && q !== fetchQuery) scheduleFetch(q)
  // A local filter narrows options already in: the height a load held is let go, so the list
  // shrinks to its rows again.
  if (!props.fetcher && !busy.value) {
    held.value = 0
    loadSeen.value = false
  }
  active.value = firstEnabled(0, 1)
  void reposition()
})
// The highlight follows its option, not its place: a server's answer, or the app's refreshed
// `items`, can reorder or shorten the list. A local search is left to the query watcher, which puts
// it on the first match.
let filteredBy = ''
watch(options, (next, prev) => {
  if (!props.fetcher && query.value !== filteredBy) {
    filteredBy = query.value
    return
  }
  const was = prev?.[active.value]
  const same = was ? next.findIndex((o) => o.value === was.value && !o.disabled) : -1
  const picked = next.findIndex((o) => isSelected(o) && !o.disabled)
  active.value = same >= 0 ? same : picked >= 0 ? picked : firstEnabled(0, 1)
})
watch(rows, () => void reposition())

defineExpose({ focus: (options?: FocusOptions) => triggerRef.value?.focus(options) })
</script>
