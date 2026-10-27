import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
// An app writes `from 'grani-ui/resolver'`; the config runs before the aliases below exist.
import { GraniResolver } from '../../resolver.js'
// What the package's build does to its components; an app gets them built.
import { graniElements } from '../../scripts/elements.mjs'

// The package is the repository itself here; an app would `npm i grani-ui` and drop the alias.
const grani = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    vue({ template: { compilerOptions: graniElements } }),
    tailwindcss(),
    Components({ resolvers: [GraniResolver()], dts: false }),
  ],
  // The aliases mirror the package's `exports`; an app has none of this, npm resolves them.
  resolve: {
    alias: [
      { find: /^grani-ui$/, replacement: `${grani}/index.ts` },
      { find: /^grani-ui\/style\.css$/, replacement: `${grani}/assets/css/index.css` },
      { find: /^grani-ui\/resolver$/, replacement: `${grani}/resolver.js` },
      { find: /^grani-ui\/i18n$/, replacement: `${grani}/i18n/index.ts` },
    ],
  },
})
