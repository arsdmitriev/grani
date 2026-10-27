<script lang="ts">
export const blurb = 'Copy a value in one press and see whether it reached the clipboard.'
</script>

<script setup lang="ts">
import { Bot, Code } from '@lucide/vue'
import type { TableColumn } from '../types/ui'

interface Key {
  name: string
  id: string
  created: string
}
const KEYS: Key[] = [
  { name: 'Production', id: '613aa1c0ff4510e0a9b2c3d4', created: 'Sep 3' },
  { name: 'Staging', id: '9f02be7741c3d8a5e6f10b22', created: 'Sep 14' },
  { name: 'Local', id: 'c47d19aa2e8b05f3d6e1a970', created: 'Oct 1' },
]
// The browser refuses this one press, the Clipboard API and the old way both, as a frame denied
// the clipboard does: the alert glyph, Could not copy, and the error toast.
function refuseOnce() {
  const own = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const exec = Object.getOwnPropertyDescriptor(document, 'execCommand')
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.reject(new Error('refused')) },
  })
  Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false })
  setTimeout(() => {
    if (own) Object.defineProperty(navigator, 'clipboard', own)
    else delete (navigator as { clipboard?: unknown }).clipboard
    if (exec) Object.defineProperty(document, 'execCommand', exec)
    else delete (document as { execCommand?: unknown }).execCommand
  })
}
// The key column starts on its header's line: the copy button is flush in the cell.
const columns: TableColumn<Key>[] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'Key' },
  { key: 'created', label: 'Created', align: 'end' },
]
</script>

<template>
  <DemoBlock title="Base">
    <UiCard title="INV-2040-0613" class="w-full max-w-md">
      <UiStack>
        <p class="text-sm text-fg-muted">
          Invoice
          <UiCopyButton
            value="INV-2040-0613"
            label="INV-2040-0613"
            variant="inline"
            ariaLabel="Copy INV-2040-0613"
          />
          was sent to Acme Corp on 3 October.
        </p>
        <UiField label="Share link">
          <UiButtonGroup>
            <UiInput model-value="https://example.test/share/41" readonly />
            <UiCopyButton
              value="https://example.test/share/41"
              variant="outline"
              ariaLabel="Copy the share link"
            />
          </UiButtonGroup>
        </UiField>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="In a table">
    <UiCard :padded="false" class="w-full max-w-lg">
      <UiTable :columns="columns" :items="KEYS" aria-label="API keys">
        <template #cell.id="{ row }">
          <!-- Named by its cut, "Copy 613aa1…b2c3d4": the name holds what the eye reads. -->
          <UiCopyButton :value="row.id" :truncate="12" size="xs" flush />
        </template>
      </UiTable>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Variants" row>
    <UiCopyButton value="name@example.com" />
    <UiCopyButton value="name@example.com" variant="outline" />
    <UiCopyButton value="https://example.com/invoices/2041" label="Copy link" />
    <UiCopyButton value="https://example.com/invoices/2041" label="Copy link" variant="outline" />
    <UiCopyButton value="npm i grani-ui" :icon="Code" ariaLabel="Copy the install command" />
    <UiCopyButton value="Summarise this page" :icon="Bot" ariaLabel="Copy the prompt" />
  </DemoBlock>
  <DemoBlock title="Sizes" row>
    <UiCopyButton
      v-for="s in ['xs', 'sm', 'md']"
      :key="s"
      :size="s"
      value="x"
      variant="outline"
      :ariaLabel="`Copy, ${s}`"
    />
  </DemoBlock>
  <DemoBlock title="With a toast" row>
    <UiCopyButton value="https://example.test/share/41" label="Copy share link" toast />
    <!-- Showcase only: the span makes the clipboard refuse this press. In an app the button stands alone. -->
    <span class="contents" @click.capture="refuseOnce">
      <UiCopyButton value="https://example.test/share/41" label="Copy, refused" />
    </span>
  </DemoBlock>
  <DemoBlock title="Long text">
    <UiCard title="Reference" class="w-full max-w-52">
      <UiStack>
        <!-- A button's label is a few words: a long value is cut in the middle instead. -->
        <UiCopyButton
          value="INV-2040-0613-ACME-CORPORATION-EUROPE"
          :truncate="16"
          variant="outline"
          ariaLabel="Copy the reference"
        />
        <p class="text-sm text-fg-muted">
          Ref
          <UiCopyButton
            value="INV-2040-0613-ACME-CORPORATION-EUROPE"
            label="INV-2040-0613-ACME-CORPORATION-EUROPE"
            variant="inline"
          />
        </p>
      </UiStack>
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Disabled" row>
    <!-- An empty value says "Nothing to copy" by itself, and keeps its place in the Tab order. -->
    <UiCopyButton value="" />
    <UiCopyButton value="" label="Copy link" />
    <UiCopyButton
      value="https://example.test/pages/41"
      label="Copy link"
      disabled
      disabled-reason="Publish the page first"
    />
    <!-- `disabled` with no reason leaves the Tab order. -->
    <UiCopyButton value="613aa1c0ff4510e0a9b2c3d4" :truncate="12" disabled />
    <UiCopyButton value="" label="INV-1" variant="inline" ariaLabel="Copy INV-1" />
  </DemoBlock>
</template>
