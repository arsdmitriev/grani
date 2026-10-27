import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { createApp, type App } from 'vue'
import { Link } from '@lucide/vue'
import { createGrani, type Grani } from '../plugin'
import { useShared } from './useShared'
import {
  TOAST_ERROR_DURATION,
  TOAST_DURATION,
  TOAST_QUEUE_LIMIT,
  useToast,
  useToastHost,
  type Toast,
} from './useToast'

describe('useToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('shows a toast with the tone and a duration, an error longer and urgent', () => {
    const toast = useToast()
    const a = toast.success('Saved')
    const b = toast.error('Could not save', { description: 'The server did not answer' })
    const [first, second] = toast.toasts.value
    expect(first).toMatchObject({
      id: a,
      title: 'Saved',
      tone: 'success',
      priority: 'low',
      duration: TOAST_DURATION,
    })
    expect(second).toMatchObject({
      id: b,
      tone: 'danger',
      priority: 'high',
      duration: TOAST_ERROR_DURATION,
    })
    expect(toast.stack.value.map((t) => t.id)).toEqual([b, a])
  })

  it('closes itself after its duration, not while paused, and never when persistent', () => {
    const toast = useToastHost()
    toast.info('Gone soon')
    toast.show({ title: 'Stays', duration: 'persistent' })
    vi.advanceTimersByTime(TOAST_DURATION - 1)
    expect(toast.toasts.value).toHaveLength(2)
    toast.pause()
    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(2)
    toast.resume()
    vi.advanceTimersByTime(1000)
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['Stays'])
  })

  it('a toast shown while the stack is held waits for resume before its clock starts', () => {
    const toast = useToastHost()
    toast.pause()
    toast.success('Restored')
    vi.advanceTimersByTime(TOAST_DURATION * 3)
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['Restored'])
    toast.resume()
    vi.advanceTimersByTime(TOAST_DURATION - 1)
    expect(toast.toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('update changes a toast in place and restarts its clock on a new tone', () => {
    const toast = useToast()
    const id = toast.show({ title: 'Working', loading: true, duration: 'persistent' })
    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(1)
    toast.update(id, { title: 'Done', loading: false, tone: 'success' })
    expect(toast.toasts.value[0]).toMatchObject({
      title: 'Done',
      tone: 'success',
      duration: TOAST_DURATION,
    })
    vi.advanceTimersByTime(TOAST_DURATION)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('promise goes loading, then success or error, and passes the outcome through', async () => {
    const toast = useToast()
    const ok = toast.promise(Promise.resolve(42), {
      loading: 'Sending',
      success: (n) => `Sent ${n}`,
      error: 'Failed',
    })
    expect(toast.toasts.value[0]).toMatchObject({ title: 'Sending', loading: true })
    await expect(ok).resolves.toBe(42)
    expect(toast.toasts.value[0]).toMatchObject({ title: 'Sent 42', tone: 'success' })
    expect(toast.toasts.value[0]!.loading).toBeFalsy()
    const bad = toast.promise(Promise.reject(new Error('down')), {
      loading: 'Sending',
      success: 'Sent',
      error: (e) => ({ title: 'Failed', description: (e as Error).message }),
    })
    await expect(bad).rejects.toThrow('down')
    expect(toast.toasts.value.at(-1)).toMatchObject({
      title: 'Failed',
      description: 'down',
      tone: 'danger',
      priority: 'high',
    })
  })

  it('The outcome of a request comes as a new toast: the loading one leaves, a new one arrives.', async () => {
    const toast = useToast()
    const ok = toast.promise(Promise.resolve(1), {
      loading: 'Sending',
      success: 'Sent',
      error: 'Failed',
    })
    const loadingId = toast.toasts.value[0]!.id
    await ok
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({ title: 'Sent', tone: 'success' })
    expect(toast.toasts.value[0]!.id).not.toBe(loadingId)
  })

  it('The outcome is said even when the person closed the loading toast: an error must be heard.', async () => {
    const toast = useToast()
    let fail!: (e: Error) => void
    const p = toast.promise(new Promise((_, r) => (fail = r)), {
      loading: 'Sending',
      success: 'Sent',
      error: 'Could not send',
    })
    toast.close(toast.toasts.value[0]!.id)
    fail(new Error('down'))
    await expect(p).rejects.toThrow('down')
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['Could not send'])
  })

  it('close removes one or all, and a removed toast fires no timer', () => {
    const toast = useToast()
    const a = toast.info('A')
    toast.info('B')
    toast.close(a)
    expect(toast.toasts.value.map((t) => t.title)).toEqual(['B'])
    toast.close()
    expect(toast.toasts.value).toHaveLength(0)
    vi.advanceTimersByTime(60_000)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('update from danger to success lowers the priority', () => {
    const toast = useToast()
    const id = toast.error('Could not copy')
    expect(toast.toasts.value[0]!.priority).toBe('high')
    toast.update(id, { title: 'Copied', tone: 'success' })
    expect(toast.toasts.value[0]!.priority).toBe('low')
  })

  it('the queue is capped: past the limit the oldest waiting toast leaves to make room', () => {
    const toast = useToast()
    for (let i = 0; i < TOAST_QUEUE_LIMIT + 10; i++) {
      toast.show({ title: `t${i}`, duration: 'persistent' })
    }
    expect(toast.toasts.value).toHaveLength(TOAST_QUEUE_LIMIT)
    expect(toast.toasts.value[0]!.title).toBe('t10')
    expect(toast.toasts.value.at(-1)!.title).toBe(`t${TOAST_QUEUE_LIMIT + 9}`)
  })

  it('an id past a huge existing queue is a counter, not a spread of it: no RangeError', () => {
    const toasts = useShared<Toast[]>('grani:toasts', () => [])
    const big = 200_000
    toasts.value = Array.from({ length: big }, (_, i) => ({
      id: i + 1,
      title: 'x',
      duration: 'persistent' as const,
      priority: 'low' as const,
    }))
    const toast = useToast()
    let id = 0
    expect(() => (id = toast.show({ title: 'new', duration: 'persistent' }))).not.toThrow()
    expect(id).toBe(big + 1)
  })
})

describe('useToast — what an app gets', () => {
  it('shows and closes toasts; holding the clocks stays with the toaster', () => {
    expect(Object.keys(useToast()).sort()).toEqual([
      'close',
      'error',
      'info',
      'promise',
      'show',
      'stack',
      'success',
      'toasts',
      'update',
      'warning',
    ])
  })
})

describe('useToast — two apps on one page', () => {
  // The hold is UiToaster's, read in its app: an app mounted with the instance gives it.
  const apps: App[] = []
  const hold = (grani: Grani) => {
    const app = createApp({ render: () => null }).use(grani)
    app.mount(document.createElement('div'))
    apps.push(app)
    return app.runWithContext(useToastHost)
  }
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    apps.splice(0).forEach((app) => app.unmount())
    vi.useRealTimers()
  })

  it('holding one app clocks leaves the other running', () => {
    const one = createGrani()
    const two = createGrani()
    one.toast.info('In the first app')
    two.toast.info('In the second app')
    hold(one).pause()
    vi.advanceTimersByTime(TOAST_DURATION + 1)
    expect(one.toast.toasts.value).toHaveLength(1)
    expect(two.toast.toasts.value).toHaveLength(0)
    hold(one).resume()
    vi.advanceTimersByTime(TOAST_DURATION + 1)
    expect(one.toast.toasts.value).toHaveLength(0)
  })

  it('a pause in one app does not stop a clock the other starts after it', () => {
    const one = createGrani()
    const two = createGrani()
    one.toast.info('Held')
    hold(one).pause()
    two.toast.info('Fresh')
    vi.advanceTimersByTime(TOAST_DURATION + 1)
    expect(two.toast.toasts.value).toHaveLength(0)
    hold(one).resume()
    one.toast.close()
  })
})

describe('useToast — review follow-ups, the same toast again', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })
  const titles = () => useToast().toasts.value.map((t) => t.title)

  it('the same toast while it stands is not stacked again: it comes to the top with its whole stay', () => {
    const toast = useToast()
    const first = toast.error('Could not save')
    toast.info('Draft kept')
    const at = TOAST_DURATION - 1000
    vi.advanceTimersByTime(at)
    const again = toast.error('Could not save')
    expect(again).toBe(first)
    expect(titles()).toEqual(['Draft kept', 'Could not save'])
    // Past the stay it had first, and then the whole stay again from the second.
    vi.advanceTimersByTime(TOAST_ERROR_DURATION + 1000 - at)
    expect(titles()).toEqual(['Could not save'])
    vi.advanceTimersByTime(at - 1000)
    expect(titles()).toEqual([])
  })

  it('another tone, description or icon is another toast, and so is any toast with an action', () => {
    const toast = useToast()
    toast.show({ title: 'Saved' })
    toast.show({ title: 'Saved', tone: 'success' })
    toast.show({ title: 'Saved', description: 'Invoice 12' })
    toast.show({ title: 'Saved', icon: Link })
    // A silent toast and a spoken one: joining them would read the silent one, or silence the other.
    toast.show({ title: 'Saved', announce: false })
    // Two Undo buttons undo two different things.
    const undo = { label: 'Undo', onClick: () => {} }
    toast.show({ title: 'Deleted', action: undo })
    toast.show({ title: 'Deleted', action: undo })
    expect(titles()).toEqual(['Saved', 'Saved', 'Saved', 'Saved', 'Saved', 'Deleted', 'Deleted'])
  })

  it('the same toast waiting in the queue is joined too, and comes to the front', () => {
    const toast = useToast()
    const waiting = toast.show({ title: 'Copied' })
    for (const title of ['One', 'Two', 'Three', 'Four']) toast.show({ title })
    expect(toast.show({ title: 'Copied' })).toBe(waiting)
    expect(titles()).toEqual(['One', 'Two', 'Three', 'Four', 'Copied'])
  })

  it('a toast open until closed stays open when the same one comes again', () => {
    const toast = useToast()
    toast.show({ title: 'Offline', tone: 'warning', duration: 'persistent' })
    toast.show({ title: 'Offline', tone: 'warning' })
    vi.advanceTimersByTime(60_000)
    expect(titles()).toEqual(['Offline'])
  })

  it('a toast still loading is never joined: each promise settles its own', async () => {
    const toast = useToast()
    let done!: () => void
    void toast.promise(new Promise<void>((r) => (done = r)), {
      loading: 'Saving…',
      success: 'Saved',
      error: 'Failed',
    })
    void toast.promise(new Promise<void>(() => {}), {
      loading: 'Saving…',
      success: 'Saved',
      error: 'Failed',
    })
    expect(titles()).toEqual(['Saving…', 'Saving…'])
    done()
    await vi.advanceTimersByTimeAsync(0)
    expect(titles().sort()).toEqual(['Saved', 'Saving…'])
  })
})

describe('useToast — final review', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToastHost().resume()
    useToast().close()
    vi.useRealTimers()
  })

  it('a promise answers even when its message throws: the value or the error comes through', async () => {
    const toast = useToast()
    const said = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => said.mockRestore())
    const value = { items: null as string[] | null }
    const ok = toast.promise(Promise.resolve(value), {
      loading: 'Saving',
      success: (v) => `${v.items!.length} saved`,
      error: 'Could not save',
    })
    await expect(ok).resolves.toBe(value)
    expect(toast.toasts.value.some((t) => t.loading)).toBe(false)
    expect(toast.toasts.value.some((t) => t.tone === 'danger')).toBe(false)
    expect(toast.toasts.value.at(-1)).toMatchObject({ tone: 'success', title: 'Done' })
    const down = new Error('down')
    const bad = toast.promise(Promise.reject(down), {
      loading: 'Saving',
      success: 'Saved',
      error: (e) => (e as { response: { data: { message: string } } }).response.data.message,
    })
    await expect(bad).rejects.toBe(down)
    expect(toast.toasts.value.some((t) => t.loading)).toBe(false)
    expect(toast.toasts.value.at(-1)).toMatchObject({
      tone: 'danger',
      title: 'Could not complete the action',
    })
  })

  it('close with no id closes every toast; close with an id that is undefined closes none', () => {
    const toast = useToast()
    toast.success('One')
    toast.error('Two')
    // An id read from a toast that is not there, as a variable never set holds.
    const stale = toast.toasts.value.find((t) => t.title === 'Three')?.id
    toast.close(stale)
    expect(toast.toasts.value).toHaveLength(2)
    toast.close()
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('a toast set loading again keeps no clock until its outcome comes', () => {
    const toast = useToast()
    const id = toast.success('Saved')
    toast.update(id, { loading: true, title: 'Saving again' })
    vi.advanceTimersByTime(TOAST_DURATION * 3)
    expect(toast.toasts.value).toHaveLength(1)
    toast.update(id, { loading: false, title: 'Saved' })
    vi.advanceTimersByTime(TOAST_DURATION + 10)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('a stay too long for a timer is a toast that stays until closed', () => {
    const toast = useToast()
    toast.info('Forever', { duration: Infinity })
    toast.info('Very long', { duration: 3e9 })
    vi.advanceTimersByTime(TOAST_DURATION * 2)
    expect(toast.toasts.value).toHaveLength(2)
  })
})

describe('useToast — review follow-ups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    useToast().close()
    vi.useRealTimers()
  })

  it('an option left undefined keeps the priority the tone gives', () => {
    const toast = useToast()
    const error = toast.error('Could not save', { priority: undefined })
    const info = toast.info('Draft kept', { priority: undefined })
    const priorityOf = (id: number) => toast.toasts.value.find((t) => t.id === id)?.priority
    expect(priorityOf(error)).toBe('high')
    expect(priorityOf(info)).toBe('low')
  })

  it('an update that leaves the priority undefined keeps the one the toast has', () => {
    const toast = useToast()
    const id = toast.error('Could not save')
    toast.update(id, { description: 'Try again', priority: undefined })
    expect(toast.toasts.value.find((t) => t.id === id)?.priority).toBe('high')
  })
})
