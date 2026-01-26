import { component, html, useHost } from "../src/haunted.js";
import { fixture, expect } from "@open-wc/testing";

describe("useHost", () => {
  it("returns the host element", async () => {
    const tag = "use-host-test";

    function App() {
      const host = useHost();
      return html`<span>${host.tagName}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
      html`<use-host-test></use-host-test>`
    );

    const span = el.shadowRoot?.firstElementChild;
    expect(span?.textContent).to.equal("USE-HOST-TEST");
  });

  it("can be used with specific element type", async () => {
    const tag = "use-host-specific-type";

    function App() {
      const host = useHost<HTMLElement>();
      return html`<span>${host instanceof HTMLElement}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
      html`<use-host-specific-type></use-host-specific-type>`
    );

    const span = el.shadowRoot?.firstElementChild;
    expect(span?.textContent).to.equal("true");
  });
});
