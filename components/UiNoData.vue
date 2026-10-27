<!--
  UiNoData: an empty place that says why and offers the next step. Take it where a list, a table or a
  section has nothing to show. Nothing yet: create; nothing matches: change the filters; the load
  failed: retry (`tone="danger"`, read out as an alert).

  Anatomy. A glyph in `#media` on a round plate in the tone, a short `title`, the `description`, and the next
  step in `#actions` (UiButton of your own: you choose the weight and `loading`).

  Frame. On a page it has a dashed frame; in a card (UiCard `#empty`), a drawer or a window, the
  surface frames it. The root is a `<div role="status">`.

  Keyboard. Not interactive: the block takes no focus; the buttons in `#actions` are the tab
  stops.

  Reader.
  - Role: a `status`; `tone="danger"` is an `alert`, read at once. The block appears with its words,
    and a status that appears with its words is often not read out: that a list is empty is said by
    a region that was on the page before (UiTable has one), and a page of your own keeps one.
  - Order: the title, then the description.
  - Glyph: the glyph on its plate is hidden.

  States. Nothing yet, with a `primary` button to create the first one; nothing matches, with a
  `secondary` button to reset the filters; the load failed, `danger`, a red plate with a warning
  glyph and Retry. `sm` in a drawer or a card, `md` on a page. A dashed frame on a page, none inside
  a card, a drawer or a window. A neutral one without a glyph draws no plate.

  Not for.
  - Content on its way: UiSkeleton.
  - An action in flight: UiSpinner.
  - A notice over content that is there: UiListItem in a `tone`.
  - A failed request: a toast through UiToaster.
-->
<template>
  <div
    :role="tone === 'danger' ? 'alert' : 'status'"
    class="flex flex-col items-center text-center"
    :class="
      inCard
        ? ''
        : ['rounded-card border border-dashed border-border-strong', size === 'sm' ? 'p-4' : 'p-10']
    "
  >
    <div
      v-if="$slots.media || tone === 'danger'"
      class="mb-4 flex shrink-0 items-center justify-center rounded-pill"
      :class="[PLATE[size], TINT[tone]]"
      aria-hidden="true"
    >
      <slot name="media"><TriangleAlert /></slot>
    </div>
    <p v-if="title" class="text-balance text-sm/5.5 font-semibold text-fg [overflow-wrap:anywhere]">
      {{ title }}
    </p>
    <p
      class="max-w-sm text-balance text-sm/5.5 text-fg-muted [overflow-wrap:anywhere]"
      :class="title ? 'mt-1' : ''"
    >
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import { CARD_DEPTH } from '../utils/surface'

withDefaults(
  defineProps<{
    /** One short line of what happened: "No invoices yet", "The record did not load". */
    title?: string
    /** Why it is empty and what to do next. */
    description: string
    /** `danger` for a load that failed: a red plate and an alert; its Retry is a `secondary` UiButton in `#actions`. */
    tone?: 'neutral' | 'danger'
    /** `md` for a page, `sm` for a section inside a drawer or a card. */
    size?: 'sm' | 'md'
  }>(),
  { title: '', tone: 'neutral', size: 'md' },
)

const inCard = inject(CARD_DEPTH, 0) > 0

const PLATE = { sm: 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5', md: 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6' }
const TINT = {
  neutral: 'bg-neutral-subtle text-fg-muted',
  danger: 'bg-danger-subtle text-danger-subtle-fg',
}

defineSlots<{
  /** The glyph on the plate, as a row's `#media`; `danger` draws a warning sign when it is empty. */
  media(props: Record<string, never>): any
  /** The next step, a UiButton of your own or two: `primary` to create the first one, `secondary` to reset the filters or retry, with `loading` when it sends. */
  actions(props: Record<string, never>): any
}>()
</script>
