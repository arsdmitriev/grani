import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiNoData from './UiNoData.vue'

describe('UiNoData', () => {
  it('renders the description and no button by default', () => {
    const w = mount(UiNoData, { props: { description: 'Nothing here yet' } })
    expect(w.text()).toContain('Nothing here yet')
    expect(w.find('button').exists()).toBe(false)
  })

  it('It holds the next step: a button of your own, with its own weight.', () => {
    const w = mount(UiNoData, {
      props: { description: 'Empty' },
      slots: { actions: '<button class="create">Create one</button>' },
    })
    const btn = w.find('.create')
    expect(btn.text()).toBe('Create one')
    expect(btn.element.parentElement!.className).toContain('mt-4')
  })

  it('size=sm compacts the padding; md is the default', () => {
    expect(mount(UiNoData, { props: { description: 'x' } }).classes()).toContain('p-10')
    expect(mount(UiNoData, { props: { description: 'x', size: 'sm' } }).classes()).toContain('p-4')
  })

  it('renders the media slot above the text', () => {
    const w = mount(UiNoData, {
      props: { description: 'x' },
      slots: { media: '<svg data-test="ico" />' },
    })
    const html = w.html()
    expect(html.indexOf('data-test="ico"')).toBeLessThan(html.indexOf('<p'))
  })

  it('is announced as a status region', () => {
    const w = mount(UiNoData, { props: { description: 'No data' } })
    expect(w.attributes('role')).toBe('status')
  })

  it('uses only semantic tokens', () => {
    const cls = mount(UiNoData, { props: { description: 'x' } })
      .classes()
      .join(' ')
    expect(cls).not.toMatch(/\b(?:bg|text|border)-(?:gray|slate|zinc)-\d{2,3}\b/)
    expect(cls).not.toContain('dark:')
  })
})

describe('UiNoData — review follow-ups', () => {
  it('shrinks the icon box under size="sm" and keeps the action 16px under the text', () => {
    const icon = { media: '<svg />' }
    const sm = mount(UiNoData, { props: { description: 'x', size: 'sm' }, slots: icon })
    const md = mount(UiNoData, {
      props: { description: 'x' },
      slots: { ...icon, actions: '<button>Add</button>' },
    })
    expect(sm.find('.rounded-pill').classes()).toContain('h-10')
    expect(md.find('.rounded-pill').classes()).toContain('h-12')
    expect(md.find('button').element.parentElement!.className).toContain('mt-4')
  })
})

describe('UiNoData — the three cases', () => {
  it('a title stands over the description', () => {
    const w = mount(UiNoData, { props: { title: 'No invoices yet', description: 'x' } })
    const lines = w.findAll('p')
    expect(lines[0]!.text()).toBe('No invoices yet')
    expect(lines[1]!.classes()).toContain('mt-1')
  })

  it('A failed load is said at once, on a red plate with a warning glyph.', () => {
    const w = mount(UiNoData, {
      props: { tone: 'danger', description: 'The server did not answer.' },
    })
    expect(w.attributes('role')).toBe('alert')
    const plate = w.find('.rounded-pill')
    expect(plate.classes()).toEqual(
      expect.arrayContaining(['bg-danger-subtle', 'text-danger-subtle-fg']),
    )
    expect(plate.find('svg').exists()).toBe(true)
  })

  it('without a glyph a neutral one draws no plate', () => {
    expect(
      mount(UiNoData, { props: { description: 'x' } })
        .find('.rounded-pill')
        .exists(),
    ).toBe(false)
  })
})

describe('UiNoData — review follow-ups', () => {
  it('the next step comes after the title and the description', () => {
    const w = mount(UiNoData, {
      props: { title: 'No invoices yet', description: 'Create the first one.' },
      slots: { actions: '<button class="create">Create</button>' },
    })
    const html = w.html()
    expect(html.indexOf('No invoices yet')).toBeLessThan(html.indexOf('Create the first one.'))
    expect(html.indexOf('Create the first one.')).toBeLessThan(html.indexOf('class="create"'))
  })
})
