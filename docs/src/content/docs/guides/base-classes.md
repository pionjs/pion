---
title: Base classes
description: Pass your own base element to component() — share element-level logic like ARIA defaults across components, hook into connectedCallback/disconnectedCallback, and pass the renderer function directly.
---

By default, `component()` generates a custom element that extends `HTMLElement`. When several components need to share element-level behavior — ARIA defaults, pre-defined attributes, methods, or reuse of an existing base from a design system or a library — pass your own base class via the `baseElement` option, or as the second argument to `component()`.

## Bring your own base class

The base class is where identity that belongs to the element itself lives — as opposed to rendering concerns, which live in the component function. A minimal example:

```js
// dialog-base.ts
export class DialogBase extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'dialog');
    }
    if (!this.hasAttribute('aria-modal')) {
      this.setAttribute('aria-modal', 'false');
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1');
    }
  }
}
```

```js
// my-dialog.ts
import { component, html } from '@pionjs/pion';
import { DialogBase } from './dialog-base';

function MyDialog() {
  return html`<slot></slot>`;
}

customElements.define(
  'my-dialog',
  component(MyDialog, { baseElement: DialogBase })
);
```

The generated element becomes `class Element extends DialogBase`, so every instance carries the base's attributes, methods, and lifecycle. Several components can share one base, which is a common pattern in design systems where a base class centralizes accessibility defaults.

You can also pass the base class positionally instead of using the option:

```js
customElements.define(
  'my-dialog',
  component(MyDialog, DialogBase, { /* other options */ })
);
```

In that form, the options object must not repeat `baseElement`.

## Lifecycle contract

pion honors your base's lifecycle methods. The generated element's `connectedCallback` and `disconnectedCallback` call the base implementations first (via `super.connectedCallback?.()` and `super.disconnectedCallback?.()`) and only then run pion's own connect/disconnect work. This means the base class `connectedCallback` above runs before the first render, so attributes it sets are in place when your renderer executes.

:::caution
Before pion 2.16.2, the generated element's overrides did **not** call `super`, so base class implementations of `connectedCallback`/`disconnectedCallback` were silently skipped. If your app relies on base lifecycle logic, make sure to upgrade.
:::

## Passing the renderer directly

Renderers are invoked as methods of the host element — `component()` calls the renderer with the host as both `this` and the first argument. A named function works directly, with no wrapper needed:

```js
// slideout.ts
import { html } from '@pionjs/pion';

export function Slideout(host) {
  return html`<slot></slot>`;
}
```

```js
import { component } from '@pionjs/pion';
import { SlideoutBase } from './slideout-base';
import { Slideout } from './slideout';

customElements.define(
  'cosmoz-slideout',
  component(Slideout, SlideoutBase)
);
```

Hooks — `useState`, `useHost`, `useEffect` and the rest — must be called inside the renderer, since it runs inside pion's render loop. Helper functions called from the renderer can use hooks too, as long as they are invoked during rendering:

```js
import { html, useHost } from '@pionjs/pion';

export function Slideout() {
  const host = useHost();

  return html`<slot></slot>`;
}
```

`useHost()` returns the same element whether the hook site is the renderer itself or a helper function it calls, which makes it an alternative to receiving `host` as a parameter.

## Typing

The `baseElement` option is typed as `Constructor<HTMLElement & BaseLifecycle>`, where `BaseLifecycle` declares the optional `connectedCallback`/`disconnectedCallback` hooks. Since the lifecycle members are optional, any `HTMLElement` subclass is assignable — whether or not it defines the callbacks:

```ts
import { component, html, useHost } from '@pionjs/pion';

class SlideoutBase extends HTMLElement {
  connectedCallback(): void {
    if (!this.hasAttribute('popover')) {
      this.setAttribute('popover', 'manual');
    }
  }
}

function Slideout(): ReturnType<typeof html> {
  const host = useHost<SlideoutBase>();
  return html`<slot></slot>`;
}

customElements.define(
  'cosmoz-slideout',
  component(Slideout, { baseElement: SlideoutBase })
);
```

Extend plain `HTMLElement` as above, or a library base such as `LitElement` — both fit within the `baseElement` type without casts.

## When not to use it

Most component logic composes better with hooks — state, effects, properties, and events (see [Properties](/guides/properties/) and [Dispatching Events](/guides/events/)) cover the usual cases without extra structure. Reach for a base class when you need element-level identity: ARIA defaults or pre-defined attributes applied at connect time, imperative methods attached to the element, or when integrating with a base from a library that already exists.