# No data (`UiNoData`)

> Understand why an area is empty and what you can do next.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/no-data

Also called empty state, no results, placeholder message.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [Card](https://grani.arseni.work/components/card).

## Use

```vue
<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { UiNoData, UiButton } from 'grani-ui'
</script>

<template>
  <UiNoData
    title="No metrics yet"
    description="Add the first one and its chart starts from today."
  >
    <template #media><Inbox /></template>
    <template #actions>
      <UiButton>Add a metric</UiButton>
    </template>
  </UiNoData>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Give every empty list a way forward.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Explain the cause and offer a useful action: Create when there are no records, Reset when filters hide them, or Retry with `tone="danger"` when loading fails. UiTable, UiDataTable and UiLog include this message component in their own states.

## Why it works this way

An empty place that says why and offers the next step. Take it where a list, a table or a section has nothing to show. Nothing yet: create; nothing matches: change the filters; the load failed: retry (`tone="danger"`, read out as an alert).

**Anatomy.** A glyph in `#media` on a round plate in the tone, a short `title`, the `description`, and the next step in `#actions` (UiButton of your own: you choose the weight and `loading`).

**Frame.** On a page it has a dashed frame; in a card (UiCard `#empty`), a drawer or a window, the surface frames it. The root is a `<div role="status">`.

### Keyboard

Not interactive: the block takes no focus; the buttons in `#actions` are the tab stops.

### Screen reader

- Role: a `status`; `tone="danger"` is an `alert`, read at once. The block appears with its words, and a status that appears with its words is often not read out: that a list is empty is said by a region that was on the page before (UiTable has one), and a page of your own keeps one.
- Order: the title, then the description.
- Glyph: the glyph on its plate is hidden.

### States

Nothing yet, with a `primary` button to create the first one; nothing matches, with a `secondary` button to reset the filters; the load failed, `danger`, a red plate with a warning glyph and Retry. `sm` in a drawer or a card, `md` on a page. A dashed frame on a page, none inside a card, a drawer or a window. A neutral one without a glyph draws no plate.

### When to use another component

- Content on its way: UiSkeleton.
- An action in flight: UiSpinner.
- A notice over content that is there: UiListItem in a `tone`.
- A failed request: a toast through UiToaster.

## Examples

### Nothing matches

```vue
<script setup lang="ts">
import { SearchX } from '@lucide/vue'
import { UiNoData, UiButton } from 'grani-ui'
</script>

<template>
  <UiNoData
    title="Nothing matches"
    description="No invoice is both paid and from the kiosk. Change the filters or reset them."
  >
    <template #media><SearchX /></template>
    <template #actions>
      <UiButton variant="secondary">Reset the filters</UiButton>
    </template>
  </UiNoData>
</template>

```

### The load failed

```vue
<script setup lang="ts">
import { UiNoData, UiButton } from 'grani-ui'
</script>

<template>
  <UiNoData
    tone="danger"
    title="The list did not load"
    description="The server did not answer. Check the connection and try again."
  >
    <template #actions>
      <UiButton variant="secondary">Retry</UiButton>
    </template>
  </UiNoData>
</template>

```

### Section in a drawer

```vue
<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { UiNoData } from 'grani-ui'
</script>

<template>
  <UiNoData size="sm" description="Add items and the total will follow.">
    <template #media><Plus /></template>
  </UiNoData>
</template>

```

### In a card

```vue
<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { UiCard, UiNoData } from 'grani-ui'
</script>

<template>
  <UiCard title="Payments" empty class="w-full max-w-sm">
    <template #empty>
      <UiNoData
        size="sm"
        title="No payments yet"
        description="The first one appears here once an invoice is paid."
      >
        <template #media><Inbox /></template>
      </UiNoData>
    </template>
  </UiCard>
</template>

```

### Without a glyph

```vue
<script setup lang="ts">
import { UiNoData } from 'grani-ui'
</script>

<template>
  <UiNoData title="No notes" description="Nobody has written about this client yet." />
</template>

```

## API

Props:
- `title`: `string` (default `""`) — One short line of what happened: "No invoices yet", "The record did not load".
- `description`: `string` (required) — Why it is empty and what to do next.
- `tone`: `"neutral" | "danger"` = `neutral | danger` (default `"neutral"`) — `danger` for a load that failed: a red plate and an alert; its Retry is a `secondary` UiButton in `#actions`.
- `size`: `"sm" | "md"` = `sm | md` (default `"md"`) — `md` for a page, `sm` for a section inside a drawer or a card.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `media` with `Record<string, never>` — The glyph on the plate, as a row's `#media`; `danger` draws a warning sign when it is empty.
- `actions` with `Record<string, never>` — The next step, a UiButton of your own or two: `primary` to create the first one, `secondary` to reset the filters or retry, with `loading` when it sends.

## How it behaves

### Way forward

- When: a list, a table or a section has nothing to show.
- Props: `title` and `description` for the cause, the step in `#actions`; `tone="danger"` for a failed load.
- Guarantee: The message explains the cause through `title` and `description`, with the actions from `#actions` below it. With `tone="danger"`, it shows a warning icon on a red background and is announced immediately by a screen reader.
- Without it: A blank area or “No data” message gives no explanation or next step.
- Code: `<UiNoData title="Nothing matches" description="Change the filters or reset them."><template #actions><UiButton variant="secondary" @click="reset">Reset the filters</UiButton></template></UiNoData>`
- Your part: Explain the cause and offer a useful action: Create when there are no records, Reset when filters hide them, or Retry with `tone="danger"` when loading fails. UiTable, UiDataTable and UiLog include this message component in their own states.
- Not covered: It does not tell the causes apart by itself; only the app knows why the list is empty.
- Proof, in the repository's tests (UiNoData.spec.ts, not in the package): "It holds the next step: a button of your own, with its own weight.", "the next step comes after the title and the description", "A failed load is said at once, on a red plate with a warning glyph."
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step


The patterns: https://grani.arseni.work/patterns
