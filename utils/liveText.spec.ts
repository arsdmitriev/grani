import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useLiveText } from './liveText'

describe('useLiveText', () => {
  it('is empty when drawn, takes its words a beat after mounting, then follows them', async () => {
    const words = ref('Loading…')
    const w = mount(
      defineComponent({
        setup() {
          const said = useLiveText(() => words.value)
          return () => h('p', { role: 'status' }, said.value)
        },
      }),
    )
    expect(w.text()).toBe('')
    await new Promise((r) => setTimeout(r, 60))
    await nextTick()
    expect(w.text()).toBe('Loading…')
    words.value = 'Updating…'
    await nextTick()
    expect(w.text()).toBe('Updating…')
    w.unmount()
  })
})
