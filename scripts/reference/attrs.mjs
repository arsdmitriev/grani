import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Where the attributes a caller adds land, read from the component itself: on the root, or,
// for a component that splits them, class and style on the outer element and the rest on the
// control inside it. The page and the Markdown twin both say this line.
export function attrsLine(name) {
  const file = path.join(ROOT, 'components', `${name}.vue`)
  const src = name && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (src.includes('useSplitAttrs'))
    return 'Attributes: `class` and `style` stay on the outer element; the rest (native attributes, aria-*, data-testid) reach the control inside it.'
  if (/inheritAttrs:\s*false/.test(src))
    return 'Attributes are placed by the component itself: its description says where.'
  return 'Anything else lands on the root element: native attributes, aria-*, data-testid.'
}
