import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import { createGrani } from '../plugin'
import { settle } from '../test/settle'
import UiModal from '../components/UiModal.vue'
import UiPopover from '../components/UiPopover.vue'
import { useOverlayStack } from './useOverlayStack'

describe('useOverlayStack', () => {
  let leftover: symbol[] = []
  afterEach(() => {
    const { release } = useOverlayStack()
    for (const t of leftover) release(t)
    leftover = []
  })

  it('every acquire is a new token and the only one is on top', () => {
    const { acquire, isTop } = useOverlayStack()
    const a = acquire()
    leftover.push(a)
    expect(isTop(a)).toBe(true)
    const b = acquire()
    leftover.push(b)
    expect(a).not.toBe(b)
    expect(isTop(a)).toBe(false)
    expect(isTop(b)).toBe(true)
  })

  it('releasing the top restores the one below, three deep', () => {
    const { acquire, release, isTop } = useOverlayStack()
    const drawer = acquire()
    const modal = acquire()
    const popup = acquire()
    leftover.push(drawer, modal, popup)
    expect(isTop(popup)).toBe(true)
    release(popup)
    expect(isTop(modal)).toBe(true)
    release(modal)
    expect(isTop(drawer)).toBe(true)
  })

  it('counts the open layers: a shortcut under them is theirs', () => {
    const stack = useOverlayStack()
    const before = stack.count()
    const a = stack.acquire()
    const b = stack.acquire()
    expect(stack.count()).toBe(before + 2)
    stack.release(a)
    stack.release(b)
    expect(stack.count()).toBe(before)
  })

  it('no token (a server never acquires one) reads the step a fresh client open computes too, so hydration does not fight it over the style', () => {
    const { zIndex, acquire } = useOverlayStack()
    const server = zIndex(null)
    const freshClient = acquire()
    leftover.push(freshClient)
    expect(server).toBe(zIndex(freshClient))
  })
})

describe('useOverlayStack — two apps on one page', () => {
  it('each app has its own top: a layer opened in one does not take Escape from the other', () => {
    const one = createApp({ render: () => null }).use(createGrani())
    const two = createApp({ render: () => null }).use(createGrani())
    const a = one.runWithContext(() => useOverlayStack())
    const b = two.runWithContext(() => useOverlayStack())
    const drawer = a.acquire()
    const menu = b.acquire()
    expect(a.isTop(drawer)).toBe(true)
    expect(b.isTop(menu)).toBe(true)
    expect(a.count()).toBe(1)
    expect(b.count()).toBe(1)
    a.release(drawer)
    b.release(menu)
  })
})

describe('useOverlayStack — a layer of another app over a window', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a panel another app opens over a window holds the focus; the window takes it back once the panel closes', async () => {
    const hostA = document.body.appendChild(document.createElement('div'))
    const a = createApp(
      defineComponent(
        () => () =>
          h(UiModal, { open: true, title: 'Order' }, () => [
            h('input', { id: 'a-field' }),
            h('div', { id: 'b-host' }),
          ]),
      ),
    ).use(createGrani())
    a.mount(hostA)
    await settle()
    const open = ref(false)
    const b = createApp(
      defineComponent(
        () => () =>
          h(
            UiPopover,
            { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) },
            {
              trigger: () => h('button', { id: 'b-trigger', type: 'button' }, 'Filters'),
              default: () => h('button', { id: 'b-inside', type: 'button' }, 'Apply'),
            },
          ),
      ),
    ).use(createGrani())
    b.mount(document.getElementById('b-host')!)
    await settle()
    // Two traps that pull the focus from each other move it without end: count the moves.
    let moves = 0
    const count = () => moves++
    window.addEventListener('focusin', count, true)
    document.getElementById('b-trigger')!.focus()
    open.value = true
    await settle()
    document.getElementById('b-inside')!.focus()
    await settle()
    window.removeEventListener('focusin', count, true)
    expect(moves).toBeLessThan(10)
    expect(document.activeElement?.id).toBe('b-inside')
    open.value = false
    await settle()
    document.body.appendChild(document.createElement('button')).focus()
    await settle()
    expect(document.querySelector('[aria-modal="true"]')!.contains(document.activeElement)).toBe(
      true,
    )
    b.unmount()
    a.unmount()
  })
})
