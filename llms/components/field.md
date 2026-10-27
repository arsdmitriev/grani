# Field (`UiField`)

> Give a control its label, hint and error message, connected so a screen reader reads them with it.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/field

Also called form field, form group, label with hint and error.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiInput, UiSelect } from 'grani-ui'

const name = ref('')

const note = ref('')

// A select under its label: a click on the label opens its list, as a click on the select does.
const billing = ref<string | null>('EUR')

const currencies = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
]
</script>

<template>
  <UiStack class="w-full max-w-80">
    <UiField label="Name" description="As in the passport.">
      <UiInput v-model="name" placeholder="Anna Petrova" />
    </UiField>
    <UiField label="Billing currency" description="Invoices are issued in it.">
      <UiSelect v-model="billing" :items="currencies" />
    </UiField>
    <UiField
      label="The address the invoices for this account are sent to every month"
      description="Leave it empty to send them to the owner of the account; the address is checked before the first invoice goes out."
    >
      <UiInput v-model="note" type="email" />
      <template #meta>optional</template>
    </UiField>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Show the error where the hint was.
- Announce required fields in words.
- Name each field once for screen readers.
- Open a field from its label.
- Go straight to the field that needs fixing.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Write the error as an instruction for fixing the value, about as long as the hint.
- Set `required` on the field instead of typing an asterisk into the label.
- Keep one control per field; put a row of controls in a field with `group`.
- Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.

## Why it works this way

The words around one form control: a label above, a description or an error below. Take it around a control that needs a label, and with `group` around a group of them.

**Wiring.** It connects the words to the control by id, `aria-describedby`, `aria-invalid` and `aria-required`. Grani's own controls read it by themselves; a bare element takes the slot props.

**Groups.** One field holds one control. A group of controls (radios, checkboxes, a UiButtonGroup row) takes `group`: the field becomes a fieldset named by its legend. A bare element in a group takes `labelId` for its `aria-labelledby`.

**Required.** Required shows a star. For a screen reader it is `aria-required` on a single control, or a word in the legend of a group, never on each control in it.

**Disabled.** The label mutes when the control inside is disabled. The field judges by the control, not by a button in `#meta`.

**Placement.** In a form column, a window or a drawer body.

### Keyboard

No keys of its own: Tab reaches the control inside it. The label is a native label: a click on it presses the control, as it puts the cursor in an input, so a select opens its list and a dropzone its file dialog.

### Screen reader

- Label: names the control, through `for` and the id, or through `labelId` for a control that cannot take a label.
- Description: the description, the error and `#meta` are read with the control (`aria-describedby`).
- Error: announced when it appears (`role="alert"`); it marks the control `aria-invalid`.
- Required: `required` is `aria-required` on a single control.
- Group: a `group` is a fieldset named by its legend, which says "required" once, in words, and never on each control.

### States

Rest, required (a star), with a description, in error (the error replaces the description; the label keeps its ink), disabled (the label mutes with the control), and `group`.

### When to use another component

- Words on the left and the control on the right: UiListItem `as="label"`.
- A control that carries its own words: UiCheckbox, UiRadio or a UiSwitch with text keeps them in its slot.
- A title over a section of fields: UiHeader `legend`.

## Examples

### Required

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiInput } from 'grani-ui'

const email = ref('ann@work')
</script>

<template>
  <UiField label="Email" required class="w-full max-w-80">
    <UiInput v-model="email" type="email" autocomplete="email" />
  </UiField>
</template>

```

### Error

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiInput } from 'grani-ui'

const wrong = ref('ann.work')
</script>

<template>
  <UiField
    label="Email"
    description="We send the receipt here."
    error="Enter an address with @"
    class="w-full max-w-80"
  >
    <UiInput v-model="wrong" type="email" />
  </UiField>
</template>

```

### Group

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiRadioGroup, UiRadio, UiCheckbox, UiButtonGroup, UiInput, UiSelect } from 'grani-ui'

const days = ref<string[]>(['mon'])

const plan = ref('team')

// A group in error until a seat is picked: the error is the group's, said once with its legend.
const seat = ref<string | null>(null)

const amount = ref('')

const currency = ref<string | null>('EUR')

const currencies = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
]

const toggle = (day: string, on: boolean) => {
  days.value = on ? [...days.value, day] : days.value.filter((d) => d !== day)
}
</script>

<template>
  <div class="flex w-full max-w-80 flex-col gap-6">
    <UiField label="Plan" group>
      <UiRadioGroup v-model="plan">
        <UiRadio value="solo">Solo</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
    </UiField>
    <UiField label="Seat" required group :error="seat ? undefined : 'Pick a seat'">
      <UiRadioGroup v-model="seat">
        <UiRadio value="window">Window</UiRadio>
        <UiRadio value="aisle">Aisle</UiRadio>
      </UiRadioGroup>
    </UiField>
    <UiField label="Days" required group>
      <div class="flex gap-4">
        <UiCheckbox
          :model-value="days.includes('mon')"
          @update:model-value="toggle('mon', $event)"
          >Mon</UiCheckbox
        >
        <UiCheckbox
          :model-value="days.includes('tue')"
          @update:model-value="toggle('tue', $event)"
          >Tue</UiCheckbox
        >
      </div>
    </UiField>
    <UiField label="Amount" required group>
      <UiButtonGroup>
        <UiInput v-model="amount" inputmode="decimal" ariaLabel="Amount" />
        <UiSelect v-model="currency" :items="currencies" ariaLabel="Currency" />
      </UiButtonGroup>
    </UiField>
  </div>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiField, UiInput } from 'grani-ui'
</script>

<template>
  <UiField label="Account" description="Set by the administrator." class="w-full max-w-80">
    <UiInput model-value="ops@work" disabled />
    <template #meta>locked</template>
  </UiField>
</template>

```

### Meta

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

const courier = ref('')
</script>

<template>
  <UiField label="Note for the courier" class="w-full max-w-80">
    <UiTextarea v-model="courier" :maxlength="200" :rows="3" />
    <template #meta>{{ courier.length }} / 200</template>
  </UiField>
</template>

```

## API

Props:
- `label`: `string` — Visible label above the control.
- `description`: `string` — Supporting text below the control: a format, a limit, a unit. Hidden while `error` is present.
- `error`: `string` — Error text below the control, one string; it marks the control invalid. Empty means valid. Read out when it appears.
- `required`: `boolean` (default `false`) — An asterisk after the label and `aria-required` on the control; in a group the legend says it once.
- `for`: `string` — Id of the control the label points to; the description and error ids derive from it. Generated when omitted.
- `group`: `boolean` (default `false`) — The control is a group of controls (radios, checkboxes): the field is a `fieldset`, the label its `legend`, and the group takes `labelId` for `aria-labelledby`. No `#meta`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `{ id?: string | undefined; labelId?: string | undefined; describedBy?: string | undefined; invalid: boolean; required: boolean; }` — The control. A grani control connects through `useField`; a bare element takes the slot props.
- `meta` with `Record<string, never>` — Content at the right end of the label row, aligned with the label: a counter, a hint icon. Read with the control as a description.

## How it behaves

### Error replaces hint

- When: an error appears under a field that has a description.
- Props: `description`, `error`.
- Guarantee: The error takes the hint’s place, so you can find the correction where you were already reading the instructions. If it fits in the same space, the fields below do not move. A screen reader announces the error and the control’s invalid state. The label keeps its usual color, and the hint and its connection to the control return when the error clears.
- Without it: The error stacks under the hint, the field grows, and the next field jumps down under the pointer.
- Code: `<UiField label="Email" description="We send the receipt here." :error="err">…</UiField>`
- Your part: Write the error as an instruction for fixing the value, about as long as the hint.
- Proof, in the repository's tests (UiField.spec.ts, not in the package): "an error is announced, marks the control invalid and replaces the description; the label keeps its ink", "when the error clears the description returns and the wiring follows"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#error-takes-the-hints-place

### Required in words

- When: a field must be filled.
- Props: `required`.
- Guarantee: The label shows an asterisk, and `aria-required` identifies the requirement to a screen reader. In a `group`, “required” is included once with the group’s label. For a dropzone, it is included in the Browse button’s description.
- Without it: The asterisk is visible, but a screen reader does not announce it, so some people discover the requirement only when the form is rejected.
- Code: `<UiField label="Email" required>…</UiField>`
- Your part: Set `required` on the field instead of typing an asterisk into the label.
- Proof, in the repository's tests (UiField.spec.ts, not in the package): "required puts an asterisk on the label and aria-required on the control", "a required group of radios hears "required" once, from the legend", "a required field around a dropzone says required in words"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words

### One name

- When: it wraps any control.
- Props: `label`.
- Guarantee: A screen reader identifies the control by its label and reads its hint or error with it. The field connects the label to the control through its id, or through `labelId` when the control cannot use a native label. Two controls in one field trigger a development warning.
- Without it: A control announced twice, or with no name, and its hint never announced.
- Code: `<UiField label="Name"><UiInput v-model="name" /></UiField>`
- Your part: Keep one control per field; put a row of controls in a field with `group`.
- Proof, in the repository's tests (UiField.spec.ts, not in the package): "labels the control through a generated id", "warns in dev when a field holds two controls", "a bare element in a group field takes labelId for aria-labelledby and gets no id", "a required group of input and select marks the legend once, not each control"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Label opens

- When: it holds a single control.
- Props: none: any UiField.
- Guarantee: A click on the label presses the control, as it puts the cursor in a text field: a select opens its list and a dropzone its file dialog. It holds for the control the label points at by its id.
- Without it: A label set above the control by hand and not tied to it: a click on it does nothing, and the list opens only from the select itself.
- Code: `<UiField label="Currency"><UiSelect v-model="currency" :items="CURRENCIES" /></UiField>`
- Your part: Nothing.
- Not covered: A radio group and a scale take a `group` field, whose legend presses nothing: each option takes its own click.
- Proof, in the repository's tests (UiField.spec.ts, not in the package): "the label resolves to the control, so a click on it focuses the control", "a click on the label of a select opens its list, as a click on the select does", "a click on the label of a dropzone opens the file dialog, as Browse does"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#label-opens

### Focus on the error

- When: a form is sent with this field in error.
- Props: `error`.
- Guarantee: The control is marked invalid so the form can find it, bring it into view and move focus to it. In a `group` field, focus goes to the selected radio option, or the first if none is selected.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Seat" group :error="err">…</UiField>`
- Your part: Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiField.spec.ts, not in the package): "a group field in error: focusInvalid lands on a radio inside the group"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
