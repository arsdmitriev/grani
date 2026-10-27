import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, type Component } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createGrani } from '../../plugin'
import { resetShared, sharedSnapshot } from '../../composables/useShared'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { useUiT } from '../../composables/useUiT'
import UiToaster from '../../components/UiToaster.vue'
import UiConfirm from '../../components/UiConfirm.vue'

// A server renders many requests at once: a call that reaches no app (outside a component's
// setup, after an `await`, or a render with no plugin installed) must never read or write a
// store any other request can reach, and must not grow forever doing it.

function noBrowser() {
  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0))

beforeEach(() => resetShared())

describe('a call with no app on the server', () => {
  it('warns once in development and keeps nothing: a second such call starts just as empty', () => {
    noBrowser()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const a = useToast()
      a.info('Stray')
      expect(a.toasts.value).toHaveLength(1)
      const b = useToast()
      b.info('Also stray')
      // Not 2: the first call's toast was never kept anywhere the second call could reach.
      expect(b.toasts.value).toHaveLength(1)
      expect(warn).toHaveBeenCalled()
      expect(String(warn.mock.calls[0]![0])).toMatch(/context/i)
    } finally {
      warn.mockRestore()
    }
  })
})

describe('200 requests, each calling useToast() after an await', () => {
  it('with the plugin installed, none of them share a queue or keep growing it', async () => {
    noBrowser()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const lengths: number[] = []
    const AfterAwait = (label: string): Component =>
      defineComponent({
        async setup() {
          await tick()
          const toast = useToast()
          toast.info(label)
          lengths.push(toast.toasts.value.length)
          return () => h('div', label)
        },
      })
    try {
      const N = 200
      await Promise.all(
        Array.from({ length: N }, (_, i) =>
          renderToString(createSSRApp(AfterAwait(`user${i}`)).use(createGrani())),
        ),
      )
      expect(lengths).toEqual(Array<number>(N).fill(1))
    } finally {
      warn.mockRestore()
    }
  })
})

describe('isolation between requests', () => {
  it('a toast of one request is never visible to another, with and without the plugin', async () => {
    noBrowser()
    const seen: number[] = []
    const Page = (label: string): Component =>
      defineComponent({
        setup() {
          const toast = useToast()
          toast.info(label)
          seen.push(toast.toasts.value.length)
          return () => h('div', label)
        },
      })

    await renderToString(createSSRApp(Page('A')))
    await renderToString(createSSRApp(Page('B')))
    expect(seen, 'without the plugin').toEqual([1, 1])

    seen.length = 0
    await renderToString(createSSRApp(Page('C')).use(createGrani()))
    await renderToString(createSSRApp(Page('D')).use(createGrani()))
    expect(seen, 'with the plugin').toEqual([1, 1])
  })

  it("a confirm of one request is never settled by another request's confirm, with and without the plugin", async () => {
    noBrowser()
    const Ask = (capture: (answer: boolean) => void): Component =>
      defineComponent({
        setup() {
          const { confirm } = useConfirm()
          void confirm('Continue?').then(capture)
          return () => h('div')
        },
      })

    let answerA: boolean | 'pending' = 'pending'
    await renderToString(createSSRApp(Ask((b) => (answerA = b))))
    await renderToString(createSSRApp(Ask(() => {})))
    await tick()
    expect(answerA, 'without the plugin').toBe('pending')

    let answerC: boolean | 'pending' = 'pending'
    await renderToString(createSSRApp(Ask((b) => (answerC = b))).use(createGrani()))
    await renderToString(createSSRApp(Ask(() => {})).use(createGrani()))
    await tick()
    expect(answerC, 'with the plugin').toBe('pending')
  })
})

describe('a toast id', () => {
  it("does not say how many toasts the server has made across other requests' responses", async () => {
    noBrowser()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Page = (label: string): Component =>
      defineComponent({
        setup() {
          useToast().info(label)
          return () => h('div', [h(UiToaster)])
        },
      })
    try {
      const ctxA: SSRContext = {}
      await renderToString(createSSRApp(Page('first')).use(createGrani()), ctxA)
      const ctxB: SSRContext = {}
      await renderToString(createSSRApp(Page('second')).use(createGrani()), ctxB)
      // The second response starts its own count at 1 too: a visitor reading `data-id` never
      // learns how many toasts came before, in this or any other request.
      expect(ctxA.teleports?.body).toContain('data-id="1"')
      expect(ctxB.teleports?.body).toContain('data-id="1"')
    } finally {
      warn.mockRestore()
    }
  })
})

describe('the once-per-process warning', () => {
  it('is generic, not toast- or confirm-specific, so a later real problem is not read as already explained', () => {
    noBrowser()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      // useUiT(), not useToast() or useConfirm(), trips the one warning first.
      useUiT()
      expect(warn).toHaveBeenCalledTimes(1)
      const message = String(warn.mock.calls[0]![0])
      expect(message).not.toMatch(/\btoast\b/i)
      expect(message).not.toMatch(/\bconfirm\b/i)
      expect(message).toMatch(/grani composable/i)
      // The budget is spent, so this warns no more; the toast is still correctly isolated, the
      // actual fix, not the wording alone.
      const toast = useToast()
      toast.info('Still isolated')
      expect(toast.toasts.value).toHaveLength(1)
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })
})

// One instance made at module load and installed in every request's app gives every request the
// same toasts and shared state: the server warns, in production too, since it leaks one person's
// page into another's.
describe('one createGrani() installed in two apps on a server', () => {
  it('warns once that requests share it, and an instance per request says nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const shared = createGrani()
    createSSRApp({ render: () => null }).use(shared)
    expect(warn).not.toHaveBeenCalled()
    createSSRApp({ render: () => null }).use(shared)
    createSSRApp({ render: () => null }).use(shared)
    const said = warn.mock.calls.filter(([m]) => /per request/.test(String(m)))
    expect(said).toHaveLength(1)
    warn.mockClear()
    for (let i = 0; i < 3; i++) createSSRApp({ render: () => null }).use(createGrani())
    expect(warn.mock.calls.filter(([m]) => /per request/.test(String(m)))).toEqual([])
    warn.mockRestore()
  })
})

// A server renders the page and never mounts it: a toast or a question shown there with no host in
// the page is said once the render is over, when the app writes its state, as a browser says it.
describe('a toast or a question with no host on the server', () => {
  const page = (host: boolean) =>
    defineComponent({
      setup() {
        useToast().success('Saved')
        void useConfirm().confirm('Delete?')
        return () => h('main', host ? [h(UiToaster), h(UiConfirm)] : [])
      },
    })
  const hostless = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map((c) => String(c[0])).filter((t) => /is mounted in this app/.test(t))

  it('is said in development once the app writes its state', async () => {
    noBrowser()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const app = createSSRApp(page(false)).use(createGrani())
      await renderToString(app, {} as SSRContext)
      await tick()
      expect(hostless(warn)).toEqual([])
      sharedSnapshot(app)
      expect(hostless(warn)).toHaveLength(2)
      expect(hostless(warn)[0]).toContain('<UiToaster />')
      expect(hostless(warn)[1]).toContain('<UiConfirm />')
      sharedSnapshot(app)
      expect(hostless(warn)).toHaveLength(2)
    } finally {
      warn.mockRestore()
    }
  })

  it('says nothing when the page rendered its hosts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const app = createSSRApp(page(true)).use(createGrani())
      await renderToString(app, {} as SSRContext)
      sharedSnapshot(app)
      expect(hostless(warn)).toEqual([])
    } finally {
      warn.mockRestore()
    }
  })
})
