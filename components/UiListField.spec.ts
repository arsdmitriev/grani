import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UiListField from './UiListField.vue'
import UiListItem from './UiListItem.vue'
import UiField from './UiField.vue'
import UiModal from './UiModal.vue'
import UiButton from './UiButton.vue'
import { PANEL_LIST_ACTIVE } from '../utils/panelList'
import { focusInvalid } from '../utils/focusInvalid'

const NAMES = ['Fruit', 'Frozen food', 'Dairy']
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(e)
  return e
}
const paste = (el: HTMLInputElement, text: string) => {
  const e = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
  Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } })
  el.dispatchEvent(e)
  return e
}
// Vue drops a click in the millisecond its listener was attached (`_vts`): a test that clicks
// right after mounting waits that millisecond out, as a person always does.
const afterMount = () => new Promise((r) => setTimeout(r, 2))
const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((r) => setTimeout(r))
}
// The parent filters: the slot gets the query and draws the rows that match.
const mountList = (props: Record<string, unknown> = {}) =>
  mount(UiListField, {
    attachTo: document.body,
    props: { existing: NAMES, ...props },
    slots: {
      default: ({ query }: { query: string }) =>
        NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase())).map((n) =>
          h(UiListItem, { as: 'button', size: 'sm', title: n, class: 'item', highlight: query }),
        ),
    },
  })
const addRow = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => (b.attributes('aria-label') ?? '').startsWith('Add “'))
const band = (w: ReturnType<typeof mount>) =>
  w.find('[data-active]').exists() ? w.find('[data-active]').text().trim() : undefined

describe('UiListField', () => {
  it('Enter adds what is offered, empties the field and keeps the focus', async () => {
    const onAdd = vi.fn()
    const w = mountList({ onAdd })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('Fresh fish')
    expect(key(input.element, 'Enter').defaultPrevented).toBe(true)
    await nextTick()
    expect(onAdd).toHaveBeenCalledWith(['Fresh fish'])
    expect(input.element.value).toBe('')
    expect(document.activeElement).toBe(input.element)
    w.unmount()
  })

  it('removing a row puts the focus on its neighbor', async () => {
    const items = ref(['a@example.com', 'b@example.com', 'c@example.com'])
    const row = (name: string) =>
      h(
        UiListItem,
        { key: name, size: 'sm', title: name },
        {
          actions: () =>
            h('button', {
              'aria-label': `Remove ${name}`,
              onClick: () => (items.value = items.value.filter((i) => i !== name)),
            }),
        },
      )
    const w = mount(
      defineComponent(
        () => () =>
          h(UiListField, { search: false, existing: items.value }, () => items.value.map(row)),
      ),
      { attachTo: document.body },
    )
    const remove = (name: string) =>
      document.querySelector<HTMLButtonElement>(`[aria-label="Remove ${name}"]`)!
    // The row below takes the place: its cross, where the hand was.
    remove('b@example.com').focus()
    remove('b@example.com').click()
    await settle()
    expect(document.activeElement).toBe(remove('c@example.com'))
    // The last row: the one above.
    remove('c@example.com').click()
    await settle()
    expect(document.activeElement).toBe(remove('a@example.com'))
    // Nothing left: the field.
    remove('a@example.com').click()
    await settle()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('a row removed after the focus left the list takes no focus back', async () => {
    const items = ref(['a@example.com', 'b@example.com'])
    const w = mount(
      defineComponent(
        () => () =>
          h(UiListField, { search: false, existing: items.value }, () =>
            items.value.map((name) =>
              h(
                UiListItem,
                { key: name, size: 'sm', title: name },
                {
                  actions: () => h('button', { 'aria-label': `Remove ${name}` }),
                },
              ),
            ),
          ),
      ),
      { attachTo: document.body },
    )
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    document.querySelector<HTMLButtonElement>('[aria-label="Remove a@example.com"]')!.focus()
    outside.focus()
    await settle()
    items.value = ['b@example.com']
    await settle()
    expect(document.activeElement).toBe(outside)
    outside.remove()
    w.unmount()
  })

  it('the offered row adds on a click as well', async () => {
    const onAdd = vi.fn()
    const w = mountList({ onAdd })
    await w.find('input').setValue('Meat')
    await addRow(w)!.trigger('click')
    expect(onAdd).toHaveBeenCalledWith(['Meat'])
    w.unmount()
  })

  it('a pasted column adds every line, repeats pointed at', async () => {
    const onAdd = vi.fn()
    const w = mountList({ onAdd })
    paste(w.find('input').element, 'Meat\nfruit\nFish')
    await nextTick()
    expect(onAdd).toHaveBeenCalledWith(['Meat', 'Fish'])
    expect(w.emitted('taken')).toEqual([['Fruit']])
    expect(w.find('[role="alert"]').text()).toBe('Fruit is already in the list.')
    w.unmount()
  })

  it('the draft is v-model:query; the default model is not taken by it', async () => {
    const w = mountList({ query: 'Fr', 'onUpdate:query': () => {} })
    expect(w.find('input').element.value).toBe('Fr')
    await w.find('input').setValue('Fru')
    expect(w.emitted('update:query')).toEqual([['Fru']])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('two @add listeners merged from attributes are both called and both held for, as @more is', async () => {
    let done!: () => void
    const first = vi.fn(() => new Promise<void>((r) => (done = r)))
    const second = vi.fn()
    const w = mountList({ onAdd: [first, second] })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    expect(first).toHaveBeenCalledWith(['Meat'])
    expect(second).toHaveBeenCalledWith(['Meat'])
    expect(w.find('[aria-live="polite"]').text()).toBe('Adding…')
    done()
    await settle()
    expect(w.find('[aria-live="polite"]').text()).toBe('')
    w.unmount()
  })

  it('a request says Adding… with a spinner; a failure gives the text back with a line', async () => {
    let fail!: () => void
    const w = mountList({
      onAdd: () => new Promise((_, r) => (fail = () => r(new Error('offline')))),
    })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    // Said by the live region that stays, the spinner beside the input is decoration.
    expect(w.find('[aria-live="polite"]').text()).toBe('Adding…')
    expect(w.find('.animate-spin').attributes('aria-hidden')).toBe('true')
    fail()
    await settle()
    expect(input.element.value).toBe('Meat')
    expect(w.find('[role="alert"]').text()).toBe('Could not add Meat. Press Enter to try again.')
    w.unmount()
  })

  it('check refuses with the reason and the text stays', async () => {
    const onAdd = vi.fn()
    const w = mountList({
      onAdd,
      check: (s: string) => (s.length < 3 ? `“${s}” is too short.` : undefined),
    })
    await w.find('input').setValue('ab')
    key(w.find('input').element, 'Enter')
    await nextTick()
    expect(onAdd).not.toHaveBeenCalled()
    expect(w.find('input').element.value).toBe('ab')
    expect(w.find('[role="alert"]').text()).toBe('“ab” is too short.')
    w.unmount()
  })

  it('a full list has no field and offers nothing', () => {
    const w = mountList({ limit: 3 })
    expect(w.find('input').exists()).toBe(false)
    w.unmount()
  })

  it('named by the placeholder; the default is "Find or add…"', () => {
    const w = mountList()
    expect(w.find('input').attributes('aria-label')).toBe('Find or add…')
    w.unmount()
  })

  it('class and style stay on the root, the rest reaches the field', () => {
    const w = mountList({})
    w.unmount()
    const x = mount(UiListField, { attrs: { class: 'mine', 'data-testid': 'find' } })
    expect(x.classes()).toContain('mine')
    expect(x.find('input').attributes('data-testid')).toBe('find')
  })
})

describe('UiListField — how it reads', () => {
  it('an empty list says how to start; a query or a list hides the line', async () => {
    const w = mount(UiListField, { props: { existing: [], empty: 'No words yet.' } })
    expect(w.text()).toContain('No words yet.')
    await w.find('input').setValue('m')
    expect(w.text()).not.toContain('No words yet.')
    const d = mount(UiListField, { props: { existing: [] } })
    expect(d.text()).toContain('Nothing here yet: type a name and press Enter.')
  })
})

describe('UiListField — the field heads the list', () => {
  it('a framed card whose first row is the field, and no count in it', async () => {
    const w = mountList()
    expect(w.find('[data-framed]').exists()).toBe(true)
    await w.find('input').setValue('fr')
    expect(w.findAll('.item').map((r) => r.text())).toEqual(['Fruit', 'Frozen food'])
    expect(w.text()).not.toMatch(/\d of \d/)
    w.unmount()
  })

  it('the typed letters are marked in each row', async () => {
    const w = mountList()
    await w.find('input').setValue('fr')
    expect(w.findAll('.item mark').map((m) => m.text())).toEqual(['Fr', 'Fr'])
    w.unmount()
  })

  it('with no exact name the field ends in “Add …”; with one it does not', async () => {
    const w = mountList()
    await w.find('input').setValue('fr')
    expect(addRow(w)?.attributes('aria-label')).toBe('Add “fr”')
    expect(addRow(w)?.text().replace(/\s+/g, '')).toBe('Add')
    await w.find('input').setValue('fruit')
    expect(addRow(w)).toBeUndefined()
    w.unmount()
  })

  it('the first match is ready for Enter; ↓ moves the band, past the last to “Add …”, and the cursor stays', async () => {
    const opened = vi.fn()
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: NAMES },
      slots: {
        default: ({ query }: { query: string }) =>
          NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase())).map((n) =>
            h(UiListItem, { as: 'button', size: 'sm', title: n, onClick: () => opened(n) }),
          ),
      },
    })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('fr')
    await settle()
    expect(band(w)).toBe('Fruit')
    key(input.element, 'ArrowDown')
    await settle()
    expect(band(w)).toBe('Frozen food')
    expect(document.activeElement).toBe(input.element)
    key(input.element, 'Enter')
    expect(opened).toHaveBeenCalledWith('Frozen food')
    key(input.element, 'ArrowDown')
    await settle()
    expect(band(w)).toBeUndefined()
    expect(w.find('.sr-only[aria-live]').text()).toContain('Enter adds “fr”')
    w.unmount()
  })

  it('what was added here comes to the slot, newest first, to put on top', async () => {
    const seen: string[][] = []
    const w = mount(UiListField, {
      props: { existing: NAMES, onAdd: () => undefined },
      slots: { default: ({ added }: { added: string[] }) => (seen.push(added), []) },
    })
    await w.find('input').setValue('Meat')
    key(w.find('input').element, 'Enter')
    await w.find('input').setValue('Fish')
    key(w.find('input').element, 'Enter')
    await nextTick()
    expect(seen.at(-1)).toEqual(['Fish', 'Meat'])
  })

  it('with Shift, Alt, Ctrl or Cmd an arrow is the browser’s, as in any text field: the band stays', async () => {
    const w = mountList()
    const input = w.find('input')
    input.element.focus()
    await input.setValue('fr')
    await settle()
    expect(band(w)).toBe('Fruit')
    for (const held of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey']) {
      expect(key(input.element, 'ArrowDown', { [held]: true }).defaultPrevented, held).toBe(false)
      await settle()
      expect(band(w), held).toBe('Fruit')
    }
    w.unmount()
  })

  it('a search that finds nothing offers to add what was typed', async () => {
    const w = mountList()
    await w.find('input').setValue('Meat')
    await settle()
    expect([w.findAll('.item').length, addRow(w)?.attributes('aria-label')]).toEqual([
      0,
      'Add “Meat”',
    ])
    expect(w.find('.sr-only[aria-live]').text()).toContain('Enter adds “Meat”')
    w.unmount()
  })

  it('Cmd or Ctrl with Enter is the form’s: nothing is added and the key goes on', async () => {
    const add = vi.fn()
    const w = mount(UiListField, { attachTo: document.body, props: { search: false, onAdd: add } })
    const input = w.find('input')
    await input.setValue('Meat')
    expect(key(input.element, 'Enter', { metaKey: true }).defaultPrevented).toBe(false)
    expect(key(input.element, 'Enter', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect([add.mock.calls.length, input.element.value]).toEqual([0, 'Meat'])
    w.unmount()
  })

  it('in a form Enter opens the row under the band or adds the text, and the form is not sent', async () => {
    const opened = vi.fn()
    const sent = vi.fn((e: Event) => e.preventDefault())
    const w = mount(
      {
        render: () =>
          h('form', { onSubmit: sent }, [
            h(
              UiListField,
              { existing: NAMES, onAdd: () => undefined },
              {
                default: ({ query }: { query: string }) =>
                  NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase())).map((n) =>
                    h(UiListItem, { as: 'button', size: 'sm', title: n, onClick: () => opened(n) }),
                  ),
              },
            ),
            h('button', { type: 'submit' }, 'Save'),
          ]),
      },
      { attachTo: document.body },
    )
    const input = w.find('input')
    await input.setValue('fr')
    await settle()
    expect(key(input.element, 'Enter').defaultPrevented).toBe(true)
    expect(opened).toHaveBeenCalledWith('Fruit')
    await input.setValue('Meat')
    await settle()
    expect(key(input.element, 'Enter').defaultPrevented).toBe(true)
    expect(sent).not.toHaveBeenCalled()
    w.unmount()
  })

  it('no line of keys under the list; the cross empties the field', async () => {
    const w = mountList()
    expect(w.text()).not.toContain('to move')
    await w.find('input').setValue('xy')
    await w.find('button[aria-label="Clear"]').trigger('click')
    expect(w.find('input').element.value).toBe('')
    w.unmount()
  })
})

describe('UiListField — when there is nothing', () => {
  it('an empty list counts nothing and offers the name right after it', async () => {
    const w = mount(UiListField, { props: { existing: [] } })
    await w.find('input').setValue('Meat')
    expect(w.text()).not.toMatch(/\d of \d/)
    expect(addRow(w)?.attributes('aria-label')).toBe('Add “Meat”')
    expect(w.text()).not.toContain('Nothing is named')
  })

  it('no match says it once, on the Add after the text, not in a line under it', async () => {
    const w = mountList()
    await w.find('input').setValue('xyz')
    expect(addRow(w)?.text()).toContain('Add')
    expect(w.text()).not.toContain('Nothing is named')
    await w.find('input').setValue('fr')
    expect(addRow(w)?.attributes('aria-label')).toBe('Add “fr”')
    w.unmount()
  })
})

describe('UiListField — a long name', () => {
  it('the Add stays short and stands at the end, just before the cross', async () => {
    const w = mountList()
    await w.find('input').setValue('A very long subcategory name indeed')
    expect(addRow(w)!.text().replace(/\s+/g, '')).toBe('Add')
    const next = addRow(w)!.element.nextElementSibling!
    expect(next.getAttribute('aria-label')).toBe('Clear')
    w.unmount()
  })
})

describe('UiListField — the leading glyph says the state', () => {
  it('a search at rest, the spinner in its place while adding, an alert after a failure', async () => {
    let fail!: () => void
    const w = mount(UiListField, {
      props: { existing: [], onAdd: () => new Promise((_, r) => (fail = () => r(new Error('x')))) },
    })
    const first = () => w.find('input').element.previousElementSibling!
    expect(first().getAttribute('class')).toContain('lucide-search')
    await w.find('input').setValue('Meat')
    key(w.find('input').element, 'Enter')
    await nextTick()
    expect(first().getAttribute('class')).toContain('animate-spin')
    expect(w.find('[aria-live="polite"]').text()).toBe('Adding…')
    fail()
    await settle()
    expect(first().getAttribute('class')).toContain('lucide-circle-alert')
    await w.find('input').setValue('Meat2')
    await w.find('input').trigger('input')
    expect(first().getAttribute('class')).toContain('lucide-search')
  })
})

describe('UiListField — search off: a field that only adds', () => {
  const rowsOf = (names: string[]) => () =>
    names.map((n) => h(UiListItem, { size: 'sm', title: n, class: 'item' }))
  const off = (props: Record<string, unknown> = {}, names = ['Fruit', 'Dairy']) =>
    mount(UiListField, {
      attachTo: document.body,
      props: { search: false, existing: names, ...props },
      slots: { default: rowsOf(names) },
    })

  it('typing does not filter, no band; the slot gets no query; a plus leads the field', async () => {
    let seen = 'x'
    const w = mount(UiListField, {
      props: { search: false, existing: ['Fruit'] },
      slots: { default: ({ query }: { query: string }) => ((seen = query), rowsOf(['Fruit'])()) },
    })
    await w.find('input').setValue('fr')
    expect(seen).toBe('')
    expect(w.find('[data-active]').exists()).toBe(false)
    expect(w.find('input').element.previousElementSibling!.getAttribute('class')).toContain(
      'lucide-plus',
    )
    expect(w.find('input').attributes('placeholder')).toBe('Add…')
  })

  it('Enter adds even when a row holds the same letters; a repeat is refused with a line', async () => {
    const onAdd = vi.fn()
    const w = off({ onAdd })
    const input = w.find('input')
    await input.setValue('Fru')
    key(input.element, 'Enter')
    expect(onAdd).toHaveBeenCalledWith(['Fru'])
    await input.setValue('dairy')
    key(input.element, 'Enter')
    await nextTick()
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(w.find('[role="alert"]').text()).toBe('Dairy is already in the list.')
    expect(w.emitted('taken')).toEqual([['Dairy']])
    w.unmount()
  })

  it('split, fix and check go the same way: a list typed with commas, tidied, the bad one kept', async () => {
    const onAdd = vi.fn()
    const w = off({
      onAdd,
      split: 'lists',
      fix: (s: string) => s.toLowerCase(),
      check: (s: string) => (s.includes('@') ? undefined : `“${s}” is not an email`),
    })
    const input = w.find('input')
    await input.setValue('A@x.test, foo, b@x.test')
    key(input.element, 'Enter')
    await nextTick()
    expect(onAdd).toHaveBeenCalledWith(['a@x.test', 'b@x.test'])
    expect(input.element.value).toBe('foo')
    expect(w.find('[role="alert"]').text()).toBe('“foo” is not an email')
    w.unmount()
  })

  it('a limit fits a paste into what is left; full, the field is gone and says what did not fit', async () => {
    const onAdd = vi.fn()
    const w = off({ onAdd, limit: 3 }, ['Fruit', 'Dairy'])
    paste(w.find('input').element, 'Meat\nFish')
    await nextTick()
    expect(onAdd).toHaveBeenCalledWith(['Meat'])
    await w.setProps({ existing: ['Fruit', 'Dairy', 'Meat'] })
    expect(w.find('input').exists()).toBe(false)
    expect(w.text()).toContain('Could not add 1 item: this list allows up to 3.')
    w.unmount()
  })

  it('a maxlength cuts a pasted item too; a fix that throws refuses with a reason', async () => {
    const onAdd = vi.fn()
    const w = mount(UiListField, {
      props: { search: false, onAdd },
      attrs: { maxlength: 5 },
    })
    paste(w.find('input').element, 'Vegetables\nFrozen food')
    expect(onAdd).toHaveBeenCalledWith(['Veget', 'Froze'])
    const x = mount(UiListField, {
      props: {
        search: false,
        onAdd,
        fix: () => {
          throw new Error('boom')
        },
      },
    })
    await x.find('input').setValue('Meat')
    key(x.find('input').element, 'Enter')
    await nextTick()
    expect(x.find('[role="alert"]').text()).toBe('“Meat” cannot be added.')
  })

  it('Escape empties the field and stays; empty, it goes on to the host', async () => {
    const host = vi.fn()
    const w = mount({
      render: () => h('div', { onKeydown: host }, [h(UiListField, { search: false })]),
    })
    const input = w.find('input')
    await input.setValue('Fru')
    key(input.element, 'Escape')
    await nextTick()
    expect(input.element.value).toBe('')
    expect(host).not.toHaveBeenCalled()
    key(input.element, 'Escape')
    expect(host).toHaveBeenCalledTimes(1)
  })
})

describe('UiListField — review follow-ups', () => {
  const plainRows = (names: string[]) => () =>
    names.map((n) => h(UiListItem, { size: 'sm', title: n }))

  it('search on with rows that are not buttons: Enter on an exact duplicate still refuses with a line, not silence', async () => {
    const onAdd = vi.fn()
    const w = mount(UiListField, {
      props: { existing: ['Apple'], onAdd },
      slots: { default: plainRows(['Apple']) },
    })
    await w.find('input').setValue('apple')
    key(w.find('input').element, 'Enter')
    await nextTick()
    expect(onAdd).not.toHaveBeenCalled()
    expect(w.find('[role="alert"]').text()).toBe('Apple is already in the list.')
    expect(w.emitted('taken')).toEqual([['Apple']])
  })

  it('pressing Enter twice while the add is on its way sends once', async () => {
    let done!: () => void
    const onAdd = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiListField, { props: { existing: [], onAdd } })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await input.setValue('Fish')
    key(input.element, 'Enter')
    expect(onAdd).toHaveBeenCalledTimes(1)
    done()
    await settle()
  })

  // The add is held, not the field: what is typed meanwhile stays and goes with the next Enter.
  it('typing goes on while the add is on its way, and the next Enter sends it', async () => {
    let done!: () => void
    const onAdd = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiListField, { props: { existing: [], onAdd } })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    expect(input.element.disabled).toBe(false)
    expect(input.element.readOnly).toBe(false)
    await input.setValue('Fish')
    done()
    await settle()
    expect(input.element.value).toBe('Fish')
    key(input.element, 'Enter')
    expect(onAdd).toHaveBeenLastCalledWith(['Fish'])
    w.unmount()
  })

  it('↑ from the first row wraps to the last choice', async () => {
    const w = mountList()
    const input = w.find('input')
    input.element.focus()
    await input.setValue('fr')
    await settle()
    key(input.element, 'ArrowUp')
    await settle()
    expect(w.find('[data-active]').exists()).toBe(false)
    expect(w.find('.sr-only[aria-live]').text()).toContain('Enter adds “fr”')
    w.unmount()
  })

  it('ariaLabel names the field over the placeholder', () => {
    const w = mount(UiListField, {
      props: { placeholder: 'Find or add a word', ariaLabel: 'Rules' },
    })
    expect(w.find('input').attributes('aria-label')).toBe('Rules')
  })

  it('Escape with only a line under the field clears the line and stops there', async () => {
    const host = vi.fn()
    const w = mount({
      render: () =>
        h('div', { onKeydown: host }, [
          h(UiListField, { existing: ['Fruit', 'Dairy'], search: false, onAdd: () => undefined }),
        ]),
    })
    const input = w.find('input')
    paste(input.element, 'fruit\ndairy')
    await nextTick()
    expect(input.element.value).toBe('')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    key(input.element, 'Escape')
    await nextTick()
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(host).not.toHaveBeenCalled()
  })

  it('reaching the limit one item at a time says the list is full and hands it the focus', async () => {
    const names = ['Fruit', 'Dairy']
    const w = mount(UiListField, {
      attachTo: document.body,
      props: {
        search: false,
        existing: names,
        limit: 3,
        onAdd: (items: string[]): Promise<void> => w.setProps({ existing: [...names, ...items] }),
      },
      slots: { default: plainRows(names) },
    })
    const input = w.find('input').element
    input.focus()
    await w.find('input').setValue('Bread')
    key(input, 'Enter')
    await settle()
    expect(w.find('input').exists()).toBe(false)
    const line = w.find('[role="alert"]')
    expect(line.text()).toBe('Limit reached: 3 items.')
    expect(document.activeElement).toBe(line.element)
    w.unmount()
  })

  it("a caller's aria-describedby survives beside the field's own note id", async () => {
    const w = mount(UiListField, {
      props: { existing: ['Apple'] },
      attrs: { 'aria-describedby': 'help' },
      slots: { default: plainRows(['Apple']) },
    })
    expect(w.find('input').attributes('aria-describedby')).toBe('help')
    await w.find('input').setValue('apple')
    key(w.find('input').element, 'Enter')
    await nextTick()
    const ids = w.find('input').attributes('aria-describedby')!.split(' ')
    expect(ids).toContain('help')
    expect(ids).toContain(w.find('[role="alert"]').attributes('id'))
  })

  it('a plain repeat keeps the resting glyph; the line says it', async () => {
    const w = mount(UiListField, {
      props: { existing: ['Apple'] },
      slots: { default: plainRows(['Apple']) },
    })
    await w.find('input').setValue('apple')
    key(w.find('input').element, 'Enter')
    await nextTick()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('input').element.previousElementSibling!.getAttribute('class')).toContain(
      'lucide-search',
    )
  })
})

describe('UiListField — review follow-ups, the field around it', () => {
  const input = (w: ReturnType<typeof mount>) => w.find('input').element as HTMLInputElement

  it("a caller's aria-invalid and aria-label survive where the field sets none", () => {
    const w = mount(UiListField, {
      props: { existing: NAMES },
      attrs: { 'aria-invalid': 'true', 'aria-label': 'Emails' },
    })
    expect(w.find('input').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-label': 'Emails',
    })
  })

  it('inside UiField group the input is named by the legend and described by the error', () => {
    const w = mount(UiField, {
      props: { label: 'Allowed domains', group: true, error: 'Add at least one' },
      slots: { default: () => h(UiListField, { existing: [], search: false }) },
    })
    const el = w.find('input')
    expect(el.attributes('aria-labelledby')).toBe(w.find('legend').attributes('id'))
    expect(el.attributes('aria-label')).toBeUndefined()
    expect(el.attributes('aria-describedby')).toContain(w.find('[role=alert]').attributes('id'))
    expect(el.attributes('aria-invalid')).toBe('true')
  })

  it('inside UiField the input takes the field id and invalid, and focusInvalid lands on it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h(UiField, { label: 'Tags', error: 'Add a tag' }, () =>
              h(UiListField, { existing: [], search: false }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(w.find('label').attributes('for')).toBe(w.find('input').attributes('id'))
    expect(warn.mock.calls.some(([m]) => String(m).includes('labels no element'))).toBe(false)
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('input').element)
    warn.mockRestore()
    w.unmount()
  })

  it('inside UiField the input does not claim aria-required', () => {
    const w = mount(UiField, {
      props: { label: 'Tags', group: true, required: true },
      slots: { default: () => h(UiListField, { existing: [], search: false }) },
    })
    expect(w.find('input').attributes('aria-required')).toBeUndefined()
    expect(w.find('legend .sr-only').text()).toBe('required')
  })

  it('a change the parent refuses puts the input back on the model', async () => {
    // The owner listens and keeps its own value: a refusal.
    const w = mount(UiListField, {
      props: { existing: NAMES, query: 'Fr', 'onUpdate:query': () => {} },
    })
    input(w).value = 'Fru'
    await w.find('input').trigger('input')
    await nextTick()
    expect(w.emitted('update:query')).toEqual([['Fru']])
    expect(input(w).value).toBe('Fr')
  })

  it('a form reset leaves the field on its model, DOM and rows agreeing', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiListField, { attachTo: form, props: { existing: NAMES, query: 'Fr' } })
    input(w).defaultValue = ''
    form.reset()
    await new Promise((r) => setTimeout(r))
    expect(input(w).value).toBe('Fr')
    w.unmount()
    form.remove()
  })

  it('the cross and Add, pressed by keyboard, keep the focus in the field', async () => {
    const onAdd = vi.fn()
    const w = mountList({
      search: false,
      existing: [],
      query: 'Tea',
      onAdd,
      'onUpdate:query': (v: string) => w.setProps({ query: v }),
    })
    const add = w
      .findAll('button')
      .find((b) => (b.attributes('aria-label') ?? '').startsWith('Add'))!
    await afterMount()
    ;(add.element as HTMLElement).focus()
    ;(add.element as HTMLButtonElement).click()
    await settle()
    expect(onAdd).toHaveBeenCalledWith(['Tea'])
    expect(document.activeElement).toBe(input(w))
    w.unmount()
    const c = mount(UiListField, {
      attachTo: document.body,
      props: {
        search: false,
        existing: [],
        query: 'Milk',
        'onUpdate:query': (v: string) => c.setProps({ query: v }),
      },
    })
    const cross = c.find('button[aria-label="Clear"]')
    await afterMount()
    ;(cross.element as HTMLElement).focus()
    ;(cross.element as HTMLButtonElement).click()
    await settle()
    expect(document.activeElement).toBe(input(c))
    c.unmount()
  })

  it('disabled holds the field, Add and the cross, and keeps the plate with a note', async () => {
    const onAdd = vi.fn()
    const w = mountList({ search: false, existing: [], query: 'Tea', onAdd, disabled: true })
    expect(input(w).disabled).toBe(true)
    expect(w.find('button[aria-label="Clear"]').exists()).toBe(false)
    expect(w.find('.ui-add-row').classes()).toContain('bg-disabled-bg')
    key(input(w), 'Enter')
    paste(input(w), 'a\nb')
    await settle()
    expect(onAdd).not.toHaveBeenCalled()
    w.unmount()
  })

  it('a failed request gives the text back when the owner binds the draft', async () => {
    let fail!: () => void
    const Host = defineComponent({
      setup() {
        const draft = ref('')
        return () =>
          h(UiListField, {
            search: false,
            existing: [],
            query: draft.value,
            'onUpdate:query': (v: string) => (draft.value = v),
            onAdd: () => new Promise((_, r) => (fail = () => r(new Error('offline')))),
          })
      },
    })
    const w = mount(Host, { attachTo: document.body })
    const field = w.find('input')
    await field.setValue('Tea')
    key(field.element, 'Enter')
    await settle()
    fail()
    await settle()
    expect(field.element.value).toBe('Tea')
    w.unmount()
  })

  it('an onAdd that throws gives the text back with a line', async () => {
    const w = mountList({
      search: false,
      existing: [],
      query: 'Tea',
      onAdd: () => {
        throw new Error('down')
      },
      'onUpdate:query': (v: string) => w.setProps({ query: v }),
    })
    key(input(w), 'Enter')
    await settle()
    expect(w.props('query')).toBe('Tea')
    expect(w.find('[role=alert]').text()).toContain('Tea')
    w.unmount()
  })

  it('a repeat inside one paste is pointed at, not dropped without a word', async () => {
    const onAdd = vi.fn()
    const w = mountList({ search: false, existing: [], onAdd })
    paste(input(w), 'tea\nTea\nmilk')
    await settle()
    expect(onAdd).toHaveBeenCalledWith(['tea', 'milk'])
    expect(w.emitted('taken')?.[0]).toEqual(['tea'])
    expect(w.find('[role=alert]').exists()).toBe(true)
    w.unmount()
  })

  it('the length cap holds after a fix that lengthens the item', async () => {
    const onAdd = vi.fn()
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: [], search: false, onAdd, fix: (s: string) => `+${s}-00` },
      attrs: { maxlength: 5 },
    })
    paste(input(w), '123\n456')
    await settle()
    expect(onAdd.mock.calls[0]![0].every((s: string) => s.length <= 5)).toBe(true)
    w.unmount()
  })

  it('Add stands on the xs step with a glyph, not a typed arrow', () => {
    const w = mountList({ search: false, existing: [], query: 'Tea' })
    const add = w
      .findAll('button')
      .find((b) => (b.attributes('aria-label') ?? '').startsWith('Add'))!
    expect(add.classes()).toContain('h-7')
    expect(add.find('svg').exists()).toBe(true)
    expect(add.text()).not.toContain('↵')
    w.unmount()
  })

  it('a typed repeat is said, not marked invalid', async () => {
    const w = mountList({
      search: false,
      existing: ['Tea'],
      query: 'tea',
      'onUpdate:query': (v: string) => w.setProps({ query: v }),
    })
    key(input(w), 'Enter')
    await settle()
    expect(w.find('[role=alert]').text()).toContain('Tea')
    expect(input(w).getAttribute('aria-invalid')).toBeNull()
    w.unmount()
  })
})

// A word typed through an input method is not an entry until it is picked: the Enter that picks
// it belongs to the input method.
describe('UiListField — a word in the making', () => {
  it('the Enter that confirms an IME composition adds nothing', async () => {
    const onAdd = vi.fn()
    const w = mountList({ onAdd })
    const input = w.find('input')
    input.element.focus()
    input.element.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    await input.setValue('とうきょう')
    key(input.element, 'Enter', { isComposing: true, keyCode: 229 })
    await nextTick()
    expect(onAdd).not.toHaveBeenCalled()
    expect(input.element.value).toBe('とうきょう')
    w.unmount()
  })
})

// Rows the slot draws: the parent filters by the query, as a host does.
const rowsOf =
  (names: string[], get: () => string[] = () => names) =>
  ({ query }: { query: string }) =>
    get()
      .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
      .map((n) => h(UiListItem, { key: n, as: 'button', size: 'sm', title: n }))

describe('UiListField — review follow-ups, before stable', () => {
  it('the rows change in place (splice): the removed row’s neighbor takes the focus', async () => {
    const items = ref(['a@x.test', 'b@x.test', 'c@x.test'])
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(UiListField, { search: false, existing: items.value }, () =>
            items.value.map((name) =>
              h(
                UiListItem,
                { key: name, size: 'sm', title: name },
                {
                  actions: () =>
                    h('button', {
                      'aria-label': `Remove ${name}`,
                      onClick: () => items.value.splice(items.value.indexOf(name), 1),
                    }),
                },
              ),
            ),
          ),
      }),
      { attachTo: document.body },
    )
    const remove = (n: string) =>
      document.querySelector<HTMLButtonElement>(`[aria-label="Remove ${n}"]`)!
    remove('b@x.test').focus()
    remove('b@x.test').click()
    await settle()
    expect(document.activeElement).toBe(remove('c@x.test'))
    w.unmount()
  })

  it('a row that arrives first, in place, takes the band, and the hint names it', async () => {
    const names = ref(['Ab 1', 'Ab 2'])
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: names.value },
      slots: { default: rowsOf([], () => names.value) },
    })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('ab')
    await settle()
    names.value.unshift('Ab 0')
    await settle()
    expect(w.find('[data-active]').text().trim()).toBe('Ab 0')
    expect(w.find('.sr-only[aria-live]').text()).toBe('Enter opens Ab 0')
    w.unmount()
  })

  it('rows that arrive after the query still take the band: Enter opens the first match, adds nothing', async () => {
    const found = ref<string[]>([])
    const opened = vi.fn()
    const onAdd = vi.fn()
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: ['Fruit', 'Frozen food'], onAdd },
      slots: {
        default: () =>
          found.value.map((n) =>
            h(UiListItem, { key: n, as: 'button', size: 'sm', title: n, onClick: () => opened(n) }),
          ),
      },
    })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('fr')
    await settle()
    found.value = ['Fruit', 'Frozen food']
    await settle()
    key(input.element, 'Enter')
    await settle()
    expect([opened.mock.calls, onAdd.mock.calls]).toEqual([[['Fruit']], []])
    w.unmount()
  })

  it('the Enter hint follows the band when the first row changes and the count does not', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: ['Ab', 'Bc', 'Cd'] },
      slots: { default: rowsOf(['Ab', 'Bc', 'Cd']) },
    })
    const input = w.find('input')
    await input.setValue('b')
    await settle()
    await input.setValue('c')
    await settle()
    expect([w.find('[data-active]').text().trim(), w.find('.sr-only[aria-live]').text()]).toEqual([
      'Bc',
      'Enter opens Bc',
    ])
    w.unmount()
  })

  it('the Enter hint names a row by its title, not by every word in it', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: ['Footwear'] },
      slots: {
        default: () => [
          h(UiListItem, { as: 'button', size: 'sm', title: 'Footwear', description: '12 records' }),
        ],
      },
    })
    await w.find('input').setValue('foot')
    await settle()
    expect(w.find('.sr-only[aria-live]').text()).toBe('Enter opens Footwear')
    w.unmount()
  })

  it('a line that says Enter tries again is true: after a failure the field holds the failed text', async () => {
    let fail!: () => void
    const onAdd = vi.fn(() => new Promise((_, r) => (fail = () => r(new Error('x')))))
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: [], search: false, onAdd },
    })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    await input.setValue('Fish')
    fail()
    await settle()
    expect([input.element.value, w.find('[role=alert]').text()]).toEqual([
      'Fish',
      'Could not add Meat.',
    ])
    w.unmount()
  })

  it('a pasted list that fails does not say Enter tries again over an empty field', async () => {
    let fail!: () => void
    const onAdd = vi.fn(() => new Promise((_, r) => (fail = () => r(new Error('x')))))
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: ['Fruit'], search: false, onAdd },
    })
    paste(w.find('input').element, 'Meat\nFruit')
    await nextTick()
    fail()
    await settle()
    expect([w.find('input').element.value, w.find('[role=alert]').text()]).toEqual([
      '',
      'Could not add Meat.',
    ])
    w.unmount()
  })

  it('a column pasted while an add is on its way is not swallowed: it waits and goes in as a list', async () => {
    let done!: () => void
    const onAdd = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: [], search: false, onAdd },
    })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    const e = paste(input.element, 'a@x.test\nb@x.test')
    expect(e.defaultPrevented).toBe(true)
    done()
    await settle()
    expect(onAdd).toHaveBeenLastCalledWith(['a@x.test', 'b@x.test'])
    w.unmount()
  })

  it('a list that fills while a line stands says it is full, as well as what the line said', async () => {
    const names = ['a', 'b']
    const w = mount(UiListField, {
      attachTo: document.body,
      props: {
        search: false,
        existing: names,
        limit: 3,
        fix: (s: string) => s.toLowerCase(),
        onAdd: (items: string[]): Promise<void> => w.setProps({ existing: [...names, ...items] }),
      },
    })
    await w.find('input').setValue('C')
    key(w.find('input').element, 'Enter')
    await settle()
    expect(w.find('input').exists()).toBe(false)
    expect(w.find('[role=alert]').text()).toContain('Limit reached: 3 items.')
    w.unmount()
  })

  it('a form reset puts the model back into a field that was full when it mounted', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiListField, {
      attachTo: form,
      props: {
        search: false,
        existing: ['a'],
        limit: 1,
        query: 'draft',
        'onUpdate:query': () => {},
      },
    })
    await w.setProps({ existing: [] })
    await settle()
    const input = w.find('input').element as HTMLInputElement
    input.defaultValue = ''
    form.reset()
    await new Promise((r) => setTimeout(r, 5))
    expect(input.value).toBe('draft')
    w.unmount()
    form.remove()
  })

  it('a full list with a draft left over shows its rows whole and never says nothing matches', () => {
    const w = mount(UiListField, {
      props: { existing: ['a', 'b', 'c'], limit: 3, query: 'zzz' },
      slots: { default: rowsOf(['a', 'b', 'c']) },
    })
    expect(w.findAll('[data-row]').length).toBe(3)
    expect(w.text()).not.toContain('Nothing matches.')
  })

  it('the caller’s type and autocomplete reach the input, as the doc says', () => {
    const w = mount(UiListField, { attrs: { type: 'email', autocomplete: 'email' } })
    expect([
      w.find('input').attributes('type'),
      w.find('input').attributes('autocomplete'),
    ]).toEqual(['email', 'email'])
  })

  it('the band is the panel list’s active row: the bar of the brand on the start edge, as in every list in a panel', () => {
    const w = mount(UiListField, { props: { existing: ['a'] }, slots: { default: rowsOf(['a']) } })
    const list = w.find('[data-grani][class*="data-active"]')
    const cls = list.exists() ? list.classes().join(' ') : w.html()
    for (const c of PANEL_LIST_ACTIVE.split(' ')) expect(cls).toContain(c)
  })

  it('no Add while disabled: the field, the cross and Add are all held', async () => {
    const w = mount(UiListField, {
      props: { search: false, existing: [], disabled: true, query: 'Meat' },
    })
    expect([addRow(w), w.find('button[aria-label="Clear"]').exists()]).toEqual([undefined, false])
  })

  it('when the list has room again, a focus on the line that said it was full goes back into the field', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { search: false, existing: ['a', 'b'], limit: 2 },
    })
    ;(w.find('[role=alert]').element as HTMLElement).focus()
    await w.setProps({ existing: ['a'] })
    await settle()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('no line under the field when nothing stands under it: the card’s frame is the only edge', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: NAMES },
      slots: { default: rowsOf(NAMES) },
    })
    await w.find('input').setValue('zz')
    await settle()
    expect(w.find('.ui-add-row').classes()).not.toContain('border-b')
    await w.find('input').setValue('fr')
    await settle()
    expect(w.find('.ui-add-row').classes()).toContain('border-b')
    w.unmount()
  })
})

describe('UiListField — a draft beside the form, an exact name', () => {
  // A draft the field refused is said to a screen reader as invalid, yet it is not the form's to fix.
  const refuse = async (input: HTMLInputElement, text = 'foo') => {
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    key(input, 'Enter')
    await settle()
  }
  const isEmail = (s: string) => (s.includes('@') ? undefined : 'Not an email')

  it('a refused draft is not the form’s refusal: Save sends once, the focus stays on Save', async () => {
    const onSubmit = vi.fn()
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Invite', open: true, form: true, onSubmit },
      slots: {
        default: () => h(UiListField, { search: false, existing: [], check: isEmail }),
        footer: () => h(UiButton, { type: 'submit' }, () => 'Save'),
      },
    })
    await settle()
    const input = document.body.querySelector('input')!
    await refuse(input)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const save = document.body.querySelector<HTMLButtonElement>('button[type="submit"]')!
    save.focus()
    save.click()
    await settle()
    expect(document.activeElement).toBe(save)
    save.click()
    await settle()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('the field’s own error is the form’s: focusInvalid takes the focus to the field', async () => {
    const w = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Guests', error: 'Invite at least one person' },
      slots: { default: () => h(UiListField, { search: false, existing: [], check: isEmail }) },
    })
    const input = w.find('input').element
    await refuse(input)
    ;(document.body as HTMLElement).focus()
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(input)
    w.unmount()
  })

  it('a refused draft alone takes no focus from focusInvalid', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { search: false, existing: [], check: isEmail },
    })
    const input = w.find('input').element
    await refuse(input)
    input.blur()
    expect(focusInvalid(w.element as HTMLElement)).toBe(false)
    expect(document.activeElement).not.toBe(input)
    w.unmount()
  })

  it('the band starts on the row named exactly as typed: “fruit” opens Fruit, not Fruit juice above it', async () => {
    const opened = vi.fn()
    const names = ['Fruit juice', 'Fruit', 'Dairy']
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: names },
      slots: {
        default: ({ query }: { query: string }) =>
          names
            .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
            .map((n) =>
              h(UiListItem, {
                key: n,
                as: 'button',
                size: 'sm',
                title: n,
                onClick: () => opened(n),
              }),
            ),
      },
    })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('fruit')
    await settle()
    expect(band(w)).toBe('Fruit')
    key(input.element, 'Enter')
    expect(opened).toHaveBeenLastCalledWith('Fruit')
    // An arrow is the person's choice, and Enter follows it.
    key(input.element, 'ArrowUp')
    await settle()
    expect(band(w)).toBe('Fruit juice')
    key(input.element, 'Enter')
    expect(opened).toHaveBeenLastCalledWith('Fruit juice')
    w.unmount()
  })
})

describe('UiListField — a list waiting behind an add', () => {
  // A request fails while a pasted list waits behind it; the owner binds the draft, or not.
  const failThenList = async (bound: boolean) => {
    let fail!: () => void
    const calls: string[][] = []
    const onAdd = vi.fn((items: string[]) => {
      calls.push(items)
      return calls.length === 1
        ? new Promise((_, r) => (fail = () => r(new Error('x'))))
        : undefined
    })
    const Host = defineComponent({
      setup() {
        const draft = ref('')
        return () =>
          h(UiListField, {
            search: false,
            existing: [],
            onAdd,
            ...(bound
              ? { query: draft.value, 'onUpdate:query': (v: string) => (draft.value = v) }
              : {}),
          })
      },
    })
    const w = mount(Host, { attachTo: document.body })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    paste(input.element as HTMLInputElement, 'a\nb')
    await nextTick()
    fail()
    await settle()
    expect(calls).toEqual([['Meat'], ['a', 'b']])
    expect((input.element as HTMLInputElement).value).toBe('Meat')
    expect(w.find('[role=alert]').text()).toContain('Could not add Meat')
    w.unmount()
  }
  it('a list waiting behind a failing add: the failure is still said, the failed text is back (draft bound)', () =>
    failThenList(true))
  it('a list waiting behind a failing add: the failure is still said, the failed text is back (draft unbound)', () =>
    failThenList(false))

  it('a list waiting behind an add is not sent after the field was disabled', async () => {
    let done!: () => void
    const onAdd = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { search: false, existing: [], onAdd },
    })
    const input = w.find('input')
    await input.setValue('Meat')
    key(input.element, 'Enter')
    await nextTick()
    paste(input.element as HTMLInputElement, 'a\nb')
    await nextTick()
    await w.setProps({ disabled: true })
    done()
    await settle()
    expect(onAdd).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('the caller’s own aria-invalid is the form’s even when a draft is refused too', async () => {
    const w = mount(UiListField, {
      attachTo: document.body,
      props: {
        search: false,
        existing: [],
        check: (s: string) => (s.includes('@') ? undefined : 'no'),
      },
      attrs: { 'aria-invalid': 'true' },
    })
    const input = w.find('input').element
    input.value = 'foo'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    key(input, 'Enter')
    await settle()
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    w.unmount()
  })

  it('the Enter hint follows rows whose text changes in place (unkeyed rows, no highlight)', async () => {
    const names = ['Ab', 'Bc', 'Cd']
    const w = mount(UiListField, {
      attachTo: document.body,
      props: { existing: names },
      slots: {
        default: ({ query }: { query: string }) =>
          names
            .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
            .map((n) => h(UiListItem, { as: 'button', size: 'sm', title: n })),
      },
    })
    const input = w.find('input')
    input.element.focus()
    await input.setValue('b')
    await settle()
    await input.setValue('c')
    await settle()
    expect([band(w), w.find('.sr-only[aria-live]').text()]).toEqual(['Bc', 'Enter opens Bc'])
    w.unmount()
  })
})
