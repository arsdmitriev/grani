import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { useUiT } from '../composables/useUiT'
import {
  chartDateLabels,
  chartDateLong,
  formatChartTicks,
  formatChartValue,
  parseChartDate,
} from './chartFormat'

const numbers = (currency = '', locale = 'en') => ({
  n: (v: number, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, o).format(v),
  currency: computed(() => currency),
})

describe('formatChartValue', () => {
  it('prints money as the money cell does, with the app currency after the digits', () => {
    expect(formatChartValue(numbers('EUR'), 42380.5, 'money')).toBe('42,380.50 EUR')
    expect(formatChartValue(numbers(), 42380.5, 'money')).toBe('42,380.50')
    // The currency's own decimals, as the cell prints them.
    expect(formatChartValue(numbers('KWD'), 1.235, 'money')).toBe('1.235 KWD')
    expect(formatChartValue(numbers('JPY'), 1250, 'money')).toBe('1,250 JPY')
  })
  it('compacts an axis value and drops the currency there', () => {
    expect(formatChartValue(numbers('EUR'), 42380, 'money', { compact: true })).toBe('42.4K')
  })
  it('reads percent as a share', () => {
    expect(formatChartValue(numbers(), 0.256, 'percent')).toBe('25.6%')
    expect(formatChartValue(numbers(), 0.256, 'percent', { compact: true })).toBe('26%')
  })
  it('prints a dash for missing data, never zero', () => {
    expect(formatChartValue(numbers(), null)).toBe('—')
    expect(formatChartValue(numbers(), Number.NaN, 'money')).toBe('—')
  })
  it('prints a value that rounds to zero as zero, never with a minus', () => {
    expect(formatChartValue(numbers(), -0.0004)).toBe('0')
    expect(formatChartValue(numbers('EUR'), -0.001, 'money')).toBe('0.00 EUR')
    expect(formatChartValue(numbers(), -0.0004, 'percent')).toBe('0%')
    expect(formatChartValue(numbers(), -0.0004, 'number', { compact: true })).toBe('0')
    expect(formatChartValue(numbers(), -2)).toBe('-2')
  })
  it('hands the value to a function format', () => {
    expect(formatChartValue(numbers(), 90, (v) => `${v / 60} h`)).toBe('1.5 h')
  })
})

describe('chart dates', () => {
  it('reads a month key and a day as calendar days, whatever the zone', () => {
    expect(parseChartDate('2026-09')?.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(parseChartDate('2026-09-24')?.toISOString()).toBe('2026-09-24T00:00:00.000Z')
    expect(parseChartDate('2026-13')).toBeNull()
    expect(parseChartDate('Rent')).toBeNull()
  })
  it('puts the year only where it changes, and only when the points span two years', () => {
    const tr = useUiT()
    expect(chartDateLabels(tr, ['2025-11', '2025-12', '2026-01', '2026-02'], 'month')).toEqual([
      'Nov 2025',
      'Dec',
      'Jan 2026',
      'Feb',
    ])
    expect(chartDateLabels(tr, ['2026-01', '2026-02'], 'month')).toEqual(['Jan', 'Feb'])
    expect(chartDateLabels(tr, ['2026-09-05', '2026-09-06'], 'day')).toEqual(['Sep 5', 'Sep 6'])
  })
  it('puts the year on the first label shown, when thinning hides the first point', () => {
    const tr = useUiT()
    const points = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03']
    const shown = (i: number) => (5 - i) % 2 === 0
    expect(chartDateLabels(tr, points, 'month', shown).filter((_, i) => shown(i))).toEqual([
      'Nov 2025',
      'Jan 2026',
      'Mar',
    ])
  })
  it('keeps a point that is not a date as its own text', () => {
    expect(chartDateLabels(useUiT(), ['Rent', '2026-01'], 'month')).toEqual(['Rent', 'Jan'])
  })
  it('says a point in full for a tooltip and a screen reader', () => {
    const tr = useUiT()
    expect(chartDateLong(tr, '2026-09', 'month')).toBe('September 2026')
    expect(chartDateLong(tr, '2026-09-05', 'day')).toBe('September 5, 2026')
    expect(chartDateLong(tr, '2026-09-07', 'week')).toBe('Week of September 7, 2026')
  })
})

describe('formatChartTicks', () => {
  it('keeps every label apart with as few digits as it takes', () => {
    expect(formatChartTicks(numbers(), [0, 0.05, 0.1, 0.15])).toEqual(['0', '0.05', '0.1', '0.15'])
    expect(formatChartTicks(numbers(), [0, 1000, 2000])).toEqual(['0', '1K', '2K'])
    expect(formatChartTicks(numbers(), [0, 0.005, 0.01], 'percent')).toEqual(['0%', '0.5%', '1%'])
  })
  it('leaves a function format and the currency off the axis', () => {
    expect(formatChartTicks(numbers('EUR'), [0, 1250000], (v) => `€${v}`)).toEqual(['0', '1.3M'])
  })
})

describe('chartFormat — weekday', () => {
  const tr = useUiT()
  it('labels a week by its days and says the date in full', () => {
    expect(chartDateLabels(tr, ['2026-09-28', '2026-09-29'], 'weekday')).toEqual(['Mon', 'Tue'])
    expect(chartDateLong(tr, '2026-09-29', 'weekday')).toBe('Tuesday, September 29, 2026')
  })
})

describe('chart dates — the app zone', () => {
  // The device's clock is UTC here; the app reads its dates in Minsk, three hours ahead.
  const minsk = () => ({ ...useUiT(), timeZone: computed(() => 'Europe/Minsk') })

  it('a moment falls on its day by the app zone, as a date cell reads it', () => {
    const late = '2026-10-24T22:30:00Z'
    expect(chartDateLabels(minsk(), [late], 'day')).toEqual(['Oct 25'])
    expect(chartDateLong(minsk(), late, 'day')).toBe('October 25, 2026')
  })

  it('a day alone and a wall time keep their own day', () => {
    expect(chartDateLabels(minsk(), ['2026-10-24', '2026-10-24 23:30'], 'day')).toEqual([
      'Oct 24',
      'Oct 24',
    ])
  })
})

describe('chart dates — names with numbers stay names', () => {
  it('a category with a number is kept as it is written', () => {
    const tr = useUiT()
    expect(parseChartDate('Store 12')).toBeNull()
    expect(chartDateLabels(tr, ['Store 1', 'Store 2', 'Store 12'], 'month')).toEqual([
      'Store 1',
      'Store 2',
      'Store 12',
    ])
    expect(chartDateLabels(tr, ['Week 1', 'Week 2'], 'day')).toEqual(['Week 1', 'Week 2'])
  })
})
