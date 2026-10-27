# Icon button (`UiIconButton`)

> Offer a compact action, such as Search or Close, with an icon and an accessible name for screen readers.

A component of grani-ui 0.1.0. Actions, stable, since 0.1.0. Page: https://grani.arseni.work/components/icon-button

Also called icon-only button, glyph button.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Columns3, Copy, Pencil, Plus, SlidersHorizontal, Trash2 } from '@lucide/vue'
import { UiStack, UiIconButton, UiButton, UiCard, UiList, UiListItem } from 'grani-ui'

const INVOICES = [
  { id: 'INV-0042', client: 'Acme Corp' },
  { id: 'INV-0043', client: 'Birch & Co' },
  { id: 'INV-0044', client: 'Cedar Ltd' },
]
</script>

<template>
  <UiStack gap="tight" class="w-full max-w-md">
    <div class="flex items-center justify-end gap-2">
      <UiIconButton :icon="SlidersHorizontal" ariaLabel="Filters" />
      <UiIconButton :icon="Columns3" ariaLabel="Columns" />
      <UiButton><Plus aria-hidden="true" />New invoice</UiButton>
    </div>
    <UiCard :padded="false">
      <UiList>
        <UiListItem
          v-for="row in INVOICES"
          :key="row.id"
          :title="row.id"
          :description="row.client"
        >
          <template #actions>
            <UiIconButton :icon="Pencil" variant="ghost" :ariaLabel="`Edit ${row.id}`" />
            <UiIconButton :icon="Copy" variant="ghost" :ariaLabel="`Duplicate ${row.id}`" />
            <UiIconButton
              :icon="Trash2"
              variant="ghost"
              tone="danger"
              :ariaLabel="`Delete ${row.id}`"
            />
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- Know why an action is unavailable.
- Name each field once for screen readers.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set `loading` from the press until the request answers.
- Word the reason as UiButton’s; `ariaLabel` still names the action.
- Name the action, not the icon: Send a reminder, not Bell. Wrap it in UiTooltip where people need to see the name.

## Why it works this way

A button for an action, drawn as a single Lucide glyph in a square target.

**Look.** The button sizes the glyph; `variant` is the presentation, `tone` the meaning.

**Name.** Its name is `ariaLabel`, a required prop rather than the native attribute, since the button has no text to be named by; an empty one warns in dev. No hint shows the name: where a sighted user needs it, wrap the button in a UiTooltip, which then does not read the name twice.

**Toggle.** `pressed` makes it a toggle, as on UiButton: `aria-pressed`, the brand frame and plate, and the system highlight under forced colors. A `primary` square is never a toggle.

**Split.** Last in a row of UiButtonGroup, right after a button with text, it is the arrow of a split button, `primary` or `outline`: the group draws it narrower than a square (28 wide at `sm`), its glyph unchanged, so it reads as a part of the button beside it. A `#trailing` tail keeps its pill.

**Tail.** A `#trailing` tail (a count) keeps its width while loading.

**Disabled.** As on UiButton: `disabled` alone takes no focus and says nothing; with `disabledReason` the square keeps the focus, refuses the press, and says why in a tooltip and as its description ("Paid invoices cannot be deleted"). A UiTooltip around it for its name keeps naming it while it works; while it is off, the reason shows instead.

**Placement.** It sits in the header of a modal or a drawer (the close cross and the record arrows), in a table row's actions, in a capsule's `#end` beside the value (a clear button), on a pager and as a calendar's arrows, in a toast's corner, in a UiListItem's `#actions`, and as the trigger of a popover or a menu. A `primary` one is the arrow of a split button, beside a primary UiButton in a UiButtonGroup. Its neighbors are UiButton (with text) and UiCopyButton, whose glyph-only form is one of these.

### Keyboard

A native button.
- `Tab`: reaches it; `disabled` takes no focus, unless it has a `disabledReason`.
- `Enter` `Space`: press it. `loading` refuses the press before your handler sees it, and keeps the focus. A held Enter is one press: its repeats press nothing.
`type="submit"` sends the form it sits in.

### Screen reader

- Name: `ariaLabel`, which is required; the glyph is hidden (`aria-hidden`).
- Loading: says busy (`aria-busy`) and disabled (`aria-disabled`) while the button keeps its name.
- Pressed: `pressed` is `aria-pressed`, only on a toggle.
- Disabled with a reason: `aria-disabled`, and the reason is its description, read once.
- Hint: none shows the name; a UiTooltip you wrap around it shows it to the eye, and it is not read twice.

### States

Rest; hover; focus (a `danger` one keeps the red ring); pressed (the brand frame and plate, the system highlight under forced colors); loading (a spinner one step larger than the glyph, the color kept, the width kept with a `#trailing` tail); disabled (the glyph grayed, the shape kept), with a reason the focus kept and the hint shown. `primary`, `outline` and `ghost` in `neutral`, `brand` and `danger`; `xs`, `sm` and `md`; with a tail, a pill that keeps its height; in both themes.

### When to use another component

- Text: UiButton.
- Copying a value: UiCopyButton.
- A choice among options: UiRadioGroup `segmented`.
- A primary square as a toggle: never; it is the arrow of a split button in UiButtonGroup.

## Examples

### Variants

```vue
<script setup lang="ts">
import { ChevronDown, Plus, Trash2 } from '@lucide/vue'
import { UiIconButton, UiButtonGroup, UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiIconButton :icon="Plus" ariaLabel="Add" />
      <UiIconButton :icon="Plus" tone="brand" ariaLabel="Add" />
      <UiIconButton :icon="Trash2" tone="danger" ariaLabel="Delete" />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <UiIconButton :icon="Plus" variant="ghost" ariaLabel="Add" />
      <UiIconButton :icon="Plus" variant="ghost" tone="brand" ariaLabel="Add" />
      <UiIconButton :icon="Trash2" variant="ghost" tone="danger" ariaLabel="Delete" />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <UiButtonGroup ariaLabel="Save">
        <UiButton>Save</UiButton>
        <UiIconButton :icon="ChevronDown" variant="primary" ariaLabel="More ways to save" />
      </UiButtonGroup>
      <UiIconButton :icon="Trash2" variant="primary" tone="danger" ariaLabel="Delete" />
    </div>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { UiIconButton } from 'grani-ui'
</script>

<template>
  <UiIconButton :icon="Pencil" size="xs" ariaLabel="Edit" />
  <UiIconButton :icon="Pencil" ariaLabel="Edit" />
  <UiIconButton :icon="Pencil" size="md" ariaLabel="Edit" />
</template>

```

### Toggle

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Star } from '@lucide/vue'
import { UiCard, UiList, UiListItem, UiIconButton } from 'grani-ui'

const REPORTS = ['Revenue by month', 'Unpaid invoices', 'Clients by region', 'Refunds']

const starred = ref(new Set(['Unpaid invoices']))

function star(name: string) {
  const next = new Set(starred.value)
  if (!next.delete(name)) next.add(name)
  starred.value = next
}
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem v-for="name in REPORTS" :key="name" :title="name">
        <template #actions>
          <UiIconButton
            :icon="Star"
            variant="ghost"
            :pressed="starred.has(name)"
            :ariaLabel="`Star ${name}`"
            @click="star(name)"
          />
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Tooltip

```vue
<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { UiTooltip, UiIconButton } from 'grani-ui'
</script>

<template>
  <UiTooltip content="Settings">
    <UiIconButton :icon="Settings" variant="ghost" ariaLabel="Settings" />
  </UiTooltip>
</template>

```

### In a field

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { X } from '@lucide/vue'
import { UiInput, UiIconButton } from 'grani-ui'

const query = ref('invoices')
</script>

<template>
  <UiInput v-model="query" ariaLabel="Search" class="w-72">
    <template #end>
      <UiIconButton
        v-if="query"
        :icon="X"
        variant="ghost"
        size="xs"
        ariaLabel="Clear the search"
        @click="query = ''"
      />
    </template>
  </UiInput>
</template>

```

### Trailing

```vue
<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { UiIconButton } from 'grani-ui'
</script>

<template>
  <UiIconButton :icon="Bell" ariaLabel="Notifications, 12 new">
    <template #trailing>12</template>
  </UiIconButton>
  <UiIconButton :icon="Bell" variant="ghost" ariaLabel="Notifications, 128 new">
    <template #trailing>128</template>
  </UiIconButton>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Bell, Pencil, Trash2 } from '@lucide/vue'
import { UiIconButton, UiRadioGroup, UiRadio } from 'grani-ui'

const iconState = ref('loading')
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiIconButton
        :icon="Trash2"
        tone="danger"
        :loading="iconState === 'loading'"
        ariaLabel="Delete"
      />
      <UiIconButton
        :icon="Pencil"
        variant="ghost"
        :loading="iconState === 'loading'"
        ariaLabel="Edit"
      />
      <UiIconButton
        :icon="Pencil"
        size="md"
        :loading="iconState === 'loading'"
        ariaLabel="Edit"
      />
      <UiIconButton
        :icon="Bell"
        :loading="iconState === 'loading'"
        ariaLabel="Notifications, 128 new"
      >
        <template #trailing>128</template>
      </UiIconButton>
    </div>
    <UiRadioGroup v-model="iconState" variant="segmented" aria-label="State of the buttons">
      <UiRadio value="idle">Idle</UiRadio>
      <UiRadio value="loading">Loading</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import { UiIconButton } from 'grani-ui'
</script>

<template>
  <UiIconButton :icon="Pencil" disabled ariaLabel="Edit" />
  <UiIconButton :icon="Trash2" variant="ghost" tone="danger" disabled ariaLabel="Delete" />
  <UiIconButton
    :icon="Trash2"
    variant="ghost"
    tone="danger"
    disabled
    disabled-reason="Paid invoices cannot be deleted"
    ariaLabel="Delete"
  />
</template>

```

## API

Props:
- `type`: `"button" | "submit" | "reset"` = `button | submit | reset` (default `"button"`) — Native type; `submit` sends the form the button sits in.
- `icon`: `Component` — A Lucide icon component, e.g. `Pencil` from `@lucide/vue`.
- `variant`: `IconButtonVariant` = `outline | primary | ghost` (default `"outline"`) — Presentation: `primary` is the brand fill (the arrow of a split button), `outline` a white square with a border, `ghost` only the glyph until hovered.
- `tone`: `IconButtonTone` = `brand | neutral | danger` (default `"neutral"`) — Meaning of the glyph: gray, brand, or a dangerous action. `pressed` on overrides it with the brand frame.
- `ariaLabel`: `string` (required) — The accessible name, for a screen reader; no hint shows it, so wrap the button in UiTooltip where a sighted user needs it. Required: the button has no visible text.
- `disabled`: `boolean` — Natively disabled: out of the Tab order, grayed; with `disabledReason`, focusable and saying why.
- `disabledReason`: `string` — Why it cannot be pressed now, while `disabled`, as UiButton's: it stays in the Tab order, refuses the press, and says the reason in a tooltip and as its description.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder: `xs` 28px for a dismiss in a corner, `sm` 36px, `md` 44px for forms. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `loading`: `boolean` (default `false`) — A request is running: spinner instead of the glyph, `aria-busy`, no clicks; focus stays, as in `UiButton`.
- `pressed`: `boolean` — A toggle (pin, bookmark), as UiButton's `pressed`: `aria-pressed`, and on, the brand frame and plate. Unset, it is no toggle. A `primary` square is never one.
Attributes are placed by the component itself: its description says where.

Slots:
- `default` with `Record<string, never>` — A glyph in place of `icon`; the button sizes it.
- `trailing` with `Record<string, never>` — A short tail after the glyph, such as a count; the square grows wider on one line.

## How it behaves

### One press, one request

- When: its request is on its way.
- Props: `loading` while the request runs.
- Guarantee: A spinner replaces the icon, a second press by mouse or keyboard is stopped before it reaches your handler, and keyboard focus stays on the button.
- Without it: Pressing the bell twice while sending is slow sends the client two reminders.
- Code: `<UiIconButton :icon="Bell" :loading="sending" ariaLabel="Send a reminder" @click="send" />`
- Your part: Set `loading` from the press until the request answers.
- Not covered: The button does not know about the request: without `loading`, every press reaches your handler.
- Proof, in the repository's tests (UiIconButton.spec.ts, not in the package): "keeps focus when loading starts and refuses the click before the caller", "fires click when enabled and never when disabled or loading"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Says why

- When: a row’s action is off for a reason the person can act on.
- Props: `disabled` with `disabledReason`.
- Guarantee: The square keeps its disabled look and its focus, refuses the press, and says why in a tooltip and as its description, beside its own name. A UiTooltip you wrap around it for its name keeps naming it while it works; while it is off, the reason shows instead.
- Without it: A grey glyph that Tab passes over: Delete is off, and nobody says that paid invoices stay.
- Code: `<UiIconButton :icon="Trash2" aria-label="Delete" :disabled="paid" disabled-reason="Paid invoices cannot be deleted" />`
- Your part: Word the reason as UiButton’s; `ariaLabel` still names the action.
- Proof, in the repository's tests (UiIconButton.spec.ts, not in the package): "disabled with a reason, it stays in the Tab order, refuses a press and is described by it", "off with a reason, it shows the reason on keyboard focus and on a tap", "a reason that comes and goes keeps the square, its focus and its ref", "as a menu button that refuses its press, it opens nothing by arrow", "a UiTooltip around it names it while it works and says the reason while it is off, with no warning"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#off-says-why

### One name

- When: it shows an icon with no text.
- Props: `ariaLabel`, required.
- Guarantee: Its name comes from `ariaLabel` alone, and the icon is hidden from screen readers. On its own it shows no tooltip; a UiTooltip around it shows the name on screen, and a screen reader does not announce it a second time.
- Without it: An icon announced only as “button”, or its name announced twice: once as the label and again as the hint.
- Code: `<UiTooltip content="Settings"><UiIconButton :icon="Settings" ariaLabel="Settings" /></UiTooltip>`
- Your part: Name the action, not the icon: Send a reminder, not Bell. Wrap it in UiTooltip where people need to see the name.
- Not covered: While it is off with a `disabledReason`, the tooltip shows the reason in place of the name; a screen reader still hears the name, then the reason.
- Proof, in the repository's tests (UiIconButton.spec.ts, not in the package): "ariaLabel is the accessible name; no tooltip and no title show it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`.
