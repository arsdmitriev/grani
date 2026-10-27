import type { InjectionKey } from 'vue'
import { version } from '../package.json'

/**
 * Two copies of grani can meet on one page: the app and a library of its own depend on different
 * versions, or a monorepo does not dedupe. Every injection key is registered per line of the
 * version: copies of one line share the app's settings, a field's wiring and the link component,
 * while copies of different lines stay apart instead of reading each other's shape. The line is the
 * major and the minor (`0.1`, `1.2`), never the major alone: what the copies share is internal (the
 * scope, the toasts, the question, the overlay layers), and a minor may change its shape without
 * breaking anything public. So 0.1.0 and 0.1.7 share; 1.1 and 1.2 stay apart.
 * @internal
 */
export function versionLine(v: string = version): string {
  const [major = '0', minor = '0'] = v.split('.')
  return `${major}.${minor}`
}

/** The key under `name` for this copy's line: `grani@0.1:scope`. @internal */
export function graniKey<T>(name: string, v: string = version): InjectionKey<T> {
  return Symbol.for(`grani@${versionLine(v)}:${name}`) as InjectionKey<T>
}

/** The versions loaded on the page and the sets of them already warned about. The page's, read by every copy. */
interface Copies {
  versions: Set<string>
  warned: Set<string>
}

// Read by every version, so numbered by its shape: a new shape takes the next number.
const COPIES = Symbol.for('grani:copies@1')

const copies = (): Copies => {
  const g = globalThis as typeof globalThis & { [COPIES]?: Copies }
  return (g[COPIES] ??= { versions: new Set(), warned: new Set() })
}

/** Records a copy's version on the page; every copy does it once, as it loads. @internal */
export function registerCopy(v: string = version): void {
  copies().versions.add(v)
}

/**
 * The warning for the versions on the page, once per set of them; `null` for one version or a set
 * already told. Two copies are twice the code; two lines are also two settings and two link
 * components, and a field of one does not label a control of the other.
 * @internal
 */
export function copiesWarning(): string | null {
  const { versions, warned } = copies()
  if (versions.size < 2) return null
  const all = [...versions].sort()
  const id = all.join(' ')
  if (warned.has(id)) return null
  warned.add(id)
  const apart = new Set(all.map((v) => versionLine(v))).size > 1
  return (
    `[grani] ${all.length} copies on one page: ${all.join(', ')}. ` +
    (apart
      ? 'Copies of different minor versions share no settings, toasts, questions, fields or links. '
      : 'They share settings, fields and links, but the code ships twice. ') +
    'Dedupe grani to one version (npm dedupe, or one version in every package.json).'
  )
}

registerCopy()
