# Toaster (`UiToaster`)

> See a short message about an action's progress or result, with an action such as Undo when available.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/toaster

Also called toast, notifications, snackbar.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { Link } from '@lucide/vue'
import { UiButton, UiToaster, useToast } from 'grani-ui'

const toast = useToast()
</script>

<template>
  <UiButton variant="outline" @click="toast.success('Invoice sent')">Success</UiButton>
  <UiButton
    variant="outline"
    @click="toast.info('Reminder scheduled', { description: 'Tomorrow at 9:00' })"
  >
    Info
  </UiButton>
  <UiButton variant="outline" @click="toast.warning('Two items are out of stock')"
    >Warning</UiButton
  >
  <UiButton
    variant="outline"
    @click="toast.error('Could not save', { description: 'The server did not answer.' })"
  >
    Error
  </UiButton>
  <UiButton variant="outline" @click="toast.show({ title: 'Draft saved' })">Neutral</UiButton>
  <UiButton variant="outline" @click="toast.success('Link copied', { icon: Link })">
    Own glyph
  </UiButton>
  <UiButton
    variant="outline"
    @click="toast.error('Payment declined', { duration: 'persistent' })"
  >
    Until closed
  </UiButton>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See whether an action worked.
- Ignore extra presses while a request runs.
- Confirm only what cannot be undone.
- Reach frequent actions from the keyboard.
- Keep keyboard focus where you are working.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Keep the button in `loading` until the request answers, then report the outcome with `toast.success` or `toast.error`; an error says what to do next. Where the button leaves the screen once pressed, as a menu row does, `toast.promise` shows the wait in a message instead.
- Make the change, retain the information needed to reverse it, and connect the toast’s Undo action to that reversal.
- List F8 wherever your app lists its keys; the notification region already names it to a screen reader as “Notifications (F8)”.

## Why it works this way

The place where toasts appear. Put it once at the app root (its root component or a layout), beside UiConfirm.

**Root.** Never put it in a page or a component: every `useToast()` call anywhere lands in this one stack, and a second toaster in the same app warns in dev. Without a toaster, a toast is queued and never seen, and dev says so once. It stands at the end of the `body`, or where `createGrani({ teleport })` says.

**Placement.** By default it stands at the bottom start of the screen (`placement`: `bottom-start`, `bottom`, `bottom-end`; start and end follow the reading direction), clear of the safe area. On a phone it stands at the top, where it covers no pinned footer and no Save button. The newest toast is in front, and up to three are shown; older ones peek behind it, smaller and as tall as it, so a short one never hides behind a long one nor a long one stands over a short one as an empty frame, and wait with their timers paused until there is room. Under the pointer or the focus, the pile opens into a column and every timer stops until both have left.

Over a drawer. The stack stands above every layer and leaves no room for the one under it. On a phone, at the top, it covers the drawer's header (its cross and title) while it stays; on a screen under 850px wide, at the bottom start, it covers the end of a drawer's footer, its Cancel. It goes by itself, by a swipe or with its close button. In a UiAppShell the stack at the bottom start stands over the sidebar's `#footer` while it shows: with a control there that is used often (a theme switch), set `placement="bottom-end"`.

**Toast.** A toast is a row on a card: the glyph of its tone (or its own `icon`; `neutral` has none), a title, a detail line, one action and a close button. It closes when its `duration` runs out (5 s, 7 s for an error, 13 s with an action, time to reach it by `F8`), on the close button, on Escape while focused, or on a swipe away from the screen edge it stands at (down, or up on a phone) or toward its side. Its action runs once. A long line wraps; a long detail is cut at three lines. A toast never holds what the page needs to go on: that is a dialog or inline text.

**Again.** The same toast shown again while one stands, shown or waiting (the same title, detail, tone, glyph and `announce`, no action), is that one card: it comes to the front with its whole time again, and its id is returned. Five presses of Copy are one "Copied", not a pile of five. A toast with an action is always new: two Undo buttons undo two things.

**The key.** F8 is a function key no browser uses for itself, and the key a toast region is commonly reached by. F6 is the browser's own walk between its panes, and a letter with Alt or Ctrl+Alt types text on some keyboards. The region's name includes the key, so a screen reader user hears how to get in. The toaster stands above every layer, and an open window's focus trap lets the focus into it.

### Keyboard

- `F8`: from anywhere on the page, with a window open or not, moves the focus to the newest toast's action (its close button when it has none); `F8` again goes back.
- `Tab`: reaches a toast's action and its close button.
- `Escape`: on a focused toast, closes it.
When a toast closes with the focus in it (Escape, its close button, its action), the focus goes back to where it came from. Focus in the stack opens the pile and pauses every timer until it leaves; a toast beyond the three shown is `inert` until it moves up. The swipe is for a pointer; the keyboard closes a toast with the button or Escape.

### Screen reader

- Live regions: two stand on the page before any toast arrives.
- Error: with `priority: 'high'`, an alert, read at once.
- Other toasts: a status, read at a pause.
- Content: each is read with its title and detail.
- Several: toasts that come together are read one after another in the order they came.
- Again: the same toast shown again while it stands is read once more.
- Silent: `announce: false` is not read (for a control that has already said it).
- Stack: a region named "Notifications (F8)".
- Close button: each is named "Close" and the toast's title.
- Action: its label, described by the toast's title, so F8 landing on it says what it acts on.
- Glyph: hidden.

### States

One toast per tone (`neutral` without a glyph, `success`, `danger`, `warning`, `info`); a glyph of its own; loading from `promise`, then a new toast with its outcome; with an action; open until closed (`persistent`); the same toast again, one card; long text wrapping and a detail cut at three lines; a pile of three with older ones peeking behind, opened under the pointer or the focus; placed at the start, the center or the end of the bottom edge, and at the top on a phone.

### When to use another component

- What the page needs to go on: UiModal or inline text.
- A question: UiConfirm.
- A field's validation: stays by the field in UiField.
- A load that failed: UiNoData `tone="danger"` with Retry, inline.

## Examples

### Undo

```vue
<script setup lang="ts">
import { UiButton, UiToaster, useToast } from 'grani-ui'

const toast = useToast()
</script>

<template>
  <UiButton
    variant="outline"
    @click="
      toast.show({
        title: 'Invoice deleted',
        action: { label: 'Undo', onClick: () => toast.success('Invoice restored') },
      })
    "
  >
    Delete with undo
  </UiButton>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Request

```vue
<script setup lang="ts">
import { UiButton, UiToaster, useToast } from 'grani-ui'

const toast = useToast()

let n = 0

const send = () =>
  toast.promise(new Promise<number>((resolve) => setTimeout(() => resolve(++n), 1500)), {
    loading: 'Sending the invoice',
    success: (id) => ({ title: `Invoice ${1040 + id} sent`, description: 'The client has it.' }),
    error: 'Could not send',
  })

// The returned promise fails as the request does: here the error toast is the whole answer.
const fail = () =>
  toast
    .promise(new Promise((_, reject) => setTimeout(() => reject(new Error('down')), 1500)), {
      loading: 'Saving',
      success: 'Saved',
      error: { title: 'Could not save', description: 'The server did not answer.' },
    })
    .catch(() => {})
</script>

<template>
  <UiButton variant="outline" @click="send">Send an invoice</UiButton>
  <UiButton variant="outline" @click="fail">Save and fail</UiButton>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Pile

```vue
<script setup lang="ts">
import { UiButton, UiToaster, useToast } from 'grani-ui'

const toast = useToast()

const burst = () => {
  toast.success('Invoice 1041 sent')
  toast.info('Reminder scheduled', { description: 'Tomorrow at 9:00' })
  toast.warning('Two items are out of stock')
  toast.error('Payment declined', { description: 'The card was refused by the bank.' })
  toast.success('Client updated')
}
</script>

<template>
  <UiButton variant="outline" @click="burst">Five at once</UiButton>
  <UiButton variant="ghost" @click="toast.close()">Close all</UiButton>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

### Persistent

```vue
<script setup lang="ts">
import { UiButton, UiToaster, useToast } from 'grani-ui'

const toast = useToast()
</script>

<template>
  <UiButton
    variant="outline"
    @click="
      toast.info('A new version is out', {
        duration: 'persistent',
        action: { label: 'Reload', onClick: () => toast.success('Reloaded') },
      })
    "
  >
    Stays until closed
  </UiButton>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiToaster />
</template>

```

## API

Props:
- `placement`: `"bottom" | "bottom-end" | "bottom-start"` = `bottom | bottom-end | bottom-start` (default `"bottom-start"`) — Where the stack stands on the bottom edge; `start` and `end` follow the reading direction.
Anything else lands on the root element: native attributes, aria-*, data-testid.

### `useToast()`

The queue behind UiToaster. Components call `toast.success(...)` and the toaster at the app root shows it. Feedback on an action goes here: a save that failed, a copy that worked; a field's validation stays by the field and a load error stays inline with its retry. The same toast again while one stands, with no action, is that one card, back at the front with its id.

Returns:
- `toasts`: `Readonly<Ref<readonly Toast[], readonly Toast[]>>` — Every toast in order of arrival, read-only.
- `stack`: `ComputedRef<Toast[]>` — The toasts in the stack, newest first; beyond the limit they wait, their clocks held.
- `show`: `(options: ToastOptions) => number` — Shows a toast from full options and returns its id.
- `update`: `(id: number, patch: Partial<ToastOptions>) => void` — Changes a toast by id in place; a new tone or duration restarts its clock.
- `close`: `(id?: number | undefined) => void` — Closes one toast by id, or all of them with no argument; an id that is `undefined` closes none.
- `promise`: `<T>(p: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>` — A request as toasts: `loading` while it runs, then a new one with `success` or `error`; a message that throws gives way to "Done" or "Could not complete the action".
- `success`: `(title: string, options?: Omit<ToastOptions, "title" | "tone">) => number` — `success(title, options?)`: a done action, "Invoice sent".
- `error`: `(title: string, options?: Omit<ToastOptions, "title" | "tone">) => number` — `error(title, options?)`: a failed action, read out at once, a little longer on screen.
- `warning`: `(title: string, options?: Omit<ToastOptions, "title" | "tone">) => number` — `warning(title, options?)`: done, with something to look at.
- `info`: `(title: string, options?: Omit<ToastOptions, "title" | "tone">) => number` — `info(title, options?)`: a fact worth a glance.

`ToastAction`

- `label`: `string` — The button's text: "Undo", "Open".
- `onClick`: `() => void` — Runs once, as the toast closes.

`ToastOptions`

- `title`: `string` — One line, the fact: "Invoice sent".
- `description`: `string` — A second line with the detail, optional.
- `tone`: `"neutral" | "success" | "warning" | "danger" | "info"` — Meaning, and with it the glyph and its color: `neutral` (default), `success`, `danger`, `warning`, `info`.
- `icon`: `Component` — A Lucide glyph in place of the tone's own; the tone still colors it.
- `loading`: `boolean` — A request in flight: a spinner instead of the glyph; `promise` sets it.
- `duration`: `number | "persistent"` — How long it stays once shown: 5 s by default, 7 s for `danger`, 13 s with an `action`.
- `priority`: `"low" | "high"` — How a screen reader hears it: `high` at once, `low` at a pause; `danger` is `high` by default.
- `action`: `ToastAction` — One button in the toast, "Undo" or "Open"; it never holds what the page needs to work.
- `announce`: `boolean` — `false` shows it unread: for an outcome the control has already announced where the focus is (a copy button's own live region).

`Toast`

- `id`: `number`
- `duration`: `number | "persistent"` — How long it stays once shown: 5 s by default, 7 s for `danger`, 13 s with an `action`.
- `priority`: `"low" | "high"` — How a screen reader hears it: `high` at once, `low` at a pause; `danger` is `high` by default.
- `again`: `number` — How many times the same toast came again while it stood; each time it is read again.
- `title`: `string` — One line, the fact: "Invoice sent".
- `description`: `string` — A second line with the detail, optional.
- `tone`: `"neutral" | "success" | "warning" | "danger" | "info"` — Meaning, and with it the glyph and its color: `neutral` (default), `success`, `danger`, `warning`, `info`.
- `icon`: `Component` — A Lucide glyph in place of the tone's own; the tone still colors it.
- `loading`: `boolean` — A request in flight: a spinner instead of the glyph; `promise` sets it.
- `action`: `ToastAction` — One button in the toast, "Undo" or "Open"; it never holds what the page needs to work.
- `announce`: `boolean` — `false` shows it unread: for an outcome the control has already announced where the focus is (a copy button's own live region).

`ToastPromiseMessages`: The three faces of `promise`: a title or full options, the last two maybe from the outcome.

- `loading`: `string | ToastOptions`
- `success`: `string | ToastOptions | ((value: T) => string | ToastOptions)`
- `error`: `string | ToastOptions | ((error: unknown) => string | ToastOptions)`

## How it behaves

### Outcome shown

- When: a request started by a button, such as a send or a save.
- Props: the button's `loading` while the request runs, then `toast.success` or `toast.error`.
- Guarantee: While the request runs, its button shows a spinner and ignores a second press. When the request completes, a message states the outcome, and a screen reader announces an error immediately.
- Without it: The button is pressed, and nothing says whether the request went or how it ended.
- Code: `sending.value = true
try {
  await send(invoice)
  toast.success('INV-0042 sent')
} catch {
  toast.error('Could not send', { description: 'Check the connection and send it again.' })
} finally {
  sending.value = false
}`
- Your part: Keep the button in `loading` until the request answers, then report the outcome with `toast.success` or `toast.error`; an error says what to do next. Where the button leaves the screen once pressed, as a menu row does, `toast.promise` shows the wait in a message instead.
- Proof, in the repository's tests (UiToaster.spec.ts, not in the package): "an error is an alert, the rest are status; the glyph follows the tone"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: a message with an action, such as Undo or Open.
- Props: `action: { label, onClick }`.
- Guarantee: The action closes its notification and runs once for that notification. Another press during the fade-out does not run it again.
- Without it: A double press on Undo restores the invoice twice.
- Code: `toast.show({ title: 'Invoice deleted', action: { label: 'Undo', onClick: restore } })`
- Your part: Nothing: `onClick` is called once.
- Proof, in the repository's tests (UiToaster.spec.ts, not in the package): "the action runs once and closes its toast", "a second click on the action during the leave fade does not run it twice"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Undo, not a question

- When: a change that can be reversed: a delete, an archive, a move.
- Props: `action: { label: 'Undo', onClick }` on the toast.
- Guarantee: A notification with Undo stays visible longer than one without an action. Its background fades to show the time remaining, and the timer pauses while the pointer is over the notifications or keyboard focus is inside them. Undo runs once for that notification.
- Without it: Either a delete is gone for good, or every delete first asks “Are you sure?”.
- Code: `toast.show({
  title: 'Invoice deleted',
  action: { label: 'Undo', onClick: restore },
})`
- Your part: Make the change, retain the information needed to reverse it, and connect the toast’s Undo action to that reversal.
- Proof, in the repository's tests (UiToaster.spec.ts, not in the package): "a toast with an action stays longer than one without", "A toast with an action shows its time as a haze over its whole stay; a plain one has none.", "the close button and Escape on a focused toast close it; the pointer on the stack holds the clocks", "the action runs once and closes its toast"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#ask-what-stays

### Shortcut keys

- When: a notification is shown, with a window open or not.
- Props: none: every UiToaster.
- Guarantee: F8 from anywhere on the page moves keyboard focus to the newest notification's action, or to its close button when it has none, and F8 again returns focus to where it was. With no notification on screen, the key is left to the page.
- Without it: A notification only the mouse can reach, gone before keyboard focus gets there.
- Code: `<UiToaster />`
- Your part: List F8 wherever your app lists its keys; the notification region already names it to a screen reader as “Notifications (F8)”.
- Proof, in the repository's tests (UiToaster.spec.ts, not in the package): "F8 moves the focus to the newest toast action; the region names the key", "F8 with no toast does nothing and leaves the key to the page"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#keyboard-actions

### Focus stays near

- When: A message closes while keyboard focus is in it: by Escape, its close button or its action.
- Props: none: every UiToaster.
- Guarantee: Keyboard focus goes back to where it was before it moved into the message, for example the field you were typing in, not to the start of the page.
- Without it: The message closes with keyboard focus inside it, focus is lost, and you have to find the field you were in again.
- Code: `<UiToaster />`
- Your part: Nothing.
- Proof, in the repository's tests (UiToaster.spec.ts, not in the package): "running the action from the keyboard gives the focus back where it came from"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useToast`, `useUiT`, `announce`.
