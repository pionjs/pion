import { component, html } from "../src/haunted.js";
import { fixture, expect } from "@open-wc/testing";

describe("baseElement", () => {
  class CountingBase extends HTMLElement {
    connectedCallbackCount = 0;
    disconnectedCallbackCount = 0;
    connectedCallback(): void {
      this.connectedCallbackCount++;
      this.setAttribute("base-connected", "true");
    }
    disconnectedCallback(): void {
      this.disconnectedCallbackCount++;
    }
  }

  it("calls the base element's connected/disconnected callbacks", async () => {
    const tag = "base-element-callbacks-test";

    customElements.define(
      tag,
      component(() => html`<div></div>`, { baseElement: CountingBase })
    );

    const el = (await fixture(
      html`<base-element-callbacks-test></base-element-callbacks-test>`
    )) as HTMLElement & CountingBase;

    expect(el.connectedCallbackCount).to.equal(1);
    expect(el.getAttribute("base-connected")).to.equal("true");

    el.remove();

    expect(el.disconnectedCallbackCount).to.equal(1);
  });
});