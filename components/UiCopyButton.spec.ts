import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useToast } from '../composables/useToast'
import UiCopyButton from './UiCopyButton.vue'
import UiTruncate from './UiTruncate.vue'

const clipboard = (ok = true) => {
  const writeText = ok
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockRejectedValue(new Error())
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}
const flush = () => new Promise((r) => setTimeout(r, 0))
// What a screen reader hears: the one live region at the end of the page.
const said = () => document.getElementById('ui-announcer')?.textContent ?? ''
const settleAnnouncer = async () => {
  await new Promise((r) => setTimeout(r, 80))
  document.getElementById('ui-announcer')?.remove()
}

describe('UiCopyButton', () => {
  afterEach(async () => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    // A copy still on its way says its outcome late: let it land before the next test.
    await settleAnnouncer()
  })

  it('a glyph alone is an icon button named Copy; it copies the value whole', async () => {
    const writeText = clipboard()
    const w = mount(UiCopyButton, { props: { value: '613aa1c0ff4510e0' } })
    expect(w.find('button').attributes('aria-label')).toBe('Copy')
    await w.find('button').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith('613aa1c0ff4510e0')
    expect(w.emitted('copy')).toEqual([[true]])
  })

  it('after a copy the glyph is a check for 1.2 s, and a reader hears Copied outside the button', async () => {
    vi.useFakeTimers()
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'x' } })
    expect(w.find('svg.lucide-copy').exists()).toBe(true)
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(60)
    expect(w.find('svg.lucide-check').exists()).toBe(true)
    expect(said()).toBe('Copied')
    expect(w.find('[aria-live]').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(1200)
    expect(w.find('svg.lucide-copy').exists()).toBe(true)
  })

  it('truncate shows the id cut in the middle in monospace and copies it whole; the glyph waits for hover', async () => {
    const writeText = clipboard()
    const w = mount(UiCopyButton, { props: { value: '613aa1c0ff4510e0', truncate: 12 } })
    expect(w.text()).toContain('613aa1…4510e0')
    expect(w.classes()).toContain('font-mono')
    expect(w.find('svg').classes()).toEqual(
      expect.arrayContaining([
        'opacity-0',
        'group-[:enabled:hover]/copy:opacity-100',
        'group-focus-visible/copy:opacity-100',
      ]),
    )
    await w.find('button').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith('613aa1c0ff4510e0')
  })

  it('a line break or another control character in a truncated value is shown, never left invisible, though the copy carries it', async () => {
    const writeText = clipboard()
    const value = 'line one\nline two\tend'
    const w = mount(UiCopyButton, { props: { value, truncate: 40 } })
    expect(w.text()).toContain('⏎')
    expect(w.text()).toContain('␉')
    expect(w.text()).not.toContain('\n')
    const name = w.find('button').attributes('aria-label')!
    expect(name).toContain('⏎')
    expect(name).not.toContain('\n')
    await w.find('button').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith(value)
  })

  it('a label makes a text button; the glyph is shown while copied', async () => {
    vi.useFakeTimers()
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'v', label: 'Copy link', variant: 'outline' } })
    expect(w.text()).toContain('Copy link')
    expect(w.classes()).not.toContain('font-mono')
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('svg.lucide-check').classes()).not.toContain('opacity-0')
  })

  it('a refused clipboard emits copy false and shows no check', async () => {
    clipboard(false)
    const w = mount(UiCopyButton, { props: { value: 'v' } })
    await w.find('button').trigger('click')
    await flush()
    expect(w.emitted('copy')).toEqual([[false]])
    expect(w.find('svg.lucide-check').exists()).toBe(false)
    // The press did nothing, and the glyph says so for the window a check would stand.
    expect(w.find('svg.lucide-circle-alert').exists()).toBe(true)
    expect(w.find('button').attributes('data-outcome')).toBe('failed')
  })
})

describe('UiCopyButton — review follow-ups', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('a truncated id is named Copy plus its visible text, and Copied never joins the name', async () => {
    vi.useFakeTimers()
    clipboard()
    const w = mount(UiCopyButton, { props: { value: '613aa1c0ff4510e0', truncate: 12 } })
    expect(w.find('button').attributes('aria-label')).toBe('Copy 613aa1…4510e0')
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('button').attributes('aria-label')).toBe('Copy 613aa1…4510e0')
    const labeled = mount(UiCopyButton, { props: { value: 'v', label: 'Copy link' } })
    expect(labeled.find('button').attributes('aria-label')).toBe('Copy link')
  })

  it('a refused clipboard says Could not copy for the same window', async () => {
    vi.useFakeTimers()
    clipboard(false)
    const w = mount(UiCopyButton, { props: { value: 'v' } })
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(60)
    expect(said()).toBe('Could not copy to the clipboard')
  })

  it('a ghost text button draws no background at rest or on hover', () => {
    const w = mount(UiCopyButton, { props: { value: 'v', label: 'Copy link' } })
    expect(w.find('button').classes()).toContain('!bg-transparent')
  })

  it('an outline text button keeps its plate and shows its glyph at rest: no hole in a frame', () => {
    const w = mount(UiCopyButton, { props: { value: 'v', label: 'Copy link', variant: 'outline' } })
    expect(w.find('button').classes()).not.toContain('!bg-transparent')
    expect(w.find('svg').classes()).not.toContain('opacity-0')
  })

  it('the glyph answers its own enabled button, not a hovered ancestor group', () => {
    const w = mount(UiCopyButton, { props: { value: '613aa1c0ff4510e0', truncate: 12 } })
    const glyph = w.find('svg').classes()
    expect(w.find('button').classes()).toContain('group/copy')
    expect(glyph).not.toContain('group-hover:opacity-100')
    expect(glyph).toContain('group-[:enabled:hover]/copy:opacity-100')
  })

  it('on a device without hover the glyph is always shown', () => {
    const w = mount(UiCopyButton, { props: { value: 'v', label: 'Copy link' } })
    expect(w.find('svg').classes()).toContain('[@media(hover:none)]:opacity-100')
  })

  it('a new value drops the check at once, and a late write for the old one changes nothing', async () => {
    vi.useFakeTimers()
    let resolve: () => void = () => {}
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) },
    })
    const w = mount(UiCopyButton, { props: { value: 'old', toast: true } })
    await w.find('button').trigger('click')
    await w.setProps({ value: 'new' })
    resolve()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(60)
    expect(w.find('svg.lucide-check').exists()).toBe(false)
    // Nothing says the old value was copied.
    expect(said()).not.toBe('Copied')
  })

  it('a new value after a copy drops the check it had', async () => {
    vi.useFakeTimers()
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'old' } })
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('svg.lucide-check').exists()).toBe(true)
    await w.setProps({ value: 'new' })
    expect(w.find('svg.lucide-check').exists()).toBe(false)
  })

  it('an empty value copies nothing and the button is off', async () => {
    const writeText = clipboard()
    const shapes: { value: string; label?: string }[] = [
      { value: '' },
      { value: '', label: 'Copy link' },
    ]
    for (const props of shapes) {
      const w = mount(UiCopyButton, { props })
      expect(w.find('button').attributes('aria-disabled'), JSON.stringify(props)).toBe('true')
      await w.find('button').trigger('click')
      await flush()
      expect(w.emitted('copy')).toBeUndefined()
    }
    expect(writeText).not.toHaveBeenCalled()
  })

  it('disabled reaches the button in both shapes and refuses the copy', async () => {
    const writeText = clipboard()
    const shapes: { value: string; label?: string; disabled: boolean }[] = [
      { value: 'v', disabled: true },
      { value: 'v', label: 'Copy', disabled: true },
    ]
    for (const props of shapes) {
      const w = mount(UiCopyButton, { props })
      expect(w.find('button').attributes('disabled')).toBeDefined()
      await w.find('button').trigger('click')
      await flush()
    }
    expect(writeText).not.toHaveBeenCalled()
  })

  it('a standalone ghost text button has no negative margin: it would lie over a neighbor', () => {
    const w = mount(UiCopyButton, { props: { value: 'v', truncate: 12, size: 'xs' } })
    expect(
      w
        .find('button')
        .classes()
        .some((c) => c.startsWith('-m')),
    ).toBe(false)
  })

  it('label wins over truncate', () => {
    const w = mount(UiCopyButton, {
      props: { value: '613aa1c0ff4510e0', truncate: 12, label: 'Copy id' },
    })
    expect(w.text()).toContain('Copy id')
    expect(w.find('button').classes()).not.toContain('font-mono')
  })
})

describe('UiCopyButton — the toast', () => {
  afterEach(() => {
    useToast().close()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('with toast a copy raises one unread success toast, and a second click refreshes it', async () => {
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'v', toast: true } })
    await w.find('button').trigger('click')
    await flush()
    await w.find('button').trigger('click')
    await flush()
    const list = useToast().toasts.value
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ title: 'Copied', tone: 'success', announce: false })
  })

  it('a refused clipboard turns it into an error toast', async () => {
    clipboard(false)
    const w = mount(UiCopyButton, { props: { value: 'v' } })
    await w.find('button').trigger('click')
    await flush()
    expect(useToast().toasts.value[0]).toMatchObject({
      title: 'Could not copy to the clipboard',
      tone: 'danger',
    })
  })

  it('by default a success stays on the button: the check in view has said it', async () => {
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'v' } })
    await w.find('button').trigger('click')
    await flush()
    expect(useToast().toasts.value).toHaveLength(0)
  })

  it('a failure is a toast even without toast: a request is always answered', async () => {
    clipboard(false)
    const w = mount(UiCopyButton, { props: { value: 'v', toast: false } })
    await w.find('button').trigger('click')
    await flush()
    expect(useToast().toasts.value[0]).toMatchObject({
      title: 'Could not copy to the clipboard',
      tone: 'danger',
    })
  })
})

describe('UiCopyButton — verify follow-ups', () => {
  afterEach(() => {
    useToast().close()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('a copy overtaken by a new value raises no Copied toast', async () => {
    vi.useFakeTimers()
    let resolve: () => void = () => {}
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) },
    })
    const w = mount(UiCopyButton, { props: { value: 'old', toast: true } })
    await w.find('button').trigger('click')
    await w.setProps({ value: 'new' })
    resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(useToast().toasts.value).toHaveLength(0)
    expect(w.emitted('copy')).toEqual([[true]])
  })

  it('a second click on a copy toast hidden behind the limit brings it to the front', async () => {
    clipboard()
    const w = mount(UiCopyButton, { props: { value: 'v', toast: true } })
    await w.find('button').trigger('click')
    await flush()
    const first = useToast().toasts.value[0]!.id
    useToast().info('One')
    useToast().info('Two')
    useToast().info('Three')
    await w.find('button').trigger('click')
    await flush()
    const stack = useToast().stack.value
    expect(stack[0]!.title).toBe('Copied')
    expect(stack.some((t) => t.id === first)).toBe(false)
  })

  it('a second outcome within the window rewrites the live region', async () => {
    // The region is shared by every test: a late "Copied" of the one before must not land here.
    await settleAnnouncer()
    clipboard(false)
    const w = mount(UiCopyButton, { props: { value: 'v', toast: false } })
    // Vue drops a click in the millisecond its listener was attached (`_vts`), on the real clock:
    // wait it out before the fake one takes over.
    await new Promise((r) => setTimeout(r, 2))
    vi.useFakeTimers()
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(60)
    expect(said()).toBe('Could not copy to the clipboard')
    const region = document.getElementById('ui-announcer')!
    const texts: string[] = []
    const observer = new MutationObserver(() => texts.push(region.textContent ?? ''))
    observer.observe(region, { childList: true, characterData: true, subtree: true })
    await w.find('button').trigger('click')
    await vi.advanceTimersByTimeAsync(60)
    observer.disconnect()
    // Emptied, then said again: the reader hears the second outcome too.
    const cleared = texts.indexOf('')
    expect(cleared).toBeGreaterThanOrEqual(0)
    expect(texts.slice(cleared)).toContain('Could not copy to the clipboard')
  })
})

describe('UiCopyButton — inline', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is a word of the line: no plate, no padding, the value in monospace, a glyph always after it', async () => {
    const writeText = clipboard()
    const w = mount(UiCopyButton, {
      props: { value: 'INV-2040', truncate: 12, variant: 'inline', toast: false },
    })
    const b = w.find('button')
    expect(b.classes()).toContain('text-inherit')
    expect(b.classes()).toContain('font-mono')
    expect(b.classes().some((c) => /^(h|px)-/.test(c))).toBe(false)
    expect(b.find('svg.lucide-copy').classes()).not.toContain('opacity-0')
    expect(b.attributes('aria-label')).toBe('Copy INV-2040')
    await b.trigger('click')
    await flush()
    await new Promise((r) => setTimeout(r, 60))
    expect(writeText).toHaveBeenCalledWith('INV-2040')
    expect(said()).toBe('Copied')
  })
})

describe('UiCopyButton — review follow-ups', () => {
  it('flush pulls the text onto the column line by its own padding and border, per step', () => {
    for (const [size, cls] of [
      ['xs', '-ms-[11px]'],
      ['sm', '-ms-[13px]'],
      ['md', '-ms-[21px]'],
    ] as const) {
      const w = mount(UiCopyButton, {
        props: { value: 'INV-1', label: 'INV-1', size, flush: true },
      })
      expect(w.find('button').classes(), size).toContain(cls)
    }
    expect(
      mount(UiCopyButton, { props: { value: 'INV-1', label: 'INV-1' } })
        .find('button')
        .classes()
        .join(' '),
    ).not.toContain('-ms-')
  })

  it('warns in dev when flush is combined with an outline or inline button', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCopyButton, {
      props: { value: 'INV-1', label: 'INV-1', variant: 'outline', flush: true },
    })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('`flush` pulls a ghost button'))).toBe(
      true,
    )
    warn.mockRestore()
  })
})

describe('UiCopyButton — icon', () => {
  it('draws the caller’s glyph at rest instead of Copy', () => {
    const Glyph = defineComponent({ render: () => h('svg', { class: 'glyph-code' }) })
    const w = mount(UiCopyButton, { props: { value: 'x', icon: Glyph, ariaLabel: 'Copy code' } })
    expect(w.find('svg.glyph-code').exists()).toBe(true)
  })
})

describe('UiCopyButton — review follow-ups, second pass', () => {
  afterEach(async () => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    await settleAnnouncer()
    useToast().close()
  })

  it('a copy whose button left the view is still heard', async () => {
    vi.useFakeTimers()
    let resolve!: () => void
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) },
    })
    const w = mount(UiCopyButton, { props: { value: 'INV-1', toast: true, ariaLabel: 'Copy' } })
    await w.find('button').trigger('click')
    w.unmount()
    resolve()
    await vi.advanceTimersByTimeAsync(60)
    expect(said()).toBe('Copied')
  })

  it('two buttons that fail share one toast', async () => {
    clipboard(false)
    const toasts = useToast()
    const before = toasts.stack.value.length
    const a = mount(UiCopyButton, { props: { value: 'a' } })
    const b = mount(UiCopyButton, { props: { value: 'b' } })
    await a.find('button').trigger('click')
    await flush()
    await b.find('button').trigger('click')
    await flush()
    expect(toasts.stack.value.length - before).toBe(1)
  })

  it('a disabled inline button takes the disabled ink, with a reason or without', () => {
    for (const props of [{ value: '' }, { value: 'INV-1', disabled: true }]) {
      const w = mount(UiCopyButton, {
        props: { ...props, label: 'INV-1', variant: 'inline' as const, ariaLabel: 'Copy INV-1' },
      })
      const b = w.find('button')
      expect(b.classes(), JSON.stringify(props)).toContain('text-disabled-fg')
      expect(b.find('svg').classes()).toContain('text-disabled-fg')
    }
  })

  it('warns in dev when inline has no text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCopyButton, { props: { value: 'x', variant: 'inline' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`inline` is a word'))
    warn.mockRestore()
  })

  it('the outcome is said outside the button, in every shape', async () => {
    const shapes: { value: string; label?: string; variant?: 'inline' }[] = [
      { value: 'x' },
      { value: 'x', label: 'Copy link' },
      { value: 'x', label: 'INV', variant: 'inline' },
    ]
    for (const props of shapes) {
      const w = mount(UiCopyButton, { props })
      expect(w.find('[aria-live]').exists()).toBe(false)
    }
  })

  it('focus stays on the button after a copy', async () => {
    clipboard()
    const w = mount(UiCopyButton, { attachTo: document.body, props: { value: 'x' } })
    const b = w.find('button').element as HTMLButtonElement
    b.focus()
    await w.find('button').trigger('click')
    await flush()
    expect(document.activeElement).toBe(b)
    w.unmount()
  })
  it('copied the old way, through a field no one sees, the focus comes back to the button', async () => {
    vi.stubGlobal('navigator', {})
    const exec = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec })
    const w = mount(UiCopyButton, { attachTo: document.body, props: { value: 'x' } })
    const b = w.find('button').element as HTMLButtonElement
    b.focus()
    await w.find('button').trigger('click')
    await flush()
    expect(exec).toHaveBeenCalledWith('copy')
    expect(w.emitted('copy')).toEqual([[true]])
    expect(document.activeElement).toBe(b)
    w.unmount()
    Reflect.deleteProperty(document, 'execCommand')
  })
})

describe('UiCopyButton — review follow-ups', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })
  const described = (el: Element) =>
    (el.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())

  it('an empty value keeps the button in the Tab order and says there is nothing to copy', () => {
    for (const props of [
      {},
      { label: 'Copy link' },
      { label: 'INV-7', variant: 'inline' as const },
    ]) {
      const w = mount(UiCopyButton, { attachTo: document.body, props: { value: '', ...props } })
      const button = document.body.querySelector('button')!
      expect(button.disabled, JSON.stringify(props)).toBe(false)
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(described(button)).toContain('Nothing to copy')
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('disabled with a reason passes the reason on', () => {
    mount(UiCopyButton, {
      attachTo: document.body,
      props: { value: 'sk_live', disabled: true, disabledReason: 'Reveal the key first' },
    })
    expect(described(document.body.querySelector('button')!)).toContain('Reveal the key first')
  })

  it('a long inline label stands in a UiTruncate, the glyph kept', () => {
    const long = 'INV-2040-0613-VERY-LONG-REFERENCE-NUMBER'
    const w = mount(UiCopyButton, { props: { value: 'x', label: long, variant: 'inline' } })
    expect(w.findComponent(UiTruncate).props('text')).toBe(long)
    expect(w.find('svg.lucide-copy').exists()).toBe(true)
  })

  it('a number past the types does not take the page down', () => {
    expect(() => mount(UiCopyButton, { props: { value: 613 as never, truncate: 2 } })).not.toThrow()
  })
})

describe('UiCopyButton — review follow-ups', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  // A parent that listens for clicks, a row that opens on one: a refused press must not reach it.
  const inRow = (props: Record<string, unknown>) => {
    const heard: string[] = []
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('div', { onClick: () => heard.push('row') }, [h(UiCopyButton, props as never)]),
      }),
      { attachTo: document.body },
    )
    return { w, heard }
  }

  it('a press refused while it is off with a reason stays inside the button, in every shape', async () => {
    const writeText = clipboard()
    const shapes = [
      { value: '' },
      { value: '', label: 'Copy link' },
      { value: '', label: 'Copy link', variant: 'outline' },
      { value: '', label: 'INV-7', variant: 'inline' },
      {
        value: 'sk_live',
        disabled: true,
        disabledReason: 'Reveal first',
        label: 'Key',
        variant: 'inline',
      },
    ]
    for (const props of shapes) {
      const { w, heard } = inRow(props)
      await w.find('button').trigger('click')
      await flush()
      expect(heard, JSON.stringify(props)).toEqual([])
      expect(w.findComponent(UiCopyButton).emitted('copy'), JSON.stringify(props)).toBeUndefined()
      w.unmount()
    }
    expect(writeText).not.toHaveBeenCalled()
  })

  it('an inline button that can copy still lets its parent hear the click', async () => {
    clipboard()
    const { w, heard } = inRow({ value: 'INV-7', label: 'INV-7', variant: 'inline' })
    await w.find('button').trigger('click')
    await flush()
    expect(heard).toEqual(['row'])
    w.unmount()
  })
})
