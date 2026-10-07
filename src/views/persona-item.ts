import html from "./persona-item.html";
import { Persona } from "@root/types";
import { placeholder } from "@root/utils";
import { htmlTemplate, sprout } from "rampike";
import { PictureSource, setPicture } from "./common";

export type PersonaItemHandlers = {
	edit: () => void,
	delete: () => void
};

const template = htmlTemplate(html);
const REFS = {
	root:        HTMLDivElement,
	picture:     HTMLImageElement,
	name:        HTMLElement,
	description: HTMLElement,
	edit:        HTMLButtonElement,
	delete:      HTMLButtonElement
};

/** One row in the personas list */
export function makePersonaItemView(persona: Persona, picture: PictureSource, handlers: PersonaItemHandlers) {
	const { refs: r } = sprout(template, REFS);

	r.root.dataset.id = persona.id;
	r.picture.src = placeholder(null);
	setPicture(r.picture, picture);
	r.name.textContent = persona.name;
	r.description.textContent = persona.description;
	r.edit.addEventListener("click", handlers.edit);
	r.delete.addEventListener("click", handlers.delete);

	return r.root;
}
