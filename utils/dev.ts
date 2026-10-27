// Declared here, not through @types/node: the package types no Node globals.
declare const process: { env: { NODE_ENV?: string } }

/**
 * Whether the app's bundler built for development. Written as Vue writes it, so Vite and webpack
 * replace it in the app's build; the library's own build leaves it alone (`import.meta.env.DEV`
 * would be fixed to `false` there, for every app). Where nothing replaces it and `process` does
 * not exist, it is production.
 *
 * This is the function the sources and the specs call. The library's build (`scripts/lib.config.mjs`)
 * writes its test into each call instead, since no bundler or minifier drops a branch behind a call
 * and a production bundle would keep every warning text. So in the shipped files a check made with
 * no `process` and nothing replacing it throws, as Vue's does; only the import is safe (`useShared`).
 * @internal
 */
export function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

const told = new WeakMap<object, Set<string>>()
/**
 * Warns once per app and key: a table of a hundred rows that repeat one mistake says it once. With
 * no app (a component mounted outside one) it warns every time. @internal
 */
export function warnOnce(app: object | undefined, key: string, message: string): void {
  if (app) {
    let seen = told.get(app)
    if (!seen) told.set(app, (seen = new Set()))
    if (seen.has(key)) return
    seen.add(key)
  }
  console.warn(message)
}
