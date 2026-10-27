<!-- UiButtonGroup: bordered controls of one size joined into one capsule (`outline`, never
     `ghost`). Take it for a few related actions side by side in a toolbar, or to join a search with
     its button.

     Nesting. A nested group is spaced, not joined. A `UiSeparator` between nested groups draws a
     line across the row; between two joined buttons, their shared border is the line.

     Filled buttons. Filled buttons (`primary`, `secondary`) have no border to share, so two of them
     side by side are split by a 1px seam instead.

     Split button. A split button is a primary UiButton next to a primary UiIconButton with a
     chevron that opens a UiMenu, as in a UiCrudDrawer's footer; an `outline` button and an
     `outline` arrow make the quieter one. In a row, a UiIconButton last and right after a button
     with text is that arrow, and the group draws it narrower than a square: a part of the button
     beside it, not a button of its own.

     Children. A child in error is lifted over its neighbors, so its red frame shows whole.
     Children must be direct: a button inside a wrapper cannot be joined. The size is each child's,
     or the app's step for all of them, so give one `size` to every child or to none. `orientation`
     makes the group vertical.

     Keyboard. None of its own: Tab walks its children one by one, each with its own keys, and the
     focused child is lifted over its neighbors, so its ring shows whole.

     Reader.
     - Group: a `group` named by `ariaLabel`.
     - In a field group: inside a `UiField group`, the legend names it (`aria-labelledby`) and the
       field's text describes it (`aria-describedby`), with its own `ariaLabel` winning.
     - In a plain field: inside a plain UiField, the input in the group is the control and the group
       takes nothing.
     - Nested: a nested group keeps its own name.
     - No name: a group with no name warns in dev.

     States. No state of its own; it shows its children's: a focused or hovered child lifted; a
     child in error lifted over its neighbors with its red frame whole; a disabled child beside a
     filled one, with a reason too, not lifted on hover; a link child joined as a button is.
     Horizontal or vertical (`orientation`), on every step of the size ladder, nested with a gap.

     Not for.
     - One choice among a few: UiRadioGroup `segmented`.
     - A lone action: UiButton.
     - The search and the filters over a list: UiTableToolbar.
-->
<template>
  <div
    ref="root"
    role="group"
    :aria-label="ariaLabel"
    :aria-labelledby="wired && !ariaLabel ? field?.labelId.value : undefined"
    :aria-describedby="wired ? field?.describedBy.value : undefined"
    :class="classes"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, provide, ref, toRef } from 'vue'
import { isDev } from '../utils/dev'
import { useField } from '../utils/field'
import { GROUP_AXIS, GROUP_NESTED } from '../utils/groupAxis'
import { controlHeightClass } from '../utils/controlSize'

const props = withDefaults(
  defineProps<{
    /** Name of the group for a screen reader: "Pagination", "Period". Inside `UiField group` the legend names it. */
    ariaLabel?: string
    /** Controls in a row or in a column. */
    orientation?: 'horizontal' | 'vertical'
  }>(),
  { orientation: 'horizontal' },
)

defineSlots<{
  /** Bordered controls of one size, a nested group, a `UiSeparator`. */
  default(props: Record<string, never>): any
}>()

const field = useField()
// Only the outermost group of a `UiField group` takes the field; a nested one keeps its own name.
const nested = inject(GROUP_NESTED, false)
provide(GROUP_NESTED, true)
provide(GROUP_AXIS, toRef(props, 'orientation'))
const wired = computed(() => Boolean(field?.group.value) && !nested)

const root = ref<HTMLElement | null>(null)
const HEIGHTS = Object.values(controlHeightClass)
const JOINABLE = 'button, a, input, .ui-capsule'
onMounted(() => {
  if (!isDev() || !root.value) return
  // A nested group is never wired to the field: its name is its own ariaLabel.
  // In a plain field the control inside is the named one; the group is only its frame.
  const framed = field && !field.group.value
  if (!props.ariaLabel && !framed && !(wired.value && field?.labelId.value))
    console.warn(
      '[grani] UiButtonGroup has no name: pass ariaLabel or put it in a labeled UiField group.',
    )
  const controls = [...root.value.children].filter(
    (el) => !['group', 'separator'].includes(el.getAttribute('role') ?? ''),
  )
  const steps = new Set(controls.map((el) => HEIGHTS.find((h) => el.classList.contains(h))))
  steps.delete(undefined)
  if (steps.size > 1)
    console.warn(
      '[grani] UiButtonGroup joins controls of one size; these stand on different steps.',
    )
  // What the group joins is the child itself: a wrapper keeps the corners and border inside it.
  if (controls.some((el) => !el.matches(JOINABLE)))
    console.warn(
      '[grani] UiButtonGroup joins its direct children: a wrapper around a control cannot be joined.',
    )
  if (
    controls.some(
      (el) => el.classList.contains('border-transparent') && !el.hasAttribute('data-filled'),
    )
  )
    console.warn('[grani] UiButtonGroup joins bordered controls: use variant="outline", not ghost.')
  if (nested) return
  // A plain field points its label at the id; buttons alone never take it.
  if (
    field &&
    !field.group.value &&
    ![...root.value.querySelectorAll('[id]')].some((el) => el.id === field.id.value)
  )
    console.warn(
      '[grani] UiButtonGroup in a plain UiField has no control for its label; use UiField group.',
    )
})

// Border overlapped by 1px, the hovered (enabled, not off with a reason) and the focused child
// lifted so their border shows whole, and a child in error above its neighbors at rest; a nested
// group is spared. `:where()` keeps `rounded-none` below the corner rules in specificity, so the
// ends stay round.
const shared = [
  'inline-flex items-stretch [&>*:where(:not([role=group]))]:rounded-none [&>*:focus-visible]:relative [&>*:focus-visible]:z-10',
  '[&>*:focus-within]:relative [&>*:focus-within]:z-10 [&>*:is(:enabled,a):not([aria-disabled=true]):hover]:relative [&>*:is(:enabled,a):not([aria-disabled=true]):hover]:z-[5]',
  '[&>[data-invalid]]:relative [&>[data-invalid]]:z-[6]',
  '[&>input]:flex-1 [&>.ui-capsule]:flex-1',
  // Beside a nested group the row is spaced, so a plain child drops its 1px overlap too.
  'has-[>[role=group]]:gap-2 has-[>[role=group]]:[&>*:not([role=group])]:!ms-0 has-[>[role=group]]:[&>*:not([role=group])]:!mt-0',
].join(' ')
const lines: Record<'horizontal' | 'vertical', string> = {
  horizontal: [
    '[&>*:first-child]:rounded-s-control [&>*:last-child]:rounded-e-control [&>*:not(:first-child):not([role=group])]:-ms-px [&>[data-filled]+[data-filled]]:!ms-px',
    // The arrow of a split button: an icon square last, after a button with text, is narrower.
    '[&>:is(button,a):not([data-square])+[data-square=xs]:last-child]:w-6 [&>:is(button,a):not([data-square])+[data-square=sm]:last-child]:w-7 [&>:is(button,a):not([data-square])+[data-square=md]:last-child]:w-8',
  ].join(' '),
  vertical:
    'flex-col [&>*:first-child]:rounded-t-control [&>*:last-child]:rounded-b-control [&>*:not(:first-child):not([role=group])]:-mt-px [&>[data-filled]+[data-filled]]:!mt-px',
}
const classes = computed(() => [shared, lines[props.orientation]])
</script>
