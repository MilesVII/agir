import html from "./lorebook-item.html";
import { Lorebook } from "@root/types";
import { htmlTemplate, sprout } from "rampike";

export type LorebookItemHandlers = {
	toggle: (enabled: boolean) => void,
	remove: () => void
};

const template = htmlTemplate(html);
const REFS = {
	enabled: HTMLInputElement,
	name:    HTMLElement,
	details: HTMLElement,
	remove:  HTMLButtonElement
};

/** One attached lorebook, in the scenario editor and in the chat's lore dialog */
export function makeLorebookItemView(book: Lorebook, handlers: LorebookItemHandlers) {
	const { root, refs: r } = sprout(template, REFS);

	const enabledEntries = book.entries.filter(e => e.enabled).length;
	const constant = book.entries.filter(e => e.constant).length;
	r.name.textContent = book.name;
	r.details.textContent = [
		`${enabledEntries} of ${book.entries.length} entries enabled`,
		constant ? `${constant} constant` : null,
		book.recursive ? "recursive" : null,
		`#${book.id.slice(0, 8)}`
	].filter(p => p).join(" · ");
	r.enabled.checked = book.enabled;
	r.enabled.addEventListener("change", () => handlers.toggle(r.enabled.checked));
	r.remove.addEventListener("click", handlers.remove);

	return root;
}
