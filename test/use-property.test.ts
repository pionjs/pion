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
      detail: { value: 8, updater: undefined },
    });

    setter(20);
    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWithMatch({
      detail: { value: 20, updater: undefined },
    });

    // always notifies, even if the same value is already set
    setter(20);
    expect(spy).to.have.been.calledThrice;
    expect(spy).to.have.been.calledWithMatch({
      detail: { value: 20, updater: undefined },
    });
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

  it("event detail contains updater for functional calls", async () => {
    const tag = "use-property-event-detail-updater";
    const spy = Sinon.spy();
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    await fixture<HTMLElement>(
      html`<use-property-event-detail-updater
        @age-changed=${spy}
      ></use-property-event-detail-updater>`
    );

    setter((value) => value + 1);

    expect(spy).to.have.been.calledTwice;
    expect(spy.secondCall).to.have.been.calledWithMatch({
      detail: { value: 9, updater: Sinon.match.func },
    });
  });

  it("event detail contains value for direct calls", async () => {
    const tag = "use-property-event-detail-value";
    const spy = Sinon.spy();
    let setter;

    function App() {
      let [age, setAge] = useProperty("age", () => 8);
      setter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(tag, component(App));

    await fixture<HTMLElement>(
      html`<use-property-event-detail-value
        @age-changed=${spy}
      ></use-property-event-detail-value>`
    );

    setter(20);

    expect(spy).to.have.been.calledTwice;
    expect(spy.secondCall).to.have.been.calledWithMatch({
      detail: { value: 20, updater: undefined },
    });
  });

  it("lift bubbles functional updater to parent", async () => {
    let childSetter;

    function Parent() {
      let [count, setCount] = useState(0);
      return html`<use-property-lift-updater-child
        .count=${count}
        @count-changed=${lift(setCount)}
      ></use-property-lift-updater-child>`;
    }

    function Child() {
      let [count, setCount] = useProperty("count", 0);
      childSetter = setCount;
      return html`<span>${count}</span>`;
    }

    customElements.define(
      "use-property-lift-updater-parent",
      component(Parent)
    );
    customElements.define(
      "use-property-lift-updater-child",
      component(Child)
    );

    const el = await fixture<HTMLElement>(
      html`<use-property-lift-updater-parent></use-property-lift-updater-parent>`
    );
    const child = el.shadowRoot?.firstElementChild as HTMLElement;
    const span = child?.shadowRoot?.firstElementChild;

    expect(span?.textContent).to.equal("0");

    childSetter((c) => c + 1);
    await nextFrame();
    expect(span?.textContent).to.equal("1");

    childSetter((c) => c + 1);
    await nextFrame();
    expect(span?.textContent).to.equal("2");
  });

  it("rapid-fire functional updaters with lift accumulate correctly", async () => {
    let childSetter;

    function Parent() {
      let [items, setItems] = useState<string[]>([]);
      return html`<use-property-rapid-fire-child
        .items=${items}
        @items-changed=${lift(setItems)}
      ></use-property-rapid-fire-child>`;
    }

    function Child() {
      let [items, setItems] = useProperty<string[]>("items", () => []);
      childSetter = setItems;
      return html`<span>${items.join(",")}</span>`;
    }

    customElements.define(
      "use-property-rapid-fire-parent",
      component(Parent)
    );
    customElements.define(
      "use-property-rapid-fire-child",
      component(Child)
    );

    const el = await fixture<HTMLElement>(
      html`<use-property-rapid-fire-parent></use-property-rapid-fire-parent>`
    );
    const child = el.shadowRoot?.firstElementChild as HTMLElement;
    const span = child?.shadowRoot?.firstElementChild;

    expect(span?.textContent).to.equal("");

    childSetter((items) => [...items, "a"]);
    childSetter((items) => [...items, "b"]);
    childSetter((items) => [...items, "c"]);

    await nextFrame();
    expect(span?.textContent).to.equal("a,b,c");
  });

  it("initializes default value even when lift prevents default", async () => {
    let parentSetter;

    function Parent() {
      let [items, setItems] = useState<string[] | undefined>(undefined);
      parentSetter = setItems;
      return html`<use-property-lift-no-prop-child
        @items-changed=${lift(setItems)}
      ></use-property-lift-no-prop-child>`;
    }

    function Child() {
      let [items, setItems] = useProperty<string[]>("items", () => []);
      return html`<span>${(items ?? []).length}</span>`;
    }

    customElements.define(
      "use-property-lift-no-prop-parent",
      component(Parent)
    );
    customElements.define(
      "use-property-lift-no-prop-child",
      component(Child)
    );

    const el = await fixture<HTMLElement>(
      html`<use-property-lift-no-prop-parent></use-property-lift-no-prop-parent>`
    );
    const child = el.shadowRoot?.firstElementChild as HTMLElement;
    const span = child?.shadowRoot?.firstElementChild;

    expect(child?.items).to.deep.equal([]);
    expect(span?.textContent).to.equal("0");
  });

  it("lift with direct value still works", async () => {
    let childSetter;

    function Parent() {
      let [age, setAge] = useState(20);
      return html`<use-property-lift-direct-child
        .age=${age}
        @age-changed=${lift(setAge)}
      ></use-property-lift-direct-child>`;
    }

    function Child() {
      let [age, setAge] = useProperty("age", 2);
      childSetter = setAge;
      return html`<span>${age}</span>`;
    }

    customElements.define(
      "use-property-lift-direct-parent",
      component(Parent)
    );
    customElements.define(
      "use-property-lift-direct-child",
      component(Child)
    );

    const el = await fixture<HTMLElement>(
      html`<use-property-lift-direct-parent></use-property-lift-direct-parent>`
    );
    const child = el.shadowRoot?.firstElementChild as HTMLElement;
    const span = child?.shadowRoot?.firstElementChild;

    expect(span?.textContent).to.equal("20");

    childSetter(30);
    await nextFrame();
    expect(span?.textContent).to.equal("30");
  });
});
