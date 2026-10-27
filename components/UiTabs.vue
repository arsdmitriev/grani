<!--
  UiTabs: panes of one screen, one at a time. Take it when a page or a record splits into parts a
  person moves between; a choice with no panes is UiRadioGroup `segmented`.

  Panes. The root is a `<div>`. The active tab's pane is the slot named after its value
  (`#overview`); a tab without a slot renders no pane. A pane that is not shown is unmounted, so a
  form in it must keep its values in the parent, not in the DOM. The pane follows `modelValue`, not
  the tabs: a value whose tab is gone (taken away with a permission) still shows its slot, named by
  no tab, so set `modelValue` to a tab that stays when the tabs change.

  Variants. `underline` is a strip on its own. `panel` puts the strip inside the card shell as the
  header of a block, with `#header` above it; inside a UiCard's `#header`, the card is the shell and
  the panel draws none of its own. A tab stands on the control ladder (`size`, else the app's step).

  Focus. A focused tab rings inward with its underline kept, so no scroll edge or card clips the
  ring. In forced colors the selected tab is highlighted.

  Direction. The strip follows the reading direction: on a right-to-left page it starts at the
  right, and its paging arrow and faded edge stand on the side where tabs wait.

  Routing. The active tab is not synced to the URL; the consumer does that around `v-model`.

  Keyboard.
  The WAI-ARIA tab pattern: the strip has one tab stop, the active tab, and a move activates the
  tab and focuses it.
  - `ArrowLeft` `ArrowRight`: the tab to the left and the tab to the right, round the ends; a
    disabled tab is passed over. On a right-to-left page the strip starts at the right, so
    `ArrowRight` is the tab before and `ArrowLeft` the tab after.
  - `Home` `End`: the first and the last tab.
  - `Tab`: on to the pane's first control, or to the pane when it holds none.
  - `ArrowUp` `ArrowDown`: stay the page's: the strip is horizontal.
  - `Alt` `Ctrl` `Meta`: a chord with them stays the browser's.
  The paging arrows of a wide set are for the pointer, outside the tab order.

  Reader.
  - Strip: a `tablist` named by `ariaLabel`.
  - Tab: says whether it is selected (`aria-selected`) and controls its pane (`aria-controls`)
    only while the pane is there; a disabled tab says so (`aria-disabled`).
  - Pane: a `tabpanel` named by its tab.
  - Badge: read in the words of `badgeLabel`, with the number hidden; a bare number warns in dev,
    since the reader would hear the label and the number as one.

  States. Active, with the brand ink and underline; rest; hover, only when enabled; disabled, in the
  disabled ink, not chosen by a click or a key; focus, ringing inward with the underline kept. `panel` in the card shell, with `#header` and a rule above the
  strip, and inside a UiCard's `#header` with no shell of its own; `underline` on its own. A set
  wider than the strip scrolls, with faded edges and arrows on desktop. In forced colors the
  selected tab is highlighted. `sm` is 36px, `md` 44px.

  Not for.
  - A choice with no panes: UiRadioGroup `segmented`.
  - Pages of one set: UiPagination.
  - The places of the app: UiAppShell.
  - A block shown or hidden in place: UiReveal.
-->
<template>
  <div
    :class="variant === 'panel' && !inCard ? shellClass : undefined"
    :data-ui-tabs-shell="variant === 'panel' ? '' : undefined"
  >
    <div v-if="hasHeader()" data-ui-tabs-header>
      <slot name="header" />
    </div>

    <!-- The rule above the strip appears with the header, so the strip reads as
         its own floor and not as a continuation of what stands above it. A set
         wider than the strip scrolls sideways, with no bar: the edges fade where
         more tabs wait, and on a desktop pointer arrows page through them. -->
    <div
      class="relative border-b border-border"
      :class="[variant === 'panel' ? 'bg-surface-muted' : '', hasHeader() ? 'border-t' : '']"
    >
      <div
        ref="stripRef"
        role="tablist"
        :aria-label="ariaLabel"
        class="relative flex gap-1 overflow-x-auto overflow-y-hidden ui-scroll-hidden overscroll-x-contain whitespace-nowrap"
        :style="fadeStyle"
        @scroll.passive="measure"
      >
        <button
          v-for="(tab, i) in tabs"
          :id="tabId(i)"
          :key="String(tab.value)"
          :ref="(el) => setButton(el, i)"
          type="button"
          role="tab"
          :aria-selected="tab.value === modelValue"
          :aria-controls="
            tab.value === modelValue && $slots[String(tab.value)] ? panelId : undefined
          "
          :aria-disabled="tab.disabled || undefined"
          :tabindex="i === currentIndex ? 0 : -1"
          :class="buttonClass(tab.value === modelValue, tab.disabled)"
          @click="activate(i)"
          @keydown="onKey"
        >
          <span>{{ tab.label }}</span>
          <!-- md: at sm a 10 px digit did not read on the panel's gray strip. -->
          <UiCount
            v-if="typeof tab.badge === 'number' && tab.badge > 0"
            :count="tab.badge"
            :tone="tab.badgeTone ?? (tab.value === modelValue ? 'brand' : 'neutral')"
            size="md"
            :aria-hidden="tab.badgeLabel ? 'true' : undefined"
          />
          <UiCount
            v-else-if="typeof tab.badge === 'string' && tab.badge !== ''"
            :tone="tab.badgeTone ?? (tab.value === modelValue ? 'brand' : 'neutral')"
            size="md"
            :aria-hidden="tab.badgeLabel ? 'true' : undefined"
            >{{ tab.badge }}</UiCount
          >
          <span v-if="hasBadge(tab) && tab.badgeLabel" class="sr-only">{{ tab.badgeLabel }}</span>
        </button>
      </div>
      <button
        v-if="canLeft"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="absolute inset-y-0 left-0 hidden w-8 items-center justify-center text-fg-muted enabled:hover:text-fg [@media(hover:hover)_and_(pointer:fine)]:flex"
        @click="page(-1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        v-if="canRight"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="absolute inset-y-0 right-0 hidden w-8 items-center justify-center text-fg-muted enabled:hover:text-fg [@media(hover:hover)_and_(pointer:fine)]:flex"
        @click="page(1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="$slots[String(modelValue)]"
      :id="panelId"
      ref="paneRef"
      role="tabpanel"
      :aria-labelledby="matched ? tabId(currentIndex) : undefined"
      :tabindex="paneHasStop ? undefined : 0"
      :class="
        variant === 'panel'
          ? 'p-surface focus:outline-hidden'
          : inCard
            ? 'focus:outline-hidden'
            : 'mt-4 focus:outline-hidden'
      "
    >
      <PaneGutter v-if="variant === 'panel'"><slot :name="String(modelValue)" /></PaneGutter>
      <slot v-else :name="String(modelValue)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { TabItem, TabValue } from '../types/ui'
import { cardShellClass } from '../utils/cardShell'
import { renders } from '../utils/sections'
import { CARD_DEPTH, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'
import { isDev } from '../utils/dev'
import { useControlSize } from '../composables/useControlSize'
import { controlHeightClass } from '../utils/controlSize'
import UiCount from './UiCount.vue'

const props = withDefaults(
  defineProps<{
    /** Value of the active tab (`v-model`). */
    modelValue: TabValue
    /** Tabs in order: `value`, `label`, `disabled`, and a `badge` with its `badgeTone` and `badgeLabel` (what it means, in words). */
    tabs: TabItem[]
    /** `panel` (the default) is the header of a block inside the card shell; `underline` is a strip on its own. */
    variant?: 'underline' | 'panel'
    /** Accessible name of the tab set. */
    ariaLabel: string
    /** Step of a tab on the control ladder: `sm` 36px, `md` 44px. Unset, the app's size (`createGrani({ size })`); `xs` is read as `sm`. */
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { variant: 'panel' },
)

defineSlots<{
  /** Above the strip, inside the shell; `panel` only. What the tabs do not switch. */
  header(props: Record<string, never>): any
  /** The pane of one tab: the slot is named after the tab's value, such as `#overview`. */
  [name: string]: (props: Record<string, never>) => any
}>()

const emit = defineEmits<{ 'update:modelValue': [value: TabValue] }>()

// Ids from the place, not the value: a value with a space would be two ids in an IDREF list.
const uid = useId()
const tabId = (i: number) => `${uid}-tab-${i}`
const panelId = `${uid}-panel`
const step = useControlSize(() => props.size)
const ladder = computed(() => (step.value === 'xs' ? 'sm' : step.value))

const buttons = ref<HTMLButtonElement[]>([])
function setButton(el: unknown, i: number) {
  if (el) buttons.value[i] = el as HTMLButtonElement
}

const matched = computed(() => props.tabs.some((t) => t.value === props.modelValue))
const currentIndex = computed(() => {
  const i = props.tabs.findIndex((t) => t.value === props.modelValue)
  return i === -1 ? 0 : i
})

function activate(i: number) {
  const tab = props.tabs[i]
  if (!tab || tab.disabled) return
  if (tab.value !== props.modelValue) emit('update:modelValue', tab.value)
  buttons.value[i]?.focus()
}

// The next tab that can be chosen, from `from` in the direction of `step`, wrapping round the
// ends as the WAI-ARIA tab pattern does; a disabled tab is passed over.
function nextEnabled(from: number, step: 1 | -1) {
  const n = props.tabs.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + step * k) % n) + n) % n
    if (!props.tabs[i]?.disabled) return i
  }
  return -1
}
// The strip is horizontal: ↑ and ↓ stay the page's, so they scroll it. A chord is the browser's.
// In a right-to-left page the strip starts at the right, so there ArrowRight is the tab before.
const KEYS: Record<string, (rtl: boolean) => void> = {
  ArrowLeft: (rtl) => activate(nextEnabled(currentIndex.value, rtl ? 1 : -1)),
  ArrowRight: (rtl) => activate(nextEnabled(currentIndex.value, rtl ? -1 : 1)),
  Home: () => activate(nextEnabled(-1, 1)),
  End: () => activate(nextEnabled(props.tabs.length, -1)),
}
function onKey(e: KeyboardEvent) {
  const run = KEYS[e.key]
  if (!run || e.altKey || e.ctrlKey || e.metaKey) return
  e.preventDefault()
  run(getComputedStyle(e.currentTarget as Element).direction === 'rtl')
}

const shellClass = `overflow-hidden ${cardShellClass}`
// In a card's `#header` the card is the shell: a second frame inside the first is a double border.
const inCard = inject(CARD_DEPTH, 0) > 0

// A panel's pane is a padded body, as a card's is: its rows and separators bleed to the frame
// on its gutter. Only the pane; the header above runs edge to edge on its own.
const PaneGutter = defineComponent({
  setup(_, { slots }) {
    provide(SURFACE_GUTTER, 'surface')
    provide(ROW_INSET, null)
    return () => slots.default?.()
  },
})
// A header slot whose content is a `v-if` that is off draws no band and no rule.
const slots = useSlots()
// Read in the render, not a computed: a slot is not reactive, and one that comes later must count.
const hasHeader = () => props.variant === 'panel' && renders(slots.header?.())

// The underline is an inset shadow inside the tab, not a border laid over the strip's rule
// with -1px: a scrolling strip clips anything that overhangs it. Focus rings inward too, the
// underline layered under it, so neither a scroll edge nor a card clips the ring; heavier than
// a card's own inward ring for a bare tab, which would drop the underline.
function buttonClass(active: boolean, disabled = false) {
  const base = [
    'ui-tab inline-flex shrink-0 items-center gap-1.5 rounded-t-control px-4 text-sm/5.5 font-medium transition-[color,box-shadow] focus:outline-hidden',
    controlHeightClass[ladder.value],
  ]
  // `aria-disabled`, not `disabled`: the button stays `:enabled`, so the hover is left out here.
  if (disabled && !active) return [...base, 'cursor-not-allowed text-disabled-fg']
  return active
    ? [
        ...base,
        'text-brand shadow-[inset_0_-2px_0_var(--color-brand)]',
        '[&[role=tab][aria-selected]:focus-visible]:shadow-[inset_0_-2px_0_var(--color-brand),var(--ui-ring-inset)]',
      ]
    : [
        ...base,
        'text-fg-muted enabled:hover:text-fg enabled:hover:shadow-[inset_0_-2px_0_var(--color-border-strong)]',
        '[&[role=tab][aria-selected]:focus-visible]:shadow-(--ui-ring-inset)',
      ]
}

// Which edges hide more tabs. Measured on scroll, on resize and when the set changes.
const stripRef = ref<HTMLElement | null>(null)
const canLeft = ref(false)
const canRight = ref(false)
function measure() {
  const el = stripRef.value
  if (!el) return
  // scrollLeft runs negative from the start of a right-to-left strip: the start is on its right.
  const from = Math.abs(el.scrollLeft)
  const atStart = from <= 1
  const atEnd = from + el.clientWidth >= el.scrollWidth - 1
  const rtl = getComputedStyle(el).direction === 'rtl'
  canLeft.value = rtl ? !atEnd : !atStart
  canRight.value = rtl ? !atStart : !atEnd
}
// Wider than the arrow, so the arrow never sits on readable text.
const FADE = '48px'
const fadeStyle = computed(() => {
  if (!canLeft.value && !canRight.value) return undefined
  const from = canLeft.value ? `transparent 0, black ${FADE}` : 'black 0'
  const to = canRight.value ? `black calc(100% - ${FADE}), transparent 100%` : 'black 100%'
  const mask = `linear-gradient(to right, ${from}, ${to})`
  return { maskImage: mask, WebkitMaskImage: mask }
})

function page(direction: 1 | -1) {
  const el = stripRef.value
  if (!el) return
  // An explicit `smooth` wins over the reduced-motion stylesheet; ask the media query instead.
  const still =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: still ? 'auto' : 'smooth' })
}

// The active tab rides into view, clear of the fade, when it changes.
function reveal() {
  const el = stripRef.value
  const tab = buttons.value[currentIndex.value]
  // Measured on screen, not by offsetLeft, which a right-to-left strip counts from its far end.
  if (!el?.clientWidth || !tab) return
  const box = el.getBoundingClientRect()
  const at = tab.getBoundingClientRect()
  const pad = 32
  if (at.left - pad < box.left) el.scrollLeft -= box.left - (at.left - pad)
  else if (at.right + pad > box.right) el.scrollLeft += at.right + pad - box.right
}

let observer: ResizeObserver | undefined
onMounted(() => {
  reveal()
  measure()
  if (typeof ResizeObserver !== 'undefined' && stripRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(stripRef.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(
  () => props.modelValue,
  () => nextTick(() => (reveal(), measure())),
)
// A tab that widens in place (a badge comes, a label is translated) moves the overflow too.
watch(() => props.tabs, measure, { deep: true, flush: 'post' })

// A pane with a control of its own needs no stop of its own: Tab reaches the control.
const paneRef = ref<HTMLElement | null>(null)
const paneHasStop = ref(false)
const STOPS = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
const checkPane = () => (paneHasStop.value = Boolean(paneRef.value?.querySelector(STOPS)))
onMounted(checkPane)
onUpdated(checkPane)
// The badge is read with the tab's name: its meaning in words, or a dev warning for a bare one.
const hasBadge = (tab: TabItem) =>
  (typeof tab.badge === 'number' && tab.badge > 0) ||
  (typeof tab.badge === 'string' && tab.badge !== '')
onMounted(() => {
  const bare = props.tabs.find((tab) => hasBadge(tab) && !tab.badgeLabel)
  if (isDev() && bare)
    console.warn(
      `[grani] UiTabs: the tab "${bare.value}" has a badge with no \`badgeLabel\`; a screen reader hears the bare number.`,
    )
})
</script>
