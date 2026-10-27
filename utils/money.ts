/**
 * How many minor digits a currency has, as the browser knows them: two for EUR, three for KWD,
 * none for JPY. A code it does not know, or no code, gives two. The money cell and a chart's money
 * values print amounts with it, so the two never disagree.
 * @internal
 */
export function minorDigits(code: string | null | undefined): number {
  const c = code?.trim().toUpperCase()
  if (!c) return 2
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency: c }).resolvedOptions()
        .maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}
