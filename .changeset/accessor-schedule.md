---
'@pionjs/pion': patch
---

Setting a native reflected property (`aria-*`, `title`, `lang`, `dir`) or a `baseElement` accessor property on a pion component now schedules a re-render. Read aria values in the renderer with `getAttribute` — the attribute holds the verbatim value.
