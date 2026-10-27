# Code input (`UiCodeInput`)

> Enter a one-time code by typing, pasting or, where the browser supports it, autofill from a message, and let the app know when the code is complete.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/code-input

Also called otp input, one-time code input, pin input, verification code.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiField, UiCodeInput, UiButton } from 'grani-ui'

// The app checks the code; a wrong one is cleared, so the same code can be typed again.
const otp = ref('')

const error = ref('')

const verified = ref(false)

function check(value: string) {
  if (value === '246810') {
    verified.value = true
    error.value = ''
  } else {
    error.value = 'That code is not right. Try again.'
    otp.value = ''
  }
}

// A new code is on its way: the field and its error start over.
function resend() {
  otp.value = ''
  error.value = ''
  verified.value = false
}
</script>

<template>
  <UiCard
    title="Check your phone"
    description="A code went to +1 •••• 0100"
    class="w-full max-w-sm"
  >
    <UiField
      label="Code"
      :description="verified ? 'Checked: the code is right.' : '246810 is the right one here.'"
      :error="error || undefined"
      required
    >
      <UiCodeInput v-model="otp" @complete="check" @update:model-value="verified = false" />
    </UiField>
    <template #footer>
      <span class="me-auto text-xs text-fg-muted">No code yet?</span>
      <UiButton variant="ghost" size="xs" @click="resend">Send it again</UiButton>
    </template>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Type, paste or autofill a code.
- Let the app check a code as soon as it is complete.
- Keep only the characters a code allows.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Show where the next code character goes.
- Keep your browser’s keyboard shortcuts.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Keep `autocomplete` set to `one-time-code` for verification-code autofill unless the field serves another purpose. Autofill availability depends on the browser and message source.
- Check or send the code in `@complete`. If the code is wrong, set the value back to `''`, so the same code can be typed again.
- For a code that is not digits only, set `inputMode="text"`, which allows letters and digits, or pass your own `pattern`. Set `length` when the code is not six characters long.
- Pass the code the app holds as `modelValue`; to clear a wrong code, set it to `''`.
- Give it a `name` where the form is sent natively.
- Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.

## Why it works this way

A field for a one-time code, drawn as one cell per character. Take it for a sign-in or confirm step.

**One input.** One real input lies invisible over the cells and holds the value. So the label, autofill of a code from SMS (`one-time-code`, which a caller's `autocomplete` replaces), paste and Backspace all work as the browser does them; the cells only draw the characters. The lit cell follows the real focus through `:focus-within`, and the hover is drawn from the root, since the input covers the cells.

**Caret.** The caret stays at the end: a click moves it there, and so does the next character after any key or touch that moved it. A selection (double click, drag, select all) is left alone, so the code can be copied.

**Characters.** `inputMode` picks the keyboard, `pattern` the allowed characters. A pasted text longer than the code is filtered first, then cut, so a code inside an SMS survives. A whole code pasted over characters already typed takes their place.

**Size.** Cells stand on the control ladder, `md` by default, because it is the one control on its screen.

**Complete.** `complete` fires once when typing, paste or autofill fill the code. A value set from outside is filtered and cut like a typed one but does not fire it, so a restored draft never submits itself.

**Model.** The input shows the model: when the parent refuses a change, or a form resets, it goes back to the model. The parent clears a wrong code to `''`, so the same code can be typed again.

**Field.** Standalone it takes `invalid` (a red border and halo, and `aria-invalid`; put the reason beside it) and `ariaLabel`; inside UiField it reads id, error and required.

**Attributes.** Attributes and listeners land on the input, `class` and `style` on the root.

**Placement.** Alone in a sign-in or confirm step, or in a UiField on a card or in a window, after the password.

### Keyboard

One real input over the cells: typing fills the next cell, and a paste or an autofill fills the code at once, dropping characters the pattern refuses.
- `Backspace`: removes the last character.
- `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown` `Home` `End`: do not move the caret, with `Ctrl` or `Meta` too.
- `Alt+ArrowLeft` `Alt+ArrowRight`: stay the browser's, a page back or forward; on a Mac, where they jump a word in a text box, the caret comes back to the end.
Nothing is emitted while an IME composes. `disabled` blocks the input, and `focus()` does nothing on it then.

### Screen reader

- Field: one text box named by `ariaLabel` or the field's label, with a hint read with it that says how many characters the code has. A code with no name warns in dev.
- Cells: hidden from a screen reader; the input holds the value.
- Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read with it, and `aria-required` says it is required.

### States

Rest, focus (the cell for the next character lit, the last one on a full code), partly filled, full, hover (the border drawn from the root), disabled (muted, inert), invalid (red border and halo on the cells, `aria-invalid` on the input), and two halves with `separator`.

### When to use another component

- A password: UiInput `type="password"`.
- A number or a text of any length: UiInput.
- A code shown to copy and never typed: UiCopyButton.

## Examples

### Separator

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCodeInput } from 'grani-ui'

const split = ref('482')
</script>

<template>
  <UiCodeInput v-model="split" separator ariaLabel="Verification code" />
</template>

```

### Letters

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCodeInput } from 'grani-ui'

const hex = ref('')
</script>

<template>
  <UiCodeInput
    v-model="hex"
    input-mode="text"
    pattern="[0-9a-fA-F]"
    :length="8"
    size="sm"
    autocomplete="off"
    ariaLabel="Recovery code"
  />
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCodeInput } from 'grani-ui'

const sizes = { xs: ref('1234'), sm: ref('1234'), md: ref('1234') }
</script>

<template>
  <UiCodeInput v-model="sizes.xs.value" :length="4" size="xs" ariaLabel="Code, xs" />
  <UiCodeInput v-model="sizes.sm.value" :length="4" size="sm" ariaLabel="Code, sm" />
  <UiCodeInput v-model="sizes.md.value" :length="4" ariaLabel="Code, md" />
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCodeInput } from 'grani-ui'

const locked = ref('12')

const wrong = ref('1234')
</script>

<template>
  <UiCodeInput v-model="locked" disabled :length="4" ariaLabel="Code, disabled" />
  <UiCodeInput v-model="wrong" invalid :length="4" ariaLabel="Code, invalid" />
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiCodeInput } from 'grani-ui'

// The app keeps this code: what is typed is refused, and the cells and the input stay on it.
const kept = ref('4829')
</script>

<template>
  <UiField
    label="Code set by the app"
    description="Typing is not taken: the code stays as it is."
  >
    <UiCodeInput :model-value="kept" :length="4" />
  </UiField>
</template>

```

### In a form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiCodeInput, UiButton } from 'grani-ui'

const sent = ref('482913')
</script>

<template>
  <form class="flex flex-col items-start gap-4" @submit.prevent @reset="sent = '482913'">
    <UiField label="Code from the SMS">
      <UiCodeInput v-model="sent" name="otp" />
    </UiField>
    <span class="text-xs text-fg-muted">Sends otp={{ sent }}</span>
    <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
  </form>
</template>

```

### In a window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal, UiField, UiCodeInput, UiToaster, useToast } from 'grani-ui'

// A payment confirmed by a code in a window: the code is checked as soon as it is whole; a wrong
// one is cleared with its reason, a right one closes the window into a toast.
const toast = useToast()

// The number kept on one line: a break inside it reads as two numbers.
const PHONE = '+1\u00a0••••\u00a00100'

const dialogOpen = ref(false)

const dialogCode = ref('')

const dialogError = ref('')

const checking = ref(false)

function openPayment() {
  dialogCode.value = ''
  dialogError.value = ''
  dialogOpen.value = true
}

function resendPayment() {
  dialogCode.value = ''
  dialogError.value = ''
}

async function confirmPayment(value: string) {
  checking.value = true
  dialogError.value = ''
  await new Promise((done) => setTimeout(done, 800))
  checking.value = false
  if (value !== '246810') {
    dialogError.value = 'That code is not right. Try again.'
    dialogCode.value = ''
    return
  }
  dialogOpen.value = false
  toast.show({ title: 'Payment confirmed', description: '€1 240.00 to Acme Corp', tone: 'success' })
}
</script>

<template>
  <UiButton @click="openPayment">Pay €1 240.00</UiButton>
  <UiModal
    v-model:open="dialogOpen"
    title="Confirm the payment"
    :description="`€1 240.00 to Acme Corp. A code went to ${PHONE}.`"
    size="sm"
  >
    <UiField
      label="Code"
      :description="checking ? 'Checking the code…' : '246810 is the right one here.'"
      :error="dialogError || undefined"
    >
      <UiCodeInput v-model="dialogCode" @complete="confirmPayment" />
    </UiField>
    <template #footer>
      <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
      <UiButton :disabled="checking" @click="resendPayment">Send it again</UiButton>
    </template>
  </UiModal>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

## API

Props:
- `modelValue`: `string` (required) — The entered code (`v-model`); empty is `''`.
- `length`: `number` (default `6`) — Number of characters in the code, a whole number from 1 to 100; anything else is held to that and warned about in development.
- `inputMode`: `"numeric" | "text"` = `numeric | text` (default `"numeric"`) — Keyboard shown on a phone. `numeric` for SMS, PIN, and authenticator codes. `text` for codes with letters.
- `pattern`: `string | RegExp` — Allowed characters, tested one character at a time (not the whole code). A RegExp or its source. When omitted, `numeric` allows digits and `text` allows letters and digits.
- `disabled`: `boolean` (default `false`) — Prevents entering and editing the code.
- `invalid`: `boolean` (default `false`) — Marks the control as invalid. Inside UiField, the error state sets this automatically.
- `required`: `boolean` — Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so.
- `name`: `string` — Native name for forms.
- `id`: `string` — Own id when standalone. Inside UiField, the field's id takes precedence.
- `ariaLabel`: `string` — Accessible name when there is no visible label.
- `size`: `ControlSize` = `xs | sm | md` (default `"md"`) — Step of the control ladder for the cells.
- `separator`: `boolean` (default `false`) — Shows a short rule between the code groups.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string`) — The code changed.
- `complete` (`value: string`) — The code reached its length.

## How it behaves

### Type, paste, autofill

- When: a code arrives.
- Props: `autocomplete` (`one-time-code` by default).
- Guarantee: One input supports typing, pasting and, where the browser offers it, autofill from a message. Pasted text keeps only the allowed characters and is cut to the code’s length: for a numeric code, “Your code is 482911, do not share it.” becomes 482911. This filters characters; it does not identify a code among several numbers in a message.
- Without it: Six inputs of one character each: a paste puts one character in the first cell, and the rest of the code is lost.
- Code: `<UiCodeInput v-model="code" />`
- Your part: Keep `autocomplete` set to `one-time-code` for verification-code autofill unless the field serves another purpose. Autofill availability depends on the browser and message source.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "a pasted SMS keeps the code inside it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#code-any-way

### Complete once

- When: The last character of the code is entered.
- Props: `@complete`.
- Guarantee: `complete` fires once, with the code, when typing, a paste or an autofill fills the last cell. It fires again only after the code is edited and filled anew. A value set from outside, such as a restored draft, fires nothing.
- Without it: A draft restored into the field is sent for checking as soon as the page opens, before you have typed anything.
- Code: `<UiCodeInput v-model="code" @complete="verify" />`
- Your part: Check or send the code in `@complete`. If the code is wrong, set the value back to `''`, so the same code can be typed again.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "a value set from outside does not fire complete", "complete fires again after a completed code is edited and filled anew", "typing at a full code fires nothing when the model was over length"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#complete-once

### Wrong kind refused

- When: Characters the code does not allow are typed or pasted.
- Props: `pattern`, `inputMode`, `length`.
- Guarantee: Only characters that match the code's pattern stay, and the code is cut at its length. A value set from outside, such as a restored draft, is filtered and cut in the same way.
- Without it: Letters end up in a numeric code, and you find out only when the server refuses a code that could never be valid.
- Code: `<UiCodeInput v-model="code" />`
- Your part: For a code that is not digits only, set `inputMode="text"`, which allows letters and digits, or pass your own `pattern`. Set `length` when the code is not six characters long.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "keeps only allowed characters and cuts at the length; complete fires when full", "a value from outside is filtered like a typed one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#code-refuses-wrong-kind

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses a change, the field and its cells show the app’s code again. A form reset brings the app’s code back too.
- Without it: The cells show a code the app did not accept.
- Code: `<UiCodeInput :model-value="kept" />`
- Your part: Pass the code the app holds as `modelValue`; to clear a wrong code, set it to `''`.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "a change the parent refuses puts the input back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The code is sent under its `name`, and after a form reset the input and its cells show the app's value again.
- Without it: Code cells on screen that the form never sends.
- Code: `<UiCodeInput v-model="code" name="otp" />`
- Your part: Give it a `name` where the form is sent natively.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "in a form it sends the code under its name", "a form reset leaves the input on its model, cells and DOM agreeing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a code is wrong or missing on submit.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the code is the first field with an error, keyboard focus lands in its input, and the cells show a red border and halo, so you can type the code again straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField :error="err"><UiCodeInput v-model="code" /></UiField>`
- Your part: Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "a code marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Cursor moves on

- When: you type a code.
- Props: none.
- Guarantee: While the field has keyboard focus, the cell for the next character is highlighted with a text cursor in it; once the code is full, the last cell is highlighted. Backspace removes the last character, and the highlight moves back.
- Without it: A text cursor lost among six boxes.
- Code: `<UiCodeInput v-model="code" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "the cell for the next character is marked; a full code marks the last one", "Backspace takes the last character and the next cell moves back"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#code-moves-on

### Shortcuts kept

- When: a one-time code is typed.
- Props: none: every UiCodeInput.
- Guarantee: Alt with an arrow goes to the browser, so Alt+Left still goes back a page.
- Without it: Alt+Left, meant to go back a page, moves the cursor inside the code instead.
- Code: `<UiField :error="err"><UiCodeInput v-model="code" /></UiField>`
- Your part: Nothing.
- Not covered: Ctrl or Cmd with an arrow keeps the cursor after the last character: a code is typed from its end, so the field holds that key.
- Proof, in the repository's tests (UiCodeInput.spec.ts, not in the package): "Alt with an arrow goes to the browser (back a page); ⌘ or Ctrl with one keeps the caret at the end"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
