# Checkbox (`UiCheckbox`)

> Choose yes or no by clicking the box or its label; the tick shows the value the app accepted.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/checkbox

Also called check box, tick box.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiStack, UiCheckbox } from 'grani-ui'

const receipt = ref(true)

const reminders = ref(false)

const consent = ref(false)

const contract = ref(false)
</script>

<template>
  <UiCard title="Notifications" class="w-full max-w-sm">
    <UiStack gap="tight">
      <UiCheckbox v-model="receipt">Send me the receipt by email</UiCheckbox>
      <UiCheckbox v-model="reminders">Remind me three days before an invoice is due</UiCheckbox>
      <UiCheckbox v-model="consent">
        Keep my contact details for as long as the account is open, and use them only for the
        receipts and the notices this account asks for
      </UiCheckbox>
      <UiCheckbox v-model="contract" required>I have read the contract</UiCheckbox>
    </UiStack>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Show when only some are selected.
- Toggle or pick by clicking the words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the value the app holds as `modelValue`; to refuse a change, leave that value unchanged.
- Give it a `name` where the form is sent natively.
- Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Set `indeterminate` while some but not all items are on, and decide what a press on the box does, for example turn them all on.
- Put the text in the default slot, not beside the component.

## Why it works this way

A native checkbox with its text in the slot, for a yes or no in a form. The whole row is the label, so a click on the text toggles it too.

**Mark.** The box is drawn as the library's 18px mark. It stands at the first line (18px in a 20px line, 1px down), so a long label wraps beside it.

**Model.** The box shows the model: when the parent refuses a change, or a form resets, the box goes back to the model.

**Mixed.** `indeterminate` is the mixed state of a "select all" box. It is display only: a press ends it only when the parent says so.

**Standalone.** It takes `ariaLabel` (the slot text wins when both are given) and `invalid`. `invalid` draws a red border and sets `aria-invalid`; put the reason beside it, or use UiField. With no text of its own, as in a table's rows, the box takes a press in a 24px square around it.

**Size.** `size` is the step of the control ladder: the box is 16, 18 or 20 px, the text stays `text-sm` and the box stands at its first line.

**Field.** Inside UiField it reads id, error and required from the field. When the field has a `label`, the slot text names the box and the field label heads the row.

**Attributes.** Attributes and listeners land on the input; `class` and `style` on the label.

**Placement.** Beside UiSwitch and UiRadio in a form column. The first column of UiTable is this component, and the rows of a multiple UiSelect and of UiFilterList draw the same mark from `utils/checkMark`.

### Keyboard

A native checkbox.
- `Tab`: reaches it.
- `Space`: toggles it; `disabled` blocks it.
A press on a mixed box leaves it mixed unless the parent resolves it. When the parent refuses a press, the box goes back to the model.

### Screen reader

- Name: a checkbox named by the slot text, else by `ariaLabel`, else by the field's label: one name, never two. A box with no name warns in dev.
- State: checked, not checked, or, with `indeterminate`, mixed.
- Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read with it.
- Required: inside UiField `aria-required` says it is required, except in a group, where the legend says it once.

### States

Unchecked, checked, mixed, hover (an empty box darkens), focus, disabled (a solid plate, not a fade), invalid (a red border, kept under the pointer), and required, with the star after its own text when no field label carries it.

### When to use another component

- A setting applied at once: UiSwitch.
- One answer out of a few: UiRadioGroup.
- Several picks from a list in a panel: UiSelect `multiple`.

## Examples

### Select all

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiCheckbox } from 'grani-ui'

const rows = ref([
  { id: 1, label: 'Invoice 1042', done: true },
  { id: 2, label: 'Invoice 1043', done: false },
  { id: 3, label: 'Invoice 1044', done: true },
])

const allDone = computed(() => rows.value.every((r) => r.done))

const someDone = computed(() => rows.value.some((r) => r.done) && !allDone.value)

const setAll = (v: boolean) => rows.value.forEach((r) => (r.done = v))
</script>

<template>
  <div class="flex flex-col gap-2">
    <UiCheckbox :model-value="allDone" :indeterminate="someDone" @update:model-value="setAll">
      All invoices
    </UiCheckbox>
    <div class="ms-[26px] flex flex-col gap-2">
      <UiCheckbox v-for="r in rows" :key="r.id" v-model="r.done">{{ r.label }}</UiCheckbox>
    </div>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCheckbox } from 'grani-ui'

const sized = ref(true)
</script>

<template>
  <UiCheckbox v-model="sized" size="xs">xs, 16px</UiCheckbox>
  <UiCheckbox v-model="sized">sm, 18px</UiCheckbox>
  <UiCheckbox v-model="sized" size="md">md, 20px</UiCheckbox>
</template>

```

### States

```vue
<script setup lang="ts">
import { UiCheckbox } from 'grani-ui'
</script>

<template>
  <UiCheckbox :model-value="false" disabled>Disabled</UiCheckbox>
  <UiCheckbox :model-value="true" disabled>Disabled, checked</UiCheckbox>
  <UiCheckbox :model-value="false" invalid>Invalid</UiCheckbox>
</template>

```

### Field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiCheckbox } from 'grani-ui'

const terms = ref(false)
</script>

<template>
  <UiField :error="terms ? undefined : 'Accept the terms to continue'" required class="w-80">
    <UiCheckbox v-model="terms">I accept the terms of service</UiCheckbox>
  </UiField>
</template>

```

### In a row

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiList, UiListItem, UiCheckbox } from 'grani-ui'

// A row that is the label of its box: a press on the title or the description ticks it.
const picked = ref(new Set(['INV-0043']))

const ROWS = [
  { id: 'INV-0042', client: 'Acme Corp' },
  { id: 'INV-0043', client: 'Birch & Co' },
  { id: 'INV-0044', client: 'Cedar Ltd' },
]

function pick(id: string, on: boolean) {
  const next = new Set(picked.value)
  if (on) next.add(id)
  else next.delete(id)
  picked.value = next
}
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem v-for="r in ROWS" :key="r.id" as="label" :title="r.id" :description="r.client">
        <template #actions>
          <UiCheckbox
            :model-value="picked.has(r.id)"
            @update:model-value="(on: boolean) => pick(r.id, on)"
          />
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiCheckbox } from 'grani-ui'

// The app owns the value: a save that fails leaves it as it was, and the box goes back.
const shared = ref(false)

const saving = ref(false)

const failed = ref('')

async function share(next: boolean) {
  saving.value = true
  failed.value = ''
  await new Promise((r) => setTimeout(r, 600))
  saving.value = false
  if (next) failed.value = 'Could not save. Try again.'
  else shared.value = false
}
</script>

<template>
  <UiField :error="failed || undefined" class="w-80">
    <UiCheckbox :model-value="shared" :disabled="saving" @update:model-value="share">
      Share this report with the team
    </UiCheckbox>
  </UiField>
</template>

```

### In a form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCheckbox, UiButton } from 'grani-ui'

const newsletter = ref(true)
</script>

<template>
  <form class="flex w-80 flex-col items-start gap-4" @submit.prevent @reset="newsletter = true">
    <UiCheckbox v-model="newsletter" name="newsletter" value="yes">
      Subscribe to the newsletter
    </UiCheckbox>
    <span class="text-xs text-fg-muted">
      Sends {{ newsletter ? 'newsletter=yes' : 'nothing' }}
    </span>
    <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
  </form>
</template>

```

## API

Props:
- `modelValue`: `boolean` (required) — Whether the checkbox is checked (`v-model`).
- `indeterminate`: `boolean` (default `false`) — Shows a mixed state when some of the items it represents are checked. Display only.
- `name`: `string` — Native name for forms.
- `value`: `string` — Native value submitted with the form when checked.
- `id`: `string` — Own id when standalone. Inside UiField, the field's id takes precedence.
- `disabled`: `boolean` (default `false`) — Prevents toggling.
- `invalid`: `boolean` (default `false`) — Marks the control as invalid. Inside UiField, the error state sets this automatically.
- `ariaLabel`: `string` — Accessible name when the slot is empty and there is no field label; slot text wins over it.
- `required`: `boolean` (default `false`) — Standalone only: the box must be checked, said to a reader and to a form (native `required`), with a star after its text. Inside UiField the field's `required` says so.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder: the box is 16, 18 or 20 px beside `text-sm`. Unset, the app's size (`createGrani({ size })`), `sm` by default.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: boolean`) — The checkbox was toggled.

Slots:
- `default` with `Record<string, never>` — Label text displayed next to the checkbox. Clicking the label toggles the checkbox.

## How it behaves

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: The tick follows the app’s value, not your press: if the app keeps its old value, the box goes back to it.
- Without it: The box stays ticked after the change failed: the screen shows Share as on while the app has it off.
- Code: `<UiCheckbox :model-value="shared" @update:model-value="share">Share</UiCheckbox>`
- Your part: Pass the value the app holds as `modelValue`; to refuse a change, leave that value unchanged.
- Proof, in the repository's tests (UiCheckbox.spec.ts, not in the package): "a vetoed change puts the DOM back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`, `value`.
- Guarantee: A ticked box sends its `value` under its `name`, an empty one sends nothing, and after a form reset the box and its tick show the app's value again.
- Without it: A box on screen that the form never sends.
- Code: `<UiCheckbox v-model="news" name="newsletter" value="yes">Newsletter</UiCheckbox>`
- Your part: Give it a `name` where the form is sent natively.
- Proof, in the repository's tests (UiCheckbox.spec.ts, not in the package): "in a form a checked box sends its value and an empty one sends nothing", "a form reset leaves the box on its model, glyph and DOM agreeing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a required box is left empty on submit.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the box is the first field with an error, keyboard focus lands on it, drawn with a red border, so you can tick it from the keyboard straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the box that needs a tick yourself.
- Code: `<UiField :error="err"><UiCheckbox v-model="terms">I accept the terms</UiCheckbox></UiField>`
- Your part: Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiCheckbox.spec.ts, not in the package): "a box marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Some selected

- When: it selects all of a group and only some items are on.
- Props: `indeterminate`.
- Guarantee: The box shows a dash and is announced as mixed. A press reports the new value to the app, and the box stays mixed until the app resolves it.
- Without it: A select-all box that looks empty while two of three items are ticked.
- Code: `<UiCheckbox :model-value="all" :indeterminate="some" @update:model-value="setAll">All</UiCheckbox>`
- Your part: Set `indeterminate` while some but not all items are on, and decide what a press on the box does, for example turn them all on.
- Proof, in the repository's tests (UiCheckbox.spec.ts, not in the package): "indeterminate sets the DOM property and draws the fill", "a press on a mixed box that the parent does not resolve leaves the DOM mixed"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#mixed-says-some

### Click the label

- When: its text is in the slot.
- Props: the default slot.
- Guarantee: The whole row is the label: a click on the text toggles the box, and a long text wraps beside it.
- Without it: The 18 px box is the only target, and a click on the words does nothing.
- Code: `<UiCheckbox v-model="receipt">Send me the receipt by email</UiCheckbox>`
- Your part: Put the text in the default slot, not beside the component.
- Proof, in the repository's tests (UiCheckbox.spec.ts, not in the package): "the text is inside the label, so a click on it toggles"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#label-is-target


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`.
