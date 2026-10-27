<script lang="ts">
import { defineComponent } from 'vue'

// A demo of markup alone: the template is the whole component.
export default defineComponent({})

export const blurb =
  'Show that work is in progress where the surrounding component has no loading state of its own.'
</script>

<template>
  <DemoBlock title="Sizes" row>
    <!-- Decoration: no name, the words or the host say what is going on. -->
    <UiSpinner class="h-3 w-3" />
    <UiSpinner />
    <UiSpinner class="h-6 w-6" />
    <UiSpinner class="h-8 w-8" />
  </DemoBlock>
  <DemoBlock title="Named or not" row>
    <span class="flex items-center gap-2 text-sm text-fg-muted">
      <UiSpinner />
      Loading invoices
    </span>
    <UiSpinner aria-label="Loading invoices" class="h-6 w-6 text-fg-muted" />
  </DemoBlock>
  <DemoBlock title="Color" row>
    <UiSpinner class="h-6 w-6 text-fg-muted" />
    <UiSpinner class="h-6 w-6 text-brand" />
    <UiSpinner class="h-6 w-6 text-success-border" />
    <UiSpinner class="h-6 w-6 text-danger-border" />
  </DemoBlock>
  <!-- The places it turns by itself: each host draws it under its own `loading`. -->
  <DemoBlock title="Where it turns">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <UiButton loading>Saving</UiButton>
        <UiIconButton ariaLabel="Saving" loading />
        <UiBadge tone="info" label="Syncing" loading />
      </div>
      <UiCard :padded="false">
        <UiList>
          <UiListItem as="button" size="sm" title="Sync the bank feed" loading />
        </UiList>
      </UiCard>
    </div>
  </DemoBlock>
</template>
