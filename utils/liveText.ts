import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'

// A region created just now is not watched yet: the words come this long after it is drawn.
const BEAT = 50

/**
 * The words of a status region that is always in the DOM: empty when it is drawn, and its words a
 * beat after it mounts, then whenever they change. A region that appears with its words is often
 * not read, so a table that opens loading would never say it loads. The server renders it empty,
 * so hydration matches.
 */
export function useLiveText(words: () => string): ComputedRef<string> {
  const ready = ref(false)
  let beat: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    beat = setTimeout(() => (ready.value = true), BEAT)
  })
  onBeforeUnmount(() => clearTimeout(beat))
  return computed(() => (ready.value ? words() : ''))
}
