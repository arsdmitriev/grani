<!--
  UiCalendar: a month to pick a day from. Take it on a page of its own, or inside a picker's
  popover.

  Value. The value is an ISO day (`2026-09-24`): a day, not a moment.

  Today. Today is marked on the client only, because the server's today may be another day.

  Weekend. The names of the days of rest in the header are bold, as the locale counts them:
  Saturday and Sunday in most places, Friday and Saturday in Israel or Saudi Arabia. A due day put
  on a day off is seen by its column, and the days themselves stay as they are, so nothing competes
  with the chosen day, today, a span or the marks.

  Window. Days outside `min` and `max` cannot be picked, and the arrows stop at them. When the
  calendar opens on a month outside them, the arrows can always walk back into the window.

  Marks. Taken days (`unavailable`) are struck through, and `marked` days carry a dot; a screen
  reader hears both in words.

  Range. With `range` the value is a span, `{ from, to }`, and the calendar picks it: the first
  day pressed starts a span, the second ends it, in either order, and only then is the span sent.
  A half-made span is the calendar's own: a span set from outside drops it. TypeScript checks the
  value against `range` written as it is (`range` or none), so a calendar whose `range` changes at
  run time is two tags, one under `v-if` and one under `v-else`: `:range="flag"` does not compile.

  Preview. Before the second press the band runs from the first day to the day under the pointer,
  or to the day with the keyboard focus, and the line under the month counts its days ("7 days"),
  so a week that came out eight days long is seen before it is set. Only a day the second press can
  pick ends it, and nothing is sent until that press. A taken day (`unavailable`) stops a span:
  while it waits, the days past the nearest taken day on either side cannot end it and show
  disabled, so a booking never takes in a day already booked. The line says the next step while no span is
  drawn and the length of a picked span after; it is always there, so the month does not move.

  Size. It has one step, `sm`, whatever the app's step: the day cells are 36 px and the header
  matches them.

  Placement. In the popover of UiDatePicker, as the second step of UiDateRange's popover, or on
  a page of its own, beside what the host puts under it (a value, quick picks, a time).

  Keyboard.
  The keys follow the WAI-ARIA date grid. One day is the tab stop.
  In the days:
  - `ArrowLeft` `ArrowRight`: move a day toward that side. On a right-to-left page the week runs
    from the right, so `ArrowRight` moves to the day before.
  - `ArrowUp` `ArrowDown`: move a week.
  - `Home` `End`: go to the ends of the week.
  - `PageUp` `PageDown`: move a month.
  - `Shift+PageUp` `Shift+PageDown`: move a year.
  - `Enter` `Space`: pick the day in focus.
  - `Escape`: belongs to the host.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's, in the days and in the months.
  A move that starts inside the window stops at its edge.
  The caption opens the months of the year, to jump far. There:
  - `ArrowLeft` `ArrowRight` `ArrowUp` `ArrowDown`: walk the 3 × 4 grid. On a right-to-left page
    the grid runs from the right, so `ArrowRight` moves to the month before.
  - `Home` `End`: go to its ends.
  - `Escape`: goes back to the days.
  The header arrows page by a month, or by a year in the months view; when an arrow turns off at
  the window's edge, the focus moves to the caption. On a right-to-left page the previous arrow
  stands at the right and points there.

  Reader.
  - Grid: named by the month shown, from a live caption, so a page turn is read out; with `range`
    it is `aria-multiselectable`.
  - Day: a button named by its full date, then by what its dots mean and, when it is taken, by the
    word unavailable.
  - Today: `aria-current="date"`.
  - Weekend: a header cell is named by its day's full name; its weight is for the eye alone.
  - Chosen day: `aria-selected` on its cell.
  - Disabled day: a day that cannot be picked is `aria-disabled`.
  - Month: a month button says its month and year; the month shown is `aria-current`.
  - Range: with `range` a live region says "Choose the first day", then "Now choose the last day".
  - Preview: while a span waits for its end, the focused day says after its date how long the span
    to it would be ("7 days"); the line under the month is hidden, since it says the same.
  - Two calendars: when two stand on one page, `ariaLabel` names each whole calendar as a group;
    the grid keeps the month as its name.

  Empty. No day is `null`; in a span, an open end is `null`.

  States. Empty (it opens on today, or on the window's nearest day), a chosen day, a span, a span
  drawn to the pointed or focused day before its second press with its length under the month, days
  outside `min` and `max` (disabled; a chosen day out there keeps a frame), taken days struck
  through, marked days with one or two dots, today in the brand ink, the names of the days of rest
  in bold, and the months view. The
  months view is as tall as the days, so nothing jumps when you switch.

  Not for.
  - A day in a form field: UiDatePicker, which wraps this.
  - A period in a toolbar: UiDateRange.
  - A time of day: UiTimePicker beside it.
-->
<template>
  <div
    ref="rootRef"
    class="flex w-max flex-col gap-2"
    :role="ariaLabel ? 'group' : undefined"
    :aria-label="ariaLabel || undefined"
    @keydown.esc="onEscape"
  >
    <div class="flex items-center justify-between gap-2">
      <UiIconButton
        :icon="ChevronLeft"
        :ariaLabel="view === 'days' ? t('grani.calendar.prevMonth') : t('grani.calendar.prevYear')"
        class="rtl:[&_svg]:-scale-x-100"
        variant="ghost"
        size="sm"
        :disabled="!canGo(-1)"
        @click="arrow(-1)"
      />
      <UiButton
        ref="captionRef"
        variant="ghost"
        size="sm"
        :aria-expanded="view === 'months'"
        @click="toggleView"
      >
        {{ view === 'days' ? monthCaption : yearCaption }}
      </UiButton>
      <UiIconButton
        :icon="ChevronRight"
        :ariaLabel="view === 'days' ? t('grani.calendar.nextMonth') : t('grani.calendar.nextYear')"
        class="rtl:[&_svg]:-scale-x-100"
        variant="ghost"
        size="sm"
        :disabled="!canGo(1)"
        @click="arrow(1)"
      />
    </div>

    <span :id="captionId" class="sr-only" aria-live="polite">{{
      view === 'days' ? monthCaption : yearCaption
    }}</span>
    <p v-if="range" class="sr-only" aria-live="polite">
      {{ pending ? t('grani.calendar.pickEnd') : t('grani.calendar.pickStart') }}
    </p>

    <table
      v-if="view === 'days'"
      role="grid"
      :aria-labelledby="captionId"
      :aria-multiselectable="range ? 'true' : undefined"
      class="border-collapse"
    >
      <thead>
        <tr>
          <th
            v-for="w in weekdays"
            :key="w.long"
            scope="col"
            :abbr="w.long"
            :aria-label="w.long"
            class="h-8 w-9 p-0 text-xs/4.5"
            :class="w.rest ? 'font-bold text-fg-muted' : 'font-medium text-fg-muted'"
          >
            {{ w.short }}
          </th>
        </tr>
      </thead>
      <tbody
        @keydown="onKey"
        @pointerleave="pointed = ''"
        @focusin="gridFocus = true"
        @focusout="onGridOut"
      >
        <tr v-for="(week, i) in weeks" :key="i">
          <td
            v-for="day in week"
            :key="day"
            class="p-0"
            :aria-selected="isChosen(day) ? 'true' : 'false'"
          >
            <button
              type="button"
              :tabindex="day === active ? 0 : -1"
              :data-autofocus="day === active ? '' : undefined"
              :aria-label="dayLabel(day)"
              :aria-current="day === todayIso ? 'date' : undefined"
              :aria-disabled="!pickable(day) || undefined"
              :class="dayClass(day)"
              @click="pick(day)"
              @pointerenter="onPointerEnter(day)"
              @pointermove="onPointerMove(day)"
            >
              {{ Number(day.slice(8)) }}
              <span
                v-if="markedSet.has(day)"
                aria-hidden="true"
                class="absolute bottom-1 flex gap-0.5"
              >
                <span
                  v-for="(mark, n) in marks.get(day)"
                  :key="n"
                  class="h-1 w-1 rounded-pill"
                  :class="onFill(day) ? 'bg-brand-fg' : mark.tone ? DOT[mark.tone] : 'bg-current'"
                />
              </span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- As tall as the days (a header row and six weeks): the panel does not jump on the toggle. -->
    <div
      v-else
      class="grid h-[15.5rem] w-[15.75rem] grid-cols-3 grid-rows-4 items-center gap-2"
      @keydown="onMonthKey"
    >
      <UiButton
        v-for="(name, m) in monthNames"
        :key="m"
        size="sm"
        :variant="m === cursorMonth ? 'primary' : 'ghost'"
        :aria-current="m === cursorMonth ? 'true' : undefined"
        :tabindex="m === monthFocus ? 0 : -1"
        :data-month="m"
        :aria-label="monthLabel(m)"
        :disabled="!monthOpen(m)"
        @click="openMonth(m)"
      >
        {{ name }}
      </UiButton>
    </div>
    <!-- Under both views, so a switch to the months does not move it. Its width is the month's: a
         longer text in another language never widens the calendar while the pointer moves. -->
    <p
      v-if="range"
      aria-hidden="true"
      class="w-0 min-w-full text-center text-sm/5.5 text-fg-muted tabular-nums"
    >
      {{ lengthLine }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch, type ComponentPublicInstance } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { useToday } from '../composables/useToday'
import type { BadgeTone, CalendarMark, DateSpan } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { holdEnter } from '../utils/held'
import {
  addDays,
  addMonths,
  dayWindow,
  inRange,
  monthGrid,
  parseDay,
  sameMonth,
  weekend,
  weekStart,
  type IsoDay,
} from '../utils/calendar'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'

interface CalendarBase {
  /** The first day that can be picked, inclusive. */
  min?: string
  /** The last day that can be picked, inclusive. */
  max?: string
  /** Days with a dot under the number: a day, or `{ day, tone }` for a colored dot; a day listed twice has two dots, two at most. `grani.calendar.marked` says what they mean (the app's `translate` words it). */
  marked?: (string | CalendarMark)[]
  /** Days that cannot be picked though they fall within `min` and `max` (booked, closed): struck through. */
  unavailable?: string[]
  /** A name for the whole calendar where two stand on one page ("Check-in"); the grid keeps the month as its name. */
  ariaLabel?: string
}
type DayCalendar = CalendarBase & {
  /** Pick a span of days, two presses in either order, instead of one day. */
  range?: false
  /** The chosen day as `YYYY-MM-DD`, or with `range` the span `{ from, to }` (`v-model`); `null` for none and for an open end. */
  modelValue?: string | null
}
type SpanCalendar = CalendarBase & {
  /** Pick a span of days, two presses in either order, instead of one day. */
  range: true
  /** The chosen day as `YYYY-MM-DD`, or with `range` the span `{ from, to }` (`v-model`); `null` for none and for an open end. */
  modelValue?: DateSpan | null
}
const props = defineProps<DayCalendar | SpanCalendar>()

const emit = defineEmits<{
  /** A day was picked, or with `range` a whole span: a half-made span is not sent. */
  'update:modelValue': [value: IsoDay | DateSpan]
}>()

// The chosen day, or the span; `null` and an open end read as none.
const chosenDay = computed(() =>
  !props.range && typeof props.modelValue === 'string' ? props.modelValue : '',
)
const modelSpan = computed(() => {
  if (!props.range || !props.modelValue || typeof props.modelValue !== 'object') return null
  // An end that is no day (a hand-edited address, `2026-02-31`) is no end, as an unreadable value is no day.
  return { from: valid(props.modelValue.from ?? ''), to: valid(props.modelValue.to ?? '') }
})
// The first day of a span waiting for its end. It is the calendar's own until the span is whole.
const pending = ref('')
// The day under the pointer, and whether the keyboard focus is in the days: while a span waits for
// its end, the band runs to the one, else to the other.
const pointed = ref('')
const gridFocus = ref(false)
// After a key the band is the keys' until the pointer really moves: a month drawn anew under a
// pointer that stays still enters the day now under it, with no move.
let keysLead = false
const onPointerEnter = (day: IsoDay) => {
  if (!keysLead) pointed.value = day
}
const onPointerMove = (day: IsoDay) => {
  keysLead = false
  pointed.value = day
}
// The calendar's own move of the focus (a month drawn anew, back from the months) takes the focused
// day out of the page for a moment, and Chromium reports the focus leaving to nowhere.
let moving = false
function onGridOut(e: FocusEvent) {
  if (moving) return
  const next = e.relatedTarget as Node | null
  if (!next || !(e.currentTarget as Element).contains(next)) gridFocus.value = false
}

const { t, tp, locale } = useUiT()
const captionId = `ui-calendar-caption-${useId()}`
// Re-read each minute: a calendar left open across midnight moves its today.
// The server's today may be another day than the reader's: it is marked after mount only.
const { now, mark: todayIso } = useToday()
// Each day's dots in the order given, two at most: a third would crowd the number.
const marks = computed(() => {
  const m = new Map<string, Omit<CalendarMark, 'day'>[]>()
  for (const entry of props.marked ?? []) {
    const mark = typeof entry === 'string' ? { day: entry } : entry
    const list = m.get(mark.day) ?? []
    if (list.length < 2) list.push({ tone: mark.tone, label: mark.label })
    m.set(mark.day, list)
  }
  return m
})
// A dot is a mark on the surface: the tone's border role, graded to 3:1 there (warning's fill is not).
const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-fg-muted',
  brand: 'bg-brand-solid',
  success: 'bg-success-border',
  warning: 'bg-warning-border',
  danger: 'bg-danger-border',
  info: 'bg-info-border',
}
// What a reader hears: the date, what its dots mean (their labels, else the one word), and why it
// cannot be picked when it is taken. Color alone never carries it.
const dayLabel = (day: IsoDay) => {
  const parts = [longDate(day)]
  const m = marks.value.get(day)
  if (m) {
    const labels = m.map((x) => x.label).filter(Boolean)
    parts.push(labels.length ? labels.join(', ') : t('grani.calendar.marked'))
  }
  if (unavailableSet.value.has(day)) parts.push(t('grani.calendar.unavailable'))
  // The keys draw the band to the focused day: a reader hears its length there, as the eye reads
  // it under the month.
  if (day === previewEnd.value && day === active.value)
    parts.push(tp('grani.calendar.days', daysIn(preview.value!)))
  return parts.join(', ')
}
const markedSet = computed(() => new Set(marks.value.keys()))
// On a filled day (chosen, a span's end) the dots take the fill's ink, or they would vanish.
const onFill = (day: IsoDay) => pickable(day) && (day === chosenDay.value || isEnd(day))
const unavailableSet = computed(() => new Set(props.unavailable ?? []))
const valid = (iso: string) => (parseDay(iso) ? iso : '')
// The window, read once: a malformed bound is no bound (said in dev), not a calendar where no
// day can be picked while the arrows still walk; bounds given backwards are the same window.
const bounds = computed(() => dayWindow(props.min ?? '', props.max ?? ''))
if (isDev())
  watch(
    () => [props.min, props.max] as const,
    ([min, max]) => {
      for (const [name, v] of [
        ['min', min],
        ['max', max],
      ] as const)
        if (v && !valid(v))
          console.warn(`[grani] UiCalendar: ${name} is not a YYYY-MM-DD day; it is ignored.`)
    },
    { immediate: true },
  )
const inWindow = (day: IsoDay) => inRange(day, bounds.value.lo, bounds.value.hi)
// While a span waits for its end, a taken day stops it: the nearest taken days on either side of the
// first day fence the days that can end it, so a booking never takes in a day already booked.
const fence = computed(() => {
  if (!props.range || !pending.value) return null
  let lo = ''
  let hi = ''
  for (const taken of unavailableSet.value) {
    if (taken < pending.value && taken > lo) lo = taken
    if (taken > pending.value && (!hi || taken < hi)) hi = taken
  }
  return { lo, hi }
})
const pickable = (day: IsoDay) =>
  inWindow(day) &&
  !unavailableSet.value.has(day) &&
  (!fence.value ||
    ((!fence.value.lo || day > fence.value.lo) && (!fence.value.hi || day < fence.value.hi)))
// A page by keyboard stops at the window's first or last day rather than leaving it.
const clampToWindow = (iso: IsoDay) => {
  const { lo, hi } = bounds.value
  return lo && iso < lo ? lo : hi && iso > hi ? hi : iso
}
// A move from inside the window stays in it; from outside it walks as asked, toward the window.
const keepIn = (from: IsoDay, to: IsoDay) => (inWindow(from) ? clampToWindow(to) : to)

// The focused day; the month shown is its month. A value is shown where it is, even outside the
// window; with none the calendar opens on today, or on the window's nearest day when today is out.
const given = () =>
  valid(chosenDay.value) || valid(modelSpan.value?.from ?? '') || valid(modelSpan.value?.to ?? '')
const active = ref<IsoDay>(given() || clampToWindow(now.value))
// The day of the month PageUp and PageDown aim for: a clamp to the 30th does not stick.
let anchor = Number(active.value.slice(8))
const cursor = ref<IsoDay>(active.value)
const view = ref<'days' | 'months'>('days')
const rootRef = ref<HTMLElement | null>(null)
// Nothing chosen opens on the server's today; the reader's may be the next or the last day.
onMounted(() => {
  const start = clampToWindow(now.value)
  if (given() || active.value === start) return
  active.value = start
  cursor.value = start
  anchor = Number(start.slice(8))
})

watch(chosenDay, (v) => {
  if (!valid(v)) return
  active.value = v
  cursor.value = v
  anchor = Number(v.slice(8))
})
// A span set from outside (a preset, a reset) drops a half-made one and brings its first month
// into view, or its one end's. The span this calendar sent itself keeps the month of the day
// pressed, and the focus on it.
let sent = ''
watch(
  () => `${modelSpan.value?.from}|${modelSpan.value?.to}`,
  (key) => {
    pending.value = ''
    if (key === sent) {
      sent = ''
      return
    }
    const v = modelSpan.value?.from || modelSpan.value?.to
    if (!v || !valid(v) || sameMonth(v, cursor.value)) return
    active.value = v
    cursor.value = v
    anchor = Number(v.slice(8))
  },
)

// One formatter per shape and locale: a render formats some fifty labels.
const formatters = computed(() => (locale.value, new Map<string, Intl.DateTimeFormat>()))
const fmt = (options: Intl.DateTimeFormatOptions) => {
  const key = JSON.stringify(options)
  let f = formatters.value.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(locale.value, { ...options, timeZone: 'UTC' })
    formatters.value.set(key, f)
  }
  return f
}
const cap = (s: string) => s.charAt(0).toLocaleUpperCase(locale.value) + s.slice(1)

const monthCaption = computed(() =>
  cap(fmt({ month: 'long', year: 'numeric' }).format(parseDay(cursor.value)!)),
)
const yearCaption = computed(() => fmt({ year: 'numeric' }).format(parseDay(cursor.value)!))
const cursorMonth = computed(() => Number(cursor.value.slice(5, 7)) - 1)
const monthNames = computed(() =>
  Array.from({ length: 12 }, (_, m) =>
    // Any year: month names do not change with it.
    cap(fmt({ month: 'short' }).format(new Date(Date.UTC(2026, m, 1)))),
  ),
)
// A month button says its year too: "Mar" alone does not say which March.
const monthLabel = (m: number) =>
  cap(
    fmt({ month: 'long', year: 'numeric' }).format(
      parseDay([cursor.value.slice(0, 4), String(m + 1).padStart(2, '0'), '01'].join('-'))!,
    ),
  )

const firstDay = computed(() => weekStart(locale.value))
// The locale's days of rest: their names in the header are bold in the same ink, and the grid stays
// as it is, so nothing competes with the chosen day, today, a span or the marks. Red, the wall
// calendar's convention, was tried and left: it read as an error beside the danger tone.
const rest = computed(() => new Set(weekend(locale.value)))
const weeks = computed(() => {
  const days = monthGrid(cursor.value, firstDay.value)
  return Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7))
})
const weekdays = computed(() =>
  weeks.value[0]!.map((iso) => {
    const d = parseDay(iso)!
    return {
      short: cap(fmt({ weekday: 'short' }).format(d)),
      long: fmt({ weekday: 'long' }).format(d),
      rest: rest.value.has(d.getUTCDay()),
    }
  }),
)
const longDate = (iso: IsoDay) =>
  fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDay(iso)!)

const DAY =
  'relative flex h-9 w-9 items-center justify-center text-sm/5.5 tabular-nums transition-colors duration-fast focus-visible:z-10'
// A span given backwards is the same span: its ends in order. A half-made one is drawn alone.
const span = computed(() => {
  const r = pending.value ? { from: pending.value, to: '' } : modelSpan.value
  if (!r) return null
  return r.from && r.to && r.from > r.to ? { from: r.to, to: r.from } : r
})
const isEnd = (day: IsoDay) =>
  Boolean(span.value) && (day === span.value!.from || day === span.value!.to)
const isBetween = (day: IsoDay) =>
  Boolean(span.value?.from && span.value?.to) && day > span.value!.from && day < span.value!.to
const isChosen = (day: IsoDay) => day === chosenDay.value || isEnd(day) || isBetween(day)

// Where a waiting span would end on the second press: the pointed day, else the focused one, and
// only a day that press can pick. Drawn, never chosen: its days are not `aria-selected`.
const previewEnd = computed(() => {
  if (!props.range || !pending.value) return ''
  const end = pointed.value || (gridFocus.value ? active.value : '')
  return end && pickable(end) ? end : ''
})
const preview = computed(() => {
  const [a, b] = [pending.value, previewEnd.value]
  if (!b) return null
  return a <= b ? { from: a, to: b } : { from: b, to: a }
})
// The days of a span, both ends counted: the 9th to the 15th is 7.
const daysIn = (r: { from: string; to: string }) =>
  Math.round((parseDay(r.to)!.getTime() - parseDay(r.from)!.getTime()) / 86_400_000) + 1
// The band on screen: the one the next press would make, else the chosen one.
const drawn = computed(() => preview.value ?? span.value)
const inBand = (day: IsoDay) =>
  Boolean(drawn.value?.from && drawn.value?.to) && day > drawn.value!.from && day < drawn.value!.to
const bandEnd = (day: IsoDay) => {
  const r = drawn.value
  if (!r?.from || !r.to || r.from === r.to) return ''
  return day === r.from ? 'rounded-e-none' : day === r.to ? 'rounded-s-none' : ''
}
// The next step while no span is drawn; its length once one is, previewed or picked.
const lengthLine = computed(() => {
  const r = drawn.value
  if (r?.from && r.to) return tp('grani.calendar.days', daysIn(r))
  return t(pending.value ? 'grani.calendar.pickEnd' : 'grani.calendar.pickStart')
})

// Today is ink and weight, not a ring: the focus ring is a box-shadow and would replace it.
function dayClass(day: IsoDay) {
  const allowed = pickable(day)
  // A span is one band: the days inside are square, each end rounds only its outer side.
  // The halo of a focused day stands above its neighbors' band (`focus-visible:z-10` in DAY).
  if (inBand(day))
    return [
      DAY,
      'bg-brand-subtle',
      allowed ? 'text-fg' : 'cursor-not-allowed text-disabled-fg',
      // Struck means taken: a day outside the window is disabled, not struck.
      unavailableSet.value.has(day) ? 'line-through' : '',
    ]
  // The end a press would make is the band's tint in a frame: not filled, since not yet chosen. The
  // frame is an outline, off while the day has the focus: a box-shadow ring would replace the halo.
  if (day === previewEnd.value && day !== pending.value)
    return [
      DAY,
      'rounded-control bg-brand-subtle font-semibold text-fg not-focus-visible:outline not-focus-visible:-outline-offset-1 not-focus-visible:outline-brand',
      bandEnd(day),
    ]
  // A chosen day outside the window is the disabled state, not a faded brand.
  if (day === chosenDay.value || isEnd(day))
    return [
      DAY,
      'rounded-control font-semibold',
      // Out of the window it is still the chosen one: a frame says so where the disabled fill is the
      // surface (dark), an outline off while the focus halo shows.
      allowed
        ? 'bg-brand text-brand-fg'
        : 'bg-disabled-bg text-disabled-fg not-focus-visible:outline not-focus-visible:-outline-offset-1 not-focus-visible:outline-border-strong',
      bandEnd(day),
    ]
  // A day taken (`unavailable`) is struck through: disabled alone would not say why.
  if (!allowed)
    return [
      DAY,
      'rounded-control cursor-not-allowed text-disabled-fg',
      unavailableSet.value.has(day) ? 'line-through' : '',
    ]
  return [
    DAY,
    'rounded-control enabled:hover:bg-surface-muted',
    day === todayIso.value
      ? 'font-semibold text-brand'
      : sameMonth(day, cursor.value)
        ? 'text-fg'
        : 'text-fg-muted',
  ]
}

// Found after the render: a month change rebuilds the rows, and a ref would point at the old cell.
async function focusActive() {
  moving = true
  await nextTick()
  rootRef.value?.querySelector<HTMLElement>('tbody button[tabindex="0"]')?.focus()
  moving = false
}

function moveTo(iso: IsoDay, keepAnchor = false) {
  active.value = iso
  if (!keepAnchor) anchor = Number(iso.slice(8))
  if (!sameMonth(iso, cursor.value)) cursor.value = iso
  focusActive()
}

// The window's months: the arrows and the months view stop at them, nothing opens on a
// month with no day to pick.
const minMonth = computed(() => bounds.value.lo.slice(0, 7))
const maxMonth = computed(() => bounds.value.hi.slice(0, 7))
const monthIn = (key: string) =>
  (!minMonth.value || key >= minMonth.value) && (!maxMonth.value || key <= maxMonth.value)
const monthOpen = (m: number) =>
  monthIn(`${cursor.value.slice(0, 4)}-${String(m + 1).padStart(2, '0')}`)
// A step goes into the window, or toward it from outside: never a dead end on closed months.
const toward = (from: string, to: string, lo: string, hi: string) =>
  ((!lo || to >= lo) && (!hi || to <= hi)) ||
  (Boolean(lo) && from < lo && to > from) ||
  (Boolean(hi) && from > hi && to < from)
function canGo(dir: 1 | -1) {
  if (view.value === 'days')
    return toward(
      cursor.value.slice(0, 7),
      addMonths(cursor.value, dir).slice(0, 7),
      minMonth.value,
      maxMonth.value,
    )
  // Years compare as their months: the window's first and last month bound them.
  const year = Number(cursor.value.slice(0, 4))
  const month = (n: number, mm: string) => [String(n).padStart(4, '0'), mm].join('-')
  const from = dir > 0 ? month(year, '12') : month(year, '01')
  const to = dir > 0 ? month(year + 1, '01') : month(year - 1, '12')
  return toward(from, to, minMonth.value, maxMonth.value)
}

function step(months: number) {
  cursor.value = addMonths(cursor.value, months)
  const to = addMonths(active.value, months, anchor)
  const kept = keepIn(active.value, to)
  active.value = sameMonth(kept, cursor.value) ? kept : to
}

// The arrows page a month, or a year in the months view. The focus stays on the arrow; one
// that turns off at the window's edge hands it to the caption, never to the page.
const captionRef = ref<ComponentPublicInstance | null>(null)
function arrow(dir: 1 | -1) {
  if (view.value === 'days') step(dir)
  else {
    cursor.value = addMonths(cursor.value, 12 * dir)
    active.value = addMonths(active.value, 12 * dir, anchor)
    monthFocus.value = nearestOpen(monthFocus.value)
  }
  if (!canGo(dir)) (captionRef.value?.$el as HTMLElement | undefined)?.focus()
}

function pick(day: IsoDay) {
  if (!pickable(day)) return
  active.value = day
  anchor = Number(day.slice(8))
  // A day of the next month rebuilds the rows: the focus goes with it, not to the body.
  if (!sameMonth(day, cursor.value)) {
    cursor.value = day
    focusActive()
  }
  if (!props.range) return emit('update:modelValue', day)
  if (!pending.value) {
    pending.value = day
    return
  }
  const [from, to] = day < pending.value ? [day, pending.value] : [pending.value, day]
  pending.value = ''
  sent = `${from}|${to}`
  emit('update:modelValue', { from, to })
}

function openMonth(m: number) {
  const iso = [cursor.value.slice(0, 4), String(m + 1).padStart(2, '0'), '01'].join('-')
  cursor.value = iso
  if (!sameMonth(active.value, iso)) active.value = addMonths(iso, 0, anchor)
  view.value = 'days'
  focusActive()
}

// Where ArrowRight goes: on, or back in a page read right to left, where the days and the months
// run from the right and the arrows follow the screen.
const rightward = (e: KeyboardEvent) =>
  getComputedStyle(e.currentTarget as Element).direction === 'rtl' ? -1 : 1

function onKey(e: KeyboardEvent) {
  // A held Enter picks its day once: in a range its repeats would end the range on that same day.
  holdEnter(e)
  // A chord is the browser's: Alt or ⌘ with an arrow goes back a page, Ctrl moves the caret.
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const dow = (parseDay(active.value)!.getUTCDay() - firstDay.value + 7) % 7
  const side = rightward(e)
  const moves: Record<string, () => IsoDay> = {
    ArrowLeft: () => addDays(active.value, -side),
    ArrowRight: () => addDays(active.value, side),
    ArrowUp: () => addDays(active.value, -7),
    ArrowDown: () => addDays(active.value, 7),
    Home: () => addDays(active.value, -dow),
    End: () => addDays(active.value, 6 - dow),
    PageUp: () => addMonths(active.value, e.shiftKey ? -12 : -1, anchor),
    PageDown: () => addMonths(active.value, e.shiftKey ? 12 : 1, anchor),
  }
  const move = moves[e.key]
  if (!move) return
  e.preventDefault()
  // The keys take the band over from a pointer resting on a day.
  pointed.value = ''
  keysLead = true
  const page = e.key.startsWith('Page')
  moveTo(keepIn(active.value, move()), page)
}

// The months view: the shown month is the one stop, arrows move across the 3 × 4 grid.
const monthFocus = ref(0)
// Arrows skip the months out of the window: a disabled button takes no focus.
function nearestOpen(m: number) {
  const open = Array.from({ length: 12 }, (_, i) => i).filter(monthOpen)
  if (!open.length || open.includes(m)) return m
  return open.reduce((best, i) => (Math.abs(i - m) < Math.abs(best - m) ? i : best), open[0]!)
}
async function focusMonth(m: number) {
  m = nearestOpen(m)
  monthFocus.value = m
  // A year with no open month keeps the focus where it is: the arrow toward the window is there.
  if (!monthOpen(m)) return
  await nextTick()
  rootRef.value?.querySelector<HTMLElement>(`[data-month="${m}"]`)?.focus()
}
function toggleView() {
  view.value = view.value === 'days' ? 'months' : 'days'
  if (view.value === 'months') return focusMonth(cursorMonth.value)
  // Back to the days of the month shown: its one tab stop is a day of that month.
  if (!sameMonth(active.value, cursor.value)) active.value = addMonths(cursor.value, 0, anchor)
  focusActive()
}
// Escape in the months view is one step back, to the days; in the days it is the host's.
function onEscape(e: KeyboardEvent) {
  if (view.value !== 'months') return
  e.stopPropagation()
  e.preventDefault()
  toggleView()
}
function onMonthKey(e: KeyboardEvent) {
  // A chord is the browser's: Alt or ⌘ with an arrow goes back a page, Ctrl moves the caret.
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const at = monthFocus.value
  const side = rightward(e)
  const to: Record<string, number> = {
    ArrowLeft: at - side,
    ArrowRight: at + side,
    ArrowUp: at - 3,
    ArrowDown: at + 3,
    Home: 0,
    End: 11,
  }
  if (!(e.key in to)) return
  e.preventDefault()
  focusMonth(Math.min(11, Math.max(0, to[e.key]!)))
}
</script>
