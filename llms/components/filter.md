# Filter (`UiFilter`)

> Open filter choices from a toolbar button and narrow a list by one or more groups of options.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/filter

Also called filter dropdown, faceted filter, filter button.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiFilter } from 'grani-ui'

const categories = ref(['food', 'fun'])

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]
</script>

<template>
  <UiFilter v-model="categories" label="Categories" :items="CATEGORIES" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep one option and clear the rest in one press.
- Find what you chose at the top of a long filter.
- Keep Reset in one place.
- Keep nearby buttons and fields in place.
- Clear a search in one step.
- Jump to an option by letter.
- Continue from where you opened the panel.
- See where the app is working.
- Pick with Enter without sending the form.
- Open with keyboard focus where the task begins.
- Pass a group with one press of Tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- With one dimension, nothing. With several sections, pass `count` and clear the sections’ lists when `reset` arrives.
- Set `loading` while the options are loading; with several sections, set it on each UiFilterList. If the options failed to load, set `disabled` and explain the failure on the page.

## Why it works this way

A toolbar button that narrows a list by one dimension, or by several at once. Take it in a table toolbar, after the search.

**Button.** It shows a filter glyph, its label and a chevron. Once something is chosen, the count replaces the glyph in a slot of the same width, on a pale plate (up to 9, then "9+"), so the button keeps its size. Attributes land on the button.

**Panel.** The panel under the button is a UiPopover. Reset stands in its footer under a line and is held while nothing is chosen, so the list above does not move under the pointer when the first box is ticked.

**One dimension.** Pass `items` and `v-model`; the filter counts and resets itself. A value counts once, however often `v-model` holds it. A value with no option among `items` (an option the server dropped, an old link) still counts and still filters: no row shows it, and Reset clears it.

**Several dimensions.** Put UiCard sections in the default slot, each with a UiFilterList and no title (a popover has no heading), and name each list by its `ariaLabel`; a line parts two neighbors, as in every overlay. The slot is read once, when the filter is made: the sections may change, but whether there are any may not. The lists mount only while the panel is open, so the host does the rest: it passes `count`, the number of dimensions with a value (status and channel make 2), holds each list's `loading`, and clears the lists on `reset`.

**Placement.** In a table toolbar's `#start` (UiDataTable `#filters`), after the search and beside UiDateRange. Bind the slot's `size` on it.

**Table.** In UiDataTable's `#filters`, a choice the person changes (a tick, Only, Reset) starts the list on page one, and an empty list the filter narrowed offers "Reset filters"; a value the app sets moves no page.

Options that failed to load. The filter has no error of its own: the host sets `disabled` on it, so the button does not open, and says what failed where the list's own error stands.

### Keyboard

On the button:
- `Tab`: reaches it.
- `Enter` `Space`: open the panel; the focus goes to the list, or to its search when there are six options or more.
In the panel, where the list is one tab stop and Reset the next; from six options up the search takes the list's tab stop, and its cross is one more once it holds text:
- `ArrowDown` `ArrowUp`: move the highlight.
- `Home` `End`: jump.
- `Enter` `Space`: tick.
- `A–Z`: jumps to the first option that starts with the letter.
- `Enter`: in the search, ticks the highlighted row (the first match once there is text) and does not submit a form around the filter.
- `Escape`: clears a search that has text and stays in the panel; otherwise closes the panel and returns the focus to the button, as a pick and close does.

### Screen reader

- Button: the label, "Categories", and, once something is chosen, the count in words after it (", 2 active"; the digit on the badge is hidden), with `aria-haspopup` and `aria-expanded`. An `aria-label` of the caller's replaces the whole name, the count included.
- Panel: a dialog named by the button, the count in words included.
- List: one multi-select listbox named by the label, each option saying whether it is ticked; with sections, each list is named by its `ariaLabel`.
- Nothing found: a status region that is always present and is filled when the search leaves nothing.

### States

Rest, open, something chosen (the count in place of the glyph), Reset held while nothing is chosen, `loading`: a first load in the options' shape, a refresh with the rows held and dimmed; a search from six options and its empty result, several dimensions in sections; the button at `xs`, `sm` and `md`.

### When to use another component

- A period: UiDateRange.
- The columns a table shows: UiTableColumns.
- One value in a form: UiSelect (`multiple` for several).
- Commands: UiMenu.

## Examples

### Many options: a search

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiFilter } from 'grani-ui'

const tags = ref([])

const TAGS = ['Urgent', 'Wholesale', 'Gift', 'Repeat', 'Kiosk', 'Delivery', 'Pickup', 'Office'].map(
  (l) => ({ value: l.toLowerCase(), label: l }),
)
</script>

<template>
  <UiFilter v-model="tags" label="Tags" :items="TAGS" />
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiFilter } from 'grani-ui'

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]

// The count takes the glyph's place: pick and the button keeps its size, at every step.
const sized = { xs: ref(['food']), sm: ref([]), md: ref(['food', 'fun']) }
</script>

<template>
  <UiFilter v-model="sized.xs.value" label="Categories" :items="CATEGORIES" size="xs" />
  <UiFilter v-model="sized.sm.value" label="Categories" :items="CATEGORIES" />
  <UiFilter v-model="sized.md.value" label="Categories" :items="CATEGORIES" size="md" />
</template>

```

### Loading

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiFilter, UiRadioGroup, UiRadio } from 'grani-ui'

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]

// The life of the options' load, switched by hand: a first load has no options yet, a refresh
// keeps them in view.
const listState = ref('loading')

const loadingPick = ref(['transport'])

const loadingItems = computed(() => (listState.value === 'loading' ? [] : CATEGORIES))
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <UiFilter
      v-model="loadingPick"
      label="Categories"
      :items="loadingItems"
      :loading="listState !== 'loaded'"
    />
    <UiRadioGroup v-model="listState" variant="segmented" aria-label="State of the options">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="refreshing">Refreshing</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Several dimensions

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiFilter, UiCard, UiFilterList } from 'grani-ui'

const status = ref(['paid'])

const channel = ref([])

const STATUS = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
]

const CHANNEL = [
  { value: 'web', label: 'Web' },
  { value: 'kiosk', label: 'Kiosk' },
]

// The button counts the dimensions with a value, not every tick.
const chosen = computed(() => Number(status.value.length > 0) + Number(channel.value.length > 0))

function resetAll() {
  status.value = []
  channel.value = []
}
</script>

<template>
  <UiFilter label="Filters" :count="chosen" @reset="resetAll">
    <UiCard><UiFilterList v-model="status" :items="STATUS" ariaLabel="Status" /></UiCard>
    <UiCard><UiFilterList v-model="channel" :items="CHANNEL" ariaLabel="Channel" /></UiCard>
  </UiFilter>
</template>

```

## API

Props:
- `label`: `string` (required) — The dimension, on the button: "Categories".
- `items`: `SelectOption<SelectValue>[]` (default `[]`) — One dimension: its options, as a select's (`SelectOption`).
- `modelValue`: `SelectValue[]` (default `[]`) — One dimension: the chosen values.
- `count`: `number` — Several dimensions: how many of them have a value (status and channel is 2), for the button and Reset. Required with sections: without it the button shows nothing chosen and Reset stays held.
- `loading`: `boolean` (default `false`) — One dimension: the options are on their way. With none yet, rows in their shape; with options in view, they stay, held and dimmed. Several: each list takes its own.
- `align`: `"start" | "center" | "end"` = `start | center | end` (default `"start"`) — Which edge of the button the panel lines up with.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder, as the rest of the toolbar row. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `reset` — Reset was pressed; one dimension clears itself as well.
- `update:modelValue` (`value: SelectValue[]`) — One dimension: the chosen values.

Slots:
- `default` with `Record<string, never>` — Several dimensions: UiCard sections without a title, each with a UiFilterList named by `ariaLabel`. Leave empty for one.

## How it behaves

### Only this

- When: a filter of three options or more is open.
- Props: `items`, `v-model`.
- Guarantee: The highlighted row shows Only at its end; it, or Alt+Enter, keeps that option alone and unticks the others. A fixed option stays as it is.
- Without it: Unticking every other box, one by one, to see a single value.
- Code: `<UiFilter v-model="statuses" label="Status" :items="STATUSES" />`
- Your part: Nothing.
- Not covered: A filter of one or two options offers no Only: a single tick does the same.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "Only on the highlighted row keeps that option alone"
- Pattern for all components: https://grani.arseni.work/patterns/finding#only-this

### Chosen first

- When: the panel of a filter of six options or more opens with something chosen.
- Props: `items`, `v-model`.
- Guarantee: The chosen options stand first, in their own order, and the rest follow; the order is the one the panel opened with, so nothing moves while you tick.
- Without it: The ticks of a long filter scattered down the list, below its fold.
- Code: `<UiFilter v-model="tags" label="Tags" :items="TAGS" />`
- Your part: Nothing.
- Not covered: Five options or fewer keep their order, which is read at a glance and may mean something, such as Paid, Due, Overdue.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "a long filter opens with the chosen options at its top"
- Pattern for all components: https://grani.arseni.work/patterns/finding#chosen-first

### Reset held

- When: the panel is open and you tick its first box.
- Props: none.
- Guarantee: Reset is present below the divider from the moment the panel opens. It stays disabled until an option is selected, then becomes available without moving any rows.
- Without it: A Clear link that appears above the list at the first tick, so the rows move down under the pointer.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />`
- Your part: With one dimension, nothing. With several sections, pass `count` and clear the sections’ lists when `reset` arrives.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "Reset is in the same place before and after the first tick, held while nothing is chosen"
- Pattern for all components: https://grani.arseni.work/patterns/finding#reset-held

### Steady width

- When: something is chosen in it.
- Props: none.
- Guarantee: The count replaces the filter icon in a slot of fixed width, up to 9 and then “9+”, so the button and everything beside it in the toolbar stay in place.
- Without it: A count added after the label: the button grows at the first tick and pushes the period filter beside it.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "the funnel and the count share one fixed slot, so the width holds", "a count above 9 reads 9+ and is spoken exactly"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### Search clears

- When: it has six options or more, and so a search field.
- Props: none.
- Guarantee: Escape in a search with text empties it and keeps the panel open, with keyboard focus still in the search; the next Escape closes the panel.
- Without it: A plain field in a popover, where the Escape meant for the text closes the whole panel.
- Code: `<UiFilter v-model="tags" label="Tags" :items="TAGS" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "in the panel a search with text clears on Escape, and the panel stays open"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Letter jumps

- When: its list has no search: five options or fewer.
- Props: none.
- Guarantee: A letter moves the highlight to the first option that starts with it; the same letter again goes on to the next one, and from the last match back to the first. Enter or Space then ticks the highlighted option.
- Without it: A column of checkboxes where a letter does nothing, so you press the Down arrow once for each option above the one you want.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />`
- Your part: Nothing.
- Not covered: From six options the list gets a search field, and letters type into the search instead of jumping.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "a letter jumps to the next option that starts with it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#letter-jumps

### Focus comes back

- When: you close the filter’s panel with Escape.
- Props: none.
- Guarantee: Keyboard focus goes back to the filter button, so the next Tab continues along the toolbar from there.
- Without it: Keyboard focus is lost with the closed panel: it falls to the page, a screen reader loses its place, and you look for the button again.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />`
- Your part: Nothing.
- Not covered: If the panel is closed by a click outside it, keyboard focus stays where the click put it.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "Escape closes the panel and returns the focus to the button"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back

### Visible work

- When: the options of a single-group filter are loading.
- Props: `loading`.
- Guarantee: Loading is shown in the options panel: placeholders on a first load, and during a refresh the existing options dimmed and unavailable, with “Updating…”.
- Without it: The panel says “Nothing found” while the options are still on their way.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="kinds" :loading="pending" />`
- Your part: Set `loading` while the options are loading; with several sections, set it on each UiFilterList. If the options failed to load, set `disabled` and explain the failure on the page.
- Not covered: The filter button itself shows no progress indicator: the wait is shown in the panel, where the options are.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "a first load shows rows in the options' shape; a refresh keeps the options, dimmed, and says "Updating…""
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Enter picks

- When: The filter is inside a form and has a search box.
- Props: none.
- Guarantee: Enter in the search box ticks the first match and never submits the form around the filter.
- Without it: In a search box inside a form, Enter submits the form before anything is ticked.
- Code: `<form><UiFilter v-model="tags" label="Tags" :items="TAGS" /></form>`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "Enter in the search does not submit a form around the filter"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-picks

### Focus starts inside

- When: you open the filter’s panel.
- Props: none.
- Guarantee: Start choosing with the arrow keys as soon as the panel opens. With six or more options, focus starts in the search field so you can narrow the list by typing.
- Without it: The panel opens with keyboard focus left on the filter button, and you press Tab before you can choose.
- Code: `<UiFilter v-model="tags" label="Tags" :items="TAGS" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "opened, the focus goes to the list, or to its search from six options up"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### One Tab per group

- When: the filter’s panel is open.
- Props: none.
- Guarantee: Tab reaches the options as one group, or their search field when present. Reset is the next stop when available, so the number of options does not add more Tab presses.
- Without it: Each option is its own checkbox, so twelve categories take twelve presses of Tab before you reach Reset.
- Code: `<UiFilter v-model="kinds" label="Categories" :items="CATEGORIES" />`
- Your part: Nothing.
- Not covered: Once the search holds text, its clear button (the cross) appears and adds one more press of Tab.
- Proof, in the repository's tests (UiFilter.spec.ts, not in the package): "the list is one tab stop, and Reset the next"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
