<script lang="ts">
export const blurb = 'Mark an item that needs attention with a count or dot in its corner.'
</script>

<script setup lang="ts">
import { Bell, Inbox, MessageSquare } from '@lucide/vue'

const corners = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const
</script>

<template>
  <DemoBlock title="Count" row>
    <div class="flex items-center gap-8">
      <UiIndicator :count="0">
        <UiIconButton :icon="Bell" ariaLabel="Notifications, none new" />
      </UiIndicator>
      <UiIndicator :count="3">
        <UiIconButton :icon="Bell" ariaLabel="Notifications, 3 new" />
      </UiIndicator>
      <UiIndicator :count="12">
        <UiIconButton :icon="Inbox" ariaLabel="Inbox, 12 new" />
      </UiIndicator>
      <UiIndicator :count="150">
        <UiIconButton :icon="MessageSquare" ariaLabel="Messages, more than 99 new" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Dot" row>
    <div class="flex items-center gap-8">
      <UiIndicator dot>
        <UiIconButton :icon="Bell" ariaLabel="Notifications, new" />
      </UiIndicator>
      <UiIndicator dot tone="success" placement="bottom-end" round>
        <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova, online" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Pulse" row>
    <div class="flex items-center gap-8">
      <UiIndicator :count="1" pulse>
        <UiIconButton :icon="Bell" ariaLabel="Notifications, 1 new" />
      </UiIndicator>
      <UiIndicator dot pulse tone="success" placement="bottom-end" round>
        <UiAvatar name="Support" size="md" alt="Support, online" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <div class="flex items-center gap-8">
      <UiIndicator :count="3" size="sm">
        <UiIconButton :icon="Bell" size="xs" ariaLabel="Notifications, 3 new" />
      </UiIndicator>
      <UiIndicator :count="3">
        <UiIconButton :icon="Bell" ariaLabel="Notifications, 3 new" />
      </UiIndicator>
      <UiIndicator :count="3">
        <UiIconButton :icon="Bell" size="md" ariaLabel="Notifications, 3 new" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="On a muted surface" row>
    <div
      class="flex items-center gap-8 rounded-card bg-surface-muted p-4 [--ui-indicator-ring:var(--color-surface-muted)]"
    >
      <UiIndicator :count="5">
        <UiIconButton :icon="Inbox" ariaLabel="Inbox, 5 new" />
      </UiIndicator>
      <UiIndicator dot tone="success" placement="bottom-end" round>
        <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova, online" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Corners" row>
    <div class="flex items-center gap-8">
      <UiIndicator v-for="corner in corners" :key="corner" :count="2" :placement="corner">
        <UiIconButton :icon="Bell" :ariaLabel="`Notifications, 2 new (${corner})`" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Max" row>
    <div class="flex items-center gap-8">
      <UiIndicator v-slot="{ text }" :count="12" :max="9">
        <UiIconButton :icon="Inbox" :ariaLabel="`Inbox, ${text} new`" />
      </UiIndicator>
    </div>
  </DemoBlock>
  <DemoBlock title="Tones" row>
    <div class="flex items-center gap-8">
      <UiIndicator :count="4" tone="brand">
        <UiIconButton :icon="Inbox" ariaLabel="Inbox, 4 new" />
      </UiIndicator>
      <UiIndicator :count="2" tone="success">
        <UiIconButton :icon="Bell" ariaLabel="Approved, 2 new" />
      </UiIndicator>
      <UiIndicator :count="7" tone="neutral">
        <UiIconButton :icon="MessageSquare" ariaLabel="Drafts, 7" />
      </UiIndicator>
    </div>
  </DemoBlock>
</template>
