import { describe, expect, it } from 'vitest'
import { anchorPosition, type AnchorInput } from './anchorPosition'

const at = (o: Partial<AnchorInput> & { trigger?: Partial<AnchorInput['trigger']> } = {}) =>
  anchorPosition({
    trigger: { top: 100, left: 50, right: 250, bottom: 140, width: 200, ...o.trigger },
    panel: o.panel ?? { width: 200, height: 300 },
    viewport: o.viewport ?? { width: 1000, height: 800 },
    offset: o.offset,
    margin: o.margin,
    align: o.align,
    prefer: o.prefer,
    matchTriggerWidth: o.matchTriggerWidth,
  })

describe('anchorPosition — one arithmetic for every floating panel', () => {
  it('stands below with a gap by default', () => {
    const r = at()
    expect(r.placement).toBe('below')
    expect(r.top).toBe(146)
    expect(r.left).toBe(50)
  })

  it('flips above only when below has no room and above has more', () => {
    const flip = at({ trigger: { top: 500, bottom: 640, left: 50, right: 250, width: 200 } })
    expect(flip.placement).toBe('above')
    expect(flip.top).toBe(194)
    // Taller than the screen: show its top, not its bottom.
    const nowhere = at({ panel: { width: 200, height: 900 } })
    expect(nowhere.placement).toBe('below')
    expect(nowhere.top).toBe(8)
  })

  it('pins to the bottom edge instead of leaving the screen', () => {
    const r = at({ trigger: { top: 600, bottom: 640, left: 50, right: 250, width: 200 } })
    expect(r.placement).toBe('above')
    const clamped = at({ trigger: { top: 10, bottom: 640, left: 50, right: 250, width: 200 } })
    expect(clamped.top).toBe(492)
  })

  it('stays inside the right edge', () => {
    const r = at({ trigger: { top: 100, bottom: 140, left: 950, right: 990, width: 40 } })
    expect(r.left).toBe(1000 - 200 - 8)
  })

  it('align=end lines the panel up with the trigger end', () => {
    expect(at({ align: 'end', panel: { width: 120, height: 100 } }).left).toBe(130)
  })

  it('a panel wider than the viewport pins to the left edge', () => {
    expect(at({ panel: { width: 1200, height: 100 } }).left).toBe(8)
  })

  it('matchTriggerWidth clamps by the trigger width (selects)', () => {
    const r = at({
      matchTriggerWidth: true,
      panel: { width: 0, height: 100 },
      trigger: { top: 100, bottom: 140, left: 900, right: 1100, width: 200 },
    })
    expect(r.left).toBe(1000 - 200 - 8)
  })

  it('a negative anchor never puts the panel above the top edge, even unmeasured', () => {
    const r = at({
      trigger: { top: -200, bottom: -200, left: -200, right: -200, width: 0 },
      panel: { width: 0, height: 0 },
    })
    expect(r.top).toBe(8)
    expect(r.left).toBe(8)
  })

  it('an unmeasured panel neither flips nor clamps by height', () => {
    const r = at({
      panel: { width: 0, height: 0 },
      trigger: { top: 700, bottom: 790, left: 50, right: 250, width: 200 },
    })
    expect(r.placement).toBe('below')
    expect(r.top).toBe(796)
  })
})

describe('anchorPosition — sides and alignment (tooltip, context menu)', () => {
  it('prefer=above keeps the top and flips below when above is tighter', () => {
    const ok = at({ prefer: 'above', panel: { width: 120, height: 40 } })
    expect(ok.placement).toBe('above')
    expect(ok.top).toBe(100 - 6 - 40)
    const flip = at({
      prefer: 'above',
      panel: { width: 120, height: 300 },
      trigger: { top: 20, bottom: 60, left: 50, right: 250, width: 200 },
    })
    expect(flip.placement).toBe('below')
  })

  it('prefer=auto is above when it fits, below otherwise', () => {
    expect(at({ prefer: 'auto', panel: { width: 120, height: 40 } }).placement).toBe('above')
    expect(at({ prefer: 'auto', panel: { width: 120, height: 300 } }).placement).toBe('below')
  })

  it('sides: flips to the other side when it fits there and not here; goes below or above when neither side fits, never over its trigger', () => {
    const flipped = at({
      prefer: 'left',
      panel: { width: 400, height: 40 },
      trigger: { top: 100, bottom: 140, left: 20, right: 220, width: 200 },
    })
    expect(flipped.placement).toBe('right')
    expect(flipped.left).toBe(226)
    const stuck = at({
      prefer: 'left',
      panel: { width: 900, height: 40 },
      trigger: { top: 100, bottom: 140, left: 400, right: 600, width: 200 },
    })
    expect(stuck.placement).toBe('below')
    expect(stuck.top).toBeGreaterThanOrEqual(140)
    // A phone: a hint as wide as most of the screen beside a button in the middle of it.
    const phone = anchorPosition({
      prefer: 'right',
      viewport: { width: 375, height: 700 },
      panel: { width: 320, height: 40 },
      trigger: { top: 650, bottom: 690, left: 150, right: 190, width: 40 },
    })
    expect(phone.placement).toBe('above')
    expect(phone.top + 40).toBeLessThanOrEqual(650)
  })

  it('align=center centers on the trigger but not past the edge', () => {
    expect(at({ align: 'center', panel: { width: 100, height: 40 } }).left).toBe(100)
    const atEdge = at({
      align: 'center',
      panel: { width: 300, height: 40 },
      trigger: { top: 100, bottom: 140, left: 960, right: 1000, width: 40 },
    })
    expect(atEdge.left).toBe(1000 - 300 - 8)
  })

  it('a point anchor is a zero-size trigger (context menu)', () => {
    const r = at({
      trigger: { top: 300, bottom: 300, left: 400, right: 400, width: 0 },
      panel: { width: 200, height: 150 },
    })
    expect(r.top).toBe(306)
    expect(r.left).toBe(400)
  })

  it('a side panel centers vertically and clamps', () => {
    const r = at({
      prefer: 'right',
      align: 'center',
      panel: { width: 100, height: 400 },
      trigger: { top: 10, bottom: 50, left: 50, right: 250, width: 200 },
    })
    expect(r.top).toBe(8)
  })
})

describe('anchorPosition — review follow-ups', () => {
  const place = (o: Partial<AnchorInput>) =>
    anchorPosition({
      trigger: { top: 100, left: 400, right: 440, bottom: 140, width: 40 },
      panel: { width: 200, height: 100 },
      viewport: { width: 1000, height: 800 },
      ...o,
    })

  it('in a right-to-left trigger, start is its right edge and end its left edge', () => {
    // Left to right: start lines up the left edges, end the right ones.
    expect(place({ align: 'start' }).left).toBe(400)
    expect(place({ align: 'end' }).left).toBe(240)
    expect(place({ align: 'start', rtl: true }).left).toBe(240)
    expect(place({ align: 'end', rtl: true }).left).toBe(400)
    expect(place({ align: 'center', rtl: true }).left).toBe(place({ align: 'center' }).left)
  })

  it('the reading direction turns start and end on a panel capped to its room too', () => {
    expect(place({ align: 'end', rtl: true, capToRoom: true }).left).toBe(400)
  })

  it('a side placement lines up on the trigger vertically, whatever the direction', () => {
    const side = { prefer: 'right', align: 'start' } as const
    expect(place({ ...side, rtl: true }).top).toBe(place(side).top)
  })
})
