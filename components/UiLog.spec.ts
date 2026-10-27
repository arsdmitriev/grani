import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mergeProps, nextTick } from 'vue'
import UiAvatar from './UiAvatar.vue'
import UiBadge from './UiBadge.vue'
import { RUSSIAN, withGrani } from '../test/harness'
import UiLog from './UiLog.vue'
import type { LogChange, LogEvent } from '../types/ui'

const EVENTS: LogEvent[] = [
  {
    id: 3,
    at: '27 Sep, 13:21',
    kind: 'decision',
    tone: 'danger',
    actor: { name: 'Anna' },
    action: 'declined',
    changes: [{ field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' }],
    note: 'Captions run a second late after 5:37.',
  },
  {
    id: 2,
    at: '27 Sep, 13:18',
    kind: 'change',
    actor: { name: 'Anna' },
    action: 'changed',
    changes: [
      { field: 'Format', from: 'Portrait', to: 'Landscape' },
      { field: 'Price', from: '$2.49', to: '$3.99' },
    ],
  },
  { id: 1, at: new Date('2026-09-26T18:08:00Z'), kind: 'system', action: 'created the record' },
]
const flush = () => new Promise((r) => setTimeout(r))
// A status region takes its words a beat after it mounts.
const beat = () => new Promise((r) => setTimeout(r, 60)).then(() => nextTick())

describe('UiLog', () => {
  it('a first load says it loads; a refresh with events in view says it updates', async () => {
    const w = mount(UiLog, { props: { items: [], loading: true } })
    await beat()
    expect(w.find('[role="status"]').text()).toBe('Loading the history')
    await w.setProps({ items: EVENTS })
    expect(w.find('[role="status"]').text()).toBe('Updating…')
    w.unmount()
  })

  it('who did what to what, and when; the system when no one is named', () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    const items = w.findAll('li')
    expect(items[0]!.text()).toContain('Anna declined')
    expect(items[0]!.find('time').text()).toBe('27 Sep, 13:21')
    expect(items[2]!.text()).toContain('System created the record')
    expect(items[2]!.find('time').attributes('datetime')).toBe('2026-09-26T18:08:00.000Z')
  })

  it('one change reads on its line: the field, what it was, what it became; a status in badges', () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    const first = w.findAll('li')[0]!
    const badges: VueWrapper[] = first.findAllComponents(UiBadge)
    expect(badges.map((b) => b.text())).toEqual(['Waiting', 'Declined'])
    expect(badges[0]!.classes()).toContain('line-through')
    expect(first.text()).toContain('became')
    expect(first.text()).toContain('Captions run a second late after 5:37.')
  })

  it('several changes stand in a table: field, was, became', () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    const rows = w.findAll('li')[1]!.findAll('tbody tr')
    // The arrow between was and became is drawn, not read: its cell is hidden.
    const read = (r: (typeof rows)[number]) =>
      r.findAll('td').filter((c) => c.attributes('aria-hidden') !== 'true')
    expect(rows.map((r) => read(r).map((c) => c.text()))).toEqual([
      ['Format', 'Portrait', 'Landscape'],
      ['Price', '$2.49', '$3.99'],
    ])
    expect(w.find('thead').text()).toContain('Previous value')
  })

  it('a change with no from is set, with no to is cleared', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 1, at: 'now', action: 'set', changes: [{ field: 'Id', to: '99776' }] },
          {
            id: 2,
            at: 'now',
            action: 'changed',
            changes: [{ field: 'Note', from: 'Late', to: null }],
          },
        ],
      },
    })
    const [set, cleared] = w.findAll('li')
    expect(set!.text()).not.toContain('became')
    expect(set!.text()).toContain('99776')
    expect(cleared!.text()).toContain('cleared')
  })

  it('node="actor" puts the face of who did it; the system keeps a dot', () => {
    const w = mount(UiLog, { props: { items: EVENTS, node: 'actor' } })
    expect(w.findAllComponents(UiAvatar)).toHaveLength(2)
    expect(w.findAll('li')[2]!.find('.rounded-pill').exists()).toBe(true)
  })

  it('a line joins the nodes and stops at the last one', () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    const lines = w.findAll('li > span.bg-border')
    expect(lines).toHaveLength(2)
  })

  it('filters are a segmented choice by kind, All first; the kind that is on is checked', async () => {
    const w = mount(UiLog, {
      props: { items: EVENTS, filters: [{ value: 'decision', label: 'Decisions' }] },
      attachTo: document.body,
    })
    const group = w.find('[role="radiogroup"]')
    expect(group.attributes('aria-label')).toBe('Show events')
    const radios = group.findAll('input[type="radio"]')
    expect(group.findAll('label').map((l) => l.text())).toEqual(['All', 'Decisions'])
    expect((radios[0]!.element as HTMLInputElement).checked).toBe(true)
    await radios[1]!.setValue(true)
    expect(w.emitted('update:filter')).toEqual([['decision']])
    await w.setProps({ filter: 'decision' })
    expect(w.findAll('ol > li')).toHaveLength(1)
    expect((group.findAll('input[type="radio"]')[1]!.element as HTMLInputElement).checked).toBe(
      true,
    )
    w.unmount()
  })

  it('Show older calls @more once and is held while the promise runs', async () => {
    let done!: () => void
    const onMore = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiLog, { props: { items: EVENTS, hasMore: true, onMore } })
    const older = w.findAll('button').find((b) => b.text() === 'Load older events')!
    await older.trigger('click')
    await older.trigger('click')
    expect(onMore).toHaveBeenCalledTimes(1)
    expect(older.attributes('aria-busy')).toBe('true')
    done()
    await flush()
    await nextTick()
    expect(older.attributes('aria-busy')).toBeUndefined()
  })

  it('with no events it says so in one quiet line', () => {
    expect(mount(UiLog, { props: { items: [] } }).text()).toBe('No activity yet')
    expect(mount(UiLog, { props: { items: [], empty: 'No decisions yet.' } }).text()).toBe(
      'No decisions yet.',
    )
  })
})

describe('UiLog — review follow-ups', () => {
  it('the action and its target are two words, not one', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 1, at: 'now', actor: { name: 'Bureau' }, action: 'replaced', target: 'Captions' },
        ],
      },
    })
    expect(w.find('li p').text().replace(/\s+/g, ' ')).toBe('Bureau replaced Captions')
  })

  it('an event with no one named opens with what was done, not with the system', () => {
    const w = mount(UiLog, {
      props: { items: [{ id: 1, at: 'now', actor: null, action: 'Added', target: 'UiSegmented' }] },
    })
    const line = w.find('li p')
    expect(line.text().replace(/\s+/g, ' ')).toBe('Added UiSegmented')
    expect(line.find('.font-semibold').text()).toBe('Added')
  })

  it('among faces, an event with no one named is a dot, not the system plate', () => {
    const w = mount(UiLog, {
      props: {
        node: 'actor',
        items: [{ id: 1, at: 'now', actor: null, action: 'Added', target: 'UiSegmented' }],
      },
    })
    expect(w.findComponent(UiAvatar).exists()).toBe(false)
    expect(w.find('li .rounded-pill.border-2').exists()).toBe(true)
  })

  it('an anchor is the id of its row, there from the first render', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 1, at: 'now', actor: null, action: 'Added', target: 'grani', anchor: '0.1.0' },
          { id: 2, at: 'now', action: 'changed' },
        ],
      },
    })
    const rows = w.findAll('li[data-event]')
    expect(rows[0]!.attributes('id')).toBe('0.1.0')
    expect(rows[1]!.attributes('id')).toBeUndefined()
  })
})

describe('UiLog — the load and the table', () => {
  it('a rejected onMore does not go unhandled and the button stays clickable to retry', async () => {
    const onMore = vi.fn(() => Promise.reject(new Error('offline')))
    const w = mount(UiLog, { props: { items: EVENTS, hasMore: true, onMore } })
    const older = () => w.findAll('button').find((b) => b.text() === 'Load older events')!
    await older().trigger('click')
    await flush()
    await nextTick()
    expect(w.find('[role="alert"]').text()).toBe('Could not load older events. Try again.')
    expect(older().attributes('aria-busy')).toBeUndefined()
    await older().trigger('click')
    expect(onMore).toHaveBeenCalledTimes(2)
  })

  it('data-testid and aria-describedby from the caller reach the list, not just class and style', () => {
    const w = mount(UiLog, {
      props: { items: EVENTS },
      attrs: { class: 'mine', 'data-testid': 'log', 'aria-describedby': 'hint' },
    })
    expect(w.classes()).toContain('mine')
    expect(w.find('ol').attributes('data-testid')).toBe('log')
    expect(w.find('ol').attributes('aria-describedby')).toBe('hint')
  })

  it('the changes table and the note use the card shape, not the control shape', () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    expect(w.find('table').element.parentElement!.className).toContain('rounded-card')
    expect(w.findAll('li')[0]!.find('p.bg-surface-muted').classes()).toContain('rounded-card')
  })

  it('the status badges are small, on the line and in the table', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          EVENTS[0]!,
          {
            id: 9,
            at: 'now',
            action: 'changed',
            changes: [
              { field: 'Priority', from: 5, to: 1 },
              { field: 'Status', from: 'Waiting', to: 'Declined', tone: 'danger' },
            ],
          },
        ],
      },
    })
    const badges = w.findAllComponents(UiBadge)
    expect(badges.map((b) => b.props('size'))).toEqual(['sm', 'sm', 'sm'])
    expect(w.find('tbody').findComponent(UiBadge).text()).toBe('Declined')
  })
})

describe('UiLog — its rules', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })
  const OLDER: LogEvent[] = [
    { id: 'o2', at: '24 Sep, 09:00', action: 'reserved the id' },
    { id: 'o1', at: '24 Sep, 08:58', action: 'opened a slot' },
  ]
  const older = (w: ReturnType<typeof mount>) =>
    w.findAll('button').find((b) => b.text() === 'Load older events')

  it('Show older keeps the place: focus moves to the first new event when the button goes, and the count is said', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false }),
          ),
      },
    })
    await beat()
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    expect(older(w)).toBeUndefined()
    expect(document.activeElement?.getAttribute('data-event')).toBe('o2')
    expect(w.find('[role="status"]').text()).toBe('2 older events loaded')
  })

  it('older events append after the last one and leave the nodes already shown', async () => {
    const w = mount(UiLog, { props: { items: EVENTS } })
    const before = w.findAll('li[data-event]').map((li) => li.element)
    await w.setProps({ items: [...EVENTS, ...OLDER] })
    const after = w.findAll('li[data-event]').map((li) => li.element)
    expect(after.slice(0, before.length)).toEqual(before)
    expect(after.slice(before.length).map((li) => li.getAttribute('data-event'))).toEqual([
      'o2',
      'o1',
    ])
  })

  it('a long was and became wrap and keep both values readable, none is cut', () => {
    const long = 'clip_99776_captions_final_v1.srt'
    const w = mount(UiLog, {
      props: {
        items: [
          {
            id: 1,
            at: 'now',
            action: 'changed',
            changes: [
              { field: 'File', from: long, to: long.replace('v1', 'v2') },
              { field: 'Owner', from: 'Anna', to: 'Oleg' },
            ],
          },
        ],
      },
    })
    const table = w.find('table')
    expect(table.classes().join(' ')).not.toContain('table-fixed')
    expect(table.classes().join(' ')).toContain('[overflow-wrap:anywhere]')
    expect(w.findAll('td.truncate')).toHaveLength(0)
    expect(w.text()).toContain(long)
    expect(w.text()).toContain(long.replace('v1', 'v2'))
  })

  it('a filter that hides every loaded event says so and offers all', async () => {
    const w = mount(UiLog, {
      props: {
        items: EVENTS,
        filters: [{ value: 'comment', label: 'Comments' }],
        filter: 'comment',
        'onUpdate:filter': (v: string) => w.setProps({ filter: v }),
      },
    })
    expect(w.text()).toContain('No events of this kind are loaded.')
    expect(w.text()).not.toContain('No activity yet')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Show all')!
      .trigger('click')
    expect(w.props('filter')).toBe('')
    expect(w.findAll('li[data-event]')).toHaveLength(EVENTS.length)
  })

  it('an invalid Date reads a dash and does not throw', () => {
    const w = mount(UiLog, { props: { items: [{ id: 1, at: new Date('nope'), action: 'did' }] } })
    const time = w.find('time')
    expect(time.text()).toBe('—')
    expect(time.attributes('datetime')).toBeUndefined()
  })

  it('a Date of today reads the hour, another day its date, another year its year; the exact moment is on the time', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // Local times: "today" is the reader's day, so a UTC noon is tomorrow at +13 and the
    // morning before it yesterday.
    vi.setSystemTime(new Date(2026, 8, 30, 12))
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 1, at: new Date(2026, 8, 30, 9, 5), action: 'a' },
          { id: 2, at: new Date(2026, 8, 24, 9, 5), action: 'b' },
          { id: 3, at: new Date(2025, 11, 24, 9, 5), action: 'c' },
        ],
      },
    })
    // Each event reads its hour; its day stands in the heading above it.
    const times = w.findAll('time').map((t) => t.text())
    for (const t of times) expect(t).toMatch(/^\d{1,2}:\d{2}( [AP]M)?$/)
    const headings = w.findAll('[id*="-day-"]').map((h) => h.element.parentElement!.textContent!)
    expect(headings[0]).toMatch(/^Today · Wed, Sep 30$/)
    expect(headings[1]).toMatch(/Sep 24/)
    expect(headings[1]).not.toMatch(/2026/)
    expect(headings[2]).toMatch(/2025/)
    expect(w.find('time').attributes('title')).toMatch(/2026/)
    // The events of a day are a list named by its heading.
    const first = w.find('ol ol')
    expect(first.attributes('aria-labelledby')).toBe(w.find('[id*="-day-"]').attributes('id'))
    vi.useRealTimers()
  })

  it('older events land in the last day or open a new one, and the days read in Russian', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 30, 12))
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: [{ id: 1, at: new Date(2026, 8, 30, 9, 5), action: 'a' }],
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({
              items: [
                { id: 1, at: new Date(2026, 8, 30, 9, 5), action: 'a' },
                { id: 2, at: new Date(2026, 8, 30, 8, 0), action: 'b' },
                { id: 3, at: new Date(2026, 8, 29, 18, 0), action: 'c' },
              ],
              hasMore: false,
            }),
          ),
      },
      global: { plugins: withGrani(RUSSIAN) },
    })
    const days = () =>
      w.findAll('[id*="-day-"]').map((h) => ({
        name: h.text(),
        events: w.find(`ol[aria-labelledby="${h.attributes('id')}"]`).findAll('li[data-event]')
          .length,
      }))
    expect(days()).toEqual([{ name: 'Сегодня', events: 1 }])
    // In Russian the button reads otherwise: it is the log's last button.
    await w.findAll('button').at(-1)!.trigger('click')
    await flush()
    await nextTick()
    expect(days()).toEqual([
      { name: 'Сегодня', events: 2 },
      { name: 'Вчера', events: 1 },
    ])
    vi.useRealTimers()
    w.unmount()
  })

  it('with a time given as a string, no day can be told: every event keeps its date on its line', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 1, at: new Date(2026, 8, 30, 9, 5), action: 'a' },
          { id: 2, at: '24 Sep, 09:05', action: 'b' },
        ],
      },
    })
    expect(w.find('[id*="-day-"]').exists()).toBe(false)
    expect(w.findAll('time')[1]!.text()).toBe('24 Sep, 09:05')
  })

  it('a handler that throws at once says the load failed', async () => {
    const w = mount(UiLog, {
      props: {
        items: EVENTS,
        hasMore: true,
        onMore: () => {
          throw new Error('down')
        },
      },
    })
    await older(w)!.trigger('click')
    await flush()
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })

  it('two @more listeners are both called, and the promise one holds the button', async () => {
    let done!: () => void
    const a = vi.fn()
    const b = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiLog, {
      props: { items: EVENTS, hasMore: true, ...mergeProps({ onMore: a }, { onMore: b }) },
    })
    await older(w)!.trigger('click')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    expect(w.find('button[aria-busy="true"]').exists()).toBe(true)
    done()
    await flush()
  })

  it('two changes of one field both render, and the changes table has a name', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          {
            id: 1,
            at: 'now',
            action: 'tagged',
            changes: [
              { field: 'Tag', to: 'Urgent' },
              { field: 'Tag', to: 'Gift' },
            ],
          },
        ],
      },
    })
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.find('table').attributes('aria-label')).toBe('Changes')
  })

  it('with a filter on and no new event of its kind, the focus stays in the log', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        filters: [{ value: 'decision', label: 'Decisions' }],
        filter: 'decision',
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false }),
          ),
      },
    })
    await beat()
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    expect(w.element.contains(document.activeElement)).toBe(true)
    expect(w.find('[role="status"]').text()).toBe('2 older events loaded')
  })

  it('with no event of the kind on, the focus lands on the filter and leaves it in the tab order', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        filters: [{ value: 'nothing', label: 'Nothing' }],
        filter: 'nothing',
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false }),
          ),
      },
    })
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    const checked = w.find('[role="radiogroup"] input:checked').element as HTMLInputElement
    expect(document.activeElement).toBe(checked)
    expect(checked.hasAttribute('tabindex')).toBe(false)
    w.unmount()
  })

  it('past three kinds the filter is a select, so it never runs past the card', async () => {
    const kinds = ['decision', 'change', 'file', 'comment'].map((value) => ({
      value,
      label: value,
    }))
    const w = mount(UiLog, {
      attachTo: document.body,
      props: { items: EVENTS, filters: kinds },
    })
    expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    const field = w.find('[role="combobox"]')
    expect(field.attributes('aria-label')).toBe('Show events')
    expect(field.text()).toContain('All')
    await field.trigger('click')
    const decision = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (o) => o.textContent?.trim() === 'decision',
    )!
    decision.click()
    await nextTick()
    expect(w.emitted('update:filter')).toEqual([['decision']])
    await w.setProps({ filter: 'decision', filters: kinds.slice(0, 3) })
    expect(w.find('[role="radiogroup"]').exists()).toBe(true)
    w.unmount()
  })

  it('the first load draws rows in the shape of events and says it is loading', async () => {
    const w = mount(UiLog, {
      props: { items: [], loading: true, hasMore: true, filters: [{ value: 'a', label: 'A' }] },
    })
    await beat()
    expect(w.findAll('[data-skeleton] li')).toHaveLength(3)
    expect(w.find('[data-skeleton]').attributes('aria-hidden')).toBe('true')
    expect(w.find('p[role="status"]').text()).toBe('Loading the history')
    expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Load older events')
    expect(w.text()).not.toContain('No activity yet')
  })

  it('a failed first load says so, and Retry calls @retry once while it runs', async () => {
    let done!: () => void
    const onRetry = vi.fn(() => new Promise<void>((r) => (done = r)))
    const w = mount(UiLog, { props: { items: [], failed: true, onRetry } })
    expect(w.find('[role="alert"]').text()).toContain('The history did not load')
    const retry = w.findAll('button').find((b) => b.text() === 'Retry')!
    await retry.trigger('click')
    await retry.trigger('click')
    expect(onRetry).toHaveBeenCalledTimes(1)
    done()
    await flush()
    await retry.trigger('click')
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('no events is said on its empty state, not left blank', () => {
    const w = mount(UiLog, { props: { items: [] } })
    expect(w.find('[role="status"]').text()).toContain('No activity yet')
    expect(w.find('ol').exists()).toBe(false)
  })

  it('a refresh keeps the events in view, dimmed and busy, and a failed one says so under them', () => {
    const w = mount(UiLog, {
      props: { items: EVENTS, loading: true, filters: [{ value: 'decision', label: 'Decisions' }] },
    })
    expect(w.findAll('li[data-event]')).toHaveLength(EVENTS.length)
    expect(w.find('[data-skeleton]').exists()).toBe(false)
    expect(w.find('ol').attributes('aria-busy')).toBe('true')
    expect(w.find('ol').classes()).toContain('opacity-60')
    expect(w.find('[role="radiogroup"]').exists()).toBe(true)
    const failed = mount(UiLog, { props: { items: EVENTS, failed: true } })
    expect(failed.findAll('li[data-event]')).toHaveLength(EVENTS.length)
    expect(failed.find('[role="alert"]').text()).toContain('The history did not load')
    expect(failed.find('[role="alert"] button').text()).toBe('Retry')
  })

  it('past three kinds, a focus with nowhere else to go lands on the select', async () => {
    const kinds = ['a', 'b', 'c', 'nothing'].map((value) => ({ value, label: value }))
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        filters: kinds,
        filter: 'nothing',
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false }),
          ),
      },
    })
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    const field = w.find('[role="combobox"]').element as HTMLElement
    expect(document.activeElement).toBe(field)
    expect(field.hasAttribute('tabindex')).toBe(false)
    w.unmount()
  })

  it('a kind named like the word for all is still its own kind', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: { items: EVENTS, filters: [{ value: '*', label: 'Starred' }] },
    })
    await w.findAll('[role="radiogroup"] input')[1]!.setValue(true)
    expect(w.emitted('update:filter')).toEqual([['*']])
    w.unmount()
  })

  it('two logs with the same ids: the focus goes to the new event of the log that loaded', async () => {
    mount(UiLog, { attachTo: document.body, props: { items: [...EVENTS, ...OLDER] } })
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        hasMore: true,
        onMore: (): Promise<void> =>
          Promise.resolve().then(() =>
            w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false }),
          ),
      },
    })
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    expect(w.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement?.getAttribute('data-event')).toBe('o2')
  })

  it('a handler that loads at once, returning nothing, still keeps the place', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: EVENTS,
        hasMore: true,
        onMore: () => {
          w.setProps({ items: [...EVENTS, ...OLDER], hasMore: false })
        },
      },
    })
    ;(older(w)!.element as HTMLElement).focus()
    await older(w)!.trigger('click')
    await flush()
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-event')).toBe('o2')
  })

  it('a long value in a badge is cut by the badge, the whole text in its tooltip, no title of its own', () => {
    const long = 'Waiting for the captions bureau to answer'
    const w = mount(UiLog, {
      props: {
        items: [
          {
            id: 1,
            at: 'now',
            action: 'set',
            changes: [{ field: 'Status', to: long, tone: 'warning' }],
          },
        ],
      },
    })
    const badge = w.findComponent(UiBadge)
    expect(badge.attributes('title')).toBeUndefined()
    expect(badge.findComponent({ name: 'UiTruncate' }).props('text')).toBe(long)
  })
})

describe('UiLog — days, focus and what is said', () => {
  afterEach(() => vi.useRealTimers())
  const at = (iso: string) => new Date(iso)
  const headings = (w: ReturnType<typeof mount>) =>
    w.findAll('[id*="-day-"]').map((h) => h.element.parentElement!.textContent ?? '')

  it('a filter does not turn the day headings on or off', async () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 2, at: at('2026-09-27T10:00:00Z'), action: 'approved', kind: 'decision' },
          { id: 1, at: '26 Sep, 18:00', action: 'commented', kind: 'comment' },
        ],
        filters: [{ value: 'decision', label: 'Decisions' }],
      },
    })
    expect(headings(w)).toHaveLength(0)
    await w.setProps({ filter: 'decision' })
    expect(headings(w)).toHaveLength(0)
  })

  it('an unsorted log gives every day heading its own id', () => {
    const w = mount(UiLog, {
      props: {
        items: [
          { id: 3, at: at('2026-09-27T10:00:00Z'), action: 'a' },
          { id: 2, at: at('2026-09-25T10:00:00Z'), action: 'b' },
          { id: 1, at: at('2026-09-27T09:00:00Z'), action: 'c' },
        ],
      },
    })
    const ids = w.findAll('[id*="-day-"]').map((e) => e.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("the day and the exact time follow the app's zone, not the browser's", () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-30T23:45:00Z') })
    const item = [{ id: 1, at: at('2026-09-30T23:30:00Z'), action: 'saved' }]
    const east = mount(UiLog, {
      props: { items: item },
      global: { plugins: withGrani({ timeZone: 'Pacific/Kiritimati', locale: 'en' }) },
    })
    const west = mount(UiLog, {
      props: { items: item },
      global: { plugins: withGrani({ timeZone: 'Pacific/Pago_Pago', locale: 'en' }) },
    })
    expect(headings(east)[0]).toContain('Oct 1')
    expect(headings(west)[0]).toContain('Sep 30')
    expect(east.find('time').text()).toBe('1:30 PM')
    expect(west.find('time').text()).toBe('12:30 PM')
  })

  it('after a Retry that brought the history, the focus does not fall to the page', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: [],
        failed: true,
        // The history comes before the promise is answered, as the app's load does.
        onRetry: async () => {
          await w.setProps({ failed: false, items: [{ id: 1, at: 'now', action: 'saved' }] })
        },
      },
    })
    const retry = w.findAll('button').find((b) => b.text() === 'Retry')!
    ;(retry.element as HTMLElement).focus()
    await retry.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(document.activeElement).toBe(w.find('li[data-event]').element)
    w.unmount()
  })

  it('the older-events count is said once: a refresh lets it go', async () => {
    let items: LogEvent[] = [{ id: 2, at: 'b', action: 'b' }]
    const w = mount(UiLog, {
      props: {
        items,
        hasMore: true,
        onMore: async () => {
          items = [...items, { id: 1, at: 'a', action: 'a' }]
          await w.setProps({ items })
        },
      },
    })
    await beat()
    await w
      .findAll('button')
      .find((b) => b.text().includes('older'))!
      .trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    const region = () => w.find('p[role="status"]').text()
    expect(region()).toContain('1 older event')
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    expect(region()).toBe('')
  })

  it('Load older events waits while a refresh runs, and keeps the focus', async () => {
    const onMore = vi.fn(async () => {})
    const w = mount(UiLog, {
      attachTo: document.body,
      props: { items: EVENTS, hasMore: true, onMore },
    })
    const older = w.findAll('button').find((b) => b.text().includes('older'))!
    ;(older.element as HTMLElement).focus()
    await w.setProps({ loading: true })
    expect(older.attributes('aria-disabled')).toBe('true')
    // Not natively disabled: a browser drops the focus of a disabled button to the page.
    expect(older.attributes('disabled')).toBeUndefined()
    await older.trigger('click')
    expect(onMore).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(older.element)
    await w.setProps({ loading: false })
    expect(older.attributes('aria-disabled')).toBeUndefined()
    w.unmount()
  })

  it('a Retry whose history is drawn after its promise ends still hands the focus on', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: [],
        failed: true,
        onRetry: async () => {
          setTimeout(
            () => w.setProps({ failed: false, items: [{ id: 1, at: 'now', action: 'saved' }] }),
            20,
          )
        },
      },
    })
    const retry = w.findAll('button').find((b) => b.text() === 'Retry')!
    ;(retry.element as HTMLElement).focus()
    await retry.trigger('click')
    await new Promise((r) => setTimeout(r, 50))
    await nextTick()
    expect(document.activeElement).toBe(w.find('li[data-event]').element)
    w.unmount()
  })

  it('a Retry that passes through a skeleton and fails again hands the focus to the new Retry', async () => {
    const w = mount(UiLog, {
      attachTo: document.body,
      props: {
        items: [],
        failed: true,
        onRetry: async () => {
          await w.setProps({ failed: false, loading: true })
          await w.setProps({ failed: true, loading: false })
        },
      },
    })
    const retry = w.findAll('button').find((b) => b.text() === 'Retry')!
    ;(retry.element as HTMLElement).focus()
    await retry.trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    const again = w.findAll('button').find((b) => b.text() === 'Retry')!
    expect(document.activeElement).toBe(again.element)
    w.unmount()
  })
})

describe('UiLog — review follow-ups', () => {
  const one = (change: LogChange) =>
    mount(UiLog, {
      props: { items: [{ id: 1, at: 'now', action: 'changed', changes: [change] }] },
    }).find('li[data-event]')
  const two = (change: LogChange) =>
    mount(UiLog, {
      props: {
        items: [
          {
            id: 1,
            at: 'now',
            action: 'changed',
            changes: [change, { field: 'Qty', from: 5, to: 6 }],
          },
        ],
      },
    }).findAll('tbody tr')[0]!

  it('a text cleared to an empty string reads cleared on a line, as a null does', () => {
    for (const to of ['', null]) {
      expect(one({ field: 'Note', from: 'Call back', to }).text(), `${to}`).toContain('cleared')
    }
  })

  it('a text cleared to an empty string reads cleared in the table, as a null does', () => {
    for (const to of ['', null]) {
      expect(two({ field: 'Note', from: 'Call back', to }).text(), `${to}`).toContain('cleared')
    }
  })

  it('a zero is a value, not a cleared field', () => {
    expect(one({ field: 'Qty', from: 5, to: 0 }).text()).not.toContain('cleared')
    expect(one({ field: 'Qty', from: 5, to: 0 }).text()).toContain('0')
    expect(two({ field: 'Qty', from: 5, to: 0 }).text()).not.toContain('cleared')
  })

  it('a text that was empty reads as set on a line, as one never given does', () => {
    expect(one({ field: 'Note', from: '', to: 'Call back' }).text()).not.toContain('became')
  })

  it('a text that was empty reads as a dash in the table', () => {
    expect(two({ field: 'Note', from: '', to: 'Call back' }).findAll('td')[1]!.text()).toBe('—')
  })
})
