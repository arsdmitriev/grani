<script lang="ts">
export const blurb =
  'Count things with minus and plus, such as pieces in a cart or guests on a booking, or type the number when it is far from the current one.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const qty = ref<string | null>('2')
const kilos = ref<string | null>('4')
const count = ref<string | null>('1')
const adults = ref<string | null>('1')
const off = ref<string | null>('3')
const fixed = ref<string | null>('3')
const wrong = ref<string | null>('0')
const sized = ref<string | null>('3')
const guests = ref<string | null>('0')
const ruCount = ref<string | null>('1200')
</script>

<template>
  <DemoBlock title="Base" row>
    <UiStepper v-model="qty" :min="1" :max="20" ariaLabel="Quantity">
      <template #end>pcs</template>
    </UiStepper>
    <UiStepper v-model="kilos" :min="1" ariaLabel="Weight">
      <template #end>kg</template>
    </UiStepper>
    <UiStepper v-model="count" :min="0" size="xs" ariaLabel="Count" />
    <!-- One adult at least: the minus rests inert at the bound. -->
    <UiStepper v-model="adults" :min="1" :max="9" ariaLabel="Adults" />
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiStepper v-model="off" disabled ariaLabel="Disabled" />
    <UiStepper v-model="fixed" readonly ariaLabel="Readonly" />
    <UiStepper v-model="wrong" :min="1" invalid ariaLabel="Invalid" />
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiStepper v-model="sized" :min="0" size="xs" ariaLabel="Count, xs" />
    <UiStepper v-model="sized" :min="0" ariaLabel="Count, sm" />
    <UiStepper v-model="sized" :min="0" size="md" ariaLabel="Count, md" />
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField
      label="Guests"
      required
      :error="guests === '0' || !guests ? 'At least one guest' : undefined"
      class="w-72 max-w-full"
    >
      <UiStepper v-model="guests" :min="0" :max="12" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). A count typed or pasted as
         Russian writes it (1 200) is read in Russian, and the buttons are named from the ru
         dictionary. -->
    <UiStepper v-model="ruCount" :min="0" :step="100" ariaLabel="Pieces" class="w-40" />
  </DemoBlock>
</template>
