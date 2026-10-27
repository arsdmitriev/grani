<!--
  UiCodeInput: a field for a one-time code, drawn as one cell per character. Take it for a
  sign-in or confirm step.

  One input. One real input lies invisible over the cells and holds the value. So the label,
  autofill of a code from SMS (`one-time-code`, which a caller's `autocomplete` replaces), paste
  and Backspace all work as the browser does them; the cells only draw the characters. The lit
  cell follows the real focus through `:focus-within`, and the hover is drawn from the root,
  since the input covers the cells.

  Caret. The caret stays at the end: a click moves it there, and so does the next character after
  any key or touch that moved it. A selection (double click, drag, select all) is left alone, so
  the code can be copied.

  Characters. `inputMode` picks the keyboard, `pattern` the allowed characters. A pasted text
  longer than the code is filtered first, then cut, so a code inside an SMS survives. A whole code
  pasted over characters already typed takes their place.

  Size. Cells stand on the control ladder, `md` by default, because it is the one control on its
  screen.

  Complete. `complete` fires once when typing, paste or autofill fill the code. A value set from
  outside is filtered and cut like a typed one but does not fire it, so a restored draft never
  submits itself.

  Model. The input shows the model: when the parent refuses a change, or a form resets, it goes
  back to the model. The parent clears a wrong code to `''`, so the same code can be typed again.

  Field. Standalone it takes `invalid` (a red border and halo, and `aria-invalid`; put the reason
  beside it) and `ariaLabel`; inside UiField it reads id, error and required.

  Attributes. Attributes and listeners land on the input, `class` and `style` on the root.

  Placement. Alone in a sign-in or confirm step, or in a UiField on a card or in a window, after
  the password.

  Keyboard.
  One real input over the cells: typing fills the next cell, and a paste or an autofill fills the
  code at once, dropping characters the pattern refuses.
  - `Backspace`: removes the last character.
  - `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown` `Home` `End`: do not move the caret, with `Ctrl`
    or `Meta` too.
  - `Alt+ArrowLeft` `Alt+ArrowRight`: stay the browser's, a page back or forward; on a Mac, where they
    jump a word in a text box, the caret comes back to the end.
  Nothing is emitted while an IME composes. `disabled` blocks the input, and `focus()` does nothing
  on it then.

  Reader.
  - Field: one text box named by `ariaLabel` or the field's label, with a hint read with it that
    says how many characters the code has. A code with no name warns in dev.
  - Cells: hidden from a screen reader; the input holds the value.
  - Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read
    with it, and `aria-required` says it is required.

  States. Rest, focus (the cell for the next character lit, the last one on a full code), partly
  filled, full, hover (the border drawn from the root), disabled (muted, inert), invalid (red
  border and halo on the cells, `aria-invalid` on the input), and two halves with `separator`.

  Not for.
  - A password: UiInput `type="password"`.
  - A number or a text of any length: UiInput.
  - A code shown to copy and never typed: UiCopyButton.
-->
<template>
  <div
    class="ui-code group relative inline-flex items-center gap-2"
    :class="rootClass"
    :style="rootStyle"
  >
    <template v-for="i in cells" :key="i">
      <span
        v-if="separator && i === Math.ceil(cells / 2) + 1"
        aria-hidden="true"
        class="h-px w-2 shrink-0 bg-border-strong"
      />
      <span
        aria-hidden="true"
        class="ui-code-cell flex items-center justify-center rounded-[min(var(--radius-control),33%)] border font-semibold tabular-nums transition-colors duration-fast"
        :class="[controlHeightClass[size], CELL[size], chrome, disabled ? '' : 'text-fg']"
        :data-next="activeIndex === i - 1 || undefined"
        :data-invalid="isInvalid || undefined"
        :data-disabled="disabled || undefined"
      >
        <template v-if="chars[i - 1]">{{ chars[i - 1] }}</template>
        <span
          v-else-if="activeIndex === i - 1"
          class="ui-caret hidden h-[1.1em] w-px bg-fg group-focus-within:block"
        />
      </span>
    </template>
    <input
      v-bind="bound"
      ref="inputRef"
      type="text"
      :value="composing ? composed : shown"
      :inputmode="inputMode"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      :disabled="disabled"
      class="absolute inset-0 h-full w-full cursor-default opacity-0 disabled:cursor-not-allowed"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @input="onInput"
      @paste="onPaste"
      @keydown="onKeydown"
      @beforeinput="onBeforeInput"
      @click="onClick"
      @focus="caretToEnd"
    />
    <span :id="`${uid}-hint`" class="sr-only">{{ tp('grani.code.hint', cells) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import type { ControlSize } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { controlHeightClass } from '../utils/controlSize'
import { controlChromeClass } from '../utils/controlChrome'
import { useFieldControl } from '../utils/field'
import { useFormReset } from '../utils/composition'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The entered code (`v-model`); empty is `''`. */
    modelValue: string
    /** Number of characters in the code, a whole number from 1 to 100; anything else is held to that and warned about in development. */
    length?: number
    /** Keyboard shown on a phone. `numeric` for SMS, PIN, and authenticator codes. `text` for codes with letters. */
    inputMode?: 'numeric' | 'text'
    /** Allowed characters, tested one character at a time (not the whole code). A RegExp or its source. When omitted, `numeric` allows digits and `text` allows letters and digits. */
    pattern?: RegExp | string
    /** Prevents entering and editing the code. */
    disabled?: boolean
    /** Marks the control as invalid. Inside UiField, the error state sets this automatically. */
    invalid?: boolean
    /** Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so. */
    required?: boolean
    /** Native name for forms. */
    name?: string
    /** Own id when standalone. Inside UiField, the field's id takes precedence. */
    id?: string
    /** Accessible name when there is no visible label. */
    ariaLabel?: string
    /** Step of the control ladder for the cells. */
    size?: ControlSize
    /** Shows a short rule between the code groups. */
    separator?: boolean
  }>(),
  {
    length: 6,
    inputMode: 'numeric',
    disabled: false,
    invalid: false,
    size: 'md',
    separator: false,
  },
)

const emit = defineEmits<{
  /** The code changed. */
  'update:modelValue': [value: string]
  /** The code reached its length. */
  complete: [value: string]
}>()

// Square cells: as wide as the ladder step is tall.
const CELL: Record<ControlSize, string> = {
  xs: 'w-7 text-sm/5.5',
  sm: 'w-9 text-base',
  md: 'w-11 text-lg',
}

const { tp } = useUiT()
const uid = useId()
const inputRef = ref<HTMLInputElement | null>(null)
const {
  field,
  id: inputId,
  invalid: isInvalid,
  aria,
} = useFieldControl(() => ({ id: props.id, invalid: props.invalid, required: props.required }), {
  after: () => [`${uid}-hint`],
})
const { rootClass, rootStyle, control } = useSplitAttrs()
const chrome = computed(() => controlChromeClass(props.disabled, isInvalid.value))
// A one-time code by default; a recovery code field turns the SMS offer off with its own value.
const bound = computed(() =>
  ownWhereSet(
    { autocomplete: 'one-time-code', ...control.value },
    {
      id: inputId.value,
      name: props.name,
      required: props.required || undefined,
      'aria-label': props.ariaLabel,
      ...aria.value,
    },
  ),
)

// The cells drawn: a whole number of 1 to 100. A code is a few characters; a length from a config
// that is huge, negative or not a number would draw thousands of cells or none.
const MAX_LENGTH = 100
const cells = computed(() => Math.min(Math.max(Math.trunc(props.length) || 1, 1), MAX_LENGTH))

const chars = computed(() => [...shown.value])
// The next character lands here; on a full code the last cell stays lit. The
// ring and the caret follow `:focus-within` in CSS, not a focus event: the
// state can never lag behind the real focus.
const activeIndex = computed(() => Math.min(chars.value.length, cells.value - 1))

// A global or sticky RegExp keeps `lastIndex` between tests and would skip every other character.
const allowed = computed(() => {
  if (props.pattern instanceof RegExp)
    return new RegExp(props.pattern.source, props.pattern.flags.replace(/[gy]/g, ''))
  if (typeof props.pattern === 'string') return new RegExp(`^(?:${props.pattern})$`)
  return props.inputMode === 'numeric' ? /^[0-9]$/ : /^[a-z0-9]$/i
})

// Counted in characters, not in UTF-16 units: a pattern that takes an emoji keeps it whole.
const clean = (raw: string) =>
  [...raw]
    .filter((ch) => allowed.value.test(ch))
    .slice(0, cells.value)
    .join('')
// A value from outside is read as a typed one: what the cells show is what could be typed.
const shown = computed(() => clean(props.modelValue ?? ''))

// Mid-composition (IME) nothing is cleaned and the input shows its own text: a host re-render
// must not write the model back over the characters being typed.
const composing = ref(false)
const composed = ref('')
function onCompositionStart(e: Event) {
  composed.value = (e.target as HTMLInputElement).value
  composing.value = true
}
function onCompositionEnd(e: Event) {
  composing.value = false
  onInput(e)
}
async function onInput(e: Event) {
  if (composing.value) {
    composed.value = (e.target as HTMLInputElement).value
    return
  }
  const el = e.target as HTMLInputElement
  const next = clean(el.value)
  // The DOM value follows the cleaned one, so a refused character never shows a caret jump.
  if (el.value !== next) el.value = next
  // Against what is shown, not the raw model: an over-length model typed at is no change.
  const was = shown.value
  if (next !== was) emit('update:modelValue', next)
  if ([...next].length === cells.value && next !== was) emit('complete', next)
  // After the owner's turn the input follows the model, a refusal included.
  await nextTick()
  if (!composing.value && el.value !== shown.value) el.value = shown.value
}

// A whole code pasted over a few typed characters takes their place: put after them it would mix two
// codes, and the cut would complete one the person never had. A part of a code goes on from the
// caret, as the browser puts it.
function onPaste(e: ClipboardEvent) {
  const el = e.target as HTMLInputElement
  const code = clean(e.clipboardData?.getData('text') ?? '')
  if (el.readOnly || !shown.value || [...code].length !== cells.value) return
  e.preventDefault()
  el.value = code
  void onInput(e)
}

// After a form reset the input goes back to the model the cells draw; a composition keeps its text.
useFormReset(inputRef, (el) => {
  if (!composing.value) el.value = shown.value
})
onMounted(() => {
  if (isDev() && cells.value !== props.length)
    console.warn(
      `[grani] UiCodeInput: length ${props.length} is drawn as ${cells.value}; a code is a whole number of characters, 1 to ${MAX_LENGTH}.`,
    )
  if (
    isDev() &&
    !bound.value['aria-label'] &&
    !bound.value['aria-labelledby'] &&
    !field?.labelId.value
  )
    console.warn(
      '[grani] UiCodeInput has no name: pass ariaLabel or put it in a UiField with a label.',
    )
})

// The caret lives at the end; arrows and Home/End do not move it. Focus puts it there; a click
// moves a caret but leaves a selection (double click, drag), so the code can be copied out.
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])
function onKeydown(e: KeyboardEvent) {
  // Alt with an arrow is the browser's way back a page. On a Mac it is a word jump in a text box
  // instead: the key stays the browser's, and the caret it moved goes back to the end after it.
  // ⌘ and Ctrl with an arrow move the caret only, so those are held as the arrow alone is.
  if (e.altKey) {
    if (CARET_KEYS.has(e.key)) setTimeout(caretToEnd)
    return
  }
  if (CARET_KEYS.has(e.key)) e.preventDefault()
  // Safari sends no input for a Backspace with nothing before the caret: the caret goes to the
  // end first, so the key takes the last character.
  if (e.key === 'Backspace' && inputRef.value?.selectionStart === inputRef.value?.selectionEnd)
    caretToEnd()
}
function caretToEnd() {
  const el = inputRef.value
  if (!el) return
  const end = el.value.length
  if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end)
}
// A caret moved by a key it does not hold (Ctrl+A or Ctrl+B on a Mac) or by a touch handle: the
// next character still lands at the end and Backspace still takes the last one. The field does
// it itself, since Safari settles where a character goes before this event can move the caret.
// A selection, kept for copying, is left alone, and so is a word being composed.
function onBeforeInput(e: InputEvent) {
  const el = inputRef.value
  if (!el || e.isComposing || composing.value) return
  const end = el.value.length
  if (el.selectionStart !== el.selectionEnd || el.selectionStart === end) return
  const typed = e.inputType === 'insertText' && e.data
  const erased = e.inputType === 'deleteContentBackward'
  if (!typed && !erased) return caretToEnd()
  e.preventDefault()
  el.value = typed ? el.value + e.data : [...el.value].slice(0, -1).join('')
  caretToEnd()
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: e.inputType, data: e.data }))
}
function onClick() {
  const el = inputRef.value
  if (el && el.selectionStart === el.selectionEnd) caretToEnd()
}
function focusEnd() {
  const el = inputRef.value
  if (!el || props.disabled) return
  el.focus()
  caretToEnd()
}

defineExpose({ focus: () => focusEnd() })
</script>
