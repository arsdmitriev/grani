<script lang="ts">
export const blurb =
  'Type a date as your language writes it, or pick it from a calendar or a preset, while the field keeps a steady width.'
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'

const paid = ref<string | null>('2026-09-24')
const spent = ref<string | null>(null)
const deadline = ref<string | null>(null)
// Inside the window, or saved before the window moved: out there the day is kept and reads invalid.
const where = ref<'inside' | 'outside'>('inside')
const due = ref<string | null>('2026-09-24')
// A date of another year in a narrow column: cut, and whole in a tooltip on hover.
const born = ref<string | null>('1987-03-12')
watch(where, (w) => (due.value = w === 'inside' ? '2026-09-24' : '2026-09-05'))
const wrong = ref('2026-09-24')
const locked = ref('2026-09-01')
const xs = ref('2026-09-24')
const sm = ref('2026-09-24')
const md = ref('2026-09-24')
const rowDate = ref<string | null>(null)
const rowAmount = ref<string | null>(null)
const startDay = ref('2026-10-05')
const startTime = ref('09:30')
const dialogOpen = ref(false)
const inWindow = ref('2026-09-24')
const ruDay = ref<string | null>('2026-09-24')
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="INV-0042" description="Acme Corp · €1 240.00" class="w-full max-w-sm">
      <UiField label="Paid on" description="The day the money reached the account.">
        <UiDatePicker v-model="paid" clearable class="w-full" />
      </UiField>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Presets">
    <UiStack class="w-72">
      <UiField label="Spent on" description="Today, Yesterday or a week ago cover most entries.">
        <UiDatePicker v-model="spent" :presets="['today', 'yesterday', 'weekAgo']" class="w-full" />
      </UiField>
      <UiField label="Pay by">
        <UiDatePicker
          v-model="deadline"
          :presets="['tomorrow', 'inAWeek', { label: 'In 30 days', days: 30 }]"
          class="w-full"
        />
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Limits">
    <div class="flex flex-col items-center gap-4">
      <UiField label="Due" description="From 10 Sep to 10 Oct" class="w-72">
        <UiDatePicker v-model="due" min="2026-09-10" max="2026-10-10" class="w-full" />
      </UiField>
      <UiRadioGroup v-model="where" variant="segmented" aria-label="Where the saved day is">
        <UiRadio value="inside">Inside</UiRadio>
        <UiRadio value="outside">Outside</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <UiStack class="w-64">
      <UiField label="Invalid"><UiDatePicker v-model="wrong" invalid class="w-full" /></UiField>
      <UiField label="Disabled">
        <UiDatePicker v-model="locked" disabled clearable class="w-full" />
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex w-64 flex-col gap-2">
      <UiDatePicker v-model="xs" size="xs" ariaLabel="Date, xs" />
      <UiDatePicker v-model="sm" ariaLabel="Date, sm" />
      <UiDatePicker v-model="md" size="md" ariaLabel="Date, md" />
    </div>
  </DemoBlock>
  <DemoBlock title="Row">
    <UiStack class="w-96 max-w-full">
      <div class="flex w-full items-center gap-2">
        <UiDatePicker v-model="rowDate" ariaLabel="Date" class="w-44" />
        <UiInput v-model="rowAmount" numeric ariaLabel="Amount" placeholder="0.00" class="w-28" />
      </div>
      <UiField label="Starts" group>
        <UiButtonGroup class="w-full">
          <UiDatePicker v-model="startDay" ariaLabel="Day" class="flex-1" />
          <UiTimePicker v-model="startTime" ariaLabel="Time" />
        </UiButtonGroup>
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Window">
    <UiButton variant="outline" @click="dialogOpen = true">Edit invoice</UiButton>
    <UiModal v-model:open="dialogOpen" title="Edit invoice">
      <UiStack>
        <UiField label="Client"><UiInput model-value="Acme Corp" /></UiField>
        <UiField label="Due by">
          <UiDatePicker v-model="inWindow" class="w-full" />
        </UiField>
      </UiStack>
      <template #footer>
        <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
        <UiButton @click="dialogOpen = false">Save</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Narrow">
    <div class="w-36">
      <UiField label="Born">
        <UiDatePicker v-model="born" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). The day is written in Russian
         with its weekday, the presets come from the ru dictionary, the calendar starts on Monday. -->
    <UiDatePicker
      v-model="ruDay"
      :presets="['today', 'yesterday', 'weekAgo']"
      clearable
      ariaLabel="Paid on"
      class="w-72"
    />
  </DemoBlock>
</template>
