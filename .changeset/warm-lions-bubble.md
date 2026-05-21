---
"@pionjs/pion": minor
---

Allow `lift` to bubble functional state updaters to parent components

`useProperty` now bubbles the original updater function via `ev.detail.updater` in the change event, alongside `ev.detail.value`. `lift` passes `ev.detail.updater ?? ev.detail.value` to the parent's setter, so functional updaters resolve against the parent's authoritative state instead of the child's potentially stale `host[property]`.

This fixes rapid-fire functional updater calls (e.g., `setItems((items) => [...items, item])`) producing incorrect state when used with `lift`, because the child's local state was blocked by `preventDefault()` and hadn't yet been updated by the parent re-render.

### Breaking changes

- `useProperty.updateProp` removed (was internal, not part of public API)
- Event detail shape now includes `updater` field alongside `value`
- `lift` now passes `ev.detail.updater ?? ev.detail.value` to setter (was `ev.detail.value`)