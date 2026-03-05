import { component, html, useState } from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";
import {
  enableHMR,
  replaceRenderer,
  getComponentEntry,
  getRegisteredTags,
  clearRegistry,
} from "../src/hmr.js";
import { later } from "./helpers.js";

describe("HMR", () => {
  before(() => {
    // Enable HMR before any component definitions.
    // NOTE: enableHMR patches customElements.define globally, so it must
    // be called before components are defined. In a real app, the Vite
    // plugin injects this in the HTML head.
    enableHMR();
  });

  afterEach(() => {
    // Don't clear registry between tests — customElements.define is
    // permanent and we can't unregister elements. Each test uses unique
    // tag names.
  });

  describe("Component registration", () => {
    it("registers a pion component in the HMR registry", async () => {
      const tag = "hmr-test-register";

      function App() {
        return html`<span>Hello</span>`;
      }

      customElements.define(tag, component(App));

      expect(getRegisteredTags()).to.include(tag);

      const entry = getComponentEntry(tag);
      expect(entry).to.not.be.undefined;
      expect(entry!.tagName).to.equal(tag);
    });

    it("tracks instances in connectedCallback", async () => {
      const tag = "hmr-test-track";

      function App() {
        return html`<span>Tracked</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture(html`<hmr-test-track></hmr-test-track>`);
      await later();

      const entry = getComponentEntry(tag);
      expect(entry).to.not.be.undefined;
      expect(entry!.instances.size).to.equal(1);
      expect(entry!.instances.has(el)).to.be.true;
    });

    it("untracks instances in disconnectedCallback", async () => {
      const tag = "hmr-test-untrack";

      function App() {
        return html`<span>Untracked</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture(html`<hmr-test-untrack></hmr-test-untrack>`);
      await later();

      const entry = getComponentEntry(tag);
      expect(entry!.instances.size).to.equal(1);

      // Remove from DOM
      el.remove();
      await later();

      expect(entry!.instances.size).to.equal(0);
    });
  });

  describe("Hot replacement", () => {
    it("replaces the renderer and re-renders live instances", async () => {
      const tag = "hmr-test-replace";

      function AppV1() {
        return html`<span>Version 1</span>`;
      }

      customElements.define(tag, component(AppV1));

      const el = await fixture(html`<hmr-test-replace></hmr-test-replace>`);
      await later();

      expect(el.shadowRoot!.textContent).to.equal("Version 1");

      // Simulate hot replacement
      function AppV2() {
        return html`<span>Version 2</span>`;
      }

      const count = replaceRenderer(tag, AppV2);
      await later();

      expect(count).to.equal(1);
      expect(el.shadowRoot!.textContent).to.equal("Version 2");
    });

    it("preserves hook state across hot replacement", async () => {
      const tag = "hmr-test-state";
      let setCount: (v: number) => void;

      function AppV1() {
        const [count, _setCount] = useState(42);
        setCount = _setCount;
        return html`<span>Count: ${count}</span>`;
      }

      customElements.define(tag, component(AppV1));

      const el = await fixture(html`<hmr-test-state></hmr-test-state>`);
      await later();

      expect(el.shadowRoot!.textContent).to.equal("Count: 42");

      // Change state
      setCount!(100);
      await later();

      expect(el.shadowRoot!.textContent).to.equal("Count: 100");

      // Hot replace — the new renderer uses the same hooks, so state
      // should be preserved (hook state lives on the State object, not
      // on the renderer function)
      function AppV2() {
        const [count] = useState(0); // default won't matter, state exists
        return html`<span>New Count: ${count}</span>`;
      }

      replaceRenderer(tag, AppV2);
      await later();

      // State (100) should be preserved, only template changed
      expect(el.shadowRoot!.textContent).to.equal("New Count: 100");
    });

    it("handles replacement with no live instances gracefully", async () => {
      const tag = "hmr-test-no-instances";

      function AppV1() {
        return html`<span>V1</span>`;
      }

      customElements.define(tag, component(AppV1));

      // Don't create any instances

      function AppV2() {
        return html`<span>V2</span>`;
      }

      const count = replaceRenderer(tag, AppV2);
      expect(count).to.equal(0);
    });

    it("skips re-definition on second customElements.define call", async () => {
      const tag = "hmr-test-redefine";

      function AppV1() {
        return html`<span>First</span>`;
      }

      customElements.define(tag, component(AppV1));

      const el = await fixture(html`<hmr-test-redefine></hmr-test-redefine>`);
      await later();

      expect(el.shadowRoot!.textContent).to.equal("First");

      // Simulate what happens when the module re-executes after HMR:
      // component() creates a new class, and customElements.define is
      // called again with the same tag name. The patched define should
      // NOT throw (normally it would throw DOMException).
      function AppV2() {
        return html`<span>Second</span>`;
      }

      // This should NOT throw
      customElements.define(tag, component(AppV2));
      await later();

      // The live instance should have been updated
      expect(el.shadowRoot!.textContent).to.equal("Second");
    });

    it("handles multiple instances", async () => {
      const tag = "hmr-test-multi";

      function AppV1() {
        return html`<span>Multi V1</span>`;
      }

      customElements.define(tag, component(AppV1));

      const container = await fixture(html`
        <div>
          <hmr-test-multi></hmr-test-multi>
          <hmr-test-multi></hmr-test-multi>
          <hmr-test-multi></hmr-test-multi>
        </div>
      `);
      await later();

      const instances = container.querySelectorAll(tag);
      expect(instances.length).to.equal(3);

      for (const el of instances) {
        expect(el.shadowRoot!.textContent).to.equal("Multi V1");
      }

      // Hot replace
      function AppV2() {
        return html`<span>Multi V2</span>`;
      }

      const count = replaceRenderer(tag, AppV2);
      await later();

      expect(count).to.equal(3);
      for (const el of instances) {
        expect(el.shadowRoot!.textContent).to.equal("Multi V2");
      }
    });
  });
});
