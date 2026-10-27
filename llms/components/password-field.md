# Password field (`UiPasswordField`)

> Set a new password by typing or generating one, check it on screen and copy it; a screen reader confirms the generation without reading the password.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/password-field

Also called password input, password generator.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiPasswordField, UiInput } from 'grani-ui'

const password = ref('')

const repeat = ref('')
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiField label="New password" description="At least 10 characters.">
      <UiPasswordField v-model="password" @generate="repeat = $event" />
    </UiField>
    <UiField label="Repeat" description="Filled for you after a generated password.">
      <UiInput v-model="repeat" type="password" autocomplete="new-password" />
    </UiField>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See whether an action worked.
- See the value the app actually accepted.
- Submit the values shown in the form.
- See the password you generate.
- Generate a password instead of inventing one.
- Name each field once for screen readers.
- Announce a new password without reading it.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the password the app holds as `modelValue`.
- Give it a `name`, and give the repeat field a name of its own.
- Bind the field with `v-model`; the generated password appears when the app accepts the new value. Use `@generate` to copy it into a repeat-password field.
- Set `length` where your policy asks for more than 16 characters; a value under 10 is raised to 10. Check any other rule of your policy yourself.
- Put it in a UiField with a `label`, or give it `ariaLabel`.

## Why it works this way

A field for setting a new password, with buttons to show, copy and generate it. Signing in and signing up take UiInput `type="password"` instead.

**Layout.** The eye that shows the password sits inside the field (UiInput). Beside the field, 8px apart, stand a copy button (UiCopyButton, once there is a value) and, at the end, a generate button (`generatePassword`). Generate is last, so it never moves under the pointer when copy appears. `:copy="false"` leaves copy out, where a password must not reach the clipboard.

**Generate.** A generated password has a lower-case letter, an upper-case letter, a digit and a symbol. Once the owner accepts it, it is shown at once, announced to a screen reader without its value, and emitted through `generate`, so a form can fill its "repeat" field itself. When the owner refuses it, nothing is said or shown.

**Hiding.** Emptying the field hides the password again.

**Empty.** The password is text, and empty is `''`, never `null`.

**Attributes.** `class` and `style` land on the row, everything else on the input.

**Placement.** In UiField, which gives the label, description and error, beside UiInput `type="password"` for the repeat.

**Signing in.** It is not for signing in or signing up: there, a generated password the person never saw is one they cannot type again.

### Keyboard

A row.
- `Tab`: reaches the input, its eye, then copy, then generate.
- `Enter` `Space`: on generate, fill the field and show the password; on copy, copy it. Neither submits the form around them.
When the copy button disappears under the focus (the value emptied, the field disabled), the focus moves to generate. `disabled` blocks typing and generate and takes the copy button away; `readonly` blocks generate and keeps copy.

### Screen reader

- Input: named by the field's label or by `ariaLabel`; `invalid` sets `aria-invalid` on it, and the field's words are read with it.
- Buttons: copy and generate are icon buttons with their own names; copy says it copies the password.
- Generate: a generated password is announced without its value, again on a second generate.
- Copy: UiCopyButton says the outcome from the page's live region, or from the open window's.
- Eye: says whether the password is shown (`aria-pressed`).

### States

Empty (no copy button), with a value (copy appears before generate, which never moves), shown or hidden by the eye, generated (shown at once), disabled (all three blocked), readonly (copy kept, generate blocked), and invalid.

### When to use another component

- Signing in or signing up: UiInput `type="password"`.
- The repeat field beside it: UiInput `type="password"` too.
- A secret given to copy and never typed: UiCopyButton with an `ariaLabel` and neither `label` nor `truncate`, which would put it on the screen and in its name.

## Examples

### Sign in

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiStack, UiField, UiInput, UiButton } from 'grani-ui'

const login = ref('anna@example.com')

const secret = ref('')
</script>

<template>
  <!-- Signing in recalls a password, never makes one: UiInput type="password", its eye alone. -->
  <UiCard title="Sign in" class="w-full max-w-sm">
    <UiStack>
      <UiField label="Email">
        <UiInput v-model="login" type="email" autocomplete="username" />
      </UiField>
      <UiField label="Password">
        <UiInput v-model="secret" type="password" autocomplete="current-password" />
      </UiField>
    </UiStack>
    <template #footer>
      <UiButton class="w-full">Sign in</UiButton>
    </template>
  </UiCard>
</template>

```

### Options

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiPasswordField } from 'grani-ui'

const noCopy = ref('correct horse battery staple')

const recovery = ref('')
</script>

<template>
  <UiStack class="w-full max-w-sm">
    <UiField
      label="New password"
      description="No copy button: this password must not reach the clipboard."
    >
      <UiPasswordField v-model="noCopy" :copy="false" />
    </UiField>
    <UiField label="Recovery key" description="Generate one: 32 characters.">
      <UiPasswordField v-model="recovery" :length="32" />
    </UiField>
  </UiStack>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPasswordField } from 'grani-ui'

const small = ref('correct horse battery staple')

const regular = ref('correct horse battery staple')

const large = ref('correct horse battery staple')
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <UiPasswordField v-model="small" ariaLabel="Password, xs" size="xs" />
    <UiPasswordField v-model="regular" ariaLabel="Password, sm" />
    <UiPasswordField v-model="large" ariaLabel="Password, md" size="md" />
  </div>
</template>

```

### Error

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiPasswordField } from 'grani-ui'

const short = ref('abc')

const wrong = ref('abc')
</script>

<template>
  <UiStack class="w-full max-w-sm">
    <UiField
      label="New password"
      :error="short.length < 10 ? 'At least 10 characters' : undefined"
    >
      <UiPasswordField v-model="short" />
    </UiField>
    <UiPasswordField v-model="wrong" invalid ariaLabel="New password" />
  </UiStack>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiField, UiPasswordField } from 'grani-ui'

const locked = ref('Kept-by-the-admin-7')
</script>

<template>
  <UiStack class="w-full max-w-sm">
    <UiField label="Disabled"><UiPasswordField model-value="hidden" disabled /></UiField>
    <UiField label="Service password" description="Copy it; it is set by the administrator.">
      <UiPasswordField v-model="locked" readonly />
    </UiField>
  </UiStack>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiPasswordField } from 'grani-ui'

// The app keeps this password: a generated one is refused, nothing is shown or said.
const kept = ref('correct horse battery staple')
</script>

<template>
  <UiField
    label="Password"
    description="The app keeps this one: a generated password is not taken."
    class="w-full max-w-sm"
  >
    <UiPasswordField :model-value="kept" />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiPasswordField, UiInput, UiButton } from 'grani-ui'

const sent = ref('')

const sentRepeat = ref('')
</script>

<template>
  <form
    class="flex w-full max-w-sm flex-col items-start gap-4"
    @submit.prevent
    @reset="((sent = ''), (sentRepeat = ''))"
  >
    <UiField label="New password" class="w-full">
      <UiPasswordField v-model="sent" name="password" @generate="sentRepeat = $event" />
    </UiField>
    <UiField label="Repeat" class="w-full">
      <UiInput v-model="sentRepeat" type="password" name="repeat" autocomplete="new-password" />
    </UiField>
    <span class="text-xs text-fg-muted">{{
      sent ? 'Sends password and repeat' : 'Sends nothing yet'
    }}</span>
    <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
  </form>
</template>

```

## API

Props:
- `modelValue`: `string` (required) — The password (`v-model`); empty is `''`.
- `name`: `string` — Native name for forms.
- `placeholder`: `string` — Hint shown while empty.
- `autocomplete`: `"new-password" | "current-password"` = `new-password | current-password` (default `"new-password"`) — Password manager hint: `new-password` when setting one, `current-password` when signing in.
- `disabled`: `boolean` (default `false`) — Nothing can be typed, generated or copied.
- `readonly`: `boolean` (default `false`) — The password is shown and copied but not changed: typing and generate are held.
- `invalid`: `boolean` (default `false`) — Marks the input invalid standalone. Inside UiField the error sets this.
- `id`: `string` — Own id of the input when standalone. Inside UiField the field's id takes precedence.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder for the field and both buttons. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `length`: `number` (default `16`) — Length of a generated password; never under 10.
- `ariaLabel`: `string` — Accessible name of the input when no UiField label names it.
- `copy`: `boolean` (default `true`) — The copy button beside the field; `false` leaves it out, where a password must not reach the clipboard.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string`) — The value changed, typed or generated.
- `generate` (`value: string`) — A generated password the owner took: it holds no typo, a form may copy it into its repeat field. Not fired when the owner refused it.

## How it behaves

### Outcome shown

- When: a password is generated or copied.
- Props: none.
- Guarantee: When a password is generated, a screen reader confirms it without reading the password. The copy button announces its own result. Generating or copying again produces a new confirmation.
- Without it: A press with no answer: you cannot tell whether anything happened.
- Code: `<UiPasswordField v-model="password" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "says a password was generated, without saying it, and says it again on a second generate"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses a generated password, the field does not reveal it and a screen reader does not announce it. A form reset brings back the app’s value.
- Without it: The field shows a generated password the app did not accept, and you might copy it.
- Code: `<UiPasswordField :model-value="kept" />`
- Your part: Pass the password the app holds as `modelValue`.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "a generate the owner refuses says nothing, reveals nothing and emits no generate"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The password is sent under its `name`, a generated one included, and after a form reset the field shows the app's value again. Generate and Copy are plain buttons, so pressing them inside a form does not send it.
- Without it: A password field the form never sends, or a Generate button that sends the form before it is filled in.
- Code: `<UiPasswordField v-model="password" name="password" />`
- Your part: Give it a `name`, and give the repeat field a name of its own.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "in a form it sends the generated password under its name; a reset keeps it on its model", "generate and copy inside a form do not submit it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Password shown

- When: a password is generated.
- Props: none; Generate is the button at the end.
- Guarantee: The generated password appears in plain text and the copy button becomes available once the app accepts the value. Clearing the field turns password hiding back on for the next password you type.
- Without it: A password set behind dots that you never saw and cannot type again.
- Code: `<UiPasswordField v-model="password" @generate="repeat = $event" />`
- Your part: Bind the field with `v-model`; the generated password appears when the app accepts the new value. Use `@generate` to copy it into a repeat-password field.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "generate fills the field, shows it and says so; the copy button wakes up", "hides the password again once the value is emptied"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#made-is-seen

### Strong on offer

- When: you set a new password.
- Props: `length` (16 by default, never under 10).
- Guarantee: Generate is one press away, and the password it gives has a lowercase letter, an uppercase letter, a digit and a symbol, at the length set by `length`.
- Without it: You are left to invent a password that the policy may refuse.
- Code: `<UiPasswordField v-model="key" :length="32" />`
- Your part: Set `length` where your policy asks for more than 16 characters; a value under 10 is raised to 10. Check any other rule of your policy yourself.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "generate fills the field, shows it and says so; the copy button wakes up"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#strong-on-offer

### One name

- When: it sits in a field.
- Props: `ariaLabel`, or the label of its UiField.
- Guarantee: The input is named by the field's label, or by `ariaLabel` when the field has no label; the show, copy and generate buttons have names of their own, such as “Copy the password”.
- Without it: Three unnamed buttons beside an unnamed input.
- Code: `<UiField label="New password"><UiPasswordField v-model="password" /></UiField>`
- Your part: Put it in a UiField with a `label`, or give it `ariaLabel`.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "inside UiField the input takes the field id and the label names it", "inside a UiField with no label the input keeps its ariaLabel", "the copy button says it copies the password"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Not read aloud

- When: you generate a password.
- Props: none.
- Guarantee: Each password the app accepts is confirmed to a screen reader without including the password in the announcement. Generating another one repeats the confirmation.
- Without it: The confirmation reads the new password aloud, so anyone nearby can hear it.
- Code: `<UiPasswordField v-model="password" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiPasswordField.spec.ts, not in the package): "says a password was generated, without saying it, and says it again on a second generate"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#made-is-not-spoken


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
