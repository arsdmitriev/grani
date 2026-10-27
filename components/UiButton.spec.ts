import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { withGrani } from '../test/harness'
import { defineComponent, h, ref, vShow, withDirectives } from 'vue'
import UiButton from './UiButton.vue'
import UiMenu from './UiMenu.vue'
import { createGrani } from '../plugin'

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'dashed'] as const
const TONES = ['brand', 'success', 'warning', 'danger'] as const
const RAW_PALETTE =
  /\b(?:bg|text|border|fill|stroke)-(?:gray|slate|zinc|green|emerald|red|rose|amber|yellow|orange|blue|sky|indigo|violet|purple|teal|white|black)(?:-\d{2,3})?\b/

// The label and the loading layer, which share one grid cell.
const layers = (w: ReturnType<typeof mount>) =>
  [...(w.element.firstElementChild as HTMLElement).children] as HTMLElement[]

describe('UiButton — presentation ladder', () => {
  it('primary is the brand fill that carries a label', () => {
    expect(mount(UiButton, { props: { variant: 'primary' } }).classes()).toContain('bg-brand-solid')
  })

  it('secondary is filled at rest and darkens on hover', () => {
    const cls = mount(UiButton, { props: { variant: 'secondary' } }).classes()
    expect(cls).toEqual(expect.arrayContaining(['bg-border', 'border-transparent']))
    expect(cls).toContain('[&:is(:enabled,a)]:hover:bg-border-strong')
  })

  it('every cell names its border color, so no cell inherits transparent', () => {
    // A base `border-transparent` used to win over the cell's `border-border`;
    // the outline button rendered with no visible border.
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const cls = mount(UiButton, { props: { variant, tone } }).classes()
        // `border-dashed` is a style, not a color.
        expect(
          cls.filter((c) => /^border-(?!\d)/.test(c) && c !== 'border' && c !== 'border-dashed'),
        ).toHaveLength(1)
      }
    }
  })

  it('outline is white with the light border', () => {
    const cls = mount(UiButton, { props: { variant: 'outline' } }).classes()
    expect(cls).toEqual(expect.arrayContaining(['bg-surface', 'border-border']))
    expect(cls).toContain('[&:is(:enabled,a)]:hover:bg-surface-muted')
  })

  it('ghost is white at rest', () => {
    expect(mount(UiButton, { props: { variant: 'ghost' } }).classes()).toContain('bg-surface')
  })
})

describe('UiButton — meaning', () => {
  it('on a solid fill the fill itself carries the tone', () => {
    expect(mount(UiButton, { props: { tone: 'danger' } }).classes()).toContain('bg-danger')
    expect(mount(UiButton, { props: { tone: 'success' } }).classes()).toContain('bg-success')
    const warn = mount(UiButton, { props: { tone: 'warning' } }).classes()
    expect(warn).toEqual(expect.arrayContaining(['bg-warning', 'text-warning-fg']))
  })

  it('a quiet dangerous action has no dense fill and readable text', () => {
    const ghost = mount(UiButton, { props: { variant: 'ghost', tone: 'danger' } }).classes()
    expect(ghost).toEqual(expect.arrayContaining(['bg-surface', 'text-danger-subtle-fg']))
    expect(ghost).not.toContain('bg-danger')
    expect(ghost).not.toContain('text-danger')

    const secondary = mount(UiButton, { props: { variant: 'secondary', tone: 'danger' } }).classes()
    expect(secondary).toEqual(expect.arrayContaining(['bg-danger-subtle', 'text-danger-subtle-fg']))
    expect(secondary).not.toContain('bg-border')
  })

  it('the red focus ring follows the meaning, not the presentation', () => {
    for (const variant of VARIANTS) {
      expect(mount(UiButton, { props: { variant, tone: 'danger' } }).attributes('data-focus')).toBe(
        'danger',
      )
    }
    for (const tone of ['brand', 'success', 'warning'] as const) {
      expect(mount(UiButton, { props: { tone } }).attributes('data-focus')).toBeUndefined()
    }
  })
})

describe('UiButton — every cell of the matrix', () => {
  it('has a text class and a fill', () => {
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const cls = mount(UiButton, { props: { variant, tone } }).classes()
        expect(
          cls.some((c) => c.startsWith('text-')),
          `${variant}/${tone}`,
        ).toBe(true)
        {
          expect(
            cls.some((c) => c.startsWith('bg-')),
            `${variant}/${tone}`,
          ).toBe(true)
        }
      }
    }
  })

  it('gates hover behind enabled-or-link so a disabled button does not react and a link does', () => {
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const hover = mount(UiButton, { props: { variant, tone } })
          .classes()
          .filter((c) => c.includes('hover:'))
        expect(hover.length, `${variant}/${tone}`).toBeGreaterThan(0)
        for (const c of hover) expect(c.startsWith('[&:is(:enabled,a)]:hover:'), c).toBe(true)
      }
    }
  })

  it('uses semantic tokens only, without dark: variants', () => {
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const cls = mount(UiButton, { props: { variant, tone, loading: true } })
        const all = [...cls.classes(), ...cls.find('svg').classes()].join(' ')
        expect(all, `${variant}/${tone}`).not.toMatch(RAW_PALETTE)
        expect(all, `${variant}/${tone}`).not.toContain('dark:')
      }
    }
  })

  it('darkens on press and keeps that off a disabled or loading button', () => {
    expect(mount(UiButton).classes()).toContain(
      '[&:is(:enabled,a):not([aria-disabled=true])]:active:brightness-90',
    )
  })
})

describe('UiButton — spinner', () => {
  it('follows the fill: label color on a solid fill, neutral ink elsewhere', () => {
    expect(
      mount(UiButton, { props: { tone: 'warning', loading: true } })
        .find('svg')
        .classes(),
    ).toContain('text-warning-fg')
    expect(
      mount(UiButton, { props: { loading: true } })
        .find('svg')
        .classes(),
    ).toContain('text-brand-solid-fg')
    for (const variant of ['secondary', 'ghost'] as const) {
      for (const tone of TONES) {
        expect(
          mount(UiButton, { props: { variant, tone, loading: true } })
            .find('svg')
            .classes(),
          `${variant}/${tone}`,
        ).toContain('text-fg/80')
      }
    }
  })

  it('is hidden from assistive tech', () => {
    expect(
      mount(UiButton, { props: { loading: true } })
        .find('svg')
        .attributes('aria-hidden'),
    ).toBe('true')
  })
})

describe('UiButton — states', () => {
  it('disabled disables the native button', () => {
    const w = mount(UiButton, { props: { disabled: true } })
    expect((w.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('loading swaps the label for the loading text and hides the label from assistive tech', () => {
    const w = mount(UiButton, { props: { loading: true }, slots: { default: 'Save' } })
    const [label, busy] = layers(w)
    expect(label!.classList).toContain('invisible')
    expect(label!.getAttribute('aria-hidden')).toBe('true')
    expect(busy!.classList).not.toContain('invisible')
    expect(busy!.textContent).toContain('In progress…')
  })

  it('an empty loadingText keeps the label as the name: seen through, still read', () => {
    const w = mount(UiButton, {
      props: { loading: true, loadingText: '' },
      slots: { default: 'Save' },
    })
    const [label] = layers(w)
    expect(label!.getAttribute('aria-hidden')).toBeNull()
    expect(label!.classList).not.toContain('invisible')
    expect(label!.classList).toContain('opacity-0')
    expect(label!.textContent).toBe('Save')
  })

  it('loadingText overrides the default loading label', () => {
    const w = mount(UiButton, { props: { loading: true, loadingText: 'Saving…' } })
    expect(w.text()).toContain('Saving…')
    expect(w.text()).not.toContain('In progress…')
  })

  it('the loading slot beats loadingText', () => {
    const w = mount(UiButton, {
      props: { loading: true, loadingText: 'Saving…' },
      slots: { loading: 'Almost there' },
    })
    expect(w.text()).toBe('Almost there')
  })

  it('renders the default slot when idle and is enabled', () => {
    const w = mount(UiButton, { props: { loading: false }, slots: { default: 'Save' } })
    // The loading text sizes the idle button through a pseudo element, never as DOM text.
    expect(w.text()).toBe('Save')
    expect(w.find('svg').exists()).toBe(false)
    const [label, sizer] = layers(w)
    expect(label!.getAttribute('aria-hidden')).toBeNull()
    expect(sizer!.classList).toContain('invisible')
    expect(sizer!.getAttribute('aria-hidden')).toBe('true')
    expect(sizer!.querySelector('[data-sizer]')?.getAttribute('data-sizer')).toBe('In progress…')
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    expect(w.attributes('aria-disabled')).toBeUndefined()
  })

  it('block stretches to the full width', () => {
    expect(mount(UiButton, { props: { block: true } }).classes()).toContain('w-full')
    expect(mount(UiButton).classes()).not.toContain('w-full')
  })

  it('type defaults to button and passes submit through', () => {
    expect(mount(UiButton).attributes('type')).toBe('button')
    expect(mount(UiButton, { props: { type: 'submit' } }).attributes('type')).toBe('submit')
  })

  it('size steps change the horizontal padding; height comes from the ladder', () => {
    expect(mount(UiButton, { props: { size: 'xs' } }).classes()).toContain('px-2.5')
    expect(mount(UiButton).classes()).toContain('px-3')
    expect(mount(UiButton, { props: { size: 'md' } }).classes()).toContain('px-5')
  })

  it('passes native listeners through to the button', async () => {
    const w = mount(UiButton, { attrs: { onClick: () => w.element.setAttribute('data-hit', '1') } })
    await w.trigger('click')
    expect(w.attributes('data-hit')).toBe('1')
  })
})

describe('UiButton — review follow-ups', () => {
  it('exposes loading as aria-busy, like UiIconButton', () => {
    expect(mount(UiButton, { props: { loading: true } }).attributes('aria-busy')).toBe('true')
    expect(mount(UiButton).attributes('aria-busy')).toBeUndefined()
  })

  it('never wraps: a long label grows the width, not the height', () => {
    expect(mount(UiButton).classes()).toContain('whitespace-nowrap')
  })

  it('a disabled or loading button does not fire click', async () => {
    const states: { disabled?: boolean; loading?: boolean }[] = [
      { disabled: true },
      { loading: true },
    ]
    for (const props of states) {
      const w = mount(UiButton, { props })
      await w.trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    }
  })

  it('a link-button keeps focus when loading starts', async () => {
    const w = mount(UiButton, { props: { to: '/export' }, attachTo: document.body })
    ;(w.element as HTMLElement).focus()
    await w.setProps({ loading: true })
    expect(w.element.tagName).toBe('A')
    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })

  it("a loading link-button refuses the click before the link's own navigation", async () => {
    let navigated = 0
    // A router link binds its navigation on the anchor before any caller listener.
    const RouterishLink = defineComponent({
      props: { to: { type: String, default: '' } },
      setup(props, { slots }) {
        return () => h('a', { href: props.to, onClick: () => navigated++ }, slots.default?.())
      },
    })
    const w = mount(UiButton, {
      props: { to: '/export', loading: true },
      global: { plugins: [createGrani({ link: RouterishLink })] },
    })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    w.element.dispatchEvent(click)
    expect(navigated).toBe(0)
    expect(click.defaultPrevented).toBe(true)
    await w.setProps({ loading: false })
    // Vue drops a click in the millisecond its listener was attached (`_vts`).
    await new Promise((r) => setTimeout(r, 2))
    w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(navigated).toBe(1)
  })

  it('reserves the loading width even when the loading prop arrives after the first render', async () => {
    const Wrapper = defineComponent({
      props: { extra: { type: Object, default: () => ({}) } },
      setup(props) {
        return () => h(UiButton, { ...props.extra }, () => 'Save')
      },
    })
    const w = mount(Wrapper)
    expect(w.find('[data-sizer]').exists()).toBe(false)
    await w.setProps({ extra: { loading: true } })
    await w.setProps({ extra: {} })
    expect(w.find('[data-sizer]').exists()).toBe(true)
  })

  it('arbitrary attributes land on the root button', () => {
    const w = mount(UiButton, { attrs: { 'data-testid': 'save', 'aria-describedby': 'hint' } })
    expect(w.attributes('data-testid')).toBe('save')
    expect(w.attributes('aria-describedby')).toBe('hint')
  })
})

describe('UiButton — disabled is a state, not a fade', () => {
  it('filled variants become the neutral plate, quiet ones gray their text', () => {
    const primary = mount(UiButton, { props: { disabled: true, tone: 'danger' } }).classes()
    expect(primary).toEqual(expect.arrayContaining(['bg-border-strong/40', 'text-disabled-fg']))
    expect(primary).not.toContain('bg-danger')
    const ghost = mount(UiButton, { props: { disabled: true, variant: 'ghost' } }).classes()
    expect(ghost).toContain('text-disabled-fg')
    expect(
      mount(UiButton, { props: { disabled: true } })
        .classes()
        .join(' '),
    ).not.toMatch(/opacity/)
  })

  it('loading keeps the fill: the spinner carries the state', () => {
    expect(mount(UiButton, { props: { loading: true } }).classes()).toContain('bg-brand-solid')
  })

  it('loading wins over disabled: the fill stays when both are set by one flag', () => {
    // `:disabled="saving" :loading="saving"` used to paint the gray plate mid-request.
    const w = mount(UiButton, { props: { loading: true, disabled: true, tone: 'danger' } })
    expect(w.classes()).toContain('bg-danger')
    expect(w.classes()).not.toContain('bg-border-strong/40')
    expect(w.attributes('disabled')).toBeUndefined()
    expect(w.attributes('aria-disabled')).toBe('true')
  })
})

describe('UiButton — loading keeps focus', () => {
  it('the focused button keeps focus when loading starts', async () => {
    // A natively disabled button dropped focus to <body>; Tab then restarted the page.
    const w = mount(UiButton, { attachTo: document.body, slots: { default: 'Save' } })
    ;(w.element as HTMLButtonElement).focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })

  it("refuses the click before the caller's listener", async () => {
    let hits = 0
    const w = mount(UiButton, { props: { loading: true }, attrs: { onClick: () => hits++ } })
    await w.trigger('click')
    expect(hits).toBe(0)
    await w.setProps({ loading: false })
    await new Promise((r) => setTimeout(r, 2))
    await w.trigger('click')
    expect(hits).toBe(1)
  })

  it('a loading submit button does not send its form', async () => {
    let sent = 0
    const form = document.createElement('form')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      sent++
    })
    document.body.append(form)
    const w = mount(UiButton, { attachTo: form, props: { type: 'submit', loading: true } })
    ;(w.element as HTMLButtonElement).click()
    expect(sent).toBe(0)
    await w.setProps({ loading: false })
    ;(w.element as HTMLButtonElement).click()
    expect(sent).toBe(1)
    w.unmount()
    form.remove()
  })

  it('turns the pointer off while loading, so hover does not answer', () => {
    expect(mount(UiButton, { props: { loading: true } }).classes()).toContain('pointer-events-none')
    expect(mount(UiButton).classes()).not.toContain('pointer-events-none')
  })

  it('both labels share one cell, so the width does not jump', () => {
    const w = mount(UiButton, { props: { loading: false }, slots: { default: 'Save' } })
    expect((w.element.firstElementChild as HTMLElement).className).toContain(
      '[&>*]:col-start-1 [&>*]:row-start-1',
    )
    expect(layers(w)).toHaveLength(2)
  })

  it('passes native name and value to the button', () => {
    const w = mount(UiButton, { attrs: { name: 'intent', value: 'publish' } })
    expect(w.attributes('name')).toBe('intent')
    expect(w.attributes('value')).toBe('publish')
  })
})

describe('UiButton — as a link', () => {
  it('with `to` renders an anchor that looks like a button', () => {
    const w = mount(UiButton, { props: { to: '/records/7' }, slots: { default: 'Open' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/records/7')
    expect(w.attributes('type')).toBeUndefined()
    expect(w.classes()).toContain('bg-brand-solid')
  })

  it('disabled, it turns into a real button so it can be inert; loading, it stays a link', () => {
    const off = mount(UiButton, { props: { to: '/x', disabled: true } })
    expect(off.element.tagName).toBe('BUTTON')
    expect(off.attributes('disabled')).toBeDefined()
    const busy = mount(UiButton, { props: { to: '/x', loading: true } })
    expect(busy.element.tagName).toBe('A')
    expect(busy.attributes('aria-disabled')).toBe('true')
    expect(busy.attributes('aria-busy')).toBe('true')
  })

  it('an address with a protocol opens in a new tab and says so', () => {
    const w = mount(UiButton, {
      props: { to: 'https://example.com/apply' },
      slots: { default: 'Apply' },
    })
    expect(w.attributes('target')).toBe('_blank')
    expect(w.attributes('rel')).toBe('noopener noreferrer')
    expect(w.find('.sr-only').text()).toBe('opens in a new tab')
  })

  it('a link answers hover: the variant matches it, not enabled:, since an <a> is never :enabled', () => {
    const cls = mount(UiButton, { props: { to: '/records/7' } }).classes()
    expect(cls).toContain('[&:is(:enabled,a)]:hover:bg-brand-hover')
    expect(cls.some((c) => c.startsWith('enabled:'))).toBe(false)
  })

  it('a link-button wears no link underline: that style lives on UiLink only', () => {
    const cls = mount(UiButton, { props: { to: '/records/7' } }).classes()
    expect(cls.some((c) => /underline|decoration-/.test(c))).toBe(false)
  })

  it('the new-tab notice keeps a space; mailto stays in the tab', () => {
    const ext = mount(UiButton, {
      props: { to: 'https://example.com' },
      slots: { default: 'Apply' },
    })
    expect(ext.find('.sr-only').element.textContent).toBe(' opens in a new tab')
    const mail = mount(UiButton, { props: { to: 'mailto:name@example.com' } })
    expect(mail.attributes('target')).toBeUndefined()
  })

  it('a route stays in the tab', () => {
    const w = mount(UiButton, { props: { to: '/records/7' } })
    expect(w.attributes('target')).toBeUndefined()
    expect(w.attributes('rel')).toBeUndefined()
    expect(w.find('.sr-only').exists()).toBe(false)
  })

  it('outline: neutral border at rest, the tone border on hover', () => {
    for (const tone of TONES) {
      const cls = mount(UiButton, { props: { variant: 'outline', tone } }).classes()
      expect(cls).toContain('border-border')
      expect(cls.some((c) => c.startsWith('[&:is(:enabled,a)]:hover:border-'))).toBe(true)
    }
  })
})

describe('UiButton — width reserve', () => {
  it('a button never given loading keeps the width of its label', () => {
    const plain = mount(UiButton, { slots: { default: '+' } })
    expect(plain.find('[data-sizer]').exists()).toBe(false)
    const ready = mount(UiButton, { props: { loading: false }, slots: { default: 'Save' } })
    expect(ready.find('[data-sizer]').exists()).toBe(true)
  })

  it('dashed is the plate for one more block: a dashed frame, muted until hovered, on the ladder', () => {
    const cls = mount(UiButton, { props: { variant: 'dashed', block: true } }).classes()
    expect(cls).toEqual(
      expect.arrayContaining([
        'border-dashed',
        'border-border-strong',
        'text-fg-muted',
        'w-full',
        'h-9',
      ]),
    )
    expect(cls.some((c) => c.includes('hover:border-brand'))).toBe(true)
    const off = mount(UiButton, { props: { variant: 'dashed', disabled: true } }).classes()
    expect(off).toEqual(expect.arrayContaining(['border-dashed', 'text-disabled-fg']))
  })
})

describe('UiButton — trailing chevron', () => {
  it('a chevron after the label is pulled onto its ink, by the class lucide gives it', async () => {
    const { ChevronDown } = await import('@lucide/vue')
    const w = mount(UiButton, { slots: { default: () => ['Status', h(ChevronDown)] } })
    const content = w.find('.gap-2')
    expect(content.classes()).toContain(
      '[&>.lucide-chevron-down:last-child:not(:first-child)]:-mx-1',
    )
    expect(w.find('svg').classes()).toContain('lucide-chevron-down')
  })
})

describe('UiButton — spinner clip', () => {
  it('the label cell clips on both axes, so its 4px margin keeps the spinner ring whole', () => {
    const cell = mount(UiButton, { props: { loading: true }, slots: { default: 'Save' } }).element
      .firstElementChild as HTMLElement
    expect(cell.className).toMatch(/\boverflow-clip\b/)
    expect(cell.className).not.toMatch(/overflow-x-clip/)
    expect(cell.className).toContain('[overflow-clip-margin:0.25rem]')
  })
})

describe('UiButton — review follow-ups, second pass', () => {
  it('the idle width sizer carries the #loading slot text', () => {
    const w = mount(UiButton, {
      props: { loading: false },
      slots: { default: 'Save', loading: 'Uploading your file…' },
    })
    const sizer = w.find('[aria-hidden="true"].invisible [data-sizer]')
    expect(sizer.text()).toBe('Uploading your file…')
  })

  it('an empty loadingText shows the spinner alone and reserves no text', async () => {
    const w = mount(UiButton, {
      props: { loading: false, loadingText: '' },
      slots: { default: '+' },
    })
    expect(w.find('[data-sizer]').exists()).toBe(false)
    await w.setProps({ loading: true })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toBe('+')
    expect(w.text()).not.toContain('Please wait')
  })

  it('a new tab is seen as well as said: an arrow, and a caller target gets rel and the notice', () => {
    const away = mount(UiButton, {
      props: { to: 'https://example.test' },
      slots: { default: 'Docs' },
    })
    expect(away.find('svg.lucide-arrow-up-right').attributes('aria-hidden')).toBe('true')
    expect(away.attributes('target')).toBe('_blank')
    const own = mount(UiButton, {
      props: { to: '/report', target: '_blank' },
      slots: { default: 'Report' },
    })
    expect(own.attributes('target')).toBe('_blank')
    // The app's own page in a new tab: noopener, and the referrer kept, as on UiLink.
    expect(own.attributes('rel')).toBe('noopener')
    expect(own.find('.sr-only').exists()).toBe(true)
    expect(own.find('svg.lucide-arrow-up-right').exists()).toBe(true)
    const home = mount(UiButton, { props: { to: '/report' }, slots: { default: 'Report' } })
    expect(home.find('svg.lucide-arrow-up-right').exists()).toBe(false)
    expect(home.attributes('target')).toBeUndefined()
  })

  it('a disabled external link turns back into a button with no target', () => {
    const w = mount(UiButton, { props: { to: 'https://example.test', disabled: true } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('target')).toBeUndefined()
    expect(w.attributes('rel')).toBeUndefined()
  })

  it('a toggle that is off holds the room of its check, so pressing it moves nothing', () => {
    const label = (props: Record<string, unknown>) =>
      mount(UiButton, { props: { variant: 'outline', ...props }, slots: { default: 'Overdue' } })
        .find('[aria-pressed] > span > span')
        .classes()
    expect(label({ pressed: false })).toContain('px-[11px]')
    expect(label({ pressed: false, size: 'xs' })).toContain('px-[10px]')
    expect(label({ pressed: true })).not.toContain('px-[11px]')
    expect(
      mount(UiButton, { props: { variant: 'outline' }, slots: { default: 'Save' } })
        .find('button > span > span')
        .classes(),
    ).not.toContain('px-[11px]')
  })

  it('pressed sets aria-pressed only when given and styles the on state', () => {
    expect(
      mount(UiButton, { props: { variant: 'outline' } }).attributes('aria-pressed'),
    ).toBeUndefined()
    const off = mount(UiButton, {
      props: { variant: 'outline', pressed: false },
      slots: { default: 'All' },
    })
    expect(off.attributes('aria-pressed')).toBe('false')
    expect(off.find('svg.lucide-check').exists()).toBe(false)
    const on = mount(UiButton, {
      props: { variant: 'outline', pressed: true },
      slots: { default: 'All' },
    })
    expect(on.attributes('aria-pressed')).toBe('true')
    expect(on.classes()).toEqual(expect.arrayContaining(['border-brand', 'bg-brand-subtle']))
    // The check carries it beyond color, forced colors included.
    expect(on.find('svg.lucide-check').attributes('aria-hidden')).toBe('true')
    const primary = mount(UiButton, { props: { pressed: true } })
    expect(primary.attributes('aria-pressed')).toBe('true')
    expect(primary.classes()).toContain('bg-brand-solid')
  })

  it('heights come from the ladder and follow the app step', () => {
    for (const [size, h] of [
      ['xs', 'h-7'],
      ['sm', 'h-9'],
      ['md', 'h-11'],
    ] as const)
      expect(mount(UiButton, { props: { size } }).classes()).toContain(h)
    expect(mount(UiButton, { global: { plugins: withGrani({ size: 'md' }) } }).classes()).toContain(
      'h-11',
    )
  })

  it("a caller's click does not run while loading, and does after", async () => {
    const save = vi.fn()
    const w = mount(UiButton, { props: { loading: true }, attrs: { onClick: save } })
    w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(save).not.toHaveBeenCalled()
    await w.setProps({ loading: false })
    await new Promise((r) => setTimeout(r, 2))
    w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('data-filled marks the plates UiButtonGroup seams', () => {
    expect(mount(UiButton).attributes('data-filled')).toBe('true')
    expect(mount(UiButton, { props: { variant: 'secondary' } }).attributes('data-filled')).toBe(
      'true',
    )
    expect(
      mount(UiButton, { props: { variant: 'outline' } }).attributes('data-filled'),
    ).toBeUndefined()
  })
})

describe('UiButton — a reason it is off', () => {
  const settle = async () => {
    for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0))
  }
  const REASON = 'Add the client’s email first'

  it('disabled with a reason, it stays in the Tab order and refuses a press, a submit too', async () => {
    const pressed = vi.fn()
    const sent = vi.fn((e: Event) => e.preventDefault())
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', { onSubmit: sent }, [
            h(
              UiButton,
              { type: 'submit', disabled: true, disabledReason: REASON, onClick: pressed },
              () => 'Save',
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const button = w.find('button').element as HTMLButtonElement
    expect(button.disabled).toBe(false)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.tabIndex).toBe(0)
    button.click()
    await settle()
    expect(pressed).not.toHaveBeenCalled()
    expect(sent).not.toHaveBeenCalled()
    w.unmount()
  })

  it('the reason is the button’s description, read once, and the hint on focus says it', async () => {
    const w = mount(UiButton, {
      attachTo: document.body,
      props: { disabled: true, disabledReason: REASON },
      attrs: { 'aria-describedby': 'mine' },
      slots: { default: () => 'Save' },
    })
    const button = document.body.querySelector('button')!
    const said = (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(button.getAttribute('aria-describedby')!.split(/\s+/)).toContain('mine')
    expect(said).toContain(REASON)
    // The reason is no part of the name: the element that holds it is hidden.
    const holder = (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .find((el) => el?.textContent?.trim() === REASON)!
    expect(holder.hidden).toBe(true)
    button.focus()
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await settle()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe(REASON)
    const after = (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => document.getElementById(id)?.textContent?.trim() === REASON)
    expect(after).toHaveLength(1)
    w.unmount()
  })

  it('a reason with the button enabled is nothing: the button presses as ever', async () => {
    const pressed = vi.fn()
    const w = mount(UiButton, {
      props: { disabledReason: REASON, onClick: pressed },
      slots: { default: () => 'Save' },
    })
    expect(w.attributes('aria-disabled')).toBeUndefined()
    expect(w.attributes('aria-describedby')).toBeUndefined()
    await w.trigger('click')
    expect(pressed).toHaveBeenCalledTimes(1)
  })
  it('a reason that comes and goes keeps the button, its focus and its ref', async () => {
    const state = ref({ loading: true, disabled: false })
    const r = ref<{ $el: Node } | null>(null)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(UiButton, { ref: r, ...state.value, disabledReason: 'Nothing changed' }, () => 'Save'),
      }),
      { attachTo: document.body },
    )
    const button = document.body.querySelector('button')!
    button.focus()
    // Saved, and nothing is left to save: the press ends in a reason, the focus kept for it.
    state.value = { loading: false, disabled: true }
    await settle()
    expect(document.body.querySelector('button')).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(r.value!.$el).toBe(button)
    // The reason lifted: the same button, still focused, presses again.
    state.value = { loading: false, disabled: false }
    await settle()
    expect(document.body.querySelector('button')).toBe(button)
    expect(document.activeElement).toBe(button)
    w.unmount()
  })

  it('v-show hides a button off with a reason, as any other', async () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          withDirectives(
            h(UiButton, { disabled: true, disabledReason: REASON }, () => 'Save'),
            [[vShow, false]],
          ),
      }),
      { attachTo: document.body },
    )
    await settle()
    expect(document.body.querySelector('button')!.style.display).toBe('none')
    w.unmount()
  })

  it('a menu button that refuses its press opens nothing, by click or by arrow', async () => {
    for (const props of [
      { disabled: true, disabledReason: 'No rows selected' },
      { loading: true },
    ]) {
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(UiMenu, null, {
              trigger: () => h(UiButton, props, () => 'Actions'),
              default: () => h('div', 'items'),
            }),
        }),
        { attachTo: document.body },
      )
      const button = document.body.querySelector('button')!
      button.click()
      for (const key of ['ArrowDown', 'ArrowUp'])
        button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
      await settle()
      expect(button.getAttribute('aria-expanded'), JSON.stringify(props)).toBe('false')
      expect(document.body.querySelector('[role="menu"]')).toBeNull()
      w.unmount()
    }
  })

  it('a press on a button off with a reason shows the reason, by mouse and by a tap on a menu button', async () => {
    const tip = () => document.body.querySelector('[role="tooltip"]')?.textContent?.trim()
    const press = (b: Element, pointerType: string) =>
      b.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType }))
    const plain = mount(UiButton, {
      attachTo: document.body,
      props: { disabled: true, disabledReason: REASON },
      slots: { default: () => 'Save' },
    })
    await settle()
    press(document.body.querySelector('button')!, 'mouse')
    await settle()
    expect(tip()).toBe(REASON)
    plain.unmount()
    const menu = mount(
      defineComponent({
        setup: () => () =>
          h(UiMenu, null, {
            trigger: () =>
              h(UiButton, { disabled: true, disabledReason: 'No rows selected' }, () => 'Actions'),
            default: () => h('div', 'items'),
          }),
      }),
      { attachTo: document.body },
    )
    await settle()
    press(document.body.querySelector('button')!, 'touch')
    await settle()
    expect(tip()).toBe('No rows selected')
    menu.unmount()
  })

  it('a mouse press shows the reason, and the pointer leaving takes it away', async () => {
    const tip = () => document.body.querySelector('[role="tooltip"]')?.textContent?.trim()
    const pointer = (b: Element, type: string) =>
      b.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { pointerType: 'mouse' }))
    const w = mount(UiButton, {
      attachTo: document.body,
      props: { disabled: true, disabledReason: REASON },
      slots: { default: () => 'Save' },
    })
    await settle()
    const button = document.body.querySelector('button')!
    pointer(button, 'pointerenter')
    pointer(button, 'pointerdown')
    await settle()
    expect(tip()).toBe(REASON)
    pointer(button, 'pointerleave')
    await new Promise((r) => setTimeout(r, 150))
    expect(tip()).toBeUndefined()
    w.unmount()
  })

  it('a reason that comes while the keyboard is on the button shows at once', async () => {
    const disabled = ref(false)
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(UiButton, { disabled: disabled.value, disabledReason: REASON }, () => 'Save'),
      }),
      { attachTo: document.body },
    )
    const button = document.body.querySelector('button')!
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    button.focus()
    disabled.value = true
    await settle()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe(REASON)
    w.unmount()
  })

  it('a hint that fails to load costs nothing but the hint: no error, the reason still read', async () => {
    vi.resetModules()
    vi.doMock('./HintFor.vue', () => {
      throw new Error('offline')
    })
    const errors = vi.fn()
    const { default: Fresh } = await import('./UiButton.vue')
    const w = mount(Fresh, {
      attachTo: document.body,
      props: { disabled: true, disabledReason: REASON },
      slots: { default: () => 'Save' },
      global: { config: { errorHandler: errors } },
    })
    await settle()
    const button = document.body.querySelector('button')!
    const said = (button.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
    expect(errors).not.toHaveBeenCalled()
    expect(said).toContain(REASON)
    w.unmount()
    vi.doUnmock('./HintFor.vue')
    vi.resetModules()
  })

  it('an enabled button with a reason mounts no hint: only one that is off pays for it', async () => {
    const w = mount(UiButton, {
      attachTo: document.body,
      props: { disabled: false, disabledReason: REASON },
      slots: { default: () => 'Save' },
    })
    await settle()
    expect(w.findComponent({ name: 'HintFor' }).exists()).toBe(false)
    await w.setProps({ disabled: true })
    await settle()
    expect(w.findComponent({ name: 'HintFor' }).exists()).toBe(true)
    w.unmount()
  })

  it('a blank reason is no reason: the button stays natively disabled, out of the Tab order', () => {
    const w = mount(UiButton, {
      props: { disabled: true, disabledReason: '   ' },
      slots: { default: () => 'Save' },
    })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-disabled')).toBeUndefined()
  })
})

describe('UiButton — a held key', () => {
  // A held Enter repeats, and each repeat would click: a Delete that hands the focus to the next
  // row's Delete would empty the list at key-repeat speed.
  it('a held Enter is one press: its repeats press nothing, and the caller still hears the key', () => {
    const keys: boolean[] = []
    const w = mount(UiButton, {
      attrs: { onKeydown: (e: KeyboardEvent) => keys.push(e.repeat) },
      slots: { default: 'Delete' },
    })
    const press = (repeat: boolean) => {
      const e = new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat,
        bubbles: true,
        cancelable: true,
      })
      w.element.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(press(false)).toBe(false)
    expect(press(true)).toBe(true)
    expect(keys).toEqual([false, true])
  })
})

describe('UiButton — review follow-ups', () => {
  it('warns in dev when `to` is refused, as UiLink does, and stays a button', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButton, { props: { to: 'javascript:alert(1)' }, slots: { default: 'Open' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('refuses'))
    warn.mockClear()
    mount(UiButton, { props: { to: '/docs' }, slots: { default: 'Open' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('warns when `to` turns into a refused address after it was mounted', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButton, { props: { to: '/docs' }, slots: { default: 'Open' } })
    expect(warn).not.toHaveBeenCalled()
    await w.setProps({ to: 'data:text/html,x' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('refuses'))
    warn.mockRestore()
  })
})
