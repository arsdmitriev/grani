# Filter list (`UiFilterList`)

> Narrow results by ticking options that apply at once; a search field appears when there are six or more.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/filter-list

Also called checkbox list, multi-select list, option list.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiFilterList } from 'grani-ui'

const few = ref(['food'])

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'fun', label: 'Fun' },
]
</script>

<template>
  <div class="w-64">
    <UiFilterList v-model="few" :items="CATEGORIES" ariaLabel="Categories" />
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Finish a word in any script before it is sent.
- See where the app is working.
- Clear a search in one step.
- Notice when there are more options below.
- Jump to an option by letter.
- Pick with Enter without sending the form.
- Open with keyboard focus where the task begins.
- Keep keyboard focus where you are working.
- Pass a group with one press of Tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set `loading` while the options are loading.
- Place the list inside a UiPopover, UiFilter or UiTableColumns.

## Why it works this way

The checklist of one filter dimension, where each tick applies at once. Take it inside the panel of a UiFilter or UiTableColumns.

**Behavior.** It follows UiSelect with `multiple`: a listbox of check-mark rows that runs edge to edge across the panel.

**Search.** With more than five options, a search row at the top narrows the list, by label and by an option's `keywords`, and says when nothing is found; it leaves the accents of Latin and Cyrillic letters out, so "munchen" finds München. Its cross clears the text. When the options drop to five or fewer the search leaves with its text, and the focus it held goes to the list; when they grow to six the focus the list held goes into the new search.

**Chosen first.** From six options, the ones chosen when the list opens stand at its top, in their own order, so a long list shows what is chosen without scrolling; the order stays while the list is open, so a tick never moves a row under the pointer. Five or fewer keep their order, which is read at a glance and may mean something. With `groups`, a name stands over the chosen and over the rest, a line between them, so the order explains itself.

**Only.** The highlighted row (the one under the pointer, the one a tap ticked, the one the keys lit) offers "Only", which keeps that option alone and unticks the others; a fixed option stays as it is. A list of one or two options offers none: a single tick does the same.

**Options.** `loading` with no options yet draws five rows in their shape, a box and a line; a list of up to five takes their place, a longer one adds its search above them, since the count is not known before they come. With options in view it is a refresh: they stay, held and dimmed. An option can be `disabled` (shown, but fixed as it is) and can carry a `description` at its end. The highlight stays on a row that is drawn when the options change. The chosen values should be among the options: a value with no option has no row.

**Attributes.** `class` and `style` land on the root, other attributes on the listbox.

**Placement.** In the panel of a UiPopover (UiFilter, UiTableColumns), alone or as a flat UiCard section. It needs a name: `ariaLabel`, or the title of its card; in development an unnamed list warns.

### Keyboard

The list is one tab stop, or its search is when it has one.
In the list:
- `ArrowDown` `ArrowUp`: move the highlight.
- `Home` `End`: jump.
- `Enter` `Space`: tick the highlighted row; a `Space` after letters typed over the list belongs to the word.
- `Alt` `Enter`: keep the highlighted option alone, unticking the others.
- `A–Z`: jumps to the first option that starts with the letter; the same letter again goes on to the next, and letters typed together find a word.
In the search:
- `ArrowDown` `ArrowUp`: move the highlight too.
- `Enter`: ticks the first match.
- `Alt` `Enter`: keeps the highlighted option alone.
- `Escape`: clears the text and stays in the panel.
- `Space` `A–Z`: type.
A press on a row ticks it without taking the focus.

### Screen reader

- List: a multi-select listbox (`aria-multiselectable`) named by `ariaLabel`, or by the title of the UiCard it stands in.
- Row: an option that says whether it is ticked (`aria-selected`), is held when `disabled` or `loading` (`aria-disabled`), and has its `description` read at its end.
- Highlight: `aria-activedescendant`, on the list or on the search, which controls the list (`aria-controls`).
- Only: the list and the search carry `aria-keyshortcuts="Alt+Enter"`; the word on the row is for the pointer and hidden.
- Nothing found: read from a status region that is always present and is filled when the search leaves no row.
- Loading: `aria-busy` on the root; the first load is said in the status region ("Loading options…"), its rows in the options' shape hidden.

### States

Rest, a highlighted row, ticked rows, a `disabled` row with its note, a first load in the options' shape, a refresh with every row held and dimmed, a search from six options, a narrowed list and its empty result; a list cut at five and a half rows that scrolls inside itself.

### When to use another component

- The button and the panel around it: UiFilter or UiTableColumns.
- One value: UiSelect.
- A box or two in a form: UiCheckbox.
- A list of names that grows: UiListField.

## Examples

### Search

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SelectValue } from 'grani-ui'
import { UiFilterList } from 'grani-ui'

const many = ref<SelectValue[]>([])

const COUNTRIES = ['Austria', 'Georgia', 'Latvia', 'Lithuania', 'Poland', 'Serbia', 'Spain'].map(
  (l) => ({ value: l.toLowerCase(), label: l }),
)
</script>

<template>
  <div class="w-64"><UiFilterList v-model="many" :items="COUNTRIES" ariaLabel="Country" /></div>
</template>

```

### Fixed

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SelectOption } from 'grani-ui'
import { UiFilterList } from 'grani-ui'

// The invoice number says what a row is: always on, and its description says so.
const COLUMNS: SelectOption[] = [
  { value: 'number', label: 'Invoice', disabled: true, description: 'always' },
  { value: 'client', label: 'Client' },
  { value: 'issued', label: 'Issued' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
]

const shown = ref(['number', 'client', 'amount'])
</script>

<template>
  <div class="w-64"><UiFilterList v-model="shown" :items="COLUMNS" ariaLabel="Columns" /></div>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiFilterList, UiRadioGroup, UiRadio } from 'grani-ui'

const COUNTRIES = ['Austria', 'Georgia', 'Latvia', 'Lithuania', 'Poland', 'Serbia', 'Spain'].map(
  (l) => ({ value: l.toLowerCase(), label: l }),
)

const held = ref(['latvia', 'poland'])

// The life of the options' load, switched by hand: a first load has no options yet, a refresh
// keeps them in view.
const listState = ref('loading')

const loadingItems = computed(() => (listState.value === 'loading' ? [] : COUNTRIES))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <div class="w-64">
      <UiFilterList
        v-model="held"
        :items="loadingItems"
        :loading="listState !== 'loaded'"
        ariaLabel="Country"
      />
    </div>
    <UiRadioGroup v-model="listState" variant="segmented" aria-label="State of the list">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="refreshing">Refreshing</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## API

Props:
- `items`: `SelectOption<SelectValue>[]` (required) — The options, as a select's: a value (as in the URL) and a label; `disabled` shows one fixed as it is, `description` puts a word at its end.
- `modelValue`: `SelectValue[]` (required) — The chosen values.
- `loading`: `boolean` (default `false`) — The options are being replaced: the rows are held.
- `ariaLabel`: `string` (default `""`) — A name for the list; inside a UiCard with a title the title names it.
- `groups`: `{ chosen: string; rest: string; }` — From six options, where the chosen stand first: a name over them and over the rest, a line between. Unset, they stand first without names.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: SelectValue[]`) — The chosen values after a tick.

## How it behaves

### Words in the making

- When: its search is typed through an input method.
- Props: more than five options.
- Guarantee: The Enter that picks the word ticks no row, the late Enter Safari sends included.
- Without it: A row ticked by the key that only meant to finish a word.
- Code: `<UiFilterList v-model="cities" :items="CITIES" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "an Enter that confirms an IME composition in the search field does not toggle the active row", "an Enter Safari sends to confirm a composition (keyCode 229) ticks nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#word-as-composed

### Visible work

- When: its options are loading.
- Props: `loading`.
- Guarantee: On the first load, five placeholder rows show that options are still arriving. During a refresh, the existing options stay visible but dimmed and unavailable, with the message “Updating…”.
- Without it: An empty panel says “Nothing found” while the options are still on their way.
- Code: `<UiFilterList v-model="tags" :items="tags" :loading="pending" />`
- Your part: Set `loading` while the options are loading.
- Not covered: A list of more than five options adds its search field above the rows only once they arrive, because their number is not known before.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "a refresh keeps the options in view, dimmed and busy, with no rows of skeleton", "a first load draws rows in the options' shape and says it loads, never "Nothing found""
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Search clears

- When: it has six options or more, and so a search field.
- Props: none.
- Guarantee: The cross or Escape empties a search that has text and keeps keyboard focus in it. That Escape stops there, so the popover around the list stays open; the next Escape reaches the popover.
- Without it: A search field in a popover where Escape closes the whole panel instead of clearing the text.
- Code: `<UiFilterList v-model="tags" :items="tags" />`
- Your part: Nothing. Do not add a clear button of your own.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "the search field clears its own text on Escape, keeping the popover open, before Escape can close it", "the cross empties the search and keeps the focus in it"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Five and a half rows

- When: there are many options.
- Props: none.
- Guarantee: The list is cut at five and a half rows, so the half row shows there is more below. When you move with the arrow keys, the highlighted row is scrolled into view inside the list.
- Without it: A list cut at a row edge that looks finished.
- Code: `<UiFilterList v-model="countries" :items="all" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "a long list is cut at five rows and a half"
- Pattern for all components: https://grani.arseni.work/patterns/finding#five-rows

### Letter jumps

- When: the list has no search.
- Props: five options or fewer.
- Guarantee: A letter moves the highlight to the first option that starts with it; the same letter again goes on to the next one, and from the last match back to the first. Letters typed together find a word, its spaces too. Enter or Space then ticks the highlighted option.
- Without it: A column of checkboxes where a letter does nothing, so you press the Down arrow once for each option above the one you want.
- Code: `<UiFilterList v-model="kinds" :items="kinds" />`
- Your part: Nothing.
- Not covered: From six options the list gets a search field, and letters type into the search instead of jumping.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps", "the same letter pressed again goes on to the next option that starts with it", "a Space after letters typed over the list belongs to the word: New J reaches New Jersey"
- Pattern for all components: https://grani.arseni.work/patterns/finding#letter-jumps

### Enter picks

- When: The filter list is inside a form.
- Props: none.
- Guarantee: Enter ticks the highlighted option, in the list or from its search box, and never submits the form around it.
- Without it: Pressing Enter to tick an option submits the half-filled form.
- Code: `<form><UiFilterList v-model="tags" :items="tags" /></form>`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "an Enter inside a form ticks and never submits it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-picks

### Focus starts inside

- When: it opens in a panel with six options or more.
- Props: none.
- Guarantee: Start typing to narrow the options as soon as the panel opens: keyboard focus goes straight to the list’s search field.
- Without it: The panel opens with keyboard focus left on the button that opened it, and you press Tab before you can type a search.
- Code: `<UiPopover><UiFilterList v-model="countries" :items="all" /></UiPopover>`
- Your part: Place the list inside a UiPopover, UiFilter or UiTableColumns.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "opened in a popover, a list of six and more puts the focus in its search"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### Focus stays near

- When: The number of options crosses six, so the search box appears or disappears.
- Props: none.
- Guarantee: When the list reaches six options, a search field appears; if the list had keyboard focus, focus moves into the search so you can start typing. If the count falls below six while the search has focus, the search text clears and focus returns to the list. The arrow keys remain available for choosing options.
- Without it: The search box is removed while it has keyboard focus, focus leaves the panel, and you have to find the list again.
- Code: `<UiFilterList v-model="tags" :items="tags" :loading="pending" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "when the options drop under six while the search holds text and focus, the text goes and the focus stays in the list", "options that arrive with six or more while the list holds the focus hand the focus to the search"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays

### One Tab per group

- When: a filter has many options.
- Props: none.
- Guarantee: Tab reaches the list, or its search field when one is present. Use the arrow keys to move between options, Home and End to reach the first or last, and Enter or Space to select. Tab then moves to the next control.
- Without it: Each option is its own checkbox, so a filter of twelve categories takes twelve presses of Tab to get past.
- Code: `<UiFilterList v-model="kinds" :items="kinds" />`
- Your part: Nothing.
- Not covered: Once the search holds text, its clear button (the cross) appears and takes a press of Tab of its own, so the list then takes two.
- Proof, in the repository's tests (UiFilterList.spec.ts, not in the package): "keyboard as in a select: arrows move, Home and End jump, Enter and Space tick, a letter jumps"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
