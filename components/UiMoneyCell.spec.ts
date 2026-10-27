import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { createGrani } from '../plugin'
import { withGrani } from '../test/harness'
import UiMoneyCell from './UiMoneyCell.vue'

// Intl groups with a no-break or a narrow no-break space; the spec reads both as a space.
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')
const lines = (w: ReturnType<typeof mount>) => w.findAll('span span').map((s) => plain(s.text()))

describe('UiMoneyCell', () => {
  it('formats major units by the locale with two decimals', () => {
    expect(lines(mount(UiMoneyCell, { props: { value: 1234.5 } }))).toEqual(['1,234.50'])
    const global = { plugins: withGrani({ locale: 'ru' }) }
    expect(lines(mount(UiMoneyCell, { props: { value: 1234.5 }, global }))).toEqual(['1 234,50'])
  })

  it('reads the decimal string an API sends; zero is a number; empty and unreadable are a dash', () => {
    expect(lines(mount(UiMoneyCell, { props: { value: '99.90' } }))).toEqual(['99.90'])
    expect(lines(mount(UiMoneyCell, { props: { value: 0 } }))).toEqual(['0.00'])
    expect(lines(mount(UiMoneyCell, { props: { value: '-0' } }))).toEqual(['0.00'])
    for (const value of [null, undefined, '', '  ', 'n/a', Number.NaN]) {
      const w = mount(UiMoneyCell, { props: { value } })
      expect(w.text(), String(value)).toBe('—')
      expect(w.findAll('span span')).toHaveLength(0)
    }
  })

  it('the lower line is the currency and the unit: the app one, the prop one, or the unit alone', () => {
    expect(lines(mount(UiMoneyCell, { props: { value: 5 } }))).toEqual(['5.00'])
    expect(lines(mount(UiMoneyCell, { props: { value: 5, unit: 'kg' } }))).toEqual(['5.00', 'kg'])
    const global = { plugins: withGrani({ currency: 'EUR' }) }
    const cell = (props: InstanceType<typeof UiMoneyCell>['$props']) =>
      lines(mount(UiMoneyCell, { props, global }))
    expect(cell({ value: 5 })).toEqual(['5.00', 'EUR'])
    expect(cell({ value: 5, unit: ' kg ' })).toEqual(['5.00', 'EUR / kg'])
    expect(cell({ value: 5, currency: 'USD' })).toEqual(['5.00', 'USD'])
    expect(cell({ value: 5, currency: ' usd ' })).toEqual(['5.00', 'USD'])
    expect(cell({ value: 5, currency: '' })).toEqual(['5.00', 'EUR'])
  })

  it('re-renders in place when the locale or the app currency changes', async () => {
    const locale = ref('en')
    const grani = createGrani({ locale })
    const w = mount(UiMoneyCell, { props: { value: 1234.5 }, global: { plugins: [grani] } })
    locale.value = 'ru'
    grani.setCurrency('EUR')
    await nextTick()
    expect(lines(w)).toEqual(['1 234,50', 'EUR'])
  })

  it('without a tone the amount takes the host ink, so a class on the cell colors it', () => {
    const w = mount(UiMoneyCell, { props: { value: 5 }, attrs: { class: 'text-danger' } })
    expect(w.classes()).toContain('text-danger')
    const amount = w.find('span span')
    expect(amount.classes().some((c) => /^text-(fg|success|danger|info)/.test(c))).toBe(false)
  })

  it('tone colors the amount only; the unit line stays muted', () => {
    const w = mount(UiMoneyCell, { props: { value: 5, currency: 'EUR', tone: 'danger' } })
    const [amount, unit] = w.findAll('span span')
    // The plate's ink, which turns light in the dark theme: the fill color reads under 3:1 there.
    expect(amount!.classes()).toContain('text-danger-subtle-fg')
    expect(unit!.classes()).toContain('text-fg-muted')
    expect(unit!.classes()).not.toContain('text-danger-subtle-fg')
    const plainAmount = mount(UiMoneyCell, { props: { value: 5 } }).find('span span')
    expect(
      plainAmount.classes().some((c) => /^text-(success|danger|info)(-subtle-fg)?$/.test(c)),
    ).toBe(false)
  })

  it('the caller class lands on the root in both states', () => {
    expect(
      mount(UiMoneyCell, { props: { value: 5 }, attrs: { class: 'font-semibold' } }).classes(),
    ).toContain('font-semibold')
    expect(
      mount(UiMoneyCell, { props: { value: null }, attrs: { class: 'font-semibold' } }).classes(),
    ).toContain('font-semibold')
  })
})

describe('UiMoneyCell — review follow-ups', () => {
  it('prints as many minor digits as the currency has: three for KWD, none for JPY', () => {
    const kwd = mount(UiMoneyCell, { props: { value: 1.235, currency: 'KWD' } })
    expect(kwd.text()).toContain('1.235')
    const jpy = mount(UiMoneyCell, { props: { value: 1250, currency: 'JPY' } })
    expect(jpy.text()).toContain('1,250')
    expect(jpy.text()).not.toContain('1,250.00')
    const eur = mount(UiMoneyCell, { props: { value: 3, currency: 'EUR' } })
    expect(eur.text()).toContain('3.00')
    const bad = mount(UiMoneyCell, { props: { value: 3, currency: 'NOPE' } })
    expect(bad.text()).toContain('3.00')
  })
})

describe('UiMoneyCell — review follow-ups', () => {
  it('an amount that rounds to zero prints no minus; a real loss keeps its sign', () => {
    for (const value of [-0.001, -0.004, '-0.003', '-0.0001']) {
      expect(lines(mount(UiMoneyCell, { props: { value } })), String(value)).toEqual(['0.00'])
    }
    expect(lines(mount(UiMoneyCell, { props: { value: -0.4, currency: 'JPY' } }))).toEqual([
      '0',
      'JPY',
    ])
    expect(lines(mount(UiMoneyCell, { props: { value: -0.0004, currency: 'KWD' } }))).toEqual([
      '0.000',
      'KWD',
    ])
    const ru = { plugins: withGrani({ locale: 'ru' }) }
    expect(lines(mount(UiMoneyCell, { props: { value: -0.001 }, global: ru }))).toEqual(['0,00'])
    expect(lines(mount(UiMoneyCell, { props: { value: -0.01 } }))).toEqual(['-0.01'])
    expect(lines(mount(UiMoneyCell, { props: { value: -1234.5 } }))).toEqual(['-1,234.50'])
  })
})
