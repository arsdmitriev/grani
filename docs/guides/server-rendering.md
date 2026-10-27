# Server rendering

grani renders on a server and hydrates in the browser. Six things keep requests apart and the two
renders in agreement:

- One instance per request. `createGrani()` inside the request handler, not once at module load
  and reused: a reused instance keeps one request's toasts and shared state in the next's response,
  and the server's log says so the second time it is installed.
- Give `timeZone`. Unset, dates render in the zone of the machine, and the server's is not the
  person's.
- Overlays are teleported. Write what the render put in `ctx.teleports` into the page, at the start
  of `<body>` (or of your `teleport` target).
- Write the app's shared values into the page with `sharedSnapshot(app)` and hand them back with
  `createGrani({ shared })`, so the browser's first render reads the same day the server did. The
  browser takes back only what the snapshot writes, each value in its shape.
  Every key in it starts with `grani:`; hand the object back whole, as it came. In development the
  snapshot also says a toast or a question the render showed with no `<UiToaster />` or
  `<UiConfirm />` in the page, as the browser says it; an app that writes no snapshot is not told.
- Call `useToast()` and `useConfirm()` before an `await`, and keep what they return: a server
  renders many requests at once, so a call that reaches no app (outside a component's setup,
  after an `await`, or a render with no plugin installed) answers no one and keeps nothing; it
  warns once in development.
- With `focus: 'strong'`, write `data-grani-focus="strong"` on the page's `<html>` yourself. The
  plugin marks it in the browser only, so a page served without it draws the quiet halo until the
  app mounts.

```ts
// server, inside the request handler: a fresh instance every time
const app = createSSRApp(App).use(createGrani({ timeZone }))
const ctx: SSRContext = {}
const html = await renderToString(app, ctx)
// `<` as \u003c, so a value holding </script> cannot end the script early
const state = JSON.stringify(sharedSnapshot(app)).replace(/</g, '\\u003c')
const page = `<body>${ctx.teleports?.body ?? ''}<div id="app">${html}</div>
<script>window.__STATE__ = ${state}</script></body>`

// browser
createSSRApp(App)
  .use(createGrani({ timeZone, shared: window.__STATE__ }))
  .mount('#app')
```

A page served under a Content Security Policy needs one allowance for the `style` attributes a
server render writes: [SECURITY.md](https://github.com/arsdmitriev/grani/blob/main/.github/SECURITY.md#content-security-policy).
