import { afterEach, describe, expect, it, vi } from 'vitest'
import { announce } from './announce'

describe('announce', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('says the words in one polite region at the end of the page, emptied first', () => {
    vi.useFakeTimers()
    announce('Copied')
    const region = document.getElementById('ui-announcer')!
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.parentElement).toBe(document.body)
    expect(region.textContent).toBe('')
    vi.advanceTimersByTime(60)
    expect(region.textContent).toBe('Copied')
    announce('Copied')
    expect(region.textContent).toBe('')
    vi.advanceTimersByTime(60)
    expect(region.textContent).toBe('Copied')
    expect(document.querySelectorAll('#ui-announcer')).toHaveLength(1)
  })

  it('says nothing for empty words', () => {
    announce('')
    expect(document.getElementById('ui-announcer')).toBeNull()
  })
})

describe('announce — in a modal window', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })
  const dialog = (inert = false) => {
    const d = document.createElement('div')
    d.setAttribute('role', 'dialog')
    d.setAttribute('aria-modal', 'true')
    if (inert) d.setAttribute('inert', '')
    document.body.appendChild(d)
    return d
  }

  it('while a modal window is open the words are said inside the top one, where a reader keeps', () => {
    vi.useFakeTimers()
    dialog()
    const top = dialog()
    announce('Could not copy to the clipboard')
    vi.advanceTimersByTime(60)
    const region = top.querySelector('[data-announcer]')!
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.textContent).toBe('Could not copy to the clipboard')
    expect(document.getElementById('ui-announcer')).toBeNull()
  })

  it('a window under another, made inert, is passed over; with none open the page speaks', () => {
    vi.useFakeTimers()
    const open = dialog()
    dialog(true)
    announce('Copied')
    vi.advanceTimersByTime(60)
    expect(open.querySelector('[data-announcer]')?.textContent).toBe('Copied')
    document.body.innerHTML = ''
    announce('Copied')
    vi.advanceTimersByTime(60)
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Copied')
  })

  it('a window that closes before the words are written passes them to the page', () => {
    vi.useFakeTimers()
    const closing = dialog()
    announce('Saved')
    closing.remove()
    vi.advanceTimersByTime(60)
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Saved')
    // One on its way out, its leave transition running, is passed the same way.
    const leaving = dialog()
    leaving.classList.add('ui-modal-leave-active')
    announce('Saved again')
    vi.advanceTimersByTime(60)
    expect(leaving.querySelector('[data-announcer]')).toBeNull()
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Saved again')
  })

  it('the window that holds the focus speaks, wherever it stands in the page', () => {
    vi.useFakeTimers()
    const opened = dialog()
    const field = document.createElement('input')
    opened.appendChild(field)
    const under = dialog()
    field.focus()
    announce('Copied')
    vi.advanceTimersByTime(60)
    expect(opened.querySelector('[data-announcer]')?.textContent).toBe('Copied')
    expect(under.querySelector('[data-announcer]')).toBeNull()
  })

  it('with the focus in no window (a popover outside it), the window drawn on top speaks', () => {
    vi.useFakeTimers()
    const stacked = (z: number) => {
      const backdrop = document.createElement('div')
      backdrop.style.zIndex = String(z)
      backdrop.style.position = 'fixed'
      const d = document.createElement('div')
      d.setAttribute('aria-modal', 'true')
      backdrop.appendChild(d)
      document.body.appendChild(backdrop)
      return d
    }
    // Teleported in template order: the window on top stands first in the page.
    const top = stacked(61)
    const below = stacked(60)
    announce('Copied')
    vi.advanceTimersByTime(60)
    expect(top.querySelector('[data-announcer]')?.textContent).toBe('Copied')
    expect(below.querySelector('[data-announcer]')).toBeNull()
  })
})
