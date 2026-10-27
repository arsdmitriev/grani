<!--
  UiIconButton: a button for an action, drawn as a single Lucide glyph in a square target.

  Look. The button sizes the glyph; `variant` is the presentation, `tone` the meaning.

  Name. Its name is `ariaLabel`, a required prop rather than the native attribute, since the button
  has no text to be named by; an empty one warns in dev. No hint shows the name: where a sighted
  user needs it, wrap the button in a UiTooltip, which then does not read the name twice.

  Toggle. `pressed` makes it a toggle, as on UiButton: `aria-pressed`, the brand frame and plate,
  and the system highlight under forced colors. A `primary` square is never a toggle.

  Split. Last in a row of UiButtonGroup, right after a button with text, it is the arrow of a split
  button, `primary` or `outline`: the group draws it narrower than a square (28 wide at `sm`), its
  glyph unchanged, so it reads as a part of the button beside it. A `#trailing` tail keeps its
  pill.

  Tail. A `#trailing` tail (a count) keeps its width while loading.

  Disabled. As on UiButton: `disabled` alone takes no focus and says nothing; with
  `disabledReason` the square keeps the focus, refuses the press, and says why in a tooltip and as
  its description ("Paid invoices cannot be deleted"). A UiTooltip around it for its name keeps
  naming it while it works; while it is off, the reason shows instead.

  Placement. It sits in the header of a modal or a drawer (the close cross and the record arrows),
  in a table row's actions, in a capsule's `#end` beside the value (a clear button), on a pager and
  as a calendar's arrows, in a toast's corner, in a UiListItem's `#actions`, and as the trigger of a
  popover or a menu. A `primary` one is the arrow of a split button, beside a primary UiButton in a
  UiButtonGroup. Its neighbors are UiButton (with text) and UiCopyButton, whose glyph-only form is
  one of these.

  Keyboard.
  A native button.
  - `Tab`: reaches it; `disabled` takes no focus, unless it has a `disabledReason`.
  - `Enter` `Space`: press it. `loading` refuses the press before your handler sees it, and keeps
    the focus. A held Enter is one press: its repeats press nothing.
  `type="submit"` sends the form it sits in.

  Reader.
  - Name: `ariaLabel`, which is required; the glyph is hidden (`aria-hidden`).
  - Loading: says busy (`aria-busy`) and disabled (`aria-disabled`) while the button keeps its
    name.
  - Pressed: `pressed` is `aria-pressed`, only on a toggle.
  - Disabled with a reason: `aria-disabled`, and the reason is its description, read once.
  - Hint: none shows the name; a UiTooltip you wrap around it shows it to the eye, and it is not
    read twice.

  States. Rest; hover; focus (a `danger` one keeps the red ring); pressed (the brand frame and
  plate, the system highlight under forced colors); loading (a spinner one step larger than the
  glyph, the color kept, the width kept with a `#trailing` tail); disabled (the glyph grayed, the
  shape kept), with a reason the focus kept and the hint shown. `primary`, `outline` and `ghost` in `neutral`, `brand` and `danger`; `xs`, `sm` and
  `md`; with a tail, a pill that keeps its height; in both themes.

  Not for.
  - Text: UiButton.
  - Copying a value: UiCopyButton.
  - A choice among options: UiRadioGroup `segmented`.
  - A primary square as a toggle: never; it is the arrow of a split button in UiButtonGroup.
-->
<template>
  <button
    :ref="setEl"
    :type="type"
    :class="[base, $slots.trailing ? grown[ladder] : sizes[ladder], state]"
    :disabled="(disabled && !loading && !reasoned) || undefined"
    :aria-disabled="loading || reasoned || undefined"
    :aria-busy="loading || undefined"
    :data-focus="tone === 'danger' && !pressed ? 'danger' : undefined"
    :data-bare="variant === 'ghost' && !$slots.trailing ? ladder : undefined"
    :data-filled="variant === 'primary' || undefined"
    :data-square="$slots.trailing ? undefined : ladder"
    :aria-label="ariaLabel"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    v-bind="$attrs"
    :aria-describedby="joinIds($attrs['aria-describedby'], reasoned ? reasonId : undefined)"
    @click.capture="refuse"
    @keydown="onHeld"
  >
    <UiSpinner v-if="loading" :class="$slots.trailing ? '' : spinner[ladder]" />
    <slot v-else>
      <component :is="icon" v-if="icon" aria-hidden="true" />
    </slot>
    <slot name="trailing" />
    <span v-if="reasoned" :id="reasonId" hidden>{{ reason }}</span>
    <!-- Its hint stands inside, the button the one root, as UiButton's. -->
    <LazyHint v-if="reasoned" :anchor="() => el" :content="reason" late reason />
  </button>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { computed, onMounted, shallowRef, useSlots, type Component } from 'vue'
import { isDev } from '../utils/dev'
import type { ButtonSize, IconButtonTone, IconButtonVariant } from '../types/ui'
import UiSpinner from './UiSpinner.vue'
import { joinIds } from '../utils/attrs'
import { useDisabledReason } from '../composables/disabledReason'
import { LazyHint } from './lazyHint'
import { controlHeightClass } from '../utils/controlSize'

// Attributes are bound after the button's own, so the caller's win.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Native type; `submit` sends the form the button sits in. */
    type?: 'button' | 'submit' | 'reset'
    /** A Lucide icon component, e.g. `Pencil` from `@lucide/vue`. */
    icon?: Component
    /** Presentation: `primary` is the brand fill (the arrow of a split button), `outline` a white square with a border, `ghost` only the glyph until hovered. */
    variant?: IconButtonVariant
    /** Meaning of the glyph: gray, brand, or a dangerous action. `pressed` on overrides it with the brand frame. */
    tone?: IconButtonTone
    /** The accessible name, for a screen reader; no hint shows it, so wrap the button in UiTooltip where a sighted user needs it. Required: the button has no visible text. */
    ariaLabel: string
    /** Natively disabled: out of the Tab order, grayed; with `disabledReason`, focusable and saying why. */
    disabled?: boolean
    /** Why it cannot be pressed now, while `disabled`, as UiButton's: it stays in the Tab order, refuses the press, and says the reason in a tooltip and as its description. */
    disabledReason?: string
    /** Step of the control ladder: `xs` 28px for a dismiss in a corner, `sm` 36px, `md` 44px for forms. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ButtonSize
    /** A request is running: spinner instead of the glyph, `aria-busy`, no clicks; focus stays, as in `UiButton`. */
    loading?: boolean
    /** A toggle (pin, bookmark), as UiButton's `pressed`: `aria-pressed`, and on, the brand frame and plate. Unset, it is no toggle. A `primary` square is never one. */
    pressed?: boolean
  }>(),
  // `pressed` has no default: a cast to false would put aria-pressed on every action.
  {
    type: 'button',
    variant: 'outline',
    tone: 'neutral',
    loading: false,
    pressed: undefined,
  },
)
const ladder = useControlSize(() => props.size)

defineSlots<{
  /** A glyph in place of `icon`; the button sizes it. */
  default(props: Record<string, never>): any
  /** A short tail after the glyph, such as a count; the square grows wider on one line. */
  trailing(props: Record<string, never>): any
}>()

// Glyph is about 0.45 of the square: 20 in 44, 16 in 36, 14 in 28.
const sizes: Record<ButtonSize, string> = {
  md: `${controlHeightClass.md} w-11 [&_svg]:h-5 [&_svg]:w-5`,
  sm: `${controlHeightClass.sm} w-9 [&_svg]:h-4 [&_svg]:w-4`,
  xs: `${controlHeightClass.xs} w-7 [&_svg]:h-3.5 [&_svg]:w-3.5`,
}
const grown: Record<ButtonSize, string> = {
  md: `${controlHeightClass.md} min-w-11 w-auto gap-1 px-2 [&_svg]:h-5 [&_svg]:w-5`,
  sm: `${controlHeightClass.sm} min-w-9 w-auto gap-1 px-2 [&_svg]:h-4 [&_svg]:w-4`,
  xs: `${controlHeightClass.xs} min-w-7 w-auto gap-1 px-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5`,
}
// One step larger than the glyph: a ring the size of the icon reads as a tremor. With a tail
// the spinner takes the glyph's box, so the button keeps its width while loading.
const spinner: Record<ButtonSize, string> = {
  md: '!h-6 !w-6',
  sm: '!h-5 !w-5',
  xs: '!h-4 !w-4',
}

const base = [
  // No wrapping: a tail grows the width, never the height, as in UiButton.
  'ui-toggle inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control border text-sm/5.5 [&_svg]:shrink-0',
  'transition-colors duration-fast ease-standard [&:enabled:not([aria-disabled=true])]:active:brightness-90',
  'focus:outline-hidden disabled:cursor-not-allowed',
].join(' ')

// Ghost keeps a transparent border so the glyph never shifts; hover adds a fill only.
const FRAMED = 'border-border bg-surface '
const QUIET = 'border-transparent bg-transparent '
// A filled square has no neutral: gray and brand both take the brand fill, as UiButton's primary.
const SOLID = 'border-transparent bg-brand-solid text-brand-solid-fg enabled:hover:bg-brand-hover'
const fill: Record<IconButtonVariant, Record<IconButtonTone, string>> = {
  primary: {
    neutral: SOLID,
    brand: SOLID,
    danger: 'border-transparent bg-danger text-danger-fg enabled:hover:brightness-95',
  },
  outline: {
    neutral: FRAMED + 'text-fg enabled:hover:bg-surface-muted',
    brand: FRAMED + 'text-brand enabled:hover:bg-brand-subtle enabled:hover:border-brand/40',
    danger:
      FRAMED +
      'text-danger-subtle-fg enabled:hover:bg-danger-subtle enabled:hover:border-danger-border',
  },
  ghost: {
    neutral: QUIET + 'text-fg-muted enabled:hover:bg-surface-muted enabled:hover:text-fg',
    brand: QUIET + 'text-brand enabled:hover:bg-brand-subtle',
    danger: QUIET + 'text-danger-subtle-fg enabled:hover:bg-danger-subtle',
  },
}
// On, as UiButton's pressed: the brand frame and plate; forced colors take the highlight (tokens.css).
const pressedOn = 'border-brand bg-brand-subtle text-brand-subtle-fg enabled:hover:bg-brand-subtle'
// Disabled keeps the shape and grays the glyph, as UiButton does; loading keeps the color.
const off: Record<IconButtonVariant, string> = {
  primary: 'border-transparent bg-border-strong/40 text-disabled-fg',
  outline: 'border-border bg-border-strong/40 text-disabled-fg',
  ghost: QUIET + 'text-disabled-fg',
}

const state = computed(() => [
  // Loading stays enabled to keep focus, so the pointer is turned off instead.
  props.loading ? 'pointer-events-none' : '',
  reasoned.value ? 'cursor-not-allowed' : '',
  props.disabled && !props.loading
    ? off[props.variant]
    : props.pressed && props.variant !== 'primary'
      ? pressedOn
      : fill[props.variant][props.tone],
])

const slots = useSlots()
onMounted(() => {
  if (isDev() && !props.ariaLabel?.trim())
    console.warn('[grani] UiIconButton has no name: pass a non-empty ariaLabel.')
  if (isDev() && props.variant === 'primary' && props.pressed !== undefined)
    console.warn('[grani] UiIconButton: a primary square is filled already; it is never a toggle.')
  if (isDev() && !props.loading && !props.icon && !slots.default)
    console.warn(
      `[grani] UiIconButton "${props.ariaLabel}" has no icon: pass icon or a glyph in the slot.`,
    )
})

// Off with a reason it keeps the focus, so the reason can be read: `aria-disabled`, not `disabled`;
// loading and a reason refuse the press in `refuse`, as on UiButton.
const { reason, reasoned, reasonId, refuse } = useDisabledReason(props, 'ui-icon-button-reason')
// A held Enter repeats, and each repeat clicks: a Delete that hands the focus to the next row's
// Delete would empty the list at key-repeat speed. The repeats are the same press.
function onHeld(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.repeat) e.preventDefault()
}
const el = shallowRef<HTMLElement | null>(null)
const setEl = (r: unknown) => (el.value = r instanceof HTMLElement ? r : null)
</script>
