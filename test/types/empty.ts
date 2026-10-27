// Empty is one rule, as type assertions: a text is a string and empty is `''`; a choice is a value
// or `null`. vue-tsc runs them in `npm run typecheck`.
import UiCodeInput from '../../components/UiCodeInput.vue'
import UiPasswordField from '../../components/UiPasswordField.vue'
import UiRadioGroup from '../../components/UiRadioGroup.vue'
import UiScaleInput from '../../components/UiScaleInput.vue'
import UiTextarea from '../../components/UiTextarea.vue'
import UiTimePicker from '../../components/UiTimePicker.vue'

type PropsOf<C extends abstract new (...args: any) => any> = InstanceType<C>['$props']

export const textarea: PropsOf<typeof UiTextarea>[] = [
  { modelValue: '' },
  // @ts-expect-error a text is empty at '', never null
  { modelValue: null },
]

export const password: PropsOf<typeof UiPasswordField>[] = [
  { modelValue: '' },
  // @ts-expect-error a text is empty at '', never null
  { modelValue: null },
]

export const code: PropsOf<typeof UiCodeInput>[] = [
  { modelValue: '' },
  // @ts-expect-error a text is empty at '', never null
  { modelValue: null },
]

export const time: PropsOf<typeof UiTimePicker>[] = [{ modelValue: '09:30' }, { modelValue: null }]

export const scale: PropsOf<typeof UiScaleInput>[] = [
  { modelValue: 3 },
  { modelValue: null },
  // @ts-expect-error a choice is a value or null, never an empty string
  { modelValue: '' },
]

export const radio: PropsOf<typeof UiRadioGroup>[] = [{ modelValue: 'a' }, { modelValue: null }]
