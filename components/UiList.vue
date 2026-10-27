<!--
  UiList: rows one under another, divided by lines. Take it around UiListItem rows wherever they
  stand in a column; a card of rows is UiCard `:padded="false"` around a UiList.

  Lines. The list divides its rows: a line stands above every row that follows a row, or the block a
  row opened (UiReveal), drawn over the row's own air, so a row is one height wherever it stands. A
  notice is a row too, with the lines of any row; a framed row (`outline`, `muted`) stands alone,
  with no line above it or after it.

  Edges. In a surface with a gutter (a padded card, a window, a drawer's section) the list runs its
  rows edge to edge, through the gutter, and their text stays on it. Standing first or last in a
  drawer's section, its own child and not inside a block of the section's, it reaches the section's
  line: the section says which of its children is first and last, so a section of rows alone is a
  list between two lines, and a list wrapped in a block after a paragraph keeps its place. Last in
  a padded card's body, the card drops its bottom gutter under it. In a card without padding the
  rows keep the card's inset.

  Items. Every child is an item of the list: a row, a UiReveal with its row and its block, a notice.
  A notice stands among the rows as a row of the list, not as the card it is alone: the rows' edges,
  height and lines, its tone a 3px edge at the start along the whole row, clipped by the card's
  corners when it comes first or last; `variant="soft"` on it fills the row with its tone's pale
  plate as well. A child that is not a row (a separator, a plain block) stands as an item too, with
  no line above or after it.

  Keyboard. Nothing of its own: a link or a command row is a tab stop, a label row reaches its
  control, a plain row takes no focus.

  Reader.
  - List: `role="list"`, kept where a style drops a list's semantics, each child a list item, so a
    screen reader says how many rows there are and which one it is on.

  States. Rows of plain text, links, fields and commands; a notice among them, plain or `soft`; a long list in a
  card; a list at the top or the bottom of a drawer's section, line to line; on a narrow screen the
  rows wrap their text and keep their actions beside it.

  Not for.
  - A list in a panel: the panel draws it itself, as a UiSelect or a UiMenu does.
  - A table of columns: UiTable.
  - A list that grows from its last row: UiListField over a UiList.
-->
<template>
  <ul role="list" class="ui-list" :class="classes">
    <Items :nodes="$slots.default?.() ?? []" />
  </ul>
</template>

<script setup lang="ts">
import {
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  provide,
  type VNode,
  type VNodeArrayChildren,
} from 'vue'
import { BLEED, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'
import { provideInList } from '../utils/rowSize'

defineSlots<{
  /** The rows: UiListItem, a UiReveal around one, a notice. Each child is one item of the list. */
  default(props: Record<string, never>): any
}>()

const gutter = inject(SURFACE_GUTTER, null)
const inset = inject(ROW_INSET, null)

// Through a surface's gutter the list runs edge to edge and its rows pad their text back to it;
// in a card without padding they keep the card's inset. Its rows stand on no gutter of their own.
provide(ROW_INSET, gutter ?? inset)
provide(SURFACE_GUTTER, null)
provideInList(true)

const classes = computed(() => (gutter ? BLEED[gutter] : ''))

// Each child in an item of its own: fragments (v-for, v-if) opened, comments dropped. A key is
// kept with the place of the fragment it came from, so a v-if branch's 0 and a v-for's index 0
// are two items, and a row added on top moves with its item.
const items = (nodes: VNodeArrayChildren, at = ''): VNode[] =>
  nodes.flatMap((n, i) => {
    if (!n || typeof n !== 'object') return []
    if (Array.isArray(n)) return items(n, `${at}${i}.`)
    const v = n as VNode
    if (v.type === Comment) return []
    if (v.type === Fragment && Array.isArray(v.children))
      return items(v.children as VNodeArrayChildren, `${at}${i}.`)
    const key = v.key == null ? undefined : `${at}${String(v.key)}`
    return [h('li', { key, role: 'listitem', 'data-grani': '' }, [v])]
  })
// The slot is called in the list's own render and handed down as a prop: a child that calls it
// itself is not re-rendered when a host hands new rows through a scoped slot as a plain array.
const Items = defineComponent({
  props: { nodes: { type: Array as () => VNodeArrayChildren, required: true } },
  setup(props) {
    return () => items(props.nodes)
  },
})
</script>
