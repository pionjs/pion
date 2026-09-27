---
'@pionjs/pion': minor
---

Add `debugComponent`: a drop-in alternative to `component` that logs the element's lifecycle — connected, every render (with a per-instance count) and disconnected — to `console.debug`, prefixed by the element's tag name. Use it while debugging a suspect component: swap it in at the definition site, reproduce, filter the console on `pion:`, revert. Normally-defined components are unaffected.
