// The date controls' values as type assertions: a day or `null`, a span only on a range
// calendar, one period for a range filter, presets by id or as the app's own days. vue-tsc runs
// them in `npm run typecheck`.
import UiCalendar from '../../components/UiCalendar.vue'
import UiDatePicker from '../../components/UiDatePicker.vue'
import UiDateRange from '../../components/UiDateRange.vue'

type PropsOf<C extends abstract new (...args: any) => any> = InstanceType<C>['$props']

export const calendar: PropsOf<typeof UiCalendar>[] = [
  { modelValue: '2026-09-24' },
  { modelValue: null },
  { range: true, modelValue: { from: '2026-09-01', to: null } },
  // @ts-expect-error a span is the value of a range calendar only
  { modelValue: { from: '2026-09-01', to: '2026-09-07' } },
  // @ts-expect-error a range calendar holds a span, not a day
  { range: true, modelValue: '2026-09-24' },
]

export const dateRange: PropsOf<typeof UiDateRange>[] = [
  { modelValue: { from: null, to: null, preset: 'prev_month' } },
  { modelValue: { from: '2026-08-01', to: null, preset: null } },
  // @ts-expect-error the days and the preset are one model, not three
  { from: '2026-08-01', to: '2026-08-31' },
  // @ts-expect-error a preset is one of the named periods
  { modelValue: { from: null, to: null, preset: 'last_week' } },
  { modelValue: { from: null, to: null, preset: 'last_7_days' }, stepper: true },
  { min: '2026-01-01', max: '2026-10-21' },
  // @ts-expect-error a bound is a day as text, not a Date
  { max: new Date() },
]

export const datePicker: PropsOf<typeof UiDatePicker>[] = [
  { modelValue: null, presets: true },
  { presets: ['today', 'yesterday', { label: 'In 30 days', days: 30 }] },
  // @ts-expect-error a preset id is one the field knows; the app's own is `{ label, days }`
  { presets: ['nextMonth'] },
  // @ts-expect-error shortcuts and quick picks are one `presets`
  { shortcuts: true },
]
