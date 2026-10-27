import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import UiConfirm from './UiConfirm.vue'
import UiModal from './UiModal.vue'
import UiTable from './UiTable.vue'
import { settle } from '../test/settle'
import { useConfirm, useConfirmHost } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'

const dialog = () => document.body.querySelector<HTMLElement>('[role="alertdialog"]')
const button = (label: string) =>
  Array.from(dialog()!.querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!

describe('UiConfirm + useConfirm', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('asks in an alert dialog and answers true on confirm', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const answer = confirm({
      message: 'The order is removed.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    await settle()
    expect(dialog()!.textContent).toContain('Are you sure?')
    expect(dialog()!.textContent).toContain('The order is removed.')
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    expect(button('Delete').className).toMatch(/danger/)
    button('Delete').click()
    expect(await answer).toBe(true)
    await settle()
    expect(dialog()).toBeNull()
  })

  it('cancel, Escape and the cross answer false', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    for (const how of ['cancel', 'escape', 'cross'] as const) {
      const answer = confirm('Leave without saving?')
      await settle()
      if (how === 'cancel') button('Cancel').click()
      if (how === 'escape')
        document.activeElement!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
      if (how === 'cross') dialog()!.querySelector<HTMLElement>('[aria-label="Close"]')!.click()
      expect(await answer, how).toBe(false)
      await settle()
    }
  })

  it('a new question answers the open one with false', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const first = confirm('First?')
    const second = confirm('Second?')
    expect(await first).toBe(false)
    await settle()
    expect(dialog()!.textContent).toContain('Second?')
    button('Confirm').click()
    expect(await second).toBe(true)
  })
})

describe('UiConfirm — an action behind the answer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const tick = () => new Promise((r) => setTimeout(r, 2))

  it('the window waits for the action: the button loads, a second press sends nothing, Escape is refused', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    let calls = 0
    let finish!: () => void
    const answer = confirm({
      message: 'The order is removed.',
      confirmLabel: 'Delete',
      action: () => {
        calls++
        return new Promise<void>((r) => (finish = r))
      },
    })
    await settle()
    await tick()
    // The confirm button is the footer's last: its label is hidden while it loads.
    const confirmButton = () => [...dialog()!.querySelectorAll('button')].at(-1)!
    confirmButton().click()
    await settle()
    confirmButton().click()
    await settle()
    expect(calls).toBe(1)
    expect(confirmButton().getAttribute('aria-busy')).toBe('true')
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(dialog()).not.toBeNull()
    finish()
    expect(await answer).toBe(true)
    await settle()
    expect(dialog()).toBeNull()
  })

  it('success says so in a toast only when asked to', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const toast = useToast()
    const answer = confirm({
      message: 'x',
      confirmLabel: 'Delete',
      action: async () => {},
      success: 'Order deleted',
    })
    await settle()
    await tick()
    button('Delete').click()
    expect(await answer).toBe(true)
    expect(toast.toasts.value.map((x) => [x.tone, x.title])).toEqual([['success', 'Order deleted']])
    toast.close()
  })

  it('a failure closes the question into an error toast whose Retry asks again', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const toast = useToast()
    const answer = confirm({
      title: 'Delete the order?',
      message: 'x',
      confirmLabel: 'Delete',
      action: () => Promise.reject(new Error('offline')),
      error: 'Could not delete the order',
    })
    await settle()
    await tick()
    button('Delete').click()
    expect(await answer).toBe(false)
    await settle()
    expect(dialog()).toBeNull()
    const [failed] = toast.toasts.value
    expect([failed!.tone, failed!.title, failed!.action?.label]).toEqual([
      'danger',
      'Could not delete the order',
      'Retry',
    ])
    failed!.action!.onClick()
    await settle()
    expect(dialog()?.textContent).toContain('Delete the order?')
    toast.close()
  })
})

describe('UiConfirm — review follow-ups', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const tick = () => new Promise((r) => setTimeout(r, 2))
  const pressConfirm = async () => {
    await settle()
    await tick()
    ;[...dialog()!.querySelectorAll('button')].at(-1)!.click()
    await settle()
  }

  it("a busy action's outcome does not answer or close a later question", async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm, state } = useConfirmHost()
    const toast = useToast()
    let finish!: () => void
    const first = confirm({
      message: 'A',
      confirmLabel: 'Delete',
      action: () => new Promise<void>((r) => (finish = r)),
      success: 'A done',
    })
    await pressConfirm()
    const second = confirm({ message: 'B', confirmLabel: 'Leave' })
    expect(await first).toBe(false)
    finish()
    await settle()
    expect(state.value.open).toBe(true)
    expect(state.value.message).toBe('B')
    expect(toast.toasts.value).toHaveLength(0)
    let answered = false
    void second.then(() => (answered = true))
    await settle()
    expect(answered).toBe(false)
    toast.close()
  })

  it('a busy question answered no from outside: its failure reopens nothing', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm, settle: answer, state } = useConfirmHost()
    const toast = useToast()
    let fail!: (e: Error) => void
    const asked = confirm({
      message: 'A',
      confirmLabel: 'Delete',
      action: () => new Promise<void>((_, reject) => (fail = reject)),
    })
    await pressConfirm()
    answer(false)
    expect(await asked).toBe(false)
    fail(new Error('offline'))
    await settle()
    expect(state.value.open).toBe(false)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('a long label stays inside its half of the footer: the label box can shrink and clips', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    void confirm({
      message: 'x',
      confirmLabel: 'Yes, permanently delete this record and its history',
    })
    await settle()
    const box = [...dialog()!.querySelectorAll('button')].at(-1)!.firstElementChild!
    expect(box.className).toMatch(/\bmin-w-0\b/)
    expect(box.className).toMatch(/\boverflow-clip\b/)
  })
})

describe('UiConfirm — busy', () => {
  it('a busy action refuses the cross: the window stays until the request ends', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    let finish!: () => void
    const answer = confirm({
      message: 'The order is removed.',
      confirmLabel: 'Delete',
      action: () => new Promise<void>((r) => (finish = r)),
    })
    await settle()
    ;[...dialog()!.querySelectorAll('button')].at(-1)!.click()
    await settle()
    dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!.click()
    await settle()
    expect(dialog()).not.toBeNull()
    finish()
    expect(await answer).toBe(true)
  })
})

describe('UiConfirm — a question never hangs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const page = defineComponent({ render: () => null })
  const withRouter = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: page },
        { path: '/other', component: page },
      ],
    })
    await router.push('/')
    const host = mount(UiConfirm, { attachTo: document.body, global: { plugins: [router] } })
    return { router, host }
  }

  it('a change of page answers the open question no', async () => {
    const { router, host } = await withRouter()
    const { confirm } = useConfirm()
    const answer = confirm('Leave without saving?')
    await settle()
    expect(dialog()).not.toBeNull()
    await router.push('/other')
    expect(await answer).toBe(false)
    await settle()
    expect(dialog()).toBeNull()
    host.unmount()
  })

  it('the host unmounting answers the open question no', async () => {
    const host = mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const answer = confirm('Leave without saving?')
    await settle()
    host.unmount()
    expect(await answer).toBe(false)
  })

  it('a change of page does not cut off a running action: the request answers', async () => {
    const { router, host } = await withRouter()
    const { confirm } = useConfirm()
    let finish!: () => void
    const answer = confirm({
      message: 'The order is removed.',
      confirmLabel: 'Delete',
      action: () => new Promise<void>((r) => (finish = r)),
    })
    // The action has started before the page changes: the confirm button says it is busy. The
    // button is found afresh each time (the test's transition stub may rebuild the panel), and a
    // second press is safe, since a busy question ignores it.
    await vi.waitFor(() => {
      dialog()
        ?.querySelectorAll<HTMLButtonElement>('button')
        .forEach((b) => b.textContent?.trim() === 'Delete' && b.click())
      expect(dialog()?.querySelector('[aria-busy="true"]')).toBeTruthy()
    })
    let answered = false
    void answer.then(() => (answered = true))
    await router.push('/other')
    await settle()
    expect(answered).toBe(false)
    expect(dialog()).not.toBeNull()
    finish()
    expect(await answer).toBe(true)
    host.unmount()
  })
})

describe('UiConfirm — asked from a window', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('hides the window until it is answered; the window comes back with the focus on what asked', async () => {
    mount(UiConfirm, { attachTo: document.body })
    mount(UiModal, {
      attachTo: document.body,
      props: { title: 'Edit the client', open: true },
      slots: {
        default: () => [h('input', { class: 'name' }), h('button', { class: 'drop' }, 'Delete')],
      },
    })
    await settle()
    const form = document.body.querySelector<HTMLElement>('[role="dialog"]')!
    const drop = form.querySelector<HTMLElement>('.drop')!
    drop.focus()
    const { confirm } = useConfirm()
    const answer = confirm('The client is removed.')
    await settle()
    expect(form.parentElement!.hasAttribute('inert')).toBe(true)
    expect(form.parentElement!.classList).toContain('invisible')
    button('Cancel').click()
    expect(await answer).toBe(false)
    await settle()
    expect(dialog()).toBeNull()
    expect(form.parentElement!.hasAttribute('inert')).toBe(false)
    expect(form.parentElement!.classList).not.toContain('invisible')
    expect(document.activeElement).toBe(drop)
  })
})

describe('UiConfirm — a long question by keyboard', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a question longer than the window is a scroll region a keyboard reaches', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    const answer = confirm({ message: 'The terms, at length.' })
    await settle()
    const body = dialog()!.querySelector<HTMLElement>('.overflow-y-auto')!
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 400 })
    window.dispatchEvent(new Event('resize'))
    await settle()
    expect(body.getAttribute('tabindex')).toBe('0')
    expect(body.getAttribute('role')).toBe('region')
    button('Cancel').click()
    expect(await answer).toBe(false)
  })
})

describe('UiConfirm — a closed question', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Cancel with an action runs nothing, even a press on the confirm button in the same moment', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    let runs = 0
    const answer = confirm({ message: 'The row is removed.', action: async () => void runs++ })
    await settle()
    const yes = button('Confirm')
    button('Cancel').click()
    yes.click()
    expect(await answer).toBe(false)
    expect(runs).toBe(0)
  })
})

describe('UiConfirm — a row deleted through the question', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const table = async (inside: boolean) => {
    const rows = ref([{ id: 'A' }, { id: 'B' }, { id: 'C' }])
    const { confirm } = useConfirm()
    const drop = (id: string) => (rows.value = rows.value.filter((r) => r.id !== id))
    // The request in `action`; the row leaves on the answer, or inside the action itself.
    const remove = async (id: string) => {
      const ok = await confirm({
        title: `Delete ${id}?`,
        message: 'The row is removed.',
        confirmLabel: 'Delete',
        action: async () => void (inside && drop(id)),
      })
      if (ok && !inside) drop(id)
    }
    const Host = defineComponent({
      setup: () => () =>
        h(
          UiTable,
          {
            columns: [{ key: 'id', label: 'Id' }],
            items: rows.value,
            rowKey: 'id',
            ariaLabel: 'Rows',
          },
          {
            'row-actions': ({ row }: { row: { id: string } }) =>
              h(
                'button',
                { class: `drop-${row.id}`, onClick: () => remove(row.id) },
                `Delete ${row.id}`,
              ),
          },
        ),
    })
    mount(UiConfirm, { attachTo: document.body })
    mount(Host, { attachTo: document.body })
    await settle()
    const drop0 = document.querySelector<HTMLElement>('.drop-B')!
    drop0.focus()
    drop0.click()
    await settle()
    button('Delete').click()
    await settle()
    await settle()
    expect(document.querySelector('.drop-B')).toBeNull()
  }

  it('a row removed once the question answers yes hands the focus to the same button of the row now in its place', async () => {
    await table(false)
    expect(document.activeElement).toBe(document.querySelector('.drop-C'))
  })

  it('a row removed inside the action goes after a failure too: the Retry runs the same action', async () => {
    const rows = ref(['A', 'B'])
    const { confirm } = useConfirm()
    const toast = useToast()
    let tries = 0
    // The first request fails; the Retry's goes through and takes the row with it.
    const action = async () => {
      if (tries++ === 0) throw new Error('offline')
      rows.value = rows.value.filter((r) => r !== 'A')
    }
    mount(UiConfirm, { attachTo: document.body })
    const answer = confirm({ title: 'Delete A?', message: 'x', confirmLabel: 'Delete', action })
    await settle()
    button('Delete').click()
    expect(await answer).toBe(false)
    await settle()
    expect(rows.value).toEqual(['A', 'B'])
    toast.toasts.value.find((t) => t.action?.label === 'Retry')!.action!.onClick()
    await settle()
    button('Delete').click()
    await settle()
    await settle()
    expect(rows.value).toEqual(['B'])
    toast.close()
  })

  it('a row removed inside the action hands the focus on too: the window gives it to the same button of the row now in its place', async () => {
    await table(true)
    expect(document.activeElement).toBe(document.querySelector('.drop-C'))
  })
})

describe('UiConfirm — a question in place of another', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a new question while one is open puts the focus back on Cancel: Enter does not confirm it unread', async () => {
    mount(UiConfirm, { attachTo: document.body })
    const { confirm } = useConfirm()
    void confirm('Archive the order?')
    await settle()
    button('Confirm').focus()
    const second = confirm({ message: 'The order is removed.', confirmLabel: 'Delete' })
    await settle()
    expect(dialog()!.textContent).toContain('The order is removed.')
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    button('Cancel').click()
    expect(await second).toBe(false)
  })
})
