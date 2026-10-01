import template from "./armory-item.html";
import { instantiate, pickRefs } from "./common";

export type ArmoryItemHandlers = {
	open: () => void,
	delete: () => void
};

/** One row in the list of added armories */
export function makeArmoryItemView(name: string, handlers: ArmoryItemHandlers) {
	const root = instantiate(template);
	const r = pickRefs(root, ["name", "open", "delete"]);

	r.name.textContent = name;
	r.open.addEventListener("click", handlers.open);
	r.delete.addEventListener("click", handlers.delete);

	return root;
}
