<script lang="ts">
export const blurb =
  'Search a list and add entries from one field. Paste a column to add several entries, and recover your text if adding fails.'
</script>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { X } from '@lucide/vue'

const names = ref<string[]>([
  'Fruit',
  'Dairy',
  'Bakery',
  'Vegetables',
  'Meat',
  'Fish',
  'Frozen food',
])
// In a form: the field's legend names the list, and its error says what the list still needs.
const tags = ref<string[]>([])
const tagText = ref('')
const query = ref('')
const fails = ref(false)
const lit = ref<string[]>([])
let dim: ReturnType<typeof setTimeout> | undefined
const matching = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? names.value.filter((n) => n.toLowerCase().includes(q)) : names.value
})
// What was added here stands on top, marked New, until the list is left.
const ordered = (added: string[]) => [
  ...matching.value.filter((n) => added.includes(n)),
  ...matching.value.filter((n) => !added.includes(n)),
]
// A row lights for a moment when it comes, or when a repeat points at it.
function light(items: string[]) {
  clearTimeout(dim)
  lit.value = items
  dim = setTimeout(() => (lit.value = []), 1200)
}
// Each item is a request; the promise holds the field, a rejection gives the text back.
const add = (items: string[]) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (fails.value) return reject(new Error('offline'))
      names.value.push(...items)
      light(items)
      resolve()
    }, 600),
  )

// A list that has nothing yet: the first name typed goes in with Enter.
const fresh = ref<string[]>([])
const freshQuery = ref('')
const freshShown = computed(() => {
  const q = freshQuery.value.trim().toLowerCase()
  return q ? fresh.value.filter((n) => n.toLowerCase().includes(q)) : fresh.value
})
const addFresh = (items: string[]) => fresh.value.push(...items)
// No right to add here: the field is held, the rows still open.
const locked = ['Fruit', 'Dairy', 'Bakery']

// Lists in a form, search off: every row is in view, the field only adds. One list per tab.
interface EditableList {
  items: string[]
  lit: string[]
  light: (items: string[]) => void
  add: (items: string[]) => void
  remove: (name: string) => void
}

function list(start: string[]): EditableList {
  let fading: ReturnType<typeof setTimeout> | undefined
  const l: EditableList = reactive({
    items: [...start],
    lit: [],
    light: (items: string[]) => {
      clearTimeout(fading)
      l.lit = items
      fading = setTimeout(() => (l.lit = []), 1200)
    },
    add: (items: string[]) => {
      l.items.push(...items)
      l.light(items)
    },
    remove: (name: string) => (l.items = l.items.filter((i) => i !== name)),
  })
  return l
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const emails = list(['anna@example.com'])
interface ItemRules {
  fix: (item: string) => string
  check: (item: string) => string | undefined
}

const email: ItemRules = {
  fix: (s) => s.toLowerCase().replace(/^<|>$/g, ''),
  check: (s) => (EMAIL.test(s) ? undefined : `“${s}” is not an email.`),
}

const words = list(['apple', 'banana'])
const word = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')

const DOMAIN = /^([a-z0-9-]+\.)+[a-z]{2,}$/
const domains = list(['example.com'])
const domain: ItemRules = {
  fix: (s) =>
    s
      .toLowerCase()
      .replace(/^[a-z]+:\/\//, '')
      .replace(/^www\./, '')
      .replace(/[/?#].*$/, ''),
  check: (s) => (DOMAIN.test(s) ? undefined : `“${s}” is not a domain.`),
}

const phones = list(['+44 20 7946 0958'])
const phone: ItemRules = {
  fix: (s) => {
    const d = s.replace(/\D/g, '').replace(/^0/, '44')
    return d.length === 12 && d.startsWith('44')
      ? `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`
      : s
  },
  check: (s) => (/^\+44 \d{2} \d{4} \d{4}$/.test(s) ? undefined : `“${s}” is not a phone number.`),
}

const steps = list([
  'Call the client',
  'Send the invoice',
  'Check the payment',
  'Close the order',
  'Ask for a review',
  'Archive the chat',
])

const options = list(['Small', 'Medium'])
const SIZES = ['sm', 'md'] as const
// One list per size: a tag added at sm stays there.
const sized = { sm: list(['Urgent', 'Wholesale']), md: list(['Urgent', 'Wholesale']) }
const invited = list(['anna@example.com'])
const option = (s: string) => s.replace(/\s+/g, ' ')
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField
        v-slot="{ added }"
        v-model:query="query"
        placeholder="Find or add a subcategory"
        :existing="names"
        @add="add"
        @taken="(name) => light([name])"
      >
        <UiListItem
          v-for="name in ordered(added)"
          :key="name"
          as="button"
          size="sm"
          step
          :title="name"
          :highlight="query"
          :lit="lit.includes(name)"
        >
          <template v-if="added.includes(name)" #actions>
            <UiBadge label="New" tone="success" size="sm" />
          </template>
        </UiListItem>
      </UiListField>
      <UiSwitch v-model="fails">The server fails</UiSwitch>
    </div>
  </DemoBlock>
  <DemoBlock title="Empty">
    <div class="w-full max-w-sm">
      <UiListField
        v-model:query="freshQuery"
        placeholder="Find or add a subcategory"
        empty="No subcategories yet: type a name and press Enter."
        :existing="fresh"
        @add="addFresh"
      >
        <UiListItem
          v-for="name in freshShown"
          :key="name"
          as="button"
          size="sm"
          step
          :title="name"
          :highlight="freshQuery"
        />
      </UiListField>
    </div>
  </DemoBlock>
  <DemoBlock title="Disabled">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField disabled placeholder="Find or add a subcategory" :existing="locked">
        <UiListItem v-for="name in locked" :key="name" as="button" size="sm" step :title="name" />
      </UiListField>
      <p class="text-xs text-fg-muted">No right to add: the field is held, the rows still open.</p>
    </div>
  </DemoBlock>
  <DemoBlock title="Invite">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField
        :search="false"
        placeholder="Add an email…"
        split="lists"
        :fix="email.fix"
        :check="email.check"
        :existing="emails.items"
        @add="emails.add"
        @taken="(name) => emails.light([name])"
      >
        <UiListItem
          v-for="name in emails.items"
          :key="name"
          size="sm"
          :title="name"
          :lit="emails.lit.includes(name)"
        >
          <template #actions>
            <UiIconButton
              :icon="X"
              :ariaLabel="`Remove ${name}`"
              size="xs"
              variant="ghost"
              @click="emails.remove(name)"
            />
          </template>
        </UiListItem>
      </UiListField>
      <p class="text-xs text-fg-muted">Type “Oleg@Example.com, foo” and press Enter.</p>
    </div>
  </DemoBlock>
  <DemoBlock title="Cleanup">
    <div class="flex w-full flex-col gap-6">
      <div class="flex w-full max-w-sm flex-col gap-4">
        <UiListField
          :search="false"
          placeholder="Add a word…"
          split="lists"
          :fix="word"
          :existing="words.items"
          @add="words.add"
          @taken="(name) => words.light([name])"
        >
          <UiListItem
            v-for="name in words.items"
            :key="name"
            size="sm"
            :title="name"
            :lit="words.lit.includes(name)"
          >
            <template #actions>
              <UiIconButton
                :icon="X"
                :ariaLabel="`Remove ${name}`"
                size="xs"
                variant="ghost"
                @click="words.remove(name)"
              />
            </template>
          </UiListItem>
        </UiListField>
        <p class="text-xs text-fg-muted">Type “Market, GREEN apple”: two rules, tidied.</p>
      </div>
      <div class="flex w-full max-w-sm flex-col gap-4">
        <UiListField
          :search="false"
          placeholder="Add a domain…"
          :fix="domain.fix"
          :check="domain.check"
          :existing="domains.items"
          @add="domains.add"
          @taken="(name) => domains.light([name])"
        >
          <UiListItem
            v-for="name in domains.items"
            :key="name"
            size="sm"
            :title="name"
            :lit="domains.lit.includes(name)"
          >
            <template #actions>
              <UiIconButton
                :icon="X"
                :ariaLabel="`Remove ${name}`"
                size="xs"
                variant="ghost"
                @click="domains.remove(name)"
              />
            </template>
          </UiListItem>
        </UiListField>
        <p class="text-xs text-fg-muted">Type “https://www.Partner.test/login”.</p>
      </div>
      <div class="flex w-full max-w-sm flex-col gap-4">
        <UiListField
          :search="false"
          placeholder="Add a number…"
          split="lists"
          :fix="phone.fix"
          :check="phone.check"
          :existing="phones.items"
          @add="phones.add"
          @taken="(name) => phones.light([name])"
        >
          <UiListItem
            v-for="name in phones.items"
            :key="name"
            size="sm"
            :title="name"
            :lit="phones.lit.includes(name)"
          >
            <template #actions>
              <UiIconButton
                :icon="X"
                :ariaLabel="`Remove ${name}`"
                size="xs"
                variant="ghost"
                @click="phones.remove(name)"
              />
            </template>
          </UiListItem>
        </UiListField>
        <p class="text-xs text-fg-muted">Type “020 7946 0123”: kept in one shape.</p>
      </div>
    </div>
  </DemoBlock>
  <DemoBlock title="Limit">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField
        :search="false"
        placeholder="Add a step…"
        :limit="10"
        :existing="steps.items"
        @add="steps.add"
        @taken="(name) => steps.light([name])"
      >
        <UiListItem
          v-for="name in steps.items"
          :key="name"
          size="sm"
          :title="name"
          :lit="steps.lit.includes(name)"
        >
          <template #actions>
            <UiIconButton
              :icon="X"
              :ariaLabel="`Remove ${name}`"
              size="xs"
              variant="ghost"
              @click="steps.remove(name)"
            />
          </template>
        </UiListItem>
      </UiListField>
      <p class="text-xs text-fg-muted">Paste five lines: four fit, then the field goes.</p>
    </div>
  </DemoBlock>
  <DemoBlock title="Options">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField
        :search="false"
        placeholder="Add an option…"
        :fix="option"
        :existing="options.items"
        @add="options.add"
        @taken="(name) => options.light([name])"
      >
        <UiListItem
          v-for="name in options.items"
          :key="name"
          size="sm"
          :title="name"
          :lit="options.lit.includes(name)"
        >
          <template #actions>
            <UiIconButton
              :icon="X"
              :ariaLabel="`Remove ${name}`"
              size="xs"
              variant="ghost"
              @click="options.remove(name)"
            />
          </template>
        </UiListItem>
      </UiListField>
      <p class="text-xs text-fg-muted">Type “medium”: the one there lights up.</p>
    </div>
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <!-- The field's row is a list row's height: 44 at sm (the app's default), 56 at md. -->
    <UiListField
      v-for="size in SIZES"
      :key="size"
      :size="size"
      :search="false"
      placeholder="Add a tag…"
      :existing="sized[size].items"
      class="w-64"
      @add="sized[size].add"
      @taken="(name) => sized[size].light([name])"
    >
      <UiListItem
        v-for="name in sized[size].items"
        :key="name"
        :size="size"
        :title="name"
        :lit="sized[size].lit.includes(name)"
      />
    </UiListField>
  </DemoBlock>
  <DemoBlock title="Russian" locale="ru">
    <!-- The app's language: createGrani({ locale: 'ru', translate }). The lines count in Russian
         plural forms: paste five addresses into a list of three to see what did not fit. -->
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiListField
        :search="false"
        :limit="3"
        :existing="invited.items"
        @add="invited.add"
        @taken="(name) => invited.light([name])"
      >
        <UiListItem
          v-for="name in invited.items"
          :key="name"
          size="sm"
          :title="name"
          :lit="invited.lit.includes(name)"
        >
          <template #actions>
            <UiIconButton
              :icon="X"
              :ariaLabel="`Remove ${name}`"
              size="xs"
              variant="ghost"
              @click="invited.remove(name)"
            />
          </template>
        </UiListItem>
      </UiListField>
    </div>
  </DemoBlock>
  <DemoBlock title="Field">
    <UiField
      label="Tags"
      group
      required
      :error="tags.length ? undefined : 'Add at least one tag'"
      class="w-full max-w-sm"
    >
      <UiListField
        v-model:query="tagText"
        :search="false"
        placeholder="Add a tag…"
        :existing="tags"
        @add="(items) => (tags = [...tags, ...items])"
      >
        <UiListItem v-for="name in tags" :key="name" size="sm" :title="name">
          <template #actions>
            <UiIconButton
              :icon="X"
              variant="ghost"
              size="xs"
              :ariaLabel="`Remove ${name}`"
              @click="tags = tags.filter((t) => t !== name)"
            />
          </template>
        </UiListItem>
      </UiListField>
    </UiField>
  </DemoBlock>
</template>
