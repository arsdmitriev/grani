import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import UiButton from './UiButton.vue'
import UiLink from './UiLink.vue'
import UiListItem from './UiListItem.vue'
import UiAppShell from './UiAppShell.vue'
import { Inbox } from '@lucide/vue'
import { RouteLink } from '../utils/routeLink'
import { opensElsewhere } from '../utils/link'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createGrani } from '../plugin'
import { defineComponent } from 'vue'

// The three link components resolve an address alike (utils/link): a table of cases, one answer.
const CASES: { to: string; target?: '_blank' | '_self'; rel?: string; want: [string?, string?] }[] =
  [
    { to: 'https://example.com', want: ['_blank', 'noopener noreferrer'] },
    { to: '  https://example.com', want: ['_blank', 'noopener noreferrer'] },
    { to: 'https://example.com', target: '_self', want: ['_self', 'noreferrer'] },
    { to: 'https://example.com', rel: 'sponsored', want: ['_blank', 'noopener sponsored'] },
    { to: '/docs', target: '_blank', want: ['_blank', 'noopener'] },
    { to: '/docs', want: [undefined, undefined] },
    { to: 'mailto:team@example.com', want: [undefined, undefined] },
  ]
const render = {
  UiLink: (p: object) => mount(UiLink, { props: p as never, slots: { default: 'Docs' } }),
  UiButton: (p: object) => mount(UiButton, { props: p as never, slots: { default: 'Docs' } }),
  UiListItem: (p: object) => mount(UiListItem, { props: { title: 'Docs', ...p } as never }),
}

describe('link canon — UiLink, UiButton and UiListItem', () => {
  for (const [name, make] of Object.entries(render))
    it(`${name}: rel and target resolve as the shared table says`, () => {
      for (const { to, target, rel, want } of CASES) {
        const a = make({ to, target, rel })
        const label = `${name} ${to} ${target ?? ''} ${rel ?? ''}`
        expect(a.attributes('target'), label).toBe(want[0])
        expect(a.attributes('rel'), label).toBe(want[1])
        // Said only where a new tab really opens.
        expect(a.find('.sr-only').exists(), label).toBe(want[0] === '_blank')
      }
    })

  for (const [name, make] of Object.entries(render))
    it(`${name}: a script-protocol address is not rendered as an href`, () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      for (const to of ['javascript:alert(1)', ' JavaScript:void(0)', 'data:text/html,x']) {
        const a = make({ to })
        expect(a.attributes('href'), `${name} ${to}`).toBeUndefined()
        expect(a.element.tagName, `${name} ${to}`).not.toBe('A')
      }
      warn.mockRestore()
    })

  it('a link inside a link row warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiListItem, {
      props: { to: '/a', title: 'Row' },
      slots: { default: () => h(UiLink, { to: '/b' }, () => 'inner') },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('inside a link'))
    warn.mockClear()
    mount(UiButton, {
      props: { to: '/a' },
      slots: { default: () => h(UiLink, { to: '/b' }, () => 'inner') },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('inside a link'))
    warn.mockClear()
    mount(UiListItem, {
      props: { title: 'Row' },
      slots: { default: () => h(UiLink, { to: '/b' }, () => 'fine') },
    })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a link without text warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiLink, { props: { to: '/a' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no text'))
    warn.mockRestore()
  })

  // Every component that draws an address through RouteLink refuses a script the same way: the
  // check stands in RouteLink itself, not in each caller, so a new caller cannot forget it.
  const UNSAFE = [
    'javascript:alert(1)',
    ' JavaScript:void(0)',
    'java\tscript:alert(1)',
    'data:text/html,x',
  ]

  it('RouteLink never renders a script-protocol address as an href', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const to of UNSAFE) {
      const w = mount(RouteLink, { props: { to }, slots: { default: () => 'Go' } })
      expect(w.find('a').exists(), to).toBe(false)
      expect(w.html(), to).not.toMatch(/href=/)
      expect(w.text(), to).toBe('Go')
    }
    warn.mockRestore()
  })

  // The address may come from data that holds none: every caller gets text, never `href=""` (the
  // page itself) and never a crash on a server.
  it('RouteLink with no address draws its text as a link that is not available', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const to of [undefined, null, '', '  ', 5, ['/x'], {}, true]) {
      const w = mount(RouteLink, { props: { to: to as never }, slots: { default: () => 'Go' } })
      expect(w.element.tagName, String(to)).toBe('SPAN')
      expect(w.attributes('aria-disabled'), String(to)).toBe('true')
      expect(w.html(), String(to)).not.toMatch(/href=/)
    }
    const shell = mount(UiAppShell, { props: { name: 'Acme', home: '', nav: [] } })
    expect(shell.find('a[href=""]').exists()).toBe(false)
    warn.mockRestore()
  })

  // Data holds what it holds: a number or an object in a menu's `to` draws as no address, in each
  // component that takes one, never a crash of the whole page.
  it('an address that is no string draws as no address in UiLink, UiButton and UiListItem', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const to of [5, ['/x'], {}, true, '  '])
      for (const [name, make] of Object.entries(render)) {
        const w = make({ to })
        expect(w.find('a').exists(), `${name} ${JSON.stringify(to)}`).toBe(false)
        expect(w.text(), `${name} ${JSON.stringify(to)}`).toContain('Docs')
        // No address is as no `to`: never a span that looks pressable and takes no press.
        expect(w.find('[role="link"][aria-disabled="true"]').exists(), name).toBe(false)
      }
    warn.mockRestore()
  })

  it('UiAppShell: a place or the link home with a script-protocol address is not a link', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const to of UNSAFE) {
      const w = mount(UiAppShell, {
        props: {
          brand: 'Grani',
          home: to,
          current: '/a',
          nav: [
            {
              items: [
                { to: '/a', label: 'Safe', icon: Inbox },
                { to, label: 'Evil', icon: Inbox },
              ],
            },
          ],
        },
      })
      const hrefs = w.findAll('a').map((a) => a.attributes('href') ?? '')
      expect(
        hrefs.filter((h) => /script|data:/i.test(h)),
        to,
      ).toEqual([])
      expect(w.text(), to).toContain('Evil')
      w.unmount()
    }
    warn.mockRestore()
  })

  // An `href` given as an attribute (a JSON of an action spread with `v-bind`) never stands in for
  // `to`: with a router, the anchor's own `href` would be laid over the one it computed.
  it("a caller's href attribute never replaces the checked address, with or without a router", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
    })
    await router.push('/')
    const AppLink = defineComponent({
      props: { to: { type: String, required: true } },
      setup:
        (p, { slots, attrs }) =>
        () =>
          h('a', { ...attrs, href: p.to }, slots.default?.()),
    })
    const plugins = [[router, createGrani()], [createGrani({ link: AppLink })], [createGrani()]]
    for (const set of plugins)
      for (const [name, make] of Object.entries({
        UiLink: () =>
          mount(UiLink, {
            props: { to: '/safe', href: 'javascript:alert(1)' } as never,
            slots: { default: 'Go' },
            global: { plugins: set as never },
          }),
        UiButton: () =>
          mount(UiButton, {
            props: { to: '/safe', href: 'javascript:alert(1)' } as never,
            slots: { default: 'Go' },
            global: { plugins: set as never },
          }),
        UiListItem: () =>
          mount(UiListItem, {
            props: { to: '/safe', title: 'Go', href: 'javascript:alert(1)' } as never,
            global: { plugins: set as never },
          }),
      })) {
        const html = make().html()
        expect(html, name).not.toMatch(/javascript:/)
        expect(html, name).toMatch(/href="\/safe"/)
      }
  })

  it('a refused place in the collapsed shell keeps its name, as a link that is not available', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(RouteLink, {
      props: { to: 'javascript:alert(1)' },
      attrs: { 'aria-label': 'Evil' },
      slots: { default: () => 'x' },
    })
    const span = w.find('span')
    expect(span.attributes('role')).toBe('link')
    expect(span.attributes('aria-disabled')).toBe('true')
    expect(span.attributes('aria-label')).toBe('Evil')
    warn.mockRestore()
  })

  it('the warning for a refused address is said once, not on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(RouteLink, {
      props: { to: 'javascript:alert(1)' },
      slots: { default: () => 'x' },
    })
    await w.setProps({ to: 'javascript:alert(1)' })
    w.vm.$forceUpdate()
    await w.vm.$nextTick()
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('refuses')).length).toBe(1)
    warn.mockRestore()
  })

  // The URL parser reads a backslash as a slash: `/\evil.example` is another site, not a path.
  it('an address that starts with a backslash is another site', () => {
    for (const to of ['/\\evil.example', '\\\\evil.example', '\\/evil.example'])
      expect(opensElsewhere(to), to).toBe(true)
    expect(opensElsewhere('/orders'), '/orders').toBe(false)
  })
})
