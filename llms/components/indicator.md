# Indicator (`UiIndicator`)

> Mark an item that needs attention with a count or dot in its corner.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/indicator

Also called notification dot, status dot, badge dot.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Bell, Inbox, MessageSquare } from '@lucide/vue'
import { UiIndicator, UiIconButton } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator :count="0">
      <UiIconButton :icon="Bell" ariaLabel="Notifications, none new" />
    </UiIndicator>
    <UiIndicator :count="3">
      <UiIconButton :icon="Bell" ariaLabel="Notifications, 3 new" />
    </UiIndicator>
    <UiIndicator :count="12">
      <UiIconButton :icon="Inbox" ariaLabel="Inbox, 12 new" />
    </UiIndicator>
    <UiIndicator :count="150">
      <UiIconButton :icon="MessageSquare" ariaLabel="Messages, more than 99 new" />
    </UiIndicator>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep counts short and in place.
- Reduce motion without hiding loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the real count, and name the state on the element it marks, using the slot’s `text`, such as “Inbox, 99+”. Do not draw a 0 yourself.

## Why it works this way

A count or a dot on the corner of what it marks. Take it on an icon button, an avatar (`round`) or a place's icon in UiAppShell's collapsed rail when something waits there; a number beside a label is UiCount.

**Mark.** The mark is a UiCount and follows its rules: a fraction is rounded down, an infinite count shows `{max}+`, and a bad one shows nothing. A ring in the surface color, or in `--ui-indicator-ring`, cuts it out from what it sits on.

**Overflow.** Half of the mark stands outside the element, so a clipping ancestor crops it, and a UiButtonGroup does not join it. The root is a `<span>`.

### Keyboard

Not interactive: the mark takes no focus and no pointer; the element in the slot keeps its own tab stop.

### Screen reader

- Mark: hidden (`aria-hidden`).
- Name: the host names the state on the element it marks, using the slot's `{ count, text, visible }`: "Inbox, 99+", or "new" while a dot is visible.
- Change: not announced.

### States

Hidden at `0` unless `dot`; a count, `{max}+` above `max`; a dot; `pulse`, a ring in the tone that keeps expanding and stops under reduced motion; `round`, on the edge of a circle; the four corners, mirrored in RTL; `sm` and `md`; the ring of the surface or of `--ui-indicator-ring`. A bad count hides the mark and warns in dev.

### When to use another component

- A number beside a label: UiCount.
- A label: UiBadge.
- A status in a row of a table: UiBadge `inline`.

## Examples

### Dot

```vue
<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { UiIndicator, UiIconButton, UiAvatar } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator dot>
      <UiIconButton :icon="Bell" ariaLabel="Notifications, new" />
    </UiIndicator>
    <UiIndicator dot tone="success" placement="bottom-end" round>
      <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova, online" />
    </UiIndicator>
  </div>
</template>

```

### Pulse

```vue
<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { UiIndicator, UiIconButton, UiAvatar } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator :count="1" pulse>
      <UiIconButton :icon="Bell" ariaLabel="Notifications, 1 new" />
    </UiIndicator>
    <UiIndicator dot pulse tone="success" placement="bottom-end" round>
      <UiAvatar name="Support" size="md" alt="Support, online" />
    </UiIndicator>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { UiIndicator, UiIconButton } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator :count="3" size="sm">
      <UiIconButton :icon="Bell" size="xs" ariaLabel="Notifications, 3 new" />
    </UiIndicator>
    <UiIndicator :count="3">
      <UiIconButton :icon="Bell" ariaLabel="Notifications, 3 new" />
    </UiIndicator>
    <UiIndicator :count="3">
      <UiIconButton :icon="Bell" size="md" ariaLabel="Notifications, 3 new" />
    </UiIndicator>
  </div>
</template>

```

### On a muted surface

```vue
<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { UiIndicator, UiIconButton, UiAvatar } from 'grani-ui'
</script>

<template>
  <div
    class="flex items-center gap-8 rounded-card bg-surface-muted p-4 [--ui-indicator-ring:var(--color-surface-muted)]"
  >
    <UiIndicator :count="5">
      <UiIconButton :icon="Inbox" ariaLabel="Inbox, 5 new" />
    </UiIndicator>
    <UiIndicator dot tone="success" placement="bottom-end" round>
      <UiAvatar name="Anna Petrova" size="md" alt="Anna Petrova, online" />
    </UiIndicator>
  </div>
</template>

```

### Corners

```vue
<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { UiIndicator, UiIconButton } from 'grani-ui'

const corners = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator v-for="corner in corners" :key="corner" :count="2" :placement="corner">
      <UiIconButton :icon="Bell" :ariaLabel="`Notifications, 2 new (${corner})`" />
    </UiIndicator>
  </div>
</template>

```

### Max

```vue
<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { UiIndicator, UiIconButton } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator v-slot="{ text }" :count="12" :max="9">
      <UiIconButton :icon="Inbox" :ariaLabel="`Inbox, ${text} new`" />
    </UiIndicator>
  </div>
</template>

```

### Tones

```vue
<script setup lang="ts">
import { Bell, Inbox, MessageSquare } from '@lucide/vue'
import { UiIndicator, UiIconButton } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-8">
    <UiIndicator :count="4" tone="brand">
      <UiIconButton :icon="Inbox" ariaLabel="Inbox, 4 new" />
    </UiIndicator>
    <UiIndicator :count="2" tone="success">
      <UiIconButton :icon="Bell" ariaLabel="Approved, 2 new" />
    </UiIndicator>
    <UiIndicator :count="7" tone="neutral">
      <UiIconButton :icon="MessageSquare" ariaLabel="Drafts, 7" />
    </UiIndicator>
  </div>
</template>

```

## API

Props:
- `count`: `number` (default `0`) — The number on the corner; `0` hides the mark unless `dot` is set.
- `max`: `number` (default `99`) — The largest count shown as is; above it the mark reads `99+`.
- `dot`: `boolean` (default `false`) — A dot instead of a number: online, unsaved, something new.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"danger"`) — Meaning of the mark: `danger` for unread by default, `success` for online.
- `placement`: `Placement` = `top-end | top-start | bottom-end | bottom-start` (default `"top-end"`) — Which corner of the element holds the mark.
- `size`: `"sm" | "md"` = `sm | md` (default `"md"`) — `sm` on an `xs` icon button or a small avatar, `md` on an `sm` or `md` icon button.
- `pulse`: `boolean` (default `false`) — A ring that keeps expanding: the state is live. Stops under reduced motion.
- `round`: `boolean` (default `false`) — The element is a circle (an avatar, as wide as it is tall): the mark sits on its edge, not on the corner of its box.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `{ count: number; text: string; visible: boolean; }` — The element that carries the mark: an icon button, an avatar. Gets the count to name the state from.

## How it behaves

### Compact counts

- When: on the corner of what it marks.
- Props: `count` and `max` (99 by default).
- Guarantee: The indicator stays compact: above `max`, it shows a shortened count such as 99+. It disappears at zero or when the value is not a number.
- Without it: A large number such as 1284 spills out of its corner, a red 0 stays when nothing is waiting, and a bad value shows as “NaN”.
- Code: `<UiIndicator :count="unread"><UiIconButton :icon="Inbox" ariaLabel="Inbox" /></UiIndicator>`
- Your part: Pass the real count, and name the state on the element it marks, using the slot’s `text`, such as “Inbox, 99+”. Do not draw a 0 yourself.
- Not covered: It does not announce the count to a screen reader; the element it marks does.
- Proof, in the repository's tests (UiIndicator.spec.ts, not in the package): "Past max the mark reads 99+, at any corner.", "At zero the mark is gone; a dot shows without a count.", "A count that is not a number hides the mark and warns in development.", "a negative count is none: the mark is gone, as at zero"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#compact-counts

### Calm motion

- When: it pulses (`pulse`) and reduced motion is on.
- Props: `pulse`, and the system setting `prefers-reduced-motion: reduce`.
- Guarantee: The pulse stops and the mark stays. The pulse calls for attention rather than showing work, so it is the kind of movement reduced motion removes.
- Without it: A ring keeps expanding around the mark although you asked for less movement.
- Code: `<UiIndicator dot pulse><UiAvatar name="Anna Petrova" /></UiIndicator>`
- Your part: Nothing. Use `pulse` for something that needs attention, never for work in progress.
- Proof, in the repository's tests (UiIndicator.spec.ts, not in the package): "Its pulse stops when the system asks for reduced motion: it calls, it does not work."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#calm-motion


The patterns: https://grani.arseni.work/patterns
