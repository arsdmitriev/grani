# Brand

Set your brand by overriding the eight `--color-brand*` variables in your own stylesheet, after the imports, once for
each theme. The stylesheet sets the dark eight under `.dark`, at the specificity of `:root`, so one
block alone leaves one theme wrong: your light brand on dark surfaces, or the default brand there when
your rule comes first. The theme page of the showcase writes both blocks from one color:

```css
:root {
  --color-brand: rgb(79 70 229);
  --color-brand-hover: rgb(64 53 196);
  --color-brand-fg: rgb(255 255 255);
  --color-brand-solid: rgb(79 70 229);
  --color-brand-solid-fg: rgb(255 255 255);
  --color-brand-subtle: rgb(243 245 255);
  --color-brand-subtle-fg: rgb(64 53 196);
  --color-brand-ring: rgb(170 181 255);
}

.dark {
  --color-brand: rgb(130 141 255);
  --color-brand-hover: rgb(170 181 255);
  --color-brand-fg: rgb(17 24 39);
  --color-brand-solid: rgb(99 98 237);
  --color-brand-solid-fg: rgb(255 255 255);
  --color-brand-subtle: rgb(36 27 122);
  --color-brand-subtle-fg: rgb(202 210 255);
  --color-brand-ring: rgb(64 53 196);
}
```

To check your brand before you ship it, run the package's contrast check on your stylesheet:

```bash
node node_modules/grani-ui/scripts/contrast.mjs --brands src/style.css
```

It checks the pairs grani paints, with your brand, in both themes, and exits with 1 when text falls
under 4.5:1 or a mark under 3:1, so it can stand in CI. `--allow waivers.json` takes the pairs you
keep on purpose, such as `{ "brand|--color-brand-solid|--color-surface|dark": "why" }`; `--json`
prints the rows.
