# Card (`UiCard`)

> Group one part of a page into a card with a title, content and an optional footer.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/card

Also called panel, section card.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCard, UiButton } from 'grani-ui'
</script>

<template>
  <UiCard title="Billing" class="w-full max-w-md">
    <p class="text-sm text-fg">
      You are on the Pro plan, €24 a month for up to 10 people. The next invoice goes out on 1
      October 2026 and is paid by the card ending 4242.
    </p>
    <template #footer>
      <span class="me-auto text-xs text-fg-muted">Renews 1 Oct</span>
      <UiButton variant="secondary">Invoices</UiButton>
      <UiButton>Change plan</UiButton>
    </template>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See where the app is working.
- Keep nearby content in place while loading.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Bind `loading` to the request; the wording comes from the library. Over `#empty` the card adds nothing: give its Retry `loading`, which shows the wait on the button and refuses a second press.
- Bind `loading` to the request. A body with its own layout, such as a table or a chart, draws its own placeholders.

## Why it works this way

A surface with an optional header, body and footer, each filled by you. Take it to group related content on a page.

**Header.** The header is a title with a description, with `#media` before it and `#actions` beside it (centered on the title and its line), or a whole `#header` (a tab strip, a toolbar) running edge to edge. A line stands under the header by default; `:divided="false"` drops it. A body that opens with a UiHeader legend gets no line, since the legend is the line.

**Body.** The body is padded, or runs edge to edge without `padded` (rows, a table, an image). `align="center"` puts its content in the middle (a 404), and `empty` puts `#empty` there.

**Image.** `#image` puts media at the `top`, `bottom`, `start` or `end`, edge to edge. A side image stands above or below the body when the card is under 384px wide, at the media's own height; a card with a side image takes its parent's width.

**Footer.** The footer stands under a line, with its actions at the end, plain or `muted`. A full-width action alone in it (`block`) stands on the body's gutter, lined up with the fields above. `#divider` takes the place of that line (a progress bar). Without `footerPadded`, the footer's children run edge to edge and share the width (split buttons, tabs).

**Gutter.** The card passes its gutter (16, or 24 at `md`) to what is inside, so a UiList of rows or a separator lines up with the title. A body that ends in a UiList drops its bottom gutter, so the last row stands on its own inset as the rows above it do. A section of a drawer runs a UiList that is its first or last child to its line.

**Plain.** `variant="plain"` drops the frame: the three parts alone, 16 apart, with no line under the header unless `divided`. The footer keeps its own line.

**Overlays.** In the body of a drawer or a popover, a card is a flat section (no frame, no padding), with a UiSeparator the overlay places between sections. A window frames its cards.

**Title.** The title is the card's one heading, and its level follows the nesting. A long word in the title breaks inside its column, beside the action.

**Hosts.** UiChartCard, UiDataTable and UiListField are built on it; UiFilter and UiCrudDrawer take cards as their sections.

**Status.** `tone` colors the frame of a card in trouble, and a badge in `#actions` says it in words; a toned card with neither `#actions` nor `#header` warns in development. `disabled` mutes the words and makes the card a disabled group. `loading` and `empty` stand in for the body.

### Keyboard

Not interactive: the frame takes no focus.
- `Tab`: reaches the controls you put in `#actions`, `#header`, the body and `#footer`, which keep their own tab stops, in the order they stand.
A tab in a whole `#header` and a button in an edge-to-edge footer ring inward, inside the frame.
A focused linked image in `#image` rings the card, not itself. While the card loads, `#empty` stays, so a focus on its Retry stays too; when the content takes its place, the focus goes to the card, never to the page.

### Screen reader

- Title: a heading whose level follows the nesting: `h2` on a page, `h3` in a card; the description follows it.
- Loading: `loading` marks the card `aria-busy`, and a live region says it is loading, or updating when there is content. Bind `loading` where the card loads, so the region is in place before the words.
- Disabled: `disabled` makes the card a group named by its title, `aria-disabled`.
- Whole header: a whole `#header` replaces the title and names nothing inside.
- Tone: `tone` colors the frame only: the words are a badge in `#actions`.

### States

Rest; `loading` on a first load, a skeleton of three lines; `loading` over content, the content kept and not mounted again, dimmed to 60% with the title, the card's own controls not, and one spinner in the card's middle; `empty`, with `#empty` in the middle (a first load's skeleton wins over it, a later load leaves it as it is); `disabled`, muted words on a muted surface; `tone` `danger` or `warning` on the frame; `plain`, no frame; a flat section inside an overlay. A side image stands above the body when the card is under 384px wide.

### When to use another component

- A list screen with a toolbar and pages: UiDataTable.
- A chart with its figure: UiChartCard.
- One row of text with a thing at its end: UiListItem.
- A choice among cards: UiRadioGroup `card`.
- A notice with an action: UiListItem in a `tone`.

## Examples

### Edge to edge

```vue
<script setup lang="ts">
import { Plus } from '@lucide/vue'
import type { TableColumn } from 'grani-ui'
import { UiCard, UiButton, UiTable } from 'grani-ui'

interface Invoice {
  id: string
  client: string
  total: string
}

const columns: TableColumn<Invoice>[] = [
  { key: 'id', label: 'Invoice' },
  { key: 'client', label: 'Client' },
  { key: 'total', label: 'Total', align: 'end' },
]

const invoices: Invoice[] = [
  { id: 'INV-0042', client: 'Acme Corp', total: '€1 240.00' },
  { id: 'INV-0041', client: 'Birch & Co', total: '€380.00' },
  { id: 'INV-0040', client: 'Cedar Ltd', total: '€2 115.50' },
]
</script>

<template>
  <UiCard :padded="false" size="md" title="Invoices" class="w-full">
    <template #actions>
      <UiButton variant="outline"><Plus />New</UiButton>
    </template>
    <UiTable :columns="columns" :items="invoices" row-key="id" />
  </UiCard>
</template>

```

### Image

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiCard, UiAspectRatio, UiRadioGroup, UiRadio } from 'grani-ui'

const photo = '/lighthouse.webp' // your own picture here

const imageAt = ref<'top' | 'bottom' | 'start' | 'end'>('top')
</script>

<template>
  <UiStack gap="title" align="center" class="w-full">
    <UiCard
      title="The coast walk"
      description="Four hours, one lighthouse."
      :image-position="imageAt"
      :divided="false"
      class="w-full max-w-lg"
    >
      <template #image>
        <UiAspectRatio class="bg-neutral-subtle">
          <img :src="photo" alt="A red and white lighthouse over turquoise water" />
        </UiAspectRatio>
      </template>
      <p class="text-sm text-fg-muted">
        Start at the car park, keep the sea on your left, turn back at the lighthouse.
      </p>
    </UiCard>
    <UiRadioGroup v-model="imageAt" variant="segmented" aria-label="Where the image stands">
      <UiRadio value="top">Top</UiRadio>
      <UiRadio value="bottom">Bottom</UiRadio>
      <UiRadio value="start">Start</UiRadio>
      <UiRadio value="end">End</UiRadio>
    </UiRadioGroup>
  </UiStack>
</template>

```

### Plain

```vue
<script setup lang="ts">
import { UiCard, UiButton } from 'grani-ui'
</script>

<template>
  <UiCard
    variant="plain"
    title="Notifications"
    description="What reaches you, and where."
    class="w-full max-w-sm"
  >
    <p class="text-sm text-fg-muted">
      A plain card has no frame: the three parts alone, 16 apart.
    </p>
    <template #footer>
      <UiButton variant="secondary">Cancel</UiButton>
      <UiButton>Save</UiButton>
    </template>
  </UiCard>
</template>

```

### Tone

```vue
<script setup lang="ts">
import { UiCard, UiBadge, UiButton } from 'grani-ui'
</script>

<template>
  <UiCard title="Bank feed" tone="danger" class="w-full max-w-xs">
    <template #actions><UiBadge tone="danger" label="Failed" /></template>
    <p class="text-sm text-fg-muted">The bank refused the last sync. Sign in again to resume.</p>
    <template #footer>
      <UiButton variant="outline">Reconnect</UiButton>
    </template>
  </UiCard>
  <UiCard title="Card on file" tone="warning" class="w-full max-w-xs">
    <template #actions><UiBadge tone="warning" label="Expires soon" /></template>
    <p class="text-sm text-fg-muted">The card ending 4242 expires at the end of October.</p>
    <template #footer>
      <UiButton variant="outline">Update card</UiButton>
    </template>
  </UiCard>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiCard, UiButton } from 'grani-ui'
</script>

<template>
  <UiCard title="Bank feed" disabled class="w-full max-w-sm">
    <p class="text-sm">Syncing is paused while the account is on hold.</p>
    <template #footer>
      <UiButton variant="outline" disabled>Sync now</UiButton>
    </template>
  </UiCard>
</template>

```

### Long

```vue
<script setup lang="ts">
import { UiCard, UiButton } from 'grani-ui'
</script>

<template>
  <UiCard
    title="INV-0042-acme-corporation-quarterly-statement-final-v2"
    description="Sent 12 Sep to accounts-payable@acme-corporation.example.com"
    class="w-full max-w-xs"
  >
    <template #actions><UiButton variant="outline">Open</UiButton></template>
    <p class="text-sm text-fg-muted">
      A word with no space breaks inside its column, beside the action.
    </p>
  </UiCard>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Inbox } from '@lucide/vue'
import { UiCard, UiNoData, UiButton, UiRadioGroup, UiRadio } from 'grani-ui'

const cardState = ref('loading')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiCard
      title="Invoices"
      :loading="cardState === 'loading' || cardState === 'refreshing'"
      :empty="cardState === 'empty'"
      class="w-full max-w-sm"
    >
      <p v-if="cardState !== 'loading'" class="text-sm text-fg-muted">
        Three invoices wait for payment, €3 735.50 in all.
      </p>
      <template #empty>
        <UiNoData
          title="No invoices yet"
          description="The first one appears here once it is sent."
        >
          <template #media><Inbox /></template>
          <template #actions>
            <UiButton>New invoice</UiButton>
          </template>
        </UiNoData>
      </template>
    </UiCard>
    <UiRadioGroup v-model="cardState" variant="segmented" aria-label="State of the card">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="refreshing">Updating</UiRadio>
      <UiRadio value="empty">Empty</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Divider

```vue
<script setup lang="ts">
import { UiCard, UiProgress } from 'grani-ui'
</script>

<template>
  <UiCard title="Savings · Emergency fund" :divided="false" class="w-full max-w-xs">
    <div class="flex items-center justify-between gap-4 tabular-nums">
      <p>
        <span class="text-3xl font-semibold text-fg">€4 500</span>
        <span class="text-lg text-fg-muted"> / €6 000</span>
      </p>
      <span class="font-semibold text-fg-muted">75%</span>
    </div>
    <UiProgress
      :value="4500"
      :max="6000"
      variant="thermometer"
      aria-label="Emergency fund"
      value-text="€4 500 of €6 000"
      class="mt-4 h-2 w-full"
    />
    <template #footer>
      <span class="me-auto text-sm text-fg-muted">
        Left <b class="font-semibold tabular-nums text-fg">€1 500</b>
      </span>
      <span class="text-sm text-fg-muted">≈ 5 months</span>
    </template>
  </UiCard>
  <UiCard title="Reading · 2026" :divided="false" class="w-full max-w-xs">
    <div class="flex items-center justify-between gap-4 tabular-nums">
      <p>
        <span class="text-3xl font-semibold text-fg">18</span>
        <span class="text-lg text-fg-muted"> / 40 books</span>
      </p>
      <span class="font-semibold text-fg-muted">45%</span>
    </div>
    <template #divider>
      <UiProgress
        :value="18"
        :max="40"
        aria-label="Reading goal"
        value-text="18 of 40 books"
        class="h-1"
      />
    </template>
    <template #footer>
      <span class="me-auto text-sm text-fg-muted">
        Left <b class="font-semibold tabular-nums text-fg">22 books</b>
      </span>
      <span class="text-sm text-fg-muted">≈ 5 months</span>
    </template>
  </UiCard>
</template>

```

### Header

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiTabs } from 'grani-ui'

const tab = ref('overview')
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <template #header>
      <UiTabs
        v-model="tab"
        ariaLabel="Client"
        :tabs="[
          { value: 'overview', label: 'Overview' },
          { value: 'payments', label: 'Payments' },
          { value: 'notes', label: 'Notes' },
        ]"
      >
        <template #overview
          ><p class="p-surface text-sm text-fg-muted">The overview of the client.</p></template
        >
        <template #payments
          ><p class="p-surface text-sm text-fg-muted">3 payments this month.</p></template
        >
        <template #notes><p class="p-surface text-sm text-fg-muted">Pays late.</p></template>
      </UiTabs>
    </template>
  </UiCard>
</template>

```

### Footer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Heart, MessageSquare, Paperclip } from '@lucide/vue'
import { UiCard, UiLink, UiSwitch } from 'grani-ui'

const digest = ref(true)
</script>

<template>
  <div class="grid w-full gap-4">
    <UiCard title="Weekly digest" footer-variant="muted">
      <p class="text-sm text-fg-muted">
        {{
          digest
            ? 'Every Monday at 9:00 you get the invoices due that week and the ones that are late.'
            : 'Off: nobody gets the Monday summary of due and late invoices.'
        }}
      </p>
      <template #footer>
        <UiLink to="/components/link" class="me-auto text-sm">Preview the last digest</UiLink>
        <UiSwitch v-model="digest">Subscribe</UiSwitch>
      </template>
    </UiCard>
    <UiCard title="Idea: dark invoices">
      <p class="text-sm text-fg-muted">
        The quarterly report for the finance team, due next Friday.
      </p>
      <template #footer>
        <span
          class="me-auto flex items-center gap-4 text-sm text-fg-muted [&_svg]:h-4 [&_svg]:w-4"
        >
          <span class="flex items-center gap-1"><Heart aria-hidden="true" />24</span>
          <span class="flex items-center gap-1"><MessageSquare aria-hidden="true" />8</span>
          <span class="flex items-center gap-1"><Paperclip aria-hidden="true" />2</span>
        </span>
      </template>
    </UiCard>
  </div>
</template>

```

## API

Props:
- `title`: `string` (default `""`) — The heading of the card; its level follows the nesting: `h2` on a page, `h3` in a card, and so on.
- `description`: `string` (default `""`) — One line under the title that says what the card holds.
- `variant`: `"outline" | "plain"` = `outline | plain` (default `"outline"`) — `outline` is the framed surface; `plain` has no frame, no fill, no padding of its own: the three parts alone, on the gutter around it.
- `size`: `"sm" | "md"` = `sm | md` (default `"sm"`) — The gutter: `sm` is `--space-surface` (16, the default), `md` is `--space-surface-md` (24). Rows, separators and lists inside line up on it.
- `divided`: `boolean` — The line under the header; on by default for a framed card, off for a section of an overlay (the overlay draws the lines between sections). `false` lets the body follow the title directly.
- `padded`: `boolean` (default `true`) — The body's padding; `false` runs it edge to edge, for rows, a table or an image. Rows keep their text on the gutter.
- `align`: `"start" | "center"` = `start | center` (default `"start"`) — `center` stands the body's content in the middle, with room around it: a 404; `empty` puts `#empty` there.
- `imagePosition`: `"start" | "top" | "bottom" | "end"` = `start | top | bottom | end` (default `"top"`) — Where `#image` stands: above the header, below the footer, or beside the card at the `start` or the `end`.
- `footerVariant`: `"plain" | "muted"` = `plain | muted` (default `"plain"`) — `muted` fills the footer; `plain` keeps it on the surface. The line above it stays either way.
- `footerPadded`: `boolean` (default `true`) — The footer's padding; `false` runs its children edge to edge, sharing the width: split buttons, tabs.
- `tone`: `"warning" | "danger"` = `warning | danger` — Meaning of the frame: `danger` for a card in trouble (a failed connection), `warning` for one that needs a look. The words say it too: a badge in `#actions`.
- `disabled`: `boolean` (default `false`) — The card cannot be used now: its words go muted and it is a disabled group named by its title. Controls inside are the caller's to disable.
- `loading`: `boolean` — The body is on its way. With nothing in the body yet (the first load) a skeleton stands in its place; over content (a refresh) the content stays, dimmed to 60% with the title, under one spinner in the card's middle; `#actions`, a whole `#header` and `#footer` keep their color and still work. `aria-busy` either way. Bind it (`false` too) where the card loads, so its live region is there before the words. A body with a shape of its own (a table, a chart) draws its own skeleton.
- `empty`: `boolean` (default `false`) — There is nothing to show: `#empty` stands in the body's place, in the middle. A first load's skeleton wins over it; a later load leaves it as it is: give its Retry `loading`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `header` with `Record<string, never>` — The whole header in place of the title line: a tab strip, a toolbar. It runs edge to edge.
- `media` with `Record<string, never>` — Before the title: a glyph plate, an avatar. Glyphs are 20px.
- `actions` with `Record<string, never>` — At the end of the header, on the center of the title and its line: a button, a badge, a switch, a UiMenu.
- `default` with `Record<string, never>` — The body of the card.
- `empty` with `Record<string, never>` — In the body's place while `empty`: a UiNoData, which drops its own frame in a card.
- `image` with `Record<string, never>` — Media edge to edge at `imagePosition`: an image in a UiAspectRatio, a gradient.
- `footer` with `Record<string, never>` — Under a line: the actions stand at the end; a note or a total takes `me-auto`.
- `divider` with `Record<string, never>` — In place of the line above the footer, edge to edge: a UiProgress `h-1`, whose track is the line's color.

## How it behaves

### Visible work

- When: it is loading over existing content.
- Props: `loading`.
- Guarantee: During a refresh, the content and the title dim to 60% and one undimmed spinner turns in the middle of the card, over it, so nothing in the card moves, and its status region says “Updating…”. The card’s own buttons keep their color and still work. A first load uses placeholders without an additional indicator.
- Without it: The card only turns pale, and you cannot tell that it is waiting for an answer.
- Code: `<UiCard title="Invoices" :loading="refreshing">…</UiCard>`
- Your part: Bind `loading` to the request; the wording comes from the library. Over `#empty` the card adds nothing: give its Retry `loading`, which shows the wait on the button and refuses a second press.
- Not covered: Only the card’s own controls, in `#actions`, a whole `#header` and `#footer`, keep their color; a button in the body dims with the content and still works.
- Proof, in the repository's tests (UiCard.spec.ts, not in the package): "A refresh shows its work: the card dims what it shows and one spinner turns in its middle, over it, so nothing moves.", "A first load is a skeleton alone: no spinner for the same wait.", "loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#visible-work

### Stable dimensions

- When: it loads, on a first load and on a refresh.
- Props: `loading`, bound where the card loads, `false` included.
- Guarantee: The first load shows three placeholder lines. During a refresh, the card keeps what it shows mounted, its content dimmed or its empty state unchanged, so the card keeps its space and any input already entered in that content.
- Without it: The content gives way to a spinner during a refresh: the card shrinks, and everything below it jumps up, then back down.
- Code: `<UiCard title="Invoices" :loading="loading">…</UiCard>`
- Your part: Bind `loading` to the request. A body with its own layout, such as a table or a chart, draws its own placeholders.
- Proof, in the repository's tests (UiCard.spec.ts, not in the package): "a refresh dims the body in place: the content is not mounted again", "loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton", "a load after the empty state keeps it in place: the card keeps its height"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt


The patterns: https://grani.arseni.work/patterns

## Built on it

- [No data](https://grani.arseni.work/components/no-data): Understand why an area is empty and what you can do next.

Built with what `grani-ui` exports: `useUiT`.
