# Truncate (`UiTruncate`)

> Keep a long value on one line with an ellipsis, and reveal the full text on hover or tap when it does not fit.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/truncate

Also called ellipsis, text overflow, truncated text.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [Tooltip](https://grani.arseni.work/components/tooltip).

## Use

```vue
<script setup lang="ts">
import { UiCard, UiTruncate } from 'grani-ui'
</script>

<template>
  <UiCard :padded="false" class="w-56">
    <div class="flex flex-col divide-y divide-border">
      <UiTruncate text="Contoso Pharmaceuticals and Laboratories" class="px-4 py-2 text-sm" />
      <UiTruncate text="Fabrikam" class="px-4 py-2 text-sm" />
      <UiTruncate text="Blue Yonder Airlines, Lisbon office" class="px-4 py-2 text-sm" />
    </div>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Read the full text when a label is shortened.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the full text in `text` and give the component the width it has. Do not cut text by hand with the `truncate` class and a `title`.

## Why it works this way

One line of text cut with an ellipsis, its whole text in a UiTooltip while it is cut. Take it for a name or a title in a narrow place: a table cell, a list row, a file name.

**Tooltip.** While the text is really cut, the whole text shows in the tooltip on hover and tap, as UiDateCell shows the full date; text that fits has no tooltip. The cut is measured, not assumed: when a column widens or the text changes, it is measured again, and the tooltip follows.

**Props.** `text` is the only prop; markup in a slot handles its own cut. The root is a block `<span>` with no tab stop, and attributes land on it.

### Keyboard

No tab stop: the span is not focusable, so the tooltip opens on hover and on tap, not from the keyboard; for the keyboard, put a control beside it that leads to the whole text.

### Screen reader

- Text: the whole text, always: the cut is CSS, and the span holds every character.
- Tooltip: while shown, it describes the span (`aria-describedby`) with the same words again.

### States

Fits, with no tooltip and no native `title`; cut, with the whole text in the tooltip on hover and tap. The cut is measured on mount, on resize, when a web font arrives and when `text` changes, with one pixel of slack; an empty text is a cut of nothing.

### When to use another component

- Markup in a slot: it handles its own cut (`truncate` on the element).
- A date: UiDateCell.
- The label of a badge: UiBadge cuts it itself.
- Text that may wrap: plain text.

## Examples

### Fits or cut

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiTruncate, UiRadioGroup, UiRadio } from 'grani-ui'

const width = ref<'narrow' | 'wide'>('narrow')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <!-- The same names at two widths: the cut, and its tooltip, come and go with the room. -->
    <UiCard :padded="false" :class="width === 'narrow' ? 'w-40' : 'w-96'">
      <div class="flex flex-col divide-y divide-border">
        <UiTruncate text="Contoso Pharmaceuticals and Laboratories" class="px-4 py-2 text-sm" />
        <UiTruncate text="Fabrikam" class="px-4 py-2 text-sm" />
      </div>
    </UiCard>
    <UiRadioGroup v-model="width" variant="segmented" aria-label="Width of the card">
      <UiRadio value="narrow">Narrow</UiRadio>
      <UiRadio value="wide">Wide</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## API

Props:
- `text`: `string` (required) — The text; the whole of it goes to the tooltip while it is cut.
Attributes are placed by the component itself: its description says where.

## How it behaves

### Whole text

- When: one line of text in a narrow place.
- Props: `text`.
- Guarantee: Hover or tap a shortened label to read its full text. The component measures whether it fits and checks again when the text or available space changes. Text that fits has no tooltip or native `title`.
- Without it: An ellipsis and nothing more: the end of the name is gone, and the only way to read it is to widen the window.
- Code: `<UiTruncate :text="file.name" />`
- Your part: Pass the full text in `text` and give the component the width it has. Do not cut text by hand with the `truncate` class and a `title`.
- Not covered: The text is not a Tab stop, so a keyboard cannot open this tooltip. If people need the full value to complete a task, provide a nearby button or link that opens it.
- Proof, in the repository's tests (UiTruncate.spec.ts, not in the package): "A cut text keeps its whole in a tooltip, while the cut is real.", "Text that fits gets no tooltip, and no native title either.", "The cut is measured again when the text changes."
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text


The patterns: https://grani.arseni.work/patterns
