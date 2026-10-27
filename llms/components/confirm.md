# Confirm (`UiConfirm`)

> Check a decision before an action that cannot be undone, and show progress while the confirmed action runs.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/confirm

Also called confirmation dialog, confirm dialog, alert dialog.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

It works on top of [Modal](https://grani.arseni.work/components/modal).

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Trash2 } from '@lucide/vue'
import { UiStack, UiCard, UiList, UiListItem, UiIconButton, UiButton, UiSwitch, UiConfirm, UiToaster, useConfirm } from 'grani-ui'

const { confirm } = useConfirm()

// A list of orders: deleting one asks first, waits for the server, then the row leaves.
const ORDERS = [
  { id: 'ORD-1041', client: 'Acme Corp', total: '€1 240.00' },
  { id: 'ORD-1042', client: 'Birch & Co', total: '€380.00' },
  { id: 'ORD-1043', client: 'Cedar Ltd', total: '€2 115.50' },
]

const orders = ref([...ORDERS])

const fail = ref(false)

// The request behind the answer: a second the server takes, and its outcome.
const deleteOrder = (id: string) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (fail.value) return reject(new Error('offline'))
      orders.value = orders.value.filter((o) => o.id !== id)
      resolve()
    }, 1000),
  )

function remove(id: string) {
  void confirm({
    title: `Delete ${id}?`,
    message: 'The order and its payments are removed. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
    action: () => deleteOrder(id),
    success: `${id} deleted`,
    error: `Could not delete ${id}`,
  })
}

const restore = () => (orders.value = [...ORDERS])
</script>

<template>
  <UiStack class="w-full max-w-md">
    <UiCard :padded="false">
      <UiList>
        <UiListItem v-for="o in orders" :key="o.id" :title="o.id" :description="o.client">
          <template #actions>
            <span class="text-sm tabular-nums text-fg">{{ o.total }}</span>
            <UiIconButton
              :icon="Trash2"
              variant="ghost"
              tone="danger"
              :ariaLabel="`Delete ${o.id}`"
              @click="remove(o.id)"
            />
          </template>
        </UiListItem>
        <UiListItem v-if="!orders.length" title="No orders left">
          <template #actions>
            <UiButton variant="outline" size="xs" @click="restore">Bring them back</UiButton>
          </template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiSwitch v-model="fail">The server fails</UiSwitch>
  </UiStack>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiConfirm />
  <UiToaster />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See whether an action worked.
- Ignore extra presses while a request runs.
- Confirm only what cannot be undone.
- Open with keyboard focus where the task begins.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Supply `action` so the dialog can track the request. Add `success` only when the result is not already clear from a change on the page.
- Pass the request as `action` instead of running it after the answer, and give it a timeout of its own: a request that never settles keeps the dialog open.
- Ask only before what cannot be reversed. A change that can be reversed is done at once and offered back with Undo in a toast. Remove the row inside `action`, with the request: a Retry after a failure runs the same `action`, and removes it then.
- Ask with `confirm`, and name the action on its button with `confirmLabel`, such as Delete or Leave.

## Why it works this way

The host of `useConfirm`, mounted once at the app root beside UiToaster. Take it to ask a yes-or-no question before an action.

**Root.** A question asked in an app without one is never shown and never answered, and dev says so once.

**Window.** It asks in a UiModal with `role="alertdialog"`. A press on the backdrop does not answer; Escape and the cross answer no. Asked from a window, it hides that window until it is answered; the window then comes back, with the focus on what asked.

**Action.** With an `action`, the window sends the request, waits for it, and closes into a toast. If the request fails, the toast's Retry asks the question again. A new question answers the open one `false`; an action already on its way then reports nothing. Remove a row inside `action`, so the Retry after a failure removes it too; a UiTable then takes the focus from the window to the same button of the row now in its place. Every way out is refused while the request runs, so one that never settles holds the window open: give the `action` a timeout of its own, which fails it into the error toast.

**Leaving.** A question is never left hanging. When the app has a router and the page changes, or when UiConfirm itself unmounts, the open question is answered no. A question whose action is already running is not cut off: the request's outcome answers it.

### Keyboard

The window's keys; the focus starts on the cancel button, and so does a new question asked in place of an open one.
- `Tab`: goes round the two buttons.
- `Enter` `Space`: press the one in focus.
- `Escape`: answers no; while the action is running, it is refused with a shake.
While the action is running, a second press on the confirm button sends nothing. On close the focus returns to what asked.

### Screen reader

- Window: an alert dialog (`role="alertdialog"`, `aria-modal`) named by `title` ("Are you sure?" when there is none) and described by `message`, the sentence in its body.
- Confirm button: while the action runs, says busy (`aria-busy`) under its spinner.
- Outcome: a failure is announced at once as an error toast with Retry; a success is announced only with `success`.

### States

Asked, with Cancel and Confirm; `tone="danger"`, with a red confirm button; busy, with the confirm button loading and every close refused; answered, closed with nothing more, or with a success toast when `success` is set; failed, closed into an error toast whose Retry asks again. A new question, a change of page or an unmounted host answers the open one with `false`.

### When to use another component

- A short form or a detail: UiModal.
- A question with a field in it (a reason to type): UiModal `role="alertdialog"`.
- A record: UiCrudDrawer.
- An outcome with nothing to answer: a toast from `useToast` in UiToaster.

## Examples

### Plain

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiStack, UiButton, UiConfirm, UiToaster, useConfirm } from 'grani-ui'

const { confirm } = useConfirm()

// A plain question: nothing to wait for, the answer is all.
const last = ref('')

async function leave() {
  const yes = await confirm({
    message: 'Leave the page? The draft stays saved.',
    confirmLabel: 'Leave',
  })
  last.value = yes ? 'Left' : 'Stayed'
}
</script>

<template>
  <UiStack align="center">
    <UiButton variant="outline" @click="leave">Leave the page</UiButton>
    <!-- The line is always there: an answer arriving does not move the button. -->
    <p class="h-5 text-sm text-fg-muted">{{ last && `Answer: ${last}` }}</p>
  </UiStack>
  <!-- Once, at the app's root: leave out what the app has there already. -->
  <UiConfirm />
  <UiToaster />
</template>

```

## API

No props, events or slots of its own. Anything else lands on the root element: native attributes, aria-*, data-testid.

### `useConfirm()`

Asks a question of the person: `if (await confirm({ message })) remove()`. The `<UiConfirm />` mounted once at the app root shows it and answers; a new question answers the open one `false`.

Returns:
- `confirm`: `(options: ConfirmOptions | string) => Promise<boolean>`

`ConfirmOptions`: `if (await confirm({ message })) remove()`, answered by one `<UiConfirm />`; a new question answers the open one `false`.

- `title`: `string` — The question in a few words; defaults to "Are you sure?".
- `message`: `string` — What happens, in a sentence: "The order and its payments are removed."
- `confirmLabel`: `string` — The confirm button's label: the action itself, "Delete", beats "Confirm".
- `cancelLabel`: `string` — The cancel button's label; defaults to "Cancel".
- `tone`: `"brand" | "danger"` — `danger` for what cannot be undone: the confirm button turns red.
- `action`: `(() => Promise<unknown>)` — The request the answer sends. The window waits for it (the button loads, a second press sends nothing), then closes; a failure closes into an error toast whose Retry asks again. Every way out is refused while it runs, so give it a timeout of its own: a promise that never settles holds the window.
- `success`: `string` — The success toast, when the result is not in view (a row left a list below the window); without it the window only closes.
- `error`: `string` — The error toast's title; defaults to "It did not go through".

## How it behaves

### Outcome shown

- When: a question asked with an `action`.
- Props: `success` and `error` beside `action`.
- Guarantee: The dialog closes when its `action` finishes. If the action fails, an error message appears with Retry, which opens the confirmation again. If it succeeds, a message appears only when you supply `success`, for cases where nothing on the page shows the result.
- Without it: The dialog closes, and nothing says the delete failed.
- Code: `await confirm({ title, message, action, success: 'Order deleted', error: 'Could not delete' })`
- Your part: Supply `action` so the dialog can track the request. Add `success` only when the result is not already clear from a change on the page.
- Proof, in the repository's tests (UiConfirm.spec.ts, not in the package): "a failure closes the question into an error toast whose Retry asks again", "success says so in a toast only when asked to"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: a question asked with an `action`.
- Props: `confirm({ ..., action: () => request })`.
- Guarantee: The confirmation stays open while its `action` runs. Its button shows a spinner and ignores further presses. Escape and a click outside do not close the dialog until the request finishes.
- Without it: The dialog closes before the result is known, and a quick second press can send the delete again.
- Code: `await confirm({ title, message, confirmLabel: 'Delete', action: () => api.remove(id) })`
- Your part: Pass the request as `action` instead of running it after the answer, and give it a timeout of its own: a request that never settles keeps the dialog open.
- Proof, in the repository's tests (UiConfirm.spec.ts, not in the package): "the window waits for the action: the button loads, a second press sends nothing, Escape is refused"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Undo, not a question

- When: an action with irreversible consequences, such as permanently deleting a record or sending a message that cannot be recalled.
- Props: `confirm({ title, confirmLabel, tone: 'danger' })`.
- Guarantee: Nothing happens until you answer the question. The confirmation button names the action, such as “Delete”, and keyboard focus starts on Cancel. The dialog returns `true` or `false`, and an `action` you pass runs only after confirmation.
- Without it: “Are you sure?” before every delete, until the question gets answered without reading.
- Code: `await confirm({ title: 'Delete ORD-1041?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger', action: () => api.delete(id).then(() => remove(id)) })`
- Your part: Ask only before what cannot be reversed. A change that can be reversed is done at once and offered back with Undo in a toast. Remove the row inside `action`, with the request: a Retry after a failure runs the same `action`, and removes it then.
- Not covered: A row of a list of your own removed inside `action` takes the focus with it to the page: the window gives it back to a button that is gone. In a UiTable the focus goes to the same button of the row now in its place.
- Proof, in the repository's tests (UiConfirm.spec.ts, not in the package): "asks in an alert dialog and answers true on confirm", "cancel, Escape and the cross answer false", "a row removed inside the action goes after a failure too: the Retry runs the same action", "a row removed inside the action hands the focus on too: the window gives it to the same button of the row now in its place", "Cancel with an action runs nothing, even a press on the confirm button in the same moment"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#ask-what-stays

### Focus starts inside

- When: you are asked to confirm an action.
- Props: none: every question asked with `confirm`.
- Guarantee: Keyboard focus starts on Cancel, the safe answer, so an Enter pressed by habit cancels the action instead of confirming it.
- Without it: Keyboard focus starts on the red Delete button, and an Enter pressed by habit deletes the order.
- Code: `await confirm({ title: 'Delete ORD-1041?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })`
- Your part: Ask with `confirm`, and name the action on its button with `confirmLabel`, such as Delete or Leave.
- Proof, in the repository's tests (UiConfirm.spec.ts, not in the package): "asks in an alert dialog and answers true on confirm"
- Pattern for all components: https://grani.arseni.work/patterns/opening#focus-start


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useConfirm`, `useToast`, `useUiT`.
