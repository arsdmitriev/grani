import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import UiSpinner from './UiSpinner.vue'

describe('UiSpinner', () => {
  it('The ring turns, at the size its host gives it.', () => {
    const w = mount(UiSpinner, { attrs: { class: 'h-4 w-4' } })
    expect(w.element.tagName.toLowerCase()).toBe('svg')
    expect(w.classes()).toEqual(expect.arrayContaining(['animate-spin', 'h-4']))
  })

  it('With a name it is a status with that name; without one it is hidden from a screen reader.', () => {
    const named = mount(UiSpinner, { attrs: { 'aria-label': 'Searching' } })
    expect(named.attributes('role')).toBe('status')
    expect(named.attributes('aria-label')).toBe('Searching')
    expect(named.attributes('aria-hidden')).toBeUndefined()
    const plain = mount(UiSpinner)
    expect(plain.attributes('aria-hidden')).toBe('true')
    expect(plain.attributes('role')).toBeUndefined()
  })

  it('aria-labelledby names it too, and the role follows the attribute when it changes', async () => {
    const byId = mount(UiSpinner, { attrs: { 'aria-labelledby': 'search-status' } })
    expect(byId.attributes('role')).toBe('status')
    const Host = defineComponent({
      props: { label: { type: String, default: undefined } },
      render() {
        return h(UiSpinner, { 'aria-label': this.label })
      },
    })
    const host = mount(Host, { props: { label: 'Searching' } })
    expect(host.find('svg').attributes('role')).toBe('status')
    await host.setProps({ label: undefined })
    expect(host.find('svg').attributes('role')).toBeUndefined()
    expect(host.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('carries the hook for the 16px default and no size class of its own', () => {
    const w = mount(UiSpinner)
    expect(w.classes()).toContain('ui-spinner')
    expect(w.classes().some((c) => /^[hw]-/.test(c))).toBe(false)
  })

  it('renders on the server without a host', async () => {
    const { renderToString } = await import('@vue/server-renderer')
    const { createSSRApp, h } = await import('vue')
    const html = await renderToString(createSSRApp({ render: () => h(UiSpinner) }))
    expect(html).toContain('animate-spin')
  })

  it('the 16px default steps aside for a size class, an important one too', () => {
    // UiIconButton and UiBadge size it with `!h-*`; the rule used to miss those.
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    const rule = css.match(/\.ui-spinner:where\(:not\(([^)]*)\)\)/)?.[1] ?? ''
    for (const hook of ["' h-'", "' size-'", "' !h-'", "' !size-'"])
      expect(rule).toContain(`[class*=${hook}]`)
  })
})

describe('UiSpinner — review follow-ups', () => {
  it("a caller's own role or aria-hidden attribute never overrides the computed one", () => {
    const named = mount(UiSpinner, { attrs: { 'aria-label': 'Loading', role: 'presentation' } })
    expect(named.attributes('role')).toBe('status')
    const plain = mount(UiSpinner, { attrs: { role: 'img', 'aria-hidden': 'false' } })
    expect(plain.attributes('aria-hidden')).toBe('true')
    expect(plain.attributes('role')).toBeUndefined()
  })

  it('keeps the caller class and other attributes on the ring', () => {
    const w = mount(UiSpinner, { attrs: { class: 'h-6 w-6', 'data-testid': 'busy' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['ui-spinner', 'animate-spin', 'h-6']))
    expect(w.attributes('data-testid')).toBe('busy')
  })

  it('aria-label as an attribute names it; ariaLabel as a prop does nothing', () => {
    expect(mount(UiSpinner, { attrs: { 'aria-label': 'Loading' } }).attributes('role')).toBe(
      'status',
    )
    const camel = mount(UiSpinner, { attrs: { ariaLabel: 'Loading' } })
    expect(camel.attributes('role')).toBeUndefined()
    expect(camel.attributes('aria-hidden')).toBe('true')
  })

  it('an empty aria-label leaves it decoration', () => {
    const w = mount(UiSpinner, { attrs: { 'aria-label': '' } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('the 16px default counts a height class only, not a width or a prefixed one', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    const rule = css.match(/\.ui-spinner:where\(:not\(([^)]*)\)\)/)?.[1] ?? ''
    expect(rule).not.toMatch(/' !?w-'/)
    expect(css).toMatch(/A width alone does not count/)
  })
})

describe('UiSpinner — review follow-ups, second pass', () => {
  it('It keeps turning, slower, when the system asks for reduced motion.', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    // The keep rule itself: the spin is on it, it turns once in 1.6 s, and it never stops.
    const keep = reduce.match(/\.animate-spin,\s*\[data-motion-keep\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(keep).toMatch(/animation-duration:\s*1\.6s\s*!important/)
    expect(keep).toMatch(/animation-iteration-count:\s*infinite\s*!important/)
  })

  it('the reduced-motion floor and its keep list share the base layer', () => {
    // An `!important` in a layer outweighs one outside layers: a keep rule left unlayered
    // would lose to the floor, and the spinner would freeze.
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    const layer = css.match(
      /@layer base \{\s*@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n {2}\}\n\}/,
    )
    expect(layer).not.toBeNull()
    expect(layer![1]).toMatch(/\*,\s*\*::before,\s*\*::after \{/)
    expect(layer![1]).toMatch(/\[data-motion-keep\] \{/)
    expect(layer![1]).toMatch(/\.ui-shake \{/)
    expect(css.match(/@media \(prefers-reduced-motion: reduce\)/g)).toHaveLength(1)
  })
})

describe('UiSpinner — grani marks its own elements', () => {
  it('the spinner carries data-grani, as every element grani draws does', () => {
    expect(mount(UiSpinner).attributes('data-grani')).toBe('')
  })
})
