<script lang="ts">
export const blurb =
  "Follow a record's history: who changed what and when, with complete old and new values shown together."
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToday } from '../composables/useToday'
import type { SelectOption, LogEvent } from '../types/ui'

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
// A few kinds stand as segments; more go into a select (the Older tab).
const FEW: SelectOption<string>[] = [
  { value: 'decision', label: 'Decisions' },
  { value: 'comment', label: 'Comments' },
]
const faceKind = ref('')
// The life of the first load, switched by hand; Retry loads after a moment.
const loadState = ref('loading')
const retryLoad = () =>
  new Promise<void>((done) =>
    setTimeout(() => {
      loadState.value = 'loaded'
      done()
    }, 800),
  )
const FILTERS: SelectOption<string>[] = [
  { value: 'decision', label: 'Decisions' },
  { value: 'change', label: 'Changes' },
  { value: 'file', label: 'Files' },
  { value: 'comment', label: 'Comments' },
  { value: 'payment', label: 'Payments' },
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
const HISTORY_DATED = dated(HISTORY)
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
const MANY = HISTORY.slice(0, 3)
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
  <DemoBlock title="Base">
    <UiCard class="w-full max-w-md">
      <UiLog :items="PLAIN_DATED" aria-label="History" />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Faces">
    <UiCard class="w-full max-w-md">
      <UiLog
        v-model:filter="faceKind"
        :items="HISTORY_DATED"
        node="actor"
        :filters="FEW"
        aria-label="History"
      />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Changes">
    <UiCard class="w-full max-w-md">
      <UiLog :items="MANY" aria-label="History" />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Versions">
    <UiCard class="w-full max-w-md">
      <UiLog
        v-model:filter="versionKind"
        :items="VERSIONS"
        :filters="VERSION_KINDS"
        aria-label="Versions of the contract"
      />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="No one named">
    <UiCard class="w-full max-w-md">
      <UiLog :items="RELEASES" aria-label="Changes" />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Older">
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
  </DemoBlock>
  <DemoBlock title="Load">
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
  </DemoBlock>
</template>
