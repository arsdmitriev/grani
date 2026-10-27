// The four modes of a row as type assertions: a plain row, a link, a field and a command, each
// with its own props. A prop of another mode is rejected here, where a warning in development
// would only say it after the page ran. vue-tsc runs them in `npm run typecheck`.
import UiListItem from '../../components/UiListItem.vue'

type PropsOf<C extends abstract new (...args: any) => any> = InstanceType<C>['$props']

export const plain: PropsOf<typeof UiListItem>[] = [
  { title: 'Owner', description: 'Anna' },
  { title: 'Rate missing', tone: 'warning' },
  { tone: 'info', variant: 'soft', size: 'sm', highlight: 'own', lit: true },
  { title: 'Owner', variant: 'outline' },
  // @ts-expect-error soft is a notice's fill: without a tone there is nothing to fill with
  { title: 'Owner', variant: 'soft' },
  // @ts-expect-error a notice is its card alone and a row in a list; a frame is a plain row's
  { tone: 'info', variant: 'outline' },
  // @ts-expect-error a neutral row is a plain row: tone is a notice or an ink
  { tone: 'neutral' },
  // @ts-expect-error brand is the ink of a command or a link; a notice takes a status tone
  { title: 'New', tone: 'brand' },
  // @ts-expect-error a plain row cannot be taken: disable the control in `#actions`
  { title: 'Plan', disabled: true },
  // @ts-expect-error a plain row runs nothing: loading belongs to a command or a link
  { title: 'Plan', loading: true },
  // @ts-expect-error a chevron into a step is a command's
  { title: 'Rules', step: true },
  // @ts-expect-error an error describes the control of a field row
  { title: 'Plan', error: 'Bad' },
  // @ts-expect-error required marks the control of a field row
  { title: 'Plan', required: true },
  // @ts-expect-error a target is a link's
  { title: 'Docs', target: '_blank' },
  // @ts-expect-error a real list is UiList: a row is never its own `li`
  { title: 'A', as: 'li' },
]

export const link: PropsOf<typeof UiListItem>[] = [
  { to: '/records/7', title: 'Open', target: '_self', rel: 'nofollow' },
  { to: '/records/7', title: 'Open', disabled: true, loading: true, tone: 'danger' },
  // @ts-expect-error with `to` the row is a link; `as` is not read
  { to: '/records/7', as: 'button' },
  // @ts-expect-error a link is no field
  { to: '/records/7', as: 'label' },
  // @ts-expect-error a step is a command's chevron; a link has its own
  { to: '/records/7', step: true },
  // @ts-expect-error info is never the tone of a command or a link; it marks a notice
  { to: '/records/7', tone: 'info' },
  // @ts-expect-error error and required belong to a field row
  { to: '/records/7', error: 'Bad' },
]

export const field: PropsOf<typeof UiListItem>[] = [
  { as: 'label', title: 'Notifications', error: 'Accept the terms', required: true },
  // @ts-expect-error a field row is not disabled: its control is
  { as: 'label', title: 'Notifications', disabled: true },
  // @ts-expect-error a field row does not load: its control does
  { as: 'label', title: 'Notifications', loading: true },
  // @ts-expect-error a field row has no tone: an error says what is wrong
  { as: 'label', title: 'Notifications', tone: 'danger' },
  // @ts-expect-error a field row goes nowhere
  { as: 'label', title: 'Notifications', step: true },
]

export const command: PropsOf<typeof UiListItem>[] = [
  { as: 'button', title: 'Rules', step: true },
  { as: 'button', title: 'Delete', tone: 'danger', loading: true, disabled: true },
  { as: 'button', title: 'Add a payment', tone: 'brand' },
  // @ts-expect-error info is never the tone of a command; it marks a notice
  { as: 'button', title: 'Help', tone: 'info' },
  // @ts-expect-error error and required belong to a field row
  { as: 'button', title: 'Delete', error: 'Bad' },
  // @ts-expect-error error and required belong to a field row
  { as: 'button', title: 'Delete', required: true },
  // @ts-expect-error a target is a link's
  { as: 'button', title: 'Delete', target: '_blank' },
]
