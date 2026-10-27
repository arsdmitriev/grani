# Avatar (`UiAvatar`)

> Recognize a person by their photo, with initials shown while the photo loads or if it is unavailable.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/avatar

Also called user avatar, profile picture, initials.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiAvatar } from 'grani-ui'
</script>

<template>
  <UiAvatar name="Anna Petrova" alt="Anna Petrova" />
  <UiAvatar name="Ivan Sidorov" tone="success" alt="Ivan Sidorov" />
  <UiAvatar name="Maria Kova" tone="warning" alt="Maria Kova" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep nearby content in place while loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

A round mark for a person or a thing, with a photo or initials. Take it beside a name: in a card header, a table cell or a UiListItem's `#media`.

**Look.** The photo from `src` lies over the initials of `name`, on a pale plate in the tone. While the photo loads, and when it fails, the initials show at the same size. With no name and no photo it shows a person glyph.

**Placement.** In the `#media` of a UiListItem, beside a name in a card header, in a table cell, and as the `xs` actor node of a UiLog beside the log line.

**Mark.** A UiIndicator with `round` marks it: `sm` on the `xs` and `sm` sizes, `md` on `md`.

### Keyboard

Not interactive: no tab stop, no keys.

### Screen reader

- Beside a name: hidden (`aria-hidden`); the name beside it is what is read.
- Alone: with `alt` or a caller's `aria-label`, an image (`role="img"`) with that name.
- Photo and glyph: the photo has an empty `alt` and the person glyph is hidden, so nothing is read twice.

### States

Initials on the plate, a photo over them, a photo loading or failed (the initials show at the same size), no name and no photo (a person glyph); three sizes and the tones, with a UiIndicator mark. No hover or focus state of its own.

### When to use another component

- A state mark on it: UiIndicator `round`.
- A state word: UiBadge.
- A count: UiCount.
- A glyph that acts: UiIconButton.

## Examples

### Sizes

```vue
<script setup lang="ts">
import { UiAvatar } from 'grani-ui'
</script>

<template>
  <UiAvatar name="Anna Petrova" size="xs" alt="Anna Petrova" />
  <UiAvatar name="Anna Petrova" alt="Anna Petrova" />
  <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova" />
</template>

```

### Photo

```vue
<script setup lang="ts">
import { UiAvatar } from 'grani-ui'

// A photo that loads offline, and an address that answers nothing.
const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c7d2fe"/><circle cx="32" cy="26" r="12" fill="#6366f1"/><path d="M10 64c2-14 11-20 22-20s20 6 22 20z" fill="#6366f1"/></svg>',
)}`
</script>

<template>
  <UiAvatar name="Anna Petrova" :src="photo" alt="Anna Petrova" />
  <UiAvatar name="Ivan Sidorov" src="/no-such-photo.jpg" alt="Ivan Sidorov" />
</template>

```

### With a mark

```vue
<script setup lang="ts">
import { UiIndicator, UiAvatar } from 'grani-ui'
</script>

<template>
  <UiIndicator dot tone="success" placement="bottom-end" size="sm" round>
    <UiAvatar name="Anna Petrova" alt="Anna Petrova, online" />
  </UiIndicator>
  <UiIndicator :count="3" size="md" round>
    <UiAvatar name="Ivan Sidorov" size="md" alt="Ivan Sidorov, 3 unread" />
  </UiIndicator>
</template>

```

### No name

```vue
<script setup lang="ts">
import { UiAvatar } from 'grani-ui'
</script>

<template>
  <UiAvatar name="" alt="Unknown sender" />
</template>

```

### In a row

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem, UiAvatar } from 'grani-ui'

const people = [
  { name: 'Anna Petrova', email: 'anna@example.com' },
  { name: 'Ivan Sidorov', email: 'ivan@example.com' },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem v-for="p in people" :key="p.email" :title="p.name" :description="p.email">
        <template #media><UiAvatar :name="p.name" size="md" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### In a table

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiAvatar } from 'grani-ui'

const invoices = [
  { id: 'INV-0042', owner: 'Anna Petrova' },
  { id: 'INV-0041', owner: 'Ivan Sidorov' },
]

const columns: TableColumn<(typeof invoices)[number]>[] = [
  { key: 'owner', label: 'Owner' },
  { key: 'id', label: 'Invoice' },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiTable :columns="columns" :items="invoices" row-key="id" aria-label="Invoices">
      <template #cell.owner="{ value }">
        <span class="flex items-center gap-2">
          <UiAvatar :name="String(value)" size="xs" />
          <span class="truncate">{{ value }}</span>
        </span>
      </template>
    </UiTable>
  </UiCard>
</template>

```

## API

Props:
- `name`: `string` (required) — Whose it is; the initials come from its first two words ("Anna Petrova" is "AP").
- `src`: `string` (default `""`) — A photo; when it is missing or fails to load, the initials stand in.
- `alt`: `string` (default `""`) — Alone, what it shows ("Anna Petrova"); beside the name leave it empty: it is decoration.
- `size`: `"sm" | "xs" | "md"` = `xs | sm | md` (default `"sm"`) — `xs` 24, `sm` 32, `md` 40: beside a dense row, a row, a page row.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"brand"`) — The plate behind the initials.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### Stable dimensions

- When: it has a photo.
- Props: `src` is set.
- Guarantee: The initials hold the place while the photo loads or if it fails, and the avatar never changes size.
- Without it: An empty spot while the photo loads, a broken-image icon if it fails, and the row shifts when it arrives.
- Code: `<UiAvatar name="Anna Petrova" src="/anna.jpg" />`
- Your part: Nothing. Do not put a spinner or a placeholder of your own over the avatar.
- Not covered: A failed photo is not retried; a new `src` tries again.
- Proof, in the repository's tests (UiAvatar.spec.ts, not in the package): "The avatar container and initials remain rendered while the photo loads.", "The avatar keeps its size while the photo loads, once it arrives and if it fails.", "Initials are shown on mount if the photo has already failed."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt


The patterns: https://grani.arseni.work/patterns
