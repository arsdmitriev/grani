<script lang="ts">
export const blurb =
  'Enter a one-time code by typing, pasting or, where the browser supports it, autofill from a message, and let the app know when the code is complete.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '../composables/useToast'

const split = ref('482')
const hex = ref('')
const sizes = { xs: ref('1234'), sm: ref('1234'), md: ref('1234') }
const locked = ref('12')
const wrong = ref('1234')
// The app checks the code; a wrong one is cleared, so the same code can be typed again.
const otp = ref('')
const error = ref('')
const verified = ref(false)
function check(value: string) {
  if (value === '246810') {
    verified.value = true
    error.value = ''
  } else {
    error.value = 'That code is not right. Try again.'
    otp.value = ''
  }
}
// The app keeps this code: what is typed is refused, and the cells and the input stay on it.
const kept = ref('4829')
// A new code is on its way: the field and its error start over.
function resend() {
  otp.value = ''
  error.value = ''
  verified.value = false
}
const sent = ref('482913')
// A payment confirmed by a code in a window: the code is checked as soon as it is whole; a wrong
// one is cleared with its reason, a right one closes the window into a toast.
const toast = useToast()
// The number kept on one line: a break inside it reads as two numbers.
const PHONE = '+1\u00a0••••\u00a00100'
const dialogOpen = ref(false)
const dialogCode = ref('')
const dialogError = ref('')
const checking = ref(false)
function openPayment() {
  dialogCode.value = ''
  dialogError.value = ''
  dialogOpen.value = true
}
function resendPayment() {
  dialogCode.value = ''
  dialogError.value = ''
}
async function confirmPayment(value: string) {
  checking.value = true
  dialogError.value = ''
  await new Promise((done) => setTimeout(done, 800))
  checking.value = false
  if (value !== '246810') {
    dialogError.value = 'That code is not right. Try again.'
    dialogCode.value = ''
    return
  }
  dialogOpen.value = false
  toast.show({ title: 'Payment confirmed', description: '€1 240.00 to Acme Corp', tone: 'success' })
}
</script>

<template>
  <DemoBlock title="Base">
    <UiCard
      title="Check your phone"
      description="A code went to +1 •••• 0100"
      class="w-full max-w-sm"
    >
      <UiField
        label="Code"
        :description="verified ? 'Checked: the code is right.' : '246810 is the right one here.'"
        :error="error || undefined"
        required
      >
        <UiCodeInput v-model="otp" @complete="check" @update:model-value="verified = false" />
      </UiField>
      <template #footer>
        <span class="me-auto text-xs text-fg-muted">No code yet?</span>
        <UiButton variant="ghost" size="xs" @click="resend">Send it again</UiButton>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Separator">
    <UiCodeInput v-model="split" separator ariaLabel="Verification code" />
  </DemoBlock>
  <DemoBlock title="Letters">
    <UiCodeInput
      v-model="hex"
      input-mode="text"
      pattern="[0-9a-fA-F]"
      :length="8"
      size="sm"
      autocomplete="off"
      ariaLabel="Recovery code"
    />
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiCodeInput v-model="sizes.xs.value" :length="4" size="xs" ariaLabel="Code, xs" />
    <UiCodeInput v-model="sizes.sm.value" :length="4" size="sm" ariaLabel="Code, sm" />
    <UiCodeInput v-model="sizes.md.value" :length="4" ariaLabel="Code, md" />
  </DemoBlock>
  <DemoBlock title="States" row>
    <UiCodeInput v-model="locked" disabled :length="4" ariaLabel="Code, disabled" />
    <UiCodeInput v-model="wrong" invalid :length="4" ariaLabel="Code, invalid" />
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField
      label="Code set by the app"
      description="Typing is not taken: the code stays as it is."
    >
      <UiCodeInput :model-value="kept" :length="4" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="In a form">
    <form class="flex flex-col items-start gap-4" @submit.prevent @reset="sent = '482913'">
      <UiField label="Code from the SMS">
        <UiCodeInput v-model="sent" name="otp" />
      </UiField>
      <span class="text-xs text-fg-muted">Sends otp={{ sent }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </form>
  </DemoBlock>
  <DemoBlock title="In a window">
    <UiButton @click="openPayment">Pay €1 240.00</UiButton>
    <UiModal
      v-model:open="dialogOpen"
      title="Confirm the payment"
      :description="`€1 240.00 to Acme Corp. A code went to ${PHONE}.`"
      size="sm"
    >
      <UiField
        label="Code"
        :description="checking ? 'Checking the code…' : '246810 is the right one here.'"
        :error="dialogError || undefined"
      >
        <UiCodeInput v-model="dialogCode" @complete="confirmPayment" />
      </UiField>
      <template #footer>
        <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
        <UiButton :disabled="checking" @click="resendPayment">Send it again</UiButton>
      </template>
    </UiModal>
  </DemoBlock>
</template>
