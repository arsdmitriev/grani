import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { useOverlayStack } from '../composables/useOverlayStack'

// The paint order of the layers, bottom to top: the sticky header of a table, a window or a drawer
// (and each layer opened over it), a tooltip, a toast. The named steps live in tokens.css; the
// stack gives a window its step at run time. A window under a sticky header, or a tooltip under
// the drawer it hints in, is invisible to every spec that reads classes, so the numbers are read here.
const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
const step = (name: string) => {
  const m = css.match(new RegExp(`@utility z-${name} \\{\\s*z-index: (\\d+);`))
  if (!m) throw new Error(`no z-${name} in tokens.css`)
  return Number(m[1])
}

describe('the layer ladder', () => {
  it('sticky < window < tooltip < toast in the named steps', () => {
    expect(step('sticky')).toBeLessThan(step('modal'))
    expect(step('modal')).toBeLessThan(step('tooltip'))
    expect(step('tooltip')).toBeLessThan(step('toast'))
  })

  it('a window takes the window step, each layer over it one more, all below a tooltip and a toast', () => {
    const overlays = useOverlayStack()
    // Five deep: a drawer, a select in it, a confirm from it, a menu, a date panel.
    const layers = Array.from({ length: 5 }, () => overlays.acquire())
    const z = layers.map((t) => Number(overlays.zIndex(t)))
    expect(z[0]).toBe(step('modal'))
    for (let i = 1; i < z.length; i++) expect(z[i]).toBe(z[i - 1]! + 1)
    expect(z[0]).toBeGreaterThan(step('sticky'))
    expect(z.at(-1)).toBeLessThan(step('tooltip'))
    expect(step('tooltip')).toBeLessThan(step('toast'))
    layers.forEach((t) => overlays.release(t))
  })
})
