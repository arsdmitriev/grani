import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useChartCursor } from './useChartCursor'

const key = (k: string) => new KeyboardEvent('keydown', { key: k, cancelable: true })
const plot = (width = 1100) => {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({ left: 0, width }) as DOMRect
  return el
}
const move = (el: HTMLElement, x: number) => {
  const e = new PointerEvent('pointermove', { clientX: x })
  Object.defineProperty(e, 'currentTarget', { value: el })
  return e
}

describe('useChartCursor', () => {
  const setup = (n = 12) => {
    const count = ref(n)
    return { count, ...useChartCursor({ count, describe: (i) => `point ${i}` }) }
  }

  it('focus shows the newest point and says it', () => {
    const c = setup()
    c.handlers.focus()
    expect(c.index.value).toBe(11)
    expect(c.announcement.value).toBe('point 11')
  })
  it('arrows step and stop at the ends, Home and End jump', () => {
    const c = setup(3)
    c.handlers.focus()
    const right = key('ArrowRight')
    c.handlers.keydown(right)
    expect(c.index.value).toBe(2)
    expect(right.defaultPrevented).toBe(true)
    c.handlers.keydown(key('Home'))
    expect(c.index.value).toBe(0)
    c.handlers.keydown(key('ArrowLeft'))
    expect(c.index.value).toBe(0)
    c.handlers.keydown(key('End'))
    expect(c.index.value).toBe(2)
  })
  it('leaves other keys alone: Tab still leaves the plot', () => {
    const c = setup()
    c.handlers.focus()
    const tab = key('Tab')
    c.handlers.keydown(tab)
    expect(tab.defaultPrevented).toBe(false)
  })
  it('the pointer shows the nearest point and hides it on leave, silently', () => {
    const c = setup()
    const el = plot()
    c.handlers.pointermove(move(el, 520))
    expect(c.index.value).toBe(5)
    expect(c.announcement.value).toBe('')
    c.handlers.pointerleave()
    expect(c.index.value).toBeNull()
  })
  it('the keys go on from where the pointer was; focus keeps the point when the pointer leaves', () => {
    const c = setup()
    c.handlers.pointermove(move(plot(), 0))
    c.handlers.focus()
    expect(c.index.value).toBe(0)
    c.handlers.pointerleave()
    expect(c.index.value).toBe(0)
    c.handlers.blur()
    expect(c.index.value).toBeNull()
  })
  it('stays inside the data when it shrinks and clears when it empties', async () => {
    const c = setup()
    c.handlers.focus()
    c.count.value = 4
    await nextTick()
    expect(c.index.value).toBe(3)
    c.count.value = 0
    await nextTick()
    expect(c.index.value).toBeNull()
    c.handlers.keydown(key('ArrowLeft'))
    expect(c.index.value).toBeNull()
  })
  it('in bands the pointer picks the band it is over', () => {
    const count = ref(6)
    const c = useChartCursor({ count, describe: String, bands: true })
    const el = plot(600)
    c.handlers.pointermove(move(el, 180))
    expect(c.index.value).toBe(1)
    c.handlers.pointermove(move(el, 599))
    expect(c.index.value).toBe(5)
    c.handlers.pointermove(move(el, 900))
    expect(c.index.value).toBe(5)
  })
  it('a click on the plot does not pin the point or announce the sweep', () => {
    const c = setup()
    const el = plot()
    c.handlers.pointerdown()
    c.handlers.focus()
    expect(c.index.value).toBeNull()
    c.handlers.pointermove(move(el, 520))
    expect(c.announcement.value).toBe('')
    c.handlers.pointerleave()
    expect(c.index.value).toBeNull()
    c.handlers.keydown(key('ArrowLeft'))
    expect(c.index.value).toBe(4)
    expect(c.announcement.value).toBe('point 4')
  })

  it('a touch tap shows the point and keeps it until the plot loses focus', () => {
    const c = setup(12)
    const el = plot(1100)
    const tap = (type: string) => {
      const e = new PointerEvent(type, { clientX: 550, pointerType: 'touch' })
      Object.defineProperty(e, 'currentTarget', { value: el })
      return e
    }
    c.handlers.pointerdown(tap('pointerdown'))
    expect(c.index.value).toBe(6)
    c.handlers.focus()
    c.handlers.pointerleave(tap('pointerleave'))
    expect(c.index.value).toBe(6)
    expect(c.announcement.value).toBe('')
    c.handlers.blur()
    expect(c.index.value).toBeNull()
  })
})

describe('useChartCursor — start', () => {
  it("start: 'first' begins the keys at the first point", () => {
    const count = ref(4)
    const c = useChartCursor({ count, describe: (i) => `point ${i}`, start: 'first' })
    c.handlers.focus()
    expect(c.index.value).toBe(0)
  })
})
