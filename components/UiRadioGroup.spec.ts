import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type PropType } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import UiField from './UiField.vue'
import UiRadio from './UiRadio.vue'
import UiRadioGroup from './UiRadioGroup.vue'
import { withGrani } from '../test/harness'
import { focusInvalid } from '../utils/focusInvalid'
import type { RadioGroupVariant, SelectValue } from '../types/ui'

const Plans = defineComponent({
  props: {
    modelValue: { type: [String, Number] as PropType<SelectValue | null>, default: null },
    groupProps: { type: Object, default: () => ({}) },
    itemProps: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        UiRadioGroup,
        {
          modelValue: props.modelValue,
          'aria-label': 'Plan',
          'onUpdate:modelValue': (v: unknown) => emit('update:modelValue', v),
          ...props.groupProps,
        },
        () => [
          h(UiRadio, { value: 'free' }, () => 'Free'),
          h(UiRadio, { value: 'team', description: 'Up to 10 seats' }, () => 'Team'),
          h(UiRadio, { value: 'enterprise', ...props.itemProps }, () => 'Enterprise'),
        ],
      )
  },
})

const radios = (w: ReturnType<typeof mount>) => w.findAll('input[type=radio]')

describe('UiRadioGroup — value', () => {
  it('is a radiogroup whose radios share one name and reflect the value', () => {
    const w = mount(Plans, { props: { modelValue: 'team' } })
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.attributes('aria-label')).toBe('Plan')
    const names = new Set(radios(w).map((r) => r.attributes('name')))
    expect(names.size).toBe(1)
    expect(radios(w).map((r) => (r.element as HTMLInputElement).checked)).toEqual([
      false,
      true,
      false,
    ])
    // The same in every drawing: native radios of one name, none taken out of the tab order or
    // given a stop of its own, so the browser walks rows, cards and segments alike.
    for (const variant of ['plain', 'card', 'card-check', 'segmented'] as const) {
      const v = mount(Plans, { props: { modelValue: 'team', groupProps: { variant } } })
      const own = new Set(radios(v).map((r) => r.attributes('name')))
      expect(own.size, variant).toBe(1)
      expect([...own][0], variant).toBeTruthy()
      for (const r of radios(v)) {
        expect(r.attributes('type'), variant).toBe('radio')
        expect(r.attributes('tabindex'), variant).toBeUndefined()
      }
      v.unmount()
    }
  })

  it('selecting a radio emits its value', async () => {
    const w = mount(Plans, { props: { modelValue: 'free' } })
    await radios(w)[1]!.setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([['team']])
  })

  it('the row is the label: a click on the text selects', async () => {
    const w = mount(Plans, { props: { modelValue: 'free' }, attachTo: document.body })
    await w.findAll('label')[2]!.find('span:last-child').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['enterprise']])
    w.unmount()
  })

  it('a description is read with its radio', () => {
    const w = mount(Plans, { props: { modelValue: null } })
    const team = radios(w)[1]!
    const desc = w.find(`#${team.attributes('aria-describedby')}`)
    expect(desc.text()).toBe('Up to 10 seats')
  })
})

describe('UiRadioGroup — states', () => {
  it('draws the selected mark as a brand fill with a dot; others empty', () => {
    const w = mount(Plans, { props: { modelValue: 'team' } })
    expect(radios(w)[1]!.classes()).toContain('bg-brand-solid')
    expect(w.findAll('label')[1]!.find('span[aria-hidden]').exists()).toBe(true)
    expect(radios(w)[0]!.classes()).toContain('border-control-border')
    expect(w.findAll('label')[0]!.find('span[aria-hidden]').exists()).toBe(false)
  })

  it('a disabled group disables every radio; a disabled radio only itself', () => {
    const all = mount(Plans, { props: { modelValue: 'free', groupProps: { disabled: true } } })
    expect(radios(all).every((r) => (r.element as HTMLInputElement).disabled)).toBe(true)
    expect(all.attributes('aria-disabled')).toBe('true')
    const one = mount(Plans, { props: { modelValue: 'free', itemProps: { disabled: true } } })
    expect(radios(one).map((r) => (r.element as HTMLInputElement).disabled)).toEqual([
      false,
      false,
      true,
    ])
    expect(one.findAll('label')[2]!.classes()).toContain('cursor-not-allowed')
    expect(radios(one)[2]!.classes()).toContain('bg-border-strong/40')
  })

  it('invalid is said by the group once; radios only redden their empty marks', () => {
    const w = mount(Plans, { props: { modelValue: null, groupProps: { invalid: true } } })
    expect(w.attributes('aria-invalid')).toBe('true')
    expect(radios(w)[0]!.classes()).toContain('border-danger-border')
    expect(radios(w)[0]!.attributes('aria-invalid')).toBeUndefined()
    expect(radios(w)[0]!.attributes('aria-required')).toBeUndefined()
  })

  it('a disabled card is a muted plate with gray text; the card mark is 20px', () => {
    const w = mount(Plans, {
      props: { modelValue: 'team', groupProps: { variant: 'card' }, itemProps: { disabled: true } },
    })
    const cards = w.findAll('label')
    expect(cards[2]!.classes()).toEqual(
      expect.arrayContaining(['bg-surface-muted', 'text-disabled-fg']),
    )
    expect(cards[2]!.classes().join(' ')).not.toMatch(/hover:|opacity/)
    expect(radios(w)[0]!.classes()).toContain('h-5')
  })

  it('a disabled radio stays disabled whatever the group says', () => {
    const w = mount(Plans, { props: { modelValue: 'free', itemProps: { disabled: true } } })
    expect((radios(w)[2]!.element as HTMLInputElement).disabled).toBe(true)
    expect((radios(w)[0]!.element as HTMLInputElement).disabled).toBe(false)
  })

  it('card: every radio is a card, the selected one with a brand border, the mark at the end', () => {
    const w = mount(Plans, { props: { modelValue: 'team', groupProps: { variant: 'card' } } })
    const cards = w.findAll('label')
    expect(cards[0]!.classes()).toEqual(expect.arrayContaining(['rounded-card', 'border-border']))
    // The brand border and halo come from the `.ui-choice[data-selected]` rule in tokens.css.
    expect(cards[1]!.classes()).toContain('ui-choice')
    expect(cards[1]!.attributes('data-selected')).toBe('true')
    expect(cards[0]!.attributes('data-selected')).toBeUndefined()
    expect(cards[1]!.classes()).toContain('items-center')
    expect(cards[1]!.find('input').element.parentElement!.classList.contains('order-last')).toBe(
      true,
    )
  })

  it('card-check: the mark is invisible until selected, then a check and a tint', () => {
    const w = mount(Plans, {
      props: { modelValue: 'team', groupProps: { variant: 'card-check' } },
    })
    expect(radios(w)[0]!.classes()).toContain('border-transparent')
    expect(w.findAll('label')[0]!.find('svg').exists()).toBe(false)
    expect(radios(w)[1]!.classes()).toContain('bg-brand-solid')
    expect(w.findAll('label')[1]!.find('svg').exists()).toBe(true)
    expect(w.findAll('label')[1]!.classes()).toContain('bg-brand-subtle')
  })

  it('media and meta slots render on a card only', () => {
    const Row = (variant: 'plain' | 'card') =>
      mount(UiRadioGroup, {
        props: { modelValue: 'a', variant },
        attrs: { 'aria-label': 'Pay' },
        slots: {
          default: () =>
            h(
              UiRadio,
              { value: 'a' },
              { default: () => 'Card', media: () => h('i', 'M'), meta: () => '12 EUR' },
            ),
        },
      })
    expect(Row('card').text()).toContain('12 EUR')
    expect(Row('card').find('i').exists()).toBe(true)
    expect(Row('plain').text()).not.toContain('12 EUR')
    expect(Row('plain').find('i').exists()).toBe(false)
  })
})

describe('UiRadioGroup — review follow-ups', () => {
  it('two groups on one page never share a generated name; an explicit name wins', () => {
    const Two = defineComponent({
      setup() {
        return () => [
          h(UiRadioGroup, { modelValue: null, 'aria-label': 'A' }, () => h(UiRadio, { value: 1 })),
          h(UiRadioGroup, { modelValue: null, 'aria-label': 'B', name: 'plan' }, () =>
            h(UiRadio, { value: 1 }),
          ),
        ]
      },
    })
    const w = mount(Two)
    const names = w.findAll('input').map((i) => i.attributes('name'))
    expect(names[0]).not.toBe(names[1])
    expect(names[1]).toBe('plan')
  })

  it('a vetoed change puts the DOM back on the model', async () => {
    const w = mount(Plans, { props: { modelValue: 'free' }, attachTo: document.body })
    const team = radios(w)[1]!.element as HTMLInputElement
    team.checked = true
    await radios(w)[1]!.trigger('change')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')).toEqual([['team']])
    expect(team.checked).toBe(false)
    expect((radios(w)[0]!.element as HTMLInputElement).checked).toBe(true)
    w.unmount()
  })

  it('card-check: an invalid group still reddens the empty marks', () => {
    const w = mount(Plans, {
      props: { modelValue: null, groupProps: { variant: 'card-check', invalid: true } },
    })
    expect(radios(w)[0]!.classes()).toContain('border-danger-border')
  })

  it('exposes focus() on a radio', () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: null },
      slots: { default: () => h(UiRadio, { value: 'a', ref: 'r' }) },
      attachTo: document.body,
    })
    ;(w.findComponent(UiRadio).vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('a radio with no slot text is not labeled by an empty span; aria-label or an external label for its id names it', () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: null },
      attrs: { 'aria-label': 'Plan' },
      slots: {
        default: () => [
          h(UiRadio, { value: 'a', ariaLabel: 'Grid' }),
          h(UiRadio, { value: 'b', id: 'ext-id' }),
          h(UiRadio, { value: 'c' }, () => 'Text'),
          h(UiRadio, { value: 'd', ariaLabel: 'List' }, () => h('svg')),
        ],
      },
    })
    const [a, b, c, d] = w.findAll('input')
    expect(d!.attributes('aria-labelledby')).toBeUndefined()
    expect(d!.attributes('aria-label')).toBe('List')
    expect(a!.attributes('aria-labelledby')).toBeUndefined()
    expect(a!.attributes('aria-label')).toBe('Grid')
    expect(b!.attributes('aria-labelledby')).toBeUndefined()
    expect(b!.attributes('id')).toBe('ext-id')
    const labelId = c!.attributes('aria-labelledby')!
    expect(w.find(`[id="${labelId}"]`).text()).toBe('Text')
  })

  it('a segmented radio with a description does not point aria-describedby at a nonexistent element', () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: 'a', variant: 'segmented' },
      attrs: { 'aria-label': 'Period' },
      slots: { default: () => h(UiRadio, { value: 'a', description: 'Hidden' }, () => 'A') },
    })
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('keeps the mark against the first line when the label wraps; a card stays centered', () => {
    const w = mount(Plans, { props: { modelValue: 'free' } })
    const row = w.findAll('label')[0]!
    expect(row.classes()).toContain('items-start')
    expect(row.classes()).not.toContain('items-center')
    expect(w.find('input').element.parentElement!.classList.contains('mt-px')).toBe(true)
    const card = mount(Plans, { props: { modelValue: 'free', groupProps: { variant: 'card' } } })
    expect(card.findAll('label')[0]!.classes()).toContain('items-center')
    expect(card.find('input').element.parentElement!.classList.contains('mt-px')).toBe(false)
  })
})

describe('UiRadioGroup — inside UiField group', () => {
  const Form = defineComponent({
    setup() {
      return () =>
        h(UiField, { label: 'Plan', group: true, required: true, error: 'Choose a plan' }, () =>
          h(UiRadioGroup, { modelValue: null }, () => [
            h(UiRadio, { value: 'free' }, () => 'Free'),
          ]),
        )
    },
  })

  it('the field is a fieldset with a legend; the group takes the legend as its name', () => {
    const w = mount(Form)
    expect(w.element.tagName).toBe('FIELDSET')
    const legend = w.find('legend')
    expect(legend.text()).toContain('Plan')
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-labelledby')).toBe(legend.attributes('id'))
    expect(group.attributes('aria-describedby')).toBe(w.find('[role=alert]').attributes('id'))
    expect(group.attributes('aria-invalid')).toBe('true')
    // The legend names the group and says "required"; the group does not repeat it.
    expect(group.attributes('aria-required')).toBeUndefined()
    expect(legend.text()).toContain('required')
    expect(w.find('input').classes()).toContain('border-danger-border')
    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    expect(group.attributes('id')).toBeUndefined()
  })

  it('group renders a fieldset and drops meta', () => {
    const w = mount(UiField, {
      props: { label: 'Plan', group: true },
      slots: { default: () => h('div', { role: 'radiogroup' }), meta: () => 'extra' },
    })
    expect(w.element.tagName).toBe('FIELDSET')
    expect(w.text()).not.toContain('extra')
  })
})

describe('UiRadioGroup — second review', () => {
  it('the name is the label text; the description and meta are read once after it', () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: null, variant: 'card' },
      attrs: { 'aria-label': 'Shipping' },
      slots: {
        default: () =>
          h(
            UiRadio,
            { value: 'c', description: 'Tomorrow' },
            { default: () => 'Courier', meta: () => '12 EUR' },
          ),
      },
    })
    const input = w.find('input')
    expect(w.find(`[id="${input.attributes('aria-labelledby')}"]`).text()).toBe('Courier')
    const described = input
      .attributes('aria-describedby')!
      .split(' ')
      .map((id) => w.find(`[id="${id}"]`).text())
    expect(described).toEqual(['Tomorrow', '12 EUR'])
  })

  it('a disabled mark stays muted in an invalid card-check group', () => {
    const w = mount(Plans, {
      props: {
        modelValue: null,
        groupProps: { variant: 'card-check', invalid: true },
        itemProps: { disabled: true },
      },
    })
    expect(radios(w)[2]!.classes()).not.toContain('border-danger-border')
    expect(radios(w)[2]!.classes()).toContain('bg-border-strong/40')
    expect(radios(w)[0]!.classes()).toContain('border-danger-border')
  })

  it('segmented: a bar on the ladder, one segment pressed, native radios underneath', async () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: 'week', variant: 'segmented' },
      attrs: { 'aria-label': 'Period' },
      slots: {
        default: () => [
          h(UiRadio, { value: 'day' }, () => 'Day'),
          h(UiRadio, { value: 'week' }, () => 'Week'),
          h(UiRadio, { value: 'month' }, () => 'Month'),
        ],
      },
    })
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['inline-flex', 'h-9', 'rounded-control', 'p-0.5']),
    )
    const segments = w.findAll('label')
    expect(segments).toHaveLength(3)
    expect(segments[1]!.classes()).toEqual(expect.arrayContaining(['bg-surface', 'shadow-xs']))
    expect(segments[0]!.classes()).toContain('text-fg-muted')
    expect(segments[1]!.attributes('data-selected')).toBe('true')
    expect(w.findAll('input[type="radio"]')).toHaveLength(3)
    expect(w.find('input').classes()).toContain('opacity-0')
    expect(w.find('.rounded-pill').exists()).toBe(false)
    await w.findAll('input')[2]!.trigger('change')
    expect(w.emitted('update:modelValue')).toEqual([['month']])
  })

  it('segmented: md is 44px, block fills the row and segments share it', () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: 'a', variant: 'segmented', size: 'md', block: true },
      attrs: { 'aria-label': 'Kind' },
      slots: {
        default: () => [
          h(UiRadio, { value: 'a' }, () => 'A'),
          h(UiRadio, { value: 'b' }, () => 'B'),
        ],
      },
    })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'w-full', 'h-11', 'p-1']))
    for (const seg of w.findAll('label')) expect(seg.classes()).toContain('flex-1')
  })
})

describe('UiRadioGroup — one radio per value', () => {
  const Twice = defineComponent({
    props: {
      showFirst: { type: Boolean, default: true },
      variant: { type: String as PropType<RadioGroupVariant>, default: 'plain' },
    },
    setup(props) {
      const model = ref<SelectValue | null>('a')
      return () =>
        h(
          UiRadioGroup,
          {
            modelValue: model.value,
            variant: props.variant,
            'aria-label': 'Pick',
            'onUpdate:modelValue': (v: SelectValue) => (model.value = v),
          },
          () => [
            props.showFirst ? h(UiRadio, { value: 'a', key: 'first' }, () => 'First') : null,
            h(UiRadio, { value: 'a', key: 'second' }, () => 'Second'),
            h(UiRadio, { value: 'b', key: 'b' }, () => 'B'),
          ],
        )
    },
  })
  const checked = (w: ReturnType<typeof mount>) =>
    radios(w).map((r) => (r.element as HTMLInputElement).checked)

  it('with two radios on one value only the first is selected, drawn and native', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Twice, { props: { variant: 'segmented' }, attachTo: document.body })
    await w.vm.$nextTick()
    expect(checked(w)).toEqual([true, false, false])
    const labels = w.findAll('label')
    expect(labels[0]!.classes()).not.toEqual(labels[1]!.classes())
    await radios(w)[1]!.setValue(true)
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(checked(w)).toEqual([true, false, false])
    w.unmount()
    warn.mockRestore()
  })

  it('warns once in dev, naming the problem, never the value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Twice).unmount()
    const calls = warn.mock.calls.filter(([m]) => String(m).includes('two radios'))
    expect(calls).toHaveLength(1)
    expect(String(calls[0]![0])).not.toContain('"a"')
    warn.mockRestore()
  })

  it('when the first leaves, the second stands for the value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Twice)
    await w.setProps({ showFirst: false })
    await w.vm.$nextTick()
    expect(checked(w)).toEqual([true, false])
    w.unmount()
    warn.mockRestore()
  })
})

describe('UiRadioGroup — review follow-ups', () => {
  const inForm = (props: Record<string, unknown>, groupProps: Record<string, unknown> = {}) => {
    const form = document.createElement('form')
    document.body.append(form)
    const w = mount(Plans, { attachTo: form, props: { ...props, groupProps } })
    return { form, w }
  }

  it('a form reset leaves the radios on the model, mark and DOM agreeing', async () => {
    const { form, w } = inForm({ modelValue: 'team' }, { name: 'plan' })
    const team = radios(w)[1]!.element as HTMLInputElement
    // A browser unchecks a radio Vue checked by property; the engine here may not, so it is done by hand.
    form.addEventListener('reset', () => (team.checked = false))
    form.reset()
    expect(team.checked).toBe(false)
    await new Promise((r) => setTimeout(r))
    expect(team.checked).toBe(true)
    expect(new FormData(form).get('plan')).toBe('team')
    w.unmount()
    form.remove()
  })

  it('in a form the checked radio sends its value under the group name, and none sends nothing', () => {
    const one = inForm({ modelValue: 'free' }, { name: 'plan' })
    expect(new FormData(one.form).get('plan')).toBe('free')
    one.w.unmount()
    one.form.remove()
    const none = inForm({ modelValue: null }, { name: 'plan' })
    expect(new FormData(none.form).has('plan')).toBe(false)
    none.w.unmount()
    none.form.remove()
    // A disabled group sends nothing either, its chosen radio included.
    const off = inForm({ modelValue: 'free' }, { name: 'plan', disabled: true })
    expect(new FormData(off.form).has('plan')).toBe(false)
    off.w.unmount()
    off.form.remove()
  })

  it('a disabled selected segment keeps a plate and no shadow', () => {
    const w = mount(Plans, {
      props: { modelValue: 'team', groupProps: { variant: 'segmented', disabled: true } },
    })
    const team = w.findAll('label')[1]!
    expect(team.classes()).toContain('bg-border-strong/40')
    expect(team.classes()).not.toContain('shadow-xs')
  })

  it('an invalid segmented bar reddens its frame; a disabled one keeps its own', () => {
    const bad = mount(Plans, {
      props: { modelValue: 'team', groupProps: { variant: 'segmented', invalid: true } },
    })
    expect(bad.classes()).toContain('border-danger-border')
    const off = mount(Plans, {
      props: {
        modelValue: 'team',
        groupProps: { variant: 'segmented', invalid: true, disabled: true },
      },
    })
    expect(off.classes()).not.toContain('border-danger-border')
    expect(off.classes()).toContain('border-control-border')
  })

  it("a segmented bar follows the app's size and reads xs as sm", () => {
    const at = (size: 'xs' | 'md') =>
      mount(Plans, {
        props: { modelValue: 'team', groupProps: { variant: 'segmented' } },
        global: { plugins: withGrani({ size }) },
      }).classes()
    expect(at('md')).toContain('h-11')
    expect(at('xs')).toContain('h-9')
  })

  it("a caller's aria-describedby on the group is joined with the field's, and ours win on aria-invalid", () => {
    const w = mount(UiField, {
      props: { label: 'Plan', group: true, error: 'Choose a plan' },
      slots: {
        default: () =>
          h(
            UiRadioGroup,
            { modelValue: null, 'aria-describedby': 'hint', 'aria-invalid': 'false' },
            () => [h(UiRadio, { value: 'a' }, () => 'A')],
          ),
      },
    })
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-describedby')).toBe(
      `hint ${w.find('[role=alert]').attributes('id')}`,
    )
    expect(group.attributes('aria-invalid')).toBe('true')
  })

  it('required on the group says aria-required and puts required on each input; inside a group field it stays silent', () => {
    const w = mount(Plans, { props: { modelValue: null, groupProps: { required: true } } })
    expect(w.attributes('aria-required')).toBe('true')
    expect(radios(w).every((r) => r.attributes('required') !== undefined)).toBe(true)
    const field = mount(UiField, {
      props: { label: 'Plan', group: true, required: true },
      slots: {
        default: () =>
          h(UiRadioGroup, { modelValue: null }, () => [h(UiRadio, { value: 'a' }, () => 'A')]),
      },
    })
    expect(field.find('[role=radiogroup]').attributes('aria-required')).toBeUndefined()
    expect(field.find('input').attributes('required')).toBeUndefined()
  })

  it("a caller's aria-labelledby survives on a radio with no slot text", () => {
    const w = mount(UiRadioGroup, {
      props: { modelValue: null, 'aria-label': 'Plan' },
      slots: { default: () => h(UiRadio, { value: 'a', 'aria-labelledby': 'grid-name' }) },
    })
    expect(w.find('input').attributes('aria-labelledby')).toBe('grid-name')
  })

  it('an invalid empty mark keeps its danger border on hover', () => {
    const w = mount(Plans, { props: { modelValue: null, groupProps: { invalid: true } } })
    const mark = radios(w)[0]!
    expect(mark.classes()).toContain('border-danger-border')
    expect(mark.classes()).not.toContain('enabled:hover:border-control-border-hover')
  })

  it('warns in dev when the group has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiRadioGroup, {
      props: { modelValue: null },
      slots: { default: () => h(UiRadio, { value: 'a' }, () => 'A') },
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiRadioGroup has no name'))
    warn.mockClear()
    mount(Plans, { props: { modelValue: null } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('focusInvalid on an invalid radiogroup focuses the chosen radio, else the first', () => {
    const chosen = mount(Plans, {
      attachTo: document.body,
      props: { modelValue: 'team', groupProps: { invalid: true } },
    })
    expect(focusInvalid(chosen.element.parentElement as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(radios(chosen)[1]!.element)
    chosen.unmount()
    const none = mount(Plans, {
      attachTo: document.body,
      props: { modelValue: null, groupProps: { invalid: true } },
    })
    expect(focusInvalid(none.element.parentElement as HTMLElement)).toBe(true)
    expect(document.activeElement).toBe(radios(none)[0]!.element)
    none.unmount()
  })

  it('a click anywhere on a card picks it, its media and its meta included', async () => {
    const w = mount(UiRadioGroup, {
      attachTo: document.body,
      props: { modelValue: null, variant: 'card', 'aria-label': 'Plan' },
      slots: {
        default: () => [
          h(
            UiRadio,
            { value: 'a' },
            {
              default: () => 'A',
              media: () => h('i', { class: 'm' }),
              meta: () => h('b', { class: 'p' }, '$5'),
            },
          ),
          h(
            UiRadio,
            { value: 'b' },
            { default: () => 'B', meta: () => h('b', { class: 'q' }, '$9') },
          ),
        ],
      },
    })
    ;(w.find('.m').element as HTMLElement).click()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
    ;(w.find('.q').element as HTMLElement).click()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['b'])
    w.unmount()
  })

  it('segments keep one weight whether chosen or not, so none changes width on a pick', async () => {
    const w = mount(Plans, { props: { modelValue: 'free', groupProps: { variant: 'segmented' } } })
    // What sets a segment's width: its weight, its size, its padding and its gaps. A pick may change
    // the plate and the ink, never these.
    const width = () =>
      w
        .findAll('label')
        .map((l) =>
          l.classes().filter((c) => /^(font-|text-(xs|sm|base)|px-|ps-|pe-|gap-)/.test(c)),
        )
    const before = width()
    for (const label of before) expect(label).toContain('font-medium')
    await w.setProps({ modelValue: 'team' })
    expect(width()).toEqual(before)
  })
})

describe('UiRadioGroup — final review follow-ups', () => {
  it('a value no radio stands for warns once in development, naming it; a known value and null do not', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const said = () => warn.mock.calls.filter(([m]) => String(m).includes('none of its radios'))
    for (const value of ['team', null]) mount(Plans, { props: { modelValue: value } }).unmount()
    expect(said()).toHaveLength(0)
    const w = mount(Plans, { props: { modelValue: 'retired' } })
    await nextTick()
    expect(said()).toHaveLength(1)
    expect(String(said()[0]![0])).toContain('"retired"')
    expect(radios(w).some((r) => (r.element as HTMLInputElement).checked)).toBe(false)
    w.unmount()
    warn.mockRestore()
  })

  it('focus() passes over a radio that is off', () => {
    const w = mount(UiRadioGroup, {
      attachTo: document.body,
      props: { modelValue: null, ariaLabel: 'Plan' },
      slots: {
        default: () => [
          h(UiRadio, { value: 'a', disabled: true }, () => 'A'),
          h(UiRadio, { value: 'b' }, () => 'B'),
        ],
      },
    })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(radios(w)[1]!.element)
    w.unmount()
  })

  it('focus() takes the chosen radio, or the first that is on', async () => {
    const w = mount(Plans, {
      attachTo: document.body,
      props: { modelValue: 'team', itemProps: { disabled: true } },
    })
    ;(w.findComponent(UiRadioGroup).vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(radios(w)[1]!.element)
    await w.setProps({ modelValue: null })
    ;(w.findComponent(UiRadioGroup).vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(radios(w)[0]!.element)
    w.unmount()
  })

  it('a disabled chosen card keeps the neutral border; an enabled chosen card is marked selected', () => {
    const on = mount(Plans, { props: { modelValue: 'team', groupProps: { variant: 'card' } } })
    expect(on.findAll('label')[1]!.attributes('data-selected')).toBe('true')
    const off = mount(Plans, {
      props: { modelValue: 'team', groupProps: { variant: 'card', disabled: true } },
    })
    expect(off.findAll('label')[1]!.attributes('data-selected')).toBeUndefined()
    expect((radios(off)[1]!.element as HTMLInputElement).checked).toBe(true)
  })

  it('a plain row stands 8px from its mark, as a checkbox does; a card 12px', () => {
    const plain = mount(Plans).find('label')
    expect(plain.classes()).toContain('gap-2')
    expect(plain.classes()).not.toContain('gap-3')
    const card = mount(Plans, { props: { groupProps: { variant: 'card' } } }).find('label')
    expect(card.classes()).toContain('gap-3')
    expect(card.classes()).not.toContain('gap-2')
  })

  it('a segmented bar scrolls in a strip that reaches under its frame; other drawings have none', () => {
    for (const [size, reach] of [
      ['sm', '-m-[3px]'],
      ['md', '-m-[5px]'],
    ] as const) {
      const w = mount(Plans, { props: { groupProps: { variant: 'segmented', size } } })
      const strip = w.find('[role="radiogroup"] > div')
      expect(strip.classes()).toEqual(expect.arrayContaining(['overflow-x-auto', reach]))
      expect(strip.findAll('label')).toHaveLength(3)
    }
    const plain = mount(Plans)
    expect(plain.find('[role="radiogroup"] > div').exists()).toBe(false)
    expect(plain.find('[role="radiogroup"] > label').exists()).toBe(true)
  })

  it('a card draws its ring for keyboard focus only, not after a click', () => {
    const css = readFileSync(resolve(__dirname, '../assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(/\.ui-choice:has\(:focus-visible\) \{/)
    expect(css).toMatch(/\.ui-choice\[data-selected\]:has\(:focus-visible\) \{/)
    expect(css).not.toMatch(/\.ui-choice[^{]*:focus-within/)
  })
})

describe('UiRadioGroup — review follow-ups', () => {
  const two = () => [h(UiRadio, { value: 'a' }, () => 'A'), h(UiRadio, { value: 'b' }, () => 'B')]

  it('`ariaLabel` names the group, as it does on the controls beside it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    onTestFinished(() => warn.mockRestore())
    const w = mount(UiRadioGroup, {
      props: { modelValue: null, ariaLabel: 'Region' },
      slots: { default: two },
    })
    expect(w.attributes('aria-label')).toBe('Region')
    expect(w.attributes('arialabel')).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
    w.unmount()
  })

  it('inside a UiField group the legend names it, not `ariaLabel`', () => {
    const w = mount(UiField, {
      props: { label: 'Region', group: true },
      slots: {
        default: () => h(UiRadioGroup, { modelValue: null, ariaLabel: 'Ignored' }, two),
      },
    })
    const group = w.find('[role="radiogroup"]')
    expect(group.attributes('aria-label')).toBeUndefined()
    expect(group.attributes('aria-labelledby')).toBeTruthy()
    w.unmount()
  })

  it('a model of the empty string is no answer and says nothing, as in UiSelect', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    onTestFinished(() => warn.mockRestore())
    const w = mount(Plans, { props: { modelValue: '' } })
    await nextTick()
    expect(warn).not.toHaveBeenCalled()
    expect(radios(w).some((r) => (r.element as HTMLInputElement).checked)).toBe(false)
    w.unmount()
  })
})
