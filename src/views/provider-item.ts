import html from "./provider-item.html";
import { htmlTemplate, sprout } from "rampike";

export type ProviderItemHandlers = {
	edit: () => void,
	copy: () => void,
	delete: () => void
};

const template = htmlTemplate(html);
const REFS = ["name", "edit", "copy", "delete"] as const;

/** One row in the LLM providers list */
export function makeProviderItemView(name: string, handlers: ProviderItemHandlers) {
	const { root, refs: r } = sprout(template, REFS);

	r.name.textContent = name;
	r.edit.addEventListener("click", handlers.edit);
	r.copy.addEventListener("click", handlers.copy);
	r.delete.addEventListener("click", handlers.delete);

	return root;
}
