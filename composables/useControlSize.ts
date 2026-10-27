import { currentScope } from './useShared'
import { computed, type Ref } from 'vue'
import type { ControlSize } from '../types/ui'

/**
 * A control's step: its own `size` when the caller gave one, the app's otherwise
 * (`createGrani({ size })`, `sm` unless set; `grani.setSize` moves it and the page follows).
 */
export function useControlSize(own: () => ControlSize | undefined): Readonly<Ref<ControlSize>> {
  const app = currentScope().size
  return computed(() => own() ?? app.value)
}
