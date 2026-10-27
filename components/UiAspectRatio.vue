<!--
  UiAspectRatio: a box of fixed proportions for a photo, a video or an iframe. Take it wherever
  media must not move the page as it loads.

  Fit. `fit` crops the media to fill the box (`cover`) or shows it whole (`contain`).

  Your part. You write the `alt`, paint the background shown while loading and in the bands of
  `contain`, and place any overlay with `absolute`; a badge, a link or an image placed that way
  keeps its own size.

  Placement. It stands alone in a grid of media, or in the `#image` of a framed UiCard. The card
  squares the image's corners, clips it, and draws the ring itself for a focused linked image. Beside the
  card's body it fills the column, and `ratio` does not apply. Anywhere else the box rounds its own
  corners, and the link's focus halo shows round it.

  Keyboard.
  Not interactive: the box takes no focus.
  - `Tab`: reaches a link in the slot, which keeps its own tab stop. While that link is focused,
    the box lets the halo show outside it, and the link clips the image instead.

  Reader.
  - Media: nothing of its own; a screen reader hears the media, so the `alt` you write on the
    image is all there is.

  States. `cover` crops the media; `contain` shows it whole between bands of your background, which
  also shows while the media loads. A linked image dims a little on hover and rings on focus. A
  ratio that is not a finite number above zero falls back to 16 / 9 and warns in dev.

  Not for.
  - An avatar: UiAvatar.
  - A block holding the page's shape while loading: UiSkeleton.
  - A chart: UiChartCard.
-->
<template>
  <div
    data-aspect
    class="relative overflow-hidden rounded-card has-[>div>a:not(.absolute):focus-visible]:overflow-visible"
    :style="{ aspectRatio: String(safeRatio) }"
  >
    <div
      :class="[
        'absolute inset-0 rounded-[inherit] [&>*:only-child]:h-full [&>*:only-child]:w-full',
        MEDIA,
        FIT[fit],
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isDev } from '../utils/dev'

const props = withDefaults(
  defineProps<{
    /** Width divided by height, finite and above zero. Examples: `16 / 9`, `1`, `4 / 3`. */
    ratio?: number
    /** How media meets the box: `cover` crops it to fill, `contain` shows it whole. */
    fit?: 'cover' | 'contain'
  }>(),
  { ratio: 16 / 9, fit: 'cover' },
)

defineSlots<{
  /** The media. A lone child fills the box; beside an overlay, an image, a picture, a video, an iframe, a canvas or a link still fills it. */
  default(props: Record<string, never>): any
}>()

// Media fills the box beside a badge too; an overlay placed `absolute` keeps its own size; a focused
// link lets its halo out and clips the image.
const MEDIA = [
  '[&>img:not(.absolute)]:h-full [&>img:not(.absolute)]:w-full',
  '[&>video]:h-full [&>video]:w-full [&>iframe]:h-full [&>iframe]:w-full [&>canvas]:h-full [&>canvas]:w-full',
  '[&>picture]:block [&>picture]:h-full [&>picture]:w-full [&>picture>img]:h-full [&>picture>img]:w-full',
  '[&>a:not(.absolute)]:block [&>a:not(.absolute)]:h-full [&>a:not(.absolute)]:w-full [&>a:not(.absolute)]:overflow-hidden [&>a:not(.absolute)]:rounded-[inherit]',
  '[&>a:not(.absolute)>img]:h-full [&>a:not(.absolute)>img]:w-full [&>a:not(.absolute)>picture]:block [&>a:not(.absolute)>picture]:h-full [&>a:not(.absolute)>picture]:w-full [&>a:not(.absolute)>picture>img]:h-full [&>a:not(.absolute)>picture>img]:w-full',
  '[&>a:not(.absolute)_img]:transition-opacity [&>a:not(.absolute)_img]:duration-normal [&>a:not(.absolute)_img]:ease-standard [&>a:not(.absolute):hover_img]:opacity-90',
].join(' ')
const FIT = {
  cover:
    '[&>img:not(.absolute)]:object-cover [&>video]:object-cover [&>picture>img]:object-cover [&>a:not(.absolute)>img]:object-cover [&>a:not(.absolute)>picture>img]:object-cover',
  contain:
    '[&>img:not(.absolute)]:object-contain [&>video]:object-contain [&>picture>img]:object-contain [&>a:not(.absolute)>img]:object-contain [&>a:not(.absolute)>picture>img]:object-contain',
} as const

// CSS silently drops a zero or non-finite ratio and the box collapses.
const safeRatio = computed(() => {
  const ratio = Number(props.ratio)
  if (Number.isFinite(ratio) && ratio > 0) return ratio
  if (isDev()) console.warn('[grani] UiAspectRatio got an invalid ratio; using 16 / 9.')
  return 16 / 9
})
</script>
