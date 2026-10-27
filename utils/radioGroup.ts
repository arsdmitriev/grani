import { inject, provide, type Ref } from 'vue'
import { graniKey } from './key'
import type { ControlSize, RadioGroupVariant, SelectValue } from '../types/ui'

/** What a radio group tells the radios inside it. */
export interface RadioGroupContext {
  /** Shared native name: the browser moves between the radios with arrows. */
  name: Ref<string>
  modelValue: Ref<SelectValue | null>
  disabled: Ref<boolean>
  invalid: Ref<boolean>
  /** The group's own `required`: each radio carries native `required`, so a form asks for one. */
  required: Ref<boolean>
  variant: Ref<RadioGroupVariant>
  /** Step of the segmented bar: `sm` 36, `md` 44; segments follow. */
  size: Readonly<Ref<'sm' | 'md'>>
  /** Step of a plain radio's mark: 16, 18 or 20 px beside its text. */
  mark: Readonly<Ref<ControlSize>>
  /** A segmented bar that fills its row: segments share the width. */
  block: Ref<boolean>
  select: (value: SelectValue) => void
  /** A radio holds its value; the first one set up is the `owner` when two share it. */
  claim: (value: SelectValue, uid: string) => () => void
  owner: (value: SelectValue) => string | undefined
  /** Bumped after every pick, once the owner has had its turn: every radio puts its DOM back on the model. */
  settled: Ref<number>
}

const KEY = graniKey<RadioGroupContext>('radio-group')

export const provideRadioGroup = (ctx: RadioGroupContext) => provide(KEY, ctx)
export const useRadioGroup = () => inject(KEY, null)
