import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { useTableColumns } from '../composables/useTableColumns'
import UiTableColumns from './UiTableColumns.vue'
import UiTableToolbar from './UiTableToolbar.vue'

describe('UiTableToolbar', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('always has a search field, named by the placeholder', () => {
    const plain = mount(UiTableToolbar, { props: { search: '' } }).find('input')
    expect(plain.attributes('type')).toBe('search')
    expect(plain.attributes('placeholder')).toBe('Search')
    expect(plain.attributes('aria-label')).toBe('Search')
    const named = mount(UiTableToolbar, {
      props: { search: '', searchPlaceholder: 'Search invoices' },
    })
    expect(named.find('input').attributes('aria-label')).toBe('Search invoices')
  })

  it('sends the text once after the pause, with the last value', async () => {
    const w = mount(UiTableToolbar, { props: { search: '' } })
    await w.find('input').setValue('an')
    vi.advanceTimersByTime(200)
    await w.find('input').setValue('ann')
    vi.advanceTimersByTime(249)
    expect(w.emitted('update:search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('update:search')).toEqual([['ann']])
  })

  it('Enter sends at once and does not submit a form around the toolbar', async () => {
    const w = mount(UiTableToolbar, { props: { search: '' } })
    await w.find('input').setValue('ann')
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true })
    w.find('input').element.dispatchEvent(enter)
    await nextTick()
    expect(enter.defaultPrevented).toBe(true)
    expect(w.emitted('update:search')).toEqual([['ann']])
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toHaveLength(1)
  })

  it('the Enter that confirms an IME candidate sends nothing', async () => {
    const w = mount(UiTableToolbar, { props: { search: '' } })
    await w.find('input').setValue('ann')
    await w.find('input').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('update:search')).toBeUndefined()
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([['ann']])
  })

  it('sends the text as typed, spaces included', async () => {
    const w = mount(UiTableToolbar, { props: { search: '' } })
    await w.find('input').setValue(' ann ')
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([[' ann ']])
  })

  it('a value set from outside replaces the typing and drops the pending send', async () => {
    const w = mount(UiTableToolbar, { props: { search: 'old' } })
    await w.find('input').setValue('new')
    await w.setProps({ search: '' })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toBeUndefined()
  })

  it('typing back to the bound value sends nothing', async () => {
    const w = mount(UiTableToolbar, { props: { search: 'a' } })
    await w.find('input').setValue('ab')
    await w.find('input').setValue('a')
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toBeUndefined()
  })

  it('unmounting drops a pending send', async () => {
    const spy = vi.fn()
    const w = mount(UiTableToolbar, { props: { search: '' }, attrs: { 'onUpdate:search': spy } })
    await w.find('input').setValue('ann')
    w.unmount()
    vi.advanceTimersByTime(500)
    expect(spy).not.toHaveBeenCalled()
  })

  it('puts the search before `#start` in the left cluster and `#end` in the right one', () => {
    const w = mount(UiTableToolbar, {
      props: { search: '' },
      slots: { start: () => h('i', { class: 'filter' }), end: () => h('b', { class: 'act' }) },
    })
    const clusters = [...w.element.children]
    expect(clusters).toHaveLength(2)
    expect(clusters[0]!.querySelector('input')).not.toBeNull()
    expect(clusters[0]!.querySelector('.filter')).not.toBeNull()
    expect(clusters[1]!.querySelector('.act')).not.toBeNull()
    const noActions = mount(UiTableToolbar, {
      props: { search: '' },
      slots: { start: () => h('i') },
    })
    expect(noActions.element.children).toHaveLength(1)
    const actionsOnly = mount(UiTableToolbar, {
      props: { search: '' },
      slots: { end: () => h('b', { class: 'act' }) },
    })
    expect(actionsOnly.element.children).toHaveLength(2)
    expect(actionsOnly.element.children[0]!.querySelector('input')).not.toBeNull()
    expect(actionsOnly.element.children[1]!.querySelector('.act')).not.toBeNull()
  })
})

describe('UiTableToolbar — review follow-ups', () => {
  it('the row takes one step of the ladder for its search: sm by default, md when asked', () => {
    const sm = mount(UiTableToolbar, { props: { search: '' } })
    expect(sm.findComponent({ name: 'UiInput' }).props('size')).toBe('sm')
    const md = mount(UiTableToolbar, { props: { search: '', size: 'md' } })
    expect(md.findComponent({ name: 'UiInput' }).props('size')).toBe('md')
  })

  it('a columns state puts the columns button first in the right cluster, before the actions', () => {
    const state = useTableColumns<Record<string, unknown>>('toolbar-spec', [
      { key: 'id', label: 'Id' },
      { key: 'name', label: 'Name' },
    ])
    const w = mount(UiTableToolbar, {
      props: { search: '', columns: state },
      slots: { end: () => h('b', { class: 'act' }) },
    })
    const right = w.element.children[1]!
    expect(w.findComponent(UiTableColumns).exists()).toBe(true)
    // The menu's trigger is the first control of the cluster; the caller's action stays last.
    expect(right.firstElementChild!.tagName).toBe('BUTTON')
    expect(right.firstElementChild!.classList.contains('act')).toBe(false)
    expect(right.lastElementChild!.classList.contains('act')).toBe(true)
    expect(
      mount(UiTableToolbar, { props: { search: '' } })
        .findComponent(UiTableColumns)
        .exists(),
    ).toBe(false)
  })

  it('hands the row size to #start and #end, so the caller binds it on its controls', () => {
    const seen: unknown[] = []
    mount(UiTableToolbar, {
      props: { search: '', size: 'md' },
      slots: {
        start: (p: unknown) => (seen.push(p), h('i')),
        end: (p: unknown) => (seen.push(p), h('b')),
      },
    })
    expect(seen).toEqual([{ size: 'md' }, { size: 'md' }])
  })

  it('the cross and Escape each send the empty value once, at once, and keep the focus', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: 'ann' }, attachTo: document.body })
    const input = w.find('input')
    ;(input.element as HTMLElement).focus()
    await input.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:search')).toEqual([['']])
    expect(document.activeElement).toBe(input.element)
    await w.setProps({ search: '' })
    await input.setValue('bob')
    vi.advanceTimersByTime(250)
    await w.setProps({ search: 'bob' })
    await w.find('button[aria-label="Clear"]').trigger('click')
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toEqual([[''], ['bob'], ['']])
    vi.useRealTimers()
    w.unmount()
  })

  it('warns in dev when a second columns menu mounts for the same state, even through a wrapper', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = useTableColumns<Record<string, unknown>>('toolbar-spec-double', [
      { key: 'id', label: 'Id' },
    ])
    const w = mount(UiTableToolbar, {
      props: { search: '', columns: state },
      slots: { end: () => h('div', [h(UiTableColumns, { columns: state })]) },
    })
    await nextTick()
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('two columns menus for one state')),
    ).toBe(true)
    w.unmount()
    warn.mockRestore()
  })
})

describe('UiTableToolbar — review follow-ups', () => {
  it('the host echoing an older sent value does not erase what was typed since', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('a')
    vi.advanceTimersByTime(250)
    await input.setValue('ab')
    // The host applies "a" late, after "b" was typed.
    await w.setProps({ search: 'a' })
    expect((input.element as HTMLInputElement).value).toBe('ab')
    vi.advanceTimersByTime(250)
    expect(w.emitted('update:search')).toEqual([['a'], ['ab']])
  })

  it('an outside value equal to the typed one drops the pending send', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    await w.find('input').setValue('ann')
    await w.setProps({ search: 'ann' })
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toBeUndefined()
  })

  it('leaving the field sends what was typed at once', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('ann')
    await input.trigger('blur')
    expect(w.emitted('update:search')).toEqual([['ann']])
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toHaveLength(1)
  })

  it('the search is a landmark, and the row keeps one 8 px gap on both sides', () => {
    const w = mount(UiTableToolbar, {
      props: { search: '' },
      slots: { end: () => h('button', 'New') },
    })
    expect(w.find('[role="search"] input').exists()).toBe(true)
    expect(w.classes()).toContain('gap-2')
    for (const cluster of w.findAll(':scope > div')) expect(cluster.classes()).toContain('gap-2')
  })

  it('no emit happens while a word is being composed', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.trigger('compositionstart')
    ;(input.element as HTMLInputElement).value = 'に'
    await input.trigger('input')
    vi.advanceTimersByTime(500)
    expect(w.emitted('update:search')).toBeUndefined()
  })

  const sends = (w: ReturnType<typeof mount>) => w.emitted('update:search') ?? []

  it('a clear made while a value is on its way is sent, and the late echo does not undo it', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('ann')
    vi.advanceTimersByTime(250)
    await input.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(sends(w)).toEqual([['ann'], ['']])
    // The host applies both late, one after the other.
    await w.setProps({ search: 'ann' })
    expect((input.element as HTMLInputElement).value).toBe('')
    await w.setProps({ search: '' })
    vi.advanceTimersByTime(500)
    expect(sends(w)).toHaveLength(2)
  })

  it('typing back to a value still on its way sends it again, and the field and the host agree', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('a')
    vi.advanceTimersByTime(250)
    await input.setValue('ab')
    vi.advanceTimersByTime(250)
    await input.setValue('a')
    // The host applies the two sent values while the step back still waits for its pause.
    await w.setProps({ search: 'a' })
    await w.setProps({ search: 'ab' })
    vi.advanceTimersByTime(250)
    expect(sends(w).at(-1)).toEqual(['a'])
    expect((input.element as HTMLInputElement).value).toBe('a')
  })

  it('the same value is not sent twice while the host has not applied it', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('a')
    vi.advanceTimersByTime(250)
    await input.setValue('ab')
    await input.setValue('a')
    vi.advanceTimersByTime(500)
    expect(sends(w)).toEqual([['a']])
  })

  it('a saved view equal to the typing, then a step back, puts the step back in the field', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('ann')
    vi.advanceTimersByTime(250)
    await w.setProps({ search: 'ann' })
    await input.setValue('bob')
    await w.setProps({ search: 'bob' })
    await w.setProps({ search: 'ann' })
    expect((input.element as HTMLInputElement).value).toBe('ann')
  })

  it('the Enter Safari sends after it ends a composition sends nothing at once', async () => {
    vi.useFakeTimers()
    const w = mount(UiTableToolbar, { props: { search: '' } })
    const input = w.find('input')
    await input.setValue('日本')
    input.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true }),
    )
    await nextTick()
    expect(sends(w)).toEqual([])
    vi.advanceTimersByTime(250)
    expect(sends(w)).toEqual([['日本']])
  })
})

// `/` takes the person to the list's search from anywhere on the page, as on the sites that taught
// it; in a field it is a slash, under an open window it is the window's.
describe('UiTableToolbar — / goes to the search', () => {
  const slash = (at: EventTarget = document.body) => {
    const e = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
    at.dispatchEvent(e)
    return e
  }
  const field = (w: ReturnType<typeof mount>) => w.find('input[type="search"]').element

  it('/ from the page goes to the search, and the field says its shortcut', () => {
    const w = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    expect(field(w).getAttribute('aria-keyshortcuts')).toBe('/')
    const e = slash()
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(field(w))
    w.unmount()
  })

  it('typed in a field, / stays a slash', () => {
    const w = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const other = document.createElement('input')
    document.body.append(other)
    other.focus()
    const e = slash(other)
    expect(e.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(other)
    other.remove()
    w.unmount()
  })

  it('the first list on the page takes /', () => {
    const one = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const two = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    slash()
    expect(document.activeElement).toBe(field(one))
    one.unmount()
    two.unmount()
  })

  it('a hidden first search is passed over for the next one in view; with none in view the key is left alone', () => {
    const one = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const two = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const hidden = field(one) as HTMLElement
    hidden.getClientRects = () => [] as unknown as DOMRectList
    ;(field(two) as HTMLElement).getClientRects = () => [{}] as unknown as DOMRectList
    slash()
    expect(document.activeElement).toBe(field(two))
    two.unmount()
    ;(document.activeElement as HTMLElement).blur()
    const e = slash()
    expect(e.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(hidden)
    one.unmount()
  })

  it('a list in an open window takes / for its own search; the page under it does not', () => {
    const page = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)
    slash()
    expect(document.activeElement).not.toBe(field(page))
    const inside = mount(UiTableToolbar, { props: { search: '' }, attachTo: dialog })
    slash()
    expect(document.activeElement).toBe(field(inside))
    inside.unmount()
    dialog.remove()
    page.unmount()
  })

  it('a / the app took first, a window open over the list, or a list held inert keep it', () => {
    const w = mount(UiTableToolbar, { props: { search: '' }, attachTo: document.body })
    const own = (e: KeyboardEvent) => e.preventDefault()
    document.addEventListener('keydown', own, true)
    slash()
    expect(document.activeElement).not.toBe(field(w))
    document.removeEventListener('keydown', own, true)
    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)
    slash()
    expect(document.activeElement).not.toBe(field(w))
    dialog.remove()
    w.element.setAttribute('inert', '')
    slash()
    expect(document.activeElement).not.toBe(field(w))
    w.unmount()
  })
})
