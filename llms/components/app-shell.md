# App shell (`UiAppShell`)

> Organize an app around a sidebar for navigation and a main area for the page you are working on.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/app-shell

Also called app layout, sidebar layout, navigation shell.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BarChart3, Inbox, LifeBuoy, ReceiptText, Settings, Users } from '@lucide/vue'
import type { NavGroup } from 'grani-ui'
import { UiAppShell, UiStack, UiHeader, UiCard, UiProgress, useToday } from 'grani-ui'

// The app's wordmark: the name the home link is read by is the word the logo shows.
const brand = 'grani'

// The places are anchors on this page: the one pressed is the current one, and on arrival the
// page's hash. An app passes its route's path instead. A server never sees a hash: it is read once
// the page is in the browser.
const current = ref('#overview')

const follow = (e: MouseEvent) => {
  const to = (e.target as Element).closest('a[href^="#"]')?.getAttribute('href')
  if (to) current.value = to
}

// Sample figures, new each day: read from today's date in the browser, so the server's page and the
// client's agree, and a page photographed on a fixed day is the same every time.
const goal = ref<{ percent: number; left: string; days: number; perDay: string } | null>(null)

const amount = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))

const { now } = useToday()

onMounted(() => {
  if (location.hash) current.value = location.hash
  const day = Number(now.value.replaceAll('-', ''))
  const target = 10000
  const earned = 500 + ((day * 7919) % 9000)
  const days = 1 + ((day * 104729) % 27)
  goal.value = {
    percent: Math.round((earned / target) * 100),
    left: amount(target - earned),
    days,
    perDay: amount((target - earned) / days),
  }
})

const nav: NavGroup[] = [
  {
    items: [
      { to: '#overview', label: 'Overview', icon: BarChart3 },
      { to: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
      { to: '#invoices', label: 'Invoices', icon: ReceiptText },
      { to: '#clients', label: 'Clients and their contracts, by region', icon: Users },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '#settings', label: 'Settings', icon: Settings },
      { to: '#help', label: 'Help', icon: LifeBuoy },
    ],
  },
]

const title = computed(
  () => nav.flatMap((g) => g.items).find((i) => i.to === current.value)?.label ?? 'Overview',
)
</script>

<template>
  <UiAppShell
    :brand="brand"
    home="#overview"
    :current="current"
    :nav="nav"
    class="w-full rounded-card border border-border [--ui-shell-height:560px]"
    @click="follow"
  >
    <UiStack gap="title">
      <UiHeader :title="title" description="The page scrolls here; the sidebar stays." />
      <div class="grid gap-4 @3xl:grid-cols-3">
        <UiCard v-for="n in 6" :key="n" :title="`Block ${n}`">
          <div class="h-16 rounded-control bg-surface-muted" />
        </UiCard>
      </div>
    </UiStack>
    <template #logo>
      <span class="text-base font-bold tracking-tight text-fg">
        <!-- lint: english-ok -->
        grani<i aria-hidden="true" class="ms-0.5 inline-block size-1 rotate-45 bg-brand-solid" />
      </span>
    </template>
    <template #mark
      ><span aria-hidden="true" class="m-1 size-3 shrink-0 rotate-45 bg-brand-solid"
    /></template>
    <template v-if="goal" #banner>
      <div class="flex items-baseline justify-between text-xs font-medium text-fg-muted">
        <span>Left to the goal</span>
        <span class="tabular-nums">{{ goal.percent }}%</span>
      </div>
      <p class="mt-1 text-base font-semibold tabular-nums text-fg">{{ goal.left }} EUR</p>
      <UiProgress
        aria-label="Left to the goal"
        :value="goal.percent"
        :max="100"
        class="mt-2 h-1.5"
        :value-text="`${goal.percent}% of the goal`"
      />
      <p class="mt-2 text-xs text-fg-muted">
        {{ goal.days }} days left, {{ goal.perDay }} EUR a day
      </p>
    </template>
  </UiAppShell>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Keep nearby content in place while loading.
- Reach frequent actions from the keyboard.
- Continue from where you opened the panel.
- Keep keyboard focus where you are working.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass `loading` with an empty `nav` until the items arrive.
- List the shortcut wherever your app lists its keys.

## Why it works this way

The frame of an app, a sidebar of its places with the page beside it. It is the root of the app's layout, with UiToaster and UiConfirm mounted beside it.

**Sidebar.** The sidebar holds the logo (a link home), the places in groups (`nav`, each a link of the panel list's rows, `utils/panelList`, with a Lucide icon, a label cut to one line, and a count), `#banner` above the foot (a goal, a notice), and `#footer` at the bottom.

**Current place.** One place is lit, its label semibold: the one whose `to` is `current` itself (a section of one page, `#billing`), else the deepest whose `to` contains its path, a trailing slash no part of it; `home` and the root `/` are lit only on themselves, and of two places with one address the first. The app passes `current`, since the shell knows no router. Under forced colors the current place takes the highlight.

**Collapsing.** On desktop the sidebar collapses to its icons, by the button beside the logo (under `#mark`, or alone when collapsed) or by Ctrl or ⌘ B; each icon is named by a UiTooltip. Collapsed without `#mark` there is no link home, so the app lists home among its places; dev warns when it does not, and when `current` is not given. `v-model:collapsed` keeps the state where the app wants it; keeping it across visits is the app's: write it on `update:collapsed` (a cookie) and read it in setup, so the first paint is already right, on the server too; read after mount, the sidebar opens out and slides back. When it is bound, the shell follows it and only asks for a change.

**Narrow.** Narrow means the shell's own width is under 768px. There a bar holds the menu button and the logo, and the sidebar slides in from the start as a sheet (by the menu button, or Ctrl or ⌘ B). The focus moves in and stays; Escape or the backdrop closes the sheet, and so does a new `current`.

**Keys.** The keys do nothing under a window or a panel. With two shells, they reach the one the focus is in, else the first. In Firefox, Ctrl or ⌘ B is the bookmarks sidebar's too: where the shell acts on the key it takes it, held as well.

**Loading.** While the app's places are on their way (`loading`, `nav` still empty) the sidebar draws five rows in their shape, a glyph's square and a line; the logo, the collapse button and `#footer` are there at once, and `#banner` waits. Collapsed, the rows are their squares alone. When the places come nothing moves: the rows are the places' height, the sidebar its width; for places in one group without a heading, since a second group or a heading moves the rows under the first. With places already in view `loading` changes nothing: a sidebar is not dimmed for a refresh.

**Height.** The page scrolls inside the shell, which is as tall as the window unless `--ui-shell-height` says otherwise. A new path opens the page at its top; a new hash, a section of the same page, keeps the place.

### Keyboard

The first stop is a skip link, shown only while focused. Then come the link home, the collapse button and the places, each a link.
- `Enter`: on the skip link, puts the focus on the page.
- `Ctrl+B` `Meta+B`: Ctrl or ⌘ B collapses the sidebar, or opens and closes the sheet while the shell is narrow; not while typing in a text field or an editor, not under a window or a panel, and a held key toggles once.
In the sheet, where the focus moves in:
- `Tab`: stays inside.
- `Escape`: closes it, as the backdrop does, and the focus returns to the menu button.
Collapsing from the link home or from `#banner` hands the focus to the collapse button, so it is never dropped.

### Screen reader

- Skip link: comes first.
- Sidebar: a navigation landmark, and the sheet a modal dialog of the same name.
- Group: its heading names its list, open and collapsed.
- Current place: `aria-current="page"`.
- Collapsed row: named by its label and its count; the count on the icon's corner is a mark the reader skips.
- Buttons: the collapse and menu buttons say what they open (`aria-expanded`, `aria-controls`).
- Logo: a link named by the brand and "home".
- Loading: a status region, always there, says "Loading…" while the places come; the navigation is busy (`aria-busy`), so the sheet opened meanwhile says it too; the rows in their shape are hidden.

### States

Desktop open; desktop collapsed to icons, each named by a tooltip, with `#banner` gone; narrow, with the sheet closed or open, showing the full sidebar even when the desktop one is collapsed; loading, open and collapsed, with rows in the places' shape. On a row: hover, focus, and the current place, which takes the highlight under forced colors. In dev, a missing `current` and a collapsed head with no way home warn.

### When to use another component

- A set of panes on one screen: UiTabs.
- A window or a panel over the page: UiModal or UiDrawer.
- The name of the page inside the main area: UiHeader `page`.
- Places inside a section of a page: UiListItem links in a UiList.

## Examples

### Collapsed

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BarChart3, Inbox, LifeBuoy, ReceiptText, Settings, Users } from '@lucide/vue'
import type { NavGroup } from 'grani-ui'
import { UiAppShell, UiHeader, useToday } from 'grani-ui'

// The app's wordmark: the name the home link is read by is the word the logo shows.
const brand = 'grani'

// The places are anchors on this page: the one pressed is the current one, and on arrival the
// page's hash. An app passes its route's path instead. A server never sees a hash: it is read once
// the page is in the browser.
const current = ref('#overview')

const follow = (e: MouseEvent) => {
  const to = (e.target as Element).closest('a[href^="#"]')?.getAttribute('href')
  if (to) current.value = to
}

// Sample figures, new each day: read from today's date in the browser, so the server's page and the
// client's agree, and a page photographed on a fixed day is the same every time.
const goal = ref<{ percent: number; left: string; days: number; perDay: string } | null>(null)

const amount = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))

const { now } = useToday()

onMounted(() => {
  if (location.hash) current.value = location.hash
  const day = Number(now.value.replaceAll('-', ''))
  const target = 10000
  const earned = 500 + ((day * 7919) % 9000)
  const days = 1 + ((day * 104729) % 27)
  goal.value = {
    percent: Math.round((earned / target) * 100),
    left: amount(target - earned),
    days,
    perDay: amount((target - earned) / days),
  }
})

const nav: NavGroup[] = [
  {
    items: [
      { to: '#overview', label: 'Overview', icon: BarChart3 },
      { to: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
      { to: '#invoices', label: 'Invoices', icon: ReceiptText },
      { to: '#clients', label: 'Clients and their contracts, by region', icon: Users },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '#settings', label: 'Settings', icon: Settings },
      { to: '#help', label: 'Help', icon: LifeBuoy },
    ],
  },
]

// Collapsed on the server and in the browser alike: the first paint and the page agree.
const collapsed = ref(true)

const title = computed(
  () => nav.flatMap((g) => g.items).find((i) => i.to === current.value)?.label ?? 'Overview',
)
</script>

<template>
  <UiAppShell
    v-model:collapsed="collapsed"
    :brand="brand"
    home="#overview"
    :current="current"
    :nav="nav"
    class="w-full rounded-card border border-border [--ui-shell-height:480px]"
    @click="follow"
  >
    <UiHeader
      :title="title"
      description="Only the icons: each is named in a tooltip. Keeping the state across visits is the app's."
    />
    <template #mark
      ><span aria-hidden="true" class="m-1 size-3 shrink-0 rotate-45 bg-brand-solid"
    /></template>
  </UiAppShell>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BarChart3, Inbox, LifeBuoy, ReceiptText, Settings, Users } from '@lucide/vue'
import type { NavGroup } from 'grani-ui'
import { UiAppShell, UiHeader, UiRadioGroup, UiRadio, useToday } from 'grani-ui'

// The app's wordmark: the name the home link is read by is the word the logo shows.
const brand = 'grani'

// The places are anchors on this page: the one pressed is the current one, and on arrival the
// page's hash. An app passes its route's path instead. A server never sees a hash: it is read once
// the page is in the browser.
const current = ref('#overview')

const follow = (e: MouseEvent) => {
  const to = (e.target as Element).closest('a[href^="#"]')?.getAttribute('href')
  if (to) current.value = to
}

// Sample figures, new each day: read from today's date in the browser, so the server's page and the
// client's agree, and a page photographed on a fixed day is the same every time.
const goal = ref<{ percent: number; left: string; days: number; perDay: string } | null>(null)

const amount = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))

const { now } = useToday()

onMounted(() => {
  if (location.hash) current.value = location.hash
  const day = Number(now.value.replaceAll('-', ''))
  const target = 10000
  const earned = 500 + ((day * 7919) % 9000)
  const days = 1 + ((day * 104729) % 27)
  goal.value = {
    percent: Math.round((earned / target) * 100),
    left: amount(target - earned),
    days,
    perDay: amount((target - earned) / days),
  }
})

const nav: NavGroup[] = [
  {
    items: [
      { to: '#overview', label: 'Overview', icon: BarChart3 },
      { to: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
      { to: '#invoices', label: 'Invoices', icon: ReceiptText },
      { to: '#clients', label: 'Clients and their contracts, by region', icon: Users },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '#settings', label: 'Settings', icon: Settings },
      { to: '#help', label: 'Help', icon: LifeBuoy },
    ],
  },
]

// The places on their way, switched by hand: the app has asked for them and has nothing yet.
const placesState = ref('loading')

const loadingNav = computed<NavGroup[]>(() => (placesState.value === 'loading' ? [] : nav))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiAppShell
      :brand="brand"
      home="#overview"
      :current="current"
      :nav="loadingNav"
      :loading="placesState === 'loading'"
      class="w-full rounded-card border border-border [--ui-shell-height:420px]"
      @click="follow"
    >
      <UiHeader title="Overview" description="The places come from the server a moment later." />
    </UiAppShell>
    <UiRadioGroup v-model="placesState" variant="segmented" aria-label="State of the places">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Narrow

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BarChart3, Inbox, LifeBuoy, ReceiptText, Settings, Users } from '@lucide/vue'
import type { NavGroup } from 'grani-ui'
import { UiAppShell, UiStack, UiHeader, UiCard, useToday } from 'grani-ui'

// The app's wordmark: the name the home link is read by is the word the logo shows.
const brand = 'grani'

// The places are anchors on this page: the one pressed is the current one, and on arrival the
// page's hash. An app passes its route's path instead. A server never sees a hash: it is read once
// the page is in the browser.
const current = ref('#overview')

const follow = (e: MouseEvent) => {
  const to = (e.target as Element).closest('a[href^="#"]')?.getAttribute('href')
  if (to) current.value = to
}

// Sample figures, new each day: read from today's date in the browser, so the server's page and the
// client's agree, and a page photographed on a fixed day is the same every time.
const goal = ref<{ percent: number; left: string; days: number; perDay: string } | null>(null)

const amount = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))

const { now } = useToday()

onMounted(() => {
  if (location.hash) current.value = location.hash
  const day = Number(now.value.replaceAll('-', ''))
  const target = 10000
  const earned = 500 + ((day * 7919) % 9000)
  const days = 1 + ((day * 104729) % 27)
  goal.value = {
    percent: Math.round((earned / target) * 100),
    left: amount(target - earned),
    days,
    perDay: amount((target - earned) / days),
  }
})

const nav: NavGroup[] = [
  {
    items: [
      { to: '#overview', label: 'Overview', icon: BarChart3 },
      { to: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
      { to: '#invoices', label: 'Invoices', icon: ReceiptText },
      { to: '#clients', label: 'Clients and their contracts, by region', icon: Users },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '#settings', label: 'Settings', icon: Settings },
      { to: '#help', label: 'Help', icon: LifeBuoy },
    ],
  },
]

const title = computed(
  () => nav.flatMap((g) => g.items).find((i) => i.to === current.value)?.label ?? 'Overview',
)
</script>

<template>
  <UiAppShell
    :brand="brand"
    home="#overview"
    :current="current"
    :nav="nav"
    class="w-[360px] max-w-full rounded-card border border-border [--ui-shell-height:560px]"
    @click="follow"
  >
    <UiStack gap="title">
      <UiHeader :title="title" />
      <UiStack>
        <UiCard v-for="n in 3" :key="n" :title="`Block ${n}`">
          <div class="h-16 rounded-control bg-surface-muted" />
        </UiCard>
      </UiStack>
    </UiStack>
  </UiAppShell>
</template>

```

## API

Props:
- `nav`: `NavGroup[]` (required) — The places of the app, in groups; an empty `label` draws none.
- `brand`: `string` (default `""`) — The app's name: the logo when `#logo` is not given, and the name of the link home; unset, a translated "App".
- `home`: `string` (default `"/"`) — Where the logo leads; the item on it is the current page only on it, not under it. A `javascript:` or `data:` address is refused, as for the places.
- `current`: `string` (default `""`) — The path of the page shown (`useRoute().path`): it lights its item and closes the sheet.
- `collapsed`: `boolean` — Desktop: only the icons show. Bound to a value, the shell follows it and only asks through `update:collapsed`; unbound or `undefined`, it keeps its own.
- `loading`: `boolean` (default `false`) — The places are on their way: with `nav` still empty, the sidebar draws rows in their shape.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `update:collapsed` (`value: boolean`) — The sidebar was collapsed or opened out: its button or Ctrl or ⌘ B.

Slots:
- `logo` with `Record<string, never>` — The logo in the sidebar's head and in the narrow bar: a mark and the name.
- `mark` with `Record<string, never>` — The mark alone, for the collapsed sidebar: a 24px glyph or image, over the button. Without it the collapsed head holds the button alone.
- `banner` with `Record<string, never>` — A band under a line at the foot of the sidebar: a goal with its bar, a notice. Its words stand on the places' icons. The collapsed sidebar has no room for it.
- `footer` with `{ collapsed: boolean; }` — The foot of the sidebar: the person signed in, a switch of theme.
- `default` with `Record<string, never>` — The page.

## How it behaves

### Stable dimensions

- When: the navigation items arrive from the server after the shell is drawn.
- Props: `loading`.
- Guarantee: While the navigation loads, the sidebar draws five placeholder rows in the shape of its places, with the logo and the footer already in place. When the places arrive they take the rows’ place.
- Without it: The sidebar is an empty column with nothing to show that places are coming, and the rows appear all at once when the items arrive.
- Code: `<UiAppShell :nav="places ?? []" :loading="!places" :current="route.path">…</UiAppShell>`
- Your part: Pass `loading` with an empty `nav` until the items arrive.
- Not covered: Vertical positions match the placeholders only for a single navigation group without a heading. Additional groups or headings can move rows when they arrive.
- Proof, in the repository's tests (UiAppShell.spec.ts, not in the package): "places on their way draw five rows in their shape, keep the footer, and say so once"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Shortcut keys

- When: you collapse the sidebar, or open it as a panel on a narrow screen, from the keyboard.
- Props: none: every UiAppShell.
- Guarantee: Ctrl or ⌘ B collapses and expands the sidebar, or opens and closes it as a panel on a narrow screen. It does nothing while you type in a field or an editor, or while a window or a panel is open above the shell, and a held key toggles once. On a Latin layout it is the key that types B; on another alphabet, the key in B's place.
- Without it: The sidebar can be folded only by aiming at its small button.
- Code: `<UiAppShell v-model:collapsed="collapsed" :nav="nav" :current="route.path" />`
- Your part: List the shortcut wherever your app lists its keys.
- Not covered: With two shells on one page, the shortcut goes to the one that holds keyboard focus, or else to the first one. In Firefox, Ctrl or ⌘ B also opens the bookmarks sidebar: where the shell acts on the key, held as well, it takes the key from the browser; in a text field, under a window or a panel, the browser keeps it.
- Proof, in the repository's tests (UiAppShell.spec.ts, not in the package): "Ctrl or ⌘ B toggles the collapse, but not while typing in a field", "Ctrl or ⌘ B is refused in any editable text, not only contenteditable="true"", "Ctrl or ⌘ B does nothing while a window is open above the shell", "a held Ctrl or ⌘ B toggles once", "a held Ctrl or ⌘ B is taken from the browser on every repeat, and toggles once", "Ctrl or ⌘ B works on a non-Latin layout", "Ctrl or ⌘ B follows the typed letter on a Latin layout", "narrow: Ctrl or ⌘ B opens and closes the sheet", "two shells: Ctrl or ⌘ B reaches the one the focus is in, else only the first"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#keyboard-actions

### Focus comes back

- When: the navigation sheet of a narrow layout closes.
- Props: none: every UiAppShell under 768px wide.
- Guarantee: Escape or a press on the backdrop closes the sheet, and keyboard focus returns to the menu button that opened it.
- Without it: The sheet closes with keyboard focus inside it: focus falls to the page, and a screen reader loses its place.
- Code: `<UiAppShell :nav="nav" :current="route.path">…</UiAppShell>`
- Your part: Nothing.
- Proof, in the repository's tests (UiAppShell.spec.ts, not in the package): "Escape closes the sheet and the focus returns to the menu button that opened it.", "A press on the backdrop closes the sheet, and the focus returns to the menu button too."
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-back

### Focus stays near

- When: The sidebar collapses, for example with Ctrl or ⌘ B, while keyboard focus is on the logo link or inside `#banner`.
- Props: none: every UiAppShell.
- Guarantee: When the logo link or a banner disappears while it has keyboard focus, focus moves to the collapse button, which remains available in the narrow sidebar, so you can continue from there.
- Without it: The banner closes with keyboard focus inside it, focus is lost, and you have to find the sidebar again.
- Code: `<UiAppShell :nav="nav" :current="route.path">
  <template #banner>…</template>
</UiAppShell>`
- Your part: Nothing.
- Proof, in the repository's tests (UiAppShell.spec.ts, not in the package): "Ctrl or ⌘ B with the focus on the logo hands the focus to the button", "collapsing with the focus inside #banner hands it to the toggle"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
