import { useMemo } from "./use-memo";

export interface Ref<T> {
  current: T | undefined;
  value?: T;
}

/**
 * Creates a new Ref object compatible with both React-style `.current`
 * and lit-html-style `.value` property access.
 *
 * @function
 * @template T
 * @param   {T} [initialValue]
 * @return  {Ref<T>}
 */
export function createRef<T>(initialValue?: T): Ref<T> {
  let _value: T | undefined = initialValue;
  return {
    get current() {
      return _value;
    },
    set current(v: T | undefined) {
      _value = v;
    },
    get value() {
      return _value;
    },
    set value(v: T | undefined) {
      _value = v;
    },
  };
}

/**
 * Returns a memoized Ref object that persists across renders.
 * The ref object is compatible with both React-style `.current`
 * and lit-html-style `.value` property access, making it usable
 * with lit-html's `ref` directive.
 *
 * @function
 * @template T
 * @param   {T} [initialValue]
 * @return  {Ref<T>} Ref object with both `current` and `value` properties
 */
export function useRef<T>(initialValue?: T): Ref<T> {
  return useMemo(() => createRef(initialValue), []);
}
