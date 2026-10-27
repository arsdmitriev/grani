import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { en } from '../i18n/en'

// Every text a component shows goes through `t()` with a key of `en`. A key is written out in the
// source, so this reads it there: a key built at runtime would be out of its reach.
const root = resolve(__dirname, '..')
const sources = ['components', 'composables', 'utils'].flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), 'utf8') })),
)

describe('message keys', () => {
  it('every key a source names is in en, a plural one with its `.other` form', () => {
    const missing: string[] = []
    let seen = 0
    for (const { file, text } of sources)
      // A key is a string in single quotes; a store's name (`useShared('grani:…')`) is not one.
      for (const [, key] of text.matchAll(/(?<!useShared\()'(grani\.[\w.]+)'/g)) {
        seen++
        if (!(key! in en) && !(`${key}.other` in en)) missing.push(`${file}: ${key}`)
      }
    expect(seen).toBeGreaterThan(100)
    expect(missing).toEqual([])
  })

  it('no key is built at runtime', () => {
    const built = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/\b(?:t|tp)\(\s*`[^`]*\$\{/g)].map(() => file),
    )
    expect(built).toEqual([])
  })
})
