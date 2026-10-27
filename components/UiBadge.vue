<!--
  UiBadge: a short word for a state or a tag. Take it for a status in a row, a tag you picked or a
  state in a card's head, in one of three forms; a number is UiCount.

  Forms. `tone` is the meaning and `variant` the form: `soft` is a pale pill, `inline` a dot with
  text for a table row, `outline` a pale plate with a border. `size` `sm` makes every form compact.

  Loading. `loading` puts a spinner where the dot or the icon stands and sets `aria-busy` on the
  root, and the text says what is happening ("Syncing"). The spinner is 14px with a heavier stroke,
  since at 12px the ring breaks into pixels. It is seen, not heard: a host that must announce it
  puts the words in its own live region.

  Remove. `removable` adds a close button in the plate's own ink and corner, the one interactive
  part, with a 24px touch target. A double click fires it only once, and it works again after 500 ms
  (for example, after a canceled confirm), but not while a `loading` the host set from the click is
  running. The badge unmounts on remove, so the host moves the focus.

  Long labels. A long label is cut the way UiTruncate cuts it, with the whole text in a tooltip; a
  slot handles its own cut. The text is its name: a badge without text is a bare color.

  Placement. It sits in a table's status column, in UiLog's changed value, as UiSelect's picked
  tags, under UiDelta, and in the `#actions` of UiCard, the `#actions` of UiListItem and a drawer's
  `#status`. The root is a `<span>`.

  Keyboard.
  Not interactive: the badge takes no focus. `removable` adds the one tab stop, the cross, a native
  button:
  - `Tab`: reaches the cross.
  - `Enter` `Space`: press the cross.
  It fires `remove` once per double click, and the host moves the focus, since the badge unmounts.

  Reader.
  - Name: the text; the dot, the icon and the spinner are hidden.
  - Loading: says busy (`aria-busy`), and the text says what is happening.
  - Cross: named "Remove" with the label: the words on screen when the slot gives them, or
    `removeLabel`.
  - Cut label: keeps the whole text in a tooltip.
  - No text: a badge without text is a bare color and warns in dev.

  States. Six tones in three forms, `soft`, `inline` and `outline`, at `sm` and `md`; `dot` before
  the text; `loading`, the spinner where the dot or the icon stands; `removable`, the cross, with
  its hover plate only when enabled; a long label cut with an ellipsis.

  Not for.
  - A number: UiCount.
  - A change against the value before: UiDelta.
  - A mark on the corner of an icon or an avatar: UiIndicator.
  - A notice with words and an action: UiListItem in a `tone`.
-->
<template>
  <span
    class="ui-badge inline-flex max-w-full items-center whitespace-nowrap [&>svg]:h-3 [&>svg]:w-3 [&>svg]:shrink-0"
    :class="[`ui-badge--${variant}`, shell]"
    :aria-busy="loading || undefined"
  >
    <UiSpinner v-if="loading" class="!h-3.5 !w-3.5 text-current [stroke-width:2.75]" />
    <span
      v-else-if="variant === 'inline' || dot"
      aria-hidden="true"
      class="shrink-0 rounded-pill"
      :class="[variant === 'inline' && size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2', dotClass]"
    />
    <slot v-if="variant !== 'inline' && !loading && !dot" name="icon" />
    <UiTruncate v-if="namedByProp" :id="textId" :text="label" class="min-w-0" />
    <span v-else :id="textId" class="min-w-0 truncate"
      ><slot>{{ label }}</slot></span
    >
    <!-- The plate of the cross stands 2px from the top, the bottom and the end of the badge alike. -->
    <button
      v-if="removable"
      type="button"
      class="ui-badge__remove relative inline-flex h-5 w-5 shrink-0 items-center justify-center text-current before:absolute before:rounded-[inherit] before:transition-colors before:content-[''] after:absolute after:-inset-0.5 after:content-[''] focus:outline-hidden enabled:hover:before:bg-fg/10 focus-visible:before:bg-fg/10"
      :class="[
        variant === 'outline'
          ? 'rounded-badge -me-1.5'
          : variant === 'inline'
            ? 'rounded-pill'
            : 'rounded-pill -me-2',
        size === 'sm' ? 'before:inset-0.5' : 'before:inset-0',
      ]"
      :aria-label="removeLabel || (namedByProp ? t('grani.badge.remove', { label }) : undefined)"
      :aria-labelledby="!removeLabel && !namedByProp ? `${textId}-remove ${textId}` : undefined"
      @click="onRemove"
      @keydown.enter="onHeld"
    >
      <X aria-hidden="true" class="relative" :class="size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'" />
      <span v-if="!removeLabel && !namedByProp" :id="`${textId}-remove`" class="sr-only">{{
        t('grani.badge.removeShort')
      }}</span>
    </button>
  </span>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { computed, onBeforeUnmount, onMounted, useId, useSlots, watch } from 'vue'
import { X } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import type { BadgeTone, BadgeVariant } from '../types/ui'
import UiSpinner from './UiSpinner.vue'
import UiTruncate from './UiTruncate.vue'
import { toneDotClass, toneOutlineClass, toneSubtleClass } from '../utils/tone'

const { t } = useUiT()
const textId = useId()

const props = withDefaults(
  defineProps<{
    /** Text of the label; the default slot overrides it. */
    label?: string
    /** Meaning: a verdict, `brand` for the product's own marks, or `neutral` for a category. */
    tone?: BadgeTone
    /** Form: `soft` pale pill, `inline` dot with text, `outline` pale plate with a border. */
    variant?: BadgeVariant
    /** Indicator dot before the text; `inline` always has one. The text still names it: a dot alone is color. */
    dot?: boolean
    /** Work in progress: a spinner stands where the dot or the icon would. */
    loading?: boolean
    /** Scale: `sm` for dense tables and long lists, `md` beside a title. */
    size?: 'sm' | 'md'
    /** Close button: an applied filter, an added tag. */
    removable?: boolean
    /** Accessible name of the close button; the default names the label. */
    removeLabel?: string
  }>(),
  {
    label: '',
    tone: 'neutral',
    variant: 'soft',
    dot: false,
    loading: false,
    size: 'md',
    removable: false,
    removeLabel: '',
  },
)

const emit = defineEmits<{
  /** The close button of a `removable` badge was pressed: once per double click; the host removes the badge and moves focus. Carries the click (`detail` tells a double click's second from a key's). */
  remove: [event: MouseEvent]
}>()

defineSlots<{
  /** Label text instead of the `label` prop. */
  default(props: Record<string, never>): any
  /** Glyph before the text. */
  icon(props: Record<string, never>): any
}>()

// Heights are set, not grown from padding: an arbitrary text size keeps the parent's line
// height. 20 and 24 px, `sm` below `md`.
const shell = computed(() => {
  const sm = props.size === 'sm'
  switch (props.variant) {
    case 'inline':
      return ['text-fg-muted', sm ? 'gap-1.5 text-xs/4.5' : 'gap-2 text-sm/5.5']
    case 'outline':
      return [
        'rounded-badge border font-medium',
        sm ? 'h-5 gap-1 px-1.5 text-[11px] leading-4' : 'h-6 gap-1.5 px-2 text-xs leading-4',
        toneOutlineClass(props.tone),
      ]
    default:
      return [
        'rounded-pill font-medium',
        sm ? 'h-5 gap-1 px-2 text-[11px] leading-4' : 'h-6 gap-1.5 px-2.5 text-xs leading-4',
        toneSubtleClass(props.tone),
      ]
  }
})

const dotClass = computed(() => toneDotClass(props.tone))

const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
// The name follows what is on screen: the slot wins over `label` there, so it does here.
const namedByProp = computed(() => Boolean(props.label) && !seen.default)

// One remove per double click: 500 ms is the system double-click interval. A render
// is no signal (a host marks the row "deleting" between the clicks); a `loading` the
// host turns on holds the × until it ends; a canceled confirm reopens it on its own.
const DOUBLE_CLICK_MS = 500
let removing = false
let timer: ReturnType<typeof setTimeout> | undefined
const reopen = () => {
  clearTimeout(timer)
  removing = false
}
watch(() => [props.label, props.removable], reopen)
watch(
  () => props.loading,
  (now, before) => {
    if (before && !now) reopen()
  },
)
onBeforeUnmount(() => clearTimeout(timer))
// A held Enter repeats and each repeat clicks: in a row of tags the focus moves to the next cross
// after each removal, and the whole row would go at key-repeat speed. The repeats are the same press.
function onHeld(e: KeyboardEvent) {
  if (e.repeat) e.preventDefault()
}
function onRemove(e: MouseEvent) {
  if (removing) return
  removing = true
  emit('remove', e)
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (!props.loading) removing = false
  }, DOUBLE_CLICK_MS)
}

onMounted(() => {
  if (!isDev()) return
  if (slots.icon && (props.dot || props.variant === 'inline'))
    console.warn(
      `[grani] UiBadge drops the icon: ${props.dot ? 'a dot or an icon, not both' : 'inline has a dot, not an icon'}.`,
    )
  if (!props.label && !slots.default)
    console.warn('[grani] UiBadge has no text: a dot or a color alone names nothing.')
})
</script>
