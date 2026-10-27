<script lang="ts">
export const blurb =
  'Add files by dragging or browsing; a message names each file that cannot be added and says why.'
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const pdf = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' })
const contract = ref<File[]>([])
const photos = ref<File[]>([])
// One upload's life on one card: the state below switches it, the host owns busy and progress.
// Preparing is busy before a length is known: the bar runs on its own.
const upload = ref([pdf('contract-2026.pdf', 3)])
const stage = ref('uploading')
const failed = computed(() => stage.value === 'failed')
// Uploading runs as an upload does: the percent climbs, and at 100 the file is uploaded. The
// ring and the row's fill follow it; Failed stops it where it stood.
const percent = ref(0)
let ticking: ReturnType<typeof setInterval> | undefined
watch(
  stage,
  (now) => {
    clearInterval(ticking)
    if (now !== 'uploading') return
    percent.value = 0
    ticking = setInterval(() => {
      percent.value = Math.min(100, percent.value + 4)
      if (percent.value === 100) {
        clearInterval(ticking)
        stage.value = 'uploaded'
      }
    }, 150)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(ticking))
const many = ref([
  pdf('report-01.pdf', 2),
  pdf('report-02.pdf', 3),
  pdf('report-03.pdf', 2),
  pdf('report-04.pdf', 4),
  pdf('report-05.pdf', 1),
  pdf('signed-agreement-with-all-appendices-and-the-final-price-list-v3.pdf', 2),
])
const disabled = ref([])
const invalid = ref([])
// The host keeps these files: a drop is refused, the list and the form stay on them.
const kept = ref([pdf('statement-2026-09.pdf', 1)])
const sent = ref([pdf('invoice-1042.pdf', 1)])
const drawerOpen = ref(false)
const receipts = ref([])
</script>

<template>
  <DemoBlock title="Base">
    <UiDropzone
      v-model="contract"
      accept="application/pdf,.pdf"
      :max-size="30 * 1024 * 1024"
      ariaLabel="Contract"
      class="w-full max-w-96"
    />
  </DemoBlock>
  <DemoBlock title="Multiple">
    <UiDropzone
      v-model="photos"
      accept="image/*"
      multiple
      :max-files="4"
      :max-size="5 * 1024 * 1024"
      ariaLabel="Photos"
      class="w-full max-w-96"
    >
      Drop up to four photos here, or
      <template #hint>JPG, PNG or WebP, 5 MB each</template>
    </UiDropzone>
  </DemoBlock>
  <DemoBlock title="Upload">
    <div class="flex w-full flex-col items-center gap-4">
      <UiField label="Contract" class="w-full max-w-96">
        <UiDropzone
          v-model="upload"
          :busy="stage === 'preparing' || stage === 'uploading'"
          :progress="stage === 'uploading' ? percent : stage === 'uploaded' ? 100 : null"
          :failed="failed ? 'The connection dropped.' : false"
          @cancel="stage = 'idle'"
          @retry="stage = 'uploading'"
        />
      </UiField>
      <UiRadioGroup v-model="stage" variant="segmented" aria-label="State of the upload">
        <UiRadio value="idle">Idle</UiRadio>
        <UiRadio value="preparing">Preparing</UiRadio>
        <UiRadio value="uploading">Uploading</UiRadio>
        <UiRadio value="uploaded">Uploaded</UiRadio>
        <UiRadio value="failed">Failed</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Many">
    <UiDropzone
      v-model="many"
      accept="application/pdf"
      multiple
      :max-files="10"
      ariaLabel="Reports"
      class="w-full max-w-96"
    />
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiDropzone v-model="disabled" disabled ariaLabel="Disabled" class="w-72" />
    <UiDropzone v-model="invalid" invalid ariaLabel="Invalid" class="w-72" />
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField
      label="Statement"
      description="The app keeps this file: a drop is not taken."
      class="w-full max-w-96"
    >
      <UiDropzone :model-value="kept" accept="application/pdf,.pdf" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form
      class="flex w-full max-w-96 flex-col items-start gap-4"
      @submit.prevent
      @reset="sent = [pdf('invoice-1042.pdf', 1)]"
    >
      <UiField label="Invoice" required class="w-full">
        <UiDropzone v-model="sent" name="invoice" accept="application/pdf,.pdf" required />
      </UiField>
      <span class="text-xs text-fg-muted">
        Sends {{ sent.length ? sent.map((f) => f.name).join(', ') : 'nothing' }}
      </span>
      <div class="flex gap-2">
        <UiButton type="submit" size="xs">Send</UiButton>
        <UiButton type="reset" variant="secondary" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
  <DemoBlock title="Drawer">
    <UiButton variant="outline" @click="drawerOpen = true">New expense</UiButton>
    <UiCrudDrawer
      v-model:open="drawerOpen"
      title="New expense"
      :persistent="receipts.length > 0"
      @submit="drawerOpen = false"
    >
      <UiCard>
        <UiField label="Receipts">
          <UiDropzone v-model="receipts" multiple accept="image/*,.pdf" />
        </UiField>
      </UiCard>
    </UiCrudDrawer>
  </DemoBlock>
</template>
