class InfiniteLoopError extends Error {
  constructor(component?: string) {
    const tag = component ? ` <${component}>` : "";
    super(
      `Infinite update loop detected in component${tag}. ` +
        "This usually means a hook (useEffect, useMemo, useCallback) " +
        "has dependencies that create new references on every render, " +
        "such as [{}], [[]], or [Promise.resolve()]. " +
        "Make sure your dependency arrays contain stable references."
    );
    this.name = "InfiniteLoopError";
  }
}

export { InfiniteLoopError };
