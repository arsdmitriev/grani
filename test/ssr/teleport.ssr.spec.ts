import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createGrani } from '../../plugin'
import UiModal from '../../components/UiModal.vue'

// A server writes what is teleported beside the page, under the target's name: the app's own
// target, or `body` when it names none.
const render = async (teleport?: string) => {
  const app = createSSRApp({
    render: () => h(UiModal, { open: true, title: 'Window' }, () => 'window body'),
  }).use(createGrani({ teleport }))
  const ctx: SSRContext = {}
  await renderToString(app, ctx)
  return ctx.teleports ?? {}
}

describe('teleport on a server', () => {
  it('goes under body unset, and under the selector the app names', async () => {
    expect((await render()).body).toContain('window body')
    const own = await render('#overlays')
    expect(own['#overlays']).toContain('window body')
    expect(own.body).toBeUndefined()
  })
})
