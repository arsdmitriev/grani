<!--
  UiMoneyCell: an amount in a table column: the number on top, the currency and unit under it
  ("EUR / kg"). Take it for any column of money.

  Two lines. The number is in monospace and the unit is under it in small capitals, so amounts
  line up and the unit is read once per row, not once per digit.

  Value. The value is in major units, as a number or the decimal string an API sends. The cell
  formats it in the library's locale with as many decimals as its currency has: two for EUR, three
  for KWD, none for JPY, two with no currency. Zero is a number and prints, also an amount
  that rounds to zero, with no minus; an empty value prints the dash a table prints.

  Currency. The app sets it once with `createGrani({ currency })`, or `currency` sets it for one
  cell. With neither, the lower line holds the unit alone, or is left out.

  Tone. `tone` is what the amount means: `success`, `danger` or `info`; there is no warning amount.
  The tone is color only, so the row says the meaning in words elsewhere (a status, a label), as
  the demo does. Without a tone the amount takes the host's text color, so a class on the cell
  colors it. Outside a table cell, an ancestor must set that color (`text-fg`); the cell sets no
  default.

  Keyboard. Not interactive: no tab stop, no keys.

  Reader.
  - Value: the number, then the unit line, read as text in that order ("1,250.00 EUR / kg").
  - Tone: color only, so the row says the meaning in words elsewhere.
  - Empty value: read as the dash.

  States. None of its own: the row and the table carry hover, selection, loading and failure. The
  cell has a value with and without a unit line, zero, an empty or unreadable value as a dash, and
  the three tones.

  Not for.
  - A date: UiDateCell.
  - An amount to type: UiInput with the unit in `#end`.
  - A change against the value before: UiDelta.
  - A share of a whole: UiProgress.
-->
<template>
  <span v-if="text === null">{{ EMPTY }}</span>
  <span v-else class="inline-block whitespace-nowrap leading-tight">
    <span
      class="block font-mono text-sm/5.5 tabular-nums"
      :class="tone ? toneTextClass(tone) : ''"
      >{{ text }}</span
    >
    <span v-if="unitLine" class="block text-[10px] uppercase tracking-wide text-fg-muted">
      {{ unitLine }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiT } from '../composables/useUiT'
import type { MoneyTone } from '../types/ui'
import { minorDigits } from '../utils/money'
import { toneTextClass } from '../utils/tone'

const props = defineProps<{
  /** The amount in major units: a number or the decimal string an API sends. Empty or unreadable prints a dash. */
  value: string | number | null | undefined
  /** ISO 4217 code for this cell; unset, the app's currency (`createGrani({ currency })`). */
  currency?: string
  /** What the amount is per, `kg` or `pc`; shown after the currency as "EUR / kg". */
  unit?: string
  /** Meaning of the amount: `success`, `danger`, `info`. Unset is the normal ink. */
  tone?: MoneyTone
}>()

const { n, currency: appCurrency } = useUiT()
const EMPTY = '—'

const amount = computed<number | null>(() => {
  const v = props.value
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return null
  const num = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(num) ? num : null
})
// As many minor digits as the currency has: two for EUR, three for KWD, none for JPY.
const digits = computed(() => minorDigits(props.currency?.trim() || appCurrency.value))
const text = computed(() =>
  amount.value === null
    ? null
    : n(amount.value, {
        minimumFractionDigits: digits.value,
        maximumFractionDigits: digits.value,
        // An amount that rounds to zero (-0.001 as 0.00) is zero, with no sign.
        signDisplay: 'negative',
      }),
)
const unitLine = computed(() =>
  [props.currency?.trim().toUpperCase() || appCurrency.value, props.unit?.trim()]
    .filter(Boolean)
    .join(' / '),
)
</script>
