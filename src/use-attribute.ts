import { hook, Hook } from "./hook";
import { State } from "./state";
import { reflectingSymbol } from "./symbols";
import type { NewState, StateUpdater, StateTuple } from "./use-state";

type Host = Element & { [key: string]: any } & {
  [reflectingSymbol]?: boolean;
};
type ChangeEvent = {
  value: boolean;
  path: string;
};

export interface UseAttribute {
  (attribute: string): StateTuple<boolean>;
}

const toCamelCase = (val = ""): string =>
  val.replace(/-+([a-z])?/g, (_, char: string) =>
    char ? char.toUpperCase() : ""
  );

const UPPER = /([A-Z])/gu;
const toKebabCase = (val: string): string =>
  val.replace(UPPER, "-$1").toLowerCase();

/**
 * Hook for bidirectional boolean property ↔ attribute sync.
 *
 * The `attribute` parameter is the **attribute name** (kebab-case), e.g. `'opened'`
 * or `'open-on-focus'`. The hook derives the corresponding camelCase property name
 * for host element access.
 *
 * Always reflects: setting the value to `true` adds the attribute (empty string),
 * setting it to `false` removes the attribute.
 *
 * Dispatches a `{attribute}-changed` CustomEvent (cancelable) on every state change.
 *
 * @example
 * ```ts
 * const [opened, setOpened] = useAttribute('opened');
 * ```
 */
export const useAttribute = hook(
  class extends Hook<[string], StateTuple<boolean>, Host> {
    property: string;
    eventName: string;
    attrName: string;
    lastReflected: boolean | undefined;

    constructor(id: number, state: State<Host>, attribute: string) {
      super(id, state);

      if (this.state.virtual) {
        throw new Error("Can't be used with virtual components.");
      }

      this.updater = this.updater.bind(this);
      this.property = toCamelCase(attribute);
      this.attrName = toKebabCase(this.property);
      this.eventName = this.attrName + "-changed";

      // If the attribute is already present on the host, start as true
      if (this.state.host.hasAttribute(this.attrName)) {
        if (this.state.host[this.property] == null) {
          this.updateProp(true);
          return;
        }
      }

      // Respect parent-provided value via .prop= binding
      if (this.state.host[this.property] != null) return;

      // Default: false (boolean semantics)
      this.updateProp(false);
    }

    update(_attribute: string): StateTuple<boolean> {
      const currentValue = !!this.state.host[this.property];
      if (!Object.is(currentValue, this.lastReflected)) {
        this.reflectToAttribute(currentValue);
      }
      return [currentValue, this.updater];
    }

    updater(value: NewState<boolean>): void {
      const previousValue = !!this.state.host[this.property];

      if (typeof value === "function") {
        const updaterFn = value as (previousState: boolean) => boolean;
        value = updaterFn(previousValue);
      }

      value = !!value; // coerce to boolean

      if (Object.is(previousValue, value)) {
        return;
      }

      this.updateProp(value);
    }

    updateProp(value: boolean): void {
      const ev = this.notify(value);
      if (ev.defaultPrevented) return;
      this.state.host[this.property] = value;
      this.reflectToAttribute(value);
    }

    reflectToAttribute(value: boolean): void {
      const host = this.state.host;
      this.lastReflected = value;
      host[reflectingSymbol] = true;
      try {
        if (value) {
          host.setAttribute(this.attrName, "");
        } else {
          host.removeAttribute(this.attrName);
        }
      } finally {
        host[reflectingSymbol] = false;
      }
    }

    notify(value: boolean) {
      const ev = new CustomEvent<ChangeEvent>(this.eventName, {
        detail: { value, path: this.property },
        cancelable: true,
      });
      this.state.host.dispatchEvent(ev);
      return ev;
    }
  }
) as UseAttribute;
