import { describe, expect, it } from 'vitest'
import { useConfirm, useConfirmHost } from './useConfirm'

describe('useConfirm', () => {
  it('a string is the message; the tone defaults to brand', () => {
    const { confirm, state } = useConfirmHost()
    void confirm('Leave?')
    expect(state.value).toMatchObject({ open: true, message: 'Leave?', tone: 'brand' })
  })

  it('settle answers the caller and closes the question', async () => {
    const { confirm, settle, state } = useConfirmHost()
    const answer = confirm({ message: 'Delete?', tone: 'danger' })
    settle(true)
    expect(await answer).toBe(true)
    expect(state.value.open).toBe(false)
  })

  it('a new question answers the open one false; settle with nothing open is harmless', async () => {
    const { confirm, settle } = useConfirmHost()
    const first = confirm('First?')
    const second = confirm('Second?')
    expect(await first).toBe(false)
    settle(false)
    expect(await second).toBe(false)
    expect(() => settle(true)).not.toThrow()
  })

  it("gives an app the question only; its state and its answer are the host's", () => {
    expect(Object.keys(useConfirm())).toEqual(['confirm'])
  })
})
