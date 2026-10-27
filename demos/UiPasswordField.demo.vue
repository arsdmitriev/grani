<script lang="ts">
export const blurb =
  'Set a new password by typing or generating one, check it on screen and copy it; a screen reader confirms the generation without reading the password.'
</script>

<script setup lang="ts">
import { ref } from 'vue'

const password = ref('')
const login = ref('anna@example.com')
const secret = ref('')
const repeat = ref('')
const small = ref('correct horse battery staple')
const regular = ref('correct horse battery staple')
const large = ref('correct horse battery staple')
const short = ref('abc')
const locked = ref('Kept-by-the-admin-7')
const wrong = ref('abc')
// The app keeps this password: a generated one is refused, nothing is shown or said.
const kept = ref('correct horse battery staple')
const noCopy = ref('correct horse battery staple')
const recovery = ref('')
const sent = ref('')
const sentRepeat = ref('')
</script>

<template>
  <DemoBlock title="Base">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiField label="New password" description="At least 10 characters.">
        <UiPasswordField v-model="password" @generate="repeat = $event" />
      </UiField>
      <UiField label="Repeat" description="Filled for you after a generated password.">
        <UiInput v-model="repeat" type="password" autocomplete="new-password" />
      </UiField>
    </div>
  </DemoBlock>
  <DemoBlock title="Sign in">
    <!-- Signing in recalls a password, never makes one: UiInput type="password", its eye alone. -->
    <UiCard title="Sign in" class="w-full max-w-sm">
      <UiStack>
        <UiField label="Email">
          <UiInput v-model="login" type="email" autocomplete="username" />
        </UiField>
        <UiField label="Password">
          <UiInput v-model="secret" type="password" autocomplete="current-password" />
        </UiField>
      </UiStack>
      <template #footer>
        <UiButton class="w-full">Sign in</UiButton>
      </template>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Options">
    <UiStack class="w-full max-w-sm">
      <UiField
        label="New password"
        description="No copy button: this password must not reach the clipboard."
      >
        <UiPasswordField v-model="noCopy" :copy="false" />
      </UiField>
      <UiField label="Recovery key" description="Generate one: 32 characters.">
        <UiPasswordField v-model="recovery" :length="32" />
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Sizes">
    <div class="flex w-full max-w-sm flex-col gap-4">
      <UiPasswordField v-model="small" ariaLabel="Password, xs" size="xs" />
      <UiPasswordField v-model="regular" ariaLabel="Password, sm" />
      <UiPasswordField v-model="large" ariaLabel="Password, md" size="md" />
    </div>
  </DemoBlock>
  <DemoBlock title="Error">
    <UiStack class="w-full max-w-sm">
      <UiField
        label="New password"
        :error="short.length < 10 ? 'At least 10 characters' : undefined"
      >
        <UiPasswordField v-model="short" />
      </UiField>
      <UiPasswordField v-model="wrong" invalid ariaLabel="New password" />
    </UiStack>
  </DemoBlock>
  <DemoBlock title="States">
    <UiStack class="w-full max-w-sm">
      <UiField label="Disabled"><UiPasswordField model-value="hidden" disabled /></UiField>
      <UiField label="Service password" description="Copy it; it is set by the administrator.">
        <UiPasswordField v-model="locked" readonly />
      </UiField>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Refused">
    <UiField
      label="Password"
      description="The app keeps this one: a generated password is not taken."
      class="w-full max-w-sm"
    >
      <UiPasswordField :model-value="kept" />
    </UiField>
  </DemoBlock>
  <DemoBlock title="Form">
    <form
      class="flex w-full max-w-sm flex-col items-start gap-4"
      @submit.prevent
      @reset="((sent = ''), (sentRepeat = ''))"
    >
      <UiField label="New password" class="w-full">
        <UiPasswordField v-model="sent" name="password" @generate="sentRepeat = $event" />
      </UiField>
      <UiField label="Repeat" class="w-full">
        <UiInput v-model="sentRepeat" type="password" name="repeat" autocomplete="new-password" />
      </UiField>
      <span class="text-xs text-fg-muted">{{
        sent ? 'Sends password and repeat' : 'Sends nothing yet'
      }}</span>
      <UiButton type="reset" variant="outline" size="xs">Reset</UiButton>
    </form>
  </DemoBlock>
</template>
