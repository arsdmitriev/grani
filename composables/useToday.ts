import { useShared } from './useShared'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { today } from '../utils/calendar'
import { useUiT } from './useUiT'

/**
 * Today in the library's time zone, re-read each minute. `now` is the server's day until mount
 * (hydration renders what the server did), `mark` is empty until then; a user created after the
 * page is up (a popover opened days later) reads the live day at once.
 */
// Set once the first mount has run: from then on a new user renders on the client alone, with no
// server markup to match, and reads the live day rather than a seed written days ago. One flag for
// the page, not per app: a second app mounted later is a client render too, which is what it is.
let settled = false

/** `ticking` says when the minute clock is worth running; without it, it always runs. */
export function useToday(ticking: () => boolean = () => true) {
  const { timeZone } = useUiT()
  const clock = ref(0)
  const mounted = ref(false)
  let tick: ReturnType<typeof setInterval> | undefined
  const start = () => {
    if (!tick && ticking()) tick = setInterval(() => clock.value++, 60_000)
  }
  const stop = () => {
    clearInterval(tick)
    tick = undefined
  }
  watch(ticking, (on) => {
    if (!mounted.value) return
    if (on) {
      clock.value++
      start()
    } else stop()
  })
  const fresh = settled
  onMounted(() => {
    settled = true
    mounted.value = true
    start()
  })
  onBeforeUnmount(stop)
  const seed = useShared<string>('grani:today', () => today(timeZone.value))
  const live = computed(() => (clock.value, today(timeZone.value)))
  const now = computed(() => (mounted.value || fresh ? live.value : seed.value))
  const mark = computed(() => (mounted.value ? live.value : ''))
  return { now, mark, mounted }
}
