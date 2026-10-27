<!--
  LogEntry: one event of UiLog's timeline, private to the library. It draws the node (a dot in the
  event's tone, a face, or the system's plate among faces), who did what to what and when, the
  change on one line or several in a table, and the note.

  Line. `line` draws the stretch of the timeline from this node down to the next event; the last
  event of the log has none.

  Time. The host says what the time reads (`time`), its exact moment (`title`) and its machine form
  (`datetime`): it alone knows whether the day stands in a heading above.

  Keyboard. Not interactive: the host may focus the event (tabindex -1) when a button leaves from
  under the focus.

  Reader.
  - Event: read as its words: who did what to what, and when; with no one named, what to what.
  - One change: reads "Status Waiting became Approved"; the arrow is hidden.
  - Several changes: a table named "Changes" with the columns Field, Previous value and New value;
    the arrows between them are hidden. In a narrow card each row stands as a stack, field over the
    pair, and stays a table row to the reader.

  States. A dot in each tone, a face, the system's plate among faces, no one named (a dot, the
  action first), one change, several, a note, the line to the next event or none.

  Not for.
  - Anything but UiLog: it is the host's part.
-->
<template>
  <li
    :id="event.anchor"
    :data-event="event.id"
    class="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 rounded-card focus:outline-hidden focus-visible:[box-shadow:var(--ui-ring)]"
    :class="line ? 'pb-6' : ''"
  >
    <!-- The line from this node down to the next one: 11px puts a 2px line in the middle of a 24px node. -->
    <span
      v-if="line"
      aria-hidden="true"
      class="absolute bottom-0 start-[0.6875rem] top-7 w-0.5 bg-border"
    />
    <UiAvatar
      v-if="node === 'actor' && event.actor"
      :name="event.actor.name"
      :src="event.actor.avatar"
      size="xs"
    />
    <!-- The system among faces is an actor too: a plate of a face's size with a glyph, not a dot.
         No one named (`null`) has no face: a dot. -->
    <span
      v-else-if="node === 'actor' && event.actor !== null"
      aria-hidden="true"
      class="flex h-6 w-6 items-center justify-center rounded-pill border border-border bg-surface-muted text-fg-muted [&_svg]:h-3.5 [&_svg]:w-3.5"
    >
      <Bot />
    </span>
    <span v-else aria-hidden="true" class="flex h-6 w-6 items-center justify-center">
      <span
        class="h-2.5 w-2.5 rounded-pill border-2 bg-surface"
        :class="RING[event.tone ?? 'neutral']"
      />
    </span>
    <div class="min-w-0 pt-0.5">
      <div class="flex min-w-0 items-baseline gap-2">
        <p class="min-w-0 flex-1 text-sm/5.5 text-fg [overflow-wrap:anywhere]">
          <!-- No one named (`null`): what was done opens the line and takes the weight a name has. -->
          <template v-if="event.actor === null">
            <span class="font-semibold">{{ event.action }}</span>
          </template>
          <template v-else>
            <span class="font-semibold">{{ event.actor?.name ?? t('grani.log.system') }}</span>
            {{ event.action }}
          </template>
          <!-- What it was done to moves to the next line whole ("INV-1043" never splits at its
               hyphen); only a target wider than the card breaks inside. -->
          <template v-if="event.target">
            {{ ' ' }}<span class="inline-block text-fg-muted">{{ event.target }}</span>
          </template>
        </p>
        <time
          :datetime="datetime"
          :title="title"
          class="shrink-0 font-mono text-xs/4.5 tabular-nums text-fg-muted"
        >
          {{ time }}
        </time>
      </div>
      <div
        v-if="event.changes?.length === 1"
        class="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm/5.5 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere]"
      >
        <span class="text-fg-muted">{{ event.changes[0]!.field }}</span>
        <template v-if="!blank(event.changes[0]!.from)">
          <UiBadge
            v-if="event.changes[0]!.tone"
            size="sm"
            :label="String(event.changes[0]!.from)"
            class="line-through opacity-75"
          />
          <span v-else class="text-fg-muted line-through">{{ event.changes[0]!.from }}</span>
          <ArrowRight
            aria-hidden="true"
            class="h-3.5 w-3.5 shrink-0 text-fg-subtle rtl:-scale-x-100"
          />
          <span class="sr-only">{{ t('grani.log.became') }}</span>
        </template>
        <span v-if="blank(event.changes[0]!.to)" class="text-fg-muted">
          {{ t('grani.log.cleared') }}
        </span>
        <UiBadge
          v-else-if="event.changes[0]!.tone"
          size="sm"
          :label="String(event.changes[0]!.to)"
          :tone="event.changes[0]!.tone"
        />
        <span v-else class="font-medium text-fg">{{ event.changes[0]!.to }}</span>
      </div>
      <div
        v-else-if="event.changes?.length"
        class="@container mt-2 overflow-hidden rounded-card border border-border"
      >
        <!-- Nothing is cut: a long value wraps, so what changed can be read. In a card too narrow
             for three columns a row stands as a stack, the field over the pair, so a long value
             keeps the card's width instead of a column one letter wide. The roles keep it a table
             to the reader when the rows are laid out as boxes. -->
        <table
          role="table"
          class="w-full text-xs/4.5 [&_td]:align-top [&_td]:[overflow-wrap:anywhere]"
          :aria-label="t('grani.log.changes')"
        >
          <thead class="sr-only">
            <tr role="row">
              <th role="columnheader">{{ t('grani.log.field') }}</th>
              <th role="columnheader">{{ t('grani.log.was') }}</th>
              <th aria-hidden="true"></th>
              <th role="columnheader">{{ t('grani.log.becameHead') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(c, k) in event.changes"
              :key="k"
              role="row"
              class="[&+tr]:border-t [&+tr]:border-border @max-sm:flex @max-sm:flex-wrap @max-sm:items-start @max-sm:px-3 @max-sm:py-1.5"
            >
              <td
                role="cell"
                class="w-24 px-3 py-1.5 text-fg-muted @max-sm:w-full @max-sm:basis-full @max-sm:p-0 @max-sm:pb-0.5"
              >
                {{ c.field }}
              </td>
              <td
                role="cell"
                class="px-3 py-1.5 text-fg-muted line-through @max-sm:min-w-0 @max-sm:max-w-full @max-sm:p-0"
              >
                {{ blank(c.from) ? '—' : c.from }}
              </td>
              <!-- The arrow ties the pair as on one line: what it was, then what it became. -->
              <td
                aria-hidden="true"
                class="w-4 py-1.5 text-fg-subtle @max-sm:w-auto @max-sm:px-1.5 @max-sm:py-0"
              >
                <ArrowRight class="mt-0.5 h-3.5 w-3.5 rtl:-scale-x-100" />
              </td>
              <td
                role="cell"
                class="px-3 py-1.5 text-fg @max-sm:min-w-0 @max-sm:max-w-full @max-sm:p-0"
              >
                <UiBadge
                  v-if="c.tone && !blank(c.to)"
                  :label="String(c.to)"
                  :tone="c.tone"
                  size="sm"
                />
                <template v-else>{{ blank(c.to) ? t('grani.log.cleared') : c.to }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="event.note"
        class="mt-2 rounded-card bg-surface-muted px-3 py-2 text-sm/5.5 text-fg [overflow-wrap:anywhere]"
      >
        {{ event.note }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import { ArrowRight, Bot } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import type { LogEvent } from '../types/ui'
import UiAvatar from './UiAvatar.vue'
import UiBadge from './UiBadge.vue'

defineProps<{
  /** The event. */
  event: LogEvent
  /** `dot` or `actor`, as the host's. */
  node: 'dot' | 'actor'
  /** What the time reads: the hour under a day's heading, else the date and the hour. */
  time: string
  /** The exact moment, on the time. */
  title?: string
  /** The machine form of the time. */
  datetime?: string
  /** The stretch of line down to the next event. */
  line: boolean
}>()

const { t } = useUiT()

// `null` and an empty text are both no value (a cleared field is `''`); a 0 is a value.
const blank = (value: string | number | null | undefined) => value == null || value === ''

const RING: Record<NonNullable<LogEvent['tone']>, string> = {
  neutral: 'border-border-strong',
  brand: 'border-brand',
  success: 'border-success',
  warning: 'border-warning',
  danger: 'border-danger',
  info: 'border-info',
}
</script>
