<script lang="ts">
export const blurb =
  'Search for and choose one or more options. Enter selects an option without also submitting the form.'
</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import type { SelectItem, SelectValue } from '../types/ui'

const client = ref<string | null>(null)
// The app answers each pick: zloty payouts need a Polish account, so that pick is refused and the
// select stays where it was.
const kept = ref<string | null>('eur')
const refusal = ref<string>()
function ask(v: unknown) {
  if (v === 'pln') {
    refusal.value = 'Payouts in zloty need a Polish bank account. Add it first.'
    return
  }
  refusal.value = undefined
  kept.value = v == null ? null : String(v)
}
const sentCurrency = ref('eur')
const products = ref<string[]>([])
// The life of the options the app loads itself, switched by hand: a first load has no options
// yet, a refresh keeps them in view.
const optionsState = ref('loading')
// Picked before the options come, as when a record is opened: the field reads as a load meanwhile.
const courier = ref<string | null>('dana')
const COURIERS = ['Alex', 'Dana', 'Ilya', 'Mira'].map((label) => ({
  value: label.toLowerCase(),
  label,
}))
const courierItems = computed(() => (optionsState.value === 'loading' ? [] : COURIERS))
const CLIENTS = ['Anna Petrova', 'Ivan Sidorov', 'Maria Kozlova', 'Pavel Orlov', 'Olga Belova']
const PRODUCTS = ['Lunch set', 'Borscht', 'Draniki', 'Cheesecake', 'Compote', 'Salad']
// A stand-in for an API: answers after a moment with the matches, or fails under the switch.
const server = ref('answers')
const findIn = (list: string[]) => (q: string) =>
  new Promise<SelectItem[]>((resolve, reject) =>
    setTimeout(() => {
      if (server.value === 'fails') return reject(new Error('offline'))
      resolve(
        list
          .filter((name) => name.toLowerCase().includes(q.toLowerCase()))
          .map((name) => ({ value: name.toLowerCase().replaceAll(' ', '-'), label: name })),
      )
    }, 400),
  )
const findClients = findIn(CLIENTS)
// An order: the field finds the goods on a server, the rows below carry what the app keeps for
// each pick, here its quantity.
const GOODS = [
  {
    value: 'beans',
    label: 'Coffee beans',
    description: 'Arabica, 1 kg',
    price: 18.5,
  },
  { value: 'milk', label: 'Oat milk', description: '1 l carton', price: 2.4 },
  { value: 'cups', label: 'Paper cups', description: 'Pack of 50', price: 6 },
  { value: 'cookies', label: 'Butter cookies', description: 'Box of 24', price: 9.9 },
  {
    value: 'filters',
    label: 'Coffee filters',
    description: 'Pack of 100',
    price: 3.2,
  },
]
const good = (value: SelectValue) => GOODS.find((g) => g.value === value)!
const findGoods = (q: string) =>
  new Promise<SelectItem[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          GOODS.filter((g) => g.label.toLowerCase().includes(q.toLowerCase())).map(
            ({ value, label, description }) => ({ value, label, description }),
          ),
        ),
      400,
    ),
  )
const order = ref<SelectValue[]>(['beans', 'cups'])
const quantity = reactive<Record<string, string>>({ beans: '2', cups: '1' })
// A new pick comes with one of it; a pick taken back forgets its quantity.
watch(order, (values) => {
  for (const v of values) quantity[String(v)] ??= '1'
  for (const k of Object.keys(quantity)) if (!values.includes(k)) delete quantity[k]
})
const total = computed(() =>
  order.value.reduce<number>((sum, v) => sum + good(v).price * Number(quantity[String(v)] ?? 0), 0),
)
const eur = (n: number) => `${n.toFixed(2)} EUR`
const findProducts = findIn(PRODUCTS)

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]
const grouped = [
  {
    label: 'Europe',
    options: [
      { value: 'eur', label: 'Euro' },
      { value: 'pln', label: 'Polish zloty' },
    ],
  },
  {
    label: 'Americas',
    options: [
      { value: 'usd', label: 'US dollar' },
      { value: 'cad', label: 'Canadian dollar' },
    ],
  },
]
const plans = [
  { value: 'free', label: 'Free', description: 'One project, community support' },
  { value: 'team', label: 'Team', description: 'Up to 10 seats' },
  { value: 'enterprise', label: 'Enterprise', description: 'Talk to sales', disabled: true },
]
const countries = [
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
].map((name) => ({ value: name.toLowerCase(), label: name }))

const currency = ref(null)
const region = ref('pln')
const plan = ref('team')
const country = ref(null)
const invalid = ref(null)
const rowCurrency = ref('eur')
// Labels longer than a narrow field: the chosen one is cut, and whole in a tooltip on hover.
const LONG_CLIENTS = [
  { value: 'nw', label: 'Northwind Traders, the Copenhagen office' },
  { value: 'ct', label: 'Contoso Pharmaceuticals, research and development' },
]
const longClient = ref('nw')
const ruCurrency = ref<string | null>(null)
const ruCities = ref<string[]>(['berlin', 'riga'])
const cities = [
  'Lisbon',
  'Warsaw',
  'Vilnius',
  'Riga',
  'Tallinn',
  'Kyiv',
  'Prague',
  'Berlin',
  'Vienna',
  'Budapest',
].map((city) => ({ value: city.toLowerCase(), label: city }))
const tags = ref(['lisbon', 'warsaw', 'vilnius', 'riga', 'prague', 'berlin'])
const oneLine = ref(['lisbon', 'riga'])
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-64 max-w-full flex-col gap-6">
      <UiField label="Currency">
        <UiSelect v-model="currency" :items="currencies" placeholder="Currency" clearable />
      </UiField>
      <UiField label="Region currency">
        <UiSelect v-model="region" :items="grouped" />
      </UiField>
      <UiField label="Plan">
        <UiSelect v-model="plan" :items="plans" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Search">
    <div class="flex w-full max-w-md flex-col items-center gap-6">
      <div class="flex w-full flex-col gap-6">
        <UiField label="Country">
          <UiSelect v-model="country" :items="countries" placeholder="Country" searchable />
        </UiField>
        <UiField label="Client" description="Searched on the server as you type">
          <UiSelect v-model="client" :fetcher="findClients" placeholder="Find a client" />
        </UiField>
        <UiField label="Products">
          <UiSelect
            v-model="products"
            :fetcher="findProducts"
            multiple
            clearable
            placeholder="Add products"
          />
        </UiField>
      </div>
      <UiRadioGroup v-model="server" variant="segmented" aria-label="The server">
        <UiRadio value="answers">Answers</UiRadio>
        <UiRadio value="fails">Fails</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="Multiple">
    <div class="flex w-64 max-w-full flex-col gap-6">
      <UiField label="Cities">
        <UiSelect v-model="oneLine" :items="cities" multiple clearable />
      </UiField>
      <UiField label="Cities, as tags">
        <UiSelect v-model="tags" :items="cities" multiple tags clearable />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Order">
    <div class="flex w-96 max-w-full flex-col gap-6">
      <!-- The field is a search that adds; the order's rows and their quantities are the app's. -->
      <UiField label="Order">
        <UiSelect
          v-model="order"
          :fetcher="findGoods"
          :items="GOODS"
          multiple
          placeholder="Add a product"
        >
          <template #picks="{ options, remove }">
            <UiCard :padded="false">
              <UiList>
                <UiListItem
                  v-for="o in options"
                  :key="o.value"
                  :title="o.label"
                  :description="`${o.description} · ${eur(good(o.value).price)}`"
                >
                  <template #media>
                    <UiIconButton
                      :icon="X"
                      variant="ghost"
                      size="xs"
                      :ariaLabel="`Remove ${o.label}`"
                      @click="remove(o)"
                    />
                  </template>
                  <template #actions>
                    <UiStepper
                      :model-value="quantity[o.value] ?? '1'"
                      :min="1"
                      size="xs"
                      :ariaLabel="`Quantity of ${o.label}`"
                      class="w-24"
                      @update:model-value="(v) => (quantity[o.value] = v ?? '1')"
                    />
                  </template>
                </UiListItem>
              </UiList>
            </UiCard>
          </template>
        </UiSelect>
      </UiField>
      <p class="flex justify-between text-sm text-fg">
        <span class="text-fg-muted">Total</span><span class="tabular-nums">{{ eur(total) }}</span>
      </p>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex w-80 max-w-full flex-col gap-6">
      <UiField label="xs, 28px">
        <UiSelect
          v-model="currency"
          :items="currencies"
          placeholder="Currency"
          size="xs"
          clearable
        />
      </UiField>
      <UiField label="sm, 36px">
        <UiSelect v-model="currency" :items="currencies" placeholder="Currency" clearable />
      </UiField>
      <UiField label="md, 44px">
        <UiSelect v-model="currency" :items="currencies" placeholder="Currency" size="md" />
      </UiField>
      <UiField label="In a row with an amount" group>
        <UiButtonGroup ariaLabel="Amount">
          <UiInput model-value="120.00" numeric ariaLabel="Amount" />
          <UiSelect v-model="rowCurrency" :items="currencies" ariaLabel="Currency" class="w-40" />
        </UiButtonGroup>
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Loading">
    <div class="flex w-64 max-w-full flex-col items-center gap-4">
      <UiField label="Courier" class="w-full">
        <UiSelect v-model="courier" :items="courierItems" :loading="optionsState !== 'loaded'" />
      </UiField>
      <UiRadioGroup v-model="optionsState" variant="segmented" aria-label="State of the options">
        <UiRadio value="loading">Loading</UiRadio>
        <UiRadio value="loaded">Loaded</UiRadio>
        <UiRadio value="refreshing">Refreshing</UiRadio>
      </UiRadioGroup>
    </div>
  </DemoBlock>
  <DemoBlock title="States">
    <div class="flex w-64 max-w-full flex-col gap-6">
      <UiField label="Currency" description="Set by your organisation">
        <UiSelect model-value="usd" :items="currencies" disabled />
      </UiField>
      <UiField label="Currency" required error="Choose the currency of the account">
        <UiSelect v-model="invalid" :items="currencies" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField label="Payout currency" :error="refusal" class="w-64 max-w-full">
      <UiSelect :model-value="kept" :items="currencies" @update:model-value="ask" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form class="flex w-64 max-w-full flex-col gap-4" @submit.prevent @reset="sentCurrency = 'eur'">
      <UiField label="Currency">
        <UiSelect v-model="sentCurrency" :items="currencies" name="currency" clearable />
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-fg-muted">{{
          sentCurrency ? `Sends currency=${sentCurrency}` : 'Sends nothing'
        }}</span>
        <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
      </div>
    </form>
  </DemoBlock>
  <DemoBlock title="Long">
    <UiField label="Client" class="w-56 max-w-full">
      <UiSelect v-model="longClient" :items="LONG_CLIENTS" clearable />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). The placeholder, the count of
         picks with its plural form, the search's "nothing found" and the cross's name come from
         the ru dictionary. -->
    <div class="flex w-72 max-w-full flex-col gap-6">
      <UiSelect
        v-model="ruCurrency"
        :items="currencies"
        searchable
        clearable
        ariaLabel="Currency"
      />
      <UiSelect v-model="ruCities" :items="cities" multiple tags clearable ariaLabel="Cities" />
    </div>
  </DemoBlock>
</template>
