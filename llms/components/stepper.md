# Stepper (`UiStepper`)

> Count things with minus and plus, such as pieces in a cart or guests on a booking, or type the number when it is far from the current one.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/stepper

Also called quantity input, counter, plus minus input, numeric stepper.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStepper } from 'grani-ui'

const qty = ref<string | null>('2')

const kilos = ref<string | null>('4')

const count = ref<string | null>('1')

const adults = ref<string | null>('1')
</script>

<template>
  <UiStepper v-model="qty" :min="1" :max="20" ariaLabel="Quantity">
    <template #end>pcs</template>
  </UiStepper>
  <UiStepper v-model="kilos" :min="1" ariaLabel="Weight">
    <template #end>kg</template>
  </UiStepper>
  <UiStepper v-model="count" :min="0" size="xs" ariaLabel="Count" />
  <!-- One adult at least: the minus rests inert at the bound. -->
  <UiStepper v-model="adults" :min="1" :max="9" ariaLabel="Adults" />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Change a number with the arrow keys.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Enter numbers in the app’s local format.
- Keep nearby buttons and fields in place.
- Go straight to the field that needs fixing.
- Name each field once for screen readers.
- Announce required fields in words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `min` and `max` where the count has bounds, and `step` if it is not 1.
- Pass the count the app holds as `modelValue`, and say why a count was refused.
- Listen to `unsure` if the count is saved: a count the locale cannot read for sure, such as 1.200 in Russian, reaches the model as written, and `unsure` is `true` while the count holds it.

## Why it works this way

A count of things with minus and plus at its edges, the count between them. Take it for pieces, people, nights: a whole number a person changes by one more often than types.

**Count.** It is a number field, the one UiInput draws with `numeric`: the value is text, empty is `null`, a number pasted or typed is read in the app's locale, and one it cannot read for sure is marked and told through `unsure`, as in UiInput; a press on it moves nothing and marks it at once. The step is `1` unless set; the buttons and ArrowUp and ArrowDown move by it and stop at `min` and `max`, which bound the buttons, not the typing. A count of things takes `min` (`0` or `1`): without it minus goes below zero. A fraction typed into it is carried as written, as a count past `max` is: the form checks it (`Number.isInteger`). The app takes or refuses a count in the same tick it is sent; a count confirmed later is a draft of the app's own. A unit stands after the count in `#end`, its short form (`pcs`, `kg`); an addon before it in `#start`.

**Width.** The count is 3em wide, room for four digits, and the stepper keeps that width in a field rather than stretching across it; given a width, the count takes the room between the buttons, so they stand at the edges and never move. A longer count is cut at its end.

**Field.** Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and required from the field.

**Attributes.** Attributes and listeners land on the input (`@blur`, `data-testid`); `class` and `style` on the capsule.

**Placement.** In a form column under a UiField label; in a row of a list or a cart, beside the name of what is counted; joined with other controls in a UiButtonGroup.

### Keyboard

- `Tab`: reaches the count; the buttons are out of the tab order.
- `ArrowUp` `ArrowDown`: move the count by the step without moving the caret, and stop at `min` and `max`.
The buttons keep the focus and the caret in the count; `disabled` or `readonly` turns them off.

### Screen reader

- Count: a spinbutton named by `ariaLabel` or the field's label; it says its value and its bounds, and no value while the count is unsure. The unit in `#end` is not part of it.
- Buttons: named by what they change, "Decrease Guests" and "Increase Guests", disabled at a bound; out of the tab order.
- Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read with it.

### States

Rest, focus, a button resting at a bound, disabled, readonly, invalid, with a unit, at `xs`, `sm` and `md`.

### When to use another component

- A number with decimals or money: UiInput `numeric`.
- A mark from 1 to N: UiScaleInput.

## Examples

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStepper } from 'grani-ui'

const off = ref<string | null>('3')

const fixed = ref<string | null>('3')

const wrong = ref<string | null>('0')
</script>

<template>
  <UiStepper v-model="off" disabled ariaLabel="Disabled" />
  <UiStepper v-model="fixed" readonly ariaLabel="Readonly" />
  <UiStepper v-model="wrong" :min="1" invalid ariaLabel="Invalid" />
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStepper } from 'grani-ui'

const sized = ref<string | null>('3')
</script>

<template>
  <UiStepper v-model="sized" :min="0" size="xs" ariaLabel="Count, xs" />
  <UiStepper v-model="sized" :min="0" ariaLabel="Count, sm" />
  <UiStepper v-model="sized" :min="0" size="md" ariaLabel="Count, md" />
</template>

```

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiStepper } from 'grani-ui'

const guests = ref<string | null>('0')
</script>

<template>
  <UiField
    label="Guests"
    required
    :error="guests === '0' || !guests ? 'At least one guest' : undefined"
    class="w-72 max-w-full"
  >
    <UiStepper v-model="guests" :min="0" :max="12" />
  </UiField>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStepper } from 'grani-ui'

const ruCount = ref<string | null>('1200')
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). A count typed or pasted as
       Russian writes it (1 200) is read in Russian, and the buttons are named from the ru
       dictionary. -->
  <UiStepper v-model="ruCount" :min="0" :step="100" ariaLabel="Pieces" class="w-40" />
</template>

```

## API

Props:
- `modelValue`: `string | null` (required) — The count as text (`v-model`): `null` when emptied. A number is plain text (`12`) parsed by its owner on use.
- `step`: `number` (default `1`) — How much a button or an arrow key moves the count.
- `min`: `number` — The lowest count the buttons and the arrows reach. Typing is not clamped: the form validates.
- `max`: `number` — The highest count the buttons and the arrows reach.
- `name`: `string` — Native name for forms.
- `id`: `string` — Own id when standalone. Inside UiField the field's id takes precedence.
- `placeholder`: `string` — Hint shown while empty. Not a replacement for a label.
- `readonly`: `boolean` (default `false`) — Prevents editing while keeping the count focusable: something else sets it.
- `disabled`: `boolean` (default `false`) — Prevents input and interaction.
- `invalid`: `boolean` (default `false`) — Marks the control invalid: red border and halo. Inside UiField the error sets this.
- `required`: `boolean` (default `false`) — Standalone only: a count is needed, said to a reader and to a form. Inside UiField the field's `required` says so.
- `ariaLabel`: `string` — Accessible name when there is no visible label.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Attributes are placed by the component itself: its description says where.

Events:
- `update:modelValue` (`value: string | null`) — The count changed: the number as text, `null` when emptied.
- `unsure` (`unsure: boolean`) — `true` while the count holds text the locale cannot read for sure (`1.200` in Russian), which the model carries as written; `false` when it does not. Said on mount, then on every change.

Slots:
- `start` with `Record<string, never>` — An addon before the count: a currency sign, an icon.
- `end` with `Record<string, never>` — A unit after the count, its short form: `pcs`, `kg`.

## How it behaves

### Arrows step

- When: always: its minus and plus, and ArrowUp and ArrowDown in the count.
- Props: `step`, `min`, `max`.
- Guarantee: Minus, plus and the arrow keys move the count by the step and stop at `min` and `max`. A press leaves the focus in the count, so the arrow keys go on from there.
- Without it: Buttons beside a field that take the focus, so the next arrow key goes nowhere, and a count that runs past its bounds.
- Code: `<UiStepper v-model="guests" :min="1" :max="9" ariaLabel="Guests" />`
- Your part: Pass `min` and `max` where the count has bounds, and `step` if it is not 1.
- Not covered: Typing is not clamped: a count typed past `max` stays as typed, and the form checks it.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "the buttons rest at the bounds and while disabled; the keyboard steps too", "pressing minus or plus with a pointer keeps the focus and the caret in the count", "minus and plus at the edges, the count centered in monospace, step 1 by default"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#number-by-arrows

### Back to the value

- When: the app refuses a count, more than it has, or the form is reset.
- Props: `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses the count a press or a key asked for, the stepper shows the count the app holds again. A form reset brings it back too.
- Without it: The stepper shows 6 while the app, with 5 in stock, still holds 5.
- Code: `<UiStepper :model-value="qty" @update:model-value="ask" ariaLabel="Quantity" />`
- Your part: Pass the count the app holds as `modelValue`, and say why a count was refused.
- Not covered: The app takes or refuses a count in the same tick it is sent: a count it answers later is overtaken by the next press or key, so a count confirmed by a server is a draft the app keeps.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "a press of plus the parent refuses leaves the count on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The count is sent under its `name`, and after a form reset it shows the app’s count again.
- Without it: A count on screen the form never sends.
- Code: `<UiStepper v-model="guests" name="guests" ariaLabel="Guests" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "in a form it sends its count under its name, and a reset puts the app's count back"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Number as written

- When: a count is typed or pasted as people write it.
- Props: none.
- Guarantee: The count is read in the app’s locale: a pasted 1 200 is 1200 in Russian.
- Without it: A pasted 1 200 the field cannot read.
- Code: `<UiStepper v-model="pieces" ariaLabel="Pieces" />`
- Your part: Listen to `unsure` if the count is saved: a count the locale cannot read for sure, such as 1.200 in Russian, reaches the model as written, and `unsure` is `true` while the count holds it.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "a count pasted as people write it is read in the app locale", "a count the locale cannot read for sure tells the app, as its number field does"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#number-as-written

### Steady width

- When: the count grows past a digit, 9 to 10.
- Props: none.
- Guarantee: Minus and plus stand at the edges of a count of one width, so a count that grows from 9 to 10 to 100 moves neither of them: pressing plus again lands on plus.
- Without it: A field as wide as its number: at 10 it widens, and the plus moves from under the pointer pressing it.
- Code: `<UiStepper v-model="qty" :min="1" ariaLabel="Quantity" />`
- Your part: Nothing; give the stepper a width where the row needs a wider count.
- Not covered: A count longer than its width is cut at its end, not widened: give the stepper a width for counts that large.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "the count keeps its 3em whatever its digits, minus and plus at the edges, so neither moves"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### Focus on the error

- When: a form is sent with this field in error.
- Props: `error` on UiField.
- Guarantee: When this is the first field with an error, the focus moves into the count.
- Without it: Keyboard focus stays on Save, and you look for the count yourself.
- Code: `<UiField label="Guests" :error="err"><UiStepper v-model="guests" /></UiField>`
- Your part: Nothing.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "in a field in error, focusInvalid lands on the count"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### One name

- When: it stands in a UiField, or takes `ariaLabel`.
- Props: none.
- Guarantee: The count is named once, by its label, and each button says what it changes: Decrease Guests.
- Without it: Two buttons with no name, and a count read with none.
- Code: `<UiField label="Guests"><UiStepper v-model="guests" /></UiField>`
- Your part: Nothing.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "inside UiField the label points at the count, and the error and required reach it", "the buttons are named by what they change: Decrease Guests, Increase Guests"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Required in words

- When: it must be filled.
- Props: `required` on UiField.
- Guarantee: Inside a required UiField, the count is announced as required, and the field draws the asterisk.
- Without it: An asterisk that a screen reader skips.
- Code: `<UiField label="Guests" required><UiStepper v-model="guests" /></UiField>`
- Your part: Nothing.
- Proof, in the repository's tests (UiStepper.spec.ts, not in the package): "inside UiField the label points at the count, and the error and required reach it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words


The patterns: https://grani.arseni.work/patterns
