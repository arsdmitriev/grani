# Input (`UiInput`)

> Enter a single line of text, a password or a number in the app’s local format, such as 1 234,50 or 1,234.50.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/input

Also called text field, text input, number input, search field.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiInput } from 'grani-ui'

const value = ref('')

const email = ref('')

const address = ref(
  'Office 4, 12 Long Harbour Street, Northfield Business Park, second floor, reception on the left',
)
</script>

<template>
  <UiStack class="w-full max-w-80">
    <UiField label="Name">
      <UiInput v-model="value" placeholder="Anna Petrova" />
    </UiField>
    <UiField
      label="Email"
      description="We send the receipt here."
      :error="email.includes('@') || !email ? undefined : 'Enter an address with @'"
      required
    >
      <UiInput v-model="email" type="email" autocomplete="email" />
    </UiField>
    <UiField label="Delivery address">
      <UiInput v-model="address" />
    </UiField>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Make small changes without losing decimal precision.
- Enter numbers in the app’s local format.
- Change a number with the arrow keys.
- Show a password without leaving the field.
- Submit the values shown in the form.
- See the value the app actually accepted.
- Finish a word in any script before it is sent.
- Clear a search in one step.
- Go straight to the field that needs fixing.
- Clear a field and enter its replacement immediately.
- Keep your browser’s keyboard shortcuts.
- Announce required fields in words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `step`, and `min` and `max` where the value has bounds.
- The model contains a number written as text with a decimal point, such as `1234.50`, or `null` for an empty field. Text the field cannot read for sure reaches the model as written, and the model alone cannot tell it from a number: in Russian, 2,500 and an unsure 2.500 both arrive as `2.500`. Listen to `unsure`: it is `true` while the field holds such text, typing included, and every field says it again when it mounts, so refuse to save while it is `true`.
- Pass `step`, and `min` and `max` where the value has bounds. Check typed values yourself: only the arrows stop at the bounds.
- Give it a `name` where the form is sent natively.
- Pass the value the app holds as `modelValue`.
- Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Set `required` on the UiField.

## Why it works this way

A one-line text field in a capsule. Take it for text, a number or a password, with addons at either end.

**Capsule.** The capsule carries the border, background, height and focus ring. `#start` and `#end` hold addons: a unit, an icon, a button, a counter. Addons share the capsule but are not part of the value. A unit is its short form, two or three letters (`kg`, `pcs`), not a word. A button last in `#end` sits as close to the edge as the password eye does.

**Password.** A `password` gets an eye that shows the characters; `v-model:passwordVisible` drives it from outside. The eye keeps the focus in the value. It never offers the browser's own spellcheck, autocapitalize or autocorrect, shown or hidden, so a password never reaches a server's suggestions. To generate and copy a password, take UiPasswordField.

**Numbers.** A number is `numeric`, never `type="number"`: that type rejects the comma of a Russian keyboard and empties the field. With `step` the field draws its own arrows and moves by the step on ArrowUp and ArrowDown, the caret kept where it was and the digits the value was written with (`10.99` goes to `11.00`). `min` and `max` bound the arrows, not the typing; an arrow stops at its bound, one off the step's grid too. A number with a unit in `#end` is as wide as its digits, the unit after them; give it a `placeholder` (`0.00`), or an empty field shows the unit alone at the start.

TypeScript checks against `numeric` written as it is: `bare` with it does not compile, and a field that turns numeric at run time is two tags, one under `v-if` and one under `v-else`: `:numeric="flag"` does not compile.

**Bare.** `variant="bare"` drops the capsule: for a field in a window's header, such as a search over its results in UiModal's `#header`.

**Search.** A `search` with text shows a cross that clears it; Escape clears it too. With `loading` (its results on their way) the cross turns into its spinner, the same button, so a focus on it stays, and clearing waits: a press and an Escape clear nothing then.

**Value.** The value is text, numbers included: the owner parses it when it uses it, and a number passed in is read as its text. Empty follows the library's one rule: a text field is empty at `''`; a `numeric` one holds a number, so empty is `null`, and it sends `null` when emptied. The field shows the model: when the owner refuses a change, or a form resets, it goes back to it. A native form gets a number as the field shows it, `12,5` in a locale with a decimal comma.

**Locale.** A number is read in the app's locale: "1 234,50" pasted in a Russian app is 1234.50, "1,234" is a thousand in English, and so is "1.234" in German. Text the locale cannot read for sure ("1,23" in English), or with no digit at all, is kept as written, reaches the model as it is and is marked invalid on blur. The model cannot tell such text from a number ("2,500" and an unsure "2.500" are both `2.500` in Russian), so the field says it: `unsure` is `true` while it holds such text, and the app refuses to save then.

**Field.** Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and required from the field.

**Attributes.** Attributes and listeners land on the input (`pattern`, `autocapitalize`, `@blur`); `class` and `style` on the capsule. A change the field makes itself (an arrow, the cross, Escape) comes through `update:modelValue` alone, not a DOM `input` event.

**Placement.** In UiField; joined with a button in UiButtonGroup (a search); inside UiPasswordField; as the search of UiTableToolbar; as the count of UiStepper, between its minus and plus; and in a form column beside UiTextarea, UiSelect and UiDatePicker.

### Keyboard

A native text field.
- `Tab`: reaches it; a button in `#end`, or the cross of a search with text, comes next, one step later, since the number arrows are out of the tab order.
- `ArrowUp` `ArrowDown`: with `numeric` and `step`, move the value by the step without moving the caret, and stop at `min` and `max`; with Shift, Alt, Ctrl or Cmd held they are the browser's.
- `Escape`: in a `search` with text, clears it and goes no further; while its results are on their way it clears nothing and still goes no further; in an empty one it passes on.
Keys do nothing while an IME composes. The eye and the arrows keep the focus and the caret in the value.

### Screen reader

- Field: a text box named by `ariaLabel` or the field's label, never by the placeholder. A field with no name warns in dev.
- Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read with it, and `aria-required` says it is required.
- Eye: a toggle button with its own name and `aria-pressed`.
- Arrows: named by the field, "Increase Price" and "Decrease Price".
- Search cross: has a name.
- Loading: the field and the cross say busy (`aria-busy`); in a search a status region in the capsule, there from the start, says "Searching".

### States

Rest, hover, focus (the capsule draws the ring), disabled (its own plate), readonly (looks ordinary, cannot be edited), invalid (red border and halo; disabled wins over it), with addons, `numeric` with its arrows, `password` shown or hidden, a `search` with its cross, a `search` with `loading` (the spinner in the cross's place), and `bare` with no capsule.

### When to use another component

- Several lines: UiTextarea.
- A pick from a list: UiSelect.
- A day: UiDatePicker.
- A count of things, with minus and plus: UiStepper.
- A mark from 1 to N: UiScaleInput.
- A new password with generate and copy: UiPasswordField.
- A one-time code: UiCodeInput.

## Examples

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiInput } from 'grani-ui'

const small = ref('')

const regular = ref('')

const large = ref('')
</script>

<template>
  <UiInput v-model="small" placeholder="xs" ariaLabel="Extra small" size="xs" class="w-40" />
  <UiInput v-model="regular" placeholder="sm, the default" ariaLabel="Small" class="w-40" />
  <UiInput v-model="large" placeholder="md" ariaLabel="Medium" size="md" class="w-40" />
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiInput } from 'grani-ui'

const locked = ref('')

const wrong = ref('ann.work')
</script>

<template>
  <UiInput v-model="locked" placeholder="Disabled" ariaLabel="Disabled" disabled class="w-40" />
  <UiInput model-value="Read only" ariaLabel="Read only" readonly class="w-40" />
  <UiInput v-model="wrong" ariaLabel="Invalid" invalid class="w-40" />
</template>

```

### Addons

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@lucide/vue'
import { UiInput, UiButtonGroup, UiButton } from 'grani-ui'

const listed = ref('12.50')

const query = ref('invoices')

const records = ref('')
</script>

<template>
  <UiInput v-model="listed" numeric :step="0.1" ariaLabel="Price" class="w-40">
    <template #start>$</template>
    <template #end>USD</template>
  </UiInput>
  <UiInput v-model="query" type="search" ariaLabel="Search" class="w-48">
    <template #start><Search aria-hidden="true" /></template>
  </UiInput>
  <UiInput model-value="invoi" type="search" loading ariaLabel="Search" class="w-48">
    <template #start><Search aria-hidden="true" /></template>
  </UiInput>
  <UiButtonGroup ariaLabel="Search" class="w-full max-w-80">
    <UiInput
      v-model="records"
      type="search"
      ariaLabel="Search records"
      placeholder="Search records"
    />
    <UiButton variant="outline">Search</UiButton>
  </UiButtonGroup>
</template>

```

### Bare

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@lucide/vue'
import { UiButton, UiModal, UiInput } from 'grani-ui'

const palette = ref(false)

const find = ref('')

const PAGES = ['Invoices', 'Clients', 'Payments', 'Reports']
</script>

<template>
  <UiButton variant="outline" @click="palette = true">Open the search</UiButton>
  <UiModal v-model:open="palette" title="Search" :padded="false">
    <template #header>
      <UiInput
        v-model="find"
        variant="bare"
        type="search"
        placeholder="Search pages"
        ariaLabel="Search pages"
        class="w-full"
      >
        <template #start><Search aria-hidden="true" /></template>
      </UiInput>
    </template>
    <p
      v-for="page in PAGES.filter((p) => p.toLowerCase().includes(find.trim().toLowerCase()))"
      :key="page"
      class="px-overlay py-2.5 text-sm text-fg"
    >
      {{ page }}
    </p>
  </UiModal>
</template>

```

### Password

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiInput } from 'grani-ui'

const password = ref('correct horse battery staple')
</script>

<template>
  <UiInput
    v-model="password"
    type="password"
    autocomplete="current-password"
    ariaLabel="Password"
    class="w-full max-w-80"
  />
</template>

```

### Numbers

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiInput } from 'grani-ui'

const price = ref('12.50')

const weight = ref('0.75')

const distance = ref('12')

const tempo = ref('140')
</script>

<template>
  <UiInput v-model="price" numeric :step="0.1" :min="0" ariaLabel="Price" class="w-32">
    <template #end>EUR</template>
  </UiInput>
  <UiInput v-model="weight" numeric :step="0.1" :min="0" ariaLabel="Weight" class="w-32">
    <template #end>kg</template>
  </UiInput>
  <UiInput v-model="distance" numeric :step="1" :min="0" ariaLabel="Distance" class="w-32">
    <template #end>km</template>
  </UiInput>
  <UiInput
    v-model="tempo"
    numeric
    inputmode="numeric"
    :step="5"
    :min="1"
    :max="400"
    ariaLabel="Tempo"
    class="w-32"
  >
    <template #end>BPM</template>
  </UiInput>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiInput } from 'grani-ui'

// The app keeps this name: typing is not taken, the field stays on it.
const kept = ref('Acme Corp')
</script>

<template>
  <UiField
    label="Company"
    description="The app keeps this name: typing is not taken."
    class="w-full max-w-80"
  >
    <UiInput :model-value="kept" />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiInput, UiButton } from 'grani-ui'

const sentName = ref('Anna Petrova')
</script>

<template>
  <form
    class="flex w-full max-w-80 flex-col items-start gap-4"
    @submit.prevent
    @reset="sentName = 'Anna Petrova'"
  >
    <UiField label="Name" class="w-full">
      <UiInput v-model="sentName" name="name" />
    </UiField>
    <span class="text-xs text-fg-muted">Sends name={{ sentName }}</span>
    <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
  </form>
</template>

```

### Russian

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiInput } from 'grani-ui'

const ruPrice = ref<string | null>('1234.50')

const ruWeight = ref<string | null>('0.75')
</script>

<template>
  <!-- The app's language: createGrani({ locale: 'ru', translate }). A number shows a decimal comma
       and reads one typed or pasted ("1 234,50" is 1234.50); "1.234" may be a thousand or one and
       a quarter, so it stays as written and turns red when the field is left. The arrows are named
       in Russian, and a form sends the number as it is shown. -->
  <UiInput v-model="ruPrice" numeric :step="0.01" :min="0" ariaLabel="Price" class="w-36">
    <template #end>RUB</template>
  </UiInput>
  <UiInput v-model="ruWeight" numeric :step="0.1" :min="0" ariaLabel="Weight" class="w-32">
    <template #end>kg</template>
  </UiInput>
</template>

```

## API

Props:
- `type`: `"text" | "search" | "email" | "password" | "url" | "tel"` = `text | search | email | password | url | tel` — Native type, `text` by default. A number stays `text` with `numeric`: `type="number"` has its own spinner and rejects a comma.
- `name`: `string` — Native name for forms.
- `id`: `string` — Own id when standalone. Inside UiField the field's id takes precedence, so the label always points at the control.
- `placeholder`: `string` — Hint shown while empty. Not a replacement for a label.
- `autocomplete`: `string` — Browser autofill hint: `email`, `current-password`.
- `inputmode`: `"none" | "numeric" | "text" | "search" | "email" | "url" | "tel" | "decimal"` = `none | numeric | text | search | email | url | tel | decimal` — Keyboard to show on a phone.
- `maxlength`: `number` — Maximum number of characters.
- `readonly`: `boolean` — Prevents editing while keeping the control focusable: something else sets the value.
- `disabled`: `boolean` — Prevents input and interaction.
- `loading`: `boolean` — A request for this value is on its way, as a search: a spinner at the end in the cross's place, and clearing waits.
- `invalid`: `boolean` — Marks the control invalid: red border and halo. Inside UiField the error sets this.
- `required`: `boolean` — Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so.
- `ariaLabel`: `string` — Accessible name when there is no visible label. A prop, not `aria-label`: the root is the capsule, the name belongs to the control.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `passwordVisible`: `boolean` — Whether a `password` shows its characters (`v-model:passwordVisible`). Uncontrolled when omitted: the eye keeps the state.
- `modelValue`: `string | null` (required) — The value as text (`v-model`): empty is `''`, or `null` with `numeric`. A number is plain text (`1234.5`) parsed by its owner on use.
- `variant`: `"capsule" | "bare"` = `capsule | bare` — `capsule` (the default) is the text field. `bare` has no capsule: the field is a window's header, edge to edge, larger type (a search over its results); the window draws the line under it. Text or search only, never `numeric`: no ring, no halo, `size` has no say.
- `numeric`: `boolean` — A number as text: tabular monospaced digits, decimal keyboard, a comma becomes a point, and with an `#end` unit the value sizes to its content so the unit sits right after it.
- `step`: `number` — With `numeric`: arrows in the capsule and ArrowUp/ArrowDown move the value by this much (`0.1` for money, `1` for pieces). A value written more precisely moves by its own last digit.
- `min`: `number` — With `numeric`: the lowest value the arrows reach. Typing is not clamped: the form validates.
- `max`: `number` — With `numeric`: the highest value the arrows reach.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string | null`) — The value changed: text, `''` when emptied, or with `numeric` the number as text and `null` when emptied.
- `update:passwordVisible` (`visible: boolean`) — The eye was toggled.
- `unsure` (`unsure: boolean`) — With `numeric`: `true` while the field holds text the locale cannot read for sure, which the model carries as written; `false` when it does not. Said on mount, then on every change, right after the model it concerns.

Slots:
- `start` with `Record<string, never>` — Addons before the value: a unit, an icon, a text.
- `end` with `Record<string, never>` — Addons after the value: a unit, a counter, a button.

## How it behaves

### Cents kept

- When: a number is stepped with the arrows.
- Props: `numeric` with `step`.
- Guarantee: With a fractional `step`, the arrows use the value’s last decimal place when it is finer than the step: 10.44 with a step of 0.1 becomes 10.45. Results are rounded to the precision in use, so 0.2 plus 0.1 becomes 0.3.
- Without it: A price that jumps from 10.44 to 10.54 under the arrow, or that shows 0.30000000000000004 after two clicks.
- Code: `<UiInput v-model="price" numeric :step="0.1" :min="0" />`
- Your part: Pass `step`, and `min` and `max` where the value has bounds.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a click moves by the precision of the value: a cent stays a cent"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cent-stays-cent

### Number as written

- When: a number is typed or pasted as people write it.
- Props: `numeric`.
- Guarantee: The number is read in the app's locale: 1,234.50 is 1234.50 in English, and 1 234,50 is 1234.50 in Russian. A pasted number with both a point and a comma, such as 1.234,56, is read by the mark that comes last. Text the locale cannot read for sure, or text with no digit at all, stays as written and is marked invalid when you leave the field.
- Without it: A native number field that does not accept the thousands comma and hands the app an empty amount.
- Code: `<UiInput v-model="amount" numeric />`
- Your part: The model contains a number written as text with a decimal point, such as `1234.50`, or `null` for an empty field. Text the field cannot read for sure reaches the model as written, and the model alone cannot tell it from a number: in Russian, 2,500 and an unsure 2.500 both arrive as `2.500`. Listen to `unsure`: it is `true` while the field holds such text, typing included, and every field says it again when it mounts, so refuse to save while it is `true`.
- Not covered: The locale is the app's, set with `createGrani({ locale })`. `unsure` comes right after the model it concerns, so read it when saving, not inside the `update:modelValue` handler. A locale switched at run time reads the shown text again but does not rewrite the model.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a comma becomes a point in the emitted value and in the control", "a pasted formatted number is read the way it is written", "a paste drops the grouping marks of the locale and keeps the magnitude", "a paste the locale cannot read for sure is kept as written and marked invalid", "typing keeps the marks as typed; the field is read on blur", "text with no digit in a number field is marked invalid on blur", "the field tells the app when the model holds text the locale cannot read for sure, and when it no longer does", "while a number is typed the app hears unsure at once, and the red mark waits for blur", "a number field mounted again over a reset model clears the app flag the last one left"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#number-as-written

### Arrows step

- When: it is `numeric` with a `step`.
- Props: `numeric`, `step`, `min`, `max`.
- Guarantee: ArrowUp and ArrowDown, or the Increase and Decrease buttons, adjust the value without moving the text cursor. Changes follow the step and decimal-precision rules, keep the digits the value was written with (10.99 goes to 11.00), and stop at `min` and `max`, including a bound off the step’s grid. The buttons are skipped when tabbing, so Tab continues to the next field.
- Without it: The only way to change a number is to type it again.
- Code: `<UiInput v-model="qty" numeric :step="1" :min="0" />`
- Your part: Pass `step`, and `min` and `max` where the value has bounds. Check typed values yourself: only the arrows stop at the bounds.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "ArrowUp and ArrowDown step and do not move the caret; other keys pass", "ArrowUp at max and ArrowDown at min emit nothing", "a step keeps the caret where it was", "an arrow stops at a bound off the step grid, by key and by button", "a step writes plain digits, never an exponent, and keeps the cents it was written with"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#number-by-arrows

### Eye keeps the cursor

- When: it is a password field.
- Props: `type="password"`.
- Guarantee: The eye button shows or hides the password without moving keyboard focus or the text cursor out of the field, so you can continue typing immediately. `v-model:passwordVisible` lets the app control visibility too.
- Without it: An eye that takes keyboard focus: the next key you type does not reach the password, and you have to click back into the field.
- Code: `<UiInput v-model="password" type="password" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "pressing the eye with a pointer keeps the focus in the value", "the eye keeps the caret where it was"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#eye-keeps-field

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The value is sent under its `name`, and after a form reset the field shows the app's value again.
- Without it: A field on screen that the form never sends.
- Code: `<UiInput v-model="email" name="email" />`
- Your part: Give it a `name` where the form is sent natively.
- Not covered: A `numeric` field sends the number as it shows it: `12,5` in a locale that writes a decimal comma, while the model holds `12.5`. A server that reads such a form reads the comma, or the app sends the model itself.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "in a form it sends its value under its name", "a form reset leaves the input on its model", "Enter settles the number before the form is sent, in the same task", "in a comma locale a native form gets the number as the field shows it, 12,5"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: A refused change disappears from the field, and a form reset brings back the app’s value.
- Without it: The field shows text the app did not accept.
- Code: `<UiInput :model-value="kept" />`
- Your part: Pass the value the app holds as `modelValue`.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a change the parent refuses puts the input back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Words in the making

- When: a word is typed through an input method.
- Props: none: every UiInput.
- Guarantee: `v-model` gets nothing while the word is composed and the whole word once it is picked. A page that redraws the field meanwhile keeps the characters being typed, and Escape and the arrows belong to the input method.
- Without it: A model that changes with every reading, and a redraw that drops what was being composed.
- Code: `<UiInput v-model="name" />`
- Your part: Nothing; keep the model as the field sends it.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "emits nothing mid-composition and the final value at its end", "a re-render of the host mid-composition does not reset the characters being typed", "Escape and the arrow keys during an IME composition do nothing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#word-as-composed

### Search clears

- When: a search field has text.
- Props: `type="search"`.
- Guarantee: A cross clears it and keeps keyboard focus in the field. Escape clears it too and goes no further. In an empty search Escape passes on, so an Escape meant for something around the field, such as a dialog, still reaches it.
- Without it: A search you can clear only by selecting its text and deleting it.
- Code: `<UiInput v-model="q" type="search" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a search with text shows a cross that clears it and keeps the focus", "Escape clears a search with text and goes no further; on an empty one it passes", "Escape in a search whose results are on their way goes no further and clears nothing"
- Pattern for all components: https://grani.arseni.work/patterns/finding#search-clears

### Focus on the error

- When: a form is sent with this field in error.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When this is the first field with an error, focus moves into it so you can correct the value immediately. A red border and focus ring make the field easy to find.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField :error="err"><UiInput v-model="email" /></UiField>`
- Your part: Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "an input marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Cleared in place

- When: A search field has text.
- Props: `type="search"`.
- Guarantee: The × empties the field and leaves keyboard focus in it.
- Without it: The × empties the field and keyboard focus is lost, so you have to find the field again.
- Code: `<UiInput v-model="q" type="search" />`
- Your part: Nothing; do not add a × of your own in `#end`.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a search with text shows a cross that clears it and keeps the focus"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#cleared-in-place

### Shortcuts kept

- When: a number field with arrows.
- Props: `numeric` with `step`.
- Guarantee: ArrowUp and ArrowDown alone change the number by the step. With Alt, Ctrl or Cmd held the number stays and the browser moves the text cursor, and with Shift it selects, as in any text field.
- Without it: Cmd+Up, meant to move the cursor to the start, adds one to the price instead.
- Code: `<UiInput v-model="price" numeric :step="1" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "a numeric field steps on an arrow alone; with Alt, Ctrl or Meta the caret is the browser’s", "Shift with an arrow selects, as the browser does: no step"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

### Required in words

- When: it must be filled.
- Props: `required` on its UiField.
- Guarantee: Inside a required UiField, the input is announced as required (`aria-required`), and the field draws the asterisk.
- Without it: An asterisk that a screen reader skips.
- Code: `<UiField label="Email" required><UiInput v-model="email" /></UiField>`
- Your part: Set `required` on the UiField.
- Proof, in the repository's tests (UiInput.spec.ts, not in the package): "inside UiField it takes the id, the error and required from the field"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
