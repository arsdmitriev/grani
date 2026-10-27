import { config, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, watch } from 'vue'
import { Link } from '@lucide/vue'
import {
  TOAST_ACTION_DURATION,
  TOAST_ERROR_DURATION,
  TOAST_LIMIT,
  TOAST_DURATION,
  useToast,
  useToastHost,
} from '../composables/useToast'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiToaster from './UiToaster.vue'
import { createGrani } from '../plugin'

const mountToaster = () => mount(UiToaster, { attachTo: document.body })

describe('UiToaster', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('renders nothing until a toast comes, then a named region with the newest in front', async () => {
    const w = mountToaster()
    expect(w.find('[role="region"]').exists()).toBe(false)
    const toast = useToast()
    toast.success('First')
    toast.info('Second')
    await nextTick()
    const region = w.find('[role="region"]')
    expect(region.attributes('aria-label')).toBe('Notifications (F8)')
    const items = w.findAll('[data-index]')
    expect(items.map((i) => i.text())).toEqual(['Second', 'First'])
    expect(items[0]!.attributes('data-index')).toBe('0')
    w.unmount()
  })

  it('an error is an alert, the rest are status; the glyph follows the tone', async () => {
    const w = mountToaster()
    const toast = useToast()
    // The two regions stand on the page before any toast: one inserted with its text is not read.
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('[role="status"]').exists()).toBe(true)
    toast.error('Failed')
    toast.success('Done')
    await nextTick()
    // Read one after another.
    await vi.advanceTimersByTimeAsync(160)
    expect(w.find('[role="alert"]').text()).toBe('Failed')
    expect(w.find('[role="status"]').text()).toBe('Done')
    const [, behind] = w.findAll('[data-index]')
    expect(behind!.attributes('role')).toBeUndefined()
    expect(behind!.find('svg').classes()).toContain('text-danger-border')
    w.unmount()
  })

  it('toasts that come together are read in the order they came, one after another', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.success('First')
    toast.success('Second')
    toast.success('Third')
    await nextTick()
    const status = () => w.find('[role="status"]').text()
    // Each one: emptied, written 50 ms later, held 50 ms before the next.
    await vi.advanceTimersByTimeAsync(55)
    expect(status()).toBe('First')
    await vi.advanceTimersByTimeAsync(100)
    expect(status()).toBe('Second')
    await vi.advanceTimersByTimeAsync(100)
    expect(status()).toBe('Third')
    w.unmount()
  })

  it('the close button and Escape on a focused toast close it; the pointer on the stack holds the clocks', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.info('One')
    toast.info('Two')
    await nextTick()
    await w.find('button[aria-label="Close: Two"]').trigger('click')
    await nextTick()
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['One'])
    await w.find('[role="region"]').trigger('pointerenter')
    vi.advanceTimersByTime(TOAST_DURATION * 3)
    expect(toast.toasts.value).toHaveLength(1)
    await w.find('[role="region"]').trigger('pointerleave')
    vi.advanceTimersByTime(TOAST_DURATION)
    expect(toast.toasts.value).toHaveLength(0)
    toast.info('Three')
    await nextTick()
    await w.find('[data-index="0"]').trigger('keydown', { key: 'Escape' })
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('the action runs once and closes its toast', async () => {
    const w = mountToaster()
    const toast = useToast()
    const onClick = vi.fn()
    toast.show({ title: 'Invoice deleted', action: { label: 'Undo', onClick } })
    await nextTick()
    const undo = w.findAll('[data-index="0"] button').find((b) => b.text() === 'Undo')
    await undo!.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('beyond the limit a toast waits, inert and hidden; the pile opens under the pointer', async () => {
    const w = mountToaster()
    const toast = useToast()
    for (let i = 0; i < TOAST_LIMIT + 1; i++) toast.info(`Toast ${i}`)
    await nextTick()
    const items = w.findAll('[data-index]')
    expect(items).toHaveLength(TOAST_LIMIT + 1)
    expect(items[TOAST_LIMIT]!.attributes('inert')).toBeDefined()
    expect(items[TOAST_LIMIT]!.attributes('data-limited')).toBeDefined()
    expect(items[0]!.attributes('data-expanded')).toBeUndefined()
    await w.find('[role="region"]').trigger('pointerenter')
    expect(w.find('[data-index="0"]').attributes('data-expanded')).toBeDefined()
    w.unmount()
  })

  it('a swipe to the end or down closes the toast, a short one slides back', async () => {
    const w = mount(UiToaster, { props: { placement: 'bottom-end' }, attachTo: document.body })
    const toast = useToast()
    toast.info('Swipe me')
    await nextTick()
    const el = w.find('[data-index="0"]')
    await el.trigger('pointerdown', { button: 0, clientX: 0, clientY: 0, pointerId: 1 })
    await el.trigger('pointermove', { clientX: 20, clientY: 0, pointerId: 1 })
    await el.trigger('pointerup', { clientX: 20, clientY: 0, pointerId: 1 })
    expect(toast.toasts.value).toHaveLength(1)
    await el.trigger('pointerdown', { button: 0, clientX: 0, clientY: 0, pointerId: 1 })
    await el.trigger('pointermove', { clientX: 80, clientY: 0, pointerId: 1 })
    await el.trigger('pointerup', { clientX: 80, clientY: 0, pointerId: 1 })
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })
})

describe('UiToaster — review follow-ups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
    document.documentElement.removeAttribute('dir')
  })
  const swipe = async (el: ReturnType<ReturnType<typeof mount>['find']>, dx: number) => {
    await el.trigger('pointerdown', { button: 0, clientX: 100, clientY: 0, pointerId: 1 })
    await el.trigger('pointermove', { clientX: 100 + dx, clientY: 0, pointerId: 1 })
    await el.trigger('pointerup', { clientX: 100 + dx, clientY: 0, pointerId: 1 })
  }

  it('placement puts the stack at the start, the center or the end of the bottom edge', async () => {
    const toast = useToast()
    toast.info('Here')
    const where = [
      ['bottom-start', 'start-4'],
      ['bottom', 'mx-auto'],
      ['bottom-end', 'end-4'],
    ] as const
    for (const [placement, cls] of where) {
      const w = mount(UiToaster, { props: { placement }, attachTo: document.body })
      await nextTick()
      const regions = document.body.querySelectorAll('[role="region"]')
      expect([...regions].at(-1)!.classList.contains(cls), `${placement}: ${regions.length}`).toBe(
        true,
      )
      w.unmount()
    }
  })

  it('the stack stands at the start of the bottom edge unless told otherwise', async () => {
    const w = mountToaster()
    useToast().info('Here')
    await nextTick()
    const region = [...document.body.querySelectorAll('[role="region"]')].at(-1)!
    expect(region.classList.contains('start-4')).toBe(true)
    w.unmount()
  })

  it('a stack at the start closes on a swipe toward the start, not toward the center', async () => {
    const w = mount(UiToaster, { props: { placement: 'bottom-start' }, attachTo: document.body })
    const toast = useToast()
    toast.info('Swipe me')
    await nextTick()
    await swipe(w.find('[data-index="0"]'), 80)
    expect(toast.toasts.value).toHaveLength(1)
    await swipe(w.find('[data-index="0"]'), -80)
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('in a right-to-left page the end is on the left', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const w = mount(UiToaster, { props: { placement: 'bottom-end' }, attachTo: document.body })
    const toast = useToast()
    toast.info('Swipe me')
    await nextTick()
    w.find('[role="region"]').element.setAttribute('style', 'direction: rtl')
    await swipe(w.find('[data-index="0"]'), 80)
    expect(toast.toasts.value).toHaveLength(1)
    await swipe(w.find('[data-index="0"]'), -80)
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('a neutral toast has no glyph, an icon replaces the tone glyph and keeps its ink', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.show({ title: 'Draft saved' })
    await nextTick()
    expect(w.find('[data-index="0"] svg.lucide-info').exists()).toBe(false)
    toast.success('Link copied', { icon: Link })
    await nextTick()
    const glyph = w.find('[data-index="0"] svg.lucide-link')
    expect(glyph.exists()).toBe(true)
    expect(glyph.classes()).toContain('text-success-border')
    w.unmount()
  })

  it('a toast shown with announce false is not read, so it is not read twice', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.success('Copied', { announce: false })
    toast.info('Heard')
    await nextTick()
    // Every text the regions ever hold, read every 10 ms: the silent one is never among them.
    const written = new Set<string>()
    for (let i = 0; i < 40; i++) {
      await vi.advanceTimersByTimeAsync(10)
      for (const r of w.findAll('[role="status"], [role="alert"]')) written.add(r.text())
    }
    expect([...written].filter(Boolean)).toEqual(['Heard'])
    expect(w.findAll('[data-index]')).toHaveLength(2)
    w.unmount()
  })

  it('a persistent toast stays until closed', async () => {
    const toast = useToast()
    toast.error('Payment declined', { duration: 'persistent' })
    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(1)
  })

  it('a toast in a tone has its start edge in the tone, round with the card; a plain one has none', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.success('Saved')
    await nextTick()
    const card = w.find('[data-index="0"] > div')
    expect(card.classes()).toEqual(
      expect.arrayContaining(['rounded-overlay', 'border-s-[3px]', 'border-s-success-border']),
    )
    toast.show({ title: 'Plain fact' })
    await nextTick()
    expect(w.find('[data-index="0"] > div').classes()).not.toContain('border-s-[3px]')
    w.unmount()
  })
})

describe('UiToaster — review follow-ups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('two toasts have close buttons named for their own title, not both "Close"', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.success('Invoice sent')
    toast.error('Payment declined')
    await nextTick()
    const names = w.findAll('button[aria-label^="Close"]').map((b) => b.attributes('aria-label'))
    expect(names).toEqual(
      expect.arrayContaining(['Close: Invoice sent', 'Close: Payment declined']),
    )
    w.unmount()
  })

  it('a closed toast gives its measured height back', async () => {
    const w = mountToaster()
    const toast = useToast()
    for (let i = 0; i < 3; i++) toast.info(`Saved ${i}`)
    await nextTick()
    await nextTick()
    const heights = (w.vm as unknown as { heights: Map<number, number> }).heights
    expect(heights.size).toBe(3)
    toast.close()
    await nextTick()
    await nextTick()
    expect(heights.size).toBe(0)
    w.unmount()
  })
})

describe('UiToaster — review follow-ups, second pass', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('closing the last toast under the pointer releases the hold, so the next toast closes on its clock', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.info('One')
    await nextTick()
    await w.find('[role="region"]').trigger('pointerenter')
    await w.find('button[aria-label="Close: One"]').trigger('click')
    await nextTick()
    toast.info('Two')
    await nextTick()
    await vi.advanceTimersByTimeAsync(TOAST_DURATION + 10)
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('a second click on the action during the leave fade does not run it twice', async () => {
    const w = mountToaster()
    const toast = useToast()
    const undo = vi.fn()
    toast.show({ title: 'Deleted', action: { label: 'Undo', onClick: undo } })
    await nextTick()
    const button = w.findAll('button').find((b) => b.text() === 'Undo')!
    const el = button.element as HTMLButtonElement
    // Vue drops a click in the millisecond its listener was attached (`_vts`): wait it out.
    await vi.advanceTimersByTimeAsync(2)
    el.click()
    el.click()
    expect(undo).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  // The action is reached after the toast is read, by Tab or F8: a screen reader spends most of a
  // shorter stay on the title.
  it('a toast with an action stays 13 seconds unless the app says otherwise', () => {
    const toast = useToast()
    toast.show({ title: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    toast.show({ title: 'Archived', action: { label: 'Undo', onClick: () => {} }, duration: 4000 })
    expect(toast.toasts.value.map((t) => t.duration)).toEqual([13_000, 4000])
  })

  it('a toast with an action stays longer than one without', async () => {
    const toast = useToast()
    toast.show({ title: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    toast.show({ title: 'Saved' })
    expect(toast.toasts.value.map((t) => t.duration)).toEqual([
      TOAST_ACTION_DURATION,
      TOAST_DURATION,
    ])
    await vi.advanceTimersByTimeAsync(TOAST_DURATION + 10)
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['Deleted'])
    await vi.advanceTimersByTimeAsync(TOAST_ACTION_DURATION - TOAST_DURATION)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('a toast beyond the limit does not run its clock until it is shown', async () => {
    const toast = useToast()
    toast.error('Payment declined')
    for (let i = 0; i < TOAST_LIMIT; i++) toast.info(`Later ${i}`, { duration: 'persistent' })
    await vi.advanceTimersByTimeAsync(20000)
    expect(toast.toasts.value.some((t) => t.title === 'Payment declined')).toBe(true)
    // Room in the stack: its clock starts now.
    toast.close(toast.toasts.value.at(-1)!.id)
    await vi.advanceTimersByTimeAsync(7100)
    expect(toast.toasts.value.some((t) => t.title === 'Payment declined')).toBe(false)
  })

  it('update of a persistent toast to another tone keeps it persistent', async () => {
    const toast = useToast()
    const id = toast.show({ title: 'Offline', duration: 'persistent' })
    toast.update(id, { tone: 'warning', title: 'Still offline' })
    await vi.advanceTimersByTimeAsync(30000)
    expect(toast.toasts.value[0]?.duration).toBe('persistent')
  })

  it('moving the pointer out keeps the clocks held while focus is inside, and the reverse', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.info('One')
    await nextTick()
    const region = w.find('[role="region"]')
    await region.trigger('pointerenter')
    await region.trigger('focusin')
    await region.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(TOAST_DURATION + 10)
    expect(toast.toasts.value).toHaveLength(1)
    await region.trigger('focusout', { relatedTarget: document.body })
    await vi.advanceTimersByTimeAsync(TOAST_DURATION + 10)
    expect(toast.toasts.value).toHaveLength(0)
    w.unmount()
  })

  it('the stack keeps the safe area clear, stands at the top on a phone and lets no touch scroll it away', async () => {
    const w = mountToaster()
    useToast().info('One')
    await nextTick()
    expect(w.find('[role="region"]').classes()).toContain(
      'bottom-[max(1rem,env(safe-area-inset-bottom))]',
    )
    expect(w.find('[data-index]').classes()).toContain('[touch-action:none]')
    w.unmount()
    const was = window.matchMedia
    window.matchMedia = ((q: string) =>
      ({
        matches: true,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia
    try {
      const phone = mountToaster()
      useToast().info('Two')
      await nextTick()
      expect(phone.find('[role="region"]').classes()).toContain(
        'top-[max(1rem,env(safe-area-inset-top))]',
      )
      expect(phone.find('[data-index]').classes()).toContain('top-0')
      phone.unmount()
    } finally {
      window.matchMedia = was
    }
  })

  it('a pointercancel clears the swipe and does not close a toast', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.info('One')
    await nextTick()
    const item = w.find('[data-index]')
    item.element.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, clientX: 0, clientY: 0, bubbles: true }),
    )
    item.element.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 0, clientY: 100, bubbles: true }),
    )
    item.element.dispatchEvent(
      new PointerEvent('pointercancel', { clientX: 0, clientY: 100, bubbles: true }),
    )
    await nextTick()
    expect(toast.toasts.value).toHaveLength(1)
    w.unmount()
  })

  it('a long unbroken title wraps inside the card and a long detail is cut at three lines', async () => {
    const w = mountToaster()
    useToast().info('https://example.test/' + 'a'.repeat(120), { description: 'x '.repeat(200) })
    await nextTick()
    const [title, detail] = w.findAll('[data-index] p')
    expect(title!.classes()).toContain('break-words')
    expect(detail!.classes()).toEqual(expect.arrayContaining(['line-clamp-3', 'break-words']))
    w.unmount()
  })

  it('a second toaster warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const a = mountToaster()
    const b = mountToaster()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mounted twice'))
    a.unmount()
    b.unmount()
    warn.mockRestore()
  })

  // Toasts never come back from the page: `sharedSnapshot` writes none, and one written into the
  // page by anything else (a toast with an attacker's words) is dropped, not drawn.
  it('a toast written into the page is not drawn: the seed takes no toasts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const server = {
      id: 7,
      title: 'Pay to this account',
      duration: TOAST_DURATION,
      priority: 'low' as const,
    }
    const grani = createGrani({ shared: { 'grani:toasts': [server] } })
    const toast = grani.toast
    const w = mount(UiToaster, { attachTo: document.body, global: { plugins: [grani] } })
    expect(toast.toasts.value).toEqual([])
    expect(w.text()).not.toContain('Pay to this account')
    expect(toast.show({ title: 'New' })).toBeGreaterThan(0)
    warn.mockRestore()
    w.unmount()
  })
})

describe('UiToaster — the keyboard reaches it from anywhere', () => {
  beforeEach(() => vi.useFakeTimers())
  const mounted: { unmount(): void }[] = []
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount())
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const f8 = () =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F8', bubbles: true, cancelable: true }),
    )
  const escape = () =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
  // The real Teleport and transitions: the stub teleport re-creates the region when it updates,
  // and the focus in a toast would drop with it.
  const stubs = config.global.stubs
  beforeEach(() => (config.global.stubs = {}))
  afterEach(() => (config.global.stubs = stubs))
  const mountReal = () => void mounted.push(mount(UiToaster, { attachTo: document.body }))
  const mountDrawer = () =>
    void mounted.push(
      mount(UiCrudDrawer, {
        attachTo: document.body,
        props: { title: 'Santa', open: true },
        slots: { default: () => h('input', { class: 'name' }) },
      }),
    )
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await vi.advanceTimersByTimeAsync(1)
  }

  it('F8 moves the focus to the newest toast action; the region names the key', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    useToast().info('Older')
    useToast().success('Invoice archived', { action: { label: 'Undo', onClick: () => {} } })
    await settle()
    expect(document.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe(
      'Notifications (F8)',
    )
    f8()
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Undo')
    // F8 again goes back where the person was.
    f8()
    await settle()
    expect(document.activeElement).toBe(field)
  })

  it('a held F8 goes to the toast once: its repeats do not take the focus back and forth', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    useToast().success('Invoice archived', { action: { label: 'Undo', onClick: () => {} } })
    await settle()
    f8()
    await settle()
    for (let i = 0; i < 3; i++) {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'F8', repeat: true, bubbles: true, cancelable: true }),
      )
      await settle()
    }
    expect(document.activeElement?.textContent?.trim()).toBe('Undo')
  })

  it('inside an open drawer: the trap lets the focus into the toast, the clock holds, Escape goes back', async () => {
    mountReal()
    mountDrawer()
    await settle()
    const field = document.querySelector<HTMLElement>('.name')!
    expect(document.activeElement).toBe(field)
    const undo = vi.fn()
    useToast().success('Line removed', { action: { label: 'Undo', onClick: undo } })
    await settle()
    f8()
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('Undo')
    // The clock is held while the focus is in the toast.
    await vi.advanceTimersByTimeAsync(TOAST_ACTION_DURATION * 2)
    expect(useToast().toasts.value).toHaveLength(1)
    escape()
    await settle()
    expect(useToast().toasts.value).toHaveLength(0)
    expect(document.activeElement).toBe(field)
  })

  it('running the action from the keyboard gives the focus back where it came from', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    const undo = vi.fn()
    useToast().success('Line removed', { action: { label: 'Undo', onClick: undo } })
    await settle()
    f8()
    await settle()
    ;(document.activeElement as HTMLElement).click()
    await settle()
    expect(undo).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(field)
  })

  it('an open drawer does not pull back a focus that went into the toaster', async () => {
    mountReal()
    mountDrawer()
    await settle()
    useToast().info('Saved')
    await settle()
    const close = document.querySelector<HTMLElement>('[role="region"] button')!
    close.focus()
    await settle()
    expect(document.activeElement).toBe(close)
  })

  it('F8 with no toast does nothing and leaves the key to the page', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    expect(f8()).toBe(true)
    expect(document.activeElement).toBe(field)
  })
})

describe('UiToaster — the time an action has left', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
  const time = (w: ReturnType<typeof mountToaster>) => w.find('[data-toast-time]')
  const undo = { label: 'Undo', onClick: () => {} }

  it('A toast with an action shows its time as a haze over its whole stay; a plain one has none.', async () => {
    const w = mountToaster()
    useToast().show({ title: 'Invoice deleted', action: undo })
    await nextTick()
    expect(time(w).exists()).toBe(true)
    expect(time(w).attributes('style')).toContain(`animation-duration: ${TOAST_ACTION_DURATION}ms`)
    expect(time(w).attributes('aria-hidden')).toBe('true')
    useToast().close()
    useToast().success('Saved')
    await nextTick()
    expect(time(w).exists()).toBe(false)
    w.unmount()
  })

  it('The haze stands still while the pointer is on the toaster, as the clock does.', async () => {
    const w = mountToaster()
    useToast().show({ title: 'Invoice deleted', action: undo })
    await nextTick()
    expect(time(w).attributes('style')).toContain('animation-play-state: running')
    await w.find('[role="region"]').trigger('pointerenter')
    await nextTick()
    expect(time(w).attributes('style')).toContain('animation-play-state: paused')
    w.unmount()
  })

  it('Under reduced motion the seconds left stand beside the action instead of the haze.', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const w = mountToaster()
    useToast().show({ title: 'Invoice deleted', action: undo, duration: 5000 })
    await nextTick()
    expect(time(w).exists()).toBe(false)
    expect(w.find('[data-toast-seconds]').text()).toBe('5')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(w.find('[data-toast-seconds]').text()).toBe('3')
    w.unmount()
  })
})

describe('UiToaster — review follow-ups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('A loading toast that gives way to its outcome with the focus in it gives the focus back.', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    const w = mountToaster()
    let settle!: () => void
    useToast().promise(new Promise<void>((r) => (settle = r)), {
      loading: 'Sending',
      success: 'Sent',
      error: 'Failed',
    })
    await nextTick()
    opener.focus()
    const close = w.find('[role="region"] button[aria-label^="Close"]').element as HTMLElement
    close.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: opener }))
    close.focus()
    settle()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()
    expect(document.activeElement).toBe(opener)
    w.unmount()
    opener.remove()
  })

  it('After a pause in its last second, the haze starts again from the time the clock has left.', async () => {
    const w = mountToaster()
    useToast().show({
      title: 'Invoice deleted',
      action: { label: 'Undo', onClick: () => {} },
      duration: 5000,
    })
    await nextTick()
    vi.advanceTimersByTime(4900)
    await w.find('[role="region"]').trigger('pointerenter')
    await nextTick()
    await w.find('[role="region"]').trigger('pointerleave')
    await nextTick()
    // The resume gave the clock a second: the haze stands at four seconds spent, not at the end.
    expect(w.find('[data-toast-time]').attributes('style')).toContain('animation-delay: -4000ms')
    w.unmount()
  })

  it('Neighbors closing around it do not move the haze: its start is set once, not on every render.', async () => {
    const w = mountToaster()
    const toast = useToast()
    toast.success('One')
    toast.success('Two')
    toast.show({ title: 'Invoice deleted', action: { label: 'Undo', onClick: () => {} } })
    await nextTick()
    const before = w.find('[data-toast-time]').attributes('style')
    vi.advanceTimersByTime(3000)
    toast.close(toast.toasts.value[0]!.id)
    await nextTick()
    expect(w.find('[data-toast-time]').attributes('style')).toBe(before)
    w.unmount()
  })
})

describe('UiToaster — review follow-ups, the icon', () => {
  afterEach(() => useToast().close())

  // A stateful component given as the icon is kept as it is: put in the store as it was, it would be
  // made reactive, which Vue warns about and pays for on every change of the stack.
  it('a component icon stays a plain component in the store', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Mark = {
      name: 'Mark',
      data: () => ({ on: true }),
      render: () => h('i', { class: 'mark' }),
    }
    const w = mountToaster()
    const toast = useToast()
    const id = toast.show({ title: 'Synced', icon: Mark })
    await nextTick()
    toast.update(id, { title: 'Synced again', icon: Mark })
    await nextTick()
    expect(w.find('.mark').exists()).toBe(true)
    expect(warn.mock.calls.filter(([m]) => /reactive object/.test(String(m)))).toEqual([])
    warn.mockRestore()
    w.unmount()
  })
})

describe('UiToaster — review follow-ups, the same toast again', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('a toast shown again while it stands is one card, read again', async () => {
    const w = mountToaster()
    const toast = useToast()
    const alert = () => w.find('[role="alert"]').text()
    toast.error('Could not save')
    await nextTick()
    await vi.advanceTimersByTimeAsync(160)
    expect(alert()).toBe('Could not save')
    toast.error('Could not save')
    await nextTick()
    expect(w.findAll('[data-index]')).toHaveLength(1)
    // Emptied first, then written again: the reader hears it a second time.
    await vi.advanceTimersByTimeAsync(10)
    expect(alert()).toBe('')
    await vi.advanceTimersByTimeAsync(100)
    expect(alert()).toBe('Could not save')
    w.unmount()
  })
})

describe('UiToaster — final review', () => {
  beforeEach(() => vi.useFakeTimers())
  const mounted: { unmount(): void }[] = []
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount())
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })
  const stubs = config.global.stubs
  beforeEach(() => (config.global.stubs = {}))
  afterEach(() => (config.global.stubs = stubs))
  const mountReal = () => void mounted.push(mount(UiToaster, { attachTo: document.body }))
  const mountDrawer = () => {
    const w = mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Santa', open: true },
      slots: { default: () => h('input', { class: 'name' }) },
    })
    mounted.push(w)
    return w
  }
  const key = (name: string, init: KeyboardEventInit = {}) => {
    const e = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init })
    document.activeElement!.dispatchEvent(e)
    return e
  }
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await vi.advanceTimersByTimeAsync(1)
  }
  const undo = () => ({ action: { label: 'Undo', onClick: () => {} } })

  it('a toast waits while the page is hidden: its clock runs only while it can be seen', async () => {
    mountReal()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    try {
      document.dispatchEvent(new Event('visibilitychange'))
      useToast().error('Could not save')
      await settle()
      await vi.advanceTimersByTimeAsync(TOAST_ERROR_DURATION + 1000)
      expect(useToast().toasts.value).toHaveLength(1)
      hidden.mockReturnValue(false)
      document.dispatchEvent(new Event('visibilitychange'))
      await settle()
      await vi.advanceTimersByTimeAsync(TOAST_ERROR_DURATION + 100)
      expect(useToast().toasts.value).toHaveLength(0)
    } finally {
      hidden.mockRestore()
    }
  })

  it('a window left with the focus on a toast keeps it held, and F8 still goes back', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    useToast().success('Archived', undo())
    await settle()
    key('F8')
    await settle()
    const action = document.activeElement as HTMLElement
    expect(action.textContent?.trim()).toBe('Undo')
    // Another window takes the focus: the toast's button keeps it inside this page.
    action.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    await settle()
    await vi.advanceTimersByTimeAsync(TOAST_ACTION_DURATION + 1000)
    expect(useToast().toasts.value).toHaveLength(1)
    action.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }))
    key('F8')
    await settle()
    expect(document.activeElement).toBe(field)
  })

  it('a toast shown before the toaster mounts is read once it does', async () => {
    useToast().error('Session expired')
    mountReal()
    await settle()
    await vi.advanceTimersByTimeAsync(160)
    expect(document.querySelector('[role="alert"]')!.textContent).toBe('Session expired')
  })

  it('a held Enter that ran Undo does not press what the focus went back to', async () => {
    mountReal()
    const next = document.body.appendChild(document.createElement('button'))
    next.focus()
    useToast().success('Row deleted', undo())
    await settle()
    key('F8')
    await settle()
    // Enter on a button: the key goes down, and the button clicks with no pointer behind it.
    key('Enter')
    ;(document.activeElement as HTMLElement).click()
    await settle()
    expect(document.activeElement).toBe(next)
    expect(key('Enter', { repeat: true }).defaultPrevented).toBe(true)
    // The key comes up: the next press is a press again.
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    expect(key('Enter').defaultPrevented).toBe(false)
  })

  it('a held Escape that closed a toast over a drawer leaves the drawer open', async () => {
    mountReal()
    const drawer = mountDrawer()
    await settle()
    useToast().success('Line removed', undo())
    await settle()
    key('F8')
    await settle()
    key('Escape')
    await settle()
    expect(document.activeElement).toBe(document.querySelector('.name'))
    key('Escape', { repeat: true })
    await settle()
    // The drawer is the app's to close: it is never asked.
    expect(drawer.emitted('update:open')).toBeUndefined()
    expect(drawer.emitted('close')).toBeUndefined()
  })

  it('a held Enter on the close button does not press what the focus went back to; a click from a script holds nothing', async () => {
    mountReal()
    const next = document.body.appendChild(document.createElement('button'))
    next.focus()
    useToast().success('Row deleted', undo())
    await settle()
    key('F8')
    await settle()
    document.querySelector<HTMLElement>('[aria-label="Close: Row deleted"]')!.focus()
    key('Enter')
    document.querySelector<HTMLElement>('[aria-label="Close: Row deleted"]')!.click()
    await settle()
    expect(document.activeElement).toBe(next)
    expect(key('Enter', { repeat: true }).defaultPrevented).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    // A script's click on Undo, with no key down: a held Enter afterwards is its own.
    useToast().success('Row deleted', undo())
    await settle()
    key('F8')
    await settle()
    ;(document.activeElement as HTMLElement).click()
    await settle()
    expect(document.activeElement).toBe(next)
    expect(key('Enter', { repeat: true }).defaultPrevented).toBe(false)
  })

  it('a focus that left the stack for the page forgets where it came from', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    useToast().success('Archived', undo())
    await settle()
    key('F8')
    await settle()
    const action = document.activeElement as HTMLElement
    // Out to the page, then back by a press on the toast: F8 has nowhere it knows to go back to.
    action.blur()
    action.focus()
    key('F8')
    await settle()
    expect(document.activeElement).not.toBe(field)
  })

  it('a stay past a timer has no time to show: no haze, no seconds', async () => {
    mountReal()
    useToast().success('Kept', { ...undo(), duration: Infinity })
    useToast().success('Long', { ...undo(), duration: 3e9 })
    await settle()
    expect(document.querySelector('[data-toast-time]')).toBeNull()
    expect(document.querySelector('[data-toast-seconds]')).toBeNull()
  })

  it('the same toast again leaves a focus the app moved in that render where the app put it', async () => {
    const field = document.body.appendChild(document.createElement('input'))
    const Mover = defineComponent({
      setup() {
        watch(
          () => useToast().toasts.value.length,
          () => field.focus(),
          { flush: 'post' },
        )
        return () => null
      },
    })
    // The app's watcher stands before the toaster's, as a page's does when the toaster mounts later.
    mounted.push(mount(Mover))
    mountReal()
    useToast().error('Offline')
    useToast().info('Other')
    await settle()
    document.querySelector<HTMLElement>('[aria-label="Close: Offline"]')!.focus()
    useToast().success('Third')
    await settle()
    expect(document.activeElement).toBe(field)
  })

  it('a swipe that closes the toast holding the focus gives the focus back', async () => {
    mountReal()
    const field = document.body.appendChild(document.createElement('input'))
    field.focus()
    useToast().success('Archived', undo())
    await settle()
    key('F8')
    await settle()
    const card = document.querySelector<HTMLElement>('[data-index="0"]')!
    const at = (type: string, x: number) =>
      card.dispatchEvent(
        new PointerEvent(type, { bubbles: true, button: 0, clientX: x, clientY: 0, pointerId: 1 }),
      )
    at('pointerdown', 0)
    at('pointermove', -80)
    at('pointerup', -80)
    await settle()
    expect(useToast().toasts.value).toHaveLength(0)
    expect(document.activeElement).toBe(field)
  })

  it('the same toast again keeps the focus on its card as it comes to the front', async () => {
    mountReal()
    useToast().error('Offline')
    useToast().info('Other')
    await settle()
    const close = document.querySelector<HTMLElement>('[aria-label="Close: Offline"]')!
    close.focus()
    useToast().error('Offline')
    await settle()
    expect(document.activeElement).toBe(close)
  })

  it('a press on the words of a toast does not put the focus on the stack', async () => {
    mountReal()
    useToast().info('Saved')
    await settle()
    expect(document.querySelector('[role="region"]')!.hasAttribute('tabindex')).toBe(false)
  })

  it('an action is described by its toast: F8 lands on Undo and the title is read with it', async () => {
    mountReal()
    useToast().success('Invoice archived', undo())
    await settle()
    const button = [...document.querySelectorAll<HTMLElement>('[data-id] button')].find(
      (b) => b.textContent?.trim() === 'Undo',
    )!
    const id = button.getAttribute('aria-describedby')
    expect(id && document.getElementById(id)?.textContent?.trim()).toBe('Invoice archived')
  })
})

describe('UiToaster — the request example as it is copied', () => {
  // The example's failing request is answered by its error toast: the press hands nothing on to
  // the app's error handler, where it would be reported a second time.
  it('Save and fail shows the error toast and leaves nothing for the error handler', async () => {
    vi.useFakeTimers()
    const caught: unknown[] = []
    const demo = (await import('../demos/UiToaster.demo.vue')).default
    const DemoBlock = defineComponent({
      props: { title: { type: String, required: true }, row: Boolean },
      setup:
        (props, { slots }) =>
        () =>
          h('section', slots.default?.()),
    })
    const w = mount(defineComponent({ render: () => [h(demo), h(UiToaster)] }), {
      attachTo: document.body,
      global: {
        components: { DemoBlock },
        config: { errorHandler: (error: unknown) => void caught.push(error) },
      },
    })
    const fail = w.findAll('button').find((b) => b.text() === 'Save and fail')!
    await fail.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    for (let i = 0; i < 5; i++) await Promise.resolve()
    expect(document.body.textContent).toContain('Could not save')
    expect(caught).toEqual([])
    w.unmount()
    useToast().close()
    vi.useRealTimers()
  })
})
