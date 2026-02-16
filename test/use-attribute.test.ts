import {
  component,
  html,
  lift,
  useAttribute,
  useState,
  virtual,
} from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";

describe("useAttribute", () => {
  it("returns [false, setter] by default", async () => {
    const tag = "use-attr-default";
    let value: boolean;

    function App() {
      const [opened] = useAttribute("opened");
      value = opened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(tag, component(App));

    await fixture<HTMLElement>(html`<use-attr-default></use-attr-default>`);

    expect(value!).to.be.false;
  });

  it("reflects true to attribute and false removes it", async () => {
    const tag = "use-attr-reflect";
    let setter: (v: any) => void;

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-reflect></use-attr-reflect>`,
    );

    // Initial: false — no attribute
    expect(el.hasAttribute("opened")).to.be.false;

    setter!(true);
    await nextFrame();
    expect(el.hasAttribute("opened")).to.be.true;
    expect(el.getAttribute("opened")).to.equal("");

    setter!(false);
    await nextFrame();
    expect(el.hasAttribute("opened")).to.be.false;
  });

  it("does not cause feedback loop", async () => {
    const tag = "use-attr-no-loop";
    let renderCount = 0;
    let setter: (v: any) => void;

    function App() {
      renderCount++;
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    await fixture<HTMLElement>(
      html`<use-attr-no-loop></use-attr-no-loop>`,
    );

    const countBefore = renderCount;
    setter!(true);
    await nextFrame();
    // Should only render once more after the setter, not loop
    expect(renderCount).to.equal(countBefore + 1);
  });

  it("syncs external setAttribute to property", async () => {
    const tag = "use-attr-ext-set";

    function App() {
      const [opened] = useAttribute("opened");
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-ext-set></use-attr-ext-set>`,
    );

    const span = el.shadowRoot?.firstElementChild;
    expect(span?.textContent).to.equal("false");

    // Set attribute externally — should sync to property
    el.setAttribute("opened", "");
    await nextFrame();
    expect(span?.textContent).to.equal("true");
    expect((el as any).opened).to.be.true;
  });

  it("syncs external removeAttribute to false", async () => {
    const tag = "use-attr-ext-remove";
    let setter: (v: any) => void;

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-ext-remove></use-attr-ext-remove>`,
    );

    // Open it first
    setter!(true);
    await nextFrame();
    expect(el.hasAttribute("opened")).to.be.true;
    expect((el as any).opened).to.be.true;

    // Remove attribute externally
    el.removeAttribute("opened");
    await nextFrame();
    expect((el as any).opened).to.be.false;
    expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("false");
  });

  it("honors initial attribute value", async () => {
    const tag = "use-attr-initial";

    function App() {
      const [opened] = useAttribute("opened");
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-initial opened></use-attr-initial>`,
    );

    expect((el as any).opened).to.be.true;
    expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("true");
  });

  it("dispatches *-changed event", async () => {
    const tag = "use-attr-event";
    let setter: (v: any) => void;

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-event></use-attr-event>`,
    );

    let eventDetail: any;
    el.addEventListener("opened-changed", ((ev: CustomEvent) => {
      eventDetail = ev.detail;
    }) as EventListener);

    setter!(true);
    expect(eventDetail).to.deep.equal({ value: true, path: "opened" });
  });

  it("preventDefault blocks update and attribute reflection", async () => {
    const tag = "use-attr-prevent";
    let setter: (v: any) => void;

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-prevent
        @opened-changed=${(ev: Event) => ev.preventDefault()}
      ></use-attr-prevent>`,
    );

    setter!(true);
    await nextFrame();
    // Event was prevented — property and attribute should NOT update
    expect((el as any).opened).to.not.be.true;
    expect(el.hasAttribute("opened")).to.be.false;
  });

  it("works with lift pattern", async () => {
    const parentTag = "use-attr-lift-parent";
    const childTag = "use-attr-lift-child";
    let parentSetter: (v: any) => void;
    let childSetter: (v: any) => void;

    function Parent() {
      const [opened, setOpened] = useState(false);
      parentSetter = setOpened;
      return html`<use-attr-lift-child
        .opened=${opened}
        @opened-changed=${lift((v: boolean) => setOpened(v))}
      ></use-attr-lift-child>`;
    }

    function Child() {
      const [opened, setOpened] = useAttribute("opened");
      childSetter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(parentTag, component(Parent));
    customElements.define(
      childTag,
      component(Child, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-lift-parent></use-attr-lift-parent>`,
    );

    const child = el.shadowRoot?.firstElementChild as any;
    expect(child?.opened).to.be.false;

    // Parent sets opened
    parentSetter!(true);
    await nextFrame();
    await nextFrame(); // extra frame for child to render
    expect(child?.opened).to.be.true;
    expect(child?.hasAttribute("opened")).to.be.true;

    // Child requests change — parent lifts it
    childSetter!(false);
    await nextFrame();
    await nextFrame();
    expect(child?.opened).to.be.false;
    expect(child?.hasAttribute("opened")).to.be.false;
  });

  it("supports function updater", async () => {
    const tag = "use-attr-fn-updater";
    let setter: (v: any) => void;

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setter = setOpened;
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-fn-updater></use-attr-fn-updater>`,
    );

    expect((el as any).opened).to.be.false;

    // Toggle using function updater
    setter!((prev: boolean) => !prev);
    await nextFrame();
    expect((el as any).opened).to.be.true;
    expect(el.hasAttribute("opened")).to.be.true;

    // Toggle back
    setter!((prev: boolean) => !prev);
    await nextFrame();
    expect((el as any).opened).to.be.false;
    expect(el.hasAttribute("opened")).to.be.false;
  });

  it("throws in virtual component", async () => {
    const tag = "use-attr-virtual-render";
    let error: Error | null = null;

    const VApp = virtual(() => {
      try {
        useAttribute("opened");
      } catch (e) {
        error = e as Error;
      }
      return html`<span>virtual</span>`;
    });

    function App() {
      return html`${VApp()}`;
    }

    customElements.define(tag, component(App));

    await fixture<HTMLElement>(
      html`<use-attr-virtual-render></use-attr-virtual-render>`,
    );

    expect(error).to.be.instanceOf(Error);
    expect(error!.message).to.include("virtual");
  });

  it("handles kebab-case attribute with camelCase property", async () => {
    const tag = "use-attr-kebab";
    let setter: (v: any) => void;

    function App() {
      const [openOnFocus, setOpenOnFocus] = useAttribute("open-on-focus");
      setter = setOpenOnFocus;
      return html`<span>${openOnFocus}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["open-on-focus"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-kebab></use-attr-kebab>`,
    );

    expect((el as any).openOnFocus).to.be.false;
    expect(el.hasAttribute("open-on-focus")).to.be.false;

    setter!(true);
    await nextFrame();
    expect((el as any).openOnFocus).to.be.true;
    expect(el.hasAttribute("open-on-focus")).to.be.true;
    expect(el.getAttribute("open-on-focus")).to.equal("");

    // External attribute change
    el.removeAttribute("open-on-focus");
    await nextFrame();
    expect((el as any).openOnFocus).to.be.false;
  });

  it("respects parent-provided property value", async () => {
    const parentTag = "use-attr-parent-override-p";
    const childTag = "use-attr-parent-override-c";

    function Parent() {
      return html`<use-attr-parent-override-c
        .opened=${true}
      ></use-attr-parent-override-c>`;
    }

    function Child() {
      const [opened] = useAttribute("opened");
      return html`<span>${opened}</span>`;
    }

    customElements.define(parentTag, component(Parent));
    customElements.define(
      childTag,
      component(Child, { observedAttributes: ["opened"] }),
    );

    const el = await fixture<HTMLElement>(
      html`<use-attr-parent-override-p></use-attr-parent-override-p>`,
    );

    const child = el.shadowRoot?.firstElementChild as any;
    await nextFrame();
    expect(child?.opened).to.be.true;
  });

  it("setter is referentially stable across renders", async () => {
    const tag = "use-attr-stable-setter";
    const setters: any[] = [];

    function App() {
      const [opened, setOpened] = useAttribute("opened");
      setters.push(setOpened);
      return html`<span>${opened}</span>`;
    }

    customElements.define(
      tag,
      component(App, { observedAttributes: ["opened"] }),
    );

    await fixture<HTMLElement>(
      html`<use-attr-stable-setter></use-attr-stable-setter>`,
    );

    // Trigger a re-render
    setters[0](true);
    await nextFrame();

    expect(setters.length).to.be.greaterThan(1);
    expect(setters[0]).to.equal(setters[1]);
  });
});
