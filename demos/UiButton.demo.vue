<script lang="ts">
export const blurb =
  'Start an action and see when it is running, with further presses blocked while the button is loading.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, Plus } from '@lucide/vue'

const state = ref('loading')
const FILTERS = ['Unpaid', 'Overdue', 'Mine']
const on = ref(new Set(['Unpaid']))
function toggle(name: string) {
  const next = new Set(on.value)
  if (!next.delete(name)) next.add(name)
  on.value = next
}
</script>

<template>
  <DemoBlock title="Base">
    <UiStack class="w-full max-w-md">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <UiButton variant="outline"
          ><Download aria-hidden="true" />Export the quarter as a spreadsheet</UiButton
        >
        <UiButton variant="secondary"><Plus aria-hidden="true" />New invoice</UiButton>
      </div>
      <UiCard title="INV-0042" description="Acme Corp · due Sep 30">
        <p class="text-sm text-fg">Design review and a prototype, €1 240.00 in all.</p>
        <template #footer>
          <UiButton variant="secondary">Cancel</UiButton>
          <UiButton>Save</UiButton>
        </template>
      </UiCard>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Variants">
    <div class="flex flex-col gap-4">
      <div
        v-for="variant in ['primary', 'secondary', 'outline', 'ghost', 'dashed']"
        :key="variant"
        class="flex flex-wrap gap-3"
      >
        <UiButton :variant="variant">Brand</UiButton>
        <UiButton :variant="variant" tone="success">Approve</UiButton>
        <UiButton :variant="variant" tone="warning">Archive</UiButton>
        <UiButton :variant="variant" tone="danger">Delete</UiButton>
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiButton size="xs">Extra small</UiButton>
    <UiButton>Default</UiButton>
    <UiButton size="md">Medium</UiButton>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <UiButton size="xs" variant="outline" :loading="state === 'loading'">Retry</UiButton>
        <UiButton :loading="state === 'loading'" loading-text="Saving…">Save</UiButton>
        <UiButton size="md" variant="secondary" :loading="state === 'loading'">Send</UiButton>
        <UiButton
          variant="secondary"
          :loading="state === 'loading'"
          loading-text=""
          aria-label="Add a row"
          ><Plus aria-hidden="true"
        /></UiButton>
        <UiButton variant="outline" :loading="state === 'loading'"
          >Upload<template #loading>Uploading your file…</template></UiButton
        >
      </div>
      <UiRadioGroup v-model="state" variant="segmented" aria-label="State of the buttons">
        <UiRadio value="idle">Idle</UiRadio>
        <UiRadio value="loading">Loading</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Pressed">
    <div role="group" aria-label="Filters" class="flex gap-2">
      <UiButton
        v-for="name in FILTERS"
        :key="name"
        variant="outline"
        size="xs"
        :pressed="on.has(name)"
        @click="toggle(name)"
        >{{ name }}</UiButton
      >
    </div>
  </DemoBlock>
  <DemoBlock title="Link" row>
    <UiButton to="/components/link">Open record</UiButton>
    <UiButton variant="outline" to="/components/icon-button" loading>Compare</UiButton>
    <UiButton variant="outline" to="https://status.example.com">Status page</UiButton>
  </DemoBlock>
  <DemoBlock title="Dashed">
    <div class="flex w-full max-w-sm flex-col gap-2">
      <UiCard size="sm" title="Goal 1" description="30 minutes a day" />
      <UiButton variant="dashed" block><Plus aria-hidden="true" />Add a goal</UiButton>
    </div>
  </DemoBlock>
  <DemoBlock title="Disabled" row>
    <UiButton disabled>Unavailable</UiButton>
    <UiButton variant="secondary" disabled>Unavailable</UiButton>
    <UiButton variant="outline" disabled>Unavailable</UiButton>
    <UiButton variant="ghost" disabled>Unavailable</UiButton>
    <UiButton variant="dashed" disabled>Unavailable</UiButton>
    <UiButton to="/components/link" disabled>A link, off</UiButton>
    <!-- With a reason: still reached by Tab, and the reason shows on hover, focus and a tap. -->
    <UiButton disabled disabled-reason="Add the client’s email first">Save</UiButton>
  </DemoBlock>
</template>
