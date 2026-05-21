import { hook, Hook } from "./hook";
import { State } from "./state";
import type {
  InitialState,
  NewState,
  StateTuple,
} from "./use-state";

type Host<T> = Element & { [key: string]: T };
type ChangeEvent<T> = {
  value: T;
  updater: ((previousState: T) => T) | undefined;
  path: string;
};

export interface UseProperty {
  <T>(property: string): StateTuple<T | undefined>;
  <T>(property: string, value?: InitialState<T>): StateTuple<T>;
}

const UPPER = /([A-Z])/gu;

export const useProperty = hook(
  class<T> extends Hook<[string, T], StateTuple<T>, Host<T>> {
    property: string;
    eventName: string;

    constructor(
      id: number,
      state: State<Host<T>>,
      property: string,
      initialValue: InitialState<T>
    ) {
      super(id, state);

      if (this.state.virtual) {
        throw new Error("Can't be used with virtual components.");
      }

      this.updater = this.updater.bind(this);
      this.property = property;
      this.eventName =
        property.replace(UPPER, "-$1").toLowerCase() + "-changed";

      // set the initial value only if it was not already set by the parent
      if (this.state.host[this.property] != null) return;

      if (typeof initialValue === "function") {
        const initFn = initialValue as () => T;
        initialValue = initFn();
      }

      if (initialValue == null) return;

      this.updater(initialValue);
    }

    update(ignored: string, ignored2: T): StateTuple<T> {
      return [this.state.host[this.property], this.updater];
    }

    resolve(
      valueOrUpdater: NewState<T>
    ): [previousValue: T, value: T, updater: ((previousState: T) => T) | undefined] {
      const previousValue = this.state.host[this.property];
      const updater =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (previousState: T) => T)
          : undefined;
      const value = updater
        ? updater(previousValue)
        : (valueOrUpdater as T);
      return [previousValue, value, updater];
    }

    notify(value: T, updater?: (previousState: T) => T) {
      const ev = new CustomEvent<ChangeEvent<T>>(this.eventName, {
        detail: { value, updater, path: this.property },
        cancelable: true,
      });
      this.state.host.dispatchEvent(ev);
      return ev;
    }

    updater(valueOrUpdater: NewState<T>): void {
      const [previousValue, value, updater] = this.resolve(valueOrUpdater);
      const ev = this.notify(value, updater);
      if (ev.defaultPrevented) return;
      if (Object.is(previousValue, value)) return;
      this.state.host[this.property] = value;
    }
  }
) as UseProperty;

export const lift =
  <T>(setter: (value: T | ((previousState: T) => T)) => void) =>
  (ev: CustomEvent<ChangeEvent<T>>) => {
    ev.preventDefault();
    setter(ev.detail.updater ?? ev.detail.value);
  };