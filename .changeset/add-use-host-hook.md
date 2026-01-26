---
"@pionjs/pion": minor
---

Add `useHost` hook for accessing the host element

The `useHost` hook provides direct access to the host element of a pion component. This is useful when you need to interact with the host element's properties, attributes, or methods from within your component function.

**Note:** Direct DOM manipulation should generally be avoided in favor of reactive patterns. Use `useHost` only when direct host element access is unavoidable.
