<script lang="ts">
export const blurb =
  'See how much of a task or target is complete when its progress can be measured.'
</script>

<script setup lang="ts">
import type { Tone } from '../types/ui'

const tones: Tone[] = ['brand', 'info', 'success', 'warning', 'danger', 'neutral']
</script>

<template>
  <DemoBlock title="Bar">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiProgress :value="3200" :max="10000" aria-label="Cushion" />
      <UiProgress :value="7" :max="10" tone="success" class="h-1.5" aria-label="Done" />
      <UiProgress
        :value="14"
        :max="10"
        tone="danger"
        aria-label="Budget"
        value-text="14 of 10, 4 over"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Segments">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiProgress
        :value="3"
        :max="10"
        :step="1"
        value-text="3 of 10 payments"
        aria-label="Payments"
      />
      <!-- 4.5 steps reached: four segments filled, the fifth still to go. -->
      <UiProgress :value="450" :max="1200" :step="100" class="h-3" aria-label="Savings" />
      <!-- Thirty steps are past maxSegments (24), a finger cannot tell them apart: continuous again. -->
      <UiProgress :value="12" :max="30" :step="1" value-text="12 of 30 days" aria-label="Days" />
      <!-- No step reached: all-empty segments would read as broken, so the bar is continuous too. -->
      <UiProgress
        :value="0"
        :max="10"
        :step="1"
        value-text="0 of 10 payments"
        aria-label="Payments, none yet"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Thermometer">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiProgress
        v-for="v in [1, 4, 7, 10]"
        :key="v"
        :value="v"
        :max="10"
        variant="thermometer"
        :aria-label="`Health, sample ${v}`"
      />
      <UiProgress :value="8" :max="10" variant="thermometer" invert aria-label="Load" />
    </div>
  </DemoBlock>
  <DemoBlock title="Tones">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiProgress
        v-for="tone in tones"
        :key="tone"
        :value="60"
        :tone="tone"
        :aria-label="`Tone ${tone}`"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Empty to over">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiProgress :value="0" aria-label="Not started" />
      <UiProgress :value="100" tone="success" aria-label="Finished" />
      <!-- Past the target the bar stops full, and the words say by how much. -->
      <UiProgress
        :value="14"
        :max="10"
        tone="warning"
        value-text="14 of 10, over"
        aria-label="Seats"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Unknown length">
    <div class="flex w-full max-w-sm flex-col gap-2">
      <span class="text-sm text-fg-muted">Uploading statement.pdf</span>
      <UiProgress indeterminate aria-label="Uploading statement.pdf" />
    </div>
  </DemoBlock>
</template>
