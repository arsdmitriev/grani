export interface Debounced<A extends unknown[]> {
  (...args: A): void
  /** Drops the pending call. */
  cancel(): void
  /** Runs the pending call now instead of after the pause. */
  flush(): void
}

/** Holds a call until `wait` ms pass without another; the last arguments win. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: A | null = null
  const fire = () => {
    timer = null
    const args = pending
    pending = null
    if (args) fn(...args)
  }
  const run = (...args: A) => {
    pending = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(fire, wait)
  }
  const cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pending = null
  }
  const flush = () => {
    if (!timer) return
    clearTimeout(timer)
    fire()
  }
  return Object.assign(run, { cancel, flush })
}
