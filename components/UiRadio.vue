<!--
  UiRadio: one option of a UiRadioGroup, with its label in the slot and an optional
  `description` under it. It works only inside UiRadioGroup; its spec lives in the group's.

  Row. It is a native radio drawn as the library's round mark. The whole row is the label, so a
  click anywhere on it selects. The mark stands at the first line (18px, 1px down in its 22px
  line), 8px from the text as a checkbox's, so a long label wraps beside it.

  Card. In a `card` group the row is a card: `#media` first, then the text, `#meta` (a price, a
  count), and the mark at the end, all centered on the card. A selected card gets a brand border
  and halo; a disabled one keeps the neutral border, and its muted mark says the choice. In a
  `card-check` group a check and a tint replace the round mark.

  Segment. In a `segmented` group the row is one segment of the bar, pressed when selected, with
  no mark. It takes a press out to the bar's edge, the first and the last also to its ends. A
  disabled selected segment keeps a plate, so the choice still shows.

  Group. The group says invalid and required, not the radio. A form reset puts the radios back on
  the model.

  Attributes. Attributes and listeners land on the input, `class` and `style` on the row.

  Naming. A radio with no slot text (a glyph segment, a row whose label sits elsewhere) is named
  by `ariaLabel` or by a `<label for>` that points at its `id`.

  Keyboard.
  The keys belong to the group: a native radio sits under the mark, the card and the segment, so
  they work through UiRadioGroup, with one tab stop once one is checked.
  - `ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight`: move the selection.
  - `Space`: selects.
  A click anywhere on the row selects, a card's media and meta included. `disabled` blocks it
  whatever the group says.

  Reader.
  - Name: a radio named by the slot text alone, or by `ariaLabel` or a `<label for>` when the slot
    holds no text.
  - Description: the `description` and a card's `#meta` are read once after it, as its
    description, never as part of the name.
  - Errors: the group says invalid and required, not the radio.
  - Segment: the radio lies invisible over the pressed plate, so a screen reader hears a radio
    where the eye sees a segment.

  States. Unchecked, checked (a brand fill with a dot; a check and a tint in `card-check`; a
  pressed segment in `segmented`), hover (an empty mark darkens), focus, disabled (muted; a
  disabled selected segment keeps a plate), and invalid, which reddens the empty marks when the
  group says so.

  Not for.
  - Several answers: UiCheckbox.
  - A radio outside a group: never, it belongs to UiRadioGroup.
  - A card that opens something rather than picks: UiListItem `as="button"`.
-->
<template>
  <label
    class="text-sm/5.5"
    :data-selected="((card && !isDisabled) || segment) && selected ? true : undefined"
    :class="[
      card
        ? [
            cardShellClass,
            'ui-choice flex gap-3 p-4 transition-[box-shadow,border-color] duration-fast',
            selected && check && !isDisabled ? 'bg-brand-subtle' : '',
            isDisabled ? 'bg-surface-muted' : !selected ? 'hover:bg-surface-muted' : '',
          ]
        : segment
          ? [
              'ui-segment relative flex items-center justify-center whitespace-nowrap rounded-control font-medium transition-colors duration-fast',
              // The bar's frame and the room inside it take a press too: a segment reaches out to
              // the bar's edge, the first and the last also to its ends.
              'after:absolute after:inset-x-0',
              group?.size.value === 'sm'
                ? 'px-2.5 text-sm/5.5 after:-inset-y-[3px] first:after:-start-[3px] last:after:-end-[3px]'
                : 'px-3 text-sm/5.5 after:-inset-y-[5px] first:after:-start-[5px] last:after:-end-[5px]',
              group?.block.value ? 'flex-1' : '',
              selected && !isDisabled ? 'bg-surface text-fg shadow-xs' : '',
              // Disabled and chosen: the disabled plate, so the choice still shows.
              selected && isDisabled ? 'bg-border-strong/40' : '',
              !selected && !isDisabled ? 'text-fg-muted hover:text-fg' : '',
            ]
          : 'inline-flex gap-2',
      card || segment ? 'items-center' : 'items-start',
      isDisabled ? 'cursor-not-allowed text-disabled-fg' : 'cursor-pointer',
      !isDisabled && !segment ? 'text-fg' : '',
      rootClass,
    ]"
    :style="rootStyle"
  >
    <span
      v-if="card && $slots.media"
      class="flex shrink-0 items-center [&_svg]:h-5 [&_svg]:w-5"
      :class="isDisabled ? 'text-disabled-fg' : 'text-fg-muted'"
    >
      <slot name="media" />
    </span>
    <span
      :class="[
        segment ? 'absolute inset-0' : 'relative inline-flex',
        card ? 'order-last' : '',
        !card && !segment ? ['shrink-0', MARK_STEP[step].top] : '',
      ]"
    >
      <input
        v-bind="bound"
        ref="inputRef"
        type="radio"
        :value="value"
        :checked="selected"
        :disabled="isDisabled"
        :required="group?.required.value || undefined"
        class="appearance-none enabled:cursor-pointer disabled:cursor-not-allowed"
        :class="
          segment
            ? // Over the segment's frame (its ::after takes the press around it): the radio is what
              // a pointer at the middle reaches, a test's `check()` as well.
              'absolute inset-0 z-10 h-full w-full rounded-control opacity-0'
            : [
                card ? RADIO_MARK_BASE_CARD : [RADIO_MARK_SHELL, MARK_STEP[step].box],
                check && !selected && !isDisabled
                  ? group?.invalid.value
                    ? 'border-danger-border bg-transparent'
                    : 'border-transparent bg-transparent'
                  : [
                      checkMarkClass(selected, isDisabled, Boolean(group?.invalid.value)),
                      selected || group?.invalid.value
                        ? ''
                        : 'enabled:hover:border-control-border-hover',
                    ],
              ]
        "
        @change="onChange"
      />
      <Check
        v-if="selected && check && !segment"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 m-auto"
        :class="[
          card ? CHECK_MARK_GLYPH_CARD : MARK_STEP[step].glyph,
          isDisabled ? 'text-disabled-fg' : 'text-brand-solid-fg',
        ]"
        :stroke-width="CHECK_MARK_STROKE"
      />
      <span
        v-else-if="selected && !segment"
        aria-hidden="true"
        class="ui-mark-dot pointer-events-none absolute inset-0 m-auto rounded-pill"
        :class="[
          card ? 'h-2 w-2' : MARK_STEP[step].dot,
          isDisabled ? 'bg-disabled-fg' : 'bg-brand-solid-fg',
        ]"
      />
    </span>
    <span class="flex min-w-0 flex-col" :class="segment ? 'items-center' : 'flex-1'">
      <span :id="`${uid}-label`" class="font-medium [&>svg]:h-4 [&>svg]:w-4"><slot /></span>
      <span
        v-if="description && !segment"
        :id="`${uid}-description`"
        class="text-xs/4.5"
        :class="
          isDisabled
            ? 'text-disabled-fg'
            : selected && check
              ? 'text-brand-subtle-fg'
              : 'text-fg-muted'
        "
      >
        {{ description }}
      </span>
    </span>
    <span
      v-if="card && $slots.meta"
      :id="`${uid}-meta`"
      class="shrink-0 whitespace-nowrap font-medium tabular-nums"
    >
      <slot name="meta" />
    </span>
  </label>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { computed, onBeforeUnmount, ref, useId, useSlots, watch } from 'vue'
import { Check } from '@lucide/vue'
import type { SelectValue } from '../types/ui'
import { cardShellClass } from '../utils/cardShell'
import {
  CHECK_MARK_GLYPH_CARD,
  CHECK_MARK_STROKE,
  checkMarkClass,
  MARK_STEP,
  RADIO_MARK_BASE_CARD,
  RADIO_MARK_SHELL,
} from '../utils/checkMark'
import { isDev } from '../utils/dev'
import { useRadioGroup } from '../utils/radioGroup'
import type { ControlSize } from '../types/ui'
import { useFormReset } from '../utils/composition'
import { joinIds, ownWhereSet, useSplitAttrs } from '../utils/attrs'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The value this radio stands for; the group's model takes it when selected. */
    value: SelectValue
    /** A second line under the label. Read with the radio as its description. Not drawn in a segment. */
    description?: string
    /** Prevents selecting this radio; the group's `disabled` covers all of them. */
    disabled?: boolean
    /** Own id, for a label elsewhere. */
    id?: string
    /** Accessible name when the slot has no text: a glyph segment, a label outside the row. */
    ariaLabel?: string
  }>(),
  { disabled: false },
)

defineSlots<{
  /** Label text displayed next to the mark. Clicking it selects the radio. */
  default(props: Record<string, never>): any
  /** A glyph or a small image before the text. Cards only. */
  media(props: Record<string, never>): any
  /** A value at the end, before the mark: a price, a count. Cards only. */
  meta(props: Record<string, never>): any
}>()

const group = useRadioGroup()
// A plain mark takes the group's step: 16, 18 or 20 px beside the text.
const step = computed<ControlSize>(() => group?.mark.value ?? 'sm')
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
const uid = useId()
const inputRef = ref<HTMLInputElement | null>(null)
let release = group?.claim(props.value, uid)
watch(
  () => props.value,
  (value) => {
    release?.()
    release = group?.claim(value, uid)
  },
)
onBeforeUnmount(() => release?.())
const selected = computed(
  () => group?.modelValue.value === props.value && group.owner(props.value) === uid,
)
const isDisabled = computed(() => props.disabled || Boolean(group?.disabled.value))
// Validity and requirement are said once, by the group; a radio only draws them.
// The name is the label text alone; the description and the meta are read after
// it once, not folded into the name by the wrapping label.
const { rootClass, rootStyle, control } = useSplitAttrs()
const describedBy = computed(() =>
  joinIds(
    control.value['aria-describedby'],
    props.description && !segment.value ? `${uid}-description` : '',
    card.value && seen.meta ? `${uid}-meta` : '',
  ),
)
// One source for the name: `ariaLabel` when given, else the slot text. A span with
// no text (a glyph, nothing) would outrank both `ariaLabel` and a `<label for>`.
const labelledBy = computed(() => (props.ariaLabel || !seen.default ? undefined : `${uid}-label`))
// Ours win only where set: a radio with no slot text keeps the caller's `aria-labelledby`.
const bound = computed(() =>
  ownWhereSet(control.value, {
    id: props.id,
    name: group?.name.value,
    'aria-label': props.ariaLabel,
    'aria-labelledby': labelledBy.value,
    'aria-describedby': describedBy.value,
  }),
)
const card = computed(
  () => group?.variant.value === 'card' || group?.variant.value === 'card-check',
)
// A segment draws no mark: the pressed plate is the state; the radio sits invisible over it.
const segment = computed(() => group?.variant.value === 'segmented')
const check = computed(() => group?.variant.value === 'card-check')

if (!group && isDev())
  console.warn('[grani] UiRadio renders outside UiRadioGroup: it has no group to belong to.')

// The browser checks the radio before Vue hears of it. If the owner vetoes the
// change (nothing reactive moves), the DOM would keep the new radio checked
// while the drawn mark shows the old one; once the group says the pick has
// settled, every radio puts its DOM back on the model.
const syncChecked = () => {
  if (inputRef.value) inputRef.value.checked = selected.value
}
watch([selected, () => group?.settled.value], syncChecked)
// A form reset unchecks the radios (Vue sets `checked` as a property, there is no default to
// restore) and fires no change: once it is done, every radio goes back to the model.
useFormReset(inputRef, syncChecked)
const onChange = () => group?.select(props.value)

defineExpose({ focus: (options?: FocusOptions) => inputRef.value?.focus(options) })
</script>
