<script lang="ts">
export const blurb =
  'Give a rating on a short labeled scale and, where clearing is allowed, take it back by choosing the same value again.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const difficulty = ref(6)
const rating = ref(null)
const energy = ref(8)
const effort = ref(6)
const distance = ref(3)
const small = ref(4)
const regular = ref(7)
const needed = ref(null)
const pain = ref(null)
// The app answers each mark: a low one needs a comment first, so it is refused and the bar stays.
const kept = ref<number | null>(4)
const refusal = ref<string>()
function ask(v: number | null) {
  if (v != null && v <= 2) {
    refusal.value = 'A mark of 2 or less needs a comment. Write it first.'
    return
  }
  refusal.value = undefined
  kept.value = v
}
const sentEffort = ref(7)
// The mark comes with the record: until it does, the field draws the scale's shape.
const markState = ref<'loading' | 'loaded'>('loading')
const loadedMark = ref(6)
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Difficulty" group>
        <UiScaleInput v-model="difficulty" low-label="easy" high-label="hard" />
      </UiField>
      <UiField
        label="Rating"
        description="Empty until you decide. A click on the mark clears it."
        group
      >
        <UiScaleInput v-model="rating" :max="5" low-label="meh" high-label="top" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Thermometer">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Energy" group>
        <UiScaleInput v-model="energy" variant="thermometer" low-label="empty" high-label="full" />
      </UiField>
      <UiField label="Effort" group>
        <UiScaleInput
          v-model="effort"
          variant="thermometer"
          invert
          low-label="easy"
          high-label="hard"
        />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Unit">
    <!-- Standalone: no field around it, so ariaLabel names it. -->
    <div class="w-80 max-w-full">
      <UiScaleInput
        v-model="distance"
        :max="8"
        unit="km"
        :show-numbers="false"
        aria-label="Distance"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex w-80 max-w-full flex-col items-center gap-6">
      <!-- The page's own region says the load, as a skeleton placed by hand needs; it stays mounted. -->
      <span role="status" class="sr-only">{{ markState === 'loading' ? 'Loading' : '' }}</span>
      <UiField
        label="Difficulty"
        group
        class="w-full"
        :aria-busy="markState === 'loading' || undefined"
      >
        <!-- The scale's shape while its mark is on its way: the readout's line, the bar, the words. -->
        <div v-if="markState === 'loading'">
          <div class="mb-2 flex h-5.5 items-center justify-end">
            <UiSkeleton class="h-3 w-12" />
          </div>
          <UiSkeleton class="h-9 w-full" />
          <div class="mt-1 flex justify-between text-xs text-fg-muted">
            <span>easy</span><span>hard</span>
          </div>
        </div>
        <UiScaleInput v-else v-model="loadedMark" low-label="easy" high-label="hard" />
      </UiField>
      <UiRadioGroup v-model="markState" variant="segmented" aria-label="State of the field">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="xs, 28px" group>
        <UiScaleInput v-model="small" size="xs" />
      </UiField>
      <UiField label="sm, 36px" group>
        <UiScaleInput v-model="regular" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Load" description="Set by the coach" group>
        <!-- Disabled wins over invalid: the bar keeps the disabled tokens. -->
        <UiScaleInput :model-value="4" disabled invalid :readout="false" />
      </UiField>
      <UiField label="How hard was it?" required group>
        <UiScaleInput v-model="needed" low-label="easy" high-label="hard" />
      </UiField>
      <UiField
        label="Pain"
        required
        group
        :error="pain == null ? 'Mark the pain before you save' : undefined"
      >
        <UiScaleInput v-model="pain" :clearable="false" low-label="none" high-label="worst" />
      </UiField>
      <!-- A full bar has no empty segment to redden: the frame alone says it. -->
      <UiField label="Strain" group error="Over the limit for today">
        <UiScaleInput :model-value="10" :readout="false" low-label="idle" high-label="full" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField label="Rate the delivery" group :error="refusal" class="w-80 max-w-full">
      <UiScaleInput
        :model-value="kept"
        :max="5"
        low-label="poor"
        high-label="great"
        @update:model-value="ask"
      />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="sentEffort = 7">
      <UiField label="Effort" group>
        <UiScaleInput v-model="sentEffort" name="effort" :readout="false" />
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">{{
          sentEffort == null ? 'Sends nothing' : 'Sends effort=' + sentEffort
        }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
</template>
