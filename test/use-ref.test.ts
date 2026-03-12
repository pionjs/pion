import { component, html, useRef, useState, createRef } from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";
import { ref } from "lit-html/directives/ref.js";

describe("useRef", () => {
  it("always returns the same object", async () => {
    const tag = "use-ref-test";
    let countRef;
    let requestRender;
    let timesRendered = 0;
    function app() {
      timesRendered++;
      countRef = useRef(0);
      [, requestRender] = useState(0);

      return html`Test`;
    }
    customElements.define(tag, component(app));

    await fixture<HTMLElement>(html`<use-ref-test></use-ref-test>`);

    expect(countRef.current).to.equal(0);
    countRef.current++;
    requestRender();
    await nextFrame();
    expect(timesRendered).to.equal(2);
    expect(countRef.current).to.equal(1);
  });

  it("has both current and value properties that stay in sync", async () => {
    const tag = "use-ref-sync-test";
    let myRef;
    let requestRender;
    function app() {
      myRef = useRef<HTMLInputElement>();
      [, requestRender] = useState(0);
      return html`<input ${ref(myRef)} />`;
    }
    customElements.define(tag, component(app), { extends: "div" });
    customElements.define(tag + "-shadow", component(app));

    await fixture<HTMLElement>(html`<use-ref-sync-test-shadow></use-ref-sync-test-shadow>`);

    expect(myRef.current).to.be.instanceOf(HTMLInputElement);
    expect(myRef.value).to.equal(myRef.current);

    myRef.current = document.createElement("div") as HTMLInputElement;
    expect(myRef.value).to.equal(myRef.current);

    myRef.value = document.createElement("span") as HTMLInputElement;
    expect(myRef.current).to.equal(myRef.value);
  });

  it("works with lit-html ref directive", async () => {
    const tag = "use-ref-lit-test";
    let inputRef;
    function app() {
      inputRef = useRef<HTMLInputElement>();
      return html`<input ${ref(inputRef)} type="text" />`;
    }
    customElements.define(tag, component(app));

    const el = await fixture<HTMLElement>(html`<use-ref-lit-test></use-ref-lit-test>`);

    expect(inputRef.current).to.be.instanceOf(HTMLInputElement);
    expect(inputRef.current?.type).to.equal("text");
    expect(inputRef.value).to.equal(inputRef.current);
  });
});

describe("createRef", () => {
  it("creates a ref with current and value properties", () => {
    const myRef = createRef<number>(42);
    expect(myRef.current).to.equal(42);
    expect(myRef.value).to.equal(42);
  });

  it("keeps current and value in sync", () => {
    const myRef = createRef<number>();
    myRef.current = 10;
    expect(myRef.value).to.equal(10);

    myRef.value = 20;
    expect(myRef.current).to.equal(20);
  });

  it("returns undefined by default", () => {
    const myRef = createRef<string>();
    expect(myRef.current).to.be.undefined;
    expect(myRef.value).to.be.undefined;
  });

  it("works with lit-html ref directive", async () => {
    const tag = "create-ref-lit-test";
    const inputRef = createRef<HTMLInputElement>();
    
    customElements.define(tag, component(() => html`<input ${ref(inputRef)} type="email" />`));

    await fixture<HTMLElement>(html`<create-ref-lit-test></create-ref-lit-test>`);

    expect(inputRef.current).to.be.instanceOf(HTMLInputElement);
    expect(inputRef.current?.type).to.equal("email");
    expect(inputRef.value).to.equal(inputRef.current);
  });
});
