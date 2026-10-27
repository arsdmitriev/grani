# Modal (`UiModal`)

> Complete a short task in a dialog, such as filling a form or reviewing a record's details.

A component of grani-ui 0.1.0. Overlays, stable, since 0.1.0. Page: https://grani.arseni.work/components/modal

Also called dialog, modal dialog, window.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiButton, UiModal, UiField, UiInput, UiSelect, UiTextarea } from 'grani-ui'

const create = ref(false)

// A save with no name stops on the field: the window puts the cursor there. A save that passes
// waits for the server: the window holds every close until it answers.
const nameError = ref('')

const saving = ref(false)

const BLANK = { name: 'Acme Corp', country: 'nl', email: 'billing@acme.example', note: '' }

const client = ref({ ...BLANK })

// Typed but not saved: a click beside the window or Escape shakes it instead of closing.
const dirty = computed(() => JSON.stringify(client.value) !== JSON.stringify(BLANK))

function openCreate() {
  client.value = { ...BLANK }
  nameError.value = ''
  create.value = true
}

async function createClient() {
  nameError.value = client.value.name.trim() ? '' : 'Give the client a name'
  if (nameError.value) return
  saving.value = true
  await new Promise((r) => setTimeout(r, 900))
  saving.value = false
  create.value = false
}

const countries = [
  { value: 'nl', label: 'Netherlands' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
]
</script>

<template>
  <UiButton variant="outline" @click="openCreate">New client</UiButton>
  <UiModal
    v-model:open="create"
    title="New client"
    :persistent="dirty"
    :submitting="saving"
    form
    @submit="createClient"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <UiField label="Name" required :error="nameError"
          ><UiInput v-model="client.name" @input="nameError = ''"
        /></UiField>
        <UiField label="Country">
          <UiSelect v-model="client.country" :items="countries" class="w-full" />
        </UiField>
      </div>
      <UiField label="Email"><UiInput v-model="client.email" type="email" /></UiField>
      <UiField label="Note"><UiTextarea v-model="client.note" /></UiField>
    </div>
    <template #footer>
      <UiButton variant="secondary" :disabled="saving" @click="create = false">Cancel</UiButton>
      <UiButton type="submit" :loading="saving">Create client</UiButton>
    </template>
  </UiModal>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- See one window at a time.
- Go straight to the field that needs fixing.
- Submit a form with Enter.
- Submit from a text box with Ctrl or Cmd+Enter.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Give a question about the window `role="alertdialog"` (UiConfirm has it). Bind `open` with `v-model`: the first window closes by its `update:open` and says `close`, as on any close. Mark a window holding input `persistent`, so another window does not take its place.
- Check the form in your `submit` handler and set the field's `error` there, before any `await`: the window looks for the first error right after the submit. An error the server returns after an `await` is focused when `submitting` falls: keep `submitting` true while the request is out and mark the field no later than you lower it. In a custom form, mark the field, wait for the render (`await nextTick()`), then call `focusInvalid(root)` from `grani-ui` with an element of yours around the fields.
- Make the main action a `type="submit"` button in `#footer`, and set `submitting` while the save runs.

## Why it works this way

A window over the page for one task: a short form, a question, a detail. Take it when the task needs the person's whole attention.

**Closing.** `title` names the window and `description` describes it. The backdrop, Escape and the cross close it. Escape works only while the window is the top layer, so a confirm over a drawer closes first. `persistent` guards unsaved input: the backdrop and Escape are refused with a shake, but the cross still closes, since pressing it is an explicit intent. `submitting` refuses every close while a request is out. These guard only the window's own exits; `open` set to false from outside is for the host to guard.

Over a window. One window is seen at a time. A window opened from a window takes its place: the first closes, and when the new one closes the focus returns to what opened the first. A question (`role="alertdialog"`, UiConfirm) is about the window under it: it hides that window, out of sight and out of reach, and when it is answered the window comes back as it was, the focus on what asked. A window holding unsaved input (`persistent`) or a request (`submitting`) is not replaced: it waits hidden in the same way. The tint on the page stays as it was. A drawer is not hidden: a window over it leaves it in view.

**Layout.** Attributes land on the dialog. The page under it does not scroll; a long body scrolls between the header and the footer. The footer's buttons share its width, so two buttons take half each.

**Kept pages.** In a page that a `KeepAlive` keeps, a window left open stays open when the page is deactivated: its layer, its Escape and its scroll lock go on over the next page. Close it (`open` false) when the route changes.

**Question.** `role="alertdialog"` is a question that needs an answer (UiConfirm): the backdrop does not close it, and the focus starts on the first button of the footer, the safe one.

**Result.** `align="center"` shows a result after an action: `#media` (a glyph) over a centered title, with no lines between the parts.

**Header.** `#header` puts a header of the window's own in place of the title and the cross (a search field over its results); the title stays for a screen reader.

**Form.** With `form` the body and the footer become a form that sends `submit`. The main action is `type="submit"`; Enter in a field, and Cmd+Enter or Ctrl+Enter from a text box, send it. The shortcut presses that button, so while the button is held or spinning, the shortcut does nothing either. One request gets one submit. A submit that leaves a field `aria-invalid` puts the focus on the first such field and scrolls it into view; the form is ready again as soon as the person moves to fix it. An answer that comes later and marks a field does the same when `submitting` falls, unless the person went on typing in another field meanwhile. Do not put a form of your own in the slot. `submit` carries nothing: a window has one way to send, its main action. UiCrudDrawer's `submit` carries `{ another }`, since its Save can also mean "save and start the next record".

### Keyboard

The focus starts on the first field (a drawn select, date, switch, scale, drop zone or date range too), not on the cross. With no field it starts on a body longer than the window, so the arrows scroll it at once, else on the window itself; `role="alertdialog"` starts it on the first button of the footer. On close the focus returns to where it was.
- `Tab`: goes round inside the window; a body longer than the window is one of its stops.
- `ArrowUp` `ArrowDown` `PageUp` `PageDown` `Home` `End`: scroll that body once it holds the focus.
- `Escape`: closes the window, only while it is the top layer; `persistent` answers it with a shake, and `submitting` refuses it.
With `form`:
- `Enter`: in a field, sends the form.
- `Meta+Enter` `Ctrl+Enter`: send it from a text box too (`Meta` is Cmd).
A submit that leaves a field `aria-invalid` puts the focus on the first one.

### Screen reader

- Window: a modal dialog (`aria-modal`) named by `title` (`aria-labelledby`) and described by `description`. With `#header` the title is still read, and a question (`alertdialog`) with no description is described by its body.
- Cross: named "Close".
- Long body: a region named by the title, so the reader says what the keys scroll through.
- Errors: a refused submit marks the field in error `aria-invalid`.
- Refused close: a shake for the eye; the reader keeps the focus where it was and hears why, from a status region inside the window: input not saved, or a request still on its way. A question refuses a press beside it with the shake alone: its answers are in reach.
- Refused submit: the reader hears the field in error the focus moved to.
- A window under another: out of the reader's reach until it comes back; then the reader hears it and the control the focus returned to.

### States

A form; a long body that scrolls between the header and the footer; a detail of rows running edge to edge (`padded` off); a question (`role="alertdialog"`); a result (`align="center"`); a search (`#header`); a window opened from a window, in its place; a question over a window, the one under hidden. `persistent` shakes at the backdrop and Escape; a submit the host refuses by marking a field as it gets it shakes too; `submitting` refuses every close and a second submit. Sizes `sm` and `md`, in both themes.

### When to use another component

- A record to edit: UiCrudDrawer.
- A side panel beside a list: UiDrawer, to read or set at the side of the screen.
- A small panel of controls under a button: UiPopover, with the page live.
- A yes-or-no question: UiConfirm, built on this window.
- The outcome of an action: a toast from `useToast` in UiToaster.

## Examples

### Long

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal } from 'grani-ui'

const terms = ref(false)
</script>

<template>
  <UiButton variant="outline" @click="terms = true">Read the terms</UiButton>
  <UiModal v-model:open="terms" title="Terms of the service" size="md">
    <div class="flex flex-col gap-4 text-sm text-fg-muted">
      <p v-for="n in 14" :key="n">
        {{ n }}. The service keeps your records for as long as the account is open and for thirty
        days after it closes, so a closed account can be opened again with everything in place.
      </p>
    </div>
    <template #footer>
      <UiButton @click="terms = false">Close</UiButton>
    </template>
  </UiModal>
</template>

```

### Detail

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Copy, ExternalLink } from '@lucide/vue'
import { UiButton, UiModal, UiList, UiListItem, UiBadge } from 'grani-ui'

const detail = ref(false)

const invoice = [
  { key: 'Total', value: '€1 240.00' },
  { key: 'Issued', value: 'Sep 3, 2026' },
  { key: 'Paid on', value: 'Sep 12, 2026' },
]
</script>

<template>
  <UiButton variant="outline" @click="detail = true">INV-0042</UiButton>
  <UiModal
    v-model:open="detail"
    size="sm"
    :padded="false"
    title="INV-0042"
    description="Acme Corp"
  >
    <UiList>
      <UiListItem title="Status">
        <template #actions><UiBadge tone="success" label="Paid" /></template>
      </UiListItem>
      <UiListItem v-for="row in invoice" :key="row.key" :title="row.key">
        <template #actions>
          <span class="text-sm tabular-nums text-fg">{{ row.value }}</span>
        </template>
      </UiListItem>
    </UiList>
    <template #footer>
      <UiButton variant="secondary"><Copy />Copy link</UiButton>
      <UiButton><ExternalLink />Open invoice</UiButton>
    </template>
  </UiModal>
</template>

```

### Question

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal } from 'grani-ui'

const ask = ref(false)
</script>

<template>
  <UiButton variant="outline" tone="danger" @click="ask = true">Delete the order</UiButton>
  <UiModal v-model:open="ask" role="alertdialog" size="sm" title="Delete the order?">
    <p class="text-sm text-fg-muted">
      The order and its payments are removed. This cannot be undone.
    </p>
    <template #footer>
      <UiButton variant="secondary" @click="ask = false">Cancel</UiButton>
      <UiButton tone="danger" @click="ask = false">Delete</UiButton>
    </template>
  </UiModal>
</template>

```

### Over a window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiModal, UiField, UiInput, UiList, UiListItem } from 'grani-ui'

// A question asked from a window hides it: one window is seen, and the form comes back after.
const editing = ref(false)

const dropping = ref(false)

const invoices = ref(false)

const company = ref('Acme Corp')

function drop() {
  dropping.value = false
  editing.value = false
}
</script>

<template>
  <UiButton variant="outline" @click="editing = true">Edit the client</UiButton>
  <UiModal v-model:open="editing" size="sm" title="Edit the client">
    <UiField label="Name"><UiInput v-model="company" /></UiField>
    <!-- Another window from this one takes its place; the question below stands over it. -->
    <UiList class="mt-4">
      <UiListItem as="button" step title="Invoices" @click="invoices = true" />
    </UiList>
    <template #footer>
      <UiButton variant="secondary" tone="danger" @click="dropping = true">Delete</UiButton>
      <UiButton @click="editing = false">Save</UiButton>
    </template>
  </UiModal>
  <UiModal v-model:open="invoices" size="sm" :padded="false" :title="`Invoices of ${company}`">
    <UiList>
      <UiListItem title="INV-0042" description="Due Sep 30" />
      <UiListItem title="INV-0041" description="Paid" />
    </UiList>
    <template #footer>
      <UiButton @click="invoices = false">Close</UiButton>
    </template>
  </UiModal>
  <UiModal v-model:open="dropping" role="alertdialog" size="sm" :title="`Delete ${company}?`">
    <p class="text-sm text-fg-muted">The client and its invoices are removed.</p>
    <template #footer>
      <UiButton variant="secondary" @click="dropping = false">Cancel</UiButton>
      <UiButton tone="danger" @click="drop">Delete</UiButton>
    </template>
  </UiModal>
</template>

```

### Result

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Check } from '@lucide/vue'
import { UiButton, UiModal } from 'grani-ui'

const sent = ref(false)
</script>

<template>
  <UiButton variant="outline" @click="sent = true">Send the invoice</UiButton>
  <UiModal
    v-model:open="sent"
    size="sm"
    align="center"
    title="Invoice sent"
    description="Acme Corp gets it at billing@acme.example."
  >
    <template #media>
      <span
        class="flex h-12 w-12 items-center justify-center rounded-pill bg-success-subtle text-success-subtle-fg"
        ><Check
      /></span>
    </template>
    <template #footer>
      <UiButton @click="sent = false">Done</UiButton>
    </template>
  </UiModal>
</template>

```

### Search

```vue
<script setup lang="ts">
import { Search } from '@lucide/vue'
import { ref } from 'vue'
import { UiButton, UiModal, UiInput } from 'grani-ui'

// A window whose header is a search over its results: UiInput `variant="bare"` in `#header`.
const searching = ref(false)

const find = ref('')

const PAGES = ['Invoices', 'Clients', 'Payments', 'Reports']
</script>

<template>
  <UiButton variant="outline" @click="searching = true">Open the search</UiButton>
  <UiModal v-model:open="searching" title="Search" :padded="false">
    <template #header>
      <UiInput
        v-model="find"
        variant="bare"
        type="search"
        placeholder="Search pages"
        ariaLabel="Search pages"
        class="w-full"
      >
        <template #start><Search aria-hidden="true" /></template>
      </UiInput>
    </template>
    <p
      v-for="page in PAGES.filter((p) => p.toLowerCase().includes(find.trim().toLowerCase()))"
      :key="page"
      class="px-overlay py-2.5 text-sm text-fg"
    >
      {{ page }}
    </p>
  </UiModal>
</template>

```

## API

Props:
- `title`: `string` (required) — The window's name, read first by a screen reader; required, a dialog without one is mute.
- `description`: `string` (default `""`) — One line under the title, read right after it.
- `size`: `"sm" | "md"` = `sm | md` (default `"md"`) — Width: `sm` for a question or a short form, `md` for a form with a few rows.
- `persistent`: `boolean` (default `false`) — Unsaved input: the backdrop and Escape are refused with a shake; the cross still closes.
- `submitting`: `boolean` (default `false`) — A request is out (a save, a delete): every close is refused with a shake, and no second submit goes.
- `role`: `"dialog" | "alertdialog"` = `dialog | alertdialog` (default `"dialog"`) — `alertdialog` for a question that needs an answer: the backdrop does not close it, focus starts on the footer's first button.
- `padded`: `boolean` (default `true`) — `false` for rows edge to edge (a detail of key and value): the body keeps no padding of its own.
- `align`: `"start" | "center"` = `start | center` (default `"start"`) — `center` for a result after an action: a glyph over a centered title, no lines between the parts.
- `form`: `boolean` (default `false`) — The body and the footer are a form: its `type="submit"` button, Enter in a field and Cmd+Enter from a text box send `submit`. Off, a question or a detail keeps its buttons plain.
- `open`: `boolean` (default `false`) — Whether the window is open (`v-model:open`); every way out sets it false and emits `close`.
Attributes are placed by the component itself: its description says where.

Events:
- `submit` — The form was sent, with `form`: its `type="submit"` button, Enter in a field, Cmd+Enter from a text box.
- `update:open` (`value: boolean`) — The new value of `open`, for `v-model:open`.
- `close` — The window closed: the cross, the backdrop, Escape, or another window that took its place. A window whose input must not go that way is `persistent`.

Slots:
- `default` with `Record<string, never>` — The body. It scrolls when long; the header and the footer stay.
- `media` with `Record<string, never>` — A glyph over the title with `align="center"`: a check in a halo after a sent invoice. The window sizes it.
- `header` with `Record<string, never>` — The window's own header in place of the title, the description and the cross: a search field, as a palette's. The title is still read by a screen reader; Escape and the backdrop close. It stands alone: no `#media`, no `align="center"`.
- `footer` with `Record<string, never>` — Actions, sharing the footer's width in equal parts: the cancel is `secondary` and first, the main action last.

## How it behaves

### One window seen

- When: a window opens while another window is open.
- Props: `role="alertdialog"` for a question about the window under it; every UiModal, UiConfirm included.
- Guarantee: A window opened from a window takes its place: the first closes, and when the new one closes keyboard focus returns to what opened the first. A question is different: the window underneath is hidden from sight, from the keyboard and from screen readers while it asks, and comes back as it was once it is answered, with keyboard focus on the button that asked. Either way the page keeps one dimmed backdrop instead of two.
- Without it: Two windows sit on top of each other over a doubly dimmed page, and it is hard to tell which one is asking.
- Code: `<UiModal v-model:open="editing" title="Edit the client">…</UiModal>
<UiModal v-model:open="dropping" role="alertdialog" title="Delete the client?">…</UiModal>`
- Your part: Give a question about the window `role="alertdialog"` (UiConfirm has it). Bind `open` with `v-model`: the first window closes by its `update:open` and says `close`, as on any close. Mark a window holding input `persistent`, so another window does not take its place.
- Not covered: A window with unsaved input (`persistent`) or a request on its way (`submitting`) is not closed for another: it waits hidden under the new one and comes back.
- Proof, in the repository's tests (UiModal.spec.ts, not in the package): "a window opened from a window takes its place: the first closes, and the focus goes back to what opened it", "a window opened over a window hides it, out of sight and out of reach; one is seen", "a window that is persistent is not replaced: it waits under the new one and comes back", "a window that is submitting is not replaced: it waits under the new one and comes back", "a question over a window does not take its place: the window comes back once it is answered", "a window opened while a menu of the window is still open takes its place", "three windows: only the top one is seen, and they come back one by one", "closed from outside, the one on top brings the one under back before the focus goes in"
- Pattern for all components: https://grani.arseni.work/patterns/closing#one-window

### Focus on the error

- When: a window with `form` is sent, and the app marks a field with an error.
- Props: `form`, a field with `error` (`aria-invalid`) set as the submit is checked.
- Guarantee: The dialog moves keyboard focus to the first field with an error and scrolls it into view, so you can start correcting immediately. A shake shows that the submission was rejected. Once you start correcting, Save becomes available for another attempt.
- Without it: The error appears under its field while keyboard focus stays on Save, and you have to find what went wrong.
- Code: `<UiModal v-model:open="open" title="New client" form @submit="save">
  <UiField label="Email" :error="emailError"><UiInput v-model="email" /></UiField>
</UiModal>`
- Your part: Check the form in your `submit` handler and set the field's `error` there, before any `await`: the window looks for the first error right after the submit. An error the server returns after an `await` is focused when `submitting` falls: keep `submitting` true while the request is out and mark the field no later than you lower it. In a custom form, mark the field, wait for the render (`await nextTick()`), then call `focusInvalid(root)` from `grani-ui` with an element of yours around the fields.
- Proof, in the repository's tests (UiModal.spec.ts, not in the package): "a submit that leaves a field invalid puts the focus on the first one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Submit a form with Enter

- When: The window has `form`, and you are typing in a single-line field.
- Props: `form`, a `type="submit"` button in `#footer`.
- Guarantee: Enter in the field submits the form, as a browser does when a form has a submit button. A second Enter emits no second `submit` until the save ends, or until you move in the form or change it.
- Without it: You have to leave the field and move to Save, and a quick second Enter sends the form twice.
- Code: `<UiModal v-model:open="open" title="Rename" form :submitting="saving" @submit="save">
  <UiField label="Name"><UiInput v-model="name" /></UiField>
  <template #footer><UiButton type="submit">Save</UiButton></template>
</UiModal>`
- Your part: Make the main action a `type="submit"` button in `#footer`, and set `submitting` while the save runs.
- Proof, in the repository's tests (UiModal.spec.ts, not in the package): "Enter in a single-line field submits: the field and Save stand in one form", "a second submit before the host answers emits no second submit"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#enter-saves

### Cmd+Enter sends

- When: The window has `form`, and you are typing in a text box.
- Props: `form`, a `type="submit"` button in `#footer`.
- Guarantee: Ctrl+Enter or Cmd+Enter in a text field activates the form’s submit button. It does nothing while the button is disabled or loading, or while focus is on Cancel. In a multiline field, Enter alone still inserts a line break.
- Without it: You have to leave the text field and move to Save before you can submit the form.
- Code: `<UiModal v-model:open="open" title="Note" form @submit="save">
  <UiField label="Note"><UiTextarea v-model="note" /></UiField>
  <template #footer><UiButton type="submit">Save</UiButton></template>
</UiModal>`
- Your part: Nothing beyond the `type="submit"` button in `#footer` that Enter needs too: the shortcut presses it.
- Proof, in the repository's tests (UiModal.spec.ts, not in the package): "Cmd+Enter in a textarea submits; Enter alone does not"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#meta-enter-saves


The patterns: https://grani.arseni.work/patterns

## Built on it

- [Confirm](https://grani.arseni.work/components/confirm): Check a decision before an action that cannot be undone, and show progress while the confirmed action runs.

Built with what `grani-ui` exports: `useSubmitLock`, `focusInvalid`, `useUiT`.
