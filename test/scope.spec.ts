import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { defineComponent, h, type Component } from 'vue'
import { createGrani } from '../plugin'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import UiConfirm from '../components/UiConfirm.vue'
import UiCrudDrawer from '../components/UiCrudDrawer.vue'
import UiDrawer from '../components/UiDrawer.vue'
import UiModal from '../components/UiModal.vue'
import UiToaster from '../components/UiToaster.vue'

// The app's toast and question reached from where there is no component: a click handler after
// an `await`, a timer.

let warn: MockInstance<typeof console.warn>
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => warn.mockRestore())
const warned = (text: string) => warn.mock.calls.some((c) => String(c[0]).includes(text))
const tick = () => new Promise((r) => setTimeout(r, 0))

const app = (...children: Component[]) =>
  mount(defineComponent({ render: () => children.map((c) => h(c)) }), {
    global: { plugins: [createGrani()] },
    attachTo: document.body,
  })

describe('a call outside setup', () => {
  it('a toast after an await in a click handler reaches the toaster of the one app', async () => {
    const Page = defineComponent({
      setup() {
        const save = async () => {
          await Promise.resolve()
          useToast().success('Saved')
        }
        return () => h('button', { onClick: save }, 'Save')
      },
    })
    const w = app(Page, UiToaster)
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.find('[role="region"]').text()).toContain('Saved')
    w.unmount()
  })

  it('a question from a timer opens the window of the one app and its answer settles', async () => {
    const w = app(UiConfirm)
    let answer: boolean | undefined
    setTimeout(
      () =>
        void useConfirm()
          .confirm('Leave?')
          .then((a) => (answer = a)),
      0,
    )
    await tick()
    await flushPromises()
    expect(w.text()).toContain('Leave?')
    const yes = w.findAll('button').find((b) => b.text() === 'Confirm')!
    await yes.trigger('click')
    await flushPromises()
    expect(answer).toBe(true)
    w.unmount()
  })
})

describe('hosts', () => {
  it('a toast with no toaster in the app warns once, a moment later', async () => {
    const Page = defineComponent({
      setup() {
        const toast = useToast()
        toast.info('One')
        toast.info('Two')
        return () => h('i')
      },
    })
    const w = app(Page)
    expect(warned('no <UiToaster />')).toBe(false)
    await tick()
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('no <UiToaster />'))).toHaveLength(1)
    w.unmount()
  })

  it('a toast shown before its toaster mounts in the same turn does not warn', async () => {
    const Page = defineComponent({
      setup() {
        useToast().info('Early')
        return () => h('i')
      },
    })
    const w = app(Page, UiToaster)
    await tick()
    expect(warned('no <UiToaster />')).toBe(false)
    w.unmount()
  })

  it('a question with no UiConfirm in the app warns', async () => {
    const Page = defineComponent({
      setup() {
        void useConfirm().confirm('Delete?')
        return () => h('i')
      },
    })
    const w = app(Page)
    await tick()
    expect(warned('no <UiConfirm />')).toBe(true)
    w.unmount()
  })

  it('in production a toast or a question with no host says nothing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const Page = defineComponent({
        setup() {
          useToast().info('One')
          void useConfirm().confirm('Delete?')
          return () => h('i')
        },
      })
      const w = app(Page)
      await tick()
      expect(warned('no <UiToaster />')).toBe(false)
      expect(warned('no <UiConfirm />')).toBe(false)
      w.unmount()
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('two apps with a toaster each are both right: no "mounted twice"', () => {
    const a = app(UiToaster)
    const b = app(UiToaster)
    expect(warned('mounted twice')).toBe(false)
    a.unmount()
    b.unmount()
  })
})

describe('two copies of grani of one line', () => {
  const loadCopy = async () => {
    vi.resetModules()
    const [plugin, confirm, host] = await Promise.all([
      import('../plugin'),
      import('../composables/useConfirm'),
      import('../components/UiConfirm.vue'),
    ])
    return {
      createGrani: plugin.createGrani,
      useConfirm: confirm.useConfirm,
      UiConfirm: host.default as Component,
    }
  }

  it("a question asked through one copy settles when the other copy's UiConfirm answers", async () => {
    const a = await loadCopy()
    const b = await loadCopy()
    let answer: boolean | undefined
    const Asker = defineComponent({
      setup() {
        const { confirm } = b.useConfirm()
        return () => h('button', { onClick: () => confirm('Archive?').then((x) => (answer = x)) })
      },
    })
    const w = mount(defineComponent({ render: () => [h(Asker), h(a.UiConfirm)] }), {
      global: { plugins: [a.createGrani()] },
    })
    await w.find('button').trigger('click')
    expect(w.text()).toContain('Archive?')
    const yes = w.findAll('button').find((x) => x.text() === 'Confirm')!
    await yes.trigger('click')
    await flushPromises()
    expect(answer).toBe(true)
    w.unmount()
  })
})

describe('createGrani({ teleport })', () => {
  // The real Teleport, not the harness's stub: where the overlay lands is the point.
  const open = (
    component: Component,
    props: Record<string, unknown>,
    teleport?: string | HTMLElement,
  ) =>
    mount(component, {
      props,
      slots: { default: () => 'inside' },
      global: { plugins: [createGrani({ teleport })], stubs: { teleport: false } },
      attachTo: document.body,
    })
  const cases: [string, Component, Record<string, unknown>][] = [
    ['UiModal', UiModal, { open: true, title: 'Window' }],
    ['UiDrawer', UiDrawer, { open: true, title: 'Panel' }],
    ['UiCrudDrawer', UiCrudDrawer, { open: true, title: 'Record' }],
    ['UiToaster', UiToaster, {}],
  ]

  it.each(cases)('%s goes to the selector the app names', (_, component, props) => {
    const target = document.createElement('div')
    target.id = 'overlays'
    document.body.append(target)
    const w = open(component, props, '#overlays')
    expect(target.children.length).toBeGreaterThan(0)
    w.unmount()
    target.remove()
  })

  it('takes an element as well, and goes to the body unset', () => {
    const target = document.createElement('section')
    document.body.append(target)
    const own = open(UiModal, { open: true, title: 'Window' }, target)
    expect(target.textContent).toContain('inside')
    own.unmount()
    target.remove()
    const plain = open(UiModal, { open: true, title: 'Window' })
    expect([...document.body.children].some((c) => c.textContent?.includes('inside'))).toBe(true)
    plain.unmount()
  })
})
