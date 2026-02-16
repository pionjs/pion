import { hook, Hook } from "./hook";
import { State } from "./state";
import { reflectingSymbol, attributeObserverSymbol } from "./symbols";
import type { NewState, StateUpdater, StateTuple } from "./use-state";

// --- Types ---

type AttributeHost = Element & {
  [key: string]: unknown;
  [reflectingSymbol]?: boolean;
  [attributeObserverSymbol]?: ObserverRegistry;
};

type ChangeEvent<T> = {
  value: T;
  path: string;
};

type AttributeTypeMap = {
  Boolean: BooleanConstructor;
  String: StringConstructor;
  Number: NumberConstructor;
};

type AttributeType = AttributeTypeMap[keyof AttributeTypeMap];

type TypeToValue<C extends AttributeType> = C extends BooleanConstructor
  ? boolean
  : C extends StringConstructor
    ? string
    : C extends NumberConstructor
      ? number
      : never;

export interface UseAttribute {
  <C extends AttributeType>(
    name: string,
    type: C,
    defaultValue?: TypeToValue<C>,
  ): StateTuple<TypeToValue<C>>;
}

// --- Shared MutationObserver registry per host element ---

interface ObserverRegistry {
  observer: MutationObserver;
  hooks: Map<string, Set<UseAttributeHook<AttributeType>>>;
}

function getRegistry(host: AttributeHost): ObserverRegistry {
  let registry = host[attributeObserverSymbol];
  if (!registry) {
    const hooks: ObserverRegistry["hooks"] = new Map();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "attributes") continue;
        const attrName = mutation.attributeName!;
        const hookSet = hooks.get(attrName);
        if (!hookSet) continue;
        for (const h of hookSet) {
          h.onAttributeChanged();
        }
      }
    });
    registry = { observer, hooks };
    host[attributeObserverSymbol] = registry;
  }
  return registry;
}

function registerHook(
  host: AttributeHost,
  attrName: string,
  hookInstance: UseAttributeHook<AttributeType>,
): void {
  const registry = getRegistry(host);
  let hookSet = registry.hooks.get(attrName);
  const needsRestart = !hookSet;

  if (!hookSet) {
    hookSet = new Set();
    registry.hooks.set(attrName, hookSet);
  }
  hookSet.add(hookInstance);

  if (needsRestart) {
    // Restart observer with updated attribute filter
    registry.observer.disconnect();
    const attributeFilter = [...registry.hooks.keys()];
    registry.observer.observe(host, { attributes: true, attributeFilter });
  }
}

function unregisterHook(
  host: AttributeHost,
  attrName: string,
  hookInstance: UseAttributeHook<AttributeType>,
): void {
  const registry = host[attributeObserverSymbol];
  if (!registry) return;

  const hookSet = registry.hooks.get(attrName);
  if (!hookSet) return;

  hookSet.delete(hookInstance);
  if (hookSet.size === 0) {
    registry.hooks.delete(attrName);
  }

  if (registry.hooks.size === 0) {
    registry.observer.disconnect();
    delete host[attributeObserverSymbol];
  } else if (hookSet.size === 0) {
    // Restart observer with updated attribute filter
    registry.observer.disconnect();
    const attributeFilter = [...registry.hooks.keys()];
    registry.observer.observe(host, { attributes: true, attributeFilter });
  }
}

// --- Coercion helpers ---

const UPPER = /([A-Z])/gu;

function typeDefault<C extends AttributeType>(type: C): TypeToValue<C> {
  if (type === Boolean) return false as TypeToValue<C>;
  if (type === Number) return 0 as TypeToValue<C>;
  return "" as TypeToValue<C>;
}

function fromAttribute<C extends AttributeType>(
  type: C,
  value: string | null,
  defaultValue: TypeToValue<C>,
): TypeToValue<C> {
  if (type === Boolean) {
    return (value !== null) as TypeToValue<C>;
  }
  if (value === null) {
    return defaultValue;
  }
  if (type === Number) {
    const n = parseFloat(value);
    return (Number.isNaN(n) ? defaultValue : n) as TypeToValue<C>;
  }
  return value as TypeToValue<C>;
}

function toAttribute<C extends AttributeType>(
  type: C,
  value: TypeToValue<C>,
): string | null {
  if (type === Boolean) {
    return value ? "" : null;
  }
  if (value == null) {
    return null;
  }
  return String(value);
}

// --- Hook implementation ---

class UseAttributeHook<C extends AttributeType> extends Hook<
  [string, C, TypeToValue<C>?],
  StateTuple<TypeToValue<C>>,
  AttributeHost
> {
  property: string;
  attrName: string;
  eventName: string;
  type: C;
  defaultValue: TypeToValue<C>;
  lastReflected: TypeToValue<C> | undefined;

  constructor(
    id: number,
    state: State<AttributeHost>,
    attrName: string,
    type: C,
    defaultValue?: TypeToValue<C>,
  ) {
    super(id, state);

    if (this.state.virtual) {
      throw new Error("useAttribute can't be used with virtual components.");
    }

    this.updater = this.updater.bind(this);
    this.attrName = attrName;
    this.type = type;
    this.defaultValue =
      defaultValue !== undefined ? defaultValue : typeDefault(type);
    this.property = attrName.replace(/-+([a-z])?/g, (_, char) =>
      char ? char.toUpperCase() : "",
    );
    this.eventName =
      this.property.replace(UPPER, "-$1").toLowerCase() + "-changed";

    // Register with the shared MutationObserver
    registerHook(
      this.state.host,
      this.attrName,
      this as unknown as UseAttributeHook<AttributeType>,
    );

    // If property is already set by parent (via .prop= binding), keep it
    if (this.state.host[this.property] != null) return;

    // Read initial value from attribute if present
    const host = this.state.host;
    if (host.hasAttribute(this.attrName)) {
      const attrVal = host.getAttribute(this.attrName);
      const coerced = fromAttribute(this.type, attrVal, this.defaultValue);
      this.updateProp(coerced);
    } else {
      // Set the default value
      this.updateProp(this.defaultValue);
    }
  }

  update(
    _attrName: string,
    _type: C,
    _defaultValue?: TypeToValue<C>,
  ): StateTuple<TypeToValue<C>> {
    // Check if property value has diverged from last reflected attribute value
    const currentValue = this.state.host[this.property] as TypeToValue<C>;
    if (!Object.is(currentValue, this.lastReflected)) {
      this.reflectToAttribute(currentValue);
    }
    return [currentValue, this.updater];
  }

  updater(value: NewState<TypeToValue<C>>): void {
    const previousValue = this.state.host[this.property] as TypeToValue<C>;

    if (typeof value === "function") {
      const updaterFn = value as (prev: TypeToValue<C>) => TypeToValue<C>;
      value = updaterFn(previousValue);
    }

    if (Object.is(previousValue, value)) {
      return;
    }

    this.updateProp(value);
  }

  updateProp(value: TypeToValue<C>): void {
    const ev = this.notify(value);
    if (ev.defaultPrevented) return;
    this.state.host[this.property] = value;
    this.reflectToAttribute(value);
  }

  reflectToAttribute(value: TypeToValue<C>): void {
    const host = this.state.host;
    this.lastReflected = value;
    host[reflectingSymbol] = true;
    try {
      const attrVal = toAttribute(this.type, value);
      if (attrVal === null) {
        host.removeAttribute(this.attrName);
      } else {
        host.setAttribute(this.attrName, attrVal);
      }
    } finally {
      host[reflectingSymbol] = false;
    }
  }

  onAttributeChanged(): void {
    // Skip if this change was caused by our own reflection
    if (this.state.host[reflectingSymbol]) return;

    const attrVal = this.state.host.getAttribute(this.attrName);
    const coerced = fromAttribute(this.type, attrVal, this.defaultValue);
    const currentValue = this.state.host[this.property] as TypeToValue<C>;

    if (Object.is(currentValue, coerced)) return;

    this.state.host[this.property] = coerced;
  }

  notify(value: TypeToValue<C>) {
    const ev = new CustomEvent<ChangeEvent<TypeToValue<C>>>(this.eventName, {
      detail: { value, path: this.property },
      cancelable: true,
    });
    this.state.host.dispatchEvent(ev);
    return ev;
  }

  teardown(): void {
    unregisterHook(
      this.state.host,
      this.attrName,
      this as unknown as UseAttributeHook<AttributeType>,
    );
  }
}

export const useAttribute = hook(
  UseAttributeHook as unknown as new (
    id: number,
    state: State<AttributeHost>,
    ...args: [string, AttributeType, unknown?]
  ) => UseAttributeHook<AttributeType>,
) as UseAttribute;
