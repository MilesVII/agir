import template from "./scenario-card.html";
import { ScenarioCard } from "@root/types";
import { neatNumber, placeholder, renderMD } from "@root/utils";
import { mudcrack } from "rampike";
import { instantiate, pickRefs, PictureSource, setPicture } from "./common";

export type ScenarioCardHandlers = {
	play: () => void,
	download: () => void,
	delete: () => void,
	edit: () => void
};

/** One scenario card in the library grid */
export function makeScenarioCardView(item: ScenarioCard, picture: PictureSource, handlers: ScenarioCardHandlers) {
	const root = instantiate(template);
	const r = pickRefs(root, ["icon", "title", "download", "delete", "edit", "play", "author-link", "author", "tokens", "description", "tags"]);

	(r.icon as HTMLImageElement).src = placeholder(null);
	setPicture(r.icon, picture);
	r.title.textContent = item.card.title;

	const author = item.card.author;
	if (author?.url) {
		r["author-link"].textContent = author.name;
		r["author-link"].setAttribute("href", author.url);
		r["author-link"].hidden = false;
	} else {
		r.author.textContent = author?.name ?? "";
		r.author.hidden = false;
	}
	r.tokens.textContent = `${neatNumber(item.chat.tokenCount ?? 0)} tokens`;
	r.tokens.title = `${item.chat.tokenCount ?? "N/A"} tokens`;
	r.description.innerHTML = renderMD(item.card.description ?? "");
	r.tags.append(...item.card.tags
		.map(tag => mudcrack({ tagName: "span", className: "pointer", contents: tag }))
		.toReversed()
	);

	r.icon.addEventListener("click", handlers.play);
	r.title.addEventListener("click", handlers.play);
	r.play.addEventListener("click", handlers.play);
	r.download.addEventListener("click", handlers.download);
	r.delete.addEventListener("click", handlers.delete);
	r.edit.addEventListener("click", handlers.edit);

	return root;
}
