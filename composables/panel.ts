import {
  h,
  mergeProps,
  provide,
  ref,
  Teleport,
  Transition,
  useId,
  watch,
  type FunctionalComponent,
  type Ref,
  type VNode,
} from 'vue'
import { useAnchoredPanel } from './useAnchoredPanel'
import { FIELD, tabbables, useFocusTrap } from './useFocusTrap'
import { useTeleport } from './useShared'
import { useTrigger } from './useTrigger'
import { graniKey } from '../utils/key'

/** Where the keyboard asked a panel to start: the first or the last item (the arrows), or the panel (a pointer). */
export type PanelStart = 'first' | 'last' | 'panel'

/** What the panel hands to what it holds: a menu's items walk the panel and close it after a command. */
export interface PanelContext {
  panel: Readonly<Ref<HTMLElement | null>>
  close: () => void
}
/** @internal */
export const PANEL = graniKey<PanelContext | null>('panel')

export interface PanelOptions {
  /** Whether the panel is open; the host's model. */
  open: Ref<boolean>
  /** A menu's panel: its items in it, no Tab round, the arrows on the button open it. Else a dialog of controls. */
  menu: boolean
  /** The caller's `#trigger` slot. */
  trigger: () => VNode[] | undefined
  /** The element the panel lines up with, when the button sits inside a wider one. */
  anchor?: () => HTMLElement | null | undefined
  align: () => 'start' | 'center' | 'end'
  /** The id of what names the panel, when the button's text is not its name. */
  labelledby?: () => string
  /** The panel is placed and shown after a press of its button: the focus can go where the keyboard asked. */
  onShown?: (at: PanelStart) => void
}

/**
 * The panel under a button that UiPopover and UiMenu stand on; not exported. It holds
 * the button wired to the panel, the panel's place beside it, its layer on the overlay stack
 * (Escape and a press outside close it; the focus goes back to the button unless the press went
 * elsewhere) and, for a dialog, the focus held inside. The host fills `Panel`; what it holds is
 * handed the panel and its close (`PANEL`), so a menu's items need nothing from the host.
 */
export function usePanel(o: PanelOptions) {
  const uid = useId()
  const panelId = `ui-popover-${uid}`
  const teleport = useTeleport()
  const panelRef = ref<HTMLElement | null>(null)
  const role = o.menu ? 'menu' : 'dialog'
  let asked: PanelStart | null = null

  const {
    Trigger,
    el: triggerEl,
    labelledBy,
    find: findTrigger,
    idOf,
  } = useTrigger({
    slot: o.trigger,
    open: o.open,
    popupId: panelId,
    haspopup: role,
    id: `ui-popover-trigger-${uid}`,
    // A click from Enter or Space has no pointer (detail 0): a menu lands on its first item.
    onClick: (e: MouseEvent) => {
      if (refused(e)) return
      if (o.open.value) close()
      else show(e.detail === 0 ? 'first' : 'panel')
    },
    // A menu button opens on its first item with ArrowDown, on its last with ArrowUp.
    onKeydown: (e: KeyboardEvent) => {
      // A button held on Enter opens the panel once: a button of the caller's own (a picker's field)
      // repeats its click, and the repeats of the Enter that picked in the panel would open it again.
      if (e.key === 'Enter' && e.repeat) return e.preventDefault()
      // Alt with an arrow opens it too, as a select; Ctrl or ⌘ with one is the browser's.
      if (!o.menu || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || e.ctrlKey || e.metaKey)
        return
      if (refused(e)) return
      e.preventDefault()
      show(e.key === 'ArrowDown' ? 'first' : 'last')
    },
  })

  // A button that refuses its press (loading, or off with a reason, focusable either way) opens
  // nothing: not by a click, nor by an arrow, which no press refusal sees.
  function refused(e: Event) {
    return (e.currentTarget as Element | null)?.getAttribute?.('aria-disabled') === 'true'
  }

  function show(at: PanelStart) {
    findTrigger()
    asked = at
    o.open.value = true
  }
  // A close that keeps the focus where it is, asked by the host (`close(false)`); read by the layer.
  let keep = false
  /** Closes the panel; with `back` (the default) the focus goes back to the button when it was in the panel. */
  const close = (back = true) => {
    keep = !back
    o.open.value = false
  }
  // Opened from outside, the panel still needs its button: it names the panel and takes the focus back.
  watch(o.open, (v) => {
    if (v) {
      keep = false
      findTrigger()
    } else asked = null
  })

  const { panelStyle, isTop, rect } = useAnchoredPanel({
    open: o.open,
    // Read on every pass: a panel open at mount finds its button once the button is in the page.
    trigger: () => o.anchor?.() ?? triggerEl.value ?? findTrigger(),
    panel: panelRef,
    close,
    opener: () => triggerEl.value,
    // A click outside leaves the focus where it went; every other close gives it back to the button.
    returnFocus: (how) => how !== 'outside' && !keep,
    capToRoom: true,
    fallbackWidth: o.menu ? 192 : 224,
    geometry: () => ({ prefer: 'below', align: o.align() }),
  })
  // Placed means shown: a panel hidden for its position refuses the focus until then.
  watch(
    rect,
    (now, before) => {
      if (!now || before || asked === null) return
      const at = asked
      asked = null
      o.onShown?.(at)
    },
    { flush: 'post' },
  )

  // A menu's focus goes back to the button before the browser moves it, so Tab lands after the
  // button and Shift+Tab before it, as if the menu had never taken focus.
  function onTab(e: KeyboardEvent) {
    if (!o.menu || e.key !== 'Tab') return
    findTrigger()?.focus()
    close()
  }

  // A dialog holds the focus while it is the top layer; a menu does not, the arrows walk it.
  if (!o.menu)
    useFocusTrap({
      active: o.open,
      container: panelRef,
      isTop,
      returnFocus: () => false,
      // The first field or list, else the first control: a panel of buttons opens on its first button.
      initial: () => {
        const list = panelRef.value ? tabbables(panelRef.value) : []
        return (
          list.find((el) => el.hasAttribute('data-autofocus')) ??
          list.find((el) => el.matches(`${FIELD}, [role=listbox]`)) ??
          list[0]
        )
      },
    })

  // The panel: the host's attributes on it (its `id` stays its own, the button points at it), the
  // host's content in it.
  const Panel: FunctionalComponent = (_, { attrs, slots }) =>
    h(Teleport, { to: teleport }, [
      h(
        Transition,
        {
          enterFromClass: 'ui-popover-enter-from',
          enterActiveClass: 'ui-popover-enter-active',
          leaveToClass: 'ui-popover-leave-to',
          leaveActiveClass: 'ui-popover-leave-active',
        },
        () =>
          o.open.value
            ? h(
                'div',
                mergeProps(attrs, {
                  'data-grani': '',
                  id: panelId,
                  ref: (el: unknown) => (panelRef.value = el as HTMLElement | null),
                  role,
                  tabindex: '-1',
                  'aria-labelledby': o.labelledby?.() || labelledBy.value || idOf(),
                  class: [
                    'fixed z-popover flex max-h-[min(calc(100dvh-1rem),var(--ui-panel-room,100dvh))] max-w-[calc(100vw-2rem)] flex-col rounded-overlay border border-border bg-surface shadow-lg focus:outline-hidden',
                    o.menu
                      ? 'min-w-48 overflow-y-auto overflow-x-hidden'
                      : 'min-w-56 overflow-hidden',
                  ],
                  style: panelStyle.value,
                  onKeydown: onTab,
                }),
                slots.default?.(),
              )
            : null,
      ),
    ])
  Panel.inheritAttrs = false
  provide(PANEL, { panel: panelRef, close: () => close() })

  return { Trigger, Panel, panelRef, close, findTrigger }
}
