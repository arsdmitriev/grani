import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every focus ring grani draws reads one of the ring tokens, so the app's choice of mark
// (`createGrani({ focus })`, or its own values of the tokens) reaches all of them: a ring written
// out in a component would stay quiet when the app asked for the strong one.
const root = resolve(__dirname, '..')
const stylesheet = (name: string) =>
  readFileSync(join(root, 'assets/css', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const RINGS = [
  '--ui-ring',
  '--ui-ring-inset',
  '--ui-ring-danger',
  '--ui-ring-invalid',
  '--ui-ring-selected',
]

/** Every innermost rule of a stylesheet: its selector and its declarations. */
const rules = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]! }))

const sources = ['components', 'composables', 'utils'].flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
    .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), 'utf8') })),
)

describe('the focus ring', () => {
  it("every focus rule of grani's stylesheets draws a ring token, or none", () => {
    const seen: string[] = []
    const off: string[] = []
    for (const name of ['tokens.css', 'base.css'])
      for (const { selector, body } of rules(stylesheet(name))) {
        if (!/:focus/.test(selector)) continue
        const shadow = /box-shadow:\s*([^;]+);/.exec(body)?.[1]?.trim()
        if (shadow === undefined) continue
        seen.push(selector)
        if (shadow !== 'none' && !shadow.startsWith('var(--ui-ring'))
          off.push(`${name}: ${selector}`)
      }
    expect(seen.length).toBeGreaterThan(10)
    expect(off).toEqual([])
  })

  it('every focus shadow a component writes in a class reads a ring token', () => {
    const marks = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/[^\s'"`]*focus[^\s'"`]*(?:shadow-[[(]|\[box-shadow:)[^\s'"`]*/g)].map(
        (m) => ({ file, mark: m[0] }),
      ),
    )
    expect(marks.length).toBeGreaterThan(5)
    expect(
      marks.filter((m) => !m.mark.includes('--ui-ring')).map((m) => `${m.file}: ${m.mark}`),
    ).toEqual([])
  })

  it('the quiet ring is set for both themes, and the strong one replaces every ring', () => {
    const css = stylesheet('tokens.css')
    const declared = (selector: RegExp) => {
      const rule = rules(css).find((r) => selector.test(r.selector))
      return RINGS.filter((t) => new RegExp(`${t}:`).test(rule?.body ?? ''))
    }
    expect(declared(/^:root$/)).toEqual(RINGS)
    expect(declared(/^\.dark$/)).toEqual(RINGS)
    expect(declared(/\[data-grani-focus='strong'\]/)).toEqual(RINGS)
  })

  // The contrast check measures what the stylesheet draws: the quiet halo at the share of the ring
  // color the token mixes in, and every ink the strong ring draws against the surface.
  it('the contrast check measures the rings the stylesheet draws', () => {
    const css = stylesheet('tokens.css')
    const gate = readFileSync(join(root, 'scripts/contrast.mjs'), 'utf8')
    const body = (selector: RegExp) => rules(css).find((r) => selector.test(r.selector))!.body
    // The quiet halo, in either theme: the color and the share the gate composites over the surface.
    for (const theme of [/^:root$/, /^\.dark$/]) {
      const quiet =
        /--ui-ring:\s*0 0 0 3px color-mix\(in oklab, var\((--[\w-]+)\) (\d+)%, transparent\)/.exec(
          body(theme),
        )
      expect(quiet, String(theme)).not.toBeNull()
      expect(gate).toContain(`over:${quiet![1]},${quiet![2]},--color-surface`)
    }
    // Every ink of the strong rings: each against the surface; the surface itself, the gap and the
    // inner band of an inset ring, against the brand fill it meets on a primary button.
    const inks = new Set(
      [...body(/\[data-grani-focus='strong'\]/).matchAll(/var\((--color-[\w-]+)\)/g)].map(
        (m) => m[1]!,
      ),
    )
    expect(inks.size).toBeGreaterThanOrEqual(3)
    for (const ink of inks)
      if (ink === '--color-surface')
        expect(gate).toMatch(/\['--color-brand-solid', '--color-surface', 3\.0,/)
      else
        expect(gate).toMatch(
          new RegExp(`\\['${ink}', '--color-surface', 3\\.0, 'strong focus ring`),
        )
  })
})
