import { nextTick, onBeforeUnmount, readonly, ref } from 'vue'

/**
 * Copy to the clipboard with an outcome flag that resets after `resetMs`: `copied`
 * for the check that replaces a copy glyph, `failed` for the word that says it did
 * not work. Without the Clipboard API (a page over plain HTTP) or with it refused, it
 * copies the old way, through a selected field no one sees; it resolves `false` only
 * when both fail, and never throws. `reset` drops both flags at once, for a new value.
 */
export function useClipboard(resetMs = 1200) {
  const copied = ref(false)
  const failed = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  // A write that resolves after `reset` belongs to the old value and changes nothing.
  let turn = 0
  // A write that resolves after unmount starts no timer that nothing would clear.
  let gone = false

  const reset = () => {
    turn++
    if (timer) clearTimeout(timer)
    timer = null
    copied.value = false
    failed.value = false
  }

  const settle = (ok: boolean) => {
    // Cleared first, set on the next tick: a second outcome in the window changes the DOM,
    // so a live region reading it speaks again instead of staying silent.
    copied.value = false
    failed.value = false
    void nextTick(() => {
      copied.value = ok
      failed.value = !ok
    })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
      failed.value = false
    }, resetMs)
    return ok
  }

  const copy = async (text: string): Promise<boolean> => {
    const mine = ++turn
    let ok = false
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
    } catch {
      ok = false
    }
    // A page served over plain HTTP has no Clipboard API, and a frame may be refused it: the old
    // way still copies there, in the same press.
    if (!ok) ok = copyTheOldWay(text)
    if (mine === turn && !gone) settle(ok)
    return ok
  }

  onBeforeUnmount(() => {
    gone = true
    if (timer) clearTimeout(timer)
  })

  return {
    /** True for `resetMs` after a write that reached the clipboard. */
    copied: readonly(copied),
    /** True for `resetMs` after the clipboard refused. */
    failed: readonly(failed),
    /** Writes `text`; resolves `true` on success, `false` on a refusal, never throws. */
    copy,
    /** Drops both flags at once, and makes a write still in flight change nothing. */
    reset,
  }
}

// The text selected in a field no one sees, copied, and the field gone. It stands in the window or
// the panel the focus is in, so its focus trap keeps it, and the focus goes back where it was. A
// trap that takes the focus back anyway leaves nothing selected, and the browser would still say
// it copied: that counts as refused, so no check claims a copy that did not happen.
function copyTheOldWay(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false
  const back = document.activeElement as HTMLElement | null
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0' })
  ;(
    back?.closest('[aria-modal="true"], [role="dialog"], [role="alertdialog"]') ?? document.body
  ).appendChild(area)
  area.focus({ preventScroll: true })
  area.select()
  let ok: boolean
  try {
    ok = document.activeElement === area && document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  back?.focus({ preventScroll: true })
  return ok
}
