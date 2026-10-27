import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiTooltip from './UiTooltip.vue'
import UiTruncate from './UiTruncate.vue'

// happy-dom lays nothing out: the widths are set by hand, as a column would.
const fit = (w: ReturnType<typeof mount>, scroll: number, client: number) => {
  const span = w.find('span').element
  Object.defineProperty(span, 'scrollWidth', { value: scroll, configurable: true })
  Object.defineProperty(span, 'clientWidth', { value: client, configurable: true })
}

describe('UiTruncate', () => {
  it('A cut text keeps its whole in a tooltip, while the cut is real.', async () => {
    const w = mount(UiTruncate, {
      props: { text: 'Contoso Pharmaceuticals and Laboratories' },
      global: { stubs: { Teleport: true } },
    })
    expect(w.find('span').classes()).toContain('truncate')
    fit(w, 320, 120)
    await w.find('span').trigger('pointerenter')
    expect(w.findComponent(UiTooltip).props('content')).toBe(
      'Contoso Pharmaceuticals and Laboratories',
    )
  })

  it('Text that fits gets no tooltip, and no native title either.', async () => {
    const w = mount(UiTruncate, {
      props: { text: 'Fabrikam' },
      global: { stubs: { Teleport: true } },
    })
    fit(w, 60, 120)
    await w.find('span').trigger('pointerenter')
    expect(w.findComponent(UiTooltip).props('content')).toBe('')
    expect(w.find('[title]').exists()).toBe(false)
  })

  it('lets a pixel of round-off pass', async () => {
    const w = mount(UiTruncate, {
      props: { text: 'Fabrikam' },
      global: { stubs: { Teleport: true } },
    })
    fit(w, 121, 120)
    await w.find('span').trigger('pointerenter')
    expect(w.findComponent(UiTooltip).props('content')).toBe('')
  })

  it('lands the caller attributes on the span', () => {
    const w = mount(UiTruncate, {
      props: { text: 'Fabrikam' },
      attrs: { class: 'text-fg-muted', 'data-testid': 'client' },
      global: { stubs: { Teleport: true } },
    })
    const span = w.find('span')
    expect(span.classes()).toContain('text-fg-muted')
    expect(span.attributes('data-testid')).toBe('client')
  })
})

describe('UiTruncate — review follow-ups', () => {
  it('The cut is measured again when the text changes.', async () => {
    const w = mount(UiTruncate, {
      props: { text: 'Fabrikam' },
      global: { stubs: { Teleport: true } },
    })
    fit(w, 60, 120)
    await w.find('span').trigger('pointerenter')
    expect(w.findComponent(UiTooltip).props('content')).toBe('')
    fit(w, 320, 120)
    await w.setProps({ text: 'Contoso Pharmaceuticals and Laboratories' })
    await flushPromises()
    expect(w.findComponent(UiTooltip).props('content')).toBe(
      'Contoso Pharmaceuticals and Laboratories',
    )
    fit(w, 60, 120)
    await w.setProps({ text: 'Fabrikam' })
    await flushPromises()
    expect(w.findComponent(UiTooltip).props('content')).toBe('')
  })

  it('an empty text is a cut of nothing: no tooltip', async () => {
    const w = mount(UiTruncate, { props: { text: '' }, global: { stubs: { Teleport: true } } })
    fit(w, 0, 120)
    await w.find('span').trigger('pointerenter')
    expect(w.findComponent(UiTooltip).props('content')).toBe('')
  })
})
