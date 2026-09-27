---
'@pionjs/pion': minor
---

Add opt-in lifecycle debug logging via a global allowlist. Set
`window.__pion_debug_tags` to a `Set` of tag names and matching
components log connected, every render (with a per-instance count) and
disconnected to `console.debug`, prefixed by tag name and a stable
per-instance short id (`[pion:my-el#000004] render #2`,
`el.__pion_debug_id`). The set is read live: tags added to it start
logging with the next render. Works on every pion component, including
library components that cannot be edited. No-op when unset.

Production builds strip the whole debug block:

- Vite: automatic, via `import.meta.env.PROD` replacement.
- webpack / esbuild CLI: `NODE_ENV=production` in the build environment
  (`process.env.NODE_ENV` is the fallback guard).
- Rollup: define the same value on the esbuild transform or
  `@rollup/plugin-replace`
  (`{ 'import.meta.env.PROD': 'true', preventAssignment: true }`).

The expression is inlined at each guard, so the define folds the
guards and dead-code-eliminates the block from the output.