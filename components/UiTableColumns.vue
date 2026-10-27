<!--
  UiTableColumns: a button with a panel where a person picks which columns a table shows. The table
  toolbar draws it from its `columns` prop; it is not placed by hand.

  Panel. The panel is a UiPopover with a checkbox per column, applied at once. A required column is
  ticked, held and marked "Required". The last column shown cannot be hidden and is marked "Last
  one". The marks are one word, so the one that comes with the last tick does not widen the panel
  under the pointer, and the column's own name keeps its room. Reset in the footer returns to the default; it is held while nothing differs, so the list
  never moves under the pointer. From six columns the shown stand first under "Shown" and the hidden
  under "Hidden", a line between, so the list says why its order is not the table's.

  A view, not a filter. The choice is a personal view, so the button shows no count.
  `useTableColumns` keeps the choice per kind of table; this component is the view of that state,
  and the page draws the table from the state's `visible`. A stored choice arrives once the page
  runs in the browser, so a page rendered on the server shows the default columns for a moment.

  Placement. The toolbar draws it first in the right cluster, across the row from UiFilter and
  UiDateRange. UiDataTable takes the same state as its `columns`.

  Button. The button names itself in a tooltip. Attributes land on the button, not on the panel.

  Keyboard.
  On the button:
  - `Tab`: reaches it.
  - `Enter` `Space`: open the panel; the focus goes to the list, or to its search when there are
    six columns or more.
  In the panel, where the list is one tab stop and Reset the next; from six columns up the search
  takes the list's tab stop, and its cross is one more once it holds text:
  - `ArrowDown` `ArrowUp`: in the list, move the highlight.
  - `Home` `End`: jump.
  - `Enter` `Space`: tick.
  - `A–Z`: jumps to the column that starts with the letter.
  - `Escape`: closes the panel and returns the focus to the button.
  - `Tab`: cycles inside the panel.

  Reader.
  - Button: named "Columns" (`aria-label`, and the tooltip), with `aria-haspopup` and
    `aria-expanded`.
  - Panel: a dialog with the same name.
  - List: a multi-select listbox named "Columns", each column an option that says whether it is
    ticked.
  - Held column: says "Required" or "Last one" after its name.
  - Count: under the list, a status region, read as it changes: "2 hidden" or "All columns shown".

  States. Rest, open, a column ticked, a required column held with "Required", the last column shown
  held with "Last one", Reset held while nothing differs; the choice kept across a remount, and
  the default columns for a moment on a page rendered on the server. No count on the button: the
  choice is a view, not a filter.

  Not for.
  - Narrowing the rows: UiFilter.
  - A period: UiDateRange.
  - One choice among a few: UiSelect.
  - A second menu beside a toolbar: never; the toolbar draws it from `columns`.
-->
<template>
  <UiPopover align="end">
    <template #trigger>
      <UiTooltip :content="t('grani.tableColumns.label')">
        <UiIconButton
          v-bind="control"
          :class="rootClass"
          :style="rootStyle"
          :icon="Columns3"
          :ariaLabel="t('grani.tableColumns.label')"
          :size="ladder"
        />
      </UiTooltip>
    </template>
    <UiFilterList
      :items="items"
      :model-value="shown"
      :ariaLabel="t('grani.tableColumns.label')"
      :groups="{
        chosen: t('grani.tableColumns.groupShown'),
        rest: t('grani.tableColumns.groupHidden'),
      }"
      @update:model-value="apply"
    />
    <template #footer>
      <!-- Said as it changes; as wide as its widest text, so a tick never moves the panel. -->
      <span
        class="me-auto inline-grid ps-1 text-sm/5.5 text-fg-muted [&>*]:col-start-1 [&>*]:row-start-1"
      >
        <span role="status">{{ summary }}</span>
        <span aria-hidden="true" class="invisible">{{ t('grani.tableColumns.allShown') }}</span>
      </span>
      <UiButton variant="ghost" size="xs" :disabled="!changed" @click="columns.reset()">
        {{ t('grani.tableColumns.reset') }}
      </UiButton>
    </template>
  </UiPopover>
</template>

<script lang="ts">
// Mounted menus by the columns state they draw, to warn when one state has two.
const MENUS = new WeakMap<object, number>()
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import { useControlSize } from '../composables/useControlSize'
import { computed, getCurrentInstance, onBeforeUnmount, onMounted } from 'vue'
import { Columns3 } from '@lucide/vue'
import type { TableColumns } from '../composables/useTableColumns'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import type { ControlSize, SelectValue } from '../types/ui'
import UiButton from './UiButton.vue'
import UiFilterList from './UiFilterList.vue'
import UiIconButton from './UiIconButton.vue'
import UiPopover from './UiPopover.vue'
import UiTooltip from './UiTooltip.vue'
import { useSplitAttrs } from '../utils/attrs'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The columns state from `useTableColumns`: every column, the hidden ones, which may be hidden. The table draws its `visible`. */
  columns: TableColumns<T>
  /** Step of the control ladder for the button: the toolbar row's, the app's size (`createGrani({ size })`) when unset. */
  size?: ControlSize
}>()
const ladder = useControlSize(() => props.size)

// One menu for one state: a second one (a toolbar that draws it and one more in its `#end`)
// shows the same choice twice. Said in dev, however deep the second one stands.
if (isDev() && getCurrentInstance()) {
  // The state counted at mount is the one taken off at unmount, should the prop change between.
  let counted: object
  onMounted(() => {
    counted = props.columns
    const n = (MENUS.get(counted) ?? 0) + 1
    MENUS.set(counted, n)
    if (n > 1)
      console.warn(
        '[grani] UiTableColumns: two columns menus for one state; the toolbar already draws it from `columns`.',
      )
  })
  onBeforeUnmount(() => MENUS.set(counted, (MENUS.get(counted) ?? 1) - 1))
}
const { t, tp } = useUiT()
const { rootClass, rootStyle, control } = useSplitAttrs()
const all = computed(() => props.columns.all.value)
const hidden = computed(() => props.columns.hidden.value)
const changed = computed(() => props.columns.changed.value)
// A required column is shown ticked and fixed, marked "Required"; the last one shown, "Last one".
const items = computed(() =>
  all.value.map((col) => {
    const fixed = !props.columns.canToggle(col.key) && !hidden.value.includes(col.key)
    return {
      value: col.key,
      label: col.label,
      disabled: fixed,
      description: !fixed
        ? undefined
        : props.columns.isRequired(col.key)
          ? t('grani.tableColumns.always')
          : t('grani.tableColumns.last'),
    }
  }),
)
const shown = computed(() =>
  all.value.filter((col) => !hidden.value.includes(col.key)).map((col) => col.key),
)
// The columns whose state differs are toggled, those coming back first: the last column shown is
// never hidden, so Only on a hidden one would otherwise leave another in view beside it.
function apply(next: SelectValue[]) {
  const differs = all.value.filter((c) => next.includes(c.key) !== shown.value.includes(c.key))
  for (const col of differs) if (next.includes(col.key)) props.columns.toggle(col.key)
  for (const col of differs) if (!next.includes(col.key)) props.columns.toggle(col.key)
}
const summary = computed(() =>
  hidden.value.length
    ? tp('grani.tableColumns.hidden', hidden.value.length)
    : t('grani.tableColumns.allShown'),
)
</script>
