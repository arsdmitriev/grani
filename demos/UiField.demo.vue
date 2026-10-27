<script lang="ts">
export const blurb =
  'Give a control its label, hint and error message, connected so a screen reader reads them with it.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
const email = ref('ann@work')
const wrong = ref('ann.work')
const note = ref('')
const courier = ref('')
const days = ref<string[]>(['mon'])
const plan = ref('team')
// A group in error until a seat is picked: the error is the group's, said once with its legend.
const seat = ref<string | null>(null)
const amount = ref('')
const currency = ref<string | null>('EUR')
// A select under its label: a click on the label opens its list, as a click on the select does.
const billing = ref<string | null>('EUR')
const currencies = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
]
const toggle = (day: string, on: boolean) => {
  days.value = on ? [...days.value, day] : days.value.filter((d) => d !== day)
}
</script>

<template>
  <DemoBlock title="Base">
    <UiStack class="w-full max-w-80">
      <UiField label="Name" description="As in the passport.">
        <UiInput v-model="name" placeholder="Anna Petrova" />
      </UiField>
      <UiField label="Billing currency" description="Invoices are issued in it.">
        <UiSelect v-model="billing" :items="currencies" />
      </UiField>
      <UiField
        label="The address the invoices for this account are sent to every month"
        description="Leave it empty to send them to the owner of the account; the address is checked before the first invoice goes out."
      >
        <UiInput v-model="note" type="email" />
        <template #meta>optional</template>
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Required">
    <UiField label="Email" required class="w-full max-w-80">
      <UiInput v-model="email" type="email" autocomplete="email" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Error">
    <UiField
      label="Email"
      description="We send the receipt here."
      error="Enter an address with @"
      class="w-full max-w-80"
    >
      <UiInput v-model="wrong" type="email" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Group">
    <div class="flex w-full max-w-80 flex-col gap-6">
      <UiField label="Plan" group>
        <UiRadioGroup v-model="plan">
          <UiRadio value="solo">Solo</UiRadio>
          <UiRadio value="team">Team</UiRadio>
        </UiRadioGroup>
      </UiField>
      <UiField label="Seat" required group :error="seat ? undefined : 'Pick a seat'">
        <UiRadioGroup v-model="seat">
          <UiRadio value="window">Window</UiRadio>
          <UiRadio value="aisle">Aisle</UiRadio>
        </UiRadioGroup>
      </UiField>
      <UiField label="Days" required group>
        <div class="flex gap-4">
          <UiCheckbox
            :model-value="days.includes('mon')"
            @update:model-value="toggle('mon', $event)"
            >Mon</UiCheckbox
          >
          <UiCheckbox
            :model-value="days.includes('tue')"
            @update:model-value="toggle('tue', $event)"
            >Tue</UiCheckbox
          >
        </div>
      </UiField>
      <UiField label="Amount" required group>
        <UiButtonGroup>
          <UiInput v-model="amount" inputmode="decimal" ariaLabel="Amount" />
          <UiSelect v-model="currency" :items="currencies" ariaLabel="Currency" />
        </UiButtonGroup>
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Disabled">
    <UiField label="Account" description="Set by the administrator." class="w-full max-w-80">
      <UiInput model-value="ops@work" disabled />
      <template #meta>locked</template>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Meta">
    <UiField label="Note for the courier" class="w-full max-w-80">
      <UiTextarea v-model="courier" :maxlength="200" :rows="3" />
      <template #meta>{{ courier.length }} / 200</template>
    </UiField>
  </DemoBlock>
</template>
