<script lang="ts">
export const blurb =
  'Keep a long value on one line with an ellipsis, and reveal the full text on hover or tap when it does not fit.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const width = ref<'narrow' | 'wide'>('narrow')
</script>

<template>
  <DemoBlock title="Base">
    <UiCard :padded="false" class="w-56">
      <div class="flex flex-col divide-y divide-border">
        <UiTruncate text="Contoso Pharmaceuticals and Laboratories" class="px-4 py-2 text-sm" />
        <UiTruncate text="Fabrikam" class="px-4 py-2 text-sm" />
        <UiTruncate text="Blue Yonder Airlines, Lisbon office" class="px-4 py-2 text-sm" />
      </div>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Fits or cut">
    <div class="flex w-full flex-col items-center gap-4">
      <!-- The same names at two widths: the cut, and its tooltip, come and go with the room. -->
      <UiCard :padded="false" :class="width === 'narrow' ? 'w-40' : 'w-96'">
        <div class="flex flex-col divide-y divide-border">
          <UiTruncate text="Contoso Pharmaceuticals and Laboratories" class="px-4 py-2 text-sm" />
          <UiTruncate text="Fabrikam" class="px-4 py-2 text-sm" />
        </div>
      </UiCard>
      <UiRadioGroup v-model="width" variant="segmented" aria-label="Width of the card">
        <UiRadio value="narrow">Narrow</UiRadio>
        <UiRadio value="wide">Wide</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
</template>
