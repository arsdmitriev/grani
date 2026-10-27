// Contrast gate. Resolves the semantic tokens of assets/css/tokens.css
// (light in :root and @theme, dark in .dark) plus a brand file, follows var() chains to
// RGB and checks WCAG contrast of the pairs below for every theme and brand.
//
//   node scripts/contrast.mjs [--json] [--brands <css>] [--allow <json>]
//
// --brands: a consumer's stylesheet with its `--color-brand*` variables in
//   :root/.dark, or a showcase file with several `html.brand-*` blocks. Without
//   it the default brand from tokens.css is checked.
// --tokens: an extra token file whose :root/.dark scales the brand file refers
//   to (a library on top of this one may keep its own palettes). Repeatable.
// --literals: a JSON array of fixed pairs a library paints with raw values, checked once:
//   `[{ "fg": [255,255,255], "bg": [107,114,128], "min": 4.5, "label": "…" }]`. Repeatable.
// --allow: consumer waivers, `{ "<brand>|<fg>|<bg>|<theme>": "reason" }`.
//
// Thresholds: 4.5 for text, 3.0 for icons, borders and other non-text marks.

import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fromCwd = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p))
const argAfter = (flag) => {
  const i = process.argv.indexOf(flag)
  if (i === -1) return null
  const value = process.argv[i + 1]
  if (!value) {
    console.error(`contrast: ${flag} needs a path`)
    process.exit(1)
  }
  return value
}

const extraTokens = process.argv.flatMap((a, i) => (a === '--tokens' ? [process.argv[i + 1]] : []))
if (extraTokens.some((p) => !p)) {
  console.error('contrast: --tokens needs a path')
  process.exit(1)
}
const BASE = [join(ROOT, 'assets/css/tokens.css'), ...extraTokens.map(fromCwd)]
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n')
const LITERALS = process.argv
  .flatMap((a, i) => (a === '--literals' ? [process.argv[i + 1]] : []))
  .flatMap((p) => {
    if (!p) {
      console.error('contrast: --literals needs a path')
      process.exit(1)
    }
    const list = JSON.parse(readFileSync(fromCwd(p), 'utf8'))
    if (!Array.isArray(list)) {
      console.error(`contrast: ${p} must be an array of { fg, bg, min, label }`)
      process.exit(1)
    }
    return list
  })
const brandsArg = argAfter('--brands')
const BRANDS = brandsArg ? readFileSync(fromCwd(brandsArg), 'utf8') : ''

const ALLOW = {
  // A quiet halo by design, below the 3:1 WCAG asks of a focus mark, measured as drawn. An app that
  // needs the mark takes `focus: 'strong'`, checked below with no waiver. The README says so.
  '*|over:--color-ring,25,--color-surface|--color-surface|light':
    "quiet halo by choice, below 3:1; README says so, and `focus: 'strong'` passes",
  '*|over:--color-ring,25,--color-surface|--color-surface|dark':
    "quiet halo by choice, below 3:1; README says so, and `focus: 'strong'` passes",
  // fg-subtle is decoration and disabled text, never body text.
  '*|--color-fg-subtle|--color-surface|light': 'decorative and disabled only',
}

const allowArg = argAfter('--allow')
if (allowArg) {
  const path = fromCwd(allowArg)
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    console.error(`contrast: cannot read ${path}: ${e.message}`)
    process.exit(1)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error(`contrast: ${path} must be an object of "brand|fg|bg|theme": "reason"`)
    process.exit(1)
  }
  for (const [key, reason] of Object.entries(parsed)) {
    if (key.startsWith('_')) continue
    if (typeof reason !== 'string' || !reason.trim() || key.split('|').length !== 4) {
      console.error(`contrast: ${path}: bad waiver "${key}"`)
      process.exit(1)
    }
    ALLOW[key] = reason
  }
}

function parseBlocks(css) {
  const blocks = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css.replace(/\/\*[\s\S]*?\*\//g, '')))) {
    const vars = {}
    for (const decl of m[2].split(';')) {
      const i = decl.indexOf(':')
      if (i === -1) continue
      const k = decl.slice(0, i).trim()
      if (k.startsWith('--')) vars[k] = decl.slice(i + 1).trim()
    }
    // The selector is what follows the last statement before the block: `@import` lines ahead of
    // `:root` in an app's stylesheet are not part of it.
    blocks.push({ sel: m[1].split(';').pop().trim(), vars })
  }
  return blocks
}

const merge = (blocks, pred) =>
  Object.assign({}, ...blocks.filter((b) => pred(b.sel)).map((b) => b.vars))
const isRoot = (sel) => sel.split(',').some((p) => [':root', '@theme'].includes(p.trim()))
const isDark = (sel) => sel.split(',').some((p) => p.trim() === '.dark')

const baseBlocks = parseBlocks(BASE)
const light = merge(baseBlocks, isRoot)
const dark = merge(baseBlocks, isDark)

const brandBlocks = parseBlocks(BRANDS)
const brandNames = [...new Set([...BRANDS.matchAll(/html\.(brand-[a-z0-9-]+)/g)].map((m) => m[1]))]
let brands
if (brandNames.length) {
  brands = Object.fromEntries(
    brandNames.map((name) => [
      name,
      {
        light: merge(brandBlocks, (s) => s.includes(`.${name}`) && !s.includes('.dark')),
        dark: merge(brandBlocks, (s) => s.includes(`.${name}`) && s.includes('.dark')),
      },
    ]),
  )
} else if (brandsArg) {
  const l = merge(brandBlocks, isRoot)
  const d = merge(brandBlocks, isDark)
  if (!l['--color-brand'] && !d['--color-brand']) {
    console.error(`contrast: ${brandsArg} defines neither html.brand-* nor --color-brand`)
    process.exit(1)
  }
  brands = { brand: { light: l, dark: d } }
} else {
  brands = { default: { light: {}, dark: {} } }
}

// `mix:--a,--b,50` is the two tokens mixed in oklab, 50% of the first: the thermometer's stops.
// `over:--a,25,--b` is the first at 25% opacity drawn over the second, as the browser blends it: the
// focus halo as the eye sees it.
const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const delin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
function toOklab([r, g, b]) {
  ;[r, g, b] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.max(0, Math.min(255, delin(c))))
}
function color(name, vars) {
  const over = name.match(/^over:(--[\w-]+),(\d+),(--[\w-]+)$/)
  if (over) {
    const top = rgb(over[1], vars)
    const under = rgb(over[3], vars)
    if (!top || !under) return null
    const alpha = Number(over[2]) / 100
    return top.map((c, i) => c * alpha + under[i] * (1 - alpha))
  }
  const mix = name.match(/^mix:(--[\w-]+),(--[\w-]+),(\d+)$/)
  if (!mix) return rgb(name, vars)
  const a = rgb(mix[1], vars)
  const b = rgb(mix[2], vars)
  if (!a || !b) return null
  const share = Number(mix[3]) / 100
  const [A, B] = [toOklab(a), toOklab(b)]
  return fromOklab(A.map((x, i) => x * share + B[i] * (1 - share)))
}

function rgb(name, vars, seen = new Set()) {
  if (seen.has(name)) return null
  seen.add(name)
  const value = vars[name]
  if (value == null) return null
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  if (ref) return rgb(ref[1], vars, seen)
  const nums = value.match(/-?\d+(?:\.\d+)?/g)
  return nums && nums.length >= 3 ? nums.slice(0, 3).map(Number) : null
}

const channel = (c) => {
  c /= 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground, background, threshold, label]
const PAIRS = [
  ['--color-fg', '--color-surface', 4.5, 'body text'],
  ['--color-fg-muted', '--color-surface', 4.5, 'muted text'],
  // Muted words also stand on the muted fill: a hovered day of the next month, a filled footer.
  ['--color-fg-muted', '--color-surface-muted', 4.5, 'muted text on the muted surface'],
  ['--color-fg-subtle', '--color-surface', 3.0, 'subtle marks'],
  ['over:--color-ring,25,--color-surface', '--color-surface', 3.0, 'quiet focus halo as drawn'],
  // The strong ring (`createGrani({ focus: 'strong' })`): the text color, or the danger ink on a
  // dangerous control, over a gap of the surface, against the surface or the muted fill around it.
  ['--color-fg', '--color-surface', 3.0, 'strong focus ring'],
  ['--color-fg', '--color-surface-muted', 3.0, 'strong focus ring on the muted surface'],
  ['--color-danger-subtle-fg', '--color-surface', 3.0, 'strong focus ring of a dangerous control'],
  [
    '--color-danger-subtle-fg',
    '--color-surface-muted',
    3.0,
    'strong focus ring of a dangerous control, muted',
  ],
  // A field's placeholder is text the person reads before typing: a sample, a hint of the format.
  ['--color-placeholder', '--color-control-bg', 4.5, 'placeholder in a field'],
  ['--color-placeholder', '--color-surface', 4.5, 'placeholder in a panel search row'],
  ['--color-brand-fg', '--color-brand', 4.5, 'ink on brand fill'],
  ['--color-brand-solid-fg', '--color-brand-solid', 4.5, 'label on the primary button'],
  ['--color-brand-solid', '--color-surface', 3.0, 'primary button against the surface'],
  ['--color-brand-subtle-fg', '--color-brand-subtle', 4.5, 'text on brand-subtle'],
  // The switch thumb on the off track is gray below 3:1 by choice: the thumb's
  // position carries the state. The floor catches a drift, not the pick.
  ['--color-surface', '--color-border-strong', 1.4, 'switch thumb on the off track'],
  // An empty check mark and a field share the control border: quiet by choice, as every field's
  // outline. The floor keeps it above the hairline it used to be (1.2:1).
  ['--color-control-border', '--color-surface', 1.4, 'empty check mark and field outline'],
  // A skeleton is a quiet placeholder, not a mark to read; the floor keeps it from fading into
  // the surface it stands on (it was the hairline's colour, 1.24:1).
  ['--color-skeleton', '--color-surface', 1.4, 'skeleton on the surface'],
  ['--color-skeleton', '--color-surface-muted', 1.4, 'skeleton on the muted surface'],
  // The brand outline badge: brand has no border role of its own, it uses the brand token.
  // The neutral border is decorative, as `--color-border`: the plate's fill marks the badge.
  ['--color-brand', '--color-surface', 3.0, 'brand outline border on the surface'],
  // The bar of the highlighted row of a list in a panel, on the row's band: the band alone is not.
  ['--color-brand', '--color-surface-muted', 3.0, 'bar of the highlighted row on its band'],
  ...['1', '2', '3', '4', '5', 'other'].map((k) => [
    `--color-chart-${k}`,
    '--color-surface',
    3.0,
    `chart series ${k} on the surface`,
  ]),
  [
    '--color-selected-fg',
    '--color-selected',
    4.5,
    'text on a selection, muted words in a selected row too',
  ],
  ['--color-neutral-subtle-fg', '--color-neutral-subtle', 4.5, 'text on neutral-subtle'],
  ['--color-fg-muted', '--color-neutral-subtle', 3.0, 'neutral glyph on neutral-subtle'],
  // The fill token is a fill; a glyph or a border on the surface uses the
  // border role, and a glyph on the plate uses the plate's text role.
  ...['success', 'danger', 'info'].flatMap((t) => [
    [`--color-${t}-fg`, `--color-${t}`, 4.5, `text on ${t} fill`],
    [`--color-${t}`, '--color-surface', 2.0, `${t} fill against the surface`],
    [`--color-${t}-border`, '--color-surface', 3.0, `${t} icon or border on the surface`],
    [`--color-${t}-subtle-fg`, `--color-${t}-subtle`, 4.5, `text on ${t}-subtle`],
    [`--color-${t}-subtle-fg`, '--color-surface', 4.5, `quiet ${t} button text on the surface`],
  ]),
  // A dot in a calendar: the border role on the surface and on the brand band.
  ...['success', 'warning', 'danger', 'info'].flatMap((t) => [
    [`--color-${t}-border`, '--color-surface', 3.0, `${t} dot on the surface`],
    [`--color-${t}-border`, '--color-brand-subtle', 3.0, `${t} dot on the brand band`],
  ]),
  // Warning is a light fill; glyphs and text use the separate text role.
  ['--color-warning-text', '--color-surface', 4.5, 'warning text on the surface'],
  ['--color-success-subtle-fg', '--color-surface', 4.5, 'a success value on the surface'],
  ['--color-danger-subtle-fg', '--color-surface', 4.5, 'a danger value on the surface'],
  ['--color-info-subtle-fg', '--color-surface', 4.5, 'an info value on the surface'],
  ['--color-success-subtle-fg', '--color-selected', 4.5, 'a success value on a selected row'],
  ['--color-danger-subtle-fg', '--color-selected', 4.5, 'a danger value on a selected row'],
  ['--color-info-subtle-fg', '--color-selected', 4.5, 'an info value on a selected row'],
  ['--color-warning-fg', '--color-warning', 4.5, 'text on warning fill'],
  ['--color-warning-subtle-fg', '--color-warning-subtle', 4.5, 'text on warning-subtle'],
  ['--color-warning-text', '--color-warning-subtle', 3.0, 'warning glyph on its subtle fill'],
  ['--color-warning-subtle-fg', '--color-surface', 4.5, 'quiet warning button text on the surface'],
  // The thermometer of a scale: five stops, each with the ink its numbers take (`scaleRampStep`).
  [
    '--color-danger-fg',
    'mix:--color-danger,--color-warning,100',
    4.5,
    'scale numeral on the danger stop',
  ],
  [
    '--color-warning-fg',
    'mix:--color-danger,--color-warning,50',
    4.5,
    'scale numeral on danger and warning',
  ],
  [
    '--color-warning-fg',
    'mix:--color-warning,--color-success,100',
    4.5,
    'scale numeral on the warning stop',
  ],
  [
    '--color-warning-fg',
    'mix:--color-warning,--color-success,50',
    4.5,
    'scale numeral on warning and success',
  ],
  [
    '--color-danger-fg',
    'mix:--color-warning,--color-success,0',
    4.5,
    'scale numeral on the success stop',
  ],
  // An empty segment of a scale: its number on the track, and on the track under the pointer.
  ['--color-fg', '--color-border', 4.5, 'scale numeral on its empty track'],
  ['--color-fg', '--color-border-strong', 4.5, 'scale numeral on its hovered track'],
]

const rows = []
let failures = 0
for (const [brand, layers] of Object.entries(brands)) {
  for (const theme of ['light', 'dark']) {
    const vars =
      theme === 'light' ? { ...light, ...layers.light } : { ...light, ...dark, ...layers.dark }
    for (const [fg, bg, min, label] of PAIRS) {
      const a = color(fg, vars)
      const b = color(bg, vars)
      // An unresolved token is a failure, not a skip: a silent gate is worse than none.
      if (!a || !b) {
        failures++
        rows.push({ brand, theme, pair: `${fg}/${bg}`, ratio: null, min, label, ok: false })
        continue
      }
      const ratio = contrast(a, b)
      const waived = `${brand}|${fg}|${bg}|${theme}` in ALLOW || `*|${fg}|${bg}|${theme}` in ALLOW
      const ok = ratio >= min || waived
      if (!ok) failures++
      rows.push({
        brand,
        theme,
        pair: `${fg.replaceAll('--color-', '')}/${bg.replaceAll('--color-', '')}`,
        ratio,
        min,
        label,
        ok,
        waived,
      })
    }
  }
}

for (const { fg, bg, min, label } of LITERALS) {
  const ratio = contrast(fg, bg)
  const ok = ratio >= min
  if (!ok) failures++
  rows.push({
    brand: 'literals',
    theme: 'fixed',
    pair: label,
    ratio,
    min,
    label,
    ok,
    waived: false,
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2))
} else {
  let head = ''
  for (const r of rows) {
    const next = `${r.brand} / ${r.theme}`
    if (next !== head) {
      head = next
      console.log(`\n  ${head}`)
    }
    const ratio = r.ratio == null ? '  n/a' : r.ratio.toFixed(2).padStart(5)
    const mark = r.ok ? (r.waived ? '~' : 'ok') : 'FAIL'
    console.log(`  ${mark.padEnd(4)} ${ratio} (min ${r.min})  ${r.pair.padEnd(30)} ${r.label}`)
  }
  console.log(`\ncontrast: ${failures} failure(s)`)
}
process.exit(failures ? 1 : 0)
