---
"@pionjs/pion": minor
---

Add `createRef` function and make `useRef` compatible with lit-html's `ref` directive

- `useRef` now returns a `Ref<T>` object with both `current` and `value` properties, making it compatible with both React-style (`ref.current`) and lit-html-style (`ref.value`) access patterns
- New `createRef` function creates a ref object without memoization, usable outside of component/hook context
- `Ref<T>` type now includes both `current: T` and `value: T` properties that stay in sync
- Backward compatible: existing `ref.current` usage continues to work unchanged