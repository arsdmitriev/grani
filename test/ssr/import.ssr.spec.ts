import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BROWSER, unguarded, watchGlobals } from './watch.mjs'

// The package on a server: plain Node, nothing of a browser. Importing it must not reach for one.
// The built dist is held to the same rule after the build, in its installed form, by the release
// check of the source repository (`consumer: dist imports on a server`).

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
// A frame of the repository outside node_modules is the library's; Vue's own guards are not.
const ours = (root: string) => (from: string) =>
  from.includes(root) && !from.includes('/node_modules/')

describe('import on a server', () => {
  afterEach(() => vi.resetModules())

  it('Node has no window, document, clipboard or localStorage here', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect((globalThis as { navigator?: { clipboard?: unknown } }).navigator?.clipboard).toBe(
      undefined,
    )
    expect((globalThis as { localStorage?: unknown }).localStorage).toBe(undefined)
  })

  // The import transforms the whole library in a fresh graph: 2.3–3.7 s alone, measured, past the
  // runner's 5 s default under the load of the full run. The test guards which globals the import
  // reads, not its speed: a read is caught at any limit.
  it(
    'the source entry imports in a fresh graph and reads no browser global of its own beyond a typeof guard',
    { timeout: 20_000 },
    async () => {
      vi.resetModules()
      const watch = watchGlobals()
      let entry: Record<string, unknown>
      try {
        entry = await import('../../index')
      } finally {
        watch.restore()
      }
      expect(typeof entry.createGrani).toBe('function')
      expect(entry.UiDataTable).toBeTruthy()
      expect(unguarded(watch.touches, ours(ROOT))).toEqual([])
    },
  )

  it('the watch catches a read on a line that also guards, and lets a guarded read pass', async () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'grani-ssr-')))
    // One module per case, so each read is the first on its line. `typeof` on the same line as an
    // unguarded read was enough to pass before the guard was read from the line as a whole.
    const cases: Record<string, string> = {
      used: 'export const width = window && window.innerWidth',
      mixed: "export const a = typeof window === 'undefined' ? 0 : 1, b = window?.innerHeight",
      broken: "export const ok = typeof localStorage !== 'undefined', item = localStorage?.length",
      guarded: "export const width = typeof window === 'undefined' ? 0 : 1",
      and: "export const width = typeof window !== 'undefined' && window.innerWidth",
      branch: "export const width = typeof window !== 'undefined' ? window.innerWidth : 0",
    }
    for (const name of BROWSER)
      cases[`read-${name}`] = `export const x = globalThis.${name} === undefined`
    const watch = watchGlobals()
    let caught: string[]
    try {
      for (const [name, code] of Object.entries(cases)) {
        writeFileSync(join(dir, `${name}.mjs`), `${code}\n`)
        await import(/* @vite-ignore */ join(dir, `${name}.mjs`))
      }
    } finally {
      watch.restore()
    }
    try {
      caught = unguarded(watch.touches, ours(dir))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    const files = [...new Set(caught.map((c) => /\/([\w-]+)\.mjs/.exec(c)?.[1]))].sort()
    expect(files).toEqual(
      ['broken', 'mixed', 'used', ...BROWSER.map((n: string) => `read-${n}`)].sort(),
    )
  })
})
