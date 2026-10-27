import { isImeKey } from '../utils/ime'
import { nextTick, onScopeDispose, watch, type Ref } from 'vue'
import { focusInvalid, TYPED_FIELD } from '../utils/focusInvalid'

export interface SubmitLockOptions {
  /** The body: a submit that leaves a field `aria-invalid` in it puts the focus on the first one. */
  body: Ref<HTMLElement | null>
  /** The form: Cmd+Enter presses its own submit button. */
  form: Ref<HTMLFormElement | null>
  /** A request is out: no second one, and the lock opens when it ends. */
  submitting: () => boolean
  /** Whether a submit may go at all (not loading, not held, not read-only). */
  canSubmit: () => boolean
  /** Sends the submit; `another` is a "Save and add another". */
  send: (another: boolean) => void
  /** A submit the host refused by marking a field: the surface shakes, as at a refused close. */
  refused?: () => void
}

/**
 * One submit per request, for the form of an overlay (UiModal, UiCrudDrawer). A submit locks
 * until the request ends (`submitting` falls), the person moves in the form or edits it (`unlock`
 * on the body's focusin and the form's input and change: a select or a date fires no typing),
 * a refusal puts the focus on the field in error, or the overlay opens again; a timer would
 * reopen it before a host that sets `submitting` after its own async work. Cmd+Enter, or
 * Ctrl+Enter, from a field where you type presses the form's submit button, so a Save held or
 * spinning holds the shortcut too; a held key sends once.
 *
 * A request whose answer marks a field (`aria-invalid`) puts the focus on the first one when
 * `submitting` falls, unless the person went on typing in another field while it was out.
 *
 * A host may also answer a submit with a toast or a line of text, marking no field and never
 * setting `submitting`. Then a fresh press of Save sends again: a press later than the double-click
 * time after the locked submit, while no request is out and no key is held. A double click stays
 * one submit (its second press comes inside that time), and a host that sets `submitting` after its
 * own async work is still covered for that time; a person who presses again later, seeing no
 * spinner, means it. A timer that opened the lock on its own would send a slow double click twice.
 */
/** The usual double-click time of a desktop: a second press inside it is the same press. */
const DOUBLE_CLICK_MS = 500

export function useSubmitLock(o: SubmitLockOptions) {
  let locked = false
  let lockedAt = 0
  // A key held on Save repeats its click: a repeat is never a fresh press.
  let held = false
  const unlock = () => {
    locked = false
  }
  // A fresh press: later than a double click's second press.
  const fresh = () => Date.now() - lockedAt >= DOUBLE_CLICK_MS

  // A repeat is never a fresh press, the lock fallen or not: an Enter held through a failed save,
  // or through a step into the next level, would send that level's form.
  function submit(another = false) {
    if (held || (locked && !fresh()) || o.submitting() || !o.canSubmit()) return
    locked = true
    lockedAt = Date.now()
    o.send(another)
    // A host that checks the form as it gets the submit marks the fields at once; the focus goes
    // to the first, the surface shakes so the press is seen to be refused, and the form waits for
    // the fix, not for the next keystroke.
    void nextTick(() => {
      if (!focusInvalid(o.body.value)) return
      unlock()
      o.refused?.()
    })
  }

  // In a text box Enter is a new line; on a button it stays the button's: Cancel must never send.
  function onMetaEnter(e: KeyboardEvent) {
    if (!(e.metaKey || e.ctrlKey) || isImeKey(e) || e.defaultPrevented) return
    if (!(e.target as HTMLElement).matches?.(TYPED_FIELD)) return
    e.preventDefault()
    if (e.repeat) return
    const button = o.form.value?.querySelector<HTMLButtonElement>('button[type="submit"]')
    if (button) button.click()
    else submit()
  }

  // The press a repeat makes lands while the repeat is dispatched (the click of Save, the submit of
  // a field), so the flag lets go right after it: the key may come up where the form does not hear
  // it (the drawer closed on the save), and the next click on Save is a fresh press. The press
  // follows the keypress, which Chromium may take as an input event of its own after the keydown's
  // release has run: the keypress holds the key again.
  const onKeydown = (e: KeyboardEvent) => {
    held = e.repeat
    if (held) setTimeout(onKeyup)
  }
  const onKeyup = () => {
    held = false
  }
  watch(
    o.form,
    (form, was) => {
      was?.removeEventListener('keydown', onKeydown, true)
      was?.removeEventListener('keypress', onKeydown, true)
      was?.removeEventListener('keyup', onKeyup, true)
      form?.addEventListener('keydown', onKeydown, true)
      form?.addEventListener('keypress', onKeydown, true)
      form?.addEventListener('keyup', onKeyup, true)
    },
    { immediate: true, flush: 'post' },
  )
  onScopeDispose(() => {
    o.form.value?.removeEventListener('keydown', onKeydown, true)
    o.form.value?.removeEventListener('keypress', onKeydown, true)
    o.form.value?.removeEventListener('keyup', onKeyup, true)
  })

  // Whether the person typed while the request was out, anywhere on the page: in the body, or in a
  // panel drawn outside it (a select's search). The answer then leaves the focus where they type;
  // a focus that only rests in a field (the one Enter sent from) is not typing.
  let typed = false
  const onTyped = () => (typed = true)
  const listen = (on: boolean) =>
    typeof document !== 'undefined' &&
    document[on ? 'addEventListener' : 'removeEventListener']('input', onTyped, true)
  onScopeDispose(() => listen(false))

  watch(o.submitting, (busy, was) => {
    if (busy && !was) {
      typed = false
      listen(true)
      return
    }
    if (!was || busy) return
    listen(false)
    unlock()
    // A tick later, when the update that lowered `submitting` has rendered the host's marks.
    void nextTick(() => {
      if (!typed) focusInvalid(o.body.value)
    })
  })

  return {
    submit,
    unlock,
    onMetaEnter,
    /** Whether the person typed while the last request was out. */
    typed: () => typed,
  }
}
