<script lang="ts">
export const blurb = 'Show one row with a title and description and an action or value beside it.'
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Archive, BadgeCheck, Check, FileText, Lock, Plus, RefreshCw, Trash2 } from '@lucide/vue'

const notify = ref(true)
const terms = ref(false)

const done = ref('')
const rowState = ref('rest')
// The row that just came is lit, and the light goes out after a second, as the prop asks.
const payments = ref([
  { day: 'Sep 3', amount: '420.00 EUR' },
  { day: 'Sep 17', amount: '180.00 EUR' },
])
const litAt = ref(-1)
let dim: ReturnType<typeof setTimeout> | undefined
function addPayment() {
  payments.value = [
    ...payments.value,
    { day: `Sep ${18 + payments.value.length}`, amount: '95.00 EUR' },
  ]
  clearTimeout(dim)
  litAt.value = payments.value.length - 1
  dim = setTimeout(() => (litAt.value = -1), 1000)
}
onBeforeUnmount(() => clearTimeout(dim))
</script>

<template>
  <DemoBlock title="Base">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem title="Anna Petrova" description="anna@work">
          <template #media><UiAvatar name="Anna Petrova" /></template>
          <template #actions><UiButton variant="ghost">Edit</UiButton></template>
        </UiListItem>
        <UiListItem title="Ivan Sidorov" description="ivan@work">
          <template #media><UiAvatar name="Ivan Sidorov" /></template>
          <template #actions><UiButton variant="ghost">Edit</UiButton></template>
        </UiListItem>
        <UiListItem title="Verified" description="The account passed the check.">
          <template #media><BadgeCheck aria-hidden="true" /></template>
          <template #actions><UiBadge tone="success" label="Done" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Link">
    <UiListItem
      to="/components/link"
      variant="outline"
      title="Documentation"
      description="Opens the guide."
      class="w-full max-w-md"
    >
      <template #media><FileText aria-hidden="true" /></template>
    </UiListItem>
    <UiListItem
      to="https://example.com/help"
      variant="outline"
      title="Help center"
      description="Another site."
      class="w-full max-w-md"
    >
      <template #media><FileText aria-hidden="true" /></template>
    </UiListItem>
  </DemoBlock>
  <DemoBlock title="Long text">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem
          title="A title long enough to wrap onto a second line in a narrow card"
          description="A description that also runs long, to show that the row grows in height and keeps the action centered on it."
        >
          <template #actions><UiBadge label="Draft" /></template>
        </UiListItem>
        <UiListItem title="Unbroken" description="anna.petrova.with.a.long.address@company.example">
          <template #actions><UiBadge label="Invited" /></template>
        </UiListItem>
        <UiListItem title="A short one" description="In a list: UiList makes each row an item.">
          <template #actions><UiBadge tone="success" label="Sent" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Search hit">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem
          title="Invoices of Birch & Co"
          highlight="birch"
          description="12 invoices, 3 open."
        />
        <UiListItem title="Birch & Co, contacts" highlight="birch" description="4 people." />
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Setting">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem as="label" title="Notifications" description="Email about new events.">
          <template #actions><UiSwitch v-model="notify" /></template>
        </UiListItem>
        <UiListItem
          as="label"
          title="Accept the terms"
          description="Needed before the first payout."
          required
          :error="terms ? '' : 'Accept the terms to receive payouts.'"
        >
          <template #actions><UiSwitch v-model="terms" /></template>
        </UiListItem>
        <UiListItem
          as="label"
          title="Two-step sign-in"
          description="Your administrator keeps it on."
        >
          <template #actions><UiSwitch :model-value="true" disabled /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Notice">
    <div class="flex w-full max-w-lg flex-col gap-2">
      <UiListItem tone="info" description="The report covers the current filter only." />
      <UiListItem
        tone="warning"
        title="Rate missing"
        description="Add the June rate to compute the cost in the base currency."
      >
        <template #actions>
          <UiButton variant="outline" size="xs">Add rate</UiButton>
        </template>
      </UiListItem>
      <UiListItem
        tone="success"
        title="Backup codes saved"
        description="Keep them somewhere safe."
      />
      <UiListItem
        tone="danger"
        description="The import stopped at row 42: the amount is not a number."
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Actions of a record">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem as="button" size="sm" title="Mark complete" @click="done = 'complete'">
          <template #actions><Check aria-hidden="true" /></template>
        </UiListItem>
        <UiListItem
          size="sm"
          title="Open the record"
          description="Payment 12.50 EUR"
          to="/components/link"
        />
        <UiListItem as="button" size="sm" step title="Payments" @click="done = 'payments'">
          <template #actions><span class="text-sm text-fg-muted">3</span></template>
        </UiListItem>
        <UiListItem as="button" size="sm" title="Archive" @click="done = 'archive'">
          <template #actions><Archive aria-hidden="true" /></template>
        </UiListItem>
        <UiListItem
          as="button"
          size="sm"
          title="Close"
          description="Paid records stay open"
          disabled
        >
          <template #actions><Lock aria-hidden="true" /></template>
        </UiListItem>
        <UiListItem as="button" size="sm" title="Delete" tone="danger" @click="done = 'delete'">
          <template #actions><Trash2 aria-hidden="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <p v-if="done" class="text-xs text-fg-muted">pressed: {{ done }}</p>
  </DemoBlock>
  <DemoBlock title="Lit and brand">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem
          v-for="(p, i) in payments"
          :key="i"
          size="sm"
          :title="p.day"
          :description="p.amount"
          :lit="litAt === i"
        />
        <UiListItem as="button" size="sm" title="Add a payment" tone="brand" @click="addPayment">
          <template #actions><Plus aria-hidden="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiStack direction="row" gap="title" align="start" class="w-full flex-wrap justify-center">
      <UiCard :padded="false" class="w-full max-w-xs">
        <UiList>
          <UiListItem as="label" title="Weekly digest" description="sm, the default: 44 tall.">
            <template #actions><UiSwitch :model-value="true" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiCard :padded="false" size="md" class="w-full max-w-xs">
        <UiList>
          <UiListItem as="label" title="Weekly digest" description="md: 56 tall.">
            <template #actions><UiSwitch :model-value="true" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Alone">
    <UiStack class="w-full max-w-md">
      <UiListItem
        variant="outline"
        title="Export ready"
        description="The March report is ready to download."
      >
        <template #actions><UiButton variant="outline">Download</UiButton></template>
      </UiListItem>
      <UiListItem
        variant="muted"
        size="sm"
        title="Processing payment"
        description="Do not close the tab."
      >
        <template #media><UiSpinner /></template>
      </UiListItem>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-full flex-col items-center gap-4">
      <UiCard :padded="false" class="w-full max-w-sm">
        <UiList>
          <UiListItem
            as="button"
            size="sm"
            title="Sync the bank feed"
            :loading="rowState === 'loading'"
            :disabled="rowState === 'disabled'"
          >
            <template #actions><RefreshCw aria-hidden="true" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiRadioGroup v-model="rowState" variant="segmented" aria-label="State of the row">
        <UiRadio value="rest">Rest</UiRadio>
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="disabled">Disabled</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
</template>
