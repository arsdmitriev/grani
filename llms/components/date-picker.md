# Date picker (`UiDatePicker`)

> Type a date as your language writes it, or pick it from a calendar or a preset, while the field keeps a steady width.

A component of grani-ui 0.1.0. Dates, stable, since 0.1.0. Page: https://grani.arseni.work/components/date-picker

Also called date input, date field, calendar input.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiField, UiDatePicker } from 'grani-ui'

const paid = ref<string | null>('2026-09-24')
</script>

<template>
  <UiCard title="INV-0042" description="Acme Corp · €1 240.00" class="w-full max-w-sm">
    <UiField label="Paid on" description="The day the money reached the account.">
      <UiDatePicker v-model="paid" clearable class="w-full" />
    </UiField>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Type a date or a time as your language writes it.
- Save the day you picked, in any time zone.
- See the day of the week beside a date.
- Keep the end of a period after its start.
- Pick a common date in one press.
- Leave invalid date values empty instead of guessing.
- Submit the values shown in the form.
- Open a panel on the side where it fits.
- Keep nearby buttons and fields in place.
- Close only the top layer with Escape.
- Respect date limits without losing a value.
- See which days are the weekend.
- Keep “Last month” and “Today” up to date.
- Close a popup without closing the form behind it.
- Close an open picker when its field is disabled.
- Clear a field and enter its replacement immediately.
- Open with keyboard focus where the task begins.
- Continue from where you opened the panel.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Store it as a date, not a timestamp; turn it into a moment only where one is meant, in the zone that is meant.
- Bind `min` to the start field’s value, and refuse the save while the end reads invalid, saying why in the field’s error.
- Pass the ids that fit the field in `presets`, or `true` for all seven (Today, Yesterday, A week ago, Tomorrow, In 3 days, In a week, In 2 weeks), and add your own with `{ label, days }`.
- Pass a `YYYY-MM-DD` day or `null`.
- Give it a `name`.
- Give the field a width where the row needs one; without it, the field is as wide as its widest date.
- Pass `min` and `max`, and explain the limit in the field's description.

## Why it works this way

A form field for one day, in the input capsule on the control ladder. Type the day, or open a calendar to pick it from.

**Value.** The value is an ISO day (`2026-09-24`); the field shows it in the locale's format with its day of the week, and its year only when it is not this one ("Thu, Sep 24" this year, "Thu, Mar 12, 1987"), so a due date put on a Saturday, or a day one off, is seen before it is kept. Cut in a narrow column, the whole day shows in a tooltip on hover; a screen reader hears it whole. Without `presets` the field runs no clock: a page left open past New Year shows last year's days without their year until the field is created again, as when the page is reloaded; a typed day reads today as it is at the key. `focus()` puts the focus on the field.

**Popover.** The capsule's button opens a UiPopover with a UiCalendar on the chosen day, or on today. A pick closes it.

**Typing.** A digit typed on the field starts a day as the app's language writes one: its parts in the locale's order (`12.03.1987` in Russian, `03/12/1987` in American English), any mark between them, or digits alone (`12031987`, `120387`); a part left out is today's (`12.03` is this year's) and a two-digit year is the nearest one at most ten years ahead. The field shows what was typed, and the calendar opens on the day it reads, chosen and in focus, or shows no day while it reads none. Enter takes it; a day that does not exist, or one outside `min` and `max`, is not taken, never guessed: the field is marked invalid until the text changes, and a reader hears why. A press away from the field and its calendar takes it too when it is written in full, day, month and a four-digit year or eight digits, as a text field keeps what was typed; a stray digit or a year half typed (`03/12/19`) is dropped there, not guessed into a day, and a reader hears why. Escape drops it, as do the cross and a preset. Digits of other scripts (`٢٤`, `۲۴`, `２４`) count as theirs, eight of them make a day whatever marks stand between, and a year in the locale's calendar (`2530` in Thai) is read as that calendar's; a calendar whose months differ (Persian, Hijri) takes no typing, its calendar is the way in.

**Clear.** `clearable` adds a cross that empties the field, as in UiSelect. A required field never gets it: there, empty is an error, not a state.

**Presets.** `presets` puts days counted from today under the field: one click instead of the calendar, for the days people enter most often. `true` gives Today, Yesterday, A week ago, Tomorrow, In 3 days, In a week and In 2 weeks; a list picks among them by id (`['today', 'yesterday', 'weekAgo']` for a day spent, `['tomorrow', 'inAWeek']` for a deadline) or adds the app's own, `{ label, days }`, with `days` from today, negative for the past; one whose days are not a finite number, or reach past the year 9999, is left out and said in development, as an id the field does not know is. They move on at midnight while the page stays open. A preset is an action, not a toggle: the field says the day it set, and no button holds room for a check, so three stand on one line.

**Window.** `min` and `max` are read as the calendar reads them: a malformed bound counts as no bound, and bounds given backwards make the same window. A day outside them is kept and reads invalid; a preset outside them is disabled.

**Empty.** No day is `null`: the field sends `null` when cleared and reads `null` (or an empty string) as no day.

**Standalone.** It takes `invalid`, `required` and `ariaLabel`; inside UiField it reads id, error and required from the field.

**Width.** The field keeps its width when a day is picked or cleared and when it turns disabled: the text is sized to the widest date the locale prints, and the cross keeps its place.

**Combobox.** The button is a combobox, as in UiSelect: the chosen date is its value, and the capsule draws the focus ring. ArrowDown or Alt+ArrowDown opens the calendar.

**Attributes.** `class` and `style` land on the root, everything else on the button. The root is the capsule, or, with `presets`, a column that holds the capsule and the presets under it. Without presets the capsule is the root, so a UiButtonGroup can join it to a UiTimePicker or a button.

**Placement.** In a form column under UiField, beside UiInput and UiSelect on the same ladder step, before a UiTimePicker for a day and its hours; in a window's or a drawer's form as well as on a page.

### Keyboard

The button is a combobox.
- `Tab`: reaches it; the presets are buttons that it reaches too.
- `Enter` `Space` `ArrowDown` `Alt+ArrowDown`: open the calendar; `Ctrl` or `Meta` with an arrow stays the browser's.
- `0–9`: starts a typed day and opens the calendar on it.
While a day is typed, on the field or in the panel:
- `0–9` `.` `/` `-` `Space`: go on typing it.
- `Backspace`: takes back the last key.
- `Enter`: takes the day it reads and closes; a day that does not exist is not taken. On a day the arrows moved to it picks that day, as the calendar does.
In the panel the focus lands on the day it opens on, and the calendar's keys apply:
- `Tab`: cycles inside the panel.
- `Escape`: closes it, drops a day being typed, and returns the focus to the button; a pick does the same, inside a window too.
The cross clears the value and leaves the focus on the button, also while the calendar is open.
When the field turns disabled, the calendar closes and the focus stays on the field.

### Screen reader

- Field: a combobox named by `ariaLabel` or the field's label. Its value is the chosen date as the locale prints it, or the placeholder.
- Errors: `required` sets `aria-required`; a day outside the window, a typed day refused, or a field error sets `aria-invalid`; the field's description and error are read with it.
- Panel: named by the field's label; the calendar in it speaks as UiCalendar does.
- Presets: a group named in words, each a button that sets its day; the field says the day.
- Clear: the cross has a name.
- Typing: the field says what is typed; the focus stands on the day it reads, named by its full date; a refused Enter says "Not a date" or that the date is outside the allowed range.

### States

Empty, a day picked, open (the calendar on the chosen day, on today, or on the window's nearest day), disabled (the plate, no calendar, no cross, nothing sent), invalid (standalone, or from a field error), a day outside `min` and `max` (kept, reads invalid), a preset outside the window (disabled), and `clearable` with a day. The width stays the same in all of them.

### When to use another component

- A period in a toolbar: UiDateRange.
- A month on a page with no field: UiCalendar alone.
- A time of day: UiTimePicker beside it.

## Examples

### Presets

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiDatePicker } from 'grani-ui'

const spent = ref<string | null>(null)

const deadline = ref<string | null>(null)
</script>

<template>
  <UiStack class="w-72">
    <UiField label="Spent on" description="Today, Yesterday or a week ago cover most entries.">
      <UiDatePicker v-model="spent" :presets="['today', 'yesterday', 'weekAgo']" class="w-full" />
    </UiField>
    <UiField label="Pay by">
      <UiDatePicker
        v-model="deadline"
        :presets="['tomorrow', 'inAWeek', { label: 'In 30 days', days: 30 }]"
        class="w-full"
      />
    </UiField>
  </UiStack>
</template>

```

### Limits

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { UiField, UiDatePicker, UiRadioGroup, UiRadio } from 'grani-ui'

// Inside the window, or saved before the window moved: out there the day is kept and reads invalid.
const where = ref<'inside' | 'outside'>('inside')

const due = ref<string | null>('2026-09-24')

watch(where, (w) => (due.value = w === 'inside' ? '2026-09-24' : '2026-09-05'))
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <UiField label="Due" description="From 10 Sep to 10 Oct" class="w-72">
      <UiDatePicker v-model="due" min="2026-09-10" max="2026-10-10" class="w-full" />
    </UiField>
    <UiRadioGroup v-model="where" variant="segmented" aria-label="Where the saved day is">
      <UiRadio value="inside">Inside</UiRadio>
      <UiRadio value="outside">Outside</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiDatePicker } from 'grani-ui'

const wrong = ref('2026-09-24')

const locked = ref('2026-09-01')
</script>

<template>
  <UiStack class="w-64">
    <UiField label="Invalid"><UiDatePicker v-model="wrong" invalid class="w-full" /></UiField>
    <UiField label="Disabled">
      <UiDatePicker v-model="locked" disabled clearable class="w-full" />
    </UiField>
  </UiStack>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDatePicker } from 'grani-ui'

const xs = ref('2026-09-24')

const sm = ref('2026-09-24')

const md = ref('2026-09-24')
</script>

<template>
  <div class="flex w-64 flex-col gap-2">
    <UiDatePicker v-model="xs" size="xs" ariaLabel="Date, xs" />
    <UiDatePicker v-model="sm" ariaLabel="Date, sm" />
    <UiDatePicker v-model="md" size="md" ariaLabel="Date, md" />
  </div>
</template>

```

### Row

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiDatePicker, UiInput, UiField, UiButtonGroup, UiTimePicker } from 'grani-ui'

const rowDate = ref<string | null>(null)

const rowAmount = ref<string | null>(null)

const startDay = ref('2026-10-05')

const startTime = ref('09:30')
</script>

<template>
  <UiStack class="w-96 max-w-full">
    <div class="flex w-full items-center gap-2">
      <UiDatePicker v-model="rowDate" ariaLabel="Date" class="w-44" />
      <UiInput v-model="rowAmount" numeric ariaLabel="Amount" placeholder="0.00" class="w-28" />
    </div>
    <UiField label="Starts" group>
      <UiButtonGroup class="w-full">
        <UiDatePicker v-model="startDay" ariaLabel="Day" class="flex-1" />
        <UiTimePicker v-model="startTime" ariaLabel="Time" />
      </UiButtonGroup>
    </UiField>
  </UiStack>
</template>

```

### Window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal, UiStack, UiField, UiInput, UiDatePicker } from 'grani-ui'

const dialogOpen = ref(false)

const inWindow = ref('2026-09-24')
</script>

<template>
  <UiButton variant="outline" @click="dialogOpen = true">Edit invoice</UiButton>
  <UiModal v-model:open="dialogOpen" title="Edit invoice">
    <UiStack>
      <UiField label="Client"><UiInput model-value="Acme Corp" /></UiField>
      <UiField label="Due by">
        <UiDatePicker v-model="inWindow" class="w-full" />
      </UiField>
    </UiStack>
    <template #footer>
      <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
      <UiButton @click="dialogOpen = false">Save</UiButton>
    </template>
  </UiModal>
</template>

```

### Narrow

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiDatePicker } from 'grani-ui'

// A date of another year in a narrow column: cut, and whole in a tooltip on hover.
const born = ref<string | null>('1987-03-12')
</script>

<template>
  <div class="w-36">
    <UiField label="Born">
      <UiDatePicker v-model="born" />
    </UiField>
  </div>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDatePicker } from 'grani-ui'

const ruDay = ref<string | null>('2026-09-24')
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). The day is written in Russian
       with its weekday, the presets come from the ru dictionary, the calendar starts on Monday. -->
  <UiDatePicker
    v-model="ruDay"
    :presets="['today', 'yesterday', 'weekAgo']"
    clearable
    ariaLabel="Paid on"
    class="w-72"
  />
</template>

```

## API

Props:
- `modelValue`: `string | null` (default `null`) — The day, `YYYY-MM-DD` (`v-model`); `null` for none.
- `placeholder`: `string` (default `""`) — Shown while empty; defaults to "Choose a date".
- `min`: `string` (default `""`) — The first day that can be picked, inclusive.
- `max`: `string` (default `""`) — The last day that can be picked, inclusive.
- `presets`: `boolean | (DatePresetId | DatePreset)[]` (default `false`) — Days from today under the field, as one-click picks: `true` for the default seven, or a list of ids and `{ label, days }`.
- `clearable`: `boolean` (default `false`) — A cross that empties the field, as UiSelect's; never shown on a required field.
- `required`: `boolean` (default `false`) — Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so.
- `disabled`: `boolean` (default `false`) — The field cannot be changed: a disabled plate, no calendar, nothing sent with a form.
- `invalid`: `boolean` (default `false`) — Standalone only: the value is wrong. Inside UiField the field's error says so.
- `ariaLabel`: `string` — Standalone only: the accessible name. Inside UiField the label names it.
- `name`: `string` — Sends the day with a form, under this name.
- `id`: `string` — Id of the button, standalone; inside UiField the field's id wins.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string | null`) — A day was picked, or `null` when cleared.

## How it behaves

### Typed as written

- When: a digit is typed on the field.
- Props: none; the order comes from the app’s `locale`.
- Guarantee: The field shows what you type, the calendar opens on the day it reads, selected and focused, and Enter accepts it. A click away from the calendar also accepts it when the date is written in full (day, month and a four-digit year), so a stray digit never changes the field; Escape discards it, wherever focus is in the calendar. A missing part is taken from today, and a two-digit year is the nearest one, at most ten years ahead. A day that does not exist, or one outside `min` and `max`, is not accepted, and a screen reader announces why.
- Without it: A date of birth from a passport is paged to month by month, thirty-nine years back, or typed into a plain text field that reads `03/12` as the twelfth of March in one country and the third of December in another.
- Code: `<UiDatePicker v-model="born" />`
- Your part: Nothing; `createGrani({ locale })` sets the order of the parts.
- Not covered: Words are not read: “tomorrow” or “12 March” is the calendar’s and the presets’ to give. A calendar whose months differ from the Gregorian one (Persian, Hijri) takes no typing; the Buddhist year of Thai is read as written.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "digits typed on the field open the calendar on the day they read, and Enter takes it", "reads the parts in the app’s language: day first in Russian", "a day that does not exist is not taken, nor a day outside min and max", "a press away takes a day typed as Enter would; Escape still drops it", "Escape drops a typed day when the focus is on the panel itself", "a press away from a text that reads no day says so", "a stray digit or a year half typed is dropped on a press away, and said", "a day written in full is taken on a press away, with its marks or as eight digits", "th-TH: the year is read in the calendar the field writes it in", "fa-IR: a day of another calendar is not typed at all, never read as a Gregorian one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#date-as-written

### Day stays the day

- When: a day is picked.
- Props: `v-model`, and `name` in a form.
- Guarantee: The model and the form get the day as `YYYY-MM-DD`, and the field shows that same day, whatever the time zone of the device or of `createGrani({ timeZone })`.
- Without it: The field keeps midnight where the person is, the server reads it in UTC, and the 24th is saved as the 23rd.
- Code: `<UiDatePicker v-model="born" name="born" />`
- Your part: Store it as a date, not a timestamp; turn it into a moment only where one is meant, in the zone that is meant.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "a picked day reaches the model and the form as that day, whatever the zone of the device or the app"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#day-stays-day

### Weekday shown

- When: it holds a day.
- Props: none.
- Guarantee: The field writes the weekday before the date, in the app’s language, and stands as wide as its widest weekday beside its widest month, so a pick never moves what is beside it.
- Without it: The field says “Oct 24, 2026”, and that it is a Saturday comes out when nobody is at work.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Nothing.
- Not covered: Cut in a narrow column, the whole day shows in a tooltip on hover, not on the field itself. Without `presets` the field runs no clock: a page left open past New Year shows last year’s days without their year until the field is created again, as when the page is reloaded.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "shows the day by the locale, or the placeholder when empty", "the field stands over the widest date and keeps the place of the cross, so a pick keeps its width"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#weekday-said

### End after start

- When: it is the end of a period, its `min` bound to the start.
- Props: `:min="from"`.
- Guarantee: In the end field’s calendar, days before the start are disabled. If the start moves past the end you chose, the end stays visible, marked invalid and still submitted, so you can correct it instead of losing it.
- Without it: The end takes any day, and a period from the 25th to the 20th is saved as if it were fine.
- Code: `<UiDatePicker v-model="to" :min="from" />`
- Your part: Bind `min` to the start field’s value, and refuse the save while the end reads invalid, saying why in the field’s error.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "an end bound to its start keeps its day and reads invalid once the start moves past it", "a day outside min and max is kept and reads invalid"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#end-after-start

### Common days

- When: Most entries fall on the same few days.
- Props: `presets`.
- Guarantee: Buttons with days counted from today stand under the field, one press each, and the field shows the day a press set. They are actions, not toggles, so they stay narrow: Today, Yesterday and A week ago fit on one line under a field 288 px wide.
- Without it: You open the calendar to pick yesterday, every time.
- Code: `<UiDatePicker v-model="spent" :presets="['today', 'yesterday']" />`
- Your part: Pass the ids that fit the field in `presets`, or `true` for all seven (Today, Yesterday, A week ago, Tomorrow, In 3 days, In a week, In 2 weeks), and add your own with `{ label, days }`.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "presets pick today and yesterday in one click; the field shows the day they set", "presets true gives the seven default days, in order"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#common-days

### Unreadable is empty

- When: The value is not a valid day.
- Props: none.
- Guarantee: The field shows its placeholder, has no × and submits an empty value, and a warning appears in development.
- Without it: A field built on `Date` rolls 31 February over to 3 March and shows a day nobody entered, or shows “Invalid Date”.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Pass a `YYYY-MM-DD` day or `null`.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "a value that is no day shows empty, has no cross, sends an empty value, and warns in dev"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#unreadable-is-none

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: It sends the day as `YYYY-MM-DD` under its `name`, the day the field shows, and an empty value while it has none.
- Without it: A date field written as a button and a calendar, which the form never sends.
- Code: `<UiDatePicker v-model="due" name="due" />`
- Your part: Give it a `name`.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "name sends the day with a form", "a disabled picker sends nothing with a form", "a value that is no day shows empty, has no cross, sends an empty value, and warns in dev"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Opens where it fits

- When: its field stands near the bottom of the window.
- Props: none.
- Guarantee: The calendar opens above the field when the room below is too short for it and the room above is longer, and under it otherwise. It never covers the field and never leaves the window.
- Without it: A calendar under a field at the end of a long form runs off the screen, and you scroll the page to reach the end of the month.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Nothing.
- Not covered: The room is measured in the window: a scrolling box inside the page does not count, since the panel is drawn over the page, not inside the box.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "near the bottom of the window the calendar opens above the field; near the top, below it"
- Pattern for all components: https://grani.arseni.work/patterns/opening#opens-where-fits

### Steady width

- When: a day is picked or cleared, or the field turns off.
- Props: none.
- Guarantee: Choosing or clearing a date does not move neighboring fields. The field reserves enough width for the longest date in the app’s format or its placeholder, and keeps space for the clear button even when it is hidden.
- Without it: A field as wide as its text: it changes width when a date replaces the placeholder or the clear button appears, and pushes the amount field beside it.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Give the field a width where the row needs one; without it, the field is as wide as its widest date.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "the field stands over the widest date and keeps the place of the cross, so a pick keeps its width", "disabling keeps the width: the cross's place stays"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### Escape, top first

- When: its calendar is open inside a window or a drawer.
- Props: none.
- Guarantee: Escape closes the calendar alone and returns keyboard focus to the field; the window and its half-filled form stay.
- Without it: Escape on the calendar closes the window too, and what you typed in its form is lost.
- Code: `<UiModal v-model:open="editing"><UiDatePicker v-model="due" /></UiModal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "Escape in an open calendar inside a modal closes the calendar only"
- Pattern for all components: https://grani.arseni.work/patterns/closing#escape-top

### Limits shown

- When: The field has `min` or `max`.
- Props: `min`, `max`.
- Guarantee: A date outside the allowed range stays visible, is marked invalid and is still submitted with the form. The calendar opens within the range, and a quick-date button for a day outside it is disabled. Reversed `min` and `max` bounds are read as one range; an invalid bound is ignored.
- Without it: A saved day outside the range is replaced without notice, or a quick-date button picks a day the form then refuses.
- Code: `<UiDatePicker v-model="due" min="2026-09-10" max="2026-10-10" />`
- Your part: Pass `min` and `max`, and explain the limit in the field's description.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "a preset outside min and max is held", "an app's own preset is its words and its days from today; one outside min and max is disabled", "a day outside min and max is kept and reads invalid", "presets follow the calendar's window: backwards bounds are one window, a malformed bound is none"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#limit-shown

### Weekend named

- When: you open the calendar.
- Props: none.
- Guarantee: The calendar it opens names the days of rest in bold, so a due date on a day off is seen before it is picked.
- Without it: A due date set on a Saturday is noticed when nobody is at work to meet it.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "its calendar names the days of rest in bold"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#weekend-shown

### Period rolls

- When: it has presets and the page stays open past midnight.
- Props: `presets`.
- Guarantee: The presets move on within a minute of midnight, in the app’s time zone: after midnight, Today picks the new day.
- Without it: After midnight, Today still picks the day before, and Yesterday the day before that.
- Code: `<UiDatePicker v-model="spent" presets />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "presets follow midnight"
- Pattern for all components: https://grani.arseni.work/patterns/finding#named-period-rolls

### Outside, top first

- When: its calendar is open inside a window.
- Props: none.
- Guarantee: A click away from the calendar closes the calendar alone, and the window stays open.
- Without it: A click beside the calendar closes the window under it as well, with the form in it.
- Code: `<UiModal v-model:open="editing"><UiDatePicker v-model="due" /></UiModal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "a click away from the calendar inside a modal closes the calendar and keeps the modal"
- Pattern for all components: https://grani.arseni.work/patterns/closing#press-top

### Off closes

- When: it is disabled while its calendar is open.
- Props: `disabled`.
- Guarantee: The calendar closes, and keyboard focus moves from the calendar to the field instead of falling to the page.
- Without it: The calendar stays open over a field that no longer accepts a day.
- Code: `<UiDatePicker v-model="due" :disabled="locked" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "disabling closes an open calendar", "disabling while the calendar has the focus keeps it on the field, not on the body"
- Pattern for all components: https://grani.arseni.work/patterns/closing#off-closes

### Cleared in place

- When: The field is `clearable` and holds a day.
- Props: `clearable`.
- Guarantee: The × empties the field and leaves keyboard focus on the field's button, also while the calendar is open, which then closes. A required field has no ×.
- Without it: The × empties the field and keyboard focus is lost, so you have to find the field again.
- Code: `<UiDatePicker v-model="due" clearable />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "the cross clears and leaves focus on the trigger; at xs it fits inside the capsule", "a clear with the calendar open closes it and leaves the focus on the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cleared-in-place

### Focus starts inside

- When: you open the calendar.
- Props: none.
- Guarantee: Continue from the date already selected: the calendar opens on that date and gives it keyboard focus. With no selection, it starts on today, or the nearest allowed day if today is outside the allowed range.
- Without it: The calendar opens on today while your date is in March, and you page back to it month by month.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "opens a calendar on the chosen day; a pick closes it and returns focus to the button", "with no value and today outside the window it opens on the nearest day"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### Focus comes back

- When: you pick a day or close the calendar.
- Props: none.
- Guarantee: Keyboard focus returns to the date field’s button, also when the picker sits inside a window.
- Without it: After a pick, keyboard focus falls to the page: a screen reader loses its place, and you look for the form again.
- Code: `<UiDatePicker v-model="due" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDatePicker.spec.ts, not in the package): "opens a calendar on the chosen day; a pick closes it and returns focus to the button"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useToday`, `useControlSize`, `useUiT`, `announce`.
