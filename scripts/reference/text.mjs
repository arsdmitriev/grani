// The library as text for a language model, from the package's own sources only: the manifest
// (registry.ts), the API reference written from the components and their doc comments
// (`api.json`), the demos, and the rules of behavior (`patterns.ts`). The package's llms.txt is `packageText()`; the site writes the same pages, its
// own index and the Markdown twins from here.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { attrsLine } from './attrs.mjs'

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const SITE = 'https://grani.arseni.work'

const { REGISTRY, FAMILIES } = await import(path.join(ROOT, 'registry.ts'))
export { FAMILIES }
const { labelOf, spokenLabelOf, pageOf } = await import(
  path.join(ROOT, 'scripts/reference/names.ts')
)
const { minimalOf } = await import(path.join(ROOT, 'scripts/reference/usage.ts'))
const { blockCode } = await import(path.join(ROOT, 'scripts/reference/blockCode.ts'))
const { PATTERNS, MOMENTS } = await import(path.join(ROOT, 'scripts/reference/patterns.ts'))
const { RULES, holdsLines, linkOf, momentPath, momentSlug, placesOf } = await import(
  path.join(ROOT, 'scripts/reference/rules.ts')
)
const { orderOn } = await import(path.join(ROOT, 'scripts/reference/importance.ts'))
export const RULE_COUNT = Object.keys(PATTERNS).length
const api = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/reference/api.json'), 'utf8'))
export const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

// What the package's entry gives, module by module: `true` for a module re-exported whole, else
// the names it re-exports. A demo's import of the library is rewritten to `grani-ui` from this.
const ENTRY = new Map()
for (const m of fs
  .readFileSync(path.join(ROOT, 'index.ts'), 'utf8')
  .matchAll(/^export (?:\* |\{([^}]*)\} )from '\.\/(.+)'$/gm)) {
  const names = m[1]?.split(',').map((n) =>
    n
      .trim()
      .replace(/^type\s+/, '')
      .split(/\s+as\s+/)
      .pop(),
  )
  ENTRY.set(m[2], names ? new Set(names.filter(Boolean)) : true)
}

/** A demo's import of a library module as an app writes it; throws when `exports` gives no way to a name. */
function publicImport(statement, module, file) {
  const given = ENTRY.get(module)
  const names = (statement.match(/\{([^}]*)\}/)?.[1] ?? '')
    .split(',')
    .map(
      (n) =>
        n
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)[0],
    )
    .filter(Boolean)
  const missing = given === true ? [] : names.filter((n) => !given?.has(n))
  if (!names.length || missing.length)
    throw new Error(`${file}: ${missing.join(', ') || statement} is not exported by ${pkg.name}`)
  return statement.replace(`'../${module}'`, `'${pkg.name}'`)
}

const dedent = (block) => {
  const indent = block.match(/^ */)?.[0].length ?? 0
  return block.replace(new RegExp(`^ {${indent}}`, 'gm'), '')
}

const demo = (name) => {
  const file = path.join(ROOT, 'demos', `${name}.demo.vue`)
  if (!fs.existsSync(file)) return { blurb: '', examples: [], script: '', source: '' }
  const src = fs.readFileSync(file, 'utf8')
  const m = src.match(/export const blurb =\s*([\s\S]*?)(?=\n\nexport const |\n<\/script>)/)
  // The demo module is plain literals; evaluating them here keeps one source.
  const blurb = m ? new Function(`return (${m[1].trim()})`)() : ''
  // Each demo block as the code a reader would copy: no showcase frame, no note about it, and no
  // block drawn with a showcase stand-in, which an app could not import.
  const examples = [
    ...src.matchAll(/<DemoBlock[^>]*\btitle="([^"]+)"[^>]*>\n([\s\S]*?)\n\s*<\/DemoBlock>/g),
  ]
    .map(([, title, body]) => ({
      title,
      code: dedent(body),
    }))
    .filter((b) => !/<Demo[A-Z]/.test(b.code))
  // The data the examples bind, with the library's own imports as an app writes them.
  const script = (src.match(/<script setup[^>]*>\n([\s\S]*?)\n<\/script>/)?.[1] ?? '')
    .replace(
      /^import [^\n]* from '\.\.\/((?:composables|utils|types)\/\w+)'$/gm,
      (statement, module) => publicImport(statement, module, `demos/${name}.demo.vue`),
    )
    // A component's own types come from the entry, as the component does.
    .replace(
      /^(import type \{[^}\n]*\}) from '\.\.\/components\/Ui\w+\.vue'$/gm,
      `$1 from '${pkg.name}'`,
    )
  // An import over several lines is not rewritten; it would reach the text with a relative path.
  if (/from '\.\.\/(composables|utils|types|components|i18n)\//.test(script))
    throw new Error(`demos/${name}.demo.vue: write each import of the library on one line`)
  return { blurb, examples, script, source: src }
}

/** Every page of the reference: a component page each. */
export const pages = Object.entries(REGISTRY)
  .filter(([, e]) => !e.parent)
  .map(([name, entry]) => ({
    name,
    entry,
    label: labelOf(name),
    spoken: spokenLabelOf(name),
    path: pageOf(name),
    ...demo(name),
    api: api.components[name],
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

const byName = new Map(pages.map((p) => [p.name, p]))
export const link = (name) => {
  const p = byName.get(name)
  return p ? `[${p.spoken}](${SITE}${p.path})` : `\`${name}\``
}

// The command that installs it, as the README's `## Use` says it first. One place to change, read
// by the package texts too.
const INSTALL_COMMAND = (() => {
  const use = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').split(/^## Use$/m)[1] ?? ''
  const command = /^```bash\n(npm i \S+)\n```$/m.exec(use)?.[1]
  if (!command?.startsWith(`npm i ${pkg.name}`))
    throw new Error('README.md ## Use: the first bash block is not `npm i <the package>`')
  return command
})()

// The least Tailwind the package takes, from its peer range: the texts never name another.
const TAILWIND_FLOOR = pkg.peerDependencies.tailwindcss.replace(/^\^/, '')

export const INSTALL = `Vue 3 components as a plain package: \`${INSTALL_COMMAND}\`, then \`app.use(createGrani())\`. Tailwind ${TAILWIND_FLOOR} or later: \`@import 'tailwindcss'; @import '${pkg.name}/style.css';\` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and \`@import '${pkg.name}/base.css';\` after it is an optional base for the app's own). Components are imported from \`${pkg.name}\` (\`import { UiButton } from '${pkg.name}'\`) or resolved in templates as <UiName> by \`GraniResolver\` from \`${pkg.name}/resolver\` through unplugin-vue-components.`

export const SETUP = [
  `Brand: override the eight \`--color-brand*\` variables in your own stylesheet, below the imports, in \`:root\` for the light theme and again in \`.dark\` for the dark one; never edit the package's files. Shape: the \`--radius-*\` variables. Gutters: \`--space-overlay\`, \`--space-surface\`, \`--space-surface-md\`, \`--space-drawer\`. The dark theme is the \`dark\` class on \`<html>\`. Guides: ${SITE}/guide/theming.md and ${SITE}/guide/dark-mode.md`,
  "Colors in the app's own markup: the theme's classes, which follow the brand and the dark theme. The page `bg-bg`; a panel `bg-surface`, a quieter one `bg-surface-muted`; words `text-fg`, quieter words `text-fg-muted` (`text-fg-subtle` is for a mark beside them, an icon or a dot, never for words to read: 2.5:1 on white); a line `border-border`; a state `text-danger`, `bg-success-subtle` and their kin for `danger`, `warning`, `success` and `info`; never Tailwind's raw palette (`bg-neutral-50`, `text-gray-500`) or a hex, which stay the same in the dark theme and under any brand.",
  "Language: `createGrani({ locale, translate })`. `locale` is a BCP 47 tag, or a ref or getter of one, and drives dates, numbers, money and plural forms; `translate(key, params)` returns the app's text for grani's keys, or nothing (or the key itself) to keep grani's English. `grani-ui/i18n` exports `en` and `ru`, grani's keys with their text, to feed into the app's own i18n, or `translate: (key) => ru[key]` without one.",
  "Size: `createGrani({ size: 'xs' | 'sm' | 'md' })` sets the size of every control without a size of its own; `grani.setSize()` changes it later. Zone and money: `createGrani({ timeZone, currency })`, `grani.setTimeZone()`, `grani.setCurrency()`.",
  "Links and server values: `createGrani({ link, shared })`. `link` is the component that draws a link to the app's own paths (unset, `RouterLink` when the app has a router, else a plain anchor); `shared` is the values a server wrote into the page with `sharedSnapshot(app)`, so the first render reads the same.",
  "Helpers the entry exports: `rangeFor(preset, today)` gives the days of a named period (`{ from, to }`, whole months), `periodBounds(period, { timeZone, locale, min, max })` the moments it covers for a query (`at >= start && at < end`, the last day whole, by the app's clock, a named period counted from today with the filter's window), and `RANGE_PRESETS` the periods in the order a UiDateRange panel lists them, for the app's own query; `formatChartValue(useUiT(), value, format)` writes a value and `parseChartDate(value)` reads a point of a time axis the way the charts do, for a headline or a tooltip of the app's own.",
  "Outside a component (a router guard, a timer): `grani.toast` and `grani.confirm`, the instance's own `useToast()` and `useConfirm()`; inside one, `useGrani()` returns the instance.",
]

/** The way in and the app's settings under one heading, a paragraph each. */
export const SETUP_SECTION = ['## Setup', '', ...[INSTALL, ...SETUP].flatMap((l) => [l, ''])].slice(
  0,
  -1,
)

/** How to use the reference, before what is in it: choose, read the contract, build the screen. */
export const WORKFLOW = [
  '## How to use this reference',
  '',
  `1. Check the installed ${pkg.name} version (\`npm ls ${pkg.name}\`); this text is ${pkg.version}.`,
  '2. Choose components from the catalog, or start from the task below.',
  "3. Read a component's page before writing code: its whole example, its API and what it leaves to the app.",
  '4. Use only the documented props, events and slots.',
  '5. When the components make a screen together, read the patterns for what the person does there: focus, errors, waiting, closing.',
]

/** The usual tasks and the component each starts from. */
export const TASKS = [
  '## Start from the task',
  '',
  '- A list of records with search, filters, selection and pages: `UiDataTable`.',
  '- A record edited in a side panel, with Save: `UiCrudDrawer`.',
  '- A field with its label, hint and error: `UiField` around the control (`UiInput`, `UiSelect`, `UiDatePicker`...).',
  '- A question before an action that cannot come back: `UiConfirm`, or `useConfirm()`.',
  '- The outcome of an action: `useToast()`, with `UiToaster` mounted once.',
  '- Settings as rows: `UiList` with `UiListItem`, in a `UiCard`.',
  '- A figure over time in a card: `UiChartCard` around `UiAreaChart`, `UiBarChart` or `UiSparkline`.',
]

/** What goes wrong when an agent writes code against the package. */
export const MISTAKES = [
  '## Common mistakes',
  '',
  `- Import components from \`${pkg.name}\`; use only the documented entry points (\`${pkg.name}\`, \`${pkg.name}/resolver\`, \`${pkg.name}/i18n\`, \`${pkg.name}/test\`, \`${pkg.name}/style.css\`, \`${pkg.name}/base.css\`, \`${pkg.name}/theme.css\` with \`${pkg.name}/classes/<Name>.css\` per component).`,
  '- Set up auto-imports (`GraniResolver`) before using components without an import.',
  `- With \`${pkg.name}/theme.css\`, import \`${pkg.name}/classes/<Name>.css\` for every component the app uses: a component without its file renders without its styles. Never point \`@source\` into \`node_modules/${pkg.name}\`: Tailwind then scans the whole folder, every component with it.`,
  '- Mount `UiToaster` once when using `useToast()`, and `UiConfirm` once when using `useConfirm()`.',
  "- Under Yarn Plug'n'Play keep grani unpacked, as its package asks (`preferUnplugged`): kept in a zip, its files reach the development server but not the production build, and the components ship unstyled with no warning.",
  "- Import Tailwind without `prefix()`: with it the build stays green and the components show unstyled (with `grani-ui/style.css`, `createGrani()` warns in the browser's console in development).",
  '- Keep an empty string and `null` apart where a component documents the difference.',
  "- Check each component's props in its API; do not borrow prop names from another UI library.",
  '- Components do no requests: the app fetches, saves, checks permissions and passes the data and the states in.',
  "- Leave no empty list at a dead end: give the step only the app knows, such as adding the first record or creating what was searched for, in UiDataTable's `#empty-actions` (UiTable's `#empty`), beside the table's own Clear search.",
]

function apiLines(a, name) {
  const out = []
  if (a?.props.length) {
    out.push('Props:')
    for (const p of a.props) {
      const values = p.values ? ` = \`${p.values.join(' | ')}\`` : ''
      const req = p.required ? ' (required)' : ''
      const def = p.default ? ` (default \`${p.default}\`)` : ''
      out.push(`- \`${p.name}\`: \`${p.type}\`${values}${req}${def}${p.doc ? ` — ${p.doc}` : ''}`)
    }
    out.push(attrsLine(name), '')
  }
  if (a?.events.length) {
    out.push(
      'Events:',
      ...a.events.map(
        (e) =>
          `- \`${e.name}\`${e.payload ? ` (\`${e.payload}\`)` : ''}${e.doc ? ` — ${e.doc}` : ''}`,
      ),
      '',
    )
  }
  if (a?.slots.length) {
    out.push(
      'Slots:',
      ...a.slots.map(
        (s) =>
          `- \`${s.name}\`${s.scope ? ` with \`${s.scope}\`` : ''}${s.doc ? ` — ${s.doc}` : ''}`,
      ),
      '',
    )
  }
  return out
}

// The composables an app calls to drive the component (`useConfirm` for UiConfirm, `useToast` for
// UiToaster): the pieces it stands on that the package exports and whose doc names it.
const exported = (name) =>
  [...ENTRY].some(([mod, names]) => (names === true ? mod.endsWith(`/${name}`) : names.has(name)))
const driversOf = (p) =>
  (p.entry.logic ?? [])
    .map((n) => api.composables[n])
    .filter((c) => c && /^use/.test(c.name) && exported(c.name) && c.doc?.includes(p.name))

function composableLines(c, h) {
  const out = [`${h}## \`${c.signature}\``, '', c.doc, '']
  if (c.members?.length)
    out.push(
      'Returns:',
      ...c.members.map((m) => `- \`${m.name}\`: \`${m.type}\`${m.doc ? ` — ${m.doc}` : ''}`),
      '',
    )
  for (const t of c.types ?? []) {
    if (!t.fields?.length) continue
    out.push(
      `\`${t.name}\`${t.doc ? `: ${t.doc}` : ''}`,
      '',
      ...t.fields.map((f) => `- \`${f.name}\`: \`${f.type}\`${f.doc ? ` — ${f.doc}` : ''}`),
      '',
    )
  }
  return out
}

// A rule reaches a component's page when it is shown there or the component has its own words for
// it, in the page's order: most important first, the component's lead before them.
const rulesOn = (name) =>
  orderOn(
    name,
    RULES.filter((r) => name in r.at || r.holds?.[name]),
  )

/** One page of the reference as Markdown, the page's twin at `<path>.md`. */
export function pageMarkdown(p, depth = 1) {
  const h = '#'.repeat(depth)
  const { entry } = p
  const out = [
    `${h} ${p.spoken} (\`${p.name}\`)`,
    '',
    `> ${p.blurb}`,
    '',
    `A component of ${pkg.name} ${pkg.version}. ${FAMILIES[entry.family].label}, ${entry.status}, since ${entry.since}. Page: ${SITE}${p.path}`,
    '',
    ...(entry.aka?.length ? [`Also called ${entry.aka.join(', ')}.`, ''] : []),
  ]
  if (depth === 1) out.push(INSTALL, '')
  if (entry.over) out.push(`It works on top of ${link(entry.over)}.`, '')
  // The first example whole: its imports, its data and its template, as an app copies it.
  const first = p.examples[0]
  const whole = first && p.source ? blockCode(p.source, first.title) : ''
  if (p.api) out.push(`${h}# Use`, '', '```vue', whole || minimalOf(p.name, p.api), '```', '')
  // Who does what: the library's part from its rules, the app's from what each rule leaves to it.
  const own = rulesOn(p.name)
  const provided = own.filter((r) => r.who === 'library').map((r) => r.title)
  const leftToApp = own
    .map((r) => (r.who === 'app' ? r.title : r.holds?.[p.name]?.yours))
    .filter((y) => y && !/^Nothing\b/.test(y))
  const sentence = (t) => (t.endsWith('.') ? t : `${t}.`)
  out.push(
    `${h}# Who does what`,
    '',
    `Provided by ${pkg.name}:`,
    '',
    '- Rendering, keyboard and screen reader behavior, and the states this page names.',
    ...provided.map((t) => `- ${sentence(t)}`),
    '',
    'Implemented by the app:',
    '',
    '- Data fetching, saving, permissions and business rules.',
    ...leftToApp.map((t) => `- ${sentence(t)}`),
    '',
  )
  const doc = p.api?.doc
  if (doc) {
    out.push(`${h}# Why it works this way`, '', doc.lead, '')
    for (const d of doc.decisions) out.push(d.label ? `**${d.label}.** ${d.text}` : d.text, '')
    const sections = [
      ['Keyboard', doc.keyboard],
      ['Screen reader', doc.reader],
      ['States', doc.states],
      ['When to use another component', doc.notFor],
    ]
    for (const [title, text] of sections) if (text) out.push(`${h}## ${title}`, '', text, '')
  }
  // The first is under Use; each of the rest whole as well, with its own imports and data, so a
  // copy of one runs alone in an app that refuses an unused name.
  const rest = whole ? p.examples.slice(1) : p.examples
  if (rest.length) {
    out.push(`${h}# Examples`, '')
    for (const b of rest)
      out.push(
        `${h}## ${b.title}`,
        '',
        '```vue',
        (p.source && blockCode(p.source, b.title)) || b.code,
        '```',
        '',
      )
  }
  if (p.api) {
    const own = apiLines(p.api, p.name)
    const calls = driversOf(p)
    out.push(`${h}# API`, '')
    // A component with no props, events or slots says so: an empty section reads as a page cut off.
    if (!own.length) out.push(`No props, events or slots of its own. ${attrsLine(p.name)}`, '')
    out.push(...own)
    for (const c of calls) out.push(...composableLines(c, h))
  }
  for (const [part, e] of Object.entries(REGISTRY)) {
    if (e.parent !== p.name || !api.components[part]) continue
    out.push(
      `${h}## ${spokenLabelOf(part)} (\`${part}\`)`,
      '',
      ...apiLines(api.components[part], part),
    )
  }
  const rules = rulesOn(p.name)
  if (rules.length) {
    out.push(`${h}# How it behaves`, '')
    // A rule this component has its own words for is told in them, field by field, for an agent
    // to act on; the others keep their one line.
    const told = rules.filter((r) => r.holds?.[p.name])
    for (const r of told)
      out.push(`${h}## ${r.label ?? r.title}`, '', ...holdsLines(r, p.name, SITE), '')
    for (const r of rules.filter((x) => !told.includes(x)))
      out.push(`- ${r.title}: ${r.summary} Why: ${r.why}`)
    out.push('', `The patterns: ${SITE}/patterns`, '')
  }
  const over = pages.filter((q) => q.entry.over === p.name)
  if (over.length)
    out.push(`${h}# Built on it`, '', ...over.map((q) => `- ${link(q.name)}: ${q.blurb}`), '')
  // The pieces it stands on that an app can import too; the internal ones stay unnamed, since an
  // agent reading a name tries to import it.
  const shared = (entry.logic ?? []).filter((l) => exported(l))
  if (shared.length)
    out.push(
      `Built with what \`${pkg.name}\` exports: ${shared.map((l) => `\`${l}\``).join(', ')}.`,
      '',
    )
  return out.join('\n')
}

const WHO = {
  library: 'the library by itself',
  app: 'the app that uses it',
}

/** How many tests prove a rule, as its line says it; the names are in the file of tests. */
const proofsOf = (r) =>
  r.proof
    ? Object.entries(r.proof).flatMap(([spec, its]) => [its].flat().map((it) => `${spec}: “${it}”`))
    : []

/** One rule as a reader acts on it: what, why, who, where; how it is proved, counted or listed. */
function ruleLines(r, h, listProofs) {
  const out = [`${h} ${r.title}`, '', r.summary, '', `Why: ${r.why}`, '']
  const where = placesOf(r).map(link)
  // A rule of the library no component keeps yet is the app's to keep until it is built: saying
  // the library holds it, beside "held by no surface", told an agent both at once.
  if (r.who === 'library' && !where.length) out.push('Not built yet: until it is, the app does it.')
  else
    out.push(
      `Held by ${WHO[r.who]}.`,
      where.length
        ? `Where: ${where.join(', ')}.`
        : `Where: in the app's own screens; no component of the library holds it by itself.`,
    )
  const proofs = proofsOf(r)
  if (proofs.length)
    out.push(
      listProofs
        ? `Proof, in the tests: ${proofs.join('; ')}.`
        : `Tests: ${proofs.length}, named in patterns/tests.md beside this chapter`,
    )
  if (linkOf(r)) out.push(`Link: ${SITE}${linkOf(r)}`)
  out.push('')
  return out
}

/** What the rules are, with the count of those a test proves: the patterns page and llms.txt say it alike. */
export const CHAPTERS_LEAD = (
  n = RULES.length,
  proved = RULES.filter((r) => proofsOf(r).length).length,
) =>
  `${n} interaction patterns, by what the person is doing, with explanations, who implements them and test references where available (${proved} of them have tests).`

/** The rules of behavior, by moment: the /patterns page as Markdown, without the lists of tests. */
export function rulesMarkdown(depth = 1) {
  const h = '#'.repeat(depth)
  const proved = RULES.filter((r) => proofsOf(r).length).length
  const out = [
    `${h} How admin screens behave: the patterns of ${pkg.name}`,
    '',
    `> ${CHAPTERS_LEAD(RULES.length, proved)}`,
    '',
    `Page: ${SITE}/patterns`,
    '',
    'One chapter alone:',
    ...Object.keys(MOMENTS).map((k) => `- ${SITE}/patterns/${momentSlug(k)}.md`),
    '',
  ]
  for (const [key, m] of Object.entries(MOMENTS)) {
    const rules = RULES.filter((r) => r.moment === key)
    if (!rules.length) continue
    out.push(`${h}# ${m.label}`, '', m.summary, '', `Page: ${SITE}${momentPath(key)}`, '')
    for (const r of rules) out.push(...ruleLines(r, `${h}##`, false))
  }
  return out.join('\n')
}

/** One chapter of the rules alone, at `patterns/<chapter>.md`: what a task of that moment needs. */
export function chapterMarkdown(key) {
  const m = MOMENTS[key]
  const out = [
    `# ${m.label}: the patterns of ${pkg.name}`,
    '',
    m.summary,
    '',
    `Page: ${SITE}${momentPath(key)}`,
    '',
  ]
  for (const r of RULES.filter((x) => x.moment === key)) out.push(...ruleLines(r, '##', false))
  return out.join('\n')
}

// The checks of `grani-ui/test`, each with the pattern it stands on and what it does to the screen;
// `test/consumerChecks.spec.ts` holds this list to `test/index.ts`.
export const TEST_CHECKS = [
  {
    name: 'focusStartsInside',
    rule: 'focusStart',
    options: '{ opener, panel, start }',
    does: 'opens the panel with Enter on `opener` and checks that the focus lands on `start`',
  },
  {
    name: 'focusComesBack',
    rule: 'focusBack',
    options: '{ opener, panel, close }',
    does: 'opens the panel, closes it with Escape or with `close`, and checks that the focus is back on `opener`',
  },
  {
    name: 'focusGoesToInvalid',
    rule: 'focusInvalid',
    options: '{ submit, field }',
    does: 'presses Enter on `submit` of a form that holds a refused value and checks that the focus goes into `field`, in view',
  },
  {
    name: 'lateAnswerDropped',
    rule: 'lateDropped',
    options: '{ search, results, endpoint, queries }',
    does: 'types two searches, lets the answer to the second arrive first, and checks that the answer to the first does not replace `results`',
  },
  {
    name: 'refreshKeepsRows',
    rule: 'noJolt',
    options: '{ rows, refresh, endpoint }',
    does: 'starts a refresh (a sort, another page, a Refresh button; not a new search, whose answer is new rows on purpose), holds its answer, and checks that the same `rows` stay, inside an element with `aria-busy="true"` and drawn dimmer',
  },
]

const ownChecks = () => [
  '## Run the same checks on your screens',
  '',
  `\`${pkg.name}/test\` gives your Playwright suite the checks below, for screens built with ${pkg.name}. A check works the screen with the keyboard and by typing, and reads what a person gets: the focus, ARIA, the styles drawn, the requests. A state counts once it holds for 300 ms, so a focus that leaves a moment later still fails. A failure names the pattern and the chapter that explains it. A check that cannot run, because a locator matches nothing or a search sends no request, fails with \`${pkg.name}/test <check>:\` and what to fix in the test.`,
  '',
  ...TEST_CHECKS.map(
    (c) => `- \`${c.name}(page, ${c.options})\` ${c.does}: "${PATTERNS[c.rule].title}".`,
  ),
  '',
  'Your app installs `@playwright/test` 1.39 or later; grani does not.',
  '',
  '```ts',
  "import { test } from '@playwright/test'",
  `import { focusComesBack } from '${pkg.name}/test'`,
  '',
  "test('closing the invoice gives the focus back to Edit', async ({ page }) => {",
  "  await page.goto('/invoices')",
  '  await focusComesBack(page, {',
  "    opener: page.getByRole('button', { name: 'Edit INV-1001' }),",
  "    panel: page.getByRole('dialog', { name: 'INV-1001' }),",
  '  })',
  '})',
  '```',
  '',
]

/** The tests behind the rules, named, at `patterns/tests.md`. */
export function testsMarkdown() {
  const out = [
    `# The tests behind the patterns of ${pkg.name}`,
    '',
    'Each test is named by its spec file and its title. The specs are in the repository, not in the package.',
    '',
    ...ownChecks(),
  ]
  for (const r of RULES.filter((x) => proofsOf(x).length))
    out.push(`## ${r.title}`, '', `Proof, in the tests: ${proofsOf(r).join('; ')}.`, '')
  return out.join('\n')
}

/** The chapters' keys and their files, for the site to write. */
export const CHAPTERS = Object.keys(MOMENTS).filter((k) => RULES.some((r) => r.moment === k))

/** The package's llms.txt and the site's llms-full.txt: everything in one file. */
export function packageText() {
  return [
    `# ${pkg.name}`,
    '',
    `> ${pkg.description}`,
    '',
    `Version ${pkg.version}.`,
    '',
    ...WORKFLOW,
    '',
    ...SETUP_SECTION,
    '',
    ...TASKS,
    '',
    ...MISTAKES,
    '',
    '## Components',
    '',
    ...pages.map((p) => pageMarkdown(p, 3)),
    rulesMarkdown(2),
  ].join('\n')
}

// Where the package's text files stand, from the app's root: the paths an agent reads.
const IN_PACKAGE = `node_modules/${pkg.name}`
const pageFile = (p) => `llms${p.path}.md`
const chapterFile = (k) => `llms/patterns/${momentSlug(k)}.md`

/** The package's llms.txt: a map to the files beside it, small enough for an agent to read whole. */
// What grani is to an agent, before what it holds: screens that behave alike, by rules it reads here.
const CONTRACT = [
  '> Screens built with grani behave alike: the focus comes back where it was, a late answer never replaces a newer search, typed text that failed to add comes back to its field.',
  '> The interaction patterns below say how, most of them proved by a test.',
]

export function packageIndex() {
  return [
    `# ${pkg.name}`,
    '',
    ...CONTRACT,
    '',
    `Version ${pkg.version}. ${pkg.description}`,
    '',
    ...WORKFLOW,
    '',
    ...SETUP_SECTION,
    '',
    ...TASKS,
    '',
    ...MISTAKES,
    '',
    '## Interaction patterns',
    '',
    CHAPTERS_LEAD(),
    '',
    ...CHAPTERS.map(
      (k) => `- [${MOMENTS[k].label}](${IN_PACKAGE}/${chapterFile(k)}): ${MOMENTS[k].summary}`,
    ),
    `- [The tests behind the patterns](${IN_PACKAGE}/llms/patterns/tests.md): each named by its spec file and title, and \`${pkg.name}/test\`, to run some of them in your Playwright suite on your own screens.`,
    '',
    '## Components',
    '',
    'A page per component: its whole example, its API, what it leaves to the app and the patterns it keeps.',
    '',
    ...pages.map((p) => {
      // A part has no page: its API is on its parent's, and the line says so.
      const parts = Object.entries(REGISTRY)
        .filter(([, e]) => e.parent === p.name)
        .map(([name]) => name)
      const held = parts.length ? ` Parts on this page: ${parts.join(', ')}.` : ''
      // The other names it goes by stand beside the spoken one, so an agent asked for an accordion
      // finds Reveal in the map without opening every page.
      const aka = p.entry.aka?.length ? ` (also ${p.entry.aka.join(', ')})` : ''
      return `- [${p.name}](${IN_PACKAGE}/${pageFile(p)}): ${p.spoken}${aka}. ${p.blurb}${held}`
    }),
    '',
    '## Guides',
    '',
    'The guides of the README, for people as for agents, beside this file:',
    '',
    ...guides().map((g) => `- [${g.title}](${IN_PACKAGE}/docs/guides/${g.file}): ${g.lead}`),
    '',
    '## Optional',
    '',
    `- [Everything above in one file](${SITE}/llms-full.txt): every component with its example and API, and the patterns, on the site.`,
    `- [The showcase](${SITE}): every component live, in both themes.`,
  ].join('\n')
}

// The guides the package ships (`docs/guides`), each by its title and its first sentence.
function guides() {
  const dir = path.join(ROOT, 'docs/guides')
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const text = fs.readFileSync(path.join(dir, file), 'utf8')
      const title = /^# (.+)$/m.exec(text)?.[1] ?? file
      const para =
        text.split(/\n\n/).find((b) => b.trim() && !/^(#|```|\||- )/.test(b.trim())) ?? ''
      const lead =
        para
          .replace(/\s+/g, ' ')
          .trim()
          .split(/(?<=\.)\s/)[0] ?? ''
      return { file, title, lead }
    })
}

/** Every text file the package carries, by its path in the package. */
export function packageTexts() {
  return {
    'llms.txt': packageIndex(),
    ...Object.fromEntries(pages.map((p) => [pageFile(p), pageMarkdown(p)])),
    ...Object.fromEntries(CHAPTERS.map((k) => [chapterFile(k), chapterMarkdown(k)])),
    'llms/patterns/tests.md': testsMarkdown(),
  }
}
