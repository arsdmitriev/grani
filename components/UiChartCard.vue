<!--
  UiChartCard: a card around a chart that handles its data states, so the chart only draws. Take
  it for a chart on a page, alone or in a grid of cards.

  Layout. A title with its description, with `#actions` on the same line (a link, a UiDelta); an
  optional headline (`value` in the chart's format, with a `caption` under it); the chart in the
  body; a note in `#footer`. There is no line under the title: the headline and the chart follow
  it on one surface.

  Data states. One `loading` and one `empty` tell the states apart, as in a table. A figure beside
  the chart follows its data: a UiDelta in `#actions` draws nothing on a first load, with nothing
  to draw and after a failed load, and a note given as bare text in `#footer` becomes a held line
  of its own height; a control, a link and a footer of markup stay. A refresh keeps everything, and
  a failed refresh keeps it beside "Not updated".

  First load. Skeletons take the place of the headline and the note. The chart in the slot reads
  `CHART_SKELETON` and draws its own skeleton; for a chart that has none, the card draws a band of
  bars. A refresh keeps the chart, dimmed to 60%, with a spinner in the middle of the card.

  Empty. Nothing to draw keeps the chart's place: the chart reads `CHART_EMPTY` and holds its
  first-load shape, unseen. `#empty` (a UiNoData that says why and what to do next, or the card's
  own words) stands in the same cell, and the taller of the two sets the height. A slot whose
  content is switched off by `v-if` counts as no slot.

  Errors. A failed load holds the place the same way, with UiNoData `danger`, the reason and Retry
  in the cell. A failed refresh keeps the chart and says "Not updated" on the title line, with
  Retry as a reload glyph; the reason is in its tooltip and in the one live region of the title
  line. Retry asks for nothing while `loading`.

  Bleed. `bleed="sides"` runs the chart to the card's sides and hands it the gutter through
  `CHART_BLEED`, so the chart keeps its legend and axis ends on the gutter. `bleed="full"` takes
  the bottom edge too when there is no footer. A bled chart has no value axis.

  Placement. On UiCard, beside other cards in a page's grid, with UiDelta in `#actions`. A
  single figure with a trend is this card with `bleed="full"`. Rows with small lines are UiListItem
  rows in its body.

  Keyboard.
  The card takes no tab stop of its own.
  - `Tab`: walks what is in it: the controls in `#actions`, the Retry glyph of a failed refresh,
    the chart's plot and legend, the Retry of a failed load.
  - `Enter` `Space`: press a Retry.
  When a Retry disappears under the focus, the focus goes to the Retry that took its place, or to
  the card, never to the page. A focus on a chart control stays where it is when the error
  clears.

  Reader.
  - Status: one status region on the title line, present in every state, says "Loading the
    chart…" on the first load, "Updating…" on a refresh, and "Could not refresh chart data" with the
    reason after a failed refresh.
  - Retry: the glyph of a failed refresh is a button named "Retry" with the reason in its tooltip.
  - Failed load: UiNoData `danger`, "The chart did not load", the reason and Retry.
  - Empty: nothing to draw is "No data for this period", or the caller's `#empty`.
  - Busy: while loading, the card is `aria-busy`; a chart held under the words is hidden and
    inert.

  States. Rest, the first load (a skeleton for the headline, the note and the chart's own), a
  refresh (the chart and the headline dimmed to 60%, a spinner in the middle), nothing to draw
  (`empty`, the chart's place kept), a failed load (`error` with `empty`), a failed refresh ("Not
  updated" on the title line, the chart kept); with and without a headline, a caption and a footer
  note, `bleed="sides"` and `bleed="full"`.

  Not for.
  - A chart alone in a page section: the chart itself, UiAreaChart, UiBarChart or UiDonutChart.
  - Rows with small lines: UiListItem rows in a UiList.
  - A change against the period before: UiDelta in `#actions`.
  - A table of the figures: UiTable.
-->
<template>
  <UiCard
    ref="card"
    :title="title"
    :description="description"
    :size="size"
    :empty="(failed || noData) && !ghost()"
    :divided="false"
    :aria-busy="loading || undefined"
    tabindex="-1"
    class="relative focus:outline-hidden"
  >
    <!-- The title line is there in every state: the live region there exists before its words. -->
    <template #actions>
      <template v-if="stale">
        <!-- Two words, so a title beside them keeps its line; the sentence is the reader's and the tooltip's. -->
        <span class="whitespace-nowrap text-xs/4.5 text-danger-subtle-fg" aria-hidden="true">
          {{ t('grani.chart.notUpdatedShort') }}
        </span>
        <UiTooltip :content="reason">
          <UiIconButton
            variant="ghost"
            size="xs"
            :icon="RefreshCw"
            :ariaLabel="t('grani.chart.retry')"
            :loading="loading"
            data-chart-retry
            @click="retry"
          />
        </UiTooltip>
      </template>
      <slot name="actions" />
      <span role="status" class="sr-only">{{ status }}</span>
    </template>

    <!-- The headline and the chart in one column of a grid, so the words of nothing to draw can
         stand over both: the headline's blank lines do not push them under the middle. -->
    <div class="grid min-w-0 gap-4">
      <div
        v-if="headline()"
        class="col-start-1 row-start-1 flex flex-col motion-safe:transition-opacity"
        :class="refreshing ? 'opacity-60' : ''"
      >
        <template v-if="firstLoad">
          <div v-if="value !== undefined" class="h-8">
            <UiSkeleton class="inline-block h-5 w-40 align-middle" />
          </div>
          <div v-if="caption !== undefined" class="h-5">
            <UiSkeleton class="inline-block h-3 w-56 align-middle" />
          </div>
        </template>
        <!-- Nothing to draw keeps the headline's lines, blank, as the chart keeps its place. -->
        <template v-else-if="ghost()">
          <div v-if="value !== undefined" class="h-8" aria-hidden="true" data-chart-held />
          <div v-if="caption !== undefined" class="h-5" aria-hidden="true" data-chart-held />
        </template>
        <template v-else>
          <p v-if="present(value)" class="text-2xl font-semibold leading-8 text-fg tabular-nums">
            {{ shownValue }}
          </p>
          <p v-if="caption" class="text-sm leading-5 text-fg-muted">{{ caption }}</p>
        </template>
      </div>

      <!-- One grid cell holds the chart and the words over it: the taller of the two sets the height. -->
      <div
        class="relative col-start-1 grid min-w-0 [&>*]:col-start-1 [&>*]:row-start-1"
        :class="[
          headline() ? 'row-start-2' : 'row-start-1',
          bleed ? BLEED[gutter] : '',
          floor() ? FLOOR[gutter] : '',
        ]"
      >
        <!-- Nothing to draw keeps the chart's place and height, unseen and out of reach. -->
        <div
          class="min-w-0 motion-safe:transition-opacity"
          :class="[refreshing ? 'opacity-60' : '', ghost() ? 'invisible' : '']"
          :inert="ghost() || undefined"
          :aria-hidden="ghost() || undefined"
        >
          <slot v-if="has('default')" />
          <div v-else-if="firstLoad" class="flex h-60 flex-col gap-2" aria-hidden="true">
            <div class="flex min-h-0 flex-1 items-end gap-2">
              <UiSkeleton
                v-for="(h, i) in BARS"
                :key="i"
                class="min-w-0 flex-1"
                :style="{ height: `${h}%` }"
              />
            </div>
            <UiSkeleton class="h-3 w-full" />
          </div>
        </div>
      </div>
      <!-- Out of the cell that runs to the floor: the card's bottom gutter stays under them. -->
      <div
        v-if="ghost()"
        class="col-start-1 row-start-1 flex items-center justify-center px-surface"
        :class="headline() ? 'row-span-2' : ''"
        data-chart-empty
      >
        <UiNoData
          v-if="failed"
          tone="danger"
          size="sm"
          :title="t('grani.chart.loadFailed')"
          :description="reason"
        >
          <template #actions>
            <UiButton variant="secondary" data-chart-retry @click="retry">{{
              t('grani.chart.retry')
            }}</UiButton>
          </template>
        </UiNoData>
        <slot v-else name="empty">
          <UiNoData
            size="sm"
            :title="t('grani.chart.empty')"
            :description="t('grani.chart.emptyHint')"
          />
        </slot>
      </div>
      <!-- A refresh keeps the chart and turns in the middle of the card; the words are the live region's. -->
      <div
        v-if="refreshing"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
        data-chart-updating
      >
        <UiSpinner class="h-8 w-8 text-fg-muted" />
      </div>
    </div>

    <template #empty>
      <UiNoData
        v-if="failed"
        tone="danger"
        size="sm"
        :title="t('grani.chart.loadFailed')"
        :description="reason"
      >
        <template #actions>
          <UiButton variant="secondary" data-chart-retry @click="retry">{{
            t('grani.chart.retry')
          }}</UiButton>
        </template>
      </UiNoData>
      <slot v-else name="empty">
        <UiNoData
          size="sm"
          :title="t('grani.chart.empty')"
          :description="t('grani.chart.emptyHint')"
        />
      </slot>
    </template>

    <template v-if="has('footer') && ((!noData && !failed) || ghost())" #footer>
      <!-- The skeleton and the held line stand at the note's own line height, so nothing moves. -->
      <span v-if="firstLoad" class="me-auto flex h-[var(--text-sm--line-height)] items-center">
        <UiSkeleton class="h-3 w-40" />
      </span>
      <!-- Nothing to draw keeps a bare note's line, blank: a figure about data that is not there.
           Markup is the host's own and stays: a link in it leads somewhere, data or none. -->
      <span
        v-else-if="ghost() && text('footer')"
        class="me-auto flex h-[var(--text-sm--line-height)]"
        aria-hidden="true"
        data-chart-held
      />
      <!-- Bare text is a note: at the start, in a note's size and color. Markup lays itself out, a `me-auto` note before its actions. -->
      <span v-else-if="text('footer')" class="me-auto text-sm/5.5 text-fg-muted"
        ><slot name="footer"
      /></span>
      <slot v-else name="footer" />
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { Text, computed, nextTick, provide, ref, watch, type ComponentPublicInstance } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { formatChartValue, type ChartFormat } from '../utils/chartFormat'
import { flatSections, renders } from '../utils/sections'
import {
  BLEED,
  CHART_BLEED,
  CHART_EMPTY,
  CHART_FLOOR,
  CHART_SKELETON,
  FLOOR,
} from '../utils/surface'
import UiButton from './UiButton.vue'
import UiIconButton from './UiIconButton.vue'
import UiCard from './UiCard.vue'
import UiNoData from './UiNoData.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiSpinner from './UiSpinner.vue'
import UiTooltip from './UiTooltip.vue'

const tr = useUiT()
const { t } = tr

const props = withDefaults(
  defineProps<{
    /** What the chart shows: "Spending and income by month". */
    title: string
    /** One line under the title: what is counted, what is left out. */
    description?: string
    /** The gutter, as UiCard's: `sm` 16, `md` 24. */
    size?: 'sm' | 'md'
    /** A headline over the chart, a total: a number in `format`, or text already written. `null` keeps its line while it loads, and blank while there is nothing to draw. */
    value?: number | string | null
    /** A line under the headline: the shares, the span it covers. `null` keeps its line as `value` does. */
    caption?: string | null
    /** How a number `value` reads, `money` with the currency code after the digits; the chart inside takes its own. */
    format?: ChartFormat
    /** Data is on its way: a skeleton while there is none yet, the chart dimmed over data already shown. */
    loading?: boolean
    /** There is no data to draw: with `loading` it is the first load, without it `#empty`. */
    empty?: boolean
    /** The chart runs to the card's `sides`, its words on the gutter, or to the floor as well (`full`, with no footer); for a chart without a value axis. */
    bleed?: 'sides' | 'full'
    /** Why the data did not load, in words for the reader, shown with Retry; an empty string fails with a general reason. Over a chart already shown: "Not updated" on the title line. */
    error?: string | null
  }>(),
  {
    description: '',
    size: 'sm',
    value: undefined,
    caption: undefined,
    format: 'number',
    loading: false,
    empty: false,
    bleed: undefined,
    error: null,
  },
)

const emit = defineEmits<{
  /** Retry was pressed after a failed load or refresh. */
  retry: []
}>()

const slots = defineSlots<{
  /** The chart. It reads the card's first load and draws its own skeleton; anything else here is shown as it is. */
  default(props: Record<string, never>): any
  /** On the title line, at the end: a link to the details, a UiMenu. */
  actions(props: Record<string, never>): any
  /** A note under the chart: an average, the span it covers. Bare text is a note at the start, in a note's size and color; markup lays itself out, a `me-auto` note before its actions at the end. */
  footer(props: Record<string, never>): any
  /** In the chart's place when there is nothing to draw: a UiNoData that says why, with the next step in its `#actions`. It may be taller than the chart; the card grows to it. */
  empty(props: Record<string, never>): any
}>()

const firstLoad = computed(() => props.loading && props.empty)
const refreshing = computed(() => props.loading && !props.empty)
// An error given at all is a failure, an empty message too: it is never read as "no data".
const hasError = computed(() => props.error !== null && props.error !== undefined)
const reason = computed(() => props.error || t('grani.chart.loadFailedHint'))
const failed = computed(() => !props.loading && props.empty && hasError.value)
const noData = computed(() => !props.loading && props.empty && !hasError.value)
// No data and a failed load both leave nothing to draw: the chart holds its place, the words stand in it.
const nothing = computed(() => noData.value || failed.value)
// Nothing to draw over a chart in the slot: the chart keeps its height, unseen, and the words stand in it.
// Slots are read at render, not cached: a slot that comes or goes later is seen, and one whose
// `v-if` is off draws nothing, so it is no chart and no note.
const has = (name: 'default' | 'footer') => renders(slots[name]?.({}))
// A note given as bare text takes a note's size and color; markup of its own keeps its own.
const text = (name: 'footer') => flatSections(slots[name]?.({}) ?? []).every((n) => n.type === Text)
const ghost = () => nothing.value && has('default')
const present = (v: unknown) => v !== undefined && v !== null && v !== ''
// `null` holds a line while it loads and while there is nothing to draw over a held chart; with
// data, a caption stands on its own without a total.
const headline = () =>
  firstLoad.value || ghost()
    ? props.value !== undefined || props.caption !== undefined
    : present(props.value) || present(props.caption)
const shownValue = computed(() =>
  typeof props.value === 'number' ? formatChartValue(tr, props.value, props.format) : props.value,
)
// A failed refresh is said here with its reason: the visible line keeps to two words, the region says both.
const status = computed(() => {
  if (firstLoad.value) return t('grani.chart.loading')
  if (refreshing.value) return t('grani.chart.updating')
  return hasError.value && !props.empty ? `${t('grani.chart.notUpdated')}. ${reason.value}` : ''
})

// A refresh that failed over data already shown: the chart stays, the title line says it.
const stale = computed(() => hasError.value && !props.empty)
// The parent's `loading` is the one guard: a second press while it runs asks nothing, and no press waits on an answer that may never come.
function retry() {
  if (!props.loading) emit('retry')
}

// Retry leaves the DOM when the skeleton comes, the error clears, or the plate turns into the
// title line: the focus goes to the Retry now shown, else to the card. Only a focus that was on
// Retry moves; a legend button or a link in the card keeps it.
const card = ref<ComponentPublicInstance | null>(null)
const RETRY = '[data-chart-retry]'
watch(
  () => [failed.value, stale.value],
  () => {
    const root = card.value?.$el as HTMLElement | undefined
    const button = root?.querySelector(RETRY)
    if (!root || !button?.contains(document.activeElement)) return
    nextTick(() => {
      if (button.isConnected) return
      const next = root.querySelector<HTMLElement>(RETRY)
      ;(next ?? root).focus({ preventScroll: true })
    })
  },
  { flush: 'pre' },
)

provide(CHART_SKELETON, firstLoad)
provide(CHART_EMPTY, nothing)
// The floor is the body's bottom gutter; a footer under the chart keeps it. The chart is told when
// it stands on the floor, so a legend under it keeps the gutter: the card's render says it before
// the chart's, and a footer that comes or goes later changes it on the next render.
const onFloor = ref(false)
const floor = () => (onFloor.value = props.bleed === 'full' && !has('footer'))
provide(
  CHART_FLOOR,
  computed(() => onFloor.value),
)
// The gutter is set once, as the card's `size` is; `bleed` may be bound, so the chart follows it.
const gutter = props.size === 'md' ? 'surface-md' : 'surface'
provide(
  CHART_BLEED,
  computed(() => (props.bleed ? gutter : null)),
)

// Heights of the placeholder bars, in percent of the plot: an uneven line reads as a chart on its way.
const BARS = [38, 52, 44, 66, 58, 72, 61, 80, 70, 64, 76, 68]
</script>
