import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiModal from './UiModal.vue'
import { h, nextTick } from 'vue'
import { BarChart3, Inbox, Settings } from '@lucide/vue'
import UiAppShell from './UiAppShell.vue'
import UiList from './UiList.vue'
import UiListItem from './UiListItem.vue'
import { useOverlayStack } from '../composables/useOverlayStack'
import { withGrani } from '../test/harness'

const NAV = [
  {
    items: [
      { to: '/', label: 'Overview', icon: BarChart3 },
      { to: '/inbox', label: 'Inbox', icon: Inbox, count: 3 },
    ],
  },
  { label: 'Workspace', items: [{ to: '/settings', label: 'Settings', icon: Settings }] },
]
const shell = (props: Record<string, unknown> = {}) =>
  mount(UiAppShell, {
    attachTo: document.body,
    props: { nav: NAV, brand: 'Grani', ...props },
    slots: { default: '<p class="page">Page</p>' },
  })
const item = (w: ReturnType<typeof shell>, name: string) =>
  w
    .findAll('nav a')
    .find((a) => a.text().includes(name) || a.attributes('aria-label')?.startsWith(name))!
// Wide: the test DOM lays out no container query, so the menu button is hidden by hand.
const wide = () => {
  const was = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get: () => null,
  })
  // happy-dom has no offsetParent at all: the restore deletes ours, or every later test is wide.
  return () => {
    if (was) Object.defineProperty(HTMLElement.prototype, 'offsetParent', was)
    else delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent
  }
}
const cmdB = (target: EventTarget = document.body) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'b', code: 'KeyB', metaKey: true, bubbles: true }),
  )

describe('UiAppShell', () => {
  it('draws the places in groups under their heading, with the count, and the page beside', () => {
    const w = shell()
    expect(w.findAll('nav a').map((a) => a.attributes('href'))).toEqual([
      '/',
      '/inbox',
      '/settings',
    ])
    expect(w.find('nav').text()).toContain('Workspace')
    expect(item(w, 'Inbox').text()).toContain('3')
    expect(w.find('main .page').exists()).toBe(true)
    w.unmount()
  })

  it('lights the item the page is on or under; home only on itself', () => {
    const w = shell({ current: '/inbox/42' })
    expect(item(w, 'Inbox').attributes('aria-current')).toBe('page')
    expect(item(w, 'Overview').attributes('aria-current')).toBeUndefined()
    const home = shell({ current: '/' })
    expect(item(home, 'Overview').attributes('aria-current')).toBe('page')
    expect(item(home, 'Inbox').attributes('aria-current')).toBeUndefined()
    w.unmount()
    home.unmount()
  })

  it('collapses to icons: the names leave the rows and name them for a screen reader', async () => {
    const w = shell()
    const toggle = w.find('button[aria-expanded="true"]')
    await toggle.trigger('click')
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    expect(item(w, 'Inbox').attributes('aria-label')).toBe('Inbox, 3')
    // The group's name leaves the eye and stays for a screen reader: its list is still named.
    const label = w.findAll('nav span').find((s) => s.text() === 'Workspace')!
    expect(label.classes()).toContain('sr-only')
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    w.unmount()
  })

  it('the collapse button sits beside the logo, alone when collapsed, and keeps the focus', async () => {
    const w = shell()
    const head = w.find('[data-sidebar] > div')
    const toggle = head.find('button[aria-controls]')
    // One name in both states; the state is aria-expanded.
    expect(toggle.attributes('aria-label')).toBe('Sidebar')
    ;(toggle.element as HTMLElement).focus()
    await toggle.trigger('click')
    const after = w.find('[data-sidebar] > div').find('button[aria-controls]')
    expect(after.element).toBe(toggle.element)
    expect(document.activeElement).toBe(toggle.element)
    expect(after.attributes('aria-label')).toBe('Sidebar')
    expect(after.attributes('aria-expanded')).toBe('false')
    expect(w.find('[data-sidebar] > div a').exists()).toBe(false)
    w.unmount()
  })

  it('a bound `collapsed` wins over the shell’s own state', async () => {
    const w = shell({ collapsed: true })
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    await w.setProps({ collapsed: false })
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-64')
    w.unmount()
  })

  it('Ctrl or ⌘ B toggles the collapse, but not while typing in a field', async () => {
    // Wide: the menu button is hidden by the container query, which the test DOM does not lay out.
    const was = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get: () => null,
    })
    const w = shell()
    cmdB()
    await nextTick()
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    const input = document.createElement('input')
    document.body.append(input)
    cmdB(input)
    await nextTick()
    expect(w.emitted('update:collapsed')).toHaveLength(1)
    input.remove()
    w.unmount()
    if (was) Object.defineProperty(HTMLElement.prototype, 'offsetParent', was)
    else delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent
  })

  it('narrow: the menu opens the sheet, a dialog; Escape closes it and so does a new page', async () => {
    const w = shell({ current: '/' })
    const aside = () => w.find('[data-sidebar]')
    expect(aside().attributes('role')).toBeUndefined()
    expect(aside().classes()).toContain('invisible')
    await w.find('header button[aria-expanded="false"]').trigger('click')
    expect(aside().attributes('role')).toBe('dialog')
    expect(aside().attributes('aria-modal')).toBe('true')
    expect(aside().classes()).toContain('visible')
    await aside().trigger('keydown', { key: 'Escape' })
    expect(aside().attributes('role')).toBeUndefined()
    await w.find('header button').trigger('click')
    await w.setProps({ current: '/inbox' })
    expect(aside().attributes('role')).toBeUndefined()
    w.unmount()
  })

  it('the sheet is the full sidebar even when the desktop one is collapsed', async () => {
    const w = shell({ collapsed: true })
    await w.find('header button').trigger('click')
    expect(item(w, 'Inbox').text()).toContain('Inbox')
    expect(w.find('nav').text()).toContain('Workspace')
    w.unmount()
  })

  it('the logo links home and is named by the brand', () => {
    const w = shell({ home: '/start' })
    const links = w.findAll('a[aria-label="Grani, home"]')
    expect(links.length).toBe(2)
    expect(links[0]!.attributes('href')).toBe('/start')
    w.unmount()
  })

  it('narrow: Ctrl or ⌘ B opens and closes the sheet', async () => {
    const w = shell()
    cmdB()
    await nextTick()
    expect(w.find('[data-sidebar]').attributes('role')).toBe('dialog')
    cmdB()
    await nextTick()
    expect(w.find('[data-sidebar]').attributes('role')).toBeUndefined()
    w.unmount()
  })
})

describe('UiAppShell — review follow-ups', () => {
  it('a shell that starts loading still says "no way home" once its places come without it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [], brand: 'Grani', current: '/x', loading: true },
    })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('no way home'))).toBe(false)
    await w.setProps({
      loading: false,
      nav: [{ items: [{ to: '/x', label: 'X', icon: Inbox }] }],
    })
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('no way home'))).toHaveLength(1)
    warn.mockRestore()
    w.unmount()
  })

  // A sidebar of the sections of one page addresses them by their hash: the page's own address is
  // the place, whole, before it is read as a path.
  it('a place addressed by a hash is lit when the page is at it', () => {
    const w = shell({
      nav: [
        {
          items: [
            { to: '#overview', label: 'Overview', icon: BarChart3 },
            { to: '#invoices', label: 'Invoices', icon: Inbox },
          ],
        },
      ],
      current: '#invoices',
    })
    expect(item(w, 'Invoices').attributes('aria-current')).toBe('page')
    expect(item(w, 'Overview').attributes('aria-current')).toBeUndefined()
    w.unmount()
  })

  // The tint of the current place reads 1.12:1 light and 1.00:1 dark against the sidebar: the
  // current page is told by its label's weight and ink too, never by color alone.
  // The weight is on the element that holds the words: one on the row would lose to the label's own.
  it('the current place is told by the weight of its label, not by color alone', () => {
    const w = shell({ current: '/inbox' })
    const label = (name: string) =>
      [...item(w, name).element.querySelectorAll('*')].find(
        (el) => el.children.length === 0 && el.textContent?.trim() === name,
      )!
    expect(label('Inbox').classList).toContain('font-semibold')
    expect(label('Inbox').classList).not.toContain('font-medium')
    expect(label('Settings').classList).toContain('font-medium')
    expect(label('Settings').classList).not.toContain('font-semibold')
    w.unmount()
  })

  it('a current path with a query or a hash lights its place', async () => {
    const w = shell({ current: '/inbox?tab=1' })
    expect(item(w, 'Inbox').attributes('aria-current')).toBe('page')
    await w.setProps({ current: '/settings#billing' })
    expect(item(w, 'Settings').attributes('aria-current')).toBe('page')
    w.unmount()
  })

  it('the navigation is busy while the places come, and not once they are in', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [], brand: 'Grani', current: '/', loading: true },
    })
    expect(w.find('nav').attributes('aria-busy')).toBe('true')
    await w.setProps({ nav: NAV, loading: false })
    expect(w.find('nav').attributes('aria-busy')).toBeUndefined()
    w.unmount()
  })

  it('places on their way draw five rows in their shape, keep the footer, and say so once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [], brand: 'Grani', current: '/', loading: true },
      slots: {
        default: '<p class="page">Page</p>',
        banner: '<p class="goal">Goal</p>',
        footer: '<p class="person">Dana</p>',
      },
    })
    // The status region takes its words a beat after it mounts.
    await new Promise((r) => setTimeout(r, 60)).then(() => nextTick())
    const rows = w.find('nav [data-skeleton]')
    expect(rows.attributes('aria-hidden')).toBe('true')
    expect(rows.findAll(':scope > div')).toHaveLength(5)
    expect(w.find('nav a').exists()).toBe(false)
    expect(w.find('.goal').exists()).toBe(false)
    expect(w.find('.person').exists()).toBe(true)
    expect(w.find('p[role="status"]').text()).toBe('Loading…')
    // Home is not among the places only because none has come yet: no warning for it.
    expect(warn.mock.calls.some((c) => String(c[0]).includes('no way home'))).toBe(false)
    await w.setProps({ nav: NAV, loading: false })
    expect(w.find('nav [data-skeleton]').exists()).toBe(false)
    expect(w.findAll('nav a')).toHaveLength(3)
    expect(w.find('.goal').exists()).toBe(true)
    expect(w.find('.person').exists()).toBe(true)
    expect(w.find('p[role="status"]').text()).toBe('')
    warn.mockRestore()
    w.unmount()
  })

  it('collapsed, the rows on their way are their squares alone', () => {
    const restore = wide()
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [], brand: 'Grani', current: '/', loading: true, collapsed: true },
    })
    const row = w.find('nav [data-skeleton] > div')
    expect(row.findAll('.ui-skeleton')).toHaveLength(1)
    w.unmount()
    restore()
  })

  it('the current item and a hovered sibling never draw the same background', () => {
    const w = shell({ current: '/inbox' })
    const cls = item(w, 'Inbox').classes()
    expect(cls).toContain('aria-[current=page]:bg-brand-subtle')
    expect(cls).toContain('[&:is(:enabled,a)]:hover:bg-surface-muted')
    expect(cls).not.toContain('aria-[current=page]:bg-surface-muted')
    w.unmount()
  })

  it('two shells: Ctrl or ⌘ B reaches the one the focus is in, else only the first', async () => {
    const a = shell()
    const b = shell()
    cmdB()
    await nextTick()
    expect(a.find('[data-sidebar]').attributes('role')).toBe('dialog')
    expect(b.find('[data-sidebar]').attributes('role')).toBeUndefined()
    await a.find('[data-sidebar]').trigger('keydown', { key: 'Escape' })
    ;(b.find('header button').element as HTMLElement).focus()
    cmdB(b.find('header button').element)
    await nextTick()
    expect(b.find('[data-sidebar]').attributes('role')).toBe('dialog')
    expect(a.find('[data-sidebar]').attributes('role')).toBeUndefined()
    a.unmount()
    b.unmount()
  })

  it('Ctrl or ⌘ B is refused in any editable text, not only contenteditable="true"', async () => {
    const w = shell()
    const editor = document.createElement('div')
    editor.setAttribute('contenteditable', '')
    document.body.append(editor)
    Object.defineProperty(editor, 'isContentEditable', { value: true })
    cmdB(editor)
    await nextTick()
    expect(w.find('[data-sidebar]').attributes('role')).toBeUndefined()
    editor.remove()
    w.unmount()
  })

  it('nav rows carry no row divider mark and no chevron', () => {
    const w = shell()
    expect(w.find('nav [data-row]').exists()).toBe(false)
    expect(w.find('nav .lucide-chevron-right').exists()).toBe(false)
    w.unmount()
  })

  it('collapsed, #mark stands in the head over the button, a link home; without it the button is alone', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani', collapsed: true },
      slots: { mark: '<i class="mark" />', logo: '<b class="logo">Grani</b>' },
    })
    const head = w.find('[data-sidebar] > div')
    expect(head.find('a .mark').exists()).toBe(true)
    expect(head.find('.logo').exists()).toBe(false)
    expect(head.classes()).toContain('flex-col')
    expect(head.find('a').attributes('aria-label')).toBe('Grani, home')
    await w.setProps({ collapsed: false })
    expect(head.find('a .logo').exists()).toBe(true)
    expect(head.find('.mark').exists()).toBe(false)
    w.unmount()
  })

  it('#banner stands over the foot while the sidebar is open, and leaves while it is collapsed', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, collapsed: false },
      slots: { banner: '<div class="banner">Goal</div>', footer: '<p class="foot">Me</p>' },
    })
    const aside = w.find('[data-sidebar]')
    const order = [...aside.element.querySelectorAll('.banner, .foot')].map((e) => e.className)
    expect(order).toEqual(['banner', 'foot'])
    await w.setProps({ collapsed: true })
    expect(aside.find('.banner').exists()).toBe(false)
    w.unmount()
  })
  it('RTL: the closed sidebar is not translated on the desktop layout', () => {
    const w = shell()
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:rtl:translate-x-0')
    w.unmount()
  })

  it('Ctrl or ⌘ B with the focus on the logo hands the focus to the button', async () => {
    const restore = wide()
    const w = shell()
    const home = w.find('[data-sidebar] > div a').element as HTMLElement
    home.focus()
    cmdB(home)
    await nextTick()
    await nextTick()
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    expect(document.activeElement).toBe(
      w.find('[data-sidebar] > div button[aria-controls]').element,
    )
    w.unmount()
    restore()
  })

  it('collapsed follows the bound value when the parent does not take the update', async () => {
    const w = shell({ collapsed: true })
    await w.find('[data-sidebar] > div button[aria-controls]').trigger('click')
    expect(w.emitted('update:collapsed')).toEqual([[false]])
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    w.unmount()
  })

  it('only the deepest matching item is current', () => {
    const w = shell({
      current: '/orders/archive/7',
      nav: [
        {
          items: [
            { to: '/orders', label: 'Orders', icon: Inbox },
            { to: '/orders/archive', label: 'Archive', icon: Settings },
          ],
        },
      ],
    })
    const lit = w.findAll('nav a[aria-current="page"]')
    expect(lit).toHaveLength(1)
    expect(lit[0]!.attributes('href')).toBe('/orders/archive')
    w.unmount()
  })

  it('a group with no items draws nothing, and no extra separator', () => {
    const w = shell({
      collapsed: true,
      nav: [
        { items: [{ to: '/', label: 'Overview', icon: BarChart3 }] },
        { label: 'Empty', items: [] },
        { items: [{ to: '/inbox', label: 'Inbox', icon: Inbox }] },
      ],
    })
    expect(w.find('nav').text()).not.toContain('Empty')
    expect(w.findAll('nav [role="separator"], nav hr')).toHaveLength(1)
    w.unmount()
  })

  it('Ctrl or ⌘ B works on a non-Latin layout', () => {
    const restore = wide()
    const w = shell()
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: '\u0438', code: 'KeyB', ctrlKey: true, bubbles: true }),
    )
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    w.unmount()
    restore()
  })

  it('Ctrl or ⌘ B does nothing while a window is open above the shell', () => {
    const restore = wide()
    const w = shell()
    const overlays = useOverlayStack()
    const layer = overlays.acquire()
    cmdB()
    expect(w.emitted('update:collapsed')).toBeUndefined()
    overlays.release(layer)
    cmdB()
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    w.unmount()
    restore()
  })

  it('without a brand the logo and the link home use the translated fallback', () => {
    const w = shell({ brand: '' })
    expect(w.find('[data-sidebar] > div a').attributes('aria-label')).toBe('App, home')
    expect(w.find('[data-sidebar] > div a').text()).toBe('App')
    w.unmount()
  })

  it('a long label is cut to one line in its row', () => {
    const w = shell({
      nav: [{ items: [{ to: '/r', label: 'Quarterly reconciliation reports', icon: Inbox }] }],
    })
    expect(w.find('nav a .truncate').text()).toBe('Quarterly reconciliation reports')
    w.unmount()
  })

  it('Ctrl or ⌘ B follows the typed letter on a Latin layout', () => {
    const restore = wide()
    const w = shell()
    // Dvorak: B is typed on the physical N; the physical B types X.
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'x', code: 'KeyB', ctrlKey: true, bubbles: true }),
    )
    expect(w.emitted('update:collapsed')).toBeUndefined()
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', code: 'KeyN', ctrlKey: true, bubbles: true }),
    )
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    w.unmount()
    restore()
  })

  it('a held Ctrl or ⌘ B toggles once', () => {
    const restore = wide()
    const w = shell()
    cmdB()
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'b',
        code: 'KeyB',
        metaKey: true,
        repeat: true,
        bubbles: true,
      }),
    )
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    w.unmount()
    restore()
  })

  it('with #mark, collapsing from the logo leaves the focus on the link', async () => {
    const restore = wide()
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani' },
      slots: { mark: '<i class="mark" />' },
    })
    const home = w.find('[data-sidebar] > div a').element as HTMLElement
    home.focus()
    cmdB(home)
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(w.find('[data-sidebar] > div a').element)
    w.unmount()
    restore()
  })

  it('a group heading names its list, and a row is named by its label open and collapsed', async () => {
    const w = shell({ collapsed: false })
    const list = w.findAll('nav ul')[1]!
    const heading = w.find(`#${list.attributes('aria-labelledby')}`)
    expect(heading.text()).toBe('Workspace')
    expect(item(w, 'Inbox').text()).toContain('Inbox')
    await w.setProps({ collapsed: true })
    expect(item(w, 'Inbox').attributes('aria-label')).toBe('Inbox, 3')
    w.unmount()
  })

  it('a strip in the page slot of UiAppShell is a page row, not a place', () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV },
      slots: {
        default: () => [
          h(UiListItem, { title: 'Heads up', description: 'Two lines of words.', tone: 'warning' }),
          h(UiListItem, { title: 'Billing', to: '/billing' }),
        ],
      },
    })
    const rows = w.find('main').findAllComponents(UiListItem)
    expect(rows[0].classes()).not.toContain('h-9')
    expect(rows[0].attributes('role')).toBe('status')
    expect(rows[1].find('svg.lucide-chevron-right, [class*="chevron"]').exists()).toBe(true)
    expect(w.find('nav a').classes()).toContain('h-9')
    w.unmount()
  })

  it('a strip in #footer is a dense row of the sidebar, not a place', () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV },
      slots: { footer: () => h(UiListItem, { title: 'Anna Petrova', to: '/me' }) },
    })
    const row = w.find('[data-sidebar]').findAllComponents(UiListItem).at(-1)!
    expect(row.text()).toContain('Anna Petrova')
    expect(row.classes()).not.toContain('h-9')
    expect(row.classes()).toContain('py-2')
    w.unmount()
  })
})

describe('UiAppShell — review follow-ups, second pass', () => {
  it('a window opened from #footer keeps the rows of a window, not the sidebar’s', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani', current: '/' },
      slots: {
        default: '<p>Page</p>',
        footer: () =>
          h(UiModal, { title: 'Profile', open: true }, () =>
            h(UiList, () => [
              h(UiListItem, { title: 'Email' }),
              h(UiListItem, { title: 'Password' }),
            ]),
          ),
      },
    })
    await nextTick()
    await nextTick()
    const rows = [...document.querySelectorAll('[role="dialog"] [data-row]')]
    expect(rows).toHaveLength(2)
    // Divided as rows of a window: the list they stand in draws the line between them.
    expect(rows[1]!.closest('.ui-list')).not.toBeNull()
    w.unmount()
  })

  it('collapsing with the focus inside #banner hands it to the toggle', async () => {
    const restore = wide()
    try {
      const w = mount(UiAppShell, {
        attachTo: document.body,
        props: { nav: NAV, brand: 'Grani', current: '/' },
        slots: { default: '<p>Page</p>', banner: '<a href="#goal" class="goal">Goal</a>' },
      })
      await nextTick()
      ;(w.find('.goal').element as HTMLElement).focus()
      cmdB(w.find('.goal').element)
      await nextTick()
      await nextTick()
      expect(document.activeElement?.getAttribute('aria-controls')).toBe(
        w.find('[data-sidebar]').attributes('id'),
      )
      w.unmount()
    } finally {
      restore()
    }
  })

  it('the current place takes the highlight under forced colors', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(
      /\.ui-current\[aria-current='page'\] \{\s*forced-color-adjust: none;\s*background: Highlight;/,
    )
  })

  it('a skip link is the first stop and puts the focus on the page', async () => {
    const w = shell({ current: '/' })
    const skip = w.find('a')
    expect(skip.text()).toBe('Skip to content')
    expect(skip.classes()).toContain('sr-only')
    await skip.trigger('click')
    expect(document.activeElement).toBe(w.find('main').element)
    w.unmount()
  })

  it('collapsed, a group’s list is still named by its heading', async () => {
    const w = shell({ current: '/', collapsed: true })
    await nextTick()
    const list = w.findAll('nav ul').at(-1)!
    const id = list.attributes('aria-labelledby')!
    expect(document.getElementById(id)?.textContent).toBe('Workspace')
    w.unmount()
  })

  it('the sidebar is no landmark of its own outside the sheet', () => {
    const w = shell({ current: '/' })
    expect(w.find('aside').exists()).toBe(false)
    expect(w.find('[data-sidebar]').attributes('role')).toBeUndefined()
    w.unmount()
  })

  it('the sheet stands on the overlay shell, as a window and a drawer do', () => {
    const src = readFileSync(resolve(__dirname, 'UiAppShell.vue'), 'utf8')
    expect(src).toContain('useOverlayShell(')
    expect(src).not.toContain('useBodyScrollLock')
  })

  it('warns in dev when collapsed has no way home, and when current is not given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [{ items: [{ to: '/inbox', label: 'Inbox', icon: Inbox }] }] },
      slots: { default: '<p>Page</p>' },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no way home'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pass `current`'))
    w.unmount()
    warn.mockRestore()
  })

  it('rows of a group stand 8 apart, the rail 36 between two 16 gutters', () => {
    const w = shell({ current: '/', collapsed: true })
    expect(w.find('nav ul').classes()).toContain('gap-2')
    expect(w.find('nav').classes()).toContain('p-4')
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    w.unmount()
  })
})

describe('UiAppShell — a count in the collapsed rail', () => {
  it('compact rail shows the count as a corner mark, and a negative count shows none', () => {
    const w = shell({ collapsed: true })
    expect(item(w, 'Inbox').find('.ui-count').exists()).toBe(true)
    w.unmount()
    const negative = mount(UiAppShell, {
      attachTo: document.body,
      props: {
        brand: 'Grani',
        nav: [{ items: [{ to: '/inbox', label: 'Inbox', icon: Inbox, count: -3 }] }],
      },
    })
    expect(negative.find('nav .ui-count').exists()).toBe(false)
    expect(negative.find('nav a').attributes('aria-label') ?? 'Inbox').not.toContain('-3')
    negative.unmount()
  })
})

describe('UiAppShell — the rail mark, second pass', () => {
  it('a collapsed place with a count keeps its icon at 20px, like one without', () => {
    const w = shell({ collapsed: true })
    const svg = item(w, 'Inbox').find('.ui-count').element.closest('a')!.querySelector('svg')!
    expect(svg.classList).toContain('h-5')
    w.unmount()
  })

  it('an endless count marks the place and names it without "Infinity"', () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: {
        brand: 'Grani',
        collapsed: true,
        nav: [{ items: [{ to: '/inbox', label: 'Inbox', icon: Inbox, count: Infinity }] }],
      },
    })
    expect(w.find('nav .ui-count').text()).toBe('99+')
    expect(w.find('nav a').attributes('aria-label')).toBe('Inbox, 99+')
    w.unmount()
  })

  it('the mark is cut out of the row it stands on: muted on hover and focus, brand on the current place', () => {
    const w = shell({ collapsed: true })
    expect(item(w, 'Inbox').classes()).toEqual(
      expect.arrayContaining([
        'hover:[--ui-indicator-ring:var(--color-surface-muted)]',
        'aria-[current=page]:[--ui-indicator-ring:var(--color-brand-subtle)]',
      ]),
    )
    w.unmount()
  })
})

describe('UiAppShell — rules', () => {
  it('Escape closes the sheet and the focus returns to the menu button that opened it.', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani', current: '/' },
      slots: { default: '<p>Page</p>' },
    })
    const menu = w.find('header button[aria-expanded]')
    ;(menu.element as HTMLElement).focus()
    await menu.trigger('click')
    await nextTick()
    await nextTick()
    expect(w.find('[data-sidebar]').element.contains(document.activeElement)).toBe(true)
    await w.find('[data-sidebar]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(menu.element)
    w.unmount()
  })

  it('A press on the backdrop closes the sheet, and the focus returns to the menu button too.', async () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani', current: '/' },
      slots: { default: '<p>Page</p>' },
    })
    const menu = w.find('header button[aria-expanded]')
    ;(menu.element as HTMLElement).focus()
    await menu.trigger('click')
    await nextTick()
    await nextTick()
    w.find('.bg-backdrop\\/50').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(w.find('[data-sidebar]').attributes('role')).toBeUndefined()
    expect(document.activeElement).toBe(menu.element)
    w.unmount()
  })
})

describe('UiAppShell — final review', () => {
  const lit = (w: ReturnType<typeof shell>) =>
    w.findAll('nav [aria-current="page"]').map((a) => a.attributes('href'))
  const press = (repeat: boolean, target: EventTarget = document.body) => {
    const e = new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      metaKey: true,
      bubbles: true,
      cancelable: true,
      repeat,
    })
    target.dispatchEvent(e)
    return e
  }

  it('a held Ctrl or ⌘ B is taken from the browser on every repeat, and toggles once', () => {
    const restore = wide()
    const w = shell()
    const first = press(false)
    const again = press(true)
    expect(first.defaultPrevented).toBe(true)
    expect(again.defaultPrevented).toBe(true)
    expect(w.emitted('update:collapsed')).toEqual([[true]])
    w.unmount()
    restore()
  })

  it('Ctrl or ⌘ B works with the focus on a checkbox, a radio or a button: nothing is typed there', () => {
    const restore = wide()
    const w = shell()
    for (const type of ['checkbox', 'radio', 'button']) {
      const input = document.createElement('input')
      input.type = type
      document.body.append(input)
      press(false, input)
      input.remove()
    }
    expect(w.emitted('update:collapsed')).toHaveLength(3)
    w.unmount()
    restore()
  })

  it('`collapsed` given as undefined is not bound: the button collapses the sidebar', async () => {
    const restore = wide()
    const w = shell({ collapsed: undefined })
    await w.find('[data-sidebar] button[aria-controls]').trigger('click')
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    w.unmount()
    restore()
  })

  it('one place is lit, read as a path: a trailing slash, the root, home and a twin address', () => {
    const at = (nav: unknown, props: Record<string, unknown>) => {
      const w = shell({ nav, ...props })
      const out = lit(w)
      w.unmount()
      return out
    }
    const place = (to: string, label = to) => ({ to, label, icon: Inbox })
    expect(at([{ items: [place('/inbox/')] }], { current: '/inbox' })).toEqual(['/inbox/'])
    expect(
      at([{ items: [place('/'), place('/dash')] }], { home: '/dash', current: '/profile' }),
    ).toEqual([])
    expect(at([{ items: [place('/start')] }], { home: '/start/', current: '/start/x' })).toEqual([])
    expect(
      at([{ items: [place('/inbox', 'A'), place('/inbox', 'B')] }], { current: '/inbox' }),
    ).toHaveLength(1)
    expect(at([{ items: [place(' /inbox ')] }], { current: '/inbox' })).toHaveLength(1)
  })

  it('a new page opens at its top: a change of path scrolls the page back, a change of hash does not', async () => {
    const w = shell({ current: '/' })
    const main = w.find('main').element as HTMLElement
    main.scrollTop = 300
    await w.setProps({ current: '/inbox' })
    expect(main.scrollTop).toBe(0)
    main.scrollTop = 300
    await w.setProps({ current: '/inbox#archive' })
    expect(main.scrollTop).toBe(300)
    w.unmount()
  })

  it('a place with no address draws no list item inside a list item', () => {
    const w = shell({ nav: [{ items: [{ to: '', label: 'Reports', icon: Inbox }] }] })
    expect(w.findAll('nav li li')).toHaveLength(0)
    expect(w.find('nav li').text()).toContain('Reports')
    w.unmount()
  })

  it('the logo in the sheet closes it, on the page it leads to as well', async () => {
    const w = shell({ current: '/' })
    await w.find('header button').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    const home = w.find('[data-sidebar] a[aria-label="Grani, home"]')
    home.element.addEventListener('click', (e) => e.preventDefault())
    await home.trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    w.unmount()
  })

  it('the buttons of the head stay on the 36px rail at an app size of md', () => {
    const w = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: NAV, brand: 'Grani' },
      global: { plugins: withGrani({ size: 'md' }) },
    })
    const toggle = w.find('[data-sidebar] button[aria-controls]')
    expect(toggle.classes()).toContain('h-9')
    expect(toggle.classes()).not.toContain('h-11')
    w.unmount()
  })
})

describe('UiAppShell — verify follow-ups', () => {
  it('twin places keep their rows when the places are reordered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const p = (to: string, label: string) => ({ to, label, icon: Inbox })
    const w = shell({ nav: [{ items: [p('/i', 'A'), p('/i', 'B'), p('/x', 'C'), p('/z', 'Z')] }] })
    await w.setProps({ nav: [{ items: [p('/z', 'Z'), p('/x', 'C'), p('/i', 'A'), p('/i', 'B')] }] })
    expect(w.findAll('nav a').map((a) => a.text())).toEqual(['Z', 'C', 'A', 'B'])
    expect(warn.mock.calls.some((c) => String(c[0]).includes('Duplicate keys'))).toBe(false)
    warn.mockRestore()
    w.unmount()
  })

  it('`collapsed` unbound after holding true stays where it was', async () => {
    const restore = wide()
    const w = shell({ collapsed: true })
    await w.setProps({ collapsed: undefined })
    expect(w.find('[data-sidebar]').classes()).toContain('@3xl:w-[calc(4.25rem+1px)]')
    w.unmount()
    restore()
  })

  it('home given with a trailing slash is found among the places: no false warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = shell({
      home: '/start/',
      current: '/start',
      nav: [{ items: [{ to: '/start', label: 'Start', icon: Inbox }] }],
    })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('no way home'))).toBe(false)
    warn.mockRestore()
    w.unmount()
  })

  it('a collapsed place with no address is still named to a screen reader', () => {
    const w = shell({
      collapsed: true,
      nav: [{ items: [{ to: '', label: 'Reports', icon: Inbox }] }],
    })
    expect(w.find('nav li .sr-only').text()).toBe('Reports')
    w.unmount()
  })
})
