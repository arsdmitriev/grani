import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useAddItems, type AddItemsOptions } from './useAddItems'

// The composable inside a component, as a field holds it: its unmount ends what is on its way.
function setup(options: Partial<AddItemsOptions> = {}, existing: string[] = ['Apples']) {
  const text = ref('')
  let api!: ReturnType<typeof useAddItems>
  const w = mount(
    defineComponent({
      setup() {
        api = useAddItems(text, { existing: () => existing, split: () => 'lines', ...options })
        return () => h('i')
      },
    }),
  )
  return { text, api, w }
}

// A promise-like that is not a Promise: what some request libraries return.
function thenable() {
  let settle!: (ok: boolean) => void
  const done = new Promise<void>((resolve, reject) => {
    settle = (ok) => (ok ? resolve() : reject(new Error('no')))
  })
  return { then: done.then.bind(done), settle }
}

const paste = (text: string) => {
  const e = new Event('paste', { cancelable: true }) as ClipboardEvent
  Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } })
  return e
}

describe('useAddItems', () => {
  it('a typed item goes to onAdd and the field empties', async () => {
    const onAdd = vi.fn()
    const { text, api } = setup({ onAdd: () => onAdd })
    text.value = 'Pears'
    await api.submit([text.value], true)
    expect(onAdd).toHaveBeenCalledWith(['Pears'])
    expect(text.value).toBe('')
    expect(api.note.value).toBeNull()
  })

  it('a repeat in any case is pointed at, and a typed one keeps its text', async () => {
    const onAdd = vi.fn()
    const onTaken = vi.fn()
    const { text, api } = setup({ onAdd: () => onAdd, onTaken })
    text.value = 'apples'
    await api.submit([text.value], true)
    expect(onAdd).not.toHaveBeenCalled()
    expect(onTaken).toHaveBeenCalledWith('Apples')
    expect(text.value).toBe('apples')
    expect(api.note.value?.danger).toBeUndefined()
  })

  it('what check refuses stays in the field with the reason, as invalid', async () => {
    const onAdd = vi.fn()
    const { text, api } = setup({
      onAdd: () => onAdd,
      check: () => (item) => (item.includes('@') ? undefined : 'Not an address'),
    })
    text.value = 'bob'
    await api.submit([text.value], true)
    expect(onAdd).not.toHaveBeenCalled()
    expect(text.value).toBe('bob')
    expect(api.note.value).toMatchObject({ text: 'Not an address', danger: true, invalid: true })
  })

  it('a paste of two lines goes in as a list; a paste of one is left to the field', async () => {
    const onAdd = vi.fn()
    const { api } = setup({ onAdd: () => onAdd })
    const one = paste('Pears')
    api.paste(one)
    expect(one.defaultPrevented).toBe(false)
    const two = paste('Pears\nPlums')
    api.paste(two)
    await flushPromises()
    expect(two.defaultPrevented).toBe(true)
    expect(onAdd).toHaveBeenCalledWith(['Pears', 'Plums'])
  })

  it('what does not fit the limit is said, and the rest goes in', async () => {
    const onAdd = vi.fn()
    const { api } = setup({ onAdd: () => onAdd, limit: () => 2 })
    await api.submit(['Pears', 'Plums'], false)
    expect(onAdd).toHaveBeenCalledWith(['Pears'])
    expect(api.overflow.value).not.toBe('')
  })

  it('a thenable holds the add while it runs; a second submit then sends nothing', async () => {
    const run = thenable()
    const onAdd = vi.fn(() => run)
    const { text, api } = setup({ onAdd: () => onAdd })
    text.value = 'Pears'
    const first = api.submit([text.value], true)
    expect(api.busy.value).toBe(true)
    await api.submit(['Plums'], true)
    expect(onAdd).toHaveBeenCalledTimes(1)
    run.settle(true)
    await first
    expect(api.busy.value).toBe(false)
  })

  it('a rejected thenable gives the text back and says so, with no unhandled rejection', async () => {
    const run = thenable()
    const { text, api } = setup({ onAdd: () => () => run })
    text.value = 'Pears'
    const sent = api.submit([text.value], true)
    expect(text.value).toBe('')
    run.settle(false)
    await sent
    expect(text.value).toBe('Pears')
    expect(api.note.value?.danger).toBe(true)
    expect(api.busy.value).toBe(false)
  })

  it('something typed while the request was on its way is not overwritten by its failure', async () => {
    const run = thenable()
    const { text, api } = setup({ onAdd: () => () => run })
    text.value = 'Pears'
    const sent = api.submit([text.value], true)
    text.value = 'Plu'
    run.settle(false)
    await sent
    expect(text.value).toBe('Plu')
  })

  it('a handler that throws at once fails as a rejected request does', async () => {
    const { text, api } = setup({
      onAdd: () => () => {
        throw new Error('no')
      },
    })
    text.value = 'Pears'
    await api.submit([text.value], true)
    expect(text.value).toBe('Pears')
    expect(api.note.value?.danger).toBe(true)
  })

  it('a fix that throws refuses the item with a reason instead of going silent', async () => {
    const onAdd = vi.fn()
    const { api } = setup({
      onAdd: () => onAdd,
      fix: () => () => {
        throw new Error('bad')
      },
    })
    await api.submit(['Pears'], true)
    expect(onAdd).not.toHaveBeenCalled()
    expect(api.note.value?.invalid).toBe(true)
  })

  it('after unmount a late failure touches nothing', async () => {
    const run = thenable()
    const { text, api, w } = setup({ onAdd: () => () => run })
    text.value = 'Pears'
    const sent = api.submit([text.value], true)
    w.unmount()
    run.settle(false)
    await sent
    expect(text.value).toBe('')
    expect(api.busy.value).toBe(true)
  })
})
