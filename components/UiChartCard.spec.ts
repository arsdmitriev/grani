import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Comment, defineComponent, h, inject, nextTick } from 'vue'
import { withGrani } from '../test/harness'
import { CHART_BLEED, CHART_EMPTY, CHART_FLOOR, CHART_SKELETON } from '../utils/surface'
import UiChartCard from './UiChartCard.vue'
import UiDelta from './UiDelta.vue'

// A stand-in chart: it draws what a chart would, and its skeleton while the card says so.
const Chart = defineComponent({
  setup() {
    const skeleton = inject(CHART_SKELETON)
    return () => h('div', { class: skeleton?.value ? 'chart-skeleton' : 'chart' })
  },
})
const card = (
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {},
  plugins = withGrani(),
) =>
  mount(UiChartCard, {
    props: { title: 'Spending by month', ...props },
    slots: { default: () => h(Chart), ...slots },
    global: { plugins },
  })
const status = (w: ReturnType<typeof card>) => w.find('[role="status"].sr-only').text()

describe('UiChartCard', () => {
  it('at rest draws the title, the description and the chart, and says nothing', () => {
    const w = card({ description: 'Family spending only' })
    expect(w.find('h2').text()).toBe('Spending by month')
    expect(w.text()).toContain('Family spending only')
    expect(w.find('.chart').exists()).toBe(true)
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(status(w)).toBe('')
  })

  it('the first load hands the chart its skeleton and says it loads', () => {
    const w = card({ loading: true, empty: true })
    expect(w.find('.chart-skeleton').exists()).toBe(true)
    expect(w.attributes('aria-busy')).toBe('true')
    expect(status(w)).toBe('Loading the chart…')
  })

  it('without a chart in the slot the first load draws a band of bars in its place', () => {
    const w = mount(UiChartCard, { props: { title: 'x', loading: true, empty: true } })
    expect(w.find('.h-60[aria-hidden="true"]').exists()).toBe(true)
  })

  it('a refresh keeps the chart in view, dimmed and busy, and says it is updating', () => {
    const w = card({ loading: true, value: 1200 })
    const chart = w.find('.chart')
    expect(chart.exists()).toBe(true)
    expect(chart.element.parentElement!.className).toContain('opacity-60')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.text()).toContain('Updating…')
    expect(status(w)).toBe('Updating…')
  })

  it('nothing to draw is the card’s own words, or the caller’s #empty', () => {
    const own = card({ empty: true })
    expect(own.text()).toContain('No data for this period')
    const theirs = card({ empty: true }, { empty: '<p class="next">Pick another period</p>' })
    expect(theirs.find('.next').exists()).toBe(true)
    expect(theirs.text()).not.toContain('No data for this period')
  })

  it('a failed load is an alert with the message and Retry, never "no data"', async () => {
    const w = card({ empty: true, error: 'The server did not answer.' })
    expect(w.find('[role="alert"]').text()).toContain('The server did not answer.')
    expect(w.text()).not.toContain('No data for this period')
    await w.find('[role="alert"] button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('a retry that loads again shows the skeleton, not the old error', () => {
    const w = card({ empty: true, loading: true, error: 'The server did not answer.' })
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.find('.chart-skeleton').exists()).toBe(true)
  })

  it('a failed refresh keeps the chart and says it on the title line, the reason in the tooltip', async () => {
    const w = card({ error: 'The server did not answer.' })
    expect(w.find('.chart').exists()).toBe(true)
    expect(w.find('.chart').element.parentElement!.className).not.toContain('opacity-60')
    // The header row: the words and, beside them, what the card says about the refresh.
    const head = w.find('h2').element.parentElement!.parentElement!
    // Short on the title line, so a title beside it keeps its one line and the chart stays put.
    expect(head.querySelector('[aria-hidden="true"][class*="text-xs"]')?.textContent?.trim()).toBe(
      'Not updated',
    )
    expect(w.findComponent({ name: 'UiTooltip' }).props('content')).toBe(
      'The server did not answer.',
    )
    const retry = w.find('[data-chart-retry]')
    expect(retry.attributes('aria-label')).toBe('Retry')
    expect(retry.text()).toBe('')
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    await w.setProps({ loading: true })
    expect(w.find('[data-chart-retry]').attributes('aria-disabled')).toBe('true')
  })

  it('a number headline reads in the format, with the app currency', () => {
    const w = card(
      { value: 42380.5, format: 'money', caption: 'Spending over 12 months' },
      {},
      withGrani({ currency: 'EUR' }),
    )
    expect(w.text()).toContain('42,380.50 EUR')
    expect(w.text()).toContain('Spending over 12 months')
    expect(card({ value: '12 h' }).text()).toContain('12 h')
  })

  it('a headline and a caption that are null while loading keep their lines as skeleton', () => {
    const w = card({ loading: true, empty: true, value: null, caption: null })
    const lines = w.findAll('.h-8, .h-5')
    expect(lines.length).toBeGreaterThanOrEqual(2)
    expect(card({ loading: true, empty: true }).find('.h-8').exists()).toBe(false)
    expect(card({ value: null }).find('.text-2xl').exists()).toBe(false)
  })

  it('a bare footer note is a skeleton on the first load and a held line over a chart with no data', () => {
    const footer = { footer: 'Average 3,530 a month' }
    expect(card({}, footer).text()).toContain('Average 3,530')
    const loading = card({ loading: true, empty: true }, footer)
    expect(loading.text()).not.toContain('Average 3,530')
    expect(loading.find('.me-auto .animate-pulse').exists()).toBe(true)
    const empty = card({ empty: true }, footer)
    expect(empty.text()).not.toContain('Average 3,530')
    expect(empty.find('span[data-chart-held]').exists()).toBe(true)
  })

  it('#actions stand on the title line in every state: a control there is never pulled from under the focus', () => {
    const actions = { actions: '<a class="details" href="#">Budget</a>' }
    for (const props of [
      {},
      { loading: true },
      { error: 'Late' },
      { loading: true, empty: true },
      { empty: true },
      { empty: true, error: '' },
    ])
      expect(card(props, actions).find('.details').exists(), JSON.stringify(props)).toBe(true)
  })

  it('a delta in #actions leaves with the data and comes back with it', () => {
    const actions = { actions: () => h(UiDelta, { current: 120, previous: 100 }) }
    const badge = (props: Record<string, unknown>) =>
      card(props, actions).find('.ui-badge, [class*="badge"]').exists()
    // Data in view: at rest, on a refresh, after a failed refresh.
    expect(badge({})).toBe(true)
    expect(badge({ loading: true })).toBe(true)
    expect(badge({ error: 'Late' })).toBe(true)
    for (const props of [
      { loading: true, empty: true },
      { empty: true },
      { empty: true, error: '' },
    ])
      expect(badge(props), JSON.stringify(props)).toBe(false)
  })

  it('a footer of markup stays with nothing to draw; only a bare note is held', () => {
    const markup = {
      footer:
        '<span class="me-auto note">Busiest on Monday</span><a class="all" href="#">All analytics</a>',
    }
    const w = card({ empty: true }, markup)
    expect(w.find('.all').exists()).toBe(true)
    expect(w.find('span[data-chart-held]').exists()).toBe(false)
  })
})

describe('UiChartCard — review follow-ups', () => {
  it('a failed refresh is said in the live region with its reason', () => {
    const w = card({ error: 'The newest month did not load.' })
    expect(status(w)).toBe('Could not refresh chart data. The newest month did not load.')
    expect(card({ empty: true, error: 'x' }).find('[role="status"].sr-only').text()).toBe('')
  })

  it('Retry keeps the focus while the request is in flight', async () => {
    const w = card({ error: 'The newest month did not load.' }, {})
    document.body.appendChild(w.element)
    const button = w.find('button').element as HTMLButtonElement
    button.focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(button)
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toBeUndefined()
    w.unmount()
  })

  it('Retry on the failed plate hands the focus to the card when the skeleton comes', async () => {
    const w = card({ empty: true, error: 'The server did not answer.' })
    document.body.appendChild(w.element)
    ;(w.find('[role="alert"] button').element as HTMLButtonElement).focus()
    await w.setProps({ loading: true })
    await nextTick()
    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })

  it('Retry asks nothing while loading and never waits on an answer that does not come', async () => {
    const w = card({ error: 'The server did not answer.' })
    await w.find('button').trigger('click')
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(2)
    expect(w.text()).not.toContain('Please wait')
    await w.setProps({ loading: true })
    await w.find('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(2)
  })

  it('Retry that leaves with the focus when the error clears hands the focus to the card', async () => {
    const w = card({ error: 'The server did not answer.' })
    document.body.appendChild(w.element)
    ;(w.find('button').element as HTMLButtonElement).focus()
    await w.setProps({ error: null })
    await nextTick()
    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })

  it('the live region is the same node when loading starts from empty', async () => {
    const w = card({ empty: true })
    const region = w.find('[role="status"].sr-only').element
    await w.setProps({ loading: true })
    expect(w.find('[role="status"].sr-only').element).toBe(region)
    expect(region.textContent).toBe('Loading the chart…')
  })

  it('a refresh turns a spinner in the middle of the card, and the title line stays as it was', () => {
    const w = card({ loading: true })
    const spinner = w.find('[data-chart-updating]')
    expect(spinner.find('.ui-spinner').exists()).toBe(true)
    expect(spinner.classes()).toContain('absolute')
    expect(w.classes()).toContain('relative')
    const shown = w.findAll('span').filter((e) => !e.classes('sr-only'))
    expect(shown.some((e) => e.text().includes('Updating'))).toBe(false)
    expect(status(w)).toBe('Updating…')
  })

  it('no spinner at rest or on the first load', () => {
    expect(card().find('[data-chart-updating]').exists()).toBe(false)
    expect(card({ loading: true, empty: true }).find('[data-chart-updating]').exists()).toBe(false)
  })

  it('a caption without a value still shows; value 0 reads as 0', () => {
    expect(card({ value: null, caption: 'Over 12 months' }).text()).toContain('Over 12 months')
    expect(card({ value: null, caption: 'Over 12 months' }).find('.text-2xl').exists()).toBe(false)
    expect(card({ value: 0, format: 'number' }).find('.text-2xl').text()).toBe('0')
  })
  it('an error that clears with the focus on a chart control leaves the focus there', async () => {
    const w = card(
      { error: 'The server did not answer.' },
      { default: () => h('button', { class: 'legend' }, 'Orders') },
    )
    document.body.appendChild(w.element)
    const legend = w.find('.legend').element as HTMLButtonElement
    legend.focus()
    await w.setProps({ error: null })
    await nextTick()
    expect(document.activeElement).toBe(legend)
    w.unmount()
  })

  it('the plate turning into the title line hands the focus to the Retry now shown', async () => {
    const w = card({ empty: true, error: 'The server did not answer.' })
    document.body.appendChild(w.element)
    ;(w.find('[data-chart-retry]').element as HTMLButtonElement).focus()
    await w.setProps({ empty: false })
    await nextTick()
    expect(document.activeElement).toBe(w.find('[data-chart-retry]').element)
    w.unmount()
  })

  it('the card root that takes the focus draws no outline', () => {
    expect(card().classes()).toContain('focus:outline-hidden')
  })
})

describe('UiChartCard — bleed', () => {
  const Probe = defineComponent({
    setup() {
      const bleed = inject(CHART_BLEED, null)
      return () => h('div', { class: 'chart', 'data-bleed': bleed?.value ?? 'none' })
    },
  })
  const bled = (props: Record<string, unknown> = {}) =>
    mount(UiChartCard, { props: { title: 'Saved', ...props }, slots: { default: () => h(Probe) } })

  it('draws no line under the title: the headline and the chart follow it', () => {
    expect(bled({ description: 'Family only' }).find('.border-b').exists()).toBe(false)
  })

  it('runs the chart to the sides and hands it the gutter, 24 at md', () => {
    const w = bled({ bleed: 'sides' })
    expect(w.find('.chart').attributes('data-bleed')).toBe('surface')
    expect(w.find('.chart').element.parentElement?.parentElement?.className).toContain(
      '-mx-surface',
    )
    expect(bled({ bleed: 'sides', size: 'md' }).find('.chart').attributes('data-bleed')).toBe(
      'surface-md',
    )
  })

  it('without bleed the chart stays inside and is told so', () => {
    const w = bled()
    expect(w.find('.chart').attributes('data-bleed')).toBe('none')
    expect(w.html()).not.toContain('-mx-surface')
  })

  it('full takes the floor too, unless a footer stands under the chart', () => {
    const floor = (w: ReturnType<typeof bled>) =>
      w.find('.chart').element.parentElement?.parentElement?.className ?? ''
    expect(floor(bled({ bleed: 'full' }))).toContain('-mb-surface')
    expect(floor(bled({ bleed: 'sides' }))).not.toContain('-mb-surface')
    const withFooter = mount(UiChartCard, {
      props: { title: 'Saved', bleed: 'full' },
      slots: { default: () => h(Probe), footer: () => 'Note' },
    })
    expect(floor(withFooter)).not.toContain('-mb-surface')
  })

  it('follows a bound bleed: the chart is told when it turns on', async () => {
    const w = bled()
    await w.setProps({ bleed: 'sides' })
    expect(w.find('.chart').attributes('data-bleed')).toBe('surface')
  })
})

describe('UiChartCard — nothing to draw', () => {
  const Ghost = defineComponent({
    setup() {
      const empty = inject(CHART_EMPTY, null)
      return () => h('button', { class: 'chart', 'data-empty': String(empty?.value ?? false) })
    },
  })
  const blank = (props: Record<string, unknown> = {}) =>
    mount(UiChartCard, {
      props: { title: 'Spending', empty: true, ...props },
      slots: { default: () => h(Ghost) },
    })

  it('keeps the chart in its place, told it is empty, out of reach under the words', () => {
    const w = blank()
    const chart = w.find('.chart')
    expect(chart.attributes('data-empty')).toBe('true')
    const shell = chart.element.parentElement!
    expect(shell.hasAttribute('inert')).toBe(true)
    expect(shell.getAttribute('aria-hidden')).toBe('true')
    expect(w.find('[data-chart-empty]').text()).toContain('No data for this period')
  })

  it('the chart is not told it is empty while it loads or has data', () => {
    expect(blank({ loading: true }).find('.chart').attributes('data-empty')).toBe('false')
    const shown = blank({ empty: false })
    expect(shown.find('.chart').attributes('data-empty')).toBe('false')
    expect(shown.find('[data-chart-empty]').exists()).toBe(false)
    expect(shown.find('.chart').element.parentElement!.hasAttribute('inert')).toBe(false)
  })

  it("a failed load keeps the chart's place under the failure words", async () => {
    const w = blank({ error: 'The server did not answer.' })
    expect(w.find('.chart').attributes('data-empty')).toBe('true')
    expect(w.find('.chart').element.parentElement!.hasAttribute('inert')).toBe(true)
    const cell = w.find('[data-chart-empty]')
    expect(cell.text()).toContain('The server did not answer.')
    const retry = cell.find('button[data-chart-retry]')
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('nothing to draw over a held chart keeps the headline lines blank', () => {
    const failed = blank({ error: 'Down.', value: null, caption: null })
    expect(failed.findAll('[data-chart-held]')).toHaveLength(2)
    const gone = blank({ value: undefined, caption: undefined })
    expect(gone.find('[data-chart-held]').exists()).toBe(false)
  })

  it('a failed load without a chart in the slot says it in the body', () => {
    const w = mount(UiChartCard, { props: { title: 'Spending', empty: true, error: 'Down.' } })
    expect(w.find('[data-chart-empty]').exists()).toBe(false)
    expect(w.text()).toContain('Down.')
    expect(w.find('button[data-chart-retry]').exists()).toBe(true)
  })

  it('without a chart in the slot the words stand in the body, as before', () => {
    const w = mount(UiChartCard, { props: { title: 'Spending', empty: true } })
    expect(w.find('[data-chart-empty]').exists()).toBe(false)
    expect(w.text()).toContain('No data for this period')
  })
})

describe('UiChartCard — review follow-ups, final lens', () => {
  const Plain = defineComponent({ setup: () => () => h('div', { class: 'chart' }) })
  const withChart = (props: Record<string, unknown>, slots: Record<string, unknown> = {}) =>
    mount(UiChartCard, {
      props: { title: 'Spending', ...props },
      slots: { default: () => h(Plain), ...slots },
    })

  it('a #empty taller than the chart, or a slot with no height, sits in the flow: it shares the chart’s grid cell', () => {
    const w = withChart({ empty: true })
    const words = w.find('[data-chart-empty]')
    expect(words.classes()).not.toContain('absolute')
    const cell = words.element.parentElement!
    expect(cell.classList.contains('grid')).toBe(true)
    expect(cell.contains(w.find('.chart').element)).toBe(true)
  })

  it('a caption with the value left out draws no headline line', () => {
    const w = withChart({ caption: 'Over 12 months' })
    expect(w.text()).toContain('Over 12 months')
    expect(w.find('.text-2xl').exists()).toBe(false)
  })

  it('an empty error string is still a failed load, with a general reason', () => {
    const failed = withChart({ empty: true, error: '' })
    expect(failed.text()).toContain('Could not load chart data')
    expect(failed.text()).toContain('Try loading the chart again.')
    expect(failed.text()).not.toContain('No data for this period')
    const stale = withChart({ error: '' })
    expect(stale.findComponent({ name: 'UiTooltip' }).props('content')).toBe(
      'Try loading the chart again.',
    )
    expect(status(stale)).toBe('Could not refresh chart data. Try loading the chart again.')
  })

  it('a footer that appears later takes the bled chart off the floor', async () => {
    const Host = defineComponent({
      props: { note: Boolean },
      setup(p) {
        return () =>
          h(
            UiChartCard,
            { title: 'Spending', bleed: 'full' },
            p.note
              ? { default: () => h(Plain), footer: () => 'A note' }
              : { default: () => h(Plain) },
          )
      },
    })
    const w = mount(Host)
    const floorOf = () => w.find('.chart').element.parentElement!.parentElement!.className
    expect(floorOf()).toContain('-mb-surface')
    await w.setProps({ note: true })
    expect(floorOf()).not.toContain('-mb-surface')
  })

  it('nothing to draw over a chart keeps the footer’s place, without its note', () => {
    const w = withChart({ empty: true }, { footer: () => 'A note' })
    expect(w.text()).not.toContain('A note')
    expect(w.find('span[data-chart-held]').exists()).toBe(true)
    const bare = mount(UiChartCard, {
      props: { title: 'Spending', empty: true },
      slots: { footer: () => 'A note' },
    })
    expect(bare.text()).not.toContain('A note')
  })

  it('a default slot that renders nothing still gets the first-load band', () => {
    const w = card({ loading: true, empty: true }, { default: () => [h(Comment)] })
    expect(w.find('.h-60').exists()).toBe(true)
  })

  it('a default slot that renders nothing is no chart to hold when there is no data', () => {
    const w = card({ empty: true }, { default: () => [h(Comment)] })
    expect(w.find('[data-chart-empty]').exists()).toBe(false)
    expect(w.text()).toContain('No data')
  })

  it('a footer slot that renders nothing leaves a full-bleed chart on the floor', () => {
    let floor: { value: boolean } | undefined
    const Probe = defineComponent({
      setup() {
        floor = inject(CHART_FLOOR)
        return () => h('div', { class: 'chart' })
      },
    })
    const w = card({ bleed: 'full' }, { default: () => h(Probe), footer: () => [h(Comment)] })
    expect(floor?.value).toBe(true)
    expect(w.find('.-mb-surface').exists()).toBe(true)
    expect(w.find('footer').exists()).toBe(false)
  })

  it('a footer note given as bare text stands at the start, as its skeleton does', () => {
    const w = card({}, { footer: () => 'On average 3,530 a month' })
    const note = w.findAll('span.me-auto').find((s) => s.text() === 'On average 3,530 a month')
    expect(note).toBeDefined()
    expect(note!.classes()).toEqual(expect.arrayContaining(['text-sm/5.5', 'text-fg-muted']))
  })

  it('a footer of a note and an action is laid out by its own markup: the action is not wrapped in the note', () => {
    const w = card(
      {},
      {
        footer: () => [
          h('span', { class: 'me-auto note' }, 'Busiest on Tuesday'),
          h('button', 'All analytics'),
        ],
      },
    )
    const button = w.find('button:not([data-chart-retry])')
    expect(button.element.parentElement!.querySelector('.note')).not.toBeNull()
    expect(button.element.parentElement!.classList.contains('me-auto')).toBe(false)
  })

  it('a footer with its own markup keeps its own size and color', () => {
    const w = card({}, { footer: () => h('strong', { class: 'text-fg' }, 'Total 3,530') })
    const wrap = w.find('strong').element.parentElement!
    expect(wrap.className).not.toContain('text-fg-muted')
  })

  it('a refresh dims the headline with the chart', () => {
    const w = card({ loading: true, value: 1260, caption: 'in September' })
    const headline = w.find('p.text-2xl').element.parentElement!
    expect(headline.className).toContain('opacity-60')
    expect(headline.textContent).toContain('in September')
  })
})

describe('UiChartCard — retry on a failed first load', () => {
  it('the Retry button carries no loading state: the skeleton replaces the plate', () => {
    const w = mount(UiChartCard, {
      props: { title: 'Revenue', empty: true, error: 'No answer', loading: false },
      slots: { default: () => h('div', { class: 'chart' }) },
    })
    const retry = w.find('[data-chart-retry]')
    expect(retry.exists()).toBe(true)
    expect(retry.attributes('aria-busy')).toBeUndefined()
  })
})

describe('UiChartCard — chart review', () => {
  it('the words of a failed load add no height of their own above and below', () => {
    const w = card({ empty: true, error: 'The server did not answer.' })
    const words = w.find('[data-chart-empty]')
    expect(words.classes()).toContain('px-surface')
    expect(words.classes()).not.toContain('p-surface')
  })

  it('the words of nothing to draw stand in the middle of the headline and the chart together', () => {
    const w = card({ value: null, caption: null, empty: true, error: 'The server did not answer.' })
    const words = w.find('[data-chart-empty]')
    // Over the headline's held lines and the chart's place, not the chart's alone, so the blank
    // lines above do not push them under the middle.
    expect(words.classes()).toContain('row-span-2')
    expect(words.element.parentElement).toBe(
      w.find('[data-chart-held]').element.parentElement?.parentElement,
    )
  })

  it('on a card whose chart takes the floor, the words keep the bottom gutter', () => {
    const w = card({ bleed: 'full', empty: true, error: 'The server did not answer.' })
    const words = w.find('[data-chart-empty]').element
    // Not inside the cell that runs to the card's floor: they end where the card's gutter starts.
    expect(words.parentElement?.className).not.toContain('-mb-surface')
  })
})
