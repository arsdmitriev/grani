/**
 * Shared axes. A component takes a subset of a vocabulary, never a private
 * spelling of it: `variant` is how something is presented, `tone` is what it
 * means, `size` is one ladder for every control.
 */

import type { Component, ComputedRef } from 'vue'
import type { GraniMessageKey } from '../i18n/en'
import type { RangePreset } from '../utils/dateRange'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
export type Size = 'xs' | 'sm' | 'md' | 'lg'

export type BadgeTone = Tone
export type BadgeVariant = 'soft' | 'inline' | 'outline'

/** `dashed` is the plate for one more block of a form: a dashed frame the shape of what it adds, quiet until hovered. */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dashed'
export type ButtonTone = Extract<Tone, 'brand' | 'success' | 'warning' | 'danger'>
/** The control height ladder: xs 28, sm 36 (default), md 44. `lg` has no row to stand in. */
export type ControlSize = Extract<Size, 'xs' | 'sm' | 'md'>
export type ButtonSize = ControlSize

export type IconButtonVariant = 'primary' | 'outline' | 'ghost'
export type IconButtonTone = Extract<Tone, 'neutral' | 'brand' | 'danger'>

export type LinkTone = Extract<Tone, 'brand' | 'info' | 'neutral'>
/** Meaning of an amount: normal, good, bad, or a note. No `warning`: an amount has no in-between state. */
export type MoneyTone = Extract<Tone, 'success' | 'danger' | 'info'>

/** Which fact of a date leads in a cell: the time, for a list within a day, or the day, for a list across months. */
export type DateCellVariant = 'time' | 'day'
/** What the lower line of a date cell answers: how long ago, or which day of the week. */
export type DateCellContext = 'relative' | 'weekday'

// `Omit` over a union keeps only the keys every member has, and `key` would fall back to `string`;
// this omits from each member on its own.
type OmitEach<U, K extends PropertyKey> = U extends unknown ? Omit<U, K> : never

/**
 * A column of UiDataTable: the table column plus how its values are drawn. `text` is the
 * default; the other types are formats, never a domain: a customer or an order is the
 * `#cell.<key>` slot. A `money` column stands at the end unless `align: 'start'` says otherwise.
 */
export type DataTableColumn<T = Record<string, unknown>> =
  | (TableColumn<T> & { type?: 'text' })
  | (OmitEach<TableColumn<T>, 'format' | 'truncate'> & {
      type: 'money'
      /** ISO 4217 code for this column; unset, the app's currency. */
      currency?: string
      /** What the amount is per: `kg`, `pc`. */
      unit?: string
      /** Meaning of the amount by row: `success`, `danger`, `info`. */
      tone?: (row: T) => MoneyTone | undefined
    })
  | (OmitEach<TableColumn<T>, 'format' | 'truncate'> & {
      type: 'date'
      /** Which fact leads: the time within a day, the day across months. */
      variant?: DateCellVariant
      /** How long ago, or the day of the week. */
      context?: DateCellContext
    })
  | (OmitEach<TableColumn<T>, 'truncate'> & {
      type: 'status'
      /** Meaning of the badge by row; `format` gives its text. */
      tone?: (row: T) => Tone | undefined
    })
  | (OmitEach<TableColumn<T>, 'truncate'> & {
      type: 'copy'
      /** Shows the value cut in the middle to about this many characters; the copy is whole. `format` gives the shown text otherwise. */
      chars?: number
    })
  | (OmitEach<TableColumn<T>, 'format' | 'truncate'> & {
      type: 'progress'
      /** The value at which the bar is full; 100 when unset. */
      max?: number
      /** Size of one segment: a mark on a scale (`step: 1, max: 5`); the cell also says "3/5" under it. */
      step?: number
      /** `thermometer` colors the fill by how full it is, danger to success; `plain` by default. */
      variant?: 'plain' | 'thermometer'
      /** With `thermometer`: less is better. */
      invert?: boolean
      /** Color of the fill with `plain`; `brand` by default. */
      tone?: BadgeTone
    })

export type SelectValue = string | number

/** An option of a list to pick from: a select, a filter. */
export interface SelectOption<V extends SelectValue = SelectValue> {
  /** What the model holds: as in the URL for a filter. */
  value: V
  label: string
  /** More about the option: a second line under the label in a select (a code, a hint), a word at the end of the row in a filter (`always`, a count). */
  description?: string
  /** Shown but not selectable: in a filter, fixed as it is (a column that is always on). */
  disabled?: boolean
  /** More words the filter finds it by, unseen: `14:30` for a row that reads 2:30 PM. */
  keywords?: string
}

export interface SelectGroup<V extends SelectValue = SelectValue> {
  label: string
  options: SelectOption<V>[]
}

export type SelectItem<V extends SelectValue = SelectValue> = SelectOption<V> | SelectGroup<V>

/** Presentation of a radio group: rows with the mark first, cards with the mark at the end, cards that show a check on the selected one only. */
/** `segmented` is a bar of segments, one pressed: the pick of exactly one of a few, in one row of a form. */
export type RadioGroupVariant = 'plain' | 'card' | 'card-check' | 'segmented'

export type TabValue = string | number

export interface TabItem {
  value: TabValue
  label: string
  /** A count or a mark shown next to the label. */
  badge?: number | string
  /** What the badge means, for a screen reader: "3 active", "needs attention". The badge alone reads as a bare number. */
  badgeLabel?: string
  /** Meaning of the badge: `warning` asks for attention, `danger` reports a problem. */
  badgeTone?: BadgeTone
  /** Shown but not chosen: a click does nothing, the arrows pass over it, it says `aria-disabled`. */
  disabled?: boolean
}

export type SortDirection = 'asc' | 'desc'
/** The sorted column and its direction; `null` is the source order. */
export type TableSort = { key: string; dir: SortDirection } | null
/** What tells rows apart: a field name or a function of the row; `id` when unset. */
export type RowKey<T> = (keyof T & string) | ((row: T) => string | number)

/** The parts of a table column that do not depend on where its value comes from. */
interface TableColumnBase<T = Record<string, unknown>> {
  /** Header text. */
  label: string
  /** Text for a value that is not empty; a cell slot replaces it altogether. */
  format?: (value: unknown, row: T) => string
  /** The header is a button that asks for a sort; the parent orders the rows. */
  sortable?: boolean
  /** Direction of the first click: `desc` for dates and ids, where newest first is expected. */
  defaultSortDir?: SortDirection
  /** `end` for numbers, so the digits line up. */
  align?: 'start' | 'end'
  /** The column's width, also its minimum: it keeps it when the table overflows sideways. One CSS value (`'120px'`, `'calc(100% - 2rem)'`, `'var(--w)'`); one carrying `;`, `{` or `}` is ignored. */
  width?: string
  /** One line cut with an ellipsis (`UiTruncate`): the whole text in a tooltip while the cut is real. */
  truncate?: boolean
  /** Lines of text a cell of the column holds, 1 by default: the first load draws that many bars, so the rows arrive at their height. UiDataTable sets 2 for `money` and `date`. */
  lines?: 1 | 2
}

/**
 * A column of UiTable. Without `accessor` the value is `row[key]`, so `key` is a field of the
 * row and a typo does not compile. A computed column (a nested field, a derived number, a cell
 * drawn only by its slot) reads its value with `accessor`, and its key is any name.
 * The key also names the `#cell.<key>` and `#footer.<key>` slots.
 */
export type TableColumn<T = Record<string, unknown>> =
  | (TableColumnBase<T> & {
      /** Field of the row; also names the `#cell.<key>` and `#footer.<key>` slots. */
      key: keyof T & string
      accessor?: undefined
    })
  | (TableColumnBase<T> & {
      /** Any name: the value comes from `accessor`. Also names the `#cell.<key>` and `#footer.<key>` slots. */
      key: string
      /** Reads the value when it is not `row[key]`: a nested field, a derived number. */
      accessor: (row: T) => unknown
    })

/** A file a dropzone refused, and why: a wrong type, over the size, past the count, already listed, a folder. */
export interface FileRejection {
  file: File
  reason: 'type' | 'size' | 'count' | 'duplicate' | 'folder'
}

/** A span of days, both ends inclusive, as ISO days (`2026-09-24`); an open end is `null`. */
export interface DateSpan {
  from: string | null
  to: string | null
}

/**
 * The value of UiDateRange: its days and the named period. `preset` is `null` when none is named:
 * then days are a custom span and no days are All time.
 */
export interface DateRangeValue extends DateSpan {
  preset: RangePreset | null
}

/** A day UiDatePicker knows by name, counted from today: `weekAgo` is 7 days back, `in2Weeks` 14 ahead. */
export type DatePresetId =
  'today' | 'yesterday' | 'weekAgo' | 'tomorrow' | 'in3Days' | 'inAWeek' | 'in2Weeks'

/** A day of the app's own under a date field: its words and its distance from today, negative for the past. */
export interface DatePreset {
  label: string
  days: number
}

/** A marked day of a calendar with the colour of its dot. */
export interface CalendarMark {
  day: string
  tone?: BadgeTone
  /** What this dot means, read with the date ("overdue"); without it `grani.calendar.marked` is. */
  label?: string
}

/** Who did it: a person, a vendor, the system (unset). */
export interface LogActor {
  /** The name read on the timeline: "Anna", "Captions Bureau". */
  name: string
  /** A picture for the face node; the initials otherwise. */
  avatar?: string
}

/** What a field was and what it became; no `from` is "set", no `to` is "cleared". */
export interface LogChange {
  /** The field: "Status", "Price". */
  field: string
  from?: string | number | null
  to?: string | number | null
  /** A status change: its values as badges in this tone, on its line or in the table. */
  tone?: BadgeTone
}

/** One event of a record's log (UiLog), newest first in its list. */
export interface LogEvent {
  /** Keeps the event when the list changes. */
  id: string | number
  /** When: a Date, formatted by the library with the exact moment on it, or the product's own string, shown as it is. */
  at: Date | string
  /** Who; unset is the system, `null` names no one: the line opens with what was done. */
  actor?: LogActor | null
  /** What was done, a verb: "changed", "approved", "uploaded". */
  action: string
  /** On what, when it is not the record itself: "Captions", "1080p file". */
  target?: string
  /** What it was and what it became: one field reads on a line, several as a table. */
  changes?: LogChange[]
  /** The words with it: a reason to decline, a comment. */
  note?: string
  /** A kind of event the filters pick by: "decision", "file", "comment". */
  kind?: string
  /** The node's colour when it matters: `success` for a yes, `danger` for a no. */
  tone?: BadgeTone
  /** The event row's `id`, for a link to it (`#0.2.0`); unique on the page. */
  anchor?: string
}

/** One place of the app in UiAppShell's sidebar. */
export interface NavItem {
  /** The route, a path without a query or a hash; the item is the current page on it and under it (`/orders/42` lights `/orders`). A `javascript:` or `data:` address is refused: the row shows with no link. */
  to: string
  /** The name of the place: the row's text, the tooltip when collapsed. */
  label: string
  /** A Lucide icon, 20px; the only thing shown when the sidebar is collapsed, so it is required. */
  icon: Component
  /** A count at the end (unread, waiting); `0` or unset shows none. */
  count?: number
}

/** A group of places, under an optional small heading; a line stands between groups when the sidebar is collapsed. */
export interface NavGroup {
  /** The small heading over the group; unset draws none. */
  label?: string
  /** The places of the group, in order. */
  items: NavItem[]
}

/**
 * A key of grani's dictionary, or a key of the app's own that its `translate` answers. The first
 * half is what an editor offers; the second keeps an app's key legal. That every key a component
 * asks for is in `en` is checked by `test/messageKeys.spec.ts`.
 */
export type UiMessageKey = GraniMessageKey | (string & {})

/** A key with plural forms, named without the form: `grani.select.selected` for its `.one` and `.other`. */
export type UiPluralKey =
  | (GraniMessageKey extends infer K ? (K extends `${infer B}.other` ? B : never) : never)
  | (string & {})

export interface UiTranslator {
  /** The app's language, read-only: a BCP 47 tag, `en` unless the app gave one. */
  locale: ComputedRef<string>
  t: (key: UiMessageKey, params?: Record<string, string | number>) => string
  /** Picks `<key>.<category>` by the plural rules of the language; `{n}` is filled with the count, written in the language's digits. */
  tp: (key: UiPluralKey, count: number, params?: Record<string, string | number>) => string
  n: (value: number, options?: Intl.NumberFormatOptions) => string
  d: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string
  /** IANA zone dates are rendered in; empty means the device zone. */
  timeZone: ComputedRef<string>
  /** ISO 4217 code of the app's money (`createGrani({ currency })`); empty means none is set. */
  currency: ComputedRef<string>
}
