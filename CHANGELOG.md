# pion

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
