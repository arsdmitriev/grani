# grani

Interaction patterns for admin apps, and the Vue 3 components that keep them. Screens built with
grani behave alike:

- the focus comes back where it was;
- a late answer never replaces a newer search;
- typed text that failed to add comes back to its field.

Most of these patterns are proved by a test. All of them ship in `node_modules` with the installed
version, where a coding agent reads them before writing UI.

The components are styled with Tailwind CSS 4 and cover tables, forms, records and charts. They are
typed and tree-shaken, render on a server and hydrate in the browser, in English and Russian.

Showcase and live demo: https://grani.arseni.work

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/arsdmitriev/grani/main/.github/readme/home-dark.png">
  <img src="https://raw.githubusercontent.com/arsdmitriev/grani/main/.github/readme/home-light.png" alt="The grani showcase: the title, a Browse button and a table of invoices drawn with grani" width="1280">
</picture>

An app needs:

- Vue 3.5.2 or later.
- Tailwind CSS 4.1.0 or later; on Vite 8, Tailwind's Vite plugin 4.2.2 or later.
- A browser Tailwind 4 runs in: Chrome 111, Safari 16.4, Firefox 128 or later.
- Node 20.19 or later, to load it on a server.
- Vite, which the release check builds an app with on every release; other bundlers are not tested.

## What's inside

Every component below is stable: it passed the checks and a review by eye of its behavior, its
example and its code. A component added later may start as experimental, marked on its card in the
showcase and on its page in `llms/`: its API or behavior may still change in a 0.x minor, and the
CHANGELOG says how to move.

| Family   | Components                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data     | UiAvatar, UiDataTable, UiFilter, UiFilterList, UiLog, UiPagination, UiTable, UiTableColumns, UiTableToolbar                                                |
| Charts   | UiAreaChart, UiBarChart, UiChartCard, UiDelta, UiDonutChart, UiSparkline                                                                                   |
| Form     | UiCheckbox, UiCodeInput, UiDropzone, UiField, UiInput, UiListField, UiPasswordField, UiRadioGroup, UiScaleInput, UiSelect, UiStepper, UiSwitch, UiTextarea |
| Dates    | UiCalendar, UiDatePicker, UiDateRange, UiTimePicker                                                                                                        |
| Actions  | UiButton, UiButtonGroup, UiCopyButton, UiIconButton, UiLink                                                                                                |
| Overlays | UiConfirm, UiCrudDrawer, UiDrawer, UiMenu, UiModal, UiPopover, UiToaster, UiTooltip                                                                        |
| Layout   | UiAppShell, UiAspectRatio, UiCard, UiHeader, UiList, UiListItem, UiReveal, UiSeparator, UiStack, UiTabs, UiTruncate                                        |
| Status   | UiBadge, UiCount, UiIndicator, UiNoData, UiProgress, UiSkeleton, UiSpinner                                                                                 |

Three parts come with their whole and are imported beside it: UiDateCell and UiMoneyCell, the
cells of UiTable, and UiRadio, an option of UiRadioGroup.

An app pays for what it imports. Measured for 0.1.0 in a Vite 8 production build, against
the same app with Vue alone, gzipped at level 9: the plugin adds about 7 kB, a button about 9 kB
more, and UiDataTable with everything it stands on about 56 kB. The stylesheet is about 19 kB
gzipped with every component, or 9 kB for a button and a field with
[`grani-ui/theme.css`](docs/guides/styles.md) on Tailwind 4.3. The button's and the table's figures
come on top of the plugin's, which every app installs: a page with `createGrani()` and one button
is about 16 kB over Vue alone. A button off with a reason loads its hint, about 5 kB more, the
first time one is shown.

## Use

### Install

Install the package, then add the plugin and the styles once:

```bash
npm i grani-ui
```

```ts
// main.ts
import { createApp } from 'vue'
import { createGrani } from 'grani-ui'
import App from './App.vue'
import './style.css'

createApp(App).use(createGrani()).mount('#app')
```

```css
/* your app's style.css */
@import 'tailwindcss';
@import 'grani-ui/style.css';
```

In a new Vite app these lines take the place of everything in the template's `src/style.css`: its
demo rules (a fixed `#app` width, centered text, its own type sizes) would frame your pages.
The page's `<body>` takes the theme's colors, `class="bg-bg text-fg"`: without them a dark page
stays white while grani's labels turn light. [Dark mode](docs/guides/dark-mode.md) has the rest.

No Tailwind in the app yet: `npm i -D tailwindcss @tailwindcss/vite`, and its plugin beside Vue's in
`vite.config.ts`. The examples pass icons from Lucide (`:icon="Pencil"`, `<Plus />` in a slot): to
pass your own, `npm i @lucide/vue` in the app. Yarn Plug'n'Play, Tailwind's `prefix()` and the
Tailwind CLI each need a word first: [Install](docs/guides/install.md).

### First form

A first form, with the result reported in a toast:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiField, UiInput, UiToaster, useToast } from 'grani-ui'

const name = ref('')
const toast = useToast()
function save() {
  toast.success(`${name.value} saved`)
}
</script>

<template>
  <form class="flex flex-col gap-4 p-4" @submit.prevent="save">
    <UiField label="Client name"><UiInput v-model="name" /></UiField>
    <UiButton type="submit" :disabled="!name.trim()">Save</UiButton>
  </form>
  <UiToaster />
</template>
```

`UiToaster` shows the toasts and `UiConfirm` asks the questions of `useConfirm()`: mount each once,
near the root of the app. Without its host a toast shows nowhere, and in development the browser's
console says which one is missing.

### First table

A list the app fetches page by page; the table asks for a page, a sort and a search, the app answers:

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { UiDataTable, type DataTableColumn, type TableSort } from 'grani-ui'

type Invoice = { id: number; client: string; total: number; due: string }
const columns: DataTableColumn<Invoice>[] = [
  { key: 'client', label: 'Client', sortable: true },
  { key: 'total', label: 'Total', type: 'money', currency: 'EUR' },
  { key: 'due', label: 'Due', type: 'date' },
]
const rows = ref<Invoice[]>([])
// Unset until the first answer: a 0 would send a linked page back to one.
const total = ref<number>()
const page = ref(1)
// One page size for the request and the table: a backend with its own would be counted wrong.
const pageSize = 25
const sort = ref<TableSort>(null)
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
// Retry asks again: the effect reads it, so a press runs the request once more.
const tries = ref(0)
// The last query wins: an answer to an older one, late, is dropped.
let asked = 0
watchEffect(async () => {
  void tries.value
  const mine = ++asked
  loading.value = true
  error.value = null
  try {
    // fetchInvoices is the app's own request.
    const r = await fetchInvoices({
      page: page.value,
      pageSize,
      sort: sort.value,
      search: search.value,
    })
    if (mine === asked) [rows.value, total.value] = [r.rows, r.total]
  } catch {
    if (mine === asked) error.value = 'The invoices did not load.'
  } finally {
    if (mine === asked) loading.value = false
  }
})
</script>

<template>
  <UiDataTable
    v-model:page="page"
    v-model:sort="sort"
    v-model:search="search"
    :columns="columns"
    :items="rows"
    :total="total"
    :page-size="pageSize"
    :loading="loading"
    :error="error"
    aria-label="Invoices"
    @retry="tries++"
  />
</template>
```

Components come from `grani-ui`, or through `GraniResolver` from `grani-ui/resolver` for
`unplugin-vue-components`. The entry points are `grani-ui`, `grani-ui/resolver`, `grani-ui/i18n`,
`grani-ui/test`, `grani-ui/style.css`, `grani-ui/theme.css`, `grani-ui/base.css` and
`grani-ui/classes/<Name>.css`; a deep import of a file inside the package is not one, and may break in
any version. Every component, with its API and a live example:
https://grani.arseni.work/components.

## Guides

The same pages ship in the package, in `node_modules/grani-ui/docs/guides`:

- [Install](docs/guides/install.md): Yarn Plug'n'Play, Tailwind's `prefix()`, the Tailwind CLI, removing grani.
- [Styles](docs/guides/styles.md): `grani-ui/style.css`, `grani-ui/theme.css` with a file per component, `grani-ui/base.css`, the font, the focus ring.
- [Brand](docs/guides/brand.md): the eight `--color-brand*` variables, corners, gutters, the contrast check.
- [Settings](docs/guides/settings.md): `createGrani` options, two apps on one page, copies of grani, links.
- [Translations](docs/guides/translations.md): `translate`, vue-i18n, the Russian dictionary, a dictionary of your own.
- [Dark mode](docs/guides/dark-mode.md) and [Server rendering](docs/guides/server-rendering.md).
- [Types](docs/guides/types.md).

## For AI agents

grani ships its own reference for coding agents: `node_modules/grani-ui/llms.txt`, written from the
version you installed. It is a map small enough to read whole, and beside it a page per component
(its API and a whole example) and a chapter per set of patterns, so an agent picks components and
follows their contracts without reading the sources.

Add one line to the file your agent reads, `AGENTS.md`, `CLAUDE.md` or your editor's rules:

```text
This project uses grani for its interface. Before writing UI, read
node_modules/grani-ui/llms.txt: pick components from its catalog and
follow their contracts.
```

For a chat without your project, the site has the same texts:

- [llms.txt](https://grani.arseni.work/llms.txt): the map, with the catalog, the tasks and the guides
- [llms-full.txt](https://grani.arseni.work/llms-full.txt): everything in one file
- a component's or a guide's page as Markdown: its address plus `.md`, such as
  [data-table.md](https://grani.arseni.work/components/data-table.md)
- a chapter of the patterns alone, such as [filling-in.md](https://grani.arseni.work/patterns/filling-in.md)

To check that your own screens keep the patterns, `grani-ui/test` gives your Playwright suite five
checks: focus on open, focus back on close, focus on the field to fix, a late search answer dropped,
rows kept while a refresh loads. A failure names the pattern and the file of
`node_modules/grani-ui/llms/patterns/` that explains it. The checks, with an example, are in
`node_modules/grani-ui/llms/patterns/tests.md`.

Each component's page has Copy page beside its title: it copies the page as Markdown, and its menu
opens the page in Claude or ChatGPT.

## About

grani is open source, not open contribution: the code is MIT, yours to read, fork and ship, and I
write it alone. I build it for my own products first, so it changes when they need it to.

A bug report is welcome in the issues, with the steps that show it; I read every one, with no
promise of an answer or a date. Pull requests are not merged: a fix lands in the source repository,
with a test.

### What you can count on

- A security problem reported privately is fixed in the latest version, with a test that fails
  without the fix.
- Versions follow semver: a break comes in a major (before 1.0, in a minor), and its CHANGELOG
  section says how to move.
- Every version passes the same checks before it is published: the specs, and the date specs again
  in two more time zones, a server render, three browsers, a contrast check and a clean install of
  the packed archive.
- Published versions stay on npm. If I stop, you keep everything: the sources, the tests, the texts
  for agents, under MIT.

By Arseni Dmitriev, https://arseni.work. Source: https://github.com/arsdmitriev/grani.

## Develop

To work on grani itself, in a clone of this repository: the package in `node_modules` holds the
build, not these scripts. The tooling needs Node 22.18 or later: it runs TypeScript directly.

```bash
npm ci
npm run gates       # the three below, the specs shuffled, the public names and the contrast
npm test            # the specs, the axe check of every demo, the server render
npm run typecheck   # the package, its type tests and the demos
npm run build       # dist: JavaScript and a declaration per module
npm run example     # examples/vite, the README's way in as an app, on :3021
```

This repository holds the released versions of grani, one commit each. The documentation and the
live examples are at https://grani.arseni.work.

## License

MIT. The Golos Text font in `assets/fonts` is under the SIL Open Font License, `assets/fonts/OFL.txt`.
Security reports: see https://github.com/arsdmitriev/grani/blob/main/.github/SECURITY.md.
