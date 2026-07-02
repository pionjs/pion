---
"@pionjs/pion": patch
---

Fix: useProperty initialization sets default value even when preventDefault is called

When a parent component uses `lift()` to listen to a property change event without
passing the property value to the child, `useProperty`'s initialization event was
`preventDefault`'d by `lift`, leaving the host property `undefined`. This caused crashes
in components like `cosmoz-omnitable` where `selectedItems` was never initialized.

The `updater` method now accepts an `isInit` flag that bypasses the `preventDefault` veto
during initialization, ensuring the host always receives its default value. Subsequent
updates retain the full `lift`/`preventDefault` two-way binding semantics.