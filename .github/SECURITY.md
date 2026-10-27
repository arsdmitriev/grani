# Security

Report a vulnerability privately through GitHub: the repository's Security tab, "Report a
vulnerability". Please do not open a public issue for it.

Only the latest published version gets fixes, and a fixed vulnerability gets a test that fails
without the fix.

## What grani holds to

Each of these is a test that runs with every change:

- Text stays text. No component writes a string into the page as HTML; a title, a label or an error
  holding markup shows its characters (`test/textStaysText.spec.ts`).
- One policy for links. UiLink, UiButton, UiListItem and the places of UiAppShell resolve an address
  alike, and a `javascript:`, `data:` or `vbscript:` address is not followed, however it is spelled
  with spaces, tabs or capitals (`utils/link.spec.ts`, `components/link.canon.spec.ts`).
- Server state goes into the page as data. `createGrani({ shared })` keeps only the keys
  `sharedSnapshot` writes, each with the shape it writes (a day, a moment, a toast id), and drops
  the rest: a toast, a question or a day of another shape never comes from the page
  (`utils/sharedSeed.spec.ts`). The Server rendering guide's example escapes `<` before it writes
  the state into a script, and its own line is run on a value holding `</script>`
  (`test/readme.spec.ts`).
- Requests keep their state apart when each request has an instance of its own, as the Server
  rendering guide asks: a toast or a question of one request never reaches another, and one
  instance installed in a second app on a server is warned about in the server's log, in production
  too
  (`test/ssr/scope.ssr.spec.ts`).
- One rule for where a link goes. An address is read as the browser's URL parser reads it (spaces
  and control characters at its ends, tabs and line breaks in it), and one the parser sends to another
  site opens in a new tab with `noreferrer`, however it is spelled (`utils/link.spec.ts`).
- A column's width from the app's data is one CSS value: it never brings another declaration into
  the page a server writes (`test/ssr/render.ssr.spec.ts`).
- Input it cannot read is handled the same way every time. An impossible date shows empty and sends
  an empty value, a count that is not a number shows nothing, and a day outside `min` and `max` is
  kept and marked invalid (the specs of UiDatePicker and UiCount).

## What grani does not protect

These are the app's to hold; grani does not check them for you:

- Markup you put in a slot is yours: grani renders a slot as it is written.
- An attribute a component does not declare falls through to its root element: an object of data
  spread with `v-bind` can bring `onclick`, `style` or `formaction` with it. Pass the keys you chose.
- A value that becomes markup or CSS comes from the app's code, not from its data: a log event's
  `anchor` (an element id), UiStack's `as`. A column's `width` is the one checked, to a single CSS
  value.
- `format`, `accessor` and `translate` return text: markup in it shows as its characters, and
  direction marks, control characters and look-alike letters in a name (a file's, a person's) show
  as they are.
- Of addresses, only `javascript:`, `data:` and `vbscript:` are refused. An image's address loads as
  given: limit it with `img-src`, or serve images through the app.
- `accept`, `maxFiles`, `maxSize` and `limit` shape what a person can pick, they control nothing: the
  server checks what it receives.
- UiCopyButton copies its `value` as it is, the part `truncate` hides from the eye too.
- A request's state stays its own only with an instance per request (above).

## Content Security Policy

grani brings no script of its own to allow: no inline script, no `eval`, no font, style or script
from another host. Its components set inline styles (a column's width, a panel's place, a chart's
marks):

- Rendered in the browser, they need nothing more: Vue sets them through the CSSOM, which
  `style-src` does not govern.
- Rendered on a server, they stand in the HTML as `style` attributes, which a `style-src` without
  `'unsafe-inline'` drops, and hydration does not set them again. Allow attributes alone with
  `style-src-attr 'unsafe-inline'`.
- The state a server writes for `createGrani({ shared })`: the Server rendering guide writes it in an
  inline script, which a `script-src` without `'unsafe-inline'` or a nonce blocks. Under such a
  policy write it into a `<script type="application/json">`, which no `script-src` runs, its `<`
  escaped as the guide's example does, and read it back with `JSON.parse(element.textContent)`.

Before a version is published, the source repository runs three more checks, which the public
repository does not hold: gitleaks scans for secrets, the release check installs the packed package
in a clean app, and the browser tests drive Chromium. They are told apart: a pass of one says
nothing of the others.
