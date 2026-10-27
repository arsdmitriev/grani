<script lang="ts">
export const blurb =
  'Write several lines, such as a note, address or biography, in a field that can grow with the text.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const note = ref('')
const address = ref(
  'Office 4, 12 Long Harbour Street, Northfield Business Park, second floor. Ring twice at the gate, the reception is on the left past the lifts; after six the door is locked and the parcel goes to the security desk.',
)
const bio = ref('Product designer at a small studio.')
const fixed = ref('')
const growing = ref('')
const oneRow = ref({ xs: '', sm: '', md: '' })
const wrong = ref('Deliver to the back door')
const comment = ref('')
// The app takes a note only while it fits in 140 characters; past that it keeps the note as it was.
const LIMIT = 140
const kept = ref('Leave it with the neighbor at number 14.')
const refusal = ref<string>()
function take(next: string) {
  if (next.length > LIMIT) {
    refusal.value = `The courier sees ${LIMIT} characters at most.`
    return
  }
  refusal.value = undefined
  kept.value = next
}
const sentNote = ref('Ring twice')
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Note">
        <UiTextarea v-model="note" placeholder="Anything the courier should know" />
      </UiField>
      <UiField label="Delivery instructions">
        <UiTextarea v-model="address" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField label="Bio" description="Shown on the public page." class="w-80 max-w-full">
      <UiTextarea v-model="bio" :maxlength="160" :rows="4" />
      <template #meta>{{ bio.length }} / 160</template>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Resize">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Fixed height">
        <UiTextarea v-model="fixed" resize="none" :rows="2" />
      </UiField>
      <UiField label="Grows with the text">
        <UiTextarea v-model="growing" resize="auto" :rows="2" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex w-80 max-w-full flex-col gap-4">
      <div v-for="s in ['xs', 'sm', 'md']" :key="s" class="flex items-start gap-2">
        <UiTextarea
          v-model="oneRow[s]"
          :size="s"
          :rows="1"
          resize="auto"
          :ariaLabel="`Note, ${s}`"
          placeholder="One row"
          class="flex-1"
        />
        <UiInput model-value="" :size="s" :ariaLabel="`Beside, ${s}`" placeholder="Input" />
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="Disabled">
        <UiTextarea model-value="" placeholder="Nothing to add here" disabled :rows="2" />
      </UiField>
      <UiField label="Read only">
        <UiTextarea model-value="Set by the sender" readonly :rows="2" />
      </UiField>
      <!-- Standalone: no field around it, so ariaLabel names it and invalid marks it. -->
      <UiTextarea v-model="wrong" ariaLabel="Invalid note" invalid :rows="2" />
      <UiField
        label="Comment"
        :error="comment.trim() ? undefined : 'Say where to leave the parcel.'"
        required
      >
        <UiTextarea v-model="comment" :rows="2" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField label="Note to the courier" :error="refusal" class="w-80 max-w-full">
      <UiTextarea :model-value="kept" :rows="3" @update:model-value="take" />
      <template #meta>{{ kept.length }} / {{ LIMIT }}</template>
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form
      class="flex w-80 max-w-full flex-col gap-4"
      @submit.prevent
      @reset="sentNote = 'Ring twice'"
    >
      <UiField label="Note">
        <UiTextarea v-model="sentNote" name="note" :rows="2" />
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">Sends note={{ sentNote || '(empty)' }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
</template>
