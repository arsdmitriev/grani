import { shallowRef, type ShallowRef } from 'vue'
import { graniKey } from './key'

/** A filter of a list, as the table around it knows it. */
export interface ListFilter {
  /** Something is chosen. */
  chosen: () => boolean
  /** Undoes the choice, as the filter's own Reset does. */
  clear: () => void
}

/** The filters of one list, and what the person does to them. */
export interface ListFilters {
  /** Every filter in the list, in the order they came. */
  all: ShallowRef<ListFilter[]>
  /** Takes a filter in and gives back how to take it out. */
  put: (filter: ListFilter) => () => void
  /** The person changed a choice (a tick, Only, Reset), never the app. */
  changed: () => void
}

/** The filters of one list; `changed` hears what the person does to them. */
export function listFilters(changed: () => void): ListFilters {
  const all = shallowRef<ListFilter[]>([])
  return {
    all,
    put: (filter) => {
      all.value = [...all.value, filter]
      return () => (all.value = all.value.filter((f) => f !== filter))
    },
    changed,
  }
}

/** The table a filter stands in: it starts on page one when the person changes a choice. */
export const LIST_FILTERS = graniKey<ListFilters>('list-filters')
