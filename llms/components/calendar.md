# Calendar (`UiCalendar`)

> Choose a day or date range from a month view, using the mouse or keyboard.

A component of grani-ui 0.1.0. Dates, stable, since 0.1.0. Page: https://grani.arseni.work/components/calendar

Also called date grid, month view, inline calendar.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, UiButton, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="day" />
    <template #footer>
      <span class="me-auto text-sm" :class="day ? 'text-fg' : 'text-fg-muted'">{{
        long(day)
      }}</span>
      <UiButton v-if="day" variant="ghost" size="xs" @click="day = null">Clear</UiButton>
    </template>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Respect date limits without losing a value.
- See a date range before you pick its end.
- See which days are the weekend.
- Save the day you picked, in any time zone.
- Mark today in the app’s time zone.
- Pick with Enter without sending the form.
- Keep your browser’s keyboard shortcuts.
- Move by month or year from the keyboard.
- Jump to a month from the heading.
- Open with keyboard focus where the task begins.
- Pass a group with one press of Tab.
- Keep turning pages from the keyboard.
- Describe calendar marks in words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `min` and `max` as `YYYY-MM-DD` days, and let the calendar choose the month it opens on.
- If today should follow a fixed time zone rather than each browser’s, set it once with `createGrani({ timeZone })`.
- Place the field that comes next after the calendar, not inside it.
- Give each kind of dot a `label` that says what it means; a dot without one is announced only as “marked”.

## Why it works this way

A month to pick a day from. Take it on a page of its own, or inside a picker's popover.

**Value.** The value is an ISO day (`2026-09-24`): a day, not a moment.

**Today.** Today is marked on the client only, because the server's today may be another day.

**Weekend.** The names of the days of rest in the header are bold, as the locale counts them: Saturday and Sunday in most places, Friday and Saturday in Israel or Saudi Arabia. A due day put on a day off is seen by its column, and the days themselves stay as they are, so nothing competes with the chosen day, today, a span or the marks.

**Window.** Days outside `min` and `max` cannot be picked, and the arrows stop at them. When the calendar opens on a month outside them, the arrows can always walk back into the window.

**Marks.** Taken days (`unavailable`) are struck through, and `marked` days carry a dot; a screen reader hears both in words.

**Range.** With `range` the value is a span, `{ from, to }`, and the calendar picks it: the first day pressed starts a span, the second ends it, in either order, and only then is the span sent. A half-made span is the calendar's own: a span set from outside drops it. TypeScript checks the value against `range` written as it is (`range` or none), so a calendar whose `range` changes at run time is two tags, one under `v-if` and one under `v-else`: `:range="flag"` does not compile.

**Preview.** Before the second press the band runs from the first day to the day under the pointer, or to the day with the keyboard focus, and the line under the month counts its days ("7 days"), so a week that came out eight days long is seen before it is set. Only a day the second press can pick ends it, and nothing is sent until that press. A taken day (`unavailable`) stops a span: while it waits, the days past the nearest taken day on either side cannot end it and show disabled, so a booking never takes in a day already booked. The line says the next step while no span is drawn and the length of a picked span after; it is always there, so the month does not move.

**Size.** It has one step, `sm`, whatever the app's step: the day cells are 36 px and the header matches them.

**Placement.** In the popover of UiDatePicker, as the second step of UiDateRange's popover, or on a page of its own, beside what the host puts under it (a value, quick picks, a time).

**Empty.** No day is `null`; in a span, an open end is `null`.

### Keyboard

The keys follow the WAI-ARIA date grid. One day is the tab stop.
In the days:
- `ArrowLeft` `ArrowRight`: move a day toward that side. On a right-to-left page the week runs from the right, so `ArrowRight` moves to the day before.
- `ArrowUp` `ArrowDown`: move a week.
- `Home` `End`: go to the ends of the week.
- `PageUp` `PageDown`: move a month.
- `Shift+PageUp` `Shift+PageDown`: move a year.
- `Enter` `Space`: pick the day in focus.
- `Escape`: belongs to the host.
- `Alt` `Ctrl` `Meta`: a chord with them stays the browser's, in the days and in the months.
A move that starts inside the window stops at its edge.
The caption opens the months of the year, to jump far. There:
- `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: walk the 3 × 4 grid. On a right-to-left page the grid runs from the right, so `ArrowRight` moves to the month before.
- `Home` `End`: go to its ends.
- `Escape`: goes back to the days.
The header arrows page by a month, or by a year in the months view; when an arrow turns off at the window's edge, the focus moves to the caption. On a right-to-left page the previous arrow stands at the right and points there.

### Screen reader

- Grid: named by the month shown, from a live caption, so a page turn is read out; with `range` it is `aria-multiselectable`.
- Day: a button named by its full date, then by what its dots mean and, when it is taken, by the word unavailable.
- Today: `aria-current="date"`.
- Weekend: a header cell is named by its day's full name; its weight is for the eye alone.
- Chosen day: `aria-selected` on its cell.
- Disabled day: a day that cannot be picked is `aria-disabled`.
- Month: a month button says its month and year; the month shown is `aria-current`.
- Range: with `range` a live region says "Choose the first day", then "Now choose the last day".
- Preview: while a span waits for its end, the focused day says after its date how long the span to it would be ("7 days"); the line under the month is hidden, since it says the same.
- Two calendars: when two stand on one page, `ariaLabel` names each whole calendar as a group; the grid keeps the month as its name.

### States

Empty (it opens on today, or on the window's nearest day), a chosen day, a span, a span drawn to the pointed or focused day before its second press with its length under the month, days outside `min` and `max` (disabled; a chosen day out there keeps a frame), taken days struck through, marked days with one or two dots, today in the brand ink, the names of the days of rest in bold, and the months view. The months view is as tall as the days, so nothing jumps when you switch.

### When to use another component

- A day in a form field: UiDatePicker, which wraps this.
- A period in a toolbar: UiDateRange.
- A time of day: UiTimePicker beside it.

## Examples

### Range

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const range = (s: DateSpan) =>
  s.from && s.to
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatRange(at(s.from), at(s.to))
    : 'Nothing chosen'
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="span" range />
    <template #footer>
      <span class="me-auto text-sm text-fg">{{ range(span) }}</span>
    </template>
  </UiCard>
</template>

```

### Min and max

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, UiRadioGroup, UiRadio, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const LOW = computed(() => fromToday(-4))

const HIGH = computed(() => fromToday(10))

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'

const range = (s: DateSpan) =>
  s.from && s.to
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatRange(at(s.from), at(s.to))
    : 'Nothing chosen'
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <UiCard class="w-min">
      <UiCalendar v-model="bounded" :min="LOW" :max="HIGH" />
      <template #footer>
        <span class="me-auto text-sm text-fg">{{ long(bounded) }}</span>
        <span class="text-xs text-fg-muted">{{ range({ from: LOW, to: HIGH }) }}</span>
      </template>
    </UiCard>
    <UiRadioGroup v-model="where" variant="segmented" aria-label="Where the chosen day is">
      <UiRadio value="inside">Inside</UiRadio>
      <UiRadio value="outside">Outside</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Marked

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CalendarMark, DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

// Taken days a week ahead: struck through, and a screen reader hears unavailable.
const BOOKED = computed(() => [6, 7, 8, 9].map((n) => fromToday(n)))

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// Payments in green, overdue in red; a day with both carries two dots. The label is what a
// reader hears: the color alone says nothing to a screen reader.
const paid = (day: string): CalendarMark => ({ day, tone: 'success', label: 'paid' })

const overdue = (day: string): CalendarMark => ({ day, tone: 'danger', label: 'overdue' })

const ENTRIES = computed(() => [
  paid(fromToday(-12)),
  paid(fromToday(-11)),
  overdue(fromToday(-4)),
  paid(fromToday(3)),
  overdue(fromToday(3)),
  paid(fromToday(0)),
])

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="withEntries" :marked="ENTRIES" :unavailable="BOOKED" />
    <template #footer>
      <span class="me-auto text-sm text-fg">{{ long(withEntries) }}</span>
      <span class="flex items-center gap-2 text-xs text-fg-muted"
        ><span class="h-1 w-1 rounded-pill bg-success-border" />paid<span
          class="h-1 w-1 rounded-pill bg-danger-border"
        />overdue</span
      >
    </template>
  </UiCard>
</template>

```

### Quick picks

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, UiButton, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const due = ref<string | null>(null)

const meeting = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

const QUICK = [
  { label: 'Today', days: 0, span: 'col-span-2' },
  { label: 'Tomorrow', days: 1, span: 'col-span-2' },
  { label: 'In 3 days', days: 3, span: 'col-span-2' },
  { label: 'In a week', days: 7, span: 'col-span-3' },
  { label: 'In 2 weeks', days: 14, span: 'col-span-3' },
]

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)
</script>

<template>
  <UiCard footer-variant="muted" class="w-min">
    <UiCalendar v-model="due" />
    <template #footer>
      <div class="grid w-full grid-cols-6 gap-[inherit]">
        <UiButton
          v-for="q in QUICK"
          :key="q.label"
          variant="outline"
          size="xs"
          :class="q.span"
          :aria-pressed="due === fromToday(q.days)"
          @click="due = fromToday(q.days)"
        >
          {{ q.label }}
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>

```

### With time

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, UiSeparator, UiField, UiTimePicker, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const start = ref('10:30')

const end = ref('12:30')

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="meeting" />
    <UiSeparator class="my-4" />
    <div class="flex flex-col gap-4">
      <UiField label="Start time">
        <UiTimePicker v-model="start" class="w-full" />
      </UiField>
      <UiField label="End time">
        <UiTimePicker v-model="end" class="w-full" />
      </UiField>
    </div>
  </UiCard>
</template>

```

### Date of birth

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

// Eighteen or older: the window ends years before today, and the calendar opens on its last month.
const ADULT = computed(() => fromToday(0, -18))

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const born = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="born" :max="ADULT" />
    <template #footer>
      <span class="me-auto text-sm" :class="born ? 'text-fg' : 'text-fg-muted'">{{
        long(born)
      }}</span>
      <span class="text-xs text-fg-muted">18 or older</span>
    </template>
  </UiCard>
</template>

```

### Two on a page

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCard, UiCalendar, useToday } from 'grani-ui'

// Days around today, in the app's zone. Today is the server's day until the page is up, so the
// first render matches the prerendered one; then it is the person's day, and the examples move to it.
const { now } = useToday()

const shift = (iso: string, n: number, years = 0) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() + years)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fromToday = (n: number, years = 0) => shift(now.value, n, years)

const day = ref<string | null>(null)

const bounded = ref<string | null>(null)

// Inside the window, or chosen before the window closed on it (a saved day, a filter): out there
// it keeps its ring beyond `max`, and the arrows walk back in.
const where = ref<'inside' | 'outside'>('inside')

watch(where, (w) => (bounded.value = fromToday(w === 'inside' ? 2 : 16)))

const withEntries = ref<string | null>(null)

const meeting = ref<string | null>(null)

const checkIn = ref<string | null>(null)

const checkOut = ref<string | null>(null)

// The calendar picks the span: the first press starts it, the second ends it, and only a whole
// span reaches the model.
const span = ref<DateSpan>({ from: null, to: null })

// The chosen days stand around today: set again when today moves (the page is up, midnight passes).
watch(
  now,
  () => {
    day.value = fromToday(-3)
    bounded.value = fromToday(where.value === 'inside' ? 2 : 16)
    withEntries.value = fromToday(0)
    meeting.value = fromToday(5)
    checkIn.value = fromToday(7)
    checkOut.value = fromToday(10)
    span.value = { from: fromToday(-2), to: fromToday(9) }
  },
  { immediate: true },
)

// The value read as a person reads it; the ISO day beside it is what the model holds. The card
// is as wide as the calendar (`w-min`): the footer's words give way, they never widen it.
const at = (iso: string) => new Date(`${iso}T00:00:00Z`)

const long = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(at(iso))
    : 'Nothing chosen'
</script>

<template>
  <UiCard class="w-min">
    <UiCalendar v-model="checkIn" aria-label="Check-in" />
    <template #footer>
      <span class="me-auto text-sm text-fg">Check-in</span>
      <span class="text-xs text-fg-muted">{{ long(checkIn) }}</span>
    </template>
  </UiCard>
  <UiCard class="w-min">
    <UiCalendar v-model="checkOut" aria-label="Check-out" :min="checkIn ?? undefined" />
    <template #footer>
      <span class="me-auto text-sm text-fg">Check-out</span>
      <span class="text-xs text-fg-muted">{{ long(checkOut) }}</span>
    </template>
  </UiCard>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DateSpan } from 'grani-ui'
import { UiCalendar } from 'grani-ui'

const ruSpan = ref<DateSpan | null>(null)
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). The week starts on Monday,
       and Saturday and Sunday are named in red. -->
  <UiCalendar v-model="ruSpan" range />
</template>

```

## API

Props:
- `min`: `string` — The first day that can be picked, inclusive.
- `max`: `string` — The last day that can be picked, inclusive.
- `marked`: `(string | CalendarMark)[]` — Days with a dot under the number: a day, or `{ day, tone }` for a colored dot; a day listed twice has two dots, two at most. `grani.calendar.marked` says what they mean (the app's `translate` words it).
- `unavailable`: `string[]` — Days that cannot be picked though they fall within `min` and `max` (booked, closed): struck through.
- `ariaLabel`: `string` — A name for the whole calendar where two stand on one page ("Check-in"); the grid keeps the month as its name.
- `range`: `boolean` — Pick a span of days, two presses in either order, instead of one day.
- `modelValue`: `string | DateSpan | null` — The chosen day as `YYYY-MM-DD`, or with `range` the span `{ from, to }` (`v-model`); `null` for none and for an open end.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `update:modelValue` (`value: string | DateSpan`) — A day was picked, or with `range` a whole span: a half-made span is not sent.

## How it behaves

### Limits shown

- When: The calendar has `min` or `max`, for example for a date of birth.
- Props: `min`, `max`.
- Guarantee: With no date selected, the calendar opens on the nearest allowed month. Paging by month or year stays within the bounds, and keyboard focus never lands on an unavailable day. If the selected date is far outside the range, the arrows still let you navigate back into it. An invalid bound is ignored with a warning.
- Without it: A date-of-birth calendar opens on the current month, where no day can be picked, and you page back eighteen years to reach one.
- Code: `<UiCalendar v-model="born" :max="adult" />`
- Your part: Pass `min` and `max` as `YYYY-MM-DD` days, and let the calendar choose the month it opens on.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "the arrows and the months view stop at the window; a page stops at its edge day", "an empty calendar whose window ends before today opens on the window's last month", "a chosen day far outside the window can be walked back by the arrows and the year arrows", "a month arrow from inside the window never leaves the focus on a day outside it", "a malformed bound is ignored and warned about, not a dead calendar"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#limit-shown

### Range seen first

- When: it picks a range.
- Props: `range`.
- Guarantee: After the first day, the band runs to the day under the pointer, or to the day with the keyboard focus, and the line under the month counts its days. A screen reader hears the count after the focused day’s date. A day the second press cannot pick does not end the band, and a taken day stops it: the days past it show disabled.
- Without it: Only the first day shows until the second press, and a range one day too long is noticed after it is applied.
- Code: `<UiCalendar v-model="leave" range />`
- Your part: Nothing.
- Not covered: A touch screen has no pointer resting on a day: there the count shows once the range is picked.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "the band runs to the pointed day and the line counts its days; nothing is chosen or sent until the press", "the keys draw the band to the focused day, which says its length, and take it from a resting pointer", "a day the press cannot pick does not end the band, and the pointer leaving takes it back", "a pointer resting on the grid does not take the band back from the keys when the month turns", "while a span waits for its end, the days past the first taken day cannot end it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#span-seen-first

### Weekend named

- When: a month is shown.
- Props: none; the days come from the app’s `locale`.
- Guarantee: The names of the days of rest in the header are bold, so their columns are found at a glance. The days themselves look like any other, so the chosen day, today, a range and the marks keep their look. A screen reader hears each column by its full day name.
- Without it: Every day name looks the same, and a Saturday is found by counting columns from the start of the week, which moves with the language.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing; `createGrani({ locale })` sets whose weekend it is.
- Not covered: The weekend is the locale’s, not a team’s schedule: a shift that works on Saturday still sees it in bold. Days the app closes go in `unavailable`.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "the header names the locale’s days of rest in bold, wherever its week starts", "a day of rest is drawn as any other day of the month: no ground, the same hover", "a weekday column is named by its full day"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#weekend-shown

### Day stays the day

- When: a day is picked.
- Props: `v-model`.
- Guarantee: It sends the day as `YYYY-MM-DD`, a day and not a moment, in every time zone the specs run in.
- Without it: A picked day sent as midnight lands on the day before east of UTC.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "a click picks a day; a day of the next month picks into it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#day-stays-day

### Mark today in the app’s time zone

- When: today is in the month shown.
- Props: none; the zone is the app's.
- Guarantee: Today is marked in the app’s time zone, or the browser’s time zone when none is configured. The marker appears only after the calendar runs in the browser, and a screen reader identifies that day as the current date.
- Without it: The server’s date is marked as today while it is still yesterday where you are.
- Code: `<UiCalendar v-model="day" />`
- Your part: If today should follow a fixed time zone rather than each browser’s, set it once with `createGrani({ timeZone })`.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "today is not marked before mount", "today is marked as the current date, once mounted", "today is the day of the app time zone, past midnight there before UTC"
- Pattern for all components: https://grani.arseni.work/patterns/opening#readers-today

### Enter picks

- When: The calendar is inside a form.
- Props: none.
- Guarantee: Enter or Space on a day picks it, and the form around it is not submitted.
- Without it: Enter on a day submits the half-filled form.
- Code: `<form @submit="save"><UiCalendar v-model="due" /></form>`
- Your part: Nothing; every button in the calendar is `type="button"`, so none of them submits the form.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "inside a form a pressed day picks it and the form is not submitted"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-picks

### Shortcuts kept

- When: keyboard focus is on a day or a month.
- Props: none: every UiCalendar.
- Guarantee: The arrow keys move between days; with Alt or Cmd held they move nothing and the browser takes the key, so Alt+Left still goes back a page. The months view does the same.
- Without it: Alt+Left, meant to go back a page, moves the focus to the day before instead.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "Alt or ⌘ with an arrow moves no day and lets the browser have the key", "in the months view too, a chord moves no month and leaves the key"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

### Move by month or year from the keyboard

- When: A day has keyboard focus.
- Props: none.
- Guarantee: Use Left and Right to move by day, Up and Down by week, and Home and End to reach the week’s first and last days. Page Up and Page Down move by month; add Shift to move by year. The original day number is restored when a later month has it, so May 31 → April 30 → March 31.
- Without it: A date a year away takes twelve clicks on a small arrow button.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week", "PageUp from the 31st lands on the 31st again where a month has one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#page-by-key

### Jump to a month from the heading

- When: The day you need is many months away.
- Props: none.
- Guarantee: The heading opens a grid of the year's months, the same height as the days, so the calendar does not change size. Keyboard focus starts on the month shown, the arrows move across the grid, and a screen reader announces each month with its year, such as “March 2026”. Choosing a month opens its days with keyboard focus on one day of it, and Escape returns to the days without closing the popover or window around the calendar.
- Without it: Reaching a day next autumn means paging through every month in between.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "the caption opens the months of the year; a month opens its days", "the months view: the shown month has focus, arrows move over the grid", "leaving the months view after a year step leaves exactly one focusable day in the shown month", "a month button says its month and year", "Escape in the months view goes back to the days and does not reach the host"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#months-jump

### Focus starts inside

- When: it opens.
- Props: none.
- Guarantee: The calendar shows the selected month and places keyboard focus on the selected day, ready for the arrow keys. With no selection, it starts on today, or the nearest allowed day if today is outside the allowed range.
- Without it: The calendar opens on today while your date is in March, or with no day for keyboard focus to start on.
- Code: `<UiCalendar v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "shows the month of the value, the value picked and one focusable day marked to open on"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### One Tab per group

- When: a month of days is shown.
- Props: none: every UiCalendar.
- Guarantee: Tab reaches the previous-month button, the month heading, the next-month button and the days as four separate stops. Within the days, start on the selected day or today. Use the arrow keys to move by day or week, Page Up and Page Down to change months, and Enter to choose. The next Tab leaves the day grid.
- Without it: Every day is a separate Tab stop, so getting to the field after the calendar can take more than thirty key presses.
- Code: `<UiCalendar v-model="due" />`
- Your part: Place the field that comes next after the calendar, not inside it.
- Not covered: The header’s month arrows and the month’s name take a press of Tab each, so a month is four presses of Tab, not one.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "one day is a tab stop, so a focus trap around the calendar goes round it", "arrows move a day and a week; PageUp a month, Shift+PageDown a year; Home and End the week"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop

### Focus kept

- When: you move between months with its arrows.
- Props: none.
- Guarantee: When an arrow turns off at the first or last allowed month, keyboard focus moves to the month caption between the arrows. When you pick a day of the next month, focus stays on that day.
- Without it: Keyboard focus is lost on the turned-off arrow: it falls to the page, and a screen reader loses its place.
- Code: `<UiCalendar v-model="day" :min="from" :max="to" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "the arrow that reaches the window's edge hands the focus to the caption", "a pick on a day of the next month keeps focus on that day"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#pager-keeps-focus

### Describe calendar marks in words

- When: Days are marked, taken or outside the allowed range.
- Props: `marked`, `unavailable`, `min`, `max`.
- Guarantee: Each day button is named by its full date, then by the labels of its dots, then by the word “unavailable” when it is taken, for example “Thursday, September 10, 2026, overdue”. Today is marked as the current date. A day outside `min` and `max` is disabled for a screen reader and drawn in the disabled colors, not faded and not struck through, so it does not look like a taken day.
- Without it: A screen reader announces only the date, so the dot that means overdue and the strike that means taken are lost to anyone who cannot see them.
- Code: `<UiCalendar v-model="day" :marked="entries" :unavailable="booked" />`
- Your part: Give each kind of dot a `label` that says what it means; a dot without one is announced only as “marked”.
- Proof, in the repository's tests (UiCalendar.spec.ts, not in the package): "a dot says its label to a reader; a taken day says it is unavailable", "today is marked as the current date, once mounted", "a chosen day outside min and max is the disabled state, not a fade", "a span day outside min and max is disabled and not struck"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#state-in-words


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useToday`, `useUiT`.
