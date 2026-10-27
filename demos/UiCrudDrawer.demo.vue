<script lang="ts">
export const blurb = 'Edit a record beside its list and open related lists within the same panel.'
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Archive, Download, Trash2, X } from '@lucide/vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import type { BadgeTone, LogEvent } from '../types/ui'

interface NewClient {
  id: number
  name: string
  city: string
}
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
interface Sub {
  id: string
  name: string
  items: number
  rules: string[]
}
type LevelKind = 'category' | 'subs' | 'sub' | 'rules'
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
const matching = <T extends { name: string }>(rows: T[], typed: string): T[] => {
  const q = typed.trim().toLowerCase()
  return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
}

const { confirm } = useConfirm()
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
// A queue is worked from the keyboard: A approves, D declines, J and K walk it. Not while typing.
function onReviewKey(e: KeyboardEvent) {
  if (!reviewOpen.value || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable="true"]'))
    return
  const k = e.key.toLowerCase()
  if (k === 'j') moveReview(reviewAt.value + 1)
  else if (k === 'k') moveReview(reviewAt.value - 1)
  else if (k === 'a') void decide('approve')
  else if (k === 'd') void decide('decline')
  else return
  e.preventDefault()
}
onMounted(() => document.addEventListener('keydown', onReviewKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onReviewKey))
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
  <DemoBlock title="Base">
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
  </DemoBlock>
  <DemoBlock title="Queue">
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
  </DemoBlock>
  <DemoBlock title="Several">
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
  </DemoBlock>

  <DemoBlock title="Steps">
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
  </DemoBlock>
</template>
