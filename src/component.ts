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
        this._scheduler.resume();
        this._scheduler.update();
        this._scheduler.renderResult?.setConnected(true);
      }

      disconnectedCallback(): void {
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
