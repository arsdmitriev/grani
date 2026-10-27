# Separator (`UiSeparator`)

> Separate groups in a menu, toolbar or card with a simple dividing line.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/separator

Also called divider, horizontal rule.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCard, UiStack, UiSeparator } from 'grani-ui'
</script>

<template>
  <UiCard title="Session" class="w-full max-w-sm">
    <UiStack class="text-sm">
      <p class="text-fg">Signed in as name@example.com</p>
      <UiSeparator />
      <p class="text-fg-muted">Last sign-in yesterday at 18:04</p>
    </UiStack>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

A line between groups of content. Take it between menu items, parts of a toolbar or groups of a UiButtonGroup.

**Spacing.** It has no margin of its own: the parent's gap spaces it. On a padded surface, a horizontal line runs through the gutter to the edges by itself; your own `-mx-*` is only for a place with no gutter. A vertical line stretches to the height of its flex row; in a UiButtonGroup it stands across the group.

**Border.** It is a border, not a fill, because forced colors keep borders.

### Keyboard

Not interactive: it takes no focus and no tab stop.

### Screen reader

- Line: a `separator` with its `aria-orientation`: a break between groups and nothing more.

### States

None: one line, horizontal or vertical, through a surface's gutter or across a row; a border, so forced colors keep it.

### When to use another component

- The line under a section title: UiHeader `legend`; where a legend opens a section, the legend is the line.
- The line between rows of a list: UiList draws it.
- Lines under a card's header and above its footer: UiCard draws them.
- The lines between the flat sections of an overlay: the overlay places them, as UiDrawer does.

## Examples

### In a row

```vue
<script setup lang="ts">
import { Bold, Italic, Link, Underline } from '@lucide/vue'
import { UiStack, UiIconButton, UiSeparator } from 'grani-ui'
</script>

<template>
  <UiStack direction="row" gap="tight">
    <UiIconButton :icon="Bold" ariaLabel="Bold" variant="ghost" />
    <UiIconButton :icon="Italic" ariaLabel="Italic" variant="ghost" />
    <UiIconButton :icon="Underline" ariaLabel="Underline" variant="ghost" />
    <UiSeparator orientation="vertical" />
    <UiIconButton :icon="Link" ariaLabel="Link" variant="ghost" />
  </UiStack>
</template>

```

### In a button group

```vue
<script setup lang="ts">
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link, Underline } from '@lucide/vue'
import { UiStack, UiButtonGroup, UiIconButton, UiSeparator } from 'grani-ui'
</script>

<template>
  <UiStack direction="row" gap="block" align="start">
    <UiButtonGroup ariaLabel="Formatting">
      <UiButtonGroup ariaLabel="Style">
        <UiIconButton :icon="Bold" ariaLabel="Bold" variant="outline" />
        <UiIconButton :icon="Italic" ariaLabel="Italic" variant="outline" />
        <UiIconButton :icon="Underline" ariaLabel="Underline" variant="outline" />
      </UiButtonGroup>
      <UiSeparator />
      <UiIconButton :icon="Link" ariaLabel="Link" variant="outline" />
    </UiButtonGroup>
    <UiButtonGroup ariaLabel="Alignment" orientation="vertical">
      <UiButtonGroup ariaLabel="Horizontal" orientation="vertical">
        <UiIconButton :icon="AlignLeft" ariaLabel="Left" variant="outline" />
        <UiIconButton :icon="AlignCenter" ariaLabel="Center" variant="outline" />
        <UiIconButton :icon="AlignRight" ariaLabel="Right" variant="outline" />
      </UiButtonGroup>
      <UiSeparator />
      <UiIconButton :icon="Link" ariaLabel="Link" variant="outline" />
    </UiButtonGroup>
  </UiStack>
</template>

```

### In a menu

```vue
<script setup lang="ts">
import { Copy, Ellipsis, Pencil, Trash2 } from '@lucide/vue'
import { UiMenu, UiIconButton, UiListItem, UiSeparator } from 'grani-ui'
</script>

<template>
  <UiMenu>
    <template #trigger>
      <UiIconButton :icon="Ellipsis" ariaLabel="Actions" variant="outline" />
    </template>
    <UiListItem as="button" title="Edit">
      <template #media><Pencil /></template>
    </UiListItem>
    <UiListItem as="button" title="Duplicate">
      <template #media><Copy /></template>
    </UiListItem>
    <UiSeparator />
    <UiListItem as="button" title="Delete" tone="danger">
      <template #media><Trash2 /></template>
    </UiListItem>
  </UiMenu>
</template>

```

## API

Props:
- `orientation`: `"horizontal" | "vertical"` = `horizontal | vertical` — `horizontal` spans the width between stacked blocks; `vertical` stands between items of a row. Default: across the enclosing UiButtonGroup, else horizontal.
Anything else lands on the root element: native attributes, aria-*, data-testid.
