import { Window } from 'happy-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, type Component } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createGrani } from '../../plugin'
import { resetShared } from '../../composables/useShared'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import UiToaster from '../../components/UiToaster.vue'

// A server that loads a global DOM shim (jsdom, happy-dom's GlobalRegistrator) for a dependency
// that needs one defines `window` and `document` on the process: `typeof window === 'undefined'`
// alone can no longer tell a server from a browser, so every guarantee of `scope.ssr.spec.ts`
// holds under this shim too.

let win: InstanceType<typeof Window>
beforeEach(() => {
  resetShared()
  win = new Window()
  ;(globalThis as Record<string, unknown>).window = win
  ;(globalThis as Record<string, unknown>).document = win.document
})
afterEach(() => {
  // A scope that ends while the shim is still in place: its cleanup (a listener taken off
  // `document`) needs the shim present, so this runs before the shim is removed.
  resetShared()
  delete (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).document
})

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0))

describe('a global window shim on the server', () => {
  it('three requests calling useToast() after an await each see only their own, with the plugin installed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const names = ['alice', 'bob', 'carol']
    const gates = names.map(deferred)
    const seen: Record<string, string[]> = {}
    const Page = (name: string): Component =>
      defineComponent({
        async setup() {
          await gates[names.indexOf(name)]!.promise
          const toast = useToast()
          toast.info(`secret-of-${name}`)
          seen[name] = toast.toasts.value.map((t) => t.title)
          return () => h('div', name)
        },
      })
    try {
      // Each render starts (and is marked by renderToString) before the next is created: the
      // shim makes every one of them land in the process-wide installed map, never unmounted.
      const renders = names.map((name) =>
        renderToString(createSSRApp(Page(name)).use(createGrani())),
      )
      for (const g of gates) {
        g.resolve()
        await tick()
      }
      await Promise.all(renders)
      for (const name of names) expect(seen[name], name).toEqual([`secret-of-${name}`])
    } finally {
      warn.mockRestore()
    }
  })

  it("a confirm asked after an await by one request is never settled by another's, with the plugin installed", async () => {
    const names = ['bob', 'carol']
    const gates = names.map(deferred)
    const answers: Record<string, boolean | 'pending'> = { bob: 'pending', carol: 'pending' }
    const Ask = (name: string): Component =>
      defineComponent({
        async setup() {
          await gates[names.indexOf(name)]!.promise
          void useConfirm()
            .confirm('Continue?')
            .then((a) => (answers[name] = a))
          return () => h('div')
        },
      })
    const renders = names.map((name) => renderToString(createSSRApp(Ask(name)).use(createGrani())))
    for (const g of gates) {
      g.resolve()
      await tick()
    }
    await Promise.all(renders)
    await tick()
    // Carol's confirm must never settle Bob's: each stays open (pending) on its own scope.
    expect(answers.bob).toBe('pending')
    expect(answers.carol).toBe('pending')
  })

  it("without the plugin, one request's toast never shows up in another request's HTML", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Page = (label: string): Component =>
      defineComponent({
        setup() {
          useToast().info(label)
          return () => h('div', [h(UiToaster)])
        },
      })
    try {
      // UiToaster's stack is teleported: the toast's text lands in `ctx.teleports`, not the
      // direct result, so each request's own context is read, as the server snippet does.
      const ctxAlice: SSRContext = {}
      await renderToString(createSSRApp(Page('secret-of-alice')), ctxAlice)
      const ctxBob: SSRContext = {}
      await renderToString(createSSRApp(Page('secret-of-bob')), ctxBob)
      const bodyAlice = ctxAlice.teleports?.body ?? ''
      const bodyBob = ctxBob.teleports?.body ?? ''
      expect(bodyAlice).toContain('secret-of-alice')
      expect(bodyBob).toContain('secret-of-bob')
      expect(bodyBob).not.toContain('secret-of-alice')
    } finally {
      warn.mockRestore()
    }
  })

  it('once this process has rendered for a server, a later call with no context at all still gets a throwaway scope', async () => {
    await renderToString(
      createSSRApp(
        defineComponent({
          setup() {
            useToast()
            return () => h('div')
          },
        }),
      ).use(createGrani()),
    )
    const a = useToast()
    a.info('first')
    const b = useToast()
    b.info('second')
    expect(b.toasts.value).toHaveLength(1)
  })

  // A host counts itself when it mounts, and nothing mounts in a server render: the warning that a
  // UiToaster is missing would say so of every page, and is for the browser alone.
  it('rendering a page with its UiToaster does not warn that the toaster is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Page = defineComponent({
      setup() {
        useToast().info('Saved')
        return () => h('div', [h(UiToaster)])
      },
    })
    try {
      await renderToString(createSSRApp(Page).use(createGrani()), {} as SSRContext)
      await tick()
      const missing = warn.mock.calls.filter((c) => /UiToaster/.test(String(c[0])))
      expect(missing).toEqual([])
    } finally {
      warn.mockRestore()
    }
  })
})

// Under a shim `window` exists at install time, so the shared instance is told by the render: an
// instance whose app a server rendered, installed in another app, is one shared by requests.
describe('one createGrani() shared by requests, under a DOM shim', () => {
  it('warns once when it is installed in the next request’s app after a render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const shared = createGrani()
    const first = createSSRApp({ render: () => h('p', 'one') }).use(shared)
    await renderToString(first)
    expect(warn.mock.calls.filter(([m]) => /per request/.test(String(m)))).toEqual([])
    createSSRApp({ render: () => h('p', 'two') }).use(shared)
    createSSRApp({ render: () => h('p', 'three') }).use(shared)
    expect(warn.mock.calls.filter(([m]) => /per request/.test(String(m)))).toHaveLength(1)
    warn.mockRestore()
  })
})
