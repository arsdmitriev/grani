<!--
  UiTimePicker: a form field for a time of day, in the input capsule on the control ladder. Take
  it beside a UiDatePicker or a UiCalendar for a day and its hours.

  Value. The value is `HH:mm` (`10:30`); one with seconds (`14:30:00`) is read to the minute, and a
  change sends `HH:mm`. It is shown as the app's language writes a time: `14:30` in
  Russian, `2:30 PM` in American English.

  Panel. The button opens a UiPopover with two listboxes side by side, Hour and Minute (a third,
  Period, in a 12-hour locale); each shows five rows and a half and scrolls the rest
  (`useVisibleRows`), scrolled on open to the chosen row. A press on an hour sets the value at
  once, the current minute clamped to the nearest one the window still allows (the first allowed
  minute with no value yet), keeps the panel open and moves the focus to Minute; a press on a
  minute sets it and closes the panel, the focus back on the field. A press on a period keeps the
  hour's number and flips its half of the day, and stays open.

  Typing. Digits build a time without the search row UiSelect has: one or two are the hour (`9`
  lights 9, `14` lights 14), three are `H:mm` (`930`, `230`) while the minute fits (`183` stays
  18:3_), four `HH:mm` (`0930`, `1437`). A
  mark after the hour (`9:30`, `9.30`, `9 30`) ends the hour where it is, and a lone digit after
  it is the minute's tens. Digits of other scripts count as theirs. The hour reads on the 24-hour
  clock unless `a` or `p` sets its half of the day, and a 12-hour field says the half it reads as
  it is typed (`2:30 AM`); `a` or `p` with nothing typed moves the time held to that half. A time
  that does not exist (`9:75`, `2400`) is no time, never one nearby. The field shows what was
  typed until Enter takes it to the minute, off the step too, and closes; a time that is not one,
  or one outside the window, is not taken: the field is marked invalid until the text changes,
  and a reader hears why. A press away takes it too when it is written in full: the hour and two
  digits of the minute, and in a 12-hour language its half of the day or an hour past 12 (where
  the half cannot be typed as `a` or `p`, Korean or Arabic, the minute is enough); anything else
  is dropped there, and a reader hears why. While it is typed the columns show it chosen, the
  minute once both of its digits are in, off the step too. Backspace takes back the last key, the
  half of the day too; Escape, the cross, a press on a row and an arrow drop it and give the time
  held back. Typing opens the panel from
  the closed field too, and the keys typed while it opens go on with the time, so the pointer
  picks on the step and the keys reach any minute.

  Hours. The app's language decides: a 24-hour one draws 00…23 in two columns and writes
  `14:30`; a 12-hour one draws 12, 1…11 and a Period column of the language's AM/PM words and
  writes `2:30 PM`. `hourCycle` sets it for every language.

  Window. `min` and `max` are `HH:mm`. `min` after `max` is read as a window that wraps past
  midnight (a night shift, 22:00–06:00), not an empty one. An hour with no allowed minute in the
  window, and a minute outside it, are shown but disabled; a value outside the window is kept and
  reads invalid.

  Step. Minutes in a column are multiples of `step` (1..60, a bad step falls back to 1); the
  default is 5. A value off the step is kept and listed in its own place.

  Empty. No time is `null`: the cross sends `null`, and `null` or an empty string reads as none.
  With `name` a form gets the field's name with an empty value, as a native time input sends it.

  Odd values. `9:30` is read as `09:30`. A value that is not a time (`25:99`) counts as none.

  Width. The field keeps its width when a time is picked or cleared; cut in a narrow column, the
  whole time shows in a tooltip on hover. A required field shows no cross.

  Field. Inside UiField it reads id, error and required. `focus()` puts the focus on it.

  Keyboard.
  - `Tab`: reaches the combobox.
  - `ArrowDown` `Alt+ArrowDown` `Enter` `Space`: open the panel, on the closed field.
  - `0–9`: a digit opens the panel and starts the typed time; a mark after the hour (`:` `.` `-`
    `,` or a space) ends it; in a 12-hour language `a`/`p` set its half of the day.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's, on the field and in the panel; only
    `Alt+ArrowDown` on the closed field is its own.
  In the open panel:
  - `ArrowUp` `ArrowDown`: move within a column, over the enabled rows; `Home`/`End` to its ends.
  - `ArrowLeft` `ArrowRight`: move to the next or the previous column.
  - `Enter` `Space`: picks the row, as a press does; on Minute (or Period with no Minute column
    left to fill) it closes the panel too. With a time typed, Enter takes it and Space is a mark.
  - `Backspace`: takes back the last typed key.
  - `Escape`: closes the panel; inside a window it closes only the panel.
  - `Tab`: moves to the next column and goes round inside, as in UiDatePicker's calendar;
    `Escape` leaves.
  The cross clears the value and keeps the focus on the field.

  Reader.
  - Field: a combobox named by `ariaLabel` or the field's label and says the time as the locale
    prints it, or the placeholder.
  - Panel: Hour, Minute and, in a 12-hour locale, Period are listboxes named in words, the chosen
    row marked, the focus moving with the rows (roving, not `aria-activedescendant`: three
    listboxes side by side read better as one tab stop each).
  - Icon: the clock icon is hidden from a screen reader.
  - Errors: a time outside `min` and `max`, a typed time refused, or a field error, sets
    `aria-invalid`; `required` sets `aria-required`; the field's description and error are read
    with it once.
  - Typed time: a time not taken is said in words, "Not a time", "Time outside the allowed range"
    or "Time not kept: type it in full".

  States. Empty, a time picked, open with the chosen hour and minute (and period) highlighted, a
  time off the step (listed in its place), a time outside the window (kept, reads invalid), a
  value that is not a time (shown as empty, nothing sent), disabled (nothing sent, the panel
  closes), invalid, required (no cross), `clearable` with the cross, and joined in a
  UiButtonGroup. The width holds in all of them.

  Not for.
  - A day: UiDatePicker.
  - A duration in minutes: UiInput `numeric`.
  - Any other pick from a list: UiSelect itself.
-->
<template>
  <div
    ref="capsuleRef"
    tabindex="-1"
    :class="[capsule, rootClass]"
    :style="rootStyle"
    :data-invalid="isInvalid || undefined"
  >
    <UiPopover v-model:open="open" :anchor="capsuleRef" :labelledby="field?.labelId.value">
      <template #trigger>
        <button
          v-bind="control"
          :id="buttonId"
          type="button"
          role="combobox"
          :disabled="disabled"
          :aria-expanded="open"
          aria-haspopup="dialog"
          :aria-label="ariaLabel"
          :aria-invalid="aria['aria-invalid']"
          :aria-describedby="aria['aria-describedby']"
          :aria-required="aria['aria-required']"
          class="flex h-full min-w-0 flex-1 items-center gap-2 bg-transparent text-left focus:outline-hidden disabled:cursor-not-allowed"
          @keydown="onFieldKey"
        >
          <Clock
            aria-hidden="true"
            class="h-4 w-4 shrink-0"
            :class="disabled ? 'text-disabled-fg' : 'text-fg-muted'"
          />
          <!-- The text stands over the widest time the locale prints: a pick never widens the field. -->
          <span
            class="grid min-w-0 flex-1 [&>*]:col-start-1 [&>*]:row-start-1 [&>*]:truncate"
            :class="
              disabled ? 'text-disabled-fg' : typedShown || shown ? 'text-fg' : 'text-placeholder'
            "
          >
            <!-- Cut in a narrow column, the whole time shows in a tooltip. -->
            <UiTruncate
              :text="typedShown || shown || placeholder || t('grani.timePicker.placeholder')"
              :class="typedShown ? 'tabular-nums' : ''"
              :data-typed="typedShown || undefined"
            />
            <span v-for="w in sizers" :key="w" data-sizer aria-hidden="true" class="invisible">{{
              w
            }}</span>
          </span>
        </button>
      </template>
      <template #default="{ close }">
        <!-- The columns run edge to edge, as every list in a panel does: the band of a row spans its
             whole column, from the panel's edge or the line to the next line. -->
        <div
          data-list-top
          data-list-bottom
          class="flex items-stretch"
          :class="BLEED.overlay"
          :style="{ minWidth: minPanelWidth }"
        >
          <div
            v-for="col in columns"
            :key="col.kind"
            class="flex min-w-max flex-1 flex-col"
            :class="col.kind !== 'hour' ? 'border-s border-border' : ''"
          >
            <ul
              :ref="(el) => setListRef(col.kind, el as HTMLElement | null)"
              role="listbox"
              :data-column="col.kind"
              :aria-label="t(col.labelKey)"
              class="ui-scroll-hidden overflow-y-auto"
              :class="PANEL_LIST_HEIGHT"
              :style="{ maxHeight: visibleHeight[col.kind].value }"
            >
              <PanelRow
                v-for="(row, i) in col.rows"
                :key="row.value"
                :ref="
                  (el) =>
                    setRowRef(col.kind, i, el as HTMLElement | InstanceType<typeof PanelRow> | null)
                "
                purpose="option"
                role="option"
                :label="row.label"
                :mark="row.selected"
                :active="focusedColumn === col.kind && row.i === columnActive[col.kind]"
                :disabled="row.disabled"
                :tabindex="row.i === columnActive[col.kind] ? 0 : -1"
                :data-autofocus="(col.kind === 'hour' && row.i === columnActive.hour) || undefined"
                :aria-selected="row.selected"
                :aria-disabled="row.disabled || undefined"
                :class="rowSizeClass"
                @pointermove="row.disabled || (columnActive[col.kind] = row.i)"
                @focus="onRowFocus(col.kind, row.i)"
                @click="choose(col.kind, row, close)"
                @keydown="(e: KeyboardEvent) => onRowKey(e, col.kind, row, close)"
              />
            </ul>
          </div>
        </div>
      </template>
    </UiPopover>
    <UiIconButton
      v-if="clearable && time && !disabled && !isRequired"
      variant="ghost"
      size="xs"
      :icon="X"
      :ariaLabel="t('grani.timePicker.clear')"
      :class="capsuleEndButtonClass(ladder)"
      @mousedown.prevent
      @click="clear"
    />
    <!-- The cross's place is kept while there is no time and while disabled: the width never moves. -->
    <span
      v-else-if="clearable && !isRequired"
      data-sizer
      aria-hidden="true"
      class="-me-1.5 shrink-0"
      :class="ladder === 'xs' ? 'h-6 w-6' : 'h-7 w-7'"
    />
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="time"
      :disabled="disabled"
      :form="formId"
    />
  </div>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { computed, nextTick, onBeforeUnmount, reactive, ref, useId, watch } from 'vue'
import { Clock, X } from '@lucide/vue'
import type { ControlSize } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { announce } from '../utils/announce'
import { latinDigits, splitTypedTime, twelveHours, typedTimeOf } from '../utils/calendar'
import { useSplitAttrs } from '../utils/attrs'
import { capsuleEndButtonClass, triggerCapsuleClass } from '../utils/controlChrome'
import { PANEL_LIST_HEIGHT, usePanelList } from '../utils/panelList'
import { useVisibleRows } from '../composables/useVisibleRows'
import { useFieldControl } from '../utils/field'
import type { GraniMessageKey } from '../i18n/en'
import PanelRow from './PanelRow.vue'
import UiIconButton from './UiIconButton.vue'
import UiPopover from './UiPopover.vue'
import UiTruncate from './UiTruncate.vue'
import { BLEED } from '../utils/surface'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The time, `HH:mm` (`v-model`); `null` for none. */
    modelValue?: string | null
    /** Minutes between two rows of the Minute column. */
    step?: number
    /** The first time the window allows, `HH:mm`. */
    min?: string
    /** The last time the window allows, `HH:mm`; a `min` after it wraps the window past midnight. */
    max?: string
    /** A cross that empties the field. */
    clearable?: boolean
    /** Shown while empty; defaults to "Pick a time". */
    placeholder?: string
    /** The field cannot be changed. */
    disabled?: boolean
    /** Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so. */
    required?: boolean
    /** Standalone only: the value is wrong. Inside UiField the field's error says so. */
    invalid?: boolean
    /** Sends the time with a form, under this name. */
    name?: string
    /** Id of the trigger, standalone; inside UiField the field's id wins. */
    id?: string
    /** Standalone only: the accessible name. Inside UiField the label names it. */
    ariaLabel?: string
    /** 12 hours with an AM/PM column, or 24; unset, the app's language decides (`2:30 PM` in American English, `14:30` in Russian). The field writes the time the same way. */
    hourCycle?: 12 | 24
    /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  {
    modelValue: null,
    step: 5,
    min: '00:00',
    max: '23:59',
    clearable: false,
    required: false,
    placeholder: '',
    disabled: false,
    invalid: false,
    name: undefined,
    id: undefined,
    ariaLabel: undefined,
    hourCycle: undefined,
  },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** A time was picked (`HH:mm`), or `null` when cleared. */
  'update:modelValue': [value: string | null]
}>()

const { t, locale } = useUiT()

// Seconds, as an API writes a time (`14:30:00`), are read to the minute the field shows.
const toMinutes = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})(?::[0-5]\d(?:\.\d+)?)?$/.exec(hhmm)
  if (!m) return null
  const [h, min] = [Number(m[1]), Number(m[2])]
  return h < 24 && min < 60 ? h * 60 + min : null
}
const toHhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// A value that is no time shows empty and sends an empty value, as UiDatePicker does with a day.
const time = computed(() => {
  const m = toMinutes(props.modelValue ?? '')
  return m === null ? '' : toHhmm(m)
})
const timeMinutes = computed(() => toMinutes(time.value))

// `min` after `max` wraps the window past midnight (a night shift) instead of reading as empty.
const lo = computed(() => toMinutes(props.min) ?? 0)
const hi = computed(() => toMinutes(props.max) ?? 24 * 60 - 1)
const wraps = computed(() => lo.value > hi.value)
const inWindow = (m: number) =>
  wraps.value ? m >= lo.value || m <= hi.value : m >= lo.value && m <= hi.value
const outside = computed(() => timeMinutes.value !== null && !inWindow(timeMinutes.value))

if (isDev())
  watch(
    () => [props.modelValue, props.min, props.max] as const,
    ([v, min, max]) => {
      if (v && toMinutes(v) === null)
        console.warn('[grani] UiTimePicker: the value is not a time (HH:mm); it shows as empty.')
      for (const [key, b] of [
        ['min', min],
        ['max', max],
      ] as const)
        if (toMinutes(b) === null)
          console.warn(`[grani] UiTimePicker: ${key} is not a time (HH:mm).`)
    },
    { immediate: true },
  )

// The language's way of writing a time, unless the app sets one for all of them.
const is12 = computed(() => (props.hourCycle ? props.hourCycle === 12 : twelveHours(locale.value)))

const stepMinutes = computed(() => {
  const s = Math.round(props.step)
  return s >= 1 && s <= 60 ? s : 1
})

// Every minute the window and the step allow for one hour, plus a value off the step kept in place.
const minuteCandidates = (hour24: number): number[] => {
  const set = new Set<number>()
  for (let m = 0; m < 60; m += stepMinutes.value) if (inWindow(hour24 * 60 + m)) set.add(m)
  if (timeMinutes.value !== null && Math.floor(timeMinutes.value / 60) === hour24) {
    const m = timeMinutes.value % 60
    if (inWindow(hour24 * 60 + m)) set.add(m)
  }
  // A typed minute off the step stands in its place too, as one held does.
  const typed = typedMark.value
  if (typed?.minute != null && typed.hour24 === hour24 && inWindow(hour24 * 60 + typed.minute))
    set.add(typed.minute)
  return [...set].sort((a, b) => a - b)
}
const hourHasMinute = (hour24: number) => minuteCandidates(hour24).length > 0

// The number alone, in the locale's digits: `Intl.DateTimeFormat` with only `hour` always adds
// the half of the day in a 12-hour locale, which the Period column already says.
const numberFormat = computed(() => new Intl.NumberFormat(locale.value))
const periodFormat = computed(
  () => new Intl.DateTimeFormat(locale.value, { hour: 'numeric', hour12: true, timeZone: 'UTC' }),
)
const hourLabel = (hour24: number) => {
  if (!is12.value) return numberFormat.value.format(hour24).padStart(2, '0')
  const h12 = hour24 % 12 || 12
  return numberFormat.value.format(h12)
}
const periodOf = (hour24: number) =>
  periodFormat.value
    .formatToParts(new Date(Date.UTC(2026, 0, 1, hour24)))
    .find((p) => p.type === 'dayPeriod')?.value ?? (hour24 < 12 ? 'AM' : 'PM')
const periodWord = computed(() => ({ am: periodOf(0), pm: periodOf(12) }))

// The hour held, read as a 24-hour value.
const currentHour24 = computed(() =>
  timeMinutes.value === null ? null : Math.floor(timeMinutes.value / 60),
)
// While a time is typed the columns show it chosen, as the field does, the minute once both of its
// digits are in; else they show the time held.
const typedMark = ref<{ hour24: number; minute: number | null } | null>(null)
const markHour24 = computed(() => (typedMark.value ? typedMark.value.hour24 : currentHour24.value))
const markPeriod = computed(() => (markHour24.value === null ? null : periodOf(markHour24.value)))
const markMinute = computed(() =>
  typedMark.value
    ? typedMark.value.minute
    : timeMinutes.value === null
      ? null
      : timeMinutes.value % 60,
)

type ColumnKind = 'hour' | 'minute' | 'period'
interface Row {
  i: number
  value: string
  label: string
  disabled: boolean
  selected: boolean
  hour24: number
  minute?: number
  period?: string
}
interface Column {
  kind: ColumnKind
  labelKey: GraniMessageKey
  rows: Row[]
}

// 24-hour locales: two columns, 00..23 and the minute. 12-hour ones: 12, 1..11, their minute and
// a third column for the half of the day, since the hour row alone never says which.
const hourRows = computed<Row[]>(() => {
  if (!is12.value)
    return Array.from({ length: 24 }, (_, h) => ({
      i: h,
      value: String(h),
      label: hourLabel(h),
      disabled: !hourHasMinute(h),
      selected: markHour24.value === h,
      hour24: h,
    }))
  const display = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)]
  const period = markPeriod.value ?? periodWord.value.am
  return display.map((h12, i) => {
    const am = h12 === 12 ? 0 : h12
    const pm = h12 === 12 ? 12 : h12 + 12
    const here = period === periodWord.value.pm ? pm : am
    const there = here === pm ? am : pm
    // The hour of the shown half when the window allows it, else the same hour in the other half:
    // a night shift's 3 is open while 11 PM is shown, and its press takes 3 AM.
    const hour24 = hourHasMinute(here) ? here : there
    return {
      i,
      value: String(h12),
      label: hourLabel(hour24),
      disabled: !hourHasMinute(am) && !hourHasMinute(pm),
      selected: markHour24.value !== null && markHour24.value % 12 === h12 % 12,
      hour24,
    }
  })
})

const minuteRows = computed<Row[]>(() => {
  const h = markHour24.value ?? hourRows.value.find((r) => !r.disabled)?.hour24 ?? 0
  return minuteCandidates(h).map((m, i) => ({
    i,
    value: String(m),
    label: String(m).padStart(2, '0'),
    disabled: false,
    selected: markHour24.value === h && markMinute.value === m,
    hour24: h,
    minute: m,
  }))
})

const periodRows = computed<Row[]>(() => {
  if (!is12.value) return []
  // A half of the day with no hour the window allows cannot be picked.
  const open = (p: 'am' | 'pm') =>
    Array.from({ length: 12 }, (_, h) => (p === 'am' ? h : h + 12)).some(hourHasMinute)
  return (['am', 'pm'] as const).map((p, i) => ({
    i,
    value: p,
    label: periodWord.value[p],
    disabled: !open(p),
    selected: markPeriod.value === periodWord.value[p],
    hour24: 0,
    period: p,
  }))
})

const columns = computed<Column[]>(() => {
  const cols: Column[] = [
    { kind: 'hour', labelKey: 'grani.timePicker.hour', rows: hourRows.value },
    { kind: 'minute', labelKey: 'grani.timePicker.minute', rows: minuteRows.value },
  ]
  if (is12.value)
    cols.push({ kind: 'period', labelKey: 'grani.timePicker.period', rows: periodRows.value })
  return cols
})

// A typed time Enter refused stays in the field, marked invalid until it changes.
const refused = ref(false)
const generated = `ui-time-${useId()}`
const {
  field,
  id: buttonId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(() => ({
  id: props.id ?? generated,
  invalid: props.invalid || outside.value || refused.value,
  required: props.required,
}))
const { rootClass, rootStyle, control } = useSplitAttrs()
// The form its `form` attribute names gets the hidden inputs too, as a native control's value.
const formId = computed(() => control.value.form as string | undefined)
const capsule = computed(() => triggerCapsuleClass(ladder.value, props.disabled, isInvalid.value))
const capsuleRef = ref<HTMLElement | null>(null)

const shown = computed(() => {
  const m = timeMinutes.value
  if (m === null) return ''
  const f = new Intl.DateTimeFormat(locale.value, {
    hour: is12.value ? 'numeric' : '2-digit',
    minute: '2-digit',
    hourCycle: is12.value ? 'h12' : 'h23',
    timeZone: 'UTC',
  })
  return f.format(new Date(Date.UTC(2026, 0, 1, 0, m)))
})
// What the field can say, measured once: every hour's label, so the widest never widens it later.
const sizers = computed(() => {
  const f = new Intl.DateTimeFormat(locale.value, {
    hour: is12.value ? 'numeric' : '2-digit',
    minute: '2-digit',
    hourCycle: is12.value ? 'h12' : 'h23',
    timeZone: 'UTC',
  })
  return [
    ...new Set([
      ...Array.from({ length: 24 }, (_, h) => f.format(new Date(Date.UTC(2026, 0, 1, h, 59)))),
      props.placeholder || t('grani.timePicker.placeholder'),
    ]),
  ]
})

// Rows on the control ladder: 44px when `size="md"`, else the panel-list row.
const rowSizeClass = computed(() => (ladder.value === 'md' ? 'h-11' : ''))

// The picker owns the panel: a field turned disabled closes it, the focus held on the capsule.
const open = ref(false)
// The panel is at least as wide as the field it opens from, measured as it opens.
const fieldWidth = ref(0)
watch(open, (o) => {
  if (o) fieldWidth.value = capsuleRef.value?.offsetWidth ?? 0
})
const minPanelWidth = computed(() => (fieldWidth.value ? `${fieldWidth.value}px` : undefined))
watch(
  () => props.disabled,
  (d) => {
    if (!d) return
    const held = open.value || capsuleRef.value?.contains(document.activeElement)
    open.value = false
    if (held) nextTick(() => capsuleRef.value?.focus())
  },
)

function onFieldKey(e: KeyboardEvent) {
  if (props.disabled) return
  // A chord is the browser's: Alt or ⌘ with an arrow goes back a page, Ctrl moves the caret. Alt
  // with ArrowDown is the field's own: it opens the list, as in a select.
  if (e.ctrlKey || e.metaKey || (e.altKey && e.key !== 'ArrowDown')) return
  // The panel is open but its first focus not given yet (a few frames, longer on a slow machine):
  // the keys typed meanwhile go on with the time, not lost on the field.
  if (open.value) {
    typeKey(e, () => (open.value = false))
    return
  }
  const key = latinDigits(e.key)
  if (key === 'ArrowDown' || /^[0-9]$/.test(key) || (is12.value && /^[ap]$/i.test(key))) {
    if (key === 'ArrowDown') e.preventDefault()
    open.value = true
    if (/^[0-9]$/.test(key)) typeDigit(key)
    else if (is12.value && /^[ap]$/i.test(key)) typePeriod(key)
  }
}

const clear = () => {
  // A time half typed goes with it: the close below must not take it back.
  resetTyped()
  emit('update:modelValue', null)
  const wasOpen = open.value
  open.value = false
  const focus = () => document.getElementById(buttonId.value ?? generated)?.focus()
  if (wasOpen) nextTick(focus)
  else focus()
}

// Nearest allowed minute to `target` among a hour's candidates: the window may skip the exact one.
const nearest = (candidates: number[], target: number) =>
  candidates.reduce(
    (best, m) => (Math.abs(m - target) < Math.abs(best - target) ? m : best),
    candidates[0]!,
  )

function emitTime(hour24: number, minute: number) {
  emit('update:modelValue', toHhmm(hour24 * 60 + minute))
}

function pickHour(hour24: number) {
  const candidates = minuteCandidates(hour24)
  if (!candidates.length) return
  const curMinute = timeMinutes.value === null ? null : timeMinutes.value % 60
  const minute = curMinute === null ? candidates[0]! : nearest(candidates, curMinute)
  emitTime(hour24, minute)
  focusedColumn.value = 'minute'
  nextTick(() => focusActive('minute'))
}

function pickMinute(hour24: number, minute: number, close: () => void) {
  emitTime(hour24, minute)
  close()
}

/** Moves the time to a half of the day; false when the window has no minute of that hour there. */
function pickPeriod(period: 'am' | 'pm') {
  const h12 = currentHour24.value === null ? 12 : currentHour24.value % 12 || 12
  const hour24 = period === 'pm' ? (h12 === 12 ? 12 : h12 + 12) : h12 === 12 ? 0 : h12
  const candidates = minuteCandidates(hour24)
  if (!candidates.length) return false
  const curMinute = timeMinutes.value === null ? null : timeMinutes.value % 60
  const minute = curMinute === null ? candidates[0]! : nearest(candidates, curMinute)
  emitTime(hour24, minute)
  return true
}

function choose(kind: ColumnKind, row: Row, close: () => void) {
  if (row.disabled) return
  // A press on a row ends the typing: the row's time wins.
  resetTyped()
  if (kind === 'hour') pickHour(row.hour24)
  else if (kind === 'minute') pickMinute(row.hour24, row.minute!, close)
  else if (kind === 'period') pickPeriod(row.period as 'am' | 'pm')
}

// A close takes a time typed in full, as a text field keeps what was typed when the focus leaves
// it; a shorter text, one that is no time, or one outside the window is dropped and said. Escape
// and a field turned disabled drop it.
let dropping = false
watch(open, (o) => {
  if (o) return
  if (typedBuffer && !dropping && !props.disabled) {
    const t2 = typedValue()
    if (t2 && typedInFull() && inWindow(t2.hour24 * 60 + t2.minute)) emitTime(t2.hour24, t2.minute)
    else announce(t(refusal(t2, typedInFull())))
  }
  resetTyped()
  dropping = false
})
// Escape drops the typing wherever the focus is while the panel is open, before the panel's own
// Escape closes it.
const onEscape = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !typedBuffer) return
  dropping = true
  setTimeout(() => (dropping = false))
}
watch(open, (o) =>
  o
    ? window.addEventListener('keydown', onEscape, true)
    : window.removeEventListener('keydown', onEscape, true),
)
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape, true))

// The focus moves from row to row inside a column and from column to column; each column walks its
// rows as every list in a panel does (`usePanelList`), and the band follows the focus.
const focusedColumn = ref<ColumnKind>('hour')
const listRefs: Record<ColumnKind, HTMLElement | null> = { hour: null, minute: null, period: null }
const rowRefs: Record<ColumnKind, (HTMLElement | null)[]> = { hour: [], minute: [], period: [] }
const hourListRef = ref<HTMLElement | null>(null)
function setListRef(kind: ColumnKind, el: HTMLElement | null) {
  listRefs[kind] = el
  if (kind === 'hour') hourListRef.value = el
}
function setRowRef(
  kind: ColumnKind,
  i: number,
  el: HTMLElement | InstanceType<typeof PanelRow> | null,
) {
  rowRefs[kind][i] = (el as unknown as { $el?: HTMLElement })?.$el ?? (el as HTMLElement | null)
}
const rowsOf = (kind: ColumnKind) =>
  kind === 'hour' ? hourRows.value : kind === 'minute' ? minuteRows.value : periodRows.value
const columnList = (kind: ColumnKind) =>
  usePanelList({
    items: () => rowsOf(kind),
    disabled: (r) => r.disabled,
    row: (i) => rowRefs[kind][i],
    list: () => listRefs[kind],
    focus: true,
  })
const lists = {
  hour: columnList('hour'),
  minute: columnList('minute'),
  period: columnList('period'),
}
// The row each column stands on: its tab stop, the band, and where its arrows go on from.
const columnActive = reactive({
  hour: lists.hour.active,
  minute: lists.minute.active,
  period: lists.period.active,
})
// The row a column starts on: the chosen one, else the first that can be picked.
function startRow(kind: ColumnKind) {
  const rows = rowsOf(kind)
  const idx = rows.findIndex((r) => r.selected && !r.disabled)
  return idx >= 0 ? idx : rows.findIndex((r) => !r.disabled)
}
// On open, and when the focus crosses to a column, its row stands in the middle of the column,
// the rows before it in view too; the arrows then keep the row they reach in view.
function reveal(kind: ColumnKind, at: number) {
  const list = listRefs[kind]
  const row = rowRefs[kind][at]
  if (!list || !row) return
  const top = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2
  list.scrollTop = Math.max(0, top)
}
function focusActive(kind: ColumnKind) {
  const at = startRow(kind)
  if (at < 0) return
  columnActive[kind] = at
  focusedColumn.value = kind
  rowRefs[kind][at]?.focus({ preventScroll: true })
  reveal(kind, at)
}
// Before the panel draws, every column stands on its chosen row: the popover's first focus lands
// on the chosen hour (marked to take it), or on the hour a digit typed on the closed field reads,
// and Tab walks the columns from row to row.
watch(open, (o) => {
  if (!o) return
  focusedColumn.value = 'hour'
  for (const kind of COLUMN_ORDER) columnActive[kind] = Math.max(0, startRow(kind))
  const typed = typedHourRow()
  if (typed >= 0) columnActive.hour = typed
  // Once the panel is placed, each column shows its chosen row.
  nextTick(() =>
    requestAnimationFrame(() => {
      for (const kind of COLUMN_ORDER) reveal(kind, columnActive[kind])
    }),
  )
})

const COLUMN_ORDER: ColumnKind[] = ['hour', 'minute', 'period']
// Wherever the focus lands (an arrow, Tab, a press), the band goes with it.
function onRowFocus(kind: ColumnKind, i: number) {
  focusedColumn.value = kind
  columnActive[kind] = i
}
function moveColumn(step: 1 | -1) {
  const order = COLUMN_ORDER.filter((k) => columns.value.some((c) => c.kind === k))
  const at = order.indexOf(focusedColumn.value)
  const next = order[(((at + step) % order.length) + order.length) % order.length]
  if (next) focusActive(next)
}

function onRowKey(e: KeyboardEvent, kind: ColumnKind, row: Row, close: () => void) {
  // A chord is the browser's: Alt or ⌘ with an arrow goes back a page, Ctrl moves the caret.
  if (e.altKey || e.ctrlKey || e.metaKey) return
  // An arrow moves to the rows: the typing is dropped, and Enter picks the row the arrow reached.
  if (/^(Arrow(Up|Down|Left|Right)|Home|End)$/.test(e.key)) resetTyped()
  if (lists[kind].keys(e)) return
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    moveColumn(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    moveColumn(-1)
  } else if (typeKey(e, close)) return
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    // A held key picks once: the hour moves the focus to the minutes, where a repeat would pick
    // the minute under it and close the panel.
    if (!e.repeat) choose(kind, row, close)
  }
}
/** The keys that type a time, on the field or in a column; says whether it took this one. */
function typeKey(e: KeyboardEvent, close: () => void): boolean {
  if (e.altKey || e.ctrlKey || e.metaKey) return false
  const key = latinDigits(e.key)
  if (typedBuffer && e.key === 'Enter') commitTyped(close)
  // With a time typed, a space is a mark, as a dot or a colon: it ends the hour, picks no row.
  else if (typedBuffer && /^[:./\-, ]$/.test(key)) typeMark()
  else if (/^[0-9]$/.test(key)) typeDigit(key)
  else if ((typedBuffer || typedPeriodOverride) && e.key === 'Backspace') takeBack()
  else if (is12.value && /^[ap]$/i.test(key)) typePeriod(key)
  else return false
  e.preventDefault()
  return true
}

// The typed time: its digits, `:` where a mark ended the hour, and the half of the day typed.
let typedBuffer = ''
let typedPeriodOverride: 'am' | 'pm' | null = null
// The last key typed was the half of the day: Backspace takes it back first.
let periodLast = false
// What the field shows while keys come: the time they make so far, `14:3_`, and in a 12-hour
// language the half of the day it will be read in, `2:30 AM`, so the person sees what Enter takes.
const typedShown = ref('')
// The half of the day can be typed where its words start with a and p; elsewhere (Korean, Arabic)
// a time written to the minute is in full without it.
const periodTypable = computed(
  () =>
    periodWord.value.am.toLowerCase().startsWith('a') &&
    periodWord.value.pm.toLowerCase().startsWith('p'),
)
// The text last shown: a key the field ignores (a fifth digit) changes nothing, so a refusal stays.
let shownKey = ''
function showTyped() {
  const key = `${typedBuffer}|${typedPeriodOverride ?? ''}`
  if (key !== shownKey) refused.value = false
  shownKey = key
  const parts = splitTypedTime(typedBuffer)
  const t2 = typedValue()
  typedMark.value =
    parts && parts.hour <= 23
      ? {
          hour24: t2?.hour24 ?? parts.hour,
          minute: t2 && parts.minute.length === 2 ? t2.minute : null,
        }
      : null
  if (!parts) {
    typedShown.value = typedPeriodOverride ? periodWord.value[typedPeriodOverride] : ''
    return
  }
  const minute = parts.minute.padEnd(2, '_')
  // A 12-hour field says the half of the day it reads, for a lone digit of the hour too.
  const halfWord = (hour: number) =>
    is12.value
      ? ` ${periodWord.value[typedPeriodOverride ?? (hour >= 12 && hour <= 23 ? 'pm' : 'am')]}`
      : ''
  if (parts.open) {
    typedShown.value = `${parts.hour}_:${minute}${halfWord(parts.hour)}`
    return
  }
  if (!is12.value) {
    typedShown.value = `${String(parts.hour).padStart(2, '0')}:${minute}`
    return
  }
  const half = typedPeriodOverride ?? (parts.hour >= 12 && parts.hour <= 23 ? 'pm' : 'am')
  const readable = parts.hour <= 23 && !(typedPeriodOverride && parts.hour > 12)
  const hour = readable ? parts.hour % 12 || 12 : parts.hour
  typedShown.value = `${hour}:${minute} ${periodWord.value[half]}`
}
function resetTyped() {
  typedBuffer = ''
  typedPeriodOverride = null
  periodLast = false
  shownKey = ''
  typedShown.value = ''
  typedMark.value = null
  refused.value = false
}
const typedValue = () => typedTimeOf(splitTypedTime(typedBuffer), typedPeriodOverride)
// Why a typed time is not taken, in the words a reader hears.
const refusal = (t2: { hour24: number; minute: number } | null, full: boolean): GraniMessageKey =>
  !t2
    ? 'grani.timePicker.notATime'
    : !inWindow(t2.hour24 * 60 + t2.minute)
      ? 'grani.timePicker.outsideWindow'
      : full
        ? 'grani.timePicker.notATime'
        : 'grani.timePicker.notInFull'
// The row of the hour the typed time reads; -1 while it reads none. On a 12-hour column the typed
// 14 is the row that reads 2.
function typedHourRow() {
  const parts = splitTypedTime(typedBuffer)
  if (!parts || parts.hour > 23) return -1
  const hour24 = typedValue()?.hour24 ?? parts.hour
  return hourRows.value.findIndex((r) =>
    is12.value ? Number(r.value) % 12 === hour24 % 12 : r.hour24 === hour24,
  )
}
function highlightTyped() {
  const i = typedHourRow()
  if (i < 0) return
  focusedColumn.value = 'hour'
  columnActive.hour = i
  nextTick(() => lists.hour.move(i))
}
function typeDigit(d: string) {
  // After a mark the minute takes two digits; without one, four digits make a time.
  const mark = typedBuffer.indexOf(':')
  if (mark >= 0 ? typedBuffer.length - mark - 1 < 2 : typedBuffer.length < 4) typedBuffer += d
  periodLast = false
  showTyped()
  highlightTyped()
}
/** A mark ends the hour where it is: `9:` is nine, not the start of 9x. Once, and only before the minute. */
function typeMark() {
  const parts = splitTypedTime(typedBuffer)
  if (!parts || parts.minute || typedBuffer.includes(':')) return
  typedBuffer += ':'
  periodLast = false
  showTyped()
}
/** Backspace takes back the last key: the half of the day when it came last, else a digit or the mark. */
function takeBack() {
  if (periodLast) {
    typedPeriodOverride = null
    periodLast = false
  } else typedBuffer = typedBuffer.slice(0, -1)
  if (!typedBuffer) typedPeriodOverride = null
  showTyped()
  // Taken back to nothing: the focus goes back to the chosen hour, where Enter keeps the time.
  if (!typedBuffer) focusActive('hour')
  else highlightTyped()
}
/** Whether the typed time is written in full: the hour and two digits of the minute, and in a
 * 12-hour language its half of the day too where it can be typed, or an hour that only the 24-hour
 * clock has. */
function typedInFull() {
  const parts = splitTypedTime(typedBuffer)
  if (!parts || parts.open || parts.minute.length !== 2) return false
  return (
    !is12.value ||
    !periodTypable.value ||
    typedPeriodOverride !== null ||
    parts.hour === 0 ||
    parts.hour > 12
  )
}
function typePeriod(letter: string) {
  const period = letter.toLowerCase() === 'a' ? 'am' : 'pm'
  // With no digits typed, the letter moves the time held to that half of the day, as its row does;
  // where the window shuts that half out, nothing moves, and that is said.
  if (!typedBuffer && time.value) {
    if (!pickPeriod(period)) announce(t('grani.timePicker.outsideWindow'))
    return
  }
  typedPeriodOverride = period
  periodLast = true
  showTyped()
  highlightTyped()
}
function commitTyped(close: () => void) {
  // A typed time is taken to the minute, on the step or off it, while the window allows it; a time
  // that does not exist, or one outside the window, is not taken, never moved to another, and
  // the field says so: marked invalid, and in words to a reader.
  const t2 = typedValue()
  if (!t2 || !inWindow(t2.hour24 * 60 + t2.minute)) {
    refused.value = true
    announce(t(refusal(t2, true)))
    return
  }
  emitTime(t2.hour24, t2.minute)
  resetTyped()
  close()
}

// Five rows and a half per column, scrolling the rest inside itself. Every column is measured
// off the Hour column: they share one row height, so one ruler is enough.
const { maxHeight: hourHeight } = useVisibleRows(hourListRef, '[role=option]', () => [
  hourRows.value.length,
  open.value,
])
const visibleHeight: Record<ColumnKind, { value: string | undefined }> = {
  hour: hourHeight,
  minute: hourHeight,
  period: hourHeight,
}

defineExpose({
  focus: (options?: FocusOptions) =>
    document.getElementById(buttonId.value ?? generated)?.focus(options),
})
</script>
