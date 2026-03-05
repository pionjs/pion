import Sinon from "sinon";
import {
  component,
  html,
  lift,
  render,
  useProperty,
  useState,
  virtual,
} from "../src/haunted.js";
import { fixture, expect, nextFrame } from "@open-wc/testing";
import { PolymerElement, html as polymerHtml } from "@polymer/polymer";

describe("useProperty", () => {
  it("works similar to useState", async () => {
    const tag = "use-property-test";
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
      html`<use-property-test></use-property-test>`
    );

    let span = el.shadowRoot?.firstElementChild;
    expect(span?.textContent).to.equal("8");

    setter((value) => value * 2);

    await nextFrame();
    expect(span?.textContent).to.equal("16");
  });

  it("can override the initial value", async () => {
    const tag = "use-property-initial-override";
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
      html`<use-property-initial-override
        .age=${20}
      ></use-property-initial-override>`
    );

    let span = el.shadowRoot?.firstElementChild;
    expect(span?.textContent).to.equal("20");
  });

  it("notifies when the state is changed", async () => {
    const tag = "use-property-notify-change";
    const spy = Sinon.spy();
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    await fixture<HTMLElement>(
      html`<use-property-notify-change
        @age-changed=${spy}
      ></use-property-notify-change>`
    );

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWithMatch({
      detail: { value: 8 },
    });

    setter(20);
    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWithMatch({
      detail: { value: 20 },
    });

    // does not notify if the same value is already set
    setter(20);
    expect(spy).to.have.been.calledTwice;
  });

  it("does not notify when the initial value is undefined", async () => {
    const tag = "use-property-initial-undefined";
    const spy = Sinon.spy();
    let setter;

    function App() {
      let [age, setAge] = useProperty<number | undefined>("age");
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
      html`<use-property-initial-undefined
        @age-changed=${spy}
      ></use-property-initial-undefined>`
    );

    expect(spy).to.not.have.been.called;

    setter(20);
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWithMatch({
      detail: { value: 20 },
    });
  });

  it("can prevent the internal state change", async () => {
    const tag = "use-property-suppress-change";
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    const el = await fixture<HTMLElement>(
        html`<use-property-suppress-change
          .age=${2}
          @age-changed=${(ev) => ev.preventDefault()}
        ></use-property-suppress-change>`
      ),
      span = el.shadowRoot?.firstElementChild;

    setter(20);

    await nextFrame();
    expect(span?.textContent).to.equal("2");
  });

  it("allows the parent component to lift the state", async () => {
    let parentSetter, childSetter;

    function Parent() {
      let [age, setAge] = useState(20);
      parentSetter = setAge;
      return html`<use-property-total-control-child
        .age=${age}
        @age-changed=${lift((v: number) => setAge(v * 2))}
      ></use-property-total-control-child>`;
    }

    function Child() {
      let [age, setAge] = useProperty("age", 2);
      childSetter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define("use-property-total-control", component(Parent));
    customElements.define("use-property-total-control-child", component(Child));

    const el = await fixture<HTMLElement>(
        html`<use-property-total-control></use-property-total-control>`
      ),
      child = el.shadowRoot?.firstElementChild,
      span = child?.shadowRoot?.firstElementChild;

    expect(child?.age).to.equal(20);
    expect(span?.textContent).to.equal("20");

    parentSetter(30);
    await nextFrame();
    expect(span?.textContent).to.equal("30");

    childSetter(3);
    await nextFrame();
    expect(span?.textContent).to.equal("6");
  });

  it("is compatible with polymer double binding", async () => {
    const parentTag = "use-property-polymer";
    const childTag = "use-property-polymer-child";
    let childSetter;

    class ParentElement extends PolymerElement {
      static get properties() {
        return { age: String };
      }
      static get template() {
        return polymerHtml`
          <span>[[age]]</span>
          <use-property-polymer-child age={{age}}></use-property-polymer-child>
        `;
      }
    }

    customElements.define(parentTag, ParentElement);

    function Child() {
      let [age, setAge] = useProperty("age", 2);
      childSetter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(childTag, component(Child));

    const el = await fixture<HTMLElement>(
        html`<use-property-polymer></use-property-polymer>`
      ),
      parentSpan = el.shadowRoot?.firstElementChild,
      child = parentSpan?.nextElementSibling,
      childSpan = child?.shadowRoot?.firstElementChild;

    expect(parentSpan?.textContent).to.equal("2");
    expect(childSpan?.textContent).to.equal("2");

    el.set("age", 30);
    await nextFrame();
    expect(parentSpan?.textContent).to.equal("30");
    expect(childSpan?.textContent).to.equal("30");

    childSetter(3);
    await nextFrame();
    expect(parentSpan?.textContent).to.equal("3");
    expect(childSpan?.textContent).to.equal("3");
  });

  it("cannot be used in virtual components", async () => {
    const spy = Sinon.spy();
    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      spy();
      return html`<span>${age}</span>`;
    }

    const vApp = virtual(App);
    const el = document.createElement("div");
    render(vApp(), el);
    expect(spy).to.not.have.been.calledOnce;
  });

  describe("reflect option", () => {
    it("reflects boolean property to attribute", async () => {
      const tag = "use-property-reflect-bool";
      let setter: (v: any) => void;

      function App() {
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-bool></use-property-reflect-bool>`
      );

      // Initial value false — attribute should not be present
      expect(el.hasAttribute("opened")).to.be.false;

      setter!(true);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.true;
      expect(el.getAttribute("opened")).to.equal("");

      setter!(false);
      await nextFrame();
      expect(el.hasAttribute("opened")).to.be.false;
    });

    it("reflects string property to attribute", async () => {
      const tag = "use-property-reflect-str";
      let setter: (v: any) => void;

      function App() {
        let [name, setName] = useProperty<string>("name", "", {
          reflect: true,
        });
        setter = setName;
        return html`<span>${name}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["name"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-str></use-property-reflect-str>`
      );

      setter!("hello");
      await nextFrame();
      expect(el.getAttribute("name")).to.equal("hello");

      setter!("world");
      await nextFrame();
      expect(el.getAttribute("name")).to.equal("world");
    });

    it("does not cause feedback loop", async () => {
      const tag = "use-property-reflect-no-loop";
      let renderCount = 0;
      let setter: (v: any) => void;

      function App() {
        renderCount++;
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      await fixture<HTMLElement>(
        html`<use-property-reflect-no-loop></use-property-reflect-no-loop>`
      );

      const countBefore = renderCount;
      setter!(true);
      await nextFrame();
      // Should only render once more after the setter, not loop
      expect(renderCount).to.equal(countBefore + 1);
    });

    it("syncs attribute change to property", async () => {
      const tag = "use-property-reflect-attr-to-prop";
      let setter: (v: any) => void;

      function App() {
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-attr-to-prop></use-property-reflect-attr-to-prop>`
      );

      const span = el.shadowRoot?.firstElementChild;
      expect(span?.textContent).to.equal("false");

      // Set attribute externally — should sync to property
      el.setAttribute("opened", "");
      await nextFrame();
      expect(span?.textContent).to.equal("true");
      expect((el as any).opened).to.be.true;
    });

    it("syncs attribute removal to property as false", async () => {
      const tag = "use-property-reflect-attr-remove";
      let setter: (v: any) => void;

      function App() {
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-attr-remove></use-property-reflect-attr-remove>`
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
      const tag = "use-property-reflect-initial-attr";

      function App() {
        let [opened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-initial-attr opened></use-property-reflect-initial-attr>`
      );

      expect((el as any).opened).to.be.true;
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("true");
    });

    it("does not reflect when event is prevented", async () => {
      const tag = "use-property-reflect-prevent";
      let setter: (v: any) => void;

      function App() {
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        setter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(
        tag,
        component(App, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-prevent
          @opened-changed=${(ev: Event) => ev.preventDefault()}
        ></use-property-reflect-prevent>`
      );

      setter!(true);
      await nextFrame();
      // Event was prevented — property and attribute should NOT update
      expect((el as any).opened).to.not.be.true;
      expect(el.hasAttribute("opened")).to.be.false;
    });

    it("is backward compatible without reflect option", async () => {
      const tag = "use-property-reflect-compat";
      let setter: (v: any) => void;

      function App() {
        let [age, setAge] = useProperty("age", 5);
        setter = setAge;
        return html`<span>${age}</span>`;
      }

      customElements.define(tag, component(App));

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-compat></use-property-reflect-compat>`
      );

      // Without reflect, no attribute should be set
      expect(el.hasAttribute("age")).to.be.false;

      setter!(10);
      await nextFrame();
      expect(el.shadowRoot?.firstElementChild?.textContent).to.equal("10");
      expect(el.hasAttribute("age")).to.be.false;
    });

    it("works with lift", async () => {
      const tag = "use-property-reflect-lift-parent";
      const childTag = "use-property-reflect-lift-child";
      let parentSetter: (v: any) => void;
      let childSetter: (v: any) => void;

      function Parent() {
        let [opened, setOpened] = useState(false);
        parentSetter = setOpened;
        return html`<use-property-reflect-lift-child
          .opened=${opened}
          @opened-changed=${lift((v: boolean) => setOpened(v))}
        ></use-property-reflect-lift-child>`;
      }

      function Child() {
        let [opened, setOpened] = useProperty<boolean>("opened", false, {
          reflect: true,
        });
        childSetter = setOpened;
        return html`<span>${opened}</span>`;
      }

      customElements.define(tag, component(Parent));
      customElements.define(
        childTag,
        component(Child, { observedAttributes: ["opened"] })
      );

      const el = await fixture<HTMLElement>(
        html`<use-property-reflect-lift-parent></use-property-reflect-lift-parent>`
      );

      const child = el.shadowRoot?.firstElementChild as any;
      expect(child?.opened).to.be.false;

      // Parent sets opened
      parentSetter!(true);
      await nextFrame();
      expect(child?.opened).to.be.true;
      expect(child?.hasAttribute("opened")).to.be.true;

      // Child requests change — parent lifts it
      childSetter!(false);
      await nextFrame();
      expect(child?.opened).to.be.false;
      expect(child?.hasAttribute("opened")).to.be.false;
    });
  });
});
