import {
  computed,
  defineComponent,
  inject,
  onBeforeUpdate,
  provide,
  shallowRef,
  useAttrs,
  useId,
  type ComputedRef,
  type Ref,
  type Slots,
} from 'vue'
import { joinIds } from './attrs'
import { graniKey } from './key'

/** What a field tells the control inside it; it wins over the control's own props. */
export interface FieldContext {
  /** Id for the control, the one the label points at; `undefined` in a group, where each control keeps its own. */
  id: Ref<string | undefined>
  /** Id of the label, for a control that is not labelable (`aria-labelledby`). */
  labelId: Ref<string | undefined>
  /** Ids of the lines that describe the control: error or description, then meta. */
  describedBy: Ref<string | undefined>
  /** The field shows an error: the control marks itself `aria-invalid` and draws the invalid border. */
  invalid: Ref<boolean>
  /** The control marks itself `aria-required`: a required field around one control. In a group it is false, since the legend says it once and not each control. */
  required: Ref<boolean>
  /** The field is a fieldset around a group of controls (`UiField group`). */
  group: Ref<boolean>
}

const KEY = graniKey<FieldContext | null>('field')

/** Hands a field's context to the controls inside; UiField and a label UiListItem call it through `useFieldWiring`. */
const provideField = (ctx: FieldContext) => provide(KEY, ctx)
/** The context of the field around the caller, or `null` outside one. */
export const useField = () => inject(KEY, null)

/** Hides the field from what the caller renders: its controls keep their own ids, names and states, as outside any field. */
export const hideField = () => provide(KEY, null)

/** Hides the field from what it wraps: controls in it keep their own ids, names and states, as outside any field. */
export const NoField = defineComponent({
  name: 'NoField',
  setup(_, { slots }) {
    hideField()
    return () => slots.default?.()
  },
})

/** The props of a field that decide its wiring. */
export interface FieldWords {
  label?: string
  description?: string
  error?: string
  required?: boolean
  for?: string
  group?: boolean
}

/**
 * The wiring of a field, shared by UiField and a label UiListItem: the ids of the label,
 * description, error and meta lines, provided to the control inside.
 */
export function useFieldWiring(props: FieldWords, slots: Slots) {
  const generated = useId()
  const id = computed(() => props.for || generated)
  // Slots are not reactive, so `#meta` is looked for again before every render.
  const hasMeta = shallowRef(Boolean(slots.meta))
  onBeforeUpdate(() => {
    hasMeta.value = Boolean(slots.meta)
  })
  const ids = {
    label: computed(() => (props.label ? `${id.value}-label` : undefined)),
    description: computed(() => `${id.value}-description`),
    error: computed(() => `${id.value}-error`),
    meta: computed(() => `${id.value}-meta`),
  }
  // The error replaces the description, on screen and here; the meta line stays with both.
  const describedBy: ComputedRef<string | undefined> = computed(() => {
    const list: string[] = []
    if (props.error) list.push(ids.error.value)
    else if (props.description) list.push(ids.description.value)
    if (hasMeta.value && !props.group) list.push(ids.meta.value)
    return list.length ? list.join(' ') : undefined
  })
  provideField({
    // In a group the legend names the whole; an id handed down would repeat on every control in it.
    id: computed(() => (props.group ? undefined : id.value)),
    labelId: ids.label,
    describedBy,
    invalid: computed(() => Boolean(props.error)),
    required: computed(() => Boolean(props.required) && !props.group),
    group: computed(() => Boolean(props.group)),
  })
  return { id, ids, describedBy }
}

/** What a control brings of its own to the field's wiring: its props, read on every change. */
export interface FieldControlOwn {
  /** The control's own id; the field's wins, so the label always points at the control. */
  id?: string
  /** The control's own mark (its prop, or a value it cannot read); the field's error adds to it. */
  invalid?: boolean
  /** The control's own prop; a field says it for a single control, never for one in a group. */
  required?: boolean
  /** The control's own prop: a field never turns a control off. */
  disabled?: boolean
}

/** Ids of the control's own lines, read with the field's: `before` them (a note) or `after` (a hint). */
export interface FieldControlLines {
  before?: () => unknown[]
  after?: () => unknown[]
}

type AriaFlag = boolean | 'true' | 'false' | undefined

/**
 * A control's side of the field contract: its id and its invalid, required and disabled state,
 * merged from its own props and the field around it, and the `aria-*` values for the element a
 * person reaches. Ours win only where set: a caller's `aria-invalid` or `aria-required` stays
 * when the control has none, and the caller's `aria-describedby` is read first, then the field's.
 */
export function useFieldControl(own: () => FieldControlOwn, lines: FieldControlLines = {}) {
  const field = useField()
  const attrs = useAttrs()
  const id = computed(() => field?.id.value ?? own().id)
  const invalid = computed(() => Boolean(own().invalid) || Boolean(field?.invalid.value))
  // A field's `required` is false in a group already: the legend says it once for all of them.
  const required = computed(() => Boolean(own().required) || Boolean(field?.required.value))
  const disabled = computed(() => Boolean(own().disabled))
  const describedBy = computed(() =>
    joinIds(
      attrs['aria-describedby'],
      ...(lines.before?.() ?? []),
      field?.describedBy.value,
      ...(lines.after?.() ?? []),
    ),
  )
  const aria = computed(() => ({
    'aria-invalid': invalid.value || (attrs['aria-invalid'] as AriaFlag) || undefined,
    'aria-required': required.value || (attrs['aria-required'] as AriaFlag) || undefined,
    'aria-describedby': describedBy.value,
  }))
  return { field, id, invalid, required, disabled, describedBy, aria }
}
