---
layout: layout-api
package: '@pionjs/pion'
module: lib/use-host.js
---

# Hooks >> useHost

Returns the host element of the current component. This is useful when you need to access the host element's properties, attributes, or methods from within your component function.

> **Note:** Direct DOM manipulation should generally be avoided in favor of reactive patterns like state and props. Consider using [`useState`](./useState/), [`useRef`](./useRef/), or other hooks before reaching for `useHost`. This hook is intended for edge cases where direct host element access is unavoidable, such as integrating with third-party libraries or accessing host-specific APIs.

```js playground use-host use-host.js
import { component, html, useHost } from '@pionjs/pion';

function App() {
  const host = useHost();
  return html`
    <dl>
      <dt>Tag name</dt>
      <dd>${host.tagName}</dd>
      <dt>Attributes</dt>
      <dd>${host.getAttributeNames().join(', ') || 'none'}</dd>
    </dl>
  `;
}

customElements.define('use-host', component(App));
```

```html playground-file use-host index.html
<script type="module" src="use-host.js"></script>
<use-host greeting="hello"></use-host>
```

For TypeScript users, the hook accepts a generic type parameter to specify the host element type:

```ts
const host = useHost<MyCustomElement>();
```

## API
