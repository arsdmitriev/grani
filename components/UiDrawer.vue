<!--
  UiDrawer: a panel at the inline end of the screen, full height, over the page it came from. Take
  it for what is read or set beside a list without leaving it: the settings of a view, the details
  of a row.

  Closing. `title` names the panel and `description` describes it. The backdrop, Escape and the
  cross close it. Escape works only while the panel is the top layer, so a confirm over it closes
  first. `persistent` guards unsaved input: the backdrop and Escape are refused with a shake, but
  the cross still closes, since pressing it is an explicit intent. `submitting` refuses every close
  while a request is out. These guard only the panel's own exits; `open` set to false from outside
  is for the host to guard.

  Layout. Attributes land on the dialog. The panel takes the full height at the inline end (the
  left in a right-to-left page), `md` 512px wide or `lg` 768px for what reads wide, and the whole
  width on a narrow screen. The page under it does not scroll; a long body scrolls between the
  header and the footer. The body is padded by `--space-drawer`; the header and the footer stand on
  it at the sides, so the title, the content and the footer's buttons share one edge. The footer's
  buttons share its width, as in a window. Cards in the body are its sections, flat, with a line
  between neighbors drawn by UiSeparator.

  Kept pages. In a page that a `KeepAlive` keeps, a panel left open stays open when the page is
  deactivated: its layer, its Escape and its scroll lock go on over the next page. Close it (`open`
  false) when the route changes.

  Header. The title is one line, cut when long and shown whole on hover. The line under it is
  `description`, or `#description` in your own markup: a status mark, an id to copy. `#actions`
  takes an icon button or two before the cross.

  Changes at once. A panel whose controls apply as they change (a setting, a filter) has no
  footer: there is nothing to confirm, and the cross closes it. A footer is for a panel that sends
  something. A filter that covers the list it narrows is that case: its ticks wait
  in a draft, the footer's button says what applying will show ("Show 12 invoices"), and closing
  any other way drops the draft.

  Keyboard.
  The focus starts on the first field (a drawn select, date, switch, scale, drop zone or date
  range too), not on the cross. With no field it starts on a body longer than the panel, so the
  arrows scroll it at once, else on the panel itself.
  - `Tab`: goes round inside the panel; a body longer than the panel is one of its stops.
  - `ArrowUp` `ArrowDown` `PageUp` `PageDown` `Home` `End`: scroll that body once it holds the focus.
  - `Escape`: closes the panel, only while it is the top layer; `persistent` answers it with a
    shake, and `submitting` refuses it.
  On close the focus returns to where it was.

  Reader.
  - Window: a modal dialog (`aria-modal`) named by `title` (`aria-labelledby`) and described by the
    line under it.
  - Cross: named "Close".
  - Long body: a region named by the title, so the reader says what the keys scroll through.
  - Refused close: a shake for the eye; the reader keeps the focus where it was and hears why, from
    a status region inside the drawer: input not saved, or a request still on its way.

  States. A settings panel that applies at once, with no footer; a read-only detail of rows; a
  panel with a footer; `persistent` shaking at the backdrop and Escape; a long body that scrolls
  between the header and the footer; a narrow screen, where the panel takes the whole width.

  Not for.
  - A record to edit or create: UiCrudDrawer, with Save, loading and steps, built on this panel.
  - A short task for the person's whole attention: UiModal.
  - A small panel of controls under a button: UiPopover, with the page live.
  - A second panel over this one: never; what opens from it is a UiModal for a short task, or a
    step of the same panel. Development warns when a drawer opens over another; a window or a
    question over it is fine.
-->
<template>
  <Teleport :to="teleport">
    <Transition
      enter-from-class="ui-drawer-enter-from"
      enter-active-class="ui-drawer-enter-active"
      leave-to-class="ui-drawer-leave-to"
      leave-active-class="ui-drawer-leave-active"
    >
      <div
        v-if="open"
        ref="backdropRef"
        class="fixed inset-0 z-modal"
        :style="{ zIndex: zIndex() }"
      >
        <div class="ui-drawer-backdrop absolute inset-0 bg-backdrop/50" aria-hidden="true" />
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description || $slots.description ? descriptionId : undefined"
          v-bind="$attrs"
          tabindex="-1"
          class="ui-drawer-panel absolute inset-y-0 end-0 flex w-full flex-col bg-surface shadow-xl focus:outline-hidden"
          :class="[
            size === 'lg' ? 'max-w-3xl' : 'max-w-lg',
            surface.shaking.value ? 'ui-shake' : '',
          ]"
        >
          <!-- The gutter at the sides, 16 up and down. A ghost square first or last (‹, ×) steps
               out by its own air, which the ladder sets (data-bare): its glyph stands on the
               gutter too. -->
          <div
            class="flex items-center gap-2 px-drawer pt-4 [&>[data-bare=md]:first-child]:-ms-3 [&>[data-bare=sm]:first-child]:-ms-2.5 [&>[data-bare=xs]:first-child]:-ms-[0.4375rem] [&>[data-bare=md]:last-child]:-me-3 [&>[data-bare=sm]:last-child]:-me-2.5 [&>[data-bare=xs]:last-child]:-me-[0.4375rem]"
            :class="surface.opensWithLegend() ? '' : 'border-b border-border pb-4'"
          >
            <component :is="surface.lead" />
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-2">
                <h2 :id="titleId" class="min-w-0 text-base font-semibold text-fg">
                  <UiTruncate :text="title" />
                </h2>
                <component :is="surface.status" />
              </div>
              <div
                v-if="description || $slots.description"
                :id="descriptionId"
                class="flex min-w-0 items-center gap-2 text-xs/4.5 text-fg-muted"
              >
                <slot name="description">
                  <UiTruncate :text="description" class="min-w-0" />
                </slot>
              </div>
            </div>
            <slot name="actions" />
            <UiIconButton
              :icon="X"
              :ariaLabel="t('grani.drawer.close')"
              variant="ghost"
              @click="surface.cross()"
            />
          </div>
          <component :is="surface.form" class="flex min-h-0 flex-1 flex-col">
            <div
              ref="bodyRef"
              v-bind="surface.body()"
              class="min-h-0 flex-1 overflow-y-auto p-drawer"
              :class="SCROLL_RING"
              :tabindex="scrolls ? 0 : undefined"
              :role="scrolls ? 'region' : undefined"
              :aria-labelledby="scrolls ? titleId : undefined"
            >
              <Content />
            </div>
            <!-- The gutter at the sides; 16 up and down and between the buttons. Columns of one
                 width, whatever a button holds: a split Save is as wide as Cancel. -->
            <div
              v-if="$slots.footer"
              class="grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-4 border-t border-border px-drawer py-4"
            >
              <slot name="footer" />
            </div>
          </component>
          <!-- Always there, filled when a close is refused: a reader keeps to an aria-modal window. -->
          <span role="status" data-refusal class="sr-only">{{ surface.said.value }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useShared, useTeleport } from '../composables/useShared'
import {
  h,
  inject,
  markRaw,
  onBeforeUnmount,
  provide,
  ref,
  useId,
  useSlots,
  watch,
  type FunctionalComponent,
} from 'vue'
import { X } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import { provideSurface, useExits, useShake } from '../composables/overlaySurface'
import { opensWithLegend, withLines } from './overlaySections'
import { useOverlayShell } from '../composables/useOverlayShell'
import { SCROLL_RING, useScrollRegion } from '../composables/useScrollRegion'
import { DRAWER_PARTS, DRAWER_PATTERN, type DrawerPattern } from '../utils/surface'
import UiIconButton from './UiIconButton.vue'
import UiTruncate from './UiTruncate.vue'

// Attributes (`data-testid`, `aria-*`) land on the dialog, not on the teleport.
defineOptions({ inheritAttrs: false })

const teleport = useTeleport()
const props = withDefaults(
  defineProps<{
    /** The panel's name, read first by a screen reader; required, a dialog without one is mute. */
    title: string
    /** One line under the title, read right after it. */
    description?: string
    /** The panel's width: `md` 512px, the default; `lg` 768px for what reads wide, a text or a code. */
    size?: 'md' | 'lg'
    /** Unsaved input: the backdrop and Escape are refused with a shake; the cross still closes. */
    persistent?: boolean
    /** A request is out: every close is refused with a shake. */
    submitting?: boolean
  }>(),
  {
    description: '',
    size: 'md',
    persistent: false,
    submitting: false,
  },
)

/** Whether the panel is open (`v-model:open`); every way out sets it false and emits `close`. */
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** The panel closed: the cross, the backdrop or Escape. */
  close: []
}>()

defineSlots<{
  /** The body. It scrolls when long; the header and the footer stay. UiCard sections are parted by a line. */
  default(props: Record<string, never>): unknown
  /** The line under the title in your own markup, in place of `description`: a status mark, an id to copy. One line. */
  description(props: Record<string, never>): unknown
  /** Icon buttons before the cross: open as a page, copy a link. Ghost UiIconButton. */
  actions(props: Record<string, never>): unknown
  /** Actions, sharing the footer's width in equal parts: the cancel is `secondary` and first, the main action last. Leave it out for a panel that applies at once. */
  footer(props: Record<string, never>): unknown
}>()

// A pattern over the panel (a record) leads its exits and adds to its header; what it holds
// does not see it, so a panel opened inside stays a plain one.
const pattern = inject(DRAWER_PATTERN, null)
provide(DRAWER_PATTERN, null)

const { t } = useUiT()
const uid = useId()
const titleId = `ui-drawer-title-${uid}`
const descriptionId = `ui-drawer-desc-${uid}`
const panelRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
// A long body with nothing to focus still reads from the keyboard: it is a scroll region once it overflows.
const { overflows: scrolls, firstFocus } = useScrollRegion(bodyRef)
const backdropRef = ref<HTMLElement | null>(null)
// What it renders inside finds the panel and the body here: a pattern's form moves the focus in them.
provide(DRAWER_PARTS, { panel: panelRef, body: bodyRef })

// Cards in the body are its sections: flat, `h3` under the drawer's `h2`, which names what is inside.
provideSurface({ flat: true, titleId, gutter: 'drawer' })

// `explicit` is the cross: it passes `persistent`, never `submitting`.
const { shaking, refuse, said, hush } = useShake()
const { requestClose } = useExits({
  open,
  closed: () => emit('close'),
  submitting: () => props.submitting,
  guarded: () => props.persistent,
  refuse,
})

const slots = useSlots()
// A plain panel is a pattern of its own, so the panel has one way through: it closes, its cards
// are parted by lines, and nothing stands beside its title.
const None: FunctionalComponent = () => null
const Plain: FunctionalComponent = (_, { slots: inner }) =>
  h('div', { 'data-grani': '' }, inner.default?.())
const plain: DrawerPattern = {
  onOpen: hush,
  exit: () => requestClose(false),
  cross: () => requestClose(true),
  shaking,
  said,
  opensWithLegend: () => opensWithLegend(slots.default?.()),
  lead: None,
  status: None,
  form: Plain,
  body: () => ({ key: 0, class: '', onFocusin: () => {} }),
}
const surface = pattern ?? plain
// A record lays out its own body (a skeleton, a failure, its sections); a plain panel's is its
// sections with a line between neighbors, none before one a legend opens.
const Content = () =>
  pattern
    ? slots.default?.()
    : h(
        'div',
        { 'data-grani': '', class: 'ui-sections flex flex-col gap-drawer' },
        withLines(slots.default?.() ?? []),
      )

// The shell, shared with the window: the stack, the page held still, the focus kept in and given
// back. Escape and a press on the backdrop are the surface's: a level up in a record.
const { zIndex } = useOverlayShell({
  open,
  panel: panelRef,
  backdrop: backdropRef,
  // A long text with nothing to fill in opens on its body, so the arrows read it at once.
  initial: () => firstFocus(panelRef.value),
  onOpen: () => surface.onOpen(),
  onEscape: () => surface.exit(),
  onOutside: () => surface.exit(),
})

// A drawer over a drawer loses the page twice: development says so, once per app. Drawers count
// themselves here (a record is a drawer too); a window or a question over one is not counted.
const drawers = useShared('grani:drawers', () => markRaw({ open: 0, warned: false })).value
let counted = false
function count(on: boolean) {
  if (on === counted || typeof window === 'undefined') return
  counted = on
  if (on && drawers.open > 0 && !drawers.warned && isDev()) {
    drawers.warned = true
    console.warn(
      '[grani] UiDrawer: a drawer opened over another drawer. Make it a step of the same panel, or a UiModal for a short task.',
    )
  }
  drawers.open += on ? 1 : -1
}
watch(open, count, { immediate: true })
onBeforeUnmount(() => count(false))
</script>
