import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { h, nextTick } from 'vue'
import UiDatePicker from './UiDatePicker.vue'
import UiField from './UiField.vue'
import UiModal from './UiModal.vue'
import { addDays, today } from '../utils/calendar'
import { withGrani } from '../test/harness'

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
}
const mountPicker = (props: Record<string, unknown> = {}, plugins = withGrani()) =>
  mount(UiDatePicker, {
    global: { plugins },
    attachTo: document.body,
    props: {
      ariaLabel: 'Date',
      modelValue: '2026-09-24',
      'onUpdate:modelValue': (v: string | null): Promise<void> => w.setProps({ modelValue: v }),
      ...props,
    },
  })
let w: ReturnType<typeof mountPicker>

const button = () => document.body.querySelector<HTMLElement>('button[aria-haspopup="dialog"]')!
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
// Keys as a person types them, on whatever holds the focus: the field, then the calendar.
const typeIn = async (text: string) => {
  for (const k of text) {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    )
    await settle()
  }
}
const press = async (k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  document.activeElement!.dispatchEvent(e)
  await settle()
  return e
}

describe('UiDatePicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the day by the locale, or the placeholder when empty', async () => {
    w = mountPicker()
    expect(button().textContent).toContain('Thu, Sep 24')
    await w.setProps({ modelValue: '' })
    expect(button().textContent).toContain('Choose a date')
  })

  it('opens a calendar on the chosen day; a pick closes it and returns focus to the button', async () => {
    w = mountPicker()
    button().click()
    await settle()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Thursday, September 24, 2026')
    panel()!
      .querySelector<HTMLElement>('button[aria-label="Wednesday, September 30, 2026"]')!
      .click()
    await settle()
    expect(w.props('modelValue')).toBe('2026-09-30')
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('its calendar names the days of rest in bold', async () => {
    w = mountPicker()
    button().click()
    await settle()
    const rest = [...panel()!.querySelectorAll('th.font-bold')].map((th) => th.getAttribute('abbr'))
    expect(rest).toEqual(['Sunday', 'Saturday'])
  })

  it('the cross clears the day; a required field has no cross', async () => {
    w = mountPicker({ clearable: true })
    // Vue drops a click stamped in the same millisecond its listener was attached (the cross's
    // loading guard stamps it first): a click straight after the mount failed one run in six.
    await new Promise((r) => setTimeout(r, 2))
    w.find('button[aria-label="Clear the date"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await settle()
    expect(w.props('modelValue')).toBeNull()
    document.body.innerHTML = ''
    const f = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Date', required: true },
      slots: { default: () => h(UiDatePicker, { modelValue: '2026-09-24', clearable: true }) },
    })
    expect(f.find('button[aria-label="Clear the date"]').exists()).toBe(false)
    expect(f.find('button[aria-haspopup="dialog"]').attributes('aria-required')).toBe('true')
  })

  it('inside UiField the label points at the button and an error marks the capsule', () => {
    const f = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Paid on', error: 'Pick a day' },
      slots: { default: () => h(UiDatePicker, { modelValue: '' }) },
    })
    const b = f.find('button[aria-haspopup="dialog"]')
    expect(f.find('label').attributes('for')).toBe(b.attributes('id'))
    expect(b.attributes('aria-invalid')).toBe('true')
    expect(f.find('.ui-capsule').attributes('data-invalid')).toBe('true')
  })

  it('presets pick today and yesterday in one click; the field shows the day they set', async () => {
    w = mountPicker({ modelValue: '', presets: ['today', 'yesterday', 'weekAgo'] })
    const chip = (label: string) => w.findAll('button').find((b) => b.text().trim() === label)!
    await chip('Yesterday').trigger('click')
    expect(w.props('modelValue')).toBe(addDays(today(), -1))
    // A preset is an action, not a toggle: it holds no room for a check, so three stand on a line.
    for (const label of ['Today', 'Yesterday', 'A week ago']) {
      expect(chip(label).attributes('aria-pressed'), label).toBeUndefined()
      expect(chip(label).find('svg.lucide-check').exists()).toBe(false)
    }
  })

  it('a preset outside min and max is held', () => {
    w = mountPicker({
      modelValue: '',
      presets: ['today', 'yesterday', 'weekAgo'],
      max: '2000-01-01',
    })
    const chip = (label: string) => w.findAll('button').find((b) => b.text().trim() === label)!
    expect(chip('Today').attributes('disabled')).toBeDefined()
    expect(chip('Yesterday').attributes('disabled')).toBeDefined()
  })

  it('inside UiField the panel is named by the field label', async () => {
    const f = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Paid on' },
      slots: { default: () => h(UiDatePicker, { modelValue: '2026-09-24' }) },
    })
    f.find('button[aria-haspopup="dialog"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await settle()
    expect(
      document.getElementById(panel()!.getAttribute('aria-labelledby')!)!.textContent,
    ).toContain('Paid on')
  })

  it('disabled: the button does not open and there is no cross', async () => {
    w = mountPicker({ disabled: true })
    expect(button().hasAttribute('disabled')).toBe(true)
    expect(w.find('button[aria-label="Clear the date"]').exists()).toBe(false)
  })

  it('a picked day reaches the model and the form as that day, whatever the zone of the device or the app', async () => {
    for (const timeZone of [undefined, 'Pacific/Kiritimati', 'Pacific/Niue']) {
      w = mountPicker({ name: 'born' }, withGrani(timeZone ? { timeZone } : {}))
      button().click()
      await settle()
      panel()!
        .querySelector<HTMLElement>('button[aria-label^="Wednesday, September 30, 2026"]')!
        .click()
      await settle()
      expect(w.props('modelValue')).toBe('2026-09-30')
      expect(w.find('input[type="hidden"]').attributes('value')).toBe('2026-09-30')
      expect(button().textContent).toContain('Sep 30')
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('near the bottom of the window the calendar opens above the field; near the top, below it', async () => {
    const field = { left: 20, width: 280, height: 36 }
    let fieldTop = 0
    // The window is 700 tall; the field stands where the case puts it, the calendar is 330 tall.
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() =>
        DOMRect.fromRect({ x: field.left, y: fieldTop, width: field.width, height: field.height }),
      )
    const tall = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'dialog' ? 330 : field.height
      })
    const wide = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(280)
    const height = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(700)
    onTestFinished(() => [rect, tall, wide, height].forEach((m) => m.mockRestore()))
    for (const [top, side] of [
      [600, 'above'],
      [80, 'below'],
    ] as const) {
      fieldTop = top
      w = mountPicker()
      button().click()
      await settle()
      const panelTop = parseFloat(panel()!.style.top)
      if (side === 'above') expect(panelTop + 330).toBeLessThanOrEqual(top)
      else expect(panelTop).toBeGreaterThanOrEqual(top + field.height)
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('writes the year only when it is not this one, while the field stands as wide as a day with its year', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-21T10:00:00Z'), toFake: ['Date'] })
    onTestFinished(() => {
      vi.useRealTimers()
    })
    w = mountPicker({ modelValue: '2026-09-24' })
    const shownText = () =>
      document.body.querySelector('[role="combobox"] > span > span')!.textContent!.trim()
    expect(shownText()).toBe('Thu, Sep 24')
    await w.setProps({ modelValue: '1987-03-12' })
    expect(shownText()).toBe('Thu, Mar 12, 1987')
    expect(document.body.querySelector('[data-sizer]')!.textContent).toContain('2026')
  })

  it('name sends the day with a form', () => {
    w = mountPicker({ name: 'paid_on' })
    expect(w.find('input[type="hidden"]').attributes()).toMatchObject({
      name: 'paid_on',
      value: '2026-09-24',
    })
  })
})

describe('UiDatePicker — a typed day', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('digits typed on the field open the calendar on the day they read, and Enter takes it', async () => {
    w = mountPicker({ modelValue: null })
    button().focus()
    await typeIn('03/12/1987')
    expect(button().textContent).toContain('03/12/1987')
    expect(panel()).not.toBeNull()
    expect(
      panel()!.querySelector('[aria-selected="true"] button')!.getAttribute('aria-label'),
    ).toBe('Thursday, March 12, 1987')
    expect(w.props('modelValue')).toBeNull()
    const enter = await press('Enter')
    expect(enter.defaultPrevented).toBe(true)
    expect(w.props('modelValue')).toBe('1987-03-12')
    expect(panel()).toBeNull()
    expect(button().textContent).toContain('Thu, Mar 12, 1987')
  })

  it('reads the parts in the app’s language: day first in Russian', async () => {
    w = mountPicker({ modelValue: null }, withGrani({ locale: 'ru' }))
    button().focus()
    await typeIn('12.03.87')
    await press('Enter')
    expect(w.props('modelValue')).toBe('1987-03-12')
  })

  it('a day that does not exist is not taken, nor a day outside min and max', async () => {
    w = mountPicker({ modelValue: '2026-09-24', min: '2026-01-01' })
    button().focus()
    await typeIn('02/31/2026')
    await press('Enter')
    expect(w.props('modelValue')).toBe('2026-09-24')
    expect(button().textContent).toContain('02/31/2026')
    await press('Escape')
    expect(button().textContent).toContain('Thu, Sep 24')
    button().focus()
    await typeIn('12/31/2025')
    await press('Enter')
    expect(w.props('modelValue')).toBe('2026-09-24')
  })

  it('Backspace takes back a key, Escape drops what was typed, and a pick ends the typing', async () => {
    w = mountPicker({ modelValue: '2026-09-24' })
    button().focus()
    await typeIn('10/05')
    await press('Backspace')
    expect(button().textContent).toContain('10/0')
    await press('Escape')
    expect(panel()).toBeNull()
    expect(button().textContent).toContain('Thu, Sep 24')
    expect(w.props('modelValue')).toBe('2026-09-24')
    button().focus()
    await typeIn('10/05')
    panel()!.querySelector<HTMLElement>('button[aria-label="Wednesday, October 7, 2026"]')!.click()
    await settle()
    expect(w.props('modelValue')).toBe('2026-10-07')
    expect(button().textContent).toContain('Wed, Oct 7')
  })
})

describe('UiDatePicker — review follow-ups', () => {
  it('a press away takes a day typed as Enter would; Escape still drops it', async () => {
    w = mountPicker({ modelValue: '2026-09-24' })
    button().focus()
    await typeIn('10/07/2026')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(panel()).toBeNull()
    expect(w.props('modelValue')).toBe('2026-10-07')
    button().focus()
    await typeIn('10/08/2026')
    await press('Escape')
    expect(panel()).toBeNull()
    expect(w.props('modelValue')).toBe('2026-10-07')
    button().focus()
    await typeIn('02/31/2026')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(w.props('modelValue')).toBe('2026-10-07')
    document.body.innerHTML = ''
  })

  it('Backspace back to an empty text keeps the focus in the calendar', async () => {
    w = mountPicker({ modelValue: '2026-09-24' })
    button().focus()
    await typeIn('5')
    await press('Backspace')
    await new Promise((r) => setTimeout(r, 30))
    expect(panel()!.contains(document.activeElement)).toBe(true)
    document.body.innerHTML = ''
  })

  it.each([
    ['cs', '22. 11. 2026'],
    ['hu', '2026. 11. 22.'],
  ])('%s: a date typed with the marks its language puts in is read whole', async (locale, text) => {
    w = mountPicker({ modelValue: null }, withGrani({ locale }))
    button().focus()
    await typeIn(text)
    await press('Enter')
    expect(w.props('modelValue')).toBe('2026-11-22')
    document.body.innerHTML = ''
  })

  it('th-TH: the year is read in the calendar the field writes it in', async () => {
    w = mountPicker({ modelValue: '1987-03-12' }, withGrani({ locale: 'th-TH' }))
    button().focus()
    await typeIn('13/03/2530')
    await press('Enter')
    expect(w.props('modelValue')).toBe('1987-03-13')
    document.body.innerHTML = ''
  })

  it('fa-IR: a day of another calendar is not typed at all, never read as a Gregorian one', async () => {
    w = mountPicker({ modelValue: null }, withGrani({ locale: 'fa-IR' }))
    button().focus()
    await typeIn('1405/07/02')
    await press('Enter')
    expect(w.props('modelValue')).toBeNull()
    expect(panel()).toBeNull()
    document.body.innerHTML = ''
  })

  it('ar-SA: digits as an Arabic keyboard writes them are read', async () => {
    w = mountPicker({ modelValue: null }, withGrani({ locale: 'ar-SA' }))
    button().focus()
    await typeIn('٢٤/٠٩/٢٠٢٦')
    await press('Enter')
    expect(w.props('modelValue')).toBe('2026-09-24')
    document.body.innerHTML = ''
  })

  it('Enter on a day moved to with the arrows is the calendar’s, not the typed day’s', async () => {
    w = mountPicker({ modelValue: null })
    button().focus()
    await typeIn('12')
    await press('ArrowRight')
    await press('ArrowRight')
    const enter = await press('Enter')
    expect(enter.defaultPrevented).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    document.body.innerHTML = ''
  })

  it('a refused Enter says why to a reader', async () => {
    w = mountPicker({ modelValue: '2026-09-24' })
    button().focus()
    await typeIn('02/31/2026')
    const enter = await press('Enter')
    expect(enter.defaultPrevented).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await new Promise((r) => setTimeout(r, 200))
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Not a date')
    document.body.innerHTML = ''
  })

  it('a typed day without its year takes the year of the day it is typed on', async () => {
    vi.useFakeTimers({ now: new Date('2026-12-31T23:59:30Z'), toFake: ['Date'] })
    onTestFinished(() => {
      vi.useRealTimers()
    })
    w = mountPicker({ modelValue: '2026-12-31' }, withGrani({ locale: 'ru', timeZone: 'UTC' }))
    await settle()
    vi.setSystemTime(new Date('2027-01-01T00:00:30Z'))
    button().focus()
    for (const k of '12.03') {
      vi.setSystemTime(Date.now() + 5)
      await press(k)
    }
    await press('Enter')
    expect(w.props('modelValue')).toBe('2027-03-12')
    document.body.innerHTML = ''
  })

  it('an unknown preset id is skipped and warned about, not thrown at the render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    onTestFinished(() => warn.mockRestore())
    expect(() =>
      mountPicker({ modelValue: '', presets: ['nextMonth' as never, 'today'] }),
    ).not.toThrow()
    expect(document.body.querySelectorAll('[role="group"] button')).toHaveLength(1)
    expect(warn).toHaveBeenCalled()
    document.body.innerHTML = ''
  })

  it('the field takes the focus from its owner', () => {
    w = mountPicker()
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(button())
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('the trigger is a combobox: the date is its value and required is announced', () => {
    const f = mount(UiField, {
      attachTo: document.body,
      props: { label: 'Paid on', required: true },
      slots: { default: () => h(UiDatePicker, { modelValue: '2026-09-24' }) },
    })
    const b = f.find('[aria-haspopup="dialog"]')
    expect(b.attributes('role')).toBe('combobox')
    expect(b.attributes('aria-required')).toBe('true')
    expect(b.text()).toContain('Sep 24')
    // The capsule owns the ring: its rules match a combobox inside.
    expect(f.find('.ui-capsule').element.querySelector('[role="combobox"]')).not.toBeNull()
    f.unmount()
  })

  it('ArrowDown opens the calendar', async () => {
    w = mountPicker()
    await settle()
    button().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(panel()).not.toBeNull()
  })

  it('the cross clears and leaves focus on the trigger; at xs it fits inside the capsule', async () => {
    w = mountPicker({ size: 'xs', clearable: true })
    const cross = document.body.querySelector<HTMLElement>('[aria-label="Clear the date"]')!
    expect(cross.className).toContain('!h-6')
    await new Promise((r) => setTimeout(r, 2))
    cross.click()
    await settle()
    expect(w.props('modelValue')).toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('disabling closes an open calendar', async () => {
    w = mountPicker()
    await new Promise((r) => setTimeout(r, 2))
    button().click()
    await settle()
    expect(panel()).not.toBeNull()
    await w.setProps({ disabled: true })
    await settle()
    expect(panel()).toBeNull()
  })

  it('disabling while the calendar has the focus keeps it on the field, not on the body', async () => {
    w = mountPicker()
    await new Promise((r) => setTimeout(r, 2))
    button().click()
    await settle()
    expect(panel()?.contains(document.activeElement)).toBe(true)
    await w.setProps({ disabled: true })
    await settle()
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement?.classList.contains('ui-capsule')).toBe(true)
  })

  it('a disabled picker sends nothing with a form', () => {
    w = mountPicker({ name: 'paid', disabled: true })
    expect((document.body.querySelector('input[name="paid"]') as HTMLInputElement).disabled).toBe(
      true,
    )
  })

  it('presets follow midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T23:59:30Z'))
    // Restored even when an assertion fails, so the next tests run on the real clock.
    onTestFinished(() => {
      vi.useRealTimers()
    })
    w = mountPicker(
      { modelValue: '', presets: ['today', 'yesterday', 'weekAgo'] },
      withGrani({ timeZone: 'UTC' }),
    )
    const todayBtn = () =>
      Array.from(document.body.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Today'),
      )!
    await nextTick()
    // Fake timers freeze the clock: step past the millisecond the listeners were attached in.
    vi.advanceTimersByTime(5)
    todayBtn().click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['2026-09-24'])
    vi.setSystemTime(new Date('2026-09-25T00:00:30Z'))
    vi.advanceTimersByTime(61_000)
    await nextTick()
    todayBtn().click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['2026-09-25'])
  })

  it('a list of ids gives those presets in its order, 8 under the capsule', async () => {
    w = mountPicker({ modelValue: '', presets: ['today', 'yesterday', 'weekAgo'] })
    const group = document.body.querySelector<HTMLElement>('[role="group"]')!
    expect([...group.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual([
      'Today',
      'Yesterday',
      'A week ago',
    ])
    expect(group.parentElement!.className).toContain('gap-2')
    expect(group.previousElementSibling!.classList.contains('ui-capsule')).toBe(true)
    await new Promise((r) => setTimeout(r, 2))
    ;[...group.querySelectorAll<HTMLElement>('button')][2]!.click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([addDays(today(), -7)])
  })

  it('a value that is no day shows empty, has no cross, sends an empty value, and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    w = mountPicker({ modelValue: '2026-13-40', name: 'paid' })
    expect(button().textContent).toContain('Choose a date')
    expect(document.body.querySelector('[aria-label="Clear the date"]')).toBeNull()
    expect((document.body.querySelector('input[name="paid"]') as HTMLInputElement).value).toBe('')
    expect(warn.mock.calls.some(([m]) => String(m).includes('is not a day'))).toBe(true)
    warn.mockRestore()
  })

  it('a day outside min and max is kept and reads invalid', () => {
    w = mountPicker({ modelValue: '2026-09-05', min: '2026-09-10', name: 'due' })
    expect(button().textContent).toContain('Sep 5')
    expect(button().getAttribute('aria-invalid')).toBe('true')
    expect(document.body.querySelector('.ui-capsule')!.getAttribute('data-invalid')).toBe('true')
    expect((document.body.querySelector('input[name="due"]') as HTMLInputElement).value).toBe(
      '2026-09-05',
    )
  })

  it('an end bound to its start keeps its day and reads invalid once the start moves past it', async () => {
    w = mountPicker({ modelValue: '2026-09-20', min: '2026-09-10', name: 'to' })
    expect(button().getAttribute('aria-invalid')).toBeNull()
    await w.setProps({ min: '2026-09-25' })
    expect(w.props('modelValue')).toBe('2026-09-20')
    expect(button().getAttribute('aria-invalid')).toBe('true')
    expect((document.body.querySelector('input[name="to"]') as HTMLInputElement).value).toBe(
      '2026-09-20',
    )
    button().click()
    await settle()
    const state = (label: string) =>
      panel()!.querySelector(`button[aria-label^="${label}"]`)!.getAttribute('aria-disabled')
    expect(state('Thursday, September 24, 2026')).toBe('true')
    expect(state('Friday, September 25, 2026')).toBeNull()
  })

  it('presets true gives the seven default days, in order', () => {
    w = mountPicker({ presets: true })
    const group = document.body.querySelector<HTMLElement>('[role="group"]')!
    expect(group.getAttribute('aria-label')).toBe('Quick dates')
    expect([...group.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual([
      'Today',
      'Yesterday',
      'A week ago',
      'Tomorrow',
      'In 3 days',
      'In a week',
      'In 2 weeks',
    ])
  })

  it("an app's own preset is its words and its days from today; one outside min and max is disabled", async () => {
    w = mountPicker({
      presets: ['tomorrow', { label: 'In 30 days', days: 30 }],
      max: addDays(today(), 7),
    })
    const chips = [...document.body.querySelectorAll<HTMLButtonElement>('[role="group"] button')]
    expect(chips.map((b) => [b.textContent?.trim(), b.disabled])).toEqual([
      ['Tomorrow', false],
      ['In 30 days', true],
    ])
    await new Promise((r) => setTimeout(r, 2))
    chips[0]!.click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([addDays(today(), 1)])
  })

  it('the cross sends null, and null reads as no day', async () => {
    w = mountPicker({ modelValue: '2026-09-24', clearable: true })
    await new Promise((r) => setTimeout(r, 2))
    document.body.querySelector<HTMLElement>('[aria-label="Clear the date"]')!.click()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
    await nextTick()
    expect(button().textContent).toContain('Choose a date')
  })
})

describe('UiDatePicker — its width', () => {
  const sizers = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-sizer]'))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('the field stands over the widest date and keeps the place of the cross, so a pick keeps its width', async () => {
    w = mountPicker({ modelValue: '', clearable: true })
    const [date, placeholder] = sizers().filter((el) => el.textContent?.trim())
    // The date stands over every weekday and every month the locale writes, part by part.
    for (const name of [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Jan',
      'May',
      'Sep',
      'Dec',
    ])
      expect(date!.textContent).toContain(name)
    expect(date!.textContent).toContain('28, 2026')
    expect(placeholder!.textContent?.trim()).toBe('Choose a date')
    for (const el of sizers()) expect(el.getAttribute('aria-hidden')).toBe('true')
    // No day: the place of the cross is held by an empty box of its size.
    expect(sizers().some((el) => !el.textContent?.trim() && el.classList.contains('w-7'))).toBe(
      true,
    )
    await w.setProps({ modelValue: '2026-09-24' })
    expect(document.body.querySelector('button[aria-label="Clear the date"]')).not.toBeNull()
    expect(sizers().some((el) => !el.textContent?.trim())).toBe(false)
  })

  it('a required field keeps no place for a cross it never shows', () => {
    mount(UiField, {
      attachTo: document.body,
      props: { label: 'Due', required: true },
      slots: { default: () => h(UiDatePicker, { modelValue: '', clearable: true }) },
    })
    expect(sizers().filter((el) => !el.textContent?.trim())).toHaveLength(0)
  })

  it("disabling keeps the width: the cross's place stays", async () => {
    w = mountPicker({ clearable: true })
    expect(document.body.querySelector('[aria-label="Clear the date"]')).not.toBeNull()
    await w.setProps({ disabled: true })
    expect(document.body.querySelector('[aria-label="Clear the date"]')).toBeNull()
    expect(sizers().some((el) => !el.textContent?.trim() && el.classList.contains('w-7'))).toBe(
      true,
    )
  })
})

describe('UiDatePicker — review follow-ups, second pass', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("presets follow the calendar's window: backwards bounds are one window, a malformed bound is none", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    w = mountPicker({
      modelValue: '',
      presets: ['today', 'yesterday', 'weekAgo'],
      min: addDays(today(), 3),
      max: addDays(today(), -10),
    })
    const chips = () =>
      [...document.body.querySelectorAll<HTMLButtonElement>('[role="group"] button')].map(
        (b) => b.disabled,
      )
    expect(chips()).toEqual([false, false, false])
    await w.setProps({ min: 'garbage', max: '' })
    expect(chips()).toEqual([false, false, false])
    warn.mockRestore()
  })

  it('the cross is opt-in with clearable, and a standalone required has no cross and says aria-required', async () => {
    w = mountPicker()
    expect(document.body.querySelector('[aria-label="Clear the date"]')).toBeNull()
    expect(document.body.querySelector('[data-sizer].w-7')).toBeNull()
    await w.setProps({ clearable: true, required: true })
    expect(document.body.querySelector('[aria-label="Clear the date"]')).toBeNull()
    expect(button().getAttribute('aria-required')).toBe('true')
  })

  it('presets stay under the field inside a flex row', () => {
    w = mountPicker({ presets: ['today', 'yesterday', 'weekAgo'] })
    const root = w.element as HTMLElement
    expect(root.classList.contains('flex-col')).toBe(true)
    expect(root.querySelector('.ui-capsule')).not.toBeNull()
    expect(root.querySelector('[role="group"]')).not.toBeNull()
  })

  it('a malformed or backwards bound warns in dev before the panel opens', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    w = mountPicker({ min: '2026-9-1' })
    expect(warn.mock.calls.some(([m]) => String(m).includes('min is not a YYYY-MM-DD day'))).toBe(
      true,
    )
    expect(warn.mock.calls.some(([m]) => String(m).includes('2026-9-1'))).toBe(false)
    warn.mockClear()
    w.unmount()
    w = mountPicker({ min: '2026-10-01', max: '2026-09-01' })
    expect(warn.mock.calls.some(([m]) => String(m).includes('min is after max'))).toBe(true)
    warn.mockRestore()
  })

  it('a picker without presets keeps no timer', () => {
    const spy = vi.spyOn(globalThis, 'setInterval')
    try {
      w = mountPicker()
      expect(spy).not.toHaveBeenCalled()
      w.unmount()
      w = mountPicker({ presets: ['today', 'yesterday', 'weekAgo'] })
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('with no value and today outside the window it opens on the nearest day', async () => {
    w = mountPicker({ modelValue: '', max: '2008-09-30' })
    button().click()
    await settle()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Tuesday, September 30, 2008')
  })

  it('Escape in an open calendar inside a modal closes the calendar only', async () => {
    const m = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Edit invoice', open: true },
      slots: { default: () => h(UiDatePicker, { modelValue: '2026-09-24', ariaLabel: 'Due by' }) },
    })
    await settle()
    button().click()
    await settle()
    expect(document.body.querySelector('[role="grid"]')).not.toBeNull()
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await settle()
    expect(document.body.querySelector('[role="grid"]')).toBeNull()
    expect(m.props('open')).toBe(true)
    expect(document.body.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull()
    expect(document.activeElement).toBe(button())
  })

  it('a click away from the calendar inside a modal closes the calendar and keeps the modal', async () => {
    const m = mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Edit invoice', open: true },
      slots: {
        default: () => [
          h(UiDatePicker, { modelValue: '2026-09-24', ariaLabel: 'Due by' }),
          h('p', { class: 'away' }, 'Notes'),
        ],
      },
    })
    await settle()
    button().click()
    await settle()
    expect(document.body.querySelector('[role="grid"]')).not.toBeNull()
    document.body.querySelector('.away')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(document.body.querySelector('[role="grid"]')).toBeNull()
    expect(m.props('open')).toBe(true)
  })

  it('a clear with the calendar open closes it and leaves the focus on the field', async () => {
    w = mountPicker({ clearable: true })
    button().click()
    await settle()
    expect(document.body.querySelector('[role="grid"]')).not.toBeNull()
    document.body.querySelector<HTMLElement>('[aria-label="Clear the date"]')!.click()
    await settle()
    expect(w.props('modelValue')).toBeNull()
    expect(document.body.querySelector('[role="grid"]')).toBeNull()
    expect(document.activeElement).toBe(button())
  })
})

describe('UiDatePicker — review follow-ups, in a group', () => {
  it('without presets the capsule is the root and takes class and style', () => {
    const w = mount(UiDatePicker, {
      props: { ariaLabel: 'Due' },
      attrs: { class: 'w-48', style: 'margin-top: 4px' },
    })
    expect(w.element.classList).toContain('ui-capsule')
    expect(w.classes()).toContain('w-48')
    expect(w.attributes('style')).toContain('margin-top: 4px')
  })

  it('with presets a column holds the capsule and the presets, and takes class and style', () => {
    const w = mount(UiDatePicker, {
      props: { ariaLabel: 'Due', presets: ['today', 'yesterday', 'weekAgo'] },
      attrs: { class: 'w-48' },
    })
    expect(w.element.classList).not.toContain('ui-capsule')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-col', 'w-48']))
    expect(w.find('.ui-capsule').classes()).not.toContain('w-48')
    expect(w.find('[role=group]').exists()).toBe(true)
  })
})

// A chord with Alt, Ctrl or Meta is the browser's: Alt with ← goes back a page, Ctrl or ⌘ moves a
// caret or scrolls. The component takes the key only alone.
const chord = (el: Element, key: string, mods: Partial<KeyboardEventInit>) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  el.dispatchEvent(e)
  return e
}

describe('UiDatePicker — a chord is the browser’s', () => {
  it('ArrowDown and Alt with ArrowDown open the calendar; Ctrl or Meta leave the key', async () => {
    w = mountPicker()
    const e = chord(button(), 'ArrowDown', { ctrlKey: true })
    await nextTick()
    expect(e.defaultPrevented).toBe(false)
    expect(button().getAttribute('aria-expanded')).toBe('false')
    chord(button(), 'ArrowDown', { altKey: true })
    await nextTick()
    expect(button().getAttribute('aria-expanded')).toBe('true')
  })
})

describe('UiDatePicker — review follow-ups, third pass', () => {
  const cross = () =>
    document.body.querySelector<HTMLElement>('button[aria-label="Clear the date"]')!

  it('the cross clears even while a day is typed', async () => {
    w = mountPicker({ clearable: true })
    button().focus()
    await typeIn('10/05/2026')
    cross().click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([[null]])
  })

  it('a press on a preset while a day is typed sends the preset alone', async () => {
    w = mountPicker({ presets: ['today'] })
    button().focus()
    await typeIn('10/05/2026')
    const preset = document.body.querySelector<HTMLElement>('[role="group"] button')!
    preset.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await settle()
    preset.click()
    await settle()
    expect(w.emitted('update:modelValue')).toEqual([[today()]])
  })

  it('Escape drops a typed day when the focus is on the panel itself', async () => {
    w = mountPicker()
    button().focus()
    await typeIn('10/05/2026')
    panel()!.focus()
    await press('Escape')
    expect(panel()).toBeNull()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('Enter takes the typed day in a field that stands in a table cell', async () => {
    w = mount(
      {
        render: () =>
          h('table', [
            h('tbody', [
              h('tr', [
                h('td', [
                  h(UiDatePicker, {
                    ariaLabel: 'Due',
                    modelValue: '2026-09-24',
                    'onUpdate:modelValue': () => {},
                  }),
                ]),
              ]),
            ]),
          ]),
      },
      { global: { plugins: withGrani() }, attachTo: document.body },
    ) as unknown as typeof w
    button().focus()
    button().dispatchEvent(
      new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true }),
    )
    await settle()
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    button().dispatchEvent(e)
    await settle()
    expect(e.defaultPrevented).toBe(true)
  })

  it('a press away from a text that reads no day says so', async () => {
    w = mountPicker()
    button().focus()
    await typeIn('02/31/2026')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    await new Promise((r) => setTimeout(r, 200))
    expect(document.getElementById('ui-announcer')?.textContent).toBe('Not a date')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('a text taken back to nothing returns the focus to the day the calendar shows', async () => {
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-10-21T12:00:00'))
    onTestFinished(() => {
      vi.useRealTimers()
    })
    // In Russian a lone 5 is the 5th of this month: the calendar stays on October.
    w = mountPicker({ modelValue: '2026-10-24' }, withGrani({ locale: 'ru' }))
    button().focus()
    await typeIn('5')
    await press('Backspace')
    await new Promise((r) => setTimeout(r, 50))
    expect(document.activeElement).toBe(panel()!.querySelector('tbody button[tabindex="0"]'))
  })

  it('a comma from the number pad parts a day as a dot does', async () => {
    w = mountPicker({ modelValue: null }, withGrani({ locale: 'ru' }))
    button().focus()
    await typeIn('5,10,2026')
    await press('Enter')
    expect(w.emitted('update:modelValue')).toEqual([['2026-10-05']])
  })
})

describe('UiDatePicker — a press away takes a day written in full', () => {
  const away = async () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
  }
  const heard = async () => {
    await new Promise((r) => setTimeout(r, 200))
    return document.getElementById('ui-announcer')?.textContent
  }

  it('a stray digit or a year half typed is dropped on a press away, and said', async () => {
    w = mountPicker()
    button().focus()
    await typeIn('1')
    await away()
    expect(await heard()).toBe('Date not kept: type it in full')
    button().focus()
    await typeIn('03/12/19')
    await away()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.props('modelValue')).toBe('2026-09-24')
  })

  it('a day written in full is taken on a press away, with its marks or as eight digits', async () => {
    w = mountPicker()
    button().focus()
    await typeIn('3/12/1987')
    await away()
    expect(w.props('modelValue')).toBe('1987-03-12')
    button().focus()
    await typeIn('12031987')
    await away()
    expect(w.props('modelValue')).toBe('1987-12-03')
  })

  it('Enter still takes the short forms', async () => {
    w = mountPicker()
    button().focus()
    await typeIn('03/12/19')
    await press('Enter')
    expect(w.props('modelValue')).toBe('2019-03-12')
  })
})

describe('UiDatePicker — a refused day is seen', () => {
  it('Enter on a day that is refused marks the field invalid until the text changes', async () => {
    w = mountPicker({ min: '2026-09-01', max: '2026-09-30' })
    button().focus()
    await typeIn('10/05/2026')
    await press('Enter')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(button().getAttribute('aria-invalid')).toBe('true')
    await press('Backspace')
    expect(button().getAttribute('aria-invalid')).toBeNull()
    document.body.innerHTML = ''
  })
})

describe('UiDatePicker — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // A preset from a config: a number of days that no day lies at is skipped and said in
  // development, as an unknown id is, and the presets beside it stay.
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['1e9, past the last day a date can hold', 1e9],
    ['1e7, a year the day format cannot write', 1e7],
  ])('a preset of %s days is skipped and warned about, not thrown at the render', (_, days) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    onTestFinished(() => warn.mockRestore())
    expect(() =>
      mountPicker({
        modelValue: '',
        presets: [{ label: 'Soon', days }, 'today'],
      }),
    ).not.toThrow()
    const chips = [...document.body.querySelectorAll('[role="group"] button')]
    expect(chips.map((b) => b.textContent?.trim())).toEqual(['Today'])
    expect(warn).toHaveBeenCalled()
  })
})
