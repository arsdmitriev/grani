<!--
  UiPasswordField: a field for setting a new password, with buttons to show, copy and generate
  it. Signing in and signing up take UiInput `type="password"` instead.

  Layout. The eye that shows the password sits inside the field (UiInput). Beside the field, 8px
  apart, stand a copy button (UiCopyButton, once there is a value) and, at the end, a generate
  button (`generatePassword`). Generate is last, so it never moves under the pointer when copy
  appears. `:copy="false"` leaves copy out, where a password must not reach the clipboard.

  Generate. A generated password has a lower-case letter, an upper-case letter, a digit and a
  symbol. Once the owner accepts it, it is shown at once, announced to a screen reader without
  its value, and emitted through `generate`, so a form can fill its "repeat" field itself. When
  the owner refuses it, nothing is said or shown.

  Hiding. Emptying the field hides the password again.

  Empty. The password is text, and empty is `''`, never `null`.

  Attributes. `class` and `style` land on the row, everything else on the input.

  Placement. In UiField, which gives the label, description and error, beside UiInput
  `type="password"` for the repeat.

  Signing in. It is not for signing in or signing up: there, a generated password the person
  never saw is one they cannot type again.

  Keyboard.
  A row.
  - `Tab`: reaches the input, its eye, then copy, then generate.
  - `Enter` `Space`: on generate, fill the field and show the password; on copy, copy it. Neither
    submits the form around them.
  When the copy button disappears under the focus (the value emptied, the field disabled), the
  focus moves to generate. `disabled` blocks typing and generate and takes the copy button away; `readonly` blocks generate
  and keeps copy.

  Reader.
  - Input: named by the field's label or by `ariaLabel`; `invalid` sets `aria-invalid` on it, and
    the field's words are read with it.
  - Buttons: copy and generate are icon buttons with their own names; copy says it copies the
    password.
  - Generate: a generated password is announced without its value, again on a second generate.
  - Copy: UiCopyButton says the outcome from the page's live region, or from the open window's.
  - Eye: says whether the password is shown (`aria-pressed`).

  States. Empty (no copy button), with a value (copy appears before generate, which never moves),
  shown or hidden by the eye, generated (shown at once), disabled (all three blocked), readonly
  (copy kept, generate blocked), and invalid.

  Not for.
  - Signing in or signing up: UiInput `type="password"`.
  - The repeat field beside it: UiInput `type="password"` too.
  - A secret given to copy and never typed: UiCopyButton with an `ariaLabel` and neither `label`
    nor `truncate`, which would put it on the screen and in its name.
-->
<template>
  <div class="flex min-w-0 items-center gap-2" :class="rootClass" :style="rootStyle">
    <UiInput
      v-bind="control"
      :id="id"
      v-model:password-visible="visible"
      :model-value="modelValue"
      type="password"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :readonly="readonly"
      :invalid="invalid"
      :size="ladder"
      :ariaLabel="field?.labelId.value ? undefined : ariaLabel"
      class="min-w-0 flex-1"
      @update:model-value="emit('update:modelValue', $event ?? '')"
    />
    <UiCopyButton
      v-if="copy && modelValue && !disabled"
      ref="copyRef"
      :value="modelValue"
      :ariaLabel="t('grani.password.copy')"
      variant="outline"
      :size="ladder"
    />
    <UiIconButton
      ref="generateRef"
      variant="outline"
      :ariaLabel="t('grani.password.generate')"
      :disabled="disabled || readonly"
      :size="ladder"
      @click="generate"
    >
      <RefreshCw aria-hidden="true" />
    </UiIconButton>
    <!-- Beside the button, not in it: a button's content is presentational, and some readers
         never say a live region inside one. -->
    <span class="sr-only" aria-live="polite">{{ announced }}</span>
  </div>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { RefreshCw } from '@lucide/vue'
import type { ControlSize } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { useField } from '../utils/field'
import { useSplitAttrs } from '../utils/attrs'
import { generatePassword } from '../utils/generatePassword'
import UiCopyButton from './UiCopyButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiInput from './UiInput.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The password (`v-model`); empty is `''`. */
    modelValue: string
    /** Native name for forms. */
    name?: string
    /** Hint shown while empty. */
    placeholder?: string
    /** Password manager hint: `new-password` when setting one, `current-password` when signing in. */
    autocomplete?: 'new-password' | 'current-password'
    /** Nothing can be typed, generated or copied. */
    disabled?: boolean
    /** The password is shown and copied but not changed: typing and generate are held. */
    readonly?: boolean
    /** Marks the input invalid standalone. Inside UiField the error sets this. */
    invalid?: boolean
    /** Own id of the input when standalone. Inside UiField the field's id takes precedence. */
    id?: string
    /** Step of the control ladder for the field and both buttons. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
    /** Length of a generated password; never under 10. */
    length?: number
    /** Accessible name of the input when no UiField label names it. */
    ariaLabel?: string
    /** The copy button beside the field; `false` leaves it out, where a password must not reach the clipboard. */
    copy?: boolean
  }>(),
  {
    autocomplete: 'new-password',
    disabled: false,
    readonly: false,
    invalid: false,
    length: 16,
    copy: true,
  },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** The value changed, typed or generated. */
  'update:modelValue': [value: string]
  /** A generated password the owner took: it holds no typo, a form may copy it into its repeat field. Not fired when the owner refused it. */
  generate: [value: string]
}>()

const { t } = useUiT()
const field = useField()
const { rootClass, rootStyle, control } = useSplitAttrs()
const visible = ref(false)
// Said, never the password itself: a screen reader hears that one was made, as after a copy.
// Emptied first, so a second generate is said again.
const announced = ref('')

// The owner's turn first: a password it refused is not shown, said or handed to a repeat field.
async function generate() {
  if (props.disabled || props.readonly) return
  const next = generatePassword(props.length)
  emit('update:modelValue', next)
  await nextTick()
  if (props.modelValue !== next) return
  emit('generate', next)
  visible.value = true
  announced.value = ''
  await nextTick()
  announced.value = t('grani.password.generated')
}

// An emptied field hides again: the next password typed into it is not on the screen.
watch(
  () => props.modelValue,
  (value) => {
    if (!value) visible.value = false
  },
)

// Copy leaves when the value goes or the field turns off; a focus on it goes to generate, not to the page.
const copyRef = ref<ComponentPublicInstance | null>(null)
const generateRef = ref<ComponentPublicInstance | null>(null)
let copyHadFocus = false
watch(
  () => Boolean(props.modelValue) && !props.disabled,
  async (shown, was) => {
    if (shown || !was || !copyHadFocus) return
    await nextTick()
    if (document.activeElement === document.body)
      (generateRef.value?.$el as HTMLElement | undefined)?.focus()
  },
  { flush: 'post' },
)
watch(
  () => [props.modelValue, props.disabled],
  () => {
    const el = copyRef.value?.$el as HTMLElement | undefined
    copyHadFocus = !!el && (el === document.activeElement || el.contains(document.activeElement))
  },
  { flush: 'pre' },
)
</script>
