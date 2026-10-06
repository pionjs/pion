import { component, html } from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";

describe("Observed attributes with inherited accessors", () => {
  it("re-renders and reflects value changes, including removal", async () => {
    const tag = "attrs-aria-expanded-test";
    customElements.define(
      tag,
      // the renderer reads the attribute per the README guideline: the
      // verbatim value, no property coercion
      component(function (this: HTMLElement) {
        return html`<div>aria-expanded=${this.getAttribute("aria-expanded")}</div>`;
      }, { observedAttributes: ["aria-expanded"] })
    );

    const el = (await fixture(
      html`<attrs-aria-expanded-test aria-expanded="false"></attrs-aria-expanded-test>`
    )) as HTMLElement;
    await nextFrame();
    expect(el.shadowRoot.textContent).to.equal("aria-expanded=false");

    el.setAttribute("aria-expanded", "true");
    await nextFrame();
    expect(el.shadowRoot.textContent).to.equal("aria-expanded=true");

    el.removeAttribute("aria-expanded");
    await nextFrame();
    expect(el.shadowRoot.textContent).to.equal("aria-expanded=");
  });

  // deferred to next major: pion's "" -> true coercion rewrites the attribute
  // through the ARIAMixin reflection; tracked in the next-major items
  it.skip("preserves aria-expanded=\"\" verbatim", () => {});

  it("invokes base class setters with the raw value and re-renders", async () => {
    class Labeled extends HTMLElement {
      #label = "";
      get label(): string { return this.#label; }
      set label(v: unknown) { this.#label = v; }
    }
    const tag = "attrs-base-accessor-test";
    customElements.define(
      tag,
      // the renderer reads the accessor's backing property: the attribute
      // change must have reached the setter before this render
      component(function (this: HTMLElement & { label?: unknown }) {
        return html`<div>label=${String((this as HTMLElement & { label?: unknown }).label)}</div>`;
      }, { baseElement: Labeled, observedAttributes: ["label"] })
    );

    const el = (await fixture(
      html`<attrs-base-accessor-test></attrs-base-accessor-test>`
    )) as HTMLElement & { label?: unknown };

    el.setAttribute("label", "x");
    await nextFrame();

    expect(el.label).to.equal("x");
    expect(el.shadowRoot.textContent).to.equal("label=x");
  });
});