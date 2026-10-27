<!--
  UiFilter: a toolbar button that narrows a list by one dimension, or by several at once. Take it
  in a table toolbar, after the search.

  Button. It shows a filter glyph, its label and a chevron. Once something is chosen, the count
  replaces the glyph in a slot of the same width, on a pale plate (up to 9, then "9+"), so the
  button keeps its size. Attributes land on the button.

  Panel. The panel under the button is a UiPopover. Reset stands in its footer under a line and is
  held while nothing is chosen, so the list above does not move under the pointer when the first
  box is ticked.

  One dimension. Pass `items` and `v-model`; the filter counts and resets itself. A value counts
  once, however often `v-model` holds it. A value with no option among `items` (an option the
  server dropped, an old link) still counts and still filters: no row shows it, and Reset clears it.

  Several dimensions. Put UiCard sections in the default slot, each with a UiFilterList and no
  title (a popover has no heading), and name each list by its `ariaLabel`; a line parts two
  neighbors, as in every overlay. The slot is read once, when the filter is made: the sections
  may change, but whether there are any may not. The lists mount only
  while the panel is open, so the host does the rest: it passes `count`, the number of dimensions
  with a value (status and channel make 2), holds each list's `loading`, and clears the lists on
  `reset`.

  Placement. In a table toolbar's `#start` (UiDataTable `#filters`), after the search and
  beside UiDateRange. Bind the slot's `size` on it.

  Table. In UiDataTable's `#filters`, a choice the person changes (a tick, Only, Reset) starts the
  list on page one, and an empty list the filter narrowed offers "Reset filters"; a value the app
  sets moves no page.

  Keyboard.
  On the button:
  - `Tab`: reaches it.
  - `Enter` `Space`: open the panel; the focus goes to the list, or to its search when there are
    six options or more.
  In the panel, where the list is one tab stop and Reset the next; from six options up the search
  takes the list's tab stop, and its cross is one more once it holds text:
  - `ArrowDown` `ArrowUp`: move the highlight.
  - `Home` `End`: jump.
  - `Enter` `Space`: tick.
  - `A–Z`: jumps to the first option that starts with the letter.
  - `Enter`: in the search, ticks the highlighted row (the first match once there is text) and
    does not submit a form around the filter.
  - `Escape`: clears a search that has text and stays in the panel; otherwise closes the panel and
    returns the focus to the button, as a pick and close does.

  Reader.
  - Button: the label, "Categories", and, once something is chosen, the count in words after it
    (", 2 active"; the digit on the badge is hidden), with `aria-haspopup` and `aria-expanded`.
    An `aria-label` of the caller's replaces the whole name, the count included.
  - Panel: a dialog named by the button, the count in words included.
  - List: one multi-select listbox named by the label, each option saying whether it is ticked;
    with sections, each list is named by its `ariaLabel`.
  - Nothing found: a status region that is always present and is filled when the search leaves
    nothing.

  Options that failed to load. The filter has no error of its own: the host sets `disabled` on it,
  so the button does not open, and says what failed where the list's own error stands.

  States. Rest, open, something chosen (the count in place of the glyph), Reset held while nothing
  is chosen, `loading`: a first load in the options' shape, a refresh with the rows held and dimmed; a search from six options and its empty result, several
  dimensions in sections; the button at `xs`, `sm` and `md`.

  Not for.
  - A period: UiDateRange.
  - The columns a table shows: UiTableColumns.
  - One value in a form: UiSelect (`multiple` for several).
  - Commands: UiMenu.
-->
<template>
  <UiPopover :align="align">
    <template #trigger>
      <!-- The count is said in the name, not by a hidden span after the label: the browser reads
        that span as a block, with a pause before its comma ("Categories , 2 active"). -->
      <UiButton
        variant="outline"
        :size="ladder"
        :aria-label="chosen > 0 ? label + t('grani.filter.chosen', { n: chosen }) : undefined"
        :class="rootClass"
        :style="rootStyle"
        v-bind="control"
      >
        <!-- The glyph and the count share one slot of a fixed width: choosing never widens the button. -->
        <span data-slot="mark" class="inline-grid w-5 shrink-0 place-items-center">
          <UiCount
            v-if="chosen > 0"
            :count="chosen"
            :max="9"
            tone="brand"
            size="sm"
            aria-hidden="true"
          />
          <ListFilter v-else />
        </span>
        {{ label }}
        <ChevronDown />
      </UiButton>
    </template>
    <Sections v-if="$slots.default" />
    <UiFilterList
      v-else
      :items="items"
      :model-value="modelValue"
      :loading="loading"
      :ariaLabel="label"
      @update:model-value="pick"
    />
    <template #footer>
      <UiButton variant="ghost" size="xs" class="me-auto" :disabled="chosen === 0" @click="reset">
        {{ t('grani.filter.reset') }}
      </UiButton>
    </template>
  </UiPopover>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { useControlSize } from '../composables/useControlSize'
import { computed, inject, onBeforeUnmount, useSlots } from 'vue'
import { ChevronDown, ListFilter } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useSplitAttrs } from '../utils/attrs'
import { LIST_FILTERS } from '../utils/listFilters'
import { flatSections } from '../utils/sections'
import { withLines } from './overlaySections'
import UiButton from './UiButton.vue'
import UiCard from './UiCard.vue'
import UiCount from './UiCount.vue'
import type { ControlSize, SelectOption, SelectValue } from '../types/ui'
import UiFilterList from './UiFilterList.vue'
import UiPopover from './UiPopover.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The dimension, on the button: "Categories". */
    label: string
    /** One dimension: its options, as a select's (`SelectOption`). */
    items?: SelectOption[]
    /** One dimension: the chosen values. */
    modelValue?: SelectValue[]
    /** Several dimensions: how many of them have a value (status and channel is 2), for the button and Reset. Required with sections: without it the button shows nothing chosen and Reset stays held. */
    count?: number
    /** One dimension: the options are on their way. With none yet, rows in their shape; with options in view, they stay, held and dimmed. Several: each list takes its own. */
    loading?: boolean
    /** Which edge of the button the panel lines up with. */
    align?: 'start' | 'center' | 'end'
    /** Step of the control ladder, as the rest of the toolbar row. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  {
    items: () => [],
    modelValue: () => [],
    count: undefined,
    loading: false,
    align: 'start',
  },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** One dimension: the chosen values. */
  'update:modelValue': [value: SelectValue[]]
  /** Reset was pressed; one dimension clears itself as well. */
  reset: []
}>()

defineSlots<{
  /** Several dimensions: UiCard sections without a title, each with a UiFilterList named by `ariaLabel`. Leave empty for one. */
  default(props: Record<string, never>): unknown
}>()

const { t } = useUiT()
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const { rootClass, rootStyle, control } = useSplitAttrs()
if (isDev() && slots.default && props.count === undefined)
  console.warn(
    '[grani] UiFilter with sections needs `count` from the host, or it shows nothing chosen.',
  )
// A popover has no heading: a titled section reads as one, and its button already names the panel.
// The sections are drawn here, so the slot is read at render (called anywhere else it tracks
// nothing, and Vue warns), and a titled one is said once in dev. The popover sees this one node,
// not the cards, so the line between two sections is drawn here too.
let saidTitle = false
const Sections = () => {
  const nodes = slots.default?.() ?? []
  if (
    isDev() &&
    !saidTitle &&
    flatSections(nodes).some((v) => v.type === UiCard && (v.props as { title?: string })?.title)
  ) {
    saidTitle = true
    console.warn(
      '[grani] UiFilter: a section has a title; name its UiFilterList with `ariaLabel` instead.',
    )
  }
  return withLines(nodes)
}
if (isDev() && slots.default && (props.items.length || props.modelValue.length))
  console.warn(
    '[grani] UiFilter: `items` and `v-model` are one dimension; with sections they do nothing.',
  )
if (isDev() && slots.default && props.loading)
  console.warn(
    '[grani] UiFilter: `loading` holds one dimension; with sections pass it to each UiFilterList.',
  )
// A value repeated in the model is one choice, so it counts once.
const chosen = computed(() => props.count ?? (seen.default ? 0 : new Set(props.modelValue).size))

// The table the filter stands in starts on page one when the person changes a choice, and resets it
// from an empty list. What the app sets from outside is not the person's change.
const list = inject(LIST_FILTERS, null)
function pick(value: SelectValue[]) {
  emit('update:modelValue', value)
  list?.changed()
}
function reset() {
  if (!slots.default) emit('update:modelValue', [])
  emit('reset')
  list?.changed()
}
if (list) onBeforeUnmount(list.put({ chosen: () => chosen.value > 0, clear: reset }))
</script>
