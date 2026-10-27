import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TabItem } from '../types/ui'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import { Comment, h, nextTick } from 'vue'
import UiTabs from './UiTabs.vue'
import UiCard from './UiCard.vue'

const tabs: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity', badge: 12 },
  { value: 'settings', label: 'Settings' },
]

const slots = {
  overview: '<p class="pane-overview">Overview</p>',
  activity: '<p class="pane-activity">Activity</p>',
  settings: '<p class="pane-settings">Settings</p>',
}

const mountTabs = (modelValue = 'overview', props: Record<string, unknown> = {}) =>
  mount(UiTabs, { props: { tabs, modelValue, ariaLabel: 'Sections', ...props }, slots })

describe('UiTabs — structure', () => {
  it('renders a named tablist of underlined tabs', () => {
    const w = mountTabs()
    expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Sections')
    const buttons = w.findAll('[role="tab"]')
    expect(buttons).toHaveLength(3)
    expect(w.find('[role="tab"][aria-selected="true"]').classes().join(' ')).toContain(
      'shadow-[inset_0_-2px_0_var(--color-brand)]',
    )
  })

  it('marks the active tab and gives only it a tab stop', () => {
    const buttons = mountTabs('activity', { variant: 'underline' }).findAll('[role="tab"]')
    expect(buttons[0]!.attributes('aria-selected')).toBe('false')
    expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    expect(buttons[0]!.attributes('tabindex')).toBe('-1')
    expect(buttons[1]!.attributes('tabindex')).toBe('0')
  })

  it('renders only the active pane, linked both ways', () => {
    const w = mountTabs('overview', { variant: 'underline' })
    expect(w.find('.pane-overview').exists()).toBe(true)
    expect(w.find('.pane-activity').exists()).toBe(false)
    const pane = w.find('[role="tabpanel"]')
    const tab = w.findAll('[role="tab"]')[0]!
    expect(pane.attributes('aria-labelledby')).toBe(tab.attributes('id'))
    expect(tab.attributes('aria-controls')).toBe(pane.attributes('id'))
  })

  it('names only a pane that is there: a strip without panes, and a tab not open, control none', () => {
    const w = mountTabs('overview', { variant: 'underline' })
    expect(w.findAll('[role="tab"]')[1]!.attributes('aria-controls')).toBeUndefined()
    const strip = mount(UiTabs, { props: { tabs, modelValue: 'overview', ariaLabel: 'Sections' } })
    for (const t of strip.findAll('[role="tab"]'))
      expect(t.attributes('aria-controls')).toBeUndefined()
  })

  it('renders no pane when the active tab has no slot', () => {
    const w = mount(UiTabs, {
      props: { tabs, modelValue: 'overview', ariaLabel: 'Sections' },
      slots: { activity: '<p>only activity</p>' },
    })
    expect(w.find('[role="tabpanel"]').exists()).toBe(false)
  })
})

describe('UiTabs — badge', () => {
  it('shows a badge on the tab that has one, neutral by default', () => {
    const buttons = mountTabs().findAll('[role="tab"]')
    expect(buttons[1]!.text()).toContain('12')
    expect(buttons[0]!.text()).not.toContain('12')
  })

  it('badgeTone gives the badge a meaning', () => {
    const w = mountTabs('overview', {
      tabs: [
        { value: 'overview', label: 'Overview' },
        { value: 'security', label: 'Security', badge: '!', badgeTone: 'warning' },
        { value: 'activity', label: 'Activity', badge: 24 },
      ],
    })
    const badges = w.findAll('.ui-count')
    expect(badges).toHaveLength(2)
    expect(badges[0]!.classes().join(' ')).toContain('warning')
    expect(badges[1]!.classes().join(' ')).not.toContain('warning')
  })
})

describe('UiTabs — zero', () => {
  it('a count past its limit reads 99+ and keeps the badge short', () => {
    const w = mountTabs('overview', {
      tabs: [{ value: 'overview', label: 'Overview', badge: 1200, badgeLabel: '1200 unread' }],
    })
    expect(w.find('.ui-count').text()).toBe('99+')
  })

  it('a count of zero draws no badge', () => {
    const w = mountTabs('overview', {
      tabs: [
        { value: 'overview', label: 'Overview', badge: 0 },
        { value: 'activity', label: 'Activity', badge: 3 },
      ],
    })
    expect(w.findAll('.ui-count')).toHaveLength(1)
  })
})

describe('UiTabs — interaction', () => {
  it('a click emits the value of the clicked tab', async () => {
    const w = mountTabs('overview', { variant: 'underline' })
    await w.findAll('[role="tab"]')[2]!.trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual(['settings'])
  })

  it('arrows wrap round the ends; Home and End jump to the ends', async () => {
    const w = mountTabs('overview', { variant: 'underline' })
    const buttons = w.findAll('[role="tab"]')
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')![0]).toEqual(['activity'])
    await buttons[0]!.trigger('keydown', { key: 'End' })
    expect(w.emitted('update:modelValue')![1]).toEqual(['settings'])

    const atStart = mountTabs('overview', { variant: 'underline' })
    await atStart.findAll('[role="tab"]')[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(atStart.emitted('update:modelValue')![0]).toEqual(['settings'])

    const atEnd = mountTabs('settings', { variant: 'underline' })
    await atEnd.findAll('[role="tab"]')[2]!.trigger('keydown', { key: 'ArrowRight' })
    expect(atEnd.emitted('update:modelValue')![0]).toEqual(['overview'])
  })

  it('a horizontal strip leaves ArrowUp and ArrowDown to the page', async () => {
    const w = mountTabs('activity', { variant: 'underline' })
    const tab = w.findAll('[role="tab"]')[1]!
    for (const key of ['ArrowUp', 'ArrowDown']) {
      const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      tab.element.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
    }
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a disabled tab is not chosen by a click or a key and says aria-disabled', async () => {
    const withOff: TabItem[] = [
      { value: 'overview', label: 'Overview' },
      { value: 'activity', label: 'Activity', disabled: true },
      { value: 'settings', label: 'Settings', disabled: true },
      { value: 'billing', label: 'Billing' },
    ]
    const w = mount(UiTabs, {
      props: { tabs: withOff, modelValue: 'overview', ariaLabel: 'S', variant: 'underline' },
    })
    const buttons = w.findAll('[role="tab"]')
    expect(buttons[1]!.attributes('aria-disabled')).toBe('true')
    expect(buttons[0]!.attributes('aria-disabled')).toBeUndefined()
    expect(buttons[1]!.classes()).toContain('text-disabled-fg')
    expect(buttons[1]!.classes().join(' ')).not.toContain('hover:')
    await buttons[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')![0]).toEqual(['billing'])

    const fromEnd = mount(UiTabs, {
      props: { tabs: withOff, modelValue: 'billing', ariaLabel: 'S', variant: 'underline' },
    })
    await fromEnd.findAll('[role="tab"]')[3]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(fromEnd.emitted('update:modelValue')![0]).toEqual(['overview'])

    const edges: TabItem[] = [
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disabled: true },
    ]
    const home = mount(UiTabs, { props: { tabs: edges, modelValue: 'b', ariaLabel: 'S' } })
    await home.find('[role="tab"]').trigger('keydown', { key: 'Home' })
    await home.find('[role="tab"]').trigger('keydown', { key: 'End' })
    expect(home.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not emit when the active tab is clicked again', async () => {
    const w = mountTabs('overview', { variant: 'underline' })
    await w.findAll('[role="tab"]')[0]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('UiTabs — panel variant', () => {
  it('puts the strip and the pane inside one card shell', () => {
    const w = mountTabs('overview', { variant: 'panel' })
    const shell = w.find('[data-ui-tabs-shell]')
    expect(shell.classes()).toEqual(expect.arrayContaining(['rounded-card', 'border']))
    const strip = w.find('[role="tablist"]')
    expect(strip.element.parentElement!.classList).toContain('bg-surface-muted')
    expect(shell.element.contains(strip.element)).toBe(true)
    expect(shell.element.contains(w.find('[role="tabpanel"]').element)).toBe(true)
  })

  it('#header sits inside the shell above the strip and adds a rule above the strip', () => {
    const w = mount(UiTabs, {
      props: { tabs, modelValue: 'overview', ariaLabel: 'Sections', variant: 'panel' },
      slots: { ...slots, header: '<div class="who">Signed in</div>' },
    })
    const html = w.find('[data-ui-tabs-shell]').html()
    expect(html.indexOf('class="who"')).toBeLessThan(html.indexOf('role="tablist"'))
    expect(w.find('[role="tablist"]').element.parentElement!.classList).toContain('border-t')
    expect(
      mountTabs('overview', { variant: 'panel' }).find('[role="tablist"]').element.parentElement!
        .classList,
    ).not.toContain('border-t')
    expect(mountTabs('overview', { variant: 'panel' }).find('[data-ui-tabs-header]').exists()).toBe(
      false,
    )
  })

  it('a long set scrolls sideways without a bar and never wraps', () => {
    const strip = mountTabs('overview', { variant: 'panel' }).find('[role="tablist"]')
    expect(strip.classes()).toEqual(
      expect.arrayContaining(['overflow-x-auto', 'overflow-y-hidden', 'whitespace-nowrap']),
    )
    expect(strip.classes()).not.toContain('flex-wrap')
    expect(strip.classes()).toContain('ui-scroll-hidden')
  })

  it('edges that hide tabs fade and grow arrows; a set that fits has neither', async () => {
    const w = mountTabs('overview', { variant: 'underline' })
    const strip = w.find('[role="tablist"]').element as HTMLElement
    expect(w.findAll('button[aria-hidden="true"]')).toHaveLength(0)
    Object.defineProperty(strip, 'scrollWidth', { value: 600, configurable: true })
    Object.defineProperty(strip, 'clientWidth', { value: 300, configurable: true })
    strip.scrollLeft = 100
    await w.find('[role="tablist"]').trigger('scroll')
    expect(w.findAll('button[aria-hidden="true"]')).toHaveLength(2)
    expect(strip.getAttribute('style')).toContain('linear-gradient')
  })

  it('the arrows are for a mouse: drawn only on a device whose pointer hovers and is fine, never on touch', async () => {
    const w = mountTabs('overview', { variant: 'underline' })
    const strip = w.find('[role="tablist"]').element as HTMLElement
    Object.defineProperty(strip, 'scrollWidth', { value: 600, configurable: true })
    Object.defineProperty(strip, 'clientWidth', { value: 300, configurable: true })
    strip.scrollLeft = 100
    await w.find('[role="tablist"]').trigger('scroll')
    const arrows = w.findAll('button[aria-hidden="true"]')
    expect(arrows).toHaveLength(2)
    for (const arrow of arrows) {
      expect(arrow.classes()).toContain('hidden')
      expect(arrow.classes()).toContain('[@media(hover:hover)_and_(pointer:fine)]:flex')
      expect(arrow.attributes('tabindex')).toBe('-1')
    }
  })

  it('#header is ignored in the underline variant', () => {
    const w = mount(UiTabs, {
      props: { tabs, modelValue: 'overview', ariaLabel: 'Sections', variant: 'underline' },
      slots: { ...slots, header: '<div class="who">Signed in</div>' },
    })
    expect(w.find('.who').exists()).toBe(false)
  })
})

describe('UiTabs — review follow-ups', () => {
  it('a count on a tab stands on the md step, readable on the panel strip', () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'a',
        tabs: [{ value: 'a', label: 'Sessions', badge: 3 }],
        ariaLabel: 'Account',
      },
    })
    expect(w.findComponent({ name: 'UiCount' }).props('size')).toBe('md')
  })

  it("the active tab's count takes the brand with its label; a tone given stays", () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'a',
        ariaLabel: 'Account',
        tabs: [
          { value: 'a', label: 'Sessions', badge: 3 },
          { value: 'b', label: 'Events', badge: 5 },
          { value: 'c', label: 'Security', badge: '!', badgeTone: 'danger' },
        ],
      },
    })
    const tones = w.findAllComponents({ name: 'UiCount' }).map((c) => c.props('tone'))
    expect(tones).toEqual(['brand', 'neutral', 'danger'])
  })

  it('one tab keeps a tab stop even when modelValue matches nothing', () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'ghost',
        ariaLabel: 'Account',
        tabs: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    expect(w.findAll('[role="tab"]').map((t) => t.attributes('tabindex'))).toEqual(['0', '-1'])
  })

  it('#header with a v-if that renders nothing draws no header band and no rule', () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'a',
        variant: 'panel',
        ariaLabel: 'Account',
        tabs: [{ value: 'a', label: 'A' }],
      },
      slots: { header: () => [h(Comment, 'v-if')] },
    })
    expect(w.find('[data-ui-tabs-header]').exists()).toBe(false)
  })

  it('a UiListItem row in a panel pane bleeds to the frame on the pane gutter', () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'a',
        variant: 'panel',
        ariaLabel: 'Account',
        tabs: [{ value: 'a', label: 'A' }],
      },
      slots: { a: () => h(UiList, () => h(UiListItem, { title: 'Email' })) },
    })
    expect(w.find('[role="tabpanel"]').classes()).toContain('p-surface')
    expect(w.findComponent(UiList).classes()).toContain('-mx-surface')
  })

  it('stands on panel by default', () => {
    expect(
      mount(UiTabs, { props: { tabs, modelValue: 'overview', ariaLabel: 'Sections' } }).find(
        '[role="tablist"]',
      ).element.parentElement!.className,
    ).toContain('bg-surface-muted')
  })
})

describe('UiTabs — a badge read with the tab', () => {
  it('a badge with badgeLabel is read in words: the number hidden, the meaning said', () => {
    const w = mount(UiTabs, {
      props: {
        modelValue: 'a',
        ariaLabel: 'Account',
        tabs: [
          { value: 'a', label: 'Overview' },
          { value: 'b', label: 'Sessions', badge: 3, badgeLabel: '3 active' },
        ],
      },
    })
    const tab = w.findAll('[role=tab]')[1]!
    expect(tab.find('.ui-count').attributes('aria-hidden')).toBe('true')
    expect(tab.find('.sr-only').text()).toBe('3 active')
  })

  it('a bare number badge warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiTabs, { props: { modelValue: 'overview', ariaLabel: 'Client', tabs } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('badgeLabel'))).toBe(true)
    warn.mockRestore()
  })

  it('the warning names the tab by its value, never by its label or badge content', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiTabs, {
      props: {
        modelValue: 'overview',
        ariaLabel: 'Client',
        tabs: [{ value: 'activity', label: 'Sofia Martinez', badge: 'overdue' }],
      },
    })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.some((m) => m.includes('"activity"'))).toBe(true)
    expect(said.some((m) => m.includes('Sofia Martinez'))).toBe(false)
    expect(said.some((m) => m.includes('overdue'))).toBe(false)
    warn.mockRestore()
  })
})

describe('UiTabs — review follow-ups', () => {
  const set: TabItem[] = [
    { value: 'order history', label: 'Order history' },
    { value: 'notes', label: 'Notes' },
  ]
  const mountSet = (
    props: Record<string, unknown> = {},
    slots: ComponentMountingOptions<typeof UiTabs>['slots'] = {},
  ) =>
    mount(UiTabs, {
      attachTo: document.body,
      props: { modelValue: 'order history', ariaLabel: 'Client', tabs: set, ...props },
      slots,
    })

  it('a browser chord on a tab is not swallowed: Alt+ArrowLeft and Cmd+ArrowRight emit nothing', () => {
    const w = mountSet({ modelValue: 'notes' })
    const tab = w.findAll('[role=tab]')[1]!.element
    for (const init of [
      { key: 'ArrowLeft', altKey: true },
      { key: 'ArrowRight', metaKey: true },
    ]) {
      const e = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true })
      tab.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
    }
    expect(w.emitted('update:modelValue')).toBeUndefined()
    const plain = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    tab.dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')).toEqual([['order history']])
    w.unmount()
  })

  it('a value with a space keeps one valid id per tab and pane', () => {
    const w = mountSet({}, { 'order history': () => h('p', 'Orders') })
    const tab = w.find('[role=tab]')
    const pane = w.find('[role=tabpanel]')
    expect(tab.attributes('id')).not.toContain(' ')
    expect(tab.attributes('aria-controls')).toBe(pane.attributes('id'))
    expect(pane.attributes('aria-labelledby')).toBe(tab.attributes('id'))
    w.unmount()
  })

  it('a pane whose value matches no tab names nothing', () => {
    const w = mountSet({ modelValue: 'gone' }, { gone: () => h('p', 'Left over') })
    expect(w.find('[role=tabpanel]').attributes('aria-labelledby')).toBeUndefined()
    w.unmount()
  })

  it('a pane with a focusable child adds no tab stop of its own; a pane of words does', async () => {
    const withButton = mountSet({}, { 'order history': () => h('button', 'Export') })
    await nextTick()
    expect(withButton.find('[role=tabpanel]').attributes('tabindex')).toBeUndefined()
    withButton.unmount()
    const words = mountSet({}, { 'order history': () => h('p', 'Nothing yet') })
    await nextTick()
    expect(words.find('[role=tabpanel]').attributes('tabindex')).toBe('0')
    words.unmount()
  })

  it('a focused tab rings inward and keeps its underline; hover is gated on enabled', () => {
    const w = mountSet()
    const [active, other] = w.findAll('[role=tab]')
    expect(active!.classes().join(' ')).toContain(
      '[&[role=tab][aria-selected]:focus-visible]:shadow-[inset_0_-2px_0_var(--color-brand),var(--ui-ring-inset)]',
    )
    expect(other!.classes()).toContain('enabled:hover:text-fg')
    expect(other!.classes()).not.toContain('hover:text-fg')
    expect(w.find('[role=tablist]').classes()).not.toContain('py-[3px]')
    w.unmount()
  })

  it('forced colors: the selected tab is highlighted, not marked by ink alone', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    const block = css.slice(css.indexOf('@media (forced-colors: active)'))
    expect(block).toContain(":root .ui-tab[aria-selected='true']")
  })

  // A page read right to left: `dir` is what a page sets; happy-dom only computes `direction` from
  // the style, so the host carries both.
  const rtlTabs = (props: Record<string, unknown> = {}) => {
    const host = document.createElement('div')
    host.setAttribute('dir', 'rtl')
    host.setAttribute('style', 'direction: rtl')
    document.body.append(host)
    const w = mount(UiTabs, {
      attachTo: host,
      props: { modelValue: 'a', ariaLabel: 'Client', variant: 'underline', tabs: [], ...props },
    })
    return { w, done: () => (w.unmount(), host.remove()) }
  }

  it('in a right-to-left page ArrowRight is the tab before and ArrowLeft the tab after; the rest stay', async () => {
    const four: TabItem[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
      { value: 'd', label: 'D' },
    ]
    const { w, done } = rtlTabs({ tabs: four })
    // Each key is pressed on the chosen tab; the parent takes what it sends.
    const press = async (from: string, key: string) => {
      await w.setProps({ modelValue: from })
      await w.find('[role=tab][aria-selected=true]').trigger('keydown', { key })
      return w.emitted('update:modelValue')!.at(-1)![0]
    }
    expect(await press('c', 'ArrowRight')).toBe('a')
    expect(await press('a', 'ArrowLeft')).toBe('c')
    // Round the ends, and past the tab that is off.
    expect(await press('a', 'ArrowRight')).toBe('d')
    expect(await press('d', 'ArrowLeft')).toBe('a')
    expect(await press('c', 'Home')).toBe('a')
    expect(await press('c', 'End')).toBe('d')
    const before = w.emitted('update:modelValue')!.length
    for (const key of ['ArrowUp', 'ArrowDown']) {
      const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      w.find('[role=tab][aria-selected=true]').element.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
    }
    expect(w.emitted('update:modelValue')!.length).toBe(before)
    done()
  })

  it('in a right-to-left page the arrow and the fade stand where tabs wait: a strip starts at the right', async () => {
    const { w, done } = rtlTabs({ tabs: set })
    const strip = w.find('[role="tablist"]').element as HTMLElement
    Object.defineProperty(strip, 'scrollWidth', { value: 600, configurable: true })
    Object.defineProperty(strip, 'clientWidth', { value: 300, configurable: true })
    const at = async (scrollLeft: number) => {
      strip.scrollLeft = scrollLeft
      await w.find('[role="tablist"]').trigger('scroll')
      return {
        left: w.find('button[aria-hidden="true"] svg.lucide-chevron-left').exists(),
        right: w.find('button[aria-hidden="true"] svg.lucide-chevron-right').exists(),
        fade: strip.getAttribute('style') ?? '',
      }
    }
    // scrollLeft runs from 0 at the start (the right) to minus the overflow at the end (the left).
    const start = await at(0)
    expect([start.left, start.right]).toEqual([true, false])
    expect(start.fade).toContain('transparent 0')
    expect(start.fade).not.toContain('transparent 100%')
    const end = await at(-300)
    expect([end.left, end.right]).toEqual([false, true])
    expect(end.fade).toContain('transparent 100%')
    expect(end.fade).not.toContain('transparent 0')
    const middle = await at(-150)
    expect([middle.left, middle.right]).toEqual([true, true])
    done()
  })

  it('on a left-to-right page the strip starts at the left: the arrow waits at the right', async () => {
    const w = mountSet()
    const strip = w.find('[role="tablist"]').element as HTMLElement
    Object.defineProperty(strip, 'scrollWidth', { value: 600, configurable: true })
    Object.defineProperty(strip, 'clientWidth', { value: 300, configurable: true })
    const arrows = async (scrollLeft: number) => {
      strip.scrollLeft = scrollLeft
      await w.find('[role="tablist"]').trigger('scroll')
      return [
        w.find('button[aria-hidden="true"] svg.lucide-chevron-left').exists(),
        w.find('button[aria-hidden="true"] svg.lucide-chevron-right').exists(),
      ]
    }
    expect(await arrows(0)).toEqual([false, true])
    expect(await arrows(300)).toEqual([true, false])
    w.unmount()
  })
})

describe('UiTabs — an underline strip as a card header', () => {
  it('its pane stands right under the line, with no gap of its own', () => {
    const tabs = [{ value: 'a', label: 'A' }]
    const inCard = mount(UiCard, {
      props: { padded: false },
      slots: {
        header: () =>
          h(
            UiTabs,
            { modelValue: 'a', ariaLabel: 'Record', variant: 'underline', tabs },
            {
              a: () => h('p', 'Rows'),
            },
          ),
      },
    })
    expect(inCard.find('[role=tabpanel]').classes()).not.toContain('mt-4')
    const alone = mount(UiTabs, {
      props: { modelValue: 'a', ariaLabel: 'Record', variant: 'underline', tabs },
      slots: { a: () => h('p', 'Rows') },
    })
    expect(alone.find('[role=tabpanel]').classes()).toContain('mt-4')
  })
})

describe('UiTabs — narrow screen', () => {
  it('the scroller holds the badge words a reader hears, so they never widen the page', () => {
    const w = mountTabs('a', {
      tabs: [{ value: 'a', label: 'Decisions', badge: 7, badgeLabel: '7 decisions' }],
    })
    const sr = w.find('button .sr-only')
    expect(sr.exists()).toBe(true)
    const scroller = sr.element.closest('.overflow-x-auto')!
    expect(scroller.classList.contains('relative')).toBe(true)
  })
})
