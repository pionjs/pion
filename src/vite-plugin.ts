/**
 * Vite plugin for pion HMR (Hot Module Replacement).
 *
 * This plugin enables hot module replacement for pion web components.
 * When a file containing `customElements.define(...)` with `component(...)`
 * is saved, the plugin:
 *
 * 1. Injects an HMR preamble that calls `enableHMR()` from the pion runtime
 * 2. Transforms component files to add `import.meta.hot.accept()` handlers
 *    that swap renderers on live instances instead of reloading the page
 *
 * ## Usage
 *
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import pion from '@pionjs/pion/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [pion()],
 * });
 * ```
 *
 * ## How the transform works
 *
 * Given a file like:
 * ```js
 * import { component, html } from '@pionjs/pion';
 *
 * const MyEl = (host) => html`<div>Hello</div>`;
 * customElements.define('my-el', component(MyEl));
 * ```
 *
 * It transforms it to:
 * ```js
 * import { component, html } from '@pionjs/pion';
 *
 * const MyEl = (host) => html`<div>Hello</div>`;
 * customElements.define('my-el', component(MyEl));
 *
 * if (import.meta.hot) {
 *   import.meta.hot.accept((newModule) => {
 *     // The module re-executes on accept, and the patched
 *     // customElements.define handles the hot swap automatically.
 *   });
 * }
 * ```
 *
 * The heavy lifting happens in the patched `customElements.define` (from
 * `enableHMR()` in the pion runtime). When the module re-executes:
 * - `component(NewRenderer)` creates a new class with `rendererSymbol`
 * - `customElements.define('my-el', ...)` detects the tag is already registered
 * - It extracts the new renderer and swaps it on all live instances
 */

interface PionPluginOptions {
  /**
   * File patterns to include for HMR transformation.
   * Defaults to common JS/TS file extensions.
   */
  include?: RegExp;

  /**
   * File patterns to exclude from HMR transformation.
   * Defaults to node_modules.
   */
  exclude?: RegExp;
}

/**
 * Regex to detect files that define pion components.
 *
 * Matches patterns like:
 * - `customElements.define('tag-name', component(Fn))`
 * - `customElements.define("tag-name", component(Fn))`
 * - `customElements.define("tag-name", component(Fn, opts))`
 *
 * We look for:
 * 1. `customElements.define` call
 * 2. A string literal for the tag name (single or double quotes)
 * 3. `component(` somewhere in the second argument
 */
const DEFINE_PATTERN =
  /customElements\.define\(\s*(['"`])([a-z][\w-]*)\1\s*,\s*component\s*\(/;

/**
 * Regex to extract all define calls with their tag names and renderer identifiers.
 * Used to generate targeted HMR accept handlers.
 *
 * Captures:
 * - Group 1: quote type
 * - Group 2: tag name
 */
const DEFINE_PATTERN_GLOBAL =
  /customElements\.define\(\s*(['"`])([a-z][\w-]*)\1\s*,\s*component\s*\(/g;

export default function pionHMR(options: PionPluginOptions = {}) {
  const {
    include = /\.(js|ts|jsx|tsx|mjs|mts)$/,
    exclude = /node_modules/,
  } = options;

  let isServe = false;

  return {
    name: 'pion:hmr',
    enforce: 'post' as const,

    config(_config: any, env: { command: string }) {
      isServe = env.command === 'serve';
    },

    transformIndexHtml(html: string) {
      if (!isServe) return html;

      // Inject HMR preamble that enables the pion HMR runtime.
      // This must run before any component modules are loaded.
      return html.replace(
        '</head>',
        `<script type="module">import { enableHMR } from '@pionjs/pion/hmr';enableHMR();</script>\n</head>`,
      );
    },

    transform(code: string, id: string) {
      // Only transform in dev mode
      if (!isServe) return null;

      // Check include/exclude
      if (!include.test(id)) return null;
      if (exclude.test(id)) return null;

      // Only transform files that define pion components
      if (!DEFINE_PATTERN.test(code)) return null;

      // Find all component definitions in the file
      const defines: string[] = [];
      let match: RegExpExecArray | null;
      const re = new RegExp(DEFINE_PATTERN_GLOBAL.source, 'g');
      while ((match = re.exec(code)) !== null) {
        defines.push(match[2]); // tag name
      }

      if (defines.length === 0) return null;

      // Append HMR accept handler
      const hmrCode = `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;

      return {
        code: code + hmrCode,
        map: null, // TODO: generate proper source maps
      };
    },
  };
}
