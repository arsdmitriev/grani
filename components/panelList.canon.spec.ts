import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { House } from '@lucide/vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PANEL_LIST_ACTIVE,
  ROW_FOCUS,
  PANEL_LIST_HEIGHT,
  PANEL_LIST_ROW,
  PANEL_LIST_SEARCH,
} from '../utils/panelList'
import UiFilterList from './UiFilterList.vue'
import UiSelect from './UiSelect.vue'
import UiMenu from './UiMenu.vue'
import UiListItem from './UiListItem.vue'
import UiAppShell from './UiAppShell.vue'
import UiDateRange from './UiDateRange.vue'
import PanelRow from './PanelRow.vue'
import { NAV_ROW } from '../utils/panelList'

// Every list in a panel reads `utils/panelList`: its rows are the one private row (`PanelRow`) and
// its keys the one behavior (`usePanelList`), so a change there reaches all of them, and a
// component that draws its own rows or walks them its own way fails here. A new panel list joins
// these lists.
const ITEMS = Array.from({ length: 7 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))
const classes = (s: string) => s.split(' ')

const lists: [string, () => Promise<HTMLElement>][] = [
  [
    'UiSelect',
    async () => {
      const w = mount(UiSelect, {
        attachTo: document.body,
        props: { modelValue: null, items: ITEMS, ariaLabel: 'A', searchable: true },
      })
      await w.find('[role="combobox"]').trigger('click')
      await nextTick()
      const root: HTMLElement = w.element
      return root.ownerDocument.body.querySelector<HTMLElement>('[data-ui-panel]')!
    },
  ],
  [
    'UiFilterList',
    async () =>
      mount(UiFilterList, { props: { items: ITEMS, modelValue: [], ariaLabel: 'A' } })
        .element as HTMLElement,
  ],
]

describe('canon: one list in a panel', () => {
  for (const [name, make] of lists) {
    it(`${name} draws its rows, highlight, height and search row from utils/panelList`, async () => {
      const root = await make()
      const row = root.querySelector<HTMLElement>('[role="option"]')!
      expect([...row.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_ROW)))
      const list = root.querySelector<HTMLElement>('[role="listbox"]')!
      expect([...list.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_HEIGHT)))
      const search = root.querySelector('input')!.parentElement!
      expect([...search.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_SEARCH)))
      row.dispatchEvent(new Event('pointermove', { bubbles: true }))
      await nextTick()
      expect([...row.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_ACTIVE)))
      document.body.innerHTML = ''
    })
  }
})

describe('canon: a menu is a list in a panel too', () => {
  it('UiMenu gives its items the panel list row, and the arrows light the same band', async () => {
    const w = mount(UiMenu, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'Export'),
        default: () => ['CSV', 'JSON'].map((t) => h(UiListItem, { as: 'button', title: t })),
      },
    })
    w.find('.trigger').element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    for (let i = 0; i < 4; i++) await nextTick()
    const row = document.body.querySelector<HTMLElement>('[role="menuitem"]')!
    expect([...row.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_ROW)))
    expect([...row.classList]).toEqual(expect.arrayContaining(classes(ROW_FOCUS)))
    document.body.innerHTML = ''
  })
})

describe('canon: one row core for the rows of panels and the sidebar', () => {
  const source = (name: string) => readFileSync(resolve(__dirname, `${name}.vue`), 'utf8')

  it('UiSelect, UiFilterList, UiDateRange, UiTimePicker, UiMenu and UiAppShell draw their rows as PanelRow', () => {
    for (const name of [
      'UiSelect',
      'UiFilterList',
      'UiDateRange',
      'UiTimePicker',
      'UiMenu',
      'UiAppShell',
    ])
      expect(source(name)).toContain("import PanelRow from './PanelRow.vue'")
  })

  it('UiSelect, UiFilterList, UiDateRange, UiTimePicker, UiMenu and UiListField walk their rows with usePanelList', () => {
    for (const name of [
      'UiSelect',
      'UiFilterList',
      'UiDateRange',
      'UiTimePicker',
      'UiMenu',
      'UiListField',
    ])
      expect(source(name)).toMatch(/usePanelList(<[^>]*>)?\(/)
  })

  // UiTimePicker sets its columns' scroll once, on open and when the focus crosses to a column: the
  // chosen row stands in the middle, the rows before it in view. Its arrows go through usePanelList.
  it('no component scrolls a list or gathers typed letters by itself', () => {
    for (const name of ['UiSelect', 'UiFilterList', 'UiDateRange', 'UiMenu', 'UiListField']) {
      expect(source(name)).not.toContain('scrollTop =')
      expect(source(name)).not.toContain('typed +=')
    }
  })

  it('UiDateRange lists its presets as panel rows', async () => {
    const w = mount(UiDateRange, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 2))
    w.find('button').element.click()
    for (let i = 0; i < 4; i++) await nextTick()
    const row = document.body.querySelector<HTMLElement>('[role="option"]')!
    expect([...row.classList]).toEqual(expect.arrayContaining(classes(PANEL_LIST_ROW)))
    w.unmount()
    document.body.innerHTML = ''
  })

  it("UiAppShell's places are panel rows of the sidebar: the nav row, never a UiListItem", () => {
    const w = mount(UiAppShell, {
      props: { nav: [{ items: [{ to: '/', label: 'Home', icon: House }] }] },
    })
    const place = w.find('nav').findComponent(PanelRow)
    expect(place.exists()).toBe(true)
    expect(place.classes()).toEqual(expect.arrayContaining(classes(NAV_ROW)))
    expect(w.find('nav').findComponent(UiListItem).exists()).toBe(false)
  })
})

// The band of a highlighted row reads 1.05:1 against the panel, under the 3:1 a focus mark needs:
// a bar of the brand at the row's start edge says which row it is, 5.5:1 against the band, without
// moving its text. The same mark on a command row the focus is on, and in a row's own ink for a
// toned one.
describe('the mark of the highlighted row', () => {
  // A border, not a fill: forced colors drop fills, and keep a border in the system's ink.
  it('an option the keys highlight and a focused command row carry a bar at their start edge', () => {
    const bar = ['before:absolute', 'before:inset-y-0', 'before:start-0', 'before:border-s-[3px]']
    const option = mount(PanelRow, { props: { purpose: 'option', active: true } })
    expect(option.classes()).toEqual(
      expect.arrayContaining(['relative', ...bar, 'before:border-s-brand']),
    )
    const command = mount(PanelRow, { props: { purpose: 'command', as: 'button' } })
    expect(command.classes()).toEqual(
      expect.arrayContaining([
        'relative',
        ...bar.map((c) => `focus-visible:${c}`),
        'focus-visible:before:border-s-brand',
      ]),
    )
    const danger = mount(PanelRow, { props: { purpose: 'command', as: 'button', tone: 'danger' } })
    expect(danger.classes()).toContain('focus-visible:before:border-s-current')
    const row = mount(UiListItem, { props: { as: 'button', title: 'Rename' } })
    expect(row.classes()).toEqual(
      expect.arrayContaining([
        'relative',
        'focus-visible:before:border-s-[3px]',
        'focus-visible:before:border-s-brand',
      ]),
    )
    for (const w of [option, command, danger, row])
      expect(w.classes().some((c) => /before:bg-/.test(c))).toBe(false)
  })
})
