import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PATTERNS } from '../scripts/reference/patterns'
import { momentSlug } from '../scripts/reference/moments'
import * as text from '../scripts/reference/text.mjs'

// grani-ui/test is read by an app's own suite: its words must be the rules' words, and it may look
// only at what any screen built on grani shows (the focus, ARIA, styles, the network), never at
// grani's insides, which an app does not see and grani may change.
const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8')
const table = source.slice(source.indexOf('const CHECKED = {'), source.indexOf('} as const'))
const checked = [...table.matchAll(/(\w+): \{ title: '([^']+)', chapter: '([^']+)' \}/g)].map(
  ([, id, title, chapter]) => ({ id: id!, title: title!, chapter: chapter! }),
)

describe('grani-ui/test', () => {
  it('names five patterns, each by the title and the chapter of its rule', () => {
    expect(checked.map((c) => c.id)).toEqual([
      'focusStart',
      'focusBack',
      'focusInvalid',
      'lateDropped',
      'noJolt',
    ])
    for (const c of checked) {
      const rule = PATTERNS[c.id as keyof typeof PATTERNS]
      if (!rule) throw new Error(`${c.id}: no rule of that id`)
      expect(c.title, c.id).toBe(rule.title)
      expect(c.chapter, c.id).toBe(momentSlug(rule.moment))
    }
  })

  it('is described in the package texts as it is: each check, its pattern and its options', () => {
    const { TEST_CHECKS } = text as {
      TEST_CHECKS: { name: string; rule: string; options: string }[]
    }
    const exported = [
      ...source.matchAll(
        /^export async function (\w+)\(page: Page, options: (\w+)\) \{\n {2}await step\('(\w+)'/gm,
      ),
    ].map(([, name, type, rule]) => {
      const body = source.slice(source.indexOf(`export interface ${type!} {`))
      const fields = [...body.slice(0, body.indexOf('\n}')).matchAll(/^ {2}(\w+)\??:/gm)]
      return { name: name!, rule: rule!, options: `{ ${fields.map((f) => f[1]).join(', ')} }` }
    })
    expect(exported).toHaveLength(5)
    expect(TEST_CHECKS.map(({ name, rule, options }) => ({ name, rule, options }))).toEqual(
      exported,
    )
  })

  it("imports Playwright alone and reads none of grani's insides", () => {
    const imports = [...source.matchAll(/^import [^']*? from '([^']+)'/gm)].map(([, from]) => from)
    expect(imports).toEqual(['@playwright/test'])
    for (const inside of ['data-grani', 'data-skeleton', 'data-ui', '.ui-', 'opacity-60'])
      expect(source, inside).not.toContain(inside)
  })
})
