import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useSubmitLock } from './useSubmitLock'

const host = (submitting = ref(false)) => {
  const send = vi.fn()
  let api!: ReturnType<typeof useSubmitLock>
  const body = ref<HTMLElement | null>(null)
  const form = ref<HTMLFormElement | null>(null)
  mount(
    defineComponent({
      setup() {
        api = useSubmitLock({
          body,
          form,
          submitting: () => submitting.value,
          canSubmit: () => true,
          send,
        })
        return () => h('form', { ref: form }, [h('div', { ref: body }, [h('input')])])
      },
    }),
    { attachTo: document.body },
  )
  return { api, send, submitting, form }
}

describe('useSubmitLock', () => {
  it('one submit per request: locked until submitting falls or the person edits', async () => {
    const { api, send, submitting } = host()
    api.submit()
    api.submit()
    expect(send).toHaveBeenCalledTimes(1)
    submitting.value = true
    await nextTick()
    submitting.value = false
    await nextTick()
    api.submit()
    expect(send).toHaveBeenCalledTimes(2)
    api.unlock()
    api.submit()
    expect(send).toHaveBeenCalledTimes(3)
  })

  it('no submit while a request is out', () => {
    const { api, send } = host(ref(true))
    api.submit()
    expect(send).not.toHaveBeenCalled()
  })

  it('a second deliberate press sends again after a refusal that marked no field', () => {
    vi.useFakeTimers()
    try {
      const { api, send } = host()
      api.submit()
      // A double click: the second press comes within the double-click time and is swallowed.
      vi.advanceTimersByTime(200)
      api.submit()
      expect(send).toHaveBeenCalledTimes(1)
      // The host showed a toast and set nothing; a fresh press later is a new submit.
      vi.advanceTimersByTime(600)
      api.submit()
      expect(send).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a held key does not repeat the submit, however long it is held', async () => {
    vi.useFakeTimers()
    try {
      const { api, send, form } = host()
      await nextTick()
      api.submit()
      vi.advanceTimersByTime(1000)
      form.value!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }))
      api.submit()
      expect(send).toHaveBeenCalledTimes(1)
      form.value!.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }))
      api.submit()
      expect(send).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('a held key sends nothing after the request ended: the repeat is still the press that saved', async () => {
    const { api, send, submitting, form } = host()
    await nextTick()
    api.submit()
    submitting.value = true
    await nextTick()
    submitting.value = false
    await nextTick()
    form.value!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }))
    api.submit()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('a repeat whose keypress comes as an event of its own is still the held key', async () => {
    const { api, send, submitting, form } = host()
    await nextTick()
    api.submit()
    submitting.value = true
    await nextTick()
    submitting.value = false
    await nextTick()
    // A keyboard reaches Chromium as two input events, the keydown and then its keypress; the press
    // a repeat makes follows the keypress, and a task may run between the two.
    form.value!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }))
    await new Promise((r) => setTimeout(r))
    form.value!.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', repeat: true }))
    api.submit()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('a key that came up where the form does not hear it holds back no later press', async () => {
    const { api, send, form } = host()
    await nextTick()
    form.value!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }))
    api.submit()
    expect(send).not.toHaveBeenCalled()
    // The save closed the drawer and the key came up on the page: no keyup reached the form.
    await new Promise((r) => setTimeout(r))
    api.submit()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('no second submit while the request is out, however late the press', async () => {
    vi.useFakeTimers()
    try {
      const { api, send, submitting } = host()
      api.submit()
      submitting.value = true
      await nextTick()
      vi.advanceTimersByTime(5000)
      api.submit()
      expect(send).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
