import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createCommentVNode, defineComponent, Fragment, h, nextTick, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiCard from './UiCard.vue'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import UiReveal from './UiReveal.vue'
import UiSwitch from './UiSwitch.vue'
import { FLAT_CARD, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')

describe('UiList', () => {
  it('is a list, each child an item of it, a v-for and a v-if opened', () => {
    const w = mount(UiList, {
      slots: {
        default: () => [
          h(UiListItem, { title: 'A' }),
          [1, 2].map((n) => h(UiListItem, { key: n, title: `Row ${n}` })),
          null,
        ],
      },
    })
    expect(w.element.tagName).toBe('UL')
    expect(w.attributes('role')).toBe('list')
    const items = w.findAll(':scope > li')
    expect(items).toHaveLength(3)
    for (const i of items) expect(i.attributes('role')).toBe('listitem')
    expect(items[1]!.text()).toBe('Row 1')
  })

  it('follows rows handed in through a scoped slot as a plain array', async () => {
    // A host that hands its rows to a slot as a plain array, as a select hands its picks.
    const Host = defineComponent({
      props: { rows: { type: Array as () => string[], required: true } },
      setup(props, { slots }) {
        return () => h('div', slots.default?.({ rows: [...props.rows] }))
      },
    })
    const rows = ref(['Coffee beans', 'Paper cups'])
    const w = mount(() =>
      h(
        Host,
        { rows: rows.value },
        {
          default: ({ rows: given }: { rows: string[] }) =>
            h(UiList, null, () => given.map((t) => h(UiListItem, { key: t, title: t }))),
        },
      ),
    )
    rows.value = [...rows.value, 'Oat milk']
    await nextTick()
    expect(w.findAll('[role=listitem]').map((li) => li.text())).toEqual([
      'Coffee beans',
      'Paper cups',
      'Oat milk',
    ])
  })

  it('draws the line between its rows, never above the first, over the row’s own air', () => {
    const rule =
      ':root .ui-list > li:has(> :is([data-row], [data-row-block])) + li:has(> [data-row])::before'
    expect(css).toContain(rule)
    const block = css.slice(css.indexOf(rule), css.indexOf('}', css.indexOf(rule)))
    expect(block).toContain('position: absolute')
    expect(block).toContain('border-top: 1px solid var(--color-border)')
  })

  it('a framed row among the rows stands alone; a notice is a row the line counts', () => {
    const w = mount(UiList, {
      slots: {
        default: () => [
          h(UiListItem, { title: 'A' }),
          h(UiListItem, { tone: 'warning', title: 'Rate missing' }),
          h(UiListItem, { variant: 'outline', title: 'Framed' }),
        ],
      },
    })
    const [row, notice, framed] = w.findAllComponents(UiListItem)
    expect(row!.attributes('data-row')).toBe('')
    expect(notice!.attributes('data-row')).toBe('')
    expect(framed!.attributes('data-row')).toBeUndefined()
  })

  it('a notice among the rows is a row: no card of its own, the tone’s edge at the start, its glyph, read as a status', () => {
    const w = mount(UiList, {
      slots: {
        default: () => [
          h(UiListItem, { title: 'A' }),
          h(UiListItem, { tone: 'danger', title: 'Stopped' }),
        ],
      },
      global: { provide: { [ROW_INSET as symbol]: 'surface' } },
    })
    const [row, notice] = w.findAllComponents(UiListItem)
    expect(notice!.attributes('role')).toBe('status')
    const cls = notice!.classes()
    for (const c of ['rounded-card', 'border', 'border-border', 'bg-surface', 'border-s-[3px]'])
      expect(cls).not.toContain(c)
    expect(cls).toEqual(
      expect.arrayContaining([
        'before:absolute',
        'before:inset-y-0',
        'before:start-0',
        'before:border-s-[3px]',
        'before:border-s-danger-border',
      ]),
    )
    // The rows' edges and height: the same inset and step as the row above it.
    expect(cls).toContain('px-surface')
    expect(cls).toContain('min-h-14')
    expect(row!.classes()).toContain('py-4')
    expect(cls).toContain('py-4')
    expect(cls).not.toContain('bg-danger-subtle')
    expect(notice!.find('svg').classes()).toContain('text-danger-border')
    expect(notice!.element.parentElement!.getAttribute('role')).toBe('listitem')
  })

  it('a soft notice among the rows takes its tone’s pale plate, the words and the glyph in its ink', () => {
    const w = mount(UiList, {
      slots: {
        default: () => [
          h(UiListItem, { tone: 'info', variant: 'soft', title: 'Note', description: 'Daily.' }),
        ],
      },
    })
    const notice = w.findComponent(UiListItem)
    expect(notice.classes()).toEqual(
      expect.arrayContaining([
        'bg-info-subtle',
        'text-info-subtle-fg',
        'before:border-s-info-border',
      ]),
    )
    expect(notice.attributes('data-row')).toBe('')
    expect(notice.find('svg').classes()).not.toContain('text-info-border')
    for (const p of notice.findAll('p')) {
      expect(p.classes()).not.toContain('text-fg')
      expect(p.classes()).not.toContain('text-fg-muted')
    }
  })

  it('a notice inside a row’s slot is no item of the list: it keeps its card', () => {
    const w = mount(UiList, {
      slots: {
        default: () => [
          h(
            UiListItem,
            { title: 'A' },
            { default: () => h(UiListItem, { tone: 'info', title: 'In' }) },
          ),
        ],
      },
    })
    const inner = w.findAllComponents(UiListItem)[1]!
    expect(inner.classes()).toEqual(expect.arrayContaining(['rounded-card', 'border-s-[3px]']))
  })

  it('in a surface with a gutter it runs edge to edge and its rows keep their text on the gutter', () => {
    const w = mount(UiList, {
      slots: { default: () => [h(UiListItem, { title: 'A' }), h(UiListItem, { title: 'B' })] },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'surface' } },
    })
    expect(w.classes()).toContain('-mx-surface')
    for (const r of w.findAllComponents(UiListItem)) {
      expect(r.classes()).toContain('px-surface')
      expect(r.classes()).not.toContain('-mx-surface')
    }
  })

  it('in a card without padding it bleeds nothing and its rows keep the card’s inset', () => {
    const w = mount(UiCard, {
      props: { padded: false },
      slots: { default: () => h(UiList, () => h(UiListItem, { title: 'A' })) },
    })
    expect(
      w
        .findComponent(UiList)
        .classes()
        .some((c) => c.startsWith('-m')),
    ).toBe(false)
    expect(w.findComponent(UiListItem).classes()).toContain('px-surface')
  })

  it('outside a surface its rows keep their own inset', () => {
    const w = mount(UiList, {
      slots: { default: () => h(UiListItem, { title: 'A', size: 'sm' }) },
      global: { provide: { [ROW_INSET as symbol]: null } },
    })
    expect(w.classes()).toEqual(['ui-list'])
    expect(w.findComponent(UiListItem).classes()).toContain('px-3')
  })

  // Whether a list reaches a section's line, however the reach is drawn: on the list, or by the
  // section for its own first or last child.
  const reaches = (list: Element, side: 'top' | 'bottom') => {
    const parent = list.parentElement!
    const at = side === 'top' ? parent.firstElementChild : parent.lastElementChild
    const own = side === 'top' ? 'first:-mt-drawer' : 'last:-mb-drawer'
    const given =
      side === 'top' ? '[&>.ui-list:first-child]:-mt-drawer' : '[&>.ui-list:last-child]:-mb-drawer'
    return at === list && (list.classList.contains(own) || parent.classList.contains(given))
  }
  const section = (props: Record<string, unknown>, body: () => unknown) =>
    mount(UiCard, {
      props,
      slots: { default: body },
      global: { provide: { [FLAT_CARD as symbol]: true, [SURFACE_GUTTER as symbol]: 'drawer' } },
    })

  it("a list first and last in a drawer's section reaches both lines; a list inside a row does not", () => {
    const w = section({}, () =>
      h(UiList, () => [
        h(UiListItem, { title: 'A' }),
        h(UiList, () => h(UiListItem, { title: 'Inner' })),
      ]),
    )
    const [outer, inner] = w.findAll('.ui-list').map((l) => l.element)
    expect(outer!.classList).toContain('-mx-drawer')
    expect(reaches(outer!, 'top')).toBe(true)
    expect(reaches(outer!, 'bottom')).toBe(true)
    expect(reaches(inner!, 'top')).toBe(false)
    expect(reaches(inner!, 'bottom')).toBe(false)
  })

  it('a section with a header over its body lets its list reach the line below only', () => {
    const w = section({ title: 'Actions' }, () => h(UiList, () => h(UiListItem, { title: 'A' })))
    const list = w.find('.ui-list').element
    expect(reaches(list, 'top')).toBe(false)
    expect(reaches(list, 'bottom')).toBe(true)
  })

  it('a list wrapped in a block of the section, after a paragraph, reaches no line', () => {
    const w = section({}, () => [
      h('p', 'Intro'),
      h('div', [h(UiList, () => h(UiListItem, { title: 'A' }))]),
    ])
    const list = w.find('.ui-list').element
    expect(reaches(list, 'top')).toBe(false)
    expect(reaches(list, 'bottom')).toBe(false)
  })

  it('a row shown by v-if and rows keyed by their index keep their own state as the list changes', async () => {
    let made = 0
    const Row = defineComponent({
      props: { name: { type: String, required: true } },
      setup(p) {
        const id = ++made
        return () => h('div', { 'data-row': '', 'data-id': id }, p.name)
      },
    })
    const note = ref(true)
    const names = ref(['A', 'B'])
    const w = mount({
      render: () =>
        h(UiList, () => [
          note.value ? h(Row, { key: 0, name: 'Note' }) : createCommentVNode('v-if', true),
          h(
            Fragment,
            null,
            names.value.map((n, i) => h(Row, { key: i, name: n })),
          ),
        ]),
    })
    const idOf = (name: string) =>
      w
        .findAll('[data-id]')
        .find((r) => r.text() === name)!
        .attributes('data-id')
    const a = idOf('A')
    const b = idOf('B')
    note.value = false
    await nextTick()
    expect(w.findAll('li').map((l) => l.text())).toEqual(['A', 'B'])
    expect(idOf('A')).toBe(a)
    expect(idOf('B')).toBe(b)
  })

  it('a child that is not a row stands as an item, with no line logic of its own', () => {
    const w = mount(UiList, {
      slots: { default: () => [h(UiListItem, { title: 'A' }), h('p', { class: 'note' }, 'Plain')] },
    })
    const note = w.find('.note').element
    expect(note.parentElement!.tagName).toBe('LI')
    expect(note.hasAttribute('data-row')).toBe(false)
  })

  it('a row added on top keeps the items of the rows already there', async () => {
    const names = ref(['B', 'C'])
    const w = mount({
      render: () => h(UiList, () => names.value.map((n) => h(UiListItem, { key: n, title: n }))),
    })
    const before = w.findAll('li')[0]!.element
    names.value = ['A', ...names.value]
    await nextTick()
    const items = w.findAll('li')
    expect(items.map((i) => i.text())).toEqual(['A', 'B', 'C'])
    expect(items[1]!.element).toBe(before)
  })

  it('a UiReveal is one item: its row and the block the row opened', () => {
    const w = mount(UiList, {
      global: { stubs: { transition: false } },
      slots: {
        default: () => [
          h(
            UiReveal,
            { open: true },
            {
              trigger: () =>
                h(
                  UiListItem,
                  { as: 'label', title: 'Reminders' },
                  { actions: () => h(UiSwitch, { modelValue: true }) },
                ),
              default: () => 'Fields',
            },
          ),
          h(UiListItem, { title: 'Digest' }),
        ],
      },
    })
    const items = w.findAll(':scope > li')
    expect(items).toHaveLength(2)
    expect(items[0]!.find('[data-row]').exists()).toBe(true)
    expect(items[0]!.find('[data-row-block]').exists()).toBe(true)
  })
})
