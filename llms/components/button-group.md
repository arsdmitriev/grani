# Button group (`UiButtonGroup`)

> Keep related controls together, such as a main action and its menu or a field and its submit button.

A component of grani-ui 0.1.0. Actions, stable, since 0.1.0. Page: https://grani.arseni.work/components/button-group

Also called segmented buttons, joined buttons, split button.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Archive, ArrowLeft, Clock, Ellipsis, Flag, Pencil, Trash2 } from '@lucide/vue'
import { UiButtonGroup, UiIconButton, UiButton, UiMenu, UiListItem, UiConfirm, UiToaster, useConfirm } from 'grani-ui'

const { confirm } = useConfirm()

const remove = () =>
  confirm({
    title: 'Delete the message?',
    message: 'It is removed for everyone. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
  })
</script>

<template>
  <UiButtonGroup ariaLabel="Message actions">
    <UiButtonGroup ariaLabel="Back">
      <UiIconButton :icon="ArrowLeft" ariaLabel="Back to the inbox" />
    </UiButtonGroup>
    <UiButtonGroup ariaLabel="Triage">
      <UiButton variant="outline">
        <Archive aria-hidden="true" />
        Archive
      </UiButton>
      <UiButton variant="outline">
        <Flag aria-hidden="true" />
        Report
      </UiButton>
    </UiButtonGroup>
    <UiButtonGroup ariaLabel="Snooze">
      <UiButton variant="outline">
        <Clock aria-hidden="true" />
        Snooze
      </UiButton>
      <UiMenu align="end">
        <template #trigger>
          <UiIconButton :icon="Ellipsis" ariaLabel="More actions" />
        </template>
        <UiListItem as="button" title="Edit">
          <template #media><Pencil /></template>
        </UiListItem>
        <UiListItem as="button" title="Delete" tone="danger" @click="remove">
          <template #media><Trash2 /></template>
        </UiListItem>
      </UiMenu>
    </UiButtonGroup>
  </UiButtonGroup>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiConfirm />
  <UiToaster />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Name the group by what its buttons do together, such as Pagination or Message actions; a group with no name warns in development.

## Why it works this way

Bordered controls of one size joined into one capsule (`outline`, never `ghost`). Take it for a few related actions side by side in a toolbar, or to join a search with its button.

**Nesting.** A nested group is spaced, not joined. A `UiSeparator` between nested groups draws a line across the row; between two joined buttons, their shared border is the line.

**Filled buttons.** Filled buttons (`primary`, `secondary`) have no border to share, so two of them side by side are split by a 1px seam instead.

**Split button.** A split button is a primary UiButton next to a primary UiIconButton with a chevron that opens a UiMenu, as in a UiCrudDrawer's footer; an `outline` button and an `outline` arrow make the quieter one. In a row, a UiIconButton last and right after a button with text is that arrow, and the group draws it narrower than a square: a part of the button beside it, not a button of its own.

**Children.** A child in error is lifted over its neighbors, so its red frame shows whole. Children must be direct: a button inside a wrapper cannot be joined. The size is each child's, or the app's step for all of them, so give one `size` to every child or to none. `orientation` makes the group vertical.

### Keyboard

None of its own: Tab walks its children one by one, each with its own keys, and the focused child is lifted over its neighbors, so its ring shows whole.

### Screen reader

- Group: a `group` named by `ariaLabel`.
- In a field group: inside a `UiField group`, the legend names it (`aria-labelledby`) and the field's text describes it (`aria-describedby`), with its own `ariaLabel` winning.
- In a plain field: inside a plain UiField, the input in the group is the control and the group takes nothing.
- Nested: a nested group keeps its own name.
- No name: a group with no name warns in dev.

### States

No state of its own; it shows its children's: a focused or hovered child lifted; a child in error lifted over its neighbors with its red frame whole; a disabled child beside a filled one, with a reason too, not lifted on hover; a link child joined as a button is. Horizontal or vertical (`orientation`), on every step of the size ladder, nested with a gap.

### When to use another component

- One choice among a few: UiRadioGroup `segmented`.
- A lone action: UiButton.
- The search and the filters over a list: UiTableToolbar.

## Examples

### Split button

```vue
<script setup lang="ts">
import { ChevronDown, Clock, Copy, Plus, Send } from '@lucide/vue'
import { UiButtonGroup, UiButton, UiMenu, UiIconButton, UiListItem } from 'grani-ui'
</script>

<template>
  <UiButtonGroup ariaLabel="Save">
    <UiButton>Save</UiButton>
    <UiMenu align="end">
      <template #trigger>
        <UiIconButton variant="primary" :icon="ChevronDown" ariaLabel="More ways to save" />
      </template>
      <UiListItem as="button" title="Save and new">
        <template #media><Plus /></template>
      </UiListItem>
      <UiListItem as="button" title="Save a copy">
        <template #media><Copy /></template>
      </UiListItem>
    </UiMenu>
  </UiButtonGroup>
  <UiButtonGroup ariaLabel="Send">
    <UiButton variant="outline"><Send aria-hidden="true" />Send</UiButton>
    <UiMenu align="end">
      <template #trigger>
        <UiIconButton :icon="ChevronDown" ariaLabel="More ways to send" />
      </template>
      <UiListItem as="button" title="Send later">
        <template #media><Clock /></template>
      </UiListItem>
    </UiMenu>
  </UiButtonGroup>
</template>

```

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiButtonGroup, UiInput, UiButton } from 'grani-ui'

const query = ref('a')
</script>

<template>
  <UiField
    label="Search"
    :error="query.trim().length < 2 ? 'Type at least two letters.' : undefined"
    class="w-80"
  >
    <UiButtonGroup>
      <UiInput v-model="query" placeholder="Search records" />
      <UiButton variant="outline">Search</UiButton>
    </UiButtonGroup>
  </UiField>
</template>

```

### Vertical

```vue
<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'
import { UiButtonGroup, UiIconButton } from 'grani-ui'
</script>

<template>
  <UiButtonGroup ariaLabel="Zoom" orientation="vertical">
    <UiIconButton :icon="Plus" ariaLabel="Zoom in" />
    <UiIconButton :icon="Minus" ariaLabel="Zoom out" />
  </UiButtonGroup>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiButtonGroup, UiButton } from 'grani-ui'
</script>

<template>
  <UiButtonGroup v-for="size in ['xs', 'sm', 'md']" :key="size" :ariaLabel="`Share, ${size}`">
    <UiButton variant="outline" :size="size">Copy</UiButton>
    <UiButton variant="outline" :size="size">Share</UiButton>
    <UiButton variant="outline" :size="size">Export</UiButton>
  </UiButtonGroup>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiButtonGroup, UiButton } from 'grani-ui'
</script>

<template>
  <UiButtonGroup ariaLabel="Send">
    <UiButton>Send</UiButton>
    <UiButton variant="secondary" disabled>Schedule</UiButton>
  </UiButtonGroup>
  <UiButtonGroup ariaLabel="Draft">
    <UiButton variant="outline">Save</UiButton>
    <UiButton variant="outline" disabled>Discard</UiButton>
    <UiButton variant="outline" to="/components/button">Preview</UiButton>
  </UiButtonGroup>
</template>

```

## API

Props:
- `ariaLabel`: `string` — Name of the group for a screen reader: "Pagination", "Period". Inside `UiField group` the legend names it.
- `orientation`: `"horizontal" | "vertical"` = `horizontal | vertical` (default `"horizontal"`) — Controls in a row or in a column.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `Record<string, never>` — Bordered controls of one size, a nested group, a `UiSeparator`.

## How it behaves

### One name

- When: it holds a row of joined buttons.
- Props: `ariaLabel`, or a `UiField group` around it.
- Guarantee: The group is named once: by its own `ariaLabel`, or by the legend of the `UiField group` around it, with the field's description or error announced as its description. Its own `ariaLabel` wins over the legend, and each button keeps its own name.
- Without it: A screen reader encounters several buttons with no explanation of what they do together.
- Code: `<UiButtonGroup ariaLabel="Message actions">…</UiButtonGroup>`
- Your part: Name the group by what its buttons do together, such as Pagination or Message actions; a group with no name warns in development.
- Not covered: Inside a UiField without `group`, the input in the group is the named control, and the group takes no name from the field.
- Proof, in the repository's tests (UiButtonGroup.spec.ts, not in the package): "in a group field the legend names it and the error describes it", "its own ariaLabel wins over the legend"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns
