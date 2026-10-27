// The package's public names, read from the build: what `dist/index.js` gives at run time and
// what `dist/index.d.ts` declares besides (`type X`), sorted, against `test/public-surface.txt`.
// A name that appears or goes is a reviewed change of the file, not a side effect of a refactor.
// First, the packages the build imports against what its package.json declares. The specs test the
// sources; this reads what an app installs.
//
//   node test/surface.mjs [dist] [--write]
//
// `dist` defaults to this repository's; release:check passes the installed package's.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const dist = resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) ?? join(ROOT, 'dist'))

// Every package the build imports is a dependency or a peer of the package.json beside it: one left
// out resolves only in an app that happens to install it. Every one declared is imported, or npm
// checks the app against a range of something grani never loads. Tailwind is the exception: a peer
// the stylesheet is written for, read by the app's build, never imported by a module.
const manifest = JSON.parse(readFileSync(join(dist, '..', 'package.json'), 'utf8'))
const BY_STYLESHEET = new Set(['tailwindcss'])
const deps = Object.keys(manifest.dependencies ?? {})
const peers = Object.keys(manifest.peerDependencies ?? {})
const imported = new Set()
for (const file of readdirSync(dist, { recursive: true })) {
  if (!String(file).endsWith('.js')) continue
  const src = readFileSync(join(dist, String(file)), 'utf8')
  // TypeScript's own reading of the imports, static and dynamic: a string that names a package in
  // a message is no import.
  for (const { fileName: spec } of ts.preProcessFile(src, true, true).importedFiles) {
    if (spec.startsWith('.')) continue
    const parts = spec.split('/')
    imported.add(spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0])
  }
}
const stray = [...imported].filter((n) => !deps.includes(n) && !peers.includes(n))
const idle = [...deps, ...peers].filter((n) => !imported.has(n) && !BY_STYLESHEET.has(n))
if (stray.length || idle.length) {
  console.error(
    [
      ...stray.map((n) => `dist imports ${n}, which package.json does not declare`),
      ...idle.map((n) => `package.json declares ${n}, which no module of dist imports`),
    ].join('\n'),
  )
  process.exit(1)
}

// Each entry an app imports has its list: `grani-ui`, and `grani-ui/test`, the checks for an app's own
// Playwright suite.
const ENTRIES = [
  { dir: '.', file: 'test/public-surface.txt' },
  { dir: 'test', file: 'test/public-surface-test.txt' },
]
let failed = false
for (const { dir, file } of ENTRIES) {
  const [js, dts] = [join(dir, 'index.js'), join(dir, 'index.d.ts')]
  const runtime = Object.keys(await import(pathToFileURL(join(dist, js)).href))

  const entry = join(dist, dts)
  const program = ts.createProgram([entry], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
  })
  const checker = program.getTypeChecker()
  const declared = checker
    .getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)))
    .map((s) => s.getName())

  // A value the JavaScript gives and the declarations do not: an app could call it untyped.
  const undeclared = runtime.filter((n) => !declared.includes(n))
  if (undeclared.length) {
    console.error(`dist/${js} exports what dist/${dts} does not declare: ${undeclared}`)
    process.exit(1)
  }
  const lines = [
    ...runtime,
    ...declared.filter((n) => !runtime.includes(n)).map((n) => `type ${n}`),
  ].sort((a, b) => {
    // By code point, not by locale: the order must not depend on the machine's language.
    const [x, y] = [a.replace(/^type /, ''), b.replace(/^type /, '')]
    return x < y ? -1 : x > y ? 1 : 0
  })
  const text = `${lines.join('\n')}\n`

  if (process.argv.includes('--write')) {
    writeFileSync(join(ROOT, file), text)
    console.log(`${file}: ${lines.length} names`)
    continue
  }
  const want = readFileSync(join(ROOT, file), 'utf8').trim().split('\n')
  const added = lines.filter((n) => !want.includes(n))
  const gone = want.filter((n) => !lines.includes(n))
  if (added.length || gone.length) {
    console.error(
      [
        `The public surface of dist/${js} changed; if on purpose, run \`node test/surface.mjs --write\` and review the diff.`,
        ...added.map((n) => `  + ${n}`),
        ...gone.map((n) => `  - ${n}`),
      ].join('\n'),
    )
    failed = true
    continue
  }
  console.log(`public surface: ${lines.length} names, as ${file}`)
}
if (failed) process.exit(1)
