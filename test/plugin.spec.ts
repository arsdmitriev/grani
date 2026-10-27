import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, ssrContextKey } from 'vue'
import { createGrani, useGrani } from '../plugin'
import { sharedSnapshot, useShared } from '../composables/useShared'
import { useToast } from '../composables/useToast'
import { useUiT } from '../composables/useUiT'
import UiButton from '../components/UiButton.vue'
import UiConfirm from '../components/UiConfirm.vue'
import UiMoneyCell from '../components/UiMoneyCell.vue'
import UiToaster from '../components/UiToaster.vue'
import { RouteLink } from '../utils/routeLink'
import * as entry from '../index'

// What an app shows: a word of grani, a plural, a money amount and a button on the app's step.
const Page = defineComponent({
  setup: () => {
    const { t, tp, locale } = useUiT()
    return () =>
      h('div', [
        h('i', { 'data-locale': '' }, locale.value),
        h('b', { 'data-word': '' }, t('grani.button.loading')),
        h('s', { 'data-plural': '' }, tp('grani.select.selected', 3)),
        h('u', { 'data-badge': '' }, t('grani.badge.remove', { label: 'Ann' })),
        h(UiMoneyCell, { value: 1370 }),
        h(UiButton, () => 'Go'),
      ])
  },
})
const money = (w: ReturnType<typeof mount>) => w.find('[data-locale] ~ span span').text()
const height = (w: ReturnType<typeof mount>) =>
  w
    .find('button')
    .classes()
    .find((c) => /^h-\d+$/.test(c))

const GERMAN: Record<string, string> = { 'grani.button.loading': 'Bitte warten…' }

describe('createGrani', () => {
  // The mark is the page's: a focus ring is drawn by the page's stylesheet, on grani's elements in
  // every app on it and in the overlays it moves to the body.
  it("focus: 'strong' marks the page for the strong ring; without it the page stays quiet", () => {
    const html = document.documentElement
    html.removeAttribute('data-grani-focus')
    createApp({ render: () => null }).use(createGrani())
    createApp({ render: () => null }).use(createGrani({ focus: 'quiet' }))
    expect(html.hasAttribute('data-grani-focus')).toBe(false)
    const strong = createApp({ render: () => null }).use(createGrani({ focus: 'strong' }))
    expect(html.getAttribute('data-grani-focus')).toBe('strong')
    strong.mount(document.body.appendChild(document.createElement('div')))
    strong.unmount()
    expect(html.hasAttribute('data-grani-focus')).toBe(false)
  })

  it('the strong mark leaves the page with the last app that asked for it', () => {
    const html = document.documentElement
    html.removeAttribute('data-grani-focus')
    const host = () => document.body.appendChild(document.createElement('div'))
    const one = createApp({ render: () => null }).use(createGrani({ focus: 'strong' }))
    const two = createApp({ render: () => null }).use(createGrani({ focus: 'strong' }))
    one.mount(host())
    two.mount(host())
    one.unmount()
    expect(html.getAttribute('data-grani-focus')).toBe('strong')
    two.unmount()
    expect(html.hasAttribute('data-grani-focus')).toBe(false)
  })

  it('two apps with their own locale and size render apart, and a change in one leaves the other', async () => {
    const one = createGrani({ locale: 'de-DE', size: 'md' })
    const a = mount(Page, { global: { plugins: [one] } })
    const b = mount(Page, { global: { plugins: [createGrani({ locale: 'en' })] } })
    expect(a.find('[data-locale]').text()).toBe('de-DE')
    expect(b.find('[data-locale]').text()).toBe('en')
    expect(money(a)).toBe('1.370,00')
    expect(money(b)).toBe('1,370.00')
    expect(height(a)).toBe('h-11')
    expect(height(b)).toBe('h-9')
    one.setSize('xs')
    await nextTick()
    expect(height(a)).toBe('h-7')
    expect(height(b)).toBe('h-9')
  })

  it('a reactive locale switches the text and the number format of what is on the page', async () => {
    const locale = ref('en')
    const translate = (key: string) => (locale.value === 'de-DE' ? GERMAN[key] : undefined)
    const w = mount(Page, { global: { plugins: [createGrani({ locale, translate })] } })
    expect(w.find('[data-word]').text()).toBe('In progress…')
    expect(money(w)).toBe('1,370.00')
    locale.value = 'de-DE'
    await nextTick()
    expect(w.find('[data-word]').text()).toBe('Bitte warten…')
    expect(money(w)).toBe('1.370,00')
  })

  it("translate wins; a key it lacks, or returns as is, is grani's English", () => {
    const own = mount(Page, {
      global: { plugins: [createGrani({ translate: (key) => GERMAN[key] })] },
    })
    expect(own.find('[data-word]').text()).toBe('Bitte warten…')
    expect(own.find('[data-plural]').text()).toBe('3 selected')
    const echo = mount(Page, { global: { plugins: [createGrani({ translate: (key) => key })] } })
    expect(echo.find('[data-word]').text()).toBe('In progress…')
    const none = mount(Page, { global: { plugins: [createGrani({ translate: () => null })] } })
    expect(none.find('[data-word]').text()).toBe('In progress…')
  })

  it("plurals take the category of the locale's rules from translate: one, few, many in Russian", () => {
    const forms: Record<string, string> = {
      'grani.select.selected.one': 'Выбран {n}',
      'grani.select.selected.few': 'Выбрано {n} (few)',
      'grani.select.selected.many': 'Выбрано {n} (many)',
      'grani.select.selected.other': 'Выбрано {n}',
    }
    const grani = createGrani({ locale: 'ru', translate: (key) => forms[key] })
    const tp = createApp({})
      .use(grani)
      .runWithContext(() => useUiT().tp)
    expect(tp('grani.select.selected', 1)).toBe('Выбран 1')
    expect(tp('grani.select.selected', 3)).toBe('Выбрано 3 (few)')
    expect(tp('grani.select.selected', 5)).toBe('Выбрано 5 (many)')
    expect(tp('grani.select.selected', 21)).toBe('Выбран 21')
  })

  it('placeholders are filled after translate: a raw template and an interpolated text read the same', () => {
    const raw = mount(Page, {
      global: { plugins: [createGrani({ translate: () => 'Убрать {label}' })] },
    })
    const done = mount(Page, {
      global: {
        plugins: [createGrani({ translate: (_key, p) => `Убрать ${p?.label ?? ''}`.trim() })],
      },
    })
    expect(raw.find('[data-badge]').text()).toBe('Убрать Ann')
    expect(done.find('[data-badge]').text()).toBe('Убрать Ann')
  })

  it("grani.toast from outside a component reaches its own app's toaster, not another app's", async () => {
    const one = createGrani()
    const two = createGrani()
    const a = mount(UiToaster, { global: { plugins: [one] } })
    const b = mount(UiToaster, { global: { plugins: [two] } })
    one.toast.show({ title: 'Saved in one' })
    await nextTick()
    expect(a.text()).toContain('Saved in one')
    expect(b.text()).not.toContain('Saved in one')
    two.toast.error('Failed in two')
    await nextTick()
    expect(b.text()).toContain('Failed in two')
    expect(a.text()).not.toContain('Failed in two')
  })

  it("grani.confirm asks in its own app's window", async () => {
    const one = createGrani()
    const a = mount(UiConfirm, { global: { plugins: [one] } })
    const b = mount(UiConfirm, { global: { plugins: [createGrani()] } })
    void one.confirm.confirm('Leave without saving?')
    await nextTick()
    expect(a.text()).toContain('Leave without saving?')
    expect(b.text()).not.toContain('Leave without saving?')
  })

  it('useGrani returns the instance the app installed', () => {
    const grani = createGrani()
    const app = createApp({}).use(grani)
    expect(app.runWithContext(() => useGrani())).toBe(grani)
  })

  it('without the plugin: English, sm and the device zone', () => {
    const w = mount(Page)
    expect(w.find('[data-locale]').text()).toBe('en')
    expect(w.find('[data-word]').text()).toBe('In progress…')
    expect(money(w)).toBe('1,370.00')
    expect(height(w)).toBe('h-9')
    expect(useGrani().timeZone.value).toBe('')
  })

  it('a call outside any component reaches the one app that installed grani', () => {
    const grani = createGrani({ size: 'md' })
    const app = createApp({}).use(grani)
    expect(useGrani()).toBe(grani)
    expect(useGrani().size.value).toBe('md')
    app.unmount()
  })

  it('with two apps a call outside any component reaches neither and warns what to do', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const one = createGrani({ size: 'md' })
    const two = createGrani({ size: 'xs' })
    createApp({}).use(one)
    createApp({}).use(two)
    expect([one, two]).not.toContain(useGrani())
    expect(useGrani().size.value).toBe('sm')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]![0])).toMatch(/in setup.*grani\.toast/)
    warn.mockRestore()
  })

  it('an unmounted app no longer counts', () => {
    const app = createApp({ render: () => h('i') }).use(createGrani({ size: 'md' }))
    app.mount(document.createElement('div'))
    app.unmount()
    expect(useGrani().size.value).toBe('sm')
  })

  it("each app's store is its own; without the plugin a single store serves the page", () => {
    const a = createApp({}).use(createGrani())
    const b = createApp({}).use(createGrani())
    a.runWithContext(() => useShared<string[]>('grani:probe-list', () => []).value.push('a'))
    expect(b.runWithContext(() => useShared<string[]>('grani:probe-list', () => []).value)).toEqual(
      [],
    )
    const Probe = defineComponent({
      setup: () => {
        const n = useShared('grani:probe', () => 1)
        n.value++
        return () => h('i', n.value)
      },
    })
    expect(mount(Probe).text()).toBe('2')
    expect(mount(Probe).text()).toBe('3')
  })

  it('installs on a bare Vue app', () => {
    const app = createApp({ render: () => h('div') })
    expect(() => app.use(createGrani())).not.toThrow()
  })
})

describe('createGrani({ shared })', () => {
  const read = (app: ReturnType<typeof createApp>, key: string, fallback: unknown) =>
    app.runWithContext(() => useShared(key, () => fallback).value)

  // A plain value a component keeps in the store, but the browser does not take back, would be
  // written into the page for nothing and lost on the way: the snapshot leaves it out and says so
  // in development, so the list of what comes back (`SEEDS`) grows with the store.
  it('sharedSnapshot writes only what the browser takes back, and names any other plain value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({}).use(createGrani())
    app.runWithContext(() => {
      useShared('grani:today', () => '2026-10-19')
      useShared('grani:probe-count', () => 3)
    })
    expect(sharedSnapshot(app)).toEqual({ 'grani:today': '2026-10-19' })
    const said = warn.mock.calls.map(([m]) => String(m))
    expect(said.filter((m) => m.includes('grani:probe-count'))).toHaveLength(1)
    warn.mockRestore()
  })

  it('keeps a key sharedSnapshot writes, and drops a store key it never writes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({}).use(
      createGrani({
        shared: { 'grani:today': '2026-10-19', 'grani:toasts': [{ id: 7, title: 'Injected' }] },
      }),
    )
    expect(read(app, 'grani:today', '')).toBe('2026-10-19')
    expect(read(app, 'grani:toasts', [])).toEqual([])
    warn.mockRestore()
  })

  it('drops a key outside grani:<name>, keeping the rest, and never prints the dropped value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({}).use(
      createGrani({ shared: { 'grani:today': '2026-10-19', bogus: 'top secret payload' } }),
    )
    expect(read(app, 'grani:today', '')).toBe('2026-10-19')
    expect(read(app, 'bogus', 'fallback')).toBe('fallback')
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('"bogus"'))).toBe(true)
    expect(said.some((m) => m.includes('top secret payload'))).toBe(false)
    warn.mockRestore()
  })

  it('drops a value that is not JSON-safe (a function), and never prints it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({}).use(createGrani({ shared: { 'grani:probe-fn': () => 'top secret' } }))
    expect(read(app, 'grani:probe-fn', 'fallback')).toBe('fallback')
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('"grani:probe-fn"'))).toBe(true)
    expect(said.some((m) => m.includes('top secret'))).toBe(false)
    warn.mockRestore()
  })

  it('no shared option seeds nothing and warns of nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createApp({}).use(createGrani())
    expect(read(app, 'grani:probe-empty', 'fallback')).toBe('fallback')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('RouteLink', () => {
  const Routerish = defineComponent({
    props: { to: { type: String, required: true } },
    setup:
      (p, { slots }) =>
      () =>
        h('a', { href: p.to, 'data-router': '' }, slots.default?.()),
  })
  const link = (to: string, plugins = [createGrani({ link: Routerish })]) =>
    mount(RouteLink, {
      props: { to },
      attrs: { class: 'x', target: '_blank' },
      slots: { default: 'Go' },
      global: { plugins },
    })

  it("an app's own path goes through the app's link, attributes and slot passed on", () => {
    const a = link('/orders/7').find('a')
    expect(a.attributes('data-router')).toBe('')
    expect(a.attributes('href')).toBe('/orders/7')
    expect(a.classes()).toContain('x')
    expect(a.text()).toBe('Go')
  })

  it('another site, mailto: and tel: are plain anchors, never routes', () => {
    for (const to of ['https://vuejs.org', '//cdn.example', 'mailto:a@b.c', 'tel:+100']) {
      const a = link(to).find('a')
      expect(a.attributes('data-router')).toBeUndefined()
      expect(a.attributes('href')).toBe(to)
    }
  })

  it('a file the server hands out is a plain anchor; a path with a dot in a word stays a route', () => {
    for (const to of ['/llms.txt', '/files/report.pdf', '/export.csv?month=6', '/feed.xml#top']) {
      const a = link(to).find('a')
      expect(a.attributes('data-router'), to).toBeUndefined()
      expect(a.attributes('href')).toBe(to)
    }
    for (const to of ['/orders/7', '/v1.2/docs/', '/people/ann.lee/edit'])
      expect(link(to).find('a').attributes('data-router'), to).toBe('')
  })

  it('a route whose last part holds a dot stays a route: a name, a version, a domain', () => {
    for (const to of ['/people/john.doe', '/releases/v1.2', '/sites/example.com'])
      expect(link(to).find('a').attributes('data-router'), to).toBe('')
  })

  it('an address padded with spaces from data reaches the router trimmed', () => {
    expect(link(' /orders/7 ').find('a').attributes('href')).toBe('/orders/7')
  })

  it('without a router or a link of its own an app gets a plain anchor', () => {
    const a = link('/orders/7', [createGrani()]).find('a')
    expect(a.attributes('data-router')).toBeUndefined()
    expect(a.attributes('href')).toBe('/orders/7')
  })
})

describe('the package entry', () => {
  it('offers what an app uses and keeps the internals out', () => {
    for (const name of ['createGrani', 'useGrani', 'useUiT', 'useToast', 'sharedSnapshot'])
      expect(entry).toHaveProperty(name)
    for (const name of [
      'provideScope',
      'currentScope',
      'withScope',
      'resetShared',
      'isDev',
      'missingText',
      'tabbables',
    ])
      expect(entry).not.toHaveProperty(name)
    for (const name of [
      'setUiLocale',
      'setUiSize',
      'setUiTimeZone',
      'setUiCurrency',
      'registerUiMessages',
    ])
      expect(entry).not.toHaveProperty(name)
  })
})

describe('createGrani in development: an option it does not have', () => {
  const said = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[grani]'))

  it('is named with the options it takes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      createGrani({ locale_: 'ru', locale: 'ru' } as never)
      expect(said(warn)).toHaveLength(1)
      expect(said(warn)[0]).toContain('"locale_"')
      expect(said(warn)[0]).toContain('locale, translate, size, timeZone, currency, link')
      expect(said(warn)[0]).toContain('teleport and focus')
    } finally {
      warn.mockRestore()
    }
  })

  it('is said nothing of in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      createGrani({ locale_: 'ru' } as never)
      expect(said(warn)).toEqual([])
    } finally {
      warn.mockRestore()
      vi.unstubAllEnvs()
    }
  })
})

describe('development warnings, said once and on a server too', () => {
  const said = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[grani]'))
  // The render a server makes: the context Vue hands every component it renders to a string.
  const server = { provide: { [ssrContextKey as symbol]: {} } }
  const toastPage = (host: boolean) =>
    defineComponent({
      setup() {
        useToast().success('Saved')
        return () => (host ? h(UiToaster) : h('main'))
      },
    })

  it('a toast a server render showed with no UiToaster is said when the app writes its snapshot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mount(toastPage(false), { global: { ...server, plugins: [createGrani()] } })
      const app = w.vm.$.appContext.app
      expect(said(warn).filter((t) => t.includes('UiToaster'))).toEqual([])
      sharedSnapshot(app)
      sharedSnapshot(app)
      expect(said(warn).filter((t) => t.includes('<UiToaster />'))).toHaveLength(1)
      w.unmount()
    } finally {
      warn.mockRestore()
    }
  })

  it('a UiToaster the server rendered counts, and nothing is said', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = mount(toastPage(true), { global: { ...server, plugins: [createGrani()] } })
      sharedSnapshot(w.vm.$.appContext.app)
      expect(said(warn).filter((t) => t.includes('<UiToaster />'))).toEqual([])
      w.unmount()
    } finally {
      warn.mockRestore()
    }
  })

  it('an option or a size said once is not said again', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      createGrani({ colour: 'red', size: 'tiny' } as never)
      createGrani({ colour: 'red', size: 'tiny' } as never)
      expect(said(warn).filter((t) => t.includes('"colour"'))).toHaveLength(1)
      expect(said(warn).filter((t) => t.includes('"tiny"'))).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })
})
