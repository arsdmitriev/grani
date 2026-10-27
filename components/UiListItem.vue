<!--
  UiListItem: one row, a title and its text on the left and a thing on the right. Take it for every
  row: a plain one, a link, a setting, a command, a notice; rows one under another stand in a UiList.

  Anatomy. It is the library's one row: media, text and actions, centered on the row. A component
  with text on the left and a thing on the right stands on a UiListItem and does not draw its own
  row.

  Modes. A row is one of four, told apart by its props and checked by TypeScript: a plain row; a
  link (`to`); a field (`as="label"`); a command (`as="button"`, with `step`, `loading` and
  `tone="danger"`). A prop of another mode is a type error, such as `step` on a link or `error` on a
  command.

  Link. With `to`, the whole row is a link ending in a chevron that slides on hover; a page on
  another site opens in a new tab and ends in an arrow instead, as with UiLink. A link holds no interactive actions, a badge or a
  text at most, because a button inside a link makes two controls in one.

  Lines. A row draws no line of its own: the UiList it stands in divides its rows, so a card of rows
  is UiCard `:padded="false"` around a UiList.

  Notice. With `tone` a plain row is a notice, read as a status, with the glyph of its tone first
  (`#media` gives another) and its tone said to a screen reader; `xs` outline buttons go in
  `#actions`. It replaces a callout: a title, text, an action. Alone (over a form, in a toast) it is
  drawn like a toast: a white card whose start edge is in the tone. In a UiList it is a row of the
  list: the rows' edges, height and lines, no card of its own, and the tone's 3px edge at the start
  along the whole row; `variant="soft"` fills that row with the tone's pale plate as well, as on a
  soft badge.

  Field. `as="label"` makes the row a field: the title names the one control in `#actions` (a
  UiSwitch, a UiCheckbox, a UiSelect), the description or `error` describes it, `required` marks it,
  and a click anywhere on the row reaches it. A setting row is this, with a UiSwitch in `#actions`.

  Command. `as="button"` makes the row a command: the whole row is a button, with a status glyph in
  `#actions` (a check, a trash can). `loading` puts a spinner in the glyph's place and refuses
  clicks while the focus stays. `tone="danger"` is the red ink of a command that cannot be undone.
  `step` ends the row in a chevron, as on a link: the row goes one level in, to a step of
  UiCrudDrawer (Rules, Move to), with a count or a word in `#actions`. Such rows one after another
  form the action block of a record. In UiMenu a command row is an item of the menu, drawn by the
  menu as a row of its panel list.

  Lit. `lit` lights a row for a moment: the one UiListField just added, or the one a refused repeat
  points at.

  Placement. It stands in a UiList in a card, in a drawer section, in a dropzone's file list; alone
  in a toast and in a table's error row and bulk bar. Its neighbors are UiField (a label above its
  control) and UiButton. A link or a command row holds no control in `#actions`, and warns if it
  does. The chevron and the text follow the reading direction.

  Highlight. `highlight` marks the letters a search found.

  Keyboard.
  A plain row takes no focus; the controls in `#actions` do.
  With `to`, the whole row is a link:
  - `Enter`: follows it.
  With `as="button"`, a native button:
  - `Enter` `Space`: press it; `loading` or `disabled` refuses the press in the capture phase,
    before the router sees it, keeping the focus while loading. A held Enter is one press: its
    repeats press nothing.
  `as="label"` reaches its one control with a click anywhere on the row; the control keeps its own
  keys.

  Reader.
  - Row: the title, then the description; `highlight` marks letters for the eye only.
  - Label row: names its control by the title (`aria-labelledby`), describes it by the
    description or the error (`aria-describedby`), and marks it `aria-invalid` and
    `aria-required`; the error is an alert.
  - Notice: a `status` that says its tone in words before the title. It appears with its words,
    which is often not read out; what must be heard goes through a toast (UiToaster).
  - Link: to another site, says it opens a new tab.
  - Command: says busy while loading (`aria-busy`, `aria-disabled`).
  - Glyphs: the chevron and the tone glyph are hidden.
  - In a list: in a UiList it is a list item.

  States. Rest; hover and focus as a band on a link or a command; `disabled`, in the disabled ink
  and cursor, not faded; `loading`, a spinner in place of the glyph, with the ink kept; `tone` as
  the ink of a command (`danger` red, `brand` for the one that creates something new), or as a
  notice on a plain row (a card alone, a row with the tone's edge in a list, `soft` filled there);
  `lit`, a moment of brand color; a label row whose control is disabled, with the title muted;
  `step`, a chevron at the end. A row of a list is 44px tall at `sm` and 56px at `md`: a second line of
  text grows it, a control in `#actions` does not (up to the row's own height, 44 and 56).

  Not for.
  - A field with its label above its control: UiField.
  - An action on its own: UiButton.
  - A list of names that grows from its last row: UiListField.
  - A message about a request: a toast through UiToaster.
  - Why a list is empty: UiNoData.
-->
<template>
  <component
    :is="tag"
    ref="rootRef"
    data-grani
    :to="isLink ? to : undefined"
    :target="isLink ? resolved.target : undefined"
    :rel="isLink ? resolved.rel : undefined"
    :type="tag === 'button' ? 'button' : undefined"
    :disabled="tag === 'button' && (disabled || unsafe) && !loading ? true : undefined"
    :aria-disabled="loading ? 'true' : undefined"
    :aria-busy="loading || undefined"
    :data-focus="interactive && tone === 'danger' ? 'danger' : undefined"
    :role="notice ? 'status' : undefined"
    :data-row="row ? '' : undefined"
    :for="wired ? wiring!.id.value : undefined"
    :class="classes"
    @click.capture="refuse"
    @click="onClick"
    @keydown="onHeld"
  >
    <div
      v-if="$slots.media || toneGlyph"
      class="flex shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
      :class="[soft ? '' : 'text-fg-muted', notice && title && description ? 'self-start' : '']"
    >
      <slot name="media">
        <component :is="toneGlyph" aria-hidden="true" :class="soft ? '' : TONE_GLYPH_INK[tone!]" />
      </slot>
    </div>
    <div class="min-w-0 flex-1">
      <span v-if="notice" class="sr-only">{{ t(NOTICE_WORD[tone as NoticeTone]) + ': ' }}</span>
      <slot>
        <p
          v-if="title"
          :id="wiring?.ids.label.value"
          class="break-words text-sm/5.5 font-medium"
          :class="
            interactive && disabled && !loading
              ? 'text-disabled-fg'
              : tone && interactive
                ? ''
                : wired
                  ? 'text-fg group-[:has(:disabled)]/row:text-fg-muted'
                  : soft
                    ? ''
                    : 'text-fg'
          "
        >
          <template v-for="(part, k) in titleParts" :key="k"
            ><mark v-if="part.hit" class="rounded-[3px] bg-brand-subtle text-inherit">{{
              part.text
            }}</mark
            ><template v-else>{{ part.text }}</template></template
          ><span v-if="wired && required" aria-hidden="true" class="text-danger-subtle-fg"> *</span>
        </p>
        <p
          v-if="description && !(wired && error)"
          :id="wiring?.ids.description.value"
          :class="[
            'break-words',
            size === 'sm' ? 'text-xs/4.5' : 'text-sm/5.5',
            interactive && disabled && !loading
              ? 'text-disabled-fg'
              : soft
                ? ''
                : notice && !title
                  ? 'text-fg'
                  : 'text-fg-muted',
          ]"
        >
          {{ description }}
        </p>
      </slot>
      <!-- Outside the slot: the control points at the error whether the words are the row's or the caller's. -->
      <p
        v-if="wired && error"
        :id="wiring?.ids.error.value"
        role="alert"
        class="break-words text-danger-subtle-fg"
        :class="size === 'sm' ? 'text-xs/4.5' : 'text-sm/5.5'"
      >
        {{ error }}
      </p>
    </div>
    <UiSpinner v-if="loading" class="shrink-0 text-fg-muted" />
    <!-- A bare icon button last in the row steps out by its own air: the glyph stands on the inset, as the text does. -->
    <!-- The row's own padding is cancelled above and below, so a control up to the row's height sits inside it and does not grow it. -->
    <div
      v-else-if="$slots.actions"
      class="flex shrink-0 items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>[data-bare=md]:last-child]:-me-3 [&>[data-bare=sm]:last-child]:-me-2.5 [&>[data-bare=xs]:last-child]:-me-[0.4375rem]"
      :class="[
        tone ? '' : '[&>svg]:text-fg-subtle',
        row ? (size === 'sm' ? '-my-2' : '-my-4') : '',
      ]"
    >
      <slot name="actions" />
    </div>
    <!-- A row to another site ends in the arrow UiLink draws: it leaves the app, it does not step in. -->
    <ArrowUpRight
      v-if="isLink && resolved.newTab && !loading"
      aria-hidden="true"
      class="h-4 w-4 shrink-0 text-fg-subtle"
    />
    <ChevronRight
      v-else-if="(isLink || (step && as === 'button')) && !loading"
      aria-hidden="true"
      class="h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-fast ease-standard group-[:is(:enabled,a):hover]:translate-x-0.5 rtl:-scale-x-100 rtl:group-[:is(:enabled,a):hover]:-translate-x-0.5"
    />
    <span v-if="isLink && resolved.newTab" class="sr-only">{{
      ' ' + t('grani.link.external')
    }}</span>
  </component>
</template>

<script setup lang="ts">
import { RouteLink } from '../utils/routeLink'
import { ROW_FOCUS, ROW_FOCUS_BAR_INK } from '../utils/panelList'
import { computed, onMounted, provide, ref, useAttrs, useSlots, inject } from 'vue'
import { ArrowUpRight, ChevronRight } from '@lucide/vue'
import { provideInList, useInList, useLooseRows, useRowSize, type RowSize } from '../utils/rowSize'
import { cardShellClass } from '../utils/cardShell'
import { hasAddress, INSIDE_LINK, linkTarget, unsafeHref } from '../utils/link'
import UiSpinner from './UiSpinner.vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { useField, useFieldWiring } from '../utils/field'
import { TONE_EDGE, TONE_GLYPH, TONE_GLYPH_INK, TONE_ROW_EDGE } from '../utils/toneGlyph'
import { toneSubtleClass } from '../utils/tone'
import type { GraniMessageKey } from '../i18n/en'
import { GUTTER_PAD, ROW_INSET } from '../utils/surface'

/** What every row takes, whatever its mode. */
interface RowBase {
  /** The primary line of text. */
  title?: string
  /** Supporting text below the title. */
  description?: string
  /** `plain` for a row among rows, `outline` for a standalone row, `muted` for a filled surface. */
  variant?: 'plain' | 'outline' | 'muted'
  /** `md` for pages, `sm` for drawers and dense lists. Unset: the host's (a sidebar says `sm`), else `md`. Rows keep their own scale, 44 at `sm` and 56 at `md`; the app's size (`createGrani({ size })`) does not move them. */
  size?: RowSize
  /** Letters of the title to mark, in any case: the query of a search over the rows. The first match is marked. */
  highlight?: string
  /** A moment of brand color: the row just came, or a refused repeat points at it. Set it, clear it after a second. */
  lit?: boolean
}
/** A plain row: text and a thing at its end. */
type PlainRow = RowBase & {
  /** The root element: `label` for a field, `button` for a command; a plain row is a `div`. */
  as?: 'div'
  /** A route or URL. Makes the whole row a link; `actions` then hold no controls. A disabled one is a disabled button, not a link; `javascript:` and `data:` are refused, as on UiLink. */
  to?: undefined
  /** With `to`: `_blank` or `_self` decides the tab; unset, a new tab for an absolute address only. */
  target?: undefined
  /** With `to`: replaces the default `noreferrer` (`nofollow`, `sponsored`); `noopener` stays on a new tab. */
  rel?: undefined
  /** With `as="button"`: the row goes one level in, a step of a drawer; a chevron at the end. */
  step?: false
  /** A command or link row that cannot be taken now: no rights, nothing to do. */
  disabled?: false
  /** A command or link row is running: a spinner in place of the glyph, clicks refused, focus kept. */
  loading?: false
  /** With `as="label"`: an error in place of the description, read with the control and marking it invalid. */
  error?: undefined
  /** With `as="label"`: an asterisk after the title and `aria-required` on the control. */
  required?: false
  /** Meaning. On a plain row a notice: alone a white card whose start edge is in the tone, in a UiList a row with the tone's edge, read as a status. On a command or link row the ink alone: `danger` for an irreversible action, `brand` for the one that makes something new (“Add …”). */
  tone?: undefined
}
/** A notice: a plain row in a tone, read as a status. */
type NoticeRow = Omit<PlainRow, 'tone' | 'variant'> & {
  /** On a notice in a UiList, `soft` fills the row with its tone's pale plate as well; `plain` keeps the surface. Alone the notice is its card either way. */
  variant?: 'plain' | 'soft'
  tone: 'info' | 'success' | 'warning' | 'danger'
}
/** A link: the whole row goes to `to`. */
type LinkRow = RowBase & {
  as?: undefined
  to: string
  target?: '_blank' | '_self'
  rel?: string
  step?: false
  disabled?: boolean
  loading?: boolean
  error?: undefined
  required?: false
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}
/** A field: the row is the label of the one control in `#actions`. */
type FieldRow = RowBase & {
  as: 'label'
  to?: undefined
  target?: undefined
  rel?: undefined
  step?: false
  disabled?: false
  loading?: false
  error?: string
  required?: boolean
  tone?: undefined
}
/** A command: the whole row is a button. */
type CommandRow = RowBase & {
  as: 'button'
  to?: undefined
  target?: undefined
  rel?: undefined
  step?: boolean
  disabled?: boolean
  loading?: boolean
  error?: undefined
  required?: false
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}

const props = defineProps<PlainRow | NoticeRow | LinkRow | FieldRow | CommandRow>()

const { t } = useUiT()
const hostSize = useRowSize()
const inset = inject(ROW_INSET, null)
const outerField = useField()
const loose = useLooseRows()
const inList = useInList()
// What the row holds is not an item of the list: a notice in its slot is a card again.
provideInList(false)
const size = computed<RowSize>(() => props.size ?? hostSize?.value ?? 'md')
const variant = computed(() => props.variant ?? 'plain')
const highlight = computed(() => props.highlight ?? '')

const emit = defineEmits<{
  /** The row was clicked; a command row is silent while `loading` or `disabled`. */
  click: [event: MouseEvent]
}>()

const interactive = computed(() => hasAddress(props.to) || props.as === 'button')
const notice = computed(() => Boolean(props.tone) && props.tone !== 'brand' && !interactive.value)
// Among the rows of a UiList a notice is a row too: no card inside the card of rows, its tone an
// edge at the start; alone (over a form, in a toast) it keeps its card.
const noticeRow = computed(() => notice.value && inList && !loose)
const soft = computed(() => noticeRow.value && variant.value === 'soft')
// The word a notice says before its title. Each key is written out: a key built from the tone
// would reach no check that the dictionary has it.
type NoticeTone = NoticeRow['tone']
const NOTICE_WORD = {
  info: 'grani.listItem.tone.info',
  success: 'grani.listItem.tone.success',
  warning: 'grani.listItem.tone.warning',
  danger: 'grani.listItem.tone.danger',
} as const satisfies Record<NoticeTone, GraniMessageKey>
// A link that cannot be taken is not a link: a disabled `to` row is a disabled button, as UiButton's.
// No address at all (`null`, a blank, a number from data) is as no `to`.
const unsafe = computed(() => hasAddress(props.to) && unsafeHref(props.to))
const isLink = computed(() => hasAddress(props.to) && !props.disabled && !unsafe.value)
// A notice without a glyph of the caller's draws the one of its tone: the tone is never color alone.
const toneGlyph = computed(() => (notice.value ? TONE_GLYPH[props.tone!] : undefined))
const tag = computed(() =>
  isLink.value ? RouteLink : hasAddress(props.to) ? 'button' : (props.as ?? 'div'),
)

// A label row is a field: its title names the one control in `#actions`, its description or
// error describes it, as UiField does. Decided once, at setup: a provide cannot come and go.
const attrs = useAttrs()
const slots = useSlots()
const wired = props.as === 'label' && !props.to
// Own text in the slot replaces the title and the description: nothing to point at then.
const ownText = Boolean(slots.default)
const wiring = wired
  ? useFieldWiring(
      {
        get label() {
          return ownText ? undefined : props.title
        },
        get description() {
          return ownText ? undefined : props.description
        },
        get error() {
          return props.error ?? ''
        },
        get required() {
          return props.required ?? false
        },
        get for() {
          return attrs.for as string | undefined
        },
      },
      slots,
    )
  : null
if (isDev() && wired && outerField)
  console.warn(
    '[grani] UiListItem as="label" inside a UiField: the row is the field, drop the UiField.',
  )
const rootRef = ref<{ $el?: Element } | Element | null>(null)
const rootEl = () => (rootRef.value instanceof Element ? rootRef.value : rootRef.value?.$el)
// Looked up inside the row: the control and its name live there, whatever else the page holds.
const inRow = (id: string) =>
  [...(rootEl()?.querySelectorAll<HTMLElement>('[id]') ?? [])].find((n) => n.id === id)
if (isDev()) {
  if (props.to && unsafe.value)
    console.warn('[grani] UiListItem: `to` is refused; the row is a disabled button.')
  onMounted(() => {
    const el = rootEl()
    if (
      interactive.value &&
      el?.querySelector('button, a[href], input, select, textarea, [role=switch]')
    )
      console.warn(
        '[grani] UiListItem: a control in a link or a command row is a control inside a control; give it a row of its own.',
      )
    if (wired) {
      const c = wiring && inRow(wiring.id.value)
      const named = (c?.getAttribute('aria-labelledby') ?? '')
        .split(' ')
        .some((id) => id && inRow(id)?.textContent?.trim())
      if (!c?.getAttribute('aria-label') && !named)
        console.warn(
          '[grani] UiListItem as="label" without a title: name the control in `#actions`.',
        )
      // Controls, not their parts: a clear cross or a stepper inside a field is not a second control.
      const controls = el?.querySelectorAll(
        'input:not([type=hidden]), select, textarea, [role=switch], [role=combobox]',
      )
      if (controls && controls.length > 1)
        console.warn(
          `[grani] UiListItem as="label" holds ${controls.length} controls; a label names one. Put the others in a row of their own.`,
        )
    }
  })
}
// A click on the words of a label row reaches the control as a second click: one is emitted.
function onClick(e: MouseEvent) {
  if (wired && wiring) {
    const c = inRow(wiring.id.value) as HTMLButtonElement | undefined
    if (c && !c.disabled && !c.contains(e.target as Node)) return
  }
  emit('click', e)
}
// A row of the anatomy: a plain row, a link, a field or a command, a command in a tone too (the
// tone is its ink). A notice or a framed row stands alone, and so does a row of a host that is no
// list (a sidebar's footer). A UiList draws its lines between such rows.
const row = computed(
  () =>
    noticeRow.value || (!loose && variant.value === 'plain' && (!props.tone || interactive.value)),
)
// A held Enter repeats, and each repeat clicks: a Delete row that hands the focus to the next
// row's Delete would empty the list at key-repeat speed. The repeats are the same press, as on UiButton.
function onHeld(e: KeyboardEvent) {
  if (tag.value === 'button' && e.key === 'Enter' && e.repeat) e.preventDefault()
}
// Refused in the capture phase, ahead of a router link's navigation and the caller: Enter on
// a loading row does nothing. A declared emit swallows the native listener, so the bubble one emits.
function refuse(e: MouseEvent) {
  if (!interactive.value || !(props.loading || props.disabled)) return
  e.preventDefault()
  e.stopImmediatePropagation()
}
// Target, rel and the new tab, resolved as UiLink and UiButton do (utils/link).
const resolved = computed(() => linkTarget(props.to, props.target, props.rel))
// A link inside a link row would be two links in one: UiLink warns.
provide(INSIDE_LINK, isLink)
// The title in pieces, the first match of `highlight` marked: why the row was found.
const titleParts = computed(() => {
  const title = props.title ?? ''
  const q = highlight.value.trim()
  // Found in the title itself, not in a lowered copy: lowering can change the length (İ is two).
  const hit = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(title) : null
  if (!hit) return [{ text: title, hit: false }]
  const at = hit.index
  const end = at + hit[0].length
  return [
    { text: title.slice(0, at), hit: false },
    { text: title.slice(at, end), hit: true },
    { text: title.slice(end), hit: false },
  ].filter((p) => p.text)
})

defineSlots<{
  /** Own text in place of `title` and `description`, when two lines are not enough. On a label row it names nothing: give the control its own name. */
  default(props: Record<string, never>): any
  /** Content on the left: a glyph, an avatar or an image. The caller sizes avatars and images; glyphs are 20px. */
  media(props: Record<string, never>): any
  /** Controls on the right: a button, a badge, a switch. Passive content only on a link or a command row (`to`, `as="button"`): a control there is a control inside a control, and warns. */
  actions(props: Record<string, never>): any
}>()

const shells = {
  plain: '',
  outline: cardShellClass,
  muted: 'rounded-card bg-surface-muted',
  // A notice's fill, drawn with the notice.
  soft: '',
}

type Ink = NonNullable<CommandRow['tone']>
// The ink of a command in a tone: the text pair of the tone, as a ghost UiButton's; the base
// tone is graded for fills and misses 4.5:1 on the surface in dark.
const INK: Record<Ink, string> = {
  brand: 'text-brand-subtle-fg [&:is(:enabled,a)]:hover:bg-brand-subtle',
  success: 'text-success-subtle-fg [&:is(:enabled,a)]:hover:bg-success-subtle',
  warning: 'text-warning-subtle-fg [&:is(:enabled,a)]:hover:bg-warning-subtle',
  danger: 'text-danger-subtle-fg [&:is(:enabled,a)]:hover:bg-danger-subtle',
}

const INK_FOCUS: Record<Ink, string> = {
  brand: 'focus-visible:bg-brand-subtle',
  success: 'focus-visible:bg-success-subtle',
  warning: 'focus-visible:bg-warning-subtle',
  danger: 'focus-visible:bg-danger-subtle',
}

const classes = computed(() => [
  'flex items-center',
  props.lit ? 'ui-row-lit' : '',
  // A row is one height per step, its line inside it: 44 at `sm` as a control at `md`, 56 at
  // `md`. A second line of text grows it; a control in `#actions` does not (its wrapper takes the padding back).
  row.value ? (size.value === 'sm' ? 'min-h-11' : 'min-h-14') : '',
  // The whole label row toggles its control; a disabled control mutes the title and the cursor.
  wired ? 'group/row cursor-pointer has-[:disabled]:cursor-not-allowed' : '',
  // Vertical space on the library's scale: 16 inside a page row, 8 inside a dense one. A notice
  // is a message, not a page row: 12 around the words at `md`.
  size.value === 'sm'
    ? 'gap-3 py-2'
    : notice.value && !noticeRow.value
      ? 'gap-3 py-3'
      : 'gap-4 py-4',
  // A row of a list runs edge to edge and keeps its text on the inset its list gives it.
  row.value && inset ? GUTTER_PAD[inset] : size.value === 'sm' ? 'px-3' : 'px-4',
  noticeRow.value
    ? [TONE_ROW_EDGE[props.tone as NoticeTone], soft.value ? toneSubtleClass(props.tone) : '']
    : notice.value
      ? ['rounded-card border border-border bg-surface', TONE_EDGE[props.tone as NoticeTone]]
      : shells[variant.value],
  interactive.value
    ? [
        'relative w-full group text-start transition-colors duration-fast ease-standard focus:outline-hidden',
        props.tone ? INK[props.tone as Ink] : '[&:is(:enabled,a)]:hover:bg-surface-muted',
        // The focus is a band and a bar at the start edge: a card of rows runs edge to edge and
        // clips a ring, and the band alone is under 3:1.
        props.tone ? [INK_FOCUS[props.tone as Ink], ROW_FOCUS_BAR_INK] : ROW_FOCUS,
        // Disabled is a state: the disabled ink and cursor, not a fade. Loading keeps its ink.
        'disabled:cursor-not-allowed disabled:text-disabled-fg',
        props.loading ? 'pointer-events-none' : '',
      ]
    : '',
])
</script>
