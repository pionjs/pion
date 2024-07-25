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
});
