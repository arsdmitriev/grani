import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, type Component } from 'vue'
import { createScope } from '../composables/useShared'

// Two copies of grani on one page, simulated: the module graph loaded twice over one Vue
// (`vi.resetModules()` reloads the sources, Vue stays the app's), or the key helper called with
// another version string.

const COPIES = Symbol.for('grani:copies@1')
const g = globalThis as typeof globalThis & {
  [COPIES]?: { versions: Set<string>; warned: Set<string> }
}

const loadCopy = async () => {
  vi.resetModules()
  const [key, field, input, plugin, useUiT] = await Promise.all([
    import('../utils/key'),
    import('../components/UiField.vue'),
    import('../components/UiInput.vue'),
    import('../plugin'),
    import('../composables/useUiT'),
  ])
  return {
    key,
    UiField: field.default as Component,
    UiInput: input.default as Component,
    createGrani: plugin.createGrani,
    useUiT: useUiT.useUiT,
  }
}

describe('two copies of grani', () => {
  let warn: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    g[COPIES] = { versions: new Set(), warned: new Set() }
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => warn.mockRestore())

  it('keys of one version are the same symbol in both copies', async () => {
    const a = await loadCopy()
    const b = await loadCopy()
    expect(a.key).not.toBe(b.key)
    expect(a.key.graniKey('field')).toBe(b.key.graniKey('field'))
    expect(a.key.graniKey('scope')).toBe(b.key.graniKey('scope'))
  })

  it('the line is the major and the minor, before and after 1.0; a patch shares it', async () => {
    const { graniKey, versionLine } = await import('../utils/key')
    expect(graniKey('scope', '0.1.0')).not.toBe(graniKey('scope', '0.2.0'))
    expect(graniKey('scope', '0.1.0')).toBe(graniKey('scope', '0.1.7'))
    expect(graniKey('scope', '1.2.0')).toBe(graniKey('scope', '1.2.9'))
    expect(graniKey('scope', '1.1.0')).not.toBe(graniKey('scope', '1.0.0'))
    expect(graniKey('scope', '1.2.0')).not.toBe(graniKey('scope', '2.0.0'))
    expect(graniKey('scope', '0.1.0')).not.toBe(graniKey('field', '0.1.0'))
    expect(versionLine('0.1.0')).toBe('0.1')
    expect(versionLine('2.3.1-beta.1')).toBe('2.3')
  })

  it('the key carries the version of the package', async () => {
    const pkg = (await import('../package.json')).default
    const { graniKey, versionLine } = await import('../utils/key')
    expect(versionLine()).toBe(versionLine(pkg.version))
    expect(graniKey('scope').description).toBe(`grani@${versionLine(pkg.version)}:scope`)
  })

  it('the warning names both versions once, and none comes for the same one', async () => {
    const { copiesWarning, registerCopy } = await import('../utils/key')
    g[COPIES] = { versions: new Set(), warned: new Set() }
    registerCopy('0.1.0')
    registerCopy('0.1.0')
    expect(copiesWarning()).toBeNull()
    registerCopy('0.2.0')
    const text = copiesWarning()
    expect(text).toContain('0.1.0')
    expect(text).toContain('0.2.0')
    expect(text).toMatch(/dedupe/i)
    expect(text).toContain('share no settings')
    g[COPIES] = { versions: new Set(), warned: new Set() }
    registerCopy('1.0.0')
    registerCopy('1.1.0')
    expect(copiesWarning()).toContain('share no settings')
    expect(copiesWarning()).toBeNull()
  })

  // A copy that renders a component: its first use of a scope reads the page's record.
  const render = (copy: Awaited<ReturnType<typeof loadCopy>>) =>
    mount(
      defineComponent({
        setup() {
          const { locale } = copy.useUiT()
          return () => h('p', locale.value)
        },
      }),
    )

  it('a copy of another version on the page warns once in development', async () => {
    const a = await loadCopy()
    render(a)
    expect(warn).not.toHaveBeenCalled()
    g[COPIES]!.versions.add('0.999.0')
    const b = await loadCopy()
    render(b)
    render(b)
    render(a)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]![0])).toContain('0.999.0')
  })

  it('a second copy of the same version stays silent', async () => {
    render(await loadCopy())
    render(await loadCopy())
    expect(warn).not.toHaveBeenCalled()
    expect(g[COPIES]!.versions.size).toBe(1)
  })

  it('a field of one copy labels the control of another of the same version', async () => {
    const a = await loadCopy()
    const b = await loadCopy()
    const w = mount(a.UiField, {
      props: { label: 'Name', error: 'Required' },
      slots: { default: () => h(b.UiInput, { modelValue: '' }) },
    })
    const id = w.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(w.find('label').attributes('for')).toBe(id)
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })

  it("a component of one copy reads the settings of the other copy's plugin", async () => {
    const a = await loadCopy()
    const b = await loadCopy()
    const Probe = defineComponent({
      setup() {
        const { locale } = b.useUiT()
        return () => h('p', locale.value)
      },
    })
    const w = mount(Probe, { global: { plugins: [a.createGrani({ locale: 'ru' })] } })
    expect(w.text()).toBe('ru')
  })
})

describe('what copies of grani share', () => {
  const root = resolve(__dirname, '..')
  const sources = ['components', 'composables', 'utils'].flatMap((dir) =>
    readdirSync(join(root, dir))
      .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
      .map((f) => ({ file: `${dir}/${f}`, text: readFileSync(join(root, dir, f), 'utf8') })),
  )

  // A symbol every line reads (the page's layers, its scroll lock, its copies) holds a shape every
  // version agrees on. Its name carries the number of that shape: a new shape is a new number, and
  // copies on two numbers keep two of it apart instead of reading one they do not know.
  it('a symbol every line reads carries the number of its shape', () => {
    const names = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/Symbol\.for\('([^']*)'\)/g)].map((m) => `${file}: ${m[1]}`),
    )
    expect(names.length).toBeGreaterThanOrEqual(3)
    expect(names.filter((n) => !/: grani:[a-z]+(-[a-z]+)*@\d+$/.test(n))).toEqual([])
  })

  // Copies of one minor line share one scope: a field added in a patch is missing from the scope an
  // older copy of the line built. A change of this list waits for the next minor (utils/key).
  it('the scope copies of one line share keeps its fields', () => {
    expect(Object.keys(createScope()).sort()).toEqual([
      'currency',
      'ends',
      'installs',
      'locale',
      'size',
      'storage',
      'store',
      'teleport',
      'timeZone',
      'translate',
    ])
  })
})
