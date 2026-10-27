<!--
  UiProgress: how far work or a target has come, `value` of `max`. Take it when the share is known:
  an upload, a quota, a goal; for work of unknown length set `indeterminate`.

  Steps. With `step` it shows one segment per step, filled by whole steps reached; an empty segment
  is a step still to go.

  Color. `tone` colors the fill. `variant="thermometer"` colors it by how full it is, from danger to
  success, and `invert` flips that for "less is better".

  Unknown length. `indeterminate` is work of unknown length: a band runs along the track, with no
  number.

  Size. The host's classes set the size; without them the bar is 8px tall.

  Value. It is a progressbar with `aria-valuenow`, absent while the value is unknown. `valueText`
  gives words, and it is what says a value past `max` ("14 of 10, over"), since the number stops at
  `max`. Name each bar (`aria-label`); unnamed, it is "Progress".

  Marks. A mark already given is this bar with `:step="1"`; a mark to give is UiScaleInput.

  Placement. It sits in a table's progress column, as UiDropzone's upload bar, and in a card, under
  its figure or as its `#divider`.

  Keyboard. Not interactive: it takes no focus. A mark to give is UiScaleInput.

  Reader.
  - Name: a `progressbar` named by the `aria-label` the host gives it, else "Progress"; a host
    that names it with `aria-labelledby` gets no second name.
  - Value: `aria-valuenow` runs from `0` to `max`, and is absent while `indeterminate` or while
    the value is not a number.
  - Value text: `valueText` is read in place of the number and carries a value past `max`.
  - Hidden: the fill and the segments.

  States. Empty, part, full and past `max`, where the number stops at `max`. `step` segments, filled
  by whole steps reached, and a continuous bar again above `maxSegments` or with no step filled.
  `tone` on the fill. `thermometer` from danger through warning to success, `invert` reversed.
  `indeterminate`, a band running along the track, which keeps running, slower, under reduced
  motion. 8px tall without a height class, else the host's height. In forced colors the track is
  outlined and the fill takes the highlight.

  Not for.
  - A wait in place: UiSpinner.
  - Content on its way: UiSkeleton.
  - A number: UiCount.
  - A change: UiDelta.
  - A mark to give: UiScaleInput.
-->
<template>
  <div
    v-if="segments"
    class="ui-progress flex gap-0.5"
    :class="sized ? '' : 'h-2'"
    :style="fillVar"
    v-bind="a11y"
  >
    <div
      v-for="i in segments.count"
      :key="i"
      class="h-full flex-1 rounded-[calc(var(--radius-badge)*0.35)]"
      :class="i <= segments.filled ? fillClass : 'bg-border'"
      :data-filled="i <= segments.filled ? '' : undefined"
      aria-hidden="true"
    />
  </div>
  <div
    v-else
    class="ui-progress overflow-hidden rounded-pill bg-border"
    :class="sized ? '' : 'h-2'"
    :style="fillVar"
    v-bind="a11y"
  >
    <div
      v-if="indeterminate"
      class="ui-progress-run h-full w-2/5 rounded-pill"
      :class="fillClass"
      data-filled
      data-motion-keep
      aria-hidden="true"
    />
    <div
      v-else
      class="h-full rounded-pill transition-[width] duration-normal"
      :class="fillClass"
      :style="{ width: `${width}%` }"
      data-filled
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { BadgeTone } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { clamp01, isFiniteNumber } from '../utils/scale'
import { SCALE_RAMP_CLASS, scaleRamp } from '../utils/scaleRamp'
import { toneFillClass } from '../utils/tone'

const props = withDefaults(
  defineProps<{
    /** The current value, in the units of `max`. Not read while `indeterminate`. */
    value?: number
    /** The value at which the bar is full. */
    max?: number
    /** Work of unknown length: a band runs along the track, no value is said. */
    indeterminate?: boolean
    /** Size of one segment; turns the bar into segments, an empty one reads as one step still to go. */
    step?: number
    /** Above this many segments the bar is continuous again: a finger cannot tell them apart. */
    maxSegments?: number
    /** Color of the fill; `brand` by default. */
    tone?: BadgeTone
    /** `plain` fills with `tone`; `thermometer` colors the fill by how full it is, danger through warning to success (`utils/scaleRamp`). */
    variant?: 'plain' | 'thermometer'
    /** Reverses the thermometer: less is better (load, pain, cost). */
    invert?: boolean
    /** Words for the value instead of a number: "3 of 10 payments". Past `max` they carry the overage, the number stops at `max`. */
    valueText?: string
  }>(),
  {
    value: Number.NaN,
    max: 100,
    indeterminate: false,
    maxSegments: 24,
    tone: 'brand',
    variant: 'plain',
    invert: false,
  },
)

const { t } = useUiT()
const attrs = useAttrs()

// A NaN never reaches a width or an aria value: the browser drops the rule and the bar stays empty without a word.
const fraction = computed(() => (props.max > 0 ? clamp01(props.value / props.max) : 0))
const width = computed(() => fraction.value * 100)
// The host's own height wins; without one the bar is 8px, not a zero-tall progressbar.
const sized = computed(() => /(^|\s)(!?h-|size-)/.test(String(attrs.class ?? '')))
const valueNow = computed(() =>
  !props.indeterminate && props.max > 0 && isFiniteNumber(props.value)
    ? Math.min(Math.max(props.value, 0), props.max)
    : undefined,
)
// A host that names the bar with `aria-labelledby` gets no second name from us.
const a11y = computed(() => ({
  role: 'progressbar',
  'aria-label':
    attrs['aria-labelledby'] || attrs['aria-label'] ? undefined : t('grani.progress.label'),
  'aria-valuemin': 0,
  'aria-valuemax': props.max > 0 && !props.indeterminate ? props.max : undefined,
  'aria-valuenow': valueNow.value,
  'aria-valuetext': props.valueText,
}))

const ramp = computed(() =>
  props.variant === 'thermometer' && !props.indeterminate
    ? scaleRamp(props.invert ? 1 - fraction.value : fraction.value)
    : null,
)
const fillClass = computed(() =>
  ramp.value ? SCALE_RAMP_CLASS[ramp.value.half] : toneFillClass(props.tone),
)
const fillVar = computed(() => (ramp.value ? { '--ui-scale-mix': ramp.value.mix } : undefined))

// Segments only when there are a sane few and at least one is filled: all empty reads as broken.
// A segment fills when its step is reached, not half of it; a float step adds no stray one.
const EPS = 1e-9
const segments = computed(() => {
  if (props.indeterminate || !props.step || props.step <= 0 || props.max <= 0) return null
  const count = Math.ceil(props.max / props.step - EPS)
  const raw = props.value >= props.max ? count : Math.floor(props.value / props.step + EPS)
  const filled = isFiniteNumber(raw) ? Math.max(0, Math.min(count, raw)) : 0
  return count >= 2 && count <= props.maxSegments && filled >= 1 ? { count, filled } : null
})
</script>
