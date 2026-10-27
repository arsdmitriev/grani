// How a code name reads and where its page is: the package's text for language models and the
// showcase share it, so a page and its Markdown twin agree. Node reads this module, so a relative
// import carries its extension.
import { REGISTRY } from '../../registry.ts'

const ACRONYMS: Record<string, string> = {}

const LABELS: Record<string, string> = {
  UiCopyButton: 'Button copy',
  UiIconButton: 'Button icon',
  UiPasswordField: 'Input password',
}

/** `UiIconButton` -> "Icon button" as said, not as the rail sorts it: a search and a title read it. */
export const spokenLabelOf = (name: string) => {
  const words = name.replace(/^Ui/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
  const plain = words.charAt(0) + words.slice(1).toLowerCase()
  return plain
    .split(' ')
    .map((w, i) => ACRONYMS[i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)] ?? w)
    .join(' ')
}

/** `UiIconButton` -> "Button icon" on the rail, head first; the prefix is a namespace for code, not a word. */
export const labelOf = (name: string) => LABELS[name] ?? spokenLabelOf(name)

// `UiDataTable` -> "data-table": the address says what a person searches for.
export const componentSlug = (name: string) => slugOfLabel(spokenLabelOf(name))

export const slugOfLabel = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** A component's page, a pattern's too: every entry lives in Components under its name. */
export const pageOf = (name: string) => `/components/${componentSlug(name)}`

/** Where a pattern's page stood before it joined the components; kept as a way to the new one. */
export const formerPatternPageOf = (name: string) =>
  REGISTRY[name]?.level === 'pattern' ? `/patterns/${slugOfLabel(labelOf(name))}` : null
