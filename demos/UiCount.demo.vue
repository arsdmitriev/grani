<script lang="ts">
export const blurb =
  'Show a compact count beside a label, or a dot when only the presence of an update matters.'
</script>

<script setup lang="ts">
import type { Tone } from '../types/ui'

interface Place {
  label: string
  count: number
  tone: Tone
}
const tones: Tone[] = ['neutral', 'brand', 'info', 'success', 'warning', 'danger']
const menu: Place[] = [
  { label: 'Inbox', count: 4, tone: 'brand' },
  { label: 'Orders', count: 12, tone: 'brand' },
  { label: 'Disputes', count: 2, tone: 'danger' },
  { label: 'Archive', count: 0, tone: 'neutral' },
]
</script>

<template>
  <DemoBlock title="Base" row>
    <UiCount :count="3" />
    <UiCount :count="12" tone="info" />
    <UiCount :count="20" variant="solid" tone="brand" />
    <UiCount :count="120" variant="solid" tone="danger" />
    <UiCount :count="5" size="sm" variant="solid" tone="success" />
  </DemoBlock>
  <DemoBlock title="Tones">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <UiCount v-for="tone in tones" :key="tone" :count="4" :tone="tone" />
      </div>
      <div class="flex items-center gap-2">
        <UiCount v-for="tone in tones" :key="tone" :count="4" :tone="tone" variant="solid" />
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Zero and overflow" row>
    <UiCount :count="0" />
    <UiCount :count="9" />
    <UiCount :count="99" />
    <UiCount :count="100" />
    <UiCount :count="12" :max="9" size="sm" />
  </DemoBlock>
  <DemoBlock title="Alone" row>
    <span class="text-sm text-fg">Messages</span>
    <UiCount :count="4" variant="solid" tone="brand" ariaLabel="4 unread" />
  </DemoBlock>
  <DemoBlock title="On buttons" row>
    <UiButton variant="outline">Inbox <UiCount :count="3" variant="solid" tone="brand" /></UiButton>
    <UiButton variant="outline"
      >Failed <UiCount :count="12" variant="solid" tone="danger"
    /></UiButton>
    <UiButton variant="outline">Review <UiCount :count="20" variant="solid" /></UiButton>
    <UiButton variant="ghost">Drafts <UiCount :count="7" /></UiButton>
  </DemoBlock>
  <DemoBlock title="In a list of places">
    <UiCard :padded="false" class="w-full max-w-xs">
      <UiList>
        <UiListItem
          v-for="item in menu"
          :key="item.label"
          size="sm"
          :title="item.label"
          to="/components/count"
        >
          <template v-if="item.count" #actions>
            <UiCount :count="item.count" variant="solid" :tone="item.tone" />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Mark" row>
    <UiButton variant="outline"
      >Payments <UiCount variant="solid" tone="danger">!</UiCount></UiButton
    >
  </DemoBlock>
  <DemoBlock title="Dot" row>
    <UiButton variant="ghost"
      >Updates <UiCount dot variant="solid" tone="brand" /><span class="sr-only"
        >, new</span
      ></UiButton
    >
    <UiButton variant="ghost" size="xs"
      >News <UiCount dot size="sm" variant="solid" tone="danger" /><span class="sr-only"
        >, new</span
      ></UiButton
    >
  </DemoBlock>
</template>
