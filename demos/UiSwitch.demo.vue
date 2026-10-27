<script lang="ts">
export const blurb =
  'Change an on/off setting immediately, returning to the previous position if the app rejects the change.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const summary = ref(true)
const mentions = ref(false)
const longOne = ref(false)
const small = ref(true)
const medium = ref(false)
const digest = ref(true)
const terms = ref(false)
const switchState = ref('loading')
const row = ref(true)
// The app answers each turn: turning the sync on is refused, so the switch stays off.
const sync = ref(false)
const saving = ref(false)
const failed = ref('')
async function turn(next: boolean) {
  saving.value = true
  failed.value = ''
  await new Promise((r) => setTimeout(r, 800))
  saving.value = false
  if (next) failed.value = 'Could not turn the sync on. Try again.'
  else sync.value = false
}
const digestForm = ref(true)
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-64 max-w-full flex-col items-start gap-4">
      <UiSwitch v-model="summary">Weekly summary</UiSwitch>
      <UiSwitch v-model="mentions">Mentions</UiSwitch>
      <UiSwitch v-model="longOne">
        Send me a summary of every comment, mention and status change on the projects I follow
      </UiSwitch>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex flex-col items-start gap-4">
      <UiSwitch v-model="small">Small track</UiSwitch>
      <UiSwitch v-model="medium" size="md">Medium track</UiSwitch>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <div class="flex flex-col items-start gap-2">
        <UiSwitch :model-value="true" disabled>Locked on</UiSwitch>
        <UiSwitch :model-value="false" disabled>Locked off</UiSwitch>
        <!-- Disabled wins over invalid. -->
        <UiSwitch :model-value="false" disabled invalid>Locked off, in error</UiSwitch>
        <UiSwitch :model-value="false" invalid>Off, in error</UiSwitch>
      </div>
      <UiField label="Notifications" description="A summary every Monday morning." required>
        <UiSwitch v-model="digest">Send the digest</UiSwitch>
      </UiField>
      <UiField label="Terms" :error="terms ? undefined : 'Accept the terms to continue.'" required>
        <UiSwitch v-model="terms">I accept the terms</UiSwitch>
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-col items-start gap-4">
        <UiSwitch :model-value="true" :loading="switchState === 'loading'">Email digest</UiSwitch>
        <UiSwitch :model-value="false" :loading="switchState === 'loading'">Mentions</UiSwitch>
        <UiSwitch :model-value="true" disabled :loading="switchState === 'loading'">
          Locked while saving
        </UiSwitch>
      </div>
      <UiRadioGroup v-model="switchState" variant="segmented" aria-label="State of the switches">
        <UiRadio value="idle">Idle</UiRadio>
        <UiRadio value="loading">Loading</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Setting row">
    <UiListItem as="label" title="Notifications" description="A summary every Monday." class="w-80">
      <template #actions><UiSwitch v-model="row" /></template>
    </UiListItem>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField :error="failed || undefined" class="w-80 max-w-full">
      <UiSwitch :model-value="sync" :loading="saving" @update:model-value="turn">
        Sync with the calendar
      </UiSwitch>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="digestForm = true">
      <UiSwitch v-model="digestForm" name="digest">Weekly digest</UiSwitch>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">Sends {{ digestForm ? 'digest=on' : 'nothing' }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
</template>
