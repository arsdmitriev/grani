import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { BarChart3 } from '@lucide/vue'
import { Pencil } from '@lucide/vue'
import UiAppShell from './UiAppShell.vue'
import UiButton from './UiButton.vue'
import UiCheckbox from './UiCheckbox.vue'
import UiIconButton from './UiIconButton.vue'
import UiProgress from './UiProgress.vue'
import UiRadio from './UiRadio.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import UiSwitch from './UiSwitch.vue'
import UiTable from './UiTable.vue'
import UiTabs from './UiTabs.vue'
import { h } from 'vue'

// Forced colors drop fills and shadows. The rules that give a state back live outside any layer,
// so they reach only grani's own elements by a `.ui-*` hook each component carries; the app's own
// switch, toggle, tab or link stays as the app drew it.
const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
const unlayered = css.slice(css.lastIndexOf('@media (forced-colors: active)'))
const selectors = unlayered
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(/[{}]/)
  .filter((_, i) => i % 2 === 1)
  .flatMap((head) => head.split(','))
  .map((s) => s.trim())
  .filter(Boolean)

describe('forced colors', () => {
  it('a skeleton keeps its shape with an outline: its fill is dropped', () => {
    expect(selectors).toContain(':root .ui-skeleton')
    expect(unlayered).toMatch(/\.ui-skeleton\s*\{\s*outline: 1px solid GrayText;/)
  })

  it('every unlayered rule is scoped to a grani hook', () => {
    expect(selectors.length).toBeGreaterThan(10)
    for (const sel of selectors) expect(sel).toMatch(/\.ui-|\[data-ui-/)
  })

  it('a button off with a reason, natively enabled, takes the gray text of a disabled one', () => {
    for (const C of [UiButton, UiIconButton]) {
      const b = mount(C, {
        props: { disabled: true, disabledReason: 'Add the email first', ariaLabel: 'Save' },
      }).find('button')
      expect(b.classes()).toContain('ui-toggle')
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
    }
    expect(unlayered).toMatch(
      /\.ui-toggle\[aria-disabled='true'\]:not\(\[aria-busy='true'\]\):not\(\[aria-pressed='true'\]\) \{[^}]*color: GrayText/,
    )
  })

  it('a checked box and a chosen radio carry the hook; the glyph and the dot take the highlight text', () => {
    expect(
      mount(UiCheckbox, { props: { modelValue: true } })
        .find('input')
        .classes(),
    ).toContain('ui-mark-on')
    expect(
      mount(UiCheckbox, { props: { modelValue: false, indeterminate: true } })
        .find('input')
        .classes(),
    ).toContain('ui-mark-on')
    expect(
      mount(UiCheckbox, { props: { modelValue: false } })
        .find('input')
        .classes(),
    ).not.toContain('ui-mark-on')
    const radio = mount(UiRadioGroup, {
      props: { modelValue: 'a', ariaLabel: 'Pick' },
      slots: { default: () => [h(UiRadio, { value: 'a' }, () => 'A')] },
    })
    expect(radio.find('input').classes()).toContain('ui-mark-on')
    expect(radio.find('.ui-mark-dot').exists()).toBe(true)
    expect(unlayered).toMatch(/\.ui-mark-on \{[^}]*background: Highlight/)
    expect(unlayered).toMatch(/\.ui-mark-on ~ svg \{[^}]*color: HighlightText/)
    expect(unlayered).toMatch(/\.ui-mark-on ~ \.ui-mark-dot \{[^}]*background: HighlightText/)
  })

  it('a chosen segment, an off one and keyboard focus on a segment say their state; so does an off chosen radio', () => {
    const bar = mount(UiRadioGroup, {
      props: { modelValue: 'a', variant: 'segmented', ariaLabel: 'Pick' },
      slots: {
        default: () => [
          h(UiRadio, { value: 'a' }, () => 'A'),
          h(UiRadio, { value: 'b', disabled: true }, () => 'B'),
        ],
      },
    })
    const [chosen, off] = bar.findAll('label')
    expect(chosen!.classes()).toContain('ui-segment')
    expect(chosen!.attributes('data-selected')).toBe('true')
    expect(off!.find('input').attributes('disabled')).toBeDefined()
    expect(unlayered).toMatch(/\.ui-segment\[data-selected\] \{[^}]*background: Highlight/)
    expect(unlayered).toMatch(/\.ui-segment:has\(:disabled\) \{[^}]*color: GrayText/)
    expect(unlayered).toMatch(/\.ui-segment:has\(:focus-visible\) \{[^}]*outline: 2px solid/)
    const radio = mount(UiRadioGroup, {
      props: { modelValue: 'a', disabled: true, ariaLabel: 'Pick' },
      slots: { default: () => [h(UiRadio, { value: 'a' }, () => 'A')] },
    })
    expect(radio.find('input:disabled ~ .ui-mark-dot').exists()).toBe(true)
    expect(unlayered).toMatch(/input:disabled ~ \.ui-mark-dot \{[^}]*background: GrayText/)
  })

  it('a selected row carries a frame that survives forced colors', () => {
    const w = mount(UiTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        selectable: true,
        selection: new Set([2]),
      },
    })
    const rows = w.findAll('tbody tr')
    expect(rows[0]!.classes()).not.toContain('ui-row-selected')
    expect(rows[1]!.classes()).toContain('ui-row-selected')
    expect(unlayered).toMatch(/\.ui-row-selected \{[^}]*outline: 2px solid Highlight/)
  })

  it('each stateful plate carries its hook', () => {
    expect(mount(UiButton, { props: { pressed: true } }).classes()).toContain('ui-toggle')
    expect(
      mount(UiIconButton, { props: { ariaLabel: 'Edit', icon: Pencil, pressed: true } }).classes(),
    ).toContain('ui-toggle')
    expect(
      mount(UiSwitch, { props: { modelValue: true, ariaLabel: 'On' } })
        .find('[role="switch"]')
        .classes(),
    ).toContain('ui-switch')
    expect(mount(UiProgress, { props: { value: 3 } }).classes()).toContain('ui-progress')
    expect(
      mount(UiTabs, {
        props: { modelValue: 'a', tabs: [{ value: 'a', label: 'A' }], ariaLabel: 'T' },
      })
        .find('[role="tab"]')
        .classes(),
    ).toContain('ui-tab')
    const shell = mount(UiAppShell, {
      attachTo: document.body,
      props: { nav: [{ items: [{ to: '/', label: 'Home', icon: BarChart3 }] }], current: '/' },
    })
    expect(shell.find('[aria-current="page"]').classes()).toContain('ui-current')
    shell.unmount()
  })
})
