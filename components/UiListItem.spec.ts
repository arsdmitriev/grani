import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import UiMenu from './UiMenu.vue'
import UiCard from './UiCard.vue'
import UiReveal from './UiReveal.vue'
import UiSwitch from './UiSwitch.vue'
import UiInput from './UiInput.vue'
import UiField from './UiField.vue'
import { SURFACE_GUTTER } from '../utils/surface'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The line a list draws between its rows, in tokens.css.
const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
const LINE =
  ':root .ui-list > li:has(> :is([data-row], [data-row-block])) + li:has(> [data-row])::before'
import { createGrani } from '../plugin'
import { focusInvalid } from '../utils/focusInvalid'
import { TONE_GLYPH } from '../utils/toneGlyph'

describe('UiListItem', () => {
  it('renders title and description, media on the left, actions on the right', () => {
    const w = mount(UiListItem, {
      props: { title: 'Anna', description: 'anna@work' },
      slots: { media: '<i class="pic" />', actions: '<button class="act">Edit</button>' },
    })
    const kids = [...w.element.children]
    expect(kids[0]!.querySelector('.pic')).not.toBeNull()
    expect(kids[1]!.textContent).toContain('Anna')
    expect(kids[1]!.textContent).toContain('anna@work')
    expect(kids[2]!.querySelector('.act')).not.toBeNull()
  })

  it('the default slot replaces the two lines', () => {
    const w = mount(UiListItem, {
      props: { title: 'Ignored' },
      slots: { default: '<span class="own">Own</span>' },
    })
    expect(w.find('.own').exists()).toBe(true)
    expect(w.text()).not.toContain('Ignored')
  })

  it('plain has no shell; outline is the card shell; muted is a plate', () => {
    expect(mount(UiListItem, { props: { title: 'A' } }).classes()).not.toContain('border')
    expect(mount(UiListItem, { props: { title: 'A', variant: 'outline' } }).classes()).toContain(
      'rounded-card',
    )
    expect(mount(UiListItem, { props: { title: 'A', variant: 'muted' } }).classes()).toContain(
      'bg-surface-muted',
    )
  })

  it('with `to` the whole row is a link', () => {
    const w = mount(UiListItem, { props: { title: 'Docs', to: '/docs' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/docs')
    expect(w.classes()).toContain('[&:is(:enabled,a)]:hover:bg-surface-muted')
    const chevron = w.find('svg')
    expect(chevron.exists()).toBe(true)
    expect(chevron.classes()).toContain('group-[:is(:enabled,a):hover]:translate-x-0.5')
    expect(
      mount(UiListItem, { props: { title: 'Plain' } })
        .find('svg')
        .exists(),
    ).toBe(false)
  })

  it('sm is denser', () => {
    expect(mount(UiListItem, { props: { title: 'A', size: 'sm' } }).classes()).toContain('py-2')
    expect(
      mount(UiListItem, { props: { title: 'A', description: 'B', size: 'sm' } })
        .findAll('p')[1]!
        .classes(),
    ).toContain('text-xs/4.5')
  })

  it('media stays centered on the block, description or not', () => {
    const w = mount(UiListItem, {
      props: { title: 'A', description: 'B' },
      slots: { media: '<i />' },
    })
    expect(w.element.children[0]!.classList.contains('self-start')).toBe(false)
    expect(w.classes()).toContain('items-center')
  })
})

describe('UiListItem — tone', () => {
  it('alone a notice keeps its card, soft or not: border, corners, the tone edge, no fill', () => {
    for (const variant of ['plain', 'soft'] as const) {
      const w = mount(UiListItem, { props: { tone: 'success', variant, title: 'Saved' } })
      expect(w.classes()).toEqual(
        expect.arrayContaining([
          'rounded-card',
          'border',
          'border-border',
          'bg-surface',
          'border-s-[3px]',
          'border-s-success-border',
          'py-3',
        ]),
      )
      expect(w.classes()).not.toContain('bg-success-subtle')
      expect(w.classes()).not.toContain('before:absolute')
      expect(w.attributes('data-row')).toBeUndefined()
    }
  })

  it('a tone makes the row a notice drawn as a toast: a white card with its start edge in the tone, the glyph of its tone, read as a status', () => {
    const w = mount(UiListItem, {
      props: { tone: 'warning', title: 'Rate missing', description: 'Add the June rate.' },
    })
    expect(w.attributes('role')).toBe('status')
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'bg-surface',
        'border',
        'border-border',
        'border-s-[3px]',
        'border-s-warning-border',
      ]),
    )
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.findAll('p')[0]!.classes()).toContain('text-fg')
    expect(w.findAll('p')[1]!.classes()).toContain('text-fg-muted')
  })

  it('a notice without a title is the message itself: the text ink, 12 around the words', () => {
    const w = mount(UiListItem, {
      props: { tone: 'info', description: 'Covers the current filter.' },
    })
    expect(w.find('p').classes()).toContain('text-fg')
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-3', 'py-3']))
  })

  it('a notice takes a glyph from #media, at the first line when it has two', () => {
    const w = mount(UiListItem, {
      props: { tone: 'info', title: 'Note', description: 'Two lines.' },
      slots: { media: '<span class="own">!</span>' },
    })
    expect(w.find('.own').exists()).toBe(true)
    expect(w.find('.own').element.parentElement!.classList.contains('self-start')).toBe(true)
  })

  it('without a tone there is no status role and the variant shell stays', () => {
    const w = mount(UiListItem, { props: { variant: 'outline', title: 'Row' } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.classes()).not.toContain('border-s-[3px]')
  })

  it('a toned link is a link, not a status', () => {
    const w = mount(UiListItem, { props: { tone: 'warning', title: 'Read more', to: '/help' } })
    expect(w.attributes('role')).toBeUndefined()
  })
})

describe('UiListItem — command row', () => {
  it('as button is a real button with type button, a status glyph on the right, the click emitted', async () => {
    const w = mount(UiListItem, {
      props: { as: 'button', title: 'Mark complete' },
      slots: { actions: '<svg class="glyph" />' },
    })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.find('.glyph').exists()).toBe(true)
    expect(w.classes()).toEqual(
      expect.arrayContaining(['w-full', 'text-start', '[&:is(:enabled,a)]:hover:bg-surface-muted']),
    )
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it("Loading puts a spinner in the glyph's place and refuses the press; the button stays enabled.", async () => {
    const w = mount(UiListItem, {
      props: { as: 'button', title: 'Delete', loading: true },
      slots: { actions: '<svg class="glyph" />' },
    })
    expect(w.find('.glyph').exists()).toBe(false)
    expect(w.findComponent({ name: 'UiSpinner' }).exists()).toBe(true)
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.attributes('disabled')).toBeUndefined()
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('disabled is a native disabled button with the disabled ink, not a fade; a disabled link is a disabled button', () => {
    const btn = mount(UiListItem, { props: { as: 'button', title: 'Close', disabled: true } })
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.classes()).toEqual(
      expect.arrayContaining(['disabled:cursor-not-allowed', 'disabled:text-disabled-fg']),
    )
    expect(btn.classes()).not.toContain('opacity-60')
    expect(btn.find('p').classes()).toContain('text-disabled-fg')
    const described = mount(UiListItem, {
      props: {
        as: 'button',
        title: 'Close',
        description: 'Paid records stay open',
        disabled: true,
      },
    })
    expect(described.findAll('p')[1]!.classes()).toContain('text-disabled-fg')
    expect(described.findAll('p')[1]!.classes()).not.toContain('text-fg-muted')
    const link = mount(UiListItem, { props: { title: 'Open', to: '/records/7', disabled: true } })
    expect(link.element.tagName).toBe('BUTTON')
    expect(link.attributes('disabled')).toBeDefined()
    expect(link.attributes('href')).toBeUndefined()
  })

  it('danger on a command row is red ink with the danger focus, not a plate', () => {
    const w = mount(UiListItem, { props: { as: 'button', title: 'Delete', tone: 'danger' } })
    // The text pair of the tone: the base tone misses 4.5:1 on the surface in dark.
    expect(w.classes()).toContain('text-danger-subtle-fg')
    expect(w.classes()).not.toContain('text-danger')
    expect(w.classes()).not.toContain('bg-danger-subtle')
    expect(w.attributes('data-focus')).toBe('danger')
    expect(w.attributes('role')).toBeUndefined()
  })

  it('a plain row still passes its click through', async () => {
    const w = mount(UiListItem, { props: { title: 'Row' } })
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })
})

describe('UiListItem — a list divides its rows', () => {
  it('in a UiList a row right after another stands under the line the list draws; the first under none', () => {
    const w = mount({
      render: () =>
        h(UiList, () => [
          h(UiListItem, { title: 'A' }),
          h(UiListItem, { title: 'B' }),
          h(UiListItem, { title: 'C' }),
        ]),
    })
    const rows = w.findAllComponents(UiListItem)
    for (const r of rows) {
      expect(r.attributes('data-row')).toBe('')
      expect(r.element.parentElement!.matches('.ui-list > li')).toBe(true)
      // The row draws no line of its own.
      expect(r.classes().some((c) => c.includes('border-t'))).toBe(false)
    }
    expect(css).toContain(LINE)
  })

  it('a notice or a framed row stands alone: no line of its own, no line after it', () => {
    for (const props of [{ tone: 'info' }, { variant: 'outline' }, { variant: 'muted' }] as const) {
      const w = mount(UiListItem, { props: { title: 'A', ...props } })
      expect(w.attributes('data-row')).toBeUndefined()
    }
  })

  it('menu items are no divided list: no lines between them', async () => {
    const w = mount(UiMenu, {
      attachTo: document.body,
      slots: {
        trigger: () => h('button', { class: 'trigger' }, 'More'),
        default: () => [
          h(UiListItem, { as: 'button', title: 'A' }),
          h(UiListItem, { as: 'button', title: 'B' }),
        ],
      },
    })
    await new Promise((r) => setTimeout(r, 2))
    document.body.querySelector<HTMLElement>('.trigger')!.click()
    for (let i = 0; i < 4; i++) await nextTick()
    const items = [...document.body.querySelectorAll('[role="menuitem"]')]
    expect(items).toHaveLength(2)
    for (const i of items) expect(i.hasAttribute('data-row')).toBe(false)
    w.unmount()
  })
})

describe('UiListItem', () => {
  it('`as` picks the root: a label names the control in its actions', () => {
    const w = mount(UiListItem, {
      props: { title: 'Fee', as: 'label' },
      attrs: { for: 'sw' },
      slots: { actions: '<input id="sw" type="checkbox" />' },
    })
    expect(w.element.tagName).toBe('LABEL')
    expect(w.attributes('for')).toBe('sw')
    const listed = mount({ render: () => h(UiList, () => h(UiListItem, { title: 'A' })) })
    expect(listed.findComponent(UiListItem).element.parentElement!.tagName).toBe('LI')
    expect(mount(UiListItem, { props: { title: 'A' } }).element.tagName).toBe('DIV')
  })

  it('md is 16 by 16, sm is 12 by 8', () => {
    expect(mount(UiListItem, { props: { title: 'A' } }).classes()).toEqual(
      expect.arrayContaining(['px-4', 'py-4']),
    )
  })

  // The eye is told as the reader is: a row that leaves for another site ends in the arrow UiLink
  // draws, in place of the chevron that means a step deeper into this app.
  it('a row to another site ends in the new-tab arrow, not the chevron', () => {
    const w = mount(UiListItem, { props: { title: 'Docs', to: 'https://example.com' } })
    const arrow = w.find('svg.lucide-arrow-up-right-icon, svg.lucide-arrow-up-right')
    expect(arrow.exists()).toBe(true)
    expect(arrow.attributes('aria-hidden')).toBe('true')
    // The arrow points away from the app in any script: UiLink and UiButton never mirror it.
    expect(arrow.classes().filter((c) => c.startsWith('rtl:'))).toEqual([])
    expect(w.find('svg.lucide-chevron-right-icon, svg.lucide-chevron-right').exists()).toBe(false)
    const inApp = mount(UiListItem, { props: { title: 'Orders', to: '/orders' } })
    expect(inApp.find('svg.lucide-arrow-up-right-icon, svg.lucide-arrow-up-right').exists()).toBe(
      false,
    )
  })

  it('a row linking to another site opens in a new tab and says so', () => {
    const w = mount(UiListItem, { props: { title: 'Docs', to: 'https://example.com' } })
    expect(w.attributes('target')).toBe('_blank')
    expect(w.attributes('rel')).toBe('noopener noreferrer')
    expect(w.find('.sr-only').text()).toBe('opens in a new tab')
    const inner = mount(UiListItem, { props: { title: 'Docs', to: '/docs' } })
    expect(inner.attributes('target')).toBeUndefined()
    expect(inner.find('.sr-only').exists()).toBe(false)
  })
})

describe('UiListItem — a label row is a field', () => {
  const setting = (
    props: Record<string, unknown> = {},
    control: () => VNode | VNode[] = () => h(UiSwitch, { modelValue: false }),
  ) =>
    mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', title: 'Notifications', description: 'Email about events.', ...props },
      slots: { actions: control },
    })

  it('the title names the control, the description describes it, the row is its label', async () => {
    const w = setting()
    const sw = w.find('[role="switch"]')
    expect(w.element.tagName).toBe('LABEL')
    expect(w.attributes('for')).toBe(sw.attributes('id'))
    expect(document.getElementById(sw.attributes('aria-labelledby')!)!.textContent).toContain(
      'Notifications',
    )
    expect(document.getElementById(sw.attributes('aria-describedby')!)!.textContent).toBe(
      'Email about events.',
    )
    w.unmount()
  })

  it('an error replaces the description, is an alert and marks the control invalid', () => {
    const w = setting({ error: 'Accept the terms.' })
    const sw = w.find('[role="switch"]')
    expect(w.text()).not.toContain('Email about events.')
    const alert = w.find('[role="alert"]')
    expect(alert.text()).toBe('Accept the terms.')
    expect(sw.attributes('aria-describedby')).toBe(alert.attributes('id'))
    expect(sw.attributes('aria-invalid')).toBe('true')
    w.unmount()
  })

  it('When the error clears, the description comes back and describes the control again.', async () => {
    const w = setting({ error: 'Accept the terms.' })
    await w.setProps({ error: '' })
    const sw = w.find('[role="switch"]')
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).toContain('Email about events.')
    expect(document.getElementById(sw.attributes('aria-describedby')!)!.textContent).toBe(
      'Email about events.',
    )
    expect(sw.attributes('aria-invalid')).toBeUndefined()
    w.unmount()
  })

  it('required puts an asterisk on the title and aria-required on the control', () => {
    const w = setting({ required: true })
    expect(w.text()).toContain('*')
    expect(w.find('[role="switch"]').attributes('aria-required')).toBe('true')
    w.unmount()
  })

  it('in a label row with an error, focusInvalid lands on its control', () => {
    const fine = setting()
    expect(focusInvalid(fine.element as HTMLElement)).toBe(false)
    fine.unmount()
    const w = setting({ error: 'Accept the terms.' })
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(w.find('[role="switch"]').element)
    w.unmount()
  })

  it('a disabled control mutes the title and the cursor', () => {
    const w = setting({}, () => h(UiSwitch, { modelValue: false, disabled: true }))
    expect(w.classes()).toContain('has-[:disabled]:cursor-not-allowed')
    expect(w.find('p').classes()).toContain('group-[:has(:disabled)]/row:text-fg-muted')
    w.unmount()
  })

  it('two controls in one label row warn in dev: a label names one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = setting({}, () => [
      h(UiInput, { modelValue: '', ariaLabel: 'Pct' }),
      h(UiSwitch, { modelValue: false }),
    ])
    expect(warn.mock.calls.some(([m]) => String(m).includes('a label names one'))).toBe(true)
    w.unmount()
    warn.mockRestore()
  })

  it('a row that is not a label wires nothing: its controls keep their own names', () => {
    const w = mount(UiListItem, {
      props: { title: 'Plan' },
      slots: { actions: () => h(UiSwitch, { modelValue: false, ariaLabel: 'Pro' }) },
    })
    expect(w.find('[role="switch"]').attributes('aria-labelledby')).toBeUndefined()
    expect(w.find('[role="switch"]').attributes('aria-label')).toBe('Pro')
  })
})

describe('UiListItem — a held Enter', () => {
  const press = (el: Element, repeat: boolean) => {
    const e = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat,
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(e)
    return e.defaultPrevented
  }

  it('a held Enter on a command row is one press: its repeats click nothing', () => {
    const w = mount(UiListItem, { props: { as: 'button', title: 'Archive' } })
    expect(press(w.element, false)).toBe(false)
    expect(press(w.element, true)).toBe(true)
    w.unmount()
  })

  it('a held key other than Enter, and a row that is no command, keep their repeats', () => {
    const w = mount(UiListItem, { props: { as: 'button', title: 'Archive' } })
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', repeat: true, cancelable: true })
    w.element.dispatchEvent(arrow)
    expect(arrow.defaultPrevented).toBe(false)
    w.unmount()
    const plain = mount(UiListItem, { props: { title: 'Total' } })
    expect(press(plain.element, true)).toBe(false)
    plain.unmount()
  })
})

describe('UiListItem — review follow-ups', () => {
  it('a loading link row refuses the click in the capture phase, ahead of the router', () => {
    let navigated = 0
    // A router link binds its navigation on the anchor before any caller listener.
    const RouterishLink = defineComponent({
      props: { to: { type: String, default: '' } },
      setup(p, { slots }) {
        return () => h('a', { href: p.to, onClick: () => navigated++ }, slots.default?.())
      },
    })
    const w = mount(UiListItem, {
      props: { title: 'Open', to: '/records/7', loading: true },
      global: { plugins: [createGrani({ link: RouterishLink })] },
    })
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
    w.element.dispatchEvent(ev)
    expect(navigated).toBe(0)
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('click')).toBeUndefined()
  })

  it('a disabled external row says nothing about a new tab and draws no chevron', () => {
    const w = mount(UiListItem, {
      props: { title: 'Guide', to: 'https://vuejs.org', disabled: true },
    })
    expect(w.text()).not.toContain('new tab')
    expect(w.findAll('svg')).toHaveLength(0)
  })

  it('a notice description keeps the full ink of its tone', () => {
    const w = mount(UiListItem, {
      props: { tone: 'danger', title: 'Stopped', description: 'At row 42.' },
    })
    expect(w.findAll('p')[1]!.classes()).not.toContain('opacity-90')
  })

  it('a danger command row after a row stands under the line of its list', () => {
    const w = mount({
      render: () =>
        h(UiList, () => [
          h(UiListItem, { title: 'Owner' }),
          h(UiListItem, { as: 'button', title: 'Delete', tone: 'danger' }),
        ]),
    })
    const danger = w.findAllComponents(UiListItem)[1]!
    expect(danger.attributes('data-row')).toBe('')
    expect(
      danger.element.parentElement!.previousElementSibling!.querySelector(':scope > [data-row]'),
    ).not.toBeNull()
  })

  it('a row in a drawer section bleeds through the gutter and keeps its text on it', () => {
    const w = mount(
      { render: () => h(UiList, () => h(UiListItem, { title: 'Owner' })) },
      { global: { provide: { [SURFACE_GUTTER as symbol]: 'surface-md' } } },
    )
    expect(w.findComponent(UiList).classes()).toContain('-mx-surface-md')
    expect(w.findComponent(UiListItem).classes()).toContain('px-surface-md')
    const notice = mount(UiListItem, {
      props: { title: 'Note', tone: 'info' },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'surface-md' } },
    })
    expect(notice.classes()).not.toContain('-mx-surface-md')
  })

  it('a label row with its own text slot points at no missing id', () => {
    const w = mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', title: 'T', description: 'D' },
      slots: {
        default: () => h('span', 'Own'),
        actions: () => h(UiSwitch, { modelValue: false, ariaLabel: 'X' }),
      },
    })
    const sw = w.find('[role="switch"]')
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      const ids = sw.attributes(attr)
      if (ids) for (const id of ids.split(' ')) expect(document.getElementById(id)).not.toBeNull()
    }
    w.unmount()
  })

  it('error and required outside a label row are refused by TypeScript and render nothing', () => {
    // The rejection itself is in test/types/listItem.ts; a value passed past the types is not drawn.
    const w = mount(UiListItem, {
      props: { title: 'Plan', error: 'Bad', required: true } as Record<string, unknown>,
    })
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).not.toContain('*')
  })

  it('a label row inside a UiField warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiField, {
      props: { label: 'L' },
      slots: { default: () => h(UiListItem, { as: 'label', title: 'T' }) },
    })
    expect(warn.mock.calls.some(([m]) => String(m).includes('inside a UiField'))).toBe(true)
    warn.mockRestore()
  })

  it('a field with a clear cross in a label row is one control, no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', title: 'Search' },
      slots: { actions: () => h(UiInput, { modelValue: 'x', type: 'search' }) },
    })
    expect(warn.mock.calls.some(([m]) => String(m).includes('a label names one'))).toBe(false)
    w.unmount()
    warn.mockRestore()
  })
  it('a command row in a card shows its focus as a band, not a halo the card clips', () => {
    const w = mount(UiListItem, { props: { title: 'Move', as: 'button' } })
    expect(w.classes()).toContain('focus-visible:bg-surface-muted')
  })

  it('a label row with its own text slot and an error still shows the error the control points at', () => {
    const w = mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', error: 'Bad' },
      slots: {
        default: () => h('span', 'Own words'),
        actions: () => h(UiSwitch, { modelValue: false, ariaLabel: 'X' }),
      },
    })
    const ids = w.find('[role="switch"]').attributes('aria-describedby') ?? ''
    const shown = ids.split(' ').map((id) => document.getElementById(id)?.textContent?.trim())
    expect(shown).toContain('Bad')
    w.unmount()
  })

  it('a long unbroken title and description wrap inside the row', () => {
    const w = mount(UiListItem, { props: { title: 'a', description: 'b' } })
    expect(w.findAll('p').every((p) => p.classes().includes('break-words'))).toBe(true)
  })

  it('highlight marks the right letters when lowercasing changes the length', () => {
    const w = mount(UiListItem, { props: { title: 'İstanbul', highlight: 'stan' } })
    expect(w.find('mark').text()).toBe('stan')
    expect(
      mount(UiListItem, { props: { title: 'a+b (c)', highlight: '+b (' } })
        .find('mark')
        .text(),
    ).toBe('+b (')
  })

  it('disabled or loading on a row that is not a command is refused by TypeScript and disables nothing', () => {
    // The rejection itself is in test/types/listItem.ts; a value passed past the types disables nothing.
    const w = mount(UiListItem, {
      props: { title: 'T', as: 'label', disabled: true } as Record<string, unknown>,
    })
    expect(w.attributes('disabled')).toBeUndefined()
    expect(w.find('p').classes()).not.toContain('text-disabled-fg')
  })
})

describe('UiListItem — a step row', () => {
  it('a command row with step ends in a chevron beside its actions; a plain command has none', () => {
    const step = mount(UiListItem, {
      props: { as: 'button', step: true, title: 'Rules' },
      slots: { actions: () => '3' },
    })
    expect(step.element.tagName).toBe('BUTTON')
    expect(step.find('svg.lucide-chevron-right-icon, svg.lucide-chevron-right').exists()).toBe(true)
    expect(step.text()).toContain('3')
    const plain = mount(UiListItem, { props: { as: 'button', title: 'Archive' } })
    expect(plain.find('svg').exists()).toBe(false)
  })

  it('a loading step shows the spinner, not the chevron', () => {
    const w = mount(UiListItem, {
      props: { as: 'button', step: true, title: 'Rules', loading: true },
    })
    expect(w.find('svg.lucide-chevron-right-icon, svg.lucide-chevron-right').exists()).toBe(false)
  })
})

describe('UiListItem — a command row in a gutter', () => {
  it('a command row in a list that bleeds through a gutter spans it, not a gutter short of the edge', () => {
    const w = mount(
      { render: () => h(UiList, () => h(UiListItem, { as: 'button', title: 'Rules' })) },
      { global: { provide: { [SURFACE_GUTTER as symbol]: 'surface-md' } } },
    )
    expect(w.findComponent(UiList).classes()).toContain('-mx-surface-md')
    expect(w.findComponent(UiListItem).classes()).toContain('w-full')
  })
})

describe('UiListItem — a bare icon button at the end', () => {
  it('the glyph, not its square, stands on the row inset: the button steps out by its own air', async () => {
    const { default: UiIconButton } = await import('./UiIconButton.vue')
    const { X } = await import('@lucide/vue')
    const w = mount(UiListItem, {
      props: { title: 'Fruit' },
      slots: {
        actions: () =>
          h(UiIconButton, { icon: X, ariaLabel: 'Remove', size: 'xs', variant: 'ghost' }),
      },
    })
    const actions = w.find('[data-bare]').element.parentElement!
    expect(w.find('[data-bare]').attributes('data-bare')).toBe('xs')
    expect(actions.className).toContain('[&>[data-bare=xs]:last-child]:-me-[0.4375rem]')
    const framed = mount(UiIconButton, { props: { icon: X, ariaLabel: 'Remove', size: 'xs' } })
    expect(framed.attributes('data-bare')).toBeUndefined()
  })
})

describe('UiListItem — lit', () => {
  it('a lit row takes a moment of brand; unlit it has none', async () => {
    const w = mount(UiListItem, { props: { title: 'Fruit', lit: true } })
    expect(w.classes()).toContain('ui-row-lit')
    await w.setProps({ lit: false })
    expect(w.classes()).not.toContain('ui-row-lit')
  })
})

describe('UiListItem — the ink of a glyph in #actions', () => {
  it('a glyph in #actions is muted by the row; a row in a tone keeps its ink', () => {
    const plain = mount(UiListItem, {
      props: { as: 'button', title: 'Archive' },
      slots: { actions: () => h('svg') },
    })
    expect(plain.find('svg').element.parentElement!.className).toContain('[&>svg]:text-fg-subtle')
    const danger = mount(UiListItem, {
      props: { as: 'button', title: 'Delete', tone: 'danger' },
      slots: { actions: () => h('svg') },
    })
    expect(danger.find('svg').element.parentElement!.className).not.toContain('text-fg-subtle')
  })
})

describe('UiListItem — one height per step', () => {
  it('a row of a list is 44 at sm and 56 at md, the line inside it; a row outside a list keeps its own', () => {
    const list = mount({
      render: () =>
        h('div', [h(UiListItem, { size: 'sm', title: 'A' }), h(UiListItem, { title: 'B' })]),
    })
    const [sm, md] = list.findAllComponents(UiListItem)
    expect(sm!.classes()).toContain('min-h-11')
    expect(md!.classes()).toContain('min-h-14')
    const notice = mount(UiListItem, { props: { tone: 'danger', title: 'Failed' } })
    expect(notice.classes()).not.toContain('min-h-14')
  })
})

describe('UiListItem — review follow-ups, second pass', () => {
  const warns = () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    return {
      said: () => spy.mock.calls.map((c) => String(c[0])),
      done: () => spy.mockRestore(),
    }
  }

  it('a row after an open UiReveal block draws the line above it', () => {
    const w = mount(UiCard, {
      global: { stubs: { transition: false } },
      props: { padded: false },
      slots: {
        default: () =>
          h(UiList, () => [
            h(
              UiReveal,
              { open: true },
              {
                trigger: () => h(UiListItem, { title: 'Reminders' }),
                default: () => 'Fields',
              },
            ),
            h(UiListItem, { title: 'Digest', class: 'next' }),
          ]),
      },
    })
    const block = w.find('[data-row-block]').element
    const next = w.find('.next').element
    // The block and the next row stand in neighboring items: the list's line falls between them.
    expect(block.parentElement!.nextElementSibling).toBe(next.parentElement)
    expect(next.matches('.ui-list > li:has(> [data-row-block]) + li > [data-row]')).toBe(true)
  })

  it('a button in the actions of a command row warns in dev; a badge does not', async () => {
    const log = warns()
    mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'button', title: 'Archive' },
      slots: { actions: () => h('button', 'Undo') },
    })
    mount(UiListItem, {
      attachTo: document.body,
      props: { to: '/x', title: 'Open' },
      slots: { actions: () => h('span', 'New') },
    })
    await nextTick()
    expect(log.said().filter((m) => m.includes('a control inside a control'))).toHaveLength(1)
    log.done()
    document.body.innerHTML = ''
  })

  it('a step row chevron mirrors under rtl, slides only when enabled, and its text aligns to the start', () => {
    const w = mount(UiListItem, { props: { as: 'button', step: true, title: 'Rules' } })
    const chevron = w.find('svg').classes()
    expect(chevron).toEqual(
      expect.arrayContaining([
        'rtl:-scale-x-100',
        'group-[:is(:enabled,a):hover]:translate-x-0.5',
        'rtl:group-[:is(:enabled,a):hover]:-translate-x-0.5',
      ]),
    )
    expect(chevron).not.toContain('group-hover:translate-x-0.5')
    expect(w.classes()).toContain('text-start')
    expect(w.classes()).not.toContain('text-left')
  })

  it('a click on the title of a label row emits click once', async () => {
    // Ids restart with every test app: a row left over would take the label's click.
    document.body.innerHTML = ''
    const w = mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', title: 'Reminders' },
      slots: { actions: () => h(UiSwitch, { modelValue: false }) },
    })
    await nextTick()
    // Vue drops a click in the millisecond its listener came.
    await new Promise((r) => setTimeout(r, 2))
    // The browser follows a click on the words with one on the control; the row reports one.
    w.find('p').element.click()
    await nextTick()
    expect(w.emitted('click')).toHaveLength(1)
    w.unmount()
  })

  it('an unsafe address warns in dev and is a disabled button', () => {
    const log = warns()
    const w = mount(UiListItem, { props: { to: 'javascript:alert(1)', title: 'Open' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('disabled')).toBeDefined()
    expect(log.said().some((m) => m.includes('is refused'))).toBe(true)
    log.done()
  })

  it('loading wins over disabled: the title keeps its ink', () => {
    const w = mount(UiListItem, {
      props: { as: 'button', title: 'Sync', disabled: true, loading: true },
    })
    expect(w.find('p').classes()).not.toContain('text-disabled-fg')
  })

  it('a notice names its tone to a screen reader and draws its glyph; a glyph of the caller wins', () => {
    const w = mount(UiListItem, { props: { tone: 'warning', description: 'Add the June rate.' } })
    expect(w.find('.sr-only').text()).toContain('Warning')
    expect(w.find('svg').classes()).toContain('text-warning-border')
    const own = mount(UiListItem, {
      props: { tone: 'warning', description: 'x' },
      slots: { media: () => h('i', { class: 'own' }) },
    })
    expect(own.find('.own').exists()).toBe(true)
    expect(own.find('svg').exists()).toBe(false)
    const command = mount(UiListItem, { props: { as: 'button', tone: 'danger', title: 'Delete' } })
    expect(command.find('.sr-only').exists()).toBe(false)
  })

  it('a nameless label row warns in dev', async () => {
    const log = warns()
    mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label' },
      slots: { actions: () => h(UiSwitch, { modelValue: false }) },
    })
    await nextTick()
    expect(log.said()).toContain(
      '[grani] UiListItem as="label" without a title: name the control in `#actions`.',
    )
    log.done()
    document.body.innerHTML = ''
  })

  it("names the problem, never the refused address or the row's own title", async () => {
    document.body.innerHTML = ''
    const log = warns()
    const refused = mount(UiListItem, {
      props: { to: 'javascript:alert(document.cookie)', title: 'Open' },
    })
    expect(log.said().some((m) => m.includes('document.cookie'))).toBe(false)
    refused.unmount()

    const secretTitle = 'Sofia Martinez — 4242 care notes'
    mount(UiListItem, {
      attachTo: document.body,
      props: { as: 'label', title: secretTitle },
      slots: {
        default: () => h(UiInput, { modelValue: '', ariaLabel: secretTitle }),
        actions: () => h(UiInput, { modelValue: '', ariaLabel: 'other' }),
      },
    })
    await nextTick()
    expect(log.said().some((m) => m.includes(secretTitle))).toBe(false)
    log.done()
    document.body.innerHTML = ''
  })
})

describe('UiListItem — rules', () => {
  it('A click anywhere on a setting row, its title included, toggles the switch it names.', async () => {
    const on = ref(false)
    const w = mount(
      {
        render: () =>
          h(
            UiListItem,
            { as: 'label', title: 'Weekly digest', description: 'Every Monday.' },
            {
              actions: () =>
                h(UiSwitch, {
                  modelValue: on.value,
                  'onUpdate:modelValue': (v: boolean) => (on.value = v),
                }),
            },
          ),
      },
      { attachTo: document.body },
    )
    // Vue drops an event stamped in the millisecond its listener was attached: a person never
    // clicks that fast, a warm test run does.
    await new Promise((r) => setTimeout(r, 5))
    await w.find('p').trigger('click')
    expect(on.value).toBe(true)
    await new Promise((r) => setTimeout(r, 5))
    await w.findAll('p')[1]!.trigger('click')
    expect(on.value).toBe(false)
    w.unmount()
  })

  it('A notice says its tone in words before its title, not by color alone.', () => {
    for (const [tone, word] of [
      ['info', 'Note'],
      ['success', 'Done'],
      ['warning', 'Warning'],
      ['danger', 'Error'],
    ] as const) {
      const w = mount(UiListItem, { props: { tone, title: 'Rate missing' } })
      expect(w.find('.sr-only').text()).toBe(`${word}:`)
      expect(w.text().indexOf(`${word}:`)).toBeLessThan(w.text().indexOf('Rate missing'))
    }
  })
})

describe('UiListItem — review follow-ups', () => {
  // The glyph of a tone is what a notice shows beside its edge: color never carries the tone alone.
  it('each tone of a notice draws its own glyph, and #media replaces it', () => {
    const mark = (svg: { classes: () => string[] }) =>
      svg
        .classes()
        .filter((c) => c.startsWith('lucide-'))
        .join(' ')
    const drawn = new Set<string>()
    for (const tone of ['info', 'success', 'warning', 'danger'] as const) {
      const w = mount(UiListItem, { props: { tone, title: 'Rate missing' } })
      const own = mark(mount(TONE_GLYPH[tone]!).find('svg'))
      expect(own, `${tone} has a glyph`).not.toBe('')
      expect(mark(w.find('svg')), tone).toBe(own)
      drawn.add(own)
    }
    expect(drawn.size, 'four tones, four glyphs').toBe(4)
    const own = mount(UiListItem, {
      props: { tone: 'info', title: 'Note' },
      slots: { media: '<i class="own" />' },
    })
    expect(own.find('svg').exists()).toBe(false)
    expect(own.find('.own').exists()).toBe(true)
  })
})
