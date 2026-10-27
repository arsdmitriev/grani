<script lang="ts">
export const blurb =
  'Group one part of a page into a card with a title, content and an optional footer.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '../types/ui'
import { Heart, Inbox, MessageSquare, Paperclip, Plus } from '@lucide/vue'
import photo from './media/lighthouse.webp'

const tab = ref('overview')
const imageAt = ref<'top' | 'bottom' | 'start' | 'end'>('top')
const cardState = ref('loading')
const digest = ref(true)
interface Invoice {
  id: string
  client: string
  total: string
}
const columns: TableColumn<Invoice>[] = [
  { key: 'id', label: 'Invoice' },
  { key: 'client', label: 'Client' },
  { key: 'total', label: 'Total', align: 'end' },
]
const invoices: Invoice[] = [
  { id: 'INV-0042', client: 'Acme Corp', total: '€1 240.00' },
  { id: 'INV-0041', client: 'Birch & Co', total: '€380.00' },
  { id: 'INV-0040', client: 'Cedar Ltd', total: '€2 115.50' },
]
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="Billing" class="w-full max-w-md">
      <p class="text-sm text-fg">
        You are on the Pro plan, €24 a month for up to 10 people. The next invoice goes out on 1
        October 2026 and is paid by the card ending 4242.
      </p>
      <template #footer>
        <span class="me-auto text-xs text-fg-muted">Renews 1 Oct</span>
        <UiButton variant="secondary">Invoices</UiButton>
        <UiButton>Change plan</UiButton>
      </template>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Edge to edge">
    <UiCard :padded="false" size="md" title="Invoices" class="w-full">
      <template #actions>
        <UiButton variant="outline"><Plus />New</UiButton>
      </template>
      <UiTable :columns="columns" :items="invoices" row-key="id" />
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Image">
    <UiStack gap="title" align="center" class="w-full">
      <UiCard
        title="The coast walk"
        description="Four hours, one lighthouse."
        :image-position="imageAt"
        :divided="false"
        class="w-full max-w-lg"
      >
        <template #image>
          <UiAspectRatio class="bg-neutral-subtle">
            <img :src="photo" alt="A red and white lighthouse over turquoise water" />
          </UiAspectRatio>
        </template>
        <p class="text-sm text-fg-muted">
          Start at the car park, keep the sea on your left, turn back at the lighthouse.
        </p>
      </UiCard>
      <UiRadioGroup v-model="imageAt" variant="segmented" aria-label="Where the image stands">
        <UiRadio value="top">Top</UiRadio>
        <UiRadio value="bottom">Bottom</UiRadio>
        <UiRadio value="start">Start</UiRadio>
        <UiRadio value="end">End</UiRadio>
      </UiRadioGroup>
    </UiStack>
  </DemoBlock>

  <DemoBlock title="Plain">
    <UiCard
      variant="plain"
      title="Notifications"
      description="What reaches you, and where."
      class="w-full max-w-sm"
    >
      <p class="text-sm text-fg-muted">
        A plain card has no frame: the three parts alone, 16 apart.
      </p>
      <template #footer>
        <UiButton variant="secondary">Cancel</UiButton>
        <UiButton>Save</UiButton>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Tone" row>
    <UiCard title="Bank feed" tone="danger" class="w-full max-w-xs">
      <template #actions><UiBadge tone="danger" label="Failed" /></template>
      <p class="text-sm text-fg-muted">The bank refused the last sync. Sign in again to resume.</p>
      <template #footer>
        <UiButton variant="outline">Reconnect</UiButton>
      </template>
    </UiCard>
    <UiCard title="Card on file" tone="warning" class="w-full max-w-xs">
      <template #actions><UiBadge tone="warning" label="Expires soon" /></template>
      <p class="text-sm text-fg-muted">The card ending 4242 expires at the end of October.</p>
      <template #footer>
        <UiButton variant="outline">Update card</UiButton>
      </template>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Disabled">
    <UiCard title="Bank feed" disabled class="w-full max-w-sm">
      <p class="text-sm">Syncing is paused while the account is on hold.</p>
      <template #footer>
        <UiButton variant="outline" disabled>Sync now</UiButton>
      </template>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Long">
    <UiCard
      title="INV-0042-acme-corporation-quarterly-statement-final-v2"
      description="Sent 12 Sep to accounts-payable@acme-corporation.example.com"
      class="w-full max-w-xs"
    >
      <template #actions><UiButton variant="outline">Open</UiButton></template>
      <p class="text-sm text-fg-muted">
        A word with no space breaks inside its column, beside the action.
      </p>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="States">
    <div class="flex w-full flex-col items-center gap-4">
      <UiCard
        title="Invoices"
        :loading="cardState === 'loading' || cardState === 'refreshing'"
        :empty="cardState === 'empty'"
        class="w-full max-w-sm"
      >
        <p v-if="cardState !== 'loading'" class="text-sm text-fg-muted">
          Three invoices wait for payment, €3 735.50 in all.
        </p>
        <template #empty>
          <UiNoData
            title="No invoices yet"
            description="The first one appears here once it is sent."
          >
            <template #media><Inbox /></template>
            <template #actions>
              <UiButton>New invoice</UiButton>
            </template>
          </UiNoData>
        </template>
      </UiCard>
      <UiRadioGroup v-model="cardState" variant="segmented" aria-label="State of the card">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Updating</UiRadio>
        <UiRadio value="empty">Empty</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="Divider" row>
    <UiCard title="Savings · Emergency fund" :divided="false" class="w-full max-w-xs">
      <div class="flex items-center justify-between gap-4 tabular-nums">
        <p>
          <span class="text-3xl font-semibold text-fg">€4 500</span>
          <span class="text-lg text-fg-muted"> / €6 000</span>
        </p>
        <span class="font-semibold text-fg-muted">75%</span>
      </div>
      <UiProgress
        :value="4500"
        :max="6000"
        variant="thermometer"
        aria-label="Emergency fund"
        value-text="€4 500 of €6 000"
        class="mt-4 h-2 w-full"
      />
      <template #footer>
        <span class="me-auto text-sm text-fg-muted">
          Left <b class="font-semibold tabular-nums text-fg">€1 500</b>
        </span>
        <span class="text-sm text-fg-muted">≈ 5 months</span>
      </template>
    </UiCard>
    <UiCard title="Reading · 2026" :divided="false" class="w-full max-w-xs">
      <div class="flex items-center justify-between gap-4 tabular-nums">
        <p>
          <span class="text-3xl font-semibold text-fg">18</span>
          <span class="text-lg text-fg-muted"> / 40 books</span>
        </p>
        <span class="font-semibold text-fg-muted">45%</span>
      </div>
      <template #divider>
        <UiProgress
          :value="18"
          :max="40"
          aria-label="Reading goal"
          value-text="18 of 40 books"
          class="h-1"
        />
      </template>
      <template #footer>
        <span class="me-auto text-sm text-fg-muted">
          Left <b class="font-semibold tabular-nums text-fg">22 books</b>
        </span>
        <span class="text-sm text-fg-muted">≈ 5 months</span>
      </template>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Header">
    <UiCard :padded="false" class="w-full max-w-md">
      <template #header>
        <UiTabs
          v-model="tab"
          ariaLabel="Client"
          :tabs="[
            { value: 'overview', label: 'Overview' },
            { value: 'payments', label: 'Payments' },
            { value: 'notes', label: 'Notes' },
          ]"
        >
          <template #overview
            ><p class="p-surface text-sm text-fg-muted">The overview of the client.</p></template
          >
          <template #payments
            ><p class="p-surface text-sm text-fg-muted">3 payments this month.</p></template
          >
          <template #notes><p class="p-surface text-sm text-fg-muted">Pays late.</p></template>
        </UiTabs>
      </template>
    </UiCard>
  </DemoBlock>

  <DemoBlock title="Footer">
    <div class="grid w-full gap-4">
      <UiCard title="Weekly digest" footer-variant="muted">
        <p class="text-sm text-fg-muted">
          {{
            digest
              ? 'Every Monday at 9:00 you get the invoices due that week and the ones that are late.'
              : 'Off: nobody gets the Monday summary of due and late invoices.'
          }}
        </p>
        <template #footer>
          <UiLink to="/components/link" class="me-auto text-sm">Preview the last digest</UiLink>
          <UiSwitch v-model="digest">Subscribe</UiSwitch>
        </template>
      </UiCard>
      <UiCard title="Idea: dark invoices">
        <p class="text-sm text-fg-muted">
          The quarterly report for the finance team, due next Friday.
        </p>
        <template #footer>
          <span
            class="me-auto flex items-center gap-4 text-sm text-fg-muted [&_svg]:h-4 [&_svg]:w-4"
          >
            <span class="flex items-center gap-1"><Heart aria-hidden="true" />24</span>
            <span class="flex items-center gap-1"><MessageSquare aria-hidden="true" />8</span>
            <span class="flex items-center gap-1"><Paperclip aria-hidden="true" />2</span>
          </span>
        </template>
      </UiCard>
    </div>
  </DemoBlock>
</template>
