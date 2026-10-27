# Log (`UiLog`)

> Follow a record's history: who changed what and when, with complete old and new values shown together.

A component of grani-ui 0.1.0. Data, stable, since 0.1.0. Page: https://grani.arseni.work/components/log

Also called timeline, activity log, history, audit log.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { LogEvent } from 'grani-ui'
import { UiCard, UiLog, useToday } from 'grani-ui'

const HISTORY: LogEvent[] = [
  {
    id: 9,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 8,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
      { field: 'Priority', from: '5', to: '1' },
    ],
  },
  {
    id: 7,
    at: '27 Sep, 10:15',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'replaced',
    target: 'Captions',
    changes: [{ field: 'File', from: 'clip_99776_v1.srt', to: 'clip_99776_v2.srt' }],
  },
  {
    id: 6,
    at: '27 Sep, 09:33',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'uploaded',
    target: 'Captions',
  },
  {
    id: 5,
    at: '26 Sep, 18:40',
    kind: 'comment',
    actor: { name: 'Oleg' },
    action: 'commented',
    note: 'Please check the second half, the speaker changes.',
  },
  {
    id: 4,
    at: '26 Sep, 18:10',
    kind: 'change',
    actor: { name: 'Riverside' },
    action: 'set',
    changes: [{ field: 'Status', to: 'Waiting', tone: 'warning' }],
  },
  { id: 3, at: '26 Sep, 18:08', kind: 'system', action: 'created the record' },
]

const PLAIN = HISTORY.slice(0, 1).concat(HISTORY.slice(3))

// The same history with real times, counted back from the showcase's today (27 Sep is today, the
// 26th yesterday): events with a Date stand under their days.
const { now } = useToday()

// A time on today's date, moved by whole days. `new Date` reads it in the browser's zone; an app
// with `createGrani({ timeZone })` builds its Dates in that zone, or takes them from the server.
const on = (days: number, hhmm: string) => {
  const at = new Date(`${now.value}T${hhmm}:00`)
  at.setDate(at.getDate() + days)
  return at
}

const dated = (list: LogEvent[]) =>
  computed(() =>
    list.map((e) => {
      const [, day, hhmm] = /^(\d+) \w+, (\d\d:\d\d)$/.exec(String(e.at)) ?? []
      return { ...e, at: on(Number(day) - 27, hhmm!) }
    }),
  )

const PLAIN_DATED = dated(PLAIN)
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog :items="PLAIN_DATED" aria-label="History" />
  </UiCard>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.
- Read old and new values in full.
- See whether an action worked.
- Ignore extra presses while a request runs.
- Give every empty list a way forward.
- Keep nearby content in place while loading.
- Keep reading as older events load.
- See when each event happened.

Implemented by the app:

- Data fetching, saving, permissions and business rules.
- Pass each change in `changes` with `from` and `to`, the values as they were before and after.
- Reject the `@more` promise when the load fails.
- Return the promise of the load from `@more`.
- Append older events to `items`; do not replace the array when loading more history.
- Resolve the `@more` promise once the older events are in `items`.
- Set the time zone in `createGrani({ timeZone })`; otherwise the server and the browser may show different hours and days.

## Why it works this way

The history of a record on a timeline, newest first. Take it as the last section of a record's drawer or page.

The app's part. It sorts `items` newest first (an unsorted log repeats its day headings), keys the log per record (`:key="record.id"`), so a filter or a failed "older" of one record does not stay on the next, and returns the promise from `@more` and `@retry`, which is what holds their buttons.

**Event.** Each event is a node with who did what to what ("Anna changed Status"), when, and the value before and after. One field reads on its own line ("Status Waiting → Approved", a status in badges); several fields stand in a small table (field, was, became). Words that came with the event, such as a reason to decline, stand under it. An event with no one behind it (`actor: null`, a release in a changelog) opens with what was done; an unset actor is the system. `anchor` gives the event's row an id, so a link can point at it.

**Node.** The node is a dot in the event's tone, or, with `node="actor"`, the face of who did it, for a log where the person matters most.

**Timeline.** A line joins the nodes, so it is a timeline, not a list of rows, and does not stand on UiListItem.

**Placement.** The last section of a record's drawer or page, after its form and its card of facts (UiListItem rows). It only tells, so a drawer level that ends in it has no footer.

**Filters.** `filters` offers a choice over the list by the events' `kind`, "All" first: one kind at a time, so it is a choice, not toggles. Up to three kinds stand as a segmented choice; four or more go into a select, so the filter never runs past the card. A filter that leaves nothing loaded says so and offers "Show all".

**Load.** While the first page comes (`loading` with no events) the log draws rows in the shape of events, a node and a line of text, so nothing moves when they arrive. A failed first load (`failed`) says so with Retry, which calls `@retry` and is held while its promise runs. No events is said, not left blank. With events in view, `loading` is a refresh: they stay, dimmed and busy, and "Load older events" waits; `failed` leaves them and says so under them, with Retry. The states stand on UiNoData and UiSkeleton, as every data state of the library does.

**Older events.** `hasMore` with `@more` ends the list in "Load older events", held while the promise runs. A failed load says so under the list and leaves the button to retry. When older events arrive, what was on screen stays in place and the count that came is said.

**Days.** When every event's `at` is a Date, the events stand under their days: "Today", "Yesterday", then the weekday and the date, with the year when it is not this one. Each event then reads its hour alone, and the timeline runs on through the headings: one history. It is decided over all of `items`, so a filter never turns the headings on or off. A time given as a string cannot be told apart by day, so such a log keeps every date on its line: the hour for today, the date otherwise. A Date that is no moment reads "—" under the day before it.

**Time.** The exact moment is in the time's title, in the app's time zone (`createGrani({ timeZone })`). Set the zone, or the server and the browser may show different hours and days.

**Rhythm.** 24 between events, 8 inside one, so where an event ends reads at a glance.

**Values.** A value is never cut: a long one wraps. A `from` or `to` that is `null` or an empty text is no value: no `from` reads as set, no `to` as cleared; a 0 is a value. In a table of changes an arrow stands between what it was and what it became, as on one line; in a card too narrow for three columns each row stands as a stack, the field over the pair, so a long value keeps the card's width. Among faces (`node="actor"`) the system has a plate of a face's size with a glyph.

### Keyboard

The filter is a segmented UiRadioGroup, or a UiSelect past three kinds; "Show all", "Load older events" and Retry are buttons; the events take no tab stop.
- `Tab`: reaches the filter, then goes on to "Show all", Retry or "Load older events".
- `ArrowLeft` `ArrowRight`: move the segmented filter from kind to kind; the select opens on its own keys.
- `Enter` `Space`: press the button.
When "Load older events" disappears under the focus, the focus goes to the first new event, else the last event shown, else the filter, never to the page; so does a Retry that brought the history, whether the app draws it before or after its promise ends, and a Retry that failed again hands it to the new Retry. A refresh leaves the focus on "Load older events", which waits.

### Screen reader

- List: named by `ariaLabel` when no heading names it.
- Event: read as its words: who did what to what, and when; with no one named, what to what.
- Days: each day is an item of the log, its events a list named by its heading.
- One change: reads "Status Waiting became Approved" (the arrow is hidden and "became" is said in its place).
- Several changes: stand in a table named "Changes" with the columns Field, Previous value and New value; the arrows between them are hidden.
- Filter: a radiogroup, or a combobox past three kinds, named "Show events", the kind that is on chosen.
- Older events: a status region says how many came ("3 older events loaded"), once: a refresh or another kind shown lets it go.
- Failed load: an alert under the list; a failed first load is an alert with Retry.
- First load: a status says the history is loading; the rows in its shape are hidden.

### States

Events under their days or with their dates, as dots in their tone or as faces, the system's plate among faces, an event with no one named, one change on a line, several in a table, a note; filters with the kind that is on; `hasMore` with "Load older events", held while the promise runs, failed with its line and the button left to retry, and the loaded count said; nothing yet (`empty`), and a filter that leaves nothing loaded, with "Show all"; the first load (`loading`), and a first load that failed (`failed`), with Retry held while it runs.

### When to use another component

- The facts of a record: UiListItem rows in a UiList.
- A list of records: UiTable.
- A request answered: a toast of UiToaster.
- A timeline the person edits: never; it only tells.

## Examples

### Faces

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectOption, LogEvent } from 'grani-ui'
import { UiCard, UiLog, useToday } from 'grani-ui'

const HISTORY: LogEvent[] = [
  {
    id: 9,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 8,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
      { field: 'Priority', from: '5', to: '1' },
    ],
  },
  {
    id: 7,
    at: '27 Sep, 10:15',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'replaced',
    target: 'Captions',
    changes: [{ field: 'File', from: 'clip_99776_v1.srt', to: 'clip_99776_v2.srt' }],
  },
  {
    id: 6,
    at: '27 Sep, 09:33',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'uploaded',
    target: 'Captions',
  },
  {
    id: 5,
    at: '26 Sep, 18:40',
    kind: 'comment',
    actor: { name: 'Oleg' },
    action: 'commented',
    note: 'Please check the second half, the speaker changes.',
  },
  {
    id: 4,
    at: '26 Sep, 18:10',
    kind: 'change',
    actor: { name: 'Riverside' },
    action: 'set',
    changes: [{ field: 'Status', to: 'Waiting', tone: 'warning' }],
  },
  { id: 3, at: '26 Sep, 18:08', kind: 'system', action: 'created the record' },
]

// A few kinds stand as segments; more go into a select (the Older tab).
const FEW: SelectOption<string>[] = [
  { value: 'decision', label: 'Decisions' },
  { value: 'comment', label: 'Comments' },
]

const faceKind = ref('')

// The same history with real times, counted back from the showcase's today (27 Sep is today, the
// 26th yesterday): events with a Date stand under their days.
const { now } = useToday()

// A time on today's date, moved by whole days. `new Date` reads it in the browser's zone; an app
// with `createGrani({ timeZone })` builds its Dates in that zone, or takes them from the server.
const on = (days: number, hhmm: string) => {
  const at = new Date(`${now.value}T${hhmm}:00`)
  at.setDate(at.getDate() + days)
  return at
}

const dated = (list: LogEvent[]) =>
  computed(() =>
    list.map((e) => {
      const [, day, hhmm] = /^(\d+) \w+, (\d\d:\d\d)$/.exec(String(e.at)) ?? []
      return { ...e, at: on(Number(day) - 27, hhmm!) }
    }),
  )

const HISTORY_DATED = dated(HISTORY)
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog
      v-model:filter="faceKind"
      :items="HISTORY_DATED"
      node="actor"
      :filters="FEW"
      aria-label="History"
    />
  </UiCard>
</template>

```

### Changes

```vue
<script setup lang="ts">
import type { LogEvent } from 'grani-ui'
import { UiCard, UiLog } from 'grani-ui'

const HISTORY: LogEvent[] = [
  {
    id: 9,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 8,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
      { field: 'Priority', from: '5', to: '1' },
    ],
  },
  {
    id: 7,
    at: '27 Sep, 10:15',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'replaced',
    target: 'Captions',
    changes: [{ field: 'File', from: 'clip_99776_v1.srt', to: 'clip_99776_v2.srt' }],
  },
  {
    id: 6,
    at: '27 Sep, 09:33',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'uploaded',
    target: 'Captions',
  },
  {
    id: 5,
    at: '26 Sep, 18:40',
    kind: 'comment',
    actor: { name: 'Oleg' },
    action: 'commented',
    note: 'Please check the second half, the speaker changes.',
  },
  {
    id: 4,
    at: '26 Sep, 18:10',
    kind: 'change',
    actor: { name: 'Riverside' },
    action: 'set',
    changes: [{ field: 'Status', to: 'Waiting', tone: 'warning' }],
  },
  { id: 3, at: '26 Sep, 18:08', kind: 'system', action: 'created the record' },
]

const MANY = HISTORY.slice(0, 3)
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog :items="MANY" aria-label="History" />
  </UiCard>
</template>

```

### Versions

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LogEvent } from 'grani-ui'
import { UiCard, UiLog, useToday } from 'grani-ui'

// The same history with real times, counted back from the showcase's today (27 Sep is today, the
// 26th yesterday): events with a Date stand under their days.
const { now } = useToday()

// A time on today's date, moved by whole days. `new Date` reads it in the browser's zone; an app
// with `createGrani({ timeZone })` builds its Dates in that zone, or takes them from the server.
const on = (days: number, hhmm: string) => {
  const at = new Date(`${now.value}T${hhmm}:00`)
  at.setDate(at.getDate() + days)
  return at
}

// The versions of a contract: drafts and published versions on the same log, no new prop.
const VERSIONS = computed<LogEvent[]>(() => [
  {
    id: 'v4',
    at: on(0, '11:02'),
    kind: 'draft',
    tone: 'brand',
    actor: { name: 'Anna' },
    action: 'saved a draft',
    target: 'v4',
    changes: [{ field: 'Status', to: 'Draft', tone: 'info' }],
  },
  {
    id: 'v3',
    at: on(0, '09:40'),
    kind: 'published',
    tone: 'success',
    actor: { name: 'Oleg' },
    action: 'published',
    target: 'v3',
    changes: [
      { field: 'Term', from: '12 months', to: '24 months' },
      { field: 'Price', from: '$1,200', to: '$1,050' },
    ],
    note: 'Longer term, lower monthly price; the penalty clause is unchanged.',
  },
  {
    id: 'v2',
    at: on(-5, '16:15'),
    kind: 'published',
    tone: 'success',
    actor: { name: 'Oleg' },
    action: 'published',
    target: 'v2',
    changes: [{ field: 'Signer', from: 'M. Ivanova', to: 'K. Petrov' }],
  },
])

const VERSION_KINDS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
]

const versionKind = ref('')
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog
      v-model:filter="versionKind"
      :items="VERSIONS"
      :filters="VERSION_KINDS"
      aria-label="Versions of the contract"
    />
  </UiCard>
</template>

```

### No one named

```vue
<script setup lang="ts">
import type { LogEvent } from 'grani-ui'
import { UiCard, UiLog } from 'grani-ui'

// A release has no one behind it: `actor: null` opens each line with what was done, and the first
// change of a version is its anchor, so a link can point at it.
const RELEASES: LogEvent[] = [
  {
    id: 'r3',
    at: '0.2.0 · Nov 20',
    actor: null,
    action: 'Added',
    target: 'UiSegmented',
    note: 'A row of choices, one at a time.',
    tone: 'success',
    anchor: 'release-0.2.0',
  },
  {
    id: 'r2',
    at: '0.2.0 · Nov 20',
    actor: null,
    action: 'Fixed',
    target: 'UiDatePicker',
    note: 'A typed day no longer lands in the next month.',
  },
  {
    id: 'r1',
    at: '0.1.0 · Oct 28',
    actor: null,
    action: 'Added',
    target: 'grani',
    note: 'The first public version.',
    tone: 'success',
    anchor: 'release-0.1.0',
  },
]
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog :items="RELEASES" aria-label="Changes" />
  </UiCard>
</template>

```

### Older

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SelectOption, LogEvent } from 'grani-ui'
import { UiCard, UiLog, UiSwitch } from 'grani-ui'

const HISTORY: LogEvent[] = [
  {
    id: 9,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 8,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
      { field: 'Priority', from: '5', to: '1' },
    ],
  },
  {
    id: 7,
    at: '27 Sep, 10:15',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'replaced',
    target: 'Captions',
    changes: [{ field: 'File', from: 'clip_99776_v1.srt', to: 'clip_99776_v2.srt' }],
  },
  {
    id: 6,
    at: '27 Sep, 09:33',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'uploaded',
    target: 'Captions',
  },
  {
    id: 5,
    at: '26 Sep, 18:40',
    kind: 'comment',
    actor: { name: 'Oleg' },
    action: 'commented',
    note: 'Please check the second half, the speaker changes.',
  },
  {
    id: 4,
    at: '26 Sep, 18:10',
    kind: 'change',
    actor: { name: 'Riverside' },
    action: 'set',
    changes: [{ field: 'Status', to: 'Waiting', tone: 'warning' }],
  },
  { id: 3, at: '26 Sep, 18:08', kind: 'system', action: 'created the record' },
]

const OLDER: LogEvent[] = [
  {
    id: 2,
    at: '24 Sep, 09:00',
    kind: 'system',
    action: 'reserved the id',
    changes: [{ field: 'Id', to: '99776' }],
  },
  { id: 1, at: '24 Sep, 08:58', kind: 'system', action: 'opened a slot in the queue' },
]

const FILTERS: SelectOption<string>[] = [
  { value: 'decision', label: 'Decisions' },
  { value: 'change', label: 'Changes' },
  { value: 'file', label: 'Files' },
  { value: 'comment', label: 'Comments' },
  { value: 'payment', label: 'Payments' },
]

const events = ref<LogEvent[]>([...HISTORY])

const filter = ref('')

const hasMore = ref(true)

const loadFails = ref(false)

// Older events come from the server a moment later; the button waits for them. With the switch
// on the server does not answer, and the log says so under the list.
const more = () =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (loadFails.value) return reject(new Error('The server did not answer'))
      events.value.push(...OLDER)
      hasMore.value = false
      resolve()
    }, 700),
  )
</script>

<template>
  <UiCard class="w-full max-w-md">
    <UiLog
      v-model:filter="filter"
      :items="events"
      :filters="FILTERS"
      :has-more="hasMore"
      aria-label="History"
      @more="more"
    />
  </UiCard>
  <UiSwitch v-model="loadFails">The load fails</UiSwitch>
</template>

```

### Load

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { LogEvent } from 'grani-ui'
import { UiCard, UiLog, UiRadioGroup, UiRadio } from 'grani-ui'

const HISTORY: LogEvent[] = [
  {
    id: 9,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 8,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
      { field: 'Priority', from: '5', to: '1' },
    ],
  },
  {
    id: 7,
    at: '27 Sep, 10:15',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'replaced',
    target: 'Captions',
    changes: [{ field: 'File', from: 'clip_99776_v1.srt', to: 'clip_99776_v2.srt' }],
  },
  {
    id: 6,
    at: '27 Sep, 09:33',
    kind: 'file',
    actor: { name: 'Captions Bureau' },
    action: 'uploaded',
    target: 'Captions',
  },
  {
    id: 5,
    at: '26 Sep, 18:40',
    kind: 'comment',
    actor: { name: 'Oleg' },
    action: 'commented',
    note: 'Please check the second half, the speaker changes.',
  },
  {
    id: 4,
    at: '26 Sep, 18:10',
    kind: 'change',
    actor: { name: 'Riverside' },
    action: 'set',
    changes: [{ field: 'Status', to: 'Waiting', tone: 'warning' }],
  },
  { id: 3, at: '26 Sep, 18:08', kind: 'system', action: 'created the record' },
]

// The life of the first load, switched by hand; Retry loads after a moment.
const loadState = ref('loading')

const retryLoad = () =>
  new Promise<void>((done) =>
    setTimeout(() => {
      loadState.value = 'loaded'
      done()
    }, 800),
  )
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-4">
    <UiCard class="w-full">
      <UiLog
        :items="loadState === 'loaded' || loadState === 'refreshing' ? HISTORY.slice(0, 3) : []"
        :loading="loadState === 'loading' || loadState === 'refreshing'"
        :failed="loadState === 'failed'"
        aria-label="History"
        @retry="retryLoad"
      />
    </UiCard>
    <UiRadioGroup v-model="loadState" variant="segmented" aria-label="State of the history">
      <UiRadio value="loading">Loading</UiRadio>
      <UiRadio value="loaded">Loaded</UiRadio>
      <UiRadio value="refreshing">Refreshing</UiRadio>
      <UiRadio value="empty">Empty</UiRadio>
      <UiRadio value="failed">Failed</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

## API

Props:
- `items`: `LogEvent[]` (required) — The events, newest first.
- `node`: `"dot" | "actor"` = `dot | actor` (default `"dot"`) — `dot`: a dot in the event's tone. `actor`: the face of who did it, the system a plate with a glyph.
- `filters`: `{ value: string; label: string; }[]` (default `[]`) — Kinds to choose from over the list, matched against each event's `kind`; "All" comes first. Up to three stand as segments, more go into a select.
- `hasMore`: `boolean` (default `false`) — Older events exist: the list ends in "Load older events", which calls `@more`.
- `onMore`: `(() => unknown)` — "Load older events" (`@more`): load the events before the last one. Return a promise to hold the button while it runs and to say a failure; nothing returned, it is not held.
- `empty`: `string` (default `""`) — The line when there are none; defaults to "No activity yet".
- `loading`: `boolean` (default `false`) — The first load is on its way: rows in the shape of events, nothing else.
- `failed`: `boolean` (default `false`) — The first load failed: says so, with Retry.
- `onRetry`: `(() => unknown)` — Retry (`@retry`): load the history again. Return a promise to hold the button while it runs.
- `ariaLabel`: `string` (default `""`) — The list's name for a screen reader, when no heading names it.
- `filter`: `string` (default `""`) — The kind that is on: an event `kind`, or '' for all.
Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.

Events:
- `update:filter` (`value: string`) — The new value of `filter`, for `v-model:filter`.

## How it behaves

### Values never cut

- When: an event changed values.
- Props: `changes` with `from` and `to`.
- Guarantee: No value is cut: a long one wraps, so the old and the new value read in full. One change stands on its own line, such as “Status Waiting → Approved”; several stand in a table with the field, the previous value and the new value.
- Without it: Values cut to one line: two long addresses that differ at the end look the same.
- Code: `<UiLog :items="events" />`
- Your part: Pass each change in `changes` with `from` and `to`, the values as they were before and after.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "a long was and became wrap and keep both values readable, none is cut"
- Pattern for all components: https://grani.arseni.work/patterns/finding#was-and-became

### Outcome shown

- When: older events fail to load.
- Props: `@more` rejecting.
- Guarantee: A message below the list says the load failed (“Could not load older events. Try again.”), and “Load older events” stays available to try again.
- Without it: The button silently does nothing after a failure.
- Code: `<UiLog :items="events" has-more @more="loadOlder" />`
- Your part: Reject the `@more` promise when the load fails.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "a rejected onMore does not go unhandled and the button stays clickable to retry"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#answered

### One press, one request

- When: older events load on request.
- Props: `@more` returning a promise.
- Guarantee: “Load older events” calls `@more` once and ignores further presses until its promise settles.
- Without it: The button sends a second request while the first is still on its way.
- Code: `<UiLog :items="events" has-more @more="loadOlder" />`
- Your part: Return the promise of the load from `@more`.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "Show older calls @more once and is held while the promise runs"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#one-press

### Way forward

- When: a filter hides every loaded event.
- Props: `filters`.
- Guarantee: It says “No events of this kind are loaded.” and offers Show all, which turns the filter off and brings back every loaded event.
- Without it: An empty timeline that reads as if nothing ever happened to the record.
- Code: `<UiLog :items="events" :filters="kinds" />`
- Your part: Nothing.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "a filter that hides every loaded event says so and offers all"
- Pattern for all components: https://grani.arseni.work/patterns/finding#empty-next-step

### Stable dimensions

- When: older events arrive.
- Props: `hasMore`, `@more`.
- Guarantee: Older events are added after the last one; what was already on screen stays where it was.
- Without it: The list is redrawn from the top, and you have to find your place again.
- Code: `<UiLog :items="events" :has-more="more" @more="loadOlder" />`
- Your part: Append older events to `items`; do not replace the array when loading more history.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "older events append after the last one and leave the nodes already shown"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#no-jolt

### Focus after loading

- When: older events load on request.
- Props: `hasMore`, `@more`.
- Guarantee: If “Load older events” had focus and disappears after the final load, focus moves to the first new event. A screen reader announces the result, such as “2 older events loaded”.
- Without it: The button disappears with keyboard focus on it; focus falls to the page, and a screen reader loses its place.
- Code: `<UiLog :items="events" :has-more="more" @more="loadOlder" />`
- Your part: Resolve the `@more` promise once the older events are in `items`.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "Show older keeps the place: focus moves to the first new event when the button goes, and the count is said"
- Pattern for all components: https://grani.arseni.work/patterns/waiting#keep-place

### Exact time

- When: events carry a Date.
- Props: `at` as a Date.
- Guarantee: When every event uses a Date value, the history groups events by day and shows each event’s time. Headings identify Today, Yesterday or the weekday and date, adding the year when needed. Hover over a time for the full date and time in the app’s time zone. If any timestamp is supplied as text, events are not grouped by day and each retains its own date.
- Without it: “2 days ago” with no way to tell the hour.
- Code: `<UiLog :items="events" />`
- Your part: Set the time zone in `createGrani({ timeZone })`; otherwise the server and the browser may show different hours and days.
- Proof, in the repository's tests (UiLog.spec.ts, not in the package): "a Date of today reads the hour, another day its date, another year its year; the exact moment is on the time"
- Pattern for all components: https://grani.arseni.work/patterns/finding#exact-time


The patterns: https://grani.arseni.work/patterns

Built with what `grani-ui` exports: `useToday`, `useUiT`.
