<!--
  UiField: the words around one form control: a label above, a description or an error below.
  Take it around a control that needs a label, and with `group` around a group of them.

  Wiring. It connects the words to the control by id, `aria-describedby`, `aria-invalid` and
  `aria-required`. Grani's own controls read it by themselves; a bare element takes the
  slot props.

  Groups. One field holds one control. A group of controls (radios, checkboxes, a UiButtonGroup
  row) takes `group`: the field becomes a fieldset named by its legend. A bare element in a group
  takes `labelId` for its `aria-labelledby`.

  Required. Required shows a star. For a screen reader it is `aria-required` on a single control,
  or a word in the legend of a group, never on each control in it.

  Disabled. The label mutes when the control inside is disabled. The field judges by the control,
  not by a button in `#meta`.

  Placement. In a form column, a window or a drawer body.

  Keyboard. No keys of its own: Tab reaches the control inside it. The label is a native label: a
  click on it presses the control, as it puts the cursor in an input, so a select opens its list
  and a dropzone its file dialog.

  Reader.
  - Label: names the control, through `for` and the id, or through `labelId` for a control that
    cannot take a label.
  - Description: the description, the error and `#meta` are read with the control
    (`aria-describedby`).
  - Error: announced when it appears (`role="alert"`); it marks the control `aria-invalid`.
  - Required: `required` is `aria-required` on a single control.
  - Group: a `group` is a fieldset named by its legend, which says "required" once, in words, and
    never on each control.

  States. Rest, required (a star), with a description, in error (the error replaces the
  description; the label keeps its ink), disabled (the label mutes with the control), and
  `group`.

  Not for.
  - Words on the left and the control on the right: UiListItem `as="label"`.
  - A control that carries its own words: UiCheckbox, UiRadio or a UiSwitch with text keeps them
    in its slot.
  - A title over a section of fields: UiHeader `legend`.
-->
<template>
  <component
    :is="group ? 'fieldset' : 'div'"
    ref="root"
    data-grani
    class="ui-field group/field flex min-w-0 flex-col gap-2"
  >
    <!-- The legend has to be the first child of the fieldset to name it. Floated, it is
         no longer the fieldset's rendered legend and stands in the flex flow: the gap
         spaces it like a label, 8px (measured). -->
    <legend
      v-if="group && label"
      :id="`${id}-label`"
      class="float-left w-full text-sm/5.5 font-medium text-fg ui-field-label"
    >
      {{ label }}<span v-if="required" aria-hidden="true" class="text-danger-subtle-fg"> *</span
      ><span v-if="required" class="sr-only">{{ ' ' + t('grani.field.required') }}</span>
    </legend>
    <div
      v-else-if="!group && (label || $slots.meta)"
      class="flex items-center justify-between gap-4"
    >
      <label
        v-if="label"
        :id="`${id}-label`"
        :for="id"
        class="text-sm/5.5 font-medium text-fg ui-field-label"
      >
        {{ label }}<span v-if="required" aria-hidden="true" class="text-danger-subtle-fg"> *</span>
      </label>
      <span
        v-if="$slots.meta"
        :id="`${id}-meta`"
        data-field-meta
        class="ms-auto flex items-center text-xs/4.5 text-fg-muted"
      >
        <slot name="meta" />
      </span>
    </div>
    <slot
      :id="group ? undefined : id"
      :label-id="label ? `${id}-label` : undefined"
      :described-by="describedBy"
      :invalid="Boolean(error)"
      :required="required && !group"
    />
    <p v-if="description && !error" :id="`${id}-description`" class="text-xs/4.5 text-fg-muted">
      {{ description }}
    </p>
    <p v-if="error" :id="`${id}-error`" role="alert" class="text-xs/4.5 text-danger-subtle-fg">
      {{ error }}
    </p>
  </component>
</template>

<script setup lang="ts">
import { onMounted, ref, useSlots } from 'vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useFieldWiring } from '../utils/field'

const props = withDefaults(
  defineProps<{
    /** Visible label above the control. */
    label?: string
    /** Supporting text below the control: a format, a limit, a unit. Hidden while `error` is present. */
    description?: string
    /** Error text below the control, one string; it marks the control invalid. Empty means valid. Read out when it appears. */
    error?: string
    /** An asterisk after the label and `aria-required` on the control; in a group the legend says it once. */
    required?: boolean
    /** Id of the control the label points to; the description and error ids derive from it. Generated when omitted. */
    for?: string
    /** The control is a group of controls (radios, checkboxes): the field is a `fieldset`, the label its `legend`, and the group takes `labelId` for `aria-labelledby`. No `#meta`. */
    group?: boolean
  }>(),
  { required: false, group: false },
)

defineSlots<{
  /** The control. A grani control connects through `useField`; a bare element takes the slot props. */
  default(props: {
    /** The control's id, the one the label points at; none in a group, where each control keeps its own. */
    id?: string
    /** The label's id, for an element that is not labelable: a group's `role` element takes it as `aria-labelledby`. */
    labelId?: string
    describedBy?: string
    invalid: boolean
    required: boolean
  }): any
  /** Content at the right end of the label row, aligned with the label: a counter, a hint icon. Read with the control as a description. */
  meta(props: Record<string, never>): any
}>()

const { t } = useUiT()

const { id, describedBy } = useFieldWiring(props, useSlots())

// One control per field: a second one repeats the id and the label reaches only the first.
const root = ref<HTMLElement | null>(null)
onMounted(() => {
  if (!isDev() || !root.value) return
  // A fieldset with no legend has no name, and "required" has nowhere to be said.
  if (props.group) {
    if (!props.label)
      console.warn('[grani] UiField group has no label: the group of controls is not named.')
    return
  }
  // Compared, not selected: an id is any string, and a quote in it breaks a selector.
  const same = [...root.value.querySelectorAll('[id]')].filter((el) => el.id === id.value).length
  if (same > 1)
    console.warn(
      `[grani] UiField "${props.label ?? id.value}" holds ${same} controls; one per field.`,
    )
  // A label for nothing: the control inside is not labelable (a radio group, a scale).
  if (same === 0 && props.label)
    console.warn(
      `[grani] UiField "${props.label}" labels no element: bind the slot's \`id\` on a bare control, or take UiField group around a group of controls.`,
    )
})
</script>
