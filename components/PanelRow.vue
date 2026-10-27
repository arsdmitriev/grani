<!--
  PanelRow: the row of a list in a panel or a sidebar, private to the library. It is an option of
  UiSelect, UiFilterList and UiDateRange, an item of UiMenu, and a place of UiAppShell's nav: the
  rows that run edge to edge across a panel (`utils/panelList`), lit as one band by the pointer and
  the arrows. A row of a page is UiListItem.

  Option. `purpose="option"` is a pick: a check box first (`box`) for several picks, the label and its
  description cut to one line each, a word at the end (`note`), and a check mark last (`mark`) for
  the one picked; `mark` false keeps the mark's place. A press on an option takes neither the
  focus nor a text selection; an option that is a button (`as="button"`, a row that opens a
  calendar) takes the focus as a button does.

  Command. `purpose="command"` is an item of a menu, drawn from the UiListItem command row the caller
  wrote: its title and description, `#media`, `#actions`, a `tone` as its ink, `loading` and
  `disabled`, and `step` as a chevron.

  Place. `purpose="place"` is a page of the app in a sidebar: a link 36px tall, lit while it is the
  current page (`aria-current="page"`), with no chevron.

  Keyboard. The host walks the rows (`usePanelList`): an option is highlighted while the focus stays
  in the field or on the list; a command takes the focus itself; a place is a link in the tab order.
  A `loading` or `disabled` command refuses the press in the capture phase.

  Reader. What the host makes it: an option (`role="option"`, selected and disabled said), a menu
  item, a link to a page with the current one marked. The marks and the chevrons are hidden; a
  place on another site says it opens a new tab.

  States. Rest, highlighted (the band and a bar of the brand at the start edge), disabled (the disabled ink, skipped by the keys), ticked or
  checked; a command loading (a spinner in place of its glyph), in a tone, a step; the current place.

  Not for. A row on a page, in a card or a drawer, which is UiListItem in a UiList.
-->
<template>
  <component
    :is="tag"
    data-grani
    :to="isLink ? to : undefined"
    :target="isLink ? resolved.target : undefined"
    :rel="isLink ? resolved.rel : undefined"
    :type="tag === 'button' ? 'button' : undefined"
    :disabled="tag === 'button' && purpose === 'command' && disabled && !loading ? true : undefined"
    :aria-disabled="purpose === 'command' && loading ? 'true' : undefined"
    :aria-busy="(purpose === 'command' && loading) || undefined"
    :data-focus="purpose === 'command' && tone === 'danger' ? 'danger' : undefined"
    :class="classes"
    v-bind="own"
    @click="emit('click', $event)"
  >
    <template v-if="purpose === 'option'">
      <slot name="start" />
      <span
        v-if="box !== undefined"
        aria-hidden="true"
        :class="[
          CHECK_MARK_BASE,
          checkMarkClass(box, disabled),
          active && !box ? 'border-control-border-hover' : '',
        ]"
      >
        <Check v-if="box" :class="CHECK_MARK_GLYPH" :stroke-width="CHECK_MARK_STROKE" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate">{{ label }}</span>
        <span v-if="description" class="block truncate text-xs/4.5 text-fg-muted">
          {{ description }}
        </span>
      </span>
      <span
        v-if="note"
        :id="noteId"
        class="shrink-0 text-xs/4.5 text-fg-muted"
        :class="numeric ? 'tabular-nums' : ''"
        >{{ note }}</span
      >
      <slot name="end">
        <Check
          v-if="mark !== undefined"
          aria-hidden="true"
          class="h-4 w-4 shrink-0 text-fg-muted"
          :class="mark ? '' : 'invisible'"
        />
      </slot>
    </template>
    <template v-else>
      <div
        v-if="$slots.media"
        class="flex shrink-0 items-center justify-center text-fg-muted [&>svg]:h-5 [&>svg]:w-5"
      >
        <slot name="media" />
      </div>
      <div class="min-w-0 flex-1">
        <slot>
          <p v-if="label" class="break-words text-sm/5.5 font-medium" :class="ink">
            {{ label }}
          </p>
          <p
            v-if="description"
            class="break-words"
            :class="[
              size === 'sm' ? 'text-xs/4.5' : 'text-sm/5.5',
              disabled && !loading ? 'text-disabled-fg' : 'text-fg-muted',
            ]"
          >
            {{ description }}
          </p>
        </slot>
      </div>
      <UiSpinner v-if="loading" class="shrink-0 text-fg-muted" />
      <div
        v-else-if="$slots.actions"
        class="flex shrink-0 items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>[data-bare=md]:last-child]:-me-3 [&>[data-bare=sm]:last-child]:-me-2.5 [&>[data-bare=xs]:last-child]:-me-[0.4375rem]"
        :class="tone ? '' : '[&>svg]:text-fg-subtle'"
      >
        <slot name="actions" />
      </div>
      <ChevronRight
        v-if="purpose === 'command' && step && !loading"
        aria-hidden="true"
        class="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-fast ease-standard group-[:is(:enabled,a):hover]:translate-x-0.5 rtl:-scale-x-100 rtl:group-[:is(:enabled,a):hover]:-translate-x-0.5"
      />
      <span v-if="isLink && resolved.newTab" class="sr-only">{{
        ' ' + t('grani.link.external')
      }}</span>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { Check, ChevronRight } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import {
  CHECK_MARK_BASE,
  CHECK_MARK_GLYPH,
  CHECK_MARK_STROKE,
  checkMarkClass,
} from '../utils/checkMark'
import { hasAddress, INSIDE_LINK, linkTarget } from '../utils/link'
import {
  NAV_ROW,
  PANEL_LIST_ACTIVE,
  PANEL_LIST_ROW,
  ROW_FOCUS,
  ROW_FOCUS_BAR_INK,
} from '../utils/panelList'
import { RouteLink } from '../utils/routeLink'
import type { RowSize } from '../utils/rowSize'
import UiSpinner from './UiSpinner.vue'

type Ink = 'brand' | 'info' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    /** An option of a pick, an item of a menu, or a place of a sidebar. */
    purpose: 'option' | 'command' | 'place'
    /** The root of an option: `li` in a listbox, `button` for a row that opens something (a calendar). */
    as?: 'li' | 'button'
    /** A place's page. */
    to?: string
    /** The words of the row. */
    label?: string
    /** A second line under the label. */
    description?: string
    /** An option: a word at its end (a count, the months a period covers). */
    note?: string
    /** An option: the id of the note, for the row to be described by it. */
    noteId?: string
    /** An option: the note in figures of one width. */
    numeric?: boolean
    /** An option: a check box first, ticked or not; unset, none. */
    box?: boolean
    /** An option: a check mark last, shown or keeping its place; unset, none. */
    mark?: boolean
    /** An option: the highlighted row, the band and its bar. */
    active?: boolean
    /** Cannot be picked or run: the disabled ink; the keys pass over it. */
    disabled?: boolean
    /** A command is running: a spinner in place of its glyph, the press refused. */
    loading?: boolean
    /** A command's ink. */
    tone?: Ink
    /** A command that goes a level in: a chevron at its end. */
    step?: boolean
    /** A command's second line: `sm` in a menu. */
    size?: RowSize
  }>(),
  {
    as: 'li',
    box: undefined,
    mark: undefined,
    active: false,
    disabled: false,
    loading: false,
    numeric: false,
    step: false,
    size: 'sm',
  },
)

defineSlots<{
  /** A command or a place: its own words in place of the label and the description. */
  default(props: Record<string, never>): any
  /** A command or a place: a glyph before the words. */
  media(props: Record<string, never>): any
  /** A command or a place: what stands at its end (a status glyph, a count). */
  actions(props: Record<string, never>): any
  /** An option: before the box and the words (a chevron back). */
  start(props: Record<string, never>): any
  /** An option: in place of the check mark (a chevron on). */
  end(props: Record<string, never>): any
}>()

const emit = defineEmits<{
  /** Pressed; a `loading` or `disabled` command is silent. */
  click: [event: MouseEvent]
}>()

const { t } = useUiT()
const isLink = computed(() => props.purpose === 'place' && hasAddress(props.to))
// A place the data gave no address is a row of words: never a list item inside the shell's own.
const tag = computed(() =>
  isLink.value
    ? RouteLink
    : props.purpose === 'command'
      ? 'button'
      : props.purpose === 'place'
        ? 'div'
        : props.as,
)
const resolved = computed(() => linkTarget(props.to))
// A link inside a place would be two links in one: UiLink warns.
provide(INSIDE_LINK, isLink)

// Refused in the capture phase, ahead of the caller and of the menu that closes on a click: a
// press on a busy item does nothing. A declared emit swallows the native listener, so the bubble one emits.
function refuse(e: MouseEvent) {
  if (props.purpose !== 'command' || !(props.loading || props.disabled)) return
  e.preventDefault()
  e.stopImmediatePropagation()
}

// Only where it is wanted: a second listener on the row would stamp the click before the caller's
// in the millisecond the row was drawn, and Vue drops a click its listener did not see coming.
const own = computed(() =>
  props.purpose === 'option' && props.as !== 'button'
    ? { onMousedown: (e: MouseEvent) => e.preventDefault() }
    : props.purpose === 'command'
      ? { onClickCapture: refuse }
      : {},
)

// The ink of a command in a tone: the text pair of the tone, as on UiListItem.
const INK: Record<Ink, string> = {
  brand: 'text-brand-subtle-fg [&:is(:enabled,a)]:hover:bg-brand-subtle',
  info: 'text-info-subtle-fg [&:is(:enabled,a)]:hover:bg-info-subtle',
  success: 'text-success-subtle-fg [&:is(:enabled,a)]:hover:bg-success-subtle',
  warning: 'text-warning-subtle-fg [&:is(:enabled,a)]:hover:bg-warning-subtle',
  danger: 'text-danger-subtle-fg [&:is(:enabled,a)]:hover:bg-danger-subtle',
}
const INK_FOCUS: Record<Ink, string> = {
  brand: 'focus-visible:bg-brand-subtle',
  info: 'focus-visible:bg-info-subtle',
  success: 'focus-visible:bg-success-subtle',
  warning: 'focus-visible:bg-warning-subtle',
  danger: 'focus-visible:bg-danger-subtle',
}
// The label of a command or a place: the disabled ink, the tone's ink from the row, else the text.
const ink = computed(() =>
  props.disabled && !props.loading ? 'text-disabled-fg' : props.tone ? '' : 'text-fg',
)

const classes = computed(() => {
  if (props.purpose === 'option')
    return [
      PANEL_LIST_ROW,
      props.as === 'button'
        ? 'cursor-pointer text-start text-sm/5.5 text-fg enabled:hover:bg-surface-muted'
        : props.disabled
          ? 'cursor-not-allowed text-disabled-fg'
          : 'cursor-pointer text-fg',
      props.active ? PANEL_LIST_ACTIVE : '',
    ]
  if (props.purpose === 'place')
    return [
      'flex items-center',
      NAV_ROW,
      'group w-full text-start transition-colors duration-fast ease-standard focus:outline-hidden',
    ]
  return [
    'flex items-center',
    PANEL_LIST_ROW,
    'w-full group text-start transition-colors duration-fast ease-standard focus:outline-hidden',
    props.tone ? INK[props.tone] : '[&:is(:enabled,a)]:hover:bg-surface-muted',
    // The highlight of a menu is the focus, drawn as the band and the bar of the panel list.
    props.tone ? [INK_FOCUS[props.tone], ROW_FOCUS_BAR_INK] : ROW_FOCUS,
    'disabled:cursor-not-allowed disabled:text-disabled-fg',
    props.loading ? 'pointer-events-none' : '',
  ]
})
</script>
