<!-- UiSeparator: a line between groups of content. Take it between menu items, parts of a toolbar
     or groups of a UiButtonGroup.

     Spacing. It has no margin of its own: the parent's gap spaces it. On a padded surface, a
     horizontal line runs through the gutter to the edges by itself; your own `-mx-*` is only for a
     place with no gutter. A vertical line stretches to the height of its flex row; in a
     UiButtonGroup it stands across the group.

     Border. It is a border, not a fill, because forced colors keep borders.

     Keyboard. Not interactive: it takes no focus and no tab stop.

     Reader.
     - Line: a `separator` with its `aria-orientation`: a break between groups and nothing more.

     States. None: one line, horizontal or vertical, through a surface's gutter or across a row; a
     border, so forced colors keep it.

     Not for.
     - The line under a section title: UiHeader `legend`; where a legend opens a section, the legend
       is the line.
     - The line between rows of a list: UiList draws it.
     - Lines under a card's header and above its footer: UiCard draws them.
     - The lines between the flat sections of an overlay: the overlay places them, as UiDrawer
       does. -->
<template>
  <div
    role="separator"
    :aria-orientation="axis"
    :class="[LINE[axis], axis === 'horizontal' && gutter ? BLEED[gutter] : '']"
  />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { GROUP_AXIS } from '../utils/groupAxis'
import { BLEED, SURFACE_GUTTER } from '../utils/surface'

const props = defineProps<{
  /** `horizontal` spans the width between stacked blocks; `vertical` stands between items of a row. Default: across the enclosing UiButtonGroup, else horizontal. */
  orientation?: 'horizontal' | 'vertical'
}>()

const group = inject(GROUP_AXIS, null)
const gutter = inject(SURFACE_GUTTER, null)
const axis = computed(
  () => props.orientation ?? (group?.value === 'horizontal' ? 'vertical' : 'horizontal'),
)

const LINE = {
  horizontal: 'shrink-0 self-stretch border-t border-border',
  vertical: 'shrink-0 self-stretch border-s border-border',
} as const
</script>
