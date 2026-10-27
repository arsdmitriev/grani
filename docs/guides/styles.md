# Styles

The stylesheet brings the design tokens with a default brand, the font, the motion vocabulary and
the Tailwind 4 theme, and names its own files for the build. What the stylesheets do beyond grani's
elements:

- `grani-ui/style.css` styles grani's elements and nothing of the app's. Every element a grani component
  draws carries `data-grani`, already in the published build (the app's bundler adds nothing), and the base grani needs (a border color, a pointer on what can be
  pressed, the library's focus ring, thin scrollbars, the font's rendering, the theme's scheme and
  accent) is narrowed to those. The app keeps Tailwind 4's own base. What the app puts in a grani
  slot inherits what inherits (the font's rendering, the scheme) from the grani element around it.
- One rule of it reaches the whole page on purpose: when the person asks for reduced motion,
  transitions and animations stop everywhere, the app's included. It is accessibility, so it is not
  optional; it sits in the base layer with `!important`, so an app's own utility does not bring
  the motion back. An element with `data-motion-keep` keeps its motion.
- `grani-ui/base.css` is the same base for the whole app, optional: import it after `grani-ui/style.css`
  for a base close to Tailwind 3's (a border without a color is the border token, an enabled button
  has a pointer, a focused field and control show the library's ring, scrollbars are thin, the
  brand is the accent of native controls). Its rules sit in Tailwind's base layer, so a utility of
  the app on its own element wins. grani renders the same with it and without it.

  ```css
  @import 'tailwindcss';
  @import 'grani-ui/style.css';
  @import 'grani-ui/base.css';
  ```

- grani's font, Golos Text, stands on grani's components alone, each set on its outermost element: the
  app's own text keeps its font and its line heights, and a class on a component (`font-mono`) reaches
  its label. `--font-grani` sets another font for grani; `grani-ui/base.css` gives Golos to the page.
- `grani-ui/theme.css` is `style.css` without the classes of grani's components, for an app that uses
  a few of them. Add `grani-ui/classes/<Name>.css` for each component the app imports: it brings the
  classes of that component and of everything it is built from (UiInput's clear button, UiModal's
  close button). Measured in a Vite app with UiButton and UiInput: 9.0 kB gzip, against 18.7 kB for
  `style.css`.

  ```css
  @import 'tailwindcss';
  @import 'grani-ui/theme.css';
  @import 'grani-ui/classes/UiButton.css';
  @import 'grani-ui/classes/UiInput.css';
  ```

- The theme names its tokens plainly: `--color-surface`, `--color-border`, `--color-ring` and the
  rest. An app whose own theme uses the same names shares them with grani: the last definition wins
  for both. Define a value once and both follow, or rename yours.
- The focus ring is a quiet halo unless the app asks for more: about 1.2:1 against the surface,
  below the 3:1 WCAG 2.2 asks of a focus mark, and a focused field keeps its border's color. An app
  that needs the mark sets `createGrani({ focus: 'strong' })`: a ring of the text color over a gap
  of the surface, 3:1 or more on either theme and with any brand. The highlighted row of a menu or
  a list is no ring: beside its band it wears a bar of the brand at its start edge, 3:1 or more with
  any brand the contrast check passes (5.5:1 with the default one), in both modes. Every ring reads the
  `--ui-ring*` variables, so an app may also set its own: on `:root`, or with the strong ring on
  `:root[data-grani-focus='strong']`, which it otherwise wins over.

In Windows high contrast mode the browser drops fills and shadows: grani draws its focus outline and
the marks of its state (a progress bar, the selected tab) in the system's colors instead. Those
rules reach only grani's own elements; `grani-ui/base.css` gives the app's elements the focus outline.

Style grani through its tokens and props. The `ui-*` classes and `data-*` attributes in its markup are
internal for now and may change in any version; a styling contract on attributes comes later.

The dark theme is the `dark` class on `<html>`. [Dark mode](dark-mode.md) points Tailwind's
`dark:` variant at it, gives the page the theme's background, sets the class before the first paint
and gives the person a switch.
