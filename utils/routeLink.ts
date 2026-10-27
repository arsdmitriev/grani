import { defineComponent, getCurrentInstance, h, inject, watch, type Component } from 'vue'
import { graniKey } from './key'
import { isDev } from './dev'
import { hasAddress, normalizeAddress, opensElsewhere, unsafeHref } from './link'

/** The link component an app gives `createGrani({ link })`; unset, its `RouterLink` if it has a router. */
export const LINK = graniKey<Component | null>('link')

// A path of the app goes through its router; another site, `mailto:`, `tel:` or a file the server
// hands out (`/llms.txt`, `/report.pdf`) is a plain anchor, since no route of the app answers it. A
// file is told by the ending of a known kind of file on the last part: a route may hold a dot too
// (`/people/john.doe`, `/releases/v1.2`, `/sites/example.com`), and stays a route.
const FILE =
  /\.(?:txt|md|pdf|csv|tsv|json|xml|rss|atom|ics|vcf|zip|gz|tgz|tar|7z|rar|png|jpe?g|gif|svg|webp|avif|ico|bmp|tiff?|mp3|mp4|m4a|wav|ogg|webm|mov|docx?|xlsx?|pptx?|odt|ods|rtf|epub|html?|js|mjs|css|map|wasm|woff2?|ttf|otf|apk|dmg|exe|msi|deb|rpm|iso)$/i
const isFile = (to: string) =>
  FILE.test(normalizeAddress(to).split(/[?#]/)[0]!.split('/').pop() ?? '')
const ownPath = (to: string) =>
  !opensElsewhere(to) && !/^[a-z][a-z\d+.-]*:/i.test(normalizeAddress(to)) && !isFile(to)

/**
 * The anchor UiLink, UiButton, UiListItem and UiAppShell draw for `to`: the app's link component for
 * its own paths, a plain `<a href>` otherwise. Attributes, the class and the slot pass through, but
 * an `href` among them, which the anchor would take over the address it computed: `to` is the only
 * address. One that runs script or carries a document (`javascript:`, `data:`) is refused here, for
 * every caller at once: the slot shows in a `<span>` read as a link that is not available, and dev
 * warns once. An address may come from the app's data (a tenant's menu), so a caller that forgets
 * the check must not open it; and the data may hold none (`null`, nothing, blank) or no string at all
 * (a number) whatever the types say, which draws the same `<span>`, on a server too.
 */
export const RouteLink = defineComponent({
  name: 'RouteLink',
  inheritAttrs: false,
  props: { to: { type: String, required: true } },
  setup(props, { attrs, slots }) {
    const given = inject(LINK, null)
    const router = getCurrentInstance()?.appContext.components.RouterLink as Component | undefined
    const refused = () => unsafeHref(props.to)
    watch(
      refused,
      (no) => {
        if (no && isDev())
          console.warn(
            '[grani] A link refuses a script or data address; its text shows with no link.',
          )
      },
      { immediate: true },
    )
    return () => {
      const rest: Record<string, unknown> = { ...attrs, 'data-grani': '' }
      delete rest.href
      if (!hasAddress(props.to) || refused())
        return h('span', { ...rest, role: 'link', 'aria-disabled': 'true' }, slots.default?.())
      const link = ownPath(props.to) ? (given ?? router) : undefined
      // The address as the parser reads it: one padded with spaces from data reaches a router whole.
      const to = normalizeAddress(props.to)
      return link
        ? h(link, { ...rest, to }, slots)
        : h('a', { ...rest, href: to }, slots.default?.())
    }
  },
})
