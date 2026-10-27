# Aspect ratio (`UiAspectRatio`)

> Reserve space for a photo or video before it loads, so nearby content stays in place.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/aspect-ratio

Also called media box, image placeholder.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiAspectRatio, UiRadioGroup, UiRadio } from 'grani-ui'

const photo = '/lighthouse.webp' // your own picture here

const fit = ref<'cover' | 'contain'>('cover')
</script>

<template>
  <UiStack gap="title" align="center" class="w-full">
    <UiAspectRatio :fit="fit" class="w-80 bg-neutral-subtle">
      <img :src="photo" alt="A red and white lighthouse over turquoise water" />
    </UiAspectRatio>
    <UiRadioGroup v-model="fit" variant="segmented" aria-label="How the photo meets the box">
      <UiRadio value="cover">Cover</UiRadio>
      <UiRadio value="contain">Contain</UiRadio>
    </UiRadioGroup>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep nearby content in place while loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Give the box a width (its column or a class), and set the background shown while it waits.

## Why it works this way

A box of fixed proportions for a photo, a video or an iframe. Take it wherever media must not move the page as it loads.

**Fit.** `fit` crops the media to fill the box (`cover`) or shows it whole (`contain`).

**Your part.** You write the `alt`, paint the background shown while loading and in the bands of `contain`, and place any overlay with `absolute`; a badge, a link or an image placed that way keeps its own size.

**Placement.** It stands alone in a grid of media, or in the `#image` of a framed UiCard. The card squares the image's corners, clips it, and draws the ring itself for a focused linked image. Beside the card's body it fills the column, and `ratio` does not apply. Anywhere else the box rounds its own corners, and the link's focus halo shows round it.

### Keyboard

Not interactive: the box takes no focus.
- `Tab`: reaches a link in the slot, which keeps its own tab stop. While that link is focused, the box lets the halo show outside it, and the link clips the image instead.

### Screen reader

- Media: nothing of its own; a screen reader hears the media, so the `alt` you write on the image is all there is.

### States

`cover` crops the media; `contain` shows it whole between bands of your background, which also shows while the media loads. A linked image dims a little on hover and rings on focus. A ratio that is not a finite number above zero falls back to 16 / 9 and warns in dev.

### When to use another component

- An avatar: UiAvatar.
- A block holding the page's shape while loading: UiSkeleton.
- A chart: UiChartCard.

## Examples

### Ratio

```vue
<script setup lang="ts">
import { UiStack, UiAspectRatio } from 'grani-ui'

const photo = '/lighthouse.webp' // your own picture here

const RATIOS = [
  { ratio: 16 / 9, label: '16 / 9' },
  { ratio: 4 / 3, label: '4 / 3' },
  { ratio: 1, label: '1' },
]
</script>

<template>
  <UiStack direction="row" gap="title" align="end" class="flex-wrap justify-center">
    <UiStack v-for="r in RATIOS" :key="r.label" gap="tight" class="w-40">
      <UiAspectRatio :ratio="r.ratio" class="bg-neutral-subtle">
        <img :src="photo" alt="A red and white lighthouse over turquoise water" />
      </UiAspectRatio>
      <p class="text-xs text-fg-muted">{{ r.label }}</p>
    </UiStack>
  </UiStack>
</template>

```

### Overlay

```vue
<script setup lang="ts">
import { UiAspectRatio, UiBadge, UiButton } from 'grani-ui'

const photo = '/lighthouse.webp' // your own picture here
</script>

<template>
  <UiAspectRatio :ratio="4 / 3" class="w-64 bg-neutral-subtle">
    <img :src="photo" alt="A red and white lighthouse over turquoise water" />
    <UiBadge label="New" class="absolute start-2 top-2" />
    <UiButton to="#lighthouse" size="xs" variant="secondary" class="absolute end-2 top-2">
      Download
    </UiButton>
  </UiAspectRatio>
</template>

```

### Link

```vue
<script setup lang="ts">
import { UiAspectRatio } from 'grani-ui'

const photo = '/lighthouse.webp' // your own picture here
</script>

<template>
  <UiAspectRatio :ratio="4 / 3" class="w-64 bg-neutral-subtle">
    <a href="#lighthouse">
      <img :src="photo" alt="Open the lighthouse photo" />
    </a>
  </UiAspectRatio>
</template>

```

## API

Props:
- `ratio`: `number` (default `16 / 9`) — Width divided by height, finite and above zero. Examples: `16 / 9`, `1`, `4 / 3`.
- `fit`: `"cover" | "contain"` = `cover | contain` (default `"cover"`) — How media meets the box: `cover` crops it to fill, `contain` shows it whole.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `Record<string, never>` — The media. A lone child fills the box; beside an overlay, an image, a picture, a video, an iframe, a canvas or a link still fills it.

## How it behaves

### Stable dimensions

- When: a photo, a video or an embedded frame is on its way.
- Props: `ratio`, the media in the slot.
- Guarantee: The box takes its height from its width and ratio before the media arrives, so the text below stays where it is when the media loads or fails.
- Without it: An image has no size until it arrives: the space is empty, then everything below jumps down.
- Code: `<UiAspectRatio :ratio="4 / 3" class="bg-neutral-subtle">
  <img :src="photo" alt="…" />
</UiAspectRatio>`
- Your part: Give the box a width (its column or a class), and set the background shown while it waits.
- Proof, in the repository's tests (UiAspectRatio.spec.ts, not in the package): "The box holds its place before the media loads: its proportions are its own."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt


The patterns: https://grani.arseni.work/patterns
