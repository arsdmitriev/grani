<script lang="ts">
export const blurb =
  'Keep related controls together, such as a main action and its menu or a field and its submit button.'
</script>

<script setup lang="ts">
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Clock,
  Copy,
  Ellipsis,
  Flag,
  Minus,
  Pencil,
  Plus,
  Send,
  Trash2,
} from '@lucide/vue'
import { ref } from 'vue'
import { useConfirm } from '../composables/useConfirm'

const query = ref('a')

const { confirm } = useConfirm()
const remove = () =>
  confirm({
    title: 'Delete the message?',
    message: 'It is removed for everyone. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
  })
</script>

<template>
  <DemoBlock title="Base">
    <UiButtonGroup ariaLabel="Message actions">
      <UiButtonGroup ariaLabel="Back">
        <UiIconButton :icon="ArrowLeft" ariaLabel="Back to the inbox" />
      </UiButtonGroup>
      <UiButtonGroup ariaLabel="Triage">
        <UiButton variant="outline">
          <Archive aria-hidden="true" />
          Archive
        </UiButton>
        <UiButton variant="outline">
          <Flag aria-hidden="true" />
          Report
        </UiButton>
      </UiButtonGroup>
      <UiButtonGroup ariaLabel="Snooze">
        <UiButton variant="outline">
          <Clock aria-hidden="true" />
          Snooze
        </UiButton>
        <UiMenu align="end">
          <template #trigger>
            <UiIconButton :icon="Ellipsis" ariaLabel="More actions" />
          </template>
          <UiListItem as="button" title="Edit">
            <template #media><Pencil /></template>
          </UiListItem>
          <UiListItem as="button" title="Delete" tone="danger" @click="remove">
            <template #media><Trash2 /></template>
          </UiListItem>
        </UiMenu>
      </UiButtonGroup>
    </UiButtonGroup>
  </DemoBlock>
  <DemoBlock title="Split button" row>
    <UiButtonGroup ariaLabel="Save">
      <UiButton>Save</UiButton>
      <UiMenu align="end">
        <template #trigger>
          <UiIconButton variant="primary" :icon="ChevronDown" ariaLabel="More ways to save" />
        </template>
        <UiListItem as="button" title="Save and new">
          <template #media><Plus /></template>
        </UiListItem>
        <UiListItem as="button" title="Save a copy">
          <template #media><Copy /></template>
        </UiListItem>
      </UiMenu>
    </UiButtonGroup>
    <UiButtonGroup ariaLabel="Send">
      <UiButton variant="outline"><Send aria-hidden="true" />Send</UiButton>
      <UiMenu align="end">
        <template #trigger>
          <UiIconButton :icon="ChevronDown" ariaLabel="More ways to send" />
        </template>
        <UiListItem as="button" title="Send later">
          <template #media><Clock /></template>
        </UiListItem>
      </UiMenu>
    </UiButtonGroup>
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField
      label="Search"
      :error="query.trim().length < 2 ? 'Type at least two letters.' : undefined"
      class="w-80"
    >
      <UiButtonGroup>
        <UiInput v-model="query" placeholder="Search records" />
        <UiButton variant="outline">Search</UiButton>
      </UiButtonGroup>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Vertical">
    <UiButtonGroup ariaLabel="Zoom" orientation="vertical">
      <UiIconButton :icon="Plus" ariaLabel="Zoom in" />
      <UiIconButton :icon="Minus" ariaLabel="Zoom out" />
    </UiButtonGroup>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiButtonGroup v-for="size in ['xs', 'sm', 'md']" :key="size" :ariaLabel="`Share, ${size}`">
      <UiButton variant="outline" :size="size">Copy</UiButton>
      <UiButton variant="outline" :size="size">Share</UiButton>
      <UiButton variant="outline" :size="size">Export</UiButton>
    </UiButtonGroup>
  </DemoBlock>
  <DemoBlock title="Disabled" row>
    <UiButtonGroup ariaLabel="Send">
      <UiButton>Send</UiButton>
      <UiButton variant="secondary" disabled>Schedule</UiButton>
    </UiButtonGroup>
    <UiButtonGroup ariaLabel="Draft">
      <UiButton variant="outline">Save</UiButton>
      <UiButton variant="outline" disabled>Discard</UiButton>
      <UiButton variant="outline" to="/components/button">Preview</UiButton>
    </UiButtonGroup>
  </DemoBlock>
</template>
