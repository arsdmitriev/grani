<script lang="ts">
export const blurb =
  'Open filter choices from a toolbar button and narrow a list by one or more groups of options.'
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

const categories = ref(['food', 'fun'])
const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]

const tags = ref([])
const TAGS = ['Urgent', 'Wholesale', 'Gift', 'Repeat', 'Kiosk', 'Delivery', 'Pickup', 'Office'].map(
  (l) => ({ value: l.toLowerCase(), label: l }),
)

const status = ref(['paid'])
const channel = ref([])
const STATUS = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
]
const CHANNEL = [
  { value: 'web', label: 'Web' },
  { value: 'kiosk', label: 'Kiosk' },
]
// The button counts the dimensions with a value, not every tick.
const chosen = computed(() => Number(status.value.length > 0) + Number(channel.value.length > 0))
function resetAll() {
  status.value = []
  channel.value = []
}

// The count takes the glyph's place: pick and the button keeps its size, at every step.
const sized = { xs: ref(['food']), sm: ref([]), md: ref(['food', 'fun']) }
// The life of the options' load, switched by hand: a first load has no options yet, a refresh
// keeps them in view.
const listState = ref('loading')
const loadingPick = ref(['transport'])
const loadingItems = computed(() => (listState.value === 'loading' ? [] : CATEGORIES))
</script>

<template>
  <DemoBlock title="One dimension" row>
    <UiFilter v-model="categories" label="Categories" :items="CATEGORIES" />
  </DemoBlock>
  <DemoBlock title="Many options: a search" row>
    <UiFilter v-model="tags" label="Tags" :items="TAGS" />
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiFilter v-model="sized.xs.value" label="Categories" :items="CATEGORIES" size="xs" />
    <UiFilter v-model="sized.sm.value" label="Categories" :items="CATEGORIES" />
    <UiFilter v-model="sized.md.value" label="Categories" :items="CATEGORIES" size="md" />
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex flex-col items-center gap-4">
      <UiFilter
        v-model="loadingPick"
        label="Categories"
        :items="loadingItems"
        :loading="listState !== 'loaded'"
      />
      <UiRadioGroup v-model="listState" variant="segmented" aria-label="State of the options">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Refreshing</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Several dimensions" row>
    <UiFilter label="Filters" :count="chosen" @reset="resetAll">
      <UiCard><UiFilterList v-model="status" :items="STATUS" ariaLabel="Status" /></UiCard>
      <UiCard><UiFilterList v-model="channel" :items="CHANNEL" ariaLabel="Channel" /></UiCard>
    </UiFilter>
  </DemoBlock>
</template>
