import { fileURLToPath } from 'node:url'

const components = fileURLToPath(new URL('../components/', import.meta.url))

// The compiler's node kinds: a plain HTML element (an SVG's marks need no ring), an attribute.
const ELEMENT = 1
const PLAIN = 0
const HTML = 0
const ATTRIBUTE = 6

/** @type {(node: any, context: { filename: string }) => void} */
function markElement(node, context) {
  if (node.type !== ELEMENT || node.tagType !== PLAIN || node.ns !== HTML) return
  if (!context.filename.startsWith(components)) return
  if (node.props.some((p) => p.type === ATTRIBUTE && p.name === 'data-grani')) return
  node.props.push({
    type: ATTRIBUTE,
    name: 'data-grani',
    value: undefined,
    loc: node.loc,
    nameLoc: node.loc,
  })
}

/**
 * The mark of grani's own elements. Every HTML element a template in `components/` draws carries
 * `data-grani`, put on by the template compiler, so the stylesheet gives grani's elements what
 * they need (a border color, the focus ring, a pointer) without a rule for the whole page: what the
 * app writes, a slot's content included, never carries it. An element a render function or a
 * `<component :is>` draws sets it by hand. It is this repository's build step and is not published:
 * every build here that compiles the components takes it
 * (`vue({ template: { compilerOptions: graniElements } })`), and the published `dist` already
 * carries the attribute.
 */
export const graniElements = { nodeTransforms: [markElement] }
