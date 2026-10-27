# Radio group (`UiRadioGroup`)

> Choose one answer from a short list, cards or a segmented bar; the whole row or card is the click target.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/radio-group

Also called radio buttons, segmented control, option cards.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const delivery = ref('door')
</script>

<template>
  <UiRadioGroup v-model="delivery" aria-label="Delivery" class="w-80">
    <UiRadio value="door">
      Leave the parcel at the door if nobody answers, and send a photo of where it was left
    </UiRadio>
    <UiRadio value="neighbor" description="The courier rings the flat next door">
      Hand it to a neighbor
    </UiRadio>
    <UiRadio value="point" description="Not in your area yet" disabled>
      Take it to a pickup point
    </UiRadio>
  </UiRadioGroup>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See the value the app actually accepted.
- Toggle or pick by clicking the words.
- Keep nearby buttons and fields in place.
- Pass a group with one press of Tab.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Name each field once for screen readers.
- Announce required fields in words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the answer the app holds as `modelValue`.
- Put the words in the slot and the details in `description`, `#media` or `#meta`, not beside the component.
- Give each group in a form its own `name`.
- Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Put the name in the slot, and the rest in `description` or `#meta`.
- Set `required` on the group, or on the UiField around it, and check for `null` before you save.

## Why it works this way

One answer out of a few, shown as rows, cards or a segmented bar. The group owns the value, the name and the states; its `UiRadio` children are thin options drawn from it.

**Empty.** No answer is `null`; a pick sends the option's value. A person cannot take an answer back: where none is an answer too, give it a radio of its own. A value no radio stands for shows nothing chosen and sends nothing; in development the console names it once, an empty string excepted: it is read as no answer yet, as in UiSelect.

**Required.** It does not force a selection. `required` says one is needed, to a screen reader and to a form.

**Variants.** `variant` changes only the look: rows, cards, or a `segmented` bar with one segment pressed. The bar stands on the control ladder (the app's step, `sm` at least), `block` makes it fill the row, and it reddens its frame when invalid. A press on the bar's frame picks the segment beside it. A bar wider than its row scrolls sideways inside its frame, its edges fading where more segments wait: keep its words short, two to four of them. The segmented bar is also the library's state switcher.

**Model.** The radios follow the model after a refused pick and after a form reset.

**Names.** Two groups in one form need two names: the browser joins radios that share a name. Two Vue apps on one page each need their own `app.config.idPrefix`, or their generated names meet.

**Field.** Inside UiField, use `group`.

**Attributes.** Attributes land on the root (`data-*`); ours apply where we set one, and the caller's description is joined to ours.

**Placement.** In a form column beside UiCheckbox and UiSwitch. A segmented bar switches what a card or a list shows (a period, a view, the kind of event in UiLog), over it or in its toolbar.

### Keyboard

Native radios: the keys are the browser's, and the radios are native inputs under the marks, the cards and the segments, so a bar is walked the same way as rows.
- `ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight`: move the selection.
- `Space`: selects.
There is one tab stop, on the checked radio, or on the first while none is. A click anywhere on a row, a card or a segment selects it. Safari passes over a group whose checked radio is disabled:
turn the whole group off, not its chosen radio.

### Screen reader

- Group: a radiogroup named by the field's legend (`aria-labelledby`) or by the caller's `ariaLabel`.
- Description: the field's description and error, and the caller's own, are read with it.
- Invalid: `invalid` is `aria-invalid` on the group once, never on a radio.
- Required: `required` is `aria-required` on the group and native `required` on the radios for a form; inside a UiField `group` it is silent, since the legend says it once.
- Disabled: `disabled` is `aria-disabled`.
- Radio: each radio is named by its own text, as UiRadio says.

### States

Nothing chosen, one chosen, hover, focus, disabled (the whole group, or one radio that stays disabled whatever the group says), invalid (red empty marks; a `segmented` bar reddens its frame), required, and the variants `plain`, `card`, `card-check` and `segmented`, with or without `block`.

### When to use another component

- Several answers: UiCheckbox in a UiField `group`.
- A mark from 1 to N: UiScaleInput.
- A pick from a long list: UiSelect.
- On or off: UiSwitch.
- Sections of a page, each with its own content: UiTabs.
- Actions side by side: UiButtonGroup.

## Examples

### Card

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CreditCard, Mail, Truck } from '@lucide/vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const shipping = ref('courier')
</script>

<template>
  <UiRadioGroup v-model="shipping" aria-label="Shipping" variant="card" class="w-96 max-w-full">
    <UiRadio value="card" description="Visa ending 4242">
      <template #media><CreditCard aria-hidden="true" /></template>
      Card
      <template #meta>0 EUR</template>
    </UiRadio>
    <UiRadio value="courier" description="Tomorrow, 10:00 to 14:00">
      <template #media><Truck aria-hidden="true" /></template>
      Courier
      <template #meta>12 EUR</template>
    </UiRadio>
    <UiRadio value="post" description="3 to 5 working days">
      <template #media><Mail aria-hidden="true" /></template>
      Post
      <template #meta>6 EUR</template>
    </UiRadio>
  </UiRadioGroup>
</template>

```

### Check

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const plan = ref('team')
</script>

<template>
  <UiRadioGroup v-model="plan" aria-label="Plan" variant="card-check" class="w-80">
    <UiRadio value="free" description="One project, community support">Free</UiRadio>
    <UiRadio value="team" description="Up to 10 seats, priority support">Team</UiRadio>
    <UiRadio value="enterprise" description="Talk to sales" disabled>Enterprise</UiRadio>
  </UiRadioGroup>
</template>

```

### Segmented

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LayoutGrid, List } from '@lucide/vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const period = ref('week')

const direction = ref('expense')

const view = ref('list')
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <UiRadioGroup v-model="period" variant="segmented" aria-label="Period">
      <UiRadio value="day">Day</UiRadio>
      <UiRadio value="week">Week</UiRadio>
      <UiRadio value="month">Month</UiRadio>
    </UiRadioGroup>
    <UiRadioGroup v-model="view" variant="segmented" aria-label="View">
      <UiRadio value="list" aria-label="List"><List /></UiRadio>
      <UiRadio value="grid" aria-label="Grid"><LayoutGrid /></UiRadio>
    </UiRadioGroup>
  </div>
  <UiRadioGroup
    v-model="direction"
    variant="segmented"
    block
    aria-label="Direction"
    class="max-w-sm"
  >
    <UiRadio value="expense">Expense</UiRadio>
    <UiRadio value="income">Income</UiRadio>
    <UiRadio value="transfer" disabled>Transfer</UiRadio>
  </UiRadioGroup>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const sized = ref('team')

const span = ref('week')
</script>

<template>
  <div class="flex flex-wrap items-start gap-6">
    <UiRadioGroup v-model="sized" size="xs" aria-label="Plan, xs">
      <UiRadio value="free">Free</UiRadio>
      <UiRadio value="team">Team</UiRadio>
    </UiRadioGroup>
    <UiRadioGroup v-model="sized" aria-label="Plan, sm">
      <UiRadio value="free">Free</UiRadio>
      <UiRadio value="team">Team</UiRadio>
    </UiRadioGroup>
    <UiRadioGroup v-model="sized" size="md" aria-label="Plan, md">
      <UiRadio value="free">Free</UiRadio>
      <UiRadio value="team">Team</UiRadio>
    </UiRadioGroup>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <UiRadioGroup v-model="span" variant="segmented" aria-label="Span, sm">
      <UiRadio value="day">Day</UiRadio>
      <UiRadio value="week">Week</UiRadio>
    </UiRadioGroup>
    <UiRadioGroup v-model="span" variant="segmented" size="md" aria-label="Span, md">
      <UiRadio value="day">Day</UiRadio>
      <UiRadio value="week">Week</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Long

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiRadioGroup, UiRadio } from 'grani-ui'

const billing = ref('quarter')
</script>

<template>
  <div class="w-64 max-w-full">
    <UiRadioGroup v-model="billing" variant="segmented" aria-label="Billing">
      <UiRadio value="quarter">Quarterly billing</UiRadio>
      <UiRadio value="year">Yearly billing</UiRadio>
      <UiRadio value="life">Lifetime licence</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiRadioGroup, UiRadio } from 'grani-ui'

const needed = ref<string | null>(null)

const region = ref<string | null>(null)

const arrival = ref<string | null>(null)
</script>

<template>
  <div class="flex w-80 max-w-full flex-col gap-6">
    <UiField label="Billing" description="Set by your organisation" group>
      <UiRadioGroup :model-value="'monthly'" disabled>
        <UiRadio value="monthly">Monthly</UiRadio>
        <UiRadio value="yearly">Yearly</UiRadio>
      </UiRadioGroup>
    </UiField>
    <UiField label="Plan" required group>
      <UiRadioGroup v-model="needed">
        <UiRadio value="free">Free</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
    </UiField>
    <UiField
      label="Region"
      required
      group
      :error="region ? undefined : 'Choose the region of the account'"
    >
      <UiRadioGroup v-model="region">
        <UiRadio value="eu">Europe</UiRadio>
        <UiRadio value="us">Americas</UiRadio>
      </UiRadioGroup>
    </UiField>
    <UiField
      label="Arrival"
      required
      group
      :error="arrival ? undefined : 'Choose when the courier comes'"
    >
      <UiRadioGroup v-model="arrival" variant="segmented" block>
        <UiRadio value="morning">Morning</UiRadio>
        <UiRadio value="afternoon">Afternoon</UiRadio>
        <UiRadio value="evening">Evening</UiRadio>
      </UiRadioGroup>
    </UiField>
  </div>
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SelectValue } from 'grani-ui'
import { UiField, UiRadioGroup, UiRadio } from 'grani-ui'

// The app answers each pick: 7 seats are in use, so Free is refused and the radios stay on Team.
const kept = ref('team')

const refusal = ref<string>()

function ask(v: SelectValue | null) {
  if (v === 'free') {
    refusal.value = 'Free holds one seat, and 7 are in use. Remove members first.'
    return
  }
  refusal.value = undefined
  kept.value = String(v)
}
</script>

<template>
  <UiField label="Plan" group :error="refusal" class="w-80 max-w-full">
    <UiRadioGroup :model-value="kept" @update:model-value="ask">
      <UiRadio value="free" description="One seat">Free</UiRadio>
      <UiRadio value="team" description="Up to 10 seats">Team</UiRadio>
      <UiRadio value="scale" description="Unlimited seats">Scale</UiRadio>
    </UiRadioGroup>
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiRadioGroup, UiRadio, UiButton } from 'grani-ui'

const sentPlan = ref('free')
</script>

<template>
  <form class="flex w-80 max-w-full flex-col gap-4" @submit.prevent @reset="sentPlan = 'free'">
    <UiField label="Plan" group>
      <UiRadioGroup v-model="sentPlan" name="plan">
        <UiRadio value="free">Free</UiRadio>
        <UiRadio value="team">Team</UiRadio>
      </UiRadioGroup>
    </UiField>
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-fg-muted">Sends plan={{ sentPlan }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

## API

Props:
- `modelValue`: `SelectValue | null` (required) — The selected value (`v-model`). `null` when nothing is selected.
- `name`: `string` — Native name shared by every radio, for forms. Generated when omitted, stable across server and client; two apps on one page need their own `app.config.idPrefix`.
- `disabled`: `boolean` (default `false`) — Prevents selecting in every radio.
- `invalid`: `boolean` (default `false`) — Marks the group as invalid: red marks. Inside UiField, the error state sets this automatically.
- `variant`: `RadioGroupVariant` = `plain | card | card-check | segmented` (default `"plain"`) — `plain` rows with the mark first; `card` a card per radio with the mark at the end; `card-check` cards that show a check and a tint on the selected one only; `segmented` a bar with one segment pressed.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. A `segmented` bar is 36 or 44 px (`xs` is read as `sm`: a 24px segment is too small to hit); a `plain` mark is 16, 18 or 20 px. Unset, the app's size (`createGrani({ size })`).
- `id`: `string` — Own id of the group, for a reference from elsewhere (`aria-controls`, a link); a field names it by its legend.
- `ariaLabel`: `string` — Accessible name of the group when there is no visible legend. Inside a UiField group the legend names it.
- `required`: `boolean` (default `false`) — One answer is needed: said to a reader on the group, and `required` on the radios for a form. Inside UiField group the legend says it instead.
- `block`: `boolean` (default `false`) — A segmented bar as wide as its row, segments sharing the width.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`value: SelectValue`) — The selected value changed.

Slots:
- `default` with `Record<string, never>` — The radios.

### Radio (`UiRadio`)

Props:
- `value`: `SelectValue` (required) — The value this radio stands for; the group's model takes it when selected.
- `description`: `string` — A second line under the label. Read with the radio as its description. Not drawn in a segment.
- `disabled`: `boolean` (default `false`) — Prevents selecting this radio; the group's `disabled` covers all of them.
- `id`: `string` — Own id, for a label elsewhere.
- `ariaLabel`: `string` — Accessible name when the slot has no text: a glyph segment, a label outside the row.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Slots:
- `default` with `Record<string, never>` — Label text displayed next to the mark. Clicking it selects the radio.
- `media` with `Record<string, never>` — A glyph or a small image before the text. Cards only.
- `meta` with `Record<string, never>` — A value at the end, before the mark: a price, a count. Cards only.

## How it behaves

### Back to the value

- When: the app refuses a choice, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses your choice, the previous answer is selected again. A form reset brings back the app’s answer.
- Without it: An answer looks selected that the app did not accept.
- Code: `<UiRadioGroup :model-value="kept">…</UiRadioGroup>`
- Your part: Pass the answer the app holds as `modelValue`.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "a vetoed change puts the DOM back on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Click the label

- When: its options are rows or cards.
- Props: the default slot of each UiRadio; `variant="card"` or `"card-check"` for cards.
- Guarantee: The whole row is the label of its radio: a click on the words picks it, and a long label wraps beside the mark. A card is picked by a click anywhere on it, its words, `#media` and `#meta` included.
- Without it: A radio in a corner of the card: a click on the words or the price picks nothing.
- Code: `<UiRadioGroup v-model="plan" variant="card">…</UiRadioGroup>`
- Your part: Put the words in the slot and the details in `description`, `#media` or `#meta`, not beside the component.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "the row is the label: a click on the text selects", "a click anywhere on a card picks it, its media and its meta included"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#label-is-target

### Steady width

- When: it is a segmented bar.
- Props: `variant="segmented"`.
- Guarantee: Each segment keeps the same font weight and width whether selected or not, so choosing one does not push the next option sideways.
- Without it: The picked segment turns bold, its word grows wider, and the segments after it shift sideways.
- Code: `<UiRadioGroup v-model="period" variant="segmented">…</UiRadioGroup>`
- Your part: Nothing.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "segments keep one weight whether chosen or not, so none changes width on a pick"
- Pattern for all components: https://grani.arseni.work/patterns/finding#steady-width

### One Tab per group

- When: you choose one answer from a group.
- Props: none.
- Guarantee: The group takes one press of Tab, on the chosen answer or on the first. The arrow keys change the answer, the same way whether the options are drawn as rows, cards or segments.
- Without it: Segments built as separate buttons take a press of Tab each.
- Code: `<UiRadioGroup v-model="plan">…</UiRadioGroup>`
- Your part: Nothing.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "is a radiogroup whose radios share one name and reflect the value"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The chosen radio sends its value under the group's `name`, and nothing is sent while none is chosen. After a form reset, the radios show the app's value again.
- Without it: Radios on screen that the form never sends, or two groups merged under one name.
- Code: `<UiRadioGroup v-model="plan" name="plan">…</UiRadioGroup>`
- Your part: Give each group in a form its own `name`.
- Not covered: A disabled group sends nothing, as a disabled radio does: the form leaves it out.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "in a form the checked radio sends its value under the group name, and none sends nothing", "a form reset leaves the radios on the model, mark and DOM agreeing"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a form is sent with no option chosen.
- Props: `invalid`, or the error of its `UiField group`.
- Guarantee: When the group is the first field with an error, keyboard focus lands on the chosen radio, or on the first one when none is chosen, so you can move through the options with the arrow keys.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField label="Region" group :error="err"><UiRadioGroup v-model="region">…</UiRadioGroup></UiField>`
- Your part: Pass the error to its `UiField group`, or set `invalid`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "focusInvalid on an invalid radiogroup focuses the chosen radio, else the first"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### One name

- When: its options have descriptions.
- Props: `description`, `#meta`.
- Guarantee: Each radio is named by its own words alone; its `description` and `#meta` are announced once, after the name.
- Without it: A radio whose announced name runs on into its description.
- Code: `<UiRadio value="team" description="Up to 10 seats">Team</UiRadio>`
- Your part: Put the name in the slot, and the rest in `description` or `#meta`.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "the name is the label text; the description and meta are read once after it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Required in words

- When: an answer is needed.
- Props: `required`, or a required `UiField group`.
- Guarantee: The group is announced as required. With its own `required`, each radio carries native `required` too, so a native form checks that an answer was chosen; inside a required `UiField group`, the legend says it once instead.
- Without it: An asterisk that a screen reader skips.
- Code: `<UiRadioGroup v-model="plan" required>…</UiRadioGroup>`
- Your part: Set `required` on the group, or on the UiField around it, and check for `null` before you save.
- Not covered: A required `UiField group` only says it: the browser checks the group’s own `required`, not the field’s.
- Proof, in the repository's tests (UiRadioGroup.spec.ts, not in the package): "required on the group says aria-required and puts required on each input; inside a group field it stays silent"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`.
