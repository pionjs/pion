import {
  component,
  html,
  lift,
  useAttribute,
  useState,
} from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";

describe("useAttribute", () => {
  describe("Boolean type", () => {
    it("reflects boolean property to attribute", async () => {
      const tag = "use-attr-bool";
      let setter: (v: any) => void;

      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-bool></use-attr-bool>`,
      );

      // Initial value false — attribute should not be present
      expect(el.hasAttribute("opened")).to.be.false;
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("false");

      setter!(true);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.true;
      expect(el.getAttribute("opened")).to.equal("");
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("true");

      setter!(false);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.false;
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("false");
    });

    it("honors initial attribute value", async () => {
      const tag = "use-attr-bool-initial";

      function App() {
        const [opened] = useAttribute("opened", Boolean);
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-bool-initial opened></use-attr-bool-initial>`,
      );

      expect((el as any).opened).to.be.true;
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("true");
    });

    it("supports function updater", async () => {
      const tag = "use-attr-bool-fn-updater";
      let toggle: () => void;

      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        toggle = () => setOpened((prev: boolean) => !prev);
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-bool-fn-updater></use-attr-bool-fn-updater>`,
      );

      expect((el as any).opened).to.be.false;

      toggle!();
      await nextFrame();
      expect((el as any).opened).to.be.true;
      expect(el.hasAttribute("opened")).to.be.true;

      toggle!();
      await nextFrame();
      expect((el as any).opened).to.be.false;
      expect(el.hasAttribute("opened")).to.be.false;
    });
  });

  describe("String type", () => {
    it("reflects string property to attribute", async () => {
      const tag = "use-attr-str";
      let setter: (v: any) => void;

      function App() {
        const [name, setName] = useAttribute("name", String);
        setter = setName;
        return html`<span>${name}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-str></use-attr-str>`,
      );

      // Default is empty string — attribute should be set to ""
      expect(el.getAttribute("name")).to.equal("");

      setter!("hello");
      await nextFrame();
      expect(el.getAttribute("name")).to.equal("hello");
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("hello");

      setter!("world");
      await nextFrame();
      expect(el.getAttribute("name")).to.equal("world");
    });

    it("honors initial attribute value for string", async () => {
      const tag = "use-attr-str-initial";

      function App() {
        const [name] = useAttribute("name", String);
        return html`<span>${name}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-str-initial name="Alice"></use-attr-str-initial>`,
      );

      expect((el as any).name).to.equal("Alice");
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("Alice");
    });

    it("supports custom default value", async () => {
      const tag = "use-attr-str-default";

      function App() {
        const [name] = useAttribute("name", String, "unnamed");
        return html`<span>${name}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-str-default></use-attr-str-default>`,
      );

      expect((el as any).name).to.equal("unnamed");
      expect(el.getAttribute("name")).to.equal("unnamed");
    });
  });

  describe("Number type", () => {
    it("reflects number property to attribute", async () => {
      const tag = "use-attr-num";
      let setter: (v: any) => void;

      function App() {
        const [count, setCount] = useAttribute("count", Number);
        setter = setCount;
        return html`<span>${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-num></use-attr-num>`,
      );

      // Default is 0
      expect((el as any).count).to.equal(0);
      expect(el.getAttribute("count")).to.equal("0");

      setter!(42);
      await nextFrame();
      expect(el.getAttribute("count")).to.equal("42");
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("42");
    });

    it("parses number from attribute value", async () => {
      const tag = "use-attr-num-parse";

      function App() {
        const [count] = useAttribute("count", Number);
        return html`<span>${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-num-parse count="99"></use-attr-num-parse>`,
      );

      expect((el as any).count).to.equal(99);
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("99");
    });

    it("supports custom default value for number", async () => {
      const tag = "use-attr-num-default";

      function App() {
        const [count] = useAttribute("count", Number, 10);
        return html`<span>${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-num-default></use-attr-num-default>`,
      );

      expect((el as any).count).to.equal(10);
      expect(el.getAttribute("count")).to.equal("10");
    });

    it("supports function updater for number", async () => {
      const tag = "use-attr-num-fn";
      let increment: () => void;

      function App() {
        const [count, setCount] = useAttribute("count", Number, 0);
        increment = () => setCount((prev: number) => prev + 1);
        return html`<span>${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-num-fn></use-attr-num-fn>`,
      );

      increment!();
      await nextFrame();
      expect((el as any).count).to.equal(1);

      increment!();
      await nextFrame();
      expect((el as any).count).to.equal(2);
    });
  });

  describe("feedback loop prevention", () => {
    it("does not cause feedback loop", async () => {
      const tag = "use-attr-no-loop";
      let renderCount = 0;
      let setter: (v: any) => void;

      function App() {
        renderCount++;
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      await fixture<HTMLElement>(
        html`<use-attr-no-loop></use-attr-no-loop>`,
      );

      const countBefore = renderCount;
      setter!(true);
      await nextFrame();
      // Should only render once more after the setter, not loop
      expect(renderCount).to.equal(countBefore + 1);
    });
  });

  describe("external attribute changes via MutationObserver", () => {
    it("syncs external setAttribute to property", async () => {
      const tag = "use-attr-ext-set";

      function App() {
        const [opened] = useAttribute("opened", Boolean);
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-ext-set></use-attr-ext-set>`,
      );

      expect((el as any).opened).to.be.false;

      // Externally set attribute
      el.setAttribute("opened", "");
      // MutationObserver fires asynchronously (microtask)
      await nextFrame();
      expect((el as any).opened).to.be.true;
      expect(
        el.shadowRoot?.firstElementChild?.textContent,
      ).to.equal("true");
    });

    it("syncs external removeAttribute to property", async () => {
      const tag = "use-attr-ext-remove";
      let setter: (v: any) => void;

      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-ext-remove></use-attr-ext-remove>`,
      );

      // Open it first
      setter!(true);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.true;

      // Externally remove attribute
      el.removeAttribute("opened");
      await nextFrame();
      expect((el as any).opened).to.be.false;
      expect(
        el.shadowRoot?.firstElementChild?.textContent,
      ).to.equal("false");
    });

    it("syncs external string attribute change", async () => {
      const tag = "use-attr-ext-str";

      function App() {
        const [name] = useAttribute("name", String);
        return html`<span>${name}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-ext-str></use-attr-ext-str>`,
      );

      el.setAttribute("name", "externally-set");
      await nextFrame();
      expect((el as any).name).to.equal("externally-set");
      expect(
        el.shadowRoot?.firstElementChild?.textContent,
      ).to.equal("externally-set");
    });

    it("syncs external number attribute change", async () => {
      const tag = "use-attr-ext-num";

      function App() {
        const [count] = useAttribute("count", Number);
        return html`<span>${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-ext-num></use-attr-ext-num>`,
      );

      el.setAttribute("count", "77");
      await nextFrame();
      expect((el as any).count).to.equal(77);
    });
  });

  describe("events", () => {
    it("dispatches *-changed event", async () => {
      const tag = "use-attr-event";
      let setter: (v: any) => void;

      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-event></use-attr-event>`,
      );

      let eventDetail: any;
      el.addEventListener("opened-changed", ((ev: CustomEvent) => {
        eventDetail = ev.detail;
      }) as EventListener);

      setter!(true);
      expect(eventDetail).to.deep.equal({
        value: true,
        path: "opened",
      });
    });

    it("does not update when event is prevented", async () => {
      const tag = "use-attr-prevent";
      let setter: (v: any) => void;

      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

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
  });

  describe("kebab-case attribute to camelCase property", () => {
    it("converts kebab-case attribute to camelCase property", async () => {
      const tag = "use-attr-kebab";
      let setter: (v: any) => void;

      function App() {
        const [openOnHover, setOpenOnHover] = useAttribute(
          "open-on-hover",
          Boolean,
        );
        setter = setOpenOnHover;
        return html`<span>${openOnHover}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-kebab></use-attr-kebab>`,
      );

      expect((el as any).openOnHover).to.be.false;

      setter!(true);
      await nextFrame();
      expect((el as any).openOnHover).to.be.true;
      expect(el.hasAttribute("open-on-hover")).to.be.true;
    });

    it("honors initial kebab-case attribute", async () => {
      const tag = "use-attr-kebab-initial";

      function App() {
        const [openOnHover] = useAttribute("open-on-hover", Boolean);
        return html`<span>${openOnHover}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-kebab-initial open-on-hover></use-attr-kebab-initial>`,
      );

      expect((el as any).openOnHover).to.be.true;
    });
  });

  describe("lift pattern", () => {
    it("works with lift for parent-controlled state", async () => {
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
        const [opened, setOpened] = useAttribute("opened", Boolean);
        childSetter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(parentTag, component(Parent));
      customElements.define(childTag, component(Child));

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
  });

  describe("multiple useAttribute on same host", () => {
    it("supports multiple attributes on one component", async () => {
      const tag = "use-attr-multi";
      let setOpened: (v: any) => void;
      let setName: (v: any) => void;

      function App() {
        const [opened, _setOpened] = useAttribute("opened", Boolean);
        const [name, _setName] = useAttribute("name", String, "default");
        setOpened = _setOpened;
        setName = _setName;
        return html`<span>${opened} ${name}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-multi></use-attr-multi>`,
      );

      expect((el as any).opened).to.be.false;
      expect((el as any).name).to.equal("default");

      setOpened!(true);
      setName!("test");
      await nextFrame();

      expect(el.hasAttribute("opened")).to.be.true;
      expect(el.getAttribute("name")).to.equal("test");
    });

    it("external changes work for multiple attributes", async () => {
      const tag = "use-attr-multi-ext";

      function App() {
        const [opened] = useAttribute("opened", Boolean);
        const [count] = useAttribute("count", Number);
        return html`<span>${opened} ${count}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-multi-ext></use-attr-multi-ext>`,
      );

      el.setAttribute("opened", "");
      el.setAttribute("count", "5");
      await nextFrame();

      expect((el as any).opened).to.be.true;
      expect((el as any).count).to.equal(5);
    });
  });

  describe("no observedAttributes required", () => {
    it("works without declaring observedAttributes", async () => {
      const tag = "use-attr-no-observed";
      let setter: (v: any) => void;

      // Note: no observedAttributes option passed to component()
      function App() {
        const [opened, setOpened] = useAttribute("opened", Boolean);
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-attr-no-observed></use-attr-no-observed>`,
      );

      // Property works
      setter!(true);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.true;
      expect((el as any).opened).to.be.true;

      // External attribute change works (via MutationObserver, not attributeChangedCallback)
      el.removeAttribute("opened");
      await nextFrame();
      expect((el as any).opened).to.be.false;
    });
  });

  describe("parent .prop= override", () => {
    it("respects parent-provided property value over default", async () => {
      const parentTag = "use-attr-parent-override-p";
      const childTag = "use-attr-parent-override-c";

      function Parent() {
        return html`<use-attr-parent-override-c
          .opened=${true}
        ></use-attr-parent-override-c>`;
      }

      function Child() {
        const [opened] = useAttribute("opened", Boolean);
        return html`<span>${opened}</span>`;
      }

      customElements.define(parentTag, component(Parent));
      customElements.define(childTag, component(Child));

      const el = await fixture<HTMLElement>(
        html`<use-attr-parent-override-p></use-attr-parent-override-p>`,
      );

      const child = el.shadowRoot?.firstElementChild as any;
      await nextFrame();
      expect(child?.opened).to.be.true;
    });
  });
});
