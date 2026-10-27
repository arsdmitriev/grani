// The least use of a component, read from its API reference (`api.json` beside this file). The
// package's text for language models and the showcase's page write it the same way.

/** The part of a component's reference this reads. */
interface Reference {
  props: { name: string; required?: boolean }[]
  events: { name: string }[]
  slots: { name: string }[]
}

const attr = (prop: string) => prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * The least a component needs, from its reference rather than from a demo: the tag with its
 * required props, a two-way one as `v-model`, and content when it takes a default slot. A demo
 * shows what the component can do; this shows what it cannot do without.
 */
export function minimalOf(name: string, api: Reference): string {
  const twoWay = new Set(api.events.map((e) => e.name.replace(/^update:/, '')))
  // `items` left optional beside a default slot is one of two ways to fill it (a filter's one
  // dimension or its sections): the least use is the one with `items`, an empty tag shows nothing.
  const byItems =
    api.props.some((p) => p.name === 'items' && !p.required) &&
    api.slots.some((s) => s.name === 'default')
  const wanted = (p: { name: string; required?: boolean }) =>
    p.required || (byItems && (p.name === 'items' || p.name === 'modelValue'))
  const bound = api.props.filter(wanted).map((p) => {
    if (twoWay.has(p.name))
      return p.name === 'modelValue' ? 'v-model="value"' : `v-model:${attr(p.name)}="${p.name}"`
    return `:${attr(p.name)}="${p.name}"`
  })
  const open =
    bound.length > 2
      ? `<${name}\n  ${bound.join('\n  ')}\n`
      : `<${name}${bound.map((b) => ` ${b}`).join('')}`
  const content = !byItems && api.slots.some((s) => s.name === 'default')
  if (!content) return bound.length > 2 ? `${open}/>` : `${open} />`
  return `${open}>…</${name}>`
}
