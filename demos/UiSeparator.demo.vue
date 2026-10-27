<script lang="ts">
export const blurb = 'Separate groups in a menu, toolbar or card with a simple dividing line.'
</script>

<script setup lang="ts">
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Ellipsis,
  Italic,
  Link,
  Pencil,
  Trash2,
  Underline,
} from '@lucide/vue'
</script>

<template>
  <DemoBlock title="Between blocks">
    <UiCard title="Session" class="w-full max-w-sm">
      <UiStack class="text-sm">
        <p class="text-fg">Signed in as name@example.com</p>
        <UiSeparator />
        <p class="text-fg-muted">Last sign-in yesterday at 18:04</p>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="In a row" row>
    <UiStack direction="row" gap="tight">
      <UiIconButton :icon="Bold" ariaLabel="Bold" variant="ghost" />
      <UiIconButton :icon="Italic" ariaLabel="Italic" variant="ghost" />
      <UiIconButton :icon="Underline" ariaLabel="Underline" variant="ghost" />
      <UiSeparator orientation="vertical" />
      <UiIconButton :icon="Link" ariaLabel="Link" variant="ghost" />
    </UiStack>
  </DemoBlock>
  <DemoBlock title="In a button group" row>
    <UiStack direction="row" gap="block" align="start">
      <UiButtonGroup ariaLabel="Formatting">
        <UiButtonGroup ariaLabel="Style">
          <UiIconButton :icon="Bold" ariaLabel="Bold" variant="outline" />
          <UiIconButton :icon="Italic" ariaLabel="Italic" variant="outline" />
          <UiIconButton :icon="Underline" ariaLabel="Underline" variant="outline" />
        </UiButtonGroup>
        <UiSeparator />
        <UiIconButton :icon="Link" ariaLabel="Link" variant="outline" />
      </UiButtonGroup>
      <UiButtonGroup ariaLabel="Alignment" orientation="vertical">
        <UiButtonGroup ariaLabel="Horizontal" orientation="vertical">
          <UiIconButton :icon="AlignLeft" ariaLabel="Left" variant="outline" />
          <UiIconButton :icon="AlignCenter" ariaLabel="Center" variant="outline" />
          <UiIconButton :icon="AlignRight" ariaLabel="Right" variant="outline" />
        </UiButtonGroup>
        <UiSeparator />
        <UiIconButton :icon="Link" ariaLabel="Link" variant="outline" />
      </UiButtonGroup>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="In a menu">
    <UiMenu>
      <template #trigger>
        <UiIconButton :icon="Ellipsis" ariaLabel="Actions" variant="outline" />
      </template>
      <UiListItem as="button" title="Edit">
        <template #media><Pencil /></template>
      </UiListItem>
      <UiListItem as="button" title="Duplicate">
        <template #media><Copy /></template>
      </UiListItem>
      <UiSeparator />
      <UiListItem as="button" title="Delete" tone="danger">
        <template #media><Trash2 /></template>
      </UiListItem>
    </UiMenu>
  </DemoBlock>
</template>
