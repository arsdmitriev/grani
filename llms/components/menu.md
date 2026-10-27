# Menu (`UiMenu`)

> Open a menu of available actions, such as exporting records, changing a row or managing your account.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/menu

Also called dropdown menu, context menu, action menu.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [Popover](https://grani.arseni.work/components/popover).

## Use

```vue
<script setup lang="ts">
import { ChevronDown, FileJson, FileSpreadsheet } from '@lucide/vue'
import { UiMenu, UiButton, UiListItem } from 'grani-ui'
</script>

<template>
  <UiMenu align="start">
    <template #trigger>
      <UiButton variant="outline">Export<ChevronDown /></UiButton>
    </template>
    <UiListItem as="button" title="CSV">
      <template #media><FileSpreadsheet /></template>
    </UiListItem>
    <UiListItem as="button" title="JSON">
      <template #media><FileJson /></template>
    </UiListItem>
  </UiMenu>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- Jump to an option by letter.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set `loading` on the item from its click until the command answers.
- Give the items labels that start with different letters where you can, so one press reaches each of them.

## Why it works this way

A list of commands that opens under a button. Take it for actions that have no room beside their subject, such as the actions of a table row.

**Trigger.** The trigger is your own button in `#trigger` (a UiButton, or a UiIconButton with three dots); the menu gives it `aria-haspopup`, `aria-expanded` and the toggle.

**Items.** Items are UiListItem command rows (`as="button"`) in the default slot, with groups split by a UiSeparator. The menu draws every one as a `menuitem`, a row of its panel list (`utils/panelList`, shared with UiSelect, UiFilterList and UiDateRange): edge to edge, lit as the same band by the arrows and by the pointer, with the row's title, description, glyphs, tone, `loading`, `disabled` and `step`. A click on an item runs it and closes the menu, unless the item is `loading` or `disabled`. A menu runs commands only: a link row (`to`) or a label row in it warns in development, since it would be a button going nowhere; a place to go is a link row outside the menu, or a command whose `@click` navigates. A text or a row inside a component of your own warns too: it is not an item.

**Popover.** It stands on the panel core UiPopover stands on, which gives the panel, its place beside the button and its place on the overlay stack; the menu adds the items and the keys. It holds commands only. A panel of controls (filters, a period, columns) is a plain popover, because it needs the focus moved into it and kept there, which a menu does not do.

**Kept pages.** In a page that a `KeepAlive` keeps, a menu left open stays in the body when the page is deactivated, as a popover does. Close it when the route changes.

**Placement.** It sits under a button of its own, in the trailing slot of a UiButtonGroup, and in a table row's `#row-actions`. Opened from a drawer or a window, it paints above it.

### Keyboard

As in the WAI-ARIA menu button.
On the button:
- `Enter` `Space` `ArrowDown`: open it on the first item.
- `ArrowUp`: opens it on the last item. With `Alt` the arrows open it too; `Ctrl` or `Meta` with one stays the browser's.
In the open menu:
- `ArrowDown` `ArrowUp` `Home` `End`: move; the arrows wrap and skip a disabled item.
- `A–Z`: goes to the next item that starts with the letter.
- `Escape` `Tab`: close it and return the focus to the button, and so does running an item, before its command runs: a command that removes the button's row leaves the focus to the list.
A held Enter is one press: it opens the menu once and runs one item.
A click outside closes it, and the focus stays where the click went. Opened with the mouse, it puts the focus on the panel, not on an item.

### Screen reader

- Button: says it opens a menu (`aria-haspopup="menu"`) and whether it is open (`aria-expanded`).
- Panel: a `menu` named by the button (`aria-labelledby`; your own id on the button wins).
- Items: each a `menuitem` outside the tab order; a `loading` item says busy (`aria-busy`), and a `disabled` one is a disabled button.

### States

Closed, or open beside the button on its start or end edge (`align`); while the button is scrolled out of the window, it waits hidden, still open, and the focus it held comes back with it. A `loading` item spins and refuses the click, and the menu stays open; a `disabled` item is skipped by the arrows. Past five commands, the panel takes a measured height that shows half of the sixth row, and scrolls. With every item switched off by `v-if` it opens empty, the focus on the panel: give the button `disabled` instead.

### When to use another component

- A panel of controls (filters, a period, columns): UiPopover.
- A value to pick: UiSelect.
- A few actions side by side: UiButtonGroup.

## Examples

### Row

```vue
<script setup lang="ts">
import { Copy, Ellipsis, Pencil, Trash2 } from '@lucide/vue'
import { UiMenu, UiIconButton, UiListItem, UiSeparator, UiConfirm, UiToaster, useConfirm } from 'grani-ui'

// Delete cannot come back: it asks first, as every destructive command in a menu does.
const { confirm } = useConfirm()

const remove = () =>
  confirm({
    title: 'Delete the invoice?',
    message: 'The invoice and its payments are removed. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
  })
</script>

<template>
  <UiMenu>
    <template #trigger>
      <UiIconButton :icon="Ellipsis" ariaLabel="Actions" variant="ghost" />
    </template>
    <UiListItem as="button" title="Edit">
      <template #media><Pencil /></template>
    </UiListItem>
    <UiListItem as="button" title="Duplicate">
      <template #media><Copy /></template>
    </UiListItem>
    <UiSeparator />
    <UiListItem as="button" title="Delete" tone="danger" @click="remove">
      <template #media><Trash2 /></template>
    </UiListItem>
  </UiMenu>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiConfirm />
  <UiToaster />
</template>

```

### States

```vue
<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { UiMenu, UiButton, UiListItem } from 'grani-ui'
</script>

<template>
  <UiMenu align="start">
    <template #trigger>
      <UiButton variant="outline">Sync<ChevronDown /></UiButton>
    </template>
    <UiListItem as="button" title="Sync now" loading />
    <UiListItem as="button" title="Sync the archive" description="Only for the owner" disabled />
  </UiMenu>
</template>

```

### Long

```vue
<script setup lang="ts">
import { ChevronDown, Folder } from '@lucide/vue'
import { UiMenu, UiButton, UiListItem } from 'grani-ui'

// Past five the panel takes a measured height and scrolls; half of the sixth row says there is more.
const FOLDERS = [
  'Inbox',
  'Drafts',
  'Sent',
  'Archive',
  'Invoices 2024',
  'Invoices 2025',
  'Invoices 2026',
  'Trash',
]
</script>

<template>
  <UiMenu align="start">
    <template #trigger>
      <UiButton variant="outline">Move to<ChevronDown /></UiButton>
    </template>
    <UiListItem v-for="folder in FOLDERS" :key="folder" as="button" :title="folder">
      <template #media><Folder /></template>
    </UiListItem>
  </UiMenu>
</template>

```

### Window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, FileSpreadsheet, FileText } from '@lucide/vue'
import { UiButton, UiModal, UiMenu, UiListItem } from 'grani-ui'

const windowOpen = ref(false)

const INVOICE = [
  { key: 'Total', value: '€1,240.00' },
  { key: 'Issued', value: 'Sep 3, 2026' },
  { key: 'Due', value: 'Sep 30, 2026' },
]
</script>

<template>
  <UiButton variant="outline" @click="windowOpen = true">Open the invoice</UiButton>
  <UiModal v-model:open="windowOpen" title="INV-1042" description="Blue Yonder Airlines">
    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <template v-for="row in INVOICE" :key="row.key">
        <dt class="text-fg-muted">{{ row.key }}</dt>
        <dd class="tabular-nums">{{ row.value }}</dd>
      </template>
    </dl>
    <template #footer>
      <UiMenu align="start">
        <template #trigger>
          <UiButton variant="outline" class="me-auto">Export<ChevronDown /></UiButton>
        </template>
        <UiListItem as="button" title="PDF">
          <template #media><FileText /></template>
        </UiListItem>
        <UiListItem as="button" title="CSV">
          <template #media><FileSpreadsheet /></template>
        </UiListItem>
      </UiMenu>
      <UiButton @click="windowOpen = false">Close</UiButton>
    </template>
  </UiModal>
</template>

```

## API

Props:
- `align`: `"start" | "end"` = `start | end` (default `"end"`) — Which edge of the button the menu lines up with; start and end follow the reading direction.
Attributes are placed by the component itself: its description says where.

Slots:
- `trigger` with `Record<string, never>` — The button that opens the menu: one element or component, it keeps its own look and name.
- `default` with `Record<string, never>` — The items: `UiListItem as="button"` rows placed directly (not inside a component of your own), groups split by a `UiSeparator`. An item's `@click` that stops the click keeps the menu open with the focus on its button: let it through.

## How it behaves

### One press, one request

- When: an item’s command is running (`loading` on the item).
- Props: `loading` on the UiListItem command row.
- Guarantee: While the item is marked `loading`, a spinner replaces its icon and further clicks are ignored. The menu stays open until the command finishes.
- Without it: A second click on a slow item runs the command again.
- Code: `<UiListItem as="button" title="Export" :loading="exporting" @click="exportAll" />`
- Your part: Set `loading` on the item from its click until the command answers.
- Proof, in the repository's tests (UiMenu.spec.ts, not in the package): "a busy item refuses the click and the menu stays open"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Letter jumps

- When: the menu is open.
- Props: none: every UiMenu.
- Guarantee: Type a letter to move focus to the next menu item that starts with it. Repeat it to cycle through matching items, returning to the start after the last match. If no item matches, focus stays where it is.
- Without it: A letter does nothing, and you move through the menu with the arrow keys, one item at a time.
- Code: `<UiMenu>
  <template #trigger><UiButton>Move to</UiButton></template>
  <UiListItem v-for="f in folders" :key="f" as="button" :title="f" />
</UiMenu>`
- Your part: Give the items labels that start with different letters where you can, so one press reaches each of them.
- Proof, in the repository's tests (UiMenu.spec.ts, not in the package): "a letter jumps to the next item whose label starts with it, wrapping"
- Pattern for all components: https://grani.arseni.work/patterns/finding#letter-jumps


The patterns: https://grani.arseni.work/patterns
