<script lang="ts">
export const blurb = 'Understand why an area is empty and what you can do next.'
</script>

<script setup lang="ts">
import { Inbox, Plus, SearchX } from '@lucide/vue'
</script>

<template>
  <DemoBlock title="Nothing yet">
    <UiNoData
      title="No metrics yet"
      description="Add the first one and its chart starts from today."
    >
      <template #media><Inbox /></template>
      <template #actions>
        <UiButton>Add a metric</UiButton>
      </template>
    </UiNoData>
  </DemoBlock>
  <DemoBlock title="Nothing matches">
    <UiNoData
      title="Nothing matches"
      description="No invoice is both paid and from the kiosk. Change the filters or reset them."
    >
      <template #media><SearchX /></template>
      <template #actions>
        <UiButton variant="secondary">Reset the filters</UiButton>
      </template>
    </UiNoData>
  </DemoBlock>
  <DemoBlock title="The load failed">
    <UiNoData
      tone="danger"
      title="The list did not load"
      description="The server did not answer. Check the connection and try again."
    >
      <template #actions>
        <UiButton variant="secondary">Retry</UiButton>
      </template>
    </UiNoData>
  </DemoBlock>
  <DemoBlock title="Section in a drawer">
    <UiNoData size="sm" description="Add items and the total will follow.">
      <template #media><Plus /></template>
    </UiNoData>
  </DemoBlock>
  <DemoBlock title="In a card">
    <UiCard title="Payments" empty class="w-full max-w-sm">
      <template #empty>
        <UiNoData
          size="sm"
          title="No payments yet"
          description="The first one appears here once an invoice is paid."
        >
          <template #media><Inbox /></template>
        </UiNoData>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Without a glyph">
    <UiNoData title="No notes" description="Nobody has written about this client yet." />
  </DemoBlock>
</template>
