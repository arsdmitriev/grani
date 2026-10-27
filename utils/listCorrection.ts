// A list that corrects its own view (a page past the end once rows went away) says so for the
// moment of the change. The address writes that change in place: it is no step of the person's,
// though a press came before it (the Delete that took the row), and Back goes where they were.
let correcting = false
let ends: ReturnType<typeof setTimeout> | undefined

/** Marks the change the list is about to make as its own correction, until the current task ends. @internal */
export function markCorrection() {
  correcting = true
  clearTimeout(ends)
  ends = setTimeout(() => (correcting = false))
}

/** Whether the change being written is the list's own correction. @internal */
export const isCorrection = () => correcting
