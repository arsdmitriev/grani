<!--
  UiPopover: a small panel under a button, with the page still live. Take it for a few controls
  about the page (a note, a currency, a date); a filter is UiFilter and the columns of a table
  UiTableColumns, both on this panel, as UiMenu is for its list of commands.

  Trigger. The trigger is your own button in `#trigger`; the popover gives it `aria-haspopup`,
  `aria-expanded` and the toggle. The panel has no heading: the button names it, or `labelledby`
  does (a field's label).

  Dialog. The panel is a non-modal dialog, and the page stays live: no backdrop, no scroll lock.

  Open state. `v-model:open` lets the host open it, at mount too, and hear every close. When it is
  closed from outside, a focus that was inside goes back to the button.

  Kept pages. In a page that a `KeepAlive` keeps, a panel left open stays in the body when the page
  is deactivated, and Escape closes it there. Close it (`open` false) when the route changes.

  Footer. Actions (Apply, Reset) go in `#footer`, under a line at the end, never among the controls;
  both slots get `close`. Sections are flat UiCard components with a separator between neighbors, as in every
  overlay.

  Nesting. A select, a menu or a date picker inside works: a press in its list does not count as
  outside, and anything opened from the panel paints above it. A list at the top or the bottom of
  the panel (a UiFilterList) reaches that edge, as a select's list does. The panel is never taller
  than the room beside its button, so it never covers the button; a longer panel scrolls inside
  itself.

  Attributes. `class` and other attributes land on the panel. Its `id` stays its own, because the
  button points at it.

  Placement. It sits in a table toolbar (UiFilter, UiDateRange, UiTableColumns), under a date field
  (UiDatePicker); a menu's panel (UiMenu) is the same panel, holding commands.

  Keyboard.
  - `Enter` `Space`: on the button, open it, as a click does. The focus goes to the first field (a
    drawn select, date, switch, scale, drop zone or date range too, or what is marked
    `data-autofocus`), else to the first control; a panel of buttons opens on its first button.
  - `Tab`: goes round inside.
  - `Escape`: closes it and returns the focus to the button, only while the panel is the top
    layer.
  `close` from a slot does the same, unless the focus has already moved into a layer opened from
  the panel (a drawer an item opened), which keeps it. A click outside closes it and leaves the
  focus where the click went.

  Reader.
  - Button: says it opens a dialog (`aria-haspopup`), whether it is open (`aria-expanded`) and what
    it controls (`aria-controls`).
  - Panel: a non-modal `dialog` named by the button (`aria-labelledby`), or by `labelledby` (a
    field's label), with no heading of its own.

  States. Closed, or open under the button on its start, center or end edge (`align`), above it when
  there is no room below. It is never taller than the room beside the button; a longer panel scrolls
  inside itself with the `#footer` in view. While its button is scrolled out of the window, the panel
  waits hidden, still open, and the focus it held comes back with it. Opened from outside with `v-model:open`, at mount too. A
  select, a menu or a date picker open inside it. Opened from a drawer, where Escape closes only the
  panel.

  Not for.
  - Commands: UiMenu.
  - A task that needs the whole attention: UiModal.
  - A record to edit: UiCrudDrawer.
  - A hint of text alone: UiTooltip.
-->
<template>
  <Trigger />
  <Panel v-bind="$attrs">
    <div :class="BODY">
      <Body />
    </div>
    <Footer />
  </Panel>
</template>

<script setup lang="ts">
import { defineComponent, h, useSlots } from 'vue'
import { provideSurface } from '../composables/overlaySurface'
import { withLines } from './overlaySections'
import { usePanel } from '../composables/panel'
import { renders } from '../utils/sections'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Which edge of the button the panel lines up with; start and end follow the reading direction. */
    align?: 'start' | 'center' | 'end'
    /** The element the panel lines up with, when the button sits inside a wider one (a field's capsule). */
    anchor?: HTMLElement | null
    /** The id of what names the panel, when the button's text is not its name (a field's label). */
    labelledby?: string
  }>(),
  { align: 'start', anchor: null, labelledby: '' },
)

defineSlots<{
  /** The button that opens the panel: one element or component, it keeps its own look and name. */
  trigger(props: Record<string, never>): unknown
  /** The controls. `close` closes the panel and returns focus to the button. */
  default(props: { close: () => void }): unknown
  /** The actions under a line at the end of the panel, `xs` buttons 8px in (a gray Reset first with `me-auto`, Apply last); it stays in view while the controls scroll. Gets `close`. One that draws nothing draws no line. */
  footer(props: { close: () => void }): unknown
}>()

const slots = useSlots()
/** Whether the panel is open (`v-model:open`): the host learns of every close and can open it from outside. */
const open = defineModel<boolean>('open', { default: false })

// The panel, its button, its place and its layer: the core UiMenu stands on too.
const { Trigger, Panel, close } = usePanel({
  open,
  menu: false,
  trigger: () => slots.trigger?.(),
  anchor: () => props.anchor,
  align: () => props.align,
  labelledby: () => props.labelledby,
})

// What a slot closes with: back to the button, as Escape does.
const closeBack = () => close()

// A list at an edge reaches it, as a dropdown's rows do: the panel's edge when it is the
// first or last thing in the body, alone or as a flat section without a heading (the card's
// body is then its first or last child), and the separator line between sections.
const BODY = [
  'flex min-h-0 flex-col gap-overlay overflow-y-auto p-overlay',
  'has-[>[data-list-top]:first-child]:pt-0 has-[>:first-child>:first-child>[data-list-top]:first-child]:pt-0',
  'has-[>[data-list-bottom]:last-child]:pb-0 has-[>:last-child>:last-child>[data-list-bottom]:last-child]:pb-0',
  '[&>[role=separator]+[data-list-top]]:-mt-overlay [&>[role=separator]+*:has(>:first-child>[data-list-top]:first-child)]:-mt-overlay',
  '[&>[data-list-bottom]:has(+[role=separator])]:-mb-overlay [&>*:has(>:last-child>[data-list-bottom]:last-child):has(+[role=separator])]:-mb-overlay',
]

// Its own component so the provides stop at the panel's content. Cards are its flat sections, with
// a line between neighbors, none before one a legend opens; a separator lies across the panel,
// whatever group the button sits in. No title names what is inside.
const Body = defineComponent({
  setup() {
    provideSurface({ flat: true, gutter: 'overlay' })
    return () => withLines(slots.default?.({ close: closeBack }) ?? [])
  },
})
// A footer slot that draws nothing (an Apply behind a v-if that is off) draws no line either.
const Footer = () => {
  const nodes = slots.footer?.({ close: closeBack })
  return renders(nodes)
    ? h(
        'div',
        {
          'data-grani': '',
          class: 'flex shrink-0 items-center justify-end gap-2 border-t border-border p-2',
        },
        nodes,
      )
    : null
}
</script>
