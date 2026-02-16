/**
 * HMR (Hot Module Replacement) runtime for pion components.
 *
 * This module provides a registry that tracks component renderers and their
 * live DOM instances. When a module is hot-replaced, the new renderer function
 * can be swapped into all existing instances without re-registering the custom
 * element (which the browser forbids).
 *
 * ## How it works
 *
 * 1. `enableHMR()` is called once at startup (by the Vite plugin preamble).
 *    This patches `customElements.define` to intercept pion component
 *    registrations and track them in a registry.
 *
 * 2. When a pion component file is first loaded, `customElements.define` is
 *    called normally. The patched `define` detects pion components (via the
 *    `rendererSymbol` on the class), registers them, and sets up instance
 *    tracking on the prototype.
 *
 * 3. When Vite hot-replaces a module, the module re-executes. The new call to
 *    `customElements.define` for the same tag name is intercepted: instead of
 *    failing, it extracts the new renderer from the new class and calls
 *    `replaceRenderer()` to swap it into all live instances.
 *
 * 4. `replaceRenderer()` iterates all connected instances, swaps
 *    `_scheduler.renderer`, and calls `_scheduler.update()` to re-render.
 */

import { rendererSymbol, hmrTagSymbol } from "./symbols";

export interface ComponentEntry {
  /** The current renderer function */
  renderer: Function;
  /** The registered custom element class */
  elementClass: CustomElementConstructor;
  /** The tag name this component is registered under */
  tagName: string;
  /** All currently connected instances of this component */
  instances: Set<HTMLElement>;
}

/**
 * Global registry mapping tag names to their component metadata.
 */
const componentRegistry = new Map<string, ComponentEntry>();

/**
 * Whether HMR is currently active.
 */
let hmrActive = false;

/**
 * Enable HMR mode. Call this once at startup.
 *
 * This patches `customElements.define` to intercept pion component
 * registrations, enabling hot replacement without page reloads.
 */
export function enableHMR(): void {
  if (hmrActive) return;
  hmrActive = true;
  patchCustomElementsDefine();
}

/**
 * Check if HMR mode is active.
 */
export function isHMRActive(): boolean {
  return hmrActive;
}

/**
 * Patch `customElements.define` to support HMR for pion components.
 *
 * For pion components (detected by `rendererSymbol` on the class):
 * - First registration: registers normally + adds to registry + sets up
 *   instance tracking on the prototype via `hmrTagSymbol`.
 * - Subsequent registrations (same tag): extracts the new renderer and
 *   hot-swaps it into all live instances.
 *
 * Non-pion components pass through to the original `define` unchanged.
 */
function patchCustomElementsDefine(): void {
  const originalDefine = customElements.define.bind(customElements);

  customElements.define = function (
    name: string,
    constructor: CustomElementConstructor,
    options?: ElementDefinitionOptions,
  ) {
    const newRenderer = (constructor as any)[rendererSymbol];

    // Not a pion component — pass through
    if (!newRenderer) {
      // Guard against re-definition of non-pion components too
      if (customElements.get(name)) return;
      originalDefine(name, constructor, options);
      return;
    }

    // Set the HMR tag on the prototype so instances can self-register
    // in connectedCallback/disconnectedCallback
    constructor.prototype[hmrTagSymbol] = name;

    if (componentRegistry.has(name)) {
      // Hot replacement — swap renderer on all live instances
      replaceRenderer(name, newRenderer);
      return;
    }

    // First-time registration
    const entry: ComponentEntry = {
      renderer: newRenderer,
      elementClass: constructor,
      tagName: name,
      instances: new Set(),
    };
    componentRegistry.set(name, entry);
    originalDefine(name, constructor, options);
  } as typeof customElements.define;
}

/**
 * Track a component instance being connected to the DOM.
 */
export function trackInstance(tagName: string, instance: HTMLElement): void {
  const entry = componentRegistry.get(tagName);
  if (entry) {
    entry.instances.add(instance);
  }
}

/**
 * Untrack a component instance being disconnected from the DOM.
 */
export function untrackInstance(tagName: string, instance: HTMLElement): void {
  const entry = componentRegistry.get(tagName);
  if (entry) {
    entry.instances.delete(instance);
  }
}

/**
 * Replace the renderer function for a component and re-render all live instances.
 *
 * This is the core HMR operation. It:
 * 1. Finds the registry entry by tag name
 * 2. Updates the renderer reference in the registry
 * 3. Walks all connected instances and swaps `_scheduler.renderer`
 * 4. Triggers `_scheduler.update()` on each instance to re-render
 *
 * @param tagName - The custom element tag name
 * @param newRenderer - The new renderer function from the updated module
 * @returns The number of instances that were updated
 */
export function replaceRenderer(tagName: string, newRenderer: Function): number {
  const entry = componentRegistry.get(tagName);
  if (!entry) {
    console.warn(`[pion:hmr] No component registered with tag "${tagName}"`);
    return 0;
  }

  // Update the registry
  entry.renderer = newRenderer;

  // Swap renderer on all live instances and trigger re-render
  let count = 0;
  for (const instance of entry.instances) {
    const scheduler = (instance as any)._scheduler;
    if (scheduler) {
      scheduler.renderer = newRenderer;
      scheduler.update();
      count++;
    }
  }

  if (count > 0) {
    console.log(
      `[pion:hmr] Hot replaced <${tagName}> (${count} instance${count !== 1 ? 's' : ''})`,
    );
  } else {
    console.log(
      `[pion:hmr] Updated <${tagName}> renderer (no live instances)`,
    );
  }

  return count;
}

/**
 * Get a registry entry by tag name.
 */
export function getComponentEntry(tagName: string): ComponentEntry | undefined {
  return componentRegistry.get(tagName);
}

/**
 * Check if a tag name is registered in the HMR registry.
 */
export function isRegistered(tagName: string): boolean {
  return componentRegistry.has(tagName);
}

/**
 * Get all registered tag names. Useful for debugging.
 */
export function getRegisteredTags(): string[] {
  return Array.from(componentRegistry.keys());
}

/**
 * Clear the entire registry. Mainly useful for testing.
 */
export function clearRegistry(): void {
  componentRegistry.clear();
}
