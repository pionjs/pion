import { component, html, useEffect, useState } from "../src/haunted.js";
import { fixture, fixtureCleanup, expect, nextFrame } from "@open-wc/testing";

describe("useEffect", () => {
  it("Memoizes values", async () => {
    const tag = "memo-effect-test";
    let effects = 0;
    let set;

    function App() {
      let [, setVal] = useState(0);
      set = setVal;

      useEffect(() => {
        effects++;
      }, [1]);

      return html`Test`;
    }
    customElements.define(tag, component(App));

    await fixture(html`<memo-effect-test></memo-effect-test>`);

    set(2);
    await nextFrame();

    expect(effects).to.equal(1);
  });

  it("Can teardown subscriptions", async () => {
    const tag = "teardown-effect-test";
    let subs = [];
    let set;

    function app() {
      let [val, setVal] = useState(0);
      set = setVal;

      useEffect(() => {
        subs.push(val);
        return () => {
          subs.splice(subs.indexOf(val), 1);
        };
      });

      return html`Test`;
    }
    customElements.define(tag, component(app));

    await fixture(html`<teardown-effect-test></teardown-effect-test>`);
    await nextFrame();

    set(1);
    await nextFrame();

    set(2);
    await nextFrame();

    expect(subs.length).to.equal(1);
  });

  it("Tears-down on unmount", async () => {
    const tag = "teardown-effect-unmount-test";
    let subs = [];

    function app() {
      let val = Math.random();

      useEffect(() => {
        subs.push(val);
        return () => {
          subs.splice(subs.indexOf(val), 1);
        };
      });

      return html`Test`;
    }

    customElements.define(tag, component(app));

    await fixture(
      html`<teardown-effect-unmount-test></teardown-effect-unmount-test>`
    );
    fixtureCleanup();

    expect(subs.length).to.equal(0);
  });

  it("Runs on reattach", async () => {
    let setups = 0,
      teardowns = 0;

    function app() {
      useEffect(() => {
        setups++;
        return () => {
          teardowns++;
        };
      }, []);

      return html`Test`;
    }

    customElements.define("teardown-effect-reattach-test", component(app));

    const el = await fixture(
      html`<teardown-effect-reattach-test></teardown-effect-reattach-test>`
    );

    const parent = el.parentNode;
    el.remove();
    parent?.append(el);

    await nextFrame();

    expect(setups).to.equal(2, "the effect was set up twice");
    expect(teardowns).to.equal(1, "the effect was cleaned up once");
  });

  it("Pauses rendering when disconnected", async () => {
    let renders = 0,
      _setState;

    function app({ prop }) {
      renders++;

      const [state, setState] = useState("abc");
      _setState = setState;

      return [prop, " ", state];
    }

    customElements.define(
      "pause-rendering-when-disconnected-test",
      component(app)
    );

    const el = (await fixture(
      html`<pause-rendering-when-disconnected-test
        .prop=${1}
      ></pause-rendering-when-disconnected-test>`
    )) as Element & { prop: number };

    expect(el.shadowRoot!.textContent).to.equal("1 abc");

    const parent = el.parentNode;
    el.remove();
    el.prop = 2;
    _setState("omg");
    await nextFrame();

    parent?.append(el);

    await nextFrame();

    expect(el.shadowRoot!.textContent).to.equal(
      "2 omg",
      "it rendered the with most recent state and props"
    );
    expect(renders).to.equal(2, "it did not render while disconnected");
  });

  it("Does not run effects when disconnected", async () => {
    let setups = 0,
      teardowns = 0;

    function app({ prop }) {
      useEffect(() => {
        setups++;
        return () => {
          teardowns++;
        };
      }, []);

      return html`Test ${prop}`;
    }

    customElements.define("disconnected-effects-test", component(app));

    const el = (await fixture(
      html`<disconnected-effects-test .prop=${0}></disconnected-effects-test>`
    )) as Element & { prop: number };

    expect(setups).to.equal(1, "the effect was set up when connected");
    expect(teardowns).to.equal(0, "the effect was not torn down");

    const parent = el.parentNode;
    el.remove();

    expect(setups).to.equal(1, "the effect was not set up again");
    expect(teardowns).to.equal(1, "the effect was torn down");

    el.prop = 1;
    await nextFrame();

    expect(setups).to.equal(1, "the effect was not set up while disconnected");
    expect(teardowns).to.equal(1, "the teardown was not called again");

    parent?.append(el);

    await nextFrame();

    expect(el.shadowRoot!.textContent).to.equal("Test 1");
    expect(setups).to.equal(2, "the effect was set up again when reconnected");
    expect(teardowns).to.equal(1, "the effect was not torn down");
  });

  it("useEffect(fn, []) runs the effect only once", async () => {
    const tag = "empty-array-effect-test";
    let calls = 0;

    function App() {
      useEffect(() => {
        calls++;
      }, []);
    }

    customElements.define(tag, component(App));
    await fixture(html`<empty-array-effect-test></empty-array-effect-test>`);

    await nextFrame();
    expect(calls).to.equal(1);

    (document.querySelector(tag) as any).prop = "foo";
    await nextFrame();
    expect(calls).to.equal(1);
  });

  it("Can be async functions", async () => {
    const tag = "effect-async-fn";

    function App() {
      useEffect(async () => {});
    }

    customElements.define(tag, component(App));

    try {
      const el = await fixture(html`<effect-async-fn></effect-async-fn>`);
      expect(el).to.be.ok;
      fixtureCleanup();
      expect(true).to.be.ok;
    } catch (error) {
      // This does not catch errors the way we want it to. We will get a false
      // positive with a warning that an error happened in a Promise outside the
      // test. Throwing an error in the places that test this, however, causes
      // other tests to fail.
      expect(error).to.be.null;
    }
  });

  it("Does not skip effects when another update is queued during commit phase", async () => {
    const parentTag = "skipped-effect-test-parent";
    const childTag = "skipped-effect-test-child";
    let parentEffects = 0;
    let childEffects = 0;
    let parentSet;
    let childSet;

    function Parent() {
      const [state, setState] = useState();
      parentSet = setState;

      useEffect(() => {
        parentEffects++;
      }, [state]);

      return html`<skipped-effect-test-child
        .prop=${state}
      ></skipped-effect-test-child>`;
    }

    interface ChildProps {
      prop: unknown;
    }

    function Child({ prop }) {
      const [state, setState] = useState();
      childSet = setState;

      useEffect(() => {
        childEffects++;
      }, [state]);

      return html`${prop} + ${state}`;
    }
    customElements.define(parentTag, component(Parent));
    customElements.define(childTag, component<HTMLElement & ChildProps>(Child));

    await fixture(
      html`<skipped-effect-test-parent></skipped-effect-test-parent>`
    );

    parentSet(1);
    childSet(1);
    await nextFrame();

    expect(parentEffects).to.equal(2);
    expect(childEffects).to.equal(2);
  });

  it("Avoids causing infinite loops when the callback schedules an update, but then throws an exception", async () => {
    function App() {
      const [state, setState] = useState(0);

      useEffect(() => {
        // an update is scheduled
        setState((state) => state! + 1);
        // an error is thrown
        throw new Error("Unexpected error");
      }, []);

      return state;
    }

    customElements.define("infinite-loop-test", component(App));

    const el = await fixture(html`<infinite-loop-test></infinite-loop-test>`);
    expect(el).to.be.ok;
    expect(el.shadowRoot!.textContent).to.equal("1");
  });
});
