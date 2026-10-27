<!--
  UiButton: a button for an action, with loading and toggle states. With `to` it renders a link
  styled as a button.

  Look. `variant` is the weight of the presentation, `tone` is the meaning.

  Loading. `loading` shows a spinner in place of the label and refuses a second click, including one
  meant for your own handler. The width holds, also with the text of the `#loading` slot; an empty
  `loadingText` leaves the spinner alone.

  Toggle. `pressed` makes it a toggle: `aria-pressed`, a check before the label, and the brand
  frame. It is for a chip that turns on and off by itself, as a filter (Unpaid, Overdue, Mine); one
  choice among a few is UiRadioGroup `segmented`. Off, it holds the room of its check, so pressing
  it moves nothing beside it.

  Disabled. `disabled` alone is the native state: a flat plate, out of the Tab order, and silent, so
  a person cannot learn why it does not press. With `disabledReason` it keeps the same plate but
  stays in the Tab order, refuses the press (a submit too, and a menu it would open, by the arrows
  as well), and says why: in a tooltip on hover, keyboard focus, a press and a tap, and as its
  description to a screen reader ("Add the client's email first"). The tooltip stands inside the
  button, loaded the first time it is off with a reason, so the button stays its one element: a
  reason that comes or goes under the focus keeps it, and a ref or a UiTooltip around it still
  reaches the button; while it is off, the reason shows in place of that UiTooltip's words. With
  `to`, the link turns into a button when disabled, a new element, so the focus does not stay.

  Links. With `to` it renders a RouteLink that looks like a button. Another site, or
  `target="_blank"`, opens in a new tab and says so: an arrow for the eye, a phrase for a screen
  reader. A `javascript:` or `data:` address is refused: it stays a button, and dev warns.

  Placement. It sits in the footers of a drawer and a confirm, in toolbars beside a search, and in
  the triggers of filters, periods and columns. One `primary` to a surface, last in its footer: it
  is the step the surface is for. UiCopyButton is built on it, and UiButtonGroup joins
  it with its neighbors into one capsule.

  Attributes. Anything else passed to it lands on the root element: native button and form
  attributes, `aria-*`, `data-testid`.

  Keyboard.
  - `Tab`: reaches it.
  - `Enter` `Space`: press it; not while `loading`, nor while disabled with a reason, which the
    focus still reaches. A held Enter is one press: its repeats press nothing.
  - `ArrowDown` `ArrowUp`: as a menu's trigger, open it; not while it refuses the press.
  With `to`, a link:
  - `Enter`: follows it; `Space` does not, as in the browser.

  Reader.
  - Name: the label; a lone glyph is UiIconButton, which carries its own name.
  - Loading: says busy (`aria-busy`); the label is hidden from the reader and the loading text
    becomes the name: "In progress…" by default, `loadingText` or the `#loading` slot. The spinner
    is hidden. With an empty `loadingText` the label stays the name, unseen but still read, so the
    button is never nameless.
  - Pressed: `pressed` is `aria-pressed`.
  - Disabled with a reason: `aria-disabled`, and the reason is its description, read once.
  - New tab: said in words after the label, where the eye sees an arrow.

  States. Rest, hover on a device that hovers, focus, disabled, disabled with a reason (the plate,
  the focus, the hint), loading and pressed, in both themes.
  A loading button keeps its width, so nothing beside it moves.

  Not for.
  - Text inside prose: UiLink.
  - A lone glyph: UiIconButton.
  - A choice among options: UiRadioGroup `segmented`.
  - Buttons joined into one capsule: UiButtonGroup around them.
-->
<template>
  <component
    :is="asLink ? RouteLink : 'button'"
    :ref="setEl"
    data-grani
    :to="asLink ? to : undefined"
    :target="asLink ? resolved.target : undefined"
    :rel="asLink ? resolved.rel : undefined"
    :type="asLink ? undefined : type"
    :disabled="asLink ? undefined : (disabled && !loading && !reasoned) || undefined"
    :aria-disabled="loading || reasoned || undefined"
    :aria-busy="loading || undefined"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    :data-focus="tone === 'danger' ? 'danger' : undefined"
    :data-filled="variant === 'primary' || variant === 'secondary' || undefined"
    :class="classes"
    v-bind="$attrs"
    :aria-describedby="joinIds($attrs['aria-describedby'], reasoned ? reasonId : undefined)"
    @click.capture="refuse"
    @keydown="onHeld"
  >
    <!-- One cell for both lines: the width fits the longer; idle text is a pseudo element. -->
    <!-- min-w-0 and the clip: in a footer of equal parts a long label stays inside its plate. -->
    <span
      class="inline-grid min-w-0 max-w-full overflow-clip [overflow-clip-margin:0.25rem] [&>*]:col-start-1 [&>*]:row-start-1"
    >
      <span
        class="inline-flex items-center justify-center gap-2 [&_svg]:shrink-0 [&>.lucide-chevron-down:last-child:not(:first-child)]:-mx-1"
        :class="[
          loading ? (spoken ? 'invisible' : 'opacity-0') : '',
          held ? checkRoom[ladder] : '',
        ]"
        :aria-hidden="(loading && spoken) || undefined"
      >
        <Check v-if="pressed && pressable" aria-hidden="true" class="-ms-0.5" />
        <slot />
        <ArrowUpRight v-if="asLink && newTab" aria-hidden="true" class="-me-1" />
      </span>
      <span v-if="loading" class="inline-flex items-center justify-center gap-2 [&_svg]:shrink-0">
        <UiSpinner
          :class="[spinner[variant][tone], loadingLabel || $slots.loading ? '-ms-1' : '']"
        />
        <slot name="loading">{{ loadingLabel }}</slot>
      </span>
      <span v-else-if="canLoad" class="invisible inline-flex items-center gap-2" aria-hidden="true">
        <span
          class="shrink-0"
          :class="[spacer[ladder], loadingLabel || $slots.loading ? '-ms-1' : '']"
        />
        <!-- The `#loading` slot sizes it when given: its text may be longer than the default. -->
        <span v-if="$slots.loading" data-sizer><slot name="loading" /></span>
        <span
          v-else-if="loadingLabel"
          :data-sizer="loadingLabel"
          class="after:content-[attr(data-sizer)]"
        />
      </span>
    </span>
    <span v-if="asLink && newTab" class="sr-only">{{ ' ' + t('grani.link.external') }}</span>
    <!-- The reason a disabled button gives, read as its description, never as its name. -->
    <span v-if="reasoned" :id="reasonId" hidden>{{ reason }}</span>
    <!-- Its hint stands inside, the button the one root: a reason that comes and goes keeps the
           node, its focus and its ref. Loaded the first time the button is off with a reason. -->
    <LazyHint v-if="reasoned" :anchor="() => el" :content="reason" late reason />
  </component>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { RouteLink } from '../utils/routeLink'
import { useControlSize } from '../composables/useControlSize'
import { computed, getCurrentInstance, provide, ref, shallowRef, watch } from 'vue'
import { ArrowUpRight, Check } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import UiSpinner from './UiSpinner.vue'
import { joinIds } from '../utils/attrs'
import { useDisabledReason } from '../composables/disabledReason'
import { LazyHint } from './lazyHint'
import type { ButtonSize, ButtonTone, ButtonVariant } from '../types/ui'
import { hasAddress, INSIDE_LINK, linkTarget, unsafeHref } from '../utils/link'
import { controlHeightClass } from '../utils/controlSize'
import { isDev } from '../utils/dev'

const { t } = useUiT()

const props = withDefaults(
  defineProps<{
    /** Native type; `submit` sends the form the button sits in. A link has none. */
    type?: 'button' | 'submit' | 'reset'
    /** A route or a URL: the button becomes a link. An absolute address opens in a new tab; `javascript:` and `data:` are refused, and it stays a button. */
    to?: string
    /** With `to`: `_blank` or `_self` decides the tab; unset, a new tab for an absolute address only. */
    target?: '_blank' | '_self'
    /** With `to`: replaces the default `noreferrer` (`nofollow`, `sponsored`); `noopener` stays on a new tab. */
    rel?: string
    /** A request is running: spinner, `aria-busy`, no clicks; it wins over `disabled`. */
    loading?: boolean
    /** Natively disabled: a flat plate, out of the Tab order; with `disabledReason`, focusable and saying why. A link turns back into a button. */
    disabled?: boolean
    /** Why it cannot be pressed now, while `disabled`: it stays in the Tab order, refuses the press, and says the reason in a tooltip on hover, focus, a press and a tap, and as its description to a screen reader. A blank one is none. */
    disabledReason?: string
    /** Weight of the presentation: brand fill, gray plate, white with a border, or quiet. */
    variant?: ButtonVariant
    /** Meaning of the action; `brand` means none in particular. Every variant supports every tone. */
    tone?: ButtonTone
    /** Step of the control ladder: `xs` 28px for a micro action, `sm` 36px, `md` 44px for forms. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ButtonSize
    /** Full width, as in a drawer footer. */
    block?: boolean
    /** Label while loading; the default is a translated "In progress…". Empty, the spinner stands alone (a glyph button). */
    loadingText?: string
    /** A toggle: `aria-pressed`, and on, a check and the brand frame. Unset, it is no toggle. A primary button is never one. */
    pressed?: boolean
  }>(),
  {
    type: 'button',
    loading: false,
    disabled: false,
    variant: 'primary',
    tone: 'brand',
    block: false,
    // No default: a cast to false would put aria-pressed on every action.
    pressed: undefined,
    loadingText: undefined,
  },
)
const ladder = useControlSize(() => props.size)

const slots = defineSlots<{
  /** Replaces the label while loading. */
  loading(props: Record<string, never>): any
  /** The label; a glyph goes here too, before the text. The button sizes it. */
  default(props: Record<string, never>): any
}>()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)

const fill: Record<ButtonVariant, Record<ButtonTone, string>> = {
  primary: {
    brand:
      'border-transparent bg-brand-solid text-brand-solid-fg [&:is(:enabled,a)]:hover:bg-brand-hover',
    success: 'border-transparent bg-success text-success-fg [&:is(:enabled,a)]:hover:brightness-95',
    warning: 'border-transparent bg-warning text-warning-fg [&:is(:enabled,a)]:hover:brightness-95',
    danger: 'border-transparent bg-danger text-danger-fg [&:is(:enabled,a)]:hover:brightness-95',
  },
  // A flat plate with no visible border. Toned secondary is a soft plate, not
  // colored text on gray: that text failed the contrast threshold.
  secondary: {
    brand: 'border-transparent bg-border text-fg [&:is(:enabled,a)]:hover:bg-border-strong',
    success:
      'border-transparent bg-success-subtle text-success-subtle-fg [&:is(:enabled,a)]:hover:bg-success/25',
    warning:
      'border-transparent bg-warning-subtle text-warning-subtle-fg [&:is(:enabled,a)]:hover:bg-warning/25',
    danger:
      'border-transparent bg-danger-subtle text-danger-subtle-fg [&:is(:enabled,a)]:hover:bg-danger/25',
  },
  // The border is neutral at rest and takes the tone on hover: the frame answers the cursor.
  outline: {
    brand:
      'border-border bg-surface text-fg [&:is(:enabled,a)]:hover:border-border-strong [&:is(:enabled,a)]:hover:bg-surface-muted',
    success:
      'border-border bg-surface text-success-subtle-fg [&:is(:enabled,a)]:hover:border-success-border [&:is(:enabled,a)]:hover:bg-success-subtle',
    warning:
      'border-border bg-surface text-warning-subtle-fg [&:is(:enabled,a)]:hover:border-warning-border [&:is(:enabled,a)]:hover:bg-warning-subtle',
    danger:
      'border-border bg-surface text-danger-subtle-fg [&:is(:enabled,a)]:hover:border-danger-border [&:is(:enabled,a)]:hover:bg-danger-subtle',
  },
  // Text takes `*-subtle-fg`, not the base tone: the base tone is graded for
  // icons (3:1), text needs 4.5:1.
  ghost: {
    brand: 'border-transparent bg-surface text-fg [&:is(:enabled,a)]:hover:bg-surface-muted',
    success:
      'border-transparent bg-surface text-success-subtle-fg [&:is(:enabled,a)]:hover:bg-success-subtle',
    warning:
      'border-transparent bg-surface text-warning-subtle-fg [&:is(:enabled,a)]:hover:bg-warning-subtle',
    danger:
      'border-transparent bg-surface text-danger-subtle-fg [&:is(:enabled,a)]:hover:bg-danger-subtle',
  },
  // One more block: a dashed frame in the shape of what it adds, muted until the
  // cursor arrives; a full button here would compete with the form's own submit.
  dashed: {
    brand:
      'border-dashed border-border-strong bg-transparent text-fg-muted [&:is(:enabled,a)]:hover:border-brand [&:is(:enabled,a)]:hover:text-brand',
    success:
      'border-dashed border-border-strong bg-transparent text-fg-muted [&:is(:enabled,a)]:hover:border-success-border [&:is(:enabled,a)]:hover:text-success-subtle-fg',
    warning:
      'border-dashed border-border-strong bg-transparent text-fg-muted [&:is(:enabled,a)]:hover:border-warning-border [&:is(:enabled,a)]:hover:text-warning-subtle-fg',
    danger:
      'border-dashed border-border-strong bg-transparent text-fg-muted [&:is(:enabled,a)]:hover:border-danger-border [&:is(:enabled,a)]:hover:text-danger-subtle-fg',
  },
}

// Translucent plate; the text is the disabled token, never an enabled color.
const off: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-border-strong/40 text-disabled-fg',
  secondary: 'border-transparent bg-border-strong/40 text-disabled-fg',
  outline: 'border-border bg-border-strong/40 text-disabled-fg',
  ghost: 'border-transparent bg-transparent text-disabled-fg',
  dashed: 'border-dashed border-border bg-transparent text-disabled-fg',
}

// The spinner follows the fill it sits on, not the meaning: on a neutral fill
// it is neutral at any tone.
const onNeutral = 'text-fg/80'
const spinner: Record<ButtonVariant, Record<ButtonTone, string>> = {
  primary: {
    brand: 'text-brand-solid-fg',
    success: 'text-success-fg',
    warning: 'text-warning-fg',
    danger: 'text-danger-fg',
  },
  secondary: { brand: onNeutral, success: onNeutral, warning: onNeutral, danger: onNeutral },
  outline: { brand: onNeutral, success: onNeutral, warning: onNeutral, danger: onNeutral },
  ghost: { brand: onNeutral, success: onNeutral, warning: onNeutral, danger: onNeutral },
  dashed: { brand: onNeutral, success: onNeutral, warning: onNeutral, danger: onNeutral },
}

// Height comes from the ladder, padding sets the width only.
const glyph: Record<ButtonSize, string> = {
  xs: '[&_svg]:h-3.5 [&_svg]:w-3.5',
  sm: '[&_svg]:h-4 [&_svg]:w-4',
  md: '[&_svg]:h-4 [&_svg]:w-4',
}
// Holds the spinner's place in the idle sizer.
const spacer: Record<ButtonSize, string> = { xs: 'w-3.5', sm: 'w-4', md: 'w-4' }
const sizes: Record<ButtonSize, string> = {
  xs: `${controlHeightClass.xs} px-2.5 text-xs/4.5 ${glyph.xs}`,
  sm: `${controlHeightClass.sm} px-3 text-sm/5.5 ${glyph.sm}`,
  md: `${controlHeightClass.md} px-5 text-sm/5.5 ${glyph.md}`,
}

// Loading keeps the link a link: a new tag is a new node, and focus would fall to <body>.
const asLink = computed(() => hasAddress(props.to) && !props.disabled && !unsafeHref(props.to))
// An address from the app's data (a menu) may be refused; the button stays a button, and dev says so.
if (isDev())
  watch(
    () => unsafeHref(props.to),
    (refused) => {
      if (refused)
        console.warn(
          '[grani] UiButton refuses a script or data address in `to`; it stays a button.',
        )
    },
    { immediate: true },
  )
const loadingLabel = computed(() => props.loadingText ?? t('grani.button.loading'))
// While loading, the loading line is the name when it has words; without them the label stays
// the name, see-through but still read, so the button is never nameless.
const spoken = computed(() => Boolean(loadingLabel.value) || Boolean(seen.loading))
// The width reserve for the loading line only stands on a button that is given
// `loading` at all, `false` included, or has loaded once; "+" or "OK" keep their own width.
const vnodeProps = getCurrentInstance()?.vnode.props ?? {}
const canLoad = ref(
  'loading' in vnodeProps || 'loadingText' in vnodeProps || 'loading-text' in vnodeProps,
)
watch(
  () => props.loading || props.loadingText !== undefined,
  (given) => {
    if (given) canLoad.value = true
  },
)
// Target, rel and the new tab, resolved as UiLink and UiListItem do (utils/link).
const resolved = computed(() => linkTarget(props.to, props.target, props.rel))
const newTab = computed(() => resolved.value.newTab)
// A link inside this one would be two links in one: UiLink warns.
provide(INSIDE_LINK, asLink)
const pressable = computed(() => props.variant !== 'primary')
// A toggle that is off holds the room of its check, half on each side, so the label stays centered
// and pressing it moves nothing beside it: the glyph and its gap, 14 - 2 + 8 at xs, 16 - 2 + 8 above.
const held = computed(() => props.pressed === false && pressable.value)
const checkRoom: Record<ButtonSize, string> = { xs: 'px-[10px]', sm: 'px-[11px]', md: 'px-[11px]' }
// On: the brand frame and plate, and the check carries it beyond color.
const pressedOn =
  'border-brand bg-brand-subtle text-brand-subtle-fg [&:is(:enabled,a)]:hover:bg-brand-subtle'

// Off with a reason it keeps the focus, so the reason can be read: `aria-disabled`, not `disabled`.
// Loading and a reason refuse the press in `refuse`, since `disabled` drops the focus.
const { reason, reasoned, reasonId, refuse } = useDisabledReason(props, 'ui-button-reason')
// A held Enter repeats, and each repeat clicks: a Delete that hands the focus to the next row's
// Delete would empty the list at key-repeat speed. The repeats are the same press.
function onHeld(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.repeat) e.preventDefault()
}
// Attributes are bound after the button's own, so the caller's win.
defineOptions({ inheritAttrs: false })
const el = shallowRef<HTMLElement | null>(null)
const setEl = (r: unknown) => (el.value = r instanceof HTMLElement ? r : null)

const classes = computed(() => [
  // The border stays in every state so the width does not jump between variants.
  'ui-toggle ui-button inline-flex items-center justify-center rounded-control border font-medium',
  // No wrapping: a long label grows the width, never the height, so a row of controls stays one line.
  // Up to its container's width (`ui-button`, tokens.css): past it, a word with no space is cut
  // inside the plate, and the page beside it never scrolls sideways.
  'whitespace-nowrap transition-colors duration-fast ease-standard focus:outline-hidden',
  // Loading stays enabled for the focus: no press feedback for a click it refuses.
  'disabled:cursor-not-allowed [&:is(:enabled,a):not([aria-disabled=true])]:active:brightness-90',
  props.block ? 'w-full' : '',
  props.loading ? 'pointer-events-none' : '',
  reasoned.value ? 'cursor-not-allowed' : '',
  sizes[ladder.value],
  // Disabled is a state of its own, not a faded copy; `loading` keeps the fill.
  props.disabled && !props.loading
    ? off[props.variant]
    : props.pressed && pressable.value
      ? pressedOn
      : fill[props.variant][props.tone],
])
</script>
