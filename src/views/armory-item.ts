import html from "./armory-item.html";
import { htmlTemplate, sprout } from "rampike";

export type ArmoryItemHandlers = {
	open: () => void,
	delete: () => void
};

const template = htmlTemplate(html);
const REFS = ["name", "open", "delete"] as const;

/** One row in the list of added armories */
export function makeArmoryItemView(name: string, handlers: ArmoryItemHandlers) {
	const { root, refs: r } = sprout(template, REFS);

	r.name.textContent = name;
	r.open.addEventListener("click", handlers.open);
	r.delete.addEventListener("click", handlers.delete);

	return root;
}
