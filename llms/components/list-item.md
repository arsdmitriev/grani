# List item (`UiListItem`)

> Show one row with a title and description and an action or value beside it.

A component of grani-ui 0.1.0. Layout, stable, since 0.1.0. Page: https://grani.arseni.work/components/list-item

Also called list row, setting row, cell.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { BadgeCheck } from '@lucide/vue'
import { UiCard, UiList, UiListItem, UiAvatar, UiButton, UiBadge } from 'grani-ui'
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem title="Anna Petrova" description="anna@work">
        <template #media><UiAvatar name="Anna Petrova" /></template>
        <template #actions><UiButton variant="ghost">Edit</UiButton></template>
      </UiListItem>
      <UiListItem title="Ivan Sidorov" description="ivan@work">
        <template #media><UiAvatar name="Ivan Sidorov" /></template>
        <template #actions><UiButton variant="ghost">Edit</UiButton></template>
      </UiListItem>
      <UiListItem title="Verified" description="The account passed the check.">
        <template #media><BadgeCheck aria-hidden="true" /></template>
        <template #actions><UiBadge tone="success" label="Done" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Ignore extra presses while a request runs.
- Show the error where the hint was.
- Go straight to the field that needs fixing.
- Name states in words, not color alone.
- Toggle or pick by clicking the words.
- Know when a link opens a new tab.
- Open a related record inside the drawer.
- Name each field once for screen readers.
- Announce required fields in words.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set `loading` from the press until the request answers.
- Write the error as what to do, about as long as the description.
- Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Write the title and the text; the tone word comes from the library. An icon of your own in `#media` must show the tone as plainly.
- Put exactly one control in `#actions`: a label names one control.
- Pass the address in `to`; nothing else is needed.
- When the row is pressed, open the step in the drawer the row stands in.
- Put one control in `#actions`, with no text or `ariaLabel` of its own.
- Set `required` on the row instead of typing an asterisk into the title. The app still checks the answer.

## Why it works this way

One row, a title and its text on the left and a thing on the right. Take it for every row: a plain one, a link, a setting, a command, a notice; rows one under another stand in a UiList.

**Anatomy.** It is the library's one row: media, text and actions, centered on the row. A component with text on the left and a thing on the right stands on a UiListItem and does not draw its own row.

**Modes.** A row is one of four, told apart by its props and checked by TypeScript: a plain row; a link (`to`); a field (`as="label"`); a command (`as="button"`, with `step`, `loading` and `tone="danger"`). A prop of another mode is a type error, such as `step` on a link or `error` on a command.

**Link.** With `to`, the whole row is a link ending in a chevron that slides on hover; a page on another site opens in a new tab and ends in an arrow instead, as with UiLink. A link holds no interactive actions, a badge or a text at most, because a button inside a link makes two controls in one.

**Lines.** A row draws no line of its own: the UiList it stands in divides its rows, so a card of rows is UiCard `:padded="false"` around a UiList.

**Notice.** With `tone` a plain row is a notice, read as a status, with the glyph of its tone first (`#media` gives another) and its tone said to a screen reader; `xs` outline buttons go in `#actions`. It replaces a callout: a title, text, an action. Alone (over a form, in a toast) it is drawn like a toast: a white card whose start edge is in the tone. In a UiList it is a row of the list: the rows' edges, height and lines, no card of its own, and the tone's 3px edge at the start along the whole row; `variant="soft"` fills that row with the tone's pale plate as well, as on a soft badge.

**Field.** `as="label"` makes the row a field: the title names the one control in `#actions` (a UiSwitch, a UiCheckbox, a UiSelect), the description or `error` describes it, `required` marks it, and a click anywhere on the row reaches it. A setting row is this, with a UiSwitch in `#actions`.

**Command.** `as="button"` makes the row a command: the whole row is a button, with a status glyph in `#actions` (a check, a trash can). `loading` puts a spinner in the glyph's place and refuses clicks while the focus stays. `tone="danger"` is the red ink of a command that cannot be undone. `step` ends the row in a chevron, as on a link: the row goes one level in, to a step of UiCrudDrawer (Rules, Move to), with a count or a word in `#actions`. Such rows one after another form the action block of a record. In UiMenu a command row is an item of the menu, drawn by the menu as a row of its panel list.

**Lit.** `lit` lights a row for a moment: the one UiListField just added, or the one a refused repeat points at.

**Placement.** It stands in a UiList in a card, in a drawer section, in a dropzone's file list; alone in a toast and in a table's error row and bulk bar. Its neighbors are UiField (a label above its control) and UiButton. A link or a command row holds no control in `#actions`, and warns if it does. The chevron and the text follow the reading direction.

**Highlight.** `highlight` marks the letters a search found.

### Keyboard

A plain row takes no focus; the controls in `#actions` do.
With `to`, the whole row is a link:
- `Enter`: follows it.
With `as="button"`, a native button:
- `Enter` `Space`: press it; `loading` or `disabled` refuses the press in the capture phase, before the router sees it, keeping the focus while loading. A held Enter is one press: its repeats press nothing.
`as="label"` reaches its one control with a click anywhere on the row; the control keeps its own keys.

### Screen reader

- Row: the title, then the description; `highlight` marks letters for the eye only.
- Label row: names its control by the title (`aria-labelledby`), describes it by the description or the error (`aria-describedby`), and marks it `aria-invalid` and `aria-required`; the error is an alert.
- Notice: a `status` that says its tone in words before the title. It appears with its words, which is often not read out; what must be heard goes through a toast (UiToaster).
- Link: to another site, says it opens a new tab.
- Command: says busy while loading (`aria-busy`, `aria-disabled`).
- Glyphs: the chevron and the tone glyph are hidden.
- In a list: in a UiList it is a list item.

### States

Rest; hover and focus as a band on a link or a command; `disabled`, in the disabled ink and cursor, not faded; `loading`, a spinner in place of the glyph, with the ink kept; `tone` as the ink of a command (`danger` red, `brand` for the one that creates something new), or as a notice on a plain row (a card alone, a row with the tone's edge in a list, `soft` filled there); `lit`, a moment of brand color; a label row whose control is disabled, with the title muted; `step`, a chevron at the end. A row of a list is 44px tall at `sm` and 56px at `md`: a second line of text grows it, a control in `#actions` does not (up to the row's own height, 44 and 56).

### When to use another component

- A field with its label above its control: UiField.
- An action on its own: UiButton.
- A list of names that grows from its last row: UiListField.
- A message about a request: a toast through UiToaster.
- Why a list is empty: UiNoData.

## Examples

### Link

```vue
<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { UiListItem } from 'grani-ui'
</script>

<template>
  <UiListItem
    to="/components/link"
    variant="outline"
    title="Documentation"
    description="Opens the guide."
    class="w-full max-w-md"
  >
    <template #media><FileText aria-hidden="true" /></template>
  </UiListItem>
  <UiListItem
    to="https://example.com/help"
    variant="outline"
    title="Help center"
    description="Another site."
    class="w-full max-w-md"
  >
    <template #media><FileText aria-hidden="true" /></template>
  </UiListItem>
</template>

```

### Long text

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem, UiBadge } from 'grani-ui'
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem
        title="A title long enough to wrap onto a second line in a narrow card"
        description="A description that also runs long, to show that the row grows in height and keeps the action centered on it."
      >
        <template #actions><UiBadge label="Draft" /></template>
      </UiListItem>
      <UiListItem title="Unbroken" description="anna.petrova.with.a.long.address@company.example">
        <template #actions><UiBadge label="Invited" /></template>
      </UiListItem>
      <UiListItem title="A short one" description="In a list: UiList makes each row an item.">
        <template #actions><UiBadge tone="success" label="Sent" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Search hit

```vue
<script setup lang="ts">
import { UiCard, UiList, UiListItem } from 'grani-ui'
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem
        title="Invoices of Birch & Co"
        highlight="birch"
        description="12 invoices, 3 open."
      />
      <UiListItem title="Birch & Co, contacts" highlight="birch" description="4 people." />
    </UiList>
  </UiCard>
</template>

```

### Setting

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiCard, UiList, UiListItem, UiSwitch } from 'grani-ui'

const notify = ref(true)

const terms = ref(false)
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-md">
    <UiList>
      <UiListItem as="label" title="Notifications" description="Email about new events.">
        <template #actions><UiSwitch v-model="notify" /></template>
      </UiListItem>
      <UiListItem
        as="label"
        title="Accept the terms"
        description="Needed before the first payout."
        required
        :error="terms ? '' : 'Accept the terms to receive payouts.'"
      >
        <template #actions><UiSwitch v-model="terms" /></template>
      </UiListItem>
      <UiListItem
        as="label"
        title="Two-step sign-in"
        description="Your administrator keeps it on."
      >
        <template #actions><UiSwitch :model-value="true" disabled /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Notice

```vue
<script setup lang="ts">
import { UiListItem, UiButton } from 'grani-ui'
</script>

<template>
  <div class="flex w-full max-w-lg flex-col gap-2">
    <UiListItem tone="info" description="The report covers the current filter only." />
    <UiListItem
      tone="warning"
      title="Rate missing"
      description="Add the June rate to compute the cost in the base currency."
    >
      <template #actions>
        <UiButton variant="outline" size="xs">Add rate</UiButton>
      </template>
    </UiListItem>
    <UiListItem
      tone="success"
      title="Backup codes saved"
      description="Keep them somewhere safe."
    />
    <UiListItem
      tone="danger"
      description="The import stopped at row 42: the amount is not a number."
    />
  </div>
</template>

```

### Actions of a record

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Archive, Check, Lock, Trash2 } from '@lucide/vue'
import { UiCard, UiList, UiListItem } from 'grani-ui'

const done = ref('')
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem as="button" size="sm" title="Mark complete" @click="done = 'complete'">
        <template #actions><Check aria-hidden="true" /></template>
      </UiListItem>
      <UiListItem
        size="sm"
        title="Open the record"
        description="Payment 12.50 EUR"
        to="/components/link"
      />
      <UiListItem as="button" size="sm" step title="Payments" @click="done = 'payments'">
        <template #actions><span class="text-sm text-fg-muted">3</span></template>
      </UiListItem>
      <UiListItem as="button" size="sm" title="Archive" @click="done = 'archive'">
        <template #actions><Archive aria-hidden="true" /></template>
      </UiListItem>
      <UiListItem
        as="button"
        size="sm"
        title="Close"
        description="Paid records stay open"
        disabled
      >
        <template #actions><Lock aria-hidden="true" /></template>
      </UiListItem>
      <UiListItem as="button" size="sm" title="Delete" tone="danger" @click="done = 'delete'">
        <template #actions><Trash2 aria-hidden="true" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
  <p v-if="done" class="text-xs text-fg-muted">pressed: {{ done }}</p>
</template>

```

### Lit and brand

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { UiCard, UiList, UiListItem } from 'grani-ui'

// The row that just came is lit, and the light goes out after a second, as the prop asks.
const payments = ref([
  { day: 'Sep 3', amount: '420.00 EUR' },
  { day: 'Sep 17', amount: '180.00 EUR' },
])

const litAt = ref(-1)

let dim: ReturnType<typeof setTimeout> | undefined

function addPayment() {
  payments.value = [
    ...payments.value,
    { day: `Sep ${18 + payments.value.length}`, amount: '95.00 EUR' },
  ]
  clearTimeout(dim)
  litAt.value = payments.value.length - 1
  dim = setTimeout(() => (litAt.value = -1), 1000)
}

onBeforeUnmount(() => clearTimeout(dim))
</script>

<template>
  <UiCard :padded="false" class="w-full max-w-sm">
    <UiList>
      <UiListItem
        v-for="(p, i) in payments"
        :key="i"
        size="sm"
        :title="p.day"
        :description="p.amount"
        :lit="litAt === i"
      />
      <UiListItem as="button" size="sm" title="Add a payment" tone="brand" @click="addPayment">
        <template #actions><Plus aria-hidden="true" /></template>
      </UiListItem>
    </UiList>
  </UiCard>
</template>

```

### Sizes

```vue
<script setup lang="ts">
import { UiStack, UiCard, UiList, UiListItem, UiSwitch } from 'grani-ui'
</script>

<template>
  <UiStack direction="row" gap="title" align="start" class="w-full flex-wrap justify-center">
    <UiCard :padded="false" class="w-full max-w-xs">
      <UiList>
        <UiListItem as="label" title="Weekly digest" description="sm, the default: 44 tall.">
          <template #actions><UiSwitch :model-value="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiCard :padded="false" size="md" class="w-full max-w-xs">
      <UiList>
        <UiListItem as="label" title="Weekly digest" description="md: 56 tall.">
          <template #actions><UiSwitch :model-value="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
  </UiStack>
</template>

```

### Alone

```vue
<script setup lang="ts">
import { UiStack, UiListItem, UiButton, UiSpinner } from 'grani-ui'
</script>

<template>
  <UiStack class="w-full max-w-md">
    <UiListItem
      variant="outline"
      title="Export ready"
      description="The March report is ready to download."
    >
      <template #actions><UiButton variant="outline">Download</UiButton></template>
    </UiListItem>
    <UiListItem
      variant="muted"
      size="sm"
      title="Processing payment"
      description="Do not close the tab."
    >
      <template #media><UiSpinner /></template>
    </UiListItem>
  </UiStack>
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { UiCard, UiList, UiListItem, UiRadioGroup, UiRadio } from 'grani-ui'

const rowState = ref('rest')
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiCard :padded="false" class="w-full max-w-sm">
      <UiList>
        <UiListItem
          as="button"
          size="sm"
          title="Sync the bank feed"
          :loading="rowState === 'loading'"
          :disabled="rowState === 'disabled'"
        >
          <template #actions><RefreshCw aria-hidden="true" /></template>
        </UiListItem>
      </UiList>
    </UiCard>
    <UiRadioGroup v-model="rowState" variant="segmented" aria-label="State of the row">
      <UiRadio value="rest">Rest</UiRadio>
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="disabled">Disabled</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## API

Props:
- `title`: `string` — The primary line of text.
- `description`: `string` — Supporting text below the title.
- `variant`: `"soft" | "outline" | "plain" | "muted"` = `soft | outline | plain | muted` — `plain` for a row among rows, `outline` for a standalone row, `muted` for a filled surface.
On a notice in a UiList, `soft` fills the row with its tone's pale plate as well; `plain` keeps the surface. Alone the notice is its card either way.
- `size`: `RowSize` = `sm | md` — `md` for pages, `sm` for drawers and dense lists. Unset: the host's (a sidebar says `sm`), else `md`. Rows keep their own scale, 44 at `sm` and 56 at `md`; the app's size (`createGrani({ size })`) does not move them.
- `highlight`: `string` — Letters of the title to mark, in any case: the query of a search over the rows. The first match is marked.
- `lit`: `boolean` — A moment of brand color: the row just came, or a refused repeat points at it. Set it, clear it after a second.
- `as`: `"label" | "button" | "div"` = `label | button | div` — The root element: `label` for a field, `button` for a command; a plain row is a `div`.
- `to`: `string` — A route or URL. Makes the whole row a link; `actions` then hold no controls. A disabled one is a disabled button, not a link; `javascript:` and `data:` are refused, as on UiLink.
- `target`: `"_blank" | "_self"` = `_blank | _self` — With `to`: `_blank` or `_self` decides the tab; unset, a new tab for an absolute address only.
- `rel`: `string` — With `to`: replaces the default `noreferrer` (`nofollow`, `sponsored`); `noopener` stays on a new tab.
- `step`: `boolean` — With `as="button"`: the row goes one level in, a step of a drawer; a chevron at the end.
- `disabled`: `boolean` — A command or link row that cannot be taken now: no rights, nothing to do.
- `loading`: `boolean` — A command or link row is running: a spinner in place of the glyph, clicks refused, focus kept.
- `error`: `string` — With `as="label"`: an error in place of the description, read with the control and marking it invalid.
- `required`: `boolean` — With `as="label"`: an asterisk after the title and `aria-required` on the control.
- `tone`: `"brand" | "success" | "warning" | "danger" | "info"` = `brand | success | warning | danger | info` — Meaning. On a plain row a notice: alone a white card whose start edge is in the tone, in a UiList a row with the tone's edge, read as a status. On a command or link row the ink alone: `danger` for an irreversible action, `brand` for the one that makes something new (“Add …”).
Anything else lands on the root element: native attributes, aria-*, data-testid.

Events:
- `click` (`event: MouseEvent`) — The row was clicked; a command row is silent while `loading` or `disabled`.

Slots:
- `default` with `Record<string, never>` — Own text in place of `title` and `description`, when two lines are not enough. On a label row it names nothing: give the control its own name.
- `media` with `Record<string, never>` — Content on the left: a glyph, an avatar or an image. The caller sizes avatars and images; glyphs are 20px.
- `actions` with `Record<string, never>` — Controls on the right: a button, a badge, a switch. Passive content only on a link or a command row (`to`, `as="button"`): a control there is a control inside a control, and warns.

## How it behaves

### One press, one request

- When: a command or link row is loading.
- Props: `as="button"` or `to`, with `loading` set while the request runs.
- Guarantee: A spinner replaces the icon, and further presses are stopped before your listener or the router sees them, so a link row does not navigate. Keyboard focus stays on the row.
- Without it: A second press on a slow row sends the request again.
- Code: `<UiListItem as="button" title="Sync the bank feed" :loading="syncing" @click="sync">
  <template #actions><RefreshCw /></template>
</UiListItem>`
- Your part: Set `loading` from the press until the request answers.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "Loading puts a spinner in the glyph's place and refuses the press; the button stays enabled.", "a loading link row refuses the click in the capture phase, ahead of the router"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Error replaces hint

- When: a setting row with a description shows an error.
- Props: `description`, `error`.
- Guarantee: The error takes the description’s place and is announced, and the control is marked invalid. When the error clears, the description comes back.
- Without it: The error stacks under the description, and a screen reader does not hear it with the control.
- Code: `<UiListItem as="label" title="Accept the terms" description="Needed before the first payout." :error="err">…</UiListItem>`
- Your part: Write the error as what to do, about as long as the description.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "an error replaces the description, is an alert and marks the control invalid", "When the error clears, the description comes back and describes the control again."
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#error-takes-the-hints-place

### Focus on the error

- When: a form is sent with a setting row in error.
- Props: `error`.
- Guarantee: The row marks its control invalid, so when it is the first field with an error, keyboard focus lands on the control.
- Without it: Keyboard focus stays on Save, and you look for the row yourself.
- Code: `<UiListItem as="label" title="Accept the terms" :error="err">…</UiListItem>`
- Your part: Pass the error in `error`. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "in a label row with an error, focusInvalid lands on its control"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Words, not only color

- When: it is a notice: a plain row with `tone`.
- Props: `tone`.
- Guarantee: A screen reader announces its tone in a word before the title (Note, Done, Warning, Error), and the tone's icon is drawn beside the colored edge, so color never carries the tone alone.
- Without it: A colored edge alone: in grayscale, a warning and a success look the same.
- Code: `<UiListItem tone="warning" title="Rate missing" description="Add the June rate." />`
- Your part: Write the title and the text; the tone word comes from the library. An icon of your own in `#media` must show the tone as plainly.
- Not covered: An icon given in `#media` replaces the tone's icon, and the row cannot check that yours still shows the tone.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "A notice says its tone in words before its title, not by color alone.", "each tone of a notice draws its own glyph, and #media replaces it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#level-not-by-colour

### Click the label

- When: it is a setting row with `as="label"`.
- Props: `as="label"`, with one control in `#actions`.
- Guarantee: The whole row is the label of its control: a click on the title, the description or the space between toggles it, and a screen reader announces the title as the control's name.
- Without it: A click on the words does nothing; only the small switch at the end of the row responds.
- Code: `<UiListItem as="label" title="Weekly digest" description="Every Monday.">
  <template #actions><UiSwitch v-model="digest" /></template>
</UiListItem>`
- Your part: Put exactly one control in `#actions`: a label names one control.
- Not covered: Two controls in one row warn in development, and neither gets a clear name.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "A click anywhere on a setting row, its title included, toggles the switch it names."
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#label-is-target

### New tab said

- When: the whole row is a link to another site.
- Props: `to`.
- Guarantee: The row opens the site in a new tab and ends in an arrow instead of the chevron, and a screen reader announces “opens in a new tab” after the row’s title.
- Without it: The row opens another tab without saying so.
- Code: `<UiListItem to="https://docs.example.com" title="Guide" />`
- Your part: Pass the address in `to`; nothing else is needed.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "a row linking to another site opens in a new tab and says so", "a row to another site ends in the new-tab arrow, not the chevron"
- Pattern for all components: https://grani.arseni.work/patterns/opening#new-tab-said

### Step in

- When: a row leads one level in.
- Props: `as="button"` with `step`, a count or a word in `#actions`.
- Guarantee: A chevron at the end of the row shows that it opens a deeper view. It sits beside any count or text, mirrors for right-to-left languages, and the whole row acts as one button.
- Without it: A row that opens a second window over the drawer, or one that looks like every other button.
- Code: `<UiListItem as="button" step title="Payments" @click="open('payments')">
  <template #actions><span>3</span></template>
</UiListItem>`
- Your part: When the row is pressed, open the step in the drawer the row stands in.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "a command row with step ends in a chevron beside its actions; a plain command has none", "a step row chevron mirrors under rtl, slides only when enabled, and its text aligns to the start"
- Pattern for all components: https://grani.arseni.work/patterns/working-the-list#open-related

### One name

- When: it is a setting row with `as="label"`.
- Props: `as="label"`, `title`.
- Guarantee: The title names the control in `#actions` once, and the description is read with it.
- Without it: A switch at the end of a row with no name, or a name other than the words beside it.
- Code: `<UiListItem as="label" title="Weekly digest"><template #actions><UiSwitch v-model="digest" /></template></UiListItem>`
- Your part: Put one control in `#actions`, with no text or `ariaLabel` of its own.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "the title names the control, the description describes it, the row is its label", "two controls in one label row warn in dev: a label names one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#one-name-one-voice

### Required in words

- When: a setting row must be answered.
- Props: `required`.
- Guarantee: The title shows an asterisk, and the control in `#actions` is announced as required (`aria-required`).
- Without it: An asterisk that a screen reader skips.
- Code: `<UiListItem as="label" title="Accept the terms" required>…</UiListItem>`
- Your part: Set `required` on the row instead of typing an asterisk into the title. The app still checks the answer.
- Proof, in the repository's tests (UiListItem.spec.ts, not in the package): "required puts an asterisk on the title and aria-required on the control"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#required-in-words


The patterns: https://grani.arseni.work/patterns

## Built on it

- [List field](https://grani.arseni.work/components/list-field): Search a list and add entries from one field. Paste a column to add several entries, and recover your text if adding fails.

Built with what `grani-ui` exports: `useUiT`.
