import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REGISTRY } from '../registry'

// The README's first screen lists what is inside by hand, in a table by family: the stable in the
// second column, the experimental in a third while there are any. A component added, renamed or
// moved to another status in the registry and forgotten there fails here.
describe('README', () => {
  const readme = readFileSync(resolve(__dirname, '../README.md'), 'utf8')
  const inside = readme.split(/^## What's inside$/m)[1]?.split(/^## /m)[0] ?? ''
  const names = (cell: string) => [...cell.matchAll(/\bUi[A-Z]\w+/g)].map((m) => m[0])
  const rows = inside
    .split('\n')
    .filter((l) => /^\| [A-Z]/.test(l) && !/^\| Family/.test(l))
    .map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    )

  it('lists every component under what is inside, each under its status, and nothing else', () => {
    const own = Object.entries(REGISTRY).filter(([, e]) => !e.parent)
    expect(rows.length).toBeGreaterThanOrEqual(8)
    const listed = rows.flatMap(([, stable, experimental = '']) => [
      ...names(stable!).map((n) => `${n} stable`),
      ...names(experimental!).map((n) => `${n} experimental`),
    ])
    expect(listed.sort()).toEqual(own.map(([name, e]) => `${name} ${e.status}`).sort())
  })

  // SECURITY.md stands on it: the server example writes the state into a script, and a value with
  // </script> in it must not end that script early. The guide's own line is run, not retyped.
  it('the server example escapes the state it writes into the page', () => {
    const server = readFileSync(resolve(__dirname, '../docs/guides/server-rendering.md'), 'utf8')
    const expr = /^const state = (.+)$/m.exec(server)?.[1]
    expect(expr, 'a `const state =` line in Server rendering').toBeTruthy()
    expect(server).toContain('<script>window.__STATE__ = ${state}</script>')
    const snapshot = { 'grani:note': '</script><img src=x onerror=alert(1)><!--' }
    const state = new Function('sharedSnapshot', 'app', `return ${expr}`)(() => snapshot, null)
    const page = `<script>window.__STATE__ = ${state}</script>`
    expect(page.match(/<\/script>/gi)).toHaveLength(1)
    expect(page).not.toContain('<!--')
    expect(new Function(`return ${state}`)()).toEqual(snapshot)
  })
})
