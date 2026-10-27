<!-- UiReveal: a block that opens and closes in place, under the control that names it. Take it for
     settings behind a switch or more options behind a button.

     Content. The block goes in the default slot. With `v-model:open`, a `#trigger` (`{ open,
     toggle, controls }`), such as a UiSwitch in a UiListItem, stands above it; or `:open` alone
     follows a control elsewhere, which points at the block by its `id`.

     Spacing. In a card of rows, the block continues the row: it sits on the row's inset, 16 below
     it. On a padded surface, or on no surface, it stands 16 under what is above it. A nested block
     keeps that gutter.

     Keyboard.
     Nothing of its own: the control in `#trigger` keeps its keys (a UiSwitch, a button).
     - `Tab`: reaches the fields of an open block in their order.
     When the block closes with the focus inside, the focus goes to the control that names the block
     in `aria-controls`, else to the element above. Opening leaves the focus on the trigger, as a
     disclosure does; with `autofocus` it goes to the block's first field, for a block opened to be
     typed in.

     Reader.
     - Trigger: says the block's state: a button takes `open` as `aria-expanded`, and a switch says
       it through `aria-checked`. `controls` points the trigger at the block only while the block is
       shown.
     - Closed block: its fields leave the page and are not submitted.
     - Height: the change of height is not announced.

     States. Open and closed, with the height following the content: `ui-reveal` animates a grid row
     from `0fr` to `1fr`, with the opacity, over `--ui-dur-fast`; under reduced motion the change is
     instant. With a `#trigger` and `open` unset, it starts closed and keeps its own state.

     Not for.
     - A panel floating beside its trigger: UiPopover.
     - A record inside a record: a step of UiCrudDrawer.
     - Panes switched among others: UiTabs. -->
<template>
  <slot
    name="trigger"
    :open="shown()"
    :toggle="toggle"
    :controls="shown() ? blockId() : undefined"
  />
  <!-- The animated grid and its one row carry no box: a padding there would stay 16 tall at 0fr and drop at the end. -->
  <Transition name="ui-reveal" @before-leave="keepFocus">
    <div v-if="shown()" :id="blockId()" data-row-block>
      <div>
        <Inside v-bind="boxAttrs()" :class="pad"><slot /></Inside>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  provide,
  ref,
  useAttrs,
  useId,
  watch,
} from 'vue'
import { GUTTER_PAD, ROW_INSET, SURFACE_GUTTER } from '../utils/surface'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The block is shown (`v-model:open`); the parent owns it, the trigger only asks. Unset, the block starts closed and keeps its own state, which a `#trigger` toggles. */
    open?: boolean
    /** When the block opens, the focus goes to its first field: a block opened to be typed in, such as a note. A block shown at mount takes no focus. */
    autofocus?: boolean
  }>(),
  { open: undefined, autofocus: false },
)

const emit = defineEmits<{
  /** The trigger asked for the other state. */
  'update:open': [open: boolean]
}>()

defineSlots<{
  /** The control that opens the block: `controls` is its `aria-controls` while the block is shown; a button also takes `open` as `aria-expanded`, a switch does not (its `aria-checked` says it). */
  trigger(props: { open: boolean; toggle: () => void; controls: string | undefined }): any
  /** The block shown under the trigger; it stands on the gutter the host gives (16 under what is above, or the row's inset in a card of rows). */
  default(props: Record<string, never>): any
}>()

const attrs = useAttrs()
const ownId = `ui-reveal-${useId()}`
const blockId = () => (attrs.id as string | undefined) ?? ownId
// The caller's class and attributes sit inside the animated row, so a margin shrinks with it.
const boxAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'id'))
const local = ref(false)
const shown = () => props.open ?? local.value
const toggle = () => {
  const next = !shown()
  local.value = next
  emit('update:open', next)
}

// A card of rows: the row's inset at the sides, 16 below; elsewhere 16 under what is above.
const gutter = inject(SURFACE_GUTTER, null)
const inset = inject(ROW_INSET, null)
const pad = computed(() => (!gutter && inset ? [GUTTER_PAD[inset], 'pb-4'] : 'pt-4'))
// Inside, the block is on a gutter already: a nested one pads no more, a separator bleeds to its
// edges. Its own component, so the trigger above keeps the row it stands in.
const Inside = defineComponent({
  setup(_, { slots: own }) {
    provide(SURFACE_GUTTER, gutter ?? inset ?? null)
    provide(ROW_INSET, null)
    return () => h('div', { 'data-grani': '' }, own.default?.())
  },
})

// Opening after mount, not a block shown with the page: the focus goes to its first field, past
// any button before it, since the block was opened to be typed in.
const FIELD =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]'
watch(shown, async (now) => {
  if (!now || !props.autofocus || typeof document === 'undefined') return
  await nextTick()
  document.getElementById(blockId())?.querySelector<HTMLElement>(FIELD)?.focus()
})

// Focus leaving with the block goes to the control naming it in `aria-controls`, else the element
// above. A `#trigger` takes `aria-controls` off in the render that starts the leave, so the control
// is found before that render, while the block is still shown.
const namedBy = (id: string) =>
  [...document.querySelectorAll<HTMLElement>('[aria-controls]')].find(
    (n) => n.getAttribute('aria-controls') === id,
  )
let naming: HTMLElement | undefined
watch(shown, (now) => {
  naming = !now && typeof document !== 'undefined' ? namedBy(blockId()) : undefined
})
function keepFocus(el: Element) {
  if (typeof document === 'undefined' || !el.contains(document.activeElement)) return
  const named = naming?.isConnected ? naming : el.id ? namedBy(el.id) : undefined
  const above = el.previousElementSibling as HTMLElement | null
  const target =
    named ??
    (above?.matches('button, [tabindex], input')
      ? above
      : above?.querySelector<HTMLElement>('button, [role="switch"], input, [tabindex]'))
  target?.focus()
}
</script>
