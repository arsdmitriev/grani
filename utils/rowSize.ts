import { inject, provide, type Ref } from 'vue'
import { graniKey } from './key'

/** The step of the rows inside a host: a menu or a dense list says `sm` once, every UiListItem in it follows. */
export type RowSize = 'md' | 'sm'

const KEY = graniKey<Ref<RowSize>>('row-size')

export const provideRowSize = (size: Ref<RowSize>) => provide(KEY, size)
export const useRowSize = () => inject(KEY, null)

const LOOSE = graniKey<boolean>('row-loose')
/** A host whose rows are no list's (a sidebar's footer): a row there keeps its own height and inset, and is no row a list counts. */
export const provideLooseRows = (on: boolean) => provide(LOOSE, on)
export const useLooseRows = () => inject(LOOSE, false)

const IN_LIST = graniKey<boolean>('row-in-list')
/** A UiList says its children are its items: a notice there is drawn as a row, not as a card. A row clears it for what it holds. */
export const provideInList = (on: boolean) => provide(IN_LIST, on)
export const useInList = () => inject(IN_LIST, false)

/**
 * A surface of its own (a window, a drawer, a popover's panel) starts its rows afresh: the row
 * of whatever opened it (a sidebar's footer) does not reach in through the teleport.
 */
export function resetRows() {
  provide(KEY, null as unknown as Ref<RowSize>)
  provide(LOOSE, false)
  provide(IN_LIST, false)
}
