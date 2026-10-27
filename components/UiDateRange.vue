<!--
  UiDateRange: a toolbar filter by period, with named presets and a custom range. Take it in a
  table toolbar to narrow a list by dates.

  Button. The button shows the days ("Aug 1 – 31"), with the year only when it is not this year.
  A whole year shows as the year ("2025"), and no bounds show as All time. One bound reads "From
  Aug 1" or "Until Aug 31". The button is as wide as its widest named period, so picking among
  them never moves the row.

  Panel. The panel is a UiPopover with a list edge to edge, as in UiSelect, from the shortest
  period to the longest: Today, Yesterday, This week, Last 7 days, then the months with Last 30
  days among them, then the years and All time. The chosen preset is checked
  in the list. Each preset shows the days or the months it covers, a week from the day the
  language's week starts; a pick applies it and closes the panel. "Custom range…", under a line,
  turns the panel into a calendar on the current span. The first day picked starts a span; the
  second ends it, applies it as `custom` and closes the panel. The row above the calendar goes back
  to the list. No fields appear beside the button, so the toolbar keeps its width.

  Window. `min` and `max` bound what can be picked: a preset partly outside them is cut at the
  bound ("This month" with `max` today runs to today), one wholly outside is disabled, and the
  calendar stops at them. All time stays no bounds.

  Stepper. `stepper` puts two arrows before the button that move the period back and forward by
  its own length: a month or a quarter by whole months, a week or a custom span by its days. They
  stand before it, so at the start of a row (a toolbar's `#start`) a longer label, a week across
  the turn of the year, never moves them from under the pointer. The step
  lands on a preset's name when it matches one, so stepping forward from last month gives This
  month, which rolls with today; where two presets share the days, the one the period last had
  wins. An arrow is disabled when there is nowhere to go: All time, one bound, or past the window.
  A step the window cuts keeps only the days inside it, and the next step moves by those. A step
  counts from the model, so a host that applies it late takes two quick presses as one.

  Model. One `v-model` holds what a URL carries, `{ from, to, preset }` (`DateRangeValue`): ISO
  days, `null` for no bound, and the named preset, `null` for none. A pick sends the whole period
  at once. A named preset wins over its days: in the browser its days are counted again from
  today, so "Last month" opened next month shows the new last month. `custom` keeps its days. With
  no `preset`, the days decide: days mean `custom`, no days mean All time. For a query,
  `periodBounds(value, { timeZone, locale, min, max })` gives the moments the period covers, its
  last day whole by the app's clock, a named preset counted from today as the button shows it, on
  the server too: ask for `at >= start && at < end`.

  Placement. In a table toolbar, beside the search, UiFilter and UiTableColumns; or in a form under
  a UiField label.

  Field. Inside UiField the field's label is its name, read before the days, for the button, its
  panel and the arrows' group; a click on the label opens the panel. The field's id, error and
  words reach the button.

  Disabled. `disabled` turns off the button and both arrows, and closes the panel if it is open.

  Keyboard.
  On the button:
  - `Tab`: reaches it.
  - `Enter` `Space`: open the panel on the list, with the chosen preset highlighted.
  On an arrow (`stepper`):
  - `Tab`: reaches them, before the button.
  - `Enter` `Space`: move the period; the focus stays on the arrow, or goes to the button when the
    arrow turns off at the window's end.
  In the list:
  - `ArrowDown` `ArrowUp`: move, passing over a preset outside the window.
  - `Home` `End`: jump.
  - `Enter` `Space`: apply the preset and close the panel.
  - `ArrowDown`: past the last preset, reaches "Custom range…".
  On "Custom range…":
  - `ArrowUp`: goes back to the list.
  - `Enter` `Space`: open the calendar with the focus on its day.
  In the calendar, which takes UiCalendar's keys and picks the span:
  - `Enter` `Space`: on the row above it, go back to the list, on the custom row.
  Anywhere in the panel:
  - `Escape`: closes the panel and returns the focus to the button, as a pick does; a half-picked
    span is dropped on close.

  Reader.
  - Button: its name comes before its days, "Period, Aug 1 – 31", or `ariaLabel` in its place, or
    the field's label inside UiField, with `aria-haspopup` and `aria-expanded`.
  - Panel: a dialog with the same name.
  - Presets: a listbox with that name, each option with the days or months it covers, the chosen
    one selected and one outside the window disabled.
  - Custom row: marked as the current choice (`aria-current`), and its days describe it.
  - Calendar: a live region says "Choose the first day", then "Now choose the last day".
  - Row above the calendar: named "Custom range, back to the list".
  - Arrows: named "Previous period" and "Next period", in a group with the button's name ("Issued,
    group"), so two on one page are told apart; after a step the new days are said, since the
    focus stays on the arrow.

  States. A named preset, a custom span, one bound ("From Aug 1", "Until Aug 31"), a whole year, All
  time; the list open, the calendar with a first day picked; a period set from outside while the
  panel is open, which moves the highlight and drops a half pick; presets cut by the window and one
  disabled outside it; the arrows, one disabled at the window's end; the whole control disabled;
  the button at `xs`, `sm` and `md`.

  Not for.
  - One date in a form: UiDatePicker.
  - A day alone on a page: UiCalendar.
  - Filters by other dimensions: UiFilter.
  - A date in a column: UiDateCell.
-->
<template>
  <component
    :is="stepper ? 'div' : Bare"
    v-bind="
      stepper
        ? {
            'data-grani': '',
            role: 'group',
            'aria-labelledby': named,
            class: [rootClass, 'inline-flex max-w-full gap-1'],
            style: rootStyle,
          }
        : {}
    "
  >
    <UiIconButton
      v-if="stepper"
      :icon="ChevronLeft"
      variant="outline"
      :size="ladder"
      :ariaLabel="t('grani.dateRange.prevPeriod')"
      :disabled="!back || disabled"
      data-step="prev"
      @click="move(back, $event)"
    />
    <UiIconButton
      v-if="stepper"
      :icon="ChevronRight"
      variant="outline"
      :size="ladder"
      :ariaLabel="t('grani.dateRange.nextPeriod')"
      :disabled="!forth || disabled"
      data-step="next"
      @click="move(forth, $event)"
    />
    <UiPopover v-model:open="open" :align="align" :labelledby="named">
      <template #trigger>
        <UiButton
          v-bind="control"
          :id="id"
          ref="buttonRef"
          data-field
          :class="stepper ? 'min-w-0' : rootClass"
          :data-invalid="invalid || undefined"
          :style="stepper ? undefined : rootStyle"
          variant="outline"
          :size="ladder"
          :disabled="disabled"
          :aria-labelledby="
            field?.labelId.value
              ? `${field.labelId.value} ${daysId}`
              : (control['aria-labelledby'] as string | undefined)
          "
          :aria-invalid="aria['aria-invalid']"
          :aria-describedby="aria['aria-describedby']"
        >
          <CalendarRange />
          <!-- A button takes no aria-required: a required field says it here, in words. -->
          <span v-if="required" :id="requiredId" hidden>{{ t('grani.field.required') }}</span>
          <span :id="nameId" class="sr-only">{{ ariaLabel || t('grani.dateRange.presets') }}</span>
          <!-- The days stand over the widest named period: picking one never widens the button. In
               a column narrower than that, they are cut, and shown whole in a tooltip. -->
          <span class="grid min-w-0 text-start [&>*]:col-start-1 [&>*]:row-start-1 [&>*]:truncate">
            <UiTruncate :id="daysId" :text="label" />
            <span v-for="w in sizers" :key="w" data-sizer aria-hidden="true" class="invisible">{{
              w
            }}</span>
          </span>
          <ChevronDown />
        </UiButton>
      </template>
      <template #default="{ close }">
        <template v-if="step === 'list'">
          <ul
            ref="listRef"
            role="listbox"
            tabindex="0"
            :aria-label="
              field?.labelId.value ? undefined : ariaLabel || t('grani.dateRange.presets')
            "
            :aria-labelledby="field?.labelId.value"
            :aria-activedescendant="active >= 0 ? optionId(active) : undefined"
            data-list-top
            data-list-bottom
            class="relative min-w-60 overflow-y-auto text-sm/5.5 focus:outline-hidden"
            :class="bleed"
            :style="{ maxHeight: listHeight }"
            @keydown="onListKey($event, close)"
          >
            <PanelRow
              v-for="(p, index) in RANGE_PRESETS"
              :id="optionId(index)"
              :key="p"
              purpose="option"
              role="option"
              :aria-selected="current === p"
              :aria-disabled="outside(p) || undefined"
              :disabled="outside(p)"
              :label="t(KEY[p])"
              :note="months(p)"
              numeric
              :mark="current === p"
              :active="index === active"
              @pointermove="outside(p) || (active = index)"
              @click="applyPreset(p, close)"
            />
          </ul>
          <UiSeparator />
          <PanelRow
            key="custom"
            ref="customRef"
            purpose="option"
            as="button"
            data-list-top
            data-list-bottom
            class="w-auto"
            :class="bleed"
            :label="t('grani.dateRange.customPick')"
            :note="current === 'custom' ? customDays : ''"
            :note-id="customNoteId"
            numeric
            :aria-describedby="current === 'custom' ? customNoteId : undefined"
            :aria-current="current === 'custom' || undefined"
            @keydown.up.prevent="focusList(RANGE_PRESETS.length - 1)"
            @click="openCalendar"
          >
            <template #end>
              <Check
                v-if="current === 'custom'"
                aria-hidden="true"
                class="h-4 w-4 shrink-0 text-fg-muted"
              />
              <ChevronRight v-else aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-muted" />
            </template>
          </PanelRow>
        </template>
        <template v-else>
          <PanelRow
            key="back"
            ref="backRef"
            purpose="option"
            as="button"
            data-list-top
            data-list-bottom
            class="font-medium"
            :class="bleed"
            :label="t('grani.dateRange.custom')"
            :aria-label="t('grani.dateRange.backToList')"
            @click="backToList"
          >
            <template #start>
              <ChevronLeft aria-hidden="true" class="h-4 w-4 shrink-0 text-fg-muted" />
            </template>
          </PanelRow>
          <UiSeparator />
          <UiCalendar
            range
            :min="win.lo"
            :max="win.hi"
            :model-value="shownSpan"
            @update:model-value="pickSpan($event as DateSpan, close)"
          />
        </template>
      </template>
    </UiPopover>
  </component>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { computed, nextTick, ref, useId, watch, type FunctionalComponent } from 'vue'
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from '@lucide/vue'
import type { ControlSize, DateRangeValue, DateSpan } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { useToday } from '../composables/useToday'
import { useVisibleRows } from '../composables/useVisibleRows'
import { addDays, addMonths, dayWindow, parseDay, weekStart } from '../utils/calendar'
import { announce } from '../utils/announce'
import { isDev } from '../utils/dev'
import {
  cutToWindow,
  presetDays,
  RANGE_PRESETS,
  rangeFor,
  type RangePreset,
} from '../utils/dateRange'
import type { GraniMessageKey } from '../i18n/en'
import { usePanelList } from '../utils/panelList'
import { BLEED } from '../utils/surface'
import { useSplitAttrs } from '../utils/attrs'
import { useFieldControl } from '../utils/field'
import PanelRow from './PanelRow.vue'
import UiButton from './UiButton.vue'
import UiCalendar from './UiCalendar.vue'
import UiIconButton from './UiIconButton.vue'
import UiPopover from './UiPopover.vue'
import UiSeparator from './UiSeparator.vue'
import UiTruncate from './UiTruncate.vue'

const props = withDefaults(
  defineProps<{
    /** The period (`v-model`): `from` and `to` as `YYYY-MM-DD`, `null` for no bound, and `preset`, the named period or `custom` for days picked on the calendar. A named one wins over the days: they are counted again from today. A `null` preset makes days `custom` and none All time. */
    modelValue?: DateRangeValue | null
    /** Own id of the button, for a label elsewhere. Inside UiField, the field's id takes precedence. */
    id?: string
    /** Which edge of the button the panel lines up with. */
    align?: 'start' | 'center' | 'end'
    /** What the button filters by, read before the days: "Period" by default, "Paid" for a column of payment days. */
    ariaLabel?: string
    /** Step of the control ladder, as the rest of the toolbar row. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
    /** The first day a period can reach, inclusive: a preset partly before it is cut there, one wholly before it is disabled. */
    min?: string
    /** The last day a period can reach, inclusive: a preset partly after it is cut there, one wholly after it is disabled. */
    max?: string
    /** Two arrows before the button that move the period back or forward by its own length: a month by a month, a week by seven days. */
    stepper?: boolean
    /** The period cannot be changed: the button and the arrows are off, and an open panel closes. */
    disabled?: boolean
  }>(),
  { modelValue: null, align: 'start', stepper: false, disabled: false },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** The whole period at once: a preset, a span picked on the calendar (`custom`), or a named preset counted again from today. */
  'update:modelValue': [value: DateRangeValue]
}>()

// The model's parts; an empty string from a hand-edited URL reads as no bound.
const from = computed(() => props.modelValue?.from || '')
const to = computed(() => props.modelValue?.to || '')
const preset = computed(() => props.modelValue?.preset ?? undefined)

const { t, locale } = useUiT()
const { now, mark } = useToday()
// A preset's days from a day: its week starts where the locale's week does.
const firstDay = computed(() => weekStart(locale.value))
const ownDays = (p: RangePreset, day = now.value) => rangeFor(p, day, firstDay.value)
// The window, read once: a malformed bound is no bound (said in dev); bounds given backwards are
// the same window.
const win = computed(() => dayWindow(props.min, props.max))
if (isDev())
  watch(
    () => [props.min, props.max] as const,
    ([min, max]) => {
      for (const [name, v] of [
        ['min', min],
        ['max', max],
      ] as const)
        if (v && !parseDay(v))
          console.warn(`[grani] UiDateRange: ${name} is not a YYYY-MM-DD day; it is ignored.`)
    },
    { immediate: true },
  )
// The days of a span inside the window; `null` when none of them is inside. All time stays no
// bounds: the window limits what can be picked, not what is asked for.
const cut = (r: { from: string; to: string }) => cutToWindow(r, win.value)
// A preset's days as it applies them, the same `periodBounds` queries: cut by the window. One wholly
// outside it keeps its own days, for a model set to it from outside; its row cannot be picked.
const daysFor = (p: RangePreset, day = now.value) =>
  presetDays(p, day, { firstDay: firstDay.value, min: win.value.lo, max: win.value.hi })
const outside = (p: RangePreset) => cut(ownDays(p)) === null

const KEY: Record<RangePreset, GraniMessageKey> = {
  today: 'grani.dateRange.today',
  yesterday: 'grani.dateRange.yesterday',
  this_week: 'grani.dateRange.this_week',
  last_7_days: 'grani.dateRange.last_7_days',
  last_30_days: 'grani.dateRange.last_30_days',
  this_month: 'grani.dateRange.this_month',
  prev_month: 'grani.dateRange.prev_month',
  prev_2_months: 'grani.dateRange.prev_2_months',
  '3_months': 'grani.dateRange.3_months',
  '6_months': 'grani.dateRange.6_months',
  this_year: 'grani.dateRange.this_year',
  prev_year: 'grani.dateRange.prev_year',
  all: 'grani.dateRange.all',
  custom: 'grani.dateRange.custom',
}

defineOptions({ inheritAttrs: false })
const { rootClass, rootStyle, control } = useSplitAttrs()

// The rows run over the popover's own gutter to its edges, whatever card the button stands in.
const bleed = BLEED.overlay
const uid = useId()
const optionId = (i: number) => `${uid}-o${i}`
const customNoteId = `${uid}-custom`
// The button shows the days alone; a screen reader hears the name first ("Period, Aug 1 – 31"), and the panel takes it.
const nameId = `${uid}-name`
const daysId = `${uid}-days`
// Inside a UiField the field's label is that name, for the button, the panel and its list, and the
// field's id, error, required and words reach the button.
const requiredId = `${uid}-required`
const { field, id, invalid, required, aria } = useFieldControl(() => ({ id: props.id }), {
  after: () => [required.value ? requiredId : undefined],
})
const named = computed(() => field?.labelId.value ?? nameId)

const utc = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale.value, { ...opts, timeZone: 'UTC' })
const isWholeYear = (from: string, to: string) =>
  from.slice(5) === '01-01' && to.slice(5) === '12-31' && from.slice(0, 4) === to.slice(0, 4)
// The days of a span, the year left out when it is this year: "Aug 1 – 31", "Dec 1, 2025 – Jan 31".
function daysOf(start: string, end: string) {
  // One bound says which end it is: "From Aug 1", "Until Aug 31".
  if (!start !== !end) {
    const day = parseDay(start || end)
    if (!day) return ''
    const own = (start || end).slice(0, 4) === now.value.slice(0, 4)
    const text = plainSpaces(
      utc({ day: 'numeric', month: 'short', ...(own ? {} : { year: 'numeric' }) }).format(day),
    )
    return t(start ? 'grani.dateRange.since' : 'grani.dateRange.until', { day: text })
  }
  // A span given backwards (a hand-edited URL) reads as the same span, as the calendar shows it.
  const [from, to] = start > end ? [end, start] : [start, end]
  const a = parseDay(from)
  const b = parseDay(to)
  if (!a || !b) return ''
  if (isWholeYear(from, to)) return from.slice(0, 4)
  const thisYear = now.value.slice(0, 4)
  const own = from.slice(0, 4) === thisYear && to.slice(0, 4) === thisYear
  return plainSpaces(
    utc({ day: 'numeric', month: 'short', ...(own ? {} : { year: 'numeric' }) }).formatRange(a, b),
  )
}
// What a preset covers, in months: "Aug", "Jul – Sep", "2025"; all time covers no months. A
// period of days or weeks says its days: "Oct 21", "Oct 19 – 25".
function months(p: RangePreset) {
  const r = daysFor(p)
  const a = parseDay(r.from)
  const b = parseDay(r.to)
  if (!a || !b) return ''
  if (isWholeYear(r.from, r.to)) return r.from.slice(0, 4)
  if (r.from.slice(8) !== '01' || addDays(r.to, 1).slice(8) !== '01') return daysOf(r.from, r.to)
  // Across the turn of the year "Aug – Jan" reads as one year: the years are said then.
  const thisYear = now.value.slice(0, 4)
  const own = r.from.slice(0, 4) === thisYear && r.to.slice(0, 4) === thisYear
  return plainSpaces(utc({ month: 'short', ...(own ? {} : { year: 'numeric' }) }).formatRange(a, b))
}
// The server's ICU and the browser's space a range differently (thin or plain); one plain space
// keeps the page that was rendered the page that runs.
function plainSpaces(text: string) {
  return text.replace(/[\u2009\u202f]/g, ' ')
}

// The preset the model means: the one given, else what its days say.
const current = computed<RangePreset>(
  () => preset.value ?? (from.value || to.value ? 'custom' : 'all'),
)
// The days the period covers: a named preset's own, counted from today, so the button is right
// before the model catches up (a model that keeps only the preset); a custom span's as given.
const shown = computed(() =>
  preset.value && preset.value !== 'custom'
    ? daysFor(preset.value)
    : { from: from.value, to: to.value },
)
const shownSpan = computed<DateSpan>(() => ({
  from: shown.value.from || null,
  to: shown.value.to || null,
}))
// The days alone: a name ("6 months") beside them says it twice and widens the toolbar.
const label = computed(
  () =>
    daysOf(shown.value.from, shown.value.to) ||
    t(current.value === 'custom' ? 'grani.dateRange.custom' : 'grani.dateRange.all'),
)
const customDays = computed(() => daysOf(shown.value.from, shown.value.to))
// Every named period's days from today, and the words: the button is as wide as the widest. A
// custom span of another year can still be wider, and then the button grows toward the row's end;
// the arrows stand before it, so they stay under the pointer.
const sizers = computed(() => [
  ...new Set([
    ...RANGE_PRESETS.map((p) => {
      const r = daysFor(p)
      return daysOf(r.from, r.to)
    }).filter(Boolean),
    t('grani.dateRange.all'),
    t('grani.dateRange.custom'),
  ]),
])

const open = ref(false)
// A control turned off closes the panel it was choosing in: a pick cannot land after.
watch(
  () => props.disabled,
  (off) => {
    if (off) open.value = false
  },
)
const step = ref<'list' | 'calendar'>('list')
const listRef = ref<HTMLElement | null>(null)
const { maxHeight: listHeight } = useVisibleRows(listRef, '[role=option]', () => [
  open.value,
  step.value,
])
// The list shows five rows: the one the keys move to is scrolled into the list, never the page,
// and a row under the pointer is not moved from under it.
const { active, firstEnabled, keys, scrollToActive } = usePanelList({
  items: () => RANGE_PRESETS,
  disabled: outside,
  row: (i) => (i >= 0 ? document.getElementById(optionId(i)) : null),
  list: () => listRef.value,
})
const scrollLater = () => void nextTick(scrollToActive)
const customRef = ref<InstanceType<typeof PanelRow> | null>(null)
const backRef = ref<InstanceType<typeof PanelRow> | null>(null)
const el = (r: InstanceType<typeof PanelRow> | null) => r?.$el as HTMLElement | undefined
// Every open starts on the list, the chosen preset highlighted. A half-made span lives in the
// calendar, which closes with the panel and drops it.
watch(open, (v) => {
  if (!v) return
  step.value = 'list'
  active.value = presetIndex()
  // A preset low in the list (Last year, All time) opens in view, not under the cut.
  scrollLater()
})
// The highlight follows the chosen preset, also when it changes from outside while open. A custom
// span, or a preset the window shuts out, highlights nothing, so the keys start from a row they can
// pick and Enter does not swap a custom span for the first preset.
const presetIndex = () => {
  const i = RANGE_PRESETS.indexOf(current.value as (typeof RANGE_PRESETS)[number])
  return i >= 0 && !outside(RANGE_PRESETS[i]!) ? i : -1
}
watch(current, () => {
  if (!open.value) return
  active.value = presetIndex()
  scrollLater()
})
// A named preset is counted from today once the page runs, and again when the day turns, the
// window moves or the language starts its week elsewhere: its days in the model are brought to it.
// `mark` is empty on the server, so nothing is asked there.
watch(
  () =>
    [
      mark.value,
      preset.value,
      from.value,
      to.value,
      win.value.lo,
      win.value.hi,
      firstDay.value,
    ] as const,
  ([day, p]) => {
    if (!day || !p || p === 'custom') return
    const r = daysFor(p, day)
    // The answer to our own update is not asked again, so a model that does not keep the days hears
    // one update, not one per change; a model put back on other days later is asked afresh.
    const answered = said === key(r.from, r.to, p)
    said = ''
    if ((r.from !== from.value || r.to !== to.value) && !answered) set(r.from, r.to, p)
  },
)

// The period last reported, so the watcher above tells its answer from a new model.
let said = ''
const key = (a: string, b: string, p: RangePreset) => `${a}|${b}|${p}`
function set(a: string, b: string, p: RangePreset) {
  said = key(a, b, p)
  emit('update:modelValue', { from: a || null, to: b || null, preset: p })
}

function applyPreset(p: RangePreset, close: () => void) {
  if (outside(p)) return
  const r = daysFor(p)
  set(r.from, r.to, p)
  close()
}

function focusList(index: number) {
  active.value = index
  listRef.value?.focus()
  scrollLater()
}

function onListKey(e: KeyboardEvent, close: () => void) {
  // Down past the last preset reaches Custom range, under the line; up from no highlight (a
  // custom span) starts at the first preset the window lets through.
  if (e.key === 'ArrowDown' && active.value >= RANGE_PRESETS.length - 1) {
    e.preventDefault()
    el(customRef.value)?.focus()
  } else if (e.key === 'ArrowUp' && active.value < 0) {
    e.preventDefault()
    active.value = firstEnabled(0, 1)
    scrollLater()
  } else if (keys(e)) return
  else if ((e.key === 'Enter' || e.key === ' ') && active.value >= 0) {
    e.preventDefault()
    applyPreset(RANGE_PRESETS[active.value]!, close)
  }
}

// The calendar opens on the current span; the focus goes to its focused day.
async function openCalendar() {
  step.value = 'calendar'
  await nextTick()
  el(backRef.value)?.parentElement?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
}
async function backToList() {
  step.value = 'list'
  await nextTick()
  el(customRef.value)?.focus()
}

// The period an arrow reaches. Whole months move by their count, so a month stays a month and a
// quarter a quarter; any other span moves by its length in days. A named preset moves from its own
// days, not the ones the window cut, so This month cut at today steps back to all of September.
// The result is cut by the window, `null` when nothing of it is inside, and named when it is a
// preset's days: a step forward from the month before lands on This month, which rolls with today.
function stepFrom(dir: 1 | -1): DateRangeValue | null {
  const p = current.value
  if (p === 'all') return null
  const [a, b] = p === 'custom' ? [from.value, to.value].sort() : [ownDays(p).from, ownDays(p).to]
  if (!a || !b || !parseDay(a) || !parseDay(b)) return null
  const after = addDays(b, 1)
  let next: { from: string; to: string }
  if (a.slice(8) === '01' && after.slice(8) === '01') {
    const n = (+after.slice(0, 4) - +a.slice(0, 4)) * 12 + (+after.slice(5, 7) - +a.slice(5, 7))
    const start = addMonths(a, dir * n)
    next = { from: start, to: addDays(addMonths(start, n), -1) }
  } else {
    const n = Math.round((Date.parse(after) - Date.parse(a)) / 86_400_000)
    next = { from: addDays(a, dir * n), to: addDays(b, dir * n) }
  }
  const span = cut(next)
  if (!span) return null
  const named = RANGE_PRESETS.filter((q) => {
    const r = daysFor(q)
    return r.from === span.from && r.to === span.to
  })
  // Two presets can share the days (Last 7 days and an English week, on a Saturday): the one the
  // period last had wins, so a step back and forth comes home under its own name.
  const name = lastNamed.value && named.includes(lastNamed.value) ? lastNamed.value : named[0]
  return { ...span, preset: name ?? 'custom' }
}
const lastNamed = ref<(typeof RANGE_PRESETS)[number] | null>(null)
watch(
  preset,
  (p) => {
    if (p && p !== 'custom') lastNamed.value = p
  },
  { immediate: true },
)
const back = computed(() => (props.stepper ? stepFrom(-1) : null))
const forth = computed(() => (props.stepper ? stepFrom(1) : null))
// The focus stays on the arrow, so the new days are said: the button that shows them is not read.
// An arrow that turns off with its step, at the window's end, hands the focus to the period button
// after them, as a pager's arrow does.
async function move(to: DateRangeValue | null, e: MouseEvent) {
  if (!to) return
  const pressed = e.currentTarget as HTMLButtonElement | null
  set(to.from ?? '', to.to ?? '', to.preset as RangePreset)
  announce(daysOf(to.from ?? '', to.to ?? ''))
  await nextTick()
  if (pressed?.disabled) (buttonRef.value?.$el as HTMLElement | undefined)?.focus()
}
const buttonRef = ref<InstanceType<typeof UiButton> | null>(null)

// With the arrows the three stand in one box, which takes the caller's class and style; without
// them the button stands alone, wrapped in nothing.
const Bare: FunctionalComponent = (_, { slots }) => slots.default?.()

// The calendar sends a span when it is whole: two days, already in order.
function pickSpan(span: DateSpan, close: () => void) {
  set(span.from ?? '', span.to ?? '', 'custom')
  close()
}
</script>
