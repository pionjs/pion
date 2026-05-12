---
"@pionjs/pion": minor
---

Make `Ref<T>` align better with lit-html compatibility

Changed `Ref<T>` from `{ current: T; value: T; }` to `{ current: T | undefined; value?: T; }`.

This makes `Ref<T>` structurally compatible with lit-html's `Ref<T>` type, allowing pion refs to be used directly with lit-html's `ref` directive without type errors:

```ts
// Before: Type error
const popover = useRef<HTMLElement>();
html`<div ${ref(popover)}>`;  // Error: Ref<HTMLElement | undefined> ≠ Ref<HTMLElement>

// After: Works correctly
const popover = useRef<HTMLElement>();
html`<div ${ref(popover)}>`;  // OK
```

For users, behavior is identical: `ref.current` and `ref.value` still return `T | undefined` when no initial value is provided. Type narrowing works the same way: `if (ref.current) { ref.current.showPopover(); }`.

BREAKING CHANGE: If you explicitly typed refs as `Ref<T | undefined>`, update to `Ref<T>`:
```ts
// Before
const ref: Ref<HTMLElement | undefined> = useRef();

// After
const ref: Ref<HTMLElement> = useRef();
```
