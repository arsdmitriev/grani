# List (`UiList`)

> Present related rows in a card, separated by lines so each item is easy to distinguish.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/list

Also called list group, stack of rows.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem, UiAvatar, UiBadge } from 'grani-ui'
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem title="Anna Petrova" description="anna@work">
        <template #media><UiAvatar name="Anna Petrova" /></template>
        <template #actions><UiBadge tone="success" label="Owner" /></template>
      </UiListItem>
      <UiListItem title="Ivan Sidorov" description="ivan@work">
        <template #media><UiAvatar name="Ivan Sidorov" /></template>
        <template #actions><UiBadge label="Editor" /></template>
      </UiListItem>
      <UiListItem title="Lena Morozova" description="lena@work">
        <template #media><UiAvatar name="Lena Morozova" /></template>
        <template #actions><UiBadge label="Viewer" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

Rows one under another, divided by lines. Take it around UiListItem rows wherever they stand in a column; a card of rows is UiCard `:padded="false"` around a UiList.

**Lines.** The list divides its rows: a line stands above every row that follows a row, or the block a row opened (UiReveal), drawn over the row's own air, so a row is one height wherever it stands. A notice is a row too, with the lines of any row; a framed row (`outline`, `muted`) stands alone, with no line above it or after it.

**Edges.** In a surface with a gutter (a padded card, a window, a drawer's section) the list runs its rows edge to edge, through the gutter, and their text stays on it. Standing first or last in a drawer's section, its own child and not inside a block of the section's, it reaches the section's line: the section says which of its children is first and last, so a section of rows alone is a list between two lines, and a list wrapped in a block after a paragraph keeps its place. Last in a padded card's body, the card drops its bottom gutter under it. In a card without padding the rows keep the card's inset.

**Items.** Every child is an item of the list: a row, a UiReveal with its row and its block, a notice. A notice stands among the rows as a row of the list, not as the card it is alone: the rows' edges, height and lines, its tone a 3px edge at the start along the whole row, clipped by the card's corners when it comes first or last; `variant="soft"` on it fills the row with its tone's pale plate as well. A child that is not a row (a separator, a plain block) stands as an item too, with no line above or after it.

### Keyboard

Nothing of its own: a link or a command row is a tab stop, a label row reaches its control, a plain row takes no focus.

### Screen reader

- List: `role="list"`, kept where a style drops a list's semantics, each child a list item, so a screen reader says how many rows there are and which one it is on.

### States

Rows of plain text, links, fields and commands; a notice among them, plain or `soft`; a long list in a card; a list at the top or the bottom of a drawer's section, line to line; on a narrow screen the rows wrap their text and keep their actions beside it.

### When to use another component

- A list in a panel: the panel draws it itself, as a UiSelect or a UiMenu does.
- A table of columns: UiTable.
- A list that grows from its last row: UiListField over a UiList.

## Examples

### Mixed

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Trash2 } from '@lucide/vue'
import { UiCard, UiList, UiListItem, UiBadge, UiSwitch } from 'grani-ui'

const reminders = ref(true)

const done = ref('')
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem title="Plan" description="Team, 12 seats">
        <template #actions><UiBadge label="Monthly" /></template>
      </UiListItem>
      <UiListItem
        to="/components/list-item"
        title="Invoices"
        description="All invoices of the account."
      >
        <template #media><FileText aria-hidden="true" /></template>
      </UiListItem>
      <UiListItem as="label" title="Send reminders" description="Before an invoice is due.">
        <template #actions><UiSwitch v-model="reminders" /></template>
      </UiListItem>
      <UiListItem as="button" step title="Payments" @click="done = 'payments'">
        <template #actions><span class="text-sm text-fg-muted">3</span></template>
      </UiListItem>
      <UiListItem as="button" title="Delete the account" tone="danger" @click="done = 'delete'">
        <template #actions><Trash2 aria-hidden="true" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
  <p v-if="done" class="text-xs text-fg-muted">pressed: {{ done }}</p>
</template>

```

### Padded

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiStack, UiField, UiInput, UiButton, UiList, UiListItem, UiAvatar, UiBadge } from 'grani-ui'

const invite = ref('')
</script>

<template>
  <UiCard title="Team" description="Who can open the account." class="w-full max-w-md">
    <UiStack>
      <UiField label="Invite by email">
        <UiStack direction="row" gap="tight">
          <UiInput v-model="invite" placeholder="name@company.example" class="flex-1" />
          <UiButton variant="outline">Invite</UiButton>
        </UiStack>
      </UiField>
      <UiList>
        <UiListItem title="Anna Petrova" description="anna@work">
          <template #media><UiAvatar name="Anna Petrova" /></template>
          <template #actions><UiBadge tone="success" label="Owner" /></template>
        </UiListItem>
        <UiListItem title="Ivan Sidorov" description="ivan@work">
          <template #media><UiAvatar name="Ivan Sidorov" /></template>
          <template #actions><UiBadge label="Editor" /></template>
        </UiListItem>
      </UiList>
    </UiStack>
  </UiCard>
</template>

```

### Notice

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiCard, UiList, UiListItem, UiButton, UiRadioGroup, UiRadio } from 'grani-ui'

const fill = ref<'plain' | 'soft'>('plain')
</script>

<template>
  <UiStack gap="title" align="center" class="w-full">
    <UiCard :padded="false" class="w-full max-w-md">
      <UiList>
        <UiListItem title="Rate" description="1.08 USD for 1 EUR" />
        <UiListItem
          tone="warning"
          :variant="fill"
          title="Rate missing"
          description="Add the June rate to compute the cost in the base currency."
        >
          <template #actions><UiButton variant="outline" size="xs">Add rate</UiButton></template>
        </UiListItem>
        <UiListItem title="Base currency" description="EUR" />
      </UiList>
    </UiCard>
    <UiRadioGroup v-model="fill" variant="segmented" aria-label="How the notice is drawn">
      <UiRadio value="plain">Edge</UiRadio>
      <UiRadio value="soft">Filled</UiRadio>
    </UiRadioGroup>
  </UiStack>
</template>

```

### Long

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem } from 'grani-ui'

const invoices = Array.from({ length: 12 }, (_, i) => ({
  number: `INV-${String(1041 + i).padStart(4, '0')}`,
  client: ['Acme Corp', 'Birch & Co', 'Northwind Traders', 'Lumen Studio'][i % 4]!,
  amount: `${(120 + i * 37.5).toFixed(2)} EUR`,
}))
</script>

<template>
  <UiCard :padded="false" title="Invoices" class="w-full max-w-md">
    <UiList>
      <UiListItem
        v-for="inv in invoices"
        :key="inv.number"
        size="sm"
        :title="inv.number"
        :description="inv.client"
      >
        <template #actions>
          <span class="text-sm tabular-nums text-fg">{{ inv.amount }}</span>
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Narrow

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiCard, UiList, UiListItem, UiBadge, UiSwitch, UiRadioGroup, UiRadio } from 'grani-ui'

const digest = ref(false)

const width = ref<'narrow' | 'wide'>('narrow')
</script>

<template>
  <UiStack gap="title" align="center" class="w-full">
    <!-- The same rows at a phone's width and a wide one: the text wraps, the actions stay beside it. -->
    <UiCard :padded="false" :class="width === 'narrow' ? 'w-72' : 'w-full max-w-md'">
      <UiList>
        <UiListItem
          title="A client with a name long enough to wrap"
          description="anna.petrova.with.a.long.address@company.example"
        >
          <template #actions><UiBadge label="Invited" /></template>
        </UiListItem>
        <UiListItem as="label" title="Weekly digest" description="A summary every Monday.">
          <template #actions><UiSwitch v-model="digest" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiRadioGroup v-model="width" variant="segmented" aria-label="Width of the card">
      <UiRadio value="narrow">Narrow</UiRadio>
      <UiRadio value="wide">Wide</UiRadio>
    </UiRadioGroup>
  </UiStack>
</template>

```

## API

Slots:
- `default` with `Record<string, never>` — The rows: UiListItem, a UiReveal around one, a notice. Each child is one item of the list.
