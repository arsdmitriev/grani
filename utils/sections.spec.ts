import { describe, expect, it } from 'vitest'
import { Fragment, createCommentVNode, createTextVNode, h } from 'vue'
import { renders } from './sections'

describe('renders', () => {
  it('nothing, comments and blank text draw nothing', () => {
    expect(renders(undefined)).toBe(false)
    expect(renders([])).toBe(false)
    expect(renders([createCommentVNode('off'), createTextVNode('  ')])).toBe(false)
    expect(renders([h(Fragment, [createCommentVNode('off')])])).toBe(false)
  })

  it('an element, text or a fragment holding one draws', () => {
    expect(renders([h('span')])).toBe(true)
    expect(renders([createTextVNode('Note')])).toBe(true)
    expect(renders([h(Fragment, [createCommentVNode('off'), h('b')])])).toBe(true)
  })
})
