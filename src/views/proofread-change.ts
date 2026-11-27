import html from "./proofread-change.html";
import { htmlTemplate, sprout } from "rampike";

export type ProofreadChangeState = "pending" | "accepted" | "rejected";

export type ProofreadChangeContent = {
	prefix: string,
	before: string,
	after: string,
	suffix: string
};

export type ProofreadChangeHandlers = {
	/** puts `text` in place of the original; false when that failed and the change stays pending */
	accept: (text: string) => boolean,
	/** puts the original back; false when that failed and the change stays accepted */
	undo: () => boolean,
	/** selects the fragment in the editor's field: the original, or the fix once accepted */
	show: () => void
};

const template = htmlTemplate(html);
const REFS = {
	prefix: HTMLElement,
	before: HTMLElement,
	after:  HTMLElement,
	suffix: HTMLElement,
	accept: HTMLButtonElement,
	reject: HTMLButtonElement,
	edit:   HTMLButtonElement,
	undo:   HTMLButtonElement,
	show:   HTMLButtonElement,
	status: HTMLElement
};

/** One change suggested by the proofreader: the original struck out, the fix next to it, in a bit of context */
export function makeProofreadChangeView(content: ProofreadChangeContent, handlers: ProofreadChangeHandlers) {
	const { root: element, refs: r } = sprout(template, REFS);
	const root = element as HTMLElement;

	let state: ProofreadChangeState = "pending";
	let editing = false;
	/** what goes in place of the original: the suggestion, or the user's edit of it */
	let replacement = content.after;

	r.prefix.textContent = content.prefix;
	r.suffix.textContent = content.suffix;
	showText(r.before, content.before);
	showText(r.after, replacement);

	const update = () => {
		root.dataset.state = state;
		r.accept.hidden = state !== "pending";
		r.reject.hidden = state !== "pending" || editing;
		r.edit.hidden   = state !== "pending";
		r.undo.hidden   = state === "pending";
		r.edit.textContent = editing ? "cancel" : "edit";
		r.status.textContent =
			state === "accepted" ? (replacement === content.after ? "accepted" : "accepted with your edit") :
			state === "rejected" ? "rejected" :
			"";
	};
	const stopEditing = () => {
		editing = false;
		r.after.removeAttribute("contenteditable");
	};

	const accept = () => {
		if (state !== "pending") return;
		const text = editing ? r.after.textContent ?? "" : replacement;
		if (!handlers.accept(text)) return;
		replacement = text;
		stopEditing();
		showText(r.after, replacement);
		state = "accepted";
		update();
	};
	const reject = () => {
		if (state !== "pending" || editing) return;
		state = "rejected";
		update();
	};

	r.accept.addEventListener("click", accept);
	r.reject.addEventListener("click", reject);
	r.edit.addEventListener("click", () => {
		if (editing) {
			stopEditing();
			showText(r.after, replacement);
		} else {
			editing = true;
			r.after.textContent = replacement;
			r.after.classList.remove("proofread-ws");
			r.after.setAttribute("contenteditable", "plaintext-only");
			r.after.focus();
		}
		update();
	});
	r.show.addEventListener("click", handlers.show);
	r.undo.addEventListener("click", () => {
		if (state === "accepted" && !handlers.undo()) return;
		state = "pending";
		update();
	});
	update();

	return {
		root,
		state: () => state,
		accept,
		reject
	};
}

/** whitespace-only fragments (a removed line break, a missing space) get visible symbols */
function showText(target: HTMLElement, text: string) {
	const blank = text.trim() === "";
	target.classList.toggle("proofread-ws", blank);
	target.textContent = blank
		? text.replace(/\n/g, "↵").replace(/\t/g, "→").replace(/ /g, "·")
		: text;
}
