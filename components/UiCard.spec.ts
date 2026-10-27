import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommentVNode, defineComponent, h, inject, nextTick, ref } from 'vue'
import UiNoData from './UiNoData.vue'
import UiCard from './UiCard.vue'
import UiAspectRatio from './UiAspectRatio.vue'
import UiHeader from './UiHeader.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiSpinner from './UiSpinner.vue'
import { CARD_TITLE_ID, FLAT_CARD, SURFACE_GUTTER } from '../utils/surface'
import UiFilterList from './UiFilterList.vue'
import UiSeparator from './UiSeparator.vue'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import UiTabs from './UiTabs.vue'

const body = (w: ReturnType<typeof mount>) => w.find('.min-w-0.flex-1')

describe('UiCard — surface', () => {
  it('renders the body inside the flat card shell', () => {
    const w = mount(UiCard, { slots: { default: '<p class="mark">x</p>' } })
    expect(w.find('.mark').exists()).toBe(true)
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-card', 'border', 'bg-surface']))
    expect(w.classes().some((c) => c.startsWith('shadow'))).toBe(false)
  })

  it('has no header when nothing asks for one', () => {
    const w = mount(UiCard, { slots: { default: 'x' } })
    expect(w.find('h2, h3').exists()).toBe(false)
    // The one child beside the body is the card's live region, on the page before its words.
    expect([...w.element.children].filter((e) => e.getAttribute('role') !== 'status')).toHaveLength(
      1,
    )
  })

  it('the gutter is 16 by default and 24 at md; padded false runs the body edge to edge', () => {
    expect(body(mount(UiCard, { slots: { default: 'x' } })).classes()).toContain('p-surface')
    expect(
      body(mount(UiCard, { props: { size: 'md' }, slots: { default: 'x' } })).classes(),
    ).toContain('p-surface-md')
    const flush = body(mount(UiCard, { props: { padded: false }, slots: { default: 'x' } }))
    expect(flush.classes().some((c) => /^p-\d/.test(c))).toBe(false)
  })
})

describe('UiCard — header', () => {
  it('renders title and description', () => {
    const w = mount(UiCard, {
      props: { title: 'Balance', description: 'Updated today' },
      slots: { default: 'x' },
    })
    expect(w.find('h2').text()).toBe('Balance')
    expect(w.text()).toContain('Updated today')
  })

  it('renders an action alone, without a title', () => {
    const w = mount(UiCard, { slots: { default: 'x', actions: '<span class="act">A</span>' } })
    expect(w.find('.act').exists()).toBe(true)
    expect(w.find('h2, h3').exists()).toBe(false)
  })

  it('#header replaces the title line entirely', () => {
    const w = mount(UiCard, {
      props: { title: 'Ignored' },
      slots: { default: 'x', header: '<div class="strip">Tabs</div>' },
    })
    expect(w.find('.strip').exists()).toBe(true)
    expect(w.find('h2, h3').exists()).toBe(false)
  })

  it('divided draws a rule under the header and gives the body its full padding', () => {
    const plain = mount(UiCard, { props: { title: 'T', divided: false }, slots: { default: 'x' } })
    expect(plain.find('.border-b').exists()).toBe(false)
    const divided = mount(UiCard, { props: { title: 'T', divided: true }, slots: { default: 'x' } })
    expect(divided.find('.border-b').exists()).toBe(true)
    expect(divided.find('.border-b').classes()).not.toContain('pb-0')
  })
})

describe('UiCard — a section of the page', () => {
  it('the heading level follows the nesting: h2 on the page, h3 inside a card', () => {
    const w = mount(UiCard, {
      props: { title: 'Outer' },
      slots: { default: () => h(UiCard, { title: 'Inner' }, () => 'x') },
    })
    expect(w.find('h2').text()).toBe('Outer')
    expect(w.find('h3').text()).toBe('Inner')
  })
})

describe('UiCard — footer', () => {
  it('renders only when the slot is given, under a rule and without a fill (one way to say a border)', () => {
    expect(
      mount(UiCard, { slots: { default: 'x' } })
        .find('.border-t')
        .exists(),
    ).toBe(false)
    const w = mount(UiCard, {
      slots: { default: 'x', footer: '<button class="save">Save</button>' },
    })
    const footer = w.find('.border-t')
    expect(footer.exists()).toBe(true)
    expect(footer.classes().some((c) => c.startsWith('bg-'))).toBe(false)
    expect(footer.find('.save').exists()).toBe(true)
  })

  it('a footer is one number: its inset and the gap between items are equal, 8 at sm and 12 at md', () => {
    const w = mount(UiCard, { slots: { default: 'x', footer: 'f' } })
    expect(w.find('.border-t').classes()).toEqual(
      expect.arrayContaining(['justify-end', 'gap-2', 'p-2']),
    )
    const md = mount(UiCard, { props: { size: 'md' }, slots: { default: 'x', footer: 'f' } })
    expect(md.find('.border-t').classes()).toEqual(expect.arrayContaining(['gap-3', 'p-3']))
    expect(md.find('.border-t').classes()).not.toContain('px-5')
    const muted = mount(UiCard, { props: { footerVariant: 'muted' }, slots: { footer: 'f' } })
    expect(muted.find('.border-t').classes()).toContain('bg-surface-muted')
  })

  it("a full-width action alone in the footer stands on the body's gutter, lined up with the fields", () => {
    const w = mount(UiCard, { slots: { default: 'x', footer: 'f' } })
    expect(w.find('.border-t').classes()).toContain(
      'has-[>:is(button,a).w-full:only-child]:p-surface',
    )
    const md = mount(UiCard, { props: { size: 'md' }, slots: { default: 'x', footer: 'f' } })
    expect(md.find('.border-t').classes()).toContain(
      'has-[>:is(button,a).w-full:only-child]:p-surface-md',
    )
  })

  it('without footerPadded the footer children run edge to edge and share the width', () => {
    const w = mount(UiCard, {
      props: { footerPadded: false },
      slots: { footer: '<button>Stay</button><button>Leave</button>' },
    })
    expect(w.find('.border-t').classes()).toEqual(
      expect.arrayContaining(['[&>*]:flex-1', '[&>*+*]:border-s', '[&>*+*]:border-s-border']),
    )
    expect(
      w
        .find('.border-t')
        .classes()
        .some((c) => /^p[xy]?-\d/.test(c)),
    ).toBe(false)
  })

  it('uses semantic tokens only', () => {
    const w = mount(UiCard, {
      props: { title: 'T', description: 'D', divided: true },
      slots: { default: 'x', footer: 'f', actions: 'a' },
    })
    expect(w.html()).not.toMatch(/\b(?:bg|text|border)-(?:gray|slate|zinc)-\d{2,3}\b/)
    expect(w.html()).not.toContain('dark:')
  })
})

describe('UiCard — inside an overlay', () => {
  it('is flat: no frame, no padding on the header or the body; divided is a separator', () => {
    const w = mount(UiCard, {
      props: { title: 'Totals', divided: true },
      slots: { default: 'x' },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    expect(w.classes()).not.toContain('rounded-card')
    expect(w.findAll('[class]').some((n) => n.classes().some((c) => /^p[xy]?-\d/.test(c)))).toBe(
      false,
    )
    expect(w.find('[role="separator"]').exists()).toBe(true)
    expect(w.find('.border-b').exists()).toBe(false)
  })

  it('a flat or plain card warns in dev for a tone it cannot draw, and flat for an image', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiCard, {
      props: { tone: 'danger' },
      slots: { image: '<img alt="" />' },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    mount(UiCard, { props: { tone: 'warning', variant: 'plain' } })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.filter((m) => m.includes('`tone`'))).toHaveLength(2)
    expect(said.some((m) => m.includes('`#image`'))).toBe(true)
    warn.mockRestore()
  })

  it('a disabled section of an overlay is a disabled group too, not muted words alone', () => {
    const w = mount(UiCard, {
      props: { disabled: true, title: 'Access' },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
  })

  it('a tab of a whole header and an edge-to-edge footer button ring inward, inside the frame', () => {
    const w = mount(UiCard, {
      props: { footerPadded: false },
      slots: {
        header: '<div role="tablist"><button role="tab">One</button></div>',
        default: 'Body',
        footer: '<button>Stay</button><button>Leave</button>',
      },
    })
    const inset = 'shadow-(--ui-ring-inset)'
    expect(w.find('[role=tablist]').element.parentElement!.className).toContain(
      `[&_[role=tab]:focus-visible]:${inset}`,
    )
    expect(w.findAll('button').at(-1)!.element.parentElement!.className).toContain(
      `[&>*:focus-visible]:${inset}`,
    )
    const padded = mount(UiCard, { slots: { footer: '<button>Save</button>' } })
    expect(padded.find('button').element.parentElement!.className).not.toContain('inset')
  })

  it('the refresh dim does not transition under reduced motion', () => {
    const w = mount(UiCard, { props: { loading: true }, slots: { default: 'Rows' } })
    const body = w.find('.opacity-60')
    expect(body.classes()).toContain('motion-safe:transition-opacity')
    expect(body.classes()).not.toContain('transition-opacity')
  })
})

describe('UiCard — a body that opens with a legend', () => {
  const legend = (title = 'Contact') => h(UiHeader, { variant: 'legend', title })

  it('draws no line under its title: the legend is the line', () => {
    const w = mount(UiCard, {
      props: { title: 'Account' },
      slots: { default: () => h('div', { class: 'flex flex-col gap-4' }, [legend(), 'Email']) },
    })
    expect(w.find('h2').element.closest('.border-b')).toBeNull()
  })

  it('keeps the line when told so, and when the legend comes later', () => {
    const told = mount(UiCard, {
      props: { title: 'Account', divided: true },
      slots: { default: () => [legend()] },
    })
    expect(told.find('h2').element.closest('.border-b')).not.toBeNull()
    const later = mount(UiCard, {
      props: { title: 'Account' },
      slots: { default: () => [h('p', 'Intro'), legend()] },
    })
    expect(later.find('h2').element.closest('.border-b')).not.toBeNull()
  })
})

describe('UiCard — review follow-ups: the legend lookup', () => {
  const legend = (title = 'Contact') => h(UiHeader, { variant: 'legend', title })
  const lined = (w: ReturnType<typeof mount>) => w.find('h2').element.closest('.border-b') !== null

  it('a body that opens with a scoped-slot component renders and keeps the title line', () => {
    const Scoped = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h('div', slots.default?.({ close: () => {} })),
    })
    const w = mount(UiCard, {
      props: { title: 'Filters' },
      slots: {
        default: () =>
          h(Scoped, null, {
            default: ({ close }: { close: () => void }) => [legend(), String(!!close)],
          }),
      },
    })
    expect(w.find('h2').exists()).toBe(true)
    expect(lined(w)).toBe(true)
  })

  it('a card whose body opens with another titled card keeps its title line', () => {
    const w = mount(UiCard, {
      props: { title: 'Outer' },
      slots: { default: () => h(UiCard, { title: 'Inner' }, () => [legend()]) },
    })
    expect(lined(w)).toBe(true)
  })

  it('an empty or first-loading card whose default slot opens with a legend keeps its title line', () => {
    const empty = mount(UiCard, {
      props: { title: 'Invoices', empty: true },
      slots: { default: () => [legend()], empty: () => h('p', 'None') },
    })
    expect(lined(empty)).toBe(true)
  })

  it('a legend in a plain wrapper still stands in for the title line', () => {
    const w = mount(UiCard, {
      props: { title: 'Account' },
      slots: { default: () => h('div', [h('div', [legend()])]) },
    })
    expect(lined(w)).toBe(false)
  })
})

describe('UiCard — among fields', () => {
  it("a card of rows in a drawer section keeps its rows on the fields' value line (12)", () => {
    const w = mount(UiCard, {
      props: { padded: false },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'drawer' } },
      slots: { default: () => h(UiListItem, { as: 'button', size: 'sm', title: 'Archive' }) },
    })
    expect(w.findComponent(UiListItem).classes()).toContain('px-3')
  })
})

describe('UiCard — empty', () => {
  const empty = {
    empty: () => h(UiNoData, { description: 'No invoices yet' }),
    default: 'rows',
  }

  it('empty puts #empty in the body, in the middle, and UiNoData drops its own frame', () => {
    const w = mount(UiCard, { props: { title: 'Invoices', empty: true }, slots: empty })
    expect(w.text()).toContain('No invoices yet')
    expect(w.text()).not.toContain('rows')
    const plate = w.findComponent(UiNoData)
    expect(plate.classes()).not.toContain('border-dashed')
    expect(plate.element.parentElement!.className).toContain('items-center')
  })

  it('a first load wins over empty, and without empty the body is the default slot', () => {
    const loading = mount(UiCard, { props: { empty: true, loading: true }, slots: empty })
    expect(loading.findComponent(UiNoData).exists()).toBe(false)
    expect(mount(UiCard, { slots: empty }).text()).toContain('rows')
  })

  it('UiNoData on a page keeps its dashed frame', () => {
    expect(mount(UiNoData, { props: { description: 'x' } }).classes()).toContain('border-dashed')
  })
})

describe('UiCard — divider', () => {
  it('#divider stands in place of the footer line, between the body and the footer', () => {
    const w = mount(UiCard, {
      slots: { default: 'body', divider: '<div class="bar" />', footer: 'foot' },
    })
    const bar = w.find('.bar')
    const footer = bar.element.parentElement!.nextElementSibling as HTMLElement
    expect(footer.textContent).toBe('foot')
    expect(footer.className).not.toContain('border-t')
    expect(bar.element.parentElement!.previousElementSibling!.textContent).toContain('body')
  })

  it('without #divider the footer keeps its line', () => {
    const w = mount(UiCard, { slots: { default: 'body', footer: '<span class="f">foot</span>' } })
    expect(w.find('.f').element.parentElement!.className).toContain('border-t')
  })
})

describe('UiCard — footer note', () => {
  it('a note in the footer stands on the body text line; buttons keep the footer inset', () => {
    const w = mount(UiCard, {
      props: { title: 'Billing' },
      slots: {
        default: 'body',
        footer: '<span class="me-auto">Renews 1 Oct</span><button>Save</button>',
      },
    })
    const footer = w.find('.me-auto').element.parentElement!
    expect(footer.className).toContain('p-2')
    expect(footer.className).toContain('[&>.me-auto:not(button)]:ps-2')
  })
})

describe('UiCard — media and a lone header', () => {
  it('a side image styles only its own img, never one inside a UiAspectRatio that sets its own fit', () => {
    const w = mount(UiCard, {
      props: { imagePosition: 'start' },
      slots: { image: '<img src="x.png" alt="" />', default: 'Body' },
    })
    const side = w.find('img').element.parentElement!.className
    expect(side).toContain('[&>img]:object-cover')
    expect(side).not.toContain('[&_img]')
  })

  it('a UiAspectRatio beside the body is as tall as the card, not as its ratio; stacked, it keeps its ratio', () => {
    const w = mount(UiCard, {
      props: { imagePosition: 'end' },
      slots: {
        image: () => h(UiAspectRatio, { ratio: 1 }, () => h('img', { src: 'x.png', alt: '' })),
        default: 'Body',
      },
    })
    const box = w.find('[data-aspect]').element
    expect([...box.parentElement!.classList]).toEqual(
      expect.arrayContaining(['@sm:[&>*]:h-full', '[&>*]:w-full', '[&>*]:rounded-none']),
    )
    // Under 384px the column has no height of its own to fill: the media's own height stands.
    expect([...box.parentElement!.classList]).not.toContain('[&>*]:h-full')
    expect(box.closest('[data-card-image]')).toBe(box.parentElement)
  })

  it.each(['top', 'bottom', 'start', 'end'] as const)(
    'a focused linked image at %s rings the card only, never itself on the body',
    (imagePosition) => {
      const w = mount(UiCard, {
        props: { imagePosition },
        slots: {
          image: () =>
            h(UiAspectRatio, null, () =>
              h('a', { href: '/x' }, [h('img', { src: 'x.png', alt: '' })]),
            ),
          default: 'Body',
        },
      })
      expect(w.find('[data-card-image]').classes()).toContain(
        '[&_a:not(.absolute):focus-visible]:shadow-none',
      )
      expect(w.classes()).toContain(
        'has-[[data-card-image]_a:not(.absolute):focus-visible]:shadow-(--ui-ring)',
      )
    },
  )

  it('an undivided header with nothing under it keeps its own floor', () => {
    const alone = mount(UiCard, { props: { title: 'T', description: 'D', divided: false } })
    expect(alone.find('h3, h2, h4').element.closest('.gap-3')!.className).toContain('p-surface')
    const withBody = mount(UiCard, {
      props: { title: 'T', divided: false },
      slots: { default: 'Body' },
    })
    const head = withBody.find('h3, h2, h4').element.closest('.gap-3')!.className
    expect(head).toContain('pt-surface')
    expect(head).not.toMatch(/(^| )p-surface( |$)/)
  })

  it('plain with a title keeps a gap between the header, the body and the footer, and draws no line unless asked', () => {
    const w = mount(UiCard, {
      props: { variant: 'plain', title: 'T' },
      slots: { default: 'Body', footer: '<button>Save</button>' },
    })
    expect(w.classes()).toContain('gap-4')
    expect(w.find('.border-b').exists()).toBe(false)
    // The footer keeps its own line, as the canon's surface chrome has it.
    expect(w.find('.border-t').exists()).toBe(true)
    const lined = mount(UiCard, { props: { variant: 'plain', title: 'T', divided: true } })
    expect(lined.find('.border-b').exists()).toBe(true)
  })

  it('a comment-only #actions, #media or #image is no part, and a slot that appears later is seen', async () => {
    const Host = defineComponent({
      components: { UiCard },
      props: { on: Boolean },
      template:
        '<UiCard><template #actions><button v-if="on">Edit</button></template>Body</UiCard>',
    })
    const w = mount(Host, { props: { on: false } })
    expect(w.find('.gap-3').exists()).toBe(false)
    await w.setProps({ on: true })
    expect(w.find('button').exists()).toBe(true)
    const img = mount(UiCard, {
      props: { imagePosition: 'end' },
      slots: { image: '<!-- off -->', default: 'Body' },
    })
    expect(img.classes()).not.toContain('@container')
  })

  it('an undivided header above only a footer or a divider keeps its bottom gutter', () => {
    const w = mount(UiCard, {
      props: { title: 'T', divided: false },
      slots: { footer: '<button>Save</button>' },
    })
    expect(w.find('h2').element.closest('.gap-3')!.classList).toContain('p-surface')
  })

  it('a side image stands above the body when the card is narrow', () => {
    const w = mount(UiCard, {
      props: { imagePosition: 'start' },
      slots: { image: '<img alt="" />', default: 'Body' },
    })
    expect(w.classes()).toContain('@container')
    expect([...w.element.querySelector(':scope > :not([role="status"])')!.classList]).toEqual(
      expect.arrayContaining(['flex-col', '@sm:flex-row']),
    )
    expect(w.find('img').element.parentElement!.classList).toContain('@sm:w-2/5')
  })

  it('a framed card wears the halo of a focused linked image its shell would clip', () => {
    const w = mount(UiCard, { slots: { default: 'Body' } })
    expect(w.classes()).toContain(
      'has-[[data-card-image]_a:not(.absolute):focus-visible]:shadow-(--ui-ring)',
    )
  })

  it('a disabled card with a whole #header that renders nothing is still named by its title', () => {
    const w = mount(UiCard, {
      props: { title: 'T', disabled: true },
      slots: { header: '<!-- off -->', default: 'Body' },
    })
    expect(w.attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
  })

  it('loading over content keeps it at 60% and says updating; with nothing yet it draws the skeleton', async () => {
    const w = mount(UiCard, { props: { loading: false }, slots: { default: '<p class="x">x</p>' } })
    const status = w.find('[role="status"]')
    expect(status.text()).toBe('')
    await w.setProps({ loading: true })
    expect(w.find('[role="status"]').element).toBe(status.element)
    expect(status.text()).toBe('Updating…')
    expect(w.find('.x').element.parentElement!.classList).toContain('opacity-60')
    expect(w.find('.x').element.parentElement!.classList).toContain('min-w-0')
    expect(w.findComponent(UiSkeleton).exists()).toBe(false)
    const first = mount(UiCard, { props: { loading: true } })
    expect(first.find('[role="status"]').text()).toBe('Loading…')
    expect(first.findComponent(UiSkeleton).exists()).toBe(true)
    const empty = mount(UiCard, {
      props: { loading: true, empty: true },
      slots: { default: '<p class="x">x</p>' },
    })
    expect(empty.findComponent(UiSkeleton).exists()).toBe(true)
  })

  it('an action beside a title with a description stands on the center of the two lines', () => {
    const w = mount(UiCard, {
      props: { title: 'INV-0042', description: 'Acme Corp' },
      slots: { actions: '<button class="act">More</button>', default: 'Body' },
    })
    const head = w.find('h2').element.closest('.gap-3')!
    const action = w.find('.act').element.parentElement!
    expect(action.parentElement).toBe(head)
    expect(head.classList).toContain('items-center')
    expect(w.find('h2').element.parentElement!.contains(action)).toBe(false)
  })

  it('a refresh dims the body in place: the content is not mounted again', async () => {
    let mounts = 0
    const Child = defineComponent({
      setup: () => {
        mounts += 1
        return () => h('input', { class: 'field' })
      },
    })
    const w = mount(UiCard, { props: { loading: false }, slots: { default: () => h(Child) } })
    const field = w.find('.field').element
    await w.setProps({ loading: true })
    expect(w.find('.field').element).toBe(field)
    await w.setProps({ loading: false })
    expect(mounts).toBe(1)
  })

  it('a load after the empty state keeps it in place: the card keeps its height', async () => {
    let mounts = 0
    const Plate = defineComponent({
      setup: () => {
        mounts += 1
        return () => h('button', { class: 'retry' }, 'Retry')
      },
    })
    const w = mount(UiCard, {
      props: { title: 'Invoices', loading: false, empty: true },
      slots: { empty: () => h(Plate) },
    })
    const plate = w.find('.retry').element
    await w.setProps({ loading: true })
    expect(w.find('.retry').element).toBe(plate)
    expect(w.findComponent(UiSkeleton).exists()).toBe(false)
    // The body keeps the classes that set its height: centered, with its own padding.
    expect(plate.parentElement!.className).toEqual(expect.stringContaining('py-12'))
    await w.setProps({ loading: false })
    expect(mounts).toBe(1)
  })
})

describe('UiCard — review follow-ups', () => {
  const sign = (w: ReturnType<typeof mount>) => w.find('[data-card-updating]')

  it('A refresh shows its work: the card dims what it shows and one spinner turns in its middle, over it, so nothing moves.', async () => {
    const w = mount(UiCard, {
      props: { title: 'Invoices', loading: false },
      slots: {
        actions: '<button class="act">New</button>',
        default: '<p>Three invoices.</p>',
        footer: '<button>More</button>',
      },
    })
    expect(sign(w).exists()).toBe(false)
    await w.setProps({ loading: true })
    expect(sign(w).exists()).toBe(true)
    // The live region already says it: the spinner is for the eye, and has no words of its own.
    expect(sign(w).findComponent(UiSpinner).exists()).toBe(true)
    expect(sign(w).text()).toBe('')
    expect(sign(w).attributes('aria-hidden')).toBe('true')
    // Over the card and anchored to it, so the header keeps its width and nothing below it moves.
    expect(sign(w).classes()).toEqual(expect.arrayContaining(['absolute', 'inset-0']))
    expect(sign(w).element.parentElement).toBe(w.element)
    expect(w.classes()).toContain('data-refreshing:relative')
    expect(w.attributes('data-refreshing')).toBe('')
    // What the card shows dims, the title with it; its own controls and its frame do not.
    const dimmed = (el: Element) => {
      for (let at: Element | null = el; at && at !== w.element.parentElement; at = at.parentElement)
        if (at.classList.contains('opacity-60')) return true
      return false
    }
    expect(dimmed(w.find('h2').element)).toBe(true)
    expect(dimmed(w.find('p').element)).toBe(true)
    expect(dimmed(w.find('.act').element)).toBe(false)
    expect(dimmed(w.find('footer button, [class*="border-t"] button').element)).toBe(false)
    expect(dimmed(sign(w).element)).toBe(false)
    await w.setProps({ loading: false })
    expect(sign(w).exists()).toBe(false)
    expect(dimmed(w.find('h2').element)).toBe(false)
  })

  it('A whole header keeps its color through a refresh: its tabs and buttons still work.', async () => {
    const w = mount(UiCard, {
      props: { loading: true },
      slots: { header: '<button class="tab">Tab</button>', default: '<p>x</p>' },
    })
    expect(sign(w).exists()).toBe(true)
    const up = (el: Element) => {
      const all: string[] = []
      for (let at: Element | null = el; at && at !== w.element; at = at.parentElement)
        all.push(at.className)
      return all.join(' ')
    }
    expect(up(w.find('.tab').element)).not.toContain('opacity-60')
    expect(up(w.find('p').element)).toContain('opacity-60')
  })

  it('Without a header the card dims and turns its spinner in its middle the same way.', async () => {
    const w = mount(UiCard, { props: { loading: false }, slots: { default: '<p>x</p>' } })
    await w.setProps({ loading: true })
    expect(sign(w).exists()).toBe(true)
    expect(sign(w).classes()).toEqual(expect.arrayContaining(['absolute', 'inset-0']))
    expect(w.attributes('data-refreshing')).toBe('')
    expect(w.find('p').element.parentElement!.className).toContain('opacity-60')
  })

  it('A flat section of an overlay turns its spinner in its own middle too, anchored to the section.', () => {
    const w = mount(UiCard, {
      props: { loading: true },
      slots: { default: '<p>x</p>' },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    expect(sign(w).exists()).toBe(true)
    expect(w.attributes('data-refreshing')).toBe('')
  })

  it('A first load is a skeleton alone: no spinner for the same wait.', () => {
    const w = mount(UiCard, { props: { title: 'Invoices', loading: true } })
    expect(w.findComponent(UiSkeleton).exists()).toBe(true)
    expect(sign(w).exists()).toBe(false)
  })
})

describe('UiCard — a list last in the body', () => {
  it('the body drops its bottom gutter when it ends in a list, however deep, so the last row stands as the others do', () => {
    const body = (size?: 'md') =>
      mount(UiCard, {
        props: { title: 'Power', size },
        slots: {
          default: () =>
            h('div', [h('p', 'Chart'), h(UiList, () => h(UiListItem, { title: 'Solar' }))]),
        },
      })
        .findAll('.min-w-0.flex-1')
        .find((e) => e.find('.ui-list').exists())!
    const cls = body().classes().join(' ')
    expect(cls).toContain('has-[>.ui-list:last-child')
    expect(cls).toContain('>:last-child:not([data-framed])>.ui-list:last-child')
    expect(cls).toContain(']:pb-0')
    expect(body('md').classes().join(' ')).toContain(']:pb-0')
  })
})

describe('UiCard — a list last in the body, nested', () => {
  // The class is read as the selector the browser runs, `has-[>a>b,…]:pb-0`, one child step at a
  // time: the test DOM matches simple selectors, not a `:has` with child steps.
  const listLast = (body: Element) => {
    const cls = [...body.classList].find((c) => c.startsWith('has-[') && c.endsWith(':pb-0'))
    if (!cls) return false
    return cls
      .slice(5, -6)
      .split(',')
      .some((chain) => {
        let at: Element[] = [body]
        for (const step of chain.split('>').slice(1))
          at = at.flatMap((e) => [...e.children].filter((c) => c.matches(step)))
        return at.length > 0
      })
  }
  // A padded body, outer first: the one that carries the class.
  const bodies = (w: ReturnType<typeof mount>) =>
    w
      .findAll('.min-w-0.flex-1')
      .map((b) => b.element)
      .filter((e) => e.classList.contains('p-surface'))

  it('a body ending in a list, a block deep, drops its bottom gutter', () => {
    const w = mount(UiCard, {
      props: { title: 'Power' },
      slots: {
        default: () =>
          h('div', [h('p', 'Chart'), h(UiList, () => h(UiListItem, { title: 'Solar' }))]),
      },
    })
    expect(listLast(bodies(w)[0]!)).toBe(true)
  })

  it('a body ending in a card of its own keeps its gutter: the inner card drops its, the outer does not', () => {
    const w = mount(UiCard, {
      props: { title: 'Outer' },
      slots: {
        default: () =>
          h('div', [
            h(UiCard, { title: 'Inner' }, () => h(UiList, () => h(UiListItem, { title: 'Solar' }))),
          ]),
      },
    })
    const [outer, inner] = bodies(w)
    expect(listLast(inner!)).toBe(true)
    expect(listLast(outer!)).toBe(false)
  })
})

describe('UiCard — review follow-ups', () => {
  const rowsIn = (props: Record<string, unknown>, provide: Record<symbol, unknown> = {}) =>
    mount(UiCard, {
      props: { title: 'Team', ...props },
      slots: {
        default: () =>
          h(UiList, () => [h(UiListItem, { title: 'A' }), h(UiListItem, { title: 'B' })]),
      },
      global: { provide },
    }).findAllComponents(UiListItem)

  it('a titled card of rows puts the row text on the title inset: 16 by default, 24 at md', () => {
    for (const r of rowsIn({ padded: false })) {
      expect(r.classes()).toContain('px-surface')
      expect(r.classes()).not.toContain('-mx-surface')
    }
    for (const r of rowsIn({ padded: false, size: 'md' }))
      expect(r.classes()).toContain('px-surface-md')
  })

  it('a padded card gives its gutter to a row and a separator: they bleed to the frame', () => {
    const rows = rowsIn({ size: 'md' })
    expect(rows[0]!.element.closest('.ui-list')!.classList).toContain('-mx-surface-md')
    expect(rows[0]!.classes()).toContain('px-surface-md')
    const sep = mount(UiCard, { slots: { default: () => h(UiSeparator) } }).find(
      '[role="separator"]',
    )
    expect(sep.classes()).toContain('-mx-surface')
  })

  it('a framed card does not pass an outer surface gutter to its rows', () => {
    for (const r of rowsIn({ padded: false }, { [SURFACE_GUTTER as symbol]: 'surface-md' })) {
      expect(r.classes()).not.toContain('-mx-surface-md')
      expect(r.element.closest('.ui-list')!.classList).not.toContain('-mx-surface-md')
    }
  })

  it('#header runs edge to edge; the caller strip owns its inset', () => {
    const w = mount(UiCard, { slots: { header: '<div class="strip">tabs</div>', default: 'x' } })
    expect(w.find('.strip').element.parentElement!.className).not.toMatch(/\bp[xy]?-\d/)
  })

  it('a card whose title is replaced by #header names nothing inside', () => {
    const w = mount(UiCard, {
      attachTo: document.body,
      props: { title: 'Filters' },
      slots: {
        header: '<div>tabs</div>',
        default: () => h(UiFilterList, { items: [{ value: 'a', label: 'A' }], modelValue: [] }),
      },
    })
    expect(w.find('[role="listbox"]').attributes('aria-labelledby')).toBeUndefined()
    w.unmount()
  })

  it('a card without a body has no empty band under its header', () => {
    const w = mount(UiCard, { props: { title: 'T', description: 'D' } })
    expect(w.findAll('.flex-1').filter((n) => n.text() === '')).toHaveLength(0)
  })

  it('the third level of cards is h4', () => {
    const w = mount(UiCard, {
      props: { title: 'A' },
      slots: {
        default: () => h(UiCard, { title: 'B' }, () => h(UiCard, { title: 'C' }, () => 'x')),
      },
    })
    expect(w.find('h4').text()).toBe('C')
  })

  it('align center stands the body in the middle with room around it', () => {
    const w = mount(UiCard, {
      props: { align: 'center' },
      slots: { default: '<p>Nothing yet</p>' },
    })
    expect(w.find('p').element.parentElement!.className).toMatch(/items-center/)
    expect(w.find('p').element.parentElement!.className).toMatch(/py-12/)
  })

  it('an image stands edge to edge at its place; beside the card it takes a column', () => {
    const top = mount(UiCard, {
      props: { title: 'T' },
      slots: { image: '<img alt="" />', default: 'x' },
    })
    expect(
      top.element.querySelector(':scope > :not([role="status"])')!.querySelector('img'),
    ).not.toBeNull()
    const side = mount(UiCard, {
      props: { title: 'T', imagePosition: 'end' },
      slots: { image: '<img alt="" />', default: 'x' },
    })
    expect(side.classes()).toContain('@container')
    expect(side.element.querySelector(':scope > :not([role="status"])')!.classList).toContain(
      '@sm:flex-row',
    )
    // After the words in the DOM too: the reading order matches the screen.
    expect(side.element.lastElementChild!.querySelector('img')).not.toBeNull()
  })

  it('tone, disabled and loading say themselves on the frame and the body', () => {
    expect(mount(UiCard, { props: { tone: 'danger' } }).classes()).toContain(
      'border-danger-border/60',
    )
    const off = mount(UiCard, { props: { disabled: true, title: 'T' } })
    expect(off.attributes('aria-disabled')).toBe('true')
    expect(off.find('h2').classes()).toContain('text-fg-muted')
    const first = mount(UiCard, { props: { loading: true } })
    expect(first.attributes('aria-busy')).toBe('true')
    expect(first.findComponent(UiSkeleton).exists()).toBe(true)
  })

  it('plain has no frame and no padding, and passes the gutter around it on: its rows line up with the outer title', () => {
    const w = mount(UiCard, {
      props: { variant: 'plain', title: 'Inner' },
      slots: { default: () => h(UiList, () => h(UiListItem, { title: 'Row' })) },
      global: { provide: { [SURFACE_GUTTER as symbol]: 'surface' } },
    })
    expect(w.classes()).not.toContain('rounded-card')
    expect(
      w
        .findAll('[class]')
        .some((n) =>
          n.classes().some((c) => /^p[xy]?-\d/.test(c) && n.attributes('data-row') === undefined),
        ),
    ).toBe(false)
    expect(w.findComponent(UiList).classes()).toContain('-mx-surface')
    expect(w.findComponent(UiListItem).classes()).toContain('px-surface')
  })

  it('size, padded and variant are set once: a change warns in dev', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiCard, { slots: { default: 'x' } })
    await w.setProps({ size: 'md' })
    expect(warn.mock.calls.some(([m]) => String(m).includes('set once'))).toBe(true)
    warn.mockRestore()
  })

  it('the skeleton spans the body, centered or flat, its lines on the text line pitch', () => {
    const lines = (w: ReturnType<typeof mount>): HTMLElement =>
      w.findComponent(UiSkeleton).element.parentElement!.parentElement!
    const c = mount(UiCard, { props: { loading: true, align: 'center' } })
    expect(lines(c).className).toContain('w-full')
    expect(lines(c).className).toContain('text-sm')
    const flat = mount(UiCard, {
      props: { loading: true, padded: false },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    expect(
      lines(flat)
        .className.split(' ')
        .some((c) => /^p-\d/.test(c)),
    ).toBe(false)
  })

  it('a disabled card is a disabled group named by its title', () => {
    const w = mount(UiCard, {
      attachTo: document.body,
      props: { disabled: true, title: 'Bank feed' },
    })
    expect(w.attributes('role')).toBe('group')
    expect(document.getElementById(w.attributes('aria-labelledby')!)!.textContent).toContain(
      'Bank feed',
    )
    w.unmount()
  })

  it('a slot that renders only a comment is no part: no footer line, no body band', () => {
    const w = mount(UiCard, {
      props: { title: 'T' },
      slots: {
        default: () => [createCommentVNode('off')],
        footer: () => [createCommentVNode('off')],
      },
    })
    expect(w.find('.border-t').exists()).toBe(false)
    expect(w.findAll('.flex-1').filter((n) => n.text() === '')).toHaveLength(0)
  })

  it('center keeps room around it without padding too', () => {
    const w = mount(UiCard, {
      props: { align: 'center', padded: false },
      slots: { default: '<p>Empty</p>' },
    })
    expect(w.find('p').element.parentElement!.className).toMatch(/py-12/)
  })

  it('an image at the bottom comes after the footer in the DOM', () => {
    const w = mount(UiCard, {
      props: { title: 'T', imagePosition: 'bottom' },
      slots: { image: '<img alt="" />', default: 'x', footer: '<button class="f">F</button>' },
    })
    const kids = [...w.element.children]
    expect(kids.findIndex((k) => k.querySelector('img'))).toBeGreaterThan(
      kids.findIndex((k) => k.querySelector('.f') || k.matches('.border-t')),
    )
  })

  it('the header is divided by default; false drops the line; a flat section is not divided', () => {
    const on = mount(UiCard, { props: { title: 'T' }, slots: { default: 'x' } })
    expect(on.find('.border-b').exists()).toBe(true)
    const off = mount(UiCard, { props: { title: 'T', divided: false }, slots: { default: 'x' } })
    expect(off.find('.border-b').exists()).toBe(false)
    const flat = mount(UiCard, {
      props: { title: 'T' },
      slots: { default: 'x' },
      global: { provide: { [FLAT_CARD as symbol]: true } },
    })
    expect(flat.find('[role="separator"]').exists()).toBe(false)
  })

  it('a whole #header draws no line of the card unless asked; tabs in it draw no second frame', () => {
    const w = mount(UiCard, {
      slots: {
        header: () =>
          h(UiTabs, {
            modelValue: 'a',
            variant: 'panel',
            ariaLabel: 'T',
            tabs: [{ value: 'a', label: 'A' }],
          }),
        default: 'x',
      },
    })
    expect(w.find('[data-ui-tabs-shell]').element.parentElement!.className).not.toContain(
      'border-b',
    )
    expect(w.find('[data-ui-tabs-shell]').classes()).not.toContain('rounded-card')
  })

  it('the footer keeps one line: the note that pushes the actions gives way', () => {
    const w = mount(UiCard, {
      slots: { footer: '<a class="me-auto">Preview</a><button>On</button>' },
    })
    const f = w.find('.border-t').classes()
    expect(f).not.toContain('flex-wrap')
    // Cut across with an ellipsis on one line; not `truncate`, whose clip on both axes cut a link's line.
    expect(f).toEqual(
      expect.arrayContaining([
        '[&>.me-auto]:min-w-0',
        '[&>.me-auto]:overflow-x-clip',
        '[&>.me-auto]:text-ellipsis',
        '[&>.me-auto]:whitespace-nowrap',
      ]),
    )
    expect(f).not.toContain('[&>.me-auto]:truncate')
  })
  it('plain with a side image keeps 16 between the image, the header, the body and the footer', () => {
    const w = mount(UiCard, {
      props: { variant: 'plain', imagePosition: 'start', title: 'T' },
      slots: {
        image: '<img src="x.png" alt="" />',
        default: 'Body',
        footer: '<button>Go</button>',
      },
    })
    const image = w.find('[data-card-image]').element
    expect(image.parentElement!.classList).toContain('gap-4')
    expect(w.find('h2').element.closest('.flex-1.flex-col')!.classList).toContain('gap-4')
  })

  it('a framed card with a side image keeps its parts flush, the gutter is their padding', () => {
    const w = mount(UiCard, {
      props: { imagePosition: 'start', title: 'T' },
      slots: { image: '<img src="x.png" alt="" />', default: 'Body' },
    })
    expect(w.find('[data-card-image]').element.parentElement!.classList).not.toContain('gap-4')
  })

  it('plain divided keeps 16 between the header text and its line', () => {
    const w = mount(UiCard, { props: { variant: 'plain', title: 'T', divided: true } })
    expect(w.find('.border-b').classes()).toContain('pb-4')
    const framed = mount(UiCard, { props: { title: 'T' } })
    expect(framed.find('.border-b').classes()).not.toContain('pb-4')
  })

  it('a long unbroken title wraps inside its column and leaves the action visible', () => {
    const w = mount(UiCard, {
      props: { title: 'INV-0042-quarterly-statement-final-v2', description: 'x'.repeat(80) },
      slots: { actions: '<button>Open</button>' },
    })
    expect(w.find('h2').classes()).toContain('[overflow-wrap:anywhere]')
    expect(w.find('p').classes()).toContain('[overflow-wrap:anywhere]')
  })

  it('selected is gone: a choice among cards is a radio card', () => {
    const w = mount(UiCard, { attrs: { selected: true } })
    expect(w.classes()).not.toContain('ring-brand-solid')
    expect(w.classes()).not.toContain('border-brand-solid')
  })

  it('a comment-only #header leaves the title naming the group inside', () => {
    const Probe = defineComponent({
      setup: () => {
        const id = inject(CARD_TITLE_ID)
        return () => h('span', { class: 'probe' }, id?.value ?? 'none')
      },
    })
    const w = mount(UiCard, {
      props: { title: 'Filters' },
      slots: { header: () => [createCommentVNode('off')], default: () => h(Probe) },
    })
    expect(w.find('.probe').text()).toBe(w.find('h2').attributes('id'))
    const whole = mount(UiCard, {
      props: { title: 'Filters' },
      slots: { header: '<div>Tabs</div>', default: () => h(Probe) },
    })
    expect(whole.find('.probe').text()).toBe('none')
  })

  it('a framed card warns in dev when a tone comes with no words beside its title', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const words = () => warn.mock.calls.filter(([m]) => String(m).includes('in words')).length
    const w = mount(UiCard, { props: { title: 'Bank feed' } })
    expect(words()).toBe(0)
    await w.setProps({ tone: 'danger' })
    expect(words()).toBe(1)
    mount(UiCard, {
      props: { title: 'Bank feed', tone: 'danger' },
      slots: { actions: '<span>Disconnected</span>' },
    })
    mount(UiCard, { props: { tone: 'warning' }, slots: { header: '<span>Sync paused</span>' } })
    expect(words()).toBe(1)
    warn.mockRestore()
  })
})

describe('UiCard — review follow-ups', () => {
  afterEach(() => vi.restoreAllMocks())

  it('says a tone with no words once, however often the tone changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiCard, { props: { title: 'Bank feed', tone: 'danger' } })
    await w.setProps({ tone: 'warning' })
    await w.setProps({ tone: undefined })
    await w.setProps({ tone: 'danger' })
    expect(warn.mock.calls.filter(([m]) => String(m).includes('in words'))).toHaveLength(1)
  })

  it('warns once in dev when `loading` is bound only after the mount, and not when bound from the start', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const late = () => warn.mock.calls.filter(([m]) => String(m).includes('from the start')).length
    const bound = mount(UiCard, { props: { title: 'Invoices', loading: false } })
    await bound.setProps({ loading: true })
    expect(late()).toBe(0)
    const w = mount(UiCard, { props: { title: 'Invoices' } })
    await w.setProps({ loading: true })
    await w.setProps({ loading: undefined })
    await w.setProps({ loading: true })
    expect(late()).toBe(1)
  })

  it('keeps the body mounted when a side image comes later: what was typed stays', async () => {
    const photo = ref(false)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            UiCard,
            { title: 'Trip', imagePosition: 'end' },
            {
              image: () => (photo.value ? h('img', { alt: '', src: 'x.png' }) : null),
              default: () => h('input', { class: 'draft' }),
            },
          ),
      }),
      { attachTo: document.body },
    )
    const draft = w.find('.draft').element
    photo.value = true
    await nextTick()
    expect(w.find('[data-card-image]').exists()).toBe(true)
    expect(w.find('.draft').element).toBe(draft)
    w.unmount()
  })

  it('a list alone in a section of a drawer reaches its line with `loading` bound as well', () => {
    const w = mount(UiCard, {
      props: { loading: false },
      slots: { default: () => h('div', { class: 'ui-list' }) },
      global: { provide: { [FLAT_CARD as symbol]: true, [SURFACE_GUTTER as symbol]: 'drawer' } },
    })
    expect(w.find('.ui-list').element.parentElement!.className).toContain(
      '[&>.ui-list:first-child]:-mt-drawer',
    )
  })

  it('the spinner over a refresh lets a press through to what stands under it', async () => {
    const w = mount(UiCard, { props: { loading: false }, slots: { default: 'Rows' } })
    await w.setProps({ loading: true })
    expect(w.find('[data-card-updating]').classes()).toContain('pointer-events-none')
  })

  it("a card with a side image takes its parent's width", () => {
    const w = mount(UiCard, {
      props: { imagePosition: 'start' },
      slots: { image: '<img alt="" src="x.png" />', default: 'Body' },
    })
    expect(w.classes()).toContain('w-full')
  })
})

describe('UiCard — the focus when the body changes', () => {
  const card = (props: Record<string, unknown>) =>
    mount(UiCard, {
      props: { title: 'Invoices', ...props },
      slots: {
        actions: '<button class="act">Export</button>',
        default: '<input class="field" aria-label="Note" />',
        empty: '<button class="retry">Retry</button>',
      },
      attachTo: document.body,
    })
  const settle = async () => {
    await nextTick()
    await nextTick()
  }

  it('Retry in #empty keeps the focus while the card loads: the empty state stays as it is', async () => {
    const w = card({ empty: true, loading: false })
    const retry = w.find('.retry').element as HTMLElement
    retry.focus()
    await w.setProps({ loading: true })
    await settle()
    expect(w.find('.retry').element).toBe(retry)
    expect(document.activeElement).toBe(retry)
    expect(w.findComponent(UiSkeleton).exists()).toBe(false)
    // The Retry that started the load shows the wait with its own `loading`: no dim, no second spinner.
    expect(retry.parentElement!.className).not.toContain('opacity-60')
    expect(w.find('[data-card-updating]').exists()).toBe(false)
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('[role="status"]').text()).toBe('Updating…')
    w.unmount()
  })

  it('a Retry in #empty that gives way to the content hands the focus to the card, not the page', async () => {
    const w = card({ empty: true, loading: false })
    ;(w.find('.retry').element as HTMLElement).focus()
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, empty: false })
    await settle()
    expect(w.find('.retry').exists()).toBe(false)
    expect(document.activeElement).toBe(w.element)
    // The card takes the focus for that moment only: once it leaves, the frame is not a stop.
    expect(w.attributes('tabindex')).toBe('-1')
    ;(w.find('.act').element as HTMLElement).focus()
    expect(w.attributes('tabindex')).toBeUndefined()
    w.unmount()
  })

  it('a focus that stays where it was is left alone: a field through a refresh, an action in the header', async () => {
    const w = card({ loading: false })
    const field = w.find('.field').element as HTMLElement
    field.focus()
    await w.setProps({ loading: true })
    await settle()
    expect(document.activeElement).toBe(field)
    await w.setProps({ loading: false, empty: true })
    await settle()
    expect(document.activeElement).toBe(w.element)
    const act = w.find('.act').element as HTMLElement
    act.focus()
    await w.setProps({ empty: false, loading: true })
    await settle()
    expect(document.activeElement).toBe(act)
    expect(w.attributes('tabindex')).toBeUndefined()
    w.unmount()
  })
})
