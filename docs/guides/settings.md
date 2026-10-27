# Settings

The options of `createGrani`, all optional: the language, the size of the controls, the zone and
the money, where overlays go, where view settings are kept, the link component and the focus ring.

`<UiButton to="/orders">` renders `RouterLink` when the app has vue-router; to draw another link
component (a framework's own), pass it as `createGrani({ link })`. The app's settings are options of its own instance,
never of the page: two apps on one page, or two requests on one server, each keep theirs. Two apps on
one page each set `app.config.idPrefix`, so the ids their components draw never repeat and a label of
one never focuses a field of the other. In development, a menu or popover that finds two buttons with
its id says so.

Settings, all optional:

```ts
const grani = createGrani({
  locale: () => i18n.global.locale.value, // a BCP 47 tag, a ref or a getter: dates, numbers, plurals
  translate: (key, params) => i18n.global.t(key, params ?? {}), // the app's text for grani's keys
  size: 'md', // every control without a size of its own, but UiCodeInput, which stays md; 'sm' unset
  timeZone: 'Europe/Berlin', // dates render in it; the device's zone unset
  currency: 'EUR', // money prints with it; the number alone unset
  teleport: '#overlays', // where windows, drawers and toasts are moved to; 'body' unset
  storage: sessionStorage, // where a table keeps its columns; localStorage unset
  focus: 'strong', // a focus ring of 3:1 or more, for the whole page; a quiet halo unset
})
app.use(grani)
grani.setSize('xs') // later, and the page follows: also setTimeZone, setCurrency
```

In the browser, `useToast()` and `useConfirm()` work in a click handler, after an `await` and in a
timer: when one app has installed grani, they reach it. With two apps on the page they cannot tell
which, so they warn in development; there, and in a router guard, use the instance: `grani.toast`
and `grani.confirm` are this app's. Inside a component, `useGrani()` returns the instance. On a
server this does not hold; see [Server rendering](server-rendering.md).

Keep one copy of grani in the app. When a library of the app brings its own, copies of one minor
line (`0.1.x`, later `1.2.x`) share the app's settings, toasts, questions, fields and link component;
copies of different lines stay apart, so a component of one reads none of the other's settings. In development
the console names the versions on the page; `npm dedupe`, or one version in every `package.json`,
leaves one.
