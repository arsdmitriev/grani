<!--
  UiModal: a window over the page for one task: a short form, a question, a detail. Take it when the
  task needs the person's whole attention.

  Closing. `title` names the window and `description` describes it. The backdrop, Escape and the
  cross close it. Escape works only while the window is the top layer, so a confirm over a drawer
  closes first. `persistent` guards unsaved input: the backdrop and Escape are refused with a shake,
  but the cross still closes, since pressing it is an explicit intent. `submitting` refuses every
  close while a request is out. These guard only the window's own exits; `open` set to false from
  outside is for the host to guard.

  Over a window. One window is seen at a time. A window opened from a window takes its place: the
  first closes, and when the new one closes the focus returns to what opened the first. A question
  (`role="alertdialog"`, UiConfirm) is about the window under it: it hides that window, out of sight
  and out of reach, and when it is answered the window comes back as it was, the focus on what
  asked. A window holding unsaved input (`persistent`) or a request (`submitting`) is not replaced:
  it waits hidden in the same way. The tint on the page stays as it was. A drawer is not hidden: a
  window over it leaves it in view.

  Layout. Attributes land on the dialog. The page under it does not scroll; a long body scrolls
  between the header and the footer. The footer's buttons share its width, so two buttons take half
  each.

  Kept pages. In a page that a `KeepAlive` keeps, a window left open stays open when the page is
  deactivated: its layer, its Escape and its scroll lock go on over the next page. Close it (`open`
  false) when the route changes.

  Question. `role="alertdialog"` is a question that needs an answer (UiConfirm): the backdrop does
  not close it, and the focus starts on the first button of the footer, the safe one.

  Result. `align="center"` shows a result after an action: `#media` (a glyph) over a centered title,
  with no lines between the parts.

  Header. `#header` puts a header of the window's own in place of the title and the cross (a search
  field over its results); the title stays for a screen reader.

  Form. With `form` the body and the footer become a form that sends `submit`. The main action is
  `type="submit"`; Enter in a field, and Cmd+Enter or Ctrl+Enter from a text box, send it. The
  shortcut presses that button, so while the button is held or spinning, the shortcut does nothing
  either. One request gets one submit. A submit that leaves a field `aria-invalid` puts the focus on
  the first such field and scrolls it into view; the form is ready again as soon as the person moves
  to fix it. An answer that comes later and marks a field does the same when `submitting` falls,
  unless the person went on typing in another field meanwhile. Do not put a form of your own in the
  slot. `submit` carries nothing: a window has one way to send, its main action. UiCrudDrawer's
  `submit` carries `{ another }`, since its Save can also mean "save and start the next record".

  Keyboard.
  The focus starts on the first field (a drawn select, date, switch, scale, drop zone or date
  range too), not on the cross. With no field it starts on a body longer than the window, so the
  arrows scroll it at once, else on the window itself; `role="alertdialog"` starts it on the first
  button of the footer. On close the focus returns to where it was.
  - `Tab`: goes round inside the window; a body longer than the window is one of its stops.
  - `ArrowUp` `ArrowDown` `PageUp` `PageDown` `Home` `End`: scroll that body once it holds the focus.
  - `Escape`: closes the window, only while it is the top layer; `persistent` answers it with a
    shake, and `submitting` refuses it.
  With `form`:
  - `Enter`: in a field, sends the form.
  - `Meta+Enter` `Ctrl+Enter`: send it from a text box too (`Meta` is Cmd).
  A submit that leaves a field `aria-invalid` puts the focus on the first one.

  Reader.
  - Window: a modal dialog (`aria-modal`) named by `title` (`aria-labelledby`) and described by
    `description`. With `#header` the title is still read, and a question (`alertdialog`) with no
    description is described by its body.
  - Cross: named "Close".
  - Long body: a region named by the title, so the reader says what the keys scroll through.
  - Errors: a refused submit marks the field in error `aria-invalid`.
  - Refused close: a shake for the eye; the reader keeps the focus where it was and hears why, from
    a status region inside the window: input not saved, or a request still on its way. A question
    refuses a press beside it with the shake alone: its answers are in reach.
  - Refused submit: the reader hears the field in error the focus moved to.
  - A window under another: out of the reader's reach until it comes back; then the reader hears
    it and the control the focus returned to.

  States. A form; a long body that scrolls between the header and the footer; a detail of rows
  running edge to edge (`padded` off); a question (`role="alertdialog"`); a result
  (`align="center"`); a search (`#header`); a window opened from a window, in its place; a question over a window, the one under hidden.
  `persistent` shakes at the backdrop and Escape; a submit the host refuses by marking a field as
  it gets it shakes too; `submitting` refuses every close and a second submit. Sizes `sm` and
  `md`, in both themes.

  Not for.
  - A record to edit: UiCrudDrawer.
  - A side panel beside a list: UiDrawer, to read or set at the side of the screen.
  - A small panel of controls under a button: UiPopover, with the page live.
  - A yes-or-no question: UiConfirm, built on this window.
  - The outcome of an action: a toast from `useToast` in UiToaster.
-->
<template>
  <Teleport :to="teleport">
    <Transition
      enter-from-class="ui-modal-enter-from"
      enter-active-class="ui-modal-enter-active"
      leave-to-class="ui-modal-leave-to"
      leave-active-class="ui-modal-leave-active"
      @after-enter="arrived"
    >
      <div
        v-if="open"
        ref="backdropRef"
        class="fixed inset-0 z-modal flex items-center justify-center bg-backdrop/50 p-4"
        :class="covered ? 'invisible' : ''"
        :style="{ zIndex: zIndex() }"
        :inert="covered || undefined"
        :data-swap="swap ? '' : undefined"
      >
        <div
          ref="panelRef"
          :role="role"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="describedBy"
          v-bind="$attrs"
          tabindex="-1"
          class="ui-modal-panel flex max-h-full w-full flex-col overflow-hidden rounded-overlay bg-surface shadow-xl focus:outline-hidden"
          :class="[SIZE[size], shaking ? 'ui-shake' : '', returning ? 'ui-modal-return' : '']"
          @animationend.self="returned"
        >
          <template v-if="$slots.header">
            <h2 :id="titleId" class="sr-only">{{ title }}</h2>
            <div class="shrink-0 border-b border-border">
              <slot name="header" />
            </div>
          </template>
          <!-- The cross steps out by its own air, set by the ladder (data-bare): its glyph stands
               on the gutter, where the title starts. -->
          <div
            v-else
            class="flex gap-4"
            :class="[
              'px-overlay',
              centered
                ? 'relative flex-col items-center pb-0 pt-8 text-center'
                : [
                    'items-center pt-overlay [&>[data-bare=md]:last-child]:-me-3 [&>[data-bare=sm]:last-child]:-me-2.5 [&>[data-bare=xs]:last-child]:-me-[0.4375rem]',
                    opensWithLegend() ? '' : 'border-b border-border pb-overlay',
                  ],
            ]"
          >
            <div
              v-if="$slots.media"
              aria-hidden="true"
              class="flex shrink-0 items-center justify-center [&_svg]:h-6 [&_svg]:w-6"
            >
              <slot name="media" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 :id="titleId" class="text-lg font-semibold text-fg [overflow-wrap:anywhere]">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="descriptionId"
                class="text-sm/5.5 text-fg-muted [overflow-wrap:anywhere]"
              >
                {{ description }}
              </p>
            </div>
            <UiIconButton
              :icon="X"
              :ariaLabel="t('grani.modal.close')"
              variant="ghost"
              :class="centered ? 'absolute end-3 top-3' : ''"
              @click="requestClose(true)"
            />
          </div>
          <component
            :is="asForm ? 'form' : 'div'"
            ref="formRef"
            data-grani
            :novalidate="asForm || undefined"
            :class="asForm ? 'flex min-h-0 flex-1 flex-col' : 'contents'"
            @submit.prevent="onSubmit"
            @keydown.enter="onMetaEnter"
            @input="lock.unlock"
            @change="lock.unlock"
          >
            <div
              v-if="$slots.default"
              :id="bodyId"
              ref="bodyRef"
              class="min-h-0 flex-1 overflow-y-auto"
              :class="[padded ? 'p-overlay' : '', SCROLL_RING]"
              :tabindex="scrolls ? 0 : undefined"
              :role="scrolls ? 'region' : undefined"
              :aria-labelledby="scrolls ? titleId : undefined"
              @focusin="lock.unlock"
            >
              <slot />
            </div>
            <div
              v-if="$slots.footer"
              ref="footerRef"
              class="flex gap-overlay p-overlay [&>*]:min-w-0 [&>*]:flex-1"
              :class="centered ? 'pt-6' : 'border-t border-border'"
            >
              <slot name="footer" />
            </div>
          </component>
          <!-- Always there, filled when a close is refused: a reader keeps to an aria-modal window. -->
          <span role="status" data-refusal class="sr-only">{{ said }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useSlotsSeen } from '../utils/slotsSeen'
import { useTeleport } from '../composables/useShared'
import { computed, ref, useId, useSlots, watch } from 'vue'
import { X } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { provideSurface, useExits } from '../composables/overlaySurface'
import { isLegend } from './overlaySections'
import { useOverlayShell } from '../composables/useOverlayShell'
import { useSubmitLock } from '../composables/useSubmitLock'
import { SCROLL_RING, useScrollRegion } from '../composables/useScrollRegion'
import { leadsWith } from '../utils/sections'
import UiIconButton from './UiIconButton.vue'

// Attributes (`data-testid`, `aria-*`) land on the dialog, not on the teleport.
defineOptions({ inheritAttrs: false })

const teleport = useTeleport()
const props = withDefaults(
  defineProps<{
    /** The window's name, read first by a screen reader; required, a dialog without one is mute. */
    title: string
    /** One line under the title, read right after it. */
    description?: string
    /** Width: `sm` for a question or a short form, `md` for a form with a few rows. */
    size?: 'sm' | 'md'
    /** Unsaved input: the backdrop and Escape are refused with a shake; the cross still closes. */
    persistent?: boolean
    /** A request is out (a save, a delete): every close is refused with a shake, and no second submit goes. */
    submitting?: boolean
    /** `alertdialog` for a question that needs an answer: the backdrop does not close it, focus starts on the footer's first button. */
    role?: 'dialog' | 'alertdialog'
    /** `false` for rows edge to edge (a detail of key and value): the body keeps no padding of its own. */
    padded?: boolean
    /** `center` for a result after an action: a glyph over a centered title, no lines between the parts. */
    align?: 'start' | 'center'
    /** The body and the footer are a form: its `type="submit"` button, Enter in a field and Cmd+Enter from a text box send `submit`. Off, a question or a detail keeps its buttons plain. */
    form?: boolean
  }>(),
  {
    description: '',
    size: 'md',
    persistent: false,
    submitting: false,
    role: 'dialog',
    align: 'start',
    padded: true,
    form: false,
  },
)

/** Whether the window is open (`v-model:open`); every way out sets it false and emits `close`. */
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  /** The window closed: the cross, the backdrop, Escape, or another window that took its place. A window whose input must not go that way is `persistent`. */
  close: []
  /** The form was sent, with `form`: its `type="submit"` button, Enter in a field, Cmd+Enter from a text box. */
  submit: []
}>()

defineSlots<{
  /** The body. It scrolls when long; the header and the footer stay. */
  default(props: Record<string, never>): unknown
  /** A glyph over the title with `align="center"`: a check in a halo after a sent invoice. The window sizes it. */
  media(props: Record<string, never>): unknown
  /** The window's own header in place of the title, the description and the cross: a search field, as a palette's. The title is still read by a screen reader; Escape and the backdrop close. It stands alone: no `#media`, no `align="center"`. */
  header(props: Record<string, never>): unknown
  /** Actions, sharing the footer's width in equal parts: the cancel is `secondary` and first, the main action last. */
  footer(props: Record<string, never>): unknown
}>()

const { t } = useUiT()
const uid = useId()
const titleId = `ui-modal-title-${uid}`
const centered = computed(() => props.align === 'center')
const descriptionId = `ui-modal-desc-${uid}`
const panelRef = ref<HTMLElement | null>(null)
const backdropRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
// A long body with nothing to focus still reads from the keyboard: it is a scroll region once it overflows.
const { overflows: scrolls, firstFocus } = useScrollRegion(bodyRef)

// A window is a form only when it says so: a question or a detail keeps its buttons plain.
const asForm = computed(() => props.form)
const formRef = ref<HTMLFormElement | null>(null)
// One submit per request, Cmd+Enter through the submit button (useSubmitLock, as the drawer's).
const lock = useSubmitLock({
  body: bodyRef,
  form: formRef,
  submitting: () => props.submitting,
  canSubmit: () => asForm.value,
  send: () => emit('submit'),
  refused: () => refuse(),
})
const onSubmit = () => lock.submit()
const onMetaEnter = (e: KeyboardEvent) => {
  if (asForm.value) lock.onMetaEnter(e)
}

// A card in the window is framed and `h3` under the window's `h2`; its title names what is inside.
// Its gutter, not the one of a drawer it was declared in: a separator in its body bleeds to its own
// edges. An unpadded body is a column of rows edge to edge: they pad their text to the gutter,
// nothing bleeds. One number for every window, `--space-overlay`: the header, the body and the
// footer stand on one line, the footer's inset and the gap between its buttons are the same.
// `size` is the width.
provideSurface({
  flat: false,
  titleId,
  gutter: props.padded ? 'overlay' : null,
  inset: props.padded ? null : 'overlay',
})

const SIZE = { sm: 'max-w-sm', md: 'max-w-lg' } as const

// The shell, shared with the drawer: the stack, the page held still, the focus kept in and given
// back, the shake.
const { zIndex, shaking, said, refuse, covered, returning, swap, returned, arrived } =
  useOverlayShell({
    open,
    panel: panelRef,
    backdrop: backdropRef,
    window: true,
    // A question opens on its answer; a long text with nothing to fill in opens on its body.
    initial: () =>
      props.role === 'alertdialog'
        ? footerRef.value?.querySelector<HTMLElement>('button')
        : firstFocus(panelRef.value),
    onOpen: () => lock.unlock(),
    onEscape: () => requestClose(false),
    // A question needs an answer: a press beside it shakes, it does not close.
    onOutside: () => (props.role === 'alertdialog' ? refuse() : requestClose(false)),
    // A question is about this window; any other window opened from it takes its place.
    question: () => props.role === 'alertdialog',
    // Unsaved input or a request out keeps it, hidden under the new window, to come back.
    onReplace: () => {
      if (props.persistent || props.submitting) return false
      close()
      return true
    },
  })

// `explicit` is the cross: it passes `persistent`, never `submitting`.
const { requestClose, close } = useExits({
  open,
  closed: () => emit('close'),
  submitting: () => props.submitting,
  guarded: () => props.persistent,
  refuse,
})
// Drawn with no entrance to wait for (open at the first render), it is in at once.
watch(
  open,
  (on) => {
    if (on && !backdropRef.value?.classList.contains('ui-modal-enter-active')) arrived()
  },
  { flush: 'post', immediate: true },
)

// The description, or for a question with none its body, the sentence that says what happens.
const slots = useSlots()
// Read again before every render: a slot that comes later is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots)
// A body that opens with a UiHeader legend has its line already: the header draws none.
const opensWithLegend = () => leadsWith(slots.default?.(), isLegend)
const bodyId = `ui-modal-body-${uid}`
const describedBy = computed(() =>
  props.description && !seen.header
    ? descriptionId
    : props.role === 'alertdialog' && seen.default
      ? bodyId
      : undefined,
)
</script>
