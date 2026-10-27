import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { focusInvalid } from '../utils/focusInvalid'
import UiModal from './UiModal.vue'
import UiTimePicker from './UiTimePicker.vue'
import UiField from './UiField.vue'
import UiButtonGroup from './UiButtonGroup.vue'
import UiButton from './UiButton.vue'
import { RUSSIAN, withGrani } from '../test/harness'

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}

const button = (w: ReturnType<typeof mount>) => w.find('[role="combobox"]')
const hourRows = () => [
  ...document.querySelectorAll<HTMLElement>('ul[data-column=hour] [role=option]'),
]
const minuteRows = () => [
  ...document.querySelectorAll<HTMLElement>('ul[data-column=minute] [role=option]'),
]
const periodRows = () => [
  ...document.querySelectorAll<HTMLElement>('ul[data-column=period] [role=option]'),
]
const open = async (w: ReturnType<typeof mount>) => {
  await button(w).trigger('click')
  await settle()
}

describe('UiTimePicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the hours and minutes the window allows, in two columns', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { min: '09:00', max: '11:00', step: 30, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    expect(hourRows().map((r) => r.textContent)).toContain('09')
    expect(
      hourRows()
        .find((r) => r.textContent === '08')
        ?.getAttribute('aria-disabled'),
    ).not.toBe('false')
    expect(minuteRows().map((r) => r.textContent)).toEqual(['00', '30'])
  })

  it('a value off the step is kept and listed in its place', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '09:45', min: '09:00', max: '10:00', step: 30, ariaLabel: 'Start' },
    })
    await open(w)
    expect(minuteRows().map((r) => r.textContent)).toEqual(['00', '30', '45'])
  })

  it('a pick emits HH:mm; a clear emits null', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', clearable: true, ariaLabel: 'Start' },
    })
    await open(w)
    const row = minuteRows().find((r) => r.textContent === '05')!
    row.click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([['10:05']])
    await w.find('[aria-label="Clear the time"]').trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })

  it('inside a field it is named by the label', async () => {
    const w = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Start time' },
      slots: { default: () => h(UiTimePicker, { modelValue: '' }) },
    })
    await settle()
    expect(w.find('label').attributes('for')).toBe(w.find('[role="combobox"]').attributes('id'))
  })

  it('an hour press keeps the panel open and moves the focus to Minute', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', step: 5, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const hourRow = hourRows().find((r) => r.textContent === '09')!
    hourRow.click()
    await settle()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['09:00'])
    expect(document.querySelector('[role=dialog]')).not.toBeNull()
    expect(document.activeElement?.closest('ul')?.getAttribute('data-column')).toBe('minute')
  })

  it('a minute press closes the panel and returns the focus to the field', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', step: 5, ariaLabel: 'Start' },
    })
    await open(w)
    const row = minuteRows().find((r) => r.textContent === '15')!
    row.click()
    await settle()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['10:15'])
    expect(document.querySelector('[role=dialog]')).toBeNull()
  })

  it('an hour press clamps the current minute to the nearest one the window allows', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:07', min: '00:00', max: '23:59', step: 10, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const hourRow = hourRows().find((r) => r.textContent === '09')!
    hourRow.click()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['09:10'])
  })

  it('with no value yet, an hour press takes the first allowed minute', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { min: '08:30', max: '20:00', step: 15, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const hourRow = hourRows().find((r) => r.textContent === '09')!
    hourRow.click()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['09:00'])
  })

  it('the default step is five minutes', async () => {
    const w = mount(UiTimePicker, { attachTo: document.body, props: { ariaLabel: 'Start' } })
    await open(w)
    expect(
      minuteRows()
        .map((r) => r.textContent)
        .slice(0, 3),
    ).toEqual(['00', '05', '10'])
  })

  it('hourCycle 12 draws Hour, Minute and Period; unset, the language decides: AM and PM in English, 24 hours in Russian', async () => {
    const en = mount(UiTimePicker, {
      attachTo: document.body,
      props: { ariaLabel: 'Start', hourCycle: 12 },
    })
    await open(en)
    expect(
      hourRows()
        .map((r) => r.textContent)
        .slice(0, 3),
    ).toEqual(['12', '1', '2'])
    expect(periodRows().map((r) => r.textContent)).toEqual(['AM', 'PM'])
    en.unmount()
    document.body.innerHTML = ''
    const english = mount(UiTimePicker, { attachTo: document.body, props: { ariaLabel: 'Start' } })
    await open(english)
    expect(periodRows().map((r) => r.textContent)).toEqual(['AM', 'PM'])
    english.unmount()
    document.body.innerHTML = ''
    const ru = mount(UiTimePicker, {
      attachTo: document.body,
      props: { ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(ru)
    expect(
      hourRows()
        .map((r) => r.textContent)
        .slice(0, 3),
    ).toEqual(['00', '01', '02'])
    expect(periodRows()).toHaveLength(0)
  })

  it('an hour with no allowed minute, and a minute outside the window, are shown but disabled', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { min: '09:15', max: '09:45', step: 30, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const hour08 = hourRows().find((r) => r.textContent === '08')!
    expect(hour08.getAttribute('aria-disabled')).toBe('true')
    const hour09 = hourRows().find((r) => r.textContent === '09')!
    expect(hour09.getAttribute('aria-disabled')).not.toBe('true')
  })

  it('a window that crosses midnight wraps instead of reading empty', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { min: '22:00', max: '06:00', step: 60, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const hour23 = hourRows().find((r) => r.textContent === '23')!
    const hour02 = hourRows().find((r) => r.textContent === '02')!
    const hour12 = hourRows().find((r) => r.textContent === '12')!
    expect(hour23.getAttribute('aria-disabled')).not.toBe('true')
    expect(hour02.getAttribute('aria-disabled')).not.toBe('true')
    expect(hour12.getAttribute('aria-disabled')).toBe('true')
  })

  it('typed digits build a time: 9, 930, 1437 and 0930', async () => {
    vi.useFakeTimers()
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { hourCycle: 12, ariaLabel: 'Start' },
    })
    await button(w).trigger('keydown', { key: '9' })
    await settle()
    expect(document.activeElement?.textContent).toBe('9')
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: '3', bubbles: true, cancelable: true }),
    )
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true }),
    )
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['09:30'])
    // Off the five-minute step, a typed minute is taken as typed.
    vi.advanceTimersByTime(1100)
    await button(w).trigger('keydown', { key: '1' })
    await settle()
    for (const key of ['4', '3', '7', 'Enter'])
      await document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['14:37'])
    vi.useRealTimers()
  })

  it('a second of quiet keeps the typed time: the next digit goes on from it', async () => {
    vi.useFakeTimers()
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { hourCycle: 12, ariaLabel: 'Start' },
    })
    await button(w).trigger('keydown', { key: '1' })
    await settle()
    vi.advanceTimersByTime(1100)
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: '4', bubbles: true, cancelable: true }),
    )
    await settle()
    // Read as 24-hour first, and said so: 14 is 2 PM, the row that reads 2.
    expect(w.find('[data-typed]').text()).toBe('2:__ PM')
    expect(document.activeElement?.textContent).toBe('2')
    vi.useRealTimers()
  })

  it('ArrowLeft and ArrowRight move the focus between the columns', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', ariaLabel: 'Start' },
    })
    await open(w)
    expect(document.activeElement?.closest('ul')?.getAttribute('data-column')).toBe('hour')
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(document.activeElement?.closest('ul')?.getAttribute('data-column')).toBe('minute')
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(document.activeElement?.closest('ul')?.getAttribute('data-column')).toBe('hour')
  })
})

describe('UiTimePicker — the hour cycle', () => {
  it('hourCycle 24 drops the Period column in English, and 12 adds it in Russian', async () => {
    const en = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '14:30', hourCycle: 24, ariaLabel: 'Start' },
    })
    expect(button(en).text()).toContain('14:30')
    await open(en)
    expect(periodRows()).toHaveLength(0)
    expect(hourRows()).toHaveLength(24)
    en.unmount()
    const ru = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '14:30', hourCycle: 12, ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    expect(button(ru).text()).toMatch(/2:30/)
    await open(ru)
    expect(periodRows()).toHaveLength(2)
    expect(hourRows()).toHaveLength(12)
    ru.unmount()
  })
})

describe('UiTimePicker — review follow-ups, typing and focus', () => {
  it('the field shows the typed digits as a time until Enter or Escape', async () => {
    vi.useFakeTimers()
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:30', ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    const typed = () => (w.find('[data-typed]').exists() ? w.find('[data-typed]').text() : '')
    await button(w).trigger('keydown', { key: '1' })
    await settle()
    expect(typed()).toBe('1_:__')
    for (const key of ['4', '3'])
      await document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )
    await settle()
    // Three digits are H:mm: 143 is 1:43.
    expect(typed()).toBe('01:43')
    vi.advanceTimersByTime(1100)
    await settle()
    expect(typed()).toBe('01:43')
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(typed()).toBe('')
    expect(button(w).text()).toContain('10:30')
    vi.useRealTimers()
    w.unmount()
  })

  it('a typed hour lights its row on a 12-hour column too', async () => {
    vi.useFakeTimers()
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { hourCycle: 12, modelValue: '10:30', ariaLabel: 'Start' },
    })
    await button(w).trigger('keydown', { key: '1' })
    await settle()
    await document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: '4', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(document.activeElement?.textContent?.trim()).toBe('2')
    vi.useRealTimers()
    w.unmount()
  })

  it('the band goes to the column the focus moves to', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:30', ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    await open(w)
    const thirty = minuteRows().find((r) => r.textContent?.trim().startsWith('30'))!
    thirty.focus()
    await settle()
    const lit = () =>
      [...document.querySelectorAll<HTMLElement>('[data-column] [role=option]')].filter((r) =>
        r.className.includes('bg-surface-muted'),
      )
    expect(lit()).toEqual([thirty])
    w.unmount()
  })
})

describe('UiTimePicker — review follow-ups, 12 hours', () => {
  it('an hour allowed only in the other half of the day is open, and its press takes that half', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: {
        hourCycle: 12,
        modelValue: '23:00',
        min: '22:00',
        max: '06:00',
        step: 60,
        ariaLabel: 'Shift',
      },
    })
    await open(w)
    const three = hourRows().find((r) => r.textContent?.trim().startsWith('3'))!
    expect(three.getAttribute('aria-disabled')).not.toBe('true')
    // 8 AM and 8 PM are both outside the shift.
    const eight = hourRows().find((r) => r.textContent?.trim().startsWith('8'))!
    expect(eight.getAttribute('aria-disabled')).toBe('true')
    three.click()
    await settle()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['03:00'])
    w.unmount()
  })

  it('a half of the day with no allowed hour cannot be picked', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { hourCycle: 12, modelValue: '15:00', min: '14:00', max: '16:00', ariaLabel: 'Slot' },
    })
    await open(w)
    const [am, pm] = periodRows()
    expect(am!.getAttribute('aria-disabled')).toBe('true')
    expect(pm!.getAttribute('aria-disabled')).not.toBe('true')
    w.unmount()
  })
})

describe('UiTimePicker — review follow-ups', () => {
  it('a value with an hour or minute out of range is none, not a row in the list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const v of ['25:99', '24:00', '10:60']) {
      const w = mount(UiTimePicker, {
        attachTo: document.body,
        props: { modelValue: v, min: '00:00', max: '01:00', ariaLabel: 'T', name: 't' },
      })
      expect(button(w).text()).toContain('Choose a time')
      expect((w.find('input[type="hidden"]').element as HTMLInputElement).value).toBe('')
      w.unmount()
      document.body.innerHTML = ''
    }
    warn.mockRestore()
  })

  it('dev warns on a value that is no time and a bad bound, naming the problem, never the value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(UiTimePicker, { props: { modelValue: '25:99', ariaLabel: 'T' } })
    mount(UiTimePicker, { props: { modelValue: '', min: '9:75', ariaLabel: 'T' } })
    const said = warn.mock.calls.map(([m]) => String(m))
    expect(said.some((m) => m.includes('is not a time'))).toBe(true)
    expect(said.some((m) => m.includes('min') && m.includes('is not a time'))).toBe(true)
    expect(said.some((m) => m.includes('25:99'))).toBe(false)
    expect(said.some((m) => m.includes('9:75'))).toBe(false)
    warn.mockRestore()
  })

  it('a disabled picker sends nothing with a form', () => {
    const w = mount(UiTimePicker, {
      props: { modelValue: '10:30', disabled: true, name: 'at', ariaLabel: 'T' },
    })
    const hidden = w.find('input[type="hidden"][name="at"]').element as HTMLInputElement
    expect(hidden.value).toBe('10:30')
    expect(hidden.disabled).toBe(true)
  })

  it('labels follow the locale: 24 hours in Russian', async () => {
    const w = mount(UiTimePicker, {
      props: { modelValue: '21:00', ariaLabel: 'T' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    expect(w.find('[role="combobox"]').text()).toMatch(/21:00/)
  })

  it('joins a UiButtonGroup as one capsule: square inner corners, one step, no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiButtonGroup, {
      attachTo: document.body,
      props: { ariaLabel: 'When' },
      slots: {
        default: () => [
          h(UiTimePicker, { modelValue: '09:00', ariaLabel: 'From' }),
          h(UiTimePicker, { modelValue: '10:00', ariaLabel: 'To' }),
          h(UiButton, { variant: 'outline' }, () => 'Now'),
        ],
      },
    })
    const children = [...w.element.children]
    expect(children).toHaveLength(3)
    expect(children.slice(0, 2).every((el) => el.classList.contains('ui-capsule'))).toBe(true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })

  it('a one-digit hour is normalised, listed once and sent as HH:mm', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: {
        modelValue: '9:30',
        min: '09:00',
        max: '10:00',
        name: 'at',
        ariaLabel: 'T',
        hourCycle: 24,
      },
    })
    await open(w)
    expect(hourRows().filter((r) => r.textContent === '09')).toHaveLength(1)
    expect((w.find('input[type=hidden]').element as HTMLInputElement).value).toBe('09:30')
  })

  it('a required field shows no cross even when clearable', () => {
    const w = mount(UiField, {
      props: { label: 'Ends at', required: true },
      slots: { default: () => h(UiTimePicker, { modelValue: '10:00', clearable: true }) },
    })
    expect(w.find('[aria-label="Clear the time"]').exists()).toBe(false)
    const standalone = mount(UiTimePicker, {
      props: { modelValue: '10:00', clearable: true, required: true, ariaLabel: 'T' },
    })
    expect(standalone.find('[aria-label="Clear the time"]').exists()).toBe(false)
    expect(standalone.find('[role=combobox]').attributes('aria-required')).toBe('true')
  })

  it('a value outside min and max is kept and reads invalid', () => {
    const w = mount(UiTimePicker, {
      props: { modelValue: '07:00', min: '08:00', max: '12:00', ariaLabel: 'T' },
    })
    expect(w.find('[role=combobox]').attributes('aria-invalid')).toBe('true')
    const inside = mount(UiTimePicker, {
      props: { modelValue: '12:00', min: '08:00', max: '12:00', ariaLabel: 'T' },
    })
    expect(inside.find('[role=combobox]').attributes('aria-invalid')).toBeUndefined()
  })

  it('focus() on the picker focuses its combobox', () => {
    const w = mount(UiTimePicker, { attachTo: document.body, props: { ariaLabel: 'T' } })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.find('[role=combobox]').element)
  })

  it('a change the parent refuses puts the picker back on the model', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', ariaLabel: 'T', 'onUpdate:modelValue': () => {} },
    })
    await open(w)
    const row = minuteRows().find((r) => r.textContent === '30')!
    row.click()
    await settle()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([['10:30']])
    const shown = w.find('[role=combobox]').element.cloneNode(true) as HTMLElement
    shown.querySelectorAll('[data-sizer]').forEach((s) => s.remove())
    expect(shown.textContent).toMatch(/10:00/)
  })

  it('in a form it sends HH:mm under its name, and an empty value while empty', async () => {
    const w = mount(
      defineComponent({
        props: { at: { type: String, default: '10:30' } },
        setup: (p) => () =>
          h('form', [h(UiTimePicker, { modelValue: p.at, name: 'at', ariaLabel: 'T' })]),
      }),
    )
    expect(new FormData(w.element as HTMLFormElement).get('at')).toBe('10:30')
    await w.setProps({ at: '' })
    expect(new FormData(w.element as HTMLFormElement).get('at')).toBe('')
  })

  it('a picker marked invalid is what focusInvalid lands on', () => {
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('form', [
            h('input'),
            h(UiField, { label: 'Ends at', error: 'Pick when it ends' }, () =>
              h(UiTimePicker, { modelValue: '' }),
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    expect(focusInvalid(w.element as HTMLElement)).toBe(true)
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
  })

  it('inside UiField with a description it is named once and described once', () => {
    const w = mount(UiField, {
      props: { label: 'Ends at', description: 'Local time' },
      slots: { default: () => h(UiTimePicker, { modelValue: '10:00' }) },
    })
    const cb = w.find('[role=combobox]')
    expect(cb.attributes('aria-label')).toBeUndefined()
    expect(w.find('label').attributes('for')).toBe(cb.attributes('id'))
    expect(cb.attributes('aria-describedby')).toContain(w.find('p').attributes('id'))
  })

  it('the cross clears it and the focus stays on the field', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', clearable: true, ariaLabel: 'T' },
    })
    await w.find('[aria-label="Clear the time"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    expect(document.activeElement).toBe(w.find('[role=combobox]').element)
  })

  it('Escape in a window closes the list only', async () => {
    const w = mount(UiModal, {
      attachTo: document.body,
      props: { open: true, title: 'When' },
      slots: { default: () => h(UiTimePicker, { modelValue: '10:00', ariaLabel: 'T' }) },
    })
    await settle()
    const cb = document.querySelector('[role=combobox]') as HTMLElement
    cb.click()
    await settle()
    cb.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(cb.getAttribute('aria-expanded')).toBe('false')
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('a bad step falls back to every minute, not an endless or empty list', async () => {
    for (const step of [0, -5, Number.NaN]) {
      const w = mount(UiTimePicker, {
        attachTo: document.body,
        props: { step, min: '09:00', max: '09:02', ariaLabel: 'T' },
      })
      await open(w)
      expect(minuteRows().map((r) => r.textContent)).toEqual(['00', '01', '02'])
      w.unmount()
      document.body.innerHTML = ''
    }
  })
})

describe('UiTimePicker — a chord is the browser’s', () => {
  // Alt with ArrowDown opens a field's list, as a select and a date picker do (owner, 18.10.2026);
  // Ctrl or Meta with an arrow stays the browser's.
  it('Alt with ArrowDown opens the panel, as a select does; Ctrl leaves the key', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { ariaLabel: 'Start' },
      global: { plugins: withGrani() },
    })
    const field = w.find<HTMLButtonElement>('button[role="combobox"]').element
    field.focus()
    const press = (mods: Partial<KeyboardEventInit>) => {
      const e = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
        ...mods,
      })
      field.dispatchEvent(e)
      return e
    }
    const ctrl = press({ ctrlKey: true })
    await nextTick()
    expect(ctrl.defaultPrevented).toBe(false)
    expect(field.getAttribute('aria-expanded')).toBe('false')
    press({ altKey: true })
    await nextTick()
    expect(field.getAttribute('aria-expanded')).toBe('true')
    w.unmount()
  })
})

describe('UiTimePicker — a chord in the open panel', () => {
  it('Alt, Ctrl or Meta with an arrow moves no row and no column, and leaves the key', async () => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: { modelValue: '10:00', ariaLabel: 'Start' },
    })
    await open(w)
    const start = document.activeElement
    expect(start?.closest('ul')?.getAttribute('data-column')).toBe('hour')
    for (const [key, chord] of [
      ['ArrowDown', { altKey: true }],
      ['ArrowRight', { ctrlKey: true }],
      ['ArrowUp', { metaKey: true }],
    ] as const) {
      const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...chord })
      document.activeElement!.dispatchEvent(e)
      await settle()
      expect(e.defaultPrevented, key).toBe(false)
      expect(document.activeElement, key).toBe(start)
    }
    w.unmount()
  })
})

describe('UiTimePicker — a typed time', () => {
  const key = async (k: string) => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    )
    await settle()
  }
  const typeIn = async (text: string) => {
    for (const k of text) await key(k)
  }
  const focusField = (w: ReturnType<typeof mount>) => (button(w).element as HTMLElement).focus()
  const away = async () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
  }
  const heard = async () => {
    await new Promise((r) => setTimeout(r, 200))
    return document.getElementById('ui-announcer')?.textContent
  }
  const picker = (props: Record<string, unknown> = {}, plugins = withGrani(RUSSIAN)) => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: {
        modelValue: '10:30',
        ariaLabel: 'Start',
        'onUpdate:modelValue': (v: string | null) => w.setProps({ modelValue: v }),
        ...props,
      },
      global: { plugins },
    })
    return w
  }
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a press away takes a time typed in full, and drops a shorter one, said', async () => {
    const w = picker()
    focusField(w)
    await typeIn('1437')
    await away()
    expect(w.props('modelValue')).toBe('14:37')
    focusField(w)
    await typeIn('9')
    await away()
    expect(w.props('modelValue')).toBe('14:37')
    expect(await heard()).toBe('Время не принято: введите его полностью')
  })

  it('in a 12-hour language a press away wants the period, or an hour only the 24-hour clock has', async () => {
    const w = picker({ modelValue: null }, withGrani())
    focusField(w)
    await typeIn('2:30')
    await away()
    expect(w.props('modelValue')).toBeNull()
    focusField(w)
    await typeIn('2:30p')
    await away()
    expect(w.props('modelValue')).toBe('14:30')
    focusField(w)
    await typeIn('1615')
    await away()
    expect(w.props('modelValue')).toBe('16:15')
  })

  it('a time outside the window is not taken by Enter nor by a press away, and said', async () => {
    const w = picker({ min: '09:00', max: '18:00' })
    focusField(w)
    await typeIn('2010')
    await key('Enter')
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(await heard()).toBe('Время вне допустимого диапазона')
    await away()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('Escape drops the typed time wherever the focus is in the panel', async () => {
    const w = picker()
    focusField(w)
    await typeIn('1437')
    document.body.querySelector<HTMLElement>('[role="dialog"]')!.focus()
    await key('Escape')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('the cross, a press on a row and an arrow drop the typed time', async () => {
    const w = picker({ clearable: true })
    focusField(w)
    await typeIn('1437')
    document.body
      .querySelector<HTMLElement>('[aria-label="Очистить время"], [aria-label="Clear the time"]')!
      .click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([[null]])
    focusField(w)
    await typeIn('1437')
    minuteRows()[0]!.click()
    await settle()
    expect(w.props('modelValue')).not.toBe('14:37')
    focusField(w)
    await typeIn('16')
    await key('ArrowDown')
    expect(w.find('[data-typed]').exists()).toBe(false)
  })

  it('Backspace takes back a key; a mark ends the hour; digits of other scripts count', async () => {
    const w = picker({ modelValue: null })
    const typed = () => (w.find('[data-typed]').exists() ? w.find('[data-typed]').text() : '')
    focusField(w)
    await typeIn('145')
    await key('Backspace')
    expect(typed()).toBe('14:__')
    await key('Escape')
    focusField(w)
    await typeIn('1:5')
    expect(typed()).toBe('01:5_')
    await key('Escape')
    focusField(w)
    await typeIn('9.05')
    await key('Enter')
    expect(w.props('modelValue')).toBe('09:05')
    focusField(w)
    await typeIn('١٤٣٠')
    await key('Enter')
    expect(w.props('modelValue')).toBe('14:30')
  })
})

describe('UiTimePicker — review follow-ups', () => {
  const key = async (k: string) => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    )
    await settle()
  }
  const typeIn = async (text: string) => {
    for (const k of text) await key(k)
  }
  const focusField = (w: ReturnType<typeof mount>) => (button(w).element as HTMLElement).focus()
  const away = async () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
  }
  const picker = (props: Record<string, unknown> = {}, plugins = withGrani(RUSSIAN)) => {
    const w = mount(UiTimePicker, {
      attachTo: document.body,
      props: {
        modelValue: '10:30',
        ariaLabel: 'Start',
        'onUpdate:modelValue': (v: string | null) => w.setProps({ modelValue: v }),
        ...props,
      },
      global: { plugins },
    })
    return w
  }
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a space after the hour ends it, as a colon does: 9 30 is 09:30, and nothing is emitted before', async () => {
    const w = picker({ modelValue: null })
    focusField(w)
    await typeIn('9 30')
    await away()
    expect(w.emitted('update:modelValue')).toEqual([['09:30']])
  })

  it('Backspace to nothing puts the focus back on the chosen hour: Enter does not take the hour just taken back', async () => {
    const w = picker()
    focusField(w)
    await key('ArrowDown')
    await key('7')
    await key('Backspace')
    await key('Enter')
    expect(w.emitted('update:modelValue')?.at(-1)).not.toEqual(['07:30'])
  })

  it('a minute past 59 is not taken on a press away, never moved to 09:59', async () => {
    const w = picker({ modelValue: null })
    focusField(w)
    await typeIn('9:75')
    await away()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a time that does not exist is not taken: 2400 is not 02:40', async () => {
    const w = picker({ modelValue: null })
    focusField(w)
    await typeIn('2400')
    await away()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('three digits are H:mm: 230 and Enter is 02:30, not 23:00', async () => {
    const w = picker({ modelValue: null })
    focusField(w)
    await typeIn('230')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toEqual([['02:30']])
  })

  it('in a 12-hour language the typed text names the half of the day it will be read in', async () => {
    const w = picker({ modelValue: null }, withGrani())
    focusField(w)
    await typeIn('2:30')
    expect(w.find('[data-typed]').text()).toBe('2:30 AM')
  })

  it('where the period cannot be typed (ko), a press away takes a time written to the minute', async () => {
    const w = picker({ modelValue: null }, withGrani({ locale: 'ko' }))
    focusField(w)
    await typeIn('2:30')
    await away()
    expect(w.emitted('update:modelValue')).toEqual([['02:30']])
  })

  it('a typed time the window refuses marks the field invalid, not only the live region', async () => {
    const w = picker({ min: '09:00', max: '18:00' })
    focusField(w)
    await typeIn('1830')
    await key('Enter')
    expect(button(w).attributes('aria-invalid')).toBe('true')
  })

  it('Backspace takes back the key typed last, the period too', async () => {
    const w = picker({ modelValue: null }, withGrani())
    focusField(w)
    await typeIn('2:30p')
    expect(w.find('[data-typed]').text()).toBe('2:30 PM')
    await key('Backspace')
    // The p is gone; the time reads on the 24-hour clock again, and says so.
    expect(w.find('[data-typed]').text()).toBe('2:30 AM')
  })

  it('p on a field with a time flips its half of the day', async () => {
    const w = picker({ modelValue: '10:30' }, withGrani())
    focusField(w)
    await key('p')
    expect(w.emitted('update:modelValue')).toEqual([['22:30']])
  })

  it('three digits that are no H:mm keep their hour: 183 reads 18:3_, and Backspace from 1830 goes back to it', async () => {
    const w = picker({ modelValue: null })
    focusField(w)
    await typeIn('183')
    expect(w.find('[data-typed]').text()).toBe('18:3_')
    await key('0')
    await key('Backspace')
    expect(w.find('[data-typed]').text()).toBe('18:3_')
  })

  it('a key the field ignores leaves a refused time marked invalid', async () => {
    const w = picker({ modelValue: null, min: '09:00', max: '18:00' })
    focusField(w)
    await typeIn('1830')
    await key('Enter')
    expect(button(w).attributes('aria-invalid')).toBe('true')
    await key('5')
    expect(w.find('[data-typed]').text()).toBe('18:30')
    expect(button(w).attributes('aria-invalid')).toBe('true')
  })

  it('a 12-hour field says the half of the day for a lone hour digit too', async () => {
    const w = picker({ modelValue: null }, withGrani())
    focusField(w)
    await typeIn('1')
    expect(w.find('[data-typed]').text()).toContain('AM')
    await key('p')
    expect(w.find('[data-typed]').text()).toContain('PM')
  })

  it('Backspace takes back a half of the day typed alone', async () => {
    const w = picker({ modelValue: null }, withGrani())
    focusField(w)
    await key('p')
    expect(w.find('[data-typed]').text()).toBe('PM')
    await key('Backspace')
    expect(w.find('[data-typed]').exists()).toBe(false)
  })

  it('p on a time whose afternoon the window shuts out moves nothing, and says so', async () => {
    const w = picker({ modelValue: '10:30', min: '09:00', max: '12:00' }, withGrani())
    focusField(w)
    await key('p')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await new Promise((r) => setTimeout(r, 200))
    expect(document.getElementById('ui-announcer')?.textContent).toBe(
      'Time outside the allowed range',
    )
  })

  it('while a time is typed the columns show it chosen, and Escape gives the time held back', async () => {
    const w = picker()
    const chosen = (rows: Element[]) =>
      rows.filter((r) => r.getAttribute('aria-selected') === 'true').map((r) => r.textContent)
    focusField(w)
    await typeIn('1437')
    expect(chosen(hourRows())).toEqual(['14'])
    // Off the step of 5, the typed 37 stands in its place in the column, chosen.
    expect(chosen(minuteRows())).toEqual(['37'])
    await key('Escape')
    await open(w)
    expect(chosen(hourRows())).toEqual(['10'])
    expect(chosen(minuteRows())).toEqual(['30'])
  })

  it('Enter on a time that does not exist takes nothing, says so and marks the field invalid', async () => {
    const w = picker()
    focusField(w)
    await typeIn('9:75')
    await key('Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(button(w).attributes('aria-invalid')).toBe('true')
    await new Promise((r) => setTimeout(r, 200))
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Это не время')
    // A key that changes the text clears the mark.
    await key('Backspace')
    expect(button(w).attributes('aria-invalid')).toBeUndefined()
  })
})

describe('UiTimePicker — a time with seconds', () => {
  // An API writes a time with its seconds (14:30:00): the field shows it to the minute, as it
  // shows any time, and a change sends HH:mm.
  it('14:30:00 shows as 14:30 and is no warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiTimePicker, {
      props: { modelValue: '14:30:00', ariaLabel: 'Start' },
      global: { plugins: withGrani(RUSSIAN) },
    })
    expect(button(w).text()).toContain('14:30')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })
})
