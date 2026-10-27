# Dropzone (`UiDropzone`)

> Add files by dragging or browsing; a message names each file that cannot be added and says why.

A component of grani-ui 0.1.0. Form, stable, since 0.1.0. Page: https://grani.arseni.work/components/dropzone

Also called file upload, file input, drag and drop upload, uploader.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDropzone } from 'grani-ui'

const contract = ref<File[]>([])
</script>

<template>
  <UiDropzone
    v-model="contract"
    accept="application/pdf,.pdf"
    :max-size="30 * 1024 * 1024"
    ariaLabel="Contract"
    class="w-full max-w-96"
  />
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Drop files anywhere on the upload card.
- Know what was refused and why.
- See upload progress and when it ends.
- Avoid adding the same entry twice.
- Keep keyboard focus where you are working.
- See whether an action worked.
- Ignore extra presses while a request runs.
- See the value the app actually accepted.
- Submit the values shown in the form.
- Go straight to the field that needs fixing.
- Know what fits when a list has a limit.
- Know how to add files from a folder.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Set the limits with `accept`, `maxSize` and `maxFiles`; the wording comes from the library.
- Bind `busy` and `progress` while the upload runs, and set `progress` to 100 before `busy` turns false: an upload that ends below 100 is not marked done. Set `failed` when it fails, at any percent, and clear it when the next upload starts; handle the `cancel` and `retry` events.
- Show a failed upload in the field’s error.
- Bind `busy` while the upload runs, and answer a cancel or a Retry by changing `busy` or `failed`.
- Pass the files the app holds as `modelValue`.
- Give it a `name` where the form is sent natively.
- Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Set `maxFiles`.

## Why it works this way

A form control for choosing files, by drag and drop or with a Browse button. It lists the chosen files, each with a remove button.

**Model.** `v-model` holds the chosen files and is always an array. The file input follows the model, a form reset included.

**Limits.** It accepts files by `accept`, `maxSize` (bytes) and `maxFiles`. A refused file is named with the reason, and `reject` is emitted.

**Upload.** The consumer uploads the files. Bind `progress` to show the upload and `busy` to block changes meanwhile. The rows not yet uploaded carry it: a spinner in the glyph's place, the percent in the size's, and the row filling behind its words with a quiet plate; with no percent the spinner turns and nothing fills. Browse holds, refusing, and the zone keeps its height. With no row to carry it, a bar runs along the bottom of the zone. The cross of an uploading row emits `cancel`: one upload runs for all the files it carries, so the app stops it and ends `busy`. An upload that ends at 100 with no `failed` marks its files uploaded and is announced, with the number it delivered; a later upload carries only the files not yet uploaded. A cancel the app has answered is announced too. A failure is `failed`, once `busy` ends, at any percent, 100 included: the rows the upload carried and did not deliver take an alert glyph, the reason (the string given, or Not uploaded) and Retry, which emits `retry`, and give up their size to make room; a folded list opens on them. A file added after it is a new file. Cancel and Retry ask once, until the app answers by changing `busy` or `failed`.

**Field.** Inside a UiField it reads id, error and required; standalone it takes `invalid` and `ariaLabel`.

**Attributes.** Listeners and `aria-*` land on the Browse button, other attributes on the file input that the form submits, `class` and `style` on the root. A native `required` keeps a form from sending with no file: Browse says it in words, and the form's check puts the focus on Browse, turns the zone invalid and says why under it, until a file comes.

**Page drops.** While it is mounted, a file dropped anywhere on the page outside a drop target does not open in the browser.

**Placement.** In a form column under a UiField label, beside UiInput and UiTextarea, on a page, in a window or in a drawer's section.

### Keyboard

- `Tab`: reaches Browse, a native button; the file input itself is out of the tab order.
- `Enter` `Space`: on Browse, open the file dialog.
Each listed file's cross is a button. A remove from the keyboard keeps the focus inside the card:
on the row now in its place, the one above, or Browse. A folded list opens on its row, which is a button too. Dropping is for the pointer. `disabled` and `busy` block Browse and the remove crosses, and Browse keeps the focus while busy; an uploading row's cross cancels the upload, and a failed row's Retry is a button.

### Screen reader

- Browse: named by `ariaLabel` or the field's label, then by its own word; the file input under it is hidden from a screen reader.
- Description: the hint, the field's words, a required field (in words, since a button takes no `aria-required`) and the last refusal describe Browse; `invalid` sets `aria-invalid` on it.
- Status: a status region, in the DOM from the start, says what was added, removed and uploaded, that an upload is running, and why it failed.
- Refusal: an alert that names the files.
- Files: a list; an uploaded row says so in words, an uploading row's percent is a progress named by its file, and a failed row reads its reason after its name.
- Dragging: dragging over changes the words, not only the color.

### States

Rest, dragging over (the zone lights up and the words change), busy (each pending row a spinner, a filling plate, the percent and a cross that cancels; no fill while the percent is unknown; the layout kept), uploaded (a check on each row and on the folded line, no cross unless `removable` allows it), failed (an alert glyph, the reason with no size, Retry and the remove cross on each row the upload left), refused (the reason under the list, by name), with files (a row per file, folded past three with `multiple`), invalid (a red dashed border), and disabled (the plate, an inert button, no drop).

### When to use another component

- Names typed or pasted one per line: UiListField.
- A typed value: UiInput.
- Files already on a record: UiListItem rows in a UiList, listed without choosing.

## Examples

### Multiple

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDropzone } from 'grani-ui'

const photos = ref<File[]>([])
</script>

<template>
  <UiDropzone
    v-model="photos"
    accept="image/*"
    multiple
    :max-files="4"
    :max-size="5 * 1024 * 1024"
    ariaLabel="Photos"
    class="w-full max-w-96"
  >
    Drop up to four photos here, or
    <template #hint>JPG, PNG or WebP, 5 MB each</template>
  </UiDropzone>
</template>

```

### Upload

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { UiField, UiDropzone, UiRadioGroup, UiRadio } from 'grani-ui'

const pdf = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' })

// One upload's life on one card: the state below switches it, the host owns busy and progress.
// Preparing is busy before a length is known: the bar runs on its own.
const upload = ref([pdf('contract-2026.pdf', 3)])

const stage = ref('uploading')

const failed = computed(() => stage.value === 'failed')

// Uploading runs as an upload does: the percent climbs, and at 100 the file is uploaded. The
// ring and the row's fill follow it; Failed stops it where it stood.
const percent = ref(0)

let ticking: ReturnType<typeof setInterval> | undefined

watch(
  stage,
  (now) => {
    clearInterval(ticking)
    if (now !== 'uploading') return
    percent.value = 0
    ticking = setInterval(() => {
      percent.value = Math.min(100, percent.value + 4)
      if (percent.value === 100) {
        clearInterval(ticking)
        stage.value = 'uploaded'
      }
    }, 150)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearInterval(ticking))
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <UiField label="Contract" class="w-full max-w-96">
      <UiDropzone
        v-model="upload"
        :busy="stage === 'preparing' || stage === 'uploading'"
        :progress="stage === 'uploading' ? percent : stage === 'uploaded' ? 100 : null"
        :failed="failed ? 'The connection dropped.' : false"
        @cancel="stage = 'idle'"
        @retry="stage = 'uploading'"
      />
    </UiField>
    <UiRadioGroup v-model="stage" variant="segmented" aria-label="State of the upload">
      <UiRadio value="idle">Idle</UiRadio>
      <UiRadio value="preparing">Preparing</UiRadio>
      <UiRadio value="uploading">Uploading</UiRadio>
      <UiRadio value="uploaded">Uploaded</UiRadio>
      <UiRadio value="failed">Failed</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### Many

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDropzone } from 'grani-ui'

const pdf = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' })

const many = ref([
  pdf('report-01.pdf', 2),
  pdf('report-02.pdf', 3),
  pdf('report-03.pdf', 2),
  pdf('report-04.pdf', 4),
  pdf('report-05.pdf', 1),
  pdf('signed-agreement-with-all-appendices-and-the-final-price-list-v3.pdf', 2),
])
</script>

<template>
  <UiDropzone
    v-model="many"
    accept="application/pdf"
    multiple
    :max-files="10"
    ariaLabel="Reports"
    class="w-full max-w-96"
  />
</template>

```

### States

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiDropzone } from 'grani-ui'

const disabled = ref([])

const invalid = ref([])
</script>

<template>
  <UiDropzone v-model="disabled" disabled ariaLabel="Disabled" class="w-72" />
  <UiDropzone v-model="invalid" invalid ariaLabel="Invalid" class="w-72" />
</template>

```

### Refused

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiDropzone } from 'grani-ui'

const pdf = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' })

// The host keeps these files: a drop is refused, the list and the form stay on them.
const kept = ref([pdf('statement-2026-09.pdf', 1)])
</script>

<template>
  <UiField
    label="Statement"
    description="The app keeps this file: a drop is not taken."
    class="w-full max-w-96"
  >
    <UiDropzone :model-value="kept" accept="application/pdf,.pdf" />
  </UiField>
</template>

```

### Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiField, UiDropzone, UiButton } from 'grani-ui'

const pdf = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' })

const sent = ref([pdf('invoice-1042.pdf', 1)])
</script>

<template>
  <form
    class="flex w-full max-w-96 flex-col items-start gap-4"
    @submit.prevent
    @reset="sent = [pdf('invoice-1042.pdf', 1)]"
  >
    <UiField label="Invoice" required class="w-full">
      <UiDropzone v-model="sent" name="invoice" accept="application/pdf,.pdf" required />
    </UiField>
    <span class="text-xs text-fg-muted">
      Sends {{ sent.length ? sent.map((f) => f.name).join(', ') : 'nothing' }}
    </span>
    <div class="flex gap-2">
      <UiButton type="submit" size="xs">Send</UiButton>
      <UiButton type="reset" variant="secondary" size="xs">Reset</UiButton>
    </div>
  </form>
</template>

```

### Drawer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiCrudDrawer, UiCard, UiField, UiDropzone } from 'grani-ui'

const drawerOpen = ref(false)

const receipts = ref([])
</script>

<template>
  <UiButton variant="outline" @click="drawerOpen = true">New expense</UiButton>
  <UiCrudDrawer
    v-model:open="drawerOpen"
    title="New expense"
    :persistent="receipts.length > 0"
    @submit="drawerOpen = false"
  >
    <UiCard>
      <UiField label="Receipts">
        <UiDropzone v-model="receipts" multiple accept="image/*,.pdf" />
      </UiField>
    </UiCard>
  </UiCrudDrawer>
</template>

```

## API

Props:
- `modelValue`: `File[]` (required) — The chosen files (`v-model`); always an array, one entry at most without `multiple`.
- `accept`: `string` — Accepted file types, native `accept` syntax: `image/*`, `.pdf,.docx`, `application/pdf`.
- `multiple`: `boolean` (default `false`) — Allows choosing several files; without it a new file replaces the old one.
- `maxFiles`: `number` — Maximum number of files, with `multiple`; ignored without it.
- `maxSize`: `number` — Maximum file size in bytes; also said under the main line unless `#hint` is given.
- `disabled`: `boolean` (default `false`) — Prevents choosing, dropping and removing.
- `invalid`: `boolean` (default `false`) — Marks the control as invalid. Inside UiField, the error state sets this automatically.
- `name`: `string` — Native name of the file input: a plain form submit sends the listed files.
- `id`: `string` — Own id when standalone. Inside UiField, the field's id takes precedence.
- `ariaLabel`: `string` — Name when there is no visible label; the browse button reads it followed by its own words, "Choose a file" or "Choose files".
- `progress`: `number | null` (default `null`) — Upload progress 0 to 100 shown with `busy`; `null` when unknown. The files listed when it reaches 100 are marked uploaded.
- `busy`: `boolean` (default `false`) — Work in progress: the rows not yet uploaded carry it, choosing and removing wait until it ends.
- `failed`: `string | boolean` (default `false`) — The last upload failed: the rows not uploaded say so, with this reason when it is a string, and offer Retry.
- `removable`: `boolean | "auto"` = `false | true | auto` (default `"auto"`) — Whether the files can be removed. `auto`: yes, except the ones a finished upload marked.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:modelValue` (`files: File[]`) — The chosen files changed: added, replaced or removed.
- `retry` — Retry was pressed on a row a failed upload left: start the upload again.
- `reject` (`rejections: FileRejection[]`) — Files refused on choose or drop, with the reason each (`FileRejection` from `types/ui`).
- `cancel` — The cross of an uploading row was pressed: stop the upload and end `busy`.

Slots:
- `default` with `Record<string, never>` — The main line: what to drop here.
- `hint` with `Record<string, never>` — The second line: the constraints, by default the size limit.

## How it behaves

### Drop anywhere

- When: a file is dragged over the card.
- Props: none.
- Guarantee: The whole card accepts drops, including its file rows. A file dropped outside the card and any other drop target does not open in the tab. The card highlights only for dragged files, not for dragged text.
- Without it: A drop a few pixels past the dashed line opens the file in the tab, and the form is gone.
- Code: `<UiDropzone v-model="files" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "a drop anywhere on the card lands, not only on the dashed field", "a file dropped outside the card does not reach the browser default", "dragging text over the zone does not light it"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#whole-zone-is-target

### Refusal named

- When: files are refused.
- Props: `accept`, `maxSize`, `maxFiles`.
- Guarantee: You can tell which files need attention: each rejection reason names up to three affected files and counts any others. A batch with unsupported types and oversized files gets a sentence for each reason, announced as an alert by a screen reader.
- Without it: Some files are missing from the list, with no word about which or why.
- Code: `<UiDropzone v-model="files" accept=".pdf" :max-size="5e6" multiple />`
- Your part: Set the limits with `accept`, `maxSize` and `maxFiles`; the wording comes from the library.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "a refusal names the files it refused, three and then how many more", "every reason of a mixed batch is told"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#refused-by-name

### Upload shown

- When: the app uploads the files.
- Props: `busy`, `progress`, `failed`.
- Guarantee: Every file not yet uploaded shows the one `progress` you give: a percentage in place of its size and a bar behind its name. The percentage is capped at 100, and the card keeps its layout when the upload starts. When `busy` turns false with `progress` at 100, the files get check marks and a screen reader announces how many were uploaded. If the upload fails, each file left behind shows the reason you give in `failed`, or “Not uploaded”, with Retry, and a screen reader announces the reason once the upload stops.
- Without it: A spinner somewhere on the page, and no sign of which file is uploading, whether it has finished or which files a failure left behind.
- Code: `<UiDropzone v-model="files" :busy="sending" :progress="percent" :failed="error" @retry="send" />`
- Your part: Bind `busy` and `progress` while the upload runs, and set `progress` to 100 before `busy` turns false: an upload that ends below 100 is not marked done. Set `failed` when it fails, at any percent, and clear it when the next upload starts; handle the `cancel` and `retry` events.
- Not covered: One percentage for the whole upload: a file does not show progress of its own.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "progress out of range is clamped in the bar, the number and aria-valuenow", "the zone keeps one layout when busy turns on: Browse holds, the bar runs along the foot", "a finished upload is said in the status region", "an upload that ends below 100 is not marked done or said", "a failed upload marks the files it left with the reason and a Retry", "a failure is said in the status region once the upload stops"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#upload-shown

### No duplicates

- When: the same file is dropped or chosen again.
- Props: `multiple`.
- Guarantee: A file already listed, with the same name, size and date, is refused and named as already in the list; the list keeps one copy, and `reject` reports it with the reason `duplicate`.
- Without it: The same invoice listed twice and uploaded twice.
- Code: `<UiDropzone v-model="files" multiple />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "the same file twice is refused as a duplicate"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#no-twice

### Focus stays near

- When: A file is removed from the keyboard.
- Props: `multiple`.
- Guarantee: Keep removing files from the keyboard: focus moves to the next file’s remove button, then the previous one if needed, or Choose files when no suitable file remains. Files without a remove button, such as completed uploads, are skipped.
- Without it: Keyboard focus is lost with the removed file, and you have to tab back into the drop zone.
- Code: `<UiDropzone v-model="files" multiple ariaLabel="Reports" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "removing a file with the keyboard keeps the focus inside the card", "removing skips a locked row: the focus lands on the next removable one"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-stays

### Outcome shown

- When: files are added, removed or uploaded.
- Props: none.
- Guarantee: A screen reader announces what was added, removed or uploaded, such as “a.pdf added” or “2 files uploaded”, and a refused file is announced as an alert with its reason.
- Without it: The list changes without a word to a screen reader.
- Code: `<UiDropzone v-model="files" />`
- Your part: Show a failed upload in the field’s error.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "added and removed files are said in the status region", "a finished upload is said in the status region"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: an upload is running.
- Props: `busy`.
- Guarantee: Browse ignores presses but keeps keyboard focus, dropped files are ignored, and removing a file waits until the upload ends. The cross that cancels the upload and Retry after a failure each ask once, until the app answers by changing `busy` or `failed`.
- Without it: A second file can be dropped into an upload that is half done.
- Code: `<UiDropzone v-model="files" :busy="sending" />`
- Your part: Bind `busy` while the upload runs, and answer a cancel or a Retry by changing `busy` or `failed`.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "busy: the row carries the upload, Browse refuses but holds, the drop is ignored, removing waits", "Browse keeps the focus while busy", "two quick presses on cancel or Retry ask once, until the app answers"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Back to the value

- When: the app refuses a change, or the form is reset.
- Props: `v-model`, or `modelValue` with `@update:model-value`.
- Guarantee: If the app refuses the files you drop or pick, the file list and the files the form would send stay as they were. After a form reset, both still match the app’s files.
- Without it: The list shows a file the app did not accept.
- Code: `<UiDropzone :model-value="kept" />`
- Your part: Pass the files the app holds as `modelValue`.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "a change the parent refuses leaves the list and the input on the model"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#refused-goes-back

### Sent with the form

- When: it sits inside a native form.
- Props: `name`.
- Guarantee: The submitted files match the list shown in the component, including after a form reset: a native file input behind the card tracks the app’s file list and submits it under the field’s `name`.
- Without it: A file list on screen that the form never sends.
- Code: `<UiDropzone v-model="files" name="invoice" />`
- Your part: Give it a `name` where the form is sent natively.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "in a form it sends the files under its name", "a form reset leaves the native input on its model"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#sends-like-native

### Focus on the error

- When: a required file is missing on submit.
- Props: `invalid`, or the error of its UiField.
- Guarantee: When the dropzone is the first field with an error, keyboard focus lands on its Browse button, and the zone shows a red dashed border, so you can open the file picker straight away.
- Without it: The form does not send, keyboard focus stays on Save, and you have to find the field with an error yourself.
- Code: `<UiField :error="err"><UiDropzone v-model="files" /></UiField>`
- Your part: Set `invalid`, or pass the error to its UiField. UiModal with `form` and UiCrudDrawer move the focus themselves; in a form of your own, call `focusInvalid(form)` after your check.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "a dropzone marked invalid is what focusInvalid lands on"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#focus-invalid

### Up to the limit

- When: files would go past `maxFiles`.
- Props: `multiple`, `maxFiles`.
- Guarantee: The files that fit are added; the rest are refused and named with the limit, such as “c.pdf: up to 2 files.”, and `reject` reports them with the reason `count`.
- Without it: A drop of three files into a list that allows two takes all three, and the error comes only when the form is saved.
- Code: `<UiDropzone v-model="files" multiple :max-files="2" />`
- Your part: Set `maxFiles`.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "refuses files beyond maxFiles and keeps the ones that fit"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#nearly-full

### Folder refused

- When: a folder is dropped.
- Props: none.
- Guarantee: A dropped folder is rejected with an explanation, even when the browser provides no file for it. Files dropped alongside it are processed separately and added if accepted.
- Without it: A folder taken as an empty file of 0 bytes.
- Code: `<UiDropzone v-model="files" multiple />`
- Your part: Nothing.
- Proof, in the repository's tests (UiDropzone.spec.ts, not in the package): "a dropped folder is refused with a reason", "a folder that gives no file handle is still refused as a folder"
- Pattern for all components: https://grani.arseni.work/patterns/filling-in#folder-refused


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useUiT`.
