# Dark mode

The dark theme is the `dark` class on `<html>`: grani's colors swap under it, and `color-scheme`
follows on grani's elements, or on the whole page with `grani-ui/base.css`. Four steps make it a choice
of the person: let Tailwind follow the class, give the page the theme's background, set the class
before the first paint, and give a switch.

Point Tailwind's `dark:` variant at the class, after the imports, so the app's `dark:` classes and
grani agree:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Give the page the theme's background and text, which swap with it: without them the page stays
white while grani's text turns light for a dark page, and a field's label all but disappears.
`grani-ui/base.css` darkens only the browser's own canvas, not to grani's color.

```html
<body class="bg-bg text-fg"></body>
```

Set the class before the first paint, in `index.html`, so a dark page never flashes light:

```html
<script>
  let theme = null
  try {
    theme = localStorage.getItem('theme') // may be blocked
  } catch {}
  const dark =
    theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
</script>
```

Keep the choice in a small composable. System follows the device and changes with it; Light and
Dark stay until the person picks again. The composable is for the browser only: it calls
`matchMedia` as the module loads, so an app rendered on a server imports it from code that runs in
the browser.

```ts
// useTheme.ts
import { ref, watchEffect } from 'vue'

export type Theme = 'system' | 'light' | 'dark'

// Blocked storage keeps the choice for this visit only.
const storage = {
  get: () => {
    try {
      return localStorage.getItem('theme')
    } catch {
      return null
    }
  },
  set: (value: Theme) => {
    try {
      if (value === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', value)
    } catch {}
  },
}

const stored = storage.get()
const theme = ref<Theme>(stored === 'light' || stored === 'dark' ? stored : 'system')
const device = matchMedia('(prefers-color-scheme: dark)')
const deviceDark = ref(device.matches)
device.addEventListener('change', (e) => (deviceDark.value = e.matches))

watchEffect(() => {
  const dark = theme.value === 'dark' || (theme.value === 'system' && deviceDark.value)
  document.documentElement.classList.toggle('dark', dark)
  storage.set(theme.value)
})

export const useTheme = () => theme
```

The switch is a segmented UiRadioGroup:

```vue
<script setup lang="ts">
import { UiRadio, UiRadioGroup } from 'grani-ui'
import { useTheme } from './useTheme'

const theme = useTheme()
</script>

<template>
  <UiRadioGroup v-model="theme" variant="segmented" aria-label="Theme">
    <UiRadio value="system">System</UiRadio>
    <UiRadio value="light">Light</UiRadio>
    <UiRadio value="dark">Dark</UiRadio>
  </UiRadioGroup>
</template>
```

A brand of your own is set once for each theme: [Brand](brand.md) says how.
