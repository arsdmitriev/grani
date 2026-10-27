<script lang="ts">
export const blurb =
  'Check a decision before an action that cannot be undone, and show progress while the confirmed action runs.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Trash2 } from '@lucide/vue'
import { useConfirm } from '../composables/useConfirm'

const { confirm } = useConfirm()

// A list of orders: deleting one asks first, waits for the server, then the row leaves.
const ORDERS = [
  { id: 'ORD-1041', client: 'Acme Corp', total: '€1 240.00' },
  { id: 'ORD-1042', client: 'Birch & Co', total: '€380.00' },
  { id: 'ORD-1043', client: 'Cedar Ltd', total: '€2 115.50' },
]
const orders = ref([...ORDERS])
const fail = ref(false)
// The request behind the answer: a second the server takes, and its outcome.
const deleteOrder = (id: string) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (fail.value) return reject(new Error('offline'))
      orders.value = orders.value.filter((o) => o.id !== id)
      resolve()
    }, 1000),
  )
function remove(id: string) {
  void confirm({
    title: `Delete ${id}?`,
    message: 'The order and its payments are removed. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
    action: () => deleteOrder(id),
    success: `${id} deleted`,
    error: `Could not delete ${id}`,
  })
}
const restore = () => (orders.value = [...ORDERS])

// A plain question: nothing to wait for, the answer is all.
const last = ref('')
async function leave() {
  const yes = await confirm({
    message: 'Leave the page? The draft stays saved.',
    confirmLabel: 'Leave',
  })
  last.value = yes ? 'Left' : 'Stayed'
}
</script>

<template>
  <DemoBlock title="Base">
    <UiStack class="w-full max-w-md">
      <UiCard :padded="false">
        <UiList>
          <UiListItem v-for="o in orders" :key="o.id" :title="o.id" :description="o.client">
            <template #actions>
              <span class="text-sm tabular-nums text-fg">{{ o.total }}</span>
              <UiIconButton
                :icon="Trash2"
                variant="ghost"
                tone="danger"
                :ariaLabel="`Delete ${o.id}`"
                @click="remove(o.id)"
              />
            </template>
          </UiListItem>
          <UiListItem v-if="!orders.length" title="No orders left">
            <template #actions>
              <UiButton variant="outline" size="xs" @click="restore">Bring them back</UiButton>
            </template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiSwitch v-model="fail">The server fails</UiSwitch>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Plain">
    <UiStack align="center">
      <UiButton variant="outline" @click="leave">Leave the page</UiButton>
      <!-- The line is always there: an answer arriving does not move the button. -->
      <p class="h-5 text-sm text-fg-muted">{{ last && `Answer: ${last}` }}</p>
    </UiStack>
  </DemoBlock>
</template>
