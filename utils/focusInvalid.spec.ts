import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusInvalid } from './focusInvalid'

function form(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

describe('focusInvalid', () => {
  afterEach(() => (document.body.innerHTML = ''))

  it('focuses the first invalid field in the root and scrolls it into view', () => {
    const root = form(
      '<input id="a"><input id="b" aria-invalid="true"><input id="c" aria-invalid="true">',
    )
    const b = root.querySelector<HTMLInputElement>('#b')!
    const scrolled = vi.fn()
    b.scrollIntoView = scrolled
    expect(focusInvalid(root)).toBe(true)
    expect(document.activeElement).toBe(b)
    expect(scrolled).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('without a field in error it leaves the focus where it was', () => {
    const root = form('<input id="a" aria-invalid="false"><button>Save</button>')
    const save = root.querySelector('button')!
    save.focus()
    expect(focusInvalid(root)).toBe(false)
    expect(document.activeElement).toBe(save)
    expect(focusInvalid(null)).toBe(false)
  })

  it('a node that cannot take focus makes focusInvalid return false', () => {
    const root = form('<div aria-invalid="true">Nothing to focus</div>')
    expect(focusInvalid(root)).toBe(false)
  })

  it('passes over a draft refused on its own (`data-draft`): it is not the form’s to fix', () => {
    const root = form(
      '<input id="a" aria-invalid="true" data-draft><input id="b" aria-invalid="true">',
    )
    expect(focusInvalid(root)).toBe(true)
    expect(document.activeElement).toBe(root.querySelector('#b'))
    root.querySelector('#b')!.removeAttribute('aria-invalid')
    ;(document.activeElement as HTMLElement).blur()
    expect(focusInvalid(root)).toBe(false)
  })

  it('skips a disabled invalid control and lands on the next one', () => {
    const root = form(
      '<button id="a" disabled aria-invalid="true">A</button><input id="b" aria-invalid="true">',
    )
    expect(focusInvalid(root)).toBe(true)
    expect(document.activeElement?.id).toBe('b')
  })
})

describe('focusInvalid — review follow-ups', () => {
  afterEach(() => (document.body.innerHTML = ''))

  it('passes over a field in a hidden container and lands on the next visible one', () => {
    const root = form(
      '<div style="display: none"><input id="a" aria-invalid="true"></div><input id="b" aria-invalid="true">',
    )
    expect(focusInvalid(root)).toBe(true)
    expect(document.activeElement).toBe(root.querySelector('#b'))
  })

  it('reports false when the only field in error cannot be reached', () => {
    const root = form('<div hidden><input id="a" aria-invalid="true"></div><button>Save</button>')
    const save = root.querySelector('button')!
    save.focus()
    expect(focusInvalid(root)).toBe(false)
    expect(document.activeElement).toBe(save)
  })
})
