# Stack (`UiStack`)

> Arrange related content vertically or horizontally with consistent spacing between groups, headings and sections.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/stack

Also called vertical stack, vstack, spacing scale.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiStack } from 'grani-ui'

interface Step {
  gap: 'tight' | 'group' | 'title' | 'block' | 'section'
  px: number
  use: string
}

const steps: Step[] = [
  { gap: 'tight', px: 8, use: 'the lines of one thing' },
  { gap: 'group', px: 16, use: 'the things of one group' },
  { gap: 'title', px: 24, use: 'a title and its text' },
  { gap: 'block', px: 48, use: 'the blocks of a page' },
  { gap: 'section', px: 96, use: 'the sections of a page' },
]
</script>

<template>
  <div class="flex w-full flex-wrap items-start gap-8">
    <div v-for="step in steps" :key="step.gap" class="flex w-32 flex-col gap-2">
      <p class="text-sm text-fg">
        <span class="font-medium">{{ step.gap }}</span>
        <span class="text-fg-muted"> {{ step.px }} px</span>
      </p>
      <UiStack :gap="step.gap">
        <div class="h-6 rounded-control bg-surface-muted" />
        <div class="h-6 rounded-control bg-surface-muted" />
      </UiStack>
      <p class="text-xs text-fg-muted">{{ step.use }}</p>
    </div>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

Things one under another or side by side, spaced by what they are to each other. Take it for the blocks of a page or a form; text on the left and a thing on the right is UiListItem.

**Gaps.** You name the relation, never a number. `tight` is 8, for the lines of one thing (a label and its control, a name and its count). `group` is 16, the default, for the things of one group (the fields of a form, a search over its list). `title` is 24, for a title and the text or the fields it names. `block` is 48, for the blocks of one page, and `section` is 96, for its sections. Importance is shown by size and color, not distance: a wider gap says "another thing", never "a bigger thing".

**Margins.** It is a gap, not a margin, so the children carry no space of their own. A UiSeparator among them keeps the rhythm, and a UiHeader legend after other content adds its own 32 to the gap: in the default stack that lands at `block` (48), in another it is that gap plus 32. The stack pads nothing: in a UiCard it is the body, and the card's gutter goes round it.

**Rows.** `row` is for things that share one line and nothing else (a badge beside a name, two buttons); they align on its vertical center. Text on the left and a thing on the right is UiListItem, not a `row`.

### Keyboard

Not interactive: the children keep their own tab stops, in the order they are stacked.

### Screen reader

- Element: nothing of its own; a `div`, or the element `as` names (`section`, `ul`, `form`, `li`), with the children read in order.

### States

None: the gap is one step of the scale and does not change with the content.

### When to use another component

- Text on the left and a thing on the right: UiListItem.
- A table: UiTable.
- The toolbar row: UiTableToolbar owns it.
- Buttons joined into one capsule: UiButtonGroup.
- A grid of columns: the page lays it out itself.

## Examples

### Nested

```vue
<script setup lang="ts">
import { UiStack, UiField, UiInput } from 'grani-ui'
</script>

<template>
  <UiStack gap="block" class="w-full">
    <UiStack gap="title">
      <h3 class="text-base font-semibold text-fg">Account</h3>
      <UiStack gap="group">
        <UiField label="Name"><UiInput model-value="Anna Weber" /></UiField>
        <UiField label="Email"><UiInput model-value="anna@example.com" /></UiField>
      </UiStack>
    </UiStack>
    <UiStack gap="title">
      <h3 class="text-base font-semibold text-fg">Address</h3>
      <UiStack gap="group">
        <UiField label="City"><UiInput model-value="Berlin" /></UiField>
        <UiField label="Street"><UiInput model-value="Torstraße 12" /></UiField>
      </UiStack>
    </UiStack>
  </UiStack>
</template>

```

### A row

```vue
<script setup lang="ts">
import { UiStack, UiBadge, UiButton } from 'grani-ui'
</script>

<template>
  <UiStack direction="row" gap="tight">
    <span class="text-sm font-medium text-fg">Invoices</span>
    <UiBadge label="12" />
  </UiStack>
  <UiStack direction="row" gap="group">
    <UiButton variant="secondary">Cancel</UiButton>
    <UiButton>Save</UiButton>
  </UiStack>
</template>

```

## API

Props:
- `gap`: `"block" | "title" | "group" | "section" | "tight"` = `block | title | group | section | tight` (default `"group"`) — The relation between the children, a step of the scale: `tight` 8, `group` 16, `title` 24, `block` 48, `section` 96 px.
- `direction`: `"column" | "row"` = `column | row` (default `"column"`) — `column` stacks the children; `row` lines them up on one line.
- `align`: `"start" | "center" | "end" | "stretch"` = `start | center | end | stretch` — Where the children stand across the stack. Unset, a column stretches them to its width and a row centers them on the line.
- `as`: `"div" | "form" | "section" | "ul" | "li"` = `div | form | section | ul | li` (default `"div"`) — The element: `div` by default; `section`, `ul`, `form` or `li` when the stack is one.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `Record<string, never>` — The things stacked, in order, each without a margin of its own.
