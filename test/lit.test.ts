import { chaiDomDiff } from "@open-wc/semantic-dom-diff";
import { chai, expect, fixture, nextFrame } from "@open-wc/testing";
import { nothing } from "lit-html";
import { AsyncDirective } from "lit-html/async-directive.js";
import { directive } from "lit-html/directive.js";
import { cache } from "lit-html/directives/cache.js";
import { spy } from "sinon";
import { component, html } from "../src/lit-haunted";

chai.use(chaiDomDiff);

describe("lit integration", () => {
  describe("component", () => {
    it("Integrates with the lit cleanup mechanism", async () => {
      const disconnectedSpy = spy(),
        reconnectedSpy = spy();

      const myDirective = directive(
        class extends AsyncDirective {
          render() {
            return "test";
          }

          protected disconnected(): void {
            disconnectedSpy();
          }

          protected reconnected(): void {
            reconnectedSpy();
          }
        }
      );

      customElements.define(
        "component-with-directive",
        component(() => myDirective())
      );

      type App = Element & { show: boolean };

      function App({ show = true }: App) {
        return html`
          <p>
            Result:
            ${show
              ? html`<component-with-directive></component-with-directive>`
              : nothing}
          </p>
          <p>
            Cached result:
            ${cache(
              show
                ? html`<component-with-directive></component-with-directive>`
                : nothing
            )}
          </p>
        `;
      }

      customElements.define("lit-integration-cleanup", component(App));

      const el = await fixture<App>(
        html`<lit-integration-cleanup></lit-integration-cleanup>`
      );

      expect(el).shadowDom.to.equal(
        `<p>
          Result:
          <component-with-directive> </component-with-directive>
        </p>
        <p>
          Cached result:
          <component-with-directive> </component-with-directive>
        </p> `
      );

      // trigger directive disconnect
      el.show = false;
      await nextFrame();

      expect(el).shadowDom.to.equal(
        `<p>
          Result:
        </p>
        <p>
          Cached result:
        </p> `
      );
      expect(disconnectedSpy).to.have.been.calledTwice;
      expect(reconnectedSpy).to.not.have.been.called;

      // trigger directive reconnect
      el.show = true;
      await nextFrame();

      expect(el).shadowDom.to.equal(
        `<p>
          Result:
          <component-with-directive> </component-with-directive>
        </p>
        <p>
          Cached result:
          <component-with-directive> </component-with-directive>
        </p> `
      );
      expect(disconnectedSpy).to.have.been.calledTwice;
      expect(reconnectedSpy).to.have.been.calledOnce;
    });
  });
});
