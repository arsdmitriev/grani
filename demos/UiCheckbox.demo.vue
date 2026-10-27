<script lang="ts">
export const blurb =
  'Choose yes or no by clicking the box or its label; the tick shows the value the app accepted.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

const receipt = ref(true)
const reminders = ref(false)
const consent = ref(false)
// A row that is the label of its box: a press on the title or the description ticks it.
const picked = ref(new Set(['INV-0043']))
const ROWS = [
  { id: 'INV-0042', client: 'Acme Corp' },
  { id: 'INV-0043', client: 'Birch & Co' },
  { id: 'INV-0044', client: 'Cedar Ltd' },
]
function pick(id: string, on: boolean) {
  const next = new Set(picked.value)
  if (on) next.add(id)
  else next.delete(id)
  picked.value = next
}
const rows = ref([
  { id: 1, label: 'Invoice 1042', done: true },
  { id: 2, label: 'Invoice 1043', done: false },
  { id: 3, label: 'Invoice 1044', done: true },
])
const allDone = computed(() => rows.value.every((r) => r.done))
const someDone = computed(() => rows.value.some((r) => r.done) && !allDone.value)
const setAll = (v: boolean) => rows.value.forEach((r) => (r.done = v))
const terms = ref(false)
// The app owns the value: a save that fails leaves it as it was, and the box goes back.
const shared = ref(false)
const saving = ref(false)
const failed = ref('')
async function share(next: boolean) {
  saving.value = true
  failed.value = ''
  await new Promise((r) => setTimeout(r, 600))
  saving.value = false
  if (next) failed.value = 'Could not save. Try again.'
  else shared.value = false
}
const newsletter = ref(true)
const sized = ref(true)
const contract = ref(false)
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="Notifications" class="w-full max-w-sm">
      <UiStack gap="tight">
        <UiCheckbox v-model="receipt">Send me the receipt by email</UiCheckbox>
        <UiCheckbox v-model="reminders">Remind me three days before an invoice is due</UiCheckbox>
        <UiCheckbox v-model="consent">
          Keep my contact details for as long as the account is open, and use them only for the
          receipts and the notices this account asks for
        </UiCheckbox>
        <UiCheckbox v-model="contract" required>I have read the contract</UiCheckbox>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Select all">
    <div class="flex flex-col gap-2">
      <UiCheckbox :model-value="allDone" :indeterminate="someDone" @update:model-value="setAll">
        All invoices
      </UiCheckbox>
      <div class="ms-[26px] flex flex-col gap-2">
        <UiCheckbox v-for="r in rows" :key="r.id" v-model="r.done">{{ r.label }}</UiCheckbox>
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiCheckbox v-model="sized" size="xs">xs, 16px</UiCheckbox>
    <UiCheckbox v-model="sized">sm, 18px</UiCheckbox>
    <UiCheckbox v-model="sized" size="md">md, 20px</UiCheckbox>
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiCheckbox :model-value="false" disabled>Disabled</UiCheckbox>
    <UiCheckbox :model-value="true" disabled>Disabled, checked</UiCheckbox>
    <UiCheckbox :model-value="false" invalid>Invalid</UiCheckbox>
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField :error="terms ? undefined : 'Accept the terms to continue'" required class="w-80">
      <UiCheckbox v-model="terms">I accept the terms of service</UiCheckbox>
    </UiField>
  </DemoBlock>
  <DemoBlock title="In a row">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem v-for="r in ROWS" :key="r.id" as="label" :title="r.id" :description="r.client">
          <template #actions>
            <UiCheckbox
              :model-value="picked.has(r.id)"
              @update:model-value="(on: boolean) => pick(r.id, on)"
            />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField :error="failed || undefined" class="w-80">
      <UiCheckbox :model-value="shared" :disabled="saving" @update:model-value="share">
        Share this report with the team
      </UiCheckbox>
    </UiField>
  </DemoBlock>
  <DemoBlock title="In a form">
    <form class="flex w-80 flex-col items-start gap-4" @submit.prevent @reset="newsletter = true">
      <UiCheckbox v-model="newsletter" name="newsletter" value="yes">
        Subscribe to the newsletter
      </UiCheckbox>
      <span class="text-xs text-fg-muted">
        Sends {{ newsletter ? 'newsletter=yes' : 'nothing' }}
      </span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </form>
  </DemoBlock>
</template>
