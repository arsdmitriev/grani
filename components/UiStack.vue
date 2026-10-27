<!--
  UiStack: things one under another or side by side, spaced by what they are to each other. Take it
  for the blocks of a page or a form; text on the left and a thing on the right is UiListItem.

  Gaps. You name the relation, never a number. `tight` is 8, for the lines of one thing (a label and
  its control, a name and its count). `group` is 16, the default, for the things of one group (the
  fields of a form, a search over its list). `title` is 24, for a title and the text or the fields
  it names. `block` is 48, for the blocks of one page, and `section` is 96, for its sections.
  Importance is shown by size and color, not distance: a wider gap says "another thing", never "a
  bigger thing".

  Margins. It is a gap, not a margin, so the children carry no space of their own. A UiSeparator
  among them keeps the rhythm, and a UiHeader legend after other content adds its own 32 to the
  gap: in the default stack that lands at `block` (48), in another it is that gap plus 32. The stack
  pads nothing: in a UiCard it is the body, and the card's gutter goes round it.

  Rows. `row` is for things that share one line and nothing else (a badge beside a name, two
  buttons); they align on its vertical center. Text on the left and a thing on the right is UiListItem,
  not a `row`.

  Keyboard. Not interactive: the children keep their own tab stops, in the order they are stacked.

  Reader.
  - Element: nothing of its own; a `div`, or the element `as` names (`section`, `ul`, `form`, `li`),
    with the children read in order.

  States. None: the gap is one step of the scale and does not change with the content.

  Not for.
  - Text on the left and a thing on the right: UiListItem.
  - A table: UiTable.
  - The toolbar row: UiTableToolbar owns it.
  - Buttons joined into one capsule: UiButtonGroup.
  - A grid of columns: the page lays it out itself.
-->
<template>
  <component :is="as" data-grani :class="[DIRECTION[direction], GAP[gap], ALIGN[alignment]]">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// It draws nothing before its slot: an overlay looking for a legend at the top of its body looks
// through it, as through a plain element (`leadsWith`).
defineOptions({ layout: true })

const props = withDefaults(
  defineProps<{
    /** The relation between the children, a step of the scale: `tight` 8, `group` 16, `title` 24, `block` 48, `section` 96 px. */
    gap?: 'tight' | 'group' | 'title' | 'block' | 'section'
    /** `column` stacks the children; `row` lines them up on one line. */
    direction?: 'column' | 'row'
    /** Where the children stand across the stack. Unset, a column stretches them to its width and a row centers them on the line. */
    align?: 'start' | 'center' | 'end' | 'stretch'
    /** The element: `div` by default; `section`, `ul`, `form` or `li` when the stack is one. */
    as?: 'div' | 'section' | 'ul' | 'form' | 'li'
  }>(),
  { gap: 'group', direction: 'column', as: 'div' },
)

defineSlots<{
  /** The things stacked, in order, each without a margin of its own. */
  default(props: Record<string, never>): any
}>()

const alignment = computed(() => props.align ?? (props.direction === 'row' ? 'center' : 'stretch'))

const GAP = {
  tight: 'gap-2',
  group: 'gap-4',
  title: 'gap-6',
  block: 'gap-12',
  section: 'gap-24',
} as const
const DIRECTION = { column: 'flex flex-col', row: 'flex flex-row' } as const
const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const
</script>
