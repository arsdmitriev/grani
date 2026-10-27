/**
 * vue-tsc emits a relative specifier with no extension, and `./components/UiButton.vue` for a
 * component: the source name, not the declaration beside the build's `UiButton.vue.js`. A
 * consumer on `moduleResolution: nodenext` resolves neither (TS2835, TS2307): nodenext never
 * infers an extension and does not know `.vue`. Appending `.js` is the fix already true of the
 * build's own JavaScript (`dist/index.js` imports `./composables/useConfirm.js`): nodenext's
 * "look for `./x.d.ts` beside an `./x.js` import" rule then finds it. The alternative, nodenext
 * sources for vue-tsc itself, would force an extension onto every import of the repository for a
 * resolution bundler mode does not need.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SPECIFIER = /(\bfrom\s+')(\.\.?\/[^']+)(')/g
const HAS_EXTENSION = /\.(js|mjs|cjs|json|css)$/

function withExtension(specifier) {
  return HAS_EXTENSION.test(specifier) ? specifier : `${specifier}.js`
}

export function addDeclarationExtensions(text) {
  return text.replace(
    SPECIFIER,
    (_m, head, specifier, tail) => `${head}${withExtension(specifier)}${tail}`,
  )
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry.endsWith('.d.ts')) out.push(full)
  }
  return out
}

export function fixDistDeclarations(distDir) {
  const files = walk(distDir)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const fixed = addDeclarationExtensions(text)
    if (fixed !== text) writeFileSync(file, fixed)
  }
  return files.length
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const distDir = join(new URL('..', import.meta.url).pathname, 'dist')
  const count = fixDistDeclarations(distDir)
  console.log(`dist declarations checked: ${count}`)
}
