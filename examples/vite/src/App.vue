<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { BarChart3, Inbox } from '@lucide/vue'
import {
  UiAppShell,
  UiButton,
  UiCard,
  UiLink,
  UiModal,
  UiSelect,
  UiToaster,
  useConfirm,
  useToast,
  UiConfirm,
} from 'grani-ui'

const route = useRoute()
const currency = ref<string | null>(null)
const open = ref(false)
const toast = useToast()
const { confirm } = useConfirm()
const nav = [
  {
    items: [
      { to: '/', label: 'Overview', icon: BarChart3 },
      { to: '/orders', label: 'Orders', icon: Inbox, count: 3 },
    ],
  },
]
async function ask() {
  const ok = await confirm({
    title: 'Delete the draft?',
    message: 'It cannot be brought back.',
    confirmLabel: 'Delete',
    tone: 'danger',
  })
  if (ok) toast.show({ title: 'Deleted', tone: 'success' })
}
</script>

<template>
  <UiAppShell :nav="nav" brand="grani" :current="route.path">
    <div class="flex flex-col gap-4 p-4">
      <UiCard title="A Vue app">
        <div class="flex flex-wrap items-center gap-3">
          <UiButton data-test="open" @click="open = true">Open a window</UiButton>
          <UiButton variant="outline" data-test="toast" @click="toast.show({ title: 'Saved' })"
            >Toast</UiButton
          >
          <UiButton variant="outline" data-test="confirm" @click="ask">Confirm</UiButton>
          <UiButton to="/orders" variant="ghost" data-test="route">Orders</UiButton>
          <UiLink to="https://vuejs.org" data-test="external">Vue</UiLink>
          <!-- Not imported above: GraniResolver in vite.config.ts brings it in. -->
          <UiBadge tone="success" data-test="resolved">Resolved</UiBadge>
        </div>
        <UiSelect
          v-model="currency"
          aria-label="Currency"
          class="mt-4 w-60"
          :items="[
            { value: 'eur', label: 'Euro' },
            { value: 'usd', label: 'US dollar' },
          ]"
        />
      </UiCard>
    </div>
    <UiModal v-model:open="open" title="A window">
      <p class="text-sm">It opens, traps the focus and closes.</p>
    </UiModal>
    <UiToaster />
    <UiConfirm />
  </UiAppShell>
</template>
