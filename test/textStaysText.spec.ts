import { mount } from '@vue/test-utils'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import UiBadge from '../components/UiBadge.vue'
import UiField from '../components/UiField.vue'
import UiListItem from '../components/UiListItem.vue'

// A value a person or a server typed is text: no component writes a string into the page as HTML.
// A slot is the app's own markup and stays outside this: grani renders it as written.
const ROOT = resolve(__dirname, '..')
const SOURCES = ['components', 'composables', 'utils'].flatMap((dir) =>
  readdirSync(resolve(ROOT, dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(vue|ts)$/.test(f) && !f.includes('.spec.'))
    .map((f) => `${dir}/${f}`),
)
const AS_HTML = /v-html|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write\(/

describe('text stays text', () => {
  it('no component, composable or utility writes a string into the page as HTML', () => {
    const writers = SOURCES.filter((f) => AS_HTML.test(readFileSync(resolve(ROOT, f), 'utf8')))
    expect(SOURCES.length).toBeGreaterThan(100)
    expect(writers).toEqual([])
  })

  it('markup in a title, a label or an error shows its characters, never an element', () => {
    const markup = '<img src="x" onerror="alert(1)"><b>bold</b>'
    for (const w of [
      mount(UiListItem, { props: { title: markup, description: markup } }),
      mount(UiBadge, { props: { label: markup } }),
      mount(UiField, {
        props: { label: markup, error: markup, hint: markup },
        slots: { default: () => h('input') },
      }),
    ]) {
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('b').exists()).toBe(false)
      expect(w.text()).toContain(markup)
    }
  })
})
