import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { expect, it, vi } from 'vitest'

// `grani-ui/style.css` reaches only the elements marked `data-grani`, so an element grani draws
// without the mark loses its border color, pointer and focus ring in an app without base.css.
// Every demo is mounted, its buttons pressed to open what they open, and every HTML element on the
// page is read: what the demo writes itself is marked `data-demo` by the specs' compiler
// (`vitest.config.ts`), everything else is grani's and must carry `data-grani`.
const demos = import.meta.glob('../demos/*.demo.vue', { eager: true }) as Record<
  string,
  { default: Component }
>

// The showcase's block, marked as the demo's own.
const DemoBlock = defineComponent({
  props: { title: { type: String, required: true }, row: Boolean, wide: Boolean },
  setup(props, { slots }) {
    return () =>
      h('section', { 'data-demo': '' }, [
        h('h2', { 'data-demo': '' }, props.title),
        slots.default?.(),
      ])
  },
})

// Pressing every button of a large demo adds nothing the first ones did not open.
const PRESSES = 40

// What may stand without the mark, and why.
const unmarked = (el: Element) =>
  // A chart's marks are SVG, not HTML: the stylesheet's base is for HTML elements.
  el.namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
  // The page's live region is made by `utils/announce` with inline styles that need no class
  // or base: it is hidden from the eye and read by the screen reader alone.
  el.id === 'ui-announcer' ||
  // The test harness's stand-ins for Transition and Teleport: an app never draws them.
  el.tagName.toLowerCase().endsWith('-stub')

const missing = (root: Element) =>
  [...root.querySelectorAll('*')]
    .filter((el) => !el.hasAttribute('data-grani') && !el.hasAttribute('data-demo'))
    .filter((el) => !unmarked(el))
    .map((el) => `<${el.tagName.toLowerCase()} class="${el.getAttribute('class') ?? ''}">`)

// Mounting a demo and pressing its buttons takes about 0.5 s on a machine at rest; the gates' own
// load took the largest demo past 5 s (UiDataTable, 4.7 s with five forks, 22.10). The limit is
// for a hang, not for speed: what the test checks is the same at any pace.
const SLOW = 20_000
// The page's own clock, taken before any test wraps it: a test that ran out of time leaves its
// wrapper in place, and wrapping the wrapper would call itself without end.
const start = globalThis.setTimeout

for (const [path, mod] of Object.entries(demos)) {
  const name = path.split('/').pop()!.replace('.demo.vue', '')
  it(
    `${name}: every element grani draws carries data-grani`,
    async () => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { render: () => null } }],
      })
      await router.push('/')
      // A press may start a demo's timer (a request that fails in a second and a half): every timer
      // started here is dropped at the end, so none fires during the next demo.
      const timers: ReturnType<typeof setTimeout>[] = []
      const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
        ...args: Parameters<typeof setTimeout>
      ) => {
        const id = start(...args)
        timers.push(id)
        return id
      }) as typeof setTimeout)
      const wrapper = mount(
        defineComponent({ render: () => h('div', { 'data-demo': '' }, [h(mod.default)]) }),
        { attachTo: document.body, global: { components: { DemoBlock }, plugins: [router] } },
      )
      // The box the page is mounted into is the spec's.
      wrapper.element.parentElement!.setAttribute('data-demo', '')
      try {
        await nextTick()
        const found = new Set(missing(document.body))
        const buttons = [...document.body.querySelectorAll<HTMLElement>('button, [role="button"]')]
        for (const button of buttons.slice(0, PRESSES)) {
          button.click()
          await nextTick()
          missing(document.body).forEach((m) => found.add(m))
        }
        await new Promise((r) => setTimeout(r, 30))
        missing(document.body).forEach((m) => found.add(m))
        expect([...found]).toEqual([])
      } finally {
        wrapper.unmount()
        spy.mockRestore()
        timers.forEach(clearTimeout)
        document.body.innerHTML = ''
      }
    },
    SLOW,
  )
}
