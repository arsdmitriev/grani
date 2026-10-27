import {
  cloneVNode,
  Comment,
  Fragment,
  getCurrentInstance,
  h,
  ref,
  type Ref,
  type VNode,
} from 'vue'
import { isDev, warnOnce } from '../utils/dev'

/**
 * The caller's button in a `#trigger` slot, wired to the popup it opens: an id, the
 * `aria-haspopup`, `aria-expanded` and `aria-controls` it announces, and the listeners.
 * The element is found by that id, not by a ref: the trigger may be a component whose root is
 * not the button (a wrapper of the caller's own), and an id reaches the button as an
 * attribute. The caller's own id on the button wins.
 */
export interface TriggerOptions {
  slot: () => VNode[] | undefined
  open: Ref<boolean>
  popupId: string
  haspopup: 'menu' | 'dialog'
  onClick: (e: MouseEvent) => void
  onKeydown?: (e: KeyboardEvent) => void
  /** Default id, used unless the caller set one. */
  id: string
}

export function useTrigger(o: TriggerOptions) {
  let id = o.id
  const app = getCurrentInstance()?.appContext.app
  const el = ref<HTMLElement | null>(null)
  /** The id the popup is labeled by; refreshed on open, after the trigger rendered. */
  const labelledBy = ref('')

  const find = () => {
    el.value = document.getElementById(id)
    labelledBy.value = id
    // Vue counts ids per app: two apps on one page with the same `idPrefix` draw the same ids, and
    // the button found is the first in the page, which may be the other app's.
    if (
      isDev() &&
      el.value &&
      [...document.querySelectorAll('[id]')].filter((n) => n.id === id).length > 1
    )
      warnOnce(
        app,
        `trigger-id:${id}`,
        `[grani] Two elements on the page have the id "${id}", so a menu or popover can open at the wrong button. ` +
          'Two apps on one page each need their own `app.config.idPrefix`.',
      )
    return el.value
  }

  // A slot passed on from a host's own slot (a menu's button through its popover) comes as a
  // fragment: the button is inside it.
  const wire = (nodes: VNode[]): VNode[] => {
    const i = nodes.findIndex((n) => n.type !== Comment)
    if (i < 0) return nodes
    const first = nodes[i]!
    if (first.type === Fragment && Array.isArray(first.children)) {
      nodes[i] = h(
        Fragment,
        first.key == null ? null : { key: first.key },
        wire([...(first.children as VNode[])]),
      )
      return nodes
    }
    const own = first.props?.id
    if (typeof own === 'string' && own) id = own
    nodes[i] = cloneVNode(
      nodes[i]!,
      {
        id,
        'aria-haspopup': o.haspopup,
        'aria-expanded': o.open.value ? 'true' : 'false',
        'aria-controls': o.open.value ? o.popupId : undefined,
        onClick: o.onClick,
        ...(o.onKeydown ? { onKeydown: o.onKeydown } : {}),
      },
      true,
    )
    return nodes
  }
  const Trigger = () => wire(o.slot() ?? [])

  // The button's id as the render draws it, its own or ours: read in a render, a server's too,
  // where nothing has been found yet. A panel open from the first render is named by it at once.
  const ownId = (nodes: VNode[]): string | undefined => {
    const first = nodes.find((n) => n.type !== Comment)
    if (!first) return undefined
    if (first.type === Fragment && Array.isArray(first.children))
      return ownId(first.children as VNode[])
    const own = first.props?.id
    return typeof own === 'string' && own ? own : undefined
  }
  const idOf = () => ownId(o.slot() ?? []) ?? o.id

  return { Trigger, el, labelledBy, find, idOf }
}
