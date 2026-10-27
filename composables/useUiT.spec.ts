import { describe, expect, it, vi } from 'vitest'
import { createApp, ref } from 'vue'
import { createGrani, type GraniOptions } from '../plugin'
import { ru } from '../i18n'
import { missingText, useUiT } from './useUiT'

// The translator of an app installed with these options, read in its context.
const tr = (options: GraniOptions = {}) => {
  const app = createApp({}).use(createGrani(options))
  return app.runWithContext(() => useUiT())
}

describe('useUiT — resolution', () => {
  it("without the plugin: grani's English", () => {
    expect(useUiT().t('grani.button.loading')).toBe('In progress…')
    expect(useUiT().locale.value).toBe('en')
  })

  it("the app's translate wins over grani's English", () => {
    const { t } = tr({
      translate: (key) => (key === 'grani.button.loading' ? 'Hold on' : undefined),
    })
    expect(t('grani.button.loading')).toBe('Hold on')
  })

  it('a key the app has no text for, or returns as is, falls back to English', () => {
    for (const none of [undefined, null, 'key'] as const) {
      const { t } = tr({ translate: (key) => (none === 'key' ? key : none) })
      expect(t('grani.button.loading'), String(none)).toBe('In progress…')
    }
  })

  it('a plain dictionary feeds grani its Russian', () => {
    const { t } = tr({ locale: 'ru', translate: (key) => ru[key] })
    expect(t('grani.button.loading')).toBe('Выполняется…')
  })

  it('fills placeholders the translation left, and leaves an interpolated one as it is', () => {
    const raw = tr({ translate: () => 'Убрать {label}' })
    expect(raw.t('grani.badge.remove', { label: 'Ann' })).toBe('Убрать Ann')
    const done = tr({ translate: (_key, p) => `Убрать ${p?.label}` })
    expect(done.t('grani.badge.remove', { label: 'Ann' })).toBe('Убрать Ann')
  })

  it('leaves an unknown placeholder visible', () => {
    expect(useUiT().t('grani.badge.remove')).toBe('Remove {label}')
  })

  it('marks a missing key visibly in development', () => {
    expect(useUiT().t('nope.not.here')).toBe('[missing:nope.not.here]')
  })
})

describe('missingText', () => {
  it('is a marker in development and the bare key in production', () => {
    expect(missingText('a.b', true)).toBe('[missing:a.b]')
    expect(missingText('a.b', false)).toBe('a.b')
  })
})

describe('useUiT — plurals', () => {
  const forms: Record<string, string> = {
    'cart.items.one': '{n} запись',
    'cart.items.few': '{n} записи',
    'cart.items.many': '{n} записей',
    'cart.items.other': '{n} записи',
  }

  it("asks translate for the category of the language's plural rules", () => {
    const { tp } = tr({ locale: 'ru', translate: (key) => forms[key] })
    expect(tp('cart.items', 1)).toBe('1 запись')
    expect(tp('cart.items', 3)).toBe('3 записи')
    expect(tp('cart.items', 5)).toBe('5 записей')
    expect(tp('cart.items', 21)).toBe('21 запись')
  })

  it('takes .other when the category form is absent', () => {
    const { tp } = tr({
      locale: 'ru',
      translate: (key) => (key === 'cart.items.other' ? '{n} шт.' : undefined),
    })
    expect(tp('cart.items', 3)).toBe('3 шт.')
  })

  it("without the app's text, English forms by English rules", () => {
    const { tp } = tr({ locale: 'ru' })
    expect(tp('grani.select.selected', 1)).toBe('1 selected')
    expect(tp('grani.select.selected', 21)).toBe('21 selected')
  })

  it('writes the count in the digits of the language, and passes translate the number', () => {
    expect(tr().tp('grani.select.selected', 1234)).toBe('1,234 selected')
    const seen: unknown[] = []
    const { tp } = tr({
      locale: 'ru',
      translate: (key, p) => (seen.push(p?.n), key === 'cart.items.other' ? '{n} шт.' : undefined),
    })
    expect(tp('cart.items', 1234567)).toBe(`${new Intl.NumberFormat('ru').format(1234567)} шт.`)
    expect(seen).toContain(1234567)
  })

  it('passes the count to translate as `n`', () => {
    const seen: unknown[] = []
    tr({ translate: (_key, p) => (seen.push(p?.n), undefined) }).tp('grani.select.selected', 4)
    expect(seen).toContain(4)
  })
})

describe('useUiT — Intl formatters', () => {
  it('formats numbers in the app locale', () => {
    expect(useUiT().n(1234.5)).toBe('1,234.5')
    expect(tr({ locale: 'de-DE' }).n(1370, { minimumFractionDigits: 2 })).toBe('1.370,00')
  })

  it('follows a reactive locale', () => {
    const locale = ref('en')
    const { n, locale: read } = tr({ locale })
    expect(n(1234.5)).toBe('1,234.5')
    locale.value = 'de-DE'
    expect(read.value).toBe('de-DE')
    expect(n(1234.5)).toBe('1.234,5')
  })

  it('reads an empty or unreadable locale as English instead of throwing', () => {
    for (const bad of ['', 'en_US!']) {
      const { n, locale } = tr({ locale: bad })
      expect(locale.value, bad).toBe('en')
      expect(n(1234.5)).toBe('1,234.5')
    }
  })

  it('renders dates in the configured zone; an explicit option wins', () => {
    const noon = Date.UTC(2026, 7, 31, 12, 0, 0)
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false } as const
    expect(tr({ timeZone: 'Europe/Athens' }).d(noon, opts)).toContain('15')
    expect(tr({ timeZone: 'Europe/Athens' }).d(noon, { ...opts, timeZone: 'UTC' })).toContain('12')
    expect(tr({ timeZone: 'UTC' }).d(noon, opts)).toContain('12')
  })

  it('ignores an invalid zone instead of throwing', () => {
    const t = tr({ timeZone: 'Europe/Nowhere' })
    expect(t.timeZone.value).toBe('')
    expect(() => t.d(Date.now())).not.toThrow()
  })

  it('builds one formatter per language and options, not one per value (a long table formats thousands)', () => {
    const made = { d: 0, n: 0 }
    const { DateTimeFormat, NumberFormat } = Intl
    const counting = <C extends object>(Real: C, kind: 'd' | 'n') =>
      new Proxy(Real, {
        construct: (target, args) => (made[kind]++, Reflect.construct(target as never, args)),
      })
    // The app checks its zone with a formatter of its own: installed before counting starts.
    const { d, n } = tr({ locale: 'en-GB', timeZone: 'UTC' })
    Intl.DateTimeFormat = counting(DateTimeFormat, 'd')
    Intl.NumberFormat = counting(NumberFormat, 'n')
    try {
      const opts = { day: 'numeric', month: 'short', year: '2-digit' } as const
      expect([1, 2, 3].map((k) => d(Date.UTC(2026, 0, k), opts))).toEqual([
        '1 Jan 26',
        '2 Jan 26',
        '3 Jan 26',
      ])
      expect([1, 2, 3].map((k) => n(k * 1000, { maximumFractionDigits: 1 }))).toEqual([
        '1,000',
        '2,000',
        '3,000',
      ])
      expect(made.d).toBeLessThanOrEqual(1)
      expect(made.n).toBeLessThanOrEqual(1)
      // Another language is another formatter: the cache never answers in the wrong one.
      expect(tr({ locale: 'de-DE' }).n(1000.5)).toBe('1.000,5')
    } finally {
      Intl.DateTimeFormat = DateTimeFormat
      Intl.NumberFormat = NumberFormat
    }
  })

  it('setTimeZone moves the zone of the instance, an unknown one back to the device', () => {
    const grani = createGrani()
    const app = createApp({}).use(grani)
    const { timeZone } = app.runWithContext(() => useUiT())
    grani.setTimeZone('Asia/Tokyo')
    expect(timeZone.value).toBe('Asia/Tokyo')
    grani.setTimeZone('Mars/Base')
    expect(timeZone.value).toBe('')
  })
})

describe('useUiT — currency', () => {
  it('has no currency until the app sets one; the code is upper-cased and trimmed', () => {
    expect(useUiT().currency.value).toBe('')
    const grani = createGrani({ currency: ' eur ' })
    const { currency } = createApp({})
      .use(grani)
      .runWithContext(() => useUiT())
    expect(currency.value).toBe('EUR')
    grani.setCurrency('')
    expect(currency.value).toBe('')
  })
})

describe('useUiT — a translate that gives nothing usable', () => {
  it('an empty string falls back to English, in t and in tp', () => {
    const { t, tp } = tr({ translate: () => '' })
    expect(t('grani.button.loading')).not.toBe('')
    expect(tp('grani.dataTable.selected', 21)).toContain('21')
  })
  it('a translate that throws costs the label its language, not the screen, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { t, tp } = tr({
        translate: () => {
          throw new Error('bad message')
        },
      })
      expect(() => t('grani.button.loading')).not.toThrow()
      expect(t('grani.button.loading')).not.toBe('')
      expect(tp('grani.dataTable.selected', 3)).toContain('3')
      expect(warn).toHaveBeenCalledWith(
        '[grani] translate threw for "grani.button.loading"; English is shown.',
        expect.any(Error),
      )
    } finally {
      warn.mockRestore()
    }
  })
})

describe('useUiT — review follow-ups', () => {
  // Every object answers `constructor`, `toString` and the like through its prototype: a
  // placeholder or a key of that name must find only what the app and grani wrote.
  const INHERITED = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']

  it('fills a placeholder only from the params given, never from what every object inherits', () => {
    const template = INHERITED.map((k) => `{${k}}`).join(' ')
    const { t, tp } = tr({ translate: () => `${template} {label} {n}` })
    expect(t('grani.badge.remove', { label: 'Ann' })).toBe(`${template} Ann {n}`)
    expect(tp('grani.dataTable.selected', 3)).toBe(`${template} {label} 3`)
  })

  it('a key named like what every object inherits is missing, with params or without', () => {
    for (const key of INHERITED) {
      expect(useUiT().t(key), key).toBe(`[missing:${key}]`)
      expect(useUiT().t(key, { label: 'Ann' }), key).toBe(`[missing:${key}]`)
    }
  })
})
