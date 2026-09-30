---
"@pionjs/pion": patch
---

Fix: call super in connected/disconnectedCallback

`component()`'s generated custom element overrode `connectedCallback`/`disconnectedCallback` without calling the base class implementations, so user-supplied `baseElement` classes relying on their own connect/disconnect logic (e.g. LitElement-based bases setting attributes in `connectedCallback`) were silently skipped. The scheduler behavior is unchanged.