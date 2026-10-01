import template from "./provider-item.html";
import { instantiate, pickRefs } from "./common";

export type ProviderItemHandlers = {
	edit: () => void,
	copy: () => void,
	delete: () => void
};

/** One row in the LLM providers list */
export function makeProviderItemView(name: string, handlers: ProviderItemHandlers) {
	const root = instantiate(template);
	const r = pickRefs(root, ["name", "edit", "copy", "delete"]);

	r.name.textContent = name;
	r.edit.addEventListener("click", handlers.edit);
	r.copy.addEventListener("click", handlers.copy);
	r.delete.addEventListener("click", handlers.delete);

	return root;
}
