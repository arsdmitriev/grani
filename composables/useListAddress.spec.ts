import { flushPromises as flush, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useListAddress, type ListAddressOptions, type ListQuery } from './useListAddress'
import UiDataTable from '../components/UiDataTable.vue'
import type { TableSort } from '../types/ui'

// A router by the parts the helper reads: the current query and hash, push and replace.
const router = (query: ListQuery = {}) => {
  const currentRoute = shallowRef({ path: '/list', query, hash: '#top' })
  const steps: [string, ListQuery, string | undefined][] = []
  const go = (how: string) => (to: { path?: string; query: ListQuery; hash?: string }) => {
    steps.push([how, to.query, to.hash])
    currentRoute.value = { path: to.path ?? '/list', query: to.query, hash: to.hash ?? '' }
  }
  return { currentRoute, push: go('push'), replace: go('replace'), steps }
}
// A press of the person's: what follows it is a step of the history.
const act = () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))

type Filters = { status: string[]; client: number | null; mine: boolean }
const host = (
  $router: ReturnType<typeof router> | undefined,
  options: ListAddressOptions<Filters> = {},
) => {
  let view!: ReturnType<typeof useListAddress<Filters>>
  const w = mount(
    defineComponent({
      setup() {
        view = useListAddress(
          { status: [] as string[], client: null as number | null, mine: false },
          options,
        )
        return () => h('i')
      },
    }),
    $router ? { global: { config: { globalProperties: { $router } as never } } } : {},
  )
  return { w, view }
}

describe('useListAddress', () => {
  it('reads the view from the address before the first paint: search, sort, page and filters', () => {
    const r = router({
      search: 'north',
      page: '3',
      sort: '-date',
      status: ['paid', 'due'],
      client: '5',
      mine: '1',
    })
    const { view } = host(r, { numbers: ['client'] })
    expect({ ...view }).toEqual({
      search: 'north',
      page: 3,
      sort: { key: 'date', dir: 'desc' },
      status: ['paid', 'due'],
      client: 5,
      mine: true,
    })
    expect(r.steps).toEqual([])
  })

  it('a value the address cannot hold reads as its default', () => {
    const { view } = host(router({ page: 'abc', client: 'x', mine: 'maybe' }), {
      numbers: ['client'],
    })
    expect([view.page, view.client, view.mine]).toEqual([1, null, false])
  })

  it('a typed search changes the step in place; a page, a sort or a filter adds a step', async () => {
    const r = router({ tab: 'open' })
    const { view } = host(r)
    act()
    view.search = 'north'
    view.page = 1
    await nextTick()
    act()
    view.page = 2
    await nextTick()
    act()
    view.sort = { key: 'client', dir: 'asc' }
    view.status = ['paid', 'due']
    await nextTick()
    expect(r.steps).toEqual([
      ['replace', { tab: 'open', search: 'north' }, '#top'],
      ['push', { tab: 'open', search: 'north', page: '2' }, '#top'],
      [
        'push',
        { tab: 'open', search: 'north', page: '2', sort: 'client', status: ['paid', 'due'] },
        '#top',
      ],
    ])
  })

  it('a value back at its default leaves the address; a cleared list against a chosen default stays said', async () => {
    const r = router({ page: '2', status: 'paid' })
    let view!: ReturnType<typeof useListAddress<{ status: string[] }>>
    mount(
      defineComponent({
        setup() {
          view = useListAddress({ status: ['paid'] })
          return () => h('i')
        },
      }),
      { global: { config: { globalProperties: { $router: r } as never } } },
    )
    act()
    view.page = 1
    view.status = []
    await nextTick()
    expect(r.steps).toEqual([['push', { status: '' }, '#top']])
  })

  it('Back reaches the list: the view follows the address and writes nothing back', async () => {
    const r = router({ page: '4' })
    const { view } = host(r)
    r.currentRoute.value = { path: '/list', query: { page: '2', status: 'due' }, hash: '' }
    await nextTick()
    expect([view.page, view.status]).toEqual([2, ['due']])
    await nextTick()
    expect(r.steps).toEqual([])
  })

  it('a prefix keeps two lists on one page apart', async () => {
    const r = router({ 'inv.page': '3', page: '9' })
    const { view } = host(r, { prefix: 'inv' })
    expect(view.page).toBe(3)
    view.page = 4
    await nextTick()
    expect(r.steps[0]![1]).toEqual({ 'inv.page': '4', page: '9' })
  })

  it('a page the address cannot hold reads as the first, and writes nothing', async () => {
    for (const page of ['0', '-2', '1.5', '1e3', ' ', '02x']) {
      const r = router({ page })
      const { view } = host(r)
      await nextTick()
      expect([page, view.page]).toEqual([page, 1])
      expect(r.steps).toEqual([])
    }
  })

  it('a change the person did not make changes the step in place', async () => {
    const r = router({ page: '9' })
    const { view } = host(r)
    view.page = 1
    await nextTick()
    expect(r.steps).toEqual([['replace', {}, '#top']])
  })

  it("called outside a component's setup, it says it cannot find the router", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    useListAddress()
    expect(warn.mock.calls.map((c) => String(c[0])).join()).toMatch(/useListAddress.*setup/)
    warn.mockRestore()
  })

  it('a filter of numbers not named in `numbers` keeps its numbers, and says to name it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = router()
    const { view } = host(r)
    act()
    view.client = 5
    await nextTick()
    await nextTick()
    expect(view.client).toBe(5)
    expect(warn.mock.calls.map((c) => String(c[0])).join()).toMatch(/`client`.*numbers/)
    warn.mockRestore()
  })

  it('every kind of value goes to the address and comes back as it was', async () => {
    const query = shallowRef<ListQuery>({})
    const address = {
      read: () => query.value,
      write: (next: ListQuery) => {
        query.value = next
      },
    }
    const filters = {
      many: [] as number[],
      one: null as string | null,
      pick: 'a' as string | null,
      size: 10,
      mine: false,
      open: true,
      word: 'all',
    }
    const list = () => {
      let view!: ReturnType<typeof useListAddress<typeof filters>>
      mount(
        defineComponent({
          setup() {
            view = useListAddress(filters, { address, numbers: ['many'] })
            return () => h('i')
          },
        }),
      )
      return view
    }
    const view = list()
    act()
    Object.assign(view, {
      sort: { key: 'date', dir: 'desc' },
      many: [1, 2],
      one: 'x',
      pick: null,
      size: 25,
      mine: true,
      open: false,
      word: 'some',
    })
    await nextTick()
    expect(query.value).toEqual({
      sort: '-date',
      many: ['1', '2'],
      one: 'x',
      pick: '',
      size: '25',
      mine: '1',
      open: '0',
      word: 'some',
    })
    const again = list()
    expect({ ...again }).toEqual({ ...view })
    act()
    again.sort = { key: 'date', dir: 'asc' }
    await nextTick()
    expect(query.value.sort).toBe('date')
    query.value = {
      sort: '',
      many: ['', 'x', '3'],
      one: '',
      size: 'big',
      mine: 'true',
      open: 'false',
      word: [null],
    }
    await nextTick()
    expect({ ...again }).toEqual({
      search: '',
      page: 1,
      sort: null,
      many: [3],
      one: null,
      pick: 'a',
      size: 10,
      mine: true,
      open: false,
      word: '',
    })
  })

  describe('without a router', () => {
    beforeEach(() => window.history.replaceState(null, '', '/list?search=nor&tab=1#here'))
    afterEach(() => window.history.replaceState(null, '', '/'))

    it("reads and writes the browser's address, and follows Back", async () => {
      const push = vi.spyOn(window.history, 'pushState')
      const { w, view } = host(undefined)
      expect(view.search).toBe('nor')
      act()
      view.page = 2
      await nextTick()
      expect(push).toHaveBeenCalledOnce()
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        '/list?tab=1&search=nor&page=2#here',
      )
      window.history.replaceState(null, '', '/list?page=5')
      window.dispatchEvent(new PopStateEvent('popstate'))
      await nextTick()
      expect([view.search, view.page]).toEqual(['', 5])
      w.unmount()
      push.mockRestore()
    })

    it('reads a repeated key, writes a typed search in place, and an empty view as no query', async () => {
      window.history.replaceState(null, '', '/list?status=a&status=b')
      const replace = vi.spyOn(window.history, 'replaceState')
      const { w, view } = host(undefined)
      expect(view.status).toEqual(['a', 'b'])
      act()
      view.search = 'x'
      await nextTick()
      expect(replace).toHaveBeenCalledOnce()
      expect(window.location.search).toBe('?search=x&status=a&status=b')
      act()
      view.search = ''
      view.status = []
      await nextTick()
      expect(window.location.search).toBe('')
      w.unmount()
      replace.mockRestore()
    })

    it("two lists on one page keep each other's keys", async () => {
      const a = host(undefined, { prefix: 'a' })
      const b = host(undefined, { prefix: 'b' })
      act()
      a.view.page = 2
      await nextTick()
      act()
      b.view.page = 3
      await nextTick()
      expect(window.location.search).toBe('?search=nor&tab=1&a.page=2&b.page=3')
      a.w.unmount()
      b.w.unmount()
    })
  })

  it('a page rendered by a server is drawn with the defaults, then the address lands', async () => {
    const Host = defineComponent({
      setup() {
        const view = useListAddress()
        return () => h('i', `${view.search || 'none'} ${view.page}`)
      },
    })
    const html = await renderToString(createSSRApp(Host))
    expect(html).toBe('<i>none 1</i>')
    window.history.replaceState(null, '', '/list?search=north&page=3')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const root = document.createElement('div')
    root.innerHTML = html
    createSSRApp(Host).mount(root)
    const said = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]))
    expect(said.filter((t) => /hydration/i.test(t))).toEqual([])
    await nextTick()
    expect(root.textContent).toBe('north 3')
    warn.mockRestore()
    error.mockRestore()
    window.history.replaceState(null, '', '/')
  })
})

// The app's real router, as `app.use(router)` installs it: found by itself, Back included.
describe('useListAddress — with vue-router', () => {
  it('reads, writes in place and as a step, keeps the path and the hash, and follows Back', async () => {
    const Page = defineComponent({ render: () => h('i') })
    const r = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/invoices/:kind', component: Page }],
    })
    await r.push('/invoices/open?page=3&tab=a#top')
    let view!: ReturnType<typeof useListAddress<{ status: string[] }>>
    const Host = defineComponent({
      setup() {
        view = useListAddress({ status: [] as string[] })
        return () => h('i')
      },
    })
    mount(Host, { global: { plugins: [r] } })
    expect(view.page).toBe(3)
    view.search = 'north'
    view.page = 1
    await nextTick()
    await r.isReady()
    await flush()
    expect(r.currentRoute.value.fullPath).toBe('/invoices/open?tab=a&search=north#top')
    act()
    view.status = ['paid']
    await nextTick()
    await flush()
    expect(r.currentRoute.value.fullPath).toBe('/invoices/open?tab=a&search=north&status=paid#top')
    r.back()
    await flush()
    expect([view.search, view.status]).toEqual(['north', []])
  })
})

describe('useListAddress — with vue-router, at its edges', () => {
  const Page = defineComponent({ render: () => h('i') })
  const app = async (at: string) => {
    const r = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p', component: Page }],
    })
    await r.push(at)
    return r
  }
  const list = (r: ReturnType<typeof createRouter>, options: ListAddressOptions<Filters> = {}) => {
    let view!: ReturnType<typeof useListAddress<Filters>>
    mount(
      defineComponent({
        setup() {
          view = useListAddress(
            { status: [] as string[], client: null as number | null, mine: false },
            options,
          )
          return () => h('i')
        },
      }),
      { global: { plugins: [r] } },
    )
    return view
  }

  it("another page's address is not the list's: nothing is read from it or written to it", async () => {
    const r = await app('/a?page=3')
    const view = list(r)
    await r.push('/b?other=1')
    await flush()
    expect(view.page).toBe(3)
    act()
    view.status = ['x']
    await flush()
    expect(r.currentRoute.value.fullPath).toBe('/b?other=1')
  })

  it('a refused navigation brings the view back to the address', async () => {
    const r = await app('/a')
    r.beforeEach((to) => !to.query.page)
    const view = list(r)
    act()
    view.page = 2
    await flush()
    expect(view.page).toBe(1)
    expect(r.currentRoute.value.fullPath).toBe('/a')
  })

  it('two lists that write in one tick keep both their keys', async () => {
    const r = await app('/a')
    const a = list(r, { prefix: 'a' })
    const b = list(r, { prefix: 'b' })
    act()
    a.page = 2
    b.page = 3
    await flush()
    expect(r.currentRoute.value.fullPath).toBe('/a?a.page=2&b.page=3')
  })
})

describe('useListAddress — a list that corrects its own page', () => {
  it('a row deleted off the last page: the page the list falls back to is written in place, so Back goes where the person was', async () => {
    const r = router({ page: '2' })
    const total = ref(11)
    mount(
      defineComponent({
        setup() {
          const view = useListAddress()
          return () =>
            h(UiDataTable, {
              columns: [{ key: 'id', label: 'ID' }],
              items: [{ id: 'INV-11' }],
              total: total.value,
              pageSize: 10,
              search: '',
              page: view.page,
              'onUpdate:page': (p: number) => (view.page = p),
            })
        },
      }),
      { global: { config: { globalProperties: { $router: r } as never } } },
    )
    await flush()
    // Delete on the only row of page 2: the app takes the row away, the total falls by one.
    act()
    total.value = 10
    await flush()
    expect(r.steps).toEqual([['replace', {}, '#top']])
  })
})

describe('useListAddress — review follow-ups', () => {
  const ISSUED: TableSort = { key: 'issued', dir: 'desc' }
  const at = (r: ReturnType<typeof router>, query: ListQuery) =>
    (r.currentRoute.value = { path: '/list', query, hash: '' })

  it('an address without a sort opens on the default sort and writes nothing; Back to one returns to it', async () => {
    const r = router({ tab: 'open' })
    const { view } = host(r, { sort: ISSUED })
    await nextTick()
    expect(view.sort).toEqual(ISSUED)
    expect(r.steps).toEqual([])
    at(r, { sort: 'client' })
    await nextTick()
    expect(view.sort).toEqual({ key: 'client', dir: 'asc' })
    at(r, {})
    await nextTick()
    expect(view.sort).toEqual(ISSUED)
    expect(r.steps).toEqual([])
  })

  it("the sort in the address is the list's own: the default does not overwrite it", () => {
    const { view } = host(router({ sort: '-client' }), { sort: ISSUED })
    expect(view.sort).toEqual({ key: 'client', dir: 'desc' })
  })

  it('a sort equal to the default stays out of the address, whatever the order of its fields', async () => {
    const r = router({ sort: 'client' })
    const { view } = host(r, { sort: { dir: 'desc', key: 'issued' } })
    act()
    view.sort = { key: 'issued', dir: 'desc' }
    await nextTick()
    expect(r.steps).toEqual([['push', {}, '#top']])
    act()
    view.sort = { key: 'issued', dir: 'asc' }
    await nextTick()
    expect(r.steps[1]).toEqual(['push', { sort: 'issued' }, '#top'])
  })

  it('a sort cleared against a default stays said, and reads back as cleared', async () => {
    const r = router()
    const { view } = host(r, { sort: ISSUED })
    act()
    view.sort = null
    await nextTick()
    expect(r.steps).toEqual([['push', { sort: '' }, '#top']])
    const again = host(r, { sort: ISSUED })
    expect(again.view.sort).toBeNull()
  })

  it('a sort with no column in the address reads as the default, or as none without one', async () => {
    for (const sort of ['-', ' - ', '- ']) {
      const r = router({ sort })
      const none = host(r)
      const chosen = host(r, { sort: ISSUED })
      await nextTick()
      expect([sort, none.view.sort, chosen.view.sort]).toEqual([sort, null, ISSUED])
      expect(r.steps).toEqual([])
    }
  })

  it('a column outside `sortKeys` reads as the default; one inside is read', async () => {
    const keys = ['id', 'client']
    const outside = router({ sort: '-secret' })
    expect(host(outside, { sort: ISSUED, sortKeys: keys }).view.sort).toEqual(ISSUED)
    expect(host(outside, { sortKeys: keys }).view.sort).toBeNull()
    expect(host(router({ sort: '-client' }), { sort: ISSUED, sortKeys: keys }).view.sort).toEqual({
      key: 'client',
      dir: 'desc',
    })
    expect(outside.steps).toEqual([])
  })

  it('a sort the list holds outside `sortKeys` is said in development, since the address cannot keep it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = router()
    const { view } = host(r, { sort: ISSUED, sortKeys: ['issued', 'client'] })
    act()
    view.sort = { key: 'secret', dir: 'asc' }
    await nextTick()
    await nextTick()
    expect(warn.mock.calls.map((c) => String(c[0])).join()).toMatch(/`sort`.*sortKeys/)
    warn.mockRestore()
  })
})
