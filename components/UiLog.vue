<!--
  UiLog: the history of a record on a timeline, newest first. Take it as the last section of a
  record's drawer or page.

  The app's part. It sorts `items` newest first (an unsorted log repeats its day headings), keys
  the log per record (`:key="record.id"`), so a filter or a failed "older" of one record does not
  stay on the next, and returns the promise from `@more` and `@retry`, which is what holds their
  buttons.

  Event. Each event is a node with who did what to what ("Anna changed Status"), when, and the
  value before and after. One field reads on its own line ("Status Waiting → Approved", a status in
  badges); several fields stand in a small table (field, was, became). Words that came with the
  event, such as a reason to decline, stand under it. An event with no one behind it (`actor:
  null`, a release in a changelog) opens with what was done; an unset actor is the system.
  `anchor` gives the event's row an id, so a link can point at it.

  Node. The node is a dot in the event's tone, or, with `node="actor"`, the face of who did it, for
  a log where the person matters most.

  Timeline. A line joins the nodes, so it is a timeline, not a list of rows, and does not stand on
  UiListItem.

  Placement. The last section of a record's drawer or page, after its form and its card of
  facts (UiListItem rows). It only tells, so a drawer level that ends in it has no footer.

  Filters. `filters` offers a choice over the list by the events' `kind`, "All" first: one kind
  at a time, so it is a choice, not toggles. Up to three kinds stand as a segmented choice; four
  or more go into a select, so the filter never runs past the card. A filter that leaves nothing loaded says so
  and offers "Show all".

  Load. While the first page comes (`loading` with no events) the log draws rows in the shape of
  events, a node and a line of text, so nothing moves when they arrive. A failed first load
  (`failed`) says so with Retry, which calls `@retry` and is held while its promise runs. No events
  is said, not left blank. With events in view, `loading` is a refresh: they stay, dimmed and
  busy, and "Load older events" waits; `failed` leaves them and says so under them, with Retry. The
  states stand on UiNoData and UiSkeleton, as every data state of the library does.

  Older events. `hasMore` with `@more` ends the list in "Load older events", held while the promise runs.
  A failed load says so under the list and leaves the button to retry. When older events arrive,
  what was on screen stays in place and the count that came is said.

  Days. When every event's `at` is a Date, the events stand under their days: "Today",
  "Yesterday", then the weekday and the date, with the year when it is not this one. Each event
  then reads its hour alone, and the timeline runs on through the headings: one history. It is
  decided over all of `items`, so a filter never turns the headings on or off. A time given as a
  string cannot be told apart by day, so such a log keeps every date on its line: the hour for
  today, the date otherwise. A Date that is no moment reads "—" under the day before it.

  Time. The exact moment is in the time's title, in the app's time zone
  (`createGrani({ timeZone })`). Set the zone, or the server and the browser may show different
  hours and days.

  Rhythm. 24 between events, 8 inside one, so where an event ends reads at a glance.

  Values. A value is never cut: a long one wraps. A `from` or `to` that is `null` or an empty text
  is no value: no `from` reads as set, no `to` as cleared; a 0 is a value. In a table of changes
  an arrow stands between what it was and what it became, as on one line; in a card too narrow for
  three columns each row stands as a stack, the field over the pair, so a long value keeps the
  card's width. Among faces (`node="actor"`) the system has a plate of a face's size with a glyph.

  Keyboard.
  The filter is a segmented UiRadioGroup, or a UiSelect past three kinds; "Show all", "Load older
  events" and Retry are buttons; the events take no tab stop.
  - `Tab`: reaches the filter, then goes on to "Show all", Retry or "Load older events".
  - `ArrowLeft` `ArrowRight`: move the segmented filter from kind to kind; the select opens on
    its own keys.
  - `Enter` `Space`: press the button.
  When "Load older events" disappears under the focus, the focus goes to the first new event, else
  the last event shown, else the filter, never to the page; so does a Retry that brought the
  history, whether the app draws it before or after its promise ends, and a Retry that failed
  again hands it to the new Retry. A refresh leaves the focus on "Load older events", which waits.

  Reader.
  - List: named by `ariaLabel` when no heading names it.
  - Event: read as its words: who did what to what, and when; with no one named, what to what.
  - Days: each day is an item of the log, its events a list named by its heading.
  - One change: reads "Status Waiting became Approved" (the arrow is hidden and "became" is said
    in its place).
  - Several changes: stand in a table named "Changes" with the columns Field, Previous value and
    New value; the arrows between them are hidden.
  - Filter: a radiogroup, or a combobox past three kinds, named "Show events", the kind that is
    on chosen.
  - Older events: a status region says how many came ("3 older events loaded"), once: a refresh or
    another kind shown lets it go.
  - Failed load: an alert under the list; a failed first load is an alert with Retry.
  - First load: a status says the history is loading; the rows in its shape are hidden.

  States. Events under their days or with their dates, as dots in their tone or as faces, the
  system's plate among faces, an event with no one named, one change on a line, several in a
  table, a note; filters with the kind that is on; `hasMore` with "Load older events", held while the promise runs,
  failed with its line and the button left to retry, and the loaded count said; nothing yet
  (`empty`), and a filter that leaves nothing loaded, with "Show all"; the first load (`loading`),
  and a first load that failed (`failed`), with Retry held while it runs.

  Not for.
  - The facts of a record: UiListItem rows in a UiList.
  - A list of records: UiTable.
  - A request answered: a toast of UiToaster.
  - A timeline the person edits: never; it only tells.
-->
<template>
  <div ref="rootRef" class="flex min-w-0 flex-col gap-4" :class="rootClass" :style="rootStyle">
    <!-- One kind at a time: a segmented choice for a few, a select for more, so it never runs
         past the card; a reader hears one of a few, not a toggle. -->
    <UiSelect
      v-if="ready && filters.length > SEGMENTS"
      :model-value="filter || ALL"
      :items="kinds.map((f) => ({ value: f.value || ALL, label: f.label }))"
      :aria-label="t('grani.log.filters')"
      class="w-48 max-w-full self-start"
      @update:model-value="(v) => (filter = v === ALL ? '' : String(v))"
    />
    <UiRadioGroup
      v-else-if="ready && filters.length"
      :model-value="filter || ALL"
      variant="segmented"
      size="xs"
      :aria-label="t('grani.log.filters')"
      class="self-start"
      @update:model-value="(v) => (filter = v === ALL ? '' : String(v))"
    >
      <UiRadio v-for="f in kinds" :key="f.value || ALL" :value="f.value || ALL">
        {{ f.label }}
      </UiRadio>
    </UiRadioGroup>
    <!-- The first load: rows in the shape of events, so nothing moves when they come. -->
    <ol v-if="firstLoad" aria-hidden="true" class="flex min-w-0 flex-col" data-skeleton>
      <li
        v-for="(width, i) in SKELETON_WIDTHS"
        :key="i"
        class="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3"
        :class="i < SKELETON_WIDTHS.length - 1 ? 'pb-6' : ''"
      >
        <span
          v-if="i < SKELETON_WIDTHS.length - 1"
          class="absolute bottom-0 start-[0.6875rem] top-7 w-0.5 bg-border"
        />
        <span class="flex h-6 w-6 items-center justify-center">
          <UiSkeleton class="h-2.5 w-2.5 rounded-pill" />
        </span>
        <span class="flex flex-col gap-2 pt-0.5 text-sm/5.5">
          <span class="block"
            ><UiSkeleton class="inline-block h-3 align-middle" :class="width"
          /></span>
          <!-- The first row holds a second line, as an event with a change does. -->
          <span v-if="i === 0" class="block">
            <UiSkeleton class="inline-block h-3 w-2/5 align-middle" />
          </span>
        </span>
      </li>
    </ol>
    <UiNoData v-else-if="firstFailed" tone="danger" size="sm" :description="t('grani.log.failed')">
      <template #media><TriangleAlert /></template>
      <template #actions>
        <UiButton variant="secondary" size="sm" :loading="retrying" @click="retry">
          {{ t('grani.log.retry') }}
        </UiButton>
      </template>
    </UiNoData>
    <UiNoData
      v-else-if="!shown.length && items.length && filter"
      size="sm"
      :description="t('grani.log.noMatch')"
    >
      <template #actions>
        <UiButton variant="secondary" size="sm" @click="filter = ''">
          {{ t('grani.log.showAll') }}
        </UiButton>
      </template>
    </UiNoData>
    <UiNoData v-else-if="!shown.length" size="sm" :description="empty || t('grani.log.empty')" />
    <!-- A refresh keeps the events in view, dimmed and busy, never a skeleton over them. -->
    <ol
      v-else
      ref="listRef"
      v-bind="control"
      class="flex min-w-0 flex-col transition-opacity"
      :class="loading ? 'opacity-60' : ''"
      :aria-busy="loading || undefined"
      :aria-label="ariaLabel || undefined"
    >
      <!-- Events with a Date stand under their day; the line runs on through the headings. -->
      <template v-if="days">
        <li v-for="(g, gi) in days" :key="`${g.key}-${gi}`">
          <div class="relative pb-2 ps-9 text-xs/4.5 font-semibold text-fg-muted">
            <span
              v-if="gi > 0"
              aria-hidden="true"
              class="absolute bottom-0 start-[0.6875rem] top-0 w-0.5 bg-border"
            />
            <span :id="`${uid}-day-${gi}`">{{ g.label }}</span>
            <span v-if="g.date" class="font-normal"> · {{ g.date }}</span>
          </div>
          <ol :aria-labelledby="`${uid}-day-${gi}`" class="flex min-w-0 flex-col">
            <LogEntry
              v-for="e in g.events"
              :key="e.id"
              :event="e"
              :node="node"
              :time="isDate(e.at) ? hourOf(e.at) : NO_TIME"
              :title="isDate(e.at) ? exact(e.at) : undefined"
              :datetime="isDate(e.at) ? e.at.toISOString() : undefined"
              :line="e !== shown.at(-1)"
            />
          </ol>
        </li>
      </template>
      <template v-else>
        <LogEntry
          v-for="e in shown"
          :key="e.id"
          :event="e"
          :node="node"
          :time="when(e.at)"
          :title="isDate(e.at) ? exact(e.at) : undefined"
          :datetime="isDate(e.at) ? e.at.toISOString() : undefined"
          :line="e !== shown.at(-1)"
        />
      </template>
    </ol>
    <p class="sr-only" role="status">
      {{ status }}
    </p>
    <!-- A refresh that failed leaves the events in view and says so under them, with Retry. -->
    <p
      v-if="failed && items.length"
      role="alert"
      class="ms-9 flex flex-wrap items-center gap-2 text-xs/4.5 text-danger-subtle-fg"
    >
      {{ t('grani.log.failed') }}
      <UiButton variant="ghost" size="xs" :loading="retrying" @click="retry">
        {{ t('grani.log.retry') }}
      </UiButton>
    </p>
    <p v-if="moreFailed" role="alert" class="ms-9 text-xs/4.5 text-danger-subtle-fg">
      {{ t('grani.log.moreFailed') }}
    </p>
    <!-- ms-9 is the node column and its gap (24 + 12): the button starts where the events' words do. -->
    <UiButton
      v-if="ready && hasMore"
      ref="moreRef"
      size="xs"
      variant="outline"
      class="ms-9 self-start"
      :class="refreshing ? 'opacity-60' : ''"
      :loading="loadingMore"
      :aria-disabled="refreshing || loadingMore || undefined"
      @click="more"
    >
      {{ t('grani.log.older') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { TriangleAlert } from '@lucide/vue'
import { useToday } from '../composables/useToday'
import { addDays } from '../utils/calendar'
import { useUiT } from '../composables/useUiT'
import { useLiveText } from '../utils/liveText'
import { useSplitAttrs } from '../utils/attrs'
import { callListeners } from '../utils/listeners'
import type { LogEvent } from '../types/ui'
import LogEntry from './LogEntry.vue'
import UiButton from './UiButton.vue'
import UiNoData from './UiNoData.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiRadio from './UiRadio.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiSelect from './UiSelect.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The events, newest first. */
    items: LogEvent[]
    /** `dot`: a dot in the event's tone. `actor`: the face of who did it, the system a plate with a glyph. */
    node?: 'dot' | 'actor'
    /** Kinds to choose from over the list, matched against each event's `kind`; "All" comes first. Up to three stand as segments, more go into a select. */
    filters?: { value: string; label: string }[]
    /** Older events exist: the list ends in "Load older events", which calls `@more`. */
    hasMore?: boolean
    /** "Load older events" (`@more`): load the events before the last one. Return a promise to hold the button while it runs and to say a failure; nothing returned, it is not held. */
    onMore?: () => unknown
    /** The line when there are none; defaults to "No activity yet". */
    empty?: string
    /** The first load is on its way: rows in the shape of events, nothing else. */
    loading?: boolean
    /** The first load failed: says so, with Retry. */
    failed?: boolean
    /** Retry (`@retry`): load the history again. Return a promise to hold the button while it runs. */
    onRetry?: () => unknown
    /** The list's name for a screen reader, when no heading names it. */
    ariaLabel?: string
  }>(),
  {
    node: 'dot',
    filters: () => [],
    hasMore: false,
    onMore: undefined,
    empty: '',
    loading: false,
    failed: false,
    onRetry: undefined,
    ariaLabel: '',
  },
)

/** The kind that is on: an event `kind`, or '' for all. */
const filter = defineModel<string>('filter', { default: '' })

const { t, tp, locale, timeZone: zone } = useUiT()
const { rootClass, rootStyle, control } = useSplitAttrs()

const kinds = computed(() => [{ value: '', label: t('grani.log.all') }, ...props.filters])
// "All" in the segmented choice: a radio needs a value, and '' is the model's word for all. A
// number, since a kind is always a string: no kind can be taken for it.
const ALL = -1
const uid = useId()
// The history is in hand: events shown, or nothing on its way and nothing failed.
const ready = computed(() => props.items.length > 0 || (!props.loading && !props.failed))
// With no events yet, loading and failing take the place of the list; with events, a refresh
// keeps them in view.
const firstLoad = computed(() => props.loading && !props.items.length)
const firstFailed = computed(() => props.failed && !props.items.length)
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3']
// A refresh with events in view: "Load older events" waits, dimmed with the list. Not `disabled`,
// which would drop the focus to the page when the refresh starts under it.
const refreshing = computed(() => props.loading && props.items.length > 0 && !loadingMore.value)
// Retry is held while its promise runs: a second press sends nothing.
const retrying = ref(false)
async function retry() {
  if (retrying.value) return
  const run = callListeners(props.onRetry)
  if (!run) return
  const pressed = typeof document !== 'undefined' ? document.activeElement : null
  stopLate?.()
  retrying.value = true
  try {
    await run
  } catch {
    // The app answers with `failed` again; nothing to say here.
  } finally {
    if (alive) retrying.value = false
  }
  if (!alive || !pressed) return
  await nextTick()
  handOn(pressed)
  if (document.activeElement !== pressed && document.activeElement !== document.body) return
  // An app may draw its answer after the promise, or pass through a skeleton first: the first
  // answer drawn gets the same check.
  stopLate = watch(
    () => [props.items, props.failed, props.loading],
    () => {
      if (props.loading) return
      stopLate?.()
      handOn(pressed)
    },
    { flush: 'post' },
  )
}
let stopLate: (() => void) | undefined
// Retry left with the focus on it: the first event takes it (the history came), else the new
// Retry (it failed again), else the filter, never the page.
function handOn(pressed: Element) {
  if (pressed.isConnected || document.activeElement !== document.body) return
  const target =
    listRef.value?.querySelector<HTMLElement>('li[data-event]') ??
    rootRef.value?.querySelector<HTMLElement>(
      '[role=alert] button, [role=radiogroup] input:checked, [role=combobox]',
    )
  if (target && !target.matches('button, input')) target.setAttribute('tabindex', '-1')
  target?.focus()
}
// Up to three kinds and All stand as segments; more go into a select.
const SEGMENTS = 3
const shown = computed(() =>
  filter.value ? props.items.filter((e) => e.kind === filter.value) : props.items,
)

const isDate = (at: unknown): at is Date => at instanceof Date && !Number.isNaN(at.getTime())
// Grouped by day when every event the app gave carries a Date: decided over all of them, not the
// ones a filter shows, so a filter or an older page never turns the headings on or off. A Date
// that is not a moment (an unread server field) keeps its place under the day before, timeless.
const dated = computed(
  () => props.items.length > 0 && props.items.every((e) => e.at instanceof Date),
)
// The minute clock runs only for a log whose times it reads.
const { now } = useToday(() => props.items.some((e) => e.at instanceof Date))
const NO_TIME = '—'
// Built once for the locale and the zone, not per event and per render.
const formats = computed(() => {
  const timeZone = zone.value || undefined
  const make = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale.value, { ...o, timeZone })
  return {
    day: new Intl.DateTimeFormat('en-CA', { timeZone }),
    hour: make({ hour: 'numeric', minute: '2-digit' }),
    date: make({ day: 'numeric', month: 'short' }),
    dated: make({ day: 'numeric', month: 'short', year: 'numeric' }),
    exact: make({ dateStyle: 'full', timeStyle: 'short' }),
    weekday: make({ weekday: 'short', day: 'numeric', month: 'short' }),
    weekdayYear: make({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  }
})
// Today reads as the hour alone; another day names its date too, another year its year. Today
// is the library's own, the server's until the page runs, so the page renders what the server did.
function when(at: Date | string) {
  if (typeof at === 'string') return at
  if (!isDate(at)) return NO_TIME
  const f = formats.value
  const day = f.day.format(at)
  const hour = f.hour.format(at)
  if (day === now.value) return hour
  const date = (day.slice(0, 4) === now.value.slice(0, 4) ? f.date : f.dated).format(at)
  return `${date}, ${hour}`
}
const exact = (at: Date) => formats.value.exact.format(at)
const hourOf = (at: Date) => formats.value.hour.format(at)
// Events that all carry a Date stand under their days, newest first: Today, Yesterday, then the
// day and its weekday, the year when it is not this one. A string time cannot be told apart by
// day, so a log with one keeps every date on its line.
const days = computed(() => {
  if (!dated.value || !shown.value.length) return null
  const f = formats.value
  const yesterday = addDays(now.value, -1)
  const groups: { key: string; label: string; date: string; events: LogEvent[] }[] = []
  for (const e of shown.value) {
    const at = e.at as Date
    let g = groups.at(-1)
    // A Date that is no moment joins the day before it, or the first day when it comes first.
    if (!isDate(at)) {
      if (g) g.events.push(e)
      else groups.push({ key: 'none', label: NO_TIME, date: '', events: [e] })
      continue
    }
    const key = f.day.format(at)
    if (!g || g.key !== key) {
      const date = (key.slice(0, 4) === now.value.slice(0, 4) ? f.weekday : f.weekdayYear).format(
        at,
      )
      const named =
        key === now.value ? t('grani.log.today') : key === yesterday ? t('grani.log.yesterday') : ''
      g = { key, label: named || date, date: named ? date : '', events: [] }
      groups.push(g)
    }
    g.events.push(e)
  }
  return groups
})
const loadingMore = ref(false)
const moreFailed = ref(false)
const said = ref('')
const status = useLiveText(() =>
  props.loading
    ? props.items.length
      ? t('grani.log.updating')
      : t('grani.log.loading')
    : said.value,
)
// A count said once: a refresh or another kind shown makes it old, and the region lets it go.
watch(
  () => [props.loading, filter.value],
  ([loading], [wasLoading, wasFilter]) => {
    if ((loading && !wasLoading) || filter.value !== wasFilter) said.value = ''
  },
)
const moreRef = ref<ComponentPublicInstance | null>(null)
const listRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
let alive = true
onBeforeUnmount(() => {
  alive = false
  stopLate?.()
})
// One press loads once: the button is held until the older events come. The place is kept: what
// was read stays, the count that came is said, and a focus on the button that leaves goes on to
// the first new event.
async function more() {
  if (loadingMore.value || refreshing.value) return
  const before = new Set(props.items.map((e) => e.id))
  const button = moreRef.value?.$el as HTMLElement | undefined
  const focused = Boolean(
    button && typeof document !== 'undefined' && button === document.activeElement,
  )
  moreFailed.value = false
  said.value = ''
  try {
    const run = callListeners(props.onMore)
    if (run) {
      loadingMore.value = true
      await run
    }
  } catch {
    // Said under the list, the button stays for another try.
    if (alive) moreFailed.value = true
    return
  } finally {
    if (alive) loadingMore.value = false
  }
  if (!alive) return
  await nextTick()
  const fresh = props.items.filter((e) => !before.has(e.id))
  if (fresh.length) said.value = tp('grani.log.loaded', fresh.length)
  if (!focused || moreRef.value) return
  // The button left from under the focus: the first new event shown, else the last one shown,
  // else the filter, never the page.
  const rows = Array.from(listRef.value?.querySelectorAll<HTMLElement>('li[data-event]') ?? [])
  const ids = new Set(fresh.map((e) => String(e.id)))
  const target =
    rows.find((li) => ids.has(li.dataset.event ?? '')) ??
    rows.at(-1) ??
    rootRef.value?.querySelector<HTMLElement>('[role=radiogroup] input:checked, [role=combobox]')
  // An event takes the focus only for this; a control (the filter's radio) keeps its own tab stop.
  if (target && !target.matches('button, input')) target.setAttribute('tabindex', '-1')
  target?.focus()
}
</script>
