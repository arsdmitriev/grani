# Crud drawer (`UiCrudDrawer`)

> Edit a record beside its list and open related lists within the same panel.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/crud-drawer

Also called edit panel, record drawer, side form, detail panel.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [Drawer](https://grani.arseni.work/components/drawer).

## Use

```vue
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Archive, Trash2 } from '@lucide/vue'
import type { LogEvent } from 'grani-ui'
import { UiCard, UiList, UiListItem, UiBadge, UiSwitch, UiCrudDrawer, UiCopyButton, UiSkeleton, UiListField, UiAvatar, UiHeader, UiField, UiInput, UiSelect, UiLog, UiToaster, UiConfirm, useConfirm, useToast } from 'grani-ui'

interface Client {
  id: string
  since: number
  active: boolean
  name: string
  legal: string
  tax: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  country: string
  plan: string
  terms: string
  currency: string
  billing: string
  autoInvoice: boolean
  vat: boolean
  portal: boolean
  weekly: boolean
}

interface Contact {
  id: string
  name: string
  email: string
}

interface Invoice {
  id: string
  name: string
  date: string
  total: string
  paid: boolean
}

type CrudLevel = 'contacts' | 'invoices'

const matching = <T extends { name: string }>(rows: T[], typed: string): T[] => {
  const q = typed.trim().toLowerCase()
  return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
}

const { confirm } = useConfirm()

const toast = useToast()

// A long record: sections of a few fields each, settings as rows, the actions last, then what happened.
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
]

const PLANS = [
  { value: 'solo', label: 'Solo · monthly' },
  { value: 'team', label: 'Team · monthly' },
  { value: 'team-year', label: 'Team · yearly' },
]

const TERMS = [
  { value: '0', label: 'On receipt' },
  { value: '14', label: 'Net 14' },
  { value: '30', label: 'Net 30' },
]

const MONEY = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
]

const CLIENT: Omit<Client, 'id' | 'since' | 'active'> = {
  name: 'Northwind Studio',
  legal: 'Northwind Studio LLC',
  tax: 'US 84-2031187',
  email: 'hello@northwind.example',
  phone: '+1 415 555 0142',
  address: '214 Harbor Street, suite 3',
  city: 'San Francisco',
  postcode: '94107',
  country: 'US',
  plan: 'team',
  terms: '30',
  currency: 'USD',
  billing: 'billing@northwind.example',
  autoInvoice: true,
  vat: false,
  portal: true,
  weekly: false,
}

const FIRST: Client = { ...CLIENT, id: 'CL-2041', since: 2024, active: true }

const STUDIOS = ref<Client[]>([
  FIRST,
  {
    ...CLIENT,
    id: 'CL-2036',
    since: 2023,
    active: true,
    name: 'Birch & Co',
    legal: 'Birch & Co Ltd',
    email: 'studio@birch.example',
    city: 'Portland',
    postcode: '97205',
    billing: 'accounts@birch.example',
  },
  {
    ...CLIENT,
    id: 'CL-2019',
    since: 2022,
    active: false,
    name: 'Cedar Lane Films',
    legal: 'Cedar Lane Films Inc',
    email: 'hi@cedarlane.example',
    city: 'Vancouver',
    postcode: 'V6B 1A1',
    country: 'CA',
    currency: 'EUR',
    billing: 'billing@cedarlane.example',
  },
  {
    ...CLIENT,
    id: 'CL-2007',
    since: 2021,
    active: true,
    name: 'Harbor Lights',
    legal: 'Harbor Lights GmbH',
    email: 'kontakt@harborlights.example',
    city: 'Hamburg',
    postcode: '20457',
    country: 'DE',
    currency: 'EUR',
    billing: 'rechnung@harborlights.example',
  },
])

const studioAt = ref(0)

const CLIENT_LOG: LogEvent[] = [
  {
    id: 2,
    at: '27 Sep, 11:02',
    actor: { name: 'Anna Lee' },
    action: 'changed',
    changes: [{ field: 'Terms', from: 'Net 14', to: 'Net 30' }],
  },
  { id: 1, at: '12 Mar 2024, 09:15', actor: { name: 'Anna Lee' }, action: 'created the client' },
]

const open = ref(false)

// What the client holds: its contacts and its invoices, each a list level of the same drawer.
const contacts = ref<Contact[]>([
  { id: 'c1', name: 'Anna Lee', email: 'anna@northwind.example' },
  { id: 'c2', name: 'Ben Ortiz', email: 'ben@northwind.example' },
  { id: 'c3', name: 'Chloe Park', email: 'chloe@northwind.example' },
  { id: 'c4', name: 'Dan Moore', email: 'billing@northwind.example' },
])

const clientInvoices = ref<Invoice[]>(
  Array.from({ length: 12 }, (_, k) => ({
    id: `INV-${2041 - k}`,
    name: `INV-${2041 - k}`,
    date: `${28 - k * 2} Sep`,
    total: `$${(1240 - k * 85).toLocaleString('en-US')}.00`,
    paid: k > 1,
  })),
)

const crudAt = ref<CrudLevel[]>([])

const crudQuery = ref('')

const crudLevel = computed(() => crudAt.value[0] ?? 'record')

const crudContacts = computed(() => matching(contacts.value, crudQuery.value))

const crudInvoices = computed(() => matching(clientInvoices.value, crudQuery.value))

function crudStep(level: CrudLevel) {
  crudQuery.value = ''
  crudAt.value = [level]
}

function crudBack() {
  crudQuery.value = ''
  crudAt.value = []
}

function crudAdd(names: string[]) {
  if (crudLevel.value === 'contacts')
    contacts.value.push(...names.map((name) => ({ id: name, name, email: '' })))
  else
    clientInvoices.value.unshift(
      ...names.map((name) => ({ id: name, name, date: 'Draft', total: '$0.00', paid: false })),
    )
  light(names)
}

const loading = ref(false)

const loadFailed = ref(false)

const submitting = ref(false)

const loadFails = ref(false)

const saveFails = ref(false)

const form = ref<Client>({ ...FIRST })

const saved = ref<Client>({ ...FIRST })

// A record still loading holds no input of the person's: nothing to guard yet.
const dirty = computed(
  () => !loading.value && JSON.stringify(form.value) !== JSON.stringify(saved.value),
)

// The server's answer after a moment; the switches say how it goes.
const later = (ms: number, fails: boolean) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (fails ? reject(new Error('offline')) : resolve()), ms),
  )

async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    await later(600, loadFails.value)
    form.value = { ...saved.value }
  } catch {
    loadFailed.value = true
  }
  loading.value = false
}

function edit(i: number) {
  const studio = STUDIOS.value[i]
  if (!studio) return
  studioAt.value = i
  saved.value = { ...studio }
  crudAt.value = []
  open.value = true
  void load()
}

// A failed save keeps the drawer and what was typed; a toast says why.
async function save() {
  submitting.value = true
  try {
    await later(900, saveFails.value)
    saved.value = { ...form.value }
    STUDIOS.value[studioAt.value] = { ...form.value }
    open.value = false
    toast.success('Client saved')
  } catch {
    toast.error('Could not save the client', { description: 'Your changes are still here.' })
  }
  submitting.value = false
}

// Delete cannot come back: it asks first and sends. The request itself closes the drawer and,
// a tick later, takes the row, so a Retry from the toast of a failure does both too.
function remove() {
  const id = saved.value.id
  void confirm({
    title: `Delete ${saved.value.name}?`,
    message: 'The client and their invoices are removed. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
    action: async () => {
      await later(800, false)
      open.value = false
      await nextTick()
      STUDIOS.value = STUDIOS.value.filter((s) => s.id !== id)
    },
    success: 'Client deleted',
  })
}

const lit = ref<string[]>([])

let dim: ReturnType<typeof setTimeout> | undefined

// A row lights for a moment when it comes, or when a repeat points at it.
function light(names: string[]) {
  clearTimeout(dim)
  lit.value = names
  dim = setTimeout(() => (lit.value = []), 1200)
}

// What was added here stands on top, until the level is left.
const onTop = <T extends { name: string }>(rows: T[], fresh: string[]): T[] => [
  ...rows.filter((r) => fresh.includes(r.name)),
  ...rows.filter((r) => !fresh.includes(r.name)),
]
</script>

<template>
  <div class="flex w-full max-w-sm flex-col items-center gap-4">
    <UiCard :padded="false" class="w-full">
      <UiList>
        <UiListItem
          v-for="(studio, i) in STUDIOS"
          :key="studio.id"
          as="button"
          size="sm"
          :title="studio.name"
          :description="`${studio.id} · ${studio.city}`"
          @click="edit(i)"
        >
          <template #actions>
            <UiBadge
              variant="inline"
              size="sm"
              :tone="studio.active ? 'success' : 'neutral'"
              :label="studio.active ? 'Active' : 'Paused'"
            />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
    <div class="flex gap-6">
      <UiSwitch v-model="loadFails">The load fails</UiSwitch>
      <UiSwitch v-model="saveFails">The save fails</UiSwitch>
    </div>
  </div>
  <UiCrudDrawer
    v-model:open="open"
    :divided="false"
    :title="
      crudLevel === 'contacts' ? 'Contacts' : crudLevel === 'invoices' ? 'Invoices' : saved.name
    "
    :path="crudAt.length ? [saved.name] : []"
    :readonly="crudAt.length > 0"
    :loading="loading"
    :submitting="submitting"
    :error="loadFailed ? 'The server did not answer. Check the connection and try again.' : null"
    :index="studioAt"
    :total="STUDIOS.length"
    :persistent="dirty && !crudAt.length"
    :persistent-above="dirty"
    @submit="save"
    @back="crudBack"
    @retry="load"
    @move="edit"
  >
    <template v-if="!crudAt.length" #description>
      <UiBadge
        variant="inline"
        size="sm"
        :tone="saved.active ? 'success' : 'neutral'"
        :label="saved.active ? 'Active' : 'Paused'"
      />
      <span aria-hidden="true">·</span>
      <UiCopyButton :value="saved.id" :truncate="12" variant="inline" />
      <span aria-hidden="true">·</span>
      <span>client since {{ saved.since }}</span>
    </template>
    <template #loading>
      <div v-for="n in [3, 4]" :key="n" class="flex flex-col gap-4">
        <div class="text-base"><UiSkeleton class="inline-block h-4 w-20 align-middle" /></div>
        <div v-for="k in n" :key="k" class="flex flex-col gap-2">
          <div class="text-sm"><UiSkeleton class="inline-block h-3 w-16 align-middle" /></div>
          <UiSkeleton class="h-9 w-full" />
        </div>
      </div>
    </template>
    <UiCard v-if="crudAt.length">
      <UiListField
        v-model:query="crudQuery"
        :placeholder="
          crudLevel === 'contacts' ? 'Find or add a contact' : 'Find an invoice or add a draft'
        "
        :empty="
          crudLevel === 'contacts'
            ? 'No contacts yet: type a name and press Enter.'
            : 'No invoices yet.'
        "
        :existing="(crudLevel === 'contacts' ? contacts : clientInvoices).map((r) => r.name)"
        @add="crudAdd"
        @taken="(name) => light([name])"
      >
        <template #default="{ added: fresh }">
          <template v-if="crudLevel === 'contacts'">
            <UiListItem
              v-for="c in onTop(crudContacts, fresh)"
              :key="c.id"
              size="sm"
              :title="c.name"
              :description="c.email || 'No email yet'"
              :highlight="crudQuery"
              :lit="lit.includes(c.name)"
            >
              <template #media><UiAvatar :name="c.name" size="xs" /></template>
            </UiListItem>
          </template>
          <template v-else>
            <UiListItem
              v-for="inv in onTop(crudInvoices, fresh)"
              :key="inv.id"
              size="sm"
              :title="inv.name"
              :description="inv.date"
              :highlight="crudQuery"
              :lit="lit.includes(inv.name)"
            >
              <template #actions>
                <span class="text-sm tabular-nums text-fg">{{ inv.total }}</span>
                <UiBadge
                  variant="inline"
                  size="sm"
                  :tone="inv.paid ? 'success' : 'warning'"
                  :label="inv.paid ? 'Paid' : 'Due'"
                />
              </template>
            </UiListItem>
          </template>
        </template>
      </UiListField>
    </UiCard>
    <template v-else>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="Profile" />
          <UiField label="Name"
            ><UiInput v-model="form.name">
              <template #end
                ><UiCopyButton
                  :value="form.name"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the name"
              /></template> </UiInput
          ></UiField>
          <UiField label="Legal name"
            ><UiInput v-model="form.legal">
              <template #end
                ><UiCopyButton
                  :value="form.legal"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the legal name"
              /></template> </UiInput
          ></UiField>
          <UiField label="Tax ID"
            ><UiInput v-model="form.tax">
              <template #end
                ><UiCopyButton
                  :value="form.tax"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the tax ID"
              /></template> </UiInput
          ></UiField>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="Contact" />
          <UiField label="Email"
            ><UiInput v-model="form.email" type="email">
              <template #end
                ><UiCopyButton
                  :value="form.email"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the email"
              /></template> </UiInput
          ></UiField>
          <UiField label="Phone"
            ><UiInput v-model="form.phone" type="tel">
              <template #end
                ><UiCopyButton
                  :value="form.phone"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the phone"
              /></template> </UiInput
          ></UiField>
          <UiField label="Address"
            ><UiInput v-model="form.address">
              <template #end
                ><UiCopyButton
                  :value="form.address"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the address"
              /></template> </UiInput
          ></UiField>
          <div class="grid grid-cols-[2fr_1fr] gap-4">
            <UiField label="City"
              ><UiInput v-model="form.city">
                <template #end
                  ><UiCopyButton
                    :value="form.city"
                    variant="ghost"
                    size="xs"
                    ariaLabel="Copy the city"
                /></template> </UiInput
            ></UiField>
            <UiField label="Postcode"
              ><UiInput v-model="form.postcode">
                <template #end
                  ><UiCopyButton
                    :value="form.postcode"
                    variant="ghost"
                    size="xs"
                    ariaLabel="Copy the postcode"
                /></template> </UiInput
            ></UiField>
          </div>
          <UiField label="Country"
            ><UiSelect v-model="form.country" :items="COUNTRIES"
          /></UiField>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="Billing" />
          <UiField label="Plan"><UiSelect v-model="form.plan" :items="PLANS" /></UiField>
          <div class="grid grid-cols-2 gap-4">
            <UiField label="Terms"><UiSelect v-model="form.terms" :items="TERMS" /></UiField>
            <UiField label="Currency"
              ><UiSelect v-model="form.currency" :items="MONEY"
            /></UiField>
          </div>
          <UiField label="Billing email"
            ><UiInput v-model="form.billing" type="email">
              <template #end
                ><UiCopyButton
                  :value="form.billing"
                  variant="ghost"
                  size="xs"
                  ariaLabel="Copy the billing address"
              /></template> </UiInput
          ></UiField>
          <UiCard :padded="false">
            <UiList>
              <UiListItem as="label" size="sm" title="Send invoices automatically">
                <template #actions><UiSwitch v-model="form.autoInvoice" /></template>
              </UiListItem>
              <UiListItem as="label" size="sm" title="Charge VAT">
                <template #actions><UiSwitch v-model="form.vat" /></template>
              </UiListItem>
            </UiList>
          </UiCard>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="Settings" />
          <UiCard :padded="false">
            <UiList>
              <UiListItem
                as="label"
                size="sm"
                title="Portal access"
                description="The client signs in to see invoices."
              >
                <template #actions><UiSwitch v-model="form.portal" /></template>
              </UiListItem>
              <UiListItem
                as="label"
                size="sm"
                title="Weekly report"
                description="A summary every Monday."
              >
                <template #actions><UiSwitch v-model="form.weekly" /></template>
              </UiListItem>
            </UiList>
          </UiCard>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="Actions" />
          <UiCard :padded="false">
            <UiList>
              <UiListItem
                as="button"
                size="sm"
                step
                title="Contacts"
                @click="crudStep('contacts')"
              >
                <template #actions
                  ><span class="text-sm text-fg-muted">{{ contacts.length }}</span></template
                >
              </UiListItem>
              <UiListItem
                as="button"
                size="sm"
                step
                title="Invoices"
                @click="crudStep('invoices')"
              >
                <template #actions
                  ><span class="text-sm text-fg-muted">{{
                    clientInvoices.length
                  }}</span></template
                >
              </UiListItem>
              <UiListItem
                as="button"
                size="sm"
                title="Archive"
                @click="toast.success(`${saved.name} archived`)"
              >
                <template #actions><Archive /></template>
              </UiListItem>
              <UiListItem
                as="button"
                size="sm"
                title="Delete the client"
                tone="danger"
                @click="remove"
              >
                <template #actions><Trash2 /></template>
              </UiListItem>
            </UiList>
          </UiCard>
        </div>
      </UiCard>
      <UiCard>
        <div class="flex flex-col gap-4">
          <UiHeader variant="legend" title="History" />
          <UiLog :items="CLIENT_LOG" aria-label="History" />
        </div>
      </UiCard>
    </template>
  </UiCrudDrawer>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
  <UiConfirm />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Open a related record inside the drawer.
- Submit a form with Enter.
- Step through records in one drawer.
- Save and start the next record.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Swap the body and the title for the step, pass the titles of the levels above in `path`, and go to the level that `back` names.
- Set `submitting` while the request runs, and close the drawer or mark the field in error when it answers.
- Pass the record’s place in the list as `index` and the list’s length as `total`, load the record whose index `move` carries, and set `persistent` while there is unsaved input.
- Set `submitting` while saving. `submit` includes `another: true` for Save and add another, and `another: false` for Save or Enter. After a successful save with `another: true`, clear the form (a default may stay) and keep the drawer open.

## Why it works this way

A record opened for editing in a side panel, over the list it came from, laid over UiDrawer. Take it to edit a row opened from a UiDataTable without leaving the list.

**Surface.** The panel is UiDrawer: its width, header, gutter, stack, scroll lock and focus kept in. The record adds the form round the body and the footer, Save and Cancel, the loading and the failed states, the steps of `path` and the walk through the list, and leads the exits: Escape and the backdrop go a level up at a step, the cross is refused while a level above holds input.

**Kept pages.** In a page that a `KeepAlive` keeps, an open record stays open when the page is deactivated, as UiDrawer's panel does. Close it (`open` false) when the route changes.

**Header.** `title` names the record ("Northwind Studio"). The small line under it (`description`, or a `#description` built from the library's parts) starts with the status as a small mark (UiBadge `inline` `sm`), then an id to copy (UiCopyButton `inline`), then a fact, cut when long and shown whole on hover. `#status` beside the title is for the rare record whose status is the point. `#actions` takes at most one icon button of your own, before the cross. With `index` and `total` (two records or more), ↑ and ↓ walk the list (`move`); they are refused while input is unsaved. The walk is the record's: at a step they are gone, since a level above may hold unsaved input, and the way up comes first. The parent loads the record; at the edge of a page it turns the list's page and keeps the opened row marked. At the end of the list, the arrow that can go no further hands the focus to the other arrow.

**Gutter.** The drawer's: the body is padded by `--space-drawer` (24px, 16 in a dense product), and the lines inside it keep the same space.

**Body.** The body is a form. After a refused save, Save is ready again as soon as the person moves to fix the field, whatever the control (a select fires no typing). The footer is pinned and holds Cancel and Save; with `saveAnother`, Save carries a menu with "Save and add another", for entering a batch of new records. That is why `submit` carries `{ another }` (true from "Save and add another": save, clear the form, keep the drawer open), where UiModal's `submit` carries nothing: a window sends one way. An action that sends a request by itself (delete, archive, a status) stays in the body: a card of UiListItem `as="button"` rows in a UiList after the fields, with the dangerous one last in `tone="danger"`. The body is a chain of UiCard sections, direct children of the slot, separated in one of two ways. By default a line stands between neighbors, and the sections need no titles. With `:divided="false"`, each section after the head of the record starts with a UiHeader `legend`, the line and the title in one, and the sections stand 48 apart, the step between blocks; a dev warning names a section without its legend. Do not put a form of your own in the slot.

**Delete.** An action that takes the record from the list closes the drawer first, waits a tick (`await nextTick()`), then removes the row: a UiTable then hands the focus to the same control of the row now in its place. A delete asked through UiConfirm with an `action` does the same inside the action, so a Retry deletes too; the question gives the focus back to the drawer's row, and the table hands it to the row now in its place.

**Steps.** A record with records inside opens them as steps of the same drawer, never as a second drawer. The parent swaps the body and the title and passes the levels above in `path`; the header shows a ‹ button named by the level above. ‹, Escape and the backdrop emit `back` with the level to go to, and Cancel goes one level up, so leaving a step never drops the input of a level above. A `persistent` step refuses with a shake. The cross closes the whole drawer; with `persistentAbove` (a level above holds unsaved input) it shakes instead. `error` works at a step as it does at the top. The focus goes to the first field of a new step, and back to its row on the way up. Each level has one job. A record is a form with a card of its actions (UiListItem `as="button" step` rows). What a record holds is a `readonly` list level (UiListField over the rows). A level that decides (a queue) is `readonly` with the verdict in the body, and a decline opens its note first. `readonly` keeps only the way back in the footer, and at the top level not even that. A path the header cannot name in one line needs a page instead.

### Keyboard

- `Enter`: in a single-line field, saves; in a text box it breaks the line.
- `Meta+Enter` `Ctrl+Enter`: save from a text box too (`Meta` is Cmd).
- `Escape`: closes, or goes one level up at a step; shakes instead while input is unsaved.
- `Tab`: stays inside the panel.
A refused save puts the focus on the first field in error. The up and down buttons in the header of the record walk the list when `index` and `total` are given. The focus goes to the first field once the record is in, and returns to the opener on close. It never lands on a button that sends a decision: on a level with no field, the panel takes it.

### Screen reader

- Window: a modal dialog named by the record's title (`aria-labelledby`).
- Body: says it is loading (`aria-busy`); a refused save marks the field in error (`aria-invalid`).
- Way up: at a step, a button named by the level above.
- Refused way out: a close, a step or the list's arrows; a shake for the eye, and the reader keeps the focus where it was and hears why: input not saved, or a request still on its way.

### States

`loading` shows a skeleton and holds Save; `#loading` gives one in the form's own geometry. A failed load (`error`) shows UiNoData `tone="danger"` with Retry in the body; the header keeps only the title, and Save is held. Pass `error` with the words and listen to `retry`. `submitting` spins Save and refuses every close. A submit the host refuses by marking a field as it gets it shakes the drawer, as a refused close does, and the focus goes to that field. `persistent` guards unsaved input on this level: the backdrop and Escape shake instead of closing. These guard only the drawer's own exits. A close from outside (`open` set to false, for example by the browser's Back on a deep link) is for the host to guard, before it changes `open`.

### When to use another component

- A panel to read or to set at once, with no form: UiDrawer.
- A short task that is not a record: UiModal.
- A question about the record (delete it?): UiConfirm above the drawer.
- A second drawer over the first: never; in UiCrudDrawer a record inside a record is a step of the same drawer (`path`).

## Examples

### Queue

```vue
<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { Download } from '@lucide/vue'
import type { BadgeTone, LogEvent } from 'grani-ui'
import { UiButton, UiCrudDrawer, UiBadge, UiCopyButton, UiCard, UiField, UiTextarea, UiHeader, UiList, UiListItem, UiLog, UiToaster, useToast } from 'grani-ui'

type ReviewStatus = 'approved' | 'declined' | 'waiting'

interface Review {
  id: number
  title: string
  secs: number
  status: ReviewStatus
  captions: string
  video: string
  model: string
  format: string
  price: string
  channel: string
  added: string
  bars: string[]
  note: string
  log: LogEvent[]
}

// A list with a first item cannot miss: the index wraps round it.
const cycle = <T,>(list: readonly [T, ...T[]], k: number): T => list[k % list.length] ?? list[0]

const toast = useToast()

// The server's answer after a moment; the switches say how it goes.
const later = (ms: number, fails: boolean) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (fails ? reject(new Error('offline')) : resolve()), ms),
  )

// Review a queue: the drawer walks a long list; the decision is the vendor's, the log is last.
const REVIEW_TOTAL = 65029

const TITLES: [string, ...string[]] = [
  'Morning run along the river',
  'Kitchen renovation, day three',
  'Street market at dusk',
  'Unboxing the new camera',
  'Night drive through the city',
]

// A heatmap is how much, not what: one hue from faint to full.
const BARS: [string, ...string[]] = [
  'bg-brand/10',
  'bg-brand/25',
  'bg-brand/45',
  'bg-brand/70',
  'bg-brand',
]

const STATUS: Record<ReviewStatus, [string, BadgeTone]> = {
  approved: ['Approved', 'success'],
  declined: ['Declined', 'danger'],
  waiting: ['Waiting', 'warning'],
}

const reviews = reactive<Record<number, Review>>({})

function review(i: number): Review {
  const known = reviews[i]
  if (known) return known
  const id = 99772 + i
  // The proxy the map would hand back, so a change to the record is seen.
  const made = reactive<Review>({
    id,
    title: cycle(TITLES, i),
    secs: 600 + ((i * 437) % 1200),
    status: i % 5 === 0 ? 'approved' : 'waiting',
    captions: `clip_${id}_${1790503183 + i * 97}.srt`,
    video: `${id}_1080p.mp4`,
    model: `Model 2609.1.${i % 3} · priority ${1 + (i % 5)}`,
    format: i % 2 ? 'Landscape' : 'Portrait',
    price: `$${(2.49 + (i % 4)).toFixed(2)}`,
    channel: cycle(['Riverside', 'Fieldnotes', 'Blue Hour'], i),
    added: `${27 - (i % 9)} Sep 2026`,
    bars: Array.from({ length: 60 }, (_, k) =>
      cycle(BARS, Math.abs(Math.round(Math.sin(k * 0.3 + i) * 3 + Math.sin(k * 0.07) * 2))),
    ),
    note: '',
    log: [
      {
        id: 2,
        at: '27 Sep, 09:33',
        kind: 'file',
        actor: { name: 'Captions Bureau' },
        action: 'uploaded',
        target: 'Captions',
      },
      {
        id: 1,
        at: '26 Sep, 18:10',
        kind: 'file',
        actor: { name: 'Riverside' },
        action: 'uploaded',
        target: '1080p file',
      },
    ],
  })
  reviews[i] = made
  return made
}

const reviewOpen = ref(false)

const reviewAt = ref(4)

const reviewBusy = ref<'' | 'approve' | 'decline'>('')

const noteMissing = ref(false)

// Declining asks for a note: the field opens only then, with the focus in it.
const declining = ref(false)

async function askNote() {
  declining.value = true
  await nextTick()
  document.querySelector<HTMLTextAreaElement>('.ui-drawer-panel textarea')?.focus()
}

const rec = computed(() => review(reviewAt.value))

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function moveReview(to: number) {
  if (reviewBusy.value || to < 0 || to >= REVIEW_TOTAL) return
  reviewAt.value = to
  noteMissing.value = false
  declining.value = false
}

// A decision is a request of its own; when it is done the next record opens, with an Undo.
async function decide(answer: 'approve' | 'decline') {
  if (reviewBusy.value) return
  const r = rec.value
  if (answer === 'decline' && !declining.value) return askNote()
  if (answer === 'decline' && !r.note.trim()) {
    noteMissing.value = true
    document.querySelector<HTMLTextAreaElement>('.ui-drawer-panel textarea')?.focus()
    return
  }
  reviewBusy.value = answer
  await later(500, false)
  const before = r.status
  r.status = answer === 'approve' ? 'approved' : 'declined'
  r.log.unshift({
    id: Date.now(),
    at: new Date(),
    kind: 'decision',
    actor: { name: 'You' },
    action: answer === 'approve' ? 'approved' : 'declined',
    changes: [
      {
        field: 'Status',
        from: STATUS[before][0],
        to: STATUS[r.status][0],
        tone: STATUS[r.status][1],
      },
    ],
    note: r.note.trim() || undefined,
    tone: answer === 'approve' ? 'success' : 'danger',
  })
  reviewBusy.value = ''
  const was = reviewAt.value
  moveReview(was + 1)
  toast.success(`${r.id} ${answer === 'approve' ? 'approved' : 'declined'}`, {
    action: {
      label: 'Undo',
      onClick: () => {
        r.status = before
        r.log.shift()
        reviewAt.value = was
      },
    },
  })
}
</script>

<template>
  <UiButton variant="outline" @click="reviewOpen = true">Review the queue</UiButton>
  <UiCrudDrawer
    v-model:open="reviewOpen"
    :divided="false"
    :title="rec.title"
    readonly
    :index="reviewAt"
    :total="REVIEW_TOTAL"
    @move="moveReview"
  >
    <template #description>
      <UiBadge
        variant="inline"
        size="sm"
        :tone="STATUS[rec.status][1]"
        :label="STATUS[rec.status][0]"
      />
      <span aria-hidden="true">·</span>
      <UiCopyButton :value="String(rec.id)" :truncate="12" variant="inline" />
      <span aria-hidden="true">·</span>
      <span>{{ clock(rec.secs) }}</span>
    </template>
    <UiCard>
      <div class="-mx-drawer -mt-drawer">
        <div class="flex h-16" aria-hidden="true">
          <span v-for="(bar, k) in rec.bars" :key="k" class="flex-1" :class="bar" />
        </div>
        <div class="flex justify-between px-drawer pt-2 font-mono text-xs text-fg-muted">
          <span v-for="f in [0, 0.25, 0.5, 0.75, 1]" :key="f">{{ clock(rec.secs * f) }}</span>
        </div>
      </div>
    </UiCard>
    <UiCard>
      <div class="flex flex-col gap-4">
        <UiField
          v-if="declining"
          label="Why is it declined?"
          :error="noteMissing ? 'Say why: the vendor reads this to fix the captions.' : ''"
        >
          <UiTextarea v-model="rec.note" :rows="3" @input="noteMissing = false" />
        </UiField>
        <div v-if="declining" class="grid grid-cols-2 gap-4">
          <UiButton variant="secondary" :disabled="Boolean(reviewBusy)" @click="declining = false"
            >Back</UiButton
          >
          <UiButton tone="danger" :loading="reviewBusy === 'decline'" @click="decide('decline')"
            >Decline and next</UiButton
          >
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <UiButton
            variant="secondary"
            tone="danger"
            :disabled="Boolean(reviewBusy)"
            @click="decide('decline')"
            >Decline</UiButton
          >
          <UiButton :loading="reviewBusy === 'approve'" @click="decide('approve')"
            >Approve</UiButton
          >
        </div>
      </div>
    </UiCard>
    <UiCard>
      <div class="flex flex-col gap-4">
        <UiHeader variant="legend" title="Files" />
        <UiCard :padded="false">
          <UiList>
            <UiListItem size="sm">
              <span class="block truncate font-mono text-xs text-fg">{{ rec.captions }}</span>
              <template #actions>
                <UiButton size="xs" variant="outline"><Download />Captions</UiButton>
              </template>
            </UiListItem>
            <UiListItem size="sm">
              <span class="block truncate font-mono text-xs text-fg">{{ rec.video }}</span>
              <template #actions>
                <UiButton size="xs" variant="outline"><Download />1080p</UiButton>
              </template>
            </UiListItem>
          </UiList>
        </UiCard>
      </div>
    </UiCard>
    <UiCard>
      <div class="flex flex-col gap-4">
        <UiHeader variant="legend" title="Details" />
        <UiCard :padded="false">
          <UiList>
            <UiListItem
              v-for="[term, value] in [
                ['Vendor', 'Captions Bureau'],
                ['Generated', rec.model],
                ['Format', rec.format],
                ['Price', rec.price],
                ['Channel', rec.channel],
                ['Added', rec.added],
              ]"
              :key="term"
              size="sm"
            >
              <span class="text-sm text-fg-muted">{{ term }}</span>
              <template #actions
                ><span class="text-sm text-fg">{{ value }}</span></template
              >
            </UiListItem>
          </UiList>
        </UiCard>
      </div>
    </UiCard>
    <UiCard>
      <div class="flex flex-col gap-4">
        <UiHeader variant="legend" title="History" />
        <UiLog :items="rec.log" aria-label="History" />
      </div>
    </UiCard>
  </UiCrudDrawer>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Several

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiCard, UiList, UiListItem, UiCrudDrawer, UiField, UiInput, UiToaster, useToast } from 'grani-ui'

interface NewClient {
  id: number
  name: string
  city: string
}

const toast = useToast()

// A batch of new records: Save and add another saves, clears the form and keeps the drawer open.
const batchOpen = ref(false)

const batchSaving = ref(false)

const batch = ref({ name: '', city: '' })

// The clients already there: the new ones join the list as they are saved.
const added = ref<NewClient[]>([
  { id: 1, name: 'Northwind Studio', city: 'San Francisco' },
  { id: 2, name: 'Birch & Co', city: 'Portland' },
])

const nameMissing = ref(false)

function openBatch() {
  batch.value = { name: '', city: '' }
  nameMissing.value = false
  batchOpen.value = true
}

let nextId = 3

async function saveBatch({ another }: { another: boolean }) {
  if (!batch.value.name.trim()) {
    // The drawer puts the focus on the field it marks.
    nameMissing.value = true
    return
  }
  batchSaving.value = true
  try {
    await new Promise((r) => setTimeout(r, 600))
    added.value = [...added.value, { id: nextId++, ...batch.value }]
    toast.success(`${batch.value.name} added`)
    batch.value = { name: '', city: '' }
    if (!another) batchOpen.value = false
  } finally {
    batchSaving.value = false
  }
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-4">
    <UiButton class="self-start" @click="openBatch">New client</UiButton>
    <UiCard v-if="added.length" :padded="false">
      <UiList>
        <UiListItem
          v-for="c in added"
          :key="c.id"
          size="sm"
          :title="c.name"
          :description="c.city"
        />
      </UiList>
    </UiCard>
  </div>
  <UiCrudDrawer
    v-model:open="batchOpen"
    title="New client"
    save-another
    :submitting="batchSaving"
    :persistent="Boolean(batch.name.trim() || batch.city.trim())"
    @submit="saveBatch"
  >
    <UiCard>
      <div class="flex flex-col gap-4">
        <UiField label="Name" required :error="nameMissing ? 'Enter the client\'s name.' : ''">
          <UiInput v-model="batch.name" @input="nameMissing = false" />
        </UiField>
        <UiField label="City"><UiInput v-model="batch.city" /></UiField>
      </div>
    </UiCard>
  </UiCrudDrawer>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Steps

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2, X } from '@lucide/vue'
import { UiButton, UiCrudDrawer, UiCard, UiField, UiInput, UiList, UiListItem, UiListField, UiIconButton, UiToaster, UiConfirm, useConfirm, useToast } from 'grani-ui'

interface Sub {
  id: string
  name: string
  items: number
  rules: string[]
}

type LevelKind = 'category' | 'subs' | 'sub' | 'rules'

const matching = <T extends { name: string }>(rows: T[], typed: string): T[] => {
  const q = typed.trim().toLowerCase()
  return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
}

const { confirm } = useConfirm()

const toast = useToast()

// The server's answer after a moment; the switches say how it goes.
const later = (ms: number, fails: boolean) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (fails ? reject(new Error('offline')) : resolve()), ms),
  )

// Levels: each has one job. A record is a form with the card of its actions; what it holds is a
// list level of its own, one field that finds and adds.
const sub = (name: string, items: number, rules: string[] = []): Sub => ({
  id: name.toLowerCase(),
  name,
  items,
  rules,
})

const category = ref<{ name: string; subs: Sub[] }>({
  name: 'Groceries',
  subs: [
    sub('Fruit', 12, ['apple', 'banana', 'market']),
    sub('Dairy', 7, ['milk']),
    sub('Bakery', 5),
    sub('Vegetables', 9),
    sub('Meat', 4),
    sub('Fish', 0),
    sub('Frozen food', 2),
    sub('Drinks', 6),
    sub('Snacks', 0),
    sub('Spices', 1),
  ],
})

const levelsOpen = ref(false)

// [] the category, ['subs'] its list, ['subs', id] a subcategory, ['subs', id, 'rules'] its words.
const at = ref<string[]>([])

const catName = ref('')

const subName = ref('')

const query = ref('')

const current = computed(() => category.value.subs.find((s) => s.id === at.value[1]))

const KINDS: readonly LevelKind[] = ['category', 'subs', 'sub', 'rules']

const kind = computed(() => KINDS[at.value.length] ?? 'category')

const shownRules = computed(() =>
  matching(
    (current.value?.rules ?? []).map((r) => ({ id: r, name: r })),
    query.value,
  ),
)

const shownSubs = computed(() => matching(category.value.subs, query.value))

const records = computed(() => category.value.subs.reduce((n, s) => n + s.items, 0))

const levelTitle = computed(
  () =>
    (
      ({
        category: category.value.name,
        subs: 'Subcategories',
        sub: current.value?.name ?? '',
        rules: 'Rules',
      }) satisfies Record<LevelKind, string>
    )[kind.value],
)

const levelLine = computed(
  () =>
    (
      ({
        category: `${category.value.subs.length} subcategories · ${records.value} records`,
        subs: `in ${category.value.name}`,
        sub: current.value && `${current.value.items} records · in ${category.value.name}`,
        rules: current.value && `Words that bring a record to ${current.value.name}`,
      }) satisfies Record<LevelKind, string | undefined>
    )[kind.value],
)

const levelPath = computed(() =>
  [category.value.name, 'Subcategories', current.value?.name ?? ''].slice(0, at.value.length),
)

const levelDirty = computed(() =>
  kind.value === 'sub'
    ? subName.value !== current.value?.name
    : kind.value === 'category' && catName.value !== category.value.name,
)

function openCategory() {
  catName.value = category.value.name
  query.value = ''
  at.value = []
  levelsOpen.value = true
}

function stepInto(s: Sub) {
  subName.value = s.name
  query.value = ''
  at.value = ['subs', s.id]
}

function goBack(to: number) {
  query.value = ''
  at.value = at.value.slice(0, to)
}

const lit = ref<string[]>([])

let dim: ReturnType<typeof setTimeout> | undefined

// A row lights for a moment when it comes, or when a repeat points at it.
function light(names: string[]) {
  clearTimeout(dim)
  lit.value = names
  dim = setTimeout(() => (lit.value = []), 1200)
}

function addItems(names: string[]) {
  if (kind.value === 'rules') current.value?.rules.push(...names.map((n) => n.toLowerCase()))
  else category.value.subs.push(...names.map((name) => sub(name, 0)))
  light(names.map((n) => (kind.value === 'rules' ? n.toLowerCase() : n)))
}

// What was added here stands on top, until the level is left.
const onTop = <T extends { name: string }>(rows: T[], fresh: string[]): T[] => [
  ...rows.filter((r) => fresh.includes(r.name)),
  ...rows.filter((r) => !fresh.includes(r.name)),
]

function removeRule(w: string) {
  const s = current.value
  if (s) s.rules = s.rules.filter((r) => r !== w)
}

function saveLevel() {
  if (current.value) {
    current.value.name = subName.value.trim() || current.value.name
    goBack(1)
    return
  }
  category.value.name = catName.value.trim() || category.value.name
  levelsOpen.value = false
  toast.success('Category saved')
}

// Records in it cannot come back with an Undo: that one asks first. An empty one goes at once.
async function removeSub() {
  const s = current.value
  if (!s) return
  if (s.items) {
    const ok = await confirm({
      title: `Delete ${s.name}?`,
      message: `Its ${s.items} records lose their subcategory. This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return
  }
  const i = category.value.subs.indexOf(s)
  category.value.subs.splice(i, 1)
  goBack(1)
  if (!s.items)
    toast.success(`${s.name} deleted`, {
      action: { label: 'Undo', onClick: () => category.value.subs.splice(i, 0, s) },
    })
}

function removeCategory() {
  void confirm({
    title: `Delete ${category.value.name}?`,
    message: `Its ${category.value.subs.length} subcategories go with it. This cannot be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
    action: async () => {
      await later(600, false)
      levelsOpen.value = false
    },
    success: 'Category deleted',
  })
}
</script>

<template>
  <UiButton variant="outline" @click="openCategory">Open {{ category.name }}</UiButton>
  <UiCrudDrawer
    v-model:open="levelsOpen"
    :title="levelTitle"
    :description="levelLine"
    :path="levelPath"
    :readonly="kind === 'subs' || kind === 'rules'"
    :persistent="levelDirty"
    @back="goBack"
    @submit="saveLevel"
  >
    <UiCard v-if="kind === 'category'">
      <div class="flex flex-col gap-4">
        <UiField label="Name"><UiInput v-model="catName" /></UiField>
        <UiCard :padded="false">
          <UiList>
            <UiListItem as="button" size="sm" step title="Subcategories" @click="at = ['subs']">
              <template #actions>
                <span class="text-sm text-fg-muted">{{ category.subs.length }}</span>
              </template>
            </UiListItem>
            <UiListItem
              as="button"
              size="sm"
              title="Delete the category"
              tone="danger"
              @click="removeCategory"
            >
              <template #actions><Trash2 /></template>
            </UiListItem>
          </UiList>
        </UiCard>
      </div>
    </UiCard>
    <UiCard v-else-if="kind === 'sub' && current">
      <div class="flex flex-col gap-4">
        <UiField label="Name"><UiInput v-model="subName" /></UiField>
        <UiCard :padded="false">
          <UiList>
            <UiListItem
              as="button"
              size="sm"
              step
              title="Rules"
              @click="at = ['subs', current.id, 'rules']"
            >
              <template #actions>
                <span class="text-sm text-fg-muted">{{ current.rules.length }}</span>
              </template>
            </UiListItem>
            <UiListItem
              as="button"
              size="sm"
              title="Delete the subcategory"
              tone="danger"
              @click="removeSub"
            >
              <template #actions><Trash2 /></template>
            </UiListItem>
          </UiList>
        </UiCard>
      </div>
    </UiCard>
    <UiCard v-else>
      <UiListField
        v-model:query="query"
        :placeholder="kind === 'rules' ? 'Find or add a word' : 'Find or add a subcategory'"
        :empty="
          kind === 'rules'
            ? 'No words yet: type one and press Enter.'
            : 'No subcategories yet: type a name and press Enter.'
        "
        :existing="kind === 'rules' ? (current?.rules ?? []) : category.subs.map((s) => s.name)"
        :fix="kind === 'rules' ? (w) => w.toLowerCase() : undefined"
        @add="addItems"
        @taken="(name) => light([name])"
      >
        <template #default="{ added: fresh }">
          <template v-if="kind === 'rules'">
            <UiListItem
              v-for="w in onTop(shownRules, fresh)"
              :key="w.id"
              size="sm"
              :title="w.name"
              :highlight="query"
              :lit="lit.includes(w.name)"
            >
              <template #actions>
                <UiIconButton
                  :icon="X"
                  :ariaLabel="`Remove ${w.name}`"
                  size="xs"
                  variant="ghost"
                  @click="removeRule(w.name)"
                />
              </template>
            </UiListItem>
          </template>
          <template v-else>
            <UiListItem
              v-for="s in onTop(shownSubs, fresh)"
              :key="s.id"
              :lit="lit.includes(s.name)"
              as="button"
              size="sm"
              step
              :title="s.name"
              :highlight="query"
              :description="`${s.items} records`"
              @click="stepInto(s)"
            />
          </template>
        </template>
      </UiListField>
    </UiCard>
  </UiCrudDrawer>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
  <UiConfirm />
</template>

```

## API

Props:
- `title`: `string` (required) — The record's name, the dialog's name for a screen reader: "Santa", not "Edit operation".
- `description`: `string` (default `""`) — What the record is and a detail: "operation · 31 Aug".
- `loading`: `boolean` (default `false`) — The record is still loading: a skeleton in the body, Save held.
- `submitting`: `boolean` (default `false`) — Saving: a spinner on Save, Cancel held, and no way to close until it ends.
- `submitDisabled`: `boolean` (default `false`) — Save is held: nothing to save yet, or the form cannot be sent for a reason of your own; a load that failed is `error`.
- `persistent`: `boolean` (default `false`) — Unsaved input on this level: the backdrop and Escape are refused with a shake; Cancel and the cross still close.
- `persistentAbove`: `boolean` (default `false`) — At a step: a level above holds unsaved input. The cross, which closes them all, shakes instead; ‹, Escape and Cancel go one up as ever.
- `error`: `string | null` (default `null`) — Why the record could not be loaded, in words for the reader: the body says it with Retry (`retry`), the header keeps the title alone, Save is held and nothing is guarded.
- `submitLabel`: `string` (default `""`) — Save's label; defaults to "Save".
- `saveAnother`: `boolean` (default `false`) — A menu on Save with "Save and add another", for a batch of new records: the parent saves (setting `submitting` while it does), clears the form and keeps the drawer open; once the form changed from what was sent, the cursor goes to its first field, a default kept in it or not.
- `cancelLabel`: `string` (default `""`) — Cancel's label; defaults to "Cancel".
- `path`: `string[]` (default `[]`) — The levels above this one, from the top: `['Groceries', 'Fruit']`. Set, the header shows ‹, named by the last.
- `index`: `number` (default `0`) — The record's place in the list it was opened from, from 0, across its pages; with `total`, the header walks the list.
- `total`: `number` (default `0`) — How many records the list holds: two or more, the header of the record shows ↑ ↓, which emit `move`; a step shows none.
- `readonly`: `boolean` (default `false`) — Nothing on this level waits for Save, every row goes at once: the footer holds only the way back; at the top there is no footer, the cross closes.
- `divided`: `boolean` (default `true`) — A line between neighboring sections, the default; `false` parts them by their titles and the gap: a long form of different parts.
- `size`: `"md" | "lg"` = `md | lg` (default `"md"`) — The panel's width: `md` 512px for a record, the default; `lg` 768px for what reads wide, a text or a code.
- `open`: `boolean` (default `false`)
Attributes are placed by the component itself: its description says where.

Events:
- `submit` (`options: { another: boolean; }`) — Save was pressed or Enter was hit in a single-line field; once per request. `another` is true from "Save and add another": save, then clear the form for the next record and keep the drawer open.
- `retry` — Retry of a load that failed was pressed; the parent loads the record again.
- `update:open` (`value: boolean`) — The new value of `open`, for `v-model:open`.
- `close` — The drawer closed: Cancel, the cross, the backdrop or Escape.
- `back` (`to: number`) — The way up was asked for: ‹, Escape, the backdrop or Cancel at a step. `to` is the index in `path` to show; the parent swaps the level.
- `move` (`to: number`) — The up or down button in the header: `to` is the index of the record to show in the drawer; the parent loads it.

Slots:
- `default` with `Record<string, never>` — The form: fields, or UiCard sections separated by the drawer. No `<form>` of your own.
- `status` with `Record<string, never>` — Beside the title, for a record whose status is the point; a status as usual is a small mark in `#description`.
- `description` with `Record<string, never>` — The small line under the title in your own markup, in place of `description`: an id to copy (UiCopyButton), facts. One line.
- `actions` with `Record<string, never>` — Icon buttons before the cross: open as a page, more actions. Ghost UiIconButton.
- `loading` with `Record<string, never>` — While `loading`, a skeleton in the geometry of the form that comes, so nothing moves when it does; two fields by default.

## How it behaves

### Step in

- When: a level is opened from a row of the level above.
- Props: `path`, the titles of the levels above; `back` with the level to go to.
- Guarantee: The related view opens inside the same drawer, with focus on its first field and a named Back button, such as “Back to Fruit”. Escape, Cancel and clicking the backdrop return one level instead of closing the whole drawer. The previous draft is retained, and focus returns to the row that opened the view.
- Without it: A second window over the first: the record behind it is hidden, and closing the window drops keyboard focus to the page.
- Code: `<UiCrudDrawer v-model:open="open" :title="title" :path="path" @back="goTo">…</UiCrudDrawer>`
- Your part: Swap the body and the title for the step, pass the titles of the levels above in `path`, and go to the level that `back` names.
- Proof, in the repository's tests (UiCrudDrawer.spec.ts, not in the package): "a step shows a back button named by the level above, and no breadcrumb", "a step in focuses its first field; the way up gives focus back to the row it left from", "a backdrop press at a step goes back one level first, as Escape does, so it never discards an ancestor level's unsaved input"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#open-related

### Submit a form with Enter

- When: You are typing in a single-line field of the record.
- Props: the drawer’s own Save; `submitting` while the save runs.
- Guarantee: Enter saves the record, as pressing Save does. A second Enter sends no second `submit` until the save ends, or until you move in the form or change it.
- Without it: You have to leave the field and move to Save, and a quick second Enter sends the record twice.
- Code: `<UiCrudDrawer v-model:open="open" :title="record.name" :submitting="saving" @submit="save">…</UiCrudDrawer>`
- Your part: Set `submitting` while the request runs, and close the drawer or mark the field in error when it answers.
- Proof, in the repository's tests (UiCrudDrawer.spec.ts, not in the package): "Enter in a single-line field saves: the fields and Save stand in one form", "the footer is exactly Cancel and Save; Save submits the form", "a second Enter before submitting arrives sends no second request"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-saves

### Step through records in one drawer

- When: The drawer opens a record from a list of two records or more.
- Props: `index` and `total`, the `move` event.
- Guarantee: Previous record and Next record (↑ and ↓ in the header) ask for the record before or after this one; at the first or the last record that way is off. While `persistent` marks unsaved input, or `submitting` a save, they refuse with a shake and your input stays. At a step into what the record holds they are gone: you go up first, so the walk never drops the input of a level above.
- Without it: You close the drawer, find the next row and open it again for every record.
- Code: `<UiCrudDrawer v-model:open="open" :title="record.name" :index="i" :total="rows.length" @move="i = $event">…</UiCrudDrawer>`
- Your part: Pass the record’s place in the list as `index` and the list’s length as `total`, load the record whose index `move` carries, and set `persistent` while there is unsaved input.
- Proof, in the repository's tests (UiCrudDrawer.spec.ts, not in the package): "index and total walk the list: ↑ and ↓ emit move, held at the ends", "unsaved input or a save on its way refuse to walk the list, with a shake", "without total there is no list to walk", "at a step the arrows are gone, and they are back one level up"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#walk-records

### Save and add another

- When: you enter a batch of new records.
- Props: `saveAnother`, and `submit` read for `another`.
- Guarantee: The Save menu offers Save and add another. When that save finishes and the app clears the form, keyboard focus moves to its first field, ready for the next record, even when that field keeps a default such as a currency. If the save fails and the form is left as it was sent, focus stays where it was.
- Without it: The drawer closes after each save, and every next record starts with opening it again.
- Code: `<UiCrudDrawer v-model:open="open" title="New client" save-another @submit="save">…</UiCrudDrawer>`
- Your part: Set `submitting` while saving. `submit` includes `another: true` for Save and add another, and `another: false` for Save or Enter. After a successful save with `another: true`, clear the form (a default may stay) and keep the drawer open.
- Not covered: The drawer tells a cleared form from a failed save by comparing the fields with what they held when Save and add another was pressed. A form reset to exactly what was sent counts as a failed save, unless every field is empty; an answer that adds or removes a field counts as a cleared form.
- Proof, in the repository's tests (UiCrudDrawer.spec.ts, not in the package): "it asks with another: true, and Save and Enter with another: false", "when the save for another ends, the cursor is in the first field of the clean form", "saved to add another, the cursor goes to the first field though it keeps its default", "a save for another that failed leaves the cursor alone though the first field is empty"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#save-and-new


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useSubmitLock`, `focusInvalid`, `useUiT`.
