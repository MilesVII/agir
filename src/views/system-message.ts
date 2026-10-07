import html from "./system-message.html";
import { placeholder } from "@root/utils";
import { toast } from "@units/toasts";
import { htmlTemplate, sirocco, sprout } from "rampike";
import { emit, tabGroups } from "./common";

/*
A message that instructs the model rather than telling the story: an OOC note (a `system`
chat message) or a rEmber summary attached to a regular message. Shares the chat message
styling, but the text is shown verbatim since the model reads it as written. Same contract as
the message view: intent leaves as `system:*` events, the owner updates data and calls refresh().
*/

export type SystemViewEvents = {
	"system:edit":   { mid: number, rember: boolean, text: string },
	"system:delete": { mid: number, rember: boolean }
};
declare global {
	interface HTMLElementEventMap {
		"system:edit":   CustomEvent<SystemViewEvents["system:edit"]>;
		"system:delete": CustomEvent<SystemViewEvents["system:delete"]>;
	}
}

export type SystemViewOptions = {
	/** the OOC note's own id, or the id of the message a rEmber summary is attached to */
	mid: number,
	rember: boolean,
	name: string,
	icon: string | null,
	/** reads the current text from the model, so refresh() always shows what is stored */
	read: () => string,
	hidden?: boolean
};

/** `data-mid` of a rEmber view carries this suffix to tell it apart from the message it belongs to */
export const REMBER_KEY_SUFFIX = "-r";
export function systemViewKey(mid: number, rember: boolean) {
	return rember ? `${mid}${REMBER_KEY_SUFFIX}` : String(mid);
}

const template = htmlTemplate(html);
const REFS = {
	root:   HTMLDivElement,
	avatar: HTMLImageElement,
	name:   HTMLElement,
	edit:   HTMLButtonElement,
	copy:   HTMLButtonElement,
	delete: HTMLButtonElement,
	save:   HTMLButtonElement,
	cancel: HTMLButtonElement,
	text:   HTMLElement
};

export function makeSystemView(options: SystemViewOptions) {
	const { mid, rember, read } = options;
	const { refs: r } = sprout(template, REFS);
	const root = r.root;
	const tabs = tabGroups(root);

	root.dataset.mid = systemViewKey(mid, rember);
	root.classList.toggle("rember-message", rember);
	root.hidden = !!options.hidden;
	r.avatar.src = placeholder(options.icon);
	r.avatar.title = rember ? `rEmber summary for mid #${mid}` : `mid #${mid}`;
	r.name.textContent = options.name;

	let streamNode: Text | null = null;

	r.edit.addEventListener("click", () => {
		r.text.setAttribute("contenteditable", "true");
		r.text.textContent = read();
		r.text.focus();
		tabs.pick("editing");
	});
	r.save.addEventListener("click", () => {
		const text = r.text.innerText;
		stopEditing();
		emit(root, "system:edit", { mid, rember, text });
	});
	r.cancel.addEventListener("click", () => {
		stopEditing();
		refresh();
	});
	r.copy.addEventListener("click", async () => {
		await navigator.clipboard.writeText(read());
		toast("copied to clipboard", { timeoutMS: 3200 });
	});
	r.delete.addEventListener("click", () => emit(root, "system:delete", { mid, rember }));

	function stopEditing() {
		r.text.removeAttribute("contenteditable");
		tabs.pick("main");
	}
	function refresh() {
		streamNode = null;
		r.text.textContent = read();
	}
	function startStreaming() {
		r.text.removeAttribute("contenteditable");
		r.text.textContent = "";
		streamNode = document.createTextNode("");
		r.text.append(streamNode);
		tabs.pick("streaming"); // no such group: hides all controls
	}
	function appendChunk(chunk: string) {
		if (!streamNode) startStreaming();
		streamNode!.appendData(chunk);
	}
	/** Call after the stored text was updated */
	function endStreaming() {
		refresh();
		tabs.pick("main");
	}
	function show() {
		root.hidden = false;
	}
	function toggle() {
		root.hidden = !root.hidden;
	}

	refresh();
	tabs.pick("main");

	return sirocco(root, {
		mid,
		rember,
		refresh,
		startStreaming,
		appendChunk,
		endStreaming,
		show,
		toggle
	}, "controls");
}
export type SystemView = ReturnType<typeof makeSystemView>;
