/**
 * Writes `dist/classes/<Name>/`, one folder per component: `classes.txt`, the Tailwind classes of
 * the component and of every file it imports from `components/`, `utils/` and `composables/`, and
 * `index.css`, which names that list to the app's build. An app on `grani-ui/theme.css` imports
 * `grani-ui/classes/<Name>.css` for each component it uses, and its stylesheet carries those alone
 * (README, "## Use").
 *
 * A folder each, not one folder of files: a `@source` into `node_modules` opens its folder to
 * Tailwind's own scan of the project, so a `@source` naming one file of `components/` brings every
 * component (Tailwind 4.3.3: 103 683 bytes for one file, for a file that does not exist, and for
 * the whole folder). Here the folder holds one list.
 *
 * The words of the sources that are not classes are dropped against grani's theme, through
 * Tailwind's design system: the app's stylesheet is the same with them and without them (a test
 * of the source repository compiles both), and the lists weigh 185 kB instead of 663 kB. That API
 * is marked unstable; without it the build stops rather than ship the heavier lists.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(ROOT, 'package.json'))
// The scanner the Vite plugin itself runs: the plugin's own dependency, not a second copy.
const fromPlugin = createRequire(require.resolve('@tailwindcss/vite'))
const { Scanner } = createRequire(fromPlugin.resolve('@tailwindcss/node'))('@tailwindcss/oxide')

const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*'(\.\.?\/[^']+)'/g
const FOLDERS = ['components', 'utils', 'composables'].map((f) => join(ROOT, f) + sep)

function resolveImport(from, specifier) {
  const path = resolve(dirname(from), specifier)
  return [path, `${path}.ts`, join(path, 'index.ts')].find((p) => extname(p) && existsSync(p))
}

/** The component's file and every file of the three folders it reaches by a relative import. */
export function closureOf(name) {
  const entry = join(ROOT, 'components', `${name}.vue`)
  const seen = new Set([entry])
  for (const file of seen)
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
      const target = resolveImport(file, specifier)
      if (target && FOLDERS.some((f) => target.startsWith(f)) && !target.endsWith('.spec.ts'))
        seen.add(target)
    }
  return [...seen].sort()
}

/** Every word Tailwind's scanner takes from the files, as `@source` on them would. */
export function candidatesOf(files) {
  const content = files.map((file) => ({
    content: readFileSync(file, 'utf8'),
    extension: extname(file).slice(1),
  }))
  return [...new Set(new Scanner({}).scanFiles(content))].sort()
}

const css = join(ROOT, 'assets/css')
async function loadStylesheet(id, base) {
  const path = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : resolve(base, id)
  return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
}

/**
 * Keeps the words that are classes under grani's theme. A Tailwind without the API stops the build:
 * the lists would ship unfiltered, three times heavier, and nothing downstream would say so.
 */
export async function classFilter(tailwind) {
  tailwind ??= await import('tailwindcss')
  const load = tailwind.__unstable__loadDesignSystem
  if (typeof load !== 'function')
    throw new Error(
      "classes: this Tailwind has no __unstable__loadDesignSystem, which drops the words that are not classes; update scripts/classes.mjs to Tailwind's API",
    )
  const system = await load(`@import 'tailwindcss';\n@import './theme.css';\n`, {
    base: css,
    loadStylesheet,
  })
  return (words) => {
    const rules = system.candidatesToCss(words)
    return words.filter((_, i) => rules[i])
  }
}

export const components = () =>
  readdirSync(join(ROOT, 'components'))
    .filter((f) => /^Ui\w+\.vue$/.test(f))
    .map((f) => f.slice(0, -'.vue'.length))
    .sort()

async function main() {
  const out = join(ROOT, 'dist/classes')
  rmSync(out, { recursive: true, force: true })
  const keep = await classFilter()
  for (const name of components()) {
    const dir = join(out, name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'classes.txt'), keep(candidatesOf(closureOf(name))).join('\n') + '\n')
    writeFileSync(
      join(dir, 'index.css'),
      `/* The classes of ${name} and of what it is built from. */\n@source './classes.txt';\n`,
    )
  }
  console.log(`classes: ${components().length} components in dist/classes`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main()
