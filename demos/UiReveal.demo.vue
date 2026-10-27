<script lang="ts">
export const blurb =
  'Open details where you need them and collapse them again without leaving the page.'
</script>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { ChevronsUpDown } from '@lucide/vue'

const open = ref(false)
const detailsId = useId()
const reminders = ref(true)
const digest = ref(false)
const days = ref('3')
const channel = ref('email')
const backup = ref(false)
const encrypt = ref(false)
const split = ref('month')
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="INV-0042" description="Acme Corp" class="w-full max-w-sm">
      <template #actions>
        <UiTooltip :content="open ? 'Hide details' : 'Show details'">
          <UiIconButton
            :icon="ChevronsUpDown"
            variant="outline"
            :ariaLabel="open ? 'Hide details' : 'Show details'"
            :aria-expanded="open"
            :aria-controls="detailsId"
            @click="open = !open"
          />
        </UiTooltip>
      </template>
      <p class="text-sm text-fg">€1 240.00, due 14 Oct</p>
      <UiReveal :id="detailsId" :open="open">
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt class="text-fg-muted">Sent</dt>
          <dd class="text-fg">30 Sep to billing@acme.example</dd>
          <dt class="text-fg-muted">Reminders</dt>
          <dd class="text-fg">Two, the last on 7 Oct</dd>
          <dt class="text-fg-muted">Terms</dt>
          <dd class="text-fg">Net 14, late fee 2%</dd>
        </dl>
      </UiReveal>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Behind a switch">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiReveal v-model:open="reminders">
          <template #trigger="{ open: on, toggle, controls }">
            <UiListItem as="label" title="Send reminders" description="Before an invoice is due.">
              <template #actions>
                <UiSwitch
                  :model-value="on"
                  :aria-controls="controls"
                  @update:model-value="toggle"
                />
              </template>
            </UiListItem>
          </template>
          <div class="flex flex-col gap-4">
            <UiField label="Days before"><UiInput v-model="days" numeric /></UiField>
            <UiField label="Channel" group>
              <UiRadioGroup v-model="channel" variant="segmented">
                <UiRadio value="email">Email</UiRadio>
                <UiRadio value="sms">SMS</UiRadio>
              </UiRadioGroup>
            </UiField>
          </div>
        </UiReveal>
        <UiListItem as="label" title="Weekly digest" description="A summary every Monday.">
          <template #actions><UiSwitch v-model="digest" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Nested">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiReveal v-model:open="backup">
          <template #trigger="{ open: on, toggle, controls }">
            <UiListItem as="label" title="Back up every night" description="At 02:00, server time.">
              <template #actions>
                <UiSwitch
                  :model-value="on"
                  :aria-controls="controls"
                  @update:model-value="toggle"
                />
              </template>
            </UiListItem>
          </template>
          <UiReveal v-model:open="encrypt">
            <template #trigger="{ open: on, toggle, controls }">
              <UiSwitch :model-value="on" :aria-controls="controls" @update:model-value="toggle">
                Encrypt the copies
              </UiSwitch>
            </template>
            <UiField label="Key name"><UiInput model-value="nightly-2026" /></UiField>
          </UiReveal>
        </UiReveal>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Own state">
    <UiCard title="Export" class="w-full max-w-md">
      <UiReveal>
        <template #trigger="{ open: on, toggle, controls }">
          <UiButton variant="outline" :aria-expanded="on" :aria-controls="controls" @click="toggle">
            {{ on ? 'Fewer options' : 'More options' }}
          </UiButton>
        </template>
        <UiField label="Split by" group>
          <UiRadioGroup v-model="split" variant="segmented">
            <UiRadio value="month">Month</UiRadio>
            <UiRadio value="quarter">Quarter</UiRadio>
          </UiRadioGroup>
        </UiField>
      </UiReveal>
    </UiCard>
  </DemoBlock>
</template>
