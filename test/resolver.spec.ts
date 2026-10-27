import { describe, expect, it } from 'vitest'
import { GraniResolver } from '../resolver.js'

const resolve = GraniResolver()

describe('GraniResolver', () => {
  it('resolves a component of the package to its name in the entry', () => {
    expect(resolve('UiButton')).toEqual({ name: 'UiButton', from: 'grani-ui' })
  })

  it('leaves a Ui name the package does not have to the next resolver', () => {
    for (const name of ['UiUploader', 'UiButtonGroupX', 'Ui', 'UiButton.vue', 'Button'])
      expect(resolve(name), name).toBeUndefined()
  })

  it('knows every component in the folder', () => {
    const names = Object.keys(import.meta.glob('../components/Ui*.vue')).map((path) =>
      path.split('/').pop()!.replace('.vue', ''),
    )
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(resolve(name), name).toBeDefined()
  })
})
