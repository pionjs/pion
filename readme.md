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

## Hooks

pion supports the same API as React Hooks. The hope is that by doing so you can reuse hooks available on npm simply by aliasing package names in your bundler's config.

Currently pion supports the following hooks:

- [useCallback](https://pionjs.com/docs/hooks/useCallback/)
- [useContext](https://pionjs.com/docs/hooks/useContext/)
- [useEffect](https://pionjs.com/docs/hooks/useEffect/)
- [useLayoutEffect](https://pionjs.com/docs/hooks/useLayoutEffect/)
- [useMemo](https://pionjs.com/docs/hooks/useMemo/)
- [useReducer](https://pionjs.com/docs/hooks/useReducer/)
- [useRef](https://pionjs.com/docs/hooks/useRef/)
- [useState](https://pionjs.com/docs/hooks/useState/)

### Function Signatures

```ts
// Or another renderer, see Guides
type Renderer = (element: Element) => TemplateResult;

interface Options {
  baseElement: HTMLElement;
  observedAttributes: string[];
  useShadowDOM: boolean
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
