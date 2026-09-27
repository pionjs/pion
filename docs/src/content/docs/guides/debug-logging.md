---
title: Debug Logging
description: Observe component lifecycle — connected, renders and disconnected — with an opt-in tag allowlist, without touching component code.
---

pion ships an opt-in lifecycle logger built into every component. No code changes needed — you drive it entirely from the console.

## Enable

Set the global allowlist to a `Set` of tag names:

```js
window.__pion_debug_tags = new Set(['my-element', 'other-element']);
```

Matching components log their lifecycle to `console.debug`:

```
[pion:my-element] connected
[pion:my-element] render #1
[pion:my-element] render #2
[pion:my-element] disconnected (renders: 2)
```

The set is **read live** — add a tag and it starts logging with that component's next render:

```js
__pion_debug_tags.add('admin-dashboard');
```

Remove the global (or a tag from the set) to stop logging. When the global is unset, the check is a no-op.

## Reading the output

- **`connected` / `disconnected`** — mount and unmount of each instance.
- **`render #N`** — every render, numbered per instance. The count continues
  across disconnect/reconnect of the same instance; a *new* instance starts
  at `render #1` with a fresh id.
- **Instance ids** — every instance gets a stable short id at construction
  time, visible in the log prefix (`…#000004`) and on the element as
  `el.__pion_debug_id`. Concurrent instances of the same tag are
  distinguishable, and in a live session you can go from an element to its
  logs:

  ```js
  document.querySelector('my-element').__pion_debug_id; // e.g. "000004"
  // → filter the console by [pion:my-element#000004]
  ```

  Each log entry also carries the element as a second argument — click it in
  devtools to jump to the DOM node. Ids are per-session: with the same app
  structure, a refresh reproduces the same ids (they are assigned in
  construction order), so logs from two runs are comparable.
- **`disconnected (renders: N)`** — how many renders the instance completed before removal. A large `N` on an element that "shouldn't re-render" points at unexpected state churn.

Use devtools' console filtering (`^\[pion:`) to isolate the output, and verbose-level filtering to show/hide it — `console.debug` is hidden by default in most devtools.

## Production builds

The whole debug block is removed from production bundles with **no app-side configuration**:

| Build tool | Result |
| --- | --- |
| Vite | Fully dead-code-eliminated (`import.meta.env.PROD` is defined on every build) |
| webpack | Runtime-disabled — the guard evaluates to `true`, logging off (code not eliminated; webpack does not inject `import.meta.env`) |
| Other bundlers | Pass one standard define, e.g. `esbuild --define:import.meta.env.PROD=true` |

The guards use the conventional `import.meta.env?.PROD === true || globalThis.process?.env?.NODE_ENV === "production"` expression, which bundlers replace statically during production builds. When neither value is defined — dev servers, test runners, undbundled usage — the feature stays available.