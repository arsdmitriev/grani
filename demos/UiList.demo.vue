<script lang="ts">
export const blurb =
  'Present related rows in a card, separated by lines so each item is easy to distinguish.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Trash2 } from '@lucide/vue'

const reminders = ref(true)
const digest = ref(false)
const invite = ref('')
const width = ref<'narrow' | 'wide'>('narrow')
const fill = ref<'plain' | 'soft'>('plain')
const done = ref('')
const invoices = Array.from({ length: 12 }, (_, i) => ({
  number: `INV-${String(1041 + i).padStart(4, '0')}`,
  client: ['Acme Corp', 'Birch & Co', 'Northwind Traders', 'Lumen Studio'][i % 4]!,
  amount: `${(120 + i * 37.5).toFixed(2)} EUR`,
}))
</script>

<template>
  <DemoBlock title="Base">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem title="Anna Petrova" description="anna@work">
          <template #media><UiAvatar name="Anna Petrova" /></template>
          <template #actions><UiBadge tone="success" label="Owner" /></template>
        </UiListItem>
        <UiListItem title="Ivan Sidorov" description="ivan@work">
          <template #media><UiAvatar name="Ivan Sidorov" /></template>
          <template #actions><UiBadge label="Editor" /></template>
        </UiListItem>
        <UiListItem title="Lena Morozova" description="lena@work">
          <template #media><UiAvatar name="Lena Morozova" /></template>
          <template #actions><UiBadge label="Viewer" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Mixed">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem title="Plan" description="Team, 12 seats">
          <template #actions><UiBadge label="Monthly" /></template>
        </UiListItem>
        <UiListItem
          to="/components/list-item"
          title="Invoices"
          description="All invoices of the account."
        >
          <template #media><FileText aria-hidden="true" /></template>
        </UiListItem>
        <UiListItem as="label" title="Send reminders" description="Before an invoice is due.">
          <template #actions><UiSwitch v-model="reminders" /></template>
        </UiListItem>
        <UiListItem as="button" step title="Payments" @click="done = 'payments'">
          <template #actions><span class="text-sm text-fg-muted">3</span></template>
        </UiListItem>
        <UiListItem as="button" title="Delete the account" tone="danger" @click="done = 'delete'">
          <template #actions><Trash2 aria-hidden="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <p v-if="done" class="text-xs text-fg-muted">pressed: {{ done }}</p>
  </DemoBlock>
  <DemoBlock title="Padded">
    <UiCard title="Team" description="Who can open the account." class="w-full max-w-md">
      <UiStack>
        <UiField label="Invite by email">
          <UiStack direction="row" gap="tight">
            <UiInput v-model="invite" placeholder="name@company.example" class="flex-1" />
            <UiButton variant="outline">Invite</UiButton>
          </UiStack>
        </UiField>
        <UiList>
          <UiListItem title="Anna Petrova" description="anna@work">
            <template #media><UiAvatar name="Anna Petrova" /></template>
            <template #actions><UiBadge tone="success" label="Owner" /></template>
          </UiListItem>
          <UiListItem title="Ivan Sidorov" description="ivan@work">
            <template #media><UiAvatar name="Ivan Sidorov" /></template>
            <template #actions><UiBadge label="Editor" /></template>
          </UiListItem>
        </UiList>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Notice">
    <UiStack gap="title" align="center" class="w-full">
      <UiCard :padded="false" class="w-full max-w-md">
        <UiList>
          <UiListItem title="Rate" description="1.08 USD for 1 EUR" />
          <UiListItem
            tone="warning"
            :variant="fill"
            title="Rate missing"
            description="Add the June rate to compute the cost in the base currency."
          >
            <template #actions><UiButton variant="outline" size="xs">Add rate</UiButton></template>
          </UiListItem>
          <UiListItem title="Base currency" description="EUR" />
        </UiList>
      </UiCard>
      <UiRadioGroup v-model="fill" variant="segmented" aria-label="How the notice is drawn">
        <UiRadio value="plain">Edge</UiRadio>
        <UiRadio value="soft">Filled</UiRadio>
      </UiRadioGroup>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Long">
    <UiCard :padded="false" title="Invoices" class="w-full max-w-md">
      <UiList>
        <UiListItem
          v-for="inv in invoices"
          :key="inv.number"
          size="sm"
          :title="inv.number"
          :description="inv.client"
        >
          <template #actions>
            <span class="text-sm tabular-nums text-fg">{{ inv.amount }}</span>
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Narrow">
    <UiStack gap="title" align="center" class="w-full">
      <!-- The same rows at a phone's width and a wide one: the text wraps, the actions stay beside it. -->
      <UiCard :padded="false" :class="width === 'narrow' ? 'w-72' : 'w-full max-w-md'">
        <UiList>
          <UiListItem
            title="A client with a name long enough to wrap"
            description="anna.petrova.with.a.long.address@company.example"
          >
            <template #actions><UiBadge label="Invited" /></template>
          </UiListItem>
          <UiListItem as="label" title="Weekly digest" description="A summary every Monday.">
            <template #actions><UiSwitch v-model="digest" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiRadioGroup v-model="width" variant="segmented" aria-label="Width of the card">
        <UiRadio value="narrow">Narrow</UiRadio>
        <UiRadio value="wide">Wide</UiRadio>
      </UiRadioGroup>
    </UiStack>
  </DemoBlock>
</template>
