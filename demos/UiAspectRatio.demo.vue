<script lang="ts">
export const blurb =
  'Reserve space for a photo or video before it loads, so nearby content stays in place.'
</script>

<template>
  <DemoBlock title="Fit">
    <UiStack gap="title" align="center" class="w-full">
      <UiAspectRatio :fit="fit" class="w-80 bg-neutral-subtle">
        <img :src="photo" alt="A red and white lighthouse over turquoise water" />
      </UiAspectRatio>
      <UiRadioGroup v-model="fit" variant="segmented" aria-label="How the photo meets the box">
        <UiRadio value="cover">Cover</UiRadio>
        <UiRadio value="contain">Contain</UiRadio>
      </UiRadioGroup>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Ratio" row>
    <UiStack direction="row" gap="title" align="end" class="flex-wrap justify-center">
      <UiStack v-for="r in RATIOS" :key="r.label" gap="tight" class="w-40">
        <UiAspectRatio :ratio="r.ratio" class="bg-neutral-subtle">
          <img :src="photo" alt="A red and white lighthouse over turquoise water" />
        </UiAspectRatio>
        <p class="text-xs text-fg-muted">{{ r.label }}</p>
      </UiStack>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Overlay">
    <UiAspectRatio :ratio="4 / 3" class="w-64 bg-neutral-subtle">
      <img :src="photo" alt="A red and white lighthouse over turquoise water" />
      <UiBadge label="New" class="absolute start-2 top-2" />
      <UiButton to="#lighthouse" size="xs" variant="secondary" class="absolute end-2 top-2">
        Download
      </UiButton>
    </UiAspectRatio>
  </DemoBlock>
  <DemoBlock title="Link">
    <UiAspectRatio :ratio="4 / 3" class="w-64 bg-neutral-subtle">
      <a href="#lighthouse">
        <img :src="photo" alt="Open the lighthouse photo" />
      </a>
    </UiAspectRatio>
  </DemoBlock>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// A portrait photo in landscape boxes: cover crops the tower's top and foot, contain shows it whole.
// From Unsplash, free to use without credit.
import photo from './media/lighthouse.webp'

const fit = ref<'cover' | 'contain'>('cover')
const RATIOS = [
  { ratio: 16 / 9, label: '16 / 9' },
  { ratio: 4 / 3, label: '4 / 3' },
  { ratio: 1, label: '1' },
]
</script>
