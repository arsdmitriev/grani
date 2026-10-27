import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { BADGE_TONES } from '../utils/tone'
import UiBadge from './UiBadge.vue'
import UiTruncate from './UiTruncate.vue'

const TONES = ['neutral', 'brand', 'success', 'warning', 'danger', 'info'] as const
const VARIANTS = ['soft', 'inline', 'outline'] as const

describe('UiBadge — tone', () => {
  it('paints with semantic tokens and no dark: classes', () => {
    const neutral = mount(UiBadge)
    expect(neutral.classes()).toEqual(
      expect.arrayContaining(['bg-neutral-subtle', 'text-neutral-subtle-fg']),
    )
    expect(neutral.classes().join(' ')).not.toContain('dark:')
    const success = mount(UiBadge, { props: { tone: 'success' } })
    expect(success.classes()).toEqual(
      expect.arrayContaining(['bg-success-subtle', 'text-success-subtle-fg']),
    )
  })

  it('every tone renders its own pale pair, warning included', () => {
    const fill = {
      neutral: 'bg-neutral-subtle',
      brand: 'bg-brand-subtle',
      success: 'bg-success-subtle',
      warning: 'bg-warning-subtle',
      danger: 'bg-danger-subtle',
      info: 'bg-info-subtle',
    }
    const seen = new Set<string>()
    for (const tone of TONES) {
      const cls = mount(UiBadge, { props: { tone } }).classes().join(' ')
      expect(cls, tone).toContain(fill[tone])
      expect(seen.has(cls)).toBe(false)
      seen.add(cls)
    }
  })

  it('the pill has no border in any tone', () => {
    for (const tone of TONES) {
      expect(mount(UiBadge, { props: { tone } }).classes().join(' '), tone).not.toMatch(
        /\bborder\b/,
      )
    }
  })

  it('an unknown tone falls back to neutral instead of dropping the color', () => {
    for (const bogus of ['green', 'constructor', 'toString']) {
      const cls = mount(UiBadge, { props: { tone: bogus as never, label: 'x' } })
        .classes()
        .join(' ')
      expect(cls, bogus).toContain('bg-neutral-subtle')
    }
  })
})

describe('UiBadge — variants', () => {
  it('inline is a dot and text without a plate; sm compacts it', () => {
    const md = mount(UiBadge, { props: { variant: 'inline', tone: 'warning', label: 'Pending' } })
    expect(md.classes()).toContain('ui-badge--inline')
    expect(md.classes().join(' ')).toContain('text-sm')
    expect(md.find('span[aria-hidden="true"]').classes()).toContain('bg-[var(--color-warning-dot)]')
    expect(md.classes().join(' ')).not.toContain('bg-warning-subtle')
    expect(md.classes().join(' ')).not.toContain('rounded-pill')

    const sm = mount(UiBadge, { props: { variant: 'inline', size: 'sm', label: 'Hidden' } })
    expect(sm.classes().join(' ')).toContain('text-xs')
    expect(sm.find('span[aria-hidden="true"]').classes()).toContain('h-1.5')
  })

  it('inline has no icon slot: it is a dot and text, nothing else', () => {
    const plain = mount(UiBadge, {
      props: { variant: 'inline', label: 'x' },
      slots: { icon: '<svg data-t="icon" />' },
    })
    expect(plain.find('[data-t="icon"]').exists()).toBe(false)
    const solid = mount(UiBadge, {
      props: { label: 'x' },
      slots: { icon: '<svg data-t="icon" />' },
    })
    expect(solid.find('[data-t="icon"]').exists()).toBe(true)
  })

  it('outline has a toned border on tokens', () => {
    const cls = mount(UiBadge, { props: { variant: 'outline', tone: 'danger', label: 'Failed' } })
      .classes()
      .join(' ')
    expect(cls).toContain('border-danger-border')
    expect(cls).toContain('bg-danger-subtle')
    expect(cls).not.toContain('dark:')
  })

  it('The words name the state in every form, from the label or the slot.', () => {
    for (const variant of VARIANTS) {
      expect(mount(UiBadge, { props: { variant, label: 'from prop' } }).text()).toContain(
        'from prop',
      )
      expect(
        mount(UiBadge, { props: { variant }, slots: { default: 'from slot' } }).text(),
      ).toContain('from slot')
    }
  })
})

describe('UiBadge — dot', () => {
  it('renders a toned dot when asked and none otherwise', () => {
    const withDot = mount(UiBadge, { props: { tone: 'success', dot: true } })
    expect(withDot.find('span[aria-hidden="true"]').classes()).toContain(
      'bg-[var(--color-success-dot)]',
    )
    expect(
      mount(UiBadge, { props: { tone: 'success' } })
        .find('span[aria-hidden="true"]')
        .exists(),
    ).toBe(false)
  })

  it('the dot is one token per tone, on the plate and off it', () => {
    const onFill = mount(UiBadge, { props: { tone: 'warning', dot: true } })
    expect(onFill.find('span[aria-hidden="true"]').classes()).toContain(
      'bg-[var(--color-warning-dot)]',
    )
    expect(
      mount(UiBadge, { props: { tone: 'success', dot: true } })
        .find('span[aria-hidden="true"]')
        .classes(),
    ).toContain('bg-[var(--color-success-dot)]')
    const onPage = mount(UiBadge, { props: { tone: 'warning', variant: 'outline', dot: true } })
    expect(onPage.find('span[aria-hidden="true"]').classes()).toContain(
      'bg-[var(--color-warning-dot)]',
    )
  })

  it('the remove button takes the color of the plate text, not a gray of its own', () => {
    const w = mount(UiBadge, { props: { tone: 'info', removable: true, label: 'Tag' } })
    const cls = w.find('button').classes()
    expect(cls).toContain('text-current')
    expect(cls.join(' ')).not.toContain('text-fg-muted')
  })

  it('the remove button follows the corner of its badge: round in a pill, badge radius in outline', () => {
    expect(
      mount(UiBadge, { props: { removable: true, label: 'x' } })
        .find('button')
        .classes(),
    ).toContain('rounded-pill')
    expect(
      mount(UiBadge, { props: { removable: true, variant: 'outline', label: 'x' } })
        .find('button')
        .classes(),
    ).toContain('rounded-badge')
  })
})

describe('UiBadge — slots and removal', () => {
  it('renders the icon slot before the text', () => {
    const w = mount(UiBadge, { slots: { icon: '<svg data-t="icon" />', default: 'Admin' } })
    const html = w.html()
    expect(html.indexOf('data-t="icon"')).toBeLessThan(html.indexOf('Admin'))
  })

  it('The cross is a named button that removes the badge.', async () => {
    const w = mount(UiBadge, { props: { removable: true, label: 'Desserts' } })
    const btn = w.find('button')
    expect(btn.attributes('aria-label')).toBe('Remove Desserts')
    // A native button, in the tab order: Tab reaches it, and Enter and Space press it as any
    // button's click does.
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(Number(btn.attributes('tabindex') ?? 0)).toBeGreaterThanOrEqual(0)
    await btn.trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
  })

  it('removeLabel overrides the accessible name', () => {
    const w = mount(UiBadge, {
      props: { removable: true, label: 'x', removeLabel: 'Clear filter' },
    })
    expect(w.find('button').attributes('aria-label')).toBe('Clear filter')
  })

  it('the close button exists in every variant only when removable', () => {
    for (const variant of VARIANTS) {
      expect(
        mount(UiBadge, { props: { variant, removable: true, label: 'x' } })
          .find('button')
          .exists(),
      ).toBe(true)
      expect(
        mount(UiBadge, { props: { variant, label: 'x' } })
          .find('button')
          .exists(),
      ).toBe(false)
    }
  })
})

describe('UiBadge — loading', () => {
  it('While it works a spinner stands where the dot was, and the words say what runs.', () => {
    const w = mount(UiBadge, {
      props: { loading: true, dot: true, tone: 'info', label: 'Syncing' },
    })
    expect(w.find('.ui-spinner').exists()).toBe(true)
    expect(w.find('span[aria-hidden]').exists()).toBe(false)
    expect(w.text()).toBe('Syncing')
    const withIcon = mount(UiBadge, {
      props: { loading: true, label: 'Syncing' },
      slots: { icon: '<svg data-t="icon" />' },
    })
    expect(withIcon.find('[data-t="icon"]').exists()).toBe(false)
    expect(
      mount(UiBadge, { props: { label: 'Done' } })
        .find('.ui-spinner')
        .exists(),
    ).toBe(false)
  })

  it('the spinner is 14px with a heavier stroke, one step above the badge glyph', () => {
    const w = mount(UiBadge, { props: { loading: true, label: 'Syncing' } })
    const cls = w.find('.ui-spinner').classes()
    expect(cls).toEqual(expect.arrayContaining(['!h-3.5', '!w-3.5', '[stroke-width:2.75]']))
  })
})

describe('UiBadge — warning', () => {
  it('is a pale plate with the neutral ink; the dot carries the tone', () => {
    const w = mount(UiBadge, { props: { tone: 'warning', dot: true, label: 'Attention' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-warning-subtle', 'text-fg']))
    expect(w.find('span[aria-hidden="true"]').classes()).toContain('bg-[var(--color-warning-dot)]')
    const outline = mount(UiBadge, { props: { tone: 'warning', variant: 'outline', label: 'x' } })
    expect(outline.classes()).toContain('text-fg')
  })
})

describe('UiBadge — size', () => {
  it('sm compacts every form, md is the default', () => {
    for (const variant of ['soft', 'outline'] as const) {
      const sm = mount(UiBadge, { props: { variant, size: 'sm', label: 'x' } }).classes()
      const md = mount(UiBadge, { props: { variant, label: 'x' } }).classes()
      expect(sm, variant).toEqual(expect.arrayContaining(['h-5', 'text-[11px]', 'leading-4']))
      expect(md, variant).toEqual(expect.arrayContaining(['h-6', 'text-xs', 'leading-4']))
    }
  })
})

describe('UiBadge — review follow-ups', () => {
  it('a removable badge with slot text names its button after that text', () => {
    const w = mount(UiBadge, { props: { removable: true }, slots: { default: 'Draft' } })
    const btn = w.find('button')
    expect(btn.attributes('aria-label')).toBeUndefined()
    const ids = btn.attributes('aria-labelledby')!.split(' ')
    expect(ids.map((id) => w.find(`[id="${id}"]`).text())).toEqual(['Remove', 'Draft'])
  })

  it('the close button stays live while loading: removing cancels', async () => {
    const w = mount(UiBadge, { props: { removable: true, loading: true, label: 'Syncing' } })
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
  })

  it('While a loading set from the click runs, a second press past the double-click window waits.', async () => {
    vi.useFakeTimers()
    try {
      // Without loading the cross is live again after the window: the second press removes.
      const free = mount(UiBadge, { props: { removable: true, label: 'Kiosk' } })
      await free.find('button').trigger('click')
      await vi.advanceTimersByTimeAsync(800)
      await free.find('button').trigger('click')
      expect(free.emitted('remove')).toHaveLength(2)
      // With the host's loading on from the first press, the second press past it is held.
      const busy = mount(UiBadge, { props: { removable: true, label: 'Kiosk' } })
      await busy.find('button').trigger('click')
      await busy.setProps({ loading: true })
      await vi.advanceTimersByTimeAsync(800)
      await busy.find('button').trigger('click')
      expect(busy.emitted('remove')).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('UiBadge — review follow-ups', () => {
  // A failed assertion must not leave fake timers to the next test.
  afterEach(() => {
    vi.useRealTimers()
  })

  it('the dot is never the color of the plate under it, in every variant and tone', () => {
    // A warning dot on a fill of its own color vanishes. The check compares two
    // classes of one render.
    for (const variant of VARIANTS) {
      for (const tone of BADGE_TONES) {
        const w = mount(UiBadge, { props: { variant, tone, dot: true, label: 'Label' } })
        const plate = w.classes()
        const dot = w.find('span[aria-hidden="true"].rounded-pill')
        const dotBg = dot.classes().find((c) => c.startsWith('bg-')) ?? ''
        expect(dotBg, `${variant}/${tone}: the dot has no fill`).not.toBe('')
        expect(plate.includes(dotBg), `${variant}/${tone}: dot ${dotBg} on its own color`).toBe(
          false,
        )
      }
    }
  })

  it('a dot drops the icon and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiBadge, {
      props: { dot: true, tone: 'success', label: 'Done' },
      slots: { icon: '<svg class="glyph" />' },
    })
    expect(w.find('.glyph').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('a dot or an icon'))
    warn.mockRestore()
  })

  it('with a slot the close button is named by what is on screen, not by label', () => {
    const w = mount(UiBadge, {
      props: { removable: true, label: 'fallback' },
      slots: { default: 'Visible text' },
    })
    const btn = w.find('button')
    expect(btn.attributes('aria-label')).toBeUndefined()
    const ids = btn.attributes('aria-labelledby')!.split(' ')
    expect(ids.map((id) => w.find(`[id="${id}"]`).text()).join(' ')).toContain('Visible text')
  })

  it('A double click on the cross removes once, even when the host re-renders between the clicks.', async () => {
    // A host that marks the row "deleting" on the first remove re-renders the badge before
    // the second click: a render does not reopen the cross.
    let removes = 0
    const Host = defineComponent({
      setup() {
        const deleting = ref(false)
        return () =>
          h('div', { 'data-deleting': deleting.value }, [
            h(
              UiBadge,
              { removable: true, onRemove: () => ((deleting.value = true), removes++) },
              () => `Tag${deleting.value ? '…' : ''}`,
            ),
          ])
      },
    })
    const w = mount(Host)
    await w.find('button').trigger('click')
    await w.find('button').trigger('click')
    expect(removes).toBe(1)
  })

  it('a canceled confirm reopens the × on its own after the double-click interval', async () => {
    // After "Cancel" in a confirm nothing changes: the cross reopens on a timer, not on a prop.
    vi.useFakeTimers()
    const w = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
    await w.find('button').trigger('click')
    vi.advanceTimersByTime(100)
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
    vi.advanceTimersByTime(500)
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(2)
  })

  it('a loading the host turns on holds the × until it ends', async () => {
    vi.useFakeTimers()
    const w = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
    await w.find('button').trigger('click')
    await w.setProps({ loading: true })
    vi.advanceTimersByTime(2000)
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
    await w.setProps({ loading: false })
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(2)
    await w.setProps({ label: 'Other' })
    await w.find('button').trigger('click')
    expect(w.emitted('remove')).toHaveLength(3)
  })

  it('an inline badge drops the icon and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiBadge, {
      props: { variant: 'inline', label: 'Online' },
      slots: { icon: '<svg class="glyph" />' },
    })
    expect(w.find('.glyph').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('inline has a dot'))
    warn.mockRestore()
  })

  it('both ways to name the close button read the same phrase', () => {
    const byProp = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
    const bySlot = mount(UiBadge, { props: { removable: true }, slots: { default: 'Tag' } })
    const ids = bySlot.find('button').attributes('aria-labelledby')!.split(' ')
    const read = ids.map((id) => bySlot.find(`[id="${id}"]`).text()).join(' ')
    expect(byProp.find('button').attributes('aria-label')).toBe(read)
  })

  it('hover on the close button is gated on enabled:', () => {
    const cls = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
      .find('button')
      .classes()
    expect(cls).toContain('enabled:hover:before:bg-fg/10')
    expect(cls).not.toContain('hover:before:bg-fg/10')
  })

  it('A long label is cut at the width of its place.', () => {
    const w = mount(UiBadge, { props: { label: 'A very long label that does not fit' } })
    expect(w.classes()).toContain('max-w-full')
    expect(w.find('span.truncate').exists()).toBe(true)
  })

  it('brand wears its own plate and ink in every variant', () => {
    expect(mount(UiBadge, { props: { tone: 'brand' } }).classes()).toEqual(
      expect.arrayContaining(['bg-brand-subtle', 'text-brand-subtle-fg']),
    )
    expect(mount(UiBadge, { props: { tone: 'brand', variant: 'outline' } }).classes()).toContain(
      'border-brand',
    )
  })

  it('a removable badge with no text still names its close button', () => {
    const w = mount(UiBadge, { props: { removable: true } })
    expect(w.find('button').attributes('aria-labelledby')).toBeTruthy()
    expect(w.find('.sr-only').exists()).toBe(true)
  })
})

describe('UiBadge — review follow-ups', () => {
  it('the hover plate of the cross stands 2px inside the badge at both sizes', () => {
    const sm = mount(UiBadge, { props: { removable: true, label: 'Lisbon', size: 'sm' } })
    const md = mount(UiBadge, { props: { removable: true, label: 'Status: Active', size: 'md' } })
    expect(sm.find('button').classes()).toContain('before:inset-0.5')
    expect(sm.find('button').classes()).toContain('-me-2')
    expect(md.find('button').classes()).toContain('before:inset-0')
    expect(sm.find('button svg').classes()).toContain('h-2.5')
    expect(md.find('button svg').classes()).toContain('h-3')
  })

  it('the cross stands 2px inside an outline badge too: its pull follows the tighter padding', () => {
    const outline = mount(UiBadge, {
      props: { removable: true, label: 'Guest', variant: 'outline' },
    })
    const soft = mount(UiBadge, { props: { removable: true, label: 'Guest' } })
    expect(outline.find('button').classes()).toContain('-me-1.5')
    expect(soft.find('button').classes()).toContain('-me-2')
  })
})

describe('UiBadge — review follow-ups', () => {
  it('sets aria-busy on the root while loading, as every other busy control in the library does', () => {
    expect(
      mount(UiBadge, { props: { label: 'Syncing', loading: true } }).attributes('aria-busy'),
    ).toBe('true')
    expect(mount(UiBadge, { props: { label: 'Done' } }).attributes('aria-busy')).toBeUndefined()
  })
})

describe('UiBadge — review follow-ups, second pass', () => {
  it('A cut label keeps its whole text in a tooltip; text from the slot is cut without one.', () => {
    const w = mount(UiBadge, { props: { label: 'Waiting for the second signature' } })
    const cut = w.findComponent(UiTruncate)
    expect(cut.exists()).toBe(true)
    expect(cut.props('text')).toBe('Waiting for the second signature')
    const slotted = mount(UiBadge, { slots: { default: 'Own <b>text</b>' } })
    expect(slotted.findComponent(UiTruncate).exists()).toBe(false)
    expect(slotted.find('.truncate').exists()).toBe(true)
  })

  it('an inline removable badge keeps its cross inside its own box', () => {
    const w = mount(UiBadge, { props: { variant: 'inline', removable: true, label: 'Tag' } })
    expect(
      w
        .find('button')
        .classes()
        .some((c) => c.startsWith('-me-')),
    ).toBe(false)
  })

  it('the cross keeps a 24px hit area around its 20px plate', () => {
    const cls = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
      .find('button')
      .classes()
    expect(cls).toEqual(
      expect.arrayContaining(['h-5', 'w-5', 'after:absolute', 'after:-inset-0.5']),
    )
  })

  it('A badge with no words is a bare color and warns in development.', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiBadge, { props: { dot: true, tone: 'danger' } })
    mount(UiBadge, { props: { label: 'Paid' } })
    const said = warn.mock.calls.map((c) => String(c[0]))
    expect(said.filter((m) => m.includes('has no text'))).toHaveLength(1)
    warn.mockRestore()
  })
})

describe('UiBadge — a held Enter on the cross', () => {
  // A held Enter repeats, and each repeat clicks: in a list of tags the focus moves to the next
  // cross after each removal, and the whole list would go at key-repeat speed. Only the first press
  // removes; the repeats are the same press.
  it('the first Enter removes, its repeats do nothing', async () => {
    const w = mount(UiBadge, { props: { removable: true, label: 'Tag' } })
    const cross = w.find('button').element
    const first = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    cross.dispatchEvent(first)
    expect(first.defaultPrevented).toBe(false)
    const held = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat: true,
      bubbles: true,
      cancelable: true,
    })
    cross.dispatchEvent(held)
    expect(held.defaultPrevented).toBe(true)
    w.unmount()
  })
})
