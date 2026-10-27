# Date range (`UiDateRange`)

> Filter records by a period such as “This month”, which stays current, or choose two dates in either order.

A component of grani-ui 0.1.0. Dates, stable, since 0.1.0. Page: https://grani.arseni.work/components/date-range

Also called date range picker, period picker, period filter.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiCard, UiTableToolbar, UiDateRange } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const period = named('prev_month')

const search = ref('')
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-xl">
    <UiTableToolbar v-model:search="search" search-placeholder="Search invoices">
      <template #start="{ size }">
        <UiDateRange v-model="period" ariaLabel="Issued" :size="size" />
      </template>
    </UiTableToolbar>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep the current period until both days are picked.
- See a date range before you pick its end.
- See which days are the weekend.
- Save the day you picked, in any time zone.
- Count the last day of a period whole.
- Keep “Last month” and “Today” up to date.
- Keep nearby buttons and fields in place.
- Notice when there are more options below.
- Pick range ends in either order.
- Continue from where you opened the panel.
- Keep turning pages from the keyboard.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Count the last day whole when you query by moments.
- Query with these two moments, not with the bare days, and pass the zone the app gave `createGrani({ timeZone })`, its `locale`, and the filter’s `min` and `max`.
- Store `preset` together with the dates, including in the URL, so the component knows whether to recalculate a named period or preserve a custom range. Query with `periodBounds`: it counts a named period from today itself, so the first request, on the server too, asks for the new month and not the days saved with the link.

## Why it works this way

A toolbar filter by period, with named presets and a custom range. Take it in a table toolbar to narrow a list by dates.

**Button.** The button shows the days ("Aug 1 – 31"), with the year only when it is not this year. A whole year shows as the year ("2025"), and no bounds show as All time. One bound reads "From Aug 1" or "Until Aug 31". The button is as wide as its widest named period, so picking among them never moves the row.

**Panel.** The panel is a UiPopover with a list edge to edge, as in UiSelect, from the shortest period to the longest: Today, Yesterday, This week, Last 7 days, then the months with Last 30 days among them, then the years and All time. The chosen preset is checked in the list. Each preset shows the days or the months it covers, a week from the day the language's week starts; a pick applies it and closes the panel. "Custom range…", under a line, turns the panel into a calendar on the current span. The first day picked starts a span; the second ends it, applies it as `custom` and closes the panel. The row above the calendar goes back to the list. No fields appear beside the button, so the toolbar keeps its width.

**Window.** `min` and `max` bound what can be picked: a preset partly outside them is cut at the bound ("This month" with `max` today runs to today), one wholly outside is disabled, and the calendar stops at them. All time stays no bounds.

**Stepper.** `stepper` puts two arrows before the button that move the period back and forward by its own length: a month or a quarter by whole months, a week or a custom span by its days. They stand before it, so at the start of a row (a toolbar's `#start`) a longer label, a week across the turn of the year, never moves them from under the pointer. The step lands on a preset's name when it matches one, so stepping forward from last month gives This month, which rolls with today; where two presets share the days, the one the period last had wins. An arrow is disabled when there is nowhere to go: All time, one bound, or past the window. A step the window cuts keeps only the days inside it, and the next step moves by those. A step counts from the model, so a host that applies it late takes two quick presses as one.

**Model.** One `v-model` holds what a URL carries, `{ from, to, preset }` (`DateRangeValue`): ISO days, `null` for no bound, and the named preset, `null` for none. A pick sends the whole period at once. A named preset wins over its days: in the browser its days are counted again from today, so "Last month" opened next month shows the new last month. `custom` keeps its days. With no `preset`, the days decide: days mean `custom`, no days mean All time. For a query, `periodBounds(value, { timeZone, locale, min, max })` gives the moments the period covers, its last day whole by the app's clock, a named preset counted from today as the button shows it, on the server too: ask for `at >= start && at < end`.

**Placement.** In a table toolbar, beside the search, UiFilter and UiTableColumns; or in a form under a UiField label.

**Field.** Inside UiField the field's label is its name, read before the days, for the button, its panel and the arrows' group; a click on the label opens the panel. The field's id, error and words reach the button.

**Disabled.** `disabled` turns off the button and both arrows, and closes the panel if it is open.

### Keyboard

On the button:
- `Tab`: reaches it.
- `Enter` `Space`: open the panel on the list, with the chosen preset highlighted.
On an arrow (`stepper`):
- `Tab`: reaches them, before the button.
- `Enter` `Space`: move the period; the focus stays on the arrow, or goes to the button when the arrow turns off at the window's end.
In the list:
- `ArrowDown` `ArrowUp`: move, passing over a preset outside the window.
- `Home` `End`: jump.
- `Enter` `Space`: apply the preset and close the panel.
- `ArrowDown`: past the last preset, reaches "Custom range…".
On "Custom range…":
- `ArrowUp`: goes back to the list.
- `Enter` `Space`: open the calendar with the focus on its day.
In the calendar, which takes UiCalendar's keys and picks the span:
- `Enter` `Space`: on the row above it, go back to the list, on the custom row.
Anywhere in the panel:
- `Escape`: closes the panel and returns the focus to the button, as a pick does; a half-picked span is dropped on close.

### Screen reader

- Button: its name comes before its days, "Period, Aug 1 – 31", or `ariaLabel` in its place, or the field's label inside UiField, with `aria-haspopup` and `aria-expanded`.
- Panel: a dialog with the same name.
- Presets: a listbox with that name, each option with the days or months it covers, the chosen one selected and one outside the window disabled.
- Custom row: marked as the current choice (`aria-current`), and its days describe it.
- Calendar: a live region says "Choose the first day", then "Now choose the last day".
- Row above the calendar: named "Custom range, back to the list".
- Arrows: named "Previous period" and "Next period", in a group with the button's name ("Issued, group"), so two on one page are told apart; after a step the new days are said, since the focus stays on the arrow.

### States

A named preset, a custom span, one bound ("From Aug 1", "Until Aug 31"), a whole year, All time; the list open, the calendar with a first day picked; a period set from outside while the panel is open, which moves the highlight and drops a half pick; presets cut by the window and one disabled outside it; the arrows, one disabled at the window's end; the whole control disabled; the button at `xs`, `sm` and `md`.

### When to use another component

- One date in a form: UiDatePicker.
- A day alone on a page: UiCalendar.
- Filters by other dimensions: UiFilter.
- A date in a column: UiDateCell.

## Examples

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const dense = named('this_month')

const row = named('this_month')
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <UiDateRange v-model="dense" size="xs" />
    <UiDateRange v-model="row" size="md" />
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const days = (from: string | null, to: string | null) =>
  ref<DateRangeValue>({ from, to, preset: 'custom' })

const all = named('all')

const month = named('this_month')

const span = days('2025-11-03', '2025-12-19')

const since = days('2026-06-01', null)

const until = days(null, '2026-08-31')

const year = named('this_year')

const locked = named('prev_month')
</script>

<template>
  <UiDateRange v-model="all" />
  <UiDateRange v-model="month" />
  <UiDateRange v-model="span" />
  <UiDateRange v-model="since" />
  <UiDateRange v-model="until" />
  <UiDateRange v-model="year" />
  <UiDateRange v-model="locked" disabled />
</template>

```

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue } from 'grani-ui'
import { UiField, UiDateRange } from 'grani-ui'

// In a form: the field's label names it, and an error stands until a period is picked.
const term = ref<DateRangeValue>({ from: null, to: null, preset: null })
</script>

<template>
  <UiField
    label="Contract term"
    description="The days the contract is in force."
    :error="term.from || term.to ? undefined : 'Pick the days of the contract'"
    required
  >
    <UiDateRange v-model="term" />
  </UiField>
</template>

```

### Outside

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange, UiButton } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const outside = named('3_months')

const reset = () => (outside.value = { from: null, to: null, preset: 'all' })
</script>

<template>
  <UiDateRange v-model="outside" />
  <UiButton variant="outline" @click="reset">Reset</UiButton>
</template>

```

### Stepper

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const stepped = named('prev_month')

const week = named('this_week')

const locked = named('prev_month')
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <UiDateRange v-model="stepped" stepper />
    <UiDateRange v-model="week" stepper />
    <UiDateRange v-model="locked" stepper disabled />
  </div>
</template>

```

### Window

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange, useToday } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

// Records kept since the first of this year, none in the future.
const { now } = useToday()

const yearStart = computed(() => `${now.value.slice(0, 4)}-01-01`)

const bounded = named('this_month')
</script>

<template>
  <!-- This month runs to today, Last year cannot be picked, and the calendar stops at both. -->
  <UiDateRange v-model="bounded" :min="yearStart" :max="now" stepper />
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateRangeValue, RangePreset } from 'grani-ui'
import { UiDateRange } from 'grani-ui'

// A named preset is enough: its days are counted from today when the page runs.
const named = (preset: RangePreset) => ref<DateRangeValue>({ from: null, to: null, preset })

const ruWeek = named('this_week')
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). The week starts on Monday. -->
  <UiDateRange v-model="ruWeek" stepper />
</template>

```

## API

Props:
- `modelValue`: `DateRangeValue | null` (default `null`) — The period (`v-model`): `from` and `to` as `YYYY-MM-DD`, `null` for no bound, and `preset`, the named period or `custom` for days picked on the calendar. A named one wins over the days: they are counted again from today. A `null` preset makes days `custom` and none All time.
- `id`: `string` — Own id of the button, for a label elsewhere. Inside UiField, the field's id takes precedence.
- `align`: `"start" | "center" | "end"` = `start | center | end` (default `"start"`) — Which edge of the button the panel lines up with.
- `ariaLabel`: `string` — What the button filters by, read before the days: "Period" by default, "Paid" for a column of payment days.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder, as the rest of the toolbar row. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `min`: `string` — The first day a period can reach, inclusive: a preset partly before it is cut there, one wholly before it is disabled.
- `max`: `string` — The last day a period can reach, inclusive: a preset partly after it is cut there, one wholly after it is disabled.
- `stepper`: `boolean` (default `false`) — Two arrows before the button that move the period back or forward by its own length: a month by a month, a week by seven days.
- `disabled`: `boolean` (default `false`) — The period cannot be changed: the button and the arrows are off, and an open panel closes.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: DateRangeValue`) — The whole period at once: a preset, a span picked on the calendar (`custom`), or a named preset counted again from today.

## How it behaves

### Half pick dropped

- When: you start a custom range and leave it unfinished.
- Props: none.
- Guarantee: Nothing is applied until both days are picked. Closing the panel after one day drops that day and keeps the period as it was, and a period set from outside drops it too, so your next click starts a new range.
- Without it: Each click applies at once: the first day becomes “from that day on”, and the list changes for a range you never finished.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "a half-made span is dropped on close: reopened, the panel is the list again", "a period set from outside while the calendar is half picked drops the half pick"
- Pattern for all components: https://grani.arseni.work/patterns/closing#half-pick-dropped

### Range seen first

- When: you pick a custom range.
- Props: none.
- Guarantee: The calendar of Custom range draws the range before your second press and counts its days, while the period in effect stays as it was.
- Without it: A custom range is seen only once it is applied, and a list filtered one day short looks like a list with nothing more in it.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "a custom span is drawn to the pointed day and counted before the second press"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#span-seen-first

### Weekend named

- When: you pick a custom range.
- Props: none.
- Guarantee: The calendar of Custom range names the days of rest in bold, so a range that starts or ends on a day off is seen while you pick it.
- Without it: A report period that ends on a Sunday looks the same as one that ends on a Friday.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "the calendar of a custom span names the days of rest in bold"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#weekend-shown

### Day stays the day

- When: a custom range is picked.
- Props: none.
- Guarantee: The period’s ends are days, `from` and `to` as `YYYY-MM-DD`, so a range never shifts by a day.
- Without it: A period sent as two midnights starts and ends a day early on a server in UTC.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Count the last day whole when you query by moments.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "Custom range opens the calendar on the span; two days make it custom, in either order, and close"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#day-stays-day

### Last day whole

- When: the app queries records by the moment they happened.
- Props: `periodBounds(period, { timeZone })`.
- Guarantee: It gives the moments the period covers: midnight of its first day and midnight after its last, by the clock of the zone given, so a query for `at >= start && at < end` counts the last day whole, a day the clock changes on too.
- Without it: A query for `at <= "2026-10-31"` stops at the midnight that starts the 31st, and that day’s invoices are missing from the report.
- Code: `const { start, end } = periodBounds(period, { timeZone: 'Europe/Moscow', locale: 'ru' })`
- Your part: Query with these two moments, not with the bare days, and pass the zone the app gave `createGrani({ timeZone })`, its `locale`, and the filter’s `min` and `max`.
- Not covered: The filter does not run the query: an app that compares timestamps with the bare days still loses the last day.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "a period picked here gives a query its moments, the last day whole, by periodBounds"
- Pattern for all components: https://grani.arseni.work/patterns/finding#last-day-whole

### Period rolls

- When: a named period is kept, in a URL or a saved view.
- Props: `v-model` with `preset`.
- Guarantee: A saved view on Last month still shows the previous calendar month when opened later: the period is recalculated when the page opens and when the day changes, and the updated dates are sent through `v-model`. A preset that has no dates yet gets them filled in.
- Without it: Days saved once: “Last month” shows the same month forever.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Store `preset` together with the dates, including in the URL, so the component knows whether to recalculate a named period or preserve a custom range. Query with `periodBounds`: it counts a named period from today itself, so the first request, on the server too, asks for the new month and not the days saved with the link.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "a named preset whose days went stale is re-resolved against today, on mount and across a month end", "a preset without days in the model fills them"
- Pattern for all components: https://grani.arseni.work/patterns/finding#named-period-rolls

### Steady width

- When: it stands in a toolbar.
- Props: none.
- Guarantee: The button reserves the width of the widest named period, and of All time and Custom range, so picking one of them does not move the search and filters beside it. With `stepper` the arrows stand before the button, so at the start of a row, as in a toolbar’s `#start`, a longer period never moves them from under the pointer.
- Without it: A button as wide as its text, so each pick shifts the rest of the row.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Not covered: A custom span of another year, or across the turn of a year, can be wider than every named period: the button then grows toward the end of the row.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "the button stands over the widest named period, so a pick keeps its width"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### Five and a half rows

- When: there are more presets than fit.
- Props: none.
- Guarantee: The list of presets is cut at five and a half rows, so the half row shows there are more below.
- Without it: A list cut at a row edge that looks finished.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "the list is cut at five rows and a half"
- Pattern for all components: https://grani.arseni.work/patterns/finding#five-rows

### Either order

- When: You choose a custom range in the calendar.
- Props: none.
- Guarantee: After the first day, the calendar asks for the other one (“Now choose the last day”) and the range in effect stays as it was. The second day completes the range in either order: the earlier day is the start, the later the end, the range applies as `custom`, and the panel closes.
- Without it: The first press is always the start, so choosing the end first gives a range that ends before it begins.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "Custom range opens the calendar on the span; two days make it custom, in either order, and close"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#either-order

### Focus comes back

- When: the period panel closes.
- Props: none.
- Guarantee: Whether you close the panel by choosing a preset, finishing a custom range or pressing Escape, keyboard focus goes back to the period button.
- Without it: The panel closes and keyboard focus falls to the page: a screen reader loses its place, and you look for the filters again.
- Code: `<UiDateRange v-model="issued" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "closing returns the focus to the button: a preset, a custom span, Escape"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back

### Focus kept

- When: you step a period with its arrows up to `min` or `max`.
- Props: `stepper`, with `min` or `max`.
- Guarantee: The arrow you pressed keeps keyboard focus, and a screen reader announces the new days. When a step reaches the end of the window and the arrow turns off, focus moves to the period button after the arrows.
- Without it: Keyboard focus is lost on the turned-off arrow: it falls to the page, and a screen reader loses its place.
- Code: `<UiDateRange v-model="issued" stepper :max="today" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDateRange.spec.ts, not in the package): "the arrow that turns off at the window hands the focus to the button"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#pager-keeps-focus


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useToday`, `announce`, `useControlSize`, `useUiT`.
