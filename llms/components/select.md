# Select (`UiSelect`)

> Search for and choose one or more options. Enter selects an option without also submitting the form.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/select

Also called dropdown, combobox, autocomplete, searchable select.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect } from 'grani-ui'

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

const currency = ref(null)

const region = ref('pln')

const plan = ref('team')
</script>

<template>
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
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Results match the current search.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Finish a word in any script before it is sent.
- Clear a search in one step.
- Keep nearby buttons and fields in place.
- Keep nearby content in place while loading.
- Open a panel on the side where it fits.
- Close only the top layer with Escape.
- Close a popup without closing the form behind it.
- Go straight to the field that needs fixing.
- Close an open picker when its field is disabled.
- Read the full text when a label is shortened.
- Notice when there are more options below.
- Clear a field and enter its replacement immediately.
- Search once typing pauses.
- Jump to an option by letter.
- Pick with Enter without sending the form.
- Keep your browser’s keyboard shortcuts.
- Remove selected tags with the keyboard.
- Open with keyboard focus where the task begins.
- Continue from where you opened the panel.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Return the options for the query you are given. When you prefill a value, also pass its option in `items`, such as `{ value: 7, label: 'Anna Petrova' }`.
- Pass the value the app holds as `modelValue`, and explain why a choice was refused.
- Give it a `name`.
- Give the field a width where the row needs one; without it, the field is as wide as its longest option.
- Pass `loading` while the options load; a `fetcher` reports its own loading.
- Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Treat `null` as no answer.
- Return the options for the query you are given.
- Put it in a UiField with a `label`, or give it `ariaLabel`.

## Why it works this way

A form control for picking one value from a list of options, or several with `multiple`. It sits in the input capsule on the control ladder.

**Placement.** In a form, under a UiField label beside UiInput and UiDatePicker on the same step, or joined with a UiInput in a UiButtonGroup (an amount and its currency); as the kind filter of UiLog past three kinds.

**Panel.** The trigger is a button with the combobox role. The list is a listbox in a panel anchored under it; the panel flips above when there is no room below and follows scrolling.

**Options.** Items are options or groups of options. A disabled option is shown but cannot be picked. While the app's options are on their way it passes `loading`: with none yet the list draws rows in their shape, never "No matches"; with options in view they stay, dimmed, still to be picked, and the highlight keeps to its option as they change. A picked value whose option has not come yet reads as a load in the field and is sent as it is; once the load is over, a value no option knows shows as its own text and is sent, so the field never looks empty while the form holds a value, and in development the console names it once per app. An empty string no option has is nothing picked, as `null` is. With `fetcher` the select says its own load and `loading` does nothing. A list that loads holds the height it reached while open, until a filter narrows options already in.

**Types.** The model's shape follows `multiple`: one value or `null` without it, an array with it, and the props reject the other. A `multiple` decided at run time is two branches (`v-if` with the array model, `v-else` with the single one). `update:modelValue` carries either shape: an explicit handler casts what it receives, `v-model` needs nothing.

**Search.** `searchable` puts a filter at the top of the list; an option's `keywords` are matched too. The filter leaves the accents of Latin and Cyrillic letters out, so a name typed without them is found ("munchen" finds München) and the Cyrillic yo reads as ie; the Cyrillic short i stays a letter of its own. `fetcher` asks a server for the options as the filter is typed. The picked options are remembered, so their labels survive a new search. While the first answer is on its way the list draws rows of the options' shape, and while it is open it never shrinks, so nothing under the pointer moves as answers come. A failed search offers Try again, which asks once more; a search that matches nothing offers Clear search.

**Clear.** `clearable` adds a button that resets the value to `null`, or `[]` with `multiple`: a choice is a value or `null`. A required field never gets it, since there empty is an error, not a state. Its place is kept while there is nothing to clear.

**Width.** A single pick from a local list keeps the field's width: the text is sized to the longest labels, counted in letters, so a label of wide letters outside the three longest can still widen it. A chosen label longer than the field is cut, and shows whole in a tooltip on hover while the list is closed.

**Multiple.** `multiple` turns the rows into check marks and the model into an array, and a pick keeps the list open. The trigger shows the count of picks, and each pick stands below the field as a tag with a cross.

**Picks.** With `multiple`, the `#picks` slot draws the picks under the field the app's way, in place of tags: a row with what the app keeps for each, a quantity, a price. The field becomes a search that adds; it keeps its placeholder, since the picks are in view below. The value stays the list of picked values in the order they were picked; what a row holds besides is the app's. A disabled select takes no pick back, and hands `disabled` to the rows, so the app can hold its own controls too.

**Field.** Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and required from the field.

**Attributes.** `class` and `style` land on the select's outer box: the capsule, or with tags or the app's picks the box that holds the capsule and them; every other attribute and listener lands on the trigger, the combobox.

### Keyboard

On the closed field:
- `ArrowDown` `ArrowUp` `Enter` `Space` `Home`: open the list, and so do `Alt+ArrowDown` `Alt+ArrowUp`; `Ctrl` or `Meta` with a key stays the browser's.
- `End`: opens the list on the last option.
- `A–Z`: opens it on the first label that starts with the letter, or starts the filter when there is one.
- `Backspace`: with `multiple`, removes the last pick.
In the open list:
- `ArrowDown` `ArrowUp`: move over the enabled options.
- `Home` `End`: jump to the first and the last option; in the filter they move the caret.
- `Enter`: picks; never submits the form around it. While the answer to the typed text is on its way it picks nothing. After a failed search it asks again. A pick closes a single list and returns the focus to the field; a `multiple` list stays open.
- `Space`: picks, outside the filter; after letters typed over the list it belongs to the word.
- `A–Z`: jumps to the first match; letters typed together find a word.
- `Escape`: closes the list and returns the focus to the field; inside a window it closes only the list, and in a filter with text it clears the text first.
- `Tab`: closes the list and moves on to the next field. A pointer press outside closes it too.
On a tag:
- `Enter` `Space`: on its cross, removes that pick and moves the focus to the next tag, or to the field.

### Screen reader

- Field: a combobox named by `ariaLabel` or the field's label. It says the chosen label, the count of picks or the placeholder, whether it is expanded, and that it opens a listbox.
- List: a listbox with the same name, `aria-multiselectable` with `multiple`. A group's heading is shown but is not an option.
- Options: each says selected and disabled. The highlighted one is tracked through `aria-activedescendant` on the field, or on the filter, a named text box with `aria-autocomplete`.
- Status: a region that stays in the DOM says what the list is doing: "Searching…" for a `fetcher`, "Loading options…" and "Updating…" for the app's load, then "No matches" to a search, "No options" to none, or the failure, once nothing is on its way.
- Errors: `invalid` is `aria-invalid`, `required` is `aria-required`, and the field's description and error are read with the field.
- Tags: they stand in a named list, each cross is named with its label, and the clear button has a name.

### States

Empty with the placeholder, a pick, open with the chosen option highlighted, a disabled option, groups, the app's options on their way (`loading`: rows of their shape, then dimmed), `searchable` with its filter, a server search (rows of the options' shape while the first answer is on its way, the previous options dimmed while a new query waits, no matches with Clear search, failed with Try again, the list holding the height it reached while open; a late answer is dropped), `multiple` with check marks and a count, with tags below the field, or with the app's rows below it, `clearable` with the cross and its place kept, disabled (the plate, an inert trigger, nothing sent), invalid (a red border; disabled wins over it), and required, with no cross.

### When to use another component

- A few answers in view: UiRadioGroup.
- Several answers in view: UiCheckbox in a UiField `group`.
- A time of day: UiTimePicker.
- A day: UiDatePicker.
- Commands: UiMenu.
- A list that adds what is typed: UiListField.

## Examples

### Search

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SelectItem } from 'grani-ui'
import { UiField, UiSelect, UiRadioGroup, UiRadio } from 'grani-ui'

const client = ref<string | null>(null)

const products = ref<string[]>([])

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

const findProducts = findIn(PRODUCTS)

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

const country = ref(null)
</script>

<template>
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
</template>

```

### Multiple

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect } from 'grani-ui'

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
  <div class="flex w-64 max-w-full flex-col gap-6">
    <UiField label="Cities">
      <UiSelect v-model="oneLine" :items="cities" multiple clearable />
    </UiField>
    <UiField label="Cities, as tags">
      <UiSelect v-model="tags" :items="cities" multiple tags clearable />
    </UiField>
  </div>
</template>

```

### Order

```vue
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import type { SelectItem, SelectValue } from 'grani-ui'
import { UiField, UiSelect, UiCard, UiList, UiListItem, UiIconButton, UiStepper } from 'grani-ui'

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
</script>

<template>
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
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect, UiButtonGroup, UiInput } from 'grani-ui'

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]

const currency = ref(null)

const rowCurrency = ref('eur')
</script>

<template>
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
</template>

```

### Loading

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiField, UiSelect, UiRadioGroup, UiRadio } from 'grani-ui'

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
</script>

<template>
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
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect } from 'grani-ui'

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]

const invalid = ref(null)
</script>

<template>
  <div class="flex w-64 max-w-full flex-col gap-6">
    <UiField label="Currency" description="Set by your organisation">
      <UiSelect model-value="usd" :items="currencies" disabled />
    </UiField>
    <UiField label="Currency" required error="Choose the currency of the account">
      <UiSelect v-model="invalid" :items="currencies" />
    </UiField>
  </div>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect } from 'grani-ui'

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

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]
</script>

<template>
  <UiField label="Payout currency" :error="refusal" class="w-64 max-w-full">
    <UiSelect :model-value="kept" :items="currencies" @update:model-value="ask" />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect, UiButton } from 'grani-ui'

const sentCurrency = ref('eur')

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]
</script>

<template>
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
</template>

```

### Long

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSelect } from 'grani-ui'

// Labels longer than a narrow field: the chosen one is cut, and whole in a tooltip on hover.
const LONG_CLIENTS = [
  { value: 'nw', label: 'Northwind Traders, the Copenhagen office' },
  { value: 'ct', label: 'Contoso Pharmaceuticals, research and development' },
]

const longClient = ref('nw')
</script>

<template>
  <UiField label="Client" class="w-56 max-w-full">
    <UiSelect v-model="longClient" :items="LONG_CLIENTS" clearable />
  </UiField>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSelect } from 'grani-ui'

const currencies = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'pln', label: 'Polish zloty' },
]

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
</script>

<template>
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
</template>

```

## API

Props:
- `items`: `SelectItem[]` (default `[]`) — Options or groups of options with labels. With `fetcher` they are the known labels: a prefilled value shows its label before the server answers.
- `fetcher`: `((query: string) => Promise<SelectItem[]>)` — Asks a server for the options: called with the filter text on open and as it is typed (250 ms after the last key); a late answer to an older query is dropped. Implies `searchable`.
- `loading`: `boolean` (default `false`) — The options the app passes in `items` are on their way: with none yet, rows in their shape; with options in view, they stay, dimmed. A `fetcher` says this by itself.
- `placeholder`: `string` — Shown when nothing is selected.
- `name`: `string` — Native name for forms. The value is submitted through a hidden input.
- `id`: `string` — Own id when standalone. Inside UiField, the field's id takes precedence.
- `disabled`: `boolean` (default `false`) — Prevents opening and clearing.
- `invalid`: `boolean` (default `false`) — Marks the control as invalid. Shows the invalid border and focus ring. Inside UiField, the error state sets this automatically.
- `ariaLabel`: `string` — Accessible name when there is no visible label.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `searchable`: `boolean` (default `false`) — Adds a filter to the option list. Typing narrows options by label.
- `clearable`: `boolean` (default `false`) — Adds a button that resets the value to `null`, or to `[]` with `multiple`; never shown on a required field.
- `required`: `boolean` (default `false`) — Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so.
- `tags`: `boolean` (default `false`) — With `multiple`: every pick as a tag with a cross below the field, the trigger counting them. Without it the picks are listed in the trigger, which fits a narrow place such as a toolbar.
- `tagSize`: `"sm" | "md"` = `sm | md` (default `"md"`) — Size of the tags, as a UiBadge's.
- `modelValue`: `SelectValue | SelectValue[] | null` (required) — The selected value (`v-model`): `null` when nothing is selected; with `multiple`, the picked values in the order they were picked, `[]` when none is.
- `multiple`: `boolean` (default `false`) — Several values: check marks in the rows, an array in the model, the list stays open after a pick.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: SelectValue | SelectValue[] | null`) — The selected value changed; `null` (or `[]` with `multiple`) after clearing.

Slots:
- `start` with `Record<string, never>` — Before the value, inside the trigger: a glyph that says what is chosen (a clock, a flag). Decoration.
- `picks` with `{ options: SelectOption<SelectValue>[]; remove: (option: SelectOption<SelectValue>, event?: MouseEvent | undefined) => void; disabled: boolean; }` — With `multiple`: the picks drawn by the app under the field, in place of tags, the field a search that adds to them. `options` are the picked options as given in `items` or by the `fetcher`; `remove` takes one back and puts the focus on the field (pass the click, `remove(option, $event)`, and a double click's second click on the row sliding under the pointer is held back); `disabled` is the field's, and while it holds `remove` does nothing.

## How it behaves

### Late answer dropped

- When: the options come from a server.
- Props: `fetcher`, `items` for a value given in advance.
- Guarantee: A search response is shown only if it still belongs to the current query; a response to an older one is ignored instead of replacing newer results. The option you chose keeps its name in the field when a new search no longer returns it, and a value set in advance shows the label given in `items` before the first search answers.
- Without it: Every answer is shown as it arrives, so a slow answer to an old query covers the newer one, and the choice turns into its raw value once the results change.
- Code: `<UiSelect v-model="client" :fetcher="findClients" :items="[{ value: 7, label: 'Anna Petrova' }]" />`
- Your part: Return the options for the query you are given. When you prefill a value, also pass its option in `items`, such as `{ value: 7, label: 'Anna Petrova' }`.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a late answer to an older query is dropped", "a picked option keeps its label after the server answers another query", "items seeds the label of a prefilled value before the first fetcher search resolves"
- Pattern for all components: https://grani.arseni.work/patterns/finding#late-dropped

### Back to the value

- When: the app refuses a choice, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses your choice, the field shows the previous option again, and the form still sends that option. A form reset brings back the app’s value.
- Without it: The field shows an option the app did not accept.
- Code: `<UiSelect :model-value="kept" :items="currencies" @update:model-value="ask" />`
- Your part: Pass the value the app holds as `modelValue`, and explain why a choice was refused.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a change the parent refuses puts the select back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The chosen value is included under its `name` through a hidden input. An empty or disabled select sends nothing. After a form reset, the visible choice and the submitted value both match the app’s current value.
- Without it: A list on screen that the form never sends.
- Code: `<UiSelect v-model="currency" :items="currencies" name="currency" />`
- Your part: Give it a `name`.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "an empty select sends nothing under its name", "a form reset leaves the select on its model, hidden input and trigger agreeing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Words in the making

- When: its search is typed through an input method.
- Props: `searchable`.
- Guarantee: The Enter that picks the word picks no option.
- Without it: An option chosen by the key that only meant to finish a word.
- Code: `<UiSelect v-model="city" :items="cities" searchable />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "an Enter that confirms an IME composition in the search picks nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#word-as-composed

### Search clears

- When: the filter has text.
- Props: `searchable` or `fetcher`.
- Guarantee: A cross clears the filter and keeps keyboard focus in it. Escape clears it first and keeps the list open; a second Escape closes the list.
- Without it: A filter you can clear only by selecting its text and deleting it.
- Code: `<UiSelect v-model="country" :items="countries" searchable />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "the search clears its own text on Escape and keeps the panel open; a second Escape closes it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Steady width

- When: one option is picked from a list it holds.
- Props: `items`, without `fetcher` or `multiple`.
- Guarantee: Picking an option, or clearing it, does not move the fields beside it: the field reserves the width of its longest option or its placeholder, and keeps the place of the clear button while it is hidden.
- Without it: A field as wide as its text: a longer option widens it at the pick and pushes the field beside it.
- Code: `<UiSelect v-model="currency" :items="CURRENCIES" />`
- Your part: Give the field a width where the row needs one; without it, the field is as wide as its longest option.
- Not covered: Options from a server (`fetcher`) and several picks (`multiple`) are not known in advance, so their field does not reserve the longest one. The longest labels are counted in letters: one of wide letters outside the three longest can still widen the field.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "the field keeps its width: the text stands over the longest labels, the cross keeps its place", "the clear cross pulls to the capsule edge and, at xs, fits inside the capsule; its kept place matches it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### Stable dimensions

- When: the app loads the options itself.
- Props: `loading`.
- Guarantee: While the list has no results, it shows placeholders shaped like options, with checkboxes when `multiple` is enabled. Once open, it keeps the height it has reached as options arrive. A selected value whose option is still loading shows a loading state in the field.
- Without it: An empty list says nothing matches, then grows under the pointer when the options arrive.
- Code: `<UiSelect v-model="courier" :items="couriers ?? []" :loading="!couriers" />`
- Your part: Pass `loading` while the options load; a `fetcher` reports its own loading.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "options the app is loading show rows in their shape and say so, never "No matches""
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Opens where it fits

- When: its field stands near the bottom of the window.
- Props: none.
- Guarantee: The list opens above the field when the room below is too short for it and the room above is longer, and under it otherwise. It never covers the field and never leaves the window.
- Without it: A list under a field at the end of a long form runs off the screen.
- Code: `<UiSelect v-model="country" :items="countries" />`
- Your part: Nothing.
- Not covered: The room is measured in the window, not in a scrolling box inside the page.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "near the bottom of the window the list opens above the field; near the top, below it"
- Pattern for all components: https://grani.arseni.work/patterns/opening#opens-where-fits

### Escape, top first

- When: its list is open inside a window or a drawer.
- Props: none.
- Guarantee: Escape closes the list only, and keyboard focus goes back to the field; the window stays open. With text in its search, the first Escape clears the text and the list stays.
- Without it: One Escape closes the list and the form behind it at once.
- Code: `<UiModal v-model:open="open"><UiSelect v-model="country" :items="countries" /></UiModal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "Escape on the trigger of an open select inside a modal closes the list only", "Home and End jump, Escape closes and returns focus to the trigger", "the search clears its own text on Escape and keeps the panel open; a second Escape closes it"
- Pattern for all components: https://grani.arseni.work/patterns/closing#escape-top

### Outside, top first

- When: its list is open inside a window or a drawer.
- Props: none.
- Guarantee: A press outside the list, on the backdrop too, closes the list alone, and the window stays open; the next press there closes the window.
- Without it: A press beside the list closes the window under it as well, with the form in it.
- Code: `<UiModal v-model:open="open"><UiSelect v-model="country" :items="countries" /></UiModal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a press outside its list inside a modal closes the list and keeps the modal"
- Pattern for all components: https://grani.arseni.work/patterns/closing#press-top

### Focus on the error

- When: a form is sent with no choice made.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the select is the first field with an error, keyboard focus lands on its button, so you can open the list and choose straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Currency" :error="err"><UiSelect v-model="currency" :items="currencies" /></UiField>`
- Your part: Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "focusInvalid on an invalid select focuses the trigger"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Off closes

- When: it is disabled while its list is open.
- Props: `disabled`.
- Guarantee: The list closes and keyboard focus stays on the field.
- Without it: The list stays open over a field that no longer accepts a choice.
- Code: `<UiSelect v-model="currency" :items="currencies" :disabled="saving" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "disabling while open closes the list and keeps the focus on the field"
- Pattern for all components: https://grani.arseni.work/patterns/closing#off-closes

### Whole text

- When: the chosen option is longer than its field.
- Props: none.
- Guarantee: The field shows the chosen label on one line, cut with an ellipsis, and its whole text shows in a tooltip on hover while the cut is real. The chevron and the clear button stay in view.
- Without it: A long client name cut at the end of a narrow field, with no way to read the rest but opening the list.
- Code: `<UiSelect v-model="client" :items="CLIENTS" class="w-48" />`
- Your part: Nothing; give the field the width its row allows.
- Not covered: Only the mouse shows it: a tap opens the list, keyboard focus opens no tooltip, and while the list is open there is none, since it would stand over the rows; the rows of the list are cut too. A screen reader hears the whole label.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a chosen label stands in a UiTruncate, its whole text in the tooltip while cut", "the whole-label tooltip stays away while the list is open, where it would stand over the rows"
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text

### Five and a half rows

- When: the list is long.
- Props: none.
- Guarantee: The list is cut at five and a half rows, so the half row shows there is more below.
- Without it: A list cut at a row edge that looks finished.
- Code: `<UiSelect v-model="country" :items="countries" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a long list is cut at five rows and a half"
- Pattern for all components: https://grani.arseni.work/patterns/finding#five-rows

### Cleared in place

- When: An answer may be left empty.
- Props: `clearable`.
- Guarantee: The × sets the value to `null`, or to `[]` with `multiple`, and keyboard focus moves to the field. A required field has no ×.
- Without it: The × empties the field and keyboard focus is lost, so you have to find the field again.
- Code: `<UiSelect v-model="currency" :items="currencies" clearable />`
- Your part: Treat `null` as no answer.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "the clear button keeps the focus on the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cleared-in-place

### Asks once

- When: the options come from a server.
- Props: `fetcher`.
- Guarantee: Opening the list calls `fetcher` with an empty query. Typing calls it after a 250 ms pause. Reopening after a search requests the empty query again. While results are loading, the visible options remain in place and are dimmed. A list closed within the pause asks nothing, and the closed field shows its value, not a load.
- Without it: A request on every key.
- Code: `<UiSelect v-model="client" :fetcher="findClients" />`
- Your part: Return the options for the query you are given.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "asks the server on open with an empty query, then 250 ms after the last key", "reopening after a search asks once for the empty query", "a press outside while a search waits asks the server for nothing", "a search dropped before it was asked leaves the closed field showing its value, not a load", "an answer on its way when the list closes changes nothing: the field shows its value"
- Pattern for all components: https://grani.arseni.work/patterns/finding#typing-asks-once

### Letter jumps

- When: the list has no filter field.
- Props: none.
- Guarantee: On the closed field, a letter opens the list with the first option that starts with it highlighted; in the open list, it moves the highlight there. The same letter again goes on to the next option that starts with it. Letters typed together find a word, its spaces too: "new j" reaches New Jersey.
- Without it: A long list that you walk one row at a time with the arrow keys.
- Code: `<UiSelect v-model="currency" :items="currencies" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "a letter jumps to the first label with that prefix", "a letter on the closed field opens on the first label that starts with it, the chosen one too", "a Space after letters typed over the list belongs to the word: New J reaches New Jersey"
- Pattern for all components: https://grani.arseni.work/patterns/finding#letter-jumps

### Enter picks

- When: The select is inside a form.
- Props: `searchable`, `fetcher`, or none.
- Guarantee: On the closed select, Enter opens the list. In the open list or its search box, Enter picks the highlighted option. In both cases the form around it is not submitted. While the answer to the text typed in a server search is on its way, Enter picks nothing: the rows in view answer an older word.
- Without it: With a plain text field and a list under it, Enter submits the form before anything is picked.
- Code: `<form><UiSelect v-model="country" :items="countries" searchable /></form>`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "inside a form Enter picks and the form is not submitted", "Enter while the answer to the typed text is on its way picks nothing; once it comes, Enter picks from it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-picks

### Shortcuts kept

- When: the field or its open list has keyboard focus.
- Props: none: every UiSelect.
- Guarantee: Alt+Down opens the list, as on a native select. With Ctrl or Cmd held an arrow opens nothing and moves no highlight, so the browser’s own shortcut runs.
- Without it: Ctrl+Down, meant for the page, opens the list or moves its highlight instead.
- Code: `<UiSelect v-model="currency" :items="currencies" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "Alt with ArrowDown opens the list, as a select does; Ctrl or Meta leave the key", "in the open list Ctrl or Meta with an arrow moves no highlight and leaves the key"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

### Tag taken back

- When: Selections show as tags.
- Props: `multiple`, `tags`.
- Guarantee: A tag's × removes that selection and moves keyboard focus to the next tag, or back to the field after the last tag. With the list closed, Backspace on the field removes the last selection shown. A value missing from `items` shows as its own text, so it is one of them.
- Without it: A tag’s cross takes the keyboard focus away with the tag: it falls to the page, and a screen reader loses its place.
- Code: `<UiSelect v-model="cities" :items="cities" multiple tags />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "the cross of a tag drops that pick and moves the focus to the next tag", "removing the last tag puts the focus back on the field", "Backspace takes back the last pick in view, a value outside items shown as its text too"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#tag-taken-back

### Focus starts inside

- When: its list has a search field.
- Props: `searchable` or `fetcher`.
- Guarantee: Opening the list puts keyboard focus in its search field, so typing narrows the options at once. When nothing matches, the list says so in words instead of showing an empty box.
- Without it: The list opens with keyboard focus left on the field, and you press Tab or click before you can search.
- Code: `<UiSelect v-model="country" :items="countries" searchable />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "focuses the filter, narrows by label, and says when nothing matches"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### Focus comes back

- When: the list closes.
- Props: none.
- Guarantee: After choosing an option, pressing Escape, or pressing Tab from the list’s search field, focus returns to the select field. Clicking outside closes the list and leaves focus where you clicked.
- Without it: The list closes and keyboard focus falls to the page: a screen reader loses its place, and you look for the field again.
- Code: `<UiSelect v-model="currency" :items="currencies" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "Home and End jump, Escape closes and returns focus to the trigger", "Tab from the filter closes and puts focus back on the trigger", "after a pick from a searchable list the focus is back on the field; a press outside leaves it where it was"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back

### One name

- When: it needs a name.
- Props: a UiField around it, or `ariaLabel`.
- Guarantee: The select and its open list are announced once, by the field's label or by `ariaLabel`; the description and the error are announced with it.
- Without it: A list announced with two names, or a select named only by its placeholder.
- Code: `<UiField label="Currency"><UiSelect v-model="currency" :items="currencies" /></UiField>`
- Your part: Put it in a UiField with a `label`, or give it `ariaLabel`.
- Proof, in the repository's tests (UiSelect.spec.ts, not in the package): "takes id, required, error and description from the field", "a standalone listbox takes the ariaLabel"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
