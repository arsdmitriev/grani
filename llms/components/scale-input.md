# Scale input (`UiScaleInput`)

> Give a rating on a short labeled scale and, where clearing is allowed, take it back by choosing the same value again.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/scale-input

Also called rating, nps scale, likert scale, score input.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput } from 'grani-ui'

const difficulty = ref(6)

const rating = ref(null)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Difficulty" group>
      <UiScaleInput v-model="difficulty" low-label="easy" high-label="hard" />
    </UiField>
    <UiField
      label="Rating"
      description="Empty until you decide. A click on the mark clears it."
      group
    >
      <UiScaleInput v-model="rating" :max="5" low-label="meh" high-label="top" />
    </UiField>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Name states in words, not color alone.
- Take back a scale answer.
- Change a number with the arrow keys.
- Pass a group with one press of Tab.
- Name each field once for screen readers.
- Announce required fields in words.
- Announce scale steps with their meaning.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the mark the app holds as `modelValue`, and explain why a mark was refused.
- Give it a `name`, and check `required` yourself: the hidden input does not.
- Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Keep the numbers or the readout visible.
- Treat `null` as no answer.
- Put it in a UiField with `group`, or give it `ariaLabel`.
- Set `required`, and check for `null` before you save.
- Write the end words in `lowLabel` and `highLabel`.

## Why it works this way

One mark on a scale of a few steps, 1 to 10 by default. Take it for how hard, how good or how much.

**Layout.** A bar of segments is filled up to the mark, with the number in each segment. A readout shows "mark / max" with a unit at its end; the name is the field's, a UiField `group` label over it, or `ariaLabel` alone. Words at the two ends say what low and high mean, and a screen reader hears them with the first and last step.

**Empty.** No mark is `null`, as a choice is: a clear sends `null`.

**Thermometer.** `variant="thermometer"` colors the fill by the mark in five stops, from danger through warning to success, each with an ink that reads on it. `invert` is for scales where more is worse.

**Field.** Standalone it takes `ariaLabel`, `invalid` and `required`. Required is only announced, not enforced, because a hidden input takes no validation. Inside UiField `group` the legend names it, and the description or the error describes it. Invalid tints the empty segments and the frame with the danger tone.

**Form.** `name` sends the mark with a form through a hidden input; nothing is sent while there is no answer or the scale is disabled.

**Stray values.** A value off the scale shows as no answer. It is dropped only when the scale itself shrinks below it.

**Attributes.** Attributes land on the radiogroup, ours where we set one; `class` and `style` on the root.

**Steps.** Twelve steps at most, because a narrower segment cannot be hit with a finger. For a free number take UiInput with `numeric`.

**Placement.** Beside UiRadioGroup `segmented` and UiInput in a form column.

**Loading.** The scale has no loading of its own: while its mark is on its way, its owner draws a UiSkeleton in its shape, a short line where the readout stands over a bar of the control's height for its size (`h-7`, `h-9`, `h-11`), and the field's words at the ends stay, with a `role="status"` of its own that says the load. The demo's Loading tab has it.

### Keyboard

A radiogroup underneath. There is one tab stop: on the mark, or on the first step while there is no answer.
- `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: move the mark from the step in focus; `ArrowUp` at `max` and `ArrowDown` at `min` send nothing.
- `Home` `End`: jump to the ends.
- `Delete` `Backspace`: clear it; a click on the mark clears it too, and `clearable` off stops both.
- `Space` `Enter`: pick the step in focus and never clear.
- `Alt` `Ctrl` `Meta`: keys with them go to the browser.
After a clear or a refused move, the focus returns to the tab stop.

### Screen reader

- Group: a radiogroup named by the field's legend, or by `ariaLabel`; the field's description or error is read with it.
- Step: a radio named by its number out of `max`, the first and the last with their end words; the chosen one is `aria-checked`.
- States: `invalid` is `aria-invalid`; `required` is `aria-required` standalone and silent inside a UiField `group`; `disabled` is `aria-disabled`.

### States

No answer (a dash in the readout), a mark with the bar filled to it, hover, focus, disabled (the disabled tokens; it wins over invalid), invalid (the empty segments and the frame in the danger tone, the frame alone on a full bar), required, `thermometer` colored by the mark, inverted, with or without numbers, and a unit in the readout.

### When to use another component

- A free number: UiInput `numeric`.
- A count of things: UiStepper.
- One answer in words: UiRadioGroup `segmented`.
- A mark shown without editing: UiProgress with `:step="1"`, in a table or on a card.

## Examples

### Thermometer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput } from 'grani-ui'

const energy = ref(8)

const effort = ref(6)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Energy" group>
      <UiScaleInput v-model="energy" variant="thermometer" low-label="empty" high-label="full" />
    </UiField>
    <UiField label="Effort" group>
      <UiScaleInput
        v-model="effort"
        variant="thermometer"
        invert
        low-label="easy"
        high-label="hard"
      />
    </UiField>
  </div>
</template>

```

### Unit

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiScaleInput } from 'grani-ui'

const distance = ref(3)
</script>

<template>
  <!-- Standalone: no field around it, so ariaLabel names it. -->
  <div class="w-80 max-w-full">
    <UiScaleInput
      v-model="distance"
      :max="8"
      unit="km"
      :show-numbers="false"
      aria-label="Distance"
    />
  </div>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSkeleton, UiScaleInput, UiRadioGroup, UiRadio } from 'grani-ui'

// The mark comes with the record: until it does, the field draws the scale's shape.
const markState = ref<'loading' | 'loaded'>('loading')

const loadedMark = ref(6)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col items-center gap-6">
    <!-- The page's own region says the load, as a skeleton placed by hand needs; it stays mounted. -->
    <span role="status" class="sr-only">{{ markState === 'loading' ? 'Loading' : '' }}</span>
    <UiField
      label="Difficulty"
      group
      class="w-full"
      :aria-busy="markState === 'loading' || undefined"
    >
      <!-- The scale's shape while its mark is on its way: the readout's line, the bar, the words. -->
      <div v-if="markState === 'loading'">
        <div class="mb-2 flex h-5.5 items-center justify-end">
          <UiSkeleton class="h-3 w-12" />
        </div>
        <UiSkeleton class="h-9 w-full" />
        <div class="mt-1 flex justify-between text-xs text-fg-muted">
          <span>easy</span><span>hard</span>
        </div>
      </div>
      <UiScaleInput v-else v-model="loadedMark" low-label="easy" high-label="hard" />
    </UiField>
    <UiRadioGroup v-model="markState" variant="segmented" aria-label="State of the field">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput } from 'grani-ui'

const small = ref(4)

const regular = ref(7)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="xs, 28px" group>
      <UiScaleInput v-model="small" size="xs" />
    </UiField>
    <UiField label="sm, 36px" group>
      <UiScaleInput v-model="regular" />
    </UiField>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput } from 'grani-ui'

const needed = ref(null)

const pain = ref(null)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Load" description="Set by the coach" group>
      <!-- Disabled wins over invalid: the bar keeps the disabled tokens. -->
      <UiScaleInput :model-value="4" disabled invalid :readout="false" />
    </UiField>
    <UiField label="How hard was it?" required group>
      <UiScaleInput v-model="needed" low-label="easy" high-label="hard" />
    </UiField>
    <UiField
      label="Pain"
      required
      group
      :error="pain == null ? 'Mark the pain before you save' : undefined"
    >
      <UiScaleInput v-model="pain" :clearable="false" low-label="none" high-label="worst" />
    </UiField>
    <!-- A full bar has no empty segment to redden: the frame alone says it. -->
    <UiField label="Strain" group error="Over the limit for today">
      <UiScaleInput :model-value="10" :readout="false" low-label="idle" high-label="full" />
    </UiField>
  </div>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput } from 'grani-ui'

// The app answers each mark: a low one needs a comment first, so it is refused and the bar stays.
const kept = ref<number | null>(4)

const refusal = ref<string>()

function ask(v: number | null) {
  if (v != null && v <= 2) {
    refusal.value = 'A mark of 2 or less needs a comment. Write it first.'
    return
  }
  refusal.value = undefined
  kept.value = v
}
</script>

<template>
  <UiField label="Rate the delivery" group :error="refusal" class="w-80 max-w-full">
    <UiScaleInput
      :model-value="kept"
      :max="5"
      low-label="poor"
      high-label="great"
      @update:model-value="ask"
    />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiScaleInput, UiButton } from 'grani-ui'

const sentEffort = ref(7)
</script>

<template>
  <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="sentEffort = 7">
    <UiField label="Effort" group>
      <UiScaleInput v-model="sentEffort" name="effort" :readout="false" />
    </UiField>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-fg-muted">{{
        sentEffort == null ? 'Sends nothing' : 'Sends effort=' + sentEffort
      }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

## API

Props:
- `modelValue`: `number | null` (required) — The mark (`v-model`); `null` while there is no answer.
- `min`: `number` (default `1`) — First step of the scale.
- `max`: `number` (default `10`) — Last step. Twelve steps at most.
- `clearable`: `boolean` (default `true`) — A click on the mark, Delete or Backspace clears the answer; off, an answer once given stays.
- `disabled`: `boolean` (default `false`) — Nothing can be picked.
- `invalid`: `boolean` (default `false`) — Marks the control invalid: the empty segments and the frame take the danger tone. Inside UiField the error sets this.
- `required`: `boolean` (default `false`) — An answer is needed: said to a reader on the group. Not enforced by a form: the hidden input takes no validation. Inside UiField group the legend says it instead.
- `unit`: `string` (default `""`) — Shown after the readout: "7 / 10 km".
- `readout`: `boolean` (default `true`) — The line "mark / max" above the bar.
- `id`: `string` — Own id of the group, for a reference from elsewhere (`aria-controls`, a link); a field names it by its legend.
- `name`: `string` — Form field name: a hidden input sends the mark; nothing is sent while there is no answer or the scale is disabled.
- `showNumbers`: `boolean` (default `true`) — Numbers in the segments; off for a dense row.
- `variant`: `"brand" | "thermometer"` = `brand | thermometer` (default `"brand"`) — `brand` fills with the brand; `thermometer` colors the fill by the mark, danger through warning to success.
- `invert`: `boolean` (default `false`) — Reverses the thermometer: more is worse (difficulty, pain, load).
- `lowLabel`: `string` (default `""`) — What the low end means: "easy".
- `highLabel`: `string` (default `""`) — What the high end means: "hard".
- `ariaLabel`: `string` — Accessible name of the scale when there is no UiField around.
- `size`: `"sm" | "xs"` = `xs | sm` — Height of the bar on the control ladder: `xs` 28, `sm` 36. Unset, the app's size (`createGrani({ size })`); `md` is read as `sm`: the scale has no `md`.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: number | null`) — The mark changed; `null` after a clear.

## How it behaves

### Back to the value

- When: the app refuses a mark, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app rejects a rating, the scale returns to the accepted value. When you Tab into it again, focus starts on that value.
- Without it: The bar is filled to a mark the app did not accept.
- Code: `<UiScaleInput :model-value="kept" @update:model-value="ask" />`
- Your part: Pass the mark the app holds as `modelValue`, and explain why a mark was refused.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "a refused pick leaves the bar and the tab stop on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: A hidden input sends the chosen step under its `name`; with no answer, or while disabled, nothing is sent.
- Without it: A scale on screen that the form never sends.
- Code: `<UiScaleInput v-model="effort" name="effort" />`
- Your part: Give it a `name`, and check `required` yourself: the hidden input does not.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "in a form the mark sends under the name, none and disabled send nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a form is sent with no step chosen.
- Props: `invalid`, or the error of its `UiField group`.
- Guarantee: When the scale is the first field with an error, keyboard focus lands on the chosen step, or on the first step when none is chosen, so you can pick an answer from the keyboard.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Pain" group :error="err"><UiScaleInput v-model="pain" /></UiField>`
- Your part: Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "focusInvalid on an invalid scale focuses the chosen segment, else the first"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Words, not only color

- When: the fill is colored by the answer.
- Props: `variant="thermometer"`, `invert`.
- Guarantee: The color comes with the number on each segment and with the readout, such as “7 / 10”; each number takes a text color that stays readable on its segment, filled or empty.
- Without it: A bar that turns red with no number to say how far.
- Code: `<UiScaleInput v-model="energy" variant="thermometer" />`
- Your part: Keep the numbers or the readout visible.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "thermometer numerals take the ink that reads on their stop", "empty numerals read in the body ink on their track"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#level-not-by-colour

### Answer cleared

- When: an answer may be withdrawn.
- Props: `clearable`, on by default.
- Guarantee: A click on the chosen step, Delete or Backspace clears the answer to `null`; Space and Enter never clear. With `clearable` off, an answer once given stays.
- Without it: As with native radios, once a step is checked, the answer cannot be taken back.
- Code: `<UiScaleInput v-model="pain" low-label="none" high-label="worst" />`
- Your part: Treat `null` as no answer.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "a click picks; a click on the mark clears unless clearable is off", "Delete and Backspace obey clearable=false", "Space on the mark keeps it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#mark-taken-back

### Arrows step

- When: you set the answer from the keyboard.
- Props: none.
- Guarantee: The arrow keys move the answer from the step that has keyboard focus, Home and End jump to the ends, and an arrow key past an end changes nothing.
- Without it: A row of buttons that the arrow keys do not move.
- Code: `<UiScaleInput v-model="difficulty" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "one tab stop, on the mark; arrows, Home, End move it and Delete clears", "ArrowUp at max and ArrowDown at min emit nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#number-by-arrows

### One Tab per group

- When: a question is answered on a scale.
- Props: none.
- Guarantee: The scale takes one press of Tab, on the chosen step, or on the first step while there is no answer. The arrow keys move the mark, and Home and End take it to the ends.
- Without it: Each step is its own button, so a scale of ten steps takes ten presses of Tab to pass one question.
- Code: `<UiScaleInput v-model="difficulty" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "one tab stop, on the mark; arrows, Home, End move it and Delete clears"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop

### One name

- When: it sits in a field.
- Props: a `UiField group` around it, or `ariaLabel`.
- Guarantee: The field's label names the scale as a whole, and the description or the error is announced with it, once; each step keeps its own short name.
- Without it: A scale announced with two names, or with none.
- Code: `<UiField label="Difficulty" group><UiScaleInput v-model="difficulty" /></UiField>`
- Your part: Put it in a UiField with `group`, or give it `ariaLabel`.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "inside UiField the label names the group and the description describes it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Required in words

- When: an answer is needed.
- Props: `required`, or a required `UiField group`.
- Guarantee: On its own, the scale is announced as required (`aria-required`); inside a required `UiField group`, the legend says it once instead. The requirement is only announced: the browser does not check it when the form is sent.
- Without it: An asterisk that a screen reader skips.
- Code: `<UiScaleInput v-model="effort" required aria-label="Effort" />`
- Your part: Set `required`, and check for `null` before you save.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "required on the scale says aria-required standalone and stays silent inside a group field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words

### Ends named

- When: its ends mean something.
- Props: `lowLabel`, `highLabel`.
- Guarantee: Each step is named by its number out of the total, “7 of 10”, and the first and last add their end words: “1 of 10, easy”, “10 of 10, hard”.
- Without it: Steps named by their number alone: the words under the ends are printed, but never announced with the step.
- Code: `<UiScaleInput v-model="difficulty" low-label="easy" high-label="hard" />`
- Your part: Write the end words in `lowLabel` and `highLabel`.
- Proof, in the repository's tests (UiScaleInput.spec.ts, not in the package): "the first and last radio name their end words"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#mark-says-its-word


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
