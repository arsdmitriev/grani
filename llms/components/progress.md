# Progress (`UiProgress`)

> See how much of a task or target is complete when its progress can be measured.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/progress

Also called progress bar, loading bar.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiProgress } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiProgress :value="3200" :max="10000" aria-label="Cushion" />
    <UiProgress :value="7" :max="10" tone="success" class="h-1.5" aria-label="Done" />
    <UiProgress
      :value="14"
      :max="10"
      tone="danger"
      aria-label="Budget"
      value-text="14 of 10, 4 over"
    />
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See upload progress and when it ends.
- See where the app is working.
- Reduce motion without hiding loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Update `value` with the upload’s measured progress. Inside UiDropzone, its `busy` and `progress` values drive the bar for you.
- Update `value` with the measured progress and name the bar with `aria-label`. Use `indeterminate` when the amount completed is unknown.

## Why it works this way

How far work or a target has come, `value` of `max`. Take it when the share is known: an upload, a quota, a goal; for work of unknown length set `indeterminate`.

**Steps.** With `step` it shows one segment per step, filled by whole steps reached; an empty segment is a step still to go.

**Color.** `tone` colors the fill. `variant="thermometer"` colors it by how full it is, from danger to success, and `invert` flips that for "less is better".

**Unknown length.** `indeterminate` is work of unknown length: a band runs along the track, with no number.

**Size.** The host's classes set the size; without them the bar is 8px tall.

**Value.** It is a progressbar with `aria-valuenow`, absent while the value is unknown. `valueText` gives words, and it is what says a value past `max` ("14 of 10, over"), since the number stops at `max`. Name each bar (`aria-label`); unnamed, it is "Progress".

**Marks.** A mark already given is this bar with `:step="1"`; a mark to give is UiScaleInput.

**Placement.** It sits in a table's progress column, as UiDropzone's upload bar, and in a card, under its figure or as its `#divider`.

### Keyboard

Not interactive: it takes no focus. A mark to give is UiScaleInput.

### Screen reader

- Name: a `progressbar` named by the `aria-label` the host gives it, else "Progress"; a host that names it with `aria-labelledby` gets no second name.
- Value: `aria-valuenow` runs from `0` to `max`, and is absent while `indeterminate` or while the value is not a number.
- Value text: `valueText` is read in place of the number and carries a value past `max`.
- Hidden: the fill and the segments.

### States

Empty, part, full and past `max`, where the number stops at `max`. `step` segments, filled by whole steps reached, and a continuous bar again above `maxSegments` or with no step filled. `tone` on the fill. `thermometer` from danger through warning to success, `invert` reversed. `indeterminate`, a band running along the track, which keeps running, slower, under reduced motion. 8px tall without a height class, else the host's height. In forced colors the track is outlined and the fill takes the highlight.

### When to use another component

- A wait in place: UiSpinner.
- Content on its way: UiSkeleton.
- A number: UiCount.
- A change: UiDelta.
- A mark to give: UiScaleInput.

## Examples

### Segments

```vue
<script setup lang="ts">
import { UiProgress } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiProgress
      :value="3"
      :max="10"
      :step="1"
      value-text="3 of 10 payments"
      aria-label="Payments"
    />
    <!-- 4.5 steps reached: four segments filled, the fifth still to go. -->
    <UiProgress :value="450" :max="1200" :step="100" class="h-3" aria-label="Savings" />
    <!-- Thirty steps are past maxSegments (24), a finger cannot tell them apart: continuous again. -->
    <UiProgress :value="12" :max="30" :step="1" value-text="12 of 30 days" aria-label="Days" />
    <!-- No step reached: all-empty segments would read as broken, so the bar is continuous too. -->
    <UiProgress
      :value="0"
      :max="10"
      :step="1"
      value-text="0 of 10 payments"
      aria-label="Payments, none yet"
    />
  </div>
</template>

```

### Thermometer

```vue
<script setup lang="ts">
import { UiProgress } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiProgress
      v-for="v in [1, 4, 7, 10]"
      :key="v"
      :value="v"
      :max="10"
      variant="thermometer"
      :aria-label="`Health, sample ${v}`"
    />
    <UiProgress :value="8" :max="10" variant="thermometer" invert aria-label="Load" />
  </div>
</template>

```

### Tones

```vue
<script setup lang="ts">
import type { Tone } from 'grani-ui'
import { UiProgress } from 'grani-ui'

const tones: Tone[] = ['brand', 'info', 'success', 'warning', 'danger', 'neutral']
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiProgress
      v-for="tone in tones"
      :key="tone"
      :value="60"
      :tone="tone"
      :aria-label="`Tone ${tone}`"
    />
  </div>
</template>

```

### Empty to over

```vue
<script setup lang="ts">
import { UiProgress } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiProgress :value="0" aria-label="Not started" />
    <UiProgress :value="100" tone="success" aria-label="Finished" />
    <!-- Past the target the bar stops full, and the words say by how much. -->
    <UiProgress
      :value="14"
      :max="10"
      tone="warning"
      value-text="14 of 10, over"
      aria-label="Seats"
    />
  </div>
</template>

```

### Unknown length

```vue
<script setup lang="ts">
import { UiProgress } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-2">
    <span class="text-sm text-fg-muted">Uploading statement.pdf</span>
    <UiProgress indeterminate aria-label="Uploading statement.pdf" />
  </div>
</template>

```

## API

Props:
- `value`: `number` (default `Number.NaN`) — The current value, in the units of `max`. Not read while `indeterminate`.
- `max`: `number` (default `100`) — The value at which the bar is full.
- `indeterminate`: `boolean` (default `false`) — Work of unknown length: a band runs along the track, no value is said.
- `step`: `number` — Size of one segment; turns the bar into segments, an empty one reads as one step still to go.
- `maxSegments`: `number` (default `24`) — Above this many segments the bar is continuous again: a finger cannot tell them apart.
- `tone`: `Tone` = `brand | neutral | success | warning | danger | info` (default `"brand"`) — Color of the fill; `brand` by default.
- `variant`: `"plain" | "thermometer"` = `plain | thermometer` (default `"plain"`) — `plain` fills with `tone`; `thermometer` colors the fill by how full it is, danger through warning to success (`utils/scaleRamp`).
- `invert`: `boolean` (default `false`) — Reverses the thermometer: less is better (load, pain, cost).
- `valueText`: `string` — Words for the value instead of a number: "3 of 10 payments". Past `max` they carry the overage, the number stops at `max`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### Upload shown

- When: it is the bar of an upload.
- Props: `value` of `max` bound to the upload's share.
- Guarantee: The bar fills as the file uploads, and its number never goes past the end. The announcement that the upload is done comes from UiDropzone, not from the bar.
- Without it: Nothing moves while the file uploads, and you cannot tell how much is left.
- Code: `<UiDropzone :busy="uploading" :progress="share" />`
- Your part: Update `value` with the upload’s measured progress. Inside UiDropzone, its `busy` and `progress` values drive the bar for you.
- Proof, in the repository's tests (UiProgress.spec.ts, not in the package): "The bar says how far it is, and its fill follows value of max.", "beyond max the number stays at max and valueText carries the real value"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#upload-shown

### Visible work

- When: the amount of work completed is known.
- Props: `value` of `max`, moved as the work goes; `indeterminate` when the length is unknown.
- Guarantee: The bar fills with the measured progress, and a screen reader can read its current value. When progress cannot be measured, an animated band shows ongoing work without implying a percentage.
- Without it: A spinner shows that work is ongoing but cannot tell you how much has finished.
- Code: `<UiProgress :value="sent" :max="size" aria-label="Upload of report.pdf" />`
- Your part: Update `value` with the measured progress and name the bar with `aria-label`. Use `indeterminate` when the amount completed is unknown.
- Not covered: It does not estimate progress: the bar is only as accurate as the `value` it receives.
- Proof, in the repository's tests (UiProgress.spec.ts, not in the package): "The bar says how far it is, and its fill follows value of max.", "Work of unknown length runs a band along the track and says no number."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Calm motion

- When: the work has an unknown length and reduced motion is on.
- Props: `indeterminate`, and the system setting `prefers-reduced-motion: reduce`.
- Guarantee: The band keeps running along the track, once every 1.6 seconds instead of 1.2.
- Without it: The band stops partway along the track, and the work looks stuck.
- Code: `<UiProgress indeterminate aria-label="Uploading" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiProgress.spec.ts, not in the package): "The running band keeps running, slower, when the system asks for reduced motion."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#calm-motion


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
