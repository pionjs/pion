import { GenericRenderer, RenderFunction, RenderResult } from "./core";
import { BaseScheduler } from "./scheduler";
import { sheets } from "./util";

const toCamelCase = (val = ""): string =>
  val.replace(/-+([a-z])?/g, (_, char) => (char ? char.toUpperCase() : ""));

type KebabCase<S> = S extends `${infer C}${infer T}`
  ? KebabCase<T> extends infer U
    ? U extends string
      ? T extends Uncapitalize<T>
        ? `${Uncapitalize<C>}${U}`
        : `${Uncapitalize<C>}-${U}`
      : never
    : never
  : S;
type Atts<P> = readonly KebabCase<keyof P>[];

interface Renderer<P extends object> extends GenericRenderer<HTMLElement, P> {
  (this: Component<P>, host: Component<P>): unknown | void;
  observedAttributes?: Atts<P>;
  styleSheets?: (CSSStyleSheet | string)[];
}

type Component<P extends object> = HTMLElement & P;

type Constructor<P extends object> = new (...args: unknown[]) => Component<P>;

interface Creator {
  <P extends object>(renderer: Renderer<P>): Constructor<P>;
  <P extends object>(
    renderer: Renderer<P>,
    options: Options<P>
  ): Constructor<P>;
  <P extends object>(
    renderer: Renderer<P>,
    baseElement: Constructor<{}>,
    options: Omit<Options<P>, "baseElement">
  ): Constructor<P>;
}

export interface Options<P> {
  baseElement?: Constructor<{}>;
  observedAttributes?: Atts<P>;
  useShadowDOM?: boolean;
  shadowRootInit?: ShadowRootInit;
  styleSheets?: (CSSStyleSheet | string)[];
}

/**
 * Lifecycle debug allowlist. Set `window.__pion_debug_tags` to a `Set` of
 * tag names and matching components log their lifecycle — connected, every
 * render (with a per-instance count) and disconnected — to `console.debug`:
 *
 *   window.__pion_debug_tags = new Set(['my-element'])
 *   // [pion:my-element#000004] render #2
 *
 * No component code changes required, and no-op when the global is unset.
 */
type DebugTags = Set<string>;

// The debug block is stripped from production bundles: bundlers replace
// `import.meta.env.PROD` (Vite) or `process.env.NODE_ENV` (webpack, esbuild)
// statically, folding each guard to `false` and dead-code-eliminating the
// block. The expression is inlined at every guard rather than shared as a
// module const — esbuild folds the const's declaration but does not
// propagate it into method bodies of a class extending a base class from
// another module (verified against esbuild 0.28).
const isDebugTag = (tag: string): boolean => {
  // The prod-guard halves are folded away by bundlers and can never evaluate
  // true in a test browser, so they are uncovered by design.
  /* c8 ignore next 3 */
  if (import.meta.env?.PROD === true ||
      globalThis.process?.env?.NODE_ENV === "production") {
    return false;
  }
  const tags = (globalThis as { __pion_debug_tags?: DebugTags })
    .__pion_debug_tags;
  return tags != null && tags.has(tag);
};

// Git-style short id: fixed width while small, growing past 6 digits only
// after 16M instances (like git extending a short sha). Assigned at
// construction, so ids are stable for the session and reproducible across
// refreshes of the same app structure.
let instanceSeq = 0;
const shortId = (): string =>
  (instanceSeq++).toString(16).padStart(6, "0");

const logLifecycle = (
  host: HTMLElement,
  event: string,
  detail?: string
): void => {
  const id = (host as { __pion_debug_id?: string }).__pion_debug_id ?? "";
  // The host rides along as a second argument so the entry is clickable in
  // devtools; from a live element, filter by its id:
  // `querySelector('my-el').__pion_debug_id` → `\[pion:my-el#000004`.
  console.debug(
    `[pion:${host.localName}#${id}] ${event}${detail ? ` (${detail})` : ""}`,
    host
  );
};

function makeComponent(render: RenderFunction): Creator {
  class Scheduler<P extends object> extends BaseScheduler<
    P,
    HTMLElement,
    Renderer<P>,
    Component<P>
  > {
    frag: DocumentFragment | HTMLElement;
    renderResult?: RenderResult;

    constructor(
      renderer: Renderer<P>,
      frag: DocumentFragment,
      host: HTMLElement
    );
    constructor(renderer: Renderer<P>, host: HTMLElement);
    constructor(
      renderer: Renderer<P>,
      frag: DocumentFragment | HTMLElement,
      host?: HTMLElement
    ) {
      super(renderer, (host || frag) as Component<P>);
      this.frag = frag;
    }

    commit(result: unknown): void {
      const host = this.host as HTMLElement | undefined;
      /* c8 ignore next 5 -- prod guard halves can't be true in tests */
      if (!(import.meta.env?.PROD === true ||
            globalThis.process?.env?.NODE_ENV === "production") &&
          host?.localName && isDebugTag(host.localName)) {
        const h = host as { __pion_renders?: number };
        const renders = (h.__pion_renders ?? 0) + 1;
        h.__pion_renders = renders;
        logLifecycle(host, `render #${renders}`);
      }
      this.renderResult = render(result, this.frag);
    }
  }

  function component<P extends object>(renderer: Renderer<P>): Constructor<P>;
  function component<P extends object>(
    renderer: Renderer<P>,
    options: Options<P>
  ): Constructor<P>;
  function component<P extends object>(
    renderer: Renderer<P>,
    baseElement: Constructor<P>,
    options: Omit<Options<P>, "baseElement">
  ): Constructor<P>;
  function component<P extends object>(
    renderer: Renderer<P>,
    baseElementOrOptions?: Constructor<P> | Options<P>,
    options?: Options<P>
  ): Constructor<P> {
    const BaseElement =
      (options || (baseElementOrOptions as Options<P>) || {}).baseElement ||
      HTMLElement;
    const {
      observedAttributes = [],
      useShadowDOM = true,
      shadowRootInit = {},
      styleSheets: _styleSheets,
    } = options || (baseElementOrOptions as Options<P>) || {};
    const styleSheets = sheets(renderer.styleSheets || _styleSheets);
    class Element extends BaseElement {
      _scheduler: Scheduler<P>;

      static get observedAttributes(): Atts<P> {
        return renderer.observedAttributes || observedAttributes || [];
      }

      constructor() {
        super();
        // Stable per-instance debug id, assigned unconditionally so it exists
        // even before the allowlist is set (prod builds strip this via the
        // inlined guard — see the comment above `isDebugTag`).
        /* c8 ignore next 4 -- prod guard halves can't be true in tests */
        if (!(import.meta.env?.PROD === true ||
              globalThis.process?.env?.NODE_ENV === "production")) {
          (this as { __pion_debug_id?: string }).__pion_debug_id = shortId();
        }
        if (useShadowDOM === false) {
          this._scheduler = new Scheduler(renderer, this);
        } else {
          const shadowRoot = this.attachShadow({
            mode: "open",
            ...shadowRootInit,
          });
          if (styleSheets) shadowRoot.adoptedStyleSheets = styleSheets;
          this._scheduler = new Scheduler(renderer, shadowRoot, this);
        }
      }

      connectedCallback(): void {
        /* c8 ignore next 5 -- prod guard halves can't be true in tests */
        if (!(import.meta.env?.PROD === true ||
              globalThis.process?.env?.NODE_ENV === "production") &&
            isDebugTag(this.localName)) {
          logLifecycle(this, "connected");
        }
        this._scheduler.resume();
        this._scheduler.update();
        this._scheduler.renderResult?.setConnected(true);
      }

      disconnectedCallback(): void {
        /* c8 ignore next 5 -- prod guard halves can't be true in tests */
        if (!(import.meta.env?.PROD === true ||
              globalThis.process?.env?.NODE_ENV === "production") &&
            isDebugTag(this.localName)) {
          const renders = (this as { __pion_renders?: number }).__pion_renders ?? 0;
          logLifecycle(this, "disconnected", `renders: ${renders}`);
        }
        this._scheduler.pause();
        this._scheduler.teardown();
        this._scheduler.renderResult?.setConnected(false);
      }

      attributeChangedCallback(
        name: string,
        oldValue: unknown,
        newValue: unknown
      ): void {
        if (oldValue === newValue) {
          return;
        }
        let val = newValue === "" ? true : newValue;
        Reflect.set(this, toCamelCase(name), val);
      }
    }

    function reflectiveProp<T>(initialValue: T): Readonly<PropertyDescriptor> {
      let value = initialValue;
      let isSetup = false;
      return Object.freeze({
        enumerable: true,
        configurable: true,
        get(): T {
          return value;
        },
        set(this: Element, newValue: T): void {
          // Avoid scheduling update when prop value hasn't changed
          if (isSetup && value === newValue) return;
          isSetup = true;
          value = newValue;
          if (this._scheduler) {
            this._scheduler.update();
          }
        },
      });
    }

    const proto = new Proxy(BaseElement.prototype, {
      getPrototypeOf(target) {
        return target;
      },

      set(target, key: string, value, receiver): boolean {
        let desc: PropertyDescriptor | undefined;
        if (key in target) {
          desc = Object.getOwnPropertyDescriptor(target, key);
          if (desc && desc.set) {
            desc.set.call(receiver, value);
            return true;
          }

          Reflect.set(target, key, value, receiver);
          return true;
        }

        if (typeof key === "symbol" || key[0] === "_") {
          desc = {
            enumerable: true,
            configurable: true,
            writable: true,
            value,
          };
        } else {
          desc = reflectiveProp(value);
        }
        Object.defineProperty(receiver, key, desc);

        if (desc.set) {
          desc.set.call(receiver, value);
        }

        return true;
      },
    });

    Object.setPrototypeOf(Element.prototype, proto);

    return Element as unknown as Constructor<P>;
  }

  return component;
}

export {
  makeComponent,
  Component,
  Constructor as ComponentConstructor,
  Creator as ComponentCreator,
};
