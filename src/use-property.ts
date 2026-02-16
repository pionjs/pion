import { hook, Hook } from "./hook";
import { State } from "./state";
import { reflectingSymbol } from "./symbols";
import type {
  InitialState,
  NewState,
  StateUpdater,
  StateTuple,
} from "./use-state";

type Host<T> = Element & { [key: string]: T } & {
  [reflectingSymbol]?: boolean;
};
type ChangeEvent<T> = {
  value: T;
  path: string;
};

export interface UsePropertyOptions {
  reflect?: boolean;
}

export interface UseProperty {
  <T>(property: string): StateTuple<T | undefined>;
  <T>(property: string, value?: InitialState<T>): StateTuple<T>;
  <T>(
    property: string,
    value: InitialState<T>,
    options: UsePropertyOptions
  ): StateTuple<T>;
}

const UPPER = /([A-Z])/gu;

export const useProperty = hook(
  class<T> extends Hook<[string, T, UsePropertyOptions?], StateTuple<T>, Host<T>> {
    property: string;
    eventName: string;
    attrName: string;
    reflect: boolean;
    lastReflected: T | undefined;

    constructor(
      id: number,
      state: State<Host<T>>,
      property: string,
      initialValue: InitialState<T>,
      options?: UsePropertyOptions
    ) {
      super(id, state);

      if (this.state.virtual) {
        throw new Error("Can't be used with virtual components.");
      }

      this.updater = this.updater.bind(this);
      this.property = property;
      this.reflect = options?.reflect ?? false;
      this.eventName =
        property.replace(UPPER, "-$1").toLowerCase() + "-changed";
      this.attrName = property.replace(UPPER, "-$1").toLowerCase();

      // If reflecting, read initial value from attribute if present
      if (this.reflect && this.state.host.hasAttribute(this.attrName)) {
        const attrVal = this.state.host.getAttribute(this.attrName);
        const coerced = (attrVal === "" ? true : attrVal) as T;
        if (this.state.host[this.property] == null) {
          this.updateProp(coerced);
          return;
        }
      }

      // set the initial value only if it was not already set by the parent
      if (this.state.host[this.property] != null) return;

      if (typeof initialValue === "function") {
        const initFn = initialValue as () => T;
        initialValue = initFn();
      }

      if (initialValue == null) return;

      this.updateProp(initialValue);
    }

    update(ignored: string, ignored2: T, ignored3?: UsePropertyOptions): StateTuple<T> {
      if (this.reflect) {
        const currentValue = this.state.host[this.property];
        if (!Object.is(currentValue, this.lastReflected)) {
          this.reflectToAttribute(currentValue);
        }
      }
      return [this.state.host[this.property], this.updater];
    }

    updater(value: NewState<T>): void {
      const previousValue = this.state.host[this.property];

      if (typeof value === "function") {
        const updaterFn = value as (previousState: T) => T;
        value = updaterFn(previousValue);
      }

      if (Object.is(previousValue, value)) {
        return;
      }

      this.updateProp(value);
    }

    updateProp(value: T): void {
      const ev = this.notify(value);
      if (ev.defaultPrevented) return;
      this.state.host[this.property] = value;

      if (this.reflect) {
        this.reflectToAttribute(value);
      }
    }

    reflectToAttribute(value: T): void {
      const host = this.state.host;
      this.lastReflected = value;
      host[reflectingSymbol] = true;
      try {
        if (value == null || value === false) {
          host.removeAttribute(this.attrName);
        } else if (value === true) {
          host.setAttribute(this.attrName, "");
        } else {
          host.setAttribute(this.attrName, String(value));
        }
      } finally {
        host[reflectingSymbol] = false;
      }
    }

    notify(value: T) {
      const ev = new CustomEvent<ChangeEvent<T>>(this.eventName, {
        detail: { value, path: this.property },
        cancelable: true,
      });
      this.state.host.dispatchEvent(ev);
      return ev;
    }
  }
) as UseProperty;

export const lift =
  <T>(setter: (value: T) => void) =>
  (ev: CustomEvent<ChangeEvent<T>>) => {
    ev.preventDefault();
    setter(ev.detail.value);
  };
