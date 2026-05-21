---
"@pionjs/pion": minor
---

Allow `lift` to bubble functional state updaters to parent components

`useProperty` now resolves the updater function against `host[property]` before dispatching the event, so `ev.detail.value` always contains the resolved value. The original updater function is also included in `ev.detail.updater` for `lift` to pass to the parent setter, which resolves it against the parent's authoritative state.

This fixes rapid-fire functional updater calls (e.g., `setItems((items) => [...items, item])`) producing incorrect state when used with `lift`, because the child's local state was blocked by `preventDefault()` and hadn't yet been updated by the parent re-render.

### Breaking changes

- `useProperty.updateProp` removed (was internal, not part of public API)
- `useProperty.init` removed (was internal, not part of public API)
- Event detail shape now includes `updater` field alongside `value`
- `ev.detail.value` is always the resolved value (was `undefined` for functional updaters)
- `lift` now passes `ev.detail.updater ?? ev.detail.value` to setter (was `ev.detail.value`)
- `useProperty` setter now always dispatches a change event, even if the value is unchanged