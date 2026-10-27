import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createGrani } from '../plugin'
import type { TableColumn } from '../types/ui'
import type { GraniStorage } from './useShared'
import { useTableColumns } from './useTableColumns'

type Row = Record<string, unknown>
const cols = ref<TableColumn<Row>[]>([
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'price', label: 'Price' },
])
const keys = (c: ReturnType<typeof useTableColumns<Row>>) => c.visible.value.map((x) => x.key)

describe('useTableColumns', () => {
  beforeEach(() => localStorage.clear())

  it('hides and shows a column, keeping the given order', () => {
    const c = useTableColumns('invoices', cols, { required: ['name'] })
    expect(keys(c)).toEqual(['name', 'id', 'price'])
    c.toggle('id')
    expect(keys(c)).toEqual(['name', 'price'])
    expect(c.all.value.map((x) => x.key)).toEqual(['name', 'id', 'price'])
    c.toggle('id')
    expect(keys(c)).toEqual(['name', 'id', 'price'])
  })

  it('never hides a required column, not even on a direct call', () => {
    const c = useTableColumns('invoices', cols, { required: ['name'] })
    c.toggle('name')
    expect(keys(c)).toContain('name')
    expect(c.canToggle('name')).toBe(false)
    expect(c.canToggle('id')).toBe(true)
  })

  it('survives a remount through localStorage, written at once', () => {
    const a = useTableColumns('invoices', cols)
    a.toggle('id')
    expect(JSON.parse(localStorage.getItem('grani:columns:invoices')!)).toEqual(['id'])
    expect(useTableColumns('invoices', cols).hidden.value).toEqual(['id'])
  })

  it('is keyed by the kind of table', () => {
    useTableColumns('invoices', cols).toggle('id')
    expect(useTableColumns('orders', cols).hidden.value).toEqual([])
  })

  it('hiddenByDefault hides on the first visit; changed and reset work against it', () => {
    const c = useTableColumns('t1', cols, { hiddenByDefault: ['id'] })
    expect(keys(c)).toEqual(['name', 'price'])
    expect(c.changed.value).toBe(false)
    c.toggle('id')
    expect(c.changed.value).toBe(true)
    c.toggle('price')
    c.reset()
    expect(c.hidden.value).toEqual(['id'])
    expect(c.changed.value).toBe(false)
  })

  it('takes a plain array as well as a ref, and follows a ref that changes', () => {
    const plain = useTableColumns('t2', cols.value)
    expect(keys(plain)).toEqual(['name', 'id', 'price'])
    const live = ref<TableColumn<Row>[]>([{ key: 'a', label: 'A' }])
    const c = useTableColumns('t3', live)
    live.value = [...live.value, { key: 'b', label: 'B' }]
    expect(keys(c)).toEqual(['a', 'b'])
  })

  it('unreadable storage yields the default instead of a broken table', () => {
    localStorage.setItem('grani:columns:t4', '{not json')
    expect(useTableColumns('t4', cols, { hiddenByDefault: ['id'] }).hidden.value).toEqual(['id'])
    localStorage.setItem('grani:columns:t5', JSON.stringify(['id', 7, null]))
    expect(useTableColumns('t5', cols).hidden.value).toEqual(['id'])
  })
  it('a required column shows whatever an older visit stored, and reads as not hidden', () => {
    localStorage.setItem('grani:columns:t6', JSON.stringify(['name']))
    const c = useTableColumns('t6', cols, { required: ['name'] })
    expect(keys(c)).toEqual(['name', 'id', 'price'])
    expect(c.hidden.value).toEqual([])
    expect(c.changed.value).toBe(false)
  })

  it('a stored key no longer among the columns is not counted, but stays stored', () => {
    localStorage.setItem('grani:columns:t7', JSON.stringify(['gone', 'id']))
    const c = useTableColumns('t7', cols)
    expect(c.hidden.value).toEqual(['id'])
    expect(c.changed.value).toBe(true)
    c.toggle('id')
    expect(c.hidden.value).toEqual([])
    expect(c.changed.value).toBe(false)
    expect(JSON.parse(localStorage.getItem('grani:columns:t7')!)).toEqual(['gone'])
  })

  it('in a browser app the stored set is read in setup, so the first paint does not jump', () => {
    localStorage.setItem('grani:columns:t8', JSON.stringify(['id']))
    const seen: string[][] = []
    const Host = defineComponent({
      setup() {
        const c = useTableColumns('t8', cols)
        seen.push([...c.hidden.value])
        return () => h('i', c.hidden.value.join(','))
      },
    })
    const w = mount(Host)
    expect(seen[0]).toEqual(['id'])
    expect(w.text()).toBe('id')
  })

  it('a page rendered by a server hydrates on the default, then the stored set lands', async () => {
    const Host = defineComponent({
      setup() {
        const c = useTableColumns('t9', cols)
        return () => h('i', c.hidden.value.join(',') || 'none')
      },
    })
    const html = await renderToString(createSSRApp(Host))
    expect(html).toBe('<i>none</i>')
    localStorage.setItem('grani:columns:t9', JSON.stringify(['id']))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const root = document.createElement('div')
    root.innerHTML = html
    createSSRApp(Host).mount(root)
    const said = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]))
    expect(said.filter((t) => /hydration/i.test(t))).toEqual([])
    await nextTick()
    expect(root.textContent).toBe('id')
    warn.mockRestore()
    error.mockRestore()
  })

  it('a mere visit stores nothing, so a later default still reaches that person', async () => {
    const Host = defineComponent({
      setup() {
        const c = useTableColumns('t10', cols, { hiddenByDefault: ['id'] })
        const d = useTableColumns('t11', cols)
        return () => h('i', c.hidden.value.join(',') + '|' + d.hidden.value.join(','))
      },
    })
    const w = mount(Host)
    await nextTick()
    expect(w.text()).toBe('id|')
    expect(localStorage.getItem('grani:columns:t10')).toBeNull()
    expect(localStorage.getItem('grani:columns:t11')).toBeNull()
  })

  it('a blocked write keeps the choice for the page', () => {
    // On the instance, not the prototype: happy-dom's storage keeps the method it first handed
    // out, so a patched prototype either never reaches it or stays in it after the restore.
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    try {
      const c = useTableColumns('t9', cols)
      c.toggle('id')
      expect(write).toHaveBeenCalled()
      expect(c.hidden.value).toEqual(['id'])
    } finally {
      write.mockRestore()
    }
  })
})

describe('useTableColumns — review follow-ups', () => {
  it('a required key also listed in hiddenByDefault must not pin changed permanently true', () => {
    const state = useTableColumns(
      'spec-required-default',
      [
        { key: 'id', label: 'Id' },
        { key: 'name', label: 'Name' },
      ],
      { required: ['id'], hiddenByDefault: ['id'] },
    )
    expect(state.hidden.value).toEqual([])
    expect(state.changed.value).toBe(false)
  })
})

describe('useTableColumns — review follow-ups', () => {
  beforeEach(() => localStorage.clear())

  it('a table with no required column keeps one column visible however many are unticked, including from storage', () => {
    const c = useTableColumns('loose', cols)
    c.toggle('name')
    c.toggle('id')
    c.toggle('price')
    expect(keys(c)).toEqual(['price'])
    expect(c.canToggle('price')).toBe(false)
    localStorage.setItem('grani:columns:loose2', JSON.stringify(['name', 'id', 'price']))
    expect(keys(useTableColumns('loose2', cols))).toEqual(['name'])
  })

  it('a stored value that is not an array yields the default', () => {
    localStorage.setItem('grani:columns:odd', JSON.stringify({ id: true }))
    expect(useTableColumns('odd', cols, { hiddenByDefault: ['id'] }).hidden.value).toEqual(['id'])
  })

  it('Reset removes the stored choice so a later default reaches the person', () => {
    const c = useTableColumns('reset', cols, { hiddenByDefault: ['id'] })
    c.toggle('price')
    expect(localStorage.getItem('grani:columns:reset')).not.toBeNull()
    c.reset()
    expect(localStorage.getItem('grani:columns:reset')).toBeNull()
    expect(useTableColumns('reset', cols, { hiddenByDefault: ['price'] }).hidden.value).toEqual([
      'price',
    ])
  })

  it('warns in dev when two mounted instances share a key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Host = defineComponent({
      setup: () => {
        useTableColumns('shared', cols)
        return () => h('div')
      },
    })
    const a = mount(Host)
    const b = mount(Host)
    await nextTick()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('two tables share the key "shared"'))
    a.unmount()
    b.unmount()
    warn.mockRestore()
  })

  it('two apps on one page each with one table of a kind do not warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Host = defineComponent({
      setup: () => {
        useTableColumns('apart', cols)
        return () => h('div')
      },
    })
    const a = mount(Host, { global: { plugins: [createGrani()] } })
    const b = mount(Host, { global: { plugins: [createGrani()] } })
    await nextTick()
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('two tables share the key'))
    a.unmount()
    b.unmount()
    warn.mockRestore()
  })
  it('ticking a column back never hides the one kept as the last', () => {
    localStorage.setItem('grani:columns:kept', JSON.stringify(['name', 'id', 'price']))
    const c = useTableColumns('kept', cols)
    expect(keys(c)).toEqual(['name'])
    c.toggle('id')
    expect(keys(c)).toEqual(['name', 'id'])
    expect(c.hidden.value).toEqual(['price'])
  })

  it('a column removed after the others were hidden does not swap the shown one on the next tick', () => {
    const list = ref<TableColumn<Row>[]>([...cols.value])
    const c = useTableColumns('dropped', list)
    c.toggle('id')
    c.toggle('price')
    list.value = list.value.filter((x) => x.key !== 'name')
    expect(keys(c)).toEqual(['id'])
    c.toggle('price')
    expect(keys(c)).toEqual(['id', 'price'])
  })

  it('a choice made in another tab reaches this one', async () => {
    let c!: ReturnType<typeof useTableColumns<Row>>
    const w = mount(
      defineComponent({
        setup: () => {
          c = useTableColumns('tabs', cols)
          return () => h('div')
        },
      }),
    )
    await nextTick()
    localStorage.setItem('grani:columns:tabs', JSON.stringify(['id']))
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'grani:columns:tabs', newValue: '["id"]' }),
    )
    await nextTick()
    expect(c.hidden.value).toEqual(['id'])
    w.unmount()
  })
})

describe('useTableColumns — whose choice and where it is kept', () => {
  beforeEach(() => localStorage.clear())

  it('a scope keeps two people on one browser apart, and a ref of it follows a sign-in', async () => {
    const user = ref<string | undefined>('ann')
    const ann = useTableColumns('people', cols, { scope: user })
    ann.toggle('id')
    expect(JSON.parse(localStorage.getItem('grani:columns:ann:people')!)).toEqual(['id'])
    expect(localStorage.getItem('grani:columns:people')).toBeNull()
    user.value = 'bob'
    await nextTick()
    expect(ann.hidden.value).toEqual([])
    // Loading Bob's default stores nothing for him.
    expect(localStorage.getItem('grani:columns:bob:people')).toBeNull()
    user.value = 'ann'
    await nextTick()
    expect(ann.hidden.value).toEqual(['id'])
  })

  it("createGrani({ storage }) keeps the choice in the app's own storage, not localStorage", () => {
    const kept = new Map<string, string>([['grani:columns:own', JSON.stringify(['price'])]])
    const storage: GraniStorage = {
      getItem: (k) => kept.get(k) ?? null,
      setItem: (k, v) => void kept.set(k, v),
      removeItem: (k) => void kept.delete(k),
    }
    let c!: ReturnType<typeof useTableColumns<Row>>
    const Host = defineComponent({
      setup() {
        c = useTableColumns('own', cols)
        return () => h('i')
      },
    })
    mount(Host, { global: { plugins: [createGrani({ storage })] } })
    expect(c.hidden.value).toEqual(['price'])
    c.toggle('id')
    expect(JSON.parse(kept.get('grani:columns:own')!)).toEqual(['price', 'id'])
    expect(localStorage.getItem('grani:columns:own')).toBeNull()
    c.reset()
    expect(kept.has('grani:columns:own')).toBe(false)
  })
})
