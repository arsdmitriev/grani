import fs from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REGISTRY } from '../registry'
import * as text from '../scripts/reference/text.mjs'

// The package's llms.txt is what an agent opens first, by its path in node_modules. A file of the
// whole reference (946 kB) failed the agent's first read and cost it a dozen reads in pieces, so
// the package gives a map small enough to read whole and a file per page beside it.
const { packageTexts, pages } = text as {
  packageTexts: () => Record<string, string>
  pages: { name: string; path: string }[]
}

describe("the package's llms.txt — a map an agent reads whole", () => {
  const files = packageTexts()
  const map = files['llms.txt']!

  it('is small enough to read in one go', () => {
    expect(map.length).toBeLessThan(64 * 1024)
  })

  it('names a file in the package for every component, and every file it names is there', () => {
    const named = [...map.matchAll(/\]\(node_modules\/grani-ui\/([^)]+)\)/g)].map((m) => m[1]!)
    for (const p of pages) expect(named).toContain(`llms${p.path}.md`)
    for (const f of named.filter((n) => n.startsWith('llms')))
      expect(Object.keys(files)).toContain(f)
    for (const f of named.filter((n) => !n.startsWith('llms')))
      expect(fs.existsSync(resolve(__dirname, '..', f)), f).toBe(true)
  })

  // The whole reference in one file is the site's: in the package it doubled the text and no agent
  // can read it whole.
  it('does not ship the whole reference twice', () => {
    expect(Object.keys(files)).not.toContain('llms-full.txt')
    expect(map).toContain('https://grani.arseni.work/llms-full.txt')
  })
})

// From the agents' exam: an answer painted its own markup with Tailwind's raw palette, which
// ignores the brand and the dark theme; and the rules the app holds named a screen the site has
// not got.
describe("the package's llms.txt — what the exam caught", () => {
  const files = packageTexts()
  const map = files['llms.txt']!

  it("says which colors the app's own markup takes, and that the raw palette is not one", () => {
    expect(map).toMatch(/`bg-surface`/)
    expect(map).toMatch(/`text-fg-muted`/)
    expect(map).toMatch(/never Tailwind's raw palette/)
  })

  it('names no screen the site has not got', () => {
    for (const [file, body] of Object.entries(files))
      expect(body, file).not.toMatch(/Records screen/)
  })
})

// An agent told to use only what the texts document finds nothing they do not name: a part drawn in
// its parent's examples, a helper the entry exports, a file of the package no line points at.
describe("the package's llms.txt — everything the package gives is findable", () => {
  const files = packageTexts()
  const map = files['llms.txt']!
  const all = Object.values(files).join('\n')

  it('names every value the entries export', () => {
    const surface = ['public-surface.txt', 'public-surface-test.txt']
      .map((f) => fs.readFileSync(resolve(__dirname, f), 'utf8'))
      .join('\n')
    const values = surface.split('\n').filter((l) => l && !l.startsWith('type '))
    expect(values.filter((name) => !new RegExp(`\\b${name}\\b`).test(all))).toEqual([])
  })

  it("names each part on its parent's line, where its API is", () => {
    for (const [part, entry] of Object.entries(REGISTRY)) {
      if (!entry.parent) continue
      const line = map.split('\n').find((l) => l.startsWith(`- [${entry.parent}](`))
      expect(line, part).toContain(part)
    }
  })

  it('points at every file of the package texts', () => {
    for (const f of Object.keys(files))
      if (f !== 'llms.txt') expect(map, f).toContain(`node_modules/grani-ui/${f}`)
  })
})

// llmstxt.org: the files an agent may open are Markdown links, `- [name](path): what it holds`, and
// what it may skip stands last, under `## Optional`. The guides that ship beside it are listed too:
// the brand, the settings, the server render are where an agent's question about them ends.
describe("the package's llms.txt — the llmstxt.org shape", () => {
  const map = packageTexts()['llms.txt']!
  const lines = map.split('\n')

  it('lists every component and every chapter as a link with what it holds', () => {
    const catalog = (heading: string) =>
      map
        .split(`\n## ${heading}\n`)[1]!
        .split('\n## ')[0]!
        .split('\n')
        .filter((l) => l.startsWith('- '))
    for (const heading of ['Components', 'Interaction patterns'])
      for (const line of catalog(heading))
        expect(line, line).toMatch(/^- \[[^\]]+\]\(node_modules\/grani-ui\/[^)]+\.md\): \S/)
  })

  it('opens with what screens built with grani do alike, and the patterns come before the components', () => {
    expect(
      map
        .split('\n')
        .slice(2, 4)
        .every((l) => l.startsWith('> ')),
    ).toBe(true)
    expect(map).toContain('> Screens built with grani behave alike')
    expect(map.indexOf('\n## Interaction patterns\n')).toBeGreaterThan(0)
    expect(map.indexOf('\n## Interaction patterns\n')).toBeLessThan(
      map.indexOf('\n## Components\n'),
    )
  })

  it('lists every guide the package ships, by its path', () => {
    const guides = fs.readdirSync(resolve(__dirname, '../docs/guides'))
    expect(guides.length).toBeGreaterThanOrEqual(8)
    for (const g of guides) expect(map, g).toContain(`](node_modules/grani-ui/docs/guides/${g})`)
  })

  it('ends on what an agent may skip, under ## Optional', () => {
    const last = lines.filter((l) => l.startsWith('## ')).at(-1)
    expect(last).toBe('## Optional')
    expect(map.split('\n## Optional\n')[1]).toContain('https://grani.arseni.work/llms-full.txt')
  })
})
