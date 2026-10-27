<script lang="ts">
export const blurb =
  'Move between pages with Previous, Next and page numbers below a list or table.'
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const page = ref(1)
const far = ref(12)
const compactPage = ref(1)
// The list loads for a moment after each page is asked: the pressed arrow spins and keeps the
// focus, and a second press asks nothing.
const loadingPage = ref(2)
const loading = ref(false)
function ask(next: number) {
  loadingPage.value = next
  loading.value = true
  setTimeout(() => (loading.value = false), 900)
}
const sized = { xs: ref(3), sm: ref(3), md: ref(3) }
// The list shrank to five pages under page 9: the pager draws the last one, and the app moves its
// page there, as UiDataTable does, so the next request names a page that exists.
const stale = ref(9)
const lastPage = 5
onMounted(() => (stale.value = Math.min(stale.value, lastPage)))
const single = ref(1)
</script>

<template>
  <DemoBlock title="Base">
    <UiPagination v-model:page="page" :page-size="10" :total="50" class="text-center" />
  </DemoBlock>
  <DemoBlock title="Many pages">
    <UiPagination v-model:page="far" :page-size="10" :total="400" class="text-center" />
  </DemoBlock>
  <DemoBlock title="Compact">
    <div class="flex w-64 items-center justify-between gap-3 text-sm text-fg-muted">
      <span>{{ (compactPage - 1) * 10 + 1 }}–{{ compactPage * 10 }} of 50</span>
      <UiPagination
        v-model:page="compactPage"
        :page-size="10"
        :total="50"
        compact
        class="text-end"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Loading">
    <UiPagination
      :page="loadingPage"
      :page-size="10"
      :total="400"
      class="text-center"
      :loading="loading"
      @update:page="ask"
    />
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex flex-col items-center gap-4">
      <UiPagination
        v-model:page="sized.xs.value"
        :page-size="10"
        :total="200"
        size="xs"
        class="text-center"
      />
      <UiPagination
        v-model:page="sized.sm.value"
        :page-size="10"
        :total="200"
        class="text-center"
      />
      <UiPagination
        v-model:page="sized.md.value"
        :page-size="10"
        :total="200"
        size="md"
        class="text-center"
      />
    </div>
  </DemoBlock>
  <DemoBlock title="Stale page">
    <div class="flex flex-col items-center gap-4">
      <UiPagination v-model:page="stale" :page-size="10" :total="50" class="text-center" />
      <p class="text-xs text-fg-muted">
        The app held page 9 of a list that now has 5; it set the page to {{ stale }}.
      </p>
    </div>
  </DemoBlock>
  <DemoBlock title="One page">
    <div class="flex w-64 items-center justify-between gap-3 text-sm text-fg-muted">
      <span>1–7 of 7</span>
      <UiPagination v-model:page="single" :page-size="10" :total="7" />
    </div>
    <p class="text-xs text-fg-muted">Seven rows fit on one page: the pager draws nothing.</p>
  </DemoBlock>
</template>
