import { defineComponent, h, onMounted, ref, shallowRef, type Component } from 'vue'

// Loaded the first time a button is off with a reason: imported with the button it weighed 8 kB
// gzipped (a Vite app, Vue alone), lazy 1 kB. A chunk that fails to load draws nothing, and the
// next button that is off with a reason asks again.
let asked = false
const loaded = shallowRef<Component | null>(null)
function load() {
  if (asked) return
  asked = true
  import('./HintFor.vue').then(
    (m) => (loaded.value = m.default),
    () => {
      asked = false
    },
  )
}

/** The reason's hint inside a button, its props passed through as attributes. @internal */
export const LazyHint = defineComponent({
  name: 'LazyHint',
  inheritAttrs: false,
  setup(_, { attrs }) {
    // Drawn only once mounted, so the server and the first client render match.
    const mounted = ref(false)
    onMounted(() => {
      mounted.value = true
      load()
    })
    return () => (mounted.value && loaded.value ? h(loaded.value, attrs) : null)
  },
})
