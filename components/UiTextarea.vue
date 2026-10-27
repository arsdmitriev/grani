<!--
  UiTextarea: a multi-line text field in the input capsule. Take it for a note, an address or a
  bio.

  Height. The height comes from `rows`, from the resize handle, or from `resize="auto"`, which
  grows from `rows` up to 24rem and then scrolls. One row stands on the control ladder (`size`,
  else the app's step), so it lines up with UiInput.

  Field. It reads the field context; standalone, the name goes through `ariaLabel`.

  Attributes. Attributes and listeners land on the textarea, `class` and `style` on the capsule.

  Model. The field shows the model: when the owner refuses a change, or a form resets, it goes
  back to the model and the caret stays where it was.

  Empty. The value is text, and empty is `''`, never `null`.

  Length. `maxlength` cuts off text past the limit and shows no counter; the caller writes one
  into UiField's `#meta`.

  Placement. In a form column beside UiInput, inside UiField, or in a UiModal or a UiCrudDrawer
  that sends on Cmd+Enter from it.

  Keyboard.
  A native textarea.
  - `Tab`: reaches it.
  - `Enter`: adds a line.
  - `Meta+Enter` `Ctrl+Enter`: send from it in a UiModal or a UiCrudDrawer; that key belongs to the
    surface, not to the textarea.
  Nothing is sent while an IME composes. `readonly` keeps it focusable and blocks typing;
  `disabled` blocks the focus too. The handle resizes with the pointer.

  Reader.
  - Field: a text box named by `ariaLabel` or the field's label, never by the placeholder. A
    textarea with no name warns in dev.
  - Errors: `invalid` sets `aria-invalid`. Inside UiField the description and the error are read
    with it once, and `aria-required` says it is required.
  - Caller attributes: a caller's `aria-invalid` and `aria-required` reach it when the field sets
    none.

  States. Rest, hover, focus (the capsule draws the ring), disabled (its plate, nothing sent),
  readonly, invalid (red border and halo; disabled wins over it), with a handle, a fixed height,
  `auto` growing to 24rem and then scrolling, and one row on each step of the ladder.

  Not for.
  - One line: UiInput.
  - Names added one by one: UiListField.
  - A counter under it: the caller's text in UiField `#meta`.
-->
<template>
  <div
    class="ui-capsule flex overflow-hidden rounded-control border text-sm/5.5"
    :class="[chrome, controlMinHeightClass[ladder], rootClass]"
    :style="rootStyle"
    :data-invalid="isInvalid || undefined"
  >
    <textarea
      v-bind="control"
      :id="textareaId"
      ref="areaRef"
      :name="name"
      :value="display(modelValue)"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :readonly="readonly"
      :disabled="disabled"
      :required="required || undefined"
      :aria-label="ariaLabel"
      :aria-invalid="aria['aria-invalid']"
      :aria-describedby="aria['aria-describedby']"
      :aria-required="aria['aria-required']"
      class="w-full bg-transparent px-3 text-fg placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed disabled:text-disabled-fg"
      :class="[padY[ladder], resizeClass[resize]]"
      :style="
        resize === 'auto' ? { minHeight: `calc(${rows}lh + ${2 * PAD[ladder]}px)` } : undefined
      "
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isDev } from '../utils/dev'
import { useControlSize } from '../composables/useControlSize'
import type { ControlSize } from '../types/ui'
import { controlChromeClass } from '../utils/controlChrome'
import { controlMinHeightClass } from '../utils/controlSize'
import { useComposedValue, useFormReset } from '../utils/composition'
import { useSplitAttrs } from '../utils/attrs'
import { useFieldControl } from '../utils/field'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The text (`v-model`); empty is `''`. */
    modelValue: string
    /** Visible lines before the user resizes the control. */
    rows?: number
    /** Native name for forms. */
    name?: string
    /** Own id when standalone. Inside UiField the field's id takes precedence. */
    id?: string
    /** Hint shown while empty. Not a replacement for a label. */
    placeholder?: string
    /** Maximum number of characters. */
    maxlength?: number
    /** Prevents editing while keeping the control focusable. */
    readonly?: boolean
    /** Prevents input and interaction. */
    disabled?: boolean
    /** Marks the control invalid: red border and halo. Inside UiField the error sets this. */
    invalid?: boolean
    /** Standalone only: a value is needed, said to a reader and to a form (native `required`). Inside UiField the field's `required` says so. */
    required?: boolean
    /** Accessible name when there is no visible label. A prop, not `aria-label`: the root is the capsule, the name belongs to the control. */
    ariaLabel?: string
    /** Height of one row on the control ladder; defaults to the app's step. */
    size?: ControlSize
    /** `vertical` gives the user a handle; `none` fixes the height at `rows`; `auto` grows with the text. */
    resize?: 'vertical' | 'none' | 'auto'
  }>(),
  {
    rows: 3,
    readonly: false,
    disabled: false,
    invalid: false,
    required: false,
    resize: 'vertical',
  },
)

const emit = defineEmits<{
  /** The value changed. */
  'update:modelValue': [value: string]
}>()

const { rootClass, rootStyle, control } = useSplitAttrs()
const areaRef = ref<HTMLTextAreaElement | null>(null)
const {
  field,
  id: textareaId,
  invalid: isInvalid,
  aria,
} = useFieldControl(() => ({ id: props.id, invalid: props.invalid, required: props.required }))

const chrome = computed(() => controlChromeClass(props.disabled, isInvalid.value))

const ladder = useControlSize(() => props.size)
// One row of `text-sm` (a 22px line) plus the padding plus the 2px border is the step: 28, 36, 44.
const PAD: Record<ControlSize, number> = { xs: 2, sm: 6, md: 10 }
const padY: Record<ControlSize, string> = { xs: 'py-0.5', sm: 'py-1.5', md: 'py-2.5' }

// `field-sizing` drops `rows`: under `auto` the inline floor keeps them, and an engine without
// the property keeps `rows` itself.
const resizeClass = {
  vertical: 'resize-y',
  none: 'resize-none',
  auto: 'resize-none [field-sizing:content] max-h-96 overflow-y-auto',
}

// The model as text; the control follows it after a change and after a form reset.
const text = () => props.modelValue ?? ''
const { display, onInput, onCompositionStart, onCompositionEnd } = useComposedValue(
  (value) => emit('update:modelValue', value),
  undefined,
  text,
)
useFormReset(areaRef, (el) => (el.value = text()))

onMounted(() => {
  if (
    isDev() &&
    !props.ariaLabel &&
    !control.value['aria-label'] &&
    !control.value['aria-labelledby'] &&
    !field?.labelId.value
  )
    console.warn(
      '[grani] UiTextarea has no name: pass ariaLabel or put it in a UiField with a label.',
    )
})

defineExpose({ focus: (options?: FocusOptions) => areaRef.value?.focus(options) })
</script>
