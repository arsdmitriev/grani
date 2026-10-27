<!-- UiPagination: page numbers with previous and next arrows. Take it under a list that pages,
     beside the count.

     What it owns. It knows the total and the page size and asks for a page, nothing else; the list
     owns the data and the page size.

     Placement. In the footer of a UiDataTable, in the corner beside the count ("1–25 of 57").

     Count. The page count is max(1, ceil(total / pageSize)); one page renders nothing.

     Out of range. A page that is out of range or unreadable is drawn as the nearest one, and a
     click is clamped to the range. The pager draws; it does not ask: on a list that shrank (a
     delete, a filter), the app sets the page to the last one, as UiDataTable does.

     Loading. While a page is on its way the app passes `loading`: the arrow that asked shows a
     spinner and keeps the focus, the other arrow is off, the numbers are held but keep the focus,
     and a press asks nothing. A number that asked shows the spinner in place of its digits, in a
     slot of the same width. A click on the current page asks nothing either. `disabled` is a
     row that cannot page at all, not a load.

     Steady row. The row holds still. Once the pages do not fit, it always shows the same number of
     slots (a gap never hides a single page), and every number is as wide as the widest, so the
     arrows stay under the pointer.

     Narrow box. It fills the box it is given, as wide as its parent or the rest of a row, and draws
     its row at the start of it: `text-center` or `text-end` on it moves the row. Where that box is
     too narrow for the numbers (20rem at `xs`, 24rem at `sm`, 28rem at `md`, a container query, not
     the screen; wider as the last page gains digits past two), they give way to "3 / 20"
     between the arrows. A number that had the focus hands it to "3 / 20".

     Keyboard.
     - `Tab`: walks the previous arrow, each page number and the next arrow; an arrow at its end is
       disabled and skipped.
     - `Enter` `Space`: press the arrow or the number, which are buttons.
     While `loading` the pressed arrow keeps the focus with its spinner, and the numbers stay in the
     Tab order (`aria-disabled`), so a press that starts a load keeps the focus in the row. An arrow
     that turns off at its end once the page has come hands the focus to the current page, or to
     "3 / 20" in the compact row; so does an arrow under the focus when the row turns `disabled`.

     Reader.
     - Landmark: a navigation landmark named "Pagination", or by the caller's `aria-label`; a second
       pager on the page takes one of its own, so the two landmarks are told apart.
     - Arrows: "Previous page" and "Next page".
     - Numbers: every number is "Page N", the current one is `aria-current="page"`, and held numbers
       are `aria-disabled`.
     - Page change: a status region, always there, says "Page N of M" when the page changes, in the
       wide row and the compact one alike; the numbers are grouped as the app's language does.
     - Compact label: "3 / 20" is read as "Page 3 of 20" when it takes the focus.
     - Loading: the pressed arrow or number says busy (`aria-busy`).

     States. Every page while they fit, the ends with a window and gaps, the first and the last page
     with an arrow inert, `loading` with a spinner on the pressed arrow, `disabled`, `compact` and the narrow row with "N / M", a
     stale page past the range drawn as the last; three steps of the ladder. One page draws nothing.

     Not for.
     - A list that loads and owns its page: UiDataTable around the table.
     - Older events at the end of a timeline: UiLog with `hasMore`.
     - Views of one page: UiTabs.
-->
<template>
  <nav
    v-if="totalPages > 1"
    ref="nav"
    :aria-label="t('grani.pagination.label')"
    class="@container w-full min-w-0 flex-1 leading-none"
  >
    <!-- Inline, so the caller's text-align places it; the line box is no taller than the row. -->
    <div class="inline-flex items-center gap-1 align-top leading-normal">
      <UiIconButton
        variant="ghost"
        :size="ladder"
        :icon="ChevronLeft"
        class="rtl:[&_svg]:-scale-x-100"
        :disabled="disabled || loading || current <= 1"
        :loading="loading && (askedArrow === 'prev' || focusedArrow === 'prev')"
        :ariaLabel="t('grani.pagination.prev')"
        @focus="focusedArrow = 'prev'"
        @blur="focusedArrow = null"
        @click="go(current - 1, 'prev')"
      />
      <template v-if="!compact">
        <!-- Keyed by the page number, not the position: the window recenters on
           every click, and a positional key remounted the focused button. -->
        <template v-for="(item, i) in items" :key="item === 'gap' ? `gap-${i}` : item">
          <span
            v-if="item === 'gap'"
            class="hidden justify-center text-fg-subtle"
            :class="[WIDE_ONLY[ladder][digits], TEXT[ladder]]"
            :style="slotWidth"
            aria-hidden="true"
          >
            <Ellipsis class="h-4 w-4" />
          </span>
          <!-- One element for every number, current or not: a node that changed
             its tag under the focus would drop it. The current page is marked,
             not an action: no hover, no press, a plain cursor. -->
          <button
            v-else
            type="button"
            class="hidden items-center justify-center rounded-control border px-2 font-medium tabular-nums transition-colors"
            :class="[
              WIDE_ONLY[ladder][digits],
              controlHeightClass[ladder],
              NUMBER[ladder],
              item === current
                ? 'cursor-default border-border bg-surface'
                : held
                  ? 'cursor-not-allowed border-transparent'
                  : 'border-transparent enabled:hover:bg-surface-muted enabled:active:brightness-95',
              held ? 'text-disabled-fg' : 'text-fg',
            ]"
            :style="slotWidth"
            :aria-label="t('grani.pagination.page', { n: item })"
            :aria-disabled="held || undefined"
            :aria-current="item === current ? 'page' : undefined"
            :aria-busy="(loading && askedPage === item) || undefined"
            @click="go(item)"
          >
            <UiSpinner v-if="loading && askedPage === item" />
            <template v-else>{{ item }}</template>
          </button>
        </template>
      </template>
      <!-- "3 / 20": always with `compact`, and in a narrow box in place of the numbers. It takes the
         focus an inert arrow hands on, with the ring a focus given by script draws; it holds the
         width of its widest "20 / 20", so the arrow after it stays put. -->
      <span
        data-compact
        tabindex="-1"
        aria-current="page"
        class="inline-block rounded-control px-2 text-center tabular-nums outline-hidden focus-visible:[box-shadow:var(--ui-ring)]"
        :class="[
          TEXT[ladder],
          held ? 'text-disabled-fg' : 'text-fg-muted',
          compact ? '' : NARROW_ONLY[ladder][digits],
        ]"
        :style="labelWidth"
        ><span aria-hidden="true">{{ current }} / {{ totalPages }}</span
        ><span class="sr-only">{{ said }}</span></span
      >
      <UiIconButton
        variant="ghost"
        :size="ladder"
        :icon="ChevronRight"
        class="rtl:[&_svg]:-scale-x-100"
        :disabled="disabled || loading || current >= totalPages"
        :loading="loading && (askedArrow === 'next' || focusedArrow === 'next')"
        :ariaLabel="t('grani.pagination.next')"
        @focus="focusedArrow = 'next'"
        @blur="focusedArrow = null"
        @click="go(current + 1, 'next')"
      />
    </div>
    <!-- Always there, in the wide row too: a region that appears with its text is announced unreliably. -->
    <p class="sr-only" role="status">
      {{ said }}
    </p>
  </nav>
</template>

<script setup lang="ts">
import { useControlSize } from '../composables/useControlSize'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Ellipsis } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import type { ControlSize } from '../types/ui'
import { controlHeightClass } from '../utils/controlSize'
import UiIconButton from './UiIconButton.vue'
import UiSpinner from './UiSpinner.vue'

// A page number is as wide as the ladder step is tall, and grows for 100+.
const NUMBER: Record<ControlSize, string> = {
  xs: 'min-w-7 text-xs/4.5',
  sm: 'min-w-9 text-sm/5.5',
  md: 'min-w-11 text-sm/5.5',
}
const SQUARE: Record<ControlSize, string> = { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }
const TEXT: Record<ControlSize, string> = {
  xs: 'text-xs/4.5',
  sm: 'text-sm/5.5',
  md: 'text-sm/5.5',
}
// The width of the nav, not of the screen, decides: the numbers need about nine squares of the
// step and their gaps (317px at `xs`, 356px at `sm`, 428px at `md` with the default window, measured in Chromium), and
// a slot grows with the digits of the last page, so the threshold moves up with them. Indexed by
// the digits, from two or fewer to seven or more.
const WIDE_ONLY: Record<ControlSize, string[]> = {
  xs: [
    '@xs:inline-flex',
    '@sm:inline-flex',
    '@md:inline-flex',
    '@lg:inline-flex',
    '@xl:inline-flex',
    '@2xl:inline-flex',
  ],
  sm: [
    '@sm:inline-flex',
    '@md:inline-flex',
    '@lg:inline-flex',
    '@xl:inline-flex',
    '@2xl:inline-flex',
    '@2xl:inline-flex',
  ],
  md: [
    '@md:inline-flex',
    '@md:inline-flex',
    '@lg:inline-flex',
    '@xl:inline-flex',
    '@2xl:inline-flex',
    '@3xl:inline-flex',
  ],
}
const NARROW_ONLY: Record<ControlSize, string[]> = {
  xs: ['@xs:hidden', '@sm:hidden', '@md:hidden', '@lg:hidden', '@xl:hidden', '@2xl:hidden'],
  sm: ['@sm:hidden', '@md:hidden', '@lg:hidden', '@xl:hidden', '@2xl:hidden', '@2xl:hidden'],
  md: ['@md:hidden', '@md:hidden', '@lg:hidden', '@xl:hidden', '@2xl:hidden', '@3xl:hidden'],
}

const { t, n } = useUiT()

const props = withDefaults(
  defineProps<{
    /** Current page, from 1 (`v-model:page`). */
    page: number
    /** Records per page; the page count is derived from it and `total`. Changing it is not this component's job. */
    pageSize: number
    /** Total records. */
    total: number
    /** "N / M" instead of page numbers, for a narrow row. */
    compact?: boolean
    /** Pages shown on each side of the current one. */
    siblings?: number
    /** Pages always shown at each end. */
    boundary?: number
    /** A page is on its way: the pressed arrow shows a spinner and keeps the focus, the numbers are held, and a press asks nothing. Pass the list's loading flag. */
    loading?: boolean
    /** The row cannot page at all: the arrows are off, the numbers are held. A load is `loading`. */
    disabled?: boolean
    /** Control size shared by every button in the row. Unset, the app's size (`createGrani({ size })`), `sm` by default. */
    size?: ControlSize
  }>(),
  { compact: false, siblings: 1, boundary: 1, loading: false, disabled: false },
)
const ladder = useControlSize(() => props.size)

const emit = defineEmits<{
  /** Asks the parent for this page, clamped to the range; the parent applies it. */
  'update:page': [page: number]
}>()

type Item = number | 'gap'

// A total nobody could count (Infinity, NaN) is one page, never a loop without an end.
// A number that came as a string (a route query, an attribute) is read as the number it says.
const total = computed(() => Number(props.total))
const pageSize = computed(() => Number(props.pageSize))
const totalPages = computed(() =>
  pageSize.value > 0 && Number.isFinite(total.value)
    ? Math.max(1, Math.ceil(total.value / pageSize.value))
    : 1,
)

// A page the parent could not read stands as the nearest whole one: NaN as the first, 2.5 as 2,
// Infinity as the last.
const safePage = computed(() => {
  const page = Number(props.page)
  return Number.isNaN(page)
    ? 1
    : Number.isFinite(page)
      ? Math.trunc(page)
      : page > 0
        ? totalPages.value
        : 1
})
// The threshold of the wide row, by the digits of the last page.
const digits = computed(() => Math.min(Math.max(String(totalPages.value).length, 2), 7) - 2)
// Every slot as wide as the widest page number: "99" to "100" moves nothing.
const slotWidth = computed(() => ({
  minWidth: `max(${SQUARE[ladder.value]}, calc(${String(totalPages.value).length}ch + 1.1rem))`,
}))
// "20 / 20" at its widest: the compact label keeps that width from page 1.
const labelWidth = computed(() => ({
  minWidth: `calc(${String(totalPages.value).length * 2 + 3}ch + 1rem)`,
}))
// Numbers and the label are held, not removed, while the row cannot page.
const held = computed(() => props.disabled || props.loading)
// A stale page (the total shrank after a delete) still renders inside the range.
const current = computed(() => Math.min(totalPages.value, Math.max(1, safePage.value)))
// Spoken with the language's grouping, as the footer's range is.
const said = computed(() =>
  t('grani.pagination.status', { page: n(current.value), total: n(totalPages.value) }),
)

// Once the pages do not fit, the row always holds the same number of slots: the ends, a
// window around the current page pushed off the ends, and a gap where two or more pages are
// hidden; a single hidden page is shown instead, since it takes the same slot.
const items = computed<Item[]>(() => {
  const tp = totalPages.value
  // A count of pages is whole and not negative: 1.5 or -1 would draw a row of odd length.
  const whole = (n: number) => Math.max(0, Math.trunc(Number(n)) || 0)
  const siblings = whole(props.siblings)
  const boundary = whole(props.boundary)
  const page = current.value
  const slots = boundary * 2 + siblings * 2 + 3
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
  if (tp <= slots) return range(1, tp)
  // No ends: the window alone, of a fixed width.
  if (boundary === 0) {
    const start = Math.min(Math.max(1, page - siblings), tp - siblings * 2)
    return range(start, start + siblings * 2)
  }
  const from = Math.max(Math.min(page - siblings, tp - boundary - siblings * 2 - 1), boundary + 2)
  const to = Math.min(Math.max(page + siblings, boundary + siblings * 2 + 2), tp - boundary - 1)
  return [
    ...range(1, boundary),
    from > boundary + 2 ? 'gap' : boundary + 1,
    ...range(from, to),
    to < tp - boundary - 1 ? 'gap' : tp - boundary,
    ...range(tp - boundary + 1, tp),
  ]
})

const nav = ref<HTMLElement | null>(null)
// One target is asked once until the next tick: two synthetic clicks in one tick are one request.
// Real presses are apart in time; what holds them is `loading`.
let pending: number | null = null
// The control that asked, so the focus can be handed on if that control turns off.
let asked: Element | null = null
// How long an ask waits for its load to start, in ms: a fetch begun on a later turn, not a slow one.
const ASK_WAIT = 300
let unasked: ReturnType<typeof setTimeout> | undefined
// The arrow that asked, and the arrow that holds the focus: while a page is on its way it shows the
// spinner and stays live, so the focus is never dropped by a load, whoever started it.
const askedArrow = ref<'prev' | 'next' | null>(null)
// The number that asked: while its page is on its way it shows the spinner in place of its digits,
// in a slot of the same width.
const askedPage = ref<number | null>(null)
const focusedArrow = ref<'prev' | 'next' | null>(null)

function go(target: number, arrow?: 'prev' | 'next') {
  if (props.disabled || props.loading) return
  const next = Math.min(totalPages.value, Math.max(1, target))
  if (next === current.value || next === pending) return
  pending = next
  asked = typeof document === 'undefined' ? null : document.activeElement
  askedArrow.value = arrow ?? null
  askedPage.value = arrow ? null : next
  emit('update:page', next)
  nextTick(() => {
    pending = null
  })
  // An app often sets `loading` a moment after the page (a fetch that starts on the next turn). An
  // ask that no load follows within that moment is over: a load that starts later for another
  // reason (a search, a refetch) does not show on this control.
  clearTimeout(unasked)
  unasked = setTimeout(() => {
    if (!props.loading) {
      askedArrow.value = null
      askedPage.value = null
    }
  }, ASK_WAIT)
}

// An arrow that turns off at its end drops the focus to the body; it goes to the current page
// instead, or to the first control still live. Only once the page has come: while it loads, the
// pressed arrow keeps the focus with its spinner.
// Called with no control, it hands on from the one that asked, and that ask is spent; called with
// one (a row turned off, a box narrowed), the ask is left for the end of its load.
function handOn(control?: Element | null) {
  const from = control === undefined ? asked : control
  if (control === undefined) asked = null
  const root = nav.value
  if (!from || !root || !root.contains(from)) return
  // Dropped: the body has it, or the control that had it is off or no longer drawn (a narrow box
  // hides the numbers).
  const dropped =
    document.activeElement === document.body ||
    (from as HTMLButtonElement).disabled === true ||
    (document.activeElement === from && from.getClientRects().length === 0)
  if (!dropped) return
  // The arrow is off at its end: it shows no spinner, the focus has moved on.
  askedArrow.value = null
  // The current page (its number, or "3 / 20" in a narrow box), else the first live control: the
  // first that takes the focus, as a hidden one does not.
  const candidates = [
    ...root.querySelectorAll<HTMLElement>('[aria-current="page"]'),
    ...root.querySelectorAll<HTMLElement>('button:not(:disabled)'),
  ]
  for (const el of candidates) {
    el.focus()
    if (document.activeElement === el) break
  }
}
watch(
  current,
  () => {
    if (!props.loading) handOn()
  },
  { flush: 'post' },
)
watch(
  () => props.loading,
  (now) => {
    if (now) return
    askedArrow.value = null
    askedPage.value = null
    handOn()
  },
  { flush: 'post' },
)
// The row turned off under the focus: the arrow that had it is disabled, so the focus goes to the
// current page, which stays focusable while held.
let hadFocus: Element | null = null
watch(
  () => props.disabled,
  (on) => {
    hadFocus = on && nav.value?.contains(document.activeElement) ? document.activeElement : null
  },
  { flush: 'pre' },
)
watch(
  () => props.disabled,
  () => {
    if (hadFocus) handOn(hadFocus)
    hadFocus = null
  },
  { flush: 'post' },
)
// The box narrowed under a focused number: the numbers give way to "3 / 20", which takes the focus.
let lastFocus: Element | null = null
let resized: ResizeObserver | undefined
const onFocusIn = (e: FocusEvent) => (lastFocus = e.target as Element)
// The person moved the focus away from a control still drawn: nothing to hand on later.
const onFocusOut = (e: FocusEvent) => {
  if ((e.target as Element).getClientRects().length) lastFocus = null
}
onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  resized = new ResizeObserver(() => {
    const from = lastFocus
    if (from && from.isConnected && from.getClientRects().length === 0) handOn(from)
  })
  watch(
    nav,
    (el, was) => {
      was?.removeEventListener('focusin', onFocusIn)
      was?.removeEventListener('focusout', onFocusOut)
      if (was) resized?.unobserve(was)
      el?.addEventListener('focusin', onFocusIn)
      el?.addEventListener('focusout', onFocusOut)
      if (el) resized?.observe(el)
    },
    { immediate: true },
  )
})
onBeforeUnmount(() => {
  resized?.disconnect()
  clearTimeout(unasked)
})
</script>
