import { describe, expect, it } from 'vitest'
import { linkTarget, opensElsewhere, unsafeHref } from './link'

describe('opensElsewhere', () => {
  it('is true for a web page on another site, protocol-relative too', () => {
    for (const to of ['https://example.com', 'HTTP://example.com/x', '//cdn.example.com/a'])
      expect(opensElsewhere(to), to).toBe(true)
  })

  it('is false for a route, an anchor, and an address handed to an app', () => {
    for (const to of ['/records', '#top', '', 'mailto:name@example.com', 'tel:+44', 'records/7'])
      expect(opensElsewhere(to), to).toBe(false)
    expect(opensElsewhere(undefined)).toBe(false)
  })
})

describe('link — review follow-ups', () => {
  it('a padded address is still external', () => {
    expect(opensElsewhere('  https://example.com')).toBe(true)
  })

  it('script and data addresses are unsafe, the rest are not', () => {
    for (const to of ['javascript:x', ' JAVASCRIPT:x', 'data:text/html,x', 'vbscript:x'])
      expect(unsafeHref(to), to).toBe(true)
    for (const to of ['/a', 'https://a.test', 'mailto:a@b.test', undefined])
      expect(unsafeHref(to), String(to)).toBe(false)
  })

  it('an absolute address of the own origin opens in a new tab unless target is _self', () => {
    expect(linkTarget('https://app.example/records').newTab).toBe(true)
    expect(linkTarget('https://app.example/records', '_self').newTab).toBe(false)
  })
})

describe('unsafeHref — what a browser strips before it reads the scheme', () => {
  it('sees a script scheme through tabs, newlines and returns anywhere in it', () => {
    for (const to of [
      'java\tscript:void(0)',
      'java\nscript:x',
      'java\rscript:x',
      'j\ta\nv\ra\tscript:x',
      'javascript\t:x',
      'vb\tscript:x',
      'da\nta:text/html,x',
    ])
      expect(unsafeHref(to), JSON.stringify(to)).toBe(true)
  })

  it('sees it through leading and trailing control characters and spaces', () => {
    for (const to of [
      '\u0000javascript:x',
      '\u0001\u001f javascript:x',
      '\fjavascript:x',
      ' \u0000\tdata:x',
    ])
      expect(unsafeHref(to), JSON.stringify(to)).toBe(true)
  })

  it('sees it in any case, and in a mix of both obfuscations', () => {
    for (const to of ['JaVaScRiPt:x', 'VBScript:x', 'DATA:text/html,x', '\u0000 Ja\tVa\nScript:x'])
      expect(unsafeHref(to), JSON.stringify(to)).toBe(true)
  })

  it('leaves an address alone whose script word is not its scheme', () => {
    for (const to of [
      '/javascript:x',
      '?q=javascript:x',
      '#data:x',
      'https://a.test/javascript:x',
      'javascript',
      '',
    ])
      expect(unsafeHref(to), JSON.stringify(to)).toBe(false)
  })
})

describe('link — an address the types promised and the data did not keep', () => {
  it('reads anything that is no string as no address, never throwing', () => {
    for (const to of [5, ['/x'], {}, true, false, null, undefined]) {
      expect(unsafeHref(to as never), String(to)).toBe(false)
      expect(opensElsewhere(to as never), String(to)).toBe(false)
    }
  })
})

// The browser's URL parser decides where an address goes; `opensElsewhere` must agree with it on
// every address the parser sends to another origin, however it is spelled: a missing slash, a tab
// or a control character in it, a backslash. Saying "elsewhere" for an own address costs a new tab;
// missing one sends the page's address to another site.
describe('opensElsewhere — against the URL parser', () => {
  const BASE = 'https://app.example/orders/'
  const LEAD = ['', ' ', '\t', '\n', '\u0001', '\u001f']
  const SCHEME = ['', 'http:', 'https:', 'HTTP:', 'hTtPs:']
  const MIDDLE = ['//', '/', '', '\\\\', '/\\', '\t//', '/\t/', '\\/']
  const addresses = LEAD.flatMap((l) =>
    SCHEME.flatMap((s) => MIDDLE.map((m) => `${l}${s}${m}evil.example/x`)),
  )

  it(`sees every one of ${LEAD.length * SCHEME.length * MIDDLE.length} spellings that leave the origin`, () => {
    const missed: string[] = []
    for (const to of addresses) {
      let url: URL
      try {
        url = new URL(to, BASE)
      } catch {
        continue
      }
      const leaves = url.origin !== new URL(BASE).origin && /^https?:$/.test(url.protocol)
      if (leaves && !opensElsewhere(to)) missed.push(JSON.stringify(to))
    }
    expect(missed).toEqual([])
  })

  it('keeps the own paths in the tab', () => {
    for (const to of ['/orders', 'orders/2', './x', '?page=2', '#top', '  /orders  '])
      expect(opensElsewhere(to), to).toBe(false)
  })
})

describe('linkTarget — values the types do not promise', () => {
  it('a rel that is no string is no rel, never a throw', () => {
    expect(linkTarget('https://a.example', undefined, 5 as never).rel).toBe('noopener noreferrer')
  })

  it('a named window is another window: noopener, and said', () => {
    const t = linkTarget('/report', 'report' as never)
    expect(t.newTab).toBe(true)
    expect(t.rel).toBe('noopener')
    expect(t.target).toBe('report')
  })
})
