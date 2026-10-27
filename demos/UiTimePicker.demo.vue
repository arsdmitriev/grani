<script lang="ts">
export const blurb =
  'Choose hours and minutes or type a time such as 2:30p or 1430. A valid time is kept even if it is not among the listed options.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const start = ref('10:30')
const end = ref('12:30')
const work = ref('09:00')
const departs = ref('14:30')
const night = ref('23:00')
const early = ref('07:00')
const odd = ref('09:07')
const broken = ref('25:99')
const empty = ref<string | null>(null)
const locked = ref('18:00')
const late = ref<string | null>(null)
const sizes = ref({ xs: '09:00', sm: '09:00', md: '09:00' })
const from = ref('09:00')
const until = ref('10:00')
const inWindow = ref('14:00')
const dialogOpen = ref(false)
// The app answers each time: meetings end by 6 PM, so a later end is refused and the field stays.
const ends = ref('17:00')
const refusal = ref<string>()
function ask(next: string | null) {
  if (next && next > '18:00') {
    refusal.value = 'Meetings end by 6 PM. Pick an earlier time.'
    return
  }
  refusal.value = undefined
  ends.value = next ?? ends.value
}
const sent = ref<string | null>('10:30')
const ruStart = ref('14:30')
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-72 max-w-full flex-col gap-6">
      <UiField label="Starts at" description="Pick in the columns, or type 2:37p or 1437.">
        <UiTimePicker v-model="start" class="w-full" />
      </UiField>
      <UiField label="Ends at" description="Not before the start.">
        <UiTimePicker v-model="end" :min="start" class="w-full" />
      </UiField>
      <UiField label="Opens at" description="Every 15 minutes, from 8 to noon.">
        <UiTimePicker v-model="work" :step="15" min="08:00" max="12:00" class="w-full" />
      </UiField>
      <UiField label="Departs at" description="24 hours, whatever the language.">
        <UiTimePicker v-model="departs" :hour-cycle="24" class="w-full" />
      </UiField>
      <UiField label="Night shift starts" description="10 PM to 6 AM, across midnight.">
        <UiTimePicker v-model="night" min="22:00" max="06:00" :step="30" class="w-full" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Odd values">
    <div class="flex w-72 max-w-full flex-col gap-6">
      <UiField label="Opens at" description="8:00 to 12:00; 7:00 came from old data.">
        <UiTimePicker v-model="early" min="08:00" max="12:00" class="w-full" />
      </UiField>
      <UiField label="Arrived at" description="Kept as it came, off the five-minute step.">
        <UiTimePicker v-model="odd" class="w-full" />
      </UiField>
      <UiField label="Starts at" description="Old data held 25:99: no time, so the field is empty.">
        <UiTimePicker v-model="broken" class="w-full" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-72 max-w-full flex-col gap-6">
      <UiField label="Remind me at">
        <UiTimePicker v-model="empty" clearable class="w-full" />
      </UiField>
      <UiField label="Closes at" description="Set by the venue.">
        <UiTimePicker v-model="locked" disabled class="w-full" />
      </UiField>
      <UiField label="Ends at" required error="Pick when the meeting ends.">
        <UiTimePicker v-model="late" class="w-full" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex flex-col items-start gap-4">
      <UiTimePicker
        v-for="s in ['xs', 'sm', 'md']"
        :key="s"
        v-model="sizes[s]"
        :size="s"
        :ariaLabel="`Time, ${s}`"
      />
      <UiButtonGroup ariaLabel="Opening hours">
        <UiTimePicker v-model="from" ariaLabel="From" />
        <UiTimePicker v-model="until" ariaLabel="Until" />
      </UiButtonGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Modal">
    <UiButton variant="outline" @click="dialogOpen = true">Move the meeting</UiButton>
    <UiModal v-model:open="dialogOpen" title="Move the meeting">
      <UiField label="Starts at">
        <UiTimePicker v-model="inWindow" class="w-full" />
      </UiField>
      <template #footer>
        <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
        <UiButton @click="dialogOpen = false">Save</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField label="Ends at" :error="refusal" class="w-72 max-w-full">
      <UiTimePicker :model-value="ends" class="w-full" @update:model-value="ask" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form class="flex w-72 max-w-full flex-col gap-4" @submit.prevent @reset="sent = '10:30'">
      <UiField label="Starts at">
        <UiTimePicker v-model="sent" name="at" clearable class="w-full" />
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">{{ `Sends at=${sent ?? ''}` }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). Russian writes 24 hours, so
         no Period column; American English, on the tabs before, writes 2:30 PM. -->
    <UiTimePicker v-model="ruStart" ariaLabel="Starts at" clearable class="w-48" />
  </DemoBlock>
</template>
