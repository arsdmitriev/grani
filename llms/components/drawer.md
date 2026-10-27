# Drawer (`UiDrawer`)

> Read or edit details in a side panel without leaving the list or page behind it.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/drawer

Also called side panel, sheet, off-canvas panel, slide-over.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Download, ExternalLink, Mail } from '@lucide/vue'
import { UiCard, UiList, UiListItem, UiBadge, UiDrawer, UiIconButton } from 'grani-ui'

// One list of invoices behind every tab: the panel stands beside it, and the list answers.
type Status = 'draft' | 'sent' | 'paid'

interface Line {
  item: string
  qty: string
  amount: string
}

interface Invoice {
  id: string
  client: string
  total: string
  issued: string
  due: string
  status: Status
  lines: Line[]
  payments: { on: string; how: string; amount: string }[]
}

const INVOICES: Invoice[] = [
  {
    id: 'INV-0042',
    client: 'Acme Corp',
    total: '€1 240.00',
    issued: 'Sep 3',
    due: 'Sep 30',
    status: 'paid',
    lines: [
      { item: 'Design review', qty: '2 × €400.00', amount: '€800.00' },
      { item: 'Prototype', qty: '1 × €440.00', amount: '€440.00' },
    ],
    payments: [{ on: 'Sep 12', how: 'Bank transfer', amount: '€1 240.00' }],
  },
  {
    id: 'INV-0043',
    client: 'Birch & Co',
    total: '€380.00',
    issued: 'Sep 9',
    due: 'Oct 9',
    status: 'sent',
    lines: [{ item: 'Support, September', qty: '4 h × €95.00', amount: '€380.00' }],
    payments: [],
  },
  {
    id: 'INV-0044',
    client: 'Cedar Ltd',
    total: '€2 115.50',
    issued: 'Sep 14',
    due: 'Oct 14',
    status: 'sent',
    lines: [
      { item: 'Workshop', qty: '1 × €1 500.00', amount: '€1 500.00' },
      { item: 'Travel', qty: '1 × €415.50', amount: '€415.50' },
      { item: 'Materials', qty: '4 × €50.00', amount: '€200.00' },
    ],
    payments: [{ on: 'Sep 20', how: 'Card', amount: '€500.00' }],
  },
  {
    id: 'INV-0045',
    client: 'Northwind',
    total: '€640.00',
    issued: 'Sep 20',
    due: 'Oct 20',
    status: 'draft',
    lines: [{ item: 'Audit', qty: '1 × €640.00', amount: '€640.00' }],
    payments: [],
  },
  {
    id: 'INV-0046',
    client: 'Lumen Studio',
    total: '€95.00',
    issued: 'Sep 28',
    due: 'Oct 28',
    status: 'paid',
    lines: [{ item: 'Hosting, October', qty: '1 × €95.00', amount: '€95.00' }],
    payments: [{ on: 'Sep 29', how: 'Card', amount: '€95.00' }],
  },
]

const STATUS: Record<Status, { label: string; tone: 'neutral' | 'info' | 'success' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
}

// Detail: the row pressed opens its own invoice.
const current = ref<Invoice | null>(null)

const detailOpen = ref(false)

const openRow = (row: Invoice) => {
  current.value = row
  detailOpen.value = true
}
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem
        v-for="row in INVOICES"
        :key="row.id"
        as="button"
        :title="row.id"
        :description="row.client"
        @click="openRow(row)"
      >
        <template #actions>
          <UiBadge :tone="STATUS[row.status].tone" :label="STATUS[row.status].label" />
        </template>
      </UiListItem>
    </UiList>
  </UiCard>
  <UiDrawer v-model:open="detailOpen" :title="current?.id ?? ''">
    <template #description>
      <UiBadge
        v-if="current"
        :tone="STATUS[current.status].tone"
        :label="STATUS[current.status].label"
        variant="inline"
        size="sm"
      />
      <span>{{ current?.client }}</span>
    </template>
    <template #actions>
      <UiIconButton :icon="ExternalLink" ariaLabel="Open as a page" variant="ghost" />
    </template>
    <template v-if="current">
      <UiCard>
        <p class="text-2xl font-semibold tabular-nums text-fg">{{ current.total }}</p>
        <p class="text-sm text-fg-muted">Due {{ current.due }} · Issued {{ current.issued }}</p>
      </UiCard>
      <UiCard title="Lines" :padded="false">
        <UiList>
          <UiListItem
            v-for="line in current.lines"
            :key="line.item"
            size="sm"
            :title="line.item"
            :description="line.qty"
          >
            <template #actions>
              <span class="text-sm tabular-nums text-fg">{{ line.amount }}</span>
            </template>
          </UiListItem>
        </UiList>
      </UiCard>
      <UiCard title="Payments" :padded="false">
        <UiList>
          <UiListItem
            v-for="pay in current.payments"
            :key="pay.on"
            size="sm"
            :title="pay.on"
            :description="pay.how"
          >
            <template #actions>
              <span class="text-sm tabular-nums text-fg">{{ pay.amount }}</span>
            </template>
          </UiListItem>
          <UiListItem
            v-if="!current.payments.length"
            size="sm"
            title="No payments yet"
            :description="`Due ${current.due}`"
          />
        </UiList>
      </UiCard>
      <UiCard :padded="false">
        <UiList>
          <UiListItem
            v-if="current.status !== 'paid'"
            as="button"
            size="sm"
            title="Send a reminder"
          >
            <template #actions><Mail aria-hidden="true" /></template>
          </UiListItem>
          <UiListItem as="button" size="sm" title="Download the PDF">
            <template #actions><Download aria-hidden="true" /></template>
          </UiListItem>
          <UiListItem as="button" size="sm" title="Copy the link">
            <template #actions><Copy aria-hidden="true" /></template>
          </UiListItem>
        </UiList>
      </UiCard>
    </template>
  </UiDrawer>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Close only the top layer with Escape.
- Open with keyboard focus where the task begins.
- Continue from where you opened the panel.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Put the field where the task starts first in the panel’s content.
- Open the panel from a button or row that will remain on the page when the panel closes. An action in the panel that removes its record closes the panel first, waits a tick (`await nextTick()`), then removes the row: a UiTable then hands keyboard focus to the same control of the row now in its place.

## Why it works this way

A panel at the inline end of the screen, full height, over the page it came from. Take it for what is read or set beside a list without leaving it: the settings of a view, the details of a row.

**Closing.** `title` names the panel and `description` describes it. The backdrop, Escape and the cross close it. Escape works only while the panel is the top layer, so a confirm over it closes first. `persistent` guards unsaved input: the backdrop and Escape are refused with a shake, but the cross still closes, since pressing it is an explicit intent. `submitting` refuses every close while a request is out. These guard only the panel's own exits; `open` set to false from outside is for the host to guard.

**Layout.** Attributes land on the dialog. The panel takes the full height at the inline end (the left in a right-to-left page), `md` 512px wide or `lg` 768px for what reads wide, and the whole width on a narrow screen. The page under it does not scroll; a long body scrolls between the header and the footer. The body is padded by `--space-drawer`; the header and the footer stand on it at the sides, so the title, the content and the footer's buttons share one edge. The footer's buttons share its width, as in a window. Cards in the body are its sections, flat, with a line between neighbors drawn by UiSeparator.

**Kept pages.** In a page that a `KeepAlive` keeps, a panel left open stays open when the page is deactivated: its layer, its Escape and its scroll lock go on over the next page. Close it (`open` false) when the route changes.

**Header.** The title is one line, cut when long and shown whole on hover. The line under it is `description`, or `#description` in your own markup: a status mark, an id to copy. `#actions` takes an icon button or two before the cross.

Changes at once. A panel whose controls apply as they change (a setting, a filter) has no footer: there is nothing to confirm, and the cross closes it. A footer is for a panel that sends something. A filter that covers the list it narrows is that case: its ticks wait in a draft, the footer's button says what applying will show ("Show 12 invoices"), and closing any other way drops the draft.

### Keyboard

The focus starts on the first field (a drawn select, date, switch, scale, drop zone or date range too), not on the cross. With no field it starts on a body longer than the panel, so the arrows scroll it at once, else on the panel itself.
- `Tab`: goes round inside the panel; a body longer than the panel is one of its stops.
- `ArrowUp` `ArrowDown` `PageUp` `PageDown` `Home` `End`: scroll that body once it holds the focus.
- `Escape`: closes the panel, only while it is the top layer; `persistent` answers it with a shake, and `submitting` refuses it.
On close the focus returns to where it was.

### Screen reader

- Window: a modal dialog (`aria-modal`) named by `title` (`aria-labelledby`) and described by the line under it.
- Cross: named "Close".
- Long body: a region named by the title, so the reader says what the keys scroll through.
- Refused close: a shake for the eye; the reader keeps the focus where it was and hears why, from a status region inside the drawer: input not saved, or a request still on its way.

### States

A settings panel that applies at once, with no footer; a read-only detail of rows; a panel with a footer; `persistent` shaking at the backdrop and Escape; a long body that scrolls between the header and the footer; a narrow screen, where the panel takes the whole width.

### When to use another component

- A record to edit or create: UiCrudDrawer, with Save, loading and steps, built on this panel.
- A short task for the person's whole attention: UiModal.
- A small panel of controls under a button: UiPopover, with the page live.
- A second panel over this one: never; what opens from it is a UiModal for a short task, or a step of the same panel. Development warns when a drawer opens over another; a window or a question over it is fine.

## Examples

### Persistent

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiButton, UiDrawer, UiCard, UiStack, UiField, UiInput, UiTextarea } from 'grani-ui'

// Typed but not sent: a press beside the panel or Escape shakes it instead of closing; the
// cross and Cancel still close, as an explicit choice.
const reminder = ref(false)

const BLANK = {
  to: 'accounts@birch.example',
  subject: 'INV-0043 is due on Oct 9',
  body: '',
}

const mail = ref({ ...BLANK })

const unsaved = computed(() => mail.value.body.trim() !== '')

function openReminder() {
  mail.value = { ...BLANK }
  reminder.value = true
}
</script>

<template>
  <UiButton variant="outline" @click="openReminder">Send a reminder</UiButton>
  <UiDrawer
    v-model:open="reminder"
    title="Send a reminder"
    description="INV-0043 · Birch & Co"
    :persistent="unsaved"
  >
    <UiCard>
      <UiStack>
        <UiField label="To"><UiInput v-model="mail.to" type="email" /></UiField>
        <UiField label="Subject"><UiInput v-model="mail.subject" /></UiField>
        <UiField label="Message">
          <UiTextarea v-model="mail.body" placeholder="Type, then press Escape" />
        </UiField>
      </UiStack>
    </UiCard>
    <template #footer>
      <UiButton variant="secondary" @click="reminder = false">Cancel</UiButton>
      <UiButton @click="reminder = false">Send</UiButton>
    </template>
  </UiDrawer>
</template>

```

### Long

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiDrawer, UiStack } from 'grani-ui'

const terms = ref(false)
</script>

<template>
  <UiButton variant="outline" @click="terms = true">Read the terms</UiButton>
  <UiDrawer v-model:open="terms" title="Terms of the service" size="lg">
    <UiStack class="text-sm text-fg-muted">
      <p v-for="n in 24" :key="n">
        {{ n }}. The service keeps your records for as long as the account is open and for thirty
        days after it closes, so a closed account can be opened again with everything in place.
      </p>
    </UiStack>
  </UiDrawer>
</template>

```

## API

Props:
- `title`: `string` (required) — The panel's name, read first by a screen reader; required, a dialog without one is mute.
- `description`: `string` (default `""`) — One line under the title, read right after it.
- `size`: `"md" | "lg"` = `md | lg` (default `"md"`) — The panel's width: `md` 512px, the default; `lg` 768px for what reads wide, a text or a code.
- `persistent`: `boolean` (default `false`) — Unsaved input: the backdrop and Escape are refused with a shake; the cross still closes.
- `submitting`: `boolean` (default `false`) — A request is out: every close is refused with a shake.
- `open`: `boolean` (default `false`) — Whether the panel is open (`v-model:open`); every way out sets it false and emits `close`.
Attributes are placed by the component itself: its description says where.

Events:
- `update:open` (`value: boolean`) — The new value of `open`, for `v-model:open`.
- `close` — The panel closed: the cross, the backdrop or Escape.

Slots:
- `default` with `Record<string, never>` — The body. It scrolls when long; the header and the footer stay. UiCard sections are parted by a line.
- `description` with `Record<string, never>` — The line under the title in your own markup, in place of `description`: a status mark, an id to copy. One line.
- `actions` with `Record<string, never>` — Icon buttons before the cross: open as a page, copy a link. Ghost UiIconButton.
- `footer` with `Record<string, never>` — Actions, sharing the footer's width in equal parts: the cancel is `secondary` and first, the main action last. Leave it out for a panel that applies at once.

## How it behaves

### Escape, top first

- When: a window or a list is open over the panel.
- Props: none: every UiDrawer.
- Guarantee: Escape closes the topmost dialog or list while the drawer remains open. A later Escape reaches the drawer, where it goes back a level or closes the drawer at its top level.
- Without it: One Escape closes the window and the panel under it, and what you typed in the panel goes with them.
- Code: `<UiDrawer v-model:open="open" title="Filters">…</UiDrawer>`
- Your part: Nothing.
- Proof, in the repository's tests (UiDrawer.spec.ts, not in the package): "Escape closes only the layer on top: a window over the drawer first"
- Pattern for all components: https://grani.arseni.work/patterns/closing#escape-top

### Focus starts inside

- When: the panel opens.
- Props: none: every UiDrawer.
- Guarantee: Start filling in the form immediately: focus goes to its first field, including a select or switch. The close button does not take focus first. If there are no fields, focus goes to the panel itself.
- Without it: Keyboard focus starts on the close button, so the first Enter closes the panel you just opened.
- Code: `<UiDrawer v-model:open="open" title="View settings">…</UiDrawer>`
- Your part: Put the field where the task starts first in the panel’s content.
- Proof, in the repository's tests (UiDrawer.spec.ts, not in the package): "focus goes to the first field, not the cross; without fields to the panel"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start

### Focus comes back

- When: the panel closes by Escape, a press on the backdrop, the close button, or `open` set to false.
- Props: none: every UiDrawer.
- Guarantee: Keyboard focus goes back to what opened the panel, most often a row of the list, so you continue down the list from the row you opened.
- Without it: The panel closes with keyboard focus inside it, focus falls to the page, and you look for your place in the list again.
- Code: `<UiListItem as="button" :title="row.id" @click="open(row)" />
<UiDrawer v-model:open="isOpen" :title="row.id">…</UiDrawer>`
- Your part: Open the panel from a button or row that will remain on the page when the panel closes. An action in the panel that removes its record closes the panel first, waits a tick (`await nextTick()`), then removes the row: a UiTable then hands keyboard focus to the same control of the row now in its place.
- Not covered: A row removed before the panel closes takes the opener with it, and keyboard focus falls to the page. So does a delete asked through UiConfirm with an `action`: the question gives the focus back to the panel’s row, which left with the panel.
- Proof, in the repository's tests (UiDrawer.spec.ts, not in the package): "focus returns to the opener on close"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back


The patterns: https://grani.arseni.work/patterns

## Built on it

- [Crud drawer](https://grani.arseni.work/components/crud-drawer): Edit a record beside its list and open related lists within the same panel.

Built with what `grani-ui` exports: `useUiT`.
