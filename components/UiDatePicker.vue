<!--
  UiDatePicker: a form field for one day, in the input capsule on the control ladder. Type the day,
  or open a calendar to pick it from.

  Value. The value is an ISO day (`2026-09-24`); the field shows it in the locale's format with its
  day of the week, and its year only when it is not this one ("Thu, Sep 24" this year, "Thu, Mar
  12, 1987"), so a due date put on a Saturday, or a day one off, is seen before it is kept. Cut in
  a narrow column, the whole day shows in a tooltip on hover; a screen reader hears it whole. Without
  `presets` the field runs no clock: a page left open past New Year shows last year's days without
  their year until the field is created again, as when the page is reloaded; a typed day reads
  today as it is at the key. `focus()` puts the focus on the field.

  Popover. The capsule's button opens a UiPopover with a UiCalendar on the chosen day, or on
  today. A pick closes it.

  Typing. A digit typed on the field starts a day as the app's language writes one: its parts in
  the locale's order (`12.03.1987` in Russian, `03/12/1987` in American English), any mark between
  them, or digits alone (`12031987`, `120387`); a part left out is today's (`12.03` is this year's)
  and a two-digit year is the nearest one at most ten years ahead. The field shows what was typed,
  and the calendar opens on the day it reads, chosen and in focus, or shows no day while it reads
  none. Enter takes it; a day that does not exist, or one outside `min` and `max`, is not taken,
  never guessed: the field is marked invalid until the text changes, and a reader hears why. A press away from the field and its calendar takes it too
  when it is written in full, day, month and a four-digit year or eight digits, as a text field
  keeps what was typed; a stray digit or a year half typed (`03/12/19`) is dropped there, not
  guessed into a day, and a reader hears why. Escape drops it, as do the cross and a preset.
  Digits of other scripts (`٢٤`, `۲۴`, `２４`) count as
  theirs, eight of them make a day whatever marks stand between, and a year in the locale's
  calendar (`2530` in Thai) is read as that calendar's; a calendar whose months differ (Persian,
  Hijri) takes no typing, its calendar is the way in.

  Clear. `clearable` adds a cross that empties the field, as in UiSelect. A required field never
  gets it: there, empty is an error, not a state.

  Presets. `presets` puts days counted from today under the field: one click instead of the
  calendar, for the days people enter most often. `true` gives Today, Yesterday, A week ago,
  Tomorrow, In 3 days, In a week and In 2 weeks; a list picks among them by id
  (`['today', 'yesterday', 'weekAgo']` for a day spent, `['tomorrow', 'inAWeek']` for a deadline)
  or adds the app's own, `{ label, days }`, with `days` from today, negative for the past; one
  whose days are not a finite number, or reach past the year 9999, is left out and said in
  development, as an id the field does not know is. They move on at midnight while the page stays
  open. A preset is an action, not a toggle: the field says the day it set, and no button holds
  room for a check, so three stand on one line.

  Window. `min` and `max` are read as the calendar reads them: a malformed bound counts as no
  bound, and bounds given backwards make the same window. A day outside them is kept and reads
  invalid; a preset outside them is disabled.

  Empty. No day is `null`: the field sends `null` when cleared and reads `null` (or an empty
  string) as no day.

  Standalone. It takes `invalid`, `required` and `ariaLabel`; inside UiField it reads id, error
  and required from the field.

  Width. The field keeps its width when a day is picked or cleared and when it turns disabled:
  the text is sized to the widest date the locale prints, and the cross keeps its place.

  Combobox. The button is a combobox, as in UiSelect: the chosen date is its value, and the
  capsule draws the focus ring. ArrowDown or Alt+ArrowDown opens the calendar.

  Attributes. `class` and `style` land on the root, everything else on the button. The root is
  the capsule, or, with `presets`, a column that holds the capsule and the presets under it.
  Without presets the capsule is the root, so a UiButtonGroup can join it to a UiTimePicker or
  a button.

  Placement. In a form column under UiField, beside UiInput and UiSelect on the same ladder step,
  before a UiTimePicker for a day and its hours; in a window's or a drawer's form as well as on a
  page.

  Keyboard.
  The button is a combobox.
  - `Tab`: reaches it; the presets are buttons that it reaches too.
  - `Enter` `Space` `ArrowDown` `Alt+ArrowDown`: open the calendar; `Ctrl` or `Meta` with an arrow stays
    the browser's.
  - `0–9`: starts a typed day and opens the calendar on it.
  While a day is typed, on the field or in the panel:
  - `0–9` `.` `/` `-` `Space`: go on typing it.
  - `Backspace`: takes back the last key.
  - `Enter`: takes the day it reads and closes; a day that does not exist is not taken. On a day the
    arrows moved to it picks that day, as the calendar does.
  In the panel the focus lands on the day it opens on, and the calendar's keys apply:
  - `Tab`: cycles inside the panel.
  - `Escape`: closes it, drops a day being typed, and returns the focus to the button; a pick does the same, inside a window
    too.
  The cross clears the value and leaves the focus on the button, also while the calendar is open.
  When the field turns disabled, the calendar closes and the focus stays on the field.

  Reader.
  - Field: a combobox named by `ariaLabel` or the field's label. Its value is the chosen date as
    the locale prints it, or the placeholder.
  - Errors: `required` sets `aria-required`; a day outside the window, a typed day refused, or a
    field error sets `aria-invalid`; the field's description and error are read with it.
  - Panel: named by the field's label; the calendar in it speaks as UiCalendar does.
  - Presets: a group named in words, each a button that sets its day; the field says the day.
  - Clear: the cross has a name.
  - Typing: the field says what is typed; the focus stands on the day it reads, named by its full
    date; a refused Enter says "Not a date" or that the date is outside the allowed range.

  States. Empty, a day picked, open (the calendar on the chosen day, on today, or on the window's
  nearest day), disabled (the plate, no calendar, no cross, nothing sent), invalid (standalone,
  or from a field error), a day outside `min` and `max` (kept, reads invalid), a preset outside
  the window (disabled), and `clearable` with a day.
  The width stays the same in all of them.

  Not for.
  - A period in a toolbar: UiDateRange.
  - A month on a page with no field: UiCalendar alone.
  - A time of day: UiTimePicker beside it.
-->
<template>
  <Root>
    <div
      ref="capsuleRef"
      tabindex="-1"
      :class="[capsule, presetList.length ? '' : ['align-middle', rootClass]]"
      :style="presetList.length ? undefined : rootStyle"
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
            :aria-label="ariaLabel"
            :aria-invalid="aria['aria-invalid']"
            :aria-describedby="aria['aria-describedby']"
            :aria-required="aria['aria-required']"
            class="flex h-full min-w-0 flex-1 items-center gap-2 bg-transparent text-left focus:outline-hidden disabled:cursor-not-allowed"
            @keydown="onKey"
          >
            <CalendarDays
              aria-hidden="true"
              class="h-4 w-4 shrink-0"
              :class="disabled ? 'text-disabled-fg' : 'text-fg-muted'"
            />
            <!-- The text stands over the widest date the locale prints: a pick never widens the field. -->
            <span
              class="grid min-w-0 flex-1 [&>*]:col-start-1 [&>*]:row-start-1 [&>*]:truncate"
              :class="
                disabled ? 'text-disabled-fg' : typed || shown ? 'text-fg' : 'text-placeholder'
              "
            >
              <!-- Cut in a narrow column, the whole day (its year too) shows in a tooltip. -->
              <UiTruncate
                :text="typed || shown || placeholderText"
                :class="typed ? 'tabular-nums' : ''"
                :data-typed="typed || undefined"
              />
              <span data-sizer aria-hidden="true" class="invisible">
                <template v-for="(part, i) in dateSizer" :key="i">
                  <span
                    v-if="Array.isArray(part)"
                    class="inline-grid [&>*]:col-start-1 [&>*]:row-start-1"
                    ><span v-for="v in part" :key="v">{{ v }}</span></span
                  ><template v-else>{{ part }}</template>
                </template>
              </span>
              <span data-sizer aria-hidden="true" class="invisible">{{ placeholderText }}</span>
            </span>
          </button>
        </template>
        <template #default="{ close }">
          <!-- While a day is typed the calendar shows the day it reads, or none while it reads none. -->
          <div ref="calendarBox" @keydown="onType($event, close)">
            <UiCalendar
              :model-value="typed ? typedDay || null : day"
              :min="win.lo"
              :max="win.hi"
              @update:model-value="pick($event as string, close)"
            />
          </div>
        </template>
      </UiPopover>
      <UiIconButton
        v-if="clearable && day && !disabled && !isRequired"
        variant="ghost"
        size="xs"
        :icon="X"
        :ariaLabel="t('grani.datePicker.clear')"
        :class="capsuleEndButtonClass(ladder)"
        @mousedown.prevent
        @click="clear"
      />
      <!-- The cross's place is kept while there is no day and while disabled: the width never moves. -->
      <span
        v-else-if="clearable && !isRequired"
        data-sizer
        aria-hidden="true"
        class="-me-1.5 shrink-0"
        :class="ladder === 'xs' ? 'h-6 w-6' : controlWidthXs"
      />
      <input
        v-if="name"
        type="hidden"
        :name="name"
        :value="day"
        :disabled="disabled"
        :form="formId"
      />
    </div>
    <div
      v-if="presetList.length"
      ref="presetsRef"
      role="group"
      :aria-label="t('grani.datePicker.presets')"
      class="flex flex-wrap gap-2"
    >
      <UiButton
        v-for="p in presetList"
        :key="p.label"
        variant="outline"
        size="xs"
        :disabled="disabled || !inWindow(p.day)"
        @click="emit('update:modelValue', p.day)"
      >
        {{ p.label }}
      </UiButton>
    </div>
  </Root>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { CalendarDays, X } from '@lucide/vue'
import type { ControlSize, DatePreset, DatePresetId } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useSplitAttrs } from '../utils/attrs'
import {
  addDays,
  dayWindow,
  inRange,
  latinDigits,
  parseDay,
  readTypedDay,
  typedInFull,
  today,
  typedYearShift,
} from '../utils/calendar'
import { announce } from '../utils/announce'
import { giveFocus } from '../utils/giveFocus'
import { useToday } from '../composables/useToday'
import { capsuleEndButtonClass, capsuleRoot, triggerCapsuleClass } from '../utils/controlChrome'
import { useFieldControl } from '../utils/field'
import type { GraniMessageKey } from '../i18n/en'
import UiButton from './UiButton.vue'
import UiCalendar from './UiCalendar.vue'
import UiIconButton from './UiIconButton.vue'
import UiPopover from './UiPopover.vue'
import UiTruncate from './UiTruncate.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The day, `YYYY-MM-DD` (`v-model`); `null` for none. */
    modelValue?: string | null
    /** Shown while empty; defaults to "Choose a date". */
    placeholder?: string
    /** The first day that can be picked, inclusive. */
    min?: string
    /** The last day that can be picked, inclusive. */
    max?: string
    /** Days from today under the field, as one-click picks: `true` for the default seven, or a list of ids and `{ label, days }`. */
    presets?: boolean | (DatePresetId | DatePreset)[]
    /** A cross that empties the field, as UiSelect's; never shown on a required field. */
    clearable?: boolean
    /** Standalone only: empty is an error, said to a reader, and no cross. Inside UiField the field's `required` says so. */
    required?: boolean
    /** The field cannot be changed: a disabled plate, no calendar, nothing sent with a form. */
    disabled?: boolean
    /** Standalone only: the value is wrong. Inside UiField the field's error says so. */
    invalid?: boolean
    /** Standalone only: the accessible name. Inside UiField the label names it. */
    ariaLabel?: string
    /** Sends the day with a form, under this name. */
    name?: string
    /** Id of the button, standalone; inside UiField the field's id wins. */
    id?: string
    /** Step of the control ladder. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  {
    modelValue: null,
    placeholder: '',
    min: '',
    max: '',
    presets: false,
    clearable: false,
    required: false,
    disabled: false,
    invalid: false,
    ariaLabel: undefined,
    name: undefined,
    id: undefined,
  },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** A day was picked, or `null` when cleared. */
  'update:modelValue': [value: string | null]
}>()

const { t, locale, timeZone } = useUiT()
// The clock runs only for the days that follow it.
const { now } = useToday(
  () => props.presets === true || (Array.isArray(props.presets) && props.presets.length > 0),
)
const generated = `ui-date-${useId()}`
// A typed day Enter refused stays in the field, marked invalid until the text changes.
const refused = ref(false)
const {
  field,
  id: buttonId,
  invalid: isInvalid,
  required: isRequired,
  aria,
} = useFieldControl(() => ({
  id: props.id ?? generated,
  invalid: props.invalid || (day.value !== '' && !inWindow(day.value)) || refused.value,
  required: props.required,
}))
const { rootClass, rootStyle, control } = useSplitAttrs()
// The form its `form` attribute names gets the hidden inputs too, as a native control's value.
const formId = computed(() => control.value.form as string | undefined)
// With presets a column holds them under the capsule; in a row they stay under it, not
// beside it. Without, the capsule is the root, and a group joins it as any capsule.
const Root = capsuleRoot(
  () => presetList.value.length > 0,
  () => ({
    class: ['inline-flex flex-col gap-2 align-middle', rootClass.value],
    style: rootStyle.value,
  }),
)
const capsule = computed(() => triggerCapsuleClass(ladder.value, props.disabled, isInvalid.value))
// The panel lines up with the capsule, as a select's does, and a click on the cross is inside.
const capsuleRef = ref<HTMLElement | null>(null)

// The window as the calendar reads it, so the chips and the calendar never disagree.
const win = computed(() => dayWindow(props.min, props.max))
const inWindow = (d: string) => inRange(d, win.value.lo, win.value.hi)
// A value that is no day (`2026-13-40`) is none: no cross, nothing sent. A day out of the
// window is kept, since dropping it would lose data without a word, and reads invalid.
const day = computed(() => (props.modelValue && parseDay(props.modelValue) ? props.modelValue : ''))
if (isDev()) {
  watch(
    () => props.modelValue,
    (v) => {
      if (v && !parseDay(v))
        console.warn(
          '[grani] UiDatePicker: the value is not a day (YYYY-MM-DD); it shows as empty.',
        )
    },
    { immediate: true },
  )
  // Said at once, not when the calendar first opens.
  watch(
    () => [props.min, props.max] as const,
    ([min, max]) => {
      for (const [name, v] of [
        ['min', min],
        ['max', max],
      ] as const)
        if (v && !parseDay(v))
          console.warn(`[grani] UiDatePicker: ${name} is not a YYYY-MM-DD day; it is ignored.`)
      if (parseDay(min) && parseDay(max) && min > max)
        console.warn('[grani] UiDatePicker: min is after max; they are read as one window.')
    },
    { immediate: true },
  )
}

const dayFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
)
// This year's day leaves its year out, as a period's button and a date cell do: the weekday fits a
// narrow column beside it. The field still stands as wide as a day with its year.
const thisYearFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }),
)
const shown = computed(() => {
  const d = parseDay(props.modelValue ?? '')
  if (!d) return ''
  const own = props.modelValue!.slice(0, 4) === now.value.slice(0, 4)
  return (own ? thisYearFormat : dayFormat).value.format(d)
})
// The widest the field can say, part by part in the locale's order: every weekday stacked over the
// others and every month too, beside a two-digit day, so the line is as wide as the widest weekday
// beside the widest month. Seven and twelve names, not their eighty-four dates.
const dateSizer = computed<(string | string[])[]>(() => {
  const parts = (d: Date) => dayFormat.value.formatToParts(d)
  const names = (type: Intl.DateTimeFormatPartTypes, days: Date[]) => [
    ...new Set(days.map((d) => parts(d).find((p) => p.type === type)?.value ?? '')),
  ]
  const weekdays = names(
    'weekday',
    Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 0, 25 + i))),
  )
  const months = names(
    'month',
    Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(2026, m, 28))),
  )
  return parts(new Date(Date.UTC(2026, 0, 28))).map((p) =>
    p.type === 'weekday' ? weekdays : p.type === 'month' ? months : p.value,
  )
})
const placeholderText = computed(() => props.placeholder || t('grani.datePicker.placeholder'))
// The cross is an `xs` icon button: 28 square.
const controlWidthXs = 'h-7 w-7'

// The presets the field knows by id: their words and their days from today.
const PRESET: Record<DatePresetId, { key: GraniMessageKey; days: number }> = {
  today: { key: 'grani.datePicker.today', days: 0 },
  yesterday: { key: 'grani.datePicker.yesterday', days: -1 },
  weekAgo: { key: 'grani.datePicker.weekAgo', days: -7 },
  tomorrow: { key: 'grani.datePicker.tomorrow', days: 1 },
  in3Days: { key: 'grani.datePicker.in3Days', days: 3 },
  inAWeek: { key: 'grani.datePicker.inAWeek', days: 7 },
  in2Weeks: { key: 'grani.datePicker.in2Weeks', days: 14 },
}
const presetIds = computed<(DatePresetId | DatePreset)[]>(() =>
  props.presets === true
    ? (Object.keys(PRESET) as DatePresetId[])
    : Array.isArray(props.presets)
      ? props.presets
      : [],
)
// A config may hold any number: one that lands on no day the format can write (NaN, Infinity,
// past the year 9999) is no preset. `SPAN` keeps the date arithmetic inside what a Date holds.
const SPAN = 4_000_000
const presetDay = (days: number) => {
  if (!Number.isFinite(days) || Math.abs(days) > SPAN) return null
  const day = addDays(now.value, days)
  return parseDay(day) ? day : null
}
// They follow midnight: `now` is re-read each minute.
// An id the field does not know, or days that reach no day, is skipped and said in development:
// a list from a config renders.
const presetList = computed(() =>
  presetIds.value.flatMap((p) => {
    if (typeof p === 'string' && !PRESET[p]) {
      if (isDev()) console.warn('[grani] UiDatePicker: a preset id it does not know is skipped.')
      return []
    }
    const { label, days } =
      typeof p === 'string' ? { label: t(PRESET[p].key), days: PRESET[p].days } : p
    const day = presetDay(days)
    if (!day) {
      if (isDev())
        console.warn('[grani] UiDatePicker: a preset whose days reach no day is skipped.')
      return []
    }
    return [{ label, day }]
  }),
)

// The picker owns the panel: a field turned disabled closes it, and a pick cannot land after.
// The focus was in the panel or on the button, both about to be gone or disabled: it rests
// on the capsule (tabindex -1, no ring), so Tab goes on from the field and not from the body.
const open = ref(false)
watch(
  () => props.disabled,
  (d) => {
    if (!d) return
    const held = open.value || capsuleRef.value?.contains(document.activeElement)
    open.value = false
    // After the trap lets go: while it is active it pulls a focus outside back into the panel.
    if (held) nextTick(() => capsuleRef.value?.focus())
  },
)
// A day typed as the app's language writes one, key by key: what was typed so far and the day it
// reads, '' while it reads none. The calendar follows it; Enter takes it, Escape and a close drop it.
const typed = ref('')
watch(typed, () => (refused.value = false))
// Read against today as it is at the key: a page left open past midnight reads `12.03` in the new year.
const typedDay = computed(() =>
  typed.value ? readTypedDay(typed.value, locale.value, today(timeZone.value)) : '',
)
const calendarBox = ref<HTMLElement | null>(null)
// A close takes a day typed as Enter would, as a text field keeps what was typed when the focus
// leaves it: a press away from the calendar keeps the day. Escape and a field turned disabled are
// the ways to drop it; a text that reads no day, or a day outside the window, is dropped too.
let dropping = false
watch(open, (o) => {
  if (o) return
  const taking = Boolean(typed.value) && !dropping && !props.disabled
  const d = taking ? typedDay.value : ''
  // Only a day written in full is taken this way: a stray digit or a year half typed (`03/12/19`)
  // would quietly change the field. Enter takes the short forms.
  const whole = taking && typedInFull(typed.value)
  if (d && inWindow(d) && whole) emit('update:modelValue', d)
  // A text left behind that is not taken is said, as Enter says it.
  else if (taking)
    announce(
      t(
        !d
          ? 'grani.datePicker.notADay'
          : !inWindow(d)
            ? 'grani.datePicker.outsideWindow'
            : 'grani.datePicker.notInFull',
      ),
    )
  typed.value = ''
  dropping = false
})
// The typing is dropped, not taken, by Escape wherever the focus is while the panel is open (on a
// day, on the field, on the panel itself: a press on its padding, or Safari, which does not focus
// a pressed button), and by a press on a preset, which sends its own day. Both are heard here,
// before the panel's own Escape or press away closes it. A months view that keeps the panel open
// on Escape leaves the next close taking the day again.
const drop = () => {
  dropping = true
  setTimeout(() => (dropping = false))
}
const onEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && typed.value) drop()
}
const onPress = (e: Event) => {
  if (typed.value && presetsRef.value?.contains(e.target as Node)) drop()
}
const listen = (on: boolean) => {
  if (on) {
    window.addEventListener('keydown', onEscape, true)
    window.addEventListener('pointerdown', onPress, true)
  } else {
    window.removeEventListener('keydown', onEscape, true)
    window.removeEventListener('pointerdown', onPress, true)
  }
}
const presetsRef = ref<HTMLElement | null>(null)
watch(open, listen)
onBeforeUnmount(() => listen(false))
// The focus goes with the day the calendar jumped to, so the arrows and Enter go on from there,
// and back to the day it shows when the text is taken back to nothing: its rows drawn anew under the
// focus, or the same month, where the focus would stay on a day that is no longer the one shown. A panel just shown refuses it for a few frames: it is given until it takes.
const shownDay = () => calendarBox.value?.querySelector<HTMLElement>('tbody button[tabindex="0"]')
const follow = () =>
  nextTick(() =>
    giveFocus(
      shownDay,
      () =>
        open.value &&
        (Boolean(typedDay.value) ||
          !calendarBox.value?.contains(document.activeElement) ||
          document.activeElement !== shownDay()),
    ),
  )
/** Takes the keys of a typed day, on the field or in the calendar; says whether it took this one. */
function onType(e: KeyboardEvent, close: () => void) {
  if (props.disabled || e.altKey || e.ctrlKey || e.metaKey) return false
  // A calendar whose months differ from the Gregorian one takes no typing: the keys stay the page's.
  if (typedYearShift(locale.value) === null) return false
  const key = latinDigits(e.key)
  // A mark between the parts (a dot, a slash, a dash, a space, the number pad's comma) counts once a
  // digit came first. Eight digits make a day; the marks a language writes (`22. 11. 2026`) do not
  // count against them.
  if (/^[0-9]$/.test(key) || (typed.value && /^[./\-, ]$/.test(key))) {
    e.preventDefault()
    const digits = typed.value.replace(/[^0-9]/g, '').length
    if (/^[0-9]$/.test(key) ? digits < 8 : typed.value.length < 16) typed.value += key
    open.value = true
    follow()
    return true
  }
  if (!typed.value) return false
  if (e.key === 'Backspace') {
    e.preventDefault()
    typed.value = typed.value.slice(0, -1)
    follow()
    return true
  }
  if (e.key === 'Enter') {
    // The arrows moved the focus off the day typed: Enter there is the calendar's, a pick.
    const cell = (e.target as HTMLElement | null)?.closest?.('td')
    if (
      typedDay.value &&
      cell &&
      calendarBox.value?.contains(cell) &&
      cell.getAttribute('aria-selected') !== 'true'
    )
      return false
    // A day that does not exist, or one the window refuses, is not taken: never a guess, and said.
    e.preventDefault()
    const d = typedDay.value
    if (d && inWindow(d)) {
      emit('update:modelValue', d)
      typed.value = ''
      close()
    } else {
      refused.value = true
      announce(t(d ? 'grani.datePicker.outsideWindow' : 'grani.datePicker.notADay'))
    }
    return true
  }
  return false
}
function onKey(e: KeyboardEvent) {
  if (onType(e, () => (open.value = false))) return
  // Alt with ArrowDown opens it too, as a select; Ctrl or ⌘ with an arrow is the browser's.
  if (props.disabled || open.value || e.key !== 'ArrowDown' || e.ctrlKey || e.metaKey) return
  e.preventDefault()
  open.value = true
}
// A clear with the calendar open closes it too: there is no day left to show.
const clear = () => {
  // A day half typed goes with it: the close below must not take it back.
  typed.value = ''
  emit('update:modelValue', null)
  const wasOpen = open.value
  open.value = false
  const focus = () => document.getElementById(buttonId.value ?? generated)?.focus()
  // After the trap lets go, as when the field turns disabled.
  if (wasOpen) nextTick(focus)
  else focus()
}

// The owner can put the focus on the field, as on the other fields.
defineExpose({
  focus: (options?: FocusOptions) =>
    document.getElementById(buttonId.value ?? generated)?.focus(options),
})

function pick(day: string, close: () => void) {
  typed.value = ''
  emit('update:modelValue', day)
  close()
}
</script>
