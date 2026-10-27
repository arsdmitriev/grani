// The code of one demo tab as a reader copies it: the tab's markup and, when it binds anything,
// the part of the demo's script it needs, so it runs as pasted. Only what the markup reaches, and
// what that reaches in turn: another tab's data stays out.

const PKG = 'grani-ui'

/**
 * The script's top-level statements, one a chunk. The demos are formatted by Prettier: a
 * statement starts at the line's first column and runs on through its indented lines and its
 * closing brackets; a comment at the first column belongs to the statement under it.
 */
function chunksOf(script: string): string[] {
  const chunks: string[] = []
  let current: string[] = []
  let comment: string[] = []
  for (const line of script.split('\n')) {
    const starts = /^[^\s})\]]/.test(line)
    if (/^\/\//.test(line)) {
      comment.push(line)
      continue
    }
    if (starts) {
      if (current.length) chunks.push(current.join('\n'))
      current = [...comment, line]
      comment = []
    } else if (line.trim() === '' && !current.length) {
      continue
    } else {
      current.push(...comment, line)
      comment = []
    }
  }
  if (current.length) chunks.push(current.join('\n'))
  return chunks.map((c) => c.replace(/\n+$/, ''))
}

/** The names a statement declares at the top level. */
function declared(chunk: string): string[] {
  const code = chunk.replace(/^\/\/.*\n/gm, '')
  if (/^import\s/.test(code)) {
    const names: string[] = []
    const def = code.match(/^import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/)?.[1]
    if (def) names.push(def)
    const named = code.match(/\{([^}]*)\}/)?.[1]
    if (named)
      for (const spec of named.split(','))
        if (spec.trim())
          names.push(
            spec
              .trim()
              .replace(/^type\s+/, '')
              .split(/\s+as\s+/)
              .pop()!,
          )
    return names
  }
  const m = code.match(
    /^(?:export\s+)?(?:async\s+)?(?:const|let|var|function\*?|interface|type|enum|class)\s+([A-Za-z_$][\w$]*)/,
  )
  if (m) return [m[1]!]
  const destructured = code.match(/^(?:const|let|var)\s+[{[]([^}\]]*)[}\]]\s*=/)?.[1]
  if (destructured)
    return destructured
      .split(',')
      .map((s) =>
        s
          .split(':')
          .pop()!
          .replace(/=.*$/, '')
          .replace(/^\.\.\./, '')
          .trim(),
      )
      .filter(Boolean)
  return []
}

// The names a piece of code reads. Its comments and the text of its strings are left out (a
// template string's `${}` stays), so a word in a label, a class or a note is not taken for a name.
const words = (text: string) =>
  new Set(
    text
      .replace(/\/\/.*$/gm, '')
      .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g, "''")
      .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, (t) => (t.match(/\$\{[^}]*\}/g) ?? []).join(' '))
      // A spread reads its name; a key of an object and a property after a dot are not names.
      .replace(/\.\.\./g, ' ')
      .replace(/(^[ \t]*|[{,;][ \t]*)[A-Za-z_$][\w$]*\??\s*:(?!:)/gm, '$1')
      .match(/(?<![.\w$])[A-Za-z_$][\w$]*/g) ?? [],
  )

// The names the markup reads: the components it draws by their tags, its bound expressions
// (`{{ }}`, `:prop`, `v-*`, `@event`, a slot's props) and its template refs; never its text or a
// plain attribute's value, which only look like names (`type="email"`, `size="sm"`, a label "Copy").
const markupWords = (markup: string) =>
  words(
    [
      ...[...markup.matchAll(/<([A-Z][\w$]*)/g)].map((m) => m[1]!),
      ...[...markup.matchAll(/\{\{([\s\S]*?)\}\}/g)].map((m) => m[1]!),
      // A slot's props declare names of the markup's own; a loop reads only its list.
      ...[
        ...markup.matchAll(/\s(?::|@|v-(?!slot\b|for\b)[\w-]+)[\w.:[\]-]*="([^"]*)"/g),
        ...markup.matchAll(/\sref="([^"]*)"/g),
      ].map((m) => m[1]!),
      ...[...markup.matchAll(/\sv-for="[^"]*?\s(?:in|of)\s([^"]*)"/g)].map((m) => m[1]!),
    ].join('\n'),
  )

/** One import as an app writes it: the library's own modules come from the package's entry. */
function rewriteImport(statement: string, keep: Set<string>): string {
  const from = statement.match(/from\s+'([^']+)'/)?.[1] ?? ''
  // A picture of the showcase's own is the reader's: an address to put theirs in its place.
  const media = statement.match(/^import\s+([A-Za-z_$][\w$]*)\s+from\s+'\.\/media\/([^']+)'$/)
  if (media) return `const ${media[1]} = '/${media[2]}' // your own picture here`
  // A component comes from the resolver, as on every page; its types from the entry.
  if (/^\.\.\/components\/Ui\w+\.vue$/.test(from) && !/^import\s+type\s/.test(statement)) return ''
  const named = statement.match(/\{([^}]*)\}/)?.[1]
  let out = statement
  if (named !== undefined) {
    const specs = named
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) =>
        keep.has(
          s
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)
            .pop()!,
        ),
      )
    if (!specs.length) return ''
    out = statement.replace(/\{[^}]*\}/, `{ ${specs.join(', ')} }`)
  }
  if (/^\.\.\/(?:composables|utils|types|components)\//.test(from))
    out = out.replace(`'${from}'`, `'${PKG}'`)
  return out
}

// The composables whose work shows only through hosts the app mounts once: the call and its hosts.
// A question's failed action reports in a toast, so a question needs the toaster too.
const HOSTS: [RegExp, string[]][] = [
  [/\buseToast\(/, ['UiToaster']],
  [/\buseConfirm\(/, ['UiConfirm', 'UiToaster']],
]

/** The markup of the tab titled so, with the script it needs; the bare markup when it needs none. */
export function blockCode(source: string, title: string): string {
  if (!source || !title) return ''
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const body = source.match(
    new RegExp(`<DemoBlock[^>]*\\btitle="${escaped}"[^>]*>\\n([\\s\\S]*?)\\n\\s*</DemoBlock>`),
  )?.[1]
  if (body === undefined) return ''
  const indent = body.match(/^ */)?.[0].length ?? 0
  const markup = body.replace(new RegExp(`^ {${indent}}`, 'gm'), '')

  const script = source.match(/<script setup lang="ts">\n([\s\S]*?)\n<\/script>/)?.[1] ?? ''
  const chunks = chunksOf(script)
  const names = chunks.map(declared)
  const used = (chunk: string) => words(chunk)
  // A comment over an import speaks of the showcase's file, not the reader's: the import goes alone.
  const bare = (chunk: string) => chunk.replace(/^\/\/.*\n/gm, '')
  // A note to the showcase's own linter is not the reader's.
  const unlinted = (chunk: string) => chunk.replace(/^\/\/ lint:.*\n/gm, '')
  const isImport = (chunk: string) => /^import\s/.test(bare(chunk))
  // Grow from the markup's words: every statement that declares a word in use joins, and its
  // own words with it, until nothing new is reached.
  const taken = new Set<number>()
  const reach = markupWords(markup)
  let grew = true
  while (grew) {
    grew = false
    chunks.forEach((chunk, i) => {
      if (taken.has(i) || !names[i]!.some((n) => reach.has(n))) return
      taken.add(i)
      // An import reaches nothing: its other names stay out unless something reads them.
      if (!isImport(chunk)) for (const w of used(chunk)) reach.add(w)
      grew = true
    })
    // A statement that declares nothing (a watcher, a hook) stays when it acts on what is taken.
    chunks.forEach((chunk, i) => {
      if (taken.has(i) || names[i]!.length || isImport(chunk)) return
      // On what is taken as data: an imported function it calls (`watch`) is not a reason.
      const acts = [...used(chunk)].some((w) =>
        names.some((ns, j) => taken.has(j) && !isImport(chunks[j]!) && ns.includes(w)),
      )
      if (!acts) return
      taken.add(i)
      for (const w of used(chunk)) reach.add(w)
      grew = true
    })
  }
  const lines = chunks
    .map((chunk, i) => {
      if (!taken.has(i)) return ''
      return isImport(chunk) ? rewriteImport(bare(chunk), reach) : unlinted(chunk)
    })
    .filter(Boolean)
  // The package's names in one statement, its types in another, as a person writes them.
  const fromPkg = (type: boolean) =>
    lines
      .filter((l) => l.endsWith(`from '${PKG}'`) && /^import\s+type\s/.test(l) === type)
      .flatMap((l) =>
        l
          .match(/\{([^}]*)\}/)![1]!
          .split(',')
          .map((x) => x.trim()),
      )
      .filter(Boolean)
  // A toast or a question needs its host: in the app it stands once at the root, so a copy that
  // calls one carries it, marked, and runs alone.
  const kept = lines.join('\n')
  const hosts = [
    ...new Set(HOSTS.filter(([call]) => call.test(kept)).flatMap(([, names]) => names)),
  ].filter((host) => !markup.includes(`<${host}`))
  const full = hosts.length
    ? `${markup}\n<!-- Once, at the app's root: leave out what the app has there already. -->\n${hosts
        .map((host) => `<${host} />`)
        .join('\n')}`
    : markup
  // The components the markup draws come first: pasted into an app without the resolver, a
  // component left unimported is an empty page under a green build.
  const drawn = [...new Set([...full.matchAll(/<(Ui[A-Z]\w*)/g)].map((m) => m[1]!))]
  const values = [...new Set([...drawn, ...fromPkg(false)])]
  const merged = [
    ...lines.filter((l) => /^import\s/.test(l) && !l.endsWith(`from '${PKG}'`)),
    ...(fromPkg(true).length ? [`import type { ${fromPkg(true).join(', ')} } from '${PKG}'`] : []),
    ...(values.length ? [`import { ${values.join(', ')} } from '${PKG}'`] : []),
  ]
  const imports = merged
  const rest = lines.filter((l) => !/^import\s/.test(l))
  // A picture's address stands first among the values, as its import stood among the imports.
  rest.sort((a, b) => Number(/your own picture/.test(b)) - Number(/your own picture/.test(a)))
  if (!rest.length && !imports.length) return full
  const head = [...imports, ...(imports.length && rest.length ? [''] : []), rest.join('\n\n')]
    .join('\n')
    .trimEnd()
  const template = full.replace(/^(?=.)/gm, '  ')
  return `<script setup lang="ts">\n${head}\n</script>\n\n<template>\n${template}\n</template>\n`
}
