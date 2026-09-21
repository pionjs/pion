---
title: Styling
description: Style pion components with constructable stylesheets — the css helper, the styleSheets option, native CSS modules, and light DOM alternatives.
---

pion components render into a [shadow root](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) by default, so their styles are naturally isolated from the page. pion uses [constructable stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM#applying_styles_inside_the_shadow_dom): styles are declared with the `css` helper and adopted on the component's shadow root via the `styleSheets` option — constructed once, shared by every instance of the component.

## Component styles

The recommended pattern is a dedicated style file next to your component. The file exports a `css` template; the component imports it and passes it to `component()`:

```js
// my-app.style.ts
import { css } from '@pionjs/pion';

export const style = css`
  :host {
    display: block;
    padding: 1rem;
  }
  .content {
    color: var(--my-app-color, currentColor);
  }
`;
```

```js
// my-app.ts
import { component, html } from '@pionjs/pion';
import { style } from './my-app.style';

function App() {
  return html`<div class="content">Hello!</div>`;
}

customElements.define('my-app', component(App, { styleSheets: [style] }));
```

This keeps the component function focused on behavior, and makes styles reusable across components.

`styleSheets` accepts a mix of strings and `CSSStyleSheet` instances — strings are converted to stylesheets automatically.

### The `css` tagged template

`css` is a tagged template that returns a plain string. It supports interpolation, which makes it easy to compose styles or build themes from parts:

```js
import { css } from '@pionjs/pion';

const base = css`
  :host { display: block; }
`;

const theme = css`
  :host { --my-app-color: rebeccapurple; }
`;

export const style = css`
  ${base}
  ${theme}
  .content { color: var(--my-app-color); }
`;
```

:::caution
Since `css` returns a string, interpolating a value like `0` or `false` results in an empty string (falsy values are dropped). Coerce interpolated values to strings when in doubt.
:::

### Attaching styles to the renderer function

Instead of the options object, you can set `styleSheets` as a static property on the component function itself:

```js
function App() {
  return html`<div class="content">Hello!</div>`;
}

App.styleSheets = [style];

customElements.define('my-app', component(App));
```

If both are provided, the renderer's `styleSheets` take precedence over the ones passed to `component()`.

### The `sheet()` helper

If you need a `CSSStyleSheet` directly (for example to adopt it on a document or another shadow root), use the `sheet` helper:

```js
import { sheet } from '@pionjs/pion';

const styles = sheet(':host { display: block; }', '.content { color: red; }');

document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
```

## Native CSS modules

With the [CSS modules](https://developer.chrome.com/docs/css-ui/css-modules) import attribute (`with { type: 'css' }`), the browser hands you a ready-made `CSSStyleSheet`. Since `styleSheets` accepts existing instances, they work out of the box:

```js
import { component, html } from '@pionjs/pion';
import styles from './my-app.css' with { type: 'css' };

function App() {
  return html`<div class="content">Hello!</div>`;
}

customElements.define('my-app', component(App, { styleSheets: [styles] }));
```

Bundler notes:

- **Vite** and **Rollup** support `with { type: 'css' }` — the imported value is a constructed stylesheet that adopts cleanly into shadow roots.
- This syntax requires a modern browser or a bundler that transforms it; it does **not** work from a plain `<script type="module">` without a build step.

Styles inside a CSS module are still global within the sheet (they are not scoped per class name like Sass-style CSS modules) — you get a `CSSStyleSheet`, not transformed class names. Isolation comes from the shadow root, exactly like with `css` templates.

## Light DOM components

When you create a component with `useShadowDOM: false`, there is no shadow root to adopt stylesheets into — the `styleSheets` option is ignored, and `<style>` tags inside your template would leak into the page. Light DOM components should rely on document-level styles:

```js
import { component, html, sheet } from '@pionjs/pion';

const styles = sheet('.my-app { color: rebeccapurple; }');

document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];

function App() {
  return html`<div class="my-app">Hello!</div>`;
}

customElements.define('my-app', component(App, { useShadowDOM: false }));
```

Alternatively, keep your styles in a shared `css` template and add it to the page's adopted stylesheets from a single module.

## API

| API | Signature | Description |
|---|---|---|
| `css` | ``css`...` `` | Tagged template returning a string; supports interpolation. Alias of `tagged`. |
| `sheet` | `sheet(...styles: string[]): CSSStyleSheet` | Constructs a single `CSSStyleSheet` from one or more strings. |
| `styleSheets` (option) | `(CSSStyleSheet \| string)[]` | Stylesheets adopted on the component's shadow root. |
| `shadowRootInit` (option) | `ShadowRootInit` | Passed to `attachShadow()`; defaults to `{ mode: 'open' }`. Useful for e.g. `delegatesFocus: true`. |
| `useShadowDOM` (option) | `boolean` | Set to `false` to render to light DOM — note that `styleSheets` is then ignored. |