<script lang="ts">
export const blurb =
  'Organize an app around a sidebar for navigation and a main area for the page you are working on.'
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BarChart3, Inbox, LifeBuoy, ReceiptText, Settings, Users } from '@lucide/vue'
import { useToday } from '../composables/useToday'
import type { NavGroup } from '../types/ui'

// The app's wordmark: the name the home link is read by is the word the logo shows.
// lint: english-ok
const brand = 'grani'
// The places are anchors on this page: the one pressed is the current one, and on arrival the
// page's hash. An app passes its route's path instead. A server never sees a hash: it is read once
// the page is in the browser.
const current = ref('#overview')
const follow = (e: MouseEvent) => {
  const to = (e.target as Element).closest('a[href^="#"]')?.getAttribute('href')
  if (to) current.value = to
}
// Sample figures, new each day: read from today's date in the browser, so the server's page and the
// client's agree, and a page photographed on a fixed day is the same every time.
const goal = ref<{ percent: number; left: string; days: number; perDay: string } | null>(null)
const amount = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))
const { now } = useToday()
onMounted(() => {
  if (location.hash) current.value = location.hash
  const day = Number(now.value.replaceAll('-', ''))
  const target = 10000
  const earned = 500 + ((day * 7919) % 9000)
  const days = 1 + ((day * 104729) % 27)
  goal.value = {
    percent: Math.round((earned / target) * 100),
    left: amount(target - earned),
    days,
    perDay: amount((target - earned) / days),
  }
})
const nav: NavGroup[] = [
  {
    items: [
      { to: '#overview', label: 'Overview', icon: BarChart3 },
      { to: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
      { to: '#invoices', label: 'Invoices', icon: ReceiptText },
      { to: '#clients', label: 'Clients and their contracts, by region', icon: Users },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '#settings', label: 'Settings', icon: Settings },
      { to: '#help', label: 'Help', icon: LifeBuoy },
    ],
  },
]
// Collapsed on the server and in the browser alike: the first paint and the page agree.
const collapsed = ref(true)
// The places on their way, switched by hand: the app has asked for them and has nothing yet.
const placesState = ref('loading')
const loadingNav = computed<NavGroup[]>(() => (placesState.value === 'loading' ? [] : nav))
const title = computed(
  () => nav.flatMap((g) => g.items).find((i) => i.to === current.value)?.label ?? 'Overview',
)
</script>

<template>
  <DemoBlock title="Sidebar" wide>
    <UiAppShell
      :brand="brand"
      home="#overview"
      :current="current"
      :nav="nav"
      class="w-full rounded-card border border-border [--ui-shell-height:560px]"
      @click="follow"
    >
      <UiStack gap="title">
        <UiHeader :title="title" description="The page scrolls here; the sidebar stays." />
        <div class="grid gap-4 @3xl:grid-cols-3">
          <UiCard v-for="n in 6" :key="n" :title="`Block ${n}`">
            <div class="h-16 rounded-control bg-surface-muted" />
          </UiCard>
        </div>
      </UiStack>
      <template #logo>
        <span class="text-base font-bold tracking-tight text-fg">
          <!-- lint: english-ok -->
          grani<i aria-hidden="true" class="ms-0.5 inline-block size-1 rotate-45 bg-brand-solid" />
        </span>
      </template>
      <template #mark
        ><span aria-hidden="true" class="m-1 size-3 shrink-0 rotate-45 bg-brand-solid"
      /></template>
      <template v-if="goal" #banner>
        <div class="flex items-baseline justify-between text-xs font-medium text-fg-muted">
          <span>Left to the goal</span>
          <span class="tabular-nums">{{ goal.percent }}%</span>
        </div>
        <p class="mt-1 text-base font-semibold tabular-nums text-fg">{{ goal.left }} EUR</p>
        <UiProgress
          aria-label="Left to the goal"
          :value="goal.percent"
          :max="100"
          class="mt-2 h-1.5"
          :value-text="`${goal.percent}% of the goal`"
        />
        <p class="mt-2 text-xs text-fg-muted">
          {{ goal.days }} days left, {{ goal.perDay }} EUR a day
        </p>
      </template>
    </UiAppShell>
  </DemoBlock>

  <DemoBlock title="Collapsed" wide>
    <UiAppShell
      v-model:collapsed="collapsed"
      :brand="brand"
      home="#overview"
      :current="current"
      :nav="nav"
      class="w-full rounded-card border border-border [--ui-shell-height:480px]"
      @click="follow"
    >
      <UiHeader
        :title="title"
        description="Only the icons: each is named in a tooltip. Keeping the state across visits is the app's."
      />
      <template #mark
        ><span aria-hidden="true" class="m-1 size-3 shrink-0 rotate-45 bg-brand-solid"
      /></template>
    </UiAppShell>
  </DemoBlock>

  <DemoBlock title="Loading" wide>
    <div class="flex w-full flex-col items-center gap-4">
      <UiAppShell
        :brand="brand"
        home="#overview"
        :current="current"
        :nav="loadingNav"
        :loading="placesState === 'loading'"
        class="w-full rounded-card border border-border [--ui-shell-height:420px]"
        @click="follow"
      >
        <UiHeader title="Overview" description="The places come from the server a moment later." />
      </UiAppShell>
      <UiRadioGroup v-model="placesState" variant="segmented" aria-label="State of the places">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="Narrow">
    <UiAppShell
      :brand="brand"
      home="#overview"
      :current="current"
      :nav="nav"
      class="w-[360px] max-w-full rounded-card border border-border [--ui-shell-height:560px]"
      @click="follow"
    >
      <UiStack gap="title">
        <UiHeader :title="title" />
        <UiStack>
          <UiCard v-for="n in 3" :key="n" :title="`Block ${n}`">
            <div class="h-16 rounded-control bg-surface-muted" />
          </UiCard>
        </UiStack>
      </UiStack>
    </UiAppShell>
  </DemoBlock>
</template>
