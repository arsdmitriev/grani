# Time picker (`UiTimePicker`)

> Choose hours and minutes or type a time such as 2:30p or 1430. A valid time is kept even if it is not among the listed options.

A component of grani-ui 0.1.0. Dates, stable, since 0.1.0. Page: https://grani.arseni.work/components/time-picker

Also called time input, time field.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTimePicker } from 'grani-ui'

const start = ref('10:30')

const end = ref('12:30')

const work = ref('09:00')

const departs = ref('14:30')

const night = ref('23:00')
</script>

<template>
  <div class="flex w-72 max-w-full flex-col gap-6">
    <UiField label="Starts at" description="Pick in the columns, or type 2:37p or 1437.">
      <UiTimePicker v-model="start" class="w-full" />
    </UiField>
    <UiField label="Ends at" description="Not before the start.">
      <UiTimePicker v-model="end" :min="start" class="w-full" />
    </UiField>
    <UiField label="Opens at" description="Every 15 minutes, from 8 to noon.">
      <UiTimePicker v-model="work" :step="15" min="08:00" max="12:00" class="w-full" />
    </UiField>
    <UiField label="Departs at" description="24 hours, whatever the language.">
      <UiTimePicker v-model="departs" :hour-cycle="24" class="w-full" />
    </UiField>
    <UiField label="Night shift starts" description="10 PM to 6 AM, across midnight.">
      <UiTimePicker v-model="night" min="22:00" max="06:00" :step="30" class="w-full" />
    </UiField>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Respect date limits without losing a value.
- Type a date or a time as your language writes it.
- Close only the top layer with Escape.
- Go straight to the field that needs fixing.
- Clear a field and enter its replacement immediately.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the time the app holds as `modelValue`, and explain why a time was refused.
- Give it a `name`.
- State the allowed window in the field's description, since the list alone does not say why some times cannot be picked.
- Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Treat `null` as no time.
- Put it in a UiField with a `label`, or give it `ariaLabel`.

## Why it works this way

A form field for a time of day, in the input capsule on the control ladder. Take it beside a UiDatePicker or a UiCalendar for a day and its hours.

**Value.** The value is `HH:mm` (`10:30`); one with seconds (`14:30:00`) is read to the minute, and a change sends `HH:mm`. It is shown as the app's language writes a time: `14:30` in Russian, `2:30 PM` in American English.

**Panel.** The button opens a UiPopover with two listboxes side by side, Hour and Minute (a third, Period, in a 12-hour locale); each shows five rows and a half and scrolls the rest (`useVisibleRows`), scrolled on open to the chosen row. A press on an hour sets the value at once, the current minute clamped to the nearest one the window still allows (the first allowed minute with no value yet), keeps the panel open and moves the focus to Minute; a press on a minute sets it and closes the panel, the focus back on the field. A press on a period keeps the hour's number and flips its half of the day, and stays open.

**Typing.** Digits build a time without the search row UiSelect has: one or two are the hour (`9` lights 9, `14` lights 14), three are `H:mm` (`930`, `230`) while the minute fits (`183` stays 18:3_), four `HH:mm` (`0930`, `1437`). A mark after the hour (`9:30`, `9.30`, `9 30`) ends the hour where it is, and a lone digit after it is the minute's tens. Digits of other scripts count as theirs. The hour reads on the 24-hour clock unless `a` or `p` sets its half of the day, and a 12-hour field says the half it reads as it is typed (`2:30 AM`); `a` or `p` with nothing typed moves the time held to that half. A time that does not exist (`9:75`, `2400`) is no time, never one nearby. The field shows what was typed until Enter takes it to the minute, off the step too, and closes; a time that is not one, or one outside the window, is not taken: the field is marked invalid until the text changes, and a reader hears why. A press away takes it too when it is written in full: the hour and two digits of the minute, and in a 12-hour language its half of the day or an hour past 12 (where the half cannot be typed as `a` or `p`, Korean or Arabic, the minute is enough); anything else is dropped there, and a reader hears why. While it is typed the columns show it chosen, the minute once both of its digits are in, off the step too. Backspace takes back the last key, the half of the day too; Escape, the cross, a press on a row and an arrow drop it and give the time held back. Typing opens the panel from the closed field too, and the keys typed while it opens go on with the time, so the pointer picks on the step and the keys reach any minute.

**Hours.** The app's language decides: a 24-hour one draws 00…23 in two columns and writes `14:30`; a 12-hour one draws 12, 1…11 and a Period column of the language's AM/PM words and writes `2:30 PM`. `hourCycle` sets it for every language.

**Window.** `min` and `max` are `HH:mm`. `min` after `max` is read as a window that wraps past midnight (a night shift, 22:00–06:00), not an empty one. An hour with no allowed minute in the window, and a minute outside it, are shown but disabled; a value outside the window is kept and reads invalid.

**Step.** Minutes in a column are multiples of `step` (1..60, a bad step falls back to 1); the default is 5. A value off the step is kept and listed in its own place.

**Empty.** No time is `null`: the cross sends `null`, and `null` or an empty string reads as none. With `name` a form gets the field's name with an empty value, as a native time input sends it.

**Odd values.** `9:30` is read as `09:30`. A value that is not a time (`25:99`) counts as none.

**Width.** The field keeps its width when a time is picked or cleared; cut in a narrow column, the whole time shows in a tooltip on hover. A required field shows no cross.

**Field.** Inside UiField it reads id, error and required. `focus()` puts the focus on it.

### Keyboard

- `Tab`: reaches the combobox.
- `ArrowDown` `Alt+ArrowDown` `Enter` `Space`: open the panel, on the closed field.
- `0–9`: a digit opens the panel and starts the typed time; a mark after the hour (`:` `.` `-` `,` or a space) ends it; in a 12-hour language `a`/`p` set its half of the day.
- `Alt` `Ctrl` `Meta`: a chord with them stays the browser's, on the field and in the panel; only `Alt+ArrowDown` on the closed field is its own.
In the open panel:
- `ArrowUp` `ArrowDown`: move within a column, over the enabled rows; `Home`/`End` to its ends.
- `ArrowLeft` `ArrowRight`: move to the next or the previous column.
- `Enter` `Space`: picks the row, as a press does; on Minute (or Period with no Minute column left to fill) it closes the panel too. With a time typed, Enter takes it and Space is a mark.
- `Backspace`: takes back the last typed key.
- `Escape`: closes the panel; inside a window it closes only the panel.
- `Tab`: moves to the next column and goes round inside, as in UiDatePicker's calendar; `Escape` leaves.
The cross clears the value and keeps the focus on the field.

### Screen reader

- Field: a combobox named by `ariaLabel` or the field's label and says the time as the locale prints it, or the placeholder.
- Panel: Hour, Minute and, in a 12-hour locale, Period are listboxes named in words, the chosen row marked, the focus moving with the rows (roving, not `aria-activedescendant`: three listboxes side by side read better as one tab stop each).
- Icon: the clock icon is hidden from a screen reader.
- Errors: a time outside `min` and `max`, a typed time refused, or a field error, sets `aria-invalid`; `required` sets `aria-required`; the field's description and error are read with it once.
- Typed time: a time not taken is said in words, "Not a time", "Time outside the allowed range" or "Time not kept: type it in full".

### States

Empty, a time picked, open with the chosen hour and minute (and period) highlighted, a time off the step (listed in its place), a time outside the window (kept, reads invalid), a value that is not a time (shown as empty, nothing sent), disabled (nothing sent, the panel closes), invalid, required (no cross), `clearable` with the cross, and joined in a UiButtonGroup. The width holds in all of them.

### When to use another component

- A day: UiDatePicker.
- A duration in minutes: UiInput `numeric`.
- Any other pick from a list: UiSelect itself.

## Examples

### Odd values

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTimePicker } from 'grani-ui'

const early = ref('07:00')

const odd = ref('09:07')

const broken = ref('25:99')
</script>

<template>
  <div class="flex w-72 max-w-full flex-col gap-6">
    <UiField label="Opens at" description="8:00 to 12:00; 7:00 came from old data.">
      <UiTimePicker v-model="early" min="08:00" max="12:00" class="w-full" />
    </UiField>
    <UiField label="Arrived at" description="Kept as it came, off the five-minute step.">
      <UiTimePicker v-model="odd" class="w-full" />
    </UiField>
    <UiField label="Starts at" description="Old data held 25:99: no time, so the field is empty.">
      <UiTimePicker v-model="broken" class="w-full" />
    </UiField>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTimePicker } from 'grani-ui'

const empty = ref<string | null>(null)

const locked = ref('18:00')

const late = ref<string | null>(null)
</script>

<template>
  <div class="flex w-72 max-w-full flex-col gap-6">
    <UiField label="Remind me at">
      <UiTimePicker v-model="empty" clearable class="w-full" />
    </UiField>
    <UiField label="Closes at" description="Set by the venue.">
      <UiTimePicker v-model="locked" disabled class="w-full" />
    </UiField>
    <UiField label="Ends at" required error="Pick when the meeting ends.">
      <UiTimePicker v-model="late" class="w-full" />
    </UiField>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTimePicker, UiButtonGroup } from 'grani-ui'

const sizes = ref({ xs: '09:00', sm: '09:00', md: '09:00' })

const from = ref('09:00')

const until = ref('10:00')
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <UiTimePicker
      v-for="s in ['xs', 'sm', 'md']"
      :key="s"
      v-model="sizes[s]"
      :size="s"
      :ariaLabel="`Time, ${s}`"
    />
    <UiButtonGroup ariaLabel="Opening hours">
      <UiTimePicker v-model="from" ariaLabel="From" />
      <UiTimePicker v-model="until" ariaLabel="Until" />
    </UiButtonGroup>
  </div>
</template>

```

### Modal

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal, UiField, UiTimePicker } from 'grani-ui'

const inWindow = ref('14:00')

const dialogOpen = ref(false)
</script>

<template>
  <UiButton variant="outline" @click="dialogOpen = true">Move the meeting</UiButton>
  <UiModal v-model:open="dialogOpen" title="Move the meeting">
    <UiField label="Starts at">
      <UiTimePicker v-model="inWindow" class="w-full" />
    </UiField>
    <template #footer>
      <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
      <UiButton @click="dialogOpen = false">Save</UiButton>
    </template>
  </UiModal>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTimePicker } from 'grani-ui'

// The app answers each time: meetings end by 6 PM, so a later end is refused and the field stays.
const ends = ref('17:00')

const refusal = ref<string>()

function ask(next: string | null) {
  if (next && next > '18:00') {
    refusal.value = 'Meetings end by 6 PM. Pick an earlier time.'
    return
  }
  refusal.value = undefined
  ends.value = next ?? ends.value
}
</script>

<template>
  <UiField label="Ends at" :error="refusal" class="w-72 max-w-full">
    <UiTimePicker :model-value="ends" class="w-full" @update:model-value="ask" />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTimePicker, UiButton } from 'grani-ui'

const sent = ref<string | null>('10:30')
</script>

<template>
  <form class="flex w-72 max-w-full flex-col gap-4" @submit.prevent @reset="sent = '10:30'">
    <UiField label="Starts at">
      <UiTimePicker v-model="sent" name="at" clearable class="w-full" />
    </UiField>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-fg-muted">{{ `Sends at=${sent ?? ''}` }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTimePicker } from 'grani-ui'

const ruStart = ref('14:30')
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). Russian writes 24 hours, so
       no Period column; American English, on the tabs before, writes 2:30 PM. -->
  <UiTimePicker v-model="ruStart" ariaLabel="Starts at" clearable class="w-48" />
</template>

```

## API

Props:
- `modelValue`: `string | null` (default `null`) — The time, `HH:mm` (`v-model`); `null` for none.
- `step`: `number` (default `5`) — Minutes between two rows of the Minute column.
- `min`: `string` (default `"00:00"`) — The first time the window allows, `HH:mm`.
- `max`: `string` (default `"23:59"`) — The last time the window allows, `HH:mm`; a `min` after it wraps the window past midnight.
- `clearable`: `boolean` (default `false`) — A cross that empties the field.
- `placeholder`: `string` (default `""`) — Shown while empty; defaults to "Pick a time".
- `disabled`: `boolean` (default `false`) — The field cannot be changed.
- `required`: `boolean` (default `false`) — Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so.
- `invalid`: `boolean` (default `false`) — Standalone only: the value is wrong. Inside UiField the field's error says so.
- `name`: `string` — Sends the time with a form, under this name.
- `id`: `string` — Id of the trigger, standalone; inside UiField the field's id wins.
- `ariaLabel`: `string` — Standalone only: the accessible name. Inside UiField the label names it.
- `hourCycle`: `12 | 24` — 12 hours with an AM/PM column, or 24; unset, the app's language decides (`2:30 PM` in American English, `14:30` in Russian). The field writes the time the same way.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string | null`) — A time was picked (`HH:mm`), or `null` when cleared.

## How it behaves

### Back to the value

- When: the app refuses a time.
- Props: `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses the time you pick, the field shows the previous time again.
- Without it: The field shows a time the app is not using.
- Code: `<UiTimePicker :model-value="start" @update:model-value="ask" />`
- Your part: Pass the time the app holds as `modelValue`, and explain why a time was refused.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "a change the parent refuses puts the picker back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: It sends the time as `HH:mm` under its `name`, the time the field shows, an empty value while it has none, and nothing while disabled.
- Without it: A time field on screen that the form never sends.
- Code: `<UiTimePicker v-model="at" name="at" />`
- Your part: Give it a `name`.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "in a form it sends HH:mm under its name, and an empty value while empty", "a disabled picker sends nothing with a form"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Limits shown

- When: The times are limited by `min` and `max`.
- Props: `min`, `max`.
- Guarantee: You can see hours and minutes outside the allowed range, but cannot select them. The range can cross midnight. A previously stored time outside it remains visible and is marked invalid, so you can correct it.
- Without it: A list of only the allowed times: a saved time outside them shows as an empty field, and saving the form sends no time.
- Code: `<UiTimePicker v-model="opens" min="08:00" max="12:00" />`
- Your part: State the allowed window in the field's description, since the list alone does not say why some times cannot be picked.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "a value outside min and max is kept and reads invalid"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#limit-shown

### Typed as written

- When: a digit is typed on the field.
- Props: none; 12 or 24 hours come from the app’s `locale`, or `hourCycle`.
- Guarantee: The field shows what is typed, the Hour column moves to the hour it reads, and Enter takes the time to the minute, off the step too. Three digits are `H:mm` and four `HH:mm`; a mark (`:`, `.`, a space) ends the hour. A 12-hour field says the half of the day it reads (`2:30 AM`) until `a` or `p` sets another. A press away takes the time when it is written in full, and in a 12-hour language with its half of the day; Escape drops it. A time that does not exist, or one outside `min` and `max`, is not taken: the field is marked invalid and a screen reader announces why.
- Without it: A time is scrolled to in a list of minutes, or typed into a plain text field that reads `230` as 23:0 and sends a time nobody meant.
- Code: `<UiTimePicker v-model="starts" />`
- Your part: Nothing; `createGrani({ locale })` sets 12 or 24 hours.
- Not covered: Words are not read: “noon” or “half past two” is the columns’ to give. Where the half of the day is not written with a and p (Korean, Arabic), a press away takes a time written to the minute on the 24-hour clock.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "three digits are H:mm: 230 and Enter is 02:30, not 23:00", "a space after the hour ends it, as a colon does: 9 30 is 09:30, and nothing is emitted before", "Enter on a time that does not exist takes nothing, says so and marks the field invalid", "a time that does not exist is not taken: 2400 is not 02:40", "a press away takes a time typed in full, and drops a shorter one, said", "in a 12-hour language a press away wants the period, or an hour only the 24-hour clock has", "in a 12-hour language the typed text names the half of the day it will be read in", "a time outside the window is not taken by Enter nor by a press away, and said", "Escape drops the typed time wherever the focus is in the panel"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#date-as-written

### Escape, top first

- When: its list is open inside a window.
- Props: none.
- Guarantee: Escape closes the list of times only, and keyboard focus goes back to the field; the window stays open.
- Without it: One Escape closes the list and the window behind it at once.
- Code: `<UiModal v-model:open="open"><UiTimePicker v-model="at" /></UiModal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "Escape in a window closes the list only"
- Pattern for all components: https://grani.arseni.work/patterns/closing#escape-top

### Focus on the error

- When: a form is sent with no time.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the time field is the first one in error, keyboard focus lands on it, so you can enter the time straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Ends at" :error="err"><UiTimePicker v-model="end" /></UiField>`
- Your part: Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "a picker marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Cleared in place

- When: A time may be left empty.
- Props: `clearable`.
- Guarantee: The × sets the value to `null`, and keyboard focus stays on the field. A required field has no ×, because empty is not allowed there.
- Without it: The × disappears together with the time it cleared, and keyboard focus is lost with it.
- Code: `<UiTimePicker v-model="remind" clearable />`
- Your part: Treat `null` as no time.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "the cross clears it and the focus stays on the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cleared-in-place

### One name

- When: it needs a name.
- Props: a UiField around it, or `ariaLabel`.
- Guarantee: A screen reader announces it once, by the field's label or by `ariaLabel`, with the time as the locale writes it; the description and the error are announced with it, once.
- Without it: A time field announced only by its placeholder.
- Code: `<UiField label="Starts at"><UiTimePicker v-model="start" /></UiField>`
- Your part: Put it in a UiField with a `label`, or give it `ariaLabel`.
- Proof, in the repository's tests (UiTimePicker.spec.ts, not in the package): "inside UiField with a description it is named once and described once"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`, `announce`.
