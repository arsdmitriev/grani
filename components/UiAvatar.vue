<!--
  UiAvatar: a round mark for a person or a thing, with a photo or initials. Take it beside a name:
  in a card header, a table cell or a UiListItem's `#media`.

  Look. The photo from `src` lies over the initials of `name`, on a pale plate in the tone. While
  the photo loads, and when it fails, the initials show at the same size. With no name and no
  photo it shows a person glyph.

  Placement. In the `#media` of a UiListItem, beside a name in a card header, in a table cell,
  and as the `xs` actor node of a UiLog beside the log line.

  Mark. A UiIndicator with `round` marks it: `sm` on the `xs` and `sm` sizes, `md` on `md`.

  Keyboard. Not interactive: no tab stop, no keys.

  Reader.
  - Beside a name: hidden (`aria-hidden`); the name beside it is what is read.
  - Alone: with `alt` or a caller's `aria-label`, an image (`role="img"`) with that name.
  - Photo and glyph: the photo has an empty `alt` and the person glyph is hidden, so nothing is
    read twice.

  States. Initials on the plate, a photo over them, a photo loading or failed (the initials show at
  the same size), no name and no photo (a person glyph); three sizes and the tones, with a
  UiIndicator mark. No hover or focus state of its own.

  Not for.
  - A state mark on it: UiIndicator `round`.
  - A state word: UiBadge.
  - A count: UiCount.
  - A glyph that acts: UiIconButton.
-->
<template>
  <span
    class="relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-pill font-medium"
    :class="[SIZE[size], toneSubtleClass(tone)]"
    :role="named ? 'img' : undefined"
    :aria-label="alt || undefined"
    :aria-hidden="named ? undefined : 'true'"
  >
    <!-- The initials stand under the photo: a slow or a dead one shows them, never a hole. -->
    <template v-if="initials">{{ initials }}</template>
    <User v-else aria-hidden="true" class="h-1/2 w-1/2" />
    <img
      v-if="shown"
      ref="img"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover"
      @error="failed = true"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue'
import { User } from '@lucide/vue'
import { isDev } from '../utils/dev'
import type { BadgeTone } from '../types/ui'
import { toneSubtleClass } from '../utils/tone'

const props = withDefaults(
  defineProps<{
    /** Whose it is; the initials come from its first two words ("Anna Petrova" is "AP"). */
    name: string
    /** A photo; when it is missing or fails to load, the initials stand in. */
    src?: string
    /** Alone, what it shows ("Anna Petrova"); beside the name leave it empty: it is decoration. */
    alt?: string
    /** `xs` 24, `sm` 32, `md` 40: beside a dense row, a row, a page row. */
    size?: 'xs' | 'sm' | 'md'
    /** The plate behind the initials. */
    tone?: BadgeTone
  }>(),
  { src: '', alt: '', size: 'sm', tone: 'brand' },
)

const SIZE = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs/4.5',
  md: 'h-10 w-10 text-sm/5.5',
} as const

const attrs = useAttrs()
// A caller's own aria-label names it too: never hidden under a name it was given.
const named = computed(() => Boolean(props.alt || attrs['aria-label']))

const img = useTemplateRef<HTMLImageElement>('img')
const failed = ref(false)
// A photo that failed before the page came alive fired its error to nobody: read it here.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth === 0) failed.value = true
})
watch(
  () => props.src,
  () => (failed.value = false),
)
const shown = computed(() => Boolean(props.src) && !failed.value)
// The first letter of each of the first two words; a word with no letter or digit ("&", "-")
// is skipped, and a letter with its accent or an emoji of several code points stays whole.
const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null
const first = (word: string) =>
  segmenter
    ? ([...segmenter.segment(word)][0]?.segment ?? '')
    : (word.match(/^\P{M}\p{M}*/u)?.[0] ?? '')
const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(w))
    .slice(0, 2)
    .map((w) => first(w.replace(/^[^\p{L}\p{N}\p{Extended_Pictographic}]+/u, '')))
    // One letter stays one: a capital that grows into two ("ß" into "SS") keeps its first.
    .map((g) => {
      const up = g.toLocaleUpperCase()
      return up.length > g.length ? g : up
    })
    .join(''),
)
if (isDev())
  watch(
    () => [props.name, props.src] as const,
    ([name, src]) => {
      if (!name.trim() && !src)
        console.warn('[grani] UiAvatar has no name and no photo: it shows a person glyph.')
    },
    { immediate: true },
  )
</script>
