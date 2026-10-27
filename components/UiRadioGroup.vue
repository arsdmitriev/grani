<!--
  UiRadioGroup: one answer out of a few, shown as rows, cards or a segmented bar. The group owns
  the value, the name and the states; its `UiRadio` children are thin options drawn from it.

  Empty. No answer is `null`; a pick sends the option's value. A person cannot take an answer back:
  where none is an answer too, give it a radio of its own. A value no radio stands for shows nothing
  chosen and sends nothing; in development the console names it once, an empty string excepted: it
  is read as no answer yet, as in UiSelect.

  Required. It does not force a selection. `required` says one is needed, to a screen reader and
  to a form.

  Variants. `variant` changes only the look: rows, cards, or a `segmented` bar with one segment
  pressed. The bar stands on the control ladder (the app's step, `sm` at least), `block` makes it
  fill the row, and it reddens its frame when invalid. A press on the bar's frame picks the
  segment beside it. A bar wider than its row scrolls sideways inside its frame, its edges fading
  where more segments wait: keep its words short, two to four of them. The segmented bar is also
  the library's state switcher.

  Model. The radios follow the model after a refused pick and after a form reset.

  Names. Two groups in one form need two names: the browser joins radios that share a name. Two Vue
  apps on one page each need their own `app.config.idPrefix`, or their generated names meet.

  Field. Inside UiField, use `group`.

  Attributes. Attributes land on the root (`data-*`); ours apply where we set one,
  and the caller's description is joined to ours.

  Placement. In a form column beside UiCheckbox and UiSwitch. A segmented bar switches what a card
  or a list shows (a period, a view, the kind of event in UiLog), over it or in its toolbar.

  Keyboard.
  Native radios: the keys are the browser's, and the radios are native inputs under the marks, the
  cards and the segments, so a bar is walked the same way as rows.
  - `ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight`: move the selection.
  - `Space`: selects.
  There is one tab stop, on the checked radio, or on the first while none is. A click anywhere on a
  row, a card or a segment selects it. Safari passes over a group whose checked radio is disabled:
  turn the whole group off, not its chosen radio.

  Reader.
  - Group: a radiogroup named by the field's legend (`aria-labelledby`) or by the caller's
    `ariaLabel`.
  - Description: the field's description and error, and the caller's own, are read with it.
  - Invalid: `invalid` is `aria-invalid` on the group once, never on a radio.
  - Required: `required` is `aria-required` on the group and native `required` on the radios for a
    form; inside a UiField `group` it is silent, since the legend says it once.
  - Disabled: `disabled` is `aria-disabled`.
  - Radio: each radio is named by its own text, as UiRadio says.

  States. Nothing chosen, one chosen, hover, focus, disabled (the whole group, or one radio that
  stays disabled whatever the group says), invalid (red empty marks; a `segmented` bar reddens
  its frame), required, and the variants `plain`, `card`, `card-check` and `segmented`, with or
  without `block`.

  Not for.
  - Several answers: UiCheckbox in a UiField `group`.
  - A mark from 1 to N: UiScaleInput.
  - A pick from a long list: UiSelect.
  - On or off: UiSwitch.
  - Sections of a page, each with its own content: UiTabs.
  - Actions side by side: UiButtonGroup.
-->
<template>
  <div
    v-bind="bound"
    ref="rootRef"
    role="radiogroup"
    :class="[shell, rootClass]"
    :style="rootStyle"
  >
    <!-- The segments scroll in a strip that reaches under the frame, as deep as its padding and
         border: a press on the frame still picks the segment beside it, and a focused segment's
         ring is not clipped. -->
    <div
      v-if="variant === 'segmented'"
      ref="stripRef"
      :class="strip"
      :style="fadeStyle"
      @scroll.passive="measure"
    >
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRef,
  useId,
  watch,
} from 'vue'
import type { ControlSize, RadioGroupVariant, SelectValue } from '../types/ui'
import { isDev, warnOnce } from '../utils/dev'
import { useFieldControl } from '../utils/field'
import { controlHeightClass } from '../utils/controlSize'
import { useControlSize } from '../composables/useControlSize'
import { ownWhereSet, useSplitAttrs } from '../utils/attrs'
import { provideRadioGroup } from '../utils/radioGroup'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The selected value (`v-model`). `null` when nothing is selected. */
    modelValue: SelectValue | null
    /** Native name shared by every radio, for forms. Generated when omitted, stable across server and client; two apps on one page need their own `app.config.idPrefix`. */
    name?: string
    /** Prevents selecting in every radio. */
    disabled?: boolean
    /** Marks the group as invalid: red marks. Inside UiField, the error state sets this automatically. */
    invalid?: boolean
    /** `plain` rows with the mark first; `card` a card per radio with the mark at the end; `card-check` cards that show a check and a tint on the selected one only; `segmented` a bar with one segment pressed. */
    variant?: RadioGroupVariant
    /** Step of the control ladder. A `segmented` bar is 36 or 44 px (`xs` is read as `sm`: a 24px segment is too small to hit); a `plain` mark is 16, 18 or 20 px. Unset, the app's size (`createGrani({ size })`). */
    size?: ControlSize
    /** Own id of the group, for a reference from elsewhere (`aria-controls`, a link); a field names it by its legend. */
    id?: string
    /** Accessible name of the group when there is no visible legend. Inside a UiField group the legend names it. */
    ariaLabel?: string
    /** One answer is needed: said to a reader on the group, and `required` on the radios for a form. Inside UiField group the legend says it instead. */
    required?: boolean
    /** A segmented bar as wide as its row, segments sharing the width. */
    block?: boolean
  }>(),
  {
    disabled: false,
    invalid: false,
    variant: 'plain',
    size: undefined,
    required: false,
    block: false,
  },
)

const emit = defineEmits<{
  /** The selected value changed. */
  'update:modelValue': [value: SelectValue]
}>()

defineSlots<{
  /** The radios. */
  default(props: Record<string, never>): any
}>()

const generated = useId()
// The field's `required` is false in a group (its legend says it); the group's own prop says it standalone.
const {
  field,
  invalid: isInvalid,
  disabled: isDisabled,
  aria,
} = useFieldControl(() => ({
  invalid: props.invalid,
  required: props.required,
  disabled: props.disabled,
}))
// The app's step, but never `xs`: a segment that small is too small to hit.
const step = useControlSize(() => props.size)
const ladder = computed(() => (step.value === 'xs' ? 'sm' : step.value))
const { rootClass, rootStyle, control } = useSplitAttrs()
// Ours win only where set, and the caller's description joins the field's instead of replacing it.
const bound = computed(() =>
  ownWhereSet(control.value, {
    // Its own id only: a field's id is for a `<label for>`, and a group is no labelable element.
    id: props.id,
    'aria-label': field?.labelId.value ? undefined : props.ariaLabel || undefined,
    'aria-labelledby': field?.labelId.value,
    ...aria.value,
    'aria-disabled': isDisabled.value || undefined,
  }),
)
const rootRef = ref<HTMLElement | null>(null)
onMounted(() => {
  if (isDev() && !bound.value['aria-label'] && !bound.value['aria-labelledby'])
    console.warn(
      '[grani] UiRadioGroup has no name: pass ariaLabel or put it in a UiField group with a label.',
    )
})
const settled = ref(0)

// The segmented bar is a control on the ladder: the shell takes the step, the
// segments the rest, 4px in from the frame (2px at `sm`).
const shell = computed(() =>
  props.variant === 'segmented'
    ? [
        'items-stretch rounded-control border bg-surface-muted',
        // An invalid bar reddens its frame; a disabled one keeps its own.
        isInvalid.value && !props.disabled ? 'border-danger-border' : 'border-control-border',
        controlHeightClass[ladder.value],
        ladder.value === 'sm' ? 'p-0.5' : 'p-1',
        // Never wider than its row, nor than what a row leaves it beside a button: a bar of longer
        // words narrows, and its strip scrolls.
        props.block ? 'flex w-full min-w-0' : 'inline-flex min-w-0 max-w-full',
      ]
    : 'flex flex-col gap-2',
)
// The strip under the frame: its margin and padding are the frame's padding and border, 3px at
// `sm` and 5px at `md`, the reach of a segment's press and of its ring. Square: a rounded strip
// clips the press in the frame's corners.
const strip = computed(() => [
  'flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden ui-scroll-hidden overscroll-x-contain',
  ladder.value === 'sm' ? '-m-[3px] p-[3px]' : '-m-[5px] p-[5px]',
])

// Which edges hide more segments, measured on scroll, on resize and when the set or the pick changes.
const stripRef = ref<HTMLElement | null>(null)
const hideLeft = ref(false)
const hideRight = ref(false)
function measure() {
  const el = stripRef.value
  if (!el) return
  // scrollLeft runs negative from the start of a right-to-left row: the start is on its right.
  const from = Math.abs(el.scrollLeft)
  const atStart = from <= 1
  const atEnd = from + el.clientWidth >= el.scrollWidth - 1
  const rtl = getComputedStyle(el).direction === 'rtl'
  hideLeft.value = rtl ? !atEnd : !atStart
  hideRight.value = rtl ? !atStart : !atEnd
}
const FADE = '24px'
const fadeStyle = computed(() => {
  if (!hideLeft.value && !hideRight.value) return undefined
  const from = hideLeft.value ? `transparent 0, black ${FADE}` : 'black 0'
  const to = hideRight.value ? `black calc(100% - ${FADE}), transparent 100%` : 'black 100%'
  const mask = `linear-gradient(to right, ${from}, ${to})`
  return { maskImage: mask, WebkitMaskImage: mask }
})
// The chosen segment rides into view, clear of the fade, when the pick changes.
function reveal() {
  const el = stripRef.value
  const chosen = el?.querySelector('input:checked')?.closest('label')
  if (!el || !chosen) return
  const box = el.getBoundingClientRect()
  const seg = chosen.getBoundingClientRect()
  const pad = 24
  if (seg.left - pad < box.left) el.scrollLeft -= box.left - (seg.left - pad)
  else if (seg.right + pad > box.right) el.scrollLeft += seg.right + pad - box.right
}
// The strip and every segment are followed: a label that grows (a font arrives, the language
// changes) moves the overflow without resizing the strip. A bar mounted hidden has no width yet,
// so its chosen segment is revealed the first time it has one.
let observer: ResizeObserver | undefined
let shown = false
function onResize() {
  const el = stripRef.value
  if (el?.clientWidth && !shown) {
    shown = true
    reveal()
  }
  measure()
}
function follow() {
  observer?.disconnect()
  const el = stripRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  observer ??= new ResizeObserver(onResize)
  observer.observe(el)
  for (const segment of el.children) observer.observe(segment)
}
onMounted(follow)
// A group turned into a bar after it mounted gets its strip then.
watch(stripRef, () => ((shown = false), follow()), { flush: 'post' })
onBeforeUnmount(() => observer?.disconnect())

// One radio per value, the first one listed, as in UiSelect: two radios on one
// value would both look selected while the browser checks only the last.
const claims = reactive(new Map<SelectValue, string[]>())
watch(
  () => [props.modelValue, claims.size],
  () => nextTick(() => (reveal(), measure())),
)
watch(
  () => claims.size,
  () => nextTick(follow),
)
const claim = (value: SelectValue, uid: string) => {
  const list = claims.get(value) ?? []
  claims.set(value, [...list, uid])
  if (list.length === 1 && isDev())
    console.warn(
      '[grani] UiRadioGroup has two radios with the same value; the first one stands for it.',
    )
  return () => {
    const rest = (claims.get(value) ?? []).filter((id) => id !== uid)
    if (rest.length) claims.set(value, rest)
    else claims.delete(value)
  }
}

provideRadioGroup({
  name: computed(() => props.name ?? generated),
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  invalid: isInvalid,
  // The radios carry native `required` only for the group's own prop, never for a field's.
  required: toRef(props, 'required'),
  variant: toRef(props, 'variant'),
  size: ladder,
  mark: step,
  block: toRef(props, 'block'),
  select: (value) => {
    emit('update:modelValue', value)
    void nextTick(() => settled.value++)
  },
  settled,
  claim,
  owner: (value) => claims.get(value)?.[0],
})

// A value no radio stands for draws nothing chosen while the app holds it, and a form sends
// nothing: once per app and value, in the browser, as UiSelect says its own.
if (isDev()) {
  const app = getCurrentInstance()?.appContext.app
  onMounted(() =>
    watch(
      () =>
        props.modelValue != null &&
        props.modelValue !== '' &&
        claims.size > 0 &&
        !claims.has(props.modelValue)
          ? props.modelValue
          : undefined,
      (value) => {
        if (value === undefined) return
        warnOnce(
          app,
          `UiRadioGroup:${JSON.stringify(value)}`,
          `[grani] UiRadioGroup holds the value ${JSON.stringify(value)}, which none of its radios has: it shows nothing chosen, and a form sends nothing. Give the value a radio, or set the model to null.`,
        )
      },
      { immediate: true, flush: 'post' },
    ),
  )
}

defineExpose({
  /** Focuses the chosen radio, or the first one that is on while none is chosen. */
  focus: (options?: FocusOptions) => {
    const on = [
      ...(rootRef.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []),
    ].filter((radio) => !radio.disabled)
    ;(on.find((radio) => radio.checked) ?? on[0])?.focus(options)
  },
})
</script>
