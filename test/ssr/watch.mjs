// A server has none of a browser's globals. The watch puts a getter on globalThis for each of them
// that answers `undefined`, as a server without the global does, and writes down who asked. Shared
// by the server specs (the sources through Vitest) and the release check of the source repository
// (the installed dist in plain Node), so both hold the library to one rule.
import { readFileSync } from 'node:fs'

/** The browser globals a server does not have. Node 22 has a `navigator` of its own; a server in
 * general does not, so it is watched as missing too. */
export const BROWSER = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'requestAnimationFrame',
  'ResizeObserver',
]

/**
 * Starts the watch. `restore()` puts back what globalThis had. A touch is `{ name, from }`, `from`
 * the first stack frame outside this file and the folder of the caller (`skip`).
 * @param {{ skip?: string }} [options]
 */
export function watchGlobals({ skip = '/test/ssr/' } = {}) {
  /** @type {{ name: string, from: string }[]} */
  const touches = []
  const saved = BROWSER.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
  for (const name of BROWSER)
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        const frames = (new Error().stack ?? '').split('\n').slice(2)
        const from = frames.find((f) => !f.includes(skip) && !f.includes('/watch.mjs')) ?? ''
        touches.push({ name, from: from.trim() })
        return undefined
      },
    })
  return {
    touches,
    restore() {
      for (const [name, descriptor] of saved) {
        delete globalThis[name]
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      }
    },
  }
}

const FRAME = /(\/[^\s()]+?):(\d+):\d+\)?$/

/** The source line a touch came from. */
function lineOf(touch) {
  const m = FRAME.exec(touch.from)
  if (!m) return ''
  return readFileSync(m[1], 'utf8').split('\n')[Number(m[2]) - 1] ?? ''
}

const escape = (name) => name.replace(/[$]/g, '\\$&')

/**
 * Whether every read of `name` on a line is guarded. A read is the `typeof` operand itself, or a use
 * after `typeof name !== 'undefined' &&` (or `? ` of that test) with nothing between them that
 * ends the guard (`;`, `,`, `||`, `:` or another `?`). The column a stack gives is not used: through
 * a source map it points at the statement, not at the read.
 */
export function guardedLine(line, name) {
  const n = escape(name)
  const reads = [
    ...line.matchAll(new RegExp(`(?<![\\w$.])(globalThis\\s*\\.\\s*)?${n}(?![\\w$])`, 'g')),
  ]
  if (!reads.length) return false
  const typeofs = reads.filter((m) => /\btypeof\s*\(?\s*$/.test(line.slice(0, m.index)))
  if (!typeofs.length) return false
  const guard = new RegExp(
    `\\btypeof\\s*\\(?\\s*(?:globalThis\\s*\\.\\s*)?${n}\\s*\\)?\\s*!==?\\s*(['"\`])undefined\\1\\s*(&&|\\?)`,
    'g',
  )
  const guards = [...line.matchAll(guard)].map((m) => ({
    end: m.index + m[0].length,
    stop: m[2] === '&&' ? /;|,|\|\||\?(?!\.)|:/ : /;|,|:/,
  }))
  return reads.every(
    (m) =>
      typeofs.includes(m) ||
      guards.some((g) => g.end <= m.index && !g.stop.test(line.slice(g.end, m.index))),
  )
}

/**
 * The reads that are uses, not guards. With the getter answering `undefined`, a guarded read never
 * runs: what may run is the `typeof` itself. A touch passes only when its line holds a `typeof` of
 * the global and no read of it the guard does not cover: a line that guards one read and makes
 * another is caught. `ours(from)` says whether a frame is the library's.
 * @param {{ name: string, from: string }[]} touches
 * @param {(from: string) => boolean} ours
 */
export function unguarded(touches, ours) {
  return touches
    .filter((t) => ours(t.from))
    .filter((t) => !guardedLine(lineOf(t), t.name))
    .map((t) => `${t.name} at ${t.from} :: ${lineOf(t).trim()}`)
}
