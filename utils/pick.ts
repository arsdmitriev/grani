/**
 * Read a class from a lookup map, falling back on an unknown key.
 * `Object.hasOwn` matters: `map['constructor']` would return an inherited
 * function, which is truthy, so `??` would not catch it and Vue would drop
 * the class silently.
 */
export function pick<K extends string>(
  map: Record<K, string>,
  key: K | undefined | null,
  fallback: K,
): string {
  return key != null && Object.hasOwn(map, key) ? map[key] : map[fallback]
}
