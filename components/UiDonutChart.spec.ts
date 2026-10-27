import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { RUSSIAN, withGrani } from '../test/harness'
import { CHART_BLEED, CHART_EMPTY, CHART_SKELETON } from '../utils/surface'
import UiDonutChart, { type DonutPart } from './UiDonutChart.vue'

const PARTS: DonutPart[] = [
  { key: 'rent', label: 'Rent', value: 1200 },
  { key: 'food', label: 'Groceries', value: 600 },
  { key: 'car', label: 'Transport', value: 200 },
]
const donut = (
  props: Record<string, unknown> = {},
  provide: Record<symbol, unknown> = {},
  plugins = withGrani(),
) =>
  mount(UiDonutChart, {
    props: { parts: PARTS, ariaLabel: 'Spending by category', ...props },
    global: { provide, plugins },
    attachTo: document.body,
  })
const ring = (w: ReturnType<typeof donut>) => w.find('[role="img"]')
const middle = (w: ReturnType<typeof donut>) => ring(w).find('div[aria-hidden="true"]').text()

describe('UiDonutChart', () => {
  it('draws one arc per part in the chart colors, in the order given', () => {
    const w = donut()
    const arcs = w.findAll('path[data-arc]')
    expect(arcs).toHaveLength(3)
    expect(arcs.map((a) => a.classes()[0])).toEqual([
      'text-chart-1',
      'text-chart-2',
      'text-chart-3',
    ])
  })

  it('says the total in the middle, with what it counts', () => {
    expect(middle(donut())).toMatch(/2,000\s*Total/)
    expect(middle(donut({ totalLabel: 'Spent' }))).toContain('Spent')
  })

  it('the legend gives each part its value and share', () => {
    const rows = donut().findAll('li')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toMatch(/Rent\s*1,200\s*60%/)
    expect(rows[2]!.text()).toContain('10%')
  })

  it('past five parts the fifth is Other, the sum of the rest, in gray', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((k, i) => ({
      key: k,
      label: k,
      value: 10 + i,
    }))
    const w = donut({ parts: many })
    const rows = w.findAll('li')
    expect(rows).toHaveLength(5)
    expect(rows[4]!.text()).toMatch(/Other\s*45/)
    expect(w.findAll('path[data-arc]')[4]!.classes()).toContain('text-chart-other')
  })

  it('a part that is not a positive number takes no room and shows 0%', () => {
    const w = donut({
      parts: [
        ...PARTS,
        { key: 'x', label: 'Refunds', value: -50 },
        { key: 'y', label: 'Gifts', value: null },
      ],
    })
    expect(w.findAll('path[data-arc]')).toHaveLength(3)
    expect(w.findAll('li')[3]!.text()).toContain('0%')
    expect(middle(w)).toContain('2,000')
  })

  it('a whole of nothing is the bare ring and 0; no data at all is a dash', () => {
    const zero = donut({ parts: [{ key: 'a', label: 'A', value: 0 }] })
    expect(zero.find('circle').exists()).toBe(true)
    expect(middle(zero)).toMatch(/^0/)
    expect(middle(donut({ parts: [{ key: 'a', label: 'A', value: null }] }))).toMatch(/^—/)
  })

  it('the ring is one tab stop; the arrows walk the parts and each is said', async () => {
    const w = donut()
    expect(ring(w).attributes('tabindex')).toBe('0')
    await ring(w).trigger('focus')
    expect(middle(w)).toContain('Rent')
    await ring(w).trigger('keydown', { key: 'End' })
    expect(middle(w)).toContain('Transport')
    await ring(w).trigger('keydown', { key: 'Home' })
    expect(middle(w)).toMatch(/Rent\s*1,200\s*60%/)
    expect(w.find('[aria-live="polite"]').text()).toBe('Rent: 1,200, 60%')
    await ring(w).trigger('blur')
    expect(middle(w)).toContain('Total')
    w.unmount()
  })

  it('an empty ring is no tab stop', () => {
    expect(ring(donut({ parts: [] })).attributes('tabindex')).toBeUndefined()
  })

  it('the part shown widens and its legend row is marked', async () => {
    const w = donut()
    const before = w.findAll('path[data-arc]')[1]!.attributes('d')
    await w.findAll('li')[1]!.trigger('pointerenter')
    expect(w.findAll('path[data-arc]')[1]!.attributes('d')).not.toBe(before)
    expect(w.findAll('li')[1]!.classes()).toContain('bg-surface-muted')
    expect(middle(w)).toContain('Groceries')
  })

  it('a hidden table holds every part, its share and the total', () => {
    const table = donut().find('.sr-only > table')
    expect(table.find('caption').text()).toBe('Spending by category')
    expect(table.findAll('tbody tr')).toHaveLength(3)
    expect(table.find('tfoot').text()).toContain('2,000')
  })

  it('in ru the words are the dictionary’s', () => {
    expect(middle(donut({}, {}, withGrani(RUSSIAN)))).toContain('Всего')
  })

  it('the legend can be left out', () => {
    expect(donut({ legend: false }).find('ul').exists()).toBe(false)
  })
})

describe('UiDonutChart — in a chart card', () => {
  it('draws a pale ring on the first load, pulsing, and says nothing', () => {
    const w = donut({}, { [CHART_SKELETON as symbol]: computed(() => true) })
    expect(w.find('[role="img"]').exists()).toBe(false)
    expect(w.find('.border-skeleton').classes()).toContain('animate-pulse')
  })

  it('nothing to draw holds the ring still', () => {
    const w = donut({}, { [CHART_EMPTY as symbol]: computed(() => true) })
    expect(w.find('.border-skeleton').classes()).not.toContain('animate-pulse')
  })

  it('bled, the ring and its legend keep to the gutter', () => {
    const w = donut({}, { [CHART_BLEED as symbol]: computed(() => 'surface') })
    expect(w.find('.flex-wrap').classes()).toContain('px-surface')
  })
})

describe('UiDonutChart — review follow-ups', () => {
  it('the total and the shown value stay inside the hole: their size is fitted and cut with an ellipsis', () => {
    const w = donut({ format: (v: number) => `${v.toFixed(2)} EUR` })
    const figure = w.find('[data-middle] span.font-semibold')
    expect(figure.classes()).toContain('truncate')
    expect(parseInt(figure.attributes('style')!.match(/font-size: (\d+)px/)![1]!)).toBeLessThan(24)
    const small = donut({ height: 80 })
    expect(small.find('[data-middle]').findAll('span')).toHaveLength(1)
  })

  it('a tap on a legend row shows its part and hands the focus to the ring; losing it clears the part', async () => {
    const w = donut()
    await w.findAll('li')[1]!.trigger('pointerdown', { pointerType: 'touch' })
    expect(document.activeElement).toBe(ring(w).element)
    expect(middle(w)).toContain('Groceries')
    expect(w.find('[aria-live="polite"]').text()).toBe('')
    await ring(w).trigger('blur')
    expect(middle(w)).toContain('Total')
    w.unmount()
  })

  it('the pointer over an arc shows its part, and leaving the ring clears it', async () => {
    const w = donut()
    await w.findAll('path[data-arc]')[2]!.trigger('pointermove')
    expect(middle(w)).toContain('Transport')
    await ring(w).trigger('pointerleave')
    expect(middle(w)).toContain('Total')
  })

  it('past five parts the hidden table still lists every given part, the merged ones under Other', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((k, i) => ({
      key: k,
      label: k.toUpperCase(),
      value: 10 + i,
    }))
    const rows = donut({ parts: many }).findAll('table tbody tr')
    expect(rows).toHaveLength(8)
    expect(rows.at(-1)!.text()).toContain('Other: G')
  })

  it('a positive part under half a percent reads "<1%", a zero part "0%"', () => {
    const w = donut({
      parts: [
        { key: 'a', label: 'A', value: 1000 },
        { key: 'b', label: 'B', value: 2 },
        { key: 'c', label: 'C', value: 0 },
      ],
    })
    const rows = w.findAll('li')
    expect(rows[1]!.text()).toContain('<1%')
    expect(rows[2]!.text()).toContain('0%')
    expect(w.findAll('path[data-arc]')).toHaveLength(2)
  })

  it('the bare ring spans the same radii as the arcs', () => {
    const c = donut({ parts: [{ key: 'a', label: 'A', value: 0 }] }).find('circle')
    expect(c.attributes('r')).toBe('40')
    expect(c.attributes('stroke-width')).toBe('14')
  })
})

describe('UiDonutChart — chart review', () => {
  const BIG: DonutPart[] = [
    { key: 'a', label: 'Equities', value: 4.2e12 },
    { key: 'b', label: 'Bonds', value: 1.1e12 },
  ]
  it('a total too long for the hole is written short there, and in full in the table', () => {
    const w = donut({ parts: BIG, height: 140 })
    expect(middle(w)).toContain('5.3T')
    expect(w.find('table').text()).toContain('5,300,000,000,000')
  })
  it('a format of its own is asked for the short figure where the hole is small', () => {
    const format = (v: number, o?: { compact?: boolean }) =>
      o?.compact ? `${Math.round(v / 1e12)}T units` : `${v.toLocaleString('en')} units`
    const w = donut({ parts: BIG, height: 140, format })
    expect(middle(w)).toContain('5T units')
    expect(w.find('table').text()).toContain('5,300,000,000,000 units')
  })
  it('a total that fits stays whole', () => {
    expect(middle(donut())).toContain('2,000')
  })
})
