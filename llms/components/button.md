# Button (`UiButton`)

> Start an action and see when it is running, with further presses blocked while the button is loading.

A component of grani-ui 0.1.0. Actions, stable, since 0.1.0. Page: https://grani.arseni.work/components/button

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Download, Plus } from '@lucide/vue'
import { UiStack, UiButton, UiCard } from 'grani-ui'
</script>

<template>
  <UiStack class="w-full max-w-md">
    <div class="flex flex-wrap items-center justify-end gap-2">
      <UiButton variant="outline"
        ><Download aria-hidden="true" />Export the quarter as a spreadsheet</UiButton
      >
      <UiButton variant="secondary"><Plus aria-hidden="true" />New invoice</UiButton>
    </div>
    <UiCard title="INV-0042" description="Acme Corp · due Sep 30">
      <p class="text-sm text-fg">Design review and a prototype, €1 240.00 in all.</p>
      <template #footer>
        <UiButton variant="secondary">Cancel</UiButton>
        <UiButton>Save</UiButton>
      </template>
    </UiCard>
  </UiStack>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- Know why an action is unavailable.
- Keep nearby content in place while loading.
- Know when a link opens a new tab.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set `loading` from the press until the request answers.
- Word the reason as the next step (“Add the client’s email first”) and clear `disabled` once it is done. Without a reason the button stays natively disabled, out of the Tab order.
- Pass the address in `to`; nothing else is needed.

## Why it works this way

A button for an action, with loading and toggle states. With `to` it renders a link styled as a button.

**Look.** `variant` is the weight of the presentation, `tone` is the meaning.

**Loading.** `loading` shows a spinner in place of the label and refuses a second click, including one meant for your own handler. The width holds, also with the text of the `#loading` slot; an empty `loadingText` leaves the spinner alone.

**Toggle.** `pressed` makes it a toggle: `aria-pressed`, a check before the label, and the brand frame. It is for a chip that turns on and off by itself, as a filter (Unpaid, Overdue, Mine); one choice among a few is UiRadioGroup `segmented`. Off, it holds the room of its check, so pressing it moves nothing beside it.

**Disabled.** `disabled` alone is the native state: a flat plate, out of the Tab order, and silent, so a person cannot learn why it does not press. With `disabledReason` it keeps the same plate but stays in the Tab order, refuses the press (a submit too, and a menu it would open, by the arrows as well), and says why: in a tooltip on hover, keyboard focus, a press and a tap, and as its description to a screen reader ("Add the client's email first"). The tooltip stands inside the button, loaded the first time it is off with a reason, so the button stays its one element: a reason that comes or goes under the focus keeps it, and a ref or a UiTooltip around it still reaches the button; while it is off, the reason shows in place of that UiTooltip's words. With `to`, the link turns into a button when disabled, a new element, so the focus does not stay.

**Links.** With `to` it renders a RouteLink that looks like a button. Another site, or `target="_blank"`, opens in a new tab and says so: an arrow for the eye, a phrase for a screen reader. A `javascript:` or `data:` address is refused: it stays a button, and dev warns.

**Placement.** It sits in the footers of a drawer and a confirm, in toolbars beside a search, and in the triggers of filters, periods and columns. One `primary` to a surface, last in its footer: it is the step the surface is for. UiCopyButton is built on it, and UiButtonGroup joins it with its neighbors into one capsule.

**Attributes.** Anything else passed to it lands on the root element: native button and form attributes, `aria-*`, `data-testid`.

### Keyboard

- `Tab`: reaches it.
- `Enter` `Space`: press it; not while `loading`, nor while disabled with a reason, which the focus still reaches. A held Enter is one press: its repeats press nothing.
- `ArrowDown` `ArrowUp`: as a menu's trigger, open it; not while it refuses the press.
With `to`, a link:
- `Enter`: follows it; `Space` does not, as in the browser.

### Screen reader

- Name: the label; a lone glyph is UiIconButton, which carries its own name.
- Loading: says busy (`aria-busy`); the label is hidden from the reader and the loading text becomes the name: "In progress…" by default, `loadingText` or the `#loading` slot. The spinner is hidden. With an empty `loadingText` the label stays the name, unseen but still read, so the button is never nameless.
- Pressed: `pressed` is `aria-pressed`.
- Disabled with a reason: `aria-disabled`, and the reason is its description, read once.
- New tab: said in words after the label, where the eye sees an arrow.

### States

Rest, hover on a device that hovers, focus, disabled, disabled with a reason (the plate, the focus, the hint), loading and pressed, in both themes. A loading button keeps its width, so nothing beside it moves.

### When to use another component

- Text inside prose: UiLink.
- A lone glyph: UiIconButton.
- A choice among options: UiRadioGroup `segmented`.
- Buttons joined into one capsule: UiButtonGroup around them.

## Examples

### Variants

```vue
<script setup lang="ts">
import { UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="variant in ['primary', 'secondary', 'outline', 'ghost', 'dashed']"
      :key="variant"
      class="flex flex-wrap gap-3"
    >
      <UiButton :variant="variant">Brand</UiButton>
      <UiButton :variant="variant" tone="success">Approve</UiButton>
      <UiButton :variant="variant" tone="warning">Archive</UiButton>
      <UiButton :variant="variant" tone="danger">Delete</UiButton>
    </div>
  </div>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiButton } from 'grani-ui'
</script>

<template>
  <UiButton size="xs">Extra small</UiButton>
  <UiButton>Default</UiButton>
  <UiButton size="md">Medium</UiButton>
</template>

```

### Loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import { UiButton, UiRadioGroup, UiRadio } from 'grani-ui'

const state = ref('loading')
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiButton size="xs" variant="outline" :loading="state === 'loading'">Retry</UiButton>
      <UiButton :loading="state === 'loading'" loading-text="Saving…">Save</UiButton>
      <UiButton size="md" variant="secondary" :loading="state === 'loading'">Send</UiButton>
      <UiButton
        variant="secondary"
        :loading="state === 'loading'"
        loading-text=""
        aria-label="Add a row"
        ><Plus aria-hidden="true"
      /></UiButton>
      <UiButton variant="outline" :loading="state === 'loading'"
        >Upload<template #loading>Uploading your file…</template></UiButton
      >
    </div>
    <UiRadioGroup v-model="state" variant="segmented" aria-label="State of the buttons">
      <UiRadio value="idle">Idle</UiRadio>
      <UiRadio value="loading">Loading</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Pressed

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton } from 'grani-ui'

const FILTERS = ['Unpaid', 'Overdue', 'Mine']

const on = ref(new Set(['Unpaid']))

function toggle(name: string) {
  const next = new Set(on.value)
  if (!next.delete(name)) next.add(name)
  on.value = next
}
</script>

<template>
  <div role="group" aria-label="Filters" class="flex gap-2">
    <UiButton
      v-for="name in FILTERS"
      :key="name"
      variant="outline"
      size="xs"
      :pressed="on.has(name)"
      @click="toggle(name)"
      >{{ name }}</UiButton
    >
  </div>
</template>

```

### Link

```vue
<script setup lang="ts">
import { UiButton } from 'grani-ui'
</script>

<template>
  <UiButton to="/components/link">Open record</UiButton>
  <UiButton variant="outline" to="/components/icon-button" loading>Compare</UiButton>
  <UiButton variant="outline" to="https://status.example.com">Status page</UiButton>
</template>

```

### Dashed

```vue
<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { UiCard, UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-2">
    <UiCard size="sm" title="Goal 1" description="30 minutes a day" />
    <UiButton variant="dashed" block><Plus aria-hidden="true" />Add a goal</UiButton>
  </div>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiButton } from 'grani-ui'
</script>

<template>
  <UiButton disabled>Unavailable</UiButton>
  <UiButton variant="secondary" disabled>Unavailable</UiButton>
  <UiButton variant="outline" disabled>Unavailable</UiButton>
  <UiButton variant="ghost" disabled>Unavailable</UiButton>
  <UiButton variant="dashed" disabled>Unavailable</UiButton>
  <UiButton to="/components/link" disabled>A link, off</UiButton>
  <!-- With a reason: still reached by Tab, and the reason shows on hover, focus and a tap. -->
  <UiButton disabled disabled-reason="Add the client’s email first">Save</UiButton>
</template>

```

## API

Props:
- `type`: `"button" | "submit" | "reset"` = `button | submit | reset` (default `"button"`) — Native type; `submit` sends the form the button sits in. A link has none.
- `to`: `string` — A route or a URL: the button becomes a link. An absolute address opens in a new tab; `javascript:` and `data:` are refused, and it stays a button.
- `target`: `"_blank" | "_self"` = `_blank | _self` — With `to`: `_blank` or `_self` decides the tab; unset, a new tab for an absolute address only.
- `rel`: `string` — With `to`: replaces the default `noreferrer` (`nofollow`, `sponsored`); `noopener` stays on a new tab.
- `loading`: `boolean` (default `false`) — A request is running: spinner, `aria-busy`, no clicks; it wins over `disabled`.
- `disabled`: `boolean` (default `false`) — Natively disabled: a flat plate, out of the Tab order; with `disabledReason`, focusable and saying why. A link turns back into a button.
- `disabledReason`: `string` — Why it cannot be pressed now, while `disabled`: it stays in the Tab order, refuses the press, and says the reason in a tooltip on hover, focus, a press and a tap, and as its description to a screen reader. A blank one is none.
- `variant`: `ButtonVariant` = `outline | primary | secondary | ghost | dashed` (default `"primary"`) — Weight of the presentation: brand fill, gray plate, white with a border, or quiet.
- `tone`: `ButtonTone` = `brand | success | warning | danger` (default `"brand"`) — Meaning of the action; `brand` means none in particular. Every variant supports every tone.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder: `xs` 28px for a micro action, `sm` 36px, `md` 44px for forms. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `block`: `boolean` (default `false`) — Full width, as in a drawer footer.
- `loadingText`: `string` — Label while loading; the default is a translated "In progress…". Empty, the spinner stands alone (a glyph button).
- `pressed`: `boolean` — A toggle: `aria-pressed`, and on, a check and the brand frame. Unset, it is no toggle. A primary button is never one.
Attributes are placed by the component itself: its description says where.

Slots:
- `loading` with `Record<string, never>` — Replaces the label while loading.
- `default` with `Record<string, never>` — The label; a glyph goes here too, before the text. The button sizes it.

## How it behaves

### One press, one request

- When: its request is on its way.
- Props: `loading` while the request runs.
- Guarantee: The button shows a spinner and text such as “Sending…”, so you know the action has started. Further presses, by mouse or keyboard, reach neither your handler nor the form’s submit action, and keyboard focus stays on the button.
- Without it: Pressing Send again while the invoice is on its way submits the form twice.
- Code: `<UiButton type="submit" :loading="sending" loading-text="Sending…">Send</UiButton>`
- Your part: Set `loading` from the press until the request answers.
- Not covered: The button does not know about the request: without `loading`, every press reaches your handler. It stops extra presses in the interface; making the operation safe to repeat on the server remains the app’s job.
- Proof, in the repository's tests (UiButton.spec.ts, not in the package): "a disabled or loading button does not fire click", "refuses the click before the caller's listener", "a loading submit button does not send its form"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Says why

- When: it is disabled for a reason the person can act on.
- Props: `disabled` with `disabledReason`.
- Guarantee: The button looks disabled but stays in the Tab order. It cannot be activated, submit a form or open its menu, including through the arrow keys. A tooltip explains why the button is unavailable when you hover, focus, click or tap it, and a screen reader announces the same reason as its description. If the reason appears or disappears while the button has keyboard focus, focus stays on it.
- Without it: A grey button that Tab passes over and nothing explains: the person hunts for what is missing.
- Code: `<UiButton :disabled="!email" disabled-reason="Add the client’s email first">Save</UiButton>`
- Your part: Word the reason as the next step (“Add the client’s email first”) and clear `disabled` once it is done. Without a reason the button stays natively disabled, out of the Tab order.
- Not covered: The reason is one line, not a list of every missing field: a long form says its errors at the fields (UiField) when Save is pressed instead. A button with `to` is a link while it works and a new button element while it is off, so keyboard focus does not stay across that change.
- Proof, in the repository's tests (UiButton.spec.ts, not in the package): "disabled with a reason, it stays in the Tab order and refuses a press, a submit too", "the reason is the button’s description, read once, and the hint on focus says it", "a reason with the button enabled is nothing: the button presses as ever", "a reason that comes and goes keeps the button, its focus and its ref", "a menu button that refuses its press opens nothing, by click or by arrow", "a press on a button off with a reason shows the reason, by mouse and by a tap on a menu button", "a blank reason is no reason: the button stays natively disabled, out of the Tab order", "a mouse press shows the reason, and the pointer leaving takes it away", "a reason that comes while the keyboard is on the button shows at once", "a hint that fails to load costs nothing but the hint: no error, the reason still read"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#off-says-why

### Stable dimensions

- When: its loading text is longer than its label, or it is a toggle.
- Props: `loading`, with `loadingText` or the `#loading` slot; `pressed`.
- Guarantee: From the first render, the button reserves room for both its label and its loading text, so “Save” becomes “Saving…” without moving anything beside it. A toggle that is off reserves the room for its check mark the same way, so pressing it moves nothing.
- Without it: “Save” grows into “Saving…” and pushes Cancel aside just as you reach for it.
- Code: `<UiButton :loading="saving" loading-text="Saving…">Save</UiButton>`
- Your part: Nothing: pass the loading text to the button (`loadingText` or the `#loading` slot) instead of swapping its label yourself.
- Proof, in the repository's tests (UiButton.spec.ts, not in the package): "reserves the loading width even when the loading prop arrives after the first render", "the idle width sizer carries the #loading slot text", "a toggle that is off holds the room of its check, so pressing it moves nothing"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### New tab said

- When: its `to` is another site, or it has `target="_blank"`.
- Props: `to`.
- Guarantee: It shows the same arrow after its label as a link does, and a screen reader announces “opens in a new tab” in the same way.
- Without it: Pressing the button opens another tab without warning, and Back there does not return to this page.
- Code: `<UiButton to="https://status.example.com">Status page</UiButton>`
- Your part: Pass the address in `to`; nothing else is needed.
- Proof, in the repository's tests (UiButton.spec.ts, not in the package): "an address with a protocol opens in a new tab and says so", "a new tab is seen as well as said: an arrow, and a caller target gets rel and the notice"
- Pattern for all components: https://grani.arseni.work/patterns/opening#new-tab-said


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useControlSize`, `useUiT`.
