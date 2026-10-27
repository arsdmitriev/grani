# Skeleton (`UiSkeleton`)

> Show where content will appear while it loads, holding its space so the page around it moves less.

A component of grani-ui 0.1.0. Status, stable, since 0.1.0. Page: https://grani.arseni.work/components/skeleton

Also called loading placeholder, shimmer, content placeholder.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiRadioGroup, UiRadio } from 'grani-ui'

const card = ref('loading')
</script>

<template>
  <!-- A card, a table and a drawer draw it themselves under `loading`. -->
  <div class="flex w-full flex-col items-center gap-4">
    <UiCard
      title="Release notes"
      description="What changed this week."
      :loading="card === 'loading'"
      class="w-full max-w-xs"
    >
      <p v-if="card === 'loaded'" class="text-sm text-fg-muted">
        Invoices export to CSV, the period picker remembers the last range, and the search in a
        list clears with Escape.
      </p>
    </UiCard>
    <UiRadioGroup v-model="card" variant="segmented" aria-label="State of the card">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See where the app is working.
- Keep nearby content in place while loading.
- Reduce motion without hiding loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Show it from the start of the request until the answer, and never next to a spinner for the same wait.
- Give it the size and shape of the content to come, and remove it when the data arrives. Inside a card, a table, a drawer or a chart card, set their `loading` instead.

## Why it works this way

The shape of content on its way. Take it in a block of your own while its first load runs; a card, a table, a drawer and a chart card draw their own under `loading`.

**Size.** Size and shape come from the classes the host passes (`h-4 w-32`, `h-64 w-full`, `rounded-pill` for an avatar); without them it has no size. A line of text is an `inline-block h-3 align-middle` inside a block of the text's size, which keeps the line's height. A page skeleton is several of these, mirroring the real layout.

**Decoration.** It is decoration, and its shimmer is the sign that the first load runs: under reduced motion it keeps shimmering, slower, since a still gray block reads as a broken page. The host's live region announces the loading state.

**By hand.** UiCard, UiTable, UiDataTable, UiCrudDrawer and UiChartCard (with its charts) draw it themselves under `loading`. Place it by hand only in blocks of your own, which bring their own `role="status"` and drop it when the data comes.

### Keyboard

Not interactive: it takes no focus and holds no control.

### Screen reader

- Hidden: `aria-hidden`; the loading state is announced by the host's live region, a `role="status"` the host brings and drops when the data comes.

### States

One: a shimmering block, slower under reduced motion, in the size and shape the host's classes give it; without them it has no size.

### When to use another component

- An action in flight: UiSpinner.
- Work measured or of unknown length: UiProgress.
- Nothing there or a failed load: UiNoData.
- Loading a card, a table, a drawer or a chart card: UiCard, UiTable, UiCrudDrawer and UiChartCard draw it themselves under `loading`.

## Examples

### By hand

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiList, UiListItem, UiSkeleton, UiAvatar, UiRadioGroup, UiRadio } from 'grani-ui'

const people = [
  { name: 'Anna Petrova', email: 'anna@example.com' },
  { name: 'Ivan Sidorov', email: 'ivan@example.com' },
  { name: 'Maria Kova', email: 'maria@example.com' },
]

const rows = ref('loading')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <!-- Hand-made, so it says its own loading: a region that stays, words only while it loads. -->
    <span class="sr-only" role="status">{{
      rows === 'loading' ? 'Loading the people…' : ''
    }}</span>
    <UiCard v-if="rows === 'loading'" :padded="false" aria-busy="true" class="w-full max-w-xs">
      <UiList>
        <UiListItem v-for="i in 3" :key="i">
          <template #media><UiSkeleton class="h-8 w-8 rounded-pill" /></template>
          <div class="text-sm">
            <div><UiSkeleton class="inline-block h-3 w-28 align-middle" /></div>
            <div><UiSkeleton class="inline-block h-3 w-40 align-middle" /></div>
          </div>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiCard v-else :padded="false" class="w-full max-w-xs">
      <UiList>
        <UiListItem
          v-for="person in people"
          :key="person.email"
          :title="person.name"
          :description="person.email"
        >
          <template #media><UiAvatar :name="person.name" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiRadioGroup v-model="rows" variant="segmented" aria-label="State of the rows">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Blocks

```vue
<script setup lang="ts">
import { UiSkeleton } from 'grani-ui'
</script>

<template>
  <UiSkeleton class="h-4 w-32" />
  <UiSkeleton class="h-9 w-40" />
  <UiSkeleton class="h-10 w-10 rounded-pill" />
</template>

```

## API

No props, events or slots of its own. Anything else lands on the root element: native attributes, aria-*, data-testid.

## How it behaves

### Visible work

- When: on a first load whose layout is known.
- Props: shown from the request to its answer.
- Guarantee: Placeholders show that content is still loading and where it will appear; their shimmer shows that loading is in progress.
- Without it: A blank space that looks empty rather than loading.
- Code: `<UiSkeleton class="h-4 w-48" />`
- Your part: Show it from the start of the request until the answer, and never next to a spinner for the same wait.
- Proof, in the repository's tests (UiSkeleton.spec.ts, not in the package): "A hidden block in the shape its host gives it."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Stable dimensions

- When: on a first load.
- Props: the host gives it the size and shape of what comes.
- Guarantee: The placeholder reserves space in the shape of the expected content, so when the content replaces it nothing nearby moves, as long as the dimensions match.
- Without it: The space stays empty, and when the content arrives everything below it jumps down.
- Code: `<UiSkeleton class="h-4 w-48" />`
- Your part: Give it the size and shape of the content to come, and remove it when the data arrives. Inside a card, a table, a drawer or a chart card, set their `loading` instead.
- Not covered: It does not announce that the page is loading; the surrounding component’s `role="status"` does.
- Proof, in the repository's tests (UiSkeleton.spec.ts, not in the package): "A hidden block in the shape its host gives it."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Calm motion

- When: reduced motion is on.
- Props: the system setting `prefers-reduced-motion: reduce`.
- Guarantee: The placeholder animation slows from one pulse every 2 seconds to one every 3 seconds.
- Without it: The placeholders stand still and gray, and the page looks stalled rather than loading.
- Code: `<UiSkeleton class="h-4 w-32" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiSkeleton.spec.ts, not in the package): "It keeps shimmering, slower, when the system asks for reduced motion."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#calm-motion


The patterns: https://grani.arseni.work/patterns
