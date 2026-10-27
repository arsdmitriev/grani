import { config, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, watch } from 'vue'
import { tabbables, useFocusTrap } from './useFocusTrap'
import UiCrudDrawer from '../components/UiCrudDrawer.vue'
import UiMenu from '../components/UiMenu.vue'
import UiModal from '../components/UiModal.vue'
import UiPopover from '../components/UiPopover.vue'
import UiSelect from '../components/UiSelect.vue'
import UiListItem from '../components/UiListItem.vue'
import type { SelectValue } from '../types/ui'

const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
}

const Host = defineComponent({
  props: { top: { type: Boolean, default: true } },
  setup(props) {
    const active = ref(true)
    const box = ref<HTMLElement | null>(null)
    useFocusTrap({ active, container: box, isTop: () => props.top })
    return () =>
      h('div', { ref: box, tabindex: -1 }, [
        h('button', { class: 'close' }, 'Close'),
        h('input', { class: 'first' }),
        h('input', { class: 'hidden', hidden: true }),
        h('button', { class: 'last' }, 'Save'),
      ])
  },
})

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens on the first field, not the first button', async () => {
    mount(Host, { attachTo: document.body })
    await settle()
    expect(document.activeElement?.className).toBe('first')
  })

  it('a hidden element is not a stop on the way round', () => {
    const root = document.createElement('div')
    root.innerHTML = '<button>a</button><input hidden><div hidden><button>b</button></div><input>'
    document.body.appendChild(root)
    expect(tabbables(root).map((e) => e.tagName)).toEqual(['BUTTON', 'INPUT'])
  })

  it('focus that strays outside while the host is on top comes back where it was, not to the close', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    mount(Host, { attachTo: document.body })
    await settle()
    expect(document.activeElement?.className).toBe('first')
    outside.focus()
    expect(document.activeElement?.className).toBe('first')
  })

  it('focus that a Tab carried outside (a teleported menu closed on Tab) goes round to the first element', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    mount(Host, { attachTo: document.body })
    await settle()
    outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    outside.focus()
    expect(document.activeElement?.className).toBe('close')
  })

  it('while another library is on top (a menu opened from inside), focus may leave', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    mount(Host, { attachTo: document.body, props: { top: false } })
    await settle()
    outside.focus()
    expect(document.activeElement).toBe(outside)
  })

  it('focus dropped to the page (a focused control disabled or removed) comes back to the container', async () => {
    mount(Host, { attachTo: document.body })
    await settle()
    const last = document.body.querySelector<HTMLButtonElement>('.last')!
    last.focus()
    const box = last.parentElement!
    // What a browser does when the focused control goes away: focusout with no target, then the body.
    box.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    last.remove()
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement).toBe(box)
  })
})

describe('useFocusTrap — a dropped focus', () => {
  it('lands where the container opens (its initial control), not on the container', async () => {
    const Opened = defineComponent({
      setup() {
        const active = ref(true)
        const box = ref<HTMLElement | null>(null)
        useFocusTrap({
          active,
          container: box,
          initial: () => box.value?.querySelector<HTMLElement>('[role=listbox]'),
        })
        return () =>
          h('div', { ref: box, tabindex: -1 }, [
            h('ul', { role: 'listbox', tabindex: 0 }),
            h('button', { class: 'reset' }, 'Reset'),
          ])
      },
    })
    mount(Opened, { attachTo: document.body })
    await settle()
    const reset = document.body.querySelector<HTMLButtonElement>('.reset')!
    reset.focus()
    const box = reset.parentElement!
    box.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    // What a browser does when the focused control turns disabled: the focus falls to the body.
    reset.blur()
    reset.disabled = true
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement?.getAttribute('role')).toBe('listbox')
  })
})

describe('useFocusTrap — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a container still hidden for its position takes the focus once it is shown', async () => {
    // A browser refuses the focus while `visibility: hidden`; jsdom does not, so the first try is refused by hand.
    const focus = HTMLElement.prototype.focus
    let refused = false
    HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
      if (!refused && this.classList.contains('first')) {
        refused = true
        return
      }
      focus.call(this, options)
    }
    try {
      mount(Host, { attachTo: document.body })
      await settle()
      expect(refused).toBe(true)
      expect(document.activeElement?.className).not.toBe('first')
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      expect(document.activeElement?.className).toBe('first')
    } finally {
      HTMLElement.prototype.focus = focus
    }
  })
})

describe('useFocusTrap — a focus moved by code is not the person', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // A menu's item opens the container, and the menu, closing in the same update, hands the focus
  // back to its button after the trap has noted where the focus was and before it gives it.
  const Opened = defineComponent({
    props: { top: { type: Boolean, default: true }, handBack: Boolean },
    setup(props, { expose }) {
      const active = ref(false)
      const box = ref<HTMLElement | null>(null)
      const trigger = ref<HTMLElement | null>(null)
      useFocusTrap({ active, container: box, isTop: () => props.top })
      watch(active, (on) => on && props.handBack && trigger.value?.focus(), { flush: 'post' })
      expose({ active })
      return () =>
        h('div', [
          h('button', { ref: trigger, class: 'trigger' }, 'Actions'),
          h('button', { class: 'item' }, 'Edit'),
          h('div', { ref: box, tabindex: -1 }, [h('input', { class: 'first' })]),
        ])
    },
  })

  // Firefox: Enter on a menu item opens the drawer, and the menu, closing in the same task, hands
  // the focus to its button before the drawer gives it to its field. Nobody pressed anything: the
  // drawer takes the focus.
  it('a focus code moves out between the opening and the first try is taken back', async () => {
    const w = mount(Opened, { attachTo: document.body, props: { handBack: true } })
    document.querySelector<HTMLElement>('.item')!.focus()
    ;(w.vm as unknown as { active: boolean }).active = true
    await settle()
    expect(document.activeElement?.className).toBe('first')
  })

  // While the panel waits for its position, a person who presses elsewhere keeps that focus.
  it('a focus the person moves elsewhere while the container waits is left where they put it', async () => {
    const focus = HTMLElement.prototype.focus
    let refused = false
    HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
      if (!refused && this.classList.contains('first')) {
        refused = true
        return
      }
      focus.call(this, options)
    }
    try {
      const w = mount(Opened, { attachTo: document.body, props: { top: false } })
      document.querySelector<HTMLElement>('.item')!.focus()
      ;(w.vm as unknown as { active: boolean }).active = true
      await settle()
      expect(refused).toBe(true)
      const trigger = document.querySelector<HTMLElement>('.trigger')!
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      trigger.focus()
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      expect(document.activeElement).toBe(trigger)
    } finally {
      HTMLElement.prototype.focus = focus
    }
  })
})

describe('useFocusTrap — a file input', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a file input is not the first field', async () => {
    mount(
      defineComponent({
        setup() {
          const active = ref(true)
          const box = ref<HTMLElement | null>(null)
          useFocusTrap({ active, container: box })
          return () =>
            h('div', { ref: box, tabindex: -1 }, [
              h('input', { type: 'file', class: 'sr-only', tabindex: -1 }),
              h('input', { class: 'title' }),
            ])
        },
      }),
      { attachTo: document.body },
    )
    await settle()
    expect(document.activeElement?.className).toBe('title')
  })
})

describe('useFocusTrap — the opener left the page', () => {
  // Real transitions and teleports, as in a browser: the menu's panel leaves through its
  // transition, after the drawer has opened.
  const stubs = config.global.stubs
  beforeEach(() => (config.global.stubs = {}))
  afterEach(() => {
    config.global.stubs = stubs
    document.body.innerHTML = ''
  })

  const press = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  // A leave transition ends two frames later.
  const wait = async () => {
    for (let i = 0; i < 4; i++) await nextTick()
    await new Promise((r) => setTimeout(r, 60))
  }

  it('a drawer opened from a menu item gives the focus back to the menu button', async () => {
    const editing = ref(false)
    mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h('div', { class: 'row' }, [
              h(
                UiMenu,
                {},
                {
                  trigger: () => h('button', { class: 'row-actions' }, 'Actions'),
                  default: () => [
                    h(UiListItem, {
                      as: 'button',
                      title: 'Edit',
                      onClick: () => (editing.value = true),
                    }),
                  ],
                },
              ),
            ]),
            h(
              UiCrudDrawer,
              {
                title: 'Santa',
                open: editing.value,
                'onUpdate:open': (v: boolean) => (editing.value = v),
              },
              { default: () => h('input', { class: 'name' }) },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const trigger = document.querySelector<HTMLElement>('.row-actions')!
    trigger.focus()
    // Enter on a button is a click with no pointer: the menu opens on its first item.
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await wait()
    const edit = document.querySelector<HTMLElement>('[role="menuitem"]')!
    expect(document.activeElement).toBe(edit)
    edit.click()
    await wait()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement?.className).toBe('name')
    press(document.activeElement!, 'Escape')
    await wait()
    expect(editing.value).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('a drawer opened from a menu item keeps its first field when the menu gives the focus back late', async () => {
    // A browser runs the microtasks between the item's click listener and the panel's: the
    // drawer opens and focuses its field before the panel's click closes the menu and hands
    // the focus back to the menu button. happy-dom runs both listeners in one go, so the
    // drawer is opened first here, then the click reaches the panel.
    const editing = ref(false)
    mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(
              UiMenu,
              {},
              {
                trigger: () => h('button', { class: 'row-actions' }, 'Actions'),
                default: () => [
                  h(UiListItem, {
                    as: 'button',
                    title: 'Edit',
                    onClick: () => (editing.value = true),
                  }),
                ],
              },
            ),
            h(
              UiCrudDrawer,
              {
                title: 'Santa',
                open: editing.value,
                index: 0,
                total: 2,
                'onUpdate:open': (v: boolean) => (editing.value = v),
              },
              { default: () => h('input', { class: 'name' }) },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const trigger = document.querySelector<HTMLElement>('.row-actions')!
    trigger.focus()
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await wait()
    const edit = document.querySelector<HTMLElement>('[role="menuitem"]')!
    editing.value = true
    await wait()
    expect(document.activeElement?.className).toBe('name')
    edit.click()
    await wait()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement?.className).toBe('name')
    press(document.activeElement!, 'Escape')
    await wait()
    expect(document.activeElement).toBe(trigger)
  })

  it('a modal opened from a select option gives the focus back to the select', async () => {
    const asking = ref(false)
    const value = ref<SelectValue | null>(null)
    mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(UiSelect, {
              modelValue: value.value,
              items: [
                { value: 'nl', label: 'Netherlands' },
                { value: 'be', label: 'Belgium' },
              ],
              ariaLabel: 'Country',
              'onUpdate:modelValue': (v: SelectValue | SelectValue[] | null) => {
                value.value = v as SelectValue | null
                asking.value = true
              },
            }),
            h(
              UiModal,
              {
                title: 'Move the client',
                open: asking.value,
                'onUpdate:open': (v: boolean) => (asking.value = v),
              },
              { default: () => h('input', { class: 'reason' }) },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const combo = document.querySelector<HTMLElement>('[role="combobox"]')!
    combo.focus()
    combo.click()
    await wait()
    document.querySelectorAll<HTMLElement>('[role="option"]')[1]!.click()
    await wait()
    expect(document.activeElement?.className).toBe('reason')
    press(document.activeElement!, 'Escape')
    await wait()
    expect(asking.value).toBe(false)
    expect(document.activeElement).toBe(combo)
  })

  it('a popover inside a drawer closes to its button, then the drawer to its opener', async () => {
    const open = ref(false)
    mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h('button', { class: 'opener', onClick: () => (open.value = true) }, 'Edit'),
            h(
              UiCrudDrawer,
              {
                title: 'Santa',
                open: open.value,
                'onUpdate:open': (v: boolean) => (open.value = v),
              },
              {
                default: () => [
                  h('input', { class: 'name' }),
                  h(UiPopover, null, {
                    trigger: () => h('button', { class: 'filter' }, 'Filter'),
                    default: () => h('input', { class: 'inner' }),
                  }),
                ],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    )
    const opener = document.querySelector<HTMLElement>('.opener')!
    opener.focus()
    opener.click()
    await wait()
    const filter = document.querySelector<HTMLElement>('.filter')!
    filter.focus()
    filter.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await wait()
    expect(document.activeElement?.className).toBe('inner')
    press(document.activeElement!, 'Escape')
    await wait()
    expect(document.querySelector('.inner')).toBeNull()
    expect(document.activeElement).toBe(filter)
    press(filter, 'Escape')
    await wait()
    expect(open.value).toBe(false)
    expect(document.activeElement).toBe(opener)
  })
})
