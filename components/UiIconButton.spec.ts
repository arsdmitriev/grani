import { mount as mountRoot } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ChevronDown, Pencil } from '@lucide/vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiIconButton from './UiIconButton.vue'
import UiMenu from './UiMenu.vue'
import UiTooltip from './UiTooltip.vue'
import { defineComponent, h, ref } from 'vue'

interface MountOptions {
  props?: Record<string, unknown>
  attrs?: Record<string, unknown>
  slots?: Record<string, unknown>
  attachTo?: Element | string
}

// Every assertion is about the button; the component's own handles stay reachable.
const mount = (c: typeof UiIconButton, o: MountOptions = {}) => {
  const w = mountRoot(c, o as never)
  return Object.assign(w.find('button'), {
    setProps: w.setProps.bind(w),
    unmount: w.unmount.bind(w),
  })
}

const VARIANTS = ['primary', 'outline', 'ghost'] as const
const TONES = ['neutral', 'brand', 'danger'] as const

describe('UiIconButton — shape', () => {
  it('is a square on the control ladder: 36 by default, 44, 28', () => {
    expect(mount(UiIconButton).classes()).toEqual(expect.arrayContaining(['h-9', 'w-9']))
    expect(mount(UiIconButton, { props: { size: 'md' } }).classes()).toEqual(
      expect.arrayContaining(['h-11', 'w-11']),
    )
    expect(mount(UiIconButton, { props: { size: 'xs' } }).classes()).toEqual(
      expect.arrayContaining(['h-7', 'w-7']),
    )
  })

  it('the glyph follows the square: 16 in sm, 20 in md', () => {
    expect(mount(UiIconButton).classes()).toContain('[&_svg]:h-4')
    expect(mount(UiIconButton, { props: { size: 'md' } }).classes()).toContain('[&_svg]:h-5')
  })

  it('renders the `icon` component as a hidden svg', () => {
    const svg = mount(UiIconButton, { props: { icon: Pencil } }).find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('the default slot replaces `icon`', () => {
    const w = mount(UiIconButton, {
      props: { icon: Pencil },
      slots: { default: '<i class="custom" />' },
    })
    expect(w.find('.custom').exists()).toBe(true)
    expect(w.find('svg').exists()).toBe(false)
  })

  it('#trailing turns the square into a pill that keeps its height', () => {
    const w = mount(UiIconButton, {
      props: { size: 'sm' },
      slots: { default: '<i />', trailing: '<span>3</span>' },
    })
    expect(w.classes()).toEqual(expect.arrayContaining(['w-auto', 'min-w-9', 'h-9']))
    expect(w.classes()).not.toContain('w-9')
    expect(w.text()).toContain('3')
  })
})

describe('UiIconButton — presentation × meaning', () => {
  it('outline is a white square with a border, ghost is transparent at rest', () => {
    const outline = mount(UiIconButton).classes()
    expect(outline).toEqual(expect.arrayContaining(['border-border', 'bg-surface']))
    const ghost = mount(UiIconButton, { props: { variant: 'ghost' } }).classes()
    expect(ghost).toEqual(expect.arrayContaining(['border-transparent', 'bg-transparent']))
    expect(ghost.join(' ')).not.toContain('hover:border')
  })

  it('every cell of the matrix has a text color and a border', () => {
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const cls = mount(UiIconButton, { props: { variant, tone } }).classes()
        expect(cls.some((c) => c.startsWith('text-'))).toBe(true)
        expect(cls.some((c) => c.startsWith('border-'))).toBe(true)
      }
    }
  })

  it('a quiet delete is red and keeps the red focus ring', () => {
    const w = mount(UiIconButton, { props: { variant: 'ghost', tone: 'danger' } })
    expect(w.classes()).toContain('text-danger-subtle-fg')
    expect(w.attributes('data-focus')).toBe('danger')
    expect(mount(UiIconButton).attributes('data-focus')).toBeUndefined()
  })

  it('hover is gated on enabled: in every cell and when pressed', () => {
    const cases = [
      ...VARIANTS.flatMap((variant) => TONES.map((tone) => ({ variant, tone }))),
      { pressed: true },
    ]
    for (const props of cases) {
      const hover = mount(UiIconButton, { props })
        .classes()
        .filter((c) => c.includes('hover:'))
      expect(hover.length).toBeGreaterThan(0)
      for (const c of hover) expect(c).toMatch(/^enabled:hover:/)
      expect(hover.join(' ')).not.toMatch(/opacity/)
    }
  })
})

describe('UiIconButton — primary', () => {
  it('is the brand fill with no border to see, marked filled for a group', () => {
    const w = mount(UiIconButton, { props: { variant: 'primary' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['border-transparent', 'bg-brand-solid']))
    expect(w.attributes('data-filled')).toBe('true')
    expect(mount(UiIconButton).attributes('data-filled')).toBeUndefined()
  })

  it('pressed keeps the primary fill and still says aria-pressed', () => {
    const w = mount(UiIconButton, { props: { variant: 'primary', pressed: true } })
    expect(w.classes()).toContain('bg-brand-solid')
    expect(w.classes()).not.toContain('bg-brand')
    expect(w.attributes('aria-pressed')).toBe('true')
  })

  it('disabled is the flat plate, as UiButton primary', () => {
    const w = mount(UiIconButton, { props: { variant: 'primary', disabled: true } })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-border-strong/40', 'text-disabled-fg']))
    expect(w.classes()).not.toContain('bg-brand-solid')
  })
})

describe('UiIconButton — states', () => {
  it('ariaLabel is the accessible name; no tooltip and no title show it', async () => {
    const w = mount(UiIconButton, { props: { ariaLabel: 'Delete row' }, attachTo: document.body })
    expect(w.attributes('aria-label')).toBe('Delete row')
    expect(w.attributes('title')).toBeUndefined()
    await w.trigger('focusin')
    await w.trigger('pointerenter')
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    w.unmount()
  })

  it('aria-pressed appears only on a toggle', () => {
    expect(mount(UiIconButton).attributes('aria-pressed')).toBeUndefined()
    expect(mount(UiIconButton, { props: { pressed: true } }).attributes('aria-pressed')).toBe(
      'true',
    )
    expect(mount(UiIconButton, { props: { pressed: false } }).attributes('aria-pressed')).toBe(
      'false',
    )
  })

  it('pressed on wins over variant and tone with the brand frame and plate', () => {
    const cls = mount(UiIconButton, { props: { pressed: true, tone: 'danger' } }).classes()
    expect(cls).toEqual(expect.arrayContaining(['border-brand', 'bg-brand-subtle']))
    expect(cls).not.toContain('text-danger')
  })

  it('loading shows a spinner larger than the glyph and refuses clicks', () => {
    const w = mount(UiIconButton, { props: { icon: Pencil, loading: true, size: 'md' } })
    const svg = w.find('svg')
    expect(svg.classes()).toContain('animate-spin')
    expect(svg.classes()).toContain('!h-6')
    expect(w.findAll('svg')).toHaveLength(1)
    // Enabled, so a focused button keeps focus; refused by aria-disabled and the guard.
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.classes()).toContain('pointer-events-none')
  })

  it('keeps focus when loading starts and refuses the click before the caller', async () => {
    let hits = 0
    const w = mount(UiIconButton, {
      attachTo: document.body,
      props: { ariaLabel: 'Edit' },
      attrs: { onClick: () => hits++ },
    })
    ;(w.element as HTMLButtonElement).focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(w.element)
    await w.trigger('click')
    expect(hits).toBe(0)
    w.unmount()
  })

  it('loading wins over disabled: the color stays', () => {
    const w = mount(UiIconButton, {
      props: { ariaLabel: 'Edit', loading: true, disabled: true, tone: 'danger' },
    })
    expect(w.classes()).toContain('text-danger-subtle-fg')
    expect(w.classes()).not.toContain('text-disabled-fg')
    expect(w.attributes('disabled')).toBeUndefined()
  })

  it('disabled disables the native button', () => {
    expect(mount(UiIconButton, { props: { disabled: true } }).attributes('disabled')).toBeDefined()
  })
})

describe('UiIconButton — review follow-ups', () => {
  it('fires click when enabled and never when disabled or loading', async () => {
    for (const [props, expected] of [
      [{}, 1],
      [{ disabled: true }, 0],
      [{ loading: true }, 0],
    ] as const) {
      let hits = 0
      const w = mount(UiIconButton, {
        props: { ariaLabel: 'Edit', ...props },
        attrs: { onClick: () => hits++ },
      })
      await w.trigger('click')
      expect(hits).toBe(expected)
    }
  })

  it('arbitrary attributes land on the root button', () => {
    const w = mount(UiIconButton, {
      props: { ariaLabel: 'Edit' },
      attrs: { 'data-testid': 'edit' },
    })
    expect(w.attributes('data-testid')).toBe('edit')
  })

  it('disabled grays the glyph and keeps the shape; loading keeps the color', () => {
    const off = mount(UiIconButton, { props: { ariaLabel: 'Edit', disabled: true } }).classes()
    expect(off).toEqual(
      expect.arrayContaining(['text-disabled-fg', 'border-border', 'bg-border-strong/40']),
    )
    // Enabled rests in the text's ink; disabled must not wear the same color.
    expect(mount(UiIconButton, { props: { ariaLabel: 'Edit' } }).classes()).not.toContain(
      'text-disabled-fg',
    )
    expect(off.join(' ')).not.toMatch(/opacity/)
    const busy = mount(UiIconButton, {
      props: { ariaLabel: 'Edit', loading: true, tone: 'danger' },
    })
    expect(busy.classes()).toContain('text-danger-subtle-fg')
  })
})

describe('UiIconButton — review follow-ups', () => {
  it('a tail never wraps: the width grows, the height stays on the ladder', () => {
    const w = mount(UiIconButton, {
      props: { icon: Pencil, ariaLabel: 'Comments, 128' },
      slots: { trailing: '128 comments' },
    })
    expect(w.classes()).toEqual(expect.arrayContaining(['whitespace-nowrap', 'h-9', 'w-auto']))
  })

  it('type is a prop: button by default, submit when asked', () => {
    expect(mount(UiIconButton, { props: { ariaLabel: 'Go' } }).attributes('type')).toBe('button')
    expect(
      mount(UiIconButton, { props: { ariaLabel: 'Go', type: 'submit' } }).attributes('type'),
    ).toBe('submit')
  })

  it('warns in dev when there is neither an icon nor a glyph in the slot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiIconButton, { props: { ariaLabel: 'Edit' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no icon'))
    warn.mockClear()
    mount(UiIconButton, { props: { ariaLabel: 'Edit', icon: Pencil } })
    mount(UiIconButton, { props: { ariaLabel: 'Edit' }, slots: { default: '<i />' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('pressed on wears the brand plate whatever the tone, and keeps aria-pressed', () => {
    const w = mount(UiIconButton, { props: { ariaLabel: 'Pin', tone: 'danger', pressed: true } })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-brand-subtle', 'text-brand-subtle-fg']))
    expect(w.classes()).not.toContain('text-danger-subtle-fg')
    expect(w.attributes('aria-pressed')).toBe('true')
  })

  it('disabled wins over pressed: the plate, and the pressed state is still said', () => {
    const w = mount(UiIconButton, { props: { ariaLabel: 'Pin', pressed: true, disabled: true } })
    expect(w.classes()).toContain('text-disabled-fg')
    expect(w.classes()).not.toContain('bg-brand')
    expect(w.attributes('aria-pressed')).toBe('true')
  })

  it('loading keeps the pressed fill and refuses the click', async () => {
    let hits = 0
    const w = mount(UiIconButton, {
      props: { ariaLabel: 'Pin', pressed: true, loading: true },
      attrs: { onClick: () => hits++ },
    })
    expect(w.classes()).toContain('bg-brand-subtle')
    await w.trigger('click')
    expect(hits).toBe(0)
  })

  it('a loading button with no icon does not warn: the spinner stands in its place', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiIconButton, { props: { ariaLabel: 'Saving', loading: true } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a pressed-on button keeps the brand focus ring even at tone danger', () => {
    const on = mount(UiIconButton, { props: { ariaLabel: 'Flag', tone: 'danger', pressed: true } })
    expect(on.attributes('data-focus')).toBeUndefined()
    const off = mount(UiIconButton, {
      props: { ariaLabel: 'Flag', tone: 'danger', pressed: false },
    })
    expect(off.attributes('data-focus')).toBe('danger')
  })
})

describe('UiIconButton — review follow-ups', () => {
  it('an outline one wears the ink of an outline button, as its neighbors in a toolbar do', () => {
    const cls = mount(UiIconButton, {
      props: { ariaLabel: 'Columns', variant: 'outline' },
    }).classes()
    expect(cls).toContain('text-fg')
    expect(cls).not.toContain('text-fg-muted')
  })
})

describe('UiIconButton — review follow-ups, second pass', () => {
  it('pressed is the toggle prop, as on UiButton, and toggled is gone', () => {
    const w = mount(UiIconButton, {
      props: { ariaLabel: 'Pin', icon: Pencil, variant: 'outline', pressed: true },
    })
    expect(w.attributes('aria-pressed')).toBe('true')
    expect(w.classes()).toEqual(expect.arrayContaining(['border-brand', 'bg-brand-subtle']))
    const src = readFileSync(resolve(__dirname, 'UiIconButton.vue'), 'utf8')
    expect(src).not.toMatch(/toggled/)
  })

  it('a pressed button takes the highlight under forced colors', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(
      /\.ui-toggle\[aria-pressed='true'\] \{\s*forced-color-adjust: none;\s*background: Highlight;/,
    )
  })

  it('a primary pressed square warns in dev: it is never a toggle', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiIconButton, {
      props: { ariaLabel: 'More', icon: Pencil, variant: 'primary', pressed: true },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never a toggle'))
    warn.mockRestore()
  })

  it('warns in dev when the accessible name is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiIconButton, { props: { ariaLabel: '  ', icon: Pencil } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no name'))
    warn.mockClear()
    mount(UiIconButton, { props: { ariaLabel: 'Edit', icon: Pencil } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('a trailing button keeps its glyph box while loading', () => {
    const w = mount(UiIconButton, {
      props: { ariaLabel: 'Alerts', icon: Pencil, loading: true, size: 'md' },
      slots: { trailing: '128' },
    })
    const svg = w.find('svg')
    expect(svg.classes()).toContain('animate-spin')
    expect(svg.classes().some((c) => c.startsWith('!h-'))).toBe(false)
    expect(w.classes()).toContain('[&_svg]:h-5')
  })
})

describe('UiIconButton — split arrow', () => {
  it('says its step for the group to read, unless a tail makes it a pill', () => {
    expect(
      mount(UiIconButton, { props: { icon: ChevronDown, ariaLabel: 'More' } }).attributes(
        'data-square',
      ),
    ).toBe('sm')
    const pill = mount(UiIconButton, {
      props: { icon: ChevronDown, ariaLabel: 'More' },
      slots: { trailing: () => '3' },
    })
    expect(pill.attributes('data-square')).toBeUndefined()
  })
})

describe('UiIconButton — a reason it is off', () => {
  it('disabled with a reason, it stays in the Tab order, refuses a press and is described by it', async () => {
    const pressed = vi.fn()
    const w = mountRoot(UiIconButton, {
      attachTo: document.body,
      props: {
        icon: Pencil,
        ariaLabel: 'Delete',
        disabled: true,
        disabledReason: 'Paid invoices stay',
        onClick: pressed,
      },
    })
    const button = document.body.querySelector('button')!
    expect(button.disabled).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    button.click()
    expect(pressed).not.toHaveBeenCalled()
    const said = (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(said).toContain('Paid invoices stay')
    expect(button.getAttribute('aria-label')).toBe('Delete')
    w.unmount()
  })
  const settle = async () => {
    for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0))
  }
  const tip = () => document.body.querySelector('[role="tooltip"]')?.textContent?.trim()

  it('a reason that comes and goes keeps the square, its focus and its ref', async () => {
    const disabled = ref(false)
    const r = ref<{ $el: Node } | null>(null)
    const w = mountRoot(
      defineComponent({
        setup: () => () =>
          h(UiIconButton, {
            ref: r,
            icon: Pencil,
            ariaLabel: 'Delete',
            disabled: disabled.value,
            disabledReason: 'Paid invoices stay',
          }),
      }),
      { attachTo: document.body },
    )
    const button = document.body.querySelector('button')!
    button.focus()
    for (const next of [true, false]) {
      disabled.value = next
      await settle()
      expect(document.body.querySelector('button')).toBe(button)
      expect(document.activeElement).toBe(button)
      expect(r.value!.$el).toBe(button)
    }
    w.unmount()
  })

  it('off with a reason, it shows the reason on keyboard focus and on a tap', async () => {
    const w = mountRoot(UiIconButton, {
      attachTo: document.body,
      props: {
        icon: Pencil,
        ariaLabel: 'Delete',
        disabled: true,
        disabledReason: 'Paid invoices stay',
      },
    })
    await settle()
    const button = document.body.querySelector('button')!
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    button.focus()
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await settle()
    expect(tip()).toBe('Paid invoices stay')
    button.blur()
    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle()
    expect(tip()).toBeUndefined()
    button.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' }),
    )
    await settle()
    expect(tip()).toBe('Paid invoices stay')
    w.unmount()
  })

  it('as a menu button that refuses its press, it opens nothing by arrow', async () => {
    const w = mountRoot(
      defineComponent({
        setup: () => () =>
          h(UiMenu, null, {
            trigger: () =>
              h(UiIconButton, {
                icon: Pencil,
                ariaLabel: 'Actions',
                disabled: true,
                disabledReason: 'No rights',
              }),
            default: () => h('div', 'items'),
          }),
      }),
      { attachTo: document.body },
    )
    const button = document.body.querySelector('button')!
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('a UiTooltip around it names it while it works and says the reason while it is off, with no warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const disabled = ref(false)
    const w = mountRoot(
      defineComponent({
        setup: () => () =>
          h(UiTooltip, { content: 'Delete' }, () =>
            h(UiIconButton, {
              icon: Pencil,
              ariaLabel: 'Delete',
              disabled: disabled.value,
              disabledReason: 'Paid invoices stay',
            }),
          ),
      }),
      { attachTo: document.body },
    )
    const button = document.body.querySelector('button')!
    const hover = () =>
      button.dispatchEvent(
        Object.assign(new Event('pointerenter', { bubbles: true }), { pointerType: 'mouse' }),
      )
    const leave = () =>
      button.dispatchEvent(
        Object.assign(new Event('pointerleave', { bubbles: true }), { pointerType: 'mouse' }),
      )
    await settle()
    hover()
    await new Promise((r) => setTimeout(r, 200))
    expect(tip()).toBe('Delete')
    leave()
    disabled.value = true
    await new Promise((r) => setTimeout(r, 400))
    hover()
    await new Promise((r) => setTimeout(r, 200))
    expect(tip()).toBe('Paid invoices stay')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })
})

describe('UiIconButton — a held key', () => {
  it('a held Enter is one press: its repeats press nothing, and the caller still hears the key', () => {
    const keys: boolean[] = []
    const b = mount(UiIconButton, {
      props: { icon: Pencil, ariaLabel: 'Delete' },
      attrs: { onKeydown: (e: KeyboardEvent) => keys.push(e.repeat) },
    })
    const press = (repeat: boolean) => {
      const e = new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat,
        bubbles: true,
        cancelable: true,
      })
      b.element.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(press(false)).toBe(false)
    expect(press(true)).toBe(true)
    expect(keys).toEqual([false, true])
  })
})
