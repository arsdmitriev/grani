import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Suspense, defineComponent, h, nextTick, ref } from 'vue'
import { PANEL_LIST_ROWS, useVisibleRows } from './useVisibleRows'

// happy-dom lays nothing out: each row is given its place by hand, 32px tall.
const listOf = (n: number, tall: number[] = []) => {
  const ul = document.createElement('ul')
  let top = 0
  for (let i = 0; i < n; i++) {
    const li = document.createElement('li')
    li.setAttribute('role', 'option')
    const h = tall.includes(i) ? 52 : 32
    Object.defineProperty(li, 'offsetTop', { value: top })
    Object.defineProperty(li, 'offsetHeight', { value: h })
    top += h
    ul.appendChild(li)
  }
  document.body.appendChild(ul)
  return ul
}
const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
}

describe('useVisibleRows', () => {
  it('five rows or fewer: the list keeps its own height', async () => {
    const { maxHeight } = useVisibleRows(ref(listOf(PANEL_LIST_ROWS)), '[role=option]', ref(0))
    await settle()
    expect(maxHeight.value).toBeUndefined()
  })

  it('more than five: five rows and half of the sixth, measured, a tall row counted as it is', async () => {
    const { maxHeight } = useVisibleRows(ref(listOf(12, [1])), '[role=option]', ref(0))
    await settle()
    // 4 rows of 32 and one of 52 above the sixth, then half of it.
    expect(maxHeight.value).toBe(
      `min(${4 * 32 + 52 + 16}px, var(--ui-panel-room, 100dvh), calc(100dvh - 1rem))`,
    )
  })

  it('measured again when the rows change: a search that narrows to three lifts the cap', async () => {
    const list = ref(listOf(12))
    const count = ref(12)
    const { maxHeight } = useVisibleRows(list, '[role=option]', count)
    await settle()
    expect(maxHeight.value).toBe('min(176px, var(--ui-panel-room, 100dvh), calc(100dvh - 1rem))')
    list.value.replaceChildren(...[...list.value.children].slice(0, 3))
    count.value = 3
    await settle()
    expect(maxHeight.value).toBeUndefined()
  })

  it('measured once the list is in the page: a list that mounts after its first measure is cut too', async () => {
    // Rows placed by their index, since the component draws them itself.
    const proto = HTMLLIElement.prototype
    const at = (el: Element) => [...el.parentElement!.children].indexOf(el)
    Object.defineProperty(proto, 'offsetTop', {
      configurable: true,
      get() {
        return at(this) * 32
      },
    })
    Object.defineProperty(proto, 'offsetHeight', { configurable: true, get: () => 32 })
    let seen: ReturnType<typeof useVisibleRows> | undefined
    const Lister = defineComponent({
      setup() {
        const list = ref<HTMLElement | null>(null)
        seen = useVisibleRows(list, 'li', ref(12))
        return () =>
          h(
            'ul',
            { ref: list },
            Array.from({ length: 12 }, () => h('li')),
          )
      },
    })
    // An async neighbour holds the page: Lister's setup has run, its list is not in the page yet.
    let release!: () => void
    const Slow = defineComponent({
      async setup() {
        await new Promise<void>((r) => (release = r))
        return () => h('span')
      },
    })
    const w = mount(() => h(Suspense, null, { default: () => h('div', [h(Lister), h(Slow)]) }))
    await settle()
    release()
    await new Promise((r) => setTimeout(r, 0))
    await settle()
    expect(seen!.maxHeight.value).toBe(
      'min(176px, var(--ui-panel-room, 100dvh), calc(100dvh - 1rem))',
    )
    w.unmount()
    delete (proto as { offsetTop?: number }).offsetTop
    delete (proto as { offsetHeight?: number }).offsetHeight
  })
})
