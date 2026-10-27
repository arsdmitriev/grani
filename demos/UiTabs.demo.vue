<script lang="ts">
export const blurb = 'Switch between sections of the same screen without showing them all at once.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const tab = ref('overview')
const pane = ref('overview')
const twoFactor = ref(false)
const month = ref('sep')
const range = ref('month')
const period = ref('draft')
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
].map((label) => ({ value: label.toLowerCase(), label: `${label} 2026` }))
const EVENTS = [
  { title: 'Invoice INV-1045 paid', when: 'Today, 09:15' },
  { title: 'Contact changed', when: 'Yesterday, 18:02' },
  { title: 'Note added by Ivan', when: 'Sep 27, 11:40' },
]
const SESSIONS = [
  { title: 'MacBook Pro, Lisbon', when: 'This device' },
  { title: 'iPhone 15, Lisbon', when: '2 hours ago' },
  { title: 'Firefox on Windows, Porto', when: '3 days ago' },
]
</script>

<template>
  <DemoBlock title="Panel">
    <UiTabs
      v-model="pane"
      class="w-full max-w-md"
      ariaLabel="Account"
      :tabs="[
        { value: 'overview', label: 'Overview' },
        {
          value: 'security',
          label: 'Security',
          badge: '!',
          badgeTone: 'danger',
          badgeLabel: 'needs attention',
        },
        { value: 'sessions', label: 'Sessions', badge: 3, badgeLabel: '3 active' },
      ]"
    >
      <template #header>
        <UiListItem title="Anna Petrova" description="Second factor is off">
          <template #media><UiAvatar name="Anna Petrova" size="md" /></template>
        </UiListItem>
      </template>
      <template #overview>
        <UiList>
          <UiListItem title="Email" description="anna@northwind.example" />
          <UiListItem title="Language" description="English" />
        </UiList>
      </template>
      <template #security>
        <UiList>
          <UiListItem
            as="label"
            title="Second factor"
            description="A code from an app at every sign-in."
          >
            <template #actions><UiSwitch v-model="twoFactor" /></template>
          </UiListItem>
        </UiList>
      </template>
      <template #sessions>
        <UiList>
          <UiListItem v-for="d in SESSIONS" :key="d.title" :title="d.title" :description="d.when" />
        </UiList>
      </template>
    </UiTabs>
  </DemoBlock>
  <DemoBlock title="Underline">
    <!-- The strip is the card's header, the pane its body: one frame, no gap between them. -->
    <UiCard :padded="false" class="w-full max-w-md">
      <template #header>
        <UiTabs
          v-model="tab"
          variant="underline"
          ariaLabel="Sections of the record"
          :tabs="[
            { value: 'overview', label: 'Overview' },
            { value: 'activity', label: 'Activity', badge: 12, badgeLabel: '12 new' },
            { value: 'settings', label: 'Settings' },
          ]"
        >
          <template #overview>
            <UiList>
              <UiListItem title="Client" description="Northwind Traders" />
              <UiListItem title="Amount">
                <template #actions><UiMoneyCell :value="1280" currency="EUR" /></template>
              </UiListItem>
              <UiListItem title="Status"
                ><template #actions><UiBadge tone="success" label="Paid" /></template
              ></UiListItem>
            </UiList>
          </template>
          <template #activity>
            <UiList>
              <UiListItem
                v-for="e in EVENTS"
                :key="e.title"
                :title="e.title"
                :description="e.when"
              />
            </UiList>
          </template>
          <template #settings>
            <UiList>
              <UiListItem
                as="label"
                title="Email on payment"
                description="A letter when an invoice is paid."
              >
                <template #actions><UiSwitch :model-value="true" /></template>
              </UiListItem>
            </UiList>
          </template>
        </UiTabs>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Many tabs">
    <!-- Wider than its strip: the edges fade, arrows page on a desktop pointer, the selected tab rides into view. -->
    <div class="w-full max-w-sm">
      <UiTabs v-model="month" variant="underline" ariaLabel="Month" :tabs="MONTHS" />
    </div>
  </DemoBlock>
  <DemoBlock title="Medium">
    <UiTabs
      v-model="range"
      variant="underline"
      size="md"
      ariaLabel="Range"
      class="w-full max-w-sm"
      :tabs="[
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
      ]"
    >
      <template #week><p class="text-sm text-fg-muted">The last seven days.</p></template>
      <template #month><p class="text-sm text-fg-muted">September, day by day.</p></template>
      <template #year><p class="text-sm text-fg-muted">2026, month by month.</p></template>
    </UiTabs>
  </DemoBlock>
  <DemoBlock title="Disabled">
    <!-- Shown but not chosen: the arrows pass over it, a click does nothing. -->
    <UiTabs
      v-model="period"
      variant="underline"
      ariaLabel="Period"
      class="w-full max-w-sm"
      :tabs="[
        { value: 'draft', label: 'Draft' },
        { value: 'review', label: 'Review', disabled: true },
        { value: 'published', label: 'Published' },
      ]"
    />
  </DemoBlock>
</template>
