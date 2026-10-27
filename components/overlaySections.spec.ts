import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { opensWithLegend, withLines } from './overlaySections'
import UiCard from './UiCard.vue'
import UiHeader from './UiHeader.vue'
import UiSeparator from './UiSeparator.vue'

const card = (...kids: unknown[]) => h(UiCard, null, { default: () => kids })
const legend = () => h(UiHeader, { variant: 'legend', title: 'Part' })

describe('the sections of an overlay', () => {
  it('a line between two neighbouring sections, none before one a legend opens', () => {
    const lined = withLines([card('a'), card('b'), card(legend(), 'c'), h('p', 'note')])
    expect(lined.map((v) => v.type === UiSeparator)).toEqual([false, true, false, false, false])
  })

  it('a body opens with a legend when its first section does, or it is one', () => {
    expect(opensWithLegend([card(legend())])).toBe(true)
    expect(opensWithLegend([legend()])).toBe(true)
    expect(opensWithLegend([card('a'), card(legend())])).toBe(false)
    expect(opensWithLegend([])).toBe(false)
  })
})
