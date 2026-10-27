import { h, type VNode, type VNodeArrayChildren } from 'vue'
import { firstNode, leadsWith, withSeparators } from '../utils/sections'
import UiCard from './UiCard.vue'
import UiHeader from './UiHeader.vue'
import UiSeparator from './UiSeparator.vue'

/*
 * The sections of a window's, a drawer's or a popover's body and the lines between them, written
 * once: a section is a UiCard, and a UiHeader `legend` brings its own line. Here, beside the
 * components it reads, since a composable or a util never imports one.
 */

/** A UiHeader `legend`: a section's title and its line in one. */
export const isLegend = (v: VNode) =>
  v.type === UiHeader && (v.props as { variant?: string } | null)?.variant === 'legend'

/** A section, a UiCard, whose content opens with a legend: it has its line. Its default slot takes no props. */
export const leadsWithLegend = (card: VNode) =>
  leadsWith((card.children as { default?: () => unknown } | null)?.default?.(), isLegend)

/** A body whose first section opens with a legend, or that opens with one itself: the header above it draws no line. */
export const opensWithLegend = (nodes: unknown) => {
  const n = firstNode(nodes)
  return !!n && (n.type === UiCard ? leadsWithLegend(n) : leadsWith(n, isLegend))
}

/** The sections of a body with a line between two neighbors, none before one a legend opens. */
export const withLines = (nodes: VNodeArrayChildren): VNode[] =>
  withSeparators(nodes, UiCard, () => h(UiSeparator), leadsWithLegend)
