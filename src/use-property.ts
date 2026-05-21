import { hook, Hook } from "./hook";
import { State } from "./state";
import type {
  InitialState,
  NewState,
  StateUpdater,
  StateTuple,
} from "./use-state";

type Host<T> = Element & { [key: string]: T };
type ChangeEvent<T> = {
  value: T | undefined;
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

      this.init(initialValue);
    }

    init(value: T): void {
      const ev = this.notify(value);
      if (ev.defaultPrevented) return;
      this.commit(value);
    }

    update(ignored: string, ignored2: T): StateTuple<T> {
      return [this.state.host[this.property], this.updater];
    }

    updater(valueOrUpdater: NewState<T>): void {
      const ev = this.notify(valueOrUpdater);
      if (ev.defaultPrevented) return;
      this.commit(valueOrUpdater);
    }

    commit(valueOrUpdater: NewState<T>): void {
      const previousValue = this.state.host[this.property];
      const value =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (previousState: T) => T)(previousValue)
          : valueOrUpdater;
      if (Object.is(previousValue, value)) return;
      this.state.host[this.property] = value;
    }

    notify(valueOrUpdater: NewState<T>) {
      const updater =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (previousState: T) => T)
          : undefined;
      const ev = new CustomEvent<ChangeEvent<T>>(this.eventName, {
        detail: {
          value: updater ? undefined : (valueOrUpdater as T),
          updater,
          path: this.property,
        },
        cancelable: true,
      });
      this.state.host.dispatchEvent(ev);
      return ev;
    }
  }
) as UseProperty;

export const lift =
  <T>(setter: StateUpdater<T> | ((value: NewState<T>) => void)) =>
  (ev: CustomEvent<ChangeEvent<T>>) => {
    ev.preventDefault();
    setter(ev.detail.updater ?? (ev.detail.value as NewState<T>));
  };