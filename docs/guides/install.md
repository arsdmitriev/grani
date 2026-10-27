# Install

What the README's `## Use` leaves out: icons, Yarn Plug'n'Play, Tailwind's `prefix()`, the Tailwind
CLI, and how to remove grani.

## From npm

Install from npm, not from the Git repository: the repository holds the sources, with no `dist`. The
package is ES modules only; `require('grani-ui')` works on Node 20.19 or later. Vite is the bundler the
release check builds an app with on every release; others are not tested.

The package reads `process.env.NODE_ENV` to keep its development warnings out of production, so it
needs a bundler that replaces that name: Vite, webpack and Nuxt do, and Node has `process` of its
own. Loaded through an import map or from a CDN with no bundler, it fails with a ReferenceError.

A Vite app without Tailwind takes it and its plugin, beside Vue's:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

## Icons

grani draws its own glyphs with Lucide, its dependency. To pass icons of your own
(`:icon="Pencil"`, `<Plus />` in a slot), as the examples do, add Lucide to the app:
`npm i @lucide/vue`. Under pnpm the app cannot import a package it has not installed itself.

## Yarn Plug'n'Play

grani asks Yarn to unpack it to disk (`preferUnplugged`), since Tailwind reads files, not a zip. An
app that keeps it packed loses grani's classes in the production build alone, with no warning;
`nodeLinker: node-modules` brings them back.

## Tailwind's prefix()

`@import 'tailwindcss' prefix(tw);` leaves grani's components unstyled while the build stays green:
grani's templates write every class bare, never `tw:rounded-control`, so none of them is matched.
With `grani-ui/style.css`, `createGrani()` says so in the browser's console in development.

## The Tailwind CLI

The Tailwind CLI run on its own, without a bundler's plugin, does not rewrite the font files'
relative `url()` to the output's place, and the font is not found. Build the stylesheet through
your bundler.

## Remove

`npm rm grani-ui`, then take out what the app added for it: the `grani-ui/style.css` line (and
`grani-ui/base.css`, if it took that) from its stylesheet, `.use(createGrani())` from `main.ts` and
`GraniResolver` from `vite.config.ts`. The package runs no install script and writes nothing into the
app.
