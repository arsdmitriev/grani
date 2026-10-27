<!--
  UiConfirm: the host of `useConfirm`, mounted once at the app root beside UiToaster. Take it to ask
  a yes-or-no question before an action.

  Root. A question asked in an app without one is never shown and never answered, and dev says so
  once.

  Window. It asks in a UiModal with `role="alertdialog"`. A press on the backdrop does not answer;
  Escape and the cross answer no. Asked from a window, it hides that window until it is answered;
  the window then comes back, with the focus on what asked.

  Action. With an `action`, the window sends the request, waits for it, and closes into a toast. If
  the request fails, the toast's Retry asks the question again. A new question answers the open one
  `false`; an action already on its way then reports nothing. Remove a row inside `action`, so the
  Retry after a failure removes it too; a UiTable then takes the focus from the window to the same
  button of the row now in its place. Every way out is refused while the request runs, so one that
  never settles holds the window open: give the `action` a timeout of its own, which fails it into
  the error toast.

  Leaving. A question is never left hanging. When the app has a router and the page changes, or
  when UiConfirm itself unmounts, the open question is answered no. A question whose action is
  already running is not cut off: the request's outcome answers it.

  Keyboard.
  The window's keys; the focus starts on the cancel button, and so does a new question asked in
  place of an open one.
  - `Tab`: goes round the two buttons.
  - `Enter` `Space`: press the one in focus.
  - `Escape`: answers no; while the action is running, it is refused with a shake.
  While the action is running, a second press on the confirm button sends nothing. On close the
  focus returns to what asked.

  Reader.
  - Window: an alert dialog (`role="alertdialog"`, `aria-modal`) named by `title` ("Are you sure?"
    when there is none) and described by `message`, the sentence in its body.
  - Confirm button: while the action runs, says busy (`aria-busy`) under its spinner.
  - Outcome: a failure is announced at once as an error toast with Retry; a success is announced
    only with `success`.

  States. Asked, with Cancel and Confirm; `tone="danger"`, with a red confirm button; busy, with the
  confirm button loading and every close refused; answered, closed with nothing more, or with a
  success toast when `success` is set; failed, closed into an error toast whose Retry asks again. A
  new question, a change of page or an unmounted host answers the open one with `false`.

  Not for.
  - A short form or a detail: UiModal.
  - A question with a field in it (a reason to type): UiModal `role="alertdialog"`.
  - A record: UiCrudDrawer.
  - An outcome with nothing to answer: a toast from `useToast` in UiToaster.
-->
<template>
  <UiModal
    :open="state.open"
    role="alertdialog"
    size="sm"
    :title="state.title || t('grani.confirm.title')"
    :submitting="state.busy"
    @close="state.busy || settle(false)"
  >
    <p class="whitespace-pre-line text-sm/5.5 text-fg-muted">{{ state.message }}</p>
    <template #footer>
      <UiButton ref="cancelRef" variant="secondary" :disabled="state.busy" @click="settle(false)">
        {{ state.cancelLabel || t('grani.confirm.cancel') }}
      </UiButton>
      <UiButton
        :tone="state.tone === 'danger' ? 'danger' : 'brand'"
        :loading="state.busy"
        @click="accept"
      >
        {{ state.confirmLabel || t('grani.confirm.confirm') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { getCurrentInstance, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useConfirmHost } from '../composables/useConfirm'
import { renderedHost, useHosts } from '../composables/useShared'
import { useUiT } from '../composables/useUiT'
import UiButton from './UiButton.vue'
import UiModal from './UiModal.vue'

const { state, settle, accept } = useConfirmHost()
const { t } = useUiT()
// Counted in the app, so a question asked with no window to show it warns in development.
const hosts = useHosts()
// On a server it is rendered, never mounted: counted here, so a question shown there finds it.
renderedHost(hosts, 'confirm')
onMounted(() => hosts.confirm++)

// A question that takes the place of an open one opens on Cancel, as the first did: the focus left
// on the old question's confirm button would let Enter answer the new one unread.
const cancelRef = ref<{ $el: HTMLElement } | null>(null)
watch(
  () => [state.value.id, state.value.open] as const,
  ([id, open], [was, wasOpen]) => {
    if (open && wasOpen && id !== was) cancelRef.value?.$el.focus()
  },
  { flush: 'post' },
)

// A question left open with no window to answer it would keep its caller waiting forever. So it
// is answered no when the person goes to another page or the window itself goes away. A running
// action is left alone: its own outcome answers the question when the request ends.
const dropOpen = () => {
  if (state.value.open && !state.value.busy) settle(false)
}
// The app's router, if it has one, read from the app rather than imported: grani has no router.
const router = getCurrentInstance()?.appContext.config.globalProperties.$router as
  { currentRoute: Ref<unknown> } | undefined
if (router?.currentRoute) watch(router.currentRoute, dropOpen)
onBeforeUnmount(() => {
  hosts.confirm = Math.max(0, hosts.confirm - 1)
  dropOpen()
})
</script>
