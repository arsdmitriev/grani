import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, Fragment, h, nextTick, ref, type VNode } from 'vue'
import { useTrigger } from './useTrigger'

// A host that wires the caller's button the way a menu or a popover does.
function host(slot: () => VNode[], haspopup: 'menu' | 'dialog' = 'menu') {
  const open = ref(false)
  const onClick = vi.fn()
  const onKeydown = vi.fn()
  let api!: ReturnType<typeof useTrigger>
  const w = mount(
    defineComponent({
      setup() {
        api = useTrigger({
          slot,
          open,
          popupId: 'popup-1',
          haspopup,
          onClick,
          onKeydown,
          id: 'trigger-1',
        })
        return () => h('div', [h(api.Trigger)])
      },
    }),
    { attachTo: document.body },
  )
  return { w, open, onClick, onKeydown, api }
}

describe('useTrigger', () => {
  it("gives the caller's button an id, the popup it opens and its listeners", async () => {
    const { w, open, onClick, onKeydown } = host(() => [h('button', 'Actions')])
    const button = w.find('button')
    expect(button.attributes('id')).toBe('trigger-1')
    expect(button.attributes('aria-haspopup')).toBe('menu')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBeUndefined()
    await button.trigger('click')
    await button.trigger('keydown', { key: 'ArrowDown' })
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onKeydown).toHaveBeenCalledTimes(1)
    open.value = true
    await nextTick()
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-controls')).toBe('popup-1')
    w.unmount()
  })

  it("keeps the caller's own id, and the popup is labelled by it", () => {
    const { w, api } = host(() => [h('button', { id: 'mine' }, 'Open')], 'dialog')
    expect(w.find('button').attributes('id')).toBe('mine')
    expect(w.find('button').attributes('aria-haspopup')).toBe('dialog')
    expect(api.find()).toBe(w.find('button').element)
    expect(api.labelledBy.value).toBe('mine')
    w.unmount()
  })

  it("keeps the caller's own click handler beside its own", async () => {
    const own = vi.fn()
    const { w, onClick } = host(() => [h('button', { onClick: own }, 'Open')])
    await w.find('button').trigger('click')
    expect(own).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('finds the button inside a fragment passed on from a host of its own', () => {
    const { w } = host(() => [h(Fragment, [h('button', 'Inner')])])
    expect(w.find('button').attributes('id')).toBe('trigger-1')
    w.unmount()
  })

  it('an empty slot renders nothing and does not throw', () => {
    const { w } = host(() => [])
    expect(w.find('button').exists()).toBe(false)
    w.unmount()
  })
})
