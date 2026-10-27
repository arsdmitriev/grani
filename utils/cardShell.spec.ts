import { describe, expect, it } from 'vitest'
import { cardShellClass } from './cardShell'

describe('cardShellClass', () => {
  it('is a bordered surface with the card radius', () => {
    expect(cardShellClass).toContain('rounded-card')
    expect(cardShellClass).toContain('border-border')
    expect(cardShellClass).toContain('bg-surface')
  })

  it('is flat and painted with tokens only', () => {
    expect(cardShellClass).not.toMatch(/\bshadow/)
    expect(cardShellClass).not.toContain('dark:')
    expect(cardShellClass).not.toMatch(/-(?:gray|slate|zinc|stone)-\d/)
  })
})
