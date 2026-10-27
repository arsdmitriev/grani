<script lang="ts">
import { defineComponent } from 'vue'

// A demo of markup alone: the template is the whole component.
export default defineComponent({})

export const blurb = 'Follow an underlined link in text, marked when it opens a new tab.'
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="ORD-1041" class="w-full max-w-md">
      <p class="text-sm text-fg">
        Paid on Sep 12; the receipt is in <UiLink to="/components/card">the order's files</UiLink>.
        The parcel can be followed on
        <UiLink to="https://track.example.com/parcel/41">the carrier's site</UiLink>. Questions go
        to <UiLink to="mailto:orders@example.com">orders@example.com</UiLink> or
        <UiLink to="tel:+15550100">+1 555 0100</UiLink>.
      </p>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Tones">
    <UiStack class="w-full max-w-md">
      <p class="text-sm text-fg">
        The record was moved to <UiLink to="/components/card">the archive</UiLink>.
      </p>
      <p class="text-sm text-fg">
        Three records have no rate:
        <UiLink to="/components/badge" tone="info">open the list</UiLink>.
      </p>
      <p class="text-sm text-fg-muted">
        Updated yesterday by <UiLink to="/components/badge" tone="neutral">Dana Petrova</UiLink>.
      </p>
    </UiStack>
  </DemoBlock>
  <DemoBlock title="Target and rel">
    <p class="text-sm text-fg">
      Read <UiLink to="https://help.example.com" target="_self">the help center here</UiLink>, open
      <UiLink to="/components/card" target="_blank">a card in a new tab</UiLink>, or follow
      <UiLink to="https://partner.example.com" rel="nofollow">a partner</UiLink>.
    </p>
  </DemoBlock>
</template>
