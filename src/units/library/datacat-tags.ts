import { neatNumber } from "@root/utils";
import { mudcrack } from "rampike";
import { type DatacatTag, listTags } from "./datacat-api";

/*
A picker over Datacat's tags, shared by the blacklist tab and the main tab's tag search.
Datacat knows over a hundred thousand tags, mostly one-off custom ones, so the picker asks for them by name,
on request only: an empty query lists the most used ones.
*/

export type PickedTag = { id: number, name: string };

type TagPickerOptions = {
	/** the tags Datacat found, as chips that pick or drop them */
	found: HTMLElement,
	status: HTMLElement,
	/** the picked tags, as chips that drop them; hidden when there are none, unless `nonePicked` says so */
	picked: HTMLElement,
	nonePicked?: string,
	/** the picked chips' tooltip */
	dropHint: string,
	max: number,
	tooMany: string,
	read: () => PickedTag[],
	/** called on every pick and drop */
	write: (tags: PickedTag[]) => void
};

export type TagPicker = ReturnType<typeof makeTagPicker>;

export function makeTagPicker(o: TagPickerOptions) {
	/** the last answer, kept while the page lives so reopening the picker doesn't ask again */
	let results: { query: string, tags: DatacatTag[] } | null = null;
	let sequence = 0;
	let status = "";

	/** an empty query lists the most used tags */
	async function search(raw: string) {
		const query = raw.trim();
		const run = ++sequence;
		status = query ? "Searching Datacat's tags…" : "Asking Datacat for the most used tags…";
		render();
		const r = await listTags(query);
		if (run !== sequence) return;
		status = r.success ? "" : `Can't get the tags: ${r.error}`;
		if (r.success) results = { query, tags: r.value };
		render();
	}

	function toggle(tag: PickedTag) {
		const picked = o.read();
		const ix = picked.findIndex(t => t.id === tag.id);
		if (ix !== -1) {
			picked.splice(ix, 1);
		} else if (picked.length >= o.max) {
			status = o.tooMany;
			return render();
		} else {
			picked.push({ id: tag.id, name: tag.name });
		}
		status = "";
		o.write(picked);
		render();
	}

	function render() {
		const picked = o.read();
		const pickedIds = new Set(picked.map(t => t.id));

		o.picked.hidden = picked.length === 0 && !o.nonePicked;
		o.picked.replaceChildren(...(picked.length > 0
			? picked.map(tag => mudcrack({
				tagName: "button",
				className: "datacat-tag pointer",
				attributes: { "aria-pressed": "true", title: o.dropHint },
				contents: `${tag.name} ✕`,
				events: { click: () => toggle(tag) }
			}))
			: [mudcrack({ tagName: "div", className: "hint", contents: o.nonePicked ?? "" })]
		));

		o.found.replaceChildren(...(results?.tags ?? []).map(tag => mudcrack({
			tagName: "button",
			className: "datacat-tag pointer",
			attributes: { "aria-pressed": String(pickedIds.has(tag.id)), title: `${tag.count} characters` },
			contents: [tag.name, mudcrack({ tagName: "span", className: "hint", contents: ` ${neatNumber(tag.count)}` })],
			events: { click: () => toggle(tag) }
		})));

		o.status.textContent = status || describe();
	}

	function describe() {
		if (!results) return "";
		if (!results.query) return "The most used tags; search for the rest";
		return results.tags.length > 0 ? `Tags matching "${results.query}", most used first` : `Datacat has no tags matching "${results.query}"`;
	}

	return {
		search,
		render,
		/** whether it has asked Datacat yet */
		get searched() { return results !== null; }
	};
}
