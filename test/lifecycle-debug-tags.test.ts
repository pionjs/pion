import { assert, aTimeout, elementUpdated, fixture, html } from "@open-wc/testing";
import { component, useState } from "../src/haunted.js";

type Probe = HTMLElement & {
	__setValue: (v: string) => void;
	__pion_debug_id?: string;
};

const defineProbe = (tag: string) => {
	if (!customElements.get(tag)) {
		customElements.define(
			tag,
			component(function Probe(el: HTMLElement) {
				const [value, setValue] = useState("start");
				(el as unknown as Probe).__setValue = setValue;
				return html`<div>${value}</div>`;
			})
		);
	}
};

defineProbe("lifecycle-debug-count");
defineProbe("lifecycle-debug-unlisted");

const setDebugTags = (value: unknown) => {
	(window as unknown as { __pion_debug_tags?: unknown }).__pion_debug_tags =
		value;
};

describe("lifecycle-debug-tags", () => {
	// Instance ids are hardcoded below because they are deterministic: the
	// counter is global and ids are assigned in construction order, so every
	// fixture in this file consumes the next id — including fixtures that
	// never log (no-op / unlisted tests). Inserting a test shifts them all.
	const logs: string[] = [];
	let origDebug: typeof console.debug;
	let tags: unknown;

	const capture = () => {
		logs.length = 0;
		origDebug = console.debug;
		console.debug = (...args: unknown[]) => {
			logs.push(String(args[0]));
		};
	};

	const restore = () => {
		console.debug = origDebug;
		setDebugTags(tags);
	};

	before(() => {
		tags = (window as unknown as { __pion_debug_tags?: unknown })
			.__pion_debug_tags;
	});

	after(() => {
		setDebugTags(tags);
	});

	it("is a no-op when the allowlist is unset", async () => {
		setDebugTags(undefined);
		capture();
		await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await aTimeout(20);
		assert.deepEqual(logs, []);
		restore();
	});

	it("assigns a stable instance id at construction time", async () => {
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		assert.equal((el as unknown as Probe).__pion_debug_id, "000001");
	});

	it("logs connected, renders and disconnected for a listed tag", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await elementUpdated(el);
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000002] connected",
			"[pion:lifecycle-debug-count#000002] render #1",
		]);

		el.remove();
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000002] connected",
			"[pion:lifecycle-debug-count#000002] render #1",
			"[pion:lifecycle-debug-count#000002] disconnected (renders: 1)",
		]);
		restore();
	});

	it("does not log for unlisted tags", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-unlisted></lifecycle-debug-unlisted>`);
		await elementUpdated(el);
		await aTimeout(20);
		el.remove();
		assert.deepEqual(logs, []);
		restore();
	});

	it("starts logging a tag added to the set with the next render", async () => {
		const tags = new Set<string>();
		setDebugTags(tags);
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await elementUpdated(el);
		await aTimeout(20);
		assert.deepEqual(logs, []);

		tags.add("lifecycle-debug-count");
		(el as unknown as Probe).__setValue("changed");
		await elementUpdated(el);
		await aTimeout(20);
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000004] render #1",
		]);
		restore();
	});

	it("counts renders per instance across re-renders", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await elementUpdated(el);
		await aTimeout(20);

		(el as unknown as Probe).__setValue("changed");
		await elementUpdated(el);
		await aTimeout(20);
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000005] connected",
			"[pion:lifecycle-debug-count#000005] render #1",
			"[pion:lifecycle-debug-count#000005] render #2",
		]);
		restore();
	});

	it("distinguishes two instances of the same tag", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const container = await fixture<HTMLElement>(
			html`<div>
				<lifecycle-debug-count></lifecycle-debug-count>
				<lifecycle-debug-count></lifecycle-debug-count>
			</div>`
		);
		const els = Array.from(
			container.querySelectorAll<Probe>("lifecycle-debug-count")
		);
		els[0].__setValue("a");
		els[1].__setValue("b");
		await elementUpdated(els[0]);
		await elementUpdated(els[1]);
		await aTimeout(20);

		assert.equal(els[0].__pion_debug_id, "000006");
		assert.equal(els[1].__pion_debug_id, "000007");
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000006] connected",
			"[pion:lifecycle-debug-count#000007] connected",
			"[pion:lifecycle-debug-count#000006] render #1",
			"[pion:lifecycle-debug-count#000007] render #1",
			"[pion:lifecycle-debug-count#000006] render #2",
			"[pion:lifecycle-debug-count#000007] render #2",
		]);
		restore();
	});

	it("keeps the instance id and render count across reconnect", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await elementUpdated(el);
		await aTimeout(20);
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000008] connected",
			"[pion:lifecycle-debug-count#000008] render #1",
		]);

		el.remove();
		document.body.appendChild(el);
		(el as unknown as Probe).__setValue("reconnected");
		await elementUpdated(el);
		await aTimeout(20);
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000008] connected",
			"[pion:lifecycle-debug-count#000008] render #1",
			"[pion:lifecycle-debug-count#000008] disconnected (renders: 1)",
			"[pion:lifecycle-debug-count#000008] connected",
			"[pion:lifecycle-debug-count#000008] render #2",
		]);
		restore();
	});

	it("includes the render count in the disconnected detail", async () => {
		setDebugTags(new Set(["lifecycle-debug-count"]));
		capture();
		const el = await fixture<Probe>(`<lifecycle-debug-count></lifecycle-debug-count>`);
		await elementUpdated(el);
		(el as unknown as Probe).__setValue("changed");
		await elementUpdated(el);
		el.remove();
		assert.deepEqual(logs, [
			"[pion:lifecycle-debug-count#000009] connected",
			"[pion:lifecycle-debug-count#000009] render #1",
			"[pion:lifecycle-debug-count#000009] render #2",
			"[pion:lifecycle-debug-count#000009] disconnected (renders: 2)",
		]);
		restore();
	});
});