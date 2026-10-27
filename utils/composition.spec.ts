import { describe, expect, it } from 'vitest'
import { useComposedValue } from './composition'

const input = (value: string, caret = value.length) => {
  const el = document.createElement('input')
  el.value = value
  el.setSelectionRange(caret, caret)
  return el
}

describe('useComposedValue', () => {
  it('emits the normalized value and rewrites the control with the caret kept', () => {
    const out: string[] = []
    const { onInput } = useComposedValue(
      (v) => out.push(v),
      (v) => v.replaceAll(',', '.'),
    )
    const el = input('12,5', 3)
    onInput({ target: el } as unknown as Event)
    expect(out).toEqual(['12.5'])
    expect(el.value).toBe('12.5')
    expect(el.selectionStart).toBe(3)
  })

  it('while composing the displayed value follows the DOM, not the model', () => {
    const out: string[] = []
    const { display, onInput, onCompositionStart, onCompositionEnd } = useComposedValue((v) =>
      out.push(v),
    )
    expect(display('a')).toBe('a')
    expect(display(null)).toBe('')
    onCompositionStart()
    const el = input('aに')
    onInput({ target: el } as unknown as Event)
    expect(out).toEqual([])
    expect(display('a')).toBe('aに')
    el.value = 'a日本'
    onCompositionEnd({ target: el } as unknown as Event)
    expect(out).toEqual(['a日本'])
    expect(display('a日本')).toBe('a日本')
  })
})
