<!-- UiSpinner: the sign that work is under way. Take it where a request runs and nothing draws one
     for you; a button, a badge, a switch and a row draw their own under `loading`.

     Size. It is 16px unless the host sets `h-*` or `size-*`. It has no props.

     Placement. It is the loading state of buttons, badges, switches, rows, selects, list fields,
     uploads, toasts and chart cards.

     Keyboard. Not interactive: it takes no focus. A button that spins is UiButton `loading`, which
     handles the keys.

     Reader.
     - Name: with an `aria-label` or `aria-labelledby` it is a `status` with that name; without a
       name it is decoration, hidden. A `role` or `aria-hidden` you set never overrides this.
     - Status: one that mounts with its name already in place is often not read out. Say the wait in
       a live region that was on the page before the request starts (UiCard `loading` has one), and
       let the spinner be its picture.

     States. One: turning, slower under reduced motion, never still; 16px unless the host sets `h-*`
     or `size-*`.

     Not for.
     - Content on its way: UiSkeleton.
     - Work of unknown length on a track: UiProgress `indeterminate`.
     - A button, a badge, a switch or a row at work: UiButton, UiBadge, UiSwitch and UiListItem draw
       it themselves under `loading`. -->
<template>
  <LoaderCircle
    v-bind="attrs"
    data-grani
    class="ui-spinner animate-spin"
    :role="named ? 'status' : undefined"
    :aria-hidden="named ? undefined : 'true'"
  />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { LoaderCircle } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const named = computed(() => Boolean(attrs['aria-label'] || attrs['aria-labelledby']))
</script>
