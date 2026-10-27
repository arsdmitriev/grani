import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import UiTooltip from './UiTooltip.vue'
import UiModal from './UiModal.vue'
import { useOverlayStack } from '../composables/useOverlayStack'

const panel = () => document.body.querySelector<HTMLElement>('[role="tooltip"]')

const pointer = (el: Element, type: string, pointerType = 'mouse') => {
  const e = new Event(type, { bubbles: true })
  Object.assign(e, { pointerType })
  el.dispatchEvent(e)
}

const mountTip = (props: Record<string, unknown> = {}, attrs: Record<string, string> = {}) =>
  mount(UiTooltip, {
    props: { content: 'Export with the current filters', ...props },
    slots: { default: () => h('button', attrs, 'Export') },
    attachTo: document.body,
  })

// A keyboard focus comes after a key: the hint shows on it, not on a focus a script gives.
const tab = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

// Every tooltip on the page shares when the last hint closed (the warm row) and whether the last
// input was a key. Each test starts cold and after a pointer, whatever test ran before it: the
// last input is a pointer, and a faked clock starts an hour after the one before, so no hint an
// earlier test closed (however far it moved its clock) is a moment ago.
beforeEach(() => document.dispatchEvent(new Event('pointerdown')))
let clock = Date.now()
const coldClock = () => {
  vi.useFakeTimers()
  clock += 3_600_000
  vi.setSystemTime(clock)
}

describe('UiTooltip', () => {
  beforeEach(coldClock)
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('hover shows it after a short delay and describes the trigger; leaving hides it', async () => {
    const w = mountTip()
    const button = w.find('button').element
    pointer(w.find('button').element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(50)
    expect(panel()).toBeNull()
    await vi.advanceTimersByTimeAsync(100)
    expect(panel()?.textContent).toBe('Export with the current filters')
    expect(button.getAttribute('aria-describedby')).toBe(panel()!.id)
    pointer(w.find('button').element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).toBeNull()
    expect(button.hasAttribute('aria-describedby')).toBe(false)
  })

  it('builds its layer on the first show, not at mount, and that show has the entrance of every later one', async () => {
    // A table of a thousand rows holds a thousand cut cells and dates: an empty Teleport and
    // Transition each, at mount, cost a fifth of the table's first render.
    const before = document.body.childNodes.length
    const w = mount(UiTooltip, {
      props: { content: 'Export with the current filters' },
      slots: { default: () => h('button', 'Export') },
      attachTo: document.body,
      // The real Transition and Teleport, not the test stubs: the layer and its entrance are checked.
      global: { stubs: { transition: false, teleport: false } },
    })
    // The trigger alone: no anchors of a layer left in the page.
    expect(document.body.childNodes.length).toBe(before + 1)
    // The class the panel enters the page with, read before the next frame takes it off.
    let entered = ''
    const read = (records: MutationRecord[]) => {
      for (const r of records)
        if (r.type === 'attributes' && (r.target as Element).getAttribute('role') === 'tooltip')
          entered += ` ${r.oldValue ?? ''} ${(r.target as Element).className}`
    }
    const seen = new MutationObserver(read)
    seen.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    })
    pointer(w.find('button').element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    // Records not yet delivered are read before the disconnect, which would drop them. The frame
    // that takes the class off runs on happy-dom's own clock, not the faked one: when it has not
    // come yet, the class is still on the panel.
    read(seen.takeRecords())
    seen.disconnect()
    entered += ` ${panel()?.className ?? ''}`
    expect(panel()).not.toBeNull()
    expect(entered).toContain('ui-popover-enter-from')
    pointer(w.find('button').element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(500)
    w.unmount()
  })

  it('the pointer may move onto the tooltip without it hiding', async () => {
    const w = mountTip()
    pointer(w.find('button').element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    pointer(w.find('button').element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(50)
    pointer(panel()!, 'pointerenter')
    await vi.advanceTimersByTimeAsync(500)
    expect(panel()).not.toBeNull()
    pointer(panel()!, 'pointerleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).toBeNull()
  })

  it('keyboard focus shows it at once, blur hides it', async () => {
    const w = mountTip()
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()).not.toBeNull()
    await w.find('button').trigger('focusout')
    expect(panel()).toBeNull()
  })

  it('a focused trigger keeps it when the mouse leaves; a hovered one keeps it on blur', async () => {
    const w = mountTip()
    tab()
    await w.find('button').trigger('focusin')
    pointer(w.find('button').element, 'pointerenter')
    pointer(w.find('button').element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(500)
    expect(panel()).not.toBeNull()
    pointer(w.find('button').element, 'pointerenter')
    await w.find('button').trigger('focusout')
    expect(panel()).not.toBeNull()
    pointer(w.find('button').element, 'pointerleave')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).toBeNull()
  })

  it('a tap toggles it; a tap elsewhere hides it', async () => {
    const w = mountTip()
    pointer(w.find('button').element, 'pointerdown', 'touch')
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).not.toBeNull()
    pointer(w.find('button').element, 'pointerdown', 'touch')
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).toBeNull()
    pointer(w.find('button').element, 'pointerdown', 'touch')
    await vi.advanceTimersByTimeAsync(0)
    pointer(document.body, 'pointerdown', 'touch')
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).toBeNull()
  })

  it('a mouse press puts it away until the pointer leaves, focus included', async () => {
    const w = mountTip()
    const button = w.find('button').element
    pointer(button, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).not.toBeNull()
    pointer(button, 'pointerdown', 'mouse')
    await w.find('button').trigger('focusin')
    await vi.advanceTimersByTimeAsync(500)
    expect(panel()).toBeNull()
    pointer(button, 'pointerleave')
    pointer(button, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).not.toBeNull()
  })

  it('a mouse press does not toggle it; hover governs the mouse', async () => {
    const w = mountTip()
    pointer(w.find('button').element, 'pointerdown', 'mouse')
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).toBeNull()
  })

  it('Escape hides it', async () => {
    const w = mountTip()
    tab()
    await w.find('button').trigger('focusin')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).toBeNull()
  })

  it('no content: no tooltip and no description', async () => {
    for (const props of [{ content: '' }, { content: '   ' }]) {
      const w = mountTip(props)
      tab()
      await w.find('button').trigger('focusin')
      expect(panel()).toBeNull()
      expect(w.find('button').attributes('aria-describedby')).toBeUndefined()
      w.unmount()
    }
  })

  it('emptying content while shown retracts it', async () => {
    const w = mountTip()
    tab()
    await w.find('button').trigger('focusin')
    await w.setProps({ content: ' ' })
    expect(panel()).toBeNull()
    expect(w.find('button').attributes('aria-describedby')).toBeUndefined()
  })

  it('a description the caller adds while it is shown survives the close', async () => {
    const w = mountTip()
    const button = w.find('button').element
    tab()
    await w.find('button').trigger('focusin')
    button.setAttribute('aria-describedby', `${button.getAttribute('aria-describedby')} late-error`)
    await w.find('button').trigger('focusout')
    expect(button.getAttribute('aria-describedby')).toBe('late-error')
  })

  it("the caller's own description stays and comes back after", async () => {
    const w = mountTip({}, { 'aria-describedby': 'own-hint' })
    const button = w.find('button').element
    tab()
    await w.find('button').trigger('focusin')
    expect(button.getAttribute('aria-describedby')).toBe(`own-hint ${panel()!.id}`)
    await w.find('button').trigger('focusout')
    expect(button.getAttribute('aria-describedby')).toBe('own-hint')
  })

  it('adds no wrapper: the trigger stays the direct child of its parent', () => {
    const w = mount(
      {
        components: { UiTooltip },
        template: '<div id="p"><UiTooltip content="Hi"><button>x</button></UiTooltip></div>',
      },
      { attachTo: document.body },
    )
    expect(w.find('#p > button').exists()).toBe(true)
  })

  it('a component trigger gets the listeners on its root element', async () => {
    const Btn = { template: '<button class="own">Go</button>' }
    mount(UiTooltip, {
      props: { content: 'Hint' },
      slots: { default: () => h(Btn) },
      attachTo: document.body,
    })
    const button = document.body.querySelector('button.own')!
    tab()
    button.dispatchEvent(new Event('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).not.toBeNull()
    expect(button.getAttribute('aria-describedby')).toBe(panel()!.id)
  })

  it('a hint equal to the trigger name is not wired as its description', async () => {
    const w = mountTip({ content: 'Edit' }, { 'aria-label': 'Edit' })
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()?.textContent).toBe('Edit')
    expect(w.find('button').attributes('aria-describedby')).toBeUndefined()
  })

  it('a hint that repeats a description the trigger has is read once; other words join it', async () => {
    const said = document.createElement('span')
    said.id = 'held'
    said.textContent = 'Paid invoices stay'
    document.body.append(said)
    const same = mountTip({ content: 'Paid invoices stay' }, { 'aria-describedby': 'held' })
    tab()
    await same.find('button').trigger('focusin')
    expect(panel()?.textContent).toBe('Paid invoices stay')
    expect(same.find('button').attributes('aria-describedby')).toBe('held')
    same.unmount()
    const other = mountTip({ content: 'Export' }, { 'aria-describedby': 'held' })
    tab()
    await other.find('button').trigger('focusin')
    expect(other.find('button').attributes('aria-describedby')).toBe(`held ${panel()!.id}`)
  })

  it('around a component with several roots it stays closed and warns, not a dead second panel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Twin = { template: '<button>Go</button><span />' }
    mount(UiTooltip, {
      props: { content: 'Hint' },
      slots: { default: () => h(Twin) },
      attachTo: document.body,
    })
    document.body.querySelector('button')!.dispatchEvent(new Event('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    expect(panel()).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('single-root'))
    warn.mockRestore()
  })

  it('the tooltip is text only: no focusable content', async () => {
    const w = mountTip()
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()!.querySelector('a, button, input, [tabindex]')).toBeNull()
  })
})

describe('UiTooltip — review follow-ups', () => {
  const size = (w: number, h: number) => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(w)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(h)
  }
  const corner = (radius: string) => {
    const style = document.createElement('style')
    style.textContent = `[role="tooltip"] { border-top-left-radius: ${radius}; }`
    document.head.append(style)
  }
  const openAt = async (side: string, box: Partial<DOMRect>) => {
    const w = mountTip({ side })
    const button = w.find('button').element
    button.getBoundingClientRect = () =>
      ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0, ...box }) as DOMRect
    tab()
    await w.find('button').trigger('focusin')
    await nextTick()
    return panel()!.querySelector<HTMLElement>('[aria-hidden="true"]')!
  }

  afterEach(() => {
    vi.restoreAllMocks()
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('a tail on the left or right of a panel with no straight edge sits at its middle', async () => {
    size(200, 24)
    corner('12px')
    const tail = await openAt('left', { top: 100, left: 400, width: 60, height: 36 })
    expect(tail.style.right).toBe('-4px')
    expect(tail.style.top).toBe('8px')
  })

  it('a tail pushed toward a corner stays on the straight run past the radius', async () => {
    size(200, 24)
    corner('6px')
    const tail = await openAt('top', { top: 100, left: 0, width: 16, height: 16 })
    expect(parseFloat(tail.style.left)).toBeGreaterThanOrEqual(6 + 8 * Math.SQRT1_2 - 4 - 0.01)
  })

  it('a keyboard refocus after a mouse press shows it, not stuck behind the press guard', async () => {
    vi.useFakeTimers()
    const w = mountTip()
    const button = w.find('button').element
    pointer(button, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    pointer(button, 'pointerdown')
    await w.find('button').trigger('focusin')
    expect(panel()).toBeNull()
    await w.find('button').trigger('focusout')
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()).not.toBeNull()
  })

  it('a trigger that never gets a leave (pointer turned off while loading) shows on the next hover', async () => {
    vi.useFakeTimers()
    const w = mountTip()
    const button = w.find('button').element
    pointer(button, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    pointer(button, 'pointerdown')
    await w.find('button').trigger('focusin')
    await w.find('button').trigger('focusout')
    pointer(button, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    expect(panel()).not.toBeNull()
  })

  it('a shown tooltip takes no place in the overlay stack: the window under it keeps Escape', async () => {
    vi.useFakeTimers()
    const overlays = useOverlayStack()
    const dialog = overlays.acquire()
    const w = mountTip()
    pointer(w.find('button').element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(500)
    expect(panel()).not.toBeNull()
    expect(overlays.isTop(dialog)).toBe(true)
    overlays.release(dialog)
    w.unmount()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })
})

describe('UiTooltip — inside a trigger', () => {
  it('attributes set on the tooltip reach its trigger, so a popover can wire the button through it', () => {
    const w = mount(UiTooltip, {
      props: { content: 'Columns' },
      attrs: { id: 'cols', 'aria-haspopup': 'dialog', 'data-testid': 'x' },
      slots: { default: () => h('button', 'C') },
    })
    const b = w.find('button')
    expect(b.attributes('id')).toBe('cols')
    expect(b.attributes('aria-haspopup')).toBe('dialog')
    expect(b.attributes('data-testid')).toBe('x')
  })
})

describe('UiTooltip — review follow-ups, second pass', () => {
  beforeEach(coldClock)
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('a press outside a shown tooltip is not spent: the backdrop still closes the window under it', async () => {
    // A window takes its place on the stack with real time.
    vi.useRealTimers()
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Columns', open: true },
      slots: {
        default: () =>
          h(UiTooltip, { content: 'Reset to the default columns' }, () => h('button', 'Reset')),
      },
    })
    await nextTick()
    await nextTick()
    tab()
    document
      .querySelector<HTMLElement>('[role="dialog"] button:not([aria-label])')!
      .dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()
    expect(panel()).not.toBeNull()
    const backdrop = document.querySelector('[role="dialog"]')!.parentElement!
    backdrop.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(w.emitted('close')).toHaveLength(1)
    w.unmount()
  })

  it('Escape on a shown tooltip inside a modal hides the hint and leaves the modal open', async () => {
    // A window takes its place on the stack with real time.
    vi.useRealTimers()
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Columns', open: true },
      slots: {
        default: () =>
          h(UiTooltip, { content: 'Reset to the default columns' }, () => h('button', 'Reset')),
      },
    })
    await nextTick()
    await nextTick()
    const reset = document.querySelector<HTMLElement>('[role="dialog"] button:not([aria-label])')!
    tab()
    reset.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()
    expect(panel()).not.toBeNull()
    reset.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()
    expect(w.emitted('close')).toBeUndefined()
    // The next Escape is the window's.
    reset.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(w.emitted('close')).toHaveLength(1)
    w.unmount()
  })

  it('focus returned to the trigger by script after a mouse click does not show it', async () => {
    const w = mountTip()
    const button = w.find('button').element
    pointer(document.body, 'pointerdown')
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('a listener set on the tooltip for focusout or pointerenter still runs beside the hint’s own', async () => {
    const blur = vi.fn()
    const enter = vi.fn()
    const w = mount(UiTooltip, {
      props: { content: 'Hint' },
      attrs: { onFocusout: blur, onPointerenter: enter },
      slots: { default: () => h('button', 'Go') },
      attachTo: document.body,
    })
    pointer(w.find('button').element, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    expect(enter).toHaveBeenCalled()
    expect(panel()).not.toBeNull()
    await w.find('button').trigger('focusout')
    expect(blur).toHaveBeenCalled()
    w.unmount()
  })

  it('long content with no break point wraps, and forced colors draw its edge', async () => {
    const w = mountTip({ content: 'an-id-with-no-spaces-' + 'x'.repeat(80) })
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()!.classList).toContain('break-words')
    expect(panel()!.className).toContain('outline-transparent')
    w.unmount()
  })

  it('after a press with no pointerleave, a later focus then blur hides the hint', async () => {
    const w = mountTip()
    const button = w.find('button').element
    pointer(button, 'pointerenter')
    pointer(button, 'pointerdown')
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()).not.toBeNull()
    await w.find('button').trigger('focusout')
    await vi.advanceTimersByTimeAsync(200)
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('removing the trigger while shown retracts the hint', async () => {
    const on = ref(true)
    const w = mount(
      {
        setup: () => () =>
          h(UiTooltip, { content: 'Hint' }, () => (on.value ? h('button', 'Go') : null)),
      },
      { attachTo: document.body },
    )
    tab()
    await w.find('button').trigger('focusin')
    expect(panel()).not.toBeNull()
    on.value = false
    await nextTick()
    await nextTick()
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('moving from one trigger straight to the next opens the second at once', async () => {
    const a = mountTip({ content: 'First' })
    const b = mountTip({ content: 'Second' })
    const [one, two] = [a.find('button').element, b.find('button').element]
    pointer(one, 'pointerenter')
    await vi.advanceTimersByTimeAsync(150)
    pointer(one, 'pointerleave')
    await vi.advanceTimersByTimeAsync(110)
    pointer(two, 'pointerenter')
    await nextTick()
    expect(panel()?.textContent).toContain('Second')
    a.unmount()
    b.unmount()
  })

  it('a touch tap on a trigger that opens a popover does not leave the hint over it', async () => {
    const w = mount(UiTooltip, {
      props: { content: 'Columns' },
      slots: { default: () => h('button', { 'aria-haspopup': 'dialog' }, 'Columns') },
      attachTo: document.body,
    })
    pointer(w.find('button').element, 'pointerdown', 'touch')
    await nextTick()
    expect(panel()).toBeNull()
    w.unmount()
    const cut = mountTip()
    pointer(cut.find('button').element, 'pointerdown', 'touch')
    await nextTick()
    expect(panel()).not.toBeNull()
    cut.unmount()
  })
})
