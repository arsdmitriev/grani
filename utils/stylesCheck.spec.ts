import { afterEach, describe, expect, it, vi } from 'vitest'
import { NO_CLASSES, NO_STYLESHEET, stylesMissing } from './stylesCheck'

const sheet = (css: string) => {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
}

describe('stylesMissing — what keeps grani from its styles', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('a page with no stylesheet at all is not judged', () => {
    expect(stylesMissing(document)).toBeNull()
  })

  it("the app's stylesheet without grani's names the import", () => {
    sheet('body { margin: 0 }')
    expect(stylesMissing(document)).toBe(NO_STYLESHEET)
  })

  it("grani's style.css without its components' classes says Tailwind did not read them", () => {
    sheet(':root { --grani-styles: all }')
    expect(stylesMissing(document)).toBe(NO_CLASSES)
  })

  // Seen by a developer who left out `@import 'tailwindcss'` or the Vite plugin: a warning that
  // named only `prefix()` sent them looking for a line they never wrote.
  it('names the usual causes of that: no Tailwind import, no Tailwind plugin, and prefix()', () => {
    expect(NO_CLASSES).toContain("`@import 'tailwindcss';`")
    expect(NO_CLASSES).toContain('`@tailwindcss/vite`')
    expect(NO_CLASSES).toContain('`prefix()`')
  })

  it('style.css with its classes, or theme.css alone, is enough', () => {
    sheet(':root { --grani-styles: all } .z-toast { z-index: 80 }')
    expect(stylesMissing(document)).toBeNull()
    document.head.innerHTML = ''
    sheet(':root { --grani-styles: theme }')
    expect(stylesMissing(document)).toBeNull()
  })

  it('leaves nothing of its own in the page', () => {
    sheet(':root { --grani-styles: all }')
    stylesMissing(document)
    expect(document.body.children).toHaveLength(0)
  })
})

describe('checkStyles — once per page, in development, in a browser', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
    document.head.innerHTML = ''
  })

  const frame = () => new Promise((done) => requestAnimationFrame(() => done(null)))

  it('warns once, however many apps install grani', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    sheet('body { margin: 0 }')
    const { checkStyles } = await import('./stylesCheck')
    checkStyles()
    checkStyles()
    await frame()
    await frame()
    expect(warn.mock.calls).toEqual([[NO_STYLESHEET]])
  })

  // A diagnostic never breaks the app it diagnoses: a DOM with no animation frames (jsdom as some
  // test runners set it up) runs it on a timer.
  it('never throws out of app.use(), with no requestAnimationFrame either', async () => {
    vi.stubGlobal('requestAnimationFrame', undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    sheet('body { margin: 0 }')
    const { checkStyles } = await import('./stylesCheck')
    expect(() => checkStyles()).not.toThrow()
    await new Promise((done) => setTimeout(done, 20))
    expect(warn.mock.calls).toEqual([[NO_STYLESHEET]])
  })

  it('says nothing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    sheet('body { margin: 0 }')
    const { checkStyles } = await import('./stylesCheck')
    checkStyles()
    await frame()
    await frame()
    expect(warn).not.toHaveBeenCalled()
  })
})
