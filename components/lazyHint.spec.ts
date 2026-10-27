import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

describe('lazyHint — review follow-ups', () => {
  afterEach(() => {
    vi.doUnmock('./HintFor.vue')
    vi.resetModules()
    document.body.innerHTML = ''
  })

  it('asks for the hint again after its chunk failed to load', async () => {
    vi.resetModules()
    let asks = 0
    const Stub = defineComponent({
      setup: () => () => h('i', { 'data-hint': '' }, 'Paid invoices stay'),
    })
    vi.doMock('./HintFor.vue', () => {
      asks++
      if (asks === 1) throw new Error('chunk failed')
      return { default: Stub }
    })
    const { LazyHint } = await import('./lazyHint')

    const first = mount(LazyHint, { attachTo: document.body })
    await flushPromises()
    expect(first.find('[data-hint]').exists()).toBe(false)
    first.unmount()

    const second = mount(LazyHint, { attachTo: document.body })
    await flushPromises()
    expect(second.find('[data-hint]').exists()).toBe(true)
    second.unmount()
  })
})
