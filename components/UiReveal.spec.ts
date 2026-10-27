import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  Transition,
  defineComponent,
  h,
  inject,
  nextTick,
  ref,
  type ComponentPublicInstance,
  type TransitionProps,
  type VNode,
} from 'vue'
import { ROW_INSET, SURFACE_GUTTER } from '../utils/surface'
import UiReveal from './UiReveal.vue'

// The harness stubs <Transition>; what can be checked is the contract: the
// block mounts and unmounts with `open`, and the transition is named.
describe('UiReveal', () => {
  it('The block comes with open and leaves with it.', async () => {
    const open = ref(false)
    const Host = defineComponent({
      render: () =>
        h(UiReveal, { open: open.value }, { default: () => h('div', { class: 'more' }, 'More') }),
    })
    const w = mount(Host)
    expect(w.find('.more').exists()).toBe(false)
    open.value = true
    await nextTick()
    expect(w.find('.more').exists()).toBe(true)
    open.value = false
    await nextTick()
    expect(w.find('.more').exists()).toBe(false)
  })

  it('It opens and closes by the ui-reveal transition.', () => {
    const w = mount(UiReveal, { props: { open: true }, slots: { default: '<div>x</div>' } })
    const transition = w.findComponent<ComponentPublicInstance<TransitionProps>>(Transition)
    expect(transition.props('name')).toBe('ui-reveal')
    expect(w.text()).toContain('x')
  })

  it('Without open and a trigger it stays closed: nothing toggles it.', () => {
    const w = mount(UiReveal, { slots: { default: '<div class="more">x</div>' } })
    expect(w.find('.more').exists()).toBe(false)
  })
})

describe('UiReveal — review follow-ups', () => {
  it('with v-model:open it hands the trigger its state, a toggle and the id it controls', async () => {
    const open = ref(false)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          {
            trigger: ({
              open: o,
              toggle,
              controls,
            }: {
              open: boolean
              toggle: () => void
              controls: string
            }) =>
              h(
                'button',
                {
                  class: 'go',
                  'aria-controls': controls,
                  'aria-expanded': String(o),
                  onClick: toggle,
                },
                'Reminders',
              ),
            default: () => h('div', { class: 'fields' }, 'Fields'),
          },
        ),
    })
    const w = mount(Host)
    const go = w.find('.go')
    expect(w.find('.fields').exists()).toBe(false)
    expect(go.attributes('aria-expanded')).toBe('false')
    await go.trigger('click')
    expect(w.find('.fields').exists()).toBe(true)
    expect(go.attributes('aria-expanded')).toBe('true')
    expect(w.find(`#${go.attributes('aria-controls')}`).exists()).toBe(true)
    await go.trigger('click')
    expect(w.find('.fields').exists()).toBe(false)
  })

  it('keeps class and data-testid reaching the rendered block once open is set', () => {
    const w = mount(UiReveal, {
      props: { open: true },
      attrs: { class: 'mt-6', 'data-testid': 'advanced' },
      slots: { trigger: () => h('button', 'Advanced'), default: () => 'Fields' },
    })
    const block = w.find('[data-testid="advanced"]')
    expect(block.exists()).toBe(true)
    expect(block.classes()).toContain('mt-6')
  })

  it('lines the revealed block up on the injected row inset, not a literal padding', () => {
    const w = mount(UiReveal, {
      props: { open: true },
      slots: { default: () => 'Fields' },
      global: { provide: { [ROW_INSET as symbol]: 'drawer' } },
    })
    expect(w.find('[id^="ui-reveal-"] > div > div').classes()).toContain('px-drawer')
  })

  it('returns focus to the trigger when the block collapses with focus inside it', async () => {
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value },
          {
            trigger: () => h('button', { class: 'go' }, 'Advanced'),
            default: () => h('input', { class: 'field' }),
          },
        ),
    })
    const w = mount(Host, { attachTo: document.body, global: { stubs: { transition: false } } })
    ;(w.find('.field').element as HTMLInputElement).focus()
    open.value = false
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('.go').element)
    w.unmount()
  })

  it('the animated element and its row carry no padding; the padded block is inside them', () => {
    const w = mount(UiReveal, {
      props: { open: true },
      global: { provide: { [ROW_INSET as symbol]: 'surface' } },
      slots: { default: 'Fields' },
    })
    const block = w.find('[id^="ui-reveal-"]')
    expect(block.classes().some((c) => /^p[bxy]?-/.test(c))).toBe(false)
    const row = block.element.firstElementChild as HTMLElement
    expect([...row.classList].some((c) => /^p[bxy]?-/.test(c))).toBe(false)
    expect(row.firstElementChild!.classList).toContain('pb-4')
  })

  it('returns focus to a switch inside a label row that names the block', async () => {
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          {
            trigger: ({ controls }: { controls: string }) =>
              h('label', [h('button', { role: 'switch', class: 'sw', 'aria-controls': controls })]),
            default: () => h('input', { class: 'field' }),
          },
        ),
    })
    const w = mount(Host, { attachTo: document.body, global: { stubs: { transition: false } } })
    ;(w.find('.field').element as HTMLElement).focus()
    open.value = false
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('.sw').element)
    w.unmount()
  })

  it("a caller's id names the block, so a control elsewhere can point at it", () => {
    const w = mount(UiReveal, {
      props: { open: true },
      attrs: { id: 'details' },
      slots: { default: 'x' },
    })
    expect(w.find('#details').exists()).toBe(true)
    expect(w.findAll('[id^="ui-reveal-"]')).toHaveLength(0)
  })
})

describe('UiReveal — review follow-ups, second pass', () => {
  const box = (w: ReturnType<typeof mount>) =>
    w.find('[id^="ui-reveal-"], #odd').element.firstElementChild!.firstElementChild as HTMLElement

  it('a class with a margin lands inside the animated row, not on it', () => {
    const w = mount(UiReveal, {
      props: { open: true },
      attrs: { class: 'mt-6', 'data-testid': 'more' },
      slots: { default: 'Fields' },
    })
    const block = w.find('[id^="ui-reveal-"]')
    expect(block.classes()).not.toContain('mt-6')
    expect(box(w).classList).toContain('mt-6')
    expect(block.attributes('id')).toBeDefined()
  })

  it('a reveal inside a reveal in a card of rows pads once', () => {
    const w = mount(UiReveal, {
      props: { open: true },
      global: { provide: { [ROW_INSET as symbol]: 'surface' } },
      slots: {
        default: () => h(UiReveal, { open: true, class: 'inner' }, { default: () => 'Deeper' }),
      },
    })
    const inner = w.find('.inner').element
    expect(inner.classList).toContain('pt-4')
    expect(inner.classList).not.toContain('px-surface')
    expect(box(w).classList).toContain('px-surface')
  })

  it('on a padded surface or none the block stands 16 under what is above it', () => {
    const padded = mount(UiReveal, {
      props: { open: true },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'surface' } },
      slots: { default: 'Fields' },
    })
    expect(box(padded).classList).toContain('pt-4')
    const none = mount(UiReveal, { props: { open: true }, slots: { default: 'Fields' } })
    expect(box(none).classList).toContain('pt-4')
    expect(box(none).classList).not.toContain('px-4')
  })

  it('the trigger keeps the row it stands in; only the block is on the gutter', () => {
    const Probe = defineComponent({
      setup: () => {
        const inset = inject(ROW_INSET, null)
        return () => h('span', { class: 'probe' }, String(inset))
      },
    })
    const w = mount(UiReveal, {
      props: { open: true },
      global: { provide: { [ROW_INSET as symbol]: 'surface' } },
      slots: { trigger: () => h(Probe), default: () => h(Probe) },
    })
    const [trigger, inside] = w.findAll('.probe')
    expect(trigger!.text()).toBe('surface')
    expect(inside!.text()).toBe('null')
  })

  it('a trigger slot without open still renders the trigger and opens the block', async () => {
    const w = mount(UiReveal, {
      slots: {
        trigger: ({ toggle }: { toggle: () => void }) =>
          h('button', { class: 'go', onClick: toggle }, 'More'),
        default: () => h('p', { class: 'more' }, 'More'),
      },
    })
    expect(w.find('.go').exists()).toBe(true)
    expect(w.find('.more').exists()).toBe(false)
    await w.find('.go').trigger('click')
    expect(w.find('.more').exists()).toBe(true)
    expect(w.emitted('update:open')![0]).toEqual([true])
  })

  it('controls points at the block only while it is shown', async () => {
    const seen: (string | undefined)[] = []
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value },
          {
            trigger: ({ controls }: { controls?: string }) => (seen.push(controls), h('i')),
            default: () => 'x',
          },
        ),
    })
    mount(Host)
    open.value = false
    await nextTick()
    expect(seen[0]).toMatch(/^ui-reveal-/)
    expect(seen.at(-1)).toBeUndefined()
  })

  it('a changed id on the block updates controls', async () => {
    let seen: string | undefined
    const id = ref('first')
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: true, id: id.value },
          {
            trigger: ({ controls }: { controls?: string }) => ((seen = controls), h('i')),
            default: () => 'x',
          },
        ),
    })
    const w = mount(Host)
    id.value = 'second'
    await nextTick()
    expect(seen).toBe('second')
    expect(w.find('#second').exists()).toBe(true)
  })

  it('a block with an odd id still returns focus to the trigger', async () => {
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h('div', [
          h('button', { class: 'go', 'aria-controls': 'a"b' }, 'Go'),
          h(
            UiReveal,
            { open: open.value, id: 'a"b' },
            { default: () => h('input', { class: 'field' }) },
          ),
        ]),
    })
    const w = mount(Host, { attachTo: document.body, global: { stubs: { transition: false } } })
    ;(w.find('.field').element as HTMLElement).focus()
    open.value = false
    await nextTick()
    expect(document.activeElement).toBe(w.find('.go').element)
    w.unmount()
  })

  it('closing a block no control names, with focus inside, returns focus to the element above', async () => {
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h('div', [
          h('button', { class: 'go' }, 'Go'),
          h(UiReveal, { open: open.value }, { default: () => h('input', { class: 'field' }) }),
        ]),
    })
    const w = mount(Host, { attachTo: document.body, global: { stubs: { transition: false } } })
    ;(w.find('.field').element as HTMLElement).focus()
    open.value = false
    await nextTick()
    expect(document.activeElement).toBe(w.find('.go').element)
    w.unmount()
  })
})

describe('UiReveal — reduced motion', () => {
  it('It opens and closes at once when the system asks for reduced motion.', () => {
    // The sliding height only decorates, so the reduced-motion floor takes it: the transition
    // carries no keep mark, and the keep rules do not name it.
    const w = mount(UiReveal, {
      props: { open: true },
      slots: { default: '<div>x</div>' },
      global: { stubs: { transition: false } },
    })
    expect(w.find('[data-row-block]').attributes()).not.toHaveProperty('data-motion-keep')
    const css = readFileSync(resolve(__dirname, '../assets/css/motion.css'), 'utf8')
    const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduce).toMatch(/transition-duration: 0\.01ms !important/)
    expect(reduce).not.toMatch(/ui-reveal/)
  })
})

describe('UiReveal — autofocus', () => {
  const host = (autofocus: boolean, start = false) =>
    defineComponent({
      setup: () => ({ open: ref(start) }),
      render() {
        return h(
          UiReveal,
          { open: this.open, autofocus, 'onUpdate:open': (v: boolean) => (this.open = v) },
          {
            trigger: ({ toggle, controls }: { toggle: () => void; controls?: string }) =>
              h('button', { class: 'go', 'aria-controls': controls, onClick: toggle }, 'Add'),
            default: () => h('input', { class: 'field' }),
          },
        )
      },
    })

  it('With autofocus, opening puts the focus in the first field of the block.', async () => {
    const w = mount(host(true), { attachTo: document.body })
    ;(w.find('.go').element as HTMLElement).focus()
    await w.find('.go').trigger('click')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.find('.field').element)
    w.unmount()
  })

  it('Without it, opening leaves the focus on the trigger, as a disclosure does.', async () => {
    const w = mount(host(false), { attachTo: document.body })
    ;(w.find('.go').element as HTMLElement).focus()
    await w.find('.go').trigger('click')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.find('.go').element)
    w.unmount()
  })

  it('A block shown with the page takes no focus, autofocus or not.', async () => {
    const w = mount(host(true, true), { attachTo: document.body })
    await nextTick()
    await nextTick()
    expect(w.find('.field').exists()).toBe(true)
    expect(document.activeElement).not.toBe(w.find('.field').element)
    w.unmount()
  })
})

describe('UiReveal — review follow-ups, autofocus', () => {
  it('autofocus skips a leading button and lands on the first field', async () => {
    const open = ref(false)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value, autofocus: true },
          {
            default: () => [
              h('button', { class: 'remove' }, 'Remove'),
              h('input', { class: 'field' }),
            ],
          },
        ),
    })
    const w = mount(Host, { attachTo: document.body })
    open.value = true
    await nextTick()
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.find('.field').element)
    w.unmount()
  })
})

describe('UiReveal — review follow-ups', () => {
  // The trigger takes `aria-controls` off in the same render that starts the leave, so the control
  // that names the block has to be found before it.
  const closeWith = async (trigger: (controls: string | undefined) => VNode | VNode[]) => {
    const open = ref(true)
    const Host = defineComponent({
      render: () =>
        h(
          UiReveal,
          { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
          {
            trigger: ({ controls }: { controls?: string }) => trigger(controls),
            default: () => h('button', { class: 'remove' }, 'Remove note'),
          },
        ),
    })
    const w = mount(Host, { attachTo: document.body, global: { stubs: { transition: false } } })
    ;(w.find('.remove').element as HTMLElement).focus()
    expect(document.activeElement).toBe(w.find('.remove').element)
    open.value = false
    await nextTick()
    return w
  }

  it('closing with the focus inside returns it to the switch that names the block, not the first control of the trigger', async () => {
    const w = await closeWith((controls) =>
      h('div', [
        h('button', { class: 'help' }, 'Help'),
        h('button', { role: 'switch', class: 'sw', 'aria-controls': controls }, 'Advanced'),
      ]),
    )
    expect(document.activeElement).toBe(w.find('.sw').element)
    w.unmount()
  })

  it('a trigger that ends in a line of text still gets the focus back on the control that names the block', async () => {
    const w = await closeWith((controls) => [
      h('button', { class: 'go', 'aria-controls': controls }, 'Advanced'),
      h('p', { class: 'hint' }, 'Shown to everyone on the team.'),
    ])
    expect(document.activeElement).toBe(w.find('.go').element)
    w.unmount()
  })
})
