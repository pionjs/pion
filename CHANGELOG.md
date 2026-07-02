# pion

## 2.16.1

### Patch Changes

- 7560f99: Fix: useProperty initialization sets default value even when preventDefault is called

  When a parent component uses `lift()` to listen to a property change event without
  passing the property value to the child, `useProperty`'s initialization event was
  `preventDefault`'d by `lift`, leaving the host property `undefined`. This caused crashes
  in components like `cosmoz-omnitable` where `selectedItems` was never initialized.

  The `updater` method now accepts an `isInit` flag that bypasses the `preventDefault` veto
  during initialization, ensuring the host always receives its default value. Subsequent
  updates retain the full `lift`/`preventDefault` two-way binding semantics.

## 2.16.0

### Minor Changes

- 6018594: Allow `lift` to bubble functional state updaters to parent components

  `useProperty` now resolves the updater function against `host[property]` before dispatching the event, so `ev.detail.value` always contains the resolved value. The original updater function is also included in `ev.detail.updater` for `lift` to pass to the parent setter, which resolves it against the parent's authoritative state.

  This fixes rapid-fire functional updater calls (e.g., `setItems((items) => [...items, item])`) producing incorrect state when used with `lift`, because the child's local state was blocked by `preventDefault()` and hadn't yet been updated by the parent re-render.

  ### Breaking changes

  - `useProperty.updateProp` removed (was internal, not part of public API)
  - `useProperty.init` removed (was internal, not part of public API)
  - Event detail shape now includes `updater` field alongside `value`
  - `ev.detail.value` is always the resolved value (was `undefined` for functional updaters)
  - `lift` now passes `ev.detail.updater ?? ev.detail.value` to setter (was `ev.detail.value`)
  - `useProperty` setter now always dispatches a change event, even if the value is unchanged

## 2.15.0

### Minor Changes

- f0dab4f: Detect and stop infinite update loops.

## 2.14.0

### Minor Changes

- ad72947: Make `Ref<T>` align better with lit-html compatibility

  Changed `Ref<T>` from `{ current: T; value: T; }` to `{ current: T | undefined; value?: T; }`.

  This makes `Ref<T>` structurally compatible with lit-html's `Ref<T>` type, allowing pion refs to be used directly with lit-html's `ref` directive without type errors:

  ```ts
  // Before: Type error
  const popover = useRef<HTMLElement>();
  html`<div ${ref(popover)}></div>`; // Error: Ref<HTMLElement | undefined> ≠ Ref<HTMLElement>

  // After: Works correctly
  const popover = useRef<HTMLElement>();
  html`<div ${ref(popover)}></div>`; // OK
  ```

  For users, behavior is identical: `ref.current` and `ref.value` still return `T | undefined` when no initial value is provided. Type narrowing works the same way: `if (ref.current) { ref.current.showPopover(); }`.

  BREAKING CHANGE: If you explicitly typed refs as `Ref<T | undefined>`, update to `Ref<T>`:

  ```ts
  // Before
  const ref: Ref<HTMLElement | undefined> = useRef();

  // After
  const ref: Ref<HTMLElement> = useRef();
  ```

## 2.13.0

### Minor Changes

- c6bfd24: Add `createRef` function and make `useRef` compatible with lit-html's `ref` directive

  - `useRef` now returns a `Ref<T>` object with both `current` and `value` properties, making it compatible with both React-style (`ref.current`) and lit-html-style (`ref.value`) access patterns
  - New `createRef` function creates a ref object without memoization, usable outside of component/hook context
  - `Ref<T>` type now includes both `current: T` and `value: T` properties that stay in sync
  - Backward compatible: existing `ref.current` usage continues to work unchanged

## 2.12.0

### Minor Changes

- 9b813bf: fix: prevent orphan elements from rendering

  Elements that are constructed but never connected to the DOM (orphan elements) will no longer render or run effects. This fixes issues where lit-html creates elements during template parsing that are never inserted into the DOM.

  The scheduler now starts with `_active = false` and only activates when:

  - `connectedCallback` is called (for custom elements)
  - `resume()` is called explicitly (for virtual components)

  Fixes #64

## 2.11.0

### Minor Changes

- da4c723: Add `useHost` hook for accessing the host element

  The `useHost` hook provides direct access to the host element of a pion component. This is useful when you need to interact with the host element's properties, attributes, or methods from within your component function.

  **Note:** Direct DOM manipulation should generally be avoided in favor of reactive patterns. Use `useHost` only when direct host element access is unavoidable.

### Patch Changes

- f176b34: docs: add useProperty hook documentation

## 2.10.0

### Minor Changes

- dea34f9: Readonly deps arrays

## 2.9.0

### Minor Changes

- 2086e16: Define a Renderable type, so developers can annotate content that will be passed to lit-html templates or rendering functions

## 2.8.3

### Patch Changes

- 1f3e6c2: Pause rendering while disconnected

## 2.8.2

### Patch Changes

- a948e76: Run effects on element reattach

## 2.8.1

### Patch Changes

- 9dfa50a: `lift` does not need `setter` to be a `StateUpdater`

## 2.8.0

### Minor Changes

- 3bcf1ba: Improve `styleSheets` support.

## 2.7.1

### Patch Changes

- c5409e8: Make context providers transparent to the layout

## 2.7.0

### Minor Changes

- f788452: Add stylesheet related util

  Exports `css`, `tagged`, `sheet`, `sheets` helpers to ease the usage of css.
  Additionally the `styleSheets` param accepts string and converts it `CSSStyleSheet` via a call to sheets.

- 1a3a87e: Improve the type definition of useState and useProperty adding better support for initial values
  and return better defined state updaters.

## 2.6.0

### Minor Changes

- bba4d67: Add useProperty hook

## 2.5.2

### Patch Changes

- fe795f5: `observedAttributes` can be readonly

## 2.5.1

### Patch Changes

- 767a24e: Fixed a bug in which [lit directives are never cleaned up properly](https://github.com/pionjs/pion/issues/17).

## 2.5.0

### Minor Changes

- d03fc57: Export type `Options` from component as `ComponentOptions`.

## 2.4.0

### Minor Changes

- 256e638: export Ref type

## 2.3.0

### Minor Changes

- 4133b6b: Allow omitting initialValue from useRef.

## 2.2.0

### Minor Changes

- fba5448: Replace lit imports with lit-html imports

## 2.1.0

### Minor Changes

- 9e28314: `observedAttributes` should allow kebab-case properties.
  For example if there is a property called `myProp` allow setting `observedAttributes` to `['my-prop']`;

## 2.0.0

### Major Changes

- ac196c3: Remove useController and lit dependency.

## 1.6.0

### Minor Changes

- c7fa104: Add adoptedStyleSheets support

## 1.5.0

### Minor Changes

- bfa5997: Update lit-html typings to 2.x

## 1.4.0

### Minor Changes

- 373b46e: Upgrade to lit 3

## 1.3.0

### Minor Changes

- be7f9ee: Infer `virtual` type definition from renderer arguments.

## 1.2.0

### Minor Changes

- 3ed194b: Avoid infinite loops caused when an effect schedules an update and then throws.
- cbf2aff: Update docs and related packages.

## 1.1.0

### Minor Changes

- 9ad6954: Allow using context in virtual components.
  Use the ChildPart's start, end or parentNode as event channel.

### Patch Changes

- 7e13cf7: Do not use Shadow DOM for contexts Provider & Consumer elements.

## 1.0.0

### Major Changes

- c608ea8: Initialize
