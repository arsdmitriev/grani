import { describe, expect, it } from 'vitest'
import { searchText } from './searchText'

describe('searchText', () => {
  it('reads ё as е and leaves Latin accents out, in either case', () => {
    expect(searchText('Артём Орлов')).toBe('артем орлов')
    expect(searchText('ЁЛКА')).toBe('елка')
    expect(searchText('München')).toBe('munchen')
    expect(searchText('Ångström, Crème brûlée')).toBe('angstrom, creme brulee')
  })

  it('keeps й a letter of its own: "иод" is not "йод"', () => {
    expect(searchText('Йод')).toBe('йод')
    expect(searchText('Андрей').includes(searchText('андреи'))).toBe(false)
  })

  it('drops an accent on i too, keeps the short u, and leaves the marks of other scripts alone', () => {
    expect(searchText('\u0438\u0301\u0440\u0430')).toBe(searchText('\u0438\u0440\u0430'))
    expect(searchText('\u045e')).toBe('\u045e')
    expect(searchText('\u304c')).not.toBe(searchText('\u304b'))
  })
})
