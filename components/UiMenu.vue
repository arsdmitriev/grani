<!--
  UiMenu: a list of commands that opens under a button. Take it for actions that have no room beside
  their subject, such as the actions of a table row.

  Trigger. The trigger is your own button in `#trigger` (a UiButton, or a UiIconButton with three
  dots); the menu gives it `aria-haspopup`, `aria-expanded` and the toggle.

  Items. Items are UiListItem command rows (`as="button"`) in the default slot, with groups split by
  a UiSeparator. The menu draws every one as a `menuitem`, a row of its panel list
  (`utils/panelList`, shared with UiSelect, UiFilterList and UiDateRange): edge to edge, lit as the
  same band by the arrows and by the pointer, with the row's title, description, glyphs, tone,
  `loading`, `disabled` and `step`. A click on an item runs it and closes the menu, unless the item
  is `loading` or `disabled`. A menu runs commands only: a link row (`to`) or a label row in it warns in
  development, since it would be a button going nowhere; a place to go is a link row outside the
  menu, or a command whose `@click` navigates. A text or a row inside a component of your own warns
  too: it is not an item.

  Popover. It stands on the panel core UiPopover stands on, which gives the panel, its place beside
  the button and its place on the overlay stack; the menu adds the items and the keys. It holds
  commands only. A panel of controls (filters, a period, columns) is a plain popover, because it needs the
  focus moved into it and kept there, which a menu does not do.

  Kept pages. In a page that a `KeepAlive` keeps, a menu left open stays in the body when the page
  is deactivated, as a popover does. Close it when the route changes.

  Placement. It sits under a button of its own, in the trailing slot of a UiButtonGroup, and in a
  table row's `#row-actions`. Opened from a drawer or a window, it paints above it.

  Keyboard.
  As in the WAI-ARIA menu button.
  On the button:
  - `Enter` `Space` `ArrowDown`: open it on the first item.
  - `ArrowUp`: opens it on the last item. With `Alt` the arrows open it too; `Ctrl` or `Meta` with one
    stays the browser's.
  In the open menu:
  - `ArrowDown` `ArrowUp` `Home` `End`: move; the arrows wrap and skip a disabled item.
  - `A–Z`: goes to the next item that starts with the letter.
  - `Escape` `Tab`: close it and return the focus to the button, and so does running an item, before
    its command runs: a command that removes the button's row leaves the focus to the list.
  A held Enter is one press: it opens the menu once and runs one item.
  A click outside closes it, and the focus stays where the click went. Opened with the mouse, it
  puts the focus on the panel, not on an item.

  Reader.
  - Button: says it opens a menu (`aria-haspopup="menu"`) and whether it is open
    (`aria-expanded`).
  - Panel: a `menu` named by the button (`aria-labelledby`; your own id on the button wins).
  - Items: each a `menuitem` outside the tab order; a `loading` item says busy (`aria-busy`), and a
    `disabled` one is a disabled button.

  States. Closed, or open beside the button on its start or end edge (`align`); while the button is
  scrolled out of the window, it waits hidden, still open, and the focus it held comes back with it.
  A `loading` item spins and refuses the click, and the menu stays open; a `disabled` item is
  skipped by the arrows.
  Past five commands, the panel takes a measured height that shows half of the sixth row, and
  scrolls. With every item switched off by `v-if` it opens empty, the focus on the panel: give the
  button `disabled` instead.

  Not for.
  - A panel of controls (filters, a period, columns): UiPopover.
  - A value to pick: UiSelect.
  - A few actions side by side: UiButtonGroup.
-->
<template>
  <Trigger />
  <Panel
    v-bind="$attrs"
    :style="{ maxHeight: menuHeight }"
    @keydown="onPanelKey"
    @click.capture="onItemPress"
    @click="onPanelClick"
  >
    <Items />
  </Panel>
</template>

<script setup lang="ts">
import {
  Comment,
  type Component,
  defineComponent,
  Fragment,
  h,
  Text,
  provide,
  ref,
  useSlots,
  type VNode,
  type VNodeArrayChildren,
} from 'vue'
import { usePanel, type PanelStart } from '../composables/panel'
import { useVisibleRows } from '../composables/useVisibleRows'
import { isDev } from '../utils/dev'
import { GROUP_AXIS, GROUP_NESTED } from '../utils/groupAxis'
import { usePanelList } from '../utils/panelList'
import { flatSections } from '../utils/sections'
import { ROW_INSET, SURFACE_GUTTER } from '../utils/surface'
import PanelRow from './PanelRow.vue'
import UiSeparator from './UiSeparator.vue'
import UiListItem from './UiListItem.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Which edge of the button the menu lines up with; start and end follow the reading direction. */
    align?: 'start' | 'end'
  }>(),
  { align: 'end' },
)

defineSlots<{
  /** The button that opens the menu: one element or component, it keeps its own look and name. */
  trigger(props: Record<string, never>): unknown
  /** The items: `UiListItem as="button"` rows placed directly (not inside a component of your own), groups split by a `UiSeparator`. An item's `@click` that stops the click keeps the menu open with the focus on its button: let it through. */
  default(props: Record<string, never>): unknown
}>()

const slots = useSlots()
const open = ref(false)
// The panel core UiPopover stands on, as a menu: placed beside the button, on the overlay stack,
// Escape and a click outside closing it, Tab closing it back to the button, the arrows on the
// button opening it on the first or the last item.
const { Trigger, Panel, panelRef, close, findTrigger } = usePanel({
  open,
  menu: true,
  trigger: () => slots.trigger?.(),
  align: () => props.align,
  onShown: (at) => focusAt(at),
})
const { maxHeight: menuHeight } = useVisibleRows(panelRef, '[role=menuitem]', open)

// Every command row in the slot, through v-for and v-if fragments, becomes an item of the menu.
// What cannot be an item warns, once per kind: a row inside a component of the caller's own (out
// of reach), a link or a label row (a button going nowhere), a text. A menu item nobody can arrow
// to, or that does nothing, is worse than a loud mistake.
const warned = new Set<string>()
const warn = (said: string) => {
  if (!isDev() || warned.has(said)) return
  warned.add(said)
  console.warn(`[grani] UiMenu: ${said}`)
}
const strayText = (nodes: unknown): boolean =>
  Array.isArray(nodes) &&
  nodes.some(
    (n) =>
      (typeof n === 'string' && n.trim() !== '') ||
      strayText(n) ||
      ((n as VNode | null)?.type === Fragment && strayText((n as VNode).children)),
  )
const asItems = (nodes: VNodeArrayChildren): VNodeArrayChildren =>
  nodes.map((n) => {
    if (!n || typeof n !== 'object' || Array.isArray(n)) return n
    const v = n as VNode
    if (v.type === Text) {
      if (String(v.children).trim())
        warn('a text in the slot is not an item; write UiListItem rows.')
      return v
    }
    if (v.type === Fragment && Array.isArray(v.children))
      return h(Fragment, v.key == null ? null : { key: v.key }, asItems(v.children))
    if (v.type === UiListItem) {
      const p = (v.props ?? {}) as Record<string, unknown>
      if (p.to)
        warn(
          'a menu takes command items (`as="button"`); a place to go is a link row outside the menu, or an `@click` that navigates.',
        )
      else if (p.as !== 'button')
        warn(
          'a menu takes command items (`as="button"`); a plain or a label row would be a button that does nothing.',
        )
      return asItem(v)
    }
    if (v.type !== Comment && v.type !== UiSeparator)
      warn('it takes UiListItem rows and UiSeparator directly; a wrapped row is not an item.')
    return v
  })
// A command row the caller wrote is drawn as a row of the menu's panel list: its words, glyphs, ink
// and state carried over, everything else (a class, a listener, an id) left on the item.
const asItem = (v: VNode) => {
  const { title, description, tone, loading, disabled, step, size, ...rest } = (v.props ??
    {}) as Record<string, any>
  // What only a row of a page reads: the mode is the menu's, the look is the panel list's.
  for (const k of ['as', 'variant', 'highlight', 'lit']) delete rest[k]
  return h(
    PanelRow as Component,
    {
      ...rest,
      key: v.key ?? undefined,
      purpose: 'command',
      label: title,
      description,
      tone,
      loading,
      disabled,
      step,
      size,
      role: 'menuitem',
      tabindex: '-1',
    },
    v.children as Record<string, () => VNode[]>,
  )
}
// A separator stands between two groups only, whatever the caller's v-if left out.
const tidy = (list: VNode[]): VNode[] => {
  const out: VNode[] = []
  for (const v of list) {
    const line = v.type === UiSeparator
    if (line && (!out.length || out[out.length - 1]!.type === UiSeparator)) continue
    out.push(v)
  }
  while (out.length && out[out.length - 1]!.type === UiSeparator) out.pop()
  return out
}
// Its own component so the provides stop at the items: the trigger keeps its own gutter and axis.
const Items = defineComponent({
  setup() {
    provide(SURFACE_GUTTER, null)
    provide(ROW_INSET, null)
    provide(GROUP_AXIS, ref('vertical'))
    provide(GROUP_NESTED, false)
    return () => {
      const nodes = slots.default?.() ?? []
      // A text inside an array never reaches the items: the opening of fragments drops it unseen.
      if (strayText(nodes)) warn('a text in the slot is not an item; write UiListItem rows.')
      return asItems(tidy(flatSections(nodes)))
    }
  },
})

// Every item, a disabled one too: the keys pass over it.
const items = () =>
  Array.from(panelRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
// The highlight of a menu is the focus: the arrows go round, a letter goes to the next item it starts.
const nav = usePanelList({
  items,
  disabled: (el) => el.hasAttribute('disabled'),
  label: (el) => el.textContent!.trim(),
  row: (i) => items()[i],
  wrap: true,
  focus: true,
  typeAhead: 'next',
})

// Opened, the focus goes where the keyboard asked: the first or the last item, else the panel.
function focusAt(at: PanelStart) {
  const list = items()
  const target =
    at === 'first'
      ? list[nav.firstEnabled(0, 1)]
      : at === 'last'
        ? list[nav.firstEnabled(list.length - 1, -1)]
        : undefined
  ;(target ?? panelRef.value)?.focus()
}

function onPanelKey(e: KeyboardEvent) {
  // A held Enter is one press: its repeats would run the item again, or, once the focus is back
  // on the next row's button, open that row's menu and run its first item.
  if (e.key === 'Enter' && e.repeat) return e.preventDefault()
  nav.active.value = items().indexOf(document.activeElement as HTMLElement)
  if (nav.keys(e)) return
  if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey || !e.key.trim()) return
  nav.typeAhead(e.key)
}

// The focus goes back to the button before the command runs, as the menu closes: a command that
// removes the button's row (Delete) leaves the focus on it, so the list hands it to the same button
// of the row now in its place, and a command that moves the focus (a window) has the last word.
// A busy or disabled item refuses the press, and the focus stays in the menu.
function onItemPress(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest('[role="menuitem"]')
  if (!item || item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true')
    return
  findTrigger()?.focus()
}
// A busy or disabled item stops its own click, so only a click that ran a command gets here.
function onPanelClick(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest('[role="menuitem"]')
  if (item) close()
}
</script>
