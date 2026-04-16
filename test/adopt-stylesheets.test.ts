import { component, html } from "../src/haunted.js";
import { fixture, expect, aTimeout } from "@open-wc/testing";

const createIframe = async () => {
	const iframe = document.createElement("iframe");
	iframe.src = "about:blank";
	document.body.appendChild(iframe);
	await aTimeout(100);
	return iframe;
};

describe("adoptStyleSheets", () => {
	describe("same document", () => {
		it("applies string styleSheets", async () => {
			const tag = "same-doc-string-sheets";
			const style = "div { color: rgb(255, 0, 0); }";

			customElements.define(
				tag,
				component(() => html`<div class="styled">test</div>`, {
					styleSheets: [style],
				})
			);

			const el = await fixture(
				html`<same-doc-string-sheets></same-doc-string-sheets>`
			);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(getComputedStyle(styled).color).to.equal("rgb(255, 0, 0)");
		});

		it("applies CSSStyleSheet objects", async () => {
			const tag = "same-doc-css-stylesheet";
			const cs = new CSSStyleSheet();
			cs.replaceSync("div { color: rgb(0, 128, 0); }");

			customElements.define(
				tag,
				component(() => html`<div class="styled">test</div>`, {
					styleSheets: [cs],
				})
			);

			const el = await fixture(
				html`<same-doc-css-stylesheet></same-doc-css-stylesheet>`
			);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(getComputedStyle(styled).color).to.equal("rgb(0, 128, 0)");
		});
	});

	describe("cross-document context", () => {
		let iframe: HTMLIFrameElement;
		let iframeDoc: Document;
		let iframeWin: Window;

		before(async () => {
			iframe = await createIframe();
			iframeDoc = iframe.contentDocument!;
			iframeWin = iframe.contentWindow!;
		});

		after(() => {
			document.body.removeChild(iframe);
		});

		it("applies string styleSheets", async () => {
			const tag = "cross-doc-string-sheets";
			const style = "div { color: rgb(255, 0, 0); }";

			customElements.define(
				tag,
				component(() => html`<div class="styled">test</div>`, {
					styleSheets: [style],
				})
			);

			const el = document.createElement(tag);
			iframeDoc.body.appendChild(el);
			await aTimeout(100);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(iframeWin.getComputedStyle(styled).color).to.equal(
				"rgb(255, 0, 0)"
			);
		});

		it("applies CSSStyleSheet objects", async () => {
			const tag = "cross-doc-css-stylesheet";
			const cs = new CSSStyleSheet();
			cs.replaceSync("div { color: rgb(0, 128, 0); }");

			customElements.define(
				tag,
				component(() => html`<div class="styled">test</div>`, {
					styleSheets: [cs],
				})
			);

			const el = document.createElement(tag);
			iframeDoc.body.appendChild(el);
			await aTimeout(100);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(iframeWin.getComputedStyle(styled).color).to.equal(
				"rgb(0, 128, 0)"
			);
		});

		it("applies renderer.styleSheets", async () => {
			const tag = "cross-doc-renderer-sheets";
			const style = "div { color: rgb(0, 0, 255); }";

			function Renderer(this: any) {
				return html`<div class="styled">test</div>`;
			}
			Renderer.styleSheets = [style];

			customElements.define(tag, component(Renderer as any));

			const el = document.createElement(tag);
			iframeDoc.body.appendChild(el);
			await aTimeout(100);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(iframeWin.getComputedStyle(styled).color).to.equal(
				"rgb(0, 0, 255)"
			);
		});

		it("applies multiple mixed styleSheets", async () => {
			const tag = "cross-doc-mixed-sheets";
			const cs = new CSSStyleSheet();
			cs.replaceSync("div { color: rgb(255, 0, 0); }");
			const stringStyle = "div { background-color: rgb(0, 128, 0); }";

			customElements.define(
				tag,
				component(() => html`<div class="styled">test</div>`, {
					styleSheets: [cs, stringStyle],
				})
			);

			const el = document.createElement(tag);
			iframeDoc.body.appendChild(el);
			await aTimeout(100);

			const styled = el.shadowRoot!.querySelector(
				".styled"
			) as HTMLDivElement;
			expect(iframeWin.getComputedStyle(styled).color).to.equal(
				"rgb(255, 0, 0)"
			);
			expect(iframeWin.getComputedStyle(styled).backgroundColor).to.equal(
				"rgb(0, 128, 0)"
			);
		});
	});
});