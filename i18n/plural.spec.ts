import { describe, expect, it } from 'vitest'
import { createScope, withScope } from '../composables/useShared'
import { useUiT } from '../composables/useUiT'
import { ru } from './index'

// Every counted phrase of the Russian dictionary, said for the counts that pick each form. The
// forms are written out here by hand, by the grammar, not read from the dictionary: a `many` that
// holds the `few` form ("5 файла") fails here, and the dictionary cannot agree with itself.
// The three forms: for 1, for 2, for 5. `{n}` is the count.
const FORMS: Record<string, [one: string, few: string, many: string]> = {
  'grani.addRow.over': [
    'Не удалось добавить {n} строку: в этом списке не больше 3.',
    'Не удалось добавить {n} строки: в этом списке не больше 3.',
    'Не удалось добавить {n} строк: в этом списке не больше 3.',
  ],
  'grani.calendar.days': ['{n} день', '{n} дня', '{n} дней'],
  'grani.code.hint': [
    'Введите код из {n} знака.',
    'Введите код из {n} знаков.',
    'Введите код из {n} знаков.',
  ],
  'grani.dataTable.selected': ['Выбрано: {n}', 'Выбрано: {n}', 'Выбрано: {n}'],
  'grani.dropzone.addedCount': ['Добавлен {n} файл', 'Добавлено {n} файла', 'Добавлено {n} файлов'],
  'grani.dropzone.andMore': ['и ещё {n}', 'и ещё {n}', 'и ещё {n}'],
  'grani.dropzone.count': ['{n} файл', '{n} файла', '{n} файлов'],
  'grani.dropzone.rejectCount': [
    'a.pdf: не больше {n} файла.',
    'a.pdf: не больше {n} файлов.',
    'a.pdf: не больше {n} файлов.',
  ],
  'grani.dropzone.uploadedCount': [
    'Загружен {n} файл',
    'Загружено {n} файла',
    'Загружено {n} файлов',
  ],
  'grani.listField.full': [
    'Достигнут предел: {n} строка.',
    'Достигнут предел: {n} строки.',
    'Достигнут предел: {n} строк.',
  ],
  'grani.log.loaded': [
    'Загружено старых событий: {n}',
    'Загружено старых событий: {n}',
    'Загружено старых событий: {n}',
  ],
  'grani.select.selected': ['Выбрано: {n}', 'Выбрано: {n}', 'Выбрано: {n}'],
  'grani.tableColumns.hidden': ['Скрыта {n}', 'Скрыто {n}', 'Скрыто {n}'],
}

// The Russian rule, by hand: 1 and 21 take the first form, 2 and 22 the second, 5, 11 and 25 the
// third. A fraction (1.5) takes the second, as "1,5 файла".
const COUNTS: [count: number, form: 0 | 1 | 2][] = [
  [1, 0],
  [2, 1],
  [5, 2],
  [11, 2],
  [21, 0],
  [22, 1],
  [25, 2],
  [1.5, 1],
]

const families = (dict: Record<string, string>) =>
  [...new Set(Object.keys(dict).map((k) => k.replace(/\.(one|few|many|other)$/, '')))].filter(
    (base) => ['one', 'few', 'many', 'other'].every((c) => `${base}.${c}` in dict),
  )

describe('Russian plural forms', () => {
  const scope = createScope({ locale: 'ru', translate: (key) => ru[key] })
  const { tp } = withScope(scope, useUiT)

  it('every counted phrase of the dictionary has its forms written here', () => {
    expect(families(ru).sort()).toEqual(Object.keys(FORMS).sort())
  })

  for (const [key, forms] of Object.entries(FORMS)) {
    it(`${key} takes the right form for 1, 2, 5, 11, 21, 22, 25 and 1.5`, () => {
      for (const [count, form] of COUNTS) {
        const said = tp(key, count, {
          limit: key === 'grani.listField.full' ? count : 3,
          names: 'a.pdf',
        })
        expect(said, `${key} for ${count}`).toBe(forms[form].replace('{n}', String(count)))
      }
    })
  }
})
