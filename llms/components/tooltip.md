# Tooltip (`UiTooltip`)

> Get a short hint on hover, keyboard focus or tap; anything essential stays on the page outside the tooltip.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/tooltip

Also called hint, hover hint.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiTooltip, UiButton } from 'grani-ui'
</script>

<template>
  <UiTooltip content="Above, the default" side="top">
    <UiButton variant="outline">top</UiButton>
  </UiTooltip>
  <UiTooltip content="Below" side="bottom">
    <UiButton variant="outline">bottom</UiButton>
  </UiTooltip>
  <UiTooltip content="On the left, for a narrow column" side="left">
    <UiButton variant="outline">left</UiButton>
  </UiTooltip>
  <UiTooltip content="On the right, clear of the rows below" side="right">
    <UiButton variant="outline">right</UiButton>
  </UiTooltip>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Close only the top layer with Escape.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Name an icon button with `ariaLabel`, and use the hint to add what the name does not say.

## Why it works this way

A short text hint beside its trigger. Take it for detail a dense row has no room for.

**Showing.** It shows on hover and on keyboard focus, but not when a script gives the focus back after a click. When the pointer moves from one trigger to the next, the next hint opens at once. A tap shows it on a trigger that only shows something (a cut text, a date); a tap on a button that opens something only opens it. A press outside hides the hint and still reaches the window under it. A long word wraps inside it.

**Content.** Text only. It is never the only place for what must be read by a person who cannot reach it: a natively disabled button takes no focus, so its reason is visible text beside it; UiButton and UiIconButton with `disabledReason` keep the focus and say their reason in one.

**Trigger.** Attributes and listeners set on the tooltip reach the trigger along with the trigger's own, so it can stand inside a popover's or a menu's `#trigger`. The trigger is one element or a single-root component (not a fragment, not another tooltip) and should be focusable (a static badge takes `tabindex="0"`). When the panel is pushed aside, its tail stays on the trigger; a trigger that goes away takes the hint with it. The pointer may cross onto the tooltip (WCAG 1.4.13).

**Placement.** UiTruncate and UiDateCell stand on it; UiButton and UiIconButton draw the same hint for the reason they are off. It names an icon button where a sighted user needs the name (the sidebar's toggle, a table's columns).

### Keyboard

Keyboard focus on the trigger shows it at once, and blur hides it; a focus a script gives back after a click does not show it.
- `Escape`: hides it first and goes no further, so a window under it stays until the next `Escape`.
The hint itself takes no focus and holds nothing focusable.

### Screen reader

- Role: a `tooltip`.
- Description: while shown, it describes the trigger (`aria-describedby`), next to any description you set; with no `content` there is none.
- Repeated words: a hint that repeats the trigger's own name (an icon button's `ariaLabel`) or a description it already has (a disabled button's reason) is not wired, so the words are read once.
- Tail: hidden.

### States

Hidden; shown after a short delay on hover, at once on keyboard focus, on a tap on a touch screen, and at once when the pointer moves from one trigger to the next. On one of four sides (`side`), flipped when that side has no room, and pushed aside at the screen edge with the tail kept on the trigger; a `left` or `right` hint with room on neither side goes below or above, never over its trigger. Long text and a long word wrap. One hint on the page at a time.

### When to use another component

- A hint with a link or a control: UiPopover.
- The reason a button is off: UiButton or UiIconButton `disabledReason`, which keeps the focus and says it; for a button natively `disabled`, visible text beside it.
- A cut value in a cell: UiTruncate, built on it.
- A date: UiDateCell, built on it.

## Examples

### Dense

```vue
<script setup lang="ts">
import { UiTooltip, UiBadge } from 'grani-ui'
</script>

<template>
  <UiTooltip content="Difficulty 7 of 10">
    <UiBadge tabindex="0" tone="warning" label="7" />
  </UiTooltip>
  <UiTooltip content="Rating 4 of 5">
    <UiBadge tabindex="0" tone="success" label="4" />
  </UiTooltip>
</template>

```

### Long

```vue
<script setup lang="ts">
import { UiTooltip, UiButton } from 'grani-ui'
</script>

<template>
  <UiTooltip
    content="Counts only the rows in the current filter and period; deleted records are left out, refunds are subtracted on the day they post."
  >
    <UiButton variant="outline">How is the total counted?</UiButton>
  </UiTooltip>
  <UiTooltip content="inv_7f3a9c2e1b4d8f6a0c5e7b9d2f4a6c8e0b1d3f5a7c9e">
    <UiButton variant="outline">The invoice id</UiButton>
  </UiTooltip>
</template>

```

### Popover

```vue
<script setup lang="ts">
import { Columns3 } from '@lucide/vue'
import { UiPopover, UiTooltip, UiIconButton } from 'grani-ui'
</script>

<template>
  <UiPopover>
    <template #trigger>
      <UiTooltip content="Columns">
        <UiIconButton :icon="Columns3" variant="outline" ariaLabel="Columns" />
      </UiTooltip>
    </template>
    <p class="text-sm text-fg-muted">The panel the button opens; a tap only opens it.</p>
  </UiPopover>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex items-center gap-3">
    <UiButton disabled>Export</UiButton>
    <span class="text-sm text-fg-muted">Pick a period to export.</span>
  </div>
</template>

```

### Edge

```vue
<script setup lang="ts">
import { UiTooltip, UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex w-full justify-end">
    <UiTooltip content="Pushed back inside the screen, its tail still on the button" side="right">
      <UiButton variant="outline">At the right edge</UiButton>
    </UiTooltip>
  </div>
</template>

```

### Window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RotateCcw } from '@lucide/vue'
import { UiButton, UiModal, UiTooltip, UiIconButton } from 'grani-ui'

const columnsOpen = ref(false)
</script>

<template>
  <UiButton variant="outline" @click="columnsOpen = true">Edit columns</UiButton>
  <UiModal v-model:open="columnsOpen" title="Columns">
    <div class="flex items-center gap-2">
      <span class="flex-1 text-sm text-fg-muted">Client, Total, Due</span>
      <UiTooltip content="Back to the default columns">
        <UiIconButton :icon="RotateCcw" variant="ghost" ariaLabel="Reset" />
      </UiTooltip>
    </div>
    <p class="mt-3 text-xs text-fg-subtle">
      Tab to Reset: the first Escape takes its hint, the second closes the window.
    </p>
  </UiModal>
</template>

```

## API

Props:
- `content`: `string` (default `""`) — The hint. Empty or absent means no tooltip.
- `side`: `"top" | "bottom" | "left" | "right"` = `top | bottom | left | right` (default `"top"`) — Preferred side; it flips when that side has no room, and a side hint with room on neither side goes below or above.
Attributes are placed by the component itself: its description says where.

Slots:
- `default` with `Record<string, never>` — The trigger: one element or a single-root component the hint describes. It should be focusable.

## How it behaves

### Escape, top first

- When: a hint is shown inside a window, a drawer or a panel.
- Props: none: every UiTooltip.
- Guarantee: The first Escape hides the hint and goes no further; the window under it closes only with the next Escape.
- Without it: Escape meant for a hint closes the whole window, and what you typed in it is lost.
- Code: `<UiTooltip content="Back to the default columns">
  <UiButton variant="ghost">Reset</UiButton>
</UiTooltip>`
- Your part: Nothing.
- Proof, in the repository's tests (UiTooltip.spec.ts, not in the package): "Escape on a shown tooltip inside a modal hides the hint and leaves the modal open"
- Pattern for all components: https://grani.arseni.work/patterns/closing#escape-top

### One name

- When: its hint repeats the name of its trigger, as on an icon button.
- Props: `content` equal to the trigger's `ariaLabel`.
- Guarantee: When the hint matches the trigger's `aria-label` letter for letter, it is not connected as a description, so a screen reader announces the name once; a hint that adds something is announced as the trigger's description.
- Without it: A screen reader announces “Columns, Columns”: the name, then the same word as its description.
- Code: `<UiTooltip content="Columns">
  <UiIconButton :icon="Columns3" ariaLabel="Columns" />
</UiTooltip>`
- Your part: Name an icon button with `ariaLabel`, and use the hint to add what the name does not say.
- Proof, in the repository's tests (UiTooltip.spec.ts, not in the package): "a hint equal to the trigger name is not wired as its description"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

## Built on it

- [Truncate](https://grani.arseni.work/components/truncate): Keep a long value on one line with an ellipsis, and reveal the full text on hover or tap when it does not fit.
