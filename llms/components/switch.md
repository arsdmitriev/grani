# Switch (`UiSwitch`)

> Change an on/off setting immediately, returning to the previous position if the app rejects the change.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/switch

Also called toggle, toggle switch, on off switch.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSwitch } from 'grani-ui'

const summary = ref(true)

const mentions = ref(false)

const longOne = ref(false)
</script>

<template>
  <div class="flex w-64 max-w-full flex-col items-start gap-4">
    <UiSwitch v-model="summary">Weekly summary</UiSwitch>
    <UiSwitch v-model="mentions">Mentions</UiSwitch>
    <UiSwitch v-model="longOne">
      Send me a summary of every comment, mention and status change on the projects I follow
    </UiSwitch>
  </div>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Toggle or pick by clicking the words.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the value the app holds as `modelValue`, set `loading` while the change is saved, and explain why a change was refused.
- Give it a `name`, and a `value` where the server expects something other than `on`.
- Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Put the words in the default slot; in a setting row, use UiListItem with `as="label"`.
- Give it words in the default slot, or `ariaLabel`; a switch with no name warns in development.

## Why it works this way

An on or off setting that applies at once. Take it where a change takes effect without saving a form.

**Element.** It is a `button` with `role="switch"`, so a screen reader says "switch, on".

**Form.** With a `name`, an on switch sends `value` (`on` by default) under that name with the form, and an off switch sends nothing, as a checkbox does.

**Label.** Label text goes in the default slot, toggles the switch on click, and is then its only name; without it, `ariaLabel` names the switch. Inside UiField it takes the field's label and description. The label starts at the middle of the track (2px down beside the 24px `md` track), so a long label wraps below.

**Model.** When the parent does not apply a change, the switch stays as the model says.

**Loading.** `loading` keeps the focus on the switch while the change is saved.

**Invalid.** An invalid switch that is off tints its track with the danger tone.

**Attributes.** Attributes land on the button, `class` and `style` on the root.

**Size.** Its `size` is a track, not a box, so it stays `sm` by default and does not follow the app's size (`createGrani({ size })`).

**Placement.** Beside UiCheckbox and UiRadio in a form column. A setting row is UiListItem `as="label"` with the switch in `#actions`. It also works as a `UiReveal` trigger.

### Keyboard

A native button.
- `Tab`: reaches it.
- `Enter` `Space`: toggle it.
`disabled` blocks it. `loading` blocks it too while the focus stays, the caller's own click included. A label in the slot toggles it on click, except while disabled.

### Screen reader

- Switch: `role="switch"`; it says on or off (`aria-checked`).
- Name: the slot text, else `ariaLabel`, else the field's label: one name only. A switch with no name warns in dev.
- Loading: `loading` says busy (`aria-busy`, `aria-disabled`).
- Errors: `invalid` sets `aria-invalid`, and the field's words are read with it.
- Required: `aria-required` says it is required, except in a group, whose legend says it once.

### States

Off, on, hover, focus, disabled (the plate, and the thumb in the disabled ink so on and off still look different), loading (a spinner in the thumb), invalid (the track in the danger tone while off; disabled wins over it), and the two tracks, `sm` and `md`.

### When to use another component

- Saved with the form, not applied at once: UiCheckbox.
- One answer out of a few: UiRadioGroup.
- A toggle that is a button: UiButton `pressed`.

## Examples

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSwitch } from 'grani-ui'

const small = ref(true)

const medium = ref(false)
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <UiSwitch v-model="small">Small track</UiSwitch>
    <UiSwitch v-model="medium" size="md">Medium track</UiSwitch>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSwitch, UiField } from 'grani-ui'

const digest = ref(true)

const terms = ref(false)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <div class="flex flex-col items-start gap-2">
      <UiSwitch :model-value="true" disabled>Locked on</UiSwitch>
      <UiSwitch :model-value="false" disabled>Locked off</UiSwitch>
      <!-- Disabled wins over invalid. -->
      <UiSwitch :model-value="false" disabled invalid>Locked off, in error</UiSwitch>
      <UiSwitch :model-value="false" invalid>Off, in error</UiSwitch>
    </div>
    <UiField label="Notifications" description="A summary every Monday morning." required>
      <UiSwitch v-model="digest">Send the digest</UiSwitch>
    </UiField>
    <UiField label="Terms" :error="terms ? undefined : 'Accept the terms to continue.'" required>
      <UiSwitch v-model="terms">I accept the terms</UiSwitch>
    </UiField>
  </div>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSwitch, UiRadioGroup, UiRadio } from 'grani-ui'

const switchState = ref('loading')
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-col items-start gap-4">
      <UiSwitch :model-value="true" :loading="switchState === 'loading'">Email digest</UiSwitch>
      <UiSwitch :model-value="false" :loading="switchState === 'loading'">Mentions</UiSwitch>
      <UiSwitch :model-value="true" disabled :loading="switchState === 'loading'">
        Locked while saving
      </UiSwitch>
    </div>
    <UiRadioGroup v-model="switchState" variant="segmented" aria-label="State of the switches">
      <UiRadio value="idle">Idle</UiRadio>
      <UiRadio value="loading">Loading</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Setting row

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiListItem, UiSwitch } from 'grani-ui'

const row = ref(true)
</script>

<template>
  <UiListItem as="label" title="Notifications" description="A summary every Monday." class="w-80">
    <template #actions><UiSwitch v-model="row" /></template>
  </UiListItem>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiSwitch } from 'grani-ui'

// The app answers each turn: turning the sync on is refused, so the switch stays off.
const sync = ref(false)

const saving = ref(false)

const failed = ref('')

async function turn(next: boolean) {
  saving.value = true
  failed.value = ''
  await new Promise((r) => setTimeout(r, 800))
  saving.value = false
  if (next) failed.value = 'Could not turn the sync on. Try again.'
  else sync.value = false
}
</script>

<template>
  <UiField :error="failed || undefined" class="w-80 max-w-full">
    <UiSwitch :model-value="sync" :loading="saving" @update:model-value="turn">
      Sync with the calendar
    </UiSwitch>
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiSwitch, UiButton } from 'grani-ui'

const digestForm = ref(true)
</script>

<template>
  <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="digestForm = true">
    <UiSwitch v-model="digestForm" name="digest">Weekly digest</UiSwitch>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-fg-muted">Sends {{ digestForm ? 'digest=on' : 'nothing' }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

## API

Props:
- `modelValue`: `boolean` (required) — On or off (`v-model`).
- `disabled`: `boolean` (default `false`) — Prevents toggling.
- `size`: `"sm" | "md"` = `sm | md` (default `"sm"`) — Track size: `sm` 20px, `md` 24px.
- `name`: `string` — Native name for forms: an on switch sends `value` under it, an off one nothing.
- `value`: `string` (default `"on"`) — Sent under `name` while on.
- `ariaLabel`: `string` — Accessible name when the slot is empty and there is no field label; slot text wins over it.
- `loading`: `boolean` (default `false`) — The change is being saved: a spinner in the thumb, `aria-busy`, no toggling; focus stays.
- `id`: `string` — Own id when standalone. Inside UiField the field's id takes precedence.
- `invalid`: `boolean` (default `false`) — Marks the switch invalid: the track takes the danger tone while off. Inside UiField the error sets this.
- `required`: `boolean` (default `false`) — Standalone only: the switch must be on, said to a reader, with a star after its text. Inside UiField the field's `required` says so.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: boolean`) — The state changed.

Slots:
- `default` with `Record<string, never>` — The visible label, to the right of the track; clicking it toggles.

## How it behaves

### Back to the value

- When: the app saves the change and may refuse it.
- Props: `modelValue` with `@update:model-value`, `loading`.
- Guarantee: You can see whether a setting changed. The switch follows the app’s value, so a rejected change leaves it in its previous position. While the app marks the update as loading, it shows progress, keeps focus and ignores further presses.
- Without it: The switch flips on the press and stays on, while the setting is still off.
- Code: `<UiSwitch :model-value="sync" :loading="saving" @update:model-value="turn" />`
- Your part: Pass the value the app holds as `modelValue`, set `loading` while the change is saved, and explain why a change was refused.
- Proof, in the repository's tests (UiSwitch.spec.ts, not in the package): "a change the parent refuses leaves the switch on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`, `value`.
- Guarantee: When on, it sends `value` (`on` by default) under its `name`; when off or disabled, it sends nothing. After a form reset it shows the app's value again.
- Without it: A switch on screen that the form never sends.
- Code: `<UiSwitch v-model="digest" name="digest">Weekly digest</UiSwitch>`
- Your part: Give it a `name`, and a `value` where the server expects something other than `on`.
- Proof, in the repository's tests (UiSwitch.spec.ts, not in the package): "in a form an on switch sends its value under its name and an off one sends nothing", "a form reset leaves the switch on its model"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a form is sent with the switch in error.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the switch is the first field with an error, keyboard focus lands on it, so you can turn it on from the keyboard straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField :error="err"><UiSwitch v-model="terms">I accept the terms</UiSwitch></UiField>`
- Your part: Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiSwitch.spec.ts, not in the package): "a switch marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Click the label

- When: the switch has words.
- Props: the default slot.
- Guarantee: The words sit inside the label around the switch, so a click on them toggles it, as a click on the track does; while the switch is disabled, they do not.
- Without it: Words beside the switch that only name it: a click on them does nothing.
- Code: `<UiSwitch v-model="summary">Weekly summary</UiSwitch>`
- Your part: Put the words in the default slot; in a setting row, use UiListItem with `as="label"`.
- Proof, in the repository's tests (UiSwitch.spec.ts, not in the package): "a label in the slot wraps the control, so clicking the text toggles too"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#label-is-target

### One name

- When: it needs a name.
- Props: the default slot, `ariaLabel`, or a UiField around it.
- Guarantee: A screen reader gets one name: the switch’s text, then `ariaLabel` if there is no text, then the surrounding UiField’s label if neither is provided. The field’s description and error are announced with it.
- Without it: A switch announced with two names, or with none.
- Code: `<UiSwitch v-model="summary">Weekly summary</UiSwitch>`
- Your part: Give it words in the default slot, or `ariaLabel`; a switch with no name warns in development.
- Proof, in the repository's tests (UiSwitch.spec.ts, not in the package): "with its own text inside UiField it is named by that text, as UiCheckbox", "slot text and ariaLabel together emit one name"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns
