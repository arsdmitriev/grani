<!--
  UiDateCell: a date in a table column, on two lines: the exact value on top, its context under it.
  Take it for any column of dates or times.

  Look. The exact value is in monospace, the context in small capitals, with no rule between them.

  Which leads. `variant` sets which fact goes on top. `time` is for a list within a day: the time
  on top, the day under it. `day` is for a list across months: the full date on top, the time
  under it.

  Context. `context` sets the lower line. `relative` says how long ago (Today, Yesterday, then the
  short day); `weekday` names the day of the week in full. The two lines always carry the whole
  value: under a leading time, the weekday line adds the day; over a weekday line, the leading
  date adds the time.

  Days. A value without a time (`2026-09-24`) is a calendar day: it always leads with the day, and
  no time zone of the app moves it to the day before or after. A day of another year shows its year.
  Today and Yesterday are read on the calendar the digits are shown in: the app's zone
  (`createGrani({ timeZone })`), or the device's without one.

  Times. An ISO day and time with no zone (`2026-09-24T10:00`, or `2026-09-24 10:00:00` as a
  database writes it) is the reading of a clock, read in the app's zone, where it is shown: 10:00
  shows as 10:00 on every device. A reading the clock skips on a spring night (02:30 in New York)
  shows as the hour after the jump, and one it shows twice on an autumn night is its first time, as
  the device takes them. Without the app's zone it is read and shown on the device's clock. A day or
  a time that does not exist (February 30, 25:00) prints a dash. A value with `Z` or an offset, a
  Date and a timestamp are moments, shown in the app's zone.

  Tooltip. The full date shows in a UiTooltip only while the two lines hide it, that is, under a
  leading time over Today or Yesterday.

  Empty. An empty or unreadable value prints the dash a table prints.

  Attributes. They land on the cell's span.

  Keyboard. Not interactive: the cell takes no tab stop, and its tooltip opens on hover and on a
  tap.

  Reader.
  - Lines: read as text in the order they stand: the exact value, then its context.
  - Tooltip: while it shows, the full date in it describes the cell (`aria-describedby`); it shows
    only while the lines hide the date, under a leading time over Today or Yesterday.
  - Empty value: read as the dash.

  States. None of its own: the row and the table carry hover, selection, loading and failure. The
  cell has two leads (`time`, `day`), two contexts (`relative`, `weekday`), a day without a time, a
  time with no zone, a day of another year, and an empty or unreadable value as a dash.

  Not for.
  - An amount: UiMoneyCell.
  - A day to pick: UiDatePicker.
  - A period to filter by: UiDateRange.
  - The moment of an event on a timeline: UiLog's own time.
-->
<template>
  <span v-if="!parsed" v-bind="$attrs">{{ EMPTY }}</span>
  <UiTooltip v-else :content="hidden ? full : ''">
    <span v-bind="$attrs" class="inline-block whitespace-nowrap leading-tight">
      <span class="block font-mono text-xs/4.5 text-fg">{{ exact }}</span>
      <span v-if="contextLine" class="block text-[10px] uppercase tracking-wide text-fg-muted">
        {{ contextLine }}
      </span>
    </span>
  </UiTooltip>
</template>

<script setup lang="ts">
import { useShared } from '../composables/useShared'
import { computed, onMounted, watch } from 'vue'
import { useToday } from '../composables/useToday'
import { useUiT } from '../composables/useUiT'
import type { DateCellContext, DateCellVariant } from '../types/ui'
import { parseDateValue, relativeDayKey, type DateValue } from '../utils/dateValue'
import UiTooltip from './UiTooltip.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** An ISO string with a time or a day alone, a Date, or a timestamp. A time with no zone is read in the app's zone. Empty or unreadable prints a dash. */
    value: DateValue | null | undefined
    /** Which fact leads: `time` on top for a list within a day, `day` on top for a list across months. */
    variant?: DateCellVariant
    /** What the lower line answers: how long ago (`relative`), or which day of the week (`weekday`). */
    context?: DateCellContext
  }>(),
  { variant: 'day', context: 'relative' },
)

const { d, t, timeZone } = useUiT()
const EMPTY = '—'
// One "now" for the server pass and the client's first render, so Today does not flip on
// hydration; every mount moves it to the present, so a long-lived page catches up.
const now = useShared<number>('grani:date-cell-now', () => Date.now())
onMounted(() => {
  now.value = Date.now()
})
// A page left open past midnight: when the day turns, Today becomes Yesterday, as a log's does.
const { now: day } = useToday()
watch(day, () => (now.value = Date.now()))

// A time with no zone is read in the zone it is shown in, so it shows as it came.
const parsed = computed(() => parseDateValue(props.value, timeZone.value))
const leadsWithTime = computed(
  () => props.variant === 'time' && parsed.value !== null && !parsed.value.dateOnly,
)

const time = (date: Date) => d(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
// The year is read in the zone the digits are shown in, not the device's: on New Year's Eve they differ.
const yearIn = (date: Date | number) =>
  new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: timeZone.value || undefined }).format(
    date,
  )
const yearOf = (date: Date): Intl.DateTimeFormatOptions =>
  yearIn(date) === yearIn(now.value) ? {} : { year: 'numeric' }
// The short day carries its year when it is not this year: the year is a fact, not a tooltip.
const shortDay = (date: Date) => d(date, { day: 'numeric', month: 'short', ...yearOf(date) })
// A day without a time is a calendar day, not a moment: it is printed as that day in UTC, so no
// zone of the app moves it to the day before or after.
const dayOnly = (p: { date: Date; dateOnly: boolean }, o: Intl.DateTimeFormatOptions) =>
  p.dateOnly
    ? d(new Date(Date.UTC(p.date.getFullYear(), p.date.getMonth(), p.date.getDate())), {
        ...o,
        timeZone: 'UTC',
      })
    : d(p.date, o)
// Today and Yesterday by the calendar the digits are shown in: the app's zone, or the device's.
const relative = (p: { date: Date; dateOnly: boolean }) =>
  relativeDayKey(p.date, now.value, { timeZone: timeZone.value || undefined, dateOnly: p.dateOnly })
const dayWord = (p: { date: Date; dateOnly: boolean }, fallback: string) => {
  const key = relative(p)
  if (key === 'today') return t('grani.date.today')
  if (key === 'yesterday') return t('grani.date.yesterday')
  return fallback
}

const exact = computed(() => {
  const p = parsed.value
  if (!p) return ''
  if (leadsWithTime.value) return time(p.date)
  const withTime = props.context === 'weekday' && !p.dateOnly
  return dayOnly(p, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
  })
})

// Under a day with no time, the lower line is a relative word or nothing: the short day would repeat the top.
const contextLine = computed(() => {
  const p = parsed.value
  if (!p) return ''
  if (props.context === 'weekday')
    return leadsWithTime.value
      ? d(p.date, { weekday: 'long', day: 'numeric', month: 'short', ...yearOf(p.date) })
      : dayOnly(p, { weekday: 'long' })
  if (leadsWithTime.value) return dayWord(p, shortDay(p.date))
  return p.dateOnly ? dayWord(p, '') : time(p.date)
})

// The lines carry the whole value except under a leading time with a relative word: the digits of the day are then nowhere.
const hidden = computed(() => {
  const p = parsed.value
  return !!p && leadsWithTime.value && props.context !== 'weekday' && relative(p) !== null
})

const full = computed(() => {
  const p = parsed.value
  if (!p) return ''
  return dayOnly(
    p,
    p.dateOnly
      ? { dateStyle: 'long' }
      : { dateStyle: 'long', timeStyle: 'short', hourCycle: 'h23' },
  )
})
</script>
