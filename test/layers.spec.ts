import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')
const sources = (dir: string) =>
  readdirSync(join(root, dir))
    .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), 'utf8') }))

// Every relative import of a file, a type's too: `import type` couples the folders as much.
const imports = (text: string) =>
  [...text.matchAll(/\b(?:from|import)\s*\(?\s*'(\.\.?\/[^']+)'/g)].map((m) => m[1]!)

// The folders stand in one order: a component builds on composables and utils, a composable on
// utils, a util on neither. A lower folder that reaches up ties what any component may use to one
// component's file, and a cycle waits one import away.
describe('the order of the folders', () => {
  it('a composable imports no component', () => {
    const up = sources('composables').flatMap(({ file, text }) =>
      imports(text)
        .filter((s) => s.startsWith('../components/'))
        .map((s) => `${file}: ${s}`),
    )
    expect(up).toEqual([])
  })

  it('a util imports no component and no composable', () => {
    const up = sources('utils').flatMap(({ file, text }) =>
      imports(text)
        .filter((s) => /^\.\.\/(components|composables)\//.test(s))
        .map((s) => `${file}: ${s}`),
    )
    expect(up).toEqual([])
  })

  it('the reading sees the imports it judges', () => {
    // A reading that found nothing would pass both: the components import composables and utils.
    const found = sources('components').flatMap(({ text }) => imports(text))
    expect(found.some((s) => s.startsWith('../composables/'))).toBe(true)
    expect(found.some((s) => s.startsWith('../utils/'))).toBe(true)
  })
})
