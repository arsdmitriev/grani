import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import HintFor from './HintFor.vue'

const tips = () =>
  [...document.body.querySelectorAll('[role="tooltip"]')].map((t) => t.textContent?.trim())

describe('HintFor', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a reason bound first still wins over a name hint on the same element', async () => {
    const button = document.createElement('button')
    button.setAttribute('aria-disabled', 'true')
    document.body.appendChild(button)
    const anchor = ref<HTMLElement | null>(button)
    const w = mount(
      defineComponent({
        setup: () => () => [
          h(HintFor, { anchor, content: 'Paid invoices stay', reason: true }),
          h(HintFor, { anchor, content: 'Delete' }),
        ],
      }),
      { attachTo: document.body },
    )
    button.dispatchEvent(
      Object.assign(new Event('pointerenter', { bubbles: true }), { pointerType: 'mouse' }),
    )
    await new Promise((r) => setTimeout(r, 200))
    expect(tips()).toEqual(['Paid invoices stay'])
    w.unmount()
  })
})
