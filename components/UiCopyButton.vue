<!--
  UiCopyButton: a button that copies `value` to the clipboard and shows a check for 1.2 s. Take it
  beside an id, a key or any value a person copies.

  Outcome. A failure marks the glyph for 1.2 s, as a success shows its check, and also shows an
  error toast in the app's UiToaster, so mount one; a success shows a toast only with `toast`, since
  the check in view has already said it. The toast is not read aloud, because the live region has
  said it. Every copy button on the page refreshes the one toast instead of piling up more. Where
  the browser has no Clipboard API (a page over plain HTTP), the copy goes through a field no one
  sees, and the focus comes back.

  Shapes. Without text it is an icon button named "Copy", with the `Copy` glyph or your `icon`. With
  `label` or `truncate` it is a button with text; `truncate` shows the value cut in the middle in
  monospace (`613aa1…4510e0`) and copies it whole. A line break or another control character in the
  kept half of a cut value draws as a mark (`⏎`, a control picture), never left invisible: it still
  copies with the character itself. A `label` is a few words, as a button's; a value too long for
  its place is shown with `truncate`, cut in the middle.

  Ghost. A `ghost` one is text with no plate. Its glyph appears on hover and focus of this button
  only (always on a screen without hover), so a column of ids stays quiet. In a cell, `flush` pulls
  it back by its own padding and border, so the text starts on the column line. Beside a neighbor
  it keeps its box, because a negative margin there would overlap the neighbor.

  Outline. An `outline` one is a framed button: plate, frame and glyph always shown, since a frame
  around an empty space reads as a hole.

  Inline. An `inline` one is a word inside a line of text (the small line of a drawer's header): no
  plate, no height, no padding, the line's size and ink, and a small glyph always after it, since a
  glyph that waits for hover leaves a gap. It needs a `label` or `truncate`. A label longer than
  the line is cut with an ellipsis, whole in a tooltip (UiTruncate), and the glyph stays.

  Secrets. `label` and `truncate` put the text on the screen and in the accessible name, so a secret
  goes in with neither.

  Off. An empty `value` keeps the button in the Tab order and says "Nothing to copy", as a
  `disabledReason` says yours (UiButton's): in a tooltip and as its description. `disabled` alone
  takes it out of the Tab order.

  Placement. It sits in a table's copy column (named "Copy" and the value), in a UiInput's `#end`,
  in a drawer's header line, and beside UiPasswordField's input, before its generate button. Beside
  other copy buttons, each one takes its own `ariaLabel`, which holds the text it shows: a voice
  command says what it sees. A cut value is named by its cut by default ("Copy 613aa1…4510e0").

  Keyboard.
  A native button in every shape.
  - `Tab`: reaches it, an empty `value` too; `disabled` takes it out, unless it has a
    `disabledReason`.
  - `Enter` `Space`: copy; the focus stays on it after the copy.
  A `ghost` one shows its glyph on keyboard focus, as on hover.

  Reader.
  - Name: "Copy" for a glyph alone, "Copy" and the visible text for a cut value, `label` as it is,
    or `ariaLabel`; "Copied" never joins the name.
  - Outcome: "Copied" or "Could not copy" (when the clipboard refuses), from one polite live region
    outside the button, inside an open modal window when the button is in one, since the window
    hides the page from a reader. It is heard even after the button has left the view, and said
    again for a second copy in the same window.
  - Off with a reason: `aria-disabled`, and "Nothing to copy" or the `disabledReason` is its
    description.
  - Glyph: hidden.
  - Toast: not read, since the region has said it.

  States. At rest: a glyph alone, a cut id in monospace, or a label. Copied: a check for 1.2 s.
  Refused: an alert glyph for 1.2 s, no check, "Could not copy" and an error toast. Nothing to copy
  (an empty `value`) or `disabled`: the disabled ink, the reason in a tooltip. A long `inline`
  label: cut, whole in a tooltip. `ghost` shows the glyph on hover and focus only (always on a screen
  without hover), `outline` always, `inline` a small one after the word; `flush` in a cell; `xs`,
  `sm` and `md`; joined in a UiButtonGroup; a success toast with `toast`.

  Not for.
  - A glyph that does anything else: UiIconButton.
  - An action with text: UiButton.
  - A value cut to fit with nothing to copy: UiTruncate.
  - A secret shown as text on the screen: never; it is copied with neither `label` nor `truncate`.
-->
<template>
  <button
    v-if="text && variant === 'inline'"
    :ref="setEl"
    type="button"
    class="inline-flex min-w-0 max-w-full shrink-0 items-center gap-1 rounded-control text-inherit [&:enabled:not([aria-disabled=true])]:hover:text-fg"
    :class="[
      truncate && !label ? 'font-mono tabular-nums' : '',
      off ? 'cursor-not-allowed text-disabled-fg' : '',
    ]"
    :disabled="(off && !reason) || undefined"
    :aria-disabled="reason ? 'true' : undefined"
    :aria-describedby="reason ? reasonId : undefined"
    :aria-label="ariaLabel || (label ?? t('grani.copy.value', { value: text }))"
    :data-outcome="outcome"
    @click.capture="refuse"
    @click="onCopy"
    @keydown="holdEnter"
  >
    <UiTruncate :text="text" class="min-w-0" />
    <component
      :is="glyph"
      aria-hidden="true"
      class="h-3 w-3 shrink-0"
      :class="off ? 'text-disabled-fg' : failed ? 'text-danger' : 'text-fg-subtle'"
    />
    <span v-if="reason" :id="reasonId" hidden>{{ reason }}</span>
    <!-- The reason's hint stands inside: the word stays the one root, as UiButton does. -->
    <LazyHint v-if="reason" :anchor="() => el" :content="reason" late reason />
  </button>
  <UiButton
    v-else-if="text"
    :variant="variant === 'inline' ? 'ghost' : variant"
    :size="ladder"
    :disabled="off"
    :disabled-reason="reason"
    class="group/copy"
    :class="[
      truncate && !label ? 'font-mono tabular-nums' : '',
      variant === 'ghost' ? '!bg-transparent' : '',
      flush ? FLUSH[ladder] : '',
    ]"
    :aria-label="ariaLabel || (label ?? t('grani.copy.value', { value: text }))"
    :data-outcome="outcome"
    @click="onCopy"
  >
    <span>{{ text }}</span>
    <component
      :is="glyph"
      aria-hidden="true"
      class="transition-opacity duration-fast"
      :class="[
        copied || failed || variant === 'outline'
          ? ''
          : 'opacity-0 group-[:enabled:hover]/copy:opacity-100 group-focus-visible/copy:opacity-100 [@media(hover:none)]:opacity-100',
        failed ? 'text-danger' : '',
      ]"
    />
  </UiButton>
  <UiIconButton
    v-else
    :variant="variant === 'inline' ? 'ghost' : variant"
    :size="ladder"
    :disabled="off"
    :disabled-reason="reason"
    :ariaLabel="ariaLabel || t('grani.copy.action')"
    :data-outcome="outcome"
    @click="onCopy"
  >
    <component :is="glyph" aria-hidden="true" :class="failed ? 'text-danger' : ''" />
  </UiIconButton>
</template>

<script setup lang="ts">
import { useShared } from '../composables/useShared'
import { useControlSize } from '../composables/useControlSize'
import { computed, shallowRef, useId, watch, type Component } from 'vue'
import { announce } from '../utils/announce'
import { Check, CircleAlert, Copy } from '@lucide/vue'
import type { ControlSize } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useClipboard } from '../composables/useClipboard'
import { TOAST_LIMIT, useToast } from '../composables/useToast'
import { holdEnter } from '../utils/held'
import { truncateMiddle } from '../utils/truncateMiddle'
import { visualizeControl } from '../utils/visualizeControl'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiTruncate from './UiTruncate.vue'
import { LazyHint } from './lazyHint'

const props = withDefaults(
  defineProps<{
    /** What goes to the clipboard, whole. Empty, the button is off and says there is nothing to copy. */
    value: string
    /** Visible text beside the glyph, and the name as it is ("Copy link"); for a value shown as itself pass `ariaLabel` too. It wins over `truncate`. */
    label?: string
    /** Shows `value` cut in the middle to about this many characters, in monospace; the copy is still whole. */
    truncate?: number
    /** `ghost` is text alone, its glyph on hover, for an id in a table; `outline` is a framed button with its glyph always shown; `inline` is text inside a line of text, its size and ink, with a small glyph after it. */
    variant?: 'ghost' | 'outline' | 'inline'
    /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
    /** In a cell: the text starts on the column line, the button's own padding and border taken back. `ghost` only. */
    flush?: boolean
    /** No copy; the button stays in place. */
    disabled?: boolean
    /** Why it cannot copy now, while `disabled`: it stays in the Tab order and says the reason in a tooltip and as its description, as UiButton's. An empty `value` says "Nothing to copy" by itself. */
    disabledReason?: string
    /** Also say a success as a toast, where the button leaves the view once pressed; a failure always is one. */
    toast?: boolean
    /** Accessible name; defaults to "Copy" for a glyph alone and "Copy <text>" for a truncated value. */
    ariaLabel?: string
    /** The glyph at rest, a Lucide component; `Copy` when unset. Two copy buttons side by side tell what they copy by it: `Code`, `Bot`. */
    icon?: Component
  }>(),
  { variant: 'ghost', disabled: false, toast: false, flush: false, icon: undefined },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** The value reached the clipboard (`true`) or the clipboard refused (`false`). */
  copy: [ok: boolean]
}>()

const { t } = useUiT()
// The button's padding plus its 1px border, per step of the ladder: xs px-2.5, sm px-3, md px-5.
// The pull takes that much of the cell's padding, and the width gets it back: held to the cell's
// own width, a button sized by the table's column cut its glyph by as much.
const FLUSH = {
  xs: '-ms-[11px] !max-w-[calc(100%+11px)]',
  sm: '-ms-[13px] !max-w-[calc(100%+13px)]',
  md: '-ms-[21px] !max-w-[calc(100%+21px)]',
} as const
if (isDev() && props.variant === 'inline' && !props.label && !props.truncate)
  console.warn(
    '[grani] UiCopyButton: `inline` is a word in a line of text; with no `label` or `truncate` it is a glyph button.',
  )
if (isDev() && props.flush && props.variant !== 'ghost')
  console.warn(
    '[grani] UiCopyButton: `flush` pulls a ghost button onto a column line; a framed one would hang over the cell',
  )
const { copied, failed, copy, reset } = useClipboard(1200)
const toasts = useToast()
// One toast for every copy button on the page: a column whose clipboard refuses says it once.
const toastId = useShared<number | null>('grani:copy-toast', () => null)
function say(ok: boolean) {
  const outcome = ok
    ? ({ title: t('grani.copy.done'), tone: 'success' } as const)
    : ({ title: t('grani.copy.failed'), tone: 'danger' } as const)
  // Refreshed in place while it stands in view; behind the limit it would restart unseen.
  const id = toastId.value
  const inView = toasts.stack.value.slice(0, TOAST_LIMIT).some((item) => item.id === id)
  if (id !== null && inView) {
    toasts.update(id, outcome)
  } else {
    if (id !== null) toasts.close(id)
    toastId.value = toasts.show({ ...outcome, announce: false })
  }
}

// The value as a string: data may hand a number (an id) whatever the types say.
const whole = computed(() => (props.value == null ? '' : String(props.value)))
const off = computed(() => props.disabled || !whole.value)
// Off with a reason, the button keeps the focus and says it; an empty value always has one.
const reason = computed(() =>
  off.value
    ? props.disabledReason || (whole.value ? undefined : t('grani.copy.nothing'))
    : undefined,
)
const reasonId = `ui-copy-reason-${useId()}`
// The word keeps the focus while it is off with a reason, so its press is stopped before a
// listener round it hears it; the other shapes ride on UiButton and UiIconButton, which do the same.
function refuse(e: Event) {
  if (!reason.value) return
  e.preventDefault()
  e.stopImmediatePropagation()
}
const el = shallowRef<HTMLElement | null>(null)
const setEl = (r: unknown) => (el.value = r instanceof HTMLElement ? r : null)

// A line break or another control character in the kept half of a cut value draws nothing under
// `white-space: nowrap`: shown as a mark instead, so the person sees it is there before the click
// that copies it whole, carrying the character itself.
const text = computed(
  () =>
    props.label ??
    (props.truncate ? truncateMiddle(visualizeControl(whole.value), props.truncate) : ''),
)
// A refused copy marks the glyph for the same 1.2 s a success shows its check: the eye that missed
// the toast still sees the press did nothing.
const glyph = computed(() =>
  copied.value ? Check : failed.value ? CircleAlert : (props.icon ?? Copy),
)
const outcome = computed(() => (copied.value ? 'copied' : failed.value ? 'failed' : undefined))

// The check belongs to the value it copied: a new value is not on the clipboard yet.
watch(whole, reset)

async function onCopy() {
  const value = whole.value
  if (off.value) return
  const ok = await copy(value)
  // A new value while the write ran: the clipboard holds the old one, so nothing says "Copied".
  if (whole.value !== value) return emit('copy', ok)
  announce(ok ? t('grani.copy.done') : t('grani.copy.failed'))
  if (!ok || props.toast) say(ok)
  emit('copy', ok)
}
</script>
