import { computed, useAttrs } from 'vue'

/**
 * The caller's attributes for a component whose root is not its control: `class`
 * and `style` stay on the root, the rest (`data-*`, `aria-*`, `required`, `@blur`)
 * reaches the control. Pair with `defineOptions({ inheritAttrs: false })`.
 */
export function useSplitAttrs() {
  const attrs = useAttrs()
  const rootClass = computed(() => attrs.class as never)
  const rootStyle = computed(() => attrs.style as never)
  const control = computed(() => {
    // Read one key first: Vue tracks `$attrs` on a read of a key, not on `Object.entries`, and a
    // component given no attributes at its first render would never see one bound later.
    void attrs.class
    return Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style'))
  })
  return { attrs, rootClass, rootStyle, control }
}

/**
 * The caller's attributes with the component's own over them, but only where the component has
 * a value: an `aria-invalid` it does not set must not wipe the one the caller gave.
 */
export function ownWhereSet(
  caller: Record<string, unknown>,
  own: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...caller,
    ...Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined)),
  }
}

/** Ids for one `aria-describedby`: the caller's and the component's, neither wiping the other. */
export function joinIds(...ids: unknown[]): string | undefined {
  const list = ids.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return list.length ? list.join(' ') : undefined
}
