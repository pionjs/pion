# pion

[![npm](https://img.shields.io/npm/dt/@pionjs/pion)](https://npm.im/@pionjs/pion)
[![npm](https://img.shields.io/npm/v/@pionjs/pion)](https://npm.im/@pionjs/pion)
![coverage](https://api.codelyze.com/v1/projects/badge/clb_880e4a45e784d25b8115b2111d5cf157?r=1)

React's Hooks API but for standard web components and [lit-html](https://lit-html.polymer-project.org/) or [hyperHTML](https://codepen.io/WebReflection/pen/pxXrdy?editors=0010).
Forked from [haunted](https://github.com/matthewp/haunted).

📚 [Read the Docs](https://pionjs.com) 📖

```html
<html lang="en">
  <my-counter></my-counter>

  <script type="module">
    import { html } from 'https://unpkg.com/lit?module';
    import { component, useState } from 'https://unpkg.com/@pionjs/pion';

    function Counter() {
      const [count, setCount] = useState(0);

      return html`
        <div id="count">${count}</div>
        <button type="button" @click=${() => setCount(count + 1)}>
          Increment
        </button>
      `;
    }

    customElements.define('my-counter', component(Counter));
  </script>
</html>
```

More example integrations can be found in [this gist](https://gist.github.com/matthewp/92c4daa6588eaef484c6f389d20d5700).

## Debug Logging

Set a global allowlist and matching components log their lifecycle — connected, every render (with a per-instance count), and disconnected — to `console.debug`:

```js
window.__pion_debug_tags = new Set(['my-counter']);
```

```
[pion:my-counter#000000] connected
[pion:my-counter#000000] render #1
[pion:my-counter#000000] render #2
[pion:my-counter#000000] disconnected (renders: 2)
```

Every instance gets a stable short id at construction time
(`el.__pion_debug_id`), so concurrent instances of the same tag are distinguishable; each log entry also carries the element for clickable inspection in devtools. The set is read live — tags added start logging with the next render. Works on every pion component, including library components you cannot edit. No-op when unset. Vite production builds strip the code automatically (webpack disables it at runtime; other bundlers via `--define:import.meta.env.PROD=true`). See the [Debug Logging guide](https://pionjs.com/guides/debug-logging/) for details.

## Hooks

pion supports the same API as React Hooks. The hope is that by doing so you can reuse hooks available on npm simply by aliasing package names in your bundler's config.

Currently pion supports the following hooks:

- [useCallback](https://pionjs.com/hooks/usecallback/)
- [useContext](https://pionjs.com/hooks/usecontext/)
- [useEffect](https://pionjs.com/hooks/useeffect/)
- [useHost](https://pionjs.com/hooks/usehost/)
- [useLayoutEffect](https://pionjs.com/hooks/uselayouteffect/)
- [useMemo](https://pionjs.com/hooks/usememo/)
- [useProperty](https://pionjs.com/hooks/useproperty/)
- [useReducer](https://pionjs.com/hooks/usereducer/)
- [useRef](https://pionjs.com/hooks/useref/)
- [useState](https://pionjs.com/hooks/usestate/)

### Function Signatures

```ts
// Or another renderer, see Guides
type Renderer = (element: Element) => TemplateResult;

interface Options {
  baseElement: HTMLElement;
  observedAttributes: string[];
  useShadowDOM: boolean;
  shadowRootInit: ShadowRootInit;
  styleSheets: (CSSStyleSheet | string)[];
}

declare function component(
  renderer: Renderer,
  options: Options
): Element;

declare function component<BaseElement = HTMLElement>(
  renderer: Renderer,
  baseElement: BaseElement,
  options: Options
): Element

declare function virtual(renderer: Renderer): Directive

```

## License

BSD-2-Clause
