# Pagination (`UiPagination`)

> Move between pages with Previous, Next and page numbers below a list or table.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/pagination

Also called pager, page navigation.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

const page = ref(1)
</script>

<template>
  <UiPagination v-model:page="page" :page-size="10" :total="50" class="text-center" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- Start a new search on the first page.
- Land on a page with records after a delete.
- Keep the page arrows under the pointer.
- Keep turning pages from the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the list’s loading flag as `loading`, from the moment the page is requested until it has arrived.
- Set `v-model:page` to 1 when the search or the sort changes; UiDataTable does it for you.
- Set the page to the last one when the total drops below it; UiDataTable does this for you.
- Set `loading` from the page request until it finishes. Use `disabled` when paging is unavailable altogether; it disables the arrows.

## Why it works this way

Page numbers with previous and next arrows. Take it under a list that pages, beside the count.

What it owns. It knows the total and the page size and asks for a page, nothing else; the list owns the data and the page size.

**Placement.** In the footer of a UiDataTable, in the corner beside the count ("1–25 of 57").

**Count.** The page count is max(1, ceil(total / pageSize)); one page renders nothing.

Out of range. A page that is out of range or unreadable is drawn as the nearest one, and a click is clamped to the range. The pager draws; it does not ask: on a list that shrank (a delete, a filter), the app sets the page to the last one, as UiDataTable does.

**Loading.** While a page is on its way the app passes `loading`: the arrow that asked shows a spinner and keeps the focus, the other arrow is off, the numbers are held but keep the focus, and a press asks nothing. A number that asked shows the spinner in place of its digits, in a slot of the same width. A click on the current page asks nothing either. `disabled` is a row that cannot page at all, not a load.

**Steady row.** The row holds still. Once the pages do not fit, it always shows the same number of slots (a gap never hides a single page), and every number is as wide as the widest, so the arrows stay under the pointer.

**Narrow box.** It fills the box it is given, as wide as its parent or the rest of a row, and draws its row at the start of it: `text-center` or `text-end` on it moves the row. Where that box is too narrow for the numbers (20rem at `xs`, 24rem at `sm`, 28rem at `md`, a container query, not the screen; wider as the last page gains digits past two), they give way to "3 / 20" between the arrows. A number that had the focus hands it to "3 / 20".

### Keyboard

- `Tab`: walks the previous arrow, each page number and the next arrow; an arrow at its end is disabled and skipped.
- `Enter` `Space`: press the arrow or the number, which are buttons.
While `loading` the pressed arrow keeps the focus with its spinner, and the numbers stay in the Tab order (`aria-disabled`), so a press that starts a load keeps the focus in the row. An arrow that turns off at its end once the page has come hands the focus to the current page, or to "3 / 20" in the compact row; so does an arrow under the focus when the row turns `disabled`.

### Screen reader

- Landmark: a navigation landmark named "Pagination", or by the caller's `aria-label`; a second pager on the page takes one of its own, so the two landmarks are told apart.
- Arrows: "Previous page" and "Next page".
- Numbers: every number is "Page N", the current one is `aria-current="page"`, and held numbers are `aria-disabled`.
- Page change: a status region, always there, says "Page N of M" when the page changes, in the wide row and the compact one alike; the numbers are grouped as the app's language does.
- Compact label: "3 / 20" is read as "Page 3 of 20" when it takes the focus.
- Loading: the pressed arrow or number says busy (`aria-busy`).

### States

Every page while they fit, the ends with a window and gaps, the first and the last page with an arrow inert, `loading` with a spinner on the pressed arrow, `disabled`, `compact` and the narrow row with "N / M", a stale page past the range drawn as the last; three steps of the ladder. One page draws nothing.

### When to use another component

- A list that loads and owns its page: UiDataTable around the table.
- Older events at the end of a timeline: UiLog with `hasMore`.
- Views of one page: UiTabs.

## Examples

### Many pages

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

const far = ref(12)
</script>

<template>
  <UiPagination v-model:page="far" :page-size="10" :total="400" class="text-center" />
</template>

```

### Compact

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

const compactPage = ref(1)
</script>

<template>
  <div class="flex w-64 items-center justify-between gap-3 text-sm text-fg-muted">
    <span>{{ (compactPage - 1) * 10 + 1 }}–{{ compactPage * 10 }} of 50</span>
    <UiPagination
      v-model:page="compactPage"
      :page-size="10"
      :total="50"
      compact
      class="text-end"
    />
  </div>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

// The list loads for a moment after each page is asked: the pressed arrow spins and keeps the
// focus, and a second press asks nothing.
const loadingPage = ref(2)

const loading = ref(false)

function ask(next: number) {
  loadingPage.value = next
  loading.value = true
  setTimeout(() => (loading.value = false), 900)
}
</script>

<template>
  <UiPagination
    :page="loadingPage"
    :page-size="10"
    :total="400"
    class="text-center"
    :loading="loading"
    @update:page="ask"
  />
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

const sized = { xs: ref(3), sm: ref(3), md: ref(3) }
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <UiPagination
      v-model:page="sized.xs.value"
      :page-size="10"
      :total="200"
      size="xs"
      class="text-center"
    />
    <UiPagination
      v-model:page="sized.sm.value"
      :page-size="10"
      :total="200"
      class="text-center"
    />
    <UiPagination
      v-model:page="sized.md.value"
      :page-size="10"
      :total="200"
      size="md"
      class="text-center"
    />
  </div>
</template>

```

### Stale page

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UiPagination } from 'grani-ui'

// The list shrank to five pages under page 9: the pager draws the last one, and the app moves its
// page there, as UiDataTable does, so the next request names a page that exists.
const stale = ref(9)

const lastPage = 5

onMounted(() => (stale.value = Math.min(stale.value, lastPage)))
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <UiPagination v-model:page="stale" :page-size="10" :total="50" class="text-center" />
    <p class="text-xs text-fg-muted">
      The app held page 9 of a list that now has 5; it set the page to {{ stale }}.
    </p>
  </div>
</template>

```

### One page

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPagination } from 'grani-ui'

const single = ref(1)
</script>

<template>
  <div class="flex w-64 items-center justify-between gap-3 text-sm text-fg-muted">
    <span>1–7 of 7</span>
    <UiPagination v-model:page="single" :page-size="10" :total="7" />
  </div>
  <p class="text-xs text-fg-muted">Seven rows fit on one page: the pager draws nothing.</p>
</template>

```

## API

Props:
- `page`: `number` (required) — Current page, from 1 (`v-model:page`).
- `pageSize`: `number` (required) — Records per page; the page count is derived from it and `total`. Changing it is not this component's job.
- `total`: `number` (required) — Total records.
- `compact`: `boolean` (default `false`) — "N / M" instead of page numbers, for a narrow row.
- `siblings`: `number` (default `1`) — Pages shown on each side of the current one.
- `boundary`: `number` (default `1`) — Pages always shown at each end.
- `loading`: `boolean` (default `false`) — A page is on its way: the pressed arrow shows a spinner and keeps the focus, the numbers are held, and a press asks nothing. Pass the list's loading flag.
- `disabled`: `boolean` (default `false`) — The row cannot page at all: the arrows are off, the numbers are held. A load is `loading`.
- `size`: `ControlSize` = `xs | sm | md` — Control size shared by every button in the row. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `update:page` (`page: number`) — Asks the parent for this page, clamped to the range; the parent applies it.

## How it behaves

### One press, one request

- When: a page is loading.
- Props: `loading`.
- Guarantee: The arrow or page number you pressed shows a spinner and keeps keyboard focus while the page loads. Further presses are ignored until loading finishes, and the page numbers stay where they were.
- Without it: Next takes every press: a double press asks twice and skips a page.
- Code: `<UiPagination v-model:page="page" :page-size="25" :total="total" :loading="loading" />`
- Your part: Pass the list’s loading flag as `loading`, from the moment the page is requested until it has arrived.
- Not covered: Without `loading`, nothing holds a second press: two presses a moment apart ask for two pages.
- Proof, in the repository's tests (UiPagination.spec.ts, not in the package): "disabled holds the whole row: arrows off, numbers held but focusable, nothing asked", "while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing", "a number pressed while its page loads shows a spinner in place of its digits and says busy"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### From page one

- When: the list moves the page back to one.
- Props: none.
- Guarantee: Page one is marked as the current page, Previous is off, and a screen reader hears “Page 1 of 6”.
- Without it: The pager still marks page 4 while the list starts over.
- Code: `<UiPagination v-model:page="page" :page-size="25" :total="total" />`
- Your part: Set `v-model:page` to 1 when the search or the sort changes; UiDataTable does it for you.
- Not covered: The pager does not know the search: it shows the page it is given.
- Proof, in the repository's tests (UiPagination.spec.ts, not in the package): "a page set back to one from outside is marked current, Previous is off, and the change is said"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-from-page-one

### Last page lands

- When: the list has shrunk below the current page.
- Props: none.
- Guarantee: The pager shows the last page that exists as the current one, so a page number is always marked and Next is off at the end.
- Without it: The pager shows page 3 of 2 as requested: no page number is marked as current, and Next leads nowhere.
- Code: `<UiPagination v-model:page="page" :page-size="25" :total="total" />`
- Your part: Set the page to the last one when the total drops below it; UiDataTable does this for you.
- Not covered: The pager adjusts its display only. It does not change `v-model:page` or load records; the app must update the page value and data.
- Proof, in the repository's tests (UiPagination.spec.ts, not in the package): "a stale page beyond the range renders as the last page"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#last-page-lands

### Arrows hold still

- When: there are more pages than fit.
- Props: none.
- Guarantee: The Previous and Next arrows stay in place as you change pages. The page slots keep a constant count and are wide enough for the largest page number, such as four digits for 1,200 pages. The compact label, such as “3 / 20”, also reserves the width of its widest value.
- Without it: Each number is as wide as its digits and the window of pages grows and shrinks, so the Next arrow moves out from under the pointer between clicks.
- Code: `<UiPagination v-model:page="page" :page-size="25" :total="total" />`
- Your part: Nothing.
- Not covered: When the pager’s container is too narrow, the page numbers are replaced by a compact label between the arrows. This depends on the space given to the pager, not the screen size. Larger page numbers need more space.
- Proof, in the repository's tests (UiPagination.spec.ts, not in the package): "the row holds the same number of slots on every page", "every number is as wide as the widest, and a four-digit total holds the arrows", "the compact label holds the width of its widest "N / M", and the gap the numbers' text size"
- Pattern for all components: https://grani.arseni.work/patterns/finding#pager-holds-still

### Focus kept

- When: you page with the keyboard through a list that loads.
- Props: `loading`.
- Guarantee: The arrow or page number you pressed keeps keyboard focus while the page loads. When an arrow becomes disabled at the end, focus moves to the current page number or the compact label, such as “3 / 20”; it also moves there when a narrow container replaces the page numbers with that label. If the whole pager becomes `disabled`, focus moves from the disabled arrow to the current page.
- Without it: The arrow turns off while the page loads, keyboard focus is lost, and you have to find the page controls again.
- Code: `<UiPagination v-model:page="page" :page-size="25" :total="total" :loading="loading" />`
- Your part: Set `loading` from the page request until it finishes. Use `disabled` when paging is unavailable altogether; it disables the arrows.
- Proof, in the repository's tests (UiPagination.spec.ts, not in the package): "keyboard paging on a loading list keeps the focus inside the pager", "while loading, the pressed arrow keeps the focus with a spinner, the other is off, and a press asks nothing", "compact: an arrow that goes inert hands the focus to the label, also while disabled"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#pager-keeps-focus


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
