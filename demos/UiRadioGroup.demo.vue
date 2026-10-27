<script lang="ts">
export const blurb =
  'Choose one answer from a short list, cards or a segmented bar; the whole row or card is the click target.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import type { SelectValue } from '../types/ui'
import { CreditCard, LayoutGrid, List, Mail, Truck } from '@lucide/vue'

const delivery = ref('door')
const plan = ref('team')
const shipping = ref('courier')
// The app answers each pick: 7 seats are in use, so Free is refused and the radios stay on Team.
const kept = ref('team')
const refusal = ref<string>()
function ask(v: SelectValue | null) {
  if (v === 'free') {
    refusal.value = 'Free holds one seat, and 7 are in use. Remove members first.'
    return
  }
  refusal.value = undefined
  kept.value = String(v)
}
const sentPlan = ref('free')
const needed = ref<string | null>(null)
const region = ref<string | null>(null)
const period = ref('week')
const direction = ref('expense')
const view = ref('list')
const arrival = ref<string | null>(null)
const sized = ref('team')
const span = ref('week')
const billing = ref('quarter')
</script>

<template>
  <DemoBlock title="Base">
    <UiRadioGroup v-model="delivery" aria-label="Delivery" class="w-80">
      <UiRadio value="door">
        Leave the parcel at the door if nobody answers, and send a photo of where it was left
      </UiRadio>
      <UiRadio value="neighbor" description="The courier rings the flat next door">
        Hand it to a neighbor
      </UiRadio>
      <UiRadio value="point" description="Not in your area yet" disabled>
        Take it to a pickup point
      </UiRadio>
    </UiRadioGroup>
  </DemoBlock>
  <DemoBlock title="Card">
    <UiRadioGroup v-model="shipping" aria-label="Shipping" variant="card" class="w-96 max-w-full">
      <UiRadio value="card" description="Visa ending 4242">
        <template #media><CreditCard aria-hidden="true" /></template>
        Card
        <template #meta>0 EUR</template>
      </UiRadio>
      <UiRadio value="courier" description="Tomorrow, 10:00 to 14:00">
        <template #media><Truck aria-hidden="true" /></template>
        Courier
        <template #meta>12 EUR</template>
      </UiRadio>
      <UiRadio value="post" description="3 to 5 working days">
        <template #media><Mail aria-hidden="true" /></template>
        Post
        <template #meta>6 EUR</template>
      </UiRadio>
    </UiRadioGroup>
  </DemoBlock>
  <DemoBlock title="Check">
    <UiRadioGroup v-model="plan" aria-label="Plan" variant="card-check" class="w-80">
      <UiRadio value="free" description="One project, community support">Free</UiRadio>
      <UiRadio value="team" description="Up to 10 seats, priority support">Team</UiRadio>
      <UiRadio value="enterprise" description="Talk to sales" disabled>Enterprise</UiRadio>
    </UiRadioGroup>
  </DemoBlock>
  <DemoBlock title="Segmented">
    <div class="flex flex-wrap items-center gap-3">
      <UiRadioGroup v-model="period" variant="segmented" aria-label="Period">
        <UiRadio value="day">Day</UiRadio>
        <UiRadio value="week">Week</UiRadio>
        <UiRadio value="month">Month</UiRadio>
      </UiRadioGroup>
      <UiRadioGroup v-model="view" variant="segmented" aria-label="View">
        <UiRadio value="list" aria-label="List"><List /></UiRadio>
        <UiRadio value="grid" aria-label="Grid"><LayoutGrid /></UiRadio>
      </UiRadioGroup>
    </div>
    <UiRadioGroup
      v-model="direction"
      variant="segmented"
      block
      aria-label="Direction"
      class="max-w-sm"
    >
      <UiRadio value="expense">Expense</UiRadio>
      <UiRadio value="income">Income</UiRadio>
      <UiRadio value="transfer" disabled>Transfer</UiRadio>
    </UiRadioGroup>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex flex-wrap items-start gap-6">
      <UiRadioGroup v-model="sized" size="xs" aria-label="Plan, xs">
        <UiRadio value="free">Free</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
      <UiRadioGroup v-model="sized" aria-label="Plan, sm">
        <UiRadio value="free">Free</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
      <UiRadioGroup v-model="sized" size="md" aria-label="Plan, md">
        <UiRadio value="free">Free</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <UiRadioGroup v-model="span" variant="segmented" aria-label="Span, sm">
        <UiRadio value="day">Day</UiRadio>
        <UiRadio value="week">Week</UiRadio>
      </UiRadioGroup>
      <UiRadioGroup v-model="span" variant="segmented" size="md" aria-label="Span, md">
        <UiRadio value="day">Day</UiRadio>
        <UiRadio value="week">Week</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Long">
    <div class="w-64 max-w-full">
      <UiRadioGroup v-model="billing" variant="segmented" aria-label="Billing">
        <UiRadio value="quarter">Quarterly billing</UiRadio>
        <UiRadio value="year">Yearly billing</UiRadio>
        <UiRadio value="life">Lifetime licence</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Billing" description="Set by your organisation" group>
        <UiRadioGroup :model-value="'monthly'" disabled>
          <UiRadio value="monthly">Monthly</UiRadio>
          <UiRadio value="yearly">Yearly</UiRadio>
        </UiRadioGroup>
      </UiField>
      <UiField label="Plan" required group>
        <UiRadioGroup v-model="needed">
          <UiRadio value="free">Free</UiRadio>
          <UiRadio value="team">Team</UiRadio>
        </UiRadioGroup>
      </UiField>
      <UiField
        label="Region"
        required
        group
        :error="region ? undefined : 'Choose the region of the account'"
      >
        <UiRadioGroup v-model="region">
          <UiRadio value="eu">Europe</UiRadio>
          <UiRadio value="us">Americas</UiRadio>
        </UiRadioGroup>
      </UiField>
      <UiField
        label="Arrival"
        required
        group
        :error="arrival ? undefined : 'Choose when the courier comes'"
      >
        <UiRadioGroup v-model="arrival" variant="segmented" block>
          <UiRadio value="morning">Morning</UiRadio>
          <UiRadio value="afternoon">Afternoon</UiRadio>
          <UiRadio value="evening">Evening</UiRadio>
        </UiRadioGroup>
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField label="Plan" group :error="refusal" class="w-80 max-w-full">
      <UiRadioGroup :model-value="kept" @update:model-value="ask">
        <UiRadio value="free" description="One seat">Free</UiRadio>
        <UiRadio value="team" description="Up to 10 seats">Team</UiRadio>
        <UiRadio value="scale" description="Unlimited seats">Scale</UiRadio>
      </UiRadioGroup>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="sentPlan = 'free'">
      <UiField label="Plan" group>
        <UiRadioGroup v-model="sentPlan" name="plan">
          <UiRadio value="free">Free</UiRadio>
          <UiRadio value="team">Team</UiRadio>
        </UiRadioGroup>
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">Sends plan={{ sentPlan }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
</template>
