import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UiLink from './UiLink.vue'

describe('UiLink', () => {
  it('renders an anchor with the address and the text', () => {
    const w = mount(UiLink, { props: { to: '/records/7' }, slots: { default: 'Open' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/records/7')
    expect(w.text()).toBe('Open')
  })

  it('is underlined at rest: a touch screen has no hover', () => {
    expect(mount(UiLink, { props: { to: '/' } }).classes()).toContain('underline')
  })

  it('an external address opens in a new tab, safely, and says so to a screen reader', () => {
    const w = mount(UiLink, { props: { to: 'https://example.com' }, slots: { default: 'Docs' } })
    expect(w.attributes('target')).toBe('_blank')
    expect(w.attributes('rel')).toBe('noopener noreferrer')
    expect(w.find('.sr-only').text()).toBe('opens in a new tab')
  })

  it('an internal route stays in the tab', () => {
    const w = mount(UiLink, { props: { to: '/records' } })
    expect(w.attributes('target')).toBeUndefined()
    expect(w.find('.sr-only').exists()).toBe(false)
  })

  it('tone: brand color by default, neutral inherits the muted text', () => {
    expect(mount(UiLink, { props: { to: '/' } }).classes()).toContain('text-brand')
    expect(mount(UiLink, { props: { to: '/', tone: 'neutral' } }).classes()).toContain(
      'text-fg-muted',
    )
  })

  it('a line in the link ink at rest, the hover ink on hover, and the offset scales with the text', () => {
    const brand = mount(UiLink, { props: { to: '/' } }).classes()
    expect(brand).toEqual(
      expect.arrayContaining([
        'decoration-1',
        'underline-offset-[0.35em]',
        'decoration-brand',
        'hover:decoration-brand-hover',
        'transition-[color,text-decoration-color]',
      ]),
    )
    const neutral = mount(UiLink, { props: { to: '/', tone: 'neutral' } }).classes()
    expect(neutral).toEqual(expect.arrayContaining(['decoration-fg-muted', 'hover:decoration-fg']))
    // Signal blue takes the plate ink: the base info token is too faint for text on dark.
    const info = mount(UiLink, { props: { to: '/', tone: 'info' } }).classes()
    expect(info).toEqual(
      expect.arrayContaining(['text-info-subtle-fg', 'decoration-info-subtle-fg']),
    )
    expect(info).not.toContain('text-info')
  })

  it('rel for SEO replaces the default noreferrer; noopener stays on a new tab', () => {
    const ext = mount(UiLink, {
      props: { to: 'https://partner.example', rel: 'nofollow sponsored' },
    })
    expect(ext.attributes('rel')).toBe('noopener nofollow sponsored')
    expect(ext.attributes('target')).toBe('_blank')
    const internal = mount(UiLink, { props: { to: '/records', rel: 'nofollow' } })
    expect(internal.attributes('rel')).toBe('nofollow')
    expect(internal.attributes('target')).toBeUndefined()
  })

  it('target overrides the default, and the screen-reader notice follows the real target', () => {
    const same = mount(UiLink, { props: { to: 'https://example.com', target: '_self' } })
    // An explicit _self is kept: it beats a <base target> on the page.
    expect(same.attributes('target')).toBe('_self')
    expect(same.attributes('rel')).toBe('noreferrer')
    expect(same.find('.sr-only').exists()).toBe(false)
    const tab = mount(UiLink, { props: { to: '/docs', target: '_blank' } })
    expect(tab.attributes('target')).toBe('_blank')
    expect(tab.attributes('rel')).toBe('noopener')
    expect(tab.find('.sr-only').text()).toBe('opens in a new tab')
  })

  it('a duplicate token is said once', () => {
    const w = mount(UiLink, { props: { to: 'https://example.com', rel: 'noopener  ugc' } })
    expect(w.attributes('rel')).toBe('noopener ugc')
  })

  it('native link attributes reach the anchor as they are: hreflang, lang, download, title', () => {
    const w = mount(UiLink, {
      props: { to: '/ru/' },
      attrs: { hreflang: 'ru', lang: 'ru', download: '', title: 'Russian version' },
    })
    expect(w.attributes('hreflang')).toBe('ru')
    expect(w.attributes('lang')).toBe('ru')
    expect(w.attributes('download')).toBe('')
    expect(w.attributes('title')).toBe('Russian version')
  })

  it('the name keeps a space before the new-tab notice', () => {
    // The notice stands apart from the text, or a screen reader reads "Docsopens in a new tab".
    const w = mount(UiLink, { props: { to: 'https://example.com' }, slots: { default: 'Docs' } })
    expect(w.text()).toBe('Docs opens in a new tab')
  })

  it('a protocol-relative address is external; mailto and tel stay in the tab', () => {
    const cdn = mount(UiLink, { props: { to: '//cdn.example.com/a' } })
    expect(cdn.attributes('target')).toBe('_blank')
    for (const to of ['mailto:name@example.com', 'tel:+442079460958']) {
      const w = mount(UiLink, { props: { to } })
      expect(w.attributes('target'), to).toBeUndefined()
      expect(w.find('.sr-only').exists(), to).toBe(false)
    }
  })

  it('warns in dev on an empty or blank address', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiLink, { props: { to: '  ' }, slots: { default: 'Home' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no address'))
    warn.mockClear()
    mount(UiLink, { props: { to: '/records' }, slots: { default: 'Records' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a blank rel keeps the default noreferrer on an external link', () => {
    for (const rel of ['', '   ']) {
      const w = mount(UiLink, { props: { to: 'https://example.com', rel } })
      expect(w.attributes('rel'), JSON.stringify(rel)).toBe('noopener noreferrer')
    }
  })
})

describe('UiLink — the eye sees a new tab', () => {
  it('an external link draws an arrow after the text, an internal one does not', () => {
    const ext = mount(UiLink, {
      props: { to: 'https://help.example.com' },
      slots: { default: 'Help' },
    })
    expect(ext.find('svg').attributes('aria-hidden')).toBe('true')
    const own = mount(UiLink, {
      props: { to: '/components/UiCard' },
      slots: { default: 'Archive' },
    })
    expect(own.find('svg').exists()).toBe(false)
  })
})

describe('UiLink — review follow-ups', () => {
  it('draws no external arrow for a mailto, tel or same-tab address', () => {
    for (const to of ['mailto:hi@example.com', 'tel:+10000000000', '/records']) {
      expect(mount(UiLink, { props: { to } }).find('svg').exists(), to).toBe(false)
    }
    expect(
      mount(UiLink, { props: { to: 'https://example.com' } })
        .find('svg')
        .exists(),
    ).toBe(true)
  })

  it('a native aria-current reaches the anchor like hreflang and title', () => {
    const w = mount(UiLink, { props: { to: '/records' }, attrs: { 'aria-current': 'page' } })
    expect(w.attributes('aria-current')).toBe('page')
  })

  // An address comes from the app's data (a tenant's menu item without one): the types ask for a
  // string, the data does not know it. No address is no link, the text shows, as for a refused one.
  it('an address the data left out shows the text with no link, and warns once in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const to of [undefined, null, '', '   ']) {
      warn.mockClear()
      const w = mount(UiLink, {
        props: { to: to as unknown as string },
        slots: { default: 'Reports' },
      })
      expect(w.element.tagName, String(to)).toBe('SPAN')
      expect(w.attributes('href'), String(to)).toBeUndefined()
      expect(w.text(), String(to)).toBe('Reports')
      // Vue's own warning about the missing prop may come too; grani's is one.
      const ours = warn.mock.calls.filter(([m]) => String(m).startsWith('[grani]'))
      expect(ours, String(to)).toEqual([[expect.stringContaining('no address')]])
    }
    warn.mockRestore()
  })
})

describe('UiLink — nowrap', () => {
  it('stays on one line always: a long link is written shorter, not broken', () => {
    expect(
      mount(UiLink, { props: { to: '/a' }, slots: { default: 'Records' } }).classes(),
    ).toContain('whitespace-nowrap')
    // `wrap` is no prop: passed anyway, it is an attribute and the link still keeps one line.
    const w = mount(UiLink, {
      props: { to: '/a' },
      attrs: { wrap: '' },
      slots: { default: 'the rules written down in the icon guide' },
    })
    expect(w.classes()).toContain('whitespace-nowrap')
  })
})

describe('UiLink — review follow-ups', () => {
  it('a refused or missing address reads as the words around it: no line, no ink, no hover', () => {
    for (const to of ['javascript:alert(1)', '']) {
      const w = mount(UiLink, { props: { to }, slots: { default: 'Reports' } })
      expect(w.classes(), to).not.toContain('underline')
      expect(
        w.classes().filter((c) => /^(text-|hover:|decoration-)/.test(c)),
        to,
      ).toEqual([])
    }
  })
})
