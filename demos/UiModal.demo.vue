<script lang="ts">
export const blurb =
  "Complete a short task in a dialog, such as filling a form or reviewing a record's details."
</script>

<script setup lang="ts">
import { Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Check, Copy, ExternalLink } from '@lucide/vue'

const create = ref(false)
// A save with no name stops on the field: the window puts the cursor there. A save that passes
// waits for the server: the window holds every close until it answers.
const nameError = ref('')
const saving = ref(false)
const BLANK = { name: 'Acme Corp', country: 'nl', email: 'billing@acme.example', note: '' }
const client = ref({ ...BLANK })
// Typed but not saved: a click beside the window or Escape shakes it instead of closing.
const dirty = computed(() => JSON.stringify(client.value) !== JSON.stringify(BLANK))
function openCreate() {
  client.value = { ...BLANK }
  nameError.value = ''
  create.value = true
}
async function createClient() {
  nameError.value = client.value.name.trim() ? '' : 'Give the client a name'
  if (nameError.value) return
  saving.value = true
  await new Promise((r) => setTimeout(r, 900))
  saving.value = false
  create.value = false
}
const terms = ref(false)
const countries = [
  { value: 'nl', label: 'Netherlands' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
]

const detail = ref(false)
// A window whose header is a search over its results: UiInput `variant="bare"` in `#header`.
const searching = ref(false)
const find = ref('')
const PAGES = ['Invoices', 'Clients', 'Payments', 'Reports']
const invoice = [
  { key: 'Total', value: '€1 240.00' },
  { key: 'Issued', value: 'Sep 3, 2026' },
  { key: 'Paid on', value: 'Sep 12, 2026' },
]

const sent = ref(false)

const ask = ref(false)

// A question asked from a window hides it: one window is seen, and the form comes back after.
const editing = ref(false)
const dropping = ref(false)
const invoices = ref(false)
const company = ref('Acme Corp')
function drop() {
  dropping.value = false
  editing.value = false
}
</script>

<template>
  <DemoBlock title="Form" row>
    <UiButton variant="outline" @click="openCreate">New client</UiButton>
    <UiModal
      v-model:open="create"
      title="New client"
      :persistent="dirty"
      :submitting="saving"
      form
      @submit="createClient"
    >
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <UiField label="Name" required :error="nameError"
            ><UiInput v-model="client.name" @input="nameError = ''"
          /></UiField>
          <UiField label="Country">
            <UiSelect v-model="client.country" :items="countries" class="w-full" />
          </UiField>
        </div>
        <UiField label="Email"><UiInput v-model="client.email" type="email" /></UiField>
        <UiField label="Note"><UiTextarea v-model="client.note" /></UiField>
      </div>
      <template #footer>
        <UiButton variant="secondary" :disabled="saving" @click="create = false">Cancel</UiButton>
        <UiButton type="submit" :loading="saving">Create client</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Long" row>
    <UiButton variant="outline" @click="terms = true">Read the terms</UiButton>
    <UiModal v-model:open="terms" title="Terms of the service" size="md">
      <div class="flex flex-col gap-4 text-sm text-fg-muted">
        <p v-for="n in 14" :key="n">
          {{ n }}. The service keeps your records for as long as the account is open and for thirty
          days after it closes, so a closed account can be opened again with everything in place.
        </p>
      </div>
      <template #footer>
        <UiButton @click="terms = false">Close</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Detail" row>
    <UiButton variant="outline" @click="detail = true">INV-0042</UiButton>
    <UiModal
      v-model:open="detail"
      size="sm"
      :padded="false"
      title="INV-0042"
      description="Acme Corp"
    >
      <UiList>
        <UiListItem title="Status">
          <template #actions><UiBadge tone="success" label="Paid" /></template>
        </UiListItem>
        <UiListItem v-for="row in invoice" :key="row.key" :title="row.key">
          <template #actions>
            <span class="text-sm tabular-nums text-fg">{{ row.value }}</span>
          </template>
        </UiListItem>
      </UiList>
      <template #footer>
        <UiButton variant="secondary"><Copy />Copy link</UiButton>
        <UiButton><ExternalLink />Open invoice</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Question" row>
    <UiButton variant="outline" tone="danger" @click="ask = true">Delete the order</UiButton>
    <UiModal v-model:open="ask" role="alertdialog" size="sm" title="Delete the order?">
      <p class="text-sm text-fg-muted">
        The order and its payments are removed. This cannot be undone.
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="ask = false">Cancel</UiButton>
        <UiButton tone="danger" @click="ask = false">Delete</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Over a window" row>
    <UiButton variant="outline" @click="editing = true">Edit the client</UiButton>
    <UiModal v-model:open="editing" size="sm" title="Edit the client">
      <UiField label="Name"><UiInput v-model="company" /></UiField>
      <!-- Another window from this one takes its place; the question below stands over it. -->
      <UiList class="mt-4">
        <UiListItem as="button" step title="Invoices" @click="invoices = true" />
      </UiList>
      <template #footer>
        <UiButton variant="secondary" tone="danger" @click="dropping = true">Delete</UiButton>
        <UiButton @click="editing = false">Save</UiButton>
      </template>
    </UiModal>
    <UiModal v-model:open="invoices" size="sm" :padded="false" :title="`Invoices of ${company}`">
      <UiList>
        <UiListItem title="INV-0042" description="Due Sep 30" />
        <UiListItem title="INV-0041" description="Paid" />
      </UiList>
      <template #footer>
        <UiButton @click="invoices = false">Close</UiButton>
      </template>
    </UiModal>
    <UiModal v-model:open="dropping" role="alertdialog" size="sm" :title="`Delete ${company}?`">
      <p class="text-sm text-fg-muted">The client and its invoices are removed.</p>
      <template #footer>
        <UiButton variant="secondary" @click="dropping = false">Cancel</UiButton>
        <UiButton tone="danger" @click="drop">Delete</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Result" row>
    <UiButton variant="outline" @click="sent = true">Send the invoice</UiButton>
    <UiModal
      v-model:open="sent"
      size="sm"
      align="center"
      title="Invoice sent"
      description="Acme Corp gets it at billing@acme.example."
    >
      <template #media>
        <span
          class="flex h-12 w-12 items-center justify-center rounded-pill bg-success-subtle text-success-subtle-fg"
          ><Check
        /></span>
      </template>
      <template #footer>
        <UiButton @click="sent = false">Done</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Search">
    <UiButton variant="outline" @click="searching = true">Open the search</UiButton>
    <UiModal v-model:open="searching" title="Search" :padded="false">
      <template #header>
        <UiInput
          v-model="find"
          variant="bare"
          type="search"
          placeholder="Search pages"
          ariaLabel="Search pages"
          class="w-full"
        >
          <template #start><Search aria-hidden="true" /></template>
        </UiInput>
      </template>
      <p
        v-for="page in PAGES.filter((p) => p.toLowerCase().includes(find.trim().toLowerCase()))"
        :key="page"
        class="px-overlay py-2.5 text-sm text-fg"
      >
        {{ page }}
      </p>
    </UiModal>
  </DemoBlock>
</template>
