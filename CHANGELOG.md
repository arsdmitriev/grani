# Changelog

Before 1.0 a minor version may include a breaking change; its section then says how to move.

## 0.1.0 — 2026-10-27

The first version brings 95 interaction patterns for admin apps, each with a live example, and the
63 Vue components that keep them (66 with the parts they are built from).

A pattern says what a person gets on the screen: where keyboard focus goes, what stays in view
while a request runs, how a refused value or a finished action is reported. The components keep
the patterns in forms, tables, charts, navigation and overlays, in light and dark themes, in
English and Russian.

- Added Patterns: 95 patterns in six chapters, from keyboard focus and loading states to errors
  and feedback; each has a live example, names the components that keep it, and most are backed
  by tests.
- Added Components: 63 components and blocks on Vue 3.5 and Tailwind CSS 4, each with its API and a
  complete example.
- Added grani-ui/test: five Playwright checks an app runs on its own screens; a failed check names the
  pattern and the chapter that explains it.
- Added useListAddress: keeps a list's search, sort, page and filters in the page's URL, so a
  reload, a shared link or Back opens the list as it was.
- Added llms.txt: the patterns and the components as text for coding agents, read from
  `node_modules` and matching the installed version.
- Added Registry: `aka`, the other names a component goes by (accordion for UiReveal, toggle for
  UiSwitch); the showcase's search, the component's page and llms.txt use them.
- Changed UiDataTable: a `money` column aligns to the end by itself, digit under digit, and
  `align: 'start'` keeps it at the start.
