import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { useUiT } from './useUiT'

export interface AddItemsOptions {
  /** The names already in the list, matched in any case. */
  existing: () => string[]
  /** `lines`: a paste splits by line. `lists`: also by commas and semicolons, typed or pasted. */
  split: () => 'lines' | 'lists'
  /** Tidies an item on its way in. */
  fix?: () => ((item: string) => string) | undefined
  /** Why an item cannot be, in the product's words, or nothing when it can. */
  check?: () => ((item: string) => string | undefined) | undefined
  /** The most the list holds, counted from `existing`. */
  limit?: () => number | undefined
  /** The longest item; a paste is cut to it as typing is. */
  maxLength?: () => number | undefined
  /** Sends the items; a returned promise holds the next add until it settles, a rejection gives the text back. */
  onAdd?: () => ((items: string[]) => unknown) | undefined
  /** A repeat was refused: the name as the list has it. */
  onTaken?: (name: string) => void
  /** Nothing goes in: a pasted list waiting for the request is dropped. */
  disabled?: () => boolean
}

export interface AddNote {
  text: string
  /** A refusal or a failure: the danger ink. A repeat or a tidied item is only said. */
  danger?: boolean
  /** The field holds what cannot go in. */
  invalid?: boolean
}

/**
 * One way in for every item of a list you add to, typed or pasted: split, trimmed, tidied by
 * `fix`, checked by `check`, matched against `existing` in any case, fitted into `limit`. What
 * cannot go in stays in the field with the reason; a repeat is pointed at; while a request is on
 * its way a second add sends nothing, typing goes on and a pasted list waits for it, and a failure
 * gives the text back unless something new was typed, its line offering Enter only when it did.
 */
export function useAddItems(text: Ref<string>, o: AddItemsOptions) {
  const { t, tp } = useUiT()
  const busy = ref(false)
  const note = ref<AddNote | null>(null)
  let alive = true
  onBeforeUnmount(() => (alive = false))
  // A list pasted while an add is on its way waits for it, then goes in as a list: let into the
  // field as text, its lines would run together into one item.
  let queued: string[] | null = null

  const left = computed(() => {
    const limit = o.limit?.()
    return limit === undefined ? Infinity : limit - o.existing().length
  })
  const full = computed(() => left.value <= 0)
  // What did not fit stays said, until the list has room again.
  const overflow = ref('')
  watch(full, (on) => {
    if (!on) overflow.value = ''
  })

  const find = (name: string) => o.existing().find((e) => e.toLowerCase() === name.toLowerCase())
  const LISTS = /[\r\n,;]+/
  const pieces = (raw: string, pasted: boolean) =>
    o.split() === 'lists' ? raw.split(LISTS) : pasted ? raw.split(/\r?\n/) : [raw]
  const joiner = () => (o.split() === 'lists' ? ', ' : ' ')

  // `after` is the answer a waiting list goes in behind: the text the field holds now and the line
  // a failure said, which the list's own lines join instead of replacing.
  async function run(raw: string[], typed: boolean, after?: { text: string; said?: AddNote }) {
    if (busy.value) return
    const fix = o.fix?.()
    const check = o.check?.()
    const max = o.maxLength?.()
    const good: string[] = []
    const bad: string[] = []
    const taken: string[] = []
    let reason = ''
    let fixed = ''
    for (const piece of raw.map((r) => r.trim()).filter(Boolean)) {
      let item = ''
      let why: string | undefined
      // The product's fix and check are trusted with words, not with the row: one that throws,
      // or a fix that leaves nothing, refuses the item with a reason instead of going silent.
      try {
        // The cap holds after the fix too: a fix that lengthens an item is cut as typing is.
        item = (fix ? fix(piece) : piece).trim().slice(0, max)
        why = item ? check?.(item) : t('grani.addRow.cannot', { name: piece })
      } catch {
        why = t('grani.addRow.cannot', { name: piece })
      }
      if (why) {
        bad.push(piece)
        reason ||= why
        continue
      }
      const hit = find(item)
      // A repeat inside one paste is pointed at too, as one already in the list.
      const twice = good.find((g) => g.toLowerCase() === item.toLowerCase())
      if (hit) taken.push(hit)
      else if (twice) taken.push(twice)
      else {
        good.push(item)
        if (item !== piece) fixed = item
      }
    }
    if (!good.length && !bad.length && !taken.length) return
    if (taken[0]) o.onTaken?.(taken[0])
    // A typed repeat keeps its text: it may be the start of something new. It is said, not an
    // error: neither the alert glyph nor `aria-invalid`, which stay for an item that cannot be.
    if (typed && !good.length && !bad.length) {
      note.value = { text: t('grani.addRow.taken', { name: taken[0]! }) }
      return
    }
    const fits = good.slice(0, Math.max(0, left.value))
    const over = good.length - fits.length
    const lines: string[] = after?.said ? [after.said.text] : []
    if (bad.length) lines.push(bad.length > 1 ? t('grani.addRow.bad', { n: bad.length }) : reason)
    if (taken.length)
      lines.push(
        taken.length > 1
          ? t('grani.addRow.someTaken', { n: taken.length })
          : t('grani.addRow.taken', { name: taken[0]! }),
      )
    if (over) {
      overflow.value = tp('grani.addRow.over', over, { n: over, limit: o.limit?.() ?? 0 })
      lines.push(overflow.value)
    }
    if (!lines.length && fits.length === 1 && fixed)
      lines.push(t('grani.addRow.fixed', { value: fixed }))
    const was = after?.text ?? text.value
    // What cannot be stays in the field to be put right; a paste keeps what was typed before it.
    const kept = bad.join(joiner())
    // What the field is given now, kept as written: a model bound by the owner reads back its old
    // value until the owner's next render, and a failure must tell its own text from a fresher one.
    const shown = typed ? kept : [was, kept].filter(Boolean).join(joiner())
    text.value = shown
    note.value = lines.length
      ? {
          text: lines.join(' '),
          danger: bad.length > 0 || !!after?.said?.danger,
          invalid: bad.length > 0,
        }
      : null
    if (!fits.length) return
    // Returns the text the field holds after the failure.
    const fail = (fresh: boolean) => {
      // Something typed since is fresher than the text that failed: it stays, and the line does not
      // offer an Enter that would send it. A paste's items never come back as text either.
      const back = typed && fresh
      if (back) text.value = was
      overflow.value = ''
      const failed = t(
        fits.length > 1
          ? 'grani.addRow.failedMany'
          : back
            ? 'grani.addRow.failed'
            : 'grani.addRow.failedAway',
        { n: fits.length, name: fits[0]! },
      )
      note.value = {
        text: after?.said ? `${after.said.text} ${failed}` : failed,
        danger: true,
      }
      return back ? was : text.value
    }
    // A handler that throws at once fails as a rejected request does: the text comes back, said.
    let request: unknown
    try {
      request = o.onAdd?.()?.(fits)
    } catch {
      fail(true)
      return
    }
    // Any thenable holds the add, not only a native Promise: a request library may return its own.
    if (typeof (request as PromiseLike<unknown> | undefined)?.then !== 'function') return
    busy.value = true
    // A failure writes its text back, which a model the owner binds reads back only after the
    // owner's next render: the list waiting behind it goes in onto that text, and after its line.
    let failed: { text: string; said?: AddNote } | undefined
    try {
      await request
    } catch {
      if (!alive) return
      const back = fail(text.value === shown)
      failed = { text: back, said: note.value ?? undefined }
    } finally {
      if (alive) {
        busy.value = false
        const next = queued
        queued = null
        if (next && !o.disabled?.()) void run(next, false, failed)
      }
    }
  }
  const submit = (raw: string[], typed: boolean) => run(raw, typed)

  /** A paste of two items and more goes in as a list; one item pastes as text. */
  function paste(e: ClipboardEvent) {
    const all = pieces(e.clipboardData?.getData('text') ?? '', true)
    if (all.filter((p) => p.trim()).length < 2) return
    e.preventDefault()
    if (busy.value) queued = [...(queued ?? []), ...all]
    else void submit(all, false)
  }

  return { busy, note, overflow, left, full, find, pieces, submit, paste }
}
