# Count (`UiCount`)

> Show a compact count beside a label, or a dot when only the presence of an update matters.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/count

Also called counter badge, count badge, notification count.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCount } from 'grani-ui'
</script>

<template>
  <UiCount :count="3" />
  <UiCount :count="12" tone="info" />
  <UiCount :count="20" variant="solid" tone="brand" />
  <UiCount :count="120" variant="solid" tone="danger" />
  <UiCount :count="5" size="sm" variant="solid" tone="success" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep counts short and in place.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the real count. While it is unknown, pass `NaN`, which draws nothing, or hide the count with `v-if`: an unset `count` is 0. When the count stands alone, say its unit in its accessible name.

## Why it works this way

A number beside a label. Take it for the count on a tab, a button or a row; on the corner of an icon or an avatar take UiIndicator.

**Shape.** One digit sits in a circle, more digits in a capsule, and above `max` it shows `{max}+`. `soft` is quiet; `solid` draws attention.

**Values.** A fraction is rounded down, an infinite count shows the overflow, a negative or missing one is `0`, and one that is not a number draws nothing: unknown is not empty.

**Placement.** It sits on a button's label, a tab (UiTabs), a navigation row (UiAppShell) and a UiFilter trigger, and serves as the mark of UiIndicator. The root is a `<span>`.

### Keyboard

Not interactive: it takes no focus, and reaches the keyboard only through its host, a button, a tab or a row.

### Screen reader

- Name: a bare number means nothing: the host names it with its label ("Inbox, 4"); standing alone, `ariaLabel` makes it an image named with its unit ("4 unread").
- Dot: a `dot` is hidden.
- Change: not announced.

### States

One digit in a circle, more in a capsule, `{max}+` above `max`, `0` shown; `soft` pale or `solid` saturated, `warning` always solid; `dot`, with no number; `sm` 16px and `md` 20px. No hover or focus of its own. A count that is not a number draws nothing; a bad `max` falls back. Both warn in dev, once per value.

### When to use another component

- A label: UiBadge.
- A change against the value before: UiDelta.
- A count on the corner of an icon or an avatar: UiIndicator around it.

## Examples

### Tones

```vue
<script setup lang="ts">
import type { Tone } from 'grani-ui'
import { UiCount } from 'grani-ui'

const tones: Tone[] = ['neutral', 'brand', 'info', 'success', 'warning', 'danger']
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <UiCount v-for="tone in tones" :key="tone" :count="4" :tone="tone" />
    </div>
    <div class="flex items-center gap-2">
      <UiCount v-for="tone in tones" :key="tone" :count="4" :tone="tone" variant="solid" />
    </div>
  </div>
</template>

```

### Zero and overflow

```vue
<script setup lang="ts">
import { UiCount } from 'grani-ui'
</script>

<template>
  <UiCount :count="0" />
  <UiCount :count="9" />
  <UiCount :count="99" />
  <UiCount :count="100" />
  <UiCount :count="12" :max="9" size="sm" />
</template>

```

### Alone

```vue
<script setup lang="ts">
import { UiCount } from 'grani-ui'
</script>

<template>
  <span class="text-sm text-fg">Messages</span>
  <UiCount :count="4" variant="solid" tone="brand" ariaLabel="4 unread" />
</template>

```

### On buttons

```vue
<script setup lang="ts">
import { UiButton, UiCount } from 'grani-ui'
</script>

<template>
  <UiButton variant="outline">Inbox <UiCount :count="3" variant="solid" tone="brand" /></UiButton>
  <UiButton variant="outline"
    >Failed <UiCount :count="12" variant="solid" tone="danger"
  /></UiButton>
  <UiButton variant="outline">Review <UiCount :count="20" variant="solid" /></UiButton>
  <UiButton variant="ghost">Drafts <UiCount :count="7" /></UiButton>
</template>

```

### In a list of places

```vue
<script setup lang="ts">
import type { Tone } from 'grani-ui'
import { UiCard, UiList, UiListItem, UiCount } from 'grani-ui'

interface Place {
  label: string
  count: number
  tone: Tone
}

const menu: Place[] = [
  { label: 'Inbox', count: 4, tone: 'brand' },
  { label: 'Orders', count: 12, tone: 'brand' },
  { label: 'Disputes', count: 2, tone: 'danger' },
  { label: 'Archive', count: 0, tone: 'neutral' },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-xs">
    <UiList>
      <UiListItem
        v-for="item in menu"
        :key="item.label"
        size="sm"
        :title="item.label"
        to="/components/count"
      >
        <template v-if="item.count" #actions>
          <UiCount :count="item.count" variant="solid" :tone="item.tone" />
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Mark

```vue
<script setup lang="ts">
import { UiButton, UiCount } from 'grani-ui'
</script>

<template>
  <UiButton variant="outline"
    >Payments <UiCount variant="solid" tone="danger">!</UiCount></UiButton
  >
</template>

```

### Dot

```vue
<script setup lang="ts">
import { UiButton, UiCount } from 'grani-ui'
</script>

<template>
  <UiButton variant="ghost"
    >Updates <UiCount dot variant="solid" tone="brand" /><span class="sr-only"
      >, new</span
    ></UiButton
  >
  <UiButton variant="ghost" size="xs"
    >News <UiCount dot size="sm" variant="solid" tone="danger" /><span class="sr-only"
      >, new</span
    ></UiButton
  >
</template>

```

## API

Props:
- `count`: `number` (default `0`) — The number. `0` is shown; hide it with `v-if` when zero means nothing.
- `max`: `number` (default `99`) — The largest count shown as is; above it the count reads `{max}+`. A whole number from 1.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"neutral"`) — Meaning: `brand` for the product's own counts, a verdict, or `neutral`.
- `variant`: `"soft" | "solid"` = `soft | solid` (default `"soft"`) — `soft` pale plate for a quiet total, `solid` saturated fill for a count that calls; `warning` is always solid, its pale plate reads muddy.
- `size`: `"sm" | "md"` = `sm | md` (default `"md"`) — `sm` 16px for a corner mark or a dense row, `md` 20px on a button, a tab or a navigation row.
- `dot`: `boolean` (default `false`) — A dot without a number: there is something new, how much does not matter. 8px, 6px at `sm`.
- `ariaLabel`: `string` — The name of a count that stands alone, the number with its unit: "4 unread". In a tab, a row or a button their label names it.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `Record<string, never>` — A short mark instead of the number, such as "!"; it takes the same circle.

## How it behaves

### Compact counts

- When: beside a label.
- Props: `count` and `max` (99 by default).
- Guarantee: The count is never longer than its largest form, such as 99+ above `max`. A value that is not a number is hidden; a known total of zero is shown as 0.
- Without it: A long number widens its button or tab and pushes its neighbors aside, and a bad value shows as “NaN”.
- Code: `<UiButton>Inbox <UiCount :count="unread" /></UiButton>`
- Your part: Pass the real count. While it is unknown, pass `NaN`, which draws nothing, or hide the count with `v-if`: an unset `count` is 0. When the count stands alone, say its unit in its accessible name.
- Not covered: It is as wide as its digits, so a count that gains a digit moves what stands beside it by a few pixels. It does not hide a 0; for a mark that should disappear at zero, use UiIndicator.
- Proof, in the repository's tests (UiCount.spec.ts, not in the package): "Above max it reads 99+: one digit is a circle, two grow a capsule.", "A count that is not a number shows nothing, with a warning in development.", "a negative count reads 0", "an unset count is 0, and a count that is not a number draws nothing"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#compact-counts


The patterns: https://grani.arseni.work/patterns
