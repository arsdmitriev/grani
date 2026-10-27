# Badge (`UiBadge`)

> Add a short status or tag beside an item, such as “Draft” or “Paid”.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/badge

Also called chip, tag, pill, status label.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge tone="neutral">Category</UiBadge>
  <UiBadge tone="brand">New</UiBadge>
  <UiBadge tone="success">Active</UiBadge>
  <UiBadge tone="warning">Under review</UiBadge>
  <UiBadge tone="danger">Blocked</UiBadge>
  <UiBadge tone="info">In progress</UiBadge>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- See where the app is working.
- Name states in words, not color alone.
- Read the full text when a label is shortened.
- Remove selected tags with the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Remove the badge on `remove`, and move keyboard focus elsewhere, since the badge disappears.
- Set `loading` while the work runs and give words for it. When it must be announced, add a live region of your own.
- Give every badge its word, such as Paid or Overdue, and use the same word for the same state everywhere.
- Remove the item in `@remove`. When the label alone does not say what is removed, name it with `removeLabel`.

## Why it works this way

A short word for a state or a tag. Take it for a status in a row, a tag you picked or a state in a card's head, in one of three forms; a number is UiCount.

**Forms.** `tone` is the meaning and `variant` the form: `soft` is a pale pill, `inline` a dot with text for a table row, `outline` a pale plate with a border. `size` `sm` makes every form compact.

**Loading.** `loading` puts a spinner where the dot or the icon stands and sets `aria-busy` on the root, and the text says what is happening ("Syncing"). The spinner is 14px with a heavier stroke, since at 12px the ring breaks into pixels. It is seen, not heard: a host that must announce it puts the words in its own live region.

**Remove.** `removable` adds a close button in the plate's own ink and corner, the one interactive part, with a 24px touch target. A double click fires it only once, and it works again after 500 ms (for example, after a canceled confirm), but not while a `loading` the host set from the click is running. The badge unmounts on remove, so the host moves the focus.

**Long labels.** A long label is cut the way UiTruncate cuts it, with the whole text in a tooltip; a slot handles its own cut. The text is its name: a badge without text is a bare color.

**Placement.** It sits in a table's status column, in UiLog's changed value, as UiSelect's picked tags, under UiDelta, and in the `#actions` of UiCard, the `#actions` of UiListItem and a drawer's `#status`. The root is a `<span>`.

### Keyboard

Not interactive: the badge takes no focus. `removable` adds the one tab stop, the cross, a native button:
- `Tab`: reaches the cross.
- `Enter` `Space`: press the cross.
It fires `remove` once per double click, and the host moves the focus, since the badge unmounts.

### Screen reader

- Name: the text; the dot, the icon and the spinner are hidden.
- Loading: says busy (`aria-busy`), and the text says what is happening.
- Cross: named "Remove" with the label: the words on screen when the slot gives them, or `removeLabel`.
- Cut label: keeps the whole text in a tooltip.
- No text: a badge without text is a bare color and warns in dev.

### States

Six tones in three forms, `soft`, `inline` and `outline`, at `sm` and `md`; `dot` before the text; `loading`, the spinner where the dot or the icon stands; `removable`, the cross, with its hover plate only when enabled; a long label cut with an ellipsis.

### When to use another component

- A number: UiCount.
- A change against the value before: UiDelta.
- A mark on the corner of an icon or an avatar: UiIndicator.
- A notice with words and an action: UiListItem in a `tone`.

## Examples

### Dot

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge tone="success" dot>Online</UiBadge>
  <UiBadge tone="neutral" dot>Offline</UiBadge>
  <UiBadge tone="warning" dot>Attention</UiBadge>
  <UiBadge tone="danger" dot>Blocked</UiBadge>
  <UiBadge tone="info" dot>Syncing</UiBadge>
</template>

```

### Inline

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge variant="inline" tone="success" label="Delivered" />
  <UiBadge variant="inline" tone="danger" label="Canceled" />
  <UiBadge variant="inline" size="sm" tone="neutral" label="Draft" />
</template>

```

### Outline

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge variant="outline" tone="neutral" label="Guest" />
  <UiBadge variant="outline" tone="brand" label="Owner" />
  <UiBadge variant="outline" tone="success" label="Verified" />
  <UiBadge variant="outline" tone="warning" label="Pending" />
  <UiBadge variant="outline" tone="danger" label="Failed" />
  <UiBadge variant="outline" tone="info" label="Admin" />
</template>

```

### Long label

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <!-- Hover the badge: the whole label is in the tooltip. -->
  <div class="w-40">
    <UiBadge tone="info" dot label="Waiting for the second signature on the contract" />
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge tone="success" size="sm" label="Paid" />
  <UiBadge tone="success" label="Paid" />
  <UiBadge variant="outline" tone="info" size="sm" label="Admin" />
  <UiBadge variant="outline" tone="info" label="Admin" />
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiBadge, UiRadioGroup, UiRadio } from 'grani-ui'

const badgeState = ref('loading')
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiBadge tone="info" :loading="badgeState === 'loading'" label="Syncing" />
      <UiBadge variant="inline" :loading="badgeState === 'loading'" label="Importing 3 of 12" />
      <UiBadge variant="outline" :loading="badgeState === 'loading'" label="Building" />
    </div>
    <UiRadioGroup v-model="badgeState" variant="segmented" aria-label="State of the badges">
      <UiRadio value="idle">Idle</UiRadio>
      <UiRadio value="loading">Loading</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Removable

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { BadgeVariant, Tone } from 'grani-ui'
import { UiBadge, UiButton } from 'grani-ui'

interface Filter {
  label: string
  tone?: Tone
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

// The host owns the list: it drops the badge on `remove` and moves the focus, as UiSelect does.
const FILTERS: Filter[] = [
  { label: 'Status: Active' },
  { label: 'Tag: Section A', tone: 'info' },
  { label: 'Guest', variant: 'outline' },
  { label: 'Lisbon', size: 'sm' },
]

const filters = ref([...FILTERS])

const remove = (f: Filter) => (filters.value = filters.value.filter((x) => x !== f))

const reset = () => (filters.value = [...FILTERS])
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <ul class="flex flex-wrap items-center gap-2" aria-label="Applied filters">
      <li v-for="f in filters" :key="f.label" class="flex">
        <UiBadge
          :variant="f.variant"
          :size="f.size"
          :tone="f.tone"
          :label="f.label"
          removable
          @remove="remove(f)"
        />
      </li>
    </ul>
    <UiButton v-if="filters.length < FILTERS.length" variant="outline" size="xs" @click="reset">
      Bring them back
    </UiButton>
  </div>
</template>

```

### Icon

```vue
<script setup lang="ts">
import { Check } from '@lucide/vue'
import { UiBadge } from 'grani-ui'
</script>

<template>
  <UiBadge tone="info">
    <template #icon>
      <Check aria-hidden="true" />
    </template>
    Confirmed
  </UiBadge>
</template>

```

## API

Props:
- `label`: `string` (default `""`) — Text of the label; the default slot overrides it.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"neutral"`) — Meaning: a verdict, `brand` for the product's own marks, or `neutral` for a category.
- `variant`: `BadgeVariant` = `soft | inline | outline` (default `"soft"`) — Form: `soft` pale pill, `inline` dot with text, `outline` pale plate with a border.
- `dot`: `boolean` (default `false`) — Indicator dot before the text; `inline` always has one. The text still names it: a dot alone is color.
- `loading`: `boolean` (default `false`) — Work in progress: a spinner stands where the dot or the icon would.
- `size`: `"sm" | "md"` = `sm | md` (default `"md"`) — Scale: `sm` for dense tables and long lists, `md` beside a title.
- `removable`: `boolean` (default `false`) — Close button: an applied filter, an added tag.
- `removeLabel`: `string` (default `""`) — Accessible name of the close button; the default names the label.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `remove` (`event: MouseEvent`) — The close button of a `removable` badge was pressed: once per double click; the host removes the badge and moves focus. Carries the click (`detail` tells a double click's second from a key's).

Slots:
- `default` with `Record<string, never>` — Label text instead of the `label` prop.
- `icon` with `Record<string, never>` — Glyph before the text.

## How it behaves

### One press, one request

- When: it can be removed (`removable`).
- Props: `removable`, the host removing it on `remove`.
- Guarantee: A double click on the remove button emits one removal. If removing takes time, set `loading` after the first click to block further presses until it finishes.
- Without it: A double click sends the removal twice.
- Code: `<UiBadge label="Kiosk" removable @remove="drop('kiosk')" />`
- Your part: Remove the badge on `remove`, and move keyboard focus elsewhere, since the badge disappears.
- Proof, in the repository's tests (UiBadge.spec.ts, not in the package): "A double click on the cross removes once, even when the host re-renders between the clicks.", "While a loading set from the click runs, a second press past the double-click window waits."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Visible work

- When: the status it shows is being worked on (`loading`).
- Props: `loading`, with words that say what runs ("Syncing").
- Guarantee: The badge shows a spinner in place of its dot and text such as “Syncing”, and it is marked busy for assistive technology.
- Without it: The badge keeps its old word while the work runs, as if nothing were happening.
- Code: `<UiBadge tone="info" label="Syncing" loading />`
- Your part: Set `loading` while the work runs and give words for it. When it must be announced, add a live region of your own.
- Proof, in the repository's tests (UiBadge.spec.ts, not in the package): "While it works a spinner stands where the dot was, and the words say what runs."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Words, not only color

- When: it shows a status or a tag.
- Props: `label` or the default slot, with a `tone`.
- Guarantee: Its words name the state in every variant, and its tone only adds to them; a badge with no words warns in development that it is a bare color.
- Without it: Colored dots alone: in grayscale, or for someone who does not tell red from green, Paid and Overdue look the same.
- Code: `<UiBadge tone="danger" label="Overdue" />`
- Your part: Give every badge its word, such as Paid or Overdue, and use the same word for the same state everywhere.
- Not covered: It does not choose the word for you; a tone alone is not a name.
- Proof, in the repository's tests (UiBadge.spec.ts, not in the package): "The words name the state in every form, from the label or the slot.", "A badge with no words is a bare color and warns in development."
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#level-not-by-colour

### Whole text

- When: it has a long label.
- Props: `label`.
- Guarantee: A label longer than its place is cut the same way, with its full text in a tooltip, so the badge does not grow past its column.
- Without it: A badge that grows past its column, or a label cut with no way to read the rest.
- Code: `<UiBadge :label="tag.name" />`
- Your part: Nothing. Content you put in the slot instead of `label` handles its own cut.
- Proof, in the repository's tests (UiBadge.spec.ts, not in the package): "A long label is cut at the width of its place.", "A cut label keeps its whole text in a tooltip; text from the slot is cut without one."
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text

### Tag taken back

- When: A badge shows a selected tag and has `removable`.
- Props: `removable`.
- Guarantee: Its × is a real button with a name such as “Remove Desserts”: Tab reaches it, and Enter or Space presses it.
- Without it: A × that only the mouse can press.
- Code: `<UiBadge label="Kiosk" removable @remove="drop('kiosk')" />`
- Your part: Remove the item in `@remove`. When the label alone does not say what is removed, name it with `removeLabel`.
- Proof, in the repository's tests (UiBadge.spec.ts, not in the package): "The cross is a named button that removes the badge."
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#tag-taken-back


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
