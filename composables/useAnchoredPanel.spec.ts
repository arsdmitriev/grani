import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useAnchoredPanel } from './useAnchoredPanel'
import type { AnchorInput } from '../utils/anchorPosition'

// A host with a trigger, a panel and a close counter; the panel is always in the tree.
const Host = defineComponent({
  props: { start: { type: Boolean, default: false }, match: { type: Boolean, default: false } },
  setup(props, { expose }) {
    const open = ref(props.start)
    const trigger = ref<HTMLElement | null>(null)
    const panel = ref<HTMLElement | null>(null)
    let closes = 0
    const { panelStyle } = useAnchoredPanel({
      open,
      trigger,
      panel,
      matchTriggerWidth: props.match,
      close: () => {
        closes++
        open.value = false
      },
    })
    expose({ open, closes: () => closes, panelStyle })
    return () =>
      h('div', [
        h('button', { ref: trigger, class: 'trigger' }, 'open'),
        h('div', { ref: panel, class: 'panel', style: panelStyle.value }, 'panel'),
      ])
  },
})

type Vm = { open: boolean; closes: () => number; panelStyle: Record<string, string> }
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key }))
const down = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }))

let mounted: ReturnType<typeof mount>[] = []
afterEach(() => {
  for (const w of mounted) w.unmount()
  mounted = []
})
const host = (start = false, match = false) => {
  const w = mount(Host, { props: { start, match }, attachTo: document.body })
  mounted.push(w)
  return w
}

describe('useAnchoredPanel', () => {
  it('a closed panel is hidden; an open one gets a position', async () => {
    const w = host()
    const vm = w.vm as unknown as Vm
    expect(vm.panelStyle.visibility).toBe('hidden')
    vm.open = true
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(vm.panelStyle.top).toMatch(/px$/)
  })

  it('matchTriggerWidth writes the trigger width into the style on every pass', async () => {
    const w = host(true, true)
    const vm = w.vm as unknown as Vm
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(vm.panelStyle.width).toMatch(/px$/)
    expect((host(true).vm as unknown as Vm).panelStyle.width).toBeUndefined()
  })

  it('a pointer down outside closes, inside the trigger or the panel does not', async () => {
    const w = host(true)
    const vm = w.vm as unknown as Vm
    await w.vm.$nextTick()
    down(w.find('.trigger').element)
    down(w.find('.panel').element)
    expect(vm.closes()).toBe(0)
    down(document.body)
    expect(vm.closes()).toBe(1)
  })

  it('Escape closes the top panel only, the one below survives', async () => {
    const outer = host(true)
    const inner = host(true)
    await inner.vm.$nextTick()
    press('Escape')
    expect((inner.vm as unknown as Vm).closes()).toBe(1)
    expect((outer.vm as unknown as Vm).closes()).toBe(0)
    await inner.vm.$nextTick()
    press('Escape')
    expect((outer.vm as unknown as Vm).closes()).toBe(1)
  })

  it('unmounting an open panel removes its listeners', async () => {
    const w = host(true)
    const vm = w.vm as unknown as Vm
    await w.vm.$nextTick()
    w.unmount()
    mounted = []
    down(document.body)
    press('Escape')
    expect(vm.closes()).toBe(0)
  })
})

describe('useAnchoredPanel — review follow-ups', () => {
  // A trigger with a box of its own (happy-dom has no layout) and a panel 200 wide.
  const Placed = defineComponent({
    props: {
      dir: { type: String, default: 'ltr' },
      geometry: { type: Object, default: () => ({}) },
    },
    setup(props, { expose }) {
      const open = ref(false)
      const trigger = ref<HTMLElement | null>(null)
      const panel = ref<HTMLElement | null>(null)
      const { panelStyle } = useAnchoredPanel({
        open,
        trigger,
        panel,
        close: () => (open.value = false),
        geometry: () => props.geometry as Partial<AnchorInput>,
      })
      expose({ open, panelStyle })
      return () =>
        h('div', [
          h('button', { ref: trigger, style: { direction: props.dir } }, 'open'),
          h('div', { ref: panel, class: 'panel', style: panelStyle.value }, [
            h('button', { class: 'inside' }, 'Apply'),
          ]),
        ])
    },
  })
  type Placed = { open: boolean; panelStyle: Record<string, string> }
  const boxes = (w: ReturnType<typeof mount>, box: Partial<DOMRect>) => {
    const trigger = w.find('button').element
    trigger.getBoundingClientRect = () =>
      ({ width: 40, height: 40, top: 100, bottom: 140, left: 400, right: 440, ...box }) as DOMRect
    Object.defineProperty(w.find('.panel').element, 'offsetWidth', { value: 200 })
    Object.defineProperty(w.find('.panel').element, 'offsetHeight', { value: 100 })
  }
  const opened = async (props: Record<string, unknown>, box: Partial<DOMRect> = {}) => {
    const w = mount(Placed, { props, attachTo: document.body })
    mounted.push(w)
    boxes(w, box)
    const vm = w.vm as unknown as Placed
    vm.open = true
    for (let i = 0; i < 4; i++) await w.vm.$nextTick()
    return vm
  }

  it('align start and end follow the reading direction of the trigger', async () => {
    const left = async (dir: string, align: 'start' | 'end') =>
      (await opened({ dir, geometry: { align } })).panelStyle.left
    expect(await left('ltr', 'start')).toBe('400px')
    expect(await left('ltr', 'end')).toBe('240px')
    expect(await left('rtl', 'start')).toBe('240px')
    expect(await left('rtl', 'end')).toBe('400px')
  })
  it('a trigger scrolled out of the window takes its panel with it, and brings it back', async () => {
    const trigger = { top: -919, bottom: -883 }
    const vm = await opened({}, trigger)
    // Pinned at the top edge beside nothing, over whatever scrolled in under it: hidden instead.
    expect(vm.panelStyle.visibility).toBe('hidden')
    // Scrolled back: placed again, shown.
    Object.assign(trigger, { top: 100, bottom: 140 })
    window.dispatchEvent(new Event('scroll'))
    for (let i = 0; i < 3; i++) await Promise.resolve()
    expect(vm.panelStyle.visibility).toBeUndefined()
    expect(vm.panelStyle.top).toBe('146px')
  })

  it('the focus a hidden panel dropped goes back to its control when the trigger returns', async () => {
    const trigger = { top: 100, bottom: 140 }
    const vm = await opened({}, trigger)
    const inside = document.querySelector<HTMLElement>('.inside')!
    inside.focus()
    Object.assign(trigger, { top: -919, bottom: -883 })
    window.dispatchEvent(new Event('scroll'))
    for (let i = 0; i < 3; i++) await Promise.resolve()
    expect(vm.panelStyle.visibility).toBe('hidden')
    // A browser drops the focus of a control that is hidden.
    inside.blur()
    Object.assign(trigger, { top: 100, bottom: 140 })
    window.dispatchEvent(new Event('scroll'))
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(vm.panelStyle.visibility).toBeUndefined()
    expect(document.activeElement).toBe(inside)
  })

  it('a focus the person moved elsewhere meanwhile stays there', async () => {
    const trigger = { top: 100, bottom: 140 }
    await opened({}, trigger)
    const inside = document.querySelector<HTMLElement>('.inside')!
    inside.focus()
    Object.assign(trigger, { top: -919, bottom: -883 })
    window.dispatchEvent(new Event('scroll'))
    for (let i = 0; i < 3; i++) await Promise.resolve()
    const other = document.body.appendChild(document.createElement('button'))
    other.focus()
    Object.assign(trigger, { top: 100, bottom: 140 })
    window.dispatchEvent(new Event('scroll'))
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(document.activeElement).toBe(other)
  })

  it('a trigger only partly in the window keeps its panel in place', async () => {
    const vm = await opened({}, { top: -20, bottom: 20 })
    expect(vm.panelStyle.visibility).toBeUndefined()
  })
})
