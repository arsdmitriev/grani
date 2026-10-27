<!--
  UiCheckbox: a native checkbox with its text in the slot, for a yes or no in a form. The whole
  row is the label, so a click on the text toggles it too.

  Mark. The box is drawn as the library's 18px mark. It stands at the first line (18px in a 20px
  line, 1px down), so a long label wraps beside it.

  Model. The box shows the model: when the parent refuses a change, or a form resets, the box
  goes back to the model.

  Mixed. `indeterminate` is the mixed state of a "select all" box. It is display only: a press
  ends it only when the parent says so.

  Standalone. It takes `ariaLabel` (the slot text wins when both are given) and `invalid`.
  `invalid` draws a red border and sets `aria-invalid`; put the reason beside it, or use UiField.
  With no text of its own, as in a table's rows, the box takes a press in a 24px square around it.

  Size. `size` is the step of the control ladder: the box is 16, 18 or 20 px, the text stays
  `text-sm` and the box stands at its first line.

  Field. Inside UiField it reads id, error and required from the field. When the field has a
  `label`, the slot text names the box and the field label heads the row.

  Attributes. Attributes and listeners land on the input; `class` and `style` on the label.

  Placement. Beside UiSwitch and UiRadio in a form column. The first column of UiTable is this
  component, and the rows of a multiple UiSelect and of UiFilterList draw the same mark from
  `utils/checkMark`.

  Keyboard.
  A native checkbox.
  - `Tab`: reaches it.
  - `Space`: toggles it; `disabled` blocks it.
  A press on a mixed box leaves it mixed unless the parent resolves it. When the parent refuses a
  press, the box goes back to the model.

  Reader.
  - Name: a checkbox named by the slot text, else by `ariaLabel`, else by the field's label: one
    name, never two. A box with no name warns in dev.
  - State: checked, not checked, or, with `indeterminate`, mixed.
  - Errors: `invalid` sets `aria-invalid`; inside UiField the description and the error are read
    with it.
  - Required: inside UiField `aria-required` says it is required, except in a group, where the
    legend says it once.

  States. Unchecked, checked, mixed, hover (an empty box darkens), focus, disabled (a solid plate,
  not a fade), invalid (a red border, kept under the pointer), and required, with the star after
  its own text when no field label carries it.

  Not for.
  - A setting applied at once: UiSwitch.
  - One answer out of a few: UiRadioGroup.
  - Several picks from a list in a panel: UiSelect `multiple`.
-->
<template>
  <label
    class="inline-flex items-start gap-2 text-sm/5.5"
    :class="[disabled ? 'cursor-not-allowed text-fg-muted' : 'cursor-pointer text-fg', rootClass]"
    :style="rootStyle"
  >
    <span
      class="relative inline-flex shrink-0"
      :class="[MARK_STEP[ladder].top, seen.default ? '' : REACH[ladder]]"
    >
      <input
        v-bind="bound"
        ref="inputRef"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="appearance-none enabled:cursor-pointer disabled:cursor-not-allowed"
        :class="[
          CHECK_MARK_SHELL,
          MARK_STEP[ladder].box,
          checkMarkClass(modelValue || indeterminate, disabled, isInvalid),
          // An invalid box keeps its red border under the pointer.
          modelValue || indeterminate || isInvalid
            ? ''
            : 'enabled:hover:border-control-border-hover',
        ]"
        @change="onChange"
      />
      <Minus
        v-if="indeterminate"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 m-auto"
        :class="[MARK_STEP[ladder].glyph, disabled ? 'text-disabled-fg' : 'text-brand-solid-fg']"
        :stroke-width="CHECK_MARK_STROKE"
      />
      <Check
        v-else-if="modelValue"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 m-auto"
        :class="[MARK_STEP[ladder].glyph, disabled ? 'text-disabled-fg' : 'text-brand-solid-fg']"
        :stroke-width="CHECK_MARK_STROKE"
      />
    </span>
    <span v-if="$slots.default" :id="textId" class="min-w-0"
      ><slot /><span v-if="markRequired" aria-hidden="true" class="text-danger-subtle-fg">
        *</span
      ></span
    >
  </label>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { computed, nextTick, onMounted, ref, useId, useSlots, watch } from 'vue'
import { Check, Minus } from '@lucide/vue'
import { CHECK_MARK_SHELL, CHECK_MARK_STROKE, MARK_STEP, checkMarkClass } from '../utils/checkMark'
import { useControlSize } from '../composables/useControlSize'
import type { ControlSize } from '../types/ui'
import { useFieldControl } from '../utils/field'
import { useFormReset } from '../utils/composition'
import { isDev } from '../utils/dev'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Whether the checkbox is checked (`v-model`). */
    modelValue: boolean
    /** Shows a mixed state when some of the items it represents are checked. Display only. */
    indeterminate?: boolean
    /** Native name for forms. */
    name?: string
    /** Native value submitted with the form when checked. */
    value?: string
    /** Own id when standalone. Inside UiField, the field's id takes precedence. */
    id?: string
    /** Prevents toggling. */
    disabled?: boolean
    /** Marks the control as invalid. Inside UiField, the error state sets this automatically. */
    invalid?: boolean
    /** Accessible name when the slot is empty and there is no field label; slot text wins over it. */
    ariaLabel?: string
    /** Standalone only: the box must be checked, said to a reader and to a form (native `required`), with a star after its text. Inside UiField the field's `required` says so. */
    required?: boolean
    /** Step of the control ladder: the box is 16, 18 or 20 px beside `text-sm`. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  { indeterminate: false, disabled: false, invalid: false, required: false },
)
const ladder = useControlSize(() => props.size)
// A box with no words beside it is the whole target, smaller than the 24px square WCAG 2.5.8 asks
// for: it reaches out to it. With words, the row is the target.
const REACH: Record<ControlSize, string> = {
  xs: 'after:absolute after:-inset-1',
  sm: 'after:absolute after:-inset-[3px]',
  md: 'after:absolute after:-inset-0.5',
}

const emit = defineEmits<{
  /** The checkbox was toggled. */
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  /** Label text displayed next to the checkbox. Clicking the label toggles the checkbox. */
  default(props: Record<string, never>): any
}>()

const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const textId = useId()
const inputRef = ref<HTMLInputElement | null>(null)
// In a group the field says no "required": the legend says it once, on every box it would read as "check all".
const {
  field,
  id: inputId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(() => ({ id: props.id, invalid: props.invalid, required: props.required }))
// With no field label above it, the box's own text carries the required mark.
const markRequired = computed(() => isRequired.value && !field?.labelId.value)
const { rootClass, rootStyle, control } = useSplitAttrs()
// One source for the name: the slot text when there is one, else the field's
// label. Without this, a field label and the wrapping label would concatenate.
const labelledBy = computed(() => (seen.default ? textId : field?.labelId.value))
// Ours win only where set: a value we do not have must not wipe the caller's.
const bound = computed(() =>
  ownWhereSet(control.value, {
    id: inputId.value,
    name: props.name,
    value: props.value,
    // One name: with slot text the label's words are it, and `ariaLabel` would be a second.
    'aria-label': seen.default ? undefined : props.ariaLabel,
    'aria-labelledby': labelledBy.value,
    required: props.required || undefined,
    ...aria.value,
  }),
)

// The mixed state is a DOM property, not an attribute; it has to be set by hand.
const syncIndeterminate = () => {
  if (inputRef.value) inputRef.value.indeterminate = props.indeterminate
}
useFormReset(inputRef, (el) => {
  el.checked = props.modelValue
  syncIndeterminate()
})
onMounted(() => {
  syncIndeterminate()
  // A box with no text, no ariaLabel and no field label is read as a bare "checkbox".
  if (isDev() && !bound.value['aria-label'] && !bound.value['aria-labelledby'])
    console.warn(
      '[grani] UiCheckbox has no name: put text in the slot, pass ariaLabel or a UiField label.',
    )
})
watch(() => props.indeterminate, syncIndeterminate)

// The browser flips `checked` first; after the owner's turn the DOM follows the model, a veto included.
async function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
  await nextTick()
  if (inputRef.value) inputRef.value.checked = props.modelValue
  // The browser also clears the mixed state on a press; it stays mixed unless the parent resolved it.
  syncIndeterminate()
}

defineExpose({ focus: (options?: FocusOptions) => inputRef.value?.focus(options) })
</script>
