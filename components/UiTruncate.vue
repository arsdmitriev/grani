<!--
  UiTruncate: one line of text cut with an ellipsis, its whole text in a UiTooltip while it is cut.
  Take it for a name or a title in a narrow place: a table cell, a list row, a file name.

  Tooltip. While the text is really cut, the whole text shows in the tooltip on hover and tap, as
  UiDateCell shows the full date; text that fits has no tooltip. The cut is measured, not assumed:
  when a column widens or the text changes, it is measured again, and the tooltip follows.

  Props. `text` is the only prop; markup in a slot handles its own cut. The root is a block `<span>`
  with no tab stop, and attributes land on it.

  Keyboard. No tab stop: the span is not focusable, so the tooltip opens on hover and on tap, not
  from the keyboard; for the keyboard, put a control beside it that leads to the whole text.

  Reader.
  - Text: the whole text, always: the cut is CSS, and the span holds every character.
  - Tooltip: while shown, it describes the span (`aria-describedby`) with the same words again.

  States. Fits, with no tooltip and no native `title`; cut, with the whole text in the tooltip on
  hover and tap. The cut is measured on mount, on resize, when a web font arrives and when `text`
  changes, with one pixel of slack; an empty text is a cut of nothing.

  Not for.
  - Markup in a slot: it handles its own cut (`truncate` on the element).
  - A date: UiDateCell.
  - The label of a badge: UiBadge cuts it itself.
  - Text that may wrap: plain text.
-->
<template>
  <UiTooltip :content="clipped ? text : ''">
    <span ref="el" v-bind="$attrs" class="block truncate" @pointerenter="measure">{{ text }}</span>
  </UiTooltip>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import UiTooltip from './UiTooltip.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** The text; the whole of it goes to the tooltip while it is cut. */
  text: string
}>()

const el = ref<HTMLElement | null>(null)
const clipped = ref(false)
// One pixel of slack: a subpixel round-off must not open a tooltip on text that fits.
const measure = () => {
  const s = el.value
  clipped.value = !!s && s.scrollWidth > s.clientWidth + 1
}
let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && el.value) {
    observer = new ResizeObserver(measure)
    observer.observe(el.value)
  }
  // A web font arriving later changes the text's width, not the box's.
  document.fonts?.ready.then(measure)
})
// A new text is measured after it paints: the box did not move, so the observer stays quiet.
watch(() => props.text, measure, { flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())
defineExpose({ measure, text: () => props.text })
</script>
