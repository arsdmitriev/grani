import { computed, useId } from 'vue'

/**
 * A button off with a reason (`disabled` with a `disabledReason`): it keeps the focus through
 * `aria-disabled`, refuses the press, and the reason is its description; loading refuses the press
 * too. The one rule of UiButton and UiIconButton. @internal
 */
export function useDisabledReason(
  props: { disabled?: boolean; loading?: boolean; disabledReason?: string },
  prefix: string,
) {
  // A blank reason is none: a focusable button that says nothing is the trap a reason removes.
  const reason = computed(() => props.disabledReason?.trim() ?? '')
  const reasoned = computed(() => Boolean(props.disabled && !props.loading && reason.value))
  const reasonId = `${prefix}-${useId()}`
  // On the button in the capture phase: ahead of its bubbling listeners, a router link's navigation
  // and a submit's form. A press by key is refused where it opens something (`useTrigger`).
  function refuse(e: Event) {
    if (!props.loading && !reasoned.value) return
    e.preventDefault()
    e.stopImmediatePropagation()
  }
  return { reason, reasoned, reasonId, refuse }
}
