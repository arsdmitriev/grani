import { afterEach, describe, expect, it, vi } from 'vitest'
import { announce, createAnnouncer } from './announce'

describe('the announcer', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('reads lines in the order they came, each emptied, written a beat later, held a beat', () => {
    vi.useFakeTimers()
    const reader = createAnnouncer()
    const low: string[] = []
    const high: string[] = []
    reader.say((t) => low.push(t), 'First')
    reader.say((t) => high.push(t), 'Failed')
    reader.say((t) => low.push(t), 'Second')
    expect(low).toEqual([''])
    vi.advanceTimersByTime(50)
    expect(low).toEqual(['', 'First'])
    expect(high).toEqual([])
    vi.advanceTimersByTime(50)
    expect(high).toEqual([''])
    vi.advanceTimersByTime(100)
    expect(high).toEqual(['', 'Failed'])
    expect(low).toEqual(['', 'First', ''])
    vi.advanceTimersByTime(50)
    expect(low).toEqual(['', 'First', '', 'Second'])
  })

  it('stop drops what waits and what is under way', () => {
    vi.useFakeTimers()
    const reader = createAnnouncer()
    const said: string[] = []
    reader.say((t) => said.push(t), 'One')
    reader.say((t) => said.push(t), 'Two')
    reader.stop()
    vi.advanceTimersByTime(500)
    expect(said).toEqual([''])
  })

  it('the page region says the newest words: an outcome said again replaces the one waiting', () => {
    vi.useFakeTimers()
    announce('Copying')
    announce('Copied')
    vi.advanceTimersByTime(60)
    expect(document.getElementById('ui-announcer')!.textContent).toBe('Copied')
    vi.advanceTimersByTime(100)
    expect(document.getElementById('ui-announcer')!.textContent).toBe('Copied')
  })
})
