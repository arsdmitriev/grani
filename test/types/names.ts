// One name for one thing, as type assertions: `required`, `id` and `size` are props where they
// apply, and a name another component owns is not taken twice. vue-tsc runs them in
// `npm run typecheck`.
import UiCheckbox from '../../components/UiCheckbox.vue'
import UiListField from '../../components/UiListField.vue'
import UiModal from '../../components/UiModal.vue'
import UiRadioGroup from '../../components/UiRadioGroup.vue'
import UiScaleInput from '../../components/UiScaleInput.vue'

type PropsOf<C extends abstract new (...args: any) => any> = InstanceType<C>['$props']

export const checkbox: PropsOf<typeof UiCheckbox>[] = [
  { modelValue: false, required: true, size: 'md' },
  // @ts-expect-error a control stops at md
  { modelValue: false, size: 'lg' },
]

export const radioGroup: PropsOf<typeof UiRadioGroup>[] = [
  { modelValue: null, size: 'xs', id: 'plan' },
]

export const listField: PropsOf<typeof UiListField>[] = [{ size: 'md', id: 'tags' }]

export const scale: PropsOf<typeof UiScaleInput>[] = [
  { modelValue: 3, ariaLabel: 'Mood', id: 'mood' },
  // @ts-expect-error the field names the scale: UiField `group`, or `ariaLabel` alone
  { modelValue: 3, label: 'Mood' },
]

export const modal: PropsOf<typeof UiModal>[] = [{ title: 'New client', form: true }]
