import template from "./persona-item.html";
import { Persona } from "@root/types";
import { placeholder } from "@root/utils";
import { instantiate, pickRefs, PictureSource, setPicture } from "./common";

export type PersonaItemHandlers = {
	edit: () => void,
	delete: () => void
};

/** One row in the personas list */
export function makePersonaItemView(persona: Persona, picture: PictureSource, handlers: PersonaItemHandlers) {
	const root = instantiate(template);
	const r = pickRefs(root, ["picture", "name", "description", "edit", "delete"]);

	root.dataset.id = persona.id;
	(r.picture as HTMLImageElement).src = placeholder(null);
	setPicture(r.picture, picture);
	r.name.textContent = persona.name;
	r.description.textContent = persona.description;
	r.edit.addEventListener("click", handlers.edit);
	r.delete.addEventListener("click", handlers.delete);

	return root;
}
