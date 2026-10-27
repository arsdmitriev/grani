<!--
  UiSwitch: an on or off setting that applies at once. Take it where a change takes effect
  without saving a form.

  Element. It is a `button` with `role="switch"`, so a screen reader says "switch, on".

  Form. With a `name`, an on switch sends `value` (`on` by default) under that name with the
  form, and an off switch sends nothing, as a checkbox does.

  Label. Label text goes in the default slot, toggles the switch on click, and is then its only
  name; without it, `ariaLabel` names the switch. Inside UiField it takes the field's label and
  description. The label starts at the middle of the track (2px down beside the 24px `md`
  track), so a long label wraps below.

  Model. When the parent does not apply a change, the switch stays as the model says.

  Loading. `loading` keeps the focus on the switch while the change is saved.

  Invalid. An invalid switch that is off tints its track with the danger tone.

  Attributes. Attributes land on the button, `class` and `style` on the root.

  Size. Its `size` is a track, not a box, so it stays `sm` by default and does not follow the
  app's size (`createGrani({ size })`).

  Placement. Beside UiCheckbox and UiRadio in a form column. A setting row is UiListItem
  `as="label"` with the switch in `#actions`. It also works as a `UiReveal` trigger.

  Keyboard.
  A native button.
  - `Tab`: reaches it.
  - `Enter` `Space`: toggle it.
  `disabled` blocks it. `loading` blocks it too while the focus stays, the caller's own click
  included. A label in the slot toggles it on click, except while disabled.

  Reader.
  - Switch: `role="switch"`; it says on or off (`aria-checked`).
  - Name: the slot text, else `ariaLabel`, else the field's label: one name only. A switch with no
    name warns in dev.
  - Loading: `loading` says busy (`aria-busy`, `aria-disabled`).
  - Errors: `invalid` sets `aria-invalid`, and the field's words are read with it.
  - Required: `aria-required` says it is required, except in a group, whose legend says it once.

  States. Off, on, hover, focus, disabled (the plate, and the thumb in the disabled ink so on and
  off still look different), loading (a spinner in the thumb), invalid (the track in the danger
  tone while off; disabled wins over it), and the two tracks, `sm` and `md`.

  Not for.
  - Saved with the form, not applied at once: UiCheckbox.
  - One answer out of a few: UiRadioGroup.
  - A toggle that is a button: UiButton `pressed`.
-->
<template>
  <label
    v-if="$slots.default"
    class="inline-flex items-start gap-2 text-sm/5.5"
    :class="[
      disabled
        ? 'cursor-not-allowed text-fg-muted'
        : loading
          ? 'cursor-progress text-fg'
          : 'cursor-pointer text-fg',
      rootClass,
    ]"
    :style="rootStyle"
  >
    <button v-bind="control" @click="toggle" @keydown="holdEnter">
      <span :class="thumb"
        ><UiSpinner v-if="loading" class="h-full w-full text-surface [stroke-width:3]"
      /></span>
      <input v-if="sends" type="hidden" :name="name" :value="value" :form="formId" />
    </button>
    <span :id="textId" :class="size === 'md' ? 'mt-0.5' : ''"
      ><slot /><span v-if="markRequired" aria-hidden="true" class="text-danger-subtle-fg">
        *</span
      ></span
    >
  </label>
  <button
    v-else
    v-bind="control"
    :class="[control.class, rootClass]"
    :style="rootStyle"
    @click="toggle"
    @keydown="holdEnter"
  >
    <span :class="thumb"
      ><UiSpinner v-if="loading" class="h-full w-full text-surface [stroke-width:3]"
    /></span>
    <input v-if="sends" type="hidden" :name="name" :value="value" :form="formId" />
  </button>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { computed, onMounted, useId, useSlots } from 'vue'
import { isDev } from '../utils/dev'
import UiSpinner from './UiSpinner.vue'
import { useFieldControl } from '../utils/field'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { holdEnter } from '../utils/held'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** On or off (`v-model`). */
    modelValue: boolean
    /** Prevents toggling. */
    disabled?: boolean
    /** Track size: `sm` 20px, `md` 24px. */
    size?: 'sm' | 'md'
    /** Native name for forms: an on switch sends `value` under it, an off one nothing. */
    name?: string
    /** Sent under `name` while on. */
    value?: string
    /** Accessible name when the slot is empty and there is no field label; slot text wins over it. */
    ariaLabel?: string
    /** The change is being saved: a spinner in the thumb, `aria-busy`, no toggling; focus stays. */
    loading?: boolean
    /** Own id when standalone. Inside UiField the field's id takes precedence. */
    id?: string
    /** Marks the switch invalid: the track takes the danger tone while off. Inside UiField the error sets this. */
    invalid?: boolean
    /** Standalone only: the switch must be on, said to a reader, with a star after its text. Inside UiField the field's `required` says so. */
    required?: boolean
  }>(),
  { disabled: false, size: 'sm', loading: false, invalid: false, required: false, value: 'on' },
)

const emit = defineEmits<{
  /** The state changed. */
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  /** The visible label, to the right of the track; clicking it toggles. */
  default(props: Record<string, never>): any
}>()

const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
// `data-testid` and `aria-*` reach the button whether or not a label wraps it.
const { rootClass, rootStyle, control: buttonAttrs } = useSplitAttrs()
// A group field hands down no id, so each switch keeps its own, as UiCheckbox; and no "required":
// the legend says it once, on every switch it would read as "turn all on".
const {
  field,
  id: switchId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(() => ({ id: props.id, invalid: props.invalid, required: props.required }))
const textId = useId()
// One source for the name, as in UiCheckbox: the slot text when there is one, else the field's label.
const labelledBy = computed(() => (seen.default ? textId : field?.labelId.value))
const markRequired = computed(() => isRequired.value && !field?.labelId.value)

const tracks = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
}
// Thumb 4px smaller than the track, 2px in from the edge at either end; mirrored under rtl.
const thumbs = {
  sm: { base: 'h-4 w-4', on: 'translate-x-4 rtl:-translate-x-4', off: 'translate-x-0' },
  md: { base: 'h-5 w-5', on: 'translate-x-5 rtl:-translate-x-5', off: 'translate-x-0' },
}

// A hidden input carries the value: a `button` is never sent. Off or disabled sends nothing,
// as a checkbox; the input follows the model, so a form reset cannot move it.
const sends = computed(() => Boolean(props.name) && props.modelValue === true && !props.disabled)
const formId = computed(() => buttonAttrs.value.form as string | undefined)
// Ours win only where set: an empty field value must not wipe the caller's `aria-describedby`.
// Saving, the caller's click is held back too: Space on the kept focus would send it again.
const control = computed(() => {
  const caller = props.loading ? { ...buttonAttrs.value, onClick: undefined } : buttonAttrs.value
  return ownWhereSet(caller, own.value)
})
const own = computed(() => ({
  id: switchId.value,
  type: 'button' as const,
  role: 'switch',
  'aria-checked': props.modelValue === true,
  'aria-disabled': props.loading || undefined,
  'aria-busy': props.loading || undefined,
  // One name: with slot text the label's words are it, and `ariaLabel` would be a second.
  'aria-label': seen.default ? undefined : props.ariaLabel,
  'aria-labelledby': labelledBy.value,
  ...aria.value,
  disabled: props.disabled,
  // No border: the track is a solid pill, gray off and brand on.
  class: [
    'ui-switch relative inline-flex shrink-0 items-center rounded-pill p-0.5 transition-colors duration-fast ease-standard',
    'focus:outline-hidden enabled:cursor-pointer disabled:cursor-not-allowed',
    props.loading ? 'pointer-events-none' : '',
    tracks[props.size],
    props.disabled
      ? 'bg-border-strong/40'
      : props.modelValue
        ? 'bg-brand-solid enabled:hover:bg-brand-hover'
        : isInvalid.value
          ? 'bg-danger-border enabled:hover:bg-danger'
          : 'bg-border-strong enabled:hover:bg-fg-subtle',
  ],
}))

// A switch with no text, no ariaLabel and no field label is read as a bare "switch".
onMounted(() => {
  if (
    isDev() &&
    !slots.default &&
    !props.ariaLabel &&
    !labelledBy.value &&
    !buttonAttrs.value['aria-labelledby']
  )
    console.warn(
      '[grani] UiSwitch has no name: put text in the slot, pass ariaLabel or a UiField label.',
    )
})

// Disabled, the thumb takes the disabled ink: white on the pale plate is 1.2:1 and on and
// off could not be told apart; saving too, the spinner turns on it rather than on the plate.
// `ui-switch-thumb` is the forced-colors hook.
const thumb = computed(() => [
  'ui-switch-thumb flex items-center justify-center rounded-pill transition-transform duration-fast ease-standard',
  // Saving, the thumb drops its fill and the spinner turns in its place, at its size.
  props.disabled ? 'bg-disabled-fg' : props.loading ? 'bg-transparent' : 'bg-surface',
  thumbs[props.size].base,
  props.modelValue ? thumbs[props.size].on : thumbs[props.size].off,
])

function toggle() {
  if (!props.disabled && !props.loading) emit('update:modelValue', !props.modelValue)
}
</script>
