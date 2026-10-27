import { describe, expect, it } from 'vitest'
import { controlChromeClass } from './controlChrome'

describe('controlChromeClass', () => {
  it('disabled wins over invalid, invalid over rest', () => {
    expect(controlChromeClass(true, true)).toContain('bg-disabled-bg')
    expect(controlChromeClass(false, true)).toContain('border-danger-border')
    expect(controlChromeClass(false, false)).toContain('border-control-border')
  })
})
