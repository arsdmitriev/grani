# Textarea (`UiTextarea`)

> Write several lines, such as a note, address or biography, in a field that can grow with the text.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/textarea

Also called multiline input, text area.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

const note = ref('')

const address = ref(
  'Office 4, 12 Long Harbour Street, Northfield Business Park, second floor. Ring twice at the gate, the reception is on the left past the lifts; after six the door is locked and the parcel goes to the security desk.',
)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Note">
      <UiTextarea v-model="note" placeholder="Anything the courier should know" />
    </UiField>
    <UiField label="Delivery instructions">
      <UiTextarea v-model="address" />
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
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the text the app holds as `modelValue`, and explain why a change was refused.
- Give it a `name`.
- Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Put it in a UiField with a `label`, or give it `ariaLabel`.

## Why it works this way

A multi-line text field in the input capsule. Take it for a note, an address or a bio.

**Height.** The height comes from `rows`, from the resize handle, or from `resize="auto"`, which grows from `rows` up to 24rem and then scrolls. One row stands on the control ladder (`size`, else the app's step), so it lines up with UiInput.

**Field.** It reads the field context; standalone, the name goes through `ariaLabel`.

**Attributes.** Attributes and listeners land on the textarea, `class` and `style` on the capsule.

**Model.** The field shows the model: when the owner refuses a change, or a form resets, it goes back to the model and the caret stays where it was.

**Empty.** The value is text, and empty is `''`, never `null`.

**Length.** `maxlength` cuts off text past the limit and shows no counter; the caller writes one into UiField's `#meta`.

**Placement.** In a form column beside UiInput, inside UiField, or in a UiModal or a UiCrudDrawer that sends on Cmd+Enter from it.

### Keyboard

A native textarea.
- `Tab`: reaches it.
- `Enter`: adds a line.
- `Meta+Enter` `Ctrl+Enter`: send from it in a UiModal or a UiCrudDrawer; that key belongs to the surface, not to the textarea.
Nothing is sent while an IME composes. `readonly` keeps it focusable and blocks typing; `disabled` blocks the focus too. The handle resizes with the pointer.

### Screen reader

- Field: a text box named by `ariaLabel` or the field's label, never by the placeholder. A textarea with no name warns in dev.
- Errors: `invalid` sets `aria-invalid`. Inside UiField the description and the error are read with it once, and `aria-required` says it is required.
- Caller attributes: a caller's `aria-invalid` and `aria-required` reach it when the field sets none.

### States

Rest, hover, focus (the capsule draws the ring), disabled (its plate, nothing sent), readonly, invalid (red border and halo; disabled wins over it), with a handle, a fixed height, `auto` growing to 24rem and then scrolling, and one row on each step of the ladder.

### When to use another component

- One line: UiInput.
- Names added one by one: UiListField.
- A counter under it: the caller's text in UiField `#meta`.

## Examples

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

const bio = ref('Product designer at a small studio.')
</script>

<template>
  <UiField label="Bio" description="Shown on the public page." class="w-80 max-w-full">
    <UiTextarea v-model="bio" :maxlength="160" :rows="4" />
    <template #meta>{{ bio.length }} / 160</template>
  </UiField>
</template>

```

### Resize

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

const fixed = ref('')

const growing = ref('')
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Fixed height">
      <UiTextarea v-model="fixed" resize="none" :rows="2" />
    </UiField>
    <UiField label="Grows with the text">
      <UiTextarea v-model="growing" resize="auto" :rows="2" />
    </UiField>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTextarea, UiInput } from 'grani-ui'

const oneRow = ref({ xs: '', sm: '', md: '' })
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-4">
    <div v-for="s in ['xs', 'sm', 'md']" :key="s" class="flex items-start gap-2">
      <UiTextarea
        v-model="oneRow[s]"
        :size="s"
        :rows="1"
        resize="auto"
        :ariaLabel="`Note, ${s}`"
        placeholder="One row"
        class="flex-1"
      />
      <UiInput model-value="" :size="s" :ariaLabel="`Beside, ${s}`" placeholder="Input" />
    </div>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

const wrong = ref('Deliver to the back door')

const comment = ref('')
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Disabled">
      <UiTextarea model-value="" placeholder="Nothing to add here" disabled :rows="2" />
    </UiField>
    <UiField label="Read only">
      <UiTextarea model-value="Set by the sender" readonly :rows="2" />
    </UiField>
    <!-- Standalone: no field around it, so ariaLabel names it and invalid marks it. -->
    <UiTextarea v-model="wrong" ariaLabel="Invalid note" invalid :rows="2" />
    <UiField
      label="Comment"
      :error="comment.trim() ? undefined : 'Say where to leave the parcel.'"
      required
    >
      <UiTextarea v-model="comment" :rows="2" />
    </UiField>
  </div>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea } from 'grani-ui'

// The app takes a note only while it fits in 140 characters; past that it keeps the note as it was.
const LIMIT = 140

const kept = ref('Leave it with the neighbor at number 14.')

const refusal = ref<string>()

function take(next: string) {
  if (next.length > LIMIT) {
    refusal.value = `The courier sees ${LIMIT} characters at most.`
    return
  }
  refusal.value = undefined
  kept.value = next
}
</script>

<template>
  <UiField label="Note to the courier" :error="refusal" class="w-80 max-w-full">
    <UiTextarea :model-value="kept" :rows="3" @update:model-value="take" />
    <template #meta>{{ kept.length }} / {{ LIMIT }}</template>
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiTextarea, UiButton } from 'grani-ui'

const sentNote = ref('Ring twice')
</script>

<template>
  <form
    class="flex w-80 max-w-full flex-col gap-4"
    @submit.prevent
    @reset="sentNote = 'Ring twice'"
  >
    <UiField label="Note">
      <UiTextarea v-model="sentNote" name="note" :rows="2" />
    </UiField>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-fg-muted">Sends note={{ sentNote || '(empty)' }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

## API

Props:
- `modelValue`: `string` (required) — The text (`v-model`); empty is `''`.
- `rows`: `number` (default `3`) — Visible lines before the user resizes the control.
- `name`: `string` — Native name for forms.
- `id`: `string` — Own id when standalone. Inside UiField the field's id takes precedence.
- `placeholder`: `string` — Hint shown while empty. Not a replacement for a label.
- `maxlength`: `number` — Maximum number of characters.
- `readonly`: `boolean` (default `false`) — Prevents editing while keeping the control focusable.
- `disabled`: `boolean` (default `false`) — Prevents input and interaction.
- `invalid`: `boolean` (default `false`) — Marks the control invalid: red border and halo. Inside UiField the error sets this.
- `required`: `boolean` (default `false`) — Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so.
- `ariaLabel`: `string` — Accessible name when there is no visible label. A prop, not `aria-label`: the root is the capsule, the name belongs to the control.
- `size`: `ControlSize` = `xs | sm | md` — Height of one row on the control ladder; defaults to the app's step.
- `resize`: `"none" | "vertical" | "auto"` = `none | vertical | auto` (default `"vertical"`) — `vertical` gives the user a handle; `none` fixes the height at `rows`; `auto` grows with the text.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: string`) — The value changed.

## How it behaves

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: A refused change is undone and the text cursor stays where you were typing, so you can go on. This also holds for text composed with an input method (IME), as for Chinese or Japanese. A form reset brings back the app’s text.
- Without it: The refused words stay on the screen, although the app did not accept them.
- Code: `<UiTextarea :model-value="note" @update:model-value="take" />`
- Your part: Pass the text the app holds as `modelValue`, and explain why a change was refused.
- Proof, in the repository's tests (UiTextarea.spec.ts, not in the package): "a change the parent refuses puts the textarea back on the model", "a refused composition goes back to the model too"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: It sends its text under its `name`, nothing while disabled, and after a form reset it shows the app's value again.
- Without it: A text field on screen that the form never sends.
- Code: `<UiTextarea v-model="note" name="note" />`
- Your part: Give it a `name`.
- Proof, in the repository's tests (UiTextarea.spec.ts, not in the package): "in a form it sends its value under its name, nothing when disabled", "a form reset leaves the textarea on its model"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a form is sent with the text in error.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the textarea is the first field with an error, keyboard focus lands in it, so you can type the fix straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Comment" :error="err"><UiTextarea v-model="comment" /></UiField>`
- Your part: Pass the error to its UiField, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiTextarea.spec.ts, not in the package): "a textarea marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### One name

- When: it needs a name.
- Props: a UiField around it, or `ariaLabel`.
- Guarantee: A screen reader announces the field’s label or `ariaLabel`, followed by its description and error, each once. The placeholder is never used as its name, and a missing name triggers a development warning.
- Without it: A textarea named only by its placeholder, which disappears as soon as you type.
- Code: `<UiField label="Bio"><UiTextarea v-model="bio" /></UiField>`
- Your part: Put it in a UiField with a `label`, or give it `ariaLabel`.
- Proof, in the repository's tests (UiTextarea.spec.ts, not in the package): "inside UiField with a description it is named once and described once", "warns in dev when it has no name"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`.
