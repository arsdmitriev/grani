<!--
  UiStepper: a count of things with minus and plus at its edges, the count between them. Take it
  for pieces, people, nights: a whole number a person changes by one more often than types.

  Count. It is a number field, the one UiInput draws with `numeric`: the value is text, empty is
  `null`, a number pasted or typed is read in the app's locale, and one it cannot read for sure is
  marked and told through `unsure`, as in UiInput; a press on it moves nothing and marks it at once.
  The step is `1` unless set; the buttons and ArrowUp and ArrowDown move by it and stop at `min` and
  `max`, which bound the buttons, not the typing. A count of things takes `min` (`0` or `1`): without
  it minus goes below zero. A fraction typed into it is carried as written, as a count past `max`
  is: the form checks it (`Number.isInteger`). The app takes or refuses a count in the same tick it
  is sent; a count confirmed later is a draft of the app's own. A unit stands after the count in
  `#end`, its short form (`pcs`, `kg`); an addon before it in `#start`.

  Width. The count is 3em wide, room for four digits, and the stepper keeps that width in a field
  rather than stretching across it; given a width, the count takes the room between the buttons, so
  they stand at the edges and never move. A longer count is cut at its end.

  Field. Standalone it takes `invalid` and `ariaLabel`; inside UiField it reads id, error and
  required from the field.

  Attributes. Attributes and listeners land on the input (`@blur`, `data-testid`); `class` and
  `style` on the capsule.

  Placement. In a form column under a UiField label; in a row of a list or a cart, beside the name
  of what is counted; joined with other controls in a UiButtonGroup.

  Keyboard.
  - `Tab`: reaches the count; the buttons are out of the tab order.
  - `ArrowUp` `ArrowDown`: move the count by the step without moving the caret, and stop at `min`
    and `max`.
  The buttons keep the focus and the caret in the count; `disabled` or `readonly` turns them off.

  Reader.
  - Count: a spinbutton named by `ariaLabel` or the field's label; it says its value and its
    bounds, and no value while the count is unsure. The unit in `#end` is not part of it.
  - Buttons: named by what they change, "Decrease Guests" and "Increase Guests", disabled at a
    bound; out of the tab order.
  - Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read
    with it.

  States. Rest, focus, a button resting at a bound, disabled, readonly, invalid, with a unit, at
  `xs`, `sm` and `md`.

  Not for.
  - A number with decimals or money: UiInput `numeric`.
  - A mark from 1 to N: UiScaleInput.
-->
<template>
  <UiInput
    v-bind="$attrs"
    :id="id"
    ref="inputRef"
    class="[.ui-field>&]:self-start"
    :model-value="modelValue"
    numeric
    :step="step"
    :min="min"
    :max="max"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :disabled="disabled"
    :invalid="invalid"
    :required="required"
    :aria-label="ariaLabel"
    :size="size"
    @update:model-value="emit('update:modelValue', $event)"
    @unsure="emit('unsure', $event)"
  >
    <template v-if="seen.start" #start><slot name="start" /></template>
    <template v-if="seen.end" #end><slot name="end" /></template>
  </UiInput>
</template>

<script setup lang="ts">
import { provide, ref, useSlots } from 'vue'
import type { ControlSize } from '../types/ui'
import { useSlotsSeen } from '../utils/slotsSeen'
import { STEPPER } from '../utils/stepper'
import UiInput from './UiInput.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    /** The count as text (`v-model`): `null` when emptied. A number is plain text (`12`) parsed by its owner on use. */
    modelValue: string | null
    /** How much a button or an arrow key moves the count. */
    step?: number
    /** The lowest count the buttons and the arrows reach. Typing is not clamped: the form validates. */
    min?: number
    /** The highest count the buttons and the arrows reach. */
    max?: number
    /** Native name for forms. */
    name?: string
    /** Own id when standalone. Inside UiField the field's id takes precedence. */
    id?: string
    /** Hint shown while empty. Not a replacement for a label. */
    placeholder?: string
    /** Prevents editing while keeping the count focusable: something else sets it. */
    readonly?: boolean
    /** Prevents input and interaction. */
    disabled?: boolean
    /** Marks the control invalid: red border and halo. Inside UiField the error sets this. */
    invalid?: boolean
    /** Standalone only: a count is needed, said to a reader and to a form. Inside UiField the field's `required` says so. */
    required?: boolean
    /** Accessible name when there is no visible label. */
    ariaLabel?: string
    /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  { step: 1, readonly: false, disabled: false, invalid: false, required: false },
)

const emit = defineEmits<{
  /** The count changed: the number as text, `null` when emptied. */
  'update:modelValue': [value: string | null]
  /** `true` while the count holds text the locale cannot read for sure (`1.200` in Russian), which the model carries as written; `false` when it does not. Said on mount, then on every change. */
  unsure: [unsure: boolean]
}>()

const slots = defineSlots<{
  /** An addon before the count: a currency sign, an icon. */
  start(props: Record<string, never>): any
  /** A unit after the count, its short form: `pcs`, `kg`. */
  end(props: Record<string, never>): any
}>()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots ?? useSlots())

// The number field below draws itself as a count: minus and plus at the edges.
provide(STEPPER, true)

const inputRef = ref<InstanceType<typeof UiInput> | null>(null)
defineExpose({
  /** Focuses the count. */
  focus: (options?: FocusOptions) => inputRef.value?.focus(options),
})
</script>
