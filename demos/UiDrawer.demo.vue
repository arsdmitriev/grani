<script lang="ts">
export const blurb =
  'Read or edit details in a side panel without leaving the list or page behind it.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Download, ExternalLink, Mail } from '@lucide/vue'

// One list of invoices behind every tab: the panel stands beside it, and the list answers.
type Status = 'draft' | 'sent' | 'paid'
interface Line {
  item: string
  qty: string
  amount: string
}
interface Invoice {
  id: string
  client: string
  total: string
  issued: string
  due: string
  status: Status
  lines: Line[]
  payments: { on: string; how: string; amount: string }[]
}
const INVOICES: Invoice[] = [
  {
    id: 'INV-0042',
    client: 'Acme Corp',
    total: '€1 240.00',
    issued: 'Sep 3',
    due: 'Sep 30',
    status: 'paid',
    lines: [
      { item: 'Design review', qty: '2 × €400.00', amount: '€800.00' },
      { item: 'Prototype', qty: '1 × €440.00', amount: '€440.00' },
    ],
    payments: [{ on: 'Sep 12', how: 'Bank transfer', amount: '€1 240.00' }],
  },
  {
    id: 'INV-0043',
    client: 'Birch & Co',
    total: '€380.00',
    issued: 'Sep 9',
    due: 'Oct 9',
    status: 'sent',
    lines: [{ item: 'Support, September', qty: '4 h × €95.00', amount: '€380.00' }],
    payments: [],
  },
  {
    id: 'INV-0044',
    client: 'Cedar Ltd',
    total: '€2 115.50',
    issued: 'Sep 14',
    due: 'Oct 14',
    status: 'sent',
    lines: [
      { item: 'Workshop', qty: '1 × €1 500.00', amount: '€1 500.00' },
      { item: 'Travel', qty: '1 × €415.50', amount: '€415.50' },
      { item: 'Materials', qty: '4 × €50.00', amount: '€200.00' },
    ],
    payments: [{ on: 'Sep 20', how: 'Card', amount: '€500.00' }],
  },
  {
    id: 'INV-0045',
    client: 'Northwind',
    total: '€640.00',
    issued: 'Sep 20',
    due: 'Oct 20',
    status: 'draft',
    lines: [{ item: 'Audit', qty: '1 × €640.00', amount: '€640.00' }],
    payments: [],
  },
  {
    id: 'INV-0046',
    client: 'Lumen Studio',
    total: '€95.00',
    issued: 'Sep 28',
    due: 'Oct 28',
    status: 'paid',
    lines: [{ item: 'Hosting, October', qty: '1 × €95.00', amount: '€95.00' }],
    payments: [{ on: 'Sep 29', how: 'Card', amount: '€95.00' }],
  },
]
const STATUS: Record<Status, { label: string; tone: 'neutral' | 'info' | 'success' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
}

// Detail: the row pressed opens its own invoice.
const current = ref<Invoice | null>(null)
const detailOpen = ref(false)
const openRow = (row: Invoice) => {
  current.value = row
  detailOpen.value = true
}

// Typed but not sent: a press beside the panel or Escape shakes it instead of closing; the
// cross and Cancel still close, as an explicit choice.
const reminder = ref(false)
const BLANK = {
  to: 'accounts@birch.example',
  subject: 'INV-0043 is due on Oct 9',
  body: '',
}
const mail = ref({ ...BLANK })
const unsaved = computed(() => mail.value.body.trim() !== '')
function openReminder() {
  mail.value = { ...BLANK }
  reminder.value = true
}

const terms = ref(false)
</script>

<template>
  <DemoBlock title="Detail">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem
          v-for="row in INVOICES"
          :key="row.id"
          as="button"
          :title="row.id"
          :description="row.client"
          @click="openRow(row)"
        >
          <template #actions>
            <UiBadge :tone="STATUS[row.status].tone" :label="STATUS[row.status].label" />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiDrawer v-model:open="detailOpen" :title="current?.id ?? ''">
      <template #description>
        <UiBadge
          v-if="current"
          :tone="STATUS[current.status].tone"
          :label="STATUS[current.status].label"
          variant="inline"
          size="sm"
        />
        <span>{{ current?.client }}</span>
      </template>
      <template #actions>
        <UiIconButton :icon="ExternalLink" ariaLabel="Open as a page" variant="ghost" />
      </template>
      <template v-if="current">
        <UiCard>
          <p class="text-2xl font-semibold tabular-nums text-fg">{{ current.total }}</p>
          <p class="text-sm text-fg-muted">Due {{ current.due }} · Issued {{ current.issued }}</p>
        </UiCard>
        <UiCard title="Lines" :padded="false">
          <UiList>
            <UiListItem
              v-for="line in current.lines"
              :key="line.item"
              size="sm"
              :title="line.item"
              :description="line.qty"
            >
              <template #actions>
                <span class="text-sm tabular-nums text-fg">{{ line.amount }}</span>
              </template>
            </UiListItem>
          </UiList>
        </UiCard>
        <UiCard title="Payments" :padded="false">
          <UiList>
            <UiListItem
              v-for="pay in current.payments"
              :key="pay.on"
              size="sm"
              :title="pay.on"
              :description="pay.how"
            >
              <template #actions>
                <span class="text-sm tabular-nums text-fg">{{ pay.amount }}</span>
              </template>
            </UiListItem>
            <UiListItem
              v-if="!current.payments.length"
              size="sm"
              title="No payments yet"
              :description="`Due ${current.due}`"
            />
          </UiList>
        </UiCard>
        <UiCard :padded="false">
          <UiList>
            <UiListItem
              v-if="current.status !== 'paid'"
              as="button"
              size="sm"
              title="Send a reminder"
            >
              <template #actions><Mail aria-hidden="true" /></template>
            </UiListItem>
            <UiListItem as="button" size="sm" title="Download the PDF">
              <template #actions><Download aria-hidden="true" /></template>
            </UiListItem>
            <UiListItem as="button" size="sm" title="Copy the link">
              <template #actions><Copy aria-hidden="true" /></template>
            </UiListItem>
          </UiList>
        </UiCard>
      </template>
    </UiDrawer>
  </DemoBlock>
  <DemoBlock title="Persistent" row>
    <UiButton variant="outline" @click="openReminder">Send a reminder</UiButton>
    <UiDrawer
      v-model:open="reminder"
      title="Send a reminder"
      description="INV-0043 · Birch & Co"
      :persistent="unsaved"
    >
      <UiCard>
        <UiStack>
          <UiField label="To"><UiInput v-model="mail.to" type="email" /></UiField>
          <UiField label="Subject"><UiInput v-model="mail.subject" /></UiField>
          <UiField label="Message">
            <UiTextarea v-model="mail.body" placeholder="Type, then press Escape" />
          </UiField>
        </UiStack>
      </UiCard>
      <template #footer>
        <UiButton variant="secondary" @click="reminder = false">Cancel</UiButton>
        <UiButton @click="reminder = false">Send</UiButton>
      </template>
    </UiDrawer>
  </DemoBlock>
  <DemoBlock title="Long" row>
    <UiButton variant="outline" @click="terms = true">Read the terms</UiButton>
    <UiDrawer v-model:open="terms" title="Terms of the service" size="lg">
      <UiStack class="text-sm text-fg-muted">
        <p v-for="n in 24" :key="n">
          {{ n }}. The service keeps your records for as long as the account is open and for thirty
          days after it closes, so a closed account can be opened again with everything in place.
        </p>
      </UiStack>
    </UiDrawer>
  </DemoBlock>
</template>
