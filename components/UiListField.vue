<!--
  UiListField: one field that searches a UiList of UiListItem rows and adds to it. Take it when a list
  level holds only a list, such as a step of UiCrudDrawer.

  Layout. It is a behavior laid over a UiList of UiListItem rows. The field is the first row of a
  framed card, and the rows run under it, in a UiList the field draws round the slot.

  Search. Typing filters. The default slot gets the `query` (and the names `added` here, to put
  on top) and draws the matching rows, each with UiListItem `highlight`, so the typed letters show
  why a row was found. The row named exactly as typed, else the first match, is ready for Enter
  and marked with a band. Enter opens a row that is a button or a link; under plain rows it adds
  the text, so a name added by mistake is offered back with Undo in a toast, by the app.

  Adding. When no name in `existing` matches the text exactly, an "Add ↵" button stands at the
  field's end beside the cross (a screen reader hears "Add …" with the name), and Enter adds the
  text. A pasted column adds every line.

  Full list. A full list hides the field and shows a line that says so; the focus moves to that
  line.

  Items. Every item goes through `useAddItems` (`split`, `fix`, `check`, `limit`, and a request
  that gives the text back when it fails), and a line under the field says what happened. The items
  leave by `@add`, as UiLog's older events come by `@more`: the handler sends them, and until the
  promise it returns settles a second Enter or Add sends nothing; the person can keep typing. A
  promise that never settles holds the field until it unmounts: give the request a timeout.

  Glyph. The icon at the start of the field shows its state: a search icon at rest, a spinner
  while an item is being added, and an alert after a failure or a bad item, until the text
  changes. A repeat only gets the line.

  Add only. With `search` off the field only adds: a plus replaces the search icon, Enter adds,
  and the list is not filtered. Take it for a short list inside a form, with every row in view.

  Value. The list's rows are the value, and they belong to the caller: it draws them in the slot,
  names them in `existing` and adds to them in `@add`, after its request. Repeats and `limit` are
  counted from `existing`, so it holds the new names by the time the request's promise settles; a
  name put there later can be added twice. The component holds no list of its own, so it takes no
  `v-model` of one. The field's text is a draft, `v-model:query`,
  not a form value; it follows its model after the owner refuses a change and after a form reset.
  A draft refused by `check` reads as invalid to a screen reader, yet a Save around it goes: it
  is not the form's to fix.

  Draft. The text goes with its level: in UiCrudDrawer, ‹ and the backdrop step up and drop it.
  To keep it, hold the level `persistent` while `query` is not empty: ‹ and the backdrop shake
  instead until the text is added or cleared. The footer's Back and the cross are the explicit
  ways out, and they still leave.

  Field. Inside `UiField group` the legend names it once and says "required" once (the draft
  itself is never required); the field's description and error describe it. A plain UiField
  label points at its input, and a required one marks it `aria-required`.

  Attributes. `disabled` blocks the field, Add and the cross. Caller attributes land on the
  input, and ours only where we have one. `required` and `name` would be the draft's: the browser
  would refuse an empty draft and post it. Leave them off; a required list is UiField's.

  Keyboard.
  Typing filters.
  - `ArrowDown` `ArrowUp`: move the band over the matches, past the last one to "Add ↵", and round
    again, while the cursor stays in the field; with Shift, Alt, Ctrl or Cmd held they are the
    browser's.
  - `Enter`: opens the row under the band, or adds the typed text when no row is there; never
    submits the form around it.
  - `Cmd+Enter` `Ctrl+Enter`: the form's, as in any field: a record's form around the field
    saves, without the draft.
  - `Escape`: empties the field, or clears the line under it, and stops there; on an empty field
    it passes to the host.
  The cross and Add keep the focus in the field, from the keyboard too. When a row with the focus
  in it is removed, the focus moves to its neighbor; when the list fills up under the focus, the
  focus moves to the line that says so.

  Reader.
  - Field: named by `ariaLabel`, else by the placeholder, by a plain UiField's label or by a
    group's legend.
  - Line under it: what happened to an item, or a full list; an alert that describes the field.
  - Enter hint: a live region says what `Enter` would do: open the named row, add the typed name,
    or that an item is on its way.
  - Buttons: "Add" is named with the typed name, and the cross has a name.
  - Errors: inside UiField the description and the error describe it, and a refused item sets
    `aria-invalid`.

  States. At rest with a search icon (a plus with `search` off), typing with the band on the first
  match and "Add ↵" at the end, adding (a spinner; Enter waits, typing goes on), refused (an alert
  icon and the line, until the text changes), a repeat (the line only), empty (a line saying how
  to start), nothing matching ("Add ↵" alone), full (no field, the line says so), and disabled (the
  field and the cross blocked, on the plate, no Add).

  Not for.
  - A list with a toolbar and pages: UiDataTable.
  - Picks from a fixed set: UiSelect `multiple`.
  - One text value: UiInput.
  - Rows that nobody adds here: UiListItem rows in a UiList.
-->
<template>
  <UiCard :padded="false" :class="rootClass" :style="rootStyle">
    <div
      v-if="!full"
      class="ui-add-row flex items-center gap-2 border-border transition-colors duration-fast ease-standard"
      :class="[
        lined || note || overflow ? 'border-b' : '',
        pad,
        rowSize === 'md' ? 'h-14' : 'h-11',
        disabled ? 'bg-disabled-bg text-disabled-fg' : 'focus-within:bg-surface-muted',
      ]"
    >
      <!-- One place says the field's state: a search at rest, the spinner while adding, an alert after a failure. -->
      <!-- Said by the live region below, which stays in the DOM: a status that mounts with its words goes unheard. -->
      <UiSpinner v-if="busy" class="h-4 w-4 shrink-0 text-fg-muted" />
      <CircleAlert
        v-else-if="note?.danger"
        aria-hidden="true"
        class="h-4 w-4 shrink-0 text-danger-subtle-fg"
      />
      <Search v-else-if="search" aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-subtle" />
      <Plus v-else aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-subtle" />
      <input
        ref="inputRef"
        type="text"
        enterkeyhint="done"
        autocomplete="off"
        v-bind="bound"
        :value="display(text)"
        :disabled="disabled"
        :placeholder="placeholder || hint"
        class="h-7 min-w-0 flex-1 bg-transparent text-sm/5.5 text-fg placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed disabled:text-disabled-fg"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
        @input="onInput"
        @keydown="onKey"
        @paste="onPaste"
      />
      <button
        v-if="offer && !disabled"
        type="button"
        :aria-label="t('grani.listField.add', { name: query })"
        class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-control bg-brand-subtle px-2 text-xs/4.5 font-medium text-brand-subtle-fg transition-colors duration-fast ease-standard enabled:hover:bg-brand-subtle/70 [&_svg]:h-3.5 [&_svg]:w-3.5"
        :class="[
          controlHeightClass.xs,
          search && rowCount && active === rowCount
            ? 'outline-2 outline-offset-1 outline-brand'
            : '',
        ]"
        @mousedown.prevent
        @click="add"
      >
        {{ t('grani.listField.addShort') }}<CornerDownLeft aria-hidden="true" />
      </button>
      <UiIconButton
        v-if="text && !disabled"
        :icon="X"
        :ariaLabel="t('grani.listField.clear')"
        size="xs"
        variant="ghost"
        class="-me-[0.4375rem]"
        @mousedown.prevent
        @click="clear"
      />
    </div>
    <p
      v-if="note || overflow || full"
      :id="noteId"
      ref="noteRef"
      tabindex="-1"
      role="alert"
      class="border-border py-2 text-xs/4.5 focus:outline-hidden"
      :class="[
        lined ? 'border-b' : '',
        pad,
        note?.danger ? 'text-danger-subtle-fg' : 'text-fg-muted',
      ]"
    >
      {{ noteText }}
    </p>
    <!-- A control in a row is the row's, not the field's: hidden round the list, not the slot, since
         the list gives each row of the slot its own item. -->
    <NoField>
      <!-- The band on the row Enter would open: set on the row itself, since the rows are the slot's.
           It is the panel list's active row (PANEL_LIST_ACTIVE), its bar a border forced colors keep. -->
      <UiList
        ref="listRef"
        class="[&_[data-active]]:relative [&_[data-active]]:bg-surface-muted [&_[data-active]]:before:absolute [&_[data-active]]:before:inset-y-0 [&_[data-active]]:before:start-0 [&_[data-active]]:before:border-s-[3px] [&_[data-active]]:before:border-s-brand"
        @focusin="hold"
        @focusout="letGo"
      >
        <slot :query="search && !full ? query : ''" :added="added" />
        <UiListItem
          v-if="!existing.length && !query"
          :size="rowSize"
          :description="empty || t('grani.listField.empty')"
        />
      </UiList>
    </NoField>
    <span class="sr-only" role="status" aria-live="polite">{{ enterSays }}</span>
  </UiCard>
</template>

<script setup lang="ts">
import { isImeKey } from '../utils/ime'
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useId,
  watch,
} from 'vue'
import { CircleAlert, CornerDownLeft, Plus, Search, X } from '@lucide/vue'
import { useAddItems } from '../composables/useAddItems'
import { tabbables } from '../composables/useFocusTrap'
import { useUiT } from '../composables/useUiT'
import { useControlSize } from '../composables/useControlSize'
import type { ControlSize } from '../types/ui'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { useComposedValue, useFormReset } from '../utils/composition'
import { controlHeightClass } from '../utils/controlSize'
import { usePanelList } from '../utils/panelList'
import { NoField, useFieldControl } from '../utils/field'
import { callListeners } from '../utils/listeners'
import { SURFACE_GUTTER } from '../utils/surface'
import UiCard from './UiCard.vue'
import UiIconButton from './UiIconButton.vue'
import UiList from './UiList.vue'
import UiSpinner from './UiSpinner.vue'
import UiListItem from './UiListItem.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The hint in the empty field: "Find or add a subcategory". Defaults to "Find or add…". */
    placeholder?: string
    /** The field's name for a screen reader; defaults to the placeholder. */
    ariaLabel?: string
    /** The line of an empty list; defaults to "Nothing here yet: type a name and press Enter". */
    empty?: string
    /** Typing filters the list and Enter opens the first match. Off, the field only adds: a short list inside a form, where every row is in view. */
    search?: boolean
    /** The names in the list: an exact one, in any case, is found, not offered again. */
    existing?: string[]
    /** `lines`: a pasted list splits by line. `lists`: also by commas and semicolons, typed or pasted. */
    split?: 'lines' | 'lists'
    /** Tidies an item on its way in: `(s) => s.toLowerCase()`. A change is named under the field. */
    fix?: (item: string) => string
    /** Why an item cannot be, in the product's words, or nothing when it can. */
    check?: (item: string) => string | undefined
    /** The most the list holds, counted from `existing`: full, the field is gone. */
    limit?: number
    /** “Add …”, Enter or a pasted list (`@add`): the items, tidied, checked, without repeats. Return the request's promise to hold the field; a rejection gives the text back. Nothing returned, the field is not held. Put the new names into `existing` before the promise settles: repeats and `limit` are counted from it. */
    onAdd?: (items: string[]) => unknown
    /** Nothing can be typed, added or cleared: the field, Add and the cross are held, on the disabled plate. */
    disabled?: boolean
    /** Own id of the input when standalone. Inside UiField the field's id takes precedence. */
    id?: string
    /** Step of the field's row, as a list row's: 44 px at `xs` and `sm`, 56 at `md`. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  {
    placeholder: '',
    ariaLabel: '',
    empty: '',
    search: true,
    existing: () => [],
    split: 'lines',
    fix: undefined,
    check: undefined,
    limit: undefined,
    onAdd: undefined,
    disabled: false,
  },
)

/** The text in the field (`v-model:query`): what the list is filtered by, and what “Add …” adds. */
const text = defineModel<string>('query', { default: '' })

const emit = defineEmits<{
  /** A repeat was refused: the name as the list has it, to point at its row. */
  taken: [name: string]
}>()

defineSlots<{
  /** The rows that match `query`, UiListItem with `highlight`; `added` are the names added here, newest first, to put on top. */
  default(props: { query: string; added: string[] }): unknown
}>()

const { t, tp } = useUiT()
// A row of a list is 44 at `sm` and 56 at `md`; a 28px row is no row, so `xs` is `sm`.
const step = useControlSize(() => props.size)
const rowSize = computed(() => (step.value === 'md' ? 'md' : 'sm'))
const { rootClass, rootStyle, control } = useSplitAttrs()
const noteId = `ui-list-field-note-${useId()}`
// The field's description and error describe the input after our note; a refused item marks it invalid.
const {
  field,
  id: inputId,
  aria,
} = useFieldControl(() => ({ id: props.id, invalid: note.value?.invalid }), {
  before: () => [note.value || overflow.value ? noteId : undefined],
})
const listRef = ref<InstanceType<typeof UiList> | null>(null)
const listEl = () => listRef.value?.$el as HTMLElement | undefined
const inputRef = ref<HTMLInputElement | null>(null)
const noteRef = ref<HTMLElement | null>(null)
// The field's row keeps the inset of the rows under it: 12 among fields, the card's gutter else.
const outer = inject(SURFACE_GUTTER, null)
const pad = outer === 'drawer' || outer === 'overlay' ? 'px-3' : 'px-surface'

// The caller's own `aria-invalid` is the form's, as the field's error is.
const theirsInvalid = () => [true, 'true'].includes(control.value['aria-invalid'] as never)
// The field's words: a plain UiField label points at the input, a group's legend names it by id.
// Ours win only where set.
const bound = computed(() =>
  ownWhereSet(control.value, {
    id: inputId.value,
    'aria-labelledby': field?.group.value ? field.labelId.value : undefined,
    'aria-label': field?.labelId.value
      ? undefined
      : control.value['aria-label'] || props.ariaLabel || props.placeholder || hint.value,
    'aria-describedby': aria.value['aria-describedby'],
    'aria-invalid': aria.value['aria-invalid'],
    'aria-required': aria.value['aria-required'],
    // A refused draft is invalid to a screen reader, not to the form: a Save around it goes, and
    // focusInvalid passes it over. The field's own error stays the form's.
    'data-draft': note.value?.invalid && !field?.invalid.value && !theirsInvalid() ? '' : undefined,
  }),
)
// The input follows its model: a change the owner refuses is put back, so is a form reset.
const {
  display,
  onInput: onComposedInput,
  onCompositionStart,
  onCompositionEnd,
} = useComposedValue(
  (value) => (text.value = value),
  undefined,
  () => text.value,
)
useFormReset(inputRef, (el) => (el.value = text.value))

const added = ref<string[]>([])
// A native maxlength caps typing only; an item split from a paste is cut to it as well.
const maxLength = () => {
  const n = Number(control.value.maxlength ?? control.value.maxLength)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
const hint = computed(() =>
  t(props.search ? 'grani.listField.placeholder' : 'grani.addRow.placeholder'),
)
const { busy, note, overflow, full, find, pieces, submit, paste } = useAddItems(text, {
  maxLength,
  existing: () => props.existing,
  split: () => props.split,
  fix: () => props.fix,
  check: () => props.check,
  limit: () => props.limit,
  // An item counts as added here once its request is through; a failed one is not put on top.
  onAdd: () => (items: string[]) => {
    const run = callListeners(props.onAdd, items)
    const keep = () => (added.value = [...items, ...added.value])
    if (run) return run.then((v) => (keep(), v))
    keep()
  },
  onTaken: (name) => emit('taken', name),
  disabled: () => props.disabled,
})

const query = computed(() => text.value.trim())
// Offered while nothing in the list is named exactly so and there is room for it.
// Off, a repeat is still refused, by the add itself, with a line.
const offer = computed(
  () => Boolean(query.value) && (!props.search || !find(query.value)) && !full.value && !busy.value,
)

// The band: an index among the rows the slot drew, or the last for “Add …”; none without a query.
const rowCount = ref(0)
const rows = () =>
  Array.from(listEl()?.querySelectorAll<HTMLElement>('[data-row]') ?? []).filter((r) =>
    r.matches('button, a'),
  )
// The arrows go round the rows and “Add …”; the row under the band is kept in view where it stands.
const band = () => [...rows(), ...(offer.value ? [inputRef.value!] : [])]
const { active, keys, scrollToActive } = usePanelList({
  items: band,
  row: (i) => rows()[i],
  wrap: true,
})
active.value = 0
// A row is named by its title, not by its description and badges read on after it.
const title = (row: HTMLElement) => (row.querySelector('p') ?? row).textContent?.trim() ?? ''
// Until an arrow moves it, the band stands on the row named exactly as typed, else the first:
// "fruit" opens Fruit, not Fruit juice above it, and there is no Add to reach it by.
let steered = false
function paint() {
  const all = rows()
  rowCount.value = all.length
  if (!steered) {
    const name = find(query.value)?.toLowerCase()
    active.value = Math.max(0, name ? all.findIndex((r) => title(r).toLowerCase() === name) : 0)
  }
  const last = rowCount.value + (offer.value ? 1 : 0) - 1
  if (active.value > last) active.value = Math.max(0, last)
  all.forEach((r, i) => {
    const on = props.search && Boolean(query.value) && i === active.value
    r.toggleAttribute('data-active', on)
    if (on) scrollToActive()
  })
}
onUpdated(paint)
// The rows are the slot's, drawn inside UiList: a change to them alone (an array changed in place,
// rows that arrive after the query) redraws the list, never this field. The list's DOM is watched,
// so the band, the Enter hint and a dropped focus follow the rows whoever drew them.
const rowsTick = ref(0)
// A line under the field or its note only where rows stand under it: against the card's edge it
// would double the frame.
const lined = ref(true)
let rowsSeen: MutationObserver | undefined
onMounted(() => {
  const list = listEl()
  if (!list) return
  lined.value = list.children.length > 0
  rowsSeen = new MutationObserver(() => {
    rowsTick.value++
    lined.value = list.children.length > 0
    paint()
    recover()
  })
  // A row's text patched in place (an unkeyed row) is a change of its characters, not its children.
  rowsSeen.observe(list, { childList: true, subtree: true, characterData: true })
})
onBeforeUnmount(() => rowsSeen?.disconnect())
// A row removed with the focus in it drops the focus to the page; it goes to the row that took
// its place, the same control in it, else the row above, else the field.
let held: { el: HTMLElement; row: number; at: number } | null = null
function hold(e: FocusEvent) {
  const list = listEl()
  const el = e.target as HTMLElement
  const row = list ? Array.from(list.children).findIndex((r) => r.contains(el)) : -1
  if (row < 0) return
  held = { el, row, at: tabbables(list!.children[row] as HTMLElement).indexOf(el) }
}
// Focus that moved away on its own lets the row go; one whose row was removed is kept for the update.
function letGo(e: FocusEvent) {
  const to = e.relatedTarget as Node | null
  if (to && listEl()?.contains(to)) return
  const was = held
  setTimeout(() => {
    if (held === was && was?.el.isConnected) held = null
  })
}
function recover() {
  const was = held
  const at = document.activeElement
  if (!was || was.el.isConnected || (at && at !== document.body)) return
  held = null
  const list = Array.from(listEl()?.children ?? []) as HTMLElement[]
  const near = [list[was.row], list[was.row - 1]].map((r) => (r ? tabbables(r) : []))
  ;(near[0]![was.at] ?? near[0]![0] ?? near[1]![0] ?? inputRef.value)?.focus()
}
onUpdated(recover)
// The field goes when the list is full: the focus it held moves to the line that says so. When the
// list has room again the field comes back, and a focus on that line goes back into it.
watch(
  () => full.value,
  (now) => {
    const at = document.activeElement
    if (now && at === inputRef.value) void nextTick(() => noteRef.value?.focus())
    else if (!now && at && at === noteRef.value) void nextTick(() => inputRef.value?.focus())
  },
  { flush: 'pre' },
)
// What the line under the field says. A list that fills while a line stands says it is full too,
// unless the line already told what did not fit.
const noteText = computed(() => {
  const said = note.value?.text ?? overflow.value
  if (!full.value) return said
  const fullWords = tp('grani.listField.full', props.limit ?? 0, { limit: props.limit ?? 0 })
  if (!said) return fullWords
  return overflow.value && said.includes(overflow.value) ? said : `${said} ${fullWords}`
})
// A new query, typed or set by the owner, gives the band back to the exact name.
watch(query, () => (steered = false))
watch([active, query], () => void nextTick(paint))

const enterSays = computed(() => {
  void rowsTick.value
  if (busy.value) return t('grani.listField.adding')
  if (!query.value) return ''
  const row = rows()[active.value]
  const name = row ? title(row) : ''
  if (props.search && row && active.value < rowCount.value)
    return t('grani.listField.enterOpens', { name })
  return offer.value ? t('grani.listField.enterAdds', { name: query.value }) : ''
})

// Add and the cross leave the focus in the field: pressed from the keyboard, they go away under it.
function add() {
  if (props.disabled) return
  void submit(pieces(text.value, false), true)
  inputRef.value?.focus()
}
function clear() {
  text.value = ''
  note.value = null
  inputRef.value?.focus()
}
function onInput(e: Event) {
  onComposedInput(e)
  note.value = null
  active.value = 0
}
function onPaste(e: ClipboardEvent) {
  if (!props.disabled) paste(e)
}
function onKey(e: KeyboardEvent) {
  if (isImeKey(e) || props.disabled) return
  // With Shift an arrow selects text, and Cmd or Ctrl with Enter sends the form around the list
  // (a drawer's save): the browser's and the form's keys pass through.
  if (e.shiftKey && e.key.startsWith('Arrow')) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') return
  const arrow = e.key === 'ArrowDown' || e.key === 'ArrowUp'
  if (arrow && props.search && query.value && band().length) {
    steered = true
    keys(e)
  } else if (e.key === 'Enter') {
    // Enter never submits the form the list stands in, and a held one opens or adds once.
    e.preventDefault()
    if (e.repeat || !query.value) return
    if (props.search && active.value < rowCount.value) rows()[active.value]?.click()
    // With no row under the band to open, Enter adds: a repeat is refused by the add, with a line.
    else if (offer.value || !rowCount.value) add()
  } else if (e.key === 'Escape' && (text.value || note.value)) {
    e.preventDefault()
    e.stopPropagation()
    clear()
  }
}
</script>
