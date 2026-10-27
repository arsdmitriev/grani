import { mount } from '@vue/test-utils'
import { computed, createCommentVNode, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import UiHeader from './UiHeader.vue'
import UiCard from './UiCard.vue'
import UiModal from './UiModal.vue'
import UiStack from './UiStack.vue'
import UiCrudDrawer from './UiCrudDrawer.vue'
import UiPopover from './UiPopover.vue'
import UiFilterList from './UiFilterList.vue'
import { CARD_DEPTH, CARD_TITLE_ID, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

describe('UiHeader', () => {
  it('the title is the h1; the description is one line under it', () => {
    const w = mount(UiHeader, { props: { title: 'Transactions', description: 'This month' } })
    expect(w.find('h1').text()).toBe('Transactions')
    expect(w.find('p').text()).toBe('This month')
    expect(
      mount(UiHeader, { props: { title: 'Users' } })
        .find('p')
        .exists(),
    ).toBe(false)
  })

  it('actions sit on the right, centered on a lone title and on a title with its description alike', () => {
    const lone = mount(UiHeader, {
      props: { title: 'Users' },
      slots: { actions: '<button class="add">Add</button>' },
    })
    expect(lone.find('.add').exists()).toBe(true)
    expect(lone.classes()).toContain('items-center')
    const withText = mount(UiHeader, {
      props: { title: 'Users', description: 'Who can sign in' },
      slots: { actions: '<button>Add</button>' },
    })
    expect(withText.classes()).toContain('items-center')
  })
})

describe('UiHeader — legend', () => {
  it('a legend is the section title on a line: capitals, no h1, no description', () => {
    const w = mount(UiHeader, { props: { variant: 'legend', title: 'Billing', description: 'x' } })
    expect(w.find('h1').exists()).toBe(false)
    const h = w.find('h2')
    expect(h.text()).toBe('Billing')
    expect(h.classes()).toEqual(expect.arrayContaining(['uppercase', 'text-xs/4.5']))
    expect(w.classes().join(' ')).toContain("before:content-['']")
    expect(w.find('p').exists()).toBe(false)
  })
})

describe('UiHeader — review follow-ups', () => {
  it('an action beside a title with a description centers on the two lines, never the top', () => {
    const w = mount(UiHeader, {
      props: { title: 'Profile', description: 'Your name, password and devices.' },
      slots: { actions: '<button>Sign out</button>' },
    })
    const row = w.find('div')
    expect(row.classes()).toContain('items-center')
    expect(row.classes()).not.toContain('items-start')
  })

  it('a legend after other content stands 48 below the content before it over a 16 gap; the first one does not move', () => {
    const w = mount(UiHeader, { props: { title: 'Billing', variant: 'legend' } })
    expect(w.classes()).toContain('[&:not(:first-child)]:mt-8')
  })

  it("a legend alone is an h2, stands in for an untitled card's title, and sits one level under a titled one", () => {
    const legend = (provide: Record<symbol, unknown>) =>
      mount(UiHeader, { props: { title: 'Billing', variant: 'legend' }, global: { provide } })
    expect(legend({}).find('h2').exists()).toBe(true)
    // A drawer's section: the drawer is depth 1, its untitled card gives depth 2.
    expect(
      legend({ [CARD_DEPTH]: 2, [CARD_TITLE_ID]: computed(() => undefined) })
        .find('h3')
        .exists(),
    ).toBe(true)
    // A top-level card titled h2: the legend in its body is h3, not a second h2.
    expect(
      legend({ [CARD_DEPTH]: 1, [CARD_TITLE_ID]: computed(() => 'card-title') })
        .find('h3')
        .exists(),
    ).toBe(true)
  })

  it("in a surface the dash and its gap put the legend's title on the gutter, whatever the gutter", () => {
    const at = (gutter: string) =>
      mount(UiHeader, {
        props: { title: 'Billing', variant: 'legend' },
        global: { provide: { [SURFACE_GUTTER]: gutter } },
      }).classes()
    expect(at('surface')).toEqual(
      expect.arrayContaining([
        '-mx-surface',
        'before:w-[calc(var(--space-surface)-0.5rem)]',
        'gap-2',
      ]),
    )
    expect(at('drawer')).toEqual(
      expect.arrayContaining(['-mx-drawer', 'before:w-[calc(var(--space-drawer)-0.5rem)]']),
    )
    expect(mount(UiHeader, { props: { title: 'Billing', variant: 'legend' } }).classes()).toContain(
      'before:w-3',
    )
  })

  it('the page variant warns in dev inside a card, modal or drawer; a legend warns for what it drops', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiHeader, { props: { title: 'Profile' }, global: { provide: { [CARD_DEPTH]: 1 } } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('use `legend`'))
    warn.mockClear()
    mount(UiHeader, {
      props: { title: 'Contacts', variant: 'legend' },
      slots: { actions: '<button>Add</button>' },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not shown'))
    warn.mockClear()
    mount(UiHeader, { props: { title: 'Users' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a legend in an unpadded surface stands on the row inset', () => {
    const legend = (inset: string) =>
      mount(UiHeader, {
        props: { title: 'Billing', variant: 'legend' },
        global: { provide: { [SURFACE_GUTTER as symbol]: null, [ROW_INSET as symbol]: inset } },
      })
    const card = legend('surface')
    expect(card.classes()).toEqual(
      expect.arrayContaining(['before:w-[calc(var(--space-surface)-0.5rem)]', 'gap-2']),
    )
    expect(card.classes().some((c) => c.startsWith('-mx-'))).toBe(false)
    expect(legend('field').classes()).toContain('before:w-1')
  })
})

describe('UiHeader — review follow-ups', () => {
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await new Promise((r) => setTimeout(r))
  }
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })

  it('a legend in a modal declared inside a titled card is h3 under the window, and a filter list is named by the window', async () => {
    const w = mount(UiCard, {
      attachTo: document.body,
      props: { title: 'Account' },
      slots: {
        default: () =>
          h(UiModal, { title: 'Rename', open: true }, () => [
            h(UiHeader, { variant: 'legend', title: 'Contact' }),
            h(UiFilterList, { items: [{ value: 'a', label: 'A' }], modelValue: [] }),
          ]),
      },
    })
    await settle()
    const legend = [...document.querySelectorAll('h3')].find((n) => n.textContent === 'Contact')
    expect(legend).toBeDefined()
    const list = document.querySelector('[role=listbox]')!
    const name = document.getElementById(list.getAttribute('aria-labelledby')!)!
    expect(name.textContent).toBe('Rename')
    w.unmount()
  })

  it('a legend directly in a drawer body is h3 under the drawer h2', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: { default: () => h(UiHeader, { variant: 'legend', title: 'Contact' }) },
    })
    await settle()
    const legend = [...document.querySelectorAll('h2, h3, h4')].find(
      (n) => n.textContent === 'Contact',
    )
    expect(legend?.tagName).toBe('H3')
  })

  it('a popover declared inside a titled card does not name its filter list by the card', async () => {
    mount(UiCard, {
      attachTo: document.body,
      props: { title: 'Account' },
      slots: {
        default: () =>
          h(
            UiPopover,
            { open: true },
            {
              trigger: () => h('button', 'Filter'),
              default: () =>
                h(UiFilterList, { items: [{ value: 'a', label: 'A' }], modelValue: [] }),
            },
          ),
      },
    })
    await settle()
    const list = document.querySelector('[role=listbox]')!
    const by = list.getAttribute('aria-labelledby')
    expect(by ? document.getElementById(by)?.textContent : '').not.toBe('Account')
  })

  it('a legend title longer than its row wraps inside it, and the line keeps a stub', () => {
    const w = mount(UiHeader, { props: { variant: 'legend', title: 'Notification preferences' } })
    const title = w.find('h2')
    expect(title.classes()).toEqual(expect.arrayContaining(['min-w-0', '[overflow-wrap:anywhere]']))
    expect(title.classes()).not.toContain('shrink-0')
    expect(w.classes()).toContain('after:min-w-4')
  })

  it('a long unbroken word in a page title or its description wraps', () => {
    const w = mount(UiHeader, { props: { title: 'SUPPLIER-RECONCILIATION', description: 'x' } })
    expect(w.find('h1').classes()).toContain('[overflow-wrap:anywhere]')
    expect(w.find('p').classes()).toContain('[overflow-wrap:anywhere]')
  })

  it('an action slot that renders only a comment draws no wrapper', () => {
    const w = mount(UiHeader, {
      props: { title: 'Users' },
      slots: { actions: () => [createCommentVNode('off')] },
    })
    expect(w.element.children).toHaveLength(1)
  })

  it('the legend lines are borders, kept in forced colors', () => {
    const w = mount(UiHeader, { props: { variant: 'legend', title: 'Billing' } })
    expect(w.classes()).toEqual(
      expect.arrayContaining(['before:border-t', 'after:border-t', 'after:border-border']),
    )
    expect(w.classes()).not.toContain('after:bg-border')
  })

  it('a legend first in a card of rows keeps room above it, off the frame', () => {
    const w = mount(UiCard, {
      props: { padded: false },
      slots: { default: () => h(UiHeader, { variant: 'legend', title: 'Notifications' }) },
    })
    const legend = w.find('h2, h3').element.parentElement!
    expect(legend.classList).toContain('first:pt-4')
    const padded = mount(UiCard, {
      slots: { default: () => h(UiHeader, { variant: 'legend', title: 'Contact' }) },
    })
    expect(padded.find('h2, h3').element.parentElement!.classList).not.toContain('first:pt-4')
  })
})

describe('UiHeader — a legend that opens a window or a drawer', () => {
  const settle = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await new Promise((r) => setTimeout(r))
  }
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.removeAttribute('style')
  })
  const legend = () => h(UiHeader, { variant: 'legend', title: 'Contact' })
  const headLined = (title: string) =>
    [...document.querySelectorAll('h2')]
      .find((n) => n.textContent?.trim() === title)!
      .closest('.border-b') !== null

  it('a window whose body opens with a legend draws no header line, the legend is the line', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: { default: () => h('div', { class: 'flex flex-col gap-4' }, [legend(), 'Email']) },
    })
    await settle()
    expect(headLined('Client')).toBe(false)
  })

  it('A window whose body opens with a stack that opens with a legend draws no header line.', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: { default: () => h(UiStack, null, { default: () => [legend(), 'Email'] }) },
    })
    await settle()
    expect(headLined('Client')).toBe(false)
  })

  it('a window whose body opens with a card or text keeps its header line', async () => {
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Client', open: true },
      slots: { default: () => h(UiCard, { title: 'Contact' }, () => [legend()]) },
    })
    await settle()
    expect(headLined('Client')).toBe(true)
  })

  it('a drawer whose first section opens with a legend draws no header line', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Client', open: true, divided: false },
      slots: {
        default: () => [h(UiCard, null, () => [legend()]), h(UiCard, null, () => [legend()])],
      },
    })
    await settle()
    expect(headLined('Client')).toBe(false)
  })

  it('a drawer that loads, or whose record head comes first, keeps its header line', async () => {
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Loading', open: true, loading: true },
      slots: { default: () => [h(UiCard, null, () => [legend()])] },
    })
    mount(UiCrudDrawer, {
      attachTo: document.body,
      props: { title: 'Record', open: true, divided: false },
      slots: {
        default: () => [h(UiCard, null, () => [h('p', 'Head')]), h(UiCard, null, () => [legend()])],
      },
    })
    await settle()
    expect(headLined('Loading')).toBe(true)
    expect(headLined('Record')).toBe(true)
  })
})

describe('UiHeader — review follow-ups', () => {
  it('A page header has no margin of its own: the stack it stands in spaces it.', () => {
    const w = mount(UiHeader, { props: { title: 'Users', description: 'Who can sign in.' } })
    expect(w.classes().filter((c) => /^-?m[tbyxlr]?-/.test(c))).toEqual([])
  })
})
