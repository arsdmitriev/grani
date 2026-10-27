import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, ref, watch } from 'vue'
import { provideSurface, useExits, useShake, type SurfaceOptions } from './overlaySurface'
import { GROUP_AXIS, GROUP_NESTED } from '../utils/groupAxis'
import { CARD_DEPTH, CARD_TITLE_ID, FLAT_CARD, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

describe('the surface of an overlay', () => {
  it('tells what it holds its cards, its title, its axis, its gutter and its rows', () => {
    const seen: Record<string, unknown> = {}
    const Inside = defineComponent({
      setup() {
        seen.flat = inject(FLAT_CARD)
        seen.depth = inject(CARD_DEPTH)
        seen.title = inject(CARD_TITLE_ID)?.value
        seen.axis = inject(GROUP_AXIS)?.value
        seen.nested = inject(GROUP_NESTED)
        seen.gutter = inject(SURFACE_GUTTER)
        seen.inset = inject(ROW_INSET)
        return () => null
      },
    })
    const surface = (o: SurfaceOptions) =>
      mount(
        defineComponent({
          setup() {
            provideSurface(o)
            return () => h(Inside)
          },
        }),
      )
    surface({ flat: false, titleId: 't1', gutter: null, inset: 'overlay' })
    expect(seen).toEqual({
      flat: false,
      depth: 1,
      title: 't1',
      axis: 'vertical',
      nested: false,
      gutter: null,
      inset: 'overlay',
    })
    surface({ flat: true, gutter: 'drawer' })
    expect(seen).toMatchObject({ flat: true, title: undefined, gutter: 'drawer', inset: null })
  })
})

describe('the ways out of an overlay', () => {
  const exits = (submitting = false, guarded = false) => {
    const open = ref(true)
    const closed = vi.fn()
    const refuse = vi.fn()
    const e = useExits({
      open,
      closed,
      submitting: () => submitting,
      guarded: () => guarded,
      refuse,
    })
    return { open, closed, refuse, ...e }
  }

  it('closes once and says so', () => {
    const x = exits()
    x.requestClose(false)
    x.requestClose(false)
    expect(x.open.value).toBe(false)
    expect(x.closed).toHaveBeenCalledTimes(1)
  })

  it('unsaved input refuses all but an explicit way out; a request out refuses every one', () => {
    const guarded = exits(false, true)
    guarded.requestClose(false)
    expect(guarded.open.value).toBe(true)
    expect(guarded.refuse).toHaveBeenCalledTimes(1)
    expect(guarded.allows(true)).toBe(true)
    const busy = exits(true)
    expect(busy.allows(true)).toBe(false)
    busy.requestClose(true)
    expect(busy.open.value).toBe(true)
    expect(busy.refuse).toHaveBeenCalledTimes(2)
    // Each refusal names its reason, which the surface says to a screen reader.
    expect(guarded.refuse).toHaveBeenCalledWith('unsaved')
    expect(busy.refuse.mock.calls).toEqual([['busy'], ['busy']])
  })

  // A held Escape repeats its key: the reader hears the newest refusal, not a queue of them that
  // goes on after the key is let go.
  it('refusals in a row are said once, not queued past the last one', () => {
    vi.useFakeTimers()
    const { refuse, said } = useShake()
    let written = 0
    watch(said, (w) => void (w && written++), { flush: 'sync' })
    for (let i = 0; i < 30; i++) {
      refuse('unsaved')
      vi.advanceTimersByTime(33)
    }
    vi.advanceTimersByTime(2000)
    expect(written).toBeLessThanOrEqual(2)
    vi.useRealTimers()
  })

  it('a refusal is emptied when the surface opens again, and a while after it is said', () => {
    vi.useFakeTimers()
    const { refuse, said, hush } = useShake()
    refuse('busy')
    vi.advanceTimersByTime(150)
    expect(said.value).not.toBe('')
    hush()
    vi.advanceTimersByTime(150)
    expect(said.value).toBe('')
    refuse('busy')
    vi.advanceTimersByTime(150)
    expect(said.value).not.toBe('')
    vi.advanceTimersByTime(6000)
    expect(said.value).toBe('')
    vi.useRealTimers()
  })

  it('a refusal shakes for 400 ms, the length of the animation', () => {
    vi.useFakeTimers()
    const { shaking, refuse } = useShake()
    refuse()
    expect(shaking.value).toBe(true)
    vi.advanceTimersByTime(399)
    expect(shaking.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(shaking.value).toBe(false)
  })
})
