<!--
  UiCard: a surface with an optional header, body and footer, each filled by you. Take it to group
  related content on a page.

  Header. The header is a title with a description, with `#media` before it and `#actions` beside it
  (centered on the title and its line), or a whole `#header` (a tab strip, a toolbar) running edge
  to edge. A line stands under the header by default; `:divided="false"` drops it. A body that opens
  with a UiHeader legend gets no line, since the legend is the line.

  Body. The body is padded, or runs edge to edge without `padded` (rows, a table, an image).
  `align="center"` puts its content in the middle (a 404), and `empty` puts `#empty` there.

  Image. `#image` puts media at the `top`, `bottom`, `start` or `end`, edge to edge. A side image
  stands above or below the body when the card is under 384px wide, at the media's own height; a
  card with a side image takes its parent's width.

  Footer. The footer stands under a line, with its actions at the end, plain or `muted`. A
  full-width action alone in it (`block`) stands on the body's gutter, lined up with the fields
  above. `#divider`
  takes the place of that line (a progress bar). Without `footerPadded`, the footer's children run
  edge to edge and share the width (split buttons, tabs).

  Gutter. The card passes its gutter (16, or 24 at `md`) to what is inside, so a UiList of rows or a
  separator lines up with the title. A body that ends in a UiList drops its bottom gutter, so the last row
  stands on its own inset as the rows above it do. A section of a drawer runs a UiList that is its first or last
  child to its line.

  Plain. `variant="plain"` drops the frame: the three parts alone, 16 apart, with no line under the
  header unless `divided`. The footer keeps its own line.

  Overlays. In the body of a drawer or a popover, a card is a flat section (no frame, no padding),
  with a UiSeparator the overlay places between sections. A window frames its cards.

  Title. The title is the card's one heading, and its level follows the nesting. A long word in the
  title breaks inside its column, beside the action.

  Hosts. UiChartCard, UiDataTable and UiListField are built on it; UiFilter and UiCrudDrawer take
  cards as their sections.

  Status. `tone` colors the frame of a card in trouble, and a badge in `#actions` says it in words;
  a toned card with neither `#actions` nor `#header` warns in development.
  `disabled` mutes the words and makes the card a disabled group. `loading` and `empty` stand in for
  the body.

  Keyboard.
  Not interactive: the frame takes no focus.
  - `Tab`: reaches the controls you put in `#actions`, `#header`, the body and `#footer`, which
    keep their own tab stops, in the order they stand.
  A tab in a whole `#header` and a button in an edge-to-edge footer ring inward, inside the frame.
  A focused linked image in `#image` rings the card, not itself. While the card loads, `#empty` stays,
  so a focus on its Retry stays too; when the content takes its place, the focus goes to the card,
  never to the page.

  Reader.
  - Title: a heading whose level follows the nesting: `h2` on a page, `h3` in a card; the
    description follows it.
  - Loading: `loading` marks the card `aria-busy`, and a live region says it is loading, or
    updating when there is content. Bind `loading` where the card loads, so the region is in place
    before the words.
  - Disabled: `disabled` makes the card a group named by its title, `aria-disabled`.
  - Whole header: a whole `#header` replaces the title and names nothing inside.
  - Tone: `tone` colors the frame only: the words are a badge in `#actions`.

  States. Rest; `loading` on a first load, a skeleton of three lines; `loading` over content, the
  content kept and not mounted again, dimmed to 60% with the title, the card's own controls not,
  and one spinner in the card's middle; `empty`, with `#empty` in the middle (a first load's
  skeleton wins over it, a later load leaves it as it is); `disabled`, muted words on a muted
  surface; `tone` `danger` or `warning` on the frame; `plain`, no frame; a flat section inside an
  overlay. A side image stands above the body when the card is under 384px wide.

  Not for.
  - A list screen with a toolbar and pages: UiDataTable.
  - A chart with its figure: UiChartCard.
  - One row of text with a thing at its end: UiListItem.
  - A choice among cards: UiRadioGroup `card`.
  - A notice with an action: UiListItem in a `tone`.
-->
<template>
  <div
    ref="rootEl"
    class="flex min-w-0 focus:outline-hidden data-refreshing:relative"
    :class="
      flat
        ? 'flex-col gap-4'
        : [
            shell,
            // A container reads no width from what it holds: given none, it takes its parent's.
            isColumn() ? '@container w-full flex-col' : 'flex-col',
            variant === 'plain' ? 'gap-4' : '',
          ]
    "
    :role="disabled ? 'group' : undefined"
    :aria-labelledby="disabled && title && !filled('header') ? titleId : undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :data-framed="flat || variant === 'plain' ? undefined : ''"
    :data-refreshing="refreshing() ? '' : undefined"
  >
    <!-- On the page before its words, in a card that can load: a live region that appears with its text is not read. -->
    <span v-if="loading !== undefined" role="status" class="sr-only">{{
      loading ? t(firstLoad() ? 'grani.card.loading' : 'grani.card.updating') : ''
    }}</span>
    <!-- A refresh turns in the middle of the card, over it, so nothing moves; the words are the live region's. -->
    <div
      v-if="refreshing()"
      data-card-updating
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <UiSpinner class="h-8 w-8 text-fg-muted" />
    </div>
    <!-- The row of a side image is a child: a container query reads the card's width, never its own. -->
    <component
      :is="wrap"
      data-grani
      :class="
        isColumn()
          ? ['flex flex-1 flex-col @sm:flex-row', variant === 'plain' ? 'gap-4' : '']
          : wrap === 'div'
            ? 'contents'
            : undefined
      "
    >
      <!-- Media before the words stands before them in the DOM too: the reading and tab order match the screen. -->
      <div
        v-if="hasImage() && !flat && !imageAfter"
        data-card-image
        :class="[IMAGE[imagePosition], dim()]"
      >
        <slot name="image" />
      </div>
      <component
        :is="wrap"
        data-grani
        :class="
          isColumn()
            ? ['flex min-w-0 flex-1 flex-col', variant === 'plain' ? 'gap-4' : '']
            : wrap === 'div'
              ? 'contents'
              : undefined
        "
      >
        <!-- A whole header (tabs, a toolbar) draws its own floor: the card's line only on request. -->
        <div
          v-if="filled('header')"
          :class="[
            divided === true && !flat ? 'border-b border-border' : '',
            flat ? '' : EDGE_RING_TABS,
          ]"
        >
          <slot name="header" />
        </div>
        <div
          v-else-if="hasHead()"
          class="flex items-center gap-3"
          :class="[
            bare ? '' : headPad(),
            lined() && !flat ? ['border-b border-border', bare ? 'pb-4' : ''] : '',
          ]"
        >
          <div
            v-if="filled('media')"
            class="flex shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
            :class="dim()"
          >
            <slot name="media" />
          </div>
          <div class="min-w-0 flex-1" :class="dim()">
            <component
              :is="headingTag"
              v-if="title"
              :id="titleId"
              data-grani
              class="min-w-0 font-semibold leading-6 [overflow-wrap:anywhere]"
              :class="['text-base', disabled ? 'text-fg-muted' : 'text-fg']"
            >
              {{ title }}
            </component>
            <p
              v-if="description"
              class="text-sm leading-6 text-fg-muted [overflow-wrap:anywhere]"
              :class="title ? 'mt-1' : ''"
            >
              {{ description }}
            </p>
          </div>
          <!-- On the center of the title and its line, as in UiListItem; -my-1.5 keeps a 36px control off a lone title's height. -->
          <div v-if="filled('actions')" class="-my-1.5 flex shrink-0 items-center gap-1">
            <slot name="actions" />
          </div>
        </div>
        <UiSeparator v-if="flat && lined() && (hasHead() || filled('header'))" />

        <div
          v-if="loading || showEmpty() || filled('default')"
          ref="bodyEl"
          class="min-w-0 flex-1"
          :class="[
            padded && !bare ? [bodyPad, LIST_LAST] : '',
            reach(),
            align === 'center' || showEmpty()
              ? ['flex flex-col items-center justify-center text-center', flat ? '' : 'py-12']
              : '',
            disabled ? 'text-fg-muted' : '',
            dim(),
          ]"
        >
          <div v-if="firstLoad()" class="w-full text-sm/5.5" :class="padded || bare ? '' : bodyPad">
            <div><UiSkeleton class="inline-block h-3 w-3/4 align-middle" /></div>
            <div><UiSkeleton class="inline-block h-3 w-full align-middle" /></div>
            <div><UiSkeleton class="inline-block h-3 w-1/2 align-middle" /></div>
          </div>
          <slot v-else-if="showEmpty()" name="empty" />
          <slot v-else />
        </div>

        <div v-if="filled('divider')" class="[&>*]:rounded-none">
          <slot name="divider" />
        </div>
        <div
          v-if="filled('footer')"
          class="flex"
          :class="[
            filled('divider') ? '' : 'border-t border-border',
            footerVariant === 'muted' ? 'bg-surface-muted' : '',
            footerPadded
              ? [
                  // One line: the `me-auto` item before the actions gives way and cuts, it never pushes them onto a second line.
                  // Cut across, with room below for a link's underline, which sits under the line box: Safari
                  // clips the other axis too. Only a link takes it: a note of a set height would lose it.
                  'items-center justify-end [&>.me-auto]:min-w-0 [&>.me-auto]:overflow-x-clip [&>.me-auto]:text-ellipsis [&>.me-auto]:whitespace-nowrap [&>a.me-auto:not(.ui-button)]:pb-1 [&>a.me-auto:not(.ui-button)]:-mb-1',
                  bare ? 'gap-2 pt-2' : FOOTER_PAD[size],
                ]
              : [
                  'items-stretch [&>*+*]:border-s [&>*+*]:border-s-border [&>*]:flex-1 [&>*]:rounded-none',
                  EDGE_RING,
                ],
          ]"
        >
          <slot name="footer" />
        </div>
      </component>
      <div
        v-if="hasImage() && !flat && imageAfter"
        data-card-image
        :class="[IMAGE[imagePosition], dim()]"
      >
        <slot name="image" />
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  provide,
  ref,
  useId,
  useSlots,
  watch,
  type FunctionalComponent,
  type VNode,
} from 'vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { cardShellClass } from '../utils/cardShell'
import { leadsWith, renders } from '../utils/sections'
import { CARD_DEPTH, CARD_TITLE_ID, FLAT_CARD, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'
import UiHeader from './UiHeader.vue'
import UiSeparator from './UiSeparator.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiSpinner from './UiSpinner.vue'

const { t } = useUiT()

const props = withDefaults(
  defineProps<{
    /** The heading of the card; its level follows the nesting: `h2` on a page, `h3` in a card, and so on. */
    title?: string
    /** One line under the title that says what the card holds. */
    description?: string
    /** `outline` is the framed surface; `plain` has no frame, no fill, no padding of its own: the three parts alone, on the gutter around it. */
    variant?: 'outline' | 'plain'
    /** The gutter: `sm` is `--space-surface` (16, the default), `md` is `--space-surface-md` (24). Rows, separators and lists inside line up on it. */
    size?: 'sm' | 'md'
    /** The line under the header; on by default for a framed card, off for a section of an overlay (the overlay draws the lines between sections). `false` lets the body follow the title directly. */
    divided?: boolean
    /** The body's padding; `false` runs it edge to edge, for rows, a table or an image. Rows keep their text on the gutter. */
    padded?: boolean
    /** `center` stands the body's content in the middle, with room around it: a 404; `empty` puts `#empty` there. */
    align?: 'start' | 'center'
    /** Where `#image` stands: above the header, below the footer, or beside the card at the `start` or the `end`. */
    imagePosition?: 'top' | 'bottom' | 'start' | 'end'
    /** `muted` fills the footer; `plain` keeps it on the surface. The line above it stays either way. */
    footerVariant?: 'plain' | 'muted'
    /** The footer's padding; `false` runs its children edge to edge, sharing the width: split buttons, tabs. */
    footerPadded?: boolean
    /** Meaning of the frame: `danger` for a card in trouble (a failed connection), `warning` for one that needs a look. The words say it too: a badge in `#actions`. */
    tone?: 'danger' | 'warning'
    /** The card cannot be used now: its words go muted and it is a disabled group named by its title. Controls inside are the caller's to disable. */
    disabled?: boolean
    /** The body is on its way. With nothing in the body yet (the first load) a skeleton stands in its place; over content (a refresh) the content stays, dimmed to 60% with the title, under one spinner in the card's middle; `#actions`, a whole `#header` and `#footer` keep their color and still work. `aria-busy` either way. Bind it (`false` too) where the card loads, so its live region is there before the words. A body with a shape of its own (a table, a chart) draws its own skeleton. */
    loading?: boolean
    /** There is nothing to show: `#empty` stands in the body's place, in the middle. A first load's skeleton wins over it; a later load leaves it as it is: give its Retry `loading`. */
    empty?: boolean
  }>(),
  {
    title: '',
    description: '',
    variant: 'outline',
    size: 'sm',
    divided: undefined,
    padded: true,
    align: 'start',
    imagePosition: 'top',
    footerVariant: 'plain',
    footerPadded: true,
    tone: undefined,
    disabled: false,
    loading: undefined,
    empty: false,
  },
)

defineSlots<{
  /** The whole header in place of the title line: a tab strip, a toolbar. It runs edge to edge. */
  header(props: Record<string, never>): any
  /** Before the title: a glyph plate, an avatar. Glyphs are 20px. */
  media(props: Record<string, never>): any
  /** At the end of the header, on the center of the title and its line: a button, a badge, a switch, a UiMenu. */
  actions(props: Record<string, never>): any
  /** The body of the card. */
  default(props: Record<string, never>): any
  /** In the body's place while `empty`: a UiNoData, which drops its own frame in a card. */
  empty(props: Record<string, never>): any
  /** Media edge to edge at `imagePosition`: an image in a UiAspectRatio, a gradient. */
  image(props: Record<string, never>): any
  /** Under a line: the actions stand at the end; a note or a total takes `me-auto`. */
  footer(props: Record<string, never>): any
  /** In place of the line above the footer, edge to edge: a UiProgress `h-1`, whose track is the line's color. */
  divider(props: Record<string, never>): any
}>()
const cardSlots = useSlots()

const flat = inject(FLAT_CARD, false)
// The header is divided unless told otherwise; a section of an overlay and a `plain` card are not.
// A body that opens with a UiHeader legend has its line already; read at render, as slots are.
const lined = () =>
  props.divided ?? (!flat && props.variant !== 'plain' && !(drawsBody() && opensWithLegend()))
const drawsBody = () => !firstLoad() && !showEmpty()
const isLegend = (v: VNode) =>
  v.type === UiHeader && (v.props as { variant?: string } | null)?.variant === 'legend'
const opensWithLegend = () => leadsWith(cardSlots.default?.(), isLegend)
// A card's children are framed again: only the overlay's own sections are flat.
provide(FLAT_CARD, false)

// The gutter is a token a product sets once: `--space-surface`, `--space-surface-md` at `md`.
const gutter = computed(() => (props.size === 'md' ? 'surface-md' : 'surface'))
// An undivided header leaves its floor to the body, unless nothing follows; read at render, as slots are.
const headPad = () => {
  const full = props.size === 'md' ? 'p-surface-md' : 'p-surface'
  if (lined() || !(props.loading || showEmpty() || filled('default'))) return full
  return props.size === 'md' ? 'px-surface-md pt-surface-md' : 'px-surface pt-surface'
}
const bodyPad = computed(() => (props.size === 'md' ? 'p-surface-md' : 'p-surface'))
// A body that ends in a list, the list last in each block round it, drops its bottom gutter: the
// last row's own inset stands under it, as under the rows above. Six blocks deep, a chart card's.
// The chain stops at a framed card inside: its own body keeps the list, the outer keeps its gutter.
const LIST_LAST =
  'has-[>.ui-list:last-child,>:last-child:not([data-framed])>.ui-list:last-child,>:last-child:not([data-framed])>:last-child:not([data-framed])>.ui-list:last-child,>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>.ui-list:last-child,>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>.ui-list:last-child,>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>:last-child:not([data-framed])>.ui-list:last-child]:pb-0'
// One number in a footer, inset and gap alike (8, 12 at md); a note, text, stands on the body's line.
// A full-width action alone in the footer stands on the body's gutter, its edges under the fields'.
const FOOTER_PAD = {
  sm: 'gap-2 p-2 [&>.me-auto:not(button)]:ps-2 has-[>:is(button,a).w-full:only-child]:p-surface',
  md: 'gap-3 p-3 [&>.me-auto:not(button)]:ps-3 has-[>:is(button,a).w-full:only-child]:p-surface-md',
} as const
// A control on the frame's edge rings inward: the shell clips a halo drawn outside it.
const EDGE_RING = '[&>*:focus-visible]:shadow-(--ui-ring-inset)'
const EDGE_RING_TABS = '[&_[role=tab]:focus-visible]:shadow-(--ui-ring-inset)'
const SIDE_IMG =
  '@sm:[&>img]:h-full [&>img]:w-full [&>img]:object-cover @sm:[&>picture>img]:h-full [&>picture>img]:w-full [&>picture>img]:object-cover'
// The card's corners clip the media; beside the body a UiAspectRatio fills the column, not its ratio.
// A focused linked image rings the card, not itself: its own halo would draw a band on the body.
const ONE_RING = '[&_a:not(.absolute):focus-visible]:shadow-none'
const IMAGE = {
  top: `[&>*]:rounded-none ${ONE_RING}`,
  bottom: `[&>*]:rounded-none ${ONE_RING}`,
  start: `w-full @sm:w-2/5 shrink-0 @sm:[&>*]:h-full [&>*]:w-full [&>*]:rounded-none ${ONE_RING} ${SIDE_IMG}`,
  end: `w-full @sm:w-2/5 shrink-0 @sm:[&>*]:h-full [&>*]:w-full [&>*]:rounded-none ${ONE_RING} ${SIDE_IMG}`,
} as const
const imageAfter = computed(() => props.imagePosition === 'bottom' || props.imagePosition === 'end')
const sideImage = computed(() => props.imagePosition === 'start' || props.imagePosition === 'end')
const hasImage = () => filled('image')
const isColumn = () => sideImage.value && !flat && hasImage()
const Pass: FunctionalComponent = (_, { slots }) => slots.default?.()
// The wrapper is chosen by the place of the image, not by whether it is drawn yet: an image that
// comes later would swap it and mount the header, the body and what was typed in it anew.
const wrap = computed(() => (sideImage.value && !flat ? 'div' : Pass))
// `plain` and a flat section are the three parts alone: no padding of their own.
const bare = computed(() => flat || props.variant === 'plain')
// A slot that renders only comments (a `v-if` that is off) is no part; read at render, so a later one is seen.
const filled = (
  name: 'header' | 'media' | 'actions' | 'default' | 'footer' | 'empty' | 'divider' | 'image',
) => renders(cardSlots[name]?.())
// Once the card has answered (it stood with `loading` off), a load keeps what it shows: the content,
// or `#empty` with its Retry, so the card keeps its height and a focus on Retry stays. Before that
// answer a load is the first one, drawn as the skeleton.
const answered = ref(!props.loading)
watch(
  () => props.loading,
  (on) => {
    if (!on) answered.value = true
  },
)
const showEmpty = () =>
  Boolean(props.empty) && filled('empty') && (!props.loading || answered.value)
// A first load has nothing to keep; a refresh keeps what is shown.
const firstLoad = () =>
  Boolean(props.loading) && !showEmpty() && (Boolean(props.empty) || !filled('default'))
// A refresh: content in view, dimmed. A first load is the skeleton alone, never a spinner as well;
// a load over `#empty` leaves it as it is, since its Retry shows the wait with its own `loading`.
const refreshing = () => Boolean(props.loading) && !firstLoad() && !showEmpty()
// A refresh dims what the card shows, never its frame or its own controls (`#actions`, a whole
// `#header`, `#footer`): they still work, so they do not look disabled.
const dim = () => [
  'motion-safe:transition-opacity duration-normal ease-standard',
  refreshing() ? 'opacity-60' : '',
]
const hasHead = () =>
  Boolean(props.title || props.description || filled('actions') || filled('media'))

// The frame by meaning and by state; `plain` has none, a flat section neither.
const shell = computed(() => {
  if (props.variant === 'plain') return ''
  const border =
    props.tone === 'danger'
      ? 'border-danger-border/60'
      : props.tone === 'warning'
        ? 'border-warning-border/60'
        : ''
  return [
    'overflow-hidden',
    cardShellClass,
    border,
    props.disabled ? 'bg-surface-muted' : '',
    'has-[[data-card-image]_a:not(.absolute):focus-visible]:shadow-(--ui-ring)',
  ]
})

// A padded body is bled through (a row, a separator reach the frame, text on the gutter); an unpadded
// one pads its rows, 12 among an overlay's fields; flat and `plain` pass the outer gutter on. Set once.
const outer = inject(SURFACE_GUTTER, null)
const amongFields = outer === 'drawer' || outer === 'overlay'
if (!flat && props.variant !== 'plain') {
  provide(SURFACE_GUTTER, props.padded ? gutter.value : null)
  provide(ROW_INSET, props.padded ? null : amongFields ? 'field' : gutter.value)
}
// A section of a drawer runs a UiList that is its own first or last child to its line: the top
// while no header stands over the body, the bottom always, since a section has no footer. A list
// inside a block of the section stays in place.
const reach = () =>
  flat && outer === 'drawer'
    ? [
        !hasHead() && !filled('header') ? '[&>.ui-list:first-child]:-mt-drawer' : '',
        '[&>.ui-list:last-child]:-mb-drawer',
      ]
    : ''

if (isDev())
  watch(
    () => [props.size, props.padded, props.variant],
    () =>
      console.warn(
        '[grani] UiCard: `size`, `padded` and `variant` are set once; render another card for another shape.',
      ),
  )

// The level follows the nesting, never a prop: a forgotten prop fails no gate and leaves two h2.
const titleId = `ui-card-title-${useId()}`
provide(
  CARD_TITLE_ID,
  // Read as the heading is: a #header that renders only a comment leaves the title naming the group.
  computed(() => (props.title && !filled('header') ? titleId : undefined)),
)
const depth = inject(CARD_DEPTH, 0)
provide(CARD_DEPTH, depth + 1)
const headingTag = computed(() => `h${Math.min(depth + 2, 6)}`)

if (isDev() && flat && cardSlots.footer)
  console.warn(
    '[grani] UiCard: a section of an overlay has no footer; the overlay holds the actions in its own.',
  )
if (isDev() && flat && cardSlots.image)
  console.warn(
    '[grani] UiCard: a section of an overlay draws no `#image`; put the media in the body.',
  )
// The frame's color alone says nothing in grayscale or to a reader: the words are the app's, a badge
// in `#actions` or its own `#header`. Read when the tone comes, which is often after the mount, and
// said once: a tone that follows a poll would repeat it. The slot is read as given, not as drawn
// (a slot is drawn only at render), so an `#actions` whose content is switched off passes.
let saidTone = false
// A status region that comes with its words is not read: `loading` is bound from the start.
let saidLate = false
if (isDev()) {
  watch(
    () => props.tone,
    (tone) => {
      if (saidTone || !tone || flat || props.variant === 'plain') return
      if (cardSlots.actions || cardSlots.header) return
      saidTone = true
      console.warn(
        '[grani] UiCard: `tone` colors the frame only; say what is wrong in words, with a badge in `#actions`.',
      )
    },
    { immediate: true },
  )
  watch(
    () => props.loading,
    (now, before) => {
      if (saidLate || before !== undefined || now === undefined) return
      saidLate = true
      console.warn(
        '[grani] UiCard: bind `loading` from the start, `false` included; a status region that appears with its words is not read.',
      )
    },
  )
}
// `#empty` or the content leaves the body when `loading` or `empty` turns. A focus that was on it
// (Retry in `#empty`) goes to the card, never to the page; the card takes it for that moment only,
// so a click on its text does not focus the frame. A focus that stays where it was is left alone.
const rootEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
watch(
  () => [props.loading, props.empty],
  () => {
    const root = rootEl.value
    if (!root || !bodyEl.value?.contains(document.activeElement)) return
    nextTick(() => {
      if (root.contains(document.activeElement)) return
      if (!root.hasAttribute('tabindex')) {
        root.setAttribute('tabindex', '-1')
        root.addEventListener('blur', () => root.removeAttribute('tabindex'), { once: true })
      }
      root.focus({ preventScroll: true })
    })
  },
  { flush: 'pre' },
)

if (isDev() && props.tone && (flat || props.variant === 'plain'))
  console.warn(
    '[grani] UiCard: `tone` colors the frame, and a section of an overlay or a `plain` card has none; say it with a badge.',
  )
</script>
