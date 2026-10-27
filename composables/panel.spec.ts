import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, inject, nextTick, ref, type Ref } from 'vue'
import { PANEL, usePanel, type PanelContext, type PanelStart } from './panel'

const settle = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((r) => setTimeout(r))
}
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const press = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
const panel = () => document.body.querySelector<HTMLElement>('[id^="ui-popover-"][tabindex]')
const button = () => document.body.querySelector<HTMLElement>('.trigger')!

// A host on the core alone: its button, its panel with one field, and what the panel hands down.
const host = (menu: boolean, start = false) => {
  const open = ref(start)
  const shown: PanelStart[] = []
  let handed: PanelContext | null = null
  let closer: ((back?: boolean) => void) | null = null
  const Inside = defineComponent({
    setup() {
      handed = inject(PANEL, null)
      return () => h('input', { class: 'inner' })
    },
  })
  mount(
    defineComponent({
      setup() {
        const { Trigger, Panel, close } = usePanel({
          open,
          menu,
          trigger: () => [h('button', { class: 'trigger' }, 'Open')],
          align: () => 'start',
          onShown: (at) => shown.push(at),
        })
        closer = close
        return () => [h(Trigger), h(Panel, null, () => h(Inside))]
      },
    }),
    { attachTo: document.body },
  )
  return {
    open,
    shown,
    handed: () => handed as PanelContext | null,
    close: (back?: boolean) => closer!(back),
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the panel core', () => {
  it('says where the keyboard asked to start once the panel is placed, not on a clock', async () => {
    const { shown } = host(true)
    button().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    expect(shown).toEqual([])
    await settle()
    expect(panel()!.style.visibility).toBe('')
    expect(shown).toEqual(['first'])
    key(button(), 'Escape')
    await settle()
    key(button(), 'ArrowUp')
    await settle()
    expect(shown).toEqual(['first', 'last'])
  })

  it('open at mount: it finds its button, is placed and named by it', async () => {
    host(false, true)
    await settle()
    expect(panel()!.style.visibility).toBe('')
    expect(panel()!.getAttribute('aria-labelledby')).toBe(button().id)
  })

  it('hands its element and its close to what it holds', async () => {
    const { open, handed } = host(true, true)
    await settle()
    expect((handed()!.panel as Ref<HTMLElement | null>).value).toBe(panel())
    handed()!.close()
    expect(open.value).toBe(false)
  })

  it('Escape gives the focus back to the button; a press outside leaves it where it went', async () => {
    host(false)
    button().click()
    await settle()
    const inner = document.body.querySelector<HTMLElement>('.inner')!
    expect(document.activeElement).toBe(inner)
    key(inner, 'Escape')
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button())
    button().click()
    await settle()
    const outside = document.createElement('input')
    document.body.append(outside)
    press(outside)
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).not.toBe(button())
  })

  it('closed by its host with the focus inside, the focus goes back to the button', async () => {
    const { open } = host(false)
    button().click()
    await settle()
    expect(document.activeElement?.className).toBe('inner')
    open.value = false
    await settle()
    expect(document.activeElement).toBe(button())
  })

  it('close(false) from the host keeps the focus where it is; the next open gives it back again', async () => {
    const { close } = host(false)
    button().click()
    await settle()
    close(false)
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).not.toBe(button())
    button().click()
    await settle()
    close()
    await settle()
    expect(document.activeElement).toBe(button())
  })

  it('a menu closes on Tab with the focus on its button, so Tab goes on from there', async () => {
    host(true)
    button().dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await settle()
    panel()!.focus()
    key(panel()!, 'Tab')
    expect(document.activeElement).toBe(button())
    await settle()
    expect(panel()).toBeNull()
  })
})
