import axe from 'axe-core'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { expect, it } from 'vitest'

// Every demo, mounted as the showcase mounts it, then axe over the result: the rest state of each
// example answers for names, roles, labels, relations and landmarks. Color contrast is the contrast
// gate's (`scripts/contrast.mjs`): happy-dom lays nothing out, so that rule is off here.
const demos = import.meta.glob('../demos/*.demo.vue', { eager: true }) as Record<
  string,
  { default: Component }
>

// The showcase's block, reduced to what axe reads: a section with its title, under the page's
// own heading, so a heading inside a component is judged by its level, not by a missing h1.
const DemoBlock = defineComponent({
  props: { title: { type: String, required: true }, row: Boolean, wide: Boolean },
  setup(props, { slots }) {
    return () => h('section', [h('h2', props.title), slots.default?.()])
  },
})
const Page = (demo: Component) =>
  defineComponent({ render: () => h('div', [h('h1', 'Demo'), h(demo)]) })

// Contrast is measured by the contrast gate; a demo stacks variants of one block on one page, so
// a landmark repeated there (two searches, two paginations, the main of three shells) is the
// page's to name or to hold once, not the demo's.
const RULES = {
  'color-contrast': { enabled: false },
  'landmark-unique': { enabled: false },
  'landmark-no-duplicate-main': { enabled: false },
  'landmark-main-is-top-level': { enabled: false },
}

// Mounting a demo and running axe over it takes 0.3 to 1.4 s on a machine at rest; the gates' own
// load (the unit specs with coverage, nine forks) took the largest demos past 5 s (UiTable, 22.10).
// The limit is for a hang, not for speed: what the test checks is the same at any pace.
const SLOW = 20_000
// A test that ran out of time leaves its run going, and axe refuses a second run beside it
// ("Axe is already running"): each run waits for the one before, so one slow demo fails alone.
let running: Promise<unknown> = Promise.resolve()

for (const [path, mod] of Object.entries(demos)) {
  const name = path.split('/').pop()!.replace('.demo.vue', '')
  it(
    `${name}: the demo passes axe`,
    async () => {
      // A demo may read the route (a shell with its own links): a router with one page is enough.
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { render: () => null } }],
      })
      await router.push('/')
      const wrapper = mount(Page(mod.default), {
        attachTo: document.body,
        global: { components: { DemoBlock }, plugins: [router] },
      })
      try {
        await nextTick()
        await running.catch(() => {})
        const run = axe.run(wrapper.element, { rules: RULES, resultTypes: ['violations'] })
        running = run
        const results = await run
        const violations = results.violations.map(
          (v) =>
            `${v.id}: ${v.help}\n` +
            v.nodes.map((n) => `  ${n.html.slice(0, 160)}\n    ${n.failureSummary}`).join('\n'),
        )
        expect(violations, violations.join('\n\n')).toEqual([])
      } finally {
        wrapper.unmount()
      }
    },
    SLOW,
  )
}
