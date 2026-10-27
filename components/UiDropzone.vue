<!--
  UiDropzone: a form control for choosing files, by drag and drop or with a Browse button. It
  lists the chosen files, each with a remove button.

  Model. `v-model` holds the chosen files and is always an array. The file input follows the
  model, a form reset included.

  Limits. It accepts files by `accept`, `maxSize` (bytes) and `maxFiles`. A refused file is named
  with the reason, and `reject` is emitted.

  Upload. The consumer uploads the files. Bind `progress` to show the upload and `busy` to block
  changes meanwhile. The rows not yet uploaded carry it: a spinner in the glyph's place, the
  percent in the size's, and the row filling behind its words with a quiet plate; with no percent
  the spinner turns and nothing fills. Browse holds, refusing, and the zone keeps its height. With no row to
  carry it, a bar runs along the bottom of the zone. The cross of an uploading row emits `cancel`:
  one upload runs for all the files it carries, so the app stops it and ends `busy`. An upload
  that ends at 100 with no `failed` marks its files uploaded and is announced, with the number it
  delivered; a later upload carries only the files not yet uploaded. A cancel the app has answered
  is announced too. A failure is `failed`, once `busy` ends, at any percent, 100 included: the
  rows the upload carried and did not deliver take an alert glyph, the reason (the string given,
  or Not uploaded) and Retry, which emits `retry`, and give up their size to make room; a folded
  list opens on them. A file added after it is a new file. Cancel and Retry ask once, until the
  app answers by changing `busy` or `failed`.

  Field. Inside a UiField it reads id, error and required; standalone it takes `invalid` and
  `ariaLabel`.

  Attributes. Listeners and `aria-*` land on the Browse button, other attributes on the file input
  that the form submits, `class` and `style` on the root. A native `required` keeps a form from
  sending with no file: Browse says it in words, and the form's check puts the focus on Browse,
  turns the zone invalid and says why under it, until a file comes.

  Page drops. While it is mounted, a file dropped anywhere on the page outside a drop target does
  not open in the browser.

  Placement. In a form column under a UiField label, beside UiInput and UiTextarea, on a page, in
  a window or in a drawer's section.

  Keyboard.
  - `Tab`: reaches Browse, a native button; the file input itself is out of the tab order.
  - `Enter` `Space`: on Browse, open the file dialog.
  Each listed file's cross is a button. A remove from the keyboard keeps the focus inside the card:
  on the row now in its place, the one above, or Browse. A folded list opens on its row, which is a
  button too. Dropping is for the pointer. `disabled` and `busy` block Browse and the remove
  crosses, and Browse keeps the focus while busy; an uploading row's cross cancels the upload, and a
  failed row's Retry is a button.

  Reader.
  - Browse: named by `ariaLabel` or the field's label, then by its own word; the file input under
    it is hidden from a screen reader.
  - Description: the hint, the field's words, a required field (in words, since a button takes no
    `aria-required`) and the last refusal describe Browse; `invalid` sets `aria-invalid` on it.
  - Status: a status region, in the DOM from the start, says what was added, removed and uploaded,
    that an upload is running, and why it failed.
  - Refusal: an alert that names the files.
  - Files: a list; an uploaded row says so in words, an uploading row's percent is a progress
    named by its file, and a failed row reads its reason after its name.
  - Dragging: dragging over changes the words, not only the color.

  States. Rest, dragging over (the zone lights up and the words change), busy (each pending row a
  spinner, a filling plate, the percent and a cross that cancels; no fill while the percent is
  unknown;
  the layout kept), uploaded (a check on each row and on the folded line, no cross unless
  `removable` allows it), failed
  (an alert glyph, the reason with no size, Retry and the remove cross on each row the upload left), refused (the reason under the list, by name), with files (a row per
  file, folded past three with `multiple`), invalid (a red dashed border), and disabled (the
  plate, an inert button, no drop).

  Not for.
  - Names typed or pasted one per line: UiListField.
  - A typed value: UiInput.
  - Files already on a record: UiListItem rows in a UiList, listed without choosing.
-->
<template>
  <div
    ref="rootRef"
    tabindex="-1"
    class="ui-dropzone flex flex-col overflow-hidden rounded-card border transition-colors duration-fast"
    :class="[shellClass, rootClass]"
    :style="rootStyle"
    :data-dragging="dragging || undefined"
    :data-invalid="isInvalid || undefined"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Always in the DOM: a live region speaks on change, and one that mounts
         already filled is often skipped by VoiceOver and NVDA. -->
    <p role="status" class="sr-only">{{ busy ? t('grani.dropzone.uploadingFiles') : said }}</p>
    <span v-if="ariaLabel" :id="`${uid}-name`" hidden>{{ ariaLabel }}</span>
    <!-- A button takes no aria-required: a required field says it here, in words. -->
    <span v-if="isRequired" :id="`${uid}-required`" hidden>{{ t('grani.field.required') }}</span>
    <!-- One layout at rest and busy: the upload is drawn on the rows it carries, and the zone only
         holds Browse; with no row to carry it, a bar runs along the zone's foot. -->
    <div
      class="relative m-2 flex flex-col items-center justify-center gap-2 rounded-control border border-dashed px-6 py-6 text-center transition-colors duration-fast"
      :class="zoneClass"
    >
      <Upload
        aria-hidden="true"
        class="h-6 w-6"
        :class="disabled || busy ? 'text-disabled-fg' : 'text-fg-muted'"
      />
      <p class="text-sm/5.5">
        <span v-if="busy && !pending.length" aria-hidden="true"
          >{{ t('grani.dropzone.uploadingFiles')
          }}<template v-if="percent != null">{{ ' ' + percent }}%</template></span
        >
        <template v-else-if="dragging">{{ t('grani.dropzone.release') }}</template>
        <slot v-else>{{ t(multiple ? 'grani.dropzone.drop' : 'grani.dropzone.dropOne') }}</slot>
      </p>
      <p
        v-if="hint || $slots.hint"
        :id="`${uid}-hint`"
        class="text-xs/4.5"
        :class="disabled ? 'text-disabled-fg' : 'text-fg-muted'"
      >
        <slot name="hint">{{ hint }}</slot>
      </p>
      <!-- Busy, Browse stays enabled to keep the focus and wears the disabled plate; marked to win
           over the button's own hover, which an enabled button keeps. -->
      <UiButton
        v-bind="buttonBound"
        ref="buttonRef"
        data-field
        variant="outline"
        :disabled="disabled"
        :aria-disabled="busy || undefined"
        class="aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-border-strong/40 aria-disabled:text-disabled-fg aria-disabled:hover:border-border! aria-disabled:hover:bg-border-strong/40!"
        @click="pick"
      >
        <span :id="`${uid}-browse`">{{
          t(multiple ? 'grani.dropzone.browse' : 'grani.dropzone.browseOne')
        }}</span>
      </UiButton>
      <UiProgress
        v-if="busy && !pending.length"
        :value="percent ?? undefined"
        :indeterminate="percent == null"
        :max="100"
        :aria-label="t('grani.dropzone.uploading')"
        class="absolute inset-x-6 bottom-2 h-1 w-auto"
      />
      <input
        v-bind="inputAttrs"
        ref="inputRef"
        type="file"
        tabindex="-1"
        aria-hidden="true"
        class="sr-only"
        :name="name"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        @change="onInput"
        @invalid="onMissing"
      />
    </div>

    <div v-if="modelValue.length" ref="listRef" class="border-t border-border">
      <UiListItem
        v-if="folded"
        as="button"
        size="sm"
        :disabled="disabled"
        :aria-expanded="unfolded"
        :class="carried ? 'relative isolate' : ''"
        @click="unfolded = !unfolded"
      >
        <!-- Folded, the one line carries the upload of the files it holds; open, the rows do. -->
        <template #media>
          <UiSpinner v-if="carried" class="text-brand-solid" />
          <CircleAlert v-else-if="failedFiles.size" aria-hidden="true" class="text-danger" />
          <Check v-else-if="allDone" aria-hidden="true" class="text-success" data-done />
          <Files v-else aria-hidden="true" />
        </template>
        <span
          v-if="carried && percent != null"
          aria-hidden="true"
          class="absolute inset-y-0 start-0 -z-10 bg-neutral-subtle transition-[width] duration-normal ease-standard"
          :style="{ width: `${percent}%` }"
        />
        <p class="text-sm/5.5 font-medium text-fg">
          {{ tp('grani.dropzone.count', modelValue.length) }}
        </p>
        <template #actions>
          <!-- The percent is the progress a screen reader hears; the spinner and the fill are seen. -->
          <span
            v-if="carried && percent != null"
            role="progressbar"
            :aria-label="t('grani.dropzone.uploading')"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="percent"
            class="text-xs/4.5 tabular-nums text-fg-muted"
            >{{ percent }}%</span
          >
          <span v-else class="text-xs/4.5 tabular-nums text-fg-muted">{{
            formatBytes(totalSize)
          }}</span>
          <ChevronDown
            aria-hidden="true"
            class="text-fg-muted transition-transform duration-fast"
            :class="unfolded ? 'rotate-180' : ''"
          />
        </template>
      </UiListItem>
      <UiList v-if="!folded || unfolded" :class="folded ? 'border-t border-border' : ''">
        <UiListItem
          v-for="file in modelValue"
          :key="fileKey(file)"
          size="sm"
          :class="isPending(file) ? 'relative isolate' : ''"
        >
          <template #media>
            <Check v-if="isDone(file)" aria-hidden="true" class="text-success" />
            <UiSpinner v-else-if="isPending(file)" class="text-brand-solid" />
            <CircleAlert v-else-if="isFailed(file)" aria-hidden="true" class="text-danger" />
            <FileIcon v-else aria-hidden="true" />
          </template>
          <!-- The row fills with the upload, a quiet plate behind its words, as a toast's time. -->
          <span
            v-if="isPending(file) && percent != null"
            aria-hidden="true"
            class="absolute inset-y-0 start-0 -z-10 bg-neutral-subtle transition-[width] duration-normal ease-standard"
            :style="{ width: `${percent}%` }"
          />
          <div class="flex min-w-0 flex-col">
            <div class="flex min-w-0 items-baseline">
              <UiTruncate
                :text="file.name"
                class="text-sm/5.5"
                :class="disabled ? 'text-disabled-fg' : 'text-fg'"
              />
              <span v-if="isDone(file)" class="sr-only">{{
                ' ' + t('grani.dropzone.uploaded')
              }}</span>
            </div>
            <!-- A failed upload says why on the row of the file it left behind. -->
            <span v-if="isFailed(file)" class="text-xs/4.5 text-danger-subtle-fg">{{
              reason
            }}</span>
          </div>
          <template #actions>
            <span
              v-if="isPending(file) && percent != null"
              role="progressbar"
              :aria-label="t('grani.dropzone.uploadingName', { name: file.name })"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="percent"
              class="text-xs/4.5 tabular-nums text-fg-muted"
              >{{ percent }}%</span
            >
            <!-- A failed row gives its size up, as an uploading row does to the percent: at a phone's
                 form column the reason then keeps to one line beside Retry and the cross. -->
            <span v-else-if="!isFailed(file)" class="text-xs/4.5 tabular-nums text-fg-muted">{{
              formatBytes(file.size)
            }}</span>
            <!-- One upload runs for the files it carries: the cross on any of them cancels it. -->
            <UiIconButton
              v-if="isPending(file)"
              variant="ghost"
              size="xs"
              :icon="X"
              :ariaLabel="t('grani.dropzone.cancel')"
              data-cancel
              @click="once('cancel')"
            />
            <UiButton
              v-if="isFailed(file)"
              variant="outline"
              size="xs"
              :disabled="disabled"
              data-retry
              @click="once('retry')"
              >{{ t('grani.dropzone.retry') }}</UiButton
            >
            <UiIconButton
              v-if="canRemove(file) && !isPending(file)"
              variant="ghost"
              size="xs"
              :icon="X"
              :ariaLabel="t('grani.dropzone.remove', { name: file.name })"
              :disabled="disabled || busy"
              data-remove
              @click="remove(file)"
            />
          </template>
        </UiListItem>
      </UiList>
    </div>

    <p
      v-if="rejection"
      :id="`${uid}-reject`"
      role="alert"
      class="border-t border-border px-3 py-2 text-xs/4.5 text-danger-subtle-fg"
    >
      {{ rejection }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  useId,
  useSlots,
  watch,
} from 'vue'
import { Check, ChevronDown, CircleAlert, File as FileIcon, Files, Upload, X } from '@lucide/vue'
import type { FileRejection } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useFieldControl } from '../utils/field'
import { useFormReset } from '../utils/composition'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiProgress from './UiProgress.vue'
import UiSpinner from './UiSpinner.vue'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import UiTruncate from './UiTruncate.vue'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The chosen files (`v-model`); always an array, one entry at most without `multiple`. */
    modelValue: File[]
    /** Accepted file types, native `accept` syntax: `image/*`, `.pdf,.docx`, `application/pdf`. */
    accept?: string
    /** Allows choosing several files; without it a new file replaces the old one. */
    multiple?: boolean
    /** Maximum number of files, with `multiple`; ignored without it. */
    maxFiles?: number
    /** Maximum file size in bytes; also said under the main line unless `#hint` is given. */
    maxSize?: number
    /** Prevents choosing, dropping and removing. */
    disabled?: boolean
    /** Marks the control as invalid. Inside UiField, the error state sets this automatically. */
    invalid?: boolean
    /** Native name of the file input: a plain form submit sends the listed files. */
    name?: string
    /** Own id when standalone. Inside UiField, the field's id takes precedence. */
    id?: string
    /** Name when there is no visible label; the browse button reads it followed by its own words, "Choose a file" or "Choose files". */
    ariaLabel?: string
    /** Upload progress 0 to 100 shown with `busy`; `null` when unknown. The files listed when it reaches 100 are marked uploaded. */
    progress?: number | null
    /** Work in progress: the rows not yet uploaded carry it, choosing and removing wait until it ends. */
    busy?: boolean
    /** The last upload failed: the rows not uploaded say so, with this reason when it is a string, and offer Retry. */
    failed?: boolean | string
    /** Whether the files can be removed. `auto`: yes, except the ones a finished upload marked. */
    removable?: boolean | 'auto'
  }>(),
  {
    multiple: false,
    disabled: false,
    failed: false,
    invalid: false,
    progress: null,
    busy: false,
    removable: 'auto',
  },
)

const emit = defineEmits<{
  /** The chosen files changed: added, replaced or removed. */
  'update:modelValue': [files: File[]]
  /** Files refused on choose or drop, with the reason each (`FileRejection` from `types/ui`). */
  reject: [rejections: FileRejection[]]
  /** The cross of an uploading row was pressed: stop the upload and end `busy`. */
  cancel: []
  /** Retry was pressed on a row a failed upload left: start the upload again. */
  retry: []
}>()

defineSlots<{
  /** The main line: what to drop here. */
  default(props: Record<string, never>): any
  /** The second line: the constraints, by default the size limit. */
  hint(props: Record<string, never>): any
}>()

const { t, tp, locale } = useUiT()
// Its rows live in its own box: a surface's gutter around the dropzone is not theirs to bleed through.
provide(SURFACE_GUTTER, null)
provide(ROW_INSET, null)
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const uid = useId()
const rejection = ref('')
const { rootClass, rootStyle, control } = useSplitAttrs()
// A native `required` on the dropzone stops a form sent with no file. It is said in words as a
// field's is, and the form's check turns it invalid until a file comes (`onMissing`).
const nativeRequired = computed(() => {
  const r = control.value.required
  return r !== undefined && r !== false && r !== 'false'
})
const missing = ref(false)
// Its own lines follow the field's: the hint, the word "required", the refusal of a file.
const {
  field,
  id: controlId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(
  () => ({
    id: props.id,
    invalid: props.invalid || missing.value,
    required: nativeRequired.value,
  }),
  {
    after: () => [
      hint.value || seen.hint ? `${uid}-hint` : undefined,
      isRequired.value ? `${uid}-required` : undefined,
      rejection.value ? `${uid}-reject` : undefined,
    ],
  },
)
const said = ref('')
// The file input is inert: what a person reaches (a listener, a name, a description) goes to Browse.
const reaches = (k: string) => /^on[A-Z]/.test(k) || k.startsWith('aria-')
const buttonAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(control.value).filter(([k]) => reaches(k) && k !== 'aria-describedby'),
  ),
)
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(control.value).filter(([k]) => !reaches(k))),
)
const labelledBy = computed(() =>
  props.ariaLabel
    ? `${uid}-name ${uid}-browse`
    : field?.labelId.value
      ? `${field.labelId.value} ${uid}-browse`
      : undefined,
)
// Ours win only where set: a caller's `aria-invalid` or `aria-labelledby` stays when we have none.
const buttonBound = computed(() =>
  ownWhereSet(buttonAttrs.value, {
    id: controlId.value,
    'aria-labelledby': labelledBy.value,
    'aria-invalid': aria.value['aria-invalid'],
    'aria-describedby': aria.value['aria-describedby'],
  }),
)

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const buttonRef = ref<{ $el: HTMLElement } | null>(null)

// A live region repeats nothing: the same words twice are said once unless emptied first.
const say = async (target: typeof said, text: string) => {
  target.value = ''
  if (!text) return
  await nextTick()
  target.value = text
}

// The native input carries the model for a plain form submit: drops and
// removals never touch it by themselves. Older engines have no DataTransfer.
const syncNativeFiles = () => {
  const input = inputRef.value
  if (!input || typeof DataTransfer === 'undefined') return
  const dt = new DataTransfer()
  for (const f of props.modelValue) dt.items.add(f)
  input.files = dt.files
}
// A list the parent set on its own (a reset, a load) drops the old refusal with it. Read by
// contents: a parent that empties its array in place is a change too.
let emitted: File[] | null = null
const same = (a: File[], b: File[] | null) =>
  !!b && a.length === b.length && a.every((f, i) => toRaw(f) === toRaw(b[i]))
watch(
  () => [...props.modelValue],
  (files) => {
    syncNativeFiles()
    if (!same(files, emitted)) rejection.value = ''
    if (files.length) missing.value = false
  },
  { immediate: true, flush: 'post' },
)
const update = (files: File[]) => {
  emitted = [...files]
  emit('update:modelValue', files)
}
// A form reset empties the file input and says nothing: once it is done, the input takes the model back.
useFormReset(inputRef, () => {
  syncNativeFiles()
  missing.value = false
})
// The form's check of a native `required` lands on the hidden input, whose message would point at
// a box nobody sees: Browse takes the focus instead, and the zone says why under its list.
function onMissing(e: Event) {
  e.preventDefault()
  missing.value = true
  rejection.value = t('grani.dropzone.needed')
  buttonRef.value?.$el.focus()
}
onMounted(() => {
  // The first files too: the watch above ran before the input existed.
  syncNativeFiles()
  if (isDev() && !props.ariaLabel && !field?.labelId.value && !control.value['aria-labelledby'])
    console.warn(
      '[grani] UiDropzone has no name: pass ariaLabel or put it in a UiField with a label.',
    )
})

// Browse holds through an upload and keeps its focus; a remove button turned off under the focus
// drops it to the body, and it goes to Browse instead. Whether the focus was inside is read
// before the render.
let focusWasInside = false
const keepFocusInside = async () => {
  await nextTick()
  const root = rootRef.value
  const active = document.activeElement
  if (!root || !focusWasInside) return
  if (!active || active === document.body || !root.contains(active))
    (buttonRef.value?.$el ?? root).focus()
}
if (typeof document !== 'undefined')
  watch(
    () => [props.busy, props.progress] as const,
    () => {
      focusWasInside = Boolean(rootRef.value?.contains(document.activeElement))
      void keepFocusInside()
    },
    { flush: 'pre' },
  )

// Sizes by the locale ("1,5 MB" in Russian), one decimal under ten. A limit rounds down, so a file
// that shows the limit's number always fits it.
const formatBytes = (b: number, round: (n: number) => number = Math.round) => {
  if (b === 0) return `0 ${t('grani.unit.kb')}`
  const mb = b >= 1024 * 1024
  const v = b / 1024 / (mb ? 1024 : 1)
  const shown = v < 10 ? Math.max(0.1, round(v * 10) / 10) : round(v)
  return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1, useGrouping: false }).format(shown)} ${t(mb ? 'grani.unit.mb' : 'grani.unit.kb')}`
}
const limit = computed(() => formatBytes(props.maxSize ?? 0, Math.floor))
const hint = computed(() => (props.maxSize ? t('grani.dropzone.upTo', { size: limit.value }) : ''))
const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`
const percent = computed(() =>
  props.progress != null && Number.isFinite(props.progress)
    ? Math.round(Math.min(100, Math.max(0, props.progress)))
    : null,
)

const shellClass = computed(() =>
  props.disabled
    ? 'border-border bg-surface-muted'
    : isInvalid.value
      ? 'border-danger-border bg-surface'
      : 'border-border bg-surface',
)
const zoneClass = computed(() => {
  if (props.disabled) return 'border-border bg-border-strong/40 text-disabled-fg'
  if (dragging.value) return 'border-brand-solid bg-brand-subtle text-fg'
  if (props.busy) return 'border-border bg-surface text-fg-muted'
  if (isInvalid.value) return 'border-danger-border bg-surface text-fg'
  return 'border-border-strong bg-surface text-fg'
})

// Uploaded are the files listed when an upload ended at 100 without a failure: bytes sent to a
// server that then said no are not a file kept. A file added after is not, and a later upload
// leaves the finished ones as they are: it carries only the rest. Only the end of an upload marks
// them, or a page that opens on a finished one: a failure the app clears later, still at 100, is
// not a success.
const uploaded = shallowRef(new Set<File>())
// How many files the last upload delivered, said when it ends.
let delivered = 0
watch(
  () => [props.busy, props.progress, props.failed] as const,
  ([busy, progress, failed], was) => {
    if (busy) delivered = 0
    const ended = !was || (was[0] && !busy)
    if (!ended || busy || progress !== 100 || failed) return
    const fresh = props.modelValue.filter((f) => !uploaded.value.has(f))
    if (!fresh.length) return
    delivered = fresh.length
    uploaded.value = new Set([...uploaded.value, ...fresh])
  },
  { immediate: true },
)
// The upload's own words take the region; the last "added" must not come back after them, and
// the end of the upload is said in its place, counting the files it delivered.
watch(
  () => props.busy,
  (busy, was) => {
    const cancelled = asked.value === 'cancel'
    asked.value = null
    if (busy) said.value = ''
    else if (was && props.progress === 100 && !props.failed && delivered)
      void say(said, tp('grani.dropzone.uploadedCount', delivered))
    // A cancel the app has answered is said, so the stop is not taken for nothing at all.
    else if (was && cancelled) void say(said, t('grani.dropzone.cancelled'))
  },
)
const isDone = (f: File) => uploaded.value.has(f)
const allDone = computed(() => props.modelValue.length > 0 && props.modelValue.every(isDone))
// The rows the running upload carries: every listed file not yet marked uploaded.
const pending = computed(() =>
  props.busy ? props.modelValue.filter((f) => !uploaded.value.has(f)) : [],
)
const isPending = (f: File) => pending.value.includes(f)
// A folded list is opened by a press on its line, or by a failure, whose rows say what it left.
const unfolded = ref(false)
// A failed upload marks the files it carried and did not deliver, once it has stopped: they are
// kept as the failure turns on, so a file added after it is a new file, not a failed one.
const failedFiles = shallowRef(new Set<File>())
watch(
  () => Boolean(props.failed) && !props.busy,
  (now, was) => {
    if (now && !was) {
      failedFiles.value = new Set(props.modelValue.filter((f) => !uploaded.value.has(f)))
      // A folded list opens on the files the failure left: their reason and Retry are on the rows.
      if (props.multiple && props.modelValue.length > 3) unfolded.value = true
    } else if (!now) failedFiles.value = new Set()
  },
  { immediate: true },
)
const isFailed = (f: File) => failedFiles.value.has(f)
// Cancel and Retry ask once: a second press before the app has answered sends nothing. The app's
// answer is a change of `busy` or `failed`, which opens them again.
const asked = ref<'cancel' | 'retry' | null>(null)
function once(what: 'cancel' | 'retry') {
  if (asked.value) return
  asked.value = what
  if (what === 'cancel') emit('cancel')
  else emit('retry')
}
watch(
  () => props.failed,
  () => {
    if (asked.value === 'retry') asked.value = null
  },
)
const reason = computed(() =>
  typeof props.failed === 'string' && props.failed.trim()
    ? props.failed
    : t('grani.dropzone.notUploaded'),
)
// The failure is said once, as the rows turn: the reason, as the row shows it.
watch(
  () => Boolean(props.failed) && !props.busy,
  (now, was) => {
    if (now && !was) void say(said, reason.value)
  },
)
const canRemove = (f: File) => (props.removable === 'auto' ? !isDone(f) : props.removable)
// Past three files the list folds into one line: count and total size.
const folded = computed(() => props.multiple && props.modelValue.length > 3)
// A list that stops folding forgets it was opened: past three again, it folds.
watch(folded, (now) => {
  if (!now) unfolded.value = false
})
// The folded line carries the upload while it stands for the rows; open, the rows carry it.
const carried = computed(() => pending.value.length > 0 && !unfolded.value)
const totalSize = computed(() => props.modelValue.reduce((sum, f) => sum + f.size, 0))

// Every type in `accept` is a MIME, a `type/*` family or an extension.
const accepts = (file: File) => {
  if (!props.accept) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return props.accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((a) =>
      a === '*/*'
        ? true
        : a.startsWith('.')
          ? name.endsWith(a)
          : a.endsWith('/*')
            ? type.startsWith(a.slice(0, -1))
            : type === a,
    )
}

// A refusal names its files: three at most, then how many more.
const namesOf = (files: File[]) => {
  const shown = files.slice(0, 3).map((f) => f.name)
  const rest = files.length - shown.length
  return rest > 0 ? `${shown.join(', ')} ${tp('grani.dropzone.andMore', rest)}` : shown.join(', ')
}
const MESSAGE: Record<FileRejection['reason'], (names: string) => string> = {
  type: (names) => t('grani.dropzone.rejectType', { names }),
  size: (names) => t('grani.dropzone.rejectSize', { names, size: limit.value }),
  duplicate: (names) => t('grani.dropzone.rejectDuplicate', { names }),
  // One file at a time has words of its own: in Russian the plural form for one also serves 21 and 31.
  count: (names) =>
    props.multiple && props.maxFiles !== 1
      ? tp('grani.dropzone.rejectCount', props.maxFiles ?? 0, { names })
      : t('grani.dropzone.rejectSingle', { names }),
  folder: (names) => t('grani.dropzone.rejectFolder', { names }),
}

const take = (incoming: File[], refused: FileRejection[] = []) => {
  if (props.disabled || props.busy || (!incoming.length && !refused.length)) return
  const rejections = [...refused]
  const accepted: File[] = []
  const known = new Set(props.modelValue.map(fileKey))
  const room = props.multiple ? (props.maxFiles ?? Infinity) - props.modelValue.length : 1
  for (const file of incoming) {
    if (!accepts(file)) rejections.push({ file, reason: 'type' })
    else if (props.maxSize && file.size > props.maxSize) rejections.push({ file, reason: 'size' })
    else if (props.multiple && known.has(fileKey(file)))
      rejections.push({ file, reason: 'duplicate' })
    else if (accepted.length >= room) rejections.push({ file, reason: 'count' })
    else {
      accepted.push(file)
      known.add(fileKey(file))
    }
  }
  // Every reason once: a wrong type and an oversized file in one batch are two sentences.
  const reasons = [...new Set(rejections.map((r) => r.reason))]
  void say(
    rejection,
    reasons
      .map((r) => MESSAGE[r](namesOf(rejections.filter((x) => x.reason === r).map((x) => x.file))))
      .join(' '),
  )
  if (accepted.length) {
    update(props.multiple ? [...props.modelValue, ...accepted] : accepted)
    void say(
      said,
      accepted.length === 1
        ? t('grani.dropzone.added', { name: accepted[0]!.name })
        : tp('grani.dropzone.addedCount', accepted.length),
    )
  }
  if (rejections.length) emit('reject', rejections)
}

// Busy, Browse keeps the focus and refuses: `aria-disabled`, not `disabled`, which would drop it.
// The button is never given `loading` here, so its own `aria-disabled` stays out of the way.
const pick = () => {
  if (props.busy) return
  inputRef.value?.click()
}
const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  take(Array.from(input.files ?? []))
  // The same file chosen twice must fire change again; the model is put back for a form submit.
  input.value = ''
  syncNativeFiles()
}

// A removed row takes its button with it: the focus goes to the row now in its
// place, the one above it, or Browse when the list is empty.
const remove = async (file: File) => {
  if (props.disabled || props.busy) return
  // Rows a finished upload locked have no button: count only the ones that do.
  const index = props.modelValue.slice(0, props.modelValue.indexOf(file)).filter(canRemove).length
  const wasInside = Boolean(rootRef.value?.contains(document.activeElement))
  rejection.value = ''
  update(props.modelValue.filter((f) => f !== file))
  void say(said, t('grani.dropzone.removed', { name: file.name }))
  await nextTick()
  if (!wasInside) return
  const rest = Array.from(listRef.value?.querySelectorAll<HTMLElement>('[data-remove]') ?? [])
  const next = rest[Math.min(index, rest.length - 1)] ?? buttonRef.value?.$el ?? rootRef.value
  next?.focus()
}

// dragenter and dragleave fire for every child crossed; a depth counter keeps the state steady.
const dragging = ref(false)
let depth = 0
// Only files light the zone: dragged text or a link would be dropped for nothing.
const carriesFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')
const onDragEnter = (e: DragEvent) => {
  depth++
  dragging.value = carriesFiles(e) && !props.disabled && !props.busy
}
const onDragOver = (e: DragEvent) => {
  if (e.dataTransfer)
    e.dataTransfer.dropEffect = !carriesFiles(e) || props.disabled || props.busy ? 'none' : 'copy'
}
const onDragLeave = () => {
  depth = Math.max(0, depth - 1)
  if (depth === 0) dragging.value = false
}
// A dropped folder arrives as a 0-byte "file"; the entry API tells it apart.
const onDrop = (e: DragEvent) => {
  depth = 0
  dragging.value = false
  const items = Array.from(e.dataTransfer?.items ?? []) as (DataTransferItem & {
    webkitGetAsEntry?: () => { isDirectory: boolean; name: string } | null
  })[]
  const folders = items
    .map((it) => ({ it, entry: it.webkitGetAsEntry?.() }))
    .filter(({ entry }) => entry?.isDirectory)
    .map(({ it, entry }) => it.getAsFile() ?? new File([], entry!.name))
  const names = new Set(folders.map((f) => f.name))
  take(
    Array.from(e.dataTransfer?.files ?? []).filter((f) => !names.has(f.name)),
    folders.map((file) => ({ file, reason: 'folder' as const })),
  )
}

// A file dropped a few pixels past the card would open in the tab and take the form with it.
// Another drop target (a native file input, an editable text, another dropzone) keeps its own.
const guard = (e: DragEvent) => {
  if (e.defaultPrevented || !Array.from(e.dataTransfer?.types ?? []).includes('Files')) return
  const target = e.target as Element | null
  if (target?.closest?.('input[type=file],[contenteditable]:not([contenteditable=false])')) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
}
onMounted(() => {
  window.addEventListener('dragover', guard)
  window.addEventListener('drop', guard)
})
onBeforeUnmount(() => {
  window.removeEventListener('dragover', guard)
  window.removeEventListener('drop', guard)
})

defineExpose({ focus: (options?: FocusOptions) => buttonRef.value?.$el.focus(options) })
</script>
