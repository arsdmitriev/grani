<!--
  UiLink: a link inside text, underlined at rest. Take it for a link in prose, a caption or a note.

  Underline. The underline tells the link apart from the words around it, since its color alone may
  not.

  New tab. Another site (or `target="_blank"`) opens in a new tab and says so: an arrow for the eye,
  a phrase for a screen reader.

  Scripts. An address that runs script (`javascript:`, `data:`) is not linked: the text stays, in
  the ink of the words around it, with no line and no href, and dev warns. So is no address at all,
  an empty `to` or one the app's data left out (`null`) or holds as no string (a number): a menu
  built from data renders, on a server too, with that item as text. A link focused when its address
  goes away drops the focus with it, as any element that leaves.

  Router. A path of the app (`/records/7`, `/people/john.doe`) goes through the link component given
  to `createGrani({ link })`, else the app's `RouterLink`, else a plain anchor; another site,
  `mailto:`, `tel:` and a file the server hands out (`/llms.txt`, `/report.pdf`) are plain anchors.
  An address padded with spaces is read trimmed.

  Placement. It sits in prose, a caption, a card's footer note, or a header beside the title. Its
  neighbors are UiButton `to` (an action) and UiListItem `to` (a whole row as the link), and it never
  goes inside either: a link in a link warns in dev.

  Wrapping. It never wraps, so a name or a command reads as one piece. A link is a few words: a
  long one is written shorter, not broken across lines.

  Keyboard.
  An anchor.
  - `Tab`: reaches it; a refused address (`javascript:`, `data:`) or none is plain text and takes no
    focus.
  - `Enter`: follows it; `Space` does not, as in the browser.

  Reader.
  - Name: the text.
  - New tab: another site, or `target="_blank"`, adds "opens in a new tab" after the text, where the
    eye sees an arrow, which is hidden. The notice follows the real target, so a `mailto:` or `tel:`
    link says nothing.
  - Attributes: native ones (`aria-current`, `hreflang`, `lang`, `title`) reach the anchor. An
    `aria-label` replaces the name and the notice with it: write "opens in a new tab" into it.

  States. Rest, underlined in the tone's ink (`brand`, `info`, `neutral`); hover, in the hover ink;
  focus. External with the arrow; internal, mail and phone without it. Always on one line. No
  disabled state: a refused or missing address shows as text.

  Not for.
  - An action: UiButton, with `to` when it looks like a button.
  - A whole row as the link: UiListItem `to`.
  - A link inside either: never; a link in a link (UiListItem or UiButton with `to`) warns in dev.
-->
<template>
  <component
    :is="safe ? RouteLink : 'span'"
    data-grani
    :to="safe ? to : undefined"
    :target="safe ? resolved.target : undefined"
    :rel="safe ? resolved.rel : undefined"
    :class="classes"
  >
    <slot /><ArrowUpRight
      v-if="safe && resolved.newTab"
      aria-hidden="true"
      class="ms-px inline h-3 w-3 align-[0.05em]"
    /><span v-if="safe && resolved.newTab" class="sr-only">{{
      ' ' + t('grani.link.external')
    }}</span>
  </component>
</template>

<script setup lang="ts">
import { RouteLink } from '../utils/routeLink'
import { computed, inject, onMounted, useSlots } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import { useUiT } from '../composables/useUiT'
import { isDev } from '../utils/dev'
import type { LinkTone } from '../types/ui'
import { hasAddress, INSIDE_LINK, linkTarget, unsafeHref } from '../utils/link'

const { t } = useUiT()

const props = withDefaults(
  defineProps<{
    /** A route or a URL; an absolute address is external, `mailto:` and `tel:` are not. `javascript:` and `data:` are refused: the text shows with no link. */
    to: string
    /** `brand` is the link color; `info` the signal blue, a link to look at; `neutral` a quiet link in a caption. */
    tone?: LinkTone
    /** `_blank` or `_self` overrides the default: a new tab for an external address only. */
    target?: '_blank' | '_self'
    /** Replaces the default `noreferrer`, e.g. `nofollow`, `sponsored`, `ugc`; `noopener` stays on a new tab. */
    rel?: string
  }>(),
  { tone: 'brand', target: undefined, rel: undefined },
)

defineSlots<{
  /** The link text. */
  default(props: Record<string, never>): any
}>()

// Resolved once for the three link components (utils/link): target, rel, the new tab. An address
// from the app's data may be no string at all, whatever the type says.
const given = computed(() => hasAddress(props.to))
const safe = computed(() => given.value && !unsafeHref(props.to))
const resolved = computed(() => linkTarget(props.to, props.target, props.rel))
const insideLink = inject(INSIDE_LINK, null)
const slots = useSlots()

// The line is the cue that is not color alone, in the link's own ink: a link's color beside
// body text is under 3:1 (the brand in one theme, the blue in both), so a faded line would not
// tell it from the words. Hover changes the ink.
const tones: Record<LinkTone, string> = {
  brand: 'text-brand decoration-brand hover:text-brand-hover hover:decoration-brand-hover',
  // Signal blue in the plate ink: the base token is 3:1 on dark, too faint for text.
  info: 'text-info-subtle-fg decoration-info-subtle-fg hover:decoration-fg hover:text-fg',
  neutral: 'text-fg-muted decoration-fg-muted hover:text-fg hover:decoration-fg',
}
// A refused or missing address is the words around it: no line, no ink, no hover, nothing that
// looks pressable and takes no press.
const classes = computed(() =>
  safe.value
    ? [
        'whitespace-nowrap rounded-badge underline decoration-1 underline-offset-[0.35em] focus:outline-hidden',
        'transition-[color,text-decoration-color] duration-fast ease-standard',
        tones[props.tone],
      ]
    : ['whitespace-nowrap'],
)

onMounted(() => {
  if (!isDev()) return
  if (!given.value)
    console.warn('[grani] UiLink has no address in `to`: the text shows with no link.')
  else if (!safe.value)
    console.warn('[grani] UiLink refuses a script or data address; the text shows with no link.')
  if (insideLink?.value)
    console.warn(
      '[grani] UiLink inside a link (a UiListItem or UiButton with `to`): two links in one.',
    )
  if (!slots.default) console.warn('[grani] UiLink has no text: the link has no name.')
})
</script>
