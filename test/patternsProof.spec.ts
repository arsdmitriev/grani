import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PATTERNS } from '../scripts/reference/patterns'

// A proof names a spec by its file name and an `it` by its title; both are looked up here,
// so a renamed or deleted test turns the gate red instead of leaving a claim nobody checks.
const ROOTS = ['components', 'composables', 'utils', 'test']

function specOf(name: string): string | null {
  for (const dir of ROOTS) {
    const path = resolve(__dirname, '..', dir, `${name}.spec.ts`)
    if (existsSync(path)) return readFileSync(path, 'utf8')
  }
  return null
}

// An `it` title in any of the three quotes; the escapes of a quoted title are undone. A test
// in a comment proves nothing, and `it.skip(` is not `it(`: a skipped test is no proof. A block
// comment opens a line: `'image/*'` inside a string is not one, nor is the `*/*` after it.
export function titlesOf(source: string): Set<string> {
  const titles = new Set<string>()
  const code = source.replace(/^\s*\/\*[\s\S]*?\*\//gm, '').replace(/^\s*\/\/.*$/gm, '')
  for (const m of code.matchAll(/\bit\(\s*(['"`])((?:\\[\s\S]|(?!\1)[\s\S])*)\1/g)) {
    titles.add(m[2]!.replace(/\\(.)/g, '$1'))
  }
  return titles
}

const proofs = Object.entries(PATTERNS).flatMap(([rule, r]) =>
  Object.entries(r.proof ?? {}).flatMap(([spec, t]) =>
    (Array.isArray(t) ? t : [t]).map((title) => ({ rule, spec, title })),
  ),
)

describe('rules — every claim is proven', () => {
  // Where a rule says it holds is where it shows (`at`) and where it promises (`holds`): both name
  // a test of their own, or the reader is promised what nothing checks.
  it('a component a proven rule holds on names a test of its own', () => {
    const bare = Object.entries(PATTERNS)
      .filter(([k]) => !UNPROVEN.includes(k))
      .flatMap(([k, r]) =>
        [...new Set([...Object.keys(r.at), ...Object.keys(r.holds ?? {})])]
          .filter((c) => !(r.proof && c in r.proof))
          .map((c) => `${k} @ ${c}`),
      )
    expect(bare).toEqual([])
  })
})

describe('rules — titlesOf', () => {
  it('reads escapes and lines, and skips a commented or skipped test', () => {
    const source = [
      "it('a \\'quoted\\' title', () => {})",
      'it(`two',
      'lines`, () => {})',
      "// it('commented', () => {})",
      "/* it('blocked', () => {}) */",
      "it.skip('skipped', () => {})",
      "it('takes image/* files', () => mount({ accept: 'image/*' }))",
      "it('takes */* too', () => {})",
    ].join('\n')
    expect([...titlesOf(source)]).toEqual([
      "a 'quoted' title",
      'two\nlines',
      'takes image/* files',
      'takes */* too',
    ])
  })
})

describe('rules — proof', () => {
  it('every rule names at least one test', () => {
    const bare = Object.entries(PATTERNS)
      .filter(([, r]) => !r.proof || Object.keys(r.proof).length === 0)
      .map(([k]) => k)
    // Rules that are written but not yet proven; the list only shrinks.
    expect(bare.sort()).toEqual(UNPROVEN.slice().sort())
  })

  it.each(proofs)('$rule: $spec › $title', ({ spec, title }) => {
    const source = specOf(spec)
    expect(source, `no ${spec}.spec.ts`).not.toBeNull()
    expect([...titlesOf(source!)]).toContain(title)
  })
})

// Written before proofs were asked for; each leaves this list when its moment names its tests.
const UNPROVEN = [
  // Working the list: written, not built or not proven yet.
  'filterFromCell',
  'pasteValues',
  'recentRecords',
  'pinRecords',
  'searchAnyField',
  'tabLink',
  'recordLink',
  'countOpensList',
  'savedViews',
  'inlineEdit',
  'prefill',
  'createRelated',
  'duplicate',
  'exportSelection',
  'backKeepsPlace',
]
