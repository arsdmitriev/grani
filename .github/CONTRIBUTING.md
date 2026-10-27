# Contributing

This repository holds the released versions of grani, one commit each; the work happens in a
separate repository. A bug report is welcome in the issues, with what you ran, what you expected and
what happened instead; there is no promise of an answer or a date, and pull requests are not merged.

`index.ts`, `resolver.js` and `scripts/reference/api.json` are generated in the source repository
with each release; `llms.txt` and `llms/` are written by `scripts/package-texts.mjs` on every pack,
here as there. An edit by hand is lost with the next one.

To run the checks locally, with Node 22.18 or later: `npm ci`, then `npm run gates`, the
same command CI runs.

Security reports: `.github/SECURITY.md`.
