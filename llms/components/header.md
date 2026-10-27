# Header (`UiHeader`)

> Introduce a page or section with a title, a short explanation and the actions available there.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/header

Also called page header, section header, title bar.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { UiStack, UiHeader, UiButton, UiCard, UiList, UiListItem } from 'grani-ui'
</script>

<template>
  <UiStack gap="title" class="w-full max-w-2xl">
    <UiHeader title="Users" description="Who can sign in to the workspace.">
      <template #actions>
        <UiButton><Plus aria-hidden="true" />Invite</UiButton>
      </template>
    </UiHeader>
    <UiCard :padded="false">
      <UiList>
        <UiListItem title="Anna Petrova" description="anna@work" />
        <UiListItem title="Ivan Sidorov" description="ivan@work" />
      </UiList>
    </UiCard>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

The name of a page (`page`) or of a section (`legend`). Take `page` once at the top of a page, `legend` over each part of a long form or a card.

**Page.** `page` is the `h1` at the top of UiAppShell's main area, with one line under it and the actions on the right, centered vertically on the title and its line together, as in UiListItem. It does not go inside a card, a modal or a drawer, which name themselves.

**Legend.** `legend` is a small title in capitals on a line, like a fieldset's legend, beside the fields or rows it names. In a surface, the line runs to its edges and the title sits on the gutter, where the fields start. In a body that runs edge to edge, it sits on its rows' text, with 16 above it when it comes first. First in a UiCrudDrawer section with `:divided="false"`, it stands in for the section's title. Under the title of a window, a drawer or a card, it is one level deeper (`h3` under their `h2`).

**Spacing.** A page header has no margin of its own: it and the page's content stand in a UiStack, `gap="title"`, 24 apart. A legend after other content opens a new section, so it adds 32px above itself. On top of the 16 gap of a `flex` or `grid` column, that puts it 48 below the content above, the step between blocks.

### Keyboard

Not interactive: the title takes no focus.
- `Tab`: reaches the controls in `#actions`, which keep their own tab stops, after the title in the reading order; a legend holds none.

### Screen reader

- Page: `page` is the one `h1` of the page, and its description is a paragraph under it.
- Legend: `legend` is a heading whose level follows its place: `h2` alone, the card's level in an untitled card, one level deeper under the title of a card, a window or a drawer.
- Lines: borders that say nothing.

### States

None of its own: a long title wraps, and the line keeps a stub beside it. In dev, a `page` header inside a card, a modal or a drawer warns, and a `legend` with a description or an action warns and drops them.

### When to use another component

- The title of a card, a window or a drawer: UiCard, UiModal or UiDrawer carry it themselves (`title`).
- The name of a field: UiField.
- A strip of tabs over a block: UiTabs.
- A row with a thing at its end: UiListItem.

## Examples

### Legend

```vue
<script setup lang="ts">
import { UiCard, UiStack, UiHeader, UiField, UiInput } from 'grani-ui'
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiStack>
      <UiHeader variant="legend" title="Contact" />
      <UiField label="Email"><UiInput model-value="hello@example.com" /></UiField>
      <UiField label="Phone"><UiInput model-value="+1 415 555 0142" /></UiField>
      <UiHeader variant="legend" title="Billing" />
      <UiField label="Billing email"><UiInput model-value="billing@example.com" /></UiField>
    </UiStack>
  </UiCard>
</template>

```

### Card

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiStack, UiHeader, UiField, UiInput, UiSwitch } from 'grani-ui'

const digest = ref(true)

const mentions = ref(false)
</script>

<template>
  <UiCard
    title="Account"
    description="How we reach you and what we send."
    class="w-full max-w-md"
  >
    <UiStack>
      <UiHeader variant="legend" title="Contact" />
      <UiField label="Email"><UiInput model-value="hello@example.com" /></UiField>
      <UiField label="Phone"><UiInput model-value="+1 415 555 0142" /></UiField>
      <UiHeader variant="legend" title="Notifications" />
      <UiSwitch v-model="digest">Email digest every Monday</UiSwitch>
      <UiSwitch v-model="mentions">Mentions in comments</UiSwitch>
    </UiStack>
  </UiCard>
</template>

```

### Long

```vue
<script setup lang="ts">
import { UiHeader, UiButton } from 'grani-ui'
</script>

<template>
  <div class="w-full max-w-md">
    <UiHeader
      title="Quarterly reconciliation of supplier invoices"
      description="Every open invoice against its payment, by supplier."
    >
      <template #actions>
        <UiButton variant="outline">Export</UiButton>
      </template>
    </UiHeader>
  </div>
</template>

```

## API

Props:
- `title`: `string` (required) — The name: the page's `h1`, or the section's title on its line.
- `description`: `string` (default `""`) — One line under a page's title. A list page has none: the title names the list. A legend has none.
- `variant`: `"legend" | "page"` = `legend | page` (default `"page"`) — `page` is the first line of a page; `legend` names a section on the line above it.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `actions` with `Record<string, never>` — Actions of the page, right of the title: a primary button, a menu. A legend holds none.
