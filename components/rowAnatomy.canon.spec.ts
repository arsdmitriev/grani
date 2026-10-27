import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiDropzone from './UiDropzone.vue'
import UiList from './UiList.vue'
import UiListField from './UiListField.vue'
import UiListItem from './UiListItem.vue'
import { ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

// Every component with rows shaped as "text left, a thing right" draws them with UiListItem,
// so spacing, media and actions never drift; rows one under another stand in a UiList, which
// draws the line between them. A new one joins these lists. UiToaster and UiDataTable have their
// own specs for the same. UiLog is a timeline, not rows. The rows of a panel or a sidebar (UiMenu,
// UiSelect, UiAppShell's places) are the panel list's: panelList.canon.spec.ts.
const file = new File([new Uint8Array(10)], 'a.pdf', { type: 'application/pdf' })
const rows: [string, () => ReturnType<typeof mount>][] = [
  ['UiListField', () => mount(UiListField)],
  ['UiDropzone', () => mount(UiDropzone, { props: { modelValue: [file], ariaLabel: 'A' } })],
]

describe('canon: one row anatomy', () => {
  for (const [name, make] of rows) {
    it(`${name} draws its rows with UiListItem`, () => {
      expect(make().findComponent(UiListItem).exists()).toBe(true)
    })
  }
})

const lists: [string, () => ReturnType<typeof mount>][] = [
  ['UiListField', () => mount(UiListField)],
  ['UiDropzone', () => mount(UiDropzone, { props: { modelValue: [file], ariaLabel: 'A' } })],
]

describe('canon: rows one under another stand in a UiList', () => {
  for (const [name, make] of lists) {
    it(`${name} stands its rows in a UiList`, () => {
      const list = make().findComponent(UiList)
      expect(list.exists()).toBe(true)
      expect(list.findComponent(UiListItem).exists()).toBe(true)
    })
  }
})

describe('canon: rows inside a component box do not bleed', () => {
  it('UiDropzone in a drawer section keeps its file rows inside its own border', () => {
    const w = mount(UiDropzone, {
      props: { modelValue: [file], ariaLabel: 'A' },
      global: { provide: { [SURFACE_GUTTER as symbol]: 24, [ROW_INSET as symbol]: 16 } },
    })
    const rows = w.findAll('[data-row]')
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.classes()).not.toContain('-mx-6')
      expect(r.classes()).toContain('px-3')
    }
  })
})
