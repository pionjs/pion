import { ChildPart } from "lit-html";
import { makeComponent, ComponentCreator } from "./component";
import { makeContext, ContextCreator } from "./create-context";

type Component<P> = HTMLElement & P;

type ComponentOrVirtualComponent<
  T extends HTMLElement | ChildPart,
  P extends object
> = T extends HTMLElement ? Component<P> : ChildPart;

type GenericRenderer<
  T extends HTMLElement | ChildPart,
  P extends object = {}
> = (this: ComponentOrVirtualComponent<T, P>, ...args: any[]) => unknown | void;
type RenderResult = {
  setConnected: (isConnected: boolean) => void;
};
type RenderFunction = (
  result: unknown,
  container: DocumentFragment | HTMLElement
) => RenderResult;

interface Options {
  render: RenderFunction;
}

function pion({ render }: Options): {
  component: ComponentCreator;
  createContext: ContextCreator;
} {
  const component = makeComponent(render);
  const createContext = makeContext(component);

  return { component, createContext };
}

export {
  pion as default,
  Options,
  GenericRenderer,
  RenderFunction,
  RenderResult,
  ComponentOrVirtualComponent,
};
export { useCallback } from "./use-callback";
export { useEffect } from "./use-effect";
export { useLayoutEffect } from "./use-layout-effect";
export { useState } from "./use-state";
export { useReducer } from "./use-reducer";
export { useMemo } from "./use-memo";
export { useContext } from "./use-context";
export { useProperty, lift } from "./use-property";
export { useAttribute } from "./use-attribute";
export { useRef } from "./use-ref";
export { useHost } from "./use-host";
export { hook, Hook } from "./hook";
export { BaseScheduler } from "./scheduler";
export { State } from "./state";

export type { Ref } from "./use-ref";
export type { Options as ComponentOptions } from "./component";

export type { StateUpdater } from "./use-state";

/**
 * Represents any value that can be rendered by lit-html.
 *
 * In practice, lit-html can attempt to render almost anything, since it
 * stringifies unknown values using their `toString()` method. However, this
 * doesn’t mean the output will always be meaningful — for example, interpolating
 * a plain object results in `[object Object]`.
 *
 * This type is intended to annotate content that will be passed to lit-html
 * templates or rendering functions.
 *
 * @example
 * ```ts
 * function renderButton(buttonBody: Renderable) {
 *   return html`
 *     <button>${buttonBody}</button>
 *   `;
 * }
 * ```
 */
export type Renderable = null | undefined | { toString: () => string };
