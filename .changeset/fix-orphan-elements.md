---
"@pionjs/pion": minor
---

fix: prevent orphan elements from rendering

Elements that are constructed but never connected to the DOM (orphan elements) will no longer render or run effects. This fixes issues where lit-html creates elements during template parsing that are never inserted into the DOM.

The scheduler now starts with `_active = false` and only activates when:
- `connectedCallback` is called (for custom elements)
- `resume()` is called explicitly (for virtual components)

Fixes #64
