import type { Ref } from 'vue'
import { graniKey } from './key'

/**
 * The axis of the enclosing UiButtonGroup: a UiSeparator inside it stands across it by default.
 * Injection reaches every descendant, so a panel opened from a button in the group (a menu,
 * a popover) provides `vertical` again, or its separators would stand across its rows.
 */
export const GROUP_AXIS = graniKey<Ref<'horizontal' | 'vertical'>>('group-axis')

/**
 * Whether a UiButtonGroup stands inside another one. Only the outermost group of a `UiField group`
 * takes the field's name; a panel opened from a button in a group provides `false` again, so a
 * group inside the panel is wired to its own field.
 */
export const GROUP_NESTED = graniKey<boolean>('group-nested')
