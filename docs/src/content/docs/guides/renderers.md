---
title: Bring Your Own Renderer
---

The main entry point is intended for [lit-html](https://github.com/Polymer/lit-html) users. If you are using [lighterhtml](https://github.com/WebReflection/lighterhtml) or [hyperHTML](https://github.com/WebReflection/hyperHTML) then instead import `@pionjs/pion/core`. This export gives you a function that creates Hooks that work with any template library.

```js
import pion, { useState } from '@pionjs/pion/core';
import { html, render } from 'lighterhtml';

const { component } = pion({
  render(what, where) {
    render(where, () => what);
  }
});

function App() {
  const [count, setCount] = useState(0);
  return html`
    <h2>Using lighterhtml!</h2>
    <div>Count: ${count}</div>
    <button part="button" onclick=${() => setCount(count + 1)}>Increment</button>
  `;
}

customElements.define('my-app', component(App));
```
