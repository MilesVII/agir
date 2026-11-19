import html from "./datacat-item.html";
import { neatNumber, placeholder } from "@root/utils";
import { htmlTemplate, mudcrack, sprout } from "rampike";
import { characterPage, type DatacatCharacter } from "@units/library/datacat-api";

const template = htmlTemplate(html);
const REFS = {
	"picture-link": HTMLAnchorElement,
	picture:        HTMLImageElement,
	title:          HTMLAnchorElement,
	stats:          HTMLElement,
	creator:        HTMLElement,
	meta:           HTMLElement,
	description:    HTMLElement,
	tags:           HTMLElement,
	import:         HTMLButtonElement
};

/** A Datacat search result: links to Datacat's page, which credits the creator; `import` gets the import button */
export function makeDatacatItemView(item: DatacatCharacter, onImport: (button: HTMLButtonElement) => void) {
	const { root, refs: r } = sprout(template, REFS);
	const page = item.id ? characterPage({ id: item.id, sourceKind: item.sourceKind }) : null;

	if (page) {
		r["picture-link"].href = page;
		r.title.href = page;
	}
	r.picture.src = placeholder((item.image?.status === "ready" ? item.image.url : null) ?? item.avatarUrl ?? null);
	r.title.textContent = item.name;
	r.stats.textContent = `💬 ${neatNumber(item.stats?.chats ?? 0)}`;
	r.stats.title = `${item.stats?.chats ?? 0} chats, ${item.stats?.messages ?? 0} messages on the source site`;
	r.creator.textContent = item.creator?.name ? `by ${item.creator.name}` : "";

	const meta = [];
	if (item.totalTokens) meta.push(`${neatNumber(item.totalTokens)} tokens`);
	if (item.nsfw) meta.push("nsfw");
	meta.push(item.sourceKind);
	r.meta.textContent = meta.join(" · ");

	r.description.textContent = item.description;
	r.tags.append(...item.tags.map(tag => mudcrack({ tagName: "span", contents: tag })).toReversed());

	if (item.id) {
		r.import.addEventListener("click", () => onImport(r.import));
	} else {
		r.import.disabled = true;
		r.import.title = "Datacat doesn't offer this one for download";
	}

	return root;
}
