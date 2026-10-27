import { computed, getCurrentScope, onScopeDispose, provide, ref, type Ref } from 'vue'
import { createAnnouncer } from '../utils/announce'
import { GROUP_AXIS, GROUP_NESTED } from '../utils/groupAxis'
import { resetRows } from '../utils/rowSize'
import {
  CARD_DEPTH,
  CARD_TITLE_ID,
  FLAT_CARD,
  ROW_INSET,
  SURFACE_GUTTER,
  type Gutter,
} from '../utils/surface'
import { useUiT } from './useUiT'
import { hideField } from '../utils/field'

/*
 * What a window, a drawer and a popover share about the body they hold, written once: what the
 * surface tells the cards inside it, and the guard on the ways out. The sections and their lines
 * know the components they are made of, so they live beside them (`components/overlaySections`).
 */

/** What a surface tells what it holds. */
export interface SurfaceOptions {
  /** Its cards are its flat sections (a drawer, a popover), or framed cards (a window). */
  flat: boolean
  /** The id of its title, which names a group in a card; none for a popover, whose button names it. */
  titleId?: string
  /** Its gutter: a separator or a list in it bleeds through it. `null` for a body of rows edge to edge. */
  gutter: Gutter | null
  /** The inset a row pads its text to, for a body of rows edge to edge. */
  inset?: Gutter | null
}

/**
 * Provides what a surface tells the cards, rows and groups inside it, also when it was declared
 * inside another surface (a window in a drawer), whose provides reach it through the teleport: its
 * cards are `h3` under its title, its separators lie across it whatever group its button sat in,
 * and its rows are its own, not a sidebar's or a menu's.
 */
export function provideSurface(o: SurfaceOptions): void {
  provide(FLAT_CARD, o.flat)
  provide(CARD_DEPTH, 1)
  provide(
    CARD_TITLE_ID,
    computed(() => o.titleId),
  )
  provide(GROUP_AXIS, ref('vertical'))
  provide(GROUP_NESTED, false)
  provide(SURFACE_GUTTER, o.gutter)
  provide(ROW_INSET, o.inset ?? null)
  resetRows()
  // A window or a panel declared inside a field is not its control: the label names one control,
  // and the error is that one's, not of every field in the window.
  hideField()
}

/** Why a way out was refused: a request on its way, input not saved, or input not saved on a level above (the cross at a step of UiCrudDrawer). */
export type Refusal = 'busy' | 'unsaved' | 'unsavedAbove'

// How long a refusal stays in its region once said: long enough to be read, short enough not to
// stand there, read in a reader's browse mode, after the input was saved or the request came back.
const SAID_FOR = 5000

/**
 * A refusal answered with a shake, true for 400 ms (the length of the `ui-shake` animation), and one
 * with a reason said: `said` is the text of a status region the surface keeps inside its panel, since
 * a reader keeps to an `aria-modal` window and may not hear the page's own region. The newest
 * refusal replaces one still waiting, so a held Escape is said once, after it is let go; the same
 * reason pressed again later is said again. `hush` empties it when the surface opens again.
 */
export function useShake() {
  const { t } = useUiT()
  const shaking = ref(false)
  const said = ref('')
  const voice = createAnnouncer()
  let fade: ReturnType<typeof setTimeout> | undefined
  const hush = () => {
    voice.stop()
    clearTimeout(fade)
    said.value = ''
  }
  if (getCurrentScope()) onScopeDispose(hush)
  const refuse = (why?: Refusal) => {
    if (why) {
      voice.stop()
      clearTimeout(fade)
      voice.say(
        (words) => {
          said.value = words
          if (words) fade = setTimeout(() => (said.value = ''), SAID_FOR)
        },
        t(
          why === 'busy'
            ? 'grani.overlay.busy'
            : why === 'unsavedAbove'
              ? 'grani.overlay.unsavedAbove'
              : 'grani.overlay.unsaved',
        ),
      )
    }
    if (shaking.value) return
    shaking.value = true
    setTimeout(() => (shaking.value = false), 400)
  }
  return { shaking, refuse, said, hush }
}

export interface ExitOptions {
  /** The surface's `open` model. */
  open: Ref<boolean>
  /** Said when a way out closed it: the host emits `close`. */
  closed: () => void
  /** A request is out: every way out is refused. */
  submitting: () => boolean
  /** Unsaved input: every way out but an explicit one (the cross, Cancel) is refused. */
  guarded: () => boolean
  /** Shakes the surface and says why: a refusal is answered, since silence reads as a frozen page. */
  refuse: (why: Refusal) => void
}

/** The ways out of a window or a drawer, guarded once for all of them. */
export function useExits(o: ExitOptions) {
  const close = () => {
    if (!o.open.value) return
    o.open.value = false
    o.closed()
  }
  /** Whether a way out may go; a refused one shakes and says why. `explicit` is the cross or Cancel: it passes unsaved input, never a request. */
  const allows = (explicit: boolean) => {
    const why: Refusal | null = o.submitting()
      ? 'busy'
      : o.guarded() && !explicit
        ? 'unsaved'
        : null
    if (why) o.refuse(why)
    return !why
  }
  /** Closes, unless the guard refuses. */
  const requestClose = (explicit: boolean) => {
    if (allows(explicit)) close()
  }
  return { close, allows, requestClose }
}
