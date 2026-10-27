import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

type TextControl = HTMLInputElement | HTMLTextAreaElement

/**
 * The value of a text control under an IME. Nothing is emitted mid-composition,
 * and while composing the bound value follows the DOM: a host that re-renders
 * for its own reasons would otherwise write the stale model back into the
 * control and break the characters being typed. `normalize` rewrites the value
 * before it is emitted (a comma to a point); the DOM follows, caret kept. With `model`, the
 * control follows the owner after each change: a change the owner refused is put back.
 */
export function useComposedValue(
  emit: (value: string) => void,
  normalize: (value: string) => string = (v) => v,
  model?: () => string,
) {
  const composing = ref(false)
  const domValue = ref('')

  const display = (model: string | null | undefined) =>
    composing.value ? domValue.value : (model ?? '')

  function commit(el: TextControl) {
    const next = normalize(el.value)
    if (next !== el.value) {
      const caret = el.selectionStart
      el.value = next
      if (caret != null) el.setSelectionRange(caret, caret)
    }
    domValue.value = next
    emit(next)
    // After the owner's turn the control shows what the owner holds, a refusal included. The
    // caret stays where the typing was, less what the owner took away, not at the end.
    if (model)
      void nextTick(() => {
        const held = model()
        if (composing.value || el.value === held) return
        const caret = el.selectionStart
        const focused = el.ownerDocument.activeElement === el
        const lost = el.value.length - held.length
        el.value = held
        if (focused && caret != null) {
          const at = Math.min(Math.max(0, caret - Math.max(0, lost)), held.length)
          el.setSelectionRange(at, at)
        }
      })
  }

  function onInput(e: Event) {
    const el = e.target as TextControl
    domValue.value = el.value
    if (!composing.value) commit(el)
  }
  function onCompositionStart() {
    composing.value = true
  }
  function onCompositionEnd(e: Event) {
    composing.value = false
    commit(e.target as TextControl)
  }

  return { composing, display, onInput, onCompositionStart, onCompositionEnd }
}

/**
 * A form reset puts a control on its default (the server's markup, empty or unchecked) and fires
 * no input or change event: once the reset is done, `restore` puts the model back into it.
 */
export function useFormReset<E extends TextControl>(
  el: Ref<E | null>,
  restore: (control: E) => void,
) {
  let form: HTMLFormElement | null = null
  // The browser writes the defaults after the event: the model goes back on the next task.
  const onReset = () =>
    setTimeout(() => {
      if (el.value) restore(el.value)
    })
  const listen = (control: E | null) => {
    const next = control?.form ?? null
    if (next === form) return
    form?.removeEventListener('reset', onReset)
    form = next
    form?.addEventListener('reset', onReset)
  }
  onMounted(() => listen(el.value))
  // A control drawn later (a list field that was full when it mounted) listens once it is there.
  watch(el, (control) => control && listen(control), { flush: 'post' })
  onBeforeUnmount(() => form?.removeEventListener('reset', onReset))
}
