<script lang="ts">
export const blurb =
  "See a short message about an action's progress or result, with an action such as Undo when available."
</script>

<script setup lang="ts">
import { Link } from '@lucide/vue'
import { useToast } from '../composables/useToast'

const toast = useToast()
let n = 0
const send = () =>
  toast.promise(new Promise<number>((resolve) => setTimeout(() => resolve(++n), 1500)), {
    loading: 'Sending the invoice',
    success: (id) => ({ title: `Invoice ${1040 + id} sent`, description: 'The client has it.' }),
    error: 'Could not send',
  })
// The returned promise fails as the request does: here the error toast is the whole answer.
const fail = () =>
  toast
    .promise(new Promise((_, reject) => setTimeout(() => reject(new Error('down')), 1500)), {
      loading: 'Saving',
      success: 'Saved',
      error: { title: 'Could not save', description: 'The server did not answer.' },
    })
    .catch(() => {})
const burst = () => {
  toast.success('Invoice 1041 sent')
  toast.info('Reminder scheduled', { description: 'Tomorrow at 9:00' })
  toast.warning('Two items are out of stock')
  toast.error('Payment declined', { description: 'The card was refused by the bank.' })
  toast.success('Client updated')
}
</script>

<template>
  <DemoBlock title="Outcomes" row>
    <UiButton variant="outline" @click="toast.success('Invoice sent')">Success</UiButton>
    <UiButton
      variant="outline"
      @click="toast.info('Reminder scheduled', { description: 'Tomorrow at 9:00' })"
    >
      Info
    </UiButton>
    <UiButton variant="outline" @click="toast.warning('Two items are out of stock')"
      >Warning</UiButton
    >
    <UiButton
      variant="outline"
      @click="toast.error('Could not save', { description: 'The server did not answer.' })"
    >
      Error
    </UiButton>
    <UiButton variant="outline" @click="toast.show({ title: 'Draft saved' })">Neutral</UiButton>
    <UiButton variant="outline" @click="toast.success('Link copied', { icon: Link })">
      Own glyph
    </UiButton>
    <UiButton
      variant="outline"
      @click="toast.error('Payment declined', { duration: 'persistent' })"
    >
      Until closed
    </UiButton>
  </DemoBlock>
  <DemoBlock title="Undo" row>
    <UiButton
      variant="outline"
      @click="
        toast.show({
          title: 'Invoice deleted',
          action: { label: 'Undo', onClick: () => toast.success('Invoice restored') },
        })
      "
    >
      Delete with undo
    </UiButton>
  </DemoBlock>
  <DemoBlock title="Request" row>
    <UiButton variant="outline" @click="send">Send an invoice</UiButton>
    <UiButton variant="outline" @click="fail">Save and fail</UiButton>
  </DemoBlock>
  <DemoBlock title="Pile" row>
    <UiButton variant="outline" @click="burst">Five at once</UiButton>
    <UiButton variant="ghost" @click="toast.close()">Close all</UiButton>
  </DemoBlock>
  <DemoBlock title="Persistent" row>
    <UiButton
      variant="outline"
      @click="
        toast.info('A new version is out', {
          duration: 'persistent',
          action: { label: 'Reload', onClick: () => toast.success('Reloaded') },
        })
      "
    >
      Stays until closed
    </UiButton>
  </DemoBlock>
</template>
