<!--
  UiInput: a one-line text field in a capsule. Take it for text, a number or a password, with
  addons at either end.

  Capsule. The capsule carries the border, background, height and focus ring. `#start` and `#end`
  hold addons: a unit, an icon, a button, a counter. Addons share the capsule but are not part of
  the value. A unit is its short form, two or three letters (`kg`, `pcs`), not a word. A button last in `#end` sits as close to the edge as the password eye does.

  Password. A `password` gets an eye that shows the characters; `v-model:passwordVisible` drives
  it from outside. The eye keeps the focus in the value. It never offers the browser's own
  spellcheck, autocapitalize or autocorrect, shown or hidden, so a password never reaches a
  server's suggestions. To generate and copy a password, take UiPasswordField.

  Numbers. A number is `numeric`, never `type="number"`: that type rejects the comma of a Russian
  keyboard and empties the field. With `step` the field draws its own arrows and moves by the
  step on ArrowUp and ArrowDown, the caret kept where it was and the digits the value was written
  with (`10.99` goes to `11.00`). `min` and `max` bound the arrows, not the typing; an arrow stops
  at its bound, one off the step's grid too. A number with a unit in `#end` is as wide as its digits, the unit after them; give
  it a `placeholder` (`0.00`), or an empty field shows the unit alone at the start.

  TypeScript checks against `numeric` written as it is: `bare` with it does not compile, and a
  field that turns numeric at run time is two tags, one under `v-if` and one under `v-else`:
  `:numeric="flag"` does not compile.

  Bare. `variant="bare"` drops the capsule: for a field in a window's header, such as a search
  over its results in UiModal's `#header`.

  Search. A `search` with text shows a cross that clears it; Escape clears it too. With `loading`
  (its results on their way) the cross turns into its spinner, the same button, so a focus on it
  stays, and clearing waits: a press and an Escape clear nothing then.

  Value. The value is text, numbers included: the owner parses it when it uses it, and a number
  passed in is read as its text. Empty follows the library's one rule: a text field is empty at
  `''`; a `numeric` one holds a number, so empty is `null`, and it sends `null` when emptied. The
  field shows the model: when the owner refuses a change, or a form resets, it goes back to it. A
  native form gets a number as the field shows it, `12,5` in a locale with a decimal comma.

  Locale. A number is read in the app's locale: "1 234,50" pasted in a Russian app is 1234.50,
  "1,234" is a thousand in English, and so is "1.234" in German. Text the locale cannot read for
  sure ("1,23" in English), or with no digit at all, is kept as written, reaches the model as it is
  and is marked invalid on blur. The model cannot tell such text from a number ("2,500" and an unsure
  "2.500" are both `2.500` in Russian), so the field says it: `unsure` is `true` while it holds such
  text, and the app refuses to save then.

  Field. Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and
  required from the field.

  Attributes. Attributes and listeners land on the input (`pattern`,
  `autocapitalize`, `@blur`); `class` and `style` on the capsule. A change the field makes itself (an
  arrow, the cross, Escape) comes through `update:modelValue` alone, not a DOM `input` event.

  Placement. In UiField; joined with a button in UiButtonGroup (a search); inside
  UiPasswordField; as the search of UiTableToolbar; as the count of UiStepper, between its minus and
  plus; and in a form column beside UiTextarea, UiSelect and UiDatePicker.

  Keyboard.
  A native text field.
  - `Tab`: reaches it; a button in `#end`, or the cross of a search with text, comes next, one step
    later, since the number arrows are out of the tab order.
  - `ArrowUp` `ArrowDown`: with `numeric` and `step`, move the value by the step without moving the
    caret, and stop at `min` and `max`; with Shift, Alt, Ctrl or Cmd held they are the browser's.
  - `Escape`: in a `search` with text, clears it and goes no further; while its results are on
    their way it clears nothing and still goes no further; in an empty one it passes on.
  Keys do nothing while an IME composes. The eye and the arrows keep the focus and the caret in the
  value.

  Reader.
  - Field: a text box named by `ariaLabel` or the field's label, never by the placeholder. A field
    with no name warns in dev.
  - Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read
    with it, and `aria-required` says it is required.
  - Eye: a toggle button with its own name and `aria-pressed`.
  - Arrows: named by the field, "Increase Price" and "Decrease Price".
  - Search cross: has a name.
  - Loading: the field and the cross say busy (`aria-busy`); in a search a status region in the
    capsule, there from the start, says "Searching".

  States. Rest, hover, focus (the capsule draws the ring), disabled (its own plate), readonly
  (looks ordinary, cannot be edited), invalid (red border and halo; disabled wins over it), with
  addons, `numeric` with its arrows, `password` shown or hidden, a
  `search` with its cross, a `search` with `loading` (the spinner in the cross's place), and `bare`
  with no capsule.

  Not for.
  - Several lines: UiTextarea.
  - A pick from a list: UiSelect.
  - A day: UiDatePicker.
  - A count of things, with minus and plus: UiStepper.
  - A mark from 1 to N: UiScaleInput.
  - A new password with generate and copy: UiPasswordField.
  - A one-time code: UiCodeInput.
-->
<template>
  <div
    class="ui-capsule inline-flex items-center"
    :class="[shell, rootClass]"
    :style="rootStyle"
    :data-invalid="isInvalid || undefined"
    :data-bare="bare || undefined"
    @pointerdown="onCapsulePointerDown"
  >
    <span v-if="arrowed && ariaLabel && !field?.labelId.value" :id="`${partsId}-name`" hidden>{{
      ariaLabel
    }}</span>
    <button
      v-if="stepper"
      type="button"
      tabindex="-1"
      :aria-label="countName ? undefined : t('grani.input.decrement')"
      :aria-labelledby="countName ? `${partsId}-decrement ${countName}` : undefined"
      :disabled="disabled || readonly || atMin"
      :class="edgeClass"
      @mousedown.prevent="inputRef?.focus()"
      @click="bump(-1)"
    >
      <span :id="`${partsId}-decrement`" hidden>{{ t('grani.input.decrement') }}</span>
      <Minus aria-hidden="true" />
    </button>
    <span
      v-if="$slots.start"
      class="flex shrink-0 items-center gap-1 text-placeholder [&>svg]:h-4 [&>svg]:w-4"
    >
      <slot name="start" />
    </span>
    <input
      v-bind="bound"
      :id="inputId"
      ref="inputRef"
      :role="stepper ? 'spinbutton' : undefined"
      :aria-valuenow="stepper ? countNow : undefined"
      :aria-valuemin="stepper ? min : undefined"
      :aria-valuemax="stepper ? max : undefined"
      :name="name"
      :type="type === 'password' && revealed ? 'text' : type"
      :value="display(shownText())"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode ?? (stepper ? 'numeric' : numeric ? 'decimal' : undefined)"
      :maxlength="maxlength"
      :readonly="readonly"
      :disabled="disabled"
      :required="required || undefined"
      :aria-label="ariaLabel"
      :aria-invalid="aria['aria-invalid']"
      :aria-describedby="aria['aria-describedby']"
      :aria-busy="loading || undefined"
      :aria-required="aria['aria-required']"
      class="h-full min-w-0 bg-transparent text-fg placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed disabled:text-disabled-fg [&::-webkit-search-cancel-button]:appearance-none"
      :class="valueClass"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @input="onNumberInput"
      @blur="settle"
      @keydown="onKeydown"
    />
    <span
      v-if="$slots.end"
      class="flex shrink-0 items-center gap-1 text-placeholder [&>svg]:h-4 [&>svg]:w-4"
      :class="
        stepper
          ? 'pe-2 text-xs/4.5'
          : type === 'password' || type === 'search'
            ? ''
            : '[&>button:last-child]:-me-1.5'
      "
    >
      <slot name="end" />
    </span>
    <button
      v-if="stepper"
      type="button"
      tabindex="-1"
      :aria-label="countName ? undefined : t('grani.input.increment')"
      :aria-labelledby="countName ? `${partsId}-increment ${countName}` : undefined"
      :disabled="disabled || readonly || atMax"
      :class="edgeClass"
      @mousedown.prevent="inputRef?.focus()"
      @click="bump(1)"
    >
      <span :id="`${partsId}-increment`" hidden>{{ t('grani.input.increment') }}</span>
      <Plus aria-hidden="true" />
    </button>
    <!-- The arrows are pointer helpers, out of the tab order: the keyboard has its
         own (ArrowUp, ArrowDown), and a Tab must leave the field in one step. -->
    <span
      v-if="numeric && step && !stepper && !disabled && !readonly"
      class="-me-1.5 ms-auto flex h-full shrink-0 flex-col justify-center py-0.5"
    >
      <button
        type="button"
        tabindex="-1"
        :aria-label="countName ? undefined : t('grani.input.increment')"
        :aria-labelledby="countName ? `${partsId}-increment ${countName}` : undefined"
        :disabled="atMax"
        class="flex h-1/2 w-5 items-center justify-center rounded-control text-fg-muted enabled:hover:bg-surface-muted enabled:hover:text-fg disabled:cursor-not-allowed disabled:text-disabled-fg [&_svg]:h-3.5 [&_svg]:w-3.5"
        @mousedown.prevent="inputRef?.focus()"
        @click="bump(1)"
      >
        <span :id="`${partsId}-increment`" hidden>{{ t('grani.input.increment') }}</span>
        <ChevronUp aria-hidden="true" />
      </button>
      <button
        type="button"
        tabindex="-1"
        :aria-label="countName ? undefined : t('grani.input.decrement')"
        :aria-labelledby="countName ? `${partsId}-decrement ${countName}` : undefined"
        :disabled="atMin"
        class="flex h-1/2 w-5 items-center justify-center rounded-control text-fg-muted enabled:hover:bg-surface-muted enabled:hover:text-fg disabled:cursor-not-allowed disabled:text-disabled-fg [&_svg]:h-3.5 [&_svg]:w-3.5"
        @mousedown.prevent="inputRef?.focus()"
        @click="bump(-1)"
      >
        <span :id="`${partsId}-decrement`" hidden>{{ t('grani.input.decrement') }}</span>
        <ChevronDown aria-hidden="true" />
      </button>
    </span>
    <!-- A search on its way: the cross turns into its spinner, the same button, so a focus on it
         stays, and clearing waits; with nothing to clear the spinner stands alone. -->
    <UiIconButton
      v-if="crossShown"
      ref="crossRef"
      variant="ghost"
      size="xs"
      :icon="X"
      :ariaLabel="t('grani.input.clear')"
      :loading="loading"
      :class="capsuleEndButtonClass(ladder)"
      @mousedown.prevent
      @click="clear"
    />
    <!-- In the cross's own box and muted ink, so a wait that loses its text keeps its spinner still. -->
    <span
      v-else-if="loading"
      class="flex w-7 shrink-0 items-center justify-center text-fg-muted"
      :class="[controlHeightClass.xs, capsuleEndButtonClass(ladder)]"
      ><UiSpinner
    /></span>
    <UiIconButton
      v-if="type === 'password'"
      variant="ghost"
      size="xs"
      :icon="revealed ? EyeOff : Eye"
      :ariaLabel="t('grani.input.showPassword')"
      :aria-pressed="revealed"
      :disabled="disabled"
      :class="capsuleEndButtonClass(ladder)"
      @mousedown.prevent="inputRef?.focus()"
      @click="toggleRevealed"
    />
    <!-- Always there, filled while a search waits: a region mounted with its words goes unheard. -->
    <span v-if="type === 'search'" role="status" class="sr-only">{{
      loading ? t('grani.input.searching') : ''
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { isImeKey } from '../utils/ime'
import { useSlotsSeen } from '../utils/slotsSeen'
import { useControlSize } from '../composables/useControlSize'
import { computed, inject, nextTick, onMounted, provide, ref, useId, useSlots, watch } from 'vue'
import { ChevronDown, ChevronUp, Eye, EyeOff, Minus, Plus, X } from '@lucide/vue'
import type { ControlSize } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { controlHeightClass } from '../utils/controlSize'
import { capsuleEndButtonClass, controlChromeClass } from '../utils/controlChrome'
import { useComposedValue, useFormReset } from '../utils/composition'
import { readLocaleNumber, showLocaleNumber, stepValue } from '../utils/numberStep'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { useFieldControl } from '../utils/field'
import { STEPPER } from '../utils/stepper'
import UiIconButton from './UiIconButton.vue'
import UiSpinner from './UiSpinner.vue'

defineOptions({ inheritAttrs: false })
const inStepper = inject(STEPPER, false)
// The count is this field alone: a field in its slots is a field again.
provide(STEPPER, false)

interface InputBase {
  /** Native type, `text` by default. A number stays `text` with `numeric`: `type="number"` has its own spinner and rejects a comma. */
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel'
  /** Native name for forms. */
  name?: string
  /** Own id when standalone. Inside UiField the field's id takes precedence, so the label always points at the control. */
  id?: string
  /** Hint shown while empty. Not a replacement for a label. */
  placeholder?: string
  /** Browser autofill hint: `email`, `current-password`. */
  autocomplete?: string
  /** Keyboard to show on a phone. */
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  /** Maximum number of characters. */
  maxlength?: number
  /** Prevents editing while keeping the control focusable: something else sets the value. */
  readonly?: boolean
  /** Prevents input and interaction. */
  disabled?: boolean
  /** A request for this value is on its way, as a search: a spinner at the end in the cross's place, and clearing waits. */
  loading?: boolean
  /** Marks the control invalid: red border and halo. Inside UiField the error sets this. */
  invalid?: boolean
  /** Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so. */
  required?: boolean
  /** Accessible name when there is no visible label. A prop, not `aria-label`: the root is the capsule, the name belongs to the control. */
  ariaLabel?: string
  /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
  size?: ControlSize
  /** Whether a `password` shows its characters (`v-model:passwordVisible`). Uncontrolled when omitted: the eye keeps the state. */
  passwordVisible?: boolean
}
/** A text: empty is `''`; a capsule, or `bare` in a window's header. */
type TextInput = InputBase & {
  /** The value as text (`v-model`): empty is `''`, or `null` with `numeric`. A number is plain text (`1234.5`) parsed by its owner on use. */
  modelValue: string
  /** `capsule` (the default) is the text field. `bare` has no capsule: the field is a window's header, edge to edge, larger type (a search over its results); the window draws the line under it. Text or search only, never `numeric`: no ring, no halo, `size` has no say. */
  variant?: 'capsule' | 'bare'
  /** A number as text: tabular monospaced digits, decimal keyboard, a comma becomes a point, and with an `#end` unit the value sizes to its content so the unit sits right after it. */
  numeric?: false
  /** With `numeric`: arrows in the capsule and ArrowUp/ArrowDown move the value by this much (`0.1` for money, `1` for pieces). A value written more precisely moves by its own last digit. */
  step?: undefined
  /** With `numeric`: the lowest value the arrows reach. Typing is not clamped: the form validates. */
  min?: undefined
  /** With `numeric`: the highest value the arrows reach. */
  max?: undefined
}
/** A number as text: empty is `null`; a capsule with arrows. */
type NumberInput = InputBase & {
  modelValue: string | null
  variant?: 'capsule'
  numeric: true
  step?: number
  min?: number
  max?: number
}

// Destructured for its default alone: `undefined`, not the `false` a boolean prop falls to, so an
// eye nobody binds keeps its own state.
const { passwordVisible = undefined, ...props } = defineProps<TextInput | NumberInput>()
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** The value changed: text, `''` when emptied, or with `numeric` the number as text and `null` when emptied. */
  'update:modelValue': [value: string | null]
  /** The eye was toggled. */
  'update:passwordVisible': [visible: boolean]
  /** With `numeric`: `true` while the field holds text the locale cannot read for sure, which the model carries as written; `false` when it does not. Said on mount, then on every change, right after the model it concerns. */
  unsure: [unsure: boolean]
}>()

defineSlots<{
  /** Addons before the value: a unit, an icon, a text. */
  start(props: Record<string, never>): any
  /** Addons after the value: a unit, a counter, a button. */
  end(props: Record<string, never>): any
}>()

const { t, locale } = useUiT()
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const { rootClass, rootStyle, control } = useSplitAttrs()
// A browser's enhanced spellcheck can send what it checks to a server: off in both states, so
// revealing a password never turns it back on. Set for password alone, so a caller's own
// spellcheck on another type still reaches the field (ownWhereSet keeps it where this is unset).
const bound = computed(() =>
  ownWhereSet(control.value, {
    spellcheck: props.type === 'password' ? 'false' : undefined,
    autocapitalize: props.type === 'password' ? 'off' : undefined,
    autocorrect: props.type === 'password' ? 'off' : undefined,
  }),
)

// The eye is uncontrolled unless the owner passes a boolean; a type that is no
// longer a password forgets what the eye showed.
const ownRevealed = ref(false)
const revealed = computed(() => passwordVisible ?? ownRevealed.value)
watch(
  () => props.type,
  (type) => {
    if (type !== 'password') ownRevealed.value = false
  },
)
// A browser puts the caret at the start when the type changes: the selection is kept across.
const toggleRevealed = async () => {
  const el = inputRef.value
  const range = el ? ([el.selectionStart, el.selectionEnd] as const) : null
  const next = !revealed.value
  ownRevealed.value = next
  emit('update:passwordVisible', next)
  if (!el || !range || range[0] == null || range[1] == null) return
  const [start, end] = range
  const put = () => el.setSelectionRange(start, end)
  await nextTick()
  put()
  // Some engines move the caret once more as they lay the new type out: put it back after the frame too.
  requestAnimationFrame(put)
}
const inputRef = ref<HTMLInputElement | null>(null)
const {
  field,
  id: inputId,
  invalid: isInvalid,
  aria,
} = useFieldControl(() => ({
  id: props.id,
  invalid: props.invalid || numberUnsure.value,
  required: props.required,
}))

// UiStepper draws this field as its count: minus and plus at the edges, the value between them.
const stepper = computed(() => inStepper)
// A count's buttons say what they change ("Decrease Guests"): the field's label, or the name the
// count was given, which a hidden line beside it carries. The lines take an id of their own: a count
// outside a field and without `id` has none, and two such counts would name each other's buttons.
const partsId = `ui-count-${useId()}`
// The stepper's buttons and a number's small arrows are named by the field: "Increase Guests".
const arrowed = computed(() => stepper.value || (props.numeric && Boolean(props.step)))
const countName = computed(() =>
  !arrowed.value
    ? undefined
    : (field?.labelId.value ?? (props.ariaLabel ? `${partsId}-name` : undefined)),
)
// A count is a spinbutton: a screen reader hears its value and its bounds.
const countNow = computed(() => {
  // An unsure count has no value to say: "1.200" in Russian is not 1.2.
  if (modelUnsure.value) return undefined
  const n = props.modelValue === null || props.modelValue === '' ? NaN : Number(props.modelValue)
  return Number.isFinite(n) ? n : undefined
})
const bare = computed(() => props.variant === 'bare')
onMounted(() => {
  if (
    isDev() &&
    !props.ariaLabel &&
    !control.value['aria-label'] &&
    !control.value['aria-labelledby'] &&
    !field?.labelId.value
  )
    console.warn(
      `[grani] ${inStepper ? 'UiStepper' : 'UiInput'} has no name: pass ariaLabel or put it in a UiField with a label.`,
    )
})
// The step of the stepper is 1 unless set: it counts pieces.
const effectiveStep = computed(() => props.step ?? (stepper.value ? 1 : undefined))
// The model as text: a number from a loose caller is its digits, `null` is empty.
const text = () => (props.modelValue == null ? '' : String(props.modelValue))
const current = computed(() => {
  const n = Number.parseFloat(readLocaleNumber(shownText(), locale.value).value)
  return Number.isFinite(n) ? n : 0
})
const atMin = computed(() => props.min != null && current.value <= props.min)
const atMax = computed(() => props.max != null && current.value >= props.max)
// Edge buttons take the full height of the capsule and sit on the muted plate, as a key of a keypad.
const edgeClass = computed(() => [
  'flex h-full shrink-0 items-center justify-center bg-surface-muted text-fg-muted enabled:hover:text-fg disabled:cursor-not-allowed disabled:text-disabled-fg [&_svg]:h-3.5 [&_svg]:w-3.5',
  ladder.value === 'xs' ? 'w-7' : ladder.value === 'sm' ? 'w-8' : 'w-10',
])

// With a unit after it the value is as wide as its digits, so "12.50 EUR" reads as one
// (one digit wide at least, so "12 km" keeps the same gap as "0.75 kg"); the arrows stand at the end;
// a stepper centers its count in the room between its buttons, so they stand at the edges and never move;
// its count is 3em wide, unless the stepper is given a width, not a text field's twenty: four digits
// of the monospace face fit in Chromium, Firefox and WebKit, and five only where the face is narrow
// (measured, 23.10.2026: 42px for five in Chromium and Firefox, 45px of 42 in WebKit).
const valueClass = computed(() => [
  props.numeric ? 'font-mono tabular-nums' : '',
  stepper.value
    ? 'w-[3em] flex-auto text-center'
    : props.numeric && seen.end
      ? 'w-auto min-w-[1ch] [field-sizing:content]'
      : 'flex-1',
])

const chrome = computed(() => controlChromeClass(props.disabled, isInvalid.value))
// The capsule's frame, or none: a bare field stands at the window's gutter in the header's type.
const shell = computed(() => {
  if (bare.value) return 'h-14 gap-3 px-overlay text-base'
  return [
    'rounded-control border text-sm/5.5',
    controlHeightClass[ladder.value],
    chrome.value,
    stepper.value ? 'gap-0 overflow-hidden px-0' : 'gap-2 px-3',
  ]
})

// A number is read in the app's locale and never changes its magnitude: "1,234" is a thousand in
// English, "1.234" in German, and a string the locale cannot read for sure ("1,23" in English, two
// decimal marks) is kept as written and marked invalid (readLocaleNumber). The model is plain: no
// grouping, a point for the decimal; the control shows it with the locale's decimal mark, so the
// value reads the same when it is edited again. While the person types, the control keeps the
// marks as typed and only the model is read, so "1,2" on its way to "1,234" never jumps; on blur,
// on Enter and on a paste the control shows the model, and an unsure value its red mark.
const typing = ref(false)
// What the control holds while it differs from how the model is shown: the typed text, or the
// unsure text that is the model itself. A model the owner changes or refuses drops it.
const typed = ref<{ model: string; text: string } | null>(null)
let read = { value: '', ok: true }
const shownText = () => {
  const model = text()
  if (!props.numeric) return model
  if (typed.value && typed.value.model === model) return typed.value.text
  return showLocaleNumber(model, locale.value)
}
// The model already holds unsure text while it is typed ("1,2" on its way to "1,234"), so the app
// hears it at once: a save by a keyboard shortcut, which never leaves the field, knows it too. The
// red mark waits for the typing to end. The model alone cannot say it: "2,500" and an unsure "2.500" are both
// `2.500` in Russian.
const modelUnsure = computed(() => props.numeric && !readLocaleNumber(shownText(), locale.value).ok)
const numberUnsure = computed(() => modelUnsure.value && !typing.value)
// Said on mount as well, `false` too: a field mounted again (a window opened anew over a reset
// model) clears the flag the last one left, which no event of its own could.
watch(
  modelUnsure,
  (now, was) => {
    if (props.numeric && now !== was) emit('unsure', now)
  },
  { immediate: true },
)
const readNumber = (value: string) => {
  read = readLocaleNumber(value, locale.value)
  const keep = !read.ok || typing.value
  typed.value = keep ? { model: read.value, text: value } : null
  return keep ? value : showLocaleNumber(read.value, locale.value)
}
const { composing, display, onInput, onCompositionStart, onCompositionEnd } = useComposedValue(
  (value) => emit('update:modelValue', props.numeric ? read.value || null : value),
  (value) => (props.numeric ? readNumber(value) : value),
  shownText,
)
useFormReset(inputRef, (el) => (el.value = shownText()))
// Typing and deleting keep the marks as typed; a paste, a drop or an autofill is read at once.
function onNumberInput(e: Event) {
  const kind = (e as InputEvent).inputType ?? ''
  typing.value = props.numeric && /^(insertText|insertCompositionText|delete)/.test(kind)
  onInput(e)
}
// The typing is over: the control shows the model, an unsure value keeps its text and turns red.
function settle() {
  typing.value = false
  if (!typed.value) return
  const reading = readLocaleNumber(typed.value.text, locale.value)
  if (!reading.ok) return
  typed.value = null
  // Written at once, not on the next render: a form this Enter sends reads the settled text in
  // every engine, whichever runs first, the submit or the render.
  if (inputRef.value) inputRef.value.value = showLocaleNumber(reading.value, locale.value)
}

// An arrow or an arrow key moves the value through `update:modelValue` alone: no DOM `input`
// event follows a change the field makes itself.
function bump(direction: 1 | -1) {
  const step = effectiveStep.value
  // The arrow moves the value as the locale reads it; an unsure one has no magnitude to move from.
  const value = readLocaleNumber(shownText(), locale.value)
  if (!step) return
  // A stepper's press on text it cannot read moves nothing: the typing is over, so the mark shows
  // at once instead of a press that seems to do nothing.
  if (!value.ok) {
    if (stepper.value) settle()
    return
  }
  const el = inputRef.value
  const caret = el && document.activeElement === el ? el.selectionStart : null
  const length = el?.value.length ?? 0
  emit(
    'update:modelValue',
    stepValue(value.value, direction * step, { min: props.min, max: props.max }),
  )
  if (!el || caret == null) return
  // The caret keeps its digit, counted from the end when the number grows or shrinks at its head.
  void nextTick(() => {
    const at = Math.min(el.value.length, Math.max(0, caret + el.value.length - length))
    el.setSelectionRange(at, at)
  })
}
// The cross: a search with text, open to edits. A cross that leaves while it holds the focus (the
// text emptied from outside) hands the focus to the value, not to the page.
const crossShown = computed(
  () => props.type === 'search' && Boolean(props.modelValue) && !props.disabled && !props.readonly,
)
const crossRef = ref<{ $el: Element } | null>(null)
watch(
  crossShown,
  (shown, was) => {
    if (was && !shown && crossRef.value?.$el.contains(document.activeElement))
      inputRef.value?.focus()
  },
  { flush: 'pre' },
)
// A search with text clears itself: the cross, or Escape as in a native search field.
// The focus stays in the field, and an Escape that cleared goes no further (a dialog stays).
function clear() {
  emit('update:modelValue', props.numeric ? null : '')
  inputRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  // An IME's keys are its own: Escape cancels the candidates, the arrows walk them.
  if (composing.value || isImeKey(e)) return
  // Enter sends the form: the value is settled first, so a refusal finds an unsure one marked.
  if (e.key === 'Enter' && props.numeric) settle()
  // Escape in a search with text is the field's, also while its results are on their way: then it
  // clears nothing, but neither the browser (which empties a search itself) nor a window gets it.
  if (e.key === 'Escape' && props.type === 'search' && props.modelValue && !props.readonly) {
    e.preventDefault()
    e.stopPropagation()
    if (!props.loading) clear()
    return
  }
  if (!props.numeric || !effectiveStep.value || props.disabled || props.readonly) return
  // A chord is the browser's: Alt, Ctrl or ⌘ with an arrow moves the caret, Shift selects; a step
  // takes the arrow alone.
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  const direction = e.key === 'ArrowUp' ? 1 : -1
  // A key rests at its bound as the arrow does: nothing is sent, and up never pulls a value down.
  if ((direction > 0 && atMax.value) || (direction < 0 && atMin.value)) return
  bump(direction)
}

// A click on a unit or an icon lands in the value; a click on a button stays a
// click. The search for that button stops at the capsule: a focusable ancestor
// (a tab panel, a dialog) is not an addon.
function onCapsulePointerDown(e: PointerEvent) {
  const capsule = e.currentTarget as HTMLElement
  const target = e.target as HTMLElement
  if (target === inputRef.value) return
  const hit = target.closest('button, a, input, select, textarea, [tabindex]')
  if (hit && hit !== capsule && capsule.contains(hit)) return
  e.preventDefault()
  inputRef.value?.focus()
}

defineExpose({ focus: (options?: FocusOptions) => inputRef.value?.focus(options) })
</script>
