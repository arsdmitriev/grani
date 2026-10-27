import { Comment, h, type SetupContext } from 'vue'
import type { ControlSize } from '../types/ui'
import { controlHeightClass } from './controlSize'

/**
 * Border and fill of a control's capsule, by state. One place for input,
 * textarea, select and the code cells. Disabled is a state, not a fade: its own
 * plate and ink, so it reads apart from a field at rest.
 */
export function controlChromeClass(disabled: boolean, invalid: boolean): string {
  if (disabled) return 'border-border bg-disabled-bg text-disabled-fg'
  if (invalid) return 'border-danger-border bg-control-bg'
  return 'border-control-border bg-control-bg hover:border-control-border-hover'
}

/** The capsule of a field that opens a panel (a select, a day): its value, then the glyphs at its end. */
export function triggerCapsuleClass(ladder: ControlSize, disabled: boolean, invalid: boolean) {
  return [
    'ui-capsule inline-flex items-center gap-2 rounded-control border pl-3 pr-2 text-sm/5.5',
    controlHeightClass[ladder],
    controlChromeClass(disabled, invalid),
  ]
}

/**
 * The root of a field with something under its capsule (tags, shortcuts). Stacked, a column holds
 * both and takes the caller's class and style; alone, the capsule is the root, so a UiButtonGroup
 * joins it as one of its controls.
 */
export function capsuleRoot(
  stacked: () => boolean,
  column: () => { class: unknown; style: unknown },
) {
  return (_: unknown, { slots }: SetupContext) => {
    const nodes = (slots.default?.() ?? []).filter((n) => n.type !== Comment)
    return stacked() ? h('div', { 'data-grani': '', ...column() }, nodes) : nodes[0]
  }
}

/**
 * A button at the end of a capsule (a clear cross, the eye), pulled to its edge. It is an `xs`
 * icon button, 28px; in a 28px capsule it takes 24px, so it fits inside the capsule's border.
 */
export function capsuleEndButtonClass(ladder: ControlSize) {
  return ['-me-1.5', ladder === 'xs' ? '!h-6 !w-6' : '']
}
