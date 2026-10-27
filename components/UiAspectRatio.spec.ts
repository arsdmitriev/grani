import { mount } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import UiAspectRatio from './UiAspectRatio.vue'

describe('UiAspectRatio', () => {
  it('defaults to 16 / 9 and sets the CSS aspect ratio', () => {
    expect(mount(UiAspectRatio).attributes('style')).toMatch(/aspect-ratio: 1\.77/)
  })

  it('takes the ratio as a number', () => {
    expect(mount(UiAspectRatio, { props: { ratio: 1 } }).attributes('style')).toContain(
      'aspect-ratio: 1',
    )
  })

  it('a single child fills the box and clips to the card radius', () => {
    const w = mount(UiAspectRatio, { slots: { default: '<img src="x.png" alt="Sunset" />' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-card', 'overflow-hidden']))
    const fill = w.element.firstElementChild as HTMLElement
    expect([...fill.classList]).toEqual(expect.arrayContaining(['absolute', 'inset-0']))
    expect(fill.className).toContain('[&>*:only-child]:h-full')
    expect(fill.className).toContain('[&>img:not(.absolute)]:object-cover')
    expect(w.find('img').attributes('alt')).toBe('Sunset')
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back to 16 / 9 and warns on ratio %s, naming the problem, never the value',
    (ratio) => {
      // CSS drops a zero, negative or non-finite ratio and the box collapses.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(UiAspectRatio, { props: { ratio } })
      expect(w.attributes('style')).toMatch(/aspect-ratio: 1\.77/)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('UiAspectRatio'))
      expect(warn.mock.calls.some((c) => String(c[0]).includes(String(ratio)))).toBe(false)
      warn.mockRestore()
    },
  )

  it('crops the image inside a picture, not only a bare image', () => {
    // The image inside a picture is the one that crops, not the picture.
    const w = mount(UiAspectRatio, {
      slots: { default: '<picture><source srcset="x.avif" /><img src="x.png" alt="" /></picture>' },
    })
    const fill = (w.element.firstElementChild as HTMLElement).className
    expect(fill).toContain('[&>picture]:block')
    expect(fill).toContain('[&>picture>img]:object-cover')
    expect(fill).toContain('[&>picture>img]:h-full')
  })

  it('fit contain shows the whole media instead of cropping it', () => {
    const fill = (
      mount(UiAspectRatio, { props: { fit: 'contain' } }).element.firstElementChild as HTMLElement
    ).className
    expect(fill).toContain('[&>img:not(.absolute)]:object-contain')
    expect(fill).toContain('[&>picture>img]:object-contain')
    expect(fill).not.toContain('object-cover')
  })

  it('an overlay placed absolute anchors to the fill wrapper', () => {
    const w = mount(UiAspectRatio, {
      slots: {
        default: '<img src="x.png" alt="" /><span class="badge absolute top-2 start-2">New</span>',
      },
    })
    const badge = w.find('.badge').element
    expect(badge.parentElement).toBe(w.element.firstElementChild)
    expect(badge.parentElement!.classList).toContain('absolute')
  })

  it('does not force its own width and passes attributes to the root', () => {
    // A width of its own would beat the caller's `w-32`.
    const w = mount(UiAspectRatio, { attrs: { class: 'w-32', 'data-testid': 'cover' } })
    expect(w.classes()).toContain('w-32')
    expect(w.classes()).not.toContain('w-full')
    expect(w.attributes('data-testid')).toBe('cover')
  })

  it('renders the style on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(UiAspectRatio, { ratio: 1 }) }),
    )
    expect(html).toContain('aspect-ratio:1')
  })
})

describe('UiAspectRatio — review follow-ups', () => {
  const fill = (w: ReturnType<typeof mount>) => [
    ...(w.element.firstElementChild as HTMLElement).classList,
  ]

  it('an image beside a badge still fills the box, not only takes the fit', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<img src="x.png" alt="" /><span class="badge">New</span>' },
    })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>img:not(.absolute)]:h-full',
        '[&>img:not(.absolute)]:w-full',
        '[&>img:not(.absolute)]:object-cover',
      ]),
    )
  })

  it('a linked image fills the box and takes the fit through the link', () => {
    const w = mount(UiAspectRatio, { props: { fit: 'contain' } })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>a:not(.absolute)]:block',
        '[&>a:not(.absolute)>img]:h-full',
        '[&>a:not(.absolute)>img]:object-contain',
      ]),
    )
  })

  it('a link and a picture beside a badge take the full box, not only a lone one', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<a href="/x"><img src="x.png" alt="" /></a><span>New</span>' },
    })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>a:not(.absolute)]:h-full',
        '[&>a:not(.absolute)]:w-full',
        '[&>picture]:h-full',
        '[&>picture]:w-full',
      ]),
    )
  })

  it('a focused linked image lets its halo out, and the link clips the image meanwhile', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<a href="/x"><img src="x.png" alt="" /></a>' },
    })
    // The box clips its media, and with it the halo: while the link has the focus it stops.
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'overflow-hidden',
        'has-[>div>a:not(.absolute):focus-visible]:overflow-visible',
      ]),
    )
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        'rounded-[inherit]',
        '[&>a:not(.absolute)]:overflow-hidden',
        '[&>a:not(.absolute)]:rounded-[inherit]',
      ]),
    )
  })

  it('a numeric string ratio is read as the number', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAspectRatio, { props: { ratio: '1.5' as unknown as number } })
    expect(w.attributes('style')).toContain('aspect-ratio: 1.5')
    // Vue's own prop check still says it in development; the library does not swap the ratio.
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[grani]'))
    warn.mockRestore()
  })

  it('passes a caller background to the root, for loading and the bands of contain', () => {
    const w = mount(UiAspectRatio, { attrs: { class: 'bg-neutral-subtle' } })
    expect(w.classes()).toContain('bg-neutral-subtle')
  })

  it('a linked image answers the pointer: it dims a little on hover', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<a href="/x"><img src="x.png" alt="" /></a>' },
    })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>a:not(.absolute):hover_img]:opacity-90',
        '[&>a:not(.absolute)_img]:transition-opacity',
      ]),
    )
  })

  it('a picture inside a link fills the box, takes the fit and dims on hover', () => {
    const w = mount(UiAspectRatio, { props: { fit: 'contain' } })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>a:not(.absolute)>picture]:h-full',
        '[&>a:not(.absolute)>picture>img]:h-full',
        '[&>a:not(.absolute)>picture>img]:object-contain',
        '[&>a:not(.absolute):hover_img]:opacity-90',
      ]),
    )
  })

  it('the halo rule reads the real shape: box, fill wrapper, link', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<a href="/x"><img src="x.png" alt="" /></a>' },
    })
    expect(w.element.querySelector(':scope > div > a')).not.toBeNull()
    expect(w.attributes('data-aspect')).toBe('')
  })

  it('an absolute overlay link or image keeps its own size and does not fill the box', () => {
    const w = mount(UiAspectRatio, {
      slots: {
        default:
          '<img src="x.png" alt="" /><a href="/dl" class="absolute end-2 top-2">Download</a><img src="w.png" alt="" class="absolute bottom-2 end-2 h-6" />',
      },
    })
    const box = w.element.firstElementChild as HTMLElement
    // The fill rules reach the photo, never what the caller placed over it.
    const [photo, link, mark] = [...box.children] as HTMLElement[]
    expect(photo!.matches(':not(.absolute)')).toBe(true)
    expect(link!.matches('a:not(.absolute)')).toBe(false)
    expect(mark!.matches('img:not(.absolute)')).toBe(false)
    expect(fill(w)).toEqual(
      expect.arrayContaining(['[&>a:not(.absolute)]:h-full', '[&>img:not(.absolute)]:h-full']),
    )
    expect(fill(w).some((c) => c.startsWith('[&>a]:') || c.startsWith('[&>img]:'))).toBe(false)
    // Its focus neither unclips the box for a halo of its own.
    expect(w.classes()).not.toContain('has-[>div>a:focus-visible]:overflow-visible')
  })

  it('an iframe, a canvas or a video beside a badge fills the box, not only a lone one', () => {
    const w = mount(UiAspectRatio, {
      slots: { default: '<iframe src="about:blank" title="Map"></iframe><span>New</span>' },
    })
    expect(fill(w)).toEqual(
      expect.arrayContaining([
        '[&>iframe]:h-full',
        '[&>iframe]:w-full',
        '[&>canvas]:h-full',
        '[&>canvas]:w-full',
        '[&>video]:h-full',
        '[&>video]:object-cover',
      ]),
    )
  })

  it('a text ratio that is not a number falls back to 16 / 9 and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(UiAspectRatio, { props: { ratio: '16/9' as unknown as number } })
    expect(w.attributes('style')).toMatch(/aspect-ratio: 1\.77/)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[grani] UiAspectRatio'))
    warn.mockRestore()
  })

  it('follows a ratio and a fit changed after mount', async () => {
    const w = mount(UiAspectRatio, { props: { ratio: 1 } })
    await w.setProps({ ratio: 2, fit: 'contain' })
    expect(w.attributes('style')).toContain('aspect-ratio: 2')
    expect(fill(w)).toContain('[&>img:not(.absolute)]:object-contain')
  })
})

describe('UiAspectRatio — rules', () => {
  it('The box holds its place before the media loads: its proportions are its own.', () => {
    // No media yet, or media that has not arrived: the box still carries its ratio, so its height
    // comes from its width and nothing under it waits for the image to know its size.
    const empty = mount(UiAspectRatio, { props: { ratio: 4 / 3 } })
    expect(empty.attributes('style')).toContain('aspect-ratio: 1.333')
    const waiting = mount(UiAspectRatio, {
      props: { ratio: 4 / 3 },
      slots: { default: '<img alt="" />' },
    })
    expect(waiting.attributes('style')).toContain('aspect-ratio: 1.333')
    expect(waiting.find('img').element.parentElement!.classList).toContain('absolute')
  })
})
