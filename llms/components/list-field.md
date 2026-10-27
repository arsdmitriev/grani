# List field (`UiListField`)

> Search a list and add entries from one field. Paste a column to add several entries, and recover your text if adding fails.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/list-field

Also called tag input, token input, chips input, multi-value field.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [List item](https://grani.arseni.work/components/list-item).

## Use

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiListField, UiListItem, UiBadge, UiSwitch } from 'grani-ui'

const names = ref<string[]>([
  'Fruit',
  'Dairy',
  'Bakery',
  'Vegetables',
  'Meat',
  'Fish',
  'Frozen food',
])

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
</script>

<template>
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
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Get your text back when adding fails.
- Know what was refused and why.
- Avoid adding the same entry twice.
- Know what fits when a list has a limit.
- Paste a list to add several entries.
- See whether an action worked.
- Ignore extra presses while a request runs.
- Give every empty list a way forward.
- See the value the app actually accepted.
- Finish a word in any script before it is sent.
- Clear a search in one step.
- Go straight to the field that needs fixing.
- Clear a field and enter its replacement immediately.
- Pick with Enter without sending the form.
- Keep your browser’s keyboard shortcuts.
- Keep keyboard focus where you are working.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Return the request's promise from `@add`, and let it reject when the request fails; a handler that throws counts as a failure too.
- Return a clear correction from `check`, such as “Enter a complete email address, including the domain.”.
- List the current names in `existing`, and highlight the row that `@taken` names. Put a new name into `existing` before the promise `@add` returned settles: one put there later can be added twice.
- Set `limit`. It is counted against the names in `existing`, so keep `existing` up to date.
- Return the request’s promise from the add handler so the field can report its progress and failure. Show success in the updated list, for example by highlighting the new row.
- Return the request’s promise from `@add`, and put the new names into `existing` before it settles, so the next add finds them. Give the request a timeout.
- Say in `empty` what the list holds when the default words do not fit, such as “No tags yet: type one and press Enter.”.
- Keep `v-model:query` on the text the app holds.
- Pass the error to its `UiField group`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Name the list by what it holds, such as Tags or Allowed domains.

## Why it works this way

One field that searches a UiList of UiListItem rows and adds to it. Take it when a list level holds only a list, such as a step of UiCrudDrawer.

**Layout.** It is a behavior laid over a UiList of UiListItem rows. The field is the first row of a framed card, and the rows run under it, in a UiList the field draws round the slot.

**Search.** Typing filters. The default slot gets the `query` (and the names `added` here, to put on top) and draws the matching rows, each with UiListItem `highlight`, so the typed letters show why a row was found. The row named exactly as typed, else the first match, is ready for Enter and marked with a band. Enter opens a row that is a button or a link; under plain rows it adds the text, so a name added by mistake is offered back with Undo in a toast, by the app.

**Adding.** When no name in `existing` matches the text exactly, an "Add ↵" button stands at the field's end beside the cross (a screen reader hears "Add …" with the name), and Enter adds the text. A pasted column adds every line.

**Full list.** A full list hides the field and shows a line that says so; the focus moves to that line.

**Items.** Every item goes through `useAddItems` (`split`, `fix`, `check`, `limit`, and a request that gives the text back when it fails), and a line under the field says what happened. The items leave by `@add`, as UiLog's older events come by `@more`: the handler sends them, and until the promise it returns settles a second Enter or Add sends nothing; the person can keep typing. A promise that never settles holds the field until it unmounts: give the request a timeout.

**Glyph.** The icon at the start of the field shows its state: a search icon at rest, a spinner while an item is being added, and an alert after a failure or a bad item, until the text changes. A repeat only gets the line.

**Add only.** With `search` off the field only adds: a plus replaces the search icon, Enter adds, and the list is not filtered. Take it for a short list inside a form, with every row in view.

**Value.** The list's rows are the value, and they belong to the caller: it draws them in the slot, names them in `existing` and adds to them in `@add`, after its request. Repeats and `limit` are counted from `existing`, so it holds the new names by the time the request's promise settles; a name put there later can be added twice. The component holds no list of its own, so it takes no `v-model` of one. The field's text is a draft, `v-model:query`, not a form value; it follows its model after the owner refuses a change and after a form reset. A draft refused by `check` reads as invalid to a screen reader, yet a Save around it goes: it is not the form's to fix.

**Draft.** The text goes with its level: in UiCrudDrawer, ‹ and the backdrop step up and drop it. To keep it, hold the level `persistent` while `query` is not empty: ‹ and the backdrop shake instead until the text is added or cleared. The footer's Back and the cross are the explicit ways out, and they still leave.

**Field.** Inside `UiField group` the legend names it once and says "required" once (the draft itself is never required); the field's description and error describe it. A plain UiField label points at its input, and a required one marks it `aria-required`.

**Attributes.** `disabled` blocks the field, Add and the cross. Caller attributes land on the input, and ours only where we have one. `required` and `name` would be the draft's: the browser would refuse an empty draft and post it. Leave them off; a required list is UiField's.

### Keyboard

Typing filters.
- `ArrowDown` `ArrowUp`: move the band over the matches, past the last one to "Add ↵", and round again, while the cursor stays in the field; with Shift, Alt, Ctrl or Cmd held they are the browser's.
- `Enter`: opens the row under the band, or adds the typed text when no row is there; never submits the form around it.
- `Cmd+Enter` `Ctrl+Enter`: the form's, as in any field: a record's form around the field saves, without the draft.
- `Escape`: empties the field, or clears the line under it, and stops there; on an empty field it passes to the host.
The cross and Add keep the focus in the field, from the keyboard too. When a row with the focus in it is removed, the focus moves to its neighbor; when the list fills up under the focus, the focus moves to the line that says so.

### Screen reader

- Field: named by `ariaLabel`, else by the placeholder, by a plain UiField's label or by a group's legend.
- Line under it: what happened to an item, or a full list; an alert that describes the field.
- Enter hint: a live region says what `Enter` would do: open the named row, add the typed name, or that an item is on its way.
- Buttons: "Add" is named with the typed name, and the cross has a name.
- Errors: inside UiField the description and the error describe it, and a refused item sets `aria-invalid`.

### States

At rest with a search icon (a plus with `search` off), typing with the band on the first match and "Add ↵" at the end, adding (a spinner; Enter waits, typing goes on), refused (an alert icon and the line, until the text changes), a repeat (the line only), empty (a line saying how to start), nothing matching ("Add ↵" alone), full (no field, the line says so), and disabled (the field and the cross blocked, on the plate, no Add).

### When to use another component

- A list with a toolbar and pages: UiDataTable.
- Picks from a fixed set: UiSelect `multiple`.
- One text value: UiInput.
- Rows that nobody adds here: UiListItem rows in a UiList.

## Examples

### Empty

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiListField, UiListItem } from 'grani-ui'

// A list that has nothing yet: the first name typed goes in with Enter.
const fresh = ref<string[]>([])

const freshQuery = ref('')

const freshShown = computed(() => {
  const q = freshQuery.value.trim().toLowerCase()
  return q ? fresh.value.filter((n) => n.toLowerCase().includes(q)) : fresh.value
})

const addFresh = (items: string[]) => fresh.value.push(...items)
</script>

<template>
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
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiListField, UiListItem } from 'grani-ui'

// No right to add here: the field is held, the rows still open.
const locked = ['Fruit', 'Dairy', 'Bakery']
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiListField disabled placeholder="Find or add a subcategory" :existing="locked">
      <UiListItem v-for="name in locked" :key="name" as="button" size="sm" step :title="name" />
    </UiListField>
    <p class="text-xs text-fg-muted">No right to add: the field is held, the rows still open.</p>
  </div>
</template>

```

### Invite

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { X } from '@lucide/vue'
import { UiListField, UiListItem, UiIconButton } from 'grani-ui'

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
</script>

<template>
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
</template>

```

### Cleanup

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { X } from '@lucide/vue'
import { UiListField, UiListItem, UiIconButton } from 'grani-ui'

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

interface ItemRules {
  fix: (item: string) => string
  check: (item: string) => string | undefined
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
</script>

<template>
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
</template>

```

### Limit

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { X } from '@lucide/vue'
import { UiListField, UiListItem, UiIconButton } from 'grani-ui'

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

const steps = list([
  'Call the client',
  'Send the invoice',
  'Check the payment',
  'Close the order',
  'Ask for a review',
  'Archive the chat',
])
</script>

<template>
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
</template>

```

### Options

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { X } from '@lucide/vue'
import { UiListField, UiListItem, UiIconButton } from 'grani-ui'

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

const options = list(['Small', 'Medium'])

const option = (s: string) => s.replace(/\s+/g, ' ')
</script>

<template>
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
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UiListField, UiListItem } from 'grani-ui'

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

const SIZES = ['sm', 'md'] as const

// One list per size: a tag added at sm stays there.
const sized = { sm: list(['Urgent', 'Wholesale']), md: list(['Urgent', 'Wholesale']) }
</script>

<template>
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
</template>

```

### Russian

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { X } from '@lucide/vue'
import { UiListField, UiListItem, UiIconButton } from 'grani-ui'

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

const invited = list(['anna@example.com'])
</script>

<template>
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
</template>

```

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { X } from '@lucide/vue'
import { UiField, UiListField, UiListItem, UiIconButton } from 'grani-ui'

// In a form: the field's legend names the list, and its error says what the list still needs.
const tags = ref<string[]>([])

const tagText = ref('')
</script>

<template>
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
</template>

```

## API

Props:
- `placeholder`: `string` (default `""`) — The hint in the empty field: "Find or add a subcategory". Defaults to "Find or add…".
- `ariaLabel`: `string` (default `""`) — The field's name for a screen reader; defaults to the placeholder.
- `empty`: `string` (default `""`) — The line of an empty list; defaults to "Nothing here yet: type a name and press Enter".
- `search`: `boolean` (default `true`) — Typing filters the list and Enter opens the first match. Off, the field only adds: a short list inside a form, where every row is in view.
- `existing`: `string[]` (default `[]`) — The names in the list: an exact one, in any case, is found, not offered again.
- `split`: `"lines" | "lists"` = `lines | lists` (default `"lines"`) — `lines`: a pasted list splits by line. `lists`: also by commas and semicolons, typed or pasted.
- `fix`: `((item: string) => string)` — Tidies an item on its way in: `(s) => s.toLowerCase()`. A change is named under the field.
- `check`: `((item: string) => string | undefined)` — Why an item cannot be, in the product's words, or nothing when it can.
- `limit`: `number` — The most the list holds, counted from `existing`: full, the field is gone.
- `onAdd`: `((items: string[]) => unknown)` — “Add …”, Enter or a pasted list (`@add`): the items, tidied, checked, without repeats. Return the request's promise to hold the field; a rejection gives the text back. Nothing returned, the field is not held. Put the new names into `existing` before the promise settles: repeats and `limit` are counted from it.
- `disabled`: `boolean` (default `false`) — Nothing can be typed, added or cleared: the field, Add and the cross are held, on the disabled plate.
- `id`: `string` — Own id of the input when standalone. Inside UiField the field's id takes precedence.
- `size`: `ControlSize` = `xs | sm | md` — Step of the field's row, as a list row's: 44 px at `xs` and `sm`, 56 at `md`. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `query`: `string` (default `""`) — The text in the field (`v-model:query`): what the list is filtered by, and what “Add …” adds.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:query` (`value: string`) — The new value of `query`, for `v-model:query`.
- `taken` (`name: string`) — A repeat was refused: the name as the list has it, to point at its row.

Slots:
- `default` with `{ query: string; added: string[]; }` — The rows that match `query`, UiListItem with `highlight`; `added` are the names added here, newest first, to put on top.

## How it behaves

### Text back

- When: Adding a typed entry fails.
- Props: `@add` returning the request's promise.
- Guarantee: While the request runs, a second Enter or Add sends nothing, the field shows a spinner, a screen reader announces “Adding…”, and you can keep typing. If the request fails, or the handler throws, the text returns to the field with a line saying it could not be added and that Enter tries again. If you typed something new while the request ran, that text stays instead, and the line only says what could not be added.
- Without it: The field empties as soon as you press Enter; if the request then fails, the text is gone and you type it again.
- Code: `<UiListField :existing="emails" @add="invite" />`
- Your part: Return the request's promise from `@add`, and let it reject when the request fails; a handler that throws counts as a failure too.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a request says Adding… with a spinner; a failure gives the text back with a line", "an onAdd that throws gives the text back with a line", "typing goes on while the add is on its way, and the next Enter sends it", "a line that says Enter tries again is true: after a failure the field holds the failed text", "a pasted list that fails does not say Enter tries again over an empty field", "a list waiting behind a failing add: the failure is still said, the failed text is back (draft bound)"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#text-back

### Refusal named

- When: An item fails its `check`.
- Props: `check`.
- Guarantee: The rejected item stays in the field to be corrected, with the reason from `check` on the line under it, which a screen reader announces. The valid items entered together with it are added.
- Without it: A rejected entry disappears without a word, and you have to type it again.
- Code: `<UiListField :check="isEmail" … />`
- Your part: Return a clear correction from `check`, such as “Enter a complete email address, including the domain.”
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "check refuses with the reason and the text stays", "split, fix and check go the same way: a list typed with commas, tidied, the bad one kept"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#refused-by-name

### No duplicates

- When: An item is already in the list.
- Props: `existing`, `@taken`.
- Guarantee: A name is a duplicate when it matches a complete name in `existing`, ignoring capitalization: “Fruit” matches “fruit”, but “Fru” is a different entry. A duplicate is skipped and identified below the field, and `@taken` reports the existing name so the app can highlight its row. A name repeated within one paste is handled the same way.
- Without it: A duplicate is either dropped without a word or added a second time.
- Code: `<UiListField :existing="names" @taken="light" … />`
- Your part: List the current names in `existing`, and highlight the row that `@taken` names. Put a new name into `existing` before the promise `@add` returned settles: one put there later can be added twice.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a pasted column adds every line, repeats pointed at", "Enter adds even when a row holds the same letters; a repeat is refused with a line", "a repeat inside one paste is pointed at, not dropped without a word"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#no-twice

### Up to the limit

- When: The list has a `limit`.
- Props: `limit`.
- Guarantee: Only as many entries as still fit are added, and you can see how much of a pasted list was accepted. A full list replaces its input with a message such as “Limit reached: 3 items” or “Could not add 1 item: this list allows up to 3.” If the input had keyboard focus, focus moves to the message.
- Without it: The list takes an eleventh entry when ten are allowed, and the error appears only when the form is saved.
- Code: `<UiListField :limit="10" … />`
- Your part: Set `limit`. It is counted against the names in `existing`, so keep `existing` up to date.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a limit fits a paste into what is left; full, the field is gone and says what did not fit", "reaching the limit one item at a time says the list is full and hands it the focus", "a list that fills while a line stands says it is full, as well as what the line said"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#nearly-full

### Paste many

- When: A column of values is pasted into the field, or entries are typed.
- Props: none; `split`, `fix` and `check` decide what a list is, how an entry is tidied and what passes.
- Guarantee: Typed or pasted, every entry goes the same way: split with `split`, trimmed, normalized with `fix`, then validated with `check`. The accepted lines of a paste reach `@add` together, while duplicates are skipped and identified in a message below the field. A column pasted while an add is on its way waits for it, then goes in as a list; when that add fails, its line and its text stay.
- Without it: A single-line field drops the line breaks, so three pasted addresses run together into one entry that nobody can mail.
- Code: `<UiListField :existing="emails" @add="invite" />`
- Your part: Nothing extra: `@add` receives the pasted items as one array, as it does a typed item. Set `split` to decide whether commas and semicolons separate items too, `fix` for what can be corrected automatically, such as letter case, and `check` for what cannot.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a pasted column adds every line, repeats pointed at", "split, fix and check go the same way: a list typed with commas, tidied, the bad one kept", "a column pasted while an add is on its way is not swallowed: it waits and goes in as a list", "a list waiting behind an add is not sent after the field was disabled"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#paste-many

### Outcome shown

- When: an item is added, refused or fails.
- Props: none.
- Guarantee: While an entry is being added, the field shows progress and a screen reader announces “Adding…”. Validation errors explain what to correct. A failed request restores the text and explains how to retry. Error messages appear below the field and are announced as alerts.
- Without it: The field changes without a word, and you cannot tell whether the item was added.
- Code: `<UiListField … />`
- Your part: Return the request’s promise from the add handler so the field can report its progress and failure. Show success in the updated list, for example by highlighting the new row.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a request says Adding… with a spinner; a failure gives the text back with a line"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: an item is being added.
- Props: `@add` returning a promise.
- Guarantee: While the add is on its way, a second Enter or Add sends nothing. You can keep typing, and the text waits for your next Enter.
- Without it: An impatient second Enter sends the same item twice.
- Code: `<UiListField :existing="emails" @add="invite" />`
- Your part: Return the request’s promise from `@add`, and put the new names into `existing` before it settles, so the next add finds them. Give the request a timeout.
- Not covered: A promise that never settles holds the field until it unmounts: Escape and `disabled` do not let it go.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "pressing Enter twice while the add is on its way sends once", "typing goes on while the add is on its way, and the next Enter sends it"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Way forward

- When: the list is empty, or nothing matches the typed text.
- Props: `empty` for the words of an empty list.
- Guarantee: An empty list says how to start: “Nothing here yet: type a name and press Enter.” A search that finds nothing offers to add what was typed, with Add ↵ at the end of the field and Enter.
- Without it: An empty card under a field, with no word on what to type or that Enter adds.
- Code: `<UiListField :existing="tags" empty="No tags yet: type one and press Enter." @add="addTags" />`
- Your part: Say in `empty` what the list holds when the default words do not fit, such as “No tags yet: type one and press Enter.”
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "an empty list says how to start; a query or a list hides the line", "an empty list counts nothing and offers the name right after it", "a search that finds nothing offers to add what was typed"
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step

### Back to the value

- When: the app refuses a change to the text in the field.
- Props: `v-model:query`.
- Guarantee: The field shows the text as the app holds it, after a refused change and after a form reset.
- Without it: The field shows text the app did not accept.
- Code: `<UiListField v-model:query="draft" … />`
- Your part: Keep `v-model:query` on the text the app holds.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "a change the parent refuses puts the input back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Words in the making

- When: an entry is typed through an input method.
- Props: none: every UiListField.
- Guarantee: The Enter that picks the word adds nothing; the entry is added by the Enter after it.
- Without it: Half a word added to the list, and the rest of it typed as a second entry.
- Code: `<UiListField :existing="tags" @add="addTags" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "the Enter that confirms an IME composition adds nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#word-as-composed

### Search clears

- When: the field has text.
- Props: none.
- Guarantee: The cross empties the field and keeps keyboard focus in it, from the keyboard too. Escape empties it as well, or clears the line under it, and goes no further, so a drawer around the list stays open; on an empty field Escape reaches the drawer.
- Without it: Escape in the field closes the whole drawer instead of clearing what you typed.
- Code: `<UiListField :existing="tags" @add="addTags" />`
- Your part: Nothing. Do not add a clear button of your own.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "Escape empties the field and stays; empty, it goes on to the host", "no line of keys under the list; the cross empties the field", "the cross and Add, pressed by keyboard, keep the focus in the field", "Escape with only a line under the field clears the line and stops there"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Focus on the error

- When: a form is sent with this list in error.
- Props: the error of its `UiField group`.
- Guarantee: When this is the first field with an error, focus moves to its input so you can correct or add an entry immediately. The input uses the enclosing field’s id and error message.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Tags" group :error="err"><UiListField … /></UiField>`
- Your part: Pass the error to its `UiField group`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Not covered: A draft refused by `check` is not the form’s error: it reads as invalid to a screen reader, yet Save sends, and the focus stays on Save.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "inside UiField the input takes the field id and invalid, and focusInvalid lands on it", "a refused draft is not the form’s refusal: Save sends once, the focus stays on Save"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Cleared in place

- When: The × or Add is pressed.
- Props: none.
- Guarantee: Both × and Add keep keyboard focus in the input, including when activated from the keyboard, so you can clear the text or add an entry and type the next one immediately.
- Without it: After clearing or adding, keyboard focus is lost, and you go back to the field to type the next entry.
- Code: `<UiListField … />`
- Your part: Nothing.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "the cross and Add, pressed by keyboard, keep the focus in the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cleared-in-place

### Enter picks

- When: The list field stands in a form, such as a drawer’s.
- Props: none.
- Guarantee: Enter opens the row under the band, or adds the typed text when no row is there, and never submits the form around it. The band starts on the row named exactly as typed, else on the first match, so “fruit” opens Fruit, not Fruit juice above it.
- Without it: Enter, meant to add a tag, saves the half-filled record.
- Code: `<form><UiListField :existing="tags" @add="addTags" /></form>`
- Your part: Nothing.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "in a form Enter opens the row under the band or adds the text, and the form is not sent", "rows that arrive after the query still take the band: Enter opens the first match, adds nothing", "the band starts on the row named exactly as typed: “fruit” opens Fruit, not Fruit juice above it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-picks

### Shortcuts kept

- When: the field has keyboard focus.
- Props: none.
- Guarantee: ArrowUp and ArrowDown alone move the band over the matches; with Shift held they select text, and with Alt, Ctrl or Cmd held the browser moves the text cursor. Cmd+Enter or Ctrl+Enter adds nothing: it reaches the form around the list, so a drawer saves.
- Without it: Cmd+Enter, meant to save the drawer, adds the half-typed name to the list instead.
- Code: `<UiListField :existing="tags" @add="addTags" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "with Shift, Alt, Ctrl or Cmd an arrow is the browser’s, as in any text field: the band stays", "Cmd or Ctrl with Enter is the form’s: nothing is added and the key goes on"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

### Focus stays near

- When: A row is removed from the keyboard.
- Props: none: every UiListField.
- Guarantee: After you remove an entry, keyboard focus moves to the remove button of the next row, or of the previous row if there is none, and to the input when no entries remain, so you can remove several without finding the button each time. Adding with Enter clears the input and keeps focus there for the next entry.
- Without it: Keyboard focus is lost with the removed row, and you have to find the list again.
- Code: `<UiListField :search="false" placeholder="Add an email…" @add="add">
  <UiListItem v-for="name in emails" :key="name" :title="name" />
</UiListField>`
- Your part: Nothing.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "Enter adds what is offered, empties the field and keeps the focus", "removing a row puts the focus on its neighbor", "the rows change in place (splice): the removed row’s neighbor takes the focus", "when the list has room again, a focus on the line that said it was full goes back into the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays

### One name

- When: it sits inside a UiField with `group`.
- Props: `ariaLabel`, the placeholder, or the legend.
- Guarantee: The input is named once, by the field's legend or by its own `ariaLabel`, and the field's error is announced as its description.
- Without it: An input announced with two names, or only by its placeholder.
- Code: `<UiField label="Tags" group><UiListField … /></UiField>`
- Your part: Name the list by what it holds, such as Tags or Allowed domains.
- Proof, in the repository's tests (UiListField.spec.ts, not in the package): "inside UiField group the input is named by the legend and described by the error"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useAddItems`, `useUiT`, `useControlSize`.
