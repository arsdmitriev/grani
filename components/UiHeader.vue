<!--
  UiHeader: the name of a page (`page`) or of a section (`legend`). Take `page` once at the top of
  a page, `legend` over each part of a long form or a card.

  Page. `page` is the `h1` at the top of UiAppShell's main area, with one line under it and the
  actions on the right, centered vertically on the title and its line together, as in UiListItem. It
  does not go inside a card, a modal or a drawer, which name themselves.

  Legend. `legend` is a small title in capitals on a line, like a fieldset's legend, beside the
  fields or rows it names. In a surface, the line runs to its edges and the title sits on the
  gutter, where the fields start. In a body that runs edge to edge, it sits on its rows' text, with
  16 above it when it comes first. First in a UiCrudDrawer section with `:divided="false"`, it
  stands in for the section's title. Under the title of a window, a drawer or a card, it is one
  level deeper (`h3` under their `h2`).

  Spacing. A page header has no margin of its own: it and the page's content stand in a UiStack,
  `gap="title"`, 24 apart. A legend after other content opens a new section, so it adds 32px above itself. On top of
  the 16 gap of a `flex` or `grid` column, that puts it 48 below the content above, the step between
  blocks.

  Keyboard.
  Not interactive: the title takes no focus.
  - `Tab`: reaches the controls in `#actions`, which keep their own tab stops, after the title in
    the reading order; a legend holds none.

  Reader.
  - Page: `page` is the one `h1` of the page, and its description is a paragraph under it.
  - Legend: `legend` is a heading whose level follows its place: `h2` alone, the card's level in
    an untitled card, one level deeper under the title of a card, a window or a drawer.
  - Lines: borders that say nothing.

  States. None of its own: a long title wraps, and the line keeps a stub beside it. In dev, a `page`
  header inside a card, a modal or a drawer warns, and a `legend` with a description or an action
  warns and drops them.

  Not for.
  - The title of a card, a window or a drawer: UiCard, UiModal or UiDrawer carry it themselves
    (`title`).
  - The name of a field: UiField.
  - A strip of tabs over a block: UiTabs.
  - A row with a thing at its end: UiListItem.
-->
<template>
  <div
    v-if="variant === 'legend'"
    class="flex items-center [&:not(:first-child)]:mt-8 before:h-0 before:shrink-0 before:border-t before:border-border before:content-[''] after:h-0 after:min-w-4 after:flex-1 after:border-t after:border-border after:content-['']"
    :class="
      gutter
        ? [BLEED[gutter], LEGEND_DASH[gutter], 'gap-2']
        : inset
          ? [LEGEND_DASH[inset], 'gap-2 first:pt-4']
          : 'gap-3 before:w-3'
    "
  >
    <component
      :is="headingTag"
      data-grani
      class="min-w-0 text-xs/4.5 font-semibold uppercase tracking-wider text-fg-muted [overflow-wrap:anywhere]"
      >{{ title }}</component
    >
  </div>
  <div v-else class="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold text-fg [overflow-wrap:anywhere]">{{ title }}</h1>
      <p v-if="description" class="mt-2 text-sm/5.5 text-fg-muted [overflow-wrap:anywhere]">
        {{ description }}
      </p>
    </div>
    <div v-if="hasAction()" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useSlots } from 'vue'
import { isDev } from '../utils/dev'
import { renders } from '../utils/sections'
import {
  BLEED,
  CARD_DEPTH,
  CARD_TITLE_ID,
  FLAT_CARD,
  LEGEND_DASH,
  ROW_INSET,
  SURFACE_GUTTER,
} from '../utils/surface'

const props = withDefaults(
  defineProps<{
    /** The name: the page's `h1`, or the section's title on its line. */
    title: string
    /** One line under a page's title. A list page has none: the title names the list. A legend has none. */
    description?: string
    /** `page` is the first line of a page; `legend` names a section on the line above it. */
    variant?: 'page' | 'legend'
  }>(),
  { description: '', variant: 'page' },
)

defineSlots<{
  /** Actions of the page, right of the title: a primary button, a menu. A legend holds none. */
  actions(props: Record<string, never>): any
}>()

const slots = useSlots()
const hasAction = () => renders(slots.actions?.())
const gutter = inject(SURFACE_GUTTER, null)
// A body that runs edge to edge has no gutter to bleed through: the title stands on its rows' text.
const inset = inject(ROW_INSET, null)
const depth = inject(CARD_DEPTH, 0)
const cardTitle = inject(CARD_TITLE_ID, undefined)
// Alone it is an h2; in an untitled card it takes the card's level, under a card's or a window's title one deeper.
const headingTag = computed(() => `h${Math.min(depth ? depth + (cardTitle?.value ? 2 : 1) : 2, 6)}`)

if (isDev()) {
  if (props.variant === 'page' && (depth || inject(FLAT_CARD, false)))
    console.warn(
      '[grani] UiHeader: a page header inside a card, modal or drawer; they name themselves, use `legend`.',
    )
  if (props.variant === 'legend' && (props.description || hasAction()))
    console.warn('[grani] UiHeader: a legend has no description and no action; they are not shown.')
}
</script>
