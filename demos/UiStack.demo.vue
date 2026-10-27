<script lang="ts">
export const blurb =
  'Arrange related content vertically or horizontally with consistent spacing between groups, headings and sections.'
</script>

<script setup lang="ts">
interface Step {
  gap: 'tight' | 'group' | 'title' | 'block' | 'section'
  px: number
  use: string
}
const steps: Step[] = [
  { gap: 'tight', px: 8, use: 'the lines of one thing' },
  { gap: 'group', px: 16, use: 'the things of one group' },
  { gap: 'title', px: 24, use: 'a title and its text' },
  { gap: 'block', px: 48, use: 'the blocks of a page' },
  { gap: 'section', px: 96, use: 'the sections of a page' },
]
</script>

<template>
  <DemoBlock title="The scale" wide>
    <div class="flex w-full flex-wrap items-start gap-8">
      <div v-for="step in steps" :key="step.gap" class="flex w-32 flex-col gap-2">
        <p class="text-sm text-fg">
          <span class="font-medium">{{ step.gap }}</span>
          <span class="text-fg-muted"> {{ step.px }} px</span>
        </p>
        <UiStack :gap="step.gap">
          <div class="h-6 rounded-control bg-surface-muted" />
          <div class="h-6 rounded-control bg-surface-muted" />
        </UiStack>
        <p class="text-xs text-fg-muted">{{ step.use }}</p>
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Nested">
    <UiStack gap="block" class="w-full">
      <UiStack gap="title">
        <h3 class="text-base font-semibold text-fg">Account</h3>
        <UiStack gap="group">
          <UiField label="Name"><UiInput model-value="Anna Weber" /></UiField>
          <UiField label="Email"><UiInput model-value="anna@example.com" /></UiField>
        </UiStack>
      </UiStack>
      <UiStack gap="title">
        <h3 class="text-base font-semibold text-fg">Address</h3>
        <UiStack gap="group">
          <UiField label="City"><UiInput model-value="Berlin" /></UiField>
          <UiField label="Street"><UiInput model-value="Torstraße 12" /></UiField>
        </UiStack>
      </UiStack>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="A row">
    <UiStack direction="row" gap="tight">
      <span class="text-sm font-medium text-fg">Invoices</span>
      <UiBadge label="12" />
    </UiStack>
    <UiStack direction="row" gap="group">
      <UiButton variant="secondary">Cancel</UiButton>
      <UiButton>Save</UiButton>
    </UiStack>
  </DemoBlock>
</template>
