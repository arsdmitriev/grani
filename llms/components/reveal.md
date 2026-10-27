# Reveal (`UiReveal`)

> Open details where you need them and collapse them again without leaving the page.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/reveal

Also called accordion, collapsible, disclosure, expandable section.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref, useId } from 'vue'
import { ChevronsUpDown } from '@lucide/vue'
import { UiCard, UiTooltip, UiIconButton, UiReveal } from 'grani-ui'

const open = ref(false)

const detailsId = useId()
</script>

<template>
  <UiCard title="INV-0042" description="Acme Corp" class="w-full max-w-sm">
    <template #actions>
      <UiTooltip :content="open ? 'Hide details' : 'Show details'">
        <UiIconButton
          :icon="ChevronsUpDown"
          variant="outline"
          :ariaLabel="open ? 'Hide details' : 'Show details'"
          :aria-expanded="open"
          :aria-controls="detailsId"
          @click="open = !open"
        />
      </UiTooltip>
    </template>
    <p class="text-sm text-fg">€1 240.00, due 14 Oct</p>
    <UiReveal :id="detailsId" :open="open">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="text-fg-muted">Sent</dt>
        <dd class="text-fg">30 Sep to billing@acme.example</dd>
        <dt class="text-fg-muted">Reminders</dt>
        <dd class="text-fg">Two, the last on 7 Oct</dd>
        <dt class="text-fg-muted">Terms</dt>
        <dd class="text-fg">Net 14, late fee 2%</dd>
      </dl>
    </UiReveal>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep keyboard focus where you are working.
- Reduce motion without hiding loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `controls` from the `#trigger` slot to the trigger as `aria-controls`. A control placed elsewhere points at the block through the block's `id`.

## Why it works this way

A block that opens and closes in place, under the control that names it. Take it for settings behind a switch or more options behind a button.

**Content.** The block goes in the default slot. With `v-model:open`, a `#trigger` (`{ open, toggle, controls }`), such as a UiSwitch in a UiListItem, stands above it; or `:open` alone follows a control elsewhere, which points at the block by its `id`.

**Spacing.** In a card of rows, the block continues the row: it sits on the row's inset, 16 below it. On a padded surface, or on no surface, it stands 16 under what is above it. A nested block keeps that gutter.

### Keyboard

Nothing of its own: the control in `#trigger` keeps its keys (a UiSwitch, a button).
- `Tab`: reaches the fields of an open block in their order.
When the block closes with the focus inside, the focus goes to the control that names the block in `aria-controls`, else to the element above. Opening leaves the focus on the trigger, as a disclosure does; with `autofocus` it goes to the block's first field, for a block opened to be typed in.

### Screen reader

- Trigger: says the block's state: a button takes `open` as `aria-expanded`, and a switch says it through `aria-checked`. `controls` points the trigger at the block only while the block is shown.
- Closed block: its fields leave the page and are not submitted.
- Height: the change of height is not announced.

### States

Open and closed, with the height following the content: `ui-reveal` animates a grid row from `0fr` to `1fr`, with the opacity, over `--ui-dur-fast`; under reduced motion the change is instant. With a `#trigger` and `open` unset, it starts closed and keeps its own state.

### When to use another component

- A panel floating beside its trigger: UiPopover.
- A record inside a record: a step of UiCrudDrawer.
- Panes switched among others: UiTabs.

## Examples

### Behind a switch

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiList, UiReveal, UiListItem, UiSwitch, UiField, UiInput, UiRadioGroup, UiRadio } from 'grani-ui'

const reminders = ref(true)

const digest = ref(false)

const days = ref('3')

const channel = ref('email')
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiReveal v-model:open="reminders">
        <template #trigger="{ open: on, toggle, controls }">
          <UiListItem as="label" title="Send reminders" description="Before an invoice is due.">
            <template #actions>
              <UiSwitch
                :model-value="on"
                :aria-controls="controls"
                @update:model-value="toggle"
              />
            </template>
          </UiListItem>
        </template>
        <div class="flex flex-col gap-4">
          <UiField label="Days before"><UiInput v-model="days" numeric /></UiField>
          <UiField label="Channel" group>
            <UiRadioGroup v-model="channel" variant="segmented">
              <UiRadio value="email">Email</UiRadio>
              <UiRadio value="sms">SMS</UiRadio>
            </UiRadioGroup>
          </UiField>
        </div>
      </UiReveal>
      <UiListItem as="label" title="Weekly digest" description="A summary every Monday.">
        <template #actions><UiSwitch v-model="digest" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Nested

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiList, UiReveal, UiListItem, UiSwitch, UiField, UiInput } from 'grani-ui'

const backup = ref(false)

const encrypt = ref(false)
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiReveal v-model:open="backup">
        <template #trigger="{ open: on, toggle, controls }">
          <UiListItem as="label" title="Back up every night" description="At 02:00, server time.">
            <template #actions>
              <UiSwitch
                :model-value="on"
                :aria-controls="controls"
                @update:model-value="toggle"
              />
            </template>
          </UiListItem>
        </template>
        <UiReveal v-model:open="encrypt">
          <template #trigger="{ open: on, toggle, controls }">
            <UiSwitch :model-value="on" :aria-controls="controls" @update:model-value="toggle">
              Encrypt the copies
            </UiSwitch>
          </template>
          <UiField label="Key name"><UiInput model-value="nightly-2026" /></UiField>
        </UiReveal>
      </UiReveal>
    </UiList>
  </UiCard>
</template>

```

### Own state

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiReveal, UiButton, UiField, UiRadioGroup, UiRadio } from 'grani-ui'

const split = ref('month')
</script>

<template>
  <UiCard title="Export" class="w-full max-w-md">
    <UiReveal>
      <template #trigger="{ open: on, toggle, controls }">
        <UiButton variant="outline" :aria-expanded="on" :aria-controls="controls" @click="toggle">
          {{ on ? 'Fewer options' : 'More options' }}
        </UiButton>
      </template>
      <UiField label="Split by" group>
        <UiRadioGroup v-model="split" variant="segmented">
          <UiRadio value="month">Month</UiRadio>
          <UiRadio value="quarter">Quarter</UiRadio>
        </UiRadioGroup>
      </UiField>
    </UiReveal>
  </UiCard>
</template>

```

## API

Props:
- `open`: `boolean` — The block is shown (`v-model:open`); the parent owns it, the trigger only asks. Unset, the block starts closed and keeps its own state, which a `#trigger` toggles.
- `autofocus`: `boolean` (default `false`) — When the block opens, the focus goes to its first field: a block opened to be typed in, such as a note. A block shown at mount takes no focus.
Attributes are placed by the component itself: its description says where.

Events:
- `update:open` (`open: boolean`) — The trigger asked for the other state.

Slots:
- `trigger` with `{ open: boolean; toggle: () => void; controls: string | undefined; }` — The control that opens the block: `controls` is its `aria-controls` while the block is shown; a button also takes `open` as `aria-expanded`, a switch does not (its `aria-checked` says it).
- `default` with `Record<string, never>` — The block shown under the trigger; it stands on the gutter the host gives (16 under what is above, or the row's inset in a card of rows).

## How it behaves

### Focus stays near

- When: The block closes while keyboard focus is inside it.
- Props: `v-model:open` with a `#trigger`, or `:open` and an `id` a control points at.
- Guarantee: Focus returns to the control that opens the section, or to the nearest button or field above it if no linked control is found. The next Tab continues from there.
- Without it: Keyboard focus is lost with the closed block, and you have to find the control again.
- Code: `<UiReveal v-model:open="open">
  <template #trigger="{ open, toggle, controls }">
    <UiSwitch :model-value="open" :aria-controls="controls" @update:model-value="toggle" />
  </template>
  …
</UiReveal>`
- Your part: Pass `controls` from the `#trigger` slot to the trigger as `aria-controls`. A control placed elsewhere points at the block through the block's `id`.
- Not covered: A control that does not name the block in `aria-controls` and does not stand right above it is not found, so focus is not moved there.
- Proof, in the repository's tests (UiReveal.spec.ts, not in the package): "returns focus to the trigger when the block collapses with focus inside it", "closing a block no control names, with focus inside, returns focus to the element above"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays

### Calm motion

- When: the block opens or closes, with reduced motion on.
- Props: the system setting `prefers-reduced-motion: reduce`.
- Guarantee: With reduced motion enabled, the section appears or disappears immediately, without sliding.
- Without it: Sections keep sliding open and shut although you asked for less movement.
- Code: `<UiReveal v-model:open="open">…</UiReveal>`
- Your part: Nothing.
- Proof, in the repository's tests (UiReveal.spec.ts, not in the package): "It opens and closes at once when the system asks for reduced motion."
- Pattern for all components: https://grani.arseni.work/patterns/waiting#calm-motion


The patterns: https://grani.arseni.work/patterns
