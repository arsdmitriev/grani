import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import UiButton from '../components/UiButton.vue'
import UiInput from '../components/UiInput.vue'
import UiTableToolbar from '../components/UiTableToolbar.vue'
import { createGrani } from '../plugin'
import { withGrani } from '../test/harness'

describe("the app's size", () => {
  it('a control with no size stands on sm until the app says otherwise', () => {
    expect(mount(UiButton).classes()).toContain('h-9')
    expect(mount(UiButton, { global: { plugins: withGrani() } }).classes()).toContain('h-9')
  })

  it('the app step reaches every control without a size of its own', () => {
    const global = { plugins: withGrani({ size: 'xs' }) }
    expect(mount(UiButton, { global }).classes()).toContain('h-7')
    expect(mount(UiInput, { props: { modelValue: '' }, global }).html()).toContain('h-7')
  })

  it('a size given to one control still wins over the app step', () => {
    const global = { plugins: withGrani({ size: 'xs' }) }
    expect(mount(UiButton, { props: { size: 'md' }, global }).classes()).toContain('h-11')
  })

  it('setSize repaints what is already on the page', async () => {
    const grani = createGrani()
    const w = mount(UiButton, { global: { plugins: [grani] } })
    grani.setSize('md')
    await nextTick()
    expect(w.classes()).toContain('h-11')
  })

  it('a toolbar hands the app step to its slots, so the row keeps one step', () => {
    let given: string | undefined
    mount(UiTableToolbar, {
      props: { search: '' },
      slots: {
        start: (p: { size: string }) => {
          given = p.size
          return h('span')
        },
      },
      global: { plugins: withGrani({ size: 'xs' }) },
    })
    expect(given).toBe('xs')
  })
})

describe("the app's size off the ladder", () => {
  const said = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[grani]'))

  it('is named in development with the steps there are, and every control stands on sm', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const grani = createGrani({ size: 'huge' as never })
      expect(said(warn)).toHaveLength(1)
      expect(said(warn)[0]).toContain('"huge"')
      expect(said(warn)[0]).toContain('xs, sm or md')
      expect(grani.size.value).toBe('sm')
      expect(mount(UiButton, { global: { plugins: [grani] } }).classes()).toContain('h-9')
      grani.setSize('lg' as never)
      expect(grani.size.value).toBe('sm')
      expect(said(warn)[1]).toContain('setSize')
    } finally {
      warn.mockRestore()
    }
  })

  it('is said nothing of in production, and still stands on sm', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(createGrani({ size: 'huge' as never }).size.value).toBe('sm')
      expect(said(warn)).toEqual([])
    } finally {
      warn.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})
