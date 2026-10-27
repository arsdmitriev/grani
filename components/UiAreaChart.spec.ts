import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick } from 'vue'
import { CHART_BLEED, CHART_EMPTY, CHART_FLOOR, CHART_SKELETON } from '../utils/surface'
import UiAreaChart, { type AreaSeries } from './UiAreaChart.vue'

const X = ['2026-06', '2026-07', '2026-08', '2026-09']
const ORDERS: AreaSeries = { key: 'orders', label: 'Orders', values: [40, 50, 60, 30] }
const EVENTS: AreaSeries = { key: 'events', label: 'Events', values: [10, 20, null, 15] }
const PROFIT: AreaSeries = {
  key: 'profit',
  label: 'Profit',
  values: [5, -12, null, 8],
  variant: 'line',
  dashed: true,
  total: false,
}
const chart = (props: Record<string, unknown> = {}) =>
  mount(UiAreaChart, {
    props: { x: X, series: [ORDERS, EVENTS], ariaLabel: 'Revenue by month', ...props },
    attachTo: document.body,
  })
const lines = (w: ReturnType<typeof chart>) =>
  w.findAll('path[fill="none"]').map((p) => p.attributes('d') ?? '')
const rows = (w: ReturnType<typeof chart>) =>
  w.findAll('table tbody tr').map((r) => r.findAll('th, td').map((c) => c.text()))
const legend = (w: ReturnType<typeof chart>) => w.findAll('[role="group"] button')

describe('UiAreaChart', () => {
  it('draws an area and a line per series; a line series has no fill', () => {
    const w = chart({ series: [ORDERS, { ...EVENTS, variant: 'line' }] })
    expect(w.findAll('path[fill^="url("]')).toHaveLength(1)
    expect(lines(w)).toHaveLength(2)
  })

  it('a missing value breaks the line instead of dropping to zero', () => {
    const w = chart({ series: [EVENTS], curve: 'linear' })
    expect(lines(w)[0]!.match(/M/g)).toHaveLength(2)
  })

  it('the axis reaches a loss and draws the zero line solid', () => {
    const w = chart({ series: [ORDERS, PROFIT] })
    const ticks = w.findAll('span.w-10').map((s) => s.text())
    expect(ticks.some((t) => t.startsWith('-'))).toBe(true)
    const zero = w.findAll('line').find((l) => l.classes().includes('text-fg-subtle'))
    expect(zero?.attributes('stroke-dasharray')).toBeUndefined()
  })

  it('the time axis is written by the library, the year where it changes', () => {
    const w = chart({ x: ['2025-12', '2026-01'], series: [{ ...ORDERS, values: [1, 2] }] })
    const labels = w.findAll('span.bottom-0').map((s) => s.text())
    expect(labels).toEqual(['Dec 2025', 'Jan 2026'])
  })

  it('the legend names each series with its total; total false leaves it out', () => {
    const w = chart({ series: [ORDERS, PROFIT] })
    const [orders, profit] = legend(w)
    expect(orders!.text()).toContain('Orders')
    expect(orders!.text()).toContain('180')
    expect(profit!.text()).toBe('Profit')
  })

  it('a press on the legend shows one series alone and fits the axis; a second press shows all', async () => {
    const w = chart({ series: [ORDERS, EVENTS] })
    const before = w.findAll('span.w-10').map((s) => s.text())
    await legend(w)[1]!.trigger('click')
    expect(legend(w)[1]!.attributes('aria-pressed')).toBe('true')
    expect(lines(w)).toHaveLength(1)
    expect(w.findAll('span.w-10').map((s) => s.text())).not.toEqual(before)
    await legend(w)[1]!.trigger('click')
    expect(lines(w)).toHaveLength(2)
  })

  it('a single series has a legend line, not a button', () => {
    const w = chart({ series: [ORDERS] })
    expect(w.find('[role="group"]').exists()).toBe(false)
    expect(w.text()).toContain('Orders')
  })

  it('an isolated series that leaves the data frees the isolation', async () => {
    const w = chart({ series: [ORDERS, EVENTS] })
    await legend(w)[1]!.trigger('click')
    await w.setProps({ series: [ORDERS, PROFIT] })
    expect(lines(w)).toHaveLength(2)
  })

  it('tooltipTotal adds a sum of its series, skipping gaps; the hidden table keeps every series while one stands alone', async () => {
    const w = chart({ tooltipTotal: { label: 'Revenue', of: ['orders', 'events'] } })
    expect(rows(w)[0]).toEqual(['June 2026', '40', '10', '50'])
    expect(rows(w)[2]).toEqual(['August 2026', '60', '—', '60'])
    await legend(w)[0]!.trigger('click')
    expect(w.find('table thead').text()).toContain('Events')
    expect(w.find('table thead').text()).toContain('Revenue')
  })

  it('partial dashes the last segment and says the period is going', () => {
    const w = chart({ partial: true })
    expect(w.findAll('path[stroke-dasharray="2 4"]')).toHaveLength(2)
    expect(w.findAll('span.bottom-0').at(-1)!.text()).toBe('Sep · in progress')
    expect(rows(w)[3]![0]).toBe('September 2026 · in progress')
  })

  it('the plot is one tab stop: focus says the newest point, the arrows walk', async () => {
    const w = chart({ tooltipTotal: { label: 'Revenue', of: ['orders', 'events'] } })
    const plot = w.find('[role="img"]')
    await plot.trigger('focus')
    const live = () => w.find('p[aria-live="polite"]').text()
    expect(live()).toBe('September 2026: Orders 30, Events 15, Revenue 45')
    await plot.trigger('keydown', { key: 'ArrowLeft' })
    expect(live()).toContain('August 2026: Orders 60, Events —')
    w.unmount()
  })

  it('a hidden table holds every value for a screen reader', () => {
    const w = chart()
    expect(w.find('.sr-only > table caption').text()).toBe('Revenue by month')
    expect(rows(w)).toHaveLength(4)
  })

  it('without a value axis there are no ticks and no grid', () => {
    const w = chart({ yAxis: false })
    expect(w.findAll('span.w-10')).toHaveLength(0)
    expect(w.findAll('line')).toHaveLength(0)
  })

  it('a point with gaps around it keeps a dot', () => {
    const w = chart({ series: [{ ...ORDERS, values: [null, 20, null, null] }] })
    expect(w.findAll('span.h-1\\.5.w-1\\.5')).toHaveLength(1)
  })

  it('draws its own skeleton on a chart card’s first load', () => {
    const w = mount(UiAreaChart, {
      props: { x: X, series: [ORDERS], ariaLabel: 'x' },
      global: { provide: { [CHART_SKELETON as symbol]: computed(() => true) } },
    })
    expect(w.find('[role="img"]').exists()).toBe(false)
    const ghost = w.find('svg.text-skeleton')
    expect(ghost.exists()).toBe(true)
    expect(ghost.classes()).toContain('animate-pulse')
    expect(w.find('table').exists()).toBe(false)
  })

  it('warns in development when a series and the axis differ in length', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    chart({ series: [{ ...ORDERS, values: [1, 2] }] })
    await nextTick()
    expect(warn.mock.calls.some(([m]) => String(m).includes('2 values for 4 points'))).toBe(true)
    warn.mockRestore()
  })
})

describe('UiAreaChart — review follow-ups', () => {
  it('a function format does not widen the value axis past its gutter', () => {
    const w = chart({
      series: [{ ...ORDERS, values: [0, 400000, 1250000, 900000] }],
      format: (v: number) => `€${v}`,
    })
    const ticks = w.findAll('span.w-10').map((s) => s.text())
    expect(ticks.every((t) => t.length <= 5)).toBe(true)
    expect(ticks.some((t) => t.includes('€'))).toBe(false)
  })

  it('value-axis labels are all distinct on a fractional axis', () => {
    const w = chart({ series: [{ ...ORDERS, values: [0, 0.1, 0.3, 0.2] }] })
    const ticks = w.findAll('span.w-10').map((s) => s.text())
    expect(new Set(ticks).size).toBe(ticks.length)
  })

  it('axis labels use the muted text token, not the subtle one', () => {
    const w = chart()
    expect(w.find('span.w-10').classes()).toContain('text-fg-muted')
    expect(w.find('span.bottom-0').classes()).toContain('text-fg-muted')
  })

  it('the partial tail follows the chart curve', () => {
    const w = chart({
      series: [{ ...ORDERS, values: [10, 10, 10, 30] }],
      curve: 'step',
      partial: true,
    })
    const tail = w.find('path[stroke-dasharray="2 4"]').attributes('d') ?? ''
    const nums = (tail.match(/-?[\d.]+/g) ?? []).map(Number)
    const pts = nums.reduce<number[][]>(
      (a, v, i) => (i % 2 ? (a[a.length - 1]!.push(v), a) : [...a, [v]]),
      [],
    )
    for (let i = 1; i < pts.length; i++)
      expect(pts[i]![0] === pts[i - 1]![0] || pts[i]![1] === pts[i - 1]![1]).toBe(true)
  })

  it('one series left frees the isolation and the tooltip total', async () => {
    const w = chart({ tooltipTotal: { label: 'Revenue', of: ['orders', 'events'] } })
    await legend(w)[0]!.trigger('click')
    await w.setProps({ series: [ORDERS] })
    expect(w.find('table thead').text()).toContain('Revenue')
  })

  it('warns in development when two series share a key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    chart({ series: [ORDERS, { ...EVENTS, key: 'orders' }] })
    await nextTick()
    expect(warn.mock.calls.some(([m]) => String(m).includes('share a key'))).toBe(true)
    warn.mockRestore()
  })
})

describe('UiAreaChart — in a chart card', () => {
  const inCard = (provide: Record<symbol, unknown>, props: Record<string, unknown> = {}) =>
    mount(UiAreaChart, {
      props: { x: X, series: [ORDERS, EVENTS], ariaLabel: 'Revenue by month', ...props },
      global: { provide },
    })

  it('nothing to draw holds the skeleton shape, still, and draws no marks', () => {
    const w = inCard({ [CHART_EMPTY as symbol]: computed(() => true) })
    const ghost = w.find('svg.text-skeleton')
    expect(ghost.exists()).toBe(true)
    expect(ghost.classes()).not.toContain('animate-pulse')
    expect(w.find('[role="img"]').exists()).toBe(false)
  })

  it('a ghost of lines alone has no fill; with an area it has one', () => {
    const lineOnly = inCard(
      { [CHART_SKELETON as symbol]: computed(() => true) },
      { series: [{ ...ORDERS, variant: 'line' }] },
    )
    expect(lineOnly.findAll('svg.text-skeleton path')).toHaveLength(1)
    const withArea = inCard({ [CHART_SKELETON as symbol]: computed(() => true) })
    expect(withArea.findAll('svg.text-skeleton path')).toHaveLength(2)
  })

  it('bled to the sides, it drops the value axis, pads the legend and draws the ring inside', () => {
    const w = inCard({ [CHART_BLEED as symbol]: computed(() => 'surface') })
    expect(w.find('.ps-12').exists()).toBe(false)
    expect(w.findAll('line[stroke-dasharray="3 3"]')).toHaveLength(0)
    expect(w.find('[role="group"]').classes()).toContain('px-surface')
    expect(w.find('[role="img"]').classes().join(' ')).toContain('shadow-(--ui-ring-inset)')
  })

  it('bled, the first and last labels stand on the gutter', () => {
    const w = inCard({ [CHART_BLEED as symbol]: computed(() => 'surface') })
    const spans = w.findAll('span.bottom-0')
    expect(spans[0]!.attributes('style')).toContain('var(--space-surface)')
    expect(spans.at(-1)!.attributes('style')).toContain('100% - var(--space-surface)')
  })

  it('outside a card it keeps its value axis and its own inset', () => {
    const w = inCard({})
    expect(w.find('.ps-12').exists()).toBe(true)
    expect(w.find('[role="group"]').classes()).not.toContain('px-surface')
  })
})

describe('UiAreaChart — review follow-ups, final lens', () => {
  it('the tooltip stays inside a narrow plot on both sides of the middle', async () => {
    const w = chart()
    const plotEl = w.find('[role="img"]')
    plotEl.element.getBoundingClientRect = () => ({ left: 0, width: 270 }) as DOMRect
    await plotEl.trigger('pointermove', { clientX: 120 })
    const tip = w.find('.z-tooltip')
    expect(tip.classes()).not.toContain('min-w-40')
    expect(tip.classes().join(' ')).toContain('max-w-[calc(50%-0.75rem)]')
    expect(tip.attributes('style')).toContain('left:')
    await plotEl.trigger('pointermove', { clientX: 200 })
    expect(w.find('.z-tooltip').attributes('style')).toContain('right:')
    w.unmount()
  })

  it('a series with no values shows a dash for its total, not zero', () => {
    const w = chart({ series: [ORDERS, { ...EVENTS, values: [null, null, null, null] }] })
    const chips = legend(w).map((b) => b.text())
    expect(chips[1]).toContain('—')
    expect(chips[1]).not.toMatch(/\b0\b/)
    w.unmount()
  })

  it('under a full bleed the legend keeps the gutter above the floor', () => {
    const w = mount(UiAreaChart, {
      props: { x: X, series: [ORDERS, EVENTS], ariaLabel: 'x' },
      global: {
        provide: {
          [CHART_BLEED as symbol]: computed(() => 'surface'),
          [CHART_FLOOR as symbol]: computed(() => true),
        },
      },
    })
    expect(w.find('[role="group"]').classes()).toContain('pb-surface')
  })

  it('the legend chip stands on the xs step of the ladder', () => {
    const w = chart()
    for (const b of legend(w)) expect(b.classes()).toContain('h-7')
    w.unmount()
  })

  it('a dashed series keeps one stroke width through its partial tail', () => {
    const w = chart({ series: [PROFIT], partial: true })
    const widths = w.findAll('path[fill="none"]').map((p) => p.attributes('stroke-width'))
    expect(new Set(widths)).toEqual(new Set(['1.5']))
    w.unmount()
  })

  it('the plot lets a finger scroll the page', () => {
    const w = chart()
    expect(w.find('[role="img"]').classes()).toContain('touch-pan-y')
    w.unmount()
  })
})

describe('UiAreaChart — highlight and muted', () => {
  it('highlight puts a dot on each series at that point, and the cursor takes over from it', async () => {
    const w = chart({ highlight: 1 })
    const dots = w.findAll('[data-highlight]')
    expect(dots).toHaveLength(2)
    expect(dots[0]!.attributes('style')).toContain('left: 33.3')
    await w.find('[role="img"]').trigger('focus')
    expect(w.find('[data-highlight]').exists()).toBe(false)
    w.unmount()
  })

  it('a highlight outside the points, or on a gap, draws no dot there', () => {
    expect(chart({ highlight: 9 }).find('[data-highlight]').exists()).toBe(false)
    expect(chart({ highlight: 1.5 }).find('[data-highlight]').exists()).toBe(false)
    expect(chart({ highlight: 2 }).findAll('[data-highlight]')).toHaveLength(1)
  })

  it('a muted series is gray and takes no chart color from the ones after it', () => {
    const w = chart({ series: [{ ...EVENTS, muted: true }, ORDERS] })
    const groups = w.findAll('svg g')
    expect(groups[0]!.classes()).toContain('text-chart-other')
    expect(groups[1]!.classes()).toContain('text-chart-1')
  })
})

describe('UiAreaChart — highlight in a bled card', () => {
  it('a dot on the last point stands inside the edge when the chart runs to the card sides', () => {
    const bled = mount(UiAreaChart, {
      props: { x: X, series: [ORDERS], ariaLabel: 'Orders', highlight: 3 },
      global: { provide: { [CHART_BLEED as symbol]: computed(() => 'surface') } },
    })
    expect(bled.find('[data-highlight]').classes()).toContain('-translate-x-full')
    expect(chart({ highlight: 3 }).find('[data-highlight]').classes()).toContain('-translate-x-1/2')
  })
})

describe('UiAreaChart — review follow-ups, highlight and muted', () => {
  it('a muted series is painted behind the colored ones, whatever its place in the list', () => {
    const groups = chart({ series: [ORDERS, { ...EVENTS, muted: true }] }).findAll('svg g')
    expect(groups[0]!.classes()).toContain('text-chart-other')
    expect(groups[1]!.classes()).toContain('text-chart-1')
  })

  it('the cursor dots at the ends stand inside a bled card too', async () => {
    const w = mount(UiAreaChart, {
      props: { x: X, series: [ORDERS], ariaLabel: 'Orders' },
      global: { provide: { [CHART_BLEED as symbol]: computed(() => 'surface') } },
      attachTo: document.body,
    })
    const plot = w.find('[role="img"]')
    await plot.trigger('focus')
    await plot.trigger('keydown', { key: 'Home' })
    const dot = () => w.find('span.border-2.bg-surface')
    expect(dot().classes()).not.toContain('-translate-x-1/2')
    await plot.trigger('keydown', { key: 'End' })
    expect(dot().classes()).toContain('-translate-x-full')
    w.unmount()
  })

  it('one point, bled, keeps its dot centered', () => {
    const w = mount(UiAreaChart, {
      props: { x: ['2026-09'], series: [ORDERS], ariaLabel: 'Orders', highlight: 0 },
      global: { provide: { [CHART_BLEED as symbol]: computed(() => 'surface') } },
    })
    expect(w.find('[data-highlight]').classes()).toContain('-translate-x-1/2')
  })

  it('while one series stands alone only it keeps its highlight dot', async () => {
    const w = chart({ highlight: 1 })
    await w.findAll('button[aria-pressed]')[0]!.trigger('click')
    expect(w.findAll('[data-highlight]')).toHaveLength(1)
  })
})

describe('UiAreaChart — labels after the data changes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  it('a shorter series at the same width labels every point again', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private cb: ResizeObserverCallback) {}
        observe() {
          this.cb([{ contentRect: { width: 300 } } as ResizeObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40)
    const days = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      )
    const values = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
    const w = mount(UiAreaChart, {
      props: {
        x: days(60),
        series: [{ key: 'a', label: 'A', values: values(60) }],
        grain: 'day',
        ariaLabel: 'A',
      },
      attachTo: document.body,
    })
    const hidden = () => w.findAll('span[class*="text-xs"].invisible').length
    for (let i = 0; i < 4; i++) await nextTick()
    expect(hidden()).toBeGreaterThan(30)
    await w.setProps({ x: days(4), series: [{ key: 'a', label: 'A', values: values(4) }] })
    for (let i = 0; i < 4; i++) await nextTick()
    expect(hidden()).toBe(0)
    w.unmount()
  })
})

// A chord with Alt, Ctrl or Meta is the browser's: Alt with ← goes back a page, Ctrl or ⌘ moves a
// caret or scrolls. The component takes the key only alone.
const chord = (el: Element, key: string, mods: Partial<KeyboardEventInit>) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  el.dispatchEvent(e)
  return e
}

describe('UiAreaChart — a chord is the browser’s', () => {
  it('Alt, Ctrl or Meta with an arrow, Home or End leaves the point and the key alone', async () => {
    const w = chart()
    const plot = w.find('[role="img"]')
    await plot.trigger('focus')
    const live = () => w.find('p[aria-live="polite"]').text()
    const before = live()
    for (const [key, mods] of [
      ['ArrowLeft', { altKey: true }],
      ['ArrowRight', { ctrlKey: true }],
      ['Home', { metaKey: true }],
    ] as const) {
      expect(chord(plot.element, key, mods).defaultPrevented, key).toBe(false)
      await nextTick()
      expect(live(), key).toBe(before)
    }
    w.unmount()
  })
})

describe('UiAreaChart — review follow-ups, nothing to draw alone', () => {
  const alone = (
    props: { x: string[]; series: AreaSeries[] },
    provide: Record<symbol, unknown> = {},
  ) =>
    mount(UiAreaChart, {
      props: { ariaLabel: 'Load', ...props },
      global: { provide },
    })

  it('says there is no data where the chart stands, with no points or no number among them', () => {
    for (const props of [
      { x: [], series: [{ key: 'a', label: 'Load', values: [] }] },
      { x: ['2026-08', '2026-09'], series: [{ key: 'a', label: 'Load', values: [null, null] }] },
    ]) {
      const w = alone(props)
      expect(w.text()).toContain('No data for this period')
      expect(w.find('[role="group"]').attributes('aria-label')).toBe('Load')
      expect(w.find('[role="img"]').exists()).toBe(false)
      expect(w.find('[tabindex]').exists()).toBe(false)
    }
  })

  it('leaves it to the card around it, and draws a lone point', () => {
    const empty = { x: [], series: [{ key: 'a', label: 'Load', values: [] }] }
    const inCard = alone(empty, { [CHART_EMPTY as symbol]: computed(() => false) })
    expect(inCard.text()).not.toContain('No data for this period')
    const one = alone({ x: ['2026-09'], series: [{ key: 'a', label: 'Load', values: [40] }] })
    expect(one.find('[role="img"]').exists()).toBe(true)
  })
})

describe('UiAreaChart — review follow-ups', () => {
  const days = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10),
    )
  const crowd = (n: number) => ({
    x: days(n),
    series: [{ key: 'load', label: 'Load', values: days(n).map((_, i) => i) }],
    grain: 'day' as const,
    ariaLabel: 'Load by day',
  })
  const crowded = (warn: { mock: { calls: unknown[][] } }) =>
    warn.mock.calls.filter(([m]) => String(m).includes('past 500 points'))

  it('warns once in development when it draws more than 500 points, and not at 500', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // The first load of a card draws a ghost, not the area: the warning is about what is given.
    const w = mount(UiAreaChart, {
      props: crowd(500),
      global: { provide: { [CHART_SKELETON as symbol]: computed(() => true) } },
    })
    expect(crowded(warn)).toHaveLength(0)
    await w.setProps(crowd(501))
    await w.setProps(crowd(502))
    expect(crowded(warn)).toHaveLength(1)
    warn.mockRestore()
  })
})
