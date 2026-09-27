import { expect, fixture } from "@open-wc/testing";
import { html, debugComponent } from "../src/haunted.js";

const logs: string[] = [];
let origDebug: typeof console.debug;

describe("debugComponent()", () => {
  beforeEach(() => {
    logs.length = 0;
    origDebug = console.debug;
    console.debug = (...args: unknown[]) => {
      logs.push(String(args[0]));
      origDebug(...args);
    };
  });

  afterEach(() => {
    console.debug = origDebug;
  });

  it("mounts and renders like component()", async () => {
    customElements.define(
      "debug-component-basic",
      debugComponent(() => html`Debug`)
    );

    const el = await fixture(html`<debug-component-basic></debug-component-basic>`);
    expect(el.shadowRoot.textContent).to.equal("Debug");
  });

  it("is an instance of HTMLElement", async () => {
    customElements.define(
      "debug-component-instanceof",
      debugComponent(() => html`Test`)
    );
    const el = document.createElement("debug-component-instanceof");
    expect(el instanceof HTMLElement).to.be.true;
  });

  it("logs connected, render #N and disconnected prefixed by the tag name", async () => {
    customElements.define(
      "debug-component-logs",
      debugComponent(() => html`Test`)
    );

    const el = await fixture(
      html`<debug-component-logs></debug-component-logs>`
    );
    await el.updateComplete;
    el.remove();
    await el.updateComplete;

    const tag = "debug-component-logs";
    expect(logs.some((l) => l === `[pion:${tag}] connected`)).to.be.true;
    expect(logs.some((l) => l === `[pion:${tag}] render #1`)).to.be.true;
    expect(
      logs.some((l) => l.startsWith(`[pion:${tag}] disconnected`))
    ).to.be.true;
  });

  it("restarts the render count for a fresh instance", async () => {
    customElements.define(
      "debug-component-two-instances",
      debugComponent(() => html`Test`)
    );

    const first = await fixture(
      html`<debug-component-two-instances></debug-component-two-instances>`
    );
    await first.updateComplete;
    first.remove();

    const second = await fixture(
      html`<debug-component-two-instances></debug-component-two-instances>`
    );
    await second.updateComplete;
    second.remove();

    const renders = logs.filter(
      (l) => l === `[pion:debug-component-two-instances] render #1`
    );
    // both instances log render #1 — a remount is visible as a restarted count
    expect(renders.length).to.equal(2);
  });
});