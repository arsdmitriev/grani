const isThenable = (v: unknown): v is PromiseLike<unknown> =>
  Boolean(v) && typeof (v as PromiseLike<unknown>).then === 'function'

/**
 * Calls the listener of an event a component waits for (`@more`, `@add`). The component declares
 * it as a prop (`onMore`), so the handler reaches it and what the handler returns is seen: one
 * promise holds the control until it settles. Two listeners merged from attributes arrive as an
 * array; each is called, and every promise among their answers is awaited. Nothing returned
 * a promise: `undefined`, and the control is not held. A listener that throws at once throws here.
 * @internal
 */
export function callListeners<A extends unknown[]>(
  listener: unknown,
  ...args: A
): Promise<unknown[]> | undefined {
  const all = [listener].flat().filter((fn) => typeof fn === 'function') as ((...a: A) => unknown)[]
  const runs = all.map((fn) => fn(...args)).filter(isThenable)
  return runs.length ? Promise.all(runs) : undefined
}
