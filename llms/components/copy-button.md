# Copy button (`UiCopyButton`)

> Copy a value in one press and see whether it reached the clipboard.

A component of grani-ui 0.1.0. Actions, stable, since 0.1.0. Page: https://grani.arseni.work/components/copy-button

Also called copy to clipboard, clipboard button.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { UiCard, UiStack, UiCopyButton, UiField, UiButtonGroup, UiInput } from 'grani-ui'
</script>

<template>
  <UiCard title="INV-2040-0613" class="w-full max-w-md">
    <UiStack>
      <p class="text-sm text-fg-muted">
        Invoice
        <UiCopyButton
          value="INV-2040-0613"
          label="INV-2040-0613"
          variant="inline"
          ariaLabel="Copy INV-2040-0613"
        />
        was sent to Acme Corp on 3 October.
      </p>
      <UiField label="Share link">
        <UiButtonGroup>
          <UiInput model-value="https://example.test/share/41" readonly />
          <UiCopyButton
            value="https://example.test/share/41"
            variant="outline"
            ariaLabel="Copy the share link"
          />
        </UiButtonGroup>
      </UiField>
    </UiStack>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See whether an action worked.
- Know why an action is unavailable.
- Read the full text when a label is shortened.
- Copy a whole value in one press.
- Keep keyboard focus where you are working.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Mount `<UiToaster />` once in the app: the error message, and a success one with `toast`, show there. Add `toast` only where the button leaves the screen after the press, as in a menu.
- Word a reason of your own as the next step (“Publish the page first”). Without one, `disabled` alone takes the button out of the Tab order.
- Keep the label of a framed or ghost copy button to a few words; show a long value there with `truncate`, cut in the middle.
- Pass the whole value in `value`, and shorten only what is shown, with `truncate`.

## Why it works this way

A button that copies `value` to the clipboard and shows a check for 1.2 s. Take it beside an id, a key or any value a person copies.

**Outcome.** A failure marks the glyph for 1.2 s, as a success shows its check, and also shows an error toast in the app's UiToaster, so mount one; a success shows a toast only with `toast`, since the check in view has already said it. The toast is not read aloud, because the live region has said it. Every copy button on the page refreshes the one toast instead of piling up more. Where the browser has no Clipboard API (a page over plain HTTP), the copy goes through a field no one sees, and the focus comes back.

**Shapes.** Without text it is an icon button named "Copy", with the `Copy` glyph or your `icon`. With `label` or `truncate` it is a button with text; `truncate` shows the value cut in the middle in monospace (`613aa1…4510e0`) and copies it whole. A line break or another control character in the kept half of a cut value draws as a mark (`⏎`, a control picture), never left invisible: it still copies with the character itself. A `label` is a few words, as a button's; a value too long for its place is shown with `truncate`, cut in the middle.

**Ghost.** A `ghost` one is text with no plate. Its glyph appears on hover and focus of this button only (always on a screen without hover), so a column of ids stays quiet. In a cell, `flush` pulls it back by its own padding and border, so the text starts on the column line. Beside a neighbor it keeps its box, because a negative margin there would overlap the neighbor.

**Outline.** An `outline` one is a framed button: plate, frame and glyph always shown, since a frame around an empty space reads as a hole.

**Inline.** An `inline` one is a word inside a line of text (the small line of a drawer's header): no plate, no height, no padding, the line's size and ink, and a small glyph always after it, since a glyph that waits for hover leaves a gap. It needs a `label` or `truncate`. A label longer than the line is cut with an ellipsis, whole in a tooltip (UiTruncate), and the glyph stays.

**Secrets.** `label` and `truncate` put the text on the screen and in the accessible name, so a secret goes in with neither.

**Off.** An empty `value` keeps the button in the Tab order and says "Nothing to copy", as a `disabledReason` says yours (UiButton's): in a tooltip and as its description. `disabled` alone takes it out of the Tab order.

**Placement.** It sits in a table's copy column (named "Copy" and the value), in a UiInput's `#end`, in a drawer's header line, and beside UiPasswordField's input, before its generate button. Beside other copy buttons, each one takes its own `ariaLabel`, which holds the text it shows: a voice command says what it sees. A cut value is named by its cut by default ("Copy 613aa1…4510e0").

### Keyboard

A native button in every shape.
- `Tab`: reaches it, an empty `value` too; `disabled` takes it out, unless it has a `disabledReason`.
- `Enter` `Space`: copy; the focus stays on it after the copy.
A `ghost` one shows its glyph on keyboard focus, as on hover.

### Screen reader

- Name: "Copy" for a glyph alone, "Copy" and the visible text for a cut value, `label` as it is, or `ariaLabel`; "Copied" never joins the name.
- Outcome: "Copied" or "Could not copy" (when the clipboard refuses), from one polite live region outside the button, inside an open modal window when the button is in one, since the window hides the page from a reader. It is heard even after the button has left the view, and said again for a second copy in the same window.
- Off with a reason: `aria-disabled`, and "Nothing to copy" or the `disabledReason` is its description.
- Glyph: hidden.
- Toast: not read, since the region has said it.

### States

At rest: a glyph alone, a cut id in monospace, or a label. Copied: a check for 1.2 s. Refused: an alert glyph for 1.2 s, no check, "Could not copy" and an error toast. Nothing to copy (an empty `value`) or `disabled`: the disabled ink, the reason in a tooltip. A long `inline` label: cut, whole in a tooltip. `ghost` shows the glyph on hover and focus only (always on a screen without hover), `outline` always, `inline` a small one after the word; `flush` in a cell; `xs`, `sm` and `md`; joined in a UiButtonGroup; a success toast with `toast`.

### When to use another component

- A glyph that does anything else: UiIconButton.
- An action with text: UiButton.
- A value cut to fit with nothing to copy: UiTruncate.
- A secret shown as text on the screen: never; it is copied with neither `label` nor `truncate`.

## Examples

### In a table

```vue
<script setup lang="ts">
import type { TableColumn } from 'grani-ui'
import { UiCard, UiTable, UiCopyButton } from 'grani-ui'

interface Key {
  name: string
  id: string
  created: string
}

const KEYS: Key[] = [
  { name: 'Production', id: '613aa1c0ff4510e0a9b2c3d4', created: 'Sep 3' },
  { name: 'Staging', id: '9f02be7741c3d8a5e6f10b22', created: 'Sep 14' },
  { name: 'Local', id: 'c47d19aa2e8b05f3d6e1a970', created: 'Oct 1' },
]

// The key column starts on its header's line: the copy button is flush in the cell.
const columns: TableColumn<Key>[] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'Key' },
  { key: 'created', label: 'Created', align: 'end' },
]
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-lg">
    <UiTable :columns="columns" :items="KEYS" aria-label="API keys">
      <template #cell.id="{ row }">
        <!-- Named by its cut, "Copy 613aa1…b2c3d4": the name holds what the eye reads. -->
        <UiCopyButton :value="row.id" :truncate="12" size="xs" flush />
      </template>
    </UiTable>
  </UiCard>
</template>

```

### Variants

```vue
<script setup lang="ts">
import { Bot, Code } from '@lucide/vue'
import { UiCopyButton } from 'grani-ui'
</script>

<template>
  <UiCopyButton value="name@example.com" />
  <UiCopyButton value="name@example.com" variant="outline" />
  <UiCopyButton value="https://example.com/invoices/2041" label="Copy link" />
  <UiCopyButton value="https://example.com/invoices/2041" label="Copy link" variant="outline" />
  <UiCopyButton value="npm i grani-ui" :icon="Code" ariaLabel="Copy the install command" />
  <UiCopyButton value="Summarise this page" :icon="Bot" ariaLabel="Copy the prompt" />
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiCopyButton } from 'grani-ui'
</script>

<template>
  <UiCopyButton
    v-for="s in ['xs', 'sm', 'md']"
    :key="s"
    :size="s"
    value="x"
    variant="outline"
    :ariaLabel="`Copy, ${s}`"
  />
</template>

```

### With a toast

```vue
<script setup lang="ts">
import { UiCopyButton } from 'grani-ui'

// The browser refuses this one press, the Clipboard API and the old way both, as a frame denied
// the clipboard does: the alert glyph, Could not copy, and the error toast.
function refuseOnce() {
  const own = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const exec = Object.getOwnPropertyDescriptor(document, 'execCommand')
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.reject(new Error('refused')) },
  })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false })
  setTimeout(() => {
    if (own) Object.defineProperty(navigator, 'clipboard', own)
    else delete (navigator as { clipboard?: unknown }).clipboard
    if (exec) Object.defineProperty(document, 'execCommand', exec)
    else delete (document as { execCommand?: unknown }).execCommand
  })
}
</script>

<template>
  <UiCopyButton value="https://example.test/share/41" label="Copy share link" toast />
  <!-- Showcase only: the span makes the clipboard refuse this press. In an app the button stands alone. -->
  <span class="contents" @click.capture="refuseOnce">
    <UiCopyButton value="https://example.test/share/41" label="Copy, refused" />
  </span>
</template>

```

### Long text

```vue
<script setup lang="ts">
import { UiCard, UiStack, UiCopyButton } from 'grani-ui'
</script>

<template>
  <UiCard title="Reference" class="w-full max-w-52">
    <UiStack>
      <!-- A button's label is a few words: a long value is cut in the middle instead. -->
      <UiCopyButton
        value="INV-2040-0613-ACME-CORPORATION-EUROPE"
        :truncate="16"
        variant="outline"
        ariaLabel="Copy the reference"
      />
      <p class="text-sm text-fg-muted">
        Ref
        <UiCopyButton
          value="INV-2040-0613-ACME-CORPORATION-EUROPE"
          label="INV-2040-0613-ACME-CORPORATION-EUROPE"
          variant="inline"
        />
      </p>
    </UiStack>
  </UiCard>
</template>

```

### Disabled

```vue
<script setup lang="ts">
import { UiCopyButton } from 'grani-ui'
</script>

<template>
  <!-- An empty value says "Nothing to copy" by itself, and keeps its place in the Tab order. -->
  <UiCopyButton value="" />
  <UiCopyButton value="" label="Copy link" />
  <UiCopyButton
    value="https://example.test/pages/41"
    label="Copy link"
    disabled
    disabled-reason="Publish the page first"
  />
  <!-- `disabled` with no reason leaves the Tab order. -->
  <UiCopyButton value="613aa1c0ff4510e0a9b2c3d4" :truncate="12" disabled />
  <UiCopyButton value="" label="INV-1" variant="inline" ariaLabel="Copy INV-1" />
</template>

```

## API

Props:
- `value`: `string` (required) — What goes to the clipboard, whole. Empty, the button is off and says there is nothing to copy.
- `label`: `string` — Visible text beside the glyph, and the name as it is ("Copy link"); for a value shown as itself pass `ariaLabel` too. It wins over `truncate`.
- `truncate`: `number` — Shows `value` cut in the middle to about this many characters, in monospace; the copy is still whole.
- `variant`: `"inline" | "outline" | "ghost"` = `inline | outline | ghost` (default `"ghost"`) — `ghost` is text alone, its glyph on hover, for an id in a table; `outline` is a framed button with its glyph always shown; `inline` is text inside a line of text, its size and ink, with a small glyph after it.
- `size`: `ControlSize` = `xs | sm | md` — Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default.
- `flush`: `boolean` (default `false`) — In a cell: the text starts on the column line, the button's own padding and border taken back. `ghost` only.
- `disabled`: `boolean` (default `false`) — No copy; the button stays in place.
- `disabledReason`: `string` — Why it cannot copy now, while `disabled`: it stays in the Tab order and says the reason in a tooltip and as its description, as UiButton's. An empty `value` says "Nothing to copy" by itself.
- `toast`: `boolean` (default `false`) — Also say a success as a toast, where the button leaves the view once pressed; a failure always is one.
- `ariaLabel`: `string` — Accessible name; defaults to "Copy" for a glyph alone and "Copy <text>" for a truncated value.
- `icon`: `Component` — The glyph at rest, a Lucide component; `Copy` when unset. Two copy buttons side by side tell what they copy by it: `Code`, `Bot`.
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `copy` (`ok: boolean`) — The value reached the clipboard (`true`) or the clipboard refused (`false`).

## How it behaves

### Outcome shown

- When: you copy.
- Props: none; `toast` where the button leaves the view once pressed.
- Guarantee: The button shows a check mark for 1.2 seconds, and a screen reader announces “Copied”, even if the button has left the screen. If clipboard access is refused, a warning mark replaces the check mark for the same 1.2 seconds, a screen reader announces “Could not copy”, and an error message appears; several copy buttons that fail at once share one message.
- Without it: A press with no answer: you copy again, or paste the old value.
- Code: `<UiCopyButton :value="link" label="Copy link" />`
- Your part: Mount `<UiToaster />` once in the app: the error message, and a success one with `toast`, show there. Add `toast` only where the button leaves the screen after the press, as in a menu.
- Proof, in the repository's tests (UiCopyButton.spec.ts, not in the package): "after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button", "a copy whose button left the view is still heard", "two buttons that fail share one toast", "a refused clipboard emits copy false and shows no check"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### Says why

- When: there is nothing to copy yet, or copying is off for a reason.
- Props: `disabled` with `disabledReason`; an empty `value` needs neither.
- Guarantee: An empty value keeps the button in the Tab order and says “Nothing to copy” in a tooltip and as its description, and a press copies nothing. A `disabledReason` is said the same way.
- Without it: A copy button that Tab skips beside an empty field, and nobody says there is nothing to copy yet.
- Code: `<UiCopyButton :value="page.url" :disabled="!page.published" disabled-reason="Publish the page first" />`
- Your part: Word a reason of your own as the next step (“Publish the page first”). Without one, `disabled` alone takes the button out of the Tab order.
- Proof, in the repository's tests (UiCopyButton.spec.ts, not in the package): "an empty value keeps the button in the Tab order and says there is nothing to copy", "disabled with a reason passes the reason on", "an empty value copies nothing and the button is off"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#off-says-why

### Whole text

- When: an `inline` label is longer than its line.
- Props: `label` with `variant="inline"`.
- Guarantee: The label keeps one line, cut with an ellipsis, and its whole text shows in a tooltip while the cut is real. The copy glyph stays in view, and the accessible name is never cut.
- Without it: A long reference that pushes the glyph off the end of its line.
- Code: `<UiCopyButton :value="ref" :label="ref" variant="inline" />`
- Your part: Keep the label of a framed or ghost copy button to a few words; show a long value there with `truncate`, cut in the middle.
- Not covered: The tooltip opens on hover and tap, not on keyboard focus; a screen reader hears the whole name.
- Proof, in the repository's tests (UiCopyButton.spec.ts, not in the package): "a long inline label stands in a UiTruncate, the glyph kept"
- Pattern for all components: https://grani.arseni.work/patterns/finding#whole-text

### Copied whole

- When: beside an id, a key or a link.
- Props: `value`, and `truncate` where the value is too long to show.
- Guarantee: One press puts the whole value on the clipboard, even when it is shown cut in the middle. For 1.2 seconds the button shows a check mark, and a screen reader announces “Copied”, so you know the copy succeeded. If the browser refuses clipboard access, no check mark appears.
- Without it: A copy of what is shown: the cut id lands in the clipboard, ellipsis and all.
- Code: `<UiCopyButton :value="order.id" :truncate="12" />`
- Your part: Pass the whole value in `value`, and shorten only what is shown, with `truncate`.
- Not covered: For a secret, set neither `label` nor `truncate`: both put text on the screen and in the button's accessible name.
- Proof, in the repository's tests (UiCopyButton.spec.ts, not in the package): "a glyph alone is an icon button named Copy; it copies the value whole", "truncate shows the id cut in the middle in monospace and copies it whole; the glyph waits for hover", "after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button", "a refused clipboard emits copy false and shows no check"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#copy-value

### Focus stays near

- When: you copy from the keyboard.
- Props: none.
- Guarantee: Keyboard focus stays on the button after the copy, also where the browser has no Clipboard API (a page over plain HTTP) and the copy goes through a field no one sees, so Tab goes on from there.
- Without it: Focus left in a hidden field after a copy, and the next Tab starts from nowhere.
- Code: `<UiCopyButton :value="order.id" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiCopyButton.spec.ts, not in the package): "focus stays on the button after a copy", "copied the old way, through a field no one sees, the focus comes back to the button"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useClipboard`, `useToast`, `useControlSize`, `announce`, `useUiT`.
