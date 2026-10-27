import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')
const sources = ['components', 'composables', 'utils'].flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), 'utf8') })),
)

describe('store keys', () => {
  // The app's store holds what `createGrani({ shared })` seeds and `sharedSnapshot` writes out:
  // every key of the library is `grani:<name>`, so none meets a key of the app's own.
  it('every key the library stores under is grani:<name>', () => {
    const keys: string[] = []
    for (const { file, text } of sources)
      for (const [, arg] of text.matchAll(/\buseShared(?:<[^\n]*?>)?\(\s*('[^'\n]*'|\w+)\s*,/g)) {
        const name = arg!.trim()
        const value = /^[A-Z_]+$/.test(name)
          ? text.match(new RegExp(`const ${name} = ('[^']*')`))?.[1]
          : name
        keys.push(`${file}: ${value ?? name}`)
      }
    expect(keys.length).toBeGreaterThan(10)
    expect(keys.filter((k) => !/: 'grani:[a-z]+(-[a-z]+)*'$/.test(k))).toEqual([])
  })
})
