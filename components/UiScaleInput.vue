<!--
  UiScaleInput: one mark on a scale of a few steps, 1 to 10 by default. Take it for how hard,
  how good or how much.

  Layout. A bar of segments is filled up to the mark, with the number in each segment. A readout
  shows "mark / max" with a unit at its end; the name is the field's, a UiField `group` label over
  it, or `ariaLabel` alone. Words at the two ends say what low and
  high mean, and a screen reader hears them with the first and last step.

  Empty. No mark is `null`, as a choice is: a clear sends `null`.

  Thermometer. `variant="thermometer"` colors the fill by the mark in five stops, from danger
  through warning to success, each with an ink that reads on it. `invert` is for scales where
  more is worse.

  Field. Standalone it takes `ariaLabel`, `invalid` and `required`. Required is only announced,
  not enforced, because a hidden input takes no validation. Inside UiField `group` the legend
  names it, and the description or the error describes it. Invalid tints the empty segments and
  the frame with the danger tone.

  Form. `name` sends the mark with a form through a hidden input; nothing is sent while there is
  no answer or the scale is disabled.

  Stray values. A value off the scale shows as no answer. It is dropped only when the scale
  itself shrinks below it.

  Attributes. Attributes land on the radiogroup, ours where we set one; `class` and `style` on
  the root.

  Steps. Twelve steps at most, because a narrower segment cannot be hit with a finger. For a free
  number take UiInput with `numeric`.

  Placement. Beside UiRadioGroup `segmented` and UiInput in a form column.

  Keyboard.
  A radiogroup underneath. There is one tab stop: on the mark, or on the first step while there is
  no answer.
  - `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: move the mark from the step in focus; `ArrowUp`
    at `max` and `ArrowDown` at `min` send nothing.
  - `Home` `End`: jump to the ends.
  - `Delete` `Backspace`: clear it; a click on the mark clears it too, and `clearable` off stops
    both.
  - `Space` `Enter`: pick the step in focus and never clear.
  - `Alt` `Ctrl` `Meta`: keys with them go to the browser.
  After a clear or a refused move, the focus returns to the tab stop.

  Reader.
  - Group: a radiogroup named by the field's legend, or by `ariaLabel`; the field's description or
    error is read with it.
  - Step: a radio named by its number out of `max`, the first and the last with their end words;
    the chosen one is `aria-checked`.
  - States: `invalid` is `aria-invalid`; `required` is `aria-required` standalone and silent inside
    a UiField `group`; `disabled` is `aria-disabled`.

  States. No answer (a dash in the readout), a mark with the bar filled to it, hover, focus,
  disabled (the disabled tokens; it wins over invalid), invalid (the empty segments and the frame
  in the danger tone, the frame alone on a full bar), required, `thermometer` colored by the
  mark, inverted, with or without numbers, and a unit in the readout.

  Loading. The scale has no loading of its own: while its mark is on its way, its owner draws a
  UiSkeleton in its shape, a short line where the readout stands over a bar of the control's
  height for its size (`h-7`, `h-9`, `h-11`), and the field's words at the ends stay, with a
  `role="status"` of its own that says the load. The demo's Loading tab has it.

  Not for.
  - A free number: UiInput `numeric`.
  - A count of things: UiStepper.
  - One answer in words: UiRadioGroup `segmented`.
  - A mark shown without editing: UiProgress with `:step="1"`, in a table or on a card.
-->
<template>
  <div :class="rootClass" :style="rootStyle">
    <input
      v-if="name && mark != null && !disabled"
      type="hidden"
      :name="name"
      :value="mark"
      :form="formId"
    />
    <div v-if="readout" class="mb-2 flex items-baseline justify-end gap-2">
      <span class="font-mono text-xs/4.5 tabular-nums text-fg-muted">
        <b class="text-sm/5.5 font-semibold text-fg">{{ mark ?? '—' }}</b>
        <span>&nbsp;/ {{ max }}{{ unit ? ' ' + unit : '' }}</span>
      </span>
    </div>
    <div
      v-bind="bound"
      class="flex gap-0.5 rounded-control"
      :class="[controlHeightClass[ladder], frameClass]"
      role="radiogroup"
    >
      <button
        v-for="(n, i) in steps"
        :key="n"
        :ref="(el) => setRef(el, i)"
        type="button"
        role="radio"
        :aria-checked="mark === n"
        :aria-label="stepName(n, i)"
        :tabindex="i === rovingIndex ? 0 : -1"
        :disabled="disabled"
        :class="segmentClass(n, i)"
        :style="filled(n) && !disabled ? fillStyle : undefined"
        @click="pick(n)"
        @keydown="onKeydown($event, i)"
      >
        {{ showNumbers ? n : '' }}
      </button>
    </div>
    <div v-if="lowLabel || highLabel" class="mt-1 flex justify-between text-xs/4.5 text-fg-muted">
      <span>{{ lowLabel }}</span>
      <span>{{ highLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { controlHeightClass } from '../utils/controlSize'
import { useControlSize } from '../composables/useControlSize'
import { useFieldControl } from '../utils/field'
import { isFiniteNumber } from '../utils/scale'
import { SCALE_RAMP_CLASS, SCALE_RAMP_INK, scaleRampStep } from '../utils/scaleRamp'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The mark (`v-model`); `null` while there is no answer. */
    modelValue: number | null
    /** First step of the scale. */
    min?: number
    /** Last step. Twelve steps at most. */
    max?: number
    /** A click on the mark, Delete or Backspace clears the answer; off, an answer once given stays. */
    clearable?: boolean
    /** Nothing can be picked. */
    disabled?: boolean
    /** Marks the control invalid: the empty segments and the frame take the danger tone. Inside UiField the error sets this. */
    invalid?: boolean
    /** An answer is needed: said to a reader on the group. Not enforced by a form: the hidden input takes no validation. Inside UiField group the legend says it instead. */
    required?: boolean
    /** Shown after the readout: "7 / 10 km". */
    unit?: string
    /** The line "mark / max" above the bar. */
    readout?: boolean
    /** Own id of the group, for a reference from elsewhere (`aria-controls`, a link); a field names it by its legend. */
    id?: string
    /** Form field name: a hidden input sends the mark; nothing is sent while there is no answer or the scale is disabled. */
    name?: string
    /** Numbers in the segments; off for a dense row. */
    showNumbers?: boolean
    /** `brand` fills with the brand; `thermometer` colors the fill by the mark, danger through warning to success. */
    variant?: 'brand' | 'thermometer'
    /** Reverses the thermometer: more is worse (difficulty, pain, load). */
    invert?: boolean
    /** What the low end means: "easy". */
    lowLabel?: string
    /** What the high end means: "hard". */
    highLabel?: string
    /** Accessible name of the scale when there is no UiField around. */
    ariaLabel?: string
    /** Height of the bar on the control ladder: `xs` 28, `sm` 36. Unset, the app's size (`createGrani({ size })`); `md` is read as `sm`: the scale has no `md`. */
    size?: 'xs' | 'sm'
  }>(),
  {
    min: 1,
    max: 10,
    clearable: true,
    disabled: false,
    invalid: false,
    required: false,
    unit: '',
    readout: true,
    showNumbers: true,
    variant: 'brand',
    invert: false,
    lowLabel: '',
    highLabel: '',
    size: undefined,
  },
)

// The app's step, but never `md`: the scale has no row that tall.
const step = useControlSize(() => props.size)
const ladder = computed(() => (step.value === 'md' ? 'sm' : step.value))
const emit = defineEmits<{
  /** The mark changed; `null` after a clear. */
  'update:modelValue': [value: number | null]
}>()

const MAX_STEPS = 12

const { t } = useUiT()
const { rootClass, rootStyle, control } = useSplitAttrs()
// The form its `form` attribute names gets the hidden inputs too, as a native control's value.
const formId = computed(() => control.value.form as string | undefined)
// In a group field the legend, which names this group, already says "required".
const {
  field,
  invalid: isInvalid,
  disabled: isDisabled,
  aria,
} = useFieldControl(() => ({
  invalid: props.invalid,
  required: props.required,
  disabled: props.disabled,
}))
// Ours win only where set, and a caller's description joins the field's.
const bound = computed(() =>
  ownWhereSet(control.value, {
    // Its own id only: a field's id is for a `<label for>`, and a group is no labelable element.
    id: props.id,
    'aria-label': field?.labelId.value ? undefined : props.ariaLabel || undefined,
    'aria-labelledby': field?.labelId.value,
    ...aria.value,
    'aria-disabled': isDisabled.value || undefined,
  }),
)

// Bounded before it is built: an Infinity or a huge max would hang the render. Past the hard cap
// the dev warning below says why nothing is drawn.
const HARD_CAP = 100
const steps = computed(() => {
  const out: number[] = []
  if (!isFiniteNumber(props.min) || !isFiniteNumber(props.max)) return out
  if (props.max - props.min + 1 > HARD_CAP) return out
  for (let n = props.min; n <= props.max; n++) out.push(n)
  return out
})
// The first and last step say their word too: "1 of 10, easy".
const stepName = (n: number, i: number) => {
  const word = i === 0 ? props.lowLabel : i === steps.value.length - 1 ? props.highLabel : ''
  return word
    ? t('grani.scale.valueEnd', { n, max: props.max, word })
    : t('grani.scale.value', { n, max: props.max })
}
// An invalid scale says so on its frame too: a full bar has no empty segment to tint.
const frameClass = computed(() =>
  isInvalid.value && !props.disabled
    ? 'ring-1 ring-danger-border ring-offset-2 ring-offset-surface'
    : '',
)
onMounted(() => {
  if (isDev() && steps.value.length > MAX_STEPS)
    console.warn(
      `[grani] UiScaleInput: ${steps.value.length} steps cannot be hit with a finger; ${MAX_STEPS} at most, a free number is UiInput numeric.`,
    )
  if (isDev() && !steps.value.length)
    console.warn(
      `[grani] UiScaleInput: min ${props.min} is above max ${props.max}; no step to pick.`,
    )
  if (isDev() && !bound.value['aria-label'] && !bound.value['aria-labelledby'])
    console.warn(
      '[grani] UiScaleInput has no name: pass ariaLabel, or put it in a UiField group with a label.',
    )
})

// A value off the steps (out of range or between two), a NaN or an Infinity is no answer: it never reaches the
// readout, a fill or the ramp, even before the owner takes the drop below.
const mark = computed(() =>
  isFiniteNumber(props.modelValue) && steps.value.includes(props.modelValue)
    ? props.modelValue
    : null,
)
const filled = (n: number) => mark.value != null && n <= mark.value

// The thermometer mixes the status tokens by the mark's position (`utils/scaleRamp`):
// the class holds the mix, the segment only sets the share.
const ramp = computed(() => {
  if (props.variant !== 'thermometer' || mark.value == null) return null
  const span = props.max - props.min
  const f = span > 0 ? (mark.value - props.min) / span : 1
  return scaleRampStep(props.invert ? 1 - f : f)
})
const fillStyle = computed(() => (ramp.value ? { '--ui-scale-mix': ramp.value.mix } : undefined))

// The ends carry the corners; the 2px gaps show the surface as tick marks.
function segmentClass(n: number, i: number): string[] {
  return [
    'flex-1 text-xs/4.5 font-semibold tabular-nums transition-colors duration-fast',
    i === 0 ? 'rounded-s-control' : '',
    i === steps.value.length - 1 ? 'rounded-e-control' : '',
    props.disabled
      ? `cursor-not-allowed ${filled(n) ? 'bg-disabled-fg text-disabled-bg' : 'bg-disabled-bg text-disabled-fg'}`
      : filled(n)
        ? ramp.value
          ? `${SCALE_RAMP_CLASS[ramp.value.half]} ${SCALE_RAMP_INK[ramp.value.ink]}`
          : 'bg-brand-solid text-brand-solid-fg'
        : isInvalid.value
          ? 'bg-danger-subtle text-danger-subtle-fg enabled:hover:bg-danger-border'
          : 'bg-border text-fg enabled:hover:bg-border-strong',
  ]
}

const refs = ref<HTMLButtonElement[]>([])
const setRef = (el: unknown, i: number) => {
  if (el) refs.value[i] = el as HTMLButtonElement
}
// One tab stop: the mark, or the first step while there is no answer.
const rovingIndex = computed(() => {
  const idx = mark.value == null ? -1 : steps.value.indexOf(mark.value)
  return idx === -1 ? 0 : idx
})

// After the owner's turn the focus stands on the tab stop: on the new mark, back on the old one
// after a refusal, on the first step after a clear. Never on a step that left the tab order.
async function commit(next: number | null, focus: boolean) {
  if (props.disabled) return
  const hadFocus = refs.value.some((el) => el === document.activeElement)
  if (next !== mark.value) emit('update:modelValue', next)
  if (!focus && !hadFocus) return
  await nextTick()
  refs.value[rovingIndex.value]?.focus()
}
function pick(n: number) {
  commit(props.clearable && mark.value === n ? null : n, false)
}
function moveTo(v: number) {
  commit(Math.min(props.max, Math.max(props.min, v)), true)
}
function onKeydown(e: KeyboardEvent, i: number) {
  // A chord is the browser's (back, forward, delete a word), not the scale's.
  if (e.altKey || e.ctrlKey || e.metaKey) return
  // Arrows move from the step in focus; with no answer the first arrow lands on the first step.
  const from = mark.value == null ? props.min - 1 : steps.value[i]!
  const map: Record<string, () => void> = {
    ArrowRight: () => moveTo(from + 1),
    ArrowUp: () => moveTo(from + 1),
    ArrowLeft: () => moveTo(from - 1),
    ArrowDown: () => moveTo(from - 1),
    Home: () => moveTo(props.min),
    End: () => moveTo(props.max),
    // Space picks and never clears, as a radio; Delete takes the answer back.
    ' ': () => commit(steps.value[i]!, true),
    Enter: () => commit(steps.value[i]!, true),
    Delete: () => props.clearable && commit(null, false),
    Backspace: () => props.clearable && commit(null, false),
  }
  const act = map[e.key]
  if (!act) return
  e.preventDefault()
  act()
}
// A mark that the scale shrank away from is dropped, so the owner holds no step that is not
// there. A value off the scale given at mount is only shown as no answer: nothing is sent for it.
watch(steps, (list) => {
  if (props.modelValue != null && !list.includes(props.modelValue)) emit('update:modelValue', null)
})

defineExpose({ focus: () => refs.value[rovingIndex.value]?.focus() })
</script>
