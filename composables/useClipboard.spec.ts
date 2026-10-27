import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useClipboard } from './useClipboard'

const host = (resetMs?: number) => {
  let api!: ReturnType<typeof useClipboard>
  const w = mount(
    defineComponent({
      setup() {
        api = useClipboard(resetMs)
        return () => h('i')
      },
    }),
  )
  return { w, api }
}

describe('useClipboard', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('copies the whole value and raises copied for the reset window', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { api } = host(1200)
    expect(await api.copy('613aa1c0ff4510e0')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('613aa1c0ff4510e0')
    expect(api.copied.value).toBe(true)
    vi.advanceTimersByTime(1199)
    expect(api.copied.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(api.copied.value).toBe(false)
  })

  it('resolves false without a clipboard or on a denied write, and never throws', async () => {
    vi.stubGlobal('navigator', {})
    expect(await host().api.copy('x')).toBe(false)
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) } })
    const { api } = host()
    expect(await api.copy('x')).toBe(false)
    expect(api.copied.value).toBe(false)
  })
})

describe('useClipboard — review follow-ups', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('a write that resolves after unmount starts no timer', async () => {
    vi.useFakeTimers()
    let resolve!: () => void
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) },
    })
    const { w, api } = host(1200)
    // Counted from here: the first app mounted in a file starts Vue's 3 s wait for devtools.
    const before = vi.getTimerCount()
    const pending = api.copy('x')
    w.unmount()
    resolve()
    await pending
    expect(vi.getTimerCount()).toBe(before)
    expect(api.copied.value).toBe(false)
  })
})

describe('useClipboard — without the Clipboard API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(document, 'execCommand')
    document.body.innerHTML = ''
  })

  it('an insecure page copies the old way: the whole value, the focus kept where it was', async () => {
    vi.stubGlobal('navigator', {})
    let copiedText = ''
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn((cmd: string) => {
        const area = document.activeElement as HTMLTextAreaElement
        copiedText = cmd === 'copy' ? area.value.slice(area.selectionStart, area.selectionEnd) : ''
        return cmd === 'copy'
      }),
    })
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    expect(await host().api.copy('613aa1c0ff4510e0')).toBe(true)
    expect(copiedText).toBe('613aa1c0ff4510e0')
    expect(document.querySelector('textarea')).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  it('inside a panel that is not modal (a popover), the hidden field stands in the panel', async () => {
    vi.stubGlobal('navigator', {})
    let holder: Element | null = null
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => {
        holder = document.activeElement?.parentElement ?? null
        return true
      }),
    })
    const panel = document.createElement('div')
    panel.setAttribute('role', 'dialog')
    const button = document.createElement('button')
    panel.appendChild(button)
    document.body.appendChild(panel)
    button.focus()
    expect(await host().api.copy('x')).toBe(true)
    expect(holder).toBe(panel)
  })

  it('a focus trap that takes the focus back before the copy counts as refused, never a false Copied', async () => {
    vi.stubGlobal('navigator', {})
    const exec = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec })
    const button = document.createElement('button')
    document.body.appendChild(button)
    // A trap around another panel: whatever takes the focus outside it, the focus goes back.
    const trap = (e: FocusEvent) => {
      if (e.target instanceof HTMLTextAreaElement) button.focus()
    }
    document.addEventListener('focusin', trap)
    button.focus()
    expect(await host().api.copy('x')).toBe(false)
    expect(exec).not.toHaveBeenCalled()
    document.removeEventListener('focusin', trap)
  })

  it('a denied write tries the old way too before it says no', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) } })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => true) })
    expect(await host().api.copy('x')).toBe(true)
  })
})
