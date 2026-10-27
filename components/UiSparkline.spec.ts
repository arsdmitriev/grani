import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, h } from 'vue'
import { CHART_EMPTY, CHART_SKELETON } from '../utils/surface'
import UiSparkline from './UiSparkline.vue'

const VALUES = [12, 18, 15, 22, 20, 26]
const top = (el: { attributes: (n: string) => string | undefined }) =>
  parseFloat(/top: (-?[\d.]+)%/.exec(el.attributes('style') ?? '')![1]!)
const height = (el: { attributes: (n: string) => string | undefined }) =>
  parseFloat(/height: ([\d.]+)%/.exec(el.attributes('style') ?? '')![1]!)
const spark = (props: Record<string, unknown> = {}, provide: Record<symbol, unknown> = {}) =>
  mount(UiSparkline, { props: { values: VALUES, ...props }, global: { provide } })

describe('UiSparkline', () => {
  it('draws a line with a dot on the newest value, and no fill', () => {
    const w = spark()
    expect(w.findAll('path')).toHaveLength(1)
    expect(w.find('path').attributes('fill')).toBe('none')
    const dot = w.find('span.rounded-pill:not([data-lone])')
    expect(dot.attributes('style')).toContain('left: 100%')
  })

  it('area fills under the line', () => {
    const w = spark({ variant: 'area' })
    expect(w.findAll('path')).toHaveLength(2)
    expect(w.find('linearGradient').exists()).toBe(true)
  })

  it('endpoint false leaves the dot out', () => {
    expect(spark({ endpoint: false }).find('span.rounded-pill:not([data-lone])').exists()).toBe(
      false,
    )
  })

  it('a missing value breaks the line, and the dot stands on the newest value there is', () => {
    const w = spark({ values: [10, null, 14, 16, null] })
    expect(w.find('path').attributes('d')).toMatch(/M.*M/)
    const dot = w.find('span.rounded-pill:not([data-lone])')
    expect(dot.attributes('style')).toContain('left: 75%')
  })

  it('bar draws one box per value, the newest full and the rest pale with a line', () => {
    const w = spark({ variant: 'bar' })
    const bars = w.findAll('[data-bar]')
    expect(bars).toHaveLength(VALUES.length)
    expect(bars.at(-1)!.find('.opacity-35').exists()).toBe(false)
    expect(bars.at(-1)!.find('.h-0\\.5').exists()).toBe(false)
    expect(bars[0]!.find('.opacity-35').exists()).toBe(true)
    expect(bars[0]!.find('.h-0\\.5.top-0').exists()).toBe(true)
  })

  it('a bar with no value leaves its place empty rather than drawing a stub', () => {
    const w = spark({ variant: 'bar', values: [5, null, 8] })
    expect(w.findAll('[data-bar]')).toHaveLength(2)
    expect(w.findAll('span.flex-1')).toHaveLength(3)
  })

  it('a loss stands below the zero line', () => {
    const w = spark({ variant: 'bar', values: [10, -10] })
    const [gain, loss] = w.findAll('[data-bar]')
    expect(gain!.classes()).toContain('rounded-t-badge')
    expect(loss!.classes()).toContain('rounded-b-badge')
    expect(top(loss!)).toBeGreaterThanOrEqual(top(gain!) + height(gain!) - 0.001)
  })

  it('the tone is the color, brand by default', () => {
    expect(spark().find('svg').classes()).toContain('text-chart-1')
    expect(spark({ tone: 'danger' }).find('svg').classes()).toContain('text-danger-border')
    expect(spark({ tone: 'neutral' }).find('svg').classes()).toContain('text-fg-muted')
  })

  it('without ariaLabel it is decoration; with one it is an image by that name', () => {
    const quiet = spark()
    expect(quiet.attributes('aria-hidden')).toBe('true')
    expect(quiet.attributes('role')).toBeUndefined()
    const named = spark({ ariaLabel: 'Average receipt, the last 12 months' })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Average receipt, the last 12 months')
    expect(named.attributes('aria-hidden')).toBeUndefined()
  })

  it('the height is pixels, 28 by default', () => {
    expect(spark().attributes('style')).toContain('height: 28px')
    expect(spark({ height: 64 }).attributes('style')).toContain('height: 64px')
  })
})

describe('UiSparkline — in a chart card', () => {
  it('draws its shape pale on the first load, pulsing, and says nothing', () => {
    const w = spark({ ariaLabel: 'Trend' }, { [CHART_SKELETON as symbol]: computed(() => true) })
    const ghost = w.find('svg.text-skeleton')
    expect(ghost.exists()).toBe(true)
    expect(ghost.classes()).toContain('animate-pulse')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('nothing to draw holds the shape still', () => {
    const w = spark({}, { [CHART_EMPTY as symbol]: computed(() => true) })
    const ghost = w.find('svg.text-skeleton')
    expect(ghost.exists()).toBe(true)
    expect(ghost.classes()).not.toContain('animate-pulse')
    expect(w.find('span.rounded-pill:not([data-lone])').exists()).toBe(false)
  })
})

describe('UiSparkline — review follow-ups', () => {
  // The drawing keeps the dot's radius clear of the host's edge on the dot's side, at the top and at
  // the bottom; the other side runs to the edge, so a card's sparkline reaches its sides.
  it('the endpoint dot stays inside the box at the newest position', () => {
    const box = (w: ReturnType<typeof spark>) => w.find('svg').element.parentElement!.style
    const newest = box(spark())
    expect([newest.top, newest.bottom, newest.left, newest.right]).toEqual([
      '3px',
      '3px',
      '0px',
      '3px',
    ])
    const first = box(spark({ highlight: 0 }))
    expect([first.left, first.right]).toEqual(['3px', '0px'])
    const none = box(spark({ endpoint: false }))
    expect([none.top, none.bottom, none.left, none.right]).toEqual(['0px', '0px', '0px', '0px'])
  })

  it("an area's fill runs past a dot at a side to the host's edge, and below its floor", () => {
    const w = spark({ values: [3, 5, 4, 8], variant: 'area' })
    const rects = w.findAll('rect')
    expect(rects.map((r) => r.attributes('x'))).toEqual(['100'])
    expect(w.find('svg').attributes('style')).toContain('clip-path: inset(-4px -4px -4px -1px)')
    expect(
      spark({ values: [3, 5, 4, 8], variant: 'area', endpoint: false }).findAll('rect'),
    ).toEqual([])
  })

  it('a flat series stands at mid-height, filled below in an area', () => {
    const w = spark({ values: [46, 46, 46, 46], variant: 'area' })
    expect(w.find('span.rounded-pill:not([data-lone])').attributes('style')).toContain('top: 50%')
    const [fill] = w.findAll('path')
    expect(fill!.attributes('d')).toContain('50')
  })

  it('a bar under the minimum height stands on the zero line, up for a gain and down for a loss', () => {
    const w = spark({ variant: 'bar', values: [10, 0] })
    const stub = w.findAll('[data-bar]')[1]!
    expect(top(stub) + height(stub)).toBeCloseTo(100, 5)
    const mixed = spark({ variant: 'bar', values: [900, -300, 1] })
    const [big, , tiny] = mixed.findAll('[data-bar]')
    expect(top(tiny!) + height(tiny!)).toBeCloseTo(top(big!) + height(big!), 5)
  })

  it('a bar sparkline ghosts as bars on the first load', () => {
    const w = spark({ variant: 'bar' }, { [CHART_SKELETON as symbol]: computed(() => true) })
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('span.bg-current.rounded-t-badge').length).toBeGreaterThan(3)
  })

  it('tone success, warning and info map to their border tokens', () => {
    expect(spark({ tone: 'success' }).find('svg').classes()).toContain('text-success-border')
    expect(spark({ tone: 'warning' }).find('svg').classes()).toContain('text-warning-border')
    expect(spark({ tone: 'info' }).find('svg').classes()).toContain('text-info-border')
  })

  it('two sparklines carry different gradient ids', () => {
    const Pair = defineComponent({
      render: () => [
        h(UiSparkline, { values: VALUES, variant: 'area' }),
        h(UiSparkline, { values: VALUES, variant: 'area' }),
      ],
    })
    const ids = mount(Pair)
      .findAll('linearGradient')
      .map((g) => g.attributes('id'))
    expect(new Set(ids).size).toBe(2)
  })

  it('a refreshing card keeps the real shape', () => {
    const w = spark({}, { [CHART_EMPTY as symbol]: computed(() => false) })
    expect(w.find('svg.text-skeleton').exists()).toBe(false)
    expect(w.find('path').exists()).toBe(true)
  })
})

describe('UiSparkline — chart review', () => {
  it('crowded bars drop the gap between them, so a long run still draws', () => {
    const w = spark({ variant: 'bar', values: Array.from({ length: 365 }, (_, i) => i + 1) })
    const gap = w.find('[data-bars]').attributes('style') ?? ''
    expect(gap).toMatch(/column-gap: max\(clamp\(0px, calc\(\(100% \/ 365 - 6px\) \* 1000\), 4px\)/)
  })

  it('a value alone between two gaps is drawn as a dot, not a speck of line', () => {
    const w = spark({ values: [10, null, 14, null, 16] })
    expect(w.findAll('[data-lone]')).toHaveLength(2)
  })

  it('a named sparkline with nothing to draw is hidden from a reader', () => {
    for (const values of [[], [null, null]]) {
      const w = spark({ values, ariaLabel: 'Average receipt' })
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.attributes('role')).toBeUndefined()
    }
  })
})

describe('UiSparkline — highlight', () => {
  it('highlight lights that bar, the others pale; the dot of a line stands on it', () => {
    const bars = spark({ variant: 'bar', highlight: 1 }).findAll('[data-bar]')
    expect(bars[1]!.find('.opacity-35').exists()).toBe(false)
    expect(bars.at(-1)!.find('.opacity-35').exists()).toBe(true)
    expect(
      spark({ highlight: 0 }).find('span.rounded-pill:not([data-lone])').attributes('style'),
    ).toContain('left: 0%')
  })

  it('a highlight outside the values or on a gap leaves the newest lit', () => {
    for (const highlight of [9, -1, 1.5]) {
      const bars = spark({ variant: 'bar', highlight }).findAll('[data-bar]')
      expect(bars.at(-1)!.find('.opacity-35').exists()).toBe(false)
    }
    const gap = spark({ variant: 'bar', values: [5, null, 8], highlight: 1 }).findAll('[data-bar]')
    expect(gap.at(-1)!.find('.opacity-35').exists()).toBe(false)
  })
})

describe('UiSparkline — mark', () => {
  it('draws a dashed line of reference at its value, named at its end, and says it', () => {
    const w = spark({
      values: [10, 20, 30],
      mark: { at: 20, label: 'Average 20' },
      ariaLabel: 'Trend',
    })
    const line = w.find('[data-mark]')
    expect(line.classes()).toContain('border-dashed')
    expect(line.attributes('style')).toContain('top: 50%')
    expect(w.text()).toContain('Average 20')
    const plate = w.findAll('span').find((el) => el.text() === 'Average 20')!
    expect(plate.classes()).toEqual(expect.arrayContaining(['bg-surface', 'border']))
    expect(w.attributes('aria-label')).toBe('Trend, Average 20')
  })

  it('a mark outside the values stretches the range to hold it', () => {
    const w = spark({ values: [10, 20], mark: { at: 40, label: 'Plan' } })
    expect(w.find('[data-mark]').attributes('style')).toContain('top: 0%')
  })

  it('bars take a mark too', () => {
    expect(
      spark({ variant: 'bar', mark: { at: 15, label: 'Plan' } })
        .find('[data-mark]')
        .exists(),
    ).toBe(true)
  })
})
