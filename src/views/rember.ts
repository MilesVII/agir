import template from "./rember.html";
import { sirocco } from "rampike";
import { emit, instantiate, pickRefs, tabGroups } from "./common";

/*
One rEmber summary in the rEmber modal. Same contract as the message view:
intent leaves as `rember:*` events, the owner updates data and the view.
*/

export type RemberEvents = {
	"rember:edit":   { mid: number, text: string },
	"rember:remove": { mid: number }
};
declare global {
	interface HTMLElementEventMap {
		"rember:edit":   CustomEvent<RemberEvents["rember:edit"]>;
		"rember:remove": CustomEvent<RemberEvents["rember:remove"]>;
	}
}

const REFS = ["caption", "edit", "remove", "save", "cancel", "text"] as const;

export function makeRemberView(mid: number, contents: string = "") {
	const root = instantiate<HTMLDivElement>(template);
	const r = pickRefs(root, REFS);
	const tabs = tabGroups(root);

	root.dataset.mid = String(mid);
	root.title = String(mid);
	r.caption.textContent = `#${mid}`;
	r.text.textContent = contents;

	let editPocket = "";

	r.edit.addEventListener("click", () => {
		editPocket = r.text.textContent ?? "";
		r.text.setAttribute("contenteditable", "");
		r.text.focus();
		tabs.pick("editing");
	});
	r.save.addEventListener("click", () => {
		stopEditing();
		emit(root, "rember:edit", { mid, text: r.text.innerText });
	});
	r.cancel.addEventListener("click", () => {
		stopEditing();
		r.text.textContent = editPocket;
	});
	r.remove.addEventListener("click", () => {
		if (!confirm(`the rEmber state for message #${mid} will be removed`)) return;
		emit(root, "rember:remove", { mid });
	});

	function stopEditing() {
		r.text.removeAttribute("contenteditable");
		tabs.pick("main");
	}
	function appendChunk(chunk: string) {
		r.text.append(chunk);
	}
	function setContents(value: string) {
		r.text.textContent = value;
		tabs.pick("main");
	}
	function hideControls() {
		tabs.pick("streaming");
	}

	tabs.pick("main");

	return sirocco(root, {
		mid,
		appendChunk,
		setContents,
		hideControls
	}, "controls");
}
export type RemberView = ReturnType<typeof makeRemberView>;
