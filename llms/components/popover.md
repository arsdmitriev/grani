# Popover (`UiPopover`)

> Open a small panel of options beside a button while keeping the rest of the page available.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/popover

Also called dropdown panel, flyout, popup.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiPopover, UiButton, UiField, UiInput } from 'grani-ui'

const note = ref('')
</script>

<template>
  <!-- A few controls about the page, live as they change: a filter is UiFilter, columns UiTableColumns. -->
  <UiPopover align="center">
    <template #trigger>
      <UiButton variant="outline">Note</UiButton>
    </template>
    <UiField label="Note">
      <UiInput v-model="note" />
    </UiField>
    <template #footer="{ close }">
      <UiButton variant="secondary" size="xs" :disabled="!note" @click="note = ''"
        >Clear</UiButton
      >
      <UiButton size="xs" @click="close">Done</UiButton>
    </template>
  </UiPopover>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Open with keyboard focus where the task begins.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Put the field to start on first, or mark another one with the `data-autofocus` attribute.

## Why it works this way

A small panel under a button, with the page still live. Take it for a few controls about the page (a note, a currency, a date); a filter is UiFilter and the columns of a table UiTableColumns, both on this panel, as UiMenu is for its list of commands.

**Trigger.** The trigger is your own button in `#trigger`; the popover gives it `aria-haspopup`, `aria-expanded` and the toggle. The panel has no heading: the button names it, or `labelledby` does (a field's label).

**Dialog.** The panel is a non-modal dialog, and the page stays live: no backdrop, no scroll lock.

**Open state.** `v-model:open` lets the host open it, at mount too, and hear every close. When it is closed from outside, a focus that was inside goes back to the button.

**Kept pages.** In a page that a `KeepAlive` keeps, a panel left open stays in the body when the page is deactivated, and Escape closes it there. Close it (`open` false) when the route changes.

**Footer.** Actions (Apply, Reset) go in `#footer`, under a line at the end, never among the controls; both slots get `close`. Sections are flat UiCard components with a separator between neighbors, as in every overlay.

**Nesting.** A select, a menu or a date picker inside works: a press in its list does not count as outside, and anything opened from the panel paints above it. A list at the top or the bottom of the panel (a UiFilterList) reaches that edge, as a select's list does. The panel is never taller than the room beside its button, so it never covers the button; a longer panel scrolls inside itself.

**Attributes.** `class` and other attributes land on the panel. Its `id` stays its own, because the button points at it.

**Placement.** It sits in a table toolbar (UiFilter, UiDateRange, UiTableColumns), under a date field (UiDatePicker); a menu's panel (UiMenu) is the same panel, holding commands.

### Keyboard

- `Enter` `Space`: on the button, open it, as a click does. The focus goes to the first field (a drawn select, date, switch, scale, drop zone or date range too, or what is marked `data-autofocus`), else to the first control; a panel of buttons opens on its first button.
- `Tab`: goes round inside.
- `Escape`: closes it and returns the focus to the button, only while the panel is the top layer.
`close` from a slot does the same, unless the focus has already moved into a layer opened from the panel (a drawer an item opened), which keeps it. A click outside closes it and leaves the focus where the click went.

### Screen reader

- Button: says it opens a dialog (`aria-haspopup`), whether it is open (`aria-expanded`) and what it controls (`aria-controls`).
- Panel: a non-modal `dialog` named by the button (`aria-labelledby`), or by `labelledby` (a field's label), with no heading of its own.

### States

Closed, or open under the button on its start, center or end edge (`align`), above it when there is no room below. It is never taller than the room beside the button; a longer panel scrolls inside itself with the `#footer` in view. While its button is scrolled out of the window, the panel waits hidden, still open, and the focus it held comes back with it. Opened from outside with `v-model:open`, at mount too. A select, a menu or a date picker open inside it. Opened from a drawer, where Escape closes only the panel.

### When to use another component

- Commands: UiMenu.
- A task that needs the whole attention: UiModal.
- A record to edit: UiCrudDrawer.
- A hint of text alone: UiTooltip.

## Examples

### Nested

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { UiPopover, UiButton, UiField, UiSelect, UiDatePicker } from 'grani-ui'

const currency = ref<string | null>(null)

const currencies = [
  { value: 'eur', label: 'Euro' },
  { value: 'usd', label: 'US dollar' },
  { value: 'gbp', label: 'Pound sterling' },
]

const due = ref('')
</script>

<template>
  <UiPopover>
    <template #trigger>
      <UiButton variant="outline">Currency<ChevronDown /></UiButton>
    </template>
    <UiField label="Pay in">
      <UiSelect v-model="currency" :items="currencies" />
    </UiField>
  </UiPopover>
  <UiPopover>
    <template #trigger>
      <UiButton variant="outline">Due date<ChevronDown /></UiButton>
    </template>
    <UiField label="Due">
      <UiDatePicker v-model="due" class="w-full" />
    </UiField>
  </UiPopover>
</template>

```

### Open

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { UiPopover, UiButton, UiFilterList } from 'grani-ui'

// The host opens it: at mount, as a page landing on a saved filter does, and from a button after.
const outsideOpen = ref(true)

const REGIONS = ['North', 'South', 'East', 'West'].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}))

const region = ref([])
</script>

<template>
  <UiPopover v-model:open="outsideOpen">
    <template #trigger>
      <UiButton variant="outline">Region<ChevronDown /></UiButton>
    </template>
    <UiFilterList v-model="region" :items="REGIONS" ariaLabel="Region" />
  </UiPopover>
  <UiButton variant="ghost" :disabled="outsideOpen" @click="outsideOpen = true">Open it</UiButton>
  <span class="text-xs text-fg-muted" role="status">{{ outsideOpen ? 'Open' : 'Closed' }}</span>
</template>

```

### Drawer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { UiButton, UiCrudDrawer, UiCard, UiPopover, UiFilterList } from 'grani-ui'

const STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'canceled', label: 'Canceled' },
]

const drawerOpen = ref(false)

const drawerStatuses = ref(['due'])
</script>

<template>
  <UiButton variant="outline" @click="drawerOpen = true">Open the client</UiButton>
  <UiCrudDrawer
    v-model:open="drawerOpen"
    title="Northwind Traders"
    description="client · 12 invoices"
    readonly
  >
    <UiCard>
      <div class="flex flex-col items-start gap-4">
        <UiPopover>
          <template #trigger>
            <UiButton variant="outline">Status<ChevronDown /></UiButton>
          </template>
          <UiFilterList v-model="drawerStatuses" :items="STATUSES" ariaLabel="Status" />
        </UiPopover>
        <p class="text-sm text-fg-muted">
          Escape closes the panel and leaves the drawer; a second Escape closes the drawer.
        </p>
      </div>
    </UiCard>
  </UiCrudDrawer>
</template>

```

## API

Props:
- `align`: `"start" | "center" | "end"` = `start | center | end` (default `"start"`) — Which edge of the button the panel lines up with; start and end follow the reading direction.
- `anchor`: `HTMLElement | null` (default `null`) — The element the panel lines up with, when the button sits inside a wider one (a field's capsule).
- `labelledby`: `string` (default `""`) — The id of what names the panel, when the button's text is not its name (a field's label).
- `open`: `boolean` (default `false`) — Whether the panel is open (`v-model:open`): the host learns of every close and can open it from outside.
Attributes are placed by the component itself: its description says where.

Events:
- `update:open` (`value: boolean`) — The new value of `open`, for `v-model:open`.

Slots:
- `trigger` with `Record<string, never>` — The button that opens the panel: one element or component, it keeps its own look and name.
- `default` with `{ close: () => void; }` — The controls. `close` closes the panel and returns focus to the button.
- `footer` with `{ close: () => void; }` — The actions under a line at the end of the panel, `xs` buttons 8px in (a gray Reset first with `me-auto`, Apply last); it stays in view while the controls scroll. Gets `close`. One that draws nothing draws no line.

## How it behaves

### Focus starts inside

- When: the panel opens, from the keyboard or a click.
- Props: none: every UiPopover; `data-autofocus` names another place.
- Guarantee: Start typing or choosing as soon as the panel opens. Focus goes to its first field or list, including a select or switch. If there are none, it goes to the first button.
- Without it: The panel opens with keyboard focus left on the button that opened it, so what you type does not reach the panel’s field.
- Code: `<UiPopover>
  <template #trigger><UiButton>Note</UiButton></template>
  <UiField label="Note"><UiInput v-model="note" /></UiField>
</UiPopover>`
- Your part: Put the field to start on first, or mark another one with the `data-autofocus` attribute.
- Proof, in the repository's tests (UiPopover.spec.ts, not in the package): "focus goes to the first control and Tab goes round inside", "focus goes to the first list, not to a search further down"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start


The patterns: https://grani.arseni.work/patterns

## Built on it

- [Menu](https://grani.arseni.work/components/menu): Open a menu of available actions, such as exporting records, changing a row or managing your account.
