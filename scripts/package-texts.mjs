// The package's text files for agents, written on pack: llms.txt, a map, and llms/ beside it.
// It reads the package alone (the registry, the API reference, the rules and the demos), so the
// public repository writes them as this one does. `llms/` is written anew: a page of a component
// renamed or gone leaves with it.

import fs from 'node:fs'
import path from 'node:path'
import { ROOT, packageTexts } from './reference/text.mjs'

const files = packageTexts()
fs.rmSync(path.join(ROOT, 'llms'), { recursive: true, force: true })
for (const [file, text] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true })
  fs.writeFileSync(path.join(ROOT, file), text.endsWith('\n') ? text : `${text}\n`)
}
console.log(`package texts: ${Object.keys(files).length} files -> llms.txt, llms/`)
