import { config, enableAutoUnmount } from '@vue/test-utils'
import type { Component } from 'vue'
import { afterEach, vi } from 'vitest'
import { resetShared } from '../composables/useShared'
import { hush } from '../utils/announce'
import { createGrani, type GraniOptions } from '../plugin'
import { ru } from '../i18n'

/**
 * Vitest harness for the library's own tests, loaded by test/setup.ts.
 */

// Shared state lives in the module's store without a plugin: emptied between tests.
afterEach(() => resetShared())

// The page's live region goes after every test, and the line still on its way with it: a test's
// words land 50 ms after it said them, on the real clock, so they would be written inside the next
// test, or the next file's, whose page may have no document (the server's specs).
afterEach(() => {
  hush()
  document.getElementById('ui-announcer')?.remove()
})

// The real clock comes back after every test, also after one that failed before its own restore.
afterEach(() => vi.useRealTimers())

// Every mounted wrapper is unmounted after its test: a component left mounted keeps its listeners
// on window and document, and a later test's keypress or timer reaches it too. Run in a shuffled
// order, such leftovers decided which tests passed.
enableAutoUnmount(afterEach)

/** `global.plugins` for a mount in an app of its own: `mount(X, { global: { plugins: withGrani({ size: 'md' }) } })`. */
export function withGrani(options: GraniOptions = {}) {
  return [createGrani(options)]
}

/** An app in Russian, its words from the dictionary grani ships. */
export const RUSSIAN: GraniOptions = { locale: 'ru', translate: (key) => ru[key] }

// happy-dom fires no transitionend, so <Transition> would keep leaving nodes mounted.
// Teleport as a stub: the panel stays inside the wrapper, so specs can find it.
config.global.stubs = { transition: true, 'transition-group': true, teleport: true }

// Specs write templates with the components by name: every Ui* is registered for them.
// The glob is relative to this file, so it also works from node_modules.
const modules = import.meta.glob('../components/Ui*.vue', { eager: true }) as Record<
  string,
  { default: Component }
>
for (const [path, mod] of Object.entries(modules)) {
  const name = path.split('/').pop()!.replace('.vue', '')
  config.global.components = { ...config.global.components, [name]: mod.default }
}
