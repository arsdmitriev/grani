# Tabs (`UiTabs`)

> Switch between sections of the same screen without showing them all at once.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/tabs

Also called tab bar, tab strip, tabbed navigation.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTabs, UiListItem, UiAvatar, UiList, UiSwitch } from 'grani-ui'

const pane = ref('overview')

const twoFactor = ref(false)

const SESSIONS = [
  { title: 'MacBook Pro, Lisbon', when: 'This device' },
  { title: 'iPhone 15, Lisbon', when: '2 hours ago' },
  { title: 'Firefox on Windows, Porto', when: '3 days ago' },
]
</script>

<template>
  <UiTabs
    v-model="pane"
    class="w-full max-w-md"
    ariaLabel="Account"
    :tabs="[
      { value: 'overview', label: 'Overview' },
      {
        value: 'security',
        label: 'Security',
        badge: '!',
        badgeTone: 'danger',
        badgeLabel: 'needs attention',
      },
      { value: 'sessions', label: 'Sessions', badge: 3, badgeLabel: '3 active' },
    ]"
  >
    <template #header>
      <UiListItem title="Anna Petrova" description="Second factor is off">
        <template #media><UiAvatar name="Anna Petrova" size="md" /></template>
      </UiListItem>
    </template>
    <template #overview>
      <UiList>
        <UiListItem title="Email" description="anna@northwind.example" />
        <UiListItem title="Language" description="English" />
      </UiList>
    </template>
    <template #security>
      <UiList>
        <UiListItem
          as="label"
          title="Second factor"
          description="A code from an app at every sign-in."
        >
          <template #actions><UiSwitch v-model="twoFactor" /></template>
        </UiListItem>
      </UiList>
    </template>
    <template #sessions>
      <UiList>
        <UiListItem v-for="d in SESSIONS" :key="d.title" :title="d.title" :description="d.when" />
      </UiList>
    </template>
  </UiTabs>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See that a row goes on past its edge.
- Keep counts short and in place.
- Keep your browser’s keyboard shortcuts.
- Pass a group with one press of Tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Give `badgeLabel` the count in words, such as “3 unread”; a bare number triggers a warning in development.
- Share a link to the open tab.
- Name the strip with `ariaLabel`, and put each pane in the slot named after its tab.

## Why it works this way

Panes of one screen, one at a time. Take it when a page or a record splits into parts a person moves between; a choice with no panes is UiRadioGroup `segmented`.

**Panes.** The root is a `<div>`. The active tab's pane is the slot named after its value (`#overview`); a tab without a slot renders no pane. A pane that is not shown is unmounted, so a form in it must keep its values in the parent, not in the DOM. The pane follows `modelValue`, not the tabs: a value whose tab is gone (taken away with a permission) still shows its slot, named by no tab, so set `modelValue` to a tab that stays when the tabs change.

**Variants.** `underline` is a strip on its own. `panel` puts the strip inside the card shell as the header of a block, with `#header` above it; inside a UiCard's `#header`, the card is the shell and the panel draws none of its own. A tab stands on the control ladder (`size`, else the app's step).

**Focus.** A focused tab rings inward with its underline kept, so no scroll edge or card clips the ring. In forced colors the selected tab is highlighted.

**Direction.** The strip follows the reading direction: on a right-to-left page it starts at the right, and its paging arrow and faded edge stand on the side where tabs wait.

**Routing.** The active tab is not synced to the URL; the consumer does that around `v-model`.

### Keyboard

The WAI-ARIA tab pattern: the strip has one tab stop, the active tab, and a move activates the tab and focuses it.
- `ArrowLeft` `ArrowRight`: the tab to the left and the tab to the right, round the ends; a disabled tab is passed over. On a right-to-left page the strip starts at the right, so `ArrowRight` is the tab before and `ArrowLeft` the tab after.
- `Home` `End`: the first and the last tab.
- `Tab`: on to the pane's first control, or to the pane when it holds none.
- `ArrowUp` `ArrowDown`: stay the page's: the strip is horizontal.
- `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
The paging arrows of a wide set are for the pointer, outside the tab order.

### Screen reader

- Strip: a `tablist` named by `ariaLabel`.
- Tab: says whether it is selected (`aria-selected`) and controls its pane (`aria-controls`) only while the pane is there; a disabled tab says so (`aria-disabled`).
- Pane: a `tabpanel` named by its tab.
- Badge: read in the words of `badgeLabel`, with the number hidden; a bare number warns in dev, since the reader would hear the label and the number as one.

### States

Active, with the brand ink and underline; rest; hover, only when enabled; disabled, in the disabled ink, not chosen by a click or a key; focus, ringing inward with the underline kept. `panel` in the card shell, with `#header` and a rule above the strip, and inside a UiCard's `#header` with no shell of its own; `underline` on its own. A set wider than the strip scrolls, with faded edges and arrows on desktop. In forced colors the selected tab is highlighted. `sm` is 36px, `md` 44px.

### When to use another component

- A choice with no panes: UiRadioGroup `segmented`.
- Pages of one set: UiPagination.
- The places of the app: UiAppShell.
- A block shown or hidden in place: UiReveal.

## Examples

### Underline

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiTabs, UiList, UiListItem, UiMoneyCell, UiBadge, UiSwitch } from 'grani-ui'

const tab = ref('overview')

const EVENTS = [
  { title: 'Invoice INV-1045 paid', when: 'Today, 09:15' },
  { title: 'Contact changed', when: 'Yesterday, 18:02' },
  { title: 'Note added by Ivan', when: 'Sep 27, 11:40' },
]
</script>

<template>
  <!-- The strip is the card's header, the pane its body: one frame, no gap between them. -->
  <UiCard :padded="false" class="w-full max-w-md">
    <template #header>
      <UiTabs
        v-model="tab"
        variant="underline"
        ariaLabel="Sections of the record"
        :tabs="[
          { value: 'overview', label: 'Overview' },
          { value: 'activity', label: 'Activity', badge: 12, badgeLabel: '12 new' },
          { value: 'settings', label: 'Settings' },
        ]"
      >
        <template #overview>
          <UiList>
            <UiListItem title="Client" description="Northwind Traders" />
            <UiListItem title="Amount">
              <template #actions><UiMoneyCell :value="1280" currency="EUR" /></template>
            </UiListItem>
            <UiListItem title="Status"
              ><template #actions><UiBadge tone="success" label="Paid" /></template
            ></UiListItem>
          </UiList>
        </template>
        <template #activity>
          <UiList>
            <UiListItem
              v-for="e in EVENTS"
              :key="e.title"
              :title="e.title"
              :description="e.when"
            />
          </UiList>
        </template>
        <template #settings>
          <UiList>
            <UiListItem
              as="label"
              title="Email on payment"
              description="A letter when an invoice is paid."
            >
              <template #actions><UiSwitch :model-value="true" /></template>
            </UiListItem>
          </UiList>
        </template>
      </UiTabs>
    </template>
  </UiCard>
</template>

```

### Many tabs

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTabs } from 'grani-ui'

const month = ref('sep')

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
].map((label) => ({ value: label.toLowerCase(), label: `${label} 2026` }))
</script>

<template>
  <!-- Wider than its strip: the edges fade, arrows page on a desktop pointer, the selected tab rides into view. -->
  <div class="w-full max-w-sm">
    <UiTabs v-model="month" variant="underline" ariaLabel="Month" :tabs="MONTHS" />
  </div>
</template>

```

### Medium

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTabs } from 'grani-ui'

const range = ref('month')
</script>

<template>
  <UiTabs
    v-model="range"
    variant="underline"
    size="md"
    ariaLabel="Range"
    class="w-full max-w-sm"
    :tabs="[
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ]"
  >
    <template #week><p class="text-sm text-fg-muted">The last seven days.</p></template>
    <template #month><p class="text-sm text-fg-muted">September, day by day.</p></template>
    <template #year><p class="text-sm text-fg-muted">2026, month by month.</p></template>
  </UiTabs>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiTabs } from 'grani-ui'

const period = ref('draft')
</script>

<template>
  <!-- Shown but not chosen: the arrows pass over it, a click does nothing. -->
  <UiTabs
    v-model="period"
    variant="underline"
    ariaLabel="Period"
    class="w-full max-w-sm"
    :tabs="[
      { value: 'draft', label: 'Draft' },
      { value: 'review', label: 'Review', disabled: true },
      { value: 'published', label: 'Published' },
    ]"
  />
</template>

```

## API

Props:
- `modelValue`: `TabValue` (required) — Value of the active tab (`v-model`).
- `tabs`: `TabItem[]` (required) — Tabs in order: `value`, `label`, `disabled`, and a `badge` with its `badgeTone` and `badgeLabel` (what it means, in words).
- `variant`: `"panel" | "underline"` = `panel | underline` (default `"panel"`) — `panel` (the default) is the header of a block inside the card shell; `underline` is a strip on its own.
- `ariaLabel`: `string` (required) — Accessible name of the tab set.
- `size`: `"sm" | "xs" | "md"` = `xs | sm | md` — Step of a tab on the control ladder: `sm` 36px, `md` 44px. Unset, the app's size (`createGrani({ size })`); `xs` is read as `sm`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `update:modelValue` (`value: TabValue`) — The new value, for `v-model`.

Slots:
- `header` with `Record<string, never>` — Above the strip, inside the shell; `panel` only. What the tabs do not switch.

## How it behaves

### More past the edge

- When: its tabs are wider than their strip.
- Props: none: every UiTabs.
- Guarantee: The strip scrolls sideways without a bar and never wraps; an edge that hides tabs fades, and with a mouse an arrow there pages to the rest.
- Without it: Tabs past the edge that nobody knows are there, or a strip that breaks onto a second line.
- Code: `<UiTabs v-model="tab" :tabs="tabs" aria-label="Sections" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTabs.spec.ts, not in the package): "a long set scrolls sideways without a bar and never wraps", "edges that hide tabs fade and grow arrows; a set that fits has neither", "the arrows are for a mouse: drawn only on a device whose pointer hovers and is fine, never on touch"
- Pattern for all components: https://grani.arseni.work/patterns/finding#edge-says-more

### Compact counts

- When: a tab has a count.
- Props: `badge` and `badgeLabel` on the tab.
- Guarantee: The count shows only above zero and reads 99+ past its limit. A screen reader announces the words you give, such as “3 unread”, instead of a bare number.
- Without it: A 0 sits on every quiet tab, and a screen reader announces “Inbox 3” without saying what the 3 counts.
- Code: `<UiTabs :tabs="[{ value: 'inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread' }]" … />`
- Your part: Give `badgeLabel` the count in words, such as “3 unread”; a bare number triggers a warning in development.
- Proof, in the repository's tests (UiTabs.spec.ts, not in the package): "a count of zero draws no badge", "a count past its limit reads 99+ and keeps the badge short", "a badge with badgeLabel is read in words: the number hidden, the meaning said", "a bare number badge warns in dev"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#compact-counts

### Share a link to the open tab

- When: a tab should be shared as a link.
- Props: `v-model`.
- Guarantee: It shows the tab named by `v-model` and reports every change through it; it does not read or write the page address itself.
- Without it: A link that always opens on the first tab, whatever tab was open when it was sent.
- Code: `<UiTabs v-model="tabInUrl" :tabs="tabs" ariaLabel="Client" />`
- Your part: Bind `v-model` to a query parameter of the route and read it back when the page opens. If the address names a tab that no longer exists, fall back to the first one.

### Shortcuts kept

- When: keyboard focus is on a tab.
- Props: none: every UiTabs.
- Guarantee: The arrows move between tabs; with Alt or Cmd held the tab stays and the browser takes the key, so Alt+Left still goes back a page.
- Without it: Going back a page from the row of tabs switches the tab instead.
- Code: `<UiTabs v-model="tab" :tabs="tabs" ariaLabel="Client" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiTabs.spec.ts, not in the package): "a browser chord on a tab is not swallowed: Alt+ArrowLeft and Cmd+ArrowRight emit nothing"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#shortcuts-kept

### One Tab per group

- When: a screen is split into tabs.
- Props: `tabs`, `v-model` and `ariaLabel`.
- Guarantee: The tab strip takes one press of Tab and enters on the open tab. The arrow keys move to the next or previous tab and open it, wrapping round at the ends; Home and End go to the first and last tab, and the next Tab goes into the open pane.
- Without it: Tabs built as a row of buttons take a press of Tab each before you reach the content below them.
- Code: `<UiTabs v-model="tab" :tabs="tabs" ariaLabel="Client"><template #overview>…</template></UiTabs>`
- Your part: Name the strip with `ariaLabel`, and put each pane in the slot named after its tab.
- Not covered: A pane that is not shown is unmounted, so a form inside it keeps what was typed only if the parent holds the values.
- Proof, in the repository's tests (UiTabs.spec.ts, not in the package): "marks the active tab and gives only it a tab stop", "arrows wrap round the ends; Home and End jump to the ends", "a pane with a focusable child adds no tab stop of its own; a pane of words does"
- Pattern for all components: https://grani.arseni.work/patterns/opening#one-stop


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`.
