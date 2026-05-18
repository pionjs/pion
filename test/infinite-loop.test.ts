import { InfiniteLoopError } from "../src/errors.js";
import { BaseScheduler } from "../src/scheduler.js";
import { component, html, useEffect, useState } from "../src/haunted.js";
import { fixture, fixtureCleanup, expect, nextFrame } from "@open-wc/testing";

describe("InfiniteLoopError", () => {
  it("has correct name and is an Error", () => {
    const err = new InfiniteLoopError();
    expect(err.name).to.equal("InfiniteLoopError");
    expect(err).to.be.instanceof(Error);
  });

  it("includes component tag name when provided", () => {
    const err = new InfiniteLoopError("my-component");
    expect(err.message).to.include("<my-component>");
  });

  it("works without tag name", () => {
    const err = new InfiniteLoopError();
    expect(err.message).to.include("Infinite update loop");
    expect(err.message).to.not.include("<");
  });

  it("includes helpful message about unstable deps", () => {
    const err = new InfiniteLoopError();
    expect(err.message).to.include("dependency");
    expect(err.message).to.include("[{}]");
    expect(err.message).to.include("Promise.resolve()");
  });
});

describe("BaseScheduler update counting", () => {
  it("resets update count on resume", () => {
    class TestScheduler extends BaseScheduler<
      object,
      HTMLElement,
      () => unknown,
      HTMLElement
    > {
      result: unknown;
      commit(result: unknown): void {
        this.result = result;
      }
    }

    const host = document.createElement("div");
    const scheduler = new TestScheduler(() => "test", host);

    expect(scheduler._updateCount).to.equal(0);

    scheduler.resume();
    expect(scheduler._updateCount).to.equal(0);

    scheduler._updateCount = 50;
    scheduler.pause();
    scheduler.resume();
    expect(scheduler._updateCount).to.equal(0);
  });

  it("resets update count on teardown", () => {
    class TestScheduler extends BaseScheduler<
      object,
      HTMLElement,
      () => unknown,
      HTMLElement
    > {
      result: unknown;
      commit(result: unknown): void {
        this.result = result;
      }
    }

    const host = document.createElement("div");
    const scheduler = new TestScheduler(() => "test", host);
    scheduler.resume();

    scheduler._updateCount = 50;
    scheduler.teardown();
    expect(scheduler._updateCount).to.equal(0);
    expect(scheduler._processing).to.be.false;
  });

  it("has default maxUpdates of 100", () => {
    expect(BaseScheduler.maxUpdates).to.equal(100);
  });

  it("allows configuring maxUpdates", () => {
    const original = BaseScheduler.maxUpdates;
    BaseScheduler.maxUpdates = 50;
    expect(BaseScheduler.maxUpdates).to.equal(50);
    BaseScheduler.maxUpdates = original;
  });
});

describe("Infinite loop detection - stable components", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  it("does not interrupt stable effect deps", async () => {
    const tag = "loop-stable-deps-test";
    let effectRuns = 0;

    function App() {
      useEffect(() => {
        effectRuns++;
      }, [1, "hello"]);
      return html`stable`;
    }

    customElements.define(tag, component(App));
    const el = await fixture(
      html`<loop-stable-deps-test></loop-stable-deps-test>`
    );

    expect(el.shadowRoot!.textContent).to.equal("stable");
    expect(effectRuns).to.equal(1);
  });

  it("allows stable state updates after initial mount", async () => {
    const tag = "loop-stable-state-test";
    let renders = 0;

    function App() {
      renders++;
      const [, setCount] = useState(0);

      useEffect(() => {
        setCount(1);
      }, []);

      return html`${renders}`;
    }

    customElements.define(tag, component(App));
    const el = await fixture(
      html`<loop-stable-state-test></loop-stable-state-test>`
    );

    await nextFrame();

    expect(el.shadowRoot!.textContent).to.be.ok;
  });

  it("allows multiple state updates with stable deps", async () => {
    const tag = "loop-multi-deps-test";
    let renders = 0;

    function App() {
      const [count, setCount] = useState(0);

      useEffect(() => {
        if (count < 3) {
          setCount(count + 1);
        }
      }, [count]);

      renders++;
      return html`${count}`;
    }

    customElements.define(tag, component(App));
    const el = await fixture(
      html`<loop-multi-deps-test></loop-multi-deps-test>`
    );

    await nextFrame();
    expect(el.shadowRoot!.textContent).to.equal("3");
    expect(renders).to.be.lessThan(10);
  });
});

describe("Infinite loop detection - unstable deps", () => {
  const originalMaxUpdates = BaseScheduler.maxUpdates;

  beforeEach(() => {
    BaseScheduler.maxUpdates = 5;
  });

  afterEach(() => {
    BaseScheduler.maxUpdates = originalMaxUpdates;
    fixtureCleanup();
    document
      .querySelectorAll(
        "loop-unstable-obj-test, loop-unstable-arr-test, loop-unstable-promise-test, loop-stops-render-test, loop-broken-sibling-test, loop-stable-sibling-test"
      )
      .forEach((el) => el.remove());
  });

  function catchUnhandledRejection(timeout = 2000): Promise<InfiniteLoopError> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener("unhandledrejection", handler);
        reject(new Error(`No InfiniteLoopError caught within ${timeout}ms`));
      }, timeout);
      const handler = (e: PromiseRejectionEvent) => {
        if (e.reason instanceof InfiniteLoopError) {
          e.preventDefault();
          clearTimeout(timer);
          window.removeEventListener("unhandledrejection", handler);
          resolve(e.reason);
        }
      };
      window.addEventListener("unhandledrejection", handler);
    });
  }

  it("stops infinite loop from useEffect with unstable object dep [{}]", async () => {
    const tag = "loop-unstable-obj-test";
    const errorPromise = catchUnhandledRejection();

    function App() {
      const [, setState] = useState(0);
      useEffect(() => {
        setState((c: number) => c + 1);
      }, [{}]);
      return html`unstable-obj`;
    }

    customElements.define(tag, component(App));
    document.body.appendChild(document.createElement(tag));

    const error = await errorPromise;
    expect(error).to.be.instanceof(InfiniteLoopError);
    expect(error.message).to.include("loop-unstable-obj-test");
  });

  it("stops infinite loop from useEffect with unstable array dep [[]]", async () => {
    const tag = "loop-unstable-arr-test";
    const errorPromise = catchUnhandledRejection();

    function App() {
      const [, setState] = useState(0);
      useEffect(() => {
        setState((c: number) => c + 1);
      }, [[]]);
      return html`unstable-arr`;
    }

    customElements.define(tag, component(App));
    document.body.appendChild(document.createElement(tag));

    const error = await errorPromise;
    expect(error).to.be.instanceof(InfiniteLoopError);
  });

  it("stops infinite loop from useEffect with unstable Promise.resolve() dep", async () => {
    const tag = "loop-unstable-promise-test";
    const errorPromise = catchUnhandledRejection();

    function App() {
      const [, setState] = useState(0);
      useEffect(() => {
        setState((c: number) => c + 1);
      }, [Promise.resolve()]);
      return html`unstable-promise`;
    }

    customElements.define(tag, component(App));
    document.body.appendChild(document.createElement(tag));

    const error = await errorPromise;
    expect(error).to.be.instanceof(InfiniteLoopError);
  });

  it("component stops rendering after loop is detected", async () => {
    const tag = "loop-stops-render-test";
    const errorPromise = catchUnhandledRejection();
    let renders = 0;

    function App() {
      renders++;
      const [, setState] = useState(0);
      useEffect(() => {
        setState((c: number) => c + 1);
      }, [{}]);
      return html`${renders}`;
    }

    customElements.define(tag, component(App));
    const el = document.createElement(tag);
    document.body.appendChild(el);

    await errorPromise;
    const rendersAtDetection = renders;

    await nextFrame();
    await nextFrame();

    // No further renders after detection
    expect(renders).to.equal(rendersAtDetection);
  });

  it("does not break sibling components when one enters infinite loop", async () => {
    const brokenTag = "loop-broken-sibling-test";
    const stableTag = "loop-stable-sibling-test";
    const errorPromise = catchUnhandledRejection();

    function BrokenApp() {
      const [, setState] = useState(0);
      useEffect(() => {
        setState((c: number) => c + 1);
      }, [{}]);
      return html`broken`;
    }

    let stableRenders = 0;
    function StableApp() {
      const [count, setCount] = useState(0);
      stableRenders++;
      useEffect(() => {
        if (count === 0) setCount(1);
      }, [count]);
      return html`${count}`;
    }

    customElements.define(brokenTag, component(BrokenApp));
    customElements.define(stableTag, component(StableApp));

    // Append both synchronously — they share microtask batches
    const broken = document.createElement(brokenTag);
    const stable = document.createElement(stableTag);
    document.body.appendChild(broken);
    document.body.appendChild(stable);

    await errorPromise;
    await nextFrame();
    await nextFrame();

    // Stable component should complete its 0→1 state transition
    expect(stable.shadowRoot!.textContent).to.equal("1");
    expect(stableRenders).to.be.greaterThan(1);
  });
});
