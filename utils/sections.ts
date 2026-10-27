import { Comment, Fragment, Text, type Component, type VNode, type VNodeArrayChildren } from 'vue'

// What a slot renders, read as parts: the sections of an overlay body, and whether a card's slot draws anything.

/** The children of a slot as the sections they render: fragments (v-for, v-if) opened, comments dropped. */
export const flatSections = (list: VNodeArrayChildren): VNode[] =>
  list.flatMap((n) => {
    if (!n || typeof n !== 'object') return []
    if (Array.isArray(n)) return flatSections(n)
    const v = n as VNode
    if (v.type === Fragment && Array.isArray(v.children)) return flatSections(v.children)
    return v.type === Comment ? [] : [v]
  })

/** Whether a slot draws anything: comments (a `v-if` that is off) and blank text are nothing. Read it at render. */
export const renders = (nodes: VNodeArrayChildren | undefined): boolean =>
  Boolean(
    nodes?.some((n) => {
      if (!n || typeof n !== 'object') return typeof n === 'string' ? n.trim() !== '' : false
      if (Array.isArray(n)) return renders(n)
      const v = n as VNode
      if (v.type === Comment) return false
      if (v.type === Text) return String(v.children).trim() !== ''
      if (v.type === Fragment) return renders(v.children as VNodeArrayChildren)
      return true
    }),
  )

/** The first node a list draws: comments and blank text skipped, fragments opened. */
export const firstNode = (nodes: unknown): VNode | undefined => {
  for (const n of (Array.isArray(nodes) ? nodes : [nodes]) as VNode[]) {
    if (!n || typeof n !== 'object' || n.type === Comment) continue
    if (n.type === Text && !String(n.children).trim()) continue
    if (n.type === Fragment) return firstNode(n.children)
    return n
  }
}

/**
 * Whether what a slot draws opens with a node `match` takes, looking through the first child of
 * plain elements and of a layout that draws nothing before its slot (UiStack, marked `layout`): any
 * other component draws what it likes before its slot, and its slot may want props.
 */
export const leadsWith = (nodes: unknown, match: (v: VNode) => boolean, depth = 0): boolean => {
  const n = firstNode(nodes)
  if (!n) return false
  if (match(n)) return true
  if (depth >= 3) return false
  if (typeof n.type === 'string') return leadsWith(n.children, match, depth + 1)
  const slots = n.children as { default?: () => unknown } | null
  return (n.type as { layout?: boolean }).layout === true && typeof slots?.default === 'function'
    ? leadsWith(slots.default(), match, depth + 1)
    : false
}

/**
 * The children of an overlay body, with a separator between two neighboring sections; none
 * before a section `lined` says draws its own line (a UiHeader legend first). Fragments (v-for,
 * v-if) are opened; a section inside a component of the caller's own is not seen.
 */
export function withSeparators(
  nodes: VNodeArrayChildren,
  section: Component,
  separator: () => VNode,
  lined: (next: VNode) => boolean = () => false,
): VNode[] {
  const out: VNode[] = []
  let prev: VNode | null = null
  for (const v of flatSections(nodes)) {
    if (prev?.type === section && v.type === section && !lined(v)) out.push(separator())
    out.push(v)
    prev = v
  }
  return out
}
