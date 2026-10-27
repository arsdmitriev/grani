# Spinner (`UiSpinner`)

> Show that work is in progress where the surrounding component has no loading state of its own.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/spinner

Also called loader, loading indicator, activity indicator.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiSpinner } from 'grani-ui'
</script>

<template>
  <!-- Decoration: no name, the words or the host say what is going on. -->
  <UiSpinner class="h-3 w-3" />
  <UiSpinner />
  <UiSpinner class="h-6 w-6" />
  <UiSpinner class="h-8 w-8" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See where the app is working.
- Reduce motion without hiding loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Show it when the request starts and remove it when the request ends. A spinner that mounts with its name is often not read out, so say the wait in a live region that was on the page before the request starts (UiCard `loading` has one). Inside a button, a badge, a switch or a row, set their `loading` instead of placing a spinner yourself.

## Why it works this way

The sign that work is under way. Take it where a request runs and nothing draws one for you; a button, a badge, a switch and a row draw their own under `loading`.

**Size.** It is 16px unless the host sets `h-*` or `size-*`. It has no props.

**Placement.** It is the loading state of buttons, badges, switches, rows, selects, list fields, uploads, toasts and chart cards.

### Keyboard

Not interactive: it takes no focus. A button that spins is UiButton `loading`, which handles the keys.

### Screen reader

- Name: with an `aria-label` or `aria-labelledby` it is a `status` with that name; without a name it is decoration, hidden. A `role` or `aria-hidden` you set never overrides this.
- Status: one that mounts with its name already in place is often not read out. Say the wait in a live region that was on the page before the request starts (UiCard `loading` has one), and let the spinner be its picture.

### States

One: turning, slower under reduced motion, never still; 16px unless the host sets `h-*` or `size-*`.

### When to use another component

- Content on its way: UiSkeleton.
- Work of unknown length on a track: UiProgress `indeterminate`.
- A button, a badge, a switch or a row at work: UiButton, UiBadge, UiSwitch and UiListItem draw it themselves under `loading`.

## Examples

### Named or not

```vue
<script setup lang="ts">
import { UiSpinner } from 'grani-ui'
</script>

<template>
  <span class="flex items-center gap-2 text-sm text-fg-muted">
    <UiSpinner />
    Loading invoices
  </span>
  <UiSpinner aria-label="Loading invoices" class="h-6 w-6 text-fg-muted" />
</template>

```

### Color

```vue
<script setup lang="ts">
import { UiSpinner } from 'grani-ui'
</script>

<template>
  <UiSpinner class="h-6 w-6 text-fg-muted" />
  <UiSpinner class="h-6 w-6 text-brand" />
  <UiSpinner class="h-6 w-6 text-success-border" />
  <UiSpinner class="h-6 w-6 text-danger-border" />
</template>

```

### Where it turns

```vue
<script setup lang="ts">
import { UiButton, UiIconButton, UiBadge, UiCard, UiList, UiListItem } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <UiButton loading>Saving</UiButton>
      <UiIconButton ariaLabel="Saving" loading />
      <UiBadge tone="info" label="Syncing" loading />
    </div>
    <UiCard :padded="false">
      <UiList>
        <UiListItem as="button" size="sm" title="Sync the bank feed" loading />
      </UiList>
    </UiCard>
  </div>
</template>

```

## API

No props, events or slots of its own. Attributes are placed by the component itself: its description says where.

## How it behaves

### Visible work

- When: a request is running.
- Props: it is mounted while the request runs; `aria-label` is set when no words beside it say what is loading.
- Guarantee: A spinning ring shows that work is in progress. With an accessible name it is exposed as a status with that name; without a name it is hidden from a screen reader.
- Without it: Nothing changes after the click, so you click again and the same request goes twice.
- Code: `<UiButton :loading="saving">Save</UiButton>`
- Your part: Show it when the request starts and remove it when the request ends. A spinner that mounts with its name is often not read out, so say the wait in a live region that was on the page before the request starts (UiCard `loading` has one). Inside a button, a badge, a switch or a row, set their `loading` instead of placing a spinner yourself.
- Not covered: It does not stop a second click; the button’s `loading` does.
- Proof, in the repository's tests (UiSpinner.spec.ts, not in the package): "The ring turns, at the size its host gives it.", "With a name it is a status with that name; without one it is hidden from a screen reader."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Calm motion

- When: reduced motion is on.
- Props: the system setting `prefers-reduced-motion: reduce`.
- Guarantee: The spinner continues turning, slowed to one rotation every 1.6 seconds.
- Without it: The ring stops with every other animation, and the screen looks frozen.
- Code: `<UiSpinner />`
- Your part: Nothing. A loading indicator of your own keeps moving only with the `animate-spin` class or the `data-motion-keep` attribute; otherwise it stops with every other animation.
- Proof, in the repository's tests (UiSpinner.spec.ts, not in the package): "It keeps turning, slower, when the system asks for reduced motion."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#calm-motion


The patterns: https://grani.arseni.work/patterns
