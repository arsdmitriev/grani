import { isDev } from './dev'

/** Said when the app's stylesheet does not bring grani's: the line it lacks. @internal */
export const NO_STYLESHEET =
  "[grani] grani's stylesheet is not on this page, so its components show unstyled. Add " +
  "`@import 'grani-ui/style.css';` after `@import 'tailwindcss';` in the app's stylesheet, or " +
  '`grani-ui/theme.css` before the `grani-ui/classes/<Name>.css` it imports.'

/** Said when grani's stylesheet came but Tailwind wrote none of its components' classes. @internal */
export const NO_CLASSES =
  "[grani] grani's stylesheet is on this page, but the classes of its components are not, so they " +
  "show unstyled: Tailwind did not read grani's files. The app's stylesheet needs " +
  "`@import 'tailwindcss';` before grani's, and Tailwind must run on it (on Vite, the " +
  "`@tailwindcss/vite` plugin in the config); `prefix()` on `@import 'tailwindcss'` is not " +
  'supported.'

/**
 * What keeps grani's components from their styles on this page, or nothing. Each stylesheet marks
 * itself on `:root` (`--grani-styles`: `all` from `grani-ui/style.css`, `theme` from `grani-ui/theme.css`),
 * and with `all` a class only Tailwind's reading of grani's files writes, `z-toast`, must be in the
 * sheet too. `theme.css` brings classes by component, so nothing is asked of it. A page with no
 * stylesheet at all is not judged: nothing of the app is styled either, and that is not grani's to
 * say. @internal
 */
export function stylesMissing(doc: Document): string | null {
  if (!doc.styleSheets.length) return null
  const sheet = getComputedStyle(doc.documentElement).getPropertyValue('--grani-styles').trim()
  if (!sheet) return NO_STYLESHEET
  if (sheet !== 'all') return null
  const probe = doc.createElement('div')
  probe.className = 'z-toast'
  probe.style.cssText = 'position: absolute; visibility: hidden'
  doc.body.append(probe)
  const z = getComputedStyle(probe).zIndex
  probe.remove()
  return z === 'auto' || z === '' ? NO_CLASSES : null
}

let checked = false

/**
 * In development, once per page: warn when grani's components will show unstyled, which the app's
 * build never says (a forgotten import, Tailwind's `prefix()`, a scan that did not reach grani's
 * files). Yarn Plug'n'Play is not among them: grani asks it to unpack the package
 * (`preferUnplugged`), and kept in a zip it would cost only the production build, where nothing runs
 * this. Read after the page has loaded and painted a frame, so a stylesheet still on its way is not
 * taken for a missing one. Never on a server and never in production. @internal
 */
export function checkStyles(): void {
  if (checked || typeof window === 'undefined' || typeof document === 'undefined' || !isDev())
    return
  checked = true
  // A DOM with no animation frames (jsdom as some test runners set it up) runs it on a timer; and
  // whatever it meets, a diagnostic never throws into the app it diagnoses.
  const frame =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (then: () => void) => setTimeout(then, 0)
  const run = () =>
    frame(() => {
      try {
        const said = stylesMissing(document)
        if (said) console.warn(said)
      } catch {
        // Nothing to say: the page could not be read.
      }
    })
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
}
