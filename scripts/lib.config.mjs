// The package's build: `vite build --config scripts/lib.config.mjs`, then `vue-tsc -p tsconfig.build.json`
// for the declarations. One file per module, so an app bundles the components it imports and nothing
// else; Vue, the icons and d3 stay the app's. `vue-router`, imported by nothing, stays outside so a
// stray import is refused by `test/surface.mjs`, not bundled.
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { graniElements } from './elements.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

const list = (dir, re) =>
  readdirSync(`${root}${dir}`)
    .filter((f) => re.test(f) && !f.includes('.spec.'))
    .sort()

// Every module is an entry and keeps its exports; `exports` decides which ones an app reaches.
const entry = {
  index: 'index.ts',
  plugin: 'plugin.ts',
  'i18n/index': 'i18n/index.ts',
  'types/ui': 'types/ui.ts',
  'test/index': 'test/index.ts',
}
for (const f of list('components', /^Ui\w+\.vue$/)) entry[`components/${f}`] = `components/${f}`
for (const f of list('composables', /^use\w+\.ts$/))
  entry[`composables/${f.replace('.ts', '')}`] = `composables/${f}`
for (const f of list('utils', /^\w+\.ts$/)) entry[`utils/${f.replace('.ts', '')}`] = `utils/${f}`

// No bundler or minifier looks through a call, so `if (isDev()) warn(...)` keeps its text in every
// production bundle. In the shipped files each call is the test itself, as Vue writes its own;
// `isDev` used any other way stops the build.
const DEV_TEST = '(process.env.NODE_ENV !== "production")'
const isDevName = (node) => node.type === 'Identifier' && node.name === 'isDev'
const isDevCall = (node) => node.type === 'CallExpression' && isDevName(node.callee)
function find(node, test, found = []) {
  if (Array.isArray(node)) for (const child of node) find(child, test, found)
  else if (node && typeof node === 'object') {
    if (test(node)) found.push(node)
    for (const child of Object.values(node)) find(child, test, found)
  }
  return found
}
const inlineDev = {
  name: 'grani-inline-dev',
  enforce: 'post',
  transform(code, id) {
    if (/utils\/dev\.ts$/.test(id) || !code.includes('isDev')) return null
    let out = code
    for (const { start, end } of find(this.parse(code), isDevCall).reverse())
      out = out.slice(0, start) + DEV_TEST + out.slice(end)
    return out === code ? null : { code: out, map: null }
  },
  generateBundle(_, bundle) {
    const left = Object.values(bundle).filter(
      (chunk) =>
        chunk.type === 'chunk' &&
        !/utils\/dev\.ts$/.test(chunk.facadeModuleId ?? '') &&
        find(this.parse(chunk.code), isDevName).length,
    )
    if (left.length) this.error(`isDev is used beyond a call in ${left.map((c) => c.fileName)}`)
  },
}

export default defineConfig({
  root,
  plugins: [vue({ template: { compilerOptions: graniElements } }), inlineDev],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The app minifies its own bundle; a readable build is the one a debugger steps through.
    minify: false,
    lib: { entry, formats: ['es'] },
    rollupOptions: {
      external: [/^vue($|\/)/, 'vue-router', /^@lucide\/vue/, /^d3-/, '@playwright/test'],
      output: { preserveModules: true, preserveModulesRoot: '.', entryFileNames: '[name].js' },
    },
  },
})
