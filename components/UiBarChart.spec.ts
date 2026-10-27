import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick } from 'vue'
import { CHART_BLEED, CHART_EMPTY, CHART_FLOOR, CHART_SKELETON } from '../utils/surface'
import UiBarChart, { type BarSeries } from './UiBarChart.vue'

const X = ['2026-06', '2026-07', '2026-08', '2026-09']
const ORDERS: BarSeries = { key: 'orders', label: 'Orders', values: [40, 50, 60, 30] }
const EVENTS: BarSeries = { key: 'events', label: 'Events', values: [10, 20, null, 15] }
const chart = (props: Record<string, unknown> = {}, provide: Record<symbol, unknown> = {}) =>
  mount(UiBarChart, {
    props: { x: X, series: [ORDERS], ariaLabel: 'Revenue by month', ...props },
    global: { provide },
  })
const bars = (w: ReturnType<typeof chart>) => w.findAll('[data-bar]')
const top = (el: { attributes: (n: string) => string | undefined }) =>
  parseFloat(/top: (-?[\d.]+)%/.exec(el.attributes('style') ?? '')![1]!)
const height = (el: { attributes: (n: string) => string | undefined }) =>
  parseFloat(/height: ([\d.]+)%/.exec(el.attributes('style') ?? '')![1]!)
const legend = (w: ReturnType<typeof chart>) => w.findAll('[role="group"] button')
const rows = (w: ReturnType<typeof chart>) =>
  w.findAll('table tbody tr').map((r) => r.findAll('th, td').map((c) => c.text()))

describe('UiBarChart', () => {
  it('draws one bar per period, taller for a larger value', () => {
    const w = chart()
    const b = bars(w)
    expect(b).toHaveLength(4)
    expect(height(b[2]!)).toBeGreaterThan(height(b[3]!))
  })

  it('several series stand side by side, each in its color', () => {
    const w = chart({ series: [ORDERS, EVENTS] })
    expect(bars(w)).toHaveLength(7)
    expect(bars(w)[0]!.classes()).toContain('text-chart-1')
    expect(w.findAll('[data-bar].text-chart-2')).toHaveLength(3)
  })

  it('stack lays series one on another, the top one rounded', () => {
    const w = chart({ series: [ORDERS, EVENTS], stack: true })
    const first = bars(w).slice(0, 2)
    expect(first[0]!.classes()).not.toContain('rounded-t-control')
    expect(first[1]!.classes()).toContain('rounded-t-control')
    expect(top(first[1]!)).toBeLessThan(top(first[0]!))
  })

  it('a missing value keeps a thin stub, never a zero bar', () => {
    const w = chart({ series: [{ ...ORDERS, values: [40, null, 60, 30] }] })
    expect(bars(w)).toHaveLength(3)
    expect(w.findAll('span.bg-border.h-1')).toHaveLength(1)
  })

  it('a loss stands below the zero line, which is drawn solid', () => {
    const w = chart({ series: [{ ...ORDERS, values: [40, -20, 30, 10] }] })
    const loss = bars(w)[1]!
    expect(loss.classes()).toContain('rounded-b-control')
    expect(w.find('span.border-fg-subtle').exists()).toBe(true)
  })

  it('highlight lights one period and quiets the rest', () => {
    const w = chart({ highlight: 3 })
    const b = bars(w)
    expect(b[3]!.find('.opacity-30').exists()).toBe(false)
    expect(b[0]!.find('.opacity-30').exists()).toBe(true)
    expect(b[0]!.find('.h-0\\.5.top-0').exists()).toBe(true)
  })

  it('marks draw a line of reference with its label', () => {
    const w = chart({ marks: [{ at: 45, label: 'Plan' }] })
    expect(w.text()).toContain('Plan')
    expect(w.find('span.border-fg-muted.border-dashed').exists()).toBe(true)
  })

  it('labels="value" prints the value over each period', () => {
    const w = chart({ labels: 'value' })
    const printed = w.findAll('span.-translate-y-full').map((s) => s.text())
    expect(printed).toHaveLength(4)
    expect(printed[2]).toBe('60')
  })

  it('the legend names each series with its total; a press shows one alone', async () => {
    const w = chart({ series: [ORDERS, EVENTS] })
    expect(legend(w).map((b) => b.text())).toEqual(['Orders 180', 'Events 45'])
    await legend(w)[1]!.trigger('click')
    expect(legend(w)[1]!.attributes('aria-pressed')).toBe('true')
    expect(bars(w)).toHaveLength(3)
  })

  it('a series with no values shows a dash for its total', () => {
    const w = chart({ series: [ORDERS, { ...EVENTS, values: [null, null, null, null] }] })
    expect(legend(w)[1]!.text()).toContain('—')
  })

  it('tooltipTotal adds a sum of its series in the table', () => {
    const w = chart({
      series: [ORDERS, EVENTS],
      stack: true,
      tooltipTotal: { label: 'Revenue', of: ['orders', 'events'] },
    })
    expect(w.findAll('table thead th').map((c) => c.text())).toContain('Revenue')
    expect(rows(w)[2]).toEqual(['August 2026', '60', '—', '60'])
  })

  it('a hidden table holds every value for a screen reader', () => {
    const w = chart()
    expect(w.find('table caption').text()).toBe('Revenue by month')
    expect(rows(w)).toHaveLength(4)
  })

  it('the plot is one tab stop: focus says the newest period, the arrows walk', async () => {
    const w = chart()
    const plot = w.find('[role="img"]')
    expect(plot.attributes('tabindex')).toBe('0')
    await plot.trigger('focus')
    expect(w.find('[aria-live="polite"]').text()).toContain('September 2026')
    await plot.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('[aria-live="polite"]').text()).toContain('August 2026')
  })

  it('without a value axis there are no ticks and no grid', () => {
    const w = chart({ yAxis: false })
    expect(w.find('.ps-12').exists()).toBe(false)
    expect(w.find('span.border-dashed.border-border').exists()).toBe(false)
  })

  it('the tooltip stays on the side with more room and wraps', async () => {
    const w = chart()
    const plot = w.find('[role="img"]')
    plot.element.getBoundingClientRect = () => ({ left: 0, width: 400 }) as DOMRect
    await plot.trigger('pointermove', { clientX: 20 })
    const tip = w.find('.z-tooltip')
    expect(tip.attributes('style')).toContain('left:')
    expect(tip.classes().join(' ')).toContain('max-w-[calc(50%-0.75rem)]')
    await plot.trigger('pointermove', { clientX: 380 })
    expect(w.find('.z-tooltip').attributes('style')).toContain('right:')
  })
})

describe('UiBarChart — in a chart card', () => {
  it('draws pale bars on the first load, pulsing, and no plot', () => {
    const w = chart({}, { [CHART_SKELETON as symbol]: computed(() => true) })
    expect(w.find('[role="img"]').exists()).toBe(false)
    expect(w.find('.\\!animate-none').exists()).toBe(false)
  })

  it('nothing to draw holds the bars still', () => {
    const w = chart({}, { [CHART_EMPTY as symbol]: computed(() => true) })
    expect(w.find('[role="img"]').exists()).toBe(false)
    expect(w.find('.\\!animate-none').exists()).toBe(true)
  })

  it('bled, it drops the value axis, keeps its words and bars on the gutter, the ring inside', () => {
    const w = chart(
      { series: [ORDERS, EVENTS] },
      { [CHART_BLEED as symbol]: computed(() => 'surface') },
    )
    expect(w.find('.ps-12').exists()).toBe(false)
    const plot = w.find('[role="img"]')
    expect(plot.element.parentElement!.classList).toContain('px-surface')
    expect(plot.classes()).not.toContain('px-surface')
    expect(plot.classes().join(' ')).toContain('shadow-(--ui-ring-inset)')
    expect(w.find('[role="group"]').classes()).toContain('px-surface')
  })

  it('on the floor the legend keeps the gutter above the edge', () => {
    const w = chart(
      { series: [ORDERS, EVENTS] },
      {
        [CHART_BLEED as symbol]: computed(() => 'surface'),
        [CHART_FLOOR as symbol]: computed(() => true),
      },
    )
    expect(w.find('[role="group"]').classes()).toContain('pb-surface')
  })
})

describe('UiBarChart — review follow-ups', () => {
  it('a bled chart picks the band under the pointer, not one shifted by the gutter', async () => {
    const w = chart({}, { [CHART_BLEED as symbol]: computed(() => 'surface') })
    const plot = w.find('[role="img"]')
    // The plot is the bands alone: its box starts where the first band does.
    plot.element.getBoundingClientRect = () => ({ left: 16, width: 368 }) as DOMRect
    await plot.trigger('pointermove', { clientX: 70 })
    expect(w.find('.z-tooltip').text()).toContain('June 2026')
  })

  it('a stack counts only what it draws: label, legend total and tooltip sum agree', () => {
    const w = chart({
      series: [
        { key: 'a', label: 'A', values: [40, -20, 30, 10] },
        { key: 'b', label: 'B', values: [-10, null, 5, 5] },
      ],
      stack: true,
      labels: 'value',
      tooltipTotal: { label: 'Sum', of: ['a', 'b'] },
    })
    expect(legend(w).map((b) => b.text())).toEqual(['A 80', 'B 10'])
    expect(rows(w)[0]!.at(-1)).toBe('40')
    // A period with nothing above zero is no data there: a stub and no printed figure.
    expect(w.findAll('span.bg-border.h-1')).toHaveLength(1)
    const printed = w.findAll('span.whitespace-nowrap.text-center').map((s) => s.text())
    expect(printed).not.toContain('0')
  })

  it('value labels stand only where the axis keeps its label', () => {
    const w = chart({ labels: 'value', highlight: 0 })
    expect(w.findAll('span.whitespace-nowrap.text-center')).toHaveLength(4)
  })

  it('a highlight outside the periods leaves every bar in full color', () => {
    for (const highlight of [-1, 9, 1.5]) {
      const w = chart({ highlight })
      expect(w.find('[data-bar] .opacity-30').exists()).toBe(false)
    }
  })

  it('a zero period stays visible and distinct from a missing one', () => {
    const w = chart({ series: [{ ...ORDERS, values: [40, 0, null, 30] }] })
    const zero = bars(w)[1]!
    expect(zero.attributes('style')).toContain('min-height: 2px')
    expect(zero.classes()).toContain('text-chart-1')
    expect(w.findAll('span.bg-border.h-1')).toHaveLength(1)
  })

  it('a value label of a loss stands under its end', () => {
    const w = chart({ series: [{ ...ORDERS, values: [-40, -20, -10, -30] }], labels: 'value' })
    const label = w.findAll('span.whitespace-nowrap.text-center')[0]!
    expect(label.classes()).toContain('pt-1')
    expect(label.classes()).not.toContain('-translate-y-full')
  })

  it('the floor padding comes from the surface utility', async () => {
    const { FLOOR_PAD } = await import('../utils/surface')
    expect(FLOOR_PAD.surface).toBe('pb-surface')
  })

  it('a mark is said with the name in the hidden table', () => {
    const w = chart({ marks: [{ at: 45, label: 'Plan' }] })
    expect(w.find('table caption').text()).toBe('Revenue by month. Plan 45')
  })

  it('a lone period draws a bar no wider than the cap', () => {
    const w = chart({ x: ['2026-09'], series: [{ ...ORDERS, values: [10] }] })
    expect(w.find('.w-\\[64\\%\\]').classes()).toContain('max-w-16')
  })

  it('two marks with one label both draw', () => {
    const w = chart({
      marks: [
        { at: 20, label: 'Plan' },
        { at: 50, label: 'Plan' },
      ],
    })
    expect(w.findAll('span.absolute.border-fg-muted.border-dashed')).toHaveLength(2)
    expect(w.findAll('[data-mark]')).toHaveLength(2)
  })

  it('the hidden table keeps every series while one is isolated', async () => {
    const w = chart({ series: [ORDERS, EVENTS] })
    await legend(w)[0]!.trigger('click')
    expect(w.findAll('table thead th').map((c) => c.text())).toEqual(['When', 'Orders', 'Events'])
  })

  it('an empty chart alone is not a tab stop: it says there is no data', () => {
    const w = chart({ x: [], series: [{ ...ORDERS, values: [] }] })
    expect(w.find('[tabindex]').exists()).toBe(false)
    expect(w.text()).toContain('No data for this period')
  })
})

describe('UiBarChart — partial', () => {
  const X6 = ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00']
  const DAY = { key: 'use', label: 'Used', values: [0.9, 1.6, 2.4, 0.5, null, null] }
  const day = (props: Record<string, unknown> = {}) =>
    mount(UiBarChart, {
      props: { x: X6, series: [DAY], ariaLabel: 'Energy', partial: true, ...props },
    })

  it('hatches the newest period with data, and only that one', () => {
    const w = day()
    const hatched = w.findAll('[data-ongoing]')
    expect(hatched).toHaveLength(1)
    expect(w.findAll('[data-bar]')[3]!.find('[data-ongoing]').exists()).toBe(true)
  })

  it('the empty periods after it are to come: dashed outlines, not gray stubs', () => {
    const ahead = day().findAll('[data-ahead]')
    expect(ahead).toHaveLength(2)
    expect(ahead[0]!.classes()).toContain('border-dashed')
  })

  it('its tooltip and table say it is in progress', () => {
    const rows = day().findAll('.sr-only > table tbody tr')
    expect(rows[3]!.text()).toContain('in progress')
    expect(rows[2]!.text()).not.toContain('in progress')
  })

  it('without partial nothing is hatched and an empty period is a gray stub', () => {
    const w = day({ partial: false })
    expect(w.find('[data-ongoing]').exists()).toBe(false)
    expect(w.find('[data-ahead]').exists()).toBe(false)
  })
})

describe('UiBarChart — marks named under the chart, several in light', () => {
  const X6 = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
  const REV = { key: 'rev', label: 'Revenue', values: [1040, 1210, 900, 1180, 760, 910] }
  const plan = (props: Record<string, unknown> = {}) =>
    mount(UiBarChart, {
      props: {
        x: X6,
        series: [REV],
        ariaLabel: 'Revenue',
        marks: [{ at: 1000, label: 'Plan' }],
        ...props,
      },
    })

  it('a mark is named under the chart with its value, never on the plot', () => {
    const w = plan({ legend: false })
    const key = w.find('[data-mark]')
    expect(key.text()).toMatch(/Plan\s*1,000/)
    expect(w.find('.rounded-badge.border.bg-surface').exists()).toBe(false)
  })

  it('with the values printed over the bars, the mark reads as short as they do', () => {
    expect(plan({ labels: 'value', legend: false }).find('[data-mark]').text()).toMatch(/Plan\s*1K/)
  })

  it('highlight takes several periods: they stay full, the rest go quiet', () => {
    const w = plan({ highlight: [0, 1, 3] })
    const bars = w.findAll('[data-bar]')
    expect(bars[0]!.find('.opacity-30').exists()).toBe(false)
    expect(bars[3]!.find('.opacity-30').exists()).toBe(false)
    expect(bars[2]!.find('.opacity-30').exists()).toBe(true)
  })

  it('a list with nothing in range lights nothing', () => {
    expect(
      plan({ highlight: [9, -1] })
        .find('.opacity-30')
        .exists(),
    ).toBe(false)
  })
})

describe('UiBarChart — chart review', () => {
  it('a category period keeps its label, cut to its band, and the table names it whole', () => {
    const NAMES = [
      'Northwest region warehouse',
      'South depot',
      'Central',
      'East coast distribution',
    ]
    const w = chart({ x: NAMES, series: [{ key: 'o', label: 'Orders', values: [4, 6, 3, 8] }] })
    const labels = w
      .findAll('[aria-hidden="true"] span[class*="text-xs"]')
      .filter((s) => NAMES.includes(s.text()))
    expect(labels).toHaveLength(4)
    for (const l of labels)
      expect(l.classes()).toEqual(expect.arrayContaining(['truncate', 'min-w-0']))
    expect(labels.some((l) => l.classes().includes('invisible'))).toBe(false)
    expect(rows(w).map((r) => r[0])).toEqual(NAMES)
  })
})

describe('UiBarChart — labels after the data changes', () => {
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
    const w = mount(UiBarChart, {
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

describe('UiBarChart — review follow-ups, nothing to draw alone', () => {
  it('says there is no data with no number among the periods, and leaves it to a card', () => {
    const nulls = { x: ['2026-08', '2026-09'], series: [{ ...ORDERS, values: [null, null] }] }
    expect(chart(nulls).text()).toContain('No data for this period')
    const inCard = chart(nulls, { [CHART_EMPTY as symbol]: computed(() => false) })
    expect(inCard.text()).not.toContain('No data for this period')
  })
})

describe('UiBarChart — a zero in a stack', () => {
  const mountStack = () =>
    mount(UiBarChart, {
      props: {
        x: ['2026-07', '2026-08', '2026-09'],
        stack: true,
        series: [
          { key: 'o', label: 'Orders', values: [5, 0, null] },
          { key: 'e', label: 'Events', values: [3, 0, null] },
        ],
        tooltipTotal: { label: 'Sum', of: ['o', 'e'] },
        ariaLabel: 'Bookings',
      },
    })

  it('a period of zeros is a zero, not a gap: no gray stub, and its sum is 0', () => {
    const w = mountStack()
    const bands = w.findAll('[role="img"] .absolute.top-0.flex.h-full')
    expect(bands.map((b) => b.find('.bg-border').exists())).toEqual([false, false, true])
    const rows = w.findAll('tbody tr').map((r) => r.findAll('td').map((td) => td.text()))
    expect(rows[1]).toEqual(['0', '0', '0'])
    expect(rows[2]).toEqual(['—', '—', '—'])
    // A sliver of the first series on the line, as a zero bar side by side keeps.
    expect(bands[1]!.findAll('[data-bar]')).toHaveLength(1)
  })
})

describe('UiBarChart — review follow-ups', () => {
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
    warn.mock.calls.filter(([m]) => String(m).includes('past 500 periods'))

  it('warns once in development when it draws more than 500 periods, and not at 500', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // The first load of a card draws a ghost, not the bars: the warning is about what is given.
    const w = chart(crowd(500), { [CHART_SKELETON as symbol]: computed(() => true) })
    expect(crowded(warn)).toHaveLength(0)
    await w.setProps(crowd(501))
    await w.setProps(crowd(502))
    expect(crowded(warn)).toHaveLength(1)
    warn.mockRestore()
  })
})
