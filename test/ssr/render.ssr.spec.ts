import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, type Component } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createGrani, type GraniOptions } from '../../plugin'
import { sharedSnapshot } from '../../composables/useShared'
import { useToday } from '../../composables/useToday'
import { useListAddress } from '../../composables/useListAddress'
import { useUiT } from '../../composables/useUiT'
import type { DataTableColumn } from '../../types/ui'
import { today } from '../../utils/calendar'
import UiButton from '../../components/UiButton.vue'
import UiCount from '../../components/UiCount.vue'
import UiConfirm from '../../components/UiConfirm.vue'
import UiCrudDrawer from '../../components/UiCrudDrawer.vue'
import UiDataTable from '../../components/UiDataTable.vue'
import UiDateCell from '../../components/UiDateCell.vue'
import UiInput from '../../components/UiInput.vue'
import UiCopyButton from '../../components/UiCopyButton.vue'
import { SEEDS } from '../../utils/sharedSeed'
import UiLink from '../../components/UiLink.vue'
import UiAppShell from '../../components/UiAppShell.vue'
import UiMenu from '../../components/UiMenu.vue'
import UiModal from '../../components/UiModal.vue'
import UiSelect from '../../components/UiSelect.vue'
import UiListItem from '../../components/UiListItem.vue'
import UiToaster from '../../components/UiToaster.vue'
import { unguarded, watchGlobals } from './watch.mjs'

// Server rendering in plain Node: no window, no document. Two requests on one server must never
// share a setting, even when one waits for data while the other renders whole.

interface Row {
  id: number
  client: string
  amount: number
  // 22:30 UTC: the 11th in Berlin, still the 10th in New York.
  issued: string
}
const rows: Row[] = [
  { id: 1, client: 'Anna', amount: 1234.5, issued: '2026-09-10T22:30:00Z' },
  { id: 2, client: 'Boris', amount: 98765.25, issued: '2026-03-02T12:00:00Z' },
]
const columns: DataTableColumn<Row>[] = [
  { key: 'client', label: 'Client' },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'issued', label: 'Issued', type: 'date', context: 'weekday' },
]

const GERMAN: Record<string, string> = {
  'grani.button.loading': 'Bitte warten…',
  'grani.date.today': 'Heute',
}
const DE: GraniOptions = {
  locale: 'de-DE',
  timeZone: 'Europe/Berlin',
  currency: 'EUR',
  translate: (key) => GERMAN[key],
}
const US: GraniOptions = { locale: 'en-US', timeZone: 'America/New_York', currency: 'USD' }

// What each request must show, and what the other request's settings would have shown instead.
const LOOKS = {
  de: {
    has: [
      '1.234,50',
      '98.765,25',
      'EUR',
      'Bitte warten…',
      'Freitag',
      'Heute',
      'data-locale="de-DE"',
    ],
    not: ['1,234.50', '98,765.25', 'USD', 'In progress…', 'Thursday', 'Today', 'en-US'],
  },
  us: {
    has: [
      '1,234.50',
      '98,765.25',
      'USD',
      'In progress…',
      'Thursday',
      'Today',
      'data-locale="en-US"',
    ],
    not: ['1.234,50', '98.765,25', 'EUR', 'Bitte warten…', 'Freitag', 'Heute', 'de-DE'],
  },
}
function looksLike(html: string, look: { has: string[]; not: string[] }) {
  for (const s of look.has) expect(html, `missing ${s}`).toContain(s)
  for (const s of look.not) expect(html, `leaked ${s}`).not.toContain(s)
}

// A page of real components. The marker reads the scope the request installed; the button shows
// grani's text, the table money and dates, the lone date cell today's word.
const Page = defineComponent({
  setup() {
    const { locale, t } = useUiT()
    return () =>
      h('main', { 'data-locale': locale.value }, [
        h('p', { 'data-word': '' }, t('grani.button.loading')),
        h(UiButton, { loading: true }, () => 'Save'),
        h(UiInput, { modelValue: 'Anna', placeholder: 'Name' }),
        h(UiSelect, {
          modelValue: 'b',
          items: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ],
        }),
        h(UiDataTable as Component, { columns, items: rows, search: '', total: rows.length }),
        h(UiDateCell, { value: new Date().toISOString(), variant: 'time' }),
      ])
  },
})

// A request that waits for its data (an `async setup`) before its page renders: the gate opens
// when the test says, so another request can run whole in the meantime.
function gated(open: Promise<void>): Component {
  return defineComponent({
    async setup() {
      // Read before the wait: what the request holds must still be its own after it.
      const { locale } = useUiT()
      await open
      return () => h('div', { 'data-before-wait': locale.value }, [h(Page)])
    },
  })
}

// A request whose data comes through `onServerPrefetch`, the other way a server page waits.
function prefetched(wait: () => Promise<void>): Component {
  return defineComponent({
    setup() {
      const { locale } = useUiT()
      return { locale }
    },
    async serverPrefetch() {
      await wait()
    },
    render() {
      return h('div', { 'data-prefetch': this.locale }, [h(Page)])
    },
  })
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0))

function noBrowser() {
  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')
}

// The surfaces that Teleport to the body and wait for the browser to place, focus and lock: they
// must render on a server, closed or open, and leave every browser global to a guard.
const Overlays = defineComponent({
  setup() {
    return () =>
      h('main', [
        h(UiButton, { to: '/' }, () => 'Home'),
        h(UiButton, { to: '/records' }, () => 'Records'),
        h(UiMenu, null, {
          trigger: () => h(UiButton, null, () => 'Actions'),
          default: () => h(UiListItem, { as: 'button', title: 'Rename' }),
        }),
        h(UiCrudDrawer, { open: false, title: 'Closed record' }, () => 'closed body'),
        h(UiCrudDrawer, { open: true, title: 'Open record' }, () => 'open body'),
        h(UiModal, { open: true, title: 'Open window' }, () => 'window body'),
        h(UiToaster),
        h(UiConfirm),
      ])
  },
})
const ROOT = new URL('../../', import.meta.url).pathname
const ours = (from: string) => from.includes(ROOT) && !from.includes('/node_modules/')

describe('server render in Node', () => {
  it("focus: 'strong' installs on a server, where there is no page to mark", async () => {
    const app = createSSRApp({ render: () => h('p', 'x') }).use(createGrani({ focus: 'strong' }))
    expect(await renderToString(app)).toBe('<p>x</p>')
  })

  it("a list's view in the address renders its defaults on a server, with a router or none, and reads no browser global", async () => {
    const List = defineComponent({
      setup() {
        const view = useListAddress({ status: [] as string[] })
        return () => h('i', `${view.search || 'none'} ${view.page} ${view.status.length}`)
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: List }],
    })
    await router.push('/?search=north&page=3')
    const watch = watchGlobals()
    let routed: string, bare: string
    try {
      routed = await renderToString(createSSRApp(List).use(router))
      bare = await renderToString(createSSRApp(List))
    } finally {
      watch.restore()
    }
    expect(unguarded(watch.touches, ours)).toEqual([])
    expect([routed, bare]).toEqual(['<i>none 1 0</i>', '<i>none 1 0</i>'])
  })

  it('overlays, a menu and a router link render on a server and read no browser global unguarded', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Overlays },
        { path: '/records', component: Overlays },
      ],
    })
    const app = createSSRApp(Overlays).use(router).use(createGrani(US))
    await router.push('/')
    await router.isReady()
    const ctx: SSRContext = {}
    const watch = watchGlobals()
    let html: string
    try {
      html = await renderToString(app, ctx)
    } finally {
      watch.restore()
    }
    expect(unguarded(watch.touches, ours)).toEqual([])
    // The touches were watched: the overlays did ask, behind their guards.
    expect(watch.touches.some((t: { from: string }) => ours(t.from))).toBe(true)
    // The router's link, not a plain anchor: RouterLink marks the link to the current route.
    expect(html).toMatch(/<a[^>]*href="\/records"/)
    expect(html).toMatch(
      /<a[^>]*href="\/"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/"/,
    )
    expect(html).toContain('Actions')
    const body = ctx.teleports?.body ?? ''
    expect(body).toContain('Open record')
    expect(body).toContain('open body')
    expect(body).toContain('Open window')
    expect(body).toContain('window body')
    expect(`${html}${body}`).not.toContain('Closed record')
    expect(`${html}${body}`).not.toContain('Rename')
  })

  it('a count renders on a server, and an unknown one renders nothing', async () => {
    noBrowser()
    const known = await renderToString(createSSRApp(UiCount, { count: 150 }).use(createGrani(US)))
    expect(known).toContain('99+')
    const unknown = await renderToString(
      createSSRApp(UiCount, { count: Number.NaN }).use(createGrani(US)),
    )
    expect(unknown).not.toContain('ui-count')
    expect(unknown).not.toContain('0')
    noBrowser()
  })

  // A menu built from the app's data, one item of it without an address: the page still answers.
  it('a link the data gave no address renders its text, and the page renders', async () => {
    noBrowser()
    for (const to of [undefined, null, '', 5, ['/x'], {}]) {
      const page = await renderToString(
        createSSRApp({
          render: () =>
            h('nav', [
              h(UiLink, { to: '/reports' }, () => 'Reports'),
              h(UiLink, { to: to as unknown as string }, () => 'Archive'),
              h(UiButton, { to: to as unknown as string }, () => 'Export'),
              h(UiListItem, { to: to as unknown as string, title: 'Settings' }),
            ]),
        }).use(createGrani(US)),
      )
      const html = page.replace(/<!--.*?-->/g, '')
      expect(html, String(to)).toMatch(/<a[^>]*href="\/reports"/)
      expect(html, String(to)).toMatch(/<span[^>]*>Archive<\/span>/)
      expect(html, String(to)).toContain('Export')
      expect(html, String(to)).toContain('Settings')
    }
  })

  // A column's width from the app's data reaches `style` on the server as written: only a length
  // passes, so no declaration rides in with it (a background, a fixed position over the page).
  it("a column's width is one CSS value, never more CSS", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(UiDataTable, {
            ariaLabel: 'Invoices',
            items: [{ id: 1, client: 'Anna' }],
            total: 1,
            search: '',
            rowLabel: (r) => String(r.id),
            columns: [
              { key: 'id', label: 'Invoice', width: '110px' },
              {
                key: 'client',
                label: 'Client',
                width: '1px;background:url(//evil.example/x);position:fixed;inset:0',
              },
            ],
          }),
      }).use(createGrani(US)),
    )
    warn.mockRestore()
    expect(html).toContain('width:110px')
    expect(html).not.toMatch(/evil\.example|position:\s*fixed|inset:/)
  })

  // Any one CSS value an app may mean passes: a function, a variable, a keyword, a unit the list
  // above does not name. Only what would end the declaration and start another is refused.
  it.each([
    'calc(100% - 2rem)',
    'var(--w)',
    'min-content',
    'clamp(4rem, 20%, 12rem)',
    '12dvw',
    '0',
    '.5rem',
    '120PX',
  ])('a column width %s reaches the page as written', async (width) => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(UiDataTable, {
            ariaLabel: 'Invoices',
            items: [{ id: 1 }],
            total: 1,
            search: '',
            rowLabel: (r) => String(r.id),
            columns: [{ key: 'id', label: 'Invoice', width }],
          }),
      }).use(createGrani(US)),
    )
    expect(html).toContain(`width:${width}`)
  })

  // A sidebar built from a tenant's data, one place without an address: the shell renders, that place
  // is text, and it is never the current page.
  it('a shell whose place has no address renders, and lights only a place with one', async () => {
    noBrowser()
    for (const to of [null, undefined, '', '  ', 5]) {
      const page = await renderToString(
        createSSRApp(UiAppShell, {
          name: 'Acme',
          current: '/settings',
          nav: [
            {
              items: [
                { to: '/settings', label: 'Settings', icon: 'span' },
                { to: to as unknown as string, label: 'Reports', icon: 'span' },
              ],
            },
          ],
        }).use(createGrani(US)),
      )
      const html = page.replace(/<!--.*?-->/g, '')
      expect(html, String(to)).toContain('Reports')
      expect(html.match(/aria-current="page"/g), String(to)).toHaveLength(1)
      expect(html, String(to)).toMatch(
        /<a[^>]*href="\/settings"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/settings"/,
      )
    }
  })

  it('a page of real components renders without a browser', async () => {
    noBrowser()
    const app = createSSRApp(Page).use(createGrani(US))
    // Another request installed between this one's start and its render must not move it.
    createSSRApp(Page).use(createGrani(DE))
    const html = await renderToString(app)
    noBrowser()
    expect(html).toContain('<table')
    expect(html).toContain('Anna')
    expect(html).toContain('Beta')
    expect(html).toContain('placeholder="Name"')
    looksLike(html, LOOKS.us)
  })

  it('a request that waits renders in its own settings while another renders whole', async () => {
    const gate = deferred()
    const a = createSSRApp(gated(gate.promise)).use(createGrani(DE))
    const pendingA = renderToString(a)
    await tick()
    // B starts, waits its turn and finishes while A is parked in its setup.
    const htmlB = await renderToString(createSSRApp(Page).use(createGrani(US)))
    let doneA = false
    void pendingA.then(() => (doneA = true))
    await tick()
    expect(doneA).toBe(false)
    gate.resolve()
    const htmlA = await pendingA
    expect(htmlA).toContain('data-before-wait="de-DE"')
    looksLike(htmlA, LOOKS.de)
    looksLike(htmlB, LOOKS.us)
  })

  it('ten requests at once, alternating settings and finishing out of order, stay apart', async () => {
    const gates = Array.from({ length: 10 }, deferred)
    const renders = gates.map((g, i) => {
      const settings = i % 2 ? US : DE
      const root = i % 3 === 0 ? prefetched(() => g.promise) : gated(g.promise)
      return renderToString(createSSRApp(root).use(createGrani(settings)))
    })
    await tick()
    // Open the gates backwards, a timer between each: the last request started finishes first.
    for (const g of [...gates].reverse()) {
      g.resolve()
      await tick()
    }
    const pages = await Promise.all(renders)
    pages.forEach((html, i) => {
      const de = i % 2 === 0
      expect(html).toContain(de ? '"de-DE"' : '"en-US"')
      looksLike(html, de ? LOOKS.de : LOOKS.us)
    })
  })

  it("the server's snapshot seeds a second app with the same day and the same now", async () => {
    // Kiritimati (UTC+14) and Pago Pago (UTC-11) are never on the same day: a day read in the
    // wrong zone shows up as another date.
    const Today = defineComponent({
      setup() {
        const { now } = useToday()
        const { locale } = useUiT()
        return () => h('time', { 'data-locale': locale.value }, now.value)
      },
    })
    const server = createSSRApp(
      defineComponent(() => () => [h(Today), h(Page), h(UiCopyButton, { value: 'INV-1' })]),
    ).use(createGrani({ ...DE, timeZone: 'Pacific/Kiritimati' }))
    const first = await renderToString(server)
    const shared = sharedSnapshot(server)
    expect(shared['grani:today']).toBe(today('Pacific/Kiritimati'))
    expect(typeof shared['grani:date-cell-now']).toBe('number')
    // Every key the snapshot writes is one the browser takes back: none is lost on the way.
    expect(Object.keys(shared).filter((k) => !(k in SEEDS))).toEqual([])
    // The snapshot crosses the page as JSON.
    const seed = JSON.parse(JSON.stringify(shared)) as Record<string, unknown>

    // The second app is told another zone; the seeded day wins over its own reading.
    const client = createSSRApp(Today).use(
      createGrani({ ...DE, timeZone: 'Pacific/Pago_Pago', shared: seed }),
    )
    const second = await renderToString(client)
    const day = /<time[^>]*>([^<]+)<\/time>/
    expect(second.match(day)?.[1]).toBe(first.match(day)?.[1])
    expect(second).toContain('data-locale="de-DE"')
    expect(sharedSnapshot(client)).toEqual(seed)

    // Without the seed the same app reads its own zone's day: the seed is what carried it.
    const unseeded = await renderToString(
      createSSRApp(Today).use(createGrani({ ...DE, timeZone: 'Pacific/Pago_Pago' })),
    )
    expect(unseeded.match(day)?.[1]).toBe(today('Pacific/Pago_Pago'))
    expect(today('Pacific/Pago_Pago')).not.toBe(today('Pacific/Kiritimati'))
  })
})
