import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UiAvatar from './UiAvatar.vue'

describe('UiAvatar', () => {
  it('shows the initials of the first two words on the tone plate', () => {
    const w = mount(UiAvatar, { props: { name: 'anna maria petrova' } })
    expect(w.text()).toBe('AM')
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-brand-subtle', 'rounded-pill', 'h-8']))
  })

  it('a photo in place of the initials; a failed one falls back to them', async () => {
    const w = mount(UiAvatar, { props: { name: 'Anna Petrova', src: '/a.jpg' } })
    expect(w.find('img').exists()).toBe(true)
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toBe('AP')
  })

  it('beside a name it is decoration; alone, with alt, it is an image with a name', () => {
    expect(mount(UiAvatar, { props: { name: 'A B' } }).attributes('aria-hidden')).toBe('true')
    const alone = mount(UiAvatar, { props: { name: 'Anna Petrova', alt: 'Anna Petrova' } })
    expect(alone.attributes('role')).toBe('img')
    expect(alone.attributes('aria-label')).toBe('Anna Petrova')
    expect(alone.attributes('aria-hidden')).toBeUndefined()
  })

  it('sizes step 24, 32, 40', () => {
    expect(mount(UiAvatar, { props: { name: 'A', size: 'xs' } }).classes()).toContain('h-6')
    expect(mount(UiAvatar, { props: { name: 'A', size: 'md' } }).classes()).toContain('h-10')
  })
})

describe('UiAvatar — review follow-ups', () => {
  it('The avatar container and initials remain rendered while the photo loads.', () => {
    const w = mount(UiAvatar, { props: { name: 'Anna Petrova', src: '/a.jpg' } })
    expect(w.find('img').classes()).toEqual(expect.arrayContaining(['absolute', 'inset-0']))
    expect(w.text()).toBe('AP')
    expect(w.classes()).toContain('bg-brand-subtle')
  })

  it('The avatar keeps its size while the photo loads, once it arrives and if it fails.', async () => {
    const w = mount(UiAvatar, { props: { name: 'Anna Petrova', src: '/a.jpg', size: 'md' } })
    const loading = w.classes()
    await w.find('img').trigger('load')
    expect(w.classes()).toEqual(loading)
    await w.setProps({ src: '/dead.jpg' })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.classes()).toEqual(loading)
  })

  it('Initials are shown on mount if the photo has already failed.', async () => {
    const proto = HTMLImageElement.prototype
    const complete = Object.getOwnPropertyDescriptor(proto, 'complete')
    const natural = Object.getOwnPropertyDescriptor(proto, 'naturalWidth')
    Object.defineProperty(proto, 'complete', { configurable: true, get: () => true })
    Object.defineProperty(proto, 'naturalWidth', { configurable: true, get: () => 0 })
    try {
      const w = mount(UiAvatar, { props: { name: 'Anna Petrova', src: '/dead.jpg' } })
      await w.vm.$nextTick()
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('AP')
    } finally {
      if (complete) Object.defineProperty(proto, 'complete', complete)
      else delete (proto as unknown as Record<string, unknown>).complete
      if (natural) Object.defineProperty(proto, 'naturalWidth', natural)
      else delete (proto as unknown as Record<string, unknown>).naturalWidth
    }
  })

  it('a src swapped after a failure shows the new photo', async () => {
    const w = mount(UiAvatar, { props: { name: 'A B', src: '/dead.jpg' } })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    await w.setProps({ src: '/new.jpg' })
    expect(w.find('img').attributes('src')).toBe('/new.jpg')
  })

  it('an aria-label without alt does not leave the mark hidden', () => {
    const w = mount(UiAvatar, { props: { name: 'Anna' }, attrs: { 'aria-label': 'Anna' } })
    expect(w.attributes('aria-hidden')).toBeUndefined()
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Anna')
  })

  it('skips a lone ampersand or dash; keeps an accent and an emoji whole', () => {
    const text = (name: string) => mount(UiAvatar, { props: { name } }).text()
    expect(text('Anna & Bob')).toBe('AB')
    expect(text('Anna - Petrova')).toBe('AP')
    expect(text('@anna')).toBe('A')
    expect(text('e\u0301va nagy')).toBe('E\u0301N')
    // A woman at a laptop: three code points joined into one glyph.
    const coder = '\u{1F469}\u200D\u{1F4BB}'
    expect(text(`${coder} Dev`)).toBe(`${coder}D`)
    expect(text('ßeta')).toBe('ß')
  })

  it('a blank name without a photo shows a person glyph and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAvatar, { props: { name: '   ' } })
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toBe('')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no name and no photo'))
    warn.mockRestore()
  })

  it('the photo loads lazily and decodes off the main thread', () => {
    const img = mount(UiAvatar, { props: { name: 'A', src: '/a.png' } }).find('img')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
  })

  it('one word gives one letter; a lowercase or Cyrillic name is capitalised', () => {
    expect(mount(UiAvatar, { props: { name: 'Anna' } }).text()).toBe('A')
    expect(mount(UiAvatar, { props: { name: 'анна петрова' } }).text()).toBe('АП')
  })
})
