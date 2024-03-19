# pion

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
