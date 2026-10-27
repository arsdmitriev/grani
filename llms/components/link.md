# Link (`UiLink`)

> Follow an underlined link in text, marked when it opens a new tab.

A component of grani-ui 0.1.0. Actions, stable, since 0.1.0. Page: https://grani.arseni.work/components/link

Also called hyperlink, anchor, text link.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCard, UiLink } from 'grani-ui'
</script>

<template>
  <UiCard title="ORD-1041" class="w-full max-w-md">
    <p class="text-sm text-fg">
      Paid on Sep 12; the receipt is in <UiLink to="/components/card">the order's files</UiLink>.
      The parcel can be followed on
      <UiLink to="https://track.example.com/parcel/41">the carrier's site</UiLink>. Questions go
      to <UiLink to="mailto:orders@example.com">orders@example.com</UiLink> or
      <UiLink to="tel:+15550100">+1 555 0100</UiLink>.
    </p>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Name states in words, not color alone.
- Know when a link opens a new tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass the address in `to`. To open it in the current tab, set `target="_self"`; this also removes the new-tab arrow and announcement.

## Why it works this way

A link inside text, underlined at rest. Take it for a link in prose, a caption or a note.

**Underline.** The underline tells the link apart from the words around it, since its color alone may not.

**New tab.** Another site (or `target="_blank"`) opens in a new tab and says so: an arrow for the eye, a phrase for a screen reader.

**Scripts.** An address that runs script (`javascript:`, `data:`) is not linked: the text stays, in the ink of the words around it, with no line and no href, and dev warns. So is no address at all, an empty `to` or one the app's data left out (`null`) or holds as no string (a number): a menu built from data renders, on a server too, with that item as text. A link focused when its address goes away drops the focus with it, as any element that leaves.

**Router.** A path of the app (`/records/7`, `/people/john.doe`) goes through the link component given to `createGrani({ link })`, else the app's `RouterLink`, else a plain anchor; another site, `mailto:`, `tel:` and a file the server hands out (`/llms.txt`, `/report.pdf`) are plain anchors. An address padded with spaces is read trimmed.

**Placement.** It sits in prose, a caption, a card's footer note, or a header beside the title. Its neighbors are UiButton `to` (an action) and UiListItem `to` (a whole row as the link), and it never goes inside either: a link in a link warns in dev.

**Wrapping.** It never wraps, so a name or a command reads as one piece. A link is a few words: a long one is written shorter, not broken across lines.

### Keyboard

An anchor.
- `Tab`: reaches it; a refused address (`javascript:`, `data:`) or none is plain text and takes no focus.
- `Enter`: follows it; `Space` does not, as in the browser.

### Screen reader

- Name: the text.
- New tab: another site, or `target="_blank"`, adds "opens in a new tab" after the text, where the eye sees an arrow, which is hidden. The notice follows the real target, so a `mailto:` or `tel:` link says nothing.
- Attributes: native ones (`aria-current`, `hreflang`, `lang`, `title`) reach the anchor. An `aria-label` replaces the name and the notice with it: write "opens in a new tab" into it.

### States

Rest, underlined in the tone's ink (`brand`, `info`, `neutral`); hover, in the hover ink; focus. External with the arrow; internal, mail and phone without it. Always on one line. No disabled state: a refused or missing address shows as text.

### When to use another component

- An action: UiButton, with `to` when it looks like a button.
- A whole row as the link: UiListItem `to`.
- A link inside either: never; a link in a link (UiListItem or UiButton with `to`) warns in dev.

## Examples

### Tones

```vue
<script setup lang="ts">
import { UiStack, UiLink } from 'grani-ui'
</script>

<template>
  <UiStack class="w-full max-w-md">
    <p class="text-sm text-fg">
      The record was moved to <UiLink to="/components/card">the archive</UiLink>.
    </p>
    <p class="text-sm text-fg">
      Three records have no rate:
      <UiLink to="/components/badge" tone="info">open the list</UiLink>.
    </p>
    <p class="text-sm text-fg-muted">
      Updated yesterday by <UiLink to="/components/badge" tone="neutral">Dana Petrova</UiLink>.
    </p>
  </UiStack>
</template>

```

### Target and rel

```vue
<script setup lang="ts">
import { UiLink } from 'grani-ui'
</script>

<template>
  <p class="text-sm text-fg">
    Read <UiLink to="https://help.example.com" target="_self">the help center here</UiLink>, open
    <UiLink to="/components/card" target="_blank">a card in a new tab</UiLink>, or follow
    <UiLink to="https://partner.example.com" rel="nofollow">a partner</UiLink>.
  </p>
</template>

```

## API

Props:
- `to`: `string` (required) — A route or a URL; an absolute address is external, `mailto:` and `tel:` are not. `javascript:` and `data:` are refused: the text shows with no link.
- `tone`: `LinkTone` = `brand | neutral | info` (default `"brand"`) — `brand` is the link color; `info` the signal blue, a link to look at; `neutral` a quiet link in a caption.
- `target`: `"_blank" | "_self"` = `_blank | _self` — `_blank` or `_self` overrides the default: a new tab for an external address only.
- `rel`: `string` — Replaces the default `noreferrer`, e.g. `nofollow`, `sponsored`, `ugc`; `noopener` stays on a new tab.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Slots:
- `default` with `Record<string, never>` — The link text.

## How it behaves

### Words, not only color

- When: it sits in a line of text.
- Props: none: every UiLink.
- Guarantee: It is underlined at rest in its own color, so it stands apart from the words around it without relying on color, or on hover, which a touch screen does not have.
- Without it: A link distinguished by color alone looks like ordinary text to anyone who cannot see that difference.
- Code: `<UiLink to="/orders/1041">the order</UiLink>`
- Your part: Nothing. Do not remove the underline to make a link quieter; use `tone="neutral"`.
- Proof, in the repository's tests (UiLink.spec.ts, not in the package): "is underlined at rest: a touch screen has no hover"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#level-not-by-colour

### New tab said

- When: its address is another site, or it has `target="_blank"`.
- Props: `to` with an absolute address.
- Guarantee: You see an arrow after the last word, a screen reader announces “opens in a new tab” after the text, and the new tab opens without access to the page that opened it.
- Without it: A new tab opens without warning: Back does nothing there, and a screen reader gives no sign that the page moved to another tab.
- Code: `<UiLink to="https://help.example.com">the help center</UiLink>`
- Your part: Pass the address in `to`. To open it in the current tab, set `target="_self"`; this also removes the new-tab arrow and announcement.
- Not covered: Any absolute URL is treated as an external link, even if it points to the app’s own site. Use `target="_self"` when that link should open in the current tab.
- Proof, in the repository's tests (UiLink.spec.ts, not in the package): "an external address opens in a new tab, safely, and says so to a screen reader", "an external link draws an arrow after the text, an internal one does not", "target overrides the default, and the screen-reader notice follows the real target"
- Pattern for all components: https://grani.arseni.work/patterns/opening#new-tab-said


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
