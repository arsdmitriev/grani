<script lang="ts">
export const blurb =
  'Get a short hint on hover, keyboard focus or tap; anything essential stays on the page outside the tooltip.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Columns3, RotateCcw } from '@lucide/vue'

const columnsOpen = ref(false)
</script>

<template>
  <DemoBlock title="Sides" row>
    <UiTooltip content="Above, the default" side="top">
      <UiButton variant="outline">top</UiButton>
    </UiTooltip>
    <UiTooltip content="Below" side="bottom">
      <UiButton variant="outline">bottom</UiButton>
    </UiTooltip>
    <UiTooltip content="On the left, for a narrow column" side="left">
      <UiButton variant="outline">left</UiButton>
    </UiTooltip>
    <UiTooltip content="On the right, clear of the rows below" side="right">
      <UiButton variant="outline">right</UiButton>
    </UiTooltip>
  </DemoBlock>
  <DemoBlock title="Dense" row>
    <UiTooltip content="Difficulty 7 of 10">
      <UiBadge tabindex="0" tone="warning" label="7" />
    </UiTooltip>
    <UiTooltip content="Rating 4 of 5">
      <UiBadge tabindex="0" tone="success" label="4" />
    </UiTooltip>
  </DemoBlock>
  <DemoBlock title="Long" row>
    <UiTooltip
      content="Counts only the rows in the current filter and period; deleted records are left out, refunds are subtracted on the day they post."
    >
      <UiButton variant="outline">How is the total counted?</UiButton>
    </UiTooltip>
    <UiTooltip content="inv_7f3a9c2e1b4d8f6a0c5e7b9d2f4a6c8e0b1d3f5a7c9e">
      <UiButton variant="outline">The invoice id</UiButton>
    </UiTooltip>
  </DemoBlock>
  <DemoBlock title="Popover" row>
    <UiPopover>
      <template #trigger>
        <UiTooltip content="Columns">
          <UiIconButton :icon="Columns3" variant="outline" ariaLabel="Columns" />
        </UiTooltip>
      </template>
      <p class="text-sm text-fg-muted">The panel the button opens; a tap only opens it.</p>
    </UiPopover>
  </DemoBlock>
  <DemoBlock title="Disabled">
    <div class="flex items-center gap-3">
      <UiButton disabled>Export</UiButton>
      <span class="text-sm text-fg-muted">Pick a period to export.</span>
    </div>
  </DemoBlock>
  <DemoBlock title="Edge">
    <div class="flex w-full justify-end">
      <UiTooltip content="Pushed back inside the screen, its tail still on the button" side="right">
        <UiButton variant="outline">At the right edge</UiButton>
      </UiTooltip>
    </div>
  </DemoBlock>
  <DemoBlock title="Window">
    <UiButton variant="outline" @click="columnsOpen = true">Edit columns</UiButton>
    <UiModal v-model:open="columnsOpen" title="Columns">
      <div class="flex items-center gap-2">
        <span class="flex-1 text-sm text-fg-muted">Client, Total, Due</span>
        <UiTooltip content="Back to the default columns">
          <UiIconButton :icon="RotateCcw" variant="ghost" ariaLabel="Reset" />
        </UiTooltip>
      </div>
      <p class="mt-3 text-xs text-fg-subtle">
        Tab to Reset: the first Escape takes its hint, the second closes the window.
      </p>
    </UiModal>
  </DemoBlock>
</template>
