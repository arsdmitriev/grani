// The API axes as type assertions, one accepted use and one rejected per rule; vue-tsc runs them in `npm run typecheck`, and a rejection that stops is TS2578.
import UiBadge from '../../components/UiBadge.vue'
import UiButton from '../../components/UiButton.vue'
import UiIconButton from '../../components/UiIconButton.vue'
import UiInput from '../../components/UiInput.vue'
import UiLink from '../../components/UiLink.vue'
import UiMoneyCell from '../../components/UiMoneyCell.vue'
import UiSelect from '../../components/UiSelect.vue'
import UiStack from '../../components/UiStack.vue'
import UiStepper from '../../components/UiStepper.vue'
import type { DataTableColumn } from '../../types/ui'
import type { GraniOptions } from '../../plugin'

type PropsOf<C extends abstract new (...args: any) => any> = InstanceType<C>['$props']

export const button: PropsOf<typeof UiButton>[] = [
  { tone: 'brand' },
  { tone: 'success' },
  { tone: 'warning' },
  { tone: 'danger', variant: 'dashed', size: 'xs' },
  // @ts-expect-error info is never the tone of a button: buttons act, info tells
  { tone: 'info' },
  // @ts-expect-error a button has no neutral: brand means no meaning in particular
  { tone: 'neutral' },
  // @ts-expect-error the control ladder ends at md; lg has no row to stand in
  { size: 'lg' },
  // @ts-expect-error a variant outside ButtonVariant
  { variant: 'solid' },
  // @ts-expect-error a boolean error is `invalid`
  { error: true },
  // @ts-expect-error mode is not an axis
  { mode: 'primary' },
  // @ts-expect-error kind is not an axis
  { kind: 'primary' },
  // @ts-expect-error color is not an axis: meaning is tone
  { color: 'danger' },
  // @ts-expect-error intent is not an axis: meaning is tone
  { intent: 'danger' },
]

export const iconButton: PropsOf<typeof UiIconButton>[] = [
  { ariaLabel: 'Edit', tone: 'danger' },
  // @ts-expect-error an icon button is neutral, brand or danger: a glyph never says success
  { ariaLabel: 'Edit', tone: 'success' },
  // @ts-expect-error ariaLabel is required: the button has no visible text
  {},
]

export const badge: PropsOf<typeof UiBadge>[] = [
  { tone: 'info' },
  // @ts-expect-error a variant outside BadgeVariant
  { variant: 'solid' },
]

export const link: PropsOf<typeof UiLink>[] = [
  { to: '/orders', tone: 'info' },
  // @ts-expect-error a link is brand, info or neutral: danger is a button's
  { to: '/orders', tone: 'danger' },
]

export const input: PropsOf<typeof UiInput>[] = [
  { modelValue: '', invalid: true },
  { modelValue: null, numeric: true, step: 1, min: 1 },
  { modelValue: '', variant: 'bare', type: 'search' },
  // @ts-expect-error a count with minus and plus is UiStepper, not a variant of the field
  { modelValue: null, numeric: true, variant: 'stepper' },
  // @ts-expect-error a bare field is a header's text or search, never a number
  { modelValue: '', numeric: true, variant: 'bare' },
  // @ts-expect-error the arrows' step belongs to a number
  { modelValue: '', step: 1 },
  // @ts-expect-error a text is empty at '', never null; a number may be null
  { modelValue: null },
  // @ts-expect-error invalid is a boolean, never a message
  { modelValue: '', invalid: 'Required' },
  // @ts-expect-error error is not a prop of a control: the field carries the message
  { modelValue: '', error: true },
  // @ts-expect-error the control ladder ends at md
  { modelValue: '', size: 'lg' },
  // A handler left untyped is typed as a template types it: the value may be null, in either mode.
  // @ts-expect-error a handler that trims without a check would throw when a number is emptied
  { modelValue: null, numeric: true, 'onUpdate:modelValue': (value) => value.trim() },
  // @ts-expect-error the same in a text field: one shape of the value for both modes
  { modelValue: '', 'onUpdate:modelValue': (value) => value.trim() },
  { modelValue: '', 'onUpdate:modelValue': (value) => value?.trim() },
  { modelValue: null, numeric: true, 'onUpdate:modelValue': (value: string | null) => value },
  // @ts-expect-error a number field sends null when emptied: a handler of a string alone misses it
  { modelValue: null, numeric: true, 'onUpdate:modelValue': (value: string) => value.trim() },
  { modelValue: null, numeric: true, onUnsure: (unsure) => unsure === true },
]

export const stepper: PropsOf<typeof UiStepper>[] = [
  { modelValue: '2', min: 1, max: 9, size: 'xs' },
  { modelValue: null },
  // @ts-expect-error the count is text, as a number field's: `'2'`, not `2`
  { modelValue: 2 },
]

export const select: PropsOf<typeof UiSelect>[] = [
  { modelValue: null },
  { modelValue: 3 },
  { multiple: true, modelValue: ['a', 2] },
  // @ts-expect-error SelectValue is a string or a number
  { modelValue: true },
  // @ts-expect-error several values are a multiple select's
  { modelValue: ['a', 2] },
  // @ts-expect-error a multiple select holds an array, not one value
  { multiple: true, modelValue: 'a' },
]

export const money: PropsOf<typeof UiMoneyCell>[] = [
  { value: 10, tone: 'danger' },
  // @ts-expect-error an amount has no in-between state: MoneyTone has no warning
  { value: 10, tone: 'warning' },
]

export const columns: DataTableColumn[] = [
  { key: 'amount', label: 'Amount', type: 'money', currency: 'EUR' },
  { key: 'at', label: 'When', type: 'date', variant: 'day' },
  // @ts-expect-error a money column is never cut: the amount is read whole
  { key: 'amount', label: 'Amount', type: 'money', truncate: true },
  // @ts-expect-error a date column is drawn by its variant, not by a format
  { key: 'at', label: 'When', type: 'date', format: () => '' },
]

export const stack: PropsOf<typeof UiStack>[] = [
  { as: 'section' },
  { as: 'li' },
  // @ts-expect-error a stack is a block of layout: an element outside its list is a typo or not a stack
  { as: 'script' },
  // @ts-expect-error the gap names a relation, never a number
  { gap: 16 },
]

export const focus: GraniOptions[] = [
  { focus: 'quiet' },
  { focus: 'strong' },
  // @ts-expect-error the focus mark is quiet or strong, nothing between
  { focus: 'bold' },
]
