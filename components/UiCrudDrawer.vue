<!--
  UiCrudDrawer: a record opened for editing in a side panel, over the list it came from, laid over
  UiDrawer. Take it to edit a row opened from a UiDataTable without leaving the list.

  Surface. The panel is UiDrawer: its width, header, gutter, stack, scroll lock and focus kept in.
  The record adds the form round the body and the footer, Save and Cancel, the loading and the
  failed states, the steps of `path` and the walk through the list, and leads the exits: Escape
  and the backdrop go a level up at a step, the cross is refused while a level above holds input.

  Kept pages. In a page that a `KeepAlive` keeps, an open record stays open when the page is
  deactivated, as UiDrawer's panel does. Close it (`open` false) when the route changes.

  Keyboard.
  - `Enter`: in a single-line field, saves; in a text box it breaks the line.
  - `Meta+Enter` `Ctrl+Enter`: save from a text box too (`Meta` is Cmd).
  - `Escape`: closes, or goes one level up at a step; shakes instead while input is unsaved.
  - `Tab`: stays inside the panel.
  A refused save puts the focus on the first field in error. The up and down buttons in the header
  of the record walk the list when `index` and `total` are given. The focus goes to the first field once the record is in, and
  returns to the opener on close. It never lands on a button that sends a decision: on a level with
  no field, the panel takes it.

  Reader.
  - Window: a modal dialog named by the record's title (`aria-labelledby`).
  - Body: says it is loading (`aria-busy`); a refused save marks the field in error
    (`aria-invalid`).
  - Way up: at a step, a button named by the level above.
  - Refused way out: a close, a step or the list's arrows; a shake for the eye, and the reader keeps
    the focus where it was and hears why: input not saved, or a request still on its way.

  Not for.
  - A panel to read or to set at once, with no form: UiDrawer.
  - A short task that is not a record: UiModal.
  - A question about the record (delete it?): UiConfirm above the drawer.
  - A second drawer over the first: never; in UiCrudDrawer a record inside a record is a step of
    the same drawer (`path`).

  Header. `title` names the record ("Northwind Studio"). The small line under it (`description`, or
  a `#description` built from the library's parts) starts with the status as a small mark (UiBadge
  `inline` `sm`), then an id to copy (UiCopyButton `inline`), then a fact, cut when long and shown
  whole on hover. `#status` beside the title is for the rare record whose status is the point.
  `#actions` takes at most one icon button of your own, before the cross. With `index` and `total`
  (two records or more), ↑ and ↓ walk the list (`move`); they are refused while input is unsaved.
  The walk is the record's: at a step they are gone, since a level above may hold unsaved input, and
  the way up comes first.
  The parent loads the record; at the edge of a page it turns the list's page and keeps the opened
  row marked. At the end of the list, the arrow that can go no further hands the focus to the other
  arrow.

  Gutter. The drawer's: the body is padded by `--space-drawer` (24px, 16 in a dense product), and
  the lines inside it keep the same space.

  Body. The body is a form. After a refused save, Save is ready again as soon as the person moves to
  fix the field, whatever the control (a select fires no typing). The footer is pinned and holds
  Cancel and Save; with `saveAnother`, Save carries a menu with "Save and add another", for entering a batch
  of new records. That is why `submit` carries `{ another }` (true from "Save and add another": save, clear
  the form, keep the drawer open), where UiModal's `submit` carries nothing: a window sends one way.
  An action that sends a request by itself (delete, archive, a status) stays in the
  body: a card of UiListItem `as="button"` rows in a UiList after the fields, with the dangerous one last in
  `tone="danger"`. The body is a chain of UiCard sections, direct children of the slot, separated in
  one of two ways. By default a line stands between neighbors, and the sections need no titles.
  With `:divided="false"`, each section after the head of the record starts with a UiHeader
  `legend`, the line and the title in one, and the sections stand 48 apart, the step between blocks;
  a dev warning names a section without its legend. Do not put a form of your own in the slot.

  Delete. An action that takes the record from the list closes the drawer first, waits a tick
  (`await nextTick()`), then removes the row: a UiTable then hands the focus to the same control of
  the row now in its place. A delete asked through UiConfirm with an `action` does the same inside
  the action, so a Retry deletes too; the question gives the focus back to the drawer's row, and the
  table hands it to the row now in its place.

  States. `loading` shows a skeleton and holds Save; `#loading` gives one in the form's own
  geometry. A failed load (`error`) shows UiNoData `tone="danger"` with Retry in the body; the
  header keeps only the title, and Save is held. Pass `error` with the words and listen to `retry`.
  `submitting` spins Save and refuses every close. A submit the host refuses by marking a field as it gets it
  shakes the drawer, as a refused close does, and the focus goes to that field. `persistent` guards unsaved input on this level:
  the backdrop and Escape shake instead of closing. These guard only the drawer's own exits. A close
  from outside (`open` set to false, for example by the browser's Back on a deep link) is for the
  host to guard, before it changes `open`.

  Steps. A record with records inside opens them as steps of the same drawer, never as a second
  drawer. The parent swaps the body and the title and passes the levels above in `path`; the header
  shows a ‹ button named by the level above. ‹, Escape and the backdrop emit `back` with the level
  to go to, and Cancel goes one level up, so leaving a step never drops the input of a level above.
  A `persistent` step refuses with a shake. The cross closes the whole drawer; with
  `persistentAbove` (a level above holds unsaved input) it shakes instead. `error` works at a step
  as it does at the top. The focus goes to the first field of a new step, and back to its row on the
  way up. Each level has one job. A record is a form with a card of its actions (UiListItem
  `as="button" step` rows). What a record holds is a `readonly` list level (UiListField over the
  rows). A level that decides (a queue) is `readonly` with the verdict in the body, and a decline
  opens its note first. `readonly` keeps only the way back in the footer, and at the top level not
  even that. A path the header cannot name in one line needs a page instead.
-->
<template>
  <UiDrawer
    v-model:open="open"
    :title="title"
    :description="failed ? '' : description"
    :size="size"
    v-bind="$attrs"
  >
    <template v-if="$slots.description && !failed" #description>
      <slot name="description" />
    </template>
    <template v-if="walks || $slots.actions" #actions>
      <div v-if="walks" class="flex shrink-0 items-center">
        <UiIconButton
          ref="upRef"
          :icon="ChevronUp"
          :ariaLabel="t('grani.crudDrawer.previous')"
          variant="ghost"
          :disabled="index <= 0"
          @click="requestMove(Math.min(index, total) - 1)"
        />
        <UiIconButton
          ref="downRef"
          :icon="ChevronDown"
          :ariaLabel="t('grani.crudDrawer.next')"
          variant="ghost"
          :disabled="index >= total - 1"
          @click="requestMove(index + 1)"
        />
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center">
        <slot name="actions" />
      </div>
    </template>
    <!-- Always there, filled while the record loads: a region that appears with its text is
         announced unreliably. -->
    <span role="status" class="sr-only">{{ loading ? t('grani.crudDrawer.loading') : '' }}</span>
    <div v-if="loading" class="flex flex-col gap-drawer">
      <slot name="loading">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <div class="text-sm/5.5">
              <UiSkeleton class="inline-block h-3 w-1/4 align-middle" />
            </div>
            <UiSkeleton class="h-9 w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-sm/5.5">
              <UiSkeleton class="inline-block h-3 w-1/3 align-middle" />
            </div>
            <UiSkeleton class="h-9 w-full" />
          </div>
        </div>
      </slot>
    </div>
    <UiNoData
      v-else-if="failed"
      tone="danger"
      :title="t('grani.crudDrawer.loadFailed')"
      :description="error!"
      class="py-12"
    >
      <template #actions>
        <UiButton ref="retryRef" variant="secondary" @click="emit('retry')">{{
          t('grani.crudDrawer.retry')
        }}</UiButton>
      </template>
    </UiNoData>
    <!-- Parted by legends, the sections stand a block apart, 48: the legend leads its
         section and so takes no room of its own above it. -->
    <div v-else class="ui-sections flex flex-col" :class="divided ? 'gap-drawer' : 'gap-12'">
      <Sections />
    </div>
    <!-- A top level with no form has nothing to confirm and the cross already closes it: no footer. -->
    <template v-if="!readonly || path.length" #footer>
      <UiButton v-if="readonly" variant="secondary" @click="leave">
        {{ t('grani.crudDrawer.back', { name: path[path.length - 1]! }) }}
      </UiButton>
      <UiButton v-else variant="secondary" :disabled="submitting" @click="leave">
        {{ cancelLabel || t('grani.crudDrawer.cancel') }}
      </UiButton>
      <UiButton
        v-if="!readonly && !saveAnother"
        type="submit"
        :loading="submitting"
        :disabled="loading || submitDisabled || failed"
      >
        {{ submitLabel || t('grani.crudDrawer.save') }}
      </UiButton>
      <UiButtonGroup v-else-if="!readonly" :ariaLabel="t('grani.crudDrawer.save')" class="w-full">
        <UiButton
          type="submit"
          class="min-w-0 flex-1"
          :loading="submitting"
          :disabled="loading || submitDisabled || failed"
        >
          {{ submitLabel || t('grani.crudDrawer.save') }}
        </UiButton>
        <!-- Held while saving by onSubmit, not disabled: the plate stays one color. -->
        <UiMenu align="end">
          <template #trigger>
            <UiIconButton
              variant="primary"
              :icon="ChevronDown"
              :ariaLabel="t('grani.crudDrawer.saveMenu')"
              :disabled="loading || submitDisabled || failed"
            />
          </template>
          <UiListItem
            as="button"
            :title="t('grani.crudDrawer.saveAnother')"
            @click="onSubmit(true)"
          />
        </UiMenu>
      </UiButtonGroup>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  ref,
  shallowRef,
  useId,
  useSlots,
  watch,
  withKeys,
  withModifiers,
  type FunctionalComponent,
} from 'vue'
import { ChevronDown, ChevronLeft, ChevronUp } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { FIELD, tabbables } from '../composables/useFocusTrap'
import { useExits, useShake } from '../composables/overlaySurface'
import {
  leadsWithLegend,
  opensWithLegend as bodyOpensWithLegend,
  withLines,
} from './overlaySections'
import { useSubmitLock } from '../composables/useSubmitLock'
import { INVALID } from '../utils/focusInvalid'
import { flatSections } from '../utils/sections'
import {
  DRAWER_PARTS,
  DRAWER_PATTERN,
  type DrawerParts,
  type DrawerPattern,
} from '../utils/surface'
import UiButton from './UiButton.vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiCard from './UiCard.vue'
import UiDrawer from './UiDrawer.vue'
import UiIconButton from './UiIconButton.vue'
import UiNoData from './UiNoData.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiMenu from './UiMenu.vue'
import UiListItem from './UiListItem.vue'

// Attributes (`data-testid`, `aria-*`) land on the dialog, through the drawer.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The record's name, the dialog's name for a screen reader: "Santa", not "Edit operation". */
    title: string
    /** What the record is and a detail: "operation · 31 Aug". */
    description?: string
    /** The record is still loading: a skeleton in the body, Save held. */
    loading?: boolean
    /** Saving: a spinner on Save, Cancel held, and no way to close until it ends. */
    submitting?: boolean
    /** Save is held: nothing to save yet, or the form cannot be sent for a reason of your own; a load that failed is `error`. */
    submitDisabled?: boolean
    /** Unsaved input on this level: the backdrop and Escape are refused with a shake; Cancel and the cross still close. */
    persistent?: boolean
    /** At a step: a level above holds unsaved input. The cross, which closes them all, shakes instead; ‹, Escape and Cancel go one up as ever. */
    persistentAbove?: boolean
    /** Why the record could not be loaded, in words for the reader: the body says it with Retry (`retry`), the header keeps the title alone, Save is held and nothing is guarded. */
    error?: string | null
    /** Save's label; defaults to "Save". */
    submitLabel?: string
    /** A menu on Save with "Save and add another", for a batch of new records: the parent saves (setting `submitting` while it does), clears the form and keeps the drawer open; once the form changed from what was sent, the cursor goes to its first field, a default kept in it or not. */
    saveAnother?: boolean
    /** Cancel's label; defaults to "Cancel". */
    cancelLabel?: string
    /** The levels above this one, from the top: `['Groceries', 'Fruit']`. Set, the header shows ‹, named by the last. */
    path?: string[]
    /** The record's place in the list it was opened from, from 0, across its pages; with `total`, the header walks the list. */
    index?: number
    /** How many records the list holds: two or more, the header of the record shows ↑ ↓, which emit `move`; a step shows none. */
    total?: number
    /** Nothing on this level waits for Save, every row goes at once: the footer holds only the way back; at the top there is no footer, the cross closes. */
    readonly?: boolean
    /** A line between neighboring sections, the default; `false` parts them by their titles and the gap: a long form of different parts. */
    divided?: boolean
    /** The panel's width: `md` 512px for a record, the default; `lg` 768px for what reads wide, a text or a code. */
    size?: 'md' | 'lg'
  }>(),
  {
    description: '',
    loading: false,
    submitting: false,
    submitDisabled: false,
    persistent: false,
    persistentAbove: false,
    error: null,
    submitLabel: '',
    saveAnother: false,
    cancelLabel: '',
    path: () => [],
    index: 0,
    total: 0,
    readonly: false,
    divided: true,
    size: 'md',
  },
)

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** Save was pressed or Enter was hit in a single-line field; once per request. `another` is true from "Save and add another": save, then clear the form for the next record and keep the drawer open. */
  submit: [options: { another: boolean }]
  /** The drawer closed: Cancel, the cross, the backdrop or Escape. */
  close: []
  /** The way up was asked for: ‹, Escape, the backdrop or Cancel at a step. `to` is the index in `path` to show; the parent swaps the level. */
  back: [to: number]
  /** The up or down button in the header: `to` is the index of the record to show in the drawer; the parent loads it. */
  move: [to: number]
  /** Retry of a load that failed was pressed; the parent loads the record again. */
  retry: []
}>()

defineSlots<{
  /** The form: fields, or UiCard sections separated by the drawer. No `<form>` of your own. */
  default(props: Record<string, never>): unknown
  /** Beside the title, for a record whose status is the point; a status as usual is a small mark in `#description`. */
  status(props: Record<string, never>): unknown
  /** The small line under the title in your own markup, in place of `description`: an id to copy (UiCopyButton), facts. One line. */
  description(props: Record<string, never>): unknown
  /** Icon buttons before the cross: open as a page, more actions. Ghost UiIconButton. */
  actions(props: Record<string, never>): unknown
  /** While `loading`, a skeleton in the geometry of the form that comes, so nothing moves when it does; two fields by default. */
  loading(props: Record<string, never>): unknown
}>()

const { t } = useUiT()
const formId = `ui-drawer-form-${useId()}`
// The drawer's panel and body, handed to the form it renders for the record.
const parts = shallowRef<DrawerParts | null>(null)
const panelRef = computed(() => parts.value?.panel.value ?? null)
const bodyRef = computed(() => parts.value?.body.value ?? null)
const stepped = ref<'' | 'in' | 'out'>('')
const returns: number[] = []

// A separator between two neighboring sections.
const slots = useSlots()
// Without lines a section after the first legend is named by its own; one that has none blends in.
// A legend inside a component of the caller's own is not seen, as a section there gets no line.
// A body whose first section opens with a legend has its line already: the header draws none.
const opensWithLegend = () =>
  !props.loading && !failed.value && bodyOpensWithLegend(slots.default?.())
let legendWarned = false
const Sections = () => {
  const nodes = slots.default?.() ?? []
  if (props.divided) return withLines(nodes)
  if (isDev() && !legendWarned) {
    // The head of a record (its media, its verdict) may stand before the first legend.
    const named = flatSections(nodes)
      .filter((v) => v.type === UiCard)
      .map((v) => leadsWithLegend(v))
    if (named.some((n, i) => !n && named.slice(0, i).includes(true))) {
      legendWarned = true
      console.warn(
        '[grani] UiCrudDrawer: with `:divided="false"` a section starts with a UiHeader `legend`; one has none.',
      )
    }
  }
  return nodes
}

// One submit per request (useSubmitLock); which button asked, so its own spinner turns and the
// focus knows where to go when it ends.
const formRef = ref<HTMLFormElement | null>(null)
const another = ref(false)
// What the fields held when "Save and add another" was pressed. The parent clears the form when the
// save succeeds, so a form that changed was saved; one left as it was kept a save that failed. The
// first field alone cannot tell: it may keep a default (a currency) or be optional and empty.
let pressed: string[] = []
const fieldValues = () =>
  Array.from(bodyRef.value?.querySelectorAll<HTMLElement>(FIELD) ?? []).map((el) =>
    el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
      ? String(el.checked)
      : el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ? el.value
        : (el.getAttribute('aria-checked') ?? el.textContent ?? ''),
  )
const lock = useSubmitLock({
  body: bodyRef,
  form: formRef,
  submitting: () => props.submitting,
  canSubmit: () => !props.readonly && !props.loading && !props.submitDisabled && !failed.value,
  send: (next) => {
    another.value = next
    if (next) pressed = fieldValues()
    emit('submit', { another: next })
  },
  refused: () => refuse(),
})
const onSubmit = (next = false) => lock.submit(next)
const unlock = lock.unlock
const onMetaEnter = lock.onMetaEnter

// `explicit` is Cancel and the cross: they pass `persistent`, never `submitting`.
// A record that did not load holds nothing to lose: `persistent` guards input, not an error.
const failed = computed(() => !props.loading && Boolean(props.error))
const { shaking, refuse, said, hush } = useShake()
const { allows, requestClose } = useExits({
  open,
  closed: () => emit('close'),
  submitting: () => props.submitting,
  guarded: () => props.persistent && !failed.value,
  refuse,
})
// The cross closes every level: at a step, unsaved input above it refuses it as `persistent`
// refuses the backdrop here.
function requestCross() {
  if (props.path.length && props.persistentAbove) return refuse('unsavedAbove')
  requestClose(true)
}
// The arrows walk from the record, never from a step into what it holds: a level above may hold
// unsaved input, and the way up guards it.
const walks = computed(() => props.total > 1 && !props.path.length)
// Walking the list leaves this record: unsaved input or a request on its way refuse it, as ‹ does.
function requestMove(to: number) {
  if (to < 0 || to >= props.total) return
  if (allows(false)) emit('move', to)
}
// ‹ is the way up, not a way out: `persistent` refuses it as it does the backdrop.
function requestBack(to: number, explicit = false) {
  if (allows(explicit)) emit('back', to)
}
// Cancel at a step goes one up, on purpose: it drops what the step holds, as Cancel does at the top.
function leave() {
  if (props.path.length) requestBack(props.path.length - 1, true)
  else requestClose(true)
}
// At a step the backdrop and Escape go one level up: the unsaved input of a level above is not
// this level's `persistent`, and a close would drop it.
function exit() {
  if (props.path.length) requestBack(props.path.length - 1)
  else requestClose(false)
}

// The record laid over the side panel. The drawer keeps the panel, the stack, the page held still
// and the focus kept in; the record leads the exits, adds the way up and the status to the header,
// and wraps the body and the footer in its form.
const Lead: FunctionalComponent = () =>
  props.path.length
    ? h(UiIconButton, {
        icon: ChevronLeft,
        ariaLabel: t('grani.crudDrawer.back', { name: props.path[props.path.length - 1]! }),
        variant: 'ghost',
        class: 'rtl:[&_svg]:-scale-x-100',
        onClick: () => requestBack(props.path.length - 1),
      })
    : null
const Status: FunctionalComponent = () =>
  slots.status && !failed.value
    ? h('div', { 'data-grani': '', class: 'flex shrink-0 items-center gap-2' }, slots.status())
    : null
// Rendered inside the drawer, it is handed the drawer's panel and body.
const Form = defineComponent({
  setup(_, { slots: inner }) {
    parts.value = inject(DRAWER_PARTS, null)
    return () =>
      h(
        'form',
        {
          'data-grani': '',
          id: formId,
          ref: (el: unknown) => (formRef.value = el as HTMLFormElement | null),
          novalidate: true,
          'aria-busy': props.loading || undefined,
          onSubmit: withModifiers(() => onSubmit(), ['prevent']),
          onInput: unlock,
          onChange: unlock,
          onKeydown: withKeys(onMetaEnter, ['enter']),
        },
        inner.default?.(),
      )
  },
})
const drawer: DrawerPattern = {
  onOpen: () => {
    hush()
    unlock()
    returns.length = 0
    stepped.value = ''
  },
  exit,
  cross: requestCross,
  shaking,
  said,
  opensWithLegend,
  lead: Lead,
  status: Status,
  form: Form,
  body: () => ({
    key: props.path.length,
    class:
      stepped.value === 'in'
        ? 'ui-drawer-step-in'
        : stepped.value === 'out'
          ? 'ui-drawer-step-out'
          : '',
    onFocusin: unlock,
  }),
}
provide(DRAWER_PATTERN, drawer)

watch(
  () => props.submitting,
  (busy, was) => {
    if (!was || busy) return
    // The server's answer marked a field: the lock puts the cursor on it (useSubmitLock).
    nextTick(() => {
      // Saved to add another: a cleared form waits, the cursor in its first field. A field the
      // answer marked wins, a form left as it was sent means the save failed, and a person who
      // typed while the save was out keeps the cursor where they type.
      const next = another.value
      another.value = false
      if (!open.value || lock.typed()) return
      const first = bodyRef.value?.querySelector<HTMLElement>(FIELD)
      const now = next ? fieldValues() : []
      const cleared =
        now.some((v, i) => v !== pressed[i]) ||
        now.length !== pressed.length ||
        now.every((v) => v === '' || v === 'false')
      if (next && first && cleared && !bodyRef.value?.querySelector(INVALID)) first.focus()
    })
  },
)

// A step in remembers which row of the body had focus; the way up gives it back. Read before the
// body re-renders (a pre-flush watcher), when the row is still in the page.
watch(
  () => props.path.length,
  async (depth, was) => {
    if (!open.value || depth === was) return
    const body = bodyRef.value
    const at = body ? tabbables(body).indexOf(document.activeElement as HTMLElement) : -1
    stepped.value = depth > was ? 'in' : 'out'
    if (depth > was) while (returns.length < depth) returns.push(returns.length === was ? at : -1)
    const back = depth < was ? (returns[depth] ?? -1) : -1
    returns.length = Math.min(returns.length, depth)
    await nextTick()
    const next = bodyRef.value
    if (!next || props.loading) return panelRef.value?.focus()
    // Up, the row that opened the step; in, the first field, else the panel: never a button that
    // decides (Approve), where a held Enter would send it.
    const target = back >= 0 ? tabbables(next)[back] : next.querySelector<HTMLElement>(FIELD)
    ;(target ?? (back >= 0 ? tabbables(next)[0] : null) ?? panelRef.value)?.focus()
  },
)

// The arrow that reached the end of the list turns disabled under the focus: the focus goes to the
// other arrow, which still walks, not to the page.
const upRef = ref<{ $el?: HTMLElement } | null>(null)
const downRef = ref<{ $el?: HTMLElement } | null>(null)
// Read before the arrows re-render: a button turned disabled may drop the focus at once.
watch(
  () => [props.index, props.total] as const,
  async () => {
    const at = document.activeElement
    const on =
      at && at === upRef.value?.$el ? 'up' : at && at === downRef.value?.$el ? 'down' : null
    if (!on) return
    await nextTick()
    const up = upRef.value?.$el as HTMLButtonElement | undefined
    const down = downRef.value?.$el as HTMLButtonElement | undefined
    const mine = on === 'up' ? up : down
    const other = on === 'up' ? down : up
    if (mine && !mine.disabled) return
    ;(other && !other.disabled ? other : panelRef.value)?.focus()
  },
)

// Opened while loading, focus waits on the panel; the fields arrive, it moves to the first. A load
// that failed has none: Retry takes it, the button that was pressed if it was a Retry. A record with
// no field (read, not edited) keeps it on the panel, so a focus that fell to the page with the
// pressed row (a delete that went on to the next record) comes back into the drawer.
const retryRef = ref<{ $el?: HTMLElement } | null>(null)
watch(
  () => props.loading,
  async (busy) => {
    if (busy || !open.value) return
    await new Promise((r) => setTimeout(r))
    const panel = panelRef.value
    const at = document.activeElement
    // Only if focus still waits on the panel or fell to the page; never taken from the cross.
    if (!panel || (at !== panel && at !== document.body && at !== null)) return
    const target =
      panel.querySelector<HTMLElement>(FIELD) ?? (failed.value ? retryRef.value?.$el : null)
    ;(target ?? panel).focus()
  },
)
</script>
