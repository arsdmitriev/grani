import type { Component, ComputedRef, Ref } from 'vue'
import { graniKey } from './key'

/** A card inside an overlay body is a section of it: no frame, no padding of its own. */
export const FLAT_CARD = graniKey<boolean>('card-flat')

/** The id of the enclosing card's heading: a group inside the card can be named by it. */
export const CARD_TITLE_ID = graniKey<ComputedRef<string | undefined>>('card-title-id')

/** The nesting depth of cards: a card's heading is `h2` at depth 0, `h3` below. */
export const CARD_DEPTH = graniKey<number>('card-depth')

export type Gutter = 'overlay' | 'surface' | 'surface-md' | 'drawer' | 'field'
/** The gutter of the surface, a `--space-*` token: a separator and a list in it bleed to its edges. */
export const SURFACE_GUTTER = graniKey<Gutter | null>('surface-gutter')
/** The side margins that run a row or a chart to the edges of a surface with this gutter. */
export const BLEED = {
  overlay: '-mx-overlay',
  surface: '-mx-surface',
  'surface-md': '-mx-surface-md',
  drawer: '-mx-drawer',
  field: '-mx-3',
} as const
/** The dash before a legend's title: with the `gap-2` after it, it puts the title on the gutter, where the fields start. */
export const LEGEND_DASH = {
  overlay: 'before:w-[calc(var(--space-overlay)-0.5rem)]',
  surface: 'before:w-[calc(var(--space-surface)-0.5rem)]',
  'surface-md': 'before:w-[calc(var(--space-surface-md)-0.5rem)]',
  drawer: 'before:w-[calc(var(--space-drawer)-0.5rem)]',
  field: 'before:w-1',
} as const
/** The inset of a surface whose body runs edge to edge (a card of rows): a row pads its text to it, nothing bleeds. */
export const ROW_INSET = graniKey<Gutter | null>('row-inset')
/** The padding that puts a row's text on the gutter. */
export const GUTTER_PAD = {
  overlay: 'px-overlay',
  surface: 'px-surface',
  'surface-md': 'px-surface-md',
  drawer: 'px-drawer',
  field: 'px-3',
} as const
/** A chart that runs to its card's sides: the gutter its words keep to, `null` when it stays inside. */
export const CHART_BLEED = graniKey<ComputedRef<Gutter | null>>('chart-bleed')
/** The bottom margin that runs a chart to the floor of a surface with this gutter. */
export const FLOOR = { surface: '-mb-surface', 'surface-md': '-mb-surface-md' } as const
/** The padding a chart's legend keeps above the card's floor: the gutter, under it. */
export const FLOOR_PAD = {
  overlay: 'pb-overlay',
  surface: 'pb-surface',
  'surface-md': 'pb-surface-md',
  drawer: 'pb-drawer',
  field: 'pb-3',
} as const
/** A chart bled to the card's floor as well (`bleed="full"`, no footer): its last row keeps the gutter above the card's edge. */
export const CHART_FLOOR = graniKey<ComputedRef<boolean>>('chart-floor')
/** A chart card with nothing to draw: a chart inside holds its first load's shape, so the card keeps its height; the card hides it under its words. */
export const CHART_EMPTY = graniKey<ComputedRef<boolean>>('chart-empty')
/** A chart card's first load: a chart inside draws a skeleton in its own shape in place of its marks. */
export const CHART_SKELETON = graniKey<ComputedRef<boolean>>('chart-skeleton')
/** A list that searches (UiDataTable): its table stands on a floor its empty, failed and loading states share. */
export const TABLE_FLOOR = graniKey<boolean>('table-floor')

/**
 * A pattern laid over UiDrawer (a record) leads what the side panel cannot know: where Escape,
 * the backdrop and the cross go (a level up, a refusal), what stands before and beside the title,
 * the form round the body and the footer, and the body of each level. The drawer keeps the panel,
 * the stack, the page held still and the focus. One way: the pattern gives, the drawer calls and
 * reads; it never writes into it. It reaches only the drawer the pattern renders: the drawer clears
 * it for what it holds.
 */
export interface DrawerPattern {
  /** Each time the drawer opens, before the focus goes in. */
  readonly onOpen: () => void
  /** Escape or a press on the backdrop that is the drawer's. */
  readonly exit: () => void
  /** The cross. */
  readonly cross: () => void
  /** The pattern's own refusal: the panel shakes while it is true. */
  readonly shaking: Readonly<Ref<boolean>>
  /** Why it last refused, said inside the panel. */
  readonly said: Readonly<Ref<string>>
  /** The body opens with a legend: the header draws no line of its own. */
  readonly opensWithLegend: () => boolean
  /** Before the title: the way up a level. */
  readonly lead: Component
  /** Beside the title: a status. */
  readonly status: Component
  /** Round the body and the footer: the record's form. */
  readonly form: Component
  /** The body of a level: its key (a new level is a new body, sliding in), its class, the focus entering it. */
  readonly body: () => { key: number; class: string; onFocusin: () => void }
}
export const DRAWER_PATTERN = graniKey<DrawerPattern | null>('drawer-pattern')

/** What a drawer gives what it renders inside it: a pattern's form finds the panel and the body here. */
export interface DrawerParts {
  readonly panel: Readonly<Ref<HTMLElement | null>>
  readonly body: Readonly<Ref<HTMLElement | null>>
}
export const DRAWER_PARTS = graniKey<DrawerParts | null>('drawer-parts')
