<!--
  UiAppShell: the frame of an app, a sidebar of its places with the page beside it. It is the root
  of the app's layout, with UiToaster and UiConfirm mounted beside it.

  Sidebar. The sidebar holds the logo (a link home), the places in groups (`nav`, each a link of
  the panel list's rows, `utils/panelList`, with a Lucide icon, a label cut to one line, and a count), `#banner` above the foot (a goal,
  a notice), and `#footer` at the bottom.

  Current place. One place is lit, its label semibold: the one whose `to` is `current` itself (a
  section of one page, `#billing`), else the deepest whose `to` contains its path, a trailing slash
  no part of it; `home` and the root `/` are lit only on themselves, and of two places with one
  address the first. The app passes `current`, since the shell knows no router. Under forced colors
  the current place takes the highlight.

  Collapsing. On desktop the sidebar collapses to its icons, by the button beside the logo (under
  `#mark`, or alone when collapsed) or by Ctrl or ⌘ B; each icon is named by a UiTooltip. Collapsed
  without `#mark` there is no link home, so the app lists home among its places; dev warns when it
  does not, and when `current` is not given. `v-model:collapsed` keeps the state where the app wants
  it; keeping it across visits is the app's: write it on `update:collapsed` (a cookie) and read it
  in setup, so the first paint is already right, on the server too; read after mount, the sidebar
  opens out and slides back. When it is bound, the shell follows it and only asks for a change.

  Narrow. Narrow means the shell's own width is under 768px. There a bar holds the menu button and
  the logo, and the sidebar slides in from the start as a sheet (by the menu button, or Ctrl or ⌘
  B). The focus moves in and stays; Escape or the backdrop closes the sheet, and so does a new
  `current`.

  Keys. The keys do nothing under a window or a panel. With two shells, they reach the one the focus
  is in, else the first. In Firefox, Ctrl or ⌘ B is the bookmarks sidebar's too: where the shell acts
  on the key it takes it, held as well.

  Loading. While the app's places are on their way (`loading`, `nav` still empty) the sidebar draws
  five rows in their shape, a glyph's square and a line; the logo, the collapse button and `#footer`
  are there at once, and `#banner` waits. Collapsed, the rows are their squares alone. When the places
  come nothing moves: the rows are the places' height, the sidebar its width; for places in one group
  without a heading, since a second group or a heading moves the rows under the first. With places
  already in view `loading` changes nothing: a sidebar is not dimmed for a refresh.

  Height. The page scrolls inside the shell, which is as tall as the window unless
  `--ui-shell-height` says otherwise. A new path opens the page at its top; a new hash, a section of
  the same page, keeps the place.

  Keyboard.
  The first stop is a skip link, shown only while focused. Then come the link home, the collapse
  button and the places, each a link.
  - `Enter`: on the skip link, puts the focus on the page.
  - `Ctrl+B` `Meta+B`: Ctrl or ⌘ B collapses the sidebar, or opens and closes the sheet while the
    shell is narrow; not while typing in a text field or an editor, not under a window or a panel,
    and a held key toggles once.
  In the sheet, where the focus moves in:
  - `Tab`: stays inside.
  - `Escape`: closes it, as the backdrop does, and the focus returns to the menu button.
  Collapsing from the link home or from `#banner` hands the focus to the collapse button, so it is
  never dropped.

  Reader.
  - Skip link: comes first.
  - Sidebar: a navigation landmark, and the sheet a modal dialog of the same name.
  - Group: its heading names its list, open and collapsed.
  - Current place: `aria-current="page"`.
  - Collapsed row: named by its label and its count; the count on the icon's corner is a mark the
    reader skips.
  - Buttons: the collapse and menu buttons say what they open (`aria-expanded`, `aria-controls`).
  - Logo: a link named by the brand and "home".
  - Loading: a status region, always there, says "Loading…" while the places come; the navigation
    is busy (`aria-busy`), so the sheet opened meanwhile says it too; the rows in their shape are
    hidden.

  States. Desktop open; desktop collapsed to icons, each named by a tooltip, with `#banner` gone;
  narrow, with the sheet closed or open, showing the full sidebar even when the desktop one is
  collapsed; loading, open and collapsed, with rows in the places' shape. On a row: hover, focus, and the current place, which takes the highlight under forced
  colors. In dev, a missing `current` and a collapsed head with no way home warn.

  Not for.
  - A set of panes on one screen: UiTabs.
  - A window or a panel over the page: UiModal or UiDrawer.
  - The name of the page inside the main area: UiHeader `page`.
  - Places inside a section of a page: UiListItem links in a UiList.
-->
<template>
  <div
    ref="rootRef"
    class="@container relative h-[var(--ui-shell-height,100dvh)] overflow-hidden bg-bg text-fg"
  >
    <!-- The first stop: past the sidebar straight to the page. -->
    <a
      :href="`#${mainId}`"
      class="sr-only z-overlay rounded-control border border-border bg-surface px-3 py-2 text-sm/5.5 font-medium text-fg focus:not-sr-only focus:absolute focus:start-2 focus:top-2"
      @click.prevent="toMain"
      >{{ t('grani.appShell.skip') }}</a
    >
    <!-- Outside the sidebar, which a narrow shell hides: a region nobody can see is not read. -->
    <p class="sr-only" role="status">{{ placesSaid }}</p>
    <div class="flex h-full">
      <Transition
        enter-from-class="opacity-0"
        enter-active-class="transition-opacity duration-normal ease-standard"
        leave-to-class="opacity-0"
        leave-active-class="transition-opacity duration-normal ease-standard"
      >
        <div
          v-if="sheet"
          ref="backdropRef"
          class="absolute inset-0 z-overlay bg-backdrop/50 @3xl:hidden"
          aria-hidden="true"
        />
      </Transition>
      <div
        :id="sidebarId"
        ref="sidebarRef"
        data-sidebar
        :role="sheet ? 'dialog' : undefined"
        :aria-modal="sheet || undefined"
        :aria-label="sheet ? t('grani.appShell.nav') : undefined"
        tabindex="-1"
        class="absolute inset-y-0 start-0 z-overlay flex w-72 max-w-[85%] flex-col border-e border-border bg-surface shadow-xl duration-travel ease-enter focus:outline-hidden @3xl:visible @3xl:static @3xl:z-auto @3xl:max-w-none @3xl:translate-x-0 @3xl:shadow-none"
        :class="[
          // Shown at once on the way in, so the focus can land; hidden only after the slide out.
          sheet
            ? 'visible translate-x-0 transition-[transform,width]'
            : 'invisible -translate-x-full transition-[transform,visibility,width] rtl:translate-x-full @3xl:rtl:translate-x-0',
          // 68 inside the line: a 36px row between two 16px gutters.
          compact ? '@3xl:w-[calc(4.25rem+1px)]' : '@3xl:w-64',
        ]"
      >
        <div
          class="flex shrink-0 gap-2 border-b border-border px-4"
          :class="compact && $slots.mark ? 'flex-col py-2' : 'h-14 items-center'"
        >
          <!-- Collapsed, the head holds the mark over the button, or the button alone: a letter among glyphs reads as noise. -->
          <RouteLink
            v-if="!compact || $slots.mark"
            ref="homeRef"
            :to="home"
            :aria-label="t('grani.appShell.home', { brand: name })"
            class="flex h-9 min-w-0 items-center rounded-control focus:outline-hidden"
            :class="
              compact
                ? 'w-9 justify-center [&>img]:h-6 [&>img]:w-6 [&>svg]:h-6 [&>svg]:w-6'
                : 'flex-1 gap-2 px-2 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:shrink-0'
            "
            @click="sheet = false"
          >
            <slot v-if="compact" name="mark" />
            <slot v-else name="logo">
              <span class="truncate text-base font-semibold text-fg">{{ name }}</span>
            </slot>
          </RouteLink>
          <!-- One node in both states: the focus stays on it across the click. -->
          <div v-if="!sheet" class="hidden @3xl:block">
            <UiTooltip
              :content="compact ? t('grani.appShell.expand') : t('grani.appShell.collapse')"
              :side="compact ? 'right' : 'bottom'"
            >
              <UiIconButton
                ref="toggleRef"
                :icon="compact ? PanelLeftOpen : PanelLeftClose"
                :ariaLabel="t('grani.appShell.sidebar')"
                :aria-expanded="!compact"
                :aria-controls="sidebarId"
                variant="ghost"
                size="sm"
                class="rtl:[&_svg]:-scale-x-100"
                @click="setCollapsed(!collapsedNow)"
              />
            </UiTooltip>
          </div>
          <UiIconButton
            v-if="sheet"
            :icon="X"
            :ariaLabel="t('grani.appShell.close')"
            variant="ghost"
            size="sm"
            class="-me-1"
            @click="sheet = false"
          />
        </div>
        <nav
          :aria-label="sheet ? undefined : t('grani.appShell.nav')"
          :aria-busy="placesLoading || undefined"
          class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4"
        >
          <!-- The places on their way: rows in their shape, so nothing moves when they come. -->
          <div v-if="placesLoading" class="flex flex-col gap-2" aria-hidden="true" data-skeleton>
            <div
              v-for="(width, i) in SKELETON_WIDTHS"
              :key="i"
              class="flex h-9 items-center gap-3 px-2"
            >
              <UiSkeleton class="h-5 w-5 shrink-0" />
              <span v-if="!compact" class="block min-w-0 flex-1 text-sm/5.5">
                <UiSkeleton class="inline-block h-3 align-middle" :class="width" />
              </span>
            </div>
          </div>
          <RowScope v-else>
            <div v-for="(group, gi) in groups" :key="gi" class="flex flex-col gap-2">
              <UiSeparator v-if="compact && gi > 0" class="-mt-2" />
              <!-- Collapsed, the group's name stays for a screen reader: its list is still named. -->
              <UiTruncate
                v-if="group.label"
                :id="`${sidebarId}-g${gi}`"
                :text="group.label"
                class="px-2 text-xs/4.5 font-medium text-fg-muted"
                :class="compact ? 'sr-only' : ''"
              />
              <ul
                class="flex flex-col gap-2"
                :aria-labelledby="group.label ? `${sidebarId}-g${gi}` : undefined"
              >
                <li v-for="(item, i) in group.items" :key="rowKey(group.items, i)">
                  <UiTooltip :content="compact ? tip(item) : ''" side="right">
                    <PanelRow
                      purpose="place"
                      :to="item.to"
                      :class="[RING_ON_ROW, 'ui-current']"
                      :aria-label="compact ? tip(item) : undefined"
                      :aria-current="item === currentItem ? 'page' : undefined"
                      @click="sheet = false"
                    >
                      <!-- Collapsed, the count stays on screen as a mark on the icon's corner. -->
                      <template #media>
                        <UiIndicator
                          v-if="compact && countValue(item.count) > 0"
                          :count="item.count"
                          size="sm"
                          tone="brand"
                        >
                          <!-- The row sizes its own glyph; inside the mark's wrapper it is no longer its child. -->
                          <component :is="item.icon" class="h-5 w-5" />
                        </UiIndicator>
                        <component :is="item.icon" v-else />
                      </template>
                      <!-- The weight on the words themselves: one on the row would lose to theirs. -->
                      <UiTruncate
                        v-if="!compact"
                        :text="item.label"
                        class="text-sm/5.5 text-fg"
                        :class="item === currentItem ? 'font-semibold' : 'font-medium'"
                      />
                      <!-- A link is named by its label; a place the data gave no address is a row with no role, read by its words. -->
                      <span v-else-if="!hasAddress(item.to)" class="sr-only">{{ tip(item) }}</span>
                      <template v-if="countValue(item.count) > 0 && !compact" #actions>
                        <UiCount :count="item.count" />
                      </template>
                    </PanelRow>
                  </UiTooltip>
                </li>
              </ul>
            </div>
          </RowScope>
        </nav>
        <!-- Under its line, the words on the places' icons: 16 of the sidebar and 8 of a row. -->
        <div
          v-if="$slots.banner && !compact && !placesLoading"
          ref="bannerRef"
          class="shrink-0 border-t border-border px-6 py-4"
        >
          <slot name="banner" />
        </div>
        <div v-if="$slots.footer" class="shrink-0 border-t border-border p-4">
          <RowScope><slot name="footer" :collapsed="compact" /></RowScope>
        </div>
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 @3xl:hidden"
        >
          <UiIconButton
            ref="menuRef"
            :icon="Menu"
            :ariaLabel="t('grani.appShell.open')"
            :aria-expanded="sheet"
            :aria-controls="sidebarId"
            variant="ghost"
            size="sm"
            @click="sheet = true"
          />
          <RouteLink
            :to="home"
            :aria-label="t('grani.appShell.home', { brand: name })"
            class="flex h-9 min-w-0 items-center gap-2 rounded-control px-1 focus:outline-hidden [&>svg]:h-6 [&>svg]:w-6 [&>svg]:shrink-0"
          >
            <slot name="logo">
              <span class="truncate text-base font-semibold text-fg">{{ name }}</span>
            </slot>
          </RouteLink>
        </header>
        <main
          :id="mainId"
          ref="mainRef"
          tabindex="-1"
          class="min-h-0 flex-1 overflow-y-auto p-4 focus:outline-hidden @3xl:p-6"
        >
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref as vueRef } from 'vue'
import { provideLooseRows, provideRowSize } from '../utils/rowSize'

// The shells mounted on the page, first mounted first: Ctrl or ⌘ B with the focus in none goes to the first.
const SHELLS: HTMLElement[] = []

// The sidebar's rows, dense and no list's: a row in its footer keeps its own height. A row on the
// page, in `#banner` or in a window opened from the page stays a row of its own kind.
const RowScope = defineComponent({
  setup(_, { slots }) {
    provideLooseRows(true)
    provideRowSize(vueRef('sm'))
    return () => slots.default?.()
  },
})
</script>

<script setup lang="ts">
import { RouteLink } from '../utils/routeLink'
import { hasAddress, normalizeAddress } from '../utils/link'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from '@lucide/vue'
import type { NavGroup, NavItem } from '../types/ui'
import { useUiT } from '../composables/useUiT'
import { useLiveText } from '../utils/liveText'
import { isDev } from '../utils/dev'
import { useOverlayShell } from '../composables/useOverlayShell'
import { useOverlayStack } from '../composables/useOverlayStack'
import UiCount from './UiCount.vue'
import UiIndicator from './UiIndicator.vue'
import { countText, countValue } from '../utils/count'
import UiIconButton from './UiIconButton.vue'
import PanelRow from './PanelRow.vue'
import UiSkeleton from './UiSkeleton.vue'
import UiSeparator from './UiSeparator.vue'
import UiTooltip from './UiTooltip.vue'
import UiTruncate from './UiTruncate.vue'

const props = withDefaults(
  defineProps<{
    /** The places of the app, in groups; an empty `label` draws none. */
    nav: NavGroup[]
    /** The app's name: the logo when `#logo` is not given, and the name of the link home; unset, a translated "App". */
    brand?: string
    /** Where the logo leads; the item on it is the current page only on it, not under it. A `javascript:` or `data:` address is refused, as for the places. */
    home?: string
    /** The path of the page shown (`useRoute().path`): it lights its item and closes the sheet. */
    current?: string
    /** Desktop: only the icons show. Bound to a value, the shell follows it and only asks through `update:collapsed`; unbound or `undefined`, it keeps its own. */
    collapsed?: boolean
    /** The places are on their way: with `nav` still empty, the sidebar draws rows in their shape. */
    loading?: boolean
  }>(),
  { brand: '', home: '/', current: '', collapsed: undefined, loading: false },
)

const emit = defineEmits<{
  /** The sidebar was collapsed or opened out: its button or Ctrl or ⌘ B. */
  'update:collapsed': [value: boolean]
}>()

defineSlots<{
  /** The logo in the sidebar's head and in the narrow bar: a mark and the name. */
  logo(props: Record<string, never>): any
  /** The mark alone, for the collapsed sidebar: a 24px glyph or image, over the button. Without it the collapsed head holds the button alone. */
  mark(props: Record<string, never>): any
  /** A band under a line at the foot of the sidebar: a goal with its bar, a notice. Its words stand on the places' icons. The collapsed sidebar has no room for it. */
  banner(props: Record<string, never>): any
  /** The foot of the sidebar: the person signed in, a switch of theme. */
  footer(props: { collapsed: boolean }): any
  /** The page. */
  default(props: Record<string, never>): any
}>()

const slots = useSlots()
const { t } = useUiT()
const uid = useId()
const sidebarId = `ui-app-shell-${uid}`
const mainId = `ui-app-shell-main-${uid}`
const mainRef = ref<HTMLElement | null>(null)
const bannerRef = ref<HTMLElement | null>(null)
// The skip link puts the focus on the page itself: no hash, the app's router is not asked.
const toMain = () => mainRef.value?.focus()
const rootRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)
const menuRef = ref<{ $el?: HTMLElement } | null>(null)

const name = computed(() => props.brand || t('grani.appShell.brand'))
// Bound, the value is the app's and the shell only asks; unbound, the shell keeps its own. An
// `undefined` is no value: a wrapper that passes its optional prop on is unbound until it holds one.
const bound = computed(() => props.collapsed !== undefined)
const own = ref(false)
const collapsedNow = computed(() => (bound.value ? Boolean(props.collapsed) : own.value))
// Let go of, the shell keeps the last value it was given, not its first.
watch(
  () => props.collapsed,
  (v) => {
    if (v !== undefined) own.value = v
  },
  { immediate: true },
)
const homeRef = ref<{ $el?: HTMLElement } | null>(null)
const toggleRef = ref<{ $el?: HTMLElement } | null>(null)
function setCollapsed(v: boolean) {
  // The link home leaves a collapsed head without `#mark`, and `#banner` leaves the collapsed
  // sidebar: a focus on either goes to the button, not to the page.
  const home = homeRef.value?.$el
  const at = document.activeElement
  const lose =
    v && ((!slots.mark && !!home && home.contains(at)) || Boolean(bannerRef.value?.contains(at)))
  if (!bound.value) own.value = v
  emit('update:collapsed', v)
  if (lose) void nextTick(() => toggleRef.value?.$el?.focus())
}
const sheet = ref(false)
// The sheet is always the full sidebar: a collapsed one would hide the names a phone needs.
const compact = computed(() => collapsedNow.value && !sheet.value)

const groups = computed(() => props.nav.filter((g) => g.items.length > 0))
// No places yet and more on the way: the sidebar draws their shape.
const placesLoading = computed(() => props.loading && groups.value.length === 0)
const placesSaid = useLiveText(() => (placesLoading.value ? t('grani.appShell.loading') : ''))
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-3/5']
// An address read as a path: trimmed as the link is, a trailing slash dropped (`/inbox/` is
// `/inbox`), the root kept.
const plain = (to: unknown) => {
  const at = normalizeAddress(to)
  return at.length > 1 ? at.replace(/\/+$/, '') : at
}
// A path with a query or a hash (`fullPath`) is read as its path: `/inbox?tab=1` lights Inbox.
const currentPath = computed(() => plain(props.current.split(/[?#]/)[0] ?? ''))
// A place the data gave no address is never the current page, and never a crash of the shell.
const matches = (item: NavItem) => {
  if (!hasAddress(item.to)) return false
  const to = plain(item.to)
  const path = currentPath.value
  // The page's whole address first: a place of one page's sections is its hash (`#billing`).
  if (to === plain(props.current)) return true
  // Home and the root hold only themselves: under them stands every page.
  if (to === plain(props.home) || to === '/') return path === to
  return path === to || path.startsWith(`${to}/`)
}
// One place is lit: the deepest that holds the page (`/orders/archive` over `/orders`), and of two
// with one address the first.
const currentItem = computed(
  () =>
    groups.value
      .flatMap((g) => g.items)
      .filter(matches)
      .sort((a, b) => plain(b.to).length - plain(a.to).length)[0],
)
// The mark's ring cuts it out of the row it stands on: the muted band of a hovered or focused row,
// the brand plate of the current place.
const RING_ON_ROW =
  'hover:[--ui-indicator-ring:var(--color-surface-muted)] focus-visible:[--ui-indicator-ring:var(--color-surface-muted)] aria-[current=page]:[--ui-indicator-ring:var(--color-brand-subtle)]'
// A row's key is its address, and the second of two places with one address its own: twins in the
// data would share a key and leave a row behind when the places are reordered.
const rowKey = (items: NavItem[], i: number) => {
  const to = items[i]!.to
  const twin = items.slice(0, i).filter((x) => x.to === to).length
  return twin ? `${to}#${twin}` : to
}
const tip = (item: NavItem) =>
  countValue(item.count) > 0 ? `${item.label}, ${countText(item.count)}` : item.label

// Going to a page closes the sheet, as the tap on the item did.
watch(
  () => props.current,
  () => (sheet.value = false),
)
// The page scrolls inside `main`, which the router's scroll to the top does not reach: a new path
// opens at its top. A new hash is a section of the same page and keeps the place.
watch(currentPath, () => {
  if (mainRef.value) mainRef.value.scrollTop = 0
})

// The sheet stands in the shell a window and a drawer stand in: the stack, the page held
// still, the focus kept in and given back to the menu button.
// A press that closed a popover above the sheet (a menu in `#footer`) is that popover's: the
// stack routes the backdrop and Escape to the sheet only while it is on top.
const backdropRef = vueRef<HTMLElement | null>(null)
useOverlayShell({
  open: sheet,
  panel: sidebarRef,
  backdrop: backdropRef,
  // Widened with the sheet open, the menu button is gone: the focus stays in the sidebar.
  returnFocus: () => narrow(),
  onEscape: () => (sheet.value = false),
  onOutside: () => (sheet.value = false),
})
const overlays = useOverlayStack()

// Ctrl or ⌘ B: the sheet when the shell is narrow (its menu button shows), the collapse else.
// Not while typing: in a field the keys are the text's (bold in an editor).
function onKey(e: KeyboardEvent) {
  if (e.defaultPrevented || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
  // The letter on a Latin layout (Dvorak puts B elsewhere); the physical key where it types
  // no Latin letter (on a Cyrillic layout it types \u0438).
  const key = e.key.toLowerCase()
  if (!(key === 'b' || (!/^[a-z]$/.test(key) && e.code === 'KeyB'))) return
  // Under a window or a panel the keys are theirs: the sheet would take the focus from under it.
  if (overlays.count() > (sheet.value ? 1 : 0)) return
  const target = e.target as HTMLElement | null
  if (target?.isContentEditable || target?.closest(TYPED)) return
  const root = rootRef.value
  const at = document.activeElement
  const mine = Boolean(root && at && root.contains(at))
  if (!mine && (SHELLS.some((s) => at && s.contains(at)) || SHELLS[0] !== root)) return
  // A held key is taken on every repeat, or the browser's own Ctrl or ⌘ B (Firefox's bookmarks)
  // would answer the repeats; it toggles once.
  e.preventDefault()
  if (e.repeat) return
  if (narrow()) sheet.value = !sheet.value
  else setCollapsed(!collapsedNow.value)
}
// Where text is typed the keys are the text's; a box, a radio or a button takes no text.
const TYPED =
  'textarea, select, input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="range"], [type="color"], [type="file"], [type="image"])'
const narrow = () => {
  const menu = menuRef.value?.$el
  return Boolean(menu && menu.offsetParent !== null)
}
// Widened past narrow with the sheet open: the sidebar is in its place, the sheet is gone.
let resize: ResizeObserver | undefined
// Said once the places are in, on mount or when a load brings them: a shell that starts loading
// has none to look among yet.
let saidHome = false
function checkHome() {
  if (placesLoading.value || saidHome || !isDev() || slots.mark) return
  saidHome = true
  const places = groups.value.flatMap((g) => g.items)
  if (!places.some((i) => plain(i.to) === plain(props.home)))
    console.warn(
      '[grani] UiAppShell: collapsed without `#mark`, home is not among the places: no way home.',
    )
}
watch(placesLoading, checkHome)
onMounted(() => {
  if (rootRef.value) SHELLS.push(rootRef.value)
  checkHome()
  if (isDev()) {
    if (!props.current)
      console.warn(
        '[grani] UiAppShell: pass `current` (the page path): no place is lit without it.',
      )
  }
  document.addEventListener('keydown', onKey)
  if (typeof ResizeObserver === 'undefined' || !rootRef.value) return
  resize = new ResizeObserver(() => {
    if (sheet.value && !narrow()) sheet.value = false
  })
  resize.observe(rootRef.value)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  const at = rootRef.value ? SHELLS.indexOf(rootRef.value) : -1
  if (at >= 0) SHELLS.splice(at, 1)
  resize?.disconnect()
})
</script>
