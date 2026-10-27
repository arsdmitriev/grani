import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { SelectItem, SelectOption, SelectValue } from '../types/ui'
import UiField from './UiField.vue'
import UiSelect from './UiSelect.vue'
import UiTruncate from './UiTruncate.vue'
import UiModal from './UiModal.vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { focusInvalid } from '../utils/focusInvalid'

const ITEMS: SelectItem[] = [
  { value: 'gbp', label: 'British pound' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro', disabled: true },
  { value: 'pln', label: 'Polish zloty' },
]

const GROUPED: SelectItem[] = [
  {
    label: 'Europe',
    options: [
      { value: 'eur', label: 'Euro' },
      { value: 'pln', label: 'Polish zloty' },
    ],
  },
  { label: 'Americas', options: [{ value: 'usd', label: 'US dollar' }] },
]

// What `update:modelValue` carries in either mode: a value, the picks of a multiple select, or null.
type Picked = SelectValue | SelectValue[] | null

const base = { modelValue: null, items: ITEMS, ariaLabel: 'Currency' }
const mountSelect = (props: Record<string, unknown> = {}) =>
  mount(UiSelect, { props: { ...base, ...props }, attachTo: document.body })
const trigger = (w: ReturnType<typeof mount>) => w.find('[role=combobox]')
// What the trigger reads, without the hidden labels that hold its width.
const shown = (w: ReturnType<typeof mount>) => {
  const el = trigger(w).element.cloneNode(true) as HTMLElement
  el.querySelectorAll('[data-sizer]').forEach((s) => s.remove())
  return (el.textContent ?? '').trim()
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[role=option]')

let mounted: ReturnType<typeof mount>[] = []
const keep = <T extends ReturnType<typeof mount>>(w: T) => (mounted.push(w), w)
afterEach(() => {
  for (const w of mounted) w.unmount()
  mounted = []
})

describe('UiSelect — trigger', () => {
  it('shows the placeholder while empty and the label of the selected option', async () => {
    const w = keep(mountSelect())
    expect(shown(w)).toBe('Select…')
    expect(trigger(w).find('span').classes()).toContain('text-placeholder')
    await w.setProps({ modelValue: 'usd' })
    expect(shown(w)).toBe('US dollar')
    expect(trigger(w).find('span').classes()).toContain('text-fg')
  })

  it('is a closed combobox at rest and stands on the control ladder', () => {
    const w = keep(mountSelect())
    expect(trigger(w).attributes()).toMatchObject({
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-label': 'Currency',
      type: 'button',
    })
    expect(w.classes()).toContain('h-9')
    expect(keep(mountSelect({ size: 'md' })).classes()).toContain('h-11')
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })

  it('class lands on the capsule, other attributes on the trigger; the value goes into a hidden input for forms', () => {
    const w = keep(
      mount(UiSelect, {
        props: { ...base, name: 'currency', modelValue: 'gbp' },
        attrs: { class: 'w-64', 'data-testid': 'cur' },
      }),
    )
    expect(w.classes()).toContain('w-64')
    expect(w.attributes('data-testid')).toBeUndefined()
    expect(trigger(w).attributes('data-testid')).toBe('cur')
    expect(w.find('input[type=hidden]').attributes()).toMatchObject({
      name: 'currency',
      value: 'gbp',
    })
  })

  it('disabled: the button is inert and the capsule takes the muted chrome', async () => {
    const w = keep(mountSelect({ disabled: true, modelValue: 'gbp', clearable: true }))
    expect((trigger(w).element as HTMLButtonElement).disabled).toBe(true)
    expect(w.classes()).toContain('bg-disabled-bg')
    expect(trigger(w).find('span').classes()).toContain('text-disabled-fg')
    expect(w.find('button[aria-label="Clear selection"]').exists()).toBe(false)
    await trigger(w).trigger('click')
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })

  it('invalid: red border, aria-invalid on the button', () => {
    const w = keep(mountSelect({ invalid: true }))
    expect(w.classes()).toContain('border-danger-border')
    expect(w.attributes('data-invalid')).toBe('true')
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
  })
})

describe('UiSelect — list', () => {
  it('a click opens the listbox with every option, a disabled one marked', async () => {
    const w = keep(mountSelect({ modelValue: 'usd' }))
    await trigger(w).trigger('click')
    expect(trigger(w).attributes('aria-expanded')).toBe('true')
    const opts = options(w)
    expect(opts.map((o) => o.text())).toEqual([
      'British pound',
      'US dollar',
      'Euro',
      'Polish zloty',
    ])
    expect(opts[1]!.attributes('aria-selected')).toBe('true')
    expect(opts[2]!.attributes('aria-disabled')).toBe('true')
    expect(opts[2]!.classes()).toContain('text-disabled-fg')
  })

  it('a click on an option emits it and closes; a disabled option does nothing', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('click')
    await options(w)[2]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('[role=listbox]').exists()).toBe(true)
    await options(w)[3]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['pln']])
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })

  it('groups render a heading that is not an option', async () => {
    const w = keep(mountSelect({ items: GROUPED }))
    await trigger(w).trigger('click')
    const headings = w.findAll('[role=listbox] [role=presentation]')
    expect(headings.map((h) => h.text())).toEqual(['Europe', 'Americas'])
    expect(options(w)).toHaveLength(3)
  })

  it('the selected option is highlighted on open and the button points at it', async () => {
    const w = keep(mountSelect({ modelValue: 'pln' }))
    await trigger(w).trigger('click')
    const opt = options(w)[3]!
    expect(opt.classes()).toContain('bg-surface-muted')
    expect(trigger(w).attributes('aria-activedescendant')).toBe(opt.attributes('id'))
  })

  it('clearable: the clear button sets null and does not open the list', async () => {
    const w = keep(mountSelect({ modelValue: 'gbp', clearable: true }))
    await w.find('button[aria-label="Clear selection"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(
      keep(mountSelect({ clearable: true }))
        .find('button[aria-label="Clear selection"]')
        .exists(),
    ).toBe(false)
  })
})

describe('UiSelect — keyboard', () => {
  it('ArrowDown opens on the first enabled option, arrows skip a disabled one, Enter picks', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(options(w)[0]!.classes()).toContain('bg-surface-muted')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(options(w)[3]!.classes()).toContain('bg-surface-muted')
    await trigger(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['pln']])
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })

  it('Home and End jump, Escape closes and returns focus to the trigger', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('keydown', { key: 'End' })
    expect(options(w)[3]!.classes()).toContain('bg-surface-muted')
    await trigger(w).trigger('keydown', { key: 'Home' })
    expect(options(w)[0]!.classes()).toContain('bg-surface-muted')
    await trigger(w).trigger('keydown', { key: 'Escape' })
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('inside a form Enter picks and the form is not submitted', async () => {
    const submitted = vi.fn()
    const w = keep(
      mount(
        defineComponent(() => () => h('form', { onSubmit: submitted }, [h(UiSelect, base)])),
        { attachTo: document.body },
      ),
    )
    const select = w.findComponent(UiSelect)
    // An Enter the list took is prevented: the browser neither clicks nor submits with it.
    const enter = () => {
      const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      trigger(w).element.dispatchEvent(e)
      return e
    }
    expect(enter().defaultPrevented).toBe(true)
    await nextTick()
    expect(enter().defaultPrevented).toBe(true)
    await nextTick()
    expect(select.emitted('update:modelValue')).toEqual([['gbp']])
    expect(submitted).not.toHaveBeenCalled()
  })

  it('a letter jumps to the first label with that prefix', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await trigger(w).trigger('keydown', { key: 'p' })
    expect(options(w)[3]!.classes()).toContain('bg-surface-muted')
  })

  it('the type-ahead buffer does not survive a close', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await trigger(w).trigger('keydown', { key: 'p' })
    await trigger(w).trigger('keydown', { key: 'Escape' })
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await trigger(w).trigger('keydown', { key: 'u' })
    expect(options(w)[1]!.classes()).toContain('bg-surface-muted')
  })

  it('a pointer down outside closes the list', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })
})

describe('UiSelect — searchable', () => {
  it('focuses the filter, narrows by label, and says when nothing matches', async () => {
    const w = keep(mountSelect({ searchable: true, items: GROUPED }))
    await trigger(w).trigger('click')
    const search = w.find('[data-ui-panel] input')
    expect(document.activeElement).toBe(search.element)
    await search.setValue('zl')
    expect(options(w).map((o) => o.text())).toEqual(['Polish zloty'])
    expect(w.findAll('[role=listbox] [role=presentation]').map((h) => h.text())).toEqual(['Europe'])
    await search.setValue('yen')
    expect(options(w)).toHaveLength(0)
    expect(w.find('[data-note]').text()).toContain('No matches')
  })

  it('Enter in the filter picks the highlighted match, Space types', async () => {
    const w = keep(mountSelect({ searchable: true }))
    await trigger(w).trigger('click')
    const search = w.find('[data-ui-panel] input')
    await search.setValue('pol')
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    search.element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    await search.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['pln']])
  })
})

describe('UiSelect — review follow-ups', () => {
  it('Home and End in the filter input move the caret, not the list', async () => {
    const w = keep(mountSelect({ searchable: true }))
    await trigger(w).trigger('click')
    const search = w.find('[data-ui-panel] input')
    const ev = new KeyboardEvent('keydown', { key: 'End', cancelable: true, bubbles: true })
    search.element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(options(w)[0]!.classes()).toContain('bg-surface-muted')
    expect(search.attributes('role')).toBeUndefined()
  })

  it('Tab from the filter closes and puts focus back on the trigger', async () => {
    const w = keep(mountSelect({ searchable: true }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').trigger('keydown', { key: 'Tab' })
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('the same value in two groups renders both rows', async () => {
    const w = keep(
      mountSelect({
        items: [
          { label: 'Cards', options: [{ value: 'other', label: 'Other card' }] },
          { label: 'Cash', options: [{ value: 'other', label: 'Other cash' }] },
        ],
      }),
    )
    await trigger(w).trigger('click')
    expect(options(w).map((o) => o.text())).toEqual(['Other card', 'Other cash'])
  })

  it('searchable and multiple: a pick keeps the list and the filter open', async () => {
    const w = keep(mountSelect({ searchable: true, multiple: true, modelValue: [] }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('dollar')
    await options(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([['usd']])
    expect(w.find('[data-ui-panel] input').exists()).toBe(true)
  })

  it('the clear button beside an open list clears and closes', async () => {
    const w = keep(mountSelect({ modelValue: 'gbp', clearable: true }))
    await trigger(w).trigger('click')
    await w.find('button[aria-label="Clear selection"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    expect(w.find('[role=listbox]').exists()).toBe(false)
  })
})

describe('UiSelect — multiple', () => {
  it('counts the picks in the trigger, lists them as tags below, and marks the rows', async () => {
    const w = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd', 'pln'] }))
    expect(shown(w)).toContain('2 selected')
    expect(w.findAll('[data-tag]').map((t) => t.text())).toEqual(['US dollar', 'Polish zloty'])
    expect(w.find('ul[aria-label="Selected"]').exists()).toBe(true)
    await trigger(w).trigger('click')
    expect(w.find('[role=listbox]').attributes('aria-multiselectable')).toBe('true')
    expect(options(w).map((o) => o.attributes('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
      'true',
    ])
  })

  it('a pick toggles the value and keeps the list open', async () => {
    const w = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd'] }))
    await trigger(w).trigger('click')
    await options(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([['usd', 'gbp']])
    await options(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    expect(w.find('[role=listbox]').exists()).toBe(true)
  })

  it('clear resets to an empty array; one hidden input per value', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['usd', 'pln'],
        clearable: true,
        name: 'cur',
      }),
    )
    expect(w.findAll('input[type=hidden]').map((i) => i.attributes('value'))).toEqual([
      'usd',
      'pln',
    ])
    await w.find('button[aria-label="Clear selection"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[[]]])
  })
})

describe('UiSelect — picks drawn by the app', () => {
  const withPicks = (modelValue: string[], disabled = false) => {
    const value = ref<SelectValue[]>(modelValue)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiSelect,
            {
              ...base,
              multiple: true,
              disabled,
              placeholder: 'Add a currency',
              modelValue: value.value,
              'onUpdate:modelValue': (v: Picked) => (value.value = v as SelectValue[]),
            },
            {
              picks: ({
                options,
                remove,
                disabled: off,
              }: {
                options: SelectOption[]
                remove: (o: SelectOption) => void
                disabled: boolean
              }) =>
                options.map((o) =>
                  h('p', { key: o.value, 'data-row': '', 'data-off': off || undefined }, [
                    o.label,
                    h('button', { 'aria-label': `Remove ${o.label}`, onClick: () => remove(o) }),
                  ]),
                ),
            },
          ),
      }),
      { attachTo: document.body },
    )
    return { w: keep(w), value }
  }
  const rows = (w: ReturnType<typeof mount>) =>
    w.findAll('[data-picks] [data-row]').map((r) => r.text())

  it('draws the picks in the order they were picked, the field a search that keeps its placeholder', async () => {
    const { w } = withPicks(['pln', 'gbp'])
    expect(rows(w)).toEqual(['Polish zloty', 'British pound'])
    expect(shown(w)).toContain('Add a currency')
    expect(w.find('[data-picks]').attributes('role')).toBe('group')
    expect(w.find('[data-tag]').exists()).toBe(false)
    await trigger(w).trigger('click')
    await options(w)[1]!.trigger('click')
    expect(rows(w)).toEqual(['Polish zloty', 'British pound', 'US dollar'])
  })

  it('a disabled select takes nothing back, and tells the rows it is disabled', async () => {
    const { w, value } = withPicks(['pln', 'gbp'], true)
    await w.find('[aria-label="Remove Polish zloty"]').trigger('click')
    await nextTick()
    expect(value.value).toEqual(['pln', 'gbp'])
    expect(rows(w)).toEqual(['Polish zloty', 'British pound'])
    expect(w.find('[data-picks] [data-off]').exists()).toBe(true)
  })

  it('remove takes the pick back and puts the focus on the field', async () => {
    const { w, value } = withPicks(['pln', 'gbp'])
    await w.find('[aria-label="Remove Polish zloty"]').trigger('click')
    await nextTick()
    await nextTick()
    expect(value.value).toEqual(['gbp'])
    expect(rows(w)).toEqual(['British pound'])
    expect(document.activeElement).toBe(trigger(w).element)
  })
})

describe('UiSelect — inside UiField', () => {
  const Form = defineComponent({
    props: { error: { type: String, default: undefined } },
    setup(props) {
      return () =>
        h(UiField, { label: 'Currency', required: true, error: props.error }, () =>
          h(UiSelect, { modelValue: null, items: ITEMS }),
        )
    },
  })

  it('takes id, required, error and description from the field', async () => {
    const w = keep(mount(Form, { props: { error: 'Choose one' }, attachTo: document.body }))
    const button = trigger(w)
    expect(w.find('label').attributes('for')).toBe(button.attributes('id'))
    expect(button.attributes('aria-required')).toBe('true')
    expect(button.attributes('aria-invalid')).toBe('true')
    expect(button.attributes('aria-describedby')).toBe(w.find('[role=alert]').attributes('id'))
    expect(w.find('.ui-capsule').attributes('data-invalid')).toBe('true')
    await button.trigger('click')
    expect(w.find('[role=listbox]').attributes('aria-labelledby')).toBe(
      w.find('label').attributes('id'),
    )
  })
})

describe('UiSelect — fetcher', () => {
  const CITIES = [
    { value: 'lisbon', label: 'Lisbon' },
    { value: 'madrid', label: 'Madrid' },
    { value: 'warsaw', label: 'Warsaw' },
  ]
  const search = (q: string) =>
    CITIES.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
  const flush = () => new Promise((r) => setTimeout(r, 0))

  afterEach(() => vi.useRealTimers())

  it('asks the server on open with an empty query, then 250 ms after the last key', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async (q: string) => search(q))
    const w = keep(mountSelect({ items: undefined, fetcher }))
    await trigger(w).trigger('click')
    expect(fetcher).toHaveBeenCalledWith('')
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w)).toHaveLength(3)
    const input = w.find('[data-ui-panel] input')
    expect(input.exists()).toBe(true)
    await input.setValue('ma')
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(249)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetcher).toHaveBeenLastCalledWith('ma')
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).toEqual(['Madrid'])
  })

  it('shows Searching while waiting, No options after an empty answer, and a failure', async () => {
    let resolve!: (v: typeof CITIES) => void
    const fetcher = vi.fn(() => new Promise<typeof CITIES>((r) => (resolve = r)))
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    expect(w.find('[role=listbox]').attributes('aria-busy')).toBe('true')
    expect(w.findAll('[role=listbox] [data-skeleton]')).toHaveLength(6)
    expect(w.find('[role=listbox]').text()).toBe('')
    resolve([])
    await flush()
    expect(w.find('[data-note]').text()).toContain('No options')
    const bad = keep(mountSelect({ fetcher: vi.fn(async () => Promise.reject(new Error('down'))) }))
    await trigger(bad).trigger('click')
    await flush()
    expect(bad.find('[data-note]').text()).toContain('Could not load the options')
  })

  it('a server list keeps the height it reached while open, and lets it go on close', async () => {
    vi.useFakeTimers()
    // No layout here: a list is as tall as its rows, 32px each.
    const tall = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'listbox' ? this.children.length * 32 : 0
      })
    const seven = Array.from({ length: 7 }, (_, i) => ({ value: `c${i}`, label: `City ${i}` }))
    // The first empty query is answered by hand, every later one never: the list waits on its rows.
    let answer: ((v: typeof seven) => void) | undefined
    const fetcher = vi.fn((q: string) =>
      q ? Promise.resolve([]) : new Promise<typeof seven>((r) => (answer ??= r)),
    )
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    const list = () => w.find('[role=listbox]').element as HTMLElement
    expect(list().style.minHeight).toBe('192px')
    answer!(seven)
    await vi.advanceTimersByTimeAsync(0)
    expect(list().style.minHeight).toContain('224px')
    await w.find('[data-ui-panel] input').setValue('zz')
    await vi.advanceTimersByTimeAsync(250)
    expect(w.find('[data-note]').text()).toContain('No matches')
    expect((w.find('[data-note]').element as HTMLElement).style.minHeight).toBe('224px')
    await w.find('[data-ui-panel] input').setValue('')
    await w.find('[data-ui-panel] input').trigger('keydown', { key: 'Escape' })
    expect(w.find('[role=listbox]').exists()).toBe(false)
    await trigger(w).trigger('click')
    expect(list().style.minHeight).toBe('192px')
    tall.mockRestore()
  })

  it('a failed search asks again with Enter or Try again', async () => {
    vi.useFakeTimers()
    let fails = true
    const fetcher = vi.fn(async () => {
      if (fails) throw new Error('down')
      return CITIES
    })
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('[data-note]').text()).toContain('Could not load the options')
    expect(w.find('[role=listbox] [data-note]').exists()).toBe(false)
    const filter = w.find('[data-ui-panel] input')
    await filter.trigger('keydown', { key: 'Enter' })
    await vi.advanceTimersByTimeAsync(0)
    // The focus staying in the filter is the browser's to show: the stubbed teleport here remakes it.
    expect(fetcher).toHaveBeenCalledTimes(2)
    fails = false
    await w.find('[data-note] button').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(options(w)).toHaveLength(CITIES.length)
    expect(w.find('[data-note]').exists()).toBe(false)
  })

  it('a search that matches nothing offers Clear search, which empties the filter', async () => {
    const w = keep(mountSelect({ searchable: true }))
    await trigger(w).trigger('click')
    const filter = w.find('[data-ui-panel] input')
    const all = options(w).length
    await filter.setValue('zzz')
    expect(w.find('[data-note]').text()).toContain('No matches')
    await w.find('[data-note] button').trigger('click')
    // Read afresh: this DOM draws the panel anew as the status words change, which a browser does
    // not; the focus kept in the filter is proven in a real browser by the browser tests of the
    // source repository.
    expect((w.find('[data-ui-panel] input').element as HTMLInputElement).value).toBe('')
    expect(options(w)).toHaveLength(all)
  })

  it('the held height never passes the cap of five rows and a half', async () => {
    vi.useFakeTimers()
    // No layout here: every row is 32px tall and stands one under another.
    const tall = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'listbox' ? this.children.length * 32 : 32
      })
    const top = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return [...(this.parentElement?.children ?? [])].indexOf(this) * 32
    })
    const ten = Array.from({ length: 10 }, (_, i) => ({ value: `c${i}`, label: `City ${i}` }))
    const w = keep(mountSelect({ fetcher: vi.fn(async () => ten) }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    const list = w.find('[role=listbox]').element as HTMLElement
    expect(list.style.minHeight).toContain('min(')
    expect(list.style.minHeight).toContain('176px')
    tall.mockRestore()
    top.mockRestore()
  })

  it('a late answer to an older query is dropped', async () => {
    vi.useFakeTimers()
    const pending: Record<string, (v: typeof CITIES) => void> = {}
    const fetcher = vi.fn((q: string) => new Promise<typeof CITIES>((r) => (pending[q] = r)))
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('w')
    await vi.advanceTimersByTimeAsync(250)
    pending['']!(CITIES)
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w)).toHaveLength(0)
    pending['w']!([CITIES[2]!])
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).toEqual(['Warsaw'])
  })

  it('an answer to the old query that lands within the wait for the new one is dropped', async () => {
    vi.useFakeTimers()
    const pending: Record<string, (v: typeof CITIES) => void> = {}
    const fetcher = vi.fn((q: string) => new Promise<typeof CITIES>((r) => (pending[q] = r)))
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('warsaw')
    await vi.advanceTimersByTimeAsync(50)
    expect(fetcher).not.toHaveBeenCalledWith('warsaw')
    pending['']!([CITIES[0]!])
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).not.toContain('Lisbon')
    expect(w.find('[role=listbox]').attributes('aria-busy')).toBe('true')
    await vi.advanceTimersByTimeAsync(200)
    expect(fetcher).toHaveBeenLastCalledWith('warsaw')
    pending['warsaw']!([CITIES[2]!])
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).toEqual(['Warsaw'])
    expect(w.find('[role=listbox]').attributes('aria-busy')).toBeUndefined()
  })

  it('an answer to the old query that lands after the new search starts is dropped', async () => {
    vi.useFakeTimers()
    const pending: Record<string, (v: typeof CITIES) => void> = {}
    const fetcher = vi.fn((q: string) => new Promise<typeof CITIES>((r) => (pending[q] = r)))
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('warsaw')
    await vi.advanceTimersByTimeAsync(250)
    expect(fetcher).toHaveBeenLastCalledWith('warsaw')
    pending['']!([CITIES[0]!])
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).not.toContain('Lisbon')
    pending['warsaw']!([CITIES[2]!])
    await vi.advanceTimersByTimeAsync(0)
    expect(options(w).map((o) => o.text())).toEqual(['Warsaw'])
  })

  it('while a new query waits, the previous options stay in view, dimmed and busy', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async (q: string) => search(q))
    const w = keep(mountSelect({ fetcher }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    const list = () => w.find('[role=listbox]')
    expect(list().classes()).not.toContain('opacity-60')
    await w.find('[data-ui-panel] input').setValue('ma')
    expect(options(w)).toHaveLength(3)
    expect(list().attributes('aria-busy')).toBe('true')
    expect(list().classes()).toContain('opacity-60')
    expect(w.find('span.sr-only[role="status"]').text()).toBe('Searching…')
    await vi.advanceTimersByTimeAsync(250)
    expect(options(w).map((o) => o.text())).toEqual(['Madrid'])
    expect(list().classes()).not.toContain('opacity-60')
  })

  it('a picked option keeps its label after the server answers another query', async () => {
    const fetcher = vi.fn(async (q: string) => search(q))
    const w = keep(mountSelect({ fetcher, modelValue: null }))
    await trigger(w).trigger('click')
    await flush()
    await options(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['madrid']])
    await w.setProps({ modelValue: 'madrid' })
    expect(shown(w)).toBe('Madrid')
    await trigger(w).trigger('click')
    await flush()
    await w.find('[data-ui-panel] input').setValue('war')
    await new Promise((r) => setTimeout(r, 260))
    expect(options(w).map((o) => o.text())).toEqual(['Warsaw'])
    expect(shown(w)).toBe('Madrid')
  })
})

describe("UiSelect — loading the app's options", () => {
  it('options the app is loading show rows in their shape and say so, never "No matches"', async () => {
    const w = keep(mountSelect({ items: [], loading: true }))
    await trigger(w).trigger('click')
    expect(w.findAll('[role=listbox] [data-skeleton]').length).toBeGreaterThan(0)
    expect(w.find('[data-note]').exists()).toBe(false)
    expect(w.find('span[role=status]').text()).toBe('Loading options…')
    await w.setProps({ items: ITEMS, loading: false })
    expect(w.findAll('[data-skeleton]')).toHaveLength(0)
    expect(options(w)).toHaveLength(4)
  })

  it("a refresh of the app's options keeps them, dimmed and busy, and says it updates", async () => {
    const w = keep(mountSelect({ loading: true }))
    await trigger(w).trigger('click')
    const list = w.find('[role=listbox]')
    expect(list.classes()).toContain('opacity-60')
    expect(list.attributes('aria-busy')).toBe('true')
    expect(options(w)).toHaveLength(4)
    expect(w.find('span[role=status]').text()).toBe('Updating…')
  })

  it("with multiple, the rows in the options' shape keep the box", async () => {
    const w = keep(mountSelect({ items: [], loading: true, multiple: true, modelValue: [] }))
    await trigger(w).trigger('click')
    const row = w.find('[role=listbox] [data-skeleton]')
    expect(row.findAll('.ui-skeleton')).toHaveLength(2)
  })

  afterEach(() => vi.useRealTimers())

  it('items seeds the label of a prefilled value before the first fetcher search resolves', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async () => [{ value: 'warsaw', label: 'Warsaw' }])
    const w = keep(
      mountSelect({ items: [{ value: 'lisbon', label: 'Lisbon' }], modelValue: 'lisbon', fetcher }),
    )
    expect(shown(w)).toContain('Lisbon')
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(shown(w)).toContain('Lisbon')
  })

  it('a value shared by two groups selects and labels as one option, not two', () => {
    const shared: SelectItem[] = [
      { label: 'Cards', options: [{ value: 'other', label: 'Other card' }] },
      { label: 'Cash', options: [{ value: 'other', label: 'Other cash' }] },
    ]
    const w = keep(mountSelect({ items: shared, modelValue: 'other', name: 'method' }))
    expect(shown(w)).toContain('Other card')
    expect(shown(w)).not.toContain('Other cash')
    expect(w.findAll('input[type=hidden][name=method]')).toHaveLength(1)
  })

  it('a fetcher refetch on reopen keeps the highlight on the truly selected option, not a stale index', async () => {
    vi.useFakeTimers()
    const CITIES = [
      { value: 'lisbon', label: 'Lisbon' },
      { value: 'madrid', label: 'Madrid' },
      { value: 'warsaw', label: 'Warsaw' },
    ]
    const fetcher = vi.fn(async (q: string) =>
      CITIES.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    )
    const w = keep(mountSelect({ items: undefined, fetcher, modelValue: 'warsaw' }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await w.find('[data-ui-panel] input').setValue('wa')
    await vi.advanceTimersByTimeAsync(250)
    await vi.advanceTimersByTimeAsync(0)
    await trigger(w).trigger('keydown', { key: 'Escape' })
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    const activeId =
      trigger(w).attributes('aria-activedescendant') ??
      w.find('[data-ui-panel] input').attributes('aria-activedescendant')
    expect(w.find(`[id="${activeId}"]`).text()).toContain('Warsaw')
  })

  it('a list runs its rows edge to edge, the first and last to the panel edge', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('click')
    const row = options(w)[0]!
    expect(row.classes()).not.toContain('rounded-control')
    expect(row.classes()).toContain('px-3')
    expect(row.classes()).toContain('last:pb-[max(0.375rem,calc(var(--radius-overlay)*0.3))]')
    expect(
      w
        .find('[role=listbox]')
        .classes()
        .some((c) => c.startsWith('py-') || c.startsWith('p-')),
    ).toBe(false)
  })

  it('the cross of a tag drops that pick and moves the focus to the next tag', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['gbp', 'usd', 'pln'],
        'onUpdate:modelValue': (v: Picked) => w.setProps({ modelValue: v as SelectValue[] }),
      }),
    )
    await w.findAll('[data-tag] button')[0]!.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.findAll('[data-tag]').map((t) => t.text())).toEqual(['US dollar', 'Polish zloty'])
    expect(document.activeElement).toBe(w.findAll('[data-tag] button')[0]!.element)
  })

  it('a double click on a tag cross removes one tag, not the next one sliding under it', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['gbp', 'usd', 'pln'],
        'onUpdate:modelValue': (v: Picked) => w.setProps({ modelValue: v as SelectValue[] }),
      }),
    )
    await w.findAll('[data-tag] button')[0]!.trigger('click', { detail: 1 })
    await new Promise((r) => setTimeout(r, 0))
    // The second click of the same double click lands on the tag that took the place.
    await w.findAll('[data-tag] button')[0]!.trigger('click', { detail: 2 })
    await new Promise((r) => setTimeout(r, 0))
    expect(w.findAll('[data-tag]').map((t) => t.text())).toEqual(['US dollar', 'Polish zloty'])
  })

  // Only a double click's second click is held back: Enter on the next cross, or the app's `remove`
  // called for two picks in a row, removes both.
  it('two removals in a row by the keyboard or by `remove` both land', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['gbp', 'usd', 'pln'],
        'onUpdate:modelValue': (v: Picked) => w.setProps({ modelValue: v as SelectValue[] }),
      }),
    )
    await w.findAll('[data-tag] button')[0]!.trigger('click', { detail: 0 })
    await new Promise((r) => setTimeout(r, 0))
    await w.findAll('[data-tag] button')[0]!.trigger('click', { detail: 0 })
    await new Promise((r) => setTimeout(r, 0))
    expect(w.findAll('[data-tag]').map((t) => t.text())).toEqual(['Polish zloty'])

    // The app's rows call `remove` for each pick it drops, two in one go.
    let given:
      | { options: SelectOption[]; remove: (option: SelectOption, event?: MouseEvent) => void }
      | undefined
    const p = keep(
      mount(UiSelect, {
        attachTo: document.body,
        props: {
          multiple: true,
          ariaLabel: 'Currencies',
          items: [
            { value: 'gbp', label: 'Pound' },
            { value: 'usd', label: 'US dollar' },
            { value: 'pln', label: 'Polish zloty' },
          ],
          modelValue: ['gbp', 'usd', 'pln'],
          'onUpdate:modelValue': (v: Picked): Promise<void> =>
            p.setProps({ modelValue: v as SelectValue[] }),
        },
        slots: {
          picks: (scope: NonNullable<typeof given>) => {
            given = scope
            return 'rows'
          },
        },
      }),
    )
    given!.remove(given!.options[0]!)
    await new Promise((r) => setTimeout(r, 0))
    given!.remove(given!.options[0]!)
    await new Promise((r) => setTimeout(r, 0))
    expect(p.props('modelValue')).toEqual(['pln'])
    // The app's own button passes its click: a double click's second, on the row sliding under the
    // pointer, is held back as on a tag.
    ;(given!.remove as (o: unknown, e?: { detail: number }) => void)(given!.options[0], {
      detail: 2,
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(p.props('modelValue')).toEqual(['pln'])
  })

  it('a single select keeps the capsule as its root, so a button group joins it', () => {
    const w = keep(mountSelect({ class: 'w-64' }))
    expect(w.classes()).toContain('ui-capsule')
    expect(w.classes()).toContain('w-64')
  })

  it('Backspace on a closed multiple select takes back the last pick', async () => {
    const w = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd', 'pln'] }))
    await trigger(w).trigger('keydown', { key: 'Backspace' })
    expect(w.emitted('update:modelValue')).toEqual([[['usd']]])
  })

  it('tags stand 8px under the field and 4px apart, each item as tall as its tag', () => {
    const w = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd', 'pln'] }))
    expect(w.classes()).toContain('gap-2')
    expect(w.find('ul').classes()).toContain('gap-1')
    for (const item of w.findAll('[data-tag]')) expect(item.classes()).toContain('flex')
  })

  it('tags are the size of a UiBadge by default, and take tagSize', () => {
    const md = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd'] }))
    expect(md.find('[data-tag] .ui-badge').classes()).toContain('h-6')
    const sm = keep(mountSelect({ multiple: true, tags: true, modelValue: ['usd'], tagSize: 'sm' }))
    expect(sm.find('[data-tag] .ui-badge').classes()).toContain('h-5')
  })

  it('without tags the picks are listed in the trigger and the capsule stays the root', () => {
    const w = keep(mountSelect({ multiple: true, modelValue: ['usd', 'pln'], class: 'w-64' }))
    expect(shown(w)).toContain('US dollar, Polish zloty')
    expect(w.find('[data-tag]').exists()).toBe(false)
    expect(w.classes()).toContain('ui-capsule')
    expect(w.classes()).toContain('w-64')
  })

  it('a local search puts the highlight on the first match, not on the selected option', async () => {
    const fruit: SelectItem[] = [
      { value: 'banana', label: 'Banana' },
      { value: 'date', label: 'Date' },
      { value: 'cherry', label: 'Cherry' },
    ]
    const w = keep(mountSelect({ items: fruit, searchable: true, modelValue: 'cherry' }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('e')
    const id = w.find('[data-ui-panel] input').attributes('aria-activedescendant')
    expect(w.find(`[id="${id}"]`).text()).toContain('Date')
  })

  it('removing the last tag puts the focus back on the field', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['usd'],
        'onUpdate:modelValue': (v: Picked) => w.setProps({ modelValue: v as SelectValue[] }),
      }),
    )
    await w.find('[data-tag] button').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('[data-tag]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('a disabled select with tags shows no crosses and ignores Backspace', async () => {
    const w = keep(
      mountSelect({ multiple: true, tags: true, disabled: true, modelValue: ['usd', 'pln'] }),
    )
    expect(w.find('[data-tag] button').exists()).toBe(false)
    await trigger(w).trigger('keydown', { key: 'Backspace' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it("a disabled select's hidden input carries disabled, so a form does not send its value", () => {
    const w = keep(mountSelect({ disabled: true, modelValue: 'usd', name: 'currency' }))
    const hidden = w.findAll('input[type="hidden"]')
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.every((i) => (i.element as HTMLInputElement).disabled)).toBe(true)
  })

  it('disabling while open closes the list and keeps the focus on the field', async () => {
    const w = keep(mountSelect({ modelValue: 'usd' }))
    await trigger(w).trigger('click')
    expect(w.find('[role=listbox]').exists()).toBe(true)
    ;(trigger(w).element as HTMLElement).focus()
    await w.setProps({ disabled: true })
    await nextTick()
    await nextTick()
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('.ui-capsule').element)
  })
})

describe('UiSelect — search follow-ups', () => {
  const many = ['Apple', 'Banana', 'Cherry', 'Date', 'Elder', 'Fig', 'Grape'].map((l) => ({
    value: l.toLowerCase(),
    label: l,
  }))
  it('the search clears its own text on Escape and keeps the panel open; a second Escape closes it', async () => {
    const w = mount(UiSelect, {
      props: { items: many, modelValue: [], multiple: true, searchable: true, ariaLabel: 'Fruit' },
      attachTo: document.body,
    })
    await w.find('button, [role="combobox"]').trigger('click')
    await nextTick()
    const input = document.querySelector('input[aria-autocomplete="list"]') as HTMLInputElement
    input.value = 'ap'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    const outside = vi.fn()
    document.addEventListener('keydown', outside)
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await nextTick()
    expect(input.value).toBe('')
    expect(outside).not.toHaveBeenCalled()
    document.removeEventListener('keydown', outside)
    w.unmount()
  })

  it('an Enter that confirms an IME composition in the search picks nothing', async () => {
    const w = mount(UiSelect, {
      props: { items: many, modelValue: [], multiple: true, searchable: true, ariaLabel: 'Fruit' },
      attachTo: document.body,
    })
    await w.find('button, [role="combobox"]').trigger('click')
    await nextTick()
    const input = document.querySelector('input[aria-autocomplete="list"]') as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
    )
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })
})

describe('UiSelect — proven claims', () => {
  it('a long list is cut at five rows and a half', async () => {
    const top = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.getAttribute?.('role') === 'option' ? 32 : 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const rows = this.parentElement ? [...this.parentElement.children] : []
        return this.getAttribute?.('role') === 'option' ? rows.indexOf(this) * 32 : 0
      },
    })
    try {
      const many = Array.from({ length: 9 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}` }))
      const w = keep(mountSelect({ items: many }))
      await trigger(w).trigger('click')
      for (let i = 0; i < 3; i++) await w.vm.$nextTick()
      await new Promise((r) => setTimeout(r))
      const list = document.body.querySelector<HTMLElement>('[role="listbox"]')!
      // Five rows of 32 and half of the sixth: 5 * 32 + 16.
      expect(list.style.maxHeight).toContain('176px')
    } finally {
      if (top) Object.defineProperty(HTMLElement.prototype, 'offsetTop', top)
      if (height) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height)
    }
  })
})

describe('UiSelect — review follow-ups, third pass', () => {
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  const settle = async () => {
    for (let i = 0; i < 3; i++) await nextTick()
  }

  it('Escape on the trigger of an open select inside a modal closes the list only', async () => {
    const heard = vi.fn()
    const m = keep(
      mount(UiModal, {
        attachTo: document.body,
        props: { title: 'Edit', open: true },
        slots: { default: () => h(UiSelect, { ...base, ariaLabel: 'Currency' }) },
      }),
    )
    await settle()
    const t = document.body.querySelector<HTMLElement>('[role=combobox]')!
    t.click()
    await settle()
    expect(document.body.querySelector('[role=listbox]')).not.toBeNull()
    document.addEventListener('keydown', heard)
    t.focus()
    key(t, 'Escape')
    await settle()
    document.removeEventListener('keydown', heard)
    expect(document.body.querySelector('[role=listbox]')).toBeNull()
    expect(heard).not.toHaveBeenCalled()
    expect(m.props('open')).toBe(true)
  })

  it("a caller's aria-invalid and aria-required survive where the select sets none", () => {
    const w = keep(
      mount(UiSelect, { props: base, attrs: { 'aria-invalid': 'true', 'aria-required': 'true' } }),
    )
    expect(trigger(w).attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-required': 'true',
    })
  })

  it('an empty select sends nothing under its name', () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiSelect, { attachTo: form, props: { ...base, name: 'cur' } })
    expect(new FormData(form).has('cur')).toBe(false)
    w.unmount()
    form.remove()
  })

  it('Backspace takes back the last pick in view, a value outside items shown as its text too', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = keep(mountSelect({ multiple: true, modelValue: ['gone', 'gbp'] }))
      key(trigger(w).element, 'Backspace')
      expect(w.emitted('update:modelValue')).toEqual([[['gone']]])
      await w.setProps({ modelValue: ['gbp', 'gone'] })
      key(trigger(w).element, 'Backspace')
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual([['gbp']])
    } finally {
      warn.mockRestore()
    }
  })

  it('a standalone listbox takes the ariaLabel', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('click')
    expect(document.body.querySelector('[role=listbox]')!.getAttribute('aria-label')).toBe(
      'Currency',
    )
  })

  it('a letter on a closed searchable select starts the filter', async () => {
    const w = keep(mountSelect({ searchable: true }))
    key(trigger(w).element, 'z')
    await settle()
    expect((document.body.querySelector('[data-ui-panel] input') as HTMLInputElement).value).toBe(
      'z',
    )
    expect(options(w).map((o) => o.text())).toEqual(['Polish zloty'])
  })

  it('a pick the owner lets go is forgotten: its label does not linger', async () => {
    const w = keep(mountSelect({ items: [{ value: 'a', label: 'Apple' }] }))
    await trigger(w).trigger('click')
    await options(w)[0]!.trigger('click')
    await w.setProps({ modelValue: 'a', items: [] })
    expect(shown(w)).toBe('Apple')
    await w.setProps({ modelValue: null })
    await w.setProps({ modelValue: 'a' })
    expect(shown(w)).toBe('a')
  })

  it('the clear button keeps the focus on the field', async () => {
    const w = keep(mountSelect({ clearable: true, modelValue: 'gbp' }))
    const cross = w.find('button[aria-label="Clear selection"]')
    ;(cross.element as HTMLElement).focus()
    await cross.trigger('click')
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('closing the list drops a pending search', async () => {
    vi.useFakeTimers()
    try {
      const fetcher = vi.fn(async () => [])
      const w = keep(mountSelect({ items: undefined, fetcher }))
      await trigger(w).trigger('click')
      await vi.advanceTimersByTimeAsync(0)
      fetcher.mockClear()
      await w.find('[data-ui-panel] input').setValue('li')
      key(document.body.querySelector('[data-ui-panel] input')!, 'Escape')
      key(document.body.querySelector('[data-ui-panel] input')!, 'Escape')
      await vi.advanceTimersByTimeAsync(300)
      expect(fetcher).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a form reset leaves the select on its model, hidden input and trigger agreeing', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiSelect, {
      attachTo: form,
      props: { ...base, name: 'cur', modelValue: 'usd' },
    })
    form.reset()
    await new Promise((r) => setTimeout(r))
    expect(new FormData(form).get('cur')).toBe('usd')
    expect(shown(w)).toBe('US dollar')
    w.unmount()
    form.remove()
  })

  it('a change the parent refuses puts the select back on the model', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(UiSelect, {
      attachTo: form,
      props: { ...base, name: 'cur', modelValue: 'gbp' },
    })
    await trigger(w).trigger('click')
    await options(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['usd']])
    expect(shown(w)).toBe('British pound')
    expect(new FormData(form).get('cur')).toBe('gbp')
    w.unmount()
    form.remove()
  })

  it('focusInvalid on an invalid select focuses the trigger', () => {
    const w = keep(
      mount(
        defineComponent({
          setup: () => () =>
            h('form', [
              h(UiField, { label: 'Currency', error: 'Pick one' }, () =>
                h(UiSelect, { modelValue: null, items: ITEMS }),
              ),
            ]),
        }),
        { attachTo: document.body },
      ),
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('[role=combobox]').element)
  })

  it('a disabled select with an error keeps the disabled plate', () => {
    const w = keep(mountSelect({ disabled: true, invalid: true }))
    expect(trigger(w).attributes('disabled')).toBeDefined()
    expect(w.find('.ui-capsule').classes()).toContain('bg-disabled-bg')
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toContain(':root .ui-capsule[data-invalid]:not(:has(:disabled))')
  })
})

describe('UiSelect — review follow-ups, keywords and width', () => {
  it('the filter finds an option by its keywords as well as its label', async () => {
    const w = keep(
      mountSelect({
        searchable: true,
        items: [
          { value: '14:30', label: '2:30 PM', keywords: '14:30 1430' },
          { value: '15:00', label: '3:00 PM', keywords: '15:00 1500' },
        ],
      }),
    )
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('14:3')
    expect(options(w).map((o) => o.text())).toEqual(['2:30 PM'])
  })

  it('a required field shows no cross even when clearable', () => {
    const items = [{ value: 'usd', label: 'US dollar' }]
    const standalone = keep(
      mountSelect({ items, modelValue: 'usd', clearable: true, required: true }),
    )
    expect(standalone.find('[aria-label="Clear selection"]').exists()).toBe(false)
    expect(trigger(standalone).attributes('aria-required')).toBe('true')
    const w = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Currency', required: true },
      slots: { default: () => h(UiSelect, { items, modelValue: 'usd', clearable: true }) },
    })
    expect(w.find('[aria-label="Clear selection"]').exists()).toBe(false)
    w.unmount()
  })

  it('a chosen label stands in a UiTruncate, its whole text in the tooltip while cut', () => {
    const long = 'Northwind Traders, the Copenhagen office'
    const w = mount(UiSelect, {
      props: { modelValue: 'n', items: [{ value: 'n', label: long }], ariaLabel: 'Client' },
    })
    expect(w.findComponent(UiTruncate).props('text')).toBe(long)
    // Nothing chosen: the placeholder stands there, cut the same way.
    const none = mount(UiSelect, {
      props: { modelValue: null, items: [{ value: 'n', label: long }], ariaLabel: 'Client' },
    })
    expect(none.findComponent(UiTruncate).props('text')).toBe('Select…')
  })

  it('the field keeps its width: the text stands over the longest labels, the cross keeps its place', () => {
    const w = keep(
      mountSelect({
        items: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'A much longer label' },
        ],
        modelValue: null,
        clearable: true,
      }),
    )
    const sizers = w.findAll('[role=combobox] [data-sizer]').map((s) => s.text())
    expect(sizers).toContain('A much longer label')
    // Before the chevron, inside the trigger: the chevron stays at the end of the field.
    const reserve = w.find('[role=combobox] > [data-sizer]')
    expect(reserve.exists()).toBe(true)
    expect(reserve.element.nextElementSibling?.classList).toContain('lucide-chevron-down')
    expect(w.findAll('.ui-capsule > [data-sizer]')).toHaveLength(0)
    const many = keep(mountSelect({ multiple: true, items: [{ value: 'a', label: 'A' }] }))
    expect(many.findAll('[role=combobox] [data-sizer]')).toHaveLength(0)
  })
})

describe('UiSelect — a first search said aloud', () => {
  it('announces searching while the first load has no options, in a region that stays', async () => {
    let resolve!: (v: SelectItem[]) => void
    const fetcher = vi.fn(() => new Promise<SelectItem[]>((r) => (resolve = r)))
    const w = keep(mountSelect({ fetcher }))
    const region = () => w.find('span.sr-only[role="status"]')
    expect(region().exists()).toBe(true)
    expect(region().text()).toBe('')
    await trigger(w).trigger('click')
    expect(region().text()).toBe('Searching…')
    resolve([])
    for (let k = 0; k < 4; k++) await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(region().text()).toBe('No options')
  })
})

describe('UiSelect — what the list says and keeps', () => {
  const CITIES = [
    { value: 'lisbon', label: 'Lisbon' },
    { value: 'madrid', label: 'Madrid' },
    { value: 'warsaw', label: 'Warsaw' },
  ]
  const flush = () => new Promise((r) => setTimeout(r, 0))
  const region = (w: ReturnType<typeof mount>) => w.find('span.sr-only[role="status"]').text()
  const highlighted = (w: ReturnType<typeof mount>) => {
    const id = trigger(w).attributes('aria-activedescendant')
    return id ? document.getElementById(id)?.textContent?.trim() : undefined
  }
  afterEach(() => vi.useRealTimers())

  it('says no options and a failed search in its status region, which stays in the DOM', async () => {
    const none = keep(mountSelect({ items: undefined, fetcher: async () => [] }))
    await trigger(none).trigger('click')
    await flush()
    expect(region(none)).toBe('No options')
    const down = keep(
      mountSelect({ items: undefined, fetcher: async () => Promise.reject(new Error('down')) }),
    )
    await trigger(down).trigger('click')
    await flush()
    expect(region(down)).toBe('Could not load the options')
  })

  it("a refresh that reorders the app's options keeps the highlight on its option", async () => {
    const abc = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Bravo' },
      { value: 'c', label: 'Charlie' },
    ]
    const w = keep(mountSelect({ items: abc }))
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(highlighted(w)).toBe('Charlie')
    await w.setProps({ items: [abc[2]!, abc[0]!, abc[1]!], loading: true })
    expect(highlighted(w)).toBe('Charlie')
    await trigger(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['c'])
  })

  it('options arriving after a first load highlight the picked one', async () => {
    const w = keep(mountSelect({ modelValue: 'usd', items: [], loading: true }))
    await trigger(w).trigger('click')
    await w.setProps({ items: ITEMS, loading: false })
    expect(highlighted(w)).toBe('US dollar')
  })

  it('a shrinking list never leaves the highlight on a row that is gone', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'End' })
    await w.setProps({ items: [ITEMS[0]!] })
    expect(highlighted(w)).toBe('British pound')
  })

  it('a filter that matches nothing during a refresh says No matches with Clear search, not rows', async () => {
    const w = keep(mountSelect({ searchable: true, loading: true }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue('zzz')
    expect(w.findAll('[data-skeleton]')).toHaveLength(0)
    expect(w.find('[data-note]').text()).toContain('No matches')
    expect(w.find('[data-note] button').text()).toBe('Clear search')
    expect(region(w)).toBe('Updating…')
  })

  it('reopening after a search asks once for the empty query', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async (q: string) =>
      CITIES.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    )
    const w = keep(mountSelect({ items: undefined, fetcher }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await w.find('[data-ui-panel] input').setValue('ma')
    await vi.advanceTimersByTimeAsync(300)
    // Closed with the text still typed (the trigger again, as a click outside would): Escape would
    // clear the text first.
    await trigger(w).trigger('click')
    fetcher.mockClear()
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(600)
    expect(fetcher.mock.calls).toEqual([['']])
  })

  it('a prefilled value whose option is still loading reads as a load and is sent as it is', async () => {
    const w = keep(mountSelect({ modelValue: 'usd', items: [], loading: true, name: 'cur' }))
    expect(trigger(w).find('.ui-skeleton').exists()).toBe(true)
    expect(shown(w)).toContain('Loading options…')
    expect(w.find('input[type=hidden][name=cur]').attributes('value')).toBe('usd')
    await w.setProps({ items: ITEMS, loading: false })
    expect(shown(w)).toBe('US dollar')
  })

  it("with a fetcher, the app's loading changes nothing: the select says its own load", async () => {
    const w = keep(mountSelect({ items: undefined, fetcher: async () => CITIES, loading: true }))
    await trigger(w).trigger('click')
    await flush()
    expect(w.find('[role=listbox]').attributes('aria-busy')).toBeUndefined()
    expect(w.findAll('[data-skeleton]')).toHaveLength(0)
    expect(region(w)).toBe('')
  })

  it('a fetcher select points at the highlighted option from its filter only', async () => {
    const w = keep(mountSelect({ items: undefined, fetcher: async () => CITIES }))
    await trigger(w).trigger('click')
    await flush()
    expect(trigger(w).attributes('aria-activedescendant')).toBeUndefined()
    expect(w.find('[data-ui-panel] input').attributes('aria-activedescendant')).toBeDefined()
  })

  it("a local filter after the app's load shrinks the list to its rows again", async () => {
    const tall = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'listbox' ? this.children.length * 32 : 32
      })
    const twelve = Array.from({ length: 12 }, (_, i) => ({ value: `k${i}`, label: `Kind ${i}` }))
    const w = keep(mountSelect({ items: twelve, searchable: true }))
    await trigger(w).trigger('click')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await nextTick()
    const list = () => w.find('[role=listbox]').element as HTMLElement
    expect(list().style.minHeight).not.toBe('')
    await w.find('[data-ui-panel] input').setValue('Kind 1')
    await nextTick()
    expect(list().style.minHeight).toBe('')
    tall.mockRestore()
  })

  it('one value known and one still loading: the field reads as a load and sends both', async () => {
    const w = keep(
      mountSelect({
        multiple: true,
        tags: true,
        modelValue: ['gbp', 'xyz'],
        items: [ITEMS[0]],
        loading: true,
        name: 'cur',
      }),
    )
    expect(trigger(w).find('.ui-skeleton').exists()).toBe(true)
    expect(w.findAll('input[type=hidden][name=cur]').map((i) => i.attributes('value'))).toEqual([
      'gbp',
      'xyz',
    ])
  })
})

// A chord with Alt, Ctrl or Meta is the browser's: Alt with ← goes back a page, Ctrl or ⌘ moves a
// caret or scrolls. The component takes the key only alone.
const chord = (el: Element, key: string, mods: Partial<KeyboardEventInit>) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  el.dispatchEvent(e)
  return e
}

describe('UiSelect — a chord is the browser’s', () => {
  it('Alt with ArrowDown opens the list, as a select does; Ctrl or Meta leave the key', async () => {
    const w = keep(mountSelect())
    const e = chord(trigger(w).element, 'ArrowDown', { ctrlKey: true })
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(w.find('[role=listbox]').exists()).toBe(false)
    chord(trigger(w).element, 'ArrowDown', { altKey: true })
    await nextTick()
    await nextTick()
    expect(w.find('[role=listbox]').exists()).toBe(true)
  })

  it('in the open list Ctrl or Meta with an arrow moves no highlight and leaves the key', async () => {
    const w = keep(mountSelect())
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    const lit = () => options(w).findIndex((o) => o.classes().includes('bg-surface-muted'))
    const before = lit()
    const e = chord(trigger(w).element, 'ArrowDown', { metaKey: true })
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(lit()).toBe(before)
  })
})

describe('UiSelect — the picks come and go with the value', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // The app draws its rows only once something is picked (`<template v-if="model.length" #picks>`):
  // the field gains the place below it, and the button the keys are on must keep the focus.
  it('a pick that brings #picks keeps the focus on the field, the list open to the keys', async () => {
    const model = ref<SelectValue[]>([])
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiSelect,
            {
              multiple: true,
              ariaLabel: 'Fruit',
              items: [
                { value: 'a', label: 'Apple' },
                { value: 'b', label: 'Banana' },
              ],
              modelValue: model.value,
              'onUpdate:modelValue': (v: Picked) => (model.value = v as SelectValue[]),
            },
            model.value.length ? { picks: () => h('p', model.value.join(', ')) } : {},
          ),
      }),
      { attachTo: document.body },
    )
    const combo = () => w.find<HTMLElement>('[role=combobox]')
    combo().element.focus()
    await combo().trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    await combo().trigger('keydown', { key: 'Enter' })
    await nextTick()
    await nextTick()
    expect(model.value).toEqual(['a'])
    expect(document.activeElement).toBe(combo().element)
    await combo().trigger('keydown', { key: 'ArrowDown' })
    await combo().trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(model.value).toEqual(['a', 'b'])
    w.unmount()
  })
})

describe('UiSelect — review follow-ups, an empty list', () => {
  const note = (w: ReturnType<typeof mount>) => w.find('[data-note]').text()
  const region = (w: ReturnType<typeof mount>) => w.find('span.sr-only[role="status"]').text()

  it('a list with no options and no search says No options, in its note and its status region', async () => {
    const w = keep(mountSelect({ items: [], searchable: true }))
    await trigger(w).trigger('click')
    expect(note(w)).toContain('No options')
    expect(region(w)).toBe('No options')
    await w.find('[data-ui-panel] input').setValue('yen')
    expect(note(w)).toContain('No matches')
    expect(region(w)).toBe('No matches')
  })

  it('a search of spaces over an empty list is no search: No options, and no Clear search', async () => {
    const w = keep(mountSelect({ items: [], searchable: true }))
    await trigger(w).trigger('click')
    await w.find('[data-ui-panel] input').setValue(' ')
    expect(note(w)).toContain('No options')
    expect(w.find('[data-note] button').exists()).toBe(false)
  })

  it("a fetcher's empty answer is No options to no search and No matches to a search", async () => {
    vi.useFakeTimers()
    try {
      const w = keep(mountSelect({ items: undefined, fetcher: async () => [] }))
      await trigger(w).trigger('click')
      await vi.advanceTimersByTimeAsync(0)
      expect(note(w)).toContain('No options')
      expect(region(w)).toBe('No options')
      await w.find('[data-ui-panel] input').setValue('zz')
      await vi.advanceTimersByTimeAsync(400)
      expect(note(w)).toContain('No matches')
      expect(region(w)).toBe('No matches')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('UiSelect — review follow-ups, a value outside the options', () => {
  const warned = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.filter((c) => String(c[0]).includes('UiSelect'))

  it('a value no option knows shows as itself, is sent, and is warned about once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = keep(mountSelect({ modelValue: 'gone', name: 'cur' }))
      expect(shown(w)).toBe('gone')
      expect(w.find('input[type=hidden][name=cur]').attributes('value')).toBe('gone')
      await w.setProps({ items: [...ITEMS] })
      await trigger(w).trigger('click')
      expect(warned(warn)).toHaveLength(1)
      expect(String(warned(warn)[0]![0])).toContain('"gone"')
    } finally {
      warn.mockRestore()
    }
  })

  it('a value still loading is a load, not its text, and is warned about only once the load is over', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = keep(mountSelect({ modelValue: 'xyz', items: [], loading: true }))
      expect(trigger(w).find('.ui-skeleton').exists()).toBe(true)
      expect(warned(warn)).toHaveLength(0)
      await w.setProps({ items: ITEMS, loading: false })
      expect(shown(w)).toBe('xyz')
      expect(warned(warn)).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('an empty string no option has is nothing picked: the placeholder, no cross, nothing sent, no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = keep(mountSelect({ modelValue: '', name: 'cur', clearable: true }))
      expect(shown(w)).toBe('Select…')
      expect(w.find('button[aria-label="Clear selection"]').exists()).toBe(false)
      expect(w.findAll('input[type=hidden]')).toHaveLength(0)
      expect(warned(warn)).toHaveLength(0)
    } finally {
      warn.mockRestore()
    }
  })

  it('one app is warned once about a value, however many selects hold it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const two = defineComponent({
        render: () =>
          [1, 2].map(() =>
            h(UiSelect, { modelValue: 'gone', items: ITEMS, ariaLabel: 'Currency' }),
          ),
      })
      keep(mount(two, { attachTo: document.body }))
      expect(warned(warn)).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('with tags, a value no option knows is a tag of its own, with its cross', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const w = keep(mountSelect({ multiple: true, tags: true, modelValue: ['gbp', 'gone'] }))
      expect(w.findAll('[data-tag]').map((t) => t.text())).toEqual(['British pound', 'gone'])
      await w.findAll('[data-tag] button')[1]!.trigger('click')
      expect(w.emitted('update:modelValue')).toEqual([[['gbp']]])
    } finally {
      warn.mockRestore()
    }
  })
})

describe('UiSelect — final review follow-ups', () => {
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
  }
  const activeLabel = (w: ReturnType<typeof mount>) => {
    const id = trigger(w).attributes('aria-activedescendant')
    return options(w)
      .find((r) => r.attributes('id') === id)
      ?.text()
  }
  const CLIENTS = ['Aaron Kim', 'Anna Petrova', 'Ivan Sidorov'].map((n) => ({
    value: n.toLowerCase().replaceAll(' ', '-'),
    label: n,
  }))
  const find = (q: string) => CLIENTS.filter((c) => c.label.toLowerCase().includes(q))
  afterEach(() => vi.useRealTimers())

  it('Enter while the answer to the typed text is on its way picks nothing; once it comes, Enter picks from it', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async (q: string) => find(q))
    const w = keep(mountSelect({ items: undefined, fetcher }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    const input = w.find('[data-ui-panel] input')
    await input.setValue('ivan')
    await vi.advanceTimersByTimeAsync(100)
    key(input.element, 'Enter')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(300)
    key(input.element, 'Enter')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['ivan-sidorov'])
  })

  it('a Space after letters typed over the list belongs to the word: New J reaches New Jersey', async () => {
    const cities = [
      { value: 'ny', label: 'New York' },
      { value: 'no', label: 'New Orleans' },
      { value: 'nj', label: 'New Jersey' },
    ]
    const w = keep(mountSelect({ items: cities }))
    await trigger(w).trigger('click')
    for (const k of ['n', 'e', 'w', ' ', 'j']) key(trigger(w).element, k)
    await settle()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(activeLabel(w)).toBe('New Jersey')
  })

  it('a letter on the closed field opens on the first label that starts with it, the chosen one too', async () => {
    const items = [
      { value: 'pl', label: 'Polish zloty' },
      { value: 'pe', label: 'Peruvian sol' },
      { value: 'us', label: 'US dollar' },
    ]
    for (const modelValue of [null, 'pl']) {
      const w = keep(mountSelect({ items, modelValue }))
      key(trigger(w).element, 'p')
      await settle()
      expect(activeLabel(w), String(modelValue)).toBe('Polish zloty')
    }
  })

  it('a press outside while a search waits asks the server for nothing', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async () => [])
    const w = keep(mountSelect({ items: undefined, fetcher }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    fetcher.mockClear()
    await w.find('[data-ui-panel] input').setValue('li')
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    await vi.advanceTimersByTimeAsync(300)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('a search dropped before it was asked leaves the closed field showing its value, not a load', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async (q: string) => find(q))
    const w = keep(mountSelect({ items: undefined, fetcher, modelValue: 'zed' }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await w.find('[data-ui-panel] input').setValue('x')
    const input = () => document.body.querySelector('[data-ui-panel] input')!
    key(input(), 'Escape')
    key(input(), 'Escape')
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(trigger(w).text()).toContain('zed')
    expect(trigger(w).text()).not.toContain('Loading options')
  })

  it('the whole-label tooltip stays away while the list is open, where it would stand over the rows', async () => {
    const w = keep(mountSelect({ modelValue: 'gbp' }))
    expect(w.findComponent(UiTruncate).exists()).toBe(true)
    await trigger(w).trigger('click')
    await settle()
    expect(w.findComponent(UiTruncate).exists()).toBe(false)
    expect(shown(w)).toContain('British pound')
  })

  it('a search finds "Артём" typed as "артем" and "München" typed as "munchen"', async () => {
    const items = [
      { value: 'a', label: 'Артём Орлов' },
      { value: 'b', label: 'München' },
      { value: 'c', label: 'Андрей' },
    ]
    const w = keep(mountSelect({ items, searchable: true }))
    await trigger(w).trigger('click')
    await settle()
    const input = w.find('[data-ui-panel] input')
    await input.setValue('артем')
    await settle()
    expect(options(w).map((o) => o.text())).toEqual(['Артём Орлов'])
    await input.setValue('munchen')
    await settle()
    expect(options(w).map((o) => o.text())).toEqual(['München'])
    // й stays a letter of its own.
    await input.setValue('андреи')
    await settle()
    expect(options(w)).toHaveLength(0)
  })

  it('after a pick from a searchable list the focus is back on the field; a press outside leaves it where it was', async () => {
    const w = keep(mountSelect({ searchable: true }))
    await trigger(w).trigger('click')
    await settle()
    expect(document.activeElement?.tagName).toBe('INPUT')
    await options(w)[0]!.trigger('click')
    await settle()
    expect(document.activeElement).toBe(trigger(w).element)
    const outside = document.createElement('button')
    document.body.append(outside)
    await trigger(w).trigger('click')
    await settle()
    outside.focus()
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('the clear cross pulls to the capsule edge and, at xs, fits inside the capsule; its kept place matches it', () => {
    for (const size of ['xs', 'sm'] as const) {
      const w = keep(mountSelect({ size, clearable: true, modelValue: 'gbp' }))
      const cross = w.find('button[aria-label="Clear selection"]')
      expect(cross.classes()).toContain('-me-1.5')
      if (size === 'xs') expect(cross.classes()).toContain('!h-6')
      const empty = keep(mountSelect({ size, clearable: true }))
      expect(empty.find('[data-sizer].shrink-0').classes()).toContain(
        size === 'xs' ? 'w-[18px]' : 'w-[22px]',
      )
    }
  })

  it('a press outside its list inside a modal closes the list and keeps the modal', async () => {
    const m = keep(
      mount(UiModal, {
        attachTo: document.body,
        props: { title: 'Edit', open: true },
        slots: { default: () => h(UiSelect, { ...base }) },
      }),
    )
    await settle()
    await new Promise((r) => setTimeout(r, 2))
    document.body.querySelector<HTMLElement>('[role=combobox]')!.click()
    await settle()
    expect(document.body.querySelector('[role=listbox]')).not.toBeNull()
    const backdrop = document.body.querySelector('[aria-modal="true"]')!.parentElement!
    backdrop.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(document.body.querySelector('[role=listbox]')).toBeNull()
    expect(m.emitted('update:open')).toBeUndefined()
  })

  it('near the bottom of the window the list opens above the field; near the top, below it', async () => {
    const field = { left: 20, width: 240, height: 36 }
    let fieldTop = 0
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() =>
        DOMRect.fromRect({ x: field.left, y: fieldTop, width: field.width, height: field.height }),
      )
    const tall = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute('data-ui-panel') ? 200 : field.height
      })
    const wide = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240)
    const height = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(700)
    try {
      for (const [top, side] of [
        [620, 'above'],
        [80, 'below'],
      ] as const) {
        fieldTop = top
        const w = mountSelect()
        await trigger(w).trigger('click')
        await settle()
        const panelTop = parseFloat(
          document.body.querySelector<HTMLElement>('[data-ui-panel]')!.style.top,
        )
        if (side === 'above') expect(panelTop + 200).toBeLessThanOrEqual(top)
        else expect(panelTop).toBeGreaterThanOrEqual(top + field.height)
        w.unmount()
      }
    } finally {
      ;[rect, tall, wide, height].forEach((m) => m.mockRestore())
    }
  })
})

describe('UiSelect — verify follow-ups', () => {
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
  }
  const CITIES = [
    { value: 'la', label: 'Los Angeles' },
    { value: 'ny', label: 'New York' },
    { value: 'nj', label: 'New Jersey' },
  ]
  afterEach(() => vi.useRealTimers())

  it('a Space after letters and an arrow picks the row the arrow moved to', async () => {
    const w = keep(mountSelect({ items: CITIES }))
    await trigger(w).trigger('click')
    for (const k of ['n', 'ArrowDown', ' ']) key(trigger(w).element, k)
    await settle()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['nj'])
  })

  it('an answer on its way when the list closes changes nothing: the field shows its value', async () => {
    vi.useFakeTimers()
    let answer: (items: SelectItem[]) => void = () => {}
    const fetcher = vi.fn((q: string) =>
      q === '' ? Promise.resolve([]) : new Promise<SelectItem[]>((r) => (answer = r)),
    )
    const w = keep(mountSelect({ items: undefined, fetcher, modelValue: 'zed' }))
    await trigger(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await w.find('[data-ui-panel] input').setValue('x')
    await vi.advanceTimersByTimeAsync(300)
    expect(fetcher).toHaveBeenCalledWith('x')
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    expect(trigger(w).text()).toContain('zed')
    answer([{ value: 'xenon', label: 'Xenon' }])
    await vi.advanceTimersByTimeAsync(0)
    expect(w.find('[role=listbox]').exists()).toBe(false)
    expect(trigger(w).text()).toContain('zed')
    expect(trigger(w).text()).not.toContain('Loading options')
  })

  it('a Space after the half second that gathers letters picks', async () => {
    vi.useFakeTimers()
    const w = keep(mountSelect({ items: CITIES }))
    await trigger(w).trigger('click')
    key(trigger(w).element, 'n')
    await vi.advanceTimersByTimeAsync(600)
    key(trigger(w).element, ' ')
    await vi.advanceTimersByTimeAsync(0)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['ny'])
  })
})
