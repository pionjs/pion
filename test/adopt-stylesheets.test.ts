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
	it("applies string styleSheets in same document", async () => {
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

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(1);
		expect(sheets[0]).to.be.instanceOf(CSSStyleSheet);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(getComputedStyle(styled).color).to.equal("rgb(255, 0, 0)");
	});

	it("applies CSSStyleSheet objects in same document", async () => {
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

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(1);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(getComputedStyle(styled).color).to.equal("rgb(0, 128, 0)");
	});

	it("re-creates string styleSheets in cross-document context", async () => {
		const iframe = await createIframe();
		const { contentDocument: iframeDoc, contentWindow: iframeWin } = iframe;

		const tag = "cross-doc-string-sheets";
		const style = "div { color: rgb(255, 0, 0); }";

		customElements.define(
			tag,
			component(() => html`<div class="styled">test</div>`, {
				styleSheets: [style],
			})
		);

		const el = document.createElement(tag);
		iframeDoc!.body.appendChild(el);
		await aTimeout(100);

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(1);
		expect(sheets[0].constructor).to.equal(iframeWin!.CSSStyleSheet);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(iframeWin!.getComputedStyle(styled).color).to.equal(
			"rgb(255, 0, 0)"
		);

		document.body.removeChild(iframe);
	});

	it("re-creates CSSStyleSheet objects in cross-document context", async () => {
		const iframe = await createIframe();
		const { contentDocument: iframeDoc, contentWindow: iframeWin } = iframe;

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
		iframeDoc!.body.appendChild(el);
		await aTimeout(100);

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(1);
		expect(sheets[0].constructor).to.equal(iframeWin!.CSSStyleSheet);
		expect(sheets[0]).to.not.equal(cs);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(iframeWin!.getComputedStyle(styled).color).to.equal(
			"rgb(0, 128, 0)"
		);

		document.body.removeChild(iframe);
	});

	it("re-creates renderer.styleSheets in cross-document context", async () => {
		const iframe = await createIframe();
		const { contentDocument: iframeDoc, contentWindow: iframeWin } = iframe;

		const tag = "cross-doc-renderer-sheets";
		const style = "div { color: rgb(0, 0, 255); }";

		function Renderer(this: any) {
			return html`<div class="styled">test</div>`;
		}
		Renderer.styleSheets = [style];

		customElements.define(tag, component(Renderer as any));

		const el = document.createElement(tag);
		iframeDoc!.body.appendChild(el);
		await aTimeout(100);

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(1);
		expect(sheets[0].constructor).to.equal(iframeWin!.CSSStyleSheet);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(iframeWin!.getComputedStyle(styled).color).to.equal(
			"rgb(0, 0, 255)"
		);

		document.body.removeChild(iframe);
	});

	it("re-creates multiple mixed styleSheets in cross-document context", async () => {
		const iframe = await createIframe();
		const { contentDocument: iframeDoc, contentWindow: iframeWin } = iframe;

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
		iframeDoc!.body.appendChild(el);
		await aTimeout(100);

		const sheets = el.shadowRoot!.adoptedStyleSheets;
		expect(sheets.length).to.equal(2);
		expect(sheets[0].constructor).to.equal(iframeWin!.CSSStyleSheet);
		expect(sheets[1].constructor).to.equal(iframeWin!.CSSStyleSheet);

		const styled = el.shadowRoot!.querySelector(".styled") as HTMLDivElement;
		expect(iframeWin!.getComputedStyle(styled).color).to.equal(
			"rgb(255, 0, 0)"
		);
		expect(iframeWin!.getComputedStyle(styled).backgroundColor).to.equal(
			"rgb(0, 128, 0)"
		);

		document.body.removeChild(iframe);
	});
});