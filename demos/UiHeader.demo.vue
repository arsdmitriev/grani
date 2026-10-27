<script lang="ts">
export const blurb =
  'Introduce a page or section with a title, a short explanation and the actions available there.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'

const digest = ref(true)
const mentions = ref(false)
</script>

<template>
  <DemoBlock title="Page">
    <UiStack gap="title" class="w-full max-w-2xl">
      <UiHeader title="Users" description="Who can sign in to the workspace.">
        <template #actions>
          <UiButton><Plus aria-hidden="true" />Invite</UiButton>
        </template>
      </UiHeader>
      <UiCard :padded="false">
        <UiList>
          <UiListItem title="Anna Petrova" description="anna@work" />
          <UiListItem title="Ivan Sidorov" description="ivan@work" />
        </UiList>
      </UiCard>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Legend">
    <UiCard class="w-full max-w-md">
      <UiStack>
        <UiHeader variant="legend" title="Contact" />
        <UiField label="Email"><UiInput model-value="hello@example.com" /></UiField>
        <UiField label="Phone"><UiInput model-value="+1 415 555 0142" /></UiField>
        <UiHeader variant="legend" title="Billing" />
        <UiField label="Billing email"><UiInput model-value="billing@example.com" /></UiField>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Card">
    <UiCard
      title="Account"
      description="How we reach you and what we send."
      class="w-full max-w-md"
    >
      <UiStack>
        <UiHeader variant="legend" title="Contact" />
        <UiField label="Email"><UiInput model-value="hello@example.com" /></UiField>
        <UiField label="Phone"><UiInput model-value="+1 415 555 0142" /></UiField>
        <UiHeader variant="legend" title="Notifications" />
        <UiSwitch v-model="digest">Email digest every Monday</UiSwitch>
        <UiSwitch v-model="mentions">Mentions in comments</UiSwitch>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Long">
    <div class="w-full max-w-md">
      <UiHeader
        title="Quarterly reconciliation of supplier invoices"
        description="Every open invoice against its payment, by supplier."
      >
        <template #actions>
          <UiButton variant="outline">Export</UiButton>
        </template>
      </UiHeader>
    </div>
  </DemoBlock>
</template>
