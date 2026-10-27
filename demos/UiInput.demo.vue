<script lang="ts">
export const blurb =
  'Enter a single line of text, a password or a number in the app’s local format, such as 1 234,50 or 1,234.50.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@lucide/vue'

const value = ref('')
const small = ref('')
const regular = ref('')
const large = ref('')
const locked = ref('')
const wrong = ref('ann.work')
const email = ref('')
const address = ref(
  'Office 4, 12 Long Harbour Street, Northfield Business Park, second floor, reception on the left',
)
const price = ref('12.50')
const listed = ref('12.50')
// The app keeps this name: typing is not taken, the field stays on it.
const kept = ref('Acme Corp')
const sentName = ref('Anna Petrova')
const weight = ref('0.75')
const distance = ref('12')
const tempo = ref('140')
const ruPrice = ref<string | null>('1234.50')
const ruWeight = ref<string | null>('0.75')
const query = ref('invoices')
const records = ref('')
const password = ref('correct horse battery staple')
const palette = ref(false)
const find = ref('')
const PAGES = ['Invoices', 'Clients', 'Payments', 'Reports']
</script>

<template>
  <DemoBlock title="Base">
    <UiStack class="w-full max-w-80">
      <UiField label="Name">
        <UiInput v-model="value" placeholder="Anna Petrova" />
      </UiField>
      <UiField
        label="Email"
        description="We send the receipt here."
        :error="email.includes('@') || !email ? undefined : 'Enter an address with @'"
        required
      >
        <UiInput v-model="email" type="email" autocomplete="email" />
      </UiField>
      <UiField label="Delivery address">
        <UiInput v-model="address" />
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiInput v-model="small" placeholder="xs" ariaLabel="Extra small" size="xs" class="w-40" />
    <UiInput v-model="regular" placeholder="sm, the default" ariaLabel="Small" class="w-40" />
    <UiInput v-model="large" placeholder="md" ariaLabel="Medium" size="md" class="w-40" />
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiInput v-model="locked" placeholder="Disabled" ariaLabel="Disabled" disabled class="w-40" />
    <UiInput model-value="Read only" ariaLabel="Read only" readonly class="w-40" />
    <UiInput v-model="wrong" ariaLabel="Invalid" invalid class="w-40" />
  </DemoBlock>
  <DemoBlock title="Addons" row>
    <UiInput v-model="listed" numeric :step="0.1" ariaLabel="Price" class="w-40">
      <template #start>$</template>
      <template #end>USD</template>
    </UiInput>
    <UiInput v-model="query" type="search" ariaLabel="Search" class="w-48">
      <template #start><Search aria-hidden="true" /></template>
    </UiInput>
    <UiInput model-value="invoi" type="search" loading ariaLabel="Search" class="w-48">
      <template #start><Search aria-hidden="true" /></template>
    </UiInput>
    <UiButtonGroup ariaLabel="Search" class="w-full max-w-80">
      <UiInput
        v-model="records"
        type="search"
        ariaLabel="Search records"
        placeholder="Search records"
      />
      <UiButton variant="outline">Search</UiButton>
    </UiButtonGroup>
  </DemoBlock>
  <DemoBlock title="Bare">
    <UiButton variant="outline" @click="palette = true">Open the search</UiButton>
    <UiModal v-model:open="palette" title="Search" :padded="false">
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
  <DemoBlock title="Password">
    <UiInput
      v-model="password"
      type="password"
      autocomplete="current-password"
      ariaLabel="Password"
      class="w-full max-w-80"
    />
  </DemoBlock>
  <DemoBlock title="Numbers" row>
    <UiInput v-model="price" numeric :step="0.1" :min="0" ariaLabel="Price" class="w-32">
      <template #end>EUR</template>
    </UiInput>
    <UiInput v-model="weight" numeric :step="0.1" :min="0" ariaLabel="Weight" class="w-32">
      <template #end>kg</template>
    </UiInput>
    <UiInput v-model="distance" numeric :step="1" :min="0" ariaLabel="Distance" class="w-32">
      <template #end>km</template>
    </UiInput>
    <UiInput
      v-model="tempo"
      numeric
      inputmode="numeric"
      :step="5"
      :min="1"
      :max="400"
      ariaLabel="Tempo"
      class="w-32"
    >
      <template #end>BPM</template>
    </UiInput>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField
      label="Company"
      description="The app keeps this name: typing is not taken."
      class="w-full max-w-80"
    >
      <UiInput :model-value="kept" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form
      class="flex w-full max-w-80 flex-col items-start gap-4"
      @submit.prevent
      @reset="sentName = 'Anna Petrova'"
    >
      <UiField label="Name" class="w-full">
        <UiInput v-model="sentName" name="name" />
      </UiField>
      <span class="text-xs text-fg-muted">Sends name={{ sentName }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </form>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru" row>
    <!-- The app's language: createGrani({ locale: 'ru', translate }). A number shows a decimal comma
         and reads one typed or pasted ("1 234,50" is 1234.50); "1.234" may be a thousand or one and
         a quarter, so it stays as written and turns red when the field is left. The arrows are named
         in Russian, and a form sends the number as it is shown. -->
    <UiInput v-model="ruPrice" numeric :step="0.01" :min="0" ariaLabel="Price" class="w-36">
      <template #end>RUB</template>
    </UiInput>
    <UiInput v-model="ruWeight" numeric :step="0.1" :min="0" ariaLabel="Weight" class="w-32">
      <template #end>kg</template>
    </UiInput>
  </DemoBlock>
</template>
